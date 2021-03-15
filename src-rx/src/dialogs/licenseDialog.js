import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import I18n from '@iobroker/adapter-react/i18n';
import { makeStyles } from '@material-ui/core';
let node = null;
const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: '100%'
    },
    paper: {
        maxWidth: 1000
    }
}));
const LicenseDialog = ({ url, func }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [text, setText] = useState('');

    useEffect(() => {
        fetch(url).then(el => el.text()).then(el => setText(el))
    }, [url])
    const onClose = () => {
        setOpen(false);
        document.body.removeChild(node);
        node = null;
    }
    return <Dialog
        onClose={onClose}
        open={open}
        classes={{ paper: classes.paper }}
    >
        <DialogContent dividers>
            <div className={classes.root}>
                <pre>{text}</pre>
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                autoFocus
                onClick={() => {
                    onClose();
                    func();
                }}
                color="primary">
                {I18n.t('Accept')}
            </Button>
            <Button
                variant="contained"
                autoFocus
                onClick={onClose}
                color="default">
                {I18n.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>
}
export const licenseDialogFunc = (license, func, url) => {
    if (license) {
        return func()
    }
    if (!node) {
        node = document.createElement('div')
        node.id = 'renderModal'
        document.body.appendChild(node)
    }
    return ReactDOM.render(<LicenseDialog url={url} func={func} />, node);
}
export default LicenseDialog;