import React from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Card, CardContent, CardMedia, Fab,
    IconButton, Tooltip, Typography, Rating,
} from '@mui/material';

import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    AddToPhotos as AddToPhotosIcon,
    DeleteForever as DeleteForeverIcon,
    Help as HelpIcon,
    Publish as PublishIcon,
    Cloud as CloudIcon,
    CloudOff as CloudOffIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Remove as RemoveIcon,
    GitHub as GitHubIcon,
    MonetizationOn,
} from '@mui/icons-material';
import { amber } from '@mui/material/colors';

import { type Translate, Utils } from '@iobroker/adapter-react-v5';

import Link from '@mui/material/Link';
import sentryIcon from '../../assets/sentry.svg';
import IsVisible from '../IsVisible';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles = (theme: Record<string, any>) => ({
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
    hidden: {
        display: 'none',
    },
    buttonUpdate: {
        border: '1px solid',
        padding: '0px 7px',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.5s',
        '&:hover': {
            background: '#00800026',
        },
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
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10,
    },
    curdContentFlexCenter: {
        display: 'flex',
        alignItems: 'center',
    },

    classPoll: {
        color: 'orange',
    },
    classPush: {
        color: 'green',
    },
    classAssumption: {
        color: 'red',
        transform: 'rotate(90deg)',
    },
    marginLeft5: {
        marginLeft: 5,
    },
    rating: {
        marginTop: 20,
    },
    ratingSet: {
        cursor: 'pointer',
    },
    versionWarn: {
        color: amber[500],
        marginRight: 5,
    },
    sentry: {
        width: 21,
        height: 21,
        objectFit: 'fill',
        marginTop: 3,
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)',
    },
    tooltip: {
        pointerEvents: 'none',
    },
}) satisfies Styles<any, any>;

interface AdapterTileProps {
    licenseInformation?: ioBroker.LicenseInformation;
    commandRunning: boolean;
    rating: Record<string, any>;
    onSetRating?: () => void;
    /** Name of the adapter */
    name: string;
    classes: Record<string, any>;
    image: string;
    version: string;
    installedVersion: string;
    installedCount: number;
    updateAvailable: boolean;
    onUpdate: () => void;
    description: string;
    rightOs: boolean;
    onAddInstance: () => void;
    onInfo: () => void;
    expertMode: boolean;
    onUpload: () => void;
    onDeletion: () => void;
    hidden: boolean;
    stat: any;
    versionDate: any;
    /** adapter id without 'system.adapter. */
    adapter: string;
    isCategory: boolean;
    connectionType: string;
    openInstallVersionDialog: () => void;
    dataSource: string;
    t: Translate;
    installedFrom: string;
    sentry: boolean;
    allowAdapterInstall: boolean;
    allowAdapterReadme: boolean;
    allowAdapterDelete: boolean;
    allowAdapterUpdate: boolean;
    allowAdapterRating: boolean;
}

interface AdapterTileState {
    openCollapse: boolean;
    focused: boolean;
}

interface ImageProps {
    alt: string;
    style: Record<string, any>;
    [other: string]: any;
}

class AdapterTile extends React.Component<AdapterTileProps, AdapterTileState> {
    constructor(props: AdapterTileProps) {
        super(props);

        this.state = {
            openCollapse: false,
            focused: false,
        };
    }

    renderImage(imageProps: ImageProps): React.JSX.Element {
        const {
            style, alt, ...other
        } = imageProps;

        const img = style.backgroundImage.substring(5, style.backgroundImage.length - 2);

        return <img
            {...other}
            alt={alt}
            src={img}
            onError={e => {
                if (e.target) {
                    // @ts-expect-error check later
                    e.target.onerror = null;
                    // @ts-expect-error check later
                    e.target.src = './img/no-image.png';
                }
            }}
        />;
    }

    render(): React.JSX.Element {
        return <Card className={Utils.clsx(this.props.classes.root, this.props.hidden ? this.props.classes.hidden : '')}>
            {(this.state.openCollapse || this.state.focused) &&
                <div className={Utils.clsx(this.props.classes.collapse, !this.state.openCollapse ? this.props.classes.collapseOff : '')}>
                    <CardContent className={this.props.classes.cardContent}>
                        <div className={this.props.classes.cardContentDiv}>
                            <div className={this.props.classes.close} onClick={() => this.setState({ openCollapse: !this.state.openCollapse })} />
                        </div>
                        <Typography gutterBottom component="span" variant="body2" className={this.props.classes.description}>
                            {this.props.description}
                        </Typography>
                    </CardContent>
                    <div className={this.props.classes.footerBlock}>
                        <IsVisible value={this.props.allowAdapterInstall}>
                            <Tooltip title={this.props.t('Add instance')}>
                                <IconButton
                                    size="small"
                                    disabled={this.props.commandRunning}
                                    className={!this.props.rightOs ? this.props.classes.hidden : ''}
                                    onClick={this.props.rightOs ? this.props.onAddInstance : undefined}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </IsVisible>
                        <div className={this.props.classes.cardContentFlex}>
                            <IsVisible value={this.props.allowAdapterReadme}>
                                <Tooltip title={this.props.t('Readme')}>
                                    <IconButton
                                        size="small"
                                        onClick={this.props.onInfo}
                                    >
                                        <HelpIcon />
                                    </IconButton>
                                </Tooltip>
                            </IsVisible>
                            {this.props.expertMode &&
                                <Tooltip title={this.props.t('Upload')}>
                                    <IconButton
                                        size="small"
                                        disabled={this.props.commandRunning}
                                        className={!this.props.installedVersion ? this.props.classes.hidden : ''}
                                        onClick={this.props.onUpload}
                                    >
                                        <PublishIcon />
                                    </IconButton>
                                </Tooltip>}
                            <IsVisible value={this.props.allowAdapterDelete}>
                                <Tooltip title={this.props.t('Delete adapter')}>
                                    <IconButton
                                        size="small"
                                        disabled={this.props.commandRunning}
                                        className={!this.props.installedVersion ? this.props.classes.hidden : ''}
                                        onClick={this.props.onDeletion}
                                    >
                                        <DeleteForeverIcon />
                                    </IconButton>
                                </Tooltip>
                            </IsVisible>
                            {this.props.expertMode && this.props.allowAdapterUpdate !== false &&
                                <Tooltip title={this.props.t('Install a specific version')}>
                                    <IconButton
                                        disabled={this.props.commandRunning}
                                        size="small"
                                        className={!this.props.installedVersion ? this.props.classes.hidden : ''}
                                        onClick={this.props.openInstallVersionDialog}
                                    >
                                        <AddToPhotosIcon />
                                    </IconButton>
                                </Tooltip>}
                        </div>
                    </div>
                </div>}
            <div
                className={Utils.clsx(
                    this.props.classes.imageBlock,
                    this.props.installedVersion ? this.props.classes.installed : '',
                    this.props.installedVersion && this.props.installedVersion !== this.props.version && this.props.updateAvailable ? this.props.classes.update : '',
                )}
            >
                <CardMedia
                    className={this.props.classes.img}
                    component={props => this.renderImage(props)}
                    src={this.props.image || 'img/no-image.png'}
                    image={this.props.image || 'img/no-image.png'}
                />
                <div
                    className={Utils.clsx(this.props.classes.adapter, (this.props.stat || this.props.versionDate) && this.props.classes.adapterWithAgo)}
                >
                    {this.props.adapter}
                </div>
                <div className={this.props.classes.versionDate}>{this.props.stat || this.props.versionDate}</div>
                {!this.props.stat && !this.props.versionDate && this.props.allowAdapterRating !== false ? <div
                    onClick={() => this.props.onSetRating?.()}
                    className={Utils.clsx(this.props.classes.rating, this.props.onSetRating && this.props.classes.ratingSet)}
                    title={this.props.rating?.title}
                >
                    <Rating
                        name={this.props.adapter}
                        precision={0.5}
                        size="small"
                        readOnly
                        value={this.props.rating?.rating ? this.props.rating.rating.r : 0}
                    />
                </div> : null}
                <Tooltip title={this.props.t('Info')}>
                    <Fab
                        onMouseOut={() => this.setState({ focused:false })}
                        onMouseOver={() => this.setState({ focused:true })}
                        onClick={() => this.setState({ openCollapse: !this.state.openCollapse })}
                        className={this.props.classes.fab}
                        color="primary"
                        aria-label="add"
                    >
                        <MoreVertIcon />
                    </Fab>
                </Tooltip>
            </div>
            <CardContent className={this.props.classes.cardContent2}>
                <Typography gutterBottom variant="h5" component="h5">{this.props.name}</Typography>
                <div className={this.props.classes.cardContentFlex}>
                    {!this.props.isCategory &&
                        (this.props.connectionType === 'cloud' ?
                            <Tooltip title={this.props.t('Adapter requires the specific cloud access for these devices/service')}>
                                <CloudIcon />
                            </Tooltip> :
                            this.props.connectionType === 'local' ?
                                <Tooltip title={this.props.t('Adapter does not use the cloud for these devices/service')}>
                                    <CloudOffIcon />
                                </Tooltip> : '')}
                    {this.props.dataSource && <div className={this.props.classes.marginLeft5}>
                        {(this.props.dataSource === 'poll' ?
                            <Tooltip title={this.props.t('The device or service will be periodically asked')}>
                                <ArrowUpwardIcon className={this.props.classes.classPoll} />
                            </Tooltip> :
                            this.props.dataSource === 'push' ?
                                <Tooltip title={this.props.t('The device or service delivers the new state actively')}>
                                    <ArrowDownwardIcon className={this.props.classes.classPush} />
                                </Tooltip> :
                                this.props.dataSource === 'assumption' ?
                                    <Tooltip
                                        title={this.props.t('Adapter cannot request the exactly device status and the status will be guessed on the last sent command')}
                                    >
                                        <RemoveIcon className={this.props.classes.classAssumption} />
                                    </Tooltip> : null)}
                    </div>}
                    <div>
                        <Link
                            href={this.props.licenseInformation?.link}
                            target="_blank"
                            rel="noopener"
                            sx={{ color: 'text.primary', '&:hover': { color: 'text.primary' } }}
                        >
                            {this.props.licenseInformation?.type === 'paid' ?
                                <Tooltip title={this.props.t('The adapter requires a paid license.')}>
                                    <MonetizationOn />
                                </Tooltip>
                                : this.props.licenseInformation?.type === 'commercial' ?
                                    <Tooltip
                                        title={this.props.t('The adapter requires a paid license for commercial use.')}
                                    >
                                        <MonetizationOn opacity={0.5} />
                                    </Tooltip>
                                    : this.props.licenseInformation?.type === 'limited' ?
                                        <Tooltip
                                            title={this.props.t('The adapter has a limited functionality without a paid license.')}
                                        >
                                            <MonetizationOn opacity={0.5} />
                                        </Tooltip> :
                                        null}
                        </Link>
                    </div>
                    {this.props.sentry && <div className={this.props.classes.marginLeft5}>
                        <Tooltip title="sentry">
                            <CardMedia
                                className={this.props.classes.sentry}
                                component="img"
                                image={sentryIcon}
                            />
                        </Tooltip>
                    </div>}
                </div>
                <div className={this.props.classes.cardMargin10}>
                    {!!this.props.installedCount && <Typography component="span" className={this.props.classes.cardContentFlexBetween}>
                        <div>
                            {this.props.t('Installed instances')}
                            :
                        </div>
                        <div>{this.props.installedCount}</div>
                    </Typography>}
                    <IsVisible value={this.props.allowAdapterUpdate}>
                        <Typography component="span" className={this.props.classes.availableVersion}>
                            <div>{this.props.t('Available version:')}</div>
                            <div
                                className={Utils.clsx(this.props.updateAvailable && this.props.classes.greenText, this.props.classes.curdContentFlexCenter)}
                            >
                                {!this.props.commandRunning && this.props.updateAvailable ?
                                    <Tooltip title={this.props.t('Update')}>
                                        <div onClick={this.props.onUpdate} className={this.props.classes.buttonUpdate}>
                                            <IconButton
                                                className={this.props.classes.buttonUpdateIcon}
                                                size="small"
                                            >
                                                <RefreshIcon />
                                            </IconButton>
                                            {this.props.version}
                                        </div>
                                    </Tooltip> :
                                    this.props.version}
                            </div>
                        </Typography>
                    </IsVisible>
                    {this.props.installedVersion && <Typography component="span" className={this.props.classes.cardContentFlexBetween}>
                        <div>
                            {this.props.t('Installed version')}
                            :
                        </div>
                        <div className={this.props.classes.cardContentFlex}>
                            {this.props.installedFrom && !this.props.installedFrom.startsWith(`iobroker.${this.props.adapter}@`) &&
                                <Tooltip title={this.props.t('Non-NPM-Version: ') + this.props.installedFrom}>
                                    <GitHubIcon
                                        fontSize="small"
                                        className={this.props.classes.versionWarn}
                                    />
                                </Tooltip>}
                            {this.props.installedVersion}
                        </div>
                    </Typography>}
                </div>
            </CardContent>
        </Card>;
    }
}

export default withStyles(styles)(AdapterTile);
