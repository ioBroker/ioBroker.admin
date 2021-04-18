import { Button, Menu, MenuItem, makeStyles } from '@material-ui/core';
import React, { useState,  } from 'react';

import MaterialDynamicIcon from '../helpers/MaterialDynamicIcon';

const useStyles = makeStyles(theme => ({
    button: {
        marginLeft: 10,
        marginRight: 10
    },
    icon: {
        marginRight: 5
    }
}));

const CustomSelectButton = ({ arrayItem, onClick, value, contained, icons, t, translateSuffix }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    translateSuffix = translateSuffix || '';
    const classes = useStyles();

    return <>
        <Button
            className={classes.button}
            variant={contained ? 'contained' : 'outlined'}
            color="primary"
            onClick={e => setAnchorEl(e.currentTarget)}>
            {value}
        </Button>
        <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
        >
            {arrayItem.map(({ name }, idx) => {
                return <MenuItem
                    key={name}
                    selected={value ? name === value : value === 0 ? name === value : idx === 0}
                    disabled={value ? name === value : value === 0 ? name === value : idx === 0}
                    className={'tag-card-' + name}
                    style={{ placeContent: 'space-between' }}
                    value={name}
                    onClick={e => {
                        onClick(name);
                        setAnchorEl(null);
                    }}>
                    {icons && <MaterialDynamicIcon objIconBool iconName={name} className={classes.icon} />}{typeof name === 'number' ? name : t(name + translateSuffix)}
                </MenuItem>
            })}
        </Menu>
    </>
}

CustomSelectButton.defaultProps = {
    icons: false,
    translateSuffix: '',
};

export default CustomSelectButton;