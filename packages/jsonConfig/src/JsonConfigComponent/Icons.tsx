import React from 'react';

import {
    Add, Delete, Edit,
    Refresh, Search,
    Wifi, WifiOff,
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
    Settings,
    Group,
    Person,
    QrCode,
} from '@mui/icons-material';

export default function getIconByName(name: string, style?: React.CSSProperties): React.JSX.Element | null {
    if (name === 'edit' || name === 'rename') {
        return <Edit style={style} />;
    }
    if (name === 'delete') {
        return <Delete style={style} />;
    }
    if (name === 'refresh') {
        return <Refresh style={style} />;
    }
    if (name === 'newDevice' || name === 'new' || name === 'add') {
        return <Add style={style} />;
    }
    if (name === 'discover' || name === 'search') {
        return <Search style={style} />;
    }
    if (name === 'unpairDevice' || name === 'unpair') {
        return <LinkOff style={style} />;
    }
    if (name === 'pairDevice' || name === 'pair') {
        return <LinkIcon style={style} />;
    }
    if (name === 'identify') {
        return <NotListedLocation style={style} />;
    }
    if (name === 'play') {
        return <PlayArrow style={style} />;
    }
    if (name === 'stop') {
        return <Stop style={style} />;
    }
    if (name === 'pause') {
        return <Pause style={style} />;
    }
    if (name === 'forward' || name === 'next') {
        return <FastForward style={style} />;
    }
    if (name === 'rewind' || name === 'previous') {
        return <FastRewind style={style} />;
    }
    if (name === 'lamp' || name === 'light') {
        return <Lightbulb style={style} />;
    }
    if (name === 'backlight') {
        return <Fluorescent style={style} />;
    }
    if (name === 'dimmer') {
        return <WbIncandescent style={style} />;
    }
    if (name === 'socket') {
        return <Power style={style} />;
    }
    if (name === 'settings') {
        return <Settings style={style} />;
    }
    if (name === 'users' || name === 'group') {
        return <Group style={style} />;
    }
    if (name === 'user') {
        return <Person style={style} />;
    }
    if (name === 'qrcode') {
        return <QrCode style={style} />;
    }
    if (name === 'connection') {
        return <Wifi style={style} />;
    }
    if (name === 'no-connection') {
        return <WifiOff style={style} />;
    }
    if (name === 'visible') {
        return <Visibility style={style} />;
    }
    return null;
}
