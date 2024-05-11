import React from 'react';

import { DatePicker } from '@mui/x-date-pickers';

import type { ConfigItemDatePicker } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps } from './ConfigGeneric';

interface ConfigDatePickerProps extends ConfigGenericProps {
    schema: ConfigItemDatePicker;
}

export default class ConfigDatePicker extends ConfigGeneric<ConfigDatePickerProps> {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(_error: unknown, disabled: boolean /* , defaultValue */): React.JSX.Element {
        return <DatePicker
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
            format={this.props.systemConfig.dateFormat.toLowerCase().replace('mm', 'MM')}
            disabled={!!disabled}
            value={this.state.value as never}
            onChange={value => {
                this.setState({ value }, () =>
                    this.onChange(this.props.attr, this.state.value));
            }}
            label={this.getText(this.props.schema.label)}
        />;
    }
}
