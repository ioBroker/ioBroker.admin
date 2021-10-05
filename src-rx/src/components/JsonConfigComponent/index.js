import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigTabs from './ConfigTabs';
import ConfigPanel from './ConfigPanel';

const styles = theme => ({
    root: {
        width: '100%',
        height: '100%'
    }
});

// Todo: delete it after adapter-react 1.6.9
I18n.extendTranslations = I18n.extendTranslations || ((words, lang) => {
    try {
        if (!lang) {
            Object.keys(words).forEach(word => {
                Object.keys(words[word]).forEach(lang => {
                    if (!I18n.translations[lang]) {
                        console.warn(`Used unknown language: ${lang}`);
                    }
                    if (!I18n.translations[lang][word]) {
                        I18n.translations[lang][word] = words[word][lang];
                    } else if (I18n.translations[lang][word] !== words[word][lang]) {
                        console.warn(`Translation for word "${word}" in "${lang}" was ignored: existing = "${I18n.translations[lang][word]}", new = ${words[word][lang]}`);
                    }
                });
            });
        } else {
            if (!I18n.translations[lang]) {
                console.warn(`Used unknown language: ${lang}`);
            }
            I18n.translations[lang] = I18n.translations[lang] || {};
            Object.keys(words)
                .forEach(word => {
                    if (!I18n.translations[lang][word]) {
                        I18n.translations[lang][word] = words[word];
                    } else if (I18n.translations[lang][word] !== words[word]) {
                        console.warn(`Translation for word "${word}" in "${lang}" was ignored: existing = "${I18n.translations[lang][word]}", new = ${words[word]}`);
                    }
                });
        }
    } catch (e) {
        console.error(`Cannot apply translations: ${e}`);
    }
});

class JsonConfigComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            originalData: JSON.stringify(this.props.data),
            changed: false,
            errors: {

            },
            updateData: this.props.updateData,
            systemConfig: null,
            alive: false,
            commandRunning: false,
        };

        this.forceUpdateHandlers = {};

        this.schema = JSON.parse(JSON.stringify(this.props.schema));
        this.buildDependencies(this.schema);

        this.readData();
    }

    static getDerivedStateFromProps(props, state) {
        if (JSON.stringify(props.updateData) !== JSON.stringify(state.updateData)) {
            return {updateData: props.updateData, originalData: JSON.stringify(props.data)};
        } else {
            return null;
        }
    }

    static loadI18n(socket, i18n, adapterName) {
        if (i18n === true || (i18n && typeof i18n === 'string')) {
            const lang = I18n.getLanguage();
            const path = typeof i18n === 'string' ? i18n : 'i18n';
            return socket.fileExists(adapterName + '.admin', `${path}/${lang}.json`)
                .then(exists => {
                    if (exists) {
                        return `${path}/${lang}.json`;
                    } else {
                        return socket.fileExists(adapterName + '.admin', `${path}/${lang}/translations.json`)
                            .then(exists =>
                                exists ? `${path}/${lang}/translations.json` : '')
                    }
                })
                .then(fileName => {
                    if (fileName) {
                        return socket.readFile(adapterName + '.admin', fileName)
                            .then(json => {
                                if (json.file !== undefined) {
                                    json = json.file;
                                }
                                try {
                                    json = JSON.parse(json);
                                    // apply file to I18n
                                    I18n.extendTranslations(json, lang);
                                } catch (e) {
                                    console.error(`Cannot parse language file "${adapterName}.admin/${fileName}: ${e}`);
                                }
                            })
                    } else {
                        console.warn(`Cannot find i18n for ${adapterName} / ${fileName}`);
                        return Promise.resolve();
                    }
                });
        } else if (i18n && typeof i18n === 'object') {
            I18n.extendTranslations(i18n);
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }
    }

    onCommandRunning = commandRunning => this.setState( {commandRunning});

    readSettings() {
        if ((this.props.custom || this.props.common) && this.props.data) {
            return Promise.resolve();
        } else {
            return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`)
                .then(obj => this.setState({common: obj.common, data: this.props.data || obj.native}));
        }
    }

    readData() {
        this.readSettings()
            .then(() => this.props.socket.getCompactSystemConfig())
            .then(systemConfig =>
                this.props.socket.getState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`)
                    .then(state => {
                        if (this.props.custom) {
                            this.setState({systemConfig: systemConfig.common, alive: !!(state && state.val)});
                        } else {
                            this.setState({systemConfig: systemConfig.common, alive: !!(state && state.val)}, () =>
                                this.props.socket.subscribeState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`, this.onAlive));
                        }
                    }));
    }

    onAlive = (id, state) => {
        if ((state?.val || false) !== this.state.alive) {
            this.setState({alive: state?.val || false});
        }
    }

    onChange = (data, value, cb) => {
        if (this.props.onValueChange) {
            this.props.onValueChange(data, value);
            cb && cb();
        } else {
            const state = {data};

            const _data = {};
            // remove all attributes starting with "_"
            Object.keys(data).forEach(attr => !attr.startsWith('_') && (_data[attr] = data[attr]));

            state.changed = JSON.stringify(_data) !== this.state.originalData;

            this.setState({state}, () => {
                this.props.onChange(_data, state.changed);
                cb && cb();
            });
        }
    }

    onError = (attr, error) => {
        const errors = JSON.parse(JSON.stringify(this.state.errors));
        if (error) {
            errors[attr] = error;
        } else {
            delete errors[attr];
        }

        if (JSON.stringify(errors) !== JSON.parse(JSON.stringify(this.state.errors))) {
            this.setState({errors}, () =>
                this.props.onError(!!Object.keys(this.state.errors).length));
        }
    }

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

                        const depObj = {...attrs[attr], attr};
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

                        const depObj = {...attrs[attr], attr};

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

                        const depObj = {...attrs[attr], attr};

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

                        const depObj = {...attrs[attr], attr};

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

                        const depObj = {...attrs[attr], attr};

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

                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}

                forceUpdate={this.forceUpdate}
                registerOnForceUpdate={this.registerOnForceUpdate}

                onChange={this.onChange}
                onError={(attr, error) => this.onError(attr, error)}
            />;
        } else if (item.type === 'panel' || !item.type) {
            return <ConfigPanel
                isParentTab={true}
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

                forceUpdate={this.forceUpdate}
                registerOnForceUpdate={this.registerOnForceUpdate}

                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}

                onChange={this.onChange}
                onError={(attr, error) => this.onError(attr, error)}
            />
        }
    }

    forceUpdate = (attr, data) => {
        if (Array.isArray(attr)) {
            attr.forEach(a =>
                this.forceUpdateHandlers[a] && this.forceUpdateHandlers[a](data));
        } else {
            if (this.forceUpdateHandlers[attr]) {
                this.forceUpdateHandlers[attr](data);
            }
        }
    }

    registerOnForceUpdate = (attr, cb) => {
        if (cb) {
            this.forceUpdateHandlers[attr] = cb;
        } else if (this.forceUpdateHandlers[attr]) {
            delete this.forceUpdateHandlers[attr];
        }
    }

    render() {
        if (!this.state.systemConfig) {
            return <LinearProgress />;
        }

        return <div className={this.props.classes.root}>
            {this.renderItem(this.schema)}
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

    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    updateData: PropTypes.number,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    onValueChange: PropTypes.func,
};

export default withStyles(styles)(JsonConfigComponent);