import React, { Component, createRef } from 'react';

import {
    IconButton,
    LinearProgress,
    Tooltip,
    Paper,
    Hidden,
    InputAdornment,
    TextField,
} from '@mui/material';

import {
    PlayArrow as PlayArrowIcon,
    Refresh as RefreshIcon,
    BugReport as BugReportIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Devices as DevicesIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Close as CloseIcon,
    ViewCompact as ViewCompactIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    List as ListIcon,
} from '@mui/icons-material';
import { FaFilter as FilterListIcon } from 'react-icons/fa';

import {
    type AdminConnection,
    Router,
    withWidth,
    TabContent,
    TabContainer,
    type IobTheme,
    type ThemeName,
    type ThemeType,
    TabHeader,
} from '@iobroker/adapter-react-v5';

import BasicUtils from '@/Utils';
import type InstancesWorker from '@/Workers/InstancesWorker';
import type { InstanceLink } from '@/components/Instances/LinksDialog';
import Config from './Config';
import InstanceGeneric, {
    type InstanceEntry,
    type InstanceItem,
    type InstanceStatusType,
} from '../components/Instances/InstanceGeneric';
import InstanceCard from '../components/Instances/InstanceCard';
import InstanceRow from '../components/Instances/InstanceRow';
import CustomSelectButton from '../components/CustomSelectButton';
import InstanceFilterDialog from '../components/Instances/InstanceFilterDialog';
import InstanceCategory from '../components/Instances/InstanceCategory';

const styles: Record<string, any> = {
    paper: {
        height: '100%',
    },
    iframe: {
        height: '100%',
        width: '100%',
        // backgroundColor: '#FFF',
        color: '#000',
        borderRadius: 4,
        boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        border: '0px solid #888',
    },
    cards: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    },
    filterActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    tooltip: {
        pointerEvents: 'none',
    },
    grow: {
        flexGrow: 1,
    },
};

interface InstancesProps {
    t: (word: string, ...args: any[]) => string;
    lang: ioBroker.Languages;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
    socket: AdminConnection;
    instancesWorker: InstancesWorker;
    executeCommand: (command: string) => void;
    hosts: ioBroker.HostObject[];
    currentHost: string;
    currentHostName: string;
    hostname: string;
    protocol: string;
    port: number;
    adminInstance: string;
    expertMode: boolean;
    repository: Record<string, any>;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    isFloatComma: boolean;
    dateFormat: string;

    onRegisterIframeRef: (el: HTMLIFrameElement) => void;
    onUnregisterIframeRef: (el: HTMLIFrameElement) => void;

    configStored: (allStored: boolean) => void;
}

interface HostData {
    'Disk free': number;
    'Disk size': number;
}

interface InstancesState {
    expertMode: boolean;
    dialog: string | null;
    instances: Record<string, InstanceEntry> | null;
    dialogProp: string | null;
    playArrow: 0 | 1 | 2; // 0 - running or stopped instances, 1 - only running instances, 2 - only stopped instances
    onlyCurrentHost: boolean;
    viewMode: boolean;
    viewCategory: boolean;
    hostData: HostData | null;
    processes: number | null;
    mem: number | null;
    percent: number | null;
    memFree: number | null;
    filterText: string;
    compact: boolean;
    maxCompactGroupNumber: number;
    filterCompactGroup: string | number;
    // sentry: boolean;
    deleting: string | null;
    deleteCustomSupported: boolean;
    currentHost: string;
    expandedFolder: string[];
    filterMode: string | null;
    filterStatus: string | null;
    showFilterDialog: boolean;
}

// every tab should get their data itself from server
class Instances extends Component<InstancesProps, InstancesState> {
    private readonly localStorage: Storage;

    private statePromise: Promise<Record<string, ioBroker.State>> | null = null;

    private states: Record<string, ioBroker.State>;

    private adapters: ioBroker.AdapterObject[];

    private statesUpdateTimer: ReturnType<typeof setTimeout> | null = null;

    private typingTimer: ReturnType<typeof setTimeout> | null = null;

    private hostsTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly wordCache: Record<string, string>;

    private readonly t: (word: string, arg1?: any, arg2?: any) => string;

    private readonly inputRef: React.RefObject<HTMLInputElement>;

    private subscribed: boolean = false;

    private _cacheList: InstanceItem[] | null = null;

    private shouldUpdateAfterDialogClosed: boolean = false;

    private expanded = '';

    private closeCommands: Record<string, (() => void) | null> = {};

    constructor(props: InstancesProps) {
        super(props);

        this.localStorage = (window as any)._localStorage as Storage || window.localStorage;

        let expandedFolder = [];
        if (this.localStorage.getItem('Instances.expandedFolder')) {
            try {
                expandedFolder = JSON.parse(this.localStorage.getItem('Instances.expandedFolder'));
            } catch (e) {
                // ignore
            }
        }

        this.state = {
            expertMode: this.props.expertMode,
            dialog: null,
            instances: null,
            dialogProp: null,
            playArrow: 0,
            onlyCurrentHost: false,
            viewMode: false,
            viewCategory: false,
            hostData: null,
            processes: null,
            mem: null,
            percent: null,
            memFree: null,
            filterText: this.localStorage.getItem('instances.filter') || '',
            compact: false,
            maxCompactGroupNumber: 1,
            filterCompactGroup: 'All',
            // sentry: false,
            deleting: null,
            deleteCustomSupported: false,
            currentHost: this.props.currentHost,
            showFilterDialog: false,

            expandedFolder,

            // filter
            filterMode: this.localStorage.getItem('Instances.filterMode') ?
                this.localStorage.getItem('Instances.filterMode') === 'null' ?
                    null :
                    this.localStorage.getItem('Instances.filterMode') : null,
            filterStatus: this.localStorage.getItem('Instances.filterStatus') ?
                this.localStorage.getItem('Instances.filterStatus') === 'null' ?
                    null :
                    this.localStorage.getItem('Instances.filterStatus') : null,
        };

        // this.columns = {
        //     instance: { onlyExpert: false },
        //     actions: { onlyExpert: false },
        //     title: { onlyExpert: false },
        //     schedule: { onlyExpert: false },
        //     restart: { onlyExpert: true },
        //     log: { onlyExpert: true },
        //     ramLimit: { onlyExpert: true },
        //     events: { onlyExpert: true },
        //     ram: { onlyExpert: false },
        // };

        this.states = {};
        this.adapters = [];
        this.statesUpdateTimer = null;
        this.wordCache = {};

        this.t = this.translate;
        this.inputRef = createRef();
    }

    translate = (word: string, arg1?: any, arg2?: any): string => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    };

    async componentDidMount() {
        this.props.instancesWorker.registerHandler(this.getInstances);
        await this.updateData();
        const deleteCustomSupported = await this.props.socket.checkFeatureSupported('DEL_INSTANCE_CUSTOM');
        deleteCustomSupported && this.setState({ deleteCustomSupported });
    }

    async updateData() {
        await this.getParamsLocalAndPanel();
        await this.getData();
        await this.getHostsData();
        await this.getInstances();
    }

    async componentWillUnmount() {
        this.subscribeStates(true);
        this.props.instancesWorker.unregisterHandler(this.getInstances);
    }

    getStates(update?: boolean) {
        if (update) {
            this.statePromise = null;
        }
        this.statePromise = this.statePromise || this.props.socket.getForeignStates('system.adapter.*');

        return this.statePromise;
    }

    static getDerivedStateFromProps(props: InstancesProps, state: InstancesState) {
        const location = Router.getLocation();

        const newState: Partial<InstancesState> = {
            dialog: location.dialog,
            dialogProp: location.id,
        };

        if (props.expertMode !== state.expertMode) {
            newState.expertMode = props.expertMode;
        }

        return newState;
    }

    getInstances = async () => {
        const start = Date.now();
        let instances: ioBroker.InstanceObject[] = [];
        const instancesFromWorker = await this.props.instancesWorker.getInstances();

        if (!instancesFromWorker) {
            window.alert('Cannot read instances!');
            return;
        }

        instances = Object.values(instancesFromWorker);

        let memRssId = `${this.state.currentHost}.memRss`;
        this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));

        const host = this.states[memRssId];
        let processes = 1;
        let mem: number = host ? parseFloat(host.val as string) || 0 : 0;
        for (let i = 0; i < instances.length; i++) {
            const inst = instances[i];
            if (!inst || !inst.common || inst.common.host !== this.props.currentHostName) {
                continue;
            }
            if (inst.common.enabled && inst.common.mode === 'daemon') {
                memRssId = `${inst._id}.memRss`;
                this.states[memRssId] = this.states[memRssId] || (await this.props.socket.getState(memRssId));
                const m = this.states[memRssId];
                mem += m ? parseFloat(m.val as string) || 0 : 0;
                processes++;
            }
        }

        const formatted: Record<string, InstanceEntry> = {};

        instances.sort((a, b) => {
            const pA = a._id.split('.');
            const pB = b._id.split('.');
            const numA = parseInt(pA[pA.length - 1], 10);
            const numB = parseInt(pB[pB.length - 1], 10);
            const nameA = pA[pA.length - 2];
            const nameB = pB[pB.length - 2];

            if (nameA === nameB) {
                return numA > numB ? 1 : (numA < numB ? -1 : 0);
            }
            return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
        });

        let maxCompactGroupNumber = 1;
        const newState: Partial<InstancesState> = {};

        // Do not make here Object.keys, as we have got an invalid order in this case
        for (let i = 0; i < instances.length; i++) {
            const obj = instances[i];
            const common = obj ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];

            if (common.compactGroup && typeof common.compactGroup === 'number' && maxCompactGroupNumber < common.compactGroup) {
                maxCompactGroupNumber = common.compactGroup;
            }

            const instance: InstanceEntry = {
                id: obj._id.replace('system.adapter.', ''),
                obj,
                compact: !!common.compact,
                host: common.host,
                name: this.getName(obj),
                image: common.icon ? `adapter/${common.name}/${common.icon}` : 'img/no-image.png',
                enabled: common.enabled,
                canStart: !common.onlyWWW,
                config: common.adminUI.config !== 'none',
                jsonConfig: common.adminUI.config === 'json',
                materialize: common.adminUI.config === 'materialize',
                compactMode: common.runAsCompactMode || false,
                mode: common.mode || null,
                schedule: common.schedule === undefined || common.schedule === null ? null : common.schedule,
                loglevel: common.loglevel || null,
                adapter: common.name || null,
                version: common.version || null,
                stoppedWhenWebExtension: obj.common.mode === 'daemon' ? (obj.common.webExtension !== undefined ? !!obj.common.webExtension : undefined) : undefined,
                links: [],
            };

            const rawLinks: Record<string, string> | string = common.localLinks || common.localLink || '';
            let links: Record<string, string | InstanceLink> | null = null;
            if (rawLinks && typeof rawLinks === 'string') {
                links = { _default: rawLinks as string };
            } else if (rawLinks && typeof rawLinks === 'object') {
                links = rawLinks as Record<string, string>;
            }

            const names = links ? Object.keys(links) : [];

            names.forEach(linkName => {
                instance.links = instance.links || [];
                let link: InstanceLink;
                if (typeof links[linkName] === 'string') {
                    link = { link: links[linkName] as string };
                } else {
                    link = links[linkName] as InstanceLink;
                }

                const urls = BasicUtils.replaceLink(link.link, common.name, instanceId, {
                    objects: instancesFromWorker,
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

            if (instance.stoppedWhenWebExtension) {
                const eId = this.states[`${instance.id}.info.extension`] || (await this.props.socket.getState(`${instance.id}.info.extension`));
                instance.stoppedWhenWebExtension = eId ? !!eId.val : undefined;
            }

            console.log(obj._id);
            formatted[obj._id] = instance;
        }

        console.log(`getInstances: ${Date.now() - start}`);

        if (this.state.deleting && !formatted[`system.adapter.${this.state.deleting}`]) {
            newState.deleting = null;
        }

        newState.maxCompactGroupNumber = maxCompactGroupNumber;
        newState.processes = processes;
        newState.mem = Math.round(mem);
        newState.instances = formatted;

        this._cacheList = null;
        this.setState(newState as InstancesState);
    };

    getParamsLocalAndPanel = async () => {
        let compact = false;
        try {
            const baseSettings = await this.props.socket.readBaseSettings(this.state.currentHost);
            compact = !!baseSettings.config?.system?.compact;
        } catch (error) {
            window.alert(`Cannot read compact mode by host "${this.state.currentHost}": ${error}`);
        }

        let playArrow: 0 | 1 | 2 = 0;
        let filterCompactGroup: string | number = 'All';
        try {
            playArrow = JSON.parse(this.localStorage.getItem('Instances.playArrow')) as (0 | 1 | 2);
            // back compatibility
            if (playArrow.toString() === 'true') {
                playArrow = 1;
            } else  if (playArrow.toString() === 'false') {
                playArrow = 0;
            }
            filterCompactGroup = JSON.parse(this.localStorage.getItem('Instances.filterCompactGroup'));
        } catch (error) {
            // ignore
        }

        const onlyCurrentHost = this.localStorage.getItem('Instances.onlyCurrentHost') === 'true';
        const viewMode = this.localStorage.getItem('Instances.viewMode') === 'true';
        const viewCategory = this.localStorage.getItem('Instances.viewCategory')  === 'true';

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
            viewCategory,
        });
    };

    async getData(update?: boolean) {
        try {
            const adapters = this.props.socket.getAdapters(update);
            const statesProm = this.getStates();

            const [states, _adapters] = await Promise.all(
                [
                    statesProm,
                    adapters,
                ],
            );
            this.adapters = _adapters || [];
            this.states = states || {};
        } catch (error) {
            console.log(error);
        }

        if (!this.states) {
            return;
        }

        if (!this.subscribed) {
            this.subscribed = true;
            this.subscribeStates();
        }
    }

    onStateChange = (id: string, state: ioBroker.State | null) => {
        const oldState = this.states[id];
        this.states[id] = state;
        if ((!oldState && state) || (oldState && !state) || (oldState && state && oldState.val !== state.val)) {
            if (this.state.dialog === 'config' && this.state.dialogProp) {
                this.statesUpdateTimer && clearTimeout(this.statesUpdateTimer);
                this.statesUpdateTimer = null;
                this.shouldUpdateAfterDialogClosed = true;
            } else if (!this.statesUpdateTimer) {
                this.statesUpdateTimer = setTimeout(() => {
                    this.statesUpdateTimer = null;
                    this._cacheList = null;
                    this.forceUpdate();
                }, 1000);
            }
        }
    };

    subscribeStates(isUnsubscribe?: boolean) {
        const func = isUnsubscribe ? this.props.socket.unsubscribeState : this.props.socket.subscribeState;
        // func('system.adapter.*', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.alive', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.connected', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.inputCount', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.memRss', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.outputCount', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.logLevel', this.onStateChange);
        func.call(this.props.socket, 'system.adapter.*.plugins.sentry.enabled', this.onStateChange);
        // func('system.host.*', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskFree', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskSize', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.diskWarning', this.onStateChange);
        func.call(this.props.socket, 'system.host.*.freemem', this.onStateChange);
        func.call(this.props.socket, '*.info.connection', this.onStateChange);
        func.call(this.props.socket, '*.info.extension', this.onStateChange);
    }

    // returns:
    // grey   - daemon / disabled
    // green  - daemon / run,connected,alive
    // blue   - schedule
    // orangeDevice - daemon / run, connected to controller, not connected to device
    // orange - daemon / run,not connected
    // red    - daemon / not run, not connected
    getInstanceStatus = (obj: ioBroker.InstanceObject): InstanceStatusType => {
        const common = obj ? obj.common : null;
        const mode = common?.mode || '';
        let status: InstanceStatusType = mode === 'daemon' ? 'green' : 'blue';

        if (common && common.enabled && (!common.webExtension || !obj.native.webInstance || mode === 'daemon')) {
            const alive = this.states[`${obj._id}.alive`];
            const connected = this.states[`${obj._id}.connected`];
            const connection = this.states[`${(obj._id).replace('system.adapter.', '')}.info.connection`];
            if (common.webExtension && obj.native.webInstance) {
                const extension = this.states[`${(obj._id).replace('system.adapter.', '')}.info.extension`];
                if (extension) {
                    return extension.val ? 'green' : 'red';
                }
            }

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
    };

    isCompactGroupCheck(id: string): boolean {
        const obj = this.adapters.find(({ _id }) => _id === `system.adapter.${id}`);
        return obj?.common?.compact || false;
    }

    getName(obj: ioBroker.InstanceObject): string {
        if (!obj?.common) {
            return '';
        }
        if (obj.common.titleLang) {
            return BasicUtils.getText(obj.common.titleLang, this.props.lang);
        }

        return BasicUtils.getText(obj.common.title, this.props.lang);
    }

    getInputOutput(id: string): { stateInput: number; stateOutput: number } {
        const stateInput = this.states[`${id}.inputCount`];
        const stateOutput = this.states[`${id}.outputCount`];
        return {
            stateInput: stateInput?.val ? stateInput.val as number : 0,
            stateOutput: stateOutput?.val ? stateOutput.val as number : 0,
        };
    }

    isAlive(id: string): boolean {
        const state = this.states[`${id}.alive`];
        return !!state?.val;
    }

    isConnectedToHost(id: string): boolean {
        const state = this.states[`${id}.connected`];
        return !!state?.val;
    }

    isConnected(id: string): boolean | null {
        const instance = this.state.instances[id];
        return this.states[`${instance.id}.info.connection`] ? !!this.states[`${instance.id}.info.connection`].val : null;
    }

    static getStatusFilter(value: string): InstanceStatusType {
        switch (value) {
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
    }

    static getLogLevelIcon(level: ioBroker.LogLevel) {
        if (level === 'debug') {
            return <BugReportIcon />;
        }
        if (level === 'info') {
            return <InfoIcon />;
        }
        if (level === 'warn') {
            return <WarningIcon />;
        }
        if (level === 'error') {
            return <ErrorIcon />;
        }
        return null;
    }

    onDeleteInstance = (instance: InstanceEntry, deleteCustom: boolean, deleteAdapter: boolean) => {
        this.setState({ deleting: instance.id }, () =>
            this.props.executeCommand(`del ${deleteAdapter ? instance.id.split('.')[0] : instance.id}${deleteCustom ? ' --custom' : ''}${this.props.expertMode ? ' --debug' : ''}`));
    };

    isSentry(instanceId: string): boolean {
        return !!this.states[`${instanceId}.plugins.sentry.enabled`]?.val;
    }

    cacheInstances() {
        const currentHostNoPrefix = this.state.currentHost.replace(/^system.host./, '');

        this._cacheList = Object.keys(this.state.instances).map(id => {
            const instance = this.state.instances[id];
            const running = InstanceGeneric.isRunning(instance.obj);
            const compactGroup = InstanceGeneric.isCompactGroup(instance.obj);
            const checkCompact = this.isCompactGroupCheck(instance.adapter) && this.state.compact;
            const compact = InstanceGeneric.isCompact(instance.obj);
            const supportCompact = instance.compact || false;
            const alive = this.isAlive(id);
            const connectedToHost = this.isConnectedToHost(id);
            const connected = this.isConnected(id);
            const name = this.getName(instance.obj);
            const logLevel = this.states[`${id}.logLevel`]?.val as ioBroker.LogLevel || instance.loglevel;
            const logLevelObject = instance.loglevel;
            const tier = instance?.obj?.common?.tier || 3;
            const loglevelIcon = Instances.getLogLevelIcon(logLevel);
            const inputOutput = this.getInputOutput(id);
            const modeSchedule = InstanceGeneric.isModeSchedule(instance.obj);
            const memoryLimitMB = InstanceGeneric.getMemoryLimitMB(instance.obj);

            const checkSentry = InstanceGeneric.getSentrySettings(instance.obj); // is it possible to enable/disable sentry for this adapter
            const currentSentry = this.isSentry(id);

            const item: InstanceItem = {
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
                stoppedWhenWebExtension: instance.stoppedWhenWebExtension,
                allowInstanceSettings: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceSettings : true,
                allowInstanceDelete: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceDelete : true,
                allowInstanceLink: this.props.repository[instance.adapter] ? this.props.repository[instance.adapter].allowInstanceLink : true,
            };

            return item;
        });

        if (this.state.playArrow) {
            this._cacheList = this._cacheList.filter(({ running }) => (this.state.playArrow === 1 ? running : !running));
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
                (this.state.filterCompactGroup === 'controller' && compactGroup === '0'));
        }
        if (this.state.filterMode) {
            this._cacheList = this._cacheList.filter(item => item.mode === this.state.filterMode);
        }
        if (this.state.filterStatus) {
            const status = Instances.getStatusFilter(this.state.filterStatus);
            this._cacheList = this._cacheList.filter(item => status === item.status);
        }

        return this._cacheList;
    }

    clearAllFilters() {
        const state: Partial<InstancesState> = {
            playArrow: 0,
            onlyCurrentHost: false,
            filterCompactGroup: 'All',
            filterMode: null,
            filterStatus: null,
            filterText: '',
        };

        this.localStorage.removeItem('instances.filter');
        this.localStorage.removeItem('Instances.playArrow');
        this.localStorage.removeItem('Instances.onlyCurrentHost');
        this.localStorage.removeItem('Instances.filterCompactGroup');
        this.localStorage.removeItem('Instances.filterMode');
        this.localStorage.removeItem('Instances.filterStatus');

        this._cacheList = null;
        this.setState(state as InstancesState, () => {
            if (this.inputRef.current) {
                this.inputRef.current.value = '';
            }
            this.cacheInstances();
        });
    }

    onMaxCompactGroupNumber = (maxCompactGroupNumber: number): void => this.setState({ maxCompactGroupNumber });

    onRegisterClose = (panel: string, closeCommand: (() => void) | null) => this.closeCommands[panel] = closeCommand;

    getPanels() {
        if (!this._cacheList) {
            this.cacheInstances();
        }

        const context = {
            adminInstance: this.props.adminInstance,
            onDeleteInstance: this.onDeleteInstance,
            expertMode: this.props.expertMode,
            hosts: this.props.hosts,
            socket: this.props.socket,
            t: this.t,
            lang: this.props.lang,
            themeType: this.props.themeType,
            setMaxCompactGroupNumber: this.onMaxCompactGroupNumber,
            maxCompactGroupNumber: this.state.maxCompactGroupNumber,
            deleteCustomSupported: this.state.deleteCustomSupported,
            states: this.states,
            onToggleExpanded: this.onToggleExpanded,
            getInstanceStatus: this.getInstanceStatus,
            theme: this.props.theme,
            onRegisterClose: this.onRegisterClose,
        };

        const list = this._cacheList.map((item, idx) => {
            const id = item.id;
            const instance = this.state.instances[id];

            if (this.state.viewMode) {
                return {
                    category: item.category,
                    render: <InstanceCard
                        deleting={this.state.deleting === instance.id}
                        id={id}
                        idx={idx}
                        instance={instance}
                        key={instance.id}
                        item={item}
                        context={context}
                    />,
                };
            }
            return {
                category: item.category,
                render: <InstanceRow
                    deleting={this.state.deleting === instance.id}
                    id={id}
                    idx={idx}
                    instance={instance}
                    key={instance.id}
                    item={item}
                    context={context}
                />,
            };
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
            >
                {this.t('all items are filtered out')}
            </div>;
        }

        if (!this.state.viewMode && this.state.viewCategory) {
            const categoryArray: string[] = [];

            list.forEach(({ category }) => !categoryArray.includes(category) && categoryArray.push(category));

            categoryArray.sort((a, b) => {
                if (a === 'general' && b !== 'general') {
                    return -1;
                } if (a !== 'general' && b === 'general') {
                    return 1;
                } if (a > b) {
                    return 1;
                } if (a < b) {
                    return -1;
                }
                return 0;
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
                    } else if (pos !== -1) {
                        expandedFolder.splice(pos, 1);
                    }
                    this.localStorage.setItem('Instances.expandedFolder', JSON.stringify(expandedFolder));
                    this.setState({ expandedFolder });
                }}
            >
                {list.filter(({ category }) => category === name).map(({ render }) => render)}
            </InstanceCategory>);
        }

        return list.map(({ render }) => render);
    }

    onToggleExpanded = (panel: string, expanded: boolean) => {
        if (this.expanded !== panel && expanded && this.closeCommands[this.expanded]) {
            this.closeCommands[this.expanded]();
        }
        this.expanded = expanded ? panel : null;
    };

    async getHostsData() {
        this.props.socket.getHostInfo(this.state.currentHost, false, 10000)
            .catch(error => {
                if (!error.toString().includes('May not read')) {
                    window.alert(`Cannot read host information: ${error}`);
                }
                return {};
            })
            .then(hostData => {
                this._cacheList = null;
                this.setState({ hostData });
            });

        let memState;
        const memAvailable = await this.props.socket.getState(`${this.state.currentHost}.memAvailable`);
        const freemem = await this.props.socket.getState(`${this.state.currentHost}.freemem`);
        const object = await this.props.socket.getObject(`${this.state.currentHost}`);

        if (memAvailable) {
            memState = memAvailable;
        } else if (freemem) {
            memState = freemem;
        }

        if (memState) {
            const totalmem = (object?.native.hardware.totalmem || 0) / (1024 * 1024);
            const percent = Math.round((memState.val as number / totalmem) * 100);
            this._cacheList = null;
            this.setState({
                percent,
                memFree: memState.val as number,
            });
        }
    }

    changeStartedStopped = () => {
        this._cacheList = null;
        this.setState(state => {
            const playArrow = !state.playArrow ? 1 : state.playArrow === 1 ? 2 : 0;
            this.localStorage.setItem('Instances.playArrow', JSON.stringify(playArrow));
            return { playArrow };
        });
    };

    changeCompactGroup(filterCompactGroup: string | number) {
        this._cacheList = null;
        this.localStorage.setItem('Instances.filterCompactGroup', JSON.stringify(filterCompactGroup));
        this.setState({ filterCompactGroup });
    }

    handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;
            this._cacheList = null;
            this.setState({ filterText: value });
            this.localStorage.setItem('instances.filter', value);
        }, 300, event.target.value);
    }

    renderFilterDialog() {
        if (!this.state.showFilterDialog) {
            return null;
        }

        return <InstanceFilterDialog
            filterMode={this.state.filterMode}
            filterStatus={this.state.filterStatus}
            onClose={newState => {
                if (newState) {
                    this._cacheList = null;
                    this.localStorage.setItem('Instances.filterMode', newState.filterMode);
                    this.localStorage.setItem('Instances.filterStatus', newState.filterStatus);
                    this.setState(newState);
                }
                this.setState({ showFilterDialog: false });
            }}
        />;
    }

    render() {
        if (!this.state.instances) {
            return <LinearProgress />;
        }

        if (this.props.currentHost !== this.state.currentHost) {
            this.hostsTimer = this.hostsTimer || setTimeout(() => {
                this.hostsTimer = null;
                this.setState({
                    currentHost: this.props.currentHost,
                }, () => this.updateData());
            }, 200);
        }

        if (this.state.dialog === 'config' && this.state.dialogProp) {
            const instance = this.state.instances[this.state.dialogProp] || null;
            if (instance) {
                return <Paper style={styles.paper}>
                    {this.renderFilterDialog()}
                    <Config
                        adapter={instance.id.split('.')[0]}
                        adminInstance={this.props.adminInstance}
                        style={styles.iframe}
                        configStored={this.props.configStored}
                        dateFormat={this.props.dateFormat}
                        icon={instance.image}
                        instance={parseInt(instance.id.split('.')[1])}
                        isFloatComma={this.props.isFloatComma}
                        jsonConfig={instance.jsonConfig}
                        lang={this.props.lang}
                        materialize={instance.materialize}
                        socket={this.props.socket}
                        t={this.t}
                        theme={this.props.theme}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        width={this.props.width}
                        version={instance.version}
                        onRegisterIframeRef={(ref: HTMLIFrameElement) => this.props.onRegisterIframeRef(ref)}
                        onUnregisterIframeRef={(ref: HTMLIFrameElement) => this.props.onUnregisterIframeRef(ref)}
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

        const hostData = this.state.hostData ?
            `${this.state.hostData['Disk free'] ? `${this.t('Disk free')}: ${Math.round(this.state.hostData['Disk free'] / (this.state.hostData['Disk size'] / 100))}%, ` : ''
            }${this.t('Total RAM usage')}: ${this.state.mem} Mb / ` +
            `${this.t('Free')}: ${this.state.percent}% = ${this.state.memFree} Mb ` +
            `[${this.t('Host')}: ${this.props.currentHostName} - ${this.state.processes} ${this.state.processes === 1 ? this.t('process') :  this.t('processes')}]` : null;

        return <TabContainer>
            {this.renderFilterDialog()}
            <TabHeader>
                <Tooltip title={this.t('Show / hide List')}>
                    <IconButton
                        size="large"
                        onClick={() => {
                            this.setState({ viewMode: !this.state.viewMode });
                            this.localStorage.setItem('Instances.viewMode', this.state.viewMode ? 'false' : 'true');
                        }}
                    >
                        {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>

                {!this.state.viewMode && <Tooltip title={this.t('Category')}>
                    <IconButton
                        size="large"
                        onClick={() => {
                            this.setState({ viewCategory: !this.state.viewCategory });
                            this.localStorage.setItem('Instances.viewCategory', this.state.viewCategory ? 'false' : 'true');
                        }}
                    >
                        <ListIcon color={this.state.viewCategory ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>}

                {!this.state.viewMode && this.state.viewCategory && <>
                    <Tooltip title={this.t('expand all')}>
                        <IconButton
                            size="large"
                            onClick={() => {
                                // all folders
                                const expandedFolder: string[] = [];
                                this._cacheList.forEach(({ category }) => !expandedFolder.includes(category) && expandedFolder.push(category));
                                expandedFolder.sort();
                                this.localStorage.setItem('Instances.expandedFolder', JSON.stringify(expandedFolder));
                                this.setState({ expandedFolder });
                            }}
                        >
                            <FolderOpenIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.t('collapse all')}>
                        <IconButton
                            size="large"
                            onClick={() => {
                                this.localStorage.removeItem('Instances.expandedFolder');
                                this.setState({ expandedFolder: [] });
                            }}
                        >
                            <FolderIcon />
                        </IconButton>
                    </Tooltip>
                </>}
                <Tooltip title={this.t('Reload')}>
                    <IconButton size="large" onClick={() => this.getData(true)}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                {this.props.hosts.length > 1 ? <Tooltip title={this.t('Show instances only for current host')}>
                    <IconButton
                        size="large"
                        onClick={() => {
                            this.setState({ onlyCurrentHost: !this.state.onlyCurrentHost });
                            this.localStorage.setItem('Instances.onlyCurrentHost', this.state.onlyCurrentHost ? 'false' : 'true');
                        }}
                    >
                        <DevicesIcon color={this.state.onlyCurrentHost ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip> : null}
                <Tooltip title={this.t(!this.state.playArrow ?
                    'Show running or stopped instances' :
                    this.state.playArrow === 1 ?
                        'Showed only running instances' :
                        'Showed only stopped instances')}
                >
                    <IconButton size="large" onClick={() => this.changeStartedStopped()}>
                        <PlayArrowIcon
                            style={this.state.playArrow === 2 ? { color: 'red' } : null}
                            color={this.state.playArrow === 1 ? 'primary' : 'inherit'}
                        />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('Filter instances')}>
                    <IconButton
                        size="large"
                        onClick={() => this.setState({ showFilterDialog: true })}
                        sx={this.state.filterMode || this.state.filterStatus ? styles.filterActive : undefined}
                    >
                        <FilterListIcon style={{ width: 16, height: 16 }} />
                    </IconButton>
                </Tooltip>
                {/* this.props.expertMode && <Tooltip title="sentry">
                    <IconButton
                        size="small"
                        style={styles.button}
                        onClick={() => {
                            this.setState({ sentry: !this.state.sentry });
                            this.localStorage.setItem(`Instances.sentry`, this.state.sentry ? 'false' : 'true');
                        }}
                    >
                        <CardMedia
                            className={UtilsCommon.clsx(classes.sentry, !this.state.sentry && classes.contrast0)}
                            component="img"
                            image={sentry}
                        />
                    </IconButton>
                </Tooltip> */}
                {this.props.expertMode && this.state.compact ?
                    <CustomSelectButton
                        title={this.t('Filter specific compact group')}
                        t={this.t}
                        arrayItem={[
                            { name: 'All' },
                            { name: 'controller' },
                            { name: 'default' },
                            ...Array(this.state.maxCompactGroupNumber - 1).fill(0).map((_, idx) => ({ name: idx + 2 })),
                        ]}
                        buttonIcon={<ViewCompactIcon style={{ marginRight: 4 }} color="primary" />}
                        onClick={value => this.changeCompactGroup(value)}
                        value={this.state.filterCompactGroup}
                    />
                    : null}
                <div style={styles.grow} />
                <TextField
                    variant="standard"
                    inputRef={this.inputRef}
                    label={this.t('Filter')}
                    style={{ margin: '5px 0' }}
                    defaultValue={this.state.filterText}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.handleFilterChange(event)}
                    InputProps={{
                        endAdornment: this.state.filterText ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    this.inputRef.current.value = '';
                                    this._cacheList = null;
                                    this.setState({ filterText: '' });
                                    this.localStorage.setItem('instances.filter', '');
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment> : null,
                    }}
                />
                <div style={styles.grow} />
                <Hidden xsDown>
                    {hostData}
                </Hidden>
            </TabHeader>
            <TabContent overflow="auto">
                <div style={this.state.viewMode ? styles.cards : undefined}>
                    {this.getPanels()}
                </div>
            </TabContent>
        </TabContainer>;
    }
}

export default withWidth()(Instances);
