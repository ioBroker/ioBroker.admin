import React, { Component } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';

// Deliberately the ESM build: `echarts-for-react/lib/core` is CommonJS, and importing that subpath
// hands us the module object instead of the component ("Element type is invalid ... but got: object").
import ReactEchartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

import type { AdminConnection, IobTheme, ThemeType, Translate } from '@iobroker/gui-components';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer]);

/** Shown time range in milliseconds */
const RANGE_MS = 60 * 60 * 1000;
/** How often the chart is refreshed */
const REFRESH_MS = 30_000;

interface ResourcesChartProps {
    socket: AdminConnection;
    /** e.g. `system.host.MSI` */
    currentHost: string;
    theme: IobTheme;
    themeType: ThemeType;
    t: Translate;
    /**
     * Called with `false` when there is no history instance at all or it is not running. In that
     * case nothing is rendered and the parent should drop the whole card - an empty card with a
     * heading is worse than no card.
     */
    onAvailabilityChange?: (available: boolean) => void;
}

/** What keeps the chart from showing data, if anything */
type Blocker =
    /** `system.config.common.defaultHistory` is empty */
    | 'noDefaultHistory'
    /** the configured history instance is not running */
    | 'historyNotAlive'
    /** the history instance runs, but does not record cpu/mem of this host */
    | 'notRecorded'
    | null;

interface ResourcesChartState {
    /** e.g. `history.0` */
    historyInstance: string;
    blocker: Blocker;
    loading: boolean;
    enabling: boolean;
    cpu: [number, number][];
    mem: [number, number][];
    /** Total RAM in GB, used to scale the memory axis */
    error: string;
}

/**
 * CPU and RAM of one host over the last hour.
 *
 * The values are read from the default history instance (`system.config.common.defaultHistory`).
 * If that instance does not record them yet, the user is offered to switch the recording on instead
 * of just being shown an empty chart.
 */
export default class ResourcesChart extends Component<ResourcesChartProps, ResourcesChartState> {
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(props: ResourcesChartProps) {
        super(props);
        this.state = {
            historyInstance: '',
            blocker: null,
            loading: true,
            enabling: false,
            cpu: [],
            mem: [],
            error: '',
        };
    }

    componentDidMount(): void {
        void this.detectAndLoad();
        this.refreshTimer = setInterval(() => {
            if (this.state.blocker) {
                // the history instance may have been started meanwhile - check again, otherwise the
                // card would stay hidden until the tab is opened anew
                void this.detectAndLoad();
            } else {
                void this.readData();
            }
        }, REFRESH_MS);
    }

    componentDidUpdate(prevProps: ResourcesChartProps): void {
        if (prevProps.currentHost !== this.props.currentHost) {
            this.setState({ loading: true, cpu: [], mem: [] }, () => void this.detectAndLoad());
        }
    }

    componentWillUnmount(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /** IDs of the two states shown in the chart */
    getIds(): { cpu: string; mem: string } {
        return { cpu: `${this.props.currentHost}.cpu`, mem: `${this.props.currentHost}.mem` };
    }

    /**
     * Find the default history instance, check that it runs and that it records cpu/mem of this
     * host, then read the data.
     */
    async detectAndLoad(): Promise<void> {
        try {
            const config = await this.props.socket.getCompactSystemConfig();
            const historyInstance = config?.common?.defaultHistory || '';

            if (!historyInstance) {
                this.setState({ historyInstance: '', blocker: 'noDefaultHistory', loading: false });
                this.props.onAvailabilityChange?.(false);
                return;
            }

            const alive = await this.props.socket.getState(`system.adapter.${historyInstance}.alive`);
            if (!alive?.val) {
                this.setState({ historyInstance, blocker: 'historyNotAlive', loading: false });
                this.props.onAvailabilityChange?.(false);
                return;
            }

            this.props.onAvailabilityChange?.(true);

            const ids = this.getIds();
            const [cpuObj, memObj] = await Promise.all([
                this.props.socket.getObject(ids.cpu),
                this.props.socket.getObject(ids.mem),
            ]);

            const recorded =
                !!(cpuObj?.common?.custom as Record<string, { enabled?: boolean }>)?.[historyInstance]?.enabled &&
                !!(memObj?.common?.custom as Record<string, { enabled?: boolean }>)?.[historyInstance]?.enabled;

            if (!recorded) {
                this.setState({ historyInstance, blocker: 'notRecorded', loading: false });
                return;
            }

            this.setState({ historyInstance, blocker: null }, () => void this.readData());
        } catch (e) {
            this.setState({ error: (e as Error).toString(), loading: false });
        }
    }

    /** Switch on recording of cpu and mem for the default history instance */
    async enableRecording(): Promise<void> {
        this.setState({ enabling: true });
        try {
            const ids = this.getIds();
            for (const id of [ids.cpu, ids.mem]) {
                const obj = await this.props.socket.getObject(id);
                if (!obj) {
                    continue;
                }
                obj.common.custom ||= {};
                (obj.common.custom as Record<string, unknown>)[this.state.historyInstance] = {
                    ...((obj.common.custom as Record<string, Record<string, unknown>>)[this.state.historyInstance] ||
                        {}),
                    enabled: true,
                };
                await this.props.socket.setObject(id, obj);
            }
            this.setState({ enabling: false, loading: true }, () => void this.detectAndLoad());
        } catch (e) {
            this.setState({ enabling: false, error: (e as Error).toString() });
        }
    }

    async readData(): Promise<void> {
        const ids = this.getIds();
        const end = Date.now();
        const start = end - RANGE_MS;
        const options: ioBroker.GetHistoryOptions = {
            instance: this.state.historyInstance,
            start,
            end,
            step: 60_000,
            aggregate: 'average',
            from: false,
            ack: false,
            q: false,
            addId: false,
        };

        try {
            const [cpuRaw, memRaw] = await Promise.all([
                this.props.socket.getHistory(ids.cpu, options),
                this.props.socket.getHistory(ids.mem, options),
            ]);

            const toSeries = (values: ioBroker.GetHistoryResult): [number, number][] =>
                (values || [])
                    .filter(v => v.val !== null && v.val !== undefined)
                    .map(v => [v.ts, Math.round(Number(v.val) * 100) / 100]);

            this.setState({ cpu: toSeries(cpuRaw), mem: toSeries(memRaw), loading: false });
        } catch (e) {
            this.setState({ error: (e as Error).toString(), loading: false });
        }
    }

    /**
     * Only the `notRecorded` case is rendered: there the user can do something about it. A missing
     * or stopped history instance produces no card at all.
     */
    renderBlocker(): React.JSX.Element {
        const { t } = this.props;

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
                    {t('CPU and RAM of this host are not recorded by %s yet', this.state.historyInstance)}
                </Typography>
                {this.state.blocker === 'notRecorded' ? (
                    <Button
                        variant="contained"
                        disabled={this.state.enabling}
                        startIcon={this.state.enabling ? <CircularProgress size={16} /> : null}
                        onClick={() => void this.enableRecording()}
                    >
                        {t('Record CPU and RAM')}
                    </Button>
                ) : null}
            </Box>
        );
    }

    renderChart(): React.JSX.Element {
        const { theme, themeType, t } = this.props;
        const axis = themeType === 'dark' ? '#96A2B4' : '#5C6675';

        const option = {
            backgroundColor: 'transparent',
            grid: { left: 45, right: 45, top: 40, bottom: 30 },
            tooltip: { trigger: 'axis' },
            legend: {
                data: [t('CPU (%)'), t('Memory (%)')],
                textStyle: { color: axis },
                top: 0,
            },
            xAxis: {
                type: 'time',
                axisLabel: { color: axis },
                axisLine: { lineStyle: { color: axis } },
                splitLine: { show: false },
            },
            yAxis: [
                {
                    type: 'value',
                    name: '%',
                    min: 0,
                    max: 100,
                    nameTextStyle: { color: axis },
                    axisLabel: { color: axis },
                    splitLine: { lineStyle: { color: theme.palette.divider } },
                },
            ],
            series: [
                {
                    name: t('CPU (%)'),
                    type: 'line',
                    showSymbol: false,
                    smooth: true,
                    lineStyle: { width: 2, color: theme.palette.primary.main },
                    itemStyle: { color: theme.palette.primary.main },
                    data: this.state.cpu,
                },
                {
                    name: t('Memory (%)'),
                    type: 'line',
                    showSymbol: false,
                    smooth: true,
                    lineStyle: { width: 2, color: theme.palette.secondary.main },
                    itemStyle: { color: theme.palette.secondary.main },
                    data: this.state.mem,
                },
            ],
        };

        return (
            <ReactEchartsCore
                echarts={echarts}
                option={option}
                style={{ height: 260, width: '100%' }}
                opts={{ renderer: 'svg' }}
                notMerge
            />
        );
    }

    render(): React.JSX.Element | null {
        // no history instance or it is not running - the parent removes the card, see `onAvailabilityChange`
        if (this.state.blocker === 'noDefaultHistory' || this.state.blocker === 'historyNotAlive') {
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
        if (!this.state.cpu.length && !this.state.mem.length) {
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
