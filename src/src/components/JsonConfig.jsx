import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import JSON5 from 'json5';
import MD5 from 'crypto-js/md5';

import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Fab from '@mui/material/Fab';
import PublishIcon from '@mui/icons-material/Publish';

import {
    I18n,
    Router,
    SaveCloseButtons,
    Theme as theme,
    Confirm as ConfirmDialog,
} from '@iobroker/adapter-react-v5';

import ConfigGeneric from '@iobroker/adapter-react-v5/Components/JsonConfigComponent/ConfigGeneric';
import JsonConfigComponent from './JsonConfigComponent';
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
        overflowY: 'auto',
    },
    exportImportButtons: {
        position: 'absolute',
        top: 5,
        right: 0,
        zIndex: 3,
    },
    button: {
        marginRight: 5,
    },
};

/**
 * Decrypt the password/value with given key
 * @param key - Secret key
 * @param value - value to decrypt
 */
function decryptLegacy(key, value) {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        // eslint-disable-next-line no-bitwise
        result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}

/**
 * Encrypt the password/value with given key
 * @param key - Secret key
 * @param value - value to encrypt
 */
function encryptLegacy(key, value) {
    let result = '';
    for (let i = 0; i < value.length; i++) {
        // eslint-disable-next-line no-bitwise
        result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
    }
    return result;
}

/**
 * Decrypt the password/value with given key
 *  Usage:
 *  ```js
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
    if (typeof value !== 'string') {
        return value;
    }

    // if not encrypted as aes-192 or key not a valid 48-digit hex -> fallback
    if (!value.startsWith('$/aes-192-cbc:') || !/^[0-9a-f]{48}$/.test(key)) {
        return decryptLegacy(key, value);
    }

    // algorithm:iv:encryptedValue
    const textParts = value.split(':', 3);

    const _key = window.CryptoJS.enc.Hex.parse(key);
    const iv = window.CryptoJS.enc.Hex.parse(textParts[1]);

    const cipherParams = window.CryptoJS.lib.CipherParams.create({ ciphertext: window.CryptoJS.enc.Hex.parse(textParts[2]) });

    const decryptedBinary = window.CryptoJS.AES.decrypt(cipherParams, _key, { iv });

    return window.CryptoJS.enc.Utf8.stringify(decryptedBinary);
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
 * @param {string} _iv - optional initial vector for tests
 * @returns {string}
 */
function encrypt(key, value, _iv) {
    if (typeof value !== 'string') {
        return value;
    }

    if (!/^[0-9a-f]{48}$/.test(key)) {
        // key length is not matching for AES-192-CBC or key is no valid hex - fallback to old encryption
        return encryptLegacy(key, value);
    }

    let iv;
    if (_iv) {
        iv = window.CryptoJS.enc.Hex.parse(_iv);
    } else {
        iv = window.CryptoJS.lib.WordArray.random(128 / 8);
    }

    const _key = window.CryptoJS.enc.Hex.parse(key);
    const encrypted = window.CryptoJS.AES.encrypt(value, _key, { iv }).ciphertext;

    return `$/aes-192-cbc:${window.CryptoJS.enc.Hex.stringify(iv)}:${encrypted}`;
}

function loadScript(src, id) {
    if (!id || !document.getElementById(id)) {
        return new Promise(resolve => {
            const script = document.createElement('script');
            script.setAttribute('id', id);
            script.onload = resolve;
            script.src = src;
            document.getElementsByTagName('head')[0].appendChild(script);
        });
    }
    return document.getElementById(id).onload;
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
            theme: theme(props.themeName), // buttons require special theme
            saveConfigDialog: false,
            hash: '_',
        };

        this.getInstanceObject()
            .then(obj => this.getConfigFile()
                .then(schema =>
                    // load language
                    JsonConfigComponent.loadI18n(this.props.socket, schema?.i18n, this.props.adapterName)
                        .then(langFileName => {
                            if (langFileName) {
                                // subscribe on changes
                                if (!this.fileLangSubscribed) {
                                    this.fileLangSubscribed = langFileName;
                                    this.props.socket.subscribeFiles(`${this.props.adapterName}.admin`, this.fileLangSubscribed, this.onFileChange);
                                }
                            }

                            if (obj) {
                                this.setState({
                                    schema,
                                    data: obj.native,
                                    common: obj.common,
                                    hash: MD5(JSON.stringify(schema)),
                                });
                            } else {
                                window.alert(`Instance system.adapter.${this.props.adapterName}.${this.props.instance} not found!`);
                            }
                        })));
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.fileSubscribed) {
            this.props.socket.unsubscribeFiles(`${this.props.adapterName}.admin`, this.fileSubscribed, this.onFileChange);
            this.fileSubscribed = false;
        }
        if (this.fileLangSubscribed) {
            this.props.socket.unsubscribeFiles(`${this.props.adapterName}.admin`, this.fileLangSubscribed, this.onFileChange);
            this.fileLangSubscribed = false;
        }
    }

    /**
     * @private
     * @param {object} evt
     */
    handleFileSelect = evt => {
        const f = evt.target.files[0];
        if (f) {
            const r = new FileReader();
            r.onload = async e => {
                const contents = e.target.result;
                try {
                    const data = JSON.parse(contents);
                    this.setState({ data, changed: JSON.stringify(data) !== JSON.stringify(this.state.originalData) });
                } catch (err) {
                    window.alert(I18n.t('[JsonConfig] Failed to parse JSON file'));
                }
            };
            r.readAsText(f);
        } else {
            window.alert(I18n.t('[JsonConfig] Failed to open JSON File'));
        }
    };

    getExportImportButtons() {
        return <div className={this.props.classes.exportImportButtons}>
            <Tooltip title={this.props.t('Import settings from JSON file')}>
                <Fab
                    size="small"
                    classes={{ root: this.props.classes.button }}
                    onClick={() => {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('id', 'files');
                        input.setAttribute('opacity', 0);
                        input.addEventListener('change', e => this.handleFileSelect(e), false);
                        input.click();
                    }}
                >
                    <PublishIcon />
                </Fab>
            </Tooltip>
            <Tooltip title={this.props.t('Export setting to JSON file')}>
                <Fab
                    size="small"
                    classes={{ root: this.props.classes.button }}
                    onClick={() => {
                        Utils.generateFile(`${this.props.adapterName}.${this.props.instance}.json`, this.state.data);
                    }}
                >
                    <PublishIcon style={{ transform: 'rotate(180deg)' }} />
                </Fab>
            </Tooltip>
        </div>;
    }

    onFileChange = (id, fileName, size) => {
        if (id === `${this.props.adapterName}.admin` && size) {
            if (fileName === this.fileLangSubscribed)  {
                JsonConfigComponent.loadI18n(this.props.socket, this.state.schema?.i18n, this.props.adapterName)
                    .then(() => this.setState({ hash: `${this.state.hash}1` }))
                    .catch(() => {
                    }); // ignore errors
            } else if (fileName === this.fileSubscribed) {
                this.getConfigFile(this.fileSubscribed)
                    .then(schema => this.setState({ schema, hash: MD5(JSON.stringify(schema)) }))
                    .catch(() => { }); // ignore errors
            }
        }
    };

    getConfigFile(fileName) {
        fileName = fileName || 'jsonConfig.json5';

        return this.props.socket.fileExists(`${this.props.adapterName}.admin`, fileName)
            .then(exist => {
                if (!exist) {
                    fileName = 'jsonConfig.json';
                }
                return this.props.socket.readFile(`${this.props.adapterName}.admin`, fileName);
            })
            .then(data => {
                if (data.file !== undefined) {
                    data = data.file;
                }
                if (data?.type === 'Buffer') {
                    let binary = '';
                    const bytes = new Uint8Array(data.data);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    data = binary;
                }

                // subscribe on changes
                if (!this.fileSubscribed) {
                    this.fileSubscribed = fileName;
                    this.props.socket.subscribeFiles(`${this.props.adapterName}.admin`, this.fileSubscribed, this.onFileChange);
                }

                try {
                    return JSON5.parse(data);
                } catch (e) {
                    window.alert('[JsonConfig] Cannot parse json5 config!');
                    return null;
                }
            })
            .catch(e => !this.state.schema && window.alert(`[JsonConfig] Cannot read file: ${e}`));
    }

    getInstanceObject() {
        return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
            .then(obj => {
                // decode all native attributes listed in obj.encryptedNative
                if (Array.isArray(obj.encryptedNative)) {
                    return this.props.socket.getSystemConfig()
                        .then(async systemConfig => {
                            await loadScript('../../lib/js/crypto-js/crypto-js.js', 'crypto-js');
                            this.secret = systemConfig.native.secret;

                            obj.encryptedNative.forEach(attr => {
                                if (obj.native[attr]) {
                                    obj.native[attr] = decrypt(this.secret, obj.native[attr]);
                                }
                            });
                            return obj;
                        });
                }
                return obj;
            })
            .catch(e => window.alert(`[JsonConfig] Cannot read instance object: ${e}`));
    }

    renderConfirmDialog() {
        if (!this.state.confirmDialog) {
            return null;
        }
        return <ConfirmDialog
            title={I18n.t('ra_Please confirm')}
            text={I18n.t('ra_Some data are not stored. Discard?')}
            ok={I18n.t('ra_Discard')}
            cancel={I18n.t('ra_Cancel')}
            onClose={isYes =>
                this.setState({ confirmDialog: false }, () => isYes && Router.doNavigate(null))}
        />;
    }

    renderSaveConfigDialog() {
        if (!this.state.saveConfigDialog) {
            return null;
        }
        return <ConfirmDialog
            title={I18n.t('ra_Please confirm')}
            text={typeof this.state.saveConfigDialog === 'string' ? this.state.saveConfigDialog : I18n.t('Save configuration?')}
            ok={I18n.t('ra_Save')}
            cancel={I18n.t('ra_Cancel')}
            onClose={isYes =>
                this.setState({ saveConfigDialog: false }, () => isYes && this.onSave(true))}
        />;
    }

    findAttr(attr, schema) {
        schema = schema || this.state.schema;
        if (schema.items) {
            if (schema.items[attr]) {
                return schema.items[attr];
            }
            const keys = Object.keys(schema.items);
            for (let k = 0; k < keys.length; k++) {
                const item = this.findAttr(attr, schema.items[keys[k]]);
                if (item) {
                    return item;
                }
            }
        }

        return null;
    }

    // this function is called recursively and trims all text fields, that must be trimmed
    postProcessing(data, attr, schema) {
        schema = schema || this.state.schema;
        if (!data) {
            // should not happen
            console.error(`Data is empty in postProcessing: ${attr}, ${JSON.stringify(schema)}`);
            return;
        }
        if (schema.items) {
            const keys = Object.keys(schema.items);
            if (schema.type === 'table') {
                const table = data[attr];
                for (let i = 0; i < table.length; i++) {
                    for (let a = 0; a < schema.items.length; a++) {
                        const tItem = schema.items[a];
                        this.postProcessing(table[i], tItem.attr, tItem);
                    }
                }
            } else {
                for (let k = 0; k < keys.length; k++) {
                    const _attr = keys[k];
                    const item = schema.items[_attr];
                    if (item.type === 'panel' || item.type === 'tabs' || item.type === 'accordion') {
                        this.postProcessing(data, null, item);
                    } else {
                        this.postProcessing(data, _attr, item);
                    }
                }
            }
        } else if (attr && typeof data[attr] === 'string') {
            // postprocessing
            if (schema.type === 'text') {
                console.log(data[attr]);
                if (schema.trim !== false) {
                    data[attr] = data[attr].trim();
                }
            } else if (schema.type === 'ip') {
                // should not happen
                data[attr] = data[attr].trim();
            } else if (schema.type === 'number') {
                data[attr] = parseFloat(data[attr].toString().replace(',', '.'));
                if (schema.min !== undefined && data[attr] < schema.min) {
                    data[attr] = schema.min;
                } else if (schema.max !== undefined && data[attr] > schema.max) {
                    data[attr] = schema.max;
                }
            } else if (schema.type === 'port') {
                data[attr] = parseInt(data[attr].toString(), 10);
                if (schema.min !== undefined && data[attr] < schema.min) {
                    data[attr] = schema.min;
                } else if (schema.max !== undefined && data[attr] > schema.max) {
                    data[attr] = schema.max;
                }
                if (data[attr] !== 0 && data[attr] < 20) {
                    data[attr] = 20;
                } else if (data[attr] > 0xFFFF) {
                    data[attr] = 0xFFFF;
                }
            } else if (schema.type === 'checkbox') {
                // should not happen
                data[attr] = data[attr] === true || data[attr] === 'true' || data[attr] === 'on' || data[attr] === 1 || data[attr] === '1';
            }
        }
    }

    async onSave(doSave, close) {
        if (doSave) {
            const obj = await this.getInstanceObject();

            if (!obj) {
                console.error('Something went wrong: may be no connection?');
                window.alert('Something went wrong: may be no connection?');
                return;
            }

            this.postProcessing(this.state.data, this.state.schema);

            Object.keys(this.state.data).forEach(attr => {
                const item = this.findAttr(attr);
                if (!item || !item.doNotSave) {
                    ConfigGeneric.setValue(obj.native, attr, this.state.data[attr]);
                } else {
                    ConfigGeneric.setValue(obj.native, attr, null);
                }
            });

            try {
                const encryptedObj = JSON.parse(JSON.stringify(obj));
                // encode all native attributes listed in obj.encryptedNative
                if (Array.isArray(encryptedObj.encryptedNative)) {
                    await loadScript('../../lib/js/crypto-js/crypto-js.js', 'crypto-js');

                    encryptedObj.encryptedNative.forEach(attr => {
                        if (encryptedObj.native[attr]) {
                            encryptedObj.native[attr] = encrypt(this.secret, encryptedObj.native[attr]);
                        }
                    });
                }

                await this.props.socket.setObject(encryptedObj._id, encryptedObj);
            } catch (e) {
                window.alert(`[JsonConfig] Cannot set object: ${e}`);
            }

            this.setState({
                changed: false,
                data: obj.native,
                updateData: this.state.updateData + 1,
                originalData: JSON.parse(JSON.stringify(obj.native)),
            }, () =>
                close && Router.doNavigate(null));
        } else if (this.state.changed) {
            this.setState({ confirmDialog: true });
        } else {
            Router.doNavigate(null);
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevState.changed !== this.state.changed) {
            this.props.configStored(!this.state.changed);
        }
    };

    render() {
        const { classes } = this.props;
        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <div className={this.props.classes.root}>
            {this.renderConfirmDialog()}
            {this.getExportImportButtons()}
            {this.renderSaveConfigDialog()}
            <JsonConfigComponent
                key={this.state.hash}
                className={classes.scroll}
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
                onChange={(data, changed, saveConfigDialog) => {
                    if (saveConfigDialog && this.state.error) {
                        window.alert(I18n.t('Cannot save configuration because of error in configuration'));
                        saveConfigDialog = false;
                    }
                    if (saveConfigDialog && !this.state.changed && !changed) {
                        saveConfigDialog = false;
                    }
                    if (data) {
                        this.setState({ data, changed, saveConfigDialog });
                    } else if (saveConfigDialog !== undefined) {
                        this.setState({ saveConfigDialog });
                    }
                }}
            />
            <SaveCloseButtons
                isIFrame={false}
                dense
                paddingLeft={0}
                newReact
                theme={this.state.theme}
                noTextOnButtons={this.props.width === 'xs' || this.props.width === 'sm' || this.props.width === 'md'}
                changed={this.state.error || this.state.changed}
                error={this.state.error}
                onSave={close => this.onSave(true, close)}
                onClose={() => this.onSave(false)}
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
