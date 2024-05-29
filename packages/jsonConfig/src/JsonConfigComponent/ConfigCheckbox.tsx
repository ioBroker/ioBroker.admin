import React from 'react';
import { withStyles } from '@mui/styles';

import {
    FormControlLabel,
    Checkbox,
    FormHelperText,
    FormControl,
} from '@mui/material';

import  { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemCheckbox } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    error: {
        color: 'red',
    },
};

interface ConfigCheckboxProps extends ConfigGenericProps {
    schema: ConfigItemCheckbox;
}

class ConfigCheckbox extends ConfigGeneric<ConfigCheckboxProps, ConfigGenericState> {
    renderItem(error: unknown, disabled: boolean): React.JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const isIndeterminate = Array.isArray(value);

        return <FormControl className={this.props.classes.fullWidth} variant="standard">
            <FormControlLabel
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!disabled) {
                        this.onChange(this.props.attr, !value);
                    }
                }}
                control={<Checkbox
                    indeterminate={isIndeterminate}
                    checked={!!value}
                    onChange={e => {
                        if (isIndeterminate) {
                            this.onChange(this.props.attr, true);
                        } else {
                            this.onChange(this.props.attr, e.target.checked);
                        }
                    }}
                    disabled={disabled}
                />}
                label={this.getText(this.props.schema.label)}
            />
            <FormHelperText className={this.props.classes.error}>
                {
                    error ? (this.props.schema.validatorErrorText ? I18n.t(this.props.schema.validatorErrorText) : I18n.t('ra_Error')) :
                        null
                }
            </FormHelperText>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default withStyles(styles)(ConfigCheckbox);
