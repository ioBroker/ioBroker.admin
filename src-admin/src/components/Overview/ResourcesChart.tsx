import React, { Component } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Settings as SettingsIcon, Timeline as TimelineIcon } from '@mui/icons-material';

// Deliberately the ESM build: `echarts-for-react/lib/core` is CommonJS, and importing that subpath
// hands us the module object instead of the component ("Element type is invalid ... but got: object").
import ReactEchartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

import { Utils, type AdminConnection, type IobTheme, type ThemeType, type Translate } from '@iobroker/gui-components';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer]);

/** Shown time range in milliseconds */
const RANGE_MS = 60 * 60 * 1000;
/** How often the chart is refreshed */
const REFRESH_MS = 30_000;
/** Where the data points of the chart are remembered - one entry per host */
const SERIES_KEY = 'App.overviewChartSeries';
/** Room taken by every additional y-axis on the same side */
const AXIS_OFFSET = 50;

/**
 * Colors of the lines without an own color, by position. The first two are replaced by the primary
 * and the secondary color of the theme, so CPU and RAM look as they always did.
 */
export const SERIES_PALETTE = [
    '',
    '',
    '#4caf50',
    '#ff9800',
    '#e91e63',
    '#00bcd4',
    '#9c27b0',
    '#795548',
    '#607d8b',
    '#cddc39',
];

/** One line in the chart, as the user configured it */
export interface ChartSeriesConfig {
    /** ID of the state, e.g. `system.host.MSI.cpu` */
    id: string;
    /** Name in the legend - empty: the name of the object */
    name?: string;
    /** Color of the line - empty: from `SERIES_PALETTE` by position */
    color?: string;
    /**
     * History instance the values are read from, e.g. `influxdb.0`. Empty: the default history
     * instance if it records the state, otherwise the first running history instance that does.
     */
    instance?: string;
}

/** CPU and RAM of the host - what the chart shows as long as nothing else was configured */
export function getDefaultSeries(host: string): ChartSeriesConfig[] {
    return [{ id: `${host}.cpu` }, { id: `${host}.mem` }];
}

/**
 * Data points configured for the chart of this host
 *
 * @param host e.g. `system.host.MSI`
 * @returns `null` if the default (CPU and RAM) is used
 */
export function loadSeries(host: string): ChartSeriesConfig[] | null {
    try {
        const text = (window._localStorage || window.localStorage).getItem(`${SERIES_KEY}.${host}`);
        const series = text ? JSON.parse(text) : null;
        return Array.isArray(series) ? (series as ChartSeriesConfig[]).filter(s => s?.id) : null;
    } catch {
        return null;
    }
}

/**
 * Remember the data points of the chart of this host
 *
 * @param host e.g. `system.host.MSI`
 * @param series `null` to go back to the default (CPU and RAM)
 */
export function saveSeries(host: string, series: ChartSeriesConfig[] | null): void {
    const storage = window._localStorage || window.localStorage;
    if (series) {
        storage.setItem(`${SERIES_KEY}.${host}`, JSON.stringify(series));
    } else {
        storage.removeItem(`${SERIES_KEY}.${host}`);
    }
}

/**
 * Running instances that can deliver history data (`common.getHistory`), e.g. `history.0`,
 * `influxdb.0` or `sql.0`. Shared with the settings dialog, which offers them for selection.
 */
export async function getHistoryInstances(socket: AdminConnection): Promise<{ id: string; alive: boolean }[]> {
    const [instances, alive] = await Promise.all([
        socket.getAdapterInstances(),
        socket.getForeignStates('system.adapter.*.alive').catch((): Record<string, ioBroker.State> => ({})),
    ]);

    return (instances || [])
        .filter(obj => obj?.common?.getHistory)
        .map(obj => ({
            id: obj._id.replace('system.adapter.', ''),
            alive: !!alive[`${obj._id}.alive`]?.val,
        }));
}

interface ResourcesChartProps {
    socket: AdminConnection;
    /** e.g. `system.host.MSI` */
    currentHost: string;
    /** Data points to show - `null` for CPU and RAM of the host */
    series: ChartSeriesConfig[] | null;
    theme: IobTheme;
    themeType: ThemeType;
    lang: ioBroker.Languages;
    t: Translate;
    /**
     * Called with `false` when no history instance runs at all. In that case nothing is rendered
     * and the parent should drop the whole card - an empty card with a heading is worse than no card.
     */
    onAvailabilityChange?: (available: boolean) => void;
    /**
     * Called whenever it is known whether CPU and RAM of this host are recorded by the default history
     * instance. Only then the parent offers to stop the recording: data points chosen in the
     * settings were set up elsewhere and are not switched off from here.
     */
    onRecordingChange?: (recording: boolean) => void;
    /** Opens the dialog where the data points are chosen */
    onOpenSettings?: () => void;
    /**
     * While true, nothing is read and nothing is checked. The parent sets it when the card is
     * minimized: reading a history nobody looks at is what this card is meant to save.
     */
    paused?: boolean;
}

/** What keeps the chart from showing data, if anything */
type Blocker =
    /** no history instance is running */
    | 'noHistory'
    /** none of the data points is recorded by a running history instance */
    | 'notRecorded'
    | null;

/** One line of the chart, with everything found out about it */
interface ResolvedSeries {
    id: string;
    /** Name in the legend, including the unit */
    name: string;
    color: string;
    unit: string;
    /** History instance the values come from - empty if no running instance records the state */
    instance: string;
    data: [number, number][];
}

interface ResourcesChartState {
    /** Default history instance (`system.config.common.defaultHistory`), e.g. `history.0` */
    historyInstance: string;
    /** Whether the default history instance runs - only then recording can be switched on */
    historyAlive: boolean;
    blocker: Blocker;
    loading: boolean;
    enabling: boolean;
    series: ResolvedSeries[];
    error: string;
}

/**
 * Values of one host over the last hour - by default CPU and RAM, or the data points the user chose.
 *
 * Every data point is read from the history instance that records it: the default history instance
 * (`system.config.common.defaultHistory`) if it does, otherwise any other running one, like InfluxDB
 * or SQL. If CPU and RAM are not recorded yet, the user is offered to switch the recording on
 * instead of just being shown an empty chart.
 */
export default class ResourcesChart extends Component<ResourcesChartProps, ResourcesChartState> {
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(props: ResourcesChartProps) {
        super(props);
        this.state = {
            historyInstance: '',
            historyAlive: false,
            blocker: null,
            loading: true,
            enabling: false,
            series: [],
            error: '',
        };
    }

    componentDidMount(): void {
        if (!this.props.paused) {
            void this.detectAndLoad();
            this.startTimer();
        }
    }

    componentDidUpdate(prevProps: ResourcesChartProps): void {
        if (prevProps.currentHost !== this.props.currentHost || prevProps.series !== this.props.series) {
            this.setState({ loading: true, series: [], error: '' }, () => {
                if (!this.props.paused) {
                    void this.detectAndLoad();
                }
            });
        }

        if (prevProps.paused !== this.props.paused) {
            if (this.props.paused) {
                this.stopTimer();
            } else {
                // Recording could have been switched on or off elsewhere while this was paused
                void this.detectAndLoad();
                this.startTimer();
            }
        }
    }

    componentWillUnmount(): void {
        this.stopTimer();
    }

    startTimer(): void {
        this.stopTimer();
        this.refreshTimer = setInterval(() => {
            if (this.state.blocker) {
                // a history instance may have been started meanwhile - check again, otherwise the
                // card would stay hidden until the tab is opened anew
                void this.detectAndLoad();
            } else {
                void this.readData();
            }
        }, REFRESH_MS);
    }

    stopTimer(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /** Data points shown in the chart */
    getConfig(): ChartSeriesConfig[] {
        return this.props.series || getDefaultSeries(this.props.currentHost);
    }

    /** Name in the legend if the user gave none */
    getDefaultName(id: string, obj: ioBroker.Object | null | undefined): string {
        // the translated names CPU and RAM always had
        if (id === `${this.props.currentHost}.cpu`) {
            return this.props.t('CPU (%)');
        }
        if (id === `${this.props.currentHost}.mem`) {
            return this.props.t('Memory (%)');
        }
        const name = obj ? Utils.getObjectNameFromObj(obj, this.props.lang) : '';
        const unit = (obj?.common as ioBroker.StateCommon | undefined)?.unit;
        return `${name || id}${unit ? ` (${unit})` : ''}`;
    }

    /**
     * Find out which history instance records which data point, then read the data.
     */
    async detectAndLoad(): Promise<void> {
        try {
            const { socket, theme } = this.props;
            const [systemConfig, instances] = await Promise.all([
                socket.getCompactSystemConfig(),
                getHistoryInstances(socket),
            ]);
            const historyInstance = systemConfig?.common?.defaultHistory || '';
            const running = instances.filter(i => i.alive).map(i => i.id);
            const historyAlive = !!historyInstance && running.includes(historyInstance);

            if (!running.length) {
                this.setState({ historyInstance, historyAlive, blocker: 'noHistory', loading: false });
                this.props.onAvailabilityChange?.(false);
                return;
            }

            this.props.onAvailabilityChange?.(true);

            const config = this.getConfig();
            const objects = await Promise.all(config.map(s => socket.getObject(s.id).catch((): null => null)));

            const series: ResolvedSeries[] = config.map((s, i) => {
                const obj = objects[i];
                const custom = (obj?.common?.custom || {}) as Record<string, { enabled?: boolean } | null>;
                const recordedBy = Object.keys(custom).filter(
                    instance => custom[instance]?.enabled && running.includes(instance),
                );
                let instance: string;
                if (s.instance) {
                    // chosen by the user - may still hold older values even if it records no more
                    instance = running.includes(s.instance) ? s.instance : '';
                } else {
                    instance = recordedBy.includes(historyInstance) ? historyInstance : recordedBy[0] || '';
                }

                return {
                    id: s.id,
                    name: s.name || this.getDefaultName(s.id, obj),
                    color:
                        s.color ||
                        (i === 0 ? theme.palette.primary.main : i === 1 ? theme.palette.secondary.main : '') ||
                        SERIES_PALETTE[i % SERIES_PALETTE.length] ||
                        SERIES_PALETTE[2],
                    unit: (obj?.common as ioBroker.StateCommon | undefined)?.unit || '',
                    instance,
                    data: [],
                };
            });

            // Only CPU and RAM recorded by the default history instance may be switched off from
            // the overview - that is the recording this card switched on
            this.props.onRecordingChange?.(
                !this.props.series &&
                    historyAlive &&
                    series.every(s => s.instance === historyInstance) &&
                    series.every((_s, i) => {
                        const custom = objects[i]?.common?.custom as Record<string, { enabled?: boolean }> | undefined;
                        return !!custom?.[historyInstance]?.enabled;
                    }),
            );

            if (!series.some(s => s.instance)) {
                this.setState({ historyInstance, historyAlive, series, blocker: 'notRecorded', loading: false });
                return;
            }

            this.setState(
                { historyInstance, historyAlive, series, blocker: null, error: '' },
                () => void this.readData(),
            );
        } catch (e) {
            this.setState({ error: (e as Error).toString(), loading: false });
        }
    }

    /**
     * Switch on recording by the default history instance for all data points that nobody records
     */
    async enableRecording(): Promise<void> {
        return this.setRecording(
            true,
            this.state.series.filter(s => !s.instance).map(s => s.id),
        );
    }

    /**
     * Switch off recording of cpu and mem, so the history instance stops writing them.
     *
     * The other settings of the custom entry are kept, so switching the recording on again gives
     * back the same configuration.
     */
    // called by the Overview through a ref, which the rule cannot see
    // eslint-disable-next-line react/no-unused-class-component-methods
    async stopRecording(): Promise<void> {
        // never for data points the user chose: they were set up elsewhere, see `onRecordingChange`
        if (this.props.series) {
            return;
        }
        return this.setRecording(
            false,
            getDefaultSeries(this.props.currentHost).map(s => s.id),
        );
    }

    /**
     * Switch recording by the default history instance on or off
     *
     * @param enabled whether the history instance should record the states
     * @param ids states to change
     */
    async setRecording(enabled: boolean, ids: string[]): Promise<void> {
        this.setState({ enabling: true });
        try {
            for (const id of ids) {
                const obj = await this.props.socket.getObject(id);
                if (!obj) {
                    continue;
                }
                obj.common.custom ||= {};
                (obj.common.custom as Record<string, unknown>)[this.state.historyInstance] = {
                    ...((obj.common.custom as Record<string, Record<string, unknown>>)[this.state.historyInstance] ||
                        {}),
                    enabled,
                };
                await this.props.socket.setObject(id, obj);
            }
            this.setState({ enabling: false, loading: true }, () => void this.detectAndLoad());
        } catch (e) {
            this.setState({ enabling: false, error: (e as Error).toString() });
        }
    }

    async readData(): Promise<void> {
        const end = Date.now();
        const start = end - RANGE_MS;

        const toSeries = (values: ioBroker.GetHistoryResult): [number, number][] =>
            (values || [])
                .filter(v => v.val !== null && v.val !== undefined)
                .map(v => [v.ts, Math.round(Number(v.val) * 100) / 100]);

        const requested = this.state.series;
        const data = await Promise.all(
            requested.map(async (s): Promise<[number, number][]> => {
                if (!s.instance) {
                    return [];
                }
                try {
                    const values = await this.props.socket.getHistory(s.id, {
                        instance: s.instance,
                        start,
                        end,
                        step: 60_000,
                        aggregate: 'average',
                        from: false,
                        ack: false,
                        q: false,
                        addId: false,
                    });
                    return toSeries(values);
                } catch (e) {
                    // one data point that cannot be read must not take the others with it
                    console.warn(`Cannot read the history of ${s.id} from ${s.instance}: ${(e as Error).message}`);
                    return [];
                }
            }),
        );

        this.setState(state =>
            // the data points may have been changed while the history was read - then a new read is under way
            state.series === requested
                ? { series: state.series.map((s, i) => ({ ...s, data: data[i] })), loading: false }
                : null,
        );
    }

    /** Hint and buttons shown instead of the chart when nothing is recorded */
    renderBlocker(): React.JSX.Element {
        const { t } = this.props;
        let text: string;
        if (this.props.series) {
            text = t('None of the selected data points is recorded');
        } else if (this.state.historyAlive) {
            text = t('CPU and RAM of this host are not recorded by %s yet', this.state.historyInstance);
        } else {
            text = t('CPU and RAM of this host are not recorded');
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    height: 260,
                    color: 'text.secondary',
                    textAlign: 'center',
                    px: 2,
                }}
            >
                <TimelineIcon sx={{ fontSize: 40, opacity: 0.4 }} />
                <Typography variant="body2">{text}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {this.state.historyAlive ? (
                        <Button
                            variant="contained"
                            disabled={this.state.enabling}
                            startIcon={this.state.enabling ? <CircularProgress size={16} /> : null}
                            onClick={() => void this.enableRecording()}
                        >
                            {this.props.series
                                ? t('Record with %s', this.state.historyInstance)
                                : t('Record CPU and RAM')}
                        </Button>
                    ) : null}
                    {this.props.onOpenSettings ? (
                        <Button
                            variant="outlined"
                            color="grey"
                            startIcon={<SettingsIcon />}
                            onClick={() => this.props.onOpenSettings?.()}
                        >
                            {t('Select data points')}
                        </Button>
                    ) : null}
                </Box>
            </Box>
        );
    }

    renderChart(): React.JSX.Element {
        const { theme, themeType, t } = this.props;
        const axis = themeType === 'dark' ? '#96A2B4' : '#5C6675';
        const shown = this.state.series.filter(s => s.instance);

        // one y-axis per unit: alternately left and right, further ones moved outwards
        const units: string[] = [];
        shown.forEach(s => !units.includes(s.unit) && units.push(s.unit));
        const leftAxes = Math.ceil(units.length / 2);
        const rightAxes = Math.floor(units.length / 2);

        const yAxis = units.map((unit, i) => ({
            type: 'value',
            name: unit,
            position: i % 2 ? 'right' : 'left',
            offset: Math.floor(i / 2) * AXIS_OFFSET,
            // percent always from 0 to 100, everything else as the values need it
            ...(unit === '%' ? { min: 0, max: 100 } : { scale: true }),
            nameTextStyle: { color: axis },
            axisLabel: { color: axis },
            axisLine: { show: units.length > 1, lineStyle: { color: axis } },
            splitLine: i ? { show: false } : { lineStyle: { color: theme.palette.divider } },
        }));

        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: 45 + Math.max(0, leftAxes - 1) * AXIS_OFFSET,
                right: 45 + Math.max(0, rightAxes - 1) * AXIS_OFFSET,
                top: 40,
                bottom: 30,
            },
            tooltip: { trigger: 'axis' },
            legend: {
                data: shown.map(s => s.name),
                textStyle: { color: axis },
                top: 0,
                type: 'scroll',
            },
            xAxis: {
                type: 'time',
                axisLabel: { color: axis },
                axisLine: { lineStyle: { color: axis } },
                splitLine: { show: false },
            },
            yAxis,
            series: shown.map(s => ({
                name: s.name,
                type: 'line',
                yAxisIndex: units.indexOf(s.unit),
                showSymbol: false,
                smooth: true,
                lineStyle: { width: 2, color: s.color },
                itemStyle: { color: s.color },
                data: s.data,
            })),
        };

        const notRecorded = this.state.series.filter(s => !s.instance);

        return (
            <>
                <ReactEchartsCore
                    echarts={echarts}
                    option={option}
                    style={{ height: 260, width: '100%' }}
                    opts={{ renderer: 'svg' }}
                    notMerge
                />
                {notRecorded.length ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ textAlign: 'center' }}
                    >
                        {t('Not recorded: %s', notRecorded.map(s => s.name).join(', '))}
                    </Typography>
                ) : null}
            </>
        );
    }

    render(): React.JSX.Element | null {
        // no history instance runs - the parent removes the card, see `onAvailabilityChange`
        if (this.state.blocker === 'noHistory') {
            return null;
        }
        if (this.state.error) {
            return (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                        variant="body2"
                        color="error"
                    >
                        {this.state.error}
                    </Typography>
                </Box>
            );
        }
        if (this.state.loading) {
            return (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (this.state.blocker) {
            return this.renderBlocker();
        }
        // Recording may have been switched on just now - then the history is still empty and an
        // axis without a single line would look broken.
        if (!this.state.series.some(s => s.data.length)) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        height: 260,
                        color: 'text.secondary',
                        textAlign: 'center',
                        px: 2,
                    }}
                >
                    <TimelineIcon sx={{ fontSize: 40, opacity: 0.4 }} />
                    <Typography variant="body2">
                        {this.props.t('Recording is active, but there is no data for the last hour yet')}
                    </Typography>
                </Box>
            );
        }
        return this.renderChart();
    }
}
