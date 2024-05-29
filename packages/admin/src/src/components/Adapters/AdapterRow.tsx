import React, { Component } from 'react';

import { type Styles, withStyles } from '@mui/styles';

import {
    Avatar,
    CardMedia,
    Grid,
    IconButton,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
    Rating,
    Link,
} from '@mui/material';

import {
    amber,
    blue,
    green,
    red,
} from '@mui/material/colors';

import {
    Add as AddIcon,
    AddToPhotos as AddToPhotosIcon,
    Build as BuildIcon,
    ChevronRight as ChevronRightIcon,
    Cloud as CloudIcon,
    CloudOff as CloudOffIcon,
    DeleteForever as DeleteForeverIcon,
    ExpandMore as ExpandMoreIcon,
    GitHub as GitHubIcon,
    Help as HelpIcon,
    Publish as PublishIcon,
    Refresh as RefreshIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Remove as RemoveIcon,
    MonetizationOn,
} from '@mui/icons-material';

import { i18n, type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import IsVisible from '../IsVisible';
import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';
import sentryIcon from '../../assets/sentry.svg';

const styles = (theme: IobTheme) => ({
    smallAvatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
        marginLeft: 4,
    },
    paddingNone: {
        padding: '0 !important',
    },
    hidden: {
        visibility: 'hidden',
    },
    name: {
        flexWrap: 'nowrap',
        width: 300,
        marginTop: 0,
    },
    nameDiv: {
        display: 'flex',
        alignItems: 'center',
    },
    categoryName: {
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    green: {
        color: green[500],
    },
    blue: {
        color: blue[700],
    },
    category: {
        backgroundColor: theme.palette.background.default,
    },
    updateAvailable: {
        color: green[700],
    },
    wrongDependencies: {
        color: red[700],
    },
    grow: {
        flexGrow: 1,
    },
    displayNone: {
        display: 'none',
    },
    sentryIcon: {
        fontSize: '1.2rem',
    },
    versionWarn: {
        color: amber[500],
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
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10,
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
    marginRight5: {
        marginRight: 5,
    },
    flex: {
        display: 'flex',
    },
    sentry: {
        width: 21,
        height: 21,
        marginTop: 3,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)',
    },
    rating: {
        cursor: 'pointer',
        height: 18,
    },
    nameCell: {
        paddingTop: '0 !important',
        paddingBottom: '0 !important',
    },
    tooltip: {
        pointerEvents: 'none',
    },
}) satisfies Styles<any, any>;

interface AdapterRowProps {
    /** The adapters license */
    license: string;
    /** Detailed license information, like for paid adapters */
    category: boolean;
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
    versionDate: any;
    /** adapter id without 'system.adapter. */
    adapter: string;
    connectionType: string;
    openInstallVersionDialog: () => void;
    dataSource: string;
    t: typeof i18n.t;
    installedFrom: string;
    sentry: boolean;
    allowAdapterInstall: boolean;
    allowAdapterReadme: boolean;
    allowAdapterDelete: boolean;
    allowAdapterUpdate: boolean;
    allowAdapterRating: boolean;
    enabledCount: number;
    /** If dependencies are fulfilled */
    rightDependencies: boolean;
    /** Name of category if it is category */
    categoryName?: string;
    /** If description should be hidden */
    descHidden: boolean;
    /** If category is expanded */
    expanded?: boolean;
    rebuild: boolean;
    onRebuild: () => void;
    /** If category is toggled */
    onToggle: () => void;
    /** Number of adapters in category */
    count: number;
}

class AdapterRow extends Component<AdapterRowProps> {
    renderVersion() {
        const {
            adapter,
            classes,
            enabledCount,
            installedCount,
            installedFrom,
            installedVersion,
            t,
        } = this.props;

        return <Grid
            container
            wrap="nowrap"
            alignItems="center"
            spacing={1}
        >
            <Grid item>
                {installedVersion +
                    (installedCount ? ` (${installedCount}${installedCount !== enabledCount ? '~' : ''})` : '')}
            </Grid>
            {installedFrom && !installedFrom.startsWith(`iobroker.${adapter}@`) &&
                <Grid item container>
                    <Tooltip title={t('Non-NPM-Version: ') + installedFrom}>
                        <GitHubIcon
                            fontSize="small"
                            className={classes.versionWarn}
                        />
                    </Tooltip>
                </Grid>}
        </Grid>;
    }

    render() {
        const isCategory = this.props.category;

        const {
            classes,
            connectionType,
            installedCount,
            installedVersion,
            updateAvailable,
            commandRunning,
            name,
            rightDependencies,
            rightOs,
            sentry,
            categoryName,
            openInstallVersionDialog,
            dataSource,
            descHidden,
            adapter,
            versionDate,
            onSetRating,
            rating,
        } = this.props;

        if (isCategory) {
            return <TableRow
                hover={false}
                className={Utils.clsx(classes.category, this.props.hidden && classes.displayNone)}
            >
                <TableCell>
                    <Grid container spacing={1} alignItems="center" className={classes.name}>
                        <Grid item>
                            <IconButton
                                size="small"
                                onClick={this.props.onToggle}
                            >
                                {this.props.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                            </IconButton>
                        </Grid>
                    </Grid>
                </TableCell>
                <TableCell onClick={this.props.onToggle}>
                    <div className={Utils.clsx(classes.nameDiv, classes.categoryName)}>
                        <MaterialDynamicIcon objIconBool iconName={categoryName} className={classes.marginRight5} />
                        {name}
                    </div>
                </TableCell>
                <TableCell colSpan={descHidden ? 5 : 6}>
                    <Typography component="span" variant="body2" className={classes.green}>
                        {installedCount}
                    </Typography>
                    {` ${this.props.t('of')} `}
                    <Typography component="span" variant="body2" className={classes.blue}>
                        {this.props.count}
                    </Typography>
                    {` ${this.props.t('Adapters from this Group installed')}`}
                </TableCell>
            </TableRow>;
        }
        return <TableRow
            hover
            className={this.props.hidden ? classes.displayNone : ''}
        >
            <TableCell />
            <TableCell>
                <Grid container spacing={1} alignItems="center" className={classes.name}>
                    <Tooltip title={this.props.adapter}>
                        <Grid item className={classes.paddingNone}>
                            <Avatar
                                variant="square"
                                alt={name}
                                src={this.props.image}
                                className={classes.smallAvatar}
                            />
                        </Grid>
                    </Tooltip>
                    {this.props.allowAdapterRating !== false ?
                        <Grid item className={classes.nameCell}>
                            <div>{name}</div>
                            {!versionDate ? <div
                                onClick={onSetRating ? () => onSetRating() : undefined}
                                className={Utils.clsx(classes.rating, onSetRating && classes.ratingSet)}
                                title={rating?.title}
                            >
                                <Rating
                                    name={adapter}
                                    precision={0.5}
                                    size="small"
                                    readOnly
                                    value={rating?.rating ? rating.rating.r : 0}
                                />
                            </div> : null}
                        </Grid>
                        :
                        <Grid item>{name}</Grid>}
                </Grid>
            </TableCell>
            {!descHidden && <TableCell title={this.props.description} sx={{ width: 20, wordWrap: 'break-word' }}>{this.props.description}</TableCell>}
            <TableCell>
                <div className={classes.flex}>
                    {connectionType === 'cloud' ?
                        <Tooltip
                            title={this.props.t('Adapter requires the specific cloud access for these devices/service')}
                        >
                            <CloudIcon />
                        </Tooltip> :
                        (connectionType === 'local' ?
                            <Tooltip
                                title={this.props.t('Adapter does not use the cloud for these devices/service')}
                            >
                                <CloudOffIcon />
                            </Tooltip> : <CloudOffIcon opacity={0} />)}
                    <div className={classes.marginLeft5}>
                        {(
                            dataSource === 'poll' ?
                                <Tooltip title={this.props.t('The device or service will be periodically asked')}>
                                    <ArrowUpwardIcon className={classes.classPoll} />
                                </Tooltip> :
                                dataSource === 'push' ?
                                    <Tooltip
                                        title={this.props.t('The device or service delivers the new state actively')}
                                    >
                                        <ArrowDownwardIcon className={classes.classPush} />
                                    </Tooltip> :
                                    dataSource === 'assumption' ?
                                        <Tooltip
                                            title={this.props.t('Adapter cannot request the exactly device status and the status will be guessed on the last sent command')}
                                        >
                                            <RemoveIcon className={classes.classAssumption} />
                                        </Tooltip> : <RemoveIcon className={classes.classAssumption} opacity={0} />
                        )}
                    </div>
                    <div>
                        <Link
                            href={this.props.licenseInformation?.link}
                            target="_blank"
                            rel="noopener"
                            sx={{ color: 'black', '&:hover': { color: 'black' } }}
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
                                        <MonetizationOn opacity={0} />}
                        </Link>
                    </div>
                    {sentry && <div className={classes.marginLeft5}>
                        <Tooltip title="sentry" classes={{ popper: classes.tooltip }}>
                            <CardMedia
                                className={classes.sentry}
                                component="img"
                                image={sentryIcon}
                            />
                        </Tooltip>
                    </div>}
                </div>
            </TableCell>
            <TableCell>{installedVersion && this.renderVersion()}</TableCell>
            <TableCell className={Utils.clsx({
                [classes.updateAvailable]: updateAvailable && rightDependencies,
                [classes.wrongDependencies]: !rightDependencies,
            })}
            >
                <IsVisible value={this.props.allowAdapterUpdate}>
                    <Grid
                        container
                        alignItems="center"
                    >
                        {!commandRunning && updateAvailable ?
                            <Tooltip title={this.props.t('Update')}>
                                <div
                                    onClick={this.props.onUpdate}
                                    className={classes.buttonUpdate}
                                >
                                    <IconButton
                                        className={classes.buttonUpdateIcon}
                                        size="small"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                    {this.props.version}
                                </div>
                            </Tooltip>
                            :
                            this.props.version}
                    </Grid>
                </IsVisible>
            </TableCell>
            <TableCell>{this.props.license}</TableCell>
            <TableCell>
                <IsVisible value={this.props.allowAdapterInstall}>
                    <Tooltip title={this.props.t('Add instance')}>
                        <IconButton
                            size="small"
                            className={!rightOs ? classes.hidden : ''}
                            onClick={rightOs ? this.props.onAddInstance : null}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </IsVisible>
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
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onUpload}
                            >
                                <PublishIcon />
                            </IconButton>
                        </Tooltip>}
                <IsVisible value={this.props.allowAdapterDelete}>
                    <Tooltip title={this.props.t('Delete adapter')}>
                        <IconButton
                            size="small"
                            disabled={commandRunning}
                            className={!installedVersion ? classes.hidden : ''}
                            onClick={this.props.onDeletion}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    </Tooltip>
                </IsVisible>
                {this.props.expertMode && this.props.allowAdapterUpdate !== false &&
                        <Tooltip title={this.props.t('Install a specific version')}>
                            <IconButton
                                size="small"
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={openInstallVersionDialog}
                            >
                                <AddToPhotosIcon />
                            </IconButton>
                        </Tooltip>}
                {this.props.rebuild && this.props.expertMode &&
                        <Tooltip title={this.props.t('Rebuild')}>
                            <IconButton
                                size="small"
                                disabled={commandRunning}
                                className={!installedVersion ? classes.hidden : ''}
                                onClick={this.props.onRebuild}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Tooltip>}
            </TableCell>
        </TableRow>;
    }
}

export default withStyles(styles)(AdapterRow);
