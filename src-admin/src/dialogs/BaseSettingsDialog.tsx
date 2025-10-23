import React, { Component, type JSX } from 'react';

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
    Box,
} from '@mui/material';

import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

import {
    type AdminConnection,
    DialogConfirm,
    withWidth,
    type ThemeType,
    type IobTheme,
    type Translate,
} from '@iobroker/adapter-react-v5';

import BaseSettingsSystem, { type SystemSettings } from '../components/BaseSettings/BaseSettingsSystem';
import BaseSettingsMultihost, { type MultihostSettings } from '../components/BaseSettings/BaseSettingsMultihost';
import BaseSettingsObjects, { type SettingsObjects } from '../components/BaseSettings/BaseSettingsObjects';
import BaseSettingsStates, { type SettingsStates } from '../components/BaseSettings/BaseSettingsStates';
import BaseSettingsLog, { type SettingsLog } from '../components/BaseSettings/BaseSettingsLog';
import BaseSettingsPlugins, { type PluginsSettings } from '../components/BaseSettings/BaseSettingsPlugins';
import AdminUtils from '@/helpers/AdminUtils';

// icons

const styles: Record<string, any> = {
    content: {
        height: 500,
        overflow: 'hidden',
    },
    tabPanel: (theme: IobTheme) => ({
        width: '100%',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        overflow: 'auto',
    }),
    selected: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#FFF !important' : '#222 !important',
    }),
};

interface BaseSettingsDialogProps {
    t: Translate;
    currentHost: string;
    currentHostName: string;
    socket: AdminConnection;
    themeType: ThemeType;
    onClose: () => void;
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
    dnsResolution: 'verbatim' | 'ipv4first';
    dataDir: string;
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
            dnsResolution: 'ipv4first',
            dataDir: '',
            saving: false,
        };
    }

    async componentDidMount(): Promise<void> {
        await this.getSettings(this.state.currentHost);
    }

    renderDialogConfirm(): JSX.Element | null {
        if (this.state.confirmExit) {
            return (
                <DialogConfirm
                    text={this.props.t('Discard unsaved changes?')}
                    onClose={result => this.setState({ confirmExit: false }, () => result && this.props.onClose())}
                />
            );
        }
        return null;
    }

    renderRestartDialog(): JSX.Element | null {
        if (this.state.showRestart) {
            return (
                <DialogConfirm
                    title={this.props.t('Please confirm')}
                    text={
                        <>
                            <div>{this.props.t('Restart works only if controller started as system service.')}</div>
                            <div>
                                {this.props.t(
                                    'Would you like to restart the controller for your changes to take effect?',
                                )}
                            </div>
                        </>
                    }
                    ok={this.props.t('Restart')}
                    cancel={this.props.t('No restart')}
                    onClose={result =>
                        this.setState({ showRestart: false }, () => {
                            if (result) {
                                this.props.socket
                                    .restartController(this.props.currentHost)
                                    .then(() =>
                                        setTimeout(
                                            () =>
                                                // reload admin
                                                window.location.reload(),
                                            500,
                                        ),
                                    )
                                    .catch(e => window.alert(`Cannot restart: ${e}`));
                            }

                            this.props.onClose();
                        })
                    }
                />
            );
        }
        return null;
    }

    async getSettings(host: string): Promise<void> {
        const settings = await this.props.socket.readBaseSettings(host || this.state.currentHost);
        const answer = settings as { config?: ioBroker.IoBrokerJson; isActive?: boolean };

        if (answer?.config) {
            this.originalSettings = AdminUtils.clone(answer.config);
            this.setState({
                loading: false,
                system: answer.config.system,
                multihostService: answer.config.multihostService,
                objects: answer.config.objects,
                states: answer.config.states,
                log: answer.config.log,
                plugins: answer.config.plugins,
                dnsResolution: answer.config.dnsResolution || 'ipv4first',
                dataDir: answer.config.dataDir,
            });
        }
    }

    onSave(host?: string): void {
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
            this.props.socket
                .writeBaseSettings(host || this.state.currentHost, newSettings)
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

    updateSettings(name: keyof BaseSettingsDialogState, settings: any): void {
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

    renderSystem(): JSX.Element {
        const name = 'system';
        return (
            <BaseSettingsSystem
                settings={this.state[name]}
                t={this.props.t}
                currentHost={this.props.currentHost}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    renderMultihost(): JSX.Element {
        const name = 'multihostService';
        return (
            <BaseSettingsMultihost
                settings={this.state[name]}
                t={this.props.t}
                socket={this.props.socket}
                currentHost={this.props.currentHost}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    renderObjects(): JSX.Element {
        const name = 'objects';
        return (
            <BaseSettingsObjects
                settings={this.state[name]}
                t={this.props.t}
                socket={this.props.socket}
                currentHost={this.props.currentHost}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    renderStates(): JSX.Element {
        const name = 'states';
        return (
            <BaseSettingsStates
                settings={this.state[name]}
                t={this.props.t}
                socket={this.props.socket}
                currentHost={this.props.currentHost}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    renderLog(): JSX.Element {
        const name = 'log';
        return (
            <BaseSettingsLog
                settings={this.state[name]}
                t={this.props.t}
                socket={this.props.socket}
                currentHost={this.props.currentHost}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    renderPlugins(): JSX.Element {
        const name = 'plugins';
        return (
            <BaseSettingsPlugins
                settings={this.state[name]}
                t={this.props.t}
                themeType={this.props.themeType}
                onChange={(settings: any) => this.updateSettings(name, settings)}
            />
        );
    }

    render(): JSX.Element {
        return (
            <Dialog
                style={styles.dialog}
                open={!0}
                onClose={() => false}
                fullWidth
                maxWidth="xl"
                aria-labelledby="base-settings-dialog-title"
            >
                <DialogTitle id="base-settings-dialog-title">
                    {this.props.t('Host Base Settings')}: {this.props.currentHostName || this.props.currentHost}
                </DialogTitle>
                <DialogContent style={styles.content}>
                    <AppBar position="static">
                        <Tabs
                            value={this.state.currentTab}
                            onChange={(_event, newTab) => this.setState({ currentTab: newTab })}
                            aria-label="system tabs"
                            indicatorColor="secondary"
                        >
                            <Tab
                                label={this.props.t('System')}
                                id="system-tab"
                                aria-controls="simple-tabpanel-0"
                                sx={{ '&.Mui-selected': styles.selected }}
                            />
                            <Tab
                                label={this.props.t('Multi-host')}
                                id="multihost-tab"
                                sx={{ '&.Mui-selected': styles.selected }}
                                aria-controls="simple-tabpanel-1"
                            />
                            <Tab
                                label={this.props.t('Objects')}
                                id="objects-tab"
                                aria-controls="simple-tabpanel-3"
                                sx={{ '&.Mui-selected': styles.selected }}
                            />
                            <Tab
                                label={this.props.t('States')}
                                id="states-tab"
                                aria-controls="simple-tabpanel-4"
                                sx={{ '&.Mui-selected': styles.selected }}
                            />
                            <Tab
                                label={this.props.t('Log')}
                                id="log-tab"
                                aria-controls="simple-tabpanel-5"
                                sx={{ '&.Mui-selected': styles.selected }}
                            />
                            <Tab
                                label={this.props.t('Plugins')}
                                id="plugins-tab"
                                aria-controls="simple-tabpanel-6"
                                sx={{ '&.Mui-selected': styles.selected }}
                            />
                        </Tabs>
                    </AppBar>
                    {this.state.loading ? <LinearProgress /> : null}
                    {!this.state.loading && this.state.currentTab === 0 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderSystem()}
                        </Box>
                    ) : null}
                    {!this.state.loading && this.state.currentTab === 1 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderMultihost()}
                        </Box>
                    ) : null}
                    {!this.state.loading && this.state.currentTab === 2 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderObjects()}
                        </Box>
                    ) : null}
                    {!this.state.loading && this.state.currentTab === 3 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderStates()}
                        </Box>
                    ) : null}
                    {!this.state.loading && this.state.currentTab === 4 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderLog()}
                        </Box>
                    ) : null}
                    {!this.state.loading && this.state.currentTab === 5 ? (
                        <Box
                            component="div"
                            sx={styles.tabPanel}
                        >
                            {this.renderPlugins()}
                        </Box>
                    ) : null}
                    {this.renderDialogConfirm()}
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
                        onClick={() =>
                            this.state.hasChanges.length ? this.setState({ confirmExit: true }) : this.props.onClose()
                        }
                        startIcon={<CloseIcon />}
                    >
                        {this.state.hasChanges.length ? this.props.t('Cancel') : this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default withWidth()(BaseSettingsDialog);
