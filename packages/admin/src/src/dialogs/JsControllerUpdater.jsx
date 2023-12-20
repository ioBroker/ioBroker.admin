import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ipaddr from 'ipaddr.js';

import { LinearProgress } from '@mui/material';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import CloseIcon from '@mui/icons-material/Close';
import ReloadIcon from '@mui/icons-material/Refresh';

import { I18n } from '@iobroker/adapter-react-v5';

class JsControllerUpdater extends Component {
    constructor(props) {
        super(props);

        this.state = {
            response: null,
            error: null,
            starting: true,
        };

        this.updating = false;

        this.textareaRef = React.createRef();

        this.link = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    setUpdating(updating) {
        if (this.updating !== updating) {
            this.updating = updating;
            this.props.onUpdating(updating);
        }
    }

    async findIpAddress() {
        // Controller to update: this.props.hostId
        // Current admin instance: this.props.adminInstance = 'admin.X'
        // read settings of admin.X
        const instanceObj = await this.props.socket.getObject(`system.adapter.${this.props.adminInstance}`);
        if (instanceObj.common.host === this.props.hostId) {
            return;
        }

        // we are updating some slave => try to find the common ip address
        const host = await this.props.socket.getObject(`system.host.${this.props.hostId}`);
        const settings = await this.props.socket.readBaseSettings(this.props.hostId);
        let hostIp = settings?.config?.objects?.host;

        if (!hostIp || hostIp === 'localhost') {
            return;
        }

        hostIp = ipaddr.parse(hostIp);

        if (!host?.native?.hardware?.networkInterfaces) {
            return;
        }

        // find common ip address in host.native.hardware.networkInterfaces
        for (const networkInterface of Object.values(host.native.hardware.networkInterfaces)) {
            networkInterface.find(addr => {
                // addr = {
                //     "address": "192.168.178.45",
                //     "netmask": "255.255.255.0",
                //     "family": "IPv4",
                //     "mac": "00:2e:5c:68:15:e1",
                //     "internal": false,
                //     "cidr": "192.168.178.45/24"
                // }
                try {
                    const iIP = ipaddr.parseCIDR(addr.cidr);
                    if (addr.internal === false && hostIp.match(iIP)) {
                        this.link = `${window.location.protocol}//${
                            addr.family === 'IPv6' ? `[${addr.address}]` : addr.address
                        }:${window.location.port}`;
                    }
                } catch (e) {
                    // ignore
                }
                return false;
            });
        }
    }

    componentDidMount() {
        // send update command to js-controller
        this.findIpAddress()
            .catch(e => {
                // cannot find ip address
                console.error(`Cannot find ip address: ${e}`);
            })
            .then(() => {
                this.props.socket.getRawSocket().emit(
                    'sendToHost',
                    this.props.hostId,
                    'upgradeController',
                    {
                        version: this.props.version,
                        adminInstance: parseInt(this.props.adminInstance.split('.').pop(), 10),
                    },
                    result => {
                        if (result.result) {
                            this.setUpdating(true);
                            this.intervall = setInterval(() => this.checkStatus(), 1_000); // poll every second

                            this.startTimeout = setTimeout(() => {
                                this.startTimeout = null;
                                this.setState({ starting: false });
                            }, 10_000); // give 10 seconds to controller to start update
                        } else {
                            this.setState({ error: I18n.t('Not updatable'), starting: false });
                            this.setUpdating(false);
                        }
                    },
                );
            });
    }

    componentWillUnmount() {
        this.intervall && clearInterval(this.intervall);
        this.intervall = null;

        this.startTimeout && clearTimeout(this.startTimeout);
        this.startTimeout = null;
    }

    checkStatus() {
        // interface ServerResponse {
        //     running: boolean; // If the update is still running
        //     stderr: string[];
        //     stdout: string[];
        //     success?: boolean; // if installation process succeeded
        // }

        fetch(this.link)
            .then(res => res.json())
            .then(response => {
                // sometimes stderr has only one empty string in it
                if (response && response.stderr) {
                    response.stderr = response.stderr.filter(line => line.trim());
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
                        this.intervall && clearInterval(this.intervall);
                        this.intervall = null;
                    } else if (response?.running) {
                        this.setUpdating(true);
                    }

                    // scroll down
                    if (this.textareaRef.current) {
                        setTimeout(() => (this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight), 100);
                    }
                });
            })
            .catch(e => {
                if (!this.state.starting) {
                    this.setState({ error: e.toString() }, () => this.setUpdating(false));
                }
            });
    }

    render() {
        return (
            <Dialog
                onClose={(e, reason) => {
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

JsControllerUpdater.propTypes = {
    socket: PropTypes.object.isRequired,
    hostId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    version: PropTypes.string.isRequired,
    adminInstance: PropTypes.string.isRequired,
    onUpdating: PropTypes.func.isRequired,
    themeType: PropTypes.string,
};

export default JsControllerUpdater;
