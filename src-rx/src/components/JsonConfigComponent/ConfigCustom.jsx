import React, { Component } from 'react';
import PropTypes from 'prop-types';

import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import i18n from '@iobroker/adapter-react-v5/i18n';

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
        if (this.props.schema.url.startsWith('http:') || this.props.schema.url.startsWith('https:')) {
            url = this.props.schema.url;
        } else if (this.props.schema.url.startsWith('./')) {
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
            const lang = i18n.getLanguage();
            const file = `${i18nURL}/i18n/${lang}.json`;

            await fetch(file)
                .then(data => data.json())
                .then(json => i18n.extendTranslations(json, lang))
                .catch(error => console.log(`Cannot load i18n "${file}": ${error}`));
        } else if (this.props.schema.i18n && typeof this.props.schema.i18n === 'object') {
            try {
                i18n.extendTranslations(this.props.schema.i18n);
            } catch (error) {
                console.error(`Cannot import i18n: ${error}`);
            }
        }

        try {
            const [uniqueName, fileToLoad, ...componentName] = this.props.schema.name.split('/');
            console.log(uniqueName, fileToLoad, componentName.join('/'));
            const component = await window.importFederation(uniqueName, {url, format: 'esm', from: 'vite'}, fileToLoad);

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
                return ;
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