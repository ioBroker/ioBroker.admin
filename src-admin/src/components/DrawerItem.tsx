import React, { type JSX } from 'react';

import { Badge, Grid2, ListItemButton, ListItemIcon, ListItemText, Tooltip, Checkbox } from '@mui/material';
import { DragHandle } from '@mui/icons-material';

import { Utils, ColorPicker, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    item: {
        margin: '4px 6px',
        borderRadius: '14px',
        minHeight: 44,
        border: '1px solid transparent',
        transition: 'border-color .15s ease, background .15s ease, transform .15s ease',
    },
    selected: {
        background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.22), rgba(49, 183, 255, 0.1))',
        border: '1px solid rgba(0, 230, 118, 0.45)',
        color: '#f1f6fb',
        boxShadow: '0 0 18px rgba(0, 230, 118, 0.18), inset 0 0 0 1px rgba(0, 230, 118, 0.1)',
        '&:hover': {
            background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.28), rgba(49, 183, 255, 0.12))',
            color: '#f1f6fb',
        },
    },
    selectedIcon: {
        color: '#00e676',
    },
    compactBadge: {
        pl: '12px',
    },
    noWrap: {
        flexWrap: 'nowrap',
        height: 42,
    },
    warn: {
        backgroundColor: '#ffc107',
    },
};

interface DrawerItemProps {
    badgeColor?: 'error' | 'warn' | 'primary' | '';
    badgeContent?: number;
    compact?: boolean;
    icon: JSX.Element;
    onClick?: (e?: React.MouseEvent) => void;
    selected?: boolean;
    text: string;
    editMenuList?: boolean;
    visible?: boolean;
    color?: string;
    editListFunc?: (visible: boolean, color?: string | null) => void;
    badgeAdditionalContent?: number;
    badgeAdditionalColor?: 'error' | '' | 'warn' | 'secondary';
    style?: Record<string, any>;
    theme: IobTheme;
}

const DrawerItem = (props: DrawerItemProps): JSX.Element => {
    const {
        badgeColor,
        badgeContent,
        compact,
        icon,
        onClick,
        selected,
        text,
        editMenuList,
        visible,
        color,
        editListFunc,
        badgeAdditionalContent,
        badgeAdditionalColor,
        style,
    } = props;

    let content = text ? text.replace('&gt;', '>') : '';

    if (content === 'Text->Kommandos') {
        content = 'Text→Cmd';
    } else if (content === 'Text->Commands') {
        content = 'Text→Cmd';
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', ...(style || {}) }}>
            {!!editMenuList && <DragHandle />}
            {!!editMenuList && (
                <Checkbox
                    checked={visible}
                    onClick={() => editListFunc(true)}
                />
            )}
            {!!editMenuList && (
                <ColorPicker
                    value={color}
                    noInputField
                    onChange={value => editListFunc(false, value || null)}
                />
            )}
            <ListItemButton
                sx={Utils.getStyle(props.theme, styles.item, selected && styles.selected, compact && styles.compactBadge)}
                onClick={onClick}
            >
                <Tooltip
                    title={compact ? content : ''}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Grid2
                        container
                        spacing={1}
                        alignItems="center"
                        style={styles.noWrap}
                    >
                        <Grid2>
                            <ListItemIcon
                                style={{ minWidth: 0, color }}
                                sx={selected ? styles.selectedIcon : undefined}
                            >
                                <Badge
                                    badgeContent={badgeContent || 0}
                                    color={(badgeColor === 'warn' ? 'default' : badgeColor) || 'primary'}
                                    sx={badgeColor === 'warn' ? { '& .MuiBadge-badge': styles.warn } : undefined}
                                >
                                    {icon}
                                </Badge>
                            </ListItemIcon>
                        </Grid2>
                        {!compact && (
                            <Grid2>
                                <ListItemText style={{ color }}>
                                    <Badge
                                        badgeContent={badgeAdditionalContent || 0}
                                        color={
                                            (badgeAdditionalColor === 'warn' ? 'default' : badgeAdditionalColor) ||
                                            'primary'
                                        }
                                        sx={
                                            badgeAdditionalColor === 'warn'
                                                ? { '& .MuiBadge-badge': styles.warn }
                                                : undefined
                                        }
                                    >
                                        {content}
                                    </Badge>
                                </ListItemText>
                            </Grid2>
                        )}
                    </Grid2>
                </Tooltip>
            </ListItemButton>
        </div>
    );
};

export default DrawerItem;
