/* eslint-disable array-callback-return */
import { Component, Fragment, createRef } from 'react';

import { withStyles } from '@material-ui/core/styles';

import {
    Grid,
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
    InputAdornment
} from '@material-ui/core';

import CloudOffIcon from '@material-ui/icons/CloudOff';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import RefreshIcon from '@material-ui/icons/Refresh';
import ListIcon from '@material-ui/icons/List';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import UpdateIcon from '@material-ui/icons/Update';
import StarIcon from '@material-ui/icons/Star';

import { FaGithub as GithubIcon } from 'react-icons/fa';

import {
    blue,
    green
} from '@material-ui/core/colors';

import AdapterDeletionDialog from '../dialogs/AdapterDeletionDialog';
import AdapterInfoDialog from '../dialogs/AdapterInfoDialog';
import AdapterUpdateDialog from '../dialogs/AdapterUpdateDialog';
import AddInstanceDialog from '../dialogs/AddInstanceDialog';

import AdapterRow from '../components/AdapterRow';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';

import Router from '@iobroker/adapter-react/Components/Router';

import Semver from 'semver';
import CardAdapters from '../components/CardAdapters';
import CloseIcon from "@material-ui/icons/Close";
import CustomSelectButton from '../components/CustomSelectButton';
import GitHubInstallDialog from '../dialogs/GitHubInstallDialog';
import { licenseDialogFunc } from '../dialogs/LicenseDialog';

const styles = theme => ({
    container: {
        height: '100%'
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    table: {
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
        width: 300
    },
    emptyBlock: {
        flexWrap: 'nowrap',
        width: 50
    },
    description: {
        width: 600
    },
    keywords: {

    },
    connectionType: {
        width: 40
    },
    installed: {
        width: 120
    },
    available: {
        width: 120,
        paddingRight: 6
    },
    update: {
        width: 40,
        padding: 0
    },
    license: {
        width: 150
    },
    install: {
        width: 220
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
        };

        this.rebuildSupported = false;
        this.inputRef = createRef();
        this.t = props.t;
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
                const hostDataProm = this.props.socket.getHostInfo(currentHost);
                const repositoryProm = this.props.socket.getRepository(currentHost, { repo: this.props.systemConfig.common.activeRepo, update: updateRepo }, updateRepo);
                const installedProm = this.props.socket.getInstalled(currentHost, updateRepo);
                const instancesProm = this.props.socket.getAdapterInstances(updateRepo);
                const rebuildProm = this.props.socket.checkFeatureSupported('CONTROLLER_NPM_AUTO_REBUILD');

                const [hostData, repository, installed, instances, rebuild] = await Promise.all(
                    [
                        hostDataProm,
                        repositoryProm,
                        installedProm,
                        instancesProm,
                        rebuildProm
                    ]
                );

                this.rebuildSupported = rebuild || false;

                const nodeJsVersion = hostData['Node.js'].replace('v', '');
                const hostOs = hostData.os;

                const categories = {};
                const categoriesSorted = [];
                const categoriesExpanded = JSON.parse(window.localStorage.getItem('Adapters.expandedCategories')) || {};
                const updateAvailable = [];

                Object.keys(installed).forEach(value => {

                    const adapter = installed[value];

                    if (!adapter.controller && value !== 'hosts') {
                        if (!repository[value]) {
                            repository[value] = JSON.parse(JSON.stringify(adapter));
                            repository[value].version = '';
                        }
                    }
                });

                Object.keys(repository).forEach(value => {

                    const adapter = repository[value];
                    if (adapter.keywords) {
                        adapter.keywords = adapter.keywords.map(word => word.toLowerCase());
                    }
                    const _installed = installed[value];
                    if (_installed && this.updateAvailable(_installed.version, adapter.version)) {
                        updateAvailable.push(value);
                    }

                    if (!adapter.controller) {
                        const type = adapter.type;
                        const installedInGroup = installed[value];

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

                    const instance = instances[value];
                    const name = instance.common.name;
                    const enabled = instance.common.enabled;
                    let installedFrom = instance.common.installedFrom;
                    const inst = installed[name];
                    let nonNpmVersion = false;

                    if (installedFrom && installedFrom.search(/^iobroker.*?@\d+.\d+.\d+.*$/) === -1) {
                        nonNpmVersion = true;
                        installedFrom = installedFrom.substr(installedFrom.lastIndexOf('/') + 1, 8).trim();
                    }

                    if (inst) {
                        if (inst.count) {
                            inst.count++;
                        } else {
                            inst.count = 1;
                        }

                        if (enabled) {
                            if (inst.enabled) {
                                inst.enabled++;
                            } else {
                                inst.enabled = 1;
                            }
                        }

                        if (nonNpmVersion) {
                            inst.installedFrom = installedFrom;
                        }
                    }
                });

                Object.keys(categories).forEach(value => {
                    categoriesSorted.push(categories[value]);
                });

                categoriesSorted.sort((a, b) => {

                    const result = b.installed - a.installed;

                    return result !== 0 ? result : a.translation < b.translation ? -1 :
                        a.translation > b.translation ? 1 : 0;
                });

                const list = JSON.parse(window.localStorage.getItem('Adapters.list'));
                const viewMode = JSON.parse(window.localStorage.getItem('Adapters.viewMode'));
                const updateList = JSON.parse(window.localStorage.getItem('Adapters.updateList'));
                const installedList = JSON.parse(window.localStorage.getItem('Adapters.installedList'));
                const categoriesTiles = window.localStorage.getItem('Adapters.categoriesTiles') || 'All';
                const filterTiles = window.localStorage.getItem('Adapters.filterTiles') || 'A-Z';

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
                    this.setState({
                        addInstanceError: true
                    });

                    return;
                }
            }
            this.props.executeCommand(`${customUrl ? 'url' : 'add'} ${adapter} ${instance ? instance + ' ' : ''}--host ${this.props.currentHostName} ${debug ? '--debug' : ''}`);
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

    updateAvailable(oldVersion, newVersion) {

        try {
            return Semver.gt(newVersion, oldVersion) === true;
        } catch (e) {
            console.warn(`Cannot compare "${newVersion}" and "${oldVersion}"`);
            return false;
        }
    }

    getDependencies(value) {

        const adapter = this.state.repository[value];
        let result = [];

        if (adapter) {

            const dependencies = adapter.dependencies;
            const nodeVersion = adapter.node;

            dependencies && dependencies.forEach(dependency => {

                const entry = {
                    name: '',
                    version: null,
                    installed: false,
                    installedVersion: null,
                    rightVersion: false
                }

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

    closeAdapterUpdateDialog() {
        this.setState({
            adapterUpdateDialog: false,
            adapterUpdateAdapter: null
        });
    }

    getNews(value) {

        const adapter = this.state.repository[value];
        const installed = this.state.installed[value];
        const news = [];

        if (installed && adapter && adapter.news) {

            Object.keys(adapter.news).forEach(version => {
                try {
                    console.log(Semver.gt(version, installed.version));
                    if (Semver.gt(version, installed.version)) {
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
        let viewMode = !this.state.viewMode;
        window.localStorage.setItem('Adapters.viewMode', JSON.stringify(viewMode));
        this.setState({ viewMode });
    }

    changeUpdateList() {
        let updateList = !this.state.updateList;
        window.localStorage.setItem('Adapters.updateList', JSON.stringify(updateList));
        this.setState({ updateList });
    }

    changeInstalledList() {
        let installedList = !this.state.installedList;
        window.localStorage.setItem('Adapters.installedList', JSON.stringify(installedList));
        this.setState({ installedList });
    }

    changeFilterTiles(filterTiles) {
        window.localStorage.setItem('Adapters.filterTiles', filterTiles);
        this.setState({ filterTiles });
    }

    changeCategoriesTiles(categoriesTiles) {
        window.localStorage.setItem('Adapters.categoriesTiles', categoriesTiles);
        this.setState({ categoriesTiles });
    }

    filterAdapters(search) {
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

    getRows() {
        let count = 0;
        const rows = this.state.categories.map(category => {
            const categoryName = category.name;
            const expanded = this.state.categoriesExpanded[categoryName];
            let showCategory = false;
            return <Fragment key={`category-${categoryName} ${category.adapters.length}`}>
                {!this.state.list && category.adapters.map((value, idx) => {
                    const adapter = this.state.repository[value];
                    if (!adapter.controller) {
                        const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                        const updateAvailable = this.state.updateAvailable.includes(value);
                        let show = !this.state.filteredList || this.state.filteredList.includes(value);
                        if (show && this.state.filterConnectionType) {
                            show = connectionType === 'local';
                        }
                        if (show && this.state.updateList) {
                            show = updateAvailable;
                        }
                        if (show && this.state.installedList) {
                            show = Boolean(category.installed)
                        }
                        if (show) {
                            showCategory = true;
                        }
                        return category.adapters.length === idx + 1 ? <AdapterRow
                            key={'category-' + categoryName + 1}
                            category
                            categoryName={categoryName}
                            count={category.count}
                            expanded={expanded}
                            installedCount={category.installed}
                            name={category.translation}
                            onToggle={() => this.toggleCategory(categoryName)}
                            t={this.t}
                            hidden={!showCategory}
                        /> : null;
                    }
                })}
                {category.adapters.map(value => {
                    const adapter = this.state.repository[value];
                    if (!adapter.controller) {
                        const installed = this.state.installed[value];
                        const title = ((adapter.title || '').toString() || '').replace('ioBroker Visualisation - ', '');
                        const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] || adapter.desc : '';
                        const image = installed ? installed.localIcon : adapter.extIcon;
                        const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                        const updateAvailable = this.state.updateAvailable.includes(value);
                        const rightDependencies = this.rightDependencies(value);
                        const rightOs = this.rightOs(value);
                        const sentry = !!(adapter.plugins && adapter.plugins.sentry);
                        let show = !this.state.filteredList || this.state.filteredList.includes(value);
                        if (show && this.state.filterConnectionType) {
                            show = connectionType === 'local';
                        }
                        if (show && this.state.updateList) {
                            show = updateAvailable;
                        }
                        if (show && this.state.installedList) {
                            show = Boolean(category.installed)
                        }
                        if (show) {
                            showCategory = true;
                        }
                        if (title instanceof Object || !desc) {
                            console.warn(adapter);
                        }
                        show && count++;
                        return expanded && <AdapterRow
                            key={'adapter-' + value}
                            connectionType={connectionType}
                            description={desc}
                            enabledCount={installed && installed.enabled}
                            expertMode={this.props.expertMode}
                            image={image}
                            installedCount={installed && installed.count}
                            installedFrom={installed && installed.installedFrom}
                            installedVersion={installed && installed.version}
                            keywords={adapter.keywords}
                            name={title}
                            license={adapter.license}
                            onAddInstance={() => licenseDialogFunc(adapter.license === 'MIT', () => this.addInstance(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                            onDeletion={() => this.openAdapterDeletionDialog(value)}
                            onInfo={() => this.openInfoDialog(value)}
                            onRebuild={() => this.rebuild(value)}
                            onUpdate={() => this.openUpdateDialog(value)}
                            onUpload={() => licenseDialogFunc(adapter.license === 'MIT', () => this.upload(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                            updateAvailable={updateAvailable}
                            version={adapter.version}
                            hidden={!show}
                            rightDependencies={rightDependencies}
                            rightOs={rightOs}
                            sentry={sentry}
                            rebuild={this.rebuildSupported}
                        />;
                    }
                })}
            </Fragment>
        });

        if (!count) {
            return <div style={{ margin: 10, fontSize: 14 }}>{this.props.t('all items are filtered out')}</div>;
        } else {
            return rows;
        }
    }

    getTiles() {
        let array = this.state.categories
            .filter(({ name }) => !this.state.categoriesTiles || this.state.categoriesTiles === 'All' || name === this.state.categoriesTiles)
            .map(category => category.adapters.map(value => {
                const adapter = this.state.repository[value];
                if (!adapter.controller) {
                    const installed = this.state.installed[value];
                    const title = ((adapter.title || '').toString() || '').replace('ioBroker Visualisation - ', '');
                    const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] || adapter.desc : '';
                    const image = installed ? installed.localIcon : adapter.extIcon;
                    const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                    const updateAvailable = this.state.updateAvailable.includes(value);
                    const rightDependencies = this.rightDependencies(value);
                    const rightOs = this.rightOs(value);
                    const sentry = !!(adapter.plugins && adapter.plugins.sentry);
                    let show = !this.state.filteredList || this.state.filteredList.includes(value);
                    if (show && this.state.filterConnectionType) {
                        show = connectionType === 'local';
                    }
                    if (show && this.state.updateList) {
                        show = updateAvailable;
                    }
                    if (show && this.state.installedList) {
                        show = Boolean(installed && installed.version)
                    }
                    if (title instanceof Object || !desc) {
                        console.warn(adapter);
                    }
                    let daysAgo = Math.round((Date.parse(new Date()) - Date.parse(adapter.versionDate)) / 86400000)
                    return ({
                        render: <CardAdapters
                            key={'adapter-' + value}
                            image={image}
                            name={title}
                            adapter={value}
                            stat={this.state.filterTiles === 'Popular first' && adapter.stat}
                            versionDate={this.state.filterTiles === 'Recently updated' && daysAgo ? `${daysAgo} ${this.props.t('days ago')}` : ''}
                            connectionType={connectionType}
                            description={desc}
                            enabledCount={installed && installed.enabled}
                            expertMode={this.props.expertMode}
                            installedCount={installed && installed.count}
                            installedFrom={installed && installed.installedFrom}
                            installedVersion={installed && installed.version}
                            keywords={adapter.keywords}
                            license={adapter.license}
                            onAddInstance={() => licenseDialogFunc(adapter.license === 'MIT', () => this.addInstance(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                            onDeletion={() => this.openAdapterDeletionDialog(value)}
                            onInfo={() => this.openInfoDialog(value)}
                            onRebuild={() => this.rebuild(value)}
                            onUpdate={() => this.openUpdateDialog(value)}
                            onUpload={() => licenseDialogFunc(adapter.license === 'MIT', () => this.upload(value), adapter.extIcon.split('/master')[0] + '/master/LICENSE')}//
                            updateAvailable={updateAvailable}
                            version={adapter.version}
                            hidden={!show}
                            rightDependencies={rightDependencies}
                            rightOs={rightOs}
                            sentry={sentry}
                            rebuild={this.rebuildSupported}
                        />,
                        title,
                        stat: adapter.stat,
                        versionDate: adapter.versionDate,
                        hidden: !show
                    })
                }
            })
            ).flat();

        if (!array.filter(({ hidden }) => !hidden).length) {
            return <div style={{
                margin: 20,
                fontSize: 26
            }}>{this.props.t('all items are filtered out')}</div>;
        } else {
            return array.sort(({ title, stat, versionDate }, b) => {
                if (this.state.filterTiles === 'A-Z') {
                    let nameA = title.toLowerCase(), nameB = b.title.toLowerCase()
                    if (nameA < nameB) {
                        return -1;
                    } else
                        if (nameA > nameB) {
                            return 1;
                        } else {
                            return 0;
                        }
                } else
                    if (this.state.filterTiles === 'Popular first') {
                        return b.stat - stat;
                    } else
                        if (this.state.filterTiles === 'Recently updated') {
                            let dateFunc = (value) => Math.round((Date.parse(new Date()) - Date.parse(value)) / 86400000)
                            if (versionDate && !b.versionDate) return -1;
                            if (!versionDate && b.versionDate) return 1;
                            if (dateFunc(versionDate) > dateFunc(b.versionDate)) return 1;
                            if (dateFunc(versionDate) < dateFunc(b.versionDate)) return -1;
                            return 0;
                        }
            }).map(({ render }) => render);
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

        return <TabContainer>
            {this.state.update &&
                <Grid item>
                    <LinearProgress />
                </Grid>
            }
            <TabHeader>
                <IconButton onClick={() => this.changeViewMode()}>
                    {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
                <IconButton onClick={() => this.getAdaptersInfo(true)}>
                    <RefreshIcon />
                </IconButton>
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
                <Tooltip title={this.t('installed adapters')}>
                    <IconButton onClick={() => this.changeInstalledList()}>
                        <StarIcon color={this.state.installedList ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('adapter with updates')}>
                    <IconButton onClick={() => this.changeUpdateList()}>
                        <UpdateIcon color={this.state.updateList ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>

                {this.props.expertMode &&
                    <IconButton onClick={() => this.setState({ gitHubInstallDialog: true })}>
                        <GithubIcon />
                    </IconButton>
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
                                        this.setState({ search: '', filteredList: null });
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
                        icons
                        contained={this.state.categoriesTiles !== 'All'}
                        arrayItem={[{ name: 'All' }, ...this.state.categories]}
                        onClick={value => this.changeCategoriesTiles(value)}
                        value={this.state.categoriesTiles} />
                }
                {!this.state.viewMode &&
                    <CustomSelectButton
                        arrayItem={this.state.arrayFilter}
                        onClick={value => this.changeFilterTiles(value)}
                        value={this.state.filterTiles} />
                }
                <div className={classes.grow} />
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
                                <TableCell className={classes.description}>
                                    <Typography>{this.t('Description')}</Typography>
                                </TableCell>
                                <TableCell className={classes.keywords}>
                                    <Typography>{this.t('Keywords')}</Typography>
                                </TableCell>
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
                            {this.getRows()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabContent>}
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
                open={this.state.gitHubInstallDialog}
                categories={this.state.categories}
                addInstance={(value, debug, customUrl) => this.addInstance(value, this.state.addInstanceId, debug, customUrl)}
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
                    onClick={() => this.update(this.state.adapterUpdateAdapter)}
                    onClose={() => this.closeAdapterUpdateDialog()}
                />
            }
        </TabContainer>;
    }
}

export default withStyles(styles)(Adapters);