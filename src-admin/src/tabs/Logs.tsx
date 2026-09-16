import React, { Component, type JSX } from 'react';

import {
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Badge,
    LinearProgress,
    FormControl,
    Select,
    Tooltip,
    type SelectChangeEvent,
    Box,
} from '@mui/material';

import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    DeleteForever as DeleteForeverIcon,
    Pause as PauseIcon,
    Refresh as RefreshIcon,
    SaveAlt as SaveAltIcon,
    ErrorOutlined as ErrorIcon,
    Warning as WarningIcon,
    Check as CheckIcon,
    Search as SearchIcon,
    TextSnippet as ExportIcon,
    ArrowUpward,
    ArrowDownward,
    Clear,
} from '@mui/icons-material';
import { FaPalette as ColorsIcon } from 'react-icons/fa';

import { amber, grey, red } from '@mui/material/colors';

import {
    Icon,
    withWidth,
    Utils,
    TabHeader,
    type IobTheme,
    type ThemeType,
    type Translate,
    type AdminConnection,
    TabContainer,
    TabContent,
} from '@iobroker/gui-components';

import { parseLogFileLine, type LogLineSaved, type LogsWorker } from '@/Workers/LogsWorker';
import type { CompactAdapterInfo, CompactHost } from '@/types';

import AdminUtils from '../helpers/AdminUtils';

const MAX_LOGS = 3000;

/** Color codes of the terminal, as the log files contain them */
const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[\\d+m`, 'g');

/** Time ranges of the search in the log files, in hours. `0` shows the latest entries the host hands out */
const SEARCH_RANGES = [0, 1, 6, 24, 72, 168, 720];

/** Time range of a search started with Enter, as long as none was chosen */
const DEFAULT_SEARCH_HOURS = 24;

const styles: Record<string, any> = {
    container: {
        height: '100%',
    },
    table: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td,th': {
            padding: '3px 4px',
        },
        '& td:nth-of-type(5)': {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
        },
        // Messages wrap over several lines, but a token without any break opportunity (e.g. an
        // embedded JSON blob) has none to wrap at and pushes the fixed-layout table wider than its
        // container, which shows up as a horizontal scrollbar. Allow breaking inside such tokens.
        '& td:last-of-type': {
            overflowWrap: 'anywhere',
        },
    },
    row: {
        '@media screen and (max-width: 450px)': {
            '& > *': {
                fontSize: '8px !important',
            },
        },
    },
    rowOdd: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.default,
    }),
    cell: {
        verticalAlign: 'top',
    },
    cellName: {
        lineHeight: '14px',
    },
    updatedRow: {
        animation: 'updated 1s',
    },
    formControl: {
        width: '100%',
        '@media screen and (max-width: 450px)': {
            '& > *': {
                fontSize: '10px !important',
            },
            position: 'relative',
        },
    },
    light_error: {
        color: red[800],
    },
    light_warn: {
        color: amber[800],
    },
    light_debug: {
        color: grey[800],
    },
    light_silly: {
        color: grey[700],
    },
    dark_error: {
        color: red[200],
    },
    dark_warn: {
        color: amber[200],
    },
    dark_debug: {
        color: '#b1b1b1',
    },
    dark_silly: {
        color: '#7e7e7e',
    },
    source: {
        width: 200,
        '@media screen and (max-width: 450px)': {
            width: 120,
        },
    },
    pid: {
        width: 55,
        '@media screen and (max-width: 450px)': {
            width: 40,
        },
    },
    timestamp: {
        width: 175,
        '@media screen and (max-width: 450px)': {
            width: 100,
        },
    },
    severity: {
        width: 80,
        '@media screen and (max-width: 450px)': {
            width: 61,
        },
    },
    message: {
        minWidth: 300,
        '@media screen and (max-width: 450px)': {
            minWidth: 150,
        },
    },
    hidden: {
        display: 'none',
    },
    grow: {
        flexGrow: 1,
    },
    logSize: {
        marginRight: '1rem',
        marginLeft: '1rem',
    },
    logEstimated: {
        fontStyle: 'italic',
    },
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    header: (theme: IobTheme) => ({
        '& .MuiFormLabel-root.Mui-disabled': {
            color: theme.palette.text.primary,
        },
        '& .MuiInput-underline::before': {
            content: '""',
            borderBottom: 'none',
        },
        '@media screen and (max-width: 450px)': {
            '& > *': {
                fontSize: '10px !important',
            },
        },
    }),
    pauseButton: {
        minWidth: 48,
    },
    pauseCount: {
        color: amber[500],
    },
    downloadLogSize: {
        color: grey[500],
        marginLeft: 16,
    },
    downloadEntry: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    pidSize: {
        fontSize: 14,
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
    },
    messageText: {
        '@media screen and (max-width: 450px)': {
            '& > *': {
                fontSize: '10px !important',
            },
        },
    },
    badge: {
        top: 10,
        right: 10,
    },
    badgeError: {
        // color: red[500],
    },
    badgeWarn: {
        backgroundColor: amber[500],
    },
    emptyButton: {
        width: 48,
    },
    icon: {
        width: 16,
        height: 16,
    },
    iconSelect: {
        width: 24,
        height: 25,
        marginRight: 4,
    },
    name: {
        verticalAlign: 'top',
        display: 'inline-block',
        marginTop: 1,
        marginLeft: 2,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        textOverflow: 'ellipsis',
    },
    iconAndName: {
        whiteSpace: 'nowrap',
        display: 'flex',
    },
    tooltip: {
        pointerEvents: 'none',
    },
    searchError: (theme: IobTheme) => ({
        color: theme.palette.error.main,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: 400,
    }),
    searchTruncated: (theme: IobTheme) => ({
        color: theme.palette.warning.main,
        width: 16,
        height: 16,
        verticalAlign: 'text-bottom',
        marginLeft: 4,
    }),
    searchProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3,
    },
};

const COLORS_LIGHT = [
    '#ffadad30',
    '#ffd6a530',
    '#fdffb630',
    '#caffbf30',
    '#9bf6ff30',
    '#a0c4ff30',
    '#bdb2ff30',
    '#ffc6ff30',
    '#fffffc30',
];

const COLORS_DARK = [
    'rgba(255,109,109,0.1)',
    'rgba(253,173,84,0.1)',
    'rgba(241,255,88,0.1)',
    'rgba(115,253,81,0.1)',
    'rgba(71,235,255,0.1)',
    'rgba(74,145,255,0.1)',
    'rgba(108,85,255,0.1)',
    'rgba(250,77,250,0.1)',
    'rgba(255,255,105,0.1)',
];

interface LogLineSavedExtended extends LogLineSaved {
    odd?: boolean;
    time?: string;
    icon?: string;
}

interface LogsProps {
    socket: AdminConnection;
    currentHost: string;
    clearErrors: () => void;
    logsWorker: LogsWorker;
    themeType: ThemeType;
    t: Translate;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    theme: IobTheme;
    /** Host selector, built by the app - sits at the right end of the header on every host tab */
    hostSelector?: JSX.Element;
    /** Keep the upper left corner of the toolbar free for the floating menu button */
    menuButtonSpace?: boolean;
}

interface LogsState {
    source: string;
    severity: string;
    message: string;
    reverse: boolean;
    logDeleteDialog: boolean;
    logDownloadDialog: HTMLButtonElement | null;
    logFiles: { path: { fileName: string; size: number }; name: string }[];
    logs: LogLineSavedExtended[] | null;
    logSize: number | null;
    logErrors: number;
    logWarnings: number;
    estimatedSize: boolean;
    pause: number;
    pid: boolean;
    colors: boolean;
    adapters: Record<string, CompactAdapterInfo>;
    sources: Record<string, { active: boolean; icon: string; color?: string }>;
    currentHost: string;
    hosts: Record<string, CompactHost>;
    /** Time range of the shown search in the log files in hours, `0` while the latest entries of the host are shown */
    searchHours: number;
    /** A search in the log files runs */
    searching: boolean;
    /** Error of the last search */
    searchError: string;
    /** The search found more entries than it returned */
    searchTruncated: boolean;
    /** Admin instance that searches the log files, e.g. `admin.0`. Empty until it is known */
    searchInstance: string;
}

class Logs extends Component<LogsProps, LogsState> {
    private readonly severities: Record<string, number>;

    private readonly t: Translate;

    private ignoreNextLogs = false;

    private lastRowRender = 0;

    private lastRowRenderTimeout: ReturnType<typeof setTimeout> | null = null;

    private readLogsInProcess = false;

    private hostsTimer: ReturnType<typeof setTimeout> | null = null;

    private scrollToEnd: boolean;

    /**
     * Counts the requests that replace the shown entries - reading the latest ones or searching the files -
     * so that the answer of an outdated one is dropped
     */
    private logsRequest = 0;

    /**
     * The shown search result holds the entries of the files up to this time; newer ones come from the live
     * log. `0` if no search result is shown.
     */
    private searchUntil = 0;

    /** Number of rows that no filter hides, counted while the rows are built */
    private visibleRows = 0;

    constructor(props: LogsProps) {
        super(props);

        this.state = {
            source: (((window as any)._localStorage as Storage) || window.localStorage).getItem('Log.source') || '1',
            severity:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem('Log.severity') || 'debug',
            message: (((window as any)._localStorage as Storage) || window.localStorage).getItem('Log.message') || '',
            reverse:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem('Log.reverse') === 'true',
            logDeleteDialog: false,
            logDownloadDialog: null,
            logFiles: [],
            logs: null,
            logSize: null,
            logErrors: 0,
            logWarnings: 0,
            estimatedSize: true,
            pause: 0,
            // pauseCount: 0,
            pid: (((window as any)._localStorage as Storage) || window.localStorage).getItem('Logs.pid') === 'true',
            colors:
                (((window as any)._localStorage as Storage) || window.localStorage).getItem('Logs.colors') === 'true',
            adapters: {},
            sources: {},
            currentHost: this.props.currentHost,
            hosts: {},
            searchHours: 0,
            searching: false,
            searchError: '',
            searchTruncated: false,
            searchInstance: '',
        };

        this.scrollToEnd = this.state.reverse;

        this.severities = {
            silly: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4,
        };

        this.t = props.t;
    }

    /**
     * Prepare entries that replace the shown ones: stripes, formatted time, counters and sources.
     *
     * @param logs the new entries, oldest first. They are changed in place
     */
    prepareLogs(logs: LogLineSavedExtended[]): Pick<LogsState, 'logErrors' | 'logWarnings' | 'sources'> {
        let logWarnings = 0;
        let logErrors = 0;
        let lastOdd = true;
        const sources: Record<string, { active: boolean; icon: string; color?: string }> = JSON.parse(
            JSON.stringify(this.state.sources),
        );
        Object.values(sources).forEach(source => (source.active = false));

        logs.forEach(item => {
            lastOdd = !lastOdd;
            item.odd = lastOdd;

            if (!item.time) {
                const date = new Date(item.ts);
                item.time =
                    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ` +
                    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            }
            if (item.severity === 'error') {
                logErrors++;
            } else if (item.severity === 'warn') {
                logWarnings++;
            }

            if (item.from) {
                if (!sources[item.from]) {
                    sources[item.from] = { active: true, icon: this.getSourceIcon(item.from) };
                } else {
                    sources[item.from].active = true;
                }
            }
        });

        // define for every source the own color
        let color = 0;
        const COLORS = this.props.themeType === 'dark' ? COLORS_DARK : COLORS_LIGHT;
        Object.keys(sources)
            .sort()
            .forEach(id => {
                sources[id].color = COLORS[color % COLORS.length];
                color++;
            });

        return { logErrors, logWarnings, sources };
    }

    /**
     * Show the latest entries the host hands out. Leaves the search in the log files.
     *
     * @param force read anew instead of taking the cached answer
     * @param logFiles list of the log files to store together with the entries
     * @param cb called when the entries are shown
     */
    readLogs(
        force: boolean,
        logFiles?: { path: { fileName: string; size: number }; name: string }[],
        cb?: () => void,
    ): void {
        const request = ++this.logsRequest;
        this.searchUntil = 0;
        if (this.state.searchHours || this.state.searching || this.state.searchError) {
            this.setState({ searchHours: 0, searching: false, searchError: '', searchTruncated: false });
        }

        if (this.props.logsWorker && this.state.hosts) {
            // Ask the host for the selected severity only. A controller that can do it returns a
            // window that actually holds that many entries of this level instead of a fixed byte
            // window that a chatty debug log fills up on its own (#3578).
            void this.props.logsWorker.getLogs(force, this.getRequestedLogLevel()).then(results => {
                if (!results) {
                    return;
                }
                if (request !== this.logsRequest) {
                    // a search that was started in the meantime shows its own entries
                    if (logFiles) {
                        this.setState({ logFiles }, () => cb && cb());
                    } else if (cb) {
                        cb();
                    }
                    return;
                }
                const logs: LogLineSavedExtended[] = [...results.logs];

                // scroll down by reverse direction
                this.scrollToEnd = this.state.reverse;

                const newState: Partial<LogsState> = {
                    logs,
                    logSize: results.logSize,
                    estimatedSize: false,
                    ...this.prepareLogs(logs),
                };
                if (logFiles) {
                    newState.logFiles = logFiles;
                }
                this.setState(newState as LogsState, () => cb && cb());
            });
        } else if (logFiles) {
            this.setState({ logFiles }, () => cb && cb());
        }
    }

    /** The log files can be searched as soon as the admin instance that does it is known */
    isSearchPossible(): boolean {
        return !!this.state.searchInstance;
    }

    /** Time range for a search that is started without choosing one */
    static getLastSearchHours(): number {
        const hours = parseInt(
            (((window as any)._localStorage as Storage) || window.localStorage).getItem('Log.searchHours') || '',
            10,
        );
        return hours && SEARCH_RANGES.includes(hours) ? hours : DEFAULT_SEARCH_HOURS;
    }

    /**
     * Find out which admin instance serves this page: it searches the log files - the ones of its own host
     * on the disk, the ones of other hosts through their js-controller
     */
    async detectSearchInstance(): Promise<void> {
        try {
            this.setState({ searchInstance: await this.props.socket.getCurrentInstance() });
        } catch (error) {
            console.warn(`Cannot find out the admin instance: ${error}`);
        }
    }

    /**
     * Search the log files with the filters of the table.
     *
     * The found entries replace the shown ones, and the live log goes on adding the new entries.
     *
     * @param hours time range. Without it, the range of the shown search or the last used one
     */
    async searchLogFiles(hours?: number): Promise<void> {
        if (!this.isSearchPossible()) {
            return;
        }
        hours ||= this.state.searchHours || Logs.getLastSearchHours();

        const request = ++this.logsRequest;
        this.setState({ searchHours: hours, searching: true, searchError: '' });

        const source =
            this.state.source !== '1' && this.state.sources[this.state.source] ? this.state.source : undefined;

        try {
            const result = await this.props.socket.sendTo<
                { lines?: string[]; truncated?: boolean; until?: number; error?: string } | string | null
            >(this.state.searchInstance, 'admin:searchLogs', {
                host: this.state.currentHost,
                hours,
                level: this.state.severity,
                source,
                text: this.state.message || undefined,
                maxRows: MAX_LOGS,
            });
            if (request !== this.logsRequest) {
                return;
            }
            // a missing permission is answered with a plain text
            if (!result || typeof result !== 'object' || !Array.isArray(result.lines)) {
                throw new Error((typeof result === 'string' ? result : result?.error) || 'no answer');
            }

            const logs: LogLineSavedExtended[] = [];
            let lastKey = 0;
            for (const line of result.lines) {
                const item: LogLineSavedExtended | null = parseLogFileLine(line);
                if (item) {
                    // the same keys as the log worker gives
                    if (lastKey && lastKey <= item.ts) {
                        item.key = lastKey + 1;
                    }
                    lastKey = item.key || 0;
                    item.message = AdminUtils.parseColorMessage(item.message as string);
                    logs.push(item);
                }
            }

            // The live log went on while the files were read: keep what is newer than them
            const until = result.until || Date.now();
            this.state.logs?.forEach(item => item.ts > until && logs.push(item));
            if (logs.length > MAX_LOGS) {
                logs.splice(0, logs.length - MAX_LOGS);
            }

            this.searchUntil = until;
            this.scrollToEnd = this.state.reverse;

            this.setState({
                logs,
                searching: false,
                searchTruncated: !!result.truncated,
                // the counted entries of a paused view are gone
                pause: 0,
                ...this.prepareLogs(logs),
            });
        } catch (error) {
            if (request === this.logsRequest) {
                this.setState({ searching: false, searchError: (error as Error).message || String(error) });
            }
        }
    }

    /**
     * Choose the time range of the table: the latest entries of the host, or a search in the log files.
     *
     * @param hours time range in hours, `0` for the latest entries
     */
    handleSearchHoursChange(hours: number): void {
        if (!hours) {
            this.readLogs(true);
            return;
        }
        (((window as any)._localStorage as Storage) || window.localStorage).setItem(
            'Log.searchHours',
            hours.toString(),
        );
        void this.searchLogFiles(hours);
    }

    /** A filter of the table changed: a shown search result is searched anew with it */
    onFilterChanged(): void {
        if (this.state.searchHours) {
            void this.searchLogFiles();
        }
    }

    /** Download the shown entries - with all filters applied and in the shown order - as a text file */
    exportLogs(): void {
        const lines: string[] = [];
        const filterMessage = this.state.message.toLowerCase();
        const sourceFilter =
            this.state.source !== '1' && this.state.sources[this.state.source] ? this.state.source : '1';
        const logs = this.state.logs || [];
        const length = this.state.pause > 0 ? this.state.pause : logs.length;

        for (let i = 0; i < length; i++) {
            const row = logs[i];
            if (row && !this.getRowView(row, sourceFilter, filterMessage).hidden) {
                const message = typeof row.message === 'object' ? row.message.original : row.message;
                lines.push(`${row.time}  - ${row.severity}: ${(message || '').replace(ANSI_COLOR, '')}`);
            }
        }
        if (!this.state.reverse) {
            lines.reverse();
        }

        const url = window.URL.createObjectURL(
            new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `iobroker-log-${this.state.currentHost.replace('system.host.', '')}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(link);
        try {
            link.click();
        } finally {
            link.remove();
            // give the browser time to start the download
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
    }

    async readLogFiles(): Promise<{ path: { fileName: string; size: number }; name: string }[]> {
        const list: { fileName: string; size: number }[] = await this.props.socket.getLogsFiles(this.state.currentHost);
        if (list?.length) {
            const logFiles: { path: { fileName: string; size: number }; name: string }[] = [];

            list.reverse();
            // first 2018-01-01
            list.forEach(file => {
                const parts = file.fileName.split('/');
                const name = (parts.pop() || '').replace(/iobroker\.?/, '').replace('.log', '');

                if (name[0] <= '9') {
                    logFiles.push({
                        path: file,
                        name,
                    });
                }
            });

            // then restart.log and so on
            list.sort();
            list.forEach(file => {
                const parts = file.fileName.split('/');
                const name = (parts.pop() || '').replace(/iobroker\.?/, '').replace('.log', '');

                if (name[0] > '9') {
                    logFiles.push({
                        path: file,
                        name,
                    });
                }
            });

            return logFiles;
        }
        return [];
    }

    componentDidMount(): void {
        // this.props.logsWorker && this.props.logsWorker.enableCountErrors(false);
        this.props.logsWorker.registerHandler(this.logHandler);
        this.props.clearErrors();

        void this.props.socket.getCompactAdapters().then(async (adapters: Record<string, CompactAdapterInfo>) => {
            const _hosts: CompactHost[] = await this.props.socket.getCompactHosts();
            const hosts: Record<string, CompactHost> = {};
            _hosts.forEach(item => (hosts[item._id] = item));

            await new Promise<void>(resolve => {
                this.setState({ adapters, hosts }, () => resolve());
            });
            const logFiles = await this.readLogFiles();
            this.readLogs(true, logFiles);
        });

        void this.detectSearchInstance();
    }

    componentWillUnmount(): void {
        // this.props.logsWorker && this.props.logsWorker.enableCountErrors(true);
        this.props.logsWorker.unregisterHandler(this.logHandler);
        this.props.clearErrors();
    }

    getSourceIcon(from: string): string {
        const adapterName = from.replace(/\.\d+$/, '');
        let icon = this.state.adapters[adapterName]?.icon;
        if (icon) {
            if (!icon.startsWith('data:image')) {
                icon = `./files/${adapterName}.admin/${icon}`;
            }
        } else if (this.state.hosts) {
            icon = this.state.hosts[`system.${from}`]?.common?.icon || 'img/no-image.svg';
        }
        return icon || '';
    }

    logHandler = (newLogs: LogLineSaved[], size: number): void => {
        if (this.ignoreNextLogs) {
            this.ignoreNextLogs = false;
            return;
        }
        if (this.searchUntil) {
            // A search result is shown. What the log worker reads again after a reconnection is
            // older than the files and in the result already; only the newer entries are added.
            newLogs = newLogs.filter(line => line.ts > this.searchUntil);
            if (!newLogs.length) {
                return;
            }
        }

        const oldLogs = this.state.logs || [];
        const logs = oldLogs.concat(newLogs);

        if (logs.length > MAX_LOGS) {
            logs.splice(0, logs.length - MAX_LOGS);
        }

        let logWarnings = 0;
        let logErrors = 0;
        let lastOdd = false;
        let sources: Record<string, { active: boolean; icon: string; color?: string }> | undefined;
        let color = Object.keys(this.state.sources).length;
        const COLORS = this.props.themeType === 'dark' ? COLORS_DARK : COLORS_LIGHT;

        logs.forEach(item => {
            if (item.odd !== undefined) {
                lastOdd = item.odd;
            } else {
                lastOdd = !lastOdd;
                item.odd = lastOdd;
            }
            if (!item.time) {
                const date = new Date(item.ts);
                item.time =
                    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ` +
                    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            }
            if (item.severity === 'error') {
                logErrors++;
            } else if (item.severity === 'warn') {
                logWarnings++;
            }

            if (item.from) {
                if (!this.state.sources[item.from] && !sources?.[item.from]) {
                    sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                    sources![item.from] = {
                        active: true,
                        color: COLORS[color % COLORS.length],
                        icon: this.getSourceIcon(item.from),
                    };
                    color++;
                } else if (!this.state.sources[item.from]?.active && !sources?.[item.from]?.active) {
                    sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                    sources![item.from].active = true;
                }
            }
        });

        const newState: Partial<LogsState> = {
            logs,
            logSize: (this.state.logSize ?? 0) + size,
            estimatedSize: true,
            logWarnings,
            logErrors,
        };
        if (sources) {
            newState.sources = sources;
        }

        if (this.state.reverse) {
            // remember if the last element is visible
            const el = document.getElementById('endOfLog');
            this.scrollToEnd = el ? el.getBoundingClientRect().top < window.innerHeight : true;
        }

        this.setState(newState as LogsState);
    };

    clearLog(): void {
        this.props.logsWorker?.clearLines();
        this.props.clearErrors();
        // an empty table shows only the new entries, which is no search result anymore
        this.logsRequest++;
        this.searchUntil = 0;
        this.setState({
            logs: [],
            logSize: null,
            logErrors: 0,
            logWarnings: 0,
            searchHours: 0,
            searching: false,
            searchError: '',
            searchTruncated: false,
        });
    }

    handleMessageChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        (((window as any)._localStorage as Storage) || window.localStorage).setItem('Log.message', event.target.value);
        this.setState({ message: event.target.value });
    }

    handleSourceChange(source: string): void {
        (((window as any)._localStorage as Storage) || window.localStorage).setItem('Log.source', source);
        this.setState({ source }, () => this.onFilterChanged());
    }

    /**
     * The severity to request from the host.
     *
     * `silly` and `debug` mean "everything", so nothing is gained by sending them - the plain
     * request stays and the host keeps its cheap single-chunk read.
     */
    getRequestedLogLevel(): ioBroker.LogLevel | undefined {
        const severity = this.state.severity as ioBroker.LogLevel;
        return severity === 'silly' || severity === 'debug' ? undefined : severity;
    }

    handleSeverityChange(event: SelectChangeEvent<string>): void {
        (((window as any)._localStorage as Storage) || window.localStorage).setItem('Log.severity', event.target.value);
        // A coarser severity reaches further back, so the history is read anew for the new level
        this.setState({ severity: event.target.value }, () =>
            this.state.searchHours ? this.onFilterChanged() : this.readLogs(true),
        );
    }

    handleLogDelete(): void {
        this.props.socket
            .delLogs(this.state.currentHost)
            .then(() => this.clearLog())
            .then(() => this.readLogs(true, undefined, () => this.setState({ logDeleteDialog: false })))
            .catch((error: string) => {
                this.setState({ logDeleteDialog: false });
                window.alert(error);
            });
    }

    handleLogPause(): void {
        this.setState({ pause: this.state.pause ? 0 : (this.state.logs?.length ?? 0) });
    }

    static openTab(path: string): void {
        window.open(path, '_blank')?.focus();
    }

    getLogFiles(): JSX.Element[] {
        return this.state.logFiles.map(entry => (
            <MenuItem
                style={styles.downloadEntry}
                key={entry.name}
                onClick={() => {
                    Logs.openTab(entry.path.fileName);
                    this.setState({ logDownloadDialog: null });
                }}
            >
                {entry.name}
                <Typography
                    style={styles.downloadLogSize}
                    variant="caption"
                >
                    {AdminUtils.formatBytes(entry.path.size) || '-'}
                </Typography>
            </MenuItem>
        ));
    }

    getSeverities(): JSX.Element[] {
        const severities = [];

        for (const i in this.severities) {
            severities.push(
                <MenuItem
                    value={i}
                    key={i}
                    style={styles[`${this.props.themeType}_${i}`]}
                >
                    {i}
                </MenuItem>,
            );
        }

        return severities;
    }

    getSources(): JSX.Element[] {
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');

        return sources.map(id => (
            <MenuItem
                value={id}
                key={id}
                style={{
                    backgroundColor: !this.state.colors || id === '1' ? undefined : this.state.sources[id].color,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {id === '1' ? null : (
                    <Icon
                        src={this.state.sources[id].icon || ''}
                        style={styles.iconSelect}
                    />
                )}
                {id === '1' ? this.t('Source (show all)') : id}
            </MenuItem>
        ));
    }

    getOneRow(
        i: number,
        rows: JSX.Element[],
        options: {
            filterMessage: string;
            sourceFilter: string;
            previousKey: number;
            keyPrefix: 'r' | '';
            length: number;
            visible: number;
        },
    ): void {
        const row = this.state.logs?.[i];
        if (!row) {
            return;
        }
        const severity = row.severity;
        const { message, id, hidden: isHidden } = this.getRowView(row, options.sourceFilter, options.filterMessage);
        if (!isHidden) {
            options.visible++;
        }

        const key = options.previousKey === row.key ? i : (row.key ?? i);
        options.previousKey = row.key ?? 0;

        rows.push(
            <TableRow
                id={options.length === i ? 'endOfLog' : undefined}
                sx={Utils.getStyle(
                    this.props.theme,
                    styles.row,
                    row.odd && styles.rowOdd,
                    isHidden && styles.hidden,
                    this.lastRowRender && row.ts > this.lastRowRender && styles.updatedRow,
                )}
                style={this.state.colors ? { backgroundColor: this.state.sources[row.from]?.color || undefined } : {}}
                key={options.keyPrefix + key}
                hover
            >
                <TableCell style={{ ...styles.cell, ...styles.cellName }}>
                    <div style={styles.iconAndName}>
                        <Icon
                            src={this.state.sources[row.from]?.icon || ''}
                            style={styles.icon}
                        />
                        <div style={styles.name}>{row.from}</div>
                    </div>
                </TableCell>
                {this.state.pid && (
                    <TableCell style={{ ...styles.cell, ...styles[`${this.props.themeType}_${severity}`] }}>
                        {id}
                    </TableCell>
                )}
                <TableCell style={{ ...styles.cell, ...styles[`${this.props.themeType}_${severity}`] }}>
                    {row.time}
                </TableCell>
                <TableCell
                    style={{ ...styles.cell, ...styles[`${this.props.themeType}_${severity}`], fontWeight: 'bold' }}
                >
                    {row.severity}
                </TableCell>
                <TableCell
                    style={{ ...styles.cell, ...styles[`${this.props.themeType}_${severity}`] }}
                    title={typeof message === 'object' ? message.original : message}
                >
                    {typeof message === 'object'
                        ? message.parts.map((item, idx) => (
                              <span
                                  key={idx}
                                  style={item.style}
                              >
                                  {item.text}
                              </span>
                          ))
                        : message}
                </TableCell>
            </TableRow>,
        );
    }

    /**
     * How an entry is shown: the message without source and PID, the PID, and whether a filter hides it.
     *
     * @param row the entry
     * @param sourceFilter selected source, `1` for all
     * @param filterMessage text filter in lower case
     */
    getRowView(
        row: LogLineSavedExtended,
        sourceFilter: string,
        filterMessage: string,
    ): { message: LogLineSaved['message']; id: string; hidden: boolean } {
        let message = row.message || '';
        let id = '';

        if (typeof message !== 'object') {
            const regExp = new RegExp(
                `${row.from.replace('.', '\\.').replace(')', '\\)').replace('(', '\\(')} \\(\\d+\\) `,
                'g',
            );
            const matches = message.match(regExp);

            if (matches) {
                message = message.replace(matches[0], '');
                id = (matches[0].split(' ')[1].match(/\d+/g) || [''])[0];
            } else {
                message = message.replace(`${row.from} `, '');
            }
        }

        const isFrom = sourceFilter !== '1' && sourceFilter !== row.from;

        let hidden = isFrom || this.severities[row.severity] < this.severities[this.state.severity];
        if (!hidden && filterMessage) {
            if (typeof message === 'object') {
                hidden = !message.original.toLowerCase().includes(filterMessage);
            } else {
                hidden = !message.toLowerCase().includes(filterMessage);
            }
        }

        return { message, id, hidden };
    }

    getRows(): JSX.Element[] {
        const rows: JSX.Element[] = [];
        const options: {
            filterMessage: string;
            sourceFilter: string;
            previousKey: number;
            keyPrefix: 'r' | '';
            length: number;
            visible: number;
        } = {
            filterMessage: this.state.message.toLowerCase(),
            sourceFilter: this.state.source,
            previousKey: 0,
            keyPrefix: '',
            length: 0,
            visible: 0,
        };
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');
        if (!sources.includes(options.sourceFilter)) {
            options.sourceFilter = '1';
        }

        options.previousKey = 0;
        options.keyPrefix = this.state.reverse ? 'r' : '';
        options.length = this.state.pause > 0 ? this.state.pause - 1 : (this.state.logs?.length ?? 0) - 1;
        if (this.state.reverse) {
            for (let i = 0; i <= options.length; i++) {
                this.getOneRow(i, rows, options);
            }
        } else {
            for (let i = options.length; i >= 0; i--) {
                this.getOneRow(i, rows, options);
            }
        }

        // Scroll to last element
        if (options.length > 0 && this.scrollToEnd) {
            setTimeout(() => {
                const el = document.getElementById('endOfLog');
                el?.scrollIntoView();
            }, 200);
            this.scrollToEnd = false;
        }

        if (!this.lastRowRender || Date.now() - this.lastRowRender > 1000) {
            if (!this.lastRowRenderTimeout) {
                this.lastRowRenderTimeout = setTimeout(() => {
                    this.lastRowRenderTimeout = null;
                    this.lastRowRender = Date.now();
                }, 1000);
            }
        }

        this.visibleRows = options.visible;

        return rows;
    }

    renderClearDialog(): JSX.Element | null {
        if (!this.state.logDeleteDialog) {
            return null;
        }

        return (
            <Dialog
                onClose={() => this.setState({ logDeleteDialog: false })}
                open={!0}
            >
                <DialogTitle>
                    {this.t('Please confirm')}
                    <IconButton
                        size="large"
                        sx={styles.closeButton}
                        onClick={() => this.setState({ logDeleteDialog: false })}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>{this.t('Log file will be deleted. Are you sure?')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={() => this.handleLogDelete()}
                        color="primary"
                        startIcon={<CheckIcon />}
                    >
                        {this.t('Ok')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ logDeleteDialog: false })}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    changePid(): void {
        const pid = !this.state.pid;
        (((window as any)._localStorage as Storage) || window.localStorage).setItem('Logs.pid', pid ? 'true' : 'false');
        this.setState({ pid });
    }

    renderToolbar(): JSX.Element {
        const pauseChild = !this.state.pause ? (
            <PauseIcon />
        ) : (
            <Typography style={styles.pauseCount}>{(this.state.logs?.length ?? 0) - this.state.pause}</Typography>
        );

        const isMobile = this.props.width === 'xs' || this.props.width === 'sm';

        const downloadLogButton = isMobile ? (
            <IconButton
                color="primary"
                onClick={event => this.setState({ logDownloadDialog: event.currentTarget })}
            >
                <SaveAltIcon />
            </IconButton>
        ) : (
            <Button
                variant="contained"
                color="primary"
                startIcon={<SaveAltIcon />}
                onClick={event => this.setState({ logDownloadDialog: event.currentTarget })}
            >
                {this.t('Download log')}
            </Button>
        );

        return (
            <TabHeader>
                {this.props.menuButtonSpace ? <Box sx={{ width: 40, flexShrink: 0 }} /> : null}
                <Tooltip
                    title={this.props.t('Refresh log')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => (this.state.searchHours ? void this.searchLogFiles() : this.readLogs(true))}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Pause output')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        style={styles.pauseButton}
                        onClick={() => this.handleLogPause()}
                    >
                        {pauseChild}
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Clear log')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => this.clearLog()}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Clear on disk permanent')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => this.setState({ logDeleteDialog: true })}
                    >
                        <DeleteForeverIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Show/hide PID')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => this.changePid()}
                        color={!this.state.pid ? 'default' : 'primary'}
                    >
                        <div style={styles.pidSize}>{this.props.t('PID')}</div>
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Show/hide colors')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => {
                            (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                'Logs.colors',
                                this.state.colors ? 'false' : 'true',
                            );
                            this.setState({ colors: !this.state.colors });
                        }}
                        color={!this.state.colors ? 'default' : 'primary'}
                    >
                        <ColorsIcon style={{ width: '0.8em', height: '0.8em' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Reverse output direction')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        size="large"
                        onClick={() => {
                            (((window as any)._localStorage as Storage) || window.localStorage).setItem(
                                'Log.reverse',
                                this.state.reverse ? 'false' : 'true',
                            );
                            this.setState({ reverse: !this.state.reverse });
                            setTimeout(() => {
                                // scroll to endOfLog
                                const element = document.getElementById('endOfLog');
                                element?.scrollIntoView();
                            }, 500);
                        }}
                        color={!this.state.reverse ? 'default' : 'primary'}
                    >
                        {this.state.reverse ? <ArrowDownward /> : <ArrowUpward />}
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Show errors')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <Badge
                        badgeContent={this.state.logErrors}
                        color="error"
                        sx={{ '& .MuiBadge-badge': { ...styles.badge, ...styles.badgeError } }}
                    >
                        <IconButton
                            size="large"
                            onClick={() => {
                                if (this.state.severity === 'error') {
                                    this.setState({ severity: 'debug' }, () => this.onFilterChanged());
                                } else {
                                    this.setState({ severity: 'error', logErrors: 0 }, () => this.onFilterChanged());
                                }
                            }}
                            color={this.state.severity === 'error' ? 'primary' : 'default'}
                        >
                            <ErrorIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Show errors and warnings')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <Badge
                        badgeContent={this.state.logWarnings}
                        color="default"
                        sx={{ '& .MuiBadge-badge': { ...styles.badge, ...styles.badgeWarn } }}
                    >
                        <IconButton
                            size="large"
                            onClick={() => {
                                if (this.state.severity === 'warn') {
                                    this.setState({ severity: 'debug' }, () => this.onFilterChanged());
                                } else {
                                    this.setState({ severity: 'warn', logWarnings: 0 }, () => this.onFilterChanged());
                                }
                            }}
                            color={this.state.severity === 'warn' ? 'primary' : 'default'}
                        >
                            <WarningIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>
                <Tooltip
                    title={this.props.t('Export the shown entries as a text file')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <span>
                        <IconButton
                            size="large"
                            disabled={!this.state.logs?.length}
                            onClick={() => this.exportLogs()}
                        >
                            <ExportIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <div style={styles.grow} />
                {this.state.logFiles?.length ? downloadLogButton : null}
                {this.state.logDownloadDialog ? (
                    <Menu
                        id="simple-menu"
                        anchorEl={this.state.logDownloadDialog}
                        keepMounted
                        open={Boolean(this.state.logDownloadDialog)}
                        onClose={() => this.setState({ logDownloadDialog: null })}
                    >
                        {this.getLogFiles()}
                    </Menu>
                ) : null}
                {isMobile ? null : <div style={styles.grow} />}
                {isMobile ? null : this.renderLogInfo()}
                <Box sx={{ ml: 'auto', pl: 1 }}>{this.props.hostSelector}</Box>
            </TabHeader>
        );
    }

    /** Size of the log, or what the search in the log files found */
    renderLogInfo(): JSX.Element {
        if (this.state.searchError) {
            return (
                <Typography
                    variant="body2"
                    sx={[styles.logSize, styles.searchError]}
                    title={this.state.searchError}
                >
                    {this.t('Search failed: %s', this.state.searchError)}
                </Typography>
            );
        }

        if (this.state.searchHours) {
            return (
                <Typography
                    variant="body2"
                    style={styles.logSize}
                >
                    {this.t('Hits: %s', this.state.searching ? '…' : this.visibleRows)}
                    {this.state.searchTruncated && !this.state.searching ? (
                        <Tooltip
                            title={this.t('Only the newest %s hits are shown', MAX_LOGS)}
                            slotProps={{ popper: { sx: styles.tooltip } }}
                        >
                            <Box
                                component={WarningIcon}
                                sx={styles.searchTruncated}
                            />
                        </Tooltip>
                    ) : null}
                </Typography>
            );
        }

        return (
            <Typography
                variant="body2"
                title={this.state.estimatedSize ? this.props.t('Estimated size') : ''}
                style={styles.logSize}
            >
                {this.t('Log size:')}{' '}
                <span style={this.state.estimatedSize ? styles.logEstimated : undefined}>
                    {this.state.logSize === null ? '-' : AdminUtils.formatBytes(this.state.logSize)}
                </span>
            </Typography>
        );
    }

    /** Time range of the table: the latest entries, or the search in the log files */
    renderTimeHeader(): JSX.Element {
        return (
            <Tooltip
                title={this.t('Search the log files in this time range')}
                placement="top"
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                <FormControl
                    variant="standard"
                    style={styles.formControl}
                >
                    <Select
                        variant="standard"
                        value={this.state.searchHours}
                        disabled={!this.isSearchPossible()}
                        onChange={event => this.handleSearchHoursChange(Number(event.target.value))}
                    >
                        {SEARCH_RANGES.map(hours => (
                            <MenuItem
                                key={hours}
                                value={hours}
                            >
                                {!hours
                                    ? this.t('Latest entries')
                                    : hours === 1
                                      ? this.t('1 hour')
                                      : hours < 72
                                        ? this.t('%s hours', hours)
                                        : this.t('%s days', hours / 24)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Tooltip>
        );
    }

    renderTableHeader(): JSX.Element {
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');

        return (
            <TableHead>
                <TableRow>
                    <TableCell sx={styles.source}>
                        <FormControl
                            variant="standard"
                            sx={styles.formControl}
                        >
                            <Select
                                variant="standard"
                                labelId="source-label"
                                value={sources.includes(this.state.source) ? this.state.source : '1'}
                                onChange={event => this.handleSourceChange(event.target.value)}
                                renderValue={(value: string) => (
                                    <div
                                        style={{
                                            backgroundColor:
                                                !this.state.colors || value === '1'
                                                    ? undefined
                                                    : this.state.sources[value].color,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {value === '1' ? null : (
                                            <Icon
                                                src={this.state.sources[value].icon || ''}
                                                style={styles.iconSelect}
                                            />
                                        )}
                                        {value === '1' ? this.t('Source') : value}
                                    </div>
                                )}
                            >
                                {this.getSources()}
                            </Select>
                            {(sources.includes(this.state.source) ? this.state.source : '1') !== '1' ? (
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 1,
                                        right: 15,
                                        zIndex: 1,
                                    }}
                                    size="small"
                                    onClick={() => this.handleSourceChange('1')}
                                >
                                    <Clear />
                                </IconButton>
                            ) : null}
                        </FormControl>
                    </TableCell>
                    {this.state.pid && (
                        <TableCell sx={styles.pid}>
                            <Box
                                component="div"
                                sx={styles.header}
                            >
                                {this.t('PID')}
                            </Box>
                        </TableCell>
                    )}
                    <TableCell sx={styles.timestamp}>{this.renderTimeHeader()}</TableCell>
                    <TableCell sx={styles.severity}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <Select
                                variant="standard"
                                labelId="severity-label"
                                value={this.state.severity}
                                onChange={event => this.handleSeverityChange(event)}
                                renderValue={value => (
                                    <span style={styles[`${this.props.themeType}_${value}`]}>{value}</span>
                                )}
                            >
                                {this.getSeverities()}
                            </Select>
                        </FormControl>
                    </TableCell>
                    <TableCell sx={styles.message}>
                        <FormControl
                            variant="standard"
                            style={styles.formControl}
                        >
                            <TextField
                                variant="standard"
                                sx={styles.messageText}
                                placeholder={this.t('Message')}
                                onChange={event => this.handleMessageChange(event)}
                                // typing filters the shown entries, Enter searches the log files
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        void this.searchLogFiles();
                                    }
                                }}
                                value={this.state.message}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <>
                                                {this.state.message ? (
                                                    <IconButton
                                                        tabIndex={-1}
                                                        size="small"
                                                        onClick={() => {
                                                            (
                                                                ((window as any)._localStorage as Storage) ||
                                                                window.localStorage
                                                            ).removeItem('Log.message');
                                                            this.setState({ message: '' });
                                                        }}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                ) : null}
                                                {this.isSearchPossible() ? (
                                                    <Tooltip
                                                        title={this.t('Search in the log files (Enter)')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            tabIndex={-1}
                                                            size="small"
                                                            disabled={this.state.searching}
                                                            onClick={() => this.searchLogFiles()}
                                                        >
                                                            <SearchIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : null}
                                            </>
                                        ),
                                    },
                                }}
                            />
                        </FormControl>
                    </TableCell>
                </TableRow>
            </TableHead>
        );
    }

    render(): JSX.Element {
        if (!this.state.logs) {
            return <LinearProgress />;
        }

        if (this.state.logFiles === null && !this.readLogsInProcess) {
            this.readLogsInProcess = true;
            setTimeout(
                () =>
                    this.readLogFiles().then(logFiles => {
                        this.readLogsInProcess = false;
                        this.setState({ logFiles });
                    }),
                100,
            );
        }

        if (this.props.currentHost !== this.state.currentHost) {
            this.hostsTimer =
                this.hostsTimer ||
                setTimeout(() => {
                    this.hostsTimer = null;
                    // readLogs also leaves a search: the files of another host cannot be searched
                    this.setState(
                        {
                            currentHost: this.props.currentHost,
                            logs: [],
                            logFiles: [],
                        },
                        () => this.readLogs(true),
                    );
                }, 200);
        }

        // the rows first: the toolbar shows how many of them are visible
        const rows = this.getRows();

        return (
            <TabContainer>
                {this.renderToolbar()}
                {/* relative, so that the progress of a search lies over the table instead of moving it */}
                <TabContent style={{ position: 'relative' }}>
                    {this.state.searching ? <LinearProgress sx={styles.searchProgress} /> : null}
                    <TableContainer style={styles.container}>
                        <Table
                            stickyHeader
                            size="small"
                            sx={styles.table}
                        >
                            {this.renderTableHeader()}
                            <TableBody>{rows}</TableBody>
                        </Table>
                    </TableContainer>
                </TabContent>
                {this.renderClearDialog()}
            </TabContainer>
        );
    }
}

export default withWidth()(Logs);
