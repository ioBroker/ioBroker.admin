import React, { Component, type JSX } from 'react';

import { LinearProgress } from '@mui/material';

import { type AdminConnection, I18n, type ThemeName, type ThemeType, type IobTheme } from '@iobroker/adapter-react-v5';

import type { BackEndCommand, ConfigItemPanel, ConfigItemTabs, JsonConfigContext } from '#JC/types';
import type ConfigGeneric from '#JC/JsonConfigComponent/ConfigGeneric';
// eslint-disable-next-line no-duplicate-imports
import { type DeviceManagerPropsProps } from '#JC/JsonConfigComponent/ConfigGeneric';
import ConfigTabs from './ConfigTabs';
import ConfigPanel from './ConfigPanel';

const styles: Record<string, React.CSSProperties> = {
    root: {
        width: '100%',
        height: '100%',
    },
};

interface JsonConfigComponentProps {
    socket: AdminConnection;
    themeName: ThemeName;
    themeType: ThemeType;
    adapterName: string;
    instance: number;
    isFloatComma: boolean;
    dateFormat: string;
    imagePrefix?: string;
    schema: ConfigItemTabs | ConfigItemPanel;
    common?: Record<string, any>;
    data: Record<string, any>;
    updateData?: number;
    onError: (error: boolean) => void;
    onChange?: (data: Record<string, any>, changed: boolean, saveConfig: boolean) => void;
    /** Backend request to refresh data */
    onBackEndCommand?: (command?: BackEndCommand) => void;
    custom?: boolean;
    onValueChange?: (attr: string, value: any, saveConfig: boolean) => void;
    embedded?: boolean;
    multiEdit?: boolean;
    instanceObj?: ioBroker.InstanceObject;
    customObj?: ioBroker.Object;
    customs?: Record<string, typeof ConfigGeneric>;
    DeviceManager?: React.FC<DeviceManagerPropsProps>;
    style?: React.CSSProperties;
    theme: IobTheme;
    expertMode?: boolean;
}

interface JsonConfigComponentState {
    originalData: string;
    changed: boolean;
    errors: Record<string, string>;
    systemConfig: ioBroker.SystemConfigCommon | null;
    updateData?: number;
    alive: boolean;
    commandRunning: boolean;
    schema: ConfigItemTabs | ConfigItemPanel;
}

export class JsonConfigComponent extends Component<JsonConfigComponentProps, JsonConfigComponentState> {
    private readonly forceUpdateHandlers: Record<string, (data: any) => void>;

    private errorTimeout: ReturnType<typeof setTimeout> | null = null;

    private errorCached: Record<string, string> | null = null;

    private oContext: JsonConfigContext;

    constructor(props: JsonConfigComponentProps) {
        super(props);

        this.state = {
            originalData: JSON.stringify(this.props.data),
            changed: false,
            errors: {},
            updateData: this.props.updateData || 0,
            systemConfig: null,
            alive: false,
            commandRunning: false,
            schema: JSON.parse(JSON.stringify(this.props.schema)),
        };

        this.forceUpdateHandlers = {};

        this.buildDependencies(this.state.schema);

        this.readData();
    }

    static getDerivedStateFromProps(
        props: JsonConfigComponentProps,
        state: JsonConfigComponentState,
    ): Partial<JsonConfigComponentState> | null {
        if (props.updateData !== state.updateData) {
            return {
                updateData: props.updateData,
                originalData: JSON.stringify(props.data),
                schema: JSON.parse(JSON.stringify(props.schema)),
            };
        }
        return null;
    }

    static async loadI18n(
        socket: AdminConnection,
        i18n: boolean | string | Record<string, Record<ioBroker.Languages, string>>,
        adapterName: string,
    ): Promise<string> {
        if (i18n === true || (i18n && typeof i18n === 'string')) {
            const lang = I18n.getLanguage();
            const path = typeof i18n === 'string' ? i18n : 'i18n';
            let exists = await socket.fileExists(`${adapterName}.admin`, `${path}/${lang}.json`);
            let fileName;
            if (exists) {
                fileName = `${path}/${lang}.json`;
            } else {
                exists = await socket.fileExists(`${adapterName}.admin`, `${path}/${lang}/translations.json`);
                if (exists) {
                    fileName = `${path}/${lang}/translations.json`;
                } else if (lang !== 'en') {
                    // fallback to english
                    exists = await socket.fileExists(`${adapterName}.admin`, `${path}/en.json`);
                    if (exists) {
                        fileName = `${path}/en.json`;
                    } else {
                        exists = await socket.fileExists(`${adapterName}.admin`, `${path}/en/translations.json`);
                        if (exists) {
                            fileName = `${path}/en/translations.json`;
                        }
                    }
                }
            }

            if (fileName) {
                const jsonFile = await socket.readFile(`${adapterName}.admin`, fileName);
                let jsonStr: string;
                if (jsonFile.file !== undefined) {
                    jsonStr = jsonFile.file;
                } else {
                    // @ts-expect-error deprecated
                    jsonStr = jsonFile;
                }

                try {
                    const json = JSON.parse(jsonStr);
                    // apply file to I18n
                    I18n.extendTranslations(json, lang);
                } catch (e) {
                    console.error(`Cannot parse language file "${adapterName}.admin/${fileName}: ${e}`);
                    return '';
                }
                return fileName;
            }
            console.warn(`Cannot find i18n for ${adapterName} / ${fileName}`);
            return '';
        }
        if (i18n && typeof i18n === 'object') {
            I18n.extendTranslations(i18n);
            return '';
        }
        return '';
    }

    onCommandRunning = (commandRunning: boolean): void => this.setState({ commandRunning });

    readData(): void {
        void this.props.socket
            .getCompactSystemConfig()
            .then(systemConfig =>
                this.props.socket
                    .getState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`)
                    .then(state =>
                        this.setState({ systemConfig: systemConfig.common, alive: !!(state && state.val) }, () => {
                            this.updateContext(true);
                            if (!this.props.custom) {
                                void this.props.socket.subscribeState(
                                    `system.adapter.${this.props.adapterName}.${this.props.instance}.alive`,
                                    this.onAlive,
                                );
                            }
                        }),
                    ),
            )
            .catch(e => console.error(`Cannot read system config: ${e}`));
    }

    onAlive = (_id: string, state?: ioBroker.State | null): void => {
        if (!!state?.val !== this.state.alive) {
            this.setState({ alive: !!state?.val });
        }
    };

    onChange = (attrOrData: string | Record<string, any>, value: any, cb?: () => void, saveConfig?: boolean): void => {
        if (this.props.onValueChange) {
            this.props.onValueChange(attrOrData as string, value, saveConfig);
            if (cb) {
                cb();
            }
        } else if (attrOrData && this.props.onChange) {
            const newState: Partial<JsonConfigComponentState> = {
                changed: JSON.stringify(attrOrData) !== this.state.originalData,
            };

            this.setState(newState as JsonConfigComponentState, () => {
                this.props.onChange(attrOrData as Record<string, any>, newState.changed, saveConfig);
                if (cb) {
                    cb();
                }
            });
        } else if (saveConfig) {
            this.props.onChange(null, null, saveConfig);
        }
    };

    onError = (attr: string, error?: string): void => {
        this.errorCached = this.errorCached || JSON.parse(JSON.stringify(this.state.errors));
        const errors = this.errorCached;
        if (error) {
            errors[attr] = error;
        } else {
            delete errors[attr];
        }

        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        if (JSON.stringify(errors) !== JSON.stringify(this.state.errors)) {
            this.errorTimeout = setTimeout(
                () =>
                    this.setState({ errors: this.errorCached }, () => {
                        this.errorTimeout = null;
                        this.errorCached = null;
                        this.props.onError(!!Object.keys(this.state.errors).length);
                    }),
                50,
            );
        } else {
            this.errorCached = null;
        }
    };

    flatten(schema: Record<string, any>, _list?: Record<string, any>): Record<string, any> {
        _list = _list || {};
        if (schema.items) {
            Object.keys(schema.items).forEach(attr => {
                _list[attr] = schema.items[attr];
                this.flatten(schema.items[attr], _list);
            });
        }

        return _list;
    }

    buildDependencies(schema: ConfigItemTabs | ConfigItemPanel): void {
        const attrs = this.flatten(schema as Record<string, any>);
        Object.keys(attrs).forEach(attr => {
            if (attrs[attr].confirm?.alsoDependsOn) {
                attrs[attr].confirm?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(
                                `[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`,
                            );
                        }
                    } else {
                        attrs[dep].confirmDependsOn = attrs[dep].confirmDependsOn || [];

                        const depObj = { ...attrs[attr], attr };
                        if (depObj.confirm) {
                            depObj.confirm.cancel = 'Undo';
                        }

                        attrs[dep].confirmDependsOn.push(depObj);
                    }
                });
            }

            if (attrs[attr].onChange?.alsoDependsOn) {
                attrs[attr].onChange?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(
                                `[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`,
                            );
                        }
                    } else {
                        attrs[dep].onChangeDependsOn = attrs[dep].onChangeDependsOn || [];

                        const depObj = { ...attrs[attr], attr };

                        attrs[dep].onChangeDependsOn.push(depObj);
                    }
                });
            }

            if (attrs[attr].hidden?.alsoDependsOn) {
                attrs[attr].hidden?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(
                                `[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`,
                            );
                        }
                    } else {
                        attrs[dep].hiddenDependsOn = attrs[dep].hiddenDependsOn || [];

                        const depObj = { ...attrs[attr], attr };

                        attrs[dep].hiddenDependsOn.push(depObj);
                    }
                });
            }

            if (attrs[attr].label?.alsoDependsOn) {
                attrs[attr].label?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(
                                `[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`,
                            );
                        }
                    } else {
                        attrs[dep].labelDependsOn = attrs[dep].labelDependsOn || [];

                        const depObj = { ...attrs[attr], attr };

                        attrs[dep].labelDependsOn.push(depObj);
                    }
                });
            }

            if (attrs[attr].help?.alsoDependsOn) {
                attrs[attr].help?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(
                                `[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`,
                            );
                        }
                    } else {
                        attrs[dep].helpDependsOn = attrs[dep].helpDependsOn || [];

                        const depObj = { ...attrs[attr], attr };

                        attrs[dep].helpDependsOn.push(depObj);
                    }
                });
            }
        });
    }

    updateContext(forceUpdate?: boolean): void {
        this.oContext = {
            DeviceManager: this.props.DeviceManager,
            adapterName: this.props.adapterName,
            changeLanguage: this.changeLanguage,
            common: this.props.common,
            customs: this.props.customs,
            dateFormat: this.props.dateFormat,
            embedded: this.props.embedded,
            expertMode: this.props.expertMode,
            forceUpdate: this.forceAttrUpdate,
            imagePrefix: this.props.imagePrefix,
            instance: this.props.instance,
            instanceObj: this.props.instanceObj,
            isFloatComma: this.props.isFloatComma,
            multiEdit: this.props.multiEdit,
            onBackEndCommand: this.props.onBackEndCommand,
            onCommandRunning: this.onCommandRunning,
            onValueChange: this.props.onValueChange,
            registerOnForceUpdate: this.registerOnForceUpdate,
            socket: this.props.socket,
            systemConfig: this.state.systemConfig,
            theme: this.props.theme,
            // could be changed dynamically
            themeType: this.props.themeType,
            _themeName: this.props.themeName,
            updateData: this.state.updateData,
        } as JsonConfigContext;

        if (forceUpdate) {
            this.forceUpdate();
        }
    }

    renderItem(item: ConfigItemTabs | ConfigItemPanel): JSX.Element | null {
        if (item.type === 'tabs') {
            return (
                <ConfigTabs
                    oContext={this.oContext}
                    alive={this.state.alive}
                    changed={this.state.changed}
                    commandRunning={this.state.commandRunning}
                    common={this.props.common}
                    custom={this.props.custom}
                    customObj={this.props.customObj}
                    data={this.props.data}
                    onChange={this.onChange}
                    onError={(attr, error) => this.onError(attr, error)}
                    originalData={JSON.parse(this.state.originalData)}
                    root
                    schema={item}
                    themeName={this.props.themeName}
                />
            );
        }
        if (
            item.type === 'panel' ||
            // @ts-expect-error type could be empty
            !item.type
        ) {
            return (
                <ConfigPanel
                    oContext={this.oContext}
                    alive={this.state.alive}
                    changed={this.state.changed}
                    commandRunning={this.state.commandRunning}
                    common={this.props.common}
                    custom={this.props.custom}
                    customObj={this.props.customObj}
                    data={this.props.data}
                    index={1000}
                    isParentTab={!this.props.embedded}
                    onChange={this.onChange}
                    onError={(attr, error) => this.onError(attr, error)}
                    originalData={JSON.parse(this.state.originalData)}
                    root
                    schema={item}
                    themeName={this.props.themeName}
                />
            );
        }
        console.error(`Unknown item type in root: ${JSON.stringify(item)}`);

        return null;
    }

    changeLanguage = (): void => {
        this.forceUpdate();
    };

    forceAttrUpdate = (attr: string | string[], data: any): void => {
        if (Array.isArray(attr)) {
            attr.forEach(a => this.forceUpdateHandlers[a] && this.forceUpdateHandlers[a](data));
        } else if (this.forceUpdateHandlers[attr]) {
            this.forceUpdateHandlers[attr](data);
        }
    };

    registerOnForceUpdate = (attr: string, cb?: ((data: any) => void) | null): void => {
        if (cb) {
            this.forceUpdateHandlers[attr] = cb;
        } else if (this.forceUpdateHandlers[attr]) {
            delete this.forceUpdateHandlers[attr];
        }
    };

    render(): JSX.Element {
        if (!this.state.systemConfig || !this.oContext) {
            return <LinearProgress />;
        }

        if (this.oContext._themeName !== this.props.themeName) {
            this.oContext._themeName = this.props.themeName;
            setTimeout(() => this.updateContext(true), 0);
        }

        return (
            <div
                style={{
                    ...(!this.props.embedded ? styles.root : undefined),
                    ...this.props.style,
                    ...this.state.schema.style,
                }}
            >
                {this.renderItem(this.state.schema)}
            </div>
        );
    }
}

export default JsonConfigComponent;
