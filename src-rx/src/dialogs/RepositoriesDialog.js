// RepositoriesDialog
import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab'; 

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';

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
        //backgroundColor: blueGrey[ 50 ]
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

class RepositoriesDialog extends Component 
{
    constructor(props)
    {
        super(props);
        const arr = Object.keys(props)
            .filter((e,i) => props[e] && typeof props[e].link === "string" )
                .map(e => { return  {...props[e], title:e} } )
        
        this.state={
            ...props,
            arr     : arr
        }

    }
    render()
    {
        const { classes } = this.props; 
        // console.log( this.state );
        const rows = this.state.arr.map((e, i) =>
        {
            return <TableRow key={e.title + e.link} className="float_row">
                <TableCell className={this.props.classes.littleRow  + " float_cell "}>
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
                        defaultValue={ e.link }
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
            <div className={ classes.buttonPanel }>
                <Fab 
                    size="small"  
                    color="primary" 
                    aria-label="add"
                    onClick={this.onAdd}
                    className="small_size" 
                >
                    <AddIcon/>
                </Fab>
                <Paper variant="outlined" className={ classes.descrPanel }>
                    
                </Paper>
            </div>
            <TableContainer>
                <Table className={classes.table} aria-label="customized table">
                    <TableHead>
                        <TableRow className="float_row">
                            <TableCell className={this.props.classes.littleRow  + " float_cell"}> </TableCell>
                            <TableCell className={this.props.classes.nameRow  + " float_cell" }>
                                {this.props.t("name")}
                            </TableCell>
                            <TableCell className= "grow_cell float_cell">
                                {this.props.t("link")}
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
        // console.log( id, value );
        let state = {...this.state};
        state[id] = value;
        this.setState(state);        
    }
    onDelete = i =>
    {
        let arr = [...this.state.arr];
        arr.splice(i, 1);
        // console.log(arr, i )
        this.setState({arr});
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
}


export default withWidth()
(
    withStyles(styles)(
        RepositoriesDialog
    )
);
