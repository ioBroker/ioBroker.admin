import React, { useEffect, useState } from 'react';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
} from '@mui/material';

import {
    Close as IconClose,
    Check as IconCheck,
} from '@mui/icons-material';

import { I18n, type IobTheme } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
    }),
    paper: {
        maxWidth: 800,
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
        width: '100%',
    },
};

interface LicenseDialogProps {
    /** URL to show license text from */
    url: string;
    /** function called when dialog is closed */
    onClose: (accepted?: boolean) => void;
}

const LicenseDialog = ({ url, onClose }: LicenseDialogProps) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setText('');
        if (url.startsWith('https://github.com/')) {
            url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
        }

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
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': styles.paper }}
    >
        <DialogTitle>{I18n.t('License agreement')}</DialogTitle>
        <DialogContent style={styles.overflowHidden} dividers>
            <Box component="div" sx={styles.root}>
                {loading ?
                    <LinearProgress />
                    :
                    <pre style={styles.pre}>
                        {text}
                    </pre>}
            </Box>
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
