/** Shared types for the admin chat helper frontend, mirroring the backend `chat:*` message API. */

import type { AdminConnection } from '@iobroker/adapter-react-v5';

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom';

/** Permission mode: `read` = answer/inspect only, `act` = may propose write/action tools. */
export type ChatMode = 'read' | 'act';

/** A message in OpenAI chat-completion format (the conversation the backend continues each turn). */
export interface ApiMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string | null;
    tool_calls?: unknown[];
    tool_call_id?: string;
}

/** One executed tool call returned by the backend, for display. */
export interface ChatStep {
    tool: string;
    args: Record<string, unknown>;
    ok: boolean;
    result: string;
}

/** A write/action tool call awaiting the user's confirmation. */
export interface PendingAction {
    id: string;
    tool: string;
    args: Record<string, unknown>;
    kind: 'read' | 'write' | 'action';
}

/** An action the frontend performs after a turn (the backend handed it over). */
export type ClientAction =
    | { type: 'install'; adapter: string }
    | { type: 'navigate'; hash: string }
    | { type: 'command'; command: string };

/** Response of the `chat:send` backend command. */
export interface ChatSendResponse {
    success?: boolean;
    error?: string;
    status?: 'done' | 'confirm';
    content?: string;
    newMessages?: ApiMessage[];
    steps?: ChatStep[];
    pendingActions?: PendingAction[];
    clientActions?: ClientAction[];
}

/** One selectable AI credential (id + display name). */
export interface AiCredentialEntry {
    id: string;
    name?: string;
    icon?: string;
}

/** Response of `chat:getProviders`. */
export interface ChatProvidersResponse {
    error?: string;
    providers?: AiCredentialEntry[];
}

/** Response of `chat:testConnection`. */
export interface ChatTestResponse {
    error?: string;
    success?: boolean;
    models?: string[];
    count?: number;
}

/** Persisted chat settings (provider/model/credential), stored in localStorage. */
export interface ChatSettingsValue {
    provider: AiProvider;
    model: string;
    /** Full id of a `system.credentials.*` entry of type `ai`. */
    credentialId: string;
    /** Base URL for the OpenAI-compatible/custom endpoint. */
    baseUrl: string;
    allowSelfSignedCerts: boolean;
    /** Hide the floating launcher button; reveal it by moving the mouse to the bottom-right corner. */
    hideFab: boolean;
}

/** What the chat panel renders as a single conversation entry. */
export type DisplayItem =
    | { id: number; role: 'user'; text: string }
    | { id: number; role: 'assistant'; text: string; steps: ChatStep[] }
    | { id: number; role: 'confirm'; text: string; actions: PendingAction[]; decided?: 'approved' | 'declined' }
    | { id: number; role: 'command'; command: string; lines: string[]; running: boolean; exitCode?: number }
    | { id: number; role: 'error'; text: string };

export const CHAT_SETTINGS_KEY = 'App.chatHelperSettings';

export const DEFAULT_CHAT_SETTINGS: ChatSettingsValue = {
    provider: 'anthropic',
    model: '',
    credentialId: '',
    baseUrl: '',
    allowSelfSignedCerts: false,
    hideFab: false,
};

/** Read the persisted chat settings from localStorage (falling back to defaults). */
export function loadChatSettings(): ChatSettingsValue {
    try {
        const raw = window.localStorage.getItem(CHAT_SETTINGS_KEY);
        if (raw) {
            return { ...DEFAULT_CHAT_SETTINGS, ...(JSON.parse(raw) as Partial<ChatSettingsValue>) };
        }
    } catch {
        // ignore malformed settings
    }
    return { ...DEFAULT_CHAT_SETTINGS };
}

/** Persist the chat settings to localStorage. */
export function saveChatSettings(value: ChatSettingsValue): void {
    try {
        window.localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(value));
    } catch {
        // ignore quota errors
    }
}

/** True if the settings are complete enough to send a request. */
export function chatSettingsReady(value: ChatSettingsValue): boolean {
    if (!value.model) {
        return false;
    }
    // Custom/OpenAI-compatible endpoints may run without a key (local Ollama etc.).
    return value.provider === 'custom' ? !!value.baseUrl || !!value.credentialId : !!value.credentialId;
}

/**
 * The chat configuration (provider/model/credential/baseUrl/…) is stored system-wide in the `native`
 * section of this ioBroker object, so it is shared across all browsers/devices instead of living only
 * in the local browser. The API key itself stays in the central, encrypted credential store — only the
 * `credentialId` reference is kept here. localStorage is used only as a fast-start cache.
 */
export const CHAT_SETTINGS_OBJECT_ID = 'system.ai';

/**
 * Load the chat settings from the shared `system.ai` object.
 *
 * @returns the stored settings, or `null` if the object doesn't exist yet / carries no settings (so
 * the caller can migrate the local cache into it).
 */
export async function loadChatSettingsFromObject(socket: AdminConnection): Promise<ChatSettingsValue | null> {
    try {
        const obj = await socket.getObject(CHAT_SETTINGS_OBJECT_ID);
        const native = obj?.native as Partial<ChatSettingsValue> | undefined;
        if (native && typeof native === 'object' && Object.keys(native).length) {
            return { ...DEFAULT_CHAT_SETTINGS, ...native };
        }
    } catch {
        // ignore — the object may not exist yet or the user may lack read permission
    }
    return null;
}

/** Persist the chat settings into the shared `system.ai` object (created on demand). */
export async function saveChatSettingsToObject(socket: AdminConnection, value: ChatSettingsValue): Promise<void> {
    let obj: ioBroker.Object | null | undefined;
    try {
        obj = await socket.getObject(CHAT_SETTINGS_OBJECT_ID);
    } catch {
        obj = null;
    }
    const next = {
        ...(obj || {}),
        _id: CHAT_SETTINGS_OBJECT_ID,
        type: 'config',
        common: {
            ...(obj?.common || {}),
            name: obj?.common?.name || 'AI assistant settings',
            expert: true,
        },
        native: { ...(obj?.native || {}), ...value },
    } as unknown as ioBroker.Object;
    await socket.setObject(CHAT_SETTINGS_OBJECT_ID, next);
}

export const CHAT_HISTORY_KEY = 'App.chatHelperHistory';
export const CHAT_MODE_KEY = 'App.chatHelperMode';

/** The persisted conversation: what is rendered plus the OpenAI-format messages sent to the backend. */
export interface ChatHistory {
    items: DisplayItem[];
    apiMessages: ApiMessage[];
}

/** Restore the conversation from localStorage (empty if none or malformed). */
export function loadChatHistory(): ChatHistory {
    try {
        const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<ChatHistory>;
            if (Array.isArray(parsed.items) && Array.isArray(parsed.apiMessages)) {
                // A command that was still streaming when the page was left can't resume — mark it done.
                const items = parsed.items.map(item =>
                    item.role === 'command' && item.running ? { ...item, running: false } : item,
                );
                return { items, apiMessages: parsed.apiMessages };
            }
        }
    } catch {
        // ignore malformed history
    }
    return { items: [], apiMessages: [] };
}

/** Persist the conversation (kept until the user starts a new chat). */
export function saveChatHistory(history: ChatHistory): void {
    try {
        window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch {
        // ignore quota errors — the chat simply won't be restored next time
    }
}

/** Forget the stored conversation (called from "new chat"). */
export function clearChatHistory(): void {
    try {
        window.localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch {
        // ignore
    }
}

/** Restore the "actions allowed" toggle (defaults to read-only). */
export function loadChatMode(): ChatMode {
    return window.localStorage.getItem(CHAT_MODE_KEY) === 'act' ? 'act' : 'read';
}

/** Persist the "actions allowed" toggle. */
export function saveChatMode(mode: ChatMode): void {
    try {
        window.localStorage.setItem(CHAT_MODE_KEY, mode);
    } catch {
        // ignore
    }
}

export const CHAT_WIDTH_KEY = 'App.chatHelperWidth';
export const DEFAULT_CHAT_WIDTH = 440;
export const MIN_CHAT_WIDTH = 320;

/** Clamp the drawer width to the allowed range for the current viewport. */
export function clampChatWidth(width: number): number {
    const max = Math.max(MIN_CHAT_WIDTH, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 80);
    return Math.min(Math.max(width, MIN_CHAT_WIDTH), max);
}

/** Restore the user-chosen drawer width (clamped, defaults to {@link DEFAULT_CHAT_WIDTH}). */
export function loadChatWidth(): number {
    const raw = parseInt(window.localStorage.getItem(CHAT_WIDTH_KEY) || '', 10);
    return clampChatWidth(Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CHAT_WIDTH);
}

/** Persist the user-chosen drawer width. */
export function saveChatWidth(width: number): void {
    try {
        window.localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(width)));
    } catch {
        // ignore
    }
}

/** How the assistant panel is shown: as an overlay (modal) or docked side-by-side with admin. */
export type ChatDisplayMode = 'overlay' | 'docked';

export const CHAT_DOCK_KEY = 'App.chatHelperDock';

/** Restore the display mode (defaults to overlay). */
export function loadChatDisplayMode(): ChatDisplayMode {
    return window.localStorage.getItem(CHAT_DOCK_KEY) === 'docked' ? 'docked' : 'overlay';
}

/** Persist the display mode. */
export function saveChatDisplayMode(mode: ChatDisplayMode): void {
    try {
        window.localStorage.setItem(CHAT_DOCK_KEY, mode);
    } catch {
        // ignore
    }
}

export const CHAT_OPEN_KEY = 'App.chatHelperOpen';

/** Restore whether the assistant panel was open. */
export function loadChatOpen(): boolean {
    return window.localStorage.getItem(CHAT_OPEN_KEY) === 'true';
}

/** Persist whether the assistant panel is open. */
export function saveChatOpen(open: boolean): void {
    try {
        window.localStorage.setItem(CHAT_OPEN_KEY, open ? 'true' : 'false');
    } catch {
        // ignore
    }
}

export const CHAT_AUTOAPPROVE_KEY = 'App.chatHelperAutoApprove';

/** Tool names the user granted blanket approval for ("don't ask again"). */
export function loadAutoApprove(): string[] {
    try {
        const raw = window.localStorage.getItem(CHAT_AUTOAPPROVE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                return parsed.filter((entry): entry is string => typeof entry === 'string');
            }
        }
    } catch {
        // ignore
    }
    return [];
}

/** Persist the blanket-approved tool names. */
export function saveAutoApprove(tools: string[]): void {
    try {
        window.localStorage.setItem(CHAT_AUTOAPPROVE_KEY, JSON.stringify(tools));
    } catch {
        // ignore
    }
}
