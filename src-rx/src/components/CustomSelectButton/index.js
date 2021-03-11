import I18n from '@iobroker/adapter-react/i18n';
import { Button, Menu, MenuItem } from '@material-ui/core';
import React, { useState } from 'react';
import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';

const CustomSelectButton = ({ arrayItem, onClick, value, contained }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    return <>
        <Button
            style={{ marginLeft: 10, marginRight: 10 }}
            variant={contained ? 'contained' : 'outlined'}
            color="primary"
            onClick={e => setAnchorEl(e.currentTarget)}>
            {value}
        </Button>
        <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
        >
            {arrayItem.map(({ name }, idx) => {
                return <MenuItem
                    key={name}
                    selected={value ? name === value : idx === 0}
                    disabled={value ? name === value : idx === 0}
                    className={'tag-card-' + name}
                    style={{ placeContent: 'space-between' }}
                    value={name}
                    onClick={e => {
                        onClick(name);
                        setAnchorEl(null);
                    }}>
                    <MaterialDynamicIcon objIconBool iconName={name} style={{ marginRight: 5 }} />{I18n.t(name)}
                </MenuItem>
            })}
        </Menu>
    </>
}

export default CustomSelectButton;