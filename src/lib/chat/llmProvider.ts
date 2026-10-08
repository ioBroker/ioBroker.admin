/**
 * Provider-agnostic proxy for LLM chat-completion and model-list requests.
 *
 * All providers are spoken to in the OpenAI chat-completion format; Anthropic is translated to/from
 * its native Messages API via {@link ./anthropicAdapter}. API keys are passed in by the caller (the
 * backend resolves them from the central credential store) and never leave the adapter process.
 *
 * Mirrors the request/response shapes of ioBroker.javascript's `chatCompletion` handler.
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
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

/**
 * `reasoning_effort` for the OpenAI-compatible providers. An empty value leaves the parameter out
 * and lets the endpoint decide - which is what a hosted reasoning model wants.
 */
export type ReasoningEffort = '' | 'none' | 'minimal' | 'low' | 'medium' | 'high';

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
    /** What to ask of the reasoning; empty (the default) sends nothing and leaves it to the endpoint. */
    reasoningEffort?: ReasoningEffort;
    timeoutMs?: number;
    maxTokens?: number;
}

export interface LlmChatResult {
    content: string;
    tool_calls?: OpenAIToolCall[];
}

/** Ceiling for one LLM request, and the budget when the caller names none */
export const MAX_REQUEST_TIMEOUT_MS = 600_000;
/** What Anthropic gets as `max_tokens` when the setting is empty or unusable */
export const DEFAULT_MAX_TOKENS = 8192;
/** Smallest `max_tokens` worth sending: below that not even a short answer with its reasoning fits */
export const MIN_MAX_TOKENS = 1024;
/** Highest `max_tokens` the setting may ask for - beyond this every current model answers 400 */
export const MAX_MAX_TOKENS = 200_000;
const OPENAI_BASE = 'https://api.openai.com/v1';

/**
 * How long to wait for an AI endpoint, from the `timeout` the caller put in the message.
 *
 * @param requestedTimeout the value from the `chat:send` message, in milliseconds
 */
export function resolveRequestTimeout(requestedTimeout?: unknown): number {
    const requested = parseInt(requestedTimeout as string, 10);
    // Nothing usable, or a zero - which is how Node itself spells "no timeout" - gets the ceiling
    if (isNaN(requested) || requested <= 0) {
        return MAX_REQUEST_TIMEOUT_MS;
    }
    // A second is the floor: below that not even a local model gets a chance to answer
    return Math.min(Math.max(requested, 1000), MAX_REQUEST_TIMEOUT_MS);
}

/**
 * The output budget for an Anthropic request.
 *
 * Anthropic insists on `max_tokens`, so there is no "let the endpoint decide". Too small and the
 * answer is cut off mid-line; too large and the model rejects the request outright, so the
 * configured value is clamped into a range every model can live with.
 *
 * @param configured the value from the assistant settings
 */
export function resolveMaxTokens(configured?: unknown): number {
    const requested = parseInt(configured as string, 10);
    if (isNaN(requested) || requested <= 0) {
        return DEFAULT_MAX_TOKENS;
    }
    return Math.min(Math.max(requested, MIN_MAX_TOKENS), MAX_MAX_TOKENS);
}

/**
 * Models that refuse function tools unless the reasoning is switched off explicitly.
 *
 * OpenAI answers such a request with "Function tools with reasoning_effort are not supported for
 * <model> in /v1/chat/completions ... or set reasoning_effort to 'none'". Which models behave that
 * way changes with every release, so they are not kept in a list here but learned from the error:
 * the first request of a session runs into it, is repeated, and every later one carries the
 * parameter right away.
 */
const needReasoningEffortNone = new Set<string>();

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
    /*
     * The reasoning used to be switched off for every custom base URL, to save context and time on a
     * local model. Behind a proxy that fronts a subscription the same rule turns off the reasoning of
     * the model one is paying for, so it is a setting now and its default sends nothing at all.
     *
     * `needReasoningEffortNone` still overrides it: that one is not a preference but a model saying
     * it will not accept tools while reasoning, and it is remembered from its own error message.
     */
    const effort = needReasoningEffortNone.has(`${provider}:${model}`) ? 'none' : params.reasoningEffort;
    return {
        url: `${base}/chat/completions`,
        headers,
        body: {
            model,
            messages,
            stream: false,
            ...(tools?.length ? { tools } : {}),
            ...(effort ? { reasoning_effort: effort } : {}),
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
 * @throws {Error} with a human-readable message on connection or API errors
 */
export async function chatCompletion(params: LlmChatParams): Promise<LlmChatResult> {
    const { url, headers, body } = buildChatRequest(params);
    const config: AxiosRequestConfig = {
        headers,
        timeout: params.timeoutMs ?? MAX_REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
        // Accepting self-signed certs only makes sense for a custom endpoint; never weaken TLS for the
        // official provider hosts even if the flag is left over from a previous custom configuration.
        httpsAgent: httpsAgentFor(url, params.provider === 'custom' && params.allowSelfSignedCerts),
    };

    const post = async (data: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            return await axios.post(url, data, config);
        } catch (e) {
            throw new Error(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    let response = await post(body);

    // The model rejects function tools while it is reasoning. It says so itself, so repeat the
    // request with the reasoning switched off and remember the model for the next time.
    if (
        response.status === 400 &&
        body.reasoning_effort === undefined &&
        /reasoning_effort/.test(errorDetail(response.status, response.data))
    ) {
        needReasoningEffortNone.add(`${params.provider}:${params.model}`);
        response = await post({ ...body, reasoning_effort: 'none' });
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
 * @throws {Error} on an invalid key or a connection/API error
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
