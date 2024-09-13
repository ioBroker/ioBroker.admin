import React from 'react';

import { Box, CardContent, CardMedia, Skeleton, Typography } from '@mui/material';

import { Utils, type IobTheme } from '@iobroker/adapter-react-v5';

import AdminUtils from '@/AdminUtils';
import HostGeneric, {
    boxShadow,
    boxShadowHover,
    genericStyles,
    type HostGenericProps,
    type HostGenericState,
} from './HostGeneric';

const styles: Record<string, any> = {
    ...genericStyles,
    root: (theme: IobTheme) => ({
        position: 'relative',
        m: '7px',
        background: theme.palette.background.default,
        boxShadow,
        // display: 'flex',
        overflow: 'hidden',
        transition: 'box-shadow 0.5s,height 0.3s',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
    }),
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
    collapse: {
        height: 200,
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
        animation: 'height 1s',
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
    host: (theme: IobTheme) => ({
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        paddingLeft: '8px',
        alignSelf: 'center',
        color: theme.palette.mode === 'dark' ? '#ddd' : '#222',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }),
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
    red: {
        background: '#da0000',
        // animation: '$red 3s ease-in-out infinite alternate'
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
        '@media screen and (max-width: 500px)': {
            flexDirection: 'column',
        },
    },
    wrapperColor: {
        position: 'relative',
        overflow: 'hidden',
    },
    hidden1100: {
        '@media screen and (max-width: 1100px)': {
            display: 'none !important',
        },
    },
    hidden800: {
        '@media screen and (max-width: 800px)': {
            display: 'none !important',
        },
    },
    hidden600: {
        '@media screen and (max-width: 600px)': {
            display: 'none !important',
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
};

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
        return (
            <div style={styles.wrapperBlockItem} key={value}>
                <span style={{ ...styles.bold, ...styles.nowrap }}>{this.props.t(value)}: </span>
                {HostGeneric.formatInfo[value]
                    ? HostGeneric.formatInfo[value](this.props.hostData[value], this.props.t)
                    : this.props.hostData[value] || '--'}
            </div>
        );
    }

    getHostDescriptionAll() {
        if (!this.props.hostData) {
            return <Skeleton />;
        }

        if (typeof this.props.hostData === 'string') {
            return this.props.hostData;
        }

        return (
            <div style={styles.wrapperInfo}>
                <div style={styles.marginRight}>
                    {this.props.hostData && typeof this.props.hostData === 'object' ? (
                        Object.keys(this.props.hostData).map((value, idx) => idx < 5 && this.renderValue(value))
                    ) : (
                        <Skeleton />
                    )}
                </div>
                <div style={styles.marginRight}>
                    {this.props.hostData && typeof this.props.hostData === 'object' ? (
                        Object.keys(this.props.hostData).map(
                            (value, idx) => idx > 4 && idx < 10 && this.renderValue(value)
                        )
                    ) : (
                        <Skeleton />
                    )}
                </div>
                <div style={styles.marginRight}>
                    {this.props.hostData &&
                        typeof this.props.hostData === 'object' &&
                        Object.keys(this.props.hostData).map((value, idx) => idx > 10 && this.renderValue(value))}
                </div>
            </div>
        );
    }

    render() {
        const upgradeAvailable =
            (this.props.isCurrentHost || this.props.alive) &&
            AdminUtils.updateAvailable(this.props.host.common.installedVersion, this.props.available);
        const description = this.getHostDescriptionAll();

        return (
            <Box
                component="div"
                sx={Utils.getStyle(this.props.theme, styles.root, this.props.hidden && styles.hidden, {
                    border: `2px solid ${this.props.host.common.color || 'inherit'}`,
                    borderRadius: '5px',
                })}
                key={this.props.hostId}
            >
                {this.renderDialogs()}
                <Box
                    component="div"
                    sx={{ ...styles.wrapperFlex, ...(!this.props.alive ? styles.cursorNoDrop : undefined) }}
                    onClick={
                        this.state.openDialogLogLevel
                            ? null
                            : () => this.setState({ openCollapse: !this.state.openCollapse })
                    }
                >
                    <div style={styles.wrapperColor}>
                        <div style={{ ...styles.onOff, ...(this.props.alive ? styles.green : styles.red) }} />
                        {this.props.alive && <div style={styles.dotLine} />}
                    </div>
                    <div
                        ref={this.refWarning}
                        style={{ ...styles.imageBlock, background: this.props.host.common.color || 'inherit' }}
                    >
                        {this.renderNotificationsBadge(
                            <CardMedia
                                sx={styles.img}
                                component="img"
                                image={this.props.host.common.icon || 'img/no-image.png'}
                            />,
                            true
                        )}
                        <div
                            style={Utils.getStyle(this.props.theme, styles.host, {
                                color:
                                    (this.props.host.common.color &&
                                        Utils.invertColor(this.props.host.common.color, true)) ||
                                    'inherit',
                            })}
                        >
                            {this.props.host.common.name}
                        </div>
                    </div>
                    <CardContent sx={{ '&.MuiCardContent-root': styles.cardContentH5 }}>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden800, ...styles.cell }}
                            variant="body2"
                            color="textSecondary"
                            component="div"
                        >
                            <div ref={this.refCpu}>- %</div>
                        </Typography>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden800, ...styles.cell }}
                            variant="body2"
                            color="textSecondary"
                            component="div"
                        >
                            <div ref={this.refMem}>- %</div>
                        </Typography>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden800, ...styles.cell }}
                            variant="body2"
                            color="textSecondary"
                            component="div"
                        >
                            <div ref={this.refUptime}>-/-</div>
                        </Typography>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden1100 }}
                            variant="body2"
                            color="textSecondary"
                            component="p"
                        >
                            {this.props.host.common.installedVersion}
                        </Typography>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden1100, ...styles.cell }}
                            variant="body2"
                            color="textSecondary"
                            component="div"
                        >
                            <Box
                                component="div"
                                sx={{
                                    ...(upgradeAvailable ? styles.greenText : undefined),
                                    ...styles.curdContentFlexCenter,
                                }}
                            >
                                {this.renderUpdateButton(upgradeAvailable)}
                            </Box>
                        </Typography>
                        <Typography
                            sx={{ ...styles.flex, ...styles.hidden600, ...styles.cell }}
                            variant="body2"
                            color="textSecondary"
                            component="div"
                        >
                            <div ref={this.refEvents}>- / -</div>
                        </Typography>
                        <div style={styles.marginTop10}>
                            <Typography component="span" style={styles.enableButton}>
                                {this.renderEditButton()}
                                {this.renderHostBaseEdit()}
                                {this.renderRestartButton()}
                                {this.props.expertMode && this.state.logLevel ? (
                                    this.renderLogLevel()
                                ) : (
                                    <div style={styles.emptyButton} />
                                )}
                                {this.renderRemoveButton()}
                                {this.renderExtendButton(this.state.openCollapse)}
                            </Typography>
                        </div>
                    </CardContent>
                </Box>
                {typeof description === 'object' && (
                    <div
                        style={{
                            ...styles.collapse,
                            ...(!this.state.openCollapse ? styles.collapseOff : styles.collapseOn),
                        }}
                        onClick={event => event.stopPropagation()}
                    >
                        <CardContent style={styles.cardContentInfo}>
                            {description}
                            {this.renderCopyButton({ height: 44, width: 44 })}
                        </CardContent>
                        <Box component="div" sx={styles.footerBlock} />
                    </div>
                )}
            </Box>
        );
    }
}

export default HostRow;
