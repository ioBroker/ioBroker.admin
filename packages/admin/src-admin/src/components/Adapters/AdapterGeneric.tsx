import React, { type JSX } from 'react';
import semver from 'semver';

import { amber, green, red } from '@mui/material/colors';

import {
    CardMedia,
    IconButton,
    Tooltip,
    Typography,
    Rating,
    Grid2,
    Link,
    TextField,
    InputAdornment,
    Button,
    Card,
    CardContent,
    Box,
} from '@mui/material';

import {
    Refresh as RefreshIcon,
    Add as AddIcon,
    Help as HelpIcon,
    KeyboardArrowUp,
    Cloud as CloudIcon,
    CloudOff as CloudOffIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Remove as RemoveIcon,
    GitHub as GitHubIcon,
    MonetizationOn,
    Close as CloseIcon,
    Link as LinkIcon,
    Publish as PublishIcon,
    DeleteForever as DeleteForeverIcon,
    AddToPhotos as AddToPhotosIcon,
    Build as BuildIcon,
} from '@mui/icons-material';

import { type IobTheme, Utils } from '@iobroker/react-components';

import AdapterUpdateDialog from '@/dialogs/AdapterUpdateDialog';
import CustomModal from '@/components/CustomModal';
import RatingDialog, { type RatingDialogRepository } from '@/dialogs/RatingDialog';
import AdapterDeletionDialog from '@/dialogs/AdapterDeletionDialog';
import AdminUtils from '@/helpers/AdminUtils';
import AdapterInstallDialog, {
    type AdapterInstallDialogState,
    type AdapterRating,
    type AdapterRatingInfo,
    type AdaptersContext,
} from '@/components/Adapters/AdapterInstallDialog';
import AutoUpgradeConfigDialog, { ICONS } from '@/dialogs/AutoUpgradeConfigDialog';

import IsVisible from '../IsVisible';
import { extractUrlLink } from './Utils';
import sentryIcon from '../../assets/sentry.svg';

export const genericStyles: Record<string, any> = {
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
    ratingSet: {
        cursor: 'pointer',
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
    wrongDependencies: {
        color: red[700],
    },
    updateAvailable: {
        color: green[700],
    },
    currentVersion: (theme: IobTheme) => ({
        cursor: 'pointer',
        mb: '6px',
        mr: '8px',
        mt: '4px',
        '&:hover': {
            background: theme.palette.primary.dark,
        },
    }),
    header: (theme: IobTheme) => ({
        fontWeight: 'bold',
        background: theme.palette.secondary.main,
        p: '10px',
    }),
    modalDialog: {
        height: 'calc(100% - 64px)',
        overflowY: 'hidden',
    },
    currentVersionText: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#a3ffa3' : '#009800',
        fontWeight: 'bold',
    }),
    rating: {},
    containerVersion: {},
    containerSpecificVersion: {},
    versionWarn: {
        color: amber[500],
    },
    cardContentFlexBetween: {},
    cardContentFlex: {},
};

export type Ratings = { [adapterName: string]: AdapterRating } & { uuid: string };

export type AdapterCacheEntry = {
    title: string;
    desc: string;
    image: string;
    connectionType: string;
    updateAvailable: boolean;
    rightDependencies: boolean;
    rightOs: boolean;
    sentry: boolean;
    daysAgo: number;
    stat: number;
    daysAgoText: string;
};

export interface AdapterGenericProps {
    /** adapter name id without 'system.adapter.' */
    adapterName: string;
    /** Same information for every adapter */
    context: AdaptersContext;
    cached: AdapterCacheEntry;
    commandRunning: boolean;
}

export interface AdapterGenericState extends AdapterInstallDialogState {
    autoUpgradeDialogOpen: boolean;
    showUpdateDialog: boolean;
    adapterDeletionDialog: boolean;
    adapterInstallSpecificVersion: string;
    showInstallVersion: boolean;
    showSetRating: {
        version: string;
        rating: AdapterRatingInfo;
    } | null;
}

export interface ImageProps {
    alt: string;
    style: React.CSSProperties;
    [other: string]: any;
}

export default abstract class AdapterGeneric<
    TProps extends AdapterGenericProps,
    TState extends AdapterGenericState,
> extends AdapterInstallDialog<TProps, TState> {
    protected installedVersion: string = '';

    protected abstract styles: Record<string, any>;

    public constructor(props: TProps) {
        super(props);

        Object.assign(this.state, {
            autoUpgradeDialogOpen: false,
            showUpdateDialog: false,
            adapterDeletionDialog: false,
            adapterInstallSpecificVersion: '',
            showInstallVersion: false,
            showSetRating: null,
        } as TState);
    }

    static renderImage(imageProps: ImageProps): JSX.Element {
        const { style, alt, ...other } = imageProps;

        const img = style.backgroundImage.substring(5, style.backgroundImage.length - 2);

        return (
            <img
                {...other}
                alt={alt}
                src={img}
                onError={e => {
                    if (e.target) {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = './img/no-image.png';
                    }
                }}
            />
        );
    }

    renderAddInstanceButton(): JSX.Element {
        const allowAdapterInstall = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterInstall
            : true;

        return (
            <IsVisible value={allowAdapterInstall}>
                <Tooltip
                    title={this.props.context.t('Add instance')}
                    slotProps={{ popper: { sx: this.styles.tooltip } }}
                >
                    <IconButton
                        size="small"
                        disabled={this.props.commandRunning}
                        style={!this.props.cached.rightOs ? this.styles.hidden : undefined}
                        onClick={
                            this.props.cached.rightOs
                                ? () => this.onAddInstance(this.props.adapterName, this.props.context)
                                : undefined
                        }
                    >
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </IsVisible>
        );
    }

    renderAutoUpgradeButton(): JSX.Element | null {
        const adapterObj = this.props.context.hostAdapterWorker.getObject(this.props.adapterName);
        if (!adapterObj) {
            return <div style={{ width: 34, height: 34, display: 'inline-block' }} />;
        }

        // 'none' | 'patch' | 'minor' | 'major'
        const autoUpgrade: ioBroker.AutoUpgradePolicy = adapterObj.common?.automaticUpgrade;

        return (
            <Tooltip
                title={this.props.context.t('Automatic Upgrade Policy') + (autoUpgrade ? `: ${autoUpgrade}` : '')}
                slotProps={{ popper: { sx: this.styles.tooltip } }}
            >
                <IconButton
                    size="small"
                    onClick={() => this.setState({ autoUpgradeDialogOpen: true, showDialog: true })}
                >
                    {!autoUpgrade || autoUpgrade === 'none' ? <KeyboardArrowUp /> : ICONS[autoUpgrade]}
                </IconButton>
            </Tooltip>
        );
    }

    renderReadmeButton(): JSX.Element {
        const allowAdapterReadme = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterReadme
            : true;

        return (
            <IsVisible value={allowAdapterReadme}>
                <Tooltip
                    title={this.props.context.t('Readme')}
                    slotProps={{ popper: { sx: this.styles.tooltip } }}
                >
                    <IconButton
                        size="small"
                        onClick={() => this.openInfoDialog()}
                    >
                        <HelpIcon />
                    </IconButton>
                </Tooltip>
            </IsVisible>
        );
    }

    renderRating(): JSX.Element | null {
        const allowAdapterRating = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterRating
            : true;

        if (
            this.props.context.isTileView &&
            (this.props.context.sortPopularFirst || this.props.context.sortRecentlyUpdated)
        ) {
            return null;
        }

        const stat = this.props.context.repository[this.props.adapterName].stat;
        if (!stat || allowAdapterRating === false) {
            return null;
        }

        return (
            <div
                onClick={() =>
                    this.setState({
                        showSetRating: {
                            version: this.installedVersion,
                            rating: this.props.context.repository[this.props.adapterName].rating,
                        },
                        showDialog: true,
                    })
                }
                style={{ ...this.styles.rating, ...this.styles.ratingSet }}
                title={this.props.context.repository[this.props.adapterName].rating?.title}
            >
                <Rating
                    name={this.props.adapterName}
                    precision={0.5}
                    size="small"
                    readOnly
                    value={this.props.context.repository[this.props.adapterName].rating?.rating?.r || 0}
                />
            </div>
        );
    }

    renderConnectionType(): JSX.Element {
        const connectionType = this.props.context.repository[this.props.adapterName]?.connectionType;
        return connectionType === 'cloud' ? (
            <Tooltip
                title={this.props.context.t('Adapter requires the specific cloud access for these devices/service')}
                slotProps={{ popper: { sx: this.styles.tooltip } }}
            >
                <CloudIcon />
            </Tooltip>
        ) : connectionType === 'local' ? (
            <Tooltip
                title={this.props.context.t('Adapter does not use the cloud for these devices/service')}
                slotProps={{ popper: { sx: this.styles.tooltip } }}
            >
                <CloudOffIcon />
            </Tooltip>
        ) : null;
    }

    renderDataSource(): JSX.Element | null {
        const dataSource = this.props.context.repository[this.props.adapterName]?.dataSource;
        return dataSource ? (
            <div style={this.styles.marginLeft5}>
                {dataSource === 'poll' ? (
                    <Tooltip
                        title={this.props.context.t('The device or service will be periodically asked')}
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                    >
                        <ArrowUpwardIcon style={this.styles.classPoll} />
                    </Tooltip>
                ) : dataSource === 'push' ? (
                    <Tooltip
                        title={this.props.context.t('The device or service delivers the new state actively')}
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                    >
                        <ArrowDownwardIcon style={this.styles.classPush} />
                    </Tooltip>
                ) : dataSource === 'assumption' ? (
                    <Tooltip
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                        title={this.props.context.t(
                            'Adapter cannot request the exactly device status and the status will be guessed on the last sent command',
                        )}
                    >
                        <RemoveIcon style={this.styles.classAssumption} />
                    </Tooltip>
                ) : null}
            </div>
        ) : null;
    }

    renderLicenseInfo(): JSX.Element {
        const adapter = this.props.context.repository[this.props.adapterName];
        const link = extractUrlLink(adapter);

        return adapter.licenseInformation?.type ? (
            <Link
                href={link}
                target="_blank"
                rel="noopener"
                sx={(theme: IobTheme) => ({
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                    '&:hover': { color: theme.palette.mode === 'dark' ? 'white' : 'black' },
                })}
            >
                {adapter.licenseInformation?.type === 'paid' ? (
                    <Tooltip
                        title={this.props.context.t('The adapter requires a paid license.')}
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                    >
                        <MonetizationOn />
                    </Tooltip>
                ) : adapter.licenseInformation?.type === 'commercial' ? (
                    <Tooltip
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                        title={this.props.context.t('The adapter requires a paid license for commercial use.')}
                    >
                        <MonetizationOn opacity={0.5} />
                    </Tooltip>
                ) : adapter.licenseInformation?.type === 'limited' ? (
                    <Tooltip
                        slotProps={{ popper: { sx: this.styles.tooltip } }}
                        title={this.props.context.t('The adapter has a limited functionality without a paid license.')}
                    >
                        <MonetizationOn opacity={0.5} />
                    </Tooltip>
                ) : null}
            </Link>
        ) : null;
    }

    renderSentryInfo(): JSX.Element | null {
        const sentry = this.props.context.repository[this.props.adapterName]?.plugins?.sentry;

        return sentry ? (
            <div style={this.styles.marginLeft5}>
                <Tooltip
                    title="sentry"
                    slotProps={{ popper: { sx: this.styles.tooltip } }}
                >
                    <CardMedia
                        style={this.styles.sentry}
                        component="img"
                        image={sentryIcon}
                    />
                </Tooltip>
            </div>
        ) : null;
    }

    renderVersion(): JSX.Element {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate
            : true;

        return !this.props.commandRunning && this.props.cached.updateAvailable && allowAdapterUpdate !== false ? (
            <Tooltip
                title={this.props.context.t('Update')}
                slotProps={{ popper: { sx: this.styles.tooltip } }}
            >
                <div
                    onClick={() => this.setState({ showUpdateDialog: true, showDialog: true })}
                    style={{
                        ...this.styles.buttonUpdate,
                        ...(this.props.cached.rightDependencies ? this.styles.updateAvailable : undefined),
                    }}
                >
                    <IconButton
                        style={this.styles.buttonUpdateIcon}
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                    {this.props.context.repository[this.props.adapterName].version}
                </div>
            </Tooltip>
        ) : (
            <span style={this.props.cached.rightDependencies ? undefined : this.styles.wrongDependencies}>
                {this.props.context.repository[this.props.adapterName].version}
            </span>
        );
    }

    renderInstalledVersion(isRow?: boolean): JSX.Element | null {
        const installed = this.props.context.installed[this.props.adapterName];
        const installedFrom = installed?.installedFrom;
        const { adapterName } = this.props;

        if (isRow) {
            const enabledCount = installed?.enabled;
            const installedCount = installed?.count;

            return (
                <Grid2
                    container
                    wrap="nowrap"
                    alignItems="center"
                    spacing={1}
                >
                    {this.installedVersion ? (
                        <Grid2>
                            {this.installedVersion +
                                (installedCount
                                    ? ` (${installedCount}${installedCount !== enabledCount ? '~' : ''})`
                                    : '')}
                        </Grid2>
                    ) : null}
                    {installedFrom && !installedFrom.startsWith(`iobroker.${adapterName}@`) && (
                        <Grid2 container>
                            <Tooltip
                                title={this.props.context.t('Non-NPM-Version: ') + installedFrom}
                                slotProps={{ popper: { sx: this.styles.tooltip } }}
                            >
                                <GitHubIcon
                                    fontSize="small"
                                    style={this.styles.versionWarn}
                                />
                            </Tooltip>
                        </Grid2>
                    )}
                </Grid2>
            );
        }

        return this.installedVersion ? (
            <Typography
                component="span"
                style={this.styles.cardContentFlexBetween}
            >
                <div>{this.props.context.t('Installed version')}:</div>
                <div style={this.styles.cardContentFlex}>
                    {installedFrom && !installedFrom.startsWith(`iobroker.${adapterName}@`) && (
                        <Tooltip
                            title={this.props.context.t('Non-NPM-Version: ') + installedFrom}
                            slotProps={{ popper: { sx: this.styles.tooltip } }}
                        >
                            <GitHubIcon
                                fontSize="small"
                                style={this.styles.versionWarn}
                            />
                        </Tooltip>
                    )}
                    {this.installedVersion}
                </div>
            </Typography>
        ) : null;
    }

    renderUploadButton(): JSX.Element | null {
        return this.props.context.expertMode && this.installedVersion ? (
            <Tooltip
                title={this.props.context.t('Upload')}
                slotProps={{ popper: { sx: this.styles.tooltip } }}
            >
                <IconButton
                    size="small"
                    disabled={this.props.commandRunning}
                    onClick={() => this.onUpload()}
                >
                    <PublishIcon />
                </IconButton>
            </Tooltip>
        ) : null;
    }

    renderDeleteButton(): JSX.Element {
        const allowAdapterDelete = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterDelete
            : true;

        return (
            <IsVisible value={!!this.installedVersion && allowAdapterDelete}>
                <Tooltip
                    title={this.props.context.t('Delete adapter')}
                    slotProps={{ popper: { sx: this.styles.tooltip } }}
                >
                    <IconButton
                        size="small"
                        disabled={this.props.commandRunning}
                        onClick={() => this.setState({ adapterDeletionDialog: true, showDialog: true })}
                    >
                        <DeleteForeverIcon />
                    </IconButton>
                </Tooltip>
            </IsVisible>
        );
    }

    renderInstallSpecificVersionButton(): JSX.Element | null {
        const allowAdapterUpdate = this.props.context.repository[this.props.adapterName]
            ? this.props.context.repository[this.props.adapterName].allowAdapterUpdate
            : true;

        return (
            this.props.context.expertMode &&
            allowAdapterUpdate !== false &&
            this.installedVersion && (
                <Tooltip
                    title={this.props.context.t('Install a specific version')}
                    slotProps={{ popper: { sx: this.styles.tooltip } }}
                >
                    <IconButton
                        disabled={this.props.commandRunning}
                        size="small"
                        onClick={() => this.setState({ showInstallVersion: true, showDialog: true })}
                    >
                        <AddToPhotosIcon />
                    </IconButton>
                </Tooltip>
            )
        );
    }

    renderRebuildButton(): JSX.Element | null {
        if (!this.props.context.expertMode || !this.installedVersion) {
            return null;
        }
        return (
            <Tooltip title={this.props.context.t('Rebuild')}>
                <IconButton
                    size="small"
                    disabled={this.props.commandRunning}
                    onClick={() => this.rebuild()}
                >
                    <BuildIcon />
                </IconButton>
            </Tooltip>
        );
    }

    renderAutoUpdateDialog(): JSX.Element | null {
        if (!this.state.autoUpgradeDialogOpen) {
            return null;
        }
        return (
            <AutoUpgradeConfigDialog
                onClose={() => this.setState({ autoUpgradeDialogOpen: false, showDialog: false })}
                adapter={this.props.adapterName}
                hostId={this.props.context.adminHost}
                socket={this.props.context.socket}
            />
        );
    }

    renderUpdateAdapterDialog(): JSX.Element | null {
        if (!this.state.showUpdateDialog) {
            return null;
        }

        this.installedVersion = this.props.context.installed[this.props.adapterName]?.version;

        return (
            <AdapterUpdateDialog
                adapter={this.props.adapterName}
                adapterObject={this.props.context.repository[this.props.adapterName]}
                t={this.props.context.t}
                dependencies={AdapterInstallDialog.getDependencies(this.props.adapterName, this.props.context)}
                rightDependencies={this.props.context.rightDependenciesFunc(this.props.adapterName)}
                news={this.getNews()}
                toggleTranslation={this.props.context.toggleTranslation}
                noTranslation={this.props.context.noTranslation}
                installedVersion={this.installedVersion}
                onUpdate={version =>
                    this.setState({ showUpdateDialog: false, showDialog: false }, () => this.update(version))
                }
                onIgnore={ignoreVersion =>
                    this.setState({ showUpdateDialog: false, showDialog: false }, () =>
                        this.props.context.socket
                            .getObject(`system.adapter.${this.props.adapterName}`)
                            .then(obj => {
                                if (obj?.common) {
                                    // @ts-expect-error must be defined
                                    obj.common.ignoreVersion = ignoreVersion;
                                    this.props.context.socket
                                        .setObject(obj._id, obj)
                                        .catch(error => window.alert(`Cannot write object: ${error}`));
                                } else {
                                    window.alert(`Adapter "${this.props.adapterName}" does not exist!`);
                                }
                            })
                            .then(() => this.props.context.removeUpdateAvailable(this.props.adapterName)),
                    )
                }
                onClose={() => this.setState({ showUpdateDialog: false, showDialog: false })}
                instances={this.props.context.compactInstances}
                theme={this.props.context.theme}
            />
        );
    }

    static formatNews(news: string): JSX.Element[] {
        const lines = (news || '')
            .toString()
            .split('\n')
            .map(line =>
                line.trim().replace(/^\*+/, '').replace(/^-/, '').replace(/\*+$/, '').replace(/\r/g, '').trim(),
            )
            .filter(line => line);

        return lines.map((line, index) => (
            <div
                style={{}}
                key={index}
            >
                <span>- </span>
                {line}
            </div>
        ));
    }

    renderAdapterInstallVersion(): JSX.Element | null {
        if (!this.state.showInstallVersion) {
            return null;
        }

        return (
            <CustomModal
                title={this.props.context.t('Please select specific version of %s', this.props.adapterName)}
                applyButton={false}
                onClose={() =>
                    this.setState({
                        showInstallVersion: false,
                        adapterInstallSpecificVersion: '',
                        showDialog: false,
                    })
                }
                theme={this.props.context.theme}
                toggleTranslation={this.props.context.toggleTranslation}
                noTranslation={this.props.context.noTranslation}
            >
                <div style={{ height: '100%', overflowY: 'hidden' }}>
                    <div style={this.styles.containerSpecificVersion}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TextField
                                variant="standard"
                                style={{ flexGrow: 1 }}
                                label={this.props.context.t('Enter version manually')}
                                value={this.state.adapterInstallSpecificVersion}
                                onChange={event => this.setState({ adapterInstallSpecificVersion: event.target.value })}
                                slotProps={{
                                    input: {
                                        endAdornment: this.state.adapterInstallSpecificVersion ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => this.setState({ adapterInstallSpecificVersion: '' })}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                            />
                            <Button
                                color="primary"
                                variant="contained"
                                size="small"
                                disabled={!this.state.adapterInstallSpecificVersion}
                                onClick={() => {
                                    if (this.state.adapterInstallSpecificVersion) {
                                        void this.update(this.state.adapterInstallSpecificVersion);
                                        this.setState({
                                            showInstallVersion: false,
                                            adapterInstallSpecificVersion: '',
                                            showDialog: false,
                                        });
                                    }
                                }}
                            >
                                {this.props.context.t('Install')}
                            </Button>
                        </div>
                        <Tooltip
                            title={this.props.context.t('npmjs.com')}
                            slotProps={{ popper: { sx: this.styles.tooltip } }}
                        >
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window
                                        .open(
                                            `https://www.npmjs.com/package/iobroker.${this.props.adapterName}?activeTab=versions`,
                                            this.props.adapterName,
                                        )
                                        .focus();
                                }}
                            >
                                <LinkIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <Box
                        component="div"
                        sx={this.styles.header}
                    >
                        {this.props.context.t('Or select from the list')}
                    </Box>
                    <div style={{ ...this.styles.containerVersion, height: 'calc(100% - 122px)', overflowY: 'auto' }}>
                        {this.getNews(true).map(({ version, news }) => (
                            <Card
                                variant="outlined"
                                key={version}
                                sx={this.styles.currentVersion}
                                onClick={() => {
                                    void this.update(version);
                                    this.setState({ showInstallVersion: false, showDialog: false });
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        sx={Utils.getStyle(
                                            this.props.context.theme,
                                            this.installedVersion === version && this.styles.currentVersionText,
                                            { fontSize: 16, fontWeight: 'bold' },
                                        )}
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {version}
                                        {this.installedVersion === version ? (
                                            <Box
                                                component="span"
                                                sx={this.styles.currentVersionText}
                                            >{`(${this.props.context.t('current')})`}</Box>
                                        ) : (
                                            ''
                                        )}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        style={{ opacity: 0.7 }}
                                    >
                                        {AdapterGeneric.formatNews(news)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </CustomModal>
        );
    }

    renderSetRatingDialog(): JSX.Element | null {
        if (!this.state.showSetRating) {
            return null;
        }
        return (
            <RatingDialog
                t={this.props.context.t}
                lang={this.props.context.lang}
                version={this.state.showSetRating.version}
                adapter={this.props.adapterName}
                currentRating={this.state.showSetRating.rating}
                onClose={(update: RatingDialogRepository) => {
                    if (update) {
                        this.props.context.updateRating(this.props.adapterName, update);
                    }
                    this.setState({ showSetRating: null, showDialog: false });
                }}
                uuid={this.props.context.uuid}
            />
        );
    }

    renderAdapterDeletionDialog(): JSX.Element | null {
        if (!this.state.adapterDeletionDialog) {
            return null;
        }
        return (
            <AdapterDeletionDialog
                adapter={this.props.adapterName}
                socket={this.props.context.socket}
                t={this.props.context.t}
                onClick={deleteCustom => this.delete(deleteCustom)}
                onClose={() => this.setState({ adapterDeletionDialog: false, showDialog: false })}
            />
        );
    }

    /**
     * Open adapter readme or docs
     */
    openInfoDialog(): void {
        const adapter = this.props.context.repository[this.props.adapterName];
        const lang = adapter.docs?.[this.props.context.lang] ? this.props.context.lang : 'en';

        window.open(AdminUtils.getDocsLinkForAdapter({ lang, adapterName: this.props.adapterName }), 'help');
    }

    getNews(all = false): { version: string; news: string }[] {
        const adapter = this.props.context.repository[this.props.adapterName];
        const installed = this.props.context.installed[this.props.adapterName];
        const news: { version: string; news: string }[] = [];

        if (installed && adapter?.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed.version) || all) {
                        let text: string;
                        if (typeof adapter.news[version] === 'object') {
                            text = this.props.context.noTranslation
                                ? adapter.news[version].en
                                : adapter.news[version][this.props.context.lang] || adapter.news[version].en;
                        } else {
                            text = adapter.news[version] as any as string;
                        }

                        news.push({
                            version,
                            news: text,
                        });
                    }
                } catch {
                    // ignore it
                    console.warn(
                        `[ADAPTERS] Cannot compare "${version}" and "${installed.version}" (${this.props.adapterName})`,
                    );
                }
            });
        }

        return news;
    }

    onUpload(): void {
        const adapter = this.props.context.repository[this.props.adapterName];
        const url = extractUrlLink(adapter);
        const licenseType = adapter.licenseInformation?.license || adapter.license;

        if (licenseType !== 'MIT') {
            this.setState({
                showLicenseDialog: {
                    url,
                    upload: true,
                    adapterName: this.props.adapterName,
                    licenseType,
                },
                showDialog: true,
            });
        } else {
            AdapterInstallDialog.upload(this.props.adapterName, this.props.context);
        }
    }

    delete(deleteCustom?: boolean): void {
        this.props.context.executeCommand(
            `del ${this.props.adapterName}${deleteCustom ? ' --custom' : ''}${this.props.context.expertMode ? ' --debug' : ''}`,
        );
    }

    async update(version: string): Promise<void> {
        if (
            this.props.adapterName === 'admin' &&
            this.props.context.adminHost === this.props.context.currentHost &&
            (await this.props.context.socket.checkFeatureSupported('ADAPTER_WEBSERVER_UPGRADE'))
        ) {
            this.props.context.setAdminUpgradeTo(version);
            return;
        }

        this.props.context.executeCommand(
            `upgrade ${this.props.adapterName}@${version}${this.props.context.expertMode ? ' --debug' : ''}`,
        );
    }

    rebuild(): void {
        this.props.context.executeCommand(
            `rebuild ${this.props.adapterName}${this.props.context.expertMode ? ' --debug' : ''}`,
        );
    }

    renderDialogs(): JSX.Element | null {
        if (!this.state.showDialog) {
            return null;
        }

        return (
            <>
                {this.renderAddInstanceDialog(this.props.context)}
                {this.renderLicenseDialog(this.props.context)}
                {this.renderUpdateAdapterDialog()}
                {this.renderAdapterInstallVersion()}
                {this.renderSetRatingDialog()}
                {this.renderAdapterDeletionDialog()}
                {this.renderAutoUpdateDialog()}
            </>
        );
    }
}
