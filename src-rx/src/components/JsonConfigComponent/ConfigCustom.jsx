import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ConfigCustom extends Component {
    constructor(props) {
        super(props);
        // schema.url - location of Widget
        // schema.name - Component name

        // 1. load location
        // 2. start 
        this.state = {
            Component: null,
        };
        // this.Component = React.lazy(async () => {
        //     window._customComponent = this.props.schema.url;
            
        //     // import('CustomComponent/Components').then(comp => console.log(comp));

        //     // const url = `remote_app/${this.props.schema.name}`;
        //     // return (await import(url)).then(app => app.get('Button'));
        //     // return (await import('CustomComponent/Components')).default.Button;
        //     return import('CustomComponent/Components');
        //     // return import(`remote_app/${this.props.schema.name}.js`);
        // });
    }

    componentDidMount() {
        (async () => {
            window._customComponent = this.props.schema.url.startsWith('http') ? this.props.schema.url : window.location.protocol + "//" + window.location.host + '/' + this.props.schema.url;
            const Comp = await import('CustomComponent/Components');
            this.setState({
                Component: Comp.default[this.props.schema.name]
            })
        })()
    }

    render() {
        if (!this.state?.Component) {
            return null;
        }
        const Component = this.state.Component;
        return <Component {...this.props} />
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