import React from 'react';

import { ControlBase } from '@iobroker/dm-utils/build/types/base';
import {
    Add, Delete, Edit,
    Refresh, Search,
    Wifi, WifiOff, Bluetooth,
    BluetoothDisabled,
    Visibility,
    LinkOff, Link as LinkIcon,
    NotListedLocation,
    PlayArrow,
    Stop,
    FastForward,
    FastRewind,
    Pause,
    Lightbulb,
    Power,
    Fluorescent,
    WbIncandescent,
} from '@mui/icons-material';

import {
    I18n,
    Icon,
} from '@iobroker/adapter-react-v5';

export function renderIcon(
    action: ControlBase,
    colors?: { primary: string, secondary: string },
    value?: string | number | boolean | null,
): React.JSX.Element | null {
    if (!action) {
        return null;
    }

    let color = (value && action.colorOn) || action.color || (action.state ? 'primary' : 'inherit');

    if (colors) {
        if (color === 'primary') {
            color = colors.primary;
        } else if (color === 'secondary') {
            color = colors.secondary;
        }
    }

    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        const iconStyle = action.icon.split(' ').map(s => s.trim()).filter(s => s !== 'fa-solid');

        if (iconStyle.includes('fa-trash-can') || iconStyle.includes('fa-trash')) {
            return <Delete style={{ color }} />;
        }
        if (iconStyle.includes('fa-pen')) {
            return <Edit style={{ color }} />;
        }
        if (iconStyle.includes('fa-redo-alt')) {
            return <Refresh style={{ color }} />;
        }
        if (iconStyle.includes('fa-plus')) {
            return <Add style={{ color }} />;
        }
        if (iconStyle.includes('fa-wifi')) {
            return <Wifi style={{ color }} />;
        }
        if (iconStyle.includes('fa-wifi-slash')) {
            return <WifiOff style={{ color }} />;
        }
        if (iconStyle.includes('fa-bluetooth')) {
            return <Bluetooth style={{ color }} />;
        }
        if (iconStyle.includes('fa-bluetooth-slash')) {
            return <BluetoothDisabled style={{ color }} />;
        }
        if (iconStyle.includes('fa-eye')) {
            return <Visibility style={{ color }} />;
        }
        if (iconStyle.includes('fa-search')) {
            return <Search style={{ color }} />;
        }
        if (iconStyle.includes('fa-unlink')) {
            return <LinkOff style={{ color }} />;
        }
        if (iconStyle.includes('fa-link')) {
            return <LinkIcon style={{ color }} />;
        }
        if (iconStyle.includes('fa-search-location')) {
            return <NotListedLocation style={{ color }} />;
        }
        if (iconStyle.includes('fa-play')) {
            return <PlayArrow style={{ color }} />;
        }
        if (iconStyle.includes('fa-stop')) {
            return <Stop style={{ color }} />;
        }
        if (iconStyle.includes('fa-pause')) {
            return <Pause style={{ color }} />;
        }
        if (iconStyle.includes('forward') || iconStyle.includes('fa-forward')) {
            return <FastForward style={{ color }} />;
        }
        if (iconStyle.includes('rewind') || iconStyle.includes('fa-rewind')) {
            return <FastRewind style={{ color }} />;
        }
        return null;
    }
    if (value && action.iconOn?.startsWith('data:image')) {
        return <Icon src={action.iconOn} style={{ color }} />;
    }
    if (action.icon?.startsWith('data:image')) {
        return <Icon src={action.icon} style={{ color }} />;
    }
    if (action.id === 'edit' || action.id === 'rename') {
        return <Edit style={{ color }} />;
    }
    if (action.id === 'delete') {
        return <Delete style={{ color }} />;
    }
    if (action.id === 'refresh') {
        return <Refresh style={{ color }} />;
    }
    if (action.id === 'newDevice' || action.id === 'new' || action.id === 'add') {
        return <Add style={{ color }} />;
    }
    if (action.id === 'discover' || action.id === 'search') {
        return <Search style={{ color }} />;
    }
    if (action.id === 'unpairDevice') {
        return <LinkOff style={{ color }} />;
    }
    if (action.id === 'pairDevice') {
        return <LinkIcon style={{ color }} />;
    }
    if (action.id === 'identify') {
        return <NotListedLocation style={{ color }} />;
    }
    if (action.id === 'play') {
        return <PlayArrow style={{ color }} />;
    }
    if (action.id === 'stop') {
        return <Stop style={{ color }} />;
    }
    if (action.id === 'pause') {
        return <Pause style={{ color }} />;
    }
    if (action.id === 'forward' || action.id === 'next') {
        return <FastForward style={{ color }} />;
    }
    if (action.id === 'rewind' || action.id === 'previous') {
        return <FastRewind style={{ color }} />;
    }
    if (action.id === 'lamp' || action.id === 'light') {
        return <Lightbulb style={{ color }} />;
    }
    if (action.id === 'backlight') {
        return <Fluorescent style={{ color }} />;
    }
    if (action.id === 'dimmer') {
        return <WbIncandescent style={{ color }} />;
    }
    if (action.id === 'socket') {
        return <Power style={{ color }} />;
    }
    return null;
}

let language: ioBroker.Languages;

/**
 * Get Translation
 * @param {string | object} text - Text to translate
 * @returns {string}
 */
export function getTranslation(text: ioBroker.StringOrTranslated): string {
    language = language || I18n.getLanguage();

    if (typeof text === 'object') {
        const words = text as ioBroker.StringOrTranslated;
        // @ts-ignore
        return words[language] || text.en;
    }

    return I18n.t(text);
}
