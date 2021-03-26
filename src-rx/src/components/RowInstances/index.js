import React, { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Badge, Button, CardMedia, Divider, FormControl, Grid, Hidden, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import clsx from 'clsx';
import BuildIcon from '@material-ui/icons/Build';
import InputIcon from '@material-ui/icons/Input';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import MemoryIcon from '@material-ui/icons/Memory';
import ScheduleIcon from '@material-ui/icons/Schedule';
import ViewCompactIcon from '@material-ui/icons/ViewCompact';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import sentry from '../../assets/sentry.svg';
import EditIcon from '@material-ui/icons/Edit';
import ImportExportIcon from '@material-ui/icons/ImportExport';

import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import I18n from '@iobroker/adapter-react/i18n';
import { amber, blue, green, grey, red } from '@material-ui/core/colors';
import InstanceInfo from '../InstanceInfo';
import State from '../State';
import CustomModal from '../CustomModal';
import ComplexCron from '@iobroker/adapter-react/Dialogs/ComplexCron';

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
    update: {
        background: '#10ff006b'
    },
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
        backgroundColor: 'silver',
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
    cardContent: {
        marginTop: 16,
        paddingTop: 0
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
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
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)'
    },
    hidden1250: {
        display: 'flex'
    },
    visible1250: {
        display: 'none'
    },
    visible1050: {
        display: 'none'
    },
    hidden1050: {
        display: 'flex'
    },
    '@media screen and (max-width: 1250px)': {
        hidden1250: {
            display: 'none !important'
        },
        visible1250: {
            display: 'flex !important'
        },
    },
    '@media screen and (max-width: 1050px)': {
        hidden1050: {
            display: 'none !important'
        },
        visible1050: {
            display: 'flex !important'
        },
    }
});
const RowInstances = ({
    name,
    classes,
    expertMode,
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
    getInstanceState,
    getModeIcon,
    expanded,
    handleChange,
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
    setMemoryLimitMB
}) => {
    const [openSelect, setOpenSelect] = useState(false);
    const [openDialogCron, setOpenDialogCron] = useState(false);
    const [openDialogSchedule, setOpenDialogSchedule] = useState(false);
    const [openDialogText, setOpenDialogText] = useState(false);
    const [openDialogSelect, setOpenDialogSelect] = useState(false);
    const [openDialogDelete, setOpenDialogDelete] = useState(false);
    const [openDialogMemoryLimit, setOpenDialogMemoryLimit] = useState(false);
    const [select, setSelect] = useState(logLevel);
    const arrayLogLevel = [
        'silly', 'debug', 'info', 'warn', 'error'
    ]
    return <Accordion key={key} square
        expanded={expanded === instance.id}
        onChange={() => {
            if (
                openDialogCron ||
                openDialogSchedule ||
                openDialogSelect ||
                openDialogText ||
                openDialogDelete ||
                openDialogMemoryLimit) {
                return
            }
            handleChange(instance.id);
        }}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
        >
            <CustomModal
                title={
                    (openDialogText && I18n.t("Enter title for %s", instance.id)) ||
                    (openDialogSelect && I18n.t("Edit log level rule for %s", instance.id)) ||
                    (openDialogDelete && I18n.t("Please confirm")) ||
                    (openDialogMemoryLimit && I18n.t("Edit memory limit rule for %s", instance.id))
                }
                open={
                    openDialogSelect ||
                    openDialogText ||
                    openDialogDelete ||
                    openDialogMemoryLimit
                }
                applyDisabled={openDialogText || openDialogMemoryLimit}
                textInput={openDialogText || openDialogMemoryLimit}
                defaultValue={openDialogText ? name : openDialogMemoryLimit ? memoryLimitMB : ''}
                onApply={(value) => {
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
                {openDialogSelect && <FormControl style={{ width: '100%', marginBottom: 5 }} variant="outlined" >
                    <InputLabel htmlFor="outlined-age-native-simple">{I18n.t('log level')}</InputLabel>
                    <Select
                        variant="standard"
                        value={select}
                        fullWidth
                        onChange={el => setSelect(el.target.value)}
                    >
                        {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                            {I18n.t(el)}
                        </MenuItem>)}
                    </Select>
                </FormControl>}
                {openDialogDelete && I18n.t("Are you sure you want to delete the instance %s?", instance.id)}
            </CustomModal>
            {(openDialogCron || openDialogSchedule) && <ComplexCron
                title={
                    (openDialogCron && I18n.t("Edit restart rule for %s", instance.id)) ||
                    (openDialogSchedule && I18n.t("Edit schedule rule for %s", instance.id))
                }
                cron={openDialogCron ? getRestartSchedule(id) : getSchedule(id)}
                language={I18n.getLanguage()}
                onOk={(cron) => {
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
            />}
            <Grid container spacing={1} alignItems="center" direction="row" wrap="nowrap">
                <div
                    style={{
                        display: 'flex',
                        minWidth: 200,
                        justifyContent: 'space-around'
                    }}
                >
                    <div>
                        <Avatar className={classes.smallAvatar + ' ' +
                            (instance.mode === 'daemon' || instance.mode === 'schedule' ?
                                classes[getInstanceState(id)] : classes.transparent)}
                        >
                            {getModeIcon(instance.mode)}
                        </Avatar>
                    </div>
                    {expertMode &&
                        <div>
                            <Tooltip title={I18n.t('loglevel') + ' ' + instance.loglevel}>
                                <Avatar className={classes.smallAvatar + ' ' + classes[instance.loglevel]}>
                                    {loglevelIcon}
                                </Avatar>
                            </Tooltip>
                        </div>
                    }
                    <div style={{ display: 'flex' }}>
                        <Badge color="secondary" variant="dot" invisible={!instance.compactMode}>
                            <Avatar
                                variant="square"
                                alt={instance.id}
                                src={instance.image}
                                className={classes.smallAvatar}
                            />
                        </Badge>
                        <div style={{ minWidth: 100, marginLeft: 5, alignSelf: 'center' }}>
                            {instance.id}
                        </div>
                    </div>
                </div>
                <Typography style={{
                    maxWidth: 250
                }} className={classes.secondaryHeading}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 250
                    }}>
                        <div style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            padding: 5,
                            textOverflow: 'ellipsis',
                            maxWidth: 200
                        }}>{name}</div>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={(event) => {
                                setOpenDialogText(true);
                                event.stopPropagation();
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    </div>
                </Typography>
                {expertMode &&
                    <div className={classes.hidden1250} style={{ display: 'flex', minWidth: 200 }}>
                        <InstanceInfo
                            icon={<ImportExportIcon />}
                            tooltip={I18n.t('events')}
                        >
                            <div style={{ display: 'flex' }}>
                                <Tooltip title={I18n.t('input events')}>
                                    <div style={{ marginRight: 5 }}>⇥{inputOutput.stateInput}</div>
                                </Tooltip>
                                    /
                                <Tooltip title={I18n.t('output events')}>
                                    <div style={{ marginLeft: 5 }}>↦{inputOutput.stateOutput}</div>
                                </Tooltip>
                            </div>
                        </InstanceInfo>
                    </div>
                }
                <Grid item className={classes.hidden1050}>
                    <InstanceInfo
                        icon={<MemoryIcon />}
                        tooltip={I18n.t('RAM usage')}
                    >
                        {(instance.mode === 'daemon' && running ? getMemory(id) : '-.--') + ' MB'}
                    </InstanceInfo>
                </Grid>
            </Grid>
            <div style={{ display: 'flex' }}>
                <Tooltip title={I18n.t('sentry')}>
                    <IconButton
                        size="small"
                        className={clsx(classes.button, expertMode && checkSentry ? null : classes.hide)}
                        onClick={(event) => {
                            setSentry();
                            event.stopPropagation();
                        }}
                    >
                        <CardMedia
                            style={currentSentry ? null : { filter: 'contrast(0%)' }}
                            className={classes.sentry}
                            component="img"
                            image={sentry}
                        />
                    </IconButton>
                </Tooltip>
            </div>
            <Tooltip title={I18n.t('compact groups')}>
                <IconButton
                    size="small"
                    className={clsx(classes.button, expertMode && checkCompact ? null : classes.hide)}
                    onClick={(event) => {
                        setCompact();
                        event.stopPropagation();
                    }}
                >
                    <ViewCompactIcon color={compact ? "primary" : "inherit"} />
                </IconButton>
            </Tooltip>

            <IconButton
                size="small"
                onClick={event => {
                    extendObject('system.adapter.' + instance.id, { common: { enabled: !running } });
                    event.stopPropagation();
                }}
                onFocus={event => event.stopPropagation()}
                className={classes.button + ' ' + (instance.canStart ?
                    running ? classes.enabled : classes.disabled : classes.hide)
                }
            >
                {running ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <Hidden xsDown>
                <IconButton
                    size="small"
                    className={classes.button}
                    onClick={() => openConfig(id)}
                >
                    <BuildIcon />
                </IconButton>
            </Hidden>
            <IconButton
                size="small"
                onClick={event => {
                    extendObject('system.adapter.' + instance.id, {});
                    event.stopPropagation();
                }}
                onFocus={event => event.stopPropagation()}
                className={classes.button + ' ' + (instance.canStart ? '' : classes.hide)}
                disabled={!running}
            >
                <RefreshIcon />
            </IconButton>
            <IconButton
                size="small"
                className={classes.button + ' ' + (instance.link ? '' : classes.hide)}
                disabled={!running}
                onClick={event => {
                    window.open(instance.link, "_blank")
                    event.stopPropagation();
                }}
                onFocus={event => event.stopPropagation()}
            >
                <InputIcon />
            </IconButton>
        </AccordionSummary>
        <AccordionDetails>
            <Grid
                container
                direction="row"
            >
                <Grid
                    item
                    container
                    direction="row"
                    xs={10}
                >
                    <Grid
                        item
                        container
                        direction="column"
                        xs={12}
                        sm={6}
                        md={4}
                    >
                        <State state={connectedToHost} >
                            {I18n.t('Connected to host')}
                        </State>
                        <State state={alive} >
                            {I18n.t('Heartbeat')}
                        </State>
                        {connected !== null &&
                            <State state={connected}>
                                {I18n.t('Connected to %s', instance.adapter)}
                            </State>
                        }
                    </Grid>
                    <Grid
                        item
                        container
                        direction="column"
                        xs={12}
                        sm={6}
                        md={4}
                    >
                        <InstanceInfo
                            icon={<InfoIcon />}
                            tooltip={I18n.t('Installed')}
                        >
                            {instance.version}
                        </InstanceInfo>
                    </Grid>
                    <Grid
                        item
                        container
                        direction="column"
                        xs={12}
                        sm={6}
                        md={4}
                        style={{ paddingRight: 200 }}
                    >
                        {expertMode && <div style={{ display: 'flex' }}>
                            <InstanceInfo
                                icon={loglevelIcon}
                                tooltip={I18n.t('loglevel')}
                            >
                                {logLevel}
                            </InstanceInfo>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={(event) => {
                                    setOpenDialogSelect(true);
                                    event.stopPropagation();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </div>}
                        {expertMode &&
                            <div className={classes.visible1250} style={{ minWidth: 200 }}>
                                <InstanceInfo
                                    icon={<ImportExportIcon />}
                                    tooltip={I18n.t('events')}
                                >
                                    <div style={{ display: 'flex' }}>
                                        <Tooltip title={I18n.t('input events')}>
                                            <div style={{ marginRight: 5 }}>⇥{inputOutput.stateInput}</div>
                                        </Tooltip>
                                    /
                                <Tooltip title={I18n.t('output events')}>
                                            <div style={{ marginLeft: 5 }}>↦{inputOutput.stateOutput}</div>
                                        </Tooltip>
                                    </div>
                                </InstanceInfo>
                            </div>
                        }
                        <Grid item className={classes.visible1050}>
                            <InstanceInfo
                                icon={<MemoryIcon />}
                                tooltip={I18n.t('RAM usage')}
                            >
                                {(instance.mode === 'daemon' && running ? getMemory(id) : '-.--') + ' MB'}
                            </InstanceInfo>
                        </Grid>
                        {mode && <div style={{ display: 'flex' }}>
                            <InstanceInfo
                                icon={<ScheduleIcon />}
                                tooltip={I18n.t('schedule_group')}
                            >
                                {getSchedule(id) || '-'}
                            </InstanceInfo>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={(event) => {
                                    setOpenDialogSchedule(true);
                                    event.stopPropagation();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </div>}
                        {expertMode && (instance.mode === 'daemon') &&
                            <div style={{ display: 'flex' }}>
                                <InstanceInfo
                                    icon={<ScheduleIcon style={{ color: '#dc8e00' }} />}
                                    tooltip={I18n.t('restart')}
                                >
                                    {getRestartSchedule(id) || '-'}
                                </InstanceInfo>
                                <IconButton
                                    size="small"
                                    className={classes.button}
                                    onClick={(event) => {
                                        setOpenDialogCron(true);
                                        event.stopPropagation();
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </div>
                        }
                        {expertMode && <div style={{ display: 'flex' }}>
                            <InstanceInfo
                                icon={<MemoryIcon style={{ color: '#dc8e00' }} />}
                                tooltip={I18n.t('RAM limit')}
                            >
                                {(memoryLimitMB ? memoryLimitMB : '-.--') + ' MB'}
                            </InstanceInfo>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={(event) => {
                                    setOpenDialogMemoryLimit(true);
                                    event.stopPropagation();
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </div>
                        }
                        {expertMode && checkCompact && compact && <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <ViewCompactIcon style={{ marginRight: 5 }} color="inherit" />
                            <FormControl style={{ marginBottom: 5, marginTop: 5, width: 120 }} variant="outlined" >
                                <InputLabel htmlFor="outlined-age-native-simple">{I18n.t('compact groups')}</InputLabel>
                                <Select
                                    variant="standard"
                                    autoWidth
                                    onClose={() => setOpenSelect(false)}
                                    onOpen={() => setOpenSelect(true)}
                                    open={openSelect}
                                    value={compactGroup === undefined ? 1 : compactGroup || '0'}
                                    onChange={el => setCompactGroup(el.target.value)}
                                >
                                    {<div disabled >
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}>
                                            <div style={{ display: 'flex', margin: 5, justifyContent: 'space-around' }}>
                                                <Button onClick={() => {
                                                    setOpenSelect(false);
                                                    setCompactGroup(compactGroupCount + 1);
                                                }} variant="outlined" stylevariable='outlined'>{I18n.t('Add compact group')}</Button>
                                            </div>
                                        </div>
                                    </div>}
                                    <MenuItem value='0'>
                                        {I18n.t('with controller (0)')}
                                    </MenuItem>
                                    <MenuItem value={1}>
                                        {I18n.t('default group (1)')}
                                    </MenuItem>
                                    {Array(compactGroupCount - 1).fill().map((_, idx) => <MenuItem key={idx} value={idx + 2}>
                                        {idx + 2}
                                    </MenuItem>)}
                                </Select>
                            </FormControl>
                        </div>}
                    </Grid>
                </Grid>
                <Grid
                    item
                    container
                    direction="column"
                    xs={2}
                >
                    <Grid item>
                        <Hidden smUp>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={() => openConfig(id)}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Hidden>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={(event) => {
                                setOpenDialogDelete(true);
                                event.stopPropagation();
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
        </AccordionDetails>
    </Accordion>
}

export default withStyles(styles)(RowInstances);