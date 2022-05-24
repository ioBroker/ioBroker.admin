import React from 'react';
// import Menu from '@mui/material/Menu';
// import MenuItem from '@mui/material/MenuItem';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness5Icon from '@mui/icons-material/Brightness5';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// const themeNames = ['dark', 'blue', 'colored', 'light'];

export default function ToggleThemeMenu({ themeName, toggleTheme, t, className, style, size }) {
    // const [anchorEl, setAnchorEl] = useState(null);
    // const handleClose = (name) => {
    //     setAnchorEl(null);
    //     toggleTheme(name);
    // };

    return <div className={className || undefined} style={style || undefined}>
        <Tooltip title={t('Change color theme')}>
            <IconButton onClick={() => toggleTheme()} size={size || 'medium'}>
                {themeName === 'dark' ? <Brightness4Icon/> : (
                    themeName === 'blue' ? <Brightness5Icon/> : (
                        themeName === 'colored' ? <Brightness6Icon/> : <Brightness7Icon/>))
                }
            </IconButton>
        </Tooltip>
        {/* <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
        >
            {themeNames.map(name => <MenuItem
                key={name}
                selected={name === themeName}
                onClick={() => handleClose(name)}>
                {t(name)}
            </MenuItem>)}
        </Menu> */}
    </div>;
}