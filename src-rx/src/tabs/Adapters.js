/* eslint-disable array-callback-return */
import React, { Component, Fragment, createRef } from 'react';
import semver from 'semver';
import PropTypes from "prop-types";
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';

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
    Hidden
} from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

// import CloudOffIcon from '@material-ui/icons/CloudOff';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import RefreshIcon from '@material-ui/icons/Refresh';
import ListIcon from '@material-ui/icons/List';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import UpdateIcon from '@material-ui/icons/Update';
import StarIcon from '@material-ui/icons/Star';
import CloseIcon from '@material-ui/icons/Close';
import { FaGithub as GithubIcon } from 'react-icons/fa';

import { blue, green } from '@material-ui/core/colors';

import Router from '@iobroker/adapter-react/Components/Router';

import AdapterDeletionDialog from '../dialogs/AdapterDeletionDialog';
import AdapterInfoDialog from '../dialogs/AdapterInfoDialog';
import AdapterUpdateDialog from '../dialogs/AdapterUpdateDialog';
import AddInstanceDialog from '../dialogs/AddInstanceDialog';
import AdapterRow from '../components/Adapters/AdapterRow';
import AdapterTile from '../components/Adapters/AdapterTile';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';
import CustomSelectButton from '../components/CustomSelectButton';
import GitHubInstallDialog from '../dialogs/GitHubInstallDialog';
import { licenseDialogFunc } from '../dialogs/LicenseDialog';
import CustomModal from '../components/CustomModal';
import AdaptersUpdaterDialog from '../dialogs/AdaptersUpdaterDialog';
import RatingDialog from '../dialogs/RatingDialog';
import SlowConnectionWarningDialog from '../dialogs/SlowConnectionWarningDialog';
import IsVisible from '../components/IsVisible';

const WIDTHS = {
    emptyBlock: 50,
    name: 300,
    connectionType: 65,
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
        height: theme.spacing(3)
    },
    table: {
        width: '100%',
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    },
    hidden: {
        visibility: 'hidden'
    },
    name: {
        flexWrap: 'nowrap',
        width: WIDTHS.name
    },
    emptyBlock: {
        flexWrap: 'nowrap',
        width: WIDTHS.emptyBlock
    },
    description: {
        width: `calc(100% - ${SUM}px)`
    },
    keywords: {

    },
    connectionType: {
        width: WIDTHS.connectionType
    },
    installed: {
        width: WIDTHS.installed
    },
    available: {
        width: WIDTHS.available,
        paddingRight: 6
    },
    update: {
        width: WIDTHS.update,
        padding: 0
    },
    license: {
        width: WIDTHS.license
    },
    install: {
        width: WIDTHS.install
    },
    green: {
        color: green[500]
    },
    blue: {
        color: blue[700]
    },
    category: {
        backgroundColor: theme.palette.background.default,
    },
    grow: {
        flexGrow: 1
    },
    updateAvailable: {
        color: green[700]
    },
    tabContainer: {
        overflow: 'auto'
    },
    containerVersion: {
        borderBottom: 0
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
        }
    },
    updateAllButton: {
        position: 'relative'
    },
    updateAllIcon: {
        position: 'absolute',
        top: 3,
        left: 3,
        opacity: 0.4,
        color: theme.palette.type === 'dark' ? '#aad5ff' : '#007fff'
    },
    counters: {
        marginRight: 10,
        minWidth: 120,
        display: 'flex',
        '& div': {
            marginLeft: 3
        }
    },
    visible: {
        opacity: 0
    },
    infoAdapters: {
        fontSize: 10,
        color: theme.palette.type === 'dark' ? '#9c9c9c' : '#333',
        cursor: 'pointer'
    },
    greenText: {
        color: '#00a005d1'
    },
    rating: {
        marginBottom: 20,
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
    },
    notStableRepo: {
        background: '#fdee20',
        color: '#111',
        fontSize: 14,
        padding: '2px 8px',
        borderRadius: 5
    },
    viewModeDiv: {
        display: 'flex',
        flexFlow: 'wrap',
        overflow: 'auto',
        justifyContent: 'center'
    }
});

class Adapters extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lastUpdate: 0,
            repository: {},
            installed: {},
            adapters: [],
            categories: [],
            hostData: {},
            hostOs: '',
            nodeJsVersion: '',
            init: false,
            addInstanceDialog: false,
            addInstanceError: false,
            addInstanceAdapter: '',
            addInstanceId: 'auto',
            addInstanceHost: '',
            adapterDeletionDialog: false,
            adapterDeletionAdapter: null,
            update: false,
            dialog: null,
            dialogProp: null,
            filterConnectionType: false,
            search: window.localStorage.getItem('Adapter.search') || '',
            list: false,
            viewMode: false,
            updateList: false,
            installedList: false,
            categoriesTiles: 'All',
            filterTiles: 'A-Z',
            arrayFilter: [{ name: 'A-Z' }, { name: 'Popular first' }, { name: 'Recently updated' }],
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
        };

        this.rebuildSupported = false;
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
    }

    renderSlowConnectionWarning() {
        if (!this.state.showSlowConnectionWarning) {
            return null;
        } else {
            return <SlowConnectionWarningDialog
                readTimeoutMs={this.state.readTimeoutMs}
                t={this.t}
                onClose={readTimeoutMs => {
                    if (readTimeoutMs) {
                        this.setState({showSlowConnectionWarning: false, readTimeoutMs}, () =>
                            this.updateAll());
                    } else {
                        this.setState({showSlowConnectionWarning: false});
                    }
                }}
            />;
        }
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

    updateAll(update, bigUpdate) {
        return this.getAdapters(update, bigUpdate)
            .then(() => this.getAdaptersInfo(update));
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

    static getDerivedStateFromProps() {
        const location = Router.getLocation();

        return {
            dialog: location.dialog,
            dialogProp: location.id
        };
    }

    onAdaptersChanged = events => {
        this.tempAdapters  = this.tempAdapters  || JSON.parse(JSON.stringify(this.state.adapters));
        this.tempInstalled = this.tempInstalled || JSON.parse(JSON.stringify(this.state.installed));
        this.tempInstances = this.tempInstances || JSON.parse(JSON.stringify(this.state.instances));

        events.forEach(event => {
            // detect if adapter or instance
            let isInstance = !!event.id.match(/\.\d+$/);
            if (isInstance) {
                if (event.type === 'deleted' || !event.obj) {
                    delete this.tempInstances[event.id];
                } else {
                    this.tempInstances[event.id] = {
                        enabled: event.obj.common.enabled,
                        icon:    event.obj.common.icon,
                        name:    event.obj.common.name,
                    };
                }
            } else {
                if (event.type === 'deleted' || !event.obj) {
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
            }
        });

        this.updateTimeout && clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            const adapters     = this.tempAdapters;
            this.tempAdapters  = null;
            const installed    = this.tempInstalled;
            this.tempInstalled = null;
            const instances    = this.tempInstances;
            this.tempInstances = null;

            this.analyseInstalled(adapters, installed, null,  () =>
                this.calculateInfo(instances));
        }, 300);
    }

    analyseInstalled(adapters, installed, repository, cb) {
        adapters   = adapters   || this.state.adapters;
        installed  = installed  || this.state.installed;
        repository = repository || this.state.repository;

        const updateAvailable = [];

        Object.keys(installed).forEach(value => {
            if (installed[value]) {
                const version         = installed[value].version;
                const repositoryValue = repository[value];

                if (repositoryValue &&
                    repositoryValue.version !== version &&
                    Adapters.updateAvailable(version, repositoryValue.version) &&
                    !updateAvailable.includes(value)
                ) {
                    updateAvailable.push(value);
                }
            }
        });

        this.cache.listOfVisibleAdapter = null;

        this.setState({
            adapters,
            updateAvailable,
            installed,
            repository
        }, () => cb && cb());
    }

    getAdapters = (update, bigUpdate) => {
        console.log('[ADAPTERS] getAdapters');
        let adapters
        let installed
        const currentHost = this.props.currentHost;
        return new Promise(resolve => {
            if (!this.state.update && update) {
                this.setState({ update: true }, () => resolve());
            } else {
                resolve();
            }
        })
            .then(() => this.props.adaptersWorker.getAdapters(update))
            .catch(e => window.alert('Cannot getAdapters: ' + e))
            .then(_adapters => {
                adapters = _adapters;
                return this.props.socket.getInstalled(currentHost, update, this.state.readTimeoutMs)
                    .catch(e => {
                        window.alert('Cannot getInstalled: ' + e);
                        e.toString().includes('timeout') && this.setState({showSlowConnectionWarning: true});
                        return null;
                    });
            })
            .then(_installed => {
                installed = _installed;
                return this.props.socket.getRepository(currentHost, { repo: this.props.systemConfig.common.activeRepo, update: bigUpdate }, update, this.state.readTimeoutMs)
                    .catch(e => {
                        window.alert('Cannot getRepository: ' + e);
                        e.toString().includes('timeout') && this.setState({showSlowConnectionWarning: true});
                        return null;
                    })
            })
            .then(repository =>
                this.analyseInstalled(adapters, installed, repository));
    }

    calculateInfo(instances, ratings, hostData) {
        hostData  = hostData  || this.state.hostData;
        ratings   = ratings   || this.state.ratings;
        instances = instances || this.state.instances;

        const adapters = this.state.adapters;

        const installed = JSON.parse(JSON.stringify(this.state.installed));
        const repository = JSON.parse(JSON.stringify(this.state.repository));

        const nodeJsVersion = hostData['Node.js'].replace('v', '');
        const hostOs = hostData.os;

        const categories = {};
        const categoriesSorted = [];
        const categoriesExpanded = JSON.parse(window.localStorage.getItem('Adapters.expandedCategories')) || {};

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
            adapter.count   = 0;
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
            const adapter = repository[value];
            if (adapter.keywords) {
                adapter.keywords = adapter.keywords.map(word => word.toLowerCase());
            }
            const _installed = installed[value];

            adapter.rating = ratings && ratings[value];

            if (adapter.rating && adapter.rating.rating) {
                adapter.rating.title = [
                    `${this.t('Total rating:')} ${adapter.rating.rating.r} (${adapter.rating.rating.c} ${this.t('votes')})`,
                    (_installed && _installed.version && adapter.rating[_installed.version]) ?
                        `${this.t('Rating for')} v${_installed.version}: ${adapter.rating[_installed.version].r} (${adapter.rating[_installed.version].c} ${this.t('votes')})`
                        : ''
                ].filter(i => i).join('\n');
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
                        translation: this.t(type + '_group'),
                        count: 1,
                        installed: installedInGroup ? 1 : 0,
                        adapters: [value]
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

        Object.keys(categories).sort((a, b) => {
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
        }).forEach(value =>
            categoriesSorted.push(categories[value]));

        const list            = JSON.parse(window.localStorage.getItem('Adapters.list'));
        const viewMode        = JSON.parse(window.localStorage.getItem('Adapters.viewMode'));
        const updateList      = JSON.parse(window.localStorage.getItem('Adapters.updateList'));
        const installedList   = JSON.parse(window.localStorage.getItem('Adapters.installedList'));
        const categoriesTiles = window.localStorage.getItem('Adapters.categoriesTiles') || 'All';
        const filterTiles     = window.localStorage.getItem('Adapters.filterTiles') || 'A-Z';
        this.allAdapters      = Object.keys(repository).length - 1;

        this.cache.listOfVisibleAdapter = null;

        this.setState({
            repository,
            installed,
            ratings,
            filterTiles,
            categoriesTiles,
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
            update: false
        });
    }

    getAdaptersInfo = update => {
        if (!this.props.currentHost) {
            return;
        }

        // Do not update too often
        if (Date.now() - this.state.lastUpdate > 1000) {
            console.log('[ADAPTERS] getAdaptersInfo');

            const currentHost = this.props.currentHost;

            let hostData;
            let rebuild;
            let ratings;

            return new Promise(resolve => {
                if (!this.state.update) {
                    this.setState({ update: true }, () => resolve());
                } else {
                    resolve();
                }
            })
                .then(() => this.props.socket.getHostInfo(currentHost, update, this.state.readTimeoutMs)
                    .catch(e => {
                        window.alert(`Cannot getHostInfo for "${currentHost}": ${e}`);
                        e.toString().includes('timeout') && this.setState({showSlowConnectionWarning: true});
                    })
                )
                .then(_hostData => {
                    hostData = _hostData;
                    return this.props.socket.checkFeatureSupported('CONTROLLER_NPM_AUTO_REBUILD')
                        .catch(e => window.alert('Cannot checkFeatureSupported: ' + e))
                })
                .then(_rebuild => {
                    rebuild = _rebuild;
                    if (this.props.adminGuiConfig.adapters?.allowAdapterRating === false) {
                        return Promise.resolve({});
                    }

                    return this.props.socket.getRatings(update)
                        .catch(e => window.alert('Cannot read ratings: ' + e));
                })
                .then(_ratings => {
                    ratings = _ratings;
                    return this.props.socket.getCompactInstances(update)
                        .catch(e => {
                            window.alert('Cannot read countsOfInstances: ' + e);
                            return {};
                        });
                })
                .then(instances => {
                    // simulation
                    // setTimeout(() => this.setState({showSlowConnectionWarning: true}), 5000);

                    this.uuid = ratings?.uuid || null;
                    this.rebuildSupported = rebuild || false;
                    this.calculateInfo(instances, ratings, hostData);
                });
        } else {
            return Promise.resolve();
        }
    }

    async addInstance(adapter, instance, debug = false, customUrl = false) {
        if (!instance && this.props.expertMode && !customUrl) {
            this.setState({
                addInstanceDialog: true,
                addInstanceAdapter: adapter,
                addInstanceHost: this.props.currentHost.replace(/^system\.adapter\./, '')
            });
        } else {
            if (instance && !customUrl) {
                const instances = this.props.instancesWorker.getInstances();
                // if the instance already exists
                if (instances[`system.adapter.${adapter}.${instance}`]) {
                    return this.setState({ addInstanceError: true });
                }
            }
            this.props.executeCommand(`${customUrl ? 'url' : 'add'} ${adapter} ${instance ? instance + ' ' : ''}--host ${this.props.currentHost.replace(/^system\.host\./, '')} ${debug ? '--debug' : ''}`, true);
        }
    }

    upload(adapter) {
        this.props.executeCommand('upload ' + adapter);
    }

    rebuild(adapter) {
        this.props.executeCommand('rebuild ' + adapter)
    }

    delete(adapter) {
        this.props.executeCommand('del ' + adapter);
    }

    update(adapter, version) {
        this.props.executeCommand(`upgrade ${adapter}@${version}`);
    }

    closeAddInstanceDialog() {
        this.setState({
            addInstanceDialog: false,
            addInstanceAdapter: '',
            addInstanceId: 'auto'
        });
    }

    openAdapterDeletionDialog(adapter) {
        this.setState({
            adapterDeletionDialog: true,
            adapterDeletionAdapter: adapter
        });
    }

    closeAdapterDeletionDialog() {
        this.setState({
            adapterDeletionDialog: false,
            adapterDeletionAdapter: null
        });
    }

    toggleCategory(category) {
        this.setState(oldState => {

            const categoriesExpanded = oldState.categoriesExpanded;
            categoriesExpanded[category] = !categoriesExpanded[category];

            window.localStorage.setItem('Adapters.expandedCategories', JSON.stringify(categoriesExpanded));

            return { categoriesExpanded };
        });
    }

    handleHostsChange(event) {
        this.setState({addInstanceHost: event.target.value});
    }

    handleInstanceChange(event) {
        this.setState({addInstanceId: event.target.value});
    }

    static updateAvailable(oldVersion, newVersion) {
        try {
            return semver.gt(newVersion, oldVersion) === true;
        } catch (e) {
            console.warn(`[ADAPTERS] Cannot compare "${newVersion}" and "${oldVersion}"`);
            return false;
        }
    }

    getDependencies = value => {
        const adapter = this.state.repository[value];
        let result = [];

        if (adapter) {
            const dependencies = adapter.dependencies;
            const nodeVersion = adapter.node;

            dependencies && dependencies.length && dependencies.forEach(dependency => {

                const entry = {
                    name:             '',
                    version:          null,
                    installed:        false,
                    installedVersion: null,
                    rightVersion:     false
                };

                const checkVersion = typeof dependency !== 'string';
                const keys = Object.keys(dependency);
                entry.name = !checkVersion ? dependency : keys ? keys[0] : null;
                entry.version = checkVersion ? dependency[entry.name] : null;

                if (result && entry.name) {
                    const installed = this.state.installed[entry.name];

                    entry.installed        = !!installed;
                    entry.installedVersion = installed ? installed.version : null;
                    try {
                        entry.rightVersion = installed ? (checkVersion ? semver.satisfies(installed.version, entry.version, { includePrerelease: true }) : true) : false;
                    } catch (e) {
                        entry.rightVersion = true;
                    }
                }

                result.push(entry);
            });

            if (nodeVersion) {
                const entry = {
                    name:             'node',
                    version:          nodeVersion,
                    installed:        true,
                    installedVersion: this.state.nodeJsVersion,
                    rightVersion:     false
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
    }

    rightDependencies(value) {
        const adapter = this.state.repository[value];
        let result = true;

        if (adapter) {
            const dependencies = adapter.dependencies;
            const nodeVersion  = adapter.node;

            if (dependencies) {
                if (dependencies instanceof Array) {
                    dependencies.forEach(dependency => {
                        const checkVersion = typeof dependency !== 'string';
                        const keys = Object.keys(dependency);
                        const name = !checkVersion ? dependency : keys ? keys[0] : null;

                        if (result && name) {

                            const installed = this.state.installed[name];

                            try {
                                result = installed ? (checkVersion ? semver.satisfies(installed.version, dependency[name], { includePrerelease: true }) : true) : false;
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
                                result = installed ? (checkVersion ? semver.satisfies(installed.version, dependency[dependency], { includePrerelease: true }) : true) : false;
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
            return !!adapter.os.find(value => this.state.hostOs === value);
        }

        return true;
    }

    openInfoDialog(adapter) {
        Router.doNavigate('tab-adapters', 'readme', adapter);
    }

    openUpdateDialog(adapterToUpdate) {
        this.setState({adapterToUpdate});
    }

    openInstallVersionDialog(adapterInstallVersion) {
        this.setState({adapterInstallVersion});
    }

    closeAdapterUpdateDialog(cb) {
        this.setState({adapterToUpdate: ''}, () =>
            cb && cb());
    }

    renderSetRatingDialog() {
        if (this.state.showSetRating) {
            return <RatingDialog
                t={this.t}
                lang={this.props.lang}
                version={this.state.showSetRating.version}
                adapter={this.state.showSetRating.adapter}
                repository={this.state.repository}
                currentRating={this.state.showSetRating.rating}
                onClose={repository => {
                    if (repository) {
                        this.setState({showSetRating: null, repository});
                    } else {
                        this.setState({showSetRating: null});
                    }
                }}
                uuid={this.uuid}
            />;
        } else {
            return null;
        }
    }

    getNews(value, all = false) {
        const adapter   = this.state.repository[value];
        const installed = this.state.installed[value];
        const news      = [];

        if (installed && adapter && adapter.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed.version) || all) {
                        news.push({
                            version: version,
                            news:    adapter.news[version][this.props.lang] || adapter.news[version].en
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`[ADAPTERS] Cannot compare "${version}" and "${installed.version}"`);
                }
            });
        }

        return news;
    }

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
            window.localStorage.setItem('Adapter.search', value || '');
            this.typingTimer = null;
            this.filterAdapters(value);
        }, 300, event.target.value);
    }

    toggleConnectionTypeFilter() {
        this.setState({ filterConnectionType: !this.state.filterConnectionType });
    }

    expandAll() {
        this.setState(oldState => {
            const categories = oldState.categories;
            const categoriesExpanded = oldState.categoriesExpanded;

            categories.forEach(category => categoriesExpanded[category.name] = true);

            window.localStorage.setItem('Adapters.expandedCategories', JSON.stringify(categoriesExpanded));

            return { categoriesExpanded };
        });
    }

    collapseAll() {
        const categoriesExpanded = {};

        window.localStorage.setItem('Adapters.expandedCategories', JSON.stringify(categoriesExpanded));

        this.setState({ categoriesExpanded });
    }

    listTable() {
        let list = !this.state.list;
        if (list) {
            this.expandAll();
        }
        window.localStorage.setItem('Adapters.list', JSON.stringify(list));
        this.setState({ list });
    }

    changeViewMode() {
        this.cache.listOfVisibleAdapter = null;
        let viewMode = !this.state.viewMode;
        window.localStorage.setItem('Adapters.viewMode', JSON.stringify(viewMode));
        this.setState({ viewMode });
    }

    changeUpdateList() {
        this.cache.listOfVisibleAdapter = null;
        let updateList = !this.state.updateList;
        window.localStorage.setItem('Adapters.updateList', JSON.stringify(updateList));
        this.setState({ updateList });
    }

    changeInstalledList(onlyInstalled) {
        this.cache.listOfVisibleAdapter = null;
        let installedList = !this.state.installedList ? 1 : this.state.installedList < 2 ? 2 : false;
        if (!installedList && onlyInstalled) {
            installedList = 1;
        }
        window.localStorage.setItem('Adapters.installedList', JSON.stringify(installedList));
        this.setState({ installedList });
    }

    changeFilterTiles(filterTiles) {
        this.cache.listOfVisibleAdapter = null;
        window.localStorage.setItem('Adapters.filterTiles', filterTiles);
        this.setState({ filterTiles });
    }

    changeCategoriesTiles(categoriesTiles) {
        this.cache.listOfVisibleAdapter = null;
        window.localStorage.setItem('Adapters.categoriesTiles', categoriesTiles);
        this.setState({ categoriesTiles });
    }

    filterAdapters(search) {
        this.cache.listOfVisibleAdapter = null;
        search = search === undefined ? this.state.search : search;
        search = (search || '').toLowerCase().trim();
        let filteredList = [];
        if (search) {
            this.state.categories.forEach(category => category.adapters.map(name => {
                const adapter = this.state.repository[name];

                const title = ((adapter.title || '').toString() || '').replace('ioBroker Visualisation - ', '');
                const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc.en || adapter.desc : '';

                if (name.includes(search)) {
                    filteredList.push(name);
                } else
                    if (title && title.toLowerCase().includes(search)) {
                        filteredList.push(name);
                    } else if (desc && desc.toLowerCase().includes(search)) {
                        filteredList.push(name);
                    } else {
                        adapter.keywords && adapter.keywords.forEach(value =>
                            value.includes(search) && filteredList.push(name));
                    }
            }));
        } else {
            filteredList = null;
        }
        this.setState({ filteredList, search });
    }

    getRow(value, descHidden) {
        const cached = this.cache.adapters[value];
        if (cached) {
            const adapter = this.state.repository[value];
            const installed = this.state.installed[value];

            if (cached.title instanceof Object || !cached.desc) {
                console.warn('[ADAPTERS] ' + adapter);
            }

            return <AdapterRow
                t={this.t}
                descHidden={descHidden}
                key={'adapter-' + value}
                connectionType={cached.connectionType}
                dataSource={adapter.dataSource}
                description={cached.desc}
                adapter={value}
                versionDate={cached.daysAgoText}
                enabledCount={installed && installed.enabled}
                expertMode={this.props.expertMode}
                image={cached.image}
                installedCount={installed && installed.count}
                installedFrom={installed && installed.installedFrom}
                installedVersion={installed && installed.version}
                keywords={adapter.keywords}
                name={cached.title}
                license={adapter.license}
                updateAvailable={cached.updateAvailable}
                version={adapter.version}
                hidden={false}
                rightDependencies={cached.rightDependencies}
                rightOs={cached.rightOs}
                sentry={cached.sentry}
                rebuild={this.rebuildSupported}
                commandRunning={this.props.commandRunning}
                rating={adapter.rating}
                onSetRating={() =>
                    this.setState({ showSetRating: { adapter: value, version: installed && installed.version, rating: adapter.rating}})}
                onAddInstance={() =>
                    licenseDialogFunc(adapter.license === 'MIT', async result =>
                        result && await this.addInstance(value), (adapter.extIcon || '').split('/master')[0] + '/master/LICENSE')
                }
                onDeletion={() => this.openAdapterDeletionDialog(value)}
                onInfo={() => this.openInfoDialog(value)}
                onRebuild={() => this.rebuild(value)}
                onUpdate={() => this.openUpdateDialog(value)}
                openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                onUpload={() => licenseDialogFunc(adapter.license === 'MIT', result =>
                    result && this.upload(value), (adapter.extIcon || '').split('/master')[0] + '/master/LICENSE')}//
                allowAdapterDelete={this.state.repository[value] ? this.state.repository[value].allowAdapterDelete : true}
                allowAdapterInstall={this.state.repository[value] ? this.state.repository[value].allowAdapterInstall : true}
                allowAdapterUpdate={this.state.repository[value] ? this.state.repository[value].allowAdapterUpdate : true}
                allowAdapterReadme={this.state.repository[value] ? this.state.repository[value].allowAdapterReadme : true}
                allowAdapterRating={this.props.adminGuiConfig.admin.adapters ? this.props.adminGuiConfig.admin.adapters.allowAdapterRating : true}
            />;
        } else {
            return null;
        }
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
                let showCategory = category.adapters.find(value => this.cache.listOfVisibleAdapter.includes(value));
                if (!showCategory) {
                    return null;
                }
                const categoryName = category.name;
                const expanded = this.state.categoriesExpanded[categoryName];
                if (!this.state.list) {
                    count++;
                }

                return <Fragment key={`category-${categoryName} ${category.adapters.length}`}>
                    {!this.state.list && <AdapterRow
                        descHidden={descHidden}
                        key={'category-' + categoryName + 1}
                        category
                        categoryName={categoryName}
                        count={category.count}
                        expanded={expanded}
                        installedCount={category.installed}
                        name={category.translation}
                        onToggle={() => this.toggleCategory(categoryName)}
                        t={this.t}
                        hidden={false}
                    />}

                    {expanded && category.adapters.map(value => {
                        const item = this.getRow(value, descHidden);
                        item && count++;
                        return item;
                    })}
                </Fragment>;
            });
        }
        this.listOfVisibleAdapterLength = count !== undefined ? count : this.listOfVisibleAdapterLength;

        if (!count) {
            return !this.state.update && <tr><td colSpan={4} style={{ padding: 16, fontSize: 18 }}>{this.t('all items are filtered out')}</td></tr>;
        } else {
            return rows;
        }
    }

    buildCache() {
        this.cache.listOfVisibleAdapter = [];
        this.cache.adapters = {};
        const now = Date.now();
        const textDaysAgo0 = this.t('0 %d days ago');
        const textDaysAgo1 = this.t('1 %d days ago');
        const textDaysAgo2 = this.t('2 %d days ago');
        const textDaysAgo = this.t('5 %d days ago');

        const sortPopularFirst    = !this.state.viewMode && this.state.filterTiles === 'Popular first';
        const sortRecentlyUpdated = !this.state.viewMode && this.state.filterTiles === 'Recently updated';

        // get all visible adapters
        this.state.categories
            .filter(cat => this.state.viewMode || !this.state.categoriesTiles || this.state.categoriesTiles === 'All' || cat.name === this.state.categoriesTiles)
            .forEach(category => category.adapters.forEach(value => {
                const adapter = this.state.repository[value];

                if (value === 'vis-materialdesign') {
                    console.log('[ADAPTERS] ' + value);
                }

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
                        show = this.state.installedList < 2 ? !!(installed && installed.version) : !!(installed && installed.version && !installed.count) ;
                    }
                    if (show) {
                        this.cache.listOfVisibleAdapter.push(value);
                        const daysAgo10 = Math.round((now - new Date(adapter.versionDate).getTime()) / 8640000);
                        const daysAgo = Math.round(daysAgo10 / 10);

                        let title = adapter.titleLang || adapter.title;
                        if (typeof title === 'object') {
                            title = title[this.props.lang] || title.en;
                        }
                        title = ((title || '').toString() || '').replace('ioBroker Visualisation - ', '')

                        const _daysAgo10 = daysAgo % 100 <= 10 || daysAgo % 100 >= 20 ? daysAgo % 10 : 5;

                        this.cache.adapters[value] = {
                            title,
                            desc: adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] || adapter.desc : '',
                            image: installed ? installed.localIcon : adapter.extIcon,
                            connectionType: adapter.connectionType ? adapter.connectionType : '-',
                            updateAvailable: this.state.updateAvailable.includes(value),
                            rightDependencies: this.rightDependencies(value),
                            rightOs: this.rightOs(value),
                            sentry: !!(adapter.plugins && adapter.plugins.sentry),
                            daysAgo: daysAgo10,
                            stat: sortPopularFirst && adapter.stat,
                            daysAgoText: sortRecentlyUpdated && (daysAgo || daysAgo === 0) ?
                                daysAgo === 0 ? textDaysAgo0 :
                                    (_daysAgo10 === 1 ? textDaysAgo1.replace('%d', daysAgo) :
                                        (_daysAgo10 === 2 || _daysAgo10 === 3 || _daysAgo10 === 4 ? textDaysAgo2.replace('%d', daysAgo) : textDaysAgo.replace('%d', daysAgo))) : ''
                        }
                    }
                }
            }));

        this.listOfVisibleAdapterLength = this.cache.listOfVisibleAdapter.length;

        const repo = this.state.repository;
        const adapters = this.cache.adapters;
        const installed = this.state.installed;

        this.cache.listOfVisibleAdapter.sort((a, b) => {
            if (sortPopularFirst) {
                return repo[b].stat - repo[a].stat;
            } else
            if (sortRecentlyUpdated) {
                if (!adapters[a]) {
                    return -1;
                } else if (!adapters[b]) {
                    return 1;
                }
                if (adapters[a].daysAgo === adapters[b].daysAgo) {
                    return a > b ? 1 : (a < b ? -1 : 0);
                } else {
                    return adapters[a].daysAgo - adapters[b].daysAgo;
                }
            } else {
                if (installed[a] && installed[b]) {
                    return a > b ? 1 : (a < b ? -1 : 0);
                } else if (installed[a]) {
                    return -1;
                } else if (installed[b]) {
                    return 1;
                } else {
                    return a > b ? 1 : (a < b ? -1 : 0);
                }
            }
        });

        // console.log('[ADAPTERS] Update cache!');
    }

    getTiles() {
        if (!this.cache.listOfVisibleAdapter) {
            this.buildCache();
        }

        if (!this.cache.listOfVisibleAdapter.length) {
            return !this.state.update && <div style={{
                margin: 20,
                fontSize: 26
            }}>{this.props.t('all items are filtered out')}</div>;
        } else {
            return this.cache.listOfVisibleAdapter.map(value => {
                const adapter   = this.state.repository[value];
                const installed = this.state.installed[value];
                const cached    = this.cache.adapters[value];

                if (cached.title instanceof Object || !cached.desc) {
                    console.warn('[ADAPTERS] ' + adapter);
                }

                return <AdapterTile
                    t={this.t}
                    commandRunning={this.props.commandRunning}
                    key={'adapter-' + value}
                    image={cached.image}
                    name={cached.title}
                    dataSource={adapter.dataSource}
                    adapter={value}
                    stat={cached.stat}
                    versionDate={cached.daysAgoText}
                    connectionType={cached.connectionType}
                    description={cached.desc}
                    enabledCount={installed && installed.enabled}
                    expertMode={this.props.expertMode}
                    installedCount={installed && installed.count}
                    installedFrom={installed && installed.installedFrom}
                    installedVersion={installed && installed.version}
                    keywords={adapter.keywords}
                    license={adapter.license}
                    updateAvailable={cached.updateAvailable}
                    version={adapter.version}
                    hidden={false}
                    rightDependencies={cached.rightDependencies}
                    rightOs={cached.rightOs}
                    sentry={cached.sentry}
                    rebuild={this.rebuildSupported}
                    rating={adapter.rating}
                    onSetRating={() =>
                        this.setState({ showSetRating: { adapter: value, version: installed && installed.version, rating: adapter.rating}})}
                    onAddInstance={() =>
                        licenseDialogFunc(adapter.license === 'MIT', async result =>
                            result && await this.addInstance(value), (adapter.extIcon || '').split('/master')[0] + '/master/LICENSE')}//
                    onDeletion={() => this.openAdapterDeletionDialog(value)}
                    onInfo={() => this.openInfoDialog(value)}
                    onRebuild={() => this.rebuild(value)}
                    onUpdate={() => this.openUpdateDialog(value)}
                    openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                    onUpload={() => licenseDialogFunc(adapter.license === 'MIT', result =>
                        result && this.upload(value), (adapter.extIcon || '').split('/master')[0] + '/master/LICENSE')}//
                    allowAdapterDelete={this.state.repository[value] ? this.state.repository[value].allowAdapterDelete : true}
                    allowAdapterInstall={this.state.repository[value] ? this.state.repository[value].allowAdapterInstall : true}
                    allowAdapterUpdate={this.state.repository[value] ? this.state.repository[value].allowAdapterUpdate : true}
                    allowAdapterReadme={this.state.repository[value] ? this.state.repository[value].allowAdapterReadme : true}
                    allowAdapterRating={this.props.adminGuiConfig.admin.adapters ? this.props.adminGuiConfig.admin.adapters.allowAdapterRating : true}
                />;
            });
        }
    }

    getUpdater() {
        if (!this.state.showUpdater) {
            return null;
        } else {
            return <AdaptersUpdaterDialog
                onSetCommandRunning={commandRunning => this.props.onSetCommandRunning(commandRunning)}
                t={this.props.t}
                currentHost={this.props.currentHost}
                lang={this.props.lang}
                installed={this.state.installed}
                repository={this.state.repository}
                onClose={reload =>
                    this.setState({ showUpdater: false }, () =>
                        reload && this.updateAll(true, false))}
                socket={this.props.socket}
            />;
        }
    }

    getDescWidth() {
        if (this.props.menuOpened) {
            return document.body.scrollWidth - SUM - 180 + 15;
        } else if (this.props.menuClosed) {
            return document.body.scrollWidth - SUM;
        } else if (this.props.menuCompact) {
            return document.body.scrollWidth - SUM - 50 + 15;
        }
    }

    getStatistics() {
        if (this.state.showStatistics) {
            return <Dialog
                open={true}
                onClose={() => this.setState({ showStatistics: false })}
            >
                <DialogTitle>{this.t('Statistics')}</DialogTitle>
                <DialogContent style={{ fontSize: 16 }}>
                    <div className={this.props.classes.counters}>{this.t('Total adapters')}: <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.allAdapters}</span></div>
                    <div className={this.props.classes.counters}>{this.t('Installed adapters')}: <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.installedAdapters}</span></div>
                    <div className={this.props.classes.counters}>{this.t('Last month updated adapters')}: <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.recentUpdatedAdapters}</span></div>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => this.setState({ showStatistics: false })} color="primary" autoFocus startIcon={<CloseIcon />}>
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>;
        } else {
            return null;
        }
    }

    render() {
        if (!this.state.init) {
            return <LinearProgress />;
        }
        console.log('[ADAPTERS] Render');
        if (this.state.dialog === 'readme' && this.state.dialogProp) {
            const adapter = this.state.repository[this.state.dialogProp] || null;

            if (adapter) {
                return <TabContainer className={this.props.classes.tabContainer}>
                    <AdapterInfoDialog
                        theme={this.props.theme}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        adapter={this.state.dialogProp}
                        link={adapter.readme || ''}
                        socket={this.props.socket}
                        t={this.t}
                    />
                </TabContainer>;
            }
        }

        const { classes } = this.props;
        const descHidden = this.state.descWidth < 50;

        let updateAllButtonAvailable = !this.props.commandRunning && !!this.props.ready && !!this.state.updateList && this.state.updateAvailable.length > 1;

        // it is not possible to update admin in bulk
        if (updateAllButtonAvailable && this.state.updateAvailable.length === 2 && this.state.updateAvailable.includes('admin')) {
            updateAllButtonAvailable = false;
        }

        return <TabContainer>
            {this.state.update &&
                <Grid item>
                    <LinearProgress />
                </Grid>
            }
            <TabHeader>
                <Tooltip title={this.t('Change view mode')}>
                    <IconButton onClick={() => this.changeViewMode()}>
                        {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('Check adapter for updates')}>
                    <IconButton onClick={() => this.updateAll(true, true)}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                {this.state.viewMode && !this.state.list && <><Tooltip title={this.t('expand all')}>
                    <IconButton onClick={() => this.expandAll()}>
                        <FolderOpenIcon />
                    </IconButton>
                </Tooltip>
                    <Tooltip title={this.t('collapse all')}>
                        <IconButton onClick={() => this.collapseAll()}>
                            <FolderIcon />
                        </IconButton>
                    </Tooltip>
                </>}
                {this.state.viewMode && <Tooltip title={this.t('list')}>
                    <IconButton onClick={() => this.listTable()}>
                        <ListIcon color={this.state.list ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>}

                {/*<Tooltip title={this.t('Filter local connection type')}>
                    <IconButton onClick={() => this.toggleConnectionTypeFilter()}>
                        <CloudOffIcon color={this.state.filterConnectionType ? 'primary' : 'inherit'} />
                    </IconButton>
                 </Tooltip>*/}
                {this.state.updateList ?
                    <IconButton onClick={() => this.changeInstalledList(true)}>
                        <StarIcon color="primary" style={{ opacity: 0.3, color: this.state.installedList === 2 ? 'red' : undefined }} />
                    </IconButton>
                    :
                    <Tooltip title={this.t(!this.state.installedList ?
                        'Show only installed' :
                        (this.state.installedList < 2 ?
                            'Showed only installed adapters' :
                            'Showed only installed adapters without instance.'))}>
                        <IconButton
                            onClick={() => this.changeInstalledList()}>
                            <StarIcon style={this.state.installedList === 2 ? {color: 'red'} : null}
                                      color={this.state.installedList && this.state.installedList < 2 ? 'primary' : 'inherit'}/>
                        </IconButton>
                    </Tooltip>
                }
                <IsVisible config={this.props.adminGuiConfig} name="admin.adapters.filterUpdates">
                    <Tooltip title={this.t('Filter adapter with updates')}>
                        <IconButton onClick={() => this.changeUpdateList()}>
                            <UpdateIcon color={this.state.updateList ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                </IsVisible>
                {updateAllButtonAvailable && <Tooltip title={this.t('Update all adapters')}>
                    <IconButton onClick={() => this.setState({ showUpdater: true })} classes={{ label: this.props.classes.updateAllButton }}>
                        <UpdateIcon />
                        <UpdateIcon className={this.props.classes.updateAllIcon} />
                    </IconButton>
                </Tooltip>}

                {this.props.expertMode && this.props.adminGuiConfig.admin.adapters?.gitHubInstall !== false &&
                    <Tooltip title={this.t('Install from custom URL')}>
                        <IconButton onClick={() => this.setState({ gitHubInstallDialog: true })}>
                            <GithubIcon />
                        </IconButton>
                    </Tooltip>
                }
                <div className={classes.grow} />
                <TextField
                    inputRef={this.inputRef}
                    label={this.t('Filter by name')}
                    defaultValue={this.state.search}
                    onChange={event => this.handleFilterChange(event)}
                    InputProps={{
                        endAdornment: (
                            this.state.search ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        window.localStorage.removeItem('Adapter.search');
                                        this.inputRef.current.value = '';
                                        this.setState({ search: '' }, () => this.filterAdapters());
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment> : null
                        ),
                    }}
                />

                {!this.state.viewMode &&
                    <CustomSelectButton
                        t={this.t}
                        icons
                        contained={this.state.categoriesTiles !== 'All'}
                        translateSuffix={'_group'}
                        arrayItem={[{ name: 'All' }, ...this.state.categories]}
                        onClick={value => this.changeCategoriesTiles(value)}
                        value={this.state.categoriesTiles} />
                }
                {!this.state.viewMode &&
                    <CustomSelectButton
                        t={this.t}
                        arrayItem={this.state.arrayFilter}
                        onClick={value => this.changeFilterTiles(value)}
                        value={this.state.filterTiles} />
                }
                <div className={classes.grow} />
                <IsVisible config={this.props.adminGuiConfig} name="admin.adapters.statistics">
                    <Hidden only={['xs', 'sm']} >
                        <div className={classes.infoAdapters} onClick={() => this.setState({ showStatistics: true })}>
                            <div className={clsx(classes.counters, classes.greenText)}>{this.t('Selected adapters')}<div ref={this.countRef} /></div>
                            <div className={classes.counters}>{this.t('Total adapters')}:<div>{this.allAdapters}</div></div>
                            <div className={classes.counters}>{this.t('Installed adapters')}:<div>{this.installedAdapters}</div></div>
                            <div className={classes.counters}>{this.t('Last month updated adapters')}:<div>{this.recentUpdatedAdapters}</div></div>
                        </div>
                    </Hidden>
                </IsVisible>
            </TabHeader>
            {this.state.viewMode && <TabContent>
                {this.props.systemConfig.common.activeRepo !== 'stable' ? <div className={this.props.classes.notStableRepo}>{this.t('Active repo is "%s"', this.props.systemConfig.common.activeRepo)}</div> : null}
                <TableContainer className={clsx(classes.container, this.props.systemConfig.common.activeRepo !== 'stable' ? classes.containerNotFullHeight : classes.containerFullHeight)}>
                    <Table stickyHeader size="small" className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell className={classes.emptyBlock}>
                                </TableCell>
                                <TableCell className={classes.name}>
                                    <Typography>{this.t('Name')}</Typography>
                                </TableCell>
                                {!descHidden && <TableCell className={classes.description} style={{ width: this.state.descWidth }}>
                                    <Typography>{this.t('Description')}</Typography>
                                </TableCell>}
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
                        <TableBody>
                            {this.getRows(descHidden)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabContent>}

            {this.getUpdater()}
            {this.getStatistics()}
            {this.renderSetRatingDialog()}
            {this.renderSlowConnectionWarning()}

            {!this.state.viewMode && <>
                {this.props.systemConfig.common.activeRepo !== 'stable' ? <div className={this.props.classes.notStableRepo}>{this.t('Active repo is "%s"', this.props.systemConfig.common.activeRepo)}</div> : null}
                <div className={this.props.classes.viewModeDiv}>{this.getTiles()}</div>
            </>}

            {this.state.addInstanceDialog &&
                <AddInstanceDialog
                    open={this.state.addInstanceDialog}
                    adapter={this.state.addInstanceAdapter}
                    hosts={this.props.hosts}
                    instancesWorker={this.props.instancesWorker}
                    repository={this.state.repository}
                    dependencies={this.getDependencies(this.state.addInstanceAdapter)}
                    currentHost={this.state.addInstanceHost}
                    currentInstance={this.state.addInstanceId}
                    t={this.t}
                    onClick={async () =>
                        await this.addInstance(this.state.addInstanceAdapter, this.state.addInstanceId)}
                    onClose={() => this.closeAddInstanceDialog()}
                    onHostChange={event => this.handleHostsChange(event)}
                    onInstanceChange={event => this.handleInstanceChange(event)}
                />
            }
            {this.state.adapterDeletionDialog &&
                <AdapterDeletionDialog
                    open={this.state.adapterDeletionDialog}
                    adapter={this.state.adapterDeletionAdapter}
                    t={this.t}
                    onClick={() => this.delete(this.state.adapterDeletionAdapter)}
                    onClose={() => this.closeAdapterDeletionDialog()}
                />
            }
            {this.state.gitHubInstallDialog && <GitHubInstallDialog
                t={this.t}
                open={this.state.gitHubInstallDialog}
                categories={this.state.categories}
                installFromUrl={async (value, debug, customUrl) =>
                    await this.addInstance(value, undefined, debug, customUrl)}
                repository={this.state.repository}
                onClose={() => { this.setState({ gitHubInstallDialog: false }) }}
            />}
            {this.state.adapterToUpdate &&
                <AdapterUpdateDialog
                    open={true}
                    adapter={this.state.adapterToUpdate}
                    adapterObject={this.state.repository[this.state.adapterToUpdate]}
                    t={this.t}
                    dependencies={this.getDependencies(this.state.adapterToUpdate)}
                    rightDependencies={this.rightDependencies(this.state.adapterToUpdate)}
                    news={this.getNews(this.state.adapterToUpdate)}
                    onUpdate={version => {
                        const adapter = this.state.adapterToUpdate;
                        this.closeAdapterUpdateDialog(() => this.update(adapter, version));
                    }}
                    onIgnore={ignoreVersion => {
                        const adapter = this.state.adapterToUpdate;
                        this.closeAdapterUpdateDialog(() => {
                            this.props.socket.getObject('system.adapter.' + adapter)
                                .then(obj => {
                                    obj.common.ignoreVersion = ignoreVersion;
                                    return this.props.socket.setObject(obj._id, obj);
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
                />
            }
            {this.state.adapterInstallVersion &&
                <CustomModal
                    open={true}
                    title={this.t('Please select specific version of %s', this.state.adapterInstallVersion)}
                    applyButton={false}
                    onClose={() => this.setState({adapterInstallVersion: ''})}
                >
                    <div className={classes.containerVersion}>
                        {this.getNews(this.state.adapterInstallVersion, true).map(({ version, news }) => {
                            return <div className={classes.currentVersion} onClick={() => {
                                this.update(this.state.adapterInstallVersion, version);
                                this.setState({adapterInstallVersion: ''});
                            }}>
                                <ListItemText
                                    primary={version}
                                    secondary={news}
                                />
                            </div>
                        })}
                    </div>
                </CustomModal>
            }
        </TabContainer>;
    }
}

Adapters.propTypes = {
    onSetCommandRunning: PropTypes.func.isRequired,
    commandRunning: PropTypes.bool,
    menuOpened: PropTypes.bool,
    menuClosed: PropTypes.bool,
    menuCompact: PropTypes.bool,
    adaptersWorker: PropTypes.object,
    instancesWorker: PropTypes.object,
    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    hosts: PropTypes.array,
    currentHost: PropTypes.string,
    ready: PropTypes.bool,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    executeCommand: PropTypes.func,
    adminGuiConfig: PropTypes.object,
};
export default withStyles(styles)(Adapters);