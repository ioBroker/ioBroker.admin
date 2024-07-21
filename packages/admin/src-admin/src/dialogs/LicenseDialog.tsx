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
    ArrowDownward as IconArrowDownward,
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
    /** License type: MIT, Apache, ... */
    licenseType: string;
    /** function called when dialog is closed */
    onClose: (accepted?: boolean) => void;
}

const LicenseDialog = ({ url, onClose, licenseType }: LicenseDialogProps) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const preRef = React.useRef<HTMLPreElement>(null);

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
        <DialogTitle>
            {I18n.t('License agreement')}
            :
            <span style={{ marginLeft: 16, fontWeight: 'bold' }}>{licenseType}</span>
        </DialogTitle>
        <DialogContent style={styles.overflowHidden} dividers>
            <Box component="div" sx={styles.root}>
                {loading ?
                    <LinearProgress />
                    :
                    <pre
                        style={styles.pre}
                        ref={preRef}
                        onScroll={() => {
                            if (preRef.current) {
                                const _scrolled = preRef.current.scrollTop + preRef.current.clientHeight >= preRef.current.scrollHeight;
                                if (!scrolled && _scrolled) {
                                    setScrolled(_scrolled);
                                }
                            }
                        }}
                    >
                        {text}
                    </pre>}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                disabled={loading || !scrolled}
                autoFocus
                onClick={() => onClose(true)}
                startIcon={scrolled ? <IconCheck /> : <IconArrowDownward />}
                color="primary"
            >
                {!scrolled ? I18n.t('Read to the end for accept') : I18n.t('Accept')}
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
