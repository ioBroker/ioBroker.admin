import React, { Component } from 'react';

import { withStyles, type Styles } from '@mui/styles';

import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
} from '@mui/material';

import {
    Close as CloseIcon,
    OpenInBrowser as OpenInBrowserIcon,
} from '@mui/icons-material';

import type { Theme, Translator } from '@iobroker/adapter-react-v5/types';
import type { AdminConnection } from '@iobroker/socket-client';
import Command from '../components/Command';

const styles: Styles<Theme, any> = theme => ({
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    hiddenDialog: {
        display: 'none',
    },
    dialogRoot: {
        height: 'calc(100% - 64px)',
    },
});

interface CommandDialogProps {
    t: Translator;
    confirmText: string;
    onClose: () => void;
    onInBackground: () => void;
    visible: boolean;
    ready: boolean;
    onSetCommandRunning: (running: boolean) => void;
    cmd: string;
    errorFunc: (error: string) => void;
    performed: () => void;
    inBackground: boolean;
    commandError: boolean;
    socket: AdminConnection;
    host: string;
    classes: Record<string, string>;
    callback: (exitCode: number) => void;
}

interface CommandDialogState {
    progressText: string;
    closeOnReady: boolean;
}

class CommandDialog extends Component<CommandDialogProps, CommandDialogState> {
    constructor(props: CommandDialogProps) {
        super(props);

        this.state = {
            progressText: '',
            closeOnReady: (window._localStorage || window.localStorage).getItem('CommandDialog.closeOnReady') === 'true',
        };
    }

    render() {
        const { classes } = this.props;

        return <Dialog
            scroll="paper"
            fullWidth
            classes={{ root: !this.props.visible ? classes.hiddenDialog : '', paper: classes.dialogRoot }}
            onClose={this.props.inBackground ? this.props.onClose : this.props.onInBackground}
            open={!0}
            maxWidth="md"
        >
            <DialogTitle>
                {this.state.progressText || this.props.t('Running command')}
                <IconButton size="large" className={classes.closeButton} onClick={this.props.onClose} disabled={this.props.inBackground}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers style={{ height: '100%' }}>
                <Command
                    noSpacing
                    key="command"
                    ready={this.props.ready}
                    host={this.props.host}
                    socket={this.props.socket}
                    t={this.props.t}
                    inBackground={this.props.inBackground}
                    commandError={this.props.commandError}
                    errorFunc={this.props.errorFunc}
                    performed={this.props.performed}
                    callback={this.props.callback}
                    cmd={this.props.cmd}
                    onFinished={() => this.state.closeOnReady && this.props.onClose()}
                    onSetCommandRunning={(running: boolean) => this.props.onSetCommandRunning(running)}
                />
            </DialogContent>
            <DialogActions style={{ justifyContent: 'space-between' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            disabled={this.props.inBackground}
                            checked={this.state.closeOnReady}
                            onChange={e => {
                                this.setState({ closeOnReady: e.target.checked });
                                (window._localStorage || window.localStorage).setItem('CommandDialog.closeOnReady', e.target.checked ? 'true' : 'false');
                            }}
                        />
                    }
                    label={this.props.t('close on ready')}
                />
                <div>
                    <Button
                        variant="contained"
                        autoFocus
                        disabled={this.props.inBackground}
                        style={{ marginRight: 8 }}
                        onClick={this.props.onInBackground}
                        startIcon={<OpenInBrowserIcon />}
                        color="primary"
                    >
                        {this.props.confirmText || this.props.t('In background')}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!this.props.inBackground}
                        onClick={this.props.onClose}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(CommandDialog);
