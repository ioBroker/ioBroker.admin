import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';

import { Avatar, Badge, CardContent, CardMedia, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import CachedIcon from '@mui/icons-material/Cached';

import Utils from '@iobroker/adapter-react-v5/Components/Utils';

import Adapters from '../../tabs/Adapters';
import CustomModal from '../CustomModal';
import { amber, blue, grey, red } from '@mui/material/colors';
import CopyIcon from "@iobroker/adapter-react-v5/icons/IconCopy";

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = theme => ({
    root: {
        position: 'relative',
        margin: 7,
        background: theme.palette.background.default,
        boxShadow,
        // display: 'flex',
        overflow: 'hidden',
        transition: 'box-shadow 0.5s,height 0.3s',
        '&:hover': {
            boxShadow: boxShadowHover
        }
    },
    imageBlock: {
        marginRight: 6,
        minHeight: 60,
        width: '100%',
        maxWidth: 300,
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
    collapse: {
        height: 160,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        // position: 'absolute',
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
        height: 0
    },
    collapseOn: {
        animation: '$height 1s'
    },
    '@keyframes height': {
        '0%': {
            height: 0
        },
        '100%': {
            height: 160,
        }
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
    onOff: {
        alignSelf: 'center',
        width: 4,
        height: '100%',
        // borderRadius: 20,
        // position: 'absolute',
        // top: 5,
        // right: 5,
    },
    host: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        paddingLeft: 8,
        alignSelf: 'center',
        color: theme.palette.mode === 'dark' ? '#ddd' : '#222',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        width: '100%',
        // flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px !important',
        alignItems: 'center'
    },
    marginTop10: {
        // marginTop: 10
        marginLeft: 'auto',
        display: 'flex'
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    emptyButton: {
        width: 48,
    },
    green: {
        background: '#00ce00',
        position: 'relative',
        overflow: 'hidden'
    },
    dotLine: {
        width: 10,
        height: 20,
        background: 'linear-gradient( rgba(0,206,0,0.7497373949579832) 0%, rgba(31,255,1,1) 50%, rgba(0,206,0,0.7805497198879552) 100%)',
        zIndex: 2,
        position: 'absolute',
        top: -21,
        // animation: '$colors 3s ease-in-out infinite'
    },
    '@keyframes colors': {
        '0%': {
            top: -21
        },
        '100%': {
            top: '101%'
        }
    },
    red: {
        background: '#da0000',
        // animation: '$red 3s ease-in-out infinite alternate'
    },
    '@keyframes red': {
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0.80
        }
    },
    flex: {
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },

    cardContentInfo: {
        overflow: 'auto',
        paddingTop: 0,
        justifyContent: 'center',
        display: 'flex',
        height: '100%',
        position: 'relative',
        // alignItems: 'center'
    },
    cursorNoDrop: {
        cursor: 'no-drop !important'
    },
    wrapperFlex: {
        display: 'flex', cursor: 'pointer',
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
    wrapperColor: {
        position: 'relative',
        overflow: 'hidden'
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
    '@media screen and (max-width: 500px)': {
        wrapperFlex: {
            flexDirection: 'column'
        },
    },
    badge: {
        top: 14
    },
    greenText: {
        color: theme.palette.success.dark,
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center'
    },
    wrapperAvailable: {
        display: 'flex',
        alignItems: 'center'
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
            background: '#00800026'
        }
    },
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10
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
    smallAvatar: {
        width: 24,
        height: 24
    },
    formControl: {
        display: 'flex'
    },
    baseSettingsButton: {
        transform: 'rotate(45deg)',
    },
    newValue: {
        animation: '$newValueAnimation 2s ease-in-out'
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
        }
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

const StyledBadge = withStyles((theme) => ({
    badge: {
        right: -3,
        top: 13,
        padding: '0 4px',
    },
}))(Badge);

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];

function toggleClassName(el, name) {
    const classNames = el.className.split(' ');
    const pos = classNames.indexOf(name);
    if (pos !== -1) {
        classNames.splice(pos, 1);
        el.className = classNames.join(' ');
    }
    classNames.push(name);
    //el.className = classNames.join(' ');
    setTimeout(_classNames => el.className = _classNames, 100, classNames.join(' '));
}

const HostRow = ({
    _id,
    alive,
    available,
    classes,
    color,
    isCurrentHost,
    description,
    events,
    executeCommandRemove,
    expertMode,
    getLogLevelIcon,
    formatInfo,
    hidden,
    hostsWorker,
    hostData,
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
}) => {
    const [openCollapse, setCollapse] = useState(false);
    const [focused, setFocused] = useState(false);

    const refEvents = useRef();
    const refWarning = useRef();
    const refCpu = useRef();
    const refMem = useRef();
    const refUptime = useRef();

    const eventsInputFunc = (_, input) => {
        inputCache = input && input.val !== null ? `⇥${input.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
            toggleClassName(refEvents.current, classes.newValue);
        }
    };

    const eventsOutputFunc = (_, output) => {
        outputCache = output && output.val !== null ? `↦${output.val}` : '-';
        if (refEvents.current) {
            refEvents.current.innerHTML = `${inputCache} / ${outputCache}`;
            toggleClassName(refEvents.current, classes.newValue);
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
                refWarning.current.setAttribute('title', t('Warning: Free space on disk is low'));
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
            toggleClassName(refCpu.current, classes.newValue);
        }
    }

    const memFunc = (_, state) => {
        memCache = formatValue(state, '%');
        if (refMem.current) {
            refMem.current.innerHTML = memCache;
            toggleClassName(refMem.current, classes.newValue);
        }
    }

    const uptimeFunc = (_, state) => {
        if (state && state.val) {
            const d = Math.floor(state.val / (3600 * 24));
            const h = Math.floor(state.val % (3600 * 24) / 3600);
            uptimeCache = d ? `${d}d${h}h` : `${h}h`; // TODO translate
        }
        if (refUptime.current) {
            refUptime.current.innerHTML = uptimeCache;
            toggleClassName(refUptime.current, classes.newValue);
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

    const logLevelFunc = (name, state) => {
        if (state) {
            setLogLevelValue(state.val);
            setLogLevelValueSelect(state.val);
        }
    }

    useEffect(() => {
        const notificationHandler = notifications =>
            notifications && notifications[_id] && setErrorHost({ notifications: notifications[_id], count: calculateWarning(notifications[_id]) });

        hostsWorker.registerNotificationHandler(notificationHandler);

        hostsWorker.getNotifications(_id)
            .then(notifications => {
                notifications && notifications[_id] && setErrorHost({ notifications: notifications[_id], count: calculateWarning(notifications[_id]) });
            });

        socket.subscribeState(`${_id}.inputCount`, eventsInputFunc);
        socket.subscribeState(`${_id}.outputCount`, eventsOutputFunc);

        socket.subscribeState(`${_id}.cpu`, cpuFunc);
        socket.subscribeState(`${_id}.mem`, memFunc);
        socket.subscribeState(`${_id}.uptime`, uptimeFunc);

        socket.subscribeState(`${_id}.diskFree`, warningFunc);
        socket.subscribeState(`${_id}.diskSize`, warningFunc);
        socket.subscribeState(`${_id}.diskWarning`, warningFunc);

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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_id, socket, classes]);


    const [openDialogLogLevel, setOpenDialogLogLevel] = useState(false);
    const [logLevelValue, setLogLevelValue] = useState(null);
    const [logLevelValueSelect, setLogLevelValueSelect] = useState(null);

    const upgradeAvailable = true || (isCurrentHost || alive) && Adapters.updateAvailable(installed, available);

    const onCopy = () => {
        let text = [];
        refCpu.current    && text.push(`CPU: ${refCpu.current.innerHTML}`);
        refMem.current    && text.push(`RAM: ${refMem.current.innerHTML}`);
        refUptime.current && text.push(`${t('Uptime')}: ${refUptime.current.innerHTML}`);
        text.push(`${t('Available')}: ${available}`);
        text.push(`${t('Installed')}: ${installed}`);
        refEvents.current && text.push(`${t('Events')}: ${refEvents.current.innerHTML}`);

        hostData && typeof hostData === 'object' && Object.keys(hostData).map(value =>
            text.push(`${t(value)}: ${formatInfo[value] ? formatInfo[value](hostData[value], t) : hostData[value] || '--'}`));

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
        open={true}
        onApply={_ => {
            if (openDialogLogLevel) {
                socket.setState(`${_id}.logLevel`, logLevelValueSelect);
                setOpenDialogLogLevel(false);
            }
        }}
        onClose={_ => {
            if (openDialogLogLevel) {
                setLogLevelValueSelect(logLevelValue);
                setOpenDialogLogLevel(false);
            }
        }}>
        {openDialogLogLevel && <FormControl className={classes.formControl} variant="outlined" >
            <InputLabel>{t('log level')}</InputLabel>
            <Select
                variant="standard"
                value={logLevelValueSelect}
                fullWidth
                onChange={el =>
                    setLogLevelValueSelect(el.target.value)}
            >
                {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                    {t(el)}
                </MenuItem>)}
            </Select>
        </FormControl>}
        {openDialogLogLevel && <FormControl className={classes.formControl} variant="outlined" >
            <FormHelperText>{t('Log level will be reset to the saved level after the restart of the controller')}</FormHelperText>
            <FormHelperText>{t('You can set the log level permanently in the base host settings')}<BuildIcon className={classes.baseSettingsButton} /></FormHelperText>
        </FormControl>}
    </CustomModal> : null;

    return <div
        style={{ border: `2px solid ${color || 'inherit'}`, borderRadius: 5 }}
        onMouseOut={openDialogLogLevel ? null : () => setFocused(false)}
        onMouseOver={openDialogLogLevel ? null : () => setFocused(true)}
        onMouseMove={openDialogLogLevel ? null : () => setFocused(true)}
        key={_id} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        {customModal}
        <div className={clsx(classes.wrapperFlex, !alive && classes.cursorNoDrop)} onClick={openDialogLogLevel ? null : () => setCollapse(bool => !bool)}>
            <div className={classes.wrapperColor}>
                <div className={clsx(classes.onOff, alive ? classes.green : classes.red)} />
                {alive && <div className={classes.dotLine} />}
            </div>
            <div
                ref={refWarning}
                style={{ background: color || 'inherit' }}
                className={classes.imageBlock}>
                <StyledBadge
                    title={t('Hosts notifications')}
                    badgeContent={errorHost.count}
                    color="error"
                    onClick={e => {
                        e.stopPropagation();
                        showAdaptersWarning({ [_id]: errorHost.notifications }, socket, _id);
                    }}
                >
                    <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
                </StyledBadge>
                <div style={{ color: (color && Utils.invertColor(color, true)) || 'inherit' }} className={classes.host}>
                    {name}
                </div>
            </div>
            <CardContent className={classes.cardContentH5}>
                {/*<Typography className={clsx(classes.flex, classes.hidden600)} variant="body2" color="textSecondary" component="p">
                    {title}
                </Typography>*/}
                <Typography className={clsx(classes.flex, classes.hidden800)} variant="body2" color="textSecondary" component="div">
                    <div ref={refCpu}>{'- %'}</div>
                </Typography>
                <Typography className={clsx(classes.flex, classes.hidden800)} variant="body2" color="textSecondary" component="div">
                    <div ref={refMem}>{'- %'}</div>
                </Typography>
                <Typography className={clsx(classes.flex, classes.hidden800)} variant="body2" color="textSecondary" component="div">
                    <div ref={refUptime}>{'-/-'}</div>
                </Typography>
                <Typography className={clsx(classes.flex, classes.hidden1100)} variant="body2" color="textSecondary" component="div">
                    <div className={clsx(upgradeAvailable && classes.greenText, classes.curdContentFlexCenter)} >
                        {upgradeAvailable ?
                            <Tooltip title={t('Update')}>
                                <div
                                    onClick={e => {
                                        e.stopPropagation();
                                        openHostUpdateDialog();
                                    }}
                                    className={classes.buttonUpdate}
                                >
                                    <IconButton
                                        className={classes.buttonUpdateIcon}
                                        size="small"
                                    >
                                        <RefreshIcon />
                                    </IconButton>{available}
                                </div>
                            </Tooltip> :
                            available
                        }</div>
                </Typography>
                <Typography className={clsx(classes.flex, classes.hidden1100)} variant="body2" color="textSecondary" component="p">
                    {installed}
                </Typography>
                <Typography className={clsx(classes.flex, classes.hidden600)} variant="body2" color="textSecondary" component="div">
                    <div ref={refEvents}>{events}</div>
                </Typography>
                <div className={classes.marginTop10}>
                    <Typography component={'span'} className={classes.enableButton}>
                        <IconButton size="large"
                            onClick={e => {
                                e.stopPropagation();
                                setEditDialog(true);
                            }}
                        >
                            <EditIcon />
                        </IconButton>

                        {expertMode &&
                            <Tooltip title={t('Host Base Settings')}>
                                <div>
                                    <IconButton size="large" disabled={!alive} onClick={e => {
                                        setBaseSettingsDialog();
                                        e.stopPropagation();
                                    }}>
                                        <BuildIcon className={classes.baseSettingsButton} />
                                    </IconButton>
                                </div>
                            </Tooltip>
                        }
                        <Tooltip title={t('Restart host')}>
                            <div>
                                <IconButton size="large" disabled={!alive} onClick={e => {
                                    e.stopPropagation();
                                    socket.restartController(_id)
                                        .catch(e => window.alert(`Cannot restart: ${e}`));
                                }}>
                                    <CachedIcon />
                                </IconButton>
                            </div>
                        </Tooltip>
                        {expertMode && logLevelValue ?
                            <Tooltip title={`${t('loglevel')} ${logLevelValue}`}>
                                <IconButton size="large" onClick={event => {
                                    event.stopPropagation();
                                    setOpenDialogLogLevel(true);
                                }}>
                                    <Avatar className={clsx(classes.smallAvatar, classes[logLevelValue])}>
                                        {getLogLevelIcon(logLevelValue)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip> : <div className={classes.emptyButton} />
                        }
                        <Tooltip title={t('Remove')}>
                            <span>
                                <IconButton
                                    size="large"
                                    disabled={alive || isCurrentHost}
                                    title={alive || isCurrentHost ? t('You cannot delete host, when it is alive') : ''}
                                    onClick={e => {
                                        executeCommandRemove();
                                        e.stopPropagation();
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Typography>
                </div>
            </CardContent>
        </div>
        {(openCollapse || focused) && typeof description === 'object' &&
            <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : classes.collapseOn)} onClick={e => e.stopPropagation()}>
                <CardContent className={classes.cardContentInfo}>
                    {description}
                    <Tooltip title={t('Copy')}>
                        <IconButton size="large" onClick={() => onCopy()} style={{ position: 'absolute', top: 8, right: 8 }}>
                            <CopyIcon />
                        </IconButton>
                    </Tooltip>
                </CardContent>
                <div className={classes.footerBlock}>
                </div>
            </div>}
    </div>;
}

HostRow.propTypes = {
    t: PropTypes.func,
    systemConfig: PropTypes.object,
    isCurrentHost: PropTypes.bool,
};

export default withStyles(styles)(HostRow);
