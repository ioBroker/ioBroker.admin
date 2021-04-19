import { Component } from 'react';
import clsx from 'clsx';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PauseIcon from '@material-ui/icons/Pause';
import RefreshIcon from '@material-ui/icons/Refresh';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import amber from '@material-ui/core/colors/amber';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import PropTypes from 'prop-types';

import Utils from '../Utils';
import LinearProgress from '@material-ui/core/LinearProgress';

import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import TabHeader from '../components/TabHeader';

const styles = theme => ({
    container: {
        height: '100%'
    },
    table: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td,th':{
            padding:'3px 4px'
        },
        '& td:nth-of-type(5)': {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        }
    },
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },
    },
    updatedRow: {
        animation: 'updated 1s',
    },
    formControl: {
        width: '100%'
    },
    error: {
        color: red[500]
    },
    warn: {
        color: amber[500]
    },
    debug: {
        color: grey[500]
    },
    source: {
        width: 230
    },
    pid: {
        width: 55
    },
    timestamp: {
        width: 175
    },
    severity: {
        width: 80
    },
    message: {
        minWidth: 300
    },
    hidden: {
        display: 'none'
    },
    grow: {
        flexGrow: 1
    },
    logSize: {
        marginRight: '1rem',
        marginLeft: '1rem'
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    header: {
        '& .MuiFormLabel-root.Mui-disabled': {
            color: theme.palette.text.primary
        },
        '& .MuiInput-underline::before': {
            content: '',
            borderBottom: 'none'
        }
    },
    pauseButton: {
        minWidth: theme.spacing(6)
    },
    pauseCount: {
        color: amber[500]
    },
    downloadLogSize: {
        color: grey[500],
        marginLeft: theme.spacing(2)
    },
    downloadEntry: {
        display: 'flex',
        justifyContent: 'space-between'
    }
});

// Number prototype is read only, properties should not be added
function padding2(num) {
    let s = num.toString();
    if (s.length < 2) {
        s = '0' + s;
    }
    return s;
}
function padding3(num) {
    let s = num.toString();
    if (s.length < 2) {
        s = '00' + s;
    } else
        if (s.length < 3) {
            s = '0' + s;
        }
    return s;
}

class Logs extends Component {

    constructor(props) {
        super(props);

        this.state = {
            source: '1',
            severity: 'debug',
            message: '',
            logDeleteDialog: false,
            logDownloadDialog: null,
            logFiles: [],
            logs: null,
            logSize: null,
            pause: 0,
            pauseCount: 0
        };

        this.severities = {
            'silly': 0,
            'debug': 1,
            'info': 2,
            'warn': 3,
            'error': 4
        };

        this.t = props.t;

        this.logHandlerBound = this.logHandler.bind(this);

        this.props.socket.getLogsFiles()
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
                                name: name
                            });
                        }
                    });

                    // then restart.log ans so on
                    list.sort();
                    list.forEach(file => {
                        const parts = file.fileName.split('/');
                        const name = parts.pop().replace(/iobroker\.?/, '').replace('.log', '');

                        if (name[0] > '9') {
                            logFiles.push({
                                path: file,
                                name: name
                            });
                        }
                    });

                    if (this.props.logsWorker) {
                        this.props.logsWorker.getLogs()
                            .then(results => {
                                const logs = [...results.logs];
                                const logSize = results.logSize;

                                logs.forEach(item => {
                                    if (!item.time) {
                                        const date = new Date(item.ts);
                                        item.time = `${date.getFullYear()}-${padding2(date.getMonth() + 1)}-${padding2(date.getDate())} ` +
                                            `${padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}.${padding3(date.getMilliseconds())}`;
                                    }
                                });

                                this.setState({ logFiles, logs, logSize });
                            });
                    } else {
                        this.setState({ logFiles });
                    }
                }
            });

        this.words = {};
    }

    componentDidMount() {
        this.props.logsWorker && this.props.logsWorker.enableCountErrors(false);
        this.props.logsWorker.registerHandler(this.logHandlerBound);
        this.props.clearErrors();
    }

    componentWillUnmount() {
        this.props.logsWorker && this.props.logsWorker.enableCountErrors(true);
        this.props.logsWorker.unregisterHandler(this.logHandlerBound);
        this.props.clearErrors();
    }

    logHandler(newLogs) {
        const oldLogs = this.state.logs || [];
        const logs = oldLogs.concat(newLogs);
        logs.forEach(item => {
            if (!item.time) {
                const date = new Date(item.ts);
                item.time = `${date.getFullYear()}-${padding2(date.getMonth() + 1)}-${padding2(date.getDate())} ` +
                    `${padding2(date.getHours())}:${padding2(date.getMinutes())}:${padding2(date.getSeconds())}.${padding3(date.getMilliseconds())}`;
            }
        });
        this.setState({ logs });
    }

    clearLog() {
        this.props.logsWorker && this.props.logsWorker.clearLines();
        this.setState({
            logs: []
        });
        this.props.clearErrors();
    }

    handleMessageChange(event) {
        this.setState({
            message: event.target.value
        });
    }

    handleSourceChange(event) {
        this.setState({
            source: event.target.value
        });
    }

    handleSeverityChange(event) {
        this.setState({
            severity: event.target.value
        });
    }

    openLogDownload(event) {
        this.setState({
            logDownloadDialog: event.currentTarget
        });
    }

    closeLogDownload() {
        this.setState({
            logDownloadDialog: null
        });
    }

    openLogDelete() {
        this.setState({
            logDeleteDialog: true
        });
    }

    closeLogDelete() {
        this.setState({
            logDeleteDialog: false
        });
    }

    handleLogDelete() {
        this.props.socket.delLogs(this.props.currentHost)
            .then(() => this.clearLog())
            .catch(error => window.alert(error));
        this.closeLogDelete();
    }

    handleLogPause() {
        this.setState({
            pause: this.state.pause ? 0 : this.state.logs.length
        });
    }

    openTab(path) {
        const tab = window.open(path, '_blank');
        tab.focus();
    }

    getLogFiles() {
        const { classes } = this.props;

        return this.state.logFiles.map(entry => {
            return (
                <MenuItem
                    className={classes.downloadEntry}
                    key={entry.name}
                    onClick={() => {
                        this.openTab(entry.path.fileName);
                        this.closeLogDownload();
                    }}
                >
                    { entry.name}
                    <Typography
                        className={classes.downloadLogSize}
                        variant="caption"
                    >
                        {Utils.formatBytes(entry.path.size) || '-'}
                    </Typography>
                </MenuItem>
            );
        });
    }

    getSeverities() {
        const severities = [];

        for (const i in this.severities) {
            severities.push(<MenuItem value={i} key={i}>{i}</MenuItem>);
        }

        return severities;
    }

    getSources() {
        const sources = ['1'];
        const ids = {};

        for (let i = 0; i < this.state.logs.length; i++) {
            const log = this.state.logs[i];

            if (!ids[log.from]) {
                ids[log.from] = true;
            }
        }

        for (const i in ids) {
            sources.push(i);
        }

        sources.sort();

        return sources.map(source =>
            <MenuItem value={source} key={source}>{source === '1' ? this.t('Source') : source}</MenuItem>);
    }

    getRows() {
        const rows = [];
        const { classes } = this.props;

        for (let i = this.state.pause > 0 ? this.state.pause - 1 : this.state.logs.length - 1; i >= 0; i--) {

            const row = this.state.logs[i];
            const severity = row.severity;

            let message = row.message;
            let id = '';

            const regExp = new RegExp(row.from.replace('.', '\\.').replace(')', '\\)').replace('(', '\\(') + ' \\(\\d+\\) ', 'g');
            const matches = message.match(regExp);

            if (matches) {
                message = message.replace(matches[0], '');
                id = matches[0].split(' ')[1].match(/\d+/g)[0];
            } else {
                message = message.replace(row.from + ' ', '');
            }

            const isFrom = this.state.source !== '1' && this.state.source !== row.from;
            const isHidden = isFrom || this.severities[severity] < this.severities[this.state.severity] ||
                !message.toLowerCase().includes(this.state.message.toLowerCase());

            rows.push(
                <TableRow
                    className={clsx(classes.row, isHidden && classes.hidden, this.lastRowRender && row.ts > this.lastRowRender && classes.updatedRow)}
                    key={row.key}
                    hover
                >
                    <TableCell>
                        {row.from}
                    </TableCell>
                    <TableCell
                        className={classes[severity]}
                    >
                        {id}
                    </TableCell>
                    <TableCell
                        className={classes[severity]}
                    >
                        {row.time}
                    </TableCell>
                    <TableCell
                        className={classes[severity]}
                    >
                        {row.severity}
                    </TableCell>
                    <TableCell
                        className={classes[severity]}
                        title={message}
                    >
                        {message}
                    </TableCell>
                </TableRow>
            );
        }

        if (!this.lastRowRender || Date.now() - this.lastRowRender > 1000) {
            if (!this.lastRowRenderTimeout) {
                this.lastRowRenderTimeout = setTimeout(() => {
                    this.lastRowRenderTimeout = null;
                    this.lastRowRender = Date.now();
                    console.log('reset ' + Date.now())
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
                <IconButton className={classes.closeButton} onClick={() => this.closeLogDelete()}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    {this.t('Log file will be deleted. Are you sure?')}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" autoFocus onClick={() => this.handleLogDelete()} color="primary">
                    {this.t('Ok')}
                </Button>
                <Button variant="contained" autoFocus onClick={() => this.closeLogDelete()} >
                    {this.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    render() {
        if (!this.state.logs) {
            return <LinearProgress />;
        }
        const { classes } = this.props;

        const pauseChild = !this.state.pause ? <PauseIcon /> :
            <Typography className={classes.pauseCount}>{this.state.logs.length - this.state.pause}</Typography>;

        return <TabContainer>
            <TabHeader>
                <IconButton
                    onClick={() => this.props.logsWorker &&
                        this.props.logsWorker.getLogs(true).then(results => {
                            const logs = results.logs;
                            const logSize = results.logSize;
                            this.setState({ logs: [...logs], logSize });
                        })}
                >
                    <RefreshIcon />
                </IconButton>
                <IconButton
                    className={classes.pauseButton}
                    onClick={() => this.handleLogPause()}
                >
                    {pauseChild}
                </IconButton>
                <IconButton
                    onClick={() => this.clearLog()}
                >
                    <DeleteIcon />
                </IconButton>
                <IconButton
                    onClick={() => this.openLogDelete()}
                >
                    <DeleteForeverIcon />
                </IconButton>
                <div className={classes.grow} />
                {this.state.logFiles.length > 0 &&
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
                    </div>
                }
                <div className={classes.grow} />
                <Typography
                    variant="body2"
                    className={classes.logSize}
                >
                    {`${this.t('Log size:')} ${this.state.logSize || '-'}`}
                </Typography>
            </TabHeader>
            <TabContent>
                <TableContainer className={classes.container}>
                    <Table stickyHeader size="small" className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell className={classes.source}>
                                    <FormControl className={classes.formControl}>
                                        <InputLabel id="source-label" />
                                        <Select
                                            labelId="source-label"
                                            value={this.state.source}
                                            onChange={event => this.handleSourceChange(event)}
                                        >
                                            {this.getSources()}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell className={classes.pid}>
                                    <TextField disabled label={this.t('PID')} className={classes.header} />
                                </TableCell>
                                <TableCell className={classes.timestamp}>
                                    <TextField disabled label={this.t('Time')} className={classes.header} />
                                </TableCell>
                                <TableCell className={classes.severity}>
                                    <FormControl className={classes.formControl}>
                                        <InputLabel id="severity-label" />
                                        <Select
                                            labelId="severity-label"
                                            value={this.state.severity}
                                            onChange={event => this.handleSeverityChange(event)}
                                        >
                                            {this.getSeverities()}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell className={classes.message}>
                                    <FormControl className={classes.formControl}>
                                        <TextField
                                            label={this.t('Message')}
                                            onChange={event => this.handleMessageChange(event)}
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
            { this.renderClearDialog()}
        </TabContainer>;
    }
}

Logs.propTypes = {
    socket: PropTypes.object,
    currentHost: PropTypes.string,
    clearErrors: PropTypes.func,
    logsWorker: PropTypes.object,
    lang: PropTypes.string,
    t: PropTypes.func,
};
export default withWidth()(withStyles(styles)(Logs));