import React from 'react';
import ReactDOM from 'react-dom';
import {version} from '../package.json';
import { MuiThemeProvider} from '@material-ui/core/styles';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import createTheme from '@iobroker/adapter-react/createTheme';
import App from './App';

import './index.css';

console.log('iobroker.admin@' + version);
let theme = window.localStorage ? window.localStorage.getItem('App.theme') || 'light' : 'light';

function build() {
    return ReactDOM.render(<MuiThemeProvider theme={createTheme(theme)}>
        <App onThemeChange={_theme => {
            theme = _theme;
            build();
        }}/>
    </MuiThemeProvider>, document.getElementById('root'));
}

/*Sentry.init({
    dsn: "https://8f4cd4fe94f94e2a88e9da0f033f27fc@sentry.iobroker.net/57",
    release: 'iobroker.iot@' + version,
    integrations: [
        new SentryIntegrations.Dedupe()
    ]
});*/


build();