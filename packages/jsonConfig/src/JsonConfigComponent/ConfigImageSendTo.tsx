import React from 'react';

import type { ConfigItemImageSendTo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigImageSendToProps extends ConfigGenericProps {
    schema: ConfigItemImageSendTo;
}

interface ConfigImageSendToState extends ConfigGenericState {
    image?: string;
    context?: string;
}

class ConfigImageSendTo extends ConfigGeneric<ConfigImageSendToProps, ConfigImageSendToState> {
    private initialized = false;

    componentDidMount() {
        super.componentDidMount();

        this.askInstance();
    }

    askInstance() {
        if (this.props.alive) {
            let data = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr: string = this.getPattern(this.props.schema.jsonData);
                if (dataStr) {
                    try {
                        data = JSON.parse(dataStr);
                    } catch (e) {
                        console.error(`Cannot parse json data: ${data}`);
                    }
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
        const context: Record<string, any> = {};

        if (Array.isArray(this.props.schema.alsoDependsOn)) {
            this.props.schema.alsoDependsOn.forEach(attr =>
                context[attr] = ConfigGeneric.getValue(this.props.data, attr));
        }

        return JSON.stringify(context);
    }

    renderItem(/* error, disabled, defaultValue */) {
        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this.state.context || !this.initialized) {
                setTimeout(() => this.askInstance(), this.initialized ? 300 : 50);
                this.initialized = true;
            }
        }

        if (this.state.image === undefined) {
            return null;
        }

        return <img
            alt="dynamic content"
            src={this.state.image}
            style={{ width: this.props.schema.width || '100%', height: this.props.schema.height }}
        />;
    }
}

export default ConfigImageSendTo;
