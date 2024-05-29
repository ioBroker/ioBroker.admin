import React, { Component } from 'react';

import {
    Button,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';

import {
    Close as CloseIcon,
    Refresh as ReloadIcon,
} from '@mui/icons-material';

import { I18n, type AdminConnection } from '@iobroker/adapter-react-v5';

interface WebserverParameters {
    useHttps: boolean;
    port: number;
    certPrivateName?: string;
    certPublicName?: string;
}

interface ServerResponse {
    running: boolean;
    stderr: string[];
    stdout: string[];
    success?: boolean;
}

interface AdminUpdaterProps {
    socket: AdminConnection;
    host: string;
    onClose: () => void;
    version: string;
    adminInstance: string;
    onUpdating: (updating: boolean) => void;
    themeType: string;
}

interface AdminUpdaterState {
    response: any;
    error: any;
    starting: boolean;
    upAgain: boolean;
}

class AdminUpdater extends Component<AdminUpdaterProps, AdminUpdaterState> {
    private updating: boolean;

    private interval: ReturnType<typeof setInterval>;

    private startTimeout: ReturnType<typeof setTimeout>;

    private readonly textareaRef: React.RefObject<HTMLTextAreaElement>;

    private readonly link: string;

    constructor(props: AdminUpdaterProps) {
        super(props);

        this.state = {
            response: null,
            error: null,
            /** if upgrade is just starting, we ignore errors in the beginning */
            starting: true,
            /** if admin is up again after upgrade */
            upAgain: false,
        };

        this.updating = false;

        this.textareaRef = React.createRef();

        this.link = `${window.location.protocol}//${window.location.host}/`;
    }

    setUpdating(updating: boolean) {
        if (this.updating !== updating) {
            this.updating = updating;
            this.props.onUpdating(updating);
        }
    }

    /**
     * Get the webserver configuration of the current admin instance
     */
    async getWebserverParams(): Promise<WebserverParameters> {
        const obj = await this.props.socket.getObject(`system.adapter.${this.props.adminInstance}`);

        return {
            useHttps: obj.native.secure,
            port: obj.native.port,
            certPrivateName: obj.native.certPrivate,
            certPublicName: obj.native.certPublic,
        };
    }

    async componentDidMount() {
        const {
            certPrivateName, certPublicName, port, useHttps,
        } = await this.getWebserverParams();

        await this.props.socket.upgradeAdapterWithWebserver(
            this.props.host,
            {
                version: this.props.version,
                adapterName: 'admin',
                port,
                useHttps,
                certPublicName,
                certPrivateName,
            },
        );

        this.setUpdating(true);
        this.interval = setInterval(() => this.checkStatus(), 1_000); // poll every second

        this.startTimeout = setTimeout(() => {
            this.startTimeout = null;
            this.setState({ starting: false });
        }, 10_000); // give 10 seconds to controller to start update
    }

    componentWillUnmount() {
        this.interval && clearInterval(this.interval);
        this.interval = null;

        this.startTimeout && clearTimeout(this.startTimeout);
        this.startTimeout = null;
    }

    async checkStatus() {
        console.log(`Request update status from: ${this.link}`);
        try {
            const res = await fetch(this.link);

            // Just for logging purposes
            const plainBody = await res.text();
            console.log(`Received status: ${plainBody}`);

            if (plainBody.startsWith('{') && plainBody.endsWith('}')) {
                try {
                    const response: ServerResponse = JSON.parse(plainBody) as ServerResponse;
                    // sometimes stderr has only one empty string in it
                    if (response?.stderr) {
                        response.stderr = response.stderr.filter(line => line.trim());
                    }
                    if (response && !response.running && response.success && response.stdout) {
                        response.stdout.push('');
                        response.stdout.push('---------------------------------------------------');
                        response.stdout.push(I18n.t('%s was successfully updated to %s', 'admin', this.props.version));
                    } else if (response?.stdout) {
                        response.stdout.unshift('');
                        response.stdout.unshift('---------------------------------------------------');
                        response.stdout.unshift(I18n.t('updating %s to %s...', 'admin', this.props.version));
                    }
                    this.setState({ response, error: null }, async () => {
                        if (response && !response.running) {
                            this.interval && clearInterval(this.interval);
                            this.interval = null;
                            this.waitForAdapterStart();
                        } else if (response?.running) {
                            this.setUpdating(true);
                        }

                        // scroll down
                        if (this.textareaRef.current) {
                            setTimeout(() => (this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight), 100);
                        }
                    });
                } catch (e) {
                    console.error(`Cannot parse response: ${e}`);
                    this.setState({ error: plainBody }, () => this.setUpdating(false));
                }
            } else {
                console.error(`Response is not JSON: ${plainBody}`);
            }
        } catch (e) {
            if (!this.state.starting) {
                this.setState({ error: e.toString() }, () => this.setUpdating(false));
            }
        }
    }

    /**
     * Wait until admin is up again
     */
    waitForAdapterStart() {
        this.interval = setInterval(async () => {
            try {
                await fetch(this.link);
                clearInterval(this.interval);
                this.setState({ upAgain: true });
            } catch  {
                // ignore, it will throw until admin is reachable
            }
        }, 1_000);
    }

    render() {
        return <Dialog
            onClose={(e, reason) => {
                if (reason !== 'escapeKeyDown' && reason !== 'backdropClick') {
                    this.props.onClose();
                }
            }}
            open={!0}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>{I18n.t('Updating %s...', 'admin')}</DialogTitle>
            <DialogContent style={{ height: 400, padding: '0 20px', overflow: 'hidden' }}>
                {(!this.state.response || this.state.response.running) && !this.state.error ? <LinearProgress /> : null}
                {this.state.response || this.state.error ? <textarea
                    ref={this.textareaRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        background: this.props.themeType === 'dark' ? '#000' : '#fff',
                        color: this.props.themeType === 'dark' ? '#EEE' : '#111',
                        boxSizing: 'border-box',
                        fontFamily:
                            'Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace',
                        border: this.state.response?.success
                            ? '2px solid green'
                            : this.state.error ||
                            (this.state.response &&
                                !this.state.response.running &&
                                !this.state.response.success)
                                ? '2px solid red'
                                : undefined,
                    }}
                    value={
                        this.state.error
                            ? this.state.error
                            : this.state.response.stderr && this.state.response.stderr.length
                                ? this.state.response.stderr.join('\n')
                                : this.state.response.stdout.join('\n')
                    }
                    readOnly
                /> : null}
            </DialogContent>
            <DialogActions>
                <Button
                    // loading={this.state.response?.success && !this.state.upAgain}
                    variant="contained"
                    disabled={this.state.starting || (!this.state.error && !this.state.upAgain)}
                    onClick={() => {
                        if (this.state.response?.success) {
                            window.location.reload();
                        }
                        this.props.onClose();
                    }}
                    color={this.state.response?.success ? 'primary' : 'grey'}
                    startIcon={this.state.response?.success ? <ReloadIcon /> : <CloseIcon />}
                >
                    {this.state.response?.success && !this.state.upAgain ? <CircularProgress /> :
                        (this.state.response?.success ? I18n.t('Reload') : I18n.t('Close'))}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default AdminUpdater;
