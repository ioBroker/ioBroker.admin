import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import DeleteIcon from '@material-ui/icons/Delete';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PauseIcon from '@material-ui/icons/Pause';
import RefreshIcon from '@material-ui/icons/Refresh';

import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

const styles = theme => ({
    root: {
        height: '100%'
    },
    container: {
        height: '100%'
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
        width: 300
    },
    id: {
        width: 100
    },
    timestamp: {
        width: 220
    },
    severity: {
        width: 110
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
            message: ''
        };

        this.severities = {
            'silly': 0,
            'debug': 1,
            'info': 2,
            'warn': 3,
            'error': 4
        };
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

    getSeverities() {

        const severities = [];

        for(const i in this.severities) {
            severities.push(
                <MenuItem value={ i } key={ i }>{ i }</MenuItem>
            );
        }

        return severities;
    }

    getSources() {

        const sources = ['1'];
        const ids = {};

        for(const i in this.props.logs) {

            const log = this.props.logs[i];

            if(!ids[log.from]) {
                ids[log.from] = true;
            }
        }

        for(const i in ids) {
            sources.push(i);
        }

        sources.sort();

        return sources.map((source) => {
            return(
                <MenuItem value={ source } key={ source }>{ (source === '1') ? 'Source' : source }</MenuItem>
            );
        });
    }

    getRows() {

        const rows = [];
        const { classes } = this.props;

        for(let i = this.props.logs.length - 1; i >= 0; i--) {

            const row = this.props.logs[i];
            const severity = row.severity;

            if(this.state.source === '1' || this.state.source === row.from) {
                if(this.severities[severity] >= this.severities[this.state.severity]) {
                    
                    const date = new Date(row.ts);
                    const ts = `${date.getFullYear().pad(4)}-${(date.getMonth() + 1).pad(2)}-${date.getDate().pad(2)} ` +
                        `${date.getHours().pad(2)}:${date.getMinutes().pad(2)}:${date.getSeconds().pad(2)}.${date.getMilliseconds().pad(3)}`;
                    let message = row.message;
                    let id = '';

                    const regExp = new RegExp(row.from.replace('.', '\\.') + ' \\(\\d+\\) ', 'g');
                    const matches = message.match(regExp);

                    if(matches) {
                        message = message.replace(matches[0], '');
                        id = matches[0].split(' ')[1].match(/\d+/g)[0];
                    } else {
                        message = message.replace(row.from + ' ', '');
                    }

                    if(message.includes(this.state.message)) {
                        rows.push(
                            <TableRow
                                className={ classes.row }
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
                                >
                                    { message }
                                </TableCell>
                            </TableRow>
                        );
                    }
                }
            }
        }

        return rows;
    }

    render() {

        const { classes } = this.props;

        return (
            <Paper className={ classes.root }>
                <IconButton>
                    <RefreshIcon />
                </IconButton>
                <IconButton>
                    <PauseIcon />
                </IconButton>
                <IconButton>
                    <DeleteIcon />
                </IconButton>
                <IconButton>
                    <DeleteForeverIcon />
                </IconButton>
                <TableContainer className={ classes.container }>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell className={ classes.source }>
                                    <FormControl className={ classes.formControl }>
                                        <InputLabel id="source-label"></InputLabel>
                                        <Select
                                            labelId="source-label"
                                            value={ this.state.source }
                                            onChange={ (event) => this.handleSourceChange(event) }
                                        >
                                            {
                                                this.getSources()
                                            }
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell className={ classes.id }>ID</TableCell>
                                <TableCell className={ classes.timestamp }>Zeit</TableCell>
                                <TableCell className={ classes.severity }>
                                    <FormControl className={classes.formControl}>
                                        <InputLabel id="severity-label"></InputLabel>
                                        <Select
                                            labelId="severity-label"
                                            value={ this.state.severity }
                                            onChange={ (event) => this.handleSeverityChange(event) }
                                        >
                                            {
                                                this.getSeverities()
                                            }
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell>
                                    <FormControl className={ classes.formControl }>
                                        <TextField
                                            label="Meldung"
                                            onChange={ (event) => this.handleMessageChange(event) }
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
            </Paper>
        );
    }
}

export default withWidth()(withStyles(styles)(Logs));