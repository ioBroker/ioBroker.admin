import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, withStyles } from '@material-ui/core';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

import i18n from '@iobroker/adapter-react/i18n';

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
    },
    titleIcon: {
        marginRight: 5,
    },
    content: {
        fontSize: 16
    },
});

const CustomModal = ({ title, fullWidth, help, maxWidth, progress, icon, applyDisabled, applyButton, classes, open, onClose, children, titleButtonApply, titleButtonClose, onApply, textInput, defaultValue, overflowHidden }) => {
    const [value, setValue] = useState(defaultValue);
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    let Icon = null;

    if (icon) {
        Icon = icon;
    }

    return <Dialog
        open={open}
        maxWidth={maxWidth || 'md'}
        fullWidth={!!fullWidth}
        disableEscapeKeyDown={false}
        onClose={onClose}
        classes={{ paper: classes.modalDialog, /*paper: classes.background*/ }}
        className={classes.modalWrapper}
    >
        {title && <DialogTitle>{icon ? <Icon className={classes.titleIcon}/> : null}{title}</DialogTitle>}
        <DialogContent className={clsx(overflowHidden ? classes.overflowHidden : null, classes.content)}>
            {textInput && <TextField
                // className={className}
                autoComplete="off"
                fullWidth
                autoFocus
                variant="outlined"
                size="medium"
                // rows={10}
                multiline
                value={value}
                onChange={(e) => setValue(e.target.value)}
                // customValue
            />}
            {children}
            {help ? <div>{help}</div> : null}
        </DialogContent>
        <DialogActions>
            {applyButton && <Button
                startIcon={<CheckIcon/>}
                disabled={progress || (applyDisabled && defaultValue === value)}
                onClick={() => onApply(textInput ? value : '')}
                variant="contained"
                color="primary"
            >
                {i18n.t(titleButtonApply)}
            </Button>}
            <Button
                onClick={onClose}
                disabled={progress}
                variant="contained"
                startIcon={<CloseIcon/>}
            >
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
    overflowHidden: false,
    help: ''
};

CustomModal.propTypes = {
    icon: PropTypes.object,
    open: PropTypes.bool,
    onClose: PropTypes.func,
    children: PropTypes.any,
    titleButtonClose: PropTypes.string,
    titleButtonApply: PropTypes.string,
    onApply: PropTypes.func,
    fullWidth: PropTypes.bool,
    maxWidth: PropTypes.string,
    help: PropTypes.string,
};

export default withStyles(styles)(CustomModal);
