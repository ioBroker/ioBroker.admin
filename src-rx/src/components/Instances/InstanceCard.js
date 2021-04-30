import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import {Button, Card, CardContent, CardMedia, Fab, FormControl, Hidden, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography} from '@material-ui/core';

import MoreVertIcon from '@material-ui/icons/MoreVert';
import RefreshIcon from '@material-ui/icons/Refresh';
import BuildIcon from '@material-ui/icons/Build';
import InputIcon from '@material-ui/icons/Input';
import DeleteIcon from '@material-ui/icons/Delete';
import LowPriorityIcon from '@material-ui/icons/LowPriority';
import MemoryIcon from '@material-ui/icons/Memory';
import ScheduleIcon from '@material-ui/icons/Schedule';
import ViewCompactIcon from '@material-ui/icons/ViewCompact';
import EditIcon from '@material-ui/icons/Edit';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import HostIcon from '@material-ui/icons/Storage';

import { green, red } from '@material-ui/core/colors';

import ComplexCron from '@iobroker/adapter-react/Dialogs/ComplexCron';
import I18n from '@iobroker/adapter-react/i18n';
import Icon from '@iobroker/adapter-react/Components/Icon';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

import sentry from '../../assets/sentry.svg';
import InstanceInfo from './InstanceInfo';
import State from '../State';
import CustomModal from '../CustomModal';
import LinksDialog from './LinksDialog';

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
        }
    },
    imageBlock: {
        background: 'silver',
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
    greenText: {
        color: theme.palette.success.dark,
    },

    collapse: {
        height: '100%',
        backgroundColor: theme.palette.type === 'dark' ? '#4a4a4a' : '#d4d4d4',
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
    versionDate: {
        alignSelf: 'center'
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
    hide: {
        visibility: 'hidden'
    },
    button: {
        padding: '5px',
        transition: 'opacity 0.2s',
        height: 34,
    },
    visibility: {
        opacity: 0
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
    cardContent: {
        marginTop: 16,
        paddingTop: 0
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)'
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    marginTop10: {
        marginTop: 10
    },
    memoryIcon: {
        color: '#dc8e00',
    },
    displayFlex: {
        display: 'flex',
    },
    logLevel: {
        width: '100%',
        marginBottom: 5
    },
    hostInfo: {
        width: '100%'
    },
    overflowAuto: {
        overflow: 'auto'
    },
    collapseIcon: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: theme.palette.type === 'dark' ? '#4a4a4a' : '#d4d4d4',
        zIndex: 2
    },
    addCompact: {
        width: '100%',
        marginBottom: 5
    },
    addCompactButton: {
        display: 'flex',
        margin: 5,
        justifyContent: 'space-around'
    },
    scheduleIcon: {
        color: '#dc8e00'
    },
    marginRight5: {
        marginRight: 5
    },
    marginLeft5: {
        marginLeft: 5
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.7)'
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
});

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];
const arrayTier = [{ value: 1, desc: "1: Logic adapters" }, { value: 2, desc: "2: Data provider adapters" }, { value: 3, desc: "3: Other adapters" }];

const InstanceCard = memo(({
    name,
    classes,
    image,
    expertMode,
    hidden,
    instance,
    running,
    id,
    extendObject,
    openConfig,
    connectedToHost,
    alive,
    connected,
    getMemory,
    loglevelIcon,
    getRestartSchedule,
    getSchedule,
    key,
    checkCompact,
    compactGroup,
    setCompactGroup,
    compactGroupCount,
    setCompact,
    compact,
    supportCompact,
    checkSentry,
    currentSentry,
    setSentry,
    setRestartSchedule,
    setName,
    logLevel,
    setLogLevel,
    inputOutput,
    mode,
    setSchedule,
    deletedInstances,
    memoryLimitMB,
    setMemoryLimitMB,
    t,
    tier,
    setTier,
    themeType,
    adminInstance,
    setHost,
    host,
    hosts
}) => {
    const [mouseOver, setMouseOver] = useState(false);

    const [openCollapse, setCollapse] = useState(false);
    const [openSelectCompactGroup, setOpenSelectCompactGroup] = useState(false);
    const [openDialogCron, setOpenDialogCron] = useState(false);
    const [openDialogSchedule, setOpenDialogSchedule] = useState(false);
    const [openDialogText, setOpenDialogText] = useState(false);
    const [openDialogLogLevel, setOpenDialogLogLevel] = useState(false);
    const [openDialogDelete, setOpenDialogDelete] = useState(false);
    const [openDialogMemoryLimit, setOpenDialogMemoryLimit] = useState(false);
    const [openDialogHost, setOpenDialogHost] = useState(false);
    const [openDialogCompact, setOpenDialogCompact] = useState(false);
    const [openDialogTier, setOpenDialogTier] = useState(false);

    const [showLinks, setShowLinks] = useState(false);
    const [showStopAdminDialog, setShowStopAdminDialog] = useState(false);

    const [logLevelValue, setLogLevelValue] = useState(logLevel);
    const [compactValue, setCompactValue] = useState(compactGroup || 0);
    const [compactGroupCountValue, setCompactGroupCountValue] = useState(compactGroupCount);
    const [tierValue, setTierValue] = useState(tier);
    const [hostValue, setHostValue] = useState(host);

    let showModal = false;
    let title;
    let help = '';
    if (openDialogText) {
        title = t('Enter title for %s', instance.id);
        showModal = true;
    } else if (openDialogLogLevel) {
        title = t('Edit log level rule for %s', instance.id);
        showModal = true;
    } else if (openDialogDelete) {
        title = t('Please confirm');
        showModal = true;
    } else if (openDialogMemoryLimit) {
        title = t('Edit memory limit rule for %s', instance.id);
        help = t('Default V8 has a memory limit of 512mb on 32-bit systems, and 1gb on 64-bit systems. The limit can be raised by setting --max-old-space-size to a maximum of ~1gb (32-bit) and ~1.7gb (64-bit)');
        showModal = true;
    } else if (openDialogHost) {
        title = t('Edit host for %s', instance.id);
        showModal = true;
    } else if (openDialogCompact) {
        title = t('Edit compact groups for %s', instance.id);
        showModal = true;
    } else if (openDialogTier) {
        title = t('Set tier for %s', instance.id);
        help = t('Tiers define the order of adapters when the system starts.');
        showModal = true;
    }

    const customModal = showModal ? <CustomModal
        title={title}
        help={help}
        open={true}
        applyDisabled={openDialogText || openDialogMemoryLimit}
        textInput={openDialogText || openDialogMemoryLimit}
        defaultValue={openDialogText ? name : openDialogMemoryLimit ? memoryLimitMB : ''}
        onApply={value => {
            if (openDialogLogLevel) {
                setLogLevel(instance, logLevelValue)
                setOpenDialogLogLevel(false);
            } else if (openDialogText) {
                setName(instance, value);
                setOpenDialogText(false);
            } else if (openDialogDelete) {
                setOpenDialogDelete(false);
                deletedInstances(instance);
            } else if (openDialogMemoryLimit) {
                setMemoryLimitMB(instance, value)
                setOpenDialogMemoryLimit(false);
            } else if (openDialogCompact) {
                setCompactGroup(instance, compactValue);
                setOpenDialogCompact(false);
            } else if (openDialogTier) {
                setTier(instance, tierValue);
                setOpenDialogTier(false);
            } else if (openDialogHost) {
                setHost(instance, hostValue);
                setOpenDialogHost(false);
            }
        }}
        onClose={() => {
            if (openDialogLogLevel) {
                setLogLevelValue(logLevel);
                setOpenDialogLogLevel(false);
            } else if (openDialogText) {
                setOpenDialogText(false);
            } else if (openDialogDelete) {
                setOpenDialogDelete(false);
            } else if (openDialogMemoryLimit) {
                setOpenDialogMemoryLimit(false);
            } else if (openDialogCompact) {
                setCompactValue(compactGroup);
                setCompactGroupCountValue(compactGroupCount);
                setOpenDialogCompact(false);
            } else if (openDialogTier) {
                setTierValue(tier);
                setOpenDialogTier(false);
            } else if (openDialogHost) {
                setHostValue(host);
                setOpenDialogHost(false);
            }
        }}
    >
        {openDialogLogLevel && <FormControl className={classes.logLevel} variant="outlined" >
            <InputLabel>{t('log level')}</InputLabel>
            <Select
                variant="standard"
                value={logLevelValue}
                fullWidth
                onChange={el => setLogLevelValue(el.target.value)}
            >
                {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                    {t(el)}
                </MenuItem>)}
            </Select>
        </FormControl>}
        {openDialogCompact && <FormControl className={classes.addCompact} variant="outlined" >
            <InputLabel>{t('compact groups')}</InputLabel>
            <Select
                variant="standard"
                autoWidth
                onClose={e => setOpenSelectCompactGroup(false)}
                onOpen={e => setOpenSelectCompactGroup(true)}
                open={openSelectCompactGroup}
                value={compactValue === 1 ? 'default' : compactValue === '0' ? "controller" : !compactValue ? 'default' : compactValue || 'default'}
                onChange={el => setCompactValue(el.target.value)}
            >
                <div onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                    className={classes.selectStyle}>
                    <Button onClick={e => {
                        setOpenSelectCompactGroup(false);
                        setCompactValue(compactGroupCountValue + 1);
                        setCompactGroupCountValue(compactGroupCountValue + 1);
                    }} variant="outlined" stylevariable='outlined'>{t('Add compact group')}</Button>
                </div>
                <MenuItem value="controller">
                    {t('with controller')}
                </MenuItem>
                <MenuItem value="default">
                    {t('default group')}
                </MenuItem>
                {Array(compactGroupCountValue - 1).fill().map((_, idx) => <MenuItem key={idx} value={idx + 2}>
                    {idx + 2}
                </MenuItem>)}
            </Select>
        </FormControl>}
        {openDialogTier && <FormControl className={classes.logLevel} variant="outlined" >
            <InputLabel>{t('Tiers')}</InputLabel>
            <Select
                variant="standard"
                value={tierValue}
                fullWidth
                onChange={el => setTierValue(el.target.value)}
            >
                {arrayTier.map(el => <MenuItem key={el.value} value={el.value}>
                    {t(el.desc)}
                </MenuItem>)}
            </Select>
        </FormControl>}
        {openDialogDelete && t('Are you sure you want to delete the instance %s?', instance.id)}
        {openDialogHost && <FormControl className={classes.hostInfo} variant="outlined">
            <InputLabel>{t('Host')}</InputLabel>
            <Select
                variant="standard"
                value={hostValue}
                fullWidth
                onChange={el => setHostValue(el.target.value)}
            >
                {hosts.map(item => <MenuItem key={item._id} value={item.common?.hostname || item._id.replace(/^system\.host\./, '')}>
                    <Icon src={item.common.icon}/>{item.common?.name || item._id}
                </MenuItem>)}
            </Select>
        </FormControl>}
    </CustomModal>
    : null;

    const stopAdminDialog = showStopAdminDialog ? <ConfirmDialog
        title={t('Please confirm')}
        text={t('stop_admin', adminInstance)}
        ok={t('Stop admin')}
        onClose={result => {
            if (result) {
                extendObject(showStopAdminDialog, { common: { enabled: false } });
            }
            setShowStopAdminDialog(false);
        }}
    /> : null;

    const secondCardInfo = openCollapse || mouseOver ?
        <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent classes={{ root: classes.cardContent }} className={classes.overflowAuto}>
                <div className={classes.collapseIcon}>
                    <div className={classes.close} onClick={() => setCollapse(false)} />
                </div>
                <Typography gutterBottom component={'span'} variant={'body2'}>
                    {instance.mode === 'daemon' && <State state={connectedToHost} >{t('Connected to host')}</State>}

                    {instance.mode === 'daemon' && <State state={alive} >{t('Heartbeat')}</State>}

                    {connected !== null &&
                        <State state={connected}>{t('Connected to %s', instance.adapter)}</State>}

                    <InstanceInfo tooltip={t('Installed')}>
                        v {instance.version}
                    </InstanceInfo>

                    <InstanceInfo icon={<MemoryIcon />} tooltip={t('RAM usage')}>
                        {(instance.mode === 'daemon' && running ? getMemory(id) : '-.--') + ' MB'}
                    </InstanceInfo>

                    {expertMode &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo icon={<ImportExportIcon />} tooltip={t('events')}>
                                <div className={classes.displayFlex}>
                                    <Tooltip title={t('input events')}>
                                        <div className={classes.marginRight5}>⇥{inputOutput.stateInput}</div>
                                    </Tooltip>
                                    /
                                    <Tooltip title={t('output events')}>
                                        <div className={classes.marginLeft5}>↦{inputOutput.stateOutput}</div>
                                    </Tooltip>
                                </div>
                            </InstanceInfo>
                        </div>
                    }

                    {expertMode && <div className={classes.displayFlex}>
                        <InstanceInfo
                            icon={<MemoryIcon className={classes.memoryIcon} />}
                            tooltip={t('RAM limit')}
                        >
                            {(memoryLimitMB ? memoryLimitMB : '-.--') + ' MB'}
                        </InstanceInfo>
                        <Tooltip title={t('Edit')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => setOpenDialogMemoryLimit(true)}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    </div>}

                    {expertMode && <div className={classes.displayFlex}>
                        <InstanceInfo icon={loglevelIcon} tooltip={t('loglevel')}>
                            {logLevel}
                        </InstanceInfo>
                        <Tooltip title={t('Edit')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => setOpenDialogLogLevel(true)}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    </div>}

                    {mode && <div className={classes.displayFlex}>
                        <InstanceInfo icon={<ScheduleIcon />} tooltip={t('schedule_group')}>
                            {getSchedule(id) || '-'}
                        </InstanceInfo>
                        <Tooltip title={t('Edit')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => setOpenDialogSchedule(true)}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    </div>}

                    {expertMode && (instance.mode === 'daemon') &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo
                                icon={<ScheduleIcon className={classes.scheduleIcon} />}
                                tooltip={t('restart')}
                            >
                                {getRestartSchedule(id) || '-'}
                            </InstanceInfo>
                            <Tooltip title={t('Edit')}>
                                <IconButton
                                    size="small"
                                    className={classes.button}
                                    onClick={() => setOpenDialogCron(true)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    }

                    {expertMode && checkCompact && compact && supportCompact &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo icon={<ViewCompactIcon className={classes.marginRight} color="inherit" />} tooltip={t('compact groups')}>
                                {compactGroup === 1 ? 'default' : compactGroup === '0' ? "controller" : !compactGroup ? 'default' : compactGroup || 'default'}
                            </InstanceInfo>
                            <Tooltip title={t('Edit')}>
                                <IconButton
                                    size="small"
                                    className={classes.button}
                                    onClick={e => {
                                        setOpenDialogCompact(true);
                                        e.stopPropagation();
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        </div>}

                    {expertMode && <div className={classes.displayFlex}>
                        <InstanceInfo icon={<LowPriorityIcon className={classes.marginRight} color="inherit" />} tooltip={t('Start order (tier)')}>
                            {instance.adapter === 'admin' ? t('Always first') : (arrayTier.find(el => el.value === tier)?.desc || arrayTier[2])}
                        </InstanceInfo>
                        {instance.adapter !== 'admin' ? <Tooltip title={t('Edit start order (tier)')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={e => {
                                    setOpenDialogTier(true);
                                    e.stopPropagation();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip> : null}
                    </div>}

                    {hosts.length > 1 || (hosts.length && hosts[0].common?.hostname !== host) ? <div className={clsx(classes.displayFlex, classes.maxWidth300)}>
                        <InstanceInfo icon={<HostIcon className={classes.marginRight} />} tooltip={t('Host for this instance')}>
                            {host}
                        </InstanceInfo>
                        <Tooltip title={t('Edit')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={event => {
                                    setOpenDialogHost(true);
                                    event.stopPropagation();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    </div> : null}

                    <Hidden smUp>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={() => openConfig(id)}
                        >
                            <BuildIcon />
                        </IconButton>
                    </Hidden>
                </Typography>
            </CardContent>

            <div className={classes.footerBlock}>
                <div className={classes.displayFlex}>
                    <Tooltip title={t('Delete')}>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={() => setOpenDialogDelete(true)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </div>

                {expertMode && checkSentry && <div className={classes.displayFlex}>
                    <Tooltip title="sentry">
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={setSentry}
                        >
                            <CardMedia
                                className={clsx(classes.sentry, !currentSentry && classes.contrast0)}
                                component="img"
                                image={sentry}
                            />
                        </IconButton>
                    </Tooltip>
                </div>}

                {supportCompact && expertMode && checkCompact && <div className={classes.displayFlex}>
                    <Tooltip title={t('compact groups')}>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={setCompact}
                        >
                            <ViewCompactIcon color={!!compact ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                </div>}
            </div>
        </div> : null;

    const linksDialog = showLinks ? <LinksDialog
        image={image}
        instanceId={instance.id}
        links={instance.links}
        onClose={() => setShowLinks(false)}
        t={t}
        themeType={themeType}
    /> : null;

    const cronDialog = (openDialogCron || openDialogSchedule) &&
        <ComplexCron
            title={
                (openDialogCron && t('Edit restart rule for %s', instance.id)) ||
                (openDialogSchedule && t('Edit schedule rule for %s', instance.id))
            }
            cron={openDialogCron ? getRestartSchedule(id) : getSchedule(id)}
            language={I18n.getLanguage()}
            onOk={cron => {
                if (openDialogCron) {
                    setRestartSchedule(cron);
                } else if (openDialogSchedule) {
                    setSchedule(cron);
                }
            }}
            onClose={() => {
                if (openDialogCron) {
                    setOpenDialogCron(false);
                } else if (openDialogSchedule) {
                    setOpenDialogSchedule(false);
                }
            }}
        />;

    const [visibleEdit, handlerEdit] = useState(false);

    return <Card key={key} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        {customModal}
        {stopAdminDialog}
        {cronDialog}
        {secondCardInfo}
        {linksDialog}

        <div className={clsx(
            classes.imageBlock,
            (!connectedToHost || !alive) && classes.instanceStateNotAlive1,
            connectedToHost && alive && connected === false && classes.instanceStateAliveNotConnected1,
            connectedToHost && alive && connected !== false && classes.instanceStateAliveAndConnected1
        )}>
            <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
            <div className={classes.adapter}>{instance.id}</div>
            <div className={classes.versionDate}>
                {/* {expertMode && checkCompact && <Tooltip title={t('compact groups')}>
                    <ViewCompactIcon color="action" style={{ margin: 10 }} />
                </Tooltip>} */}
            </div>
            <Fab
                onMouseOver={() => setMouseOver(true)}
                onMouseOut={() => setMouseOver(false)}
                onClick={() => setCollapse(true)}
                className={classes.fab}
                color="primary"
                aria-label="add"
            >
                <MoreVertIcon />
            </Fab>
        </div>

        <CardContent className={classes.cardContentH5}>
            <Typography gutterBottom variant="h5" component="h5">
                <div
                    onMouseMove={() => handlerEdit(true)}
                    onMouseEnter={() => handlerEdit(true)}
                    onMouseLeave={() => handlerEdit(false)}
                    className={classes.displayFlex}>
                    {name}
                    <Tooltip title={t('Edit')}>
                        <IconButton
                            size="small"
                            className={clsx(classes.button, !visibleEdit && classes.visibility)}
                            onClick={() => setOpenDialogText(true)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            </Typography>

            <div className={classes.marginTop10}>
                <Typography component={'span'} className={classes.enableButton}>
                    <Tooltip title={t('Start/stop')}>
                        <div><IconButton
                            size="small"
                            onClick={event => {
                                event.stopPropagation();
                                if (running && instance.id === adminInstance) {

                                } else {
                                    extendObject('system.adapter.' + instance.id, { common: { enabled: !running } });
                                }
                            }}
                            onFocus={event => event.stopPropagation()}
                            className={clsx(classes.button, instance.canStart ? (running ? classes.enabled : classes.disabled) : classes.hide)}
                        >
                            {running ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        </div>
                    </Tooltip>
                    <Hidden xsDown>
                        <Tooltip title={t('Settings')}>
                            <IconButton
                                size="small"
                                className={clsx(classes.button, !instance.config && classes.visibility)}
                                onClick={() => openConfig(id)}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Tooltip>
                    </Hidden>
                    <Tooltip title={t('Restart')}>
                        <div>
                            <IconButton
                                size="small"
                                onClick={event => {
                                    extendObject('system.adapter.' + instance.id, {});
                                    event.stopPropagation();
                                }}
                                onFocus={event => event.stopPropagation()}
                                className={clsx(classes.button, !instance.canStart && classes.hide)}
                                disabled={!running}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    <Tooltip title={t('Instance link %s', instance.id)}>
                        <div>
                            <IconButton
                                size="small"
                                className={clsx(classes.button, (!instance.links || !instance.links[0]) && classes.hide)}
                                disabled={!running}
                                onClick={event => {
                                    event.stopPropagation()
                                    if (instance.links.length === 1) {
                                        window.open(instance.links[0].link, instance.id);
                                    } else {
                                        setShowLinks(true);
                                    }
                                }}
                                onFocus={event => event.stopPropagation()}
                            >
                                <InputIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                </Typography>
            </div>
        </CardContent>
    </Card>
})

InstanceCard.propTypes = {
    t: PropTypes.func,
    themeType: PropTypes.string,
    adminInstance: PropTypes.string,
    hosts: PropTypes.array,
    setHost: PropTypes.func,
    host: PropTypes.string,
};

export default withStyles(styles)(InstanceCard);