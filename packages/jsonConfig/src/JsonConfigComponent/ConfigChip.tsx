import React, { type JSX } from 'react';

import { FormHelperText, FormControl } from '@mui/material';

import type { ConfigItemChip } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ChipInput from './ChipInput';
import { I18n } from '@iobroker/adapter-react-v5';

interface ConfigChipProps extends ConfigGenericProps {
    schema: ConfigItemChip;
}

class ConfigChip extends ConfigGeneric<ConfigChipProps, ConfigGenericState> {
    componentDidMount(): void {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr);
        if (this.props.schema.delimiter && typeof value === 'string') {
            const parts = value
                .split(this.props.schema.delimiter)
                .map(a => a.trim())
                .filter(a => a);
            this.setState({ value: parts });
        } else {
            this.setState({ value: value || [] });
        }
    }

    renderItem(error: string, disabled: boolean): JSX.Element | null {
        const { attr, schema } = this.props;
        const { value } = this.state;
        return (
            <FormControl
                fullWidth
                variant="standard"
            >
                <ChipInput
                    value={value}
                    disabled={!!disabled}
                    label={this.getText(schema.label)}
                    error={!!error}
                    onAdd={chip => {
                        const newValue = JSON.parse(JSON.stringify(value));
                        newValue.push(chip);
                        this.setState({ value: newValue }, () => {
                            let mayBePromise: void | Promise<void>;
                            if (this.props.schema.delimiter) {
                                mayBePromise = this.onChange(attr, newValue.join(`${this.props.schema.delimiter} `));
                            } else {
                                mayBePromise = this.onChange(attr, newValue);
                            }
                            if (mayBePromise instanceof Promise) {
                                mayBePromise.catch(e => console.error(e));
                            }
                        });
                    }}
                    theme={this.props.oContext.theme}
                    onDelete={(_chip, index) => {
                        const newValue = JSON.parse(JSON.stringify(value));
                        newValue.splice(index, 1);
                        this.setState({ value: newValue }, () => {
                            let mayBePromise: void | Promise<void>;
                            if (this.props.schema.delimiter) {
                                mayBePromise = this.onChange(attr, newValue.join(`${this.props.schema.delimiter} `));
                            } else {
                                mayBePromise = this.onChange(attr, newValue);
                            }
                            if (mayBePromise instanceof Promise) {
                                mayBePromise.catch(e => console.error(e));
                            }
                        });
                    }}
                />
                <FormHelperText>{I18n.t('ra_Press ENTER Key to add new item')}</FormHelperText>
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigChip;
