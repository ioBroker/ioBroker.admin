import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

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
        '& .markdown': {
            margin: 0,
            p: '10px',
            width: '100%',
            height: '100%',
            overflow: 'auto',
        },
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
    const divRef = React.useRef<HTMLDivElement>(null);
    const installTimer = React.useRef<ReturnType<typeof setInterval> | null | undefined>(undefined);

    useEffect(() => {
        setLoading(true);
        setText('');
        if (url.startsWith('https://github.com/')) {
            url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
        }

        fetch(url)
            .then(el => el.text())
            .then(txt => {
                setText(txt);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [url]);

    useEffect(() => {
        if (!loading && text && text.startsWith('#')) {
            if (divRef.current) {
                const divMarkdown: HTMLDivElement | null = divRef.current.querySelector('.markdown');
                if (divMarkdown) {
                    installTimer.current && clearInterval(installTimer.current);
                    installTimer.current = null;
                    divMarkdown.onscroll = (event: Event) => {
                        const div: HTMLDivElement = event.target as HTMLDivElement;
                        const _scrolled = div.scrollTop + div.clientHeight >= div.scrollHeight;
                        if (!scrolled && _scrolled) {
                            setScrolled(_scrolled);
                        }
                    };
                } else if (!installTimer.current) {
                    installTimer.current = setInterval(() => {
                        const _divMarkdown: HTMLDivElement | null = divRef.current?.querySelector('.markdown');
                        if (_divMarkdown) {
                            installTimer.current && clearInterval(installTimer.current);
                            installTimer.current = null;
                        } else {
                            _divMarkdown.onscroll = (event: Event) => {
                                const div: HTMLDivElement = event.target as HTMLDivElement;
                                const _scrolled = div.scrollTop + div.clientHeight >= div.scrollHeight;
                                if (!scrolled && _scrolled) {
                                    setScrolled(_scrolled);
                                }
                            };
                        }
                    }, 100);
                }
            }
        }

        return () => {
            installTimer.current && clearInterval(installTimer.current);
            installTimer.current = null;
            const _divMarkdown: HTMLDivElement | null = divRef.current?.querySelector('.markdown');
            if (_divMarkdown) {
                _divMarkdown.onscroll = null;
            }
        };
    }, [loading]);

    let content: React.JSX.Element;
    if (!loading && text) {
        if (text.startsWith('#')) {
            content = <Markdown
                className="markdown"
                components={{
                    // eslint-disable-next-line react/no-unstable-nested-components
                    h1: h1Props => <Box
                        component="h1"
                        sx={(theme: IobTheme) => ({
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            borderRadius: '2px',
                            pl: 1,
                            pr: 1,
                            pb: '4px',
                        })}
                    >
                        {h1Props.children}
                    </Box>,
                    // eslint-disable-next-line react/no-unstable-nested-components
                    h2: h2Props => <Box
                        component="h2"
                        sx={(theme: IobTheme) => ({
                            backgroundColor: theme.palette.secondary.main,
                            color: theme.palette.secondary.contrastText,
                            borderRadius: '2px',
                            pl: 1,
                            pr: 1,
                            pb: '4px',
                        })}
                    >
                        {h2Props.children}
                    </Box>,
                }}
            >
                {text}
            </Markdown>;
        } else {
            content = <pre
                style={styles.pre}
                ref={preRef}
                onScroll={() => {
                    if (preRef.current) {
                        const _scrolled =
                            preRef.current.scrollTop + preRef.current.clientHeight >= preRef.current.scrollHeight;
                        if (!scrolled && _scrolled) {
                            setScrolled(_scrolled);
                        }
                    }
                }}
            >
                {text}
            </pre>;
        }
    }

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
            <Box component="div" sx={styles.root} ref={divRef}>
                {loading ? <LinearProgress /> : content}
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
            <Button variant="contained" onClick={() => onClose()} startIcon={<IconClose />} color="grey">
                {I18n.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default LicenseDialog;
