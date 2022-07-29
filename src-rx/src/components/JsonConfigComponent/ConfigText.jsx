import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Autocomplete, TextField } from '@mui/material';

import I18n from '@iobroker/adapter-react-v5/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    indeterminate: {
        opacity: 0.5
    }
});

class ConfigText extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value, oldValue: value });
    }

    static getDerivedStateFromProps(props, state) {
        let value = ConfigGeneric.getValue(props.data, props.attr);
        if (value !== null && value !== undefined) {
            if (props.schema.trim !== false) {
                value = value.toString().trim();
            } else {
                value = value.toString();
            }
        }

        if (value === null || value === undefined || (value !== state.value && value !== state.oldValue)) {
            return { value };
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
            const arr = [...this.state.value].map(item => ({label: item.toString(), value: item}));
            arr.unshift({ label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE });

            return <Autocomplete
                className={this.props.classes.indeterminate}
                fullWidth
                value={arr[0]}
                getOptionSelected={(option, value) => option.label === value.label}
                onChange={(_, value) =>
                    this.onChange(this.props.attr, value ? value.value : '')}
                options={arr}
                getOptionLabel={option => option.label}
                renderInput={params => <TextField
                    variant="standard"
                    {...params}
                    error={!!error}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                    disabled={!!disabled}
                />}
            />;
        } else {
            return <TextField
                variant="standard"
                fullWidth
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({ value, oldValue: this.state.value }, () =>
                        this.onChange(this.props.attr, this.props.schema.trim === false ? value : (value || '').trim()));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
        }
    }
}

ConfigText.propTypes = {
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

export default withStyles(styles)(ConfigText);