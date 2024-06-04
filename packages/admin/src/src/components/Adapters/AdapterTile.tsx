import React from 'react';
import { withStyles } from '@mui/styles';

import {
    Card, CardContent, CardMedia, Fab,
    Tooltip, Typography,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { amber } from '@mui/material/colors';

import { type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import IsVisible from '../IsVisible';
import AdapterGeneric, {
    type AdapterGenericProps,
    type AdapterGenericState,
    type ImageProps,
    genericStyle,
} from './AdapterGeneric';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles: Record<string, any> = (theme: IobTheme) => ({
    ...genericStyle,
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
    },
    imageBlock: {
        background: theme.palette.mode === 'dark' ? '#848484' : '#c0c0c0',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        color: '#000',
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
    greenText: {
        color: theme.palette.success.dark,
    },
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
            backgroundColor: 'rgba(0, 0, 0, 0.54)',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.54)',
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
        color: theme.palette.mode === 'dark' ? '#333' : '#333',
    },
    adapterWithAgo: {
        width: 'calc(100% - 145px)',
    },
    description: {
        color: theme.palette.mode === 'dark' ? '#222' : 'inherit',
    },

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

    rating: {
        marginTop: 20,
    },
    versionWarn: {
        color: amber[500],
        marginRight: 5,
    },
});

interface AdapterTileState extends AdapterGenericState {
    openCollapse: boolean;
}

class AdapterTile extends AdapterGeneric<AdapterGenericProps, AdapterTileState> {
    constructor(props: AdapterGenericProps) {
        super(props);

        Object.assign(this.state, {
            openCollapse: false,
        });
    }

    renderInfoCard() {
        return <div className={this.props.classes.collapse}>
            <CardContent className={this.props.classes.cardContent}>
                <div className={this.props.classes.cardContentDiv}>
                    <div
                        className={this.props.classes.close}
                        onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                    />
                </div>
                <Typography gutterBottom component="span" variant="body2" className={this.props.classes.description}>
                    {this.props.cached.desc}
                </Typography>
            </CardContent>
            <div className={this.props.classes.footerBlock}>
                {this.renderAddInstanceButton()}
                <div className={this.props.classes.cardContentFlex}>
                    {this.renderAutoUpgradeButton()}
                    {this.renderReadmeButton()}
                    {this.renderUploadButton()}
                    {this.renderDeleteButton()}
                    {this.renderInstallSpecificVersionButton()}
                </div>
            </div>
        </div>;
    }

    renderCardMedia() {
        const available = this.props.context.repository[this.props.adapterName];
        const availableVersion = available?.version;

        return <div
            className={Utils.clsx(
                this.props.classes.imageBlock,
                this.installedVersion ? this.props.classes.installed : '',
                this.installedVersion && availableVersion && this.installedVersion !== availableVersion && this.props.cached.updateAvailable ? this.props.classes.update : '',
            )}
        >
            <CardMedia
                className={this.props.classes.img}
                component={(props: ImageProps) => this.renderImage(props)}
                src={this.props.cached.image || 'img/no-image.png'}
                image={this.props.cached.image || 'img/no-image.png'}
            />
            <div
                className={Utils.clsx(
                    this.props.classes.adapter,
                    (available.stat || this.props.context.sortRecentlyUpdated) && this.props.classes.adapterWithAgo,
                )}
            >
                {this.props.adapterName}
            </div>
            {this.props.context.sortPopularFirst ? <div className={this.props.classes.versionDate}>{available.stat}</div> : null}
            {this.props.context.sortRecentlyUpdated ? <div className={this.props.classes.versionDate}>{this.props.cached.daysAgoText}</div> : null}
            {!this.props.context.sortPopularFirst && !this.props.context.sortRecentlyUpdated ? this.renderRating() : null}
            {!this.state.openCollapse ? <Tooltip title={this.props.context.t('Info')}>
                <Fab
                    onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                    className={this.props.classes.fab}
                    color="primary"
                    aria-label="add"
                >
                    <MoreVertIcon />
                </Fab>
            </Tooltip> : null}
        </div>;
    }

    renderCardContent() {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName] ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate : true;
        const installed = this.props.context.installed[this.props.adapterName];

        return <CardContent className={this.props.classes.cardContent2}>
            <Typography gutterBottom variant="h5" component="h5">{this.props.cached.title}</Typography>
            <div className={this.props.classes.cardContentFlex}>
                {this.renderConnectionType()}
                {this.renderDataSource()}
                <div>{this.renderLicenseInfo()}</div>
                {this.renderSentryInfo()}
            </div>
            <div className={this.props.classes.cardMargin10}>
                {installed?.count ? <Typography component="span" className={this.props.classes.cardContentFlexBetween}>
                    <div>
                        {this.props.context.t('Installed instances')}
                        :
                    </div>
                    <div>{installed.count}</div>
                </Typography> : null}
                <IsVisible value={allowAdapterUpdate}>
                    <Typography component="span" className={this.props.classes.availableVersion}>
                        <div>{this.props.context.t('Available version:')}</div>
                        <div className={Utils.clsx(this.props.cached.updateAvailable && this.props.classes.greenText, this.props.classes.curdContentFlexCenter)}>
                            {this.renderVersion()}
                        </div>
                    </Typography>
                </IsVisible>
                {this.renderInstalledVersion()}
            </div>
        </CardContent>;
    }

    render(): React.JSX.Element {
        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return <Card className={this.props.classes.root}>
            {this.state.openCollapse ? this.renderInfoCard() : null}
            {this.renderCardMedia()}
            {this.renderCardContent()}
            {this.renderDialogs()}
        </Card>;
    }
}

export default withStyles(styles)(AdapterTile);
