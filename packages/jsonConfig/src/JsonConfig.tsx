import React from 'react';
import { Styles, withStyles } from '@mui/styles';
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
    Confirm as ConfirmDialog, AdminConnection,
} from '@iobroker/adapter-react-v5';

import ConfigGeneric from './JsonConfigComponent/ConfigGeneric';
import { Theme } from '@iobroker/adapter-react-v5/types';
// @ts-expect-error optimize socket-client types
import type { SystemConfig } from '@iobroker/socket-client';
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
} satisfies Styles<any, any>;

/**
 * Decrypt the password/value with given key
 * @param key - Secret key
 * @param value - value to decrypt
 */
function decryptLegacy(key: string, value: string): string {
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
function encryptLegacy(key: string, value: string): string {
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
 * @param key - Secret key
 * @param value - value to decrypt
 */
function decrypt(key: string, value: string): string {
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
 * @param key - Secret key
 * @param value - value to encrypt
 * @param _iv - optional initial vector for tests
 */
function encrypt(key: string, value: string, _iv?: string): string {
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

function loadScript(src: string, id: string) {
    if (!id || !document.getElementById(id)) {
        return new Promise(resolve => {
            const script = document.createElement('script');
            script.setAttribute('id', id);
            script.onload = resolve;
            script.src = src;
            document.getElementsByTagName('head')[0].appendChild(script);
        });
    }
    return document.getElementById(id)?.onload;
}

interface BufferObject {
    type: 'Buffer';
    data: Buffer;
}

interface Schema {
    type: string;
    items: Schema[];
    max?: number;
    min?: number;
    trim?: boolean;
    attr?: string;
    doNotSave?: boolean;
}

interface JsonConfigProps {
    menuPadding: number;
    adapterName: string;
    instance: number;
    isFloatComma: boolean;
    dateFormat: string;
    secret: string;
    socket: AdminConnection;
    theme: Record<string, any>;
    themeName: string;
    themeType: string;
    /** CSS classes */
    classes: Record<string, any>;
    /** Translate method */
    t: typeof I18n.t;
    configStored: (notChanged: boolean) => void;
    width: 'xs' | 'sm' | 'md';
}

interface JsonConfigState {
    schema?: Schema;
    data?: Record<string, unknown>;
    originalData?: Record<string, unknown>;
    updateData: number;
    common?: ioBroker.InstanceCommon;
    changed: boolean;
    confirmDialog: boolean;
    theme: Theme;
    saveConfigDialog: boolean;
    hash: string;
    error?: string;
}

class JsonConfig extends Router<JsonConfigProps, JsonConfigState> {
    private fileSubscribed = '';

    private fileLangSubscribed = '';

    private secret = '';

    constructor(props: JsonConfigProps) {
        super(props);

        this.state = {
            updateData: 0,
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
                // @ts-expect-error it has the static method
                    JsonConfigComponent.loadI18n(this.props.socket, schema?.i18n, this.props.adapterName)
                        .then((langFileName: string) => {
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
                                    // @ts-expect-error really no string?
                                    hash: MD5(JSON.stringify(schema)),
                                });
                            } else {
                                window.alert(`Instance system.adapter.${this.props.adapterName}.${this.props.instance} not found!`);
                            }
                        })));
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        if (this.fileSubscribed) {
            this.props.socket.unsubscribeFiles(`${this.props.adapterName}.admin`, this.fileSubscribed, this.onFileChange);
            this.fileSubscribed = '';
        }
        if (this.fileLangSubscribed) {
            this.props.socket.unsubscribeFiles(`${this.props.adapterName}.admin`, this.fileLangSubscribed, this.onFileChange);
            this.fileLangSubscribed = '';
        }
    }

    /**
     * @private
     * @param evt
     */
    handleFileSelect = (evt: Record<string, any>): void => {
        const f = evt.target.files[0];
        if (f) {
            const r = new FileReader();
            r.onload = async e => {
                if (!e.target) {
                    return;
                }

                const contents = e.target.result as string;
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

    getExportImportButtons(): React.JSX.Element {
        return <div className={this.props.classes.exportImportButtons}>
            <Tooltip title={this.props.t('Import settings from JSON file')}>
                <Fab
                    size="small"
                    classes={{ root: this.props.classes.button }}
                    onClick={() => {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('id', 'files');
                        // @ts-expect-error check
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
                        if (!this.state.data) {
                            return;
                        }

                        Utils.generateFile(`${this.props.adapterName}.${this.props.instance}.json`, this.state.data);
                    }}
                >
                    <PublishIcon style={{ transform: 'rotate(180deg)' }} />
                </Fab>
            </Tooltip>
        </div>;
    }

    onFileChange = async (id: string, fileName: string, size: number): Promise<void> => {
        if (id === `${this.props.adapterName}.admin` && size) {
            if (fileName === this.fileLangSubscribed)  {
                try {
                    // @ts-expect-error needs types
                    await JsonConfigComponent.loadI18n(this.props.socket, this.state.schema?.i18n, this.props.adapterName);
                    this.setState({ hash: `${this.state.hash}1` });
                } catch {
                    // ignore errors
                }
            } else if (fileName === this.fileSubscribed) {
                try {
                    const schema = await this.getConfigFile(this.fileSubscribed);
                    // @ts-expect-error really no string?
                    this.setState({ schema, hash: MD5(JSON.stringify(schema)) });
                } catch {
                    // ignore errors
                }
            }
        }
    };

    getInstanceObject(): Promise<ioBroker.InstanceObject> {
        return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
            .then((obj: ioBroker.InstanceObject) => {
                // decode all native attributes listed in obj.encryptedNative
                if (Array.isArray(obj.encryptedNative)) {
                    return this.props.socket.getSystemConfig()
                        .then(async (systemConfig: SystemConfig) => {
                            await loadScript('../../lib/js/crypto-js/crypto-js.js', 'crypto-js');
                            this.secret = systemConfig.native.secret;

                            obj.encryptedNative?.forEach(attr => {
                                if (obj.native[attr]) {
                                    obj.native[attr] = decrypt(this.secret, obj.native[attr]);
                                }
                            });
                            return obj;
                        });
                }
                return obj;
            })
            .catch((e: any) => window.alert(`[JsonConfig] Cannot read instance object: ${e}`));
    }

    renderConfirmDialog(): React.JSX.Element | null {
        if (!this.state.confirmDialog) {
            return null;
        }
        return <ConfirmDialog
            title={I18n.t('ra_Please confirm')}
            text={I18n.t('ra_Some data are not stored. Discard?')}
            ok={I18n.t('ra_Discard')}
            cancel={I18n.t('ra_Cancel')}
            onClose={isYes =>
                this.setState({ confirmDialog: false }, () => isYes && Router.doNavigate())}
        />;
    }

    getConfigFile(fileName?: string): Promise<Schema> {
        fileName = fileName || 'jsonConfig.json5';

        return this.props.socket.fileExists(`${this.props.adapterName}.admin`, fileName)
            .then((exist: boolean) => {
                if (!exist) {
                    fileName = 'jsonConfig.json';
                }
                return this.props.socket.readFile(`${this.props.adapterName}.admin`, fileName);
            })
            .then((data: { file: string | BufferObject; mimeType: string; type: string }) => {
                let content = '';
                let file: string | BufferObject = '';

                if (data.file !== undefined) {
                    file = data.file;
                }

                if (typeof file === 'string') {
                    content = file;
                } else if (file.type === 'Buffer') {
                    let binary = '';
                    const bytes = new Uint8Array(file.data);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    content = binary;
                }

                // subscribe on changes
                if (!this.fileSubscribed) {
                    this.fileSubscribed = fileName ?? '';
                    this.props.socket.subscribeFiles(`${this.props.adapterName}.admin`, this.fileSubscribed, this.onFileChange);
                }

                try {
                    return JSON5.parse(content);
                } catch (e) {
                    window.alert('[JsonConfig] Cannot parse json5 config!');
                    console.log(e);
                    return null;
                }
            })
            .catch((e: any) => !this.state.schema && window.alert(`[JsonConfig] Cannot read file: ${e}`));
    }

    renderSaveConfigDialog(): React.JSX.Element | null {
        if (!this.state.saveConfigDialog) {
            return null;
        }
        return <ConfirmDialog
            title={I18n.t('ra_Please confirm')}
            text={I18n.t('Save configuration?')}
            ok={I18n.t('ra_Save')}
            cancel={I18n.t('ra_Cancel')}
            onClose={isYes =>
                this.setState({ saveConfigDialog: false }, () => isYes && this.onSave(true))}
        />;
    }

    findAttr(attr: string, schema?: Schema): Schema | null {
        schema = schema || this.state.schema;
        if (schema?.items) {
            if (attr in schema.items) {
                return schema.items[attr as any];
            }
            for (const _item of Object.values(schema.items)) {
                const item = this.findAttr(attr, _item);
                if (item) {
                    return item;
                }
            }
        }

        return null;
    }

    // this function is called recursively and trims all text fields, that must be trimmed
    postProcessing(data: Record<string, unknown>, attr: string, schema: Schema): void {
        schema = schema || this.state.schema;
        if (!data) {
            // should not happen
            console.error(`Data is empty in postProcessing: ${attr}, ${JSON.stringify(schema)}`);
            return;
        }

        const dataAttr = data[attr];

        if (schema.items) {
            if (schema.type === 'table') {
                const table = dataAttr;

                if (!Array.isArray(table)) {
                    return;
                }

                for (const entry of table) {
                    for (const tItem of schema.items) {
                        this.postProcessing(entry, tItem.attr as string, tItem);
                    }
                }
            } else {
                for (const [_attr, item] of Object.entries(schema.items)) {
                    if (item.type === 'panel' || item.type === 'tabs' || item.type === 'accordion') {
                        return;
                    }
                    this.postProcessing(data, _attr, item);
                }
            }
        } else if (attr && typeof dataAttr === 'string') {
            // postprocessing
            if (schema.type === 'text') {
                if (schema.trim !== false) {
                    data[attr] = dataAttr.trim();
                }
            } else if (schema.type === 'ip') {
                // should not happen
                data[attr] = dataAttr.trim();
            } else if (schema.type === 'number') {
                const dataVal = parseFloat(dataAttr.toString().replace(',', '.'));

                if (schema.min !== undefined && dataVal < schema.min) {
                    data[attr] = schema.min;
                } else if (schema.max !== undefined && dataVal > schema.max) {
                    data[attr] = schema.max;
                } else {
                    data[attr] = dataVal;
                }
            } else if (schema.type === 'port') {
                const dataVal = parseInt(dataAttr.toString(), 10);
                if (schema.min !== undefined && dataVal < schema.min) {
                    data[attr] = schema.min;
                } else if (schema.max !== undefined && dataVal > schema.max) {
                    data[attr] = schema.max;
                }
                if (data[attr] !== 0 && dataVal < 20) {
                    data[attr] = 20;
                } else if (dataVal > 0xFFFF) {
                    data[attr] = 0xFFFF;
                } else {
                    data[attr] = dataVal;
                }
            } else if (schema.type === 'checkbox') {
                // should not happen
                data[attr] = data[attr] === true || data[attr] === 'true' || data[attr] === 'on' || data[attr] === 1 || data[attr] === '1';
            }
        }
    }

    async onSave(doSave: boolean, close?: boolean): Promise<void> {
        if (doSave) {
            const obj = await this.getInstanceObject();

            if (!obj) {
                console.error('Something went wrong: may be no connection?');
                window.alert('Something went wrong: may be no connection?');
                return;
            }

            if (!this.state.data || !this.state.schema) {
                return;
            }

            for (const attr of Object.keys(this.state.data)) {
                const item = this.findAttr(attr);
                if (!item || !item.doNotSave) {
                    ConfigGeneric.setValue(obj.native, attr, this.state.data[attr]);
                } else {
                    ConfigGeneric.setValue(obj.native, attr, null);
                }
            }

            try {
                const encryptedObj = JSON.parse(JSON.stringify(obj));
                // encode all native attributes listed in obj.encryptedNative
                if (Array.isArray(encryptedObj.encryptedNative)) {
                    await loadScript('../../lib/js/crypto-js/crypto-js.js', 'crypto-js');

                    for (const attr of encryptedObj.encryptedNative) {
                        if (encryptedObj.native[attr]) {
                            encryptedObj.native[attr] = encrypt(this.secret, encryptedObj.native[attr]);
                        }
                    }
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

    componentDidUpdate(_prevProps: JsonConfigProps, prevState: JsonConfigState): void {
        if (prevState.changed !== this.state.changed) {
            this.props.configStored(!this.state.changed);
        }
    }

    /**
     * Validate the JSON config once on mount
     */
    async componentDidMount() {
        const link = `${window.location.protocol}//${window.location.host}${window.location.pathname}validate_config/${this.props.adapterName}`;
        console.log(`fetch ${link}`);
        await fetch(link);
    }

    render(): React.JSX.Element {
        const { classes } = this.props;
        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <div className={this.props.classes.root}>
            {this.renderConfirmDialog()}
            {this.getExportImportButtons()}
            {this.renderSaveConfigDialog()}
            <JsonConfigComponent
                key={this.state.hash as string}
                // @ts-expect-error types not correct yet
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
                changed={!!(this.state.error || this.state.changed)}
                error={!!this.state.error}
                onSave={(close: any) => this.onSave(true, close)}
                onClose={() => this.onSave(false)}
            />
        </div>;
    }
}

export default withStyles(styles)(JsonConfig);
