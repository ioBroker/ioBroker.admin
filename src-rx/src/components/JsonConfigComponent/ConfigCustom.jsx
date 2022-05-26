import React, { Component } from 'react';
import PropTypes from 'prop-types';

import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';

class ConfigCustom extends Component {
    constructor(props) {
        super(props);
        // schema.url - location of Widget
        // schema.name - Component name

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

        // custom component always has constant name
        try {
            const component = await window.importFederation(
                this.props.schema.name.split('/')[0],
                {url, format: 'esm', from: 'vite'},
                this.props.schema.name.split('/')[1]
            );
            const componentName = this.props.schema.name.split('/').pop();

            if (!component || !component || !component[componentName]) {
                const keys = Object.keys(component || {});
                console.error('URL is empty. Cannot load custom component!');
                this.setState({ error: `Component ${this.props.schema.name} not found in ${this.props.schema.url}. Found: ${keys.join(', ')}` });
            } else {
                this.setState({
                    Component: component[componentName]
                });
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