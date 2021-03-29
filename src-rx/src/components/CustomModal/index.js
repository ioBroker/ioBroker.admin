import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import i18n from '@iobroker/adapter-react/i18n';
import clsx from 'clsx';

const styles = theme => ({
    modalWrapper: {
        position: 'relative',
        '[class*="MuiPaper-root MuiDialog-paper MuiPaper-elevation24 MuiDialog-paperScrollPaper MuiDialog-paperWidthXl MuiPaper-elevation24 MuiPaper-rounded"]': {
            backgroundColor: '#f6f6f6'
        }
    },
    modalDialog: {
        minWidth: 400
    },
    overflowHidden: {
        display: 'flex',
        overflow: 'hidden'
    }
});
const CustomModal = ({ title, applyDisabled, applyButton, classes, open, onClose, children, titleButtonApply, titleButtonClose, onApply, textInput, defaultValue, overflowHidden }) => {
    const [value, setValue] = useState(defaultValue);
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);
    return <Dialog
        open={open}
        maxWidth="md"
        disableEscapeKeyDown={false}
        onClose={onClose}
        classes={{ paper: classes.modalDialog, /*paper: classes.background*/ }}
        className={classes.modalWrapper}
    >
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent className={clsx(overflowHidden ? classes.overflowHidden : null)}>
            {textInput && <TextField
                // className={className}
                autoComplete="off"
                fullWidth
                variant="outlined"
                size="medium"
                // rows={10}
                multiline
                value={value}
                onChange={(e) => setValue(e.target.value)}
                customValue
            />}
            {children}
        </DialogContent>
        <DialogActions>
            {applyButton && <Button disabled={applyDisabled && defaultValue === value} onClick={() => onApply(textInput ? value : '')} variant="contained" color="primary">
                {i18n.t(titleButtonApply)}
            </Button>}
            <Button onClick={onClose} variant="contained">
                {i18n.t(titleButtonClose)}
            </Button>
        </DialogActions>
    </Dialog>;
}

CustomModal.defaultProps = {
    open: false,
    onApply: () => { },
    onClose: () => { },
    applyButton: true,
    applyDisabled: false,
    titleButtonClose: 'Cancel',
    titleButtonApply: 'Ok',
    overflowHidden: false
};

CustomModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    children: PropTypes.any,
    titleButtonClose: PropTypes.string,
    titleButtonApply: PropTypes.string,
    onApply: PropTypes.func
};

export default withStyles(styles)(CustomModal);