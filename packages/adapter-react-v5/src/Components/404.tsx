import React, { type JSX } from 'react';
import { Box } from '@mui/material';

/*
Copyright 2019 Robin Selmer
https://codepen.io/robinselmer/pen/vJjbOZ
*/

import { I18n } from '../i18n';

const styles: Record<string, any> = {
    content: {
        background: 'black',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    root: {
        boxSizing: 'border-box',
        height: '100%',
        width: '100%',
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(#104254 , #05181c)',
        fontFamily: "'Inconsolata', Helvetica, sans-serif",
        fontSize: '1.5rem',
        color: 'rgba(128, 175, 255, 0.8)',
        textShadow: `0 0 1ex rgba(51, 70, 255, 1),
        0 0 2px rgba(255, 255, 255, 0.8)`,
    },
    overlay: {
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        background: `repeating-linear-gradient(
                180deg,
            rgba(0, 0, 0, 0) 0,
            rgba(0, 0, 0, 0.3) 50%,
            rgba(0, 0, 0, 0) 100%)`,
        backgroundSize: 'auto 4px',
        zIndex: 99,
        '&::before': {
            content: '""',
            pointerEvents: 'none',
            position: 'absolute',
            display: 'block',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `linear-gradient(
                0deg,
                transparent 0%,
                rgba(32, 50, 128, 0.2) 2%,
                rgba(32, 50, 128, 0.8) 3%,
                rgba(32, 50, 128, 0.2) 3%,
                transparent 100%)`,
            backgroundRepeat: 'no-repeat',
            animation: 'scan 7.5s linear 0s infinite',
        },
    },

    terminal: {
        boxSizing: 'inherit',
        position: 'absolute',
        height: '100%',
        width: 'calc(100% - 8rem)',
        maxWidth: '100%',
        padding: '4rem',
        textTransform: 'uppercase',
    },
    output: {
        color: 'rgba(128, 175, 255, 0.8)',
        textShadow: `
        0 0 1px rgba(51, 70, 255, 0.4),
            0 0 2px rgba(255, 255, 255, 0.8)`,
        '&::before': {
            content: '"> "',
        },
    },
    errorCode: {
        color: 'white',
    },
};

/** Generates the 404 error page */
function Page404(): JSX.Element {
    return (
        <div style={styles.content}>
            <div style={styles.root}>
                <Box
                    component="div"
                    sx={styles.overlay}
                >
                    <div style={styles.terminal}>
                        <h1>
                            {I18n.t('ra_Error')}
                            <span style={styles.errorCode}>404</span>
                        </h1>
                        <Box
                            component="p"
                            sx={styles.output}
                        >
                            {I18n.t('ra_The page you are looking for was not found')}
                        </Box>
                        <Box
                            component="p"
                            sx={styles.output}
                        >
                            {I18n.t('ra_Good luck')}
                        </Box>
                    </div>
                </Box>
            </div>
        </div>
    );
}

export default Page404;
