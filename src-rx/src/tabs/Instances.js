import { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import { CardMedia, Hidden, InputAdornment, TextField } from '@material-ui/core';

import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';
import BugReportIcon from '@material-ui/icons/BugReport';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import DevicesIcon from '@material-ui/icons/Devices';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CloseIcon from '@material-ui/icons/Close';
import ViewCompactIcon from '@material-ui/icons/ViewCompact';
import ScheduleIcon from '@material-ui/icons/Schedule';
import SettingsIcon from '@material-ui/icons/Lens';

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
import TabHeader from '../components/TabHeader';
import InstanceCard from '../components/Instances/InstanceCard';
import CustomSelectButton from '../components/CustomSelectButton';
import InstanceRow from '../components/Instances/InstanceRow';
import sentry from '../assets/sentry.svg'

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
        border: 0,
        backgroundColor: '#FFF',
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
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-539deg) brightness(99%) contrast(97%)'
    },
    contrast0: {
        filter: 'contrast(0%)'
    },
    compactButtons: {
        display: 'inline-block',
        borderRadius: 4,
        border: '1px gray dotted'
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
            filterText: window.localStorage.getItem('instances.filter') || '',
            compact: false,
            compactGroupCount: 0,
            filterCompactGroup: 'All',
            sentry: false,
            delete: false
        };

        this.columns = {
            instance: { onlyExpert: false },
            actions:  { onlyExpert: false },
            title:    { onlyExpert: false },
            schedule: { onlyExpert: false },
            restart:  { onlyExpert: true },
            log:      { onlyExpert: true },
            ramLimit: { onlyExpert: true },
            events:   { onlyExpert: true },
            ram:      { onlyExpert: false }
        };

        this.promises = {};
        this.states = {};
        this.adapters = [];
        this.statesUpdateTimer = null;
        this.wordCache = {};
        this.oneReload = false;

        this.t = this.translate;
        this.inputRef = createRef();
    }

    translate = (word, arg1, arg2) => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    }

    async componentDidMount() {
        await this.getParamsLocalAndPanel();
        await this.props.instancesWorker.registerHandler(this.getInstances);
        await this.getData();
        await this.getHostsData();
    }

    async componentWillUnmount() {
        this.subscribeStates(true);
        this.props.instancesWorker.unregisterHandler(this.getInstances);
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

    getInstances = async data => {
        let instances = [];
        let instancesWorker = await this.props.instancesWorker.getInstances();
        Object.keys(instancesWorker).forEach(el => {
            instances.push(instancesWorker[el]);
        });
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

        instances.sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0));

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
            instance.compact = !!common.compact;
            instance.host = common.host;
            instance.name = common.titleLang ? common.titleLang[this.props.lang] || common.titleLang.en || common.title || '' : common.title;
            instance.image = common.icon ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
            let links = common.localLinks || common.localLink || '';
            if (links && typeof links === 'string') {
                links = { _default: links };
            }

            links && Object.keys(links).forEach(linkName => {
                instance.link = instance.link || [];
                const link = links[linkName];
                instance.link.push(Utils.replaceLink(link, common.name, instanceId, {
                    objects: instancesWorker,
                    hostname: this.props.hostname,
                    protocol: this.props.protocol
                }));
            });

            instance.canStart = !common.onlyWWW;
            instance.config = !common.noConfig;
            instance.materialize = common.materialize || false;
            instance.jsonConfig = !!common.jsonConfig;
            instance.compactMode = common.runAsCompactMode || false;
            instance.mode = common.mode || null;
            instance.loglevel = common.loglevel || null;
            instance.adapter = common.name || null;
            instance.version = common.version || null;

            formatted[obj._id] = instance;
        });

        this.setState({
            compactGroupCount,
            processes,
            mem: Math.round(mem),
            instances: formatted
        });
    }

    getParamsLocalAndPanel = async () => {
        const compact = await this.props.socket.readBaseSettings(this.props.currentHostName)
            .then(e => e.config.system.compact);

        const importantDevices = JSON.parse(window.localStorage.getItem('Instances.importantDevices'));
        const playArrow = JSON.parse(window.localStorage.getItem('Instances.playArrow'));
        const viewMode = JSON.parse(window.localStorage.getItem('Instances.viewMode'));
        let filterCompactGroup = JSON.parse(window.localStorage.getItem('Instances.filterCompactGroup'));
        if (!filterCompactGroup && filterCompactGroup !== 0) {
            filterCompactGroup = 'All';
        }
        this.setState({
            filterCompactGroup,
            compact,
            importantDevices,
            playArrow,
            viewMode,
        });
    }

    async getData(update) {
        try {
            const adapters = this.props.socket.getAdapters(update);
            const statesProm = this.getStates();

            const [states, _adapters] = await Promise.all(
                [
                    statesProm,
                    adapters
                ]
            );
            this.adapters = _adapters || []
            this.states = states || [];

        } catch (error) {
            console.log(error)
        }

        if (!this.states) {
            return;
        }

        if (!this.subscribed) {
            this.subscribed = true;
            this.subscribeStates();
        }
    }

    onStateChange = (id, state) => {
        const oldState = this.states[id];
        this.states[id] = state;
        if ((!oldState && state) || (oldState && !state) || (oldState && state && oldState.val !== state.val)) {
            if (this.state.dialog === 'config' && this.state.dialogProp) {
                this.statesUpdateTimer && clearTimeout(this.statesUpdateTimer);
                this.statesUpdateTimer = null;
                this.shouldUpdateAfterDialogClosed = true;
            } else {
                if (!this.statesUpdateTimer) {
                    this.statesUpdateTimer = setTimeout(() => {
                        this.statesUpdateTimer = null;
                        this.forceUpdate();
                    }, 500);
                }
            }
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

    extendObject = (id, data) => {
        this.props.socket.extendObject(id, data, error =>
            error && window.alert(error));
    }

    openConfig = (instance) => {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    getInstanceState = obj => {
        const common = obj ? obj.common : null;
        const mode = common?.mode || '';
        let state = mode === 'daemon' ? 'green' : 'blue';

        if (common && common.enabled && (!common.webExtension || !obj.native.webInstance || mode === 'daemon')) {
            const alive = this.states[obj._id + '.alive'];
            const connected = this.states[obj._id + '.connected'];
            const connection = this.states[obj._id + '.info.connection'];

            if (!connected?.val || !alive?.val) {
                state = mode === 'daemon' ? 'red' : 'blue';
            }
            if (connection && !connection?.val) {
                state = state === 'red' ? 'red' : 'orange';
            }
        } else {
            state = mode === 'daemon' ? 'grey' : 'blue';
        }

        return state;
    }

    isRunning = obj => {
        return (obj?.common?.onlyWWW || obj?.common?.enabled);
    }

    isCompactGroup = obj => {
        return obj?.common?.compactGroup || null;
    }

    isCompact = obj => {
        return obj?.common?.runAsCompactMode || false;
    }

    isCompactGroupCheck = id => {
        const obj = this.adapters.find(({ _id }) => _id === `system.adapter.${id}`);
        return obj?.common?.compact || false;
    }

    isSentryCheck = id => {
        const obj = this.adapters.find(({ _id }) => _id === `system.adapter.${id}`);
        return obj?.common?.plugins?.sentry || null;
    }

    isSentry = obj => {
        return (!!obj?.common?.plugins?.sentry && !obj?.common?.disableDataReporting) || false;
    }

    getSchedule = obj => {
        return obj?.common?.schedule ? obj.common.schedule : '';
    }

    getName = obj => {
        if (!obj || !obj.common) {
            return '';
        }
        if (obj.common.titleLang) {
            if (typeof obj.common.titleLang === 'string') {
                return obj.common.titleLang;
            } else {
                return obj.common.titleLang[this.props.lang] || obj.common.titleLang.en;
            }
        } else {
            return obj.common.title || '';
        }
    }

    isModeSchedule = obj => {
        return (obj?.common?.mode && obj?.common?.mode === 'schedule') || false;
    }

    isMemoryLimitMB = obj => {
        return obj?.common?.memoryLimitMB;
    }

    getRestartSchedule = obj => {
        return obj?.common?.restartSchedule ? obj.common.restartSchedule : '';
    }

    getMemory = id => {
        const state = this.states[id + '.memRss'];
        return state ? state?.val : 0;
    }

    getInputOutput = id => {
        const stateInput = this.states[id + '.inputCount'];
        const stateOutput = this.states[id + '.outputCount'];
        return {
            stateInput: stateInput?.val ? stateInput.val : 0,
            stateOutput: stateOutput?.val ? stateOutput.val : 0
        }
    }

    isAlive = id => {
        const state = this.states[id + '.alive'];
        return state ? state.val : false;
    }

    isConnectedToHost = id => {
        const state = this.states[id + '.connected'];
        return state ? state.val : false;
    }

    isConnected = id => {
        const instance = this.state.instances[id];
        return this.states[instance.id + '.info.connection'] ? !!this.states[instance.id + '.info.connection'].val : null;
    }

    getHeaders() {
        const headers = [];
        for (const index in this.columns) {
            const column = this.columns[index];
            if (!column.onlyExpert || column.onlyExpert === this.state.expertMode) {
                headers.push(<TableCell key={index}>{index}</TableCell>);
            }
        }
        return headers;
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

    getPanels() {
        let list = Object.keys(this.state.instances).map((id, idx) => {

            const instance = this.state.instances[id];
            const running = this.isRunning(instance.obj);
            const alive = this.isAlive(id);
            const compactGroup = this.isCompactGroup(instance.obj);
            const compact = this.isCompact(instance.obj);
            const supportCompact = instance.compact || false;
            const connectedToHost = this.isConnectedToHost(id);
            const connected = this.isConnected(id);
            const name = this.getName(instance.obj);
            const logLevel = instance.loglevel;
            const tier = instance?.obj?.common?.tier || 3;
            const loglevelIcon = this.getLogLevelIcon(logLevel);
            const checkCompact = this.isCompactGroupCheck(instance.adapter) && this.state.compact;
            const inputOutput = this.getInputOutput(id);
            const mode = this.isModeSchedule(instance.obj);

            const setCompact = () =>
                this.extendObject('system.adapter.' + instance.id, { common: { runAsCompactMode: !compact } });

            const setRestartSchedule = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { restartSchedule: value } });

            const setCompactGroup = value => {
                this.extendObject('system.adapter.' + instance.id, {
                    common: {
                        compactGroup: value === 'controller' ? 0 :
                            value === 'default' ? 1 : parseInt(value, 10)
                    }
                });

                if (this.state.compactGroupCount < value) {
                    this.setState({ compactGroupCount: value });
                }
            }

            const checkSentry = this.isSentryCheck(instance.adapter);
            const currentSentry = this.isSentry(instance.obj);
            const memoryLimitMB = this.isMemoryLimitMB(instance.obj);

            const setSentry = () =>
                this.extendObject('system.adapter.' + instance.id, { common: { disableDataReporting: !!currentSentry } });

            const setTier = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { tier: value } });

            const setName = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { titleLang: value } });

            const setLogLevel = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { loglevel: value } });

            const setSchedule = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { schedule: value } });

            const setMemoryLimitMB = value =>
                this.extendObject('system.adapter.' + instance.id, { common: { memoryLimitMB: value } });

            const deletedInstances = () => {
                this.setState({ delete: true })
                this.props.executeCommand('del ' + instance.id);
            }
            return ({
                render: this.state.viewMode ?
                    <InstanceCard
                        t={this.t}
                        key={instance.id}
                        name={name}
                        image={instance.image}
                        tier={tier}
                        setTier={setTier}
                        instance={instance}
                        running={running}
                        compactGroupCount={this.state.compactGroupCount}
                        compactGroup={compactGroup}
                        compact={compact}
                        supportCompact={supportCompact}
                        setCompact={setCompact}
                        setCompactGroup={setCompactGroup}
                        checkCompact={checkCompact}
                        id={id}
                        extendObject={this.extendObject}
                        openConfig={this.openConfig}
                        connectedToHost={connectedToHost}
                        alive={alive}
                        connected={connected}
                        getMemory={this.getMemory}
                        loglevelIcon={loglevelIcon}
                        getRestartSchedule={() => this.getRestartSchedule(instance.obj)}
                        expertMode={this.props.expertMode}
                        getSchedule={() => this.getSchedule(instance.obj)}
                        checkSentry={checkSentry}
                        currentSentry={currentSentry}
                        setSentry={setSentry}
                        setRestartSchedule={setRestartSchedule}
                        setName={setName}
                        logLevel={logLevel}
                        setLogLevel={setLogLevel}
                        inputOutput={inputOutput}
                        mode={mode}
                        setSchedule={setSchedule}
                        deletedInstances={deletedInstances}
                        memoryLimitMB={memoryLimitMB}
                        setMemoryLimitMB={setMemoryLimitMB}
                    /> :
                    <InstanceRow
                        idx={idx}
                        t={this.t}
                        key={instance.id}
                        name={name}
                        tier={tier}
                        setTier={setTier}
                        image={instance.image}
                        instance={instance}
                        running={running}
                        compactGroupCount={this.state.compactGroupCount}
                        compactGroup={compactGroup}
                        supportCompact={supportCompact}
                        compact={compact}
                        getInstanceState={() => this.getInstanceState(instance.obj)}
                        getModeIcon={this.getModeIcon}
                        setCompact={setCompact}
                        setCompactGroup={setCompactGroup}
                        checkCompact={checkCompact}
                        id={id}
                        extendObject={this.extendObject}
                        openConfig={this.openConfig}
                        connectedToHost={connectedToHost}
                        alive={alive}
                        connected={connected}
                        getMemory={this.getMemory}
                        loglevelIcon={loglevelIcon}
                        getRestartSchedule={() => this.getRestartSchedule(instance.obj)}
                        expertMode={this.props.expertMode}
                        getSchedule={() => this.getSchedule(instance.obj)}
                        handleChange={this.handleChange}
                        expanded={this.state.expanded}
                        checkSentry={checkSentry}
                        currentSentry={currentSentry}
                        setSentry={setSentry}
                        setRestartSchedule={setRestartSchedule}
                        setName={setName}
                        logLevel={logLevel}
                        setLogLevel={setLogLevel}
                        inputOutput={inputOutput}
                        mode={mode}
                        setSchedule={setSchedule}
                        deletedInstances={deletedInstances}
                        memoryLimitMB={memoryLimitMB}
                        setMemoryLimitMB={setMemoryLimitMB}
                    />,
                running,
                host: instance.host,
                name: instance.name,
                nameId: instance.id,
                compactGroup,
                checkCompact,
                sentry: currentSentry
            })
        });

        if (this.state.playArrow) {
            list = list.filter(({ running }) => running);
        }

        if (this.state.importantDevices) {
            list = list.filter(({ host }) => host === this.props.currentHostName)
        }

        if (this.state.filterText) {
            const filterText = this.state.filterText.toLowerCase();
            list = list.filter(({ name, nameId }) => name.toLowerCase().includes(filterText) || nameId.toLowerCase().includes(filterText));
        }

        if (this.props.expertMode && (this.state.filterCompactGroup || this.state.filterCompactGroup === 0) && this.state.compact) {
            list = list.filter(({ compactGroup }) => compactGroup === this.state.filterCompactGroup ||
                this.state.filterCompactGroup === 'All' ||
                (this.state.filterCompactGroup === 'default' && (compactGroup === null || compactGroup === 1)) ||
                (this.state.filterCompactGroup === 'controller' && compactGroup === '0'))
        }
        if (!list.length) {
            return <div style={{
                margin: 20,
                fontSize: 26,
                textAlign: 'center'
            }}>{this.t('all items are filtered out')}</div>
        }
        return list.map(({ render }) => render);
    }

    handleChange = (panel) => {
        this.setState(prevState => ({
            expanded: prevState.expanded !== panel ? panel : null
        }));
    }

    async getHostsData() {
        this.props.socket.getHostInfo(this.props.idHost)
            .catch(error => {
                window.alert('Cannot read host information: ' + error);
                return {};
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

    changeSetStateBool = value =>
        this.setState(state => {
            window.localStorage.setItem(`Instances.${value}`, JSON.stringify(!state[value]));
            return ({ [value]: !state[value] });
        });

    changeCompactGroup = filterCompactGroup => {
        window.localStorage.setItem(`Instances.filterCompactGroup`, JSON.stringify(filterCompactGroup));
        this.setState({ filterCompactGroup });
    };

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;
            this.setState({ filterText: value });
            window.localStorage.setItem('instances.filter', value);
        }, 300, event.target.value);
    }

    render() {
        if (!this.state.instances) {
            return <LinearProgress />;
        }
        const { classes } = this.props;

        if (this.state.dialog === 'config' && this.state.dialogProp) {
            const instance = this.state.instances[this.state.dialogProp] || null;
            if (instance) {
                return <Paper className={classes.paper}>
                    <Config
                        menuPadding={this.props.menuPadding}
                        className={classes.iframe}
                        adapter={instance.id.split('.')[0]}
                        instance={parseInt(instance.id.split('.')[1])}
                        materialize={instance.materialize}
                        jsonConfig={instance.jsonConfig}
                        socket={this.props.socket}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        width={this.props.width}
                        t={this.t}
                        lang={this.props.lang}
                        icon={instance.image}
                        configStored={this.props.configStored}
                        dateFormat={this.props.dateFormat}
                        isFloatComma={this.props.isFloatComma}
                    />
                </Paper>;
            }
        }

        if (this.shouldUpdateAfterDialogClosed) {
            this.shouldUpdateAfterDialogClosed = false;
            if (!this.statesUpdateTimer) {
                if (!this.statesUpdateTimer) {
                    this.statesUpdateTimer = setTimeout(() => {
                        this.statesUpdateTimer = null;
                        this.forceUpdate();
                    }, 300);
                }
            }
        }

        return <TabContainer>
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
                {this.props.hosts.length > 1 ? <Tooltip title={this.t('Show instances only for current host')}>
                    <IconButton onClick={() => this.changeSetStateBool('importantDevices')}>
                        <DevicesIcon color={this.state.importantDevices ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip> : null}
                <Tooltip title={this.t('Show only running instances')}>
                    <IconButton onClick={() => this.changeSetStateBool('playArrow')}>
                        <PlayArrowIcon color={this.state.playArrow ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
                {false && this.props.expertMode && <Tooltip title="sentry">
                    <IconButton
                        size="small"
                        className={classes.button}
                        onClick={() => this.changeSetStateBool('sentry')}
                    >
                        <CardMedia
                            className={clsx(classes.sentry, !this.state.sentry && classes.contrast0)}
                            component="img"
                            image={sentry}
                        />
                    </IconButton>
                </Tooltip>}
                {this.props.expertMode && this.state.compact ?
                    <CustomSelectButton
                        title={this.t('Filter specific compact group')}
                        t={this.t}
                        arrayItem={[
                            { name: 'All' },
                            { name: 'controller' },
                            { name: 'default' },
                            ...Array(this.state.compactGroupCount - 1).fill().map((_, idx) => ({ name: idx + 2 }))
                        ]}
                        buttonIcon={<ViewCompactIcon style={{ marginRight: 4 }} color="primary" />}
                        onClick={value => this.changeCompactGroup(value)}
                        value={this.state.filterCompactGroup} />
                    : null}
                <div className={classes.grow} />
                <TextField
                    inputRef={this.inputRef}
                    label={this.t('Filter')}
                    style={{ margin: '5px 0' }}
                    defaultValue={this.state.filterText}
                    onChange={event => this.handleFilterChange(event)}
                    InputProps={{
                        endAdornment: (
                            this.state.filterText ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        this.inputRef.current.value = '';
                                        this.setState({ filterText: '' });
                                        window.localStorage.setItem('instances.filter', '');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment> : null
                        ),
                    }}
                />
                <div className={classes.grow} />
                <Hidden xsDown>
                    {this.state.hostData &&
                        `${this.t('Disk free')}: ${Math.round(this.state.hostData['Disk free'] / (this.state.hostData['Disk size'] / 100))}%, ${this.t('Total RAM usage')}: ${this.state.mem} Mb / ${this.t('Free')}: ${this.state.percent}% = ${this.state.memFree} Mb [${this.t('Host')}: ${this.props.currentHostName} - ${this.state.processes} ${this.t('processes')}]`}
                </Hidden>
            </TabHeader>
            <TabContent overflow="auto">
                <div className={this.state.viewMode ? classes.cards : ''}>
                    {this.getPanels(classes)}
                </div>
            </TabContent>
        </TabContainer>;
    }
}

Instances.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    ready: PropTypes.bool,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    hostname: PropTypes.string,
    hosts: PropTypes.array,
    protocol: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    theme: PropTypes.object,
    systemLang: PropTypes.string,
    width: PropTypes.string,
    menuPadding: PropTypes.number,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
};

export default withWidth()(withStyles(styles)(Instances));