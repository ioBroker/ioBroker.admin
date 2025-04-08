import React, { type JSX } from 'react';

import {
    InputLabel,
    FormHelperText,
    FormControl,
    Select,
    MenuItem,
    ListSubheader,
    Box,
    Chip,
    ListItemText, Checkbox,
} from '@mui/material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemSelect, ConfigItemSelectOption } from '../types';
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
                selectOptions.push({
                    label: this.getText(item.label, this.props.schema.noTranslation),
                    value: item.value,
                    group: true,
                });
                groupItem.items.forEach(it =>
                    selectOptions.push({
                        label: this.getText(it.label, this.props.schema.noTranslation),
                        value: it.value,
                        hidden: it.hidden,
                    }),
                );
            } else {
                selectOptions.push({
                    label: this.getText(item.label, this.props.schema.noTranslation),
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

    _getValue(): string | string[] {
        let value =
            this.state.value === null || this.state.value === undefined
                ? ConfigGeneric.getValue(this.props.data, this.props.attr)
                : this.state.value;

        if (this.props.schema.multiple) {
            if (typeof value === 'string') {
                value = [value];
            } else if (value === null || value === undefined) {
                value = [];
            }
        }

        return value;
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

        const value = this._getValue();

        const item = this.props.schema.multiple ? null : selectOptions.find(it => it.value == value); // let "==" be and not ===

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
                    multiple={this.props.schema.multiple}
                    disabled={!!disabled}
                    value={value || '_'}
                    renderValue={(val: string | string[]) =>
                        this.props.schema.multiple ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(val as string[]).map((v: string) => {
                                    const it = selectOptions.find(_item => _item.value === v);
                                    if (it || this.props.schema.showAllValues !== false) {
                                        const label = it?.label || v;
                                        return (
                                            <Chip
                                                key={v}
                                                label={label}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </Box>
                        ) : (
                            this.getText(item?.label, this.props.schema.noTranslation)
                        )
                    }
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
                                {this.props.schema.multiple ? (
                                    <Checkbox
                                        checked={value.includes(it.value as string)}
                                        onClick={() => {
                                            const _value = JSON.parse(JSON.stringify(this._getValue()));
                                            const pos = value.indexOf(it.value as string);
                                            if (pos !== -1) {
                                                _value.splice(pos, 1);
                                            } else {
                                                _value.push(it.value);
                                                _value.sort();
                                            }
                                            this.setState({ value: _value }, () =>
                                                this.onChange(this.props.attr, _value),
                                            );
                                        }}
                                    />
                                ) : null}
                                <ListItemText primary={this.getText(it.label, this.props.schema.noTranslation)} />
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
