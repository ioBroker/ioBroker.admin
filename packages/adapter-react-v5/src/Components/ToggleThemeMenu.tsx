import React, { type JSX } from 'react';

import { IconButton, Tooltip } from '@mui/material';

import {
    Brightness4 as Brightness4Icon,
    Brightness5 as Brightness5Icon,
    Brightness6 as Brightness6Icon,
    Brightness7 as Brightness7Icon,
} from '@mui/icons-material';

interface ToggleThemeMenuProps {
    themeName: 'dark' | 'blue' | 'colored' | 'light';
    toggleTheme: () => void;
    t: (key: string) => string;
    className?: string;
    style?: React.CSSProperties;
    size?: 'small' | 'medium' | 'large';
}

export function ToggleThemeMenu({
    themeName,
    toggleTheme,
    t,
    className,
    style,
    size,
}: ToggleThemeMenuProps): JSX.Element {
    return (
        <div
            className={className || undefined}
            style={style || undefined}
        >
            <Tooltip
                title={t('ra_Change color theme')}
                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
            >
                <IconButton
                    onClick={() => toggleTheme()}
                    size={size || 'medium'}
                >
                    {themeName === 'dark' && <Brightness4Icon className={className} />}
                    {themeName === 'blue' && <Brightness5Icon className={className} />}
                    {themeName === 'colored' && <Brightness6Icon className={className} />}
                    {themeName !== 'dark' && themeName !== 'blue' && themeName !== 'colored' && (
                        <Brightness7Icon className={className} />
                    )}
                </IconButton>
            </Tooltip>
        </div>
    );
}
