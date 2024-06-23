import React, { createRef } from 'react';
import semver from 'semver';

import {
    Grid,
    Button,
    IconButton,
    LinearProgress,
    TextField,
    Tooltip,
    InputAdornment,
    Hidden,
    DialogTitle,
    DialogContent,
    DialogActions,
    Dialog, Box,
} from '@mui/material';

import {
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Refresh as RefreshIcon,
    List as ListIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Update as UpdateIcon,
    Star as StarIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { FaGithub as GithubIcon } from 'react-icons/fa';

import CustomSelectButton from '@/components/CustomSelectButton';
import AdaptersUpdaterDialog from '@/dialogs/AdaptersUpdaterDialog';
import SlowConnectionWarningDialog, { SlowConnectionWarningDialogClass } from '@/dialogs/SlowConnectionWarningDialog';
import IsVisible from '@/components/IsVisible';
import Utils from '@/components/Utils';
import BasicUtils from '@/Utils';
import {
    TabHeader,
    type AdminConnection, type IobTheme,
    type ThemeType, type Translate,
    TabContainer,
} from '@iobroker/adapter-react-v5';
import type AdaptersWorker from '@/Workers/AdaptersWorker';
import { type AdapterEvent } from '@/Workers/AdaptersWorker';
import type InstancesWorker from '@/Workers/InstancesWorker';
import type { InstanceEvent } from '@/Workers/InstancesWorker';
import type { CompactInstanceInfo, RepoAdapterObject } from '@/dialogs/AdapterUpdateDialog';

import type {
    Ratings,
    AdapterCacheEntry,
} from '@/components/Adapters/AdapterGeneric';
import type HostsWorker from '@/Workers/HostsWorker';
import GitHubInstallDialog from '@/dialogs/GitHubInstallDialog';
import AdapterInstallDialog, {
    type AdapterRatingInfo,
    type InstalledInfo,
    type AdaptersContext,
    type AdapterInstallDialogState,
    type AdapterInstallDialogProps,
} from '@/components/Adapters/AdapterInstallDialog';
import AdaptersList, { SUM } from '@/components/Adapters/AdaptersList';
import type { AdminGuiConfig } from '@/types';
import type { RatingDialogRepository } from '@/dialogs/RatingDialog';

type DockerInformation = {
    /** If it is a Docker installation */
    isDocker: boolean;
    /** If it is the official Docker image */
    isOfficial: true;
    /** Semver string for official Docker image */
    officialVersion: string;
} | {
    /** If it is a Docker installation */
    isDocker: boolean;
    /** If it is the official Docker image */
    isOfficial: false;
};
type Platform = 'aix'
    | 'android'
    | 'darwin'
    | 'freebsd'
    | 'haiku'
    | 'linux'
    | 'openbsd'
    | 'sunos'
    | 'win32'
    | 'cygwin'
    | 'netbsd';

type HostInfo = {
    /** Converted OS for human readability */
    Platform: Platform | 'docker' | 'Windows' | 'OSX';
    /** The underlying OS */
    os: Platform;
    /** Information about the docker installation */
    dockerInformation?: DockerInformation;
    /** Host architecture */
    Architecture: string;
    /** Number of CPUs */
    CPUs: number | null;
    /** CPU speed */
    Speed: number | null;
    /** CPU model */
    Model: string | null;
    /** Total RAM of host */
    RAM: number;
    /** System uptime in seconds */
    'System uptime': number;
    /** Node.JS version */
    'Node.js': string;
    /** Current time to compare to local time */
    time: number;
    /** Timezone offset to compare to local time */
    timeOffset: number;
    /** Number of available adapters */
    'adapters count': number;
    /** NPM version */
    NPM: string;
};

export type CompactSystemRepository = {
    _id: string;
    common: {
        name: string;
        dontDelete: boolean;
    };
    native: {
        repositories: Record<string, ioBroker.RepositoryInformation>;
    };
};

const styles: Record<string, any> = {
    grow: {
        flexGrow: 1,
    },
    updateAllButton: (theme: IobTheme) => ({
        position: 'relative',
        '& .admin-update-second-icon': {
            position: 'absolute',
            top: 15,
            left: 15,
            opacity: 0.4,
            color: theme.palette.mode === 'dark' ? '#aad5ff' : '#007fff',
        },
    }),
    counters: {
        mr: '10px',
        minWidth: 120,
        display: 'flex',
        '& div': {
            ml: '3px',
        },
    },
    infoAdapters: (theme: IobTheme) => ({
        fontSize: 10,
        color: theme.palette.mode === 'dark' ? '#9c9c9c' : '#333',
        cursor: 'pointer',
    }),
    greenText: {
        color: '#00a005d1',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

const FILTERS: { name: string; notByList?: boolean }[] = [
    { name: 'Description A-Z' },
    { name: 'Name A-Z' },
    { name: 'Popular first', notByList: true },
    { name: 'Recently updated', notByList: true },
];

interface AdaptersProps extends AdapterInstallDialogProps {
    t: Translate;
    /** The host ID of the admin adapter, like system.host.test */
    adminHost: string;
    adminInstance: string;
    socket: AdminConnection;
    systemConfig: ioBroker.SystemConfigObject;
    lang: ioBroker.Languages;
    themeType: ThemeType;
    theme: IobTheme;
    /** Called when admin updates itself */
    onUpdating: (isUpdating: boolean) => void;
    ready: boolean;
    /** Current selected host */
    currentHost: string;
    forceUpdateAdapters: number;
    triggerUpdate: number;
    /** Like admin.0 */
    adminGuiConfig: AdminGuiConfig;
    adaptersWorker: AdaptersWorker;
    instancesWorker: InstancesWorker;
    hostsWorker: HostsWorker;
    expertMode: boolean;
    executeCommand: (cmd: string, host?: string, callback?: (exitCode: number) => void) => void;
    commandRunning: boolean;
    onSetCommandRunning: (commandRunning: boolean) => void;
    toggleTranslation: () => void;
    noTranslation: boolean;
    menuOpened: boolean;
    menuClosed: boolean;
}

interface AdaptersState extends AdapterInstallDialogState {
    lastUpdate: number;
    repository: Record<string, RepoAdapterObject & { rating?: AdapterRatingInfo }>;
    installed: InstalledInfo;
    installedGlobal: InstalledInfo;
    adapters: Record<string, ioBroker.AdapterObject>;
    compactInstances: Record<string, CompactInstanceInfo> | null;
    categories: {
        name: string;
        translation: string;
        count: number;
        installed: number;
        adapters: string[];
    }[];
    hostData: (HostInfo & { 'Active instances': number; location: string; Uptime: number }) | null;
    compactRepositories: CompactSystemRepository | null;
    hostOs: string;
    nodeJsVersion: string;
    init: boolean;
    update: boolean;
    filterConnectionType: boolean;
    search: string;
    oneListView: boolean;
    tableViewMode: boolean;
    updateList: boolean;
    installedList: number;
    categoriesTiles: string;
    filterTiles: string;
    gitHubInstallDialog: boolean;
    updateAvailable: string[];
    filteredList: any;
    showUpdater: boolean;
    descWidth: number;
    showStatistics: boolean;
    readTimeoutMs: number;
    showSlowConnectionWarning: boolean;
    currentHost: string;
    forceUpdateAdapters: number;
    triggerUpdate: number;
    ratings: Ratings | null;
    categoriesExpanded: { [categoryName: string]: boolean };
}

class Adapters extends AdapterInstallDialog<AdaptersProps, AdaptersState> {
    private readonly inputRef: React.RefObject<HTMLInputElement>;

    private readonly countRef: React.RefObject<HTMLDivElement>;

    private readonly t: Translate;

    private readonly wordCache: Record<string, string> = {};

    private cache: {
        listOfVisibleAdapter: string[] | null;
        adapters: { [adapterName: string]: AdapterCacheEntry } | null;
    } = { listOfVisibleAdapter: null, adapters: null };

    private listOfVisibleAdapterLength: number = 0;

    private allAdapters: number = 0;

    private installedAdapters: number = 0;

    private recentUpdatedAdapters: number = 0;

    private uuid: string = '';

    private buildCacheTimer: ReturnType<typeof setTimeout> | null = null;

    private updateTimeout: ReturnType<typeof setTimeout> | null = null;

    private typingTimer: ReturnType<typeof setTimeout> | null = null;

    private hostsTimer: ReturnType<typeof setTimeout> | null = null;

    private tempAdapters: Record<string, any> | null = null;

    private tempInstalled: InstalledInfo | null = null;

    private tempInstances: Record<string, CompactInstanceInfo> | null = null;

    constructor(props: AdaptersProps) {
        super(props);

        Object.assign(this.state, {
            lastUpdate: 0,
            repository: {},
            /** Adapters installed on the same host, without object changes installed just contains io-package information, not enriched information like installedFrom */
            installed: {},
            /** This contains the adapters installed on same and other hosts */
            installedGlobal: {},
            adapters: {},
            compactInstances: {},
            categories: [],
            hostData: null,
            compactRepositories: null,
            hostOs: '',
            nodeJsVersion: '',
            init: false,
            update: false,
            filterConnectionType: false,
            search: ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapter.search') || '',
            oneListView: false,
            tableViewMode: false,
            updateList: false,
            installedList: 0,
            categoriesTiles: 'All',
            filterTiles: 'Description A-Z',
            gitHubInstallDialog: false,
            updateAvailable: [],
            filteredList: null,
            showUpdater: false,
            descWidth: 300,
            showStatistics: false,
            readTimeoutMs: SlowConnectionWarningDialogClass.getReadTimeoutMs(),
            showSlowConnectionWarning: false,
            currentHost: props.currentHost,
            forceUpdateAdapters: props.forceUpdateAdapters,
            triggerUpdate: props.triggerUpdate,
            ratings: null,
            categoriesExpanded: {},
        } as AdaptersState);

        this.inputRef = createRef();
        this.countRef = createRef();

        this.t = this.translate;
    }

    translate = (word: string, arg1?: string | boolean | number, arg2?: string | boolean | number): string => {
        if (arg1 !== undefined) {
            return this.props.t(word, arg1, arg2);
        }

        if (!this.wordCache[word]) {
            this.wordCache[word] = this.props.t(word);
        }

        return this.wordCache[word];
    };

    renderSlowConnectionWarning() {
        if (!this.state.showSlowConnectionWarning) {
            return null;
        }
        return <SlowConnectionWarningDialog
            readTimeoutMs={this.state.readTimeoutMs}
            t={this.t}
            onClose={readTimeoutMs => {
                if (readTimeoutMs) {
                    this.setState({ showSlowConnectionWarning: false, readTimeoutMs }, () => this.updateAll());
                } else {
                    this.setState({ showSlowConnectionWarning: false });
                }
            }}
        />;
    }

    componentDidMount() {
        if (this.props.ready) {
            this.updateAll()
                .then(() => {
                    this.state.search && this.filterAdapters();
                    this.props.adaptersWorker.registerHandler(this.onAdaptersChanged);
                    this.props.instancesWorker.registerHandler(this.onAdaptersChanged);
                });
        }
    }

    async updateAll(update?: boolean, bigUpdate?: boolean, indicateUpdate?: boolean): Promise<void> {
        await this.getAdapters(update, bigUpdate, indicateUpdate);
        await this.getAdaptersInfo(update, indicateUpdate);
    }

    componentDidUpdate() {
        const descWidth = this.getDescWidth();
        if (this.state.descWidth !== descWidth) {
            this.setState({ descWidth });
        }
        if (this.countRef.current) {
            this.countRef.current.innerHTML = this.listOfVisibleAdapterLength.toString();
        }
    }

    componentWillUnmount() {
        this.updateTimeout && clearTimeout(this.updateTimeout);
        this.updateTimeout = null;

        this.buildCacheTimer && clearTimeout(this.buildCacheTimer);
        this.buildCacheTimer = null;

        this.typingTimer && clearTimeout(this.typingTimer);
        this.typingTimer = null;

        this.hostsTimer && clearTimeout(this.hostsTimer);
        this.hostsTimer = null;

        this.props.adaptersWorker.unregisterHandler(this.onAdaptersChanged);
        this.props.instancesWorker.unregisterHandler(this.onAdaptersChanged);
    }

    onAdaptersChanged = (events: (AdapterEvent | InstanceEvent)[]) => {
        this.tempAdapters = this.tempAdapters || JSON.parse(JSON.stringify(this.state.adapters || {}));
        this.tempInstalled = this.tempInstalled || JSON.parse(JSON.stringify(this.state.installed || {}));
        this.tempInstances = this.tempInstances || JSON.parse(JSON.stringify(this.state.compactInstances || {}));

        events.forEach(event => {
            // detect if adapter or instance
            const isInstance = !!event.id.match(/\.\d+$/);
            if (isInstance) {
                if (event.type === 'deleted' || !event.obj) {
                    delete this.tempInstances[event.id];
                } else {
                    this.tempInstances[event.id] = {
                        enabled: event.obj.common.enabled,
                        icon: event.obj.common.icon,
                        name: event.obj.common.name,
                        adminTab: event.obj.common.adminTab,
                        version: event.obj.common.version,
                    };
                }
            } else if (event.type === 'deleted' || !event.obj) {
                // extract name from id
                const p = event.id.split('.');

                // remove from installed
                delete this.tempInstalled[p[2]];
                delete this.tempAdapters[event.id];
            } else {
                const name = event.obj.common.name;
                if (this.tempInstalled[name]) {
                    // Update attributes
                    Object.keys(this.tempInstalled[name]).forEach(attr => {
                        if ((event.obj.common as Record<string, any>)[attr] !== undefined && attr !== 'installedFrom') {
                            (this.tempInstalled[name] as Record<string, any>)[attr] = (event.obj.common as Record<string, any>)[attr];
                        }
                    });
                } else {
                    // new
                    this.tempInstalled[event.id.split('.').pop()] = JSON.parse(JSON.stringify(event.obj.common));
                }
                this.tempAdapters[event.id] = event.obj;
            }
        });

        this.updateTimeout && clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            const adapters = this.tempAdapters;
            this.tempAdapters = null;
            const installed = this.tempInstalled;
            this.tempInstalled = null;
            const compactInstances = this.tempInstances;
            this.tempInstances = null;

            this.analyseInstalled({ adapters, installedLocal: installed, cb: () => this.calculateInfo(compactInstances) });
        }, 300);
    };

    /**
     * Enriches information of the installed adapters with those of the repository and sets them to the state
     */
    analyseInstalled(options: {
        adapters: Record<string, ioBroker.AdapterObject>;
        installedLocal: InstalledInfo;
        installedGlobal?: InstalledInfo;
        repository?: Record<string, RepoAdapterObject>;
        cb?: () => void;
    }) {
        let {
            adapters, repository,
        } = options;

        const { cb, installedLocal } = options;
        let { installedGlobal } = options;

        adapters = adapters || this.state.adapters;
        const installed = installedLocal || this.state.installed;
        installedGlobal = installedGlobal || this.state.installedGlobal;
        repository = repository || this.state.repository;

        const updateAvailable: string[] = [];

        Object.keys(installed).forEach(adapterName => {
            if (installed[adapterName]) {
                const version = installed[adapterName].version;
                const repositoryEntry = repository[adapterName];

                if (
                    repositoryEntry &&
                    repositoryEntry.version !== version &&
                    BasicUtils.updateAvailable(version, repositoryEntry.version) &&
                    !updateAvailable.includes(adapterName)
                ) {
                    updateAvailable.push(adapterName);
                }
            }
        });

        this.cache.listOfVisibleAdapter = null;

        this.setState(
            {
                adapters,
                updateAvailable,
                installed,
                repository,
                installedGlobal,
            },
            () => cb && cb(),
        );
    }

    /**
     * Get the installed adapters, for current host and other hosts
     */
    async getInstalled(update?: boolean): Promise<{
        installedLocal: InstalledInfo;
        installedGlobal: InstalledInfo;
    }> {
        /** Installed adapters on the same host */
        let installedLocal: InstalledInfo;
        /** Installed adapters on any hosts */
        let installedGlobal: InstalledInfo = {};

        const hosts = await this.props.socket.getHosts(update);

        for (const host of hosts) {
            try {
                const res = await this.props.socket.getInstalled(host._id, update, this.state.readTimeoutMs);

                if (host._id === this.state.currentHost) {
                    installedLocal = res;
                }

                // TODO: handle cases where different versions of adapters are installed on different hosts
                installedGlobal = { ...installedGlobal, ...res };
            } catch (e) {
                window.alert(
                    `Cannot getInstalled from "${host._id}" (timeout ${this.state.readTimeoutMs}ms): ${e}`,
                );
                e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
            }
        }

        return { installedLocal, installedGlobal };
    }

    async getAdapters(
        update?: boolean,
        bigUpdate?: boolean,
        indicateUpdate?: boolean,
    ) {
        console.log('[ADAPTERS] getAdapters');

        const currentHost = this.state.currentHost;
        update = update || this.props.adaptersWorker.isForceUpdate();

        if (!this.state.update && (update || indicateUpdate)) {
            this.setState({ update: true });
        }

        let adapters: Record<string, ioBroker.AdapterObject>;

        try {
            adapters = await this.props.adaptersWorker.getAdapters(update) || {};
        } catch (e) {
            window.alert(`Cannot getAdapters: ${e}`);
        }

        const { installedLocal, installedGlobal } = await this.getInstalled(update);

        let repository: Record<string, RepoAdapterObject>;
        try {
            repository = await this.props.socket
                .getRepository(
                    currentHost,
                    { repo: this.props.systemConfig.common.activeRepo, update: bigUpdate || indicateUpdate },
                    update,
                    this.state.readTimeoutMs,
                );
        } catch (e)  {
            window.alert(`Cannot getRepository: ${e}`);
            e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
        }

        return this.analyseInstalled({
            adapters, installedLocal, repository, installedGlobal,
        });
    }

    getWordVotes(votes: number): string {
        if (votes === 1) {
            return this.t('vote');
        }
        if (votes >= 2 && votes <= 4) {
            return this.t('votes2');
        }
        if (votes >= 5 && votes <= 20) {
            return this.t('votes');
        }
        const v = votes % 10;
        if (v === 1) {
            return this.t('vote21');
        }
        if (v >= 2 && v <= 4) {
            return this.t('votes2');
        }
        return this.t('votes');
    }

    static getAdapterTitle(
        /** adapter name */
        adapterName: string,
        adapters: Record<string, ioBroker.AdapterCommon | AdapterCacheEntry>,
        lang: ioBroker.Languages,
    ) {
        if (!adapters[adapterName]) {
            return adapterName;
        }
        const titleObj: ioBroker.StringOrTranslated = (adapters[adapterName] as ioBroker.AdapterCommon).titleLang || adapters[adapterName].title;
        let title: string;
        if (typeof titleObj === 'object') {
            title = titleObj[lang] || titleObj.en;
        } else {
            title = titleObj;
        }
        title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '');
        return title.toLowerCase();
    }

    static sortAdapters(
        list: string[],
        lang: ioBroker.Languages,
        installed: InstalledInfo,
        adapters: Record<string, RepoAdapterObject | AdapterCacheEntry>,
        sortByName: boolean,
        sortPopularFirst?: boolean,
        sortRecentlyUpdated?: boolean,
    ) {
        const titles: { [adapterName: string]: string } = {};
        list.sort((a, b) => {
            if (sortPopularFirst) {
                if (adapters[b].stat === adapters[a].stat) {
                    titles[a] = titles[a] || Adapters.getAdapterTitle(a, adapters, lang);
                    titles[b] = titles[b] || Adapters.getAdapterTitle(b, adapters, lang);

                    return titles[a] > titles[b] ? 1 : titles[a] < titles[b] ? -1 : 0;
                }
                return adapters[b].stat - adapters[a].stat;
            }
            if (sortRecentlyUpdated) {
                if (!adapters[a]) {
                    return -1;
                }
                if (!adapters[b]) {
                    return 1;
                }
                if ((adapters[a] as AdapterCacheEntry).daysAgo === (adapters[b] as AdapterCacheEntry).daysAgo) {
                    titles[a] = titles[a] || Adapters.getAdapterTitle(a, adapters, lang);
                    titles[b] = titles[b] || Adapters.getAdapterTitle(b, adapters, lang);

                    return titles[a] > titles[b] ? 1 : titles[a] < titles[b] ? -1 : 0;
                }
                return (adapters[a] as AdapterCacheEntry).daysAgo - (adapters[b] as AdapterCacheEntry).daysAgo;
            }

            if (installed[a] && installed[b]) {
                if (sortByName) {
                    return a > b ? 1 : (a < b ? -1 : 0);
                }
                titles[a] = titles[a] || Adapters.getAdapterTitle(a, adapters, lang);
                titles[b] = titles[b] || Adapters.getAdapterTitle(b, adapters, lang);

                return titles[a] > titles[b] ? 1 : titles[a] < titles[b] ? -1 : 0;
            }
            if (installed[a]) {
                return -1;
            }
            if (installed[b]) {
                return 1;
            }

            if (sortByName) {
                return a > b ? 1 : (a < b ? -1 : 0);
            }
            // sort by real language name and not by adapter name
            titles[a] = titles[a] || Adapters.getAdapterTitle(a, adapters, lang);
            titles[b] = titles[b] || Adapters.getAdapterTitle(b, adapters, lang);

            return titles[a] > titles[b] ? 1 : titles[a] < titles[b] ? -1 : 0;
        });
    }

    calculateInfo(
        compactInstances: Record<string, CompactInstanceInfo>,
        ratings?: Ratings | null,
        hostData?: HostInfo & { 'Active instances': number; location: string; Uptime: number } | null,
        compactRepositories?: CompactSystemRepository | null,
    ) {
        hostData = hostData || this.state.hostData;
        ratings = ratings || this.state.ratings;
        compactInstances = compactInstances || this.state.compactInstances;
        if (!(compactRepositories as CompactSystemRepository)?._id) {
            compactRepositories = this.state.compactRepositories;
        }

        const adapters = this.state.adapters;

        const installed: InstalledInfo = JSON.parse(JSON.stringify(this.state.installed));
        const repository: Record<string, RepoAdapterObject> = JSON.parse(JSON.stringify(this.state.repository));

        const nodeJsVersion = (hostData?.['Node.js'] || '').replace('v', '');
        const hostOs = hostData?.os || '';

        const categories: { [categoryType: string]: {
            name: string;
            translation: string;
            count: number;
            installed: number;
            adapters: string[];
        }; } = {};
        const categoriesSorted: {
            name: string;
            translation: string;
            count: number;
            installed: number;
            adapters: string[];
        }[] = [];
        let categoriesExpanded: { [categoryName: string]: boolean } = {};
        try {
            categoriesExpanded =
                JSON.parse(((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.expandedCategories')) || {};
        } catch (error) {
            // ignore
        }

        Object.keys(installed).forEach(adapterName => {
            const adapter = installed[adapterName];
            if (adapters[adapterName]?.common?.ignoreVersion) {
                adapter.ignoreVersion = adapters[adapterName].common.ignoreVersion;
            }

            if (!adapter.controller && adapterName !== 'hosts') {
                if (!repository[adapterName]) {
                    repository[adapterName] = JSON.parse(JSON.stringify(adapter));
                    repository[adapterName].version = '';
                }
            }
            adapter.count = 0;
            adapter.enabled = 0;
        });

        Object.keys(compactInstances).forEach(id => {
            const adapterName = compactInstances[id].name;
            if (installed[adapterName]) {
                installed[adapterName].count++;
            }
        });

        const now = Date.now();
        this.recentUpdatedAdapters = 0;
        this.installedAdapters = 0;

        Object.keys(repository).forEach(adapterName => {
            if (adapterName === 'hosts') {
                return;
            }
            if (adapterName.startsWith('_')) {
                return;
            }
            const adapter: RepoAdapterObject & { rating?: AdapterRatingInfo } = repository[adapterName];
            if (adapter.keywords) {
                adapter.keywords = adapter.keywords.map(word => word.toLowerCase());
            }
            const _installed = installed[adapterName];

            adapter.rating = ratings?.[adapterName] as AdapterRatingInfo;

            if (adapter.rating?.rating) {
                adapter.rating.title = [
                    `${this.t('Total rating:')} ${adapter.rating.rating.r} (${
                        adapter.rating.rating.c
                    } ${this.getWordVotes(adapter.rating.rating.c)})`,
                    _installed && _installed.version && adapter.rating[_installed.version]
                        ? `${this.t('Rating for')} v${_installed.version}: ${adapter.rating[_installed.version].r} (${
                            adapter.rating[_installed.version].c
                        } ${this.getWordVotes(adapter.rating.rating.c)})`
                        : '',
                ]
                    .filter(i => i)
                    .join('\n');
            } else {
                adapter.rating = { title: this.t('No rating or too few data') } as AdapterRatingInfo;
            }

            if (!adapter.controller) {
                const type: string = adapter.type;
                const installedInGroup = installed[adapterName];

                const daysAgo = Math.round((now - new Date(adapter.versionDate).getTime()) / 86400000);

                if (daysAgo <= 31) {
                    this.recentUpdatedAdapters++;
                }
                if (installed[adapterName]) {
                    this.installedAdapters++;
                }

                if (!categories[type]) {
                    categories[type] = {
                        name: type,
                        translation: this.t(`${type}_group`),
                        count: 1,
                        installed: installedInGroup ? 1 : 0,
                        adapters: [adapterName],
                    };
                } else {
                    categories[type].count++;
                    categories[type].adapters.push(adapterName);
                    if (installedInGroup) {
                        categories[type].installed++;
                    }
                }
            }
        });

        Object.keys(categories)
            .sort((a, b) => {
                if (a === 'general' && b !== 'general') {
                    return -1;
                }
                if (a !== 'general' && b === 'general') {
                    return 1;
                }
                if (categories[a].translation > categories[b].translation) {
                    return 1;
                }
                if (categories[a].translation < categories[b].translation) {
                    return -1;
                }
                return 0;
            })
            .forEach(categoryType => categoriesSorted.push(categories[categoryType]));

        // const _titles = {};
        const sortByName = this.state.filterTiles === 'Name A-Z';

        Object.keys(categories).forEach(type =>
            Adapters.sortAdapters(categories[type].adapters, this.props.lang, installed, repository, sortByName));

        let installedList = 0;
        try {
            installedList = JSON.parse(((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.installedList'));
            // @ts-expect-error back compatibility
            if (installedList === false) {
                installedList = 0;
            }
        } catch (error) {
            // ignore
        }
        const oneListView = ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.list') === 'true';
        const tableViewMode = ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.viewMode') === 'true';
        const updateList = ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.updateList') === 'true';
        const categoriesTiles =
            ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.categoriesTiles') || 'All';
        let filterTiles = ((window as any)._localStorage as Storage || window.localStorage).getItem('Adapters.filterTiles') || 'Description A-Z';
        if (filterTiles === 'A-Z') {
            filterTiles = 'Description A-Z';
        }
        this.allAdapters = Object.keys(repository).length - 1;

        this.cache.listOfVisibleAdapter = null;

        return new Promise<void>(resolve => {
            this.setState(
                {
                    repository,
                    installed,
                    ratings,
                    filterTiles,
                    categoriesTiles,
                    compactRepositories: compactRepositories as CompactSystemRepository,
                    installedList,
                    compactInstances,
                    updateList,
                    tableViewMode,
                    oneListView,
                    lastUpdate: Date.now(),
                    hostData,
                    hostOs,
                    nodeJsVersion,
                    categories: categoriesSorted,
                    categoriesExpanded,
                    init: true,
                    update: false,
                },
                () => resolve(),
            );
        });
    }

    async getAdaptersInfo(update?: boolean, indicateUpdate?: boolean) {
        if (!this.state.currentHost) {
            return;
        }

        // Do not update too often
        if (Date.now() - this.state.lastUpdate > 1_000) {
            console.log('[ADAPTERS] getAdaptersInfo');

            const currentHost = this.state.currentHost;

            let ratings: Ratings | null;
            try {
                if (!this.state.update || indicateUpdate) {
                    await new Promise<void>(resolve => {
                        this.setState({ update: true }, () => resolve());
                    });
                }
                const hostData: HostInfo & { 'Active instances': number; location: string; Uptime: number } = await this.props.socket.getHostInfo(currentHost, update, this.state.readTimeoutMs).catch(e => {
                    window.alert(`Cannot getHostInfo for "${currentHost}": ${e}`);
                    e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                });

                if (this.props.adminGuiConfig.admin.adapters?.allowAdapterRating !== false) {
                    ratings = await this.props.socket.getRatings(update).catch(e => window.alert(`Cannot read ratings: ${e}`));
                    this.uuid = ratings?.uuid || null;
                } else {
                    ratings = null;
                }

                const compactInstances = await this.props.socket.getCompactInstances(update)
                    .catch(e => {
                        window.alert(`Cannot read countsOfInstances: ${e}`);
                        return {};
                    });

                const compactRepositoriesEx = await this.props.socket.getCompactSystemRepositories(update)
                    .catch(e => {
                        window.alert(`Cannot read getCompactSystemRepositories: ${e}`);
                        return {};
                    });
                const compactRepositories: CompactSystemRepository = compactRepositoriesEx as CompactSystemRepository;

                await this.calculateInfo(compactInstances || {}, ratings, hostData, compactRepositories);
            } catch (error) {
                window.alert(`Cannot get adapters info: ${error}`);
            }
        }
    }

    toggleCategory(category: string) {
        this.setState(oldState => {
            const categoriesExpanded = oldState.categoriesExpanded;
            categoriesExpanded[category] = !categoriesExpanded[category];

            ((window as any)._localStorage as Storage || window.localStorage).setItem(
                'Adapters.expandedCategories',
                JSON.stringify(categoriesExpanded),
            );

            return { categoriesExpanded };
        });
    }

    rightDependencies = (adapterName: string): boolean => {
        const adapter = this.state.repository[adapterName];
        let result = true;

        if (adapter) {
            const dependencies = adapter.dependencies;
            const nodeVersion = adapter.node;

            if (dependencies) {
                if (dependencies instanceof Array) {
                    dependencies.forEach(dependency => {
                        const checkVersion = typeof dependency !== 'string';
                        const keys = Object.keys(dependency);
                        const name = !checkVersion ? dependency : keys ? keys[0] : null;

                        if (result && name) {
                            const installed = this.state.installed[name];

                            try {
                                result = installed
                                    ? checkVersion
                                        ? semver.satisfies(installed.version, dependency[name], {
                                            includePrerelease: true,
                                        })
                                        : true
                                    : false;
                            } catch (e) {
                                result = true;
                            }
                        }
                    });
                } else if (typeof dependencies === 'object') {
                    // back compatibility
                    const _deps: { [_adapterName: string]: string } = dependencies as any as { [_adapterName: string]: string };
                    Object.keys(_deps).forEach(_adapterName => {
                        if (_adapterName && _deps[_adapterName] !== undefined && result) {
                            const installed = this.state.installed[_adapterName];
                            const checkVersion = typeof _deps[_adapterName] === 'string';
                            try {
                                result = installed
                                    ? checkVersion
                                        ? semver.satisfies(installed.version, _deps[_adapterName], {
                                            includePrerelease: true,
                                        })
                                        : true
                                    : false;
                            } catch (e) {
                                result = true;
                            }
                        }
                    });
                } else {
                    console.error(`[ADAPTERS] Invalid dependencies for ${adapterName}: ${JSON.stringify(dependencies)}`);
                }
            }

            if (result && nodeVersion) {
                try {
                    result = semver.satisfies(this.state.nodeJsVersion, nodeVersion);
                } catch (e) {
                    result = true;
                }
            }
        }

        return result;
    };

    rightOs(adapterName: string): boolean {
        const adapter = this.state.repository[adapterName];

        if (adapter?.os) {
            if (Array.isArray(adapter.os)) {
                return !!adapter.os.find(hostOs => this.state.hostOs === hostOs);
            }
            return this.state.hostOs === adapter.os;
        }

        return true;
    }

    handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(
            value => {
                ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapter.search', value || '');
                this.typingTimer = null;
                this.filterAdapters(value);
            },
            300,
            event.target.value,
        );
    }

    // toggleConnectionTypeFilter() {
    //     this.setState({ filterConnectionType: !this.state.filterConnectionType });
    // }

    expandAll() {
        this.setState(oldState => {
            const categories = oldState.categories;
            const categoriesExpanded = oldState.categoriesExpanded;

            categories.forEach(category => (categoriesExpanded[category.name] = true));

            ((window as any)._localStorage as Storage || window.localStorage).setItem(
                'Adapters.expandedCategories',
                JSON.stringify(categoriesExpanded),
            );

            return { categoriesExpanded };
        });
    }

    collapseAll() {
        const categoriesExpanded = {};

        ((window as any)._localStorage as Storage || window.localStorage).setItem(
            'Adapters.expandedCategories',
            JSON.stringify(categoriesExpanded),
        );

        this.setState({ categoriesExpanded });
    }

    listTable() {
        const oneListView = !this.state.oneListView;
        if (oneListView) {
            this.expandAll();
        }
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.list', oneListView ? 'true' : 'false');
        this.setState({ oneListView });
    }

    changeViewMode() {
        this.cache.listOfVisibleAdapter = null;
        const tableViewMode = !this.state.tableViewMode;

        // By the list view, the filterTiles can be only 'Description A-Z' or 'Name A-Z'
        let filterTiles = this.state.filterTiles;
        if (tableViewMode && filterTiles !== 'Description A-Z' && filterTiles !== 'Name A-Z') {
            filterTiles = 'Description A-Z';
            ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.filterTiles', filterTiles);
        }

        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.viewMode', tableViewMode ? 'true' : 'false');
        this.setState({ tableViewMode, filterTiles });
    }

    changeUpdateList() {
        this.cache.listOfVisibleAdapter = null;
        const updateList = !this.state.updateList;
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.updateList', updateList ? 'true' : 'false');
        this.setState({ updateList });
    }

    changeInstalledList(onlyInstalled?: boolean) {
        this.cache.listOfVisibleAdapter = null;
        let installedList = !this.state.installedList ? 1 : this.state.installedList < 2 ? 2 : 0;
        if (!installedList && onlyInstalled) {
            installedList = 1;
        }
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.installedList', JSON.stringify(installedList));
        this.setState({ installedList });
    }

    changeFilterTiles(filterTiles: string) {
        this.cache.listOfVisibleAdapter = null; // rebuild cache
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.filterTiles', filterTiles);
        this.setState({ filterTiles });
    }

    changeCategoriesTiles(categoriesTiles: string) {
        this.cache.listOfVisibleAdapter = null;
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Adapters.categoriesTiles', categoriesTiles);
        this.setState({ categoriesTiles });
    }

    filterAdapters(search?: string) {
        this.cache.listOfVisibleAdapter = null;
        search = search === undefined ? this.state.search : search;
        search = (search || '').toLowerCase().trim();
        let filteredList: string[] = [];
        if (search) {
            this.state.categories.forEach(category =>
                category.adapters.forEach(name => {
                    const adapter = this.state.repository[name];
                    if (!adapter) {
                        return;
                    }

                    let title = adapter.titleLang || adapter.title;
                    if (typeof title === 'object') {
                        title = title[this.props.lang] || title.en;
                    }
                    title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '');
                    let desc: string;
                    if (adapter.desc) {
                        if (typeof adapter.desc === 'string') {
                            desc = adapter.desc;
                        } else {
                            desc = adapter.desc[this.props.lang] || adapter.desc.en || '';
                        }
                    } else {
                        desc = '';
                    }

                    if (name.includes(search)) {
                        filteredList.push(name);
                    } else if (title && typeof title === 'string' && title.toLowerCase().includes(search)) {
                        filteredList.push(name);
                    } else if (desc && typeof desc === 'string' && desc.toLowerCase().includes(search)) {
                        filteredList.push(name);
                    } else {
                        adapter.keywords &&
                            adapter.keywords.forEach(value => value.includes(search) && filteredList.push(name));
                    }
                }));
        } else {
            filteredList = null;
        }
        this.setState({ filteredList, search });
    }

    clearAllFilters() {
        ((window as any)._localStorage as Storage || window.localStorage).removeItem('Adapter.search');
        ((window as any)._localStorage as Storage || window.localStorage).removeItem('Adapters.installedList');
        ((window as any)._localStorage as Storage || window.localStorage).removeItem('Adapters.updateList');
        if (this.inputRef.current) {
            this.inputRef.current.value = '';
        }
        this.setState(
            {
                filteredList: null,
                updateList: false,
                filterConnectionType: false,
                installedList: 0,
                search: '',
            },
            () => this.filterAdapters(),
        );
    }

    getContext(descHidden: boolean): AdaptersContext {
        return {
            expertMode: this.props.expertMode,
            commandRunning: this.props.commandRunning,
            t: this.t,
            socket: this.props.socket,
            removeUpdateAvailable: (adapterName: string) => {
                const updateAvailable = [...this.state.updateAvailable];
                const pos = updateAvailable.indexOf(adapterName);
                if (pos !== -1) {
                    updateAvailable.splice(pos, 1);
                    this.setState({ updateAvailable });
                }
            },
            toggleTranslation: this.props.toggleTranslation,
            noTranslation: this.props.noTranslation,
            rightDependenciesFunc: this.rightDependencies,
            lang: this.props.lang,
            uuid: this.uuid,
            themeType: this.props.themeType,
            theme: this.props.theme,
            onUpdating: this.props.onUpdating,
            /** Information about ALL KNOWN adapters in the ioBroker infrastructure. Repo */
            repository: this.state.repository,
            /** Information about all installed adapters on this host */
            installed: this.state.installed,
            /** Information about all installed adapters on all hosts */
            installedGlobal: this.state.installedGlobal,
            /** very compact information about instances */
            compactInstances: this.state.compactInstances || {},
            /** Information about installed adapters */
            adapters: this.state.adapters,
            nodeJsVersion: this.state.nodeJsVersion,
            currentHost: this.state.currentHost,
            /** The host ID of the admin adapter, like system.host.test */
            adminHost: this.props.adminHost,
            adminInstance: this.props.adminInstance,
            /** Current selected host */
            instancesWorker: this.props.instancesWorker,
            hostsWorker: this.props.hostsWorker,
            executeCommand: this.props.executeCommand,
            /** node.js version of current host */
            categories: this.state.categories,
            descHidden,
            sortPopularFirst: !this.state.tableViewMode && this.state.filterTiles === 'Popular first',
            sortRecentlyUpdated: !this.state.tableViewMode && this.state.filterTiles === 'Recently updated',
            isTileView: !this.state.tableViewMode,
            updateRating: (adapter: string, rating: RatingDialogRepository) => {
                const repository = JSON.parse(JSON.stringify(this.state.repository));
                Object.assign(repository[adapter].rating, rating);
                this.setState({ repository });
            },
        } as AdaptersContext;
    }

    buildCache(context: AdaptersContext) {
        this.cache.listOfVisibleAdapter = [];
        this.cache.adapters = {};
        const now = Date.now();
        const textDaysAgo0 = this.t('0 %d days ago');
        const textDaysAgo1 = this.t('1 %d days ago');
        const textDaysAgo2 = this.t('2 %d days ago');
        const textDaysAgo = this.t('5 %d days ago');

        // get all visible adapters
        this.state.categories
            .filter(cat =>
                this.state.tableViewMode ||
                !this.state.categoriesTiles ||
                this.state.categoriesTiles === 'All' ||
                cat.name === this.state.categoriesTiles)
            .forEach(category =>
                category.adapters.forEach(adapterName => {
                    const adapter = this.state.repository[adapterName];

                    if (adapter && !adapter.controller) {
                        const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                        const updateAvailable = this.state.updateAvailable.includes(adapterName);
                        const installed = this.state.installed[adapterName];

                        let show = !this.state.filteredList || this.state.filteredList.includes(adapterName);
                        if (show && this.state.filterConnectionType) {
                            show = connectionType === 'local';
                        }
                        if (show && this.state.updateList) {
                            show = updateAvailable;
                        }
                        if (show && this.state.installedList) {
                            show =
                                this.state.installedList < 2
                                    ? !!(installed && installed.version)
                                    : !!(installed && installed.version && !installed.count);
                        }
                        if (show) {
                            this.cache.listOfVisibleAdapter.push(adapterName);
                            const daysAgo10 = Math.round((now - new Date(adapter.versionDate).getTime()) / 8640000);
                            const daysAgo = Math.round(daysAgo10 / 10);

                            const titleObj = adapter.titleLang || adapter.title;
                            let title: string;
                            if (titleObj && typeof titleObj === 'object') {
                                title = titleObj[this.props.lang] || titleObj.en;
                            } else {
                                title = titleObj as string || adapterName;
                            }
                            title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '');

                            let desc;
                            if (adapter.desc) {
                                if (typeof adapter.desc === 'string') {
                                    desc = adapter.desc;
                                } else {
                                    desc = adapter.desc[this.props.lang] || adapter.desc.en || '';
                                }
                            } else {
                                desc = '';
                            }

                            const _daysAgo10 = daysAgo % 100 <= 10 || daysAgo % 100 >= 20 ? daysAgo % 10 : 5;

                            this.cache.adapters[adapterName] = {
                                title,
                                desc,
                                image:
                                    installed && this.state.adapters[`system.adapter.${adapterName}`]
                                        ? `.${installed.localIcon}`
                                        : adapter.extIcon,
                                connectionType: adapter.connectionType ? adapter.connectionType : '-',
                                updateAvailable: this.state.updateAvailable.includes(adapterName),
                                rightDependencies: this.rightDependencies(adapterName),
                                rightOs: this.rightOs(adapterName),
                                sentry: !!adapter.plugins?.sentry,
                                daysAgo: daysAgo10,
                                stat: adapter.stat || 0,
                                daysAgoText: (daysAgo || daysAgo === 0)
                                    ? daysAgo === 0
                                        ? textDaysAgo0
                                        : _daysAgo10 === 1
                                            ? textDaysAgo1.replace('%d', daysAgo.toString())
                                            : _daysAgo10 === 2 || _daysAgo10 === 3 || _daysAgo10 === 4
                                                ? textDaysAgo2.replace('%d', daysAgo.toString())
                                                : textDaysAgo.replace('%d', daysAgo.toString())
                                    : '',
                            };
                        }
                    }
                }));

        this.listOfVisibleAdapterLength = this.cache.listOfVisibleAdapter.length;

        const sortByName = this.state.filterTiles === 'Name A-Z';

        if (this.state.tableViewMode) {
            this.state.categories.forEach(category =>
                Adapters.sortAdapters(
                    category.adapters,
                    this.props.lang,
                    this.state.installed,
                    this.cache.adapters,
                    sortByName,
                ));
        }

        Adapters.sortAdapters(
            this.cache.listOfVisibleAdapter,
            this.props.lang,
            this.state.installed,
            this.cache.adapters,
            sortByName,
            context.sortPopularFirst,
            context.sortRecentlyUpdated,
        );

        console.log(`[ADAPTERS] ${new Date().toISOString()} Update cache!`);
        this.forceUpdate();
    }

    getUpdater() {
        if (!this.state.showUpdater) {
            return null;
        }
        return <AdaptersUpdaterDialog
            theme={this.props.theme}
            onSetCommandRunning={commandRunning => this.props.onSetCommandRunning(commandRunning)}
            t={this.props.t}
            currentHost={this.state.currentHost}
            lang={this.props.lang}
            installed={this.state.installed}
            repository={this.state.repository}
            toggleTranslation={this.props.toggleTranslation}
            noTranslation={this.props.noTranslation}
            onClose={reload =>
                this.setState({ showUpdater: false }, () => reload && this.updateAll(true, false))}
            socket={this.props.socket}
        />;
    }

    getDescWidth() {
        if (this.props.menuOpened) {
            return document.body.scrollWidth - SUM - 180 + 13;
        }
        if (this.props.menuClosed) {
            return document.body.scrollWidth - SUM;
        }
        // if (this.props.menuCompact) {
        return document.body.scrollWidth - SUM - 50 + 13;
    }

    getStatistics() {
        if (this.state.showStatistics) {
            return <Dialog open={!0} onClose={() => this.setState({ showStatistics: false })}>
                <DialogTitle>{this.t('Statistics')}</DialogTitle>
                <DialogContent style={{ fontSize: 16 }}>
                    <Box component="div" sx={styles.counters}>
                        {this.t('Total adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.allAdapters}</span>
                    </Box>
                    <Box component="div" sx={styles.counters}>
                        {this.t('Installed adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.installedAdapters}</span>
                    </Box>
                    <Box component="div" sx={styles.counters}>
                        {this.t('Last month updated adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.recentUpdatedAdapters}</span>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ showStatistics: false })}
                        color="primary"
                        autoFocus
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>;
        }
        return null;
    }

    renderGitHubInstallDialog(context: AdaptersContext) {
        if (!this.state.gitHubInstallDialog) {
            return null;
        }

        return <GitHubInstallDialog
            t={this.t}
            categories={this.state.categories}
            upload={adapterName => this.props.executeCommand(`upload ${adapterName}${this.props.expertMode ? ' --debug' : ''}`)}
            installFromUrl={(adapterName, debug, customUrl) => this.addInstance({
                adapterName,
                debug,
                customUrl,
                context,
            })}
            repository={this.state.repository}
            onClose={() => {
                this.setState({ gitHubInstallDialog: false });
            }}
        />;
    }

    renderHeader() {
        let updateAllButtonAvailable =
            !this.props.commandRunning &&
            !!this.props.ready &&
            !!this.state.updateList &&
            this.state.updateAvailable.length > 1;

        // it is not possible to update admin in bulk
        if (
            updateAllButtonAvailable &&
            this.state.updateAvailable.length === 2 &&
            this.state.updateAvailable.includes('admin')
        ) {
            updateAllButtonAvailable = false;
        }

        return <TabHeader>
            <Tooltip title={this.t('Change view mode')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.changeViewMode()}>
                    {this.state.tableViewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={this.t('Check adapter for updates')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.updateAll(true, true)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            {this.state.tableViewMode && !this.state.oneListView && <Tooltip title={this.t('expand all')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.expandAll()}>
                    <FolderOpenIcon />
                </IconButton>
            </Tooltip>}
            {this.state.tableViewMode && !this.state.oneListView && <Tooltip title={this.t('collapse all')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.collapseAll()}>
                    <FolderIcon />
                </IconButton>
            </Tooltip>}
            {this.state.tableViewMode && <Tooltip title={this.t('list')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.listTable()}>
                    <ListIcon color={this.state.oneListView ? 'primary' : 'inherit'} />
                </IconButton>
            </Tooltip>}

            {/* <Tooltip title={this.t('Filter local connection type')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton size="large" onClick={() => this.toggleConnectionTypeFilter()}>
                    <CloudOffIcon color={this.state.filterConnectionType ? 'primary' : 'inherit'} />
                </IconButton>
             </Tooltip> */}
            {this.state.updateList ? <IconButton size="large" onClick={() => this.changeInstalledList(true)}>
                <StarIcon
                    color="primary"
                    style={{ opacity: 0.3, color: this.state.installedList === 2 ? 'red' : undefined }}
                />
            </IconButton> :
                <Tooltip
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                    title={this.t(
                        !this.state.installedList
                            ? 'Show only installed'
                            : this.state.installedList === 1
                                ? 'Showed only installed adapters'
                                : 'Showed only installed adapters without instance.',
                    )}
                >
                    <IconButton size="large" onClick={() => this.changeInstalledList()}>
                        <StarIcon
                            style={this.state.installedList === 2 ? { color: 'red' } : null}
                            color={
                                this.state.installedList === 1 ? 'primary' : 'inherit'
                            }
                        />
                    </IconButton>
                </Tooltip>}
            <IsVisible config={this.props.adminGuiConfig.admin} name="admin.adapters.filterUpdates">
                <Tooltip title={this.t('Filter adapter with updates')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                    <IconButton size="large" onClick={() => this.changeUpdateList()}>
                        <UpdateIcon color={this.state.updateList ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
            </IsVisible>
            {updateAllButtonAvailable && <Tooltip title={this.t('Update all adapters')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                <IconButton
                    size="large"
                    onClick={() => this.setState({ showUpdater: true })}
                    style={styles.updateAllButton}
                >
                    <UpdateIcon />
                    <UpdateIcon className="admin-update-second-icon" />
                </IconButton>
            </Tooltip>}

            {this.props.expertMode && this.props.adminGuiConfig.admin?.adapters.gitHubInstall !== false &&
                <Tooltip title={this.t('Install from custom URL')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                    <IconButton size="large" onClick={() => this.setState({ gitHubInstallDialog: true })}>
                        <GithubIcon />
                    </IconButton>
                </Tooltip>}
            <div style={styles.grow} />
            <TextField
                variant="standard"
                inputRef={this.inputRef}
                label={this.t('Filter by name')}
                defaultValue={this.state.search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.handleFilterChange(event)}
                InputProps={{
                    endAdornment: this.state.search ? (
                        <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    ((window as any)._localStorage as Storage || window.localStorage).removeItem('Adapter.search');
                                    this.inputRef.current.value = '';
                                    this.setState({ search: '' }, () => this.filterAdapters());
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment>
                    ) : null,
                }}
            />

            {!this.state.tableViewMode && <CustomSelectButton
                t={this.t}
                icons
                contained={this.state.categoriesTiles !== 'All'}
                translateSuffix="_group"
                arrayItem={[{ name: 'All' }, ...this.state.categories]}
                onClick={value => this.changeCategoriesTiles(value as string)}
                value={this.state.categoriesTiles}
            />}
            <CustomSelectButton
                t={this.t}
                arrayItem={this.state.tableViewMode ? FILTERS.filter(item => !item.notByList) : FILTERS}
                onClick={value => this.changeFilterTiles(value as string)}
                value={this.state.filterTiles}
            />
            <div style={styles.grow} />
            <IsVisible config={this.props.adminGuiConfig.admin} name="admin.adapters.statistics">
                <Hidden only={['xs', 'sm']}>
                    <Box
                        component="div"
                        sx={styles.infoAdapters}
                        onClick={() => this.setState({ showStatistics: true })}
                    >
                        <Box component="div" sx={{ ...styles.counters, ...styles.greenText }}>
                            {this.t('Selected adapters')}
                            <div ref={this.countRef} />
                        </Box>
                        <Box component="div" sx={styles.counters}>
                            {this.t('Total adapters')}
                            :
                            <div>{this.allAdapters}</div>
                        </Box>
                        <Box component="div" sx={styles.counters}>
                            {this.t('Installed adapters')}
                            :
                            <div>{this.installedAdapters}</div>
                        </Box>
                        <Box component="div" sx={styles.counters}>
                            {this.t('Last month updated adapters')}
                            :
                            <div>{this.recentUpdatedAdapters}</div>
                        </Box>
                    </Box>
                </Hidden>
            </IsVisible>
        </TabHeader>;
    }

    render() {
        if (!this.state.init) {
            return <LinearProgress />;
        }

        // update adapters because the repository could be changed
        if (this.state.triggerUpdate !== this.props.triggerUpdate) {
            setTimeout(() => {
                this.setState({ triggerUpdate: this.props.triggerUpdate }, () => this.updateAll(true));
            }, 100);
        }

        if (
            this.props.currentHost !== this.state.currentHost ||
            this.props.forceUpdateAdapters !== this.state.forceUpdateAdapters
        ) {
            this.hostsTimer =
                this.hostsTimer ||
                setTimeout(() => {
                    this.hostsTimer = null;
                    this.setState(
                        {
                            currentHost: this.props.currentHost,
                            forceUpdateAdapters: this.props.forceUpdateAdapters,
                        },
                        () => this.updateAll(false, false, true),
                    );
                }, 200);
        }

        // fast check if active repo is stable
        let stableRepo = Utils.isStableRepository(this.props.systemConfig.common.activeRepo);

        // if repositories are available
        const repositories: Record<string, ioBroker.RepositoryInformation> = this.state.compactRepositories?.native?.repositories;
        if (repositories) {
            // new style with multiple active repositories
            if (
                this.props.systemConfig.common.activeRepo &&
                typeof this.props.systemConfig.common.activeRepo !== 'string'
            ) {
                // if any active repo is not stable, show warning
                stableRepo = !this.props.systemConfig.common.activeRepo.find(
                    repo => !repo.toLowerCase().startsWith('stable') && !repositories[repo]?.json?._repoInfo?.stable,
                );
            }
        }

        let repoName: string;
        if (!stableRepo) {
            repoName = Array.isArray(this.props.systemConfig.common.activeRepo)
                ? this.props.systemConfig.common.activeRepo.join(', ')
                : this.props.systemConfig.common.activeRepo;

            // old style with just one active repository
            if (typeof this.props.systemConfig.common.activeRepo === 'string') {
                const repoInfo =
                    repositories && repositories[this.props.systemConfig.common.activeRepo]?.json?._repoInfo;

                if (repoInfo?.name) {
                    if (repoInfo.name && typeof repoInfo.name === 'object') {
                        repoName = repoInfo.name[this.props.lang] || repoInfo.name.en;
                    } else {
                        // @ts-expect-error deprecated
                        repoName = repoInfo.name as string;
                    }
                }
            } else if (
                // new style with multiple active repositories
                this.props.systemConfig.common.activeRepo &&
                typeof this.props.systemConfig.common.activeRepo !== 'string'
            ) {
                repoName = this.props.systemConfig.common.activeRepo
                    .map(repo => {
                        const repoInfo = repositories && repositories[repo]?.json?._repoInfo;
                        if (repoInfo?.name) {
                            if (repoInfo.name && typeof repoInfo.name === 'object') {
                                return repoInfo.name[this.props.lang] || repoInfo.name.en;
                            }
                            // @ts-expect-error deprecated
                            return repoInfo.name as string;
                        }
                        return repo;
                    })
                    .join(', ');
            }
        }

        const context = this.getContext(this.state.descWidth < 50);

        if (!this.cache.listOfVisibleAdapter) {
            this.buildCacheTimer = this.buildCacheTimer || setTimeout(() => {
                this.buildCacheTimer = null;
                this.buildCache(context);
            }, 0);
        }

        return <TabContainer>
            {this.state.update && <Grid item>
                <LinearProgress />
            </Grid>}

            {this.renderHeader()}

            <AdaptersList
                stableRepo={stableRepo}
                repoName={repoName}
                context={context}
                systemConfig={this.props.systemConfig}
                tableViewMode={this.state.tableViewMode}
                oneListView={this.state.oneListView}
                update={this.state.update}
                cachedAdapters={this.cache.adapters}
                categories={this.state.categories}
                categoriesExpanded={this.state.categoriesExpanded}
                listOfVisibleAdapter={this.cache.listOfVisibleAdapter}
                toggleCategory={category => this.toggleCategory(category)}
                clearAllFilters={() => this.clearAllFilters()}
                descWidth={this.state.descWidth}
                sortByName={this.state.filterTiles === 'Name A-Z'}
                sortPopularFirst={context.sortPopularFirst}
                sortRecentlyUpdated={context.sortRecentlyUpdated}
            />

            {this.getUpdater()}
            {this.getStatistics()}
            {this.renderSlowConnectionWarning()}
            {this.renderGitHubInstallDialog(context)}
        </TabContainer>;
    }
}

export default Adapters;
