import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { InputAdornment, LinearProgress, TextField } from '@material-ui/core';

import RefreshIcon from '@material-ui/icons/Refresh';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CloseIcon from '@material-ui/icons/Close';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';
import { useStateLocal } from '../helpers/hooks/useStateLocal';
import HostCard from '../components/Hosts/HostCard';
import HostRow from '../components/Hosts/HostRow';
import HostEdit from '../components/Hosts/HostEdit';
import { Skeleton } from '@material-ui/lab';
import { JsControllerDialogFunc } from '../dialogs/JsControllerDialog';
import clsx from 'clsx';
import Utils from '../Utils';
import BaseSettingsDialog from '../dialogs/BaseSettingsDialog';

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
    widthButtons:{
        width: 192,
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
        return [hostData];
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

// every tab should get their data itself from server
const Hosts = ({
    classes,
    disabled,
    socket,
    currentHost,
    setCurrentHost,
    expertMode,
    executeCommand,
    systemConfig,
    navigate,
    themeName,
    lang,
    ...props
}) => {
    const getHostsData = hosts => {
        const promises = hosts.map(obj =>
            socket.getHostInfo(obj._id, null, 10000)
                .catch(error => {
                    console.error(error);
                    return error;
                })
                .then(data =>
                    ({ id: obj._id, data })));

        return new Promise(resolve =>
            Promise.all(promises)
                .then(results => {
                    const _hostsData = {};
                    results.forEach(res => _hostsData[res.id] = res.data);
                    resolve(_hostsData);
                }));
    }
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray = await socket.getHosts(true, false, 10000);
        const repositoryProm = await socket.getRepository(currentHost, { update: false }, false, 10000);
        hostsArray.forEach(async ({ _id }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAlive((prev) => ({ ...prev, [_id]: !aliveValue ? false : !!aliveValue.val }));
        });
        setRepository(repositoryProm);
        setHosts(hostsArray);
        filterText && hostsArray.length <= 2 && setFilterText('');
        const hostDataObj = await getHostsData(hostsArray);
        setHostsData(hostDataObj);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);

    const getAllArrayHosts = useMemo(() => hosts.map(({
        _id,
        common: { name, icon, color, title, installedVersion },
        native: { os: { platform } },
    }, idx
    ) => ({
        renderCard: <HostCard
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
            expertMode={expertMode}
            socket={socket}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            title={title}
            os={platform}
            description={getHostDescriptionAll(_id, t, classes, hostsData)[0]}
            available={repository['js-controller']?.latestVersion || '-'}
            executeCommand={() => executeCommand('restart')}
            executeCommandRemove={() => executeCommand(`host remove ${name}`)}
            dialogUpgrade={JsControllerDialogFunc}
            currentHost={currentHost === _id}
            installed={installedVersion}
            events={'- / -'}
            t={t}
            _id={_id}
        />,
        renderRow: <HostRow
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
            expertMode={expertMode}
            socket={socket}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            title={title}
            os={platform}
            executeCommand={() => executeCommand('restart')}
            executeCommandRemove={() => executeCommand(`host remove ${name}`)}
            dialogUpgrade={JsControllerDialogFunc}
            currentHost={currentHost === _id}
            description={getHostDescriptionAll(_id, t, classes, hostsData)[1]}
            available={repository['js-controller']?.latestVersion || '-'}
            installed={installedVersion}
            events={'- / -'}
            t={t}
            _id={_id}
        />,
        name
    })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [hosts, alive, repository, hostsData, classes,expertMode]);

    const [editDialog, setEditDialog] = useState({
        index: 0,
        dialogName: ''
    });

    const [baseSettingsDialog, setBaseSettingsDialog] = useState({
        index: 0,
        dialogName: ''
    });

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
            // currentTab={this.state.currentTab}
            t={t}
        />
    }

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
    }

    if (!hosts.length) {
        return <LinearProgress />;
    }

    return <TabContainer>
        {renderEditObjectDialog()}
        {baseSettingsSettingsDialog()}
        <TabHeader>
            <Tooltip title={t('Show / hide List')}>
                <IconButton onClick={() => setViewMode(!viewMode)}>
                    {viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={t('Reload')}>
                <IconButton onClick={() => setRefresh(el => !el)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <div className={classes.grow} />
            {hosts.length > 2 ? <TextField
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
                            <div className={clsx(classes.tabHeaderItemButton,expertMode && classes.widthButtons)} />
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
};

export default withWidth()(withStyles(styles)(Hosts));