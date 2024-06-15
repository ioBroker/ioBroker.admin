import React from 'react';
import { type Styles, withStyles } from '@mui/styles';
import type { IobTheme } from '@iobroker/adapter-react-v5';

const offset = 187;

const styles: Styles<IobTheme, any> = {
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
        left: '40%',
        top: '40%',
        width: '20%',
        height: '20%',
        position: 'absolute',
    },
    spinner: {
        animation: '$rotator 1.4s linear infinite',
    },
    path: {
        strokeDasharray: 187,
        strokeDashoffset: 0,
        transformOrigin: 'center',
        animation: '$dash 1.4s ease-in-out infinite, $colors 5.6s ease-in-out infinite',
    },
    '@keyframes colors': {
        '0%': {
            stroke: '#4285F4',
        },
        '25%': {
            stroke: '#DE3E35',
        },
        '50%': {
            stroke: '#F7C223',
        },
        '75%': {
            stroke: '#1B9A59',
        },
        '100%': {
            stroke: '#4285F4',
        },
    },
    '@keyframes dash': {
        '0%': {
            strokeDashoffset: offset,
        },
        '50%': {
            strokeDashoffset: offset / 4,
            transform: 'rotate(135deg)',
        },
        '100%': {
            strokeDashoffset: offset,
            transform: 'rotate(450deg)',
        },
    },
    '@keyframes rotator': {
        '0%': {
            transform: 'rotate(0deg)',
        },
        '100%': {
            transform: 'rotate(270deg)',
        },
    },
};

interface ConnectingProps {
    classes: Record<string, string>;
}

function Connecting(props: ConnectingProps) {
    const { classes } = props;

    return <div className={classes.root}>
        <div className={classes.connecting}>
            <svg className={classes.spinner} width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle className={classes.path} fill="none" strokeWidth="6" strokeLinecap="round" cx="33" cy="33" r="30" />
            </svg>
        </div>
    </div>;
}

export default withStyles(styles)(Connecting);
