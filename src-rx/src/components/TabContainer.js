import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Grid } from '@material-ui/core';
import { Paper } from '@material-ui/core';

const styles = {
    root: {
        width: '100%',
        height: '100%'
    },
    overflowHidden: {
        overflow: 'hidden'
    },
    container: {
        height: '100%'
    }
};

class TabContainer extends React.Component {

    render() {

        const { classes } = this.props;
        
        return (
            <Paper
                elevation={ !isNaN(this.props.elevation) ? this.props.elevation : 1 }
                className={ clsx(classes.root, {[classes.overflowHidden]: this.props.overflow !== 'visible'}) }
            >
                <Grid
                    container
                    direction="column"
                    wrap="nowrap"
                    className={ classes.container }
                >
                    { this.props.children }
                </Grid>
            </Paper>
        );
    }
}

TabContainer.propTypes = {
    elevation: PropTypes.number,
    overflow: PropTypes.string
};

export default withStyles(styles)(TabContainer);