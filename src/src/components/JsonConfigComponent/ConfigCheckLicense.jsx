import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
} from '@mui/material';

import IconSend from '@mui/icons-material/Send';

import I18n from './wrapper/i18n';
import DialogError from './wrapper/Dialogs/Error';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 4
    },
    licLabel: {
        fontWeight: 'bold',
        minWidth: 100,
        textTransform: 'capitalize',
        display: 'inline-block',
    },
    licValue: {
        fontWeight: 'normal'
    },
    errorTitle: {
        color: theme.palette.mode === 'dark' ? '#e39191' : '#b62020',
    },
    okTitle: {
        color: theme.palette.mode === 'dark' ? '#6fd56f' : '#007c00',
    },
    errorText: {
        color: theme.palette.mode === 'dark' ? '#e39191' : '#b62020',
        marginBottom: 30,
    }
});

class ConfigCheckLicense extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        this.setState( {
            _error: '',
            running: false,
            showLicenseData: null,
            foundSuitableLicense: false,
            licenseOfflineCheck: false,
            result: null,
        });
    }

    renderErrorDialog() {
        if (this.state._error && !this.state.showLicenseData) {
            return <DialogError text={this.state._error} classes={undefined} onClose={() => this.setState({_error: ''})} />;
        } else {
            return null;
        }
    }

    renderMessageDialog() {
        if (this.state.showLicenseData) {
            const pre = Object.keys(this.state.showLicenseData).map(key =>
                <div key={key}><div className={this.props.classes.licLabel}>{key.replace(/_/g, ' ')}:</div> {this.state.showLicenseData[key]}</div>);

            return <Dialog
                open={!0}
                onClose={() => this.setState({ showLicenseData: null })}
            >
                <DialogTitle>
                    <span
                        className={this.state.result ? this.props.classes.okTitle : this.props.classes.errorTitle}
                    >
                        {I18n.t('ra_License %s', this.state.result ? 'OK' :  'INVALID')}
                    </span>
                </DialogTitle>
                <DialogContent>
                    {this.state._error ? <div className={this.props.classes.errorText}>{this.state._error}</div> : null}
                    {pre}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => this.setState({ showLicenseData: null })}
                        color="primary"
                        variant="contained"
                    >
                        {I18n.t('ra_Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        } else {
            return null;
        }
    }

    static parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
        try {
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    static isVersionValid(version, rule, invoice, adapterName) {
        if (!rule || !version) {
            return true;
        }
        let result = true;
        const [major] = version.split('.');
        if (rule.startsWith('>=')) {
            result = parseInt(major, 10) >= parseInt(rule.substring(2, 10));
        } else if (rule.startsWith('<=')) {
            result = parseInt(major, 10) <= parseInt(rule.substring(2, 10));
        } else if (rule.startsWith('>')) {
            result = parseInt(major, 10) > parseInt(rule.substring(1, 10));
        } else if (rule.startsWith('<')) {
            result = parseInt(major, 10) < parseInt(rule.substring(1, 10));
        } else if (rule.startsWith('=')) {
            result = parseInt(major, 10) === parseInt(rule.substring(1, 10));
        } else if (rule.startsWith('==')) {
            result = parseInt(major, 10) === parseInt(rule.substring(2, 10));
        } else if (rule.startsWith('===')) {
            result = parseInt(major, 10) === parseInt(rule.substring(3, 10));
        }

        if (!result && invoice && adapterName) {
            // all commercial licenses are valid for all versions
            if (invoice !== 'free') {
                return true;
            }
        }

        return true;
    }

    async findInLicenseManager(adapterName) {
        // read if license manager is supported
        const licenses = await this.props.socket.getObject('system.licenses');
        if (licenses?.native?.licenses?.length) {
            // enable license manager
            let useLicense;
            const now = Date.now();

            let uuid;
            if (this.props.schema.uuid) {
                const uuidObj = await this.props.socket.getObject('system.meta.uuid');
                uuid = uuidObj?.native?.uuid;
            }
            let version;
            if (this.props.schema.version) {
                const aObj = await this.props.socket.getObject(`system.adapter.${adapterName}`);
                version = aObj?.common?.version;
            }

            // find license for vis
            licenses.native.licenses.forEach(license => {
                if (!license.validTill || license.validTill === '0000-00-00 00:00:00' || new Date(license.validTill).getTime() > now) {
                    const parts = (license.product || '').split('.');
                    if (parts[1] === adapterName &&
                        (!useLicense || license.invoice !== 'free') &&
                        (!uuid || !license.uuid || license.uuid === uuid) &&
                        ConfigCheckLicense.isVersionValid(version, license.version, license.invoice, adapterName)
                    ) {
                        useLicense = license;
                    }
                }
            });

            return useLicense?.json;
        } else {
            return false;
        }
    }

    async checkLicense(license, adapterName) {
        let uuid;
        if (this.props.schema.uuid) {
            const uuidObj = await this.props.socket.getObject('system.meta.uuid');
            uuid = uuidObj?.native?.uuid;
        }
        let version;
        if (this.props.schema.version) {
            const aObj = await this.props.socket.getObject(`system.adapter.${adapterName}`);
            version = aObj?.common?.version;
        }

        try {
            const response = await window.fetch('https://iobroker.net/api/v1/public/cert/', {
                method: 'POST',
                body: JSON.stringify({json: license, uuid}),
                headers: {
                    'Content-Type': 'text/plain'
                },
            });
            let data = await response.text();
            try {
                data = JSON.parse(data);
            } catch (e) {
                // ignore
            }

            if (data?.error) {
                try {
                    const data = ConfigCheckLicense.parseJwt(license);
                    return this.setState({
                        _error: data.error,
                        showLicenseData: data,
                        result: false,
                        running: false,
                    });
                } catch (e) {
                    console.log('Cannot parse license')
                    return this.setState({ _error: data.error, result: false, running: false });
                }
            } else {
                let showLicenseData = null;
                try {
                    showLicenseData = ConfigCheckLicense.parseJwt(license);
                } catch (e) {

                }
                if (data) {
                    const validTill = data.validTill || data.valid_till;
                    if (validTill && validTill !== '0000-00-00 00:00:00' && new Date(validTill).getTime() < Date.now()) {
                        return this.setState({
                            _error: I18n.t('ra_License expired on %s', new Date(validTill).toLocaleString()),
                            licenseOfflineCheck: true,
                            showLicenseData,
                            result: false,
                            running: false,
                        });
                    }
                    const parts = (data.name || '').split('.');
                    if (parts[1] === adapterName) {
                        // check UUID
                        if (uuid && data.uuid && data.uuid !== uuid) {
                            return this.setState({
                                _error: I18n.t('ra_Serial number (UUID) "%s" in license is for other device.', data.uuid),
                                licenseOfflineCheck: true,
                                showLicenseData,
                                result: false,
                                running: false,
                            });
                        }

                        if (!ConfigCheckLicense.isVersionValid(version, data.version, data.invoice, adapterName)) {
                            return this.setState({
                                _error: I18n.t('ra_License is for version %s, but required version is %s', data.version, this.props.schema.version),
                                licenseOfflineCheck: true,
                                showLicenseData,
                                result: false,
                                running: false,
                            });
                        }

                        return this.setState({
                            licenseOfflineCheck: true,
                            showLicenseData,
                            result: true,
                            running: false,
                        });
                    } else {
                        return this.setState({
                            _error: I18n.t('ra_License for other product "%s"', data.name),
                            licenseOfflineCheck: true,
                            showLicenseData,
                            result: false,
                            running: false,
                        });
                    }
                } else {
                    throw new Error('ra_Invalid answer from server');
                }
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                return this.setState({ _error: I18n.t('ra_License does not exist'), result: false, running: false });
            }
            // check offline
            try {
                const data = ConfigCheckLicense.parseJwt(license);
                const parts = (data.name || '').split('.');

                if (data.valid_till && data.valid_till !== '0000-00-00 00:00:00' && new Date(data.valid_till).getTime() < Date.now()) {
                    return this.setState({
                        _error: I18n.t('ra_License expired on %s', new Date(data.valid_till).toLocaleString()),
                        showLicenseData: data,
                        licenseOfflineCheck: true,
                        running: false,
                        result: false,
                    });
                }
                if (parts[1] === adapterName) {
                    // check UUID
                    if (uuid && data.uuid && data.uuid !== uuid) {
                        return this.setState({
                            _error: I18n.t('ra_Serial number (UUID) "%s" in license is for other device.', data.uuid),
                            showLicenseData: data,
                            licenseOfflineCheck: true,
                            result: false,
                            running: false,
                        });
                    }

                    if (!ConfigCheckLicense.isVersionValid(version, data.version, data.invoice, adapterName)) {
                        return this.setState({
                            _error: I18n.t('ra_License is for version %s, but required version is %s', data.version, this.props.schema.version),
                            licenseOfflineCheck: true,
                            showLicenseData: data,
                            result: false,
                            running: false,
                        });
                    }

                    return this.setState({ result: true, licenseOfflineCheck: true });
                } else {
                    return this.setState({
                        _error: I18n.t('ra_License for other product "%s"', data.name),
                        licenseOfflineCheck: true,
                        showLicenseData: data,
                        result: false,
                        running: false,
                    });
                }
            } catch (e) {
                return this.setState({ _error: I18n.t('ra_Cannot decode license'), result: false, licenseOfflineCheck: true, running: false });
            }
        }
    }

    async _onClick() {
        this.setState({ running: true });
        let license;
        if (this.props.data.useLicenseManager) {
            license = await this.findInLicenseManager(this.props.adapterName);
        } else {
            license = this.props.data.license;
        }
        if (license) {
            await this.checkLicense(license, this.props.adapterName, this.props.schema.uuid);
        } else {
            this.setState({ _error: I18n.t('ra_Suitable license not found in license manager'), result: false, running: false });
        }
    }

    renderItem(error, disabled, defaultValue) {
        return <div className={this.props.classes.fullWidth}>
            <Button
                variant={this.props.schema.variant || 'outlined'}
                color={this.props.schema.color || 'primary'}
                className={this.props.classes.fullWidth}
                disabled={!this.props.data.license && !this.props.data.useLicenseManager}
                startIcon={<IconSend />}
                onClick={() => this._onClick()}
            >
                {this.state.running ? <CircularProgress size={20} style={{ marginRight: 8 }} /> : null}
                {this.getText(this.props.schema.label || 'ra_Check license', this.props.schema.noTranslation)}
            </Button>
            {this.renderMessageDialog()}
        </div>;
    }
}

ConfigCheckLicense.propTypes = {
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
};

export default withStyles(styles)(ConfigCheckLicense);