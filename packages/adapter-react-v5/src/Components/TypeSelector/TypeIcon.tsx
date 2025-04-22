import React, { useEffect } from 'react';

import { Box, Tooltip } from '@mui/material';

import { AiOutlineLineChart as TypeIconChart } from 'react-icons/ai';
import { GoDeviceCameraVideo as TypeIconCamera } from 'react-icons/go';

import {
    // FaExternalLinkSquareAlt as TypeIconURL,
    FaImage as TypeIconImage,
    FaRegLightbulb as TypeIconDimmer,
    FaInfoCircle as TypeIconInfo,
    FaLightbulb as TypeIconLight,
    FaLock as TypeIconLock,
    FaStreetView as TypeIconLocation,
    FaStepForward as TypeIconMedia,
    FaSlidersH as TypeIconSlider,
    FaVolumeDown as TypeIconVolume,
    FaVolumeUp as TypeIconVolumeGroup,
    FaFan as TypeIconAC,
    FaWrench as TypeIconInstance,
} from 'react-icons/fa';

import {
    MdFormatColorFill as TypeIconHUE,
    MdFormatColorFill as TypeIconCT,
    MdWarning as TypeIconWarning,
    MdQuestionMark as TypeIconUnknown,
    MdOutlineMyLocation as TypeIconLocationOne,
    MdDeviceHub as TypeIconHub3,
    MdPolyline as TypeIconNode,
    MdHub as TypeIconHub5,
    MdControlCamera as TypeIconController,
} from 'react-icons/md';
import { WiCloudy as TypeIconWeather } from 'react-icons/wi';
import { IoIosRadioButtonOn as TypeIconButtonSensor } from 'react-icons/io';
import { TbSunElectricity as TypeIconIlluminance } from 'react-icons/tb';
import { PiPaletteDuotone as TypeIconRGBWSingle } from 'react-icons/pi';

import { Types } from '@iobroker/type-detector';

import { I18n } from '../../i18n';
import { Icon } from '../Icon';

import {
    Cleaner as TypeIconVacuumCleaner,
    Humidity as TypeIconHumidity,
    Jalousie as TypeIconBlinds,
    PushButton as TypeIconButton,
    DoorOpened as TypeIconDoor,
    FireOn as TypeIconFireAlarm,
    FloodOn as TypeIconFloodAlarm,
    Gate as TypeIconGate,
    MotionOn as TypeIconMotion,
    RGB as TypeIconRGB,
    Socket as TypeIconSocket,
    Thermometer as TypeIconTemperature,
    Thermostat as TypeIconThermostat,
    // HeatValve as TypeIconValve,
    WindowOpened as TypeIconWindow,
    WindowTilted as TypeIconWindowTilt,
    type IconPropsSVG,
} from './icons';

export type TypesExtended = Types | 'invalid' | 'hub3' | 'node' | 'hub5' | 'controller';

const TYPE_ICONS: Record<TypesExtended, React.FC<IconPropsSVG>> = {
    [Types.airCondition]: TypeIconAC,
    [Types.blind]: TypeIconBlinds,
    [Types.blindButtons]: TypeIconBlinds,
    [Types.button]: TypeIconButton,
    [Types.buttonSensor]: TypeIconButtonSensor,
    [Types.camera]: TypeIconCamera,
    [Types.chart]: TypeIconChart,
    // [Types.url]: TypeIconURL,
    [Types.image]: TypeIconImage,
    [Types.dimmer]: TypeIconDimmer,
    [Types.door]: TypeIconDoor,
    [Types.fireAlarm]: TypeIconFireAlarm,
    // @ts-expect-error special case
    'sensor.alarm.fire': TypeIconFireAlarm,
    [Types.floodAlarm]: TypeIconFloodAlarm,
    'sensor.alarm.flood': TypeIconFloodAlarm,
    [Types.gate]: TypeIconGate,
    [Types.humidity]: TypeIconHumidity,
    [Types.illuminance]: TypeIconIlluminance,
    [Types.info]: TypeIconInfo,
    [Types.light]: TypeIconLight,
    [Types.lock]: TypeIconLock,
    [Types.location]: TypeIconLocation,
    [Types.location_one]: TypeIconLocationOne,
    [Types.media]: TypeIconMedia,
    [Types.motion]: TypeIconMotion,
    [Types.ct]: TypeIconCT,
    [Types.rgb]: TypeIconRGB,
    [Types.rgbSingle]: TypeIconRGB,
    [Types.rgbwSingle]: TypeIconRGBWSingle,
    [Types.hue]: TypeIconHUE,
    [Types.cie]: TypeIconRGB,
    [Types.slider]: TypeIconSlider,
    [Types.socket]: TypeIconSocket,
    [Types.temperature]: TypeIconTemperature,
    [Types.thermostat]: TypeIconThermostat,
    // [Types.valve]: TypeIconValve,
    [Types.vacuumCleaner]: TypeIconVacuumCleaner,
    [Types.volume]: TypeIconVolume,
    [Types.volumeGroup]: TypeIconVolumeGroup,
    [Types.window]: TypeIconWindow,
    [Types.windowTilt]: TypeIconWindowTilt,
    [Types.weatherCurrent]: TypeIconWeather,
    [Types.weatherForecast]: TypeIconWeather,
    [Types.warning]: TypeIconWarning,

    [Types.unknown]: TypeIconUnknown,
    [Types.instance]: TypeIconInstance,

    // Special matter types
    invalid: TypeIconWarning,
    hub3: TypeIconHub3,
    node: TypeIconNode,
    hub5: TypeIconHub5,
    controller: TypeIconController,
};

const defaultStyle: React.CSSProperties = {
    width: 32,
    height: 32,
};

export interface IconProps {
    /** URL, UTF-8 character, or svg code (data:image/svg...) */
    src?: string | React.JSX.Element | null | undefined;
    /** Class name */
    className?: string;
    /** Style for image */
    style?: React.CSSProperties;
    /** Styles for mui */
    sx?: Record<string, any>;
    /** Tooltip */
    title?: string | true;
    /** Styles for utf-8 characters */
    styleUTF8?: React.CSSProperties;
    /** On error handler */
    onError?: React.ReactEventHandler<HTMLImageElement>;
    /** Reference to image */
    ref?: React.RefObject<HTMLImageElement>;
    /** Alternative text for image */
    alt?: string;
    /** On click handler */
    onClick?: React.MouseEventHandler<any>;
}

export type TypeIconProps = IconProps & { type?: TypesExtended };

export function TypeIcon(props: TypeIconProps): React.JSX.Element | null {
    const language = I18n.getLanguage();
    const [loaded, setLoaded] = React.useState(window.iobTypeWordsLoaded === language);

    useEffect(() => {
        if (props.title && window.iobTypeWordsLoaded !== language) {
            // Load translations dynamically
            void import(`./i18n/${language}.json`).then(i18n => {
                I18n.extendTranslations(i18n.default, language);
                window.iobTypeWordsLoaded = language;
                setLoaded(true);
            });
        }
    }, [language, props.title]);

    if (!loaded && props.title) {
        return (
            <Box
                style={{ ...defaultStyle, ...(props.style || undefined) }}
                className={props.className}
                sx={props.sx}
            />
        );
    }
    // src could contain a device type too, so detect if it is a type
    const type: TypesExtended | undefined =
        props.type || (props.src ? (Object.keys(TYPE_ICONS).find(type => props.src === type) as TypesExtended) : undefined);

    if (!type && props.src) {
        return (
            <Icon
                style={defaultStyle}
                {...props}
                title={props.title === true ? undefined : props.title}
                src={props.src}
            />
        );
    }

    const TypeIcon = type && TYPE_ICONS[type];
    if (!TypeIcon) {
        // Show the first letter of a type
        return type ? (
            <span style={{ ...defaultStyle, ...(props.style || undefined) }}>{type[0].toUpperCase()}</span>
        ) : null;
    }

    const icon = (
        <TypeIcon
            style={{ ...defaultStyle, ...(props.style || undefined) }}
            onClick={props.onClick}
            className={props.className}
            sx={props.sx}
        />
    );

    if (props.title) {
        return (
            <Tooltip
                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                title={props.title === true ? I18n.t(`type-${type}`) : props.title}
            >
                <div style={{ display: 'flex' }}>{icon}</div>
            </Tooltip>
        );
    }

    return icon;
}
