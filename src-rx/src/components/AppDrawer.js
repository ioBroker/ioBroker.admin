import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Drawer from '@material-ui/core/Drawer';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

const styles = {
    root: {
        width: 180,
        flexShrink: 0
    },
    paper: {
        width: 'inherit'
    }
};

class AppDrawer extends React.Component {

    render() {

        const { classes, children } = this.props;

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <SwipeableDrawer
                    anchor="left"
                    open={ this.props.open }
                    onClose={ this.props.onClose }
                    onOpen={ this.props.onOpen }
                    classes={{ paper: classes.paper, }}
                >
                    { children }
                </SwipeableDrawer>
            );
        } else {
            return (
                <Drawer
                    className={ classes.root }
                    variant="persistent"
                    anchor="left"
                    open={ this.props.open }
                    classes={{ paper: classes.paper, }}
                >
                    { children }
                </Drawer>
            );
        }
    }
}

export default withWidth()(withStyles(styles)(AppDrawer));