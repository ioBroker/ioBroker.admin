import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Button, CircularProgress } from '@mui/material';

import IconWarning from '@mui/icons-material/Warning';
import IconError from '@mui/icons-material/Error';
import IconInfo from '@mui/icons-material/Info';
import IconAuth from '@mui/icons-material/Key';
import IconSend from '@mui/icons-material/Send';
import IconWeb from '@mui/icons-material/Public';
import IconSearch from '@mui/icons-material/Search';

import I18n from './wrapper/i18n';
import Icon from './wrapper/Components/Icon';
import DialogError from './wrapper/Dialogs/Error';
import DialogMessage from './wrapper/Dialogs/Message';
import DialogConfirm from './wrapper/Dialogs/Confirm';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%'
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 4,
    },
});

function ip2int(ip) {
    return ip.split('.').reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
}

// copied from iobroker.admin/src-rx/src/Utils.js
function findNetworkAddressOfHost(obj, localIp) {
    const networkInterfaces = obj?.native?.hardware?.networkInterfaces;
    if (!networkInterfaces) {
        return null;
    }

    let hostIp;

    // check ipv4 addresses
    Object.keys(networkInterfaces).forEach(inter =>
        networkInterfaces[inter].forEach(ip => {
            if (ip.internal) {
                return;
            } else if (localIp.includes(':') && ip.family !== 'IPv6') {
                return;
            } else if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                return;
            }
            // if ip4 and not docker or wsl
            if (ip.family === 'IPv4' && !ip.address.startsWith('172') && (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/))) { // if DNS name
                hostIp = ip.address;
            } else if (!hostIp) {
                if (ip.family === 'IPv4' && localIp.includes('.') &&
                    (ip2int(localIp) & ip2int(ip.netmask)) === (ip2int(ip.address) & ip2int(ip.netmask))) {
                    hostIp = ip.address;
                } else {
                    hostIp = ip.address;
                }
            }
        }));

    // check ipv6 addresses
    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter =>
            networkInterfaces[inter].forEach(ip => {
                if (ip.internal) {
                    return;
                } else if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                } else if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (ip.family === 'IPv6' && (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/))) { // if DNS name
                    hostIp = ip.address;
                } else if (!hostIp) {
                    if (ip.family === 'IPv4' && localIp.includes('.') &&
                        (ip2int(localIp) & ip2int(ip.netmask)) === (ip2int(ip.address) & ip2int(ip.netmask))) {
                        hostIp = ip.address;
                    } else {
                        hostIp = ip.address;
                    }
                }
            }));
    }

    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter => {
            networkInterfaces[inter].forEach(ip => {
                if (ip.internal) {
                    return;
                } else if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                } else if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) { // if DNS name
                    hostIp = ip.address;
                } else {
                    hostIp = ip.address;
                }
            });
        });
    }

    if (!hostIp) {
        Object.keys(networkInterfaces).forEach(inter => {
            networkInterfaces[inter].forEach(ip => {
                if (ip.internal) {
                    return;
                }
                hostIp = ip.address;
            });
        });
    }

    return hostIp;
}

class ConfigSendto extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();

        let hostname = window.location.hostname;
        if (this.props.schema.openUrl) {
            // read admin host
            const adminInstance = await this.props.socket.getCurrentInstance();
            const instanceObj = await this.props.socket.getObject(`system.adapter.${adminInstance}`);
            const hostObj = await this.props.socket.getObject(`system.host.${instanceObj.common.host}`);

            const ip = findNetworkAddressOfHost(hostObj, window.location.hostname);
            if (ip) {
                hostname = `${ip}:${window.location.port}`;
            } else {
                console.warn(`Cannot find suitable IP in host ${instanceObj.common.host} for ${instanceObj._id}`);
                return null;
            }
        }
        this.setState( { _error: '', _message: '', hostname });
    }

    renderErrorDialog() {
        if (this.state._error) {
            return <DialogError text={this.state._error} classes={undefined} onClose={() => this.setState({ _error: '' })} />;
        } else {
            return null;
        }
    }

    renderMessageDialog() {
        if (this.state._message) {
            return <DialogMessage text={this.state._message} classes={undefined} onClose={() => this.setState({ _message: '' })} />;
        } else {
            return null;
        }
    }

    _onClick() {
        this.props.onCommandRunning(true);
        this.setState({ running: true });

        const _origin = `${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/index\.html$/, '')}`
        const _originIp = `${window.location.protocol}//${this.state.hostname.split(':').length > 3 ? `[${this.state.hostname}]` : this.state.hostname}${window.location.pathname.replace(/\/index\.html$/, '')}`

        let data = this.props.schema.data;
        if (data === undefined && this.props.schema.jsonData) {
            data = this.getPattern(this.props.schema.jsonData, {
                _origin,
                _originIp,
                ...this.props.data,
            });
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error(`Cannot parse json data: ${data}`);
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
        let timeout;
        if (this.props.schema.timeout) {
            timeout = setTimeout(() => {
                this.props.onCommandRunning(false);
                this.setState({ _error: I18n.t('ra_Request timed out'), running: false });
            }, parseInt(this.props.schema.timeout, 10) || 10000);
        }

        this.props.socket.sendTo(
            `${this.props.adapterName}.${this.props.instance}`,
            this.props.schema.command || 'send',
            data
        )
            .then(response => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                if (response?.error) {
                    if (this.props.schema.error && this.props.schema.error[response.error]) {
                        let error = this.getText(this.props.schema.error[response.error]);
                        if (response.args) {
                            response.args.forEach(arg => error = error.replace('%s', arg));
                        }
                        this.setState({ _error: error });
                    } else {
                        this.setState({ _error: response.error ? I18n.t(response.error) : I18n.t('ra_Error') });
                    }
                } else {
                    if (response?.openUrl && this.props.schema.openUrl) {
                        window.open(response.openUrl, response.window || this.props.schema.window || '_blank');
                    } else
                    if (response?.result && this.props.schema.result && this.props.schema.result[response.result]) {
                        let text = this.getText(this.props.schema.result[response.result]);
                        if (response.args) {
                            response.args.forEach(arg => text = text.replace('%s', arg));
                        }
                        window.alert(text);
                    } if (response?.native && this.props.schema.useNative) {
                        const attrs = Object.keys(response.native);
                        attrs.forEach(attr =>
                            this.onChange(attr, response.native[attr]));
                        setTimeout(() => this.props.forceUpdate(attrs, this.props.data), 300);
                    } else {
                        if (response?.result) {
                            window.alert(typeof response.result === 'object' ? JSON.stringify(response.result) : response.result);
                        } else {
                            window.alert(I18n.t('ra_Ok'));
                        }
                    }

                    if (response?.saveConfig) {
                        this.props.onChange(null, null, null, true);
                    }
                }
            })
            .catch(e => {
                if (this.props.schema.error && this.props.schema.error[e.toString()]) {
                    this.setState({ _error: this.getText(this.props.schema.error[e.toString()]) });
                } else {
                    this.setState({ _error: I18n.t(e.toString()) || I18n.t('ra_Error') });
                }
            })
            .then(() => {
                this.props.onCommandRunning(false);
                this.setState({ running: false });
            });
    }

    renderConfirmDialog() {
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

        return <DialogConfirm
            title={this.getText(confirm.title) || I18n.t('ra_Please confirm')}
            text={this.getText(confirm.text)}
            ok={this.getText(confirm.ok) || I18n.t('ra_Ok')}
            cancel={this.getText(confirm.cancel) || I18n.t('ra_Cancel')}
            icon={icon}
            onClose={isOk =>
                this.setState({ confirmDialog: false }, () =>
                    isOk && this._onClick())
            }
        />;
    }

    getIcon() {
        let icon = null;
        if (this.props.schema.icon === 'auth') {
            icon = <IconAuth />;
        } else if (this.props.schema.icon === 'send') {
            icon = <IconSend />;
        } else if (this.props.schema.icon === 'web') {
            icon = <IconWeb />;
        } else if (this.props.schema.icon === 'warning') {
            icon = <IconWarning />;
        } else if (this.props.schema.icon === 'error') {
            icon = <IconError />;
        } else if (this.props.schema.icon === 'info') {
            icon = <IconInfo />;
        } else if (this.props.schema.icon === 'search') {
            icon = <IconSearch />;
        } else if (this.props.schema.icon) {
            icon = <Icon src={this.props.schema.icon} />;
        }

        return icon;
    }

    renderItem(error, disabled, defaultValue) {
        let icon = this.getIcon();

        return <div className={this.props.classes.fullWidth}>
            <Button
                variant={this.props.schema.variant || undefined}
                color={this.props.schema.color || 'grey'}
                className={this.props.classes.fullWidth}
                disabled={disabled || !this.props.alive}
                startIcon={icon}
                title={this.props.alive ? this.getText(this.props.schema.title) || '' : I18n.t('ra_Instance is not alive')}
                onClick={() => {
                    if (this.props.schema.confirm) {
                        this.setState({ confirmDialog: true });
                    } else {
                        this._onClick();
                    }
                }}
            >
                {this.props.schema.showProcess && this.state.running ? <CircularProgress size={20} style={{ marginRight: 8 }} /> : null}
                {this.getText(this.props.schema.label, this.props.schema.noTranslation)}
            </Button>
            {this.renderErrorDialog()}
            {this.renderMessageDialog()}
        </div>;
    }
}

ConfigSendto.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    commandRunning: PropTypes.bool,
    onCommandRunning: PropTypes.func,
};

export default withStyles(styles)(ConfigSendto);
