import React, { Component } from 'react';
import { type Styles, withStyles } from '@mui/styles';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    AppBar,
    Tab,
    Tabs,
    Button,
    LinearProgress,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import {
    type AdminConnection,
    Confirm as ConfirmDialog,
    withWidth,
    type ThemeType,
    type IobTheme, type Translate,
} from '@iobroker/adapter-react-v5';

import BaseSettingsSystem, { type SystemSettings } from '../components/BaseSettings/BaseSettingsSystem';
import BaseSettingsMultihost, { type MultihostSettings } from '../components/BaseSettings/BaseSettingsMultihost';
import BaseSettingsObjects, { type SettingsObjects } from '../components/BaseSettings/BaseSettingsObjects';
import BaseSettingsStates, { type SettingsStates } from '../components/BaseSettings/BaseSettingsStates';
import BaseSettingsLog, { type SettingsLog } from '../components/BaseSettings/BaseSettingsLog';
import BaseSettingsPlugins, { type PluginsSettings } from '../components/BaseSettings/BaseSettingsPlugins';

// icons

const styles: Styles<IobTheme, any> = theme => ({
    content: {
        height: 500,
        overflow: 'hidden',
    },
    tabPanel: {
        width: '100%',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        overflow: 'auto',
    },
    selected: {
        color: theme.palette.mode === 'dark' ? '#FFF !important' : '#222 !important',
    },
});

interface BaseSettingsDialogProps {
    t: Translate;
    currentHost: string;
    currentHostName: string;
    socket: AdminConnection;
    themeType: ThemeType;
    onClose: () => void;
    classes: Record<string, string>;
}

interface BaseSettingsDialogState {
    currentTab: number;
    hasChanges: string[];
    currentHost: string;
    loading: boolean;
    confirmExit: boolean;
    showRestart: boolean;
    system: SystemSettings;
    multihostService?: MultihostSettings;
    objects?: SettingsObjects;
    states: SettingsStates;
    log: SettingsLog;
    plugins: PluginsSettings;
    saving: boolean;
}

class BaseSettingsDialog extends Component<BaseSettingsDialogProps, BaseSettingsDialogState> {
    originalSettings: any;

    constructor(props: BaseSettingsDialogProps) {
        super(props);
        this.state = {
            currentTab: 0,
            hasChanges: [],
            currentHost: this.props.currentHost,
            loading: true,
            confirmExit: false,
            showRestart: false,

            system: null,
            multihostService: null,
            objects: null,
            states: null,
            log: null,
            plugins: null,
            saving: false,
        };
    }

    componentDidMount() {
        this.getSettings(this.state.currentHost);
    }

    renderConfirmDialog() {
        if (this.state.confirmExit) {
            return <ConfirmDialog
                text={this.props.t('Discard unsaved changes?')}
                onClose={result =>
                    this.setState({ confirmExit: false }, () =>
                        result && this.props.onClose())}
            />;
        }
        return null;
    }

    renderRestartDialog() {
        if (this.state.showRestart) {
            return <ConfirmDialog
                title={this.props.t('Please confirm')}
                text={<>
                    <div>{this.props.t('Restart works only if controller started as system service.')}</div>
                    <div>{this.props.t('Would you like to restart the controller for your changes to take effect?')}</div>
                </>}
                ok={this.props.t('Restart')}
                cancel={this.props.t('No restart')}
                onClose={result =>
                    this.setState({ showRestart: false }, () => {
                        if (result) {
                            this.props.socket.restartController(this.props.currentHost)
                                .then(() =>
                                    setTimeout(() =>  // reload admin
                                        window.location.reload(), 500))
                                .catch(e => window.alert(`Cannot restart: ${e}`));
                        }

                        this.props.onClose();
                    })}
            />;
        }
        return null;
    }

    getSettings(host: string) {
        this.props.socket.readBaseSettings(host || this.state.currentHost)
            .then((settings: any) => {
                if (settings && settings.config) {
                    delete settings.config.dataDirComment;
                    this.originalSettings = JSON.parse(JSON.stringify(settings.config));
                    settings.config.loading = false;
                    this.setState(settings.config);
                }
            });
    }

    onSave(host?: string) {
        const settings = {
            system: this.state.system,
            multihostService: this.state.multihostService,
            objects: this.state.objects,
            states: this.state.states,
            log: this.state.log,
            plugins: this.state.plugins,
        };

        // merge with some new settings, that may be not yet supported by Admin
        const newSettings = { ...this.originalSettings, ...settings };

        this.setState({ saving: true }, () => {
            this.props.socket.writeBaseSettings(host || this.state.currentHost, newSettings)
                .then(() => {
                    this.originalSettings = JSON.parse(JSON.stringify(settings));
                    // ask about restart
                    this.setState({ hasChanges: [], showRestart: true, saving: false });
                })
                .catch(error => {
                    window.alert(`Cannot save settings: ${error}`);
                    this.setState({ saving: false });
                });
        });
    }

    updateSettings(name: keyof BaseSettingsDialogState, settings: any) {
        const hasChanges = [...this.state.hasChanges];
        const changed = JSON.stringify(this.originalSettings[name]) !== JSON.stringify(settings);

        const pos = hasChanges.indexOf(name);
        if (changed && pos === -1) {
            hasChanges.push(name);
        } else if (!changed && pos !== -1) {
            hasChanges.splice(pos, 1);
        }

        this.setState({ [name]: settings, hasChanges } as any);
    }

    renderSystem() {
        const name = 'system';
        return <BaseSettingsSystem
            settings={this.state[name]}
            t={this.props.t}
            currentHost={this.props.currentHost}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    renderMultihost() {
        const name = 'multihostService';
        return <BaseSettingsMultihost
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    renderObjects() {
        const name = 'objects';
        return <BaseSettingsObjects
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    renderStates() {
        const name = 'states';
        return <BaseSettingsStates
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    renderLog() {
        const name = 'log';
        return <BaseSettingsLog
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    renderPlugins() {
        const name = 'plugins';
        return <BaseSettingsPlugins
            settings={this.state[name]}
            t={this.props.t}
            themeType={this.props.themeType}
            onChange={(settings: any) =>
                this.updateSettings(name, settings)}
        />;
    }

    render() {
        return <Dialog
            className={this.props.classes.dialog}
            open={!0}
            onClose={() => false}
            fullWidth
            maxWidth="xl"
            aria-labelledby="base-settings-dialog-title"
        >
            <DialogTitle id="base-settings-dialog-title">
                {this.props.t('Host Base Settings')}
:
                {' '}
                {this.props.currentHostName || this.props.currentHost}
            </DialogTitle>
            <DialogContent className={this.props.classes.content}>
                <AppBar position="static">
                    <Tabs
                        value={this.state.currentTab}
                        onChange={(event, newTab) => this.setState({ currentTab: newTab })}
                        aria-label="system tabs"
                        indicatorColor="secondary"
                    >
                        <Tab label={this.props.t('System')} id="system-tab" aria-controls="simple-tabpanel-0" classes={{ selected: this.props.classes.selected }} />
                        <Tab
                            label={this.props.t('Multi-host')}
                            id="multihost-tab"
                            classes={{ selected: this.props.classes.selected }}
                            aria-controls="simple-tabpanel-1"
                        />
                        <Tab label={this.props.t('Objects')} id="objects-tab" aria-controls="simple-tabpanel-3" classes={{ selected: this.props.classes.selected }} />
                        <Tab label={this.props.t('States')} id="states-tab" aria-controls="simple-tabpanel-4" classes={{ selected: this.props.classes.selected }} />
                        <Tab label={this.props.t('Log')} id="log-tab" aria-controls="simple-tabpanel-5" classes={{ selected: this.props.classes.selected }} />
                        <Tab label={this.props.t('Plugins')} id="plugins-tab" aria-controls="simple-tabpanel-6" classes={{ selected: this.props.classes.selected }} />
                    </Tabs>
                </AppBar>
                {this.state.loading ? <LinearProgress /> : null}
                {!this.state.loading && this.state.currentTab === 0 ?
                    <div className={this.props.classes.tabPanel}>{this.renderSystem()}</div> : null}
                {!this.state.loading && this.state.currentTab === 1 ?
                    <div className={this.props.classes.tabPanel}>{this.renderMultihost()}</div> : null}
                {!this.state.loading && this.state.currentTab === 2 ?
                    <div className={this.props.classes.tabPanel}>{this.renderObjects()}</div> : null}
                {!this.state.loading && this.state.currentTab === 3 ?
                    <div className={this.props.classes.tabPanel}>{this.renderStates()}</div> : null}
                {!this.state.loading && this.state.currentTab === 4 ?
                    <div className={this.props.classes.tabPanel}>{this.renderLog()}</div> : null}
                {!this.state.loading && this.state.currentTab === 5 ?
                    <div className={this.props.classes.tabPanel}>{this.renderPlugins()}</div> : null}
                {this.renderConfirmDialog()}
                {this.renderRestartDialog()}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={!this.state.hasChanges.length || this.state.saving}
                    onClick={() => this.onSave()}
                    color="primary"
                    startIcon={<CheckIcon />}
                >
                    {this.props.t('Save & Close')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    disabled={this.state.saving}
                    onClick={() => (this.state.hasChanges.length ? this.setState({ confirmExit: true }) : this.props.onClose())}
                    startIcon={<CloseIcon />}
                >
                    {this.state.hasChanges.length ? this.props.t('Cancel') : this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withWidth()(withStyles(styles)(BaseSettingsDialog));
