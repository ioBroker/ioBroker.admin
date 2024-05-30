import type {
    I18n, AdminConnection,
    ThemeType, ThemeName,
} from '@iobroker/adapter-react-v5';

export interface BasicComponentProps {
    t: typeof I18n.t;
    lang:  ioBroker.Languages;
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
export type Repository = Record<string, RepositoryEntry>

/**
 * Specific value or a string in general
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type ValueOrString<T> = T | string & {}

export type ioBrokerObject<Native extends object = object, Common extends object = object> = ioBroker.AnyObject & {
    common: Record<string, any> & Common;
    native: Record<string, any> & Native;
};

export interface AdminGuiConfig {
    admin: {
        menu: any;
        settings: any;
        adapters: any;
        login: any;
    };
}
