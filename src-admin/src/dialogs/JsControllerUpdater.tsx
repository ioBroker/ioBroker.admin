import React, { Component, type JSX } from 'react';
import ipaddr from 'ipaddr.js';

import { LinearProgress, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Close as CloseIcon, Refresh as ReloadIcon } from '@mui/icons-material';

import { type AdminConnection, I18n, type ThemeType } from '@iobroker/adapter-react-v5';

interface NetworkInterface {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
    cidr: string;
}

interface ServerResponse {
    /** If the update is still running */
    running: boolean;
    stderr: string[];
    stdout: string[];
    /** if installation process succeeded */
    success?: boolean;
}

interface JsControllerUpdaterProps {
    socket: AdminConnection;
    hostId: `system.host.${string}`;
    onClose: () => void;
    version: string;
    adminInstance: string;
    onUpdating: (updating: boolean) => void;
    themeType?: ThemeType;
}

interface JsControllerUpdaterState {
    response: any;
    error: string | null;
    starting: boolean;
}

export default class JsControllerUpdater extends Component<JsControllerUpdaterProps, JsControllerUpdaterState> {
    /** If update is currently in progress */
    private updating = false;

    /** Ref to the textarea element where the update information is shown to the user */
    private readonly textareaRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

    /** The address of the server to get update information from with protocol and port */
    private link = `${window.location.protocol}//${window.location.host}/`;

    /** Interval to poll update status from server */
    private interval: ReturnType<typeof setTimeout> | null;

    /** Initial timeout to give server time to start without showing an error */
    private startTimeout: ReturnType<typeof setTimeout> | null;

    constructor(props: JsControllerUpdaterProps) {
        super(props);

        this.state = {
            response: null,
            error: null,
            starting: true,
        };
    }

    /**
     * Calls props.onUpdating if the updating state has changed
     *
     * @param updating target value true if update is in progress
     */
    setUpdating(updating: boolean): void {
        if (this.updating !== updating) {
            this.updating = updating;
            this.props.onUpdating(updating);
        }
    }

    /**
     * Determine the correct ip address of the server
     * If the current admin instance is running on the host to be updated, we take it from the browser, else we try to get information from the host object
     */
    async findIpAddress(): Promise<void> {
        // Controller to update: this.props.hostId
        // Current admin instance: this.props.adminInstance = 'admin.X'
        // read settings of admin.X
        const instanceObj: ioBroker.InstanceObject = (await this.props.socket.getObject(
            `system.adapter.${this.props.adminInstance}`,
        )) as any as ioBroker.InstanceObject;
        if (instanceObj.common.host === this.props.hostId) {
            return;
        }

        // we are updating some slave => try to find the common ip address
        const host = await this.props.socket.getObject(this.props.hostId);
        const settings = await this.props.socket.readBaseSettings(this.props.hostId);
        let hostIp = settings?.config?.objects?.host;

        if (!hostIp || hostIp === 'localhost') {
            return;
        }

        hostIp = ipaddr.parse(hostIp).toString();

        if (!host?.native?.hardware?.networkInterfaces) {
            return;
        }

        // find common ip address in host.native.hardware.networkInterfaces
        for (const networkInterface of Object.values(host.native.hardware.networkInterfaces)) {
            (networkInterface as NetworkInterface[]).find(addr => {
                // addr = {
                //     "address": "192.168.178.45",
                //     "netmask": "255.255.255.0",
                //     "family": "IPv4",
                //     "mac": "00:2e:5c:68:15:e1",
                //     "internal": false,
                //     "cidr": "192.168.178.45/24"
                // }
                try {
                    const iIP = ipaddr.parseCIDR(addr.cidr).toString();
                    if (addr.internal === false && hostIp.match(iIP)) {
                        this.link = `${window.location.protocol}//${
                            addr.family === 'IPv6' ? `[${addr.address}]` : addr.address
                        }:${window.location.port}`;
                    }
                } catch {
                    // ignore
                }
                return false;
            });
        }
    }

    /**
     * Lifecycle hook called if component mounts
     * We try to get the correct ip address on mount and start the update immediately
     */
    async componentDidMount(): Promise<void> {
        try {
            await this.findIpAddress();
        } catch (e) {
            console.error(`Cannot find ip address: ${e.message}`);
        }

        try {
            // send update command to js-controller
            await this.props.socket.upgradeController(
                this.props.hostId,
                this.props.version,
                parseInt(this.props.adminInstance.split('.').pop(), 10),
            );
        } catch (e) {
            console.error(`Cannot update controller: ${e.message}`);
            this.setState({ error: I18n.t('Not updatable'), starting: false });
            this.setUpdating(false);
            return;
        }

        this.setUpdating(true);
        this.interval = setInterval(() => this.checkStatus(), 1_000); // poll every second

        this.startTimeout = setTimeout(() => {
            this.startTimeout = null;
            this.setState({ starting: false });
        }, 10_000); // give 10 seconds to controller to start update
    }

    /**
     * Lifecycle hook called if component will unmount
     * Clearing intervals and timers here
     */
    componentWillUnmount(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }
    }

    /**
     * Request the current status from the server and show it in the textarea
     */
    async checkStatus(): Promise<void> {
        console.log(`Request update status from: ${this.link}`);

        try {
            const res = await fetch(this.link);

            const plainBody = await res.text();
            console.log(`Received status: ${plainBody}`);

            const response: ServerResponse = JSON.parse(plainBody);

            // sometimes stderr has only one empty string in it
            if (response?.stderr) {
                response.stderr = response.stderr.filter((line: string) => line.trim());
            }
            if (response && !response.running && response.success && response.stdout) {
                response.stdout.push('');
                response.stdout.push('---------------------------------------------------');
                response.stdout.push(I18n.t('%s was successfully updated to %s', 'js-controller', this.props.version));
            } else if (response?.stdout) {
                response.stdout.unshift('');
                response.stdout.unshift('---------------------------------------------------');
                response.stdout.unshift(I18n.t('updating %s to %s...', 'js-controller', this.props.version));
            }
            this.setState({ response, error: null }, () => {
                if (response && !response.running) {
                    this.setUpdating(false);
                    if (this.interval) {
                        clearInterval(this.interval);
                        this.interval = null;
                    }
                } else if (response?.running) {
                    this.setUpdating(true);
                }

                // scroll down
                if (this.textareaRef.current) {
                    setTimeout(() => (this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight), 100);
                }
            });
        } catch (e) {
            if (!this.state.starting) {
                this.setState({ error: e.toString() }, () => this.setUpdating(false));
            }
        }
    }

    /**
     * Render the UI
     */
    render(): JSX.Element {
        return (
            <Dialog
                onClose={(_e, reason) => {
                    if (reason !== 'escapeKeyDown' && reason !== 'backdropClick') {
                        this.props.onClose();
                    }
                }}
                open={!0}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>{I18n.t('Updating %s...', 'js-controller')}</DialogTitle>
                <DialogContent style={{ height: 400, padding: '0 20px', overflow: 'hidden' }}>
                    {(!this.state.response || this.state.response.running) && !this.state.error ? (
                        <LinearProgress />
                    ) : null}
                    {this.state.response || this.state.error ? (
                        <textarea
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
                        />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        id="js-controller-updater-close"
                        variant="contained"
                        disabled={this.state.starting || (!this.state.error && this.state.response?.running)}
                        onClick={() => {
                            if (this.state.response?.success) {
                                window.location.reload();
                            }
                            this.props.onClose();
                        }}
                        color={this.state.response?.success ? 'primary' : 'grey'}
                        startIcon={this.state.response?.success ? <ReloadIcon /> : <CloseIcon />}
                    >
                        {this.state.response?.success ? I18n.t('Reload') : I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
