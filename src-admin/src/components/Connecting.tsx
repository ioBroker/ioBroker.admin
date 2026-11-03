import React, { useEffect, useState, type JSX } from 'react';

import { IconConnectionState } from '@iobroker/gui-components';

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
}

function Connecting(props: ConnectingProps): JSX.Element {
    // first crossed out (the connection is gone), then the waves run while admin connects again
    const [state, setState] = useState<'disconnected' | 'connecting'>('disconnected');
    useEffect(() => {
        const timer = setTimeout(() => setState('connecting'), 900);
        return () => clearTimeout(timer);
    }, []);

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
