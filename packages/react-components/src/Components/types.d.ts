import type { Translate, Width } from '../types';
import type Connection from '../Connection';
import type Router from './Router';

export interface ObjectBrowserTableFilter {
    id?: string;
    name?: string;
    room?: string;
    func?: string;
    role?: string;
    expertMode?: boolean;
}

export type ObjectBrowserColumn = 'name' | 'type' | 'role' | 'room' | 'func' | 'val' | 'buttons';

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
