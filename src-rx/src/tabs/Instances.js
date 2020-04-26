import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Avatar from '@material-ui/core/Avatar';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InputIcon from '@material-ui/icons/Input';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';

import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

import Router from '@iobroker/adapter-react/Components/Router';

import Config from '../dialogs/Config';

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
        padding: '5px'
    },
    enabled: {
        color: green[400],
        //backgroundColor: green[300],
        '&:hover': {
            backgroundColor: green[200],
        },
        '&:focus': {
            backgroundColor: green[300]
        }
    },
    disabled: {
        color: red[400],
        //backgroundColor: red[300],
        '&:hover': {
            backgroundColor: red[200],
            //color: '#ffffff'
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
    },
    paper: {
        height: '100%'
    },
    iframe: {
        height: '100%',
        width: '100%',
        border: 0
    }
});

class Instances extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expertmode: false,
            runningInstances: false,
            dialog: null,
            dialogProp: null
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

    static getDerivedStateFromProps() {
        return {
            dialog: Router.getLocation().dialog,
            dialogProp: Router.getLocation().id
        }
    }

    openConfig(instance) {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    getHeaders() {

        const headers = [];

        for (const index in this.columns) {

            const column = this.columns[index];

            if (!column.onlyExpert || column.onlyExpert === this.state.expertmode) {
                headers.push(
                    <TableCell key={ index }>{ index }</TableCell>
                );
            }
        }

        return headers;
    }

    getRows(classes) {

        const rows = this.props.instances.map(instance => {

            return (
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
                            onClick={ () => this.props.extendObject('system.adapter.' + instance.id, {common: {enabled: !instance.isRun}}) }
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
                    <TableCell />
                    <TableCell />
                </TableRow>
            );
        });

        return rows;
    }

    getPanels(classes) {

        const panels = [];
        
        for (const id in this.props.instances) {

            const instance = this.props.instances[id];

            panels.push(
                <ExpansionPanel key={ instance.id } square expanded={ this.state.expanded === instance.id } onChange={ () => this.handleChange(instance.id ) }>
                    <ExpansionPanelSummary
                        expandIcon={<ExpandMoreIcon />}
                    >
                        <Grid container spacing={ 1 } alignItems="center">
                            
                            <Grid item md={2}>
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
                            </Grid>
                            <Hidden mdDown>
                                <Grid item>
                                    <Typography className={classes.secondaryHeading}>{ instance.name }</Typography>
                                </Grid>
                            </Hidden>
                        </Grid>
                        <IconButton
                            size="small"
                            onClick={ event => {
                                this.props.extendObject('system.adapter.' + instance.id, {common: {enabled: !instance.isRun}});
                                event.stopPropagation();
                            } }
                            onFocus={ event => event.stopPropagation() }
                            className={ classes.button + ' ' + (instance.canStart ? instance.isRun ? classes.enabled : classes.disabled : classes.hide) }
                        >
                            { instance.isRun ? <PauseIcon /> : <PlayArrowIcon /> }
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button }
                            onClick={ () => this.openConfig(id) }
                        >
                            <BuildIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={ event => {
                                this.props.extendObject('system.adapter.' + instance.id, {});
                                event.stopPropagation();
                            } }
                            onFocus={ event => event.stopPropagation() }
                            className={ classes.button + ' ' + (instance.canStart ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.link ? '' : classes.hide) }
                            disabled={ !instance.isRun }
                            onClick={ event => {
                                window.open(instance.link, "_blank")
                                event.stopPropagation();
                            } }
                            onFocus={ event => event.stopPropagation() }
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
        }

        return panels;
    }

    handleChange(panel) {
        this.setState({
            expanded: (this.state.expanded !== panel) ? panel : null
        });
    }

    render() {

        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }

        const { classes } = this.props;

        if (this.state.dialog === 'config' && this.state.dialogProp) {

            const instance = this.props.instances[this.state.dialogProp] || null;

            if (instance) {
                return (
                    <Paper className={ classes.paper }>
                        <Config
                            className={ classes.iframe }
                            adapter={ instance.id.split('.')[0] }
                            instance={ instance.id.split('.')[1] }
                            materialize={ instance.materialize }
                            t={ this.props.t }
                        />
                    </Paper>
                );
            }
        }

        //if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <div>
                    { this.getPanels(classes) }
                </div>
            );
        //}

        return (
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