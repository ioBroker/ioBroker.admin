import React, { type JSX } from 'react';

import { FormControlLabel, Checkbox, FormHelperText, FormControl } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemCheckbox } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigCheckboxProps extends ConfigGenericProps {
    schema: ConfigItemCheckbox;
}

class ConfigCheckbox extends ConfigGeneric<ConfigCheckboxProps, ConfigGenericState> {
    renderItem(error: unknown, disabled: boolean): JSX.Element {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const isIndeterminate = Array.isArray(value);

        return (
            <FormControl
                style={{ width: '100%' }}
                variant="standard"
            >
                <FormControlLabel
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!disabled) {
                            const mayByPromise = this.onChange(this.props.attr, !value);
                            if (mayByPromise instanceof Promise) {
                                void mayByPromise.catch(e => console.error(`Cannot set value: ${e}`));
                            }
                        }
                    }}
                    control={
                        <Checkbox
                            indeterminate={isIndeterminate}
                            checked={!!value}
                            onChange={e => {
                                let mayBePromise: void | Promise<void>;
                                if (isIndeterminate) {
                                    mayBePromise = this.onChange(this.props.attr, true);
                                } else {
                                    mayBePromise = this.onChange(this.props.attr, e.target.checked);
                                }
                                if (mayBePromise instanceof Promise) {
                                    void mayBePromise.catch(e => console.error(`Cannot set value: ${e}`));
                                }
                            }}
                            disabled={disabled}
                        />
                    }
                    label={this.getText(this.props.schema.label)}
                />
                <FormHelperText style={{ color: 'red' }}>
                    {error
                        ? this.props.schema.validatorErrorText
                            ? I18n.t(this.props.schema.validatorErrorText)
                            : I18n.t('ra_Error')
                        : null}
                </FormHelperText>
                {this.props.schema.help ? (
                    <FormHelperText>
                        {this.renderHelp(
                            this.props.schema.help,
                            this.props.schema.helpLink,
                            this.props.schema.noTranslation,
                        )}
                    </FormHelperText>
                ) : null}
            </FormControl>
        );
    }
}

export default ConfigCheckbox;
