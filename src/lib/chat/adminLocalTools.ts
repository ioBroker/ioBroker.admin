/**
 * Admin-local chat tools and the tool classification used by the orchestrator's confirmation gate.
 *
 * Besides the (read-only) MCP tools, the chat helper offers a few admin-specific tools that either
 * need tighter control than the generic MCP tools (a namespace-guarded state creation) or are
 * inherently performed by the frontend (installing an adapter, navigating the UI). All of these are
 * "write"/"action" tools and therefore go through the per-action confirmation flow.
 */
import { execFile, type ExecFileException } from 'node:child_process';
import * as semver from 'semver';
import type { OpenAiFunctionTool } from './mcpClientManager';

/** How a tool is treated by the confirmation gate. */
export type ToolKind = 'read' | 'write' | 'action';

/** MCP value-writing tools (need confirmation, executed via the MCP layer). */
export const MCP_WRITE_TOOLS = new Set(['set_state', 'set_states']);
/** Admin-local tools executed in the backend (need confirmation). */
export const ADMIN_WRITE_TOOLS = new Set([
    'create_user_state',
    'extend_object',
    'assign_to_enums',
    'run_node_script',
    'run_javascript',
]);
/** Admin-local tools performed by the frontend (need confirmation). */
export const CLIENT_ACTION_TOOLS = new Set(['install_adapter', 'navigate_admin_ui', 'run_command']);
/**
 * Tools that must ALWAYS be confirmed for EACH call — a blanket "don't ask again" approval is ignored
 * for them. They run arbitrary code, so the user must review every individual script.
 */
export const ALWAYS_CONFIRM_TOOLS = new Set(['run_node_script', 'run_javascript']);

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
            name: 'assign_to_enums',
            description:
                'Categorize objects by ADDING them to room and/or function enums (`enum.rooms.*` / ' +
                '`enum.functions.*`). Add-only: existing members are kept. A room/function may be given as a ' +
                'full enum id ("enum.rooms.bath") or a plain name ("Badezimmer", "Light") — an existing enum ' +
                'is matched by name/id, otherwise a new enum is created. Use this to sort devices into rooms/' +
                'functions inferred from their names (one entry per object, batch many at once).',
            parameters: {
                type: 'object',
                properties: {
                    assignments: {
                        type: 'array',
                        description: 'One entry per object to categorize.',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description:
                                        'Full object ID of the device/channel/state, e.g. "zigbee.0.00158d0002e2e668"',
                                },
                                rooms: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Room enum ids or names to add this object to, e.g. ["Badezimmer"]',
                                },
                                functions: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description:
                                        'Function enum ids or names, e.g. ["Light"] or ["enum.functions.motion"]',
                                },
                            },
                            required: ['id'],
                        },
                    },
                },
                required: ['assignments'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_node_script',
            description:
                'Execute a short Node.js script on the ioBroker HOST (the OS) to CHECK/diagnose something — ' +
                'e.g. test a TCP/HTTP connection, read a file, inspect the environment, do a quick ' +
                'computation. The script runs in a SEPARATE Node process with a timeout; its stdout, stderr ' +
                'and exit code are returned — print results with console.log. The ioBroker adapter API is ' +
                'NOT available here (use the other tools for states/objects). Every run is shown to the user ' +
                'for explicit confirmation. Keep scripts short and prefer READ-ONLY checks; never run ' +
                'destructive or irreversible operations.',
            parameters: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Node.js/JavaScript source to execute. Use console.log to output the result.',
                    },
                    timeout: { type: 'number', description: 'Max runtime in ms (default 10000, max 60000)' },
                },
                required: ['code'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_javascript',
            description:
                'Run a one-off JavaScript or TypeScript script INSIDE the javascript adapter, with the full ' +
                'ioBroker scripting API available (on, getState, setState, schedule, sendTo, …) — unlike ' +
                'run_node_script (plain Node, no ioBroker API). Returns { ok, error, output, logs }. The ' +
                'script runs ONCE and is NOT saved (to create a persistent script, guide the user to the ' +
                'Scripts tab #tab-javascript). Requires the "javascript" adapter installed and running. ' +
                'Every run is confirmed by the user (the code is shown). Prefer read-only checks; for a ' +
                'change propose the smallest action.',
            parameters: {
                type: 'object',
                properties: {
                    source: { type: 'string', description: 'The script source code.' },
                    language: {
                        type: 'string',
                        enum: ['js', 'ts'],
                        description: 'js = JavaScript (default), ts = TypeScript',
                    },
                    timeout: { type: 'number', description: 'Max runtime in ms (default 10000, max 60000)' },
                    instance: {
                        type: 'string',
                        description: 'javascript instance, e.g. "javascript.0" (default: first running instance)',
                    },
                },
                required: ['source'],
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

/** Coerce an unknown tool argument to a string (never the "[object Object]" default of an object). */
function argStr(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    return typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

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
        if (name === 'assign_to_enums') {
            return await assignToEnums(adapter, args);
        }
        if (name === 'run_node_script') {
            return await runNodeScript(args);
        }
        if (name === 'run_javascript') {
            return await runJavaScript(adapter, args);
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
    const id = argStr(args.id).trim();
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
        common.unit = argStr(args.unit);
    }
    await adapter.setForeignObjectAsync(id, { type: 'state', common, native: {} });
    if (args.def !== undefined) {
        await adapter.setForeignStateAsync(id, args.def as ioBroker.StateValue, true);
    }
    return ok({ id, created: true });
}

/** Merge `common`/`native` into an existing object (e.g. toggle common.enabled, edit native/members). */
async function extendObject(adapter: ioBroker.Adapter, args: Record<string, unknown>): Promise<AdminLocalResult> {
    const id = argStr(args.id).trim();
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

/** Lowercase + transliterate a display name to a safe ioBroker enum id segment. */
function enumIdSegment(name: string): string {
    const seg = name
        .trim()
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return seg || 'enum';
}

/** Comparable names of an enum (a plain string or a translated {en,de,…} object). */
function enumNames(common: ioBroker.EnumCommon | undefined): string[] {
    const name = common?.name;
    if (!name) {
        return [];
    }
    return typeof name === 'string' ? [name] : Object.values(name).filter((n): n is string => typeof n === 'string');
}

/**
 * Add objects to room/function enums (ADD-ONLY — existing members are kept). Rooms/functions may be
 * given as enum ids or display names; an existing enum is matched by id-suffix or name, otherwise a new
 * one is created. Lets the assistant sort many devices into rooms/functions in a single call.
 */
async function assignToEnums(adapter: ioBroker.Adapter, args: Record<string, unknown>): Promise<AdminLocalResult> {
    const assignments = Array.isArray(args.assignments) ? args.assignments : [];
    if (!assignments.length) {
        return fail('assignments is required: [{ id, rooms?: string[], functions?: string[] }]');
    }

    // Load existing enums once to resolve names → ids and to read current members.
    const enumObjs = await adapter.getForeignObjectsAsync('enum.*', 'enum');
    const working: Record<string, ioBroker.EnumObject> = {};

    /** Resolve a room/function reference to an enum id (creating a working object if it is new). */
    const resolveEnum = (category: 'rooms' | 'functions', ref: string): string => {
        const prefix = `enum.${category}.`;
        let id: string;
        if (ref.startsWith('enum.')) {
            id = ref;
        } else {
            const norm = ref.trim().toLowerCase();
            const seg = enumIdSegment(ref);
            const match = Object.keys(enumObjs).find(eid => {
                if (!eid.startsWith(prefix)) {
                    return false;
                }
                const suffix = eid.substring(prefix.length).toLowerCase();
                return (
                    suffix === norm ||
                    suffix === seg ||
                    enumNames(enumObjs[eid]?.common).some(n => n.toLowerCase() === norm)
                );
            });
            id = match || `${prefix}${seg}`;
        }
        if (!working[id]) {
            working[id] =
                enumObjs[id] ||
                ({ _id: id, type: 'enum', common: { name: ref, members: [] }, native: {} } as ioBroker.EnumObject);
            if (!Array.isArray(working[id].common.members)) {
                working[id].common.members = [];
            }
        }
        return id;
    };

    const summary: Record<string, number> = {};
    for (const raw of assignments) {
        if (!raw || typeof raw !== 'object') {
            continue;
        }
        const item = raw as Record<string, unknown>;
        const objId = argStr(item.id).trim();
        if (!objId) {
            continue;
        }
        const groups: Array<['rooms' | 'functions', unknown]> = [
            ['rooms', item.rooms],
            ['functions', item.functions],
        ];
        for (const [category, refs] of groups) {
            if (!Array.isArray(refs)) {
                continue;
            }
            for (const ref of refs) {
                const r = String(ref || '').trim();
                if (!r) {
                    continue;
                }
                const enumId = resolveEnum(category, r);
                const members = working[enumId].common.members;
                if (!members.includes(objId)) {
                    members.push(objId);
                    summary[enumId] = (summary[enumId] || 0) + 1;
                }
            }
        }
    }

    const changed = Object.keys(summary);
    if (!changed.length) {
        return ok({ changed: 0, note: 'Nothing to do — all assignments were already present.' });
    }
    for (const enumId of changed) {
        await adapter.setForeignObjectAsync(enumId, working[enumId]);
    }
    return ok({ changed: changed.length, enums: summary });
}

/** Max stdout/stderr length fed back to the model (keeps the tool result bounded). */
const MAX_SCRIPT_OUTPUT = 6000;

/** Clip long script output so the tool result stays bounded. */
function clipOutput(s: string): string {
    return s.length > MAX_SCRIPT_OUTPUT ? `${s.slice(0, MAX_SCRIPT_OUTPUT)}\n…(truncated)` : s;
}

/**
 * Run a short Node.js script on the host in a SEPARATE process with a timeout, capturing stdout/stderr.
 * High-risk (arbitrary code) — only reached after the per-call confirmation gate has approved it.
 */
function runNodeScript(args: Record<string, unknown>): Promise<AdminLocalResult> {
    const code = argStr(args.code);
    if (!code.trim()) {
        return Promise.resolve(fail('code is required'));
    }
    const timeout = Math.min(Math.max(Number(args.timeout) || 10000, 500), 60000);
    return new Promise<AdminLocalResult>(resolve => {
        execFile(
            process.execPath,
            ['-e', code],
            { timeout, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
            (error: ExecFileException | null, stdout: string, stderr: string) => {
                resolve(
                    ok({
                        exitCode: error && typeof error.code === 'number' ? error.code : error ? 1 : 0,
                        timedOut: error?.killed === true,
                        stdout: clipOutput(stdout || ''),
                        stderr: clipOutput(stderr || ''),
                    }),
                );
            },
        );
    });
}

/** Normalize the `logs` array the javascript adapter returns into readable strings. */
function formatScriptLogs(logs: unknown): string[] {
    if (!Array.isArray(logs)) {
        return [];
    }
    return logs.slice(0, 100).map(entry => {
        if (typeof entry === 'string') {
            return entry;
        }
        if (entry && typeof entry === 'object') {
            const o = entry as Record<string, unknown>;
            const sev = typeof o.severity === 'string' ? o.severity : typeof o.level === 'string' ? o.level : '';
            const msg =
                typeof o.message === 'string' ? o.message : typeof o.text === 'string' ? o.text : JSON.stringify(o);
            return sev ? `[${sev}] ${msg}` : msg;
        }
        return JSON.stringify(entry);
    });
}

/** Minimum javascript adapter version that supports the `execute` message used by run_javascript. */
const MIN_JAVASCRIPT_VERSION = '9.3.1';

/**
 * Run a one-off JS/TS script INSIDE the javascript adapter (full ioBroker scripting API) by sending it
 * an `execute` message. High-risk (arbitrary code) — only reached after per-call confirmation.
 */
async function runJavaScript(adapter: ioBroker.Adapter, args: Record<string, unknown>): Promise<AdminLocalResult> {
    const source = argStr(args.source);
    if (!source.trim()) {
        return fail('source is required');
    }
    const lang = argStr(args.language).toLowerCase();
    const engineType: 'Javascript/js' | 'TypeScript/ts' =
        lang === 'ts' || lang === 'typescript' ? 'TypeScript/ts' : 'Javascript/js';
    const timeout = Math.min(Math.max(Number(args.timeout) || 10000, 500), 60000);

    // Pick the javascript instance: an explicit one, otherwise the first (preferably enabled) instance.
    let instance = argStr(args.instance).replace(/^system\.adapter\./, '');
    let instanceObj: ioBroker.Object | null | undefined;
    if (!instance) {
        const instances = await adapter.getForeignObjectsAsync('system.adapter.javascript.*', 'instance');
        const ids = Object.keys(instances || {});
        if (!ids.length) {
            return fail(
                'The "javascript" adapter is not installed. Offer to install it (install_adapter "javascript") and add an instance.',
            );
        }
        const enabled = ids.find(id => instances[id]?.common?.enabled);
        const chosen = enabled || ids[0];
        instance = chosen.replace('system.adapter.', '');
        instanceObj = instances[chosen];
    } else {
        instanceObj = await adapter.getForeignObjectAsync(`system.adapter.${instance}`);
    }

    // The `execute` message used below is only available from javascript v9.2.4 onwards.
    const common = instanceObj?.common as { version?: string } | undefined;
    const version = typeof common?.version === 'string' ? common.version : '';
    if (version && semver.valid(version) && semver.lt(version, MIN_JAVASCRIPT_VERSION)) {
        return fail(
            `Running scripts via the assistant requires the "javascript" adapter v${MIN_JAVASCRIPT_VERSION} or higher, ` +
                `but ${instance} is v${version}. Please update the javascript adapter first.`,
        );
    }

    const message = { source, engineType, timeout, verbose: true, maxLogs: 100 };
    // Guard so the chat turn never hangs if the instance is not running and never calls back.
    const guardMs = timeout + 5000;
    const result = await Promise.race([
        adapter.sendToAsync(instance, 'execute', message) as Promise<unknown>,
        new Promise<Record<string, unknown>>(resolve =>
            setTimeout(
                () =>
                    resolve({ ok: false, error: `No response from ${instance} within ${guardMs} ms (is it running?)` }),
                guardMs,
            ),
        ),
    ]);

    const r = (result || {}) as Record<string, unknown>;
    const errText = typeof r.error === 'string' ? r.error : r.error ? JSON.stringify(r.error) : '';
    return ok({
        instance,
        engineType,
        ok: r.ok !== false && !errText,
        ...(errText ? { error: errText } : {}),
        output: typeof r.output === 'string' ? clipOutput(r.output) : '',
        logs: formatScriptLogs(r.logs),
    });
}

/** Validate the adapter name and hand the installation to the frontend. */
function installAdapter(args: Record<string, unknown>): AdminLocalResult {
    let adapterName = argStr(args.adapter).trim().toLowerCase();
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
    const raw = argStr(args.hash || args.tab || args.route).trim();
    if (!raw) {
        return fail('hash is required, e.g. "#tab-hosts/base-settings/system.host.MSI"');
    }
    // Be lenient about what the model sends: a full URL ("http://host:3000/#tab-..."), a leading-slash
    // hash ("/#tab-...") or a bare route ("tab-..."). Extract everything from the first "#".
    const hashAt = raw.indexOf('#');
    const hash = hashAt >= 0 ? raw.substring(hashAt) : `#${raw.replace(/^\/+/, '')}`;
    if (!hash.startsWith('#tab-')) {
        return fail('hash must be an admin route starting with "#tab-", e.g. "#tab-objects/edit/<id>"');
    }
    return ok({ hash, navigated: true }, { type: 'navigate', hash });
}

/** Validate an ioBroker CLI command and hand it to the frontend, which streams its live output. */
function runCommand(args: Record<string, unknown>): AdminLocalResult {
    const command = argStr(args.command).trim();
    if (!command) {
        return fail('command is required');
    }
    return ok(
        { command, handedToUi: true, note: 'The command runs in the admin UI; its live output is shown to the user.' },
        { type: 'command', command },
    );
}
