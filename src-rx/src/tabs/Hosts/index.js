/* eslint-disable no-unused-vars */
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
import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import TabContainer from '../../components/TabContainer';
import TabContent from '../../components/TabContent';
import TabHeader from '../../components/TabHeader';
import { useStateLocal } from '../../helpers/hooks/useStateLocal';
import CardHosts from '../../components/CardHosts';
import RowHosts from '../../components/RowHosts';
import HostEdit from '../../components/HostEdit';
import Utils from '@iobroker/adapter-react/Components/Utils';
import { Skeleton } from '@material-ui/lab';

const styles = theme => ({
    table: {
        minWidth: 650,
    },
    tableRow: {
        '&:nth-of-type(odd)': {
            backgroundColor: grey[300],
        },
        '&:nth-of-type(even)': {
            backgroundColor: grey[200],
        }
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    button: {
        padding: '5px'
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200]
        }
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200]
        }
    },
    hide: {
        visibility: 'hidden'
    },
    state: {
        width: theme.spacing(2),
        height: theme.spacing(2),
        borderRadius: '100%'
    },
    green: {
        backgroundColor: green[700]
    },
    red: {
        backgroundColor: red[700]
    },
    grey: {
        backgroundColor: grey[700]
    },
    blue: {
        backgroundColor: blue[700]
    },
    transparent: {
        color: 'transparent',
        backgroundColor: 'transparent'
    },
    paper: {
        height: '100%'
    },
    iframe: {
        height: '100%',
        width: '100%',
        border: 0
    },
    silly: {

    },
    debug: {
        backgroundColor: grey[700]
    },
    info: {
        backgroundColor: blue[700]
    },
    warn: {
        backgroundColor: amber[700]
    },
    error: {
        backgroundColor: red[700]
    },
    grow: {
        flexGrow: 1
    },
    tableRender: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    },
    cards: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-539deg) brightness(99%) contrast(97%)'
    },
    contrast0: {
        filter: 'contrast(0%)'
    },
    tabHeaderWrapper: {
        height: 30,
        display: 'flex',
        margin: 7,
        color:'silver'
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
    tabFlex: {
        display: 'flex', flex: 1, padding: '0 10px'
    }
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
        return [<Skeleton />]
    }
    if (typeof hostData === 'string') {
        return [hostData]
    }
    return [(<ul>
        {
            hostData && typeof hostData === 'object' && Object.keys(hostData).map(value => <li key={value}>
                {hostData && typeof hostData === 'object' ?
                    <span>
                        <span className={classes.bold}>{t(value)}: </span>
                        {(formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--')}
                    </span>
                    :
                    <Skeleton />
                }
            </li>)
        }
    </ul>), hostData && typeof hostData === 'object' && Object.keys(hostData).reduce((acom, item) => acom + `${t(item)}:${(formatInfo[item] ? formatInfo[item](hostData[item], t) : hostData[item] || '--')}\n`)
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
    ...props }) => {
    const getHostsData = (hosts) => {
        const promises = hosts.map(obj =>
            socket.getHostInfo(obj._id)
                .catch(error => {
                    console.error(error);
                    return error;
                })
                .then(data =>
                    ({ id: obj._id, data })));

        return new Promise(resolve =>
            Promise.all(promises)
                .then(results => {
                    const hostsData = {};
                    results.forEach(res => hostsData[res.id] = res.data);
                    resolve(hostsData);
                }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const t = (word, arg1) => {
        if (arg1 !== undefined && !wordCache[word]) {
            wordCache[word] = props.t(word, arg1);
        } else if (!wordCache[word]) {
            wordCache[word] = props.t(word);
        }
        return wordCache[word];
    }
    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({});
    const [repository, setRepository] = useState({});
    const [hostsData, setHostsData] = useState({});
    const [refresh, setRefresh] = useState(false);
    const [viewMode, setViewMode] = useStateLocal(false, 'Hosts.viewMode');
    const [filterText, setFilterText] = useStateLocal(false, 'Hosts.filterText');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray = await socket.getHosts('');
        const repositoryProm = await socket.getRepository(currentHost, { update: false });
        hostsArray.forEach(async ({ _id }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAlive((prev) => ({ ...prev, [_id]: aliveValue.val === null ? false : aliveValue.val }));
        });
        setRepository(repositoryProm);
        setHosts(hostsArray);
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
        renderCard: <CardHosts
            key={_id}
            setEditDilog={() => setEditDilog({
                index: idx,
                dialogName: name
            })}
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
            installed={installedVersion}
            events={'⇥null / ↦null'}
            t={t}
            _id={_id}
        />,
        renderRow: <RowHosts
            key={_id}
            setEditDilog={() => setEditDilog({
                index: idx,
                dialogName: name
            })}
            socket={socket}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            title={title}
            os={platform}
            executeCommand={() => executeCommand('restart')}
            description={getHostDescriptionAll(_id, t, classes, hostsData)[0]}
            available={repository['js-controller']?.latestVersion || '-'}
            installed={installedVersion}
            events={'⇥null / ↦null'}
            t={t}
            _id={_id}
        />,
        name
    })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [hosts, alive, repository, hostsData]);

    const [editDilog, setEditDilog] = useState({
        index: 0,
        dialogName: ''
    });

    const getPanels = useCallback(() => {
        const items = getAllArrayHosts.filter(el => filterText ? el.name.toLowerCase().includes(filterText.toLowerCase()) : true).map(el => viewMode ? el.renderCard : el.renderRow);
        return items.length ? items : t('All items are filtered out');
    }, [getAllArrayHosts, t, filterText, viewMode]);

    const renderEditObjectDialog = () => {
        if (!editDilog.dialogName) {
            return null;
        }
        return <HostEdit
            obj={hosts[editDilog.index]}
            socket={socket}
            dialogName={editDilog.dialogName}
            t={t}
            expertMode={expertMode}
            onClose={obj => {
                setEditDilog({
                    index: 0,
                    dialogName: ''
                })
                if (obj) {
                    socket.setObject(obj._id, obj)
                        .then(_ => {
                            const copyHosts = JSON.parse(JSON.stringify(hosts));
                            copyHosts[editDilog.index] = obj;
                            setHosts(copyHosts);
                        })
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
        <TabHeader>
            <Tooltip title={t('Show / hide List')}>
                <IconButton onClick={() => setViewMode(!viewMode)}>
                    {viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={t('Reload')}>
                <IconButton onClick={() => setRefresh(!refresh)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <div className={classes.grow} />
            <TextField
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
            />
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
                            <div className={classes.tabHeaderItem}>{t('Title:')}</div>
                            <div className={classes.tabHeaderItem}>{t('OS:')}</div>
                            <div className={classes.tabHeaderItem}>{t('Available:')}</div>
                            <div className={classes.tabHeaderItem}>{t('Installed:')}</div>
                            <div className={classes.tabHeaderItem}>{t('Events:')}</div>
                            <div className={classes.tabHeaderItem}>{t('Buttons:')}</div>
                        </div>
                    </div>}
                {getPanels()}
            </div>
        </TabContent>
    </TabContainer>;
}

Hosts.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    t: PropTypes.func,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
};

export default withWidth()(withStyles(styles)(Hosts));