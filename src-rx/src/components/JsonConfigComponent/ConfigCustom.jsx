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

        if (this.props.schema.url.startsWith('http:') || this.props.schema.url.startsWith('https:')) {
            window._customComponent = this.props.schema.url;
        } else if (this.props.schema.url.startsWith('./')) {
            window._customComponent = `${window.location.protocol}//${window.location.host}${this.props.schema.url.replace(/^\./, '')}`;
        } else {
            window._customComponent = `${window.location.protocol}//${window.location.host}/${this.props.schema.url}`;
        }

        // custom component always has constant name
        try {
            const component = await import('CustomComponent/Components');
            if (!component || !component.default || !component.default[this.props.schema.name]) {
                const keys = Object.keys(component?.default || {});
                console.error('URL is empty. Cannot load custom component!');
                this.setState({ error: `Component ${this.props.schema.name} not found in ${this.props.schema.url}. Found: ${keys.join(', ')}` });
            } else {
                this.setState({
                    Component: component.default[this.props.schema.name]
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
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default ConfigCustom;