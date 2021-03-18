import { Component, createRef } from 'react';
import PropTypes from "prop-types";

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InputIcon from '@material-ui/icons/Input';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';

import BugReportIcon from '@material-ui/icons/BugReport';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import DevicesIcon from '@material-ui/icons/Devices';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CloseIcon from "@material-ui/icons/Close";
import ViewCompactIcon from '@material-ui/icons/ViewCompact';

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

import InstanceInfo from '../components/InstanceInfo';
import State from '../components/State';
import TabHeader from '../components/TabHeader';
import { InputAdornment, TextField } from '@material-ui/core';
import CardInstances from '../components/CardInstances';
import CustomSelectButton from '../components/CustomSelectButton';

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
    grow: {
        flexGrow: 1
    },
    tableRender: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    },
    cards: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    }
});

// every tab should get their data itself from server
class Instances extends Component {

    constructor(props) {

        super(props);

        this.state = {
            expertMode: this.props.expertMode,
            runningInstances: false,
            dialog: null,
            instances: null,
            dialogProp: null,
            states: null,
            playArrow: false,
            importantDevices: false,
            viewMode: false,
            hostData: null,
            processes: null,
            mem: null,
            percent: null,
            memFree: null,
            filterText: '',
            compact: false,
            compactGroupCount: 0,
            filterCompactGroup: 'All'
        };

        this.columns = {
            instance: { onlyExpert: false },
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

        this.inputRef = createRef();
    }

    async componentDidMount() {
        await this.getData();
        await this.getHostsData();
    }

    async componentWillUnmount() {
        this.subscribeObjects(true);
        this.subscribeStates(true);
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
            const instancesProm = this.props.socket.getAdapterInstances(update);
            const statesProm = this.getStates();
            const objectsProm = this.getObjects();

            const [_instances, states, objects] = await Promise.all(
                [
                    instancesProm,
                    statesProm,
                    objectsProm
                ]
            );
            instances = _instances;
            this.states = states || [];
            this.objects = objects || [];

        } catch (error) {
            console.log(error)
        }

        if (!instances || !this.states || !this.objects) {
            return;
        }

        let memRssId = `system.host.${this.props.currentHostName}.memRss`;
        this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));

        const host = this.states[memRssId];
        let processes = 1;
        let mem = host ? host.val : 0;
        for (let id in instances) {
            if (instances.hasOwnProperty(id)) {
                let inst = instances[id];
                if (!inst || !inst.common) {
                    return
                }
                if (inst.common.host !== this.props.currentHostName) {
                    return
                }
                if (inst.common.enabled && inst.common.mode === 'daemon') {
                    memRssId = inst._id + '.memRss';
                    this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));
                    const m = this.states[memRssId];
                    mem += m ? m.val : 0;
                    processes++;
                }
            }
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
        let compactGroupCount = 0;
        instances.forEach(obj => {
            const common = obj ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];
            if (common.compactGroup && typeof common.compactGroup === 'number' && compactGroupCount < common.compactGroup) {
                compactGroupCount = common.compactGroup;
            }
            const instance = {};
            instance.id = obj._id.replace('system.adapter.', '');
            instance.obj = obj;
            instance.compact = common.compact ? true : false;
            instance.host = common.host;
            instance.name = common.titleLang ? common.titleLang[this.props.lang] : common.title;
            instance.image = common.icon ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
            let links = /*(ws && ws.link) ? ws.link :*/ common.localLinks || common.localLink || '';
            if (typeof links === 'string') {
                links = { _default: links };
            }

            Object.keys(links).forEach(linkName => {
                instance.link = instance.link || [];
                const link = links[linkName];
                instance.link.push(Utils.replaceLink(link, common.name, instanceId, {
                    objects: this.objects,
                    hostname: this.props.hostname,
                    protocol: this.props.protocol
                }));
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

        const compact = await this.props.socket.readBaseSettings(this.props.currentHostName)
            .then(e => e.config.system.compact)
        const importantDevices = JSON.parse(window.localStorage.getItem('Instances.importantDevices'));
        const playArrow = JSON.parse(window.localStorage.getItem('Instances.playArrow'));
        const viewMode = JSON.parse(window.localStorage.getItem('Instances.viewMode'));
        let filterCompactGroup = JSON.parse(window.localStorage.getItem('Instances.filterCompactGroup'));
        if (!filterCompactGroup && filterCompactGroup !== 0) {
            filterCompactGroup = 'All';
        }
        this.setState({
            filterCompactGroup,
            compactGroupCount,
            compact,
            processes,
            mem: Math.round(mem),
            importantDevices,
            playArrow,
            viewMode,
            instances: formatted
        });

        this.subscribeStates();
        this.subscribeObjects();

        //console.log(this.states);
        //console.log(this.objects);
    }

    onStateChange = (id, state) => {
        const oldState = this.states[id];

        this.states[id] = state;

        if ((!oldState && state) || (oldState && !state) || (oldState && state && oldState.val !== state.val)) {
            if (!this.statesUpdateTimer) {
                this.statesUpdateTimer = setTimeout(() => {
                    this.statesUpdateTimer = null;
                    this.forceUpdate();
                }, 300);
            }
        }
    };

    onObjectChange = (id, obj) => {
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
    };

    subscribeStates(isUnsubscribe) {
        const func = isUnsubscribe ? this.props.socket.unsubscribeState : this.props.socket.subscribeState;
        //func('system.adapter.*', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.alive', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.connected', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.inputCount', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.memRss', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.outputCount', this.onStateChange);

        //func('system.host.*', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskFree', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskSize', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskWarning', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.freemem', this.onStateChange);

        func.call(this.props.socket, '*.info.connection', this.onStateChange);
    }

    subscribeObjects(isUnsubscribe) {
        const func = !isUnsubscribe ? this.props.socket.subscribeObject : this.props.socket.unsubscribeObject;
        func.call(this.props.socket, 'system.adapter.*', this.onObjectChange);
        func.call(this.props.socket, 'system.host.*', this.onObjectChange);
    }

    extendObject = (id, data) => {
        this.props.socket.extendObject(id, data, error =>
            error && window.alert(error));
    }

    openConfig = (instance) => {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    getInstanceState(id) {

        const obj = this.objects[id];
        const instance = this.state.instances[id];
        const common = obj ? obj.common : null;
        const mode = common.mode || '';

        let state = mode === 'daemon' ? 'green' : 'blue';

        if (common && common.enabled && (!common.webExtension || !obj.native.webInstance || mode === 'daemon')) {

            const alive = this.states[id + '.alive'];
            const connected = this.states[id + '.connected'];
            const connection = this.states[instance.id + '.info.connection'];

            if (!connected || !connected.val || !alive || !alive.val) {
                state = mode === 'daemon' ? 'red' : 'blue';
            }

            if (connection && !connection.val) {
                state = state === 'red' ? 'red' : 'orange';
            }
        } else {
            state = mode === 'daemon' ? 'grey' : 'blue';
        }

        return state;
    }

    isRunning(id) {

        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return (common.onlyWWW || common.enabled) ? true : false;
    }

    isCompactGroup(id) {

        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return common.compactGroup || null;
    }

    getSchedule = (id) => {
        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return common.schedule ? common.schedule : '';
    }

    getRestartSchedule = (id) => {

        const obj = this.objects[id];
        const common = obj ? obj.common : null;

        return common.restartSchedule ? common.restartSchedule : '';
    }

    getMemory = (id) => {

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

        return this.states[instance.id + '.info.connection'] ? !!this.states[instance.id + '.info.connection'].val : null;
    }

    getHeaders() {

        const headers = [];

        for (const index in this.columns) {

            const column = this.columns[index];

            if (!column.onlyExpert || column.onlyExpert === this.state.expertMode) {
                headers.push(
                    <TableCell key={index}>{index}</TableCell>
                );
            }
        }

        return headers;
    }

    getRows(classes) {

        const rows = this.state.instances.map(instance => {

            return (
                <TableRow key={instance.id} className={classes.tableRow}>
                    <TableCell>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item>
                                <div
                                    className={classes.state + ' ' + classes[instance.state]}
                                />
                            </Grid>
                            <Grid item>
                                <Avatar alt={instance.id} src={instance.image} className={classes.smallAvatar} />
                            </Grid>
                            <Grid item>
                                {instance.id}
                            </Grid>
                        </Grid>
                    </TableCell>
                    <TableCell style={{ padding: 0 }}>
                        <IconButton
                            size="small"
                            onClick={() => this.extendObject('system.adapter.' + instance.id, { common: { enabled: !instance.isRun } })}
                            className={classes.button + ' ' + (instance.canStart ? instance.isRun ? classes.enabled : classes.disabled : classes.hide)}
                        >
                            {instance.isRun ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <IconButton
                            size="small"
                            className={classes.button}
                        >
                            <BuildIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => this.extendObject('system.adapter.' + instance.id, {})}
                            className={classes.button + ' ' + (instance.canStart ? '' : classes.hide)}
                            disabled={!instance.isRun}
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={classes.button}
                        >
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={classes.button + ' ' + (instance.links && instance.links.length ? '' : classes.hide)}
                            disabled={!instance.isRun}
                            onClick={() => window.open(instance.links[0], '_blank')}
                        >
                            <InputIcon />
                        </IconButton>
                    </TableCell>
                    <TableCell>{instance.name}</TableCell>
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
            return <BugReportIcon />;
        } else if (level === 'info') {
            return <InfoIcon />;
        } else if (level === 'warn') {
            return <WarningIcon />;
        } else if (level === 'error') {
            return <ErrorIcon />;
        }

        return null;
    }

    getPanels(classes) {
        let array = Object.keys(this.state.instances).map(id => {
            const instance = this.state.instances[id];
            const running = this.isRunning(id);
            const alive = this.isAlive(id);
            const compactGroup = this.isCompactGroup(id);
            const connectedToHost = this.isConnectedToHost(id);
            const connected = this.isConnected(id);
            const loglevelIcon = this.getLogLevelIcon(instance.loglevel);
            if (this.state.viewMode) {
                return ({
                    render: <CardInstances
                        key={instance.id}
                        name={instance.name}
                        image={instance.image}
                        instance={instance}
                        running={running}
                        compactGroupCount={this.state.compactGroupCount}
                        compactGroup={compactGroup}
                        setCompactGroup={(value) => {
                            this.extendObject('system.adapter.' + instance.id, { common: { compactGroup: value === 0 ? '0' : value } });
                            if (this.state.compactGroupCount < value) {
                                this.setState({ compactGroupCount: value });
                            }
                        }}
                        compact={instance.compact && this.state.compact}
                        id={id}
                        extendObject={this.extendObject}
                        openConfig={this.openConfig}
                        connectedToHost={connectedToHost}
                        alive={alive}
                        connected={connected}
                        getMemory={this.getMemory}
                        loglevelIcon={loglevelIcon}
                        getRestartSchedule={this.getRestartSchedule}
                        expertMode={this.props.expertMode}
                        getSchedule={this.getSchedule}
                    />,
                    running,
                    host: instance.host,
                    name: instance.name,
                    compactGroup,
                })
            }

            return ({
                render: <Accordion key={instance.id} square expanded={this.state.expanded === instance.id} onChange={() => this.handleChange(instance.id)}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                    >
                        <Grid container spacing={1} alignItems="center" direction="row" wrap="nowrap">
                            <Grid
                                item
                                container
                                md={2}
                                spacing={1}
                                alignItems="center"
                                direction="row"
                                wrap="nowrap"
                            >
                                <Grid item>
                                    <Avatar className={classes.smallAvatar + ' ' +
                                        (instance.mode === 'daemon' || instance.mode === 'schedule' ?
                                            classes[this.getInstanceState(id)] : classes.transparent)}
                                    >
                                        {this.getModeIcon(instance.mode)}
                                    </Avatar>
                                </Grid>
                                {this.props.expertMode &&
                                    <Grid item>
                                        <Tooltip title={this.t('loglevel') + ' ' + instance.loglevel}>
                                            <Avatar className={classes.smallAvatar + ' ' + classes[instance.loglevel]}>
                                                {loglevelIcon}
                                            </Avatar>
                                        </Tooltip>
                                    </Grid>
                                }
                                <Grid item>
                                    <Badge color="secondary" variant="dot" invisible={!instance.compactMode}>
                                        <Avatar
                                            variant="square"
                                            alt={instance.id}
                                            src={instance.image}
                                            className={classes.smallAvatar}
                                        />
                                    </Badge>
                                </Grid>
                                <Grid item>
                                    {instance.id}
                                </Grid>
                            </Grid>
                            <Hidden smDown>
                                <Grid item sm={4} lg={3}>
                                    <Typography className={classes.secondaryHeading}>{instance.name}</Typography>
                                </Grid>
                            </Hidden>
                        </Grid>
                        <IconButton
                            size="small"
                            onClick={event => {
                                this.extendObject('system.adapter.' + instance.id, { common: { enabled: !running } });
                                event.stopPropagation();
                            }}
                            onFocus={event => event.stopPropagation()}
                            className={classes.button + ' ' + (instance.canStart ?
                                running ? classes.enabled : classes.disabled : classes.hide)
                            }
                        >
                            {running ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <Hidden xsDown>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => this.openConfig(id)}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Hidden>
                        <IconButton
                            size="small"
                            onClick={event => {
                                this.extendObject('system.adapter.' + instance.id, {});
                                event.stopPropagation();
                            }}
                            onFocus={event => event.stopPropagation()}
                            className={classes.button + ' ' + (instance.canStart ? '' : classes.hide)}
                            disabled={!running}
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            className={classes.button + ' ' + (instance.link ? '' : classes.hide)}
                            disabled={!running}
                            onClick={event => {
                                window.open(instance.link, "_blank")
                                event.stopPropagation();
                            }}
                            onFocus={event => event.stopPropagation()}
                        >
                            <InputIcon />
                        </IconButton>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid
                            container
                            direction="row"
                        >
                            <Grid
                                item
                                container
                                direction="row"
                                xs={10}
                            >
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={12}
                                    sm={6}
                                    md={4}
                                >
                                    <State state={connectedToHost} >
                                        {this.t('Connected to host')}
                                    </State>
                                    <State state={alive} >
                                        {this.t('Heartbeat')}
                                    </State>
                                    {connected !== null &&
                                        <State state={connected}>
                                            {this.t('Connected to %s', instance.adapter)}
                                        </State>
                                    }
                                </Grid>
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={12}
                                    sm={6}
                                    md={4}
                                >
                                    <InstanceInfo
                                        icon={<InfoIcon />}
                                        tooltip={this.t('Installed')}
                                    >
                                        {instance.version}
                                    </InstanceInfo>
                                    <InstanceInfo
                                        icon={<MemoryIcon />}
                                        tooltip={this.t('RAM usage')}
                                    >
                                        {(instance.mode === 'daemon' && running ? this.getMemory(id) : '-.--') + ' MB'}
                                    </InstanceInfo>
                                </Grid>
                                <Grid
                                    item
                                    container
                                    direction="column"
                                    xs={12}
                                    sm={6}
                                    md={4}
                                >
                                    <InstanceInfo
                                        icon={loglevelIcon}
                                        tooltip={this.t('loglevel')}
                                    >
                                        {instance.loglevel}
                                    </InstanceInfo>
                                    <InstanceInfo
                                        icon={<ScheduleIcon />}
                                        tooltip={this.t('schedule_group')}
                                    >
                                        {this.getSchedule(id) || '-'}
                                    </InstanceInfo>
                                    {this.props.expertMode &&
                                        <InstanceInfo
                                            icon={<ScheduleIcon />}
                                            tooltip={this.t('restart')}
                                        >
                                            {this.getRestartSchedule(id) || '-'}
                                        </InstanceInfo>
                                    }
                                </Grid>
                            </Grid>
                            <Grid
                                item
                                container
                                direction="row"
                                xs={2}
                            >
                                <Grid item>
                                    <Hidden smUp>
                                        <IconButton
                                            size="small"
                                            className={classes.button}
                                            onClick={() => this.openConfig(id)}
                                        >
                                            <BuildIcon />
                                        </IconButton>
                                    </Hidden>
                                    <IconButton
                                        size="small"
                                        className={classes.button}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>,
                running,
                host: instance.host,
                name: instance.name
            }
            );
        });

        if (this.state.playArrow) {
            array = array.filter(({ running }) => running)
        }
        if (this.state.importantDevices) {
            array = array.filter(({ host }) => host === this.props.currentHostName)
        }
        if (this.state.filterText) {
            array = array.filter(({ name }) => name.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1)
        }
        if ((this.state.filterCompactGroup || this.state.filterCompactGroup === 0) && this.state.compact) {
            array = array.filter(({ compactGroup }) => compactGroup === this.state.filterCompactGroup ||
                this.state.filterCompactGroup === 'All' ||
                (this.state.filterCompactGroup === 'default' && compactGroup === null) ||
                (this.state.filterCompactGroup === 0 && compactGroup === '0'))
        }
        if (!array.length) {
            return <div style={{
                margin: 20,
                fontSize: 26,
                textAlign: 'center'
            }}>{this.props.t('all items are filtered out')}</div>
        }
        return array.map(({ render }) => render);
    }

    handleChange(panel) {
        this.setState((prevState) => ({
            expanded: prevState.expanded !== panel ? panel : null
        }));
    }
    async getHostsData() {
        this.props.socket.getHostInfo(this.props.idHost)
            .catch(error => {
                console.error(error);
                return error;
            })
            .then(hostData => this.setState({ hostData }));

        let memState;
        let memAvailable = await this.props.socket.getState(`system.host.${this.props.currentHostName}.memAvailable`)
        let freemem = await this.props.socket.getState(`system.host.${this.props.currentHostName}.freemem`)
        let object = await this.props.socket.getObject(`system.host.${this.props.currentHostName}`)
        if (memAvailable) {
            memState = memAvailable;
        } else if (freemem) {
            memState = freemem;
        }
        if (memState) {
            const totalmem = (object?.native.hardware.totalmem / (1024 * 1024));
            const percent = Math.round((memState.val / totalmem) * 100);
            this.setState({
                percent,
                memFree: memState.val
            });
        }
    }

    changeSetStateBool = (value) =>
        this.setState((state) => {
            window.localStorage.setItem(`Instances.${value}`, JSON.stringify(!state[value]));
            return ({ [value]: !state[value] });
        });

    changeCompactGroup = (value) =>
        this.setState((state) => {
            window.localStorage.setItem(`Instances.filterCompactGroup`, JSON.stringify(value));
            return ({ filterCompactGroup: value });
        });

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;
            this.setState({ filterText: value })
        }, 300, event.target.value);
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
                    <Paper className={classes.paper}>
                        <Config
                            className={classes.iframe}
                            adapter={instance.id.split('.')[0]}
                            instance={parseInt(instance.id.split('.')[1])}
                            materialize={instance.materialize}
                            themeName={this.props.themeName}
                            t={this.props.t}
                            configStored={this.props.configStored}
                        />
                    </Paper>
                );
            }
        }

        //if (this.props.width === 'xs' || this.props.width === 'sm') {
        return (
            <TabContainer>
                <TabHeader>
                    <Tooltip title={this.t('Show / hide List')}>
                        <IconButton onClick={() => this.changeSetStateBool('viewMode')}>
                            {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.t('Reload')}>
                        <IconButton onClick={() => this.getData(true)}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.t('Show instances only for current host')}>
                        <IconButton onClick={() => this.changeSetStateBool('importantDevices')}>
                            <DevicesIcon color={this.state.importantDevices ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.t('Show only running instances')}>
                        <IconButton onClick={() => this.changeSetStateBool('playArrow')}>
                            <PlayArrowIcon color={this.state.playArrow ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                    {this.props.expertMode && <Tooltip title={this.t('allow set of compact groups')}>
                        <ViewCompactIcon style={{ margin: 10 }} color={this.state.compact ? 'primary' : 'disabled'} />
                    </Tooltip>}
                    {this.props.expertMode &&
                        this.state.compact &&
                        <CustomSelectButton
                            arrayItem={[{ name: 'All' }, { name: 'default' }, ...Array(this.state.compactGroupCount + 1).fill().map((_, idx) => ({ name: idx }))]}
                            onClick={value => this.changeCompactGroup(value)}
                            value={this.state.filterCompactGroup} />}
                    <div className={classes.grow} />
                    <TextField
                        inputRef={this.inputRef}
                        label={this.t('Filter')}
                        style={{ margin: '5px 0' }}
                        defaultValue=""
                        onChange={event => this.handleFilterChange(event)}
                        InputProps={{
                            endAdornment: (
                                this.state.filterText ? <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            this.inputRef.current.value = '';
                                            this.setState({ filterText: '' });
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </InputAdornment> : null
                            ),
                        }}
                    />
                    <div className={classes.grow} />
                    {this.state.hostData &&
                        `${this.props.t('Disk free')}: ${Math.round(this.state.hostData['Disk free'] / (this.state.hostData['Disk size'] / 100))}%, ${this.props.t('Total RAM usage')}: ${this.state.mem} Mb / ${this.props.t('Free')}: ${this.state.percent}% = ${this.state.memFree} Mb [${this.props.t('Host')}: ${this.props.currentHostName} - ${this.state.processes} ${this.props.t('processes')}]`}
                    {/* <div className={classes.grow} /> */}
                </TabHeader>
                <TabContent overflow="auto">
                    <div className={this.state.viewMode ? classes.cards : ''}>
                        {this.getPanels(classes)}
                    </div>
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