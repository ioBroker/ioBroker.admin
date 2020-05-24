import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
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
import BaseSettingsSystem from '../components/BaseSettingsSystem';
import BaseSettingsMultihost from '../components/BaseSettingsMultihost';
import BaseSettingsObjects from '../components/BaseSettingsObjects';

// icons
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
    root: {
        width: 'calc(100% - ' + theme.spacing(2) + 'px)',
        height: 'calc(100% - ' + theme.spacing(2) + 'px)',
        overflow: 'hidden',
        position: 'relative',
        margin: theme.spacing(1)
    },
    tabPanel: {
        width:    '100%',
        height:   '100%',
        overflow: 'hidden',
    }
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
                text={ this.props.t('Discard unsaved changes? ')}
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
            system:           this.state.system,
            multihostService: this.state.multihostService,
            objects:          this.state.objects,
            states:           this.state.states,
            log:              this.state.log,
            plugins:          this.state.plugins,
        };

        this.props.socket.writeBaseSettings(host || this.state.currentHost, settings)
            .then(() => {
                this.originalSettings = JSON.parse(JSON.stringify(settings));
                this.setState({ hasChanges: [] });
            });
    }

    renderSystem() {
        const name = 'system';
        return <BaseSettingsSystem
            settings={ this.state[name] }
            t={ this.props.t }
            currentHost={ this.props.currentHost }
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

    renderMultihost() {
        const name = 'multihostService';
        return <BaseSettingsMultihost
            settings={ this.state[name] }
            t={ this.props.t }
            socket={ this.props.socket }
            currentHost={ this.props.currentHost }
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

    renderObjects() {
        const name = 'objects';
        return <BaseSettingsObjects
            settings={ this.state[name] }
            t={ this.props.t }
            socket={ this.props.socket }
            currentHost={ this.props.currentHost }
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

    renderStates() {
        const name = 'states';
        return <BaseSettingsObjects
            settings={ this.state[name] }
            t={ this.props.t }
            socket={ this.props.socket }
            currentHost={ this.props.currentHost }
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
                        <Tab label={ this.props.t('Objects') }    id={ 'objects-tab' }   aria-controls={ 'simple-tabpanel-3' } />
                        <Tab label={ this.props.t('States') }     id={ 'states-tab' }    aria-controls={ 'simple-tabpanel-4' } />
                        <Tab label={ this.props.t('Log') }        id={ 'log-tab' }       aria-controls={ 'simple-tabpanel-5' } />
                        <Tab label={ this.props.t('Plugins') }    id={ 'plugins-tab' }   aria-controls={ 'simple-tabpanel-6' } />
                    </Tabs>
                </AppBar>
                {this.state.loading ? <LinearProgress/> : null}
                {!this.state.loading && this.state.currentTab === 0 ? <div className={ this.props.classes.tabPanel }>{ this.renderSystem()  }</div> : null }
                {!this.state.loading && this.state.currentTab === 1 ? <div className={ this.props.classes.tabPanel }>{ this.renderMultihost() }</div> : null }
                {!this.state.loading && this.state.currentTab === 2 ? <div className={ this.props.classes.tabPanel }>{ this.renderObjects() }</div> : null }
                {!this.state.loading && this.state.currentTab === 3 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 4 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 5 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                {!this.state.loading && this.state.currentTab === 6 ? <div className={ this.props.classes.tabPanel }>{  }</div> : null }
                { this.renderConfirmDialog() }
            </DialogContent>
            <DialogActions>
                <Button variant="contained" disabled={ !this.state.hasChanges.length } onClick={ () => this.onSave() } color="primary"><CheckIcon />{ this.props.t('Save') }</Button>
                <Button variant="contained" onClick={ () => this.state.hasChanges.length ? this.setState({confirmExit: true}) : this.props.onClose() }><CloseIcon />{ this.state.hasChanges.length ? this.props.t('Cancel') : this.props.t('Close') }</Button>
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