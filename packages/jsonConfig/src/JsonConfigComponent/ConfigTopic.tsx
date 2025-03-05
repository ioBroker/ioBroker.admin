import React, { type JSX } from 'react';

import { TextField } from '@mui/material';

import type { ConfigItemTopic } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

function convertID2Topic(id: string, namespace: string): string {
    let topic;
    if (namespace && id.substring(0, namespace.length) === namespace) {
        topic = id.substring(namespace.length + 1);
    } else {
        topic = id;
    }
    topic = topic.replace(/\./g, '/').replace(/_/g, ' ');
    return topic;
}

interface ConfigTopicProps extends ConfigGenericProps {
    schema: ConfigItemTopic;
}

class ConfigTopic extends ConfigGeneric<ConfigTopicProps, ConfigGenericState> {
    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        if (!value && this.props.customObj?._id) {
            const topic = convertID2Topic(
                this.props.customObj._id,
                `${this.props.oContext.adapterName}.${this.props.oContext.instance}`,
            );
            this.setState({ value: topic });
        } else {
            this.setState({ value: value || '' });
        }
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        return (
            <TextField
                variant="standard"
                fullWidth
                slotProps={{
                    htmlInput: {
                        maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                    },
                }}
                value={this.state.value}
                error={!!error}
                disabled={disabled}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(
                    this.props.schema.help,
                    this.props.schema.helpLink,
                    this.props.schema.noTranslation,
                )}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({ value }, () => this.onChange(this.props.attr, value));
                }}
            />
        );
    }
}

export default ConfigTopic;
