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
import Fab from '@material-ui/core/Fab';


import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';

import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/title';

import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/timeline';
import 'zrender/lib/svg/svg';

import clsx from 'clsx';
import Utils from '@iobroker/adapter-react/Components/Utils';

// icons
import {FaChartLine as SplitLineIcon} from 'react-icons/all';

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
    chart: {
        width: '100%',
        height: 'calc(100% - ' + (theme.mixins.toolbar.minHeight + theme.spacing(1)) + 'px)',
        overflow: 'hidden',
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
    splitLineButtonIcon: {
        marginRight: theme.spacing(1),
    },
    splitLineButton: {
        float: 'right',
    },
    grow: {
        flexGrow: 1,
    },
});

const GRID_PADDING_LEFT = 80;
const GRID_PADDING_RIGHT = 25;

class ObjectChart extends React.Component {
    constructor(props) {
        super(props);
        let from = new Date();
        from.setHours(from.getHours() - 24 * 7);
        this.start = from.getTime();
        this.end   = new Date().getTime();

        let relativeRange = window.localStorage.getItem('App.relativeRange') || '30';

        this.state = {
            loaded: false,
            historyInstance: '',
            historyInstances: null,
            defaultHistory: '',
            chartHeight: 300,
            chartWidth: 500,
            relativeRange,
            splitLine: window.localStorage.getItem('App.splitLine') === 'true',
        };

        this.echartsReact = React.createRef();
        this.rangeRef = React.createRef();
        this.readTimeout = null;
        this.chartValues = null;
        this.rangeValues = null;

        this.unit = this.props.obj.common && this.props.obj.common.unit ? ' ' + this.props.obj.common.unit : '';

        this.divRef = React.createRef();

        this.chart = {};

        this.prepareData()
            .then(() => this.readHistoryRange())
            .then(() => this.setRelativeInterval(relativeRange, true, () => this.forceUpdate()));

        this.onChangeBound = this.onChange.bind(this);
        this.onResizeBound = this.onResize.bind(this);
    }

    componentDidMount() {
        this.props.socket.subscribeState(this.props.obj._id, this.onChangeBound);
        window.addEventListener('resize', this.onResizeBound)

    }

    componentWillUnmount() {
        this.readTimeout && clearTimeout(this.readTimeout);
        this.readTimeout = null;
        this.props.socket.unsubscribeState(this.props.obj._id, this.onChangeBound);
        window.removeEventListener('resize', this.onResizeBound);
    }

    onResize() {
        this.timerResize && clearTimeout(this.timerResize);
        this.timerResize = setTimeout(() => {
            this.timerResize = null;
            this.componentDidUpdate();
        });
    }

    onChange(id, state) {
        if (id === this.props.obj._id &&
            state &&
            this.rangeValues &&
            (!this.rangeValues.length || this.rangeValues[this.rangeValues.length - 1].ts < state.ts)) {

            this.chartValues && this.chartValues.push({val: state.val, ts: state.ts});
            this.rangeValues.push({val: state.val, ts: state.ts});

            // update only if end is near to now
            if (state.ts >= this.chart.min && state.ts <= this.chart.max + 300000) {
                this.updateChart();
            }
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

    readHistoryRange() {
        const now = new Date();
        const oldest = new Date(2000, 0, 1);

        this.props.socket.getHistory(this.props.obj._id, {
            instance: this.defaultHistory,
            start: oldest.getTime(),
            end: now.getTime(),
            step: 3600000, // hourly
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'minmax'
        })
            .then(values => {
                // remove interpolated first value
                if (values[0].val === null) {
                    values.shift();
                }
                this.rangeValues = values;
            });
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
        const options = {
            instance: this.defaultHistory,
            start,
            end,
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'none'
        };

        if (end - start > 60000 * 24) {
            options.aggregate = 'minmax';
            //options.step = 60000;
        }

        return this.props.socket.getHistory(this.props.obj._id, options)
            .then(values => {
                // merge range and chart
                let chart = [];
                let r = 0;
                let range = this.rangeValues;

                for (let t = 0; t < values.length; t++) {
                    while (r < range.length && range[r].ts < values[t].ts) {
                        chart.push(range[r]);
                        console.log('add ' + new Date(range[r].ts).toISOString() + ': ' + range[r].val);
                        r++;
                    }
                    // if range and details are not equal
                    if (!chart.length || chart[chart.length - 1].ts < values[t].ts) {
                        chart.push(values[t]);
                        console.log('add value ' + new Date(values[t].ts).toISOString() + ': ' + values[t].val)
                    } else if (chart[chart.length - 1].ts === values[t].ts && chart[chart.length - 1].val !== values[t].ts) {
                        console.error('Strange data!');
                    }
                }

                while (r < range.length) {
                    chart.push(range[r]);
                    console.log('add range ' + new Date(range[r].ts).toISOString() + ': ' + range[r].val);
                    r++;
                }

                this.chartValues = chart;

                return chart;
            });
    }

    convertData(values) {
        values = values || this.chartValues;
        const data = [];
        if (!values.length) {
            return data;
        }
        for (let i = 0; i < values.length; i++) {
            data.push({
                value: [values[i].ts, values[i].val]
            });
        }
        if (!this.chart.min) {
            this.chart.min = values[0].ts;
            this.chart.max = values[values.length - 1].ts;
        }

        return data;
    }

    getOption() {
        return {
            backgroundColor: 'transparent',
            title: {
                text: Utils.getObjectName(this.props.objects, this.props.obj._id, { language: this.props.lang }),
                padding: [
                    8,  // up
                    0,  // right
                    0,  // down
                    90, // left
                ]
            },
            grid: {
                left: GRID_PADDING_LEFT,
                top: 8,
                right: GRID_PADDING_RIGHT,
                bottom: 40,
            },
            tooltip: {
                trigger: 'axis',
                formatter: params => {
                    params = params[0];
                    const date = new Date(params.value[0]);
                    return `${date.toLocaleString()}.${padding3(date.getMilliseconds())}: ${params.value[1]}${this.unit}`;
                },
                axisPointer: {
                    animation: true
                }
            },
            xAxis: {
                type: 'time',
                splitLine: {
                    show: false
                },
                splitNumber: Math.round((this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT) / 50),
                min: this.chart.min,
                max: this.chart.max,
                axisTick: {
                    alignWithLabel: true,
                },
                axisLabel: {
                    formatter: (value, index) => {
                        const date = new Date(value);
                        if (this.chart.withSeconds) {
                            return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + ':' + padding2(date.getSeconds());
                        } else if (this.chart.withTime) {
                            return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + '\n' + padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1);
                        } else {
                            return padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1) + '\n' + date.getFullYear();
                        }
                    }
                }
            },
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                splitLine: {
                    show: !!this.state.splitLine
                },
                splitNumber: Math.round(this.state.chartHeight / 50),
                axisLabel: {
                    formatter: '{value}' + this.unit,
                },
                axisTick: {
                    alignWithLabel: true,
                }
            },
            toolbox: {
                left: 'right',
                feature: {
                    /*dataZoom: {
                        yAxisIndex: 'none',
                        title: this.props.t('Zoom'),
                    },
                    restore: {
                        title: this.props.t('Restore')
                    },*/
                    saveAsImage: {
                        title: this.props.t('Save as image'),
                        show: true,
                    }
                }
            },
            /*dataZoom: [
                {
                    show: true,
                    realtime: true,
                    startValue: this.start,
                    endValue: this.end,
                    y: this.state.chartHeight - 50,
                    dataBackground: {
                        lineStyle: {
                            color: '#FFFFFF'
                        },
                        areaStyle: {
                            color: '#FFFFFFE0'
                        }
                    },
                },
                {
                    show: true,
                    type: 'inside',
                    realtime: true,
                },
            ],*/
            series: [
                {
                    xAxisIndex: 0,
                    type: 'line',
                    showSymbol: false,
                    hoverAnimation: true,
                    animation: false,
                    data: this.convertData(),
                    lineStyle:{
                        color: '#4dabf5',
                    }
                }
            ]
        };
    }

    static getDerivedStateFromProps(props, state) {
        return null;
    }

    updateChart(start, end, withReadData, cb) {
        if (start) {
            this.start = start;
        }
        if (end) {
            this.end = end;
        }
        start = start || this.start;
        end   = end   || this.end;

        this.readTimeout && clearTimeout(this.readTimeout);

        this.readTimeout = setTimeout(() => {
            this.readTimeout = null;

            const diff = this.chart.max - this.chart.min;
            if (diff !== this.chart.diff) {
                this.chart.diff        = diff;
                this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
                this.chart.withSeconds = this.chart.diff < 60000 * 30;
            }

            if (withReadData) {
                this.readHistory(start, end)
                    .then(values => {
                        typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                            series: [{data: this.convertData(values)}],
                            xAxis: {
                                min: this.chart.min,
                                max: this.chart.max,
                            }
                        });
                        cb && cb();
                    });
            } else {
                typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                    series: [{data: this.convertData()}],
                    xAxis: {
                        min: this.chart.min,
                        max: this.chart.max,
                    }
                });
                cb && cb();
            }
        }, 400);
    }

    setNewRange(updateChart) {
        /*if (this.rangeRef.current &&
            this.rangeRef.current.childNodes[1] &&
            this.rangeRef.current.childNodes[1].value) {
            this.rangeRef.current.childNodes[0].innerHTML = '';
            this.rangeRef.current.childNodes[1].value = '';
        }*/
        this.chart.diff        = this.chart.max - this.chart.min;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        if (this.state.relativeRange !== 'absolute') {
            this.setState({ relativeRange: 'absolute' });
        } else {
            this.echartsReact.getEchartsInstance().setOption({
                xAxis: {
                    min: this.chart.min,
                    max: this.chart.max,
                }
            });

            updateChart && this.updateChart(this.chart.min, this.chart.max, true);
        }
    }

    setRelativeInterval(mins, dontSave, cb) {
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

        this.chart.max = now.getTime();

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            this.chart.min = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            this.chart.min = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            now.setMonth(0);
            this.chart.min = now.getTime();
        }  else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setFullYear(now.getFullYear() - 1);
            this.chart.min = now.getTime();
        } else {
            mins = parseInt(mins, 10);
            this.chart.min = this.chart.max - mins * 60000;
        }
        this.updateChart(this.chart.min, this.chart.max, true, cb);
    }

    installEventHandlers() {
        const zr = this.echartsReact.getEchartsInstance().getZr();
        if (!zr._iobInstalled) {
            zr._iobInstalled = true;
            zr.on('mousedown', e => {
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
                diff = diff * amount;
                const move = oldDiff - diff;
                this.chart.max += move * (1 - pos);
                this.chart.min -= move * pos;

                this.setNewRange();
            });
            zr.on('mousemove', e => {
                if (this.mouseDown) {
                    const moved = this.chart.lastX - (e.offsetX - GRID_PADDING_LEFT);
                    this.chart.lastX = e.offsetX - GRID_PADDING_LEFT;
                    const diff = this.chart.max - this.chart.min;
                    const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                    const shift = Math.round(moved * diff / width);
                    this.chart.min += shift;
                    this.chart.max += shift;
                    this.setNewRange();
                }
            });

            zr.on('touchstart', e => {
                e.preventDefault();
                this.mouseDown = true;
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

                            const amount     = fingerWidth > this.chart.lastWidth ? 1.1 : 0.9;
                            const positionX  = touches[0].pageX > touches[1].pageX ?
                                touches[1].pageX - GRID_PADDING_LEFT + fingerWidth / 2 :
                                touches[0].pageX - GRID_PADDING_LEFT + fingerWidth / 2;

                            const pos = positionX / chartWidth;

                            const oldDiff = diff;
                            diff = diff * amount;
                            const move = oldDiff - diff;

                            this.chart.max += move * (1 - pos);
                            this.chart.min -= move * pos;

                            this.setNewRange();
                        }
                        this.chart.lastWidth = fingerWidth;
                    } else {
                        // swipe
                        const moved = this.chart.lastX - pageX;
                        const diff  = this.chart.max - this.chart.min;
                        const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                        const shift = Math.round(moved * diff / chartWidth);
                        this.chart.min += shift;
                        this.chart.max += shift;

                        this.setNewRange();
                    }
                }
                this.chart.lastX = pageX;
            });
        }
    }

    renderChart() {
        if (this.chartValues) {
            return <ReactEchartsCore
                ref={e => this.echartsReact = e}
                echarts={ echarts }
                option={ this.getOption() }
                notMerge={ true }
                lazyUpdate={ true }
                theme={ this.props.themeName === 'dark' ? 'dark' : '' }
                style={{ height: this.state.chartHeight + 'px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                onEvents={ {
                    /*datazoom: e => {
                        const {startValue, endValue} = e.batch[0];
                        this.updateChart(startValue, endValue, true);
                    },*/
                    rendered: e => {
                        this.installEventHandlers();
                    }
                }}
            />;
        } else {
            return <LinearProgress/>;
        }
    }

    componentDidUpdate() {
        if (this.divRef.current) {
            const width = this.divRef.current.offsetWidth;
            const height = this.divRef.current.offsetHeight;
            if (this.state.chartHeight !== height) {// || this.state.chartHeight !== height) {
                setTimeout(() => this.setState({ chartHeight: height, chartWidth: width }), 100);
            }
        }
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
            <Fab
                variant="extended"
                size="small"
                color={ this.state.splitLine ? 'primary' : '' }
                aria-label="show lines"
                onClick={() => {
                    window.localStorage.setItem('App.splitLine', this.state.splitLine ? 'false' : 'true');
                    this.setState({splitLine: !this.state.splitLine});
                }}
                className={ this.props.classes.splitLineButton }
            >
                <SplitLineIcon className={ this.props.classes.splitLineButtonIcon } />
                { this.props.t('Show lines') }
            </Fab>
        </Toolbar>
    }

    render() {
        if (!this.state.historyInstances) {
            return <LinearProgress/>;
        }

        return <Paper className={ this.props.classes.paper }>
            { this.renderToolbar() }
            <div ref={ this.divRef } className={ this.props.classes.chart }>
                { this.renderChart() }
            </div>
        </Paper>;
    }
}

ObjectChart.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    socket: PropTypes.object,
    obj: PropTypes.object,
    customsInstances: PropTypes.array,
    themeName: PropTypes.string,
    objects: PropTypes.object,
};

export default withWidth()(withStyles(styles)(ObjectChart));