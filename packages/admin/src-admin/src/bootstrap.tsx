import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/browser';

import './index.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';

import version from './version.json';
import { ContextWrapperProvider } from './components/ContextWrapper';
import App from './App';

declare global {
    interface Window {
        adapterName: string;
        disableDataReporting: boolean | string;
    }
}

window.adapterName = 'admin';

console.log(`iobroker.${window.adapterName}@${version.version}`);

function build() {
    const container = document.getElementById('root');
    const root = createRoot(container);

    return root.render(<LocalizationProvider dateAdapter={AdapterDateFns}>
        <ContextWrapperProvider>
            <App />
        </ContextWrapperProvider>
    </LocalizationProvider>);
}

const versionChanged = [
    'ChunkLoadError', // version was changed
    'removeChild',    // version was changed
    'DOMException',   // version was changed
];

const ignoreErrors = [
    'removeChild',                         // ignore errors that happen by changing the version
    'Loading chunk',                       // ignore errors that happen by changing the version
    'getWidth',                            // echarts error
    'safari-extension',                    // ignore safari extension errors
    'this.animation',                      // echarts error
    'No connection',                       // Ignore no connection errors
    'notConnectedError',                   // Ignore no connection errors
    'has no target',                       // Alias has no target
    'ResizeObserver',                      // echarts error
    'WorkerGlobalScope',                   // worker error
    'generateKey',                         // ignore safari extension errors
    'The operation is insecure.',          // http => https access
    'SyntaxError: An invalid or illegal string was specified',   // No stack and no possibility to detect
    'Can\'t find variable: servConn',      // Error from info adapter
    'LPContentScriptFeatures',             // ignore safari extension errors
    'window.webkit.messageHandlers',       // ignore safari extension errors
    'has no target',                       // ignore alias errors
];

if ((!window.disableDataReporting || window.disableDataReporting === '@@disableDataReporting@@') && window.location.port !== '3000') {
    Sentry.init({
        dsn: 'https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58',
        release: `iobroker.${window.adapterName}@${version.version}`,
        integrations: [
            Sentry.dedupeIntegration(),
        ],
        beforeSend(event: Sentry.ErrorEvent) {
            // Modify the event here
            if (event?.message &&
                versionChanged.find(error => event.message.includes(error))) {
                window.location.reload();
            } else if (event?.message &&
                ignoreErrors.find(error => event.message.includes(error))) {
                return null;
            }
            return event;
        },
    });
} else {
    window.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
        const errText = error.toString();
        if (typeof error === 'object' && errText && versionChanged.find(e => errText.includes(e))) {
            const message = error.message;
            const stack = error.stack;
            console.error('Try to detect admin version change:');
            console.error(message);
            console.error(JSON.stringify(stack, null, 2));
            window.location.reload();
            return;
        }
        throw error;
    };
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        const errText = event.toString();
        if (typeof event === 'object' && errText && versionChanged.find(e => errText.includes(e))) {
            console.error(`Try to detect admin version change: ${event.reason}`);
            window.location.reload();
            return;
        }
        throw event;
    };
}

build();
