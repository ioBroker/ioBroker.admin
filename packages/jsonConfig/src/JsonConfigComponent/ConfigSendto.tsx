import React, { type JSX } from 'react';

import { Button, CircularProgress } from '@mui/material';

import { Warning as IconWarning, Error as IconError, Info as IconInfo } from '@mui/icons-material';

import { DialogConfirm, DialogError, DialogMessage, I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemSendTo } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
};

function ip2int(ip: string): number {
    return ip.split('.').reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
}

// copied from iobroker.admin/src-rx/src/Utils.js
function findNetworkAddressOfHost(obj: Record<string, any>, localIp: string): string {
    const networkInterfaces = obj?.native?.hardware?.networkInterfaces;
    if (!networkInterfaces) {
        return null;
    }

    let hostIp: string | undefined;

    // check ipv4 addresses
    Object.keys(networkInterfaces).forEach(inter =>
        networkInterfaces[inter].forEach((ip: Record<string, any>) => {
            if (ip.internal) {
                return;
            }
            if (localIp.includes(':') && ip.family !== 'IPv6') {
                return;
            }
            if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                return;
            }
            // if ip4 and not docker or wsl
            if (
                ip.family === 'IPv4' &&
                !ip.address.startsWith('172') &&
                (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/))
            ) {
                // if DNS name
                hostIp = ip.address;
            } else if (!hostIp) {
                if (
                    ip.family === 'IPv4' &&
                    localIp.includes('.') &&
                    (ip2int(localIp) & ip2int(ip.netmask)) === (ip2int(ip.address) & ip2int(ip.netmask))
                ) {
                    hostIp = ip.address;
                } else {
                    hostIp = ip.address;
                }
            }
        }),
    );

    // check ipv6 addresses
    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter =>
            networkInterfaces[inter].forEach((ip: Record<string, any>) => {
                if (ip.internal) {
                    return;
                }
                if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                }
                if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (
                    ip.family === 'IPv6' &&
                    (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/))
                ) {
                    // if DNS name
                    hostIp = ip.address;
                } else if (!hostIp) {
                    if (
                        ip.family === 'IPv4' &&
                        localIp.includes('.') &&
                        (ip2int(localIp) & ip2int(ip.netmask)) === (ip2int(ip.address) & ip2int(ip.netmask))
                    ) {
                        hostIp = ip.address;
                    } else {
                        hostIp = ip.address;
                    }
                }
            }),
        );
    }

    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter => {
            networkInterfaces[inter].forEach((ip: Record<string, any>) => {
                if (ip.internal) {
                    return;
                }
                if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                }
                if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) {
                    // if DNS name
                    hostIp = ip.address;
                } else {
                    hostIp = ip.address;
                }
            });
        });
    }

    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter => {
            networkInterfaces[inter].forEach((ip: Record<string, any>) => {
                if (ip.internal) {
                    return;
                }
                hostIp = ip.address;
            });
        });
    }

    return hostIp;
}

interface ConfigSendToProps extends ConfigGenericProps {
    schema: ConfigItemSendTo;
}

interface ConfigSendToState extends ConfigGenericState {
    _error: string;
    _message: string;
    hostname: string;
    running?: boolean;
}

class ConfigSendto extends ConfigGeneric<ConfigSendToProps, ConfigSendToState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        let hostname = window.location.hostname;
        if (this.props.schema.openUrl) {
            // read admin host
            const adminInstance = await this.props.oContext.socket.getCurrentInstance();
            const instanceObj = await this.props.oContext.socket.getObject(
                `system.adapter.${adminInstance}` as ioBroker.ObjectIDs.Instance,
            );

            if (instanceObj) {
                const hostObj = await this.props.oContext.socket.getObject(`system.host.${instanceObj?.common?.host}`);
                if (hostObj) {
                    const ip = findNetworkAddressOfHost(hostObj, window.location.hostname);
                    if (ip) {
                        hostname = `${ip}:${window.location.port}`;
                    } else {
                        console.warn(
                            `Cannot find suitable IP in host ${instanceObj.common.host} for ${instanceObj._id}`,
                        );
                        return;
                    }
                }
            }
        }

        await new Promise<void>(resolve => {
            this.setState({ _error: '', _message: '', hostname }, resolve);
        });

        if (this.props.schema.onLoaded) {
            this._onClick();
        }
    }

    renderErrorDialog(): JSX.Element | null {
        if (this.state._error) {
            return (
                <DialogError
                    text={this.state._error}
                    onClose={() => this.setState({ _error: '' })}
                />
            );
        }
        return null;
    }

    renderMessageDialog(): JSX.Element | null {
        if (this.state._message) {
            return (
                <DialogMessage
                    text={this.state._message}
                    onClose={() => this.setState({ _message: '' })}
                />
            );
        }
        return null;
    }

    _onClick(): void {
        this.props.oContext.onCommandRunning(true);
        this.setState({ running: true });

        const _origin = `${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/index\.html$/, '')}`;
        const _originIp = `${window.location.protocol}//${this.state.hostname.split(':').length > 3 ? `[${this.state.hostname}]` : this.state.hostname}${window.location.pathname.replace(/\/index\.html$/, '')}`;

        let data: Record<string, any> = this.props.schema.data;
        if (data === undefined && this.props.schema.jsonData) {
            const dataStr = this.getPattern(
                this.props.schema.jsonData,
                {
                    _origin,
                    _originIp,
                    ...this.props.data,
                },
                true,
            );

            try {
                data = JSON.parse(dataStr);
            } catch {
                console.error(`Cannot parse json data: ${dataStr}`);
            }
        }
        if (data === undefined) {
            data = null;
        }
        if (this.props.schema.openUrl && !data) {
            data = {
                _origin,
                _originIp,
            };
        }
        let timeout: ReturnType<typeof setTimeout> | undefined;
        if (this.props.schema.timeout) {
            timeout = setTimeout(
                () => {
                    this.props.oContext.onCommandRunning(false);
                    this.setState({ _error: I18n.t('ra_Request timed out'), running: false });
                },
                parseInt(this.props.schema.timeout as any as string, 10) || 10000,
            );
        }

        void this.props.oContext.socket
            .sendTo(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance}`,
                this.props.schema.command || 'send',
                data,
            )
            .then(async (response: Record<string, any>) => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                if (response?.error) {
                    if (this.props.schema.error && this.props.schema.error[response.error]) {
                        let error = this.getText(this.props.schema.error[response.error]);
                        if (response.args) {
                            response.args.forEach((arg: string) => (error = error.replace('%s', arg)));
                        }
                        this.setState({ _error: error });
                    } else {
                        this.setState({ _error: response.error ? I18n.t(response.error) : I18n.t('ra_Error') });
                    }
                } else {
                    if (response?.command) {
                        // If backend requested to refresh the config
                        if (this.props.oContext.onBackEndCommand) {
                            this.props.oContext.onBackEndCommand(response.command);
                        }
                        return;
                    }
                    if (response?.reloadBrowser && this.props.schema.reloadBrowser) {
                        window.location.reload();
                    } else if (response?.openUrl && this.props.schema.openUrl) {
                        window.open(response.openUrl, response.window || this.props.schema.window || '_blank');
                    } else if (
                        response?.result &&
                        this.props.schema.result &&
                        this.props.schema.result[response.result]
                    ) {
                        let text = this.getText(this.props.schema.result[response.result]);
                        if (response.args) {
                            response.args.forEach((arg: string) => (text = text.replace('%s', arg)));
                        }
                        window.alert(text);
                    }

                    if (response?.native && this.props.schema.useNative) {
                        for (const [attr, val] of Object.entries(response.native)) {
                            await this.onChangeAsync(attr, val);
                        }

                        setTimeout(
                            () => this.props.oContext.forceUpdate(Object.keys(response.native), this.props.data),
                            300,
                        );
                    } else if (response?.result) {
                        window.alert(
                            typeof response.result === 'object' ? JSON.stringify(response.result) : response.result,
                        );
                    } else {
                        window.alert(I18n.t('ra_Ok'));
                    }

                    if (response?.saveConfig) {
                        this.props.onChange(null, null, null, true);
                    }
                }
            })
            .catch((e: any) => {
                if (this.props.schema.error && this.props.schema.error[e.toString()]) {
                    this.setState({ _error: this.getText(this.props.schema.error[e.toString()]) });
                } else {
                    this.setState({ _error: I18n.t(e.toString()) || I18n.t('ra_Error') });
                }
            })
            .then(() => {
                this.props.oContext.onCommandRunning(false);
                this.setState({ running: false });
            });
    }

    renderDialogConfirm(): JSX.Element | null {
        if (!this.state.confirmDialog) {
            return null;
        }
        const confirm = this.state.confirmData || this.props.schema.confirm;
        let icon = null;
        if (confirm.type === 'warning') {
            icon = <IconWarning />;
        } else if (confirm.type === 'error') {
            icon = <IconError />;
        } else if (confirm.type === 'info') {
            icon = <IconInfo />;
        }

        return (
            <DialogConfirm
                title={this.getText(confirm.title) || I18n.t('ra_Please confirm')}
                text={this.getText(confirm.text)}
                ok={this.getText(confirm.ok) || I18n.t('ra_Ok')}
                cancel={this.getText(confirm.cancel) || I18n.t('ra_Cancel')}
                icon={icon || undefined}
                onClose={isOk => this.setState({ confirmDialog: false }, () => isOk && this._onClick())}
            />
        );
    }

    renderItem(error: Error | undefined, disabled: boolean): JSX.Element {
        const icon = this.getIcon();

        return (
            <div style={styles.fullWidth}>
                <Button
                    variant={this.props.schema.variant || undefined}
                    color={this.props.schema.color || 'grey'}
                    style={{ ...styles.fullWidth, ...(this.props.schema.controlStyle || undefined) }}
                    disabled={disabled || !this.props.alive}
                    startIcon={icon}
                    title={
                        this.props.alive
                            ? this.getText(this.props.schema.title) || ''
                            : I18n.t('ra_Instance is not alive')
                    }
                    onClick={() => {
                        if (this.props.schema.confirm) {
                            this.setState({ confirmDialog: true });
                        } else {
                            this._onClick();
                        }
                    }}
                >
                    {this.props.schema.showProcess && this.state.running ? (
                        <CircularProgress
                            size={20}
                            style={{ marginRight: 8 }}
                        />
                    ) : null}
                    {this.getText(this.props.schema.label, this.props.schema.noTranslation)}
                </Button>
                {this.renderErrorDialog()}
                {this.renderMessageDialog()}
            </div>
        );
    }
}

export default ConfigSendto;
