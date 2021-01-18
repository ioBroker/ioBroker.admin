//StatisticsDialog.js


import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

import blueGrey from '@material-ui/core/colors/blueGrey'


// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        padding:    15,
        backgroundColor: blueGrey[ 50 ]
    }
});

class StatisticsDialog extends Component 
{
    render()
    {
        const {classes} = this.props;
        return <div className={ classes.tabPanel }>
            <Grid container spacing={3}>
                <Grid item xs={4}>
                     StatisticsDialog
                </Grid>
                <Grid item xs={8}>
                    StatisticsDialog
                </Grid>
            </Grid>
        </div>

    }
}


export default withWidth()
(
    withStyles(styles)(
        StatisticsDialog
    )
);

