import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';

import Badge from '@mui/material/Badge';
import Grid from '@mui/material/Grid';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';

import amber from '@mui/material/colors/amber';

import { Checkbox } from '@mui/material';
import { Utils } from '@iobroker/adapter-react-v5';
import CommonUtils from '../Utils';

const styles = theme => ({
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

const DrawerItem = props => {
    const {
        badgeColor,
        badgeContent,
        classes,
        compact,
        icon,
        onClick,
        selected,
        text,
        editList,
        visible,
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

    return <div style={({ display: 'flex', ...style || {} })}>
        {!!editList && <Checkbox checked={visible} onClick={editListFunc} />}
        <ListItemButton
            className={Utils.clsx({ [classes.selected]: selected }, compact && classes.compactBadge)}
            onClick={onClick}
        >
            <Tooltip title={compact ? content : ''}>
                <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    className={classes.noWrap}
                >
                    <Grid item>
                        <ListItemIcon style={{ minWidth: 0 }} classes={{ root: Utils.clsx(selected && classes.selectedIcon) }}>
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
                            <ListItemText>
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

DrawerItem.propTypes = {
    icon: PropTypes.object,
    onClick: PropTypes.func,
    style: PropTypes.object,
    selected: PropTypes.bool,
    compact: PropTypes.bool,
    text: PropTypes.string,
    themeType: PropTypes.string,
    badgeContent: PropTypes.number,
    badgeColor: PropTypes.oneOf(['', 'default', 'primary', 'secondary', 'error', 'warn']),
};

export default withStyles(styles)(DrawerItem);
