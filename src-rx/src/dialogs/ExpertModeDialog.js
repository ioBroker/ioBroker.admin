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

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex'
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
    }
}));
const ExpertModeDialog = ({ boolSettings, func, buttonIcon }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);

    const onClose = () => {
        setOpen(false);
        func();
        document.body.removeChild(node);
        node = null;
    }
    const black = Utils.getThemeName() === 'dark' || Utils.getThemeName() === 'blue';
    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>{I18n.t('Expert mode')}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <div className={classes.root}>
                    <div className={classes.pre}>
                        <Typography
                            style={black ? { color: 'black' } : null}
                            variant="body2"
                            color="textSecondary"
                            component="p">
                            {I18n.t(boolSettings ? 'Will turn off only for the current session' : 'Will turn on only for the current session')}
                        </Typography>
                        <Typography
                            style={black ? { color: 'black' } : null}
                            variant="body2"
                            color="textSecondary"
                            component="p">
                            {I18n.t('If you want forever, go to settings')}
                        </Typography>
                        <IconButton
                            style={black ? { color: 'black' } : null}
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

export const expertModeDialogFunc = (boolSettings, func, buttonIcon) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<ExpertModeDialog buttonIcon={buttonIcon} boolSettings={boolSettings} func={func} />, node);
}