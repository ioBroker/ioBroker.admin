"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatCompletion = chatCompletion;
exports.listModels = listModels;
/**
 * Provider-agnostic proxy for LLM chat-completion and model-list requests.
 *
 * All providers are spoken to in the OpenAI chat-completion format; Anthropic is translated to/from
 * its native Messages API via {@link ./anthropicAdapter}. API keys are passed in by the caller (the
 * backend resolves them from the central credential store) and never leave the adapter process.
 *
 * Mirrors the request/response shapes of ioBroker.javascript's `chatCompletion` handler.
 */
const axios_1 = require("axios");
const https = require("node:https");
const anthropicAdapter_1 = require("./anthropicAdapter");
const DEFAULT_TIMEOUT = 600_000;
const DEFAULT_MAX_TOKENS = 8192;
const OPENAI_BASE = 'https://api.openai.com/v1';
/** Build an https agent that tolerates self-signed certs, but only for https URLs when requested. */
function httpsAgentFor(url, allowSelfSigned) {
    return allowSelfSigned && url.startsWith('https:') ? new https.Agent({ rejectUnauthorized: false }) : undefined;
}
/** Build the provider-specific URL, headers and request body for a chat completion. */
function buildChatRequest(params) {
    const { provider, model, apiKey, baseUrl, messages, tools } = params;
    const maxTokens = params.maxTokens ?? DEFAULT_MAX_TOKENS;
    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        const { system, messages: anthropicMessages } = (0, anthropicAdapter_1.translateMessagesToAnthropic)(messages);
        const anthropicTools = tools?.length ? (0, anthropicAdapter_1.translateToolsToAnthropic)(tools) : [];
        return {
            url: 'https://api.anthropic.com/v1/messages',
            headers,
            body: {
                model,
                max_tokens: maxTokens,
                stream: false,
                ...(system ? { system } : {}),
                messages: anthropicMessages,
                ...(anthropicTools.length ? { tools: anthropicTools } : {}),
            },
        };
    }
    if (provider === 'gemini') {
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        return {
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            headers,
            body: { model, messages, stream: false, ...(tools?.length ? { tools } : {}) },
        };
    }
    if (provider === 'deepseek') {
        headers.Authorization = `Bearer ${apiKey}`;
        return {
            url: 'https://api.deepseek.com/chat/completions',
            headers,
            body: { model, messages, stream: false, ...(tools?.length ? { tools } : {}) },
        };
    }
    // openai or custom (OpenAI-compatible) endpoint
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }
    const base = baseUrl || OPENAI_BASE;
    return {
        url: `${base}/chat/completions`,
        headers,
        body: {
            model,
            messages,
            stream: false,
            ...(tools?.length ? { tools } : {}),
            // Disable thinking/reasoning for local models to save context and speed.
            ...(baseUrl ? { reasoning_effort: 'none' } : {}),
        },
    };
}
/** Extract a short human-readable error detail from a failed provider response. */
function errorDetail(status, data) {
    if (data && typeof data === 'object') {
        const message = data.error?.message;
        if (message) {
            return message;
        }
    }
    if (typeof data === 'string' && data) {
        return data.substring(0, 300);
    }
    try {
        return JSON.stringify(data).substring(0, 300);
    }
    catch {
        return `HTTP ${status}`;
    }
}
/**
 * Send one chat-completion request to the configured provider.
 *
 * @param params provider, model, key, messages and (optional) tools
 * @returns the assistant content and any requested tool calls (OpenAI shape)
 * @throws Error with a human-readable message on connection or API errors
 */
async function chatCompletion(params) {
    const { url, headers, body } = buildChatRequest(params);
    const config = {
        headers,
        timeout: params.timeoutMs ?? DEFAULT_TIMEOUT,
        validateStatus: () => true,
        httpsAgent: httpsAgentFor(url, params.allowSelfSignedCerts),
    };
    let response;
    try {
        response = await axios_1.default.post(url, body, config);
    }
    catch (e) {
        throw new Error(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`${errorDetail(response.status, response.data)} (${response.status})`);
    }
    if (params.provider === 'anthropic') {
        return (0, anthropicAdapter_1.translateAnthropicResponseToOpenAI)(response.data);
    }
    const message = response.data?.choices?.[0]?.message;
    return {
        content: message?.content || '',
        ...(message?.tool_calls ? { tool_calls: message.tool_calls } : {}),
    };
}
/**
 * List the models a provider offers — used by the settings "Test connection" button, which also
 * validates the API key.
 *
 * @param params provider, key and (optional) base URL
 * @returns sorted list of model ids
 * @throws Error on an invalid key or a connection/API error
 */
async function listModels(params) {
    const { provider, apiKey, baseUrl } = params;
    const headers = { 'Content-Type': 'application/json' };
    let url;
    if (provider === 'anthropic') {
        url = 'https://api.anthropic.com/v1/models';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
    }
    else if (provider === 'gemini') {
        url = 'https://generativelanguage.googleapis.com/v1beta/openai/models';
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
    }
    else if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/models';
        headers.Authorization = `Bearer ${apiKey}`;
    }
    else {
        url = `${baseUrl || OPENAI_BASE}/models`;
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
    }
    let response;
    try {
        response = await axios_1.default.get(url, {
            headers,
            timeout: params.timeoutMs ?? 10_000,
            validateStatus: () => true,
            httpsAgent: httpsAgentFor(url, params.allowSelfSignedCerts),
        });
    }
    catch (e) {
        throw new Error(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (response.status === 401) {
        throw new Error('Invalid API key (401)');
    }
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`${errorDetail(response.status, response.data)} (${response.status})`);
    }
    const list = (response.data?.data || []);
    return list
        .map(m => (m.id?.startsWith('models/') ? m.id.substring(7) : m.id))
        .filter((id) => !!id)
        .sort();
}
//# sourceMappingURL=llmProvider.js.map