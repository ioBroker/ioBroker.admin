/// <reference types="vite/client" />
import type { I18n, AdminConnection, ThemeType, ThemeName } from '@iobroker/adapter-react-v5';

declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

export interface BasicComponentProps {
    t: typeof I18n.t;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    themeName: ThemeName;
    theme: Record<string, any>;
    themeType: ThemeType;
}

interface RepositoryEntry {
    /** Link to external icon */
    extIcon: string;
    /** Translated title */
    titleLang: ioBroker.Translated;
    [other: string]: unknown;
}

/** The ioBroker repository */
export type Repository = Record<string, RepositoryEntry>;

/**
 * Specific value or a string in general
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ValueOrString<T> = T | (string & object);

export type ioBrokerObject<Native extends object = object, Common extends object = object> = ioBroker.AnyObject & {
    common: Record<string, any> & Common;
    native: Record<string, any> & Native;
};

export interface AdminGuiConfig {
    admin?: {
        menu?: {
            // Settings for left menu
            editable?: false; // Hide edit button in menu
            'tab-hosts'?: false; // Hide hosts item (See all https://github.com/ioBroker/ioBroker.admin/blob/master/src-rx/src/components/Drawer.js#L142)
            'tab-files'?: false; // Hide files item
            'tab-users'?: false; // Hide users item
            'tab-intro'?: false; // Hide intro item
            'tab-info'?: false; // Hide info item
            'tab-adapters'?: false; // Hide adapters item
            'tab-instances'?: false; // Hide instances item
            'tab-objects'?: false; // Hide objects item
            'tab-enums'?: false; // Hide enums item
            'tab-devices'?: false; // Hide devices item
            'tab-logs'?: false; // Hide logs item
            'tab-scenes'?: false; // Hide scenes item
            'tab-events'?: false; // Hide events item
            'tab-javascript'?: false; // Hide javascript item
            'tab-text2command-0'?: false; // Hide text2command-0 item
            'tab-echarts'?: false; // Hide echarts item
            [tabName: string]: false | undefined;
        };
        appBar?: {
            discovery?: false;
            systemSettings?: false;
            toggleTheme?: false;
            expertMode?: false;
            hostSelector?: false;
        };
        settings?: {
            tabConfig?: false; // Main config tab
            tabRepositories?: false; // Repositories tab
            tabCertificates?: false; // Certificates tab
            tabLetsEncrypt?: false; // Let's Encrypt tab
            tabDefaultACL?: false; // Default ACL tab
            tabStatistics?: false; // Statistics tab

            language?: false;
            tempUnit?: false;
            currency?: false;
            dateFormat?: false;
            isFloatComma?: false;
            defaultHistory?: false;
            activeRepo?: false;
            expertMode?: false;
            defaultLogLevel?: false;
        };
        adapters?: {
            gitHubInstall?: false; // hide button install from GitHub/npm
            statistics?: false; // hide statistics on the right top
            filterUpdates?: false; // hide button filter updates in adapter tab
            allowAdapterRating?: false; // do not show and do not load adapter ratings
        };
        login?: {
            title?: string;
            motto?: string;
            link?: string;
        };
    };
    /** Favicon */
    ico?: string;
    /** Logo in the top left corner */
    logo?: string;
    /** Small logo for the login screen (quadrat) */
    icon?: string;
    uuidPrefix?: string;
}

export interface CompactAdapterInfo {
    icon: ioBroker.AdapterCommon['icon'];
    v: ioBroker.AdapterCommon['version'];
    iv?: string;
}

export type CompactHost = {
    _id: ioBroker.ObjectIDs.Host;
    common: {
        name: ioBroker.HostCommon['name'];
        icon: ioBroker.HostCommon['icon'];
        color: string;
        installedVersion: ioBroker.HostCommon['installedVersion'];
    };
    native: {
        hardware: {
            networkInterfaces?: ioBroker.HostNative['hardware']['networkInterfaces'];
        };
    };
};

export interface NotificationsCount {
    /** Number of present warnings */
    warning: number;
    /** Number of present notify and info notifications */
    other: number;
}
