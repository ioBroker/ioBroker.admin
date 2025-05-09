import React, { Component, type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    MenuList,
    ListItemIcon,
    ListItemText,
    TextField,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    IconButton,
    InputLabel,
    Select,
    FormControl,
    Autocomplete,
} from '@mui/material';

// Icons
import { Close, Link as IconLink, AddLink, Close as IconClose } from '@mui/icons-material';

import {
    withWidth,
    I18n,
    IconFx,
    type IobTheme,
    type AdminConnection,
    type Translate,
} from '@iobroker/adapter-react-v5';

import { DEFAULT_ROLES } from './ObjectBrowserEditObject';

import type { ioBrokerObject } from '@/types';

const styles: Record<string, any> = {
    funcIcon: {
        width: 16,
        height: 16,
    },
    formControlLabel: {
        marginBottom: 16,
    },
    color: {
        // display: 'block',
        width: 70,
    },
    typeNameEng: {
        marginLeft: 8,
        opacity: 0.7,
        fontStyle: 'italic',
        fontSize: 'smaller',
    },
    usedInAlias: {
        // backgroundColor: theme.palette.secondary.main,
    },
    addNewAlias: (theme: IobTheme) => ({
        backgroundColor: theme.palette.primary.main,
    }),
};
const stateTypeArray = ['array', 'boolean', 'file', 'json', 'mixed', 'number', 'object', 'string'];

// todo: icon, enum function, enum room, write from other object

interface ObjectAliasEditorProps {
    t: Translate;
    socket: AdminConnection;
    objects: Record<string, ioBrokerObject>;
    onRedirect: (id: string, timeout?: number) => void;
    obj: ioBrokerObject;
    onClose: () => void;
    roleArray: { role: string; type: ioBroker.CommonType }[];
}

interface ObjectAliasEditorState {
    usedInAliases: string[];
    showAddNewAlias: boolean;
    newAliasId: string;
    newAliasName: string;
    newAliasRead?: boolean;
    newAliasRole: string;
    newAliasWrite?: boolean;
    newAliasUnit?: string;
    newAliasDesc: string;
    newAliasType: ioBroker.CommonType;
    newAliasUseFormula: boolean;
    newAliasReadFormula: string;
    newAliasWriteFormula: string;
    newAliasColor: string;
    newAliasIcon: string;
    newAliasMin?: string;
    newAliasMax?: string;
}

class ObjectAliasEditor extends Component<ObjectAliasEditorProps, ObjectAliasEditorState> {
    aliasIDs: string[];

    constructor(props: ObjectAliasEditorProps) {
        super(props);

        const usedInAliases: string[] = [];
        const id = this.props.obj._id;

        this.aliasIDs = Object.keys(this.props.objects).filter(_id => _id.startsWith('alias.0'));
        // Try to find if this state used somewhere in alias
        for (let i = 0; i < this.aliasIDs.length; i++) {
            const alias = this.props.objects[this.aliasIDs[i]].common?.alias;
            if (
                alias?.id === id ||
                (typeof alias?.id === 'object' && (alias.id.read === id || alias.id.write === id))
            ) {
                usedInAliases.push(this.aliasIDs[i]);
            }
        }

        this.state = {
            usedInAliases,
            showAddNewAlias: !usedInAliases.length,
            newAliasId: this.props.obj._id,
            newAliasName: ObjectAliasEditor.getText(this.props.obj.common.name || this.props.obj._id) || '',
            newAliasRole: this.props.obj.common.role || '',
            newAliasRead: this.props.obj.common.read as undefined | boolean,
            newAliasWrite: this.props.obj.common.write as undefined | boolean,
            newAliasUnit: this.props.obj.common.unit,
            newAliasDesc: ObjectAliasEditor.getText(this.props.obj.common.desc) || '',
            newAliasType: this.props.obj.common.type,
            newAliasMin:
                this.props.obj.common.min === undefined ? '' : (this.props.obj.common.min as number).toString(),
            newAliasMax:
                this.props.obj.common.max === undefined ? '' : (this.props.obj.common.max as number).toString(),
            newAliasUseFormula: false,
            newAliasReadFormula: 'val',
            newAliasWriteFormula: 'val',
            newAliasColor: this.props.obj.common.color,
            newAliasIcon: this.props.obj.common.icon,
        };
    }

    static getText(text: ioBroker.StringOrTranslated): string {
        if (!text) {
            return '';
        }
        if (typeof text === 'object') {
            return text[I18n.getLanguage()] || text.en || '';
        }
        return text.toString();
    }

    static filterRoles(roleArray: { role: string; type: ioBroker.CommonType }[], type: ioBroker.CommonType): string[] {
        const bigRoleArray: string[] = [];
        DEFAULT_ROLES.forEach(
            role =>
                (role.type === 'mixed' || role.type === type) &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );
        roleArray.forEach(
            role =>
                (role.type === 'mixed' || role.type) === type &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );

        bigRoleArray.sort();
        return bigRoleArray;
    }

    renderAddNewAlias(): JSX.Element | null {
        if (!this.state.showAddNewAlias) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showAddNewAlias: false })}
            >
                <DialogTitle>{I18n.t('Create new alias: %s', `alias.0.${this.state.newAliasId}`)}</DialogTitle>
                <DialogContent>
                    <TextField
                        style={styles.formControlLabel}
                        variant="standard"
                        value={this.state.newAliasId}
                        slotProps={{
                            input: {
                                endAdornment: this.state.newAliasId ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            tabIndex={-1}
                                            size="small"
                                            onClick={() => this.setState({ newAliasId: '' })}
                                        >
                                            <IconClose />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        onChange={e => this.setState({ newAliasId: e.target.value })}
                        label={I18n.t('Alias ID')}
                        helperText={`alias.0.${this.state.newAliasId}`}
                        fullWidth
                    />
                    <TextField
                        style={styles.formControlLabel}
                        variant="standard"
                        value={this.state.newAliasName}
                        slotProps={{
                            input: {
                                endAdornment: this.state.newAliasName ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            tabIndex={-1}
                                            size="small"
                                            onClick={() => this.setState({ newAliasName: '' })}
                                        >
                                            <IconClose />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        onChange={e => this.setState({ newAliasName: e.target.value })}
                        label={I18n.t('Alias name')}
                        fullWidth
                    />
                    <TextField
                        style={styles.formControlLabel}
                        variant="standard"
                        value={this.state.newAliasDesc}
                        slotProps={{
                            input: {
                                endAdornment: this.state.newAliasDesc ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            tabIndex={-1}
                                            size="small"
                                            onClick={() => this.setState({ newAliasDesc: '' })}
                                        >
                                            <IconClose />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        onChange={e => this.setState({ newAliasDesc: e.target.value })}
                        label={I18n.t('Alias description')}
                        fullWidth
                    />
                    <FormControl
                        style={styles.formControlLabel}
                        fullWidth
                    >
                        <InputLabel>{I18n.t('State type')}</InputLabel>
                        <Select
                            variant="standard"
                            value={this.state.newAliasType}
                            onChange={e => this.setState({ newAliasType: e.target.value as ioBroker.CommonType })}
                        >
                            {stateTypeArray.map(el => (
                                <MenuItem
                                    key={el}
                                    value={el}
                                >
                                    {I18n.t(el)}
                                    <span style={styles.typeNameEng}>({el})</span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {this.state.newAliasType === 'number' ? (
                        <TextField
                            style={styles.formControlLabel}
                            variant="standard"
                            value={this.state.newAliasUnit || ''}
                            slotProps={{
                                input: {
                                    endAdornment: this.state.newAliasUnit ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                tabIndex={-1}
                                                size="small"
                                                onClick={() => this.setState({ newAliasUnit: '' })}
                                            >
                                                <IconClose />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                                },
                            }}
                            onChange={e => this.setState({ newAliasUnit: e.target.value })}
                            label={I18n.t('Alias units')}
                            fullWidth
                        />
                    ) : null}
                    {this.state.newAliasType === 'number' ? (
                        <TextField
                            variant="standard"
                            value={this.state.newAliasMin}
                            type="number"
                            error={this.state.newAliasMin ? isNaN(parseFloat(this.state.newAliasMin)) : false}
                            onChange={e => this.setState({ newAliasMin: e.target.value })}
                            label={I18n.t('Min')}
                            style={{ width: 'calc(50% - 4px)', marginBottom: 16, marginRight: 8 }}
                        />
                    ) : null}
                    {this.state.newAliasType === 'number' ? (
                        <TextField
                            variant="standard"
                            value={this.state.newAliasMax}
                            type="number"
                            error={this.state.newAliasMax ? isNaN(parseFloat(this.state.newAliasMax)) : false}
                            onChange={e => this.setState({ newAliasMax: e.target.value })}
                            label={I18n.t('Max')}
                            fullWidth
                            style={{ width: 'calc(50% - 4px)', marginBottom: 16 }}
                        />
                    ) : null}
                    <TextField
                        variant="standard"
                        style={{ ...styles.formControlLabel, ...styles.color }}
                        label={I18n.t('Color')}
                        type="color"
                        value={this.state.newAliasColor}
                        onChange={e => this.setState({ newAliasColor: e.target.value })}
                    />
                    <Autocomplete
                        style={{ ...styles.formControlLabel }}
                        fullWidth
                        value={this.state.newAliasRole}
                        onChange={(_, e: string): void => {
                            const role = DEFAULT_ROLES.find(r => r.role === e);
                            if (role) {
                                if (role.w !== undefined && role.r !== undefined) {
                                    this.setState({ newAliasRole: e, newAliasRead: role.r, newAliasWrite: role.w });
                                    return;
                                }
                                if (role.w !== undefined) {
                                    this.setState({ newAliasRole: e, newAliasWrite: role.w });
                                    return;
                                }
                                if (role.r !== undefined) {
                                    this.setState({ newAliasRole: e, newAliasRead: role.r });
                                    return;
                                }
                            }

                            if (
                                e.startsWith('value') ||
                                e.startsWith('indicator') ||
                                e.startsWith('sensor') ||
                                e.startsWith('weather')
                            ) {
                                if (this.state.newAliasWrite) {
                                    this.setState({ newAliasRole: e, newAliasWrite: false });
                                    return;
                                }
                            } else if (e.startsWith('level') || e.startsWith('switch')) {
                                if (!this.state.newAliasWrite) {
                                    this.setState({ newAliasRole: e, newAliasWrite: true });
                                    return;
                                }
                            } else if (e.startsWith('button')) {
                                if (this.state.newAliasRead) {
                                    this.setState({ newAliasRole: e, newAliasRead: false });
                                    return;
                                }
                            }

                            this.setState({ newAliasRole: e });
                        }}
                        options={ObjectAliasEditor.filterRoles(this.props.roleArray, this.state.newAliasType)}
                        renderInput={params => (
                            <TextField
                                variant="standard"
                                {...params}
                                label={I18n.t('Role')}
                            />
                        )}
                    />
                    <FormControlLabel
                        style={{ ...styles.formControlLabel, marginLeft: 16 }}
                        control={
                            <Checkbox
                                indeterminate={
                                    this.state.newAliasRead === undefined || this.state.newAliasRead === null
                                }
                                checked={this.state.newAliasRead}
                                onChange={e => {
                                    const newState: Partial<ObjectAliasEditorState> = {
                                        newAliasRead: e.target.checked,
                                    };
                                    // state cannot be not readable and not writeable
                                    if (newState.newAliasRead === false && this.state.newAliasWrite === false) {
                                        newState.newAliasWrite = true;
                                    }
                                    this.setState(newState as ObjectAliasEditorState);
                                }}
                            />
                        }
                        label={I18n.t('Alias read')}
                    />
                    <FormControlLabel
                        style={styles.formControlLabel}
                        control={
                            <Checkbox
                                indeterminate={
                                    this.state.newAliasWrite === undefined || this.state.newAliasWrite === null
                                }
                                checked={this.state.newAliasWrite}
                                onChange={e => {
                                    const newState: Partial<ObjectAliasEditorState> = {
                                        newAliasWrite: e.target.checked,
                                    };
                                    // state cannot be not readable and not writeable
                                    if (newState.newAliasRead === false && this.state.newAliasWrite === false) {
                                        newState.newAliasRead = true;
                                    }
                                    this.setState(newState as ObjectAliasEditorState);
                                }}
                            />
                        }
                        label={I18n.t('Alias write')}
                    />
                    <FormControlLabel
                        style={styles.formControlLabel}
                        control={
                            <Checkbox
                                checked={this.state.newAliasUseFormula}
                                onChange={e => this.setState({ newAliasUseFormula: e.target.checked })}
                            />
                        }
                        label={I18n.t('Use convert functions')}
                    />
                    {this.state.newAliasUseFormula && this.state.newAliasRead ? (
                        <TextField
                            style={styles.formControlLabel}
                            variant="standard"
                            value={this.state.newAliasReadFormula}
                            onChange={e => this.setState({ newAliasReadFormula: e.target.value })}
                            label={I18n.t('Read formula')}
                            helperText={`${I18n.t('JS function like')} "val / 5 + 21"`}
                            slotProps={{
                                input: {
                                    endAdornment:
                                        this.state.newAliasReadFormula && this.state.newAliasReadFormula !== 'val' ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    tabIndex={-1}
                                                    size="small"
                                                    onClick={() => this.setState({ newAliasReadFormula: 'val' })}
                                                >
                                                    <IconClose />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconFx style={styles.funcIcon} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            fullWidth
                        />
                    ) : null}
                    {this.state.newAliasUseFormula && this.state.newAliasWrite ? (
                        <TextField
                            style={styles.formControlLabel}
                            variant="standard"
                            value={this.state.newAliasWriteFormula}
                            onChange={e => this.setState({ newAliasWriteFormula: e.target.value })}
                            label={I18n.t('Write formula')}
                            slotProps={{
                                input: {
                                    endAdornment:
                                        this.state.newAliasWriteFormula && this.state.newAliasWriteFormula !== 'val' ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    tabIndex={-1}
                                                    size="small"
                                                    onClick={() => this.setState({ newAliasWriteFormula: 'val' })}
                                                >
                                                    <IconClose />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconFx style={styles.funcIcon} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            helperText={`${I18n.t('JS function like')} "val / 5 + 21"`}
                            fullWidth
                        />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        disabled={!this.state.newAliasId || !!this.props.objects[`alias.0.${this.state.newAliasId}`]}
                        onClick={async () => {
                            const obj: ioBrokerObject = {
                                _id: `alias.0.${this.state.newAliasId}`,
                                type: 'state',
                                common: {
                                    name: this.state.newAliasName,
                                    type: this.props.obj.common.type,
                                    alias: {
                                        id: this.props.obj._id,
                                    },
                                },
                                native: {},
                            } as ioBrokerObject;
                            if (this.state.newAliasDesc) {
                                obj.common.desc = this.state.newAliasDesc;
                            }
                            if (this.state.newAliasType) {
                                obj.common.type = this.state.newAliasType;
                            }
                            if (this.state.newAliasType === 'number' && this.state.newAliasUnit) {
                                obj.common.unit = this.state.newAliasUnit;
                            }
                            if (this.state.newAliasRole) {
                                obj.common.role = this.state.newAliasRole;
                            }
                            if (this.state.newAliasType === 'number' && this.state.newAliasMin) {
                                obj.common.min = parseFloat(this.state.newAliasMin);
                            }
                            if (this.state.newAliasType === 'number' && this.state.newAliasMax) {
                                obj.common.max = parseFloat(this.state.newAliasMax);
                            }
                            if (this.state.newAliasRole) {
                                obj.common.role = this.state.newAliasRole;
                            }
                            if (this.state.newAliasRead !== undefined && this.state.newAliasRead !== null) {
                                obj.common.read = this.state.newAliasRead;
                            }
                            if (this.state.newAliasWrite !== undefined && this.state.newAliasWrite !== null) {
                                obj.common.write = this.state.newAliasWrite;
                            }
                            if (this.state.newAliasColor) {
                                obj.common.color = this.state.newAliasColor;
                            }
                            if (this.state.newAliasIcon) {
                                obj.common.icon = this.state.newAliasIcon;
                            }
                            if (this.state.newAliasUseFormula) {
                                if (
                                    obj.common.read !== false &&
                                    this.state.newAliasReadFormula &&
                                    this.state.newAliasReadFormula !== 'val'
                                ) {
                                    obj.common.alias.read = this.state.newAliasReadFormula;
                                }
                                if (
                                    obj.common.write !== false &&
                                    this.state.newAliasWriteFormula &&
                                    this.state.newAliasWriteFormula !== 'val'
                                ) {
                                    obj.common.alias.write = this.state.newAliasWriteFormula;
                                }
                            }
                            await this.props.socket.setObject(obj._id, obj);
                            this.setState({ showAddNewAlias: false });
                            this.props.onRedirect(obj._id, 2000);
                            this.props.onClose();
                        }}
                        startIcon={<AddLink />}
                        color="primary"
                    >
                        {this.props.t('Create')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showAddNewAlias: false })}
                        startIcon={<Close />}
                        color="grey"
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): JSX.Element {
        return (
            <Dialog
                key="editAlias"
                open={!0}
                maxWidth="sm"
                onClose={() => this.props.onClose()}
                fullWidth
                aria-labelledby="object-alias-dialog-title"
            >
                {this.renderAddNewAlias()}
                <DialogTitle id="object-alias-dialog-title">
                    {this.state.usedInAliases.length
                        ? I18n.t('This object is used in aliases')
                        : I18n.t('This object does not used in any aliases yet')}
                </DialogTitle>
                <DialogContent>
                    <MenuList style={{ maxWidth: 400 }}>
                        {this.state.usedInAliases.map(aliasID => (
                            <MenuItem
                                style={styles.usedInAlias}
                                key={aliasID}
                                onClick={() => this.props.onRedirect(aliasID)}
                            >
                                <ListItemIcon>
                                    <IconLink fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{aliasID}</ListItemText>
                            </MenuItem>
                        ))}
                        <MenuItem
                            onClick={() => this.setState({ showAddNewAlias: true })}
                            sx={styles.addNewAlias}
                        >
                            <ListItemIcon>
                                <AddLink fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>{I18n.t('Create alias from this ID')}</ListItemText>
                        </MenuItem>
                    </MenuList>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        startIcon={<Close />}
                        color="grey"
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default withWidth()(ObjectAliasEditor);
