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
            .then(() => this.props.socket.getSystemConfig())
            .then(systemConfig => {
                if (this.props.custom) {
                    this.setState({systemConfig: systemConfig.common});
                } else {
                    this.setState({systemConfig: systemConfig.common}, () =>
                        this.props.socket.subscribeState(`system.adapter.${this.props.adapterName}.${this.props.instance}.alive`, this.onAlive));
                }
            });
    }

    onAlive = (id, state) => {
        if ((state?.val || false) !== this.state.alive) {
            this.setState({alive: state?.val || false});
        }
    }

    onChange = (data, value) => {
        if (this.props.onValueChange) {
            this.props.onValueChange(data, value);
        } else {
            const state = {data};
            state.changed = JSON.stringify(data) !== this.state.originalData;

            this.setState({state}, () =>
                this.props.onChange(data, state.changed));
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
            })
        }

        return _list;
    }

    buildDependencies(schema) {
        const attrs = this.flatten(schema);
        Object.keys(attrs).forEach(attr => {
            if (attrs[attr].confirm?.alsoDependsOn) {
                attrs[attr].confirm?.alsoDependsOn.forEach(dep => {
                    attrs[dep].depends = attrs[dep].depends || [];
                    const depObj = {...attrs[attr], attr};
                    if (depObj.confirm) {
                        depObj.confirm.cancel = 'Undo';
                    }

                    attrs[dep].depends.push(depObj);
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
                schema={item}
                systemConfig={this.state.systemConfig}
                customs={this.props.customs}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}

                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}

                onChange={this.onChange}
                onError={(attr, error) => this.onError(attr, error)}
            />;
        } else if (item.type === 'panel' || !item.type) {
            return <ConfigPanel
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
                schema={item}
                systemConfig={this.state.systemConfig}
                customs={this.props.customs}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}

                custom={this.props.custom}
                customObj={this.props.customObj}
                instanceObj={this.props.instanceObj}

                onChange={this.onChange}
                onError={(attr, error) => this.onError(attr, error)}
            />
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