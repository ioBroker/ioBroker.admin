import React from "react";
import PropTypes from "prop-types";
import withWidth from "@material-ui/core/withWidth";
import {withStyles} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import LinearProgress from "@material-ui/core/LinearProgress";
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';


import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';

import clsx from 'clsx';
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TextField from "@material-ui/core/TextField";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";

// icons
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { FaPlusSquare as InsertIcon} from 'react-icons/all';

function padding3(ms) {
    if (ms < 10) {
        return '00' + ms;
    } else if (ms < 100) {
        return '0' + ms;
    } else {
        return ms;
    }
}

function padding2(num) {
    if (num < 10) {
        return '0' + num;
    } else {
        return num;
    }
}

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    tableDiv: {
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1)) + 'px)',
        overflow: 'hidden',
        width: '100%',
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
        userSelect: 'none',
        /*'&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        },*/
        position: 'relative',
        '&:hover': {
            opacity: 0.7,
        },
        '& td': {
            position: 'relative',
        }
    },
    updatedRow: {
        animation: 'updated 1s',
    },
    rowInterpolated: {
        opacity: 0.5
    },
    selectHistoryControl: {
        width: 130,
    },
    selectRelativeTime: {
        marginLeft: 10,
        width: 200,
    },
    notAliveInstance: {
        opacity: 0.5,
    },
    rowSelected: {
        background: theme.palette.secondary.main,
    },
    rowFocused: {
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        margin: 3,
        border: '1px dotted ' + theme.palette.action.active,
    },
    grow: {
        flexGrow: 1,
    },
    editorTimePicker: {
        marginLeft: theme.spacing(1),
    }
});

class ObjectHistoryData extends React.Component {
    constructor(props) {
        super(props);
        let from = new Date();
        from.setHours(from.getHours() - 24 * 7);

        let relativeRange = window.localStorage.getItem('App.relativeRange') || '30';

        this.state = {
            loaded: false,
            min: null,
            max: null,
            start: from.getTime(),
            end: new Date().getTime(),
            values: null,
            relativeRange,
            selected: [],
            lastSelected: null,
            lastSelectedColumn: null,
            historyInstance: '',
            updateOpened: false,
            insertOpened: false,
            historyInstances: null,
            defaultHistory: '',
            lcVisible: true,
        };
        this.adminInstance = parseInt(window.location.search.slice(1), 10) || 0;

        this.readTimeout = null;
        this.edit = {};

        this.unit = this.props.obj.common && this.props.obj.common.unit ? ' ' + this.props.obj.common.unit : '';

        this.prepareData()
            .then(() => this.readHistoryRange())
            .then(() => this.setRelativeInterval(this.state.relativeRange, true));

        this.onChangeBound = this.onChange.bind(this);
    }

    componentDidMount() {
        this.props.socket.subscribeState(this.props.obj._id, this.onChangeBound);
    }

    componentWillUnmount() {
        this.readTimeout && clearTimeout(this.readTimeout);
        this.readTimeout = null;
        this.props.socket.unsubscribeState(this.props.obj._id, this.onChangeBound);
    }

    onChange(id, state) {
        if (id === this.props.obj._id &&
            state &&
            this.state.values &&
            (!this.state.values.length || this.state.values[this.state.values.length - 1].ts < state.ts)) {
            const values = [...this.state.values, state];
            this.setState({ values });
        }
    }

    prepareData() {
        let list;
        return this.getHistoryInstances()
            .then(_list => {
                list = _list;
                // read default history
                return this.props.socket.getSystemConfig();
            })
            .then(config => {
                const defaultHistory = config && config.common && config.common.defaultHistory;

                // find current history
                // first read from localstorage
                let historyInstance = window.localStorage.getItem('App.historyInstance') || '';
                if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
                    // try default history
                    historyInstance = defaultHistory;
                }
                if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
                    // find first alive history
                    historyInstance = list.find(it => it.alive) || '';
                }
                // get first entry
                if (!historyInstance && list.length) {
                    historyInstance = defaultHistory;
                }
                this.setState( {
                    historyInstances: list,
                    defaultHistory,
                    historyInstance
                });
            });
    }

    getHistoryInstances() {
        const list = [];
        const ids = [];
        this.props.customsInstances.forEach(instance => {
            const instObj = this.props.objects['system.adapter.' + instance];
            if (instObj && instObj.common && instObj.common.getHistory) {
                let listObj = {id: instance, alive: false};
                list.push(listObj);
                ids.push('system.adapter.' + instance + '.alive');
            }
        });

        if (ids.length) {
            return this.props.socket.getForeignStates(ids)
                .then(alives => {
                    Object.keys(alives).forEach(id => {
                        const item = list.find(it => id.endsWith(it.id + '.alive'));
                        if (item) {
                            item.alive = alives[id] && alives[id].val;
                        }
                    });
                    return list;
                });
        } else {
            return Promise.resolve(list);
        }
    }

    readHistory(start, end) {
        /*interface GetHistoryOptions {
            instance?: string;
            start?: number;
            end?: number;
            step?: number;
            count?: number;
            from?: boolean;
            ack?: boolean;
            q?: boolean;
            addID?: boolean;
            limit?: number;
            ignoreNull?: boolean;
            sessionId?: any;
            aggregate?: 'minmax' | 'min' | 'max' | 'average' | 'total' | 'count' | 'none';
        }*/
        start = start || this.state.start;
        end   = end   || this.state.end;

        return this.props.socket.getHistory(this.props.obj._id, {
            instance: this.defaultHistory,
            start,
            end,
            from: true,
            ack: true,
            q: true,
            addID: false,
            aggregate: 'none'
        }).then(values => {
            // merge range and chart
            let chart = [];
            let range = this.rangeValues;
            let anyLC = false;

            // get the very first item
            if (range && range.length && (!values || !values.length || range[0].ts < values[0].ts)) {
                chart.push(range[0]);
                chart.push({ts: range[0].ts + 1, e: true});
                console.log('add ' + new Date(range[0].ts).toISOString() + ': ' + range[0].val);
            }

            if (values && values.length) {
                for (let t = 0; t < values.length; t++) {
                    // if range and details are not equal
                    if (!chart.length || chart[chart.length - 1].ts < values[t].ts) {
                        chart.push(values[t]);
                        if (values[t].from && values[t].from.startsWith('system.adapter.')) {
                            values[t].from = values[t].from.substring(15);
                        }
                        if (values[t].lc) {
                            anyLC = true;
                        }
                        console.log('add value ' + new Date(values[t].ts).toISOString() + ': ' + values[t].val)
                    } else if (chart[chart.length - 1].ts === values[t].ts && chart[chart.length - 1].val !== values[t].ts) {
                        console.error('Strange data!');
                    }
                }
            } else {
                chart.push({noDataForPeriod: true});
            }

            if (!chart.length) {
                chart.push({noData: true});
            }

            this.setState( {values: chart, lcVisible: anyLC});
        });
    }

    readHistoryRange() {
        const now = new Date();
        const oldest = new Date(2000, 0, 1);

        this.props.socket.getHistory(this.props.obj._id, {
            instance: this.defaultHistory,
            start: oldest.getTime(),
            end: now.getTime(),
            step: 3600000 * 24 * 30, // monthly
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'minmax'
        })
            .then(values => {
                if (values.length) {
                    // remove interpolated first value
                    if (values[0].val === null) {
                        values.shift();
                    }
                    // mark interpolated
                    values.forEach(it => it.i = true);
                    this.rangeValues = values;
                    this.setState({min: values[0].ts, max: values[values.length - 1].ts});
                } else {
                    this.rangeValues = [];
                }
            });
    }

    onToggleSelect(e, ts, column) {
        let selected = [...this.state.selected];
        const pos = selected.indexOf(ts);
        if (e.shiftKey && this.state.lastSelected) {
            let pps = -1;
            let ppls = -1;
            selected = [];
            for (let i = 0; i < this.state.values.length; i++) {
                if (this.state.values[i].ts === ts) {
                    pps = i;
                    ppls !== pps && selected.push(this.state.values[i].ts);
                    if (pps !== -1 && ppls !== -1) {
                        break;
                    }
                }
                if (this.state.values[i].ts === this.state.lastSelected) {
                    ppls = i;
                    ppls !== pps && selected.push(this.state.values[i].ts);
                    if (pps !== -1 && ppls !== -1) {
                        break;
                    }
                }
                if (pps !== -1 || ppls !== -1) {
                    selected.push(this.state.values[i].ts);
                }
            }
        } else
        if (e.ctrlKey) {
            if (pos !== -1) {
                selected.splice(pos, 1);
            } else {
                selected.push(ts);
            }
            selected.sort();
        } else {
            selected = [ts];
        }

        this.setState({selected, lastSelected: ts, lastSelectedColumn: column});
    }

    getTableRows(classes) {
        const rows = [];
        for (let r = this.state.values.length - 1; r >= 0; r--) {
            const state = this.state.values[r];
            const ts = state.ts;
            if (state.e) {
                rows.push(<TableRow
                    className={ clsx(classes.row, classes.updatedRow, classes.rowInterpolated) }
                    key={ ts }
                    hover
                >
                    <TableCell>...</TableCell>
                    <TableCell/>
                    <TableCell/>
                    <TableCell/>
                    { this.state.lcVisible  ? <TableCell/> : null }
                </TableRow>);
            } else
            if (state.noData || state.noDataForPeriod) {
                rows.push(<TableRow
                    className={ clsx(classes.row, classes.updatedRow, classes.rowNoData) }
                    key={ state.noData ? 'nodata' : ''}
                    hover
                >
                    <TableCell>{ state.noData ? this.props.t('No data in history') : this.props.t('No data in history for selected period')}</TableCell>
                    <TableCell/>
                    <TableCell/>
                    <TableCell/>
                    { this.state.lcVisible  ? <TableCell/> : null }
                </TableRow>);
            } else {
                const interpolated = state.i;
                const selected = this.state.lastSelected === ts;
                rows.push(<TableRow
                    className={ clsx(
                        classes.row, classes.updatedRow,
                        interpolated && classes.rowInterpolated,
                        this.state.selected.includes(ts) && classes.rowSelected) }
                    key={ ts + (state.val || '') }
                >
                    <TableCell onClick={ e => !interpolated && this.onToggleSelect(e, ts, 'val') }>
                        { state.val + this.unit }
                        { selected && this.state.lastSelectedColumn === 'val' ? <div key="focused" className={ classes.rowFocused } /> : ''}
                    </TableCell>
                    <TableCell onClick={ e => !interpolated && this.onToggleSelect(e, ts, 'ack') }>
                        { state.ack ? 'true' : 'false' }
                        { selected && this.state.lastSelectedColumn === 'ack' ? <div key="focused" className={ classes.rowFocused } /> : ''}
                    </TableCell>
                    <TableCell onClick={ e => !interpolated && this.onToggleSelect(e, ts, 'from') }>
                        { state.from || '' }
                        { selected && this.state.lastSelectedColumn === 'from' ? <div key="focused" className={ classes.rowFocused } /> : ''}
                    </TableCell>
                    <TableCell onClick={ e => !interpolated && this.onToggleSelect(e, ts, 'ts') }>
                        { new Date(state.ts).toLocaleDateString() + ' ' + new Date(state.ts).toLocaleTimeString() + '.' + padding3(state.ts % 1000) }
                        { selected && this.state.lastSelectedColumn === 'ts' ? <div key="focused" className={ classes.rowFocused } /> : ''}
                    </TableCell>
                    { this.state.lcVisible ? <TableCell onClick={ e => !interpolated && this.onToggleSelect(e, ts, 'lc') }>
                        { state.lc ? new Date(state.lc).toLocaleDateString() + ' ' + new Date(state.lc).toLocaleTimeString() + '.' + padding3(state.ts % 1000) : '' }
                        { selected && this.state.lastSelectedColumn === 'lc' ? <div key="focused" className={ classes.rowFocused } /> : ''}
                    </TableCell> : null }
                </TableRow>);
            }
        }

        return rows;
    }

    setRelativeInterval(mins, dontSave) {
        if (!dontSave) {
            window.localStorage.setItem('App.relativeRange', mins);
            this.setState({ relativeRange: mins });
        }

        const now = new Date();
        if (now.getMilliseconds()) {
            now.setMilliseconds(1000);
        }
        if (now.getSeconds()) {
            now.setSeconds(60);
        }

        const end = now.getTime();
        let start;

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            start = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            start = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            now.setMonth(0);
            start = now.getTime();
        }  else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setFullYear(now.getFullYear() - 1);
            start = now.getTime();
        } else {
            mins = parseInt(mins, 10);
            start = end - mins * 60000;
        }

        this.setState({ start, end }, () =>
            this.readHistory());
    }

    renderTable() {
        if (this.state.values) {
            const { classes } = this.props;

            return <TableContainer className={ classes.container }>
                <Table stickyHeader size="small" className={ classes.table }>
                    <TableHead>
                        <TableRow>
                            <TableCell className={ classes.colValue }>
                                { this.props.t('Value') }
                            </TableCell>
                            <TableCell className={ classes.colAck }>
                                { this.props.t('Ack') }
                            </TableCell>
                            <TableCell className={ classes.colFrom }>
                                { this.props.t('From') }
                            </TableCell>
                            <TableCell className={ classes.colTs }>
                                { this.props.t('Timestamp') }
                            </TableCell>
                            {this.state.lcVisible ? <TableCell className={ classes.colLastChange }>
                                { this.props.t('Last change') }
                            </TableCell> : null}
                        </TableRow>
                    </TableHead>
                    <TableBody>{ this.getTableRows(classes) }</TableBody>
                </Table>
            </TableContainer>;
        } else {
            return <LinearProgress/>;
        }
    }

    renderConfirmDialog() {
        return <Dialog
            open={ this.state.areYouSure }
            onClose={ () => this.setState({ areYouSure: false }) }
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{ this.props.t('') }</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    { this.props.t('Are you sure?') }
                </DialogContentText>
                <FormControlLabel
                    control={<Checkbox value={ this.state.suppressMessage } onChange={() => this.setState({ suppressMessage: true }) }/>}
                    label={ this.props.t('Suppress for 5 minutes') }
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={ () => this.setState({ areYouSure: false }) } color="secondary">{ this.props.t('Cancel') }
                </Button>
                <Button onClick={ () =>
                    this.setState({ areYouSure: false, suppressMessage: this.state.suppressMessage && Date.now() }, () => this.onDelete())
                } color="primary" autoFocus>{ this.props.t('Delete') }</Button>
            </DialogActions>
        </Dialog>;
    }

    onDelete() {
        const tasks = this.state.selected.map(ts => ({ts, id: this.props.obj._id}));
        this.props.socket.sendTo(this.state.historyInstance, 'delete', tasks, result =>
            this.readHistory());
    }

    onUpdate() {
        const state = {
            val:  this.edit.val,
            ack:  this.edit.ack,
            ts:   this.state.selected[0],
            from: 'system.adapter.admin.' + this.adminInstance,
            q:    this.edit.q,
        };
        Object.keys(state).forEach(attr => {
            if (state[attr] === undefined) {
                delete state[attr];
            }
        });
        if (!this.state.lcVisible && state.lc) {
            delete state.lc;
        }
        this.props.socket.sendTo(this.state.historyInstance, 'update', [{id: this.props.obj._id, state}], result =>
            this.readHistory());
    }

    onInsert() {
        const state = {
            ts:   this.edit.ts,
            val:  this.edit.val,
            ack:  this.edit.ack,
            from: 'system.adapter.admin.' + this.adminInstance,
            q:    this.edit.q || 0,
        };
        
        if (!this.state.lcVisible && state.lc) {
            delete state.lc;
        }
        
        Object.keys(state).forEach(attr => {
            if (state[attr] === undefined) {
                delete state[attr];
            }
        });
        this.props.socket.sendTo(this.state.historyInstance, 'insert', [{id: this.props.obj._id, state}], result =>
            this.readHistory());
    }

    formatTime(ms) {
        const time = new Date(ms);
        return padding2(time.getHours()) + ':' + padding2(time.getMinutes()) + ':' + padding2(time.getSeconds()) + '.' + padding3(time.getMilliseconds());
    }
    formatDate(ms) {
        const time = new Date(ms);
        return padding2(time.getDate()) + '.' + padding2(time.getMonth() + 1) + '.' + time.getFullYear();
    }
    renderEditDialog() {
        return <Dialog
            open={ this.state.updateOpened || this.state.insertOpened }
            onClose={ () => this.setState({ updateOpened: false, insertOpened: false }) }
            aria-labelledby="edit-dialog-title"
            aria-describedby="edit-dialog-description"
        >
            <DialogTitle id="edit-dialog-title">{ this.props.t('') }</DialogTitle>
            <DialogContent>
                <form className={ this.props.classes.dialogForm } noValidate autoComplete="off">
                    <TextField
                        label={ this.props.t('Value') }
                        defaultValue={ this.edit.val }
                        onChange={e => {
                            this.edit.val = e.target.value;
                       } }
                    />
                    <br/>
                    <FormControlLabel
                        control={<Checkbox
                            defaultChecked={ this.edit.ack }
                            onChange={e => {
                                this.edit.ack = e.target.checked;
                            } }/>}
                        label={ this.props.t('ack') }
                    />

                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container justify="space-around">
                            {/*<KeyboardDatePicker
                                margin="normal"
                                id="date-picker-dialog"
                                label="Date picker dialog"
                                format="fullDate"
                                value={ time }
                                onChange={date => {
                                    const edit = JSON.parse(JSON.stringify(this.state.edit));
                                    edit.ts = date.getTime();
                                    this.setState({ edit });
                                } }
                                KeyboardButtonProps={{ 'aria-label': 'change date', }}
                            />*/}
                            <TextField
                                label={ this.props.t('Date')}
                                defaultValue={ this.edit.date }
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={e => {
                                    this.edit.date = e.target.value;
                                } }
                            />
                            {/*<KeyboardTimePicker
                                margin="normal"
                                id="time-picker"
                                label="Time picker"
                                format="mm:HH:ss"
                                className={ this.props.classes.editorTimePicker}
                                value={ new Date(this.state.edit.ts) }
                                onChange={date => {
                                    const edit = JSON.parse(JSON.stringify(this.state.edit));
                                    edit.ts = date.getTime();
                                    this.setState({ edit });
                                } }
                                KeyboardButtonProps={{ 'aria-label': 'change time', }}
                            />*/}
                            <TextField
                                className={ this.props.classes.editorTimePicker}
                                label={ this.props.t('Value') }
                                defaultValue={ this.edit.time }
                                onChange={e => {
                                    this.edit.time = e.target.value;
                                } }
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={ () => this.setState({ updateOpened: false, insertOpened: false }) } color="secondary">{ this.props.t('Cancel') }
                </Button>
                <Button onClick={ () => {
                    const isUpdate = this.state.updateOpened;
                    this.setState({ updateOpened: false, insertOpened: false }, () =>
                        isUpdate ? this.onUpdate() : this.onInsert());
                }} 
                color="primary" autoFocus>{ this.state.insertOpened ? this.props.t('Update') : this.props.t('Add') }</Button>
            </DialogActions>
        </Dialog>
    }

    renderToolbar() {
        return <Toolbar>
            <FormControl className={ this.props.classes.selectHistoryControl }>
                <InputLabel>{ this.props.t('History instance') }</InputLabel>
                <Select
                    value={ this.state.historyInstance}
                    onChange={ e => this.setState({ historyInstance: e.target.value })}
                >
                    { this.state.historyInstances.map(it => <MenuItem key={ it.id } value={ it.id } className={ clsx(!it.alive && this.props.classes.notAliveInstance )}>{ it.id }</MenuItem>) }
                </Select>
            </FormControl>
            <FormControl className={ this.props.classes.selectRelativeTime }>
                <InputLabel>{ this.props.t('Relative') }</InputLabel>
                <Select
                    ref={ this.rangeRef }
                    value={ this.state.relativeRange }
                    onChange={ e => this.setRelativeInterval(e.target.value) }
                >
                    <MenuItem key={ 'custom' } value={ 'absolute' } className={ this.props.classes.notAliveInstance }>{ this.props.t('custom range') }</MenuItem>
                    <MenuItem key={ '1' } value={ 10 }            >{ this.props.t('last 10 minutes') }</MenuItem>
                    <MenuItem key={ '2' } value={ 30 }            >{ this.props.t('last 30 minutes') }</MenuItem>
                    <MenuItem key={ '3' } value={ 60 }            >{ this.props.t('last hour') }</MenuItem>
                    <MenuItem key={ '4' } value={ 'day' }         >{ this.props.t('this day') }</MenuItem>
                    <MenuItem key={ '5' } value={ 24 * 60 }       >{ this.props.t('last 24 hours') }</MenuItem>
                    <MenuItem key={ '6' } value={ 'month' }       >{ this.props.t('this month') }</MenuItem>
                    <MenuItem key={ '7' } value={ 30 * 24 * 60 }  >{ this.props.t('last 30 days') }</MenuItem>
                    <MenuItem key={ '8' } value={ 'year' }        >{ this.props.t('this year') }</MenuItem>
                    <MenuItem key={ '9' } value={ '12months' }    >{ this.props.t('last 12 months') }</MenuItem>
                </Select>
            </FormControl>

            <div className={this.props.classes.grow} />

            { false && this.props.expertMode ? <IconButton onClick={ () => {
                const time = new Date();
                const date = time.getFullYear() + '.' + padding2(time.getMonth() + 1) + '.' + padding2(time.getDate());
                const tm = padding2(time.getHours()) + ':' + padding2(time.getMinutes()) + ':' + padding2(time.getSeconds()) + '.' + padding3(time.getMilliseconds());

                this.edit = {
                    ack: this.state.values[this.state.values.length - 1].ack,
                    value: this.state.values[this.state.values.length - 1].val,
                    ts: Date.now(),
                    date,
                    time: tm,
                    q: 0
                };

                this.setState( {
                    insertOpened: true })
            }}>
                <InsertIcon />
            </IconButton> : null }
            { this.props.expertMode ? <IconButton disabled={ this.state.selected.length !== 1 }
                onClick={ () => {
                    const state = JSON.parse(JSON.stringify(this.state.values.find(it => it.ts === this.state.lastSelected)));
                    const time = new Date(state.ts);
                    state.date = time.getFullYear() + '.' + padding2(time.getMonth() + 1) + '.' + padding2(time.getDate());
                    state.time = padding2(time.getHours()) + ':' + padding2(time.getMinutes()) + ':' + padding2(time.getSeconds()) + '.' + padding3(time.getMilliseconds());
                    this.edit = state;

                    this.setState( {
                        insertOpened: true });
                }}>
                <EditIcon />
            </IconButton> : null }
            { this.props.expertMode ? <IconButton disabled={ !this.state.selected.length } onClick={() => {
                if (this.state.suppressMessage && Date.now() - this.state.suppressMessage < 300000) {
                    this.onDelete();
                } else {
                    this.setState({ areYouSure: true });
                }
            }} >
                <DeleteIcon />
            </IconButton> : null }

        </Toolbar>;
    }

    render() {
        if (!this.state.historyInstances) {
            return <LinearProgress/>;
        }

        return <Paper className={ this.props.classes.paper }>
            { this.renderToolbar() }
            <div className={ this.props.classes.tableDiv }>
                { this.renderTable() }
            </div>
            { this.renderConfirmDialog() }
            { this.renderEditDialog() }
        </Paper>;
    }
}

ObjectHistoryData.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
    obj: PropTypes.object,
    customsInstances: PropTypes.array,
    themeName: PropTypes.string,
    objects: PropTypes.object,
};

export default withWidth()(withStyles(styles)(ObjectHistoryData));