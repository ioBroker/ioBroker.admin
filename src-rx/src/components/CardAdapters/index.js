import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Fab, IconButton, Typography } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import RefreshIcon from '@material-ui/icons/Refresh';
import clsx from 'clsx';
import AddIcon from '@material-ui/icons/Add';
import AddToPhotosIcon from '@material-ui/icons/AddToPhotos';
import BuildIcon from '@material-ui/icons/Build';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import HelpIcon from '@material-ui/icons/Help';
import PublishIcon from '@material-ui/icons/Publish';
import I18n from '@iobroker/adapter-react/i18n';

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
        position: 'relative'
    },
    img: {
        width: 45,
        height: 45,
        margin: 'auto 0'
    },
    istalled: {
        // background: theme.palette.primary.main,#10ff006b
        background: '#77c7ff8c'
    },
    update: {
        // background: theme.palette.success.main,#77f2ff63
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
        // color: '#10ff006b'
    },

    collapse: {
        height: '100%',
        backgroundColor: 'silver',
        position: 'absolute',
        width: '100%',
        zIndex: 2,
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
    }
});
const CardAdapters = ({
    name,
    classes,
    image,
    version,
    installedVersion,
    installedCount,
    updateAvailable,
    onUpdate,
    description,
    rightOs,
    onAddInstance,
    onInfo,
    expertMode,
    onUpload,
    onDeletion,
    rebuild,
    onRebuild,
    hidden
}) => {
    const [openCollapse, setCollapse] = useState(false)
    return <Card className={clsx(classes.root, hidden ? classes.hidden : '')}>
        <div className={clsx(classes.collapse, !openCollapse ? classes.collapseOff : '')}>
            <CardContent>
                <div className={classes.close} onClick={() => setCollapse((bool) => !bool)} />
                <Typography gutterBottom component={'span'} variant={'body2'}>
                    {description}
                </Typography>
            </CardContent>
            <div className={classes.footerBlock}>
                <IconButton
                    size="small"
                    className={!rightOs ? classes.hidden : ''}
                    onClick={rightOs ? onAddInstance : null}
                >
                    <AddIcon />
                </IconButton>
                <div style={{ display: 'flex' }}>
                    <IconButton
                        size="small"
                        onClick={onInfo}
                    >
                        <HelpIcon />
                    </IconButton>
                    {expertMode &&
                        <IconButton
                            size="small"
                            className={!installedVersion ? classes.hidden : ''}
                            onClick={onUpload}
                        >
                            <PublishIcon />
                        </IconButton>
                    }
                    <IconButton
                        size="small"
                        className={!installedVersion ? classes.hidden : ''}
                        onClick={onDeletion}
                    >
                        <DeleteForeverIcon />
                    </IconButton>
                    {expertMode &&
                        <IconButton size="small" className={!installedVersion ? classes.hidden : ''}>
                            <AddToPhotosIcon />
                        </IconButton>
                    }
                    {rebuild && expertMode &&
                        <IconButton
                            size="small"
                            className={!installedVersion ? classes.hidden : ''}
                            onClick={onRebuild}
                        >
                            <BuildIcon />
                        </IconButton>
                    }
                </div>
            </div>
        </div>
        <div className={clsx(classes.imageBlock,
            installedVersion ? classes.istalled : '',
            installedVersion && installedVersion !== version ? classes.update : '')}>
            <CardMedia
                className={classes.img}
                component="img"
                image={image || "img/no-image.png"}
            />
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
                    <div>{I18n.t('Available version:')}</div>
                    <div className={updateAvailable ? classes.greenText : ''} style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {updateAvailable &&
                            <IconButton
                                style={{
                                    height: 20,
                                    width: 20,
                                    marginRight: 10
                                }}
                                size="small"
                                onClick={onUpdate}
                            >
                                <RefreshIcon />
                            </IconButton>
                        }
                        {version}</div>
                </Typography>
                {installedVersion && <Typography component={'span'} style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <div>{I18n.t('Installed version')}:</div>
                    <div>{installedVersion}</div>
                </Typography>}
                {installedCount && <Typography component={'span'} style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <div>{I18n.t('Installed instances')}:</div>
                    <div>{installedCount}</div>
                </Typography>}
            </div>
        </CardContent>
    </Card>
}

export default withStyles(styles)(CardAdapters);