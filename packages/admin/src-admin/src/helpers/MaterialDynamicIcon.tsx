import React, { useState, useEffect } from 'react';
import {
    AllInclusive, Message, WifiTethering, Apps, VpnKey,
    NotificationsActive, SystemUpdateAlt, EmojiSymbols, PermMedia, SettingsEthernet, Storage,
    Visibility, SettingsBrightness, DateRange, BatteryChargingFull, FilterVintage, LocationOn, Phonelink,
    Favorite, House, Apartment, EmojiObjects, DialerSip, PhonelinkSetup, AirportShuttle, BubbleChart,
    Widgets, Brightness6, LinearScale, Help,
} from '@mui/icons-material';
import { type SvgIconComponent } from '@mui/icons-material';

const ICON_CACHE: Record<string, Promise<ioBroker.AdapterObject>> = {};

const objIcon: Record<string, SvgIconComponent> = {
    All: AllInclusive,
    messaging: Message,
    communication: WifiTethering,
    general: Apps,
    logic: VpnKey,
    alarm: NotificationsActive,
    'iot-systems': SystemUpdateAlt,
    'misc-data': EmojiSymbols,
    multimedia: PermMedia,
    network: SettingsEthernet,
    storage: Storage,
    visualization: Visibility,
    'climate-control': SettingsBrightness,
    'date-and-time': DateRange,
    energy: BatteryChargingFull,
    garden: FilterVintage,
    geoposition: LocationOn,
    hardware: Phonelink,
    health: Favorite,
    household: House,
    infrastructure: Apartment,
    lighting: EmojiObjects,
    protocols: DialerSip,
    utility: PhonelinkSetup,
    vehicle: AirportShuttle,
    'visualization-icons': BubbleChart,
    'visualization-widgets': Widgets,
    weather: Brightness6,
    metering: LinearScale,
};

interface MaterialDynamicIconProps {
    iconName?: string;
    className?: string;
    style?: React.CSSProperties;
    adapter?: string;
    socket?: any;
    onClick?: (e: React.MouseEvent) => void;
}

const MaterialDynamicIcon = ({
    iconName, className, adapter, socket, onClick, style,
}: MaterialDynamicIconProps) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (adapter && socket) {
            ICON_CACHE[adapter] = ICON_CACHE[adapter] || socket.getObject(`system.adapter.${adapter}`);
            ICON_CACHE[adapter].then(obj =>
                obj?.common?.icon && setUrl(`../../adapter/${adapter}/${obj.common.icon}`));
        }
    }, [adapter, socket]);

    if (adapter) {
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        return <img
            onClick={e => onClick && onClick(e)}
            src={url || ''}
            className={className}
            style={style}
            alt=""
        />;
    }
    const Element = objIcon[iconName || 'Help'] || Help;

    return <Element
        className={className}
        style={style}
        onClick={(e: React.MouseEvent) => onClick && onClick(e)}
    />;
};

export default MaterialDynamicIcon;
