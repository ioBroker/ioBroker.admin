import React, { Component } from 'react';

import { type Styles, withStyles } from '@mui/styles';

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
} from '@mui/material';

import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    DeleteForever as DeleteForeverIcon,
    Pause as PauseIcon,
    Refresh as RefreshIcon,
    SaveAlt as SaveAltIcon,
    ErrorOutline as ErrorIcon,
    Warning as WarningIcon,
    Check as CheckIcon, ArrowUpward, ArrowDownward, Clear,
} from '@mui/icons-material';
import { FaPalette as ColorsIcon } from 'react-icons/fa';

import { amber, grey, red } from '@mui/material/colors';

import {
    Icon, withWidth, Utils as UtilsCommon,
    TabHeader,
    type IobTheme, type ThemeType,
    type Translate, type AdminConnection,
    TabContainer,
    TabContent,
} from '@iobroker/adapter-react-v5';

import type LogsWorker from '@/Workers/LogsWorker';
import type { LogLineSaved } from '@/Workers/LogsWorker';
import type { CompactAdapterInfo, CompactHost } from '@/types';

import Utils from '../Utils';

const MAX_LOGS = 3000;

const styles: Styles<IobTheme, any> = theme => ({
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
    },
    row: {
    },
    rowOdd: {
        backgroundColor: theme.palette.background.default,
    },
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
    },
    pid: {
        width: 55,
    },
    timestamp: {
        width: 175,
    },
    severity: {
        width: 80,
    },
    message: {
        minWidth: 300,
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
    closeButton: {
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    },
    header: {
        '& .MuiFormLabel-root.Mui-disabled': {
            color: theme.palette.text.primary,
        },
        '& .MuiInput-underline::before': {
            content: '',
            borderBottom: 'none',
        },
    },
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
    '@media screen and (max-width: 450px)': {
        row: {
            '& > *': {
                fontSize: 8,
            },
        },
        source: {
            width: 120,
        },
        pid: {
            width: 40,
        },
        timestamp: {
            width: 100,
        },
        severity: {
            width: 61,
        },
        message: {
            minWidth: 150,
        },
        formControl: {
            '& > *': {
                fontSize: '10px !important',
            },
            position: 'relative',
        },
        header: {
            '& > *': {
                fontSize: '10px !important',
            },
        },
        messageText: {
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
    iconAndName:{
        whiteSpace: 'nowrap',
        display: 'flex',
    },
    tooltip: {
        pointerEvents: 'none',
    },
});

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

// Number prototype is read-only, properties should not be added
function padding2(num: number) {
    let s = num.toString();
    if (s.length < 2) {
        s = `0${s}`;
    }
    return s;
}
function padding3(num: number) {
    let s = num.toString();
    if (s.length < 2) {
        s = `00${s}`;
    } else if (s.length < 3) {
        s = `0${s}`;
    }
    return s;
}
interface LogLineSavedExtended extends LogLineSaved {
    odd?: boolean;
    time?: string;
    icon?: string;
}

interface LogsProps {
    classes: Record<string, string>;
    socket: AdminConnection;
    currentHost: string;
    clearErrors: () => void;
    logsWorker: LogsWorker;
    themeType: ThemeType;
    t: Translate;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
}

class Logs extends Component<LogsProps, LogsState> {
    private readonly severities: Record<string, number>;

    private readonly t: Translate;

    private ignoreNextLogs: boolean;

    private lastRowRender: number;

    private lastRowRenderTimeout: ReturnType<typeof setTimeout> | null = null;

    private readLogsInProcess: boolean;

    private hostsTimer: ReturnType<typeof setTimeout> | null = null;

    private scrollToEnd: boolean;

    constructor(props: LogsProps) {
        super(props);

        this.state = {
            source: ((window as any)._localStorage as Storage || window.localStorage).getItem('Log.source') || '1',
            severity: ((window as any)._localStorage as Storage || window.localStorage).getItem('Log.severity') || 'debug',
            message: ((window as any)._localStorage as Storage || window.localStorage).getItem('Log.message') || '',
            reverse: ((window as any)._localStorage as Storage || window.localStorage).getItem('Log.reverse') === 'true',
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
            pid: ((window as any)._localStorage as Storage || window.localStorage).getItem('Logs.pid') === 'true',
            colors: ((window as any)._localStorage as Storage || window.localStorage).getItem('Logs.colors') === 'true',
            adapters: {},
            sources: {},
            currentHost: this.props.currentHost,
            hosts: null,
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

    readLogs(force: boolean, logFiles?: { path: { fileName: string; size: number }; name: string }[], cb?: () => void) {
        if (this.props.logsWorker && this.state.hosts) {
            this.props.logsWorker.getLogs(force)
                .then(results => {
                    if (!results) {
                        return;
                    }
                    const logs: LogLineSavedExtended[] = [...results.logs];
                    const logSize = results.logSize;

                    let logWarnings = 0;
                    let logErrors = 0;
                    let lastOdd = true;
                    const sources: Record<string, { active: boolean; icon: string; color?: string }> = JSON.parse(JSON.stringify(this.state.sources));
                    Object.values(sources).forEach(source => source.active = false);

                    logs.forEach(item => {
                        lastOdd = !lastOdd;
                        item.odd = lastOdd;

                        if (!item.time) {
                            const date = new Date(item.ts);
                            item.time = `${date.getFullYear()}-${padding2(date.getMonth() + 1)}-${padding2(date.getDate())} ` +
                                `${padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}.${padding3(date.getMilliseconds())}`;
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
                    Object.keys(sources).sort().forEach(id => {
                        sources[id].color = COLORS[color % COLORS.length];
                        color++;
                    });

                    // scroll down by reverse direction
                    this.scrollToEnd = this.state.reverse;

                    const newState: Partial<LogsState> = {
                        logs,
                        logSize,
                        estimatedSize: false,
                        logErrors,
                        logWarnings,
                        sources,
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

    async readLogFiles(): Promise<{ path: { fileName: string; size: number }; name: string }[]> {
        const list: { fileName: string; size: number }[] = await this.props.socket.getLogsFiles(this.state.currentHost);
        if (list?.length) {
            const logFiles: { path: { fileName: string; size: number }; name: string }[] = [];

            list.reverse();
            // first 2018-01-01
            list.forEach(file => {
                const parts = file.fileName.split('/');
                const name = parts.pop().replace(/iobroker\.?/, '').replace('.log', '');

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
                const name = parts.pop().replace(/iobroker\.?/, '').replace('.log', '');

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

    componentDidMount() {
        // this.props.logsWorker && this.props.logsWorker.enableCountErrors(false);
        this.props.logsWorker.registerHandler(this.logHandler);
        this.props.clearErrors();

        this.props.socket.getCompactAdapters()
            .then(async (adapters: Record<string, CompactAdapterInfo>) => {
                const _hosts: CompactHost[] = await this.props.socket.getCompactHosts();
                const hosts: Record<string, CompactHost> = {};
                _hosts.forEach(item => hosts[item._id] = item);

                await new Promise<void>(resolve => {
                    this.setState({ adapters, hosts }, () => resolve());
                });
                const logFiles = await this.readLogFiles();
                this.readLogs(true, logFiles);
            });
    }

    componentWillUnmount() {
        // this.props.logsWorker && this.props.logsWorker.enableCountErrors(true);
        this.props.logsWorker.unregisterHandler(this.logHandler);
        this.props.clearErrors();
    }

    getSourceIcon(from: string) {
        const adapterName = from.replace(/\.\d+$/, '');
        let icon = this.state.adapters[adapterName]?.icon;
        if (icon) {
            if (!icon.startsWith('data:image')) {
                icon = `./files/${adapterName}.admin/${icon}`;
            }
        } else if (this.state.hosts) {
            icon = this.state.hosts[`system.${from}`]?.common?.icon || 'img/no-image.png';
        }
        return icon || null;
    }

    logHandler = (newLogs: LogLineSaved[], size: number) => {
        if (this.ignoreNextLogs) {
            this.ignoreNextLogs = false;
            return;
        }

        const oldLogs = this.state.logs || [];
        const logs = oldLogs.concat(newLogs);

        if (logs.length > MAX_LOGS) {
            logs.splice(0, logs.length - MAX_LOGS);
        }

        let logWarnings = 0;
        let logErrors = 0;
        let lastOdd = false;
        let sources: Record<string, { active: boolean; icon: string; color?: string }>;
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
                item.time = `${date.getFullYear()}-${padding2(date.getMonth() + 1)}-${padding2(date.getDate())} ` +
                    `${padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}.${padding3(date.getMilliseconds())}`;
            }
            if (item.severity === 'error') {
                logErrors++;
            } else if (item.severity === 'warn') {
                logWarnings++;
            }

            if (item.from) {
                if (!this.state.sources[item.from] && !sources?.[item.from]) {
                    sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                    sources[item.from] = {
                        active: true,
                        color: COLORS[color % COLORS.length],
                        icon: this.getSourceIcon(item.from),
                    };
                    color++;
                } else if (!this.state.sources[item.from]?.active && !sources?.[item.from]?.active) {
                    sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                    sources[item.from].active = true;
                }
            }
        });

        const newState: Partial<LogsState> = {
            logs,
            logSize: this.state.logSize + size,
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
            this.scrollToEnd =  el ? el.getBoundingClientRect().top < window.innerHeight : true;
        }

        this.setState(newState as LogsState);
    };

    clearLog() {
        this.props.logsWorker && this.props.logsWorker.clearLines();
        this.props.clearErrors();
        this.setState({
            logs: [], logSize: null, logErrors: 0, logWarnings: 0,
        });
    }

    handleMessageChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Log.message', event.target.value);
        this.setState({ message: event.target.value });
    }

    handleSourceChange(source: string) {
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Log.source', source);
        this.setState({ source });
    }

    handleSeverityChange(event: SelectChangeEvent<string>) {
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Log.severity', event.target.value);
        this.setState({ severity: event.target.value });
    }

    handleLogDelete() {
        this.props.socket.delLogs(this.state.currentHost)
            .then(() => this.clearLog())
            .then(() => this.readLogs(true, null, () => this.setState({ logDeleteDialog: false })))
            .catch((error: string) => {
                this.setState({ logDeleteDialog: false });
                window.alert(error);
            });
    }

    handleLogPause() {
        this.setState({ pause: this.state.pause ? 0 : this.state.logs.length });
    }

    static openTab(path: string) {
        const tab = window.open(path, '_blank');
        tab.focus();
    }

    getLogFiles() {
        const { classes } = this.props;

        return this.state.logFiles.map(entry => <MenuItem
            className={classes.downloadEntry}
            key={entry.name}
            onClick={() => {
                Logs.openTab(entry.path.fileName);
                this.setState({ logDownloadDialog: null });
            }}
        >
            {entry.name}
            <Typography
                className={classes.downloadLogSize}
                variant="caption"
            >
                {Utils.formatBytes(entry.path.size) || '-'}
            </Typography>
        </MenuItem>);
    }

    getSeverities() {
        const severities = [];

        for (const i in this.severities) {
            severities.push(<MenuItem value={i} key={i} className={this.props.classes[`${this.props.themeType}_${i}`]}>{i}</MenuItem>);
        }

        return severities;
    }

    getSources() {
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');

        return sources.map(id =>
            <MenuItem
                value={id}
                key={id}
                style={{
                    backgroundColor: !this.state.colors || id === '1' ? undefined : this.state.sources[id].color,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {id === '1' ?
                    null :
                    <Icon src={this.state.sources[id].icon || ''} className={this.props.classes.iconSelect} />}
                {id === '1' ?
                    this.t('Source (show all)') :
                    id}
            </MenuItem>);
    }

    getOneRow(i: number, rows: React.JSX.Element[], options: {
        filterMessage: string;
        sourceFilter: string;
        previousKey: number;
        keyPrefix: 'r' | '';
        length: number;
    }) {
        const row = this.state.logs[i];
        if (!row) {
            return;
        }
        const { classes } = this.props;
        const severity = row.severity;

        let message = row.message || '';
        let id = '';

        if (typeof message !== 'object') {
            const regExp = new RegExp(`${row.from.replace('.', '\\.').replace(')', '\\)').replace('(', '\\(')} \\(\\d+\\) `, 'g');
            const matches = message.match(regExp);

            if (matches) {
                message = message.replace(matches[0], '');
                id = matches[0].split(' ')[1].match(/\d+/g)[0];
            } else {
                message = message.replace(`${row.from} `, '');
            }
        }

        const isFrom = options.sourceFilter !== '1' && options.sourceFilter !== row.from;

        let isHidden = isFrom || this.severities[severity] < this.severities[this.state.severity];
        if (!isHidden && options.filterMessage) {
            if (typeof message === 'object') {
                isHidden = !message.original.toLowerCase().includes(options.filterMessage);
            } else {
                isHidden = !message.toLowerCase().includes(options.filterMessage);
            }
        }

        const key = options.previousKey === row.key ? i : row.key;
        options.previousKey = row.key;

        rows.push(<TableRow
            id={options.length === i ? 'endOfLog' : undefined}
            className={UtilsCommon.clsx(classes.row, row.odd && classes.rowOdd, isHidden && classes.hidden, this.lastRowRender && row.ts > this.lastRowRender && classes.updatedRow)}
            style={this.state.colors ? { backgroundColor: this.state.sources[row.from]?.color || undefined } : {}}
            key={options.keyPrefix + key}
            hover
        >
            <TableCell className={UtilsCommon.clsx(classes.cell, classes.cellName)}>
                <div className={classes.iconAndName}>
                    <Icon src={this.state.sources[row.from]?.icon || ''} className={classes.icon} />
                    <div className={classes.name}>{row.from}</div>
                </div>
            </TableCell>
            {this.state.pid && <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}>
                {id}
            </TableCell>}
            <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}>
                {row.time}
            </TableCell>
            <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])} style={{ fontWeight: 'bold' }}>
                {row.severity}
            </TableCell>
            <TableCell
                className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}
                title={typeof message === 'object' ? message.original : message}
            >
                {typeof message === 'object' ? message.parts.map((item, idx) => <span key={idx} style={item.style}>{item.text}</span>) : message}
            </TableCell>
        </TableRow>);
    }

    getRows() {
        const rows: React.JSX.Element[] = [];
        const options: {
            filterMessage: string;
            sourceFilter: string;
            previousKey: number;
            keyPrefix: 'r' | '';
            length: number;
        } = {
            filterMessage: this.state.message.toLowerCase(),
            sourceFilter: this.state.source,
            previousKey: 0,
            keyPrefix: '',
            length: 0,
        };
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');
        if (!sources.includes(options.sourceFilter)) {
            options.sourceFilter = '1';
        }

        options.previousKey = 0;
        options.keyPrefix = this.state.reverse ? 'r' : '';
        options.length = this.state.pause > 0 ? this.state.pause - 1 : this.state.logs.length - 1;
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
                el && el.scrollIntoView();
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

        return rows;
    }

    renderClearDialog() {
        if (!this.state.logDeleteDialog) {
            return null;
        }
        const { classes } = this.props;

        return <Dialog onClose={() => this.setState({ logDeleteDialog: false })} open={!0}>
            <DialogTitle>
                {this.t('Please confirm')}
                <IconButton size="large" className={classes.closeButton} onClick={() => this.setState({ logDeleteDialog: false })}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    {this.t('Log file will be deleted. Are you sure?')}
                </Typography>
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
        </Dialog>;
    }

    changePid() {
        const pid = !this.state.pid;
        ((window as any)._localStorage as Storage || window.localStorage).setItem('Logs.pid', pid ? 'true' : 'false');
        this.setState({ pid });
    }

    renderToolbar(classes: Record<string, string>) {
        const pauseChild = !this.state.pause ? <PauseIcon /> :
            <Typography className={classes.pauseCount}>{this.state.logs.length - this.state.pause}</Typography>;

        const isMobile = this.props.width === 'xs' || this.props.width === 'sm';

        const downloadLogButton = isMobile ? <IconButton
            color="primary"
            onClick={event => this.setState({ logDownloadDialog: event.currentTarget })}
        >
            <SaveAltIcon />
        </IconButton> : <Button
            variant="contained"
            color="primary"
            startIcon={<SaveAltIcon />}
            onClick={event => this.setState({ logDownloadDialog: event.currentTarget })}
        >
            {this.t('Download log')}
        </Button>;

        return <TabHeader>
            <Tooltip title={this.props.t('Refresh log')}>
                <IconButton size="large" onClick={() => this.readLogs(true)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Pause output')}>
                <IconButton
                    size="large"
                    className={classes.pauseButton}
                    onClick={() => this.handleLogPause()}
                >
                    {pauseChild}
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Clear log')}>
                <IconButton size="large" onClick={() => this.clearLog()}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Clear on disk permanent')}>
                <IconButton size="large" onClick={() => this.setState({ logDeleteDialog: true })}>
                    <DeleteForeverIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Show/hide PID')}>
                <IconButton
                    size="large"
                    onClick={() => this.changePid()}
                    color={!this.state.pid ? 'default' : 'primary'}
                >
                    <div className={classes.pidSize}>{this.props.t('PID')}</div>
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Show/hide colors')}>
                <IconButton
                    size="large"
                    onClick={() => {
                        ((window as any)._localStorage as Storage || window.localStorage).setItem('Logs.colors', this.state.colors ? 'false' : 'true');
                        this.setState({ colors: !this.state.colors });
                    }}
                    color={!this.state.colors ? 'default' : 'primary'}
                >
                    <ColorsIcon style={{ width: '0.8em', height: '0.8em' }} />
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Reverse output direction')}>
                <IconButton
                    size="large"
                    onClick={() => {
                        ((window as any)._localStorage as Storage || window.localStorage).setItem('Log.reverse', this.state.reverse ? 'false' : 'true');
                        this.setState({ reverse: !this.state.reverse });
                        setTimeout(() => {
                            // scroll to endOfLog
                            const element = document.getElementById('endOfLog');
                            element && element.scrollIntoView();
                        }, 500);
                    }}
                    color={!this.state.reverse ? 'default' : 'primary'}
                >
                    {this.state.reverse ? <ArrowDownward /> : <ArrowUpward />}
                </IconButton>
            </Tooltip>
            <Tooltip title={this.props.t('Show errors')}>
                <Badge
                    badgeContent={this.state.logErrors}
                    color="error"
                    classes={{ badge: UtilsCommon.clsx(classes.badge, classes.badgeError) }}
                >
                    <IconButton
                        size="large"
                        onClick={() => {
                            if (this.state.severity === 'error') {
                                this.setState({ severity: 'debug' });
                            } else {
                                this.setState({ severity: 'error', logErrors: 0 });
                            }
                        }}
                        color={this.state.severity === 'error' ? 'primary' : 'default'}
                    >
                        <ErrorIcon />
                    </IconButton>
                </Badge>
            </Tooltip>
            <Tooltip title={this.props.t('Show errors and warnings')}>
                <Badge
                    badgeContent={this.state.logWarnings}
                    color="default"
                    classes={{ badge: UtilsCommon.clsx(classes.badge, classes.badgeWarn) }}
                >
                    <IconButton
                        size="large"
                        onClick={() => {
                            if (this.state.severity === 'warn') {
                                this.setState({ severity: 'debug' });
                            } else {
                                this.setState({ severity: 'warn', logWarnings: 0 });
                            }
                        }}
                        color={this.state.severity === 'warn' ? 'primary' : 'default'}
                    >
                        <WarningIcon />
                    </IconButton>
                </Badge>
            </Tooltip>
            <div className={classes.grow} />
            {this.state.logFiles?.length ? downloadLogButton : null}
            {this.state.logDownloadDialog ? <Menu
                id="simple-menu"
                anchorEl={this.state.logDownloadDialog}
                keepMounted
                open={Boolean(this.state.logDownloadDialog)}
                onClose={() => this.setState({ logDownloadDialog: null })}
            >
                {this.getLogFiles()}
            </Menu> : null}
            {isMobile ? null : <div className={classes.grow} />}
            {isMobile ? null : <Typography
                variant="body2"
                title={this.state.estimatedSize ? this.props.t('Estimated size') : ''}
                className={classes.logSize}
            >
                {this.t('Log size:')}
                {' '}
                <span className={this.state.estimatedSize ? classes.logEstimated : ''}>{this.state.logSize === null ? '-' : Utils.formatBytes(this.state.logSize)}</span>
            </Typography>}
        </TabHeader>;
    }

    renderTableHeader(classes: Record<string, string>) {
        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');

        return <TableHead>
            <TableRow>
                <TableCell className={classes.source}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <Select
                            variant="standard"
                            labelId="source-label"
                            value={sources.includes(this.state.source) ? this.state.source : '1'}
                            onChange={event => this.handleSourceChange(event.target.value)}
                            renderValue={(value: string) => <div
                                style={{
                                    backgroundColor: !this.state.colors || value === '1' ? undefined : this.state.sources[value].color,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {value === '1' ?
                                    null :
                                    <Icon src={this.state.sources[value].icon || ''} className={this.props.classes.iconSelect} />}
                                {value === '1' ?
                                    this.t('Source') :
                                    value}
                            </div>}
                        >
                            {this.getSources()}
                        </Select>
                        {(sources.includes(this.state.source) ? this.state.source : '1') !== '1' ? <IconButton
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
                        </IconButton> : null}
                    </FormControl>
                </TableCell>
                {this.state.pid && <TableCell className={classes.pid}>
                    <div className={classes.header}>{this.t('PID')}</div>
                </TableCell>}
                <TableCell className={classes.timestamp}>
                    <div className={classes.header}>{this.t('Time')}</div>
                </TableCell>
                <TableCell className={classes.severity}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <Select
                            variant="standard"
                            labelId="severity-label"
                            value={this.state.severity}
                            onChange={event => this.handleSeverityChange(event)}
                            renderValue={value => <span className={this.props.classes[`${this.props.themeType}_${value}`]}>{value}</span>}
                        >
                            {this.getSeverities()}
                        </Select>
                    </FormControl>
                </TableCell>
                <TableCell className={classes.message}>
                    <FormControl variant="standard" className={classes.formControl}>
                        <TextField
                            variant="standard"
                            className={classes.messageText}
                            placeholder={this.t('Message')}
                            onChange={event => this.handleMessageChange(event)}
                            value={this.state.message}
                            InputProps={{
                                endAdornment:
                                    this.state.message ? <IconButton
                                        size="small"
                                        onClick={() => {
                                            ((window as any)._localStorage as Storage || window.localStorage).removeItem('Log.message');
                                            this.setState({ message: '' });
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton> : null,
                            }}
                        />
                    </FormControl>
                </TableCell>
            </TableRow>
        </TableHead>;
    }

    render() {
        if (!this.state.logs) {
            return <LinearProgress />;
        }

        const { classes } = this.props;

        if (this.state.logFiles === null && !this.readLogsInProcess) {
            this.readLogsInProcess = true;
            setTimeout(() =>
                this.readLogFiles()
                    .then(logFiles => {
                        this.readLogsInProcess = false;
                        this.setState({ logFiles });
                    }), 100);
        }

        if (this.props.currentHost !== this.state.currentHost) {
            this.hostsTimer = this.hostsTimer || setTimeout(() => {
                this.hostsTimer = null;
                this.setState({
                    currentHost: this.props.currentHost,
                    logs: [],
                    logFiles: null,
                }, () => this.readLogs(true));
            }, 200);
        }

        return <TabContainer>
            <TabHeader>
                {this.renderToolbar(classes)}
            </TabHeader>
            <TabContent>
                <TableContainer className={classes.container}>
                    <Table stickyHeader size="small" className={classes.table}>
                        {this.renderTableHeader(classes)}
                        <TableBody>
                            {this.getRows()}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabContent>
            {this.renderClearDialog()}
        </TabContainer>;
    }
}

export default withWidth()(withStyles(styles)(Logs));
