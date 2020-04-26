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

Sentry.init({
    dsn: "https://43643152dab3481db69950ba866ee9d6@sentry.iobroker.net/58",
    release: 'iobroker.admin@' + version,
    integrations: [
        new SentryIntegrations.Dedupe()
    ]
});


build();