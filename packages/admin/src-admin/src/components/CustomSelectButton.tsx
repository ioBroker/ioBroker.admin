import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';

import {
    Button, Menu, MenuItem, Tooltip,
} from '@mui/material';

import MaterialDynamicIcon from '../helpers/MaterialDynamicIcon';

const useStyles = makeStyles(() => ({
    button: {
        marginLeft: 10,
        marginRight: 10,
    },
    icon: {
        marginRight: 5,
    },
}));

interface CustomSelectButtonProps {
    arrayItem: { name: string | number }[];
    title?: string;
    onClick: (name: string | number) => void;
    value: string | number;
    contained?: boolean;
    buttonIcon?: React.JSX.Element;
    icons?: boolean;
    t: (text: string, ...args: any[]) => string;
    translateSuffix?: string;
    noTranslation?: boolean;
}

const CustomSelectButton = ({
    arrayItem, title, onClick, value, contained, buttonIcon, icons, t, translateSuffix, noTranslation,
}: CustomSelectButtonProps) => {
    const [anchorEl, setAnchorEl] = useState(null);
    translateSuffix = translateSuffix || '';
    const classes = useStyles();

    return <>
        <Tooltip title={title || ''}>
            <Button
                className={classes.button}
                variant={contained ? 'contained' : 'outlined'}
                color="primary"
                onClick={e => setAnchorEl(e.currentTarget)}
            >
                {buttonIcon || (icons && <MaterialDynamicIcon objIconBool iconName={value as string} className={classes.icon} />)}
                {typeof value === 'number' ? value : (noTranslation ? value : t(value + translateSuffix))}
            </Button>
        </Tooltip>
        <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
        >
            {arrayItem.map(({ name }, idx) => <MenuItem
                key={name}
                selected={value ? name === value : (value === 0 ? name === value : idx === 0)}
                disabled={value ? name === value : (value === 0 ? name === value : idx === 0)}
                className={`tag-card-${name}`}
                style={{ placeContent: 'space-between' }}
                value={name}
                onClick={() => {
                    onClick(name);
                    setAnchorEl(null);
                }}
            >
                {icons && <MaterialDynamicIcon
                    objIconBool
                    iconName={name as string}
                    className={classes.icon}
                />}
                {typeof name === 'number' ? name : (noTranslation ? name : t(name + translateSuffix))}
            </MenuItem>)}
        </Menu>
    </>;
};

export default CustomSelectButton;
