import React, { type JSX } from 'react';

import { Box, Card, CardContent, CardMedia, Fab, Tooltip, Typography } from '@mui/material';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { amber } from '@mui/material/colors';

import { type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import IsVisible from '../IsVisible';
import AdapterGeneric, {
    type AdapterGenericProps,
    type AdapterGenericState,
    type ImageProps,
    genericStyles,
} from './AdapterGeneric';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles: Record<string, any> = {
    ...genericStyles,
    type: {
        color: 'tile',
    },
    root: (theme: IobTheme) => ({
        position: 'relative',
        m: '10px',
        width: 300,
        minHeight: 200,
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(13, 36, 58, 0.90), rgba(7, 23, 39, 0.88))',
        boxShadow: '0 14px 30px rgba(0,0,0,.24)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
    }),
    imageBlock: (theme: IobTheme) => ({
        background: 'linear-gradient(135deg, rgba(0,255,136,.16), rgba(0,212,255,.11))',
        borderBottom: '1px solid rgba(0,255,136,.20)',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        color: '#eef7ff',
    }),
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
            background: 'url("img/no-image.svg") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    installed: {
        background: '#77c7ff8c',
    },
    update: {
        background: '#10ff006b',
    },
    fab: {
        position: 'absolute',
        bottom: -20,
        width: 40,
        height: 40,
        right: 20,
    },
    greenText: (theme: IobTheme) => ({
        color: theme.palette.success.dark,
    }),
    collapse: {
        height: '100%',
        background: 'linear-gradient(180deg, rgba(8, 29, 47, 0.985), rgba(4, 14, 25, 0.975))',
        color: '#eef7ff',
        border: '1px solid rgba(0, 255, 136, 0.34)',
        borderRadius: 24,
        position: 'absolute',
        width: '100%',
        zIndex: 8,
        marginTop: 'auto',
        bottom: 0,
        overflow: 'hidden',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'column',
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
            backgroundColor: '#eaf9ff',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: '#eaf9ff',
            transform: 'rotate(-45deg)',
        },
    },
    footerBlock: (theme: IobTheme) => ({
        background: 'rgba(2, 9, 20, 0.90)',
        borderTop: '1px solid rgba(0,255,136,.22)',
        p: '10px',
        display: 'flex',
        justifyContent: 'space-between',
    }),
    versionDate: {
        alignSelf: 'center',
    },
    adapter: (theme: IobTheme) => ({
        width: '100%',
        fontWeight: 'bold',
        fontSize: 16,
        verticalAlign: 'middle',
        pl: 1,
        pt: 2,
        color: theme.palette.mode === 'dark' ? '#333' : '#333',
    }),
    adapterWithAgo: {
        width: 'calc(100% - 145px)',
    },
    description: (theme: IobTheme) => ({
        display: 'block',
        color: 'rgba(238, 247, 255, 0.94)',
        fontSize: 13.5,
        lineHeight: 1.48,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
    }),

    cardContent: {
        overflow: 'auto',
    },
    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: 'linear-gradient(135deg, rgba(0,255,136,.16), rgba(0,212,255,.09))',
        borderBottom: '1px solid rgba(0,255,136,.22)',
        zIndex: 2,
    },
    cardContentFlex: {
        display: 'flex',
    },
    cardContentFlexBetween: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    cardContent2: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    cardMargin10: {
        marginTop: 10,
    },
    availableVersion: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center',
    },

    versionWarn: {
        color: amber[500],
        marginRight: 5,
    },
    rating: {
        marginTop: 20,
    },
};

interface AdapterTileState extends AdapterGenericState {
    openCollapse: boolean;
}

class AdapterTile extends AdapterGeneric<AdapterGenericProps, AdapterTileState> {
    protected styles: Record<string, any> = styles;

    constructor(props: AdapterGenericProps) {
        super(props);

        Object.assign(this.state, {
            openCollapse: false,
        });
    }

    renderInfoCard(): JSX.Element {
        return (
            <div
                className="eos-adapter-info-card"
                style={this.styles.collapse}
            >
                <CardContent style={this.styles.cardContent}>
                    <div style={this.styles.cardContentDiv}>
                        <Box
                            component="div"
                            sx={this.styles.close}
                            onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                        />
                    </div>
                    <Typography
                        gutterBottom
                        component="span"
                        variant="body2"
                        sx={this.styles.description}
                    >
                        {this.props.cached.desc}
                    </Typography>
                </CardContent>
                <Box
                    component="div"
                    sx={this.styles.footerBlock}
                >
                    {this.renderAddInstanceButton()}
                    <div style={this.styles.cardContentFlex}>
                        {this.renderAutoUpgradeButton()}
                        {this.renderReadmeButton()}
                        {this.renderUploadButton()}
                        {this.renderDeleteButton()}
                        {this.renderInstallSpecificVersionButton()}
                    </div>
                </Box>
            </div>
        );
    }

    renderCardMedia(): JSX.Element {
        const available = this.props.context.repository[this.props.adapterName];
        const availableVersion = available?.version;

        return (
            <Box
                component="div"
                sx={Utils.getStyle(
                    this.props.context.theme,
                    this.styles.imageBlock,
                    this.installedVersion && this.styles.installed,
                    this.installedVersion &&
                        availableVersion &&
                        this.installedVersion !== availableVersion &&
                        this.props.cached.updateAvailable &&
                        this.styles.update,
                )}
            >
                <CardMedia
                    sx={this.styles.img}
                    component={(props: ImageProps) => AdapterGeneric.renderImage(props)}
                    src={this.props.cached.image || 'img/no-image.svg'}
                    image={this.props.cached.image || 'img/no-image.svg'}
                />
                <Box
                    component="div"
                    sx={Utils.getStyle(
                        this.props.context.theme,
                        this.styles.adapter,
                        (available.stat || this.props.context.sortRecentlyUpdated) && this.styles.adapterWithAgo,
                    )}
                >
                    {this.props.adapterName}
                </Box>
                {this.props.context.sortPopularFirst ? (
                    <div style={this.styles.versionDate}>{available.stat}</div>
                ) : null}
                {this.props.context.sortRecentlyUpdated ? (
                    <div style={this.styles.versionDate}>{this.props.cached.daysAgoText}</div>
                ) : null}
                {!this.props.context.sortPopularFirst && !this.props.context.sortRecentlyUpdated
                    ? this.renderRating()
                    : null}
                {!this.state.openCollapse ? (
                    <Tooltip
                        title={this.props.context.t('Info')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <Fab
                            onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                            style={this.styles.fab}
                            color="primary"
                            aria-label="add"
                        >
                            <MoreVertIcon />
                        </Fab>
                    </Tooltip>
                ) : null}
            </Box>
        );
    }

    renderCardContent(): JSX.Element {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate
            : true;
        const installed = this.props.context.installed[this.props.adapterName];

        return (
            <CardContent style={this.styles.cardContent2}>
                <Typography
                    gutterBottom
                    variant="h5"
                    component="h5"
                >
                    {this.props.cached.title}
                </Typography>
                <div style={this.styles.cardContentFlex}>
                    {this.renderConnectionType()}
                    {this.renderDataSource()}
                    <div>{this.renderLicenseInfo()}</div>
                    {this.renderSentryInfo()}
                </div>
                <div style={this.styles.cardMargin10}>
                    {installed?.count ? (
                        <Typography
                            component="span"
                            style={this.styles.cardContentFlexBetween}
                        >
                            <div>{this.props.context.t('Installed instances')}:</div>
                            <div>{installed.count}</div>
                        </Typography>
                    ) : null}
                    <IsVisible value={allowAdapterUpdate}>
                        <Typography
                            component="span"
                            style={this.styles.availableVersion}
                        >
                            <div>{this.props.context.t('Available version:')}</div>
                            <Box
                                component="div"
                                sx={Utils.getStyle(
                                    this.props.context.theme,
                                    this.props.cached.updateAvailable && this.styles.greenText,
                                    this.styles.curdContentFlexCenter,
                                )}
                            >
                                {this.renderVersion()}
                            </Box>
                        </Typography>
                    </IsVisible>
                    {this.renderInstalledVersion()}
                </div>
            </CardContent>
        );
    }

    render(): JSX.Element {
        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return (
            <Card sx={this.styles.root}>
                {this.state.openCollapse ? this.renderInfoCard() : null}
                {this.renderCardMedia()}
                {this.renderCardContent()}
                {this.renderDialogs()}
            </Card>
        );
    }
}

export default AdapterTile;
