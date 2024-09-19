import React, { Component } from 'react';
import semver from 'semver';

import {
    Avatar, Badge, Box,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
} from '@mui/material';

import {
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Cached as CachedIcon,
    Build as BuildIcon,
    Edit as EditIcon,
    BugReport as BugReportIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

import {
    amber, blue, green, grey, red,
} from '@mui/material/colors';

import {
    Utils, IconCopy, type AdminConnection,
    type IobTheme, type ThemeType, type Translate,
} from '@iobroker/adapter-react-v5';

import type HostsWorker from '@/Workers/HostsWorker';
import { type NotificationAnswer } from '@/Workers/HostsWorker';
import AdapterUpdateDialog, { type News } from '@/dialogs/AdapterUpdateDialog';
import JsControllerUpdater from '@/dialogs/JsControllerUpdater';
import JsControllerDialog from '@/dialogs/JsControllerDialog';
import BaseSettingsDialog from '@/dialogs/BaseSettingsDialog';
import { CONTROLLER_CHANGELOG_URL } from '@/helpers/utils';
import type { RepoAdapterObject } from '@/components/Adapters/Utils';
import type { NotificationsCount } from '@/types';
import AdminUtils from '../../AdminUtils';
import HostEdit from './HostEdit';
import CustomModal from '../CustomModal';

export const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
export const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

export const blinkClasses = `
    @keyframes newValueAnimationHostDark {
        0% {
            color: #00f900;
        }
        80% {
            color: #008000;
        }
        100% {
            color: #fff;
        }
    }
    @keyframes newValueAnimationHostLight {
        0% {
            color: #00f900;
        }
        80% {
            color: #008000;
        }
        100% {
            color: #fff;
        }
    }
    .newValueHost-dark {
        animation: newValueAnimationHostDark 2s ease-in-out;
    }
    .newValueHost-light {
        animation: newValueAnimationHostLight 2s ease-in-out;
    }
    @keyframes colors {
        0% {
            left: -51px;
        }
        100% {
            left: 101%;
        }
    }
    @keyframes warning {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0.7;
        }
    }
    @keyframes red {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0.8;
        }
    }
    @keyframes onBlink-keys-dark {
        0% {
            color: #264d72;
        }
        80% {
            color: #3679be;
        }
        100% {
            color: #fff;
        }
    }
    @keyframes onBlink-keys-light {
        0% {
            color: #3679be;
        }
        80% {
            color: #264d72;
        }
        100% {
            color: #000;
        }
    }
    .onBlick-light {
        animation: onBlink-keys-light 2s ease-in-out;
        animation-iteration-count: 2;
        font-size: 12px;
        margin-left: 4px;
    }
    .onBlick-dark {
        animation: onBlink-keys-dark 2s ease-in-out;
        animation-iteration-count: 2;
        font-size: 12px;
        margin-left: 4px;
    }
    @keyframes height {
        0% {
            height: 0;
        },
        100% {
            height: 160px;
        }
    }
`;

export const genericStyles: Record<string, any> = {
    img: {
        width: 45,
        height: 45,
        margin: 'auto 0',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    collapseOff: {
        height: 0,
    },
    footerBlock: (theme: IobTheme) => ({
        background: theme.palette.background.default,
        p: '10px',
        display: 'flex',
        justifyContent: 'space-between',
    }),
    hidden: {
        display: 'none',
    },

    emptyButton: {
        width: 48,
    },
    greenText: (theme: IobTheme) => ({
        color: theme.palette.success.dark,
    }),
    wrapperAvailable: {
        display: 'flex',
        alignItems: 'center',
    },
    buttonUpdate: {
        border: `1px solid ${green[700]}`,
        padding: '2px 7px',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.5s',
        '&:hover': {
            background: '#00800026',
        },
    },
    buttonUpdateIcon: {
        height: 20,
        width: 20,
        marginRight: 10,
    },
    debug: {
        backgroundColor: grey[700],
    },
    info: {
        backgroundColor: blue[700],
    },
    warn: {
        backgroundColor: amber[700],
    },
    error: {
        backgroundColor: red[700],
    },
    smallAvatar: {
        width: 24,
        height: 24,
    },
    formControl: {
        display: 'flex',
    },
    baseSettingsButton: {
        transform: 'rotate(45deg)',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];

function toggleClassName(el: HTMLElement, name: string) {
    const classNames = el.className.split(' ');
    const pos = classNames.indexOf(name);
    if (pos !== -1) {
        classNames.splice(pos, 1);
        el.className = classNames.join(' ');
    }
    classNames.push(name);
    // el.className = classNames.join(' ');
    setTimeout(_classNames => (el.className = _classNames), 100, classNames.join(' '));
}

function getLogLevelIcon(level: ioBroker.LogLevel | ''): React.JSX.Element | null {
    if (level === 'debug') {
        return <BugReportIcon />;
    }
    if (level === 'info') {
        return <InfoIcon />;
    }
    if (level === 'warn') {
        return <WarningIcon />;
    }
    if (level === 'error') {
        return <ErrorIcon />;
    }
    return null;
}

export interface HostGenericProps {
    adminInstance: string;
    alive: boolean;
    available: string;
    executeCommandRemove: () => void;
    expertMode: boolean;
    hostData: Record<string, any> | string;
    hostId: `system.host.${string}`;
    host: ioBroker.HostObject;
    hostsWorker: HostsWorker;
    isCurrentHost: boolean;
    jsControllerInfo: RepoAdapterObject;
    lang: ioBroker.Languages;
    noTranslation: boolean;
    onUpdating: (isUpdating: boolean) => void;
    showAdaptersWarning: (notifications: Record<string, NotificationAnswer>, hostId: string) => void;
    socket: AdminConnection;
    systemConfig: ioBroker.SystemConfigObject;
    t: Translate;
    theme: IobTheme;
    themeType: ThemeType;
    toggleTranslation: () => void;
}

export interface HostGenericState {
    logLevel: ioBroker.LogLevel | '';
    logLevelSelect: ioBroker.LogLevel | '';
    hostNotifications: { notifications: NotificationAnswer | null } & NotificationsCount;
    openDialogLogLevel: boolean;
    hostUpdateDialog: boolean;
    updateAvailable: boolean;
    instructionDialog: boolean;
    updateDialog: boolean;
    baseSettingsDialog: boolean;
    editDialog: boolean;
    changeLog: string | null;
}

export default abstract class HostGeneric<TProps extends HostGenericProps, TState extends HostGenericState> extends Component<TProps, TState> {
    static formatInfo: Record<string, (value: any, t: Translate) => string> = {
        Uptime: AdminUtils.formatSeconds,
        'System uptime': AdminUtils.formatSeconds,
        RAM: AdminUtils.formatRam,
        Speed: AdminUtils.formatSpeed,
        'Disk size': AdminUtils.formatBytes,
        'Disk free': AdminUtils.formatBytes,
    };

    protected readonly refEvents = React.createRef<HTMLDivElement>();

    protected readonly refWarning = React.createRef<HTMLDivElement>();

    protected readonly refCpu = React.createRef<HTMLDivElement>();

    protected readonly refMem = React.createRef<HTMLDivElement>();

    protected readonly refUptime = React.createRef<HTMLDivElement>();

    private outputCache = '-';

    private inputCache = '-';

    private cpuCache = '- %';

    private memCache = '- %';

    private uptimeCache = '-';

    private diskFreeCache = 1;

    private diskSizeCache = 1;

    private diskWarningCache = 1;

    constructor(props: TProps) {
        super(props);
        this.state = {
            logLevel: '',
            logLevelSelect: '',
            hostNotifications: { notifications: null, warning: 0, other: 0 },
            openDialogLogLevel: false,
            hostUpdateDialog: false,
            updateAvailable: false,
            instructionDialog: false,
            updateDialog: false,
            baseSettingsDialog: false,
            editDialog: false,
            changeLog: null,
        } as TState;
    }

    /**
     * Get the initial disk states to show problems with disk usage
     */
    async getInitialDiskStates(): Promise<void> {
        const diskWarningState = await this.props.socket.getState(`${this.props.hostId}.diskWarning`);
        this.diskWarningCache = diskWarningState?.val as number ?? this.diskWarningCache;

        const diskFreeState = await this.props.socket.getState(`${this.props.hostId}.diskFree`);
        this.diskFreeCache = diskFreeState?.val as number ?? this.diskFreeCache;

        const diskSizeState = await this.props.socket.getState(`${this.props.hostId}.diskSize`);
        this.diskSizeCache = diskSizeState?.val as number ?? this.diskSizeCache;
    }

    notificationHandler = (notifications: Record<string, NotificationAnswer>) =>
        notifications &&
        notifications[this.props.hostId] &&
        this.setState({ hostNotifications: { notifications: notifications[this.props.hostId], ...this.calculateWarning(notifications[this.props.hostId]) } });

    readChangeLog() {
        if (!this.state.changeLog) {
            fetch(CONTROLLER_CHANGELOG_URL.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'))
                .then(response => response.text())
                .then(data => this.setState({ changeLog: data }))
                .catch(e => console.error(`Cannot read changelog: ${e}`));
        }
    }

    componentDidMount() {
        this.props.hostsWorker.registerNotificationHandler(this.notificationHandler);

        this.props.hostsWorker
            .getNotifications(this.props.hostId)
            .then(notifications => this.notificationHandler(notifications));

        this.props.socket.subscribeState(`${this.props.hostId}.inputCount`, this.eventsInputFunc);
        this.props.socket.subscribeState(`${this.props.hostId}.outputCount`, this.eventsOutputFunc);

        this.props.socket.subscribeState(`${this.props.hostId}.cpu`, this.cpuFunc);
        this.props.socket.subscribeState(`${this.props.hostId}.mem`, this.memFunc);
        this.props.socket.subscribeState(`${this.props.hostId}.uptime`, this.uptimeFunc);

        this.getInitialDiskStates()
            .finally(async () => {
                await this.props.socket.subscribeState(`${this.props.hostId}.diskFree`, this.warningFunc);
                await this.props.socket.subscribeState(`${this.props.hostId}.diskSize`, this.warningFunc);
                await this.props.socket.subscribeState(`${this.props.hostId}.diskWarning`, this.warningFunc);
            });

        this.props.socket.subscribeState(`${this.props.hostId}.logLevel`, this.logLevelFunc);
    }

    componentWillUnmount() {
        this.props.hostsWorker.unregisterNotificationHandler(this.notificationHandler);
        this.props.socket.unsubscribeState(`${this.props.hostId}.inputCount`, this.eventsInputFunc);
        this.props.socket.unsubscribeState(`${this.props.hostId}.outputCount`, this.eventsOutputFunc);

        this.props.socket.unsubscribeState(`${this.props.hostId}.cpu`, this.cpuFunc);
        this.props.socket.unsubscribeState(`${this.props.hostId}.mem`, this.memFunc);
        this.props.socket.unsubscribeState(`${this.props.hostId}.uptime`, this.uptimeFunc);

        this.props.socket.unsubscribeState(`${this.props.hostId}.diskFree`, this.warningFunc);
        this.props.socket.unsubscribeState(`${this.props.hostId}.diskSize`, this.warningFunc);
        this.props.socket.unsubscribeState(`${this.props.hostId}.diskWarning`, this.warningFunc);

        this.props.socket.unsubscribeState(`${this.props.hostId}.logLevel`, this.logLevelFunc);
    }

    eventsInputFunc = (id: string, input: ioBroker.State) => {
        this.inputCache = input && input.val !== null ? `⇥${input.val}` : '-';
        if (this.refEvents.current) {
            this.refEvents.current.innerHTML = `${this.inputCache} / ${this.outputCache}`;
            toggleClassName(this.refEvents.current, `newValueHost-${this.props.themeType || 'light'}`);
        }
    };

    eventsOutputFunc = (id: string, output: ioBroker.State) => {
        this.outputCache = output && output.val !== null ? `↦${output.val}` : '-';
        if (this.refEvents.current) {
            this.refEvents.current.innerHTML = `${this.inputCache} / ${this.outputCache}`;
            toggleClassName(this.refEvents.current, `newValueHost-${this.props.themeType || 'light'}`);
        }
    };

    warningFunc = (name_: string, state: ioBroker.State) => {
        if (name_.endsWith('diskFree')) {
            this.diskFreeCache = (state?.val as number) || 0;
        } else if (name_.endsWith('diskSize')) {
            this.diskSizeCache = (state?.val as number) || 0;
        } else if (name_.endsWith('diskWarning')) {
            this.diskWarningCache = (state?.val as number) || 0;
        }
        const warning = (this.diskFreeCache / this.diskSizeCache) * 100 <= this.diskWarningCache;
        if (this.refWarning.current) {
            if (warning) {
                this.refWarning.current.setAttribute('title', this.props.t('Warning: Free space on disk is low'));
                this.refWarning.current.classList.add('warning');
            } else {
                this.refWarning.current.removeAttribute('title');
                this.refWarning.current.classList.remove('warning');
            }
        }
    };

    cpuFunc = (id: string, state: ioBroker.State) => {
        this.cpuCache = this.formatValue(state, '%');
        if (this.refCpu.current) {
            this.refCpu.current.innerHTML = this.cpuCache;
            toggleClassName(this.refCpu.current, `newValueHost-${this.props.themeType || 'light'}`);
        }
    };

    memFunc = (id: string, state: ioBroker.State) => {
        this.memCache = this.formatValue(state, '%');
        if (this.refMem.current) {
            this.refMem.current.innerHTML = this.memCache;
            toggleClassName(this.refMem.current, `newValueHost-${this.props.themeType || 'light'}`);
        }
    };

    uptimeFunc = (id: string, state: ioBroker.State) => {
        if (state?.val) {
            const d = Math.floor((state.val as number) / (3600 * 24));
            const h = Math.floor(((state.val as number) % (3600 * 24)) / 3600);
            this.uptimeCache = d ? `${d}d${h}h` : `${h}h`; // TODO translate
        }
        if (this.refUptime.current) {
            this.refUptime.current.innerHTML = this.uptimeCache;
            toggleClassName(this.refUptime.current, `newValueHost-${this.props.themeType || 'light'}`);
        }
    };

    calculateWarning(notifications: NotificationAnswer | null):  NotificationsCount {
        const count = { warning: 0, other: 0 };

        if (!notifications) {
            return count;
        }
        const { result } = notifications;
        if (!result || !result.system) {
            return count;
        }
        if (Object.keys(result.system.categories).length) {
            const obj = result.system.categories;

            for (const category of Object.values(obj)) {
                Object.keys(category.instances).forEach(() => (category.severity === 'alert' ? count.warning++ : count.other++));
            }
        }
        return count;
    }

    formatValue(state: ioBroker.State, unit: string) {
        if (!state || state.val === null || state.val === undefined) {
            return `-${unit ? ` ${unit}` : ''}`;
        }
        if (this.props.systemConfig.common.isFloatComma) {
            return state.val.toString().replace('.', ',') + (unit ? ` ${unit}` : '');
        }
        return state.val + (unit ? ` ${unit}` : '');
    }

    logLevelFunc = (id: string, state: ioBroker.State) => {
        if (state) {
            this.setState({ logLevel: state.val as ioBroker.LogLevel, logLevelSelect: state.val as ioBroker.LogLevel });
        }
    };

    renderDialogLogLevel() {
        if (!this.state.openDialogLogLevel) {
            return null;
        }
        return <CustomModal
            theme={this.props.theme}
            title={this.props.t('Edit log level rule for %s', this.props.host.common.name)}
            onApply={() => {
                this.props.socket.setState(`${this.props.hostId}.logLevel`, this.state.logLevelSelect)
                    .catch(e => window.alert(`Cannot set log level: ${e}`));
                this.setState({ openDialogLogLevel: false });
            }}
            onClose={() => this.setState({ openDialogLogLevel: false, logLevelSelect: this.state.logLevel })}
        >
            <FormControl style={{ ...genericStyles.formControl, marginTop: 8 }} variant="outlined">
                <InputLabel>{this.props.t('log level')}</InputLabel>
                <Select
                    variant="standard"
                    value={this.state.logLevelSelect}
                    fullWidth
                    onChange={el => this.setState({ logLevelSelect: el.target.value as ioBroker.LogLevel })}
                >
                    {arrayLogLevel.map(el => (
                        <MenuItem key={el} value={el}>
                            {this.props.t(el)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl style={genericStyles.formControl} variant="outlined">
                <FormHelperText>
                    {this.props.t('Log level will be reset to the saved level after the restart of the controller')}
                </FormHelperText>
                <FormHelperText>
                    {this.props.t('You can set the log level permanently in the base host settings')}
                    <BuildIcon style={genericStyles.baseSettingsButton} />
                </FormHelperText>
            </FormControl>
        </CustomModal>;
    }

    onCopy() {
        const text = [];
        if (this.refCpu.current) {
            text.push(`CPU: ${this.refCpu.current.innerHTML}`);
        }
        if (this.refMem.current) {
            text.push(`RAM: ${this.refMem.current.innerHTML}`);
        }
        if (this.refUptime.current) {
            text.push(`${this.props.t('Uptime')}: ${this.refUptime.current.innerHTML}`);
        }
        text.push(`${this.props.t('Available')}: ${this.props.available}`);
        text.push(`${this.props.t('Installed')}: ${this.props.host.common.installedVersion}`);
        if (this.refEvents.current) {
            text.push(`${this.props.t('Events')}: ${this.refEvents.current.innerHTML}`);
        }

        if (this.props.hostData && typeof this.props.hostData === 'object') {
            const data: Record<string, any> = this.props.hostData;
            Object.keys(data).map(value =>
                text.push(
                    `${this.props.t(value)}: ${HostGeneric.formatInfo[value] ? HostGeneric.formatInfo[value](data[value], this.props.t) : data[value] || '--'}`,
                ));
        }

        Utils.copyToClipboard(text.join('\n'));
        window.alert(this.props.t('Copied'));
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderUpdateButton(upgradeAvailable: boolean, style?: React.CSSProperties) {
        return upgradeAvailable ? <Tooltip
            title={this.props.t('Update')}
            slotProps={{ popper: { sx: genericStyles.tooltip } }}
        >
            <Box
                component="div"
                onClick={event => {
                    event.stopPropagation();
                    this.openHostUpdateDialog();
                }}
                sx={genericStyles.buttonUpdate}
            >
                <IconButton style={genericStyles.buttonUpdateIcon} size="small">
                    <RefreshIcon />
                </IconButton>
                <span style={{ color: green[700] }}>{this.props.available}</span>
            </Box>
        </Tooltip>
            :
            <span style={style}>{this.props.available}</span>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderHostBaseEdit() {
        return this.props.expertMode ? <Tooltip
            title={this.props.t('Host Base Settings')}
            slotProps={{ popper: { sx: genericStyles.tooltip } }}
        >
            <div>
                <IconButton
                    size="large"
                    disabled={!this.props.alive}
                    onClick={e => {
                        e.stopPropagation();
                        this.setState({ baseSettingsDialog: true });
                    }}
                >
                    <BuildIcon style={genericStyles.baseSettingsButton} />
                </IconButton>
            </div>
        </Tooltip> : null;
    }

    /**
     * Render a button to extend the component in general the component can be extended by clicking anywhere on it
     * However, it is used as an additional indicator that it is expandable
     */
    // eslint-disable-next-line react/no-unused-class-component-methods
    renderExtendButton(
        /** if host is expanded */
        open: boolean,
    ) {
        return <Tooltip title={this.props.t(open ? 'collapse' : 'Expand')} slotProps={{ popper: { sx: genericStyles.tooltip } }}>
            <div>
                <IconButton
                    size="large"
                >
                    {open ? <BiChevronUp /> : <BiChevronDown />}
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRestartButton() {
        return <Tooltip title={this.props.t('Restart host')} slotProps={{ popper: { sx: genericStyles.tooltip } }}>
            <div>
                <IconButton
                    size="large"
                    disabled={!this.props.alive}
                    onClick={event => {
                        event.stopPropagation();
                        this.props.socket.restartController(this.props.hostId)
                            .catch((err: string) => window.alert(`Cannot restart: ${err}`));
                    }}
                >
                    <CachedIcon />
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderEditButton() {
        return <IconButton
            size="large"
            onClick={event => {
                event.stopPropagation();
                this.setState({ editDialog: true });
            }}
        >
            <EditIcon />
        </IconButton>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRemoveButton() {
        return !this.props.alive && !this.props.isCurrentHost ? <Tooltip
            title={this.props.alive || this.props.isCurrentHost ? this.props.t('You cannot delete host, when it is alive') : this.props.t('Remove')}
            slotProps={{ popper: { sx: genericStyles.tooltip } }}
        >
            <IconButton
                size="large"
                onClick={event => {
                    event.stopPropagation();
                    this.props.executeCommandRemove();
                }}
            >
                <DeleteIcon />
            </IconButton>
        </Tooltip>
            :
            <div style={genericStyles.emptyButton} />;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderCopyButton(style?: React.CSSProperties) {
        return <Tooltip title={this.props.t('Copy')} slotProps={{ popper: { sx: genericStyles.tooltip } }}>
            <IconButton
                size="large"
                onClick={() => this.onCopy()}
                style={style}
            >
                <IconCopy />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderLogLevel() {
        return <Tooltip
            title={`${this.props.t('loglevel')} ${this.state.logLevel}`}
            slotProps={{ popper: { sx: genericStyles.tooltip } }}
        >
            <IconButton
                size="large"
                onClick={event => {
                    event.stopPropagation();
                    this.setState({ openDialogLogLevel: true });
                }}
            >
                <Avatar style={{ ...genericStyles.smallAvatar, ...genericStyles[this.state.logLevel] }}>
                    {getLogLevelIcon(this.state.logLevel)}
                </Avatar>
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderNotificationsBadge(children?: React.ReactNode, styled?: boolean): React.JSX.Element {
        return <Badge
            sx={styled ? {
                right: -3,
                top: 13,
                padding: '0 4px',
            } : undefined}
            title={this.props.t('Hosts notifications')}
            badgeContent={this.state.hostNotifications.warning + this.state.hostNotifications.other}
            style={genericStyles.badge}
            color={this.state.hostNotifications.warning > 0 ? 'error' : 'secondary'}
            onClick={e => {
                e.stopPropagation();
                this.props.showAdaptersWarning({ [this.props.hostId]: this.state.hostNotifications.notifications }, this.props.hostId);
            }}
        >
            {children}
        </Badge>;
    }

    async openHostUpdateDialog() {
        const updateAvailable = await this.props.socket.checkFeatureSupported('CONTROLLER_UI_UPGRADE');

        this.setState({
            hostUpdateDialog: true,
            updateAvailable,
        });

        this.readChangeLog();
    }

    renderHostUpdateDialog() {
        if (!this.state.hostUpdateDialog) {
            return null;
        }

        return <AdapterUpdateDialog
            adapter={this.props.host.common.name}
            adapterObject={this.props.jsControllerInfo}
            t={this.props.t}
            textUpdate={this.state.updateAvailable ? this.props.t('Start update') : this.props.t('Show instructions')}
            textInstruction={this.props.t('Show whole changelog')}
            rightDependencies
            news={this.getNews()}
            toggleTranslation={this.props.toggleTranslation}
            noTranslation={this.props.noTranslation}
            onUpdate={async () => {
                if (this.state.updateAvailable) {
                    this.setState({ hostUpdateDialog: false, updateDialog: true });
                } else {
                    this.setState({ hostUpdateDialog: false, instructionDialog: true });
                }
            }}
            theme={this.props.theme}
            installedVersion={this.props.host.common.installedVersion}
            onInstruction={() => {
                window.open(CONTROLLER_CHANGELOG_URL, '_blank');
            }}
            onClose={() => this.setState({ hostUpdateDialog: false })}
        />;
    }

    renderUpdateDialog() {
        if (this.state.updateAvailable && this.state.updateDialog) {
            return <JsControllerUpdater
                socket={this.props.socket}
                hostId={this.props.hostId}
                version={this.props.jsControllerInfo.version}
                onClose={() => this.setState({ updateDialog: false })}
                adminInstance={this.props.adminInstance}
                onUpdating={(isUpdating: boolean) => this.props.onUpdating(isUpdating)}
                themeType={this.props.themeType}
            />;
        }

        if (this.state.instructionDialog) {
            return <JsControllerDialog
                socket={this.props.socket}
                hostId={this.props.hostId}
                version={this.props.jsControllerInfo.version}
                onClose={() => this.setState({ instructionDialog: false })}
            />;
        }

        return null;
    }

    static extractNews(changelog: string, version: string): string {
        const lines = changelog.split('\n');
        let news = '';
        let started = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## ')) {
                if (started) {
                    break;
                }
                if (lines[i].startsWith(`## ${version}`)) {
                    started = true;
                }
            } else if (started) {
                news += `${lines[i].replace(/^\*\s*/, '').replace(/^\(\w+\)\s*/, '')}\n`;
            }
        }
        return news;
    }

    getNews(all?: boolean): News[] {
        const adapter = this.props.jsControllerInfo;
        const installed = this.props.host.common.installedVersion;
        const news: News[] = [];

        if (installed && adapter?.news) {
            Object.keys(adapter.news).forEach(version => {
                try {
                    if (semver.gt(version, installed) || all) {
                        let downloaded = false;
                        let newsText: string = this.props.noTranslation ?
                            adapter.news[version].en : (adapter.news[version][this.props.lang] || adapter.news[version].en) as string;

                        if (adapter.news[version].en === 'see CHANGELOG.md' && this.state.changeLog) {
                            // try to find news in CHANGELOG
                            const found = HostGeneric.extractNews(this.state.changeLog, version);
                            if (found) {
                                newsText = found;
                                downloaded = true;
                            }
                        }

                        news.push({
                            version,
                            news: newsText,
                            downloaded,
                        });
                    }
                } catch {
                    // ignore it
                    console.warn(`Cannot compare "${version}" and "${installed}"`);
                }
            });
        }

        return news;
    }

    baseSettingsSettingsDialog() {
        if (!this.state.baseSettingsDialog) {
            return null;
        }

        return <BaseSettingsDialog
            key="base"
            currentHost={this.props.hostId}
            themeType={this.props.themeType}
            currentHostName={this.props.host.common.name}
            onClose={() => this.setState({ baseSettingsDialog: false })}
            lang={this.props.lang}
            socket={this.props.socket}
            t={this.props.t}
        />;
    }

    renderEditObjectDialog() {
        if (!this.state.editDialog) {
            return null;
        }

        return <HostEdit
            obj={this.props.host}
            t={this.props.t}
            onClose={obj => this.setState({ editDialog: false }, () => {
                if (obj) {
                    this.props.socket.setObject(obj._id, obj)
                        .then(() => this.forceUpdate())
                        .catch(e => alert(`Cannot write object: ${e}`));
                }
            })}
        />;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDialogs() {
        return <>
            {this.renderDialogLogLevel()}
            {this.renderHostUpdateDialog()}
            {this.renderUpdateDialog()}
            {this.renderEditObjectDialog()}
            {this.baseSettingsSettingsDialog()}
        </>;
    }
}
