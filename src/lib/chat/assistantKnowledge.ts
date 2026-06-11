/**
 * Curated "wiki" of ioBroker how-to knowledge that is injected into the assistant's system prompt.
 *
 * This is meant to grow over time: add a new {@link KnowledgeSection} to {@link KNOWLEDGE_SECTIONS}
 * for each task the assistant should know how to guide the user through. Keep entries short and
 * factual (English); the model turns them into an answer in the user's language.
 */

export interface KnowledgeSection {
    /** Short title of the how-to (used as a Markdown heading in the prompt). */
    title: string;
    /** The instruction text (Markdown allowed). */
    body: string;
}

export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
    {
        title: 'Open an adapter instance configuration',
        body: [
            'Every adapter instance has a settings page reachable through the admin URL hash:',
            '`#tab-instances/config/system.adapter.<adapter>.<instance>`.',
            'Example: the configuration of the first `hm-rpc` instance is at',
            '`#tab-instances/config/system.adapter.hm-rpc.0`.',
            'To guide the user, give them this exact hash link, or tell them to open the **Instances**',
            'tab and click the wrench/settings icon on that instance.',
        ].join(' '),
    },
    {
        title: 'ioBroker CLI commands (run via the run_command tool)',
        body: [
            'These are the common `iobroker` CLI subcommands (`iobroker` can be shortened to `iob`). With',
            'the `run_command` tool the leading "iobroker" is implied — pass only the subcommand',
            '(e.g. `restart hm-rpc.0`). `a` is short for `add`:',
            '- Instances: `list instances`, `start <adapter>.<n>`, `stop <adapter>.<n>`,',
            '  `restart <adapter>.<n>`, `enable <adapter>.<n>`, `disable <adapter>.<n>`.',
            '- Adapters: `list adapters`, `install <adapter>`, `add <adapter> [--host <host>]`,',
            '  `del <adapter>`, `update` (refresh the repository), `upgrade <adapter>`, `upload <adapter>`,',
            '  `version [<adapter>]`.',
            '- System: `status`, `host this`, `fix`, `uuid`, `backup`, `logs`.',
            '- Objects/states: `object get|set <id>`, `state get|set <id> [<value>]` — but prefer the MCP',
            '  tools (get_states/set_state/get_object) for reading/writing data.',
            'Avoid destructive commands (`del`, `restore`, `setup`) unless the user explicitly asks, and',
            'always explain what a command does before proposing it.',
        ].join('\n'),
    },
    {
        title: 'Manage instances — Expert mode is NOT required to delete or configure',
        body: [
            'In the **Instances** tab every instance has action icons: a start/stop (and restart) toggle,',
            'a settings/wrench icon to open its configuration, and a **delete (trash) icon**.',
            'Deleting or configuring an instance does **NOT** require Expert mode — the delete button is',
            'always available. To add another instance, open the **Adapters** tab and click the **+** on',
            'the adapter. CLI equivalents (run_command): `restart <adapter>.<n>`, `del <adapter>.<n>`,',
            '`add <adapter>`.',
            'Expert mode (toggled with the expert icon in the top toolbar) only reveals ADVANCED options',
            '(per-instance log level, schedule, memory/compact mode, and system/internal objects in the',
            'Objects tab). Never tell the user to enable Expert mode just to configure, delete or restart',
            'an instance.',
        ].join(' '),
    },
    {
        title: 'Instance settings and start/stop via the object',
        body: [
            "An instance's settings live in the object `system.adapter.<adapter>.<n>`, in its `native`",
            'section. Read it with the get_object tool to inspect the current configuration; the user',
            'edits it on the instance config page (`#tab-instances/config/system.adapter.<adapter>.<n>`)',
            'or directly in the Objects tab.',
            'Whether an instance runs is controlled by `common.enabled` (true/false) on that same object —',
            'set it to start/stop the instance (use the extend_object tool with',
            '`{ "common": { "enabled": true|false } }`). Equivalent CLI (run_command): `start <adapter>.<n>`,',
            '`stop <adapter>.<n>`, `restart <adapter>.<n>`. Update adapters with `iob upgrade` or',
            '`iob update <name>`; add an instance with `iob a <name>` (i.e. `add <name>`).',
        ].join(' '),
    },
    {
        title: 'System settings pages',
        body: [
            'The system-wide settings open at the URL hash `#tab-objects/system/<page>`, where `<page>`',
            'is one of: `tabConfig` (main config: language, location/coordinates for astro, units,',
            'currency), `tabRepositories`, `tabLicenses`, `tabCertificates`, `tabCredentials`,',
            '`tabDefaultACL`, `tabStatistics`. Example: `#tab-objects/system/tabConfig`.',
        ].join(' '),
    },
    {
        title: 'Rooms and functions (enums)',
        body: [
            'Users manage rooms and functions in the **Enums** tab (`#tab-enums`). Internally they are the',
            'objects `enum.rooms.<room>` and `enum.functions.<function>`; their assigned members are the',
            'array `common.members` (a list of object IDs). The list_rooms / list_functions tools read',
            'these, and editing the object updates the room/function membership.',
        ].join(' '),
    },
    {
        title: 'Deep links to pages and dialogs (offer these as clickable links)',
        body: [
            'You CAN link directly to specific pages AND dialogs — never tell the user a dialog can only',
            'be opened manually. Offer a Markdown hash link; clicking it opens the page/dialog:',
            '- A tab: `#tab-<name>` (see the tabs list).',
            '- Adapter instance config: `#tab-instances/config/<adapter>.<n>`.',
            '- Object — pick the MODE matching the intent: to OPEN / EDIT / "bearbeiten" an object (the',
            '  "edit object" dialog) use `#tab-objects/edit/<id>` — NOT `select`. A specific tab of that',
            '  dialog: `#tab-objects/edit/<id>/<tab>` where `<tab>` = `common` (general), `object` (object',
            '  data), `state` (value) or `alias`. Custom/settings dialog: `#tab-objects/settings/<id>`.',
            '  ONLY to highlight an object in the tree WITHOUT opening a dialog use `#tab-objects/select/<id>`.',
            '- File viewer: `#tab-files/view/<url-encoded path>` — URL-encode the path ("/" becomes %2F),',
            '  e.g. `#tab-files/view/vis.0%2Fmain%2Fvis-views.json`.',
            '- Host edit settings: `#tab-hosts/settings/<host>`. Host BASE settings:',
            '  `#tab-hosts/base-settings/<host>` or a specific tab `#tab-hosts/base-settings/<host>/<tab>`',
            '  where `<tab>` = `system`, `multihost`, `objects`, `states`, `log` or `plugins`. `<host>` is',
            '  the full host id, e.g. `system.host.MSI`.',
            'Example — to open the base settings of host MSI, answer with the link',
            '[Base settings of MSI](#tab-hosts/base-settings/system.host.MSI).',
        ].join('\n'),
    },
    {
        title: 'Admin tabs and how to reach them',
        body: [
            'Each admin tab has a URL hash; navigate there by changing the hash (or with the',
            'navigate_admin_ui tool). Core tabs:',
            '- `#tab-intro` — Overview/start page (instances with quick links).',
            '- `#tab-adapters` — Adapters: install/add/update adapters.',
            '- `#tab-instances` — Instances: configure/start/stop/delete instances.',
            '- `#tab-objects` — Objects: the object/state tree (system settings live under',
            '  `#tab-objects/system/<page>`).',
            '- `#tab-enums` — Enums: rooms and functions.',
            '- `#tab-logs` — Logs.',
            '- `#tab-hosts` — Hosts.',
            '- `#tab-files` — File storage.',
            '- `#tab-users` — Users and groups (ACL).',
            '- `#tab-info` — System information.',
            'Some tabs appear only when the matching adapter is installed, e.g. `#tab-scenes` (scenes',
            'adapter), `#tab-javascript` (javascript adapter), `#tab-devicemanager` / `#tab-devices`.',
        ].join('\n'),
    },
];

/** Render the knowledge base as a Markdown block for the system prompt. */
export function renderAssistantKnowledge(): string {
    return KNOWLEDGE_SECTIONS.map(section => `### ${section.title}\n${section.body}`).join('\n\n');
}
