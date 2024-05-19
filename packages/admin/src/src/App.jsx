import React, { Suspense } from 'react';
import { withStyles, StylesProvider, createGenerateClassName } from '@mui/styles';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// @mui/material
import {
    AppBar,
    Avatar,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Toolbar,
    Typography,
    Hidden,
    Tooltip,
    Badge,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Dialog,
    DialogTitle,
    Button,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

// @material-ui/icons
import {
    Menu as MenuIcon,
    Build as BuildIcon,
    Update as UpdateIcon,
    Visibility as VisibilityIcon,
    PictureInPictureAlt as PictureInPictureAltIcon,
    Person as UserIcon,
    CloudSync as SyncIcon,
    SyncDisabled as SyncIconDisabled,
    Close as CancelIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';

import { AdminConnection as Connection, PROGRESS } from '@iobroker/socket-client';
import {
    LoaderPT,
    LoaderMV,
    LoaderVendor,
    Loader,
    I18n, Router, Confirm as ConfirmDialog,
    Icon, withWidth, Theme,
    IconExpert,
    ToggleThemeMenu,
} from '@iobroker/adapter-react-v5';
import NotificationsDialog from '@/dialogs/NotificationsDialog';
import Utils from './components/Utils'; // adapter-react-v5/Components/Utils';

import CommandDialog from './dialogs/CommandDialog';
import Drawer, {
    STATES as DrawerStates,
    DRAWER_FULL_WIDTH,
    DRAWER_COMPACT_WIDTH,
    DRAWER_EDIT_WIDTH,
} from './components/Drawer';

import Connecting from './components/Connecting';

import WizardDialog from './dialogs/WizardDialog';
import SystemSettingsDialog from './dialogs/SystemSettingsDialog';
import Login from './login/Login';
import HostSelectors from './components/HostSelectors';
import ExpertModeDialog from './dialogs/ExpertModeDialog';
import NewsAdminDialog, { checkMessages } from './dialogs/NewsAdminDialog';
import HostWarningDialog from './dialogs/HostWarningDialog';
import LogsWorker from './Workers/LogsWorker';
import InstancesWorker from './Workers/InstancesWorker';
import HostsWorker from './Workers/HostsWorker';
import AdaptersWorker from './Workers/AdaptersWorker';
import ObjectsWorker from './Workers/ObjectsWorker';
import DiscoveryDialog from './dialogs/DiscoveryDialog';
import SlowConnectionWarningDialog from './dialogs/SlowConnectionWarningDialog';
import IsVisible from './components/IsVisible';

// Tabs
const Adapters = React.lazy(() => import('./tabs/Adapters'));
const Instances = React.lazy(() => import('./tabs/Instances'));
const Intro = React.lazy(() => import('./tabs/Intro'));
const Logs = React.lazy(() => import('./tabs/Logs'));
const Files = React.lazy(() => import('./tabs/Files'));
const Objects = React.lazy(() => import('./tabs/Objects'));
const Users = React.lazy(() => import('./tabs/Users'));
const Enums = React.lazy(() => import('./tabs/Enums'));
const CustomTab = React.lazy(() => import('./tabs/CustomTab'));
const Hosts = React.lazy(() => import('./tabs/Hosts'));
const EasyMode = React.lazy(() => import('./tabs/EasyMode'));

const query = {};
(window.location.search || '')
    .replace(/^\?/, '')
    .split('&')
    .forEach(attr => {
        const parts = attr.split('=');
        if (!parts[0]) {
            return;
        }
        query[parts[0]] = parts[1] === undefined ? true : decodeURIComponent(parts[1]);
    });

const generateClassName = createGenerateClassName({
    productionPrefix: 'iob',
});

const styles = theme => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    appBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    logoWhite: {
        background: '#FFFFFF',
    },
    appBarShift: {
        width: `calc(100% - ${DRAWER_FULL_WIDTH}px)`,
        marginLeft: DRAWER_FULL_WIDTH,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    appBarShiftEdit: {
        width: `calc(100% - ${DRAWER_EDIT_WIDTH}px)`,
        marginLeft: DRAWER_EDIT_WIDTH,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    appBarShiftCompact: {
        width: `calc(100% - ${DRAWER_COMPACT_WIDTH}px)`,
        marginLeft: DRAWER_COMPACT_WIDTH,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none',
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(1),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowY: 'auto',
        marginTop: theme.mixins.toolbar?.minHeight,
        '@media (min-width:0px) and (orientation: landscape)': {
            marginTop: theme.mixins.toolbar['@media (min-width:0px) and (orientation: landscape)']?.minHeight,
        },
        '@media (min-width:600px)': {
            marginTop: theme.mixins.toolbar['@media (min-width:600px)']?.minHeight,
        },
    },
    contentMargin: {
        marginLeft: -DRAWER_FULL_WIDTH,
    },
    contentMarginEdit: {
        marginLeft: -DRAWER_EDIT_WIDTH,
    },
    contentMarginCompact: {
        marginLeft: -DRAWER_COMPACT_WIDTH,
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    },
    expertIcon: {
        width: 22,
        height: 22,
        // color: theme.palette.text ? theme.palette.text.disabled : 'grey'
    },
    expertIconActive: {
        // color: theme.palette.action.active
    },
    baseSettingsButton: {
        color: 'red',
    },
    alert_info: {},
    alert_error: {
        backgroundColor: '#f44336',
    },
    alert_success: {
        backgroundColor: '#4caf50',
    },
    avatarNotVisible: {
        opacity: 0,
        marginLeft: 5,
        transition: 'opacity 0.3s',
        width: 'initial',
    },
    avatarVisible: {
        opacity: 1,
    },
    cmd: {
        animation: '1s linear infinite alternate $myEffect',
        opacity: 0.2,
    },
    '@keyframes myEffect': {
        '0%': {
            opacity: 0.2,
            transform: 'translateY(0)',
        },
        '100%': {
            opacity: 1,
            transform: 'translateY(-10%)',
        },
    },
    errorCmd: {
        color: '#a90000',
        animation: '0.2s linear infinite alternate $myEffect2',
    },
    performed: {
        color: theme.palette.mode === 'light' ? '#3bfd44' : '#388e3c',
        animation: '0.2s linear infinite alternate $myEffect2',
    },
    wrapperButtons: {
        display: 'flex',
        marginRight: 'auto',
        overflowY: 'auto',
    },
    '@keyframes myEffect2': {
        '0%': {
            opacity: 1,
            transform: 'translateX(0)',
        },
        '100%': {
            opacity: 0.7,
            transform: 'translateX(-2%)',
        },
    },

    flexGrow: {
        flexGrow: 2,
    },
    userBadge: {
        lineHeight: '48px',
        display: 'inline-block',
    },
    userIcon: {
        borderRadius: 4,
        width: 44,
        height: 44,
        verticalAlign: 'middle',
        marginLeft: 10,
        marginRight: 10,
    },
    userText: {
        verticalAlign: 'middle',
        fontSize: 16,
        maxWidth: 250,
        marginRight: 10,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    userBackground: {
        borderRadius: 4,
        backgroundColor: theme.palette.mode === 'dark' ? '#EEE' : '#222',
        padding: 3,
    },
    styleVersion: {
        fontSize: 10,
    },
    wrapperName: {
        display: 'flex',
        flexDirection: 'column',
        marginRight: 10,
    },
    expertBadge: {
        marginTop: 11,
        marginRight: 11,
    },
    siteName: {
        lineHeight: '48px',
        fontSize: 24,
        marginLeft: 10,
        marginRight: 10,
        display: 'inline-block',
        verticalAlign: 'middle',
    },
});

const DEFAULT_GUI_SETTINGS_OBJECT = {
    type: 'state',
    common: {
        type: 'boolean',
        read: true,
        write: false,
        role: 'state',
    },
    native: {},
};

class App extends Router {
    constructor(props) {
        super(props);

        try {
            window.alert = message => {
                if (message && message.toString().toLowerCase().includes('error')) {
                    console.error(message);
                    this.showAlert(message.toString(), 'error');
                } else {
                    console.log(message);
                    this.showAlert(message.toString(), 'info');
                }
            };
        } catch (e) {
            // ignore. FF could not redefine alert
        }

        // init translations
        this.translations = {
            en: require('@iobroker/adapter-react-v5/i18n/en'),
            de: require('@iobroker/adapter-react-v5/i18n/de'),
            ru: require('@iobroker/adapter-react-v5/i18n/ru'),
            pt: require('@iobroker/adapter-react-v5/i18n/pt'),
            nl: require('@iobroker/adapter-react-v5/i18n/nl'),
            fr: require('@iobroker/adapter-react-v5/i18n/fr'),
            it: require('@iobroker/adapter-react-v5/i18n/it'),
            es: require('@iobroker/adapter-react-v5/i18n/es'),
            pl: require('@iobroker/adapter-react-v5/i18n/pl'),
            uk: require('@iobroker/adapter-react-v5/i18n/uk'),
            'zh-cn': require('@iobroker/adapter-react-v5/i18n/zh-cn'),
        };

        const translations = {
            en: require('./i18n/en'),
            de: require('./i18n/de'),
            ru: require('./i18n/ru'),
            pt: require('./i18n/pt'),
            nl: require('./i18n/nl'),
            fr: require('./i18n/fr'),
            it: require('./i18n/it'),
            es: require('./i18n/es'),
            pl: require('./i18n/pl'),
            uk: require('./i18n/uk'),
            'zh-cn': require('./i18n/zh-cn'),
        };
        // merge together
        Object.keys(translations).forEach(
            lang => (this.translations[lang] = Object.assign(this.translations[lang], translations[lang])),
        );

        // init translations
        I18n.setTranslations(this.translations);
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());

        /** Seconds before logout to show warning */
        this.EXPIRE_WARNING_THRESHOLD = 120;
        this.refConfigIframe = null;
        this.refUser = React.createRef();
        this.refUserDiv = React.createRef();
        this.expireInSec = null;
        this.expireInSecInterval = null;
        this.expireText = I18n.t('Session expire in %s', '%s');
        this.adminGuiConfig = {
            admin: {
                menu: {},
                settings: {},
                adapters: {},
                login: {},
            },
        };

        const vendorPrefix = window.vendorPrefix;
        this.toggleThemePossible = !vendorPrefix || vendorPrefix === '@@vendorPrefix@@' || vendorPrefix === 'MV';

        if (!query.login) {
            let drawerState = (window._localStorage || window.localStorage).getItem('App.drawerState');
            if (drawerState) {
                drawerState = parseInt(drawerState, 10);
            } else {
                drawerState = this.props.width === 'xs' ? DrawerStates.closed : DrawerStates.opened;
            }

            const theme = App.createTheme();

            // install setter for configNotSaved (used in javascript)
            Object.defineProperty(window, 'configNotSaved', {
                get: () => this.state.configNotSaved,
                set: configNotSaved => {
                    const allStored = !configNotSaved;
                    if (allStored !== this.state.allStored) {
                        this.setState({ allStored });
                    }
                },
                configurable: true,
            });

            this.state = {
                connected: false,
                progress: 0,
                ready: false,
                lang: 'en',

                // Finished
                protocol: App.getProtocol(),
                hostname: window.location.hostname,
                port: App.getPort(),
                //---------

                allTabs: null,

                expertMode: false,

                states: {},
                hosts: [],
                currentHost: '',
                currentHostName: '',
                ownHost: '',
                currentTab: Router.getLocation(),
                currentDialog: null,
                currentUser: '',
                subscribesStates: {},
                subscribesObjects: {},
                subscribesLogs: 0,
                systemConfig: null,
                user: null, // Logged in user

                repository: {},
                installed: {},

                objects: {},

                waitForRestart: false,
                tabs: null,
                config: {},

                stateChanged: false,

                theme,
                themeName: App.getThemeName(theme),
                themeType: App.getThemeType(theme),

                alert: false,
                alertType: 'info',
                alertMessage: '',
                drawerState,
                editMenuList: false,

                tab: null,
                allStored: true,
                dataNotStoredDialog: false,
                dataNotStoredTab: '',

                baseSettingsOpened: false,
                unsavedDataInDialog: false,
                systemSettingsOpened: false,

                cmd: null,
                cmdDialog: false,
                commandHost: null,
                commandError: false,
                commandRunning: false,

                wizard: true,
                performed: false,

                discoveryAlive: false,

                readTimeoutMs: SlowConnectionWarningDialog.getReadTimeoutMs(),
                showSlowConnectionWarning: false,

                /** if true, shows the expiry warning (left time and update button) */
                expireWarningMode: false,

                versionAdmin: '',

                forceUpdateAdapters: 0,

                noTranslation: (window._localStorage || window.localStorage).getItem('App.noTranslation') !== 'false',

                cloudNotConnected: false,
                cloudReconnect: 0,

                showRedirect: false,
                redirectCountDown: 0,

                triggerAdapterUpdate: 0,

                updating: false, // js controller updating
                /** If the notifications dialog should be shown */
                notificationsDialog: false,
                /** Notifications, excluding the system ones */
                notifications: {},
                /** Number of new notifications */
                noNotifications: 0,
            };
            this.logsWorker = null;
            this.instancesWorker = null;
            this.hostsWorker = null;
        } else {
            const theme = App.createTheme();
            this.state = {
                login: true,
                theme,
                themeName: App.getThemeName(theme),
                themeType: App.getThemeType(theme),
            };
        }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasGlobalError: error };
    }

    componentDidCatch(error, info) {
        this.setState({ hasGlobalError: error, hasGlobalErrorInfo: info });
    }

    setUnsavedData(hasUnsavedData) {
        if (hasUnsavedData !== this.state.unsavedDataInDialog) {
            this.setState({ unsavedDataInDialog: hasUnsavedData });
        }
    }

    // If the background color must be inverted. Depends on the current theme.
    mustInvertBackground(color) {
        if (!color) {
            return false;
        }
        const invertedColor = Utils.invertColor(color, true);
        if (invertedColor === '#FFFFFF' && this.state.themeType === 'dark') {
            return true;
        }

        return invertedColor === '#000000' && this.state.themeType === 'light';
    }

    localStorageGetItem = name => this.guiSettings.native.localStorage[name];

    localStorageSetItem = (name, value) => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.localStorageRemoveItem(name);
            return;
        }
        this.guiSettings.native.localStorage[name] = value.toString();
        this.localStorageSave();
    };

    localStorageRemoveItem = name => {
        if (Object.prototype.hasOwnProperty.call(this.guiSettings.native.localStorage, name)) {
            delete this.guiSettings.native.localStorage[name];
            this.localStorageSave();
        }
    };

    sessionStorageGetItem = name => this.guiSettings.native.sessionStorage[name];

    sessionStorageSetItem = (name, value) => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.sessionStorageRemoveItem(name);
            return;
        }
        this.guiSettings.native.sessionStorage[name] = value.toString();
        this.localStorageSave();
    };

    sessionStorageRemoveItem = name => {
        if (Object.prototype.hasOwnProperty.call(this.guiSettings.native.sessionStorage, name)) {
            delete this.guiSettings.native.sessionStorage[name];
            this.localStorageSave();
        }
    };

    localStorageSave() {
        this.localStorageTimer && clearTimeout(this.localStorageTimer);
        this.localStorageTimer = setTimeout(async () => {
            this.localStorageTimer = null;
            await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, this.guiSettings);
        }, 200);
    }

    toggleTranslation = () => {
        (window._localStorage || window.localStorage).setItem(
            'App.noTranslation',
            this.state.noTranslation ? 'false' : 'true',
        );
        this.setState({ noTranslation: !this.state.noTranslation });
    };

    async getGUISettings() {
        let obj;

        try {
            obj = await this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`);
        } catch (e) {
            console.warn(`Could not get "system.adapter.${this.adminInstance}.guiSettings": ${e.message}`);
        }

        if (!obj) {
            obj = JSON.parse(JSON.stringify(DEFAULT_GUI_SETTINGS_OBJECT));
            try {
                await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, obj);
            } catch (e) {
                console.warn(`Could not update "system.adapter.${this.adminInstance}.guiSettings": ${e}`);
            }
        }

        let state;
        try {
            state = await this.socket.getState(`system.adapter.${this.adminInstance}.guiSettings`);
        } catch (e) {
            state = { val: false };
        }
        if (state?.val) {
            this.guiSettings = obj;
            this.guiSettings.native = this.guiSettings.native || { localStorage: {}, sessionStorage: {} };
            if (!this.guiSettings.native.localStorage) {
                this.guiSettings.native = { localStorage: this.guiSettings.native, sessionStorage: {} };
            }

            window._localStorage = {
                getItem: this.localStorageGetItem,
                setItem: this.localStorageSetItem,
                removeItem: this.localStorageRemoveItem,
            };
            window._sessionStorage = {
                getItem: this.sessionStorageGetItem,
                setItem: this.sessionStorageSetItem,
                removeItem: this.sessionStorageRemoveItem,
            };

            // this is only settings that initialized before connection was established
            let drawerState = this.guiSettings.native['App.drawerState'];
            if (drawerState) {
                drawerState = parseInt(drawerState, 10);
            } else {
                drawerState = this.props.width === 'xs' ? DrawerStates.closed : DrawerStates.opened;
            }
            const noTranslation =
                    (window._localStorage || window.localStorage).getItem('App.noTranslation') !== 'false';

            this.setState({ guiSettings: true, drawerState, noTranslation }, () => {
                if (Utils.getThemeName() !== this.state.theme.name) {
                    this.toggleTheme(Utils.getThemeName());
                }
            });
        } else if (this.state.guiSettings) {
            window._localStorage = null;
            window._sessionStorage = null;

            this.setState({ guiSettings: false });
        }
    }

    enableGuiSettings(enabled, ownSettings) {
        if (enabled && !this.guiSettings) {
            this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`)
                .then(async obj => {
                    this.guiSettings = obj || JSON.parse(JSON.stringify(DEFAULT_GUI_SETTINGS_OBJECT));

                    if (ownSettings || !this.guiSettings.native || !Object.keys(this.guiSettings.native).length) {
                        this.guiSettings.native = { localStorage: {}, sessionStorage: {} };
                        Object.keys(window.localStorage).forEach(name => {
                            if (
                                name !== 'getItem' &&
                                name !== 'setItem' &&
                                name !== 'removeItem' &&
                                name !== 'clear' &&
                                name !== 'key' &&
                                name !== 'length'
                            ) {
                                this.guiSettings.native.localStorage[name] = window.localStorage.getItem(name);
                            }
                        });

                        Object.keys(window.sessionStorage).forEach(name => {
                            if (
                                name !== 'getItem' &&
                                name !== 'setItem' &&
                                name !== 'removeItem' &&
                                name !== 'clear' &&
                                name !== 'key' &&
                                name !== 'length'
                            ) {
                                this.guiSettings.native.sessionStorage[name] = window.sessionStorage.getItem(name);
                            }
                        });
                        await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, this.guiSettings);
                        await this.socket.setState(`system.adapter.${this.adminInstance}.guiSettings`, {
                            val: true,
                            ack: true,
                        });
                    } else {
                        await this.socket.setState(`system.adapter.${this.adminInstance}.guiSettings`, {
                            val: true,
                            ack: true,
                        });
                        window.location.reload();
                    }

                    await this.getGUISettings();
                });
        } else if (!enabled && this.guiSettings) {
            this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`)
                .then(async obj => {
                    if (!obj) {
                        try {
                            // create an object if not exists
                            await this.socket.setObject(
                                `system.adapter.${this.adminInstance}.guiSettings`,
                                DEFAULT_GUI_SETTINGS_OBJECT,
                            );
                        } catch (e) {
                            console.error(`Cannot create system.adapter.${this.adminInstance}.guiSettings": ${e}`);
                        }
                    }
                    window._localStorage = null;
                    window._sessionStorage = null;

                    // clear localStorage
                    Object.keys(window.localStorage).forEach(key => window.localStorage.removeItem(key));
                    Object.keys(window.sessionStorage).forEach(key => window.sessionStorage.removeItem(key));

                    Object.keys(this.guiSettings.native.localStorage).forEach(name =>
                        window.localStorage.setItem(name, this.guiSettings.native.localStorage[name]));
                    Object.keys(this.guiSettings.native.sessionStorage).forEach(name =>
                        window.sessionStorage.setItem(name, this.guiSettings.native.sessionStorage[name]));

                    this.guiSettings = null;

                    try {
                        await this.socket.setState(`system.adapter.${this.adminInstance}.guiSettings`, {
                            val: false,
                            ack: true,
                        });
                    } catch (e) {
                        window.alert(`Cannot disable settings: ${e}`);
                    }
                    this.setState({ guiSettings: false });
                });
        }
    }

    componentDidMount() {
        if (!this.state.login) {
            window.addEventListener('hashchange', this.onHashChanged, false);

            if (!this.state.currentTab.tab) {
                this.handleNavigation('tab-intro');
            } else {
                this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
            }

            this.socket = new Connection({
                name: 'admin',
                admin5only: true,
                port: App.getPort(),
                autoSubscribes: ['system.adapter.*'], // do not subscribe on '*' and really we don't need a 'system.adapter.*' too. Every tab must subscribe itself on everything that it needs
                autoSubscribeLog: true,
                onProgress: progress => {
                    if (progress === PROGRESS.CONNECTING) {
                        this.setState({
                            connected: false,
                        });
                    } else if (progress === PROGRESS.READY) {
                        // BF: (2022.05.09) here must be this.socket.getVersion(true), but I have no Idea, why it does not work :(
                        this.socket._socket.emit('getVersion', async (err, version) => {
                            if (err) {
                                console.error(`Cannot read version: ${err}`);
                                if (err === 'ioBroker is not connected') {
                                    setInterval(() => {
                                        if (this.state.cloudReconnect > 0) {
                                            this.setState({ cloudReconnect: this.state.cloudReconnect - 1 });
                                        } else {
                                            window.location.reload();
                                        }
                                    }, 1_000);

                                    this.setState({
                                        cloudNotConnected: true,
                                        cloudReconnect: 10,
                                    });
                                    return;
                                }
                                if (!version) {
                                    window.alert(err);
                                    return;
                                }
                            }

                            console.log(`Stored version: ${this.state.versionAdmin}, new version: ${version}`);
                            if (this.state.versionAdmin && this.state.versionAdmin !== version) {
                                window.alert('New adapter version detected. Reloading...');
                                setTimeout(() => window.location.reload(), 500);
                            }

                            // read settings anew
                            await this.getGUISettings();

                            const newState = {
                                connected: true,
                                progress: 100,
                                versionAdmin: version,
                            };

                            if (this.state.cmd && this.state.cmd.match(/ admin(@[-.\w]+)?$/)) {
                                // close the command dialog after reconnect (maybe admin was restarted, and update is now finished)
                                newState.commandRunning = false;
                                newState.forceUpdateAdapters = this.state.forceUpdateAdapters + 1;

                                this.closeCmdDialog(() => {
                                    this.setState(newState);
                                    window.location.reload();
                                });
                            } else {
                                try {
                                    const adminObj = await this.socket.getObject(
                                        `system.adapter.${this.adminInstance}`,
                                    );
                                    // use instance language
                                    if (adminObj?.native?.language) {
                                        if (adminObj.native.language !== I18n.getLanguage()) {
                                            console.log(`Language changed to ${adminObj.native.language}`);
                                            I18n.setLanguage(adminObj.native.language);
                                            if (this.languageSet) {
                                                window.location.reload();
                                            } else {
                                                this.languageSet = true;
                                            }
                                        }
                                    } else if (this.socket.systemLang !== I18n.getLanguage()) {
                                        console.log(`Language changed to ${this.socket.systemLang}`);
                                        I18n.setLanguage(this.socket.systemLang);
                                        if (this.languageSet) {
                                            window.location.reload();
                                        } else {
                                            this.languageSet = true;
                                        }
                                    }
                                } catch (e) {
                                    console.error(`Cannot read admin settings: ${e}`);
                                }

                                this.setState(newState);
                            }
                        });
                    } else {
                        this.setState({
                            connected: true,
                            progress: Math.round((PROGRESS.READY / progress) * 100),
                        });
                    }
                },
                onReady: async objects => {
                    // Combine adminGuiConfig with user settings
                    this.adminGuiConfig = {
                        admin: {
                            menu: {}, settings: {}, adapters: {}, login: {},
                        },
                        ...this.socket.systemConfig.native?.vendor,
                    };
                    this.adminGuiConfig.admin.menu = this.adminGuiConfig.admin.menu || {};
                    this.adminGuiConfig.admin.settings = this.adminGuiConfig.admin.settings || {};
                    this.adminGuiConfig.admin.adapters = this.adminGuiConfig.admin.adapters || {};
                    this.adminGuiConfig.admin.login = this.adminGuiConfig.admin.login || {};

                    this.socket
                        .getCurrentInstance()
                        .then(adminInstance => {
                            this.adminInstance = adminInstance;
                            return this.socket.getObject(`system.adapter.${adminInstance}`);
                        })
                        .then(adminObj => {
                            // use instance language
                            if (adminObj?.native?.language) {
                                I18n.setLanguage(adminObj.native.language);
                            } else {
                                I18n.setLanguage(this.socket.systemLang);
                            }
                            this.languageSet = true;
                            return this.socket.getIsEasyModeStrict();
                        })
                        .then(async isStrict => {
                            await this.getGUISettings();

                            if (isStrict) {
                                this.socket.getEasyMode()
                                    .then(config => {
                                        this.setState({
                                            lang: this.socket.systemLang,
                                            ready: true,
                                            strictEasyMode: true,
                                            easyModeConfigs: config.configs,
                                            objects,
                                        });
                                    });
                                return;
                            }
                            // create Workers
                            this.logsWorker = this.logsWorker || new LogsWorker(this.socket, 1000);
                            this.instancesWorker = this.instancesWorker || new InstancesWorker(this.socket);
                            this.hostsWorker = this.hostsWorker || new HostsWorker(this.socket);
                            this.adaptersWorker = this.adaptersWorker || new AdaptersWorker(this.socket);
                            this.objectsWorker = this.objectsWorker || new ObjectsWorker(this.socket);

                            const newState = {
                                lang: this.socket.systemLang,
                                ready: true,
                                objects,
                            };

                            try {
                                newState.systemConfig = await this.socket.getCompactSystemConfig();
                                newState.wizard = !newState.systemConfig.common.licenseConfirmed;
                                await this.findCurrentHost(newState);
                                await this.readRepoAndInstalledInfo(newState.currentHost, newState.hosts);
                            } catch (error) {
                                console.log(error);
                            }

                            this.adaptersWorker.registerRepositoryHandler(this.repoChangeHandler);
                            this.adaptersWorker.registerHandler(this.adaptersChangeHandler);
                            this.hostsWorker.registerHandler(this.updateHosts);
                            this.hostsWorker.registerNotificationHandler(this.handleNewNotifications);

                            this.subscribeOnHostsStatus();

                            const storedExpertMode = (window._sessionStorage || window.sessionStorage).getItem(
                                'App.expertMode',
                            );
                            newState.expertMode = storedExpertMode
                                ? storedExpertMode === 'true'
                                : !!newState.systemConfig.common.expertMode;

                            // Read user and show him
                            if (this.socket.isSecure || this.socket.systemConfig.native?.vendor) {
                                try {
                                    const user = await this.socket
                                        .getCurrentUser();

                                    const userObj = await this.socket.getObject(`system.user.${user}`);

                                    if (userObj.native?.vendor) {
                                        Object.assign(this.adminGuiConfig, userObj.native.vendor);
                                    }

                                    if (this.socket.isSecure) {
                                        this.setState({
                                            user: {
                                                id: userObj._id,
                                                name: Utils.getObjectNameFromObj(
                                                    userObj,
                                                    this.socket.systemLang,
                                                ),
                                                color: userObj.common.color,
                                                icon: userObj.common.icon,
                                                invertBackground: this.mustInvertBackground(
                                                    userObj.common.color,
                                                ),
                                            },
                                        });

                                        // start ping interval
                                        this.makePingAuth();
                                    }
                                } catch (e)  {
                                    console.error(`Could not determine user to show: ${e}`);
                                    this.showAlert(e, 'error');
                                }
                            }

                            this.setState(newState, () => this.setCurrentTabTitle());

                            this.socket.subscribeState('system.adapter.discovery.0.alive', this.onDiscoveryAlive);

                            // Give some time for communication
                            setTimeout(() => this.logsWorkerChanged(this.state.currentHost), 1000);

                            setTimeout(
                                () =>
                                    this.findNewsInstance().then(instance =>
                                        this.socket.subscribeState(
                                            `admin.${instance}.info.newsFeed`,
                                            this.getNews(instance),
                                        )),
                                5_000,
                            );

                            setTimeout(
                                async () => {
                                    const notifications = await this.hostsWorker.getNotifications(newState.currentHost);
                                    this.showAdaptersWarning(
                                        notifications,
                                        newState.currentHost,
                                    );

                                    this.handleNewNotifications(notifications);
                                },
                                3_000,
                            );
                        })
                        .catch(error => {
                            console.error(error);
                            this.showAlert(error, 'error');
                        });
                },
                // onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
                onError: error => {
                    console.error(error);
                    error = error.message || error.toString();
                    if (error === 'ioBroker is not connected') {
                        if (!this.state.cloudNotConnected) {
                            this.showAlert(I18n.t(error), 'error');
                            setInterval(() => {
                                if (this.state.cloudReconnect > 0) {
                                    this.setState({ cloudReconnect: this.state.cloudReconnect - 1 });
                                } else {
                                    window.location.reload();
                                }
                            }, 1_000);

                            this.setState({
                                cloudNotConnected: true,
                                cloudReconnect: 10,
                            });
                        }
                    } else {
                        this.showAlert(error, 'error');
                    }
                },
            });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.onHashChanged, false);
        this.socket && this.socket.unsubscribeState('system.adapter.discovery.0.alive', this.onDiscoveryAlive);

        this.adaptersWorker && this.adaptersWorker.unregisterRepositoryHandler(this.repoChangeHandler);
        this.adaptersWorker && this.adaptersWorker.unregisterHandler(this.adaptersChangeHandler);
        this.hostsWorker && this.hostsWorker.unregisterHandler(this.updateHosts);

        this.pingAuth && clearTimeout(this.pingAuth);
        this.pingAuth = null;
        this.expireInSecInterval && clearInterval(this.expireInSecInterval);
        this.expireInSecInterval = null;
        this.unsubscribeOnHostsStatus();

        // restore localstorage
        if (this._localStorage) {
            window._localStorage = null;
            window._sessionStorage = null;
        }
    }

    updateHosts = (hostId, obj) => {
        const hosts = JSON.parse(JSON.stringify(this.state.hosts));

        if (!Array.isArray(hostId)) {
            hostId = { id: hostId, obj, type: obj ? 'changed' : 'delete' };
        }

        Promise.all(
            hostId.map(async event => {
                const elementFind = hosts.find(host => host._id === event.id);
                if (elementFind) {
                    const index = hosts.indexOf(elementFind);
                    if (event.obj) {
                        // updated
                        hosts[index] = event.obj;
                    } else {
                        // deleted
                        hosts.splice(index, 1);
                    }
                } else {
                    // new
                    hosts.push(event.obj);
                }
            }),
        ).then(() => {
            const newState = { hosts };
            this.setState(newState);
        });
    };

    repoChangeHandler = () => {
        this.readRepoAndInstalledInfo(this.state.currentHost, null, true).then(() => console.log('Repo updated!'));
    };

    adaptersChangeHandler = events => {
        // update installed
        //
        const installed = JSON.parse(JSON.stringify(this.state.installed));
        let changed = false;
        events.forEach(event => {
            const parts = event.id.split('.');
            const adapter = parts[2];
            if (event.type === 'delete' || !event.obj) {
                if (installed[adapter]) {
                    changed = true;
                    delete installed[adapter];
                }
            } else if (installed[adapter]) {
                Object.keys(installed[adapter]).forEach(attr => {
                    if (installed[adapter][attr] !== event.obj.common[attr]) {
                        installed[adapter][attr] = event.obj.common[attr];
                        changed = true;
                    }
                });
            } else {
                installed[adapter] = { version: event.obj.common.version };
                changed = true;
            }
        });

        changed && this.setState({ installed });
    };

    async findCurrentHost(newState) {
        newState.hosts = await this.socket.getCompactHosts();

        if (!this.state.currentHost) {
            const currentHost = (window._localStorage || window.localStorage).getItem('App.currentHost');

            const itemHost = newState.hosts.find(host => host._id === currentHost);

            if (currentHost && itemHost) {
                newState.currentHost = itemHost._id;
                newState.currentHostName = itemHost.common?.name || itemHost._id.replace('system.host.', '');
            } else {
                newState.currentHost = newState.hosts[0]._id;
                newState.currentHostName =
                    newState.hosts[0].common?.name || newState.hosts[0]._id.replace('system.host.', '');
            }
        }

        newState.ownHost = newState.currentHost;

        // Check that host is alive
        let alive;
        try {
            alive = await this.socket.getState(`${newState.currentHost}.alive`);
        } catch (e) {
            alive = null;
            console.warn(`Cannot get state ${newState.currentHost}.alive: ${e}`);
        }

        if (!alive || !alive.val) {
            // find first alive host
            for (let h = 0; h < newState.hosts.length; h++) {
                alive = await this.socket.getState(`${newState.hosts[h]._id}.alive`);
                if (alive && alive.val) {
                    newState.currentHost = newState.hosts[h]._id;
                    newState.currentHostName = newState.hosts[h].common.name;
                }
            }
        }
    }

    updateExpireIn() {
        const now = Date.now();
        this.expireInSec = this.expireInSec > 0 ? this.expireInSec - (now - this.lastExecution) / 1_000 : 0;

        const time = Utils.formatTime(this.expireInSec);
        if (this.refUser.current) {
            this.refUser.current.title = this.expireText.replace('%s', time);
        }
        if (this.expireInSec < this.EXPIRE_WARNING_THRESHOLD && this.refUserDiv.current) {
            this.refUserDiv.current.innerHTML = time;

            if (!this.state.expireWarningMode) {
                this.setState({ expireWarningMode: true });
            }
        } else if (this.state.expireWarningMode) {
            this.refUserDiv.current.innerHTML = this.state.user.name;
            this.setState({ expireWarningMode: false });
        }

        if (this.expireInSec <= 0) {
            window.alert('Session expired');
            // reconnect
            setTimeout(() => window.location.reload(false), 1_000);
        }

        this.lastExecution = now;
    }

    /**
     * Start interval to handle logout after the session expires, this also refreshes the session
     *
     * @return {Promise<void>}
     */
    async makePingAuth() {
        this.pingAuth && clearTimeout(this.pingAuth);
        this.pingAuth = null;

        try {
            const data = await this.socket.getCurrentSession();

            if (data) {
                if (!this.expireInSecInterval) {
                    this.expireInSecInterval = setInterval(() => this.updateExpireIn(), 1_000);
                }
                this.expireInSec = data.expireInSec;
                this.lastExecution = Date.now();
                this.updateExpireIn();
            }
        } catch (e) {
            window.alert(`Session timeout: ${e}`);
            // reconnect
            setTimeout(() => window.location.reload(false), 1_000);
        }
    }

    onDiscoveryAlive = (name, value) => {
        if (!!value?.val !== this.state.discoveryAlive) {
            this.setState({ discoveryAlive: !!value?.val });
        }
    };

    getDiscoveryModal = () => <DiscoveryDialog
        themeType={this.state.themeType}
        themeName={this.state.themeName}
        theme={this.state.theme}
        socket={this.socket}
        dateFormat={this.state.systemConfig.common.dateFormat}
        currentHost={this.state.currentHost}
        defaultLogLevel={this.state.systemConfig.common.defaultLogLevel}
        repository={this.state.repository}
        hosts={this.state.hosts}
        onClose={() => Router.doNavigate(null)}
    />;

    findNewsInstance = () => {
        const maxCount = 200;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async resolve => {
            for (let instance = 0; instance < maxCount; instance++) {
                try {
                    const adminAlive = await this.socket.getState(`system.adapter.admin.${instance}.alive`);
                    if (adminAlive?.val) {
                        resolve(instance);
                        break;
                    }
                } catch (error) {
                    console.error(`Cannot find news instance: ${error}`);
                    this.showAlert(`Cannot find news instance: ${error}`, 'error');
                }
            }
            resolve(0);
        });
    };

    /**
     * Render the notifications dialog
     * @return {React.ReactNode}
     */
    renderNotificationsDialog() {
        if (!this.state.notificationsDialog) {
            return null;
        }

        return <NotificationsDialog
            notifications={this.state.notifications?.notifications || {}}
            instances={this.state.notifications?.instances || {}}
            onClose={() => this.setState({ notificationsDialog: false })}
            ackCallback={(host, name) => this.socket.clearNotifications(host, name)}
            dateFormat={this.state.systemConfig.common.dateFormat}
            themeType={this.state.themeType}
        />;
    }

    renderHostWarningDialog() {
        if (!this.state.showHostWarning) {
            return null;
        }

        return <HostWarningDialog
            instances={this.state.showHostWarning.instances}
            messages={this.state.showHostWarning.result.system.categories}
            dateFormat={this.state.systemConfig.common.dateFormat}
            themeType={this.state.themeType}
            ackCallback={name => this.socket.clearNotifications(this.state.showHostWarning.host, name)}
            onClose={() => this.setState({ showHostWarning: null })}
        />;
    }

    /**
     * Called when notifications detected, updates the notifications indicator
     *
     * @param {Record<string, any>} notifications
     */
    handleNewNotifications = async notifications => {
        // console.log(`new notifications: ${JSON.stringify(notifications)}`);
        let noNotifications = 0;

        // if host is offline it returns null
        if (!notifications) {
            this.setState({ noNotifications, notifications: { } });
            return;
        }

        for (const hostDetails of Object.values(notifications)) {
            if (!hostDetails?.result) {
                continue;
            }
            for (const [scope, scopeDetails] of Object.entries(hostDetails.result)) {
                if (scope === 'system') {
                    continue;
                }

                for (const categoryDetails of Object.values(scopeDetails.categories)) {
                    for (const instanceDetails of Object.values(categoryDetails.instances)) {
                        noNotifications += instanceDetails.messages.length;
                    }
                }
            }
        }

        const instances = await this.instancesWorker.getInstances();

        this.setState({ noNotifications, notifications: { notifications, instances } });
    };

    showAdaptersWarning = (notifications, host) => {
        if (!notifications || !notifications[host] || !notifications[host].result) {
            return Promise.resolve();
        }

        const result = notifications[host].result;

        if (result?.system && Object.keys(result.system.categories).length) {
            return this.instancesWorker.getInstances()
                .then(instances => this.setState({ showHostWarning: { host, instances, result } }));
        }
        return Promise.resolve();
    };

    /**
     * Get news for specific adapter instance
     *
     * @param {string} instance e.g. hm-rpc.0
     */
    getNews = instance => async (name, newsFeed) => {
        try {
            if (!this.state.systemConfig.common.licenseConfirmed) {
                return;
            }

            const lastNewsId = await this.socket.getState(`admin.${instance}.info.newsLastId`);
            if (newsFeed?.val) {
                let news = null;
                try {
                    news = JSON.parse(newsFeed.val);
                } catch (error) {
                    console.error(`Cannot parse news: ${newsFeed.val}`);
                }

                if (news?.length && news[0].id !== lastNewsId?.val) {
                    const uuid = await this.socket.getUuid();
                    const info = await this.socket
                        .getHostInfo(this.state.currentHost)
                        .catch(() => null);

                    const instances  = await this.socket
                        .getCompactInstances()
                        .catch(() => null);

                    const objectsDbType = (await this.socket.getDiagData(this.state.currentHost, 'normal')).objectsType;

                    const objects = await this.objectsWorker.getObjects(true);
                    const noObjects = Object.keys(objects).length;

                    const checkNews = checkMessages(news, lastNewsId?.val, {
                        lang: I18n.getLanguage(),
                        adapters: this.state.adapters,
                        instances: instances || [],
                        nodeVersion: info ? info['Node.js'] || '?' : '?',
                        npmVersion: info ? info.NPM || '?' : '?',
                        os: info ? info.os || '?' : '?',
                        activeRepo: this.state.systemConfig.common.activeRepo,
                        uuid,
                        objectsDbType,
                        noObjects,
                    });

                    if (checkNews?.length) {
                        this.setState({
                            showNews: {
                                instance,
                                checkNews,
                                lastNewsId: lastNewsId?.val,
                            },
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
            this.showAlert(error, 'error');
        }
    };

    renderNewsDialog() {
        if (!this.state.showNews) {
            return null;
        }
        return <NewsAdminDialog
            newsArr={this.state.showNews.checkNews}
            current={this.state.showNews.lastNewsId}
            onSetLastNewsId={async id => {
                id && (await this.socket.setState(`admin.${this.state.showNews.instance}.info.newsLastId`, { val: id, ack: true }));
                this.setState({ showNews: null });
            }}
        />;
    }

    renderSlowConnectionWarning() {
        if (!this.state.showSlowConnectionWarning) {
            return null;
        }
        return <SlowConnectionWarningDialog
            readTimeoutMs={this.state.readTimeoutMs}
            t={I18n.t}
            onClose={readTimeoutMs => {
                if (readTimeoutMs) {
                    this.setState({ showSlowConnectionWarning: false, readTimeoutMs }, () =>
                        this.readRepoAndInstalledInfo(this.state.currentHost));
                } else {
                    this.setState({ showSlowConnectionWarning: false });
                }
            }}
        />;
    }

    readRepoAndInstalledInfo = async (currentHost, hosts, update) => {
        hosts = hosts || this.state.hosts;
        let repository;
        let installed;

        return this.socket
            .getCompactRepository(currentHost, update, this.state.readTimeoutMs)
            .catch(e => {
                window.alert(`Cannot getRepositoryCompact: ${e}`);
                e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                return {};
            })
            .then(_repository => {
                repository = _repository;
                return this.socket.getCompactInstalled(currentHost, update, this.state.readTimeoutMs).catch(e => {
                    window.alert(`Cannot getInstalled: ${e}`);
                    e.toString().includes('timeout') && this.setState({ showSlowConnectionWarning: true });
                    return {};
                });
            })
            .then(_installed => {
                installed = _installed;
                return this.socket.getCompactAdapters(update).catch(e => window.alert(`Cannot read adapters: ${e}`));
            })
            .then(adapters => {
                installed &&
                    adapters &&
                    Object.keys(adapters).forEach(id => {
                        if (installed[id] && adapters[id].iv) {
                            installed[id].ignoreVersion = adapters[id].iv;
                        }
                    });

                this.setState({
                    repository, installed, hosts, adapters,
                });
            });
    };

    logsWorkerChanged = currentHost => {
        this.logsWorker && this.logsWorker.setCurrentHost(currentHost);
    };

    onHostStatusChanged = (id, state) => {
        const host = this.state.hosts.find(_id => `${_id}.alive` === id);
        if (host) {
            // TODO!! => update hostSelector
            console.log(`Current status ${id}: ${state?.val}`);
        }
    };

    subscribeOnHostsStatus(hosts) {
        hosts = hosts || this.state.hosts;
        hosts.forEach(item => this.socket.subscribeState(`${item._id}.alive`, this.onHostStatusChanged));
    }

    unsubscribeOnHostsStatus() {
        this.state.hosts &&
            this.socket &&
            this.state.hosts.forEach(item =>
                this.socket.unsubscribeState(`${item._id}.alive`, this.onHostStatusChanged));
    }

    /**
     * Updates the current currentTab in the states
     */
    onHashChanged = () => {
        this.setState({ currentTab: Router.getLocation() }, () => this.setCurrentTabTitle());
    };

    /**
     * Get the used port
     */
    static getPort() {
        let port = parseInt(window.location.port, 10);

        if (Number.isNaN(port)) {
            switch (App.getProtocol()) {
                case 'https:':
                    port = 443;
                    break;
                case 'http:':
                    port = 80;
                    break;
                default:
                    break;
            }
        }

        if (!port || port === 3000) {
            port = 8081;
        }

        return port;
    }

    /**
     * Get the used protocol
     */
    static getProtocol() {
        return window.location.protocol;
    }

    /**
     * Get a theme
     * @param {string} name Theme name
     * @returns {Theme}
     */
    static createTheme(name) {
        return Theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme name
     * @param {Theme} theme Theme
     * @returns {string} Theme name
     */
    static getThemeName(theme) {
        return theme.name;
    }

    /**
     * Get the theme type
     * @param {Theme} theme Theme
     * @returns {string} Theme type
     */
    static getThemeType(theme) {
        return theme.palette.mode;
    }

    /**
     * Changes the current theme
     */
    toggleTheme = currentThemeName => {
        const themeName = this.state.themeName;

        const newThemeName = currentThemeName || Utils.toggleTheme(themeName);

        const theme = App.createTheme(newThemeName);

        this.setState(
            {
                theme,
                themeName: newThemeName,
                themeType: App.getThemeType(theme),
            },
            () => {
                this.refConfigIframe?.contentWindow?.postMessage('updateTheme', '*');
            },
        );
    };

    async onObjectChange(id, obj) {
        console.log(`OBJECT: ${id}`);
        if (obj) {
            this.setState(prevState => {
                const objects = prevState.objects;
                objects[id] = obj;

                return { objects };
            });
        } else {
            this.setState(prevState => {
                const objects = prevState.objects;
                delete objects[id];

                return { objects };
            });
        }
    }

    setCurrentTabTitle() {
        this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
    }

    setTitle(title) {
        document.title = `${title} - ${this.state.currentHostName || 'ioBroker'}`;
    }

    getCurrentTab() {
        if (this.state && this.state.currentTab && this.state.currentTab.tab) {
            if (this.state.currentTab.tab === 'tab-adapters') {
                const small = this.props.width === 'xs' || this.props.width === 'sm';
                const compact = !small && this.state.drawerState === DrawerStates.compact;
                const opened = !small && this.state.drawerState === DrawerStates.opened;
                const closed = small || this.state.drawerState === DrawerStates.closed;

                return <Suspense fallback={<Connecting />}>
                    <Adapters
                        triggerUpdate={this.state.triggerAdapterUpdate}
                        key="adapters"
                        forceUpdateAdapters={this.state.forceUpdateAdapters}
                        theme={this.state.theme}
                        adaptersWorker={this.adaptersWorker}
                        instancesWorker={this.instancesWorker}
                        themeType={this.state.themeType}
                        systemConfig={this.state.systemConfig}
                        socket={this.socket}
                        hosts={this.state.hosts}
                        host={this.state.ownHost}
                        hostsWorker={this.hostsWorker}
                        currentHost={this.state.currentHost}
                        ready={this.state.ready}
                        t={I18n.t}
                        lang={I18n.getLanguage()}
                        expertMode={this.state.expertMode}
                        executeCommand={(cmd, host, cb) => this.executeCommand(cmd, host, cb)}
                        commandRunning={this.state.commandRunning}
                        onSetCommandRunning={commandRunning => this.setState({ commandRunning })}
                        menuOpened={opened}
                        menuClosed={closed}
                        menuCompact={compact}
                        adminGuiConfig={this.adminGuiConfig}
                        toggleTranslation={this.toggleTranslation}
                        noTranslation={this.state.noTranslation}
                        adminInstance={this.adminInstance}
                        onUpdating={updating => this.setState({ updating })}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-instances') {
                return <Suspense fallback={<Connecting />}>
                    <Instances
                        key="instances"
                        menuPadding={
                            this.state.drawerState === DrawerStates.closed
                                ? 0
                                : this.state.drawerState === DrawerStates.opened
                                    ? (this.state.editMenuList ? DRAWER_EDIT_WIDTH : DRAWER_FULL_WIDTH)
                                    : DRAWER_COMPACT_WIDTH
                        }
                        socket={this.socket}
                        instancesWorker={this.instancesWorker}
                        lang={I18n.getLanguage()}
                        protocol={this.state.protocol}
                        hostname={this.state.hostname}
                        port={this.state.port}
                        adminInstance={this.adminInstance}
                        repository={this.state.repository}
                        hosts={this.state.hosts}
                        themeName={this.state.themeName}
                        themeType={this.state.themeType}
                        theme={this.state.theme}
                        expertMode={this.state.expertMode}
                        currentHost={this.state.currentHost}
                        currentHostName={this.state.currentHostName}
                        t={I18n.t}
                        dateFormat={this.state.systemConfig.common.dateFormat}
                        isFloatComma={this.state.systemConfig.common.isFloatComma}
                        width={this.props.width}
                        configStored={value => this.allStored(value)}
                        executeCommand={(cmd, host, cb) => this.executeCommand(cmd, host, cb)}
                        inBackgroundCommand={this.state.commandError || this.state.performed}
                        onRegisterIframeRef={ref => (this.refConfigIframe = ref)}
                        onUnregisterIframeRef={ref => {
                            if (this.refConfigIframe === ref) {
                                this.refConfigIframe = null;
                            }
                        }}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-intro') {
                return <Suspense fallback={<Connecting />}>
                    <Intro
                        key="intro"
                        protocol={this.state.protocol}
                        hostname={this.state.hostname}
                        port={this.state.port}
                        adminInstance={this.adminInstance}
                        instancesWorker={this.instancesWorker}
                        hostsWorker={this.hostsWorker}
                        showAlert={(message, type) => this.showAlert(message, type)}
                        socket={this.socket}
                        t={I18n.t}
                        lang={I18n.getLanguage()}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-logs') {
                return <Suspense fallback={<Connecting />}>
                    <Logs
                        key="logs"
                        t={I18n.t}
                        lang={this.state.lang}
                        socket={this.socket}
                        themeType={this.state.themeType}
                        ready={this.state.ready}
                        logsWorker={this.logsWorker}
                        expertMode={this.state.expertMode}
                        currentHost={this.state.currentHost}
                        hostsWorker={this.hostsWorker}
                        clearErrors={cb => this.clearLogErrors(cb)}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-files') {
                return <Suspense fallback={<Connecting />}>
                    <Files
                        key="files"
                        ready={this.state.ready}
                        t={I18n.t}
                        expertMode={this.state.expertMode}
                        lang={I18n.getLanguage()}
                        socket={this.socket}
                        themeName={this.state.themeName}
                        themeType={this.state.themeType}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-users') {
                return <Suspense fallback={<Connecting />}>
                    <Users
                        key="users"
                        ready={this.state.ready}
                        t={I18n.t}
                        expertMode={this.state.expertMode}
                        lang={I18n.getLanguage()}
                        socket={this.socket}
                        themeType={this.state.themeType}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-enums') {
                return <Suspense fallback={<Connecting />}>
                    <Enums
                        key="enums"
                        ready={this.state.ready}
                        t={I18n.t}
                        expertMode={this.state.expertMode}
                        lang={I18n.getLanguage()}
                        socket={this.socket}
                        themeType={this.state.themeType}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-objects') {
                return <Suspense fallback={<Connecting />}>
                    <Objects
                        key="objects"
                        t={I18n.t}
                        theme={this.state.theme}
                        themeName={this.state.themeName}
                        themeType={this.state.themeType}
                        expertMode={this.state.expertMode}
                        objectsWorker={this.objectsWorker}
                        lang={I18n.getLanguage()}
                        socket={this.socket}
                        dateFormat={this.state.systemConfig.common.dateFormat}
                        isFloatComma={this.state.systemConfig.common.isFloatComma}
                    />
                </Suspense>;
            } if (this.state.currentTab.tab === 'tab-hosts') {
                return <Suspense fallback={<Connecting />}>
                    <Hosts
                        socket={this.socket}
                        lang={I18n.getLanguage()}
                        hostsWorker={this.hostsWorker}
                        toggleTranslation={this.toggleTranslation}
                        noTranslation={this.state.noTranslation}
                        themeType={this.state.themeType}
                        theme={this.state.theme}
                        expertMode={this.state.expertMode}
                        t={I18n.t}
                        navigate={Router.doNavigate}
                        currentHost={this.state.currentHost}
                        executeCommand={(cmd, host, cb) => this.executeCommand(cmd, host, cb)}
                        systemConfig={this.state.systemConfig}
                        showAdaptersWarning={this.showAdaptersWarning}
                        adminInstance={this.adminInstance}
                        onUpdating={updating => this.setState({ updating })}
                        instancesWorker={this.instancesWorker}
                    />
                </Suspense>;
            }
            const m = this.state.currentTab.tab.match(/^tab-([-\w\d]+)(-\d+)?$/);
            if (m) {
                // /adapter/javascript/tab.html
                return <Suspense fallback={<Connecting />}>
                    <CustomTab
                        key={this.state.currentTab.tab}
                        t={I18n.t}
                        protocol={this.state.protocol}
                        hostname={this.state.hostname}
                        port={this.state.port}
                        adminInstance={this.adminInstance}
                        hosts={this.state.hosts}
                        instancesWorker={this.instancesWorker}
                        tab={this.state.currentTab.tab}
                        themeName={this.state.themeName}
                        expertMode={this.state.expertMode}
                        lang={I18n.getLanguage()}
                        onRegisterIframeRef={ref => (this.refConfigIframe = ref)}
                        onUnregisterIframeRef={ref => {
                            if (this.refConfigIframe === ref) {
                                this.refConfigIframe = null;
                            }
                        }}
                    />
                </Suspense>;
            }
        }

        return null;
    }

    clearLogErrors = async () => {
        this.logsWorker.resetErrors();
        this.logsWorker.resetWarnings();
    };

    getCurrentDialog() {
        if (this.state && this.state.currentTab && this.state.currentTab.dialog) {
            if (this.state.currentTab.dialog === 'system') {
                return this.getSystemSettingsDialog();
            } if (this.state.currentTab.dialog === 'discovery') {
                return this.getDiscoveryModal();
            }
        }
        return null;
    }

    getSystemSettingsDialog() {
        return <SystemSettingsDialog
            adminGuiConfig={this.adminGuiConfig}
            width={this.props.width}
            currentHost={this.state.currentHost}
            themeName={this.state.themeName}
            themeType={this.state.themeType}
            theme={this.state.theme}
            key="systemSettings"
            onClose={async repoChanged => {
                Router.doNavigate(null);
                // read systemConfig anew
                const systemConfig = await this.socket.getObject('system.config');

                if (repoChanged) {
                    this.setState({ triggerAdapterUpdate: this.state.triggerAdapterUpdate + 1, systemConfig });
                } else {
                    this.setState({ systemConfig });
                }
            }}
            lang={this.state.lang}
            showAlert={(message, type) => this.showAlert(message, type)}
            socket={this.socket}
            currentTab={this.state.currentTab}
            instance={this.state.instance}
            expertModeFunc={value => {
                (window._sessionStorage || window.sessionStorage).removeItem('App.expertMode');
                const systemConfig = JSON.parse(JSON.stringify(this.state.systemConfig));
                systemConfig.common.expertMode = value;
                this.setState({ expertMode: value, systemConfig });
            }}
            t={I18n.t}
        />;
    }

    handleAlertClose(event, reason) {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ alert: false });
    }

    showAlert(alertMessage, alertType) {
        if (alertType !== 'error' && alertType !== 'warning' && alertType !== 'info' && alertType !== 'success') {
            alertType = 'info';
        }

        this.setState({
            alert: true,
            alertType,
            alertMessage,
        });
    }

    handleDrawerState(state) {
        (window._localStorage || window.localStorage).setItem('App.drawerState', state);
        this.setState({
            drawerState: state,
        });
    }

    static logout() {
        if (window.location.port === '3000') {
            window.location = `${window.location.protocol}//${window.location.hostname}:8081/logout?dev`;
        } else {
            window.location = `./logout?origin=${window.location.pathname}`;
        }
    }

    handleNavigation(tab) {
        if (tab) {
            if (this.state.allStored) {
                Router.doNavigate(tab);

                this.setState({ currentTab: Router.getLocation() });
            } else {
                this.setState({
                    dataNotStoredDialog: true,
                    dataNotStoredTab: tab,
                });
            }
        }

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            this.handleDrawerState(DrawerStates.closed);
        }

        tab = tab || (this.state.currentTab && this.state.currentTab.tab) || '';

        this.setTitle(tab.replace('tab-', ''));
    }

    allStored(value) {
        this.setState({
            allStored: value,
        });
    }

    closeDataNotStoredDialog() {
        this.setState({ dataNotStoredDialog: false });
    }

    confirmDataNotStored() {
        this.setState(
            {
                dataNotStoredDialog: false,
                allStored: true,
            },
            () => this.handleNavigation(this.state.dataNotStoredTab),
        );
    }

    executeCommand(cmd, host, callback) {
        if (typeof host === 'boolean') {
            callback = host;
            host = null;
        }

        if (this.state.performed || this.state.commandError) {
            this.setState(
                {
                    cmd: null,
                    cmdDialog: false,
                    commandError: false,
                    performed: false,
                    callback: false,
                    commandHost: null,
                },
                () =>
                    this.setState({
                        cmd,
                        cmdDialog: true,
                        callback,
                    }),
            );
            return;
        }
        console.log(`Execute: ${cmd}`);

        this.setState({
            cmd,
            cmdDialog: true,
            callback,
            commandHost: host || this.state.currentHost,
        });
    }

    closeCmdDialog(cb) {
        this.setState(
            {
                cmd: null,
                cmdDialog: false,
                commandError: false,
                performed: false,
                callback: false,
                commandHost: null,
            },
            () => cb && cb(),
        );
    }

    renderWizardDialog() {
        if (this.state.wizard) {
            return <WizardDialog
                executeCommand={(cmd, host, cb) => this.executeCommand(cmd, host, cb)}
                host={this.state.currentHost}
                socket={this.socket}
                themeName={this.state.themeName}
                toggleTheme={this.toggleTheme}
                lang={I18n.getLanguage()}
                onClose={redirect => {
                    this.setState({ wizard: false, showRedirect: redirect, redirectCountDown: 10 }, () => {
                        if (this.state.showRedirect) {
                            setInterval(() => {
                                if (this.state.redirectCountDown > 0) {
                                    this.setState({ redirectCountDown: this.state.redirectCountDown - 1 });
                                } else {
                                    window.location = this.state.showRedirect;
                                }
                            }, 1_000);
                        }
                    });
                }}
            />;
        }
        return null;
    }

    showRedirectDialog() {
        if (this.state.showRedirect) {
            return <Dialog
                open={!0}
                onClose={() => {
                // ignore. It can be closed only by button
                }}
            >
                <DialogTitle>{I18n.t('Waiting for admin restart...')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {I18n.t('Redirect in %s second(s)', this.state.redirectCountDown)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {window.sidebar ||
                    (window.opera && window.print) ||
                    (document.all && window.external?.AddFavorite) ? (
                            <Button
                                onClick={() => {
                                    if (window.sidebar) {
                                    // Firefox
                                        window.sidebar.addPanel('ioBroker.admin', this.state.showRedirect, '');
                                    } else if (window.opera && window.print) {
                                    // Opera
                                        const elem = document.createElement('a');
                                        elem.setAttribute('href', this.state.showRedirect);
                                        elem.setAttribute('title', 'ioBroker.admin');
                                        elem.setAttribute('rel', 'sidebar');
                                        elem.click(); // this.title=document.title;
                                    } else if (document.all) {
                                    // ie
                                        window.external.AddFavorite(this.state.showRedirect, 'ioBroker.admin');
                                    }
                                }}
                            >
                                {I18n.t('Bookmark admin')}
                            </Button>
                        ) : null}
                    {this.state.redirectCountDown ? (
                        <Button variant="contained" onClick={() => (window.location = this.state.showRedirect)}>
                            {I18n.t('Go to admin now')}
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>;
        }
        return null;
    }

    renderCommandDialog() {
        return this.state.cmd ? <CommandDialog
            onSetCommandRunning={commandRunning => this.setState({ commandRunning })}
            onClose={() => this.closeCmdDialog(() => this.setState({ commandRunning: false }))}
            visible={this.state.cmdDialog}
            callback={this.state.callback}
            header={I18n.t('Command')}
            onInBackground={() => this.setState({ cmdDialog: false })}
            cmd={this.state.cmd}
            errorFunc={() => this.setState({ commandError: true })}
            performed={() => this.setState({ performed: true })}
            inBackground={this.state.commandError || this.state.performed}
            commandError={this.state.commandError}
            socket={this.socket}
            host={this.state.commandHost || this.state.currentHost}
            ready={this.state.ready}
            t={I18n.t}
        /> : null;
    }

    renderLoggedUser() {
        if (this.state.user && this.props.width !== 'xs' && this.props.width !== 'sm') {
            return <div>
                {this.state.systemConfig.common.siteName ?
                    <div className={this.props.classes.siteName}>{this.state.systemConfig.common.siteName}</div> : null}

                <div
                    title={this.state.user.id}
                    className={Utils.clsx(
                        this.props.classes.userBadge,
                        this.state.user.invertBackground && this.props.classes.userBackground,
                    )}
                    ref={this.refUser}
                >
                    {this.state.user.icon ?
                        <Icon src={this.state.user.icon} className={this.props.classes.userIcon} />
                        :
                        <UserIcon className={this.props.classes.userIcon} />}
                    <div
                        ref={this.refUserDiv}
                        style={
                            this.state.expireWarningMode
                                ? { color: '#F44' }
                                : { color: this.state.user?.color || undefined }
                        }
                        className={this.props.classes.userText}
                    >
                        {this.state.user.name}
                    </div>

                    {this.state.expireWarningMode ? <IconButton
                        onClick={async () => {
                            await this.socket.getCurrentSession();
                            await this.makePingAuth();
                        }}
                    >
                        <UpdateIcon />
                    </IconButton> : null}
                </div>
            </div>;
        } if (this.props.width !== 'xs' && this.props.width !== 'sm' && this.state.systemConfig.common.siteName) {
            return <div className={this.props.classes.siteName}>{this.state.systemConfig.common.siteName}</div>;
        }
        return null;
    }

    renderAlertSnackbar() {
        return <Snackbar
            className={this.props.classes[`alert_${this.state.alertType}`]}
            open={this.state.alert}
            autoHideDuration={6000}
            onClose={() => this.handleAlertClose()}
            message={this.state.alertMessage}
        />;
    }

    renderConfirmDialog() {
        /* return <ConfirmDialog
            onClose={() => this.closeDataNotStoredDialog()}
            open={this.state.dataNotStoredDialog}
            header={I18n.t('Please confirm')}
            onConfirm={() => this.confirmDataNotStored()}
            confirmText={I18n.t('Ok')}
        >
            {I18n.t('Some data are not stored. Discard?')}
        </ConfirmDialog>; */
        return this.state.dataNotStoredDialog && <ConfirmDialog
            title={I18n.t('Please confirm')}
            text={I18n.t('Some data are not stored. Discard?')}
            ok={I18n.t('Ok')}
            cancel={I18n.t('Cancel')}
            onClose={isYes => (isYes ? this.confirmDataNotStored() : this.closeDataNotStoredDialog())}
        />;
    }

    renderExpertDialog() {
        if (!this.state.expertModeDialog) {
            return null;
        }
        return <ExpertModeDialog
            onClose={result => {
                if (result === 'openSettings') {
                    Router.doNavigate(null, 'system');
                } else if (result) {
                    (window._sessionStorage || window.sessionStorage).setItem(
                        'App.expertMode',
                        !this.state.expertMode,
                    );
                    this.refConfigIframe?.contentWindow?.postMessage(
                        'updateExpertMode',
                        '*',
                    );
                    this.setState({ expertModeDialog: false, expertMode: !this.state.expertMode });
                } else if (this.state.expertModeDialog) {
                    this.setState({ expertModeDialog: false });
                }
            }}
            expertMode={this.state.expertMode}
        />;
    }

    render() {
        const { classes } = this.props;
        const small = this.props.width === 'xs' || this.props.width === 'sm';

        if (this.state.cloudNotConnected) {
            return <StylesProvider generateClassName={generateClassName}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: this.state.themeType === 'dark' ? '#1a1a1a' : '#fafafa',
                                color: this.state.themeType === 'dark' ? '#fafafa' : '#1a1a1a',
                            }}
                        >
                            <div style={{ width: 300, height: 100 }}>
                                <CircularProgress />
                                <div style={{ fontSize: 16 }}>
                                    {I18n.t('Waiting for connection of ioBroker...')}
                                    {' '}
                                    <span style={{ fontSize: 18 }}>{this.state.cloudReconnect}</span>
                                </div>
                            </div>
                        </div>
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            </StylesProvider>;
        }

        if (this.state.hasGlobalError) {
            const message = this.state.hasGlobalError.message;
            const stack = this.state.hasGlobalError.stack;

            return <div
                style={{
                    textAlign: 'center',
                    fontSize: 22,
                    marginTop: 50,
                    height: 'calc(100% - 50px)',
                    overflow: 'auto',
                }}
            >
                <h1 style={{ color: '#F00' }}>Error in GUI!</h1>
                Please open the browser console (F12), copy error text from there and create the issue on
                {' '}
                <a href="https://github.com/ioBroker/ioBroker.admin/issues" target="_blank" rel="noreferrer">
                    github
                </a>
                <br />
                Without this information it is not possible to analyse the error.
                <br />
                It should looks like
                {' '}
                <br />
                <img src="img/browserError.png" alt="error" />
                <br />
                If in the second line you will see
                {' '}
                <code
                    style={{
                        style: '#888',
                        fontFamily: 'monospace',
                        fontSize: 16,
                    }}
                >
                    at :3000/static/js/main.chunk.js:36903
                </code>
                {' '}
                and not the normal file name,
                <br />
                please try to reproduce an error with opened browser console. In this case the special &quot;map&quot; files
                will be loaded and the developers can see the real name of functions and files.
                <div style={{ color: '#F88', fontSize: 14, marginTop: 20 }}>{message}</div>
                <pre
                    style={{
                        color: '#F88',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        textAlign: 'left',
                        marginTop: 20,
                        padding: 20,
                    }}
                >
                    {(stack || '').split('\n').join((line, i) => (
                        <div key={i}>
                            {line}
                            <br />
                        </div>
                    ))}
                </pre>
            </div>;
        }

        if (this.state.login) {
            return <StylesProvider generateClassName={generateClassName}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Login t={I18n.t} />
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            </StylesProvider>;
        } if (!this.state.ready && !this.state.updating) {
            return <StylesProvider generateClassName={generateClassName}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        {window.vendorPrefix === 'PT' ? <LoaderPT theme={this.state.themeType} /> : null}
                        {window.vendorPrefix === 'MV' ? <LoaderMV theme={this.state.themeType} /> : null}
                        {window.vendorPrefix &&
                        window.vendorPrefix !== 'PT' && window.vendorPrefix !== 'MV' &&
                        window.vendorPrefix !== '@@vendorPrefix@@' ? <LoaderVendor theme={this.state.themeType} /> : null}
                        {!window.vendorPrefix || window.vendorPrefix === '@@vendorPrefix@@' ? <Loader theme={this.state.themeType} /> : null}
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            </StylesProvider>;
        } if (this.state.strictEasyMode || this.state.currentTab.tab === 'easy') {
            return <StylesProvider generateClassName={generateClassName}>
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <div style={{ height: '100%' }}>
                            {!this.state.connected && <Connecting />}
                            <Suspense fallback={<Connecting />}>
                                <EasyMode
                                    navigate={Router.doNavigate}
                                    getLocation={Router.getLocation}
                                    location={this.state.currentTab}
                                    toggleTheme={this.toggleTheme}
                                    themeName={this.state.themeName}
                                    themeType={this.state.themeType}
                                    theme={this.state.theme}
                                    width={this.props.width}
                                    configs={this.state.easyModeConfigs}
                                    socket={this.socket}
                                    configStored={value => this.allStored(value)}
                                    isFloatComma={this.state.systemConfig?.common.isFloatComma}
                                    dateFormat={this.state.systemConfig?.common.dateFormat}
                                    systemConfig={this.state.systemConfig}
                                    t={I18n.t}
                                    lang={I18n.getLanguage()}
                                    onRegisterIframeRef={ref => (this.refConfigIframe = ref)}
                                    onUnregisterIframeRef={ref => {
                                        if (this.refConfigIframe === ref) {
                                            this.refConfigIframe = null;
                                        }
                                    }}
                                />
                            </Suspense>
                        </div>
                    </ThemeProvider>
                </StyledEngineProvider>
            </StylesProvider>;
        }

        const storedExpertMode = (window._sessionStorage || window.sessionStorage).getItem('App.expertMode');
        const expertModePermanent =
            !storedExpertMode || (storedExpertMode === 'true') === !!this.state.systemConfig.common.expertMode;

        return <StylesProvider generateClassName={generateClassName}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Paper elevation={0} className={classes.root}>
                        <AppBar
                            color="default"
                            position="fixed"
                            className={Utils.clsx(
                                classes.appBar,
                                !small && this.state.drawerState === DrawerStates.opened && !this.state.editMenuList && classes.appBarShift,
                                !small && this.state.drawerState === DrawerStates.opened && this.state.editMenuList && classes.appBarShiftEdit,
                                !small && this.state.drawerState === DrawerStates.compact && classes.appBarShiftCompact,
                            )}
                        >
                            <Toolbar>
                                <IconButton
                                    size="large"
                                    edge="start"
                                    className={Utils.clsx(
                                        classes.menuButton,
                                        !small && this.state.drawerState !== DrawerStates.closed && classes.hide,
                                    )}
                                    onClick={() => this.handleDrawerState(DrawerStates.opened)}
                                >
                                    <MenuIcon />
                                </IconButton>
                                <IconButton
                                    size="large"
                                    onClick={() => this.setState({ notificationsDialog: true })}
                                >
                                    <Tooltip title={I18n.t('Notifications')}>
                                        <Badge
                                            badgeContent={this.state.noNotifications}
                                            color="secondary"
                                        >
                                            <NotificationsIcon />
                                        </Badge>
                                    </Tooltip>
                                </IconButton>
                                <div className={classes.wrapperButtons}>
                                    <IsVisible name="admin.appBar.discovery" config={this.adminGuiConfig}>
                                        {this.state.discoveryAlive && <Tooltip title={I18n.t('Discovery devices')}>
                                            <IconButton
                                                size="large"
                                                onClick={() => Router.doNavigate(null, 'discovery')}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>}
                                    </IsVisible>
                                    <IsVisible name="admin.appBar.systemSettings" config={this.adminGuiConfig}>
                                        <Tooltip title={I18n.t('System settings')}>
                                            <IconButton
                                                size="large"
                                                onClick={() => Router.doNavigate(null, 'system')}
                                            >
                                                <BuildIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </IsVisible>
                                    {this.toggleThemePossible ? <IsVisible name="admin.appBar.toggleTheme" config={this.adminGuiConfig}>
                                        <ToggleThemeMenu
                                            size="large"
                                            toggleTheme={this.toggleTheme}
                                            themeName={this.state.themeName}
                                            t={I18n.t}
                                        />
                                    </IsVisible> : null}
                                    <IsVisible name="admin.appBar.expertMode" config={this.adminGuiConfig}>
                                        <Tooltip
                                            title={`${I18n.t('Toggle expert mode')} ${
                                                expertModePermanent
                                                    ? ''
                                                    : ` (${I18n.t('only in this browser session')})`
                                            }`}
                                        >
                                            <Badge
                                                color="secondary"
                                                variant="dot"
                                                classes={{ badge: this.props.classes.expertBadge }}
                                                invisible={expertModePermanent}
                                            >
                                                <IconButton
                                                    size="large"
                                                    onClick={() => {
                                                        if (
                                                            !!this.state.systemConfig.common.expertMode ===
                                                            !this.state.expertMode
                                                        ) {
                                                            (
                                                                window._sessionStorage || window.sessionStorage
                                                            ).setItem('App.expertMode', !this.state.expertMode);
                                                            this.setState({ expertMode: !this.state.expertMode });
                                                            this.refConfigIframe?.contentWindow?.postMessage(
                                                                'updateExpertMode',
                                                                '*',
                                                            );
                                                        } else if (
                                                            (window._sessionStorage || window.sessionStorage).getItem('App.doNotShowExpertDialog') === 'true'
                                                        ) {
                                                            (window._sessionStorage || window.sessionStorage).setItem('App.expertMode', !this.state.expertMode);
                                                            this.setState({ expertMode: !this.state.expertMode });
                                                            this.refConfigIframe?.contentWindow?.postMessage(
                                                                'updateExpertMode',
                                                                '*',
                                                            );
                                                        } else {
                                                            this.setState({ expertModeDialog: true });
                                                        }
                                                    }}
                                                    style={{
                                                        color: this.state.expertMode
                                                            ? this.state.theme.palette.expert
                                                            : undefined,
                                                    }}
                                                    color="default"
                                                >
                                                    <IconExpert
                                                        title={I18n.t('Toggle expert mode')}
                                                        glowColor={this.state.theme.palette.secondary.main}
                                                        active={this.state.expertMode}
                                                        className={Utils.clsx(
                                                            classes.expertIcon,
                                                            this.state.expertMode && classes.expertIconActive,
                                                        )}
                                                    />
                                                </IconButton>
                                            </Badge>
                                        </Tooltip>
                                    </IsVisible>
                                    {this.state.expertMode ?
                                        <Tooltip
                                            title={I18n.t(
                                                'Synchronize admin settings between all opened browser windows',
                                            )}
                                        >
                                            <IconButton
                                                size="large"
                                                onClick={e =>
                                                    (this.state.guiSettings
                                                        ? this.enableGuiSettings(false)
                                                        : this.setState({ showGuiSettings: e.target }))}
                                                style={{
                                                    color: this.state.guiSettings
                                                        ? this.state.theme.palette.expert
                                                        : undefined,
                                                }}
                                            >
                                                {this.state.guiSettings ? <SyncIcon /> : <SyncIconDisabled />}
                                            </IconButton>
                                        </Tooltip> : null}
                                    <IsVisible name="admin.appBar.hostSelector" config={this.adminGuiConfig}>
                                        <HostSelectors
                                            tooltip={
                                                this.state.currentTab.tab !== 'tab-instances' &&
                                                this.state.currentTab.tab !== 'tab-adapters' &&
                                                this.state.currentTab.tab !== 'tab-logs'
                                                    ? I18n.t(
                                                        'You can change host on Instances, Adapters or Logs pages',
                                                    )
                                                    : undefined
                                            }
                                            themeType={this.state.themeType}
                                            expertMode={this.state.expertMode}
                                            socket={this.socket}
                                            hostsWorker={this.hostsWorker}
                                            currentHost={this.state.currentHost}
                                            setCurrentHost={(hostName, host) => {
                                                this.setState(
                                                    {
                                                        currentHostName: hostName,
                                                        currentHost: host,
                                                    },
                                                    async () => {
                                                        this.logsWorkerChanged(host);
                                                        (window._localStorage || window.localStorage).setItem(
                                                            'App.currentHost',
                                                            host,
                                                        );

                                                        await this.readRepoAndInstalledInfo(host, this.state.hosts);
                                                        // read notifications from host
                                                        const notifications = await this.hostsWorker.getNotifications(host);
                                                        this.showAdaptersWarning(
                                                            notifications,
                                                            host,
                                                        );
                                                    },
                                                );
                                            }}
                                            disabled={
                                                this.state.currentTab.tab !== 'tab-instances' &&
                                                this.state.currentTab.tab !== 'tab-adapters' &&
                                                this.state.currentTab.tab !== 'tab-logs'
                                            }
                                        />
                                    </IsVisible>
                                    <div className={classes.flexGrow} />
                                    {this.state.cmd && !this.state.cmdDialog &&
                                        <IconButton size="large" onClick={() => this.setState({ cmdDialog: true })}>
                                            <PictureInPictureAltIcon
                                                className={
                                                    this.state.commandError
                                                        ? classes.errorCmd : (this.state.performed ? classes.performed : classes.cmd)
                                                }
                                            />
                                        </IconButton>}
                                </div>

                                {this.renderLoggedUser()}

                                {this.state.drawerState !== 0 &&
                                    !this.state.expertMode &&
                                    window.innerWidth > 400 &&
                                    <Grid
                                        container
                                        className={Utils.clsx(
                                            this.state.drawerState !== 0 && classes.avatarVisible,
                                            classes.avatarNotVisible,
                                        )}
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        {(!this.state.user ||
                                                this.props.width === 'xs' ||
                                                this.props.width === 'sm') &&
                                            <Hidden xsDown>
                                                <div className={classes.wrapperName}>
                                                    <Typography>admin</Typography>
                                                    {!this.adminGuiConfig.icon && this.state.versionAdmin && (
                                                        <Typography
                                                            className={classes.styleVersion}
                                                            style={{ color: this.state.themeType === 'dark' ? '#ffffff80' : '#00000080' }}
                                                        >
                                                            v
                                                            {this.state.versionAdmin}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </Hidden>}
                                        <Grid item>
                                            <a
                                                href="/#easy"
                                                onClick={event => event.preventDefault()}
                                                style={{ color: 'inherit', textDecoration: 'none' }}
                                            >
                                                {this.adminGuiConfig.icon ? <div
                                                    style={{
                                                        height: 50,
                                                        withWidth: 102,
                                                        lineHeight: '50px',
                                                        background: 'white',
                                                        borderRadius: 5,
                                                        padding: 5,
                                                    }}
                                                >
                                                    <img
                                                        src={this.adminGuiConfig.icon}
                                                        alt="logo"
                                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                                    />
                                                </div>
                                                    :
                                                    <Avatar
                                                        onClick={() => this.handleNavigation('easy')}
                                                        className={Utils.clsx(
                                                            (this.state.themeName === 'colored' ||
                                                                this.state.themeName === 'blue') &&
                                                                classes.logoWhite,
                                                        )}
                                                        alt="ioBroker"
                                                        src="img/no-image.png"
                                                    />}
                                            </a>
                                        </Grid>
                                    </Grid>}
                            </Toolbar>
                        </AppBar>
                        <DndProvider backend={!small ? HTML5Backend : TouchBackend}>
                            <Drawer
                                adminGuiConfig={this.adminGuiConfig}
                                state={this.state.drawerState}
                                editMenuList={this.state.editMenuList}
                                setEditMenuList={editMenuList => this.setState({ editMenuList })}
                                systemConfig={this.state.systemConfig}
                                handleNavigation={name => this.handleNavigation(name)}
                                onStateChange={state => this.handleDrawerState(state)}
                                onLogout={() => App.logout()}
                                currentTab={this.state.currentTab && this.state.currentTab.tab}
                                instancesWorker={this.instancesWorker}
                                hostsWorker={this.hostsWorker}
                                logsWorker={this.logsWorker}
                                logoutTitle={I18n.t('Logout')}
                                isSecure={this.socket.isSecure}
                                versionAdmin={this.state.versionAdmin}
                                t={I18n.t}
                                lang={I18n.getLanguage()}
                                socket={this.socket}
                                expertMode={this.state.expertMode}
                                ready={this.state.ready}
                                themeName={this.state.themeName}
                                themeType={this.state.themeType}
                                protocol={this.state.protocol}
                                hostname={this.state.hostname}
                                port={this.state.port}
                                adminInstance={this.adminInstance}
                                hosts={this.state.hosts}
                                repository={this.state.repository}
                                installed={this.state.installed}
                            />
                        </DndProvider>
                        <Paper
                            elevation={0}
                            square
                            className={Utils.clsx(
                                classes.content,
                                !small && this.state.drawerState !== DrawerStates.compact && !this.state.editMenuList && classes.contentMargin,
                                !small && this.state.drawerState !== DrawerStates.compact && this.state.editMenuList && classes.contentMarginEdit,
                                !small && this.state.drawerState !== DrawerStates.opened && classes.contentMarginCompact,
                                !small && this.state.drawerState !== DrawerStates.closed && classes.contentShift,
                            )}
                        >
                            {this.getCurrentTab()}
                        </Paper>
                        {this.renderAlertSnackbar()}
                    </Paper>
                    {this.renderExpertDialog()}
                    {this.getCurrentDialog()}
                    {this.renderConfirmDialog()}
                    {this.renderCommandDialog()}
                    {this.renderWizardDialog()}
                    {this.showRedirectDialog()}
                    {this.renderSlowConnectionWarning()}
                    {this.renderNewsDialog()}
                    {this.renderHostWarningDialog()}
                    {this.renderNotificationsDialog()}
                    {!this.state.connected && !this.state.redirectCountDown && !this.state.updating ? (
                        <Connecting />
                    ) : null}
                    {this.state.showGuiSettings ? <Menu
                        anchorEl={this.state.showGuiSettings}
                        open={!0}
                        onClose={() => this.setState({ showGuiSettings: null })}
                    >
                        <MenuItem
                            onClick={() => {
                                this.setState({ showGuiSettings: null });
                                this.enableGuiSettings(true);
                            }}
                        >
                            {I18n.t('Use settings of other browsers')}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                this.setState({ showGuiSettings: null });
                                this.enableGuiSettings(true, true);
                            }}
                        >
                            {I18n.t('Use settings of this browser')}
                        </MenuItem>
                        <MenuItem onClick={() => this.setState({ showGuiSettings: null })}>
                            <ListItemIcon>
                                <CancelIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>{I18n.t('Cancel')}</ListItemText>
                        </MenuItem>
                    </Menu> : null}
                </ThemeProvider>
            </StyledEngineProvider>
        </StylesProvider>;
    }
}

export default withWidth()(withStyles(styles)(App));
