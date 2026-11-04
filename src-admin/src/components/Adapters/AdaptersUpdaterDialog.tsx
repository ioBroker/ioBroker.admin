import React, { Component, type JSX } from 'react';

import {
    DialogActions,
    Checkbox,
    DialogTitle,
    Button,
    Dialog,
    Grid,
    FormControlLabel,
    Toolbar,
    IconButton,
    Tooltip,
    DialogContent,
    LinearProgress,
    Box,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Cancel as CancelIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { type AdminConnection, I18n, IconResult, Utils, type IobTheme, type Translate } from '@iobroker/gui-components';

import type { AdapterRatingInfo, InstalledInfo } from './AdapterInstallDialog';
import type { RepoAdapterObject } from './Utils';
import AdaptersUpdater from './AdaptersUpdater';
import Command from '../Command';

/** The log slides in from the right, when the first update starts */
const logIn = keyframes`
    from {
        opacity: 0;
        transform: translateX(24px);
    }
    to {
        opacity: 1;
        transform: none;
    }
`;

const styles: Record<string, any> = {
    dialogRoot: {
        height: 'calc(100% - 64px)',
    },
    wrapperHead: {
        justifyContent: 'space-between',
        display: 'flex',
    },
    checkbox: {
        marginRight: 10,
    },
    appBar: (theme: IobTheme) => ({
        flexWrap: 'wrap',
        position: 'sticky',
        bottom: -10,
        pl: 1,
        pr: 1,
        // same radius as the log paper next to it, so the sticky bar does not read as a square patch
        borderRadius: `${theme.shape.borderRadius}px`,
        // from the palette instead of per theme name: the old list knew only 'blue' and 'dark',
        // so every newer theme got the white value
        background: theme.palette.background.paper,
    }),
    container: {
        overflow: 'hidden',
        // takes what the toolbar leaves: a fixed 48px did not match the real toolbar height and the padding,
        // so the content scrolled as well, next to the list
        flex: '1 1 auto',
        minHeight: 0,
        flexWrap: 'nowrap',
        '@media screen and (max-width: 602px)': {
            flex: 'none',
            flexWrap: 'wrap',
        },
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        '& > .MuiToolbar-root': {
            flexShrink: 0,
        },
        '@media screen and (max-width: 500px)': {
            p: 1,
        },
    },
    languageButton: {
        position: 'absolute',
        right: 73,
        top: 11,
    },
    languageButtonActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    step: {
        fontSize: '0.8em',
        opacity: 0.7,
        fontWeight: 'normal',
        ml: 1,
    },
    progress: {
        mt: 1.5,
        height: 6,
        borderRadius: 3,
        '& .MuiLinearProgress-bar': {
            borderRadius: 3,
        },
    },
    log: {
        animation: `${logIn} 0.35s ease-out`,
        '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
        },
    },
};

interface AdaptersUpdaterDialogProps {
    currentHost: string;
    lang: ioBroker.Languages;
    t: Translate;
    socket: AdminConnection;
    onClose: (updated: boolean) => void;
    repository: Record<string, RepoAdapterObject & { rating?: AdapterRatingInfo }>;
    installed: InstalledInfo;
    onSetCommandRunning: (running: boolean) => void;
    noTranslation?: boolean;
    toggleTranslation?: () => void;
    theme: IobTheme;
    rightDependenciesFunc: (adapterName: string) => boolean;
}

interface AdaptersUpdaterDialogState {
    selected: string[];
    inProcess: boolean;
    finished: boolean;
    current: string;
    updated: string[];
    /** Adapters whose update failed */
    failed: string[];
    stopped: boolean;
    debug: boolean;
    stopOnError: boolean;
    closeOnFinished: boolean;
    currentVersion: string;
}

class AdaptersUpdaterDialog extends Component<AdaptersUpdaterDialogProps, AdaptersUpdaterDialogState> {
    updateAvailable: string[] = [];

    onAdapterFinished: (() => void) | null = null;

    processList: { adapter: string; version: string }[] = [];

    constructor(props: AdaptersUpdaterDialogProps) {
        super(props);

        this.state = {
            selected: [],
            inProcess: false,
            finished: false,
            current: '',
            updated: [],
            failed: [],
            /** If an upgrade process has been stopped, e.g., due to an error */
            stopped: false,
            debug:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    'AdaptersUpdaterDialog.debug',
                ) === 'true',
            stopOnError:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    'AdaptersUpdaterDialog.stopOnError',
                ) !== 'false',
            closeOnFinished:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem(
                    'AdaptersUpdaterDialog.closeOnFinished',
                ) === 'true',
            currentVersion: '',
        };

        this.updateAvailable = [];
    }

    updateAdapter(adapter: string, version: string, cb: () => void): void {
        this.onAdapterFinished = cb;
        this.setState({ current: adapter, currentVersion: version });
    }

    onStartUpdate(): void {
        this.setState({ inProcess: true }, () => {
            this.props.onSetCommandRunning(true);
            this.processList = [...this.state.selected].map(adapter => ({
                adapter,
                version: this.props.repository[adapter]?.version,
            }));

            this.updateAdapters(() => {
                this.setState({ inProcess: false, finished: true }, () => {
                    this.props.onSetCommandRunning(false);
                    if (this.state.closeOnFinished) {
                        this.props.onClose(!!this.state.updated.length);
                    } else {
                        // update adapters and so on
                    }
                });
            });
        });
    }

    updateAdapters(cb: () => void): void {
        if (!this.processList || !this.processList.length || this.state.stopped) {
            if (cb) {
                cb();
            }
        } else {
            const { adapter, version } = this.processList.shift() as { adapter: string; version: string };

            this.updateAdapter(adapter, version, () => {
                const updated = [...this.state.updated];
                updated.push(adapter);
                this.setState({ updated }, () => setTimeout(() => this.updateAdapters(cb), 200));
            });
        }
    }

    /** Number of the adapters with a result (updated or failed) */
    getProcessedCount(): number {
        return new Set([...this.state.updated, ...this.state.failed]).size;
    }

    isAllUpdated(): boolean {
        return this.state.finished && !this.state.stopped && !this.state.failed.length;
    }

    renderTitle(): JSX.Element {
        const total = this.state.selected.length;
        if (this.state.finished) {
            const updated = this.state.updated.filter(adapter => !this.state.failed.includes(adapter)).length;
            const all = this.isAllUpdated();
            return (
                <Box sx={styles.title}>
                    <IconResult type={all ? 'success' : this.state.failed.length ? 'error' : 'warning'} />
                    {all
                        ? this.props.t('%s adapter(s) updated', updated)
                        : this.props.t('%s of %s adapter(s) updated', updated, total)}
                </Box>
            );
        }
        return (
            <Box sx={styles.title}>
                {this.props.t('Update %s adapter(s)', total)}
                {this.state.inProcess ? (
                    <Box
                        component="span"
                        sx={styles.step}
                    >
                        {this.props.t('Step %s of %s', Math.min(this.getProcessedCount() + 1, total), total)}
                    </Box>
                ) : null}
            </Box>
        );
    }

    /** The whole run: the done part solid, the running adapter light, the rest dashed */
    renderProgress(): JSX.Element | null {
        const total = this.state.selected.length;
        if ((!this.state.inProcess && !this.state.finished) || !total) {
            return null;
        }
        const processed = this.getProcessedCount();
        const running = this.state.inProcess && !this.state.finished;
        return (
            <LinearProgress
                variant={running ? 'buffer' : 'determinate'}
                value={(processed / total) * 100}
                valueBuffer={running ? (Math.min(processed + 1, total) / total) * 100 : undefined}
                color={
                    this.state.failed.length || this.state.stopped
                        ? // a failure while the others still run is a warning: the run goes on
                          running
                            ? 'warning'
                            : 'error'
                        : this.state.finished
                          ? 'success'
                          : 'primary'
                }
                sx={styles.progress}
            />
        );
    }

    render(): JSX.Element {
        const languageButtonActive = this.props.noTranslation
            ? Utils.getStyle(this.props.theme, styles.languageButtonActive)
            : undefined;

        return (
            <Dialog
                open={!0}
                maxWidth="lg"
                fullWidth={!!this.state.current}
                onClose={() => this.props.onClose(!!this.state.updated.length)}
                aria-labelledby="update-dialog-title"
                aria-describedby="update-dialog-description"
                sx={{ '& .MuiPaper-root': styles.dialogRoot }}
                scroll="paper"
            >
                <DialogTitle id="update-dialog-title">
                    <div style={styles.wrapperHead}>
                        {this.renderTitle()}
                        {!this.state.finished && !this.state.inProcess && (
                            <Tooltip
                                title={this.props.t('Select/Unselect all')}
                                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                            >
                                <Checkbox
                                    checked={this.state.selected.length === this.updateAvailable.length}
                                    style={styles.checkbox}
                                    tabIndex={-1}
                                    indeterminate={
                                        this.state.selected.length !== this.updateAvailable.length &&
                                        this.state.selected.length !== 0
                                    }
                                    disableRipple
                                    onClick={() => {
                                        let selected: string[] = [];
                                        if (this.state.selected.length !== this.updateAvailable.length) {
                                            selected = [...this.updateAvailable];
                                        }
                                        this.setState({ selected });
                                    }}
                                />
                            </Tooltip>
                        )}
                        {I18n.getLanguage() !== 'en' && this.props.toggleTranslation ? (
                            <IconButton
                                size="large"
                                style={{ ...styles.languageButton, ...languageButtonActive }}
                                onClick={() => this.props.toggleTranslation?.()}
                                title={I18n.t('Disable/Enable translation')}
                            >
                                <LanguageIcon />
                            </IconButton>
                        ) : null}
                    </div>
                    {this.renderProgress()}
                </DialogTitle>
                <DialogContent sx={{ '&.MuiDialogContent-root': styles.content }}>
                    <Grid
                        container
                        direction="row"
                        sx={styles.container}
                    >
                        <Grid style={{ height: '100%', overflow: 'hidden', width: this.state.current ? 250 : '100%' }}>
                            <div style={{ height: '100%', overflow: 'auto' }}>
                                <AdaptersUpdater
                                    finished={this.state.finished}
                                    inProcess={this.state.inProcess}
                                    selected={this.state.selected}
                                    current={this.state.current}
                                    stopped={this.state.stopped}
                                    updated={this.state.updated}
                                    failed={this.state.failed}
                                    lang={this.props.lang}
                                    installed={this.props.installed}
                                    repository={this.props.repository}
                                    noTranslation={!!this.props.noTranslation}
                                    toggleTranslation={this.props.toggleTranslation || (() => {})}
                                    onUpdateSelected={(selected: string[], updateAvailable?: string[]) => {
                                        if (updateAvailable) {
                                            this.updateAvailable = updateAvailable;
                                        }
                                        this.setState({ selected });
                                    }}
                                    theme={this.props.theme}
                                    rightDependenciesFunc={this.props.rightDependenciesFunc}
                                />
                            </div>
                        </Grid>
                        {!!this.state.current && (
                            <Grid
                                style={{
                                    height: '100%',
                                    overflow: 'hidden',
                                    width: 'calc(100% - 260px)',
                                    minWidth: 240,
                                }}
                                sx={styles.log}
                            >
                                <Command
                                    noSpacing
                                    key={this.state.current}
                                    ready
                                    host={this.props.currentHost}
                                    socket={this.props.socket}
                                    t={this.props.t}
                                    cmd={`upgrade ${this.state.current}@${this.state.currentVersion}${this.state.debug ? ' --debug' : ''}`}
                                    onFinished={() => this.onAdapterFinished?.()}
                                    errorFunc={() => {
                                        const failed = [...this.state.failed, this.state.current];
                                        if (this.state.stopOnError) {
                                            this.setState({ failed, stopped: true, finished: true });
                                            this.onAdapterFinished = null;
                                            this.props.onSetCommandRunning(false);
                                        } else {
                                            this.setState({ failed }, () => this.onAdapterFinished?.());
                                        }
                                    }}
                                />
                            </Grid>
                        )}
                    </Grid>
                    <Toolbar
                        variant="dense"
                        disableGutters
                        sx={styles.appBar}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    disabled={this.state.finished}
                                    checked={this.state.stopOnError}
                                    onChange={() => {
                                        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                            'AdaptersUpdaterDialog.stopOnError',
                                            this.state.stopOnError ? 'false' : 'true',
                                        );
                                        this.setState({ stopOnError: !this.state.stopOnError });
                                    }}
                                />
                            }
                            label={this.props.t('Stop on error')}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    disabled={this.state.finished}
                                    checked={this.state.closeOnFinished}
                                    onChange={() => {
                                        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                            'AdaptersUpdaterDialog.closeOnFinished',
                                            this.state.closeOnFinished ? 'false' : 'true',
                                        );
                                        this.setState({ closeOnFinished: !this.state.closeOnFinished });
                                    }}
                                />
                            }
                            label={this.props.t('Close on finished')}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    disabled={this.state.finished || this.state.inProcess}
                                    checked={this.state.debug}
                                    onChange={() => {
                                        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                            'AdaptersUpdaterDialog.debug',
                                            this.state.debug ? 'false' : 'true',
                                        );
                                        this.setState({ debug: !this.state.debug });
                                    }}
                                />
                            }
                            label={this.props.t('Debug info')}
                        />
                    </Toolbar>
                </DialogContent>
                <DialogActions>
                    <Button
                        id="adapters-update-dialog-update"
                        variant="contained"
                        disabled={
                            this.state.stopped ||
                            this.state.inProcess ||
                            this.state.finished ||
                            !this.state.selected.length
                        }
                        onClick={() => this.onStartUpdate()}
                        color="primary"
                        autoFocus
                        startIcon={<CheckIcon />}
                    >
                        {this.props.t('Update')}
                    </Button>
                    <Button
                        id="adapters-update-dialog-cancel"
                        variant="contained"
                        disabled={!this.state.inProcess}
                        color="grey"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                            this.setState({ stopped: true, finished: true });
                            this.props.onSetCommandRunning(false);
                        }}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                    <Button
                        id="adapters-update-dialog-close"
                        variant="contained"
                        onClick={() => this.props.onClose(!!this.state.updated.length)}
                        disabled={this.state.inProcess && !this.state.stopped}
                        color={this.state.stopped ? 'error' : this.isAllUpdated() ? 'primary' : 'grey'}
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default AdaptersUpdaterDialog;
