import React, { Component, type JSX } from 'react';

import { Grid2, Button } from '@mui/material';

import {
    Info as IconInfo,
    Warning as IconWarning,
    Error as IconError,
    Key as IconAuth,
    Send as IconSend,
    Public as IconWeb,
    Search as IconSearch,
    MenuBook as IconMenuBook,
    Help as IconHelp,
    UploadFile as IconUploadFile,
    Edit as IconEdit,
    Person as IconPerson,
    Group as IconGroup,
    Delete as IconDelete,
    Refresh as IconRefresh,
    Add as IconAdd,
    LinkOff as IconLinkOff,
    Link as LinkIcon,
    Save,
    OpenInNew,
} from '@mui/icons-material';

import {
    DialogConfirm,
    Icon,
    Utils,
    I18n,
    type Connection,
    type ThemeType,
    type ThemeName,
    type IobTheme,
} from '@iobroker/adapter-react-v5';
import type { ConfigIconType, ConfigItemAny, ConfigItemConfirmData, JsonConfigContext } from '#JC/types';

const DEFAULT_SM_SIZE = window.innerWidth <= 600 ? 12 : undefined;

// because this class is used in react-components, do not include here any foreign files like from '../../helpers/utils.ts'
export function isObject(it: any): it is Record<string, any> {
    // This is necessary because:
    // typeof null === 'object'
    // typeof [] === 'object'
    // [] instanceof Object === true
    return Object.prototype.toString.call(it) === '[object Object]'; // this code is 25% faster than below one
    // return it && typeof it === 'object' && !(it instanceof Array);
}

export interface DeviceManagerPropsProps {
    /* socket object */
    socket: Connection;
    /* Instance to communicate with device-manager backend, like `adapterName.X` */
    selectedInstance: string; // adapterName.X
    registerHandler?: (handler: null | ((command: string) => void)) => void;
    themeName: ThemeName;
    theme: IobTheme;
    themeType: ThemeType;
    isFloatComma: boolean;
    dateFormat: string;
    /** Instance to upload images to, like `adapterName.X` */
    uploadImagesToInstance?: string;
    /** Filter devices with this string */
    filter?: string;
    /** If this component is used in GUI with own toolbar. `false` if this list is used with multiple instances and true if only with one (in this case, it will monitor alive itself */
    embedded?: boolean;
    /** If embedded, this text is shown in the toolbar */
    title?: string;
    /** Style of a component that displays all devices */
    style?: React.CSSProperties;
    /** Use small cards for devices */
    smallCards?: boolean;
}

export interface ConfigGenericProps {
    oContext: JsonConfigContext;
    alive: boolean;
    arrayIndex?: number;
    attr?: string;
    changed: boolean;
    className?: string;
    style?: Record<string, any>;
    commandRunning?: boolean;
    common: Record<string, any>;
    custom?: boolean;
    customObj?: Record<string, any>;
    data: Record<string, any>;
    disabled?: boolean;
    // filled only by table and represents the obj.native or obj.common.custom['adapter.X'] object
    globalData?: Record<string, any>;
    // filled only by table
    index?: number;
    isParentTab?: boolean;
    onChange: (attrOrData: string | Record<string, any>, val?: any, cb?: () => void, saveConfig?: boolean) => void;
    onError: (attr: string, error?: string) => void;
    originalData: Record<string, any>;
    /** This indicates that the component is the very firsts one - root */
    root?: boolean;
    /** Provided props by the specific component */
    schema: ConfigItemAny;
    /** This item is in the table. Maybe some layouts must be changed */
    table?: boolean;
    themeName: ThemeName;
}

export interface ConfigGenericState {
    confirmDialog: boolean;
    confirmNewValue: any;
    confirmAttr: any;
    confirmData: ConfigItemConfirmData | null;
    value?: any;
    confirmDepAttr?: any;
    confirmDepNewValue?: any;
    confirmCallback: null | ((result: boolean) => void);
}

export default class ConfigGeneric<
    Props extends ConfigGenericProps = ConfigGenericProps,
    State extends ConfigGenericState = ConfigGenericState,
> extends Component<Props, State> {
    static DIFFERENT_VALUE = '__different__';

    static DIFFERENT_LABEL = 'ra___different__';

    static NONE_VALUE = '';

    static NONE_LABEL = 'ra_none';

    private readonly defaultValue: any;

    private isError: any;

    private readonly lang: ioBroker.Languages;

    private defaultSendToDone?: boolean;

    private sendToTimeout?: any;

    private noPlaceRequired: any;

    constructor(props: Props) {
        super(props);

        // @ts-expect-error of course, as we just
        this.state = {
            confirmDialog: false,
            confirmNewValue: null,
            confirmAttr: null,
            confirmData: null,
            confirmCallback: null,
        } satisfies ConfigGenericState;

        this.isError = {};

        if (props.schema) {
            if (props.custom) {
                this.defaultValue = props.schema.defaultFunc
                    ? this.executeCustom(
                          props.schema.defaultFunc,
                          props.data,
                          props.customObj,
                          props.oContext.instanceObj,
                          props.arrayIndex,
                          props.globalData,
                      )
                    : props.schema.default;
            } else if (props.schema.type !== 'state') {
                this.defaultValue = props.schema.defaultFunc
                    ? this.execute(
                          props.schema.defaultFunc,
                          props.schema.default,
                          props.data,
                          props.arrayIndex,
                          props.globalData,
                      )
                    : props.schema.default;
            }
        }

        this.lang = I18n.getLanguage();
    }

    componentDidMount(): void {
        if (this.props.oContext.registerOnForceUpdate) {
            this.props.oContext.registerOnForceUpdate(this.props.attr, this.onUpdate);
        }
        const LIKE_SELECT = ['select', 'autocomplete', 'autocompleteSendTo'];
        // init default value
        if (this.defaultValue !== undefined) {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            if (
                value === undefined ||
                (LIKE_SELECT.includes(this.props.schema.type) && (value === '' || value === null))
            ) {
                setTimeout(() => {
                    if (this.props.custom) {
                        this.props.onChange(this.props.attr, this.defaultValue, () =>
                            setTimeout(() => this.props.oContext.forceUpdate([this.props.attr], this.props.data), 100),
                        );
                    } else {
                        ConfigGeneric.setValue(this.props.data, this.props.attr, this.defaultValue);
                        this.props.onChange(this.props.data, undefined, () =>
                            this.props.oContext.forceUpdate([this.props.attr], this.props.data),
                        );
                    }
                }, 100);
            }
        } else if (this.props.schema.defaultSendTo) {
            this.sendTo();
        }
    }

    sendTo(): void {
        if (this.props.alive) {
            this.defaultSendToDone = true;
            let data: any = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr = this.getPattern(this.props.schema.jsonData, null, true);
                try {
                    data = JSON.parse(dataStr);
                } catch {
                    console.error(`Cannot parse json data: ${dataStr}`);
                }
            } else {
                data = {
                    attr: this.props.attr,
                    value: ConfigGeneric.getValue(this.props.data, this.props.attr),
                };
            }

            if (data === undefined) {
                data = null;
            }

            void this.props.oContext.socket
                .sendTo(
                    `${this.props.oContext.adapterName}.${this.props.oContext.instance}`,
                    this.props.schema.defaultSendTo,
                    data,
                )
                .then((value: any) => {
                    if (value !== null && value !== undefined) {
                        if (this.props.custom) {
                            this.props.onChange(this.props.attr, value, () =>
                                this.props.oContext.forceUpdate([this.props.attr], this.props.data),
                            );
                        } else {
                            ConfigGeneric.setValue(this.props.data, this.props.attr, value);
                            this.props.onChange(this.props.data, undefined, () =>
                                this.props.oContext.forceUpdate([this.props.attr], this.props.data),
                            );
                        }
                    }
                });
        } else {
            this.defaultSendToDone = false;
            if (!this.props.schema.allowSaveWithError) {
                // show error, that instance did not start
                this.onError(
                    this.props.attr,
                    I18n.t('ra_Instance %s is not alive', this.props.oContext.instance.toString()),
                );
            }
        }
    }

    componentWillUnmount(): void {
        if (this.props.oContext.registerOnForceUpdate) {
            this.props.oContext.registerOnForceUpdate(this.props.attr);
        }
        if (this.sendToTimeout) {
            clearTimeout(this.sendToTimeout);
            this.sendToTimeout = null;
        }
    }

    onUpdate = (data: Record<string, any>): void => {
        const value = ConfigGeneric.getValue(data || this.props.data, this.props.attr) || '';
        if (this.state.value !== value) {
            this.setState({ value });
        } else {
            this.forceUpdate();
        }
    };

    /**
     * Extract attribute out of data
     */
    static getValue(data: Record<string, any>, attr: string | string[]): any {
        if (typeof attr === 'string') {
            return ConfigGeneric.getValue(data, attr.split('.'));
        }
        if (attr.length === 1) {
            return data[attr[0]];
        }
        const part = attr.shift();

        if (typeof part === 'string' && typeof data[part] === 'object') {
            return ConfigGeneric.getValue(data[part], attr);
        }
        return undefined;
    }

    static setValue(data: Record<string, any>, attr: string | string[], value: any): void {
        if (typeof attr === 'string') {
            ConfigGeneric.setValue(data, attr.split('.'), value);
            return;
        }
        if (attr.length === 1) {
            if (value === null) {
                delete data[attr[0]];
            } else {
                data[attr[0]] = value;
            }
        } else {
            const part = attr.shift();

            if (typeof part !== 'string') {
                return;
            }

            if (!data[part] || typeof data[part] === 'object') {
                data[part] = data[part] || {};
            }
            ConfigGeneric.setValue(data[part], attr, value);
        }
    }

    getText(text: ioBroker.StringOrTranslated, noTranslation?: boolean): string {
        if (!text) {
            return '';
        }

        if (typeof text === 'string') {
            const strText = noTranslation ? text : I18n.t(text);
            if (strText.includes('${')) {
                return this.getPattern(strText, null, noTranslation);
            }
            return strText;
        }

        if (isObject(text)) {
            // todo
            if ((text as any).func) {
                // calculate pattern
                if (typeof (text as any).func === 'object') {
                    return this.getPattern((text as any).func[this.lang] || (text as any).func.en || '', null, true);
                }
                return this.getPattern((text as any).func, null, noTranslation);
            }

            return text[this.lang] || text.en || '';
        }

        return (text as any).toString();
    }

    renderDialogConfirm(): JSX.Element | null {
        if (!this.state.confirmDialog) {
            return null;
        }
        const confirm = this.state.confirmData || this.props.schema.confirm;
        let icon: null | JSX.Element = null;
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
                onClose={isOk =>
                    this.setState({ confirmDialog: false }, () => {
                        if (isOk) {
                            if (this.state.confirmCallback) {
                                const callback = this.state.confirmCallback;
                                this.setState({ confirmCallback: null }, () => callback(true));
                                return;
                            }

                            const data = JSON.parse(JSON.stringify(this.props.data));
                            if (this.state.confirmDepAttr) {
                                ConfigGeneric.setValue(data, this.state.confirmDepAttr, this.state.confirmDepNewValue);
                            }

                            ConfigGeneric.setValue(data, this.state.confirmAttr, this.state.confirmNewValue);
                            this.setState(
                                {
                                    confirmDialog: false,
                                    confirmDepAttr: null,
                                    confirmDepNewValue: null,
                                    confirmNewValue: null,
                                    confirmAttr: null,
                                    confirmData: null,
                                },
                                () => this.props.onChange(data),
                            );
                        } else {
                            const callback = this.state.confirmCallback;
                            this.setState(
                                {
                                    confirmDialog: false,
                                    confirmDepAttr: null,
                                    confirmDepNewValue: null,
                                    confirmNewValue: null,
                                    confirmAttr: null,
                                    confirmData: null,
                                    confirmCallback: null,
                                },
                                () => {
                                    if (callback) {
                                        callback(false);
                                    }
                                },
                            );
                        }
                    })
                }
            />
        );
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    getIcon(iconSettings?: ConfigIconType | null): JSX.Element | null {
        iconSettings = iconSettings || this.props.schema.icon;
        let icon = null;
        if (iconSettings === 'auth') {
            icon = <IconAuth />;
        } else if (iconSettings === 'send') {
            icon = <IconSend />;
        } else if (iconSettings === 'web') {
            icon = <IconWeb />;
        } else if (iconSettings === 'warning') {
            icon = <IconWarning />;
        } else if (iconSettings === 'error') {
            icon = <IconError />;
        } else if (iconSettings === 'info') {
            icon = <IconInfo />;
        } else if (iconSettings === 'search') {
            icon = <IconSearch />;
        } else if (iconSettings === 'book') {
            icon = <IconMenuBook />;
        } else if (iconSettings === 'help') {
            icon = <IconHelp />;
        } else if (iconSettings === 'upload') {
            icon = <IconUploadFile />;
        } else if (iconSettings === 'edit') {
            icon = <IconEdit />;
        } else if (iconSettings === 'user') {
            icon = <IconPerson />;
        } else if (iconSettings === 'group') {
            icon = <IconGroup />;
        } else if (iconSettings === 'delete') {
            icon = <IconDelete />;
        } else if (iconSettings === 'refresh') {
            icon = <IconRefresh />;
        } else if (iconSettings === 'add') {
            icon = <IconAdd />;
        } else if (iconSettings === 'unpair') {
            icon = <IconLinkOff />;
        } else if (iconSettings === 'pair') {
            icon = <LinkIcon />;
        } else if (iconSettings === 'save') {
            icon = <Save />;
        } else if (iconSettings === 'open') {
            icon = <OpenInNew />;
        } else if (iconSettings) {
            if (iconSettings.endsWith('.png') || iconSettings.endsWith('.svg') || iconSettings.endsWith('.jpg')) {
                // this path is relative to ./adapter/NAME
                if (!iconSettings.startsWith('http://') && !iconSettings.startsWith('https://')) {
                    iconSettings = `./adapter/${this.props.oContext.adapterName}/${iconSettings}`;
                }
            }

            icon = (
                <Icon
                    src={iconSettings}
                    style={{ width: 22, height: 22 }}
                />
            );
        }

        return icon;
    }

    /**
     * Trigger onChange, to activate save button on change
     *
     * @param attr the changed attribute
     * @param newValue new value of the attribute
     */
    // eslint-disable-next-line react/no-unused-class-component-methods
    onChangeAsync(attr: string, newValue: unknown): Promise<void> {
        return new Promise(resolve => {
            const mayBePromise = this.onChange(attr, newValue, resolve);
            if (mayBePromise instanceof Promise) {
                mayBePromise.catch(e => console.error(`Cannot set value: ${e}`));
            }
        });
    }

    /**
     * Trigger onChange, to activate save button on change
     *
     * @param attr the changed attribute
     * @param newValue new value of the attribute
     * @param cb optional callback function, else returns a Promise
     */
    onChange(attr: string, newValue: unknown, cb?: () => void): Promise<void> {
        // Do not use here deep copy, as it is not JsonConfig
        const data = JSON.parse(JSON.stringify(this.props.data));
        ConfigGeneric.setValue(data, attr, newValue);

        if (
            this.props.schema.confirm &&
            this.execute(this.props.schema.confirm.condition, false, data, this.props.arrayIndex, this.props.globalData)
        ) {
            return new Promise<void>(resolve => {
                this.setState(
                    {
                        confirmDialog: true,
                        confirmNewValue: newValue,
                        confirmAttr: attr,
                        confirmData: null,
                    },
                    () => {
                        if (typeof cb === 'function') {
                            cb();
                        } else {
                            resolve();
                        }
                    },
                );
            });
        }
        // find any inputs with confirmation
        if (this.props.schema.confirmDependsOn) {
            for (let z = 0; z < this.props.schema.confirmDependsOn.length; z++) {
                const dep = this.props.schema.confirmDependsOn[z];
                if (dep.confirm) {
                    const val = ConfigGeneric.getValue(data, dep.attr);

                    if (
                        this.execute(dep.confirm.condition, false, data, this.props.arrayIndex, this.props.globalData)
                    ) {
                        return new Promise<void>(resolve => {
                            this.setState(
                                {
                                    confirmDialog: true,
                                    confirmNewValue: newValue,
                                    confirmAttr: attr,
                                    confirmDepNewValue: val,
                                    confirmDepAttr: dep.attr,
                                    confirmData: dep.confirm,
                                },
                                () => {
                                    if (typeof cb === 'function') {
                                        cb();
                                    } else {
                                        resolve();
                                    }
                                },
                            );
                        });
                    }
                }
            }
        }

        const changed: string[] = [];
        if (this.props.schema.onChangeDependsOn) {
            for (let z = 0; z < this.props.schema.onChangeDependsOn.length; z++) {
                const dep = this.props.schema.onChangeDependsOn[z];
                if (dep.onChange) {
                    const val = ConfigGeneric.getValue(data, dep.attr);

                    let _newValue;
                    if (this.props.custom) {
                        _newValue = this.executeCustom(
                            dep.onChange.calculateFunc,
                            data,
                            this.props.customObj,
                            this.props.oContext.instanceObj,
                            this.props.arrayIndex,
                            this.props.globalData,
                        );
                    } else {
                        _newValue = this.execute(
                            dep.onChange.calculateFunc,
                            val,
                            data,
                            this.props.arrayIndex,
                            this.props.globalData,
                        );
                    }

                    if (_newValue !== val) {
                        ConfigGeneric.setValue(data, dep.attr, _newValue);
                        changed.push(dep.attr);
                    }
                }
            }
        }

        if (this.props.schema.hiddenDependsOn) {
            for (let z = 0; z < this.props.schema.hiddenDependsOn.length; z++) {
                const dep = this.props.schema.hiddenDependsOn[z];
                if (dep.hidden) {
                    changed.push(dep.attr);
                }
            }
        }

        if (this.props.schema.labelDependsOn) {
            for (let z = 0; z < this.props.schema.labelDependsOn.length; z++) {
                const dep = this.props.schema.labelDependsOn[z];
                if (dep.hidden) {
                    changed.push(dep.attr);
                }
            }
        }

        if (this.props.schema.helpDependsOn) {
            for (let z = 0; z < this.props.schema.helpDependsOn.length; z++) {
                const dep = this.props.schema.helpDependsOn[z];
                if (dep.hidden) {
                    changed.push(dep.attr);
                }
            }
        }

        if (this.props.schema.onChange && !this.props.schema.onChange.ignoreOwnChanges) {
            const val = ConfigGeneric.getValue(data, this.props.attr);

            const newValue_ = this.props.custom
                ? this.executeCustom(
                      this.props.schema.onChange.calculateFunc,
                      data,
                      this.props.customObj,
                      this.props.oContext.instanceObj,
                      this.props.arrayIndex,
                      this.props.globalData,
                  )
                : this.execute(
                      this.props.schema.onChange.calculateFunc,
                      val,
                      data,
                      this.props.arrayIndex,
                      this.props.globalData,
                  );
            if (newValue_ !== val) {
                ConfigGeneric.setValue(data, this.props.attr, newValue_);
            }
        }

        if (this.props.custom) {
            this.props.onChange(attr, newValue, () => cb && cb());

            if (changed?.length) {
                changed.forEach((_attr, i) =>
                    setTimeout(() => this.props.onChange(_attr, ConfigGeneric.getValue(data, _attr)), i * 50),
                );
            }
        } else {
            this.props.onChange(data, undefined, () => {
                if (changed.length) {
                    this.props.oContext.forceUpdate(changed, data);
                }
                if (cb) {
                    cb();
                }
            });
        }

        return Promise.resolve();
    }

    execute(
        func: string | boolean | Record<string, string>,
        defaultValue: string | number | boolean,
        data: Record<string, any>,
        arrayIndex: number,
        globalData: Record<string, any>,
    ): string | number | boolean {
        let fun: string;

        if (isObject(func)) {
            fun = func.func;
        } else if (typeof func === 'string') {
            fun = func;
        } else {
            return func;
        }

        if (!fun) {
            return defaultValue;
        }
        try {
            const f = new Function(
                'data',
                'originalData',
                '_system',
                '_alive',
                '_common',
                '_socket',
                '_instance',
                'arrayIndex',
                'globalData',
                '_changed',
                fun.includes('return') ? fun : `return ${fun}`,
            );
            return f(
                data || this.props.data,
                this.props.originalData,
                this.props.oContext.systemConfig,
                this.props.alive,
                this.props.common,
                this.props.oContext.socket,
                this.props.oContext.instance,
                arrayIndex,
                globalData,
                this.props.changed,
            );
        } catch (e) {
            console.error(`Cannot execute ${JSON.stringify(func)}: ${e}`);
            return defaultValue;
        }
    }

    executeCustom(
        func: string | boolean | Record<string, string>,
        data: Record<string, any>,
        customObj: Record<string, any>,
        instanceObj: ioBroker.InstanceObject,
        arrayIndex: number,
        globalData: Record<string, any>,
    ): string | boolean | number | null {
        let fun: string;

        if (isObject(func)) {
            fun = func.func;
        } else if (typeof func === 'string') {
            fun = func;
        } else {
            return func;
        }

        if (!fun) {
            return null;
        }
        try {
            const f = new Function(
                'data',
                'originalData',
                '_system',
                'instanceObj',
                'customObj',
                '_socket',
                'arrayIndex',
                'globalData',
                '_changed',
                fun.includes('return') ? fun : `return ${fun}`,
            );
            return f(
                data || this.props.data,
                this.props.originalData,
                this.props.oContext.systemConfig,
                instanceObj,
                customObj,
                this.props.oContext.socket,
                arrayIndex,
                globalData,
                this.props.changed,
            );
        } catch (e) {
            console.error(`Cannot execute ${fun}: ${e}`);
            return null;
        }
    }

    calculate(schema: Record<string, any>): {
        error: boolean;
        disabled: boolean;
        hidden: boolean;
        defaultValue: null | string | number | boolean;
    } {
        let error: boolean;
        let disabled: boolean;
        let hidden: boolean;
        let defaultValue: null | string | number | boolean;

        if (this.props.custom) {
            error = schema.validator
                ? !this.executeCustom(
                      schema.validator,
                      this.props.data,
                      this.props.customObj,
                      this.props.oContext.instanceObj,
                      this.props.arrayIndex,
                      this.props.globalData,
                  )
                : false;
            if (schema.disabled === true) {
                disabled = true;
            } else {
                disabled = schema.disabled
                    ? (this.executeCustom(
                          schema.disabled,
                          this.props.data,
                          this.props.customObj,
                          this.props.oContext.instanceObj,
                          this.props.arrayIndex,
                          this.props.globalData,
                      ) as boolean)
                    : false;
            }
            if (schema.hidden === true) {
                hidden = true;
            } else {
                hidden = schema.hidden
                    ? (this.executeCustom(
                          schema.hidden,
                          this.props.data,
                          this.props.customObj,
                          this.props.oContext.instanceObj,
                          this.props.arrayIndex,
                          this.props.globalData,
                      ) as boolean)
                    : false;
            }
            defaultValue = schema.defaultFunc
                ? this.executeCustom(
                      schema.defaultFunc,
                      this.props.data,
                      this.props.customObj,
                      this.props.oContext.instanceObj,
                      this.props.arrayIndex,
                      this.props.globalData,
                  )
                : schema.default;
        } else {
            error = schema.validator
                ? !this.execute(schema.validator, false, this.props.data, this.props.arrayIndex, this.props.globalData)
                : false;
            if (schema.disabled === true) {
                disabled = true;
            } else {
                disabled = schema.disabled
                    ? (this.execute(
                          schema.disabled,
                          false,
                          this.props.data,
                          this.props.arrayIndex,
                          this.props.globalData,
                      ) as boolean)
                    : false;
            }
            if (schema.hidden === true) {
                hidden = true;
            } else {
                hidden = schema.hidden
                    ? (this.execute(
                          schema.hidden,
                          false,
                          this.props.data,
                          this.props.arrayIndex,
                          this.props.globalData,
                      ) as boolean)
                    : false;
            }
            defaultValue = schema.defaultFunc
                ? this.execute(
                      schema.defaultFunc,
                      schema.default,
                      this.props.data,
                      this.props.arrayIndex,
                      this.props.globalData,
                  )
                : schema.default;
        }

        return {
            error,
            disabled,
            hidden,
            defaultValue,
        };
    }

    onError(attr: string, error?: string): void {
        if (!error) {
            delete this.isError[attr];
        } else {
            this.isError[attr] = error;
        }

        if (this.props.onError) {
            this.props.onError(attr, error);
        }
    }

    renderItem(_error: unknown, _disabled: boolean, _defaultValue?: unknown): JSX.Element | string | null {
        return this.getText(this.props.schema.label) || this.getText(this.props.schema.text);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderHelp(
        text: ioBroker.StringOrTranslated,
        link: string,
        noTranslation: boolean,
    ): JSX.Element | JSX.Element[] | string {
        if (!link) {
            text = this.getText(text, noTranslation) || '';
            if (
                text &&
                (text.includes('<a ') || text.includes('<br') || text.includes('<b>') || text.includes('<i>'))
            ) {
                return Utils.renderTextWithA(text);
            }
            return text;
        }
        return (
            <a
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{
                    color: this.props.oContext.themeType === 'dark' ? '#a147ff' : '#5b238f',
                    textDecoration: 'underline',
                }}
            >
                {this.getText(text, noTranslation)}
            </a>
        );
    }

    // we have a problem that a string '{"password": "${password}"}' cannot contain a double quota inside the string
    // escape it with \"
    static escapeString(str: string, data: Record<string, any>): string {
        if (typeof str !== 'string') {
            return '';
        }
        str = str.replace(/`/g, '\\`');
        // extract all tokes with ${data.token}
        str = str.replace(/\${([^}]+)}/g, (_match: string, p1: any) => {
            if (p1 && typeof p1 === 'string' && p1.startsWith('data.')) {
                const value = ConfigGeneric.getValue(data, p1.replace(/^data\./, ''));

                if (typeof value === 'string' && value.includes('"')) {
                    return `\${${p1}.replace(/"/g, '\\\\"')}`;
                }
            }
            return _match;
        });

        return str;
    }

    getPattern(pattern: string | { func: string }, data?: Record<string, any>, noTranslation?: boolean): string {
        data = data || this.props.data;
        if (!pattern) {
            return '';
        }
        let patternStr: string;
        if (typeof pattern === 'object') {
            if (pattern.func) {
                patternStr = (pattern as { func: string }).func;
            } else {
                console.log(`Object must be stringified: ${JSON.stringify(pattern)}`);
                patternStr = JSON.stringify(pattern);
            }
        } else {
            patternStr = pattern;
        }

        try {
            if (this.props.custom) {
                const f = new Function(
                    'data',
                    'originalData',
                    'arrayIndex',
                    'globalData',
                    '_system',
                    'instanceObj',
                    'customObj',
                    '_socket',
                    '_changed',
                    `return \`${ConfigGeneric.escapeString(patternStr, data)}\``,
                );
                return f(
                    data,
                    this.props.originalData,
                    this.props.arrayIndex,
                    this.props.globalData,
                    this.props.oContext.systemConfig,
                    this.props.oContext.instanceObj,
                    this.props.customObj,
                    this.props.oContext.socket,
                    this.props.changed,
                );
            }

            const f = new Function(
                'data',
                'originalData',
                'arrayIndex',
                'globalData',
                '_system',
                '_alive',
                '_common',
                '_socket',
                '_changed',
                `return \`${ConfigGeneric.escapeString(patternStr, data)}\``,
            );
            const text = f(
                data,
                this.props.originalData,
                this.props.arrayIndex,
                this.props.globalData,
                this.props.oContext.systemConfig,
                this.props.alive,
                this.props.common,
                this.props.oContext.socket,
                this.props.changed,
            );
            if (noTranslation) {
                return text;
            }
            return I18n.t(text);
        } catch (e) {
            console.error(`Cannot execute ${patternStr}: ${e}`);
            return patternStr;
        }
    }

    render(): string | JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        // Do not show this component if expert mode is false
        if (this.props.oContext.expertMode === false && schema.expertMode) {
            return null;
        }

        if (this.props.alive && this.defaultSendToDone === false) {
            this.sendToTimeout = setTimeout(() => {
                this.sendToTimeout = null;
                this.sendTo();
            }, 200);
        }

        const { error, disabled, hidden, defaultValue } = this.calculate(schema);

        if (hidden) {
            // Remove all errors if an element is hidden
            if (Object.keys(this.isError).length) {
                setTimeout(
                    isError => Object.keys(isError).forEach(attr => this.props.onError(attr)),
                    100,
                    JSON.parse(JSON.stringify(this.isError)),
                );
                this.isError = {};
            }

            if (schema.hideOnlyControl) {
                const item = (
                    <Grid2
                        size={{
                            xs: schema.xs || DEFAULT_SM_SIZE, // if xs is not defined, take the full width
                            sm: schema.sm || undefined,
                            md: schema.md || undefined,
                            lg: schema.lg || undefined,
                            xl: schema.xl || undefined,
                        }}
                        style={{
                            marginBottom: 0 /* marginRight: 8, */,
                            textAlign: 'left',
                            ...schema.style,
                            ...(this.props.oContext.themeType === 'dark' ? schema.darkStyle : {}),
                        }}
                    />
                );

                if (schema.newLine) {
                    return (
                        <>
                            <div style={{ flexBasis: '100%', height: 0 }} />
                            {item}
                        </>
                    );
                }
                return item;
            }
            return null;
        }
        // Add error
        if (schema.validatorNoSaveOnError) {
            if (error && !Object.keys(this.isError).length) {
                this.isError = {
                    [this.props.attr]: schema.validatorErrorText ? I18n.t(schema.validatorErrorText) : true,
                };
                setTimeout(
                    isError => Object.keys(isError).forEach(attr => this.props.onError(attr, isError[attr])),
                    100,
                    JSON.parse(JSON.stringify(this.isError)),
                );
            } else if (!error && Object.keys(this.isError).length) {
                setTimeout(
                    isError => Object.keys(isError).forEach(attr => this.props.onError(attr)),
                    100,
                    JSON.parse(JSON.stringify(this.isError)),
                );
                this.isError = {};
            }
        }

        const renderedItem = this.renderItem(
            error,
            disabled || this.props.commandRunning || this.props.disabled,
            defaultValue,
        );

        if (this.noPlaceRequired) {
            return renderedItem;
        }

        const item = (
            <Grid2
                title={this.getText(schema.tooltip)}
                size={{
                    xs: schema.xs || 12, // if xs is not defined, take the full width
                    sm: schema.sm || undefined,
                    md: schema.md || undefined,
                    lg: schema.lg || undefined,
                    xl: schema.xl || undefined,
                }}
                style={{
                    marginBottom: 0,
                    textAlign: 'left',
                    width: schema.type === 'divider' || schema.type === 'header' ? schema.width || '100%' : undefined,
                    ...schema.style,
                    ...(this.props.oContext.themeType === 'dark' ? schema.darkStyle : {}),
                }}
            >
                {this.props.schema.defaultSendTo && this.props.schema.button ? (
                    <Grid2
                        container
                        style={{ width: '100%' }}
                    >
                        <Grid2 flex={1}>{renderedItem}</Grid2>
                        <Grid2>
                            <Button
                                disabled={disabled}
                                variant="outlined"
                                onClick={() => this.sendTo()}
                                title={
                                    this.props.schema.buttonTooltip
                                        ? this.getText(
                                              this.props.schema.buttonTooltip,
                                              this.props.schema.buttonTooltipNoTranslation,
                                          )
                                        : I18n.t('ra_Request data by instance')
                                }
                            >
                                {this.getText(this.props.schema.button as ioBroker.StringOrTranslated)}
                            </Button>
                        </Grid2>
                    </Grid2>
                ) : (
                    renderedItem
                )}
            </Grid2>
        );

        if (schema.newLine) {
            return (
                <>
                    <div style={{ flexBasis: '100%', height: 0 }} />
                    {this.renderDialogConfirm()}
                    {item}
                </>
            );
        }
        if (this.state.confirmDialog) {
            return (
                <>
                    {this.renderDialogConfirm()}
                    {item}
                </>
            );
        }
        return item;
    }
}
