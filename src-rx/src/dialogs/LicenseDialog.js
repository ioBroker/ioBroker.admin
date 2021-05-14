import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import {DialogTitle, makeStyles, ThemeProvider} from '@material-ui/core';

import IconClose from '@material-ui/icons/Close';
import IconCheck from '@material-ui/icons/Check';

import I18n from '@iobroker/adapter-react/i18n';
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
        overflow: 'hidden'
    },
    pre: {
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        margin: 0
    }
}));
const LicenseDialog = ({ url, cb }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [text, setText] = useState('');
    const [loaded, setLoaded] = useState(true);

    useEffect(() => {
        setLoaded(true);
        fetch(url).then(el => el.text()).then(el => {
            setLoaded(false);
            setText(el);
        }).catch(() => setLoaded(false))
    }, [url]);

    const onClose = () => {
        setOpen(false);
        document.body.removeChild(node);
        node = null;
    };

    return <ThemeProvider theme={theme(Utils.getThemeName())}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <DialogTitle>{I18n.t('License agreement')}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <div className={classes.root}>
                    <pre className={classes.pre} style={
                        Utils.getThemeName() === 'dark' ||
                            Utils.getThemeName() === 'blue' ?
                            { color: 'black' } :
                            null}>
                        {text}
                    </pre>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={loaded}
                    autoFocus
                    onClick={() => {
                        onClose();
                        cb(true);
                    }}
                    startIcon={<IconCheck/>}
                    color="primary">
                    {I18n.t('Accept')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onClose();
                        cb(false);
                    }}
                    startIcon={<IconClose/>}
                    color="default">
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

export const licenseDialogFunc = (license, cb, url) => {
    if (license) {
        return cb(true);
    }
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<LicenseDialog url={url} cb={cb} />, node);
}