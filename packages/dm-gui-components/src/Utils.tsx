import React from 'react';

import type { ControlBase } from '@iobroker/dm-utils/build/types/base';
import type { ActionBase } from '@iobroker/dm-utils/build/types/api';
import {
    Add,
    Bluetooth,
    BluetoothDisabled,
    Delete,
    Edit,
    FastForward,
    FastRewind,
    Fluorescent,
    Group,
    Info,
    Lightbulb,
    Link as LinkIcon,
    LinkOff,
    NotListedLocation,
    Pause,
    Person,
    PlayArrow,
    Power,
    QrCode,
    QuestionMark,
    Refresh,
    Search,
    Settings,
    Stop,
    Visibility,
    WbIncandescent,
    Wifi,
    WifiFind,
    WifiOff,
} from '@mui/icons-material';

import { I18n, Icon } from '@iobroker/adapter-react-v5';

function getFaIcon(icon: string, color?: string): React.JSX.Element | null {
    const iconStyle = icon
        .split(' ')
        .map(s => s.trim())
        .filter(s => s !== 'fa-solid');

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
    if (iconStyle.includes('fa-qrcode') || iconStyle.includes('qrcode')) {
        return <QrCode style={{ color }} />;
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
    if (iconStyle.includes('forward')) {
        return <FastForward style={{ color }} />;
    }
    if (iconStyle.includes('rewind')) {
        return <FastRewind style={{ color }} />;
    }
    if (iconStyle.includes('users') || iconStyle.includes('group')) {
        return <Group style={{ color }} />;
    }
    if (iconStyle.includes('user')) {
        return <Person style={{ color }} />;
    }
    return <QuestionMark style={{ color }} />;
}

function getIconByName(name: string, altName?: string, color?: string): React.JSX.Element | null {
    if (name === 'edit' || name === 'rename' || altName === 'edit' || altName === 'rename') {
        return <Edit style={{ color }} />;
    }
    if (name === 'delete' || altName === 'delete') {
        return <Delete style={{ color }} />;
    }
    if (name === 'refresh' || altName === 'refresh') {
        return <Refresh style={{ color }} />;
    }
    if (
        name === 'newDevice' ||
        name === 'new' ||
        name === 'add' ||
        altName === 'newDevice' ||
        altName === 'new' ||
        altName === 'add'
    ) {
        return <Add style={{ color }} />;
    }
    if (name === 'discover' || name === 'search' || altName === 'discover' || altName === 'search') {
        return <Search style={{ color }} />;
    }
    if (name === 'unpairDevice' || name === 'unpair' || altName === 'unpairDevice' || altName === 'unpair') {
        return <LinkOff style={{ color }} />;
    }
    if (name === 'pairDevice' || name === 'pair' || altName === 'pairDevice' || altName === 'pair') {
        return <LinkIcon style={{ color }} />;
    }
    if (name === 'identify' || altName === 'identify') {
        return <NotListedLocation style={{ color }} />;
    }
    if (name === 'play' || altName === 'play') {
        return <PlayArrow style={{ color }} />;
    }
    if (name === 'stop' || altName === 'stop') {
        return <Stop style={{ color }} />;
    }
    if (name === 'pause' || altName === 'pause') {
        return <Pause style={{ color }} />;
    }
    if (name === 'forward' || name === 'next' || altName === 'forward' || altName === 'next') {
        return <FastForward style={{ color }} />;
    }
    if (name === 'rewind' || name === 'previous' || altName === 'rewind' || altName === 'previous') {
        return <FastRewind style={{ color }} />;
    }
    if (name === 'lamp' || name === 'light' || altName === 'lamp' || altName === 'light') {
        return <Lightbulb style={{ color }} />;
    }
    if (name === 'backlight' || altName === 'backlight') {
        return <Fluorescent style={{ color }} />;
    }
    if (name === 'dimmer' || altName === 'dimmer') {
        return <WbIncandescent style={{ color }} />;
    }
    if (name === 'socket' || altName === 'socket') {
        return <Power style={{ color }} />;
    }
    if (name === 'settings' || altName === 'settings') {
        return <Settings style={{ color }} />;
    }
    if (name === 'users' || name === 'group' || altName === 'users' || altName === 'group') {
        return <Group style={{ color }} />;
    }
    if (name === 'user' || altName === 'user') {
        return <Person style={{ color }} />;
    }
    if (name === 'qrcode' || altName === 'qrcode') {
        return <QrCode style={{ color }} />;
    }
    if (name === 'identify' || altName === 'identify') {
        return <WifiFind style={{ color }} />;
    }
    if (name === 'info' || altName === 'info') {
        return <Info style={{ color }} />;
    }
    return <QuestionMark style={{ color }} />;
}

export function renderControlIcon(
    action: ControlBase,
    colors?: { primary: string; secondary: string },
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
        return getFaIcon(action.icon, color);
    }
    if (value && action.iconOn?.startsWith('data:image')) {
        return (
            <Icon
                src={action.iconOn}
                style={{ color }}
            />
        );
    }
    if (action.icon?.startsWith('data:image')) {
        return (
            <Icon
                src={action.icon}
                style={{ color }}
            />
        );
    }
    return getIconByName(action.id, action.icon, color);
}

export function renderActionIcon(action: ActionBase): React.JSX.Element | null {
    if (!action) {
        return null;
    }

    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        return getFaIcon(action.icon, action.color);
    }
    if (action.icon?.startsWith('data:image')) {
        return (
            <Icon
                src={action.icon}
                style={{ color: action.color }}
            />
        );
    }
    return getIconByName(action.id, action.icon, action.color);
}

let language: ioBroker.Languages;

/**
 * Get Translation
 */
export function getTranslation(
    /** Text to translate */
    text: ioBroker.StringOrTranslated,
    noTranslation?: boolean,
): string {
    language = language || I18n.getLanguage();

    if (typeof text === 'object') {
        return text[language] || text.en;
    }

    return noTranslation ? text : I18n.t(text);
}
