import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import GenericApp from '@iobroker/adapter-react/GenericApp';
// import Loader from '@iobroker/adapter-react/Components/Loader'


import I18n from '@iobroker/adapter-react/i18n';
import TabOptions from './Tabs/Options';
import TabCertificates from './Tabs/Certificates';
import TabBackground from './Tabs/Background';
import TabEasyAdmin from './Tabs/EasyAdmin';

const styles = theme => ({
    root: {},
    tabContent: {
        padding: 10,
        height: 'calc(100% - 64px - 48px - 20px)',
        overflow: 'auto'
    },
    tabContentIFrame: {
        padding: 10,
        height: 'calc(100% - 64px - 48px - 20px - 38px)',
        overflow: 'auto'
    }
});

class App extends GenericApp {
    constructor(props) {
        const extendedProps = {...props};
        extendedProps.encryptedFields = ['pass'];
        extendedProps.translations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'ru': require('./i18n/ru'),
            'pt': require('./i18n/pt'),
            'nl': require('./i18n/nl'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'es': require('./i18n/es'),
            'pl': require('./i18n/pl'),
            'zh-cn': require('./i18n/zh-cn'),
        };

        super(props, extendedProps);
    }

    getSelectedTab() {
        const tab = this.state.selectedTab;
        if (!tab || tab === 'options') {
            return 0;
        } else
        if (tab === 'certificates') {
            return 1;
        } else
        if (tab === 'background') {
            return 2;
        } else
        if (tab === 'easyadmin') {
            return 3;
        }
    }

    render() {
        if (!this.state.loaded) {
            return <MuiThemeProvider theme={this.state.theme}>
                {/* <Loader theme={this.state.themeType} /> */}
            </MuiThemeProvider>
        }

        return (
            <MuiThemeProvider theme={this.state.theme}>
                <div className="App" style={{background: this.state.theme.palette.background.default, color: this.state.theme.palette.text.primary}}>
                    <AppBar position="static">
                        <Tabs value={this.getSelectedTab()} onChange={(e, index) => this.selectTab(e.target.parentNode.dataset.name, index)} scrollButtons="auto">
                            <Tab label={I18n.t('Options')} data-name="options" />
                            <Tab label={I18n.t('Let\'s encrypt')} disabled={!this.state.native.leEnabled} data-name="certificates" />
                            <Tab label={I18n.t('Background')} disabled={!this.state.native.auth} data-name="background" />
                            <Tab label={I18n.t('Easy admin')} data-name="easyadmin" />
                        </Tabs>
                    </AppBar>

                    <div className={this.isIFrame ? this.props.classes.tabContentIFrame : this.props.classes.tabContent}>
                        {(this.state.selectedTab === 'options' || !this.state.selectedTab) && <TabOptions
                            key="options"
                            common={this.common}
                            socket={this.socket}
                            native={this.state.native}
                            onError={text => this.setState({errorText: (text || text === 0) && typeof text !== 'string' ? text.toString() : text})}
                            onLoad={native => this.onLoadConfig(native)}
                            instance={this.instance}
                            adapterName={this.adapterName}
                            changed={this.state.changed}
                            onChange={(attr, value, cb) => this.updateNativeValue(attr, value, cb)}
                        />}
                        {this.state.selectedTab === 'certificates' && <TabCertificates
                            key="certificates"
                            readme="https://github.com/ioBroker/ioBroker.admin/blob/master/README.md"
                            common={this.common}
                            socket={this.socket}
                            native={this.state.native}
                            onError={text => this.setState({errorText: (text || text === 0) && typeof text !== 'string' ? text.toString() : text})}
                            instance={this.instance}
                            adapterName={this.adapterName}
                        />}
                        {this.state.selectedTab === 'background' && <TabBackground
                            key="background"
                            common={this.common}
                            socket={this.socket}
                            native={this.state.native}
                            onError={text => this.setState({errorText: (text || text === 0) && typeof text !== 'string' ? text.toString() : text})}
                            instance={this.instance}
                            adapterName={this.adapterName}
                        />}
                        {this.state.selectedTab === 'easyadmin' && <TabEasyAdmin
                            key="easyadmin"
                            common={this.common}
                            socket={this.socket}
                            native={this.state.native}
                            onError={text => this.setState({errorText: (text || text === 0) && typeof text !== 'string' ? text.toString() : text})}
                            instance={this.instance}
                            adapterName={this.adapterName}
                        />}
                    </div>
                    {this.renderError()}
                    {this.renderSaveCloseButtons()}
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(App);
