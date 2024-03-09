import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Button,
    Card,
    CardContent,
    CardMedia, Checkbox,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormControl,
    FormControlLabel, FormHelperText,
    Hidden,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    Build as BuildIcon,
    Input as InputIcon,
    Delete as DeleteIcon,
    LowPriority as LowPriorityIcon,
    Memory as MemoryIcon,
    Schedule as ScheduleIcon,
    ViewCompact as ViewCompactIcon,
    Edit as EditIcon,
    Pause as PauseIcon,
    PlayArrow as PlayArrowIcon,
    ImportExport as ImportExportIcon,
    Storage as HostIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import { green, red } from '@mui/material/colors';

import {
    Utils,
    I18n,
    Confirm as ConfirmDialog,
    TextWithIcon,
    SelectWithIcon,
    ComplexCronDialog as ComplexCron,
} from '@iobroker/adapter-react-v5';

import sentry from '../../assets/sentry.svg';
import noSentry from '../../assets/sentryNo.svg';
import InstanceInfo from './InstanceInfo';
import State from '../State';
import CustomModal from '../CustomModal';
import LinksDialog from './LinksDialog';
import IsVisible from '../IsVisible';

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
            boxShadow: boxShadowHover,
        },
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
    greenText: {
        color: theme.palette.success.dark,
    },

    collapse: {
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#4a4a4a' : '#d4d4d4',
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
        width: '20px',
        height: '20px',
        opacity: '0.9',
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
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
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
    versionDate: {
        alignSelf: 'center',
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
    hide: {
        visibility: 'hidden',
    },
    button: {
        padding: '5px',
        transition: 'opacity 0.2s',
        height: 34,
    },
    hiddenOpacity: {
        opacity: 0,
        cursor: 'default',
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200],
        },
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200],
        },
    },
    cardContent: {
        marginTop: 16,
        paddingTop: 0,
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)',
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    marginTop10: {
        marginTop: 10,
    },
    memoryIcon: {
        color: '#dc8e00',
    },
    displayFlex: {
        display: 'flex',
    },
    logLevel: {
        width: '100%',
        marginBottom: 5,
    },
    hostInfo: {
        width: '100%',
    },
    overflowAuto: {
        overflow: 'auto',
    },
    collapseIcon: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: theme.palette.mode === 'dark' ? '#4a4a4a' : '#d4d4d4',
        zIndex: 2,
    },
    addCompact: {
        width: '100%',
        marginBottom: 5,
    },
    addCompactButton: {
        display: 'flex',
        margin: 5,
        justifyContent: 'space-around',
    },
    scheduleIcon: {
        color: '#dc8e00',
    },
    marginRight5: {
        marginRight: 5,
    },
    marginLeft5: {
        marginLeft: 5,
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.7)',
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
    instanceName: {
        fontSize: 16,
        padding: 4,
        paddingBottom: 15,
        fontWeight: 'bold',
    },
    deleting: {
        position: 'relative',
        '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            opacity: '.3 !important',
            background: 'repeating-linear-gradient(135deg, #333, #333 10px, #888 10px, #888 20px)',
        },
    },
    tooltip: {
        pointerEvents: 'none',
    },
    /* instanceStateAliveAndConnected2: {
        backgroundColor: 'rgb(0 255 0 / 14%)'
    } */
});

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];
const arrayTier = [{ value: 1, desc: '1: Logic adapters' }, { value: 2, desc: '2: Data provider adapters' }, { value: 3, desc: '3: Other adapters' }];

const InstanceCard = memo(({
    adminInstance,
    classes,
    maxCompactGroupNumber,
    onDeleteInstance,
    deleteCustomSupported,
    expertMode,
    extendObject,
    getMemory,
    getRestartSchedule,
    getSchedule,
    hidden,
    hosts,
    id,
    instance,
    key,
    lang,
    openConfig,
    setCompact,
    setCompactGroup,
    setHost,
    setLogLevel,
    setMemoryLimitMB,
    setName,
    setRestartSchedule,
    setSchedule,
    setSentry,
    setTier,
    t,
    themeType,
    deleting,
    item,
    socket,
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

    const [logLevelValue, setLogLevelValue] = useState(item.logLevel);
    const [logOnTheFlyValue, setLogOnTheFlyValue] = useState(false);
    const [compactValue, setCompactValue] = useState(item.compactGroup || 0);
    const [maxCompactGroupNumberValue, setCompactGroupCountValue] = useState(maxCompactGroupNumber);
    const [tierValue, setTierValue] = useState(item.tier);
    const [hostValue, setHostValue] = useState(instance.host);
    const [deleteCustomValue, setDeleteCustom] = useState(false);

    const [visibleEdit, handlerEdit] = useState(false);

    let customModal;
    if (openDialogDelete) {
        customModal = <Dialog
            onClose={() => setOpenDialogDelete(false)}
            open={!0}
        >
            <DialogTitle>{t('Please confirm')}</DialogTitle>
            <DialogContent>
                {openDialogDelete === 1 ?
                    t('Are you sure you want to delete the instance "%s" or whole adapter "%s"?', instance.id, instance.id.split('.')[0]) :
                    t('Are you sure you want to delete the instance %s?', instance.id)}
                {deleteCustomSupported && instance.obj.common.supportCustoms && <br />}
                {deleteCustomSupported && instance.obj.common.supportCustoms && <FormControlLabel
                    control={<Checkbox checked={deleteCustomValue} onChange={e => setDeleteCustom(e.target.checked)} />}
                    label={t('Delete all custom object settings of this adapter too')}
                />}
            </DialogContent>
            <DialogActions>
                {openDialogDelete === 1 ? <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                        setOpenDialogDelete(false);
                        onDeleteInstance(instance, deleteCustomValue, true);
                        setDeleteCustom(false);
                    }}
                    variant="contained"
                    style={{ background: 'red', color: 'white' }}
                >
                    {I18n.t('Delete adapter')}
                </Button> : null}
                <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                        setOpenDialogDelete(false);
                        onDeleteInstance(instance, deleteCustomValue);
                        setDeleteCustom(false);
                    }}
                    variant="contained"
                    color="primary"
                >
                    {I18n.t('Delete instance')}
                </Button>
                <Button
                    color="grey"
                    onClick={() => setOpenDialogDelete(false)}
                    variant="contained"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    } else {
        let showModal = false;
        let title;
        let help = '';
        if (openDialogText) {
            title = t('Enter title for %s', instance.id);
            showModal = true;
        } else if (openDialogLogLevel) {
            title = t('Edit log level rule for %s', instance.id);
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

        customModal = showModal ? <CustomModal
            title={title}
            help={help}
            open={!0}
            applyDisabled={openDialogText || openDialogMemoryLimit}
            textInput={openDialogText || openDialogMemoryLimit}
            defaultValue={openDialogText ? item.name : openDialogMemoryLimit ? item.memoryLimitMB : ''}
            onApply={value => {
                if (openDialogLogLevel) {
                    setLogLevel(instance, logLevelValue, logOnTheFlyValue);
                    setOpenDialogLogLevel(false);
                } else if (openDialogText) {
                    setName(instance, value);
                    setOpenDialogText(false);
                } else if (openDialogMemoryLimit) {
                    setMemoryLimitMB(instance, value);
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
                    setLogLevelValue(item.logLevel);
                    setLogOnTheFlyValue(false);
                    setOpenDialogLogLevel(false);
                } else if (openDialogText) {
                    setOpenDialogText(false);
                } else if (openDialogMemoryLimit) {
                    setOpenDialogMemoryLimit(false);
                } else if (openDialogCompact) {
                    setCompactValue(item.compactGroup);
                    setCompactGroupCountValue(maxCompactGroupNumber);
                    setOpenDialogCompact(false);
                } else if (openDialogTier) {
                    setTierValue(item.tier);
                    setOpenDialogTier(false);
                } else if (openDialogHost) {
                    setHostValue(instance.host);
                    setOpenDialogHost(false);
                }
            }}
        >
            {openDialogLogLevel && <FormControl className={classes.logLevel} variant="outlined">
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
            {openDialogLogLevel && <FormControl className={classes.formControl} variant="outlined">
                <FormControlLabel
                    control={<Checkbox checked={logOnTheFlyValue} onChange={e => setLogOnTheFlyValue(e.target.checked)} />}
                    label={t('Without restart')}
                />
                <FormHelperText>{logOnTheFlyValue ? t('Will be reset to the saved log level after restart of adapter') : t('Log level will be saved permanently')}</FormHelperText>
            </FormControl>}
            {openDialogCompact && <FormControl className={classes.addCompact} variant="outlined">
                <InputLabel>{t('compact groups')}</InputLabel>
                <Select
                    variant="standard"
                    autoWidth
                    onClose={() => setOpenSelectCompactGroup(false)}
                    onOpen={() => setOpenSelectCompactGroup(true)}
                    open={openSelectCompactGroup}
                    value={compactValue === 1 ? 'default' : compactValue === '0' ? 'controller' : !compactValue ? 'default' : compactValue || 'default'}
                    onChange={el => setCompactValue(el.target.value)}
                >
                    <div
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className={classes.selectStyle}
                    >
                        <Button
                            color="grey"
                            onClick={() => {
                                setOpenSelectCompactGroup(false);
                                setCompactValue(maxCompactGroupNumberValue + 1);
                                setCompactGroupCountValue(maxCompactGroupNumberValue + 1);
                            }}
                            variant="outlined"
                            stylevariable="outlined"
                        >
                            {t('Add compact group')}
                        </Button>
                    </div>
                    <MenuItem value="controller">
                        {t('with controller')}
                    </MenuItem>
                    <MenuItem value="default">
                        {t('default group')}
                    </MenuItem>
                    {Array(maxCompactGroupNumberValue - 1).fill().map((_, idx) => <MenuItem key={idx} value={idx + 2}>
                        {idx + 2}
                    </MenuItem>)}
                </Select>
            </FormControl>}
            {openDialogTier && <FormControl className={classes.logLevel} variant="outlined">
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
            {openDialogHost && <SelectWithIcon
                themeType={themeType}
                value={hostValue}
                list={hosts}
                removePrefix="system.host."
                fullWidth
                className={classes.hostInfo}
                onChange={el => setHostValue(el)}
            />}
        </CustomModal> : null;
    }

    const stopAdminDialog = showStopAdminDialog ? <ConfirmDialog
        title={t('Please confirm')}
        text={t('stop_admin', adminInstance)}
        ok={t('Stop admin')}
        onClose={result => {
            result && extendObject(showStopAdminDialog, { common: { enabled: false } });
            setShowStopAdminDialog(false);
        }}
    /> : null;

    const secondCardInfo = (openCollapse || mouseOver) && !deleting ?
        <div className={Utils.clsx(classes.collapse, !openCollapse ? classes.collapseOff : '', deleting && classes.deleting)}>
            <CardContent classes={{ root: classes.cardContent }} className={classes.overflowAuto}>
                <div className={classes.collapseIcon}>
                    <div className={classes.close} onClick={() => setCollapse(false)} />
                </div>
                <Typography gutterBottom component="span" variant="body2">
                    <span className={classes.instanceName}>{instance.id}</span>
                    {item.stoppedWhenWebExtension !== undefined && <State state={item.stoppedWhenWebExtension}>{t('Runs as web-extension')}</State>}
                    {item.running && instance.mode === 'daemon' && item.stoppedWhenWebExtension === undefined && <State state={item.connectedToHost}>{t('Connected to host')}</State>}
                    {item.running && instance.mode === 'daemon' && item.stoppedWhenWebExtension === undefined && <State state={item.alive}>{t('Heartbeat')}</State>}
                    {item.running && item.connected !== null && item.stoppedWhenWebExtension === undefined &&
                        <State state={!!item.connected}>
                            {typeof item.connected === 'string' ? `${t('Connected:')} ${item.connected || '-'}` : t('Connected to device or service')}
                        </State>}

                    <InstanceInfo tooltip={t('Installed')}>
                        v
                        {instance.version}
                    </InstanceInfo>

                    {item.running && <InstanceInfo icon={<MemoryIcon />} tooltip={t('RAM usage')}>
                        {`${instance.mode === 'daemon' && item.running ? getMemory(id) : '-.--'} MB`}
                    </InstanceInfo>}

                    {item.running && expertMode &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo icon={<ImportExportIcon />} tooltip={t('events')}>
                                <div className={classes.displayFlex}>
                                    <Tooltip title={t('input events')}>
                                        <div className={classes.marginRight5}>
⇥
                                            {item.inputOutput.stateInput}
                                        </div>
                                    </Tooltip>
                                    /
                                    <Tooltip title={t('output events')}>
                                        <div className={classes.marginLeft5}>
↦
                                            {item.inputOutput.stateOutput}
                                        </div>
                                    </Tooltip>
                                </div>
                            </InstanceInfo>
                        </div>}

                    {expertMode && <div className={classes.displayFlex}>
                        <InstanceInfo
                            icon={<MemoryIcon className={classes.memoryIcon} />}
                            tooltip={t('RAM limit')}
                        >
                            {`${item.memoryLimitMB ? item.memoryLimitMB : '-.--'} MB`}
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
                        <InstanceInfo icon={item.loglevelIcon} tooltip={item.logLevelObject === item.logLevel ? `${t('loglevel')} ${item.logLevel}` : `${t('saved:')} ${item.logLevelObject} / ${t('actual:')} ${item.logLevel}`}>
                            {item.logLevelObject === item.logLevel ? item.logLevel : `${item.logLevelObject} / ${item.logLevel}`}
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

                    {item.modeSchedule && <div className={classes.displayFlex}>
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
                        </div>}

                    {expertMode && item.checkCompact && item.compact && item.supportCompact &&
                        <div className={classes.displayFlex}>
                            <InstanceInfo icon={<ViewCompactIcon className={classes.marginRight} color="inherit" />} tooltip={t('compact groups')}>
                                {item.compactGroup === 1 ? 'default' : item.compactGroup === '0' ? 'controller' : !item.compactGroup ? 'default' : item.compactGroup || 'default'}
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
                            {instance.adapter === 'admin' ? t('Always first') : t(arrayTier.find(el => el.value === item.tier)?.desc || arrayTier[2])}
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

                    {hosts.length > 1 || (hosts.length && hosts[0].common?.name !== instance.host) ? <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                        <InstanceInfo icon={<HostIcon className={classes.marginRight} />} tooltip={t('Host for this instance')}>
                            <TextWithIcon value={instance.host} list={hosts} removePrefix="system.host." themeType={themeType} t={t} lang={lang} />
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

                    <IsVisible config={item} name="allowInstanceSettings">
                        <Hidden smUp>
                            <IconButton
                                disabled={!instance.config}
                                size="small"
                                className={Utils.clsx(classes.button, !instance.config && classes.hiddenOpacity)}
                                onClick={() => openConfig(id)}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Hidden>
                    </IsVisible>
                </Typography>
            </CardContent>

            <div className={classes.footerBlock}>
                <IsVisible config={item} name="allowInstanceDelete">
                    <div className={classes.displayFlex}>
                        <Tooltip title={t('Delete')}>
                            <IconButton
                                size="small"
                                className={classes.button}
                                onClick={async () => {
                                    // Count the number of instances
                                    const instances = await socket.getAdapterInstances(instance.id.split('.')[0]);
                                    setOpenDialogDelete(instances.length || true);
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                </IsVisible>

                {expertMode && item.checkSentry && <div className={classes.displayFlex}>
                    <Tooltip title="sentry">
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={() => setSentry(instance)}
                        >
                            <CardMedia
                                className={Utils.clsx(classes.sentry, !item.sentry && classes.contrast0)}
                                component="img"
                                image={item.sentry ? sentry : noSentry}
                            />
                        </IconButton>
                    </Tooltip>
                </div>}

                {item.supportCompact && expertMode && item.checkCompact && <div className={classes.displayFlex}>
                    <Tooltip title={t('compact groups')}>
                        <IconButton
                            size="small"
                            className={classes.button}
                            onClick={() => setCompact(instance)}
                        >
                            <ViewCompactIcon color={item.compact ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                </div>}
            </div>
        </div> : null;

    const linksDialog = showLinks ? <LinksDialog
        image={instance.image}
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
            clearButton
            cron={openDialogCron ? getRestartSchedule(id) : getSchedule(id)}
            language={I18n.getLanguage()}
            onOk={cron => {
                if (openDialogCron) {
                    setRestartSchedule(instance, cron);
                } else if (openDialogSchedule) {
                    setSchedule(instance, cron);
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

    return <Card key={key} className={Utils.clsx(classes.root, hidden ? classes.hidden : '')}>
        {customModal}
        {stopAdminDialog}
        {cronDialog}
        {secondCardInfo}
        {linksDialog}

        <div className={Utils.clsx(
            classes.imageBlock,
            (!item.connectedToHost || !item.alive) && classes.instanceStateNotAlive1,
            item.connectedToHost && item.alive && item.connected === false && classes.instanceStateAliveNotConnected1,
            item.connectedToHost && item.alive && item.connected !== false && classes.instanceStateAliveAndConnected1,
        )}
        >
            <CardMedia className={classes.img} component="img" image={instance.image || 'img/no-image.png'} />
            <div className={classes.adapter}>{instance.id}</div>
            <div className={classes.versionDate}>
                {/* {expertMode && item.checkCompact && <Tooltip title={t('compact groups')}>
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
                    className={classes.displayFlex}
                >
                    {item.name}
                    <Tooltip title={t('Edit')}>
                        <IconButton
                            size="small"
                            className={Utils.clsx(classes.button, !visibleEdit && classes.hiddenOpacity)}
                            onClick={() => setOpenDialogText(true)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            </Typography>

            <div className={classes.marginTop10}>
                <Typography component="span" className={classes.enableButton}>
                    <Tooltip title={t('Start/stop')}>
                        <div>
                            <IconButton
                                size="small"
                                onClick={event => {
                                    event.stopPropagation();
                                    if (!item.running || instance.id !== adminInstance) {
                                        extendObject(`system.adapter.${instance.id}`, { common: { enabled: !item.running } });
                                    }
                                }}
                                onFocus={event => event.stopPropagation()}
                                className={Utils.clsx(classes.button, instance.canStart ? (item.running ? classes.enabled : classes.disabled) : classes.hide)}
                            >
                                {item.running ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                        </div>
                    </Tooltip>
                    <Hidden xsDown>
                        <Tooltip title={instance.config ? t('Settings') : ''}>
                            <div>
                                <IconButton
                                    disabled={!instance.config}
                                    size="small"
                                    className={Utils.clsx(classes.button, !instance.config && classes.hiddenOpacity)}
                                    onClick={() => openConfig(id)}
                                >
                                    <BuildIcon />
                                </IconButton>
                            </div>
                        </Tooltip>
                    </Hidden>
                    <Tooltip title={t('Restart')}>
                        <div>
                            <IconButton
                                size="small"
                                onClick={event => {
                                    extendObject(`system.adapter.${instance.id}`, {});
                                    event.stopPropagation();
                                }}
                                onFocus={event => event.stopPropagation()}
                                className={Utils.clsx(classes.button, !instance.canStart && classes.hide)}
                                disabled={!item.running}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    <IsVisible config={item} name="allowInstanceLink">
                        <Tooltip title={t('Instance link %s', instance.id)}>
                            <div>
                                <IconButton
                                    size="small"
                                    className={Utils.clsx(classes.button, (!instance.links || !instance.links[0]) && classes.hide)}
                                    disabled={!item.running}
                                    onClick={event => {
                                        event.stopPropagation();
                                        if (instance.links.length === 1) {
                                            // replace http://fe80::ed18:8dyy:f65:cexx:8087/get/ with http://[fe80::ed18:8dyy:f65:cexx]:8087/get/
                                            let url = instance.links[0].link;
                                            url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//$1$2/');
                                            window.open(url, instance.id);
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
                    </IsVisible>
                </Typography>
            </div>
        </CardContent>
    </Card>;
});

InstanceCard.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    themeType: PropTypes.string,
    adminInstance: PropTypes.string,
    hosts: PropTypes.array,
    setHost: PropTypes.func,
    deleting: PropTypes.bool,
    item: PropTypes.object,
    deleteCustomSupported: PropTypes.bool,
    socket: PropTypes.object,
};

export default withStyles(styles)(InstanceCard);
