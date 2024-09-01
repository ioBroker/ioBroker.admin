import React from 'react';
import JSON5 from 'json5';
import MD5 from 'crypto-js/md5';

import {
    Fab,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import { Publish as PublishIcon } from '@mui/icons-material';

import {
    I18n,
    Router,
    SaveCloseButtons,
    Theme,
    Confirm as ConfirmDialog,
    type AdminConnection,
    type IobTheme,
    type ThemeName,
    type ThemeType,
} from '@iobroker/adapter-react-v5';

import type { ConfigItemAny, ConfigItemPanel, ConfigItemTabs } from '#JC/types';
import Utils from '#JC/Utils';
import ConfigGeneric, { type DeviceManagerPropsProps } from './JsonConfigComponent/ConfigGeneric';
import JsonConfigComponent from './JsonConfigComponent';

const styles: Record<string, React.CSSProperties> = {
    root: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    scroll: {
        height: 'calc(100% - 48px)',
        overflowY: 'auto',
    },
    exportImportButtons: {
        position: 'absolute',
        top: 5,
        right: 0,
        zIndex: 3,
    },
    button: {
        marginRight: '5px',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

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

interface JsonConfigProps {
    adapterName: string;
    instance: number;
    isFloatComma: boolean;
    dateFormat: string;
    secret?: string;
    socket: AdminConnection;
    theme: IobTheme;
    themeName: ThemeName;
    themeType: ThemeType;
    /** Translate method */
    t: typeof I18n.t;
    configStored: (notChanged: boolean) => void;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    DeviceManager?: React.FC<DeviceManagerPropsProps>;
}

interface JsonConfigState {
    schema?: ConfigItemPanel | ConfigItemTabs;
    data?: Record<string, unknown>;
    originalData?: Record<string, unknown>;
    updateData: number;
    common?: ioBroker.InstanceCommon;
    changed: boolean;
    confirmDialog: boolean;
    theme: IobTheme;
    saveConfigDialog: boolean;
    hash: string;
    error?: boolean;
}

class JsonConfig extends Router<JsonConfigProps, JsonConfigState> {
    private fileSubscribed: string[] = [];

    private fileLangSubscribed = '';

    private secret: string;

    constructor(props: JsonConfigProps) {
        super(props);

        this.state = {
            updateData: 0,
            changed: false,
            confirmDialog: false,
            theme: Theme(props.themeName), // buttons require special theme
            saveConfigDialog: false,
            hash: '_',
        };

        this.secret = props.secret || '';

        this.getInstanceObject()
            .then(obj => this.getConfigFile()
                .then(schema =>
                    // load language
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
                                    hash: MD5(JSON.stringify(schema)).toString(),
                                });
                            } else {
                                window.alert(`Instance system.adapter.${this.props.adapterName}.${this.props.instance} not found!`);
                            }
                        })));
    }

    async componentWillUnmount(): Promise<void> {
        super.componentWillUnmount();
        if (this.fileSubscribed.length) {
            this.props.socket.unsubscribeFiles(`${this.props.adapterName}.admin`, this.fileSubscribed, this.onFileChange);
            this.fileSubscribed = [];
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
                } catch {
                    window.alert(I18n.t('[JsonConfig] Failed to parse JSON file'));
                }
            };
            r.readAsText(f);
        } else {
            window.alert(I18n.t('[JsonConfig] Failed to open JSON File'));
        }
    };

    getExportImportButtons(): React.JSX.Element {
        return <div style={styles.exportImportButtons}>
            <Tooltip title={this.props.t('Import settings from JSON file')} slotProps={{ popper: { sx: styles.tooltip } }}>
                <Fab
                    size="small"
                    sx={{ '&.MuiFab-root': styles.button }}
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
            <Tooltip title={this.props.t('Export setting to JSON file')} slotProps={{ popper: { sx: styles.tooltip } }}>
                <Fab
                    size="small"
                    sx={{ '&.MuiFab-root': styles.button }}
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
                    await JsonConfigComponent.loadI18n(this.props.socket, this.state.schema?.i18n, this.props.adapterName);
                    this.setState({ hash: `${this.state.hash}1` });
                } catch {
                    // ignore errors
                }
            } else if (this.fileSubscribed.includes(fileName)) {
                try {
                    const schema = await this.getConfigFile(this.fileSubscribed[0]);
                    this.setState({ schema, hash: MD5(JSON.stringify(schema)).toString() });
                } catch {
                    // ignore errors
                }
            }
        }
    };

    async getInstanceObject(): Promise<ioBroker.InstanceObject | null> {
        try {
            const obj = await this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`);
            // decode all native attributes listed in obj.encryptedNative
            if (Array.isArray(obj.encryptedNative)) {
                if (!this.secret) {
                    const systemConfig = await this.props.socket.getSystemConfig();
                    await loadScript('../../lib/js/crypto-js/crypto-js.js', 'crypto-js');
                    this.secret = systemConfig.native.secret;
                }
                obj.encryptedNative?.forEach(attr => {
                    if (obj.native[attr]) {
                        obj.native[attr] = decrypt(this.secret, obj.native[attr]);
                    }
                });
                return obj;
            }
            return obj;
        } catch (e) {
            window.alert(`[JsonConfig] Cannot read instance object: ${e}`);
        }
        return null;
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
                this.setState({ confirmDialog: false }, () => isYes && Router.doNavigate(null))}
        />;
    }

    async scanForInclude(json: Record<string, any>, filePaths: string[]): Promise<Record<string, any>> {
        if (typeof json['#include'] === 'string') {
            // load file
            const data = await this._getConfigFile(json['#include'], [...filePaths]);
            delete json['#include'];
            if (data) {
                // merge data
                json = { ...json, ...data };
            }
            return json;
        }
        const keys = Object.keys(json);
        for (let k = 0; k < keys.length; k++) {
            if (json[keys[k]] && typeof json[keys[k]] === 'object') {
                json[keys[k]] = await this.scanForInclude(json[keys[k]], filePaths);
            }
        }
        return json;
    }

    async getConfigFile(fileName?: string): Promise<ConfigItemPanel | ConfigItemTabs> {
        return this._getConfigFile(fileName);
    }

    async _getConfigFile(fileName?: string, _filePaths?: string[]): Promise<ConfigItemPanel | ConfigItemTabs> {
        fileName = fileName || 'jsonConfig.json5';
        _filePaths = _filePaths || [];

        if (_filePaths.includes(fileName)) {
            window.alert(`[JsonConfig] Circular reference in file: ${fileName} => ${_filePaths.join(' => ')}`);
            return null;
        }
        _filePaths.push(fileName);

        try {
            const exist = await this.props.socket.fileExists(`${this.props.adapterName}.admin`, fileName);
            if (!exist) {
                fileName = 'jsonConfig.json';
            }
            const data: {
                file: string;
                mimeType: string;
            } = await this.props.socket.readFile(`${this.props.adapterName}.admin`, fileName);
            let content = '';
            let file: string | BufferObject = '';

            if (data.file !== undefined) {
                file = data.file;
            }

            if (typeof file === 'string') {
                content = file;
                // @ts-expect-error revisit
            } else if (file.type === 'Buffer') {
                let binary = '';
                // @ts-expect-error revisit
                const bytes = new Uint8Array(file.data);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                content = binary;
            }

            // subscribe on changes
            if (!this.fileSubscribed.includes(fileName)) {
                this.fileSubscribed.push(fileName);
                await this.props.socket.subscribeFiles(`${this.props.adapterName}.admin`, fileName, this.onFileChange);
            }

            try {
                // detect #include attr
                return (await this.scanForInclude(JSON5.parse(content), _filePaths)) as (ConfigItemPanel | ConfigItemTabs);
            } catch (e) {
                window.alert('[JsonConfig] Cannot parse json5 config!');
                console.log(e);
            }
        } catch (e1) {
            if (!this.state.schema) {
                window.alert(`[JsonConfig] Cannot read file "${fileName}: ${e1}`);
            }
        }
        return null;
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

    findAttr(attr: string, schema?: ConfigItemPanel | ConfigItemTabs): ConfigItemAny | null {
        schema = schema || this.state.schema;
        if (schema?.items) {
            if (attr in schema.items) {
                return schema.items[attr] as ConfigItemAny;
            }
            for (const _item of Object.values(schema.items)) {
                const item = this.findAttr(attr, _item as ConfigItemPanel | ConfigItemTabs);
                if (item) {
                    return item;
                }
            }
        }

        return null;
    }

    // this function is called recursively and trims all text fields, that must be trimmed
    postProcessing(data: Record<string, unknown>, attr: string, schema: ConfigItemAny): void {
        schema = schema || this.state.schema;
        if (!data) {
            // should not happen
            console.error(`Data is empty in postProcessing: ${attr}, ${JSON.stringify(schema)}`);
            return;
        }

        const dataAttr = data[attr];

        if ((schema as ConfigItemTabs).items) {
            if (schema.type === 'table') {
                const table = dataAttr;

                if (!Array.isArray(table)) {
                    return;
                }

                for (const entry of table) {
                    for (const tItem of schema.items) {
                        this.postProcessing(entry, tItem.attr as string, tItem as ConfigItemAny);
                    }
                }
            } else {
                for (const [_attr, item] of Object.entries((schema as ConfigItemTabs).items)) {
                    if ((item as any).type === 'panel' || (item as any).type === 'tabs' || (item as any).type === 'accordion') {
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

            const doNotSaveAttributes: Record<string, any> = {};

            for (const attr of Object.keys(this.state.data)) {
                const item = this.findAttr(attr);
                if ((!item || !item.doNotSave || item.type === 'state') && !attr.startsWith('_')) {
                    ConfigGeneric.setValue(obj.native, attr, this.state.data[attr]);
                } else {
                    ConfigGeneric.setValue(obj.native, attr, null);
                    doNotSaveAttributes[attr] = this.state.data[attr];
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

            /** We want to preserve the doNotSaveAttributes too, just not save it */
            const nativeWithNonSaved = { ...obj.native, ...doNotSaveAttributes };
            console.log(nativeWithNonSaved);

            this.setState({
                changed: false,
                data: nativeWithNonSaved,
                updateData: this.state.updateData + 1,
                originalData: nativeWithNonSaved,
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
        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <div style={styles.root}>
            {this.renderConfirmDialog()}
            {this.getExportImportButtons()}
            {this.renderSaveConfigDialog()}
            <JsonConfigComponent
                key={this.state.hash as string}
                style={styles.scroll}
                socket={this.props.socket}
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
                DeviceManager={this.props.DeviceManager}
                theme={this.state.theme}
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
                onSave={(close: boolean) => this.onSave(true, close)}
                onClose={() => this.onSave(false)}
            />
        </div>;
    }
}

export default JsonConfig;
