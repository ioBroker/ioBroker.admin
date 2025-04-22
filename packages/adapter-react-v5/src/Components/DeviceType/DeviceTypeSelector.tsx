import React, { useEffect } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { Types } from '@iobroker/type-detector';

import { I18n } from '../../i18n';
import { Icon } from '../Icon';
import type { ThemeType } from '../../types';

import { DeviceTypeIcon } from './DeviceTypeIcon';
import { extendDeviceTypeTranslation } from './deviceTypeTranslations';

const styles: Record<
    'itemChildrenWrapper' | 'type' | 'selectIcon' | 'selectText' | 'iconWrapper' | 'iconStyle' | 'emptyIcon',
    React.CSSProperties
> = {
    itemChildrenWrapper: {
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
    },
    type: {
        marginTop: 10,
    },
    selectIcon: {
        paddingRight: 8,
        verticalAlign: 'middle',
        width: 20,
        height: 20,
    },
    selectText: {
        verticalAlign: 'middle',
    },
    iconWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    iconStyle: {
        width: 16,
        height: 16,
        margin: '0 3px',
    },
    emptyIcon: {
        width: 16,
        height: 16,
        margin: '0 3px',
    },
};

export function DeviceTypeSelector(props: {
    themeType: ThemeType;
    supportedDevices?: Types[];
    unsupportedDevices?: Types[];
    value?: Types | '';
    onChange: (value: Types) => void;
    label?: string;
    style?: React.CSSProperties;
    sx?: Record<string, any>;
    disabled?: boolean;
    error?: boolean;
    /** Show icons for applications: google, amazon, material, alias. Used in devices */
    showApplications?: {
        TYPE_OPTIONS: Partial<Record<Types, Record<string, boolean>>>;
        ICONS_TYPE: Record<string, React.JSX.Element>;
    };
}): React.JSX.Element {
    const [typesWords, setTypesWords] = React.useState<Partial<Record<Types, string>>>({});
    const [types, setTypes] = React.useState<Types[] | null>([]);

    useEffect(() => {
        const _typesWords: Partial<Record<Types, string>> = {};
        Object.keys(Types)
            .filter(
                id => props.supportedDevices?.includes(id as Types) && !props.unsupportedDevices?.includes(id as Types),
            )
            .forEach(typeId => (_typesWords[typeId as Types] = I18n.t(`type-${Types[typeId as Types]}`)));

        // sort types by ABC in the current language
        const _types: Types[] = Object.keys(_typesWords) as Types[];

        _types.sort((a, b) => {
            if (_typesWords[a as Types] === _typesWords[b as Types]) {
                return 0;
            }
            return _typesWords[a as Types]!.localeCompare(_typesWords[b as Types]!, 'de');
        });

        extendDeviceTypeTranslation();

        setTypes(_types);
        setTypesWords(_typesWords);
    }, [props.supportedDevices, props.unsupportedDevices]);

    if (!types) {
        return (
            <Box
                style={{
                    ...styles.type,
                    ...props.style,
                }}
                sx={props.sx}
            />
        );
    }

    return (
        <FormControl
            style={{
                ...styles.type,
                ...props.style,
            }}
            sx={props.sx}
            variant="standard"
            error={!!props.error}
        >
            <InputLabel>{props.label || I18n.t('type-Device type')}</InputLabel>
            <Select
                variant="standard"
                disabled={!!props.disabled}
                value={props.value}
                onChange={e => props.onChange(e.target.value as Types)}
            >
                {types.map(typeId => (
                    <MenuItem
                        key={Types[typeId]}
                        value={Types[typeId]}
                    >
                        <div style={styles.itemChildrenWrapper}>
                            <div>
                                <DeviceTypeIcon
                                    type={Types[typeId]}
                                    style={{
                                        ...styles.selectIcon,
                                        color: props.themeType === 'dark' ? '#FFFFFF' : '#000',
                                    }}
                                />
                                <span style={styles.selectText}>{typesWords[typeId]}</span>
                            </div>
                            {props.showApplications?.TYPE_OPTIONS[typeId] ? (
                                <div style={styles.iconWrapper}>
                                    {Object.keys(props.showApplications.TYPE_OPTIONS[typeId]).map(key =>
                                        props.showApplications.TYPE_OPTIONS[typeId][key] ? (
                                            <Icon
                                                key={key}
                                                style={styles.iconStyle}
                                                src={props.showApplications.ICONS_TYPE[key]}
                                            />
                                        ) : (
                                            <div
                                                key={key}
                                                style={styles.emptyIcon}
                                            />
                                        ),
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
