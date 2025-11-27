import React, { Component, type JSX } from 'react';
import moment from 'moment';

import 'moment/locale/de';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/it';
import 'moment/locale/nl';
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/ru';
import 'moment/locale/uk';
import 'moment/locale/zh-cn';

import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormControl,
    FormControlLabel,
    Grid2,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
} from '@mui/material';

import { Close as IconClose, Check as IconCheck, Add as IconAdd, FileCopy as IconCopy } from '@mui/icons-material';

import { FaClipboard as IconCopyClipboard } from 'react-icons/fa';

import {
    Utils,
    I18n,
    DialogSelectID,
    IconFx,
    UploadImage,
    type Connection,
    type AdminConnection,
    type Translate,
    type ThemeType,
    type IobTheme,
    Icon,
    iobUriParse,
    iobUriRead,
    type IobUri,
    setAttrInObject,
    getAttrInObject,
} from '@iobroker/adapter-react-v5';
import { JsonConfigComponent, type ConfigItemPanel, type ConfigItemTabs } from '@iobroker/json-config';

import Editor from '../Editor';

const styles: Record<string, any> = {
    divWithoutTitle: {
        width: '100%',
        height: '100%',
        border: '2px solid #00000000',
    },
    divWithoutTitleAndTab: {
        height: 'calc(100% - 48px)',
    },
    error: {
        border: '2px solid #FF0000',
    },
    id: {
        fontStyle: 'italic',
    },
    dialog: {
        height: 'calc(100% - 64px)',
    },
    aliasIdEdit: {
        width: 400 - 32,
    },
    button: {
        marginTop: 20,
        marginLeft: 8,
    },
    funcDivEdit: {
        width: '100%',
    },
    funcEditName: {
        display: 'inline-block',
        width: 85,
    },
    funcEdit: {
        width: 400,
    },
    funcIcon: {
        width: 16,
        height: 16,
    },
    marginTop: {
        marginTop: 20,
    },
    commonTabWrapper: {
        flexFlow: 'wrap',
        display: 'flex',
        gap: 8,
    },
    commonWrapper: {
        width: 500,
        minWidth: 300,
    },
    flexDrop: {
        width: '100%',
        maxWidth: 500,
        margin: 'auto',
        display: 'flex',
    },
    marginBlock: {
        marginTop: 20,
    },
    buttonAdd: {
        minWidth: 150,
    },
    textField: {
        width: '100%',
    },
    flex: {
        display: 'flex',
        '& > div': {
            mr: '8px',
        },
    },
    close: {
        width: '20px',
        height: '20px',
        opacity: '0.9',
        cursor: 'pointer',
        position: 'relative',
        top: 20,
        marginTop: '10px',
        transition: 'all 0.6s ease',
        '&:hover': {
            transform: 'rotate(90deg)',
        },
        '&:before': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(45deg)',
        },
        '&:after': {
            position: 'absolute',
            left: '9px',
            content: '""',
            height: '20px',
            width: '3px',
            backgroundColor: '#ff4f4f',
            transform: 'rotate(-45deg)',
        },
    },
    color: {
        width: 70,
    },
    buttonRemoveWrapper: {
        position: 'absolute',
        zIndex: 222,
        right: 0,
    },
    tabsPadding: {
        padding: '0px 24px',
    },
    wrapperButton: {
        '@media screen and (max-width: 465px)': {
            '& *': {
                fontSize: 10,
            },
        },
        '@media screen and (max-width: 380px)': {
            '& *': {
                fontSize: 9,
            },
        },
    },
    commonDeleteTip: {
        color: '#fa4a4a',
    },
    typeNameEng: {
        marginLeft: 8,
        opacity: 0.7,
        fontStyle: 'italic',
        fontSize: 'smaller',
    },
    tooltip: {
        pointerEvents: 'none',
    },
    stateRow: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: 3,
    },
    stateTitle: {
        minWidth: 150,
        fontWeight: 'bold',
    },
    stateUnit: {
        opacity: 0.7,
        marginLeft: 4,
    },
    stateValue: {
        animation: 'newStateEditorAnimation 2s ease-in-out',
    },
    stateTime: {
        fontStyle: 'italic',
    },
    stateImage: {
        maxWidth: 200,
        maxHeight: 200,
    },
};

function valueBlink(theme: IobTheme, color: string): any {
    return {
        '@keyframes newStateEditorAnimation': {
            '0%': {
                color: theme.palette.mode === 'dark' ? '#27cf00' : '#174e00',
            },
            '100%': {
                color: color || (theme.palette.mode === 'dark' ? '#ffffff' : '#000000'),
            },
        },
    };
}

export const DEFAULT_ROLES: { role: string; type?: ioBroker.CommonType; w?: boolean; r?: boolean }[] = [
    { role: 'button', type: 'boolean', r: false, w: true },
    { role: 'button.close.blind', type: 'boolean', r: false, w: true },
    { role: 'button.fastforward', type: 'boolean', r: false, w: true },
    { role: 'button.forward', type: 'boolean', r: false, w: true },
    { role: 'button.long', type: 'boolean', r: false, w: true },
    { role: 'button.mode', type: 'boolean', r: false, w: true },
    { role: 'button.mode.auto', type: 'boolean', r: false, w: true },
    { role: 'button.mode.silent', type: 'boolean', r: false, w: true },
    { role: 'button.next', type: 'boolean', r: false, w: true },
    { role: 'button.open.blind', type: 'boolean', r: false, w: true },
    { role: 'button.open.door', type: 'boolean', r: false, w: true },
    { role: 'button.pause', type: 'boolean', r: false, w: true },
    { role: 'button.stop', type: 'boolean', r: false, w: true },
    { role: 'button.stop.tilt', type: 'boolean', r: false, w: true },
    { role: 'button.volume.up', type: 'boolean', r: false, w: true },
    { role: 'chart', type: 'string' },
    { role: 'date', type: 'string' },
    { role: 'date', type: 'number' },
    { role: 'date.end', type: 'string' },
    { role: 'date.end', type: 'number' },
    { role: 'date.forecast.1', type: 'string' },
    { role: 'date.start', type: 'string' },
    { role: 'date.start', type: 'number' },
    { role: 'date.sunrise', type: 'string' },
    { role: 'date.sunrise', type: 'number' },
    { role: 'date.sunset', type: 'string' },
    { role: 'date.sunset', type: 'number' },
    { role: 'dayofweek', type: 'number' },
    { role: 'html', type: 'string' },
    { role: 'indicator', type: 'boolean', w: false },
    { role: 'indicator.alarm', type: 'boolean', w: false },
    { role: 'indicator.alarm.fire', type: 'boolean', w: false },
    { role: 'indicator.alarm.flood', type: 'boolean', w: false },
    { role: 'indicator.alarm.health', type: 'boolean', w: false },
    { role: 'indicator.alarm.secure', type: 'boolean', w: false },
    { role: 'indicator.connected', type: 'boolean', w: false },
    { role: 'indicator.maintenance', type: 'boolean', w: false },
    { role: 'indicator.maintenance.alarm', type: 'boolean', w: false },
    { role: 'indicator.maintenance.lowbat', type: 'boolean', w: false },
    { role: 'indicator.maintenance.waste', type: 'boolean', w: false },
    { role: 'indicator.reachable', type: 'boolean', w: false },
    { role: 'info.address', type: 'string', w: false },
    { role: 'info.display', type: 'string', w: false },
    { role: 'info.firmware', type: 'string', w: false },
    { role: 'info.hardware', type: 'string', w: false },
    { role: 'info.ip', type: 'string', w: false },
    { role: 'info.mac', type: 'string', w: false },
    { role: 'info.name', type: 'string', w: false },
    { role: 'info.port', type: 'string', w: false },
    { role: 'info.port', type: 'number', w: false },
    { role: 'info.serial', type: 'string', w: false },
    { role: 'info.standby', type: 'string', w: false },
    { role: 'info.status', w: false },
    { role: 'json', type: 'string' },
    { role: 'level', type: 'number', w: true },
    { role: 'level.bass', type: 'number', w: true },
    { role: 'level.blind', type: 'number', w: true },
    { role: 'level.color.blue', type: 'number', w: true },
    { role: 'level.color.hue', type: 'number', w: true },
    { role: 'level.color.luminance', type: 'number', w: true },
    { role: 'level.color.red', type: 'number', w: true },
    { role: 'level.color.saturation', type: 'number', w: true },
    { role: 'level.curtain', type: 'number', w: true },
    { role: 'level.mode.airconditioner', type: 'number', w: true },
    { role: 'level.mode.cleanup', type: 'number', w: true },
    { role: 'level.mode.fan', type: 'number', w: true },
    { role: 'level.mode.swing', type: 'number', w: true },
    { role: 'level.mode.thermostat', type: 'number', w: true },
    { role: 'level.mode.work', type: 'number', w: true },
    { role: 'level.temperature', type: 'number', w: true },
    { role: 'level.tilt', type: 'number', w: true },
    { role: 'level.timer', type: 'number', w: true },
    { role: 'level.treble', type: 'number', w: true },
    { role: 'level.valve', type: 'number', w: true },
    { role: 'level.volume', type: 'number', w: true },
    { role: 'level.volume.group', type: 'number', w: true },
    { role: 'list', type: 'string' },
    { role: 'list', type: 'array' },
    { role: 'location', type: 'string' },
    { role: 'media.add', type: 'string' },
    { role: 'media.bitrate', type: 'string' },
    { role: 'media.bitrate', type: 'number' },
    { role: 'media.broadcastDate', type: 'string' },
    { role: 'media.browser', type: 'string' },
    { role: 'media.clear', type: 'boolean' },
    { role: 'media.content', type: 'string' },
    { role: 'media.cover', type: 'string' },
    { role: 'media.cover.big', type: 'string' },
    { role: 'media.cover.small', type: 'string' },
    { role: 'media.date', type: 'string' },
    { role: 'media.duration', type: 'number' },
    { role: 'media.duration', type: 'string' },
    { role: 'media.duration.text', type: 'string' },
    { role: 'media.elapsed', type: 'number' },
    { role: 'media.elapsed', type: 'string' },
    { role: 'media.elapsed.text', type: 'string' },
    { role: 'media.episode', type: 'number' },
    { role: 'media.episode', type: 'string' },
    { role: 'media.genre', type: 'string' },
    { role: 'media.input', type: 'string' },
    { role: 'media.jump', type: 'string' },
    { role: 'media.link', type: 'string' },
    { role: 'media.mode.repeat', type: 'string' },
    { role: 'media.mode.shuffle', type: 'string' },
    { role: 'media.mute', type: 'string' },
    { role: 'media.mute.group', type: 'string' },
    { role: 'media.playid', type: 'string' },
    { role: 'media.playlist', type: 'string' },
    { role: 'media.season', type: 'string' },
    { role: 'media.seek', type: 'string' },
    { role: 'media.state', type: 'string' },
    { role: 'media.titel', type: 'string' },
    { role: 'media.track', type: 'string' },
    { role: 'media.tts', type: 'string' },
    { role: 'media.url', type: 'string' },
    { role: 'media.url.announcement', type: 'string' },
    { role: 'medien.artist', type: 'string' },
    { role: 'sensor.alarm', type: 'boolean', w: false },
    { role: 'sensor.alarm.fire', type: 'boolean', w: false },
    { role: 'sensor.alarm.flood', type: 'boolean', w: false },
    { role: 'sensor.alarm.power', type: 'boolean', w: false },
    { role: 'sensor.alarm.secure', type: 'boolean', w: false },
    { role: 'sensor.door', type: 'boolean', w: false },
    { role: 'sensor.light', type: 'boolean', w: false },
    { role: 'sensor.lock', type: 'boolean', w: false },
    { role: 'sensor.motion', type: 'boolean', w: false },
    { role: 'sensor.noise', type: 'boolean', w: false },
    { role: 'sensor.rain', type: 'boolean', w: false },
    { role: 'sensor.window', type: 'boolean', w: false },
    { role: 'state', type: 'mixed' },
    { role: 'switch', type: 'boolean', w: true },
    { role: 'switch.enable', type: 'boolean', w: true },
    { role: 'switch.gate', type: 'boolean', w: true },
    { role: 'switch.gate', type: 'boolean', w: true },
    { role: 'switch.light', type: 'boolean', w: true },
    { role: 'switch.lock.door', type: 'boolean', w: true },
    { role: 'switch.lock.window', type: 'boolean', w: true },
    { role: 'switch.mode', type: 'boolean', w: true },
    { role: 'switch.mode.auto', type: 'boolean', w: true },
    { role: 'switch.mode.boost', type: 'boolean', w: true },
    { role: 'switch.mode.color', type: 'boolean', w: true },
    { role: 'switch.mode.manual', type: 'boolean', w: true },
    { role: 'switch.mode.moonlight', type: 'boolean', w: true },
    { role: 'switch.mode.party', type: 'boolean', w: true },
    { role: 'switch.mode.silent', type: 'boolean', w: true },
    { role: 'switch.power', type: 'boolean', w: true },
    { role: 'switch.power.zone', type: 'boolean', w: true },
    { role: 'text', type: 'string' },
    { role: 'text.phone', type: 'string' },
    { role: 'text.url', type: 'string' },
    { role: 'url', type: 'string' },
    { role: 'url.audio', type: 'string' },
    { role: 'url.blank', type: 'string' },
    { role: 'url.cam', type: 'string' },
    { role: 'url.same', type: 'string' },
    { role: 'value', type: 'number', w: false },
    { role: 'value.battery', type: 'number', w: false },
    { role: 'value.blind', type: 'number', w: false },
    { role: 'value.blood.sugar', type: 'number', w: false },
    { role: 'value.brightness', type: 'number', w: false },
    { role: 'value.clouds', type: 'number', w: false },
    { role: 'value.current', type: 'number', w: false },
    { role: 'value.curtain', type: 'number', w: false },
    { role: 'value.default', type: 'number', w: false },
    { role: 'value.direction', type: 'number', w: false },
    { role: 'value.direction.max.wind', type: 'number', w: false },
    { role: 'value.direction.min.wind', type: 'number', w: false },
    { role: 'value.direction.wind', type: 'number', w: false },
    { role: 'value.direction.wind.forecast.0', type: 'number', w: false },
    { role: 'value.direction.wind.forecast.1', type: 'number', w: false },
    { role: 'value.distance', type: 'number', w: false },
    { role: 'value.fill', type: 'number', w: false },
    { role: 'value.gate', type: 'number', w: false },
    { role: 'value.gps', type: 'number', w: false },
    { role: 'value.gps.accuracy', type: 'number', w: false },
    { role: 'value.gps.elevation', type: 'number', w: false },
    { role: 'value.gps.latitude', type: 'number', w: false },
    { role: 'value.gps.longitude', type: 'number', w: false },
    { role: 'value.gps.radius', type: 'number', w: false },
    { role: 'value.health.bmi', type: 'number', w: false },
    { role: 'value.health.bpm', type: 'number', w: false },
    { role: 'value.health.calories', type: 'number', w: false },
    { role: 'value.health.fat', type: 'number', w: false },
    { role: 'value.health.steps', type: 'number', w: false },
    { role: 'value.health.weight', type: 'number', w: false },
    { role: 'value.humidity', type: 'number', w: false },
    { role: 'value.humidity', type: 'number', w: false },
    { role: 'value.humidity.max', type: 'number', w: false },
    { role: 'value.humidity.min', type: 'number', w: false },
    { role: 'value.interval', type: 'number', w: false },
    { role: 'value.lock', type: 'number', w: false },
    { role: 'value.min', type: 'number', w: false },
    { role: 'value.position', type: 'number', w: false },
    { role: 'value.power', type: 'number', w: false },
    { role: 'value.power.consumption', type: 'number', w: false },
    { role: 'value.power.production', type: 'number', w: false },
    { role: 'value.power.reactive', type: 'number', w: false },
    { role: 'value.precipitation', type: 'number', w: false },
    { role: 'value.precipitation.chance', type: 'number', w: false },
    { role: 'value.precipitation.day.forecast.0', type: 'number', w: false },
    { role: 'value.precipitation.forecast.0', type: 'number', w: false },
    { role: 'value.precipitation.hour', type: 'number', w: false },
    { role: 'value.precipitation.night.forecast.0', type: 'number', w: false },
    { role: 'value.precipitation.today', type: 'number', w: false },
    { role: 'value.precipitation.type', type: 'number', w: false },
    { role: 'value.precipitation.forecast.0', type: 'number', w: false },
    { role: 'value.precipitation.forecast.1', type: 'number', w: false },
    { role: 'value.precipitation.forecast.1', type: 'number', w: false },
    { role: 'value.pressure', type: 'number', w: false },
    { role: 'value.pressure.forecast.0', type: 'number', w: false },
    { role: 'value.pressure.forecast.1', type: 'number', w: false },
    { role: 'value.radiation', type: 'number', w: false },
    { role: 'value.rain', type: 'number', w: false },
    { role: 'value.rain.hour', type: 'number', w: false },
    { role: 'value.rain.today', type: 'number', w: false },
    { role: 'value.severity', type: 'number', w: false },
    { role: 'value.snow', type: 'number', w: false },
    { role: 'value.snow.hour', type: 'number', w: false },
    { role: 'value.snow.today', type: 'number', w: false },
    { role: 'value.snowline', type: 'number', w: false },
    { role: 'value.speed', type: 'number', w: false },
    { role: 'value.speed.max.wind', type: 'number', w: false },
    { role: 'value.speed.min.wind', type: 'number', w: false },
    { role: 'value.speed.wind', type: 'number', w: false },
    { role: 'value.speed.wind.forecast.0', type: 'number', w: false },
    { role: 'value.speed.wind.gust', type: 'number', w: false },
    { role: 'value.state', type: 'number', w: false },
    { role: 'value.sun.azimuth', type: 'number', w: false },
    { role: 'value.sun.elevation', type: 'number', w: false },
    { role: 'value.temperature', type: 'number', w: false },
    { role: 'value.temperature', type: 'number', w: false },
    { role: 'value.temperature.dewpoint', type: 'number', w: false },
    { role: 'value.temperature.feelslike', type: 'number', w: false },
    { role: 'value.temperature.max', type: 'number', w: false },
    { role: 'value.temperature.max.forecast.0', type: 'number', w: false },
    { role: 'value.temperature.min', type: 'number', w: false },
    { role: 'value.temperature.min.forecast.0', type: 'number', w: false },
    { role: 'value.temperature.min.forecast.1', type: 'number', w: false },
    { role: 'value.temperature.windchill', type: 'number', w: false },
    { role: 'value.tilt', type: 'number', w: false },
    { role: 'value.time', type: 'number', w: false },
    { role: 'value.uv', type: 'number', w: false },
    { role: 'value.valve', type: 'number', w: false },
    { role: 'value.voltage', type: 'number', w: false },
    { role: 'value.warning', type: 'number', w: false },
    { role: 'value.waste', type: 'number', w: false },
    { role: 'value.water', type: 'number', w: false },
    { role: 'whether.title', type: 'string', w: false },
    { role: 'weather.chart.url', type: 'string', w: false },
    { role: 'weather.chart.url.forecast', type: 'string', w: false },
    { role: 'weather.direction.wind', type: 'number', w: false },
    { role: 'weather.direction.wind.forecast.0', type: 'number', w: false },
    { role: 'weather.html', type: 'string', w: false },
    { role: 'weather.icon', type: 'string', w: false },
    { role: 'weather.icon.forecast.1', type: 'string', w: false },
    { role: 'weather.icon.name', type: 'string', w: false },
    { role: 'weather.icon.wind', type: 'string', w: false },
    { role: 'weather.json', type: 'string', w: false },
    { role: 'weather.state', type: 'number', w: false },
    { role: 'weather.state', type: 'string', w: false },
    { role: 'weather.state.forecast.0', type: 'string', w: false },
    { role: 'weather.state.forecast.1', type: 'string', w: false },
    { role: 'weather.title.forecast.0', type: 'string', w: false },
    { role: 'weather.title.short', type: 'string', w: false },
    { role: 'weather.type', type: 'number', w: false },
    { role: 'weather.type', type: 'string', w: false },
];

interface EditSchemaTab {
    json: ConfigItemPanel | ConfigItemTabs;
    label?: ioBroker.StringOrTranslated;
    /** Do not translate label */
    noTranslation?: boolean;
    path?: string; // path in an object, like common or native.json
    icon?: IobUri;
    color?: string;
    order?: number;
}

interface EditSchemaTabEditor extends EditSchemaTab {
    key?: string;
}

interface ObjectBrowserEditObjectProps {
    socket: Connection;
    obj: ioBroker.AnyObject;
    roleArray: { role: string; type: ioBroker.CommonType }[];
    expertMode: boolean;
    themeType: ThemeType;
    theme: IobTheme;
    aliasTab: boolean;
    onClose: (obj?: ioBroker.AnyObject) => void;
    dialogName?: string;
    objects: Record<string, ioBroker.AnyObject>;
    dateFormat: string;
    isFloatComma: boolean;
    onNewObject: (obj: ioBroker.AnyObject) => void;
    t: Translate;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface ObjectBrowserEditObjectState {
    text: string;
    error: boolean;
    customError: boolean;
    changed: boolean;
    readError: string;
    writeError: string;
    /** name of active tab */
    tab: string;
    showCopyDialog: string;
    showCommonDeleteMessage: boolean;
    selectId: boolean;
    selectRead: boolean;
    selectWrite: boolean;
    newId: string;
    customEditTabs?: EditSchemaTabEditor[];
    lang: ioBroker.Languages;
    value: ioBroker.State | null | undefined;
}

class ObjectBrowserEditObject extends Component<ObjectBrowserEditObjectProps, ObjectBrowserEditObjectState> {
    /** Original object stringified */
    private originalObj: string;
    private subscribed = false;
    private updateTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: ObjectBrowserEditObjectProps) {
        super(props);

        const withAlias = this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state';
        let tab =
            ((window as any)._localStorage || window.localStorage).getItem(
                `${this.props.dialogName || 'App'}.editTab`,
            ) || 'object';

        // select another tab if alias not present
        if (tab === 'alias' && !withAlias) {
            tab = 'common';
        }
        if (this.props.aliasTab && withAlias) {
            tab = 'alias';
        }

        const obj = this.props.obj;

        const aliasRead =
            obj.common && 'type' in obj.common && 'alias' in obj.common ? obj.common.alias.read : undefined;
        const aliasWrite =
            obj.common && 'type' in obj.common && 'alias' in obj.common ? obj.common.alias.write : undefined;

        this.state = {
            text: JSON.stringify(this.props.obj, null, 2),
            error: false,
            customError: false,
            changed: false,
            readError: this.checkFunction(aliasRead, false),
            writeError: this.checkFunction(aliasWrite, true),
            tab,
            showCopyDialog: '',
            showCommonDeleteMessage: false,
            selectId: false,
            selectRead: false,
            selectWrite: false,
            newId: '',
            lang: I18n.getLanguage(),
            value: undefined,
        };

        moment.locale(this.state.lang);

        this.originalObj = JSON.stringify(this.props.obj, null, 2);
    }

    async componentDidMount(): Promise<void> {
        // editSchemas is like 'iobobject://system.adapter.admin/native.schemas.specificObject'

        const editSchemas: Record<string, IobUri> | undefined =
            // @ts-expect-error fixed in js-controller
            (this.props.obj?.common?.editSchemas as Record<string, IobUri>) ||
            // @ts-expect-error fixed in js-controller
            (this.props.obj?.editSchemas as Record<string, IobUri>);

        const customEditTabs: EditSchemaTabEditor[] = [];

        if (editSchemas) {
            if (typeof editSchemas === 'object') {
                const schemas = Object.keys(editSchemas);
                for (let i = 0; i < schemas.length; i++) {
                    try {
                        const schema: EditSchemaTabEditor | undefined = (await iobUriRead(
                            editSchemas[schemas[i]],
                            this.props.socket,
                        )) as EditSchemaTab;
                        schema.key = schemas[i];
                        if (schema && typeof schema === 'object') {
                            // we expect { json: ..., title: {}, icon?, color? }
                            customEditTabs.push(schema);
                        }
                        if (schema.icon) {
                            try {
                                const parsed = iobUriParse(schema.icon);
                                if (parsed.type !== 'base64' && parsed.type !== 'http') {
                                    const icon = await iobUriRead(parsed, this.props.socket);
                                    if (icon) {
                                        schema.icon = icon;
                                    }
                                }
                            } catch (e) {
                                console.warn(`Cannot get icon for schema from "${schema.icon}": ${e}`);
                                schema.icon = undefined;
                            }
                        }
                    } catch (e) {
                        console.warn(`Cannot get edit schema for "${editSchemas[schemas[i]]}": ${e}`);
                    }
                }
                if (customEditTabs.length) {
                    customEditTabs.sort((a, b) => {
                        if (a.order !== undefined && b.order !== undefined) {
                            return a.order - b.order;
                        }
                        if (a.order !== undefined) {
                            return -1;
                        }
                        if (b.order !== undefined) {
                            return 1;
                        }
                        return a.key > b.key ? 1 : -1;
                    });
                    this.setState({ customEditTabs });
                }
            } else {
                console.warn(
                    `Invalid edit schema for "${editSchemas}": expected object, but got ${typeof editSchemas}`,
                );
            }
        }

        if (
            this.state.tab === 'alias' &&
            (!this.props.obj._id.startsWith('alias.0') || this.props.obj.type !== 'state')
        ) {
            this.setState({ tab: 'object' });
        } else if (this.state.tab === 'state' && this.props.obj.type !== 'state') {
            this.setState({ tab: 'object' });
        } else if (
            this.state.tab !== 'object' &&
            this.state.tab !== 'common' &&
            this.state.tab !== 'alias' &&
            this.state.tab !== 'state' &&
            !customEditTabs.find(tab => tab.key === this.state.tab)
        ) {
            this.setState({ tab: 'object' });
        }

        if (this.state.tab === 'state') {
            this.subscribeOnState(true);
        }

        void this.props.socket.subscribeObject(this.props.obj._id, this.onObjectUpdated);
    }

    componentWillUnmount(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        this.subscribeOnState(false);

        void this.props.socket.unsubscribeObject(this.props.obj._id, this.onObjectUpdated);
    }

    onObjectUpdated = (_id: string, obj: ioBroker.AnyObject): void => {
        if (this.originalObj !== JSON.stringify(obj, null, 2)) {
            this.originalObj = JSON.stringify(obj, null, 2);
            if (!this.state.changed) {
                this.setState({ text: this.originalObj });
            } else {
                this.forceUpdate();
            }
        }
    };

    checkFunction(func: string, isWrite: boolean): string {
        if (!func) {
            return '';
        }
        if (func.includes('JSON.parse(')) {
            // Unable to validate (a result is unknown)
            return '';
        }
        let json;
        try {
            json = JSON.parse(this.state.text);
        } catch {
            // ignore
        }

        let jsFunc;
        try {
            // eslint-disable-next-line no-new-func
            jsFunc = new Function('val', func.includes('return') ? func : `return ${func}`);
        } catch {
            return this.props.t('Cannot parse code!');
        }

        //  if source and target types exist
        if (json?.common?.type && (this.props.objects[json.common.alias?.id]?.common as ioBroker.StateCommon)?.type) {
            const initialType: ioBroker.CommonType = isWrite
                ? json.common.type
                : (this.props.objects[json.common.alias.id] as ioBroker.StateObject).common.type;
            const finalType: ioBroker.CommonType = isWrite
                ? (this.props.objects[json.common.alias.id] as ioBroker.StateObject).common.type
                : json.common.type;
            if (initialType && finalType) {
                let arg = null;
                if (initialType === 'boolean') {
                    arg = true;
                } else if (initialType === 'number') {
                    arg = 1;
                } else if (initialType === 'string' || initialType === 'mixed') {
                    arg = 'string';
                }
                if (arg !== null) {
                    try {
                        const result = jsFunc(arg);
                        if (finalType === 'mixed') {
                            // we cannot check the value with type mixed
                            return '';
                        }
                        return result !== null && typeof result !== finalType
                            ? this.props.t('Type of result is not as expected: %s', finalType)
                            : '';
                    } catch (e) {
                        return `${this.props.t('Cannot execute function')}: ${e.toString()}`;
                    }
                }
            }
        }

        return '';
    }

    prepareObject(value: string): ioBroker.Object {
        value = value || this.state.text;
        try {
            const obj = JSON.parse(value);
            obj._id = this.props.obj._id; // do not allow change of id

            // check aliases
            if (obj.common?.alias) {
                if (!obj.common.alias.id) {
                    delete obj.common.alias.id;
                }
                if (
                    (!obj.common.alias.read && obj.common.alias.read !== undefined) ||
                    obj.common.alias.read === 'val'
                ) {
                    delete obj.common.alias.read;
                }
                if (
                    (!obj.common.alias.write && obj.common.alias.write !== undefined) ||
                    obj.common.alias.write === 'val'
                ) {
                    delete obj.common.alias.write;
                }
                if (!obj.common.alias.id && !obj.common.alias.read && !obj.common.alias.write) {
                    delete obj.common.alias;
                }
            }

            if (obj.common?.min !== undefined && typeof obj.common.min !== 'number') {
                obj.common.min = parseFloat(obj.common.min);
            }
            if (obj.common?.max !== undefined && typeof obj.common.max !== 'number') {
                obj.common.max = parseFloat(obj.common.max);
            }
            if (obj.common?.step !== undefined && typeof obj.common.step !== 'number') {
                obj.common.step = parseFloat(obj.common.step);
            }

            return obj;
        } catch {
            return null;
        }
    }

    onChange(value: string, cb?: () => void): void {
        const json = this.prepareObject(value);
        const newState: Partial<ObjectBrowserEditObjectState> = { text: value };
        if (json) {
            newState.changed = this.originalObj !== JSON.stringify(json, null, 2);

            // check if some common attributes are deleted
            newState.showCommonDeleteMessage = false;
            const originalObj = JSON.parse(this.originalObj);
            if (json.common) {
                Object.keys(originalObj.common || {}).forEach(attr => {
                    if (json.common[attr] === undefined) {
                        newState.showCommonDeleteMessage = true;
                    }
                });
            }

            newState.error = false;
            newState.readError = this.checkFunction(json.common?.alias?.read, false);
            newState.writeError = this.checkFunction(json.common?.alias?.write, true);
        } else {
            newState.showCommonDeleteMessage = false;
            newState.error = true;
        }

        this.setState(newState as ObjectBrowserEditObjectState, () => cb && cb());
    }

    onUpdate(): void {
        try {
            const obj = JSON.parse(this.state.text);
            obj._id = this.props.obj._id; // do not allow change of id

            // check aliases
            if (obj.common?.alias) {
                if (!obj.common.alias.id) {
                    delete obj.common.alias.id;
                }
                if (
                    (!obj.common.alias.read && obj.common.alias.read !== undefined) ||
                    obj.common.alias.read === 'val'
                ) {
                    delete obj.common.alias.read;
                }
                if (
                    (!obj.common.alias.write && obj.common.alias.write !== undefined) ||
                    obj.common.alias.write === 'val'
                ) {
                    delete obj.common.alias.write;
                }
                if (!obj.common.alias.id && !obj.common.alias.read && !obj.common.alias.write) {
                    delete obj.common.alias;
                }
            }

            if (obj.common?.min !== undefined && typeof obj.common.min !== 'number') {
                obj.common.min = parseFloat(obj.common.min);
            }
            if (obj.common?.max !== undefined && typeof obj.common.max !== 'number') {
                obj.common.max = parseFloat(obj.common.max);
            }
            if (obj.common?.step !== undefined && typeof obj.common.step !== 'number') {
                obj.common.step = parseFloat(obj.common.step);
            }

            this.props.onClose(obj);
        } catch {
            console.error(`Cannot parse: ${this.state.text}`);
        }
    }

    static getPartOfObject(text: string, path?: string): any {
        if (path) {
            return getAttrInObject(JSON.parse(text), path.split('.'));
        }
        return JSON.parse(text);
    }

    static setPartOfObject(text: string, value: any, path?: string): string {
        let data: any = JSON.parse(text);
        if (data === undefined) {
            return text;
        }
        data = setAttrInObject(data, path.split('.'), value);
        return JSON.stringify(data, null, 2);
    }

    renderCustomPanel(): JSX.Element | null {
        const tab = this.state.customEditTabs?.find(it => it.key === this.state.tab);
        if (!tab) {
            return null;
        }
        let data: Record<string, any>;
        try {
            data = ObjectBrowserEditObject.getPartOfObject(this.state.text, tab.path);
        } catch (e) {
            console.error(`Cannot get data for ${tab.path}: ${e}`);
            return <div>{I18n.t('Cannot get data for %s: %s', tab.path, e)}</div>;
        }

        if (!data) {
            return <div>{I18n.t('Cannot get data for %s', tab.path)}</div>;
        }

        return (
            <JsonConfigComponent
                theme={this.props.theme}
                socket={this.props.socket as unknown as AdminConnection}
                themeName={this.props.theme.palette.mode}
                themeType={this.props.theme.palette.mode}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                schema={tab.json}
                data={data}
                onChange={data => {
                    try {
                        const text = ObjectBrowserEditObject.setPartOfObject(this.state.text, data, tab.path);
                        this.onChange(text);
                    } catch (e) {
                        console.error(`Cannot set data for ${tab.path}: ${e}`);
                    }
                }}
                adapterName={''}
                instance={0}
                onError={(error: boolean): void => {
                    console.warn(`Error in JSON editor: ${error}`);
                    if (this.state.customError !== error) {
                        this.setState({ customError: error });
                    }
                }}
            />
        );
    }

    renderCustomTab(tab: EditSchemaTabEditor, parsedObj: ioBroker.Object | null | undefined): JSX.Element {
        let style: React.CSSProperties | undefined;
        if (!parsedObj) {
            return null;
        }
        if (!getAttrInObject(parsedObj, tab.path?.split('.'))) {
            // no part in object found
            return null;
        }

        if (tab.color) {
            style = {
                backgroundColor: tab.color,
                color: Utils.invertColor(tab.color, true),
            };
        }

        const label: string | React.JSX.Element =
            tab.label && typeof tab.label === 'object'
                ? tab.label[this.state.lang] || tab.label.en
                : tab.noTranslation
                  ? (tab.label as string) || tab.key
                  : this.props.t((tab.label as string) || tab.key);

        return (
            <Tab
                disabled={this.state.error || this.state.customError}
                value={tab.key}
                label={label}
                style={style}
                iconPosition="start"
                icon={
                    tab.icon ? (
                        <Icon
                            src={tab.icon}
                            style={styles.funcIcon}
                        />
                    ) : undefined
                }
            />
        );
    }

    renderStateTab(): JSX.Element | null {
        if (
            this.props.obj.type !== 'state' ||
            // @ts-expect-error file is deprecated, but could appear
            this.props.obj.common.type === 'file'
        ) {
            return null;
        }

        return (
            <Tab
                disabled={this.state.customError || this.state.error}
                value="state"
                label={this.props.t('State')}
            />
        );
    }

    renderStatePanel(): JSX.Element {
        if (this.state.value === undefined || this.state.value === null) {
            return <div>{this.props.t('State does not exist')}</div>;
        }
        if (typeof this.state.value !== 'object') {
            return (
                <div style={{ maxWidth: 700 }}>
                    <div>{this.props.t('State is invalid')}</div>
                    <div>
                        <pre>{JSON.stringify(this.state.value, null, 4)}</pre>
                    </div>
                </div>
            );
        }

        let strVal: string | React.JSX.Element | undefined;
        const styleValue: React.CSSProperties = {};
        const v = this.state.value.val;
        const type = typeof v;

        if (v === undefined) {
            strVal = '[undef]';
            styleValue.color = '#bc6400';
            styleValue.fontStyle = 'italic';
        } else if (v === null) {
            strVal = '(null)';
            styleValue.color = '#0047b1';
            styleValue.fontStyle = 'italic';
        } else if (
            typeof this.props.obj.common.role === 'string' &&
            this.props.obj.common.role.match(/^value\.time|^date/)
        ) {
            // if timestamp
            if (v && type === 'string') {
                if (Utils.isStringInteger(v as string)) {
                    // we assume a unix ts
                    strVal = new Date(parseInt(v as string, 10)).toString();
                } else {
                    // check if parsable by new date
                    try {
                        const parsedDate = new Date(v as string);

                        if (Utils.isValidDate(parsedDate)) {
                            strVal = parsedDate.toString();
                        }
                    } catch {
                        // ignore
                    }
                }
            } else if (v && type === 'number') {
                if ((v as number) > 946681200 && (v as number) < 946681200000) {
                    // '2000-01-01T00:00:00' => 946681200000
                    strVal = new Date((v as number) * 1_000).toString(); // maybe the time is in seconds (UNIX time)
                } else if ((v as number) > 946681200000000) {
                    // "null" and undefined could not be here. See `let v = (isCommon && isCommon.type === 'file') ....` above
                    strVal = new Date(v as number).toString();
                }
            }
        }

        if (!strVal) {
            if (type === 'number') {
                if (!Number.isInteger(v)) {
                    strVal = (Math.round((v as number) * 1_000_000_000) / 1_000_000_000).toString(); // remove 4.00000000000000001
                    if (this.props.isFloatComma) {
                        strVal = strVal.toString().replace('.', ',');
                    }
                }
            } else if (type === 'boolean') {
                strVal = v ? I18n.t('true') : I18n.t('false');
                styleValue.color = v ? '#139800' : '#cd6b55';
            } else if (type === 'object') {
                strVal = JSON.stringify(v);
            } else if (type === 'string' && (v as string).startsWith('data:image/')) {
                strVal = (
                    <img
                        src={v as string}
                        alt="img"
                        style={styles.stateImage}
                    />
                );
            } else {
                strVal = v.toString();
            }
        }

        Object.assign(styleValue, valueBlink(this.props.theme, styleValue.color));

        return (
            <Box
                style={{
                    ...styles.divWithoutTitle,
                    padding: '24px 24px 0 24px',
                    fontSize: 16,
                    maxWidth: 400,
                }}
                sx={{
                    '& .value-line:hover': {
                        backgroundColor: '#00000030',
                    },
                }}
            >
                <div
                    className="value-line"
                    style={{
                        ...styles.stateRow,
                        marginBottom: 24,
                    }}
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_value')}:</div>
                    <Box
                        component="div"
                        key={typeof strVal === 'string' ? strVal : 'image'}
                        sx={styleValue}
                        style={styles.stateValue}
                    >
                        {strVal}
                        {(this.props.obj.common as ioBroker.StateCommon)?.unit ? (
                            <span style={styles.stateUnit}>{(this.props.obj.common as ioBroker.StateCommon).unit}</span>
                        ) : null}
                    </Box>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('Type')}:</div>
                    <div style={styles.stateValue}>{type}</div>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_ts')}:</div>
                    <Tooltip
                        title={new Date(this.state.value.ts).toLocaleString()}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={styles.stateValue}>
                            <span style={styles.stateTime}>{moment(this.state.value.ts).fromNow()}</span>
                        </div>
                    </Tooltip>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_ack')}:</div>
                    <div
                        style={{
                            ...styles.stateValue,
                            color: this.state.value.ack ? 'green' : 'red',
                        }}
                    >
                        {this.state.value.ack ? I18n.t('Acknowledged') : I18n.t('Command')}
                        {this.state.value.ack ? ' (true)' : ' (false)'}
                    </div>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_lc')}:</div>
                    <Tooltip
                        title={new Date(this.state.value.lc).toLocaleString()}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div style={styles.stateValue}>
                            <span style={styles.stateTime}>{moment(this.state.value.lc).fromNow()}</span>
                        </div>
                    </Tooltip>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_quality')}:</div>
                    <div style={styles.stateValue}>{Utils.quality2text(this.state.value.q || 0).join(', ')}</div>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_from')}:</div>
                    <div style={styles.stateValue}>{this.state.value.from}</div>
                </div>
                <div
                    style={styles.stateRow}
                    className="value-line"
                >
                    <div style={styles.stateTitle}>{I18n.t('ra_tooltip_user')}:</div>
                    <div style={styles.stateValue}>{this.state.value.user || '--'}</div>
                </div>
                {this.state.value.expire ? (
                    <div
                        style={styles.stateRow}
                        className="value-line"
                    >
                        <div style={styles.stateTitle}>{I18n.t('ra_tooltip_expire')}:</div>
                        <div style={styles.stateValue}>
                            {this.state.value.expire} {I18n.t('sc_seconds')}
                        </div>
                    </div>
                ) : null}
                {this.state.value.c ? (
                    <div
                        style={styles.stateRow}
                        className="value-line"
                    >
                        <div style={styles.stateTitle}>{I18n.t('ra_tooltip_comment')}:</div>
                        <div style={styles.stateValue}>{this.state.value.c}</div>
                    </div>
                ) : null}
            </Box>
        );
    }

    onStateChange = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (JSON.stringify(state) !== JSON.stringify(this.state.value)) {
            this.setState({ value: state });
        }
    };

    subscribeOnState(enable: boolean): void {
        if (enable) {
            if (!this.subscribed) {
                if (!this.updateTimer) {
                    this.updateTimer = setInterval(() => {
                        // update times
                        this.forceUpdate();
                    }, 5000);
                }
                this.subscribed = true;
                void this.props.socket.subscribeState(this.props.obj._id, this.onStateChange);
            }
        } else {
            if (this.subscribed) {
                if (this.updateTimer) {
                    clearInterval(this.updateTimer);
                    this.updateTimer = null;
                }
                this.subscribed = false;
                void this.props.socket.unsubscribeState(this.props.obj._id, this.onStateChange);
            }
        }
    }

    renderTabs(parsedObj: ioBroker.Object | null | undefined): JSX.Element {
        return (
            <Tabs
                style={styles.tabsPadding}
                value={this.state.tab}
                onChange={(_e, tab) => {
                    ((window as any)._localStorage || window.localStorage).setItem(
                        `${this.props.dialogName || 'App'}.editTab`,
                        tab,
                    );

                    if (tab === 'object') {
                        try {
                            const obj = JSON.parse(this.state.text);
                            let changed = false;
                            if (obj.common?.min !== undefined && typeof obj.common.min !== 'number') {
                                obj.common.min = parseFloat(obj.common.min);
                                changed = true;
                            }
                            if (obj.common?.max !== undefined && typeof obj.common.max !== 'number') {
                                obj.common.max = parseFloat(obj.common.max);
                                changed = true;
                            }
                            if (obj.common?.step !== undefined && typeof obj.common.step !== 'number') {
                                obj.common.step = parseFloat(obj.common.step);
                                changed = true;
                            }
                            if (changed) {
                                this.setState({ text: JSON.stringify(obj, null, 2) });
                            }
                        } catch {
                            // ignore
                        }
                        this.subscribeOnState(false);
                    } else if (tab === 'state') {
                        this.subscribeOnState(true);
                    } else {
                        this.subscribeOnState(false);
                    }

                    this.setState({ tab });
                }}
            >
                <Tab
                    value="common"
                    disabled={this.state.customError || this.state.error}
                    label={this.props.t('common')}
                />
                <Tab
                    value="object"
                    disabled={this.state.customError}
                    label={this.props.t('Object data')}
                />
                {this.renderStateTab()}
                {this.props.obj._id.startsWith('alias.0') && this.props.obj.type === 'state' && (
                    <Tab
                        disabled={this.state.customError || this.state.error}
                        value="alias"
                        label={this.props.t('Alias')}
                    />
                )}
                {this.state.customEditTabs?.map(tab => this.renderCustomTab(tab, parsedObj))}
            </Tabs>
        );
    }

    renderSelectDialog(): JSX.Element {
        if (!this.state.selectId && !this.state.selectRead && !this.state.selectWrite) {
            return null;
        }

        let id = '';
        let json: ioBroker.StateObject;
        try {
            json = JSON.parse(this.state.text);

            const aliasRead =
                json.common && 'type' in json.common && 'alias' in json.common ? json.common.alias?.read : '';
            const aliasWrite =
                json.common && 'type' in json.common && 'alias' in json.common ? json.common.alias?.write : '';

            if (this.state.selectId) {
                id = (json.common?.alias?.id as string) || '';
            } else if (this.state.selectRead) {
                id = aliasRead ?? '';
            } else if (this.state.selectWrite) {
                id = aliasWrite ?? '';
            }
        } catch {
            console.error(`Cannot parse ${this.state.text}`);
        }

        return (
            <DialogSelectID
                key="selectDialog"
                imagePrefix="."
                dateFormat={this.props.dateFormat}
                theme={this.props.theme}
                isFloatComma={this.props.isFloatComma}
                socket={this.props.socket}
                dialogName="aliasesEdit"
                title={`${this.props.t('Select for')} ${this.props.obj._id}`}
                selected={id}
                onOk={(idx: string | string[] | undefined) => {
                    const selectRead = this.state.selectRead;
                    const selectWrite = this.state.selectWrite;
                    const selectId = this.state.selectId;
                    const stateId = Array.isArray(idx) ? idx[0] : idx;
                    this.setState({ selectId: false, selectRead: false, selectWrite: false }, () => {
                        if (selectRead) {
                            this.setAliasItem(json, 'id.read', stateId);
                        } else if (selectWrite) {
                            this.setAliasItem(json, 'id.write', stateId);
                        } else if (selectId) {
                            this.setAliasItem(json, 'id', stateId);
                        }
                    });
                }}
                onClose={() => this.setState({ selectId: false, selectRead: false, selectWrite: false })}
            />
        );
    }

    setAliasItem(json: ioBroker.StateObject, name: string, value: string, cb?: () => void): void {
        json.common = json.common || ({} as ioBroker.StateCommon);
        const commonAlias = json.common.alias || ({} as ioBroker.StateCommon['alias']);

        if (name === 'id.read') {
            if (commonAlias.id && typeof commonAlias.id === 'object') {
                commonAlias.id.read = value;
            } else {
                commonAlias.id = { read: value, write: value };
            }
        } else if (name === 'id.write') {
            if (commonAlias.id && typeof commonAlias.id === 'object') {
                commonAlias.id.write = value;
            } else {
                commonAlias.id = { read: value, write: value };
            }
        } else {
            (commonAlias as any)[name] = value;
        }

        json.common.alias = commonAlias;
        this.onChange(JSON.stringify(json, null, 2), cb);
    }

    setCommonItem(json: Record<string, any>, name: string, value: any): void {
        json.common[name] = value;
        this.onChange(JSON.stringify(json, null, 2));
    }

    removeCommonItem(json: Record<string, any>, name: string): void {
        delete json.common[name];
        this.onChange(JSON.stringify(json, null, 2));
    }

    static buttonAddKey(nameKey: string, cb: () => void): JSX.Element {
        return (
            <div style={styles.marginBlock}>
                <Button
                    style={styles.buttonAdd}
                    variant="contained"
                    color="secondary"
                    startIcon={<IconAdd />}
                    onClick={cb}
                >
                    {I18n.t(nameKey)}
                </Button>
            </div>
        );
    }

    buttonRemoveKey(nameKey: string, cb: () => void, style?: React.CSSProperties): JSX.Element {
        const { t } = this.props;
        return (
            <Tooltip
                title={t('Remove attribute %s', t(nameKey))}
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                <Box
                    component="div"
                    sx={styles.close}
                    style={style}
                    onClick={cb}
                />
            </Tooltip>
        );
    }

    static filterRoles(roleArray: { role: string; type: ioBroker.CommonType }[], type: ioBroker.CommonType): string[] {
        const bigRoleArray: string[] = [];
        roleArray.forEach(
            role =>
                (role.type === 'mixed' || role.type) === type &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );
        DEFAULT_ROLES.forEach(
            role =>
                (role.type === 'mixed' || role.type) === type &&
                !bigRoleArray.includes(role.role) &&
                bigRoleArray.push(role.role),
        );
        bigRoleArray.sort();
        return bigRoleArray;
    }

    renderCommonEdit(): JSX.Element {
        try {
            const json = JSON.parse(this.state.text);
            const stateTypeArray: ioBroker.CommonType[] = ['number', 'string', 'boolean', 'array', 'object', 'mixed'];
            const disabled = false;
            const { t, obj } = this.props;
            const checkState = obj.type === 'state';
            const checkRole = obj.type === 'channel' || obj.type === 'device' || checkState;

            // add default roles to roleArray
            const bigRoleArray: string[] = ObjectBrowserEditObject.filterRoles(this.props.roleArray, json.common.type);

            let iconPath;

            if (json.common.icon) {
                iconPath =
                    json.type === 'instance' || json.type === 'adapter'
                        ? `./adapter/${json.common.name}/${json.common.icon}`
                        : json.common.icon;
                if (!iconPath.startsWith('.') && !iconPath.startsWith('/') && !iconPath.startsWith('data:')) {
                    const parts = obj._id.split('.');
                    if (parts[0] === 'system') {
                        iconPath = `adapter/${parts[2]}${iconPath.startsWith('/') ? '' : '/'}${iconPath}`;
                    } else {
                        iconPath = `adapter/${parts[0]}${iconPath.startsWith('/') ? '' : '/'}${iconPath}`;
                    }
                }
            }

            const desc =
                typeof json.common.desc === 'object' && json.common.desc
                    ? json.common.desc[I18n.getLanguage()] || json.common.desc.en || ''
                    : json.common.desc || '';

            const name = Utils.getObjectNameFromObj(json, I18n.getLanguage(), {}, false, true);

            return (
                <Box
                    style={styles.commonTabWrapper}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            this.onUpdate();
                        }
                    }}
                >
                    <Box
                        style={{
                            ...styles.commonWrapper,
                            width: this.props.width === 'xs' ? '100%' : undefined,
                            minWidth: this.props.width === 'xs' ? '100%' : undefined,
                            gap: this.props.width === 'xs' ? 10 : 8,
                            display: this.props.width === 'xs' ? 'flex' : undefined,
                            flexDirection: this.props.width === 'xs' ? 'column' : undefined,
                        }}
                    >
                        {typeof json.common.name !== 'undefined' ? (
                            <TextField
                                variant="standard"
                                disabled={disabled}
                                label={t('Name')}
                                style={{ ...styles.textField, marginTop: 8 }}
                                fullWidth
                                slotProps={{
                                    input: {
                                        endAdornment: name ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear text')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        tabIndex={-1}
                                                        size="small"
                                                        onClick={() => this.setCommonItem(json, 'name', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                                value={name}
                                onChange={el => this.setCommonItem(json, 'name', el.target.value)}
                            />
                        ) : (
                            ObjectBrowserEditObject.buttonAddKey('Name', () => this.setCommonItem(json, 'name', ''))
                        )}
                        {typeof json.common.desc !== 'undefined' ? (
                            <Box
                                component="div"
                                sx={styles.flex}
                            >
                                <TextField
                                    variant="standard"
                                    disabled={disabled}
                                    label={t('Description')}
                                    style={{ ...styles.textField, marginTop: 8 }}
                                    fullWidth
                                    slotProps={{
                                        input: {
                                            endAdornment: desc ? (
                                                <InputAdornment position="end">
                                                    <Tooltip
                                                        title={I18n.t('Clear text')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            tabIndex={-1}
                                                            size="small"
                                                            onClick={() => this.setCommonItem(json, 'desc', '')}
                                                        >
                                                            <IconClose />
                                                        </IconButton>
                                                    </Tooltip>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                    value={desc}
                                    onChange={el => this.setCommonItem(json, 'desc', el.target.value)}
                                />
                                {this.buttonRemoveKey('Description', () => this.removeCommonItem(json, 'desc'))}
                            </Box>
                        ) : (
                            ObjectBrowserEditObject.buttonAddKey('Description', () =>
                                this.setCommonItem(json, 'desc', ''),
                            )
                        )}
                        {checkState ? (
                            typeof json.common.type !== 'undefined' ? (
                                <Box
                                    component="div"
                                    sx={styles.flex}
                                >
                                    <FormControl
                                        style={styles.marginBlock}
                                        fullWidth
                                    >
                                        <InputLabel style={{ transform: 'scale(0.75)' }}>{t('State type')}</InputLabel>
                                        <Select
                                            variant="standard"
                                            disabled={disabled}
                                            value={json.common.type}
                                            onChange={el => this.setCommonItem(json, 'type', el.target.value)}
                                        >
                                            {stateTypeArray.map(el => (
                                                <MenuItem
                                                    key={el}
                                                    value={el}
                                                >
                                                    {t(el)}
                                                    <span style={styles.typeNameEng}>({el})</span>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {this.buttonRemoveKey('State type', () => this.removeCommonItem(json, 'type'), {
                                        marginTop: 20,
                                    })}
                                </Box>
                            ) : (
                                ObjectBrowserEditObject.buttonAddKey('State type', () =>
                                    this.setCommonItem(json, 'type', 'string'),
                                )
                            )
                        ) : null}
                        <Box
                            component="div"
                            sx={{ ...styles.flex, flexWrap: this.props.width === 'xs' ? 'wrap' : undefined }}
                        >
                            {checkState ? (
                                typeof json.common.read !== 'undefined' ? (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        <FormControlLabel
                                            style={styles.marginBlock}
                                            control={
                                                <Checkbox
                                                    disabled={disabled}
                                                    checked={json.common.read}
                                                    onChange={el => this.setCommonItem(json, 'read', el.target.checked)}
                                                />
                                            }
                                            label={t('Readable')}
                                        />
                                        {this.buttonRemoveKey('Readable', () => this.removeCommonItem(json, 'read'))}
                                    </Box>
                                ) : (
                                    ObjectBrowserEditObject.buttonAddKey('Readable', () =>
                                        this.setCommonItem(json, 'read', true),
                                    )
                                )
                            ) : null}
                            {checkState ? (
                                typeof json.common.write !== 'undefined' ? (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        <FormControlLabel
                                            style={styles.marginBlock}
                                            control={
                                                <Checkbox
                                                    disabled={disabled}
                                                    checked={json.common.write}
                                                    onChange={el =>
                                                        this.setCommonItem(json, 'write', el.target.checked)
                                                    }
                                                />
                                            }
                                            label={t('Writeable')}
                                        />
                                        {this.buttonRemoveKey('Writeable', () => this.removeCommonItem(json, 'write'))}
                                    </Box>
                                ) : (
                                    ObjectBrowserEditObject.buttonAddKey('Writeable', () =>
                                        this.setCommonItem(json, 'write', true),
                                    )
                                )
                            ) : null}
                        </Box>
                        {checkRole ? (
                            typeof json.common.role !== 'undefined' ? (
                                <Box
                                    component="div"
                                    sx={styles.flex}
                                >
                                    <Autocomplete
                                        style={styles.marginBlock}
                                        fullWidth
                                        disabled={disabled}
                                        value={json.common.role}
                                        onChange={(_, e) => {
                                            const role = DEFAULT_ROLES.find(r => r.role === e);
                                            if (role) {
                                                if (role.w !== undefined && role.r !== undefined) {
                                                    this.setCommonItem(json, 'write', role.w);
                                                    this.setCommonItem(json, 'read', role.r);
                                                } else if (role.w !== undefined) {
                                                    this.setCommonItem(json, 'write', role.w);
                                                } else if (role.r !== undefined) {
                                                    this.setCommonItem(json, 'read', role.r);
                                                }
                                            }

                                            if (
                                                e.startsWith('level') ||
                                                e.startsWith('indicator') ||
                                                e.startsWith('sensor') ||
                                                e.startsWith('weather')
                                            ) {
                                                if (json.common.write) {
                                                    this.setCommonItem(json, 'write', false);
                                                }
                                            } else if (
                                                e.startsWith('value') ||
                                                e.startsWith('indicator') ||
                                                e.startsWith('sensor') ||
                                                e.startsWith('weather')
                                            ) {
                                                if (json.common.write) {
                                                    this.setCommonItem(json, 'write', false);
                                                }
                                            } else if (e.startsWith('level') || e.startsWith('switch')) {
                                                if (json.common.write) {
                                                    this.setCommonItem(json, 'write', true);
                                                }
                                            } else if (e.startsWith('button')) {
                                                if (json.common.read) {
                                                    this.setCommonItem(json, 'read', false);
                                                }
                                            }

                                            this.setCommonItem(json, 'role', e);
                                        }}
                                        options={bigRoleArray}
                                        renderInput={params => (
                                            <TextField
                                                variant="standard"
                                                {...params}
                                                label={t('Role')}
                                            />
                                        )}
                                    />
                                    {this.buttonRemoveKey('Role', () => this.removeCommonItem(json, 'role'), {
                                        marginTop: 20,
                                    })}
                                </Box>
                            ) : (
                                ObjectBrowserEditObject.buttonAddKey('Role', () => this.setCommonItem(json, 'role', ''))
                            )
                        ) : null}
                        {typeof json.common.color !== 'undefined' ? (
                            <Box
                                component="div"
                                sx={styles.flex}
                            >
                                <TextField
                                    variant="standard"
                                    disabled={disabled}
                                    style={{ ...styles.marginBlock, ...styles.color }}
                                    label={t('Color')}
                                    type="color"
                                    slotProps={{
                                        input: {
                                            endAdornment: json.common.color ? (
                                                <InputAdornment position="end">
                                                    <Tooltip
                                                        title={I18n.t('Clear field')}
                                                        slotProps={{ popper: { sx: styles.tooltip } }}
                                                    >
                                                        <IconButton
                                                            tabIndex={-1}
                                                            size="small"
                                                            onClick={() => this.setCommonItem(json, 'color', '')}
                                                        >
                                                            <IconClose />
                                                        </IconButton>
                                                    </Tooltip>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                    value={json.common.color}
                                    onChange={el => this.setCommonItem(json, 'color', el.target.value)}
                                />
                                {this.buttonRemoveKey('Color', () => this.removeCommonItem(json, 'color'))}
                            </Box>
                        ) : (
                            ObjectBrowserEditObject.buttonAddKey('Color', () => this.setCommonItem(json, 'color', ''))
                        )}
                        <Box
                            component="div"
                            sx={{
                                ...styles.flex,
                                flexWrap: this.props.width === 'xs' ? 'wrap' : undefined,
                                gap: this.props.width === 'xs' ? '10px' : undefined,
                            }}
                        >
                            {json.common.type === 'number' ? (
                                typeof json.common.min !== 'undefined' ? (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        <TextField
                                            variant="standard"
                                            disabled={disabled}
                                            className={{ ...styles.marginBlock, ...styles.color }}
                                            label={t('Min')}
                                            value={json.common.min}
                                            onChange={el => this.setCommonItem(json, 'min', el.target.value)}
                                        />
                                        {this.buttonRemoveKey('Min', () => this.removeCommonItem(json, 'min'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('Min', () =>
                                            this.setCommonItem(json, 'min', 0),
                                        )}
                                    </Box>
                                )
                            ) : null}
                            {json.common.type === 'number' ? (
                                typeof json.common.max !== 'undefined' ? (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        <TextField
                                            variant="standard"
                                            disabled={disabled}
                                            className={{ ...styles.marginBlock, ...styles.color }}
                                            label={t('Max')}
                                            value={json.common.max}
                                            onChange={el => this.setCommonItem(json, 'max', el.target.value)}
                                        />
                                        {this.buttonRemoveKey('Max', () => this.removeCommonItem(json, 'max'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('Max', () =>
                                            this.setCommonItem(json, 'max', 100),
                                        )}
                                    </Box>
                                )
                            ) : null}
                            {json.common.type === 'number' ? (
                                typeof json.common.step !== 'undefined' ? (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        <TextField
                                            variant="standard"
                                            disabled={disabled}
                                            className={{ ...styles.marginBlock, ...styles.color }}
                                            label={t('Step')}
                                            value={json.common.step}
                                            onChange={el => this.setCommonItem(json, 'step', el.target.value)}
                                        />
                                        {this.buttonRemoveKey('Step', () => this.removeCommonItem(json, 'step'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('Step', () =>
                                            this.setCommonItem(json, 'step', 1),
                                        )}
                                    </Box>
                                )
                            ) : null}
                        </Box>
                        {json.common.type === 'number' ? (
                            typeof json.common.unit !== 'undefined' ? (
                                <Box
                                    component="div"
                                    sx={styles.flex}
                                >
                                    <TextField
                                        variant="standard"
                                        disabled={disabled}
                                        className={{ ...styles.marginBlock, ...styles.color }}
                                        label={t('Unit')}
                                        slotProps={{
                                            input: {
                                                endAdornment: json.common.unit ? (
                                                    <InputAdornment position="end">
                                                        <Tooltip
                                                            title={I18n.t('Clear field')}
                                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                                        >
                                                            <IconButton
                                                                tabIndex={-1}
                                                                size="small"
                                                                onClick={() => this.setCommonItem(json, 'unit', '')}
                                                            >
                                                                <IconClose />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ) : null,
                                            },
                                        }}
                                        value={json.common.unit}
                                        onChange={el => this.setCommonItem(json, 'unit', el.target.value)}
                                    />
                                    {this.buttonRemoveKey('Unit', () => this.removeCommonItem(json, 'unit'))}
                                </Box>
                            ) : (
                                <div style={styles.flexDrop}>
                                    {ObjectBrowserEditObject.buttonAddKey('Unit', () =>
                                        this.setCommonItem(json, 'unit', ''),
                                    )}
                                </div>
                            )
                        ) : null}
                    </Box>
                    {typeof json.common.icon !== 'undefined' ? (
                        <Box
                            component="div"
                            sx={styles.flex}
                            style={{ flexGrow: 1, minWidth: 158 }}
                        >
                            <UploadImage
                                disabled={disabled}
                                maxSize={10 * 1024}
                                icon={iconPath}
                                removeIconFunc={() => this.setCommonItem(json, 'icon', '')}
                                onChange={base64 => this.setCommonItem(json, 'icon', base64)}
                            />
                            {this.buttonRemoveKey('Icon', () => this.removeCommonItem(json, 'icon'))}
                        </Box>
                    ) : (
                        <Box
                            component="div"
                            sx={styles.flex}
                        >
                            {ObjectBrowserEditObject.buttonAddKey('Icon', () => this.setCommonItem(json, 'icon', ''))}
                        </Box>
                    )}
                </Box>
            );
        } catch {
            return <div>{this.props.t('Cannot parse JSON!')}</div>;
        }
    }

    renderAliasEdit(): JSX.Element {
        try {
            const json = JSON.parse(this.state.text);
            const funcVisible = json.common?.alias?.read !== undefined || json.common?.alias?.write !== undefined;

            return (
                <Grid2
                    container
                    direction="column"
                    style={styles.marginTop}
                >
                    <Grid2>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={typeof json.common?.alias?.id === 'object'}
                                    onChange={() => {
                                        if (typeof json.common?.alias?.id === 'object') {
                                            this.setAliasItem(json, 'id', json.common?.alias?.id?.read || '');
                                        } else {
                                            this.setAliasItem(json, 'id.read', json.common?.alias?.id || '');
                                        }
                                    }}
                                />
                            }
                            label={this.props.t('Different IDs for read and write')}
                        />
                    </Grid2>
                    {typeof json.common?.alias?.id !== 'object' ? (
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Alias state')}
                                value={json.common?.alias?.id || ''}
                                style={styles.aliasIdEdit}
                                slotProps={{
                                    input: {
                                        endAdornment: json.common?.alias?.id ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear field')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        tabIndex={-1}
                                                        size="large"
                                                        onClick={() => this.setAliasItem(json, 'id', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                                onChange={e => this.setAliasItem(json, 'id', e.target.value)}
                                margin="normal"
                            />
                            <Fab
                                style={styles.button}
                                size="small"
                                onClick={() => this.setState({ selectId: true, selectRead: false, selectWrite: false })}
                            >
                                ...
                            </Fab>
                        </Grid2>
                    ) : null}

                    {typeof json.common?.alias?.id === 'object' ? (
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Alias read state')}
                                value={json.common?.alias?.id?.read || ''}
                                style={styles.aliasIdEdit}
                                slotProps={{
                                    input: {
                                        endAdornment: json.common?.alias?.id?.read ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear field')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="large"
                                                        tabIndex={-1}
                                                        onClick={() => this.setAliasItem(json, 'id.read', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                                onChange={e => this.setAliasItem(json, 'id.read', e.target.value)}
                                margin="normal"
                            />
                            <Fab
                                style={styles.button}
                                size="small"
                                onClick={() => this.setState({ selectId: false, selectRead: true, selectWrite: false })}
                            >
                                ...
                            </Fab>
                        </Grid2>
                    ) : null}

                    {typeof json.common?.alias?.id === 'object' ? (
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Alias write state')}
                                value={json.common?.alias?.id?.write || ''}
                                style={styles.aliasIdEdit}
                                slotProps={{
                                    input: {
                                        endAdornment: json.common?.alias?.id?.write ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear field')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="large"
                                                        tabIndex={-1}
                                                        onClick={() => this.setAliasItem(json, 'id.write', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                    },
                                }}
                                onChange={e => this.setAliasItem(json, 'id.write', e.target.value)}
                                margin="normal"
                            />
                            <Fab
                                style={styles.button}
                                size="small"
                                onClick={() => this.setState({ selectId: false, selectRead: false, selectWrite: true })}
                            >
                                ...
                            </Fab>
                        </Grid2>
                    ) : null}
                    <Grid2 style={styles.marginTop}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        json.common?.alias?.read !== undefined ||
                                        json.common?.alias?.write !== undefined
                                    }
                                    onChange={() => {
                                        if (funcVisible) {
                                            delete json.common.alias.read;
                                            delete json.common.alias.write;
                                        } else {
                                            json.common = json.common || {};
                                            json.common.alias = json.common.alias || {};
                                            json.common.alias.read = 'val';
                                            json.common.alias.write = 'val';
                                        }
                                        this.onChange(JSON.stringify(json, null, 2));
                                    }}
                                />
                            }
                            label={this.props.t('Use convert functions')}
                        />
                    </Grid2>
                    {funcVisible ? (
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Read converter')}
                                value={json.common?.alias?.read || 'val'}
                                style={styles.funcEdit}
                                error={!!this.state.readError}
                                slotProps={{
                                    input: {
                                        endAdornment: json.common?.alias?.read ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear field')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="large"
                                                        tabIndex={-1}
                                                        onClick={() => this.setAliasItem(json, 'read', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconFx style={styles.funcIcon} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                onChange={e => this.setAliasItem(json, 'read', e.target.value)}
                                helperText={
                                    this.state.readError || `${this.props.t('JS function like')} "val / 5 + 21"`
                                }
                                margin="normal"
                            />
                        </Grid2>
                    ) : null}
                    {funcVisible ? (
                        <Grid2>
                            <TextField
                                variant="standard"
                                label={this.props.t('Write converter')}
                                error={!!this.state.writeError}
                                value={json.common?.alias?.write || 'val'}
                                helperText={
                                    this.state.writeError || `${this.props.t('JS function like')} "(val - 21) * 5"`
                                }
                                style={styles.funcEdit}
                                slotProps={{
                                    input: {
                                        endAdornment: json.common?.alias?.write ? (
                                            <InputAdornment position="end">
                                                <Tooltip
                                                    title={I18n.t('Clear field')}
                                                    slotProps={{ popper: { sx: styles.tooltip } }}
                                                >
                                                    <IconButton
                                                        size="large"
                                                        tabIndex={-1}
                                                        onClick={() => this.setAliasItem(json, 'write', '')}
                                                    >
                                                        <IconClose />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ) : null,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconFx style={styles.funcIcon} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                onChange={e => this.setAliasItem(json, 'write', e.target.value)}
                                margin="normal"
                            />
                        </Grid2>
                    ) : null}
                </Grid2>
            );
        } catch {
            return <div>{this.props.t('Cannot parse JSON!')}</div>;
        }
    }

    onCopy(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        Utils.copyToClipboard(this.state.text, e as unknown as Event);
        window.alert(this.props.t('ra_Copied'));
    }

    onClone(oldId: string, newId: string): void {
        const newObj = JSON.parse(JSON.stringify(this.props.objects[oldId]));
        delete newObj.from;
        delete newObj.ts;
        delete newObj.user;
        newObj._id = newId;
        this.props.objects[newObj._id] = newObj; // bad practice, but no time to wait till this object will be created
        this.props.onNewObject(newObj);
    }

    renderCopyDialog(): JSX.Element | null {
        if (!this.state.showCopyDialog) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                maxWidth="md"
                fullWidth
                onClose={() => this.setState({ showCopyDialog: '' })}
            >
                <DialogTitle>{this.props.t('Enter new ID for this object')}</DialogTitle>
                <DialogContent>
                    <TextField
                        variant="standard"
                        autoFocus
                        fullWidth
                        label={this.props.t('New object ID')}
                        value={this.state.newId}
                        slotProps={{
                            input: {
                                endAdornment: this.state.newId ? (
                                    <InputAdornment position="end">
                                        <Tooltip
                                            title={I18n.t('Clear field')}
                                            slotProps={{ popper: { sx: styles.tooltip } }}
                                        >
                                            <IconButton
                                                size="small"
                                                tabIndex={-1}
                                                onClick={() => this.setState({ newId: '' })}
                                            >
                                                <IconClose />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !this.props.objects[this.state.newId]) {
                                this.setState({ showCopyDialog: '' });
                                this.onClone(this.state.showCopyDialog, this.state.newId);
                            }
                        }}
                        onChange={e => this.setState({ newId: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!!this.props.objects[this.state.newId]}
                        onClick={() => {
                            this.setState({ showCopyDialog: '' });
                            this.onClone(this.state.showCopyDialog, this.state.newId);
                        }}
                        color="primary"
                        startIcon={<IconCopy />}
                    >
                        {this.props.t('Clone')}
                    </Button>
                    <Button
                        color="grey"
                        onClick={() => this.setState({ showCopyDialog: '' })}
                        startIcon={<IconClose />}
                    >
                        {this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderPanelObject(withAlias: boolean): React.JSX.Element {
        return (
            <div
                style={{
                    ...styles.divWithoutTitle,
                    ...(withAlias ? styles.divWithoutTitleAndTab : undefined),
                    ...(this.state.error ? styles.error : undefined),
                }}
                onKeyDown={e => {
                    if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.onUpdate();
                    }
                }}
            >
                <Editor
                    value={this.state.text}
                    onChange={newValue => this.onChange(newValue)}
                    name="UNIQUE_ID_OF_DIV"
                    themeType={this.props.themeType}
                />
                {this.state.showCommonDeleteMessage ? (
                    <div style={styles.commonDeleteTip}>{I18n.t('common_delete_tip')}</div>
                ) : null}
            </div>
        );
    }

    render(): JSX.Element {
        const obj = this.props.obj;

        const withAlias = obj._id.startsWith('alias.0') && obj.type === 'state';

        let dialogStyle = styles.dialog;
        if (window.innerWidth > 1920) {
            dialogStyle = { ...dialogStyle, maxWidth: 'calc(100% - 150px)' };
        }

        let parsedObj: ioBroker.Object;
        try {
            parsedObj = JSON.parse(this.state.text);
        } catch {
            // ignore
        }

        return (
            <Dialog
                sx={{ '& .MuiPaper-root': dialogStyle }}
                open={!0}
                maxWidth="xl"
                fullWidth
                fullScreen={false}
                onClose={() => this.props.onClose()}
                aria-labelledby="edit-value-dialog-title"
                aria-describedby="edit-value-dialog-description"
            >
                <DialogTitle
                    id="edit-value-dialog-title"
                    style={{
                        width: 'calc(100% - 32px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {this.props.t('Edit object:')}{' '}
                    <Box
                        component="span"
                        style={styles.id}
                        sx={{ fontSize: { xs: 10 } }}
                    >
                        {this.props.obj._id}
                    </Box>
                </DialogTitle>

                {this.renderTabs(parsedObj)}
                {this.renderCopyDialog()}

                <DialogContent
                    sx={{
                        p:
                            this.props.width === 'xs' && this.state.tab === 'object'
                                ? '6px'
                                : this.state.tab === 'object' ||
                                    this.state.tab === 'common' ||
                                    this.state.tab === 'alias'
                                  ? '0 24px'
                                  : '0 6px',
                        overflow:
                            this.state.tab === 'object' || this.state.tab === 'common' || this.state.tab === 'alias'
                                ? undefined
                                : 'hidden',
                    }}
                >
                    {this.state.tab === 'object' ? this.renderPanelObject(withAlias) : null}
                    {this.state.tab === 'alias' &&
                    this.props.obj._id.startsWith('alias.0') &&
                    this.props.obj.type === 'state'
                        ? this.renderAliasEdit()
                        : null}
                    {this.state.tab === 'common' ? this.renderCommonEdit() : null}
                    {this.state.tab === 'state' ? this.renderStatePanel() : null}
                    {this.renderCustomPanel()}
                    {this.renderSelectDialog()}
                </DialogContent>
                <DialogActions sx={styles.wrapperButton}>
                    <Button
                        color="grey"
                        onClick={() => this.setState({ showCopyDialog: this.props.obj._id, newId: this.props.obj._id })}
                        disabled={this.state.error || this.state.changed}
                        title={this.props.t('Create a copy of this object')}
                    >
                        <IconCopy fontSize={this.props.width === 'xs' ? 'large' : undefined} />
                    </Button>
                    <div style={{ flexGrow: 1 }} />
                    {this.state.tab === 'object' && (
                        <Button
                            color="grey"
                            onClick={e => this.onCopy(e)}
                            disabled={this.state.error}
                            title={this.props.width === 'xs' ? this.props.t('Copy into clipboard') : ''}
                            startIcon={this.props.width === 'xs' ? undefined : <IconCopyClipboard />}
                        >
                            {this.props.width === 'xs' ? (
                                <IconCopyClipboard fontSize={32} />
                            ) : (
                                this.props.t('Copy into clipboard')
                            )}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        disabled={this.state.error || !this.state.changed || this.state.customError}
                        onClick={() => this.onUpdate()}
                        startIcon={this.props.width === 'xs' ? undefined : <IconCheck />}
                        color="primary"
                    >
                        {this.props.width === 'xs' ? <IconCheck fontSize="large" /> : this.props.t('Write')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        startIcon={this.props.width === 'xs' ? undefined : <IconClose />}
                    >
                        {this.props.width === 'xs' ? <IconClose fontSize="large" /> : this.props.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default ObjectBrowserEditObject;
