import React from 'react';
import { makeStyles } from '@mui/styles';

import {
    Popper,
    Typography,
    Fade,
    Paper,
    IconButton,
} from '@mui/material';

import { Edit as EditIcon } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

const useStyles = makeStyles(theme => ({
    typography: {
        padding: theme.spacing(2),
    },
}));

let timer;

const CustomPopper = ({ editMenuList, onClick }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [placement, setPlacement] = React.useState();
    const classes = useStyles();

    const handleClick = newPlacement => event => {
        setAnchorEl(event.currentTarget);
        setOpen(prev => placement !== newPlacement || !prev);
        setPlacement(newPlacement);
    };
    return <>
        <IconButton
            size="large"
            style={editMenuList ? { color: 'red' } : null}
            onClick={el => {
                onClick();
                if (!editMenuList) {
                    handleClick('right')(el);
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
        <Popper style={{ zIndex: 2222 }} open={open} anchorEl={anchorEl} placement={placement} transition>
            {({ TransitionProps }) => (
                <Fade {...TransitionProps} timeout={350}>
                    <Paper>
                        <Typography className={classes.typography}>{I18n.t('You can drag and drop list items for reorder')}</Typography>
                    </Paper>
                </Fade>
            )}
        </Popper>
    </>;
};

export default CustomPopper;
