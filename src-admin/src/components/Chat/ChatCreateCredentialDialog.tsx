import React, { useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    TextField,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { I18n, Utils, Icon, type AdminConnection } from '@iobroker/adapter-react-v5';

import { CREDENTIALS_PREFIX, CREDENTIALS_VERSION, CREDENTIAL_FORMS } from '../SystemSettings/credentialTypes';
import { CREDENTIAL_ICON_DATA } from '../SystemSettings/credentialIcons';
import type { AiProvider } from './chatTypes';

/** Suggested unique name and icon for a freshly created credential, by provider. */
const PROVIDER_DEFAULTS: Record<AiProvider, { name: string; icon: string }> = {
    anthropic: { name: 'anthropic', icon: CREDENTIAL_ICON_DATA.anthropic },
    openai: { name: 'chatgpt', icon: CREDENTIAL_ICON_DATA.chatgpt },
    gemini: { name: 'gemini', icon: CREDENTIAL_ICON_DATA.gemini },
    deepseek: { name: 'deepseek', icon: CREDENTIAL_ICON_DATA.deepseek },
    custom: { name: 'custom', icon: CREDENTIAL_ICON_DATA.key },
};

interface ChatCreateCredentialDialogProps {
    socket: AdminConnection;
    /** The AI provider currently selected in the settings — drives the proposed name and icon. */
    provider: AiProvider;
    /** Existing credential ids (e.g. `system.credentials.anthropic`), to reject a duplicate name. */
    existingIds: string[];
    /** Closed without creating (`undefined`) or with the id of the newly created credential. */
    onClose: (createdId?: string) => void;
}

/**
 * Create a new `ai` credential (a single encrypted API key) right from the assistant settings —
 * the same store the System Settings "Credentials" dialog writes to, so it does not have to be
 * left to add a key. The key is encrypted on the backend (the system secret never leaves it).
 */
export default function ChatCreateCredentialDialog(props: ChatCreateCredentialDialogProps): React.JSX.Element {
    const defaults = PROVIDER_DEFAULTS[props.provider] || PROVIDER_DEFAULTS.custom;
    const [name, setName] = useState<string>(defaults.name);
    const [apiKey, setApiKey] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const safeName = name.trim().replace(Utils.FORBIDDEN_CHARS, '_');
    const id = `${CREDENTIALS_PREFIX}${safeName}`;
    const duplicate = !!safeName && props.existingIds.includes(id);
    const canCreate = !!safeName && !duplicate && !!apiKey.trim() && !saving;

    const create = async (): Promise<void> => {
        if (!safeName) {
            setError(I18n.t('A unique name is required'));
            return;
        }
        if (duplicate) {
            setError(I18n.t('A credential with this name already exists'));
            return;
        }
        if (!apiKey.trim()) {
            return;
        }
        setSaving(true);
        setError('');
        try {
            // The `ai` credential uses the single-key form; only its `key` field is stored encrypted.
            const fields = CREDENTIAL_FORMS.key;
            const native: Record<string, unknown> = {
                type: 'ai',
                version: CREDENTIALS_VERSION,
                encryptedFields: fields.filter(field => field.encrypted).map(field => field.name),
                key: await props.socket.encrypt(apiKey.trim()),
            };
            const obj = {
                _id: id,
                type: 'config',
                common: { name: safeName, icon: defaults.icon },
                native,
                // Only the admin may read credentials.
                acl: {
                    object: 0x600,
                    owner: 'system.user.admin',
                    ownerGroup: 'system.group.administrator',
                },
            } as unknown as ioBroker.Object;
            await props.socket.setObject(id, obj);
            props.onClose(id);
        } catch (e) {
            setSaving(false);
            setError(I18n.t('Cannot create credential: %s', e instanceof Error ? e.message : String(e)));
        }
    };

    return (
        <Dialog
            open
            maxWidth="sm"
            fullWidth
            onClose={() => props.onClose()}
        >
            <DialogTitle>{I18n.t('Add credential')}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                <TextField
                    variant="standard"
                    fullWidth
                    label={I18n.t('Unique name')}
                    value={name}
                    error={duplicate}
                    helperText={duplicate ? I18n.t('A credential with this name already exists') : safeName ? id : ''}
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { autoComplete: 'off' },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon
                                        src={defaults.icon}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    onChange={e => {
                        setName(e.target.value);
                        setError('');
                    }}
                />
                <TextField
                    variant="standard"
                    fullWidth
                    type="password"
                    required
                    label={I18n.t('API key')}
                    value={apiKey}
                    slotProps={{
                        inputLabel: { shrink: true },
                        // "new-password" suppresses the browser autofill on the key field
                        htmlInput: { autoComplete: 'new-password' },
                    }}
                    onChange={e => {
                        setApiKey(e.target.value);
                        setError('');
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && canCreate) {
                            e.preventDefault();
                            void create();
                        }
                    }}
                />
                {error ? <Alert severity="error">{error}</Alert> : null}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!canCreate}
                    startIcon={<CheckIcon />}
                    onClick={() => void create()}
                >
                    {I18n.t('Create')}
                </Button>
                <Button
                    color="grey"
                    disabled={saving}
                    startIcon={<CloseIcon />}
                    onClick={() => props.onClose()}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
