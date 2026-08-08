import React, { type JSX } from 'react';

import { Badge, Box, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography, Checkbox } from '@mui/material';
import { DragHandle } from '@mui/icons-material';

import { Utils, ColorPicker, type IobTheme } from '@iobroker/gui-components';
import AdminUtils from '../helpers/AdminUtils';

/** Width of the icon slot - the size of an MUI icon, the largest that occurs here */
const ICON_SIZE = 24;

/** Text color on the filled (selected) item */
const selectedTextColor = (theme: IobTheme): string =>
    theme.palette.mode === 'light' ? 'white' : AdminUtils.invertColor(theme.palette.primary.main, true);

const styles: Record<string, any> = {
    button: {
        // the item is a pill and must not touch the drawer edges
        mx: '4px',
        borderRadius: '8px',
        minHeight: 40,
    },
    selected: (theme: IobTheme) => ({
        // The gradient is built from the palette instead of being taken from the modern themes only,
        // so every theme gets the same look. It has to live here: an `sx` prop always wins over the
        // `MuiListItemButton` override of the theme.
        background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
        color: selectedTextColor(theme),
        '&:hover': {
            background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
            color: selectedTextColor(theme),
        },
    }),
    selectedIcon: (theme: IobTheme) => ({
        color: selectedTextColor(theme),
    }),
    compact: {
        // Symmetric padding on purpose. With the default 16px on the right and 12px on the left the
        // 24px icon ends up right of the pill center, which makes the hover and the selected
        // background look shifted against the icon.
        px: '4px',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '8px',
        width: '100%',
        minHeight: 40,
    },
    rowCompact: {
        justifyContent: 'center',
    },
    badgeCompact: {
        // MUI centers the badge exactly on the icon corner (translate -50%). A two digit badge then
        // sticks out over the left drawer edge, so it is pulled a bit further onto the icon.
        // `:not(.MuiBadge-invisible)` is essential: MUI hides a badge with the content 0 by way of
        // `transform: scale(0)`, and an unconditional transform here would bring all zeros back.
        '& .MuiBadge-badge:not(.MuiBadge-invisible)': {
            transform: 'translate(-35%, -50%)',
        },
    },
    icon: {
        // the SVG is a flex item here - without this it is aligned to the top of the row
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        // `ListItemText` brings 4px margins and the badge changes the line box, which together push
        // the label below the middle of the button
        m: 0,
        '& .MuiTypography-root': {
            // A column, not a row: `ListItemText` wraps label and secondary line in one Typography,
            // and as a row the two would end up next to each other. The vertical centring is done by
            // the surrounding row, see `styles.row`.
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            lineHeight: 1.2,
        },
    },
    secondary: {
        // the rule above turns every Typography into a flex row - the second line keeps its own
        // smaller line height and must not inherit the colour of the primary label
        lineHeight: 1.1,
        opacity: 0.75,
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
    /** Second, quieter line below the label - used for the group of the logged-in user */
    secondaryText?: string;
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
                    onClick={() => editListFunc?.(true)}
                />
            )}
            {!!editMenuList && (
                <ColorPicker
                    value={color}
                    noInputField
                    onChange={value => editListFunc?.(false, value || null)}
                />
            )}
            <ListItemButton
                selected={selected}
                sx={Utils.getStyle(props.theme, styles.button, selected && styles.selected, compact && styles.compact)}
                onClick={onClick}
            >
                <Tooltip
                    title={compact ? content : ''}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Box sx={Utils.getStyle(props.theme, styles.row, compact && styles.rowCompact)}>
                        <ListItemIcon
                            // Fixed slot, set inline so that neither the theme nor `sx` can widen it:
                            // adapter icons arrive as 20px images, MUI icons are 24px. Without it the
                            // label starts 4px further right on every item with a MUI icon.
                            style={{ minWidth: ICON_SIZE, width: ICON_SIZE, color }}
                            sx={Utils.getStyle(props.theme, styles.icon, selected && styles.selectedIcon)}
                        >
                            <Badge
                                badgeContent={badgeContent || 0}
                                color={(badgeColor === 'warn' ? 'default' : badgeColor) || 'primary'}
                                // In the compact drawer there is no room to the right of the icon - a
                                // badge anchored there is cut off by the drawer edge.
                                anchorOrigin={compact ? { vertical: 'top', horizontal: 'left' } : undefined}
                                sx={Utils.getStyle(
                                    props.theme,
                                    badgeColor === 'warn' && { '& .MuiBadge-badge': styles.warn },
                                    compact && styles.badgeCompact,
                                )}
                            >
                                {icon}
                            </Badge>
                        </ListItemIcon>
                        {!compact && (
                            <ListItemText
                                style={{ color }}
                                sx={styles.text}
                            >
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
                                {props.secondaryText ? (
                                    <Typography
                                        component="div"
                                        variant="caption"
                                        color="text.secondary"
                                        sx={styles.secondary}
                                    >
                                        {props.secondaryText}
                                    </Typography>
                                ) : null}
                            </ListItemText>
                        )}
                    </Box>
                </Tooltip>
            </ListItemButton>
        </div>
    );
};

export default DrawerItem;
