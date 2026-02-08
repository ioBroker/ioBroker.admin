import 'ace-builds/src-noconflict/ace';
import 'react-ace';
// Ensure @emotion packages are included in the Module Federation shared scope
import '@emotion/react';
import '@emotion/styled';
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/browser';

import './index.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers';

import version from './version.json';
import { ContextWrapperProvider } from './components/ContextWrapper';
import App from './App';

declare global {
    interface Window {
        adapterName: string;
        disableDataReporting: boolean | string;
        USE_OAUTH2: boolean;
    }
}

window.adapterName = 'admin';
window.USE_OAUTH2 = true;

console.log(`iobroker.${window.adapterName}@${version.version}`);

const versionChanged = [
    'ChunkLoadError', // version was changed
    'removeChild', // version was changed
    'DOMException', // version was changed
];

const ignoreErrors = [
    'removeChild', // ignore errors that happen by changing the version
    'Loading chunk', // ignore errors that happen by changing the version
    'getWidth', // echarts error
    'safari-extension', // ignore safari extension errors
    'this.animation', // echarts error
    'No connection', // Ignore no connection errors
    'notConnectedError', // Ignore no connection errors
    'has no target', // Alias has no target
    'ResizeObserver', // echarts error
    'WorkerGlobalScope', // worker error
    'generateKey', // ignore safari extension errors
    'The operation is insecure.', // http => https access
    'SyntaxError: An invalid or illegal string was specified', // No stack and no possibility to detect
    "Can't find variable: servConn", // Error from info adapter
    'LPContentScriptFeatures', // ignore safari extension errors
    'window.webkit.messageHandlers', // ignore safari extension errors
    'has no target', // ignore alias errors
];

if (
    (!window.disableDataReporting || window.disableDataReporting === '@@disableDataReporting@@') &&
    window.location.port !== '3000'
) {
    Sentry.init({
        dsn: 'https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58',
        release: `iobroker.${window.adapterName}@${version.version}`,
        integrations: [Sentry.dedupeIntegration()],
        beforeSend(event: Sentry.ErrorEvent) {
            const text = event?.exception?.values?.map(e => e.value).join(' ');
            // Modify the event here
            if (text && versionChanged.find(error => text.includes(error))) {
                window.location.reload();
            } else if (text && ignoreErrors.find(error => text.includes(error))) {
                return null;
            } else if (event?.message && versionChanged.find(error => event.message.includes(error))) {
                window.location.reload();
            } else if (event?.message && ignoreErrors.find(error => event.message.includes(error))) {
                return null;
            }
            return event;
        },
    });
} else {
    window.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
        if (!error && event) {
            error = event as unknown as Error;
        }
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
        if (typeof error === 'string') {
            if (ignoreErrors.find(e => (error as unknown as string).includes(e))) {
                console.error(`Ignore error: ${error}`);
                return;
            }
            throw new Error(error);
        }
        throw error;
    };
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const errText = event.toString();
        if (typeof event === 'object' && errText && versionChanged.find(e => errText.includes(e))) {
            console.error(`Try to detect admin version change: ${event.reason}`);
            window.location.reload();
            return;
        }
        if (event instanceof Error) {
            throw event;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            throw new Error(event.toString());
        }
    };
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);

    root.render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ContextWrapperProvider>
                <App />
            </ContextWrapperProvider>
        </LocalizationProvider>,
    );
}
