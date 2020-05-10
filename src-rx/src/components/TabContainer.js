import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import { Grid } from '@material-ui/core';
import { Paper } from '@material-ui/core';

const styles = {
    root: {
        width: '100%',
        height: '100%',
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
            <Paper className={ classes.root }>
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

export default withStyles(styles)(TabContainer);