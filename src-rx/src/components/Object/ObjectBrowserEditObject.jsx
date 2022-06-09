import React, { Component } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import AceEditor from 'react-ace';
// import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';

import IconClose from '@mui/icons-material/Close';
import IconCheck from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { FaClipboard as IconCopyClipboard } from 'react-icons/fa';
import IconCopy from '@mui/icons-material/FileCopy';
import IconFx from '@iobroker/adapter-react-v5/icons/IconFx';

import DialogSelectID from '@iobroker/adapter-react-v5/Dialogs/SelectID';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';
import I18n from '@iobroker/adapter-react-v5/i18n';
import copy from '@iobroker/adapter-react-v5/Components/copy-to-clipboard';
import { FormControl, InputLabel, MenuItem, Select, Tooltip, Autocomplete } from '@mui/material';
import UploadImage from '../UploadImage';

const styles = theme => ({
    divWithoutTitle: {
        width: '100%',
        height: '100%',
        border: '2px solid #00000000',
    },
    divWithoutTitleAndTab: {
        height: 'calc(100% - 48px)',
    },
    error: {
        border: '2px solid #FF0000',
    },
    id: {
        fontStyle: 'italic',
    },
    dialog: {
        height: 'calc(100% - 64px)'
    },
    aliasIdEdit: {
        width: 400 - 32,
    },
    button: {
        marginTop: 20,
        marginLeft: theme.spacing(1),
    },
    funcDivEdit: {
        width: '100%'
    },
    funcEditName: {
        display: 'inline-block',
        width: 85
    },
    funcEdit: {
        width: 400,
    },
    funcIcon: {
        width: 16,
        height: 16,
    },
    marginTop: {
        marginTop: 20,
    },
    commonTabWrapper: {
        flexFlow: 'wrap',
        display: 'flex'
    },
    commonWrapper: {
        width: 500,
        minWidth: 300
    },
    flexDrop: {
        width: '100%',
        maxWidth: 500,
        margin: 'auto',
        display: 'flex'
    },
    marginBlock: {
        marginTop: 20
    },
    buttonAdd: {
        minWidth: 150
    },
    textField: {
        width: '100%'
    },
    flex: {
        display: 'flex'
    },
    close: {
        width: '20px',
        height: '20px',
        opacity: '0.9',
        cursor: 'pointer',
        position: 'relative',
        top: 20,
        transition: 'all 0.6s ease',
        '&:hover': {
            transform: 'rotate(90deg)'
        },
        '&:before': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)'
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)'
        },
    },
    color: {
        width: 70
    },
    buttonRemoveWrapper: {
        position: 'absolute',
        zIndex: 222,
        right: 0
    },
    tabsPadding: {
        padding: '0px 24px'
    },
    '@media screen and (max-width: 465px)': {
        wrapperButton: {
            '& *':{
                fontSize:10
            }
        },
    },
    '@media screen and (max-width: 380px)': {
        wrapperButton: {
            '& *':{
                fontSize:9
            }
        },
    },
});

class ObjectBrowserEditObject extends Component {
    constructor(props) {
        super(props);

        const withAlias = this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state';
        let tab = window.localStorage.getItem((this.props.dialogName || 'App') + '.editTab') || 'object';

        // select another tab if alias not present
        if (tab === 'alias' && !withAlias) {
            tab = 'common';
        }

        this.state = {
            text: JSON.stringify(this.props.obj, null, 2),
            error: false,
            changed: false,
            readError: this.checkFunction(this.props.obj.common?.alias?.read, false),
            writeError: this.checkFunction(this.props.obj.common?.alias?.write, true),
            tab,
            showCopyDialog: false,
        };

        this.isMobile = window.innerWidth < 850;

        this.originalObj = JSON.stringify(this.props.obj, null, 2);
    }

    checkFunction(func, isWrite) {
        if (!func) {
            return '';
        } else if (func.includes('JSON.parse(')) {
            // Unable to validate (result is unknown)
            return '';
        } else {
            let json;
            try {
                json = JSON.parse(this.state.text);
            } catch (e) {

            }

            let jsFunc;
            try {
                // eslint-disable-next-line no-new-func
                jsFunc = new Function('val', func.includes('return') ? func : 'return ' + func);
            } catch (e) {
                return this.props.t('Cannot parse code!');
            }

            if (json?.common?.type && this.props.objects[json.common?.alias?.id]?.common?.type) {
                const initialType = isWrite ? json.common.type : this.props.objects[json.common.alias.id].common.type;
                const finalType = isWrite ? this.props.objects[json.common.alias.id].common.type : json.common.type;
                if (initialType && finalType) {
                    let arg = null;
                    if (initialType === 'boolean') {
                        arg = true;
                    } else if (initialType === 'number') {
                        arg = 1;
                    } else if (initialType === 'string') {
                        arg = 'string';
                    }
                    if (arg !== null) {
                        try {
                            const result = jsFunc(arg);
                            return result !== null && typeof result !== finalType ?
                                this.props.t('Type of result is not as expected: %s', finalType) : '';
                        } catch (e) {
                            return this.props.t('Cannot execute function') + ': ' + e.toString();
                        }
                    }
                }
            }

            return '';
        }
    }

    prepareObject(value) {
        value = value || this.state.text;
        try {
            const obj = JSON.parse(value);
            obj._id = this.props.obj._id; // do not allow change of id

            // check aliases
            if (obj.common?.alias) {
                if (!obj.common.alias.id) {
                    delete obj.common.alias.id;
                }
                if ((!obj.common.alias.read && obj.common.alias.read !== undefined) || obj.common.alias.read === 'val') {
                    delete obj.common.alias.read;
                }
                if ((!obj.common.alias.write && obj.common.alias.write !== undefined) || obj.common.alias.write === 'val') {
                    delete obj.common.alias.write;
                }
                if (!obj.common.alias.id && !obj.common.alias.read && !obj.common.alias.write) {
                    delete obj.common.alias;
                }
            }
            return obj;
        } catch (e) {
            return null;
        }
    }

    onChange(value, cb) {
        const newState = { text: value };
        const json = this.prepareObject(value);
        if (json) {
            newState.changed = this.originalObj !== JSON.stringify(json, null, 2);
            if (this.state.error) {
                newState.error = false;
            }
            newState.readError = this.checkFunction(json.common?.alias?.read, false);
            newState.writeError = this.checkFunction(json.common?.alias?.write, true);
        } else {
            newState.error = true;
        }
        this.setState(newState, () => cb && cb());
    }

    onUpdate() {
        try {
            const obj = JSON.parse(this.state.text);
            obj._id = this.props.obj._id; // do not allow change of id

            // check aliases
            if (obj.common?.alias) {
                if (!obj.common.alias.id) {
                    delete obj.common.alias.id;
                }
                if ((!obj.common.alias.read && obj.common.alias.read !== undefined) || obj.common.alias.read === 'val') {
                    delete obj.common.alias.read;
                }
                if ((!obj.common.alias.write && obj.common.alias.write !== undefined) || obj.common.alias.write === 'val') {
                    delete obj.common.alias.write;
                }
                if (!obj.common.alias.id && !obj.common.alias.read && !obj.common.alias.write) {
                    delete obj.common.alias;
                }
            }

            this.props.onClose(obj);
        } catch (error) {
            console.log.error('Cannot parse: ' + this.state.text);
        }
    }

    renderTabs() {
        return <Tabs className={this.props.classes.tabsPadding} value={this.state.tab} onChange={(e, tab) => {
            window.localStorage.setItem((this.props.dialogName || 'App') + '.editTab', tab);
            this.setState({ tab });
        }}>
            <Tab value="common" label={this.props.t('Common')} />
            <Tab value="object" label={this.props.t('Object data')} />
            {this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state' && <Tab value="alias" label={this.props.t('Alias')} />}
        </Tabs>;
    }

    renderSelectDialog() {
        if (!this.state.selectId && !this.state.selectRead && !this.state.selectWrite) {
            return null;
        }

        let id = '';
        try {
            const json = JSON.parse(this.state.text);

            if (this.state.selectId) {
                id = json.common?.alias?.id || '';
            } else if (this.state.selectRead) {
                id = json.common?.alias?.id?.read || '';
            } else if (this.state.selectWrite) {
                id = json.common?.alias?.id?.write || '';
            }
        } catch (error) {
            console.error('Cannot parse ' + this.state.text);
        }

        return <DialogSelectID
            key="selectDialog"
            imagePrefix="."
            dateFormat={this.props.dateFormat}
            isFloatComma={this.props.isFloatComma}
            socket={this.props.socket}
            dialogName="aliasesEdit"
            title={`${this.props.t('Select for')} ${this.props.obj._id}`}
            selected={id}
            statesOnly={true}
            onOk={id => {
                const selectRead = this.state.selectRead;
                const selectWrite = this.state.selectWrite;
                const selectId = this.state.selectId;
                this.setState({ selectId: false, selectRead: false, selectWrite: false }, () => {
                    if (selectRead) {
                        this.setAliasItem(json, 'id.read', id);
                    } else if (selectWrite) {
                        this.setAliasItem(json, 'id.write', id);
                    } else if (selectId) {
                        this.setAliasItem(json, 'id', id);
                    }
                });
            }}
            onClose={() => this.setState({ selectId: false, selectRead: false, selectWrite: false })}
        />;
    }

    setAliasItem(json, name, value, cb) {
        json.common = json.common || {};
        json.common.alias = json.common.alias || {};

        if (name === 'id.read') {
            if (json.common.alias.id && typeof json.common.alias.id === 'object') {
                json.common.alias.id.read = value;
            } else {
                json.common.alias.id = {read: value, write: value};
            }
        } else if (name === 'id.write') {
            if (json.common.alias.id && typeof json.common.alias.id === 'object') {
                json.common.alias.id.write = value;
            } else {
                json.common.alias.id = {read: value, write: value};
            }
        } else {
            json.common.alias[name] = value;
        }

        this.onChange(JSON.stringify(json, null, 2), cb);
    }

    setCommonItem(json, name, value) {
        json.common[name] = value;
        this.onChange(JSON.stringify(json, null, 2));
    }

    removeCommonItem(json, name) {
        delete json.common[name]
        this.onChange(JSON.stringify(json, null, 2));
    }

    buttonAddKey(nameKey, cb) {
        const { t, classes } = this.props;
        return <div
            className={classes.marginBlock}>
            <Button
                className={classes.buttonAdd}
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={cb}>{t('Add attribute %s', nameKey)}</Button>
        </div>;
    }

    buttonRemoveKey(nameKey, cb) {
        const { t, classes } = this.props;
        return <Tooltip title={t('Remove attribute %s', nameKey)}><div className={classes.close} onClick={cb} /></Tooltip>;
    }

    renderCommonEdit() {
        try {
            const json = JSON.parse(this.state.text);
            const stateTypeArray = [
                'boolean',
                'json',
                'string',
                'number',
                'multistate',
                'file',
                'object',
                'mixed'
            ];
            const disabled = false;
            const { classes, t, roleArray, obj } = this.props;
            const checkState = obj.type === 'state';
            const checkRole = obj.type === 'channel' || obj.type === 'device' || checkState;

            return <div className={classes.commonTabWrapper}>
                <div className={classes.commonWrapper}>
                    {typeof json.common.name !== 'undefined' ?
                        <TextField
                            variant="standard"
                            disabled={disabled}
                            label={t('Name')}
                            className={clsx(classes.marginBlock, classes.textField)}
                            fullWidth
                            value={Utils.getObjectNameFromObj(json, I18n.getLanguage())}
                            onChange={(el) => this.setCommonItem(json, 'name', el.target.value)}
                        /> :
                        this.buttonAddKey('name', () => this.setCommonItem(json, 'name', ''))
                    }
                    {checkState ? typeof json.common.type !== 'undefined' ?
                        <div className={classes.flex}>
                            <FormControl
                                className={classes.marginBlock}
                                fullWidth>
                                <InputLabel >{t('State type')}</InputLabel>
                                <Select
                                    variant="standard"
                                    disabled={disabled}
                                    value={json.common.type}
                                    onChange={(el) => this.setCommonItem(json, 'type', el.target.value)}
                                >
                                    {stateTypeArray.map(el => <MenuItem key={el} value={el}>{t(el)}</MenuItem>)}
                                </Select>
                            </FormControl>
                            {this.buttonRemoveKey('type', () => this.removeCommonItem(json, 'type'))}
                        </div>
                        :
                        this.buttonAddKey('type', () => this.setCommonItem(json, 'type', 'string'))
                        : null}
                    {checkRole ? typeof json.common.role !== 'undefined' ?
                        <div className={classes.flex}>
                            <Autocomplete
                                className={classes.marginBlock}
                                fullWidth
                                disabled={disabled}
                                value={json.common.role}
                                onChange={(_, e) => this.setCommonItem(json, 'role', e)}
                                options={roleArray}
                                renderInput={params => <TextField variant="standard" {...params} label={t('Role')} />}
                            />
                            {this.buttonRemoveKey('role', () => this.removeCommonItem(json, 'role'))}
                        </div> :
                        this.buttonAddKey('role', () => this.setCommonItem(json, 'role', ''))
                        : null}
                    {typeof json.common.color !== 'undefined' ?
                        <div className={classes.flex}>
                            <TextField
                                variant="standard"
                                disabled={disabled}
                                className={clsx(classes.marginBlock, classes.color)}
                                label={t('Color')}
                                type="color"
                                value={json.common.color}
                                onChange={el => this.setCommonItem(json, 'color', el.target.value)} />
                            {this.buttonRemoveKey('color', () => this.removeCommonItem(json, 'color'))}
                        </div> :
                        this.buttonAddKey('color', () => this.setCommonItem(json, 'color', ''))
                    }
                </div>
                {typeof json.common.icon !== 'undefined' ?
                    <div className={classes.flexDrop}>
                        <UploadImage
                            disabled={disabled}
                            maxSize={10 * 1024}
                            icon={json.common.icon}
                            removeIconFunc={() => this.setCommonItem(json, 'icon', '')}
                            onChange={(base64) => this.setCommonItem(json, 'icon', base64)}
                            t={t}
                        />
                        {this.buttonRemoveKey('icon', () => this.removeCommonItem(json, 'icon'))}
                    </div> :
                    <div className={classes.flexDrop}>
                        {this.buttonAddKey('icon', () => this.setCommonItem(json, 'icon', ''))}
                    </div>
                }
            </div>
        } catch (e) {
            return <div>{this.props.t('Cannot parse JSON!')}</div>;
        }
    }

    renderAliasEdit() {
        try {
            const json = JSON.parse(this.state.text);
            const funcVisible = json.common?.alias?.read !== undefined || json.common?.alias?.write !== undefined;

            return <Grid container direction="column" className={this.props.classes.marginTop}>
                <Grid item>
                    <FormControlLabel
                        control={<Checkbox
                            checked={typeof json.common?.alias?.id === 'object'}
                            onChange={() => {
                                if (typeof json.common?.alias?.id === 'object') {
                                    this.setAliasItem(json, 'id', json.common?.alias?.id?.read || '');
                                } else {
                                    this.setAliasItem(json, 'id.read', json.common?.alias?.id || '');
                                }
                            }} />
                        }
                        label={this.props.t('Different IDs for read and write')}
                    />
                </Grid>
                {typeof json.common?.alias?.id !== 'object' ? <Grid item>
                    <TextField
                        variant="standard"
                        label={this.props.t('Alias state')}
                        value={json.common?.alias?.id || ''}
                        className={this.props.classes.aliasIdEdit}
                        InputProps={{
                            endAdornment: json.common?.alias?.id ? <InputAdornment position="end"><IconButton size="large"
                                onClick={() => this.setAliasItem(json, 'id', '')}><IconClose/></IconButton></InputAdornment> : null,
                        }}
                        onChange={e => this.setAliasItem(json, 'id', e.target.value)}
                        margin="normal"
                    />
                    <Fab
                        className={this.props.classes.button}
                        size="small"
                        onClick={() => this.setState({selectId: true, selectRead: false, selectWrite: false})}>...</Fab>
                </Grid> : null}

                {typeof json.common?.alias?.id === 'object' ? <Grid item>
                    <TextField
                        variant="standard"
                        label={this.props.t('Alias read state')}
                        value={json.common?.alias?.id?.read || ''}
                        className={this.props.classes.aliasIdEdit}
                        InputProps={{
                            endAdornment: json.common?.alias?.id?.read ? <InputAdornment position="end"><IconButton size="large"
                                onClick={() => this.setAliasItem(json, 'id.read', '')}><IconClose/></IconButton></InputAdornment> : null,
                        }}
                        onChange={e => this.setAliasItem(json, 'id.read', e.target.value)}
                        margin="normal"
                    />
                    <Fab
                        className={this.props.classes.button}
                        size="small"
                        onClick={() => this.setState({selectId: false, selectRead: true, selectWrite: false})}>...</Fab>
                </Grid> : null}

                {typeof json.common?.alias?.id === 'object' ? <Grid item>
                    <TextField
                        variant="standard"
                        label={this.props.t('Alias write state')}
                        value={json.common?.alias?.id?.write || ''}
                        className={this.props.classes.aliasIdEdit}
                        InputProps={{
                            endAdornment: json.common?.alias?.id?.write ? <InputAdornment position="end"><IconButton size="large"
                                onClick={() => this.setAliasItem(json, 'id.write', '')}><IconClose/></IconButton></InputAdornment> : null,
                        }}
                        onChange={e => this.setAliasItem(json, 'id.write', e.target.value)}
                        margin="normal"
                    />
                    <Fab
                    className={this.props.classes.button}
                    size="small"
                    onClick={() => this.setState({selectId: false, selectRead: false, selectWrite: true})}>...</Fab>
                </Grid> : null}
                <Grid item className={this.props.classes.marginTop}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={json.common?.alias?.read !== undefined || json.common?.alias?.write !== undefined}
                                onChange={() => {
                                    if (funcVisible) {
                                        delete json.common.alias.read;
                                        delete json.common.alias.write;
                                    } else {
                                        json.common = json.common || {};
                                        json.common.alias = json.common.alias || {};
                                        json.common.alias.read = 'val';
                                        json.common.alias.write = 'val';
                                    }
                                    this.onChange(JSON.stringify(json, null, 2));
                                }}
                            />
                        }
                        label={this.props.t('Use convert functions')}
                    />
                </Grid>
                {funcVisible ?
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Read converter')}
                            value={json.common?.alias?.read || 'val'}
                            className={this.props.classes.funcEdit}
                            error={!!this.state.readError}
                            InputProps={{
                                endAdornment: json.common?.alias?.read ? <InputAdornment position="end"><IconButton size="large" onClick={() => this.setAliasItem(json, 'read', '')}><IconClose /></IconButton></InputAdornment> : null,
                                startAdornment: <InputAdornment position="start"><IconFx className={this.props.classes.funcIcon}/></InputAdornment>,
                            }}
                            onChange={e => this.setAliasItem(json, 'read', e.target.value)}
                            helperText={this.state.readError || (this.props.t('JS function like') + ' "val / 5 + 21"')}
                            margin="normal"
                        />
                    </Grid> : null}
                {funcVisible ?
                    <Grid item>
                        <TextField
                            variant="standard"
                            label={this.props.t('Write converter')}
                            error={!!this.state.writeError}
                            value={json.common?.alias?.write || 'val'}
                            helperText={this.state.writeError || (this.props.t('JS function like') + ' "(val - 21) * 5"')}
                            className={this.props.classes.funcEdit}
                            InputProps={{
                                endAdornment: json.common?.alias?.write ? <InputAdornment position="end"><IconButton size="large" onClick={() => this.setAliasItem(json, 'write', '')}><IconClose /></IconButton></InputAdornment> : null,
                                startAdornment: <InputAdornment position="start"><IconFx className={this.props.classes.funcIcon}/></InputAdornment>,
                            }}
                            onChange={e => this.setAliasItem(json, 'write', e.target.value)}
                            margin="normal"
                        />
                    </Grid> : null}
            </Grid>;
        } catch (e) {
            return <div>{this.props.t('Cannot parse JSON!')}</div>;
        }
    }

    onCopy(e) {
        e.stopPropagation();
        e.preventDefault();
        copy(this.state.text);
        window.alert(this.props.t('ra_Copied'));
    }

    onClone(oldId, newId, cb) {
        const newObj = JSON.parse(JSON.stringify(this.props.objects[oldId]));
        delete newObj.from;
        delete newObj.ts;
        delete newObj.user;
        newObj._id = newId;
        this.props.objects[newObj._id] = newObj; // bad practise, but no time to wait till this object will be created
        this.props.onNewObject(newObj);
    }

    renderCopyDialog() {
        if (!this.state.showCopyDialog) {
            return null;
        } else {
            return <Dialog
                open={true}
                maxWidth="md"
                fullWidth
                onClose={() => this.setState({showCopyDialog: false})}
            >
                <DialogTitle>{this.props.t('Enter new ID for this object')}</DialogTitle>
                <DialogContent>
                    <TextField
                        variant="standard"
                        autoFocus
                        fullWidth
                        label={this.props.t('New object ID')}
                        value={this.state.newId}
                        onKeyDown={e => {
                            if (e.keyCode === 13 && !this.props.objects[this.state.newId]) {
                                this.setState({showCopyDialog: ''});
                                this.onClone(this.state.showCopyDialog, this.state.newId);
                            }
                        }}
                        onChange={e => this.setState({newId: e.target.value})}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!!this.props.objects[this.state.newId]}
                        onClick={() => {
                            this.setState({showCopyDialog: ''});
                            this.onClone(this.state.showCopyDialog, this.state.newId);
                        }}
                        color="primary"
                        startIcon={<IconCopy />}
                    >
                        {this.props.t('Clone')}
                    </Button>
                    <Button
                        color="grey"
                        onClick={() => this.setState({showCopyDialog: ''})}
                        startIcon={<IconClose />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>;
        }
    }

    render() {
        const withAlias = this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state';

        return <Dialog
            classes={{ paper: this.props.classes.dialog }}
            open={true}
            maxWidth="lg"
            fullWidth={this.state.type !== 'number' && this.state.type !== 'boolean'}
            fullScreen={false}
            onClose={() => this.props.onClose()}
            aria-labelledby="edit-value-dialog-title"
            aria-describedby="edit-value-dialog-description"
        >
            <DialogTitle id="edit-value-dialog-title">{this.props.t('Edit object:')} <span className={this.props.classes.id}>{this.props.obj._id}</span></DialogTitle>

            {this.renderTabs()}
            {this.renderCopyDialog()}

            <DialogContent>
                {this.state.tab === 'object' ?
                    <div className={clsx(this.props.classes.divWithoutTitle, withAlias && this.props.classes.divWithoutTitleAndTab, this.state.error && this.props.classes.error)}>
                        <AceEditor
                            mode="json"
                            width="100%"
                            height="100%"
                            theme={this.props.themeName === 'dark' ? 'clouds_midnight' : 'chrome'}
                            value={this.state.text}
                            onChange={newValue => this.onChange(newValue)}
                            name="UNIQUE_ID_OF_DIV"
                            fontSize={14}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true
                            }}
                            editorProps={{ $blockScrolling: true }}
                        />
                    </div>
                    : null
                }
                {this.state.tab === 'alias' && this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state' ?
                    this.renderAliasEdit() : null
                }
                {this.state.tab === 'common' ? this.renderCommonEdit() : null}
                {this.renderSelectDialog()}
            </DialogContent>
            <DialogActions className={this.props.classes.wrapperButton}>
                <Button
                    color="grey"
                    onClick={() => this.setState({showCopyDialog: this.props.obj._id, newId: this.props.obj._id})}
                    disabled={this.state.error || this.state.changed}
                    title={this.props.t('Create a copy of this object')}
                ><IconCopy/></Button>
                <div style={{flexGrow: 1}}/>
                {this.state.tab === 'object' && <Button
                    color="grey"
                    onClick={e => this.onCopy(e)}
                    disabled={this.state.error}
                    title={this.isMobile ? this.props.t('Copy into clipboard') : ''}
                    startIcon={<IconCopyClipboard />}
                >{this.isMobile ? null : this.props.t('Copy into clipboard')}</Button>}
                <Button
                    variant="contained"
                    disabled={this.state.error || !this.state.changed}
                    onClick={() => this.onUpdate()}
                    startIcon={<IconCheck />}
                    color="primary">{this.props.t('Write')}</Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    startIcon={<IconClose />}
                >{this.props.t('Cancel')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectBrowserEditObject.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    obj: PropTypes.object,
    expertMode: PropTypes.bool,
    themeName: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    dialogName: PropTypes.string,
    objects: PropTypes.object,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,
    onNewObject: PropTypes.func,

    t: PropTypes.func,
};

export default withStyles(styles)(ObjectBrowserEditObject);
