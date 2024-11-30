import React, { type JSX } from 'react';

import type { ConfigItemImageSendTo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigImageSendToProps extends ConfigGenericProps {
    schema: ConfigItemImageSendTo;
}

interface ConfigImageSendToState extends ConfigGenericState {
    image?: string;
}

class ConfigImageSendTo extends ConfigGeneric<ConfigImageSendToProps, ConfigImageSendToState> {
    private initialized = false;

    private _context: string | undefined;

    componentDidMount(): void {
        super.componentDidMount();

        this.askInstance();
    }

    askInstance(): void {
        if (this.props.alive) {
            let data = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr: string = this.getPattern(this.props.schema.jsonData, null, true);
                if (dataStr) {
                    try {
                        data = JSON.parse(dataStr);
                    } catch {
                        console.error(`Cannot parse json data: ${JSON.stringify(data)}`);
                    }
                }
            }

            if (data === undefined) {
                data = null;
            }

            void this.props.oContext.socket
                .sendTo(`${this.props.oContext.adapterName}.${this.props.oContext.instance}`, this.props.schema.command || 'send', data)
                .then(image => this.setState({ image: image || '' }));
        }
    }

    getContext(): string {
        const oContext: Record<string, any> = {};

        if (Array.isArray(this.props.schema.alsoDependsOn)) {
            this.props.schema.alsoDependsOn.forEach(
                attr => (oContext[attr] = ConfigGeneric.getValue(this.props.data, attr)),
            );
        }

        return JSON.stringify(oContext);
    }

    renderItem(/* error, disabled, defaultValue */): JSX.Element {
        if (this.props.alive) {
            const oContext = this.getContext();
            if (oContext !== this._context || !this.initialized) {
                this._context = oContext;
                setTimeout(() => this.askInstance(), this.initialized ? 300 : 50);
                this.initialized = true;
            }
        }

        if (this.state.image === undefined) {
            return null;
        }

        return (
            <img
                alt="dynamic content"
                src={this.state.image}
                style={{ width: this.props.schema.width || '100%', height: this.props.schema.height }}
            />
        );
    }
}

export default ConfigImageSendTo;
