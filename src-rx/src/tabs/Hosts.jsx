import React, { Component } from 'react';
import PropTypes from 'prop-types';
import semver from 'semver';
import clsx from 'clsx';

import { withStyles } from '@mui/styles';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { InputAdornment, LinearProgress, TextField } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

import withWidth from '@iobroker/adapter-react-v5/Components/withWidth';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';
import HostCard from '../components/Hosts/HostCard';
import HostRow from '../components/Hosts/HostRow';
import HostEdit from '../components/Hosts/HostEdit';
import { jsControllerDialogFunc } from '../dialogs/JsControllerDialog';
import Utils from '../Utils';
import BaseSettingsDialog from '../dialogs/BaseSettingsDialog';
import SlowConnectionWarningDialog from '../dialogs/SlowConnectionWarningDialog';
import AdapterUpdateDialog from '../dialogs/AdapterUpdateDialog';

const styles = theme => ({
    grow: {
        flexGrow: 1
    },
    cards: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    },
    tabHeaderWrapper: {
        height: 30,
        display: 'flex',
        margin: 7,
    },
    tabHeaderFirstItem: {
        width: 312,
        paddingLeft: 30,
        fontSize: 14,
        fontWeight: 600,
        alignSelf: 'center',
    },
    tabHeaderItem: {
        flex: 1,
        fontSize: 14,
        fontWeight: 600,
        alignSelf: 'center'
    },
    tabHeaderItemButton: {
        width: 144,
        fontSize: 14,
        fontWeight: 600,
        alignSelf: 'center'
    },
    widthButtons: {
        width: 240,
    },
    tabFlex: {
        display: 'flex',
        flex: 1,
        padding: '0 10px'
    },
    bold: {
        fontWeight: 'bold'
    },
    wrapperInfo: {
        display: 'flex',
        flexFlow: 'wrap',
        width: '100%'
    },
    marginRight: {
        marginRight: 'auto'
    },
    wrapperBlockItem: {
        display: 'flex',
        flexFlow: 'nowrap',
        whiteSpace: 'nowrap',
        margin: 10,
    },
    ul: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 16,
        paddingRight: 8
    },
    nowrap: {
        display: 'flex',
        flexFlow: 'nowrap',
        flex: 1,
        whiteSpace: 'nowrap',
        marginRight: 5
    },
    '@media screen and (max-width: 1100px)': {
        hidden1100: {
            display: 'none !important'
        },
    },
    '@media screen and (max-width: 800px)': {
        hidden800: {
            display: 'none !important'
        },
    },
    '@media screen and (max-width: 600px)': {
        hidden600: {
            display: 'none !important'
        },
    },
});

let wordCache = {};

const formatInfo = {
    'Uptime': Utils.formatSeconds,
    'System uptime': Utils.formatSeconds,
    'RAM': Utils.formatRam,
    'Speed': Utils.formatSpeed,
    'Disk size': Utils.formatBytes,
    'Disk free': Utils.formatBytes
};

const getHostDescriptionAll = (id, t, classes, hostsData) => {
    const hostData = hostsData ? hostsData[id] : null;
    if (!hostData) {
        return [<Skeleton />];
    }

    if (typeof hostData === 'string') {
        return hostData;
    }

    return [
        <ul className={classes.ul}>
            {
                hostData && typeof hostData === 'object' ? Object.keys(hostData).map(value =>
                    <li key={value}>
                        <span className={classes.black}>
                            <span className={classes.bold}>{t(value)}: </span>
                            {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                        </span>
                    </li>) : <Skeleton />
            }
        </ul>,
        <div className={classes.wrapperInfo}>
            <div className={classes.marginRight}>
                {hostData && typeof hostData === 'object' ? Object.keys(hostData).map((value, idx) => idx < 5 &&
                    <div className={classes.wrapperBlockItem} key={value}>
                        <span className={clsx(classes.bold, classes.nowrap)}>{t(value)}: </span>
                        {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                    </div>) : <Skeleton />}
            </div>
            <div className={classes.marginRight}>
                {hostData && typeof hostData === 'object' ? Object.keys(hostData).map((value, idx) => idx > 4 && idx < 10 &&
                    <div className={classes.wrapperBlockItem} key={value}>
                        <span className={clsx(classes.bold, classes.nowrap)}>{t(value)}: </span>
                        {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                    </div>) : <Skeleton />}
            </div>
            <div className={classes.marginRight}>
                {hostData && typeof hostData === 'object' && Object.keys(hostData).map((value, idx) => idx > 10 &&
                    <div
                        className={classes.wrapperBlockItem} key={value}>
                        {hostData && typeof hostData === 'object' ?
                            <>
                                <span className={clsx(classes.bold, classes.nowrap)}>{t(value)}: </span>
                                {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                            </>
                            :
                            <Skeleton />
                        }
                    </div>)}
            </div>
        </div>
    ];
}

const getLogLevelIcon = level => {
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
};

// every tab should get their data itself from server
class Hosts extends Component {
    constructor(props) {
        super(props);

        this.state = {
            viewMode: (window._localStorage || window.localStorage).getItem('Hosts.viewMode') === 'true',
            alive: {},
            hosts: [],
            repository: {},
            hostsData: {},
            filterText: (window._localStorage || window.localStorage).getItem('Hosts.filterText') || '',
            showSlowConnectionWarning: false,
            readTimeoutMs: SlowConnectionWarningDialog.getReadTimeoutMs(),
            hostUpdate: false,
            hostUpdateDialog: null,
            editDialog: { index: 0, dialogName: '' },
            baseSettingsDialog: { index: 0, dialogName: '' },
        };
    }
    // cache translations
    t = (word, arg1) => {
        if (arg1 !== undefined && !wordCache[`${word} ${arg1}`]) {
            wordCache[`${word} ${arg1}`] = this.props.t(word, arg1);
        } else if (!wordCache[word]) {
            wordCache[word] = this.props.t(word);
        }
        return arg1 !== undefined ? wordCache[`${word} ${arg1}`] : wordCache[word];
    };


    componentDidMount() {
        this.readInfo()
            .then(() => {
                this.props.hostsWorker.registerHandler(this.updateHosts);
                this.props.hostsWorker.registerAliveHandler(this.updateHostsAlive);
            });
    }

    componentWillUnmount() {
        this.props.hostsWorker.unregisterHandler(this.updateHosts);
        this.props.hostsWorker.unregisterAliveHandler(this.updateHostsAlive);
    }

    getHostsData = (hosts, _alive) => {
        const promises = hosts.map(obj => {
            if (_alive[obj._id]) {
                return this.props.socket.getHostInfo(obj._id, null, this.state.readTimeoutMs)
                    .catch(error => {
                        console.error('Cannot get getHostInfo:' + error);
                        error.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                        return error;
                    })
                    .then(data =>
                        ({ id: obj._id, data }));
            } else {
                return { id: obj._id, data: 'offline' };
            }
        });

        return new Promise(resolve =>
            Promise.all(promises)
                .then(results => {
                    const _hostsData = {};
                    results.forEach(res => _hostsData[res.id] = res.data);
                    resolve(_hostsData);
                }));
    };

    readInfo = () => {
        return this.props.socket.getHosts(true, false, this.state.readTimeoutMs)
            .then(hosts => this.props.socket.getRepository(this.props.currentHost, { update: false }, false, this.state.readTimeoutMs)
                .then(async repository => {
                    const alive = JSON.parse(JSON.stringify(this.state.alive));

                    for (let h = 0; h < hosts.length; h++) {
                        let aliveValue = await this.props.socket.getState(`${hosts[h]._id}.alive`);
                        alive[hosts[h]._id] = !aliveValue ? false : !!aliveValue.val;
                    }

                    const hostsData = await this.getHostsData(hosts, alive);
                    const newState = { alive, hosts, hostsData, repository };
                    if (this.state.filterText && hosts.length <= 2) {
                        newState.filterText = '';
                    }
                    this.setState(newState);
                })
                .catch(e => {
                    window.alert('Cannot getRepository: ' + e);
                    e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                }));
    };

    updateHosts = (hostId, obj) => {
        const hosts = JSON.parse(JSON.stringify(this.state.hosts));
        const alive = JSON.parse(JSON.stringify(this.state.alive));

        if (!Array.isArray(hostId)) {
            hostId = { id: hostId, obj, type: obj ? 'changed' : 'delete' };
        }

        Promise.all(hostId.map(async event => {
            const elementFind = hosts.find(host => host._id === event.id);
            if (elementFind) {
                const index = hosts.indexOf(elementFind);
                if (event.obj) {
                    // updated
                    hosts[index] = event.obj;
                } else {
                    // deleted
                    hosts.splice(index, 1);
                }
            } else {
                const state = await this.props.socket.getState(event.id + '.alive');
                alive[event.id] = state ? state.val : false;
                // new
                hosts.push(event.obj);
            }
        }))
            .then(() => {
                const newState = { hosts, alive };

                if (this.state.filterText && hosts.length <= 2) {
                    newState.filterText = '';
                }

                this.setState(newState);
            });
    };

    updateHostsAlive = events => {
        let alive = JSON.parse(JSON.stringify(this.state.alive));
        let changed = false;

        events.forEach(event => {
            if (event.type === 'delete') {
                if (alive[event.id] !== undefined) {
                    delete alive[event.id];
                    changed = true;
                }
            } else if ((!!alive[event.id]) !== (!!event.alive)) {
                alive[event.id] = event.alive;
                changed = true;
            }
        });

        changed && this.setState({ alive });
    };

    getPanels() {
        const items = this.renderHosts()
            .filter(el => this.state.filterText ? el.name.toLowerCase().includes(this.state.filterText.toLowerCase()) : true)
            .map(el => this.state.viewMode ? el.renderCard : el.renderRow);

        return items.length ? items : this.t('All items are filtered out');
    }

    baseSettingsSettingsDialog() {
        if (!this.state.baseSettingsDialog.dialogName) {
            return null;
        }

        return <BaseSettingsDialog
            currentHost={this.state.baseSettingsDialog.dialogName}
            hosts={this.state.hosts}
            themeName={this.props.themeName}
            currentHostName={this.state.baseSettingsDialog.dialogName}
            key="base"
            onClose={() => this.setState({baseSettingsDialog: {
                index: 0,
                dialogName: ''
            }})}
            lang={this.props.lang}
            // showAlert={(message, type) => this.showAlert(message, type)}
            socket={this.props.socket}
            // currentTab={currentTab}
            t={this.t}
        />
    }

    renderEditObjectDialog = () => {
        if (!this.state.editDialog.dialogName) {
            return null;
        }

        return <HostEdit
            obj={this.state.hosts[this.state.editDialog.index]}
            socket={this.props.socket}
            dialogName={this.state.editDialog.dialogName}
            t={this.t}
            expertMode={this.props.expertMode}
            onClose={obj => {
                this.setState({ editDialog: {
                    index: 0,
                    dialogName: ''
                }});
                if (obj) {
                    this.props.socket.setObject(obj._id, obj)
                        .then(_ => this.forceUpdate())
                        .catch(e => alert('Cannot write object: ' + e));
                }
            }}
        />;
    };

    renderSlowConnectionWarning = () => {
        if (!this.state.showSlowConnectionWarning) {
            return null;
        } else {
            return <SlowConnectionWarningDialog
                readTimeoutMs={this.state.readTimeoutMs}
                t={this.t}
                onClose={async readTimeoutMs => {
                    this.setState({ showSlowConnectionWarning: false });
                    if (readTimeoutMs) {
                        this.setState({ readTimeoutMs });
                        await this.readInfo();
                    }
                }}
            />;
        }
    };

    closeHostUpdateDialog = cb => {
        this.setState({ hostUpdateDialog: false, hostUpdate: null}, cb);
    };

    openHostUpdateDialog = (hostName, cb) => {
        this.setState({ hostUpdateDialog: true, hostUpdate: hostName}, cb);
    };

    getNews = (value, all = false) => {
        const adapter = this.state.repository['js-controller'];
        const installed = this.state.hosts.find(el => el.common.name === this.state.hostUpdate).common.installedVersion;
        const news = [];

        if (installed && adapter && adapter.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed) || all) {
                        news.push({
                            version,
                            news: this.props.noTranslation ? adapter.news[version].en : adapter.news[version][this.props.lang] || adapter.news[version].en,
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed}"`);
                }
            });
        }

        return news;
    };

    hostUpdateDialogCb = () => {
        if (!this.state.hostUpdateDialog) {
            return null;
        } else {
            return <AdapterUpdateDialog
                open={true}
                adapter={this.state.hostUpdate}
                adapterObject={this.state.repository['js-controller']}
                t={this.t}
                textUpdate={this.t('Show instructions')}
                rightDependencies
                news={this.getNews()}
                toggleTranslation={this.props.toggleTranslation}
                noTranslation={this.props.noTranslation}
                onUpdate={() =>
                    this.closeHostUpdateDialog(() =>
                        jsControllerDialogFunc(this.props.socket, this.state.hostUpdate, this.props.theme))}
                onClose={() => this.closeHostUpdateDialog()}
            />;
        }
    };

    renderHosts() {
        return this.state.hosts.map(({
            _id,
            common: { name, icon, color, title, installedVersion },
            native: { os: { platform } },
        }, idx) => ({
            renderCard: this.state.viewMode ? <HostCard
                systemConfig={this.props.systemConfig}
                key={_id}
                setEditDialog={() => this.setState({ editDialog: { index: idx, dialogName: name } })}
                setBaseSettingsDialog={() =>  this.setState({ baseSettingsDialog: { index: idx, dialogName: name }})}
                hostsWorker={this.props.hostsWorker}
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                name={name}
                getLogLevelIcon={getLogLevelIcon}
                alive={this.state.alive[_id]}
                color={color}
                image={icon}
                title={title}
                os={platform}
                openHostUpdateDialog={() => this.openHostUpdateDialog(name)}
                description={getHostDescriptionAll(_id, this.t, this.props.classes, this.state.hostsData)[0]}
                hostData={this.state.hostsData[_id]}
                formatInfo={formatInfo}
                available={this.state.repository['js-controller']?.version || '-'}
                executeCommandRemove={() => this.props.executeCommand(`host remove ${name}`)}
                dialogUpgrade={() => jsControllerDialogFunc(this.props.socket, _id, this.props.theme)}
                currentHost={this.props.currentHost === _id}
                installed={installedVersion}
                events={'- / -'}
                t={this.t}
                _id={_id}
                showAdaptersWarning={this.props.showAdaptersWarning}
            /> : null,
            renderRow: !this.state.viewMode ? <HostRow
                systemConfig={this.props.systemConfig}
                key={_id}
                setEditDialog={() => this.setState({ editDialog: { index: idx, dialogName: name } })}
                setBaseSettingsDialog={() =>  this.setState({ baseSettingsDialog: { index: idx, dialogName: name }})}
                hostsWorker={this.props.hostsWorker}
                expertMode={this.props.expertMode}
                socket={this.props.socket}
                name={name}
                alive={this.state.alive[_id]}
                color={color}
                image={icon}
                title={title}
                os={platform}
                getLogLevelIcon={getLogLevelIcon}
                openHostUpdateDialog={() => this.openHostUpdateDialog(name)}
                executeCommandRemove={() => this.props.executeCommand(`host remove ${name}`)}
                dialogUpgrade={() => jsControllerDialogFunc(this.props.socket, _id, this.props.theme)}
                currentHost={this.props.currentHost === _id}
                description={getHostDescriptionAll(_id, this.t, this.props.classes, this.state.hostsData)[1]}
                hostData={this.state.hostsData[_id]}
                formatInfo={formatInfo}
                available={this.state.repository['js-controller']?.version || '-'}
                installed={installedVersion}
                events={'- / -'}
                t={this.t}
                _id={_id}
                showAdaptersWarning={this.props.showAdaptersWarning}
            /> : null,
            name
        }));
    }

    render() {
        const {
            classes,
            expertMode,
        } = this.props;

        if (!this.state.hosts.length) {
            return <LinearProgress />;
        }

        return <TabContainer>
            {this.renderEditObjectDialog()}
            {this.baseSettingsSettingsDialog()}
            {this.renderSlowConnectionWarning()}
            {this.hostUpdateDialogCb()}
            <TabHeader>
                <Tooltip title={this.t('Show / hide List')}>
                    <IconButton size="large" onClick={() => {
                        (window._localStorage || window.localStorage).setItem('Hosts.viewMode', this.state.viewMode ? 'false' : 'true');
                        this.setState({viewMode: !this.state.viewMode});
                    }}>
                        {this.state.viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={this.t('Reload')}>
                    <IconButton size="large" onClick={() => this.forceUpdate()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <div className={classes.grow} />
                {this.state.hosts.length > 2 ? <TextField
                    variant="standard"
                    label={this.t('Filter')}
                    style={{ margin: '5px 0' }}
                    value={this.state.filterText}
                    onChange={event => {
                        (window._localStorage || window.localStorage).setItem('Hosts.viewMode', event.target.value);
                        this.setState({filterText: event.target.value});
                    }}
                    InputProps={{
                        endAdornment: (
                            this.state.filterText ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        (window._localStorage || window.localStorage).setItem('Hosts.viewMode', '');
                                        this.setState({filterText: ''})
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment> : null
                        ),
                    }}
                /> : null}
                <div className={classes.grow} />
            </TabHeader>
            <TabContent overflow="auto">
                <div className={this.state.viewMode ? classes.cards : ''}>
                    {!this.state.viewMode &&
                        <div className={classes.tabHeaderWrapper}>
                            <div className={classes.tabHeaderFirstItem}>
                                {this.t('Name:')}
                            </div>
                            <div className={classes.tabFlex}>
                                {/*<div className={clsx(classes.tabHeaderItem, classes.hidden600)}>{t('Title:')}</div>*/}
                                <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>CPU</div>
                                <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>RAM</div>
                                <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>{this.t('Uptime')}</div>
                                <div className={clsx(classes.tabHeaderItem, classes.hidden1100)}>{this.t('Available')}</div>
                                <div className={clsx(classes.tabHeaderItem, classes.hidden1100)}>{this.t('Installed')}</div>
                                <div className={clsx(classes.tabHeaderItem, classes.hidden600)}>{this.t('Events')}</div>
                                <div className={clsx(classes.tabHeaderItemButton, expertMode && classes.widthButtons)} />
                            </div>
                        </div>}
                    {this.getPanels()}
                </div>
            </TabContent>
        </TabContainer>;
    }
}

Hosts.propTypes = {
    t: PropTypes.func,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
    systemConfig: PropTypes.object,
    executeCommand: PropTypes.func,
    hostsWorker: PropTypes.object,
    showAdaptersWarning: PropTypes.func,
    theme: PropTypes.object,
    noTranslation: PropTypes.bool,
    toggleTranslation: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Hosts));