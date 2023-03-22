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
import ConfirmDialog from './wrapper/Dialogs/Confirm';

const styles = theme => ({
    fullWidth: {
        width: '100%',
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 4,
    },
    licLabel: {
        fontWeight: 'bold',
        minWidth: 100,
        marginRight: 10,
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
    },
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
            const pre = [];
            const data = this.state.showLicenseData;
            Object.keys(data).forEach(key => {
                if (data[key] === null || data[key] === undefined) {
                    return;
                }
                if (typeof data[key] === 'object') {
                    const obj = data[key];
                    Object.keys(obj).forEach(key1 => {
                        if (obj[key1] !== null && obj[key1] !== undefined) {
                            if (typeof obj[key1] === 'object') {
                                pre.push(<div key={key1}>
                                    <div className={this.props.classes.licLabel}>{key1}:</div>
                                    {JSON.stringify(obj[key1], null, 2)}
                                </div>);
                            } else {
                                pre.push(<div key={key1}>
                                    <div className={this.props.classes.licLabel}>{key} - {key1}:</div>
                                    {data[key1].toString()}
                                </div>);
                            }
                        }
                    });
                } else {
                    pre.push(<div key={key}>
                        <div className={this.props.classes.licLabel}>{key.replace(/_/g, ' ')}:</div>
                        {data[key]}
                    </div>);
                }
            });
            pre.push(<div key="checked">
                <div className={this.props.classes.licLabel}>{I18n.t('ra_Checked')}:</div>
                {this.state.licenseOfflineCheck ? I18n.t('ra_locally') : I18n.t('ra_via internet')}
            </div>);

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

    static updateLicenses(socket) {
        return new Promise((resolve, reject) => {
            socket.getRawSocket().emit('updateLicenses', null, null, (err, licenses) => {
                if (err === 'permissionError') {
                    reject(I18n.t('May not trigger "updateLicenses"'));
                } else {
                    if (err && err.error) {
                        reject(I18n.t(err.error));
                    } else if (err) {
                        reject(I18n.t(err));
                    } else {
                        resolve(licenses);
                    }
                }
            });
        });
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

        const controller = new AbortController();
        let timeout = setTimeout(() => {
            timeout = null;
            controller.abort();
        }, 5000);

        try {
            const response = await window.fetch('https://iobroker.net/api/v1/public/cert/', {
                method: 'POST',
                body: JSON.stringify({json: license, uuid}),
                headers: {
                    'Content-Type': 'text/plain'
                },
                signal: controller.signal,
            });
            timeout && clearTimeout(timeout);
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
                        licenseOfflineCheck: false,
                        showLicenseData: data,
                        result: false,
                        running: false,
                    });
                } catch (e) {
                    console.log('Cannot parse license');
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
                            licenseOfflineCheck: false,
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
                                licenseOfflineCheck: false,
                                showLicenseData,
                                result: false,
                                running: false,
                            });
                        }

                        if (!ConfigCheckLicense.isVersionValid(version, data.version, data.invoice, adapterName)) {
                            return this.setState({
                                _error: I18n.t('ra_License is for version %s, but required version is %s', data.version, this.props.schema.version),
                                licenseOfflineCheck: false,
                                showLicenseData,
                                result: false,
                                running: false,
                            });
                        }

                        return this.setState({
                            licenseOfflineCheck: false,
                            showLicenseData,
                            result: true,
                            running: false,
                        });
                    } else {
                        return this.setState({
                            _error: I18n.t('ra_License for other product "%s"', data.name),
                            licenseOfflineCheck: false,
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

                    return this.setState({
                        running: false,
                        result: true,
                        licenseOfflineCheck: true,
                        showLicenseData: data,
                    });
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

    renderAskForUpdate() {
        if (!this.state.askForUpdate) {
            return null;
        }
        return <ConfirmDialog
            text={I18n.t('ra_License not found in license manager. Do you want to read licenses from iobroker.net?')}
            ok={I18n.t('ra_Yes')}
            onClose={async isYes => {
                this.setState({ askForUpdate: false });
                if (isYes) {
                    await ConfigCheckLicense.updateLicenses();
                    await this._onClick(true);
                }
            }}
        />;
    }

    async _onClick(secondRun) {
        const adapterName = this.props.adapterName === 'vis-2-beta' ? 'vis' : this.props.adapterName
        this.setState({ running: true });
        let license;
        if (this.props.data.useLicenseManager) {
            license = await this.findInLicenseManager(adapterName);
            if (!license && !secondRun) {
                // no suitable license found in license manager
                // should we read all licenses again?
                this.setState({ askForUpdate: true });
                return;
            }
        } else {
            license = this.props.data.license;
        }
        if (license) {
            await this.checkLicense(license, adapterName, this.props.schema.uuid);
        } else {
            if (this.props.data.useLicenseManager) {
                this.setState({
                    _error: I18n.t('ra_Suitable license not found in license manager'),
                    result: false,
                    running: false,
                });
            } else {
                // this case could not happen
                this.setState({
                    _error: I18n.t('ra_Please enter the license'),
                    result: false,
                    running: false,
                });
            }
        }
    }

    renderItem(error, disabled, defaultValue) {
        return <div className={this.props.classes.fullWidth}>
            <Button
                variant={this.props.schema.variant || 'outlined'}
                color={this.props.schema.color || 'primary'}
                className={this.props.classes.fullWidth}
                disabled={(!this.props.data.license && !this.props.data.useLicenseManager) || this.state.running}
                startIcon={<IconSend />}
                onClick={() => this._onClick()}
            >
                {this.state.running ? <CircularProgress size={20} style={{ marginRight: 8 }} /> : null}
                {this.getText(this.props.schema.label || 'ra_Check license', this.props.schema.noTranslation)}
            </Button>
            {this.renderMessageDialog()}
            {this.renderErrorDialog()}
            {this.renderAskForUpdate()}
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