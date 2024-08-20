import React, { Component } from 'react';

import { LinearProgress } from '@mui/material';

import {
    type AdminConnection,
    I18n,
    type ThemeName,
    type ThemeType,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

import type { ConfigItemPanel, ConfigItemTabs } from '#JC/types';
import ConfigGeneric, { type DeviceManagerPropsProps } from '#JC/JsonConfigComponent/ConfigGeneric';
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
    data: Record<string, any> | null;
}

export class JsonConfigComponent extends Component<JsonConfigComponentProps, JsonConfigComponentState> {
    private readonly forceUpdateHandlers: Record<string, (data: any) => void>;

    private errorTimeout: ReturnType<typeof setTimeout> | null = null;

    private errorCached: Record<string, string> | null = null;

    constructor(props: JsonConfigComponentProps) {
        super(props);

        this.state = {
            originalData: JSON.stringify(this.props.data),
            // eslint-disable-next-line react/no-unused-state
            changed: false,
            errors: {},
            updateData: this.props.updateData || 0,
            systemConfig: null,
            alive: false,
            commandRunning: false,
            schema: JSON.parse(JSON.stringify(this.props.schema)),
            data: null,
        };

        this.forceUpdateHandlers = {};

        this.buildDependencies(this.state.schema);

        this.readData();
    }

    static getDerivedStateFromProps(props: JsonConfigComponentProps, state: JsonConfigComponentState) {
        if (props.updateData !== state.updateData) {
            return {
                updateData: props.updateData,
                originalData: JSON.stringify(props.data),
                schema: JSON.parse(JSON.stringify(props.schema)),
            };
        }
        return null;
    }

    static async loadI18n(socket: AdminConnection, i18n: boolean | string | Record<string, Record<ioBroker.Languages, string>>, adapterName: string) {
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
        } if (i18n && typeof i18n === 'object') {
            I18n.extendTranslations(i18n);
            return '';
        }
        return '';
    }

    onCommandRunning = (commandRunning: boolean) => this.setState({ commandRunning });

    async readSettings() : Promise<void> {
        if ((this.props.custom || this.props.common) && this.props.data) {
            return;
        }
        const obj = await this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`);
        // eslint-disable-next-line react/no-unused-state
        this.setState({ data: this.props.data || obj.native });
    }

    readData() {
        this.readSettings()
            .then(() => this.props.socket.getCompactSystemConfig())
            .then(systemConfig =>
                this.props.socket.getState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`)
                    .then(state => {
                        if (this.props.custom) {
                            this.setState({ systemConfig: systemConfig.common, alive: !!(state && state.val) });
                        } else {
                            this.setState({ systemConfig: systemConfig.common, alive: !!(state && state.val) }, () =>
                                this.props.socket.subscribeState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`, this.onAlive));
                        }
                    }));
    }

    onAlive = (id: string, state?: ioBroker.State | null) => {
        if (!!(state?.val) !== this.state.alive) {
            this.setState({ alive: !!state?.val });
        }
    };

    onChange = (attrOrData: string | Record<string, any>, value: any, cb?: () => void, saveConfig?: boolean) => {
        if (this.props.onValueChange) {
            this.props.onValueChange(attrOrData as string, value, saveConfig);
            cb && cb();
        } else if (attrOrData && this.props.onChange) {
            const newState: Partial<JsonConfigComponentState> = { data: attrOrData as Record<string, any> };

            newState.changed = JSON.stringify(attrOrData) !== this.state.originalData;

            this.setState(newState as JsonConfigComponentState, () => {
                this.props.onChange(attrOrData as Record<string, any>, newState.changed, saveConfig);
                cb && cb();
            });
        } else if (saveConfig) {
            this.props.onChange(null, null, saveConfig);
        }
    };

    onError = (attr: string, error?: string) => {
        this.errorCached = this.errorCached || JSON.parse(JSON.stringify(this.state.errors));
        const errors = this.errorCached;
        if (error) {
            errors[attr] = error;
        } else {
            delete errors[attr];
        }

        this.errorTimeout && clearTimeout(this.errorTimeout);
        if (JSON.stringify(errors) !== JSON.stringify(this.state.errors)) {
            this.errorTimeout = setTimeout(() =>
                this.setState({ errors: this.errorCached }, () => {
                    this.errorTimeout = null;
                    this.errorCached = null;
                    this.props.onError(!!Object.keys(this.state.errors).length);
                }), 50);
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

    buildDependencies(schema: ConfigItemTabs | ConfigItemPanel) {
        const attrs = this.flatten(schema as Record<string, any>);
        Object.keys(attrs).forEach(attr => {
            if (attrs[attr].confirm?.alsoDependsOn) {
                attrs[attr].confirm?.alsoDependsOn.forEach((dep: string) => {
                    if (!attrs[dep]) {
                        console.error(`[JsonConfigComponent] Attribute ${dep} does not exist!`);
                        if (dep.startsWith('data.')) {
                            console.warn(`[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`);
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
                            console.warn(`[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`);
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
                            console.warn(`[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`);
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
                            console.warn(`[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`);
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
                            console.warn(`[JsonConfigComponent] please use "${dep.replace(/^data\./, '')}" instead of "${dep}"`);
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

    renderItem(item: ConfigItemTabs | ConfigItemPanel) {
        if (item.type === 'tabs') {
            return <ConfigTabs
                DeviceManager={this.props.DeviceManager}
                adapterName={this.props.adapterName}
                alive={this.state.alive}
                changeLanguage={this.changeLanguage}
                changed={this.state.changed}
                commandRunning={this.state.commandRunning}
                common={this.props.common}
                custom={this.props.custom}
                customObj={this.props.customObj}
                customs={this.props.customs}
                data={this.props.data}
                dateFormat={this.props.dateFormat}
                forceUpdate={this.forceAttrUpdate}
                imagePrefix={this.props.imagePrefix}
                instance={this.props.instance}
                instanceObj={this.props.instanceObj}
                isFloatComma={this.props.isFloatComma}
                multiEdit={this.props.multiEdit}
                onChange={this.onChange}
                onCommandRunning={this.onCommandRunning}
                onError={(attr, error) => this.onError(attr, error)}
                originalData={JSON.parse(this.state.originalData)}
                registerOnForceUpdate={this.registerOnForceUpdate}
                root
                schema={item as ConfigItemTabs}
                socket={this.props.socket}
                systemConfig={this.state.systemConfig}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
            />;
        }
        if (item.type === 'panel' ||
            // @ts-expect-error type could be empty
            !item.type
        ) {
            return <ConfigPanel
                DeviceManager={this.props.DeviceManager}
                adapterName={this.props.adapterName}
                alive={this.state.alive}
                changeLanguage={this.changeLanguage}
                changed={this.state.changed}
                commandRunning={this.state.commandRunning}
                common={this.props.common}
                custom={this.props.custom}
                customObj={this.props.customObj}
                customs={this.props.customs}
                data={this.props.data}
                dateFormat={this.props.dateFormat}
                forceUpdate={this.forceAttrUpdate}
                imagePrefix={this.props.imagePrefix}
                index={1000}
                instance={this.props.instance}
                instanceObj={this.props.instanceObj}
                isFloatComma={this.props.isFloatComma}
                isParentTab={!this.props.embedded}
                multiEdit={this.props.multiEdit}
                onChange={this.onChange}
                onCommandRunning={this.onCommandRunning}
                onError={(attr, error) => this.onError(attr, error)}
                originalData={JSON.parse(this.state.originalData)}
                registerOnForceUpdate={this.registerOnForceUpdate}
                root
                schema={item as ConfigItemPanel}
                socket={this.props.socket}
                systemConfig={this.state.systemConfig}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
            />;
        }

        return null;
    }

    changeLanguage = () => {
        this.forceUpdate();
    };

    forceAttrUpdate = (attr: string | string[], data: any) => {
        if (Array.isArray(attr)) {
            attr.forEach(a =>
                this.forceUpdateHandlers[a] && this.forceUpdateHandlers[a](data));
        } else if (this.forceUpdateHandlers[attr]) {
            this.forceUpdateHandlers[attr](data);
        }
    };

    registerOnForceUpdate = (attr: string, cb: (data: any) => void) => {
        if (cb) {
            this.forceUpdateHandlers[attr] = cb;
        } else if (this.forceUpdateHandlers[attr]) {
            delete this.forceUpdateHandlers[attr];
        }
    };

    render() {
        if (!this.state.systemConfig) {
            return <LinearProgress />;
        }

        return <div
            style={{
                ...(!this.props.embedded ? styles.root : undefined),
                ...this.props.style,
                ...this.state.schema.style,
            }}
        >
            {this.renderItem(this.state.schema)}
        </div>;
    }
}

export default JsonConfigComponent;
