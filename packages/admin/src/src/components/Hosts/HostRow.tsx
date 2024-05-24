import React from 'react';
import { withStyles } from '@mui/styles';

import {
    CardContent,
    CardMedia, Skeleton,
    Typography,
} from '@mui/material';

import { Utils } from '@iobroker/adapter-react-v5';
import { type Theme } from '@iobroker/adapter-react-v5/types';

import BasicUtils from '@/Utils';
import HostGeneric, {
    boxShadow, boxShadowHover, genericStyle,
    type HostGenericProps, type HostGenericState,
} from './HostGeneric';

const styles: Record<string, any> = (theme: Theme) => ({
    ...genericStyle(theme),
    root: {
        position: 'relative',
        margin: 7,
        background: theme.palette.background.default,
        boxShadow,
        // display: 'flex',
        overflow: 'hidden',
        transition: 'box-shadow 0.5s,height 0.3s',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
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
        alignItems: 'baseline',
    },
    onBlick: {
        animation: '$onBlink 2s ease-in-out',
        animationIterationCount: 2,
        fontSize: 12,
        marginLeft: 4,
    },
    '@keyframes onBlink': {
        '0%': {
            color: theme.palette.mode === 'dark' ? '#264d72' : '#3679be',
        },
        '80%': {
            color: theme.palette.mode === 'dark' ? '#3679be' : '#264d72',
        },
        '100%': {
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        },
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
    collapseOn: {
        animation: '$height 1s',
    },
    '@keyframes height': {
        '0%': {
            height: 0,
        },
        '100%': {
            height: 160,
        },
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
        justifyContent: 'space-between',
        padding: '10px !important',
        alignItems: 'center',
    },
    marginTop10: {
        // marginTop: 10
        marginLeft: 'auto',
        display: 'flex',
    },
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    green: {
        background: '#00ce00',
        position: 'relative',
        overflow: 'hidden',
    },
    dotLine: {
        width: 10,
        height: 20,
        background:
            'linear-gradient( rgba(0,206,0,0.7497373949579832) 0%, rgba(31,255,1,1) 50%, rgba(0,206,0,0.7805497198879552) 100%)',
        zIndex: 2,
        position: 'absolute',
        top: -21,
        // animation: '$colors 3s ease-in-out infinite'
    },
    '@keyframes colors': {
        '0%': {
            top: -21,
        },
        '100%': {
            top: '101%',
        },
    },
    red: {
        background: '#da0000',
        // animation: '$red 3s ease-in-out infinite alternate'
    },
    '@keyframes red': {
        '0%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0.8,
        },
    },
    flex: {
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
        cursor: 'no-drop !important',
    },
    wrapperFlex: {
        display: 'flex',
        cursor: 'pointer',
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
    wrapperColor: {
        position: 'relative',
        overflow: 'hidden',
    },
    '@media screen and (max-width: 1100px)': {
        hidden1100: {
            display: 'none !important',
        },
    },
    '@media screen and (max-width: 800px)': {
        hidden800: {
            display: 'none !important',
        },
    },
    '@media screen and (max-width: 600px)': {
        hidden600: {
            display: 'none !important',
        },
    },
    '@media screen and (max-width: 500px)': {
        wrapperFlex: {
            flexDirection: 'column',
        },
    },
    badge: {
        top: 14,
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center',
    },
    wrapperInfo: {
        display: 'flex',
        flexFlow: 'wrap',
        width: '100%',
        justifyContent: 'space-around',
    },
    wrapperBlockItem: {
        display: 'flex',
        flexFlow: 'nowrap',
        whiteSpace: 'nowrap',
        margin: 10,
    },
    bold: {
        fontWeight: 'bold',
    },
    nowrap: {
        display: 'flex',
        flexFlow: 'nowrap',
        flex: 1,
        whiteSpace: 'nowrap',
        marginRight: 5,
    },
    cell: {
        // paddingLeft: 6,
    },
});

interface HostRowProps extends HostGenericProps {
    hidden?: boolean;
}

interface HostRowState extends HostGenericState {
    openCollapse?: boolean;
}

class HostRow extends HostGeneric<HostRowProps, HostRowState> {
    renderValue(value: string) {
        if (typeof this.props.hostData !== 'object') {
            return null;
        }
        return <div className={this.props.classes.wrapperBlockItem} key={value}>
            <span className={Utils.clsx(this.props.classes.bold, this.props.classes.nowrap)}>
                {this.props.t(value)}
                :
                {' '}
            </span>
            {(HostGeneric.formatInfo[value] ? HostGeneric.formatInfo[value](this.props.hostData[value], this.props.t) : this.props.hostData[value] || '--')}
        </div>;
    }

    getHostDescriptionAll() {
        if (!this.props.hostData) {
            return <Skeleton />;
        }

        if (typeof this.props.hostData === 'string') {
            return this.props.hostData;
        }

        return <div className={this.props.classes.wrapperInfo}>
            <div className={this.props.classes.marginRight}>
                {this.props.hostData && typeof this.props.hostData === 'object' ?
                    Object.keys(this.props.hostData).map((value, idx) => idx < 5 && this.renderValue(value)) : <Skeleton />}
            </div>
            <div className={this.props.classes.marginRight}>
                {this.props.hostData && typeof this.props.hostData === 'object' ? Object.keys(this.props.hostData).map((value, idx) => idx > 4 && idx < 10 &&
                    this.renderValue(value)) : <Skeleton />}
            </div>
            <div className={this.props.classes.marginRight}>
                {this.props.hostData && typeof this.props.hostData === 'object' && Object.keys(this.props.hostData).map((value, idx) => idx > 10 &&
                    this.renderValue(value))}
            </div>
        </div>;
    }

    render() {
        const upgradeAvailable = (this.props.isCurrentHost || this.props.alive) && BasicUtils.updateAvailable(this.props.host.common.installedVersion, this.props.available);
        const { classes } = this.props;
        const description = this.getHostDescriptionAll();

        return <div
            style={{ border: `2px solid ${this.props.host.common.color || 'inherit'}`, borderRadius: 5 }}
            key={this.props.hostId}
            className={Utils.clsx(classes.root, this.props.hidden ? classes.hidden : '')}
        >
            {this.renderDialogs()}
            <div
                className={Utils.clsx(classes.wrapperFlex, !this.props.alive && classes.cursorNoDrop)}
                onClick={this.state.openDialogLogLevel ? null : () => this.setState({ openCollapse: !this.state.openCollapse })}
            >
                <div className={classes.wrapperColor}>
                    <div className={Utils.clsx(classes.onOff, this.props.alive ? classes.green : classes.red)} />
                    {this.props.alive && <div className={classes.dotLine} />}
                </div>
                <div
                    ref={this.refWarning}
                    style={{ background: this.props.host.common.color || 'inherit' }}
                    className={classes.imageBlock}
                >
                    {this.renderNotificationsBadge(<CardMedia
                        className={classes.img}
                        component="img"
                        // @ts-expect-error will be fixed in js-controller
                        image={this.props.host.common.image || 'img/no-image.png'}
                    />, true)}
                    <div
                        style={{ color: (this.props.host.common.color && Utils.invertColor(this.props.host.common.color, true)) || 'inherit' }}
                        className={classes.host}
                    >
                        {this.props.host.common.name}
                        {!this.state.openCollapse && typeof description === 'object' ? <span className={classes.onBlick}>
                            (
                            {this.props.t('Click for more')}
                            )
                        </span> : null}
                    </div>
                </div>
                <CardContent className={classes.cardContentH5}>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden800, classes.cell)}
                        variant="body2"
                        color="textSecondary"
                        component="div"
                    >
                        <div ref={this.refCpu}>- %</div>
                    </Typography>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden800, classes.cell)}
                        variant="body2"
                        color="textSecondary"
                        component="div"
                    >
                        <div ref={this.refMem}>- %</div>
                    </Typography>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden800, classes.cell)}
                        variant="body2"
                        color="textSecondary"
                        component="div"
                    >
                        <div ref={this.refUptime}>-/-</div>
                    </Typography>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden1100, classes.cell)}
                        variant="body2"
                        color="textSecondary"
                        component="div"
                    >
                        <div
                            className={Utils.clsx(upgradeAvailable && classes.greenText, classes.curdContentFlexCenter)}
                        >
                            {this.renderUpdateButton(upgradeAvailable)}
                        </div>
                    </Typography>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden1100)}
                        variant="body2"
                        color="textSecondary"
                        component="p"
                    >
                        {this.props.host.common.installedVersion}
                    </Typography>
                    <Typography
                        className={Utils.clsx(classes.flex, classes.hidden600, classes.cell)}
                        variant="body2"
                        color="textSecondary"
                        component="div"
                    >
                        <div ref={this.refEvents}>- / -</div>
                    </Typography>
                    <div className={classes.marginTop10}>
                        <Typography component="span" className={classes.enableButton}>
                            {this.renderEditButton()}
                            {this.renderHostBaseEdit()}
                            {this.renderRestartButton()}
                            {this.props.expertMode && this.state.logLevel ? this.renderLogLevel() : <div className={classes.emptyButton} />}
                            {this.renderRemoveButton()}
                        </Typography>
                    </div>
                </CardContent>
            </div>
            {this.state.openCollapse && typeof description === 'object' && <div
                className={Utils.clsx(classes.collapse, !this.state.openCollapse ? classes.collapseOff : classes.collapseOn)}
                onClick={event => event.stopPropagation()}
            >
                <CardContent className={classes.cardContentInfo}>
                    {description}
                    {this.renderCopyButton()}
                </CardContent>
                <div className={classes.footerBlock} />
            </div>}
        </div>;
    }
}

export default withStyles(styles)(HostRow);
