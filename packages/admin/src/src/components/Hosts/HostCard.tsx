import React from 'react';
import { withStyles } from '@mui/styles';

import {
    Card,
    CardContent,
    CardMedia,
    Fab, Skeleton,
    Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import { Utils, type IobTheme } from '@iobroker/adapter-react-v5';

import BasicUtils from '@/Utils';
import HostGeneric, {
    boxShadow,
    boxShadowHover,
    genericStyle,
    type HostGenericProps,
    type HostGenericState,
} from './HostGeneric';

export const style = (theme: IobTheme): Record<string, any> => ({
    ...genericStyle(theme),
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
                color: 'black',
            },
            animation: '$warning 2.5s ease-in-out infinite alternate',
        },
    },
    '@keyframes warning': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0.7,
        },
    },
    imageBlock: {
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        transition: 'background 0.5s',
    },
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
        flexDirection: 'column',
    },
    collapseOff: {
        height: 0,
    },
    close: {
        width: 20,
        height: 20,
        opacity: 0.9,
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
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)',
        },
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
        color: theme.palette.mode === 'dark' ? '#333' : '#555',
    },
    cardContent: {
        marginTop: 16,
        paddingTop: 0,
    },
    cardContentInfo: {
        overflow: 'auto',
        paddingTop: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
    },
    cardContentH5: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingBottom: '10px !important',
    },
    marginTop10: {
        marginTop: 10,
    },
    displayFlex: {
        display: 'flex',
    },
    marginLeft5: {
        marginLeft: 5,
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.4)',
    },
    green: {
        background: '#00ce00',
        // border: '1px solid #014a00',
        position: 'relative',
    },
    red: {
        background: '#da0000',
        // border: '1px solid #440202',,
        // animation: '$red 3s ease-in-out infinite alternate'
    },
    '@keyframes red': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0.85,
        },
    },
    dotLine: {
        width: 50,
        height: '100%',
        background:
            'linear-gradient(90deg, rgba(0,206,0,0.7497373949579832) 0%, rgba(31,255,1,1) 50%, rgba(0,206,0,0.7805497198879552) 100%)',
        zIndex: 2,
        position: 'absolute',
        left: -11,
        // boxShadow: '12px 29px 81px 0px rgb(0 0 0 / 75%)',
        // animation: '$colors 3s ease-in-out infinite'
    },
    '@keyframes colors': {
        '0%': {
            left: -51,
        },
        '100%': {
            left: '101%',
        },
    },
    versionDate: {
        alignSelf: 'center',
    },

    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        paddingTop: 10,
    },
    badge: {
        cursor: 'pointer',
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 4,
    },
    marginRight: {
        marginRight: 'auto',
    },
    ul: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 16,
        paddingRight: 8,
    },
});

interface HostCardProps extends HostGenericProps {
    hidden?: boolean;
}

interface HostCardState extends HostGenericState {
    openCollapse?: boolean;
}

class HostCard extends HostGeneric<HostCardProps, HostCardState> {
    getHostDescriptionAll() {
        if (!this.props.hostData) {
            return <Skeleton />;
        }

        if (typeof this.props.hostData === 'string') {
            return this.props.hostData;
        }

        if (!this.props.hostData || typeof this.props.hostData !== 'object') {
            return <ul key="ul" className={this.props.classes.ul}>
                <Skeleton />
            </ul>;
        }

        return <ul key="ul" className={this.props.classes.ul}>
            {Object.keys(this.props.hostData).map(value => <li key={value}>
                <span className={this.props.classes.black}>
                    <span className={this.props.classes.bold}>
                        {this.props.t(value)}
                        :
                        {' '}
                    </span>
                    {HostGeneric.formatInfo[value] ?
                        HostGeneric.formatInfo[value]((this.props.hostData as Record<string, any>)[value], this.props.t) :
                        ((this.props.hostData as Record<string, any>)[value] || '--')}
                </span>
            </li>)}
        </ul>;
    }

    render() {
        const upgradeAvailable = (this.props.isCurrentHost || this.props.alive) && BasicUtils.updateAvailable(this.props.host.common.installedVersion, this.props.available);
        const { classes } = this.props;
        const description = this.getHostDescriptionAll();

        return <Card key={this.props.hostId} className={Utils.clsx(classes.root, this.props.hidden ? classes.hidden : '')}>
            {this.renderDialogs()}
            {this.state.openCollapse && <div className={Utils.clsx(classes.collapse, !this.state.openCollapse ? classes.collapseOff : '')}>
                <CardContent className={classes.cardContentInfo}>
                    <div
                        className={classes.cardContentDiv}
                        onClick={() => this.setState({ openCollapse: false })}
                    >
                        <div
                            className={classes.close}
                            onClick={() => this.setState({ openCollapse: false })}
                        />
                    </div>
                    {description}
                </CardContent>
                <div className={classes.footerBlock} />
            </div>}
            <div className={Utils.clsx(classes.onOffLine, this.props.alive ? classes.green : classes.red)}>
                {this.props.alive && <div className={classes.dotLine} />}
            </div>
            <div
                ref={this.refWarning}
                style={{ background: this.props.host.common.color || 'inherit' }}
                className={Utils.clsx(
                    classes.imageBlock,
                    !this.props.alive && classes.instanceStateNotAlive1,
                )}
            >
                <CardMedia
                    className={classes.img}
                    component="img"
                    // @ts-expect-error fixed in js-controller 6
                    image={this.props.host.common.image || 'img/no-image.png'}
                />
                <div
                    style={{ color: (this.props.host.common.color && Utils.invertColor(this.props.host.common.color, true)) || 'inherit' }}
                    className={classes.adapter}
                >
                    {this.renderNotificationsBadge(this.props.host.common.name)}
                </div>
                {!this.state.openCollapse ? <Fab
                    disabled={typeof description === 'string'}
                    onClick={() => this.setState({ openCollapse: true })}
                    className={classes.fab}
                    color="primary"
                    aria-label="add"
                    title={this.props.t('Click for more')}
                >
                    <MoreVertIcon />
                </Fab> : null}
            </div>
            <CardContent className={classes.cardContentH5}>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div className={classes.displayFlex}>
                        CPU:
                        <div ref={this.refCpu} className={classes.marginLeft5}>
                            - %
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div className={classes.displayFlex}>
                        RAM:
                        <div ref={this.refMem} className={classes.marginLeft5}>
                            - %
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div className={classes.displayFlex}>
                        {this.props.t('Uptime')}
                        :
                        {' '}
                        <div ref={this.refUptime} className={classes.marginLeft5}>
                            -d -h
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div" className={classes.wrapperAvailable}>
                    {this.props.t('Available')}
                    {' '}
                    js-controller:
                    {' '}
                    <div className={Utils.clsx(upgradeAvailable && classes.greenText, classes.curdContentFlexCenter)}>
                        {this.renderUpdateButton(upgradeAvailable)}
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                    {this.props.t('Installed')}
                    {' '}
                    js-controller:
                    {this.props.host.common.installedVersion}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div className={classes.displayFlex}>
                        {this.props.t('Events')}
                        :
                        {' '}
                        <div ref={this.refEvents} className={classes.marginLeft5}>- / -</div>
                    </div>
                </Typography>
                <div className={classes.marginTop10}>
                    <Typography component="span" className={classes.enableButton}>
                        {this.renderEditButton()}
                        {this.renderHostBaseEdit()}
                        {this.renderRestartButton()}
                        {this.props.expertMode && this.state.logLevel && this.renderLogLevel()}
                        {this.renderRemoveButton()}
                        {this.renderCopyButton()}
                    </Typography>
                </div>
            </CardContent>
        </Card>;
    }
}

export default withStyles(style)(HostCard);
