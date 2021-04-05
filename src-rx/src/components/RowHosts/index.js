import React, { useEffect, useRef, useState } from 'react';
import {  CardContent, CardMedia,  IconButton,  Tooltip, Typography } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import clsx from 'clsx';
import DeleteIcon from '@material-ui/icons/Delete';

import { green, red } from '@material-ui/core/colors';
import EditIcon from '@material-ui/icons/Edit';
import CachedIcon from '@material-ui/icons/Cached';
import PropTypes from "prop-types";
import Utils from '@iobroker/adapter-react/Components/Utils';


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
        // background: 'silver',
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
        height: 150,
        backgroundColor: 'silver',
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
            height: 150,
        }
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
        width: 10,
        height: '100%',
        // borderRadius: 20,
        // position: 'absolute',
        // top: 5,
        // right: 5,
    },
    adapter: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        paddingLeft: 8,
        alignSelf: 'center',
        color: theme.palette.type === 'dark' ? '#333' : '#555',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)'
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
        animation: '$colors 3s ease-in-out infinite'
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
        animation: '$red 3s ease-in-out infinite alternate'
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
        flex: 1
    },

    cardContentInfo: {
        overflow: 'auto',
        paddingTop: 0
    },
    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: 'silver',
        paddingTop: 10
    },
    wrapperFlex:{
        display: 'flex', cursor: 'pointer'
    },
    wrapperColor:{
        position: 'relative',
        overflow: 'hidden'
    }
});
let outputCache = 'null';
let inputCache = 'null';
const RowHosts = ({
    name,
    classes,
    image,
    hidden,
    alive,
    key,
    color,
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
    const [focused, setFocused] = useState(false);
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
    }, [_id, socket]);
    return <div
        onMouseOut={() => setFocused(false)}
        onMouseOver={() => setFocused(true)}
        onMouseMove={() => setFocused(true)}
        onClick={() => setCollapse((bool) => !bool)}
        key={key} className={clsx(classes.root, hidden ? classes.hidden : '')}>
        <div style={{border:`2px solid ${color || 'inherit'}`,borderRadius:5}} className={classes.wrapperFlex}>
            <div className={classes.wrapperColor}>
                <div className={clsx(classes.onOff, alive ? classes.green : classes.red)} />
                {alive && <div className={classes.dotLine} />}
            </div>
            <div
                // style={{ background: color || 'inherit' }}
                className={clsx(
                    classes.imageBlock,
                )}>
                <CardMedia className={classes.img} component="img" image={image || 'img/no-image.png'} />
                <div className={classes.adapter}>{name}</div>
            </div>
            <CardContent className={classes.cardContentH5}>
                <Typography className={classes.flex} variant="body2" color="textSecondary" component="p">
                    {title}
                </Typography>
                <Typography className={classes.flex} variant="body2" color="textSecondary" component="p">
                    {os}
                </Typography>
                <Typography className={classes.flex} variant="body2" color="textSecondary" component="p">
                    {available}
                </Typography>
                <Typography className={classes.flex} variant="body2" color="textSecondary" component="p">
                    {installed}
                </Typography>
                <Typography className={classes.flex} variant="body2" color="textSecondary" component="div">
                    <div ref={refEvents}>{events}</div>
                </Typography>
                <div className={classes.marginTop10}>
                    <Typography component={'span'} className={classes.enableButton}>
                        <IconButton
                            size="small"
                            className={clsx(classes.button)}
                            onClick={(e) => {
                                setEditDilog(true);
                                e.stopPropagation();
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                        <Tooltip title={t('Auto restart')}>
                            <IconButton onClick={(e) => {
                                executeCommand();
                                e.stopPropagation();
                            }}>
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
        </div>
        {(openCollapse || focused) && typeof description !== 'string' &&
            <div
                className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : classes.collapseOn)}>
                <CardContent className={classes.cardContentInfo}>
                    <Typography gutterBottom component={'span'} variant={'body2'} className={classes.description}>
                        {t('Info')}
                    </Typography>
                    {description}
                </CardContent>
                <div className={classes.footerBlock}>
                </div>
            </div>}
    </div>
}

RowHosts.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    t: PropTypes.func,
};

export default withStyles(styles)(RowHosts);