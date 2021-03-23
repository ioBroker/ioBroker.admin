// SertificatsDialog.js
import { Component } from 'react';
import clsx from 'clsx';
import Dropzone from 'react-dropzone'

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';

import Fab from '@material-ui/core/Fab'; 
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';

import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';

import blueGrey from '@material-ui/core/colors/blueGrey' 

// icons

const styles = theme => ({
    tabPanel: {
        width:      '100%',
        height:     '100% ',
        overflow:   'auto',
        overflowX:   'hidden',
        padding:    15,
        position:   "relative" 
    },
    tableContainer:{
        zIndex:100
    },
    table: 
    {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
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
    littleRow : 
    {
        width: 110
    },
    nameRow : 
    {
        width: 220
    },
    input : 
    {
        width: "100%"
    } 
});

class SertificatsDialog extends Component 
{
    constructor(props)
    {
        super(props);
        const arr = Object.keys(props.native.certificates)
            .map(e => { return  {data : props.native.certificates[e], title : e} } )
        
        this.state = {
            ...props,
            arr     : arr,
            chclass : false
        }

    }
    render()
    {
        //console.log( this.props );
        const { classes } = this.props; 
        const rows = this.state.arr.map((e, i) =>
        {
            return <TableRow key={e.title + e.data}  className="float_row">
                <TableCell className={this.props.classes.littleRow  + " float_cell"}>
                    {i + 1}
                </TableCell>
                <TableCell className={this.props.classes.nameRow  + " float_cell"}>                               
                    <TextField 
                        defaultValue={e.title}
                        InputLabelProps={{
                            readOnly: false,
                            shrink: true,
                        }} 
                        className={this.props.classes.input + " xs-centered"}
                    />
                </TableCell>
                <TableCell className= "grow_cell float_cell">
                    <TextField
                        id="default" 
                        defaultValue={ e.data }
                        InputLabelProps={{
                            readOnly: false,
                            shrink: true,
                        }}
                        className={this.props.classes.input + " xs-centered"}
                        onChange={evt => this.onChangeText(evt, e.title) }
                    />
                </TableCell>
                <TableCell className={this.props.classes.littleRow  + " float_cell"}>
                    <Fab
                        size="small"  
                        color="secondary" 
                        aria-label="add" 
                        onClick={evt => this.onDelete( i )}
                    >
                       <DeleteIcon />
                    </Fab>
                </TableCell>
            </TableRow>
        })
        return <div className={ classes.tabPanel }>
            <Dropzone 
                noClick 
            >
            {({ getRootProps, getInputProps, acceptedFiles, fileRejections }) => (
                <div {...getRootProps({  
                    className   : clsx( this.state.chclass ? "drop-container drop-dop" : 'drop-container'),
                    onDragEnter : evt => {
                        //console.log( getRootProps(), evt );
                        this.setState({chclass : true}) 
                    },
                    onDragLeave : evt => {
                        //console.log( "onDragLeave", evt, acceptedFiles, fileRejections ) 
                        this.setState({chclass : false}) 
                    },
                    onDrop      : evt => {
                        //console.log( "onDrop", evt, acceptedFiles, fileRejections );
                        if( fileRejections.length > 0 ) 
                        {
                            //console.log( "onDrop fileRejections", fileRejections);
                            let msg = [];
                            fileRejections.map((e =>
                                {
                                    let m = e.file.name + ": ", mm = [];
                                    e.errors.forEach(ee =>
                                        {
                                           mm.push( ee.message );
                                        })
                                    msg.push( m + mm.join( "," ) );   
                                }));
                            alert(msg.join(", "))
                        }
                        if( acceptedFiles.length > 0 )
                        {
                            //console.log( "onDrop acceptedFiles", acceptedFiles);
                            acceptedFiles.map(file =>
                            {
                                var reader = new FileReader();
                                reader.onload = async (e) =>
                                { 
                                    //console.log( file.name ); 
                                    //console.log( e.target.result ); 
                                    let arr = [...this.state.arr];
                                    let name = file.name;
                                    name =  name.split(".");   
                                    name.splice( name.length - 1, 100 ) 
                                    arr.push({
                                        data: e.target.result,
                                        title:  name.join(".")
                                    });
                                    this.setState({arr});
                                    this.updateList(arr);
                                };
                                reader.readAsText(file);
                            })
                            
                        }
                        else if(fileRejections.length == 0)
                        {
                            alert("No files exists")
                        }
                        this.setState({chclass : false}) 
                    }
                })}>
                    <input {...getInputProps()} /> 
                </div>
            )}
            </Dropzone>
            <div className={ classes.buttonPanel }>
                <Fab 
                    size="small"  
                    className="small_size"
                    color="primary" 
                    aria-label="add"
                    onClick={this.onAdd}
                >
                    <AddIcon/>
                </Fab>
                <Paper variant="outlined" className={ classes.descrPanel }>
                    {
                        this.props.t(
                            "вы можете использовать абсолютный путь к сертификату, например '/opt/certs/cert.pem', или просто перетащить файл сюда"
                        )
                    }
                </Paper>
            </div>
            <TableContainer className={classes.tableContainer}>
                <Table className={classes.table} aria-label="customized table">
                    <TableHead>
                        <TableRow className="float_row">
                            <TableCell className={this.props.classes.littleRow  + " float_cell"}> </TableCell>
                            <TableCell className={this.props.classes.nameRow  + " float_cell"}>
                                {this.props.t("name")}
                            </TableCell>
                            <TableCell className= "grow_cell float_cell">
                                {this.props.t("Sertificate")}
                            </TableCell>
                            <TableCell className={this.props.classes.littleRow  + " float_cell"}> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { rows }                        
                    </TableBody>
                </Table>
            </TableContainer>
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
    onDelete = i =>
    {
        let arr = [...this.state.arr];
        arr.splice(i, 1);
        console.log(arr, i )
        this.setState({arr});
        this.updateList(arr);
    }
    onAdd = () =>
    {
        let arr = [...this.state.arr];
        arr.push({
            link: "",
            title: ""  
        });
        this.setState({arr}); 
    }
    updateList( arr )
    {
        let dat = {};
        arr.forEach(ar =>
        {
            dat[ar.title] = ar.data;
        })
        this.props.onChange( 
            "native", 
            {
                ...this.props.native,
                certificates : dat
            }
        );
    }
}


export default withWidth()
(
    withStyles(styles)(
        SertificatsDialog
    )
);



