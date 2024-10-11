import React, { Component, type JSX } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, TimePicker, DatePicker } from '@mui/x-date-pickers';

import {
    Paper,
    LinearProgress,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    Toolbar,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    FormControlLabel,
    Checkbox,
    TableHead,
    TableRow,
    TableCell,
    TextField,
    TableBody,
    TableContainer,
    Box,
} from '@mui/material';

// icons
import { FaPlusSquare as InsertIcon, FaDownload as ExportIcon } from 'react-icons/fa';
import { Edit as IconEdit, Delete as IconDelete, Close as IconClose } from '@mui/icons-material';

import {
    Utils,
    withWidth,
    TableResize,
    type AdminConnection,
    type IobTheme,
    type Translate,
} from '@iobroker/adapter-react-v5';

import { localeMap } from './utils';

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    tableDiv: (theme: IobTheme) => ({
        height: `calc(100% - ${parseInt(theme.mixins.toolbar.minHeight as string, 10) + 8}px)`,
        overflow: 'hidden',
        width: '100%',
    }),
    container: {
        height: '100%',
    },
    table: (theme: IobTheme) => ({
        // tableLayout: 'fixed',
        minWidth: 960,
        width: '100%',
        '& td:nth-of-type(5)': {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
        },
        '& tr:nth-child(even)': {
            backgroundColor: theme.palette.mode === 'dark' ? '#383838' : '#b2b2b2',
        },
    }),
    row: {
        userSelect: 'none',
        /* '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.background.default,
        }, */
        position: 'relative',
        '&:hover': {
            opacity: 0.7,
        },
        '& td': {
            position: 'relative',
        },
    },
    updatedRow: {
        animation: 'updated 1s',
    },
    rowInterpolated: {
        opacity: 0.5,
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
    customRange: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    rowSelected: (theme: IobTheme) => ({
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        '& td': {
            color: theme.palette.secondary.contrastText,
            backgroundColor: theme.palette.secondary.main,
        },
    }),
    rowFocused: (theme: IobTheme) => ({
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        m: '3px',
        border: `1px dotted ${theme.palette.action.active}`,
    }),
    grow: {
        flexGrow: 1,
    },
    msInput: {
        width: 50,
        pt: '10px',
        ml: '5px',
        '& label': {
            mt: '15px',
        },
    },
    cellAckTrue: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#66ff7f' : '#04a821',
    }),
    cellAckFalse: {
        color: '#FF6666',
    },
    toolbarDate: {
        width: 124,
        mt: '9px',
        '& fieldset': {
            display: 'none',
        },
        '& input': {
            padding: '8px 0 0 0',
        },
        '& .MuiInputAdornment-root': {
            ml: 0,
            mt: '7px',
        },
    },
    toolbarTime: {
        width: 84,
        mt: '9px',
        // marginLeft: 8,
        '& fieldset': {
            display: 'none',
        },
        '& input': {
            padding: '8px 0 0 0',
        },
        '& .MuiInputAdornment-root': {
            ml: 0,
            mt: '7px',
        },
    },
    toolbarTimeGrid: {
        position: 'relative',
        marginLeft: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 4,
        border: '1px dotted #AAAAAA',
        borderRadius: 8,
        display: 'flex',
    },
    toolbarTimeLabel: {
        position: 'absolute',
        padding: 8,
        fontSize: '0.8rem',
        left: 2,
        top: -9,
    },
    noLoadingProgress: {
        width: '100%',
        height: 4,
    },

    colValue: {},
    colAck: {
        // width: 50,
    },
    colFrom: {
        // width: 150,
    },
    colLastChange: {
        // width: 200,
    },
    colTs: {
        // width: 200,
    },
};

type SupportedFeatures = ('insert' | 'update' | 'delete')[];

interface ObjectHistoryDataProps {
    t: Translate;
    lang: ioBroker.Languages;
    expertMode: boolean;
    socket: AdminConnection;
    obj: ioBroker.StateObject;
    customsInstances: string[];
    objects: Record<string, ioBroker.Object>;
    isFloatComma: boolean;
}

interface HistoryItem {
    ts: number;
    e?: boolean;
    ack?: boolean;
    val?: string | number | boolean | null;
    noData?: boolean;
    noDataForPeriod?: boolean;
    i?: boolean;
    from?: string;
    lc?: number;
}

interface ObjectHistoryDataEdit {
    val?: number | string | boolean;
    ack?: boolean;
    q?: ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY];
    date?: Date;
    time?: Date;
    ms?: number;
}

interface ObjectHistoryDataState {
    areYouSure?: boolean;
    historyInstance: string;
    relativeRange: string | number;
    start: number;
    end: number;
    values: HistoryItem[] | null;
    selected: number[];
    lastSelected: number | null;
    lastSelectedColumn: string | null;
    updateOpened: boolean;
    insertOpened: boolean;
    historyInstances: null | { id: string; alive: boolean }[];
    ampm: boolean;
    lcVisible: boolean;
    ackVisible: boolean;
    fromVisible: boolean;
    /** 'insert', 'update', 'delete' */
    supportedFeatures: SupportedFeatures;
    edit: ObjectHistoryDataEdit;
    loading?: boolean;
    suppressMessage?: number | boolean;
}

class ObjectHistoryData extends Component<ObjectHistoryDataProps, ObjectHistoryDataState> {
    private readonly adminInstance: number;

    private readonly supportedFeaturesPromises: Record<string, Promise<SupportedFeatures>>;

    private readonly unit: string;

    private timeTimer?: ReturnType<typeof setTimeout>;

    private readSupportedFeaturesTimeout?: ReturnType<typeof setTimeout>;

    private rangeValues: any;

    private rangeRef?: React.RefObject<any>;

    private subscribes: string[];

    private readonly localStorage: Storage;

    constructor(props: ObjectHistoryDataProps) {
        super(props);

        this.localStorage = (window as any)._localStorage || window.localStorage;

        let relativeRange = this.localStorage.getItem('App.relativeRange') || 'absolute';
        const start = parseInt(this.localStorage.getItem('App.absoluteStart'), 10) || 0;
        const end = parseInt(this.localStorage.getItem('App.absoluteEnd'), 10) || 0;
        const selectedStr = this.localStorage.getItem('App.historySelected') || '';
        const lastSelected = parseInt(this.localStorage.getItem('App.historyLastSelected'), 10) || null;
        const lastSelectedColumn = this.localStorage.getItem('App.historyLastSelectedColumn') || null;

        if ((!start || !end) && (!relativeRange || relativeRange === 'absolute')) {
            relativeRange = '30';
        }

        if (start && end) {
            relativeRange = 'absolute';
        }

        let selected: number[];
        try {
            selected = JSON.parse(selectedStr);
        } catch {
            selected = [];
        }

        this.state = {
            start,
            end,
            values: null,
            relativeRange,
            selected,
            lastSelected,
            lastSelectedColumn,
            historyInstance: '',
            updateOpened: false,
            insertOpened: false,
            historyInstances: null,
            // defaultHistory: '',
            lcVisible: true,
            // qVisible: true,
            ackVisible: true,
            fromVisible: true,
            supportedFeatures: [],
            ampm: false,
            edit: {},
        };
        this.adminInstance = parseInt(window.location.search.slice(1), 10) || 0;

        this.supportedFeaturesPromises = {};

        this.unit = this.props.obj.common && this.props.obj.common.unit ? ` ${this.props.obj.common.unit}` : '';

        this.timeTimer = undefined;
        this.subscribes = [];

        void this.prepareData()
            .then(() => this.readHistoryRange())
            .then(() => {
                if (relativeRange !== 'absolute') {
                    this.setRelativeInterval(this.state.relativeRange, true);
                } else {
                    void this.readHistory();
                }
            });
    }

    readSupportedFeatures(historyInstance: string): Promise<SupportedFeatures> {
        historyInstance = historyInstance || this.state.historyInstance;
        if (!historyInstance) {
            return Promise.resolve([] as SupportedFeatures);
        }
        if (this.supportedFeaturesPromises[historyInstance] instanceof Promise) {
            return this.supportedFeaturesPromises[historyInstance];
        }

        this.supportedFeaturesPromises[historyInstance] = new Promise(resolve => {
            if (this.readSupportedFeaturesTimeout) {
                clearTimeout(this.readSupportedFeaturesTimeout);
            }
            this.readSupportedFeaturesTimeout = setTimeout(() => {
                this.readSupportedFeaturesTimeout = undefined;
                resolve([]);
            }, 2_000);

            void this.props.socket
                .sendTo(historyInstance, 'features', null)
                .then((result: { supportedFeatures: SupportedFeatures }) => {
                    if (this.readSupportedFeaturesTimeout) {
                        clearTimeout(this.readSupportedFeaturesTimeout);
                        this.readSupportedFeaturesTimeout = undefined;
                        resolve(result ? result.supportedFeatures || [] : []);
                    } else {
                        this.setState({ supportedFeatures: result ? result.supportedFeatures || [] : [] });
                    }
                });
        });
        return this.supportedFeaturesPromises[historyInstance];
    }

    async componentDidMount(): Promise<void> {
        await this.props.socket.subscribeState(this.props.obj._id, this.onChange);
    }

    componentWillUnmount(): void {
        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = undefined;
        }

        for (let i = 0; i < this.subscribes.length; i++) {
            this.props.socket.unsubscribeState(this.subscribes[i], this.onChange);
        }
        this.subscribes = [];

        this.props.socket.unsubscribeState(this.props.obj._id, this.onChange);
    }

    onChange = (id: string, state: ioBroker.State): void => {
        if (
            id === this.props.obj._id &&
            state &&
            this.state.values &&
            (!this.state.values.length || this.state.values[this.state.values.length - 1].ts < state.ts)
        ) {
            const values = [...this.state.values, state];
            this.setState({ values });
        } else if (id.startsWith('system.adapter.') && id.endsWith('.alive')) {
            const instance = id.substring('system.adapter.'.length, id.length - '.alive'.length);
            const list = this.state.historyInstances;
            const itemIndex = list.findIndex(it => it.id === instance);
            if (itemIndex !== -1) {
                if (list[itemIndex].alive !== !!state?.val) {
                    const historyInstances = JSON.parse(JSON.stringify(list));
                    historyInstances[itemIndex].alive = !!state?.val;
                    this.setState({ historyInstances }, () => {
                        // read data if the instance becomes alive
                        if (historyInstances[itemIndex].alive && this.state.historyInstance === instance) {
                            void this.readHistoryRange().then(() => this.readHistory());
                        }
                    });
                }
            }
        }
    };

    async prepareData(): Promise<void> {
        const list: { id: string; alive: boolean }[] = await this.getHistoryInstances();
        // read default history
        const config: ioBroker.SystemConfigObject = await this.props.socket.getCompactSystemConfig();
        const defaultHistory = config?.common?.defaultHistory;

        // find current history
        // first read from localstorage
        let historyInstance = this.localStorage.getItem('App.historyInstance') || '';
        if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
            // try default history
            historyInstance = defaultHistory;
        }
        if (!historyInstance || !list.find(it => it.id === historyInstance && it.alive)) {
            // find first the alive history
            const historyInstanceItem = list.find(it => it.alive);
            if (historyInstanceItem) {
                historyInstance = historyInstanceItem.id;
            }
        }
        // get first entry
        if (!historyInstance && list.length) {
            historyInstance = defaultHistory;
        }
        const supportedFeatures: SupportedFeatures = await this.readSupportedFeatures(historyInstance);
        await new Promise<void>(resolve => {
            // supportedFeatures = ['insert', 'update', 'delete'];

            this.setState(
                {
                    ampm: (config.common.dateFormat || '').includes('/'),
                    historyInstances: list,
                    // defaultHistory,
                    historyInstance,
                    supportedFeatures,
                },
                () => resolve(),
            );
        });
    }

    getHistoryInstances(): Promise<{ id: string; alive: boolean }[]> {
        const list: { id: string; alive: boolean }[] = [];
        const ids: string[] = [];
        this.props.customsInstances.forEach(instance => {
            const instObj = this.props.objects[`system.adapter.${instance}`];
            if (instObj && instObj.common && instObj.common.getHistory) {
                const listObj = { id: instance, alive: false };
                list.push(listObj);
                ids.push(`system.adapter.${instance}.alive`);
            }
        });

        if (ids.length) {
            return this.props.socket.getForeignStates(ids).then(async (alives: Record<string, ioBroker.State>) => {
                Object.keys(alives).forEach(id => {
                    const item = list.find(it => id.endsWith(`${it.id}.alive`));
                    if (item) {
                        item.alive = !!alives[id]?.val;
                    }
                });
                this.subscribes = ids;
                for (let i = 0; i < ids.length; i++) {
                    await this.props.socket.subscribeState(ids[i], this.onChange);
                }

                return list;
            });
        }
        return Promise.resolve(list);
    }

    readHistory(start?: number, end?: number): Promise<void | null> {
        start = start || this.state.start;
        end = end || this.state.end;

        if (
            !this.state.historyInstance ||
            !this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)
        ) {
            return null;
        }

        this.setState({ loading: true });

        return this.props.socket
            .getHistory(this.props.obj._id, {
                instance: this.state.historyInstance,
                start,
                end,
                from: true,
                ack: true,
                q: true,
                addID: false,
                aggregate: 'none',
                returnNewestEntries: true,
            })
            .then((values: ioBroker.GetHistoryResult) => {
                // merge range and chart
                const chart = [];
                const range = this.rangeValues;
                let lcVisible = false;
                // let qVisible    = false;
                let ackVisible = false;
                let fromVisible = false;
                // let cVisible    = false;

                // get the very first item
                if (range && range.length && (!values || !values.length || range[0].ts < values[0].ts)) {
                    chart.push(range[0]);
                    chart.push({ ts: range[0].ts + 1, e: true });
                    console.log(`add ${new Date(range[0].ts).toISOString()}: ${range[0].val}`);
                    // if (!qVisible && range[0].q !== undefined) {
                    //     qVisible = true;
                    // }
                    if (!ackVisible && range[0].ack !== undefined) {
                        ackVisible = true;
                    }
                    if (!fromVisible && range[0].from) {
                        fromVisible = true;
                    }
                    // if (!cVisible && range[0].c) {
                    //     cVisible = true;
                    // }
                }

                if (values?.length) {
                    for (let t = 0; t < values.length; t++) {
                        // if range and details are not equal
                        if (values[t] && (!chart.length || chart[chart.length - 1].ts < values[t].ts)) {
                            chart.push(values[t]);
                            if (values[t].from) {
                                if (values[t].from.startsWith('system.adapter.')) {
                                    values[t].from = values[t].from.substring(15);
                                } else if (values[t].from.startsWith('system.host.')) {
                                    values[t].from = values[t].from.substring(7);
                                }
                            }
                            if (!lcVisible && values[t].lc) {
                                lcVisible = true;
                            }
                            // if (!qVisible && values[t].q !== undefined) {
                            //     qVisible = true;
                            // }
                            if (!ackVisible && values[t].ack !== undefined) {
                                ackVisible = true;
                            }
                            if (!fromVisible && values[t].from) {
                                fromVisible = true;
                            }
                            // if (!cVisible && values[t].c) {
                            //     cVisible = true;
                            // }
                            console.log(`add value ${new Date(values[t].ts).toISOString()}: ${values[t].val}`);
                        } else if (
                            chart[chart.length - 1].ts === values[t].ts &&
                            chart[chart.length - 1].val !== values[t].ts
                        ) {
                            console.error('Strange data!');
                        }
                    }
                } else {
                    chart.push({ noDataForPeriod: true });
                }

                if (!chart.length) {
                    chart.push({ noData: true });
                }

                this.setState({
                    loading: false,
                    values: chart,
                    lcVisible,
                    fromVisible,
                    // qVisible,
                    ackVisible,
                    // cVisible,
                });
            });
    }

    readHistoryRange(): Promise<void> {
        const now = new Date();
        const oldest = new Date(2_000, 0, 1);

        if (
            !this.state.historyInstance ||
            !this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)
        ) {
            return Promise.resolve();
        }

        this.setState({ loading: true });
        // this is a code that makes problems. It is no good idea doing this!
        return this.props.socket
            .getHistory(this.props.obj._id, {
                instance: this.state.historyInstance,
                start: oldest.getTime(),
                end: now.getTime(),
                // step:      3600000 * 24 * 30, // monthly
                limit: 1, // is that a way to make it faster?
                from: false,
                ack: false,
                q: false,
                addID: false,
                aggregate: 'none',
            })
            .then((values: ioBroker.GetHistoryResult) => {
                if (values.length) {
                    // remove interpolated first value
                    if (values[0].val === null || values[0].ts === oldest.getTime()) {
                        values.shift();
                    }
                    // @ts-expect-error mark interpolated
                    values.forEach(it => (it.i = true));
                    this.rangeValues = values;
                    this.setState({
                        loading: false,
                    });
                } else {
                    this.rangeValues = [];
                    this.setState({ loading: false });
                }
            });
    }

    onToggleSelect(e: React.KeyboardEvent | React.MouseEvent, ts: number, column: string): void {
        let selected = [...this.state.selected];
        const pos = selected.indexOf(ts);
        if (e.shiftKey && this.state.lastSelected) {
            let pps = -1;
            let ppls = -1;
            selected = [];
            for (let i = 0; i < this.state.values.length; i++) {
                if (this.state.values[i].ts === ts) {
                    pps = i;
                    if (ppls !== pps) {
                        selected.push(this.state.values[i].ts);
                    }
                    if (pps !== -1 && ppls !== -1) {
                        break;
                    }
                }
                if (this.state.values[i].ts === this.state.lastSelected) {
                    ppls = i;
                    if (ppls !== pps) {
                        selected.push(this.state.values[i].ts);
                    }
                    if (pps !== -1 && ppls !== -1) {
                        break;
                    }
                }
                if (pps !== -1 || ppls !== -1) {
                    selected.push(this.state.values[i].ts);
                }
            }
        } else if (e.ctrlKey) {
            if (pos !== -1) {
                selected.splice(pos, 1);
            } else {
                selected.push(ts);
            }
            selected.sort();
        } else {
            selected = [ts];
        }

        this.localStorage.setItem('App.historyLastSelected', ts.toString());
        this.localStorage.setItem('App.historyLastSelectedColumn', column);
        this.localStorage.setItem('App.historySelected', JSON.stringify(selected));
        this.setState({ selected, lastSelected: ts, lastSelectedColumn: column });
    }

    getTableRows(): JSX.Element[] {
        const rows = [];
        for (let r = this.state.values.length - 1; r >= 0; r--) {
            const state = this.state.values[r];
            const ts = state.ts;
            if (state.e) {
                rows.push(
                    <TableRow
                        sx={{ ...styles.row, ...styles.updatedRow, ...styles.rowInterpolated }}
                        key={ts}
                        hover
                    >
                        <TableCell />
                        <TableCell>...</TableCell>
                        {this.state.ackVisible ? <TableCell /> : null}
                        {this.state.fromVisible ? <TableCell /> : null}
                        {this.state.lcVisible ? <TableCell /> : null}
                    </TableRow>,
                );
            } else if (state.noData || state.noDataForPeriod) {
                rows.push(
                    <TableRow
                        sx={{ ...styles.row, ...styles.updatedRow, ...styles.rowNoData }}
                        key={state.noData ? 'nodata' : ''}
                        hover
                    >
                        <TableCell />
                        <TableCell>
                            {state.noData
                                ? this.props.t('No data in history')
                                : this.props.t('No data in history for selected period')}
                        </TableCell>
                        {this.state.ackVisible ? <TableCell /> : null}
                        {this.state.fromVisible ? <TableCell /> : null}
                        {this.state.lcVisible ? <TableCell /> : null}
                    </TableRow>,
                );
            } else {
                const interpolated = state.i;
                const selected = this.state.lastSelected === ts;
                let val = state.val;
                if (this.props.isFloatComma && this.props.obj.common.type === 'number' && val) {
                    val = val.toString().replace('.', ',');
                }
                if (val === null) {
                    val = 'null';
                }
                if (val === undefined) {
                    val = '_';
                }
                const selectedClass = this.state.selected.includes(ts);

                rows.push(
                    <TableRow
                        sx={{
                            ...styles.row,
                            ...styles.updatedRow,
                            ...(interpolated ? styles.rowInterpolated : undefined),
                            ...(selectedClass ? styles.rowSelected : undefined),
                        }}
                        key={ts.toString() + (state.val || '').toString()}
                    >
                        <TableCell onClick={e => !interpolated && this.onToggleSelect(e, ts, 'ts')}>
                            {`${ObjectHistoryData.formatTimestamp(state.ts)}`}
                            {selected && this.state.lastSelectedColumn === 'ts' ? (
                                <Box
                                    component="div"
                                    sx={styles.rowFocused}
                                />
                            ) : (
                                ''
                            )}
                        </TableCell>
                        <TableCell onClick={e => !interpolated && this.onToggleSelect(e, ts, 'val')}>
                            {val + this.unit}
                            {selected && this.state.lastSelectedColumn === 'val' ? (
                                <Box
                                    component="div"
                                    sx={styles.rowFocused}
                                />
                            ) : (
                                ''
                            )}
                        </TableCell>
                        {this.state.ackVisible ? (
                            <TableCell
                                onClick={e => !interpolated && this.onToggleSelect(e, ts, 'ack')}
                                sx={state.ack ? styles.cellAckTrue : styles.cellAckFalse}
                            >
                                {state.ack ? 'true' : 'false'}
                                {selected && this.state.lastSelectedColumn === 'ack' ? (
                                    <Box
                                        component="div"
                                        sx={styles.rowFocused}
                                    />
                                ) : (
                                    ''
                                )}
                            </TableCell>
                        ) : null}
                        {this.state.fromVisible ? (
                            <TableCell onClick={e => !interpolated && this.onToggleSelect(e, ts, 'from')}>
                                {state.from || ''}
                                {selected && this.state.lastSelectedColumn === 'from' ? (
                                    <Box
                                        component="div"
                                        sx={styles.rowFocused}
                                    />
                                ) : (
                                    ''
                                )}
                            </TableCell>
                        ) : null}
                        {this.state.lcVisible ? (
                            <TableCell onClick={e => !interpolated && this.onToggleSelect(e, ts, 'lc')}>
                                {state.lc
                                    ? `${new Date(state.lc).toLocaleDateString()} ${new Date(state.lc).toLocaleTimeString()}.${(state.ts % 1000).toString().padStart(3, '0')}`
                                    : ''}
                                {selected && this.state.lastSelectedColumn === 'lc' ? (
                                    <Box
                                        component="div"
                                        sx={styles.rowFocused}
                                    />
                                ) : (
                                    ''
                                )}
                            </TableCell>
                        ) : null}
                    </TableRow>,
                );
            }
        }

        return rows;
    }

    shiftTime(): void {
        const now = new Date();
        const delay = 60000 - now.getSeconds() - (1000 - now.getMilliseconds());

        if (now.getMilliseconds()) {
            now.setMilliseconds(1000);
        }
        if (now.getSeconds()) {
            now.setSeconds(60);
        }

        const end = now.getTime();
        let start;
        const mins = this.state.relativeRange;

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            start = now.getTime();
        } else if (mins === 'week') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            // find week start
            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }
            start = now.getTime();
        } else if (mins === '2weeks') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(now.getDate() - 7); // 1 week earlier

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }
            start = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            start = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            now.setMonth(0);
            start = now.getTime();
        } else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setFullYear(now.getFullYear() - 1);
            start = now.getTime();
        } else {
            start = end - parseInt(mins as string, 10) * 60000;
        }

        this.setState({ start, end }, () => this.readHistory());

        this.timeTimer = setTimeout(() => {
            this.timeTimer = undefined;
            this.shiftTime();
        }, delay || 60_000);
    }

    setRelativeInterval(mins: string | number, dontSave?: boolean): void {
        if (!dontSave) {
            this.localStorage.setItem('App.relativeRange', mins.toString());
            this.setState({ relativeRange: mins });
        }
        if (mins === 'absolute') {
            if (this.timeTimer) {
                clearTimeout(this.timeTimer);
                this.timeTimer = undefined;
            }
            return;
        }
        this.localStorage.removeItem('App.absoluteStart');
        this.localStorage.removeItem('App.absolute');

        const now = new Date();

        if (!this.timeTimer) {
            const delay = 60_000 - now.getSeconds() - (1_000 - now.getMilliseconds());
            this.timeTimer = setTimeout(() => {
                this.timeTimer = undefined;
                this.shiftTime();
            }, delay || 60_000);
        }

        if (now.getMilliseconds()) {
            now.setMilliseconds(1_000);
        }
        if (now.getSeconds()) {
            now.setSeconds(60);
        }

        const end = now.getTime();
        let start;

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            start = now.getTime();
        } else if (mins === 'week') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            start = now.getTime();
        } else if (mins === '2weeks') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(now.getDate() - 7); // 1 week earlier

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            start = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            start = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            now.setMonth(0);
            start = now.getTime();
        } else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setFullYear(now.getFullYear() - 1);
            start = now.getTime();
        } else {
            mins = Number(mins);
            start = end - mins * 60_000;
        }

        this.setState({ start, end }, () => this.readHistory());
    }

    renderTable(): JSX.Element {
        if (!this.state.historyInstance) {
            return <div style={{ marginTop: 20, fontSize: 24 }}>{this.props.t('History instance not selected')}</div>;
        }
        if (!this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)) {
            return <div style={{ marginTop: 20, fontSize: 24 }}>{this.props.t('History instance not alive')}</div>;
        }

        if (this.state.values) {
            const initialWidths: (number | 'auto')[] = [200, 'auto'];
            const minWidths = [190, 100];
            if (this.state.ackVisible) {
                initialWidths.push(50);
                minWidths.push(50);
            }
            if (this.state.fromVisible) {
                initialWidths.push(150);
                minWidths.push(150);
            }
            if (this.state.lcVisible) {
                initialWidths.push(200);
                minWidths.push(190);
            }

            return (
                <TableContainer style={styles.container}>
                    <TableResize
                        stickyHeader
                        sx={styles.table}
                        initialWidths={initialWidths}
                        minWidths={minWidths}
                        dblTitle={this.props.t('ra_Double click to reset table layout')}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell style={styles.colTs}>{this.props.t('Timestamp')}</TableCell>
                                <TableCell style={styles.colValue}>{this.props.t('Value')}</TableCell>
                                {this.state.ackVisible ? (
                                    <TableCell style={styles.colAck}>{this.props.t('Ack')}</TableCell>
                                ) : null}
                                {this.state.fromVisible ? (
                                    <TableCell style={styles.colFrom}>{this.props.t('From')}</TableCell>
                                ) : null}
                                {this.state.lcVisible ? (
                                    <TableCell style={styles.colLastChange}>{this.props.t('lc')}</TableCell>
                                ) : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>{this.getTableRows()}</TableBody>
                    </TableResize>
                </TableContainer>
            );
        }
        return <LinearProgress />;
    }

    renderDialogConfirm(): JSX.Element {
        return (
            <Dialog
                open={!!this.state.areYouSure}
                onClose={() => this.setState({ areYouSure: false })}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">{this.props.t('Are you sure?')}</DialogContentText>
                    <FormControlLabel
                        control={
                            <Checkbox
                                value={this.state.suppressMessage}
                                onChange={() => this.setState({ suppressMessage: true })}
                            />
                        }
                        label={this.props.t('Suppress for 5 minutes')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() =>
                            this.setState(
                                { areYouSure: false, suppressMessage: this.state.suppressMessage && Date.now() },
                                () => this.onDelete(),
                            )
                        }
                        color="primary"
                        autoFocus
                        startIcon={<IconDelete />}
                    >
                        {this.props.t('Delete')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ areYouSure: false })}
                        color="secondary"
                        startIcon={<IconClose />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    onDelete(): void {
        const tasks = this.state.selected.map(ts => ({ state: { ts }, id: this.props.obj._id }));
        void this.props.socket.sendTo(this.state.historyInstance, 'delete', tasks).then(() => this.readHistory());
    }

    onUpdate(): void {
        let val = this.state.edit.val;

        if (this.props.obj.common) {
            if (this.props.obj.common.type === 'number') {
                if (typeof val !== 'number') {
                    val = parseFloat(val.toString().replace(',', '.'));
                }
            } else if (this.props.obj.common.type === 'boolean') {
                val = val === 'true' || val === 'TRUE' || val === true || val === '1' || val === 1;
            }
        }

        const state: ioBroker.SettableState = {
            val,
            ack: this.state.edit.ack,
            ts: this.state.selected[0],
            from: `system.adapter.admin.${this.adminInstance}`,
            q: this.state.edit.q,
        };

        for (const [attr, stateVal] of Object.entries(state)) {
            if (stateVal === undefined) {
                // @ts-expect-error can be fixed later
                delete state[attr];
            }
        }

        if (!this.state.lcVisible && state.lc) {
            delete state.lc;
        }
        void this.props.socket
            .sendTo(this.state.historyInstance, 'update', [{ id: this.props.obj._id, state }])
            .then(() => this.readHistory());
    }

    onInsert(): void {
        let val = this.state.edit.val;

        if (this.props.obj.common) {
            if (this.props.obj.common.type === 'number') {
                val = parseFloat(val.toString().replace(',', '.'));
            } else if (this.props.obj.common.type === 'boolean') {
                val = val === 'true' || val === 'TRUE' || val === true || val === '1' || val === 1;
            }
        }

        const ts = this.state.edit.date;
        ts.setHours(this.state.edit.time.getHours());
        ts.setMinutes(this.state.edit.time.getMinutes());
        ts.setSeconds(this.state.edit.time.getSeconds());
        ts.setMilliseconds(parseInt(this.state.edit.ms as any as string, 10));

        const state: ioBroker.SettableState = {
            ts: ts.getTime(),
            val,
            ack: this.state.edit.ack,
            from: `system.adapter.admin.${this.adminInstance}`,
            q: this.state.edit.q || 0,
        };

        if (!this.state.lcVisible && state.lc) {
            delete state.lc;
        }

        for (const [attr, stateVal] of Object.entries(state)) {
            if (stateVal === undefined) {
                // @ts-expect-error can be fixed later
                delete state[attr];
            }
        }

        void this.props.socket
            .sendTo(this.state.historyInstance, 'insert', [{ id: this.props.obj._id, state }])
            .then(() => this.readHistory());
    }

    updateEdit(name: string, value: string | number | boolean | Date): void {
        const edit = JSON.parse(JSON.stringify(this.state.edit));
        edit.time = new Date(edit.time);
        edit.date = new Date(edit.date);
        edit[name] = value;

        this.setState({ edit });
    }

    renderEditDialog(): JSX.Element {
        return (
            <Dialog
                open={this.state.updateOpened || this.state.insertOpened}
                onClose={() => this.setState({ updateOpened: false, insertOpened: false })}
                aria-labelledby="edit-dialog-title"
                aria-describedby="edit-dialog-description"
            >
                <DialogTitle id="edit-dialog-title">
                    {this.state.updateOpened ? this.props.t('Update entry') : this.props.t('Insert entry')}
                </DialogTitle>
                <DialogContent>
                    <form
                        noValidate
                        autoComplete="off"
                    >
                        {typeof this.state.edit.val === 'boolean' ? (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.edit.val}
                                        onChange={e => this.updateEdit('val', e.target.checked)}
                                    />
                                }
                                label={this.props.t('Value')}
                            />
                        ) : (
                            <TextField
                                variant="standard"
                                label={this.props.t('Value')}
                                value={this.state.edit.val}
                                onChange={e => this.updateEdit('val', e.target.value)}
                            />
                        )}
                        <br />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.edit.ack}
                                    onChange={e => this.updateEdit('ack', e.target.checked)}
                                />
                            }
                            label={this.props.t('Acknowledged')}
                        />

                        {this.state.insertOpened ? (
                            <LocalizationProvider
                                dateAdapter={AdapterDateFns}
                                adapterLocale={localeMap[this.props.lang]}
                            >
                                <div style={styles.toolbarTimeGrid}>
                                    <div style={styles.toolbarTimeLabel}>{this.props.t('Time')}</div>
                                    <DatePicker
                                        sx={styles.toolbarDate}
                                        value={this.state.edit.date}
                                        onChange={date => this.updateEdit('date', date)}
                                    />
                                    <TimePicker
                                        sx={styles.toolbarTime}
                                        ampm={this.state.ampm}
                                        views={['hours', 'minutes', 'seconds']}
                                        value={this.state.edit.time}
                                        onChange={time => this.updateEdit('time', time)}
                                    />
                                    <TextField
                                        variant="standard"
                                        sx={styles.msInput}
                                        helperText={this.props.t('ms')}
                                        type="number"
                                        slotProps={{
                                            htmlInput: {
                                                max: 999,
                                                min: 0,
                                            },
                                        }}
                                        value={this.state.edit.ms}
                                        onChange={e => this.updateEdit('ms', e.target.value)}
                                    />
                                </div>
                            </LocalizationProvider>
                        ) : null}
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        disabled={this.state.edit.val === ''}
                        onClick={() => {
                            const isUpdate = this.state.updateOpened;
                            this.setState({ updateOpened: false, insertOpened: false }, () =>
                                isUpdate ? this.onUpdate() : this.onInsert(),
                            );
                        }}
                        color="primary"
                        autoFocus
                    >
                        {this.state.updateOpened ? this.props.t('Update') : this.props.t('Add')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ updateOpened: false, insertOpened: false })}
                        color="grey"
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    setStartDate(startDate: Date): void {
        const start = startDate.getTime();
        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = undefined;
        }
        this.localStorage.setItem('App.relativeRange', 'absolute');
        this.localStorage.setItem('App.absoluteStart', start.toString());
        this.localStorage.setItem('App.absoluteEnd', this.state.end.toString());
        this.setState({ start, relativeRange: 'absolute' }, () => this.readHistory());
    }

    setEndDate(endDate: Date): void {
        const end = endDate.getTime();
        this.localStorage.setItem('App.relativeRange', 'absolute');
        this.localStorage.setItem('App.absoluteStart', this.state.start.toString());
        this.localStorage.setItem('App.absoluteEnd', end.toString());
        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = undefined;
        }
        this.setState({ end, relativeRange: 'absolute' }, () => this.readHistory());
    }

    renderToolbar(): JSX.Element {
        return (
            <Toolbar>
                <FormControl
                    variant="standard"
                    style={styles.selectHistoryControl}
                >
                    <InputLabel>{this.props.t('History instance')}</InputLabel>
                    <Select
                        variant="standard"
                        value={this.state.historyInstance || ''}
                        onChange={e => {
                            const historyInstance = e.target.value;
                            this.localStorage.setItem('App.historyInstance', historyInstance);
                            void this.readSupportedFeatures(historyInstance).then(
                                (supportedFeatures: SupportedFeatures) =>
                                    this.setState({ historyInstance, supportedFeatures }, () => this.readHistory()),
                            );
                        }}
                    >
                        {this.state.historyInstances?.map(it => (
                            <MenuItem
                                key={it.id}
                                value={it.id}
                                style={!it.alive ? styles.notAliveInstance : undefined}
                            >
                                {it.id}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    variant="standard"
                    style={styles.selectRelativeTime}
                >
                    <InputLabel>{this.props.t('Relative')}</InputLabel>
                    <Select
                        variant="standard"
                        ref={this.rangeRef}
                        value={this.state.relativeRange}
                        onChange={e => this.setRelativeInterval(e.target.value)}
                    >
                        <MenuItem
                            key="custom"
                            value="absolute"
                            sx={styles.customRange}
                        >
                            {this.props.t('custom range')}
                        </MenuItem>
                        <MenuItem
                            key="1"
                            value={10}
                        >
                            {this.props.t('last 10 minutes')}
                        </MenuItem>
                        <MenuItem
                            key="2"
                            value={30}
                        >
                            {this.props.t('last 30 minutes')}
                        </MenuItem>
                        <MenuItem
                            key="3"
                            value={60}
                        >
                            {this.props.t('last hour')}
                        </MenuItem>
                        <MenuItem
                            key="4"
                            value="day"
                        >
                            {this.props.t('this day')}
                        </MenuItem>
                        <MenuItem
                            key="5"
                            value={24 * 60}
                        >
                            {this.props.t('last 24 hours')}
                        </MenuItem>
                        <MenuItem
                            key="6"
                            value="week"
                        >
                            {this.props.t('this week')}
                        </MenuItem>
                        <MenuItem
                            key="7"
                            value={24 * 60 * 7}
                        >
                            {this.props.t('last week')}
                        </MenuItem>
                        <MenuItem
                            key="8"
                            value="2weeks"
                        >
                            {this.props.t('this 2 weeks')}
                        </MenuItem>
                        <MenuItem
                            key="9"
                            value={24 * 60 * 14}
                        >
                            {this.props.t('last 2 weeks')}
                        </MenuItem>
                        <MenuItem
                            key="10"
                            value="month"
                        >
                            {this.props.t('this month')}
                        </MenuItem>
                        <MenuItem
                            key="11"
                            value={30 * 24 * 60}
                        >
                            {this.props.t('last 30 days')}
                        </MenuItem>
                        <MenuItem
                            key="12"
                            value="year"
                        >
                            {this.props.t('this year')}
                        </MenuItem>
                        <MenuItem
                            key="13"
                            value="12months"
                        >
                            {this.props.t('last 12 months')}
                        </MenuItem>
                    </Select>
                </FormControl>

                <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={localeMap[this.props.lang]}
                >
                    <div style={styles.toolbarTimeGrid}>
                        <div
                            style={{
                                ...styles.toolbarTimeLabel,
                                opacity: this.state.relativeRange !== 'absolute' ? 0.5 : undefined,
                            }}
                        >
                            {this.props.t('Start time')}
                        </div>
                        <DatePicker
                            sx={styles.toolbarDate}
                            disabled={this.state.relativeRange !== 'absolute'}
                            value={new Date(this.state.start)}
                            onChange={date => this.setStartDate(date)}
                        />
                        <TimePicker
                            disabled={this.state.relativeRange !== 'absolute'}
                            sx={styles.toolbarTime}
                            ampm={this.state.ampm}
                            value={new Date(this.state.start)}
                            onChange={date => this.setStartDate(date)}
                        />
                    </div>
                    <div style={styles.toolbarTimeGrid}>
                        <div
                            style={{
                                ...styles.toolbarTimeLabel,
                                opacity: this.state.relativeRange !== 'absolute' ? 0.5 : undefined,
                            }}
                        >
                            {this.props.t('End time')}
                        </div>
                        <DatePicker
                            disabled={this.state.relativeRange !== 'absolute'}
                            sx={styles.toolbarDate}
                            value={new Date(this.state.end)}
                            onChange={date => this.setEndDate(date)}
                        />
                        <TimePicker
                            disabled={this.state.relativeRange !== 'absolute'}
                            sx={styles.toolbarTime}
                            ampm={this.state.ampm}
                            value={new Date(this.state.end)}
                            onChange={date => this.setEndDate(date)}
                        />
                    </div>
                </LocalizationProvider>
                <Box
                    component="div"
                    sx={styles.grow}
                />

                {this.state.values?.length ? (
                    <IconButton
                        size="large"
                        onClick={() => this.exportData()}
                        title={this.props.t('Save data as csv')}
                    >
                        <ExportIcon />
                    </IconButton>
                ) : null}

                {this.state.supportedFeatures.includes('insert') && this.props.expertMode ? (
                    <IconButton
                        size="large"
                        onClick={() => {
                            const time = new Date();

                            const edit: ObjectHistoryDataEdit = {
                                ack: this.state.values[this.state.values.length - 1].ack,
                                val: this.state.values[this.state.values.length - 1].val,
                                date: new Date(time),
                                ms: 0,
                                time: new Date(time),
                                q: 0,
                            };

                            this.setState({
                                edit,
                                insertOpened: true,
                            });
                        }}
                    >
                        <InsertIcon />
                    </IconButton>
                ) : null}
                {this.state.supportedFeatures.includes('update') && this.props.expertMode ? (
                    <IconButton
                        size="large"
                        disabled={this.state.selected.length !== 1}
                        onClick={() => {
                            const state = JSON.parse(
                                JSON.stringify(
                                    this.state.values.find((it: HistoryItem) => it.ts === this.state.lastSelected),
                                ),
                            );
                            const time = new Date(state.ts);
                            state.date = new Date(time);
                            state.time = new Date(time);

                            this.setState({
                                edit: state,
                                updateOpened: true,
                            });
                        }}
                    >
                        <IconEdit />
                    </IconButton>
                ) : null}
                {this.state.supportedFeatures.includes('delete') && this.props.expertMode ? (
                    <IconButton
                        size="large"
                        disabled={!this.state.selected.length}
                        onClick={() => {
                            if (
                                typeof this.state.suppressMessage === 'number' &&
                                Date.now() - this.state.suppressMessage < 300_000
                            ) {
                                this.onDelete();
                            } else {
                                this.setState({ areYouSure: true });
                            }
                        }}
                    >
                        <IconDelete />
                    </IconButton>
                ) : null}
            </Toolbar>
        );
    }

    exportData(): void {
        let element = window.document.getElementById('export-file');
        if (!element) {
            element = document.createElement('a');
            element.setAttribute('id', 'export-file');
            element.style.display = 'none';
            document.body.appendChild(element);
        }

        const lines = ['timestamp;value;acknowledged;from;'];

        this.state.values.forEach(
            (state: HistoryItem) =>
                !state.i &&
                !state.e &&
                lines.push(
                    [
                        ObjectHistoryData.formatTimestamp(state.ts),
                        state.val === null || state.val === undefined ? 'null' : state.val.toString(),
                        state.ack ? 'true' : 'false',
                        state.from || '',
                    ].join(';'),
                ),
        );

        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`);
        element.setAttribute(
            'download',
            `${Utils.getObjectName({ [this.props.obj._id]: this.props.obj }, this.props.obj._id, this.props.lang)}.csv`,
        );

        element.click();

        document.body.removeChild(element);
    }

    render(): JSX.Element {
        if (!this.state.historyInstances) {
            return <LinearProgress />;
        }

        return (
            <Paper style={styles.paper}>
                {this.state.loading ? <LinearProgress /> : <div style={styles.noLoadingProgress} />}
                {this.renderToolbar()}
                <Box
                    component="div"
                    sx={styles.tableDiv}
                >
                    {this.renderTable()}
                </Box>
                {this.renderDialogConfirm()}
                {this.renderEditDialog()}
            </Paper>
        );
    }

    /**
     * Convert timestamp to human-readable date string
     *
     * @param ts the timestamp
     */
    static formatTimestamp(ts: number): string {
        return `${new Date(ts).toLocaleDateString()} ${new Date(ts).toLocaleTimeString()}.${(ts % 1_000).toString().padStart(3, '0')}`;
    }
}

export default withWidth()(ObjectHistoryData);
