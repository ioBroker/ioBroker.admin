import React from 'react';
import { withStyles } from '@mui/styles';

import {
    Accordion, AccordionDetails, AccordionSummary, Avatar,
    Grid, Hidden,
    Tooltip, Typography,
} from '@mui/material';

import {
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import {
    Utils,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

import BasicUtils from '@/Utils';
import InstanceInfo from './InstanceInfo';
import IsVisible from '../IsVisible';
import InstanceGeneric, {
    type InstanceGenericProps,
    type InstanceGenericState,
    style as genericStyles,
} from './InstanceGeneric';

const styles: Record<string, any> = (theme: IobTheme) => ({
    ...genericStyles(theme),
    row: {
        paddingLeft: 8,
        paddingRight: 16,
        padding: 0,
    },
    invisible: {
        opacity: 0,
    },
    instanceName: {
        fontSize: 16,
        paddingLeft: 32,
        paddingBottom: 5,
        fontWeight: 'bold',
    },

    instanceIcon: {
        height: 42,
        width: 42,
    },
    hidden1250: {
        display: 'flex',
        width: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    visible1250: {
        display: 'flex',
        width: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    visible1050: {
        display: 'none',
    },
    hidden1050: {
        display: 'flex',
    },
    hidden800: {
        display: 'flex',
    },
    visible800: {
        display: 'none',
    },
    hidden570: {
        display: 'flex',
    },
    visible570: {
        display: 'none',
    },
    '@media screen and (max-width: 1500px)': {
        hidden1250: {
            display: 'none !important',
        },
        visible1250: {
            display: 'flex !important',
        },
    },
    '@media screen and (max-width: 1300px)': {
        hidden1230: {
            display: 'none !important',
        },
    },
    '@media screen and (max-width: 1120px)': {
        hidden1050: {
            display: 'none !important',
        },
        visible1050: {
            display: 'flex !important',
        },
    },
    '@media screen and (max-width: 800px)': {
        hidden800: {
            display: 'none !important',
        },
        visible800: {
            display: 'flex !important',
        },
        instanceIcon: {
            height: 28,
            width: 28,
            marginLeft: 4,
            marginTop: 8,
        },
    },
    hidden380: {
        display: 'flex',
    },
    '@media screen and (max-width: 650px)': {
        hidden570: {
            display: 'none !important',
        },
        visible570: {
            display: 'flex !important',
        },
    },
    '@media screen and (max-width: 380px)': {
        hidden380: {
            display: 'none !important',
        },
        instanceId: {
            width: '70px !important',
            minWidth: '70px !important',
        },
    },
    '@media screen and (max-width: 480px)': {
        gridStyle: {
            minWidth: 'auto !important',
            marginLeft: 10,
        },
        instanceId: {
            width: 100,
        },
        maxWidth300: {
            width: '250px !important',
        },
    },
    '@media screen and (max-width: 335px)': {
        gridStyle: {
            marginLeft: 0,
        },
    },
    secondaryHeading: {
        maxWidth: 200,
        fontSize: 12,
    },
    secondaryHeadingDiv: {
        display: 'flex',
        alignItems: 'center',
        width: 200,
    },
    secondaryHeadingDivDiv: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        padding: 5,
        textOverflow: 'ellipsis',
        maxWidth: 200,
    },
    gridStyle: {
        display: 'flex',
        minWidth: 270,
        lineHeight: '34px',
        justifyContent: 'space-around',
    },
    instanceId: {
        overflow: 'hidden',
        alignSelf: 'center',
        fontSize: 16,
        marginLeft: 5,
        maxWidth: 150,
        minWidth: 100,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        flexGrow: 2,
    },

    paddingRight200: {
        // paddingRight: 200
    },
    maxWidth300: {
        width: 300,
    },
    width150: {
        width: 150,
    },

    desktopRow: {
        minHeight: 0,
    },
    desktopIcon: {
        height: 32,
        width: 32,
        marginTop: 8,
    },
    desktopRowContent: {
        marginTop: 2,
        marginBottom: 2,
    },
    desktopButton: {
        paddingRight: 12,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 4,
    },
    rowGridLine: {
        marginTop: -2,
    },
});

interface InstanceRowProps extends InstanceGenericProps {

}

class InstanceRow extends InstanceGeneric<InstanceRowProps, InstanceGenericState> {
    private desktop: boolean = window.innerWidth > 1000;

    constructor(props: InstanceRowProps) {
        super(props);

        this.state = this.getDefaultState(props);
    }

    renderDetails() {
        const { instance, item, classes } = this.props;

        return <AccordionDetails>
            <Grid container direction="row">
                <Grid item container direction="row" xs={10}>
                    <Grid item container direction="column" xs={12} sm={6} md={4}>
                        {this.renderInfo()}
                    </Grid>
                    <Grid container item direction="column" xs={12} sm={6} md={4}>
                        {this.renderVersion()}
                    </Grid>
                    <Grid container item direction="column" xs={12} sm={6} md={4} className={classes.paddingRight200}>
                        {this.props.context.expertMode && <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                            {this.renderLogLevel()}
                        </div>}
                        {item.running && this.props.context.expertMode &&
                            <div className={classes.visible1250}>
                                {this.renderInputOutput()}
                            </div>}
                        <Grid item className={classes.visible1050}>
                            {this.renderMemoryUsage()}
                        </Grid>
                        {item.modeSchedule && <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                            {this.renderSchedule()}
                        </div>}
                        {this.props.context.expertMode && (instance.mode === 'daemon') &&
                            <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                                {this.renderRestartSchedule()}
                            </div>}
                        {this.props.context.expertMode &&
                            <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                                {this.renderRamLimit()}
                            </div>}
                        {this.props.context.expertMode && item.checkCompact && item.compact && item.supportCompact &&
                            <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                                {this.renderCompactGroup()}
                            </div>}
                        {this.props.context.expertMode && <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                            {this.renderTier()}
                        </div>}
                        <div className={Utils.clsx(classes.maxWidth300, classes.visible800)}>
                            <InstanceInfo>
                                {BasicUtils.getText(item.name, this.props.context.lang)}
                            </InstanceInfo>
                            {this.renderEditNameButton()}
                        </div>
                        {this.props.context.hosts.length > 1 || (this.props.context.hosts.length && this.props.context.hosts[0].common?.name !== instance.host) ? <div className={Utils.clsx(classes.displayFlex, classes.maxWidth300)}>
                            {this.renderHostWithButton()}
                        </div> : null}
                    </Grid>
                </Grid>
                <div className={classes.displayFlex}>
                    <IsVisible config={item} name="allowInstanceDelete">
                        <Hidden smUp>
                            {this.renderSettingsButton()}
                        </Hidden>
                    </IsVisible>
                    <IsVisible config={item} name="allowInstanceDelete">
                        {this.renderDeleteButton()}
                    </IsVisible>
                    <div className={classes.visible570}>
                        {this.renderSentry()}
                    </div>
                    <div className={classes.visible570}>
                        {this.renderCompactGroupEnabled()}
                    </div>
                </div>
            </Grid>
        </AccordionDetails>;
    }

    render() {
        const { instance, item, classes } = this.props;
        const status = this.props.context.getInstanceStatus(instance.obj);

        const stateTooltip = this.renderTooltip();

        return <Accordion
            square
            classes={{ root: Utils.clsx(this.props.deleting, this.props.hidden ? classes.hidden : '') }}
            expanded={this.props.expanded && !this.props.deleting}
            onChange={() => {
                if (this.state.openDialog) {
                    return;
                }
                this.props.context.onToggleExpanded(instance.id);
            }}
        >
            <AccordionSummary
                classes={{
                    root: classes.row,
                    content:  this.desktop ? classes.desktopRowContent : undefined,
                }}
                className={Utils.clsx(
                    (!item.running || instance.mode !== 'daemon' || item.stoppedWhenWebExtension !== undefined) && (this.props.idx % 2 === 0 ? classes.instanceStateNotEnabled1 : classes.instanceStateNotEnabled2),
                    item.running && instance.mode === 'daemon' && item.stoppedWhenWebExtension === undefined && (!item.connectedToHost || !item.alive) && (this.props.idx % 2 === 0 ? classes.instanceStateNotAlive1 : classes.instanceStateNotAlive2),
                    item.running && item.connectedToHost && item.alive && item.connected === false && (this.props.idx % 2 === 0 ? classes.instanceStateAliveNotConnected1 : classes.instanceStateAliveNotConnected2),
                    item.running && item.connectedToHost && item.alive && item.connected !== false && (this.props.idx % 2 === 0 ? classes.instanceStateAliveAndConnected1 : classes.instanceStateAliveAndConnected1),
                    this.desktop && classes.desktopRow,
                )}
                expandIcon={<ExpandMoreIcon className={this.desktop ? classes.desktopButton : undefined} />}
            >
                {this.renderDialogs()}
                <Grid container spacing={1} alignItems="center" direction="row" wrap="nowrap" className={classes.rowGridLine}>
                    <div className={classes.gridStyle}>
                        {stateTooltip.length ?
                            <Tooltip
                                classes={{ popper: classes.tooltip }}
                                title={<span style={{ display: 'flex', flexDirection: 'column' }}>
                                    {stateTooltip}
                                </span>}
                            >
                                {this.renderModeIcon(status)}
                            </Tooltip>
                            : this.renderModeIcon(status)}
                        <Avatar
                            variant="square"
                            alt={instance.id}
                            src={instance.image}
                            className={Utils.clsx(classes.instanceIcon, this.desktop && classes.desktopIcon)}
                        />
                        <div className={classes.instanceId}>{instance.id}</div>
                    </div>

                    {this.renderPlayPause()}

                    <IsVisible config={item} name="allowInstanceSettings">
                        <Hidden xsDown>
                            {this.renderSettingsButton()}
                        </Hidden>
                    </IsVisible>

                    {this.renderRestartButton()}

                    <IsVisible config={item} name="allowInstanceLink">
                        {this.renderLink()}
                    </IsVisible>

                    <Typography className={Utils.clsx(classes.secondaryHeading, classes.hidden800)} component="div">
                        <div
                            // onMouseMove={() => this.setState({ visibleEdit: true })}
                            onMouseEnter={() => this.setState({ visibleEdit: true })}
                            onMouseLeave={() => this.setState({ visibleEdit: false })}
                            className={classes.secondaryHeadingDiv}
                        >
                            <div className={classes.secondaryHeadingDivDiv}>{BasicUtils.getText(item.name, this.props.context.lang)}</div>
                            {this.renderEditNameButton()}
                        </div>
                    </Typography>
                    {this.props.context.expertMode &&
                        <div className={Utils.clsx(classes.hidden1250, (instance.mode !== 'daemon' || !item.running) && classes.invisible)}>
                            {this.renderInputOutput()}
                        </div>}
                    {this.props.context.expertMode &&
                        <Tooltip
                            title={item.logLevelObject === item.logLevel ? `${this.props.context.t('loglevel')} ${item.logLevel}` : `${this.props.context.t('saved:')} ${item.logLevelObject} / ${this.props.context.t('actual:')} ${item.logLevel}`}
                            classes={{ popper: classes.tooltip }}
                        >
                            <Avatar className={Utils.clsx(classes.smallAvatar, classes.hidden380, classes[item.logLevel])}>
                                {item.loglevelIcon}
                            </Avatar>
                        </Tooltip>}
                    <Grid item className={Utils.clsx(classes.hidden1050, classes.width150, (instance.mode !== 'daemon' || !item.running) && classes.invisible)}>
                        {this.renderMemoryUsage()}
                    </Grid>
                    {this.props.context.hosts.length > 1 || (this.props.context.hosts.length && this.props.context.hosts[0].common?.name !== instance.host) ? <Grid item className={Utils.clsx(classes.hidden1230)}>
                        {this.renderHost()}
                    </Grid> : null}
                </Grid>
                <div className={classes.hidden570}>
                    {this.renderSentry()}
                </div>
                <div className={classes.hidden570}>
                    {this.renderCompactGroupEnabled()}
                </div>
            </AccordionSummary>
            {this.props.expanded ? this.renderDetails() : null}
            {this.renderDialogs()}
        </Accordion>;
    }
}

export default withStyles(styles)(InstanceRow);
