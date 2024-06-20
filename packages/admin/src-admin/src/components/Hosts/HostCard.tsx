import React from 'react';

import {
    Box,
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
    genericStyles,
    type HostGenericProps,
    type HostGenericState,
} from './HostGeneric';

export const styles: Record<string, any> = {
    ...genericStyles,
    root: (theme: IobTheme) => ({
        position: 'relative',
        m: '10px',
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
    }),
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
        ml: 'auto',
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
    onOffLine: {
        alignSelf: 'center',
        width: '100%',
        height: 4,
        // borderRadius: 20,
    },
    adapter: (theme: IobTheme) => ({
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        verticalAlign: 'middle',
        pl: 1,
        pt: 2,
        color: theme.palette.mode === 'dark' ? '#333' : '#555',
    }),
    cardContentInfo: (theme: IobTheme) => ({
        overflow: 'auto',
        paddingTop: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
    }),
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
        ml: '4px',
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
    value: {
        marginLeft: 5,
    },
    label: {
        fontWeight: 'bold',
    },
};

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
            return <ul key="ul" style={styles.ul}>
                <Skeleton />
            </ul>;
        }

        return <ul key="ul" style={styles.ul}>
            {Object.keys(this.props.hostData).map(value => <li key={value}>
                <span style={styles.black}>
                    <span style={styles.label}>
                        {this.props.t(value)}
                        :
                        {' '}
                    </span>
                    <span style={styles.value}>
                        {HostGeneric.formatInfo[value] ?
                            HostGeneric.formatInfo[value]((this.props.hostData as Record<string, any>)[value], this.props.t) :
                            ((this.props.hostData as Record<string, any>)[value] || '--')}
                    </span>
                </span>
            </li>)}
        </ul>;
    }

    render() {
        const upgradeAvailable = (this.props.isCurrentHost || this.props.alive) && BasicUtils.updateAvailable(this.props.host.common.installedVersion, this.props.available);
        const description = this.getHostDescriptionAll();

        return <Card key={this.props.hostId} sx={Utils.getStyle(this.props.theme, styles.root, this.props.hidden && styles.hidden)}>
            {this.renderDialogs()}
            {this.state.openCollapse && <div style={{ ...styles.collapse, ...(!this.state.openCollapse ? styles.collapseOff : undefined) }}>
                <CardContent sx={styles.cardContentInfo}>
                    <div
                        style={styles.cardContentDiv}
                        onClick={() => this.setState({ openCollapse: false })}
                    >
                        <Box
                            component="div"
                            sx={styles.close}
                            onClick={() => this.setState({ openCollapse: false })}
                        />
                    </div>
                    {description}
                </CardContent>
                <Box component="div" sx={styles.footerBlock} />
            </div>}
            <div style={{ ...styles.onOffLine, ...(this.props.alive ? styles.green : styles.red) }}>
                {this.props.alive && <div style={styles.dotLine} />}
            </div>
            <div
                ref={this.refWarning}
                style={{
                    ...styles.imageBlock,
                    ...(!this.props.alive ? styles.instanceStateNotAlive1 : undefined),
                    background: this.props.host.common.color || 'inherit',
                }}
            >
                <CardMedia
                    sx={styles.img}
                    component="img"
                    image={this.props.host.common.icon || 'img/no-image.png'}
                />
                <Box
                    component="div"
                    style={Utils.getStyle(
                        this.props.theme,
                        styles.adapter,
                        { color: (this.props.host.common.color && Utils.invertColor(this.props.host.common.color, true)) || 'inherit' }
                    )}
                >
                    {this.renderNotificationsBadge(this.props.host.common.name, true)}
                </Box>
                {!this.state.openCollapse ? <Fab
                    disabled={typeof description === 'string'}
                    onClick={() => this.setState({ openCollapse: true })}
                    style={styles.fab}
                    color="primary"
                    aria-label="add"
                    title={this.props.t('Click for more')}
                >
                    <MoreVertIcon />
                </Fab> : null}
            </div>
            <CardContent style={styles.cardContentH5}>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div style={styles.displayFlex}>
                        <span style={styles.label}>CPU:</span>
                        <div ref={this.refCpu} style={styles.value}>
                            - %
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div style={styles.displayFlex}>
                        <span style={styles.label}>RAM:</span>
                        <div ref={this.refMem} style={styles.value}>
                            - %
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div style={styles.displayFlex}>
                        <span style={styles.label}>
                            {this.props.t('Uptime')}
                            :
                        </span>
                        <div ref={this.refUptime} style={styles.value}>
                            -d -h
                        </div>
                    </div>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div" style={styles.wrapperAvailable}>
                    <span style={styles.label}>
                        {this.props.t('Available')}
                        {' '}
                        js-controller:
                    </span>
                    <Box
                        component="div"
                        sx={{ ...(upgradeAvailable ? styles.greenText : undefined), ...styles.curdContentFlexCenter }}
                    >
                        {this.renderUpdateButton(upgradeAvailable)}
                    </Box>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                    <span style={styles.label}>
                        {this.props.t('Installed')}
                        {' '}
                        js-controller:
                    </span>
                    <span style={styles.value}>{this.props.host.common.installedVersion}</span>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                    <div style={styles.displayFlex}>
                        <span style={styles.label}>
                            {this.props.t('Events')}
                            :
                        </span>
                        <div ref={this.refEvents} style={styles.value}>- / -</div>
                    </div>
                </Typography>
                <div style={styles.marginTop10}>
                    <Typography component="span" style={styles.enableButton}>
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

export default HostCard;
