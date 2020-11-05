import { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import clsx from 'clsx';

import Badge from '@material-ui/core/Badge';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import Utils from '../Utils';

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
    }
});

class DrawerItem extends Component {

    render() {

        const { classes } = this.props;
        const text = this.props.text ? this.props.text.replace('&gt;', '>') : '';

        return (
            <ListItem
                button
                className={ clsx({ [classes.selected]: this.props.selected }, this.props.compact && classes.compactBadge) }
                onClick={ this.props.onClick }
            >
                <Grid
                    container
                    spacing={1}
                    alignItems="center"
                    className={ classes.noWrap }
                >
                    <Grid item>
                        <ListItemIcon style={{ minWidth: 0 }}>
                            <Badge
                                badgeContent={ this.props.badgeContent || 0 }
                                color={ this.props.badgeColor || 'primary' }
                            >
                                { this.props.icon }
                            </Badge>
                        </ListItemIcon>
                    </Grid>
                    { !this.props.compact &&
                        <Grid item>
                            <ListItemText>
                                { text }
                            </ListItemText>
                        </Grid>
                    }
                </Grid>
            </ListItem>
        )
    }
}

DrawerItem.propTypes = {
    icon: PropTypes.object,
    onClick: PropTypes.func,
    selected: PropTypes.bool,
    compact: PropTypes.bool,
    text: PropTypes.string,
    badgeContent: PropTypes.number,
    badgeColor: PropTypes.string
};

export default withStyles(styles)(DrawerItem);