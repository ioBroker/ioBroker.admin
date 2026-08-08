import React, { Component } from 'react';

import { alpha, Box, Card, Chip, LinearProgress, Typography } from '@mui/material';
import { Extension as AdapterIcon, Memory as StatusIcon, Storage as ObjectsIcon } from '@mui/icons-material';

import { IconInstance } from '@/icons/IconInstance';

import {
    CardTitle,
    Icon,
    InfoRow,
    StatCard,
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
} from '@iobroker/gui-components';

import type { InstancesWorker } from '@/Workers/InstancesWorker';
import type { ObjectsWorker } from '@/Workers/ObjectsWorker';
import type { HostsWorker } from '@/Workers/HostsWorker';
import type { LogsWorker, LogLineSaved } from '@/Workers/LogsWorker';
import AdminUtils from '@/helpers/AdminUtils';

import ResourcesChart from '@/components/Overview/ResourcesChart';

/** How often the counters are refreshed */
const REFRESH_MS = 30_000;
/** Number of log lines shown in the log card */
const LOG_LINES = 6;
/** Number of adapters shown in the adapters card */
const ADAPTER_LINES = 5;
/** Shown instead of a number while the value is still unknown - a "0" would be a wrong statement */
const PENDING = '--';

interface OverviewProps {
    socket: AdminConnection;
    t: Translate;
    lang: ioBroker.Languages;
    theme: IobTheme;
    themeType: ThemeType;
    /** e.g. `system.host.MSI` */
    currentHost: string;
    currentHostName: string;
    hostsWorker: HostsWorker;
    instancesWorker: InstancesWorker;
    objectsWorker: ObjectsWorker;
    logsWorker: LogsWorker;
    expertMode: boolean;
    /** Installed adapters with their versions - together with `repository` this gives the update count */
    installed: Record<string, { version: string; ignoreVersion?: string }>;
    /** Versions offered by the repository */
    repository: Record<string, { version: string }>;
    handleNavigation: (tab: string) => void;
    /** Host selector, built by the app - sits at the right end of the header on every host tab */
    hostSelector?: React.JSX.Element | null;
    /** Keep the upper left corner of the toolbar free for the floating menu button */
    menuButtonSpace?: boolean;
}

interface AdapterEntry {
    name: string;
    version: string;
    instances: number;
    /** e.g. `adapter/history/history.png` - empty if the instance object has no icon */
    icon: string;
}

interface OverviewState {
    /** False until the first read finished - the counters must not show 0 or "offline" before that */
    loaded: boolean;
    /** Objects are counted separately, they take considerably longer */
    objectsLoaded: boolean;
    hostAlive: boolean;
    adaptersTotal: number;
    adaptersActive: number;
    instancesTotal: number;
    instancesAlive: number;
    objectsCount: number;
    statesCount: number;
    hostInfo: Record<string, any> | null;
    adapters: AdapterEntry[];
    logs: LogLineSaved[];
    /** Current CPU load of the host in percent */
    cpu: number | null;
    /** Current RAM usage of the host in percent */
    mem: number | null;
    /** False when no history instance exists or it is not running - then the chart card is hidden */
    chartAvailable: boolean;
}

/**
 * Dashboard of one host: status tiles, system information, CPU/RAM history, running adapters and
 * the tail of the system log. The host is chosen with the host selector in the app bar.
 */
export default class Overview extends Component<OverviewProps, OverviewState> {
    private refreshTimer: ReturnType<typeof setInterval> | null = null;
    private mounted = false;
    /** Host the live states are currently subscribed for */
    private subscribedHost = '';

    constructor(props: OverviewProps) {
        super(props);
        this.state = {
            loaded: false,
            objectsLoaded: false,
            hostAlive: false,
            adaptersTotal: 0,
            adaptersActive: 0,
            instancesTotal: 0,
            instancesAlive: 0,
            objectsCount: 0,
            statesCount: 0,
            hostInfo: null,
            adapters: [],
            logs: [],
            cpu: null,
            mem: null,
            // assumed available until the chart reports otherwise, so it does not flicker in
            chartAvailable: true,
        };
    }

    componentDidMount(): void {
        this.mounted = true;
        void this.readAll();
        void this.readObjects();
        this.subscribeHost();
        this.refreshTimer = setInterval(() => void this.readAll(), REFRESH_MS);
        this.props.logsWorker.registerHandler(this.onLogs);
    }

    /**
     * Objects are system wide and expensive to transfer, so they are counted once instead of on
     * every refresh. The worker only fetches them when `true` is passed.
     */
    async readObjects(): Promise<void> {
        const objects = (await this.props.objectsWorker.getObjects(true)) || {};
        if (!this.mounted) {
            return;
        }
        let statesCount = 0;
        for (const id of Object.keys(objects)) {
            if (objects[id]?.type === 'state') {
                statesCount++;
            }
        }
        this.setState({ objectsCount: Object.keys(objects).length, statesCount, objectsLoaded: true });
    }

    componentDidUpdate(prevProps: OverviewProps): void {
        if (prevProps.currentHost !== this.props.currentHost) {
            // the new host is unknown until it was read - do not keep showing the old numbers
            this.setState({ loaded: false, cpu: null, mem: null, hostInfo: null });
            this.subscribeHost();
            void this.readAll();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.unsubscribeHost();
        this.props.logsWorker.unregisterHandler(this.onLogs);
    }

    /** Live values behind the two progress bars in the system information card */
    subscribeHost(): void {
        this.unsubscribeHost();
        this.subscribedHost = this.props.currentHost;
        if (!this.subscribedHost) {
            return;
        }
        void this.props.socket.subscribeState(`${this.subscribedHost}.cpu`, this.onCpu);
        void this.props.socket.subscribeState(`${this.subscribedHost}.mem`, this.onMem);
    }

    unsubscribeHost(): void {
        if (this.subscribedHost) {
            this.props.socket.unsubscribeState(`${this.subscribedHost}.cpu`, this.onCpu);
            this.props.socket.unsubscribeState(`${this.subscribedHost}.mem`, this.onMem);
            this.subscribedHost = '';
        }
    }

    onCpu = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (this.mounted) {
            this.setState({ cpu: state?.val === null || state?.val === undefined ? null : Number(state.val) });
        }
    };

    onMem = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (this.mounted) {
            this.setState({ mem: state?.val === null || state?.val === undefined ? null : Number(state.val) });
        }
    };

    onLogs = (events: LogLineSaved[]): void => {
        if (this.mounted) {
            this.setState(state => ({ logs: [...state.logs, ...events].slice(-LOG_LINES) }));
        }
    };

    async readAll(): Promise<void> {
        const { socket, currentHost } = this.props;

        const [instances, aliveStates, hostAliveState, logs] = await Promise.all([
            this.props.instancesWorker.getObjects(),
            socket.getForeignStates('system.adapter.*.alive').catch((): Record<string, ioBroker.State> => ({})),
            socket.getState(`${currentHost}.alive`).catch((): null => null),
            this.props.logsWorker
                .getLogs()
                .catch((): { logs: LogLineSaved[]; logSize: number } => ({ logs: [], logSize: 0 })),
        ]);

        if (!this.mounted) {
            return;
        }

        // instances of the selected host only
        const hostInstances = Object.values(instances || {}).filter(obj => obj?.common?.host === this.hostName());

        const adapterNames = new Set<string>();
        const activeAdapterNames = new Set<string>();
        const adapters: AdapterEntry[] = [];
        let instancesAlive = 0;

        for (const obj of hostInstances) {
            const adapterName = obj._id.replace('system.adapter.', '').split('.')[0];
            adapterNames.add(adapterName);

            if (aliveStates[`${obj._id}.alive`]?.val) {
                instancesAlive++;
                activeAdapterNames.add(adapterName);
                const known = adapters.find(a => a.name === adapterName);
                if (known) {
                    known.instances++;
                } else {
                    adapters.push({
                        name: adapterName,
                        version: obj.common?.version || '',
                        instances: 1,
                        icon: obj.common?.icon ? `adapter/${adapterName}/${obj.common.icon}` : '',
                    });
                }
            }
        }

        adapters.sort((a, b) => a.name.localeCompare(b.name));

        // `getHostInfo` talks to the host and may take a while, so it must not block the counters
        let hostInfo: Record<string, any> | null = this.state.hostInfo;
        try {
            hostInfo = await this.props.socket.getHostInfo(currentHost);
        } catch {
            // host may be offline - keep the previous information
        }

        if (!this.mounted) {
            return;
        }

        this.setState({
            loaded: true,
            hostAlive: !!hostAliveState?.val,
            adaptersTotal: adapterNames.size,
            adaptersActive: activeAdapterNames.size,
            instancesTotal: hostInstances.length,
            instancesAlive,
            hostInfo,
            adapters,
            logs: (logs.logs || []).slice(-LOG_LINES),
        });
    }

    /** The worker delivers either a plain message or a coloured one split into parts */
    static logText(line: LogLineSaved): string {
        return typeof line.message === 'string' ? line.message : line.message.original;
    }

    /** Host name as stored in `common.host` of the instance objects */
    hostName(): string {
        return this.props.currentHostName || this.props.currentHost.replace('system.host.', '');
    }

    static renderGaugeRow(name: string, percent: number | null, value: string): React.JSX.Element {
        return (
            <Box
                key={name}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}
            >
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 80 }}
                >
                    {name}
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, percent ?? 0))}
                    sx={{ flex: 1, maxWidth: 160 }}
                />
                <Typography
                    variant="body2"
                    sx={{ flex: 1, textAlign: 'right' }}
                >
                    {value}
                </Typography>
            </Box>
        );
    }

    renderSystemInfo(): React.JSX.Element {
        const { t } = this.props;
        const info = this.state.hostInfo;
        const ramGb = info?.RAM ? Number(info.RAM) / 1024 / 1024 / 1024 : 0;
        const usedGb = this.state.mem !== null && ramGb ? (ramGb * this.state.mem) / 100 : null;

        return (
            <Card sx={{ flex: '1 1 340px', p: 2.5 }}>
                <CardTitle title={t('System information')} />
                {info ? (
                    <>
                        <InfoRow
                            name={t('Platform')}
                            value={String(info.Platform ?? '-')}
                        />
                        <InfoRow
                            name={t('Architecture')}
                            value={String(info.Architecture ?? '-')}
                        />
                        <InfoRow
                            name="Node.js"
                            value={String(info['Node.js'] ?? '-')}
                        />
                        <InfoRow
                            name="NPM"
                            value={String(info.NPM ?? '-')}
                        />
                        <InfoRow
                            name={t('System uptime')}
                            value={AdminUtils.formatSeconds(Number(info['System uptime'] ?? 0), t)}
                        />
                        {Overview.renderGaugeRow(
                            t('RAM'),
                            this.state.mem,
                            usedGb !== null
                                ? `${usedGb.toFixed(1)} GB / ${ramGb?.toFixed(1)} GB (${Math.round(this.state.mem ?? 0)}%)`
                                : '-',
                        )}
                        {Overview.renderGaugeRow(
                            'CPU',
                            this.state.cpu,
                            this.state.cpu !== null ? `${Math.round(this.state.cpu)}%` : '-',
                        )}
                    </>
                ) : (
                    <LinearProgress />
                )}
            </Card>
        );
    }

    renderAdapters(): React.JSX.Element {
        const { t, theme } = this.props;

        return (
            <Card sx={{ flex: '1 1 340px', p: 2.5 }}>
                <CardTitle
                    title={t('Running adapters')}
                    action={{ text: t('Show all'), onClick: () => this.props.handleNavigation('tab-instances') }}
                />
                {this.state.adapters.length ? (
                    this.state.adapters.slice(0, ADAPTER_LINES).map(adapter => (
                        <Box
                            key={adapter.name}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                py: 1,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    // the ring keeps saying "running", the icon inside only tells which adapter it is
                                    backgroundColor: alpha(theme.palette.success.main, 0.2),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
                                }}
                            >
                                {adapter.icon ? (
                                    <Icon
                                        src={adapter.icon}
                                        alt={adapter.name}
                                        // rounded as well: the square adapter images poked out of
                                        // the round ring at the corners
                                        style={{ width: 18, height: 18, borderRadius: '50%' }}
                                    />
                                ) : null}
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{ flex: 1 }}
                            >
                                {adapter.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                v{adapter.version}
                            </Typography>
                            <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label={adapter.instances > 1 ? t('%s instances', adapter.instances) : t('active')}
                            />
                        </Box>
                    ))
                ) : (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {t('No running adapters')}
                    </Typography>
                )}
            </Card>
        );
    }

    renderLog(): React.JSX.Element {
        const { t, theme } = this.props;
        const severityColor: Record<string, string> = {
            error: theme.palette.error.main,
            warn: theme.palette.warning.main,
        };

        return (
            <Card sx={{ flex: '2 1 460px', p: 2.5, minWidth: 0 }}>
                <CardTitle
                    title={t('System log')}
                    action={{ text: t('Show all'), onClick: () => this.props.handleNavigation('tab-logs') }}
                />
                {this.state.logs.length ? (
                    this.state.logs.map((line, i) => (
                        <Box
                            // `line.key` is the timestamp and is NOT unique: several messages can
                            // arrive in the same millisecond, so the index always takes part
                            key={`${line.key ?? line.ts}_${i}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                py: 1,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                minWidth: 0,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    backgroundColor: severityColor[line.severity] || theme.palette.success.main,
                                }}
                            />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {new Date(line.ts).toLocaleTimeString()}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: severityColor[line.severity] || 'text.secondary',
                                    width: 34,
                                    flexShrink: 0,
                                }}
                            >
                                {line.severity}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {Overview.logText(line)}
                            </Typography>
                        </Box>
                    ))
                ) : (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {t('No messages')}
                    </Typography>
                )}
            </Card>
        );
    }

    render(): React.JSX.Element {
        const { t, theme } = this.props;
        const ok = this.state.hostAlive;
        const loaded = this.state.loaded;
        // the repository is loaded by the app, not by this tab - it may still be empty here
        const updates = AdminUtils.countAdapterUpdates(this.props.installed, this.props.repository);

        // no padding at the top: the page starts directly below the app bar
        return (
            <Box sx={{ height: '100%', overflow: 'auto', p: 3, pt: 0 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                        gap: 2,
                    }}
                >
                    {/* room for the floating menu button, see `menuButtonSpace` */}
                    {this.props.menuButtonSpace ? <Box sx={{ width: 40, flexShrink: 0 }} /> : null}
                    <Box>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('Overview')}</Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {t('System overview and status')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {loaded ? (
                            <Chip
                                size="small"
                                label={ok ? t('online') : t('offline')}
                                color={ok ? 'success' : 'error'}
                            />
                        ) : null}
                        {/* the host name is no longer written out - the selector already shows it */}
                        <Box sx={{ ml: 'auto', pl: 1 }}>{this.props.hostSelector}</Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <StatCard
                        title={t('System status')}
                        value={loaded ? (ok ? t('OK') : t('Offline')) : PENDING}
                        valueColor={loaded ? (ok ? theme.palette.success.main : theme.palette.error.main) : undefined}
                        hint={loaded ? (ok ? t('ioBroker is running') : t('Host does not answer')) : t('Loading...')}
                        // stay neutral while loading: a red tile would claim the host is offline
                        color={
                            loaded
                                ? ok
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                                : theme.palette.text.secondary
                        }
                        icon={<StatusIcon />}
                        onClick={() => this.props.handleNavigation('tab-hosts')}
                    />
                    <StatCard
                        title={t('Adapters')}
                        value={loaded ? String(this.state.adaptersTotal) : PENDING}
                        hint={
                            loaded
                                ? t(
                                      '%s active / %s inactive',
                                      this.state.adaptersActive,
                                      this.state.adaptersTotal - this.state.adaptersActive,
                                  )
                                : t('Loading...')
                        }
                        chip={
                            updates
                                ? {
                                      label: updates === 1 ? t('1 update') : t('%s updates', updates),
                                      color: 'warning',
                                  }
                                : undefined
                        }
                        color={theme.palette.primary.main}
                        icon={<AdapterIcon />}
                        onClick={() => this.props.handleNavigation('tab-adapters')}
                    />
                    <StatCard
                        title={t('Instances')}
                        value={loaded ? String(this.state.instancesTotal) : PENDING}
                        hint={
                            loaded
                                ? t(
                                      '%s active / %s inactive',
                                      this.state.instancesAlive,
                                      this.state.instancesTotal - this.state.instancesAlive,
                                  )
                                : t('Loading...')
                        }
                        color={theme.palette.secondary.main}
                        icon={<IconInstance />}
                        onClick={() => this.props.handleNavigation('tab-instances')}
                    />
                    <StatCard
                        title={t('Objects')}
                        value={
                            this.state.objectsLoaded ? this.state.objectsCount.toLocaleString(this.props.lang) : PENDING
                        }
                        hint={
                            this.state.objectsLoaded
                                ? t('%s states', this.state.statesCount.toLocaleString(this.props.lang))
                                : t('Loading...')
                        }
                        color={theme.palette.warning.main}
                        icon={<ObjectsIcon />}
                        onClick={() => this.props.handleNavigation('tab-objects')}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    {this.renderSystemInfo()}
                    {/*
                     * The card is hidden instead of unmounted: the chart keeps checking whether the
                     * history instance came up, and an unmounted component could never bring it back.
                     */}
                    <Card
                        sx={{
                            flex: '2 1 460px',
                            p: 2.5,
                            minWidth: 0,
                            display: this.state.chartAvailable ? undefined : 'none',
                        }}
                    >
                        <CardTitle title={t('Resource usage')} />
                        <ResourcesChart
                            socket={this.props.socket}
                            currentHost={this.props.currentHost}
                            theme={this.props.theme}
                            themeType={this.props.themeType}
                            t={t}
                            onAvailabilityChange={available => {
                                if (available !== this.state.chartAvailable) {
                                    this.setState({ chartAvailable: available });
                                }
                            }}
                        />
                    </Card>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {this.renderAdapters()}
                    {this.renderLog()}
                </Box>
            </Box>
        );
    }
}
