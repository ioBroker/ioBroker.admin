import React, { useState, type JSX } from 'react';

import { Button, Menu, MenuItem, Tooltip } from '@mui/material';

import type { Translate } from '@iobroker/adapter-react-v5';
import MaterialDynamicIcon from '../helpers/MaterialDynamicIcon';

const styles: Record<string, React.CSSProperties> = {
    button: {
        marginLeft: 10,
        marginRight: 10,
    },
    icon: {
        marginRight: 5,
    },
};

interface CustomSelectButtonProps {
    arrayItem: { name: string | number }[];
    title?: string;
    onClick: (name: string | number) => void;
    value: string | number;
    contained?: boolean;
    buttonIcon?: JSX.Element;
    icons?: boolean;
    t: Translate;
    translateSuffix?: string;
    noTranslation?: boolean;
}

function CustomSelectButton({
    arrayItem,
    title,
    onClick,
    value,
    contained,
    buttonIcon,
    icons,
    t,
    translateSuffix,
    noTranslation,
}: CustomSelectButtonProps): JSX.Element {
    const [anchorEl, setAnchorEl] = useState(null);
    translateSuffix = translateSuffix || '';

    return (
        <>
            <Tooltip
                title={title || ''}
                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
            >
                <Button
                    style={styles.button}
                    variant={contained ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={e => setAnchorEl(e.currentTarget)}
                >
                    {buttonIcon ||
                        (icons && (
                            <MaterialDynamicIcon
                                iconName={value as string}
                                style={styles.icon}
                            />
                        ))}
                    {typeof value === 'number' ? value : noTranslation ? value : t(value + translateSuffix)}
                </Button>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {arrayItem.map(({ name }, idx) => (
                    <MenuItem
                        key={name}
                        selected={value ? name === value : value === 0 ? name === value : idx === 0}
                        disabled={value ? name === value : value === 0 ? name === value : idx === 0}
                        className={`tag-card-${name}`}
                        style={{ placeContent: 'space-between' }}
                        value={name}
                        onClick={() => {
                            onClick(name);
                            setAnchorEl(null);
                        }}
                    >
                        {icons && (
                            <MaterialDynamicIcon
                                iconName={name as string}
                                style={styles.icon}
                            />
                        )}
                        {typeof name === 'number' ? name : noTranslation ? name : t(name + translateSuffix)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

export default CustomSelectButton;
