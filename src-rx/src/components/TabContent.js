import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Grid } from '@material-ui/core';

const styles = {
    root: {
        height: '100%',
        overflow: 'hidden'
    },
    overflowAuto: {
        overflow: 'auto'
    }
};

class TabContent extends React.Component {

    render() {

        const { classes } = this.props;

        return (
            <Grid
                item
                className={ clsx(classes.root, {[classes.overflowAuto]: this.props.overflow === 'auto'}) }
            >
                { this.props.children }
            </Grid>
        );
    }
}

TabContent.propTypes = {
    overflow: PropTypes.string
};

export default withStyles(styles)(TabContent);