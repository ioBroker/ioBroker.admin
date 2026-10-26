/**
 * The AI providers the system-wide AI settings (`system.ai`) offer, in the order of the settings of
 * the javascript adapter. Shared by the "AI" tab of the system settings and the assistant.
 */
import { Router } from '@iobroker/gui-components';

import type { AiProvider } from '../Chat/chatTypes';
import { CREDENTIAL_ICON_DATA } from './credentialIcons';

export interface AiProviderInfo {
    value: AiProvider;
    /** Brand name, not translated */
    label: string;
    /** Brand logo as data URL; the custom endpoint has none */
    icon?: string;
    /** Proposed name of a new credential, e.g. `chatgpt` → `system.credentials.chatgpt` */
    credentialName: string;
    /** Where to get an API key */
    keyUrl?: string;
}

export const AI_PROVIDER_INFO: AiProviderInfo[] = [
    {
        value: 'openai',
        label: 'OpenAI (ChatGPT)',
        icon: CREDENTIAL_ICON_DATA.chatgpt,
        credentialName: 'chatgpt',
        keyUrl: 'https://platform.openai.com/api-keys',
    },
    {
        value: 'anthropic',
        label: 'Anthropic (Claude)',
        icon: CREDENTIAL_ICON_DATA.anthropic,
        credentialName: 'anthropic',
        keyUrl: 'https://console.anthropic.com/settings/keys',
    },
    {
        value: 'gemini',
        label: 'Google Gemini',
        icon: CREDENTIAL_ICON_DATA.gemini,
        credentialName: 'gemini',
        keyUrl: 'https://aistudio.google.com/apikey',
    },
    {
        value: 'deepseek',
        label: 'DeepSeek',
        icon: CREDENTIAL_ICON_DATA.deepseek,
        credentialName: 'deepseek',
        keyUrl: 'https://platform.deepseek.com/api_keys',
    },
    { value: 'custom', label: 'Custom (OpenAI-compatible)', credentialName: 'custom' },
];

export function getAiProviderInfo(provider: string | undefined): AiProviderInfo | undefined {
    return AI_PROVIDER_INFO.find(info => info.value === provider);
}

/** Tab of the system settings with the AI settings, as named in the URL */
export const AI_SETTINGS_TAB = 'tabAi';

/** Open the AI tab of the system settings, where provider, key and model of the system are set up */
export function openAiSettings(): void {
    Router.doNavigate(null, 'system', AI_SETTINGS_TAB);
}
