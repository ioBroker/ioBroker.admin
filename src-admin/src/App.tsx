import React, { Suspense, type JSX } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// @mui/material
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    CssBaseline,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Alert,
    Snackbar,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

// @mui/icons-material
import {
    Menu as MenuIcon,
    Update as UpdateIcon,
    Visibility as VisibilityIcon,
    PictureInPictureAlt as PictureInPictureAltIcon,
    CloudSync as SyncIcon,
    SyncDisabled as SyncIconDisabled,
    Close as CancelIcon,
    Notifications as NotificationsIcon,
    Logout,
} from '@mui/icons-material';

import {
    AdminConnection as Connection,
    type FilteredNotificationInformation,
    type HostInfo,
    PROGRESS,
} from '@iobroker/socket-client';

import {
    Loader,
    I18n,
    Router,
    DialogConfirm,
    withWidth,
    Theme,
    IconExpert,
    ScrollbarStyles,
    ToggleThemeMenu,
    type IobTheme,
    type ThemeName,
    type AdminConnection,
    type ThemeType,
    Utils,
    dictionary,
} from '@iobroker/gui-components';

import NotificationsDialog from '@/dialogs/NotificationsDialog';
import type { AdminGuiConfig, CommandFile, CompactAdapterInfo, CompactHost, NotificationsCount } from '@/types';
import type { InstanceConfig } from '@/tabs/EasyMode';

import CommandDialog from './dialogs/CommandDialog';
import Drawer, {
    STATES as DrawerStates,
    type AdminTab,
    DRAWER_FULL_WIDTH,
    DRAWER_COMPACT_WIDTH,
    DRAWER_EDIT_WIDTH,
} from './components/Drawer';

import Connecting from './components/Connecting';

import WizardDialog from './dialogs/WizardDialog';
import SystemSettingsDialog from './components/SystemSettings';
import Login from './login/Login';
import HostSelectors from './components/HostSelectors';
import ExpertModeDialog from './dialogs/ExpertModeDialog';
import NewsAdminDialog, { checkMessages, type DbType, type ShowMessage } from './dialogs/NewsAdminDialog';
import HostWarningDialog from './dialogs/HostWarningDialog';
import { LogsWorker } from './Workers/LogsWorker';
import { InstancesWorker } from './Workers/InstancesWorker';
import { HostsWorker, type HostEvent, type NotificationAnswer } from './Workers/HostsWorker';
import { AdaptersWorker, type AdapterEvent } from './Workers/AdaptersWorker';
import { ObjectsWorker } from './Workers/ObjectsWorker';
import DiscoveryDialog from './dialogs/DiscoveryDialog';
import SlowConnectionWarningDialog, { SlowConnectionWarningDialogClass } from './dialogs/SlowConnectionWarningDialog';
import IsVisible from './components/IsVisible';
import ChatPanel from './components/Chat/ChatPanel';
import type { CompactInstanceInfo } from './components/Adapters/AdapterUpdateDialog';

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
/**
 * Tabs that get `menuButtonSpace` handed over and keep the upper left corner free themselves.
 * Every other tab - above all the custom tabs of the adapters - gets a strip above its content.
 */
const TABS_WITH_OWN_TOOLBAR = ['tab-overview', 'tab-adapters', 'tab-instances', 'tab-logs'];

const Overview = React.lazy(() => import('./tabs/Overview'));
const Adapters = React.lazy(() => import('./tabs/Adapters'));
const Instances = React.lazy(() => import('./tabs/Instances'));
const Intro = React.lazy(() => import('./tabs/Intro'));
const Logs = React.lazy(() => import('./tabs/Logs'));
const Files = React.lazy(() => import('./tabs/Files'));
const Objects = React.lazy(() => import('./tabs/Objects'));
const Users = React.lazy(() => import('./tabs/Users'));
const Enums = React.lazy(() => import('./tabs/Enums'));
const CustomTab = React.lazy(() => import('./tabs/CustomTab'));
const DeviceManagerTab = React.lazy(() => import('./tabs/ConfigManager'));
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
        // the tabs bring their own spacing at the top - a second one only wastes height
        paddingTop: 0,
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
    floatingButtons: {
        position: 'fixed',
        top: 4,
        left: 4,
        zIndex: 1200,
        display: 'flex',
        gap: 0.5,
    },
    /**
     * Without an app bar the content starts at the very top - the three breakpoints of
     *  `mixins.toolbar` in `content` all have to be overridden
     */
    contentNoAppBar: {
        mt: 0,
        '@media (min-width:0px) and (orientation: landscape)': { mt: 0 },
        '@media (min-width:600px)': { mt: 0 },
    },
    /**
     * Room for the floating menu button on tabs that cannot make room for it themselves (custom
     * tabs of adapters, mostly iframes). A strip above the content, not an indent on the left:
     * indenting would push the whole page aside instead of just the toolbar row.
     */
    contentMenuButtonSpace: {
        pt: '44px',
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
    /** Px reserved on the right for the docked chat assistant (0 = overlay/closed). */
    chatDockWidth: number;
    /** MCP/AI assistant disabled in admin settings (`native.disableMcp`); `undefined` until read, so the launcher stays hidden until the value is known. */
    disableMcp?: boolean;
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
    /** Null until the configuration has been read - the app renders before that */
    systemConfig: ioBroker.SystemConfigObject | null;
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
        /** Name of the leading group, shown below the name in the menu */
        group?: string;
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
    /** Optional files (base64) to send along with the current command */
    cmdFiles?: CommandFile[] | null;
    callback?: ((exitCode?: number) => void) | null;
    commandError: boolean;
    commandRunning: boolean;

    wizard: boolean;
    performed: boolean;
    discoveryAlive: boolean;
    readTimeoutMs: number;
    showSlowConnectionWarning: boolean;
    versionAdmin: string;
    forceUpdateAdapters: number;
    noTranslation: boolean;
    cloudNotConnected: boolean;
    cloudReconnect: number;
    showRedirect: string | undefined;
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
    askForTokenRefresh: { expireAt: number; resolve: (prolong: boolean) => void; doNotAsk: boolean } | null;
}

class App extends Router<AppProps, AppState> {
    private readonly translations: Record<ioBroker.Languages, Record<string, string>>;
    private _tempAllStored = true;
    private refConfigIframe: HTMLIFrameElement | null = null;
    private expireInSecInterval: ReturnType<typeof setInterval> | null = null;
    private readonly toggleThemePossible: boolean;
    private adminGuiConfig: AdminGuiConfig;
    private logsWorker: LogsWorker | null = null;
    private instancesWorker: InstancesWorker | null = null;
    private hostsWorker: HostsWorker | null = null;
    private adaptersWorker: AdaptersWorker | null = null;
    private objectsWorker: ObjectsWorker | null = null;
    private guiSettings: ObjectGuiSettings | null = null;
    private localStorageTimer: ReturnType<typeof setTimeout> | null = null;
    private languageSet: boolean = false;
    private socket: AdminConnection | null = null;
    private adminInstance: string = '';
    private newsInstance: number = 0;
    private doNotAskSessionExpiration: number = 0;
    private tabsInfo: AdminTab[] | null = null;

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
        Object.keys(translations).forEach(lang =>
            Object.assign(this.translations[lang as ioBroker.Languages], translations[lang as ioBroker.Languages]),
        );

        // init translations
        I18n.extendTranslations(this.translations);
        I18n.setLanguage(
            (window.navigator.language || window.navigator.userLanguage || 'en')
                .substring(0, 2)
                .toLowerCase() as ioBroker.Languages,
        );

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

            // install setter for configNotSaved (used in JavaScript)
            Object.defineProperty(window, 'configNotSaved', {
                get: () => this.state.configNotSaved,
                set: configNotSaved => {
                    const allStored = !configNotSaved;
                    if (allStored !== this._tempAllStored) {
                        this._tempAllStored = allStored;
                        this.forceUpdate();
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
                chatDockWidth: 0,

                hosts: [],
                currentHost: '',
                currentHostName: '',
                ownHost: '',
                currentTab: Router.getLocation(),
                systemConfig: null,
                user: null, // Logged-in user

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
                askForTokenRefresh: null,
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
        // Update the state so the next render will show the fallback UI.
        return { hasGlobalError: error };
    }

    componentDidCatch(error: Error): void {
        this.setState({ hasGlobalError: error });
    }

    /**
     * Check if SSO response parameters are present in the URL.
     */
    static checkSsoResponse(): void {
        // Due to the fact that the SSO process can only provide its parameters via a callback uri, we need to extract from the search parameters
        const searchParams = new URLSearchParams(window.location.search);

        if (searchParams.has('id_token')) {
            window.localStorage.setItem('oidc_id_token', searchParams.get('id_token') as string);
            window.location.search = '';
        }

        if (searchParams.has('ssoLoginResponse')) {
            const res = JSON.parse(searchParams.get('ssoLoginResponse') as string);
            Connection.saveTokensStatic(res, true);
            window.location.search = '';
        }
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

    localStorageGetItem = (name: string): any => this.guiSettings?.native.localStorage[name];

    localStorageSetItem = (name: string, value: any): void => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.localStorageRemoveItem(name);
            return;
        }
        if (this.guiSettings) {
            this.guiSettings.native.localStorage[name] = value.toString();
        }

        this.localStorageSave();
    };

    localStorageRemoveItem = (name: string): void => {
        if (this.guiSettings && Object.prototype.hasOwnProperty.call(this.guiSettings.native.localStorage, name)) {
            delete this.guiSettings.native.localStorage[name];
            this.localStorageSave();
        }
    };

    sessionStorageGetItem = (name: string): any => this.guiSettings?.native.sessionStorage[name];

    sessionStorageSetItem = (name: string, value: any): void => {
        if (value === null) {
            value = 'null';
        } else if (value === undefined) {
            this.sessionStorageRemoveItem(name);
            return;
        }
        if (this.guiSettings) {
            this.guiSettings.native.sessionStorage[name] = value.toString();
        }
        this.localStorageSave();
    };

    sessionStorageRemoveItem = (name: string): void => {
        if (this.guiSettings && Object.prototype.hasOwnProperty.call(this.guiSettings.native.sessionStorage, name)) {
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
            if (this.guiSettings && this.socket) {
                await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, this.guiSettings);
            }
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
        let obj: ObjectGuiSettings | null | undefined = null;

        if (!this.adminInstance || !this.socket) {
            return;
        }

        try {
            obj = (await this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`)) as
                ObjectGuiSettings | null | undefined;
        } catch (e) {
            console.warn(`Could not get "system.adapter.${this.adminInstance}.guiSettings": ${(e as Error).message}`);
        }

        if (!obj) {
            obj = JSON.parse(JSON.stringify(DEFAULT_GUI_SETTINGS_OBJECT));
            try {
                await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, obj!);
            } catch (e) {
                console.warn(
                    `Could not update "system.adapter.${this.adminInstance}.guiSettings": ${(e as Error).message}`,
                );
            }
        }

        let state;
        try {
            state = await this.socket.getState(`system.adapter.${this.adminInstance}.guiSettings`);
        } catch {
            state = { val: false };
        }
        if (state?.val) {
            this.guiSettings = obj || JSON.parse(JSON.stringify(DEFAULT_GUI_SETTINGS_OBJECT));
            this.guiSettings!.native ||= { localStorage: {}, sessionStorage: {} };
            if (!this.guiSettings!.native.localStorage) {
                this.guiSettings!.native = { localStorage: this.guiSettings!.native, sessionStorage: {} };
            }

            // @ts-expect-error it is not a full implementation of storage
            window._localStorage = {
                getItem: this.localStorageGetItem,
                setItem: this.localStorageSetItem,
                removeItem: this.localStorageRemoveItem,
            };
            // @ts-expect-error it is not a full implementation of storage
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
            window._localStorage = undefined;
            window._sessionStorage = undefined;

            this.setState({ guiSettings: false });
        }
    }

    async enableGuiSettings(enabled: boolean, ownSettings?: boolean): Promise<void> {
        if (enabled && !this.guiSettings && this.socket) {
            const obj = await this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`);
            this.guiSettings = obj || JSON.parse(JSON.stringify(DEFAULT_GUI_SETTINGS_OBJECT));

            if (ownSettings || !this.guiSettings!.native || !Object.keys(this.guiSettings!.native).length) {
                this.guiSettings!.native = { localStorage: {}, sessionStorage: {} };
                Object.keys(window.localStorage).forEach(name => {
                    if (
                        name !== 'getItem' &&
                        name !== 'setItem' &&
                        name !== 'removeItem' &&
                        name !== 'clear' &&
                        name !== 'key' &&
                        name !== 'length'
                    ) {
                        this.guiSettings!.native.localStorage[name] = window.localStorage.getItem(name);
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
                        this.guiSettings!.native.sessionStorage[name] = window.sessionStorage.getItem(name);
                    }
                });
                await this.socket.setObject(`system.adapter.${this.adminInstance}.guiSettings`, this.guiSettings!);
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
        } else if (!enabled && this.guiSettings && this.socket) {
            const obj = await this.socket.getObject(`system.adapter.${this.adminInstance}.guiSettings`);
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
            window._localStorage = undefined;
            window._sessionStorage = undefined;

            // clear localStorage
            Object.keys(window.localStorage).forEach(key => window.localStorage.removeItem(key));
            Object.keys(window.sessionStorage).forEach(key => window.sessionStorage.removeItem(key));

            Object.keys(this.guiSettings.native.localStorage).forEach(name =>
                window.localStorage.setItem(name, this.guiSettings!.native.localStorage[name]),
            );
            Object.keys(this.guiSettings.native.sessionStorage).forEach(name =>
                window.sessionStorage.setItem(name, this.guiSettings!.native.sessionStorage[name]),
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
        }
    }

    componentDidMount(): void {
        // check if we are mounted as SSO response
        App.checkSsoResponse();

        if (!this.state.login) {
            window.addEventListener('hashchange', this.onHashChanged, false);

            if (!this.state.currentTab.tab) {
                this.handleNavigation('tab-overview');
            } else {
                this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
            }

            this.socket = new Connection({
                protocol: window.location.protocol as 'http:' | 'https:',
                host: window.location.hostname,
                name: 'admin',
                admin5only: true,
                port: App.getPort(),
                autoSubscribes: ['system.adapter.*'], // Do not subscribe on '*' and really we don't need a 'system.adapter.*' either. Every tab must subscribe itself to everything that it needs
                autoSubscribeLog: true,
                tokenTimeoutHandler: this.onSessionExpiration,
                onProgress: async (progress: number): Promise<void> => {
                    if (!this.socket) {
                        return;
                    }
                    if (progress === PROGRESS.CONNECTING) {
                        this.setState({
                            connected: false,
                        });
                    } else if (progress === PROGRESS.READY) {
                        // BF: (2022.05.09) here must be this.socket.getVersion(true), but I have no idea why it does not work :(
                        try {
                            const versionInfo = await this.socket.getVersion();
                            console.log(
                                `Stored version: ${this.state.versionAdmin}, new version: ${versionInfo.version}`,
                            );
                            if (this.state.versionAdmin && this.state.versionAdmin !== versionInfo.version) {
                                window.alert('New adapter version detected. Reloading...');
                                setTimeout(() => window.location.reload(), 500);
                            }
                            this.adminInstance ||= await this.socket.getCurrentInstance();

                            // read settings anew
                            await this.getGUISettings();

                            const newState: Partial<AppState> = {
                                connected: true,
                                progress: 100,
                                versionAdmin: versionInfo.version,
                                // Default to enabled; overridden from the admin settings below. Setting it
                                // together with `connected` avoids briefly showing the assistant launcher.
                                disableMcp: false,
                            };

                            if (this.state.cmd?.match(/ admin(@[-.\w]+)?$/)) {
                                // close the command dialog after reconnecting (maybe admin was restarted, and the update is now finished)
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
                                    // Hide the AI assistant launcher when MCP is disabled in the settings.
                                    newState.disableMcp = !!adminObj?.native?.disableMcp;
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
                        } catch (err) {
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
                        }
                    } else {
                        this.setState({
                            connected: true,
                            progress: Math.round((PROGRESS.READY / progress) * 100),
                        });
                    }
                },
                onReady: async () => {
                    if (!this.socket) {
                        throw new Error('Socket not initialized');
                    }
                    // Combine adminGuiConfig with user settings
                    this.adminGuiConfig = {
                        admin: {
                            menu: {},
                            settings: {},
                            adapters: {},
                            login: {},
                        },
                        ...this.socket?.systemConfig?.native?.vendor,
                    };
                    this.adminGuiConfig.admin!.menu ||= {};
                    this.adminGuiConfig.admin!.settings ||= {};
                    this.adminGuiConfig.admin!.adapters ||= {};
                    this.adminGuiConfig.admin!.login ||= {};

                    try {
                        this.adminInstance ||= await this.socket.getCurrentInstance();
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
                        this.logsWorker ||= new LogsWorker(this.socket, 1_000);
                        this.instancesWorker ||= new InstancesWorker(this.socket);
                        this.hostsWorker ||= new HostsWorker(this.socket);
                        this.adaptersWorker ||= new AdaptersWorker(this.socket);
                        this.objectsWorker ||= new ObjectsWorker(this.socket);

                        const newState: Partial<AppState> = {
                            lang: this.socket.systemLang,
                            ready: true,
                        };

                        try {
                            newState.systemConfig = await this.socket.getCompactSystemConfig();
                            newState.wizard = !newState.systemConfig.common.licenseConfirmed;
                            await this.findCurrentHost(newState);
                            if (newState.currentHost) {
                                await this.readRepoAndInstalledInfo(newState.currentHost, newState.hosts);
                            }
                        } catch (e) {
                            console.log(`Error reading repo in onReady: ${(e as Error).stack}`);
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
                            : !!newState.systemConfig?.common.expertMode;

                        // Read the user and show him
                        if (this.socket.isSecure || this.socket.systemConfig?.native?.vendor) {
                            try {
                                const user = await this.socket.getCurrentUser();

                                const userObj = await this.socket.getObject(`system.user.${user}`);

                                if (userObj?.native?.vendor) {
                                    Object.assign(this.adminGuiConfig, userObj.native.vendor);
                                }

                                if (this.socket.isSecure && userObj) {
                                    this.setState({
                                        user: {
                                            id: userObj._id,
                                            name: Utils.getObjectNameFromObj(userObj, this.socket.systemLang),
                                            color: userObj.common.color,
                                            icon: userObj.common.icon,
                                            invertBackground: userObj.common.color
                                                ? this.mustInvertBackground(userObj.common.color)
                                                : false,
                                            group: await this.getLeadingGroupName(userObj._id),
                                        },
                                    });
                                }
                            } catch (e) {
                                console.error(
                                    `Could not determine user to show: ${(e as Error).toString()}, ${(e as Error).stack}`,
                                );
                                this.showAlert((e as Error).toString(), 'error');
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
                                    void this.socket?.subscribeState(`admin.${instance}.info.newsFeed`, this.onNews);
                                }),
                            5_000,
                        );

                        setTimeout(async () => {
                            const notifications = await this.hostsWorker?.getNotifications(newState.currentHost);
                            await this.handleNewNotifications(notifications);
                        }, 3_000);
                    } catch (e) {
                        console.error(`Error in onReady: ${(e as Error).stack}`);
                        this.showAlert(`Error in onReady: ${(e as Error).stack}`, 'error');
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

        if (this.expireInSecInterval) {
            clearInterval(this.expireInSecInterval);
            this.expireInSecInterval = null;
        }

        if (window._localStorage) {
            window._localStorage = undefined;
            window._sessionStorage = undefined;
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
                        event.obj &&
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
        if (!this.socket) {
            return;
        }
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

        // Check that the host is alive
        let alive;
        try {
            alive = await this.socket.getState(`${newState.currentHost}.alive`);
        } catch (e) {
            alive = null;
            console.warn(`Cannot get state ${newState.currentHost}.alive: ${e}`);
        }

        if (!alive?.val) {
            // find first the live host
            for (let h = 0; h < newState.hosts.length; h++) {
                alive = await this.socket.getState(`${newState.hosts[h]._id}.alive`);
                if (alive?.val) {
                    newState.currentHost = newState.hosts[h]._id;
                    newState.currentHostName = newState.hosts[h].common.name;
                }
            }
        }
    }

    renderTokenTimeoutDialog(): React.JSX.Element | null {
        if (!this.state.askForTokenRefresh) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                onClose={() => App.logout()}
            >
                <DialogContent>
                    <DialogContentText>
                        {I18n.t(
                            'ra_Session will expire in %s seconds. Continue?',
                            Math.round((this.state.askForTokenRefresh.expireAt - Date.now()) / 1000),
                        )}
                    </DialogContentText>
                    <div>
                        <FormControlLabel
                            label={I18n.t('ra_Do not ask for next 2 hours in this session')}
                            control={
                                <Checkbox
                                    checked={this.state.askForTokenRefresh.doNotAsk}
                                    onChange={() => {
                                        const askForTokenRefresh = { ...this.state.askForTokenRefresh } as {
                                            expireAt: number;
                                            resolve: (prolong: boolean) => void;
                                            doNotAsk: boolean;
                                        };
                                        askForTokenRefresh.doNotAsk = !this.state.askForTokenRefresh?.doNotAsk;
                                        this.setState({ askForTokenRefresh });
                                    }}
                                />
                            }
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            const resolve = this.state.askForTokenRefresh?.resolve;

                            if (this.state.askForTokenRefresh?.doNotAsk) {
                                // Add 2 hours for the session
                                this.doNotAskSessionExpiration = Date.now() + 3_600_000 * 2;
                            }

                            if (this.expireInSecInterval) {
                                clearInterval(this.expireInSecInterval);
                                this.expireInSecInterval = null;
                            }

                            this.setState({ askForTokenRefresh: null }, () => resolve?.(true));
                        }}
                        variant="contained"
                        startIcon={<UpdateIcon />}
                    >
                        {I18n.t('ra_Continue')}
                    </Button>
                    <Button
                        onClick={() => App.logout()}
                        variant="outlined"
                        color="grey"
                        startIcon={<Logout />}
                    >
                        {I18n.t('ra_Logout')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    onSessionExpiration = (expireAt: number): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            const tokens = Connection.readTokens();
            if (
                (this.doNotAskSessionExpiration && Date.now() < this.doNotAskSessionExpiration) ||
                (tokens && tokens.refresh_token_expires_in.getTime() > Date.now())
            ) {
                resolve(true);
            } else {
                this.setState({ askForTokenRefresh: { expireAt, resolve, doNotAsk: false } }, () => {
                    this.expireInSecInterval ||= setInterval(() => {
                        if (this.state.askForTokenRefresh && Date.now() >= this.state.askForTokenRefresh.expireAt) {
                            if (this.expireInSecInterval) {
                                clearInterval(this.expireInSecInterval);
                                this.expireInSecInterval = null;
                            }
                            // On session expiration will be called only if the connection is the owner of the token
                            Connection.deleteTokensStatic();
                            window.location.reload();
                        } else {
                            // redraw timer
                            this.forceUpdate();
                        }
                    }, 1_000);
                });
            }
        });
    };

    onDiscoveryAlive = (_name: string, value?: ioBroker.State | null): void => {
        if (!!value?.val !== this.state.discoveryAlive) {
            this.setState({ discoveryAlive: !!value?.val });
        }
    };

    getDiscoveryModal = (): JSX.Element | null =>
        this.state.systemConfig && this.socket ? (
            <DiscoveryDialog
                themeType={this.state.themeType}
                themeName={this.state.themeName}
                theme={this.state.theme}
                socket={this.socket}
                systemConfig={this.state.systemConfig.common}
                dateFormat={this.state.systemConfig.common.dateFormat}
                currentHost={this.state.currentHost}
                defaultLogLevel={this.state.systemConfig.common.defaultLogLevel || 'info'}
                repository={this.state.repository}
                hosts={this.state.hosts}
                onClose={() => Router.doNavigate(null)}
            />
        ) : null;

    async findNewsInstance(): Promise<number> {
        const maxCount = 200;
        if (this.socket) {
            for (let instance = 0; instance < maxCount; instance++) {
                try {
                    const adminAlive = await this.socket.getState(`system.adapter.admin.${instance}.alive`);
                    if (adminAlive?.val) {
                        return instance;
                    }
                } catch (e) {
                    console.error(`Cannot find news instance: ${(e as Error).stack}`);
                    this.showAlert(`Cannot find news instance: ${(e as Error).stack}`, 'error');
                }
            }
        }
        return 0;
    }

    /**
     * Render the notification dialog
     */
    renderNotificationsDialog(): JSX.Element | null {
        if (!this.state.notificationsDialog || !this.state.systemConfig || !this.socket) {
            return null;
        }

        return (
            <NotificationsDialog
                notifications={this.state.notifications?.notifications || {}}
                instances={this.state.notifications?.instances || {}}
                onClose={() => this.setState({ notificationsDialog: false })}
                ackCallback={(host, name) => this.socket!.clearNotifications(host, name)}
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
        if (!this.state.showHostWarning || !this.state.systemConfig || !this.socket) {
            return null;
        }

        return (
            <HostWarningDialog
                instances={this.state.showHostWarning.instances}
                messages={this.state.showHostWarning.result.system.categories}
                dateFormat={this.state.systemConfig.common.dateFormat}
                themeType={this.state.themeType}
                ackCallback={name => this.socket!.clearNotifications(this.state.showHostWarning!.host, name)}
                onClose={() => this.setState({ showHostWarning: null })}
            />
        );
    }

    /** Called when notifications detected, updates the notification indicator */
    handleNewNotifications = async (
        notifications: Record<string, NotificationAnswer> | undefined | null,
    ): Promise<void> => {
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

        if (this.instancesWorker) {
            const instances = await this.instancesWorker.getObjects();
            this.setState({ noNotifications, notifications: { notifications, instances } });
        }
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
            await this.instancesWorker?.getObjects().then(
                instances =>
                    instances &&
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
     * Get news for a specific adapter instance
     */
    onNews = async (_id: string, newsFeed: ioBroker.State | null | undefined): Promise<void> => {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        try {
            if (!this.state.systemConfig?.common.licenseConfirmed) {
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
                    const info: HostInfo | null = await this.socket
                        .getHostInfo(this.state.currentHost)
                        .catch((): null => null);

                    const instances: Record<string, CompactInstanceInfo> | null = await this.socket
                        .getCompactInstances()
                        .catch((): null => null);

                    let objectsDbType: DbType | undefined;
                    if (this.state.currentHost) {
                        const diagData = await this.socket.getDiagData(this.state.currentHost, 'normal');
                        objectsDbType = diagData?.objectsType;
                    }

                    const objects = await this.objectsWorker?.getObjects(true);
                    const noObjects = Object.keys(objects || {}).length;

                    const checkNews = checkMessages(news, lastNewsId?.val as string, {
                        lang: I18n.getLanguage(),
                        adapters: this.state.adapters,
                        instances: instances || {},
                        nodeVersion: info ? info['Node.js'] || '?' : '?',
                        npmVersion: info ? info.NPM || '?' : '?',
                        jsControllerVersion: this.state.installed?.['js-controller']?.version || '',
                        os: info ? info.os || '?' : '?',
                        activeRepo: this.state.systemConfig.common.activeRepo,
                        uuid,
                        objectsDbType: objectsDbType || 'jsonl',
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
            console.error(`Could not process news: ${(e as Error).stack}`);
            this.showAlert(`Could not process news: ${(e as Error).stack}`, 'error');
        }
    };

    renderNewsDialog(): JSX.Element | null {
        if (!this.state.showNews || !this.socket) {
            return null;
        }
        return (
            <NewsAdminDialog
                newsArr={this.state.showNews.checkNews}
                current={this.state.showNews.lastNewsId}
                onSetLastNewsId={async id => {
                    if (id) {
                        await this.socket!.setState(`admin.${this.newsInstance}.info.newsLastId`, {
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
        hosts ||= this.state.hosts;
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        const repository: CompactRepository = await this.socket
            .getCompactRepository(currentHost, update, this.state.readTimeoutMs)
            .catch((e: unknown): CompactRepository => {
                window.alert(`Cannot getRepositoryCompact: ${e as Error}`);
                if ((e as Error).toString().includes('timeout')) {
                    this.setState({ showSlowConnectionWarning: true });
                }
                return {};
            });

        const installed: CompactInstalledInfo = await this.socket
            .getCompactInstalled(currentHost, update, this.state.readTimeoutMs)
            .catch((e: unknown): CompactInstalledInfo => {
                window.alert(`Cannot getInstalled: ${e as Error}`);
                if ((e as Error).toString().includes('timeout')) {
                    this.setState({ showSlowConnectionWarning: true });
                }
                return {};
            });

        const adapters: Record<string, CompactAdapterInfo> = await this.socket
            .getCompactAdapters(update)
            .catch((e: unknown): Record<string, CompactAdapterInfo> => {
                window.alert(`Cannot read adapters: ${e as Error}`);
                return {};
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
                // DH (2026.04.12) Remove this line after all adapters update gui-components to V8.2.x
                this.refConfigIframe?.contentWindow?.postMessage('updateTheme', '*');
                this.refConfigIframe?.contentWindow?.postMessage({ type: 'updateTheme', themeName: newThemeName }, '*');
            },
        );
    };

    /**
     * The host selector for the tabs that show the data of one host.
     *
     * It used to sit in the app bar and was only greyed out on the other tabs. Now it is handed to
     * the four tabs that show data of one host (overview, adapters, instances, logs), and each of
     * them puts it at the right end of its header - so the app bar can be emptied step by step.
     * The element is built here because switching the host also has to reload the repository and
     * the notifications, and that logic must not be duplicated in four tabs.
     */
    renderHostSelector(): JSX.Element | null {
        if (!this.socket || !this.hostsWorker) {
            return null;
        }

        return (
            <IsVisible
                name="admin.appBar.hostSelector"
                config={this.adminGuiConfig}
            >
                <HostSelectors
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
                                // read notifications from the host
                                const notifications = await this.hostsWorker?.getNotifications(host);
                                await this.handleNewNotifications(notifications);
                            },
                        );
                    }}
                />
            </IsVisible>
        );
    }

    setCurrentTabTitle(): void {
        this.setTitle(this.state.currentTab.tab.replace('tab-', ''));
    }

    setTitle(title: string): void {
        document.title = `${title} - ${this.state.currentHostName || 'ioBroker'}`;
    }

    getCurrentTab(): JSX.Element | null {
        if (
            !this.socket ||
            !this.hostsWorker ||
            !this.adaptersWorker ||
            !this.instancesWorker ||
            !this.objectsWorker ||
            !this.state.systemConfig ||
            !this.logsWorker
        ) {
            return null;
        }

        if (this.state?.currentTab?.tab) {
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
                            executeCommand={(
                                cmd: string,
                                host?: string,
                                callback?: (exitCode?: number) => void,
                                files?: CommandFile[],
                            ) => this.executeCommand(cmd, host, callback, files)}
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
                            hostSelector={this.renderHostSelector()}
                            menuButtonSpace={this.needsMenuButtonSpace()}
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
                            executeCommand={(
                                cmd: string,
                                host?: string,
                                callback?: (exitCode?: number) => void,
                                files?: CommandFile[],
                            ) => this.executeCommand(cmd, host, callback, files)}
                            inBackgroundCommand={this.state.commandError || this.state.performed}
                            onRegisterIframeRef={(ref: HTMLIFrameElement) => (this.refConfigIframe = ref)}
                            onUnregisterIframeRef={(ref: HTMLIFrameElement) => {
                                if (this.refConfigIframe === ref) {
                                    this.refConfigIframe = null;
                                }
                            }}
                            handleNavigation={this.handleNavigation}
                            hostSelector={this.renderHostSelector()}
                            menuButtonSpace={this.needsMenuButtonSpace()}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-overview') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <Overview
                            key="overview"
                            t={I18n.t}
                            lang={this.state.lang}
                            socket={this.socket}
                            theme={this.state.theme}
                            themeType={this.state.themeType}
                            currentHost={this.state.currentHost}
                            currentHostName={this.state.currentHostName}
                            hostsWorker={this.hostsWorker}
                            instancesWorker={this.instancesWorker}
                            objectsWorker={this.objectsWorker}
                            logsWorker={this.logsWorker}
                            expertMode={this.state.expertMode}
                            installed={this.state.installed}
                            repository={this.state.repository}
                            handleNavigation={(tab: string) => this.handleNavigation(tab)}
                            hostSelector={this.renderHostSelector()}
                            menuButtonSpace={this.needsMenuButtonSpace()}
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
                            hostSelector={this.renderHostSelector()}
                            menuButtonSpace={this.needsMenuButtonSpace()}
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
                            currentHost={this.state.currentHost}
                            executeCommand={(
                                cmd: string,
                                host?: string,
                                callback?: (exitCode?: number) => void,
                                files?: CommandFile[],
                            ) => this.executeCommand(cmd, host, callback, files)}
                            systemConfig={this.state.systemConfig}
                            showAdaptersWarning={this.showAdaptersWarning}
                            adminInstance={this.adminInstance}
                            onUpdating={(updating: boolean) => this.setState({ updating })}
                        />
                    </Suspense>
                );
            }
            if (this.state.currentTab.tab === 'tab-devicemanager') {
                return (
                    <Suspense fallback={<Connecting />}>
                        <DeviceManagerTab
                            key={this.state.currentTab.tab}
                            themeName={this.state.themeName}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                            socket={this.socket}
                            dateFormat={this.state.systemConfig.common.dateFormat}
                            isFloatComma={this.state.systemConfig.common.isFloatComma}
                        />
                    </Suspense>
                );
            }
            const m = this.state.currentTab.tab.match(/^tab-([-\w]+?)(?:-(\d+))?$/);
            if (m) {
                const tab = this.tabsInfo?.find(it => it.name === m[0] || it.name === `tab-${m[1]}`);
                // /adapter/javascript/tab.html
                return (
                    <Suspense fallback={<Connecting />}>
                        <CustomTab
                            key={this.state.currentTab.tab}
                            hostname={this.state.hostname}
                            adminInstance={this.adminInstance}
                            hosts={this.state.hosts}
                            instancesWorker={this.instancesWorker}
                            tab={this.state.currentTab.tab}
                            themeName={this.state.themeName}
                            theme={this.state.theme}
                            expertMode={this.state.expertMode}
                            socket={this.socket}
                            dateFormat={this.state.systemConfig.common.dateFormat}
                            isFloatComma={this.state.systemConfig.common.isFloatComma}
                            onRegisterIframeRef={(ref: HTMLIFrameElement) => (this.refConfigIframe = ref)}
                            onUnregisterIframeRef={(ref: HTMLIFrameElement) => {
                                if (this.refConfigIframe === ref) {
                                    this.refConfigIframe = null;
                                }
                            }}
                            icon={tab?.icon}
                            supportsLoadingMessage={tab?.supportsLoadingMessage}
                        />
                    </Suspense>
                );
            }
        }

        return null;
    }

    clearLogErrors(): void {
        this.logsWorker?.resetErrors();
        this.logsWorker?.resetWarnings();
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
                    const systemConfig = await this.socket?.getObject('system.config');

                    if (systemConfig) {
                        if (repoChanged) {
                            this.setState({ triggerAdapterUpdate: this.state.triggerAdapterUpdate + 1, systemConfig });
                        } else {
                            this.setState({ systemConfig });
                        }
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

    handleAlertClose(_event?: string, reason?: string): void {
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
        Connection.deleteTokensStatic();

        if (window.location.port === '3000') {
            window.location.href = `${window.location.protocol}//${window.location.hostname}:8081/logout?dev`;
        } else {
            window.location.href = `./logout?origin=${window.location.pathname}`;
        }
    }

    handleNavigation = (tab: string | undefined, subTab?: string, param?: string): void => {
        if (tab) {
            if (this._tempAllStored) {
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

        tab ||= this.state.currentTab?.tab || '';

        this.setTitle(tab.replace('tab-', ''));
    };

    allStored(value: boolean): void {
        if (this._tempAllStored !== value) {
            this._tempAllStored = value;
            this.forceUpdate();
        }
    }

    closeDataNotStoredDialog(): void {
        this.setState({ dataNotStoredDialog: false });
    }

    confirmDataNotStored(): void {
        this._tempAllStored = true;
        this.setState(
            {
                dataNotStoredDialog: false,
            },
            () =>
                this.handleNavigation(
                    this.state.dataNotStoredTab?.tab,
                    this.state.dataNotStoredTab?.subTab,
                    this.state.dataNotStoredTab?.param,
                ),
        );
    }

    executeCommand(
        cmd: string,
        host?: string,
        callback?: ((exitCode?: number) => void) | null,
        files?: CommandFile[],
    ): void {
        if (typeof host === 'boolean') {
            callback = host;
            host = undefined;
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
                    cmdFiles: null,
                },
                () =>
                    this.setState({
                        cmd,
                        cmdDialog: true,
                        callback,
                        cmdFiles: files || null,
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
            cmdFiles: files || null,
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
                cmdFiles: null,
            },
            () => cb && cb(),
        );
    }

    renderWizardDialog(): JSX.Element | null {
        if (this.state.wizard) {
            return (
                <WizardDialog
                    executeCommand={(
                        cmd: string,
                        host?: string,
                        callback?: (exitCode?: number) => void,
                        files?: CommandFile[],
                    ) => this.executeCommand(cmd, host, callback, files)}
                    host={this.state.currentHost}
                    socket={this.socket!}
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
                                        window.location.href = this.state.showRedirect!;
                                    }
                                }, 1_000);
                            }
                        });
                    }}
                    onNavigate={(tab: string, subTab?: string, param?: string) => {
                        // In wizard mode, many of the objects are not loaded yet.
                        // So we need to force reloading of the current browser tab
                        Router.doNavigate(tab, subTab, param);
                        window.location.reload();
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
                        // Ignore. It can be closed only by a button
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
                                    if (window.sidebar && this.state.showRedirect) {
                                        // Firefox
                                        window.sidebar.addPanel('ioBroker.admin', this.state.showRedirect, '');
                                    } else if (
                                        window.opera &&
                                        this.state.showRedirect &&
                                        // @ts-expect-error ignore
                                        window.print
                                    ) {
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
                                onClick={() =>
                                    this.state.showRedirect && (window.location.href = this.state.showRedirect)
                                }
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
        return this.state.cmd && this.socket ? (
            <CommandDialog
                onSetCommandRunning={(commandRunning: boolean) => this.setState({ commandRunning })}
                onClose={() => this.closeCmdDialog(() => this.setState({ commandRunning: false }))}
                visible={this.state.cmdDialog}
                callback={this.state.callback as () => void}
                onInBackground={() => this.setState({ cmdDialog: false })}
                cmd={this.state.cmd}
                files={this.state.cmdFiles || undefined}
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

    /**
     * The site name in the app bar.
     *
     * The logged-in user with its logout menu used to be here as well - it sits at the lower edge of
     * the menu now, see the `user` prop of the drawer.
     */
    /**
     * Name of the group that says the most about a user, for the line below the name in the menu.
     *
     * `administrator` wins when the user is a member of it - being an administrator matters more
     * than any other membership. Otherwise the first group is taken.
     *
     * @param userId e.g. `system.user.admin`
     */
    async getLeadingGroupName(userId: `system.user.${string}`): Promise<string> {
        if (!this.socket) {
            throw new Error('Socket not ready');
        }
        try {
            const groups = await this.socket.getForeignObjects('system.group.*', 'group');
            const own = Object.values(groups || {}).filter(group => group?.common?.members?.includes(userId));
            const leading = own.find(group => group._id === 'system.group.administrator') || own[0];
            return leading ? Utils.getObjectNameFromObj(leading, this.socket.systemLang) : '';
        } catch (e) {
            // the group is only additional information - the menu works without it
            console.warn(`Cannot read groups of ${userId}: ${e as Error}`);
            return '';
        }
    }

    renderSiteName(): JSX.Element | null {
        const siteName = this.state.systemConfig?.common?.siteName;
        if (siteName) {
            return <div style={styles.siteName}>{siteName}</div>;
        }
        return null;
    }

    /**
     * Replaces the app bar when there is no site name.
     *
     * Without it the menu could not be reached again once it is fully closed - the drawer hides
     * completely in that state and the button for it used to live in the bar. The indicator of a
     * running command would be lost as well.
     */
    /**
     * True when the floating menu button covers the upper left corner of the tab, so the tab has to
     * keep that spot free. Only the case without an app bar and with a completely hidden menu.
     */
    needsMenuButtonSpace(): boolean {
        return !this.state.systemConfig?.common?.siteName && this.state.drawerState === DrawerStates.closed;
    }

    renderFloatingButtons(): JSX.Element | null {
        const showMenuButton = this.state.drawerState === DrawerStates.closed;
        const showCmd = this.state.cmd && !this.state.cmdDialog;

        if (!showMenuButton && !showCmd) {
            return null;
        }

        return (
            <Box sx={styles.floatingButtons}>
                {showMenuButton ? (
                    <IconButton onClick={() => this.handleDrawerState(DrawerStates.opened as 0)}>
                        <MenuIcon />
                    </IconButton>
                ) : null}
                {showCmd ? (
                    <IconButton onClick={() => this.setState({ cmdDialog: true })}>
                        <PictureInPictureAltIcon
                            style={
                                this.state.commandError
                                    ? styles.errorCmd
                                    : this.state.performed
                                      ? Utils.getStyle(this.state.theme, styles.performed)
                                      : styles.cmd
                            }
                        />
                    </IconButton>
                ) : null}
            </Box>
        );
    }

    renderAlertSnackbar(): JSX.Element {
        return (
            <Snackbar
                open={this.state.alert}
                autoHideDuration={6000}
                onClose={() => this.handleAlertClose()}
            >
                {/*
                 * The color has to sit on the `Alert`, not on the `Snackbar`: the snackbar itself is
                 * only the positioning container, the visible box is its content. Painting the
                 * container left the content in the MUI default color - a light grey block on the
                 * dark theme with only a red rim showing.
                 */}
                <Alert
                    severity={this.state.alertType}
                    variant="filled"
                    onClose={() => this.handleAlertClose()}
                >
                    {this.state.alertMessage}
                </Alert>
            </Snackbar>
        );
    }

    renderDialogConfirm(): JSX.Element | null {
        if (!this.state.dataNotStoredDialog) {
            return null;
        }
        /* return <DialogConfirm
            onClose={() => this.closeDataNotStoredDialog()}
            open={this.state.dataNotStoredDialog}
            header={I18n.t('Please confirm')}
            onConfirm={() => this.confirmDataNotStored()}
            confirmText={I18n.t('Ok')}
        >
            {I18n.t('Some data are not stored. Discard?')}
        </DialogConfirm>; */
        return (
            <DialogConfirm
                title={I18n.t('ra_Please confirm')}
                text={I18n.t('ra_Some data are not stored. Discard?')}
                ok={I18n.t('ra_Discard')}
                cancel={I18n.t('ra_Cancel')}
                onClose={(isYes: boolean) => (isYes ? this.confirmDataNotStored() : this.closeDataNotStoredDialog())}
            />
        );
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

    /**
     * The global buttons that used to sit in the app bar: notifications, discovery, theme, expert
     * mode and the settings synchronisation.
     *
     * They are rendered by the drawer at its lower edge now. The app bar is supposed to disappear
     * completely, so nothing that the user needs permanently may stay in it.
     */
    renderMenuButtons(): JSX.Element {
        const storedExpertMode = (window._sessionStorage || window.sessionStorage).getItem('App.expertMode');
        const expertModePermanent =
            !storedExpertMode || (storedExpertMode === 'true') === !!this.state.systemConfig?.common.expertMode;
        const sumNotification = this.state.noNotifications.warning + this.state.noNotifications.other;

        return (
            <>
                <Tooltip
                    title={I18n.t('Notifications')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        disableRipple={!sumNotification}
                        style={{ opacity: sumNotification ? 1 : 0.3 }}
                        onClick={sumNotification ? () => this.setState({ notificationsDialog: true }) : undefined}
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
                    {this.state.discoveryAlive ? (
                        <Tooltip
                            title={I18n.t('Discovery devices')}
                            slotProps={{ popper: { sx: styles.tooltip } }}
                        >
                            <IconButton onClick={() => Router.doNavigate(null, 'discovery')}>
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <div style={{ display: 'none' }} />
                    )}
                </IsVisible>
                {this.toggleThemePossible ? (
                    <IsVisible
                        name="admin.appBar.toggleTheme"
                        config={this.adminGuiConfig}
                    >
                        <ToggleThemeMenu
                            toggleTheme={this.toggleTheme}
                            themeName={this.state.themeName}
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
                                onClick={() => {
                                    if (!!this.state.systemConfig?.common.expertMode === !this.state.expertMode) {
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
            </>
        );
    }

    renderToolbar(small: boolean): JSX.Element {
        const performedStyle = Utils.getStyle(this.state.theme, styles.performed);

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
                    {/* notifications, discovery, theme, expert mode and the settings synchronisation
                        moved to the lower edge of the menu, see `renderMenuButtons` */}
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

                {this.renderSiteName()}

                {this.state.drawerState !== DrawerStates.opened &&
                    !this.state.expertMode &&
                    window.innerWidth > 450 && (
                        <Grid
                            container
                            style={{
                                ...styles.avatarNotVisible,
                                ...(this.state.drawerState !== DrawerStates.opened ? styles.avatarVisible : undefined),
                            }}
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                        >
                            {!this.state.user ? (
                                <Box
                                    component="div"
                                    style={styles.wrapperName}
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
                            ) : null}
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
                                            src="img/no-image.svg"
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
        const message = this.state.hasGlobalError?.message;
        const stack = this.state.hasGlobalError?.stack;

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

    renderEasyMode(): JSX.Element | null {
        if (!this.socket) {
            return null;
        }

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
                                isFloatComma={!!this.state.systemConfig?.common.isFloatComma}
                                dateFormat={this.state.systemConfig?.common.dateFormat || 'DD.MM.YYYY'}
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

    render(): JSX.Element | null {
        const small = this.props.width === 'xs' || this.props.width === 'sm';
        // The bar has nothing left to show but the name of the installation.
        // Optional chaining is required: this runs before the early returns below, and until the
        // configuration has been read `systemConfig` is null - the type says otherwise.
        const showAppBar = !!this.state.systemConfig?.common?.siteName;
        const menuButtonSpace = this.needsMenuButtonSpace();

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
                        <Login />
                        {this.renderAlertSnackbar()}
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }
        if (!this.state.ready && !this.state.updating) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <CssBaseline />
                        <Loader themeType={this.state.themeType} />
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
                    <ScrollbarStyles theme={this.state.theme} />
                    <CssBaseline />
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
                        // Reserve room on the right when the chat assistant is docked side-by-side.
                        style={{ ...styles.root, paddingRight: this.state.chatDockWidth || undefined }}
                    >
                        {/*
                         * The app bar only exists for the site name. Without a name there is
                         * nothing left to show in it, and the space is better used by the content.
                         */}
                        {showAppBar ? (
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
                                    !small &&
                                        this.state.drawerState === DrawerStates.compact &&
                                        styles.appBarShiftCompact,
                                    // Keep the toolbar controls left of the docked chat panel.
                                    this.state.chatDockWidth
                                        ? { paddingRight: `${this.state.chatDockWidth}px` }
                                        : undefined,
                                )}
                            >
                                {this.renderToolbar(small)}
                            </AppBar>
                        ) : (
                            this.renderFloatingButtons()
                        )}
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
                                logoutTitle={I18n.t('ra_Logout')}
                                isSecure={this.socket?.isSecure}
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
                                provideTabsInfo={(tabs: AdminTab[]): void => {
                                    this.tabsInfo = tabs;
                                }}
                                onSystemSettings={() => Router.doNavigate(null, 'system')}
                                menuButtons={this.renderMenuButtons()}
                                user={this.state.user}
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
                                !showAppBar && styles.contentNoAppBar,
                                menuButtonSpace &&
                                    !TABS_WITH_OWN_TOOLBAR.includes(this.state.currentTab.tab) &&
                                    styles.contentMenuButtonSpace,
                            )}
                        >
                            {this.getCurrentTab()}
                        </Paper>
                        {this.renderAlertSnackbar()}
                    </Paper>
                    {this.renderTokenTimeoutDialog()}
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
                    {this.state.connected && this.socket && this.state.disableMcp === false ? (
                        <ChatPanel
                            socket={this.socket}
                            instance={this.adminInstance}
                            theme={this.state.theme}
                            themeType={this.state.themeType}
                            host={this.state.currentHost}
                            executeCommand={(cmd, host, callback) => this.executeCommand(cmd, host, callback)}
                            onNavigate={tab => this.handleNavigation(tab)}
                            onDockWidthChange={chatDockWidth => this.setState({ chatDockWidth })}
                        />
                    ) : null}
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);
