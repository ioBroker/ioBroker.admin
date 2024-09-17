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
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid2,
    IconButton,
    Typography,
    Box,
} from '@mui/material';

import { Close as CloseIcon, Language as LanguageIcon, Info as InfoIcon } from '@mui/icons-material';

import { I18n, type IobTheme, Utils } from '@iobroker/adapter-react-v5';

import type { AdapterRatingInfo, InstalledInfo } from '@/components/Adapters/AdapterInstallDialog';
import { checkCondition } from '@/dialogs/AdapterUpdateDialog';
import type { RepoAdapterObject } from '@/components/Adapters/Utils';

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
        background: theme.palette.background,
        '@media screen and (max-width: 400px)': {
            pl: '2px',
        },
    }),
    toVersion: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#00dc00' : '#008100',
        fontWeight: 'bold',
        ml: '4px',
    }),
    updateDone: {
        background: '#5ef05e80',
        opacity: 0.7,
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
    finished: boolean;
    noTranslation: boolean;
    toggleTranslation: () => void;
    theme: IobTheme;
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

    private readonly currentRef: React.RefObject<HTMLLIElement>;

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
                    updateAvailable.push(adapter);
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

        if (installed && adapterObj?.news) {
            Object.keys(adapterObj.news).forEach(version => {
                try {
                    if (semver.gt(version, installed.version)) {
                        news.push({
                            version,
                            news: this.props.noTranslation
                                ? adapterObj.news[version].en
                                : adapterObj.news[version][this.props.lang] || adapterObj.news[version].en,
                        });
                    }
                } catch {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed.version}"`);
                }
            });
        }

        return news;
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
        const image = `.${this.props.installed[adapter].localIcon}`;

        return (
            <ListItem
                key={adapter}
                dense
                sx={{
                    '&.MuiListItem-root': Utils.getStyle(
                        this.props.theme,
                        styles.listItem,
                        this.props.updated.includes(adapter) && styles.updateDone,
                    ),
                }}
                ref={this.props.current === adapter ? this.currentRef : null}
                secondaryAction={
                    !this.props.finished && !this.props.inProcess ? (
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
                    ) : (
                        this.props.current === adapter &&
                        !this.props.stopped &&
                        !this.props.finished && <CircularProgress />
                    )
                }
            >
                <ListItemIcon sx={styles.minWidthCss}>
                    <Avatar
                        variant="square"
                        alt={adapter}
                        src={image}
                        style={styles.smallAvatar}
                    />
                </ListItemIcon>
                <ListItemText
                    primary={adapter}
                    title={this.getNews(adapter)
                        .map(item => `${item.version}: ${item.news}`)
                        .join('\n')}
                    secondary={
                        <span>
                            <div style={styles.versions}>
                                {this.initialVersions[adapter]} →
                                <Box
                                    component="span"
                                    sx={styles.toVersion}
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

        if (installed && adapterObj?.news) {
            Object.keys(adapterObj.news).forEach(version => {
                try {
                    if (semver.gt(version, fromVersion) && adapterObj.news[version]) {
                        const newsText: string = this.props.noTranslation
                            ? adapterObj.news[version].en || ''
                            : adapterObj.news[version][this.props.lang] || adapterObj.news[version].en || '';

                        const news = newsText
                            .split('\n')
                            .map(line =>
                                line
                                    .trim()
                                    .replace(/^\*\s?/, '')
                                    .replace(/<!--[^>]*->/, '')
                                    .replace(/<! -[^>]*->/, '')
                                    .trim(),
                            )
                            .filter(line => !!line);

                        result.push(
                            <Grid2 key={version}>
                                <Typography sx={styles.versionHeader}>{version}</Typography>
                                {news.map((value, index) => (
                                    <Typography
                                        key={`${version}-${index}`}
                                        component="div"
                                        variant="body2"
                                    >
                                        {`• ${value}`}
                                    </Typography>
                                ))}
                            </Grid2>,
                        );
                    }
                } catch {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${fromVersion}"`);
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
                        <Grid2
                            container
                            direction="column"
                            spacing={2}
                            wrap="nowrap"
                        >
                            {news.length ? (
                                <Grid2>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                    >
                                        {I18n.t('Change log')}
                                    </Typography>
                                    <Grid2
                                        container
                                        spacing={2}
                                        direction="column"
                                        wrap="nowrap"
                                    >
                                        {news}
                                    </Grid2>
                                </Grid2>
                            ) : (
                                I18n.t('No change log available')
                            )}
                        </Grid2>
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
            setTimeout(() => this.currentRef.current?.scrollIntoView(), 200);
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
