"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAiCredentials = listAiCredentials;
exports.resolveAiKey = resolveAiKey;
/**
 * Resolve AI API keys for the chat helper from ioBroker's central credential store.
 *
 * Credentials live as `system.credentials.*` objects of type `ai`, encrypted with the system
 * secret. `@iobroker/adapter-core` provides the canonical reader that decrypts them; the key
 * therefore never has to be configured in the admin instance config and is only ever read
 * server-side, on demand.
 */
const adapter_core_1 = require("@iobroker/adapter-core");
/** List all stored AI credentials (without secrets) so the frontend can offer a choice. */
async function listAiCredentials(adapter) {
    if (!adapter_core_1.Credentials?.listCredentials) {
        return [];
    }
    const list = await adapter_core_1.Credentials.listCredentials(adapter, 'ai');
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
async function resolveAiKey(adapter, credentialId) {
    if (!adapter_core_1.Credentials?.getCredentials) {
        adapter.log.warn('You need js-controller v7.2 or later to use this feature');
        return '';
    }
    const info = await adapter_core_1.Credentials.getCredentials(adapter, credentialId);
    const values = info.values;
    const key = (values.key ?? values.password ?? '');
    return String(key || '').trim();
}
//# sourceMappingURL=credentials.js.map