import React, { Component } from 'react';

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

import { Close as CloseIcon, OpenInBrowser as OpenInBrowserIcon } from '@mui/icons-material';

import type { IobTheme, Translate, AdminConnection } from '@iobroker/adapter-react-v5';
import Command from '../components/Command';

const styles: Record<string, any> = {
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    hiddenDialog: {
        display: 'none',
    },
    dialogRoot: {
        height: 'calc(100% - 64px)',
    },
};

interface CommandDialogProps {
    t: Translate;
    confirmText?: string;
    onClose: () => void;
    callback: () => void;
    onInBackground: () => void;
    visible: boolean;
    ready: boolean;
    onSetCommandRunning: (running: boolean) => void;
    cmd: string;
    errorFunc: () => void;
    performed: () => void;
    inBackground: boolean;
    commandError: boolean;
    socket: AdminConnection;
    host: string;
}

interface CommandDialogState {
    progressText: string;
    closeOnReady: boolean;
    isError: boolean;
}

class CommandDialog extends Component<CommandDialogProps, CommandDialogState> {
    constructor(props: CommandDialogProps) {
        super(props);

        this.state = {
            progressText: '',
            isError: false,
            closeOnReady:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    'CommandDialog.closeOnReady',
                ) === 'true',
        };
    }

    render() {
        return (
            <Dialog
                scroll="paper"
                fullWidth
                sx={{
                    '&.MuiDialog-root': !this.props.visible ? styles.hiddenDialog : undefined,
                    '& .MuiDialog-paper': styles.dialogRoot,
                }}
                onClose={this.props.inBackground ? this.props.onClose : this.props.onInBackground}
                open={!0}
                maxWidth="md"
            >
                <DialogTitle>
                    {this.state.progressText || this.props.t('Running command')}
                    <IconButton
                        size="large"
                        sx={styles.closeButton}
                        onClick={this.props.onClose}
                        disabled={this.props.inBackground}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    dividers
                    style={{ height: '100%' }}
                >
                    <Command
                        noSpacing
                        key="command"
                        ready={this.props.ready}
                        host={this.props.host}
                        socket={this.props.socket}
                        t={this.props.t}
                        inBackground={this.props.inBackground}
                        commandError={this.props.commandError}
                        errorFunc={() => {
                            this.setState({ isError: true });
                            this.props.errorFunc();
                        }}
                        performed={this.props.performed}
                        callback={this.props.callback}
                        cmd={this.props.cmd}
                        onFinished={() => this.state.closeOnReady && this.props.onClose()}
                        onSetCommandRunning={(running: boolean) => this.props.onSetCommandRunning(running)}
                    />
                </DialogContent>
                <DialogActions style={{ justifyContent: 'space-between' }}>
                    <FormControlLabel
                        style={{ marginLeft: 16 }}
                        control={
                            <Checkbox
                                disabled={this.props.inBackground}
                                checked={this.state.closeOnReady}
                                onChange={e => {
                                    this.setState({ closeOnReady: e.target.checked });
                                    (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                        'CommandDialog.closeOnReady',
                                        e.target.checked ? 'true' : 'false',
                                    );
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
                            onClick={this.props.onInBackground}
                            startIcon={<OpenInBrowserIcon />}
                            color="primary"
                            style={{
                                marginRight: 8,
                            }}
                        >
                            {this.props.confirmText || this.props.t('In background')}
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!this.props.inBackground}
                            onClick={this.props.onClose}
                            color="grey"
                            style={{
                                backgroundColor: this.state.isError ? '#834141' : undefined,
                                color: this.state.isError ? '#fff' : undefined,
                            }}
                            startIcon={<CloseIcon />}
                        >
                            {this.props.t('Close')}
                        </Button>
                    </div>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CommandDialog;
