/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
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
import sentry from '../../assets/sentry.svg';
import CustomModal from '../CustomModal';
import EditIcon from '@material-ui/icons/Edit';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import ComplexCron from '@iobroker/adapter-react/Dialogs/ComplexCron';
import CachedIcon from '@material-ui/icons/Cached';
import PropTypes from "prop-types";
import Utils from '@iobroker/adapter-react/Components/Utils';


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
    onOff: {
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 20,
        position: 'absolute',
        top: 5,
        right: 5,
    },
    onOffLine: {
        alignSelf: 'center',
        width: '100%',
        height: 12,
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
    hide: {
        visibility: 'hidden'
    },
    button: {
        padding: '5px',
        transition: 'opacity 0.2s'
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
    cardContentInfo: {
        overflow: 'auto',
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
        justifyContent: 'space-between',
        paddingBottom: '10px !important'
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
        background: 'silver',
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
        animation: '$red 3s ease-in-out infinite alternate'
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
        animation: '$colors 3s ease-in-out infinite'
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
    description: {
        color: theme.palette.type === 'dark' ? '#222' : 'inherit'
    },

    // cardContent: {
    //     overflow: 'auto'
    // },
    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: 'silver',
        paddingTop: 10
    },
    cardContentFlex: {
        display: 'flex'
    },
    cardContentFlexBetween: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    cardContent2: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    cardMargin10: {
        marginTop: 10,
    },
    availableVersion: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center'
    },

    classPoll: {
        color: 'orange'
    },
    classPush: {
        color: 'green'
    },
    classAssumption: {
        color: 'red',
        transform: 'rotate(90deg)'
    },
});


let outputCache = 'null';
let inputCache = 'null';

const CardHosts = ({
    name,
    classes,
    image,
    hidden,
    connectedToHost,
    alive,
    connected,
    key,
    logLevel,
    color,
    type,
    title,
    os,
    available,
    installed,
    events,
    t,
    description,
    _id, 
    socket,
    setEditDilog,
    executeCommand
}) => {
    const [openCollapse, setCollapse] = useState(false);
    const refEvents = useRef();
    const eventsFunc = (input, output) => {
        let event;
        if (input) {
            inputCache = input;
            event = `⇥${input} / ↦${outputCache}`;
        } else if (output) {
            outputCache = output;
            event = `⇥${inputCache} / ↦${output}`;
        } else {
            event = `⇥null / ↦null`;
        }
        if (refEvents.current) {
            refEvents.current.innerHTML = event;
        }
    }
    useEffect(() => {
        socket.subscribeState(`${_id}.inputCount`, (_, el) => eventsFunc(el.val));
        socket.subscribeState(`${_id}.outputCount`, (_, el) => eventsFunc(null, el.val));
        return () => {
            socket.unsubscribeObject(`${_id}.inputCount`, (_, el) => eventsFunc(el.val));
            socket.unsubscribeObject(`${_id}.outputCount`, (_, el) => eventsFunc(null, el.val));
        }
    }, [_id, socket])
    const [focused, setFocused] = useState(false);
    return <Card key={key} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        {(openCollapse || focused) && <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent className={classes.cardContentInfo}>
                <div className={classes.cardContentDiv}>
                    <div className={classes.close} onClick={() => setCollapse((bool) => !bool)} />
                </div>
                <Typography gutterBottom component={'span'} variant={'body2'} className={classes.description}>
                    {t('Info')}
                </Typography>
                    {description}
            </CardContent>
            <div className={classes.footerBlock}>
            </div>
        </div>}
        <div className={clsx(classes.onOffLine, alive ? classes.green : classes.red)} >
            {alive && <div className={classes.dotLine} />}
        </div>
        <div
            style={{ background: color || 'inherit' }}
            className={clsx(
                classes.imageBlock,
                (!connectedToHost || !alive) && classes.instanceStateNotAlive1,
                connectedToHost && alive && connected === false && classes.instanceStateAliveNotConnected1,
                connectedToHost && alive && connected !== false && classes.instanceStateAliveAndConnected1
            )}>
            <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
            <div style={{
                color: (color && Utils.invertColor(color,true)) || 'inherit',
            }} className={classes.adapter}>{name}</div>
            <Fab
                disabled={typeof description === 'string'}
                onMouseOut={() => setFocused(false)}
                onMouseOver={() => setFocused(true)}
                onClick={() => setCollapse((bool) => !bool)} className={classes.fab} color="primary" aria-label="add">
                <MoreVertIcon />
            </Fab>
        </div>
        <CardContent className={classes.cardContentH5}>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Title: %s', title)}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('OS: %s', os)}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Available: %s', available)}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
                {t('Installed: %s', installed)}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
                <div className={classes.displayFlex}>{t('Events: ')}<div ref={refEvents} className={classes.marginLeft5}>{events}</div></div>
            </Typography>
            <div className={classes.marginTop10}>
                <Typography component={'span'} className={classes.enableButton}>
                    <IconButton
                        size="small"
                        className={clsx(classes.button)}
                        onClick={() => setEditDilog(true)}
                    >
                        <EditIcon />
                    </IconButton>

                    <Tooltip title={t('Auto restart')}>
                        <IconButton onClick={executeCommand}>
                            <CachedIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('Reload')}>
                        <IconButton >
                            {alive ? <RefreshIcon /> : <DeleteIcon />}
                        </IconButton>
                    </Tooltip>
                </Typography>
            </div>
        </CardContent>
    </Card>
}

CardHosts.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    t: PropTypes.func,
};

export default withStyles(styles)(CardHosts);