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
        icon?: string;
        menu?: Record<string, boolean>;
        settings?: Record<string, boolean>;
        adapters: {
            allowAdapterRating?: boolean;
            gitHubInstall?: boolean;
        };
        login?: {
            title?: string;
            motto?: string;
            link?: string;
        };
    };
    name?: string;
    icon?: string;
    logo?: string;
    ico?: string;
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
