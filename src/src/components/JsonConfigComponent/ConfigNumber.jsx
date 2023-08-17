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

    checkValue(value) {
        if (value === null || value === undefined) {
            return null;
        }
        value = value.toString().trim();
        const f = value === '' ? 0 : parseFloat(value);

        if (value !== '' && Number.isNaN(f)) {
            return 'ra_Not a number';
        }

        // eslint-disable-next-line no-restricted-properties
        if (value !== '' && window.isFinite(value)) {
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

            return <Autocomplete
                className={this.props.classes.indeterminate}
                fullWidth
                value={arr[0]}
                getOptionSelected={(option, value) => option.label === value.label}
                onChange={(_, value) =>
                    this.onChange(this.props.attr, value.value)}
                options={arr}
                getOptionLabel={option => option.label}
                renderInput={params => (
                    <TextField
                        variant="standard"
                        {...params}
                        inputProps={{ readOnly: this.props.schema.readOnly || false }}
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
            />;
        }
        if (!error && this.state._value !== null && this.state._value !== undefined && this.state._value) {
            error = this.checkValue(this.state._value);
            if (error) {
                error = I18n.t(error);
            }
        }

        return <FormControl variant="standard" className={this.props.classes.control}>
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
                    const _value = e.target.value; // value is always a string and it is valid formatted
                    const _error = this.checkValue(_value);
                    if (_error) {
                        this.onError(this.props.attr, I18n.t(_error));
                    } else {
                        this.onError(this.props.attr); // clear error
                    }

                    this.setState({ _value, oldValue: this.state._value }, () =>
                        this.onChange(this.props.attr, _value));
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
        </FormControl>;
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
