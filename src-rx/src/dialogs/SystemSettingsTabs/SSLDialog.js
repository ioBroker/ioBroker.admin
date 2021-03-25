//SSLDialog.js
import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';


// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        overflowX:   'hidden',
        padding:    15,
        //backgroundColor: blueGrey[ 50 ]
    },
    buttonPanel :
    {
        paddingBottom: 40,
        display:'flex'
    },
    descrPanel:
    {
        width:'100%',
        backgroundColor:'transparent',
        marginLeft:40,
        border:'none',
        display:'flex',
        alignItems:'center'
    },
    formControl: 
    {
        margin: theme.spacing(1),
        minWidth: '100%',
    },
});

class SSLDialog extends Component 
{
    render()
    {
        const { classes, data } = this.props; 
        const {letsEncrypt} = data.native || {};
        return <div className={ classes.tabPanel }>
            <div className={ classes.buttonPanel }>
                <Paper 
                    variant="outlined" 
                    className={ classes.descrPanel }
                    dangerouslySetInnerHTML={{__html: this.props.t('letsnecrypt_help')}}
                />
            </div>
            <Grid container spacing={6}> 
                <Grid item md={3} xs={12}> 
                    <FormControl className={classes.formControl}> 
                        <TextField
                            id="email"
                            label={ this.props.t('Email for account:')}
                            value={ letsEncrypt ? letsEncrypt.email : '' }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'email') }
                        />
                    </FormControl>
                </Grid> 
                <Grid item md={3} xs={12}> 
                    <FormControl className={classes.formControl}> 
                        <TextField
                            id="domains"
                            label={ this.props.t('Domains:')}
                            value={ letsEncrypt ? letsEncrypt.domains : '' }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'domains') }
                        />
                    </FormControl>
                </Grid>
                <Grid item md={3} xs={12}> 
                    <FormControl className={classes.formControl}> 
                        <TextField
                            id="path" 
                            label={ this.props.t('Path to storage:')}
                            value={ letsEncrypt ? letsEncrypt.path : '' }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, 'path') }
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </div>
    }
    onChangeText = (evt, id) =>
    {
        const value = evt.target.value; 
        this.doChange( id, value);
    }

    doChange = (name, value) => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.native.letsEncrypt[name] = value;
        this.props.onChange(newData);
    }
}


export default withWidth()
(
    withStyles(styles)(
        SSLDialog
    )
);



