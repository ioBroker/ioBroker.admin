import React, { type JSX } from 'react';

import { Accordion, AccordionDetails, AccordionSummary, Avatar, Grid2, Tooltip, Typography, Box } from '@mui/material';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import AdminUtils from '@/helpers/AdminUtils';
import InstanceInfo from './InstanceInfo';
import IsVisible from '../IsVisible';
import InstanceGeneric, {
    type InstanceGenericProps,
    type InstanceGenericState,
    styles as genericStyles,
} from './InstanceGeneric';

const styles: Record<string, any> = {
    ...genericStyles,
    row: {
        pl: 1,
        pr: 2,
        p: 0,
    },
    expanded: {
        minHeight: 64,
    },
    invisible: {
        opacity: 0,
    },
    instanceIcon: {
        height: 42,
        width: 42,
        '@media screen and (max-width: 800px)': {
            height: 28,
            width: 28,
            ml: '4px',
        },
    },
    hidden1250: {
        display: 'flex',
        width: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media screen and (max-width: 1500px)': {
            display: 'none !important',
        },
    },
    visible1250: {
        display: 'flex',
        width: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media screen and (max-width: 1500px)': {
            display: 'flex !important',
        },
    },
    visible1050: {
        display: 'none',
        '@media screen and (max-width: 1120px)': {
            display: 'flex !important',
        },
    },
    hidden1050: {
        display: 'flex',
        '@media screen and (max-width: 1120px)': {
            display: 'none !important',
        },
    },
    hidden800: {
        display: 'flex',
        '@media screen and (max-width: 800px)': {
            display: 'none !important',
        },
    },
    visible800: {
        display: 'none',
        '@media screen and (max-width: 800px)': {
            display: 'flex !important',
        },
    },
    hidden570: {
        display: 'flex',
        '@media screen and (max-width: 650px)': {
            display: 'none !important',
        },
    },
    visible570: {
        display: 'none',
        '@media screen and (max-width: 650px)': {
            display: 'flex !important',
        },
    },
    hidden1230: {
        '@media screen and (max-width: 1300px)': {
            display: 'none !important',
        },
    },
    hidden380: {
        display: 'flex',
        '@media screen and (max-width: 380px)': {
            display: 'none !important',
        },
    },
    instanceId: {
        overflow: 'hidden',
        alignSelf: 'center',
        fontSize: 16,
        ml: '5px',
        maxWidth: 150,
        minWidth: 100,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        flexGrow: 2,
        '@media screen and (max-width: 380px)': {
            width: '70px !important',
            minWidth: '70px !important',
        },
        '@media screen and (max-width: 480px)': {
            width: 100,
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
        alignItems: 'center',
        '@media screen and (max-width: 480px)': {
            minWidth: 'auto !important',
            ml: '10px',
        },
        '@media screen and (max-width: 335px)': {
            ml: '0px',
        },
    },
    paddingRight200: {
        // paddingRight: 200
    },
    maxWidth300: {
        width: 300,
        '@media screen and (max-width: 480px)': {
            width: '250px !important',
        },
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
        mt: 1,
    },
    desktopRowContent: {
        mt: '2px',
        mb: '2px',
    },
    desktopButton: {
        // paddingRight: 12,
        // paddingTop: 4,
        // paddingBottom: 4,
        // paddingLeft: 4,
    },
    rowGridLine: {
        marginTop: -2,
    },
};

class InstanceRow extends InstanceGeneric<InstanceGenericProps, InstanceGenericState> {
    private desktop: boolean = window.innerWidth > 1000;

    protected styles: Record<string, any> = styles;

    constructor(props: InstanceGenericProps) {
        super(props);

        this.state = this.getDefaultState(props);
    }

    renderDetails(): JSX.Element {
        const { instance, item } = this.props;

        return (
            <AccordionDetails>
                <Grid2
                    container
                    direction="row"
                >
                    <Grid2
                        container
                        direction="row"
                        size={{ xs: 10 }}
                    >
                        <Grid2
                            container
                            direction="column"
                            size={{ xs: 12, sm: 6, md: 4 }}
                        >
                            {this.renderInfo(true)}
                        </Grid2>
                        <Grid2
                            container
                            direction="column"
                            size={{ xs: 12, sm: 6, md: 4 }}
                        >
                            {this.renderVersion()}
                        </Grid2>
                        <Grid2
                            container
                            direction="column"
                            size={{ xs: 12, sm: 6, md: 4 }}
                            style={styles.paddingRight200}
                        >
                            {this.props.context.expertMode && (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderLogLevel()}
                                </Box>
                            )}
                            {item.running && this.props.context.expertMode && (
                                <Box
                                    component="div"
                                    sx={styles.visible1250}
                                >
                                    {this.renderInputOutput()}
                                </Box>
                            )}
                            <Grid2 sx={styles.visible1050}>{this.renderMemoryUsage()}</Grid2>
                            {item.modeSchedule && (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderSchedule()}
                                </Box>
                            )}
                            {this.props.context.expertMode && instance.mode === 'daemon' && (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderRestartSchedule()}
                                </Box>
                            )}
                            {this.props.context.expertMode && (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderRamLimit()}
                                </Box>
                            )}
                            {this.props.context.expertMode &&
                                item.checkCompact &&
                                item.compact &&
                                item.supportCompact && (
                                    <Box
                                        component="div"
                                        sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                    >
                                        {this.renderCompactGroup()}
                                    </Box>
                                )}
                            {this.props.context.expertMode && (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderTier()}
                                </Box>
                            )}
                            <Box
                                component="div"
                                sx={{ ...styles.maxWidth300, ...styles.visible800, ...styles.editButton }}
                            >
                                <InstanceInfo>{AdminUtils.getText(item.name, this.props.context.lang)}</InstanceInfo>
                                {this.renderEditNameButton()}
                            </Box>
                            {this.props.context.hosts.length > 1 ||
                            (this.props.context.hosts.length &&
                                this.props.context.hosts[0].common?.name !== instance.host) ? (
                                <Box
                                    component="div"
                                    sx={{ ...styles.displayFlex, ...styles.maxWidth300, ...styles.editButton }}
                                >
                                    {this.renderHostWithButton()}
                                </Box>
                            ) : null}
                        </Grid2>
                    </Grid2>
                    <div style={styles.displayFlex}>
                        <IsVisible
                            config={item}
                            name="allowInstanceDelete"
                        >
                            <Box
                                component="div"
                                sx={{ display: { xs: 'inline-block', md: 'none' } }}
                            >
                                {this.renderSettingsButton()}
                            </Box>
                        </IsVisible>
                        <Box
                            component="div"
                            sx={{ display: { md: 'none', xs: 'inline-block' } }}
                        >
                            {this.renderRestartButton()}
                        </Box>
                        <IsVisible
                            config={item}
                            name="allowInstanceLink"
                        >
                            <Box
                                component="div"
                                sx={{ display: { md: 'none', xs: 'inline-block' } }}
                            >
                                {this.renderLink()}
                            </Box>
                        </IsVisible>
                        <IsVisible
                            config={item}
                            name="allowInstanceDelete"
                        >
                            {this.renderDeleteButton()}
                        </IsVisible>
                        <Box
                            component="div"
                            sx={styles.visible570}
                        >
                            {this.renderSentry()}
                        </Box>
                        <Box
                            component="div"
                            sx={styles.visible570}
                        >
                            {this.renderCompactGroupEnabled()}
                        </Box>
                    </div>
                </Grid2>
            </AccordionDetails>
        );
    }

    render(): JSX.Element {
        const { instance, item } = this.props;
        const status = this.props.context.getInstanceStatus(instance.obj);

        const stateTooltip = this.renderTooltip();

        const rootStyle = {
            ...styles.row,
            ...((!item.running || instance.mode !== 'daemon' || item.stoppedWhenWebExtension !== undefined) &&
                (this.props.idx % 2 === 0 ? styles.instanceStateNotEnabled1 : styles.instanceStateNotEnabled2)),
            ...(item.running &&
            instance.mode === 'daemon' &&
            item.stoppedWhenWebExtension === undefined &&
            (!item.connectedToHost || !item.alive)
                ? this.props.idx % 2 === 0
                    ? styles.instanceStateNotAlive1
                    : styles.instanceStateNotAlive2
                : undefined),
            ...(item.running && item.connectedToHost && item.alive && item.connected === false
                ? this.props.idx % 2 === 0
                    ? styles.instanceStateAliveNotConnected1
                    : styles.instanceStateAliveNotConnected2
                : undefined),
            ...(item.running && item.connectedToHost && item.alive && item.connected !== false
                ? this.props.idx % 2 === 0
                    ? styles.instanceStateAliveAndConnected1
                    : styles.instanceStateAliveAndConnected2
                : undefined),
            ...(this.desktop ? styles.desktopRow : undefined),
            ...(this.state.expanded && !this.props.deleting ? styles.expanded : undefined),
        };

        return (
            <Accordion
                square
                sx={{
                    '&.MuiAccordion-root': {
                        ...(this.props.deleting ? styles.deleting : undefined),
                        ...(this.props.hidden ? styles.hidden : undefined),
                    },
                }}
                expanded={this.state.expanded && !this.props.deleting}
                onChange={() => {
                    if (this.state.openDialog) {
                        return;
                    }
                    this.setState({ expanded: !this.state.expanded }, () =>
                        this.props.context.onToggleExpanded(this.props.id, this.state.expanded),
                    );
                }}
            >
                <AccordionSummary
                    sx={{
                        '&.MuiAccordionSummary-root': rootStyle,
                        '& .MuiAccordionSummary-content': this.desktop ? styles.desktopRowContent : undefined,
                    }}
                    expandIcon={<ExpandMoreIcon style={this.desktop ? styles.desktopButton : undefined} />}
                >
                    {this.renderDialogs()}
                    <Grid2
                        container
                        spacing={1}
                        alignItems="center"
                        direction="row"
                        wrap="nowrap"
                        style={styles.rowGridLine}
                    >
                        <Box
                            component="div"
                            style={styles.gridStyle}
                        >
                            {stateTooltip.length ? (
                                <Tooltip
                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                    title={
                                        <span style={{ display: 'flex', flexDirection: 'column' }}>{stateTooltip}</span>
                                    }
                                >
                                    {this.renderModeIcon(status)}
                                </Tooltip>
                            ) : (
                                this.renderModeIcon(status)
                            )}
                            <Avatar
                                variant="square"
                                alt={instance.id}
                                src={instance.image}
                                sx={{ ...styles.instanceIcon, ...(this.desktop ? styles.desktopIcon : undefined) }}
                            />
                            <Box
                                component="div"
                                sx={styles.instanceId}
                            >
                                {instance.id}
                            </Box>
                        </Box>

                        {this.renderPlayPause()}

                        <IsVisible
                            config={item}
                            name="allowInstanceSettings"
                        >
                            <Box
                                component="div"
                                sx={{ display: { md: 'inline-block', xs: 'none' } }}
                            >
                                {this.renderSettingsButton()}
                            </Box>
                        </IsVisible>

                        <Box
                            component="div"
                            sx={{ display: { md: 'inline-block', xs: 'none' } }}
                        >
                            {this.renderRestartButton()}
                        </Box>

                        <IsVisible
                            config={item}
                            name="allowInstanceLink"
                        >
                            <Box
                                component="div"
                                sx={{ display: { md: 'inline-block', xs: 'none' } }}
                            >
                                {this.renderLink()}
                            </Box>
                        </IsVisible>

                        <Typography
                            sx={{ ...styles.secondaryHeading, ...styles.hidden800 }}
                            component="div"
                        >
                            <div
                                // onMouseMove={() => this.setState({ visibleEdit: true })}
                                onMouseEnter={() => this.setState({ visibleEdit: true })}
                                onMouseLeave={() => this.setState({ visibleEdit: false })}
                                style={styles.secondaryHeadingDiv}
                            >
                                <div style={styles.secondaryHeadingDivDiv}>
                                    {AdminUtils.getText(item.name, this.props.context.lang)}
                                </div>
                                {this.renderEditNameButton()}
                            </div>
                        </Typography>
                        {this.props.context.expertMode && (
                            <Box
                                component="div"
                                sx={{
                                    ...styles.hidden1250,
                                    ...(instance.mode !== 'daemon' || !item.running ? styles.invisible : undefined),
                                }}
                            >
                                {this.renderInputOutput()}
                            </Box>
                        )}
                        {this.props.context.expertMode && (
                            <Tooltip
                                title={
                                    item.logLevelObject === item.logLevel
                                        ? `${this.props.context.t('loglevel')} ${item.logLevel}`
                                        : `${this.props.context.t('saved:')} ${item.logLevelObject} / ${this.props.context.t('actual:')} ${item.logLevel}`
                                }
                                slotProps={{ popper: { sx: styles.tooltip } }}
                            >
                                <Avatar sx={{ ...styles.smallAvatar, ...styles.hidden380, ...styles[item.logLevel] }}>
                                    {item.loglevelIcon}
                                </Avatar>
                            </Tooltip>
                        )}
                        <Grid2
                            sx={{
                                ...styles.hidden1050,
                                ...styles.width150,
                                ...(instance.mode !== 'daemon' || !item.running ? styles.invisible : undefined),
                            }}
                        >
                            {this.renderMemoryUsage()}
                        </Grid2>
                        {this.props.context.hosts.length > 1 ||
                        (this.props.context.hosts.length &&
                            this.props.context.hosts[0].common?.name !== instance.host) ? (
                            <Grid2 sx={styles.hidden1230}>{this.renderHost()}</Grid2>
                        ) : null}
                    </Grid2>
                    <Box
                        component="div"
                        sx={styles.hidden570}
                    >
                        {this.renderSentry()}
                    </Box>
                    <Box
                        component="div"
                        sx={styles.hidden570}
                    >
                        {this.renderCompactGroupEnabled()}
                    </Box>
                </AccordionSummary>
                {this.state.expanded ? this.renderDetails() : null}
                {this.renderDialogs()}
            </Accordion>
        );
    }
}

export default InstanceRow;
