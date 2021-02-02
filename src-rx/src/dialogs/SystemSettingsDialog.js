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

import MainSettingsDialog from "./MainSettingsDialog";
import RepositoriesDialog from "./RepositoriesDialog";
import SertificatsDialog from "./SertificatsDialog";
import SSLDialog from "./SSLDialog";
import ACLDialog from "./ACLDialog";
import StatisticsDialog from "./StatisticsDialog";

// icons
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

//fills
import lightBlue from '@material-ui/core/colors/lightBlue'

//style
import "../assets/css/style.css";


const styles = theme => ({
    tabPanel: {
        width:    '100%',
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        overflow: 'hidden'
    },
    tab: {
        // backgroundColor:"#FFF",
        // color:lightBlue[500]
    }
});

class SystemSettingsDialog extends Component 
{
    constructor(props) 
    {
        super(props);
        this.state =  {
            loading: true,
            confirmExit: false,
            systemSettings: null,
            systemRepositories: null,
        };
        this.getSettings(this.state.currentHost);
    }
    getSettings() 
    {
        const newState = {loading: false};
         return this.props.socket.getSystemConfig(true)
            .then(systemSettings => {
                console.log(systemSettings); 
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
                    return this.props.socket.getObject('system.config');
                })
                
                    .then(systemcConfig => {
                        console.log(systemcConfig);
                        newState.systemcConfig = systemcConfig;
                        // return this.props.socket.getObject('system.certificates');
                        return this.props.socket.getRawSocket().emit('sendToHost', this.props.currentHost, 'getDiagData', systemcConfig.diag);
                    })
                        /**/
                        .then(diagData => {
                            console.log(diagData);  
                            newState.diagData = diagData;                           
                            return this.props.socket.getUsers();
                        })
                            .then(users => {
                                console.log(users);       
                                newState.users = users;                           
                                return this.props.socket.getGroups();
                            })  
                                .then(groups => {
                                    console.log(groups);   
                                    newState.groups = groups;                             
                                    return this.props.socket.getObject('system.certificates');
                                })                        
                                    .then(systemcCertificates => {
                                        console.log(systemcCertificates);
                                        newState.systemcCertificates = systemcCertificates;
                                        this.setState(newState);                            
                                    });
    }
    renderConfirmDialog() 
    {
        if (this.state.confirmExit) 
        {
            return <ConfirmDialog
                text={ this.props.t('Discard unsaved changes? ')}
                onClose={result =>
                    this.setState({ confirmExit: false }, () =>
                        result && this.props.onClose())}
            />;
        } 
        else 
        {
            return null;
        }
    }

    onSave()
    {
        return this.props.socket.getSystemConfig(true)
            .then(systemSettings => {
                systemSettings = systemSettings || {};
                if (JSON.stringify(systemSettings.common) !== JSON.stringify(this.state.systemSettings)) 
                {
                    systemSettings.common = this.state.systemSettings;
                    return this.props.socket.setSystemConfig(systemSettings);
                } 
                else
                {
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

    render() 
    {
        //console.log(this.state)
        const changed = JSON.stringify(this.state.systemSettings)     !== this.originalSettings ||
                        JSON.stringify(this.state.systemRepositories) !== this.originalRepositories;
        const tabs = this. getTabs().map((e,i) =>
        {
            return  <Tab
                label={ this.props.t( e.title ) } 
                id={ (e.id).toString() } 
                aria-controls={ 'simple-tabpanel-' +  e.id } 
                key={i}
            />;
        })
        return <Dialog
            className={ this.props.classes.dialog }
            open={ true }
            onClose={ () => {} }
            fullWidth={ true }
            fullScreen={ true }
            aria-labelledby="system-settings-dialog-title"
        >
            <DialogTitle id="system-settings-dialog-title">
                { this.props.t('Base settings') }
            </DialogTitle>
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static" color="default">
                    <Tabs
                        className={ this.props.classes.tab }
                        variant="fullWidth"
                        indicatorColor="primary"
                        textColor="primary"
                        value={ parseInt(this.props.currentTab.id, 10) || 0 }
                        onChange={ this.onTab }
                    >
                        { tabs }
                    </Tabs>
                </AppBar>
                { this.getDialogContent()  }
                { this.renderConfirmDialog() }
            </DialogContent>
            <DialogActions>
                <Button 
                    variant="contained"
                    disabled={ !changed } 
                    onClick={ () => this.onSave() } 
                    color="primary"
                >
                    <CheckIcon />
                    { this.props.t('Save') }
                </Button>
                <Button 
                    variant="contained" 
                    onClick={ () => changed ? this.setState({confirmExit: true}) : this.props.onClose() }
                >
                    <CloseIcon />
                    { changed ? this.props.t('Cancel') : this.props.t('Close') }
                </Button>
            </DialogActions>
        </Dialog>
    }
    getTabs()
    {
        return [
            {
                id : 0,
                title: 'System settings',
                component: MainSettingsDialog,
                data: "systemSettings"
            },
            {
                id : 1,
                title: 'Repositories',
                component: RepositoriesDialog,
                data: "systemRepositories"
            },
            {
                id : 2,
                title: 'Certificates',
                component: SertificatsDialog,
                data: "systemcCertificates"
            },
            {
                id : 3,
                title: "Let's encrypt SSL",
                component: SSLDialog,
                data: "systemcCertificates"
            },
            {
                id : 4,
                title: "Default ACL",
                component: ACLDialog,
                data: "systemcConfig"
            },
            {
                id : 5,
                title: "Statistics",
                component: StatisticsDialog,
                data: "systemcConfig"
            }
        ]
    }
    getDialogContent() 
    { 
       if(this.state.loading)
            return  <LinearProgress/> ;
       const _t =  this. getTabs().filter((e, i) => {
           return e.id == (this.props.currentTab.id ).toString() ||  e.id == parseInt(this.props.currentTab.id) 
       }) [0] || this. getTabs()[0];
       const _Component =  _t.component;
       const {groups, users} = this.state;
       return <div className={ this.props.classes.tabPanel }> 
           <_Component
                onChange={(id, data) => this.onChangedTab(id, data, _t.data) }
                { ...this.state[_t.data] }
                users={users}
                groups={groups}
                t={this.props.t}
           />
       </div>
    }
    onTab = (event, newTab) =>
    { 
        Router.doNavigate(null, 'system', newTab)
    }
    onChangedTab(id, data, param)
    {
        let state = {...this.state};
        state[param][id] = data;
        this.setState(state);  
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