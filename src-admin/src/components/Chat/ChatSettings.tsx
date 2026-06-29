import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { I18n, type AdminConnection, Icon } from '@iobroker/adapter-react-v5';

import type {
    AiCredentialEntry,
    AiProvider,
    ChatProvidersResponse,
    ChatSettingsValue,
    ChatTestResponse,
} from './chatTypes';

interface ChatSettingsProps {
    socket: AdminConnection;
    /** Admin instance id, e.g. `admin.0`. */
    instance: string;
    value: ChatSettingsValue;
    /** Tool names the user granted blanket approval for ("don't ask again"). */
    autoApprove: string[];
    /** Update the blanket-approval list (applied immediately, persisted by the panel). */
    onChangeAutoApprove: (tools: string[]) => void;
    /** Called with the new value on save, or `undefined` on cancel. */
    onClose: (value?: ChatSettingsValue) => void;
}

const PROVIDERS: { value: AiProvider; label: string }[] = [
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

function renderCredentialItem(option: AiCredentialEntry | undefined, anyIcon: boolean): React.JSX.Element {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {option?.icon ? (
                <Icon
                    src={option.icon}
                    style={{ width: 20, height: 20 }}
                />
            ) : anyIcon ? (
                // if at least one option has an icon, keep the labels aligned
                <span style={{ width: 20, height: 20, flexShrink: 0 }} />
            ) : null}
            {option.name || option.id.replace('system.credentials.', '')}
        </span>
    );
}

/** Settings dialog: pick the AI provider, the stored credential and the model for the chat helper. */
export default function ChatSettings(props: ChatSettingsProps): React.JSX.Element {
    const [value, setValue] = useState<ChatSettingsValue>({ ...props.value });
    const [credentials, setCredentials] = useState<AiCredentialEntry[]>([]);
    const [anyIcons, setAnyIcons] = useState<boolean>(false);
    const [models, setModels] = useState<string[]>([]);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    useEffect(() => {
        props.socket
            .sendTo(props.instance, 'chat:getProviders', null)
            .then((result: ChatProvidersResponse) => {
                setCredentials(result?.providers || []);
                setAnyIcons(result?.providers?.some(p => p.icon) ?? false);
            })
            .catch(e => setError(e.toString()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const update = (patch: Partial<ChatSettingsValue>): void => setValue(prev => ({ ...prev, ...patch }));

    /** Whether enough is configured to query the provider for its models. */
    const canTest = (v: ChatSettingsValue): boolean =>
        v.provider === 'custom' ? !!v.baseUrl || !!v.credentialId : !!v.credentialId;

    // Monotonic request id so a late response from a previous provider/key can't overwrite a newer one.
    const reqRef = useRef(0);

    const loadModels = (): void => {
        const reqId = ++reqRef.current;
        setTesting(true);
        setError('');
        setInfo('');
        setModels([]);
        props.socket
            .sendTo(props.instance, 'chat:testConnection', {
                provider: value.provider,
                credentialId: value.credentialId,
                baseUrl: value.baseUrl,
                allowSelfSignedCerts: value.allowSelfSignedCerts,
            })
            .then((result: ChatTestResponse) => {
                if (reqId !== reqRef.current) {
                    return; // a newer request superseded this one
                }
                if (result?.error) {
                    setError(result.error);
                    setModels([]);
                } else {
                    setModels(result?.models || []);
                    setInfo(I18n.t('Connection OK: %s models', String(result?.count ?? result?.models?.length ?? 0)));
                }
            })
            .catch(e => {
                if (reqId === reqRef.current) {
                    setError(e.toString());
                }
            })
            .finally(() => {
                if (reqId === reqRef.current) {
                    setTesting(false);
                }
            });
    };

    // Load the models automatically when the dialog opens with a credential already selected, and
    // whenever the provider / credential / base URL changes (debounced so typing a URL doesn't spam).
    useEffect(() => {
        if (!canTest(value)) {
            setModels([]);
            return;
        }
        const timer = setTimeout(() => loadModels(), 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.provider, value.credentialId, value.baseUrl, value.allowSelfSignedCerts]);

    const isCustom = value.provider === 'custom';

    return (
        <Dialog
            open
            onClose={() => props.onClose()}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>{I18n.t('AI assistant settings')}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                <FormControl
                    fullWidth
                    variant="standard"
                >
                    <InputLabel>{I18n.t('Provider')}</InputLabel>
                    <Select
                        value={value.provider}
                        onChange={e => update({ provider: e.target.value as AiProvider })}
                    >
                        {PROVIDERS.map(p => (
                            <MenuItem
                                key={p.value}
                                value={p.value}
                            >
                                {p.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl
                    fullWidth
                    variant="standard"
                >
                    {/* `shrink` is required because `displayEmpty` shows the "none" item, so MUI
                        cannot auto-detect a value and would otherwise overlap the label with it. */}
                    <InputLabel shrink>{I18n.t('API key (credential)')}</InputLabel>
                    <Select
                        value={value.credentialId}
                        onChange={e => update({ credentialId: e.target.value })}
                        displayEmpty
                    >
                        <MenuItem value="">
                            <em>{I18n.t('none')}</em>
                        </MenuItem>
                        {credentials.map(c => (
                            <MenuItem
                                key={c.id}
                                value={c.id}
                            >
                                {renderCredentialItem(c, anyIcons)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {isCustom ? (
                    <>
                        <TextField
                            variant="standard"
                            label={I18n.t('Base URL')}
                            placeholder="http://127.0.0.1:11434/v1"
                            value={value.baseUrl}
                            onChange={e => update({ baseUrl: e.target.value })}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={value.allowSelfSignedCerts}
                                    onChange={e => update({ allowSelfSignedCerts: e.target.checked })}
                                />
                            }
                            label={I18n.t('Allow self-signed certificates')}
                        />
                    </>
                ) : null}

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <Autocomplete
                        style={{ flex: 1 }}
                        freeSolo
                        options={models}
                        value={value.model}
                        onInputChange={(_e, newValue) => update({ model: newValue || '' })}
                        renderInput={params => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={I18n.t('Model')}
                                placeholder="claude-..., gpt-..."
                            />
                        )}
                    />
                    <Button
                        onClick={loadModels}
                        disabled={testing}
                        startIcon={testing ? <CircularProgress size={16} /> : null}
                    >
                        {I18n.t('Load models')}
                    </Button>
                </div>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {info ? <Alert severity="success">{info}</Alert> : null}

                {canTest(value) ? (
                    <Alert severity="warning">
                        {I18n.t('The objects, states and logs will be processed by your AI provider.')}
                    </Alert>
                ) : null}

                <div>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={value.hideFab}
                                onChange={e => update({ hideFab: e.target.checked })}
                            />
                        }
                        label={I18n.t('Hide assistant button')}
                    />
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        component="div"
                        style={{ marginLeft: 14 }}
                    >
                        {I18n.t('When hidden, move the mouse to the bottom-right corner to reveal it.')}
                    </Typography>
                </div>

                {props.autoApprove.length ? (
                    <div>
                        <Typography
                            variant="caption"
                            color="textSecondary"
                        >
                            {I18n.t('Operations approved without asking (click to revoke):')}
                        </Typography>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                            {props.autoApprove.map(tool => (
                                <Chip
                                    key={tool}
                                    label={tool}
                                    size="small"
                                    onDelete={() =>
                                        props.onChangeAutoApprove(props.autoApprove.filter(entry => entry !== tool))
                                    }
                                />
                            ))}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={() => props.onClose(value)}
                >
                    {I18n.t('Save')}
                </Button>
                <Button
                    color="grey"
                    startIcon={<CloseIcon />}
                    onClick={() => props.onClose()}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
