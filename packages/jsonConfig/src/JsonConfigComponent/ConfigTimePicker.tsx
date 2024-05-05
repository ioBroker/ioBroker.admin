import React from 'react';

import { TimePicker } from '@mui/x-date-pickers';

import type { ConfigItemTimePicker } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps } from './ConfigGeneric';

interface ConfigTimePickerProps extends ConfigGenericProps {
    schema: ConfigItemTimePicker;
    dialogName?: string;
}

export default class ConfigTimePicker extends ConfigGeneric<ConfigTimePickerProps> {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(_error: unknown, disabled: boolean) {
        const legacyReturnFormat = this.props.schema.returnFormat !== 'HH:mm:ss';

        const value: never = this.state.value && !legacyReturnFormat ?
            new Date(Date.parse(`Thu, 01 Jan 1970 ${this.state.value}`)) as never :
            this.state.value as never;

        return <TimePicker
            sx={theme => ({
                width: '100%',
                '& fieldset': {
                    display: 'none',
                },
                '& input': {
                    padding: `${theme.spacing(1)} 0 0 0`,
                },
                '& .MuiInputAdornment-root': {
                    marginLeft: 0,
                    marginTop: 7,
                },
            })}
            ampm={this.props.systemConfig.dateFormat.includes('/')}
            timeSteps={this.props.schema.timeSteps || this.props.schema.timesteps || { hours: 1, minutes: 5, seconds: 5 }}
            format={this.props.schema.format || 'HH:mm:ss'}
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
            label={this.getText(this.props.schema.label)}
        />;
    }
}
