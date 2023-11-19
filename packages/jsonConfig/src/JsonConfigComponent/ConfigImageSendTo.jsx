import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});

class ConfigImageSendTo extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();

        this.askInstance();
    }

    askInstance() {
        if (this.props.alive) {
            let data = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                data = this.getPattern(this.props.schema.jsonData);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error(`Cannot parse json data: ${data}`);
                }
            }

            if (data === undefined) {
                data = null;
            }

            this.props.socket.sendTo(`${this.props.adapterName}.${this.props.instance}`, this.props.schema.command || 'send', data)
                .then(image => this.setState({ image: image || '', context: this.getContext() }));
        }
    }

    getContext() {
        const context = {};
        if (Array.isArray(this.props.schema.alsoDependsOn)) {
            this.props.schema.alsoDependsOn.forEach(attr =>
                context[attr] = ConfigGeneric.getValue(this.props.data, attr));
        }
        return JSON.stringify(context);
    }

    renderItem(/* error, disabled, defaultValue */) {
        if (this.state.image === undefined) {
            return null;
        }

        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this.state.context) {
                setTimeout(() => this.askInstance(), 300);
            }
        }

        return <img
            className={this.props.classes.fullWidth}
            alt="dynamic content"
            src={this.state.image}
            style={{ width: this.props.schema.width, height: this.props.schema.height }}
        />;
    }
}

ConfigImageSendTo.propTypes = {
    socket: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
};

export default withStyles(styles)(ConfigImageSendTo);
