import React from 'react';
import { withStyles } from '@mui/styles';

import {
    Card,
    CardContent,
    CardMedia,
    Fab,
    Hidden,
    Typography,
    type Theme,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import {
    Utils,
} from '@iobroker/adapter-react-v5';

import InstanceGeneric, {
    type InstanceGenericProps,
    style as genericStyles,
    type InstanceGenericState,
} from './InstanceGeneric';
import IsVisible from '../IsVisible';
import BasicUtils from '../../Utils';

const styles: Record<string, any> = (theme: Theme) => ({
    ...genericStyles(theme),
    fab: {
        position: 'absolute',
        bottom: -20,
        width: 40,
        height: 40,
        right: 20,
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
        // color: theme.palette.mode === 'dark' ? '#333' : '#555',
    },

    cardContent: {
        marginTop: 16,
        paddingTop: 0,
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
    enableButton: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    instanceName: {
        fontSize: 16,
        padding: 4,
        paddingBottom: 15,
        fontWeight: 'bold',
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
    instanceStateNotEnabled1: {
        backgroundColor: 'rgba(192, 192, 192, 0.2)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.7)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    },
    instanceStateAliveNotConnected1: {
        backgroundColor: 'rgba(255, 177, 0, 0.4)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    },
    instanceStateAliveAndConnected1: {
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    },
});

interface InstanceCardProps extends InstanceGenericProps {

}

interface InstanceCardState extends InstanceGenericState {
    mouseOver: boolean;
}

class InstanceCard extends InstanceGeneric<InstanceCardProps, InstanceCardState> {
    constructor(props: InstanceCardProps) {
        super(props);

        this.state = Object.assign(this.getDefaultState(props), { mouseOver: false });
    }

    renderSecondCardInfo() {
        if (this.props.deleting || (!this.props.expanded && !this.state.mouseOver)) {
            return null;
        }
        const { classes, item, instance } = this.props;
        return <div
            className={Utils.clsx(
                classes.collapse,
                !this.props.expanded ? classes.collapseOff : '',
                this.props.deleting && classes.deleting,
            )}
        >
            <CardContent classes={{ root: classes.cardContent }} className={classes.overflowAuto}>
                <div className={classes.collapseIcon}>
                    <div className={classes.close} onClick={() => this.props.context.onToggleExpanded(instance.id)} />
                </div>
                <Typography gutterBottom component="span" variant="body2">
                    {this.renderInfo()}

                    {this.renderVersion()}

                    {this.renderMemoryUsage()}

                    {item.running && this.props.context.expertMode &&
                        <div className={classes.displayFlex}>
                            {this.renderInputOutput()}
                        </div>}

                    {this.props.context.expertMode && <div className={classes.displayFlex}>
                        {this.renderRamLimit()}
                    </div>}

                    {this.props.context.expertMode && <div className={classes.displayFlex}>
                        {this.renderLogLevel()}
                    </div>}

                    {item.modeSchedule && <div className={classes.displayFlex}>
                        {this.renderSchedule()}
                    </div>}

                    {this.props.context.expertMode && (instance.mode === 'daemon') &&
                        <div className={classes.displayFlex}>
                            {this.renderRestartSchedule()}
                        </div>}

                    {this.props.context.expertMode && item.checkCompact && item.compact && item.supportCompact &&
                        <div className={classes.displayFlex}>
                            {this.renderCompactGroup()}
                        </div>}

                    {this.props.context.expertMode && <div className={classes.displayFlex}>
                        {this.renderTier()}
                    </div>}

                    {this.props.context.hosts.length > 1 || (this.props.context.hosts.length && this.props.context.hosts[0].common?.name !== instance.host) ?
                        <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                            {this.renderHostWithButton()}
                        </div> : null}

                    <IsVisible config={item} name="allowInstanceSettings">
                        <Hidden smUp>
                            {this.renderSettingsButton()}
                        </Hidden>
                    </IsVisible>
                </Typography>
            </CardContent>

            <div className={classes.footerBlock}>
                <IsVisible config={item} name="allowInstanceDelete">
                    <div className={classes.displayFlex}>
                        {this.renderDeleteButton()}
                    </div>
                </IsVisible>

                {this.props.context.expertMode && item.checkSentry && <div className={classes.displayFlex}>
                    {this.renderSentry()}
                </div>}

                {item.supportCompact && this.props.context.expertMode && item.checkCompact && <div className={classes.displayFlex}>
                    {this.renderCompactGroupEnabled()}
                </div>}
            </div>
        </div>;
    }

    render() {
        const { item, classes, instance } = this.props;

        return <Card className={Utils.clsx(classes.root, this.props.hidden ? classes.hidden : '')}>
            {this.state.openDialog && this.renderDialogs()}
            {this.renderSecondCardInfo()}
            <div
                className={Utils.clsx(
                    this.props.classes.imageBlock,
                    (!item.running || instance.mode !== 'daemon' || item.stoppedWhenWebExtension !== undefined) && classes.instanceStateNotEnabled1,
                    item.running && instance.mode === 'daemon' && item.stoppedWhenWebExtension === undefined && (!item.connectedToHost || !item.alive) && classes.instanceStateNotAlive1,
                    item.running && item.connectedToHost && item.alive && item.connected === false && classes.instanceStateAliveNotConnected1,
                    item.running && item.connectedToHost && item.alive && item.connected !== false && classes.instanceStateAliveAndConnected1,
                )}
            >
                <CardMedia className={classes.img} component="img" image={instance.image || 'img/no-image.png'} />
                <div className={classes.adapter}>{instance.id}</div>
                <div className={classes.versionDate}>
                    {/* {expertMode && item.checkCompact && <Tooltip title={t('compact groups')}>
                    <ViewCompactIcon color="action" style={{ margin: 10 }} />
                </Tooltip>} */}
                </div>
                {!this.props.expanded ? <Fab
                    onMouseOver={() => this.setState({ mouseOver: true })}
                    onMouseOut={() => this.setState({ mouseOver: false })}
                    onClick={() => this.props.context.onToggleExpanded(instance.id)}
                    className={classes.fab}
                    color="primary"
                    aria-label="add"
                >
                    <MoreVertIcon />
                </Fab> : null}
            </div>

            <CardContent className={classes.cardContentH5}>
                <Typography gutterBottom variant="h5" component="h5">
                    <div
                        // onMouseMove={() => this.setState({ visibleEdit: true })}
                        onMouseEnter={() => this.setState({ visibleEdit: true })}
                        onMouseLeave={() => this.setState({ visibleEdit: false })}
                        className={classes.displayFlex}
                    >
                        {BasicUtils.getText(item.name, this.props.context.lang)}
                        {this.renderEditNameButton()}
                    </div>
                </Typography>

                <div className={classes.marginTop10}>
                    <Typography component="span" className={classes.enableButton}>
                        {this.renderPlayPause()}
                        <Hidden xsDown>
                            {this.renderSettingsButton()}
                        </Hidden>
                        {this.renderRestartButton()}
                        <IsVisible config={item} name="allowInstanceLink">
                            {this.renderLink()}
                        </IsVisible>
                    </Typography>
                </div>
            </CardContent>
        </Card>;
    }
}

export default withStyles(styles)(InstanceCard);
