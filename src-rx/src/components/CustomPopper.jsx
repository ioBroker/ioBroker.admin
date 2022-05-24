import React from 'react';
import { makeStyles } from '@mui/styles';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import I18n from '@iobroker/adapter-react-v5/i18n';

const useStyles = makeStyles((theme) => ({
    typography: {
        padding: theme.spacing(2),
    },
}));

let timer;

const CustomPopper = ({ editList, onClick }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [placement, setPlacement] = React.useState();
    const classes = useStyles();

    const handleClick = (newPlacement) => (event) => {
        setAnchorEl(event.currentTarget);
        setOpen((prev) => placement !== newPlacement || !prev);
        setPlacement(newPlacement);
    };
    return <>
        <IconButton size="large" size="large"
            style={editList ? { color: 'red' } : null}
            onClick={(el) => {
                onClick();
                if (!editList) {
                    handleClick('right')(el);
                    timer = setTimeout(() => setOpen(false), 3000);
                } else {
                    setOpen(false);
                    clearTimeout(timer);
                }
            }}
            title={I18n.t('show/hide item')}>
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
}

export default CustomPopper;