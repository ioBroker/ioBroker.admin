import React from 'react';

import { withStyles } from '@material-ui/core/styles';
//import { MdContactPhone } from 'react-icons/md';

import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import AddIcon from '@material-ui/icons/Add';
import AddToPhotosIcon from '@material-ui/icons/AddToPhotos';
import BuildIcon from '@material-ui/icons/Build';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpIcon from '@material-ui/icons/Help';
import PublishIcon from '@material-ui/icons/Publish';
import RefreshIcon from '@material-ui/icons/Refresh';

import { FaGithub as GithubIcon } from 'react-icons/fa';

import { blue } from '@material-ui/core/colors';
import { green } from '@material-ui/core/colors';

import AddInstance from '../dialogs/AddInstance';

const styles = theme => ({
    root: {
        marginTop: 0,
        marginBottom: theme.spacing(2),
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
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
    installed: {
        width: 120
    },
    available: {
        width: 100
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
            addInstanceHost: props.currentHostName
        };

        this.t = props.t;
    }

    componentDidMount() {
        if (this.props.ready) {
            this.getAdaptersInfo(true);
        }
    }

    componentDidUpdate() {
        if (!this.state.init && this.props.ready) {
            this.getAdaptersInfo(true);
        }
    }

    async getAdaptersInfo(update, updateRepo = false) {
        if (!this.props.currentHost) {
            return;
        }

        if (update) {
            // Do not update too often
            if (new Date().getTime() - this.state.lastUpdate > 1000) {

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
                                    expanded: false,
                                    count: 1,
                                    installed: installedInGroup ? 1 : 0
                                };
                            } else {
                                categories[type].count++;
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
                        init: true
                    });
                } catch(error) {
                    console.error(error);
                }
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

                const cancel = false;

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

    closeAddInstanceDialog() {
        this.setState({
            addInstanceDialog: false
        });
    }

    toggleCategory(category) {

        const categories = this.state.categories;
        categories[category].expanded = !categories[category].expanded;

        this.setState({
            categories
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

    getRows() {
        const rows = [];
        const { classes } = this.props;

        Object.keys(this.state.categories).forEach(value => {

            const category = this.state.categories[value];
            const categoryName = category.name;

            rows.push(
                <TableRow
                    key={ categoryName }
                    className={ classes.category }
                >
                    <TableCell>
                        <Grid container spacing={ 1 } alignItems="center" className={ classes.name }>
                            <Grid item>
                                <IconButton
                                    size="small"
                                    onClick={ () => this.toggleCategory(value) }
                                >
                                    { category.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                </IconButton>
                            </Grid>
                            <Grid item>
                                { category.translation }
                            </Grid>
                        </Grid>
                    </TableCell>
                    <TableCell>
                        <Typography component="span" variant="body2" className={ classes.green }>
                            { category.installed }
                        </Typography>
                        { ` ${this.t('of')} ` }
                        <Typography component="span" variant="body2" className={ classes.blue }>
                            { category.count }
                        </Typography>
                        { ` ${this.t('Adapters from this Group installed')}` }
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                </TableRow>
            );

            if (category.expanded) {
            
                Object.keys(this.state.repository).forEach(value => {

                    const adapter = this.state.repository[value];  

                    if (!adapter.controller && adapter.type === categoryName) {

                        const installed = this.state.installed[value];

                        const title = (adapter.title.toString() || '').replace('ioBroker Visualisation - ', '');
                        const desc = adapter.desc ? adapter.desc[this.props.lang] || adapter.desc['en'] : '';
                        const image = installed ? installed.localIcon : adapter.extIcon;

                        if (title instanceof Object || !desc) {
                            console.log(adapter);
                        }

                        rows.push(
                            <TableRow
                                key={ value }
                                hover
                            >
                                <TableCell>
                                    <Grid container spacing={ 1 } alignItems="center" className={ classes.name }>
                                        <Grid item>
                                            <Avatar
                                                variant="square"
                                                alt={ title.toString() }
                                                src={ image }
                                                className={ classes.smallAvatar }
                                            />
                                        </Grid>
                                        <Grid item>
                                            { title.toString() }
                                        </Grid>
                                    </Grid>
                                </TableCell>
                                <TableCell>
                                    { desc }
                                </TableCell>
                                <TableCell>
                                    { adapter.keywords && adapter.keywords.join(' ') }
                                </TableCell>
                                <TableCell>
                                    { installed &&
                                        installed.version +
                                        (installed.count ? ` (${installed.count}${installed.count !== installed.enabled ? '~' : ''})` : '')
                                    }
                                </TableCell>
                                <TableCell>
                                    { adapter.version }
                                </TableCell>
                                <TableCell>
                                    { adapter.license }
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={ () => this.addInstance(value) }
                                    >
                                        <AddIcon />
                                    </IconButton>
                                    <IconButton size="small">
                                        <HelpIcon />
                                    </IconButton>
                                    { this.props.expertMode &&
                                        <IconButton
                                            size="small"
                                            className={ !installed ? classes.hidden : '' }
                                            onClick={ () => this.upload(value) }
                                        >
                                            <PublishIcon />
                                        </IconButton>
                                    }
                                    <IconButton size="small" className={ !installed ? classes.hidden : '' }>
                                        <DeleteForeverIcon />
                                    </IconButton>
                                    { this.props.expertMode &&
                                        <IconButton size="small" className={ !installed ? classes.hidden : '' }>
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    }
                                    { this.props.expertMode &&
                                        <IconButton
                                            size="small"
                                            className={ !installed ? classes.hidden : '' }
                                            onClick={ () => this.rebuild(value) }
                                        >
                                            <BuildIcon />
                                        </IconButton>
                                    }
                                </TableCell>
                            </TableRow>
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

        const { classes } = this.props;

        return (
            <Paper className={ classes.root }>
                <Grid
                    container
                    direction="column"
                    className={ classes.flexContainer }
                >
                    <Grid
                        item
                        container
                        alignItems="center"
                    >
                        <IconButton
                            onClick={ () => this.getAdaptersInfo(true, true) }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton>
                            <GithubIcon />
                        </IconButton>
                        <div className={ classes.grow } />
                        <TextField label={ this.t('Filter') } />
                        <div className={ classes.grow } />
                    </Grid>
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
                </Grid>
                { this.state.addInstanceDialog &&
                    <AddInstance
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
            </Paper>
        );
    }
}

export default withStyles(styles)(Adapters);