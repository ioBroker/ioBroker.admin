import React, { Component } from 'react';
import cronstrue from 'cronstrue';
import parser from 'cron-parser';

import 'cronstrue/locales/en';
import 'cronstrue/locales/de';
import 'cronstrue/locales/es';
import 'cronstrue/locales/fr';
import 'cronstrue/locales/it';
import 'cronstrue/locales/nl';
import 'cronstrue/locales/pl';
import 'cronstrue/locales/pt_BR';
import 'cronstrue/locales/ru';
import 'cronstrue/locales/uk';
import 'cronstrue/locales/zh_CN';

import {
    Button, CardMedia,
    Checkbox,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel, FormHelperText, IconButton,
    InputLabel,
    MenuItem,
    Select,
    type Theme, Tooltip,
} from '@mui/material';

import {
    Delete as DeleteIcon,
    Close as CloseIcon,
    Warning as WarningIcon,
    Settings as SettingsIcon,
    Schedule as ScheduleIcon,
    Memory as MemoryIcon,
    Pause as PauseIcon,
    PlayArrow as PlayArrowIcon,
    Build as BuildIcon,
    Refresh as RefreshIcon,
    Input as InputIcon,
    Edit as EditIcon,
    ImportExport as ImportExportIcon,
    ViewCompact as ViewCompactIcon,
    LowPriority as LowPriorityIcon, Storage as HostIcon,
} from '@mui/icons-material';

import {
    Confirm as ConfirmDialog,
    SelectWithIcon,
    ComplexCronDialog as ComplexCron,
    type AdminConnection, Utils as UtilsCommon, Utils, TextWithIcon, Router,
} from '@iobroker/adapter-react-v5';
import type {
    ThemeType,
} from '@iobroker/adapter-react-v5/types';
import {
    amber, blue, green,
    grey, orange, red,
} from '@mui/material/colors';

import State from '@/components/State';
import InstanceInfo from '@/components/Instances/InstanceInfo';
import sentry from '@/assets/sentry.svg';
import noSentry from '@/assets/sentryNo.svg';
import CustomModal from '../CustomModal';
import LinksDialog, { type InstanceLink } from './LinksDialog';
import BasicUtils from '../../Utils';

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];
export const arrayTier = [
    { value: 1, desc: '1: Logic adapters' },
    { value: 2, desc: '2: Data provider adapters' },
    { value: 3, desc: '3: Other adapters' },
];

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

export const style = (theme: Theme): Record<string, any> => ({
    root: {
        position: 'relative',
        margin: 10,
        width: 300,
        minHeight: 200,
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.5s',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
    },
    imageBlock: {
        background: 'silver',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        transition: 'background 0.5s',
    },
    logLevel: {
        width: '100%',
        marginBottom: 5,
    },
    hostInfo: {
        width: '100%',
    },
    addCompact: {
        width: '100%',
        marginBottom: 5,
    },
    selectStyle: {
        display: 'flex',
        margin: 5,
        justifyContent: 'space-around',
    },
    hide: {
        visibility: 'hidden',
    },
    tooltip: {
        pointerEvents: 'none',
    },
    deleting: {
        position: 'relative',
        '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            opacity: '.3 !important',
            background: 'repeating-linear-gradient(135deg, #333, #333 10px, #888 10px, #888 20px)',
        },
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200],
        },
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200],
        },
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-260deg) brightness(99%) contrast(97%)',
    },
    displayFlex: {
        display: 'flex',
    },
    marginLeft5: {
        marginLeft: 5,
    },
    marginRight5: {
        marginRight: 5,
    },
    instanceStateNotEnabled1: {
        backgroundColor: 'rgba(192, 192, 192, 0.2)',
    },
    instanceStateNotEnabled2: {
        backgroundColor: 'rgba(192, 192, 192, 0.15)',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(255,14,14,0.2)',
    },
    instanceStateNotAlive2: {
        backgroundColor: 'rgba(255,14,14, 0.15)',
    },
    instanceStateAliveNotConnected1: {
        backgroundColor: 'rgba(255, 177, 0, 0.1)',
    },
    instanceStateAliveNotConnected2: {
        backgroundColor: 'rgba(255, 177, 0, 0.15)',
    },
    instanceStateAliveAndConnected1: {
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
    },
    instanceStateAliveAndConnected2: {
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
    },
    statusIcon_green: { // square
        border: '2px solid grey',
        borderRadius: 2,
    },
    statusIcon_red: { // circle
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_orange: { // triangle
        border: 0,
        borderRadius: 0,
    },
    statusIcon_orangeDevice: { // triangle
        border: 0,
        borderRadius: 0,
    },
    statusIcon_blue: { // watch
        border: '2px solid grey',
        borderRadius: 20,
    },
    statusIcon_grey: { // circle ?
        border: '2px solid grey',
        borderRadius: 20,
    },
    orangeDevice: {
        // backgroundColor: orange[700]
        color: orange[300],
    },
    button: {
        padding: 5,
        transition: 'opacity 0.2s',
        height: 34,
    },
    hiddenOpacity: {
        opacity: 0,
        cursor: 'default',
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
    },
    statusIndicator: {
        marginTop: 12,
    },
    green: {
        // backgroundColor: green[700]
        color: green[700],
    },
    red: {
        // backgroundColor: red[700]
        color: red[700],
    },
    grey: {
        // backgroundColor: grey[700]
        color: grey[700],
    },
    blue: {
        // backgroundColor: blue[700]
        color: '#0055a9', // blue[700]
    },
    orange: {
        // backgroundColor: orange[700]
        color: orange[400],
    },

    transparent: {
        color: 'transparent',
        backgroundColor: 'transparent',
    },
    silly: {

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
    scheduleIcon: {
        color: '#dc8e00',
    },
    memoryIcon: {
        color: '#dc8e00',
    },
    contrast0: {
        filter: 'contrast(0%)',
    },
    hidden: {
        display: 'none',
    },
    okSymbol: {
        width: 20,
        height: 20,
        margin: 2,
        borderRadius: 2,
        // border: '2px solid #00000000',
    },
    okSymbolInner: {
        width: 'calc(100% - 2px)',
        height: 'calc(100% - 2px)',
        borderRadius: 2,
        margin: 1,
        backgroundColor: '#66bb6a',
    },
});

export interface InstanceEntry {
    id: string;
    obj: ioBroker.InstanceObject;
    host: string;
    version: string;
    mode: ioBroker.InstanceMode;
    image: string;
    canStart: boolean;
    adapter: string;
    config: boolean;
    links: InstanceLink[];
    jsonConfig: boolean;
    materialize: boolean;
    compactMode: boolean;
    schedule: null | string;
    loglevel: ioBroker.LogLevel;
    stoppedWhenWebExtension: boolean | undefined;
    compact: boolean;
    name: string;
    enabled: boolean;
}

export type InstanceStatusType = 'green' | 'red' | 'orangeDevice' | 'orange' | 'grey' | 'blue';

export interface InstanceItem {
    id: string; // system.adapter.accuweather.0
    nameId: string; // accuweather.0
    logLevel: ioBroker.LogLevel;
    mode: string;
    compactGroup: number | null | string;
    tier: 1 | 2 | 3;
    memoryLimitMB: number;
    name: string;
    stoppedWhenWebExtension: boolean;
    running: boolean;
    connected: boolean;
    connectedToHost: boolean;
    alive: boolean;
    inputOutput: {
        stateInput: number;
        stateOutput: number;
    };
    loglevelIcon: React.JSX.Element;
    logLevelObject: ioBroker.LogLevel;
    modeSchedule: boolean;
    checkCompact: boolean;
    compact: boolean;
    category: string;
    supportCompact: boolean;
    checkSentry: boolean;
    sentry: boolean;
    host: string;
    status: InstanceStatusType;
    allowInstanceSettings: boolean;
    allowInstanceDelete: boolean;
    allowInstanceLink: boolean;
}

export interface InstanceContext {
    adminInstance: string;
    onDeleteInstance: (instance: InstanceEntry, deleteCustom: boolean, deleteAdapter?: boolean) => void;
    deleteCustomSupported: boolean;
    hosts: ioBroker.HostObject[];
    lang: ioBroker.Languages;
    setMaxCompactGroupNumber: (maxCompactGroupNumber: number) => void;
    t: (text: string, ...args: any[]) => string;
    themeType: ThemeType;
    getInstanceStatus: (obj: ioBroker.InstanceObject) => InstanceStatusType;
    socket: AdminConnection;
    expertMode: boolean;
    maxCompactGroupNumber: number;
    states: Record<string, ioBroker.State>;
    onToggleExpanded: (inst: string) => void;
}

export interface InstanceGenericProps {
    classes: Record<string, string>;
    hidden?: boolean;
    id: string;
    instance: InstanceEntry;
    deleting: boolean;
    item: InstanceItem;
    context: InstanceContext;
    expanded: boolean;
    idx: number;
}

export interface InstanceGenericState {
    openSelectCompactGroup: boolean;

    openDialog: boolean;
    openDialogCron: boolean;
    openDialogSchedule: boolean;
    openDialogName: boolean;
    openDialogLogLevel: boolean;
    openDialogDelete: number | boolean;
    openDialogMemoryLimit: boolean;
    openDialogHost: boolean;
    openDialogCompact: boolean;
    openDialogTier: boolean;

    showLinks: boolean;
    showStopAdminDialog: string | false;
    logLevel: ioBroker.LogLevel;
    logOnTheFly: boolean;
    compactGroup: string | number;
    maxCompactGroupNumber: number;
    tier: 1 | 2 | 3;
    host: string;
    deleteCustom: boolean;
    visibleEdit: boolean;
}

export default abstract class InstanceGeneric<TProps extends InstanceGenericProps, TState extends InstanceGenericState> extends Component<TProps, TState> {
    // eslint-disable-next-line react/no-unused-class-component-methods
    getDefaultState(props: TProps): InstanceGenericState {
        return {
            openDialog: false,
            openSelectCompactGroup: false,
            openDialogCron: false,
            openDialogSchedule: false,
            openDialogName: false,
            openDialogLogLevel: false,
            openDialogDelete: false,
            openDialogMemoryLimit: false,
            openDialogHost: false,
            openDialogCompact: false,
            openDialogTier: false,
            showLinks: false,
            showStopAdminDialog: false,
            logLevel: props.item.logLevel,
            logOnTheFly: false,
            compactGroup: props.item.compactGroup || 0,
            maxCompactGroupNumber: props.context.maxCompactGroupNumber,
            tier: props.item.tier,
            host: props.instance.host,
            deleteCustom: false,
            visibleEdit: false,
        };
    }

    static isCompact(obj: ioBroker.InstanceObject | null): boolean {
        return obj?.common?.runAsCompactMode || false;
    }

    isSentry(): boolean {
        return !!this.props.context.states[`system.adapter.${this.props.instance.id}.plugins.sentry.enabled`]?.val;
    }

    static getSchedule(obj: ioBroker.InstanceObject | null): string {
        return obj?.common?.schedule || '';
    }

    static isRunning(obj: ioBroker.InstanceObject): boolean {
        return obj?.common?.onlyWWW || obj?.common?.enabled;
    }

    static isCompactGroup(obj: ioBroker.InstanceObject): number | null {
        return obj?.common?.compactGroup || null;
    }

    static getSentrySettings(obj: ioBroker.InstanceObject): boolean {
        // @ts-expect-error will be fixed in js-controller
        return !!obj?.common?.plugins?.sentry;
    }

    static isModeSchedule(obj: ioBroker.InstanceObject): boolean {
        return obj?.common?.mode === 'schedule';
    }

    static getMemoryLimitMB(obj: ioBroker.InstanceObject): number {
        return obj?.common?.memoryLimitMB || 0;
    }

    static getRestartSchedule(obj: ioBroker.InstanceObject): string {
        return obj?.common?.restartSchedule ? obj.common.restartSchedule : '';
    }

    async setCommonValue(id: string, common: Partial<ioBroker.InstanceCommon>): Promise<void> {
        try {
            this.props.context.socket.extendObject(id, { common });
        } catch (error) {
            window.alert(error);
        }
    }

    toggleSentry(): void {
        const sentryEnabled = !this.isSentry();
        this.props.context.socket.setState(`system.adapter.${this.props.instance.id}.plugins.sentry.enabled`, sentryEnabled, true)
            .catch(e => window.alert(`Cannot set sentry: ${e}`));
    }

    setTier(instance: InstanceEntry, tier: 1 | 2 | 3): void {
        this.setCommonValue(`system.adapter.${instance.id}`, { tier });
    }

    setName(instance: InstanceEntry, value: string) {
        // @ts-expect-error will be fixed in js-controller
        this.setCommonValue(`system.adapter.${instance.id}`, { titleLang: value });
    }

    setLogLevel(instance: InstanceEntry, loglevel: ioBroker.LogLevel, logOnTheFlyValue: boolean): void {
        if (logOnTheFlyValue) {
            this.props.context.socket.setState(`system.adapter.${instance.id}.logLevel`, loglevel);
        } else {
            this.setCommonValue(`system.adapter.${instance.id}`, { loglevel });
        }
    }

    setSchedule(instance: InstanceEntry, schedule: string | null): void {
        if (schedule) {
            this.setCommonValue(`system.adapter.${instance.id}`, { schedule });
        } else {
            this.props.context.socket.getObject(`system.adapter.${instance.id}`)
                .then(obj => {
                    if (obj.common.schedule !== '') {
                        obj.common.schedule = '';
                        this.props.context.socket.setObject(obj._id, obj)
                            .catch(e => window.alert(`Cannot set schedule: ${e}`));
                    }
                })
                .catch(e => window.alert(`Cannot set schedule: ${e}`));
        }
    }

    setMemoryLimitMB(instance: InstanceEntry, memoryLimitMB: number) {
        this.setCommonValue(`system.adapter.${instance.id}`, { memoryLimitMB });
    }

    toggleCompactMode() {
        this.setCommonValue(`system.adapter.${this.props.instance.id}`, { runAsCompactMode: !InstanceGeneric.isCompact(this.props.instance.obj) });
    }

    setRestartSchedule(instance: InstanceEntry, restartSchedule: string) {
        if (restartSchedule) {
            this.setCommonValue(`system.adapter.${instance.id}`, { restartSchedule });
        } else {
            this.props.context.socket.getObject(`system.adapter.${instance.id}`)
                .then(obj => {
                    if (obj.common.restartSchedule !== '') {
                        obj.common.restartSchedule = '';
                        this.props.context.socket.setObject(obj._id, obj);
                    }
                });
        }
    }

    setHost(instance: InstanceEntry, host: string) {
        this.setCommonValue(`system.adapter.${instance.id}`, { host });
    }

    setCompactGroup(instance: InstanceEntry, compactGroup: string | number) {
        compactGroup = compactGroup === 'controller' ? 0 : compactGroup === 'default' ? 1 : parseInt(compactGroup as string, 10);

        this.setCommonValue(`system.adapter.${instance.id}`, { compactGroup });
        if (this.props.context.maxCompactGroupNumber < compactGroup) {
            this.props.context.setMaxCompactGroupNumber(compactGroup);
        }
    }

    getMemory(): number {
        const state = this.props.context.states[`${this.props.id}.memRss`];
        return (state?.val as number) || 0;
    }

    renderDeleteDialog() {
        return <Dialog
            onClose={() => this.setState({ openDialogDelete: false, openDialog: false })}
            open={!0}
        >
            <DialogTitle>{this.props.context.t('Please confirm')}</DialogTitle>
            <DialogContent>
                {this.state.openDialogDelete === 1 ?
                    this.props.context.t('Are you sure you want to delete the instance "%s" or whole adapter "%s"?', this.props.instance.id, this.props.instance.id.split('.')[0]) :
                    this.props.context.t('Are you sure you want to delete the instance %s?', this.props.instance.id)}
                {this.props.context.deleteCustomSupported && this.props.instance.obj.common.supportCustoms && <br />}
                {this.props.context.deleteCustomSupported && this.props.instance.obj.common.supportCustoms && <FormControlLabel
                    control={<Checkbox checked={this.state.deleteCustom} onChange={e => this.setState({ deleteCustom: e.target.checked })} />}
                    label={this.props.context.t('Delete all custom object settings of this adapter too')}
                />}
            </DialogContent>
            <DialogActions>
                {this.state.openDialogDelete === 1 ? <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                        this.props.context.onDeleteInstance(this.props.instance, this.state.deleteCustom, true);
                        this.setState({ deleteCustom: false, openDialogDelete: false, openDialog: false });
                    }}
                    variant="contained"
                    style={{ background: 'red', color: 'white' }}
                >
                    {this.props.context.t('Delete adapter')}
                </Button> : null}
                <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                        this.props.context.onDeleteInstance(this.props.instance, this.state.deleteCustom);
                        this.setState({ deleteCustom: false, openDialogDelete: false, openDialog: false });
                    }}
                    variant="contained"
                    color="primary"
                >
                    {this.props.context.t('Delete instance')}
                </Button>
                <Button
                    // @ts-expect-error grey is valid color
                    color="grey"
                    onClick={() => this.setState({ openDialogDelete: false, openDialog: false })}
                    variant="contained"
                    startIcon={<CloseIcon />}
                >
                    {this.props.context.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    renderEditNameDialog() {
        return <CustomModal
            title={this.props.context.t('Enter title for %s', this.props.instance.id)}
            disableApplyIfNotChanged
            textInput
            defaultValue={BasicUtils.getText(this.props.item.name, this.props.context.lang)}
            onApply={value => {
                this.setName(this.props.instance, value.toString());
                this.setState({ openDialogName: false, openDialog: false });
            }}
            onClose={() => this.setState({ openDialogName: false, openDialog: false })}
        />;
    }

    renderEditLogLevelDialog() {
        return <CustomModal
            title={this.props.context.t('Edit log level rule for %s', this.props.instance.id)}
            onApply={() => {
                this.setLogLevel(this.props.instance, this.state.logLevel, this.state.logOnTheFly);
                this.setState({ openDialogLogLevel: false, openDialog: false });
            }}
            disableApply={this.state.logLevel === this.props.item.logLevel}
            onClose={() => this.setState({ openDialogLogLevel: false, logLevel: this.props.item.logLevel, openDialog: false })}
        >
            <FormControl className={this.props.classes.logLevel} variant="standard">
                <InputLabel>{this.props.context.t('log level')}</InputLabel>
                <Select
                    variant="standard"
                    value={this.state.logLevel}
                    fullWidth
                    onChange={el => this.setState({ logLevel: el.target.value as ioBroker.LogLevel })}
                >
                    {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                        {this.props.context.t(el)}
                    </MenuItem>)}
                </Select>
            </FormControl>
            <FormControl className={this.props.classes.formControl} variant="outlined">
                <FormControlLabel
                    control={<Checkbox
                        checked={this.state.logOnTheFly}
                        onChange={e => this.setState({ logOnTheFly: e.target.checked })}
                    />}
                    label={this.props.context.t('Without restart')}
                />
                <FormHelperText>{this.state.logOnTheFly ? this.props.context.t('Will be reset to the saved log level after restart of adapter') : this.props.context.t('Log level will be saved permanently')}</FormHelperText>
            </FormControl>
        </CustomModal>;
    }

    renderEditMemoryLimitDialog() {
        return <CustomModal
            title={this.props.context.t('Edit memory limit rule for %s', this.props.instance.id)}
            onApply={value => {
                this.setMemoryLimitMB(this.props.instance, parseFloat(value.toString()) || 0);
                this.setState({ openDialogMemoryLimit: false, openDialog: false });
            }}
            disableApplyIfNotChanged
            textInput
            defaultValue={this.props.item.memoryLimitMB}
            help={this.props.context.t('Default V8 has a memory limit of 512mb on 32-bit systems, and 1gb on 64-bit systems. The limit can be raised by setting --max-old-space-size to a maximum of ~1gb (32-bit) and ~1.7gb (64-bit)')}
            onClose={() => this.setState({ openDialogMemoryLimit: false, openDialog: false })}
        />;
    }

    renderEditHostDialog() {
        return <CustomModal
            title={this.props.context.t('Edit host for %s', this.props.instance.id)}
            onApply={() => {
                this.setHost(this.props.instance, this.state.host);
                this.setState({ openDialogHost: false, openDialog: false });
            }}
            disableApply={this.state.host === this.props.instance.host}
            onClose={() => this.setState({ openDialogHost: false, host: this.props.instance.host, openDialog: false })}
        >
            <SelectWithIcon
                themeType={this.props.context.themeType}
                value={this.state.host}
                list={this.props.context.hosts}
                removePrefix="system.host."
                fullWidth
                className={this.props.classes.hostInfo}
                onChange={(host: string) => this.setState({ host })}
                lang={this.props.context.lang}
                t={this.props.context.t}
            />
        </CustomModal>;
    }

    renderEditCompactGroupDialog() {
        return <CustomModal
            title={this.props.context.t('Edit compact groups for %s', this.props.instance.id)}
            onApply={() => {
                this.setCompactGroup(this.props.instance, parseInt(this.state.compactGroup.toString(), 10) || 0);
                this.setState({ openDialogCompact: false, openDialog: false });
            }}
            disableApply={this.state.compactGroup === this.props.item.compactGroup}
            onClose={() => this.setState({
                openDialogCompact: false,
                openDialog: false,
                compactGroup: this.props.item.compactGroup,
                maxCompactGroupNumber: this.props.context.maxCompactGroupNumber,
            })}
        >
            <FormControl className={this.props.classes.addCompact} variant="standard">
                <InputLabel>{this.props.context.t('compact groups')}</InputLabel>
                <Select
                    variant="standard"
                    autoWidth
                    onClose={() => this.setState({ openSelectCompactGroup: false })}
                    onOpen={() => this.setState({ openSelectCompactGroup: true })}
                    open={this.state.openSelectCompactGroup}
                    value={(this.state.compactGroup === 1 ? 'default' : ((this.state.compactGroup || '').toString() === '0' ? 'controller' : (!this.state.compactGroup ? 'default' : this.state.compactGroup))) || 'default'}
                    onChange={el => this.setState({ compactGroup: parseInt(el.target.value as string, 10) })}
                >
                    <div
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className={this.props.classes.selectStyle}
                    >
                        <Button
                            // @ts-expect-error grey is valid color
                            color="grey"
                            onClick={() => this.setState({
                                openSelectCompactGroup: false,
                                compactGroup: this.state.maxCompactGroupNumber + 1,
                                maxCompactGroupNumber: this.state.maxCompactGroupNumber + 1,
                            })}
                            variant="outlined"
                            stylevariable="outlined"
                        >
                            {this.props.context.t('Add compact group')}
                        </Button>
                    </div>
                    <MenuItem value="controller">
                        {this.props.context.t('with controller')}
                    </MenuItem>
                    <MenuItem value="default">
                        {this.props.context.t('default group')}
                    </MenuItem>
                    {Array(this.state.maxCompactGroupNumber - 1)
                        .fill(0)
                        .map((_, idx) => <MenuItem key={idx} value={(idx + 2).toString()}>
                            {idx + 2}
                        </MenuItem>)}
                </Select>
            </FormControl>
        </CustomModal>;
    }

    renderEditTierDialog() {
        return <CustomModal
            title={this.props.context.t('Set tier for %s', this.props.instance.id)}
            onApply={() => {
                this.setTier(this.props.instance, this.state.tier);
                this.setState({ openDialogTier: false, openDialog: false });
            }}
            help={this.props.context.t('Tiers define the order of adapters when the system starts.')}
            disableApply={this.state.tier === this.props.item.tier}
            onClose={() => this.setState({ openDialogTier: false, tier: this.props.item.tier, openDialog: false })}
        >
            <FormControl className={this.props.classes.logLevel} variant="standard">
                <InputLabel>{this.props.context.t('Tiers')}</InputLabel>
                <Select
                    variant="standard"
                    value={this.state.tier}
                    fullWidth
                    onChange={el => this.setState({ tier: parseInt(el.target.value as string, 10) as (1 | 2 | 3) })}
                >
                    {arrayTier.map(el => <MenuItem key={el.value} value={el.value}>
                        {this.props.context.t(el.desc)}
                    </MenuItem>)}
                </Select>
            </FormControl>
        </CustomModal>;
    }

    renderStopAdminDialog() {
        if (!this.state.showStopAdminDialog) {
            return null;
        }

        return <ConfirmDialog
            title={this.props.context.t('Please confirm')}
            text={this.props.context.t('stop_admin', this.props.context.adminInstance)}
            ok={this.props.context.t('Stop admin')}
            onClose={result => {
                result && this.setCommonValue(this.state.showStopAdminDialog as string, { enabled: false });
                this.setState({ showStopAdminDialog: false });
            }}
        />;
    }

    renderLinksDialog() {
        if (!this.state.showLinks) {
            return null;
        }
        return <LinksDialog
            image={this.props.instance.image}
            instanceId={this.props.instance.id}
            links={this.props.instance.links}
            onClose={() => this.setState({ showLinks: false })}
            t={this.props.context.t}
            themeType={this.props.context.themeType}
        />;
    }

    renderCronDialog() {
        return <ComplexCron
            title={this.props.context.t('Edit restart rule for %s', this.props.instance.id)}
            clearButton
            cron={InstanceGeneric.getRestartSchedule(this.props.instance.obj)}
            onOk={(cron: string) => this.setRestartSchedule(this.props.instance, cron)}
            onClose={() => this.setState({ openDialogCron: false, openDialog: false })}
        />;
    }

    renderScheduleDialog() {
        return <ComplexCron
            title={this.props.context.t('Edit schedule rule for %s', this.props.instance.id)}
            clearButton
            cron={InstanceGeneric.getSchedule(this.props.instance.obj)}
            onOk={(cron: string) => this.setSchedule(this.props.instance, cron)}
            onClose={() => this.setState({ openDialogSchedule: false, openDialog: false })}
        />;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDialogs() {
        if (!this.state.openDialog) {
            return null;
        }
        if (this.state.openDialogDelete) {
            return this.renderDeleteDialog();
        }
        if (this.state.openDialogHost) {
            return this.renderEditHostDialog();
        }
        if (this.state.openDialogTier) {
            return this.renderEditTierDialog();
        }
        if (this.state.openDialogCompact) {
            return this.renderEditCompactGroupDialog();
        }
        if (this.state.openDialogLogLevel) {
            return this.renderEditLogLevelDialog();
        }
        if (this.state.openDialogName) {
            return this.renderEditNameDialog();
        }
        if (this.state.showStopAdminDialog) {
            return this.renderStopAdminDialog();
        }
        if (this.state.openDialogCron) {
            return this.renderCronDialog();
        }
        if (this.state.openDialogSchedule) {
            return this.renderScheduleDialog();
        }
        if (this.state.showLinks) {
            return this.renderLinksDialog();
        }
        if (this.state.openDialogMemoryLimit) {
            return this.renderEditMemoryLimitDialog();
        }
        return null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderModeIcon(status: InstanceStatusType) {
        return <div
            className={UtilsCommon.clsx(
                this.props.classes.smallAvatar,
                this.props.classes.statusIndicator,
                this.props.instance.mode === 'daemon' || this.props.instance.mode === 'schedule' ? this.props.classes[status] : this.props.classes.transparent,
                this.props.item.connectedToHost && this.props.item.alive && this.props.item.connected === false && this.props.classes.orangeDevice,
            )}
        >
            {this.getModeIcon(this.props.instance.mode, status, this.props.classes[`statusIcon_${status}`], this.props.item.stoppedWhenWebExtension)}
        </div>;
    }

    getModeIcon(
        mode: ioBroker.InstanceMode,
        status: InstanceStatusType,
        className: string,
        stoppedWhenWebExtension: boolean,
    ): React.JSX.Element | null {
        if (mode === 'daemon') {
            if (stoppedWhenWebExtension) {
                return <div className={UtilsCommon.clsx(className, this.props.classes.okSymbol)}>
                    <div className={this.props.classes.okSymbolInner} />
                </div>;
            } if (status === 'orange') {
                return <WarningIcon className={className} />;
            } if (status === 'green') {
                return <div className={UtilsCommon.clsx(className, this.props.classes.okSymbol)}>
                    <div className={this.props.classes.okSymbolInner} />
                </div>;
            }
            return <SettingsIcon className={className} />;
        }
        if (mode === 'schedule') {
            return <ScheduleIcon className={className} />;
        }
        return null;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderTooltip() {
        const { instance,  item } = this.props;
        let next;
        let prev;
        let cronText;
        if (instance.mode === 'schedule' && instance.schedule) {
            try {
                cronText = cronstrue.toString(instance.schedule, { locale: this.props.context.lang });
            } catch (e) {
                cronText = instance.schedule;
            }

            if (instance.enabled) {
                try {
                    const expr = parser.parseExpression(instance.schedule);
                    next = expr.next().toDate();
                    prev = expr.prev().toDate();
                } catch (e) {
                    next = null;
                    prev = null;
                }
            }
        }

        return [
            item.stoppedWhenWebExtension !== undefined ? <State key={1} state>{this.props.context.t('Runs as web-extension')}</State> : '',
            instance.mode === 'daemon' && this.props.item.stoppedWhenWebExtension === undefined ? <State key={2} state={item.connectedToHost}>{this.props.context.t('Connected to host')}</State> : '',
            instance.mode === 'daemon' && this.props.item.stoppedWhenWebExtension === undefined ? <State key={3} state={item.alive}>{this.props.context.t('Heartbeat')}</State> : '',
            this.props.item.connected !== null && this.props.item.stoppedWhenWebExtension === undefined ? <State key={4} state={!!item.connected}>
                {typeof item.connected === 'string' ? `${this.props.context.t('Connected:')} ${item.connected || '-'}` : this.props.context.t('Connected to device or service')}
            </State> : '',
            cronText ? <State key={5} state={instance.enabled}>
                CRON:
                {cronText}
            </State> : null,
            next ? <State key={6} state>{this.props.context.t('Next start: %s', `${next.toLocaleDateString(this.props.context.lang)} ${next.toLocaleTimeString(this.props.context.lang)}`)}</State> : null,
            prev ? <State key={7} state>{this.props.context.t('Last start: %s', `${prev.toLocaleDateString(this.props.context.lang)} ${prev.toLocaleTimeString(this.props.context.lang)}`)}</State> : null,
        ].filter(el => el);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderMemoryUsage() {
        return this.props.item.running && <InstanceInfo
            icon={<MemoryIcon />}
            tooltip={this.props.context.t('RAM usage')}
        >
            {`${this.props.instance.mode === 'daemon' ? this.getMemory() : '-.--'} MB`}
        </InstanceInfo>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderPlayPause() {
        return <Tooltip title={this.props.context.t('Start/stop')} classes={{ popper: this.props.classes.tooltip }}>
            <div>
                <IconButton
                    size="small"
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (this.props.item.running && this.props.instance.id === this.props.context.adminInstance) {
                            this.setState({ showStopAdminDialog: `system.adapter.${this.props.instance.id}` });
                        } else {
                            this.setCommonValue(`system.adapter.${this.props.instance.id}`, { enabled: !this.props.item.running });
                        }
                    }}
                    onFocus={event => event.stopPropagation()}
                    className={Utils.clsx(this.props.classes.button, this.props.instance.canStart ?
                        (this.props.item.running ? this.props.classes.enabled : this.props.classes.disabled) : this.props.classes.hide)}
                >
                    {this.props.item.running ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderSettingsButton() {
        return <Tooltip
            title={this.props.instance.config ? this.props.context.t('Settings') : ''}
            classes={{ popper: this.props.classes.tooltip }}
        >
            <div>
                <IconButton
                    disabled={!this.props.instance.config}
                    size="small"
                    className={Utils.clsx(this.props.classes.button, !this.props.instance.config && this.props.classes.hiddenOpacity)}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        Router.doNavigate('tab-instances', 'config', this.props.id);
                    }}
                >
                    <BuildIcon />
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRestartButton() {
        return <Tooltip title={this.props.context.t('Restart')} classes={{ popper: this.props.classes.tooltip }}>
            <div>
                <IconButton
                    size="small"
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.props.context.socket.extendObject(`system.adapter.${this.props.instance.id}`, {});
                    }}
                    onFocus={event => event.stopPropagation()}
                    className={Utils.clsx(this.props.classes.button, !this.props.instance.canStart && this.props.classes.hide)}
                    disabled={!this.props.item.running}
                >
                    <RefreshIcon />
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderLink() {
        return <Tooltip title={this.props.context.t('Instance link %s', this.props.instance.id)} classes={{ popper: this.props.classes.tooltip }}>
            <div>
                <IconButton
                    size="small"
                    className={Utils.clsx(this.props.classes.button, (!this.props.instance.links || !this.props.instance.links[0]) && this.props.classes.hide)}
                    disabled={!this.props.item.running}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (this.props.instance.links.length === 1) {
                            // replace http://fe80::ed18:8dyy:f65:cexx:8087/get/ with http://[fe80::ed18:8dyy:f65:cexx]:8087/get/
                            let url = this.props.instance.links[0].link;
                            url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//$1$2/');
                            window.open(url, this.props.instance.id);
                        } else {
                            this.setState({ showLinks: true });
                        }
                    }}
                    onFocus={event => event.stopPropagation()}
                >
                    <InputIcon />
                </IconButton>
            </div>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderEditNameButton() {
        return <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                size="small"
                className={Utils.clsx(this.props.classes.button, !this.state.visibleEdit && this.props.classes.hiddenOpacity)}
                onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.setState({ openDialogName: true, openDialog: true });
                }}
            >
                <EditIcon />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderInputOutput() {
        return <InstanceInfo
            icon={<ImportExportIcon />}
            tooltip={this.props.context.t('events')}
        >
            <div className={this.props.classes.displayFlex}>
                <Tooltip title={this.props.context.t('input events')} classes={{ popper: this.props.classes.tooltip }}>
                    <div className={this.props.classes.marginRight5}>
                        ⇥
                        {this.props.item.inputOutput.stateInput}
                    </div>
                </Tooltip>
                /
                <Tooltip title={this.props.context.t('output events')} classes={{ popper: this.props.classes.tooltip }}>
                    <div className={this.props.classes.marginLeft5}>
                        ↦
                        {this.props.item.inputOutput.stateOutput}
                    </div>
                </Tooltip>
            </div>
        </InstanceInfo>;
    }

    renderHost() {
        return <TextWithIcon
            value={this.props.instance.host}
            list={this.props.context.hosts}
            removePrefix="system.host."
            themeType={this.props.context.themeType}
            lang={this.props.context.lang}
        />;
    }

    renderEditHostButton() {
        return <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                size="small"
                className={this.props.classes.button}
                onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.setState({ openDialogHost: true, openDialog: true });
                }}
            >
                <EditIcon />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderSentry() {
        return <Tooltip
            title="sentry"
            classes={{ popper: this.props.classes.tooltip }}
        >
            <IconButton
                size="small"
                className={this.props.classes.button}
                onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.toggleSentry();
                }}
            >
                <CardMedia
                    className={Utils.clsx(this.props.classes.sentry, !this.props.item.sentry && this.props.classes.contrast0)}
                    component="img"
                    image={this.props.item.sentry ? sentry : noSentry}
                />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderCompactGroupEnabled() {
        return <Tooltip title={this.props.context.t('compact groups')} classes={{ popper: this.props.classes.tooltip }}>
            <IconButton
                size="small"
                className={Utils.clsx(this.props.classes.button, this.props.context.expertMode && this.props.item.checkCompact ? null : this.props.classes.hide)}
                onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.toggleCompactMode();
                }}
            >
                <ViewCompactIcon color={this.props.item.compact ? 'primary' : 'inherit'} />
            </IconButton>
        </Tooltip>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderVersion() {
        return <InstanceInfo tooltip={this.props.context.t('Installed')}>
            v
            {this.props.instance.version}
        </InstanceInfo>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderInfo() {
        return <>
            <span className={this.props.classes.instanceName}>{this.props.instance.id}</span>
            {this.props.item.stoppedWhenWebExtension !== undefined &&
                <State state={this.props.item.stoppedWhenWebExtension}>{this.props.context.t('Runs as web-extension')}</State>}
            {this.props.item.running && this.props.instance.mode === 'daemon' && this.props.item.stoppedWhenWebExtension === undefined &&
                <State state={this.props.item.connectedToHost}>{this.props.context.t('Connected to host')}</State>}
            {this.props.item.running && this.props.instance.mode === 'daemon' && this.props.item.stoppedWhenWebExtension === undefined &&
                <State state={this.props.item.alive}>{this.props.context.t('Heartbeat')}</State>}
            {this.props.item.running && this.props.item.connected !== null  && this.props.item.stoppedWhenWebExtension === undefined &&
                <State state={!!this.props.item.connected}>
                    {typeof this.props.item.connected === 'string' ? `${this.props.context.t('Connected:')} ${this.props.item.connected || '-'}` : this.props.context.t('Connected to device or service')}
                </State>}
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderLogLevel() {
        return <>
            <InstanceInfo
                icon={this.props.item.loglevelIcon}
                tooltip={this.props.item.logLevelObject === this.props.item.logLevel ? `${this.props.context.t('loglevel')} ${this.props.item.logLevel}` : `${this.props.context.t('saved:')} ${this.props.item.logLevelObject} / ${this.props.context.t('actual:')} ${this.props.item.logLevel}`}
                // className={this.props.classes[ this.props.item.logLevel]}
            >
                {this.props.item.logLevelObject === this.props.item.logLevel ? this.props.item.logLevel : `${this.props.item.logLevelObject} / ${this.props.item.logLevel}`}
            </InstanceInfo>
            <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogLogLevel: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip>
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderSchedule() {
        return <>
            <InstanceInfo icon={<ScheduleIcon />} tooltip={this.props.context.t('schedule_group')}>
                {InstanceGeneric.getSchedule(this.props.instance.obj) || '-'}
            </InstanceInfo>
            <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogSchedule: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip>
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRestartSchedule() {
        return <>
            <InstanceInfo
                icon={<ScheduleIcon className={this.props.classes.scheduleIcon} />}
                tooltip={this.props.context.t('restart')}
            >
                {InstanceGeneric.getRestartSchedule(this.props.instance.obj) || '-'}
            </InstanceInfo>
            <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogCron: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip>
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderRamLimit() {
        return <>
            <InstanceInfo
                icon={<MemoryIcon className={this.props.classes.memoryIcon} />}
                tooltip={this.props.context.t('RAM limit')}
            >
                {`${this.props.item.memoryLimitMB ? this.props.item.memoryLimitMB : '-.--'} MB`}
            </InstanceInfo>
            <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogMemoryLimit: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip>
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderCompactGroup() {
        return <>
            <InstanceInfo
                icon={<ViewCompactIcon className={this.props.classes.marginRight5} color="inherit" />}
                tooltip={this.props.context.t('compact groups')}
            >
                {(this.props.item.compactGroup === 1 ?
                    'default' :
                    ((this.props.item.compactGroup || '').toString() === '0' ? 'controller' : (!this.props.item.compactGroup ? 'default' : this.props.item.compactGroup))).toString() || 'default'}
            </InstanceInfo>
            <Tooltip title={this.props.context.t('Edit')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogCompact: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip>
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderTier() {
        return <>
            <InstanceInfo
                icon={<LowPriorityIcon className={this.props.classes.marginRight5} color="inherit" />}
                tooltip={this.props.context.t('Start order (tier)')}
            >
                {this.props.instance.adapter === 'admin' ? this.props.context.t('Always first') : this.props.context.t(arrayTier.find(el => el.value === this.props.item.tier)?.desc || arrayTier[2].desc)}
            </InstanceInfo>
            {this.props.instance.adapter !== 'admin' ? <Tooltip title={this.props.context.t('Edit start order (tier)')} classes={{ popper: this.props.classes.tooltip }}>
                <IconButton
                    size="small"
                    className={this.props.classes.button}
                    onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        this.setState({ openDialogTier: true, openDialog: true });
                    }}
                >
                    <EditIcon />
                </IconButton>
            </Tooltip> : null}
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderHostWithButton() {
        return <>
            <InstanceInfo
                icon={<HostIcon className={this.props.classes.marginRight5} />}
                tooltip={this.props.context.t('Host for this instance')}
            >
                {this.renderHost()}
            </InstanceInfo>
            {this.renderEditHostButton()}
        </>;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    renderDeleteButton() {
        return <Tooltip title={this.props.context.t('Delete')}>
            <IconButton
                size="small"
                className={this.props.classes.button}
                onClick={async event => {
                    event.stopPropagation();
                    event.preventDefault();
                    // Count the number of instances
                    const instances = await this.props.context.socket.getAdapterInstances(this.props.instance.id.split('.')[0]);
                    this.setState({ openDialogDelete: instances.length || true, openDialog: true });
                }}
            >
                <DeleteIcon />
            </IconButton>
        </Tooltip>;
    }
}
