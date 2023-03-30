import { useState, useEffect } from 'react';
import * as Icons from '@mui/icons-material/';

const ICON_CACHE = {};

let objIcon = {
    'All': 'AllInclusive',
    'messaging': 'Message',
    'communication': 'WifiTethering',
    'general': 'Apps',
    'logic': 'VpnKey',
    'alarm': 'NotificationsActive',
    'iot-systems': 'SystemUpdateAlt',
    'misc-data': 'EmojiSymbols',
    'multimedia': 'PermMedia',
    'network': 'SettingsEthernet',
    'storage': 'Storage',
    'visualization': 'Visibility',
    'climate-control': 'SettingsBrightness',
    'date-and-time': 'DateRange',
    'energy': 'BatteryChargingFull',
    'garden': 'FilterVintage',
    'geoposition': 'LocationOn',
    'hardware': 'Phonelink',
    'health': 'Favorite',
    'household': 'House',
    'infrastructure': 'Apartment',
    'lighting': 'EmojiObjects',
    'protocols': 'DialerSip',
    'utility': 'PhonelinkSetup',
    'vehicle': 'AirportShuttle',
    'visualization-icons': 'BubbleChart',
    'visualization-widgets': 'Widgets',
    'weather': 'Brightness6',
    'metering': 'LinearScale'
};

const MaterialDynamicIcon = ({ iconName, className, adapter, socket, onClick, objIconBool }) => {
    let [url, setUrl] = useState('');

    useEffect(() => {
        if (adapter && socket) {
            ICON_CACHE[adapter] = ICON_CACHE[adapter] || socket.getObject(`system.adapter.${adapter}`);
            ICON_CACHE[adapter].then(obj =>
                obj?.common?.icon && setUrl(`../../adapter/${adapter}/${obj.common.icon}`));
        }
    }, [adapter, socket]);

    if (adapter) {
        return <img onClick={e => onClick && onClick(e)} src={url || ''} className={className} alt="" />;
    } else {
        const Element = Icons[objIconBool ? objIcon[iconName] || 'Help' : (iconName || 'Help')];
        return <Element
            className={className}
            onClick={e => onClick && onClick(e)}
        />;
    }
}

MaterialDynamicIcon.defaultProps = {
    className: null,
    iconName: 'Help',
    objIconBool: false,
};

export default MaterialDynamicIcon;