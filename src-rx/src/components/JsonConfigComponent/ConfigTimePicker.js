import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import ConfigGeneric from './ConfigGeneric';
import { KeyboardTimePicker } from '@material-ui/pickers';

const styles = theme => ({
    indeterminate: {
        opacity: 0.5
    }
});

class ConfigTimePicker extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(error, disabled, defaultValue) {
        return <KeyboardTimePicker
            fullWidth
            margin="normal"
            format="HH:mm:ss"
            error={!!error}
            disabled={!!disabled}
            value={this.state.value === null || this.state.value === undefined ? new Date() : this.state.value}
            onChange={value => {
                this.setState({ value }, () =>
                    this.onChange(this.props.attr, value));
            }}
            InputLabelProps={{
                shrink: true,
            }}
            placeholder={this.getText(this.props.schema.placeholder)}
            label={this.getText(this.props.schema.label)}
            helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
        />
    }
}

ConfigTimePicker.propTypes = {
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

export default withStyles(styles)(ConfigTimePicker);