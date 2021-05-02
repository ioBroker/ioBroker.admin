import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import {Autocomplete} from '@material-ui/lab';

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
        this.setState({value});
    }

    static getDerivedStateFromProps(props, state) {
        const value = ConfigGeneric.getValue(props.data, props.attr);
        if (value === null || value === undefined || value.toString().trim() !== (state.value ||  '').toString().trim()) {
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
                    this.onChange(this.props.attr, value ? value.value : '')}
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
            return <TextField
                fullWidth
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({value}, () =>
                        this.onChange(this.props.attr, (value || '').trim()));
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