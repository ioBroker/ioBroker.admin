import React, { Component, createRef, type JSX } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import {
    Button,
    Fab,
    FormControl,
    InputLabel,
    LinearProgress,
    Menu,
    MenuItem,
    Paper,
    Select,
    Toolbar,
} from '@mui/material';

import {
    Remove as RemoveIcon,
    KeyboardArrowRight as StepStartIcon,
    MoreHoriz as StepMiddleIcon,
    KeyboardArrowLeft as StepEndIcon,
} from '@mui/icons-material';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import type { EChartsOption, YAXisComponentOption } from 'echarts/types/dist/echarts';

import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    GridComponent,
    TimelineComponent,
    TitleComponent,
    ToolboxComponent,
    TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

import {
    type AdminConnection,
    Utils,
    withWidth,
    type IobTheme,
    type ThemeType,
    type Translate,
} from '@iobroker/adapter-react-v5';

// icons
import { FaChartLine as SplitLineIcon } from 'react-icons/fa';
import EchartsIcon from '../../assets/echarts.png';
import { localeMap } from './utils';

echarts.use([
    TimelineComponent,
    ToolboxComponent,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LineChart,
    SVGRenderer,
]);

const styles: Record<string, any> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        width: '100%',
    },
    chart: {
        width: '100%',
        overflow: 'hidden',
    },
    chartWithToolbar: (theme: IobTheme) => ({
        height: `calc(100% - ${parseInt(theme.mixins.toolbar.minHeight as string, 10) + 8}px)`,
    }),
    chartWithoutToolbar: {
        height: '100%',
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
    splitLineButtonIcon: {
        marginRight: 8,
    },
    grow: {
        flexGrow: 1,
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
    toolbarTimeLabel: {
        position: 'absolute',
        padding: 8,
        fontSize: '0.8rem',
        left: 2,
        top: -9,
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
    buttonIcon: {
        width: 24,
        height: 24,
    },
    echartsButton: {
        marginRight: 8,
        height: 34,
        width: 34,
    },
};

const GRID_PADDING_LEFT = 80;
const GRID_PADDING_RIGHT = 25;

interface ObjectChartProps {
    obj: ioBroker.StateObject;
    customsInstances: string[];
    objects: Record<string, ioBroker.Object>;
    socket: AdminConnection;
    lang: ioBroker.Languages;
    themeType: ThemeType;
    // dateFormat: string;
    isFloatComma: boolean;
    noToolbar: boolean;
    showJumpToEchart: boolean;
    defaultHistory: string;
    historyInstance: string;
    from: number;
    end: number;
    t: Translate;
    theme: IobTheme;
}

interface ObjectChartState {
    historyInstance: string;
    historyInstances: { id: string; alive: boolean }[] | null;
    defaultHistory: string;
    chartHeight: number;
    chartWidth: number;
    windowWidth: number;
    ampm: boolean;
    relativeRange: string;
    splitLine: boolean;
    min: number;
    max: number;
    maxYLen: number;
    stepType: string;
    echartsJump: boolean;
    showStepMenu?: null | HTMLElement;
}

interface HistoryItem {
    val: ioBroker.StateValue;
    ts: number;
    i?: boolean;
}

class ObjectChart extends Component<ObjectChartProps, ObjectChartState> {
    private echartsReact: ReactEchartsCore;

    private readonly rangeRef: React.RefObject<HTMLDivElement>;

    private readTimeout: ReturnType<typeof setTimeout> | null = null;

    private chartValues: { val: ioBroker.StateValue; ts: number }[] | null;

    private rangeValues: { val: ioBroker.StateValue; ts: number }[] | null;

    private subscribes: string[];

    private readonly unit: string;

    private readonly divRef: React.RefObject<HTMLDivElement>;

    private chart: {
        min?: number;
        max?: number;
        withSeconds?: boolean;
        withTime?: boolean;
        diff?: number;
        lastX?: number;
        lastWidth?: number;
    };

    private timerResize: ReturnType<typeof setTimeout> | null = null;

    private updateTimer: ReturnType<typeof setTimeout> | null = null;

    private minY: number;

    private maxY: number;

    private timeTimer: ReturnType<typeof setTimeout> | null = null;

    private maxYLenTimeout: ReturnType<typeof setTimeout> | null = null;

    private mouseDown: boolean;

    private start: number;

    private end: number;

    private readonly localStorage: Storage;

    constructor(props: ObjectChartProps) {
        super(props);
        this.localStorage = (window as any)._localStorage || window.localStorage;

        if (!this.props.from) {
            const from = new Date();
            from.setHours(from.getHours() - 24 * 7);
            this.start = from.getTime();
        } else {
            this.start = this.props.from;
        }
        if (!this.props.end) {
            this.end = Date.now();
        } else {
            this.end = this.props.end;
        }
        let relativeRange = this.localStorage.getItem('App.relativeRange') || '30';
        const min = parseInt(this.localStorage.getItem('App.absoluteStart'), 10) || 0;
        const max = parseInt(this.localStorage.getItem('App.absoluteEnd'), 10) || 0;

        if ((!min || !max) && (!relativeRange || relativeRange === 'absolute')) {
            relativeRange = '30';
        }

        if (max && min) {
            relativeRange = 'absolute';
        }

        this.state = {
            historyInstance: this.props.historyInstance || '',
            historyInstances: null,
            defaultHistory: '',
            chartHeight: 300,
            chartWidth: 500,
            windowWidth: window.innerWidth,
            ampm: false,
            relativeRange,
            splitLine: this.localStorage.getItem('App.splitLine') === 'true',
            min,
            max,
            maxYLen: 0,
            stepType: '',
            echartsJump: false,
        };

        this.echartsReact = null;
        this.rangeRef = createRef();
        this.readTimeout = null;
        this.chartValues = null;
        this.rangeValues = null;
        this.subscribes = [];

        this.unit = this.props.obj.common && this.props.obj.common.unit ? ` ${this.props.obj.common.unit}` : '';

        this.divRef = createRef();

        this.chart = {};
    }

    componentDidMount(): void {
        void this.props.socket.subscribeState(this.props.obj._id, this.onChange);
        window.addEventListener('resize', this.onResize);
        void this.prepareData()
            .then(() => !this.props.noToolbar && this.readHistoryRange())
            .then(() => this.setRelativeInterval(this.state.relativeRange, true, () => this.forceUpdate()));
    }

    componentWillUnmount(): void {
        if (this.readTimeout) {
            clearTimeout(this.readTimeout);
            this.readTimeout = null;
        }

        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = null;
        }

        if (this.maxYLenTimeout) {
            clearTimeout(this.maxYLenTimeout);
            this.maxYLenTimeout = null;
        }

        if (this.timerResize) {
            clearTimeout(this.timerResize);
            this.timerResize = null;
        }

        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        if (this.echartsReact) {
            this.echartsReact.getEchartsInstance().dispose();
        }

        for (let i = 0; i < this.subscribes.length; i++) {
            this.props.socket.unsubscribeState(this.subscribes[i], this.onChange);
        }
        this.subscribes = [];

        this.props.socket.unsubscribeState(this.props.obj._id, this.onChange);
        window.removeEventListener('resize', this.onResize);
    }

    onResize = (): void => {
        if (this.timerResize) {
            clearTimeout(this.timerResize);
        }
        this.timerResize = setTimeout(() => {
            this.timerResize = null;
            this.setState({ windowWidth: window.innerWidth });
            this.componentDidUpdate();
        });
    };

    onChange = (id: string, state: ioBroker.State): void => {
        if (
            id === this.props.obj._id &&
            state &&
            this.rangeValues &&
            (!this.rangeValues.length || this.rangeValues[this.rangeValues.length - 1].ts < state.ts)
        ) {
            if (!this.state.max || state.ts - this.state.max < 120_000) {
                if (this.chartValues) {
                    this.chartValues.push({ val: state.val, ts: state.ts });
                }
                this.rangeValues.push({ val: state.val, ts: state.ts });

                // update only if an end is near to now
                if (state.ts >= this.chart.min && state.ts <= this.chart.max + 300_000) {
                    this.updateChart();
                }
            }
        } else if (id.startsWith('system.adapter.') && id.endsWith('.alive') && this.state.historyInstances) {
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
                            void this.readHistoryRange().then(() => this.updateChart());
                        }
                    });
                }
            }
        }
    };

    async prepareData(): Promise<void> {
        if (this.props.noToolbar) {
            const isAlive =
                this.props.defaultHistory &&
                (await this.props.socket.getState(`system.adapter.${this.props.defaultHistory}.alive`));

            if (!this.subscribes.length) {
                this.subscribes = [`system.adapter.${this.props.defaultHistory}.alive`];
                await this.props.socket.subscribeState(
                    `system.adapter.${this.props.defaultHistory}.alive`,
                    this.onChange,
                );
            }

            await new Promise(resolve => {
                this.setState(
                    {
                        // dateFormat: this.props.dateFormat.replace(/D/g, 'd').replace(/Y/g, 'y'),
                        defaultHistory: this.props.defaultHistory,
                        historyInstance: this.props.defaultHistory,
                        historyInstances: [{ id: this.props.defaultHistory, alive: !!isAlive?.val }],
                    },
                    () => resolve(null),
                );
            });
            return;
        }

        let list: { id: string; alive: boolean }[] = await this.getHistoryInstances();
        const config = await this.props.socket.getCompactSystemConfig();
        let instances: ioBroker.InstanceObject[] = [];
        if (this.props.showJumpToEchart) {
            instances = await this.props.socket.getAdapterInstances('echarts', true);
        }
        // collect all echarts instances
        const echartsJump = !!instances.find(item => item._id.startsWith('system.adapter.echarts.'));

        const defaultHistory = config && config.common && config.common.defaultHistory;
        // filter out history instances, that does not have data for this object
        if (this.props.obj.common.custom) {
            list = list.filter(it => this.props.obj.common.custom[it.id]);
        }

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

        this.setState({
            ampm: config.common.dateFormat.includes('/'),
            // dateFormat: (config.common.dateFormat || 'dd.MM.yyyy').replace(/D/g, 'd').replace(/Y/g, 'y'),
            historyInstances: list,
            defaultHistory,
            historyInstance,
            echartsJump,
            stepType: this.props.obj.common.custom
                ? this.props.obj.common.custom[historyInstance]?.chartStep || ''
                : '',
        });
    }

    getHistoryInstances(): Promise<{ id: string; alive: boolean }[]> {
        if (this.props.historyInstance) {
            return Promise.resolve([]);
        }
        const list: { id: string; alive: boolean }[] = [];
        const ids: string[] = [];

        this.props.customsInstances.forEach(instance => {
            const instObj: ioBroker.InstanceObject = this.props.objects[`system.adapter.${instance}`] as
                | ioBroker.InstanceObject
                | undefined;
            if (instObj?.common?.getHistory) {
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

    readHistoryRange(): Promise<void> {
        const now = new Date();
        const oldest = new Date(2000, 0, 1);

        if (this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)) {
            return this.props.socket
                .getHistory(this.props.obj._id, {
                    instance: this.state.historyInstance,
                    start: oldest.getTime(),
                    end: now.getTime(),
                    // step:      3600000, // hourly
                    limit: 1,
                    from: false,
                    ack: false,
                    q: false,
                    addId: false,
                    aggregate: 'none',
                })
                .then((values: { val: ioBroker.StateValue; ts: number }[]) => {
                    // remove interpolated first value
                    if (values && values[0]?.val === null) {
                        values.shift();
                    }
                    this.rangeValues = values;
                });
        }

        return Promise.resolve();
    }

    readHistory(start?: number, end?: number): Promise<{ val: ioBroker.StateValue; ts: number }[]> {
        /* interface GetHistoryOptions {
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
        } */
        if (
            !this.state.historyInstance ||
            !this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)
        ) {
            return Promise.resolve([]);
        }

        const options: ioBroker.GetHistoryOptions = {
            instance: this.state.historyInstance,
            start,
            end,
            from: false,
            ack: false,
            q: false,
            addId: false,
            aggregate: 'none',
            returnNewestEntries: true,
        };

        // if more than 24 hours => aggregate
        if (
            end - start > 60000 * 24 &&
            !(
                this.props.obj.common.type === 'boolean' ||
                (this.props.obj.common.type === 'number' && this.props.obj.common.states)
            )
        ) {
            options.aggregate = 'minmax';
            // options.step = 60000;
        }

        return this.props.socket
            .getHistory(this.props.obj._id, options)
            .then((values: { val: ioBroker.StateValue; ts: number }[]) => {
                // merge range and chart
                const chart = [];
                let r = 0;
                const range = this.rangeValues;
                let minY = null;
                let maxY = null;

                for (let t = 0; t < values.length; t++) {
                    if (range) {
                        while (r < range.length && range[r].ts < values[t].ts) {
                            chart.push(range[r]);
                            // console.log(`add ${new Date(range[r].ts).toISOString()}: ${range[r].val}`);
                            r++;
                        }
                    }
                    // if range and details are not equal
                    if (!chart.length || chart[chart.length - 1].ts < values[t].ts) {
                        chart.push(values[t]);
                        // console.log(`add value ${new Date(values[t].ts).toISOString()}: ${values[t].val}`)
                    } else if (
                        chart[chart.length - 1].ts === values[t].ts &&
                        chart[chart.length - 1].val !== values[t].ts
                    ) {
                        console.error('Strange data!');
                    }
                    if (minY === null || values[t].val < minY) {
                        minY = values[t].val;
                    }
                    if (maxY === null || values[t].val > maxY) {
                        maxY = values[t].val;
                    }
                }

                if (range) {
                    while (r < range.length) {
                        chart.push(range[r]);
                        console.log(`add range ${new Date(range[r].ts).toISOString()}: ${range[r].val}`);
                        r++;
                    }
                }

                // sort
                chart.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0));

                this.chartValues = chart;
                this.minY = minY as number;
                this.maxY = maxY as number;

                if (this.minY < 10) {
                    this.minY = Math.round(this.minY * 10) / 10;
                } else {
                    this.minY = Math.ceil(this.minY);
                }
                if (this.maxY < 10) {
                    this.maxY = Math.round(this.maxY * 10) / 10;
                } else {
                    this.maxY = Math.ceil(this.maxY);
                }

                return chart;
            });
    }

    convertData(values?: HistoryItem[]): { value: number[]; exact?: boolean }[] {
        values = values || this.chartValues;
        const data: { value: number[]; exact?: boolean }[] = [];
        if (!values.length) {
            return [];
        }
        for (let i = 0; i < values.length; i++) {
            const dp: { value: number[]; exact?: boolean } = { value: [values[i].ts, values[i].val as number] };
            if (values[i].i) {
                dp.exact = false;
            }
            data.push(dp);
        }
        if (!this.chart.min) {
            this.chart.min = values[0].ts;
            this.chart.max = values[values.length - 1].ts;
        }

        return data;
    }

    getOption(): EChartsOption {
        let widthAxis;
        if (this.minY !== null && this.minY !== undefined) {
            widthAxis = (this.minY.toString() + this.unit).length * 9 + 12;
        }
        if (this.maxY !== null && this.maxY !== undefined) {
            const w = (this.maxY.toString() + this.unit).length * 9 + 12;
            if (w > widthAxis) {
                widthAxis = w;
            }
        }

        if (this.state.maxYLen) {
            const w = this.state.maxYLen * 9 + 12;
            if (w > widthAxis) {
                widthAxis = w;
            }
        }

        const serie = {
            xAxisIndex: 0,
            type: 'line',
            step:
                this.state.stepType === 'stepStart'
                    ? 'end'
                    : this.state.stepType === 'stepMiddle'
                      ? 'middle'
                      : this.state.stepType === 'stepEnd'
                        ? 'start'
                        : undefined,
            showSymbol: false,
            hoverAnimation: true,
            animation: false,
            data: this.convertData(),
            lineStyle: {
                color: '#4dabf5',
            },
            areaStyle: {},
        };

        const yAxis: YAXisComponentOption = {
            type: 'value',
            boundaryGap: [0, '100%'],
            splitLine: {
                show: this.props.noToolbar || !!this.state.splitLine,
            },
            splitNumber: Math.round(this.state.chartHeight / 50),
            axisLabel: {
                formatter: (value: number) => {
                    let text;
                    if (this.props.isFloatComma) {
                        text = value.toString().replace(',', '.') + this.unit;
                    } else {
                        text = value + this.unit;
                    }

                    if (this.state.maxYLen < text.length) {
                        if (this.maxYLenTimeout) {
                            clearTimeout(this.maxYLenTimeout);
                        }
                        this.maxYLenTimeout = setTimeout(
                            maxYLen => {
                                this.maxYLenTimeout = null;
                                this.setState({ maxYLen });
                            },
                            200,
                            text.length,
                        );
                    }
                    return text;
                },
                showMaxLabel: true,
                showMinLabel: true,
            },
            axisTick: {
                // @ts-expect-error fix later
                alignWithLabel: true,
            },
        };

        if (this.props.obj.common.type === 'boolean') {
            serie.step = 'end';
            yAxis.axisLabel.showMaxLabel = false;
            // @ts-expect-error fix later
            yAxis.axisLabel.formatter = (value: number) => (value === 1 ? 'TRUE' : 'FALSE');
            yAxis.max = 1.5;
            // @ts-expect-error fix later
            yAxis.interval = 1;
            widthAxis = 50;
        } else if (this.props.obj.common.type === 'number' && this.props.obj.common.states) {
            serie.step = 'end';
            yAxis.axisLabel.showMaxLabel = false;
            const states = this.props.obj.common.states as Record<string, string>;
            // @ts-expect-error fix later
            yAxis.axisLabel.formatter = (value: number) => (states[value] !== undefined ? states[value] : value);
            const keys = Object.keys(this.props.obj.common.states);
            keys.sort();
            yAxis.max = parseFloat(keys[keys.length - 1]) + 0.5;
            // @ts-expect-error fix later
            yAxis.interval = 1;
            let max = '';
            for (let i = 0; i < keys.length; i++) {
                if (typeof states[keys[i]] === 'string' && states[keys[i]].length > max.length) {
                    max = states[keys[i]];
                }
            }
            widthAxis = (max.length * 9 || 50) + 12;
        }

        const splitNumber = this.chart.withSeconds
            ? Math.round((this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT) / 100)
            : Math.round((this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT) / 60);

        return {
            backgroundColor: 'transparent',
            title: {
                text: this.props.noToolbar ? '' : Utils.getObjectNameFromObj(this.props.obj, this.props.lang),
                padding: [
                    10, // up
                    0, // right
                    0, // down
                    widthAxis ? widthAxis + 10 : GRID_PADDING_LEFT + 10, // left
                ],
            },
            grid: {
                left: widthAxis || GRID_PADDING_LEFT,
                top: 8,
                right: this.props.noToolbar ? 5 : GRID_PADDING_RIGHT,
                bottom: 40,
            },
            tooltip: {
                trigger: 'axis',
                formatter: params => {
                    // @ts-expect-error fix later
                    const param = params[0];
                    const date = new Date(param.value[0]);
                    let value: number | string = param.value[1];
                    if (value !== null && this.props.isFloatComma) {
                        value = value.toString().replace('.', ',');
                    }
                    return `${param.exact === false ? 'i' : ''}${date.toLocaleString()}.${date.getMilliseconds().toString().padStart(3, '0')}: ${value}${this.unit}`;
                },
                axisPointer: {
                    animation: true,
                },
            },
            xAxis: {
                // type: 'time',
                splitLine: {
                    show: false,
                },
                splitNumber,
                min: this.chart.min,
                max: this.chart.max,
                axisTick: {
                    // @ts-expect-error fix later
                    alignWithLabel: true,
                },
                axisLabel: {
                    formatter: (value: number) => {
                        const date = new Date(value);
                        if (this.chart.withSeconds) {
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                        }
                        if (this.chart.withTime) {
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}\n${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                        }
                        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}\n${date.getFullYear()}`;
                    },
                },
            },
            yAxis,
            toolbox: {
                left: 'right',
                feature: this.props.noToolbar
                    ? undefined
                    : {
                          saveAsImage: {
                              title: this.props.t('Save as image'),
                              show: true,
                          },
                      },
            },
            // @ts-expect-error fix later
            series: [serie],
        };
    }

    static getDerivedStateFromProps(_props: ObjectChartProps, _state: ObjectChartState): null {
        return null;
    }

    updateChart(start?: number, end?: number, withReadData?: boolean, cb?: () => void): void {
        if (start) {
            this.start = start;
        }
        if (end) {
            this.end = end;
        }
        start = start || this.start;
        end = end || this.end;

        if (this.readTimeout) {
            clearTimeout(this.readTimeout);
        }

        this.readTimeout = setTimeout(() => {
            this.readTimeout = null;

            const diff = this.chart.max - this.chart.min;
            if (diff !== this.chart.diff) {
                this.chart.diff = diff;
                this.chart.withTime = this.chart.diff < 3600000 * 24 * 7;
                this.chart.withSeconds = this.chart.diff < 60000 * 30;
            }

            if (withReadData) {
                void this.readHistory(start, end).then((values: HistoryItem[]) => {
                    if (typeof this.echartsReact?.getEchartsInstance === 'function') {
                        this.echartsReact.getEchartsInstance().setOption({
                            series: [{ data: this.convertData(values) }],
                            xAxis: {
                                min: this.chart.min,
                                max: this.chart.max,
                            },
                        });
                    }
                    if (cb) {
                        cb();
                    }
                });
            } else {
                if (typeof this.echartsReact?.getEchartsInstance === 'function') {
                    this.echartsReact.getEchartsInstance().setOption({
                        series: [{ data: this.convertData() }],
                        xAxis: {
                            min: this.chart.min,
                            max: this.chart.max,
                        },
                    });
                }
                if (cb) {
                    cb();
                }
            }
        }, 400);
    }

    setNewRange(readData?: boolean): void {
        /* if (this.rangeRef.current &&
            this.rangeRef.current.childNodes[1] &&
            this.rangeRef.current.childNodes[1].value) {
            this.rangeRef.current.childNodes[0].innerHTML = '';
            this.rangeRef.current.childNodes[1].value = '';
        } */
        this.chart.diff = this.chart.max - this.chart.min;
        this.chart.withTime = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        if (this.state.relativeRange !== 'absolute') {
            this.setState({ relativeRange: 'absolute' });
            // stop shift timer
            if (this.timeTimer) {
                clearTimeout(this.timeTimer);
                this.timeTimer = null;
            }
        } else if (typeof this.echartsReact?.getEchartsInstance === 'function') {
            this.echartsReact.getEchartsInstance().setOption({
                xAxis: {
                    min: this.chart.min,
                    max: this.chart.max,
                },
            });

            if (readData) {
                this.updateChart(this.chart.min, this.chart.max, true);
            }
        }
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

        const max = now.getTime();
        let min;
        const mins = this.state.relativeRange;

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            min = now.getTime();
        } else if (mins === 'week') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            min = now.getTime();
        } else if (mins === '2weeks') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(now.getDate() - 7); // 1 week earlier

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            min = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            min = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            now.setMonth(0);
            min = now.getTime();
        } else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setFullYear(now.getFullYear() - 1);
            min = now.getTime();
        } else {
            min = max - parseInt(mins, 10) * 60000;
        }

        this.chart.min = min;
        this.chart.max = max;

        this.setState({ min, max }, () => this.updateChart(this.chart.min, this.chart.max, true));

        this.timeTimer = setTimeout(() => {
            this.timeTimer = null;
            this.shiftTime();
        }, delay || 60000);
    }

    setRelativeInterval(mins: string, dontSave?: boolean, cb?: () => void): void {
        if (!dontSave) {
            this.localStorage.setItem('App.relativeRange', mins);
            this.setState({ relativeRange: mins });
        }
        if (mins === 'absolute') {
            if (this.timeTimer) {
                clearTimeout(this.timeTimer);
                this.timeTimer = null;
            }
            this.updateChart(this.chart.min, this.chart.max, true, cb);
            return;
        }
        this.localStorage.removeItem('App.absoluteStart');
        this.localStorage.removeItem('App.absoluteEnd');

        const now = new Date();

        if (!this.timeTimer) {
            const delay = 60000 - now.getSeconds() - (1000 - now.getMilliseconds());
            this.timeTimer = setTimeout(() => {
                this.timeTimer = null;
                this.shiftTime();
            }, delay || 60000);
        }

        if (now.getMilliseconds()) {
            now.setMilliseconds(1000);
        }
        if (now.getSeconds()) {
            now.setSeconds(60);
        }

        this.chart.max = now.getTime();

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            this.chart.min = now.getTime();
        } else if (mins === 'week') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            this.chart.min = now.getTime();
        } else if (mins === '2weeks') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(now.getDate() - 7); // 1 week earlier

            const day = now.getDay() || 7;
            if (day !== 1) {
                now.setHours(-24 * (day - 1));
            }

            this.chart.min = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            this.chart.min = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setDate(1);
            now.setMonth(0);
            this.chart.min = now.getTime();
        } else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setFullYear(now.getFullYear() - 1);
            this.chart.min = now.getTime();
        } else {
            this.chart.min = this.chart.max - parseInt(mins, 10) * 60000;
        }

        this.setState({ min: this.chart.min, max: this.chart.max }, () =>
            this.updateChart(this.chart.min, this.chart.max, true, cb),
        );
    }

    installEventHandlers(): void {
        if (!this.echartsReact || typeof this.echartsReact.getEchartsInstance !== 'function') {
            return;
        }

        const zr = this.echartsReact.getEchartsInstance().getZr();
        if (!(zr as any)._iobInstalled) {
            (zr as any)._iobInstalled = true;
            zr.on('mousedown', (e: MouseEvent) => {
                console.log('mouse down');
                this.mouseDown = true;
                this.chart.lastX = e.offsetX;
            });
            zr.on('mouseup', () => {
                console.log('mouse up');
                this.mouseDown = false;
                this.setNewRange(true);
            });
            zr.on('mousewheel', e => {
                let diff = this.chart.max - this.chart.min;
                const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;
                const x = e.offsetX - GRID_PADDING_LEFT;
                const pos = x / width;

                const oldDiff = diff;
                const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
                diff *= amount;
                const move = oldDiff - diff;
                this.chart.max += move * (1 - pos);
                this.chart.min -= move * pos;

                this.setNewRange();
            });
            zr.on('mousemove', (e: MouseEvent) => {
                if (this.mouseDown) {
                    const moved = this.chart.lastX - (e.offsetX - GRID_PADDING_LEFT);
                    this.chart.lastX = e.offsetX - GRID_PADDING_LEFT;
                    const diff = this.chart.max - this.chart.min;
                    const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                    const shift = Math.round((moved * diff) / width);
                    this.chart.min += shift;
                    this.chart.max += shift;
                    this.setNewRange();
                }
            });

            zr.on('touchstart', (e: React.TouchEvent) => {
                e.preventDefault();
                this.mouseDown = true;
                // @ts-expect-error fix later
                const touches = e.touches || e.originalEvent.touches;
                if (touches) {
                    this.chart.lastX = touches[touches.length - 1].pageX;
                    if (touches.length > 1) {
                        this.chart.lastWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                    } else {
                        this.chart.lastWidth = null;
                    }
                }
            });
            zr.on('touchend', e => {
                e.preventDefault();
                this.mouseDown = false;
                this.setNewRange(true);
            });
            zr.on('touchmove', e => {
                e.preventDefault();
                const touches = e.touches || e.originalEvent.touches;
                if (!touches) {
                    return;
                }
                const pageX = touches[touches.length - 1].pageX - GRID_PADDING_LEFT;
                if (this.mouseDown) {
                    if (touches.length > 1) {
                        // zoom
                        const fingerWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                        if (this.chart.lastWidth !== null && fingerWidth !== this.chart.lastWidth) {
                            let diff = this.chart.max - this.chart.min;
                            const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                            const amount = fingerWidth > this.chart.lastWidth ? 1.1 : 0.9;
                            const positionX =
                                touches[0].pageX > touches[1].pageX
                                    ? touches[1].pageX - GRID_PADDING_LEFT + fingerWidth / 2
                                    : touches[0].pageX - GRID_PADDING_LEFT + fingerWidth / 2;

                            const pos = positionX / chartWidth;

                            const oldDiff = diff;
                            diff *= amount;
                            const move = oldDiff - diff;

                            this.chart.max += move * (1 - pos);
                            this.chart.min -= move * pos;

                            this.setNewRange();
                        }
                        this.chart.lastWidth = fingerWidth;
                    } else {
                        // swipe
                        const moved = this.chart.lastX - pageX;
                        const diff = this.chart.max - this.chart.min;
                        const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                        const shift = Math.round((moved * diff) / chartWidth);
                        this.chart.min += shift;
                        this.chart.max += shift;

                        this.setNewRange();
                    }
                }
                this.chart.lastX = pageX;
            });
        }
    }

    private renderChart(): JSX.Element {
        if (!this.state.historyInstance) {
            return (
                <div style={{ marginTop: 20, fontSize: 24, marginLeft: 24 }}>
                    {this.props.t('History instance not selected')}
                </div>
            );
        }
        if (!this.state.historyInstances?.find(it => it.id === this.state.historyInstance && it.alive)) {
            return (
                <div style={{ marginTop: 20, fontSize: 24, marginLeft: 24 }}>
                    {this.props.t('History instance not alive')}
                </div>
            );
        }
        if (this.chartValues) {
            return (
                <ReactEchartsCore
                    ref={e => (this.echartsReact = e)}
                    echarts={echarts}
                    option={this.getOption()}
                    notMerge
                    lazyUpdate
                    theme={this.props.themeType === 'dark' ? 'dark' : ''}
                    style={{ height: `${this.state.chartHeight}px`, width: '100%' }}
                    opts={{ renderer: 'svg' }}
                    onEvents={{ rendered: () => this.installEventHandlers() }}
                />
            );
        }

        return <LinearProgress />;
    }

    componentDidUpdate(): void {
        if (this.divRef.current) {
            const width = this.divRef.current.offsetWidth;
            const height = this.divRef.current.offsetHeight;
            if (this.state.chartHeight !== height) {
                // || this.state.chartHeight !== height) {
                if (this.updateTimer) {
                    clearTimeout(this.updateTimer);
                }
                this.updateTimer = setTimeout(() => {
                    this.updateTimer = null;
                    this.setState({ chartHeight: height, chartWidth: width });
                }, 100);
            }
        }
    }

    setStartDate(min: Date): void {
        const minNumber: number = min.getTime();
        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = null;
        }
        this.localStorage.setItem('App.relativeRange', 'absolute');
        this.localStorage.setItem('App.absoluteStart', minNumber.toString());
        this.localStorage.setItem('App.absoluteEnd', this.state.max.toString());

        this.chart.min = minNumber;

        this.setState({ min: minNumber, relativeRange: 'absolute' }, () =>
            this.updateChart(this.chart.min, this.chart.max, true),
        );
    }

    setEndDate(max: Date): void {
        const maxNumber: number = max.getTime();
        this.localStorage.setItem('App.relativeRange', 'absolute');
        this.localStorage.setItem('App.absoluteStart', this.state.min.toString());
        this.localStorage.setItem('App.absoluteEnd', maxNumber.toString());
        if (this.timeTimer) {
            clearTimeout(this.timeTimer);
            this.timeTimer = null;
        }
        this.chart.max = maxNumber;
        this.setState({ max: maxNumber, relativeRange: 'absolute' }, () =>
            this.updateChart(this.chart.min, this.chart.max, true),
        );
    }

    openEcharts(): void {
        const args = [
            `id=${window.encodeURIComponent(this.props.obj._id)}`,
            `instance=${window.encodeURIComponent(this.state.historyInstance)}`,
            'menuOpened=false',
        ];

        if (this.state.relativeRange === 'absolute') {
            args.push(`start=${this.chart.min}`);
            args.push(`end=${this.chart.max}`);
        } else {
            args.push(`range=${this.state.relativeRange}`);
        }

        window.open(
            `${window.location.protocol}//${window.location.host}/adapter/echarts/tab.html#${args.join('&')}`,
            'echarts',
        );
    }

    async onStepChanged(stepType: string): Promise<void> {
        // save in an object
        const obj = await this.props.socket.getObject(this.props.obj._id);
        if (
            obj.common.custom &&
            obj.common.custom[this.state.historyInstance] &&
            obj.common.custom[this.state.historyInstance].chartStep !== stepType
        ) {
            obj.common.custom[this.state.historyInstance].chartStep = stepType;
            await this.props.socket.setObject(obj._id, obj);
        }
        this.setState({ stepType, showStepMenu: null });
    }

    renderToolbar(): JSX.Element | null {
        if (this.props.noToolbar) {
            return null;
        }

        // Mobile detection using Material-UI md breakpoint (960px)
        const isSmallScreen = this.state.windowWidth < 960;

        return (
            <Toolbar>
                {!this.props.historyInstance && (
                    <FormControl
                        variant="standard"
                        style={styles.selectHistoryControl}
                    >
                        <InputLabel>{this.props.t('History instance')}</InputLabel>
                        <Select
                            variant="standard"
                            value={this.state.historyInstance}
                            onChange={(e): void => {
                                this.localStorage.setItem('App.historyInstance', e.target.value);
                                this.setState({ historyInstance: e.target.value });
                            }}
                        >
                            {this.state.historyInstances.map(it => (
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
                )}
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
                            value={new Date(this.state.min)}
                            onChange={date => this.setStartDate(date)}
                        />
                        <TimePicker
                            disabled={this.state.relativeRange !== 'absolute'}
                            sx={styles.toolbarTime}
                            ampm={this.state.ampm}
                            value={new Date(this.state.min)}
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
                            value={new Date(this.state.max)}
                            onChange={date => this.setEndDate(date)}
                        />
                        <TimePicker
                            disabled={this.state.relativeRange !== 'absolute'}
                            sx={styles.toolbarTime}
                            ampm={this.state.ampm}
                            value={new Date(this.state.max)}
                            onChange={date => this.setEndDate(date)}
                        />
                    </div>
                </LocalizationProvider>
                <div style={styles.grow} />
                <Button
                    style={{ marginRight: 10 }}
                    variant="outlined"
                    onClick={e => this.setState({ showStepMenu: e.target as HTMLElement })}
                >
                    {isSmallScreen ? (
                        this.state.stepType === '' ? (
                            <RemoveIcon />
                        ) : this.state.stepType === 'stepStart' ? (
                            <StepStartIcon />
                        ) : this.state.stepType === 'stepMiddle' ? (
                            <StepMiddleIcon />
                        ) : this.state.stepType === 'stepEnd' ? (
                            <StepEndIcon />
                        ) : (
                            this.props.t('Step type')
                        )
                    ) : this.state.stepType ? (
                        this.props.t(this.state.stepType)
                    ) : (
                        this.props.t('Step type')
                    )}
                </Button>
                {this.state.showStepMenu ? (
                    <Menu
                        open={!0}
                        anchorEl={this.state.showStepMenu}
                        onClose={() => this.setState({ showStepMenu: null })}
                    >
                        <MenuItem
                            selected={this.state.stepType === ''}
                            onClick={() => this.onStepChanged('')}
                        >
                            {isSmallScreen ? <RemoveIcon /> : this.props.t('None')}
                        </MenuItem>
                        <MenuItem
                            selected={this.state.stepType === 'stepStart'}
                            onClick={() => this.onStepChanged('stepStart')}
                        >
                            {isSmallScreen ? <StepStartIcon /> : this.props.t('stepStart')}
                        </MenuItem>
                        <MenuItem
                            selected={this.state.stepType === 'stepMiddle'}
                            onClick={() => this.onStepChanged('stepMiddle')}
                        >
                            {isSmallScreen ? <StepMiddleIcon /> : this.props.t('stepMiddle')}
                        </MenuItem>
                        <MenuItem
                            selected={this.state.stepType === 'stepEnd'}
                            onClick={() => this.onStepChanged('stepEnd')}
                        >
                            {isSmallScreen ? <StepEndIcon /> : this.props.t('stepEnd')}
                        </MenuItem>
                    </Menu>
                ) : null}
                {this.props.showJumpToEchart && this.state.echartsJump && (
                    <Fab
                        style={styles.echartsButton}
                        size="small"
                        onClick={() => this.openEcharts()}
                        title={this.props.t('Open charts in new window')}
                    >
                        <img
                            src={EchartsIcon}
                            alt="echarts"
                            style={styles.buttonIcon}
                        />
                    </Fab>
                )}
                <Fab
                    variant="extended"
                    size="small"
                    color={this.state.splitLine ? 'primary' : 'default'}
                    aria-label="show lines"
                    onClick={() => {
                        this.localStorage.setItem('App.splitLine', this.state.splitLine ? 'false' : 'true');
                        this.setState({ splitLine: !this.state.splitLine });
                    }}
                >
                    <SplitLineIcon style={styles.splitLineButtonIcon} />
                    {this.props.t('Show lines')}
                </Fab>
            </Toolbar>
        );
    }

    render(): JSX.Element {
        if (!this.state.historyInstances && !this.state.defaultHistory) {
            return <LinearProgress />;
        }

        return (
            <Paper style={styles.paper}>
                {this.renderToolbar()}
                <div
                    ref={this.divRef}
                    style={Utils.getStyle(
                        this.props.theme,
                        styles.chart,
                        this.props.noToolbar ? styles.chartWithoutToolbar : styles.chartWithToolbar,
                    )}
                >
                    {this.renderChart()}
                </div>
            </Paper>
        );
    }
}

export default withWidth()(ObjectChart);
