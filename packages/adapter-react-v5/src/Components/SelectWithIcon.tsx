import React, { Component } from 'react';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { InputProps } from '@mui/material/Input';

import type { ThemeType, Translate } from '../types';

import { Icon } from './Icon';
import { Utils } from './Utils';
import { I18n } from '../i18n';

const styles: Record<string, React.CSSProperties> = {
    different: {
        opacity: 0.5,
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 8,
    },
};

interface SelectWithIconProps {
    t: Translate;
    lang: ioBroker.Languages;
    themeType: ThemeType;
    value?: string;
    onChange: (id: string) => void;
    disabled?: boolean;
    list?: ioBroker.Object[] | Record<string, ioBroker.Object>; // one of "list"(Array) or "options"(object) is required
    different?: string | boolean;
    label?: string;
    fullWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
    removePrefix?: string;
    allowNone?: boolean;
    inputProps?: InputProps['inputProps'];
    dense?: boolean;
}

interface TextWithIconItem {
    name: string;
    value: string;
    icon?: string;
    color?: string;
}

interface SelectWithIconState {
    list: TextWithIconItem[];
}

export class SelectWithIcon extends Component<SelectWithIconProps, SelectWithIconState> {
    private readonly wordDifferent: string | undefined;

    private timeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: SelectWithIconProps) {
        super(props);

        if (props.different) {
            this.wordDifferent = props.t('ra___different__');
        }

        let list: TextWithIconItem[];
        if (Array.isArray(props.list)) {
            list = props.list.filter(obj => obj?._id && obj.common).map(obj => ({
                name: Utils.getObjectNameFromObj(obj, props.lang)
                    .replace('system.group.', '')
                    .replace('system.user.', '')
                    .replace('enum.rooms.', '')
                    .replace('enum.functions.', ''),
                value: obj._id,
                icon: obj.common?.icon,
                color: obj.common?.color,
            }));
        } else {
            list = Object.values(props.list as Record<string, ioBroker.Object>).filter(obj => obj?._id && obj.common).map(obj => ({
                name: Utils.getObjectNameFromObj(obj, props.lang)
                    .replace('system.group.', '')
                    .replace('system.user.', '')
                    .replace('enum.rooms.', '')
                    .replace('enum.functions.', ''),
                value: obj._id,
                icon: obj.common?.icon,
                color: obj.common?.color,
            }));
        }

        if (props.different && props.value === props.different) {
            list.unshift({ value: props.different, name: this.wordDifferent || '' });
        }

        if (props.allowNone) {
            list.unshift({ value: '', name: I18n.t('ra_none') });
        }

        this.state = {
            list,
        };
    }

    render(): React.JSX.Element {
        if (this.props.allowNone && !this.state.list.find(obj => obj.value === '')) {
            this.timeout =
                this.timeout ||
                setTimeout(() => {
                    this.timeout = null;
                    const list: TextWithIconItem[] = JSON.parse(JSON.stringify(this.state.list));
                    list.unshift({ value: '', name: I18n.t('ra_none') });
                    this.setState({ list });
                }, 100);
        } else if (!this.props.allowNone && this.state.list.find(obj => obj.value === '')) {
            this.timeout =
                this.timeout ||
                setTimeout(() => {
                    this.timeout = null;
                    const list: TextWithIconItem[] = JSON.parse(JSON.stringify(this.state.list));
                    const i = this.state.list.findIndex(obj => obj.value === '');
                    list.splice(i, 1);
                    this.setState({ list });
                }, 100);
        }

        const item = this.state.list.find(
            it =>
                it.value === this.props.value ||
                (this.props.removePrefix && it.value.replace(this.props.removePrefix, '') === this.props.value),
        );

        const style =
            this.props.value === this.props.different
                ? {}
                : {
                      color: item?.color || undefined,
                      backgroundColor: Utils.getInvertedColor(item?.color || '', this.props.themeType),
                  };

        if (this.props.dense && this.props.style) {
            Object.assign(style, this.props.style);
        }

        const select = (
            <Select
                variant="standard"
                disabled={this.props.disabled}
                value={this.props.value}
                slotProps={{
                    input: this.props.inputProps,
                }}
                renderValue={
                    (/* value */) => (
                        <span>
                            {item?.icon ? (
                                <Icon
                                    src={item?.icon}
                                    style={styles.icon}
                                />
                            ) : null}
                            {item?.name}
                        </span>
                    )
                }
                sx={{
                    '&.MuiSelect-root': this.props.value === this.props.different ? styles.different : {},
                }}
                classes={{
                    root: this.props.dense ? this.props.className : '',
                }}
                style={style}
                onChange={el => {
                    if (this.props.different && el.target.value !== this.props.different) {
                        let pos = null;
                        for (let i = 0; i < this.state.list.length; i++) {
                            if (this.state.list[i].value === this.props.different) {
                                pos = i;
                                break;
                            }
                        }
                        if (pos !== null) {
                            const list: TextWithIconItem[] = Utils.clone(this.state.list) as TextWithIconItem[];
                            list.splice(pos, 1);
                            this.setState({ list }, () => this.props.onChange(el.target.value));
                            return;
                        }
                    }

                    this.props.onChange(
                        this.props.removePrefix
                            ? el.target.value.replace(this.props.removePrefix, '')
                            : el.target.value,
                    );
                }}
            >
                {this.state.list.map(el => (
                    <MenuItem
                        style={
                            this.props.different && el.value === this.props.different
                                ? styles.different
                                : {
                                      color: el.color || undefined,
                                      backgroundColor: Utils.getInvertedColor(el.color || '', this.props.themeType),
                                  }
                        }
                        key={el.value}
                        value={el.value}
                    >
                        {el.icon ? (
                            <Icon
                                src={el.icon}
                                style={styles.icon}
                            />
                        ) : null}
                        {el.name}
                    </MenuItem>
                ))}
            </Select>
        );

        if (this.props.dense) {
            return select;
        }

        return (
            <FormControl
                variant="standard"
                fullWidth={!!this.props.fullWidth}
                style={this.props.style}
                className={this.props.className}
            >
                <InputLabel>{this.props.label}</InputLabel>
                {select}
            </FormControl>
        );
    }
}
