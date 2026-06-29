/**
 * Provider-agnostic proxy for LLM chat-completion and model-list requests.
 *
 * All providers are spoken to in the OpenAI chat-completion format; Anthropic is translated to/from
 * its native Messages API via {@link ./anthropicAdapter}. API keys are passed in by the caller (the
 * backend resolves them from the central credential store) and never leave the adapter process.
 *
 * Mirrors the request/response shapes of ioBroker.javascript's `chatCompletion` handler.
 */
import axios, { type AxiosRequestConfig } from 'axios';
import * as https from 'node:https';
import {
    translateMessagesToAnthropic,
    translateToolsToAnthropic,
    translateAnthropicResponseToOpenAI,
    type OpenAIMessage,
    type OpenAITool,
    type OpenAIToolCall,
} from './anthropicAdapter';

export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'custom';

export interface LlmChatParams {
    provider: AiProvider;
    model: string;
    apiKey: string;
    /** Base URL for the OpenAI-compatible/custom endpoint (e.g. Ollama, LM Studio, OpenRouter). */
    baseUrl?: string;
    messages: OpenAIMessage[];
    tools?: OpenAITool[];
    /** Accept self-signed certificates (only relevant for custom https endpoints). */
    allowSelfSignedCerts?: boolean;
    timeoutMs?: number;
    maxTokens?: number;
}

export interface LlmChatResult {
    content: string;
    tool_calls?: OpenAIToolCall[];
}

const DEFAULT_TIMEOUT = 600_000;
const DEFAULT_MAX_TOKENS = 8192;
const OPENAI_BASE = 'https://api.openai.com/v1';

/** Build an https agent that tolerates self-signed certs, but only for https URLs when requested. */
function httpsAgentFor(url: string, allowSelfSigned?: boolean): https.Agent | undefined {
    return allowSelfSigned && url.startsWith('https:') ? new https.Agent({ rejectUnauthorized: false }) : undefined;
}

/** Build the provider-specific URL, headers and request body for a chat completion. */
function buildChatRequest(params: LlmChatParams): {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
} {
    const { provider, model, apiKey, baseUrl, messages, tools } = params;
    const maxTokens = params.maxTokens ?? DEFAULT_MAX_TOKENS;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        const { system, messages: anthropicMessages } = translateMessagesToAnthropic(messages);
        const anthropicTools = tools?.length ? translateToolsToAnthropic(tools) : [];
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

    // openai or custom (OpenAI-compatible) endpoint. A base URL only applies to the "custom" provider;
    // ignore any value left over from a previous custom configuration so OpenAI always talks to its
    // official endpoint (https://api.openai.com) instead of the stale custom URL.
    const customBase = provider === 'custom' ? baseUrl : undefined;
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }
    const base = customBase || OPENAI_BASE;
    return {
        url: `${base}/chat/completions`,
        headers,
        body: {
            model,
            messages,
            stream: false,
            ...(tools?.length ? { tools } : {}),
            // Disable thinking/reasoning for local models to save context and speed.
            ...(customBase ? { reasoning_effort: 'none' } : {}),
        },
    };
}

/** Extract a short human-readable error detail from a failed provider response. */
function errorDetail(status: number, data: unknown): string {
    if (data && typeof data === 'object') {
        const message = (data as { error?: { message?: string } }).error?.message;
        if (message) {
            return message;
        }
    }
    if (typeof data === 'string' && data) {
        return data.substring(0, 300);
    }
    try {
        return JSON.stringify(data).substring(0, 300);
    } catch {
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
export async function chatCompletion(params: LlmChatParams): Promise<LlmChatResult> {
    const { url, headers, body } = buildChatRequest(params);
    const config: AxiosRequestConfig = {
        headers,
        timeout: params.timeoutMs ?? DEFAULT_TIMEOUT,
        validateStatus: () => true,
        // Accepting self-signed certs only makes sense for a custom endpoint; never weaken TLS for the
        // official provider hosts even if the flag is left over from a previous custom configuration.
        httpsAgent: httpsAgentFor(url, params.provider === 'custom' && params.allowSelfSignedCerts),
    };

    let response;
    try {
        response = await axios.post(url, body, config);
    } catch (e) {
        throw new Error(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (response.status < 200 || response.status >= 300) {
        throw new Error(`${errorDetail(response.status, response.data)} (${response.status})`);
    }

    if (params.provider === 'anthropic') {
        return translateAnthropicResponseToOpenAI(response.data);
    }
    const message = response.data?.choices?.[0]?.message;
    return {
        content: message?.content || '',
        ...(message?.tool_calls ? { tool_calls: message.tool_calls as OpenAIToolCall[] } : {}),
    };
}

export interface LlmModelsParams {
    provider: AiProvider;
    apiKey: string;
    baseUrl?: string;
    allowSelfSignedCerts?: boolean;
    timeoutMs?: number;
}

/**
 * List the models a provider offers — used by the settings "Test connection" button, which also
 * validates the API key.
 *
 * @param params provider, key and (optional) base URL
 * @returns sorted list of model ids
 * @throws Error on an invalid key or a connection/API error
 */
export async function listModels(params: LlmModelsParams): Promise<string[]> {
    const { provider, apiKey, baseUrl } = params;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let url: string;

    if (provider === 'anthropic') {
        url = 'https://api.anthropic.com/v1/models';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
        url = 'https://generativelanguage.googleapis.com/v1beta/openai/models';
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
    } else if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/models';
        headers.Authorization = `Bearer ${apiKey}`;
    } else {
        // openai or custom — a base URL only applies to "custom"; ignore a stale custom URL so OpenAI
        // always lists its models from the official endpoint.
        url = `${(provider === 'custom' && baseUrl) || OPENAI_BASE}/models`;
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
    }

    let response;
    try {
        response = await axios.get(url, {
            headers,
            timeout: params.timeoutMs ?? 10_000,
            validateStatus: () => true,
            httpsAgent: httpsAgentFor(url, provider === 'custom' && params.allowSelfSignedCerts),
        });
    } catch (e) {
        throw new Error(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (response.status === 401) {
        throw new Error('Invalid API key (401)');
    }
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`${errorDetail(response.status, response.data)} (${response.status})`);
    }

    const list = (response.data?.data || []) as { id?: string }[];
    return list
        .map(m => (m.id?.startsWith('models/') ? m.id.substring(7) : m.id))
        .filter((id): id is string => !!id)
        .sort();
}
