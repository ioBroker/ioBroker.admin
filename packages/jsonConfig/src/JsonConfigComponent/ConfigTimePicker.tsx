import React from 'react';

import { TimePicker } from '@mui/x-date-pickers';

import ConfigGeneric from './ConfigGeneric';

export default class ConfigTimePicker extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(error: unknown, disabled: boolean) {
        return <TimePicker
            fullWidth
            margin="normal"
            format="HH:mm:ss"
            error={!!error}
            disabled={!!disabled}
            value={this.state.value}
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
        />;
    }
}
