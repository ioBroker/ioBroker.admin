import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Popper from '@material-ui/core/Popper';
import Typography from '@material-ui/core/Typography';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import { IconButton } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import I18n from '@iobroker/adapter-react/i18n';

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
        <IconButton
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