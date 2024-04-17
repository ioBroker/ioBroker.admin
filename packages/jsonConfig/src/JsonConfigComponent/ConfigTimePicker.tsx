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
        const legacyReturnFormat = this.props.schema.returnFormat !== 'HH:mm:ss';

        const value: never = this.state.value && !legacyReturnFormat ?
            new Date(Date.parse(`Thu, 01 Jan 1970 ${this.state.value}`)) as never :
            this.state.value as never;

        return <TimePicker
            // @ts-expect-error fullWidth does exist on DatePicker
            fullWidth
            ampm={false}
            timeSteps={this.props.schema.timesteps || { hours: 1, minutes: 5, seconds: 5 }}
            margin="normal"
            format={this.props.schema.format || 'HH:mm:ss'}
            error={!!error}
            disabled={!!disabled}
            value={value}
            onChange={(newValue: never) => {
                let strValue = newValue as string;
                if (!legacyReturnFormat) {
                    strValue = (newValue as any) instanceof Date ? (value as Date).toTimeString().split(' ')[0] : value;
                }

                this.setState({ value: strValue }, () =>
                    this.onChange(this.props.attr, strValue));
            }}
            views={this.props.schema.views || ['hours', 'minutes', 'seconds']}
            InputLabelProps={{
                shrink: true,
            }}
            placeholder={this.getText(this.props.schema.placeholder)}
            label={this.getText(this.props.schema.label)}
            helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
        />;
    }
}
