import React from 'react';

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
    Typography
} from '@material-ui/core';

import CloudOffIcon from '@material-ui/icons/CloudOff';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import RefreshIcon from '@material-ui/icons/Refresh';

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
    install:{
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
    }
});

class Adapters extends React.Component {

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
            search: ''
        };

        this.rebuildSupported = false;

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

        const newState = {
            dialog: location.dialog,
            dialogProp: location.id
        };

        return newState;
    }

    async getAdaptersInfo(updateRepo = false) {
        if (!this.props.currentHost) {
            return;
        }

        // Do not update too often
        if (new Date().getTime() - this.state.lastUpdate > 1000) {

            this.setState({
                update: true
            });

            const currentHost = this.props.currentHost;

            try {
                const hostDataProm = this.props.socket.getHostInfo(currentHost);
                const repositoryProm = this.props.socket.getRepository(currentHost, {repo: this.props.systemConfig.common.activeRepo, update: updateRepo}, updateRepo);
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

                this.setState({
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
            } catch(error) {
                console.error(error);
            }
        }
    }

    addInstance(adapter, instance) {

        if (!instance && this.props.expertMode) {
            this.setState({
                addInstanceDialog: true,
                addInstanceAdapter: adapter,
                addInstanceHost: this.props.currentHostName
            });
        } else {

            if (instance) {

                let cancel = false;

                for(let i = 0; i < this.state.instances.length; i++) {

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

            this.props.executeCommand(`add ${adapter} ${instance ? instance + ' ' : ''}--host ${this.props.currentHostName}`);
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
        } catch(e) {
            console.warn('Cannot compare "' + newVersion + '" and "' + oldVersion  + '"');
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
                    entry.rightVersion = installed ? checkVersion ? Semver.satisfies(installed.version, entry.version): true : false;
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

                            result = installed ? (checkVersion ? Semver.satisfies(installed.version, dependency[name]) : true) : false;
                        }
                    });
                } else if (typeof dependencies === 'object') {
                    Object.keys(dependencies).forEach(dependency => {
                        if (dependency && dependencies[dependency] !== undefined && result) {
                            const installed = this.state.installed[dependency];
                            const checkVersion = typeof dependencies[dependency] !== 'string';
                            result = installed ? (checkVersion ? Semver.satisfies(installed.version, dependency[dependency]) : true) : false;
                        }
                    });
                } else {
                    console.error(`Invalid dependencies for ${value}: ${JSON.stringify(dependencies)}`)
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

        clearTimeout(this.typingTimer);

        if (event.type === 'keyup') {

            const value = event.target.value;

            this.typingTimer = setTimeout(this.setState({ search: value }), 300);
        }
    }

    toogleConnectionTypeFilter() {
        this.setState(oldState => ({
            filterConnectionType: !oldState.filterConnectionType
        }));
    }

    expandAll() {
        this.setState(oldState => {

            const categories = oldState.categories;
            const categoriesExpanded = oldState.categoriesExpanded;

            categories.forEach(category => {
                categoriesExpanded[category.name] = true;
            });

            window.localStorage.setItem('Adapters.expandedCategories', JSON.stringify(categoriesExpanded));

            return { categoriesExpanded };
        });
    }

    collapseAll() {

        const categoriesExpanded = {};

        window.localStorage.setItem('Adapters.expandedCategories', JSON.stringify(categoriesExpanded));

        this.setState({ categoriesExpanded });
    }

    getRows() {

        let rows = [];
        const search = (this.state.search || '').toLowerCase().trim();

        this.state.categories.forEach(category => {

            const categoryName = category.name;
            const expanded = this.state.categoriesExpanded[categoryName];
            const adapters = [];
            let showCategory = false;

            category.adapters.forEach(value => {

                const adapter = this.state.repository[value];

                if (!adapter.controller) {

                    const installed = this.state.installed[value];

                    const title = ((adapter.title || '').toString() || '').replace('ioBroker Visualisation - ', '');
                    const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] || adapter.desc : '';
                    const image = installed ? installed.localIcon : adapter.extIcon;
                    const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                    const updateAvailable = installed ? this.updateAvailable(installed.version, adapter.version) : false;
                    const rightDependencies = this.rightDependencies(value);
                    const rightOs = this.rightOs(value);
                    const sentry = !!(adapter.plugins && adapter.plugins.sentry);

                    let show = !search;

                    if (search) {
                        if (title && title.toLowerCase().includes(search)) {
                            show = true;
                        } else if(desc && desc.toLowerCase().includes(search)) {
                            show = true;
                        } else {
                            adapter.keywords && adapter.keywords.forEach(value => {
                                if(value.toLowerCase().includes(search)) {
                                    show = true;
                                }
                            });
                        }
                    }

                    if (show && this.state.filterConnectionType) {
                        show = connectionType === 'local';
                    }

                    if (show) {
                        showCategory = true;
                    }

                    if (title instanceof Object || !desc) {
                        console.warn(adapter);
                    }

                    if(expanded) {
                        adapters.push(
                            <AdapterRow
                                key={ 'adapter-' + value }
                                connectionType={ connectionType }
                                description={ desc }
                                enabledCount={ installed && installed.enabled }
                                expertMode={ this.props.expertMode }
                                image={ image }
                                installedCount={ installed && installed.count }
                                installedFrom={ installed && installed.installedFrom }
                                installedVersion={ installed && installed.version }
                                keywords={ adapter.keywords }
                                name={ title }
                                license={ adapter.license }
                                onAddInstance={ () => this.addInstance(value) }
                                onDeletion={ () => this.openAdapterDeletionDialog(value) }
                                onInfo={ () => this.openInfoDialog(value) }
                                onRebuild={ () => this.rebuild(value) }
                                onUpdate={ () => this.openUpdateDialog(value) }
                                onUpload={ () => this.upload(value) }
                                updateAvailable={ updateAvailable }
                                version={ adapter.version }
                                hidden={ !show }
                                rightDependencies={ rightDependencies }
                                rightOs={ rightOs }
                                sentry={ sentry }
                                rebuild={ this.rebuildSupported }
                            />
                        );
                    }
                }
            });

            rows.push(
                <AdapterRow
                    key={ 'category-' + categoryName }
                    category
                    count={ category.count }
                    expanded={ expanded }
                    installedCount={ category.installed }
                    name={ category.translation }
                    onToggle={ () => this.toggleCategory(categoryName) }
                    t={ this.t }
                    hidden={ !showCategory }
                />
            );

            rows = [...rows, ...adapters];
        });

        return rows;
    }

    render() {

        if (!this.state.init) {
            return <LinearProgress />
        }

        if (this.state.dialog === 'readme' && this.state.dialogProp) {

            const adapter = this.state.repository[this.state.dialogProp] || null;

            if (adapter) {
                return (
                    <TabContainer>
                        <AdapterInfoDialog
                            link={ adapter.readme || '' }
                            t={ this.t }
                        />
                    </TabContainer>
                );
            }
        }

        const { classes } = this.props;

        return (
            <TabContainer>
                { this.state.update &&
                    <Grid item>
                        <LinearProgress />
                    </Grid>
                }
                <TabHeader>
                    <IconButton
                        onClick={ () => this.getAdaptersInfo(true) }
                    >
                        <RefreshIcon />
                    </IconButton>
                    <Tooltip title={ this.t('expand all')}>
                        <IconButton
                            onClick={ () => this.expandAll() }
                        >
                            <FolderOpenIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={ this.t('collapse all')}>
                        <IconButton
                            onClick={ () => this.collapseAll() }
                        >
                            <FolderIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={ this.t('Filter local connection type')}>
                        <IconButton
                            onClick={ () => this.toogleConnectionTypeFilter() }
                        >
                            <CloudOffIcon color={ this.state.filterConnectionType ? 'primary' : 'inherit' } />
                        </IconButton>
                    </Tooltip>
                    { this.props.expertMode &&
                        <IconButton>
                            <GithubIcon />
                        </IconButton>
                    }
                    <div className={ classes.grow } />
                    <TextField
                        label={ this.t('Filter') }
                        onKeyDown={ event => this.handleFilterChange(event) }
                        onKeyUp={ event => this.handleFilterChange(event) }
                    />
                    <div className={ classes.grow } />
                </TabHeader>
                <TabContent>
                    <TableContainer className={ classes.container }>
                        <Table stickyHeader size="small" className={ classes.table }>
                            <TableHead>
                                <TableRow>
                                    <TableCell className={ classes.name }>
                                        <Typography>{ this.t('Name') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.description }>
                                        <Typography>{ this.t('Description') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.keywords }>
                                        <Typography>{ this.t('Keywords') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.connectionType } />
                                    <TableCell className={ classes.installed }>
                                        <Typography>{ this.t('Installed') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.available }>
                                        <Typography>{ this.t('Available') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.license }>
                                        <Typography>{ this.t('License') }</Typography>
                                    </TableCell>
                                    <TableCell className={ classes.install }>
                                        <Typography>{ this.t('Install') }</Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { this.getRows() }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabContent>
                { this.state.addInstanceDialog &&
                    <AddInstanceDialog
                        open={ this.state.addInstanceDialog }
                        adapter={ this.state.addInstanceAdapter }
                        hosts={ this.props.hosts }
                        instances={ this.state.instances }
                        currentHost={ this.state.addInstanceHost }
                        currentInstance={ this.state.addInstanceId }
                        t={ this.t }
                        onClick={ () => this.addInstance(this.state.addInstanceAdapter, this.state.addInstanceId) }
                        onClose={ () => this.closeAddInstanceDialog() }
                        onHostChange={ event => this.handleHostsChange(event) }
                        onInstanceChange={ event => this.handleInstanceChange(event) }
                    />
                }
                { this.state.adapterDeletionDialog &&
                    <AdapterDeletionDialog
                        open={ this.state.adapterDeletionDialog }
                        adapter={ this.state.adapterDeletionAdapter }
                        t={ this.t }
                        onClick={ () => this.delete(this.state.adapterDeletionAdapter) }
                        onClose={ () => this.closeAdapterDeletionDialog() }
                    />
                }
                { this.state.adapterUpdateDialog &&
                    <AdapterUpdateDialog
                        open={ this.state.adapterUpdateDialog }
                        adapter={ this.state.adapterUpdateAdapter }
                        t={ this.t }
                        dependencies={ this.getDependencies(this.state.adapterUpdateAdapter) }
                        rightDependencies={ this.rightDependencies(this.state.adapterUpdateAdapter) }
                        news={ this.getNews(this.state.adapterUpdateAdapter) }
                        onClick={ () => this.update(this.state.adapterUpdateAdapter) }
                        onClose={ () => this.closeAdapterUpdateDialog() }
                    />
                }
            </TabContainer>
        );
    }
}

export default withStyles(styles)(Adapters);