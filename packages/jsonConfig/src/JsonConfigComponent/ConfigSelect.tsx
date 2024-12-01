import React, { type JSX } from 'react';

import { InputLabel, FormHelperText, FormControl, Select, MenuItem, ListSubheader } from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemSelect, ConfigItemSelectOption } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, any> = {
    fullWidth: {
        width: '100%',
    },
    noMargin: {
        '&>div': {
            marginTop: 0,
        },
    },
};

interface ConfigInstanceSelectProps extends ConfigGenericProps {
    schema: ConfigItemSelect;
}

interface ConfigInstanceSelectState extends ConfigGenericState {
    selectOptions?: { label: string; value: number | string; group?: boolean; hidden?: string | boolean }[];
}

class ConfigSelect extends ConfigGeneric<ConfigInstanceSelectProps, ConfigInstanceSelectState> {
    private initialValue: string | string[] = '';

    componentDidMount(): void {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        const selectOptions: {
            label: string;
            value: number | string;
            group?: boolean;
            hidden?: string | boolean;
        }[] = [];

        (this.props.schema.options || []).forEach(item => {
            // if optgroup
            const groupItem: {
                items: ConfigItemSelectOption[];
                label: ioBroker.StringOrTranslated;
                value?: number | string;
                hidden?: string | boolean;
            } = item as {
                items: ConfigItemSelectOption[];
                label: ioBroker.StringOrTranslated;
                value?: number | string;
                hidden?: string | boolean;
            };
            if (Array.isArray(groupItem.items)) {
                selectOptions.push({ label: this.getText(item.label), value: item.value, group: true });
                groupItem.items.forEach(it =>
                    selectOptions.push({
                        label: this.getText(it.label),
                        value: it.value,
                        hidden: it.hidden,
                    }),
                );
            } else {
                selectOptions.push({
                    label: this.getText(item.label),
                    value: item.value,
                    hidden: item.hidden,
                });
            }
        });

        // if __different
        if (Array.isArray(value)) {
            this.initialValue = [...value];
            selectOptions.unshift({
                label: I18n.t(ConfigGeneric.DIFFERENT_LABEL),
                value: ConfigGeneric.DIFFERENT_VALUE,
            });
            this.setState({ value: ConfigGeneric.DIFFERENT_VALUE, selectOptions });
        } else {
            this.setState({ value, selectOptions });
        }
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element {
        if (!this.state.selectOptions) {
            return null;
        }

        const selectOptions = (this.state.selectOptions || []).filter(item => {
            // if optgroup or no hidden function
            if (!item.hidden) {
                return true;
            }

            if (this.props.custom) {
                return !this.executeCustom(
                    item.hidden,
                    this.props.data,
                    this.props.customObj,
                    this.props.oContext.instanceObj,
                    this.props.arrayIndex,
                    this.props.globalData,
                );
            }
            return !this.execute(
                item.hidden,
                this.props.schema.default,
                this.props.data,
                this.props.arrayIndex,
                this.props.globalData,
            );
        });

        const item = selectOptions.find(it => it.value == this.state.value); // let "==" be and not ===

        return (
            <FormControl
                variant="standard"
                fullWidth
                sx={this.props.table !== undefined && styles.noMargin}
                id={`jsonSelect_${this.props.attr}_${this.props.index || this.props.index === 0 ? this.props.index : ''}`}
            >
                {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
                <Select
                    variant="standard"
                    error={!!error}
                    disabled={!!disabled}
                    value={this.state.value || '_'}
                    renderValue={() => this.getText(item?.label, this.props.schema.noTranslation)}
                    onChange={e => {
                        this.setState({ value: e.target.value === '_' ? '' : e.target.value }, () => {
                            let mayBePromise: void | Promise<void>;
                            if (this.state.value === ConfigGeneric.DIFFERENT_VALUE) {
                                mayBePromise = this.onChange(this.props.attr, this.initialValue);
                            } else {
                                mayBePromise = this.onChange(this.props.attr, this.state.value);
                            }
                            if (mayBePromise instanceof Promise) {
                                mayBePromise.catch(e => console.error(e));
                            }
                        });
                    }}
                >
                    {selectOptions.map((it, i) => {
                        if (it.group) {
                            return (
                                <ListSubheader key={i}>
                                    {this.getText(it.label, this.props.schema.noTranslation)}
                                </ListSubheader>
                            );
                        }
                        return (
                            <MenuItem
                                key={i}
                                value={it.value}
                                style={it.value === ConfigGeneric.DIFFERENT_VALUE ? { opacity: 0.5 } : {}}
                            >
                                {this.getText(it.label, this.props.schema.noTranslation)}
                            </MenuItem>
                        );
                    })}
                </Select>
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

export default ConfigSelect;
