import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import { Component } from 'react';
import PropTypes from 'prop-types';
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';

import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';
import Router from '@iobroker/adapter-react/Components/Router';

// icons
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
    tabPanel: {
        width:    '100%',
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        overflow: 'hidden',
    }
});

class SystemSettingsDialog extends Component {

    constructor(props) {
        super(props);

        this.state =  {
            loading: true,
            confirmExit: false,
            systemSettings: null,
            systemRepositories: null,
        };

        this.getSettings(this.state.currentHost);
    }

    renderConfirmDialog() {
        if (this.state.confirmExit) {
            return <ConfirmDialog
                text={ this.props.t('Discard unsaved changes? ')}
                onClose={result =>
                    this.setState({ confirmExit: false }, () =>
                        result && this.props.onClose())}
                />;
        } else {
            return null;
        }
    }

    getSettings() {
        const newState = {loading: false};

        return this.props.socket.getSystemConfig(true)
            .then(systemSettings => {
                newState.systemSettings = systemSettings && systemSettings.common ? systemSettings.common : {};
                return this.props.socket.getObject('system.repositories');
            })
            .then(systemRepositories => {
                systemRepositories = JSON.parse(JSON.stringify(systemRepositories));
                systemRepositories = systemRepositories || {};
                systemRepositories.native = systemRepositories.native || {};
                systemRepositories.native.repositories = systemRepositories.native.repositories || {};

                Object.keys(systemRepositories.native.repositories).forEach(repo => {
                    if (systemRepositories.native.repositories[repo] &&
                        systemRepositories.native.repositories[repo].json) {
                        delete systemRepositories.native.repositories[repo].json;
                    }
                    if (systemRepositories.native.repositories[repo] &&
                        systemRepositories.native.repositories[repo].hash) {
                        delete systemRepositories.native.repositories[repo].hash;
                    }
                });
                this.originalRepositories = JSON.stringify(systemRepositories.native.repositories);
                this.originalSettings = JSON.stringify(newState.systemSettings);
                newState.systemRepositories = systemRepositories.native.repositories;
                this.setState(newState);
            });
    }

    onSave() {
        return this.props.socket.getSystemConfig(true)
            .then(systemSettings => {
                systemSettings = systemSettings || {};
                if (JSON.stringify(systemSettings.common) !== JSON.stringify(this.state.systemSettings)) {
                    systemSettings.common = this.state.systemSettings;
                    return this.props.socket.setSystemConfig(systemSettings);
                } else {
                    return Promise.resolve();
                }
            })
            .then(() => this.props.socket.getObject('system.repositories'))
            .then(systemRepositories => {
                systemRepositories = systemRepositories || {};
                systemRepositories.native = systemRepositories.native || {};
                systemRepositories.native.repositories = systemRepositories.native.repositories || {};
                const newRepo = JSON.pars(JSON.stringify(this.state.systemRepositories));

                // merge new and existing info
                Object.keys(newRepo).forEach(repo => {
                    if (systemRepositories.native.repositories[repo] && systemRepositories.native.repositories[repo].json) {
                        newRepo[repo].json = systemRepositories.native.repositories[repo].json;
                    }
                    if (systemRepositories.native.repositories[repo] && systemRepositories.native.repositories[repo].hash) {
                        newRepo[repo].hash = systemRepositories.native.repositories[repo].hash;
                    }
                });
                systemRepositories.native.repositories = newRepo;
                return this.props.socket.setObject('system.repositories', systemRepositories);
            })
            .catch(e => window.alert('Cannot save system configuration: ' + e));
    }

    render() {
        const changed = JSON.stringify(this.state.systemSettings)     !== this.originalSettings ||
                        JSON.stringify(this.state.systemRepositories) !== this.originalRepositories;

        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => {} }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="system-settings-dialog-title"
        >
            <DialogTitle id="system-settings-dialog-title">{ this.props.t('Base settings') }</DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static">
                    <Tabs
                        value={ parseInt(this.props.currentTab.id, 10) || 0 }
                        onChange={ (event, newTab) => Router.doNavigate(null, 'system', newTab) }
                    >
                        <Tab label={ this.props.t('Config') } id={ 'system-config' } aria-controls={ 'simple-tabpanel-0' } />
                        <Tab label={ this.props.t('Repo') }   id={ 'repo' }          aria-controls={ 'simple-tabpanel-1' } />
                    </Tabs>
                </AppBar>
                {this.state.loading ? <LinearProgress/> : null}
                {!this.state.loading && (!this.props.currentTab.id || this.props.currentTab.id === '0') ?
                    <div className={ this.props.classes.tabPanel }><pre>{JSON.stringify(this.state.systemSettings, null, 2)}</pre></div> : null }
                {!this.state.loading && (this.props.currentTab.id === '1' || this.props.currentTab.id === 1) ?
                    <div className={ this.props.classes.tabPanel }><pre>{JSON.stringify(this.state.systemRepositories, null, 2)}</pre></div> : null }
                { this.renderConfirmDialog() }
            </DialogContent>
            <DialogActions>
                <Button variant="contained" disabled={ !changed } onClick={ () => this.onSave() } color="primary"><CheckIcon />{ this.props.t('Save') }</Button>
                <Button variant="contained" onClick={ () => changed ? this.setState({confirmExit: true}) : this.props.onClose() }><CloseIcon />{ changed ? this.props.t('Cancel') : this.props.t('Close') }</Button>
            </DialogActions>
        </Dialog>
    }
}

SystemSettingsDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    currentTab: PropTypes.object,
};

export default withWidth()(withStyles(styles)(SystemSettingsDialog));