import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Autocomplete, TextField, FormControl } from '@mui/material';

import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    indeterminate: {
        opacity: 0.5
    },
    control: {
      flexDirection: 'row',
        width: '100%'
    },
    textWithArrows: {
        width: 'calc(100% - 12px)',
    },
    arrows: {
        width: 12,
        display: 'inline'
    },
    arrowUp: {
        fontSize: 10,
        userSelect: 'none',
        cursor: 'pointer',
    },
    arrowDown: {
        fontSize: 10,
        userSelect: 'none',
        cursor: 'pointer',
    }
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
        if ((props.schema.min !== undefined && props.schema.min < 0) ||
            (props.schema.max !== undefined && props.schema.max < 0)
        ) {
            return null;
        }
        const _value = ConfigGeneric.getValue(props.data, props.attr);
        if (_value === null || _value === undefined ||
            state.oldValue === null || state.oldValue === undefined ||
            (_value.toString() !== parseFloat(state._value).toString() &&
             _value.toString() !== state.oldValue.toString())
        ) {
            return { _value };
        } else {
            return null;
        }
    }

    renderItem(error, disabled, defaultValue) {
        let isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_VALUE;

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
            arr.unshift({label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE});

            return <Autocomplete
                className={this.props.classes.indeterminate}
                fullWidth
                value={arr[0]}
                getOptionSelected={(option, value) => option.label === value.label}
                onChange={(_, value) =>
                    this.onChange(this.props.attr, value ? parseFloat(value.value) : this.props.schema.min || 0)}
                options={arr}
                getOptionLabel={option => option.label}
                renderInput={params => <TextField
                    variant="standard"
                    {...params}
                    inputProps={{
                        readOnly: this.props.schema.readOnly || false,
                    }}
                    error={!!error}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                    disabled={!!disabled}
                />}
            />;
        } else {
            if (!error && this.state._value !== null && this.state._value !== undefined) {
                if (this.props.schema.min !== undefined && this.state._value < this.props.schema.min) {
                    error = I18n.t('ra_Too small');
                }
                if (this.props.schema.max !== undefined && this.state._value > this.props.schema.max) {
                    error = I18n.t('ra_Too big');
                }
            }

            let type = 'number';
            if ((this.props.schema.min !== undefined && this.props.schema.min < 0) ||
                (this.props.schema.max !== undefined && this.props.schema.max < 0)
            ) {
                type = 'text';
            }

            const isNumber = this.state._value !== null &&
                this.state._value !== undefined &&
                (typeof this.state._value === 'number' ||
                    (typeof this.state._value === 'string' &&
                     this.state._value.trim() === parseFloat(this.state._value).toString())
                );

            return <FormControl variant="standard" className={this.props.classes.control}>
                <TextField
                    variant="standard"
                    type={type}
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
                    className={Utils.clsx(type === 'text' && isNumber && this.props.classes.textWithArrows)}
                    onChange={e => {
                        const _value = e.target.value;
                        if (isFinite(_value)) {
                            if (this.props.schema.min !== undefined && parseFloat(_value) < this.props.schema.min) {
                                this.onError(this.props.attr, I18n.t('ra_Too small'));
                            } else if (this.props.schema.max !== undefined && parseFloat(_value) > this.props.schema.max) {
                                this.onError(this.props.attr, I18n.t('ra_Too big'));
                            } else if (_value === '-' || isNaN(parseFloat(_value))) {
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
                    helperText={error && typeof error === 'string' ? error : this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                />
                {type === 'text' && isNumber ? <div className={this.props.classes.arrows}>
                    <div
                        className={this.props.classes.arrowUp}
                        onClick={() => {
                            let _value = parseFloat(this.state._value) + 1;
                            if (this.props.schema.max !== undefined && _value <= this.props.schema.max) {
                                this.setState({ _value });
                            }
                        }}
                    >▲</div>
                    <div
                        className={this.props.classes.arrowDown}
                        onClick={() => {
                            let _value = parseFloat(this.state._value) - 1;
                            if (this.props.schema.min !== undefined && _value >= this.props.schema.min) {
                                this.setState({ _value });
                            }
                        }}
                    >▼</div>
                </div> : null}
            </FormControl>;
        }
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