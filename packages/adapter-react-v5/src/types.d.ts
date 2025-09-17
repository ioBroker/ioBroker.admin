import type { JSX, CSSProperties } from 'react';
import type { Theme as MuiTheme, Palette as MuiPalette } from '@mui/material/styles';
import type { AdminConnection, Connection } from '@iobroker/socket-client';

import type { LegacyConnection } from './LegacyConnection';
import type Router from './Components/Router';

export type Translate = (key: string, ...args: (string | number | boolean)[]) => string;

export type LogMessage = {
    /** Log message */
    message: string;
    /** origin */
    from: string;
    /** timestamp in ms */
    ts: number;
    /** Log message */
    severity: ioBroker.LogLevel;
    /** unique ID of the message */
    _id: number;
};

/**
 * Properties for the connection to the admin or web instance.
 */
export interface ConnectionProps {
    /** The socket name. */
    name?: string;
    /** State IDs to always automatically subscribe to. */
    autoSubscribes?: string[];
    /** Automatically subscribe to logging. */
    autoSubscribeLog?: boolean;
    /** The protocol to use for the socket.io connection. */
    protocol?: 'http:' | 'https:';
    /** The host name to use for the socket.io connection. */
    host?: string;
    /** The port to use for the socket.io connection. */
    port?: string | number;
    /** The socket.io connection timeout. */
    ioTimeout?: number;
    /** Flag to indicate if all objects should be loaded or not. Default true (not loaded) */
    doNotLoadAllObjects?: boolean;
    /** Flag to indicate if AccessControlList for current user will be loaded or not. Default true (not loaded) */
    doNotLoadACL?: boolean;
    /** Progress callback. */
    onProgress?: (progress: number) => void;
    /** Ready callback. */
    onReady?: (objects: Record<string, ioBroker.Object>) => void;
    /** Log callback. */
    onLog?: (text: LogMessage) => void;
    /** Error callback. */
    onError?: (error: any) => void;
    /** Object change callback. */
    onObjectChange?: ioBroker.ObjectChangeHandler;
    /** Language callback */
    onLanguage?: (lang: ioBroker.Languages) => void;
    /** Special access token */
    token?: string;
}

export interface OldObject {
    _id: string;
    type: string;
}

export type ObjectChangeHandler = (
    id: string,
    obj: ioBroker.Object | null | undefined,
    oldObj: OldObject,
) => void | Promise<void>;

export type ThemeName = 'dark' | 'light' | 'colored' | 'blue' | 'PT' | 'DX';
export type ThemeType = 'dark' | 'light';

export interface GenericAppProps {
    /** Adapter instance number if known, else will be determined from url */
    instance?: number;
    /** The name of the adapter. */
    adapterName?: string;
    /** Should the bottom buttons be shown (default: true). */
    bottomButtons?: boolean;
    /** Additional translations. */
    translations?: { [lang in ioBroker.Languages]?: Record<string, string> };
    /** Fields that should be encrypted/decrypted. */
    encryptedFields?: string[];
    /** Socket.io configuration. */
    socket?: ConnectionProps;
    /** Desired connection object */
    Connection?: LegacyConnection | Connection | AdminConnection;
    /** sentry DNS */
    sentryDSN?: string;
    /** Callback if user changes the theme. Call it to trigger change */
    onThemeChange?: (newThemeName: ThemeName) => void;
    classes?: Record<string, string>;
}

export interface GenericAppSettings extends GenericAppProps {
    /** Don't load all objects on start-up. */
    doNotLoadAllObjects?: boolean;
}

interface Palette extends MuiPalette {
    mode: ThemeType;
    expert: string;
    grey: {
        main: string;
        dark: string;
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        A100: string;
        A200: string;
        A400: string;
        A700: string;
    };
}

export interface IobTheme extends MuiTheme {
    name: ThemeName;
    palette: Palette;
    toolbar: CSSProperties;
    saveToolbar: {
        background: string;
        button: CSSProperties;
    };
}

export type Width = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GenericAppState {
    loaded: boolean;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
    expertMode: boolean;
    selectedTab: string;
    selectedTabNum: number | undefined;
    native: Record<string, any>;
    errorText: string | JSX.Element;
    changed: boolean;
    connected: boolean;
    isConfigurationError: string;
    toast: string | JSX.Element;
    bottomButtons: boolean;
    width: Width;
    confirmClose: boolean;
    _alert: boolean;
    _alertType: 'info' | 'warning' | 'error' | 'success';
    _alertMessage: string | JSX.Element;
    common?: Record<string, any>;
}

export interface ObjectBrowserTableFilter {
    id?: string;
    name?: string;
    room?: string;
    func?: string;
    role?: string;
    expertMode?: boolean;
}

export interface ObjectBrowserCustomFilter {
    readonly type?: string | string[];
    readonly common?: {
        readonly type?: string | string[];
        readonly role?: string | string[];
        // If "_" - no custom set
        // If "_dataSources" - only data sources (history, sql, influxdb, ...)
        // Else "telegram." or something like this
        // `true` - If common.custom not empty
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        readonly custom?: '_' | '_dataSources' | true | string;
    };
}

export type ObjectBrowserType = 'state' | 'instance' | 'channel' | 'device' | 'chart';

export interface ObjectBrowserProps {
    /** The title of the dialog. */
    title: string;
    /** The key to store state in the browser (default: 'App') */
    key?: string;
    /** The CSS classes. */
    classes: Record<string, any>;
    /** Default filters to be applied to the object table. */
    defaultFilters?: ObjectBrowserTableFilter;
    /** The selected ID or IDs. */
    selected?: string | string[];
    /** Callback when object is selected. */
    onSelect?: (selectedItems: string[], name: string, isDouble?: boolean) => void;
    /** The socket connection. */
    socket: Connection;
    /** Show the expert button? */
    showExpertButton?: boolean;
    /** Is expert mode enabled? (default: false) */
    expertMode?: boolean;
    /** Prefix (default: '.') */
    imagePrefix?: string;
    /** Theme name. */
    themeName?: string;
    /** Translation function. */
    t: Translate;
    /** The selected language. */
    lang: ioBroker.Languages;
    /** Allow to select multiple objects? (default: false) */
    multiSelect?: boolean;
    /** Can't objects be edited? (default: false) */
    notEditable?: boolean;
    /** Show folders first? (default: false) */
    foldersFirst?: boolean;
    /** Disable the column selector? (default: false) */
    disableColumnSelector?: boolean;
    /** The custom dialog React component to use */
    objectCustomDialog?: any;
    /** Custom filter. Optional {common: {custom: true}} or {common: {custom: 'sql.0'}} */
    customFilter?: ObjectBrowserCustomFilter;
    /** Custom value React component to use */
    objectBrowserValue?: any;
    /** Custom object editor React component to use */
    objectBrowserEditObject?: any;
    /** Router */
    router?: Router;
    /** Object types to show */
    types?: ObjectBrowserType[];
    /** Columns to display */
    columns?: ObjectBrowserColumn[];
    /** The width of the dialog. */
    width?: Width;
}
