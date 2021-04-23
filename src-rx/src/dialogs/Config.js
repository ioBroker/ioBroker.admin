import React, { Component } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import Router from '@iobroker/adapter-react/Components/Router';
import Icon from '@iobroker/adapter-react/Components/Icon';

import JsonConfig from '../components/JsonConfig';

import HelpIcon from '@material-ui/icons/Help';

const styles = theme => ({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    scroll: {
        height: '100%',
        overflowY: 'auto'
    },
    instanceIcon: {
        width: 42,
        height: 42,
        marginRight: theme.spacing(2),
        verticalAlign: 'middle'
    },
    button: {
        marginRight: 5,
        width: 36,
        height: 36,
    }
});

class Config extends Component {
    constructor(props) {
        super(props);

        this.state ={
            checkedExist: false,
        };
    }
    componentDidMount() {
        // receive messages from IFRAME
        const eventFunc = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'attachEvent' ? 'onmessage' : 'message';

        if (this.props.tab) {
            this.props.socket.fileExists(this.props.adapter + '.admin', 'tab.html')
                .then(exist => {
                    if (exist) {
                        this.setState({checkedExist: 'tab.html'});
                    } else {
                        return this.props.socket.fileExists(this.props.adapter + '.admin', 'tab_m.html')
                            .then(exist =>
                                exist ? this.setState({checkedExist: 'tab_m.html'}) : window.alert('Cannot find tab(_m).html'));
                    }
                });
        } else {
            this.setState({checkedExist: true});
        }

        emit(eventName, event => this.closeConfig(event), false);
    }

    componentWillUnmount() {

        const eventFunc = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'detachEvent' ? 'onmessage' : 'message';

        emit(eventName, event => this.closeConfig(event), false);
    }

    closeConfig(event) {
        if (event.data === 'close' || event.message === 'close') {
            if (this.props.easyMode){
                Router.doNavigate('easy');
            } else {
                Router.doNavigate('tab-instances');
            }
        } else if (event.data === 'change' || event.message === 'change') {
            this.props.configStored(false);
        } else if (event.data === 'nochange' || event.message === 'nochange') {
            this.props.configStored(true);
        }
    }

    renderHelpButton() {
        if (this.props.jsonConfig) {
            return <div style={{ display: 'inline-block', position: 'absolute', right: 0, top: 5 }}>
                <Tooltip size="small" title={this.props.t('Show help for this adapter')}>
                    <Fab classes={{ root: this.props.classes.button }} onClick={() => {
                        let lang = this.props.lang;
                        if (lang !== 'en' && lang !== 'de' && lang !== 'ru' && lang !== 'zh-cn') {
                            lang = 'en';
                        }
                        window.open(`https://www.iobroker.net/#${lang}/adapters/adapterref/iobroker.${this.props.adapter}/README.md`, 'help');
                    }}>
                        <HelpIcon />
                    </Fab>
                </Tooltip>
            </div>;
        } else {
            return null;
        }
    }

    getConfigurator() {
        if (this.props.jsonConfig) {
            return <JsonConfig
                menuPadding={this.props.menuPadding}
                theme={this.props.theme}
                width={this.props.width}
                adapterName={this.props.adapter}
                instance={this.props.instance}
                socket={this.props.socket}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                t={this.props.t}
            />;
        } else {
            const src = `adapter/${this.props.adapter}/` +
                `${this.props.tab ? this.state.checkedExist : (this.props.materialize ? 'index_m.html' : 'index.html')}?` +
                `${this.props.instance}`;//&react=${this.props.themeName}`;
            if (this.state.checkedExist) {
                return <iframe
                    title="config"
                    className={this.props.className}
                    src={src}>
                </iframe>;
            } else {
                return null;
            }
        }
    }

    render() {
        const { classes } = this.props;

        if (!this.props.jsonConfig && window.location.port === '3000') {
            return 'Test it in not development mode!';
        } else {
            return <Paper className={classes.root}>
                <AppBar color="default" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="h6" color="inherit">
                            {this.props.jsonConfig ? <Icon src={this.props.icon} className={this.props.classes.instanceIcon} />
                                : null}
                            {`${this.props.t('Instance settings')}: ${this.props.adapter}.${this.props.instance}`}
                        </Typography>
                        {this.renderHelpButton()}
                    </Toolbar>
                </AppBar>
                {this.getConfigurator()}
            </Paper>;
        }
    }
}

Config.propTypes = {
    menuPadding: PropTypes.number,
    adapter: PropTypes.string,
    instance: PropTypes.number,
    materialize: PropTypes.bool,
    tab: PropTypes.bool,
    jsonConfig: PropTypes.bool,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    t: PropTypes.func,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
    className: PropTypes.string,
    icon: PropTypes.string,
    readme: PropTypes.string,
    lang: PropTypes.string,
    easyMode: PropTypes.bool,
};

export default withStyles(styles)(Config);