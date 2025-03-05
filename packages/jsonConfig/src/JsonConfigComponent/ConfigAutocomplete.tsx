import React, { type JSX } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemAutocomplete, ConfigItemSelectOption } from '../types';
import ConfigGeneric, { type ConfigGenericState, type ConfigGenericProps } from './ConfigGeneric';

export interface ConfigAutocompleteProps extends ConfigGenericProps {
    schema: ConfigItemAutocomplete;
}

export interface ConfigAutocompleteState extends ConfigGenericState {
    selectOptions: { value: string; label: string }[];
}

class ConfigAutocomplete extends ConfigGeneric<ConfigAutocompleteProps, ConfigAutocompleteState> {
    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        const selectOptions: { label: string; value: string }[] = this.props.schema.options.map(
            (item: { label: string; value: string } | string) =>
                typeof item === 'string' ? { label: item, value: item } : JSON.parse(JSON.stringify(item)),
        );

        // if __different
        if (Array.isArray(value)) {
            selectOptions.unshift({
                label: I18n.t(ConfigGeneric.DIFFERENT_LABEL),
                value: ConfigGeneric.DIFFERENT_VALUE,
            });
            this.setState({ value: ConfigGeneric.DIFFERENT_VALUE, selectOptions });
        } else {
            this.setState({ value, selectOptions });
        }
    }

    renderItem(error: unknown, disabled: boolean): JSX.Element | null {
        if (!this.state.selectOptions) {
            return null;
        }

        let item;
        const options: ConfigItemSelectOption[] = JSON.parse(JSON.stringify(this.state.selectOptions));
        const isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_VALUE;

        if (isIndeterminate) {
            [...this.state.value]
                .filter(val => !options.find(it => (typeof it === 'object' ? it.value === val : it === val)))
                .forEach(it => options.push({ label: it.toString(), value: it }));

            item = { label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE };
            options.unshift(item);
        } else {
            item =
                this.state.value !== null &&
                this.state.value !== undefined &&
                options.find(_item =>
                    typeof _item === 'object' ? _item.value == this.state.value : _item == this.state.value,
                ); // let "==" be and not ===

            if (this.state.value !== null && this.state.value !== undefined && !item && this.props.schema.freeSolo) {
                item = { value: this.state.value, label: this.state.value };
                options.push(item);
            }
        }

        return (
            <Autocomplete
                fullWidth
                freeSolo={!!this.props.schema.freeSolo}
                value={item}
                options={options}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                filterOptions={(options: { value: string; label: string }[], params) => {
                    const filtered = options.filter(option => {
                        if (params.inputValue === '') {
                            return true;
                        }
                        return (
                            option.label.toLowerCase().includes(params.inputValue.toLowerCase()) ||
                            option.value.toLowerCase().includes(params.inputValue.toLowerCase())
                        );
                    });

                    if (this.props.schema.freeSolo && params.inputValue !== '') {
                        filtered.push({
                            label: params.inputValue,
                            value: params.inputValue,
                        });
                    }

                    return filtered;
                }}
                // autoComplete
                onInputChange={e => {
                    if (!e || !this.props.schema.freeSolo) {
                        return;
                    }

                    const val = (e.target as HTMLInputElement).value;
                    if (val !== this.state.value) {
                        this.setState({ value: val }, () => this.onChange(this.props.attr, val));
                    }
                }}
                onChange={(_, value) => {
                    const val = typeof value === 'object' ? (value ? value.value : '') : value;
                    if (val !== this.state.value) {
                        this.setState({ value: val }, () => this.onChange(this.props.attr, val));
                    }
                }}
                getOptionLabel={option => (typeof option === 'object' ? (option?.label ?? '') : '')}
                renderInput={params => (
                    <TextField
                        variant="standard"
                        {...params}
                        error={!!error}
                        // inputProps are important and will be given in params
                        // inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
                        placeholder={this.getText(this.props.schema.placeholder)}
                        label={this.getText(this.props.schema.label)}
                        helperText={this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                        disabled={disabled}
                    />
                )}
            />
        );
    }
}

export default ConfigAutocomplete;
