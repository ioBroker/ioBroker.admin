import React, { type JSX } from 'react';

import { Popper, Typography, Fade, Paper, IconButton } from '@mui/material';

import { Edit as EditIcon } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

let timer: ReturnType<typeof setTimeout>;

interface CustomPopperProps {
    editMenuList: boolean;
    onClick: () => void;
    size?: 'small' | 'medium' | 'large';
}

const CustomPopper = ({ editMenuList, onClick, size }: CustomPopperProps): JSX.Element => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [placement, setPlacement] = React.useState<'right' | null>(null);

    return (
        <>
            <IconButton
                size={size || 'large'}
                style={editMenuList ? { color: 'red' } : null}
                onClick={el => {
                    onClick();
                    if (!editMenuList) {
                        setAnchorEl(el.currentTarget);
                        setOpen(prev => placement !== 'right' || !prev);
                        setPlacement('right');

                        timer = setTimeout(() => setOpen(false), 3000);
                    } else {
                        setOpen(false);
                        clearTimeout(timer);
                    }
                }}
                title={I18n.t('show/hide item')}
            >
                <EditIcon />
            </IconButton>
            <Popper
                style={{ zIndex: 2222 }}
                open={open}
                anchorEl={anchorEl}
                placement={placement}
                transition
            >
                {({ TransitionProps }) => (
                    <Fade
                        {...TransitionProps}
                        timeout={350}
                    >
                        <Paper>
                            <Typography
                                style={{
                                    padding: 16,
                                }}
                            >
                                {I18n.t('You can drag and drop list items for reorder')}
                            </Typography>
                        </Paper>
                    </Fade>
                )}
            </Popper>
        </>
    );
};

export default CustomPopper;
