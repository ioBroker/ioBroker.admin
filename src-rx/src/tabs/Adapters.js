import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import RefreshIcon from '@material-ui/icons/Refresh';

import { FaGithub as GithubIcon } from 'react-icons/fa';

import { blue } from '@material-ui/core/colors';
import { green } from '@material-ui/core/colors';

import AddInstanceDialog from '../dialogs/AddInstanceDialog';
import AdapterDeletionDialog from '../dialogs/AdapterDeletionDialog';

import AdapterRow from '../components/AdapterRow';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';
import AdapterInfoDialog from '../dialogs/AdapterInfoDialog';

import Router from '@iobroker/adapter-react/Components/Router';

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
            dialogProp: null
        };

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
                const hostData = await this.props.socket.getHostInfo(currentHost);
                const nodeJsVersion = hostData['Node.js'].replace('v', '');
                const hostOs = hostData.os;
    
                const repository = await this.props.socket.getRepository(currentHost, {repo: this.props.systemConfig.common.activeRepo, update: updateRepo});
                const installed = await this.props.socket.getInstalled(currentHost);
                const instances = await this.props.socket.getAdapterInstances();
                const categories = {};
                const categoriesSorted = [];
                const categoriesExpanded = JSON.parse(window.localStorage.getItem('Adapters.expandedCategories')) || {};

                Object.keys(installed).forEach(value => {
                    
                    const adapter = installed[value];

                    if (!adapter.controller && value !== 'hosts') {
                        if (!repository[value]) {
                            repository[value] = adapter;
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

                    if (installed[name]) {
                        if (installed[name].count) {
                            installed[name].count++;
                        } else {
                            installed[name].count = 1;
                        }

                        if (enabled) {
                            if (installed[name].enabled) {
                                installed[name].enabled++;
                            } else {
                                installed[name].enabled = 1;
                            }
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

        newVersion = newVersion.split('.');
        oldVersion = oldVersion.split('.');

        newVersion[0] = parseInt(newVersion[0], 10);
        oldVersion[0] = parseInt(oldVersion[0], 10);

        if (newVersion[0] > oldVersion[0]) {
            return true;
        } else if (newVersion[0] === oldVersion[0]) {

            newVersion[1] = parseInt(newVersion[1], 10);
            oldVersion[1] = parseInt(oldVersion[1], 10);

            if (newVersion[1] > oldVersion[1]) {
                return true;
            } else if (newVersion[1] === oldVersion[1]) {

                newVersion[2] = parseInt(newVersion[2], 10);
                oldVersion[2] = parseInt(oldVersion[2], 10);

                return (newVersion[2] > oldVersion[2]);
            }
        }

        return false;
    }

    openInfoDialog(adapter) {
        Router.doNavigate('tab-adapters', 'readme', adapter);
    } 

    getRows() {

        const rows = [];

        this.state.categories.forEach(category => {

            const categoryName = category.name;
            const expanded = this.state.categoriesExpanded[categoryName];

            rows.push(
                <AdapterRow
                    key={ categoryName }
                    category
                    count={ category.count }
                    expanded={ expanded }
                    installedCount={ category.installed }
                    name={ category.translation }
                    onToggle={ () => this.toggleCategory(categoryName) }
                    t={ this.t }
                />
            );

            if (expanded) {
            
                category.adapters.forEach(value => {
                    console.log(value);
                    const adapter = this.state.repository[value];

                    if (!adapter.controller) {

                        const installed = this.state.installed[value];

                        const title = (adapter.title.toString() || '').replace('ioBroker Visualisation - ', '');
                        const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] : '';
                        const image = installed ? installed.localIcon : adapter.extIcon;
                        const connectionType = adapter.connectionType ? adapter.connectionType : '-';
                        const updateAvailable = installed ? this.updateAvailable(installed.version, adapter.version) : false;

                        if (title instanceof Object || !desc) {
                            console.warn(adapter);
                        }

                        rows.push(
                            <AdapterRow
                                key={ value }
                                connectionType={ connectionType }
                                description={ desc }
                                enabledCount={ installed && installed.enabled }
                                expertMode={ this.props.expertMode }
                                image={ image }
                                installedCount={ installed && installed.count }
                                installedVersion={ installed && installed.version }
                                keywords={ adapter.keywords }
                                name={ title }
                                license={ adapter.license }
                                onAddInstance={ () => this.addInstance(value) }
                                onDeletion={ () => this.openAdapterDeletionDialog(value) }
                                onInfo={ () => this.openInfoDialog(value) }
                                onRebuild={ () => this.rebuild(value) }
                                onUpload={ () => this.upload(value) }
                                updateAvailable={ updateAvailable }
                                version={ adapter.version }
                            />
                        );
                    }
                });
            }
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
                    <IconButton>
                        <GithubIcon />
                    </IconButton>
                    <div className={ classes.grow } />
                    <TextField label={ this.t('Filter') } />
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
            </TabContainer>
        );
    }
}

export default withStyles(styles)(Adapters);