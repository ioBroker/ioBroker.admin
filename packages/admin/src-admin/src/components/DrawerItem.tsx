import React from 'react';

import { withStyles } from '@mui/styles';

import {
    Badge,
    Grid,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Checkbox,
} from '@mui/material';
import { DragHandle } from '@mui/icons-material';

import { amber } from '@mui/material/colors';

import { Utils, ColorPicker, type IobTheme } from '@iobroker/adapter-react-v5';
import CommonUtils from '../Utils';

const styles: Record<string, any> = (theme: IobTheme) => ({
    selected: {
        background: theme.palette.primary.main,
        color: theme.palette.mode === 'light' ? 'white' : CommonUtils.invertColor(theme.palette.primary.main, true),
        '&:hover': {
            color: theme.palette.primary.main,
            '& $selectedIcon': {
                color: theme.palette.primary.main,
            },
        },
    },
    selectedIcon: {
        color: theme.palette.mode === 'light' ? 'white' : CommonUtils.invertColor(theme.palette.primary.main, true),
    },
    compactBadge: {
        paddingLeft: 12,
    },
    noWrap: {
        flexWrap: 'nowrap',
        height: 40,
    },
    warn: {
        backgroundColor: amber[500],
    },
});

interface DrawerItemProps {
    badgeColor?:  'error' | 'warn' | 'primary' | '';
    badgeContent?: number;
    classes: Record<string, string>;
    compact?: boolean;
    icon: React.JSX.Element;
    onClick?: (e?: React.MouseEvent) => void;
    selected?: boolean;
    text: string;
    editMenuList?: boolean;
    visible?: boolean;
    color?: string;
    editListFunc?: (visible: boolean, color?: string | null) => void;
    badgeAdditionalContent?: number;
    badgeAdditionalColor?:  'error' | '' | 'warn';
    style?: Record<string, any>;
}

const DrawerItem = (props: DrawerItemProps) => {
    const {
        badgeColor,
        badgeContent,
        classes,
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

    return <div style={({ display: 'flex', alignItems: 'center', ...style || {} })}>
        {!!editMenuList && <DragHandle />}
        {!!editMenuList && <Checkbox checked={visible} onClick={() => editListFunc(true)} />}
        {!!editMenuList && <ColorPicker value={color} noInputField onChange={value => editListFunc(false, value || null)} />}
        <ListItemButton
            className={Utils.clsx(selected && classes.selected, compact && classes.compactBadge)}
            onClick={onClick}
        >
            <Tooltip title={compact ? content : ''} componentsProps={{ popper: { sx: { pointerEvents: 'none' } } }}>
                <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    className={classes.noWrap}
                >
                    <Grid item>
                        <ListItemIcon style={{ minWidth: 0, color }} classes={{ root: selected ? classes.selectedIcon : undefined }}>
                            <Badge
                                badgeContent={badgeContent || 0}
                                color={(badgeColor === 'warn' ? 'default' : badgeColor) || 'primary'}
                                classes={badgeColor === 'warn' ? { badge: classes.warn } : {}}
                            >
                                {icon}
                            </Badge>
                        </ListItemIcon>
                    </Grid>
                    {!compact &&
                        <Grid item>
                            <ListItemText style={{ color }}>
                                <Badge
                                    badgeContent={badgeAdditionalContent || 0}
                                    color={(badgeAdditionalColor === 'warn' ? 'default' : badgeAdditionalColor) || 'primary'}
                                    classes={badgeAdditionalColor === 'warn' ? { badge: classes.warn } : {}}
                                >
                                    {content}
                                </Badge>
                            </ListItemText>
                        </Grid>}
                </Grid>
            </Tooltip>
        </ListItemButton>
    </div>;
};

export default withStyles(styles)(DrawerItem);
