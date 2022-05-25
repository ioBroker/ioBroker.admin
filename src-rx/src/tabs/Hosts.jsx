import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import semver from 'semver';
import clsx from 'clsx';

import { withStyles } from '@mui/styles';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { InputAdornment, LinearProgress, TextField } from '@mui/material';
import { Skeleton } from '@mui/lab';

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
import { useStateLocal } from '../helpers/hooks/useStateLocal';
import HostCard from '../components/Hosts/HostCard';
import HostRow from '../components/Hosts/HostRow';
import HostEdit from '../components/Hosts/HostEdit';
import { JsControllerDialogFunc } from '../dialogs/JsControllerDialog';
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
                hostData && typeof hostData === 'object' && Object.keys(hostData).map(value =>
                    <li key={value}>
                        {hostData && typeof hostData === 'object' ?
                            <span className={classes.black}>
                                <span className={classes.bold}>{t(value)}: </span>
                                {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                            </span>
                            :
                            <Skeleton />
                        }
                    </li>)
            }
        </ul>,
        <div className={classes.wrapperInfo}>
            <div className={classes.marginRight}>
                {hostData && typeof hostData === 'object' && Object.keys(hostData).map((value, idx) => idx < 5 &&
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
            <div className={classes.marginRight}>
                {hostData && typeof hostData === 'object' && Object.keys(hostData).map((value, idx) => idx > 4 && idx < 10 &&
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


const getLogLevelIcon = (level) => {
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
}
// every tab should get their data itself from server
const Hosts = ({
    classes,
    disabled,
    socket,
    currentHost,
    expertMode,
    executeCommand,
    systemConfig,
    navigate,
    themeName,
    lang,
    hostsWorker,
    showAdaptersWarning,
    ...props
}) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const t = (word, arg1) => {
        if (arg1 !== undefined && !wordCache[`${word} ${arg1}`]) {
            wordCache[`${word} ${arg1}`] = props.t(word, arg1);
        } else if (!wordCache[word]) {
            wordCache[word] = props.t(word);
        }
        return arg1 !== undefined ? wordCache[`${word} ${arg1}`] : wordCache[word];
    }

    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({});
    const [repository, setRepository] = useState({});
    const [hostsData, setHostsData] = useState({});
    const [refresh, setRefresh] = useState(false);
    const [viewMode, setViewMode] = useStateLocal(false, 'Hosts.viewMode');
    const [filterText, setFilterText] = useStateLocal('', 'Hosts.filterText');
    const [showSlowConnectionWarning, setShowSlowConnectionWarning] = useState(false);
    const [readTimeoutMs, setReadTimeoutMs] = useState(SlowConnectionWarningDialog.getReadTimeoutMs());

    const getHostsData = (hosts, _alive) => {
        const promises = hosts.map(obj => {
            if (_alive[obj._id]) {
                return socket.getHostInfo(obj._id, null, readTimeoutMs)
                    .catch(error => {
                        console.error('Cannot get getHostInfo:' + error);
                        error.toString().includes('timeout') && setShowSlowConnectionWarning(true);
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

    const updateHosts = (hostId, state) => {
        setHosts(prevHostsArray => {
            const newHosts = JSON.parse(JSON.stringify(prevHostsArray));
            if (Array.isArray(hostId)) {
                hostId.forEach(event => {
                    const elementFind = prevHostsArray.find(host => host._id === event.id);
                    if (elementFind) {
                        const index = prevHostsArray.indexOf(elementFind);
                        if (event.obj) {
                            newHosts[index] = event.obj;
                        } else {
                            newHosts.splice(index, 1);
                        }
                    } else {
                        newHosts.push(event.obj);
                    }
                });
            } else {
                const elementFind = prevHostsArray.find(({ _id }) => _id === hostId);
                if (elementFind) {
                    const index = prevHostsArray.indexOf(elementFind);
                    if (state) {
                        newHosts[index] = state;
                    } else {
                        newHosts.splice(index, 1);
                    }
                } else {
                    newHosts.push(state);
                }
            }

            filterText && newHosts.length <= 2 && setFilterText('');

            return newHosts;
        });
    }

    const readInfo = () => {
        return socket.getHosts(true, false, readTimeoutMs)
            .then(hostsArray => socket.getRepository(currentHost, { update: false }, false, readTimeoutMs)
                .then(async repositoryProm => {
                    const _alive = JSON.parse(JSON.stringify(alive));

                    for (let h = 0; h < hostsArray.length; h++) {
                        let aliveValue = await socket.getState(`${hostsArray[h]._id}.alive`);
                        _alive[hostsArray[h]._id] = !aliveValue ? false : !!aliveValue.val;
                    }

                    setAlive(_alive);

                    setRepository(repositoryProm);
                    setHosts(hostsArray);
                    filterText && hostsArray.length <= 2 && setFilterText('');
                    const hostDataObj = await getHostsData(hostsArray, _alive);
                    setHostsData(hostDataObj);

                    // simulation
                    // setTimeout(() => setShowSlowConnectionWarning(true), 5000);
                })
                .catch(e => {
                    window.alert('Cannot getRepository: ' + e);
                    e.toString().includes('timeout') && setShowSlowConnectionWarning(true);
                }));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        readInfo()
            .then(() =>
                hostsWorker.registerHandler(updateHosts));

        return () => hostsWorker.unregisterHandler(updateHosts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);

    const getAllArrayHosts = useMemo(() => hosts.map(({
        _id,
        common: { name, icon, color, title, installedVersion },
        native: { os: { platform } },
    }, idx
    ) => ({
        renderCard: viewMode ? <HostCard
            systemConfig={systemConfig}
            key={_id}
            setEditDialog={() => setEditDialog({ index: idx, dialogName: name })}
            setBaseSettingsDialog={() => setBaseSettingsDialog({ index: idx, dialogName: name })}
            hostsWorker={hostsWorker}
            expertMode={expertMode}
            socket={socket}
            name={name}
            getLogLevelIcon={getLogLevelIcon}
            alive={alive[_id]}
            color={color}
            image={icon}
            title={title}
            os={platform}
            openHostUpdateDialog={() => openHostUpdateDialog(name)}
            description={getHostDescriptionAll(_id, t, classes, hostsData)[0]}
            available={repository['js-controller']?.version || '-'}
            executeCommandRemove={() => executeCommand(`host remove ${name}`)}
            dialogUpgrade={() => JsControllerDialogFunc(socket, _id)}
            currentHost={currentHost === _id}
            installed={installedVersion}
            events={'- / -'}
            t={t}
            _id={_id}
            showAdaptersWarning={showAdaptersWarning}
        /> : null,
        renderRow: !viewMode ? <HostRow
            systemConfig={systemConfig}
            key={_id}
            setEditDialog={() => setEditDialog({
                index: idx,
                dialogName: name
            })}
            setBaseSettingsDialog={() => setBaseSettingsDialog({
                index: idx,
                dialogName: name
            })}
            hostsWorker={hostsWorker}
            expertMode={expertMode}
            socket={socket}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            title={title}
            os={platform}
            getLogLevelIcon={getLogLevelIcon}
            openHostUpdateDialog={() => openHostUpdateDialog(name)}
            executeCommandRemove={() => executeCommand(`host remove ${name}`)}
            dialogUpgrade={() => JsControllerDialogFunc(socket, _id)}
            currentHost={currentHost === _id}
            description={getHostDescriptionAll(_id, t, classes, hostsData)[1]}
            available={repository['js-controller']?.version || '-'}
            installed={installedVersion}
            events={'- / -'}
            t={t}
            _id={_id}
            showAdaptersWarning={showAdaptersWarning}
        /> : null,
        name
    })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [hosts, alive, repository, hostsData, classes, expertMode, viewMode]);

    const [editDialog, setEditDialog] = useState({ index: 0, dialogName: '' });

    const [baseSettingsDialog, setBaseSettingsDialog] = useState({ index: 0, dialogName: '' });

    const getPanels = useCallback(() => {
        const items = getAllArrayHosts.filter(el => filterText ? el.name.toLowerCase().includes(filterText.toLowerCase()) : true).map(el => viewMode ? el.renderCard : el.renderRow);
        return items.length ? items : t('All items are filtered out');
    }, [getAllArrayHosts, t, filterText, viewMode,]);

    const baseSettingsSettingsDialog = () => {
        if (!baseSettingsDialog.dialogName) {
            return null;
        }
        return <BaseSettingsDialog
            currentHost={baseSettingsDialog.dialogName}
            hosts={hosts}
            themeName={themeName}
            currentHostName={baseSettingsDialog.dialogName}
            key="base"
            onClose={() => setBaseSettingsDialog({
                index: 0,
                dialogName: ''
            })}
            lang={lang}
            // showAlert={(message, type) => this.showAlert(message, type)}
            socket={socket}
            // currentTab={currentTab}
            t={t}
        />
    };

    const renderEditObjectDialog = () => {
        if (!editDialog.dialogName) {
            return null;
        }
        return <HostEdit
            obj={hosts[editDialog.index]}
            socket={socket}
            dialogName={editDialog.dialogName}
            t={t}
            expertMode={expertMode}
            onClose={obj => {
                setEditDialog({
                    index: 0,
                    dialogName: ''
                })
                if (obj) {
                    socket.setObject(obj._id, obj)
                        .then(_ => setRefresh((el) => !el))
                        .catch(e => alert('Cannot write object: ' + e));
                }
            }}
        />
    };

    const renderSlowConnectionWarning = () => {
        if (!showSlowConnectionWarning) {
            return null;
        } else {
            return <SlowConnectionWarningDialog
                readTimeoutMs={readTimeoutMs}
                t={t}
                onClose={async _readTimeoutMs => {
                    setShowSlowConnectionWarning(false);
                    if (_readTimeoutMs) {
                        setReadTimeoutMs(_readTimeoutMs);
                        await readInfo();
                    }
                }}
            />;
        }
    }

    const [hostUpdateDialog, setHostUpdateDialog] = useState(false);
    const [hostUpdate, setHostUpdate] = useState(null);

    const closeHostUpdateDialog = (cb) => {
        setHostUpdateDialog(false);
        setHostUpdate(null);
        cb && cb();
    }

    const openHostUpdateDialog = (hostName, cb) => {
        setHostUpdateDialog(true);
        setHostUpdate(hostName);
        cb && cb();
    }

    const getNews = (value, all = false) => {
        const adapter = repository['js-controller'];
        const installed = hosts.find(el => el.common.name === hostUpdate).common.installedVersion;
        const news = [];

        if (installed && adapter && adapter.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed) || all) {
                        news.push({
                            version: version,
                            news: adapter.news[version][lang] || adapter.news[version].en
                        });
                    }
                } catch (e) {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed}"`);
                }
            });
        }

        return news;
    }
    const hostUpdateDialogCb = () => {
        if (!hostUpdateDialog) {
            return null;
        } else {
            return <AdapterUpdateDialog
                open={hostUpdateDialog}
                adapter={hostUpdate}
                adapterObject={repository['js-controller']}
                t={props.t}
                textUpdate={t('Show instructions')}
                rightDependencies
                news={getNews()}
                onUpdate={() =>
                    closeHostUpdateDialog(() =>
                        JsControllerDialogFunc(socket, hostUpdate))}
                onClose={() => closeHostUpdateDialog()}
            />
        }
    }

    if (!hosts.length) {
        return <LinearProgress />;
    }

    return <TabContainer>
        {renderEditObjectDialog()}
        {baseSettingsSettingsDialog()}
        {renderSlowConnectionWarning()}
        {hostUpdateDialogCb()}
        <TabHeader>
            <Tooltip title={t('Show / hide List')}>
                <IconButton size="large" onClick={() => setViewMode(!viewMode)}>
                    {viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={t('Reload')}>
                <IconButton size="large" onClick={() => setRefresh(el => !el)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <div className={classes.grow} />
            {hosts.length > 2 ? <TextField
                variant="standard"
                label={t('Filter')}
                style={{ margin: '5px 0' }}
                value={filterText}
                onChange={event => setFilterText(event.target.value)}
                InputProps={{
                    endAdornment: (
                        filterText ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => setFilterText('')}
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
            <div className={viewMode ? classes.cards : ''}>
                {!viewMode &&
                    <div className={classes.tabHeaderWrapper}>
                        <div className={classes.tabHeaderFirstItem}>
                            {t('Name:')}
                        </div>
                        <div className={classes.tabFlex}>
                            {/*<div className={clsx(classes.tabHeaderItem, classes.hidden600)}>{t('Title:')}</div>*/}
                            <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>CPU</div>
                            <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>RAM</div>
                            <div className={clsx(classes.tabHeaderItem, classes.hidden800)}>{t('Uptime')}</div>
                            <div className={clsx(classes.tabHeaderItem, classes.hidden1100)}>{t('Available')}</div>
                            <div className={clsx(classes.tabHeaderItem, classes.hidden1100)}>{t('Installed')}</div>
                            <div className={clsx(classes.tabHeaderItem, classes.hidden600)}>{t('Events')}</div>
                            <div className={clsx(classes.tabHeaderItemButton, expertMode && classes.widthButtons)} />
                        </div>
                    </div>}
                {getPanels()}
            </div>
        </TabContent>
    </TabContainer>;
}

Hosts.propTypes = {
    t: PropTypes.func,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
    systemConfig: PropTypes.object,
    hostsWorker: PropTypes.object,
    showAdaptersWarning: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Hosts));