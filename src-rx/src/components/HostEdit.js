import { Component } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';

import IconClose from '@material-ui/icons/Close';
import IconCheck from '@material-ui/icons/Check';
import AddIcon from '@material-ui/icons/Add';

import {  Tooltip } from '@material-ui/core';
import { FaFileUpload as UploadIcon } from 'react-icons/fa';
import Dropzone from 'react-dropzone';

const styles = theme => ({
    error: {
        border: '2px solid #FF0000',
    },
    id: {
        fontStyle: 'italic',
    },
    dialog: {
        height: 'calc(100% - 64px)'
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
    dropZone: {
        width: '100%',
        height: 100,
        position: 'relative',
    },
    dropZoneEmpty: {

    },
    image: {
        objectFit: 'contain',
        margin: 'auto',
        display: 'flex',
        width: '100%',
        height: '100%',
    },

    uploadDiv: {
        position: 'relative',
        width: '100%',
        height: 300,
        opacity: 0.9,
        marginTop: 30
    },
    uploadDivDragging: {
        opacity: 1,
    },

    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        position: 'relative',
        display: 'flex'
    },
    uploadCenterIcon: {
        paddingTop: 10,
        width: 48,
        height: 48,
    },
    uploadCenterText: {
        fontSize: 16,
    },
    uploadCenterTextAndIcon: {
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'

    },
    disabledOpacity: {
        opacity: 0.3
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
    }
});

class HostEdit extends Component {
    constructor(props) {
        super(props);

        this.state = {
            text: JSON.stringify(this.props.obj, null, 2),
            error: false,
            changed: false,
            tab: window.localStorage.getItem((this.props.dialogName || 'App') + '.editTab') || 'object',
        };

        this.originalObj = JSON.stringify(this.props.obj, null, 2);
    }

    prepareObject(value) {
        value = value || this.state.text;
        try {
            const obj = JSON.parse(value);
            obj._id = this.props.obj._id; // do not allow change of id
            return obj;
        } catch (e) {
            return null;
        }
    }

    onChange(value) {
        const newState = { text: value };
        const json = this.prepareObject(value);
        if (json) {
            newState.changed = this.originalObj !== JSON.stringify(json, null, 2);
            if (this.state.error) {
                newState.error = false;
            }
        } else {
            newState.error = true;
        }
        this.setState(newState);
    }

    onUpdate() {
        const obj = JSON.parse(this.state.text);
        obj._id = this.props.obj._id; // do not allow change of id
        this.props.onClose(obj);
    }

    onDrop(acceptedFiles, json) {
        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
            let ext = 'image/' + file.name.split('.').pop().toLowerCase();
            if (ext === 'image/jpg') {
                ext = 'image/jpeg';
            } else if (ext === 'image/svg') {
                ext = 'image/svg+xml';
            }
            if (file.size > 150000) {
                return alert('File is too big. Max 150k allowed. Try use SVG.')
            }
            const base64 = 'data:' + ext + ';base64,' + btoa(
                new Uint8Array(reader.result)
                    .reduce((data, byte) => {
                        return data + String.fromCharCode(byte)
                    }, ''));
            this.setCommonItem(json, 'icon', base64)
        };
        reader.readAsArrayBuffer(file);
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
                onClick={cb}><AddIcon />{t('add %s', nameKey)}</Button>
        </div>
    }
    buttonRemoveKey(nameKey, cb) {
        const { t, classes } = this.props;
        return <Tooltip title={t('Remove %s', nameKey)}><div className={classes.close} onClick={cb} /></Tooltip>
    }
    renderCommonEdit() {
        try {
            const json = JSON.parse(this.state.text);
            const disabled = false;
            const { classes, t } = this.props;
            return <div className={classes.commonTabWrapper}>
                <div className={classes.commonWrapper}>
                    {typeof json.common.title !== "undefined" ?
                        <TextField
                            disabled={disabled}
                            label={t('title')}
                            className={clsx(classes.marginBlock, classes.textField)}
                            fullWidth
                            value={json.common.title}
                            onChange={(el) => this.setCommonItem(json, 'title', el.target.value)}
                        /> :
                        this.buttonAddKey('title', () => this.setCommonItem(json, 'title', ''))
                    }
                    {typeof json.common.color !== "undefined" ?
                        <div className={classes.flex}>
                            <TextField
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
                {typeof json.common.icon !== "undefined" ?
                    <div className={classes.flexDrop}>
                        <Dropzone
                            disabled={disabled}
                            key="dropzone"
                            multiple={false}
                            accept="image/svg+xml,image/png,image/jpeg"
                            maxSize={256 * 1024}
                            onDragEnter={() => this.setState({ uploadFile: 'dragging' })}
                            onDragLeave={() => this.setState({ uploadFile: true })}
                            onDrop={acceptedFiles => this.onDrop(acceptedFiles, json)}
                        >
                            {({ getRootProps, getInputProps }) => (
                                <div className={clsx(
                                    classes.uploadDiv,
                                    this.state.uploadFile === 'dragging' && classes.uploadDivDragging,
                                    classes.dropZone,
                                    disabled && classes.disabledOpacity,
                                    !json.common.icon && classes.dropZoneEmpty
                                )}
                                    {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <div className={classes.uploadCenterDiv}>
                                        {!json.common.icon ? <div className={classes.uploadCenterTextAndIcon}>
                                            <UploadIcon className={classes.uploadCenterIcon} />
                                            <div className={classes.uploadCenterText}>{
                                                this.state.uploadFile === 'dragging' ? t('Drop file here') :
                                                    t('Place your files here or click here to open the browse dialog')}</div>
                                        </div> : <div className={classes.buttonRemoveWrapper}>
                                            <Tooltip title={t('Clear %s', 'icon')}>
                                                <IconButton onClick={e => {
                                                    this.setCommonItem(json, 'icon', '');
                                                    e.stopPropagation();
                                                }}><IconClose />
                                                </IconButton>
                                            </Tooltip>
                                        </div>

                                        }
                                        {json.common.icon ? <img src={json.common.icon} className={classes.image} alt="icon" /> : null}
                                    </div>

                                </div>)}
                        </Dropzone>
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

    render() {
        // const withAlias = this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state';

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
            <DialogTitle id="edit-value-dialog-title">{this.props.t('Edit host:')} <span className={this.props.classes.id}>{this.props.obj._id}</span></DialogTitle>
            <DialogContent>
                {
                    this.renderCommonEdit()
                }
            </DialogContent>
            <DialogActions>
                <Button variant="contained" disabled={this.state.error || !this.state.changed} onClick={() => this.onUpdate()} color="primary"><IconCheck />{this.props.t('Write')}</Button>
                <Button variant="contained" onClick={() => this.props.onClose()}><IconClose />{this.props.t('Cancel')}</Button>
            </DialogActions>
        </Dialog>;
    }
}

HostEdit.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    obj: PropTypes.object,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    dialogName: PropTypes.string,
    objects: PropTypes.object,

    t: PropTypes.func,
};

export default withStyles(styles)(HostEdit);
