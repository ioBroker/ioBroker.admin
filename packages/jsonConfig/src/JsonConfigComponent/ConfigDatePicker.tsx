import React from 'react';

import { DatePicker } from '@mui/x-date-pickers';

import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

export default class ConfigDatePicker extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(error: unknown, disabled: boolean /* , defaultValue */): React.JSX.Element {
        return <DatePicker
            /** @ts-expect-error check this later on */
            fullWidth
            margin="normal"
            format={this.props.systemConfig.dateFormat.toLowerCase().replace('mm', 'MM')}
            error={!!error}
            disabled={!!disabled}
            value={this.state.value}
            KeyboardButtonProps={{
                'aria-label': 'change date',
            }}
            inputProps={{ maxLength: this.props.schema.maxLength || this.props.schema.max || undefined }}
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
