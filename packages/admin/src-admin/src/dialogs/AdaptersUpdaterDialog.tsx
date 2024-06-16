import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

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
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
    Cancel as CancelIcon,
    Language as LanguageIcon,
} from '@mui/icons-material';

import {
    type AdminConnection,
    I18n,
    Utils,
    type IobTheme,
    type Translate,
} from '@iobroker/adapter-react-v5';

import AdaptersUpdater from '../components/Adapters/AdaptersUpdater';
import Command from '../components/Command';

const styles: Styles<IobTheme, any> | Record<string, any> = theme => ({
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
    appBar: {
        flexWrap: 'wrap',
        position: 'sticky',
        bottom: -10,
        paddingLeft: 8,
        background: theme.name === 'blue' ? '#5d6467' : (theme.name === 'dark' ? '#5b5b5b' : '#FFF'),
    },
    container:{
        overflow: 'hidden',
        height: 'calc(100% - 48px)',
    },
    '@media screen and (max-width: 602px)': {
        container: {
            height: 'auto',
        },
    },
    '@media screen and (max-width: 500px)': {
        content: {
            padding: 8,
        },
    },
    languageButton: {
        position: 'absolute',
        right: 73,
        top: 11,
    },
    languageButtonActive: {
        color: theme.palette.primary.main,
    },
});

interface AdaptersUpdaterDialogProps {
    currentHost: string;
    lang: string;
    t: Translate;
    socket: AdminConnection;
    onClose: (updated: boolean) => void;
    repository: Record<string, any>;
    installed: Record<string, any>;
    onSetCommandRunning: (running: boolean) => void;
    noTranslation?: boolean;
    toggleTranslation?: () => void;
    classes: Record<string, string>;
}

interface AdaptersUpdaterDialogState {
    selected: string[];
    inProcess: boolean;
    finished: boolean;
    current: string;
    updated: string[];
    stopped: boolean;
    debug: boolean;
    stopOnError: boolean;
    closeOnFinished: boolean;
    currentVersion: string;
}

class AdaptersUpdaterDialog extends Component<AdaptersUpdaterDialogProps, AdaptersUpdaterDialogState> {
    updateAvailable: string[] = [];

    onAdapterFinished: () => void;

    processList: { adapter: string; version: string }[];

    constructor(props: AdaptersUpdaterDialogProps) {
        super(props);

        this.state = {
            selected: [],
            inProcess: false,
            finished: false,
            current: '',
            updated: [],
            /** If an upgrade process has been stopped, e.g., due to an error */
            stopped: false,
            debug: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.debug') === 'true',
            stopOnError: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.stopOnError') !== 'false',
            closeOnFinished: (window._localStorage || window.localStorage).getItem('AdaptersUpdaterDialog.closeOnFinished') === 'true',
            currentVersion: '',
        };

        this.updateAvailable = [];
    }

    updateAdapter(adapter: string, version: string, cb: () => void) {
        this.onAdapterFinished = cb;
        this.setState({ current: adapter, currentVersion: version });
    }

    onStartUpdate() {
        this.setState({ inProcess: true }, () => {
            this.props.onSetCommandRunning(true);
            this.processList = [...this.state.selected].map(adapter => ({ adapter, version: this.props.repository[adapter]?.version }));

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

    updateAdapters(cb: () => void) {
        if (!this.processList || !this.processList.length || this.state.stopped) {
            cb && cb();
        } else {
            const { adapter, version } = this.processList.shift();

            this.updateAdapter(adapter, version, () => {
                const updated = [...this.state.updated];
                updated.push(adapter);
                this.setState({ updated }, () =>
                    setTimeout(() => this.updateAdapters(cb), 200));
            });
        }
    }

    render() {
        return <Dialog
            open={!0}
            maxWidth="lg"
            fullWidth={!!this.state.current}
            onClose={() => this.props.onClose(!!this.state.updated.length)}
            aria-labelledby="update-dialog-title"
            aria-describedby="update-dialog-description"
            classes={{ paper: this.props.classes.dialogRoot }}
            scroll="paper"
        >
            <DialogTitle id="update-dialog-title">
                <div className={this.props.classes.wrapperHead}>
                    {this.props.t('Update %s adapter(s)', this.state.selected.length)}
                    {!this.state.finished && !this.state.inProcess && <Tooltip title={this.props.t('Select/Unselect all')}>
                        <Checkbox
                            checked={this.state.selected.length === this.updateAvailable.length}
                            className={this.props.classes.checkbox}
                            tabIndex={-1}
                            indeterminate={this.state.selected.length !== this.updateAvailable.length && this.state.selected.length !== 0}
                            disableRipple
                            onClick={() => {
                                let selected: string[] = [];
                                if (this.state.selected.length !== this.updateAvailable.length) {
                                    selected = [...this.updateAvailable];
                                }
                                this.setState({ selected });
                            }}
                        />
                    </Tooltip>}
                    {I18n.getLanguage() !== 'en' && this.props.toggleTranslation ? <IconButton
                        size="large"
                        className={Utils.clsx(this.props.classes.languageButton, this.props.noTranslation && this.props.classes.languageButtonActive)}
                        onClick={() => this.props.toggleTranslation()}
                        title={I18n.t('Disable/Enable translation')}
                    >
                        <LanguageIcon />
                    </IconButton> : null}
                </div>
            </DialogTitle>
            <DialogContent classes={{ root: this.props.classes.content }} style={{ height: '100%' }}>
                <Grid container direction="row" className={this.props.classes.container}>
                    <Grid item style={{ height: '100%', overflow: 'hidden', width: this.state.current ? 250 : '100%' }}>
                        <div style={{ height: '100%', overflow: 'auto' }}>
                            <AdaptersUpdater
                                t={this.props.t}
                                finished={this.state.finished}
                                inProcess={this.state.inProcess}
                                selected={this.state.selected}
                                current={this.state.current}
                                stopped={this.state.stopped}
                                updated={this.state.updated}
                                lang={this.props.lang}
                                socket={this.props.socket}
                                installed={this.props.installed}
                                repository={this.props.repository}
                                noTranslation={this.props.noTranslation}
                                toggleTranslation={this.props.toggleTranslation}
                                onUpdateSelected={(selected: string[], updateAvailable: string[]) => {
                                    if (updateAvailable) {
                                        this.updateAvailable = updateAvailable;
                                    }
                                    this.setState({ selected });
                                }}
                            />
                        </div>
                    </Grid>
                    {!!this.state.current && <Grid
                        item
                        style={{
                            height: '100%',
                            overflow: 'hidden',
                            width: 'calc(100% - 260px)',
                            minWidth: 240,
                        }}
                    >
                        <Command
                            noSpacing
                            key={this.state.current}
                            ready
                            host={this.props.currentHost}
                            socket={this.props.socket}
                            t={this.props.t}
                            cmd={`upgrade ${this.state.current}@${this.state.currentVersion}${this.state.debug ? ' --debug' : ''}`}
                            onFinished={() => this.onAdapterFinished()}
                            errorFunc={() => {
                                if (this.state.stopOnError) {
                                    this.setState({ stopped: true, finished: true });
                                    this.onAdapterFinished = null;
                                    this.props.onSetCommandRunning(false);
                                } else {
                                    this.onAdapterFinished();
                                }
                            }}
                        />
                    </Grid>}
                </Grid>
                <Toolbar variant="dense" disableGutters className={this.props.classes.appBar}>
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished}
                            checked={this.state.stopOnError}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.stopOnError', this.state.stopOnError ? 'false' : 'true');
                                this.setState({ stopOnError: !this.state.stopOnError });
                            }}
                        />}
                        label={this.props.t('Stop on error')}
                    />
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished}
                            checked={this.state.closeOnFinished}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.closeOnFinished', this.state.closeOnFinished ? 'false' : 'true');
                                this.setState({ closeOnFinished: !this.state.closeOnFinished });
                            }}
                        />}
                        label={this.props.t('Close on finished')}
                    />
                    <FormControlLabel
                        control={<Checkbox
                            disabled={this.state.finished || this.state.inProcess}
                            checked={this.state.debug}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem('AdaptersUpdaterDialog.debug', this.state.debug ? 'false' : 'true');
                                this.setState({ debug: !this.state.debug });
                            }}
                        />}
                        label={this.props.t('Debug info')}
                    />
                </Toolbar>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={this.state.stopped || this.state.inProcess || this.state.finished || !this.state.selected.length}
                    onClick={() => this.onStartUpdate()}
                    color="primary"
                    autoFocus
                    startIcon={<CheckIcon />}
                >
                    {this.props.t('Update')}
                </Button>
                <Button
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
                    variant="contained"
                    onClick={() => this.props.onClose(!!this.state.updated.length)}
                    disabled={this.state.inProcess && !this.state.stopped}
                    color={(this.state.stopped ? 'error' : 'grey')}
                    startIcon={<CloseIcon />}
                >
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(AdaptersUpdaterDialog);
