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
import { Hidden, InputAdornment, TextField } from '@material-ui/core';

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
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ListIcon from '@material-ui/icons/List';
import {FaFilter as FilterListIcon} from 'react-icons/fa';

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
import InstanceRow from '../components/Instances/InstanceRow';
import CustomSelectButton from '../components/CustomSelectButton';
import { instanceFilterDialogCallback } from '../components/Instances/InstanceFilterDialog';
import InstanceCategory from '../components/Instances/InstanceCategory';

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
        //backgroundColor: '#FFF',
        color: '#000',
        borderRadius: 4,
        boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        border: '0px solid #888'
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
    },
    okSymbol: {
        width: 20,
        height: 20,
        margin: 2,
        borderRadius: 2,
        //border: '2px solid #00000000',
    },
    okSymbolInner: {
        width: 'calc(100% - 2px)',
        height: 'calc(100% - 2px)',
        borderRadius: 2,
        margin: 1,
        backgroundColor: '#66bb6a',
    },
    square: {
        width: 24,
        height: 24,
        filter: theme.palette.type === 'dark' ? 'brightness(0) invert(1)' : 'grayscale(100%)',
        opacity: theme.palette.type === 'dark' ? 1 : 0.8
    },
    primary: {
        filter: 'invert(0%) sepia(90%) saturate(300%) hue-rotate(-537deg) brightness(99%) contrast(97%)'
    },
    filterActive: {
        color: theme.palette.primary.main
    }
});

// every tab should get their data itself from server
class Instances extends Component {
    constructor(props) {
        super(props);

        let expandedFolder = [];
        if (window.localStorage.getItem('Instances.expandedFolder')) {
            try {
                expandedFolder = JSON.parse(window.localStorage.getItem('Instances.expandedFolder'))
            } catch (e) {

            }
        }

        this.state = {
            expertMode: this.props.expertMode,
            runningInstances: false,
            dialog: null,
            instances: null,
            dialogProp: null,
            states: null,
            playArrow: false,
            onlyCurrentHost: false,
            viewMode: false,
            viewCategory: false,
            folderOpen: false,
            hostData: null,
            processes: null,
            mem: null,
            percent: null,
            memFree: null,
            filterText: window.localStorage.getItem('instances.filter') || '',
            compact: false,
            maxCompactGroupNumber: 1,
            filterCompactGroup: 'All',
            sentry: false,
            deleting: null,
            deleteCustomSupported: false,

            expandedFolder,

            //filter
            filterMode: window.localStorage.getItem('Instances.filterMode') ?
                window.localStorage.getItem('Instances.filterMode') === 'null' ?
                    null :
                    window.localStorage.getItem('Instances.filterMode') : null,
            filterStatus: window.localStorage.getItem('Instances.filterStatus') ?
            window.localStorage.getItem('Instances.filterStatus') === 'null' ?
                null :
                window.localStorage.getItem('Instances.filterStatus') : null,
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
        await this.getInstances();
        const deleteCustomSupported = await this.props.socket.checkFeatureSupported('DEL_INSTANCE_CUSTOM');
        deleteCustomSupported && this.setState({deleteCustomSupported});
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
        const start = Date.now();
        let instances = [];
        let instancesWorker = await this.props.instancesWorker.getInstances();

        Object.keys(instancesWorker).forEach(el =>
            instances.push(instancesWorker[el]));

        let memRssId = `${this.props.currentHost}.memRss`;
        this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));

        const host = this.states[memRssId];
        let processes = 1;
        let mem = host ? host.val : 0;
        for (let i = 0; i < instances.length; i++) {
            let inst = instances[i];
            if (!inst || !inst.common) {
                return
            }
            /*if (inst.common.host !== this.props.currentHostName) {
                return
            }*/
            if (inst.common.enabled && inst.common.mode === 'daemon') {
                memRssId = inst._id + '.memRss';
                this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));
                const m = this.states[memRssId];
                mem += m ? m.val : 0;
                processes++;
            }
        }

        const formatted = {};

        instances.sort((a, b) => {
            const pA = a._id.split('.');
            const pB = b._id.split('.');
            const numA = parseInt(pA[pA.length - 1], 10);
            const numB = parseInt(pB[pB.length - 1], 10);
            const nameA = pA[pA.length - 2];
            const nameB = pB[pB.length - 2];

            if (nameA === nameB) {
                return numA > numB ? 1 : (numA < numB ? -1 : 0);
            } else {
                return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
            }
        });

        let maxCompactGroupNumber = 1;
        const newState = {};

        instances.forEach(obj => {
            const common = obj ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];

            if (common.compactGroup && typeof common.compactGroup === 'number' && maxCompactGroupNumber < common.compactGroup) {
                maxCompactGroupNumber = common.compactGroup;
            }

            const instance = {};
            instance.id = obj._id.replace('system.adapter.', '');
            instance.obj = obj;
            instance.compact = !!common.compact;
            instance.host = common.host;
            instance.name = common.titleLang ? common.titleLang[this.props.lang] || common.titleLang.en || common.title || '' : common.title;
            instance.image = common.icon ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
            instance.enabled = common.enabled;

            if (instance.name && typeof instance.name === 'object') {
                instance.name = instance.name[this.props.lang] || instance.name.en || '';
            }

            let links = common.localLinks || common.localLink || '';
            if (links && typeof links === 'string') {
                links = { _default: links };
            }

            const names = links ? Object.keys(links) : [];

            names.forEach(linkName => {
                instance.links = instance.links || [];
                let link = links[linkName];
                if (typeof link === 'string') {
                    link = { link };
                }

                const urls = Utils.replaceLink(link.link, common.name, instanceId, {
                    objects: instancesWorker,
                    hostname: this.props.hostname,
                    protocol: this.props.protocol,
                    port: this.props.port,
                    hosts: this.props.hosts,
                    adminInstance: this.props.adminInstance,
                }) || [];

                if (urls.length === 1) {
                    instance.links.push({
                        name: linkName === '_default' ? (names.length === 1 ? '' : this.t('default')) : this.t(linkName),
                        link: urls[0].url,
                        port: urls[0].port,
                        color: link.color,
                    });
                } else if (urls.length > 1) {
                    urls.forEach(item => {
                        instance.links.push({
                            name: linkName === '_default' ? (names.length === 1 ? '' : this.t('default')) : this.t(linkName),
                            link: item.url,
                            port: item.port,
                            color: link.color,
                        });
                    });
                }
            });

            instance.canStart = !common.onlyWWW;
            instance.config = common.adminUI.config !== 'none';
            instance.jsonConfig = common.adminUI.config === 'json';
            instance.materialize = common.adminUI.config === 'materialize';
            instance.compactMode = common.runAsCompactMode || false;
            instance.mode = common.mode || null;
            instance.loglevel = common.loglevel || null;
            instance.adapter = common.name || null;
            instance.version = common.version || null;

            formatted[obj._id] = instance;
        });

        console.log('getInstances: ' + (Date.now() - start));

        if (this.state.deleting && !formatted['system.adapter.' + this.state.deleting]) {
            newState.deleting = null;
        }

        newState.maxCompactGroupNumber = maxCompactGroupNumber;
        newState.processes = processes;
        newState.mem = Math.round(mem);
        newState.instances = formatted;

        this._cacheList = null;
        this.setState(newState);
    }

    getParamsLocalAndPanel = async () => {
        const compact = await this.props.socket.readBaseSettings(this.props.currentHost)
            .then(e => !!e.config?.system?.compact)
            .catch(e => window.alert(`Cannot read compact mode by host "${this.props.currentHost}": ${e}`));

        const onlyCurrentHost = JSON.parse(window.localStorage.getItem('Instances.onlyCurrentHost'));
        const playArrow = JSON.parse(window.localStorage.getItem('Instances.playArrow'));
        const viewMode = JSON.parse(window.localStorage.getItem('Instances.viewMode'));
        const viewCategory = JSON.parse(window.localStorage.getItem('Instances.viewCategory'));
        let filterCompactGroup = JSON.parse(window.localStorage.getItem('Instances.filterCompactGroup'));
        if (!filterCompactGroup && filterCompactGroup !== 0) {
            filterCompactGroup = 'All';
        }

        this._cacheList = null;
        this.setState({
            filterCompactGroup,
            compact,
            onlyCurrentHost,
            playArrow,
            viewMode,
            viewCategory
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
                        this._cacheList = null;
                        this.forceUpdate();
                    }, 1000);
                }
            }
        }
    };

    subscribeStates(isUnsubscribe) {
        const func = isUnsubscribe ? this.props.socket.unsubscribeState : this.props.socket.subscribeState;
        // func('system.adapter.*', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.alive', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.connected', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.inputCount', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.memRss', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.outputCount', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.logLevel', this.onStateChange);
        //func('system.host.*', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskFree', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskSize', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskWarning', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.freemem', this.onStateChange);
        func.call(this.props.socket, '*.info.connection', this.onStateChange);
    }

    extendObject = (id, data) => {
        this.props.socket.extendObject(id, data)
            .catch(error => window.alert(error));
    }

    openConfig = (instance) => {
        Router.doNavigate('tab-instances', 'config', instance);
    }

    // returns:
    // grey   - daemon / disabled
    // green  - daemon / run,connected,alive
    // blue   - schedule
    // orangeDevice - daemon / run, connected to controller, not connected to device
    // orange - daemon / run,not connected
    // red    - daemon / not run, not connected
    getInstanceStatus = obj => {
        const common = obj ? obj.common : null;
        const mode = common?.mode || '';
        let status = mode === 'daemon' ? 'green' : 'blue';

        if (common && common.enabled && (!common.webExtension || !obj.native.webInstance || mode === 'daemon')) {
            const alive = this.states[obj._id + '.alive'];
            const connected = this.states[obj._id + '.connected'];
            const connection = this.states[(obj._id).replace('system.adapter.', '') + '.info.connection'];

            if (!connected?.val || !alive?.val) {
                status = mode === 'daemon' ? 'red' : 'orangeDevice';
            }
            if (connection && !connection?.val && status !== 'red') {
                status = 'orange';
            }
        } else {
            status = mode === 'daemon' ? 'grey' : 'blue';
        }

        return status;
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

    getSentrySettings = obj => {
        return !!obj?.common?.plugins?.sentry || false;
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
                return obj.common.titleLang[this.props.lang] || obj.common.titleLang.en || '';
            }
        } else {
            if (obj.common.title && typeof obj.common.title === 'object') {
                return obj.common.title[this.props.lang] || obj.common.title.en || '';
            } else {
                return obj.common.title || '';
            }
        }
    }

    isModeSchedule = obj => {
        return (obj?.common?.mode && obj?.common?.mode === 'schedule') || false;
    }

    getMemoryLimitMB = obj => {
        return obj?.common?.memoryLimitMB;
    }

    getInstanceHost = obj => {
        return obj?.common?.host;
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
        return this.states[instance.id + '.info.connection'] ? this.states[instance.id + '.info.connection'].val : null;
    }

    getHeaders() {
        const headers = [];
        Object.keys(this.columns).forEach((column, index) => {
            if (!column.onlyExpert || column.onlyExpert === this.state.expertMode) {
                headers.push(<TableCell key={index}>{index}</TableCell>);
            }
        });

        return headers;
    }

    getModeIcon = (mode, status, className) => {
        if (mode === 'daemon') {
            if (status === 'orange') {
                return <WarningIcon className={className}/>;
            } else if (status === 'green') {
                return <div className={clsx(className, this.props.classes.okSymbol)}><div className={this.props.classes.okSymbolInner}/></div>;
            } else {
                return <SettingsIcon className={className} />;
            }
        } else if (mode === 'schedule') {
            return <ScheduleIcon className={className} />
        }
        return null;
    }

    getStatusFilter = value => {
        switch (value){
            case 'not_alive':
                return 'red';

            case 'alive_no_device':
                return 'orangeDevice';

            case 'alive_not_connected':
                return 'orange';

            case 'ok':
                return 'green';

            case 'disabled':
            default:
                return 'grey';
        }
    };

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

    setSentry = instance =>
        this.extendObject('system.adapter.' + instance.id, { common: { disableDataReporting: !!this.isSentry(instance.obj) } });

    setTier = (instance, value) =>
        this.extendObject('system.adapter.' + instance.id, { common: { tier: value } });

    setName = (instance, value) =>
        this.extendObject('system.adapter.' + instance.id, { common: { titleLang: value } });

    setLogLevel = (instance, value, logOnTheFlyValue) => {
        if (logOnTheFlyValue) {
            this.props.socket.setState(`system.adapter.${instance.id}.logLevel`, value);
        } else {
            this.extendObject('system.adapter.' + instance.id, { common: { loglevel: value } });
        }
    };

    setSchedule = (instance, value) => {
        if (value) {
            this.extendObject('system.adapter.' + instance.id, { common: { schedule: value } });
        } else {
            this.props.socket.getObject('system.adapter.' + instance.id)
                .then(obj => {
                    if (obj.common.schedule) {
                        delete obj.common.schedule;
                        return this.props.socket.setObject(obj._id, obj);
                    }
                });
        }
    };

    setMemoryLimitMB = (instance, value) =>
        this.extendObject('system.adapter.' + instance.id, { common: { memoryLimitMB: value } });

    onDeleteInstance = (instance, deleteCustom) => {
        this.setState({ deleting: instance.id }, () =>
            this.props.executeCommand(`del ${instance.id}${deleteCustom ? ' --custom' : ''}`));
    }

    setCompact = instance =>
        this.extendObject('system.adapter.' + instance.id, { common: { runAsCompactMode: !this.isCompact(instance.obj) } });

    setRestartSchedule = (instance, value) => {
        if (value) {
            this.extendObject('system.adapter.' + instance.id, { common: { restartSchedule: value } });
        } else {
            this.props.socket.getObject('system.adapter.' + instance.id)
                .then(obj => {
                    if (obj.common.restartSchedule) {
                        delete obj.common.restartSchedule;
                        return this.props.socket.setObject(obj._id, obj);
                    }
                });
        }
    };

    setHost = (instance, value) =>
        this.extendObject('system.adapter.' + instance.id, { common: { host: value } });

    setCompactGroup = (instance, value) => {
        this.extendObject('system.adapter.' + instance.id, {
            common: {
                compactGroup: value === 'controller' ? 0 :
                    value === 'default' ? 1 : parseInt(value, 10)
            }
        });

        if (this.state.maxCompactGroupNumber < value) {
            this._cacheList = null;
            this.setState({ maxCompactGroupNumber: value });
        }
    }

    cacheInstances() {
        const currentHostNoPrefix = this.props.currentHost.replace(/^system.host./, '');

        this._cacheList = Object.keys(this.state.instances).map(id => {
            const instance        = this.state.instances[id];
            const running         = this.isRunning(instance.obj);
            const compactGroup    = this.isCompactGroup(instance.obj);
            const checkCompact    = this.isCompactGroupCheck(instance.adapter) && this.state.compact;
            const alive           = this.isAlive(id);
            const compact         = this.isCompact(instance.obj);
            const supportCompact  = instance.compact || false;
            const connectedToHost = this.isConnectedToHost(id);
            const connected       = this.isConnected(id);
            const name            = this.getName(instance.obj);
            const logLevel        = this.states[`${id}.logLevel`]?.val || instance.loglevel;
            const logLevelObject  = instance.loglevel;
            const tier            = instance?.obj?.common?.tier || 3;
            const loglevelIcon    = this.getLogLevelIcon(logLevel);
            const inputOutput     = this.getInputOutput(id);
            const modeSchedule    = this.isModeSchedule(instance.obj);
            const memoryLimitMB   = this.getMemoryLimitMB(instance.obj);

            const checkSentry     = this.getSentrySettings(instance.obj); // is it possible to enable/disable sentry for this adapter
            const currentSentry   = this.isSentry(instance.obj);

            return {
                id,
                running,
                host: instance.host,
                nameId: instance.id,
                compactGroup,
                checkCompact,
                mode: instance.mode,
                sentry: currentSentry,
                category: instance.obj.common.type || 'other',
                status: this.getInstanceStatus(instance.obj),
                alive,
                compact,
                supportCompact,
                connectedToHost,
                connected,
                name,
                logLevel,
                logLevelObject,
                tier,
                loglevelIcon,
                inputOutput,
                modeSchedule,
                checkSentry,
                memoryLimitMB,
                allowInstanceSettings: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceSettings : true,
                allowInstanceDelete: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceDelete : true,
                allowInstanceLink: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceLink : true,
            }
        });

        if (this.state.playArrow) {
            this._cacheList = this._cacheList.filter(({ running }) => this.state.playArrow < 2 ? running : !running);
        }

        if (this.state.onlyCurrentHost) {
            this._cacheList = this._cacheList.filter(({ host }) => host === currentHostNoPrefix);
        }

        if (this.state.filterText) {
            const filterText = this.state.filterText.toLowerCase();
            this._cacheList = this._cacheList.filter(({ name, nameId }) => name.toLowerCase().includes(filterText) || nameId.toLowerCase().includes(filterText));
        }

        if (this.props.expertMode && (this.state.filterCompactGroup || this.state.filterCompactGroup === 0) && this.state.compact) {
            this._cacheList = this._cacheList.filter(({ compactGroup }) => compactGroup === this.state.filterCompactGroup ||
                this.state.filterCompactGroup === 'All' ||
                (this.state.filterCompactGroup === 'default' && (compactGroup === null || compactGroup === 1)) ||
                (this.state.filterCompactGroup === 'controller' && compactGroup === '0'))
        }
        if (this.state.filterMode) {
            this._cacheList = this._cacheList.filter(item => item.mode === this.state.filterMode);
        }
        if (this.state.filterStatus) {
            const status = this.getStatusFilter(this.state.filterStatus)
            this._cacheList = this._cacheList.filter(item => status === item.status);
        }

        return this._cacheList;
    }

    clearAllFilters() {
        const state = {
            playArrow: false,
            onlyCurrentHost: false,
            filterCompactGroup: 'All',
            filterMode: null,
            filterStatus: null,
            filterText: ''
        };
        window.localStorage.removeItem('instances.filter');
        window.localStorage.removeItem(`Instances.playArrow`);
        window.localStorage.removeItem('Instances.onlyCurrentHost');
        window.localStorage.removeItem('Instances.playArrow');
        window.localStorage.removeItem('Instances.filterCompactGroup');
        window.localStorage.removeItem('Instances.filterMode');
        window.localStorage.removeItem('Instances.filterStatus');
        this._cacheList = null;
        this.setState(state, () => {
            if (this.inputRef.current) {
                this.inputRef.current.value = '';
            }
            this.cacheInstances();
        });
    }

    getPanels() {
        if (!this._cacheList) {
            this.cacheInstances();
        }

        let list = this._cacheList.map((item, idx) => {
            const id = item.id;
            const instance = this.state.instances[id];

            if (this.state.viewMode) {
                return {
                    category: item.category,
                    render: <InstanceCard
                        deleting={this.state.deleting === instance.id}
                        adminInstance={this.props.adminInstance}
                        maxCompactGroupNumber={this.state.maxCompactGroupNumber}
                        onDeleteInstance={this.onDeleteInstance}
                        expertMode={this.props.expertMode}
                        extendObject={this.extendObject}
                        getMemory={this.getMemory}
                        getRestartSchedule={() => this.getRestartSchedule(instance.obj)}
                        getSchedule={() => this.getSchedule(instance.obj)}
                        hosts={this.props.hosts}
                        id={id}
                        deleteCustomSupported={this.state.deleteCustomSupported}

                        instance={instance}
                        key={instance.id}
                        openConfig={this.openConfig}
                        setCompact={this.setCompact}
                        setCompactGroup={this.setCompactGroup}
                        setHost={this.setHost}
                        setLogLevel={this.setLogLevel}
                        setMemoryLimitMB={this.setMemoryLimitMB}
                        setName={this.setName}
                        setRestartSchedule={this.setRestartSchedule}
                        setSchedule={this.setSchedule}
                        setSentry={this.setSentry}
                        setTier={this.setTier}
                        t={this.t}
                        themeType={this.props.themeType}
                        item={item}
                    />
                };
            } else {
                return {
                    category: item.category,
                    render: <InstanceRow
                        deleting={this.state.deleting === instance.id}
                        deleteCustomSupported={this.state.deleteCustomSupported}
                        adminInstance={this.props.adminInstance}
                        maxCompactGroupNumber={this.state.maxCompactGroupNumber}
                        onDeleteInstance={this.onDeleteInstance}
                        expanded={this.state.expanded}
                        expertMode={this.props.expertMode}
                        extendObject={this.extendObject}
                        getInstanceStatus={() => this.getInstanceStatus(instance.obj)}
                        getMemory={this.getMemory}
                        getModeIcon={this.getModeIcon}
                        getRestartSchedule={() => this.getRestartSchedule(instance.obj)}
                        getSchedule={() => this.getSchedule(instance.obj)}
                        onExpandRow={this.onExpandRow}
                        hosts={this.props.hosts}
                        id={id}
                        idx={idx}

                        instance={instance}
                        key={instance.id}
                        openConfig={this.openConfig}
                        setCompact={this.setCompact}
                        setCompactGroup={this.setCompactGroup}
                        setHost={this.setHost}
                        setLogLevel={this.setLogLevel}
                        setMemoryLimitMB={this.setMemoryLimitMB}
                        setName={this.setName}
                        setRestartSchedule={this.setRestartSchedule}
                        setSchedule={this.setSchedule}
                        setSentry={this.setSentry}
                        setTier={this.setTier}
                        t={this.t}
                        themeType={this.props.themeType}
                        item={item}
                    />
                };
            }
        });

        if (!list.length) {
            return <div
                title={this.t('Click to clear all filters')}
                onClick={() => this.clearAllFilters()}
                style={{
                    margin: 20,
                    fontSize: 26,
                    textAlign: 'center',
                    cursor: 'pointer',
                }}
            >{this.t('all items are filtered out')}</div>
        }

        if (!this.state.viewMode && this.state.viewCategory) {
            let categoryArray = [];

            list.forEach(({ category }) => !categoryArray.includes(category) && categoryArray.push(category));

            categoryArray.sort((a, b) => {
                if (a === 'general' && b !== 'general') {
                    return -1;
                } else if (a !== 'general' && b === 'general') {
                    return 1;
                } else if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            });

            return categoryArray.map(name => <InstanceCategory
                    key={name}
                    name={name}
                    expanded={this.state.expandedFolder.includes(name)}
                    onExpand={expanded => {
                        const expandedFolder = [...this.state.expandedFolder];
                        const pos = expandedFolder.indexOf(name);
                        if (expanded) {
                            if (pos === -1) {
                                expandedFolder.push(name);
                                expandedFolder.sort();
                            }
                        } else {
                            if (pos !== -1) {
                                expandedFolder.splice(pos, 1);
                            }
                        }
                        window.localStorage.setItem('Instances.expandedFolder', JSON.stringify(expandedFolder));
                        this.setState({expandedFolder});
                    }}
                >
                    {list.filter(({ category }) => category === name).map(({ render }) => render)}
                </InstanceCategory>);
        }

        return list.map(({ render }) => render);
    }

    onExpandRow = panel => {
        this.setState(prevState => ({expanded: prevState.expanded !== panel ? panel : null}));
    }

    async getHostsData() {
        this.props.socket.getHostInfo(this.props.currentHost, false, 10000)
            .catch(error => {
                if (!error.toString().includes('May not read')) {
                    window.alert('Cannot read host information: ' + error);
                }
                return {};
            })
            .then(hostData => {
                this._cacheList = null;
                this.setState({ hostData })
            });

        let memState;
        let memAvailable = await this.props.socket.getState(`${this.props.currentHost}.memAvailable`)
        let freemem = await this.props.socket.getState(`${this.props.currentHost}.freemem`)
        let object = await this.props.socket.getObject(`${this.props.currentHost}`)
        if (memAvailable) {
            memState = memAvailable;
        } else if (freemem) {
            memState = freemem;
        }
        if (memState) {
            const totalmem = (object?.native.hardware.totalmem / (1024 * 1024));
            const percent = Math.round((memState.val / totalmem) * 100);
            this._cacheList = null;
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

    changeSetState = (name,value) =>
        this.setState(state => {
            window.localStorage.setItem(`Instances.${name}`, value);
            return ({ [name]: value });
        });

    changeStartedStopped = value => {
        this._cacheList = null;
        this.setState(state => {
            const newValue = !state.playArrow ? 1 : state.playArrow < 2 ? 2 : false;
            window.localStorage.setItem(`Instances.playArrow`, JSON.stringify(newValue));
            return {playArrow: newValue};
        });
    };

    changeCompactGroup = filterCompactGroup => {
        this._cacheList = null;
        window.localStorage.setItem(`Instances.filterCompactGroup`, JSON.stringify(filterCompactGroup));
        this.setState({ filterCompactGroup });
    };

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;
            this._cacheList = null;
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
                        adapter={instance.id.split('.')[0]}
                        className={classes.iframe}
                        configStored={this.props.configStored}
                        dateFormat={this.props.dateFormat}
                        icon={instance.image}
                        instance={parseInt(instance.id.split('.')[1])}
                        isFloatComma={this.props.isFloatComma}
                        jsonConfig={instance.jsonConfig}
                        lang={this.props.lang}
                        materialize={instance.materialize}
                        menuPadding={this.props.menuPadding}
                        socket={this.props.socket}
                        t={this.t}
                        theme={this.props.theme}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        width={this.props.width}

                        onRegisterIframeRef={ref => this.props.onRegisterIframeRef(ref)}
                        onUnregisterIframeRef={ref => this.props.onUnregisterIframeRef(ref)}
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

                {!this.state.viewMode && <Tooltip title={this.t('Category')}>
                    <IconButton onClick={() => this.changeSetStateBool('viewCategory')}>
                        <ListIcon color={this.state.viewCategory ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>}

                {!this.state.viewMode && this.state.viewCategory && <><Tooltip title={this.t('expand all')}>
                    <IconButton onClick={() => {
                        // all folders
                        let expandedFolder = [];
                        this._cacheList.forEach(({ category }) => !expandedFolder.includes(category) && expandedFolder.push(category));
                        expandedFolder.sort();
                        window.localStorage.setItem('Instances.expandedFolder', JSON.stringify(expandedFolder));
                        this.setState({ expandedFolder })
                    }}>
                        <FolderOpenIcon />
                    </IconButton>
                </Tooltip>
                    <Tooltip title={this.t('collapse all')}>
                        <IconButton onClick={() => {
                            window.localStorage.removeItem('Instances.expandedFolder');
                            this.setState({ expandedFolder: [] })
                        }}>
                            <FolderIcon />
                        </IconButton>
                    </Tooltip>
                </>}
                <Tooltip title={this.t('Reload')}>
                    <IconButton onClick={() => this.getData(true)}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                {this.props.hosts.length > 1 ? <Tooltip title={this.t('Show instances only for current host')}>
                    <IconButton onClick={() => this.changeSetStateBool('onlyCurrentHost')}>
                        <DevicesIcon color={this.state.onlyCurrentHost ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip> : null}
                <Tooltip title={this.t(!this.state.playArrow ?
                    'Show running or stopped instances' :
                    this.state.playArrow < 2 ?
                        'Showed only running instances' :
                        'Showed only stopped instances')}>
                    <IconButton onClick={() => this.changeStartedStopped(this.state.playArrow)}>
                        <PlayArrowIcon style={this.state.playArrow === 2 ? {color: 'red'} : null}
                                       color={this.state.playArrow && this.state.playArrow < 2 ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('Filter instances')}>
                    <IconButton onClick={() =>
                        instanceFilterDialogCallback(newState => {
                            if (newState) {
                                this._cacheList = null;
                                this.setState(newState);
                                this.changeSetState('filterMode', newState.filterMode);
                                this.changeSetState('filterStatus', newState.filterStatus);
                            }
                        }, this.state.filterMode, this.state.filterStatus, this.getModeIcon)}>
                        <FilterListIcon style={{width: 16, height: 16}} className={this.state.filterMode || this.state.filterStatus ? classes.filterActive : ''}/>
                    </IconButton>
                </Tooltip>
                {/*this.props.expertMode && <Tooltip title="sentry">
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
                </Tooltip>*/}
                {this.props.expertMode && this.state.compact ?
                    <CustomSelectButton
                        title={this.t('Filter specific compact group')}
                        t={this.t}
                        arrayItem={[
                            { name: 'All' },
                            { name: 'controller' },
                            { name: 'default' },
                            ...Array(this.state.maxCompactGroupNumber - 1).fill().map((_, idx) => ({ name: idx + 2 }))
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
                                        this._cacheList = null;
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
    ready: PropTypes.bool,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    instancesWorker: PropTypes.object,

    hostname: PropTypes.string,
    hosts: PropTypes.array,
    protocol: PropTypes.string,
    adminInstance: PropTypes.string,
    repository: PropTypes.object,

    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    theme: PropTypes.object,
    systemLang: PropTypes.string,
    width: PropTypes.string,
    menuPadding: PropTypes.number,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,

    onRegisterIframeRef: PropTypes.func,
    onUnregisterIframeRef: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Instances));
