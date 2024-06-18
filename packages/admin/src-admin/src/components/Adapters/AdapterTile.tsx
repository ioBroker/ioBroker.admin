import React from 'react';

import {
    Box,
    Card, CardContent, CardMedia, Fab,
    Tooltip, Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { amber } from '@mui/material/colors';

import { type IobTheme } from '@iobroker/adapter-react-v5';
import Utils from '@/components/Utils';

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
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.5s',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
    }),
    imageBlock: (theme: IobTheme) => ({
        background: theme.palette.mode === 'dark' ? '#848484' : '#c0c0c0',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        color: '#000',
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
            background: 'url("img/no-image.png") 100% 100% no-repeat',
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
        backgroundColor: 'silver',
        position: 'absolute',
        width: '100%',
        zIndex: 3,
        marginTop: 'auto',
        bottom: 0,
        // transition: 'height 0.3s',
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
            backgroundColor: 'rgba(0, 0, 0, 0.54)',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: 9,
            content: '""',
            height: 20,
            width: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.54)',
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
        color: theme.palette.mode === 'dark' ? '#222' : 'inherit',
    }),

    cardContent: {
        overflow: 'auto',
    },
    cardContentDiv: {
        position: 'sticky',
        right: 0,
        top: 0,
        background: 'silver',
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

    renderInfoCard() {
        return <div style={this.styles.collapse}>
            <CardContent style={this.styles.cardContent}>
                <div style={this.styles.cardContentDiv}>
                    <Box
                        component="div"
                        sx={this.styles.close}
                        onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                    />
                </div>
                <Typography gutterBottom component="span" variant="body2" sx={this.styles.description}>
                    {this.props.cached.desc}
                </Typography>
            </CardContent>
            <Box component="div" sx={this.styles.footerBlock}>
                {this.renderAddInstanceButton()}
                <div style={this.styles.cardContentFlex}>
                    {this.renderAutoUpgradeButton()}
                    {this.renderReadmeButton()}
                    {this.renderUploadButton()}
                    {this.renderDeleteButton()}
                    {this.renderInstallSpecificVersionButton()}
                </div>
            </Box>
        </div>;
    }

    renderCardMedia() {
        const available = this.props.context.repository[this.props.adapterName];
        const availableVersion = available?.version;

        return <Box
            component="div"
            sx={Utils.getStyle(
                this.props.context.theme,
                this.styles.imageBlock,
                this.installedVersion && this.styles.installed,
                this.installedVersion && availableVersion && this.installedVersion !== availableVersion && this.props.cached.updateAvailable && this.styles.update,
            )}
        >
            <CardMedia
                sx={this.styles.img}
                component={(props: ImageProps) => this.renderImage(props)}
                src={this.props.cached.image || 'img/no-image.png'}
                image={this.props.cached.image || 'img/no-image.png'}
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
            {this.props.context.sortPopularFirst ? <div style={this.styles.versionDate}>{available.stat}</div> : null}
            {this.props.context.sortRecentlyUpdated ? <div style={this.styles.versionDate}>{this.props.cached.daysAgoText}</div> : null}
            {!this.props.context.sortPopularFirst && !this.props.context.sortRecentlyUpdated ? this.renderRating() : null}
            {!this.state.openCollapse ? <Tooltip title={this.props.context.t('Info')}>
                <Fab
                    onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                    style={this.styles.fab}
                    color="primary"
                    aria-label="add"
                >
                    <MoreVertIcon />
                </Fab>
            </Tooltip> : null}
        </Box>;
    }

    renderCardContent() {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate : true;
        const installed = this.props.context.installed[this.props.adapterName];

        return <CardContent style={this.styles.cardContent2}>
            <Typography gutterBottom variant="h5" component="h5">{this.props.cached.title}</Typography>
            <div style={this.styles.cardContentFlex}>
                {this.renderConnectionType()}
                {this.renderDataSource()}
                <div>{this.renderLicenseInfo()}</div>
                {this.renderSentryInfo()}
            </div>
            <div style={this.styles.cardMargin10}>
                {installed?.count ? <Typography component="span" style={this.styles.cardContentFlexBetween}>
                    <div>
                        {this.props.context.t('Installed instances')}
                        :
                    </div>
                    <div>{installed.count}</div>
                </Typography> : null}
                <IsVisible value={allowAdapterUpdate}>
                    <Typography component="span" style={this.styles.availableVersion}>
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
        </CardContent>;
    }

    render(): React.JSX.Element {
        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return <Card sx={this.styles.root}>
            {this.state.openCollapse ? this.renderInfoCard() : null}
            {this.renderCardMedia()}
            {this.renderCardContent()}
            {this.renderDialogs()}
        </Card>;
    }
}

export default AdapterTile;
