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
import { CREDENTIAL_ICON_DATA as ICON_DATA } from './credentialIcons';
import { CHAT_SETTINGS_OBJECT_ID } from '../Chat/chatTypes';

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
    gemini: {
        label: 'Google Gemini',
        icon: <CredentialIcon src={ICON_DATA.gemini} />,
        form: 'key',
        type: 'ai',
        name: 'gemini',
    },
    deepseek: {
        label: 'DeepSeek',
        icon: <CredentialIcon src={ICON_DATA.deepseek} />,
        form: 'key',
        type: 'ai',
        name: 'deepseek',
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
        void this.detectUsage();
    }

    /** Find out which adapter instances and the admin AI assistant reference which credential */
    async detectUsage(): Promise<void> {
        const usage: Record<string, UsageEntry[]> = {};
        const add = (id: string, entry: UsageEntry): void => {
            usage[id] = usage[id] || [];
            usage[id].push(entry);
        };

        // 1. Instances that store a `system.credentials.*` reference somewhere in their `native`
        try {
            const instances = await this.props.socket.getAdapterInstances(true);
            instances.forEach(instance => {
                const text = JSON.stringify(instance.native || {});
                const matches = text.match(/system\.credentials\.[0-9A-Za-z_.-]+/g);
                if (matches) {
                    const instanceId = instance._id.replace('system.adapter.', '');
                    let icon = instance.common?.icon;
                    if (icon && !icon.startsWith('data:image') && !icon.includes('/')) {
                        icon = `adapter/${instance.common.name}/${icon}`;
                    }
                    [...new Set(matches)].forEach(id => add(id, { instance: instanceId, icon }));
                }
            });
        } catch (e) {
            console.error(`Cannot read instances: ${e}`);
        }

        // 2. The admin AI assistant keeps its selected credential in `system.ai`
        try {
            const aiObj = await this.props.socket.getObject(CHAT_SETTINGS_OBJECT_ID);
            const credentialId = aiObj?.native?.credentialId;
            if (typeof credentialId === 'string' && credentialId.startsWith(CREDENTIALS_PREFIX)) {
                add(credentialId, { instance: this.props.t('AI assistant'), icon: 'adapter/admin/admin.svg' });
            }
        } catch {
            // ignore — the object may not exist yet
        }

        this.setState({ usage });
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
