import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import BuildIcon from '@material-ui/icons/Build';

import I18n from '@iobroker/adapter-react/i18n';
import { DialogTitle, IconButton, makeStyles, ThemeProvider, Typography } from '@material-ui/core';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';
import ExpertIcon from '@iobroker/adapter-react/icons/IconExpert';

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4,
        fontSize: 16,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    },
    paper: {
        maxWidth: 1000
    },
    overflowHidden: {
        display: 'flex',
    },
    pre: {
        overflow: 'auto',
        margin: 20,
    },
    text: {
        fontSize: 16
    }
}));

const ExpertModeDialog = ({ boolSettings, func, buttonIcon, themeType }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);

    const onClose = () => {
        setOpen(false);
        func();
        document.body.removeChild(node);
        node = null;
    };

    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle><ExpertIcon style={{marginRight: 8}}/>{I18n.t('Expert mode')}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <div className={classes.root}>
                    <div className={classes.pre} style={{color: themeType === 'dark' ? '#111': null}}>
                        <Typography
                            className={classes.text}
                            variant="body2"
                            component="p">
                            {boolSettings ? I18n.t('Now the expert mode will be deactivated only during this browser session.') : I18n.t('Now the expert mode will be active only during this browser session.')}
                        </Typography>
                        {!boolSettings ? <Typography
                            className={classes.text}
                            variant="body2"
                            component="p">
                            {I18n.t('The expert mode allows you to view and edit system internal details. Please make sure you know what you are doing!')}
                        </Typography> : }
                        <Typography
                            className={classes.text}
                            variant="body2"
                            component="p">
                            {I18n.t('If you need to save the mode all the time, you can do this in the system settings.')}
                        </Typography>
                        {I18n.t('Use this button:')}
                        <IconButton
                            color="primary"
                            style={{color: themeType === 'dark' ? '#111': null}}
                            size="small"
                            onClick={() => {
                                onClose();
                                buttonIcon();
                            }}>
                            <BuildIcon />
                        </IconButton>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={onClose}
                    color="primary">
                    {I18n.t('Ok')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const expertModeDialogFunc = (boolSettings, themeType, func, buttonIcon, ) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<ExpertModeDialog themeType={themeType} buttonIcon={buttonIcon} boolSettings={boolSettings} func={func} />, node);
}