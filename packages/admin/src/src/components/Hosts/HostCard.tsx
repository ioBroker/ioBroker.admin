import React, { useEffect, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';

import {
    Avatar,
    Badge,
    Card,
    CardContent,
    CardMedia,
    Fab,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select, type Theme,
    Tooltip,
    Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Cached as CachedIcon,
    Build as BuildIcon,
} from '@mui/icons-material';

import {
    amber, blue, grey, red,
} from '@mui/material/colors';

import { Utils, IconCopy, type AdminConnection } from '@iobroker/adapter-react-v5';

import type { NotificationAnswer } from '@/Workers/HostsWorker';
import BasicUtils from '@/Utils';
import CustomModal from '../CustomModal';
import { toggleClassName, arrayLogLevel, type HostRowCardProps } from './HostUtils';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles: Record<string, any> = (theme: Theme) => ({
    root: {
        position: 'relative',
        margin: 10,
        width: 300,
        minHeight: 200,
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.5s',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
        '& .warning': {
            backgroundColor: '#de0000 !important',
            '&:before': {
                position: 'absolute',
                right: 0,
                top: -5,
                content: '"\u26A0"',
                fontSize: 25,
                height: '30px',
                width: '30px',
                color: 'black',
            },
            animation: '$warning 2.5s ease-in-out infinite alternate',
        },
    },
    '@keyframes warning': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0.7,
        },
    },
    imageBlock: {
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        transition: 'background 0.5s',
    },
    img: {
        width: 45,
        height: 45,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    installed: {
        background: '#77c7ff8c',
    },
    /* update: {
        background: '#10ff006b'
    }, */
    fab: {
        position: 'absolute',
        bottom: -20,
        width: 40,
        height: 40,
        right: 20,
    },

    collapse: {
        height: '100%',
        position: 'absolute',
        width: '100%',
        zIndex: 3,
        marginTop: 'auto',
        bottom: 0,
        transition: 'height 0.3s',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'column',
    },
    collapseOff: {
        height: 0,
    },
    close: {
        width: 20,
        height: 20,
        opacity: 0.9,
        cursor: 'pointer',
        position: 'relative',
        marginLeft: 'auto',
        marginBottom: 10,
        transition: 'all 0.6s ease',
        '&:hover': {
            transform: 'rotate(90deg)',
        },
        '&:before': {
            position: 'absolute',
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)',
        },
    },
    footerBlock: {
        background: theme.palette.background.default,
        padding: 10,
        display: 'flex',
        justifyContent: 'space-between',
    },
    hidden: {
        display: 'none',
    },
    onOffLine: {
        alignSelf: 'center',
        width: '100%',
        height: 4,
        // borderRadius: 20,
    },
    adapter: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        verticalAlign: 'middle',
        paddingLeft: 8,
        paddingTop: 16,
        color: theme.palette.mode === 'dark' ? '#333' : '#555',
    },
    cardContent: {
        marginTop: 16,
        paddingTop: 0,
    },
    cardContentInfo: {
        overflow: 'auto',
        paddingTop: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingBottom: '10px !important',
    },
    marginTop10: {
        marginTop: 10,
    },
    displayFlex: {
        display: 'flex',
    },
    marginLeft5: {
        marginLeft: 5,
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.4)',
    },
    /* instanceStateNotAlive2: {
        backgroundColor: 'rgb(192 192 192 / 15%)'
    }, */
    instanceStateAliveNotConnected1: {
        backgroundColor: 'rgba(255, 177, 0, 0.4)',
    },
    /* instanceStateAliveNotConnected2: {
        backgroundColor: 'rgb(255 177 0  / 14%)'
    }, */
    instanceStateAliveAndConnected1: {
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
    },
    /* instanceStateAliveAndConnected2: {
        backgroundColor: 'rgb(0 255 0 / 14%)'
    } */
    green: {
        background: '#00ce00',
        // border: '1px solid #014a00',
        position: 'relative',
    },
    red: {
        background: '#da0000',
        // border: '1px solid #440202',,
        // animation: '$red 3s ease-in-out infinite alternate'
    },
    '@keyframes red': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0.85,
        },
    },
    dotLine: {
        width: 50,
        height: '100%',
        background:
            'linear-gradient(90deg, rgba(0,206,0,0.7497373949579832) 0%, rgba(31,255,1,1) 50%, rgba(0,206,0,0.7805497198879552) 100%)',
        zIndex: 2,
        position: 'absolute',
        left: -11,
        // boxShadow: '12px 29px 81px 0px rgb(0 0 0 / 75%)',
        // animation: '$colors 3s ease-in-out infinite'
    },
    '@keyframes colors': {
        '0%': {
            left: -51,
        },
        '100%': {
            left: '101%',
        },
    },
    versionDate: {
        alignSelf: 'center',
    },

    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        paddingTop: 10,
    },
    badge: {
        cursor: 'pointer',
    },
    emptyButton: {
        width: 48,
    },
    greenText: {
        color: theme.palette.success.dark,
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 4,
    },
    wrapperAvailable: {
        display: 'flex',
        alignItems: 'center',
    },
    buttonUpdate: {
        border: '1px solid',
        padding: '0px 7px',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.5s',
        '&:hover': {
            background: '#00800026',
        },
    },
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10,
    },
    debug: {
        backgroundColor: grey[700],
    },
    info: {
        backgroundColor: blue[700],
    },
    warn: {
        backgroundColor: amber[700],
    },
    error: {
        backgroundColor: red[700],
    },
    smallAvatar: {
        width: 24,
        height: 24,
    },
    formControl: {
        display: 'flex',
    },
    baseSettingsButton: {
        transform: 'rotate(45deg)',
    },
    newValue: {
        animation: '$newValueAnimation 2s ease-in-out',
    },
    '@keyframes newValueAnimation': {
        '0%': {
            color: '#00f900',
        },
        '80%': {
            color: '#008000',
        },
        '100%': {
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        },
    },
});

let outputCache = '-';
let inputCache = '-';
let cpuCache = '- %';
let memCache = '- %';
let uptimeCache = '-';

let diskFreeCache = 1;
let diskSizeCache = 1;
let diskWarningCache = 1;

/**
 * Get the initial disk states to show problems with disk usage
 */
async function getInitialDiskStates(
    /** id of the host to get information from */
    hostId: string,
    socket: AdminConnection,
): Promise<void> {
    const diskWarningState = await socket.getState(`${hostId}.diskWarning`);
    diskWarningCache = diskWarningState?.val as number ?? diskWarningCache;

    const diskFreeState = await socket.getState(`${hostId}.diskFree`);
    diskFreeCache = diskFreeState?.val as number ?? diskFreeCache;

    const diskSizeState = await socket.getState(`${hostId}.diskSize`);
    diskSizeCache = diskSizeState?.val as number ?? diskSizeCache;
}

const HostCard = ({
    _id,
    alive,
    available,
    classes,
    color,
    connected,
    connectedToHost,
    isCurrentHost,
    description,
    events,
    executeCommandRemove,
    expertMode,
    getLogLevelIcon,
    formatInfo,
    hidden,
    hostData,
    hostsWorker,
    image,
    installed,
    name,
    openHostUpdateDialog,
    setBaseSettingsDialog,
    setEditDialog,
    showAdaptersWarning,
    socket,
    systemConfig,
    t,
    // title,
}: HostRowCardProps) => {
    const [openCollapse, setCollapse] = useState(false);

    const refEvents = useRef<HTMLDivElement>();
    const refWarning = useRef<HTMLDivElement>();
    const refCpu = useRef<HTMLDivElement>();
    const refMem = useRef<HTMLDivElement>();
    const refUptime = useRef<HTMLDivElement>();

    const eventsInputFunc = (id: string, input: ioBroker.State) => {
        inputCache = input && input.val !== null ? `⇥${input.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
            toggleClassName(refEvents.current, classes.newValue);
        }
    };

    const eventsOutputFunc = (id: string, output: ioBroker.State) => {
        outputCache = output && output.val !== null ? `↦${output.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
            toggleClassName(refEvents.current, classes.newValue);
        }
    };

    const formatValue = (state: ioBroker.State, unit: string) => {
        if (!state || state.val === null || state.val === undefined) {
            return `-${unit ? ` ${unit}` : ''}`;
        } if (systemConfig.common.isFloatComma) {
            return state.val.toString().replace('.', ',') + (unit ? ` ${unit}` : '');
        }
        return state.val + (unit ? ` ${unit}` : '');
    };

    const warningFunc = (name_: string, state: ioBroker.State) => {
        if (name_.endsWith('diskFree')) {
            diskFreeCache = state?.val as number || 0;
        } else if (name_.endsWith('diskSize')) {
            diskSizeCache = state?.val as number || 0;
        } else if (name_.endsWith('diskWarning')) {
            diskWarningCache = state?.val as number || 0;
        }
        const warning = (diskFreeCache / diskSizeCache) * 100 <= diskWarningCache;
        if (refWarning.current) {
            if (warning) {
                refWarning.current.setAttribute('title', t('Warning: Free space on disk is low'));
                refWarning.current.classList.add('warning');
            } else {
                refWarning.current.removeAttribute('title');
                refWarning.current.classList.remove('warning');
            }
        }
    };

    const cpuFunc = (id: string, state: ioBroker.State) => {
        cpuCache = formatValue(state, '%');
        if (refCpu.current) {
            refCpu.current.innerHTML = cpuCache;
            toggleClassName(refCpu.current, classes.newValue);
        }
    };

    const memFunc = (id: string, state: ioBroker.State) => {
        memCache = formatValue(state, '%');
        if (refMem.current) {
            refMem.current.innerHTML = memCache;
            toggleClassName(refMem.current, classes.newValue);
        }
    };

    const uptimeFunc = (id: string, state: ioBroker.State) => {
        if (state?.val) {
            const d = Math.floor(state.val as number / (3600 * 24));
            const h = Math.floor((state.val as number % (3600 * 24)) / 3600);
            uptimeCache = d ? `${d}d${h}h` : `${h}h`; // TODO translate
        }
        if (refUptime.current) {
            refUptime.current.innerHTML = uptimeCache;
            toggleClassName(refUptime.current, classes.newValue);
        }
    };

    const calculateWarning = (notifications: NotificationAnswer) => {
        if (!notifications) {
            return 0;
        }
        const { result } = notifications;
        let count = 0;
        if (!result || !result.system) {
            return count;
        }
        if (Object.keys(result.system.categories).length) {
            const obj = result.system.categories;
            Object.keys(obj).forEach(nameTab => Object.keys(obj[nameTab].instances).forEach(() => count++));
        }
        return count;
    };

    const [errorHost, setErrorHost] = useState({ notifications: {}, count: 0 });
    const [focused, setFocused] = useState(false);

    const [openDialogLogLevel, setOpenDialogLogLevel] = useState(false);
    const [logLevelValue, setLogLevelValue] = useState(null);
    const [logLevelValueSelect, setLogLevelValueSelect] = useState(null);

    const logLevelFunc = (id: string, state: ioBroker.State) => {
        if (state) {
            setLogLevelValue(state.val);
            setLogLevelValueSelect(state.val);
        }
    };

    useEffect(() => {
        const notificationHandler = (notifications: Record<string, NotificationAnswer>) =>
            notifications &&
            notifications[_id] &&
            setErrorHost({ notifications: notifications[_id], count: calculateWarning(notifications[_id]) });

        hostsWorker.registerNotificationHandler(notificationHandler);

        hostsWorker
            .getNotifications(_id)
            .then(
                notifications =>
                    notifications &&
                    notifications[_id] &&
                    setErrorHost({ notifications: notifications[_id], count: calculateWarning(notifications[_id]) }),
            );

        socket.subscribeState(`${_id}.inputCount`, eventsInputFunc);
        socket.subscribeState(`${_id}.outputCount`, eventsOutputFunc);

        socket.subscribeState(`${_id}.cpu`, cpuFunc);
        socket.subscribeState(`${_id}.mem`, memFunc);
        socket.subscribeState(`${_id}.uptime`, uptimeFunc);

        getInitialDiskStates(_id, socket)
            .finally(async () => {
                await socket.subscribeState(`${_id}.diskFree`, warningFunc);
                await socket.subscribeState(`${_id}.diskSize`, warningFunc);
                await socket.subscribeState(`${_id}.diskWarning`, warningFunc);
            });

        socket.subscribeState(`${_id}.logLevel`, logLevelFunc);

        return () => {
            hostsWorker.unregisterNotificationHandler(notificationHandler);
            socket.unsubscribeState(`${_id}.inputCount`, eventsInputFunc);
            socket.unsubscribeState(`${_id}.outputCount`, eventsOutputFunc);

            socket.unsubscribeState(`${_id}.cpu`, cpuFunc);
            socket.unsubscribeState(`${_id}.mem`, memFunc);
            socket.unsubscribeState(`${_id}.uptime`, uptimeFunc);

            socket.unsubscribeState(`${_id}.diskFree`, warningFunc);
            socket.unsubscribeState(`${_id}.diskSize`, warningFunc);
            socket.unsubscribeState(`${_id}.diskWarning`, warningFunc);

            socket.unsubscribeState(`${_id}.logLevel`, logLevelFunc);
        };
    }, [_id, socket, classes]);

    const upgradeAvailable = (isCurrentHost || alive) && BasicUtils.updateAvailable(installed, available);

    const onCopy = () => {
        const text = [];
        refCpu.current && text.push(`CPU: ${refCpu.current.innerHTML}`);
        refMem.current && text.push(`RAM: ${refMem.current.innerHTML}`);
        refUptime.current && text.push(`${t('Uptime')}: ${refUptime.current.innerHTML}`);
        text.push(`${t('Available')}: ${available}`);
        text.push(`${t('Installed')}: ${installed}`);
        refEvents.current && text.push(`${t('Events')}: ${refEvents.current.innerHTML}`);

        hostData &&
            typeof hostData === 'object' &&
            Object.keys(hostData).map(value =>
                text.push(
                    `${t(value)}: ${formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--'}`,
                ));

        Utils.copyToClipboard(text.join('\n'));
        window.alert(t('Copied'));
    };

    let showModal = false;
    let titleModal;
    if (openDialogLogLevel) {
        titleModal = t('Edit log level rule for %s', name);
        showModal = true;
    }

    const customModal = showModal ? <CustomModal
        title={titleModal}
        onApply={() => {
            if (openDialogLogLevel) {
                socket.setState(`${_id}.logLevel`, logLevelValueSelect);
                setOpenDialogLogLevel(false);
            }
        }}
        onClose={() => {
            if (openDialogLogLevel) {
                setLogLevelValueSelect(logLevelValue);
                setOpenDialogLogLevel(false);
            }
        }}
    >
        {openDialogLogLevel && <FormControl className={classes.formControl} variant="outlined" style={{ marginTop: 8 }}>
            <InputLabel>{t('log level')}</InputLabel>
            <Select
                variant="standard"
                value={logLevelValueSelect}
                fullWidth
                onChange={el => setLogLevelValueSelect(el.target.value)}
            >
                {arrayLogLevel.map(el => (
                    <MenuItem key={el} value={el}>
                        {t(el)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>}
        {openDialogLogLevel && <FormControl className={classes.formControl} variant="outlined">
            <FormHelperText>
                {t('Log level will be reset to the saved level after the restart of the controller')}
            </FormHelperText>
            <FormHelperText>
                {t('You can set the log level permanently in the base host settings')}
                <BuildIcon className={classes.baseSettingsButton} />
            </FormHelperText>
        </FormControl>}
    </CustomModal> : null;

    return <Card key={_id} className={Utils.clsx(classes.root, hidden ? classes.hidden : '')}>
        {customModal}
        {(openCollapse || focused) && <div className={Utils.clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent className={classes.cardContentInfo}>
                <div className={classes.cardContentDiv}>
                    <div
                        className={classes.close}
                        onClick={() => setCollapse(false)}
                    />
                </div>
                {description}
            </CardContent>
            <div className={classes.footerBlock}></div>
        </div>}
        <div className={Utils.clsx(classes.onOffLine, alive ? classes.green : classes.red)}>
            {alive && <div className={classes.dotLine} />}
        </div>
        <div
            ref={refWarning}
            style={{ background: color || 'inherit' }}
            className={Utils.clsx(
                classes.imageBlock,
                (!connectedToHost || !alive) && classes.instanceStateNotAlive1,
                connectedToHost && alive && connected === false && classes.instanceStateAliveNotConnected1,
                connectedToHost && alive && connected !== false && classes.instanceStateAliveAndConnected1,
            )}
        >
            <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
            <div
                style={{ color: (color && Utils.invertColor(color, true)) || 'inherit' }}
                className={classes.adapter}
            >
                <Badge
                    title={t('Hosts notifications')}
                    badgeContent={errorHost.count}
                    color="error"
                    className={classes.badge}
                    onClick={e => {
                        e.stopPropagation();
                        showAdaptersWarning({ [_id]: errorHost.notifications }, _id);
                    }}
                >
                    {name}
                </Badge>
            </div>
            {!openCollapse ? <Fab
                disabled={typeof description === 'string'}
                onMouseOut={() => setFocused(false)}
                onMouseOver={() => setFocused(true)}
                onClick={() => setCollapse(true)}
                className={classes.fab}
                color="primary"
                aria-label="add"
                title={t('Click for more')}
            >
                <MoreVertIcon />
            </Fab> : null}
        </div>
        <CardContent className={classes.cardContentH5}>
            {/* <Typography variant="body2" color="textSecondary" component="p">
            {t('Title')}: {title}
        </Typography> */}
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>
                    CPU:
                    <div ref={refCpu} className={classes.marginLeft5}>
                        - %
                    </div>
                </div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>
                    RAM:
                    <div ref={refMem} className={classes.marginLeft5}>
                        - %
                    </div>
                </div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>
                    {t('Uptime')}
:
                    {' '}
                    <div ref={refUptime} className={classes.marginLeft5}>
                        -d -h
                    </div>
                </div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div" className={classes.wrapperAvailable}>
                {t('Available')}
                {' '}
js-controller:
                {' '}
                <div className={Utils.clsx(upgradeAvailable && classes.greenText, classes.curdContentFlexCenter)}>
                    {upgradeAvailable ? <Tooltip title={t('Update')}>
                        <div onClick={openHostUpdateDialog} className={classes.buttonUpdate}>
                            <IconButton className={classes.buttonUpdateIcon} size="small">
                                <RefreshIcon />
                            </IconButton>
                            {available}
                        </div>
                    </Tooltip>
                        :
                        available}
                </div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Installed')}
                {' '}
js-controller:
                {installed}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>
                    {t('Events')}
:
                    {' '}
                    <div ref={refEvents} className={classes.marginLeft5}>
                        {events}
                    </div>
                </div>
            </Typography>
            <div className={classes.marginTop10}>
                <Typography component="span" className={classes.enableButton}>
                    <IconButton size="large" onClick={() => setEditDialog(true)}>
                        <EditIcon />
                    </IconButton>
                    {expertMode && <Tooltip title={t('Host Base Settings')}>
                        <div>
                            <IconButton size="large" disabled={!alive} onClick={setBaseSettingsDialog}>
                                <BuildIcon className={classes.baseSettingsButton} />
                            </IconButton>
                        </div>
                    </Tooltip>}
                    <Tooltip title={t('Restart host')}>
                        <div>
                            <IconButton
                                size="large"
                                disabled={!alive}
                                onClick={e => {
                                    e.stopPropagation();
                                    socket.restartController(_id)
                                        .catch(err => window.alert(`Cannot restart: ${err}`));
                                }}
                            >
                                <CachedIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    {expertMode && logLevelValue && <Tooltip title={`${t('loglevel')} ${logLevelValue}`}>
                        <IconButton size="large" onClick={() => setOpenDialogLogLevel(true)}>
                            <Avatar className={Utils.clsx(classes.smallAvatar, classes[logLevelValue])}>
                                {getLogLevelIcon(logLevelValue)}
                            </Avatar>
                        </IconButton>
                    </Tooltip>}
                    {!alive && !isCurrentHost ? <Tooltip title={t('Remove')}>
                        <IconButton size="large" onClick={executeCommandRemove}>
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                        :
                        <div className={classes.emptyButton} />}

                    <Tooltip title={t('Copy')}>
                        <IconButton size="large" onClick={() => onCopy()}>
                            <IconCopy />
                        </IconButton>
                    </Tooltip>
                </Typography>
            </div>
        </CardContent>
    </Card>;
};

export default withStyles(styles)(HostCard);
