import React, { type JSX } from 'react';

import { TextField, IconButton } from '@mui/material';

import { Icon, IconCopy, Utils } from '@iobroker/react-components';

import type { ConfigItemSendTo } from '#JC/types';
import getIconByName from './Icons';
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
    style?: React.CSSProperties;
    icon?: string;
    iconStyle?: React.CSSProperties;
}

interface Response {
    text: string;
    style?: React.CSSProperties;
    icon?: string;
    iconStyle?: React.CSSProperties;
}

class ConfigTextSendTo extends ConfigGeneric<ConfigTextSendToProps, ConfigTextSendToState> {
    private initialized = false;

    private _context: string | undefined;

    askInstance(): void {
        if (this.props.alive) {
            let data: Record<string, any> | undefined = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr: string = this.getPattern(this.props.schema.jsonData);
                try {
                    data = JSON.parse(dataStr);
                } catch {
                    console.error(`Cannot parse json data: ${dataStr}`);
                }
            }

            if (data === undefined) {
                data = null;
            }

            void this.props.socket
                .sendTo(`${this.props.adapterName}.${this.props.instance}`, this.props.schema.command || 'send', data)
                .then(result => {
                    if (typeof result === 'object') {
                        const _data: Response = result;
                        this.setState({
                            text: _data.text || '',
                            style: _data.style,
                            icon: _data.icon,
                            iconStyle: _data.iconStyle,
                        });
                    } else if (typeof result === 'string') {
                        this.setState({ text: result || '' });
                    }
                })
                .catch(e => console.error(`Cannot send command: ${e}`));
        }
    }

    getContext(): string {
        const context: Record<string, any> = {};
        if (Array.isArray(this.props.schema.alsoDependsOn)) {
            this.props.schema.alsoDependsOn.forEach(
                attr => (context[attr] = ConfigGeneric.getValue(this.props.data, attr)),
            );
        }
        return JSON.stringify(context);
    }

    renderItem(/* error, disabled, defaultValue */): JSX.Element {
        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this._context || !this.initialized) {
                this._context = context;
                setTimeout(() => this.askInstance(), this.initialized ? 300 : 50);
                this.initialized = true;
            }
        }

        if (this.state.text === undefined) {
            return null;
        }

        let icon: JSX.Element | null = null;
        if (this.state.icon) {
            icon = getIconByName(this.state.icon, {
                marginRight: this.state.text ? 8 : undefined,
                ...(this.state.iconStyle || undefined),
            });
            if (!icon) {
                icon = (
                    <Icon
                        src={this.state.icon}
                        style={{ marginRight: this.state.text ? 8 : undefined, ...(this.state.iconStyle || undefined) }}
                    />
                );
            }
        }

        if (this.props.schema.container === 'text') {
            return (
                <TextField
                    variant="standard"
                    fullWidth
                    slotProps={{
                        input: {
                            endAdornment: this.props.schema.copyToClipboard ? (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        Utils.copyToClipboard(this.state.text);
                                        window.alert('Copied');
                                    }}
                                >
                                    <IconCopy />
                                </IconButton>
                            ) : undefined,
                        },
                    }}
                    value={this.state.text}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(
                        this.props.schema.help,
                        this.props.schema.helpLink,
                        this.props.schema.noTranslation,
                    )}
                />
            );
        }
        return (
            <div style={{ ...styles.fullWidth, ...(this.state.style || undefined) }}>
                {icon}
                {this.props.schema.container === 'html' ? (
                    <span dangerouslySetInnerHTML={{ __html: this.state.text || '' }} />
                ) : (
                    this.state.text
                )}
            </div>
        );
    }
}

export default ConfigTextSendTo;
