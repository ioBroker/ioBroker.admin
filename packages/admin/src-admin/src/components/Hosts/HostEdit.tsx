import React, { Component } from 'react';
import { withStyles } from '@mui/styles';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tooltip, InputAdornment,
    IconButton,
} from '@mui/material';

import {
    Close as IconClose,
    Check as IconCheck,
    Add as IconAdd,
    Close as CloseIcon,
} from '@mui/icons-material';

import { Utils, UploadImage, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = (theme: IobTheme) => ({
    error: {
        border: '2px solid #FF0000',
    },
    id: {
        fontStyle: 'italic',
    },
    dialog: {
        height: 'calc(100% - 64px)',
    },
    button: {
        marginTop: 20,
        marginLeft: 8,
    },
    funcDivEdit: {
        width: '100%',
    },
    funcEditName: {
        display: 'inline-block',
        width: 85,
    },
    funcEdit: {
        width: 400,
    },
    marginTop: {
        marginTop: 20,
    },
    commonTabWrapper: {
        flexFlow: 'wrap',
        display: 'flex',
    },
    commonWrapper: {
        width: 500,
        minWidth: 300,
    },
    flexDrop: {
        width: '100%',
        maxWidth: 500,
        margin: 'auto',
        display: 'flex',
    },
    marginBlock: {
        marginTop: 20,
    },
    buttonAdd: {
        minWidth: 150,
    },
    textField: {
        width: '100%',
    },
    flex: {
        display: 'flex',
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
            transform: 'rotate(90deg)',
        },
        '&:before': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)',
        },
    },
    color: {
        width: 70,
    },
    buttonRemoveWrapper: {
        position: 'absolute',
        zIndex: 222,
        right: 0,
    },
    tabsPadding: {
        padding: '0px 24px',
    },
});

interface HostEditProps {
    classes: Record<string, string>;
    obj: ioBroker.HostObject;
    onClose: (newObj?: ioBroker.HostObject) => void;
    t: (text: string, ...args: any[]) => string;
}

interface HostEditState {
    text: string;
    error: boolean;
    changed: boolean;
}

class HostEdit extends Component<HostEditProps, HostEditState> {
    private readonly originalObj: string;

    constructor(props: HostEditProps) {
        super(props);

        this.state = {
            text: JSON.stringify(this.props.obj, null, 2),
            error: false,
            changed: false,
        };

        this.originalObj = JSON.stringify(this.props.obj, null, 2);
    }

    prepareObject(value: string): ioBroker.HostObject | null {
        value = value || this.state.text;
        try {
            const obj: ioBroker.HostObject = JSON.parse(value) as ioBroker.HostObject;
            obj._id = this.props.obj._id; // do not allow change of id
            return obj;
        } catch (e) {
            return null;
        }
    }

    onChange(value: string) {
        const newState: Partial<HostEditState> = { text: value };
        const json = this.prepareObject(value);
        if (json) {
            newState.changed = this.originalObj !== JSON.stringify(json, null, 2);
            if (this.state.error) {
                newState.error = false;
            }
        } else {
            newState.error = true;
        }
        this.setState(newState as HostEditState);
    }

    onUpdate() {
        try {
            const obj = JSON.parse(this.state.text) as ioBroker.HostObject;
            obj._id = this.props.obj._id; // do not allow change of id
            this.props.onClose(obj);
        } catch (error) {
            // ignore
        }
    }

    setCommonItem(json: ioBroker.HostObject, name: string, value: any) {
        (json.common as Record<string, any>)[name] = value;
        this.onChange(JSON.stringify(json, null, 2));
    }

    removeCommonItem(json: ioBroker.HostObject, name: string) {
        delete (json.common as Record<string, any>).common[name];
        this.onChange(JSON.stringify(json, null, 2));
    }

    buttonAddKey(nameKey: string, cb: () => void) {
        const { t, classes } = this.props;
        return <div
            className={classes.marginBlock}
        >
            <Button
                className={classes.buttonAdd}
                variant="contained"
                color="secondary"
                onClick={cb}
                startIcon={<IconAdd />}
            >
                {t(`Add ${nameKey}`)}
            </Button>
        </div>;
    }

    buttonRemoveKey(nameKey: string, cb: () => void) {
        const { t, classes } = this.props;
        return <Tooltip title={t(`Remove ${nameKey}`)}><div className={classes.close} onClick={cb} /></Tooltip>;
    }

    renderCommonEdit() {
        try {
            const json = JSON.parse(this.state.text);
            const disabled = false;
            const { classes, t } = this.props;
            return <div className={classes.commonTabWrapper}>
                <div className={classes.commonWrapper}>
                    {typeof json.common.title !== 'undefined' ?
                        <TextField
                            variant="standard"
                            disabled={disabled}
                            label={t('title')}
                            className={Utils.clsx(classes.marginBlock, classes.textField)}
                            fullWidth
                            value={json.common.title}
                            onChange={el => this.setCommonItem(json, 'title', el.target.value)}
                            InputProps={{
                                endAdornment: json.common.title ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => this.setCommonItem(json, 'title', '')}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null,
                            }}
                        /> :
                        this.buttonAddKey('title', () => this.setCommonItem(json, 'title', ''))}
                    {typeof json.common.color !== 'undefined' ?
                        <div className={classes.flex}>
                            <TextField
                                variant="standard"
                                disabled={disabled}
                                className={Utils.clsx(classes.marginBlock, classes.color)}
                                label={t('Color')}
                                type="color"
                                value={json.common.color}
                                onChange={el => this.setCommonItem(json, 'color', el.target.value)}
                                InputProps={{
                                    endAdornment: json.common.color ? <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => this.setCommonItem(json, 'color', '')}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment> : null,
                                }}
                            />
                            {this.buttonRemoveKey('color', () => this.removeCommonItem(json, 'color'))}
                        </div> :
                        this.buttonAddKey('color', () => this.setCommonItem(json, 'color', ''))}
                </div>
                {typeof json.common.icon !== 'undefined' ?
                    <div className={classes.flexDrop}>
                        <UploadImage
                            disabled={disabled}
                            crop
                            maxSize={256 * 1024}
                            icon={json.common.icon}
                            removeIconFunc={() => this.setCommonItem(json, 'icon', '')}
                            onChange={base64 => this.setCommonItem(json, 'icon', base64)}
                        />
                        {this.buttonRemoveKey('icon', () => this.removeCommonItem(json, 'icon'))}
                    </div> :
                    <div className={classes.flexDrop}>
                        {this.buttonAddKey('icon', () => this.setCommonItem(json, 'icon', ''))}
                    </div>}
            </div>;
        } catch (e) {
            return <div>{this.props.t('Cannot parse JSON!')}</div>;
        }
    }

    render() {
        // const withAlias = this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state';

        return <Dialog
            classes={{ paper: this.props.classes.dialog }}
            open={!0}
            maxWidth="lg"
            fullWidth
            fullScreen={false}
            onClose={() => this.props.onClose()}
            aria-labelledby="edit-value-dialog-title"
            aria-describedby="edit-value-dialog-description"
        >
            <DialogTitle id="edit-value-dialog-title">
                {this.props.t('Edit host settings')}
:
                <span className={this.props.classes.id}>{this.props.obj._id}</span>
            </DialogTitle>
            <DialogContent>
                {this.renderCommonEdit()}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={this.state.error || !this.state.changed}
                    onClick={() => this.onUpdate()}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Write')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="grey"
                    startIcon={<IconClose />}
                >
                    {this.props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(HostEdit);
