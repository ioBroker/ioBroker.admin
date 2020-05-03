import React from 'react';

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
    }
});

class DrawerItem extends React.Component {

    render() {
        return (
            <ListItem
                button
                className={ clsx({ [this.props.classes.selected]: this.props.selected }, this.props.compact && this.props.classes.compactBadge) }
                onClick={ this.props.onClick }>

                {!this.props.compact ?
                    <Grid container spacing={1} alignItems="center">
                        <Grid item>
                            <ListItemIcon style={{minWidth: 0}}>
                                <Badge badgeContent={this.props.badgeContent || 0}
                                       color={this.props.badgeColor || 'primary'}>
                                    {this.props.icon}
                                </Badge>
                            </ListItemIcon>
                        </Grid>
                        <Grid item>
                            <ListItemText primary={this.props.text}/>
                        </Grid>
                    </Grid> :
                    <ListItemIcon style={{minWidth: 0}} >
                        <Badge
                            badgeContent={this.props.badgeContent || 0}
                            color={this.props.badgeColor || 'primary'}
                        >
                            {this.props.icon}
                        </Badge>
                    </ListItemIcon>
                }
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