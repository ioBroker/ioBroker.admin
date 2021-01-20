//ACLDialog.js

import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles'; 
import { Grid,  Typography, TextField, FormControl, Checkbox  } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import blueGrey from '@material-ui/core/colors/blueGrey'


// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
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
        width:"100%",
        backgroundColor:"transparent",
        marginLeft:40,
        border:"none",
        display:'flex',
        alignItems:"center"
    },
    formControl: 
    {
        margin: theme.spacing(1),
        minWidth: "100%",
    },
    tableCell:
    {
        textAlign:"center",
        border: "1px solid #AAA"
    }
});

class ACLDialog extends Component 
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
        const {classes} = this.props;
        return <div className={ classes.tabPanel }>
            <Typography variant="h5" component="div">
                {this.props.t("Access control list")}
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={3}>
                    <FormControl className={classes.formControl}> 
                        <TextField
                            id="owner"
                            label={ this.props.t("Owner user")}
                            defaultValue={ this.state.owner }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "owner") }
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={3}>
                    <FormControl className={classes.formControl}> 
                        <TextField
                            id="ownergroup"
                            label={ this.props.t("Owner group")}
                            defaultValue={ this.state.ownergroup }
                            InputLabelProps={{
                                readOnly: false,
                                shrink: true,
                            }}
                            onChange={evt => this.onChangeText(evt, "ownergroup") }
                        />
                    </FormControl>
                </Grid>
            </Grid> 
            <Grid container spacing={3}>
                <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                        {this.props.t("Object rights")}
                    </Typography>
                    { this.getTable() }
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                        {this.props.t("States rights")}
                    </Typography>
                    { this.getTable() }
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="h6" component="div">
                        {this.props.t("File rights")}
                    </Typography>
                    { this.getTable() }
                </Grid>
            </Grid> 
        </div>

    }
    getTable()
    {
        const {classes} = this.props;
        return <TableContainer>
            <Table className={classes.table} aria-label="customized table">
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t("Owner")}
                        </TableCell>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t("Group")}
                        </TableCell>
                        <TableCell colSpan={2} className={classes.tableCell}>
                            {this.props.t("Everyone")}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("read")}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("write")}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("read")}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("write")}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("read")}
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            {this.props.t("write")}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <Checkbox
                                defaultChecked
                                color="primary"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            />
                        </TableCell>
                    </TableRow>
                                         
                </TableBody>
            </Table>
        </TableContainer>
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
        ACLDialog
    )
);

