import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DialogTitle, LinearProgress } from '@mui/material';
import { makeStyles } from '@mui/styles';

import IconClose from '@mui/icons-material/Close';
import IconCheck from '@mui/icons-material/Check';

import { I18n } from '@iobroker/adapter-react-v5';

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
    },
    paper: {
        maxWidth: 1000,
    },
    overflowHidden: {
        display: 'flex',
        overflow: 'hidden',
    },
    pre: {
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        margin: 0,
        padding: 10,
    },
}));

const LicenseDialog = ({ url, onClose }) => {
    const classes = useStyles();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setText('');
        fetch(url)
            .then(el => el.text())
            .then(txt => {
                setLoading(false);
                setText(txt);
            })
            .catch(() => setLoading(false));
    }, [url]);

    return <Dialog
        onClose={onClose}
        open={!0}
        classes={{ paper: classes.paper }}
    >
        <DialogTitle>{I18n.t('License agreement')}</DialogTitle>
        <DialogContent className={classes.overflowHidden} dividers>
            <div className={classes.root}>
                {loading ?
                    <LinearProgress />
                    :
                    <pre className={classes.pre}>
                        {text}
                    </pre>}
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                disabled={loading}
                autoFocus
                onClick={() => onClose(true)}
                startIcon={<IconCheck />}
                color="primary"
            >
                {I18n.t('Accept')}
            </Button>
            <Button
                variant="contained"
                onClick={() => onClose()}
                startIcon={<IconClose />}
                color="grey"
            >
                {I18n.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default LicenseDialog;
