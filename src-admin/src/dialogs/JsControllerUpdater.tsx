import React, { Component, type JSX } from 'react';
import ipaddr from 'ipaddr.js';

import { LinearProgress, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Close as CloseIcon, Refresh as ReloadIcon } from '@mui/icons-material';

import { type AdminConnection, I18n, type ThemeType } from '@iobroker/gui-components';

const MAX_TRANSIENT_STATUS_FAILURES = 30;
const STATUS_REQUEST_TIMEOUT_MS = 5_000;
const UPGRADE_STATUS_PATH = '/controller-upgrade-status';
/** How long the restarted js-controller may take to report the new version, before the dialog says so */
const RESTART_TIMEOUT_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 1_000;
/** After an error the dialog still looks for the result, but less often */
const POLL_INTERVAL_AFTER_ERROR_MS = 5_000;

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

function upgradeStartWasRejected(response: unknown): boolean {
    if (response === false) {
        return true;
    }

    return (
        typeof response === 'object' &&
        response !== null &&
        'result' in response &&
        (response as { result?: unknown }).result === false
    );
}

function isServerResponse(response: unknown): response is ServerResponse {
    if (typeof response !== 'object' || response === null) {
        return false;
    }

    const candidate = response as Partial<ServerResponse>;
    return (
        typeof candidate.running === 'boolean' &&
        Array.isArray(candidate.stderr) &&
        candidate.stderr.every(line => typeof line === 'string') &&
        Array.isArray(candidate.stdout) &&
        candidate.stdout.every(line => typeof line === 'string')
    );
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
    response: ServerResponse | null;
    error: string | null;
    starting: boolean;
}

export default class JsControllerUpdater extends Component<JsControllerUpdaterProps, JsControllerUpdaterState> {
    /** If update is currently in progress */
    private updating = false;

    /** Ref to the textarea element where the update information is shown to the user */
    private readonly textareaRef: React.RefObject<HTMLTextAreaElement | null> = React.createRef();

    /** The address of the server to get update information from with protocol and port */
    private link = `${window.location.protocol}//${window.location.host}/`;

    /** Timer for the next update status request */
    private pollTimer: ReturnType<typeof setTimeout> | null = null;

    /** Initial timeout to give server time to start without showing an error */
    private startTimeout: ReturnType<typeof setTimeout> | null = null;

    /** Number of consecutive failed status requests after the upgrade manager was reached */
    private failedStatusRequests = 0;

    /** Whether a terminal update result was received or reconstructed */
    private finished = false;

    /** Whether npm finished successfully and the restarted controller still has to confirm its version */
    private awaitingControllerRestart = false;

    /** When npm finished successfully, the restart of the controller is measured from here */
    private restartWaitStart = 0;

    /** Whether this component has been unmounted */
    private unmounted = false;

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
        let hostIp: string | string[] = settings?.config?.objects?.host || '';

        if (!hostIp || hostIp === 'localhost') {
            return;
        }

        hostIp = ipaddr.parse(Array.isArray(hostIp) ? hostIp[0] : hostIp).toString();

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
            console.error(`Cannot find ip address: ${(e as Error).message}`);
        }

        try {
            // send update command to js-controller
            const result: unknown = await this.props.socket.upgradeController(
                this.props.hostId,
                this.props.version,
                parseInt(this.props.adminInstance.split('.').pop() || '', 10),
            );
            if (upgradeStartWasRejected(result)) {
                throw new Error('Controller rejected the update request');
            }
        } catch (e) {
            console.error(`Cannot update controller: ${(e as Error).message}`);
            this.setState({ error: I18n.t('Not updatable'), starting: false });
            this.setUpdating(false);
            return;
        }

        this.setUpdating(true);
        this.scheduleStatusCheck();

        this.startTimeout = setTimeout(() => {
            this.startTimeout = null;
            if (!this.unmounted) {
                this.setState({ starting: false });
            }
        }, 10_000); // give 10 seconds to controller to start update
    }

    /**
     * Lifecycle hook called if component will unmount
     * Clearing intervals and timers here
     */
    componentWillUnmount(): void {
        this.unmounted = true;

        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }

        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
            this.startTimeout = null;
        }

        this.setUpdating(false);
    }

    /**
     * Schedule the next status request only after the previous one has finished.
     */
    scheduleStatusCheck(): void {
        if (this.finished || this.unmounted || this.pollTimer) {
            return;
        }

        this.pollTimer = setTimeout(
            () => {
                this.pollTimer = null;
                void this.checkStatus();
            },
            this.state.error ? POLL_INTERVAL_AFTER_ERROR_MS : POLL_INTERVAL_MS,
        );
    }

    /**
     * Check whether the restarted host already reports the requested controller version.
     */
    async isTargetVersionInstalled(): Promise<boolean> {
        try {
            const host = await this.props.socket.getObject(this.props.hostId);
            return host?.common?.installedVersion === this.props.version;
        } catch {
            return false;
        }
    }

    /**
     * Finish the update after the restarted controller confirms the requested version.
     */
    finishSuccessfully(): void {
        const response: ServerResponse = {
            running: false,
            stderr: [...(this.state.response?.stderr || [])],
            stdout: [...(this.state.response?.stdout || [])],
            success: true,
        };
        response.stdout.push('');
        response.stdout.push('---------------------------------------------------');
        response.stdout.push(I18n.t('%s was successfully updated to %s', 'js-controller', this.props.version));
        this.finished = true;
        this.awaitingControllerRestart = false;
        this.setUpdating(false);
        this.setState({ response, error: null, starting: false }, () => {
            if (this.textareaRef.current) {
                setTimeout(
                    () =>
                        this.textareaRef.current &&
                        (this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight),
                    100,
                );
            }
        });
    }

    /**
     * Request the current status from the server and show it in the textarea
     */
    async checkStatus(): Promise<void> {
        if (this.finished || this.unmounted) {
            return;
        }

        // The upgrade server shuts down after its final answer, and another request (e.g. the reconnect of
        // the socket) may have got it, or the browser cannot reach it at all. So once npm is through, or the server
        // does not answer, the restarted controller reporting the requested version is the success.
        // Before the update the host still reports the old version.
        if (
            (this.awaitingControllerRestart || this.failedStatusRequests > 0) &&
            (await this.isTargetVersionInstalled())
        ) {
            if (!this.finished && !this.unmounted) {
                this.finishSuccessfully();
            }
            return;
        }

        const statusLink = new URL(UPGRADE_STATUS_PATH, this.link).toString();
        console.log(`Request update status from: ${statusLink}`);
        const abortController = new AbortController();
        const requestTimeout = setTimeout(() => abortController.abort(), STATUS_REQUEST_TIMEOUT_MS);

        try {
            const res = await fetch(statusLink, { signal: abortController.signal });

            const plainBody = await res.text();
            console.log(`Received update status (${res.status}, ${plainBody.length} bytes)`);

            if (this.finished || this.unmounted) {
                return;
            }

            if (!res.ok || !plainBody.trimStart().startsWith('{')) {
                // e.g. the restarted admin answers on the same port: the next request checks the version of the host
                throw new Error(I18n.t('Update status is not available yet'));
            }

            const parsedResponse: unknown = JSON.parse(plainBody);
            if (!isServerResponse(parsedResponse)) {
                throw new Error(I18n.t('Invalid update status response'));
            }
            const response = parsedResponse;
            this.failedStatusRequests = 0;

            // sometimes stderr has only one empty string in it
            if (response?.stderr) {
                response.stderr = response.stderr.filter((line: string) => line.trim());
            }
            if (!response.running && response.success) {
                // npm has finished, but the old controller is still the active source of version information.
                // Keep polling until the restarted controller advertises the requested version.
                if (!this.awaitingControllerRestart) {
                    this.restartWaitStart = Date.now();
                }
                this.awaitingControllerRestart = true;
                response.running = true;
                response.success = undefined;
            } else if (response?.stdout) {
                response.stdout.unshift('');
                response.stdout.unshift('---------------------------------------------------');
                response.stdout.unshift(I18n.t('updating %s to %s...', 'js-controller', this.props.version));
            }
            if (!response.running) {
                this.finished = true;
                this.setUpdating(false);
            } else {
                this.setUpdating(true);
            }
            this.setState({ response, error: null }, () => {
                // scroll down
                if (this.textareaRef.current) {
                    setTimeout(
                        () =>
                            this.textareaRef.current &&
                            (this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight),
                        100,
                    );
                }
            });
        } catch (e) {
            this.failedStatusRequests++;
            if (this.finished || this.unmounted || this.state.starting || this.state.error) {
                // nothing to show (yet), or the error is already shown
            } else if (this.awaitingControllerRestart) {
                // npm is through, and while the controller restarts, its status server cannot be reached
                if (Date.now() - this.restartWaitStart >= RESTART_TIMEOUT_MS) {
                    this.setState(
                        {
                            error: I18n.t(
                                'The update was installed, but js-controller does not report version %s yet. Please check the host.',
                                this.props.version,
                            ),
                        },
                        () => this.setUpdating(false),
                    );
                }
            } else if (this.failedStatusRequests >= MAX_TRANSIENT_STATUS_FAILURES) {
                const error = abortController.signal.aborted
                    ? new Error(I18n.t('Update status is not available yet'))
                    : (e as Error);
                this.setState({ error: error.toString() }, () => this.setUpdating(false));
            }
        } finally {
            clearTimeout(requestTimeout);
            this.scheduleStatusCheck();
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
                                    : // after a successful update the result is at the end of stdout
                                      this.state.response?.stderr.length && !this.state.response.success
                                      ? this.state.response.stderr.join('\n')
                                      : (this.state.response?.stdout.join('\n') ?? '')
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
