import React from 'react';
import PropTypes from "prop-types";

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

import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

import Router from '@iobroker/adapter-react/Components/Router';

import Config from '../dialogs/Config';
import Utils from '../Utils';

const styles = theme => ({
    root: {
        margin: theme.spacing(1)
    },
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

// every tab should get their data itself from server
class Instances extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            expertMode: this.props.expertMode,
            runningInstances: false,
            dialog: null,
            instances: null,
            dialogProp: null,
            states: null,
        };

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
        };
        
        this.promises = {};
        this.objects = null;

        this.getData();
    }

    getStates(update) {
        if (update) {
            this.promises.states = null;
        }
        this.promises.states = this.promises.states || this.props.socket.getForeignStates('system.adapter.*');

        return this.promises.states;
    }

    static getDerivedStateFromProps(props, state) {
        const location = Router.getLocation();
        
        const newState = {
            dialog: location.dialog,
            dialogProp: location.id
        };
        
        if (props.expertMode !== state.expertMode) {
            newState.expertMode = props.expertMode;
        }
        
        return newState;
    }

    getObjects(update) {
        if (update) {
            this.promises.objects = null;
        }
        this.promises.objects = this.promises.objects || this.props.socket.getForeignObjects('system.adapter.*');
        return this.promises.objects;
    }

    getData(update) {
        let instances;
        let states;
        return this.props.socket.getAdapterInstances(update)
            .then(_instances => {
                instances = _instances;
                return this.getStates(update)
            })
            .then(_states => {
                states = _states;
                return this.getObjects();
            })
            .then(objects => {
                const formatted = {};
                this.objects = objects;
                instances.forEach(obj => this.objects[obj._id] = obj);

                instances.sort((a, b) => {
                    a = a && a.common;
                    b = b && b.common;
                    a = a || {};
                    b = b || {};

                    if (a.order === undefined && b.order === undefined) {
                        if (a.name.toLowerCase() > b.name.toLowerCase()) {
                            return 1;
                        }
                        if (a.name.toLowerCase() < b.name.toLowerCase()) {
                            return -1;
                        }
                        return 0;
                    } else if (a.order === undefined) {
                        return -1;
                    } else if (b.order === undefined) {
                        return 1;
                    } else {
                        if (a.order > b.order) {
                            return 1;
                        }
                        if (a.order < b.order) {
                            return -1;
                        }
                        if (a.name.toLowerCase() > b.name.toLowerCase()) {
                            return 1;
                        }
                        if (a.name.toLowerCase() < b.name.toLowerCase()) {
                            return -1;
                        }
                        return 0;
                    }
                });

                instances.forEach(obj => {
                    const common = obj ? obj.common : null;
                    const objId = obj._id.split('.');
                    const instanceId = objId[objId.length - 1];

                    const instance = {};

                    instance.id    = obj._id.replace('system.adapter.', '');
                    instance.name  = common.titleLang ? common.titleLang[this.props.lang] : common.title;
                    instance.image = common.icon ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
                    const link     = common.localLinks || common.localLink || '';

                    instance.link = Utils.replaceLink(link, common.name, instanceId, {
                        objects,
                        hostname: this.props.hostname,
                        protocol: this.props.protocol
                    });

                    let state = common.mode === 'daemon' ? 'green' : 'blue';

                    if (common.enabled && (!common.webExtension || !obj.native.webInstance)) {
                        if (!states[obj._id + '.connected'] || !states[obj._id + '.connected'].val) {
                            state = (common.mode === 'daemon') ? 'red' : 'blue';
                        }

                        if (!states[obj._id + '.alive'] || !states[obj._id + '.alive'].val) {
                            state = (common.mode === 'daemon') ? 'red' : 'blue';
                        }

                        if (objects[instance.id + '.info.connection']) {
                            const val = states[instance.id + '.info.connection'] ? states[instance.id + '.info.connection'].val : false;

                            if (!val) {
                                state = state === 'red' ? 'red' : 'orange';
                            }
                        }
                    } else {
                        state = common.mode === 'daemon' ? 'grey' : 'blue';
                    }

                    instance.state = state;

                    const isRun = common.onlyWWW || common.enabled;

                    instance.canStart = !common.onlyWWW;
                    instance.config = !common.noConfig;
                    instance.isRun = isRun;
                    instance.materialize = common.materialize || false;

                    formatted[obj._id] = instance;
                });

                this.setState({
                    instances: formatted,
                    states,
                });
            })
            .catch(error => console.log(error));

    }

    extendObject(id, data) {
        this.props.socket.extendObject(id, data, error =>
            error && window.alert(error));
    }
    
    openConfig(instance) {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    getHeaders() {

        const headers = [];

        for (const index in this.columns) {

            const column = this.columns[index];

            if (!column.onlyExpert || column.onlyExpert === this.state.expertMode) {
                headers.push(
                    <TableCell key={ index }>{ index }</TableCell>
                );
            }
        }

        return headers;
    }

    getRows(classes) {

        const rows = this.state.instances.map(instance => {

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
                            onClick={ () => this.extendObject('system.adapter.' + instance.id, {common: {enabled: !instance.isRun}}) }
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
                            onClick={ () => this.extendObject('system.adapter.' + instance.id, {}) }
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
        return Object.keys(this.state.instances).map(id => {
            const instance = this.state.instances[id];
            return <ExpansionPanel key={ instance.id } square expanded={ this.state.expanded === instance.id } onChange={ () => this.handleChange(instance.id ) }>
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
                                this.extendObject('system.adapter.' + instance.id, {common: {enabled: !instance.isRun}});
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
                                this.extendObject('system.adapter.' + instance.id, {});
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
                </ExpansionPanel>;
        });
    }

    handleChange(panel) {
        this.setState({
            expanded: (this.state.expanded !== panel) ? panel : null
        });
    }

    render() {
        if (!this.state.instances) {
            return (
                <LinearProgress />
            );
        }

        const { classes } = this.props;

        if (this.state.dialog === 'config' && this.state.dialogProp) {

            const instance = this.state.instances[this.state.dialogProp] || null;

            if (instance) {
                return (
                    <Paper className={ classes.paper }>
                        <Config
                            className={ classes.iframe }
                            adapter={ instance.id.split('.')[0] }
                            instance={ instance.id.split('.')[1] }
                            materialize={ instance.materialize }
                            t={ this.props.t }
                            configStored={ this.props.configStored }
                        />
                    </Paper>
                );
            }
        }

        //if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <Paper className={ classes.root }>
                    { this.getPanels(classes) }
                </Paper>
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

Instances.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    ready: PropTypes.bool,
    t: PropTypes.func,
    expertMode: PropTypes.bool,
    hostname: PropTypes.string,
    protocol: PropTypes.string,
    socket: PropTypes.object,
    systemLang: PropTypes.string,
};

export default withWidth()(withStyles(styles)(Instances));