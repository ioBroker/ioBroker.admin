import PropTypes from 'prop-types';
import clsx from 'clsx';

import { withStyles } from '@material-ui/core/styles';

import Badge from '@material-ui/core/Badge';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import amber from '@material-ui/core/colors/amber';

import Utils from '../Utils';
import { Checkbox } from '@material-ui/core';

const styles = theme => ({
    selected: {
        background: theme.palette.secondary.main,
        color: Utils.invertColor(theme.palette.secondary.main, true),
        '&:hover': {
            color: theme.palette.text.primary
        }
    },
    compactBadge: {
        paddingLeft: 12,
    },
    noWrap: {
        flexWrap: 'nowrap',
        height: 40
    },
    warn: {
        backgroundColor: amber[500]
    }
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
        editList,visable,editListFunc
    } = props;

    const content = text ? text.replace('&gt;', '>') : '';

    return (<div style={{display:'flex'}}>

        { !!editList && 
            <Checkbox checked={visable} onChange={editListFunc}/>
        
        }
        <ListItem
            button
            className={clsx({ [classes.selected]: selected }, compact && classes.compactBadge)}
            onClick={onClick}
        >
            <Grid
                container
                spacing={1}
                alignItems="center"
                className={classes.noWrap}
            >
                <Grid item>
                    <ListItemIcon style={{ minWidth: 0 }}>
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
                            {content}
                        </ListItemText>
                    </Grid>
                }
            </Grid>
        </ListItem></div>
    );
}

DrawerItem.propTypes = {
    icon: PropTypes.object,
    onClick: PropTypes.func,
    selected: PropTypes.bool,
    compact: PropTypes.bool,
    text: PropTypes.string,
    badgeContent: PropTypes.number,
    badgeColor: PropTypes.oneOf(['', 'default', 'primary', 'secondary', 'error', 'warn'])
};

export default withStyles(styles)(DrawerItem);