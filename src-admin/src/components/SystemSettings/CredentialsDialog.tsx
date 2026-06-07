import React, { type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';

import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Cloud as CloudIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Email as EmailIcon,
    Key as KeyIcon,
    Person as PersonIcon,
    SmartToy as SmartToyIcon,
    Tune as TuneIcon,
} from '@mui/icons-material';

import { DialogConfirm, type AdminConnection, type Translate, Utils } from '@iobroker/adapter-react-v5';

import IoBrokerLogo from '@/assets/logo.svg';
import AdminUtils from '../../helpers/AdminUtils';
import BaseSystemSettingsDialog from './BaseSystemSettingsDialog';
import {
    CREDENTIALS_PREFIX,
    CREDENTIALS_VERSION,
    CREDENTIAL_FORMS,
    CREDENTIAL_TYPES,
    SOME_PASSWORD,
    getCredentialForm,
    type CredentialFieldDefinition,
    type CredentialForm,
    type CredentialType,
} from './credentialTypes';

const styles: Record<string, React.CSSProperties> = {
    tabPanel: {
        width: '100%',
        height: '100% ',
        overflow: 'auto',
        overflowX: 'hidden',
        padding: 15,
        position: 'relative',
    },
    buttonPanel: {
        paddingBottom: 20,
        display: 'flex',
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginLeft: 40,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
    },
    littleRow: {
        width: 110,
    },
    iconRow: {
        width: 40,
    },
    actionsRow: {
        width: 110,
        whiteSpace: 'nowrap',
    },
    input: {
        width: '100%',
    },
    field: {
        width: '100%',
        marginBottom: 16,
    },
    templateItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
};

const ICON_SIZE = 20;

/** SVG paths in 24x24 viewBox: brand logos from https://simpleicons.org (CC0), the rest are Material icons */
const ICON_PATHS = {
    anthropic:
        'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5527h3.7442L10.5363 3.541Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
    chatgpt:
        'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654 2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
    email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
    login: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    key: 'M21 10h-8.35A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H13l2 2 2-2 2 2 4-4.04L21 10zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z',
};

/** Converts an SVG path to a base64 data URL, as it is stored in `common.icon` */
function svgDataUrl(path: string, color: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/** Icons (data URLs) per template key - stored in `common.icon` of new credentials and shown in the UI */
const ICON_DATA: Record<string, string> = {
    anthropic: svgDataUrl(ICON_PATHS.anthropic, '#d97757'),
    chatgpt: svgDataUrl(ICON_PATHS.chatgpt, '#74aa9c'),
    email: svgDataUrl(ICON_PATHS.email, '#2196f3'),
    login: svgDataUrl(ICON_PATHS.login, '#9e9e9e'),
    key: svgDataUrl(ICON_PATHS.key, '#ffc107'),
};

function CredentialIcon(props: { src: string }): JSX.Element {
    return (
        <img
            src={props.src}
            width={ICON_SIZE}
            height={ICON_SIZE}
            alt=""
        />
    );
}

/** Resolves the icon data URL that should be stored in `common.icon` for a template */
async function getTemplateIconData(templateKey: string): Promise<string | undefined> {
    if (ICON_DATA[templateKey]) {
        return ICON_DATA[templateKey];
    }
    if (templateKey === 'iobroker.pro' || templateKey === 'iobroker.net') {
        try {
            // the logo is a bundled asset (URL), so it must be fetched to embed it as base64
            const response = await fetch(IoBrokerLogo);
            const svg = await response.text();
            return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        } catch (e) {
            console.error(`Cannot read ioBroker logo: ${e}`);
        }
    }
    return undefined;
}

interface CredentialTemplate {
    /** Label in the template selector */
    label: string;
    /** The label is a translation key */
    translate?: boolean;
    /** Icon shown in the template selector and the table */
    icon: JSX.Element;
    /** Form of the credential: login/password or a single key */
    form: CredentialForm;
    /** Fixed category, or null if the user selects it */
    type: CredentialType | null;
    /** Proposed unique name */
    name?: string;
    /** The unique name cannot be changed, and the template is hidden as soon as the credential exists */
    fixedName?: boolean;
}

/** Templates offered in the "Add credential" dialog */
const CREDENTIAL_TEMPLATES: Record<string, CredentialTemplate> = {
    anthropic: {
        label: 'Anthropic',
        icon: <CredentialIcon src={ICON_DATA.anthropic} />,
        form: 'key',
        type: 'ai',
        name: 'anthropic',
    },
    chatgpt: {
        label: 'ChatGPT',
        icon: <CredentialIcon src={ICON_DATA.chatgpt} />,
        form: 'key',
        type: 'ai',
        name: 'chatgpt',
    },
    email: {
        label: 'credential_type_email',
        translate: true,
        icon: <CredentialIcon src={ICON_DATA.email} />,
        form: 'login',
        type: 'email',
    },
    'iobroker.pro': {
        label: 'iobroker.pro',
        icon: <CredentialIcon src={IoBrokerLogo} />,
        form: 'login',
        type: 'cloud',
        name: 'iobroker-pro',
        fixedName: true,
    },
    'iobroker.net': {
        label: 'iobroker.net',
        icon: <CredentialIcon src={IoBrokerLogo} />,
        form: 'login',
        type: 'cloud',
        name: 'iobroker-net',
        fixedName: true,
    },
    login: {
        label: 'Login/password',
        translate: true,
        icon: <CredentialIcon src={ICON_DATA.login} />,
        form: 'login',
        type: null,
    },
    key: { label: 'Key', translate: true, icon: <CredentialIcon src={ICON_DATA.key} />, form: 'key', type: null },
};

/** Icons of the credential categories */
const CREDENTIAL_TYPE_ICONS: Record<CredentialType, JSX.Element> = {
    email: <EmailIcon fontSize="small" />,
    cloud: <CloudIcon fontSize="small" />,
    ai: <SmartToyIcon fontSize="small" />,
    custom: <TuneIcon fontSize="small" />,
};

/**
 * Finds the icon for a stored credential: `common.icon` if set, then by matching
 * a template (e.g. `system.credentials.anthropic`), then by category/form.
 */
function getCredentialIcon(credential: ioBroker.Object): JSX.Element {
    if (typeof credential.common?.icon === 'string' && credential.common.icon) {
        return <CredentialIcon src={credential.common.icon} />;
    }
    const template = Object.values(CREDENTIAL_TEMPLATES).find(
        item => item.name && credential._id === `${CREDENTIALS_PREFIX}${item.name}`,
    );
    if (template) {
        return template.icon;
    }
    if (credential.native.type === 'email') {
        return <EmailIcon fontSize="small" />;
    }
    return getCredentialForm(credential.native) === 'key' ? (
        <KeyIcon fontSize="small" />
    ) : (
        <PersonIcon fontSize="small" />
    );
}

interface CredentialsDialogProps {
    t: Translate;
    data: ioBroker.Object[];
    onChange: (data: ioBroker.Object[]) => void;
    saving: boolean;
    socket: AdminConnection;
}

interface UsageEntry {
    /** Instance that references the credential, e.g. `iot.0` */
    instance: string;
    /** Icon URL of the adapter, e.g. `adapter/iot/iot.png` */
    icon?: string;
}

interface CredentialsDialogState {
    /** Index of the currently edited credential or null */
    editIndex: number | null;
    /** Dialog to create a new credential */
    addOpen: boolean;
    /** Selected template in the add dialog */
    addTemplate: string;
    /** Selected category, if the template does not define one */
    addType: CredentialType;
    addName: string;
    /** Index of the credential that should be deleted (confirmation dialog) */
    deleteIndex: number | null;
    /** Map of credential ID to instances that reference it */
    usage: Record<string, UsageEntry[]>;
}

export default class CredentialsDialog extends BaseSystemSettingsDialog<
    CredentialsDialogProps,
    CredentialsDialogState
> {
    constructor(props: CredentialsDialogProps) {
        super(props);

        this.state = {
            editIndex: null,
            addOpen: false,
            addTemplate: 'login',
            addType: 'email',
            addName: '',
            deleteIndex: null,
            usage: {},
        };
    }

    componentDidMount(): void {
        // Find out which instances reference which credential
        void this.props.socket
            .getAdapterInstances(true)
            .then(instances => {
                const usage: Record<string, UsageEntry[]> = {};
                instances.forEach(instance => {
                    const text = JSON.stringify(instance.native || {});
                    const matches = text.match(/system\.credentials\.[0-9A-Za-z_.-]+/g);
                    if (matches) {
                        const instanceId = instance._id.replace('system.adapter.', '');
                        let icon = instance.common?.icon;
                        if (icon && !icon.startsWith('data:image') && !icon.includes('/')) {
                            icon = `adapter/${instance.common.name}/${icon}`;
                        }
                        [...new Set(matches)].forEach(id => {
                            usage[id] = usage[id] || [];
                            usage[id].push({ instance: instanceId, icon });
                        });
                    }
                });
                this.setState({ usage });
            })
            .catch(e => console.error(`Cannot read instances: ${e}`));
    }

    onChangeCredential(index: number, credential: ioBroker.Object): void {
        const data = AdminUtils.clone(this.props.data);
        data[index] = credential;
        this.props.onChange(data);
    }

    getTemplateLabel(key: string): string {
        const template = CREDENTIAL_TEMPLATES[key];
        return template.translate ? this.props.t(template.label) : template.label;
    }

    async onAdd(): Promise<void> {
        const template = CREDENTIAL_TEMPLATES[this.state.addTemplate];
        const type: CredentialType = template.type || this.state.addType;
        const name = (template.fixedName ? template.name : this.state.addName.trim()).replace(
            Utils.FORBIDDEN_CHARS,
            '_',
        );
        const id = `${CREDENTIALS_PREFIX}${name}`;
        const fields = CREDENTIAL_FORMS[template.form];
        const native: Record<string, any> = {
            type,
            version: CREDENTIALS_VERSION,
            encryptedFields: fields.filter(field => field.encrypted).map(field => field.name),
        };
        fields.forEach(field => {
            native[field.name] = '';
        });

        const obj: ioBroker.Object = {
            _id: id,
            type: 'config',
            common: {
                name: template.fixedName ? this.getTemplateLabel(this.state.addTemplate) : this.state.addName.trim(),
                icon: await getTemplateIconData(this.state.addTemplate),
            },
            native,
            // Only the admin may read credentials
            acl: {
                object: 0x600,
                owner: 'system.user.admin',
                ownerGroup: 'system.group.administrator',
            },
        };

        const data = AdminUtils.clone(this.props.data);
        data.push(obj);
        this.setState(
            {
                addOpen: false,
                editIndex: data.length - 1,
            },
            () => this.props.onChange(data),
        );
    }

    onDelete(index: number): void {
        const data = AdminUtils.clone(this.props.data);
        data.splice(index, 1);
        this.setState({ deleteIndex: null }, () => this.props.onChange(data));
    }

    static getName(obj: ioBroker.Object): string {
        const name = obj.common?.name;
        if (name && typeof name === 'object') {
            return (name as Record<string, string>).en || Object.values(name)[0] || '';
        }
        return (name as string) || '';
    }

    /**
     * Renders one input field of the edit dialog.
     * Enter jumps to the next field (`nextField`) or, in the last field, applies the dialog.
     */
    renderTypedField(
        credential: ioBroker.Object,
        field: CredentialFieldDefinition,
        index: number,
        nextField: string | null,
    ): JSX.Element {
        const value = credential.native[field.name];

        return (
            <TextField
                key={field.name}
                id={`credential_${field.name}`}
                variant="standard"
                style={styles.field}
                type={field.type === 'password' ? 'password' : 'text'}
                label={this.props.t(field.label)}
                value={value === undefined || value === null ? '' : value}
                disabled={this.props.saving}
                required={field.required}
                error={field.required && !value}
                slotProps={{
                    inputLabel: { shrink: true },
                    // "new-password" suppresses the browser autofill on password/key fields
                    htmlInput: { autoComplete: field.type === 'password' ? 'new-password' : 'off' },
                }}
                onChange={e => {
                    const newCredential = AdminUtils.clone(credential);
                    newCredential.native[field.name] = e.target.value;
                    this.onChangeCredential(index, newCredential);
                }}
                onFocus={field.type === 'password' && value === SOME_PASSWORD ? e => e.target.select() : undefined}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (nextField) {
                            // e.g. login -> password
                            document.getElementById(`credential_${nextField}`)?.focus();
                        } else {
                            // last field (password/key) applies the dialog
                            this.setState({ editIndex: null });
                        }
                    }
                }}
            />
        );
    }

    renderEditDialog(): JSX.Element | null {
        if (this.state.editIndex === null) {
            return null;
        }
        const index = this.state.editIndex;
        const credential = this.props.data[index];
        if (!credential) {
            return null;
        }
        const form = getCredentialForm(credential.native);
        const fields = CREDENTIAL_FORMS[form];

        return (
            <Dialog
                open={!0}
                maxWidth="md"
                fullWidth
                onClose={() => this.setState({ editIndex: null })}
            >
                <DialogTitle>{`${this.props.t('Edit credential')}: ${credential._id}`}</DialogTitle>
                <DialogContent>
                    <TextField
                        variant="standard"
                        style={styles.field}
                        label={this.props.t('Display name')}
                        value={CredentialsDialog.getName(credential)}
                        disabled={this.props.saving}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'off' } }}
                        onChange={e => {
                            const newCredential = AdminUtils.clone(credential);
                            newCredential.common.name = e.target.value;
                            this.onChangeCredential(index, newCredential);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // jump to the first credential field
                                document.getElementById(`credential_${fields[0].name}`)?.focus();
                            }
                        }}
                    />
                    {fields.map((field, fieldIndex) =>
                        this.renderTypedField(credential, field, index, fields[fieldIndex + 1]?.name || null),
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckIcon />}
                        onClick={() => this.setState({ editIndex: null })}
                    >
                        {this.props.t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    /** Templates that may be offered: fixed-name templates are hidden as soon as the credential exists */
    getAvailableTemplates(): string[] {
        return Object.keys(CREDENTIAL_TEMPLATES).filter(key => {
            const template = CREDENTIAL_TEMPLATES[key];
            if (!template.fixedName) {
                return true;
            }
            const id = `${CREDENTIALS_PREFIX}${template.name}`;
            return !this.props.data.find(credential => credential._id === id);
        });
    }

    renderAddDialog(): JSX.Element | null {
        if (!this.state.addOpen) {
            return null;
        }
        const template = CREDENTIAL_TEMPLATES[this.state.addTemplate];
        const type: CredentialType = template.type || this.state.addType;
        const name = template.fixedName ? template.name : this.state.addName.trim();
        const id = `${CREDENTIALS_PREFIX}${name.replace(Utils.FORBIDDEN_CHARS, '_')}`;
        const idError =
            name && this.props.data.find(credential => credential._id === id)
                ? this.props.t('A credential with this name already exists')
                : '';

        return (
            <Dialog
                open={!0}
                maxWidth="sm"
                fullWidth
                onClose={() => this.setState({ addOpen: false })}
            >
                <DialogTitle>{this.props.t('Add credential')}</DialogTitle>
                <DialogContent>
                    <FormControl
                        variant="standard"
                        style={styles.field}
                    >
                        <InputLabel shrink>{this.props.t('Template')}</InputLabel>
                        <Select
                            variant="standard"
                            value={this.state.addTemplate}
                            onChange={e =>
                                this.setState({
                                    addTemplate: e.target.value,
                                    addName: CREDENTIAL_TEMPLATES[e.target.value].name || '',
                                })
                            }
                        >
                            {this.getAvailableTemplates().map(key => (
                                <MenuItem
                                    key={key}
                                    value={key}
                                >
                                    <span style={styles.templateItem}>
                                        {CREDENTIAL_TEMPLATES[key].icon}
                                        {this.getTemplateLabel(key)}
                                    </span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl
                        variant="standard"
                        style={styles.field}
                    >
                        <InputLabel shrink>{this.props.t('Credential type')}</InputLabel>
                        <Select
                            variant="standard"
                            value={type}
                            disabled={!!template.type}
                            onChange={e => this.setState({ addType: e.target.value as CredentialType })}
                        >
                            {CREDENTIAL_TYPES.map(type_ => (
                                <MenuItem
                                    key={type_}
                                    value={type_}
                                >
                                    <span style={styles.templateItem}>
                                        {CREDENTIAL_TYPE_ICONS[type_]}
                                        {this.props.t(`credential_type_${type_}`)}
                                    </span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        variant="standard"
                        style={styles.field}
                        label={this.props.t('Unique name')}
                        value={template.fixedName ? template.name : this.state.addName}
                        disabled={!!template.fixedName}
                        error={!!idError}
                        helperText={idError || (name ? id : '')}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'off' } }}
                        onChange={e => this.setState({ addName: e.target.value })}
                        onKeyDown={e => {
                            // Enter applies the dialog
                            if (e.key === 'Enter' && name && !idError) {
                                e.preventDefault();
                                void this.onAdd();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!name || !!idError}
                        startIcon={<CheckIcon />}
                        onClick={() => void this.onAdd()}
                    >
                        {this.props.t('Create')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        startIcon={<CloseIcon />}
                        onClick={() => this.setState({ addOpen: false })}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderDeleteDialog(): JSX.Element | null {
        if (this.state.deleteIndex === null) {
            return null;
        }
        const credential = this.props.data[this.state.deleteIndex];
        const usedBy = this.state.usage[credential._id];

        return (
            <DialogConfirm
                title={this.props.t('Delete credential')}
                text={
                    this.props.t('Really delete credential %s?', credential._id) +
                    (usedBy
                        ? ` ${this.props.t('This credential is used by')}: ${usedBy.map(entry => entry.instance).join(', ')}`
                        : '')
                }
                onClose={result => {
                    if (result) {
                        this.onDelete(this.state.deleteIndex);
                    } else {
                        this.setState({ deleteIndex: null });
                    }
                }}
            />
        );
    }

    render(): JSX.Element {
        const rows = this.props.data.map((credential, index) => {
            const usedBy = this.state.usage[credential._id];
            return (
                <TableRow key={credential._id}>
                    <TableCell style={styles.iconRow}>{getCredentialIcon(credential)}</TableCell>
                    <TableCell style={styles.littleRow}>
                        {this.props.t(`credential_type_${credential.native.type}`)}
                    </TableCell>
                    <TableCell>{credential._id.substring(CREDENTIALS_PREFIX.length)}</TableCell>
                    <TableCell>{CredentialsDialog.getName(credential)}</TableCell>
                    <TableCell>
                        {usedBy ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                {usedBy.map(entry => (
                                    <span
                                        key={entry.instance}
                                        style={styles.templateItem}
                                    >
                                        {entry.icon ? (
                                            <img
                                                src={entry.icon}
                                                width={ICON_SIZE}
                                                height={ICON_SIZE}
                                                alt=""
                                            />
                                        ) : null}
                                        {entry.instance}
                                    </span>
                                ))}
                            </span>
                        ) : null}
                    </TableCell>
                    <TableCell style={styles.actionsRow}>
                        <IconButton
                            disabled={this.props.saving}
                            onClick={() => this.setState({ editIndex: index })}
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            disabled={this.props.saving}
                            onClick={() => this.setState({ deleteIndex: index })}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
            );
        });

        return (
            <div style={styles.tabPanel}>
                <div style={styles.buttonPanel}>
                    <Fab
                        disabled={this.props.saving}
                        size="small"
                        className="small_size"
                        color="primary"
                        aria-label="add"
                        onClick={() => this.setState({ addOpen: true, addName: '', addTemplate: 'login' })}
                    >
                        <AddIcon />
                    </Fab>
                    <Paper
                        variant="outlined"
                        style={styles.descriptionPanel}
                    >
                        {this.props.t('credentials_hint')}
                    </Paper>
                </div>
                <TableContainer>
                    <Table
                        aria-label="credentials table"
                        style={{ tableLayout: 'fixed', width: '100%' }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell style={styles.iconRow}> </TableCell>
                                <TableCell style={styles.littleRow}>{this.props.t('Credential type')}</TableCell>
                                <TableCell>{this.props.t('ID')}</TableCell>
                                <TableCell>{this.props.t('Name')}</TableCell>
                                <TableCell>{this.props.t('Used by')}</TableCell>
                                <TableCell style={styles.actionsRow}> </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>{rows}</TableBody>
                    </Table>
                </TableContainer>
                {this.renderEditDialog()}
                {this.renderAddDialog()}
                {this.renderDeleteDialog()}
            </div>
        );
    }
}
