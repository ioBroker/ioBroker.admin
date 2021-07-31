import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';
import PublishIcon from "@material-ui/icons/Publish";

import SaveCloseButtons from '@iobroker/adapter-react/Components/SaveCloseButtons';
import Router from '@iobroker/adapter-react/Components/Router';
import theme from '@iobroker/adapter-react/Theme';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';
import I18n from '@iobroker/adapter-react/i18n';

import JsonConfigComponent from './JsonConfigComponent';
import ConfigCustomEasyAccess from './JsonConfigComponent/ConfigCustomEasyAccess';
import ConfigGeneric from './JsonConfigComponent/ConfigGeneric';
import Utils from './Utils';

const styles = {
    root: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    scroll: {
        height: 'calc(100% - 48px - 48px)',
        overflowY: 'auto'
    },
    exportImportButtons: {
        position: 'absolute',
        top: 5,
        right: 0,
        zIndex: 3,
    },
    button: {
        marginRight: 5
    }
};

/**
 * Decrypt the password/value with given key
 *  Usage:
 *  ```
 *     function load(settings, onChange) {
 *          if (settings.password) {
 *              settings.password = decrypt(systemSecret, settings.password);
 *              // same as
 *              settings.password = decrypt(settings.password);
 *          }
 *          // ...
 *     }
 *  ```
 * @param {string} key - Secret key
 * @param {string} value - value to decrypt
 * @returns {string}
 */
function decrypt(key, value) {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}

/**
 * Encrypt the password/value with given key
 *  Usage:
 *  ```
 *     function save(callback) {
 *          ...
 *          if (obj.password) {
 *              obj.password = encrypt(systemSecret, obj.password);
 *              // same as
 *              obj.password = decrypt(obj.password);
 *          }
 *          ...
 *    }
 *  ```
 * @param {string} key - Secret key
 * @param {string} value - value to encrypt
 * @returns {string}
 */
function encrypt(key, value) {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}

class JsonConfig extends Router {
    constructor(props) {
        super(props);

        this.state = {
            schema: null,
            data: null,
            updateData: 0,
            common: null,
            changed: false,
            confirmDialog: false,
            theme: theme(props.themeName), // buttons requires special theme
        };

        this.getInstanceObject()
            .then(obj => this.getConfigFile()
                .then(schema =>
                    // load language
                    JsonConfigComponent.loadI18n(this.props.socket, schema?.i18n, this.props.adapterName)
                        .then(() =>
                            this.setState({schema, data: obj.native, common: obj.common}))));
    }

    /**
     * @private
     * @param {object} evt
     */
    handleFileSelect = evt => {
        let f = evt.target.files[0];
        if (f) {
            let r = new FileReader();
            r.onload = async e => {
                let contents = e.target.result;
                try {
                    let json = JSON.parse(contents);
                    this.setState({data: json});
                } catch (err) {
                    window.alert(I18n.t('[JsonConfig] Failed to parse JSON file'));
                }
            };
            r.readAsText(f);
        } else {
            window.alert(I18n.t('[JsonConfig] Failed to open JSON File'));
        }
    }

    getExportImportButtons() {
        return <div className={this.props.classes.exportImportButtons}>
            <Tooltip title={this.props.t('Import settings from JSON file')}>
                <Fab size="small" classes={{root: this.props.classes.button}} onClick={() => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('id', 'files');
                    input.setAttribute('opacity', 0);
                    input.addEventListener('change', e => this.handleFileSelect(e), false);
                    input.click();
                }}>
                    <PublishIcon />
                </Fab>
            </Tooltip>
            <Tooltip title={this.props.t('Export setting to JSON file')}>
                <Fab size="small" classes={{root: this.props.classes.button}} onClick={() => {
                    Utils.generateFile(this.props.adapterName + '.' + this.props.instance + '.json', this.state.data);
                }}>
                    <PublishIcon style={{ transform: 'rotate(180deg)' }} />
                </Fab>
            </Tooltip>
        </div>;
    }

    getConfigFile() {
        return this.props.socket.readFile(this.props.adapterName + '.admin', 'jsonConfig.json')
            .then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    window.alert('[JsonConfig] Cannot parse json config!');
                }
            })
            .catch(e => window.alert('[JsonConfig] Cannot read file: ' + e));
    }

    getInstanceObject() {
        return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
            .then(obj => {
                // decode all native attributes listed in obj.encryptedNative
                if (Array.isArray(obj.encryptedNative)) {
                    return this.props.socket.getSystemConfig()
                        .then(systemConfig => {
                            this.secret = systemConfig.native.secret;

                            obj.encryptedNative.forEach(attr => {
                                if (obj.native[attr]) {
                                    obj.native[attr] = decrypt(this.secret, obj.native[attr]);
                                }
                            });
                            return obj;
                        });
                } else {
                    return obj;
                }
            })
            .catch(e => window.alert('[JsonConfig] Cannot read instance object: ' + e));
    }

    renderConfirmDialog() {
        if (!this.state.confirmDialog) {
            return null;
        }
        return <ConfirmDialog
            title={ I18n.t('Please confirm') }
            text={ I18n.t('Some data are not stored. Discard?') }
            ok={ I18n.t('Discard') }
            cancel={ I18n.t('Cancel') }
            onClose={isYes =>
                this.setState({ confirmDialog: false}, () => isYes && Router.doNavigate(null))}
        />;
    }

    findAttr(attr, schema) {
        schema = schema || this.state.schema;
        if (schema.items) {
            if (schema.items[attr]) {
                return schema.items[attr];
            } else {
                const keys = Object.keys(schema.items);
                for (let k = 0; k < keys.length; k++) {
                    const item = this.findAttr(attr, schema.items[keys[k]]);
                    if (item) {
                        return item;
                    }
                }
            }
        }
    }

    async onSave(doSave, close) {
        if (doSave) {
            const obj = await this.getInstanceObject();

            Object.keys(this.state.data).forEach(attr => {
                const item = this.findAttr(attr);
                if (!item || !item.doNotSave) {
                    ConfigGeneric.setValue(obj.native, attr, this.state.data[attr]);
                } else {
                    ConfigGeneric.setValue(obj.native, attr, null);
                }
            });

            try {
                // encode all native attributes listed in obj.encryptedNative
                if (Array.isArray(obj.encryptedNative)) {
                    obj.encryptedNative.forEach(attr => {
                        if (obj.native[attr]) {
                            obj.native[attr] = encrypt(this.secret, obj.native[attr]);
                        }
                    });
                }

                await this.props.socket.setObject(obj._id, obj);
            } catch (e) {
                window.alert(`[JsonConfig] Cannot set object: ${e}`);
            }

            this.setState({
                changed: false,
                data: obj.native,
                updateData: this.state.updateData + 1,
                originalData: JSON.parse(JSON.stringify(obj.native))
            }, () =>
                close && Router.doNavigate(null));
        } else {
            if (this.state.changed) {
                return this.setState({confirmDialog: true});
            } else {
                Router.doNavigate(null);
            }
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevState.changed !== this.state.changed){
            this.props.configStored(!this.state.changed);
        }
    }

    render() {
        const { classes } = this.props;
        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <div className={this.props.classes.root}>
            {this.renderConfirmDialog()}
            {this.getExportImportButtons()}
            <JsonConfigComponent
                className={ classes.scroll }
                socket={this.props.socket}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                isFloatComma={this.props.isFloatComma}
                dateFormat={this.props.dateFormat}

                schema={this.state.schema}
                common={this.state.common}
                data={this.state.data}
                updateData={this.state.updateData}
                onError={error => this.setState({ error })}
                onChange={(data, changed) => this.setState({ data, changed })}

                customs={{configCustomEasyAccess: ConfigCustomEasyAccess}}
            />
            <SaveCloseButtons
                isIFrame={false}
                dense={true}
                paddingLeft={0}
                theme={this.state.theme}
                noTextOnButtons={this.props.width === 'xs' || this.props.width === 'sm' || this.props.width === 'md'}
                changed={this.state.error || this.state.changed}
                error={this.state.error}
                onSave={async close => await this.onSave(true, close)}
                onClose={async () => await this.onSave(false)}
            />
        </div>;
    }
}

JsonConfig.propTypes = {
    menuPadding: PropTypes.number,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
    secret: PropTypes.string,

    socket: PropTypes.object,

    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
};

export default withStyles(styles)(JsonConfig);