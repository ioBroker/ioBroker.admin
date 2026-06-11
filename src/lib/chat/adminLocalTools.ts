/**
 * Admin-local chat tools and the tool classification used by the orchestrator's confirmation gate.
 *
 * Besides the (read-only) MCP tools, the chat helper offers a few admin-specific tools that either
 * need tighter control than the generic MCP tools (a namespace-guarded state creation) or are
 * inherently performed by the frontend (installing an adapter, navigating the UI). All of these are
 * "write"/"action" tools and therefore go through the per-action confirmation flow.
 */
import type { OpenAiFunctionTool } from './mcpClientManager';

/** How a tool is treated by the confirmation gate. */
export type ToolKind = 'read' | 'write' | 'action';

/** MCP value-writing tools (need confirmation, executed via the MCP layer). */
export const MCP_WRITE_TOOLS = new Set(['set_state', 'set_states']);
/** Admin-local tools executed in the backend (need confirmation). */
export const ADMIN_WRITE_TOOLS = new Set(['create_user_state', 'extend_object']);
/** Admin-local tools performed by the frontend (need confirmation). */
export const CLIENT_ACTION_TOOLS = new Set(['install_adapter', 'navigate_admin_ui', 'run_command']);

/** True if the tool is implemented here (admin-local) rather than by the MCP server. */
export function isAdminLocalTool(name: string): boolean {
    return ADMIN_WRITE_TOOLS.has(name) || CLIENT_ACTION_TOOLS.has(name);
}

/** Classify a tool by name to decide whether it needs confirmation and where it runs. */
export function toolKind(name: string): ToolKind {
    if (CLIENT_ACTION_TOOLS.has(name)) {
        return 'action';
    }
    if (MCP_WRITE_TOOLS.has(name) || ADMIN_WRITE_TOOLS.has(name)) {
        return 'write';
    }
    return 'read';
}

/** OpenAI function-tool definitions for the admin-local tools (added in "act" mode). */
export const ADMIN_LOCAL_TOOL_DEFS: OpenAiFunctionTool[] = [
    {
        type: 'function',
        function: {
            name: 'create_user_state',
            description:
                'Create a new state (datapoint), restricted to the user namespaces "0_userdata.0." or ' +
                '"javascript.<n>." Fails if the object already exists. Use this for user-defined helper ' +
                'states; never create states in adapter namespaces.',
            parameters: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Full state ID, e.g. "0_userdata.0.myState" or "javascript.0.myVar"',
                    },
                    name: { type: 'string', description: 'Display name (defaults to the last ID segment)' },
                    type: {
                        type: 'string',
                        enum: ['boolean', 'number', 'string', 'mixed'],
                        description: 'Value type (default mixed)',
                    },
                    role: { type: 'string', description: 'Role, e.g. state, switch.light, value.temperature' },
                    unit: { type: 'string' },
                    read: { type: 'boolean' },
                    write: { type: 'boolean' },
                    def: { description: 'Optional initial value' },
                },
                required: ['id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'extend_object',
            description:
                'Update an EXISTING ioBroker object by merging the given `common` and/or `native` into ' +
                'it. Use it to start/stop an instance (`common.enabled` true/false on ' +
                '`system.adapter.<adapter>.<n>`), change an instance setting (its `native`), or set the ' +
                'members of a room/function (`common.members` array on `enum.rooms.*` / `enum.functions.*`). ' +
                'Fails if the object does not exist — use create_user_state to create a new state.',
            parameters: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Object ID, e.g. "system.adapter.hm-rpc.0" or "enum.rooms.living_room"',
                    },
                    common: {
                        type: 'object',
                        description: 'Partial `common` to merge, e.g. {"enabled": true} or {"members": ["hue.0.l1"]}',
                    },
                    native: { type: 'object', description: 'Partial `native` to merge' },
                },
                required: ['id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'install_adapter',
            description:
                'Propose installing an ioBroker adapter from the repository. The installation is handed ' +
                'to the admin UI and runs there after the user confirms. Use the bare adapter name ' +
                'without the "iobroker." prefix, e.g. "hue".',
            parameters: {
                type: 'object',
                properties: {
                    adapter: { type: 'string', description: 'Adapter name, e.g. "hue" or "zigbee"' },
                },
                required: ['adapter'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_command',
            description:
                'Run an ioBroker CLI command on the current host (the leading "iobroker" is implied). ' +
                'Examples: "restart hm-rpc.0", "upload admin", "version", "list instances", "fix". The ' +
                'live output is streamed to the user. Use for maintenance/operations — for plain data ' +
                'prefer the read tools (list_instances, get_states, ...).',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'The iobroker subcommand without the leading "iobroker", e.g. "restart hm-rpc.0"',
                    },
                },
                required: ['command'],
            },
        },
    },
];

/**
 * Navigation tool — offered in BOTH read and act mode and AUTO-RUN (no confirmation), because it only
 * changes the current view (no data change). Lets the assistant operate the URL hash itself.
 */
export const NAVIGATION_TOOL_DEFS: OpenAiFunctionTool[] = [
    {
        type: 'function',
        function: {
            name: 'navigate_admin_ui',
            description:
                'Navigate the admin UI directly by setting the URL hash — opens a tab OR a specific dialog ' +
                'immediately (no user click), without confirmation (it only changes the view). Use the hash ' +
                'routes from the deep-link knowledge, e.g. "#tab-instances", "#tab-instances/config/hue.0", ' +
                '"#tab-objects/edit/<id>", "#tab-hosts/base-settings/system.host.MSI". Only navigate when the ' +
                'user asks to open/go somewhere; otherwise just answer or offer a link.',
            parameters: {
                type: 'object',
                properties: {
                    hash: {
                        type: 'string',
                        description: 'Target route/hash, e.g. "#tab-hosts/base-settings/system.host.MSI"',
                    },
                },
                required: ['hash'],
            },
        },
    },
];

/** Tools that run without confirmation (safe, view-only). */
export const AUTO_RUN_TOOLS = new Set(['navigate_admin_ui']);

/** An action the frontend must perform after the chat turn (the backend cannot do it itself). */
export type ClientAction =
    | { type: 'install'; adapter: string }
    | { type: 'navigate'; hash: string }
    | { type: 'command'; command: string };

/** Result of executing an admin-local tool. */
export interface AdminLocalResult {
    /** JSON text fed back to the model as the tool result. */
    text: string;
    isError: boolean;
    /** Set for client-action tools: what the frontend must do. */
    clientAction?: ClientAction;
}

/** A state may only be created in these user-owned namespaces. */
const USER_NAMESPACE = /^(0_userdata\.0|javascript\.\d+)\./;
/** Valid bare adapter name. */
const ADAPTER_NAME = /^[a-z0-9][a-z0-9._-]*$/;

const ok = (data: unknown, clientAction?: ClientAction): AdminLocalResult => ({
    text: JSON.stringify({ ok: true, data }),
    isError: false,
    ...(clientAction ? { clientAction } : {}),
});
const fail = (error: string): AdminLocalResult => ({ text: JSON.stringify({ ok: false, error }), isError: true });

/** Dispatch and execute an admin-local tool. Never throws — errors are returned as tool results. */
export async function executeAdminLocalTool(
    adapter: ioBroker.Adapter,
    name: string,
    args: Record<string, unknown>,
): Promise<AdminLocalResult> {
    try {
        if (name === 'create_user_state') {
            return await createUserState(adapter, args);
        }
        if (name === 'extend_object') {
            return await extendObject(adapter, args);
        }
        if (name === 'install_adapter') {
            return installAdapter(args);
        }
        if (name === 'navigate_admin_ui') {
            return navigateAdminUi(args);
        }
        if (name === 'run_command') {
            return runCommand(args);
        }
        return fail(`Unknown admin-local tool "${name}"`);
    } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
    }
}

/** Create a state, but only inside the user-owned namespaces. */
async function createUserState(adapter: ioBroker.Adapter, args: Record<string, unknown>): Promise<AdminLocalResult> {
    const id = String(args.id || '').trim();
    if (!id) {
        return fail('id is required');
    }
    if (!USER_NAMESPACE.test(id)) {
        return fail('States may only be created under "0_userdata.0." or "javascript.<n>." (user namespaces).');
    }
    const existing = await adapter.getForeignObjectAsync(id);
    if (existing) {
        return fail(`Object "${id}" already exists`);
    }
    const type = (args.type as ioBroker.CommonType) || 'mixed';
    const common: ioBroker.StateCommon = {
        name: (args.name as string) || id.split('.').pop() || id,
        type,
        role: (args.role as string) || 'state',
        read: args.read !== false,
        write: args.write !== false,
    };
    if (args.unit !== undefined) {
        common.unit = String(args.unit);
    }
    await adapter.setForeignObjectAsync(id, { type: 'state', common, native: {} });
    if (args.def !== undefined) {
        await adapter.setForeignStateAsync(id, args.def as ioBroker.StateValue, true);
    }
    return ok({ id, created: true });
}

/** Merge `common`/`native` into an existing object (e.g. toggle common.enabled, edit native/members). */
async function extendObject(adapter: ioBroker.Adapter, args: Record<string, unknown>): Promise<AdminLocalResult> {
    const id = String(args.id || '').trim();
    if (!id) {
        return fail('id is required');
    }
    const existing = await adapter.getForeignObjectAsync(id);
    if (!existing) {
        return fail(`Object "${id}" does not exist — use create_user_state to create a new state.`);
    }
    const common = args.common;
    const native = args.native;
    if (common && typeof common === 'object' && !Array.isArray(common)) {
        existing.common = { ...existing.common, ...(common as Record<string, unknown>) } as ioBroker.ObjectCommon;
    }
    if (native && typeof native === 'object' && !Array.isArray(native)) {
        existing.native = { ...existing.native, ...(native as Record<string, unknown>) };
    }
    await adapter.setForeignObjectAsync(id, existing);
    return ok({ id, updated: true });
}

/** Validate the adapter name and hand the installation to the frontend. */
function installAdapter(args: Record<string, unknown>): AdminLocalResult {
    let adapterName = String(args.adapter || '')
        .trim()
        .toLowerCase();
    if (adapterName.startsWith('iobroker.')) {
        adapterName = adapterName.substring('iobroker.'.length);
    }
    if (!adapterName || !ADAPTER_NAME.test(adapterName)) {
        return fail('A valid adapter name is required, e.g. "hue"');
    }
    return ok(
        { adapter: adapterName, handedToUi: true, note: 'The admin UI will run the installation.' },
        { type: 'install', adapter: adapterName },
    );
}

/** Validate the navigation target (a hash route) and hand it to the frontend, which sets the URL. */
function navigateAdminUi(args: Record<string, unknown>): AdminLocalResult {
    const raw = String(args.hash || args.tab || args.route || '').trim();
    if (!raw) {
        return fail('hash is required, e.g. "#tab-hosts/base-settings/system.host.MSI"');
    }
    // Be lenient about what the model sends: a full URL ("http://host:3000/#tab-..."), a leading-slash
    // hash ("/#tab-...") or a bare route ("tab-..."). Extract everything from the first "#".
    const hashAt = raw.indexOf('#');
    let hash = hashAt >= 0 ? raw.substring(hashAt) : `#${raw.replace(/^\/+/, '')}`;
    if (!hash.startsWith('#tab-')) {
        return fail('hash must be an admin route starting with "#tab-", e.g. "#tab-objects/edit/<id>"');
    }
    return ok({ hash, navigated: true }, { type: 'navigate', hash });
}

/** Validate an ioBroker CLI command and hand it to the frontend, which streams its live output. */
function runCommand(args: Record<string, unknown>): AdminLocalResult {
    const command = String(args.command || '').trim();
    if (!command) {
        return fail('command is required');
    }
    return ok(
        { command, handedToUi: true, note: 'The command runs in the admin UI; its live output is shown to the user.' },
        { type: 'command', command },
    );
}
