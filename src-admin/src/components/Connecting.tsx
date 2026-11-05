import React, { useEffect, useState, type JSX } from 'react';

import { CircularProgress } from '@mui/material';

import { IconConnectionState } from '@iobroker/gui-components';

/** A short interruption, e.g. a reconnect of the socket, is not worth an overlay */
const CONNECTION_LOST_DELAY = 2_000;
/** Most tabs are loaded faster than this, and a spinner that only flashes up confuses */
const LOADING_DELAY = 400;

const styles: Record<string, React.CSSProperties> = {
    root: {
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        position: 'fixed',
        background: 'rgba(0, 0, 0, .3)',
        zIndex: 20000,
    },
    rootLoading: {
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20000,
    },
    connecting: {
        left: '50%',
        top: '40%',
        width: 120,
        height: 120,
        marginLeft: -60,
        marginTop: -60,
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, .7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
    },
    icon: {
        width: 64,
        height: 64,
    },
    text: {
        position: 'absolute',
        top: 'calc(40% + 76px)',
        left: 16,
        right: 16,
        textAlign: 'center',
    },
    textBox: {
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: 4,
        background: 'rgba(0, 0, 0, .7)',
        color: '#fff',
        fontSize: 16,
    },
};

interface ConnectingProps {
    /** Explains why the spinner is shown, e.g. a lost connection */
    text?: string;
    /**
     * The code of a tab is being loaded, the connection is fine: a neutral spinner instead of the
     * crossed out connection symbol
     */
    loading?: boolean;
}

function Connecting(props: ConnectingProps): JSX.Element | null {
    // nothing at first, then crossed out (the connection is gone), then the waves run while admin connects again
    const [state, setState] = useState<'hidden' | 'disconnected' | 'connecting'>('hidden');
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = setTimeout(
            () => {
                setState('disconnected');
                timer = props.loading ? null : setTimeout(() => setState('connecting'), 900);
            },
            props.loading ? LOADING_DELAY : CONNECTION_LOST_DELAY,
        );
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [props.loading]);

    if (state === 'hidden') {
        return null;
    }

    if (props.loading) {
        return (
            <div style={styles.rootLoading}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <div style={styles.root}>
            <div style={styles.connecting}>
                <IconConnectionState
                    state={state}
                    style={styles.icon}
                    ariaLabel={props.text}
                />
            </div>
            {props.text ? (
                <div style={styles.text}>
                    <span style={styles.textBox}>{props.text}</span>
                </div>
            ) : null}
        </div>
    );
}

export default Connecting;
