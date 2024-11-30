import React, { type JSX } from 'react';

import { TimePicker } from '@mui/x-date-pickers';

import type { ConfigItemTimePicker } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps } from './ConfigGeneric';

interface ConfigTimePickerProps extends ConfigGenericProps {
    schema: ConfigItemTimePicker;
    dialogName?: string;
}

export default class ConfigTimePicker extends ConfigGeneric<ConfigTimePickerProps> {
    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(_error: unknown, disabled: boolean): JSX.Element {
        // the format could be 'HH:mm:ss' or 'HH:mm'
        const shortFormat = this.props.schema.returnFormat !== 'HH:mm:ss';

        const value: never = new Date(Date.parse(`Thu, 01 Jan 1970 ${this.state.value || '00:00:00'}`)) as never;

        return (
            <TimePicker
                sx={theme => ({
                    width: '100%',
                    borderBottom: `1px solid ${theme.palette.text.primary}`,
                    '& fieldset': {
                        display: 'none',
                    },
                    '& input': {
                        padding: `${theme.spacing(1.5)} 0 4px 0`,
                    },
                    '& .MuiInputAdornment-root': {
                        marginLeft: 0,
                        marginTop: 1, // it is already in spaces
                    },
                    '& label': {
                        transform: 'translate(0px, -9px) scale(0.75)',
                    },
                })}
                ampm={this.props.oContext.systemConfig.dateFormat.includes('/')}
                timeSteps={
                    this.props.schema.timeSteps || this.props.schema.timesteps || { hours: 1, minutes: 5, seconds: 5 }
                }
                format={this.props.schema.format || 'HH:mm:ss'}
                disabled={!!disabled}
                value={value}
                onChange={(newValue: Date) => {
                    let strValue: string;
                    strValue =
                        (newValue as any) instanceof Date
                            ? newValue.toTimeString().split(' ')[0]
                            : newValue.toTimeString();
                    if (shortFormat) {
                        strValue = strValue.split(':').slice(0, 2).join(':');
                    }

                    this.setState({ value: strValue }, () => this.onChange(this.props.attr, this.state.value));
                }}
                views={this.props.schema.views || ['hours', 'minutes', 'seconds']}
                label={this.getText(this.props.schema.label)}
            />
        );
    }
}
