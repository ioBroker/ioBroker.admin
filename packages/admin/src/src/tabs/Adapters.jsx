/* eslint-disable array-callback-return */
import React, { Component, Fragment, createRef } from 'react';
import semver from 'semver';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Grid,
    Button,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    InputAdornment,
    ListItemText,
    Hidden,
    DialogTitle,
    DialogContent,
    DialogActions,
    Dialog,
} from '@mui/material';

// import CloudOffIcon from '@mui/icons-material/CloudOff';
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
    Link as LinkIcon,
} from '@mui/icons-material';
import { FaGithub as GithubIcon } from 'react-icons/fa';

import { blue, green } from '@mui/material/colors';

import AdapterDeletionDialog from '@/dialogs/AdapterDeletionDialog';
import AdapterUpdateDialog, { checkCondition } from '@/dialogs/AdapterUpdateDialog';
import AddInstanceDialog from '@/dialogs/AddInstanceDialog';
import AdapterRow from '@/components/Adapters/AdapterRow';
import AdapterTile from '@/components/Adapters/AdapterTile';
import TabContainer from '@/components/TabContainer';
import TabContent from '@/components/TabContent';
import TabHeader from '@/components/TabHeader';
import CustomSelectButton from '@/components/CustomSelectButton';
import GitHubInstallDialog from '@/dialogs/GitHubInstallDialog';
import LicenseDialog from '@/dialogs/LicenseDialog';
import CustomModal from '@/components/CustomModal';
import AdaptersUpdaterDialog from '@/dialogs/AdaptersUpdaterDialog';
import RatingDialog from '@/dialogs/RatingDialog';
import SlowConnectionWarningDialog from '@/dialogs/SlowConnectionWarningDialog';
import IsVisible from '@/components/IsVisible';
import Utils from '@/components/Utils';
import AdminUpdater from '@/dialogs/AdminUpdater';
import BasicUtils from '@/Utils';

const WIDTHS = {
    emptyBlock: 50,
    name: 300,
    connectionType: 120,
    installed: 120,
    available: 120,
    update: 40,
    license: 80,
    install: 220,
};

const SUM = Object.keys(WIDTHS).reduce((s, i) => s + WIDTHS[i], 0);

const styles = theme => ({
    container: {
        height: '100%',
        width: '100%',
    },
    containerNotFullHeight: {
        height: 'calc(100% - 22px)',
    },
    containerFullHeight: {
        height: '100%',
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
    },
    table: {
        width: '100%',
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 4,
            paddingLeft: 4,
        },
        '& th': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingTop: 2,
            paddingBottom: 2,
            paddingRight: 4,
            paddingLeft: 4,
        },
    },
    hidden: {
        visibility: 'hidden',
    },
    name: {
        flexWrap: 'nowrap',
        width: WIDTHS.name,
    },
    emptyBlock: {
        flexWrap: 'nowrap',
        width: WIDTHS.emptyBlock,
    },
    description: {
        width: `calc(100% - ${SUM}px)`,
    },
    keywords: {},
    connectionType: {
        width: WIDTHS.connectionType,
    },
    installed: {
        width: WIDTHS.installed,
    },
    available: {
        width: WIDTHS.available,
        paddingRight: 6,
    },
    update: {
        width: WIDTHS.update,
        padding: 0,
    },
    license: {
        width: WIDTHS.license,
    },
    install: {
        width: WIDTHS.install,
    },
    green: {
        color: green[500],
    },
    blue: {
        color: blue[700],
    },
    category: {
        backgroundColor: theme.palette.background.default,
    },
    grow: {
        flexGrow: 1,
    },
    updateAvailable: {
        color: green[700],
    },
    tabContainer: {
        overflow: 'auto',
    },
    containerVersion: {
        borderBottom: 0,
    },
    containerSpecificVersion: {
        display: 'flex',
        marginTop: 20,
    },
    currentVersion: {
        display: 'flex',
        padding: 20,
        fontSize: 15,
        borderBottom: '1px solid silver',
        transition: 'background 0.2s',
        cursor: 'pointer',
        '&:hover': {
            background: '#c0c0c045',
        },
    },
    updateAllButton: {
        position: 'relative',
    },
    updateAllIcon: {
        position: 'absolute',
        top: 15,
        left: 15,
        opacity: 0.4,
        color: theme.palette.mode === 'dark' ? '#aad5ff' : '#007fff',
    },
    counters: {
        marginRight: 10,
        minWidth: 120,
        display: 'flex',
        '& div': {
            marginLeft: 3,
        },
    },
    visible: {
        opacity: 0,
    },
    infoAdapters: {
        fontSize: 10,
        color: theme.palette.mode === 'dark' ? '#9c9c9c' : '#333',
        cursor: 'pointer',
    },
    greenText: {
        color: '#00a005d1',
    },
    rating: {
        marginBottom: 20,
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
    },
    notStableRepo: {
        background: theme.palette.mode === 'dark' ? '#8a7e00' : '#fdee20',
        color: '#000',
        fontSize: 14,
        padding: '2px 8px',
        borderRadius: 5,
    },
    viewModeDiv: {
        display: 'flex',
        flexFlow: 'wrap',
        overflow: 'auto',
        justifyContent: 'center',
    },
});

const FILTERS = [
    { name: 'Description A-Z' },
    { name: 'Name A-Z' },
    { name: 'Popular first', notByList: true },
    { name: 'Recently updated', notByList: true },
];

class Adapters extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lastUpdate: 0,
            repository: {},
            /** Adapters installed on same host, without object changes installed just contains io-package information, not enriched information like installedFrom */
            installed: {},
            /** This contains the adapters installed on same and other hosts */
            installedGlobal: {},
            adapters: {},
            instances: {},
            categories: [],
            hostData: {},
            compactRepositories: null,
            hostOs: '',
            nodeJsVersion: '',
            init: false,
            addInstanceDialog: false,
            addInstanceAdapter: '',
            addInstanceId: 'auto',
            addInstanceHostName: '',
            adapterDeletionDialog: false,
            adapterDeletionAdapter: null,
            update: false,
            filterConnectionType: false,
            search: (window._localStorage || window.localStorage).getItem('Adapter.search') || '',
            list: false,
            viewMode: false,
            updateList: false,
            installedList: false,
            categoriesTiles: 'All',
            filterTiles: 'Description A-Z',
            gitHubInstallDialog: false,
            updateAvailable: [],
            filteredList: null,
            showUpdater: false,
            descWidth: 300,
            showStatistics: false,
            showSetRating: null,
            readTimeoutMs: SlowConnectionWarningDialog.getReadTimeoutMs(),
            showSlowConnectionWarning: false,
            adapterToUpdate: '',
            adapterInstallVersion: '',
            adapterInstallSpecificVersion: '',
            currentHost: this.props.currentHost,
            forceUpdateAdapters: this.props.forceUpdateAdapters,
            triggerUpdate: props.triggerUpdate,
            /** Upgrade admin version to given one */
            adminUpgradeTo: null,
        };

        this.inputRef = createRef();
        this.countRef = createRef();

        this.t = this.translate;
        this.wordCache = {};
        this.cache = {};
        this.listOfVisibleAdapterLength = 0;
        this.allAdapters = 0;
        this.installedAdapters = 0;
        this.recentUpdatedAdapters = 0;
        this.uuid = '';
    }

    translate = (word, arg1, arg2) => {
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
            this.updateAll().then(() => {
                this.state.search && this.filterAdapters();
                this.props.adaptersWorker.registerHandler(this.onAdaptersChanged);
                this.props.instancesWorker.registerHandler(this.onAdaptersChanged);
            });
        }
    }

    updateAll(update, bigUpdate, indicateUpdate) {
        return this.getAdapters(update, bigUpdate, indicateUpdate).then(() =>
            this.getAdaptersInfo(update, indicateUpdate));
    }

    componentDidUpdate() {
        const descWidth = this.getDescWidth();
        if (this.state.descWidth !== descWidth) {
            this.setState({ descWidth });
        }
        if (this.countRef.current) {
            this.countRef.current.innerHTML = this.listOfVisibleAdapterLength;
        }
    }

    componentWillUnmount() {
        this.updateTimeout && clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
        this.props.adaptersWorker.unregisterHandler(this.onAdaptersChanged);
        this.props.instancesWorker.unregisterHandler(this.onAdaptersChanged);
    }

    onAdaptersChanged = events => {
        this.tempAdapters = this.tempAdapters || JSON.parse(JSON.stringify(this.state.adapters || {}));
        this.tempInstalled = this.tempInstalled || JSON.parse(JSON.stringify(this.state.installed || {}));
        this.tempInstances = this.tempInstances || JSON.parse(JSON.stringify(this.state.instances || {}));

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
                        if (event.obj.common[attr] !== undefined && attr !== 'installedFrom') {
                            this.tempInstalled[name][attr] = event.obj.common[attr];
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
            const instances = this.tempInstances;
            this.tempInstances = null;

            this.analyseInstalled({ adapters, installedLocal: installed, cb: () => this.calculateInfo(instances) });
        }, 300);
    };

    /** @typedef {{ adapters?: Record<string, any>, installedLocal?: Record<string, any>, installedGlobal?: Record<string, any>, repository?: any, cb?: () => void }} AnalyseInstalledOptions */
    /**
     * Enriches information of the installed adapters with those of the repository and sets them to the state
     *
     * @param {AnalyseInstalledOptions} options information of installed adapters
     */
    analyseInstalled(options) {
        let {
            adapters, repository,
        } = options;

        const { cb, installedLocal } = options;
        let { installedGlobal } = options;

        adapters = adapters || this.state.adapters;
        const installed = installedLocal || this.state.installed;
        installedGlobal = installedGlobal || this.state.installedGlobal;
        repository = repository || this.state.repository;

        const updateAvailable = [];

        Object.keys(installed).forEach(value => {
            if (installed[value]) {
                const version = installed[value].version;
                const repositoryValue = repository[value];

                if (
                    repositoryValue &&
                    repositoryValue.version !== version &&
                    BasicUtils.updateAvailable(version, repositoryValue.version) &&
                    !updateAvailable.includes(value)
                ) {
                    updateAvailable.push(value);
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
     *
     * @param {boolean} update
     */
    async getInstalled(update) {
        /** Installed adapters on the same host */
        let installedLocal;
        /** Installed adapters on any hosts */
        let installedGlobal = {};

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

    getAdapters = async (update, bigUpdate, indicateUpdate) => {
        console.log('[ADAPTERS] getAdapters');

        const currentHost = this.state.currentHost;
        update = update || this.props.adaptersWorker.isForceUpdate();

        if (!this.state.update && (update || indicateUpdate)) {
            this.setState({ update: true });
        }

        let adapters;

        try {
            adapters = await this.props.adaptersWorker.getAdapters(update);
        } catch (e) {
            window.alert(`Cannot getAdapters: ${e}`);
        }

        const { installedLocal, installedGlobal } = await this.getInstalled(update);

        let repository;
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
    };

    getWordVotes(votes) {
        if (votes === 1) {
            return this.t('vote');
        } if (votes >= 2 && votes <= 4) {
            return this.t('votes2');
        } if (votes >= 5 && votes <= 20) {
            return this.t('votes');
        }
        const v = votes % 10;
        if (v === 1) {
            return this.t('vote21');
        } if (v >= 2 && v <= 4) {
            return this.t('votes2');
        }
        return this.t('votes');
    }

    static getAdapterTitle(adapter, adapters, lang) {
        if (!adapters[adapter]) {
            return adapter;
        }
        let title = adapters[adapter].titleLang || adapters[adapter].title;
        if (typeof title === 'object') {
            title = title[lang] || title.en;
        }
        title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '');
        return title.toLowerCase();
    }

    static sortAdapters(list, lang, installed, adapters, sortByName, sortPopularFirst, sortRecentlyUpdated) {
        const titles = {};
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
                if (adapters[a].daysAgo === adapters[b].daysAgo) {
                    titles[a] = titles[a] || Adapters.getAdapterTitle(a, adapters, lang);
                    titles[b] = titles[b] || Adapters.getAdapterTitle(b, adapters, lang);

                    return titles[a] > titles[b] ? 1 : titles[a] < titles[b] ? -1 : 0;
                }
                return adapters[a].daysAgo - adapters[b].daysAgo;
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

    calculateInfo(instances, ratings, hostData, compactRepositories) {
        hostData = hostData || this.state.hostData;
        ratings = ratings || this.state.ratings;
        instances = instances || this.state.instances;
        compactRepositories = compactRepositories || this.state.compactRepositories;

        const adapters = this.state.adapters;

        const installed = JSON.parse(JSON.stringify(this.state.installed));
        const repository = JSON.parse(JSON.stringify(this.state.repository));

        const nodeJsVersion = (hostData['Node.js'] || '').replace('v', '');
        const hostOs = hostData.os;

        const categories = {};
        const categoriesSorted = [];
        let categoriesExpanded = {};
        try {
            categoriesExpanded =
                JSON.parse((window._localStorage || window.localStorage).getItem('Adapters.expandedCategories')) || {};
        } catch (error) {
            // ignore
        }

        Object.keys(installed).forEach(value => {
            const adapter = installed[value];
            if (adapters[value]?.common?.ignoreVersion) {
                adapter.ignoreVersion = adapters[value].common.ignoreVersion;
            }

            if (!adapter.controller && value !== 'hosts') {
                if (!repository[value]) {
                    repository[value] = JSON.parse(JSON.stringify(adapter));
                    repository[value].version = '';
                }
            }
            adapter.count = 0;
            adapter.enabled = 0;
        });

        Object.keys(instances).forEach(id => {
            const adapterName = instances[id].name;
            if (installed[adapterName]) {
                installed[adapterName].count++;
            }
        });

        const now = Date.now();
        this.recentUpdatedAdapters = 0;
        this.installedAdapters = 0;

        Object.keys(repository).forEach(value => {
            if (value === 'hosts') {
                return;
            }
            if (value.startsWith('_')) {
                return;
            }
            const adapter = repository[value];
            if (adapter.keywords) {
                adapter.keywords = adapter.keywords.map(word => word.toLowerCase());
            }
            const _installed = installed[value];

            adapter.rating = ratings && ratings[value];

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
                adapter.rating = { title: this.t('No rating or too few data') };
            }

            if (!adapter.controller) {
                const type = adapter.type;
                const installedInGroup = installed[value];

                const daysAgo = Math.round((now - new Date(adapter.versionDate).getTime()) / 86400000);

                if (daysAgo <= 31) {
                    this.recentUpdatedAdapters++;
                }
                if (installed[value]) {
                    this.installedAdapters++;
                }

                if (!categories[type]) {
                    categories[type] = {
                        name: type,
                        translation: this.t(`${type}_group`),
                        count: 1,
                        installed: installedInGroup ? 1 : 0,
                        adapters: [value],
                    };
                } else {
                    categories[type].count++;
                    categories[type].adapters.push(value);
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
                } if (a !== 'general' && b === 'general') {
                    return 1;
                } if (categories[a].translation > categories[b].translation) {
                    return 1;
                } if (categories[a].translation < categories[b].translation) {
                    return -1;
                }
                return 0;
            })
            .forEach(value => categoriesSorted.push(categories[value]));

        // const _titles = {};
        const sortByName = this.state.filterTiles === 'Name A-Z';

        Object.keys(categories).forEach(type =>
            Adapters.sortAdapters(categories[type].adapters, this.props.lang, installed, repository, sortByName));

        let installedList = false;
        try {
            installedList = JSON.parse((window._localStorage || window.localStorage).getItem('Adapters.installedList'));
        } catch (error) {
            // ignore
        }
        const list = (window._localStorage || window.localStorage).getItem('Adapters.list') === 'true';
        const viewMode = (window._localStorage || window.localStorage).getItem('Adapters.viewMode') === 'true';
        const updateList = (window._localStorage || window.localStorage).getItem('Adapters.updateList') === 'true';
        const categoriesTiles =
            (window._localStorage || window.localStorage).getItem('Adapters.categoriesTiles') || 'All';
        let filterTiles = (window._localStorage || window.localStorage).getItem('Adapters.filterTiles') || 'Description A-Z';
        if (filterTiles === 'A-Z') {
            filterTiles = 'Description A-Z';
        }
        this.allAdapters = Object.keys(repository).length - 1;

        this.cache.listOfVisibleAdapter = null;

        return new Promise(resolve => {
            this.setState(
                {
                    repository,
                    installed,
                    ratings,
                    filterTiles,
                    categoriesTiles,
                    compactRepositories,
                    installedList,
                    instances,
                    updateList,
                    viewMode,
                    list,
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

    getAdaptersInfo = (update, indicateUpdate) => {
        if (!this.state.currentHost) {
            return Promise.resolve();
        }

        // Do not update too often
        if (Date.now() - this.state.lastUpdate > 1_000) {
            console.log('[ADAPTERS] getAdaptersInfo');

            const currentHost = this.state.currentHost;

            let hostData;
            let ratings;
            let instances;

            return new Promise(resolve => {
                if (!this.state.update || indicateUpdate) {
                    this.setState({ update: true }, () => resolve());
                } else {
                    resolve();
                }
            })
                .then(() =>
                    this.props.socket.getHostInfo(currentHost, update, this.state.readTimeoutMs).catch(e => {
                        window.alert(`Cannot getHostInfo for "${currentHost}": ${e}`);
                        e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                    }))
                .then(_hostData => {
                    hostData = _hostData;
                    /* return this.props.socket.checkFeatureSupported('CONTROLLER_NPM_AUTO_REBUILD')
                        .catch(e => window.alert('Cannot checkFeatureSupported: ' + e));
                })
                .then(_rebuild => {
                    rebuild = _rebuild; */
                    if (this.props.adminGuiConfig.adapters?.allowAdapterRating === false) {
                        return Promise.resolve({});
                    }

                    return this.props.socket.getRatings(update).catch(e => window.alert(`Cannot read ratings: ${e}`));
                })
                .then(_ratings => {
                    ratings = _ratings;
                    return this.props.socket.getCompactInstances(update).catch(e => {
                        window.alert(`Cannot read countsOfInstances: ${e}`);
                        return {};
                    });
                })
                .then(_instances => {
                    instances = _instances;
                    return this.props.socket.getCompactSystemRepositories(update).catch(e => {
                        window.alert(`Cannot read getCompactSystemRepositories: ${e}`);
                        return {};
                    });
                })
                .then(compactRepositories => {
                    this.uuid = ratings?.uuid || null;
                    return this.calculateInfo(instances, ratings, hostData, compactRepositories);
                })
                .catch(error => window.alert(`Cannot get adapters info: ${error}`));
        }

        return Promise.resolve();
    };

    /**
     *
     * @param adapter name like admin or if customUrl is true packetName or iobroker.admin@latest or url
     * @param instance
     * @param debug
     * @param customUrl
     * @return {Promise<unknown>}
     */
    async addInstance(adapter, instance, debug = false, customUrl = false) {
        if (!customUrl) {
            const adapterObject = this.state.repository[adapter];

            const messages = checkCondition(
                adapterObject.messages,
                null,
                adapterObject.version,
                this.state.instances,
            );

            if (!instance && (this.props.expertMode || messages)) {
                this.setState({
                    addInstanceDialog: true,
                    addInstanceAdapter: adapter,
                    addInstanceHostName: this.state.currentHost.replace(/^system\.host\./, ''),
                    addInstanceId: instance || 'auto',
                });
                return null;
            }

            if (instance) {
                const instances = this.props.instancesWorker.getInstances();
                // if the instance already exists
                if (instances[`system.adapter.${adapter}.${instance}`]) {
                    window.alert(this.props.t('Instance %s already exists', `${adapter}.${instance}`));
                    return null;
                }
            }
        }

        const host = (this.state.addInstanceHostName || this.state.currentHost).replace(/^system\.host\./, '');

        return new Promise((resolve, reject) => {
            this.props.executeCommand(
                `${customUrl ? 'url' : 'add'} ${adapter} ${instance ? `${instance} ` : ''}--host ${host} ${
                    debug || this.props.expertMode ? '--debug' : ''
                }`,
                host,
                exitCode => (!exitCode ? resolve(null) : reject(new Error(`The process returned an exit code of ${exitCode}`))),
            );
        });
    }

    upload(adapter) {
        this.props.executeCommand(`upload ${adapter}${this.props.expertMode ? ' --debug' : ''}`);
    }

    delete(adapter, deleteCustom) {
        this.props.executeCommand(
            `del ${adapter}${deleteCustom ? ' --custom' : ''}${this.props.expertMode ? ' --debug' : ''}`,
        );
    }

    async update(adapter, version) {
        if (adapter === 'admin' && this.props.host === this.props.currentHost && (await this.props.socket.checkFeatureSupported('ADAPTER_WEBSERVER_UPGRADE'))) {
            this.setState({ adminUpgradeTo: version });
            return;
        }

        this.props.executeCommand(`upgrade ${adapter}@${version}${this.props.expertMode ? ' --debug' : ''}`);
    }

    /**
     * Perform the Admin Upgrade via Webserver
     * This allows showing UI progress even admin is down
     *
     * @return {React.JSX.Element | null}
     */
    renderWebserverUpgrade() {
        if (!this.state.adminUpgradeTo)  {
            return null;
        }

        return <AdminUpdater
            socket={this.props.socket}
            themeType={this.props.themeType}
            host={this.props.host}
            onClose={reload =>
                this.setState({ showUpdater: false }, () => reload && this.updateAll(true, false))}
            version={this.state.adminUpgradeTo}
            adminInstance={this.props.adminInstance}
            onUpdating={isUpdating => this.props.onUpdating(isUpdating)}
        />;
    }

    closeAddInstanceDialog() {
        this.setState({
            addInstanceDialog: false,
            addInstanceAdapter: '',
            addInstanceId: 'auto',
        });
    }

    openAdapterDeletionDialog(adapter) {
        this.setState({
            adapterDeletionDialog: true,
            adapterDeletionAdapter: adapter,
        });
    }

    closeAdapterDeletionDialog() {
        this.setState({
            adapterDeletionDialog: false,
            adapterDeletionAdapter: null,
        });
    }

    toggleCategory(category) {
        this.setState(oldState => {
            const categoriesExpanded = oldState.categoriesExpanded;
            categoriesExpanded[category] = !categoriesExpanded[category];

            (window._localStorage || window.localStorage).setItem(
                'Adapters.expandedCategories',
                JSON.stringify(categoriesExpanded),
            );

            return { categoriesExpanded };
        });
    }

    handleHostsChange(hostName) {
        this.setState({ addInstanceHostName: hostName.replace(/^system\.host\./, '') });
    }

    handleInstanceChange(event) {
        this.setState({ addInstanceId: event.target.value });
    }

    getDependencies = value => {
        const adapter = this.state.repository[value];
        const result = [];

        if (adapter) {
            if (adapter.dependencies && !Array.isArray(adapter.dependencies)) {
                adapter.dependencies = [adapter.dependencies];
            }

            if (adapter.globalDependencies && !Array.isArray(adapter.globalDependencies)) {
                adapter.globalDependencies = [adapter.globalDependencies];
            }

            const nodeVersion = adapter.node;

            if (adapter.dependencies?.length) {
                for (const dependency of adapter.dependencies) {
                    const entry = {
                        name: '',
                        version: null,
                        installed: false,
                        installedVersion: null,
                        rightVersion: false,
                    };

                    const checkVersion = typeof dependency !== 'string';
                    const keys = Object.keys(dependency);
                    entry.name = !checkVersion ? dependency : keys ? keys[0] : null;
                    entry.version = checkVersion ? dependency[entry.name] : null;

                    if (result && entry.name) {
                        const installed = this.state.installed[entry.name];

                        entry.installed = !!installed;
                        entry.installedVersion = installed ? installed.version : null;
                        try {
                            entry.rightVersion = installed
                                ? checkVersion
                                    ? semver.satisfies(installed.version, entry.version, { includePrerelease: true })
                                    : true
                                : false;
                        } catch (e) {
                            entry.rightVersion = true;
                        }
                    }

                    result.push(entry);
                }
            }

            if (adapter.globalDependencies?.length) {
                for (const dependency of adapter.globalDependencies) {
                    const entry = {
                        name: '',
                        version: null,
                        installed: false,
                        installedVersion: null,
                        rightVersion: false,
                    };

                    const checkVersion = typeof dependency !== 'string';
                    const keys = Object.keys(dependency);
                    entry.name = !checkVersion ? dependency : keys ? keys[0] : null;
                    entry.version = checkVersion ? dependency[entry.name] : null;

                    if (result && entry.name) {
                        const installed = this.state.installedGlobal[entry.name];

                        entry.installed = !!installed;
                        entry.installedVersion = installed ? installed.version : null;
                        try {
                            entry.rightVersion = installed
                                ? checkVersion
                                    ? semver.satisfies(installed.version, entry.version, { includePrerelease: true })
                                    : true
                                : false;
                        } catch (e) {
                            entry.rightVersion = true;
                        }
                    }

                    result.push(entry);
                }
            }

            if (nodeVersion) {
                const entry = {
                    name: 'node',
                    version: nodeVersion,
                    installed: true,
                    installedVersion: this.state.nodeJsVersion,
                    rightVersion: false,
                };

                try {
                    entry.rightVersion = semver.satisfies(this.state.nodeJsVersion, nodeVersion);
                } catch (e) {
                    entry.rightVersion = true;
                }

                result.push(entry);
            }
        }

        return result;
    };

    rightDependencies(value) {
        const adapter = this.state.repository[value];
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
                    Object.keys(dependencies).forEach(dependency => {
                        if (dependency && dependencies[dependency] !== undefined && result) {
                            const installed = this.state.installed[dependency];
                            const checkVersion = typeof dependencies[dependency] !== 'string';
                            try {
                                result = installed
                                    ? checkVersion
                                        ? semver.satisfies(installed.version, dependency[dependency], {
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
                    console.error(`[ADAPTERS] Invalid dependencies for ${value}: ${JSON.stringify(dependencies)}`);
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
    }

    rightOs(value) {
        const adapter = this.state.repository[value];

        if (adapter?.os) {
            return !!adapter.os.find(_value => this.state.hostOs === _value);
        }

        return true;
    }

    /**
     * Open adapter readme or docs
     *
     * @param {{ adapter: string, lang: ioBroker.Languages}} options the adapter name and prefered language
     */
    openInfoDialog(options) {
        const { lang, adapter: adapterName } = options;
        window.open(BasicUtils.getDocsLinkForAdapter({ lang, adapterName }), 'help');
    }

    openUpdateDialog(adapterToUpdate) {
        this.setState({ adapterToUpdate });
    }

    openInstallVersionDialog(adapterInstallVersion) {
        this.setState({ adapterInstallVersion });
    }

    closeAdapterUpdateDialog(cb) {
        this.setState({ adapterToUpdate: '' }, () => cb && cb());
    }

    renderSetRatingDialog() {
        if (this.state.showSetRating) {
            return (
                <RatingDialog
                    t={this.t}
                    lang={this.props.lang}
                    version={this.state.showSetRating.version}
                    adapter={this.state.showSetRating.adapter}
                    repository={this.state.repository}
                    currentRating={this.state.showSetRating.rating}
                    onClose={repository => {
                        if (repository) {
                            this.setState({ showSetRating: null, repository });
                        } else {
                            this.setState({ showSetRating: null });
                        }
                    }}
                    uuid={this.uuid}
                />
            );
        }
        return null;
    }

    getNews(value, all = false) {
        const adapter = this.state.repository[value];
        const installed = this.state.installed[value];
        const news = [];

        if (installed && adapter?.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed.version) || all) {
                        news.push({
                            version,
                            news: this.props.noTranslation
                                ? adapter.news[version].en
                                : adapter.news[version][this.props.lang] || adapter.news[version].en,
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`[ADAPTERS] Cannot compare "${version}" and "${installed.version}" (${value})`);
                }
            });
        }

        return news;
    }

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(
            value => {
                (window._localStorage || window.localStorage).setItem('Adapter.search', value || '');
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

            (window._localStorage || window.localStorage).setItem(
                'Adapters.expandedCategories',
                JSON.stringify(categoriesExpanded),
            );

            return { categoriesExpanded };
        });
    }

    collapseAll() {
        const categoriesExpanded = {};

        (window._localStorage || window.localStorage).setItem(
            'Adapters.expandedCategories',
            JSON.stringify(categoriesExpanded),
        );

        this.setState({ categoriesExpanded });
    }

    listTable() {
        const list = !this.state.list;
        if (list) {
            this.expandAll();
        }
        (window._localStorage || window.localStorage).setItem('Adapters.list', list ? 'true' : 'false');
        this.setState({ list });
    }

    changeViewMode() {
        this.cache.listOfVisibleAdapter = null;
        const viewMode = !this.state.viewMode;

        // By the list view, the filterTiles can be only 'Description A-Z' or 'Name A-Z'
        let filterTiles = this.state.filterTiles;
        if (viewMode && filterTiles !== 'Description A-Z' && filterTiles !== 'Name A-Z') {
            filterTiles = 'Description A-Z';
            (window._localStorage || window.localStorage).setItem('Adapters.filterTiles', filterTiles);
        }

        (window._localStorage || window.localStorage).setItem('Adapters.viewMode', viewMode ? 'true' : 'false');
        this.setState({ viewMode, filterTiles });
    }

    changeUpdateList() {
        this.cache.listOfVisibleAdapter = null;
        const updateList = !this.state.updateList;
        (window._localStorage || window.localStorage).setItem('Adapters.updateList', updateList ? 'true' : 'false');
        this.setState({ updateList });
    }

    changeInstalledList(onlyInstalled) {
        this.cache.listOfVisibleAdapter = null;
        let installedList = !this.state.installedList ? 1 : this.state.installedList < 2 ? 2 : false;
        if (!installedList && onlyInstalled) {
            installedList = 1;
        }
        (window._localStorage || window.localStorage).setItem('Adapters.installedList', JSON.stringify(installedList));
        this.setState({ installedList });
    }

    changeFilterTiles(filterTiles) {
        this.cache.listOfVisibleAdapter = null; // rebuild cache
        (window._localStorage || window.localStorage).setItem('Adapters.filterTiles', filterTiles);
        this.setState({ filterTiles });
    }

    changeCategoriesTiles(categoriesTiles) {
        this.cache.listOfVisibleAdapter = null;
        (window._localStorage || window.localStorage).setItem('Adapters.categoriesTiles', categoriesTiles);
        this.setState({ categoriesTiles });
    }

    filterAdapters(search) {
        this.cache.listOfVisibleAdapter = null;
        search = search === undefined ? this.state.search : search;
        search = (search || '').toLowerCase().trim();
        let filteredList = [];
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
                    const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc.en || adapter.desc : '';

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

    renderLicenseDialog() {
        if (!this.state.showLicenseDialog) {
            return null;
        }

        return <LicenseDialog
            url={this.state.showLicenseDialog.url}
            onClose={result => {
                if (result) {
                    const instance = this.state.showLicenseDialog.instance;
                    if (this.state.showLicenseDialog.upload) {
                        this.upload(instance);
                    } else {
                        this.addInstance(instance);
                    }
                }
                this.setState({ showLicenseDialog: null });
            }}
        />;
    }

    getRow(value, descHidden) {
        const cached = this.cache.adapters[value];
        if (cached) {
            const adapter = this.state.repository[value];
            const installedAdapter = this.state.adapters[`system.adapter.${value}`]?.common ?? {};
            const installed = { ...installedAdapter, ...(this.state.installed[value] ?? {}) };

            if (cached.title instanceof Object || !cached.desc) {
                console.warn(`[ADAPTERS] ${value}`);
            }

            return <AdapterRow
                t={this.t}
                hostId={this.props.host}
                socket={this.props.socket}
                descHidden={descHidden}
                key={`adapter-${value}`}
                connectionType={cached.connectionType}
                dataSource={adapter.dataSource}
                description={cached.desc}
                adapter={value}
                versionDate={cached.daysAgoText}
                enabledCount={installed?.enabled}
                expertMode={this.props.expertMode}
                image={cached.image}
                installedCount={installed?.count}
                installedFrom={installed?.installedFrom}
                installedVersion={installed?.version}
                keywords={adapter.keywords}
                name={cached.title}
                license={adapter.licenseInformation?.license || adapter.license}
                licenseInformation={adapter.licenseInformation}
                updateAvailable={cached.updateAvailable}
                version={adapter.version}
                hidden={false}
                rightDependencies={cached.rightDependencies}
                rightOs={cached.rightOs}
                sentry={cached.sentry}
                commandRunning={this.props.commandRunning}
                rating={adapter.rating}
                onSetRating={() =>
                    this.setState({
                        showSetRating: {
                            adapter: value,
                            version: installed?.version,
                            rating: adapter.rating,
                        },
                    })}
                onAddInstance={() => {
                    let url = adapter.licenseUrl || adapter.licenseInformation?.link || adapter.extIcon || '';
                    if (url.includes('/main')) {
                        url = `${url.split('/main')[0]}/main/LICENSE`;
                    } else {
                        url = `${url.split('/master')[0]}/master/LICENSE`;
                    }

                    const license = adapter.licenseInformation?.license || adapter.license;

                    if (license === 'MIT') {
                        this.addInstance(value);
                    } else {
                        this.setState({ showLicenseDialog: { url, instance: value } });
                    }
                }}
                onDeletion={() => this.openAdapterDeletionDialog(value)}
                onInfo={() => {
                    const lang = adapter.docs?.[this.props.lang] ? this.props.lang : 'en';
                    this.openInfoDialog({ adapter: value, lang });
                }}
                onUpdate={() => this.openUpdateDialog(value)}
                openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                onUpload={() => {
                    let url = adapter.licenseUrl || adapter.licenseInformation?.link || adapter.extIcon || '';
                    if (url.includes('/main')) {
                        url = `${url.split('/main')[0]}/main/LICENSE`;
                    } else {
                        url = `${url.split('/master')[0]}/master/LICENSE`;
                    }

                    if (adapter.license !== 'MIT') {
                        this.setState({ showLicenseDialog: { url, instance: value, upload: true } });
                    } else {
                        this.upload(value);
                    }
                }}
                allowAdapterDelete={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterDelete : true
                }
                allowAdapterInstall={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterInstall : true
                }
                allowAdapterUpdate={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterUpdate : true
                }
                allowAdapterReadme={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterReadme : true
                }
                allowAdapterRating={
                    this.props.adminGuiConfig.admin.adapters
                        ? this.props.adminGuiConfig.admin.adapters.allowAdapterRating
                        : true
                }
            />;
        }
        return null;
    }

    clearAllFilters() {
        (window._localStorage || window.localStorage).removeItem('Adapter.search');
        (window._localStorage || window.localStorage).removeItem('Adapters.installedList');
        (window._localStorage || window.localStorage).removeItem('Adapters.updateList');
        if (this.inputRef.current) {
            this.inputRef.current.value = '';
        }
        this.setState(
            {
                filteredList: null,
                updateList: false,
                filterConnectionType: false,
                installedList: false,
                search: '',
            },
            () => this.filterAdapters(),
        );
    }

    getRows(descHidden) {
        if (!this.cache.listOfVisibleAdapter) {
            this.buildCache();
        }

        let count = 0;

        let rows;
        if (this.state.list) {
            rows = this.cache.listOfVisibleAdapter.map(value => {
                const item = this.getRow(value, descHidden);
                item && count++;
                return item;
            });
        } else {
            rows = this.state.categories.map(category => {
                const showCategory = category.adapters.find(value => this.cache.listOfVisibleAdapter.includes(value));
                if (!showCategory) {
                    return null;
                }
                const categoryName = category.name;
                const expanded = this.state.categoriesExpanded[categoryName];
                count++;

                return <Fragment key={`category-${categoryName} ${category.adapters.length}`}>
                    <AdapterRow
                        descHidden={descHidden}
                        key={`category-${categoryName}${1}`}
                        category
                        categoryName={categoryName}
                        count={category.count}
                        expanded={expanded}
                        installedCount={category.installed}
                        name={category.translation}
                        onToggle={() => this.toggleCategory(categoryName)}
                        t={this.t}
                        hidden={false}
                    />

                    {expanded &&
                        category.adapters.map(value => {
                            const item = this.getRow(value, descHidden);
                            item && count++;
                            return item;
                        })}
                </Fragment>;
            });
        }

        if (!count) {
            return !this.state.update && <tr>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <td
                    colSpan={4}
                    style={{
                        padding: 16,
                        fontSize: 18,
                        cursor: 'pointer',
                    }}
                    title={this.t('Click to clear all filters')}
                    onClick={() => this.clearAllFilters()}
                >
                    {this.t('all items are filtered out')}
                </td>
            </tr>;
        }
        return rows;
    }

    buildCache() {
        this.cache.listOfVisibleAdapter = [];
        this.cache.adapters = {};
        const now = Date.now();
        const textDaysAgo0 = this.t('0 %d days ago');
        const textDaysAgo1 = this.t('1 %d days ago');
        const textDaysAgo2 = this.t('2 %d days ago');
        const textDaysAgo = this.t('5 %d days ago');

        const sortPopularFirst = !this.state.viewMode && this.state.filterTiles === 'Popular first';
        const sortRecentlyUpdated = !this.state.viewMode && this.state.filterTiles === 'Recently updated';

        // get all visible adapters
        this.state.categories
            .filter(cat =>
                this.state.viewMode ||
                !this.state.categoriesTiles ||
                this.state.categoriesTiles === 'All' ||
                cat.name === this.state.categoriesTiles)
            .forEach(category =>
                category.adapters.forEach(value => {
                    const adapter = this.state.repository[value];

                    if (adapter && !adapter.controller) {
                        const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                        const updateAvailable = this.state.updateAvailable.includes(value);
                        const installed = this.state.installed[value];

                        let show = !this.state.filteredList || this.state.filteredList.includes(value);
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
                            this.cache.listOfVisibleAdapter.push(value);
                            const daysAgo10 = Math.round((now - new Date(adapter.versionDate).getTime()) / 8640000);
                            const daysAgo = Math.round(daysAgo10 / 10);

                            let title = adapter.titleLang || adapter.title;
                            if (typeof title === 'object') {
                                title = title[this.props.lang] || title.en;
                            }
                            title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '');

                            const _daysAgo10 = daysAgo % 100 <= 10 || daysAgo % 100 >= 20 ? daysAgo % 10 : 5;

                            this.cache.adapters[value] = {
                                title,
                                desc: adapter.desc
                                    ? adapter.desc[this.props.lang] || adapter.desc.en || adapter.desc
                                    : '',
                                image:
                                    installed && this.state.adapters[`system.adapter.${value}`]
                                        ? `.${installed.localIcon}`
                                        : adapter.extIcon,
                                connectionType: adapter.connectionType ? adapter.connectionType : '-',
                                updateAvailable: this.state.updateAvailable.includes(value),
                                rightDependencies: this.rightDependencies(value),
                                rightOs: this.rightOs(value),
                                sentry: !!(adapter.plugins && adapter.plugins.sentry),
                                daysAgo: daysAgo10,
                                stat: sortPopularFirst && adapter.stat,
                                daysAgoText:
                                    sortRecentlyUpdated && (daysAgo || daysAgo === 0)
                                        ? daysAgo === 0
                                            ? textDaysAgo0
                                            : _daysAgo10 === 1
                                                ? textDaysAgo1.replace('%d', daysAgo)
                                                : _daysAgo10 === 2 || _daysAgo10 === 3 || _daysAgo10 === 4
                                                    ? textDaysAgo2.replace('%d', daysAgo)
                                                    : textDaysAgo.replace('%d', daysAgo)
                                        : '',
                            };
                        }
                    }
                }));

        this.listOfVisibleAdapterLength = this.cache.listOfVisibleAdapter.length;

        const sortByName = this.state.filterTiles === 'Name A-Z';
        if (this.state.viewMode) {
            Object.keys(this.state.categories).forEach(type =>
                Adapters.sortAdapters(
                    this.state.categories[type].adapters,
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
            sortPopularFirst,
            sortRecentlyUpdated,
        );

        // console.log('[ADAPTERS] Update cache!');
    }

    getTiles() {
        if (!this.cache.listOfVisibleAdapter) {
            this.buildCache();
        }

        if (!this.cache.listOfVisibleAdapter.length) {
            return !this.state.update && <div
                style={{
                    margin: 20,
                    fontSize: 26,
                }}
            >
                {this.props.t('all items are filtered out')}
            </div>;
        }
        return this.cache.listOfVisibleAdapter.map(value => {
            const adapter = this.state.repository[value];
            const installedAdapter = this.state.adapters[`system.adapter.${value}`]?.common ?? {};
            const installed = { ...installedAdapter, ...(this.state.installed[value] ?? {}) };
            const cached = this.cache.adapters[value];

            if (cached.title instanceof Object || !cached.desc) {
                console.warn(`[ADAPTERS] ${JSON.stringify(adapter)}`);
            }

            return <AdapterTile
                hostId={this.props.host}
                socket={this.props.socket}
                t={this.t}
                commandRunning={this.props.commandRunning}
                key={`adapter-${value}`}
                image={cached.image}
                name={cached.title}
                dataSource={adapter.dataSource}
                adapter={value}
                stat={cached.stat}
                versionDate={cached.daysAgoText}
                connectionType={cached.connectionType}
                description={cached.desc}
                enabledCount={installed?.enabled}
                expertMode={this.props.expertMode}
                installedCount={installed?.count}
                installedFrom={installed?.installedFrom}
                installedVersion={installed?.version}
                keywords={adapter.keywords}
                license={adapter.licenseInformation?.license || adapter.license}
                licenseInformation={adapter.licenseInformation}
                updateAvailable={cached.updateAvailable}
                version={adapter.version}
                hidden={false}
                rightDependencies={cached.rightDependencies}
                rightOs={cached.rightOs}
                sentry={cached.sentry}
                rating={adapter.rating}
                onSetRating={() =>
                    this.setState({
                        showSetRating: {
                            adapter: value,
                            version: installed?.version,
                            rating: adapter.rating,
                        },
                    })}
                onAddInstance={() => {
                    let url = adapter.licenseUrl || adapter.licenseInformation?.link || adapter.extIcon || '';

                    if (url.includes('/main')) {
                        url = `${url.split('/main')[0]}/main/LICENSE`;
                    } else {
                        url = `${url.split('/master')[0]}/master/LICENSE`;
                    }

                    const license = adapter.licenseInformation?.license || adapter.license;

                    if (license === 'MIT') {
                        this.addInstance(value);
                    } else {
                        this.setState({ showLicenseDialog: { url, instance: value } });
                    }
                }}
                onDeletion={() => this.openAdapterDeletionDialog(value)}
                onInfo={() => {
                    const lang = adapter.docs?.[this.props.lang] ? this.props.lang : 'en';
                    this.openInfoDialog({ adapter: value, lang });
                }}
                onUpdate={() => this.openUpdateDialog(value)}
                openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                onUpload={() => {
                    let url = adapter.licenseUrl || adapter.licenseInformation?.link || adapter.extIcon || '';
                    if (url.includes('/main')) {
                        url = `${url.split('/main')[0]}/main/LICENSE`;
                    } else {
                        url = `${url.split('/master')[0]}/master/LICENSE`;
                    }

                    const license = adapter.licenseInformation?.license || adapter.license;

                    if (license !== 'MIT') {
                        this.setState({ showLicenseDialog: { url, instance: value, upload: true } });
                    } else {
                        this.upload(value);
                    }
                }}
                allowAdapterDelete={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterDelete : true
                }
                allowAdapterInstall={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterInstall : true
                }
                allowAdapterUpdate={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterUpdate : true
                }
                allowAdapterReadme={
                    this.state.repository[value] ? this.state.repository[value].allowAdapterReadme : true
                }
                allowAdapterRating={
                    this.props.adminGuiConfig.admin.adapters
                        ? this.props.adminGuiConfig.admin.adapters.allowAdapterRating
                        : true
                }
            />;
        });
    }

    getUpdater() {
        if (!this.state.showUpdater) {
            return null;
        }
        return <AdaptersUpdaterDialog
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
            return document.body.scrollWidth - SUM - 180 + 15;
        }
        if (this.props.menuClosed) {
            return document.body.scrollWidth - SUM;
        }
        // if (this.props.menuCompact) {
        return document.body.scrollWidth - SUM - 50 + 15;
    }

    getStatistics() {
        if (this.state.showStatistics) {
            return <Dialog open={!0} onClose={() => this.setState({ showStatistics: false })}>
                <DialogTitle>{this.t('Statistics')}</DialogTitle>
                <DialogContent style={{ fontSize: 16 }}>
                    <div className={this.props.classes.counters}>
                        {this.t('Total adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.allAdapters}</span>
                    </div>
                    <div className={this.props.classes.counters}>
                        {this.t('Installed adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.installedAdapters}</span>
                    </div>
                    <div className={this.props.classes.counters}>
                        {this.t('Last month updated adapters')}
:
                        {' '}
                        <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.recentUpdatedAdapters}</span>
                    </div>
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

        const { classes } = this.props;
        const descHidden = this.state.descWidth < 50;

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

        const formatNews = news => {
            const lines = (news || '')
                .toString()
                .split('\n')
                .map(line =>
                    line.trim().replace(/^\*+/, '').replace(/^-/, '').replace(/\*+$/, '')
                        .replace(/\r/g, '')
                        .trim())
                .filter(line => line);

            return <ul>
                {lines.map((line, index) => (
                    <li key={index}>{line}</li>
                ))}
            </ul>;
        };

        // fast check if active repo is stable
        let stableRepo = Utils.isStableRepository(this.props.systemConfig.common.activeRepo);

        // if repositories are available
        const repositories = this.state.compactRepositories?.native?.repositories;
        if (repositories) {
            // new style with multiple active repositories
            if (
                this.props.systemConfig.common.activeRepo &&
                typeof this.props.systemConfig.common.activeRepo !== 'string'
            ) {
                // if any active repo is not stable, show warning
                // Todo (BF 2022.08.19): remove this check after one month. Flag will be stored in _repoInfo
                stableRepo = !this.props.systemConfig.common.activeRepo.find(
                    repo =>
                        !repo.toLowerCase().startsWith('stable') &&
                        (!repositories[repo] || !repositories[repo].json?._repoInfo?.stable),
                );
            }
        }
        let repoName;
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
                        repoName = repoInfo.name;
                    }
                }
                // eslint-disable-next-line brace-style
            }

            // new style with multiple active repositories
            else if (
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
                            return repoInfo.name;
                        }
                        return repo;
                    })
                    .join(', ');
            }
        }

        return <TabContainer>
            {this.state.update && <Grid item>
                <LinearProgress />
            </Grid>}
            <TabHeader>
                <Tooltip title={this.t('Change view mode')}>
                    <IconButton size="large" onClick={() => this.changeViewMode()}>
                        {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('Check adapter for updates')}>
                    <IconButton size="large" onClick={() => this.updateAll(true, true)}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                {this.state.viewMode && !this.state.list && <>
                    <Tooltip title={this.t('expand all')}>
                        <IconButton size="large" onClick={() => this.expandAll()}>
                            <FolderOpenIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={this.t('collapse all')}>
                        <IconButton size="large" onClick={() => this.collapseAll()}>
                            <FolderIcon />
                        </IconButton>
                    </Tooltip>
                </>}
                {this.state.viewMode && <Tooltip title={this.t('list')}>
                    <IconButton size="large" onClick={() => this.listTable()}>
                        <ListIcon color={this.state.list ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>}

                {/* <Tooltip title={this.t('Filter local connection type')}>
                <IconButton size="large" onClick={() => this.toggleConnectionTypeFilter()}>
                    <CloudOffIcon color={this.state.filterConnectionType ? 'primary' : 'inherit'} />
                </IconButton>
             </Tooltip> */}
                {this.state.updateList ? <IconButton size="large" onClick={() => this.changeInstalledList(true)}>
                    <StarIcon
                        color="primary"
                        style={{ opacity: 0.3, color: this.state.installedList === 2 ? 'red' : undefined }}
                    />
                </IconButton>
                    :
                    <Tooltip
                        title={this.t(
                            !this.state.installedList
                                ? 'Show only installed'
                                : this.state.installedList < 2
                                    ? 'Showed only installed adapters'
                                    : 'Showed only installed adapters without instance.',
                        )}
                    >
                        <IconButton size="large" onClick={() => this.changeInstalledList()}>
                            <StarIcon
                                style={this.state.installedList === 2 ? { color: 'red' } : null}
                                color={
                                    this.state.installedList && this.state.installedList < 2 ? 'primary' : 'inherit'
                                }
                            />
                        </IconButton>
                    </Tooltip>}
                <IsVisible config={this.props.adminGuiConfig} name="admin.adapters.filterUpdates">
                    <Tooltip title={this.t('Filter adapter with updates')}>
                        <IconButton size="large" onClick={() => this.changeUpdateList()}>
                            <UpdateIcon color={this.state.updateList ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                </IsVisible>
                {updateAllButtonAvailable && <Tooltip title={this.t('Update all adapters')}>
                    <IconButton
                        size="large"
                        onClick={() => this.setState({ showUpdater: true })}
                        classes={{ label: this.props.classes.updateAllButton }}
                    >
                        <UpdateIcon />
                        <UpdateIcon className={this.props.classes.updateAllIcon} />
                    </IconButton>
                </Tooltip>}

                {this.props.expertMode && this.props.adminGuiConfig.admin.adapters?.gitHubInstall !== false &&
                    <Tooltip title={this.t('Install from custom URL')}>
                        <IconButton size="large" onClick={() => this.setState({ gitHubInstallDialog: true })}>
                            <GithubIcon />
                        </IconButton>
                    </Tooltip>}
                <div className={classes.grow} />
                <TextField
                    variant="standard"
                    inputRef={this.inputRef}
                    label={this.t('Filter by name')}
                    defaultValue={this.state.search}
                    onChange={event => this.handleFilterChange(event)}
                    InputProps={{
                        endAdornment: this.state.search ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        (window._localStorage || window.localStorage).removeItem('Adapter.search');
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

                {!this.state.viewMode && <CustomSelectButton
                    t={this.t}
                    icons
                    contained={this.state.categoriesTiles !== 'All'}
                    translateSuffix="_group"
                    arrayItem={[{ name: 'All' }, ...this.state.categories]}
                    onClick={value => this.changeCategoriesTiles(value)}
                    value={this.state.categoriesTiles}
                />}
                <CustomSelectButton
                    t={this.t}
                    arrayItem={this.state.viewMode ? FILTERS.filter(item => !item.notByList) : FILTERS}
                    onClick={value => this.changeFilterTiles(value)}
                    value={this.state.filterTiles}
                />
                <div className={classes.grow} />
                <IsVisible config={this.props.adminGuiConfig} name="admin.adapters.statistics">
                    <Hidden only={['xs', 'sm']}>
                        <div
                            className={classes.infoAdapters}
                            onClick={() => this.setState({ showStatistics: true })}
                        >
                            <div className={Utils.clsx(classes.counters, classes.greenText)}>
                                {this.t('Selected adapters')}
                                <div ref={this.countRef} />
                            </div>
                            <div className={classes.counters}>
                                {this.t('Total adapters')}
:
                                <div>{this.allAdapters}</div>
                            </div>
                            <div className={classes.counters}>
                                {this.t('Installed adapters')}
:
                                <div>{this.installedAdapters}</div>
                            </div>
                            <div className={classes.counters}>
                                {this.t('Last month updated adapters')}
:
                                <div>{this.recentUpdatedAdapters}</div>
                            </div>
                        </div>
                    </Hidden>
                </IsVisible>
            </TabHeader>
            {this.state.viewMode && this.props.systemConfig && this.props.systemConfig.common && <TabContent>
                {!stableRepo ? <div className={this.props.classes.notStableRepo}>
                    {this.t('Active repo is "%s"', repoName)}
                </div> : null}
                <TableContainer
                    className={Utils.clsx(
                        classes.container,
                        !stableRepo ? classes.containerNotFullHeight : classes.containerFullHeight,
                    )}
                >
                    <Table stickyHeader size="small" className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell className={classes.emptyBlock}></TableCell>
                                <TableCell className={classes.name}>
                                    <Typography>{this.t('Name')}</Typography>
                                </TableCell>
                                {!descHidden && (
                                    <TableCell
                                        className={classes.description}
                                        style={{ width: this.state.descWidth }}
                                    >
                                        <Typography>{this.t('Description')}</Typography>
                                    </TableCell>
                                )}
                                <TableCell className={classes.connectionType} />
                                <TableCell className={classes.installed}>
                                    <Typography>{this.t('Installed')}</Typography>
                                </TableCell>
                                <TableCell className={classes.available}>
                                    <Typography>{this.t('Available')}</Typography>
                                </TableCell>
                                <TableCell className={classes.license}>
                                    <Typography>{this.t('License')}</Typography>
                                </TableCell>
                                <TableCell className={classes.install}>
                                    <Typography>{this.t('Install')}</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>{this.getRows(descHidden)}</TableBody>
                    </Table>
                </TableContainer>
            </TabContent>}

            {this.getUpdater()}
            {this.renderWebserverUpgrade()}
            {this.getStatistics()}
            {this.renderSetRatingDialog()}
            {this.renderSlowConnectionWarning()}
            {this.renderLicenseDialog()}

            {!this.state.viewMode &&
                this.props.systemConfig.common &&
                this.props.systemConfig.common.activeRepo && <>
                {!stableRepo ? <div className={this.props.classes.notStableRepo}>
                    {this.t('Active repo is "%s"', repoName)}
                </div> : null}
                <div className={this.props.classes.viewModeDiv}>{this.getTiles()}</div>
            </>}

            {this.state.addInstanceDialog && <AddInstanceDialog
                adapter={this.state.addInstanceAdapter}
                socket={this.props.socket}
                hostsWorker={this.props.hostsWorker}
                instancesWorker={this.props.instancesWorker}
                repository={this.state.repository}
                dependencies={this.getDependencies(this.state.addInstanceAdapter)}
                currentHost={`system.host.${this.state.addInstanceHostName}`}
                currentInstance={this.state.addInstanceId}
                t={this.t}
                onClick={() => this.addInstance(this.state.addInstanceAdapter, this.state.addInstanceId)}
                onClose={() => this.closeAddInstanceDialog()}
                onHostChange={hostName => this.handleHostsChange(hostName)}
                onInstanceChange={event => this.handleInstanceChange(event)}
                adapterObject={this.state.repository[this.state.addInstanceAdapter]}
                instances={this.state.instances}
                toggleTranslation={this.props.toggleTranslation}
                noTranslation={this.props.noTranslation}
                expertMode={this.props.expertMode}
            />}
            {this.state.adapterDeletionDialog && <AdapterDeletionDialog
                adapter={this.state.adapterDeletionAdapter}
                socket={this.props.socket}
                t={this.t}
                onClick={deleteCustom => this.delete(this.state.adapterDeletionAdapter, deleteCustom)}
                onClose={() => this.closeAdapterDeletionDialog()}
            />}
            {this.state.gitHubInstallDialog && <GitHubInstallDialog
                t={this.t}
                categories={this.state.categories}
                upload={adapter => this.upload(adapter)}
                installFromUrl={(value, debug, customUrl) => this.addInstance(value, undefined, debug, customUrl)}
                repository={this.state.repository}
                onClose={() => {
                    this.setState({ gitHubInstallDialog: false });
                }}
            />}
            {this.state.adapterToUpdate && <AdapterUpdateDialog
                adapter={this.state.adapterToUpdate}
                adapterObject={this.state.repository[this.state.adapterToUpdate]}
                t={this.t}
                dependencies={this.getDependencies(this.state.adapterToUpdate)}
                rightDependencies={this.rightDependencies(this.state.adapterToUpdate)}
                news={this.getNews(this.state.adapterToUpdate)}
                toggleTranslation={this.props.toggleTranslation}
                noTranslation={this.props.noTranslation}
                installedVersion={this.state.installed[this.state.adapterToUpdate]?.version}
                onUpdate={version => {
                    const adapter = this.state.adapterToUpdate;
                    this.closeAdapterUpdateDialog(() => this.update(adapter, version));
                }}
                onIgnore={ignoreVersion => {
                    const adapter = this.state.adapterToUpdate;
                    this.closeAdapterUpdateDialog(() => {
                        this.props.socket
                            .getObject(`system.adapter.${adapter}`)
                            .then(obj => {
                                if (obj) {
                                    obj.common.ignoreVersion = ignoreVersion;
                                    this.props.socket.setObject(obj._id, obj);
                                } else {
                                    window.alert(`Adapter "${adapter}" does not exist!`);
                                }
                            })
                            .then(() => {
                                const updateAvailable = [...this.state.updateAvailable];
                                const pos = updateAvailable.indexOf(adapter);
                                if (pos !== -1) {
                                    updateAvailable.splice(pos, 1);
                                    this.setState({ updateAvailable });
                                }
                            });
                    });
                }}
                onClose={() => this.closeAdapterUpdateDialog()}
                instances={this.state.instances}
            />}
            {this.state.adapterInstallVersion && <CustomModal
                title={this.t('Please select specific version of %s', this.state.adapterInstallVersion)}
                applyButton={false}
                onClose={() => this.setState({ adapterInstallVersion: '', adapterInstallSpecificVersion: '' })}
                toggleTranslation={this.props.toggleTranslation}
                noTranslation={this.props.noTranslation}
            >
                <div className={classes.containerVersion}>
                    {this.getNews(this.state.adapterInstallVersion, true).map(({ version, news }) => <div
                        key={version}
                        className={classes.currentVersion}
                        onClick={() => {
                            this.update(this.state.adapterInstallVersion, version);
                            this.setState({ adapterInstallVersion: '' });
                        }}
                    >
                        <ListItemText primary={version} secondary={formatNews(news)} />
                    </div>)}
                </div>
                <div className={classes.containerSpecificVersion}>
                    <TextField
                        variant="standard"
                        fullWidth
                        label={this.props.t('Version')}
                        value={this.state.adapterInstallSpecificVersion}
                        onChange={event => {
                            this.setState({ adapterInstallSpecificVersion: event.target.value });
                        }}
                        InputProps={{
                            endAdornment: this.state.url ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => this.setState({ url: '' })}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment> : null,
                        }}
                    />
                    <Tooltip title={this.props.t('npmjs.com')}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                window.open(`https://www.npmjs.com/package/iobroker.${this.state.adapterInstallVersion}?activeTab=versions`, this.state.adapterInstallVersion).focus();
                            }}
                        >
                            <LinkIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        color="primary"
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (this.state.adapterInstallSpecificVersion !== '') {
                                this.update(this.state.adapterInstallVersion, this.state.adapterInstallSpecificVersion);
                                this.setState({ adapterInstallVersion: '', adapterInstallSpecificVersion: '' });
                            }
                        }}
                    >
                        {this.props.t('Install')}
                    </Button>
                </div>
            </CustomModal>}
        </TabContainer>;
    }
}

Adapters.propTypes = {
    onSetCommandRunning: PropTypes.func.isRequired,
    commandRunning: PropTypes.bool,
    menuOpened: PropTypes.bool,
    menuClosed: PropTypes.bool,
    // menuCompact: PropTypes.bool,
    adaptersWorker: PropTypes.object,
    instancesWorker: PropTypes.object,
    themeType: PropTypes.string,
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    /** Current selected host */
    currentHost: PropTypes.string.isRequired,
    hostsWorker: PropTypes.object,
    ready: PropTypes.bool,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    executeCommand: PropTypes.func,
    adminGuiConfig: PropTypes.object,
    noTranslation: PropTypes.bool,
    toggleTranslation: PropTypes.func,
    triggerUpdate: PropTypes.number,
    /** The host of the admin adapter, like system.host.test */
    host: PropTypes.string.isRequired,
    /** Like admin.0 */
    adminInstance: PropTypes.string.isRequired,
    /** Called when admin updates itself */
    onUpdating: PropTypes.func.isRequired,
};

export default withStyles(styles)(Adapters);
