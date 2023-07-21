import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Autocomplete, TextField, FormControl } from '@mui/material';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    indeterminate: {
        opacity: 0.5,
    },
    control: {
        flexDirection: 'row',
        width: '100%',
    },
});

class ConfigNumber extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        let _value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        if (_value === null || _value === undefined) {
            _value = '';
        }
        this.setState({ _value: _value.toString(), oldValue: _value.toString() });
        // this.props.registerOnForceUpdate(this.props.attr, this.onUpdate);
    }

    static getDerivedStateFromProps(props, state) {
        if (
            (props.schema.min !== undefined && props.schema.min < 0) ||
            (props.schema.max !== undefined && props.schema.max < 0)
        ) {
            return null;
        }
        const _value = ConfigGeneric.getValue(props.data, props.attr);
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

    renderItem(error, disabled /* , defaultValue */) {
        const isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_VALUE;

        if (this.state.oldValue !== null && this.state.oldValue !== undefined) {
            this.updateTimeout && clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                this.updateTimeout = null;
                this.setState({ oldValue: null });
            }, 30);
        } else if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }

        if (isIndeterminate) {
            const arr = [...this.state.value].map(item => ({ label: item.toString(), value: item }));
            arr.unshift({ label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE });

            return (
                <Autocomplete
                    className={this.props.classes.indeterminate}
                    fullWidth
                    value={arr[0]}
                    getOptionSelected={(option, value) => option.label === value.label}
                    onChange={(_, value) =>
                        this.onChange(this.props.attr, value ? parseFloat(value.value) : this.props.schema.min || 0)}
                    options={arr}
                    getOptionLabel={option => option.label}
                    renderInput={params => (
                        <TextField
                            variant="standard"
                            {...params}
                            inputProps={{
                                readOnly: this.props.schema.readOnly || false,
                            }}
                            error={!!error}
                            placeholder={this.getText(this.props.schema.placeholder)}
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
        if (!error && this.state._value !== null && this.state._value !== undefined) {
            if (this.props.schema.min !== undefined && this.state._value < this.props.schema.min) {
                error = I18n.t('ra_Too small');
            }
            if (this.props.schema.max !== undefined && this.state._value > this.props.schema.max) {
                error = I18n.t('ra_Too big');
            }
        }

        return (
            <FormControl variant="standard" className={this.props.classes.control}>
                <TextField
                    variant="standard"
                    type="number"
                    fullWidth
                    inputProps={{
                        min: this.props.schema.min,
                        max: this.props.schema.max,
                        step: this.props.schema.step,
                        readOnly: this.props.schema.readOnly || false,
                    }}
                    value={this.state._value === null || this.state._value === undefined ? '' : this.state._value}
                    error={!!error}
                    disabled={!!disabled}
                    onChange={e => {
                        const _value = e.target.value;
                        // eslint-disable-next-line no-restricted-properties
                        if (window.isFinite(_value)) {
                            if (this.props.schema.min !== undefined && parseFloat(_value) < this.props.schema.min) {
                                this.onError(this.props.attr, I18n.t('ra_Too small'));
                            } else if (
                                this.props.schema.max !== undefined &&
                                    parseFloat(_value) > this.props.schema.max
                            ) {
                                this.onError(this.props.attr, I18n.t('ra_Too big'));
                            } else if (_value === '-' || Number.isNaN(parseFloat(_value))) {
                                this.onError(this.props.attr, I18n.t('ra_Not a number'));
                            } else {
                                this.onError(this.props.attr); // clear error
                            }
                        } else if (_value !== '') {
                            this.onError(this.props.attr, I18n.t('ra_Not a number'));
                        } else {
                            this.onError(this.props.attr); // clear error
                        }

                        if (this.state._value !== _value) {
                            this.setState({ _value, oldValue: this.state._value }, () => {
                                if (_value.trim() === parseFloat(_value).toString()) {
                                    this.onChange(this.props.attr, parseFloat(_value) || 0);
                                }
                            });
                        }
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

ConfigNumber.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigNumber);
