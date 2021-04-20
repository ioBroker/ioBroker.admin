import React, { useState } from 'react';
import { Button, Card, CardContent, CardMedia, Fab, FormControl, Hidden, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import RefreshIcon from '@material-ui/icons/Refresh';
import clsx from 'clsx';
import BuildIcon from '@material-ui/icons/Build';
import InputIcon from '@material-ui/icons/Input';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import MemoryIcon from '@material-ui/icons/Memory';
import ScheduleIcon from '@material-ui/icons/Schedule';
import ViewCompactIcon from '@material-ui/icons/ViewCompact';

import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import I18n from '@iobroker/adapter-react/i18n';
import { green, red } from '@material-ui/core/colors';
import InstanceInfo from './InstanceInfo';
import State from '../State';
import sentry from '../../assets/sentry.svg';
import CustomModal from '../CustomModal';
import EditIcon from '@material-ui/icons/Edit';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import ComplexCron from '@iobroker/adapter-react/Dialogs/ComplexCron';
import PropTypes from "prop-types";

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
const InstanceCard = ({
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
    t
}) => {
    const [openCollapse, setCollapse] = useState(false);
    const [mouseOver, setMouseOver] = useState(false);
    const [openSelect, setOpenSelect] = useState(false);
    const [openDialogCron, setOpenDialogCron] = useState(false);
    const [openDialogSchedule, setOpenDialogSchedule] = useState(false);
    const [openDialogText, setOpenDialogText] = useState(false);
    const [openDialogSelect, setOpenDialogSelect] = useState(false);
    const [openDialogDelete, setOpenDialogDelete] = useState(false);
    const [openDialogMemoryLimit, setOpenDialogMemoryLimit] = useState(false);
    const [select, setSelect] = useState(logLevel);
    const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];

    const customModal =
        openDialogSelect ||
            openDialogText ||
            openDialogDelete ||
            openDialogMemoryLimit ?
            <CustomModal
                title={
                    (openDialogText && t('Enter title for %s', instance.id)) ||
                    (openDialogSelect && t('Edit log level rule for %s', instance.id)) ||
                    (openDialogDelete && t('Please confirm')) ||
                    (openDialogMemoryLimit && t('Edit memory limit rule for %s', instance.id))
                }
                open={true}
                applyDisabled={openDialogText || openDialogMemoryLimit}
                textInput={openDialogText || openDialogMemoryLimit}
                defaultValue={openDialogText ? name : openDialogMemoryLimit ? memoryLimitMB : ''}
                onApply={value => {
                    if (openDialogSelect) {
                        setLogLevel(select)
                        setOpenDialogSelect(false);
                    } else if (openDialogText) {
                        setName(value);
                        setOpenDialogText(false);
                    } else if (openDialogDelete) {
                        setOpenDialogDelete(false);
                        deletedInstances();
                    } else if (openDialogMemoryLimit) {
                        setMemoryLimitMB(value)
                        setOpenDialogMemoryLimit(false);
                    }
                }}
                onClose={() => {
                    if (openDialogSelect) {
                        setSelect(logLevel);
                        setOpenDialogSelect(false);
                    } else if (openDialogText) {
                        setOpenDialogText(false);
                    } else if (openDialogDelete) {
                        setOpenDialogDelete(false);
                    } else if (openDialogMemoryLimit) {
                        setOpenDialogMemoryLimit(false);
                    }
                }}>
                {openDialogSelect && <FormControl className={classes.logLevel} variant="outlined" >
                    <InputLabel htmlFor="outlined-age-native-simple">{t('log level')}</InputLabel>
                    <Select
                        variant="standard"
                        value={select}
                        fullWidth
                        onChange={el => setSelect(el.target.value)}
                    >
                        {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                            {t(el)}
                        </MenuItem>)}
                    </Select>
                </FormControl>}
                {openDialogDelete && t('Are you sure you want to delete the instance %s?', instance.id)}
            </CustomModal>
            : null;

    const secondCardInfo = openCollapse || mouseOver ?
        <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent classes={{ root: classes.cardContent }} className={classes.overflowAuto}>
                <div className={classes.collapseIcon}>
                    <div className={classes.close} onClick={() => setCollapse(false)} />
                </div>
                <Typography gutterBottom component={'span'} variant={'body2'}>
                    {expertMode && checkCompact && compact && <div className={classes.displayFlex}>
                        <FormControl className={classes.addCompact} variant="outlined" >
                            <InputLabel htmlFor="outlined-age-native-simple">{t('compact groups')}</InputLabel>
                            <Select
                                variant="standard"
                                onClose={() => setOpenSelect(false)}
                                onOpen={() => setOpenSelect(true)}
                                open={openSelect}
                                value={compactGroup === undefined ? 1 : compactGroup || '0'}
                                fullWidth
                                onChange={el => setCompactGroup(el.target.value)}
                            >
                                <div className={classes.addCompactButton}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}>
                                    <Button onClick={() => {
                                        setOpenSelect(false);
                                        setCompactGroup(compactGroupCount + 1);
                                    }} variant="outlined" stylevariable='outlined'>{t('Add compact group')}</Button>
                                </div>
                                <MenuItem value='0'>
                                    {t('with controller (0)')}
                                </MenuItem>
                                <MenuItem value={1}>
                                    {t('default group (1)')}
                                </MenuItem>
                                {Array(compactGroupCount - 1).fill().map((_, idx) => <MenuItem key={idx} value={idx + 2}>
                                    {idx + 2}
                                </MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>}
                    {instance.mode === 'daemon' && <State state={connectedToHost} >{t('Connected to host')}</State>}
                    {instance.mode === 'daemon' && <State state={alive} >{t('Heartbeat')}</State>}
                    {connected !== null &&
                        <State state={connected}>{t('Connected to %s', instance.adapter)}</State>
                    }
                    <InstanceInfo icon={<InfoIcon />} tooltip={t('Installed')}>
                        {instance.version}
                    </InstanceInfo>
                    <InstanceInfo icon={<MemoryIcon />} tooltip={t('RAM usage')}>
                        {(instance.mode === 'daemon' && running ? getMemory(id) : '-.--') + ' MB'}
                    </InstanceInfo>
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
                    </div>
                    }
                    {expertMode && <div className={classes.displayFlex}>
                        <InstanceInfo icon={loglevelIcon} tooltip={t('loglevel')}>
                            {logLevel}
                        </InstanceInfo>

                        <Tooltip title={t('Edit')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => setOpenDialogSelect(true)}
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
                    {expertMode &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo icon={<ImportExportIcon />} tooltip={t('events')}>
                                <div className={classes.displayFlex}>
                                    <Tooltip title={t('input events')}>
                                        <div className={classes.marginRight5}>⇥${inputOutput.stateInput}</div>
                                    </Tooltip>
                                /
                                <Tooltip title={t('output events')}>
                                        <div className={classes.marginLeft5}>↦${inputOutput.stateOutput}</div>
                                    </Tooltip>
                                </div>
                            </InstanceInfo>
                        </div>
                    }
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
                {expertMode && checkCompact && <div className={classes.displayFlex}>
                    <Tooltip title={t('compact groups')}>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={setCompact}
                        >
                            <ViewCompactIcon color={compact ? 'primary' : ''} />
                        </IconButton>
                    </Tooltip>
                </div>}
            </div>
        </div> : null;

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
        {cronDialog}
        {secondCardInfo}

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
                    <Tooltip title={t(!running ? 'Deactivated. Click to start.' : 'Activated. Click to stop.')}>
                        <IconButton
                            size="small"
                            onClick={event => {
                                extendObject('system.adapter.' + instance.id, { common: { enabled: !running } });
                                event.stopPropagation();
                            }}
                            onFocus={event => event.stopPropagation()}
                            className={clsx(classes.button, instance.canStart ? (running ? classes.enabled : classes.disabled) : classes.hide)}
                        >
                            {running ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
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
                    <Tooltip title={t('Reload')}>
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
                    </Tooltip>
                    <Tooltip title={t('Open web page of adapter')}>
                        <IconButton
                            size="small"
                            className={clsx(classes.button, (!instance.link || !instance.link[0]) && classes.hide)}
                            disabled={!running}
                            onClick={event => {
                                window.open(instance.link, '_blank');
                                event.stopPropagation();
                            }}
                            onFocus={event => event.stopPropagation()}
                        >
                            <InputIcon />
                        </IconButton>
                    </Tooltip>
                </Typography>
            </div>
        </CardContent>
    </Card>
}

InstanceCard.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    t: PropTypes.func,
};

export default withStyles(styles)(InstanceCard);