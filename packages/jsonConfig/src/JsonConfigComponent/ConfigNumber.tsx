import React, { type JSX } from 'react';

import { Autocomplete, TextField, FormControl } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemNumber } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    indeterminate: {
        opacity: 0.5,
    },
    control: {
        flexDirection: 'row',
        width: '100%',
    },
};

interface ConfigNumberProps extends ConfigGenericProps {
    schema: ConfigItemNumber;
}

interface ConfigNumberState extends ConfigGenericState {
    _value: string;
    oldValue: string | null;
}

class ConfigNumber extends ConfigGeneric<ConfigNumberProps, ConfigNumberState> {
    private updateTimeout?: ReturnType<typeof setTimeout>;

    componentDidMount(): void {
        super.componentDidMount();
        let _value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        if (_value === null || _value === undefined) {
            _value = '';
        }

        if (Array.isArray(_value) && this.props.oContext.multiEdit) {
            _value = ConfigGeneric.DIFFERENT_VALUE;
            this.setState({ _value, oldValue: _value });
            return;
        }

        this.setState({ _value: _value.toString(), oldValue: _value.toString() });
    }

    static getDerivedStateFromProps(
        props: ConfigNumberProps,
        state: ConfigNumberState,
    ): Partial<ConfigNumberState> | null {
        if (
            (props.schema.min !== undefined && props.schema.min < 0) ||
            (props.schema.max !== undefined && props.schema.max < 0)
        ) {
            return null;
        }
        const _value = ConfigGeneric.getValue(props.data, props.attr);

        if (props.oContext.multiEdit && state._value === ConfigGeneric.DIFFERENT_VALUE) {
            return { _value: ConfigGeneric.DIFFERENT_VALUE };
        }

        if (
            _value === null ||
            _value === undefined ||
            state.oldValue === null ||
            state.oldValue === undefined ||
            (_value.toString() !== parseFloat(state._value).toString() &&
                _value.toString() !== state.oldValue.toString())
        ) {
            return { _value };
        }

        return null;
    }

    checkValue(value: string): string | null {
        if (value === null || value === undefined) {
            return null;
        }
        value = value.toString().trim();
        const f = value === '' ? 0 : parseFloat(value);

        if (value !== '' && Number.isNaN(f)) {
            return 'ra_Not a number';
        }

        if (value !== '' && window.isFinite(f)) {
            if (this.props.schema.min !== undefined && f < this.props.schema.min) {
                return 'ra_Too small';
            }
            if (this.props.schema.max !== undefined && f > this.props.schema.max) {
                return 'ra_Too big';
            }
            if (value === '' || value === '-' || Number.isNaN(f)) {
                return 'ra_Not a number';
            }

            return null;
        }

        return 'ra_Not a number';
    }

    renderItem(error: unknown, disabled: boolean): JSX.Element | null {
        const isIndeterminate = Array.isArray(this.state._value) || this.state._value === ConfigGeneric.DIFFERENT_VALUE;

        if (this.state.oldValue !== null && this.state.oldValue !== undefined) {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(() => {
                this.updateTimeout = undefined;
                this.setState({ oldValue: null });
            }, 30);
        } else if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }

        if (isIndeterminate) {
            const autoCompleteOptions = ConfigGeneric.getValue(this.props.data, this.props.attr);
            const arr =
                autoCompleteOptions
                    ?.filter((a: number | null | undefined) => a || a === 0)
                    .map((item: number) => ({ label: item.toString(), value: item })) || [];

            arr.unshift({ label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE });

            return (
                <Autocomplete
                    style={styles.indeterminate}
                    fullWidth
                    freeSolo
                    value={arr[0]}
                    // @ts-expect-error needs investigation if this really has no effect
                    getOptionSelected={(option, value) => option.label === value.label}
                    onChange={(_, value: (typeof arr)[number]) => {
                        const mayBePromise = this.onChange(this.props.attr, value?.value, () => {
                            this.setState({ _value: value?.value, oldValue: this.state._value });
                        });
                        if (mayBePromise instanceof Promise) {
                            mayBePromise.catch(e => console.error(e));
                        }
                    }}
                    options={arr}
                    getOptionLabel={(option: (typeof arr)[number]) => option.label}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label={this.getText(this.props.schema.label)}
                            variant="standard"
                            slotProps={{
                                htmlInput: {
                                    ...params.inputProps,
                                    readOnly: this.props.schema.readOnly || false,
                                },
                                input: {
                                    endAdornment: this.props.schema.unit
                                        ? this.getText(this.props.schema.unit, this.props.schema.noTranslation)
                                        : undefined,
                                },
                            }}
                            error={!!error}
                            placeholder={this.getText(this.props.schema.placeholder)}
                            helperText={this.renderHelp(
                                this.props.schema.help,
                                this.props.schema.helpLink,
                                this.props.schema.noTranslation,
                            )}
                            disabled={!!disabled}
                        />
                    )}
                />
            );
        }
        if (!error && this.state._value !== null && this.state._value !== undefined && this.state._value) {
            error = this.checkValue(this.state._value);
            if (error) {
                error = I18n.t(error as string);
            }
        }

        return (
            <FormControl
                variant="standard"
                style={styles.control}
            >
                <TextField
                    variant="standard"
                    type="number"
                    fullWidth
                    slotProps={{
                        htmlInput: {
                            min: this.props.schema.min,
                            max: this.props.schema.max,
                            step: this.props.schema.step,
                            readOnly: this.props.schema.readOnly || false,
                        },
                        input: {
                            endAdornment: this.props.schema.unit
                                ? this.getText(this.props.schema.unit, this.props.schema.noTranslation)
                                : undefined,
                        },
                    }}
                    value={this.state._value === null || this.state._value === undefined ? '' : this.state._value}
                    error={!!error}
                    disabled={!!disabled}
                    onChange={e => {
                        const _value = e.target.value; // value is always a string and it is validly formatted
                        const _error = this.checkValue(_value);
                        if (_error) {
                            this.onError(this.props.attr, I18n.t(_error));
                        } else {
                            this.onError(this.props.attr); // clear error
                        }

                        this.setState({ _value, oldValue: this.state._value }, () =>
                            this.onChange(this.props.attr, parseFloat(_value)),
                        );
                    }}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={
                        error && typeof error === 'string'
                            ? error
                            : this.renderHelp(
                                  this.props.schema.help,
                                  this.props.schema.helpLink,
                                  this.props.schema.noTranslation,
                              )
                    }
                />
            </FormControl>
        );
    }
}

export default ConfigNumber;
