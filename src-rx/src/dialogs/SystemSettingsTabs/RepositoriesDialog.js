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

import Utils from '../../Utils';


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
        width:'100%',
        backgroundColor:'transparent',
        marginLeft:40,
        border:'none',
        display:'flex',
        alignItems:'center'
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
        width: '100%'
    }
});

class RepositoriesDialog extends Component 
{
    constructor(props)
    {
        super(props);
        
        this.state={
            // ...props,
            // arr     : arr
        }

    }
    repoToArray(repos) {
        return Utils.objectMap(repos, (repo, name) => {
            return {
                title: name,
                link: repo.link
            }
        });
    }
    arrayToRepo(array) {
        let result = {};
        for (let k in array) {
            result[array[k].title] = {
                link: array[k].link
            }
        }

        return result;
    }
    render()
    {
        const { classes } = this.props; 
        const arr = this.repoToArray(this.props.data.native.repositories);

        // console.log( this.state );
        const rows = arr.map((e, i) =>
        {
            return <TableRow key={i} className="float_row">
                <TableCell className={this.props.classes.littleRow  + ' float_cell '}>
                    {i + 1}
                </TableCell>
                <TableCell className={this.props.classes.nameRow  + ' float_cell'}>                               
                    <TextField 
                        value={e.title}
                        InputLabelProps={{
                            readOnly: false,
                            shrink: true,
                        }} 
                        className={this.props.classes.input + ' xs-centered'}
                        onChange={evt => this.onChangeText(evt, e.title, 'title') }
                    />
                </TableCell>
                <TableCell className= "grow_cell float_cell">
                    <TextField
                        id="default" 
                        value={ e.link }
                        InputLabelProps={{
                            readOnly: false,
                            shrink: true,
                        }}
                        className={this.props.classes.input + " xs-centered"}
                        onChange={evt => this.onChangeText(evt, e.title, 'link') }
                    />
                </TableCell>
                <TableCell className={this.props.classes.littleRow  + " float_cell"}>
                    <Fab
                        size="small"  
                        color="secondary" 
                        aria-label="add" 
                        onClick={evt => this.onDelete( e.title )}
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
                            <TableCell className={this.props.classes.littleRow  + ' float_cell'}> </TableCell>
                            <TableCell className={this.props.classes.nameRow  + ' float_cell' }>
                                {this.props.t('name')}
                            </TableCell>
                            <TableCell className= "grow_cell float_cell">
                                {this.props.t('link')}
                            </TableCell>
                            <TableCell className={this.props.classes.littleRow  + ' float_cell'}> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { rows }                        
                    </TableBody>
                </Table>
            </TableContainer>
        </div>

    }
    onChangeText = (evt, id, name) =>
    {
        const value = evt.target.value; 
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = this.repoToArray(newData.native.repositories);
        array.find(element => element.title == id)[name] = value;
        newData.native.repositories = this.arrayToRepo(array);
        this.props.onChange(newData);
    }
    onDelete = id =>
    {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = this.repoToArray(newData.native.repositories);
        let index = array.findIndex(element => element.title == id);
        delete array[index];
        newData.native.repositories = this.arrayToRepo(array);
        this.props.onChange(newData);
    }
    onAdd = () =>
    {
        let newData = JSON.parse(JSON.stringify(this.props.data))
        let array = this.repoToArray(newData.native.repositories);
        array.push({
            title: '__',
            link: ''
        });
        newData.native.repositories = this.arrayToRepo(array);
        this.props.onChange(newData);
    }
}


export default withWidth()
(
    withStyles(styles)(
        RepositoriesDialog
    )
);
