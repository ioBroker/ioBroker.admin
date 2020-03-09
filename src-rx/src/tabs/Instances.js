import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Avatar from '@material-ui/core/Avatar';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import InputIcon from '@material-ui/icons/Input';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';

import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

const styles = theme => ({
    table: {
        minWidth: 650,
    },
    tableRow: {
        '&:nth-of-type(odd)': {
            backgroundColor: grey[300],
        },
        '&:nth-of-type(even)': {
            backgroundColor: grey[200],
        }
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    button: {
        margin: 0,        
        borderRadius: '2px',
        padding: '5px',
        backgroundColor: '#ffffff',
        '&:hover': {
            backgroundColor: blue[500],
            color: '#ffffff'
        },
        '&:focus': {
            backgroundColor: '#ffffff'
        }
    },
    enabled: {
        backgroundColor: green[300],
        '&:hover': {
            backgroundColor: green[300],
            color: '#ffffff'
        },
        '&:focus': {
            backgroundColor: green[300]
        }
    },
    disabled: {
        backgroundColor: red[300],
        '&:hover': {
            backgroundColor: red[300],
            color: '#ffffff'
        },
        '&:focus': {
            backgroundColor: red[300]
        }
    },
    hide: {
        visibility: 'hidden'
    },
    state: {
        width: theme.spacing(2),
        height: theme.spacing(2),
        borderRadius: '100%'
    },
    green: {
        backgroundColor: 'green'
    },
    red: {
        backgroundColor: 'red'
    },
    grey: {
        backgroundColor: 'grey'
    }
});

class Instances extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expertmode: false,
            runningInstances: false
        }

        this.columns = {
            instance: { onlyExpert: false},
            actions: { onlyExpert: false },
            title: { onlyExpert: false },
            schedule: { onlyExpert: false },
            restart: { onlyExpert: true },
            log: { onlyExpert: true },
            ramLimit: { onlyExpert: true },
            events: { onlyExpert: true },
            ram: { onlyExpert: false }
        }
    }

    getHeaders() {

        const headers = [];

        for(const index in this.columns) {

            const column = this.columns[index];

            if(!column.onlyExpert || column.onlyExpert === this.state.expertmode) {
                headers.push(
                    <TableCell key={ index }>{ index }</TableCell>
                );
            }
        }

        return headers;
    }

    getRows(classes) {

        const rows = this.props.instances.map((instance, index) => {

            return(
                <TableRow key={ instance.id } className={ classes.tableRow }>
                    <TableCell>
                        <Grid container  spacing={ 1 } alignItems="center">
                            <Grid item>
                                <div
                                    className={ classes.state + ' ' + classes[instance.state] }
                                />
                            </Grid>
                            <Grid item>
                                <Avatar alt={ instance.id } src={ instance.image } className={ classes.smallAvatar }/>
                            </Grid>
                            <Grid item>
                                { instance.id }
                            </Grid>
                        </Grid>
                    </TableCell>
                    <TableCell style={{padding: 0}}>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.canStart ? instance.isRun ? classes.enabled : classes.disabled : classes.hide) }
                        >
                            { instance.isRun ? <PauseIcon /> : <PlayArrowIcon /> }
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button }
                        >
                            <BuildIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={ () => this.props.extendObject('system.adapter.' + instance.id, {}) }
                            className={ classes.button + ' ' + (instance.canStart ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button }
                        >
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.link ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                            onClick={ ()=> window.open(instance.link, "_blank") }
                        >
                            <InputIcon />
                        </IconButton>
                    </TableCell>
                    <TableCell>{ instance.name }</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                </TableRow>
            );
        });

        return rows;
    }

    getPanels(classes) {

        const panels = this.props.instances.map((instance, index) => {

            return(
                <ExpansionPanel key={ instance.id } square expanded={ this.state.expanded === instance.id } onChange={ () => this.handleChange(instance.id ) }>
                    <ExpansionPanelSummary>
                        <Grid container spacing={ 1 } alignItems="center">
                            <Grid item>
                                <div
                                    className={ classes.state + ' ' + classes[instance.state] }
                                />
                            </Grid>
                            <Grid item>
                                <Avatar alt={ instance.id } src={ instance.image } className={ classes.smallAvatar }/>
                            </Grid>
                            <Grid item>
                                { instance.id }
                            </Grid>
                        </Grid>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.canStart ? instance.isRun ? classes.enabled : classes.disabled : classes.hide) }
                        >
                            { instance.isRun ? <PauseIcon /> : <PlayArrowIcon /> }
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button }
                        >
                            <BuildIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={ () => this.props.extendObject('system.adapter.' + instance.id, {}) }
                            className={ classes.button + ' ' + (instance.canStart ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.link ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                            onClick={ ()=> window.open(instance.link, "_blank") }
                        >
                            <InputIcon />
                        </IconButton>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Typography>
                            { instance.name }
                        </Typography>
                        <IconButton
                            size="small"
                            className={ classes.button }
                        >
                            <DeleteIcon />
                        </IconButton>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex,
                        sit amet blandit leo lobortis eget. Lorem ipsum dolor sit amet, consectetur adipiscing
                        elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            );
        });

        return panels;
    }

    handleChange(panel) {
        this.setState({
            expanded: panel
        });
    }

    render() {

        if(!this.props.ready) {
            return(
                <LinearProgress />
            );
        }

        const { classes } = this.props;

        if(this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <div>
                    { this.getPanels(classes) }
                </div>
              );
        }

        return(
            <TableContainer component={ Paper }>
                <Table className={ classes.table } size="small">
                    <TableHead>
                        <TableRow>
                            { this.getHeaders() }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { this.getRows(classes) }
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

export default withWidth()(withStyles(styles)(Instances));