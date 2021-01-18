// RepositoriesDialog
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

class RepositoriesDialog extends Component 
{
    render()
    {
        const {classes} = this.props;
        return <div className={ classes.tabPanel }>
            <Grid container spacing={3}>
                <Grid item xs={3}>
                    RepositoriesDialog
                </Grid>
                <Grid item xs={9}>
                    RepositoriesDialog
                </Grid>
            </Grid>
        </div>

    }
}


export default withWidth()
(
    withStyles(styles)(
        RepositoriesDialog
    )
);
