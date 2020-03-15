import React from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Router from '@iobroker/adapter-react/Components/Router';

const styles = {
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    }
};

class Config extends React.Component {

    componentDidMount() {

        // receive messages from IFRAME
        const eventFunc = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'attachEvent' ? 'onmessage' : 'message';

        emit(eventName, (event) => this.closeConfig(event), false);
    }
    
    componentWillUnmount() {

        const eventFunc = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'detachEvent' ? 'onmessage' : 'message';

        emit(eventName, (event) => this.closeConfig(event), false);
    }

    closeConfig(event) {
        if(event.data === 'close' || event.message === 'close') {
            Router.doNavigate('tab-instances');
        }
    }

    render() {

        const { classes } = this.props;

        return(
            <Paper className={ classes.root }>
                <AppBar color="default" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="h6" color="inherit">
                            { `${this.props.t('adapterConfig')}: ${this.props.adapter}.${this.props.instance}` }
                        </Typography>
                    </Toolbar>
                </AppBar>
                <iframe
                    title="config"
                    className={ this.props.className }
                    src={ 'adapter/' + this.props.adapter + '/' + (this.props.materialize ? 'index_m.html' : '') + '?' + this.props.instance }>
                </iframe>
            </Paper>
        );
    }
}


Config.propTypes = {
    adapter: PropTypes.string,
    instance: PropTypes.number,
    materialize: PropTypes.bool,
    t: PropTypes.func
};

export default withStyles(styles)(Config);