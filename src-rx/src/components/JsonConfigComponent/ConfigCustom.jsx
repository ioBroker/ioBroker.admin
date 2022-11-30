import React, { Component } from 'react';
import PropTypes from 'prop-types';

import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';

import I18n from './wrapper/i18n';

const getOrLoadRemote = (remote, shareScope, remoteFallbackUrl = undefined) =>
    new Promise((resolve, reject) => {
    // check if remote exists on window
        if (!window[remote]) {
            // search dom to see if remote tag exists, but might still be loading (async)
            const existingRemote = document.querySelector(`script[data-webpack="${remote}"]`);
            // when remote is loaded.
            const onload = async () => {
                // check if it was initialized
                if (window[remote]) {
                    if (!window[remote].__initialized) {
                        // if share scope doesn't exist (like in webpack 4) then expect shareScope to be a manual object
                        if (typeof __webpack_share_scopes__ === 'undefined') {
                            // use default share scope object passed in manually
                            await window[remote].init(shareScope.default);
                        } else {
                            // otherwise, init share scope as usual
                            // eslint-disable-next-line
                            await window[remote].init(__webpack_share_scopes__[shareScope]);
                        }
                        // mark remote as initialized
                        window[remote].__initialized = true;
                    }
                } else {
                    console.error(`Cannot load ${remote}`);
                    return reject(`Cannot load ${remote}`);
                }
                // resolve promise so marking remote as loaded
                resolve(window[remote]);
            };

            if (existingRemote) {
                // if existing remote but not loaded, hook into its onload and wait for it to be ready
                existingRemote.onload = onload;
                existingRemote.onerror = reject;
                // check if remote fallback exists as param passed to function
                // TODO: should scan public config for a matching key if no override exists
            } else if (remoteFallbackUrl) {
                // inject remote if a fallback exists and call the same onload function
                const d = document;
                const script = d.createElement('script');
                script.type = 'text/javascript';
                // mark as data-webpack so runtime can track it internally
                script.setAttribute('data-webpack', `${remote}`);
                script.async = true;
                script.onerror = reject;
                script.onload = onload;
                script.src = remoteFallbackUrl;
                d.getElementsByTagName('head')[0].appendChild(script);
            } else {
                // no remote and no fallback exist, reject
                reject(`Cannot Find Remote ${remote} to inject`);
            }
        } else {
            // remote already instantiated, resolve
            resolve(window[remote]);
        }
    });

const loadComponent = (remote, sharedScope, module, url) => async () => {
    const container = await getOrLoadRemote(remote, sharedScope, url);
    const factory = await container.get(module);
    const Module = factory();
    return Module;
};

class ConfigCustom extends Component {
    constructor(props) {
        super(props);
        // schema.url - location of Widget
        // schema.name - Component name
        // schema.i18n - i18n

        this.state = {
            Component: null,
            error: '',
        };
    }

    // load component dynamically
    async componentDidMount() {
        if (!this.props.schema.url) {
            console.error('URL is empty. Cannot load custom component!');
            this.setState({ error: 'URL is empty. Cannot load custom component!' });
            return;
        }

        let url;
        /*if (this.props.schema.url.startsWith('http:') || this.props.schema.url.startsWith('https:')) {
            url = this.props.schema.url;
        } else */
        if (this.props.schema.url.startsWith('./')) {
            url = `${window.location.protocol}//${window.location.host}${this.props.schema.url.replace(/^\./, '')}`;
        } else {
            url = `${window.location.protocol}//${window.location.host}/adapter/${this.props.adapterName}/${this.props.schema.url}`;
        }

        if (this.props.schema.i18n === true) {
            // load i18n from files
            const pos = url.lastIndexOf('/');
            let i18nURL;
            if (pos !== -1) {
                i18nURL = url.substring(0, pos);
            } else {
                i18nURL = url;
            }
            const lang = I18n.getLanguage();
            const file = `${i18nURL}/i18n/${lang}.json`;

            await fetch(file)
                .then(data => data.json())
                .then(json => I18n.extendTranslations(json, lang))
                .catch(error => {
                    if (lang !== 'en') {
                        // try to load English
                        return fetch(`${i18nURL}/i18n/en.json`)
                            .then(data => data.json())
                            .then(json => I18n.extendTranslations(json, lang))
                            .catch(error => console.log(`Cannot load i18n "${file}": ${error}`));
                    } else {
                        console.log(`Cannot load i18n "${file}": ${error}`);
                    }
                });
        } else if (this.props.schema.i18n && typeof this.props.schema.i18n === 'object') {
            try {
                I18n.extendTranslations(this.props.schema.i18n);
            } catch (error) {
                console.error(`Cannot import i18n: ${error}`);
            }
        }

        try {
            const [uniqueName, fileToLoad, ...componentName] = this.props.schema.name.split('/');
            console.log(uniqueName, fileToLoad, componentName.join('/'));
            // const component = await window.importFederation(uniqueName, {url, format: 'esm', from: 'vite'}, fileToLoad);
            const component = (await loadComponent(uniqueName, 'default', `./${fileToLoad}`, url)()).default;

            if (!component || !component || !component[componentName.join('/')]) {
                const keys = Object.keys(component || {});
                console.error('URL is empty. Cannot load custom component!');
                this.setState({ error: `Component ${this.props.schema.name} not found in ${this.props.schema.url}. Found: ${keys.join(', ')}` });
            } else {
                this.setState({ Component: component[componentName.join('/')] });
            }
        } catch (error) {
            this.setState({ error: `Cannot import from ${this.props.schema.url}: ${error}` });
        }
    }

    render() {
        const Component = this.state.Component;

        // render temporary placeholder
        if (!Component) {
            if (this.state.error) {
                return;
            } else {
                const schema = this.props.schema || {};

                const item = <Grid
                    item
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={Object.assign({}, {
                        marginBottom: 0,
                        //marginRight: 8,
                        textAlign: 'left',
                        width: schema.type === 'divider' || schema.type === 'header' ? schema.width || '100%' : undefined
                    }, schema.style, this.props.themeType === 'dark' ? schema.darkStyle : {})}>
                    {this.state.error ? <div>{this.state.error}</div> : <LinearProgress />}
                </Grid>;

                if (schema.newLine) {
                    return <>
                        <div style={{ flexBasis: '100%', height: 0 }} />
                        {item}
                    </>;
                } else {
                    return item;
                }
            }
        }

        return <Component {...this.props} />;
    }
}

ConfigCustom.propTypes = {
    socket: PropTypes.object,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    attr: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default ConfigCustom;