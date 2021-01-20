//SSLDialog.js
import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';  
import InputLabel from '@material-ui/core/InputLabel'; 
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';

import AddIcon from '@material-ui/icons/Add';

import blueGrey from '@material-ui/core/colors/blueGrey'


// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        padding:    15,
        backgroundColor: blueGrey[ 50 ]
    },
    buttonPanel :
    {
        paddingBottom: 40,
        display:'flex'
    },
    descrPanel:
    {
        width:"100%",
        backgroundColor:"transparent",
        marginLeft:40,
        border:"none",
        display:'flex',
        alignItems:"center"
    },
});

class SSLDialog extends Component 
{
    constructor(props)
    {
        super(props);
        this.state={ 
            ...props
        }

    }
    render()
    {
        const { classes } = this.props; 
        return <div className={ classes.tabPanel }>
            <div className={ classes.buttonPanel }>
                <Fab 
                    size="small"  
                    color="primary" 
                    aria-label="add"
                    onClick={this.onAdd}
                >
                    <AddIcon />
                </Fab>
                <Paper 
                    variant="outlined" 
                    className={ classes.descrPanel }
                    dangerouslySetInnerHTML={{__html: this.props.t("letsnecrypt_help")}}
                />
            </div>
            <Grid container spacing={6}> 
                <Grid item xs={3}> 
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={ "city-label"}>
                            { this.props.t("Email for account:")}
                        </InputLabel>
                        <TextField
                            id="email"
                            label="email"
                            defaultValue={ this.state.email }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "email") }
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={3}> 
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={ "city-label"}>
                            { this.props.t("Email for account:")}
                        </InputLabel>
                        <TextField
                            id="email"
                            label="email"
                            defaultValue={ this.state.email }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "email") }
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </div>
    }
    onChangeText = (evt, id) =>
    {
        const value = evt.target.value; 
        this.props.onChange( id, value);
        console.log( id, value );
        let state = {...this.state};
        state[id] = value;
        this.setState(state);        
    }
}


export default withWidth()
(
    withStyles(styles)(
        SSLDialog
    )
);



