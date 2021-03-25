import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import { Component } from 'react';
import PropTypes from 'prop-types';
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import IconButton from '@material-ui/core/IconButton';

import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';
import Router from '@iobroker/adapter-react/Components/Router';

import MainSettingsDialog from "./SystemSettingsTabs/MainSettingsDialog";
import RepositoriesDialog from "./SystemSettingsTabs/RepositoriesDialog";
import SertificatsDialog from "./SystemSettingsTabs/SertificatsDialog";
import SSLDialog from "./SystemSettingsTabs/SSLDialog";
import ACLDialog from "./SystemSettingsTabs/ACLDialog";
import StatisticsDialog from "./SystemSettingsTabs/StatisticsDialog";

// icons
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

//style
import "../assets/css/style.css";


const styles = theme => ({
    tabPanel: {
        width: '100%',
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        overflow: 'hidden'
    },
    tab: {
        // backgroundColor:'#FFF',
        // color:lightBlue[500]
    },
    dialogTitle : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding:'0 0 0 20px',
    },
    dialog : {
        width:'100%',
        height:'100%',
        maxWidth:'100%' 
    },
    content : {
        padding:'0!important'
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
            systemConfig: null,
            systemCertificates: null,
            systemRepositories: null,
        };
        this.getSettings(this.state.currentHost);
    }
    getSettings() 
    {
        const newState = {loading: false};
         return this.props.socket.getObject('system.repositories')
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
                    this.originalRepositories = JSON.stringify(systemRepositories);
                    //console.log(systemRepositories.native.repositories);
                    newState.systemRepositories = systemRepositories;
                    return this.props.socket.getSystemConfig(true);
                })
                
                    .then(systemConfig => {
                        console.log(systemConfig);
                        this.originalConfig = JSON.stringify( systemConfig );
                        newState.systemConfig = systemConfig;
                        // return this.props.socket.getObject('system.certificates');
                        return this.props.socket.getRawSocket().emit(
                            'sendToHost', 
                            this.props.currentHost, 
                            'getDiagData', 
                            systemConfig.common.diag, 
                            diagData => {
                                //console.log(diagData);
                                newState.diagData = diagData;    
                            });
                    })
                        /**/
                        .then(diagData => {
                            return this.props.socket.getUsers();
                        })
                            .then(users => {
                                //console.log(users);       
                                newState.users = users;                           
                                return this.props.socket.getGroups();
                            })  
                                .then(groups => {
                                    //console.log(groups);   
                                    newState.groups = groups;                             
                                    return this.props.socket.getObject('system.certificates');
                                })                        
                                    .then(systemCertificates => {
                                        //console.log(systemCertificates);
                                        this.originalCertificates = JSON.stringify( systemCertificates );
                                        newState.systemCertificates = systemCertificates;
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
        // console.log(this.state);
        return this.props.socket.getSystemConfig(true)
            .then(systemConfig => {
                systemConfig = systemConfig || {};
                if (JSON.stringify(systemConfig.common) !== JSON.stringify(this.state.systemConfig.common)) 
                {
                    return this.props.socket.setSystemConfig(this.state.systemConfig);
                } 
                else
                {
                    return Promise.resolve();
                }
            })
                .then(() => this.props.socket.setObject( 'system.certificates', this.state.systemCertificates ))
                    .then(() => this.props.socket.getObject('system.repositories'))
                        .then(systemRepositories => {
                            systemRepositories = systemRepositories || {};
                            systemRepositories.native = systemRepositories.native || {};
                            systemRepositories.native.repositories = systemRepositories.native.repositories || {};
                            const newRepo = JSON.parse(JSON.stringify(this.state.systemRepositories.native.repositories));

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
                        }).then(() => {
                            this.getSettings();
                            alert(this.props.t('Settings saved'));
                        })
                            .catch(e => window.alert('Cannot save system configuration: ' + e));
    }
    getTabs()
    {
        return [
            {
                id : 0,
                title: 'System settings',
                component: MainSettingsDialog,
                data: 'systemConfig',
                data2:'systemRepositories',
                handle: null
            },
            {
                id : 1,
                title: 'Repositories',
                component: RepositoriesDialog,
                data: 'systemRepositories',
                data2:{},
                handle: null
            },
            {
                id : 2,
                title: 'Certificates',
                component: SertificatsDialog,
                data: 'systemCertificates',
                data2:{},
                handle: null
            },
            {
                id : 3,
                title: 'Let\'s encrypt SSL',
                component: SSLDialog,
                data: 'systemCertificates',
                data2:{},
                handle: null
            },
            {
                id : 4,
                title: 'Default ACL',
                component: ACLDialog,
                data: 'systemConfig',
                data2:{},
                handle: null
            },
            {
                id : 5,
                title: 'Statistics',
                component: StatisticsDialog,
                data: 'systemConfig',
                data2: 'diagData',
                handle: type => this.onChangeDiagType(type)
            }
        ]
    }
    onChangeDiagType = type =>
    {
        // console.log(type);
        this.props.socket.getRawSocket().emit(
            'sendToHost', 
            this.props.currentHost, 
            'getDiagData', 
            type, 
            diagData => {
               // console.log(diagData)
                this.setState({ 
                    diagData, 
                    systemConfig: { 
                        ...this.state.systemConfig,
                        common: {
                            ...this.state.systemConfig.common,
                            diag: type
                        }
                    } 
                });
            });
    }
    getDialogContent() { 
       if(this.state.loading)
            return  <LinearProgress/> ;
       const _t =  this. getTabs().filter((e, i) => {
           return e.id == (this.props.currentTab.id ).toString() ||  e.id == parseInt(this.props.currentTab.id) 
       }) [0] || this. getTabs()[0];
       const _Component =  _t.component;
       const {groups, users} = this.state;
    //    console.log( this.state );
       return <div className={ this.props.classes.tabPanel }> 
           <_Component
                onChange={(data) => this.onChangedTab(_t.data, data) }
                data={ this.state[_t.data] }
                data2= { this.state[_t.data2] } 
                handle={ _t.handle } 
                users={users}
                groups={groups}
                themeName={this.props.themeName}
                t={this.props.t}
           />
       </div>
    }
    onTab = (event, newTab) => { 
        Router.doNavigate(null, 'system', newTab)
    }
    onChangedTab (id, data)  {
        console.log(id, data);
        let state = {...this.state};
        state[ id ] = data;
        console.log(state);
        this.setState( state );  
        // console.log( id, data, param, state );
    }

    render() {
        //console.log(this.props)
        const changed = !(JSON.stringify(this.state.systemRepositories)   === this.originalRepositories &&
                        JSON.stringify(this.state.systemConfig)        === this.originalConfig &&
                        JSON.stringify(this.state.systemCertificates)  === this.originalCertificates);
        const tabs = this. getTabs().map((e,i) =>
        {
            return  <Tab
                label={ this.props.t( e.title ) } 
                id={ (e.id).toString() } 
                aria-controls={ 'simple-tabpanel-' +  e.id } 
                key={i}
            />;
        })
        const curTab = parseInt(this.props.currentTab.id, 10) || 0;
        return <Dialog
            className={ this.props.classes.dialog }
            classes={{
                root: this.props.classes.dialog,
                paper: 'dialog-setting'
            }}
            open={ true }
            onClose={ () => {} }
            fullWidth={ false }
            fullScreen={ false }
            aria-labelledby="system-settings-dialog-title"
        >
            <DialogContent className={ this.props.classes.content }>
                <AppBar position="static" color="default">
                    <div className={this.props.classes.dialogTitle}>
                        <Typography className="dialogName">
                            { this.props.t('Base settings') }
                        </Typography>
                        <Tabs
                            className={ this.props.classes.tab } 
                            indicatorColor="primary"
                            value={ curTab }
                            onChange={ this.onTab }
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            { tabs }
                        </Tabs>
                        <IconButton 
                            edge="start" 
                            color="inherit" 
                            onClick={ () => changed ? this.setState({confirmExit: true}) : this.props.onClose() }
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>   
                    </div> 
              
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

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`nav-tabpanel-${index}`}
        aria-labelledby={`nav-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box p={3}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
  };