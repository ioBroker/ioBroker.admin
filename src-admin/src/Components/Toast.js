import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Snackbar } from '@material-ui/core';
import PropTypes from 'prop-types';
import I18n from '@iobroker/adapter-react/i18n';
import { MdClose as IconClose } from 'react-icons/md';

const useStyles = makeStyles((theme) => ({
    close: {

    }
}));

const Toast = ({ message, onClose }) => {
    const classes = useStyles();
    if (!message) {
        return null;
    }
    return <Snackbar
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
        }}
        open={true}
        autoHideDuration={6000}
        onClose={onClose}
        ContentProps={{'aria-describedby': 'message-id',}}
        message={<span id="message-id">{I18n.t(message)}</span>}
        action={[
            <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                className={classes.close}
                onClick={onClose}
            >
                <IconClose />
            </IconButton>,
        ]}
    />;
}

Toast.defaultProps = {
    message: '',
    onClose: () => { }
};

Toast.propTypes = {
    onClose: PropTypes.func,
    message: PropTypes.string
};

export default Toast;