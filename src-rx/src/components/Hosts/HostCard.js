import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { Badge, Card, CardContent, CardMedia, Fab, IconButton, Tooltip, Typography } from '@material-ui/core';

import { withStyles } from '@material-ui/core/styles';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import RefreshIcon from '@material-ui/icons/Refresh';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CachedIcon from '@material-ui/icons/Cached';
import BuildIcon from '@material-ui/icons/Build';

import Utils from '@iobroker/adapter-react/Components/Utils';

import Adapters from '../../tabs/Adapters';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
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
            boxShadow: boxShadowHover
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
                color: 'black'
            },
            animation: '$warning 2.5s ease-in-out infinite alternate'
        }
    },
    '@keyframes warning': {
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0.7
        }
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
        }
    },
    installed: {
        background: '#77c7ff8c'
    },
    /*update: {
        background: '#10ff006b'
    },*/
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
        flexDirection: 'column'
    },
    collapseOff: {
        height: 0
    },
    close: {
        width: '20px',
        height: '20px',
        opacity: '0.9',
        cursor: 'pointer',
        position: 'relative',
        marginLeft: 'auto',
        marginBottom: 10,
        transition: 'all 0.6s ease',
        '&:hover': {
            transform: 'rotate(90deg)'
        },
        '&:before': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)'
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)'
        },
    },
    footerBlock: {
        background: theme.palette.background.default,
        padding: 10,
        display: 'flex',
        justifyContent: 'space-between'
    },
    hidden: {
        display: 'none'
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
        color: theme.palette.type === 'dark' ? '#333' : '#555'
    },
    cardContent: {
        marginTop: 16,
        paddingTop: 0
    },
    cardContentInfo: {
        overflow: 'auto',
        paddingTop: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.type === 'dark' ? '#EEE' : '#111',
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingBottom: '10px !important'
    },
    marginTop10: {
        marginTop: 10
    },
    displayFlex: {
        display: 'flex',
    },
    marginLeft5: {
        marginLeft: 5
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.4)'
    },
    /*instanceStateNotAlive2: {
        backgroundColor: 'rgb(192 192 192 / 15%)'
    },*/
    instanceStateAliveNotConnected1: {
        backgroundColor: 'rgba(255, 177, 0, 0.4)'
    },
    /*instanceStateAliveNotConnected2: {
        backgroundColor: 'rgb(255 177 0  / 14%)'
    },*/
    instanceStateAliveAndConnected1: {
        backgroundColor: 'rgba(0, 255, 0, 0.4)'
    },
    /*instanceStateAliveAndConnected2: {
        backgroundColor: 'rgb(0 255 0 / 14%)'
    }*/
    green: {
        background: '#00ce00',
        // border: '1px solid #014a00',
        position: 'relative'
    },
    red: {
        background: '#da0000',
        // border: '1px solid #440202',,
        // animation: '$red 3s ease-in-out infinite alternate'
    },
    '@keyframes red': {
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0.85
        }
    },
    dotLine: {
        width: 50,
        height: '100%',
        background: 'linear-gradient(90deg, rgba(0,206,0,0.7497373949579832) 0%, rgba(31,255,1,1) 50%, rgba(0,206,0,0.7805497198879552) 100%)',
        zIndex: 2,
        position: 'absolute',
        left: -11,
        // boxShadow: '12px 29px 81px 0px rgb(0 0 0 / 75%)',
        // animation: '$colors 3s ease-in-out infinite'
    },
    '@keyframes colors': {
        '0%': {
            left: -51
        },
        '100%': {
            left: '101%'
        }
    },
    versionDate: {
        alignSelf: 'center'
    },

    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        paddingTop: 10
    },
    badge: {
        cursor: 'pointer'
    },
    emptyButton: {
        width: 48,
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

const HostCard = ({
    name,
    classes,
    image,
    hidden,
    connectedToHost,
    alive,
    connected,
    color,
    title,
    available,
    installed,
    events,
    t,
    description,
    _id,
    socket,
    setEditDialog,
    executeCommandRemove,
    currentHost,
    dialogUpgrade,
    systemConfig,
    setBaseSettingsDialog,
    expertMode,
    hostsWorker,
    showAdaptersWarning
}) => {

    const [openCollapse, setCollapse] = useState(false);
    const refEvents = useRef();
    const refWarning = useRef();
    const refCpu = useRef();
    const refMem = useRef();
    const refUptime = useRef();

    const eventsInputFunc = (_, input) => {
        inputCache = input && input.val !== null ? `⇥${input.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
        }
    };

    const eventsOutputFunc = (_, output) => {
        outputCache = output && output.val !== null ? `↦${output.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
        }
    };

    const formatValue = (state, unit) => {
        if (!state || state.val === null || state.val === undefined) {
            return '-' + (unit ? ' ' + unit : '');
        } else if (systemConfig.common.isFloatComma) {
            return state.val.toString().replace('.', ',') + (unit ? ' ' + unit : '');
        } else {
            return state.val + (unit ? ' ' + unit : '');
        }
    };

    const warningFunc = (name, state) => {
        let warning;
        if (name.endsWith('diskFree')) {
            diskFreeCache = state?.val || 0;
        } else if (name.endsWith('diskSize')) {
            diskSizeCache = state?.val || 0;
        } else if (name.endsWith('diskWarning')) {
            diskWarningCache = state?.val || 0;
        }
        warning = (diskFreeCache / diskSizeCache) * 100 <= diskWarningCache;
        if (refWarning.current) {
            if (warning) {
                refWarning.current.setAttribute('title', t('disk Warning'));
                refWarning.current.classList.add('warning');
            } else {
                refWarning.current.removeAttribute('title');
                refWarning.current.classList.remove('warning');
            }
        }
    };

    const cpuFunc = (_, state) => {
        cpuCache = formatValue(state, '%');
        if (refCpu.current) {
            refCpu.current.innerHTML = cpuCache;
        }
    }

    const memFunc = (_, state) => {
        memCache = formatValue(state, '%');
        if (refMem.current) {
            refMem.current.innerHTML = memCache;
        }
    }

    const uptimeFunc = (_, state) => {
        if (state.val) {
            const d = Math.floor(state.val / (3600 * 24));
            const h = Math.floor(state.val % (3600 * 24) / 3600);
            uptimeCache = d ? `${d}d${h}h` : `${h}h`; // TODO translate
        }
        if (refUptime.current) {
            refUptime.current.innerHTML = uptimeCache;
        }
    }

    const calculateWarning = notifications => {
        if (!notifications) {
            return 0;
        }
        const { result } = notifications;
        let count = 0;
        if (!result || !result.system) {
            return count;
        }
        if (Object.keys(result.system.categories).length) {
            let obj = result.system.categories;
            Object.keys(obj).forEach(nameTab =>
                Object.keys(obj[nameTab].instances).forEach(_ => count++));
        }
        return count;
    };

    const [errorHost, setErrorHost] = useState({ notifications: {}, count: 0 });

    useEffect(() => {
        const notificationHandler = notifications =>
            notifications && notifications[_id] && setErrorHost({notifications: notifications[_id], count: calculateWarning(notifications[_id])});

        hostsWorker.registerNotificationHandler(notificationHandler);

        hostsWorker.getNotifications(_id)
            .then(notifications => notifications && notifications[_id] && setErrorHost({notifications: notifications[_id], count: calculateWarning(notifications[_id])}));

        socket.subscribeState(`${_id}.inputCount`, eventsInputFunc);
        socket.subscribeState(`${_id}.outputCount`, eventsOutputFunc);

        socket.subscribeState(`${_id}.cpu`, cpuFunc);
        socket.subscribeState(`${_id}.mem`, memFunc);
        socket.subscribeState(`${_id}.uptime`, uptimeFunc);

        socket.subscribeState(`${_id}.diskFree`, warningFunc);
        socket.subscribeState(`${_id}.diskSize`, warningFunc);
        socket.subscribeState(`${_id}.diskWarning`, warningFunc);

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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_id, socket, classes]);

    const [focused, setFocused] = useState(false);

    const upgradeAvailable = (currentHost || alive) && Adapters.updateAvailable(installed, available);

    return <Card key={_id} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        {(openCollapse || focused) && <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent className={classes.cardContentInfo}>
                <div className={classes.cardContentDiv}>
                    <div className={classes.close} onClick={() => setCollapse(false)} />
                </div>
                {description}
            </CardContent>
            <div className={classes.footerBlock}>
            </div>
        </div>}
        <div className={clsx(classes.onOffLine, alive ? classes.green : classes.red)} >
            {alive && <div className={classes.dotLine} />}
        </div>
        <div
            ref={refWarning}
            style={{ background: color || 'inherit' }}
            className={clsx(
                classes.imageBlock,
                (!connectedToHost || !alive) && classes.instanceStateNotAlive1,
                connectedToHost && alive && connected === false && classes.instanceStateAliveNotConnected1,
                connectedToHost && alive && connected !== false && classes.instanceStateAliveAndConnected1
            )}>
            <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
            <div
                style={{ color: (color && Utils.invertColor(color, true)) || 'inherit' }}
                className={classes.adapter}>
                <Badge
                    title={t('Hosts notifications')}
                    badgeContent={errorHost.count}
                    color="error"
                    className={classes.badge}
                    onClick={e => {
                        e.stopPropagation();
                        showAdaptersWarning({[_id]: errorHost.notifications}, socket, _id);
                    }}
                >{name}
                </Badge>
            </div>
            <Fab
                disabled={typeof description === 'string'}
                onMouseOut={() => setFocused(false)}
                onMouseOver={() => setFocused(true)}
                onClick={() => setCollapse(true)} className={classes.fab} color="primary" aria-label="add">
                <MoreVertIcon />
            </Fab>
        </div>
        <CardContent className={classes.cardContentH5}>
            {/*<Typography variant="body2" color="textSecondary" component="p">
                {t('Title')}: {title}
            </Typography>*/}
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>CPU:<div ref={refCpu} className={classes.marginLeft5}>{'- %'}</div></div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>RAM:<div ref={refMem} className={classes.marginLeft5}>{'- %'}</div></div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>{t('Uptime')}: <div ref={refUptime} className={classes.marginLeft5}>{'-d -h'}</div></div>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Available')}: {available}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Installed')}: {installed}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>{t('Events')}: <div ref={refEvents} className={classes.marginLeft5}>{events}</div></div>
            </Typography>
            <div className={classes.marginTop10}>
                <Typography component={'span'} className={classes.enableButton}>
                    <IconButton
                        onClick={() => setEditDialog(true)}
                    >
                        <EditIcon />
                    </IconButton>
                    {expertMode &&
                        <Tooltip title={t('Host Base Settings')}>
                            <div>
                                <IconButton disabled={!alive} onClick={setBaseSettingsDialog}>
                                    <BuildIcon className={classes.baseSettingsButton} />
                                </IconButton>
                            </div>
                        </Tooltip>
                    }
                    <Tooltip title={t('Restart host')}>
                        <div>
                            <IconButton disabled={!alive} onClick={e => {
                                e.stopPropagation();
                                socket.restartController(_id)
                                    .catch(e => window.alert(`Cannot restart: ${e}`));
                            }}>
                                <CachedIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    {(upgradeAvailable || (!alive && !currentHost)) ? <Tooltip title={t(alive || currentHost ? 'Upgrade' : 'Remove')}>
                        <IconButton onClick={(alive || currentHost) ? dialogUpgrade : executeCommandRemove}>
                            {(alive || currentHost) ? <RefreshIcon /> : <DeleteIcon />}
                        </IconButton>
                    </Tooltip> : <div className={classes.emptyButton} />}
                </Typography>
            </div>
        </CardContent>
    </Card>;
}

HostCard.propTypes = {
    t: PropTypes.func,
    systemConfig: PropTypes.object,
};

export default withStyles(styles)(HostCard);