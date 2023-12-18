import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import LinearProgress from '@mui/material/LinearProgress';

import I18n from './wrapper/i18n';

import ConfigTabs from './ConfigTabs';
import ConfigPanel from './ConfigPanel';

const styles = () => ({
    root: {
        width: '100%',
        height: '100%',
    },
});

class JsonConfigComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            originalData: JSON.stringify(this.props.data),
            // eslint-disable-next-line react/no-unused-state
            changed: false,
            errors: {},
            updateData: this.props.updateData,
            systemConfig: null,
            alive: false,
            commandRunning: false,
            schema: JSON.parse(JSON.stringify(this.props.schema)),
        };

        this.forceUpdateHandlers = {};

        this.buildDependencies(this.state.schema);

        this.readData();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.updateData !== state.updateData) {
            return {
                updateData: props.updateData,
                originalData: JSON.stringify(props.data),
                schema: JSON.parse(JSON.stringify(props.schema)),
            };
        }
        return null;
    }

    static async loadI18n(socket, i18n, adapterName) {
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
                let json = await socket.readFile(`${adapterName}.admin`, fileName);
                if (json.file !== undefined) {
                    json = json.file;
                }
                try {
                    json = JSON.parse(json);
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

    onCommandRunning = commandRunning => this.setState({ commandRunning });

    readSettings() {
        if ((this.props.custom || this.props.common) && this.props.data) {
            return Promise.resolve();
        }
        return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
            // eslint-disable-next-line react/no-unused-state
            .then(obj => this.setState({ common: obj.common, data: this.props.data || obj.native }));
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

    onAlive = (id, state) => {
        if ((state?.val || false) !== this.state.alive) {
            this.setState({ alive: state?.val || false });
        }
    };

    onChange = (data, value, cb, saveConfig) => {
        if (this.props.onValueChange) {
            this.props.onValueChange(data, value, saveConfig);
            cb && cb();
        } else if (data) {
            const newState = { data };

            newState.changed = JSON.stringify(data) !== this.state.originalData;

            this.setState(newState, () => {
                this.props.onChange(data, newState.changed, saveConfig);
                cb && cb();
            });
        } else if (saveConfig) {
            this.props.onChange(null, null, saveConfig);
        }
    };

    onError = (attr, error) => {
        this.errorChached = this.errorChached || JSON.parse(JSON.stringify(this.state.errors));
        const errors = this.errorChached;
        if (error) {
            errors[attr] = error;
        } else {
            delete errors[attr];
        }

        this.errorTimeout && clearTimeout(this.errorTimeout);
        if (JSON.stringify(errors) !== JSON.stringify(this.state.errors)) {
            this.errorTimeout = setTimeout(() =>
                this.setState({ errors: this.errorChached }, () => {
                    this.errorTimeout = null;
                    this.errorChached = null;
                    this.props.onError(!!Object.keys(this.state.errors).length);
                }), 50);
        } else {
            this.errorChached = null;
        }
    };

    flatten(schema, _list) {
        _list = _list || {};
        if (schema.items) {
            Object.keys(schema.items).forEach(attr => {
                _list[attr] = schema.items[attr];
                this.flatten(schema.items[attr], _list);
            });
        }

        return _list;
    }

    buildDependencies(schema) {
        const attrs = this.flatten(schema);
        Object.keys(attrs).forEach(attr => {
            if (attrs[attr].confirm?.alsoDependsOn) {
                attrs[attr].confirm?.alsoDependsOn.forEach(dep => {
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
                attrs[attr].onChange?.alsoDependsOn.forEach(dep => {
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
                attrs[attr].hidden?.alsoDependsOn.forEach(dep => {
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
                attrs[attr].label?.alsoDependsOn.forEach(dep => {
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
                attrs[attr].help?.alsoDependsOn.forEach(dep => {
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

    renderItem(item) {
        if (item.type === 'tabs') {
            return <ConfigTabs
                onCommandRunning={this.onCommandRunning}
                commandRunning={this.state.commandRunning}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                alive={this.state.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                originalData={JSON.parse(this.state.originalData)}
                schema={item}
                systemConfig={this.state.systemConfig}
                customs={this.props.customs}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                multiEdit={this.props.multiEdit}
                imagePrefix={this.props.imagePrefix}
                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                changeLanguage={this.changeLanguage}
                forceUpdate={this.forceAttrUpdate}
                registerOnForceUpdate={this.registerOnForceUpdate}
                onChange={this.onChange}
                changed={this.state.changed}
                onError={(attr, error) => this.onError(attr, error)}
            />;
        }
        if (item.type === 'panel' || !item.type) {
            return <ConfigPanel
                index={1000}
                isParentTab={!this.props.embedded}
                changed={this.state.changed}
                onCommandRunning={this.onCommandRunning}
                commandRunning={this.state.commandRunning}
                socket={this.props.socket}
                adapterName={this.props.adapterName}
                instance={this.props.instance}
                common={this.props.common}
                alive={this.state.alive}
                themeType={this.props.themeType}
                themeName={this.props.themeName}
                data={this.props.data}
                originalData={JSON.parse(this.state.originalData)}
                schema={item}
                systemConfig={this.state.systemConfig}
                customs={this.props.customs}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                multiEdit={this.props.multiEdit}
                imagePrefix={this.props.imagePrefix}
                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}
                changeLanguage={this.changeLanguage}
                forceUpdate={this.forceAttrUpdate}
                registerOnForceUpdate={this.registerOnForceUpdate}
                onChange={this.onChange}
                onError={(attr, error) => this.onError(attr, error)}
            />;
        }

        return null;
    }

    changeLanguage = () => {
        this.forceUpdate();
    };

    forceAttrUpdate = (attr, data) => {
        if (Array.isArray(attr)) {
            attr.forEach(a =>
                this.forceUpdateHandlers[a] && this.forceUpdateHandlers[a](data));
        } else if (this.forceUpdateHandlers[attr]) {
            this.forceUpdateHandlers[attr](data);
        }
    };

    registerOnForceUpdate = (attr, cb) => {
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

        return <div className={!this.props.embedded && this.props.classes.root} style={this.state.schema.style}>
            {this.renderItem(this.state.schema)}
        </div>;
    }
}

JsonConfigComponent.propTypes = {
    socket: PropTypes.object.isRequired,

    adapterName: PropTypes.string,
    instance: PropTypes.number,
    common: PropTypes.object,
    customs: PropTypes.object, // custom components

    custom: PropTypes.bool, // is the customs settings must be shown
    customObj: PropTypes.object,
    multiEdit: PropTypes.bool, // set if user edits more than one object simultaneously
    instanceObj: PropTypes.object,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,
    imagePrefix: PropTypes.string,

    themeType: PropTypes.string,
    themeName: PropTypes.string,
    data: PropTypes.object.isRequired,
    updateData: PropTypes.number,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    onValueChange: PropTypes.func,
    embedded: PropTypes.bool, // Config is embedded in other component, like dialog or what else
};

export default withStyles(styles)(JsonConfigComponent);
