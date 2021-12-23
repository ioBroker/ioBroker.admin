import ReactDOM from 'react-dom';
import { version } from '../package.json';
import { MuiThemeProvider } from '@material-ui/core/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import DateFnsUtils from '@date-io/date-fns';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';
import App from './App';

import './index.css';
import { ContextWrapperProvider } from './components/ContextWrapper';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

window.adapterName = 'admin';

console.log('iobroker.' + window.adapterName + '@' + version);
let themeName = Utils.getThemeName();

function build() {
    return ReactDOM.render(
        <MuiThemeProvider theme={theme(themeName)}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <ContextWrapperProvider>
                <App onThemeChange={_themeName => {
                    themeName = _themeName;
                    build();
                }} />
            </ContextWrapperProvider>
            </MuiPickersUtilsProvider>
        </MuiThemeProvider>,
        document.getElementById('root')
    );
}

if (window.location.host !== 'localhost:3000') {
    const versionChanged = [
        'ChunkLoadError', // version was changed
        'removeChild',    // version was changed
        'DOMException',   // version was changed
    ];

    const ignoreErrors = [
        'removeChild',                         // ignore errors that happen by changing the version
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
    ];

    if (!window.disableDataReporting && window.location.port !== '3000') {
        Sentry.init({
            dsn: 'https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58',
            release: 'iobroker.' + window.adapterName + '@' + version,
            integrations: [
                new SentryIntegrations.Dedupe()
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
            }
        });
    }
}

build();
