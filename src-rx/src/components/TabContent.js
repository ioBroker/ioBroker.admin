import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';

const styles = {
    root: {
        height: '100%'
    }
};

class TabContent extends React.Component {

    render() {

        const { classes } = this.props;

        return (
            <Grid
                item
                className={ classes.root }
            >
                { this.props.children }
            </Grid>
        );
    }
}

export default withStyles(styles)(TabContent);