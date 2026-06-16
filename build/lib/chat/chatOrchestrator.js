"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatOrchestrator = void 0;
exports.parseTextToolCalls = parseTextToolCalls;
const llmProvider_1 = require("./llmProvider");
const adminLocalTools_1 = require("./adminLocalTools");
const assistantKnowledge_1 = require("./assistantKnowledge");
const DEFAULT_MAX_TOOL_ROUNDS = 8;
const STEP_RESULT_PREVIEW = 1000;
/** Parse a tool-call's JSON argument string into an object, tolerating malformed input. */
function parseToolArgs(args) {
    if (!args) {
        return {};
    }
    try {
        const parsed = JSON.parse(args);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : {};
    }
    catch {
        return {};
    }
}
function truncate(text, max) {
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
function parseTextToolCalls(content) {
    if (!content || !content.includes('<invoke')) {
        return { content, toolCalls: [] };
    }
    const toolCalls = [];
    const invokeRe = /<invoke\s+name="([^"]+)"\s*>([\s\S]*?)<\/invoke>/g;
    let match;
    let index = 0;
    while ((match = invokeRe.exec(content)) !== null) {
        const name = match[1];
        const inner = match[2];
        const args = {};
        const paramRe = /<parameter\s+name="([^"]+)"\s*>([\s\S]*?)<\/parameter>/g;
        let param;
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
class ChatOrchestrator {
    mcp;
    adapter;
    constructor(mcp, adapter) {
        this.mcp = mcp;
        this.adapter = adapter;
    }
    /** System prompt describing the assistant's role, tool usage and the current permission mode. */
    buildSystemPrompt(language, mode, uiContext) {
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
            lines.push('- You may change things using the write/action tools (set_state, create_user_state,', '  extend_object, assign_to_enums, install_adapter, run_command, run_node_script). Every such', '  call is shown to the user for explicit confirmation before it runs, so propose the smallest', '  sensible action.', '- create_user_state only works in "0_userdata.0." or "javascript.<n>." — never elsewhere.', '- extend_object merges common/native into an existing object — use it to start/stop an', '  instance (common.enabled), change instance settings (native) or set enum members.', '- assign_to_enums adds objects to room/function enums (add-only) — use it to sort devices.', '- run_command runs an ioBroker CLI command and streams its output to the user; use it for', '  maintenance actions (restart, upload, fix, ...), not to fetch data.', '- run_node_script executes a short Node.js script on the host to CHECK things (network, files,', '  environment). Prefer read-only checks, keep it short, and put results in console.log. Never', '  use it for destructive operations.', '- run_javascript runs a one-off JS/TS script INSIDE the javascript adapter (full ioBroker API:', '  on/getState/setState/schedule/sendTo). Use it to test automation logic or do an API-based', '  check/action; it is not saved. Use run_node_script instead for plain OS checks (no ioBroker API).');
        }
        else {
            lines.push('- You currently have READ-ONLY access: you cannot change states, create objects or install', '  adapters. When a change is needed, explain the exact steps the user should take in the UI.');
        }
        if (uiContext?.hash) {
            lines.push('', `The user is currently in the admin UI at the route \`${uiContext.hash}\`. Take this into ` +
                "account — don't tell them to open a tab/page they are already on, and refer to where " +
                'they are when helpful.');
        }
        lines.push('', 'ioBroker how-to knowledge (use this to guide the user precisely):', (0, assistantKnowledge_1.renderAssistantKnowledge)());
        return { role: 'system', content: lines.join('\n') };
    }
    /** Assemble the tool list offered to the model for the given mode. */
    async buildTools(mode) {
        const mcpTools = await this.mcp.getTools();
        if (mode !== 'act') {
            // Read-only: read tools + navigation (navigation only changes the view, never data).
            return [...mcpTools.filter(tool => (0, adminLocalTools_1.toolKind)(tool.function.name) === 'read'), ...adminLocalTools_1.NAVIGATION_TOOL_DEFS];
        }
        return [...mcpTools, ...adminLocalTools_1.ADMIN_LOCAL_TOOL_DEFS, ...adminLocalTools_1.NAVIGATION_TOOL_DEFS];
    }
    /**
     * Run one user turn: drive the LLM ↔ tool loop, pausing for confirmation on write/action tools.
     *
     * @param params provider/model/key, the conversation, mode, approvals and limits
     * @returns either the final answer (`done`) or the actions awaiting confirmation (`confirm`)
     */
    async run(params) {
        const language = params.language || 'en';
        const mode = params.mode || 'read';
        const approvals = params.approvals || {};
        // Tools the user granted blanket approval for ("don't ask again") run without prompting.
        const autoApprove = new Set(params.autoApprove || []);
        const tools = await this.buildTools(mode);
        // Work on a copy. Strip any tool-call XML a model previously leaked into assistant TEXT so it
        // is not replayed as an example the model imitates — a single leak otherwise poisons the whole
        // conversation (the leaked `<invoke …>` keeps reappearing until "new chat").
        const messages = params.messages.map(message => message.role === 'assistant' && typeof message.content === 'string' && message.content.includes('<invoke')
            ? { ...message, content: parseTextToolCalls(message.content).content }
            : message);
        if (!messages.some(message => message.role === 'system')) {
            messages.unshift(this.buildSystemPrompt(language, mode, params.uiContext));
        }
        const newMessages = [];
        const steps = [];
        const clientActions = [];
        const maxRounds = params.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;
        for (let round = 0; round < maxRounds; round++) {
            const pending = unansweredToolCalls(messages);
            if (pending.length) {
                // A write/action tool call needs a decision unless the user already decided it
                // (approvals) or granted blanket approval for that tool (autoApprove).
                const needsDecision = (tc) => (0, adminLocalTools_1.toolKind)(tc.function.name) !== 'read' &&
                    !adminLocalTools_1.AUTO_RUN_TOOLS.has(tc.function.name) &&
                    approvals[tc.id] === undefined &&
                    // High-risk tools (arbitrary code) always ask, even with a blanket "don't ask again".
                    (!autoApprove.has(tc.function.name) || adminLocalTools_1.ALWAYS_CONFIRM_TOOLS.has(tc.function.name));
                const undecided = pending.filter(needsDecision);
                if (undecided.length) {
                    // Pause for confirmation — surface only the calls that actually need a decision.
                    const lastText = lastAssistantText(messages);
                    const pendingActions = undecided.map(tc => ({
                        id: tc.id,
                        tool: tc.function.name,
                        args: parseToolArgs(tc.function.arguments),
                        kind: (0, adminLocalTools_1.toolKind)(tc.function.name),
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
            const response = await (0, llmProvider_1.chatCompletion)({
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
            const assistantMessage = {
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
        const finalResponse = await (0, llmProvider_1.chatCompletion)({
            provider: params.provider,
            model: params.model,
            apiKey: params.apiKey,
            baseUrl: params.baseUrl,
            messages,
            allowSelfSignedCerts: params.allowSelfSignedCerts,
        });
        const finalContent = finalResponse.content ||
            'I reached the maximum number of tool calls for this question. Please refine your request.';
        newMessages.push({ role: 'assistant', content: finalContent });
        return { status: 'done', content: finalContent, newMessages, steps, clientActions };
    }
    /** Execute one tool call (read directly, write/action only when approved) → `tool` message + step. */
    async executeToolCall(toolCall, mode, approvals) {
        const name = toolCall.function.name;
        const args = parseToolArgs(toolCall.function.arguments);
        const kind = (0, adminLocalTools_1.toolKind)(name);
        let text;
        let ok;
        let clientAction;
        if (kind === 'read') {
            ({ text, ok } = await this.callMcp(name, args));
        }
        else if (adminLocalTools_1.AUTO_RUN_TOOLS.has(name)) {
            // Safe, view-only tools (navigation) run in any mode without confirmation.
            const result = await (0, adminLocalTools_1.executeAdminLocalTool)(this.adapter, name, args);
            text = result.text;
            ok = !result.isError;
            clientAction = result.clientAction;
        }
        else if (mode !== 'act') {
            // Defensive: write/action tools are not offered in read mode.
            text = JSON.stringify({ ok: false, error: 'This action is not allowed in read-only mode.' });
            ok = false;
        }
        else if (approvals[toolCall.id] === false) {
            text = JSON.stringify({ ok: false, error: 'The user declined this action.' });
            ok = false;
        }
        else {
            // Approved write/action.
            if ((0, adminLocalTools_1.isAdminLocalTool)(name)) {
                const result = await (0, adminLocalTools_1.executeAdminLocalTool)(this.adapter, name, args);
                text = result.text;
                ok = !result.isError;
                clientAction = result.clientAction;
            }
            else {
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
    async callMcp(name, args) {
        try {
            const result = await this.mcp.callTool(name, args);
            return { text: result.text, ok: !result.isError };
        }
        catch (e) {
            return {
                text: JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
                ok: false,
            };
        }
    }
}
exports.ChatOrchestrator = ChatOrchestrator;
/** The tool calls of the last assistant message that don't yet have a matching `tool` result. */
function unansweredToolCalls(messages) {
    let lastAssistant;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
            lastAssistant = messages[i];
            break;
        }
    }
    if (!lastAssistant?.tool_calls?.length) {
        return [];
    }
    const answered = new Set(messages.filter(m => m.role === 'tool' && m.tool_call_id).map(m => m.tool_call_id));
    return lastAssistant.tool_calls.filter(tc => !answered.has(tc.id));
}
/** Text content of the last assistant message (the explanation shown above confirmation cards). */
function lastAssistantText(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
            return typeof messages[i].content === 'string' ? messages[i].content : '';
        }
    }
    return '';
}
//# sourceMappingURL=chatOrchestrator.js.map