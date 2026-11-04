import React, { Component, type JSX } from 'react';
import semver from 'semver';

import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Typography,
    Box,
} from '@mui/material';

import { Close as CloseIcon, Language as LanguageIcon, Info as InfoIcon } from '@mui/icons-material';

import { alpha } from '@mui/material/styles';

import { I18n, IconResult, type IobTheme, Utils } from '@iobroker/gui-components';

import type { AdapterRatingInfo, InstalledInfo } from '@/components/Adapters/AdapterInstallDialog';
import { checkCondition } from '@/components/Adapters/AdapterUpdateDialog';
import type { RepoAdapterObject, RepoInfo } from '@/components/Adapters/Utils';
import NewsLine, { stripNewsMarker } from '@/components/Adapters/NewsLine';
import UpdatingRing from '@/components/Adapters/UpdatingRing';

/** Where an adapter is in the update run: `select` before the start, then pending → running → done or error */
type UpdateStatus = 'select' | 'pending' | 'running' | 'done' | 'error';

interface GetNewsResultEntry {
    version: string;
    news: string;
}

const styles: Record<string, any> = {
    smallAvatar: {
        width: 24,
        height: 24,
    },
    listItem: (theme: IobTheme) => ({
        mb: '2px',
        borderRadius: `${theme.shape.borderRadius}px`,
        // the status shows as a tinted row with a bar on the left; both fade into the next status
        borderLeft: '3px solid transparent',
        transition: 'background-color 0.5s ease, border-color 0.5s ease, opacity 0.4s ease',
        '@media screen and (max-width: 400px)': {
            pl: '2px',
        },
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
        },
    }),
    pending: {
        opacity: 0.55,
    },
    running: (theme: IobTheme) => ({
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
        borderLeftColor: theme.palette.primary.main,
    }),
    done: (theme: IobTheme) => ({
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        borderLeftColor: theme.palette.success.main,
    }),
    error: (theme: IobTheme) => ({
        backgroundColor: alpha(theme.palette.error.main, 0.14),
        borderLeftColor: theme.palette.error.main,
    }),
    iconWrapper: {
        position: 'relative',
        display: 'flex',
    },
    /** A line is drawn through the old version, when the update is done */
    fromVersion: {
        position: 'relative',
        transition: 'opacity 0.4s ease-out 0.2s',
        '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '55%',
            height: '1px',
            width: 0,
            background: 'currentColor',
            transition: 'width 0.4s ease-out 0.2s',
        },
    },
    fromVersionDone: {
        opacity: 0.6,
        '&::after': {
            width: '100%',
        },
    },
    toVersion: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#00dc00' : '#008100',
        fontWeight: 'bold',
        ml: '4px',
    }),
    /** The new version was not installed: not green anymore */
    toVersionFailed: {
        color: 'text.secondary',
    },
    minWidthCss: {
        '@media screen and (max-width: 400px)': {
            minWidth: 32,
        },
    },
    wrapperButton: {},
    typography: {
        paddingRight: 30,
    },
    versions: {
        minWidth: 110,
        display: 'inline-block',
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    languageButton: {
        position: 'absolute',
        right: 52 + 8,
        top: 8,
    },
    languageButtonActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    versionHeader: (theme: IobTheme) => ({
        background: '#4dabf5',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    repoStableVersionText: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#8dff7a' : '#2b9800',
        fontWeight: 'bold',
        marginLeft: '4px',
    }),
    repoLatestVersionText: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#a3fcff' : '#005498',
        fontWeight: 'bold',
        marginLeft: '4px',
    }),
};

interface AdaptersUpdaterProps {
    inProcess: boolean;
    lang: ioBroker.Languages;
    /** if a process has been stopped, e.g., due to an error */
    stopped: boolean;
    repository: Record<string, RepoAdapterObject & { rating?: AdapterRatingInfo }>;
    installed: InstalledInfo;
    onUpdateSelected: (adapters: string[], adapters2?: string[]) => void;
    selected: string[];
    current: string;
    updated: string[];
    /** Adapters whose update failed */
    failed: string[];
    finished: boolean;
    noTranslation: boolean;
    toggleTranslation: () => void;
    theme: IobTheme;
    rightDependenciesFunc: (adapterName: string) => boolean;
}

interface AdaptersUpdaterState {
    showNews: null | Record<string, any>;
}

interface UpdateAvailableCheckOptions {
    /** The installed version */
    oldVersion: string;
    /** The repo version or new version */
    newVersion: string;
    /** Adapter name */
    name: string;
}

class AdaptersUpdater extends Component<AdaptersUpdaterProps, AdaptersUpdaterState> {
    private readonly updateAvailable: string[];

    /** Key adapterName, value: version */
    private readonly initialVersions: Record<string, string>;

    private readonly currentRef: React.RefObject<HTMLLIElement | null>;

    private current: string;

    constructor(props: AdaptersUpdaterProps) {
        super(props);

        this.updateAvailable = this.detectUpdates();
        this.initialVersions = {};
        this.updateAvailable.forEach(
            adapter => (this.initialVersions[adapter] = this.props.installed[adapter].version),
        );

        this.state = {
            showNews: null,
        };

        this.currentRef = React.createRef();
        this.current = props.current;

        this.props.onUpdateSelected([...this.updateAvailable], this.updateAvailable);
    }

    static isUpdateAvailable(options: UpdateAvailableCheckOptions): boolean {
        const { oldVersion, newVersion, name } = options;

        try {
            return semver.gt(newVersion, oldVersion);
        } catch {
            console.warn(`Cannot compare "${newVersion}" and "${oldVersion}" of adapter ${name}`);
            return false;
        }
    }

    /**
     * Get a list of available adapter updates
     * Admin and controller are filtered out,
     * and all adapters that have messages for this update are filtered out too
     * Also filters out adapters whose dependencies are not met
     */
    detectUpdates(): string[] {
        const updateAvailable: string[] = [];

        Object.keys(this.props.repository).forEach(adapter => {
            const _installed = this.props.installed[adapter];
            // ignore js-controller in this dialog
            if (adapter === 'js-controller' || adapter === 'admin') {
                return;
            }
            if (
                _installed &&
                this.props.repository[adapter].version &&
                _installed.ignoreVersion !== this.props.repository[adapter].version &&
                AdaptersUpdater.isUpdateAvailable({
                    oldVersion: _installed.version,
                    newVersion: this.props.repository[adapter].version,
                    name: adapter,
                })
            ) {
                if (
                    !checkCondition(
                        this.props.repository[adapter].messages,
                        _installed.version,
                        this.props.repository[adapter].version,
                    )
                ) {
                    // Check if dependencies are met before adding to update list
                    if (this.props.rightDependenciesFunc(adapter)) {
                        updateAvailable.push(adapter);
                    } else {
                        console.log(
                            `Adapter ${adapter} is filtered out from update all functionality, because its dependencies are not met`,
                        );
                    }
                } else {
                    console.log(
                        `Adapter ${adapter} is filtered out from update all functionality, because it has messages which need to be read before update`,
                    );
                }
            }
        });

        updateAvailable.sort();

        return updateAvailable;
    }

    getNews(adapter: string): GetNewsResultEntry[] {
        const adapterObj = this.props.repository[adapter];
        const installed = this.props.installed[adapter];
        const news: GetNewsResultEntry[] = [];

        const adapterNews = adapterObj?.news;
        if (installed && adapterNews) {
            Object.keys(adapterNews).forEach(version => {
                try {
                    if (semver.gt(version, installed.version)) {
                        news.push({
                            version,
                            news: this.props.noTranslation
                                ? adapterNews[version].en
                                : adapterNews[version][this.props.lang] || adapterNews[version].en,
                        });
                    }
                } catch {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed.version}" of adapter ${adapter}`);
                }
            });
        }

        return news;
    }

    getStatus(adapter: string): UpdateStatus {
        if (this.props.failed.includes(adapter)) {
            return 'error';
        }
        if (this.props.updated.includes(adapter)) {
            return 'done';
        }
        if (!this.props.inProcess && !this.props.finished) {
            return 'select';
        }
        if (this.props.current === adapter && !this.props.stopped && !this.props.finished) {
            return 'running';
        }
        return 'pending';
    }

    renderOneAdapter(adapter: string): JSX.Element | null {
        const checked = this.props.selected.includes(adapter);
        if ((this.props.finished || this.props.inProcess) && !checked) {
            return null;
        }
        if (!this.props.installed[adapter]) {
            // during installation, this adapter was uninstalled
            return null;
        }
        const localIcon = this.props.installed[adapter].localIcon;
        const image = localIcon ? `.${localIcon}` : this.props.repository[adapter]?.extIcon || 'img/no-image.svg';
        const status = this.getStatus(adapter);

        return (
            <ListItem
                key={adapter}
                dense
                sx={{
                    '&.MuiListItem-root': Utils.getStyle(
                        this.props.theme,
                        styles.listItem,
                        status !== 'select' && styles[status],
                    ),
                }}
                ref={this.props.current === adapter ? this.currentRef : null}
                secondaryAction={
                    status === 'select' ? (
                        <Checkbox
                            edge="end"
                            checked={checked}
                            tabIndex={-1}
                            disableRipple
                            disabled={this.props.inProcess}
                            onClick={() => {
                                const selected = [...this.props.selected];
                                const pos = selected.indexOf(adapter);
                                if (pos !== -1) {
                                    selected.splice(pos, 1);
                                } else {
                                    selected.push(adapter);
                                    selected.sort();
                                }
                                this.props.onUpdateSelected(selected);
                            }}
                        />
                    ) : status === 'done' || status === 'error' ? (
                        <IconResult
                            type={status === 'done' ? 'success' : 'error'}
                            ariaLabel={status === 'done' ? I18n.t('updated') : I18n.t('Error')}
                        />
                    ) : null
                }
            >
                <ListItemIcon sx={styles.minWidthCss}>
                    <Box sx={styles.iconWrapper}>
                        <Avatar
                            variant="square"
                            alt={adapter}
                            src={image}
                            style={styles.smallAvatar}
                        />
                        {status === 'running' ? (
                            <UpdatingRing
                                size={24}
                                style={{ left: 12, top: 12 }}
                            />
                        ) : null}
                    </Box>
                </ListItemIcon>
                <ListItemText
                    primary={adapter}
                    title={this.getNews(adapter)
                        .map(item => `${item.version}: ${item.news}`)
                        .join('\n')}
                    secondary={
                        <span>
                            <div style={styles.versions}>
                                <Box
                                    component="span"
                                    sx={[styles.fromVersion, status === 'done' && styles.fromVersionDone]}
                                >
                                    {this.initialVersions[adapter]}
                                </Box>{' '}
                                →
                                <Box
                                    component="span"
                                    sx={[styles.toVersion, status === 'error' && styles.toVersionFailed]}
                                >
                                    {this.props.repository[adapter].version}
                                </Box>
                            </div>
                            <IconButton
                                title={I18n.t('Show change log')}
                                onClick={() =>
                                    this.setState({
                                        showNews: {
                                            adapter,
                                            version: this.props.repository[adapter].version,
                                            fromVersion: this.initialVersions[adapter],
                                        },
                                    })
                                }
                                size="small"
                            >
                                <InfoIcon />
                            </IconButton>
                        </span>
                    }
                />
            </ListItem>
        );
    }

    getReactNews(adapter: string, fromVersion: string): JSX.Element[] {
        const adapterObj = this.props.repository[adapter];
        const installed = this.props.installed[adapter];
        fromVersion = fromVersion || installed.version;
        const result: JSX.Element[] = [];

        let stableVersion: string | undefined;
        let latestVersion: string | undefined;
        const repoInfo: RepoInfo = this.props.repository._repoInfo as unknown as RepoInfo;
        if (repoInfo?.stable) {
            stableVersion = this.props.repository[adapter]?.version;
            latestVersion = this.props.repository[adapter]?.latestVersion;
        } else {
            stableVersion = this.props.repository[adapter]?.stable;
            latestVersion = this.props.repository[adapter]?.version;
        }

        const adapterNews = adapterObj?.news;
        if (installed && adapterNews) {
            Object.keys(adapterNews).forEach(version => {
                try {
                    if (semver.gt(version, fromVersion) && adapterNews[version]) {
                        const newsText: string = this.props.noTranslation
                            ? adapterNews[version].en || ''
                            : adapterNews[version][this.props.lang] || adapterNews[version].en || '';

                        const news = newsText
                            .split('\n')
                            .map(line =>
                                stripNewsMarker(line.trim())
                                    .replace(/<!--[^>]*->/g, '')
                                    .replace(/<! -[^>]*->/g, '')
                                    .trim(),
                            )
                            .filter(line => !!line);

                        result.push(
                            <Grid key={version}>
                                <Typography sx={styles.versionHeader}>
                                    {version}
                                    {latestVersion === version ? (
                                        <Box
                                            component="span"
                                            sx={styles.repoLatestVersionText}
                                        >
                                            (latest)
                                        </Box>
                                    ) : null}
                                    {stableVersion === version ? (
                                        <Box
                                            component="span"
                                            sx={styles.repoStableVersionText}
                                        >{`(${I18n.t('stable')})`}</Box>
                                    ) : null}
                                </Typography>
                                {news.map((value, index) => (
                                    <NewsLine
                                        key={`${version}-${index}`}
                                        text={value}
                                    />
                                ))}
                            </Grid>,
                        );
                    }
                } catch {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${fromVersion}" of adapter ${adapter}`);
                }
            });
        }

        return result;
    }

    renderShowNews(): JSX.Element | null {
        if (this.state.showNews) {
            const news = this.getReactNews(this.state.showNews.adapter, this.state.showNews.fromVersion);

            const closeButton = Utils.getStyle(this.props.theme, styles.closeButton);

            const languageButtonActive = Utils.getStyle(this.props.theme, styles.languageButtonActive);

            return (
                <Dialog
                    onClose={() => this.setState({ showNews: null })}
                    open={!0}
                >
                    <DialogTitle>
                        <Typography
                            component="h2"
                            variant="h6"
                            sx={{ '&.MuiTypography-root': styles.typography }}
                        >
                            <div style={{ width: 'calc(100% - 60px)' }}>
                                {I18n.t('Update "%s" to v%s', this.state.showNews.adapter, this.state.showNews.version)}
                            </div>
                            <IconButton
                                size="large"
                                style={closeButton}
                                onClick={() => this.setState({ showNews: null })}
                            >
                                <CloseIcon />
                            </IconButton>
                            {I18n.getLanguage() !== 'en' && this.props.toggleTranslation ? (
                                <IconButton
                                    size="large"
                                    style={{
                                        ...styles.languageButton,
                                        ...(this.props.noTranslation ? languageButtonActive : undefined),
                                    }}
                                    onClick={this.props.toggleTranslation}
                                    title={I18n.t('Disable/Enable translation')}
                                >
                                    <LanguageIcon />
                                </IconButton>
                            ) : null}
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid
                            container
                            spacing={2}
                            wrap="nowrap"
                            sx={{ flexDirection: 'column' }}
                        >
                            {news.length ? (
                                <Grid>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                    >
                                        {I18n.t('Change log')}
                                    </Typography>
                                    <Grid
                                        container
                                        spacing={2}
                                        wrap="nowrap"
                                        sx={{ flexDirection: 'column' }}
                                    >
                                        {news}
                                    </Grid>
                                </Grid>
                            ) : (
                                I18n.t('No change log available')
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions style={styles.wrapperButton}>
                        <Button
                            variant="contained"
                            onClick={() => this.setState({ showNews: null })}
                            color="grey"
                            startIcon={<CloseIcon />}
                        >
                            {I18n.t('Close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            );
        }
        return null;
    }

    render(): JSX.Element {
        if (this.current !== this.props.current) {
            this.current = this.props.current;
            setTimeout(() => this.currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
        }

        return (
            <List style={styles.root}>
                {this.updateAvailable.map(adapter => this.renderOneAdapter(adapter))}
                {this.renderShowNews()}
            </List>
        );
    }
}

export default AdaptersUpdater;
