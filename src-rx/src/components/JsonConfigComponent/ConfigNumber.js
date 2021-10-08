import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import {Autocomplete} from '@material-ui/lab';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    indeterminate: {
        opacity: 0.5
    }
});

class ConfigNumber extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({value});
        //this.props.registerOnForceUpdate(this.props.attr, this.onUpdate);
    }

    static getDerivedStateFromProps(props, state) {
        const value = ConfigGeneric.getValue(props.data, props.attr);
        if (value === null || value === undefined || value.toString() !== parseFloat(state.value).toString()) {
            return {value};
        } else {
            return null;
        }
    }

    renderItem(error, disabled, defaultValue) {
        let isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_LABEL;

        if (isIndeterminate) {
            const arr = [...this.state.value].map(item => ({label: item.toString(), value: item}));
            arr.unshift({label: ConfigGeneric.DIFFERENT_LABEL, value: ConfigGeneric.DIFFERENT_VALUE});

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
                    {...params}
                    error={!!error}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                    disabled={!!disabled}
                />}
            />;
        } else {
            if (!error && this.state.value !== null && this.state.value !== undefined) {
                if (this.props.schema.min !== undefined && this.state.value < this.props.schema.min) {
                    error = I18n.t('Too small');
                }
                if (this.props.schema.max !== undefined && this.state.value > this.props.schema.max) {
                    error = I18n.t('Too big');
                }
            }

            return <TextField
                type="number"
                fullWidth
                inputProps={{min: this.props.schema.min, max: this.props.schema.max, step: this.props.schema.step}}
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                onChange={e => {
                    const value = e.target.value;
                    if (this.props.schema.min !== undefined && value < this.props.schema.min) {
                        this.onError(this.props.attr, I18n.t('Too small'));
                    }
                    if (this.props.schema.max !== undefined && value > this.props.schema.max) {
                        this.onError(this.props.attr, I18n.t('Too big'));
                    }
                    this.setState({value}, () =>
                        this.onChange(this.props.attr, parseFloat(value) || 0));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={error && typeof error === 'string' ? error : this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
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