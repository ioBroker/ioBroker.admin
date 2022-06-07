import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from '@mui/material/Button';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { withStyles } from '@mui/styles';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import i18n from '@iobroker/adapter-react-v5/i18n';

const styles = theme => ({
    modalDialog: {
        minWidth: 400,
        maxWidth: 800,
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
                color="grey"
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
