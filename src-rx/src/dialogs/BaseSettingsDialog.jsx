import React, {Component} from 'react';
import withWidth from '../components/withWidth';
import {withStyles} from '@mui/styles';
import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AppBar from '@mui/material/AppBar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';

import ConfirmDialog from '@iobroker/adapter-react-v5/Dialogs/Confirm';

import BaseSettingsSystem from '../components/BaseSettings/BaseSettingsSystem';
import BaseSettingsMultihost from '../components/BaseSettings/BaseSettingsMultihost';
import BaseSettingsObjects from '../components/BaseSettings/BaseSettingsObjects';
import BaseSettingsStates from '../components/BaseSettings/BaseSettingsStates';
import BaseSettingsLog from '../components/BaseSettings/BaseSettingsLog';
import BaseSettingsPlugins from '../components/BaseSettings/BaseSettingsPlugins';

// icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const styles = theme => ({
    content: {
        height: 500,
        overflow: 'hidden',
    },
    tabPanel: {
        width: '100%',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        overflow: 'auto',
    },
});

class BaseSettingsDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 0,
            hasChanges: [],
            currentHost: this.props.currentHost,
            hosts: this.props.hosts,
            loading: true,
            confirmExit: false,
            showRestart: false,

            system: null,
            multihostService: null,
            objects: null,
            states: null,
            log: null,
            plugins: null,
            saving: false,
        };
    }

    componentDidMount() {
        this.getSettings(this.state.currentHost);
    }

    renderConfirmDialog() {
        if (this.state.confirmExit) {
            return <ConfirmDialog
                text={this.props.t('Discard unsaved changes?')}
                onClose={result =>
                    this.setState({confirmExit: false}, () =>
                        result && this.props.onClose())}
            />;
        } else {
            return null;
        }
    }

    renderRestartDialog() {
        if (this.state.showRestart) {
            return <ConfirmDialog
                title={this.props.t('Please confirm')}
                text={<><div>{this.props.t('Restart works only if controller started as system service.')}</div>
                <div>{this.props.t('Would you like to restart the controller for your changes to take effect?')}</div></>}
                ok={this.props.t('Restart')}
                cancel={this.props.t('No restart')}
                onClose={result =>
                    this.setState({showRestart: false}, () => {
                        if (result) {
                            this.props.socket.restartController(this.props.currentHost)
                                .then(() =>
                                    setTimeout(() =>  // reload admin
                                        window.location.reload(false), 500))
                                .catch(e => window.alert(`Cannot restart: ${e}`));
                        }

                        this.props.onClose();
                    })}
            />;
        } else {
            return null;
        }
    }

    getSettings(host) {
        this.props.socket.readBaseSettings(host || this.state.currentHost)
            .then(settings => {
                if (settings && settings.config) {
                    delete settings.config.dataDirComment;
                    this.originalSettings = JSON.parse(JSON.stringify(settings.config));
                    settings.config.loading = false;
                    this.setState(settings.config);
                }
            });
    }

    onSave(host) {
        const settings = {
            system: this.state.system,
            multihostService: this.state.multihostService,
            objects: this.state.objects,
            states: this.state.states,
            log: this.state.log,
            plugins: this.state.plugins,
        };

        // merge with some new settings, that may be not yet supported by Admin
        const newSettings = Object.assign({}, this.originalSettings, settings);

        this.setState({saving: true}, () => {
            this.props.socket.writeBaseSettings(host || this.state.currentHost, newSettings)
                .then(() => {
                    this.originalSettings = JSON.parse(JSON.stringify(settings));
                    // ask about restart
                    this.setState({hasChanges: [], showRestart: true, saving: false});
                });
        });
    }

    updateSettings(name, settings) {
        const hasChanges = [...this.state.hasChanges];
        const changed = JSON.stringify(this.originalSettings[name]) !== JSON.stringify(settings);

        const pos = hasChanges.indexOf(name);
        if (changed && pos === -1) {
            hasChanges.push(name);
        } else if (!changed && pos !== -1) {
            hasChanges.splice(pos, 1);
        }

        this.setState({[name]: settings, hasChanges});
    }

    renderSystem() {
        const name = 'system';
        return <BaseSettingsSystem
            settings={this.state[name]}
            t={this.props.t}
            currentHost={this.props.currentHost}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    renderMultihost() {
        const name = 'multihostService';
        return <BaseSettingsMultihost
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    renderObjects() {
        const name = 'objects';
        return <BaseSettingsObjects
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    renderStates() {
        const name = 'states';
        return <BaseSettingsStates
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    renderLog() {
        const name = 'log';
        return <BaseSettingsLog
            settings={this.state[name]}
            t={this.props.t}
            socket={this.props.socket}
            currentHost={this.props.currentHost}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    renderPlugins() {
        const name = 'plugins';
        return <BaseSettingsPlugins
            settings={this.state[name]}
            t={this.props.t}
            themeName={this.props.themeName}
            onChange={settings =>
                this.updateSettings(name, settings)}
        />;
    }

    render() {
        return <Dialog
            className={this.props.classes.dialog}
            open={true}
            onClose={() => false}
            fullWidth={true}
            maxWidth="xl"
            aria-labelledby="base-settings-dialog-title"
        >
            {<DialogTitle id="base-settings-dialog-title">{this.props.t('Host Base Settings')}: {this.props.currentHostName || this.props.currentHost}</DialogTitle>}
            <DialogContent className={this.props.classes.content}>
                <AppBar position="static">
                    <Tabs
                        value={this.state.currentTab}
                        onChange={(event, newTab) => this.setState({currentTab: newTab})}
                        aria-label="system tabs"
                    >
                        <Tab label={this.props.t('System')} id={'system-tab'} aria-controls={'simple-tabpanel-0'}/>
                        <Tab label={this.props.t('Multi-host')} id={'multihost-tab'}
                             aria-controls={'simple-tabpanel-1'}/>
                        <Tab label={this.props.t('Objects')} id={'objects-tab'} aria-controls={'simple-tabpanel-3'}/>
                        <Tab label={this.props.t('States')} id={'states-tab'} aria-controls={'simple-tabpanel-4'}/>
                        <Tab label={this.props.t('Log')} id={'log-tab'} aria-controls={'simple-tabpanel-5'}/>
                        <Tab label={this.props.t('Plugins')} id={'plugins-tab'} aria-controls={'simple-tabpanel-6'}/>
                    </Tabs>
                </AppBar>
                {this.state.loading ? <LinearProgress/> : null}
                {!this.state.loading && this.state.currentTab === 0 ?
                    <div className={this.props.classes.tabPanel}>{this.renderSystem()}</div> : null}
                {!this.state.loading && this.state.currentTab === 1 ?
                    <div className={this.props.classes.tabPanel}>{this.renderMultihost()}</div> : null}
                {!this.state.loading && this.state.currentTab === 2 ?
                    <div className={this.props.classes.tabPanel}>{this.renderObjects()}</div> : null}
                {!this.state.loading && this.state.currentTab === 3 ?
                    <div className={this.props.classes.tabPanel}>{this.renderStates()}</div> : null}
                {!this.state.loading && this.state.currentTab === 4 ?
                    <div className={this.props.classes.tabPanel}>{this.renderLog()}</div> : null}
                {!this.state.loading && this.state.currentTab === 5 ?
                    <div className={this.props.classes.tabPanel}>{this.renderPlugins()}</div> : null}
                {this.renderConfirmDialog()}
                {this.renderRestartDialog()}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={!this.state.hasChanges.length || this.state.saving}
                    onClick={() => this.onSave()}
                    color="primary"
                    startIcon={<CheckIcon/>}
                >{this.props.t('Save & Close')}</Button>
                <Button
                    variant="contained"
                    color="grey"
                    disabled={this.state.saving}
                    onClick={() => this.state.hasChanges.length ? this.setState({confirmExit: true}) : this.props.onClose()}
                    startIcon={<CloseIcon/>}
                >{this.state.hasChanges.length ? this.props.t('Cancel') : this.props.t('Close')}
                </Button>
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
    themeName: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(BaseSettingsDialog));