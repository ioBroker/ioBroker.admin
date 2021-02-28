import { Component } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Router from '@iobroker/adapter-react/Components/Router';

import JsonSchemaConfig from './JsonSchemaConfig';

const styles = {
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    scroll: {
        height: '100%',
        overflowY: 'auto'
    }
};

class Config extends Component {

    componentDidMount() {

        // receive messages from IFRAME
        const eventFunc = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'attachEvent' ? 'onmessage' : 'message';

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
            Router.doNavigate('tab-instances');
        } else if (event.data === 'change' || event.message === 'change' ) {
            this.props.configStored(false);
        } else if (event.data === 'nochange' || event.message === 'nochange' ) {
            this.props.configStored(true);
        }
    }

    getConfigurator() {
        if (this.props.jsonSchema) {
            return (
                <JsonSchemaConfig 
                    adapter={this.props.adapter}
                    instance={this.props.instance}
                    socket={this.props.socket}
                    themeName={this.props.themeName}
                    t={this.props.t} />
                );
        }

        return (
            <iframe
                title="config"
                className={this.props.className}
                src={`adapter/${this.props.adapter}/${this.props.materialize ? 'index_m.html' : ''}?${this.props.instance}&react=${this.props.themeName}`}>
            </iframe>
            );
    }

    render() {

        const { classes } = this.props;

        if (window.location.port === '3000') {
            return 'Test it in not development mode!';
        } else {
            return (
                <Paper className={classes.root}>
                    <AppBar color="default" position="static">
                        <Toolbar variant="dense">
                            <Typography variant="h6" color="inherit">
                                {`${this.props.t('adapterConfig')}: ${this.props.adapter}.${this.props.instance}`}
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    { this.getConfigurator() }
                </Paper>
            );
        }
    }
}


Config.propTypes = {
    adapter: PropTypes.string,
    instance: PropTypes.number,
    materialize: PropTypes.bool,
    jsonSchema: PropTypes.bool,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    t: PropTypes.func
};

export default withStyles(styles)(Config);