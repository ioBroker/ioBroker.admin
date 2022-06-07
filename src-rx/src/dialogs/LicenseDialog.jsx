import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {DialogTitle, LinearProgress} from '@mui/material';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

import IconClose from '@mui/icons-material/Close';
import IconCheck from '@mui/icons-material/Check';

import I18n from '@iobroker/adapter-react-v5/i18n';
import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

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
        margin: 0,
        padding: 10,
    }
}));
const LicenseDialog = ({ url, cb }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(url)
            .then(el => el.text())
            .then(el => {
                setLoading(false);
                setText(el);
            })
            .catch(() => setLoading(false));
    }, [url]);

    const onClose = () => {
        setOpen(false);
        try {
            node && window.document.body.removeChild(node);
        } catch (e) {
            // ignore
        }
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
                    {loading ?
                        <LinearProgress/>
                        :
                        <pre className={classes.pre} style={
                            Utils.getThemeName() === 'dark' ||
                            Utils.getThemeName() === 'blue' ?
                                {color: 'black'} :
                                null}>
                            {text}
                        </pre>
                    }
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={loading}
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
                    color="grey">
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
    const root = createRoot(node);

    return root.render(<StyledEngineProvider injectFirst><ThemeProvider theme={theme(Utils.getThemeName())}>
    <LicenseDialog url={url} cb={cb} />
    </ThemeProvider></StyledEngineProvider>);
}
