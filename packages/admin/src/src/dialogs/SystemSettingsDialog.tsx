import type { Styles } from '@mui/styles';
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';

import {
    Dialog,
    DialogActions,
    DialogContent,
    AppBar,
    Tab,
    Tabs,
    Box,
    Typography,
    Button,
    LinearProgress,
    IconButton,
} from '@mui/material';

import {
    Check as CheckIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import Router from '@iobroker/adapter-react-v5/Components/Router';
import type { AdminConnection } from '@iobroker/adapter-react-v5';
import {
    Confirm as ConfirmDialog,
    withWidth,
} from '@iobroker/adapter-react-v5';

import type { Theme, Translator } from '@iobroker/adapter-react-v5/types';
import type { AdminGuiConfig } from '@/types';
import Utils from '@/Utils';
import MainSettingsDialog from './SystemSettingsTabs/MainSettingsDialog';
import RepositoriesDialog from './SystemSettingsTabs/RepositoriesDialog';
import LicensesDialog, { requestLicensesByHost } from './SystemSettingsTabs/LicensesDialog';
import CertificatesDialog from './SystemSettingsTabs/CertificatesDialog';
import SSLDialog from './SystemSettingsTabs/SSLDialog';
import ACLDialog from './SystemSettingsTabs/ACLDialog';
import StatisticsDialog from './SystemSettingsTabs/StatisticsDialog';

// icons

// style
import '../assets/css/style.css';
import type BaseSystemSettingsDialog from './SystemSettingsTabs/BaseSystemSettingsDialog';

const SOME_PASSWORD = '__SOME_PASSWORD__';

const styles: Styles<Theme, any> = theme => ({
    tabPanel: {
        width: '100%',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        overflow: 'hidden',
    },
    tab: {
        // backgroundColor:'#FFF',
        // color:lightBlue[500]
    },
    dialogTitle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 0 20px',
    },
    dialog: {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
    },
    content: {
        padding: '0 !important',
    },
    selected: {
        color: theme.palette.mode === 'dark' ? '#FFF !important' : '#222 !important',
    },
});

type SystemConfigObjectCustom = ioBroker.SystemConfigObject & {
    common: {
        firstDayOfWeek: string;
        expertMode: boolean;
    };
}

type SystemLicenseObject = ioBroker.Object & {
    name: string;
}

type AdapterObjectCustom = ioBroker.AdapterObject & {
    common: {
        host: string;
    };
}

interface SystemSettingsDialogProps {
    t: Translator;
    socket: AdminConnection;
    themeName: string;
    themeType: string;
    onClose: (repoChanged?: boolean) => void;
    currentTab: { id: string };
    width: string;
    adminGuiConfig: AdminGuiConfig;
    expertModeFunc: (val: boolean) => void;
    classes: Record<string, string>;
    currentHost: string;
    host: string;
}

interface SystemSettingsDialogState {
    loading: boolean;
    confirmExit: boolean;
    systemConfig: SystemConfigObjectCustom;
    systemCertificates: ioBroker.Object;
    systemRepositories: ioBroker.Object;
    systemLicenses: ioBroker.Object;
    multipleRepos: boolean;
    licenseManager: boolean;
    host: string;
    repoInfo: Record<string, ioBroker.RepoInfo>;
    users?: ioBroker.UserObject[];
    groups?: ioBroker.GroupObject[];
    histories?: string[];
    diagData?: any;
    saving?: boolean;
}

interface SystemSettingsDialogTab {
    id: number;
    title: string;
    component: typeof BaseSystemSettingsDialog;
    data: string;
    name: string;
    dataAux: string;
    handle?: (type: 'none' | 'extended' | 'no-city') => void;
    socket?: AdminConnection;
}

class SystemSettingsDialog extends Component<SystemSettingsDialogProps, SystemSettingsDialogState> {
    originalCertificates: string;

    originalConfig: string;

    originalRepositories: string;

    originalLicenses: string;

    constructor(props: SystemSettingsDialogProps) {
        super(props);
        this.state = {
            loading: true,
            confirmExit: false,
            systemConfig: null,
            systemCertificates: null,
            systemRepositories: null,
            systemLicenses: null,
            multipleRepos: false,
            licenseManager: false,
            host: '',
            repoInfo: {},
        };
        this.getSettings(/* this.state.currentHost */);
    }

    componentDidMount() {
        this.props.socket.checkFeatureSupported('CONTROLLER_MULTI_REPO')
            .then(multipleRepos => this.props.socket.checkFeatureSupported('CONTROLLER_LICENSE_MANAGER')
                .then(licenseManager => this.props.socket.getCurrentInstance()
                    .then(namespace => this.props.socket.getObject(`system.adapter.${namespace}`))
                    .then(obj => this.setState({ host: (obj as AdapterObjectCustom).common.host, multipleRepos, licenseManager }))));
    }

    getSettings() {
        const newState: Partial<SystemSettingsDialogState> = { loading: false };
        return this.props.socket.getObject('system.repositories')
            .then(systemRepositories => {
                systemRepositories = Utils.clone(systemRepositories);
                systemRepositories = (systemRepositories || {}) as ioBroker.RepositoryObject;
                systemRepositories.native = (systemRepositories.native || {}) as ioBroker.RepositoryObject['native'];
                systemRepositories.native.repositories = systemRepositories.native.repositories || {};
                newState.repoInfo = {};

                Object.keys(systemRepositories.native.repositories).forEach(repo => {
                    if (systemRepositories.native.repositories[repo]) {
                        if (systemRepositories.native.repositories[repo].json) {
                            newState.repoInfo[repo] = systemRepositories.native.repositories[repo].json._repoInfo;
                            delete systemRepositories.native.repositories[repo].json;
                        }
                        if (systemRepositories.native.repositories[repo].hash) {
                            delete systemRepositories.native.repositories[repo].hash;
                        }
                        if (systemRepositories.native.repositories[repo].time) {
                            delete systemRepositories.native.repositories[repo].time;
                        }
                    }
                });

                this.originalRepositories = JSON.stringify(systemRepositories);
                newState.systemRepositories = systemRepositories;
                return this.props.socket.getSystemConfig(true);
            })
            .then((systemConfig: SystemConfigObjectCustom) => {
                this.originalConfig = JSON.stringify(systemConfig || {});
                newState.systemConfig = systemConfig || {} as SystemConfigObjectCustom;
                systemConfig.common = systemConfig.common || {} as SystemConfigObjectCustom['common'];
                systemConfig.native = systemConfig.native || {} as SystemConfigObjectCustom['native'];

                systemConfig.common.defaultNewAcl = systemConfig.common.defaultNewAcl || {
                    object: 1636,
                    state: 1636,
                    file: 1632,
                    owner: 'system.user.admin',
                    ownerGroup: 'system.group.administrator',
                };

                systemConfig.common.firstDayOfWeek = systemConfig.common.firstDayOfWeek || 'monday';

                return this.props.socket.getDiagData(this.props.currentHost, systemConfig.common.diag);
            })
            /**/
            .then(diagData => {
                newState.diagData = diagData;
                return this.props.socket.getUsers();
            })
            .then(users => {
                newState.users = users;
                return this.props.socket.getGroups();
            })
            .then(groups => {
                newState.groups = groups;
                return this.props.socket.getAdapterInstances(true);
            })
            .then(instances => {
                newState.histories = Object.values(instances)
                    .filter(instance => instance.common.getHistory)
                    .map(instance => {
                        const id = instance._id.split('.');
                        return `${id[id.length - 2]}.${id[id.length - 1]}`;
                    });

                return this.props.socket.getObject('system.certificates');
            })
            .then(systemCertificates => {
                this.originalCertificates = JSON.stringify(systemCertificates);
                newState.systemCertificates = systemCertificates;
                return this.props.socket.getObject('system.licenses');
            })
            .then(systemLicenses => {
                systemLicenses = systemLicenses || {
                    common: {
                        name: 'Licenses from iobroker.net',
                    },
                    native: {
                        login: '',
                        password: '',
                        licenses: [],
                    },
                    type: 'config',
                } as unknown as ioBroker.Object;
                if (systemLicenses.native.password) {
                    systemLicenses.native.password = SOME_PASSWORD;
                }

                this.originalLicenses = JSON.stringify({ login: systemLicenses.native.login, password: systemLicenses.native.password });
                newState.systemLicenses = systemLicenses;
                this.setState(newState as SystemSettingsDialogState);
            })
            .catch(e => window.alert(`Cannot read settings: ${e}`));
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

    onSave() {
        let repoChanged = false;
        this.setState({ saving: true }, async () => {
            try {
                let systemConfig = await this.props.socket.getSystemConfig(true);
                systemConfig = systemConfig || {} as ioBroker.SystemConfigObject;
                if (JSON.stringify(systemConfig.common) !== JSON.stringify(this.state.systemConfig.common)) {
                    await this.props.socket.setSystemConfig(this.state.systemConfig);
                }
                await this.props.socket.setObject('system.certificates', this.state.systemCertificates);

                let systemRepositories = await this.props.socket.getObject('system.repositories');
                systemRepositories = systemRepositories || {} as ioBroker.RepositoryObject;
                systemRepositories.native = systemRepositories.native || {} as ioBroker.RepositoryObject['native'];
                systemRepositories.native.repositories = systemRepositories.native.repositories || {};
                const newRepo = JSON.parse(JSON.stringify(this.state.systemRepositories.native.repositories));

                // merge new and existing info
                Object.keys(newRepo).forEach(repo => {
                    if (systemRepositories.native.repositories[repo]) {
                        if (systemRepositories.native.repositories[repo].json) {
                            newRepo[repo].json = systemRepositories.native.repositories[repo].json;
                        }
                        if (systemRepositories.native.repositories[repo].hash) {
                            newRepo[repo].hash = systemRepositories.native.repositories[repo].hash;
                        }
                        if (systemRepositories.native.repositories[repo].time) {
                            newRepo[repo].time = systemRepositories.native.repositories[repo].time;
                        }
                    }
                });
                if (JSON.stringify(this.state.systemRepositories.native.repositories) !== JSON.stringify(newRepo)) {
                    systemRepositories.native.repositories = newRepo;
                    repoChanged = true;
                    await this.props.socket.setObject('system.repositories', systemRepositories);
                }

                let systemLicenses = await this.props.socket.getObject('system.licenses') as SystemLicenseObject;
                systemLicenses = systemLicenses || {} as SystemLicenseObject;
                systemLicenses.type = systemLicenses.type || 'config';
                systemLicenses.name = systemLicenses.name || 'Licenses from iobroker.net';
                systemLicenses.common = systemLicenses.common || {} as SystemLicenseObject['common'];
                systemLicenses.native = systemLicenses.native || {} as SystemLicenseObject['native'];
                systemLicenses.native.licenses = systemLicenses.native.licenses || [];
                systemLicenses.native.password = systemLicenses.native.password || '';
                systemLicenses.native.login = systemLicenses.native.login || '';

                const currentPassword = systemLicenses.native.password ? SOME_PASSWORD : '';

                if (this.state.systemLicenses.native.password !== currentPassword ||
                    systemLicenses.native.login !== this.state.systemLicenses.native.login
                ) {
                    systemLicenses.native.login = this.state.systemLicenses.native.login;

                    if (this.state.systemLicenses.native.password !== SOME_PASSWORD && this.state.systemLicenses.native.password) {
                        // encode it
                        try {
                            systemLicenses.native.password = await this.props.socket.encrypt(this.state.systemLicenses.native.password);
                        } catch (error) {
                            window.alert(this.props.t('Cannot update licenses: %s', error));
                        }
                    } else if (!this.state.systemLicenses.native.password) {
                        systemLicenses.native.password = '';
                    }
                    try {
                        await this.props.socket.setObject('system.licenses', systemLicenses);
                        requestLicensesByHost(this.props.socket, this.props.host, null, null, this.props.t);
                    } catch (error) {
                        window.alert(this.props.t('Cannot update licenses: %s', error));
                    }
                }

                // this.getSettings();
                alert(this.props.t('Settings saved'));
                this.props.onClose(repoChanged);
                if (this.state.systemConfig.common.expertMode !== JSON.parse(this.originalConfig).common.expertMode) {
                    this.props.expertModeFunc(this.state.systemConfig.common.expertMode);
                }
                if (this.state.systemConfig.common.language !== JSON.parse(this.originalConfig).common.language ||
                    JSON.stringify(this.state.systemConfig.common.activeRepo) !== JSON.stringify(JSON.parse(this.originalConfig).common.activeRepo)) {
                    window.location.reload();
                }
                this.setState({ saving: false });
            } catch (e) {
                window.alert(`Cannot save system configuration: ${e}`);
            }
        });
    }

    getTabs(): SystemSettingsDialogTab[] {
        return [
            {
                id: 0,
                title: 'System settings',
                component: MainSettingsDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemConfig',
                name: 'tabConfig',
                dataAux: 'systemRepositories',
                handle: null,
            },
            {
                id: 1,
                title: 'Repositories',
                component: RepositoriesDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemRepositories',
                name: 'tabRepositories',
                dataAux: 'systemConfig',
                handle: null,
                socket: this.props.socket,
            },
            {
                id: 2,
                title: 'Licenses',
                component: LicensesDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemLicenses',
                name: 'tabLicenses',
                dataAux: null,
                handle: null,
                socket: this.props.socket,
            },
            {
                id: 3,
                title: 'Certificates',
                component: CertificatesDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemCertificates',
                name: 'tabCertificates',
                dataAux: null,
                handle: null,
            },
            {
                id: 4,
                title: 'Let\'s encrypt SSL',
                component: SSLDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemCertificates',
                name: 'tabLetsEncrypt',
                dataAux: null,
                handle: null,
            },
            {
                id: 5,
                title: 'Default ACL',
                component: ACLDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemConfig',
                name: 'tabDefaultACL',
                dataAux: null,
                handle: null,
            },
            {
                id: 6,
                title: 'Statistics',
                component: StatisticsDialog as unknown as typeof BaseSystemSettingsDialog,
                data: 'systemConfig',
                dataAux: 'diagData',
                name: 'tabStatistics',
                handle: type => this.onChangeDiagType(type),
            },
        ];
    }

    onChangeDiagType = (type: 'none' | 'extended' | 'no-city') => {
        this.props.socket.getDiagData(this.props.currentHost, type)
            .then(diagData =>
                this.setState({
                    diagData,
                    systemConfig: {
                        ...this.state.systemConfig,
                        common: {
                            ...this.state.systemConfig.common,
                            diag: type,
                        },
                    },
                }));
    };

    getDialogContent(tabsList: SystemSettingsDialogTab[]) {
        if (this.state.loading) {
            return <LinearProgress />;
        }

        const tab = tabsList.find(t => t.name === this.props.currentTab.id) || tabsList[0];

        const MyComponent = tab.component;
        const { groups, users, histories } = this.state;
        return <div className={this.props.classes.tabPanel}>
            <MyComponent
                adminGuiConfig={this.props.adminGuiConfig}
                onChange={(data: any, dataAux: any, cb: () => void) => this.onChangedTab(tab.data, data, tab.dataAux, dataAux, cb)}
                data={this.state[tab.data as keyof SystemSettingsDialogState]}
                dataAux={this.state[tab.dataAux as keyof SystemSettingsDialogState]}
                handle={tab.handle}
                users={users}
                groups={groups}
                multipleRepos={this.state.multipleRepos}
                activeRepo={this.state.systemConfig.common.activeRepo}
                repoInfo={this.state.repoInfo}
                histories={histories}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                host={this.state.host}
                t={this.props.t}
                socket={this.props.socket}
                saving={this.state.saving}
            />
        </div>;
    }

    static onTabChanged = (newTab: string) => {
        Router.doNavigate(null, 'system', newTab);
    };

    onChangedTab(id: any, data: any, idAux: any, dataAux: any, cb: () => void) {
        if (data || dataAux) {
            const state: SystemSettingsDialogState = { ...this.state };
            if (data) {
                (state as any)[id] = data;
            }
            if (dataAux) {
                (state as any)[idAux] = dataAux;
            }
            this.setState(state, () => cb && cb());
        }
    }

    render() {
        const changed = !(JSON.stringify(this.state.systemRepositories) === this.originalRepositories &&
            JSON.stringify(this.state.systemConfig) === this.originalConfig &&
            JSON.stringify(this.state.systemCertificates) === this.originalCertificates &&
            JSON.stringify({ login: this.state.systemLicenses.native.login, password: this.state.systemLicenses.native.password }) === this.originalLicenses);

        const tabsList = this.getTabs().filter(tab => {
            if (!this.state.licenseManager && tab.name === 'tabLicenses') {
                return false;
            }
            return this.props.adminGuiConfig.admin.settings[tab.name] !== false;
        });

        const tabs = tabsList
            .map(tab => <Tab
                key={tab.title}
                label={this.props.t(tab.title)}
                value={tab.name}
                classes={{ selected: this.props.classes.selected }}
            />);

        return <Dialog
            className={this.props.classes.dialog}
            classes={{
                root: this.props.classes.dialog,
                paper: 'dialog-setting',
            }}
            open={!0}
            onClose={(e, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    if (changed) {
                        this.setState({ confirmExit: true });
                    } else {
                        this.props.onClose();
                    }
                }
            }}
            fullWidth={false}
            fullScreen={false}
            aria-labelledby="system-settings-dialog-title"
        >
            <DialogContent className={this.props.classes.content}>
                <AppBar position="static" color="default">
                    <div className={this.props.classes.dialogTitle}>
                        {this.props.width !== 'xs' && this.props.width !== 'sm' && <Typography className="dialogName">
                            {this.props.t('Base settings')}
                        </Typography>}
                        <Tabs
                            className={this.props.classes.tab}
                            indicatorColor="secondary"
                            value={this.props.currentTab.id || 'tabConfig'}
                            onChange={(event, newTab: string) => SystemSettingsDialog.onTabChanged(newTab)}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {tabs}
                        </Tabs>
                        <IconButton
                            size="large"
                            disabled={this.state.saving}
                            edge="start"
                            color="inherit"
                            onClick={() => (changed ? this.setState({ confirmExit: true }) : this.props.onClose())}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                </AppBar>
                {this.getDialogContent(tabsList)}
                {this.renderConfirmDialog()}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={!changed || this.state.saving}
                    onClick={() => this.onSave()}
                    color="primary"
                    startIcon={<CheckIcon />}
                >
                    {this.props.t('Save & Close')}
                </Button>
                <Button
                    variant="contained"
                    disabled={this.state.saving}
                    onClick={() => (changed ? this.setState({ confirmExit: true }) : this.props.onClose())}
                    startIcon={<CloseIcon />}
                    color="grey"
                >
                    {changed ? this.props.t('Cancel') : this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withWidth()(withStyles(styles)(SystemSettingsDialog));

interface TabPanelProps {
    children: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props: TabPanelProps) => {
    const {
        children, value, index, ...other
    } = props;

    return <div
        role="tabpanel"
        hidden={value !== index}
        id={`nav-tabpanel-${index}`}
        aria-labelledby={`nav-tab-${index}`}
        {...other}
    >
        {value === index && <Box p={3}>
            <Typography>{children}</Typography>
        </Box>}
    </div>;
};
