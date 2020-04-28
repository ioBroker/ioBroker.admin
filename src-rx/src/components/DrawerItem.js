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
    }
});

class DrawerItem extends React.Component {

    render() {
        return (
            <ListItem
                button
                className={ clsx({ [this.props.classes.selected]: this.props.selected }) }
                onClick={ this.props.onClick }>
                <Grid container spacing={ 1 } alignItems="center">
                    <Grid item>
                        <ListItemIcon style={{ minWidth: 0 }}>
                            <Badge badgeContent={ this.props.badgeContent || 0 } color={ this.props.badgeColor || 'primary' }>
                                { this.props.icon }
                            </Badge>
                        </ListItemIcon>
                    </Grid>
                    <Grid item>
                        <ListItemText primary={ this.props.text } />
                    </Grid>
                </Grid>
            </ListItem>
        )
    }
}

DrawerItem.propTypes = {
    icon: PropTypes.object,
    onClick: PropTypes.func,
    selected: PropTypes.bool,
    text: PropTypes.string
};

export default withStyles(styles)(DrawerItem);