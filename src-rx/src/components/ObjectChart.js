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

import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';

import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/title';

import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/timeline';

import clsx from 'clsx';
import Utils from '@iobroker/adapter-react/Components/Utils';

function padding(ms) {
    if (ms < 10) {
        return '00' + ms;
    } else if (ms < 100) {
        return '0' + ms;
    } else {
        return ms;
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
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        overflow: 'hidden',
    },
    selectHistoryControl: {
        width: 200,
    },
    notAliveInstance: {
        opacity: 0.5,
    }
});

class ObjectChart extends React.Component {
    constructor(props) {
        super(props);
        let from = new Date();
        from.setHours(from.getHours() - 24 * 7);

        this.state = {
            loaded: false,
            start: from.getTime(),
            end: new Date().getTime(),
            chartValues: null,
            rangeValues: null,
            historyInstance: '',
            historyInstances: null,
            defaultHistory: '',
            chartHeight: 300,
            chartWidth: 500,
        };

        this.echartsReact = React.createRef();
        this.readTimeout = null;

        this.unit = this.props.obj.common && this.props.obj.common.unit ? ' ' + this.props.obj.common.unit : '';

        this.divRef = React.createRef();

        this.prepareData()
            .then(() => this.readHistoryRange())
            .then(() => this.readHistory(this.state.start, this.state.end))
            .then(chartValues => this.setState( { chartValues }));

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
            this.state.chartValues &&
            (!this.state.chartValues.length || this.state.chartValues[this.state.chartValues.length - 1].ts < state.ts)) {
            const chartValues = [...this.state.chartValues, {val: state.val, ts: state.ts}];
            const rangeValues = [...this.state.rangeValues, {val: state.val, ts: state.ts}];
            this.setState({ chartValues, rangeValues });
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
                this.setState( { rangeValues: values });
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
        return this.props.socket.getHistory(this.props.obj._id, {
            instance: this.defaultHistory,
            start,
            end,
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'none'
        })
            .then(values => {
                // merge range and chart
                let chart = [];
                let r = 0;
                let range = this.state.rangeValues;

                for (let t = 0; t < values.length; t++) {
                    while (range[r].ts < values[t].ts && r < range.length) {
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

                return chart;
            });
    }

    convertData(values) {
        values = values || this.state.chartValues;
        const data = [];
        for (let i = 0; i < values.length; i++) {
            data.push({
                value: [values[i].ts, values[i].val]
            });
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
                left: 80,
                top: 8,
                right: 25,
                bottom: 40,
            },
            tooltip: {
                trigger: 'axis',
                formatter: params => {
                    params = params[0];
                    const date = new Date(params.value[0]);
                    return `${date.toLocaleString()}.${padding(date.getMilliseconds())}: ${params.value[1]}${this.unit}`;
                },
                axisPointer: {
                    animation: true
                }
            },
            xAxis: [
                {
                    type: 'time',
                    splitLine: {
                        show: false
                    }
                }
            ],
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                splitLine: { show: false },
                axisLabel: {
                    formatter: '{value}' + this.unit
                }
            },
            toolbox: {
                left: 'right',
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                        title: this.props.t('Zoom'),
                    },
                    restore: {
                        title: this.props.t('Restore')
                    },
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
                    startValue: this.state.start,
                    endValue: this.state.end,
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
                    data: this.convertData(this.state.chartValues),
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

    renderChart() {
        if (this.state.chartValues) {
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
                    datazoom: e => {
                        const {startValue, endValue} = e.batch[0];
                        this.readTimeout && clearTimeout(this.readTimeout);
                        this.readTimeout = setTimeout(() => {
                            this.readTimeout = null;
                            this.readHistory(startValue, endValue)
                                .then(values => {
                                    this.echartsReact.getEchartsInstance().setOption({
                                        series: [
                                            {
                                                data: this.convertData(values)
                                            }
                                        ]
                                    });
                                });
                        }, 400);
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

    render() {
        if (!this.state.historyInstances) {
            return <LinearProgress/>;
        }

        return <Paper className={ this.props.classes.paper }>
            <Toolbar>
                <FormControl className={ this.props.classes.selectHistoryControl }>
                    <InputLabel>{ this.props.t('History instance') }</InputLabel>
                    <Select
                        value={ this.state.historyInstance}
                        onChange={ e => this.setState({ historyInstance: e.target.value })}
                    >
                        { this.state.historyInstances.map(it => <MenuItem key={ it.id } value={ it.id } className={ clsx(!it.alive && this.props.classes.notAliveInstance )}>{ it.id }</MenuItem>) }
                    </Select>
                </FormControl>
            </Toolbar>
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