import React, { type RefObject, Suspense, type JSX } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// @mui/material
import {
    AppBar,
    Avatar,
    Grid2 as Grid,
    IconButton,
    Paper,
    Snackbar,
    Toolbar,
    Typography,
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
    Box,
} from '@mui/material';

// @mui/icons-material
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

import { AdminConnection as Connection, type FilteredNotificationInformation, PROGRESS } from '@iobroker/socket-client';

import {
    LoaderPT,
    LoaderMV,
    LoaderVendor,
    Loader,
    I18n,
    Router,
    DialogConfirm,
    Icon,
    withWidth,
    Theme,
    IconExpert,
    ToggleThemeMenu,
    type IobTheme,
    type ThemeName,
    type AdminConnection,
    type ThemeType,
    Utils,
    dictionary,
} from '@iobroker/adapter-react-v5';

import NotificationsDialog from '@/dialogs/NotificationsDialog';
import type { AdminGuiConfig, CompactAdapterInfo, CompactHost, NotificationsCount } from '@/types';
import type { InstanceConfig } from '@/tabs/EasyMode';

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
import NewsAdminDialog, { checkMessages, type ShowMessage } from './dialogs/NewsAdminDialog';
import HostWarningDialog from './dialogs/HostWarningDialog';
import LogsWorker from './Workers/LogsWorker';
import InstancesWorker from './Workers/InstancesWorker';
import HostsWorker, { type HostEvent, type NotificationAnswer } from './Workers/HostsWorker';
import AdaptersWorker, { type AdapterEvent } from './Workers/AdaptersWorker';
import ObjectsWorker from './Workers/ObjectsWorker';
import DiscoveryDialog from './dialogs/DiscoveryDialog';
import SlowConnectionWarningDialog, { SlowConnectionWarningDialogClass } from './dialogs/SlowConnectionWarningDialog';
import IsVisible from './components/IsVisible';

import enLocal from './i18n/en.json';
import deLocal from './i18n/de.json';
import ruLocal from './i18n/ru.json';
import ptLocal from './i18n/pt.json';
import nlLocal from './i18n/nl.json';
import frLocal from './i18n/fr.json';
import itLocal from './i18n/it.json';
import esLocal from './i18n/es.json';
import plLocal from './i18n/pl.json';
import ukLocal from './i18n/uk.json';
import zhCNLocal from './i18n/zh-cn.json';

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

declare global {
    interface Window {
        _localStorage?: Storage;
        _sessionStorage?: Storage;

        sidebar?: {
            addPanel: (name: string, icon: string, element: React.ReactNode) => void;
        };
        opera: boolean;
    }
    interface Navigator {
        // @deprecated
        userLanguage: string;
    }
}

const query: { login?: boolean } = {};

(window.location.search || '')
    .replace(/^\?/, '')
    .split('&')
    .forEach(attr => {
        const parts = attr.split('=');
        if (!parts[0]) {
            return;
        }
        (query as Record<string, boolean | string>)[parts[0]] =
            parts[1] === undefined ? true : decodeURIComponent(parts[1]);
    });

const styles: Record<string, any> = {
    root: {
        display: 'flex',
        height: '100%',
    },
    appBar: (theme: IobTheme) => ({
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    }),
    logoWhite: {
        backgroundColor: '#FFFFFF',
    },
    appBarShift: (theme: IobTheme) => ({
        width: `calc(100% - ${DRAWER_FULL_WIDTH}px)`,
        ml: DRAWER_FULL_WIDTH / 8,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    appBarShiftEdit: (theme: IobTheme) => ({
        width: `calc(100% - ${DRAWER_EDIT_WIDTH}px)`,
        ml: DRAWER_EDIT_WIDTH / 8,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    appBarShiftCompact: (theme: IobTheme) => ({
        width: `calc(100% - ${DRAWER_COMPACT_WIDTH}px)`,
        ml: DRAWER_COMPACT_WIDTH / 8,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    menuButton: {
        marginRight: 16,
    },
    hide: {
        display: 'none',
    },
    content: (theme: IobTheme) => ({
        flexGrow: 1,
        padding: 1,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowY: 'auto',
        mt: `${theme.mixins.toolbar?.minHeight}px`,
        '@media (min-width:0px) and (orientation: landscape)': {
            // @ts-expect-error must be defined
            mt: theme.mixins.toolbar['@media (min-width:0px) and (orientation: landscape)']?.minHeight
                ? // @ts-expect-error must be defined
                  `${theme.mixins.toolbar['@media (min-width:0px) and (orientation: landscape)'].minHeight}px`
                : undefined,
        },
        '@media (min-width:600px)': {
            // @ts-expect-error must be defined
            mt: theme.mixins.toolbar['@media (min-width:600px)']?.minHeight
                ? // @ts-expect-error must be defined
                  `${theme.mixins.toolbar['@media (min-width:600px)'].minHeight}px`
                : undefined,
        },
    }),
    contentMargin: {
        ml: -DRAWER_FULL_WIDTH / 8,
    },
    contentMarginEdit: {
        ml: -DRAWER_EDIT_WIDTH / 8,
    },
    contentMarginCompact: {
        ml: -DRAWER_COMPACT_WIDTH / 8,
    },
    contentShift: (theme: IobTheme) => ({
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        ml: 0,
    }),
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
    errorCmd: {
        color: '#a90000',
        animation: '0.2s linear infinite alternate myEffect2',
    },
    performed: (theme: IobTheme) => ({
        color: theme.palette.mode === 'light' ? '#3bfd44' : '#388e3c',
        animation: '0.2s linear infinite alternate myEffect2',
    }),
    wrapperButtons: {
        display: 'flex',
        marginRight: 'auto',
        overflowY: 'auto',
        alignItems: 'center',
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
    userBackground: (theme: IobTheme) => ({
        borderRadius: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#EEE' : '#222',
        p: 0.5,
    }),
    styleVersion: {
        fontSize: 10,
    },
    wrapperName: {
        display: 'flex',
        flexDirection: 'column',
        marginRight: 10,
    },
    expertBadge: {
        mt: '11px',
        mr: '11px',
    },
    siteName: {
        lineHeight: '48px',
        fontSize: 24,
        marginLeft: 10,
        marginRight: 10,
        display: 'inline-block',
        verticalAlign: 'middle',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

interface ObjectGuiSettings extends ioBroker.StateObject {
    common: {
        name: ioBroker.StringOrTranslated;
        type: 'boolean';
        read: true;
        write: false;
        role: 'state';
    };
    native: {
        localStorage: Record<string, any>;
        sessionStorage: Record<string, any>;
        'App.drawerState'?: string;
    };
}

const DEFAULT_GUI_SETTINGS_OBJECT: ObjectGuiSettings = {
    _id: '',
    type: 'state',
    common: {
        name: 'Admin settings',
        type: 'boolean',
        read: true,
        write: false,
        role: 'state',
    },
    native: {
        localStorage: {},
        sessionStorage: {},
    },
};

interface AppProps {
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

type CompactRepository = Record<
    string,
    {
        icon: ioBroker.AdapterCommon['icon'];
        version: string;
    }
>;
type CompactInstalledInfo = Record<
    string,
    {
        version: string;
        ignoreVersion?: string;
    }
>;

interface AppState {
    connected: boolean;
    progress: number;
    ready: boolean;
    lang: ioBroker.Languages;
    expertMode: boolean;
    expertModeDialog?: boolean;
    showGuiSettings?: HTMLButtonElement | null;
    hosts: CompactHost[];
    currentHost: string;
    currentHostName: string;
    ownHost: string;
    currentTab: {
        tab: string;
        dialog?: string;
        id?: string;
        arg?: string;
    };
    systemConfig: ioBroker.SystemConfigObject;
    showHostWarning: {
        host: string;
        instances: Record<string, ioBroker.InstanceObject>;
        result: FilteredNotificationInformation;
    } | null;
    user: {
        id: string;
        name: string;
        color?: string;
        icon?: string;
        invertBackground: boolean;
    } | null;
    repository: CompactRepository;
    installed: CompactInstalledInfo;
    waitForRestart: boolean;
    tabs: any;
    config: Record<string, any>;
    stateChanged: boolean;
    theme: IobTheme;
    themeName: ThemeName;
    themeType: ThemeType;
    alert: boolean;
    alertType: 'error' | 'warning' | 'info' | 'success';
    alertMessage: string;
    drawerState: 0 | 1 | 2;
    editMenuList: boolean;
    tab: any;
    allStored: boolean;
    dataNotStoredDialog: boolean;
    dataNotStoredTab: {
        tab: string;
        subTab?: string;
        param?: string;
    } | null;
    baseSettingsOpened: boolean;
    unsavedDataInDialog: boolean;
    systemSettingsOpened: boolean;

    cmd: string | null;
    cmdDialog: boolean;
    commandHost: string | null;
    callback?: ((exitCode?: number) => void) | null;
    commandError: boolean;
    commandRunning: boolean;

    wizard: boolean;
    performed: boolean;
    discoveryAlive: boolean;
    readTimeoutMs: number;
    showSlowConnectionWarning: boolean;
    expireWarningMode: boolean;
    versionAdmin: string;
    forceUpdateAdapters: number;
    noTranslation: boolean;
    cloudNotConnected: boolean;
    cloudReconnect: number;
    showRedirect: string;
    redirectCountDown: number;
    triggerAdapterUpdate: number;
    updating: boolean;
    notificationsDialog: boolean;
    notifications: Record<string, any>;
    /** Number of active notifications */
    noNotifications: NotificationsCount;
    configNotSaved: boolean;
    login: boolean;
    hostname: string;
    hasGlobalError?: null | Error;
    guiSettings?: boolean;
    strictEasyMode?: boolean;
    easyModeConfigs?: InstanceConfig[];
    adapters: Record<string, CompactAdapterInfo>;
    showNews?: {
        checkNews: ShowMessage[];
        lastNewsId: string | undefined;
    } | null;
}

class App extends Router<AppProps, AppState> {
    private readonly translations: Record<ioBroker.Languages, Record<string, string>>;

    /** Seconds before logout to show warning */
    private readonly EXPIRE_WARNING_THRESHOLD: number = 120;

    private refConfigIframe: HTMLIFrameElement | null = null;

    private readonly refUser: RefObject<HTMLDivElement>;

    private readonly refUserDiv: RefObject<HTMLDivElement>;

    private expireInSec: number | null = null;

    private lastExecution: number = 0;

    private pingAuth: ReturnType<typeof setTimeout> | null = null;

    private expireInSecInterval: ReturnType<typeof setTimeout> | null = null;

    private readonly toggleThemePossible: boolean;

    private readonly expireText: string = I18n.t('Session expire in %s', '%s');

    private adminGuiConfig: AdminGuiConfig;

    private logsWorker: LogsWorker | null;

    private instancesWorker: InstancesWorker | null;

    private hostsWorker: HostsWorker | null;

    private adaptersWorker: AdaptersWorker | null;

    private objectsWorker: ObjectsWorker | null;

    private guiSettings: ObjectGuiSettings;

    private localStorageTimer: ReturnType<typeof setTimeout> | null = null;

    private languageSet: boolean;

    private socket: AdminConnection;

    private adminInstance: string = '';

    private newsInstance: number = 0;

    constructor(props: AppProps) {
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
        } catch {
            // ignore. FF could not redefine alert
        }

        // init translations
        this.translations = dictionary;

        const translations: Record<ioBroker.Languages, Record<string, string>> = {
            en: enLocal,
            de: deLocal,
            ru: ruLocal,
            pt: ptLocal,
            nl: nlLocal,
            fr: frLocal,
            it: itLocal,
            es: esLocal,
            pl: plLocal,
            uk: ukLocal,
            'zh-cn': zhCNLocal,
        };

        // merge together
        Object.keys(translations).forEach((lang: ioBroker.Languages) =>
            Object.assign(this.translations[lang], translations[lang]),
        );

        // init translations
        I18n.setTranslations(this.translations);
        I18n.setLanguage(
            (window.navigator.language || window.navigator.userLanguage || 'en')
                .substring(0, 2)
                .toLowerCase() as ioBroker.Languages,
        );

        this.refUser = React.createRef<HTMLDivElement>();
        this.refUserDiv = React.createRef<HTMLDivElement>();
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
            const drawerStateStr = (window._localStorage || window.localStorage).getItem('App.drawerState');
            let drawerState: 0 | 1 | 2;
            if (drawerStateStr) {
                drawerState = parseInt(drawerStateStr, 10) as 0 | 1 | 2;
            } else {
                drawerState = this.props.width === 'xs' ? (DrawerStates.closed as 1) : (DrawerStates.opened as 0);
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

                hostname: window.location.hostname,

                expertMode: false,

                hosts: [],
                currentHost: '',
                currentHostName: '',
                ownHost: '',
                currentTab: Router.getLocation(),
                systemConfig: null,
                user: null, // Logged in user

                repository: {},
                installed: {},

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
                dataNotStoredTab: null,

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

                readTimeoutMs: SlowConnectionWarningDialogClass.getReadTimeoutMs(),
                showSlowConnectionWarning: false,

                /** if true, shows the expiry warning (left time and update button) */
                expireWarningMode: false,

                versionAdmin: '',

                forceUpdateAdapters: 0,

                noTranslation: (window._localStorage || window.localStorage).getItem('App.noTranslation') !== 'false',

                cloudNotConnected: false,
                cloudReconnect: 0,

                showRedirect: '',
                redirectCountDown: 0,

                triggerAdapterUpdate: 0,

                updating: false, // js controller updating
                /** If the notification dialog should be shown */
                notificationsDialog: false,
                /** Notifications, excluding the system ones */
                notifications: {},
                /** Number of new notifications */
                noNotifications: {
                    warning: 0,
                    other: 0,
                },

                configNotSaved: false,
                login: false,
                showHostWarning: null,
                adapters: {},
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
            } as AppState;
        }
    }

    static getDerivedStateFromError(error: null | { message: string; stack: any }): {
        hasGlobalError: null | { message: string; stack: any };
    } {
        // Update state so the next render will show the fallback UI.
        return { hasGlobalError: error };
    }

    componentDidCatch(error: Error): void {
        this.setState({ hasGlobalError: error });
    }

    setUnsavedData(hasUnsavedData: boolean): void {
        if (hasUnsavedData !== this.state.unsavedDataInDialog) {
            this.setState({ unsavedDataInDialog: hasUnsavedData });
        }
    }

    // If the background color must be inverted. Depends on the current theme.
    mustInvertBackground(color: string): boolean {
        if (!color) {
            return false;
        }
        const invertedColor = Utils.invertColor(color, true);
        if (invertedColor === '#FFFFFF' && this.state.themeType === 'dark') {
            return true;
        }

        return invertedColor === '#000000' && this.state.themeType === 'light';
    }

    localStorageGetItem = (name: string): any => this.guiSettings.native.localStorage[name];

    localStorageSetItem = (name: string, value: any): void => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.localStorageRemoveItem(name);
            return;
        }
        this.guiSettings.native.localStorage[name] = value.toString();

        this.localStorageSave();
    };

    localStorageRemoveItem = (name: string): void => {
        if (Object.prototype.hasOwnProperty.call(this.guiSettings.native.localStorage, name)) {
            delete this.guiSettings.native.localStorage[name];
            this.localStorageSave();
        }
    };

    sessionStorageGetItem = (name: string): any => this.guiSettings.native.sessionStorage[name];

    sessionStorageSetItem = (name: string, value: any): void => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.sessionStorageRemoveItem(name);
            return;
        }
        this.guiSettings.native.sessionStorage[name] = value.toString();
        this.localStorageSave();
    };

    sessionStorageRemoveItem = (name: string): void => {
        if (Object.prototype.hasOwnProperty.call(this.guiSettings.native.sessionStorage, name)) {
            delete this.guiSettings.native.sessionStorage[name];
            this.localStorageSave();
        }
    };

    localStorageSave(): void {
        if (this.localStorageTimer) {
            clearTimeout(this.localStorageTimer);
        }
        this.localStorageTimer = setTimeout(async () => {
            this.localStorageTimer = null;
            await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, this.guiSettings);
        }, 200);
    }

    toggleTranslation = (): void => {
        (window._localStorage || window.localStorage).setItem(
            'App.noTranslation',
            this.state.noTranslation ? 'false' : 'true',
        );
        this.setState({ noTranslation: !this.state.noTranslation });
    };

    async getGUISettings(): Promise<void> {
        let obj;

        if (!this.adminInstance) {
            return;
        }

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
        } catch {
            state = { val: false };
        }
        if (state?.val) {
            this.guiSettings = obj;
            this.guiSettings.native = this.guiSettings.native || { localStorage: {}, sessionStorage: {} };
            if (!this.guiSettings.native.localStorage) {
                this.guiSettings.native = { localStorage: this.guiSettings.native, sessionStorage: {} };
            }

            // @ts-expect-error it is not full implementation of storage
            window._localStorage = {
                getItem: this.localStorageGetItem,
                setItem: this.localStorageSetItem,
                removeItem: this.localStorageRemoveItem,
            };
            // @ts-expect-error it is not full implementation of storage
            window._sessionStorage = {
                getItem: this.sessionStorageGetItem,
                setItem: this.sessionStorageSetItem,
                removeItem: this.sessionStorageRemoveItem,
            };

            // this is only settings that initialized before the connection was established
            const drawerStateStr = (window._localStorage || window.localStorage).getItem('App.drawerState');
            let drawerState: 0 | 1 | 2;
            if (drawerStateStr) {
                drawerState = parseInt(drawerStateStr, 10) as 0 | 1 | 2;
            } else {
                drawerState = this.props.width === 'xs' ? (DrawerStates.closed as 1) : (DrawerStates.opened as 0);
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

    enableGuiSettings(enabled: boolean, ownSettings?: boolean): void {
        if (enabled && !this.guiSettings) {
            void this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`).then(async obj => {
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
            void this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`).then(async obj => {
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
                    window.localStorage.setItem(name, this.guiSettings.native.localStorage[name]),
                );
                Object.keys(this.guiSettings.native.sessionStorage).forEach(name =>
                    window.sessionStorage.setItem(name, this.guiSettings.native.sessionStorage[name]),
                );

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

    componentDidMount(): void {
        if (!this.state.login) {
            window.addEventListener('hashchange', this.onHashChanged, false);

            if (!this.state.currentTab.tab) {
                this.handleNavigation('tab-intro');
            } else {
                this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
            }

            this.socket = new Connection({
                protocol: window.location.protocol,
                host: window.location.hostname,

                name: 'admin',
                admin5only: true,
                port: App.getPort(),
                autoSubscribes: ['system.adapter.*'], // Do not subscribe on '*' and really we don't need a 'system.adapter.*' too. Every tab must subscribe itself to everything that it needs
                autoSubscribeLog: true,
                onProgress: progress => {
                    if (progress === PROGRESS.CONNECTING) {
                        this.setState({
                            connected: false,
                        });
                    } else if (progress === PROGRESS.READY) {
                        // BF: (2022.05.09) here must be this.socket.getVersion(true), but I have no Idea, why it does not work :(
                        this.socket
                            .getVersion()
                            .then(async versionInfo => {
                                console.log(
                                    `Stored version: ${this.state.versionAdmin}, new version: ${versionInfo.version}`,
                                );
                                if (this.state.versionAdmin && this.state.versionAdmin !== versionInfo.version) {
                                    window.alert('New adapter version detected. Reloading...');
                                    setTimeout(() => window.location.reload(), 500);
                                }
                                if (!this.adminInstance) {
                                    this.adminInstance = await this.socket.getCurrentInstance();
                                }

                                // read settings anew
                                await this.getGUISettings();

                                const newState: Partial<AppState> = {
                                    connected: true,
                                    progress: 100,
                                    versionAdmin: versionInfo.version,
                                };

                                if (this.state.cmd && this.state.cmd.match(/ admin(@[-.\w]+)?$/)) {
                                    // close the command dialog after reconnecting (maybe admin was restarted, and update is now finished)
                                    newState.commandRunning = false;
                                    newState.forceUpdateAdapters = this.state.forceUpdateAdapters + 1;

                                    this.closeCmdDialog(() => {
                                        this.setState(newState as AppState);
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

                                    this.setState(newState as AppState);
                                }
                            })
                            .catch(err => {
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
                                }
                            });
                    } else {
                        this.setState({
                            connected: true,
                            progress: Math.round((PROGRESS.READY / progress) * 100),
                        });
                    }
                },
                onReady: async () => {
                    // Combine adminGuiConfig with user settings
                    this.adminGuiConfig = {
                        admin: {
                            menu: {},
                            settings: {},
                            adapters: {},
                            login: {},
                        },
                        ...this.socket.systemConfig.native?.vendor,
                    };
                    this.adminGuiConfig.admin.menu = this.adminGuiConfig.admin.menu || {};
                    this.adminGuiConfig.admin.settings = this.adminGuiConfig.admin.settings || {};
                    this.adminGuiConfig.admin.adapters = this.adminGuiConfig.admin.adapters || {};
                    this.adminGuiConfig.admin.login = this.adminGuiConfig.admin.login || {};

                    try {
                        if (!this.adminInstance) {
                            this.adminInstance = await this.socket.getCurrentInstance();
                        }
                        if (!this.adminInstance) {
                            console.error('Cannot read admin instance!');
                        }
                        const adminObj = await this.socket.getObject(`system.adapter.${this.adminInstance}`);
                        // use instance language
                        if (adminObj?.native?.language) {
                            I18n.setLanguage(adminObj.native.language);
                        } else {
                            I18n.setLanguage(this.socket.systemLang);
                        }

                        this.languageSet = true;
                        const isStrict = await this.socket.getIsEasyModeStrict();

                        await this.getGUISettings();

                        if (isStrict) {
                            const config = await this.socket.getEasyMode();
                            this.setState({
                                lang: this.socket.systemLang,
                                ready: true,
                                strictEasyMode: true,
                                easyModeConfigs: config.configs,
                            });
                            return;
                        }

                        // create Workers
                        this.logsWorker = this.logsWorker || new LogsWorker(this.socket, 1_000);
                        this.instancesWorker = this.instancesWorker || new InstancesWorker(this.socket);
                        this.hostsWorker = this.hostsWorker || new HostsWorker(this.socket);
                        this.adaptersWorker = this.adaptersWorker || new AdaptersWorker(this.socket);
                        this.objectsWorker = this.objectsWorker || new ObjectsWorker(this.socket);

                        const newState: Partial<AppState> = {
                            lang: this.socket.systemLang,
                            ready: true,
                        };

                        try {
                            newState.systemConfig = await this.socket.getCompactSystemConfig();
                            newState.wizard = !newState.systemConfig.common.licenseConfirmed;
                            await this.findCurrentHost(newState);
                            await this.readRepoAndInstalledInfo(newState.currentHost, newState.hosts);
                        } catch (e) {
                            console.log(`Error reading repo in onReady: ${e.stack}`);
                        }

                        this.adaptersWorker.registerRepositoryHandler(this.repoChangeHandler);
                        this.adaptersWorker.registerHandler(this.adaptersChangeHandler);
                        this.hostsWorker.registerHandler(this.updateHosts);
                        this.hostsWorker.registerNotificationHandler(this.handleNewNotifications);

                        const storedExpertMode = (window._sessionStorage || window.sessionStorage).getItem(
                            'App.expertMode',
                        );
                        newState.expertMode = storedExpertMode
                            ? storedExpertMode === 'true'
                            : !!newState.systemConfig.common.expertMode;

                        // Read user and show him
                        if (this.socket.isSecure || this.socket.systemConfig.native?.vendor) {
                            try {
                                const user = await this.socket.getCurrentUser();

                                const userObj = await this.socket.getObject(`system.user.${user}`);

                                if (userObj.native?.vendor) {
                                    Object.assign(this.adminGuiConfig, userObj.native.vendor);
                                }

                                if (this.socket.isSecure) {
                                    this.setState({
                                        user: {
                                            id: userObj._id,
                                            name: Utils.getObjectNameFromObj(userObj, this.socket.systemLang),
                                            color: userObj.common.color,
                                            icon: userObj.common.icon,
                                            invertBackground: this.mustInvertBackground(userObj.common.color),
                                        },
                                    });

                                    // start ping interval
                                    void this.makePingAuth();
                                }
                            } catch (e) {
                                console.error(`Could not determine user to show: ${e.toString()}, ${e.stack}`);
                                this.showAlert(e.toString(), 'error');
                            }
                        }

                        this.setState(newState as AppState, () => this.setCurrentTabTitle());

                        void this.socket.subscribeState('system.adapter.discovery.0.alive', this.onDiscoveryAlive);

                        // Give some time for communication
                        setTimeout(() => this.logsWorkerChanged(this.state.currentHost), 1000);

                        setTimeout(
                            () =>
                                this.findNewsInstance().then(instance => {
                                    this.newsInstance = instance;
                                    void this.socket.subscribeState(`admin.${instance}.info.newsFeed`, this.onNews);
                                }),
                            5_000,
                        );

                        setTimeout(async () => {
                            const notifications = await this.hostsWorker.getNotifications(newState.currentHost);
                            await this.handleNewNotifications(notifications);
                        }, 3_000);
                    } catch (e) {
                        console.error(`Error in onReady: ${e.stack}`);
                        this.showAlert(`Error in onReady: ${e.stack}`, 'error');
                    }
                },
                onError: (error: string | Error) => {
                    console.error(error);
                    let errorStr: string;
                    if (error instanceof Error) {
                        errorStr = error.message || error.toString();
                    } else {
                        errorStr = error.toString();
                    }
                    if (errorStr === 'ioBroker is not connected') {
                        if (!this.state.cloudNotConnected) {
                            this.showAlert(I18n.t(errorStr), 'error');
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
                        this.showAlert(errorStr, 'error');
                    }
                },
            });
        }
    }

    componentWillUnmount(): void {
        window.removeEventListener('hashchange', this.onHashChanged, false);
        this.socket?.unsubscribeState('system.adapter.discovery.0.alive', this.onDiscoveryAlive);

        this.adaptersWorker?.unregisterRepositoryHandler(this.repoChangeHandler);
        this.adaptersWorker?.unregisterHandler(this.adaptersChangeHandler);
        this.hostsWorker?.unregisterHandler(this.updateHosts);

        if (this.pingAuth) {
            clearTimeout(this.pingAuth);
            this.pingAuth = null;
        }
        if (this.expireInSecInterval) {
            clearInterval(this.expireInSecInterval);
            this.expireInSecInterval = null;
        }

        if (window._localStorage) {
            window._localStorage = null;
            window._sessionStorage = null;
        }
    }

    updateHosts = (events: HostEvent[]): void => {
        const hosts: CompactHost[] = JSON.parse(JSON.stringify(this.state.hosts));

        events.forEach((event: HostEvent): void => {
            const elementFind = hosts.find(host => host._id === event.id);
            if (elementFind) {
                const index = hosts.indexOf(elementFind);
                if (event.obj) {
                    // updated
                    hosts[index] = event.obj as CompactHost;
                } else {
                    // deleted
                    hosts.splice(index, 1);
                }
            } else {
                // new
                hosts.push(event.obj as CompactHost);
            }
        });

        this.setState({ hosts });
    };

    repoChangeHandler = (): void => {
        void this.readRepoAndInstalledInfo(this.state.currentHost, null, true).then(() => console.log('Repo updated!'));
    };

    adaptersChangeHandler = (events: AdapterEvent[]): void => {
        // update installed
        //
        const installed: CompactInstalledInfo = JSON.parse(JSON.stringify(this.state.installed));
        let changed = false;
        events.forEach(event => {
            const parts = event.id.split('.');
            const adapter = parts[2];
            if (event.type === 'deleted' || !event.obj) {
                if (installed[adapter]) {
                    changed = true;
                    delete installed[adapter];
                }
            } else if (installed[adapter]) {
                Object.keys(installed[adapter]).forEach(attr => {
                    if (
                        (installed[adapter] as Record<string, any>)[attr] !==
                        (event.obj.common as Record<string, any>)[attr]
                    ) {
                        (installed[adapter] as Record<string, any>)[attr] = (event.obj.common as Record<string, any>)[
                            attr
                        ];
                        changed = true;
                    }
                });
            } else {
                installed[adapter] = { version: event.obj.common.version };
                changed = true;
            }
        });

        if (changed) {
            this.setState({ installed });
        }
    };

    async findCurrentHost(newState: Partial<AppState>): Promise<void> {
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
            // find first the live host
            for (let h = 0; h < newState.hosts.length; h++) {
                alive = await this.socket.getState(`${newState.hosts[h]._id}.alive`);
                if (alive && alive.val) {
                    newState.currentHost = newState.hosts[h]._id;
                    newState.currentHostName = newState.hosts[h].common.name;
                }
            }
        }
    }

    updateExpireIn(): void {
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
            setTimeout(() => window.location.reload(), 1_000);
        }

        this.lastExecution = now;
    }

    /**
     * Start interval to handle logout after the session expires, this also refreshes the session
     */
    async makePingAuth(): Promise<void> {
        if (this.pingAuth) {
            clearTimeout(this.pingAuth);
            this.pingAuth = null;
        }

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
            setTimeout(() => window.location.reload(), 1_000);
        }
    }

    onDiscoveryAlive = (_name: string, value?: ioBroker.State | null): void => {
        if (!!value?.val !== this.state.discoveryAlive) {
            this.setState({ discoveryAlive: !!value?.val });
        }
    };

    getDiscoveryModal = (): JSX.Element => (
        <DiscoveryDialog
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
        />
    );

    async findNewsInstance(): Promise<number> {
        const maxCount = 200;
        for (let instance = 0; instance < maxCount; instance++) {
            try {
                const adminAlive = await this.socket.getState(`system.adapter.admin.${instance}.alive`);
                if (adminAlive?.val) {
                    return instance;
                }
            } catch (e) {
                console.error(`Cannot find news instance: ${e.stack}`);
                this.showAlert(`Cannot find news instance: ${e.stack}`, 'error');
            }
        }
        return 0;
    }

    /**
     * Render the notification dialog
     */
    renderNotificationsDialog(): JSX.Element | null {
        if (!this.state.notificationsDialog) {
            return null;
        }

        return (
            <NotificationsDialog
                notifications={this.state.notifications?.notifications || {}}
                instances={this.state.notifications?.instances || {}}
                onClose={() => this.setState({ notificationsDialog: false })}
                ackCallback={(host, name) => this.socket.clearNotifications(host, name)}
                dateFormat={this.state.systemConfig.common.dateFormat}
                isFloatComma={this.state.systemConfig.common.isFloatComma}
                themeType={this.state.themeType}
                themeName={this.state.themeName}
                theme={this.state.theme}
                socket={this.socket}
            />
        );
    }

    renderHostWarningDialog(): JSX.Element | null {
        if (!this.state.showHostWarning) {
            return null;
        }

        return (
            <HostWarningDialog
                instances={this.state.showHostWarning.instances}
                messages={this.state.showHostWarning.result.system.categories}
                dateFormat={this.state.systemConfig.common.dateFormat}
                themeType={this.state.themeType}
                ackCallback={name => this.socket.clearNotifications(this.state.showHostWarning.host, name)}
                onClose={() => this.setState({ showHostWarning: null })}
            />
        );
    }

    /** Called when notifications detected, updates the notification indicator */
    handleNewNotifications = async (notifications: Record<string, NotificationAnswer>): Promise<void> => {
        const noNotifications: NotificationsCount = {
            warning: 0,
            other: 0,
        };

        // if host is offline it returns null
        if (!notifications) {
            this.setState({ noNotifications, notifications: {} });
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
                        const isWarning = categoryDetails.severity === 'alert';
                        noNotifications[isWarning ? 'warning' : 'other'] += instanceDetails.messages.length;
                    }
                }
            }
        }

        const instances = await this.instancesWorker.getObjects();

        this.setState({ noNotifications, notifications: { notifications, instances } });
    };

    /**
     * Shows notifications to the user
     *
     * @param notifications present notifications
     * @param host host to get notifications from
     */
    showAdaptersWarning = async (
        notifications: Record<string, NotificationAnswer | null>,
        host: string,
    ): Promise<void> => {
        if (!notifications || !notifications[host] || !notifications[host].result) {
            return;
        }

        const result = notifications[host].result;

        if (result?.system && Object.keys(result.system.categories).length) {
            await this.instancesWorker.getObjects().then(instances =>
                this.setState({
                    showHostWarning: {
                        host,
                        instances,
                        result,
                    },
                }),
            );
        }
    };

    /**
     * Get news for specific adapter instance
     */
    onNews = async (_id: string, newsFeed: ioBroker.State): Promise<void> => {
        try {
            if (!this.state.systemConfig.common.licenseConfirmed) {
                return;
            }

            const lastNewsId = await this.socket.getState(`admin.${this.newsInstance}.info.newsLastId`);
            if (newsFeed?.val) {
                let news = null;
                try {
                    news = JSON.parse(newsFeed.val as string);
                } catch {
                    console.error(`Cannot parse news: ${newsFeed.val}`);
                }

                if (news?.length && news[0].id !== lastNewsId?.val) {
                    const uuid: string = await this.socket.getUuid();
                    const info = await this.socket.getHostInfo(this.state.currentHost).catch(() => null);

                    const instances = await this.socket.getCompactInstances().catch(() => null);

                    const objectsDbType = (await this.socket.getDiagData(this.state.currentHost, 'normal')).objectsType;

                    const objects = await this.objectsWorker.getObjects(true);
                    const noObjects = Object.keys(objects || {}).length;

                    const checkNews = checkMessages(news, lastNewsId?.val as string, {
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
                                checkNews,
                                lastNewsId: lastNewsId?.val as string,
                            },
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Could not process news: ${e.stack}`);
            this.showAlert(`Could not process news: ${e.stack}`, 'error');
        }
    };

    renderNewsDialog(): JSX.Element | null {
        if (!this.state.showNews) {
            return null;
        }
        return (
            <NewsAdminDialog
                newsArr={this.state.showNews.checkNews}
                current={this.state.showNews.lastNewsId}
                onSetLastNewsId={async id => {
                    if (id) {
                        await this.socket.setState(`admin.${this.newsInstance}.info.newsLastId`, {
                            val: id,
                            ack: true,
                        });
                    }
                    this.setState({ showNews: null });
                }}
            />
        );
    }

    renderSlowConnectionWarning(): JSX.Element | null {
        if (!this.state.showSlowConnectionWarning) {
            return null;
        }

        return (
            <SlowConnectionWarningDialog
                readTimeoutMs={this.state.readTimeoutMs}
                t={I18n.t}
                onClose={readTimeoutMs => {
                    if (readTimeoutMs) {
                        this.setState({ showSlowConnectionWarning: false, readTimeoutMs }, () =>
                            this.readRepoAndInstalledInfo(this.state.currentHost),
                        );
                    } else {
                        this.setState({ showSlowConnectionWarning: false });
                    }
                }}
            />
        );
    }

    async readRepoAndInstalledInfo(currentHost: string, hosts?: CompactHost[] | null, update?: boolean): Promise<void> {
        hosts = hosts || this.state.hosts;

        const repository: CompactRepository = await this.socket
            .getCompactRepository(currentHost, update, this.state.readTimeoutMs)
            .catch(e => {
                window.alert(`Cannot getRepositoryCompact: ${e}`);
                if (e.toString().includes('timeout')) {
                    this.setState({ showSlowConnectionWarning: true });
                }
                return {};
            });

        const installed: CompactInstalledInfo = await this.socket
            .getCompactInstalled(currentHost, update, this.state.readTimeoutMs)
            .catch(e => {
                window.alert(`Cannot getInstalled: ${e}`);
                if (e.toString().includes('timeout')) {
                    this.setState({ showSlowConnectionWarning: true });
                }
                return {};
            });

        const adapters: Record<string, CompactAdapterInfo> = await this.socket.getCompactAdapters(update).catch(e => {
            window.alert(`Cannot read adapters: ${e}`);
            return {} as Record<string, CompactAdapterInfo>;
        });

        if (installed && adapters) {
            Object.keys(adapters).forEach(id => {
                if (installed[id] && adapters[id].iv) {
                    installed[id].ignoreVersion = adapters[id].iv;
                }
            });
        }

        this.setState({
            repository,
            installed,
            hosts,
            adapters,
        });
    }

    logsWorkerChanged = (currentHost: string): void => {
        this.logsWorker?.setCurrentHost(currentHost);
    };

    /**
     * Updates the current currentTab in the states
     */
    onHashChanged = (): void => {
        this.setState({ currentTab: Router.getLocation() }, () => this.setCurrentTabTitle());
    };

    /**
     * Get the used port
     */
    static getPort(): number {
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
    private static getProtocol(): 'http:' | 'https:' {
        return window.location.protocol as 'http:' | 'https:';
    }

    /**
     * Get a theme
     */
    private static createTheme(name?: ThemeName): IobTheme {
        return Theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme name
     */
    private static getThemeName(theme: IobTheme): ThemeName {
        return theme.name;
    }

    /**
     * Get the theme type
     */
    private static getThemeType(theme: IobTheme): ThemeType {
        return theme.palette.mode;
    }

    /** Changes the current theme */
    toggleTheme = (currentThemeName?: ThemeName): void => {
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

    setCurrentTabTitle(): void {
        this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
    }

    setTitle(title: string): void {
        document.title = `${title} - ${this.state.currentHostName || 'ioBroker'}`;
    }

    getCurrentTab(): JSX.Element | null {
        if (this.state && this.state.currentTab && this.state.currentTab.tab) {
            if (this.state.currentTab.tab === 'tab-adapters') {
                const small = this.props.width === 'xs' || this.props.width === 'sm';
                const opened = !small && this.state.drawerState === DrawerStates.opened;
                const closed = small || this.state.drawerState === DrawerStates.closed;

                return (
                    <Suspense fallback={<Connecting />}>
                        <Adapters
                            theme={this.state.theme}
                            triggerUpdate={this.state.triggerAdapterUpdate}
                            key="adapters"
                            forceUpdateAdapters={this.state.forceUpdateAdapters}
                            adaptersWorker={this.adaptersWorker}
                            instancesWorker={this.instancesWorker}
                            themeType={this.state.themeType}
                            systemConfig={this.state.systemConfig}
                            socket={this.socket}
                            adminHost={this.state.ownHost}
                            hostsWorker={this.hostsWorker}
                            currentHost={this.state.currentHost}
                            ready={this.state.ready}
                            t={I18n.t}
                            lang={I18n.getLanguage()}
                            expertMode={this.state.expertMode}
                            executeCommand={(cmd: string, host?: string, callback?: (exitCode: number) => void) =>
                                this.executeCommand(cmd, host, callback)
                            }
                            commandRunning={this.state.commandRunning}
                            onSetCommandRunning={commandRunning => this.setState({ commandRunning })}
                            menuOpened={opened}
                            menuClosed={closed}
                            adminGuiConfig={this.adminGuiConfig}
                            toggleTranslation={this.toggleTranslation}
                            noTranslation={this.state.noTranslation}
                            adminInstance={this.adminInstance}
                            currentAdminVersion={this.state.versionAdmin}
                            onUpdating={updating => this.setState({ updating })}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-instances') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Instances
                            key="instances"
                            menuPadding={
                                this.state.drawerState === DrawerStates.closed
                                    ? 0
                                    : this.state.drawerState === DrawerStates.opened
                                      ? this.state.editMenuList
                                          ? DRAWER_EDIT_WIDTH
                                          : DRAWER_FULL_WIDTH
                                      : DRAWER_COMPACT_WIDTH
                            }
                            socket={this.socket}
                            instancesWorker={this.instancesWorker}
                            lang={I18n.getLanguage()}
                            hostname={this.state.hostname}
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
                            configStored={(value: boolean) => this.allStored(value)}
                            executeCommand={(cmd: string, host?: string, callback?: (exitCode: number) => void) =>
                                this.executeCommand(cmd, host, callback)
                            }
                            inBackgroundCommand={this.state.commandError || this.state.performed}
                            onRegisterIframeRef={(ref: HTMLIFrameElement) => (this.refConfigIframe = ref)}
                            onUnregisterIframeRef={(ref: HTMLIFrameElement) => {
                                if (this.refConfigIframe === ref) {
                                    this.refConfigIframe = null;
                                }
                            }}
                            handleNavigation={this.handleNavigation}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-intro') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Intro
                            key="intro"
                            hostname={this.state.hostname}
                            adminInstance={this.adminInstance}
                            instancesWorker={this.instancesWorker}
                            hostsWorker={this.hostsWorker}
                            showAlert={(message: string, type?: 'error' | 'warning' | 'info' | 'success') =>
                                this.showAlert(message, type)
                            }
                            socket={this.socket}
                            t={I18n.t}
                            lang={I18n.getLanguage()}
                            theme={this.state.theme}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-logs') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Logs
                            key="logs"
                            t={I18n.t}
                            width={this.props.width}
                            lang={this.state.lang}
                            socket={this.socket}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                            ready={this.state.ready}
                            logsWorker={this.logsWorker}
                            expertMode={this.state.expertMode}
                            currentHost={this.state.currentHost}
                            hostsWorker={this.hostsWorker}
                            clearErrors={() => this.clearLogErrors()}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-files') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Files
                            key="files"
                            ready={this.state.ready}
                            t={I18n.t}
                            expertMode={this.state.expertMode}
                            lang={I18n.getLanguage()}
                            socket={this.socket}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-users') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Users
                            key="users"
                            ready={this.state.ready}
                            t={I18n.t}
                            expertMode={this.state.expertMode}
                            lang={I18n.getLanguage()}
                            socket={this.socket}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-enums') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Enums
                            key="enums"
                            t={I18n.t}
                            lang={I18n.getLanguage()}
                            socket={this.socket}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-objects') {
                return (
                    <Suspense
                        fallback={<Connecting />}
                        key="objects"
                    >
                        <Objects
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
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-hosts') {
                return (
                    <Suspense fallback={<Connecting />}>
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
                            executeCommand={(cmd: string, host?: string, callback?: (exitCode: number) => void) =>
                                this.executeCommand(cmd, host, callback)
                            }
                            systemConfig={this.state.systemConfig}
                            showAdaptersWarning={this.showAdaptersWarning}
                            adminInstance={this.adminInstance}
                            onUpdating={(updating: boolean) => this.setState({ updating })}
                            instancesWorker={this.instancesWorker}
                        />
                    </Suspense>
                );
            }
            const m = this.state.currentTab.tab.match(/^tab-([-\w]+)(-\d+)?$/);
            if (m) {
                // /adapter/javascript/tab.html
                return (
                    <Suspense fallback={<Connecting />}>
                        <CustomTab
                            key={this.state.currentTab.tab}
                            t={I18n.t}
                            hostname={this.state.hostname}
                            adminInstance={this.adminInstance}
                            hosts={this.state.hosts}
                            instancesWorker={this.instancesWorker}
                            tab={this.state.currentTab.tab}
                            themeName={this.state.themeName}
                            expertMode={this.state.expertMode}
                            lang={I18n.getLanguage()}
                            onRegisterIframeRef={(ref: HTMLIFrameElement) => (this.refConfigIframe = ref)}
                            onUnregisterIframeRef={(ref: HTMLIFrameElement) => {
                                if (this.refConfigIframe === ref) {
                                    this.refConfigIframe = null;
                                }
                            }}
                        />
                    </Suspense>
                );
            }
        }

        return null;
    }

    clearLogErrors(): void {
        this.logsWorker.resetErrors();
        this.logsWorker.resetWarnings();
    }

    getCurrentDialog(): JSX.Element | null {
        if (this.state && this.state.currentTab && this.state.currentTab.dialog) {
            if (this.state.currentTab.dialog === 'system') {
                return this.getSystemSettingsDialog();
            }
            if (this.state.currentTab.dialog === 'discovery') {
                return this.getDiscoveryModal();
            }
        }

        return null;
    }

    getSystemSettingsDialog(): JSX.Element {
        return (
            <SystemSettingsDialog
                adminGuiConfig={this.adminGuiConfig}
                width={this.props.width}
                currentHost={this.state.currentHost}
                themeName={this.state.themeName}
                themeType={this.state.themeType}
                theme={this.state.theme}
                key="systemSettings"
                onClose={async (repoChanged?: boolean) => {
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
                socket={this.socket}
                currentTab={this.state.currentTab}
                expertModeFunc={(value: boolean) => {
                    (window._sessionStorage || window.sessionStorage).removeItem('App.expertMode');
                    const systemConfig = JSON.parse(JSON.stringify(this.state.systemConfig));
                    systemConfig.common.expertMode = value;
                    this.setState({ expertMode: value, systemConfig });
                }}
                t={I18n.t}
            />
        );
    }

    handleAlertClose(event?: string, reason?: string): void {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ alert: false });
    }

    showAlert(alertMessage: string | Error, alertType?: 'error' | 'warning' | 'info' | 'success'): void {
        if (alertType !== 'error' && alertType !== 'warning' && alertType !== 'info' && alertType !== 'success') {
            alertType = 'info';
        }
        let alertMessageStr: string;
        if (typeof alertMessage !== 'string') {
            if (alertMessage instanceof Error) {
                alertMessageStr = alertMessage.message || alertMessage.toString();
            } else if (alertMessage === null || alertMessage === undefined) {
                alertMessageStr = 'null';
            } else {
                alertMessageStr = (alertMessage as Error).toString();
            }
        } else {
            alertMessageStr = alertMessage;
        }

        this.setState({
            alert: true,
            alertType,
            alertMessage: alertMessageStr,
        });
    }

    handleDrawerState(state: 0 | 1 | 2): void {
        (window._localStorage || window.localStorage).setItem('App.drawerState', state.toString());
        this.setState({
            drawerState: state,
        });
    }

    static logout(): void {
        if (window.location.port === '3000') {
            window.location.href = `${window.location.protocol}//${window.location.hostname}:8081/logout?dev`;
        } else {
            window.location.href = `./logout?origin=${window.location.pathname}`;
        }
    }

    handleNavigation = (tab: string, subTab?: string, param?: string): void => {
        if (tab) {
            if (this.state.allStored) {
                Router.doNavigate(tab, subTab, param);

                this.setState({ currentTab: Router.getLocation() });
            } else {
                this.setState({
                    dataNotStoredDialog: true,
                    dataNotStoredTab: { tab, subTab, param },
                });
            }
        }

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            this.handleDrawerState(DrawerStates.closed as 1);
        }

        tab = tab || (this.state.currentTab && this.state.currentTab.tab) || '';

        this.setTitle(tab.replace('tab-', ''));
    };

    allStored(value: boolean): void {
        this.setState({
            allStored: value,
        });
    }

    closeDataNotStoredDialog(): void {
        this.setState({ dataNotStoredDialog: false });
    }

    confirmDataNotStored(): void {
        this.setState(
            {
                dataNotStoredDialog: false,
                allStored: true,
            },
            () =>
                this.handleNavigation(
                    this.state.dataNotStoredTab?.tab,
                    this.state.dataNotStoredTab?.subTab,
                    this.state.dataNotStoredTab?.param,
                ),
        );
    }

    executeCommand(cmd: string, host?: string, callback?: (exitCode: number) => void): void {
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
                    callback: null,
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

    closeCmdDialog(cb?: () => void): void {
        this.setState(
            {
                cmd: null,
                cmdDialog: false,
                commandError: false,
                performed: false,
                callback: null,
                commandHost: null,
            },
            () => cb && cb(),
        );
    }

    renderWizardDialog(): JSX.Element | null {
        if (this.state.wizard) {
            return (
                <WizardDialog
                    executeCommand={(cmd: string, host?: string, callback?: (exitCode: number) => void) =>
                        this.executeCommand(cmd, host, callback)
                    }
                    host={this.state.currentHost}
                    socket={this.socket}
                    themeName={this.state.themeName}
                    themeType={this.state.themeType}
                    toggleTheme={this.toggleTheme}
                    lang={I18n.getLanguage()}
                    onClose={(redirect?: string) => {
                        this.setState({ wizard: false, showRedirect: redirect, redirectCountDown: 10 }, () => {
                            if (this.state.showRedirect) {
                                setInterval(() => {
                                    if (this.state.redirectCountDown > 0) {
                                        this.setState({ redirectCountDown: this.state.redirectCountDown - 1 });
                                    } else {
                                        window.location.href = this.state.showRedirect;
                                    }
                                }, 1_000);
                            }
                        });
                    }}
                />
            );
        }
        return null;
    }

    showRedirectDialog(): JSX.Element | null {
        if (this.state.showRedirect) {
            return (
                <Dialog
                    open={!0}
                    onClose={() => {
                        // Ignore. It can be closed only by button
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
                        // @ts-expect-error ignore
                        (window.document.all && window.external?.AddFavorite) ? (
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
                                        // @ts-expect-error ignore
                                        window.external.AddFavorite(this.state.showRedirect, 'ioBroker.admin');
                                    }
                                }}
                            >
                                {I18n.t('Bookmark admin')}
                            </Button>
                        ) : null}
                        {this.state.redirectCountDown ? (
                            <Button
                                variant="contained"
                                onClick={() => (window.location.href = this.state.showRedirect)}
                            >
                                {I18n.t('Go to admin now')}
                            </Button>
                        ) : null}
                    </DialogActions>
                </Dialog>
            );
        }
        return null;
    }

    renderCommandDialog(): JSX.Element | null {
        return this.state.cmd ? (
            <CommandDialog
                onSetCommandRunning={(commandRunning: boolean) => this.setState({ commandRunning })}
                onClose={() => this.closeCmdDialog(() => this.setState({ commandRunning: false }))}
                visible={this.state.cmdDialog}
                callback={this.state.callback}
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
            />
        ) : null;
    }

    renderLoggedUser(): JSX.Element | null {
        if (this.state.user && this.props.width !== 'xs' && this.props.width !== 'sm') {
            return (
                <div>
                    {
                        // @ts-expect-error fixed in js-controller 7
                        this.state.systemConfig.common.siteName ? (
                            // @ts-expect-error fixed in js-controller 7
                            <div style={styles.siteName}>{this.state.systemConfig.common.siteName}</div>
                        ) : null
                    }

                    <Box
                        component="div"
                        title={this.state.user.id}
                        sx={{
                            ...styles.userBadge,
                            ...(this.state.user.invertBackground ? styles.userBackground : undefined),
                        }}
                        ref={this.refUser}
                    >
                        {this.state.user.icon ? (
                            <Icon
                                src={this.state.user.icon}
                                style={styles.userIcon}
                            />
                        ) : (
                            <UserIcon style={styles.userIcon} />
                        )}
                        <div
                            ref={this.refUserDiv}
                            style={{
                                ...styles.userText,
                                color: this.state.expireWarningMode ? '#F44' : this.state.user?.color || undefined,
                            }}
                        >
                            {this.state.user.name}
                        </div>

                        {this.state.expireWarningMode ? (
                            <IconButton
                                onClick={async () => {
                                    await this.socket.getCurrentSession();
                                    await this.makePingAuth();
                                }}
                            >
                                <UpdateIcon />
                            </IconButton>
                        ) : null}
                    </Box>
                </div>
            );
        }
        // @ts-expect-error fixed in js-controller 7
        if (this.props.width !== 'xs' && this.props.width !== 'sm' && this.state.systemConfig.common.siteName) {
            // @ts-expect-error fixed in js-controller 7
            return <div style={styles.siteName}>{this.state.systemConfig.common.siteName}</div>;
        }
        return null;
    }

    renderAlertSnackbar(): JSX.Element {
        return (
            <Snackbar
                style={styles[`alert_${this.state.alertType}`]}
                open={this.state.alert}
                autoHideDuration={6000}
                onClose={() => this.handleAlertClose()}
                message={this.state.alertMessage}
            />
        );
    }

    renderDialogConfirm(): JSX.Element | null {
        /* return <DialogConfirm
            onClose={() => this.closeDataNotStoredDialog()}
            open={this.state.dataNotStoredDialog}
            header={I18n.t('Please confirm')}
            onConfirm={() => this.confirmDataNotStored()}
            confirmText={I18n.t('Ok')}
        >
            {I18n.t('Some data are not stored. Discard?')}
        </DialogConfirm>; */
        return this.state.dataNotStoredDialog ? (
            <DialogConfirm
                title={I18n.t('Please confirm')}
                text={I18n.t('Some data are not stored. Discard?')}
                ok={I18n.t('Ok')}
                cancel={I18n.t('Cancel')}
                onClose={(isYes: boolean) => (isYes ? this.confirmDataNotStored() : this.closeDataNotStoredDialog())}
            />
        ) : null;
    }

    renderExpertDialog(): JSX.Element | null {
        if (!this.state.expertModeDialog) {
            return null;
        }
        return (
            <ExpertModeDialog
                onClose={result => {
                    if (result === 'openSettings') {
                        Router.doNavigate(null, 'system');
                    } else if (result) {
                        (window._sessionStorage || window.sessionStorage).setItem(
                            'App.expertMode',
                            this.state.expertMode ? 'false' : 'true',
                        );
                        this.refConfigIframe?.contentWindow?.postMessage('updateExpertMode', '*');
                        this.setState({ expertModeDialog: false, expertMode: !this.state.expertMode });
                    } else if (this.state.expertModeDialog) {
                        this.setState({ expertModeDialog: false });
                    }
                }}
                expertMode={this.state.expertMode}
            />
        );
    }

    renderShowGuiSettings(): JSX.Element | null {
        return this.state.showGuiSettings ? (
            <Menu
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
            </Menu>
        ) : null;
    }

    renderToolbar(small: boolean): JSX.Element {
        const storedExpertMode = (window._sessionStorage || window.sessionStorage).getItem('App.expertMode');
        const expertModePermanent =
            !storedExpertMode || (storedExpertMode === 'true') === !!this.state.systemConfig.common.expertMode;

        const performedStyle = Utils.getStyle(this.state.theme, styles.performed);
        const sumNotification = this.state.noNotifications.warning + this.state.noNotifications.other;

        return (
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    style={{
                        ...styles.menuButton,
                        ...(!small && this.state.drawerState !== DrawerStates.closed ? styles.hide : undefined),
                    }}
                    onClick={() => this.handleDrawerState(DrawerStates.opened as 0)}
                >
                    <MenuIcon />
                </IconButton>
                <div style={styles.wrapperButtons}>
                    <Tooltip
                        title={I18n.t('Notifications')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            size="large"
                            disableRipple={!sumNotification}
                            style={{ opacity: sumNotification ? 1 : 0.3 }}
                            onClick={sumNotification ? () => this.setState({ notificationsDialog: true }) : null}
                        >
                            <Badge
                                badgeContent={this.state.noNotifications.other + this.state.noNotifications.warning}
                                color={this.state.noNotifications.warning > 0 ? 'error' : 'secondary'}
                                max={99}
                            >
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <IsVisible
                        name="admin.appBar.discovery"
                        config={this.adminGuiConfig}
                    >
                        {this.state.discoveryAlive && (
                            <Tooltip
                                title={I18n.t('Discovery devices')}
                                slotProps={{ popper: { sx: styles.tooltip } }}
                            >
                                <IconButton
                                    size="large"
                                    onClick={() => Router.doNavigate(null, 'discovery')}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </IsVisible>
                    <IsVisible
                        name="admin.appBar.systemSettings"
                        config={this.adminGuiConfig}
                    >
                        <Tooltip
                            title={I18n.t('System settings')}
                            slotProps={{ popper: { sx: styles.tooltip } }}
                        >
                            <IconButton
                                size="large"
                                onClick={() => Router.doNavigate(null, 'system')}
                            >
                                <BuildIcon />
                            </IconButton>
                        </Tooltip>
                    </IsVisible>
                    {this.toggleThemePossible ? (
                        <IsVisible
                            name="admin.appBar.toggleTheme"
                            config={this.adminGuiConfig}
                        >
                            <ToggleThemeMenu
                                size="large"
                                toggleTheme={this.toggleTheme}
                                themeName={this.state.themeName as 'dark' | 'light' | 'colored' | 'blue'}
                                t={I18n.t}
                            />
                        </IsVisible>
                    ) : null}
                    <IsVisible
                        name="admin.appBar.expertMode"
                        config={this.adminGuiConfig}
                    >
                        <Tooltip
                            title={`${I18n.t('Toggle expert mode')} ${
                                expertModePermanent ? '' : ` (${I18n.t('only in this browser session')})`
                            }`}
                            slotProps={{ popper: { sx: styles.tooltip } }}
                        >
                            <Badge
                                color="secondary"
                                variant="dot"
                                sx={{ '& .MuiBadge-badge': styles.expertBadge }}
                                invisible={expertModePermanent}
                            >
                                <IconButton
                                    size="large"
                                    onClick={() => {
                                        if (!!this.state.systemConfig.common.expertMode === !this.state.expertMode) {
                                            (window._sessionStorage || window.sessionStorage).setItem(
                                                'App.expertMode',
                                                this.state.expertMode ? 'false' : 'true',
                                            );
                                            this.setState({ expertMode: !this.state.expertMode });
                                            this.refConfigIframe?.contentWindow?.postMessage('updateExpertMode', '*');
                                        } else if (
                                            (window._sessionStorage || window.sessionStorage).getItem(
                                                'App.doNotShowExpertDialog',
                                            ) === 'true'
                                        ) {
                                            (window._sessionStorage || window.sessionStorage).setItem(
                                                'App.expertMode',
                                                this.state.expertMode ? 'false' : 'true',
                                            );
                                            this.setState({ expertMode: !this.state.expertMode });
                                            this.refConfigIframe?.contentWindow?.postMessage('updateExpertMode', '*');
                                        } else {
                                            this.setState({ expertModeDialog: true });
                                        }
                                    }}
                                    style={{
                                        color: this.state.expertMode ? this.state.theme.palette.expert : undefined,
                                    }}
                                    color="default"
                                >
                                    <IconExpert
                                        // glowColor={this.state.theme.palette.secondary.main}
                                        // active={this.state.expertMode}
                                        style={{
                                            ...styles.expertIcon,
                                            ...(this.state.expertMode ? styles.expertIconActive : undefined),
                                        }}
                                    />
                                </IconButton>
                            </Badge>
                        </Tooltip>
                    </IsVisible>
                    {this.state.expertMode ? (
                        <Tooltip
                            title={I18n.t('Synchronize admin settings between all opened browser windows')}
                            slotProps={{ popper: { sx: styles.tooltip } }}
                        >
                            <IconButton
                                size="large"
                                onClick={e =>
                                    this.state.guiSettings
                                        ? this.enableGuiSettings(false)
                                        : this.setState({ showGuiSettings: e.target as HTMLButtonElement })
                                }
                                style={{
                                    color: this.state.guiSettings ? this.state.theme.palette.expert : undefined,
                                }}
                            >
                                {this.state.guiSettings ? <SyncIcon /> : <SyncIconDisabled />}
                            </IconButton>
                        </Tooltip>
                    ) : null}
                    <IsVisible
                        name="admin.appBar.hostSelector"
                        config={this.adminGuiConfig}
                    >
                        <HostSelectors
                            tooltip={
                                this.state.currentTab.tab !== 'tab-instances' &&
                                this.state.currentTab.tab !== 'tab-adapters' &&
                                this.state.currentTab.tab !== 'tab-logs'
                                    ? I18n.t('You can change host on Instances, Adapters or Logs pages')
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
                                        (window._localStorage || window.localStorage).setItem('App.currentHost', host);
                                        await this.readRepoAndInstalledInfo(host, this.state.hosts);
                                        // read notifications from host
                                        const notifications = await this.hostsWorker.getNotifications(host);
                                        await this.handleNewNotifications(notifications);
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
                    <div style={styles.flexGrow} />
                    {this.state.cmd && !this.state.cmdDialog && (
                        <IconButton
                            size="large"
                            onClick={() => this.setState({ cmdDialog: true })}
                        >
                            <PictureInPictureAltIcon
                                style={
                                    this.state.commandError
                                        ? styles.errorCmd
                                        : this.state.performed
                                          ? performedStyle
                                          : styles.cmd
                                }
                            />
                        </IconButton>
                    )}
                </div>

                {this.renderLoggedUser()}

                {this.state.drawerState !== DrawerStates.opened &&
                    !this.state.expertMode &&
                    window.innerWidth > 400 && (
                        <Grid
                            container
                            style={{
                                ...(this.state.drawerState !== DrawerStates.opened ? styles.avatarVisible : undefined),
                                ...styles.avatarNotVisible,
                            }}
                            spacing={1}
                            alignItems="center"
                        >
                            {(!this.state.user || this.props.width === 'xs' || this.props.width === 'sm') && (
                                <Box
                                    component="div"
                                    style={styles.wrapperName}
                                    sx={{ display: { md: 'inline-block', xs: 'none' } }}
                                >
                                    <Typography>admin</Typography>
                                    {!this.adminGuiConfig.icon && this.state.versionAdmin && (
                                        <Typography
                                            style={{
                                                ...styles.styleVersion,
                                                color: this.state.themeType === 'dark' ? '#ffffff80' : '#00000080',
                                            }}
                                        >
                                            v{this.state.versionAdmin}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                            <Grid>
                                <a
                                    href="/#easy"
                                    onClick={event => event.preventDefault()}
                                    style={{ color: 'inherit', textDecoration: 'none' }}
                                >
                                    {this.adminGuiConfig.icon ? (
                                        <div
                                            style={{
                                                height: 50,
                                                width: 102,
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
                                    ) : (
                                        <Avatar
                                            onClick={() => this.handleNavigation('easy')}
                                            style={
                                                this.state.themeName === 'colored' || this.state.themeName === 'blue'
                                                    ? styles.logoWhite
                                                    : undefined
                                            }
                                            alt="ioBroker"
                                            src="img/no-image.png"
                                        />
                                    )}
                                </a>
                            </Grid>
                        </Grid>
                    )}
            </Toolbar>
        );
    }

    renderSampleError(): JSX.Element {
        const message = this.state.hasGlobalError.message;
        const stack = this.state.hasGlobalError.stack;

        return (
            <div
                style={{
                    textAlign: 'center',
                    fontSize: 22,
                    marginTop: 50,
                    height: 'calc(100% - 50px)',
                    overflow: 'auto',
                }}
            >
                <h1 style={{ color: '#F00' }}>Error in GUI!</h1>
                Please open the browser console (F12), copy error text from there and create the issue on{' '}
                <a
                    href="https://github.com/ioBroker/ioBroker.admin/issues"
                    target="_blank"
                    rel="noreferrer"
                >
                    github
                </a>
                <br />
                Without this information it is not possible to analyse the error.
                <br />
                It should looks like <br />
                <img
                    src="img/browserError.png"
                    alt="error"
                />
                <br />
                If in the second line you will see{' '}
                <code
                    style={{
                        color: '#888',
                        fontFamily: 'monospace',
                        fontSize: 16,
                    }}
                >
                    at :3000/static/js/main.chunk.js:36903
                </code>{' '}
                and not the normal file name,
                <br />
                please try to reproduce an error with opened browser console. In this case the special &quot;map&quot;
                files will be loaded and the developers can see the real name of functions and files.
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
                    {(stack || '')
                        .toString()
                        .split('\n')
                        .map((line: string, i: number) => (
                            <div key={i}>
                                {line}
                                <br />
                            </div>
                        ))}
                </pre>
            </div>
        );
    }

    renderEasyMode(): JSX.Element {
        return (
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
                                adminInstance={this.adminInstance}
                                configs={this.state.easyModeConfigs}
                                socket={this.socket}
                                configStored={value => this.allStored(value)}
                                isFloatComma={this.state.systemConfig?.common.isFloatComma}
                                dateFormat={this.state.systemConfig?.common.dateFormat}
                                t={I18n.t}
                                lang={I18n.getLanguage()}
                                onRegisterIframeRef={ref => (this.refConfigIframe = ref)}
                                onUnregisterIframeRef={ref => {
                                    if (this.refConfigIframe === ref) {
                                        this.refConfigIframe = null;
                                    }
                                }}
                                handleNavigation={this.handleNavigation}
                            />
                        </Suspense>
                    </div>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }

    render(): JSX.Element {
        const small = this.props.width === 'xs' || this.props.width === 'sm';

        if (this.state.cloudNotConnected) {
            return (
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
                                    {I18n.t('Waiting for connection of ioBroker...')}{' '}
                                    <span style={{ fontSize: 18 }}>{this.state.cloudReconnect}</span>
                                </div>
                            </div>
                        </div>
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        if (this.state.hasGlobalError) {
            return this.renderSampleError();
        }

        if (this.state.login) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Login t={I18n.t} />
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }
        if (!this.state.ready && !this.state.updating) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        {window.vendorPrefix === 'PT' ? <LoaderPT themeType={this.state.themeType} /> : null}
                        {window.vendorPrefix === 'MV' ? <LoaderMV themeType={this.state.themeType} /> : null}
                        {window.vendorPrefix &&
                        window.vendorPrefix !== 'PT' &&
                        window.vendorPrefix !== 'MV' &&
                        window.vendorPrefix !== '@@vendorPrefix@@' ? (
                            <LoaderVendor themeType={this.state.themeType} />
                        ) : null}
                        {!window.vendorPrefix || window.vendorPrefix === '@@vendorPrefix@@' ? (
                            <Loader themeType={this.state.themeType} />
                        ) : null}
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }
        if (this.state.strictEasyMode || this.state.currentTab.tab === 'easy') {
            return this.renderEasyMode();
        }

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <style>
                        {`@keyframes myEffect2 {
                        0% {
                            opacity: 1;
                            transform: translateX(0);
                        }
                        100% {
                            opacity: 0.7;
                            transform: translateX(-2%);
                        }
                    }
                    @keyframes myEffect: {
                        0% {
                            opacity: 0.2;
                            transform: translateY(0);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(-10%);
                        }
                    }
                    `}
                    </style>
                    <Paper
                        elevation={0}
                        style={styles.root}
                    >
                        <AppBar
                            color="default"
                            position="fixed"
                            sx={Utils.getStyle(
                                this.state.theme,
                                styles.appBar,
                                !small &&
                                    this.state.drawerState === DrawerStates.opened &&
                                    !this.state.editMenuList &&
                                    styles.appBarShift,
                                !small &&
                                    this.state.drawerState === DrawerStates.opened &&
                                    this.state.editMenuList &&
                                    styles.appBarShiftEdit,
                                !small && this.state.drawerState === DrawerStates.compact && styles.appBarShiftCompact,
                            )}
                        >
                            {this.renderToolbar(small)}
                        </AppBar>
                        <DndProvider backend={!small ? HTML5Backend : TouchBackend}>
                            <Drawer
                                adminGuiConfig={this.adminGuiConfig}
                                state={this.state.drawerState}
                                editMenuList={this.state.editMenuList}
                                setEditMenuList={(editMenuList: boolean) => this.setState({ editMenuList })}
                                systemConfig={this.state.systemConfig}
                                handleNavigation={this.handleNavigation}
                                onStateChange={(state: 0 | 1 | 2) => this.handleDrawerState(state)}
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
                                hostname={this.state.hostname}
                                adminInstance={this.adminInstance}
                                hosts={this.state.hosts}
                                repository={this.state.repository}
                                installed={this.state.installed}
                                theme={this.state.theme}
                            />
                        </DndProvider>
                        <Paper
                            elevation={0}
                            square
                            id="app-paper"
                            sx={Utils.getStyle(
                                this.state.theme,
                                styles.content,
                                !small &&
                                    this.state.drawerState !== DrawerStates.compact &&
                                    !this.state.editMenuList &&
                                    styles.contentMargin,
                                !small &&
                                    this.state.drawerState !== DrawerStates.compact &&
                                    this.state.editMenuList &&
                                    styles.contentMarginEdit,
                                !small && this.state.drawerState !== DrawerStates.opened && styles.contentMarginCompact,
                                !small && this.state.drawerState !== DrawerStates.closed && styles.contentShift,
                            )}
                        >
                            {this.getCurrentTab()}
                        </Paper>
                        {this.renderAlertSnackbar()}
                    </Paper>
                    {this.renderExpertDialog()}
                    {this.getCurrentDialog()}
                    {this.renderDialogConfirm()}
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
                    {this.renderShowGuiSettings()}
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);
