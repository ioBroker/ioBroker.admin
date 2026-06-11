/**
 * Resolve AI API keys for the chat helper from ioBroker's central credential store.
 *
 * Credentials live as `system.credentials.*` objects of type `ai`, encrypted with the system
 * secret. `@iobroker/adapter-core` provides the canonical reader that decrypts them; the key
 * therefore never has to be configured in the admin instance config and is only ever read
 * server-side, on demand.
 */
import { Credentials } from '@iobroker/adapter-core';

/** One selectable AI credential (id + display name, no secret). */
export interface AiCredentialEntry {
    id: string;
    name: string;
}

/** List all stored AI credentials (without secrets) so the frontend can offer a choice. */
export async function listAiCredentials(adapter: ioBroker.Adapter): Promise<AiCredentialEntry[]> {
    const list = await Credentials.listCredentials(adapter, 'ai');
    return list.map(entry => ({ id: entry.id, name: entry.name }));
}

/**
 * Read and decrypt the API key of a stored credential.
 *
 * Supports both credential forms: the `key` form (`native.key`, the normal case for an API key)
 * and the `login` form (`native.password`) as a fallback.
 *
 * @param adapter the admin adapter instance
 * @param credentialId full id, e.g. `system.credentials.anthropic`
 * @returns the decrypted key, or an empty string if none is stored
 */
export async function resolveAiKey(adapter: ioBroker.Adapter, credentialId: string): Promise<string> {
    const info = await Credentials.getCredentials(adapter, credentialId);
    const values = info.values as Record<string, unknown>;
    const key = (values.key ?? values.password ?? '') as string;
    return String(key || '').trim();
}
