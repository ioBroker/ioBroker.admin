import React from 'react';

import { IconButton, Tooltip } from '@mui/material';

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness5Icon from '@mui/icons-material/Brightness5';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function ToggleThemeMenu({ themeName, toggleTheme, t, className, style, size }) {
    return <div className={className || undefined} style={style || undefined}>
        <Tooltip title={t('ra_Change color theme')}>
            <IconButton onClick={() => toggleTheme()} size={size || 'medium'}>
                {themeName === 'dark' && <Brightness4Icon className={className} />}
                {themeName === 'blue' && <Brightness5Icon className={className} />}
                {themeName === 'colored' && <Brightness6Icon className={className} />}
                {themeName === 'light' && <Brightness7Icon className={className} />}
            </IconButton>
        </Tooltip>
    </div>;
}