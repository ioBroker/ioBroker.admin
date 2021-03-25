//ACLDialog.js

import React, { Component, Fragment } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles'; 
import { Grid,  Typography, TextField, FormControl, Checkbox  } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';

import blueGrey from '@material-ui/core/colors/blueGrey';

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
        border: "1px solid #AAA",
		paddingLeft:0,
		paddingRight:0
    }
});

class ACLDialog extends Component 
{
    constructor(props)
    {
        super(props);
        // this.state={ 
        //     ...props
        // }

    }
    
    permBits = [[0x400, 0x200], [0x40, 0x20], [0x4, 0x2]];
    
    getTypes( )
    {
        return [
            {
                type:"object",
                title:"Object rights"
            },
            {
                type:"state",
                title:"States rights"
            },
            {
                type:"file",
                title:"File rights"
            }
        ]
    }
    getRights( type )
    {
        let rts = this.props.data.common.defaultNewAcl[ type ]
        let rights = this.permBits.map(bitGroup => bitGroup.map(bit => rts & bit));
        return rights;
    }
    
    getTable( owner )
    {
        const checks = this.getRights( owner );
        // console.log(owner, checks);
        const {classes} = this.props;
        const checkboxes = checks.map((elem, index) =>
        {
            return <Fragment key={index}> 
               <TableCell className={classes.tableCell}>
                   <Checkbox
                       checked={ elem[0] }
                       color="primary"
                       inputProps={{ 'aria-label': 'secondary checkbox' }}
                       onChange={ evt  => this.handleCheck(evt, owner, index, 0)}
                   />
               </TableCell>
               <TableCell className={classes.tableCell}>
                   <Checkbox
                       checked={ elem[1] }
                       color="primary"
                       inputProps={{ 'aria-label': 'secondary checkbox' }}
                       onChange={ evt => this.handleCheck(evt, owner, index, 1)}
                   />
               </TableCell>
           </Fragment>
        });
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
                        { checkboxes }
                    </TableRow>
                                         
                </TableBody>
            </Table>
        </TableContainer>
    }
    doChange = (name, value) => {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.common.defaultNewAcl[name] = value;
        this.props.onChange(newData);
    }
    handleCheck = ( evt, ownerType, elemNum, num ) =>
    {
        // console.log( ownerType, elemNum, num, evt.target.checked );
        let newData = JSON.parse(JSON.stringify(this.props.data))
        newData.common.defaultNewAcl[ownerType] ^= this.permBits[elemNum][num];
        // console.log(state.common.defaultNewAcl[ownerType]);
        this.props.onChange(newData);
    }
    handleChange = (evt, id) =>
    {
        this.doChange(id, evt.target.value)
    }
    render()
    {
        const {classes} = this.props;
        const users = this.props.users.map((elem, index)=>
        {
             return <MenuItem value={ elem._id } key={ index }>
                 { this.props.t(elem.common.name) }
             </MenuItem>   
        } );
        
        const groups = this.props.groups.map((elem, index)=>
        {
             return <MenuItem value={elem._id} key={index}>
                { this.props.t(typeof elem.common.name == 'object' ? elem.common.name['ru'] : elem.common.name) }
             </MenuItem>   
        } );

        const objectRights = this.getTypes( ).map((ee, ii) =>
        {
            return <Grid item lg={4} xs={12} md={6} key={ii}>
                <Typography variant="h6" component="div">
                    {this.props.t( ee.title )}
                </Typography>
                { this.getTable( ee.type ) }
            </Grid>
        })

        return <div className={ classes.tabPanel }>
            <Typography variant="h5" component="div">
                {this.props.t("Access control list")}
            </Typography>
            <Grid container spacing={3}>
                <Grid item lg={3} md={6} xs={12}>
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={"owner" + "-label"}>
                            { this.props.t("Owner user")}
                        </InputLabel>
                        <Select
                            className={classes.formControl}
                            id={"owner"}
                            value={ this.props.data.common.defaultNewAcl.owner }
                            onChange={ evt => this.handleChange(evt, "owner") }
                            displayEmpty 
                            inputProps={{ 'aria-label': 'users' }}
                        > 
                            {users}
                        </Select> 
                    </FormControl>  
                </Grid>
                <Grid item lg={3} md={6} xs={12}>
                    <FormControl className={classes.formControl}>
                        <InputLabel shrink id={"ownerGroup" + "-label"}>
                            { this.props.t("Owner group")}
                        </InputLabel>
                        <Select
                            className={classes.formControl}
                            id={"ownerGroup"}
                            value={  this.props.data.common.defaultNewAcl.ownerGroup }
                            onChange={ evt => this.handleChange(evt, "ownerGroup")  }
                            displayEmpty 
                            inputProps={{ 'aria-label': 'ownerGroup' }}
                        > 
                            {groups}
                        </Select> 
                    </FormControl>  
                </Grid>
            </Grid> 
            <Grid container spacing={3}>
                { objectRights }
               
            </Grid> 
        </div>

    }
}


export default withWidth()
(
    withStyles(styles)(
        ACLDialog
    )
);

