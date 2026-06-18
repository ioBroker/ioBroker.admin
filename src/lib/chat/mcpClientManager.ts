/**
 * Owns the in-process ioBroker/mcp-server + MCP client used by the admin chat helper.
 *
 * The MCP server is embedded directly in the admin process (no HTTP) and reached over an in-memory
 * transport, so the chat backend can discover and call ioBroker tools without a separate mcp
 * instance, port or authentication. The connection is established lazily on first use and shared
 * across all chat requests.
 *
 * This is the "A1" integration: the tools are served by iobroker/mcp-server, while the LLM orchestration
 * that drives these tools is added on top in the (still to come) chat orchestrator.
 */
import { createInProcessMcp, type InProcessMcp, type InProcessToolInfo } from '@iobroker/mcp-server';

/** OpenAI-style function tool definition (what LLM chat-completion APIs expect in `tools`). */
export interface OpenAiFunctionTool {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters: Record<string, unknown>;
    };
}

/** Configuration for {@link McpClientManager}. */
export interface McpClientManagerOptions {
    /** ioBroker user whose ACLs all tool calls run under. Defaults to `system.user.admin`. */
    defaultUser?: `system.user.${string}`;
    /** Language for localized tool output (rooms/devices/functions). */
    language?: ioBroker.Languages;
    /** Allow the state-writing tools `set_state`/`set_states`. Default false (read-only). */
    allowSetState?: boolean;
    /** Allow the object/file-changing tools (`create_state`, `set_object`, ...). Default false. */
    allowObjectChange?: boolean;
}

export class McpClientManager {
    private readonly adapter: ioBroker.Adapter;
    private readonly options: McpClientManagerOptions;
    private mcp: InProcessMcp | null = null;
    /** In-flight initialization, so concurrent first callers share a single connect. */
    private initPromise: Promise<InProcessMcp> | null = null;

    constructor(adapter: ioBroker.Adapter, options: McpClientManagerOptions = {}) {
        this.adapter = adapter;
        this.options = options;
    }

    /** Establish (once) the in-process MCP connection. Resets on failure so a later call can retry. */
    private ensure(): Promise<InProcessMcp> {
        if (this.mcp) {
            return Promise.resolve(this.mcp);
        }
        if (!(this.initPromise instanceof Promise)) {
            this.initPromise = createInProcessMcp({
                adapter: this.adapter,
                defaultUser: this.options.defaultUser || 'system.user.admin',
                language: this.options.language,
                allowSetState: this.options.allowSetState ?? false,
                allowObjectChange: this.options.allowObjectChange ?? false,
                clientName: 'ioBroker.admin chat helper',
                clientVersion: '1.0.0',
            })
                .then(mcp => {
                    this.mcp = mcp;
                    return mcp;
                })
                .catch(error => {
                    // Allow a later call to retry instead of caching the rejection forever.
                    this.initPromise = null;
                    throw error;
                });
        }
        return this.initPromise;
    }

    /** List the available MCP tools converted to OpenAI function-tool definitions for the LLM. */
    async getTools(): Promise<OpenAiFunctionTool[]> {
        const mcp = await this.ensure();
        const tools = await mcp.listTools();
        return tools.map((tool: InProcessToolInfo) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema || { type: 'object', properties: {} },
            },
        }));
    }

    /** Call a single MCP tool by name; returns its text result (already JSON-encoded by the server). */
    async callTool(name: string, args?: Record<string, unknown>): Promise<{ text: string; isError: boolean }> {
        const mcp = await this.ensure();
        return mcp.callTool(name, args);
    }

    /** Tear down the in-process MCP connection (call from the adapter's unload). */
    async close(): Promise<void> {
        const mcp = this.mcp;
        this.mcp = null;
        this.initPromise = null;
        if (mcp) {
            await mcp.close();
        }
    }
}
