import React from 'react';
import PropTypes from "prop-types";

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
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
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import InputIcon from '@material-ui/icons/Input';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';

import BugReportIcon from '@material-ui/icons/BugReport';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';

import MemoryIcon from '@material-ui/icons/Memory';

import ScheduleIcon from '@material-ui/icons/Schedule';
import SettingsIcon from '@material-ui/icons/Settings';

import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

import Router from '@iobroker/adapter-react/Components/Router';

import Config from '../dialogs/Config';
import Utils from '../Utils';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';

import InstanceState from '../components/InstanceState';
import InstanceInfo from '../components/InstanceInfo';

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
        '&:hover': {
            backgroundColor: green[200]
        }
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200]
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
        backgroundColor: green[700]
    },
    red: {
        backgroundColor: red[700]
    },
    grey: {
        backgroundColor: grey[700]
    },
    blue: {
        backgroundColor: blue[700]
    },
    transparent: {
        color: 'transparent',
        backgroundColor: 'transparent'
    },
    paper: {
        height: '100%'
    },
    iframe: {
        height: '100%',
        width: '100%',
        border: 0
    },
    silly: {

    },
    debug: {
        backgroundColor: grey[700]
    },
    info: {
        backgroundColor: blue[700]
    },
    warn: {
        backgroundColor: amber[700]
    },
    error: {
        backgroundColor: red[700]
    },
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
        this.states = {};
        this.objects = {};
        this.statesUpdateTimer = null;
        this.objectsUpdateTimer = null;

        this.t = props.t;

        this.onObjectChangeBound = this.onObjectChange.bind(this);
        this.onStateChangeBound = this.onStateChange.bind(this);
    }

    componentDidMount() {
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

    async getData(update) {

        let instances;

        try {
            instances = await this.props.socket.getAdapterInstances(update);
            this.states = await this.getStates() || [];
            this.objects = await this.getObjects() || [];
        } catch(error) {
            console.log(error)
        }

        if(!instances || !this.states || !this.objects) {
            return;
        }

        const formatted = {};
        
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
            }
            return 0;
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
                objects: this.objects,
                hostname: this.props.hostname,
                protocol: this.props.protocol
            });

            instance.canStart = !common.onlyWWW;
            instance.config = !common.noConfig;
            instance.materialize = common.materialize || false;
            instance.compactMode = common.runAsCompactMode || false;
            instance.mode = common.mode || null;
            instance.loglevel = common.loglevel || null;
            instance.adapter = common.name || null;
            instance.version = common.installedVersion || null;

            formatted[obj._id] = instance;
        });

        this.setState({
            instances: formatted
        });

        this.subscribeStates();
        this.subscribeObjects();

        console.log(this.states);
        console.log(this.objects);
    }

    onStateChange(id, state) {
        
        const oldState = this.states[id];

        this.states[id] = state;

        if (!oldState && state || oldState && !state || oldState && state && oldState.val !== state.val) {
            if (!this.statesUpdateTimer) {
                this.statesUpdateTimer = setTimeout(() => {
                    this.statesUpdateTimer = null;
                    this.forceUpdate();
                }, 300);
            }
        }
    }

    onObjectChange(id, obj) {
        
        if (this.objects[id]) {
            if (obj) {
                this.objects[id] = obj;
            } else {
                delete this.objects[id];
            }
        } else if (this.objects[id]) {
            delete this.objects[id];
        }

        if (!this.objectsUpdateTimer) {
            this.objectsUpdateTimer = setTimeout(() => {
                this.objectsUpdateTimer = null;
                this.forceUpdate();
            }, 300);
        }
    }

    subscribeStates() {
        //this.props.socket.subscribeState('system.adapter.*', this.onStateChangeBound);
        this.props.socket.subscribeState('system.adapter.*.alive', this.onStateChangeBound);
        this.props.socket.subscribeState('system.adapter.*.connected', this.onStateChangeBound);
        this.props.socket.subscribeState('system.adapter.*.inputCount', this.onStateChangeBound);
        this.props.socket.subscribeState('system.adapter.*.memRss', this.onStateChangeBound);
        this.props.socket.subscribeState('system.adapter.*.outputCount', this.onStateChangeBound);

        //this.props.socket.subscribeState('system.host.*', this.onStateChangeBound);
        this.props.socket.subscribeState('system.host.*.diskFree', this.onStateChangeBound);
        this.props.socket.subscribeState('system.host.*.diskSize', this.onStateChangeBound);
        this.props.socket.subscribeState('system.host.*.diskWarning', this.onStateChangeBound);
        this.props.socket.subscribeState('system.host.*.freemem', this.onStateChangeBound);

        this.props.socket.subscribeState('*.info.connection', this.onStateChangeBound);

    }

    subscribeObjects() {
        this.props.socket.subscribeObject('system.adapter.*', this.onObjectChangeBound);
        this.props.socket.subscribeObject('system.host.*', this.onObjectChangeBound);

    }

    extendObject(id, data) {
        this.props.socket.extendObject(id, data, error =>
            error && window.alert(error));
    }
    
    openConfig(instance) {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    getInstanceState(id) {

        const obj = this.objects[id];
        const instance = this.state.instances[id];
        const common = obj ? obj.common : null;
        
        let state = common && common.mode === 'daemon' ? 'green' : 'blue';
        
        if (common && common.enabled && (!common.webExtension || !obj.native.webInstance)) {

            if (!this.states[id + '.connected'] || !this.states[id + '.connected'].val ||
                !this.states[id + '.alive'] || !this.states[id + '.alive'].val) {
                state = (common.mode === 'daemon') ? 'red' : 'blue';
            }

            if (this.states[instance.id + '.info.connection'] && !this.states[instance.id + '.info.connection'].val) {
                state = state === 'red' ? 'red' : 'orange';
            }
        } else {
            state = common && common.mode === 'daemon' ? 'grey' : 'blue';
        }

        return state;
    }

    isRunning(id) {

        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return (common.onlyWWW || common.enabled) ? true : false;
    }

    getSchedule(id) {
        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return common.schedule ? common.schedule : '';
    }

    getRestartSchedule(id) {

        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return common.restartSchedule ? common.restartSchedule : '';
    }

    getMemory(id) {

        const state = this.states[id + '.memRss'];

        return state ? state.val : 0;
    }

    isAlive(id) {

        const state = this.states[id + '.alive'];

        return state ? state.val : false;
    }

    isConnectedToHost(id) {

        const state = this.states[id + '.connected'];

        return state ? state.val : false;
    }

    isConnected(id) {

        const instance = this.state.instances[id];
        
        return this.states[instance.id + '.info.connection'] ? this.states[instance.id + '.info.connection'].val : null;
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

    getModeIcon(mode) {

        if (mode === 'daemon') {
            return <SettingsIcon />;
        } else if (mode === 'schedule') {
           return <ScheduleIcon />
        }

        return null;
    }

    getLogLevelIcon(level) {

        if (level === 'debug') {
            return <BugReportIcon/>;
        } else if (level === 'info') {
            return <InfoIcon/>;
        } else if (level === 'warn') {
            return <WarningIcon/>;
        } else if (level === 'error') {
            return <ErrorIcon/>;
        }

        return null;
    }

    getPanels(classes) {
        return Object.keys(this.state.instances).map(id => {

            const instance = this.state.instances[id];
            const running = this.isRunning(id);
            const alive = this.isAlive(id);
            const connectedToHost = this.isConnectedToHost(id);
            const connected = this.isConnected(id);
            const loglevelIcon = this.getLogLevelIcon(instance.loglevel);

            return (
                <ExpansionPanel key={ instance.id } square expanded={ this.state.expanded === instance.id } onChange={ () => this.handleChange(instance.id ) }>
                    <ExpansionPanelSummary
                        expandIcon={ <ExpandMoreIcon /> }
                    >
                        <Grid container spacing={ 1 } alignItems="center" direction="row" wrap="nowrap">
                            <Grid
                                item
                                container
                                md={ 2 }
                                spacing={ 1 }
                                alignItems="center"
                                direction="row"
                                wrap="nowrap"
                            >
                                <Grid item>
                                    <Avatar className={ classes.smallAvatar + ' ' +
                                        (instance.mode === 'daemon' || instance.mode === 'schedule' ?
                                        classes[this.getInstanceState(id)] : classes.transparent) }
                                    >
                                        { this.getModeIcon(instance.mode) }
                                    </Avatar>
                                </Grid>
                                { this.props.expertMode &&
                                    <Grid item>
                                        <Tooltip title={ this.t('loglevel') + ' ' + instance.loglevel }>
                                            <Avatar className={ classes.smallAvatar + ' ' + classes[instance.loglevel] }>
                                                { loglevelIcon }
                                            </Avatar>
                                        </Tooltip>
                                    </Grid>
                                }
                                <Grid item>
                                    <Badge color="secondary" variant="dot" invisible={ !instance.compactMode }>
                                        <Avatar
                                            variant="square"
                                            alt={ instance.id }
                                            src={ instance.image }
                                            className={ classes.smallAvatar }
                                        />
                                    </Badge>
                                </Grid>
                                <Grid item>
                                    { instance.id }
                                </Grid>
                            </Grid>
                            <Hidden smDown>
                                <Grid item sm={ 4 } lg={ 3 }>
                                    <Typography className={classes.secondaryHeading}>{ instance.name }</Typography>
                                </Grid>
                            </Hidden>
                        </Grid>
                        <IconButton
                            size="small"
                            onClick={ event => {
                                this.extendObject('system.adapter.' + instance.id, {common: {enabled: !running}});
                                event.stopPropagation();
                            } }
                            onFocus={ event => event.stopPropagation() }
                            className={ classes.button + ' ' + (instance.canStart ?
                                running ? classes.enabled : classes.disabled : classes.hide)
                            }
                        >
                            { running ? <PauseIcon /> : <PlayArrowIcon /> }
                        </IconButton>
                        <Hidden xsDown>
                            <IconButton
                                size="small"
                                className={ classes.button }
                                onClick={ () => this.openConfig(id) }
                            >
                                <BuildIcon />
                            </IconButton>
                        </Hidden>
                        <IconButton
                            size="small"
                            onClick={ event => {
                                this.extendObject('system.adapter.' + instance.id, {});
                                event.stopPropagation();
                            } }
                            onFocus={ event => event.stopPropagation() }
                            className={ classes.button + ' ' + (instance.canStart ? '' : classes.hide) }
                            disabled={ !running }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={ classes.button + ' ' + (instance.link ? '' : classes.hide) }
                            disabled={ !running }
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
                        <Grid
                            container
                            direction="row"
                        >
                            <Grid
                                item
                                container
                                direction="row"
                                xs={ 10 }
                            >
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={ 12 }
                                    sm={ 6 }
                                    md={ 4 }
                                >
                                    <InstanceState state={ connectedToHost } >
                                        { this.t('Connected to host') }
                                    </InstanceState>
                                    <InstanceState state={ alive } >
                                        { this.t('Heartbeat') }
                                    </InstanceState>
                                    { connected !== null &&
                                        <InstanceState state={ connected }>
                                            { this.t('Connected to %s', instance.adapter) }
                                        </InstanceState>
                                    }
                                </Grid>
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={ 12 }
                                    sm={ 6 }
                                    md={ 4 }
                                >
                                    <InstanceInfo
                                        icon={ <InfoIcon /> }
                                        tooltip={ this.t('Installed') }
                                    >
                                        { instance.version }
                                    </InstanceInfo>
                                    <InstanceInfo
                                        icon={ <MemoryIcon /> }
                                        tooltip={ this.t('RAM usage') }
                                    >
                                        { (instance.mode === 'daemon' && running ? this.getMemory(id) : '-.--') + ' MB' }
                                    </InstanceInfo>
                                </Grid>
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={ 12 }
                                    sm={ 6 }
                                    md={ 4 }
                                >
                                    <InstanceInfo
                                        icon={ loglevelIcon }
                                        tooltip={ this.t('loglevel') }
                                    >
                                        { instance.loglevel }
                                    </InstanceInfo>
                                    <InstanceInfo
                                        icon={ <ScheduleIcon /> }
                                        tooltip={ this.t('schedule_group') }
                                    >
                                        { this.getSchedule(id) || '-' }
                                    </InstanceInfo>
                                    { this.props.expertMode &&
                                        <InstanceInfo
                                            icon={ <ScheduleIcon /> }
                                            tooltip={ this.t('restart') }
                                        >
                                            { this.getRestartSchedule(id) || '-' }
                                        </InstanceInfo>
                                    }
                                </Grid>
                            </Grid>
                            <Grid
                                item
                                container
                                direction="row"
                                xs={ 2 }
                            >
                                <Grid item>
                                    <Hidden smUp>
                                        <IconButton
                                            size="small"
                                            className={ classes.button }
                                            onClick={ () => this.openConfig(id) }
                                        >
                                            <BuildIcon />
                                        </IconButton>
                                    </Hidden>
                                    <IconButton
                                        size="small"
                                        className={ classes.button }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            );
        });
    }

    handleChange(panel) {
        this.setState((prevState) => ({
            expanded: prevState.expanded !== panel ? panel : null
        }));
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
                            instance={ parseInt(instance.id.split('.')[1]) }
                            materialize={ instance.materialize }
                            themeName={ this.props.themeName }
                            t={ this.props.t }
                            configStored={ this.props.configStored }
                        />
                    </Paper>
                );
            }
        }

        //if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <TabContainer>
                    <TabContent overflow="auto">
                        { this.getPanels(classes) }
                    </TabContent>
                </TabContainer>
            );
        //}

        /*return (
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
        );*/
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
    themeName: PropTypes.string,
    systemLang: PropTypes.string,
};

export default withWidth()(withStyles(styles)(Instances));