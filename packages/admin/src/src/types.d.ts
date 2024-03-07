import type { I18n, Connection } from '@iobroker/adapter-react-v5';

export interface BasicComponentProps {
    t: typeof I18n.t;
    lang:  ioBroker.Languages;
    socket: Connection;
    themeName: string;
    theme: Record<string, any>;
    themeType: string;
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
