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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    TextField,
    Grid2,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Fab,
    IconButton,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
    Autocomplete,
    Box,
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

const DEFAULT_ROLES = [
    'button',
    'button.close.blind',
    'button.fastforward',
    'button.forward',
    'button.long',
    'button.mode',
    'button.mode.auto',
    'button.mode.silent',
    'button.next',
    'button.open.blind',
    'button.open.door',
    'button.pause',
    'button.stop',
    'button.stop.tilt',
    'button.volume.up',
    'chart',
    'date',
    'date.end',
    'date.forecast.1',
    'date.start',
    'date.sunrise',
    'date.sunset',
    'dayofweek',
    'html',
    'indicator',
    'indicator.alarm',
    'indicator.alarm.fire',
    'indicator.alarm.flood',
    'indicator.alarm.health',
    'indicator.alarm.secure',
    'indicator.connected',
    'indicator.maintenance',
    'indicator.maintenance.alarm',
    'indicator.maintenance.lowbat',
    'indicator.maintenance.waste',
    'indicator.reachable',
    'info.address',
    'info.display',
    'info.firmware',
    'info.hardware',
    'info.ip',
    'info.mac',
    'info.name',
    'info.port',
    'info.serial',
    'info.standby',
    'info.status',
    'json',
    'level',
    'level.bass',
    'level.blind',
    'level.color.blue',
    'level.color.hue',
    'level.color.luminance',
    'level.color.red',
    'level.color.saturation',
    'level.curtain',
    'level.mode.airconditioner',
    'level.mode.cleanup',
    'level.mode.fan',
    'level.mode.swing',
    'level.mode.thermostat',
    'level.mode.work',
    'level.temperature',
    'level.tilt',
    'level.timer',
    'level.treble',
    'level.valve',
    'level.volume',
    'level.volume.group',
    'list',
    'location',
    'media.add',
    'media.bitrate',
    'media.broadcastDate',
    'media.browser',
    'media.clear',
    'media.content',
    'media.cover',
    'media.cover.big',
    'media.cover.small',
    'media.date',
    'media.duration',
    'media.duration.text',
    'media.elapsed',
    'media.elapsed.text',
    'media.episode',
    'media.genre',
    'media.input',
    'media.jump',
    'media.link',
    'media.mode.repeat',
    'media.mode.shuffle',
    'media.mute',
    'media.mute.group',
    'media.playid',
    'media.playlist',
    'media.season',
    'media.seek',
    'media.state',
    'media.titel',
    'media.track',
    'media.tts',
    'media.url',
    'media.url.announcement',
    'medien.artist',
    'sensor.alarm',
    'sensor.alarm.fire',
    'sensor.alarm.flood',
    'sensor.alarm.power',
    'sensor.alarm.secure',
    'sensor.door',
    'sensor.light',
    'sensor.lock',
    'sensor.motion',
    'sensor.noise',
    'sensor.rain',
    'sensor.window',
    'state',
    'switch',
    'switch.enable',
    'switch.gate',
    'switch.gate',
    'switch.light',
    'switch.lock.door',
    'switch.lock.window',
    'switch.mode',
    'switch.mode.auto',
    'switch.mode.boost',
    'switch.mode.color',
    'switch.mode.manual',
    'switch.mode.moonlight',
    'switch.mode.party',
    'switch.mode.silent',
    'switch.power',
    'switch.power.zone',
    'text',
    'text.phone',
    'text.url',
    'url',
    'url.audio',
    'url.blank',
    'url.cam',
    'url.same',
    'value',
    'value.battery',
    'value.blind',
    'value.blood.sugar',
    'value.brightness',
    'value.clouds',
    'value.current',
    'value.curtain',
    'value.default',
    'value.direction',
    'value.direction.max.wind',
    'value.direction.min.wind',
    'value.direction.wind',
    'value.direction.wind.forecast.0',
    'value.direction.wind.forecast.1',
    'value.distance',
    'value.fill',
    'value.gate',
    'value.gps',
    'value.gps.accuracy',
    'value.gps.elevation',
    'value.gps.latitude',
    'value.gps.longitude',
    'value.gps.radius',
    'value.health.bmi',
    'value.health.bpm',
    'value.health.calories',
    'value.health.fat',
    'value.health.steps',
    'value.health.weight',
    'value.humidity',
    'value.humidity',
    'value.humidity.max',
    'value.humidity.min',
    'value.interval',
    'value.lock',
    'value.min',
    'value.position',
    'value.power',
    'value.power.consumption',
    'value.power.production',
    'value.power.reactive',
    'value.precipitation',
    'value.precipitation.chance',
    'value.precipitation.day.forecast.0',
    'value.precipitation.forecast.0',
    'value.precipitation.hour',
    'value.precipitation.night.forecast.0',
    'value.precipitation.today',
    'value.precipitation.type',
    'value.prepitation.forecast.0',
    'value.prepitation.forecast.1',
    'value.prepitation.forecast.1',
    'value.pressure',
    'value.pressure.forecast.0',
    'value.pressure.forecast.1',
    'value.radiation',
    'value.rain',
    'value.rain.hour',
    'value.rain.today',
    'value.severity',
    'value.snow',
    'value.snow.hour',
    'value.snow.today',
    'value.snowline',
    'value.speed',
    'value.speed.max.wind',
    'value.speed.min.wind',
    'value.speed.wind',
    'value.speed.wind.forecast.0',
    'value.speed.wind.gust',
    'value.state',
    'value.sun.azimuth',
    'value.sun.elevation',
    'value.temperature',
    'value.temperature',
    'value.temperature.dewpoint',
    'value.temperature.feelslike',
    'value.temperature.max',
    'value.temperature.max.forecast.0',
    'value.temperature.min',
    'value.temperature.min.forecast.0',
    'value.temperature.min.forecast.1',
    'value.temperature.windchill',
    'value.tilt',
    'value.time',
    'value.uv',
    'value.valve',
    'value.voltage',
    'value.warning',
    'value.waste',
    'value.water',
    'waether.title',
    'weather.chart.url',
    'weather.chart.url.forecast',
    'weather.direction.wind',
    'weather.direction.wind.forecast.0',
    'weather.html',
    'weather.icon',
    'weather.icon.forecast.1',
    'weather.icon.name',
    'weather.icon.wind',
    'weather.json',
    'weather.state',
    'weather.state.forecast.0',
    'weather.state.forecast.1',
    'weather.title.forecast.0',
    'weather.title.short',
    'weather.type',
] as const;

interface EditSchemaTab {
    json: ConfigItemPanel | ConfigItemTabs;
    label?: ioBroker.StringOrTranslated;
    /** Do not translate label */
    noTranslation?: boolean;
    path?: string; // path in object, like common or native.json
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
    roleArray: string[];
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
                    label={this.props.t('Common')}
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
        json.common = json.common || ({} as any);
        const commonAlias = json.common.alias || ({} as Record<string, any>);

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

        // @ts-expect-error fix later
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
                    {nameKey}
                </Button>
            </div>
        );
    }

    buttonRemoveKey(nameKey: string, cb: () => void): JSX.Element {
        const { t } = this.props;
        return (
            <Tooltip
                title={t('Remove attribute %s', nameKey)}
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                <Box
                    component="div"
                    sx={styles.close}
                    onClick={cb}
                />
            </Tooltip>
        );
    }

    renderCommonEdit(): JSX.Element {
        try {
            const json = JSON.parse(this.state.text);
            const stateTypeArray: ioBroker.CommonType[] = ['number', 'string', 'boolean', 'array', 'object', 'mixed'];
            const disabled = false;
            const { t, roleArray, obj } = this.props;
            const checkState = obj.type === 'state';
            const checkRole = obj.type === 'channel' || obj.type === 'device' || checkState;

            // add default roles to roleArray
            const bigRoleArray: string[] = [...DEFAULT_ROLES];
            roleArray.forEach(role => !bigRoleArray.includes(role) && bigRoleArray.push(role));
            bigRoleArray.sort();

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
                                value={Utils.getObjectNameFromObj(json, I18n.getLanguage(), {}, false, true)}
                                onChange={el => this.setCommonItem(json, 'name', el.target.value)}
                            />
                        ) : (
                            ObjectBrowserEditObject.buttonAddKey('name', () => this.setCommonItem(json, 'name', ''))
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
                                    {this.buttonRemoveKey('type', () => this.removeCommonItem(json, 'type'))}
                                </Box>
                            ) : (
                                ObjectBrowserEditObject.buttonAddKey('type', () =>
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
                                                    // @ts-expect-error check later
                                                    onClick={el => this.setCommonItem(json, 'read', el.target.checked)}
                                                />
                                            }
                                            label={t('Readable')}
                                        />
                                        {this.buttonRemoveKey('read', () => this.removeCommonItem(json, 'read'))}
                                    </Box>
                                ) : (
                                    ObjectBrowserEditObject.buttonAddKey('read', () =>
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
                                                    // @ts-expect-error check later
                                                    onClick={el => this.setCommonItem(json, 'write', el.target.checked)}
                                                />
                                            }
                                            label={t('Writeable')}
                                        />
                                        {this.buttonRemoveKey('write', () => this.removeCommonItem(json, 'write'))}
                                    </Box>
                                ) : (
                                    ObjectBrowserEditObject.buttonAddKey('write', () =>
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
                                        onChange={(_, e) => this.setCommonItem(json, 'role', e)}
                                        options={roleArray}
                                        renderInput={params => (
                                            <TextField
                                                variant="standard"
                                                {...params}
                                                label={t('Role')}
                                            />
                                        )}
                                    />
                                    {this.buttonRemoveKey('role', () => this.removeCommonItem(json, 'role'))}
                                </Box>
                            ) : (
                                ObjectBrowserEditObject.buttonAddKey('role', () => this.setCommonItem(json, 'role', ''))
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
                                    value={json.common.color}
                                    onChange={el => this.setCommonItem(json, 'color', el.target.value)}
                                />
                                {this.buttonRemoveKey('color', () => this.removeCommonItem(json, 'color'))}
                            </Box>
                        ) : (
                            ObjectBrowserEditObject.buttonAddKey('color', () => this.setCommonItem(json, 'color', ''))
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
                                        {this.buttonRemoveKey('min', () => this.removeCommonItem(json, 'min'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('min', () =>
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
                                        {this.buttonRemoveKey('max', () => this.removeCommonItem(json, 'max'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('max', () =>
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
                                        {this.buttonRemoveKey('step', () => this.removeCommonItem(json, 'step'))}
                                    </Box>
                                ) : (
                                    <Box
                                        component="div"
                                        sx={styles.flex}
                                    >
                                        {ObjectBrowserEditObject.buttonAddKey('step', () =>
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
                                        value={json.common.unit}
                                        onChange={el => this.setCommonItem(json, 'unit', el.target.value)}
                                    />
                                    {this.buttonRemoveKey('unit', () => this.removeCommonItem(json, 'unit'))}
                                </Box>
                            ) : (
                                <div style={styles.flexDrop}>
                                    {ObjectBrowserEditObject.buttonAddKey('unit', () =>
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
                            {this.buttonRemoveKey('icon', () => this.removeCommonItem(json, 'icon'))}
                        </Box>
                    ) : (
                        <Box
                            component="div"
                            sx={styles.flex}
                        >
                            {ObjectBrowserEditObject.buttonAddKey('icon', () => this.setCommonItem(json, 'icon', ''))}
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
                                                <IconButton
                                                    size="large"
                                                    onClick={() => this.setAliasItem(json, 'id', '')}
                                                >
                                                    <IconClose />
                                                </IconButton>
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
                                                <IconButton
                                                    size="large"
                                                    onClick={() => this.setAliasItem(json, 'id.read', '')}
                                                >
                                                    <IconClose />
                                                </IconButton>
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
                                                <IconButton
                                                    size="large"
                                                    onClick={() => this.setAliasItem(json, 'id.write', '')}
                                                >
                                                    <IconClose />
                                                </IconButton>
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
                                                <IconButton
                                                    size="large"
                                                    onClick={() => this.setAliasItem(json, 'read', '')}
                                                >
                                                    <IconClose />
                                                </IconButton>
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
                                                <IconButton
                                                    size="large"
                                                    onClick={() => this.setAliasItem(json, 'write', '')}
                                                >
                                                    <IconClose />
                                                </IconButton>
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
