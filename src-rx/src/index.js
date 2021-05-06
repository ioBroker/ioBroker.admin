import ReactDOM from 'react-dom';
import { version } from '../package.json';
import { MuiThemeProvider } from '@material-ui/core/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import DateFnsUtils from '@date-io/date-fns';

import theme from './Theme'; // @iobroker/adapter-react/Theme
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
    Sentry.init({
        dsn: 'https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58',
        release: 'iobroker.' + window.adapterName + '@' + version,
        integrations: [
            new SentryIntegrations.Dedupe()
        ]
    });
}

build();