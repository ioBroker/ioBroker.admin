import React, { useEffect, useRef, useState } from 'react';

import {
    Alert,
    Autocomplete,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, NetworkCheck as TestIcon, Tune as TuneIcon } from '@mui/icons-material';

import { Icon, type AdminConnection, type Translate } from '@iobroker/gui-components';
import { isChatModel } from '@iobroker/ai-core/build/shared/models';

import { sendPushRequest } from '@/helpers/pushRequest';
import {
    DEFAULT_CHAT_MAX_TOKENS,
    MAX_CHAT_MAX_TOKENS,
    MIN_CHAT_MAX_TOKENS,
    type AiProvider,
    type ChatSettingsValue,
    type ChatTestResponse,
    type ReasoningEffort,
} from '../Chat/chatTypes';
import AiCredentialDialog from './AiCredentialDialog';
import { AI_PROVIDER_INFO, getAiProviderInfo, type AiProviderInfo } from './aiProviders';
import { CREDENTIALS_PREFIX, SOME_PASSWORD } from './credentialTypes';

/**
 * The `native` of `system.ai`. A removed provider is stored as empty strings rather than left out:
 * the dialog merges what it saves into the stored object, so a missing field would keep the old value
 */
type AiNative = Omit<Partial<ChatSettingsValue>, 'provider'> & { provider?: AiProvider | '' };

interface AiSettingsDialogProps {
    t: Translate;
    saving: boolean;
    /** `system.ai` */
    data: ioBroker.Object;
    /** All credentials of the system settings, with the encrypted values masked */
    dataAux: ioBroker.Object[];
    onChange: (data: ioBroker.Object | null, dataAux: ioBroker.Object[] | null, cb: () => void) => void;
    socket: AdminConnection;
    /** The admin instance that tests the connection, e.g. `admin.0` */
    instance?: string;
}

/** How hard the model should think, for the OpenAI-compatible providers. The default sends nothing */
const REASONING_EFFORTS: { value: ReasoningEffort; label: string }[] = [
    { value: '', label: 'Endpoint default' },
    { value: 'none', label: 'Off (local models)' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

const ICON_SIZE = 20;

const styles: Record<string, React.CSSProperties> = {
    tabPanel: {
        width: '100%',
        height: '100%',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        boxSizing: 'border-box',
    },
    content: {
        maxWidth: 960,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    providerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    row: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        columnGap: 8,
        rowGap: 4,
    },
    field: {
        flex: '1 1 220px',
        minWidth: 0,
    },
    rowButton: {
        marginTop: 12,
    },
    credentialItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
};

function noop(): void {
    // the tabs have nothing to do after a change
}

/** The provider that is set up: a credential, or for the custom endpoint an address. `''` if none */
function getActiveProvider(native: AiNative): AiProvider | '' {
    const info = getAiProviderInfo(native.provider);
    if (!info) {
        return '';
    }
    if (native.credentialId) {
        return info.value;
    }
    return info.value === 'custom' && native.baseUrl ? 'custom' : '';
}

function ProviderIcon(props: { info: AiProviderInfo }): React.JSX.Element {
    return props.info.icon ? (
        <Icon
            src={props.info.icon}
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
    ) : (
        <TuneIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
    );
}

function getCredentialName(credential: ioBroker.Object): string {
    const name = credential.common?.name;
    return typeof name === 'string' && name ? name : credential._id.replace(CREDENTIALS_PREFIX, '');
}

/**
 * The "AI" tab of the system settings: the one AI provider of the system, its API key from the
 * central credential store and the model, stored in `system.ai`.
 *
 * Only one provider can be active. As long as one is set up, the others are not even shown - a key
 * for a second provider used to suggest that this one would be used.
 */
export default function AiSettingsDialog(props: AiSettingsDialogProps): React.JSX.Element {
    const native = (props.data?.native || {}) as AiNative;
    const credentials = props.dataAux || [];
    const aiCredentials = credentials.filter(credential => credential.native?.type === 'ai');

    const [models, setModels] = useState<string[]>([]);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [createFor, setCreateFor] = useState<AiProviderInfo | null>(null);
    // A late answer for a previous provider or key must not overwrite a newer one
    const requestRef = useRef(0);

    const active = getActiveProvider(native);
    const activeInfo = getAiProviderInfo(active);
    const disabled = props.saving;

    const update = (patch: Partial<AiNative>, newCredentials?: ioBroker.Object[]): void =>
        props.onChange(
            { ...props.data, native: { ...native, ...patch } } as ioBroker.Object,
            newCredentials || null,
            noop,
        );

    /** The model belongs to its provider: switching to another one starts without a model */
    const switchTo = (provider: AiProvider): Partial<AiNative> =>
        provider === native.provider ? { provider } : { provider, model: '' };

    const removeProvider = (): void => {
        setModels([]);
        setError('');
        setInfo('');
        update({ provider: '', credentialId: '', baseUrl: '', model: '' });
    };

    // The key travels to the backend only if it is not saved yet: a saved one is named by its ID
    const credential = aiCredentials.find(item => item._id === native.credentialId);
    const unsavedKey =
        typeof credential?.native?.key === 'string' && credential.native.key !== SOME_PASSWORD
            ? credential.native.key
            : '';
    const canTest = !!active && !!props.instance;

    const loadModels = (): void => {
        if (!canTest || !props.instance) {
            return;
        }
        const requestId = ++requestRef.current;
        setTesting(true);
        setError('');
        setInfo('');
        // The backend only talks to an AI endpoint for a known GUI session
        sendPushRequest<ChatTestResponse>(
            props.socket,
            props.instance,
            'chat:testConnection',
            {
                provider: active,
                credentialId: unsavedKey ? '' : native.credentialId,
                apiKey: unsavedKey || undefined,
                baseUrl: active === 'custom' ? native.baseUrl : '',
                allowSelfSignedCerts: !!native.allowSelfSignedCerts,
            },
            60_000,
        )
            .then(result => {
                if (requestId !== requestRef.current) {
                    return;
                }
                if (result?.error) {
                    setError(result.error);
                    setModels([]);
                } else {
                    // only what can chat: embeddings, speech and image models would only fail
                    const chatModels = (result?.models || []).filter(isChatModel);
                    setModels(chatModels);
                    setInfo(props.t('Connection OK: %s models', String(chatModels.length)));
                }
            })
            .catch(e => {
                if (requestId === requestRef.current) {
                    setError(String(e));
                }
            })
            .finally(() => {
                if (requestId === requestRef.current) {
                    setTesting(false);
                }
            });
    };

    // Load the models when the tab opens with a provider, and whenever the provider, the key or the
    // address changes - debounced, so typing an address does not send a request per character
    useEffect(() => {
        if (!canTest) {
            return undefined;
        }
        const timer = setTimeout(() => loadModels(), 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, native.credentialId, native.baseUrl, native.allowSelfSignedCerts, unsavedKey, props.instance]);

    const renderCredentialSelect = (providerInfo: AiProviderInfo): React.JSX.Element => {
        const value = native.provider === providerInfo.value ? native.credentialId || '' : '';
        const missing = !!value && !aiCredentials.find(item => item._id === value);
        const isCustom = providerInfo.value === 'custom';
        return (
            <FormControl
                variant="standard"
                style={styles.field}
                error={missing}
                disabled={disabled}
            >
                {/* `shrink`, because `displayEmpty` shows the "none" item, which MUI does not count as a value */}
                <InputLabel shrink>{props.t('API key (credential)')}</InputLabel>
                <Select
                    value={value}
                    displayEmpty
                    onChange={e => {
                        const credentialId = e.target.value;
                        update(credentialId ? { ...switchTo(providerInfo.value), credentialId } : { credentialId: '' });
                    }}
                >
                    <MenuItem value="">
                        <em>{props.t('none')}</em>
                    </MenuItem>
                    {aiCredentials.map(item => (
                        <MenuItem
                            key={item._id}
                            value={item._id}
                        >
                            <span style={styles.credentialItem}>
                                {typeof item.common?.icon === 'string' && item.common.icon ? (
                                    <Icon
                                        src={item.common.icon}
                                        style={{ width: ICON_SIZE, height: ICON_SIZE }}
                                    />
                                ) : null}
                                {getCredentialName(item)}
                            </span>
                        </MenuItem>
                    ))}
                    {missing ? (
                        <MenuItem value={value}>
                            {value.replace(CREDENTIALS_PREFIX, '')} ({props.t('Credential not found')})
                        </MenuItem>
                    ) : null}
                </Select>
                <FormHelperText>
                    {missing ? (
                        props.t('Credential not found')
                    ) : providerInfo.keyUrl ? (
                        <a
                            href={providerInfo.keyUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'inherit' }}
                        >
                            {new URL(providerInfo.keyUrl).host}
                        </a>
                    ) : isCustom ? (
                        props.t('Optional')
                    ) : null}
                </FormHelperText>
            </FormControl>
        );
    };

    const renderProvider = (providerInfo: AiProviderInfo): React.JSX.Element => {
        const isCustom = providerInfo.value === 'custom';
        const isActive = active === providerInfo.value;
        return (
            <div key={providerInfo.value}>
                <Typography
                    component="div"
                    style={styles.providerTitle}
                >
                    <ProviderIcon info={providerInfo} />
                    {providerInfo.label}
                </Typography>
                <div style={styles.row}>
                    {isCustom ? (
                        <TextField
                            variant="standard"
                            style={styles.field}
                            disabled={disabled}
                            label={props.t('Base URL')}
                            placeholder="http://127.0.0.1:11434/v1"
                            value={native.provider === 'custom' ? native.baseUrl || '' : ''}
                            slotProps={{ inputLabel: { shrink: true } }}
                            onChange={e => update({ ...switchTo('custom'), baseUrl: e.target.value })}
                        />
                    ) : null}
                    {renderCredentialSelect(providerInfo)}
                    <Tooltip title={props.t('Add credential')}>
                        <span style={styles.rowButton}>
                            <IconButton
                                disabled={disabled}
                                onClick={() => setCreateFor(providerInfo)}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        style={styles.rowButton}
                        disabled={disabled || !isActive || !canTest || testing}
                        startIcon={isActive && testing ? <CircularProgress size={16} /> : <TestIcon />}
                        onClick={loadModels}
                    >
                        {props.t('Test')}
                    </Button>
                    {isActive ? (
                        <Tooltip title={props.t('Remove provider')}>
                            <span style={styles.rowButton}>
                                <IconButton
                                    disabled={disabled}
                                    onClick={removeProvider}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.tabPanel}>
            <div style={styles.content}>
                <Typography variant="body2">
                    {props.t('Set up the AI once for the whole system. The AI assistant of admin uses these settings.')}
                </Typography>

                {activeInfo ? renderProvider(activeInfo) : AI_PROVIDER_INFO.map(item => renderProvider(item))}

                {activeInfo ? (
                    <>
                        <Alert severity="info">
                            {props.t('Only one AI provider can be active. To use another one, remove this one first.')}
                        </Alert>

                        {error ? <Alert severity="error">{error}</Alert> : null}
                        {info ? <Alert severity="success">{info}</Alert> : null}

                        <Autocomplete
                            freeSolo
                            disabled={disabled}
                            options={models}
                            value={native.model || ''}
                            onInputChange={(_e, model) => {
                                if ((model || '') !== (native.model || '')) {
                                    update({ model: model || '' });
                                }
                            }}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label={props.t('Model')}
                                    placeholder={
                                        active === 'openrouter'
                                            ? 'anthropic/claude-..., openai/gpt-...'
                                            : 'claude-..., gpt-...'
                                    }
                                />
                            )}
                        />

                        {active === 'custom' ? (
                            <FormControlLabel
                                disabled={disabled}
                                control={
                                    <Switch
                                        checked={!!native.allowSelfSignedCerts}
                                        onChange={e => update({ allowSelfSignedCerts: e.target.checked })}
                                    />
                                }
                                label={props.t('Allow self-signed certificates')}
                            />
                        ) : null}

                        {/* Only the OpenAI-compatible endpoints know the parameter */}
                        {active === 'custom' || active === 'openai' ? (
                            <FormControl
                                variant="standard"
                                disabled={disabled}
                            >
                                <InputLabel>{props.t('Reasoning effort')}</InputLabel>
                                <Select
                                    value={native.reasoningEffort || ''}
                                    onChange={e => update({ reasoningEffort: e.target.value })}
                                >
                                    {REASONING_EFFORTS.map(effort => (
                                        <MenuItem
                                            key={effort.value || 'default'}
                                            value={effort.value}
                                        >
                                            {props.t(effort.label)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : null}

                        {/* Only Anthropic insists on the parameter, so it is only offered for it */}
                        {active === 'anthropic' ? (
                            <TextField
                                variant="standard"
                                type="number"
                                disabled={disabled}
                                label={props.t('Maximum answer length')}
                                helperText={props.t('A longer answer is cut off when the limit is reached.')}
                                value={native.maxTokens || ''}
                                placeholder={String(DEFAULT_CHAT_MAX_TOKENS)}
                                slotProps={{
                                    htmlInput: { min: MIN_CHAT_MAX_TOKENS, max: MAX_CHAT_MAX_TOKENS, step: 1024 },
                                }}
                                // An empty field means "use the default": the backend falls back to it
                                onChange={e => update({ maxTokens: parseInt(e.target.value, 10) || 0 })}
                            />
                        ) : null}

                        <Alert severity="warning">
                            {props.t('The objects, states and logs will be processed by your AI provider.')}
                        </Alert>
                    </>
                ) : null}
            </div>

            {createFor ? (
                <AiCredentialDialog
                    provider={createFor}
                    existingIds={credentials.map(item => item._id)}
                    onClose={created => {
                        const provider = createFor.value;
                        setCreateFor(null);
                        if (created) {
                            // the new key is selected right away for the provider it was created for
                            update({ ...switchTo(provider), credentialId: created._id }, [...credentials, created]);
                        }
                    }}
                />
            ) : null}
        </div>
    );
}
