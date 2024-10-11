import React, { type JSX } from 'react';

import { Autocomplete, TextField, TextareaAutosize, InputAdornment, IconButton } from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemText } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    indeterminate: {
        opacity: 0.5,
    },
    label: {
        width: '100%',
        fontSize: 16,
    },
    helper: {
        width: '100%',
        fontSize: 12,
    },
    error: {
        width: '100%',
        fontSize: 12,
        color: '#FF0000',
    },
};

interface ConfigTextProps extends ConfigGenericProps {
    schema: ConfigItemText;
}

interface ConfigTextState extends ConfigGenericState {
    oldValue?: string;
    jsonError?: boolean;
}

class ConfigText extends ConfigGeneric<ConfigTextProps, ConfigTextState> {
    private updateTimeout: ReturnType<typeof setTimeout> | null = null;

    componentDidMount(): void {
        super.componentDidMount();
        let value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        if (Array.isArray(value) && this.props.multiEdit) {
            value = ConfigGeneric.DIFFERENT_VALUE;
            this.setState({ value, oldValue: value, jsonError: false });
            return;
        }

        this.setState({ value, oldValue: value, jsonError: this.validateJson(value) });
    }

    validateJson(value: string | null | undefined): boolean {
        let jsonError = false;
        if (this.props.schema.validateJson) {
            if (value || !this.props.schema.allowEmpty) {
                try {
                    JSON.parse(value);
                } catch (err: unknown) {
                    console.log('Error in JSON', err);
                    jsonError = true;
                }
            }
        }

        return jsonError;
    }

    static getDerivedStateFromProps(props: ConfigTextProps, state: ConfigTextState): Partial<ConfigTextState> | null {
        if (props.multiEdit && state.value === ConfigGeneric.DIFFERENT_VALUE) {
            return { value: ConfigGeneric.DIFFERENT_VALUE };
        }

        let value = ConfigGeneric.getValue(props.data, props.attr);

        if (value !== null && value !== undefined) {
            value = value.toString();
        }

        if (value === null || value === undefined || (value !== state.value && value !== state.oldValue)) {
            return { value };
        }
        return null;
    }

    renderItem(error?: boolean, disabled?: boolean): JSX.Element {
        const isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_VALUE;

        if (this.props.schema.time) {
            // show read-only time

            let time = '';
            if (typeof this.state.value === 'number') {
                // If the value is a number, it is a timestamp.
                if (this.state.value && this.state.value < 946659600000) {
                    // If the value is less than 2000-01-01, it is a timestamp in seconds.
                    time = new Date(this.state.value * 1000).toLocaleString();
                } else {
                    time = new Date(this.state.value).toLocaleString();
                }
            } else if (typeof this.state.value === 'string') {
                // If the value is a string, it is a date string.
                time = new Date(this.state.value).toLocaleString();
            }

            return (
                <TextField
                    variant="standard"
                    fullWidth
                    value={time}
                    error={!!error || !!this.state.jsonError}
                    disabled={!!disabled}
                    slotProps={{
                        htmlInput: {
                            readOnly: true,
                        },
                    }}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(
                        this.props.schema.help,
                        this.props.schema.helpLink,
                        this.props.schema.noTranslation,
                    )}
                />
            );
        }

        if (this.state.oldValue !== null && this.state.oldValue !== undefined) {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(() => {
                this.updateTimeout = null;
                this.setState({ oldValue: null });
            }, 30);
        } else if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }

        if (isIndeterminate) {
            const autoCompleteOptions = ConfigGeneric.getValue(this.props.data, this.props.attr);
            const arr =
                autoCompleteOptions
                    ?.filter((a: any) => a || a === 0)
                    .map((item: any) => ({ label: item.toString() || '', value: item })) || [];

            arr.unshift({ label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE });

            return (
                <Autocomplete
                    style={styles.indeterminate}
                    fullWidth
                    value={arr[0]}
                    // getOptionSelected={(option, value) => option.label === value.label}
                    onChange={(_, value) => {
                        const val = value ? value.value : '';
                        const mayBePromise = this.onChange(this.props.attr, val, () => {
                            this.setState({ value: val, oldValue: val, jsonError: this.validateJson(value) });
                        });
                        if (mayBePromise instanceof Promise) {
                            mayBePromise.catch(e => console.error(`Cannot set value: ${e}`));
                        }
                    }}
                    options={arr}
                    getOptionLabel={option => option.label}
                    renderInput={params => (
                        <TextField
                            variant="standard"
                            {...params}
                            error={!!error}
                            placeholder={this.getText(this.props.schema.placeholder)}
                            slotProps={{
                                htmlInput: {
                                    ...params.inputProps,
                                    maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                                    readOnly: this.props.schema.readOnly || false,
                                },
                            }}
                            label={this.getText(this.props.schema.label)}
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
        if (this.props.schema.minRows > 1) {
            const helper = this.renderHelp(
                this.props.schema.help,
                this.props.schema.helpLink,
                this.props.schema.noTranslation,
            );
            return (
                <div style={{ width: '100%' }}>
                    {this.props.schema.label ? (
                        <div style={styles.label}>{this.getText(this.props.schema.label)}</div>
                    ) : null}
                    <TextareaAutosize
                        // variant="standard"
                        style={{
                            width: '100%',
                            resize: 'vertical',
                            backgroundColor: this.props.themeType === 'dark' ? '#363636' : '#cccccc',
                            color: this.props.themeType === 'dark' ? '#fff' : '#111',
                        }}
                        minRows={this.props.schema.minRows}
                        maxRows={this.props.schema.maxRows}
                        value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                        disabled={!!disabled}
                        readOnly={this.props.schema.readOnly || false}
                        onChange={e => {
                            const value = e.target.value;
                            this.setState(
                                { value, oldValue: this.state.value, jsonError: this.validateJson(value) },
                                () => this.onChange(this.props.attr, value || ''),
                            );
                        }}
                        placeholder={this.getText(this.props.schema.placeholder)}
                    />
                    {helper || error || this.state.jsonError ? (
                        <div style={error ? styles.error : styles.helper}>
                            {error || (this.state.jsonError ? I18n.t('ra_Invalid JSON') : helper)}
                        </div>
                    ) : null}
                </div>
            );
        }
        return (
            <TextField
                variant="standard"
                fullWidth
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error || !!this.state.jsonError}
                disabled={!!disabled}
                slotProps={{
                    htmlInput: {
                        maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                        readOnly: this.props.schema.readOnly || false,
                    },
                    input: {
                        endAdornment:
                            !this.props.schema.readOnly &&
                            !disabled &&
                            this.state.value &&
                            !this.props.schema.noClearButton ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            this.setState({ value: '', oldValue: this.state.value }, () =>
                                                this.onChange(this.props.attr, ''),
                                            )
                                        }
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                    },
                }}
                onChange={e => {
                    const value = e.target.value;

                    this.setState({ value, oldValue: this.state.value, jsonError: this.validateJson(value) }, () =>
                        this.onChange(this.props.attr, value),
                    );
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={
                    this.state.jsonError
                        ? I18n.t('ra_Invalid JSON')
                        : this.renderHelp(
                              this.props.schema.help,
                              this.props.schema.helpLink,
                              this.props.schema.noTranslation,
                          )
                }
            />
        );
    }
}

export default ConfigText;
