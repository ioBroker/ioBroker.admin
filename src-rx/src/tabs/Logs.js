import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
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

const styles = theme => ({
    root: {
        height: '100%'
    },
    flexContainer: {
        height: '100%',
        flexWrap: 'nowrap'
    },
    container: {
        height: '100%'
    },
    table: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td:nth-of-type(5)': {
           overflow: 'hidden',
           whiteSpace: 'nowrap'
        }
    },
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        }
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
        width: 100
    },
    timestamp: {
        width: 220
    },
    severity: {
        width: 110
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

class Logs extends React.Component {

    constructor(props) {

        super(props);

        Number.prototype.pad = function(size) {
            let s = this + '';
            while (s.length < size) s = '0' + s;
            return s;
        };

        this.state = {
            source: '1',
            severity: 'debug',
            message: '',
            logDeleteDialog: false,
            logDownloadDialog: null,
            logFiles: [],
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

        this.props.clearErrors();
    }

    componentDidMount() {
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

                    this.setState({
                        logFiles: logFiles
                    });
                }
            });
    }

    componentDidUpdate() {
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

    clearLog() {
        this.props.clearLog();
    }

    refreshLog() {
        this.props.refreshLog();
    }

    handleLogPause() {
        this.setState({
            pause: (this.state.pause > 0) ? 0 : this.props.logs.length
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
                    className={ classes.downloadEntry }
                    key={ entry.name }
                    onClick={ () => {
                        this.openTab(entry.path.fileName);
                        this.closeLogDownload();
                    } }
                >
                    { entry.name }
                    <Typography
                        className={ classes.downloadLogSize }
                        variant="caption"
                    >
                        { Utils.formatBytes(entry.path.size) || '-' }
                    </Typography>
                </MenuItem>
            );
        });
    }

    getSeverities() {

        const severities = [];

        for (const i in this.severities) {
            severities.push(
                <MenuItem value={ i } key={ i }>{ i }</MenuItem>
            );
        }

        return severities;
    }

    getSources() {

        const sources = ['1'];
        const ids = {};

        for (const i in this.props.logs) {

            const log = this.props.logs[i];

            if (!ids[log.from]) {
                ids[log.from] = true;
            }
        }

        for (const i in ids) {
            sources.push(i);
        }

        sources.sort();

        return sources.map(source => (
            <MenuItem value={ source } key={ source }>{ source === '1' ? this.t('Source') : source }</MenuItem>
        ));
    }

    getRows() {

        const rows = [];
        const { classes } = this.props;

        for (let i = (this.state.pause > 0) ? this.state.pause - 1 : this.props.logs.length - 1; i >= 0; i--) {

            const row = this.props.logs[i];
            const severity = row.severity;

            const date = new Date(row.ts);
            const ts = `${date.getFullYear().pad(4)}-${(date.getMonth() + 1).pad(2)}-${date.getDate().pad(2)} ` +
                `${date.getHours().pad(2)}:${date.getMinutes().pad(2)}:${date.getSeconds().pad(2)}.${date.getMilliseconds().pad(3)}`;
            let message = row.message;
            let id = '';

            const regExp = new RegExp(row.from.replace('.', '\\.') + ' \\(\\d+\\) ', 'g');
            const matches = message.match(regExp);

            if (matches) {
                message = message.replace(matches[0], '');
                id = matches[0].split(' ')[1].match(/\d+/g)[0];
            } else {
                message = message.replace(row.from + ' ', '');
            }

            rows.push(
                <TableRow
                    className={ classes.row +
                        (((this.state.source !== '1' && this.state.source !== row.from) ||
                        this.severities[severity] < this.severities[this.state.severity]) ||
                        !message.toLowerCase().includes(this.state.message.toLowerCase()) ?
                        ' ' + classes.hidden : '') }
                    key={ row._id }
                    hover
                >
                    <TableCell>
                        { row.from }
                    </TableCell>
                    <TableCell
                        className={ classes[severity] }
                    >
                        { id }
                    </TableCell>
                    <TableCell
                        className={ classes[severity] }
                    >
                        { ts }
                    </TableCell>
                    <TableCell
                        className={ classes[severity] }
                    >
                        { row.severity }
                    </TableCell>
                    <TableCell
                        className={ classes[severity] }
                        title={ message }
                    >
                        { message }
                    </TableCell>
                </TableRow>
            );
        }

        return rows;
    }

    render() {

        const { classes } = this.props;

        const pauseChild = (this.state.pause === 0) ? <PauseIcon /> :
            <Typography className={ classes.pauseCount }>{ this.props.logs.length - this.state.pause }</Typography>;

        return (
            <Paper className={ classes.root }>
                <Grid
                    container
                    direction="column"
                    className={ classes.flexContainer }
                >
                    <Grid
                        item
                        container
                        alignItems="center"
                    >
                        <IconButton
                            onClick={ () => this.refreshLog() }
                        >
                            <RefreshIcon />
                        </IconButton>
                        <IconButton
                            className={ classes.pauseButton }
                            onClick={ () => this.handleLogPause() }
                        >
                            { pauseChild }
                        </IconButton>
                        <IconButton
                            onClick={ () => this.clearLog() }
                        >
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            onClick={ () => this.openLogDelete() }
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                        <div className={classes.grow} />
                        { this.state.logFiles.length > 0 &&
                            <div>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={ <SaveAltIcon />}
                                    onClick={ event => this.openLogDownload(event) }
                                >
                                    { this.t('Download log') }
                                </Button>
                                <Menu
                                    id="simple-menu"
                                    anchorEl={ this.state.logDownloadDialog }
                                    keepMounted
                                    open={ Boolean(this.state.logDownloadDialog) }
                                    onClose={ () => this.closeLogDownload() }
                                >
                                    { this.getLogFiles() }
                                </Menu>
                            </div>
                        }
                        <div className={classes.grow} />
                        <Typography
                            variant="body2"
                            className={ classes.logSize }
                        >
                            { `${this.t('Log size:')} ${this.props.size || '-'}` }
                        </Typography>
                    </Grid>
                    <TableContainer className={ classes.container }>
                        <Table stickyHeader size="small" className={ classes.table }>
                            <TableHead>
                                <TableRow>
                                    <TableCell className={ classes.source }>
                                        <FormControl className={ classes.formControl }>
                                            <InputLabel id="source-label" />
                                            <Select
                                                labelId="source-label"
                                                value={ this.state.source }
                                                onChange={ event => this.handleSourceChange(event) }
                                            >
                                                {
                                                    this.getSources()
                                                }
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell className={ classes.pid }>
                                        <TextField disabled label={ this.t('PID') } className={ classes.header } />
                                    </TableCell>
                                    <TableCell className={ classes.timestamp }>
                                        <TextField disabled label={ this.t('Time') } className={ classes.header } />
                                    </TableCell>
                                    <TableCell className={ classes.severity }>
                                        <FormControl className={classes.formControl}>
                                            <InputLabel id="severity-label" />
                                            <Select
                                                labelId="severity-label"
                                                value={ this.state.severity }
                                                onChange={ event => this.handleSeverityChange(event) }
                                            >
                                                {
                                                    this.getSeverities()
                                                }
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell className={ classes.message }>
                                        <FormControl className={ classes.formControl }>
                                            <TextField
                                                label={ this.t('Message') }
                                                onChange={ event => this.handleMessageChange(event) }
                                            />
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    this.getRows()
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Dialog onClose={ () => this.closeLogDelete() } open={ this.state.logDeleteDialog }>
                    <DialogTitle>
                        { this.t('Please confirm') }
                        <IconButton className={ classes.closeButton } onClick={ () => this.closeLogDelete() }>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography gutterBottom>
                            { this.t('Log file will be deleted. Are you sure?') }
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button autoFocus onClick={ () => this.handleLogDelete() } color="primary">
                            { this.t('Ok') }
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        );
    }
}

Logs.propTypes = {
    ready: PropTypes.bool,
    logs: PropTypes.array,
    size: PropTypes.number,
    socket: PropTypes.object,
    currentHost: PropTypes.string,
    clearLog: PropTypes.func,
    refreshLog: PropTypes.func,
    clearErrors: PropTypes.func,
    t: PropTypes.func,
};

export default withWidth()(withStyles(styles)(Logs));