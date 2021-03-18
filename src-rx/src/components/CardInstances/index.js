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
import InstanceInfo from '../InstanceInfo';
import State from '../State';

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
    }
});
const CardInstances = ({
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
    compact,
    compactGroup,
    setCompactGroup,
    compactGroupCount
}) => {
    const [openCollapse, setCollapse] = useState(false);
    const [openSelect, setOpenSelect] = useState(false);
    return <Card key={key} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent classes={{
                root: classes.cardContent
            }} style={{ overflow: 'auto' }}>
                <div style={{
                    position: 'sticky',
                    right: 0,
                    top: 0,
                    background: 'silver',
                    zIndex: 2
                }}>
                    <div className={classes.close} onClick={() => setCollapse((bool) => !bool)} />
                </div>
                <Typography gutterBottom component={'span'} variant={'body2'}>
                    {compact && <div style={{ display: 'flex' }}>
                        <Tooltip title={I18n.t('compact groups')}>
                            <ViewCompactIcon color="secondary" style={{ margin: 10, marginLeft: 0, marginBottom: 2 }} />
                        </Tooltip>
                        <FormControl style={{ width: '100%', marginBottom: 5 }} variant="outlined" >
                            <InputLabel htmlFor="outlined-age-native-simple">{'compact'}</InputLabel>
                            <Select
                                variant="standard"
                                onClose={() => setOpenSelect(false)}
                                onOpen={() => setOpenSelect(true)}
                                open={openSelect}
                                value={compactGroup || 'default'}
                                fullWidth
                                onChange={el => setCompactGroup(el.target.value)}
                            >
                                {<div disabled >
                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}>
                                        <div style={{ display: 'flex', margin: 5, justifyContent: 'space-around' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>{compactGroupCount + 1}</div>
                                            <Button onClick={() => {
                                                setOpenSelect(false);
                                                setCompactGroup(compactGroupCount + 1);
                                            }} variant="outlined" stylevariable='outlined'>{I18n.t('Add compact group')}</Button>
                                        </div>
                                    </div>
                                </div>}
                                <MenuItem value="default">
                                    {I18n.t('default group')}
                                </MenuItem>
                                {Array(compactGroupCount + 1).fill().map((_, idx) => <MenuItem key={idx} value={idx}>
                                    {idx}
                                </MenuItem>)}
                            </Select>
                        </FormControl>

                    </div>}
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
                    <InstanceInfo
                        icon={<InfoIcon />}
                        tooltip={I18n.t('Installed')}
                    >
                        {instance.version}
                    </InstanceInfo>
                    <InstanceInfo
                        icon={<MemoryIcon />}
                        tooltip={I18n.t('RAM usage')}
                    >
                        {(instance.mode === 'daemon' && running ? getMemory(id) : '-.--') + ' MB'}
                    </InstanceInfo>
                    <InstanceInfo
                        icon={loglevelIcon}
                        tooltip={I18n.t('loglevel')}
                    >
                        {instance.loglevel}
                    </InstanceInfo>
                    <InstanceInfo
                        icon={<ScheduleIcon />}
                        tooltip={I18n.t('schedule_group')}
                    >
                        {getSchedule(id) || '-'}
                    </InstanceInfo>
                    {expertMode &&
                        <InstanceInfo
                            icon={<ScheduleIcon />}
                            tooltip={I18n.t('restart')}
                        >
                            {getRestartSchedule(id) || '-'}
                        </InstanceInfo>
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
                <div style={{ display: 'flex' }}>
                    <IconButton
                        size="small"
                        className={classes.button}
                    >
                        <DeleteIcon />
                    </IconButton>

                </div>
            </div>
        </div>
        <div className={clsx(classes.imageBlock,
            running ? classes.update : '')}>
            <CardMedia
                className={classes.img}
                component="img"
                image={image || 'img/no-image.png'}
            />
            <div className={classes.adapter}>{instance.id}</div>
            <div className={classes.versionDate}>
                {expertMode && compact && <Tooltip title={I18n.t('compact groups')}>
                    <ViewCompactIcon color="action" style={{ margin: 10 }} />
                </Tooltip>}
            </div>
            <Fab onClick={() => setCollapse((bool) => !bool)} className={classes.fab} color="primary" aria-label="add">
                <MoreVertIcon />
            </Fab>
        </div>
        <CardContent style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <Typography gutterBottom variant="h5" component="h5">
                {name}
            </Typography>
            <div style={{
                marginTop: 10,
            }}>
                <Typography component={'span'} style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>

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
                </Typography>
            </div>
        </CardContent>
    </Card>
}

export default withStyles(styles)(CardInstances);