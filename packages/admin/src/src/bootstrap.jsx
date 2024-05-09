import { createRoot } from 'react-dom/client';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';

import { Utils, Theme } from '@iobroker/adapter-react-v5';

import './index.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';

import version from './version.json';
import { ContextWrapperProvider } from './components/ContextWrapper';
import App from './App';

window.adapterName = 'admin';

console.log(`iobroker.${window.adapterName}@${version.version}`);
let themeName = Utils.getThemeName();

function build() {
    const container = document.getElementById('root');
    const root = createRoot(container);

    return root.render(
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={Theme(themeName)}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <ContextWrapperProvider>
                        <App
                            onThemeChange={_themeName => {
                                themeName = _themeName;
                                build();
                            }}
                        />
                    </ContextWrapperProvider>
                </LocalizationProvider>
            </ThemeProvider>
        </StyledEngineProvider>,
    );
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

if (!window.disableDataReporting && window.location.port !== '3000') {
    Sentry.init({
        dsn: 'https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58',
        release: `iobroker.${window.adapterName}@${pack.version}`,
        integrations: [
            new SentryIntegrations.Dedupe(),
        ],
        beforeSend(event) {
            // Modify the event here
            if (event && event.culprit &&
                versionChanged.find(error => event.culprit.includes(error))) {
                window.reload();
            } else if (event && event.culprit &&
                ignoreErrors.find(error => event.culprit.includes(error))) {
                return null;
            }
            return event;
        },
    });
} else {
    window.onerror = error => {
        const errText = error.toString();
        if (errText && versionChanged.find(e => errText.includes(e))) {
            const message = error.message;
            const stack = error.stack;
            console.error('Try to detect admin version change:');
            console.error(message);
            console.error(JSON.stringify(stack, null, 2));
            window.reload();
            return;
        }
        throw error;
    };
    window.onunhandledrejection = error => {
        const errText = error.toString();
        if (errText && versionChanged.find(e => errText.includes(e))) {
            const message = error.message;
            const stack = error.stack;
            console.error('Try to detect admin version change:');
            console.error(message);
            console.error(JSON.stringify(stack, null, 2));
            window.reload();
            return;
        }
        throw error;
    };
}

build();
