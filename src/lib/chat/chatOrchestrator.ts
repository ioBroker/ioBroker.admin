/**
 * Backend agent loop for the admin chat helper.
 *
 * One `run()` is one user turn: it sends the conversation to the LLM together with the available
 * tool definitions, executes the tool calls the model requests against the in-process MCP server
 * (and a few admin-local tools), feeds the results back, and repeats until the model answers
 * without further tool calls (or a round limit is hit).
 *
 * Read tools run automatically. Write/action tools require **per-action confirmation**: when the
 * model requests one, the loop pauses and returns `status: 'confirm'` with the proposed actions;
 * the frontend asks the user and re-invokes `run()` with the same messages plus an `approvals` map.
 * The LLM never touches ioBroker directly — every action goes through the tool layer.
 */
import type { McpClientManager, OpenAiFunctionTool } from './mcpClientManager';
import { chatCompletion, type AiProvider } from './llmProvider';
import type { OpenAIMessage, OpenAIToolCall } from './anthropicAdapter';
import {
    ADMIN_LOCAL_TOOL_DEFS,
    AUTO_RUN_TOOLS,
    NAVIGATION_TOOL_DEFS,
    executeAdminLocalTool,
    isAdminLocalTool,
    toolKind,
    type ClientAction,
    type ToolKind,
} from './adminLocalTools';
import { renderAssistantKnowledge } from './assistantKnowledge';

/** Permission mode for a turn. `read` exposes only read tools; `act` also exposes write/action tools. */
export type ChatMode = 'read' | 'act';

/** One executed tool call, for the UI to show what the assistant did. */
export interface ChatStep {
    tool: string;
    args: Record<string, unknown>;
    /** Whether the tool reported success. */
    ok: boolean;
    /** Truncated text result, for display only (the full result is fed back to the model). */
    result: string;
}

/** A write/action tool call awaiting the user's confirmation. */
export interface PendingAction {
    /** The tool-call id (echoed back in `approvals`). */
    id: string;
    tool: string;
    args: Record<string, unknown>;
    kind: ToolKind;
}

export interface OrchestratorRunParams {
    provider: AiProvider;
    model: string;
    apiKey: string;
    baseUrl?: string;
    /** Conversation so far in OpenAI format (a system prompt is prepended if none is present). */
    messages: OpenAIMessage[];
    /** UI language, woven into the system prompt. */
    language?: ioBroker.Languages;
    allowSelfSignedCerts?: boolean;
    /** Maximum number of tool-call rounds before forcing a final answer (default 8). */
    maxToolRounds?: number;
    /** `read` (default) = read-only; `act` = expose write/action tools (still confirmed per action). */
    mode?: ChatMode;
    /** Decisions for previously proposed actions, keyed by tool-call id (resume after confirmation). */
    approvals?: Record<string, boolean>;
    /** Tool names the user has granted blanket approval for ("don't ask again") — run without prompting. */
    autoApprove?: string[];
    /** Current admin UI context (e.g. the route hash) so the assistant knows where the user is. */
    uiContext?: { hash?: string };
}

export interface OrchestratorResult {
    /** `done` = final answer ready; `confirm` = waiting for the user to approve/decline actions. */
    status: 'done' | 'confirm';
    /** Final assistant answer (`done`) or the text accompanying the proposed actions (`confirm`). */
    content: string;
    /** Messages produced during this turn (assistant + tool messages), for the frontend to append. */
    newMessages: OpenAIMessage[];
    /** The tool calls executed during this turn, for display. */
    steps: ChatStep[];
    /** Set when `status === 'confirm'`: the write/action tool calls awaiting a decision. */
    pendingActions?: PendingAction[];
    /** Actions the frontend must perform after this turn (install adapter, navigate UI). */
    clientActions?: ClientAction[];
}

const DEFAULT_MAX_TOOL_ROUNDS = 8;
const STEP_RESULT_PREVIEW = 1000;

/** Parse a tool-call's JSON argument string into an object, tolerating malformed input. */
function parseToolArgs(args: string | undefined): Record<string, unknown> {
    if (!args) {
        return {};
    }
    try {
        const parsed: unknown = JSON.parse(args);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.substring(0, max)}…` : text;
}

/**
 * Recover tool calls that a model emitted as TEXT instead of as native `tool_calls`.
 *
 * Some models/endpoints (and Claude when it slips out of structured tool use) write the call in the
 * Anthropic text form, e.g. `<invoke name="install_adapter"><parameter name="adapter">growatt</parameter></invoke>`,
 * optionally wrapped in `<function_calls>…</function_calls>` and/or prefixed with the literal word
 * "call". When that happens the call is never executed and the raw XML leaks into the chat. This
 * parser turns those text blocks into real {@link OpenAIToolCall}s and strips them from the visible
 * content so the normal tool pipeline runs.
 */
export function parseTextToolCalls(content: string): { content: string; toolCalls: OpenAIToolCall[] } {
    if (!content || !content.includes('<invoke')) {
        return { content, toolCalls: [] };
    }
    const toolCalls: OpenAIToolCall[] = [];
    const invokeRe = /<invoke\s+name="([^"]+)"\s*>([\s\S]*?)<\/invoke>/g;
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = invokeRe.exec(content)) !== null) {
        const name = match[1];
        const inner = match[2];
        const args: Record<string, string> = {};
        const paramRe = /<parameter\s+name="([^"]+)"\s*>([\s\S]*?)<\/parameter>/g;
        let param: RegExpExecArray | null;
        while ((param = paramRe.exec(inner)) !== null) {
            args[param[1]] = param[2].trim();
        }
        toolCalls.push({
            id: `text_call_${index++}`,
            type: 'function',
            function: { name, arguments: JSON.stringify(args) },
        });
    }
    if (!toolCalls.length) {
        return { content, toolCalls: [] };
    }
    const cleaned = content
        .replace(/<invoke\s+name="[^"]+"\s*>[\s\S]*?<\/invoke>/g, '')
        .replace(/<\/?function_calls>/g, '')
        .replace(/^[ \t]*call[ \t]*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return { content: cleaned, toolCalls };
}

export class ChatOrchestrator {
    private readonly mcp: McpClientManager;
    private readonly adapter: ioBroker.Adapter;

    constructor(mcp: McpClientManager, adapter: ioBroker.Adapter) {
        this.mcp = mcp;
        this.adapter = adapter;
    }

    /** System prompt describing the assistant's role, tool usage and the current permission mode. */
    private buildSystemPrompt(
        language: ioBroker.Languages,
        mode: ChatMode,
        uiContext?: { hash?: string },
    ): OpenAIMessage {
        const lines = [
            'You are the ioBroker Admin Assistant, an in-app helper inside the ioBroker admin web UI.',
            'You help the user operate their ioBroker installation: explain how to do things in the UI,',
            'recommend which adapter to use for a device or service, and answer questions about the',
            "user's actual system (their states, objects, devices grouped by room/function, installed",
            'adapters, running instances, logs and historical values).',
            '',
            'KEY CAPABILITY: you can navigate the admin UI yourself. When the user asks you to OPEN or GO to',
            'something, call the navigate_admin_ui tool with the hash route — it opens the tab OR the specific',
            'dialog immediately (no confirmation, it only changes the view), e.g.',
            '{"hash":"#tab-hosts/base-settings/system.host.MSI"}. Otherwise (just pointing the user somewhere)',
            'offer a clickable Markdown hash link, e.g. [Base settings of MSI](#tab-hosts/base-settings/system.host.MSI).',
            'NEVER say a dialog can only be opened manually or that deep-linking a dialog is not possible.',
            '',
            'Guidelines:',
            '- Use the available tools to look up real data from THIS ioBroker system instead of guessing.',
            '  E.g. to list devices in a room call list_devices with the room name; to read a value call',
            '  get_states; to find objects call search_objects.',
            '- Base your answer on the tool results. If a tool returns an error or nothing, say so briefly',
            '  and suggest what the user could check.',
            '- Be concise and practical. Use short lists or tables when listing devices or states.',
            '- Object IDs are case-sensitive (e.g. "hue.0.lights.1.on"); show them in `monospace`.',
            '- IMPORTANT — this admin version SUPPORTS deep links that open specific DIALOGS directly,',
            '  not just tabs. It is FALSE to say a dialog "can only be opened with the gear/cog icon" or',
            '  that deep-linking a dialog is "technically not possible" — never say that. Instead always',
            '  offer a clickable Markdown hash link and let the USER click it; do NOT claim you opened or',
            '  navigated anywhere yourself. Examples: [Instances](#tab-instances), [Objects](#tab-objects),',
            '  [hue.0 config](#tab-instances/config/hue.0), [edit this object](#tab-objects/edit/<id>),',
            "  and a host's base-settings dialog, e.g. MSI:",
            '  [Base settings of MSI](#tab-hosts/base-settings/system.host.MSI). The exact dialog routes are',
            '  listed in the knowledge below. Prefer these links over the navigate_admin_ui tool.',
            `- Answer in the user's language. The admin UI language is currently "${language}".`,
        ];
        if (mode === 'act') {
            lines.push(
                '- You may change things using the write/action tools (set_state, create_user_state,',
                '  extend_object, install_adapter, run_command). Every such call is shown to the user for',
                '  explicit confirmation before it runs, so propose the smallest sensible action.',
                '- create_user_state only works in "0_userdata.0." or "javascript.<n>." — never elsewhere.',
                '- extend_object merges common/native into an existing object — use it to start/stop an',
                '  instance (common.enabled), change instance settings (native) or set enum members.',
                '- run_command runs an ioBroker CLI command and streams its output to the user; use it for',
                '  maintenance actions (restart, upload, fix, ...), not to fetch data.',
            );
        } else {
            lines.push(
                '- You currently have READ-ONLY access: you cannot change states, create objects or install',
                '  adapters. When a change is needed, explain the exact steps the user should take in the UI.',
            );
        }
        if (uiContext?.hash) {
            lines.push(
                '',
                `The user is currently in the admin UI at the route \`${uiContext.hash}\`. Take this into ` +
                    "account — don't tell them to open a tab/page they are already on, and refer to where " +
                    'they are when helpful.',
            );
        }
        lines.push('', 'ioBroker how-to knowledge (use this to guide the user precisely):', renderAssistantKnowledge());
        return { role: 'system', content: lines.join('\n') };
    }

    /** Assemble the tool list offered to the model for the given mode. */
    private async buildTools(mode: ChatMode): Promise<OpenAiFunctionTool[]> {
        const mcpTools = await this.mcp.getTools();
        if (mode !== 'act') {
            // Read-only: read tools + navigation (navigation only changes the view, never data).
            return [...mcpTools.filter(tool => toolKind(tool.function.name) === 'read'), ...NAVIGATION_TOOL_DEFS];
        }
        return [...mcpTools, ...ADMIN_LOCAL_TOOL_DEFS, ...NAVIGATION_TOOL_DEFS];
    }

    /**
     * Run one user turn: drive the LLM ↔ tool loop, pausing for confirmation on write/action tools.
     *
     * @param params provider/model/key, the conversation, mode, approvals and limits
     * @returns either the final answer (`done`) or the actions awaiting confirmation (`confirm`)
     */
    async run(params: OrchestratorRunParams): Promise<OrchestratorResult> {
        const language = params.language || 'en';
        const mode: ChatMode = params.mode || 'read';
        const approvals = params.approvals || {};
        // Tools the user granted blanket approval for ("don't ask again") run without prompting.
        const autoApprove = new Set(params.autoApprove || []);
        const tools = await this.buildTools(mode);

        // Work on a copy. Strip any tool-call XML a model previously leaked into assistant TEXT so it
        // is not replayed as an example the model imitates — a single leak otherwise poisons the whole
        // conversation (the leaked `<invoke …>` keeps reappearing until "new chat").
        const messages: OpenAIMessage[] = params.messages.map(message =>
            message.role === 'assistant' &&
            typeof message.content === 'string' &&
            message.content.includes('<invoke')
                ? { ...message, content: parseTextToolCalls(message.content).content }
                : message,
        );
        if (!messages.some(message => message.role === 'system')) {
            messages.unshift(this.buildSystemPrompt(language, mode, params.uiContext));
        }

        const newMessages: OpenAIMessage[] = [];
        const steps: ChatStep[] = [];
        const clientActions: ClientAction[] = [];
        const maxRounds = params.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;

        for (let round = 0; round < maxRounds; round++) {
            const pending = unansweredToolCalls(messages);

            if (pending.length) {
                // A write/action tool call needs a decision unless the user already decided it
                // (approvals) or granted blanket approval for that tool (autoApprove).
                const needsDecision = (tc: OpenAIToolCall): boolean =>
                    toolKind(tc.function.name) !== 'read' &&
                    !AUTO_RUN_TOOLS.has(tc.function.name) &&
                    approvals[tc.id] === undefined &&
                    !autoApprove.has(tc.function.name);

                const undecided = pending.filter(needsDecision);
                if (undecided.length) {
                    // Pause for confirmation — surface only the calls that actually need a decision.
                    const lastText = lastAssistantText(messages);
                    const pendingActions: PendingAction[] = undecided.map(tc => ({
                        id: tc.id,
                        tool: tc.function.name,
                        args: parseToolArgs(tc.function.arguments),
                        kind: toolKind(tc.function.name),
                    }));
                    return { status: 'confirm', content: lastText, newMessages, steps, pendingActions };
                }

                for (const toolCall of pending) {
                    // Auto-approved tools arrive here with no explicit decision and take the
                    // "approved" branch in executeToolCall (an explicit decline still wins).
                    const { message, step, clientAction } = await this.executeToolCall(toolCall, mode, approvals);
                    messages.push(message);
                    newMessages.push(message);
                    steps.push(step);
                    if (clientAction) {
                        clientActions.push(clientAction);
                    }
                }
                continue;
            }

            // No pending tool calls → ask the model what to do next.
            const response = await chatCompletion({
                provider: params.provider,
                model: params.model,
                apiKey: params.apiKey,
                baseUrl: params.baseUrl,
                messages,
                tools,
                allowSelfSignedCerts: params.allowSelfSignedCerts,
            });

            // Some models/endpoints emit tool calls as TEXT (the `<invoke …>` format) instead of as
            // native tool_calls. Recover those so the agent still works (and the raw syntax does not
            // leak into the chat).
            let responseContent = response.content || '';
            let responseToolCalls = response.tool_calls;
            if (!responseToolCalls?.length) {
                const recovered = parseTextToolCalls(responseContent);
                if (recovered.toolCalls.length) {
                    responseToolCalls = recovered.toolCalls;
                    responseContent = recovered.content;
                }
            }

            const assistantMessage: OpenAIMessage = {
                role: 'assistant',
                content: responseContent,
                ...(responseToolCalls?.length ? { tool_calls: responseToolCalls } : {}),
            };
            messages.push(assistantMessage);
            newMessages.push(assistantMessage);

            if (!responseToolCalls?.length) {
                return { status: 'done', content: responseContent, newMessages, steps, clientActions };
            }
            // Loop: the next iteration handles the proposed tool calls (and may pause for confirmation).
        }

        // Round limit reached: force a final, tool-free answer so the user always gets a response.
        const finalResponse = await chatCompletion({
            provider: params.provider,
            model: params.model,
            apiKey: params.apiKey,
            baseUrl: params.baseUrl,
            messages,
            allowSelfSignedCerts: params.allowSelfSignedCerts,
        });
        const finalContent =
            finalResponse.content ||
            'I reached the maximum number of tool calls for this question. Please refine your request.';
        newMessages.push({ role: 'assistant', content: finalContent });
        return { status: 'done', content: finalContent, newMessages, steps, clientActions };
    }

    /** Execute one tool call (read directly, write/action only when approved) → `tool` message + step. */
    private async executeToolCall(
        toolCall: OpenAIToolCall,
        mode: ChatMode,
        approvals: Record<string, boolean>,
    ): Promise<{ message: OpenAIMessage; step: ChatStep; clientAction?: ClientAction }> {
        const name = toolCall.function.name;
        const args = parseToolArgs(toolCall.function.arguments);
        const kind = toolKind(name);
        let text: string;
        let ok: boolean;
        let clientAction: ClientAction | undefined;

        if (kind === 'read') {
            ({ text, ok } = await this.callMcp(name, args));
        } else if (AUTO_RUN_TOOLS.has(name)) {
            // Safe, view-only tools (navigation) run in any mode without confirmation.
            const result = await executeAdminLocalTool(this.adapter, name, args);
            text = result.text;
            ok = !result.isError;
            clientAction = result.clientAction;
        } else if (mode !== 'act') {
            // Defensive: write/action tools are not offered in read mode.
            text = JSON.stringify({ ok: false, error: 'This action is not allowed in read-only mode.' });
            ok = false;
        } else if (approvals[toolCall.id] === false) {
            text = JSON.stringify({ ok: false, error: 'The user declined this action.' });
            ok = false;
        } else {
            // Approved write/action.
            if (isAdminLocalTool(name)) {
                const result = await executeAdminLocalTool(this.adapter, name, args);
                text = result.text;
                ok = !result.isError;
                clientAction = result.clientAction;
            } else {
                ({ text, ok } = await this.callMcp(name, args));
            }
        }

        return {
            message: { role: 'tool', tool_call_id: toolCall.id, content: text },
            step: { tool: name, args, ok, result: truncate(text, STEP_RESULT_PREVIEW) },
            ...(clientAction ? { clientAction } : {}),
        };
    }

    /** Call an MCP tool, turning a thrown error into an error result so the loop can continue. */
    private async callMcp(name: string, args: Record<string, unknown>): Promise<{ text: string; ok: boolean }> {
        try {
            const result = await this.mcp.callTool(name, args);
            return { text: result.text, ok: !result.isError };
        } catch (e) {
            return { text: JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), ok: false };
        }
    }
}

/** The tool calls of the last assistant message that don't yet have a matching `tool` result. */
function unansweredToolCalls(messages: OpenAIMessage[]): OpenAIToolCall[] {
    let lastAssistant: OpenAIMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
            lastAssistant = messages[i];
            break;
        }
    }
    if (!lastAssistant?.tool_calls?.length) {
        return [];
    }
    const answered = new Set(
        messages.filter(m => m.role === 'tool' && m.tool_call_id).map(m => m.tool_call_id as string),
    );
    return lastAssistant.tool_calls.filter(tc => !answered.has(tc.id));
}

/** Text content of the last assistant message (the explanation shown above confirmation cards). */
function lastAssistantText(messages: OpenAIMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
            return typeof messages[i].content === 'string' ? (messages[i].content as string) : '';
        }
    }
    return '';
}
