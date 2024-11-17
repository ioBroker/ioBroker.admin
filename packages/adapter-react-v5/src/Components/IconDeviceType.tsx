import React from 'react';
import {
    AcUnit,
    Air,
    Blinds,
    BlindsClosed,
    ColorLens,
    ControlCamera,
    DeviceHub,
    DirectionsRun,
    DoorSliding,
    Gradient,
    Hub,
    Image,
    Info,
    Lightbulb,
    LocationOn,
    Lock,
    Palette,
    PlayArrowRounded,
    Polyline,
    Power,
    QuestionMark,
    SensorDoor,
    type SvgIconComponent,
    Thermostat,
    Timeline,
    TipsAndUpdates,
    Tune,
    Videocam,
    VolumeUp,
    Warning,
    Water,
    WaterDrop,
    WbSunny,
    Whatshot,
    Window,
} from '@mui/icons-material';
import { Icon, type IconProps } from './Icon';
import { Utils } from './Utils';
import { IconButtonImage } from '../icons/IconButtonImage';
import { IconVacuum } from '../icons/IconVacuum';
import { IconInstance } from '../icons/IconInstance';

// Taken from type detector: https://github.com/ioBroker/ioBroker.type-detector/blob/master/src/types.ts#L27
const deviceTypes = [
    'unknown',
    'airCondition',
    'blind',
    'blindButtons',
    'button',
    'buttonSensor',
    'camera',
    'chart',
    'cie',
    'ct',
    'dimmer',
    'door',
    'fireAlarm',
    'floodAlarm',
    'gate',
    'hue',
    'humidity',
    'image',
    'info',
    'instance',
    'light',
    'location',
    'lock',
    'media',
    'motion',
    'rgb',
    'rgbSingle',
    'rgbwSingle',
    'slider',
    'socket',
    'temperature',
    'thermostat',
    'vacuumCleaner',
    'volume',
    'volumeGroup',
    'warning',
    'weatherCurrent',
    'weatherForecast',
    'window',
    'windowTilt',
    'hub3',
    'node',
    'controller',
    'hub5',
] as const;

export type DeviceType = (typeof deviceTypes)[number];

export function isDeviceIcon(icon: string): DeviceType | null {
    if (deviceTypes.includes(icon as DeviceType)) {
        return icon as DeviceType;
    }
    return null;
}

export function getDeviceIcon(type: DeviceType, props?: IconProps): React.JSX.Element | null {
    let SvgComponent: SvgIconComponent | undefined;
    if (type === 'hub3') {
        SvgComponent = DeviceHub;
    }
    if (type === 'node') {
        SvgComponent = Polyline;
    }
    if (type === 'hub5') {
        SvgComponent = Hub;
    }
    if (type === 'controller') {
        SvgComponent = ControlCamera;
    }
    if (type === 'airCondition') {
        SvgComponent = AcUnit;
    }
    if (type === 'blind') {
        SvgComponent = Blinds;
    }
    if (type === 'camera') {
        SvgComponent = Videocam;
    }
    if (type === 'chart') {
        SvgComponent = Timeline;
    }
    if (type === 'ct') {
        SvgComponent = Gradient;
    }
    if (type === 'dimmer') {
        SvgComponent = TipsAndUpdates;
    }
    if (type === 'door') {
        SvgComponent = SensorDoor;
    }
    if (type === 'fireAlarm') {
        SvgComponent = Whatshot;
    }
    if (type === 'floodAlarm') {
        SvgComponent = Water;
    }
    if (type === 'humidity') {
        SvgComponent = WaterDrop;
    }
    if (type === 'image') {
        SvgComponent = Image;
    }
    if (type === 'light') {
        SvgComponent = Lightbulb;
    }
    if (type === 'lock') {
        SvgComponent = Lock;
    }
    if (type === 'location') {
        SvgComponent = LocationOn;
    }
    if (type === 'media') {
        SvgComponent = PlayArrowRounded;
    }
    if (type === 'motion') {
        SvgComponent = DirectionsRun;
    }
    if (type === 'rgb') {
        SvgComponent = Palette;
    }
    if (type === 'rgbSingle') {
        SvgComponent = Palette;
    }
    if (type === 'rgbwSingle') {
        SvgComponent = Palette;
    }
    if (type === 'slider') {
        SvgComponent = Tune;
    }
    if (type === 'socket') {
        SvgComponent = Power;
    }
    if (type === 'temperature') {
        SvgComponent = Thermostat;
    }
    if (type === 'thermostat') {
        SvgComponent = Thermostat;
    }
    if (type === 'volume') {
        SvgComponent = VolumeUp;
    }
    if (type === 'volumeGroup') {
        SvgComponent = VolumeUp;
    }
    if (type === 'weatherCurrent') {
        SvgComponent = Air;
    }
    if (type === 'weatherForecast') {
        SvgComponent = WbSunny;
    }
    if (type === 'window') {
        SvgComponent = Window;
    }
    if (type === 'windowTilt') {
        SvgComponent = Window;
    }
    if (type === 'blindButtons') {
        SvgComponent = BlindsClosed;
    }
    if (type === 'button') {
        SvgComponent = IconButtonImage as SvgIconComponent;
    }
    if (type === 'buttonSensor') {
        SvgComponent = IconButtonImage as SvgIconComponent;
    }
    if (type === 'cie') {
        SvgComponent = ColorLens;
    }
    if (type === 'gate') {
        SvgComponent = DoorSliding;
    }
    if (type === 'hue') {
        SvgComponent = ColorLens;
    }
    if (type === 'info') {
        SvgComponent = Info;
    }
    if (type === 'instance') {
        SvgComponent = IconInstance as SvgIconComponent;
    }
    if (type === 'unknown') {
        SvgComponent = QuestionMark;
    }
    if (type === 'vacuumCleaner') {
        SvgComponent = IconVacuum as SvgIconComponent;
    }
    if (type === 'warning') {
        SvgComponent = Warning;
    }

    if (SvgComponent) {
        return (
            <SvgComponent
                style={props.style || undefined}
                className={Utils.clsx(props.className, 'iconOwn')}
            />
        );
    }
    return null;
}

export function IconDeviceType(props: IconProps): React.JSX.Element | null {
    const icon = getDeviceIcon(props.src as DeviceType, props);
    if (icon) {
        return icon;
    }

    return <Icon {...props} />;
}
