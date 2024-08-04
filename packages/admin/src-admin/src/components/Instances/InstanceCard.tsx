import React from 'react';

import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Fab,
    Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import {
    Utils,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

import InstanceGeneric, {
    type InstanceGenericProps,
    styles as genericStyles,
    type InstanceGenericState,
} from './InstanceGeneric';
import IsVisible from '../IsVisible';
import AdminUtils from '../../AdminUtils';

const styles: Record<string, any> = {
    ...genericStyles,
    fab: {
        position: 'absolute',
        bottom: -20,
        width: 40,
        height: 40,
        right: 20,
    },
    collapse: (theme: IobTheme) => ({
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
    }),
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
        mb: '10px',
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
    footerBlock: (theme: IobTheme) => ({
        background: theme.palette.background.default,
        p: '10px',
        display: 'flex',
        justifyContent: 'space-between',
    }),
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
        mt: 2,
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
    collapseIcon: (theme: IobTheme) => ({
        position: 'sticky',
        right: 0,
        top: 0,
        background: theme.palette.mode === 'dark' ? '#4a4a4a' : '#d4d4d4',
        zIndex: 2,
    }),
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
    instanceStateNotEnabled1: (theme: IobTheme) => ({
        backgroundColor: 'rgba(192, 192, 192, 0.2)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    }),
    instanceStateNotAlive1: (theme: IobTheme) => ({
        backgroundColor: 'rgba(192, 192, 192, 0.7)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    }),
    instanceStateAliveNotConnected1: (theme: IobTheme) => ({
        backgroundColor: 'rgba(255, 177, 0, 0.4)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    }),
    instanceStateAliveAndConnected1: (theme: IobTheme) => ({
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
        color: theme.palette.mode === 'dark' ? '#CCC' : '#333',
    }),
};

interface InstanceCardState extends InstanceGenericState {
    mouseOver: boolean;
}

class InstanceCard extends InstanceGeneric<InstanceGenericProps, InstanceCardState> {
    protected styles: Record<string, any> = styles;

    constructor(props: InstanceGenericProps) {
        super(props);

        this.state = Object.assign(this.getDefaultState(props), { mouseOver: false });
    }

    renderSecondCardInfo() {
        if (this.props.deleting || !this.state.expanded) {
            return null;
        }
        const { item, instance } = this.props;
        return <Box
            component="div"
            sx={Utils.getStyle(
                this.props.context.theme,
                styles.collapse,
                !this.state.expanded ? styles.collapseOff : '',
                this.props.deleting && styles.deleting,
            )}
        >
            <CardContent sx={{ '&.MuiCardContent-root': { ...styles.cardContent, ...styles.overflowAuto } }}>
                <Box component="div" sx={styles.collapseIcon}>
                    <Box
                        component="div"
                        sx={styles.close}
                        onClick={() => {
                            if (this.state.openDialog) {
                                return;
                            }
                            this.setState({ expanded: false }, () =>
                                this.props.context.onToggleExpanded(this.props.id, false));
                        }}
                    />
                </Box>
                <Typography gutterBottom component="span" variant="body2">
                    {this.renderInfo()}

                    {this.renderVersion()}

                    {this.renderMemoryUsage()}

                    {item.running && this.props.context.expertMode &&
                        <div style={styles.displayFlex}>
                            {this.renderInputOutput()}
                        </div>}

                    {this.props.context.expertMode && <div style={styles.displayFlex}>
                        {this.renderRamLimit()}
                    </div>}

                    {this.props.context.expertMode && <div style={styles.displayFlex}>
                        {this.renderLogLevel()}
                    </div>}

                    {item.modeSchedule && <div style={styles.displayFlex}>
                        {this.renderSchedule()}
                    </div>}

                    {this.props.context.expertMode && (instance.mode === 'daemon') &&
                        <div style={styles.displayFlex}>
                            {this.renderRestartSchedule()}
                        </div>}

                    {this.props.context.expertMode && item.checkCompact && item.compact && item.supportCompact &&
                        <div style={styles.displayFlex}>
                            {this.renderCompactGroup()}
                        </div>}

                    {this.props.context.expertMode && <div style={styles.displayFlex}>
                        {this.renderTier()}
                    </div>}

                    {this.props.context.hosts.length > 1 || (this.props.context.hosts.length && this.props.context.hosts[0].common?.name !== instance.host) ?
                        <div style={styles.displayFlex}>
                            {this.renderHostWithButton()}
                        </div> : null}

                    <IsVisible config={item} name="allowInstanceSettings">
                        <Box
                            component="div"
                            sx={{ display: { sm: 'none', xs: 'inline-block' } }}
                        >
                            {this.renderSettingsButton()}
                        </Box>
                    </IsVisible>
                </Typography>
            </CardContent>

            <Box component="div" sx={styles.footerBlock}>
                <IsVisible config={item} name="allowInstanceDelete">
                    <div style={styles.displayFlex}>
                        {this.renderDeleteButton()}
                    </div>
                </IsVisible>

                {this.props.context.expertMode && item.checkSentry && <div style={styles.displayFlex}>
                    {this.renderSentry()}
                </div>}

                {item.supportCompact && this.props.context.expertMode && item.checkCompact && <div style={styles.displayFlex}>
                    {this.renderCompactGroupEnabled()}
                </div>}
            </Box>
        </Box>;
    }

    render() {
        const { item, instance } = this.props;

        return <Card sx={Utils.getStyle(this.props.context.theme, styles.root, this.props.hidden && styles.hidden)}>
            {this.state.openDialog && this.renderDialogs()}
            {this.renderSecondCardInfo()}
            <Box
                component="div"
                sx={Utils.getStyle(
                    this.props.context.theme,
                    styles.imageBlock,
                    (!item.running || instance.mode !== 'daemon' || item.stoppedWhenWebExtension !== undefined) && styles.instanceStateNotEnabled1,
                    item.running && instance.mode === 'daemon' && item.stoppedWhenWebExtension === undefined && (!item.connectedToHost || !item.alive) && styles.instanceStateNotAlive1,
                    item.running && item.connectedToHost && item.alive && item.connected === false && styles.instanceStateAliveNotConnected1,
                    item.running && item.connectedToHost && item.alive && item.connected !== false && styles.instanceStateAliveAndConnected1,
                )}
            >
                <CardMedia sx={styles.img} component="img" image={instance.image || 'img/no-image.png'} />
                <div style={styles.adapter}>{instance.id}</div>
                <div style={styles.versionDate}>
                    {/* {expertMode && item.checkCompact && <Tooltip title={t('compact groups')}>
                    <ViewCompactIcon color="action" style={{ margin: 10 }} />
                </Tooltip>} */}
                </div>
                {!this.state.expanded ? <Fab
                    onMouseOver={() => this.setState({ mouseOver: true })}
                    onMouseOut={() => this.setState({ mouseOver: false })}
                    onClick={() => this.setState({ expanded: true }, () =>
                        this.props.context.onToggleExpanded(this.props.id, true))}
                    style={styles.fab}
                    color="primary"
                    aria-label="add"
                >
                    <MoreVertIcon />
                </Fab> : null}
            </Box>

            <CardContent style={styles.cardContentH5}>
                <Typography gutterBottom variant="h5" component="h5">
                    <div
                        // onMouseMove={() => this.setState({ visibleEdit: true })}
                        onMouseEnter={() => this.setState({ visibleEdit: true })}
                        onMouseLeave={() => this.setState({ visibleEdit: false })}
                        style={styles.displayFlex}
                    >
                        {AdminUtils.getText(item.name, this.props.context.lang)}
                        {this.renderEditNameButton()}
                    </div>
                </Typography>

                <div style={styles.marginTop10}>
                    <Typography component="span" style={styles.enableButton}>
                        {this.renderPlayPause()}
                        <Box
                            component="div"
                            sx={{ display: { sm: 'inline-block', xs: 'none' } }}
                        >
                            {this.renderSettingsButton()}
                        </Box>
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

export default InstanceCard;
