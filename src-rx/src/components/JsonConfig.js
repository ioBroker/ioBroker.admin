import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import LinearProgress from '@material-ui/core/LinearProgress';

import SaveCloseButtons from '@iobroker/adapter-react/Components/SaveCloseButtons';
import Router from '@iobroker/adapter-react/Components/Router';
import theme from '@iobroker/adapter-react/Theme';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';
import I18n from '@iobroker/adapter-react/i18n';

import JsonConfigComponent from './JsonConfigComponent';
import ConfigCustomEasyAccess from './JsonConfigComponent/ConfigCustomEasyAccess';

const styles = {
    scroll: {
        height: 'calc(100% - 48px - 48px)',
        overflowY: 'auto'
    }
};

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

class JsonConfig extends Router {
    constructor(props) {
        super(props);

        this.state = {
            schema: null,
            data: null,
            common: null,
            changed: false,
            confirmDialog: false,
            theme: theme(props.themeName), // buttons requires special theme
        };

        this.getInstanceObject()
            .then(obj => this.getConfigFile()
                .then(schema =>
                    // load language
                    this.loadI18n(schema.i18n)
                        .then(() =>
                            this.setState({schema, data: obj.native, common: obj.common}))));
    }

    loadI18n(i18n) {
        if (i18n === true) {
            const lang = I18n.getLanguage();
            return this.props.socket.fileExists(this.props.adapterName + '.admin', `i18n/${lang}.json`)
                .then(exists => {
                    if (exists) {
                        return `i18n/${lang}.json`;
                    } else {
                        return this.props.socket.fileExists(this.props.adapterName + '.admin', `i18n/${lang}/translations.json`)
                            .then(exists =>
                                exists ? `i18n/${lang}/translations.json` : '')
                    }
                })
                .then(fileName => {
                    return fileName && this.props.socket.readFile(this.props.adapterName + '.admin', fileName)
                        .then(json => {
                            try {
                                json = JSON.parse(json);
                                // apply file to I18n
                                I18n.extendTranslations(json, lang);
                            } catch (e) {
                                console.error(`Cannot parse language file "${this.props.adapterName}.admin/${fileName}: ${e}`);
                            }
                        })
                });
        } else if (i18n && typeof i18n === 'object') {
            I18n.extendTranslations(i18n);
        } else {
            return Promise.resolve();
        }
    }

    getConfigFile() {
        return this.props.socket.readFile(this.props.adapterName + '.admin', 'jsonConfig.json')
            .then(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    window.alert('Cannot parse json config!');
                }
            });
    }

    getInstanceObject() {
        return this.props.socket.getObject(`system.adapter.${this.props.adapterName}.${this.props.instance}`);
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

    async closeDialog(doSave) {
        if (doSave) {
            const obj = await this.getInstanceObject();

            for (const a in this.state.data) {
                if (this.state.data.hasOwnProperty(a)) {
                    obj.native[a] = this.state.data[a];
                }
            }

            await this.props.socket.setObject(obj._id, obj);
        } else {
            if (this.state.changed) {
                return this.setState({confirmDialog: true});
            } else {
                Router.doNavigate(null);
            }
        }
    }

    render() {
        const { classes } = this.props;

        if (!this.state.data || !this.state.schema) {
            return <LinearProgress />;
        }

        return <>
            {this.renderConfirmDialog()}
            <JsonConfigComponent
                className={ classes.scroll }
                socket={this.props.socket}
                theme={this.props.theme}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                adapterName={this.props.adapterName}
                instance={this.props.instance}

                schema={this.state.schema}
                common={this.state.common}
                data={this.state.data}
                onError={error => this.setState({ error })}
                onChange={(data, changed) => this.setState({ data, changed })}

                customs={{
                    configCustomEasyAccess: ConfigCustomEasyAccess
                }}
            />
            <SaveCloseButtons
                dense={true}
                paddingLeft={this.props.menuPadding}
                theme={this.state.theme}
                noTextOnButtons={this.props.width === 'xs' || this.props.width === 'sm' || this.props.width === 'md'}
                changed={!this.state.error && this.state.changed}
                error={this.state.error}
                onSave={() => this.closeDialog(true)}
                onClose={() => this.closeDialog(false)}
            />
        </>;
    }
}

JsonConfig.propTypes = {
    menuPadding: PropTypes.number,
    adapterName: PropTypes.string,
    instance: PropTypes.number,

    socket: PropTypes.object,

    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
};

export default withStyles(styles)(JsonConfig);