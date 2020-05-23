import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
import PropTypes from 'prop-types';
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import AppBar from "@material-ui/core/AppBar";
import Router from "@iobroker/adapter-react/Components/Router";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';

import BaseSettingsSystem from '../components/BaseSettingsSystem';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

// icons
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
    root: {
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        overflow: 'hidden',
        position: 'relative',
        margin: theme.spacing(1)
    },
});

class BaseSettingsDialog extends React.Component {

    constructor(props) {
        super(props);

        this.state =  {
            currentTab: 0,
            hasChanges: [],
            currentHost: this.props.currentHost,
            hosts: this.props.hosts,
            loading: true,
            confirmExit: false,

            system: null,
            multihostService: null,
            network: null,
            objects: null,
            states: null,
            log: null,
            plugins: null,
        };

        this.getSettings(this.state.currentHost);
    }

    renderConfirmDialog() {
        if (this.state.confirmExit) {
            return <ConfirmDialog
                onClose={result =>
                    this.setState({ confirmExit: false }, () =>
                        result && this.props.onClose())}
                />;
        } else {
            return null;
        }
    }
    getSettings(host) {
        this.props.socket.readBaseSettings(host || this.state.currentHost)
            .then(settings => {
                if (settings) {
                    delete settings.dataDirComment;
                    this.originalSettings = JSON.parse(JSON.stringify(settings));
                    settings.loading = false;
                    this.setState(settings);
                }
            });
    }

    renderSystem(name) {
        return <BaseSettingsSystem
            settings={ this.state[name] }
            t={ this.props.t }
            onChange={ settings => {
                const hasChanges = [...this.state.hasChanges];
                const changed = JSON.stringify(this.originalSettings[name]) !== JSON.stringify(settings);

                const pos = hasChanges.indexOf(name);
                if (changed && pos === -1) {
                    hasChanges.push(name);
                } else if (!changed && pos !== -1) {
                    hasChanges.splice(pos, 1);
                }

                this.setState({ [name]: settings, hasChanges});
            }}
        />;
    }

    render() {
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => {} }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="base-settings-dialog-title"
        >
            <DialogTitle id="base-settings-dialog-title">{ this.props.t('Base settings') }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static">
                    <Tabs
                        value={ this.state.currentTab }
                        onChange={ (event, newTab) => this.setState({ currentTab: newTab }) }
                        aria-label="system tabs">
                        <Tab label={ this.props.t('System') }     id={ 'system-tab' }    aria-controls={ 'simple-tabpanel-0' } />
                        <Tab label={ this.props.t('Multi-host') } id={ 'multihost-tab' } aria-controls={ 'simple-tabpanel-1' } />
                        <Tab label={ this.props.t('Network') }    id={ 'network-tab' }   aria-controls={ 'simple-tabpanel-2' } />
                        <Tab label={ this.props.t('Objects') }    id={ 'objects-tab' }   aria-controls={ 'simple-tabpanel-3' } />
                        <Tab label={ this.props.t('States') }     id={ 'states-tab' }    aria-controls={ 'simple-tabpanel-4' } />
                        <Tab label={ this.props.t('Log') }        id={ 'log-tab' }       aria-controls={ 'simple-tabpanel-5' } />
                        <Tab label={ this.props.t('Plugins') }    id={ 'plugins-tab' }   aria-controls={ 'simple-tabpanel-6' } />
                    </Tabs>
                </AppBar>
                {this.state.loading ? <LinearProgress/> : null}
                {!this.state.loading && this.state.currentTab === 0 ? <div className={ this.props.classes.tabPanel }>{ this.renderSystem()  }</div> : null }
                {!this.state.loading && this.state.currentTab === 1 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 2 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 3 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 4 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 5 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 6 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                { this.renderConfirmDialog() }
            </DialogContent>
            <DialogActions>
                <Button variant="contained" disabled={ !this.state.hasChanges.length } color="primary"><CheckIcon />{ this.props.t('Save') }</Button>
                <Button variant="contained" onClick={ () => this.state.hasChanges.length ? this.setState({confirmExit: true}) : this.props.onClose() }><CloseIcon />{ this.props.t('Cancel') }</Button>
            </DialogActions>
        </Dialog>
    }
}

BaseSettingsDialog.propTypes = {
    t: PropTypes.func,
    currentHost: PropTypes.string,
    currentHostName: PropTypes.string,
    hosts: PropTypes.array,
    lang: PropTypes.string,
    socket: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(BaseSettingsDialog));