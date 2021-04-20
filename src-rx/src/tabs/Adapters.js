/* eslint-disable array-callback-return */
import { Component, Fragment, createRef } from 'react';
import Semver from 'semver';
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
import Rating from '@material-ui/lab/Rating';

import CloudOffIcon from '@material-ui/icons/CloudOff';
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
    }
});

class Adapters extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lastUpdate: 0,
            repository: {},
            installed: {},
            instances: [],
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
            search: '',
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
        this.updateAdapters = 0;
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

    componentDidMount() {
        if (this.props.ready) {
            this.getAdaptersInfo();
        }
    }

    componentDidUpdate() {
        if (!this.state.init && !this.state.update && this.props.ready) {
            this.getAdaptersInfo();
        }
        const descWidth = this.getDescWidth();
        if (this.state.descWidth !== descWidth) {
            this.setState({ descWidth });
        }
        if (this.countRef.current) {
            this.countRef.current.innerHTML = this.listOfVisibleAdapterLength;
        }
    }

    static getDerivedStateFromProps() {
        const location = Router.getLocation();

        return {
            dialog: location.dialog,
            dialogProp: location.id
        };
    }

    async getAdaptersInfo(updateRepo = false) {
        if (!this.props.currentHost) {
            return;
        }

        // Do not update too often
        if (new Date().getTime() - this.state.lastUpdate > 1000) {

            !this.state.update && this.setState({ update: true });

            const currentHost = this.props.currentHost;

            try {
                const hostDataProm   = this.props.socket.getHostInfo(currentHost).catch(e => window.alert(`Cannot getHostInfo for "${currentHost}": ${e}`));
                const repositoryProm = this.props.socket.getRepository(currentHost, { repo: this.props.systemConfig.common.activeRepo, update: updateRepo }, updateRepo).catch(e => window.alert('Cannot getRepository: ' + e));
                const installedProm  = this.props.socket.getInstalled(currentHost, updateRepo).catch(e => window.alert('Cannot getInstalled: ' + e));
                const instancesProm  = this.props.socket.getAdapterInstances(updateRepo).catch(e => window.alert('Cannot getAdapterInstances: ' + e));
                const rebuildProm    = this.props.socket.checkFeatureSupported('CONTROLLER_NPM_AUTO_REBUILD').catch(e => window.alert('Cannot checkFeatureSupported: ' + e));
                const objectsProm    = this.props.socket.getForeignObjects('system.adapter.*', 'adapter').catch(e => window.alert('Cannot read system.adapters.*: ' + e));
                const ratingsProm    = this.props.socket.getRatings(updateRepo).catch(e => window.alert('Cannot read ratings: ' + e));

                const [hostData, repository, installed, instances, rebuild, objects, ratings] = await Promise.all(
                    [
                        hostDataProm,
                        repositoryProm,
                        installedProm,
                        instancesProm,
                        rebuildProm,
                        objectsProm,
                        ratingsProm
                    ]
                );
                this.uuid = ratings.uuid;

                // console.log('objects', hostData, instancesProm)
                this.rebuildSupported = rebuild || false;

                const nodeJsVersion = hostData['Node.js'].replace('v', '');
                const hostOs = hostData.os;

                const categories = {};
                const categoriesSorted = [];
                const categoriesExpanded = JSON.parse(window.localStorage.getItem('Adapters.expandedCategories')) || {};
                const updateAvailable = [];

                Object.keys(installed).forEach(value => {
                    const adapter = installed[value];
                    const _obj = objects['system.adapter.' + value];
                    if (_obj?.common?.ignoreVersion) {
                        adapter.ignoreVersion = _obj?.common?.ignoreVersion;
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

                const now = Date.now();
                Object.keys(repository).forEach(value => {
                    const adapter = repository[value];
                    if (adapter.keywords) {
                        adapter.keywords = adapter.keywords.map(word => word.toLowerCase());
                    }
                    const _installed = installed[value];
                    if (_installed &&
                        _installed.ignoreVersion !== adapter.version &&
                        Adapters.updateAvailable(_installed.version, adapter.version)
                    ) {
                        updateAvailable.push(value);
                    }

                    adapter.rating = ratings[value];
                    if (adapter.rating && adapter.rating.rating) {
                        adapter.rating.title = [
                            `Total rating: ${adapter.rating.rating.r} (${adapter.rating.rating.c} ${this.t('votes')})`,
                            (_installed && _installed.version && adapter.rating[installed.version]) ? `Rating for ${installed.version}: ${adapter.rating[installed.version].r} (${adapter.rating[installed.version].c} ${this.t('votes')})` : ''
                        ].filter(i => i).join('\n');
                    } else {
                        adapter.rating = { title: this.t('No rating or too few data') };
                    }

                    if (!adapter.controller) {
                        const type = adapter.type;
                        const installedInGroup = installed[value];

                        const daysAgo = Math.round((now - new Date(adapter.versionDate).getTime()) / 86400000);
                        if (daysAgo <= 31) {
                            this.updateAdapters++
                        }
                        if (installed[value]) {
                            this.installedAdapters++
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

                Object.keys(instances).forEach(value => {
                    const instance    = instances[value];
                    const name        = instance.common.name;
                    const enabled     = instance.common.enabled;
                    let installedFrom = instance.common.installedFrom;
                    const inst        = installed[name];
                    let nonNpmVersion = false;

                    if (installedFrom && installedFrom.search(/^iobroker.*?@\d+.\d+.\d+.*$/) === -1) {
                        nonNpmVersion = true;
                        installedFrom = installedFrom.substr(installedFrom.lastIndexOf('/') + 1, 8).trim();
                    }

                    if (inst) {
                        inst.count++;

                        if (enabled) {
                            inst.enabled++;
                        }

                        if (nonNpmVersion) {
                            inst.installedFrom = installedFrom;
                        }
                    }
                });

                Object.keys(categories).sort().forEach(value =>
                    categoriesSorted.push(categories[value]));

                /*
                categoriesSorted.sort((a, b) => {
                    const result = b.installed - a.installed;

                    return result !== 0 ? result : a.translation < b.translation ? -1 :
                        a.translation > b.translation ? 1 : 0;
                });*/

                const list            = JSON.parse(window.localStorage.getItem('Adapters.list'));
                const viewMode        = JSON.parse(window.localStorage.getItem('Adapters.viewMode'));
                const updateList      = JSON.parse(window.localStorage.getItem('Adapters.updateList'));
                const installedList   = JSON.parse(window.localStorage.getItem('Adapters.installedList'));
                const categoriesTiles = window.localStorage.getItem('Adapters.categoriesTiles') || 'All';
                const filterTiles     = window.localStorage.getItem('Adapters.filterTiles') || 'A-Z';
                this.allAdapters      = Object.keys(repository).length - 1;

                this.setState({
                    filterTiles,
                    categoriesTiles,
                    installedList,
                    updateList,
                    updateAvailable,
                    viewMode,
                    list,
                    lastUpdate: Date.now(),
                    hostData,
                    hostOs,
                    nodeJsVersion,
                    repository,
                    installed,
                    instances,
                    categories: categoriesSorted,
                    categoriesExpanded,
                    init: true,
                    update: false
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    addInstance(adapter, instance, debug = false, customUrl = false) {
        if (!instance && this.props.expertMode && !customUrl) {
            this.setState({
                addInstanceDialog: true,
                addInstanceAdapter: adapter,
                addInstanceHost: this.props.currentHostName
            });
        } else {
            if (instance && !customUrl) {
                let cancel = false;

                for (let i = 0; i < this.state.instances.length; i++) {
                    const instance = this.state.instances[i];

                    if (instance._id === `system.adapter.${adapter}.${instance}`) {
                        cancel = true;
                        break;
                    }
                }

                if (cancel) {
                    return this.setState({ addInstanceError: true });
                }
            }
            this.props.executeCommand(`${customUrl ? 'url' : 'add'} ${adapter} ${instance ? instance + ' ' : ''}--host ${this.props.currentHostName} ${debug ? '--debug' : ''}`, true);
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

    update(adapter) {
        this.props.executeCommand('upgrade ' + adapter);
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
        this.setState({
            addInstanceHost: event.target.value
        });
    }

    handleInstanceChange(event) {
        this.setState({
            addInstanceId: event.target.value
        });
    }

    static updateAvailable(oldVersion, newVersion) {

        try {
            return Semver.gt(newVersion, oldVersion) === true;
        } catch (e) {
            console.warn(`Cannot compare "${newVersion}" and "${oldVersion}"`);
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
                    name: '',
                    version: null,
                    installed: false,
                    installedVersion: null,
                    rightVersion: false
                };

                const checkVersion = typeof dependency !== 'string';
                const keys = Object.keys(dependency);
                entry.name = !checkVersion ? dependency : keys ? keys[0] : null;
                entry.version = checkVersion ? dependency[entry.name] : null;

                if (result && entry.name) {

                    const installed = this.state.installed[entry.name];

                    entry.installed = !!installed;
                    entry.installedVersion = installed ? installed.version : null;
                    entry.rightVersion = installed ? checkVersion ? Semver.satisfies(installed.version, entry.version, { includePrerelease: true }) : true : false;
                }

                result.push(entry);
            });

            if (nodeVersion) {

                const entry = {
                    name: 'node',
                    version: nodeVersion,
                    installed: true,
                    installedVersion: this.state.nodeJsVersion,
                    rightVersion: false
                };

                entry.rightVersion = Semver.satisfies(this.state.nodeJsVersion, nodeVersion);

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
            const nodeVersion = adapter.node;

            if (dependencies) {
                if (dependencies instanceof Array) {
                    dependencies.forEach(dependency => {
                        const checkVersion = typeof dependency !== 'string';
                        const keys = Object.keys(dependency);
                        const name = !checkVersion ? dependency : keys ? keys[0] : null;

                        if (result && name) {

                            const installed = this.state.installed[name];

                            result = installed ? (checkVersion ? Semver.satisfies(installed.version, dependency[name], { includePrerelease: true }) : true) : false;
                        }
                    });
                } else if (typeof dependencies === 'object') {
                    Object.keys(dependencies).forEach(dependency => {
                        if (dependency && dependencies[dependency] !== undefined && result) {
                            const installed = this.state.installed[dependency];
                            const checkVersion = typeof dependencies[dependency] !== 'string';
                            result = installed ? (checkVersion ? Semver.satisfies(installed.version, dependency[dependency], { includePrerelease: true }) : true) : false;
                        }
                    });
                } else {
                    console.error(`Invalid dependencies for ${value}: ${JSON.stringify(dependencies)}`);
                }
            }

            if (result && nodeVersion) {
                result = Semver.satisfies(this.state.nodeJsVersion, nodeVersion);
            }
        }

        return result;
    }

    rightOs(value) {
        const adapter = this.state.repository[value];

        if (adapter) {

            const os = adapter.os;

            if (os) {

                os.forEach(value => {
                    if (this.state.hostOs === value) {
                        return true;
                    }
                });

                return false;
            }
        }

        return true;
    }

    openInfoDialog(adapter) {
        Router.doNavigate('tab-adapters', 'readme', adapter);
    }

    openUpdateDialog(adapter) {
        this.setState({
            adapterUpdateDialog: true,
            adapterUpdateAdapter: adapter
        });
    }

    openInstallVersionDialog(adapter) {
        this.setState({
            adapterInstallVersionDialog: true,
            adapterInstallVersion: adapter
        });
    }

    closeAdapterUpdateDialog(cb) {
        this.setState({
            adapterUpdateDialog: false,
            adapterUpdateAdapter: null
        }, () => cb && cb());
    }

    showSetRatingDialog(adapter, version) {
        fetch('https://rating.iobroker.net/adapter/' + adapter + '?uuid=' + this.uuid)
            .then(res => res.json())
            .then(votings => {
                this.setState({ showSetRating: { adapter, votings, version } });
            });
    }

    renderSetRatingDialog() {
        if (this.state.showSetRating) {
            const votings = this.state.showSetRating.votings.rating;
            const versions = Object.keys(votings);
            versions.sort((a, b) => votings[a].ts > votings[b].ts ? -1 : (votings[a].ts < votings[b].ts ? 1 : 0));
            let item;
            if (versions.length) {
                item = votings[versions[0]];
            }
            return <Dialog
                open={true}
                onClose={() => this.setState({ showSetRating: null })}
            >
                <DialogTitle>{this.t('Review') + ' ' + this.state.showSetRating.adapter + '@' + this.state.showSetRating.version}</DialogTitle>
                <DialogContent style={{ textAlign: 'center' }}>
                    <Rating
                        className={this.props.classes.rating}
                        name={this.state.showSetRating.adapter}
                        defaultValue={item ? item.r : 0}
                        size="large"
                        onChange={(event, newValue) => {
                            if (newValue !== item?.r) {
                                this.setAdapterRating(this.state.showSetRating.adapter, this.state.showSetRating.version, newValue)
                                    .then(() => this.setState({ showSetRating: null }));
                            } else {
                                this.setState({ showSetRating: null });
                            }
                        }}
                    />
                    {item ? <div>{this.t('You voted for %s on %s', versions[0], new Date(item.ts).toLocaleDateString())}</div> : null}
                </DialogContent>
            </Dialog>;
        } else {
            return null;
        }
    }

    getNews(value, all = false) {
        const adapter = this.state.repository[value];
        const installed = this.state.installed[value];
        const news = [];

        if (installed && adapter && adapter.news) {

            Object.keys(adapter.news).forEach(version => {
                try {
                    console.log(22222, Semver.gt(version, installed.version));
                    if (Semver.gt(version, installed.version) || all) {
                        news.push({
                            version: version,
                            news: adapter.news[version][this.props.lang] || adapter.news[version].en
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed.version}"`);
                }
            });
        }

        return news;
    }

    handleFilterChange(event) {
        this.typingTimer && clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(value => {
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

    changeInstalledList() {
        this.cache.listOfVisibleAdapter = null;
        let installedList = !this.state.installedList;
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
                console.warn(adapter);
            }

            return <AdapterRow
                t={this.t}
                descHidden={descHidden}
                key={'adapter-' + value}
                connectionType={cached.connectionType}
                dataSource={adapter.dataSource}
                description={cached.desc}
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
                onSetRating={installed && installed.version ? () => this.showSetRatingDialog(value, installed.version) : null}

                onAddInstance={() => licenseDialogFunc(adapter.license === 'MIT', () => this.addInstance(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                onDeletion={() => this.openAdapterDeletionDialog(value)}
                onInfo={() => this.openInfoDialog(value)}
                onRebuild={() => this.rebuild(value)}
                onUpdate={() => this.openUpdateDialog(value)}
                openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                onUpload={() => licenseDialogFunc(adapter.license === 'MIT', () => this.upload(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
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
            return <tr><td colSpan={4} style={{ padding: 16, fontSize: 18 }}>{this.t('all items are filtered out')}</td></tr>;
        } else {
            return rows;
        }
    }

    buildCache() {
        this.cache.listOfVisibleAdapter = [];
        this.cache.adapters = {};
        const now = Date.now();
        const textDaysAgo = this.t('days ago');

        const sortPopularFirst = !this.state.viewMode && this.state.filterTiles === 'Popular first';
        const sortRecentlyUpdated = !this.state.viewMode && this.state.filterTiles === 'Recently updated';
        const sortAZ = this.state.viewMode || this.state.filterTiles === 'A-Z';

        // get all visible adapters
        this.state.categories
            .filter(cat => this.state.viewMode || !this.state.categoriesTiles || this.state.categoriesTiles === 'All' || cat.name === this.state.categoriesTiles)
            .forEach(category => category.adapters.forEach(value => {
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
                        show = !!(installed && installed.version);
                    }
                    if (show) {
                        this.cache.listOfVisibleAdapter.push(value);
                        const daysAgo10 = Math.round((now - new Date(adapter.versionDate).getTime()) / 8640000);
                        const daysAgo = Math.round(daysAgo10 / 10);

                        this.cache.adapters[value] = {
                            title: ((adapter.title || '').toString() || '').replace('ioBroker Visualisation - ', ''),
                            desc: adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] || adapter.desc : '',
                            image: installed ? installed.localIcon : adapter.extIcon,
                            connectionType: adapter.connectionType ? adapter.connectionType : '-',
                            updateAvailable: this.state.updateAvailable.includes(value),
                            rightDependencies: this.rightDependencies(value),
                            rightOs: this.rightOs(value),
                            sentry: !!(adapter.plugins && adapter.plugins.sentry),
                            daysAgo: daysAgo10,
                            stat: sortPopularFirst && adapter.stat,
                            daysAgoText: sortRecentlyUpdated && daysAgo ? `${daysAgo} ${textDaysAgo}` : ''
                        }
                    }
                }
            }));
        this.listOfVisibleAdapterLength = this.cache.listOfVisibleAdapter.length
        if (sortAZ) {
            this.cache.listOfVisibleAdapter.sort();
        } else {
            this.cache.listOfVisibleAdapter.sort((a, b) => {
                if (sortPopularFirst) {
                    return this.state.repository[b].stat - this.state.repository[a].stat;
                } else
                    if (sortRecentlyUpdated) {
                        return this.cache.adapters[a].daysAgo - this.cache.adapters[b].daysAgo;
                    }
            });
        }
    }

    setAdapterRating(adapter, version, rating) {
        return fetch('https://rating.iobroker.net/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify({ uuid: this.uuid, adapter, version, rating })
        })
            .then(res => res.json())
            .then(update => {
                window.alert(this.t('Vote: ') + adapter + '@' + version + '=' + rating);
                const repository = JSON.parse(JSON.stringify(this.state.repository));
                repository[adapter].rating = update;
                this.setState({ repository });
            })
            .catch(e => window.alert('Cannot vote: ' + e));
    }

    getTiles() {
        if (!this.cache.listOfVisibleAdapter) {
            this.buildCache();
        }

        if (!this.cache.listOfVisibleAdapter.length) {
            return <div style={{
                margin: 20,
                fontSize: 26
            }}>{this.props.t('all items are filtered out')}</div>;
        } else {
            return this.cache.listOfVisibleAdapter.map(value => {
                const adapter = this.state.repository[value];
                const installed = this.state.installed[value];
                const cached = this.cache.adapters[value];

                if (cached.title instanceof Object || !cached.desc) {
                    console.warn(adapter);
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
                    onSetRating={installed && installed.version ? () => this.showSetRatingDialog(value, installed.version) : null}

                    onAddInstance={() => licenseDialogFunc(adapter.license === 'MIT', () => this.addInstance(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                    onDeletion={() => this.openAdapterDeletionDialog(value)}
                    onInfo={() => this.openInfoDialog(value)}
                    onRebuild={() => this.rebuild(value)}
                    onUpdate={() => this.openUpdateDialog(value)}
                    openInstallVersionDialog={() => this.openInstallVersionDialog(value)}
                    onUpload={() => licenseDialogFunc(adapter.license === 'MIT', () => this.upload(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
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
                onClose={reload => this.setState({ showUpdater: false }, () => reload && this.getAdaptersInfo(true))}
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
                    <div className={this.props.classes.counters}>{this.t('Last month updated adapters')}: <span style={{ paddingLeft: 6, fontWeight: 'bold' }}>{this.updateAdapters}</span></div>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => this.setState({ showStatistics: false })} color="primary" autoFocus>
                        <CloseIcon />{this.props.t('Close')}
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
                        t={this.t}
                    />
                </TabContainer>;
            }
        }

        const { classes } = this.props;
        const descHidden = this.state.descWidth < 50;
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
                <Tooltip title={this.t('Update adapter information')}>
                    <IconButton onClick={() => this.getAdaptersInfo(true)}>
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

                <Tooltip title={this.t('Filter local connection type')}>
                    <IconButton onClick={() => this.toggleConnectionTypeFilter()}>
                        <CloudOffIcon color={this.state.filterConnectionType ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
                {this.state.updateList ?
                    <IconButton
                        disabled={true}>
                        <StarIcon color="primary" style={{ opacity: 0.3 }} />
                    </IconButton>
                    :
                    <Tooltip title={this.t('installed adapters')}>
                        <IconButton
                            onClick={() => this.changeInstalledList()}>
                            <StarIcon color={this.state.installedList ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                }
                <Tooltip title={this.t('adapter with updates')}>
                    <IconButton onClick={() => this.changeUpdateList()}>
                        <UpdateIcon color={this.state.updateList ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
                {!this.props.commandRunning && !!this.props.ready && !!this.state.updateList && this.state.updateAvailable.length > 1 && <Tooltip title={this.t('Update all adapters')}>
                    <IconButton onClick={() => this.setState({ showUpdater: true })} classes={{ label: this.props.classes.updateAllButton }}>
                        <UpdateIcon />
                        <UpdateIcon className={this.props.classes.updateAllIcon} />
                    </IconButton>
                </Tooltip>}

                {this.props.expertMode &&
                    <Tooltip title={this.t('Install from custom URL')}>
                        <IconButton onClick={() => this.setState({ gitHubInstallDialog: true })}>
                            <GithubIcon />
                        </IconButton>
                    </Tooltip>
                }
                <div className={classes.grow} />
                <TextField
                    inputRef={this.inputRef}
                    label={this.t('Filter')}
                    defaultValue=""
                    onChange={event => this.handleFilterChange(event)}
                    InputProps={{
                        endAdornment: (
                            this.state.search ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
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
                <Hidden only={['xs', 'sm']} >
                    <div className={classes.infoAdapters} onClick={() => this.setState({ showStatistics: true })}>
                        <div className={clsx(classes.counters, classes.greenText)}>{this.t('Selected adapters')}<div ref={this.countRef} /></div>
                        <div className={classes.counters}>{this.t('Total adapters')}:<div>{this.allAdapters}</div></div>
                        <div className={classes.counters}>{this.t('Installed adapters')}:<div>{this.installedAdapters}</div></div>
                        <div className={classes.counters}>{this.t('Last month updated adapters')}:<div>{this.updateAdapters}</div></div>
                    </div>
                </Hidden>
            </TabHeader>
            {this.state.viewMode && <TabContent>
                <TableContainer className={classes.container}>
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

            {!this.state.viewMode && <div style={{
                display: 'flex',
                flexFlow: 'wrap',
                overflow: 'auto',
                justifyContent: 'center'
            }}>{this.getTiles()}</div>}

            {this.state.addInstanceDialog &&
                <AddInstanceDialog
                    open={this.state.addInstanceDialog}
                    adapter={this.state.addInstanceAdapter}
                    hosts={this.props.hosts}
                    instances={this.state.instances}
                    repository={this.state.repository}
                    dependencies={this.getDependencies(this.state.addInstanceAdapter)}
                    currentHost={this.state.addInstanceHost}
                    currentInstance={this.state.addInstanceId}
                    t={this.t}
                    onClick={() => this.addInstance(this.state.addInstanceAdapter, this.state.addInstanceId)}
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
            <GitHubInstallDialog
                t={this.t}
                open={this.state.gitHubInstallDialog}
                categories={this.state.categories}
                installFromUrl={(value, debug, customUrl) =>
                    this.addInstance(value, undefined, debug, customUrl)}
                repository={this.state.repository}
                onClose={() => { this.setState({ gitHubInstallDialog: false }) }}
            />
            {this.state.adapterUpdateDialog &&
                <AdapterUpdateDialog
                    open={this.state.adapterUpdateDialog}
                    adapter={this.state.adapterUpdateAdapter}
                    t={this.t}
                    dependencies={this.getDependencies(this.state.adapterUpdateAdapter)}
                    rightDependencies={this.rightDependencies(this.state.adapterUpdateAdapter)}
                    news={this.getNews(this.state.adapterUpdateAdapter)}
                    onUpdate={() => {
                        const adapter = this.state.adapterUpdateAdapter;
                        this.closeAdapterUpdateDialog(() => this.update(adapter));
                    }}
                    onIgnore={ignoreVersion => {
                        const adapter = this.state.adapterUpdateAdapter;
                        this.closeAdapterUpdateDialog(() => {
                            this.props.socket.getObject('system.adapter.' + adapter)
                                .then(obj => {
                                    obj.common.ignoreVersion = ignoreVersion;
                                    return this.props.socket.setObject(obj._id, obj)
                                })
                                .then(() => {
                                    const updateAvailable = [...this.state.updateAvailable];
                                    const pos = updateAvailable.indexOf(adapter);
                                    if (pos !== -1) {
                                        updateAvailable.splice(pos, 1);
                                        this.setState({ updateAvailable });
                                    }
                                })
                        })
                    }}
                    onClose={() => this.closeAdapterUpdateDialog()}
                />
            }
            {this.state.adapterInstallVersionDialog &&
                <CustomModal
                    open={this.state.adapterInstallVersionDialog}
                    title={this.t('Please select specific version of %s', this.state.adapterInstallVersion)}
                    applyButton={false}
                    onClose={() => this.setState({
                        adapterInstallVersionDialog: false,
                        adapterInstallVersion: null
                    })}
                >
                    <div className={classes.containerVersion}>
                        {this.getNews(this.state.adapterInstallVersion, true).map(({ version, news }) => {
                            return <div className={classes.currentVersion} onClick={() => {
                                this.update(`${this.state.adapterInstallVersion}@${version}`);
                                this.setState({
                                    adapterInstallVersionDialog: false,
                                    adapterInstallVersion: null
                                });
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
    menuCompact: PropTypes.bool
};
export default withStyles(styles)(Adapters);