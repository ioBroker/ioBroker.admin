import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { I18n, Utils, Icon } from '@iobroker/gui-components';

import { SECRET_INPUT_STYLE } from '@/helpers/utils';
import { CREDENTIALS_PREFIX, CREDENTIALS_VERSION, CREDENTIAL_FORMS } from './credentialTypes';
import { CREDENTIAL_ICON_DATA } from './credentialIcons';
import type { AiProviderInfo } from './aiProviders';

interface AiCredentialDialogProps {
    /** The provider the key is for - drives the proposed name and the icon */
    provider: AiProviderInfo;
    /** Existing credential ids (e.g. `system.credentials.anthropic`), to reject a duplicate name */
    existingIds: string[];
    /**
     * Closed without creating (`undefined`) or with the new credential. Its key is still in plain
     * text: the system settings encrypt it on the backend when they are saved, like every credential
     */
    onClose: (credential?: ioBroker.Object) => void;
}

/**
 * Create a new `ai` credential (a single API key) right from the AI settings, without going to the
 * "Credentials" tab - it lands in the same list as one created there.
 */
export default function AiCredentialDialog(props: AiCredentialDialogProps): React.JSX.Element {
    const icon = props.provider.icon || CREDENTIAL_ICON_DATA.key;
    const [name, setName] = useState<string>(props.provider.credentialName);
    const [apiKey, setApiKey] = useState<string>('');
    const [keyVisible, setKeyVisible] = useState(false);

    const safeName = name.trim().replace(Utils.FORBIDDEN_CHARS, '_');
    const id = `${CREDENTIALS_PREFIX}${safeName}`;
    const duplicate = !!safeName && props.existingIds.includes(id);
    const canCreate = !!safeName && !duplicate && !!apiKey.trim();

    const create = (): void => {
        if (!canCreate) {
            return;
        }
        // The `ai` credential uses the single-key form; only its `key` field is stored encrypted
        const fields = CREDENTIAL_FORMS.key;
        props.onClose({
            _id: id,
            type: 'config',
            common: { name: safeName, icon },
            native: {
                type: 'ai',
                form: 'key',
                version: CREDENTIALS_VERSION,
                encryptedFields: fields.filter(field => field.encrypted).map(field => field.name),
                key: apiKey.trim(),
            },
            // Only the admin may read credentials
            acl: {
                object: 0x600,
                owner: 'system.user.admin',
                ownerGroup: 'system.group.administrator',
            },
        } as unknown as ioBroker.Object);
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
                                        src={icon}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    onChange={e => setName(e.target.value)}
                />
                <TextField
                    variant="standard"
                    fullWidth
                    // No `type="password"`: that would hand the API key to the password manager of the browser,
                    // which offers to generate a password for it. It is masked by CSS instead.
                    type="text"
                    required
                    label={I18n.t('API key')}
                    value={apiKey}
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: false,
                            style: keyVisible ? undefined : SECRET_INPUT_STYLE,
                        },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        tabIndex={-1}
                                        size="small"
                                        edge="end"
                                        disabled={!apiKey}
                                        aria-label={I18n.t(keyVisible ? 'Hide password' : 'Show password')}
                                        title={I18n.t(keyVisible ? 'Hide password' : 'Show password')}
                                        onClick={() => setKeyVisible(!keyVisible)}
                                    >
                                        {keyVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && canCreate) {
                            e.preventDefault();
                            create();
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!canCreate}
                    startIcon={<CheckIcon />}
                    onClick={create}
                >
                    {I18n.t('Create')}
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
