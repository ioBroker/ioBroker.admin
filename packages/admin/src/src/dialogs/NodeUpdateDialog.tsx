import React from 'react';
import {
    Box,
    Button, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { AdminConnection, I18n } from '@iobroker/adapter-react-v5';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface NodeUpdateDialogProps {
    /** Called when user closes dialog */
    onClose: () => void;
    /** The socket connection */
    socket: AdminConnection;
    /** The host id of the host to upgrade node.js on */
    hostId: string;
    /** The node.js version to upgrade to */
    version: string;
}

interface NodeUpdateDialogState {
    /** If update is in progress */
    inProgress: boolean;
    /** Result from controller */
    success: boolean;
    /** Error from controller */
    error: string;
    /** If execution finished */
    finished: boolean;
}

interface ControllerResponse  {
    /** If upgrade was successful */
    success: boolean;
    /** Error message */
    error: string;
}

export default class NodeUpdateDialog extends React.Component<NodeUpdateDialogProps, NodeUpdateDialogState> {
    constructor(props: NodeUpdateDialogProps) {
        super(props);

        this.state = {
            inProgress: false,
            success: false,
            error: '',
            finished: false,
        };
    }

    /**
     * Render the element
     */
    render(): React.JSX.Element {
        return <Dialog
            open={!0}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>{I18n.t('Node.js upgrade')}</DialogTitle>
            <DialogContent style={{ height: 100, padding: '0 20px', overflow: 'hidden' }}>
                {!this.state.finished ? <Typography>{I18n.t('Performing this update will restart the js-controller afterwards!')}</Typography> : null}
                {this.state.inProgress ? <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box> : null}
                {this.state.success ? <Typography>{I18n.t('Node.js update successful, restarting controller now!')}</Typography> : null}
                {this.state.error ? <Typography sx={{ color: 'red' }}>{I18n.t('Node.js update failed: %s', this.state.error)}</Typography> : null}
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={this.state.inProgress || this.state.finished}
                    color="primary"
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => this.updateNodeJsVersion()}
                >
                    {I18n.t('Upgrade')}
                </Button>
                <Button
                    disabled={this.state.inProgress}
                    variant="contained"
                    onClick={() => {
                        this.props.onClose();
                    }}
                    color="primary"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    /**
     * Update Node.js to given version and restart the controller afterwards
     */
    async updateNodeJsVersion(): Promise<void> {
        this.setState({ inProgress: true });

        const res = await new Promise<ControllerResponse>(resolve => this.props.socket.getRawSocket().emit(
            'sendToHost',
            this.props.hostId,
            'upgradeOsPackages',
            {
                packages: [{
                    name: 'nodejs',
                    // For apt updates we need to be precise about the version, e.g. `18.20.2-1nodesource1`, thus we simply upgrade to the newest version instead
                    // version: this.props.version,
                }],
                // restart the controller after the Node.js update
                restart: true,
            },
            (resp: ControllerResponse)  => resolve(resp),
        ));

        this.setState({
            inProgress: false, success: res.success, error: res.error, finished: true,
        });
    }
}
