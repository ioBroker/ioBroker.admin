import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
import {
    Confirm as ConfirmDialog,
    withWidth,
} from '@iobroker/adapter-react-v5';

import MainSettingsDialog from './SystemSettingsTabs/MainSettingsDialog';
import RepositoriesDialog from './SystemSettingsTabs/RepositoriesDialog';
import LicensesDialog from './SystemSettingsTabs/LicensesDialog';
import CertificatesDialog from './SystemSettingsTabs/CertificatesDialog';
import SSLDialog from './SystemSettingsTabs/SSLDialog';
import ACLDialog from './SystemSettingsTabs/ACLDialog';
import StatisticsDialog from './SystemSettingsTabs/StatisticsDialog';

// icons

// style
import '../assets/css/style.css';

const SOME_PASSWORD = '__SOME_PASSWORD__';

const styles = theme => ({
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

class SystemSettingsDialog extends Component {
    constructor(props) {
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
        this.getSettings(this.state.currentHost);
    }

    componentDidMount() {
        this.props.socket.checkFeatureSupported('CONTROLLER_MULTI_REPO')
            .then(multipleRepos => this.props.socket.checkFeatureSupported('CONTROLLER_LICENSE_MANAGER')
                .then(licenseManager => this.props.socket.getCurrentInstance()
                    .then(namespace => this.props.socket.getObject(`system.adapter.${namespace}`))
                    .then(obj => this.setState({ host: obj.common.host, multipleRepos, licenseManager }))));
    }

    getSettings() {
        const newState = { loading: false };
        return this.props.socket.getObject('system.repositories')
            .then(systemRepositories => {
                systemRepositories = JSON.parse(JSON.stringify(systemRepositories));
                systemRepositories = systemRepositories || {};
                systemRepositories.native = systemRepositories.native || {};
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
            .then(systemConfig => {
                this.originalConfig = JSON.stringify(systemConfig || {});
                newState.systemConfig = systemConfig || {};
                systemConfig.common = systemConfig.common || {};
                systemConfig.native = systemConfig.native || {};

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
                };
                if (systemLicenses.native.password) {
                    systemLicenses.native.password = SOME_PASSWORD;
                }

                this.originalLicenses = JSON.stringify({ login: systemLicenses.native.login, password: systemLicenses.native.password });
                newState.systemLicenses = systemLicenses;
                this.setState(newState);
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
                systemConfig = systemConfig || {};
                if (JSON.stringify(systemConfig.common) !== JSON.stringify(this.state.systemConfig.common)) {
                    await this.props.socket.setSystemConfig(this.state.systemConfig);
                }
                await this.props.socket.setObject('system.certificates', this.state.systemCertificates);

                let systemRepositories = await this.props.socket.getObject('system.repositories');
                systemRepositories = systemRepositories || {};
                systemRepositories.native = systemRepositories.native || {};
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

                let systemLicenses = await this.props.socket.getObject('system.licenses');
                systemLicenses = systemLicenses || {};
                systemLicenses.type = systemLicenses.type || 'config';
                systemLicenses.name = systemLicenses.name || 'Licenses from iobroker.net';
                systemLicenses.common = systemLicenses.common || {};
                systemLicenses.native = systemLicenses.native || {};
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
                        LicensesDialog.requestLicensesByHost(this.props.socket, this.props.host, null, null, this.props.t);
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
                    window.location.reload(false);
                }
                this.setState({ saving: false });
            } catch (e) {
                window.alert(`Cannot save system configuration: ${e}`);
            }
        });
    }

    getTabs() {
        return [
            {
                id: 0,
                title: 'System settings',
                component: MainSettingsDialog,
                data: 'systemConfig',
                name: 'tabConfig',
                dataAux: 'systemRepositories',
                handle: null,
            },
            {
                id: 1,
                title: 'Repositories',
                component: RepositoriesDialog,
                data: 'systemRepositories',
                name: 'tabRepositories',
                dataAux: 'systemConfig',
                handle: null,
                socket: this.props.socket,
            },
            {
                id: 2,
                title: 'Licenses',
                component: LicensesDialog,
                data: 'systemLicenses',
                name: 'tabLicenses',
                dataAux: null,
                handle: null,
                socket: this.props.socket,
            },
            {
                id: 3,
                title: 'Certificates',
                component: CertificatesDialog,
                data: 'systemCertificates',
                name: 'tabCertificates',
                dataAux: {},
                handle: null,
            },
            {
                id: 4,
                title: 'Let\'s encrypt SSL',
                component: SSLDialog,
                data: 'systemCertificates',
                name: 'tabLetsEncrypt',
                dataAux: {},
                handle: null,
            },
            {
                id: 5,
                title: 'Default ACL',
                component: ACLDialog,
                data: 'systemConfig',
                name: 'tabDefaultACL',
                dataAux: {},
                handle: null,
            },
            {
                id: 6,
                title: 'Statistics',
                component: StatisticsDialog,
                data: 'systemConfig',
                dataAux: 'diagData',
                name: 'tabStatistics',
                handle: type => this.onChangeDiagType(type),
            },
        ];
    }

    onChangeDiagType = type => {
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

    getDialogContent(tabsList) {
        if (this.state.loading) {
            return <LinearProgress />;
        }

        const tab = tabsList.find(t => t.name === this.props.currentTab.id) || tabsList[0];

        const MyComponent = tab.component;
        const { groups, users, histories } = this.state;
        return <div className={this.props.classes.tabPanel}>
            <MyComponent
                adminGuiConfig={this.props.adminGuiConfig}
                onChange={(data, dataAux, cb) => this.onChangedTab(tab.data, data, tab.dataAux, dataAux, cb)}
                data={this.state[tab.data]}
                dataAux={this.state[tab.dataAux]}
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

    static onTabChanged = (event, newTab) => {
        Router.doNavigate(null, 'system', newTab);
    };

    onChangedTab(id, data, idAux, dataAux, cb) {
        if (data || dataAux) {
            const state = { ...this.state };
            if (data) {
                state[id] = data;
            }
            if (dataAux) {
                state[idAux] = dataAux;
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
                            onChange={(event, newTab) => SystemSettingsDialog.onTabChanged(event, newTab)}
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

SystemSettingsDialog.propTypes = {
    t: PropTypes.func,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    currentTab: PropTypes.object,
    width: PropTypes.string,
    adminGuiConfig: PropTypes.object,
};

export default withWidth()(withStyles(styles)(SystemSettingsDialog));

function TabPanel(props) {
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
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};
