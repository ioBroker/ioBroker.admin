import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import { Drawer as MaterialDrawer } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

const styles = theme => ({
    root: {
        width: 180,
        flexShrink: 0
    },
    paper: {
        width: 'inherit'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    }
});

class Drawer extends React.Component {

    getHeader() {
        return (
            <div className={ this.props.classes.header }>
                <IconButton onClick={ this.props.onClose }>
                    <ChevronLeftIcon />
                </IconButton>
            </div>
        );
    }

    render() {

        const { classes, children } = this.props;

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <SwipeableDrawer
                    className={ classes.root }
                    anchor="left"
                    open={ this.props.open }
                    onClose={ this.props.onClose }
                    onOpen={ this.props.onOpen }
                    classes={{ paper: classes.paper, }}
                >
                    { this.getHeader() }
                    <List>
                        { children }
                    </List>
                </SwipeableDrawer>
            );
        } else {
            return (
                <MaterialDrawer
                    className={ classes.root }
                    variant="persistent"
                    anchor="left"
                    open={ this.props.open }
                    classes={{ paper: classes.paper, }}
                >
                    { this.getHeader() }
                    <List>
                        { children }
                    </List>
                </MaterialDrawer>
            );
        }
    }
}

export default withWidth()(withStyles(styles)(Drawer));