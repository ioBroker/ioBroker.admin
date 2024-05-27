import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';

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
    InputLabel,
    FormControl,
    Select,
    Tooltip,
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
    Check as CheckIcon, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';
import { FaPalette as ColorsIcon } from 'react-icons/fa';

import { amber, grey, red } from '@mui/material/colors';

import { Icon, withWidth, Utils as UtilsCommon } from '@iobroker/adapter-react-v5';

import Utils from '../Utils';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';

const MAX_LOGS = 3000;

const styles = theme => ({
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
        color: grey[300],
    },
    dark_silly: {
        color: grey[200],
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
        right: theme.spacing(1),
        top: theme.spacing(1),
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
        minWidth: theme.spacing(6),
    },
    pauseCount: {
        color: amber[500],
    },
    downloadLogSize: {
        color: grey[500],
        marginLeft: theme.spacing(2),
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
    'rgba(255,109,109,0.2)',
    'rgba(253,173,84,0.2)',
    'rgba(241,255,88,0.2)',
    'rgba(115,253,81,0.2)',
    'rgba(71,235,255,0.2)',
    'rgba(74,145,255,0.2)',
    'rgba(108,85,255,0.2)',
    'rgba(250,77,250,0.2)',
    'rgba(255,255,105,0.2)',
];

// Number prototype is read only, properties should not be added
function padding2(num) {
    let s = num.toString();
    if (s.length < 2) {
        s = `0${s}`;
    }
    return s;
}
function padding3(num) {
    let s = num.toString();
    if (s.length < 2) {
        s = `00${s}`;
    } else
        if (s.length < 3) {
            s = `0${s}`;
        }
    return s;
}

class Logs extends Component {
    constructor(props) {
        super(props);

        this.state = {
            source: (window._localStorage || window.localStorage).getItem('Log.source') || '1',
            severity: (window._localStorage || window.localStorage).getItem('Log.severity') || 'debug',
            message: (window._localStorage || window.localStorage).getItem('Log.message') || '',
            reverse: (window._localStorage || window.localStorage).getItem('Log.reverse') === 'true',
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
            pid: (window._localStorage || window.localStorage).getItem('Logs.pid') === 'true',
            colors: (window._localStorage || window.localStorage).getItem('Logs.colors') === 'true',
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

    readLogs(force, logFiles, cb) {
        if (this.props.logsWorker && this.state.hosts) {
            this.props.logsWorker.getLogs(force)
                .then(results => {
                    if (!results) {
                        return;
                    }
                    const logs = [...results.logs];
                    const logSize = results.logSize;

                    let logWarnings = 0;
                    let logErrors = 0;
                    let lastOdd = true;
                    const sources = JSON.parse(JSON.stringify(this.state.sources));
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

                        const adapterName = item.from.replace(/\.\d+$/, '');
                        let icon = this.state.adapters[adapterName]?.icon;
                        if (icon) {
                            if (!icon.startsWith('data:image')) {
                                icon = `./files/${adapterName}.admin/${icon}`;
                            }
                        } else {
                            icon = this.state.hosts[`system.${item.from}`]?.common?.icon;
                        }
                        item.icon = icon || null;

                        if (!sources[item.from]) {
                            sources[item.from] = { active: true, icon: item.icon };
                        } else {
                            sources[item.from].active = true;
                        }
                    });

                    let color = 0;
                    const COLORS = this.props.themeType === 'dark' ? COLORS_DARK : COLORS_LIGHT;
                    Object.keys(sources).sort().forEach(id => {
                        sources[id].color = COLORS[color % COLORS.length];
                        color++;
                    });

                    // scroll down by reverse direction
                    this.scrollToEnd = this.state.reverse;

                    if (logFiles) {
                        this.setState({
                            logFiles, logs, logSize, estimatedSize: false, logErrors, logWarnings, sources,
                        }, () => cb && cb());
                    } else {
                        this.setState({
                            logs, logSize, estimatedSize: false, logErrors, logWarnings, sources,
                        }, () => cb && cb());
                    }
                });
        } else if (logFiles) {
            this.setState({ logFiles }, () => cb && cb());
        }
    }

    readLogFiles() {
        return this.props.socket.getLogsFiles(this.state.currentHost)
            .then(list => {
                if (list && list.length) {
                    const logFiles = [];

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
            });
    }

    componentDidMount() {
        this.props.logsWorker && this.props.logsWorker.enableCountErrors(false);
        this.props.logsWorker.registerHandler(this.logHandler);
        this.props.clearErrors();

        this.props.socket.getCompactAdapters()
            .then(adapters =>
                this.props.socket.getCompactHosts()
                    .then(_hosts => new Promise(resolve => {
                        const hosts = {};
                        _hosts.forEach(item => hosts[item._id] = item);

                        this.setState({ adapters, hosts }, () =>
                            resolve());
                    }))
                    .then(() => this.readLogFiles())
                    .then(logFiles => this.readLogs(true, logFiles)));
    }

    componentWillUnmount() {
        this.props.logsWorker && this.props.logsWorker.enableCountErrors(true);
        this.props.logsWorker.unregisterHandler(this.logHandler);
        this.props.clearErrors();
    }

    logHandler = (newLogs, size) => {
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
        let sources;
        let color = Object.keys(this.state.sources);
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
            if (item.icon === undefined) {
                const adapterName = item.from.replace(/\.\d+$/, '');
                let icon = this.state.adapters[adapterName]?.icon;
                if (icon) {
                    if (!icon.startsWith('data:image')) {
                        icon = `./files/${adapterName}.admin/${icon}`;
                    }
                } else if (this.state.hosts) {
                    icon = this.state.hosts[`system.${item.from}`]?.common?.icon;
                }
                item.icon = icon || null;
            }

            if (!this.state.sources[item.from]) {
                sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                sources[item.from] = {
                    active: true,
                    color: COLORS[color % COLORS.length],
                    icon: item.icon,
                };
                color++;
            } else {
                sources = sources || JSON.parse(JSON.stringify(this.state.sources));
                sources[item.from].active = true;
            }
        });

        const newState = {
            logs, logSize: this.state.logSize + size, estimatedSize: true, logWarnings, logErrors,
        };
        if (sources) {
            newState.sources = sources;
        }

        if (this.state.reverse) {
            // remember if last element is visible
            const el = document.getElementById('endOfLog');
            this.scrollToEnd =  el ? el.getBoundingClientRect().top < window.innerHeight : true;
        }

        this.setState(newState);
    };

    clearLog() {
        this.props.logsWorker && this.props.logsWorker.clearLines();
        this.props.clearErrors();
        this.setState({
            logs: [], logSize: null, logErrors: 0, logWarnings: 0,
        });
    }

    handleMessageChange(event) {
        (window._localStorage || window.localStorage).setItem('Log.message', event.target.value);
        this.setState({ message: event.target.value });
    }

    handleSourceChange(event) {
        (window._localStorage || window.localStorage).setItem('Log.source', event.target.value);
        this.setState({ source: event.target.value });
    }

    handleSeverityChange(event) {
        (window._localStorage || window.localStorage).setItem('Log.severity', event.target.value);
        this.setState({ severity: event.target.value });
    }

    openLogDownload(event) {
        this.setState({ logDownloadDialog: event.currentTarget });
    }

    closeLogDownload() {
        this.setState({ logDownloadDialog: null });
    }

    openLogDelete() {
        this.setState({ logDeleteDialog: true });
    }

    closeLogDelete() {
        this.setState({ logDeleteDialog: false });
    }

    handleLogDelete() {
        this.props.socket.delLogs(this.state.currentHost)
            .then(() => this.clearLog())
            .then(() => this.readLogs(true, null, () => this.closeLogDelete()))
            .catch(error => {
                this.closeLogDelete();
                window.alert(error);
            });
    }

    handleLogPause() {
        this.setState({ pause: this.state.pause ? 0 : this.state.logs.length });
    }

    static openTab(path) {
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
                this.closeLogDownload();
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
            severities.push(<MenuItem value={i} key={i}>{i}</MenuItem>);
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
                style={{ backgroundColor: id === '1' ? undefined : this.state.sources[id].color }}
            >
                {id === '1' ?
                    null :
                    <Icon src={this.state.sources[id].icon || ''} className={this.props.classes.iconSelect} />}
                {id === '1' ?
                    this.t('Source') :
                    id}
            </MenuItem>);
    }

    getOneRow(i, rows, options) {
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
                    <Icon src={row.icon || ''} className={classes.icon} />
                    <div className={classes.name}>{row.from}</div>
                </div>
            </TableCell>
            {this.state.pid && <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}>
                {id}
            </TableCell>}
            <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}>
                {row.time}
            </TableCell>
            <TableCell className={UtilsCommon.clsx(classes.cell, classes[`${this.props.themeType}_${severity}`])}>
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
        const rows = [];
        const options = {
            filterMessage: this.state.message.toLowerCase(),
            sourceFilter: this.state.source,
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
        const { classes } = this.props;

        return <Dialog onClose={() => this.closeLogDelete()} open={this.state.logDeleteDialog}>
            <DialogTitle>
                {this.t('Please confirm')}
                <IconButton size="large" className={classes.closeButton} onClick={() => this.closeLogDelete()}>
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
                    onClick={() => this.closeLogDelete()}
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
        (window._localStorage || window.localStorage).setItem('Logs.pid', pid ? 'true' : 'false');
        this.setState({ pid });
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

        const sources = Object.keys(this.state.sources).sort();
        sources.unshift('1');

        const pauseChild = !this.state.pause ? <PauseIcon /> :
            <Typography className={classes.pauseCount}>{this.state.logs.length - this.state.pause}</Typography>;

        return <TabContainer>
            <TabHeader>
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
                    <IconButton size="large" onClick={() => this.openLogDelete()}>
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
                            (window._localStorage || window.localStorage).setItem('Logs.colors', this.state.colors ? 'false' : 'true');
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
                            (window._localStorage || window.localStorage).setItem('Log.reverse', this.state.reverse ? 'false' : 'true');
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
                {this.state.logFiles?.length > 0 &&
                    <div>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveAltIcon />}
                            onClick={event => this.openLogDownload(event)}
                        >
                            {this.t('Download log')}
                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={this.state.logDownloadDialog}
                            keepMounted
                            open={Boolean(this.state.logDownloadDialog)}
                            onClose={() => this.closeLogDownload()}
                        >
                            {this.getLogFiles()}
                        </Menu>
                    </div>}
                <div className={classes.grow} />
                <Typography
                    variant="body2"
                    title={this.state.estimatedSize ? this.props.t('Estimated size') : ''}
                    className={classes.logSize}
                >
                    {this.t('Log size:')}
                    {' '}
                    <span className={this.state.estimatedSize ? classes.logEstimated : ''}>{this.state.logSize === null ? '-' : Utils.formatBytes(this.state.logSize)}</span>
                </Typography>
            </TabHeader>
            <TabContent>
                <TableContainer className={classes.container}>
                    <Table stickyHeader size="small" className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell className={classes.source}>
                                    <FormControl variant="standard" className={classes.formControl}>
                                        <InputLabel id="source-label" />
                                        <Select
                                            variant="standard"
                                            labelId="source-label"
                                            value={sources.includes(this.state.source) ? this.state.source : '1'}
                                            onChange={event => this.handleSourceChange(event)}
                                        >
                                            {this.getSources()}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                {this.state.pid && <TableCell className={classes.pid}>
                                    <TextField disabled label={this.t('PID')} className={classes.header} variant="standard" />
                                </TableCell>}
                                <TableCell className={classes.timestamp}>
                                    <TextField disabled label={this.t('Time')} className={classes.header} variant="standard" />
                                </TableCell>
                                <TableCell className={classes.severity}>
                                    <FormControl variant="standard" className={classes.formControl}>
                                        <InputLabel id="severity-label" />
                                        <Select
                                            variant="standard"
                                            labelId="severity-label"
                                            value={this.state.severity}
                                            onChange={event => this.handleSeverityChange(event)}
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
                                            label={this.t('Message')}
                                            onChange={event => this.handleMessageChange(event)}
                                            value={this.state.message}
                                            InputProps={{
                                                endAdornment:
                                                    this.state.message ? <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            (window._localStorage || window.localStorage).removeItem('Log.message');
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
                        </TableHead>
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

Logs.propTypes = {
    socket: PropTypes.object,
    currentHost: PropTypes.string,
    clearErrors: PropTypes.func,
    logsWorker: PropTypes.object,
    themeType: PropTypes.string,
    t: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Logs));
