import React from 'react';

import {
    TextField,
    IconButton,
} from '@mui/material';

import { IconCopy, Utils } from '@iobroker/adapter-react-v5';

import type { ConfigItemSendTo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
};

interface ConfigTextSendToProps extends ConfigGenericProps {
    schema: ConfigItemSendTo;
}

interface ConfigTextSendToState extends ConfigGenericState {
    text?: string;
    context?: string;
}

class ConfigTextSendTo extends ConfigGeneric<ConfigTextSendToProps, ConfigTextSendToState> {
    private initialized = false;

    askInstance() {
        if (this.props.alive) {
            let data: Record<string, any> | undefined = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr: string = this.getPattern(this.props.schema.jsonData);
                try {
                    data = JSON.parse(dataStr);
                } catch (e) {
                    console.error(`Cannot parse json data: ${dataStr}`);
                }
            }

            if (data === undefined) {
                data = null;
            }

            this.props.socket.sendTo(`${this.props.adapterName}.${this.props.instance}`, this.props.schema.command || 'send', data)
                .then(text => this.setState({ text: text || '', context: this.getContext() }));
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

        if (this.state.text === undefined) {
            return null;
        }

        if (this.props.schema.container === 'text') {
            return <TextField
                variant="standard"
                fullWidth
                InputProps={{
                    endAdornment: this.props.schema.copyToClipboard ? <IconButton
                        size="small"
                        onClick={() => {
                            Utils.copyToClipboard(this.state.text);
                            window.alert('Copied');
                        }}
                    >
                        <IconCopy />
                    </IconButton> : undefined,
                }}
                value={this.state.text}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
        }
        return <div style={styles.fullWidth}>{this.state.text}</div>;
    }
}

export default ConfigTextSendTo;
