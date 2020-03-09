import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';

import clsx from 'clsx';

import Connection from '@iobroker/adapter-react/Connection';
import {PROGRESS} from '@iobroker/adapter-react/Connection';
import Loader from '@iobroker/adapter-react/Components/Loader';
import I18n from '@iobroker/adapter-react/i18n';
import Router from '@iobroker/adapter-react/Components/Router';

//@material-ui/core
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
//import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

//@material-ui/icons
import AcUnitIcon from '@material-ui/icons/AcUnit';
import AppsIcon from '@material-ui/icons/Apps';
import ArtTrackIcon from '@material-ui/icons/ArtTrack';
import BuildIcon from '@material-ui/icons/Build';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CodeIcon from '@material-ui/icons/Code';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import DvrIcon from '@material-ui/icons/Dvr';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import InfoIcon from '@material-ui/icons/Info';
import MenuIcon from '@material-ui/icons/Menu';
import PermContactCalendarIcon from '@material-ui/icons/PermContactCalendar';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import StorageIcon from '@material-ui/icons/Storage';
import StoreIcon from '@material-ui/icons/Store';
import SubscriptionsIcon from '@material-ui/icons/Subscriptions';
import SubtitlesIcon from '@material-ui/icons/Subtitles';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import ViewListIcon from '@material-ui/icons/ViewList';
import VisibilityIcon from '@material-ui/icons/Visibility';

//@material-ui/lab
import Alert from '@material-ui/lab/Alert';

//Colors
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';

import Connecting from './components/Connecting';

import { ThemeProvider } from '@material-ui/core/styles';
import theme from '@iobroker/adapter-react/createTheme';

import Adapters from './tabs/Adapters';
import Instances from './tabs/Instances';
import Intro from './tabs/Intro';

const drawerWidth = 180;

const styles = theme => ({
    root: {
        display: 'flex',
        height: '100%'
    },
    appBar: {
        backgroundColor: blue[300],
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none'
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0
    },
    drawerPaper: {
        width: 'inherit',
        [theme.breakpoints.down('sm')]: {
            width: '100%'
        }
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: -drawerWidth,
        marginTop: theme.mixins.toolbar.minHeight,
        overflowY: 'auto',
        backgroundColor: grey[200]
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0
    }
});

class App extends React.Component {

  constructor(props) {

    super(props);

    window.alert = (message) => {

        console.log(message);

        if(message.includes('error') || message.includes('Error')) {
            this.showAlert(message, 'error');
        } else {
            this.showAlert(message, 'info');
        }
    };

    this.state = {
        connected:      false,
        progress:       0,
        ready:          false,
        protocol:       window.location.protocol || '',
        hostname:       window.location.hostname,
        port:           parseInt(window.location.port, 10),
        allTabs:        null,
        objects:        {},
        states:         {},
        hosts:          [],
        currentHost:    '',
        currentTab:     Router.getLocation(),
        currentDialog:  null,
        currentUser:    '',
        subscribesStates: {},
        subscribesObjects: {},
        subscribesLogs: 0,
        systemConfig:   null,
        instances:      null,
        objectsLoaded:  false,
        waitForRestart: false,
        tabs:           null,
        dialogs:        {},
        selectId:       null,
        config:         {},
        themeType: window.localStorage ? window.localStorage.getItem('App.theme') || 'light' : 'light',
        alert: false,
        alertType: 'info',
        alertMessage: '',
        drawerOpen: this.props.width !== 'xs',
        introInstances: [],
        introInstancesLoaded: false,
        formattedInstances: [],
        formattedInstancesLoaded: false,
        tab: null
    }

    this.tabsInfo = {
        'tab-intro':            {order: 1,    icon: <AppsIcon />},
        'tab-info':             {order: 5,    icon: <InfoIcon />,               host: true},
        'tab-adapters':         {order: 10,   icon: <StoreIcon />,              host: true},
        'tab-instances':        {order: 15,   icon: <SubtitlesIcon />,          host: true},
        'tab-objects':          {order: 20,   icon: <ViewListIcon />},
        'tab-enums':            {order: 25,   icon: <ArtTrackIcon />},
        'tab-devices':          {order: 27,   icon: <DvrIcon />,                host: true},
        'tab-logs':             {order: 30,   icon: <ViewHeadlineIcon />,       host: true},
        'tab-scenes':           {order: 35,   icon: <SubscriptionsIcon />},
        'tab-events':           {order: 40,   icon: <FlashOnIcon />},
        'tab-users':            {order: 45,   icon: <PersonOutlineIcon />},
        'tab-javascript':       {order: 50,   icon: <CodeIcon />},
        'tab-text2command-0':   {order: 55,   icon: <AcUnitIcon />},
        'tab-text2command-1':   {order: 56,   icon: <AcUnitIcon />},
        'tab-text2command-2':   {order: 57,   icon: <AcUnitIcon />},
        'tab-node-red-0':       {order: 60,   icon: <DeviceHubIcon />},
        'tab-node-red-1':       {order: 61,   icon: <DeviceHubIcon />},
        'tab-node-red-2':       {order: 62,   icon: <DeviceHubIcon />},
        'tab-fullcalendar-0':   {order: 65,   icon: <PermContactCalendarIcon />},
        'tab-fullcalendar-1':   {order: 66,   icon: <PermContactCalendarIcon />},
        'tab-fullcalendar-2':   {order: 67,   icon: <PermContactCalendarIcon />},
        'tab-hosts':            {order: 100,  icon: <StorageIcon />},
    };

    let port = this.state.port;

    if(isNaN(port)) {
        switch(this.state.protocol) {
            case 'https:':
              port = 443;
              break;
            case 'http:':
              port = 80;
              break;
            default:
              break;
        }
    }

    if(!port || port === 3000) {
      port = 8081;
    }

    this.socket = new Connection({
        port,
        /*autoSubscribes: ['*'],*/
        autoSubscribeLog: true,
        onProgress: progress => {
            if (progress === PROGRESS.CONNECTING) {
                this.setState({
                    connected: false
                });
            } else if (progress === PROGRESS.READY) {
                this.setState({
                    connected: true,
                    progress: 100
                });
            } else {
                this.setState({
                    connected: true,
                    progress: Math.round(PROGRESS.READY / progress * 100)
                });
            }
        },
        onReady: async (objects, scripts) => {

            this.socket.subscribeObject('*', (id, obj) => {
                //console.log(id);
            });

            I18n.setLanguage(this.socket.systemLang);
            window.systemLang = this.socket.systemLang;
            /*this.onObjectChange(objects, scripts, true);*/

            await this.socket.getStates();

            await this.getSystemConfig();
            await this.getHosts();

            this.getTabs();

            this.setState({
                ready: true,
                objects: objects,
                states: this.socket.states
            });

            this.handleNavigation();
        },
        onObjectChange: (objects, scripts) => {
            //console.log(objects);
        },
        onError: error => {
            console.error('ERROR: ' + error);
        },
      /*onBlocklyChanges: () => {
          /*this.confirmCallback = result => result && window.location.reload();
          this.setState({confirm: I18n.t('Some blocks were updated. Reload admin?')});*
      },*/
      onLog: message => {
          console.log('LOG: ' + JSON.stringify(message));
          //this.logIndex++;
          //this.setState({logMessage: {index: this.logIndex, message}})
      }
    });

    this.formatInfo = {
        'Uptime':        this.formatSeconds,
        'System uptime': this.formatSeconds,
        'RAM':           this.formatRam,
        'Speed':         this.formatSpeed,
        'Disk size':     this.formatBytes,
        'Disk free':     this.formatBytes
    };
  }

    async getAdapterInstances() {
        try {
            const instances = await this.socket.getAdapterInstances();
            this.setState({
                instances: instances
            });
        } catch(error) {
            console.log(error);
        }
    }

    async getSystemConfig() {
        try {
            const systemConfig = await this.socket.getObject('system.config');
            this.setState({
                systemConfig: systemConfig
            });
        } catch(error) {
            console.log(error);
        }
    }

    async getHosts() {
        try {
            const hosts = await new Promise((resolve, reject) => this.socket.socket.emit('getForeignObjects', 'system.host.*', 'host',
                (error, response) => error ? reject(error) : resolve(response)));

            const list = [];
            const hostData = {};

            for(const id in hosts) {

                const obj = hosts[id];

                if(obj.type === 'host') {
                    list.push(obj);
                }

                try {
                    const data = await new Promise((resolve, reject) => this.socket.socket.emit('sendToHost', obj._id, 'getHostInfo', null, (data) => {
                        if(data === 'permissionError') {
                            reject('May not read "getHostInfo"');
                        } else if(!data) {
                            reject('Cannot read "getHostInfo"');
                        } else {
                            resolve(data);
                        }
                    }));

                    hostData[obj._id] = data;

                } catch(error) {
                    console.log(error);
                }
            }

            this.setState({
                hosts: list,
                hostData: hostData
            });
        } catch(error) {
            console.log(error);
        }
    }

    getTabs() {

        let allTabs = [];
        /*for (let i = 0; i < main.instances.length; i++) {
            const instance = main.instances[i];
            const instanceObj = main.objects[instance];
            if (!instanceObj.common || !instanceObj.common.adminTab) continue;
            if (instanceObj.common.adminTab.singleton) {
                let isFound = false;
                const inst1 = instance.replace(/\.(\d+)$/, '.');
                for (let j = 0; j < addTabs.length; j++) {
                    const inst2 = addTabs[j].replace(/\.(\d+)$/, '.');
                    if (inst1 === inst2) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) addTabs.push(instance);
            } else {
                addTabs.push(instance);
            }*/

        if(this.state.instances) {
            for(const instanceIndex in this.state.instances) {

                const instance = this.state.instances[instanceIndex];

                if(!instance.common || !instance.common.adminTab) continue;

                if(instance.common.adminTab.singleton) {
                    let isFound = false;
                    const inst1 = instance._id.replace(/\.(\d+)$/, '.');
                    for(const tabIndex in allTabs) {
                        const inst2 = allTabs[tabIndex].replace(/\.(\d+)$/, '.');
                        if(inst1 === inst2) {
                            isFound = true;
                            break;
                        }
                    }
                    if(!isFound) allTabs.push(instance._id);
                } else {
                    allTabs.push(instance._id);
                }
            }
        }

        this.setState({
            allTabs: allTabs,
            tabs: []
        });
    }

    async setTitle(title) {
        document.title = title + ' - ioBroker'; 
    }

    /*addEventMessage(id, stateOrObj, isMessage, isState) {
        /* // cannot directly use tabs.events.add, because to init time not available.
        tabs.events.add(id, stateOrObj, isMessage, isState));
    }

    saveConfig(attr, value) {
        if(attr) {
            const config = this.state.config.slice();
            config[attr] = value;
            this.setState({
            config: config
            })
        }

        if (typeof Storage !== 'undefined') {
            Storage.setItem('adminConfig', JSON.stringify(this.state.config));
        }
    }

    saveTabs() {
        try {  
            this.socket.setObject('system.config', this.state.systemConfig);
        } catch(error) {
            this.showError(error);
        }
    }*/

    /**
     * Format number in seconds to time text
     * @param {!number} seconds
     * @returns {String}
     */
    formatSeconds(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;
        let hours = Math.floor(seconds / 3600);
        if(hours < 10) {
            hours = '0' + hours;
        }
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if(seconds < 10) {
            seconds = '0' + seconds;
        }
        let text = '';
        if(days) {
            text += days + ' ' + I18n.t('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

        return text;
    }

    /**
     * Format bytes to MB or GB
     * @param {!number} bytes
     * @returns {String}
     */
    formatRam(bytes) {
        const GB = Math.floor(bytes / (1024 * 1024 * 1024) * 10) / 10;
        bytes %= (1024 * 1024 * 1024);
        const MB = Math.floor(bytes / (1024 * 1024) * 10) / 10;
        let text = '';
        if(GB > 1) {
            text += GB + ' GB';
        } else {
            text += MB + ' MB';
        }

        return text;
    }

    formatSpeed(mhz) {
        return mhz + ' MHz';
    }

    formatBytes(bytes) {
        if (Math.abs(bytes) < 1024) {
            return bytes + ' B';
        }
        const units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        let u = -1;
        do {
            bytes /= 1024;
            ++u;
        } while (Math.abs(bytes) >= 1024 && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    }

    /*getUser() {
        if(!this.state.currentUser) {
            this.socket.socket.emit('authEnabled', (auth, user) => {
                const currentUser = 'system.user.' + user;
                this.setState({
                    currentUser: currentUser,
                    authenticated: auth
                });
            });
        } else if(this.state.objects[this.state.currentUser]) {
            const obj = this.state.objects[this.state.currentUser];
            let name = '';

            if(!obj || !obj.common || !obj.common.name) {
                name = this.state.currentUser.replace(/^system\.user\./);
                name = name[0].toUpperCase() + name.substring(1).toLowerCase();
            } else {
                //name = translateName(obj.common.name);
            }

            if(obj && obj.common && obj.common.icon) {
                const objs = {};
                objs[this.state.currentUser] = obj;
                //$('#current-user-icon').html(main.getIcon(main.currentUser, null, objs));
            } else {
                //$('#current-user-icon').html('<i className="large material-icons">account_circle</i>');
            }
            //$('#current-user').html(name);
            const groups = [];
            for(let i = 0; i < this.state.tabs.users.groups.length; i++) {
                const group = this.state.objects[this.state.tabs.users.groups[i]];
                if (group && group.common && group.common.members && group.common.members.indexOf(this.state.currentUser) !== -1) {
                    //groups.push(_(translateName(group.common.name)));
                }
            }
            //$('#current-group').html(groups.join(', '));
        }
    }*/

    async getIntroInstances() {

        if(this.state.introInstancesLoaded) return;
        
        if(!this.state.instances) await this.getAdapterInstances();

        const deactivated = (this.state.systemConfig) ? this.state.systemConfig.common.intro : {};
        const instances = this.state.instances.slice();
        const introInstances = [];

        instances.sort((a, b) => {
            a = a && a.common;
            b = b && b.common;
            a = a || {};
            b = b || {};

            if (a.order === undefined && b.order === undefined) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            } else if (a.order === undefined) {
                return -1;
            } else if (b.order === undefined) {
                return 1;
            } else {
                if (a.order > b.order) return 1;
                if (a.order < b.order) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            }
        });

        for(const key in instances) {

            const obj = instances[key];
            const common = (obj) ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];

            if(common.name && common.name === 'admin' && common.localLink === (this.state.hostname || '')) {
                continue;
            } else if(common.name && common.name === 'web') {
                continue;
            } else if(common.name && common.name !== 'vis-web-admin' && common.name.match(/^vis-/)) {
                continue;
            } else if(common.name && common.name.match(/^icons-/)) {
                continue;
            } else if(common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {

                const instance = {};
                const ws = (common.welcomeScreen) ? common.welcomeScreen : null;
                
                instance.id = obj._id.replace('system.adapter.', '');
                instance.name = /*(ws && ws.name) ? ws.name :*/ (common.titleLang) ? common.titleLang[window.systemLang] : common.title;
                instance.color = (ws && ws.color) ? ws.color : '';
                instance.description = common.desc[window.systemLang];
                instance.image = (common.icon) ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
                const link  = /*(ws && ws.link) ? ws.link :*/ common.localLinks || common.localLink || '';
                instance.link = this.replaceLink(link, common.name, instanceId);
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;
                introInstances.push(instance);
            }
        }

        /*var urlText = url.replace(/^https?:\/\//, '');
        var pos = urlText.indexOf('/');
        if (pos !== -1) {
            urlText = urlText.substring(0, pos);
        }
        if (adapter === 'admin' && urlText === location.host) return null;
        if (adapter === 'web') return null;
        if (adapter !== 'vis-web-admin' && adapter.match(/^vis-/)) return null; // no widgets
        if (adapter.match(/^icons-/)) return null; // no icons
    */

        const hosts = this.state.hosts;

        for(const key in hosts) {
            const obj = hosts[key];
            const common = (obj) ? obj.common : null;

            if(common) {
                const instance = {};

                const hostData = this.state.hostData[obj._id];

                instance.id = obj._id;
                instance.name = common.name;
                instance.color = '';
                instance.description =
                    <ul>
                        <li>
                            <b>Platform: </b>
                            <span>{ (this.formatInfo['Platform'] ? this.formatInfo['Platform'](hostData['Platform']) : hostData['Platform'] || ' --') }</span>
                        </li>
                        <li>
                            <b>RAM: </b>
                            <span>{ (this.formatInfo['RAM'] ? this.formatInfo['RAM'](hostData['RAM']) : hostData['RAM'] || ' --') }</span>
                        </li>
                        <li>
                            <b>Node.js: </b>
                            <span>{ (this.formatInfo['Node.js'] ? this.formatInfo['Node.js'](hostData['Node.js']) : hostData['Node.js'] || ' --') }</span>
                        </li>
                        <li>
                            <b>NPM: </b>
                            <span>{ (this.formatInfo['NPM'] ? this.formatInfo['NPM'](hostData['NPM']) : hostData['NPM'] || ' --') }</span>
                        </li>
                    </ul>;
                instance.image = (common.icon) ? common.icon : 'img/no-image.png';
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;
                instance.info = 'Info';
                introInstances.push(instance);
            }
        }

        this.setState({
            introInstances: introInstances,
            introInstancesLoaded: true
        });
    }

    replaceLink(link, adapter, instance) {
        
        if(this.state.ready && link) {

            let placeholder = link.match(/%(\w+)%/g);

            if(placeholder) {
                if(placeholder[0] === '%ip%') {
                    link = link.replace('%ip%', this.state.hostname);
                    link = this.replaceLink(link, adapter, instance);
                } else if(placeholder[0] === '%protocol%') {
                    link = link.replace('%protocol%', this.state.protocol.substr(0, this.state.protocol.length - 1));
                    link = this.replaceLink(link, adapter, instance);
                } else if(placeholder[0] === '%instance%') {
                    link = link.replace('%instance%', instance);
                    link = this.replaceLink(link, adapter, instance);
                } else {
                    // remove %%
                    placeholder = placeholder[0].replace(/%/g, '');

                    if (placeholder.match(/^native_/)) placeholder = placeholder.substring(7);
                    // like web.0_port
                    let parts;
                    if (placeholder.indexOf('_') === -1) {
                        parts = [adapter + '.' + instance, placeholder];
                    } else {
                        parts = placeholder.split('_');
                        // add .0 if not defined
                        if (!parts[0].match(/\.[0-9]+$/)) parts[0] += '.0';
                    }
            
                    if (parts[1] === 'protocol') parts[1] = 'secure';
                    
                    try {
                        const object = this.state.objects['system.adapter.' + parts[0]];
                        
                        if(link && object) {
                            if(parts[1] === 'secure') {
                                link = link.replace('%' + placeholder + '%', object.native[parts[1]] ? 'https' : 'http');
                            } else {
                                if (link.indexOf('%' + placeholder + '%') === -1) {
                                    link = link.replace('%native_' + placeholder + '%', object.native[parts[1]]);
                                } else {
                                    link = link.replace('%' + placeholder + '%', object.native[parts[1]]);
                                }
                            }
                        } else {
                            console.log('Cannot get link ' + parts[1]);
                            link = link.replace('%' + placeholder + '%', '');
                        }
            
                    } catch(error) {
                        console.log(error);
                    }

                    link = this.replaceLink(link, adapter, instance);
                }
            }
        }

        return link;
    }

    updateIntro(instances) {

        const systemConfig = this.state.systemConfig;
        
        let changed = false;

        for(const index in instances) {

            const instance = instances[index];

            if(systemConfig.common.intro.hasOwnProperty(instance.id) || !instance.editActive) {
                if(systemConfig.common.intro[instance.id] !== instance.editActive) {
                    systemConfig.common.intro[instance.id] = instance.editActive;
                    changed = true;
                }
            }
        }

        if(changed) {
            this.socket.getObject('system.config').then((obj) => {

                obj.common.intro = systemConfig.common.intro;

                this.socket.setObject('system.config', obj);
                
                this.showAlert('Updated', 'success');
            }, (error) => {
                console.log(error);
                this.showAlert(error, 'error');
            });
        }
    }

    getCurrentTab() {

        if(this.state && this.state.currentTab) {
            if(this.state.currentTab.tab === 'tab-adapters') {
                return (
                    <Adapters

                    />
                );
            } else if(this.state.currentTab.tab === 'tab-instances') {
                return (
                    <Instances
                        ready={ this.state.formattedInstancesLoaded }
                        instances={ this.state.formattedInstances }
                        extendObject={ (id, data) => this.extendObject(id, data) }
                    />
                );
            }
        }

        return (
            <Intro
                ready={ this.state.introInstancesLoaded }
                instances={ this.state.introInstances }
                updateIntro={ (instances) => this.updateIntro(instances) }
            />
        );
    }

    handleAlertClose(event, reason) {
        if(reason === 'clickaway') {
          return;
        }

        this.setState({
            alert: false
        });
    }

    showAlert(message, type) {
        
        if(type !== 'error' && type !== 'warning' && type !== 'info' && type !== 'success') {
            type = 'info';
        }

        this.setState({
            alert: true,
            alertType: type,
            alertMessage: message
        });
    }

    handleDrawerClose() {
        this.setState({
            drawerOpen: false
        });
    }

    handleDrawerOpen() {
        this.setState({
            drawerOpen: true
        });
    }

    handleNavigation(tab) {

        if(tab) {
            Router.doNavigate(tab)

            this.setState({
                currentTab: Router.getLocation()
            });
        }

        this.setTitle(tab ? tab.replace('tab-', '') : this.state.currentTab.tab.replace('tab-', ''));

        tab = tab || this.state.currentTab.tab || '';

        if(tab === 'tab-adapters') {
            //Todo
        } else if(tab === 'tab-instances') {
            this.getFormattedInstances();
        } else if(tab === 'tab-intro') {
            this.getIntroInstances();
        } else {
            this.getIntroInstances();
        }

        if(this.props.width === 'xs') {
            this.handleDrawerClose();
        }
    }

    getNavigationItems() {

        const items = [];

        for(const index in this.tabsInfo) {
            //For developing
            if(index !== 'tab-intro' && index !== 'tab-adapters' && index !== 'tab-instances') continue;

            items.push(
                <ListItem button key={ index } onClick={ () => this.handleNavigation(index) }>
                    <Grid container spacing={ 1 } alignItems="center">
                        <Grid item>
                            <ListItemIcon style={{minWidth: 0}}>
                                { this.tabsInfo[index].icon }    
                            </ListItemIcon>
                        </Grid>
                        <Grid item>
                            <ListItemText primary={ index } />
                        </Grid>
                    </Grid>
                </ListItem>
            );
        }

        return items;
    }

    async getFormattedInstances() {

        if(this.state.formattedInstancesLoaded) return;

        if(!this.state.instances) await this.getAdapterInstances();
        
        const instances = this.state.instances.slice();
        const formatted = [];

        instances.sort((a, b) => {
            a = a && a.common;
            b = b && b.common;
            a = a || {};
            b = b || {};

            if (a.order === undefined && b.order === undefined) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            } else if (a.order === undefined) {
                return -1;
            } else if (b.order === undefined) {
                return 1;
            } else {
                if (a.order > b.order) return 1;
                if (a.order < b.order) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                return 0;
            }
        });

        for(const key in instances) {

            const obj = instances[key];
            const common = (obj) ? obj.common : null;
            const objId = obj._id.split('.');
            const instanceId = objId[objId.length - 1];

            const instance = {};
            
            instance.id = obj._id.replace('system.adapter.', '');
            instance.name = (common.titleLang) ? common.titleLang[window.systemLang] : common.title;
            instance.image = (common.icon) ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
            const link = common.localLinks || common.localLink || '';
            instance.link = this.replaceLink(link, common.name, instanceId);

            let state = (common.mode === 'daemon') ? 'green' : 'blue';

            if(common.enabled && (!common.webExtension || !obj.native.webInstance)) {

                if(!this.state.states[obj._id + '.connected'] || !this.state.states[obj._id + '.connected'].val) {
                    state = (common.mode === 'daemon') ? 'red' : 'blue';
                }
    
                if(!this.state.states[obj._id + '.alive'] || !this.state.states[obj._id + '.alive'].val) {
                    state = (common.mode === 'daemon') ? 'red' : 'blue';
                }
                
                if(this.state.states[instance.id + '.info.connection'] || this.state.objects[instance.id + '.info.connection']) {
                    
                    const val = this.state.states[instance.id + '.info.connection'] ? this.state.states[instance.id + '.info.connection'].val : false;
                    if(!val) {
                        state = state === 'red' ? 'red' : 'orange';
                    }
                }
            } else {
                state = (common.mode === 'daemon') ? 'grey' : 'blue';
            }

            instance.state = state;

            const isRun = common.onlyWWW || common.enabled;
            
            instance.canStart = !common.onlyWWW;
            instance.config = !common.noConfig;
            instance.isRun = isRun;

            formatted.push(instance);
        }

        this.setState({
            formattedInstances: formatted,
            formattedInstancesLoaded: true
        });
    }

    extendObject(id, data) {
        this.socket.socket.emit('extendObject', id, data, (error) => {
            if (error) this.showAlert(error, 'error');
        });
    }

    render() {
        
        if(!this.state.ready) {
            return (<Loader theme={ this.state.themeType }/>);
        }

        const { classes } = this.props;

        return (
            <ThemeProvider theme={ theme() }>
                <div className={ classes.root }>
                    <AppBar
                        position="fixed"
                        className={ clsx(classes.appBar, {[classes.appBarShift]: this.state.drawerOpen}) }
                    >
                        <Toolbar>
                            <IconButton
                                edge="start"
                                className={ clsx(classes.menuButton, this.state.drawerOpen && classes.hide) }
                                onClick={ () => this.handleDrawerOpen() }
                            >
                                <MenuIcon />
                            </IconButton>
                            <IconButton>
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton>
                                <BuildIcon />
                            </IconButton>
                            <Typography variant="h6" className={classes.title} style={{flexGrow: 1}}>
                            </Typography>
                            <Grid container spacing={ 1 } alignItems="center" style={{width: 'initial'}}>
                                <Grid item>
                                    <Typography>admin</Typography>
                                </Grid>
                                <Grid item>
                                    <Avatar alt="ioBroker" src="img/no-image.png" />
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                    <Drawer
                        className={ classes.drawer }
                        variant="persistent"
                        anchor="left"
                        open={ this.state.drawerOpen }
                        classes={{
                        paper: classes.drawerPaper,
                        }}
                    >
                        <div className={ classes.drawerHeader }>
                        <IconButton onClick={ () => this.handleDrawerClose() }>
                            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </IconButton>
                        </div>
                        
                        <List>
                            { this.getNavigationItems() }
                        </List>
                    </Drawer>
                    <main
                        className={clsx(classes.content, {
                            [classes.contentShift]: this.state.drawerOpen,
                        })}
                    >
                        { this.getCurrentTab() }
                    </main>
                    <Snackbar open={ this.state.alert } autoHideDuration={ 6000 } onClose={ () => this.handleAlertClose() }>
                        <Alert onClose={ () => this.handleAlertClose() } variant="filled" severity={ this.state.alertType }>
                            { this.state.alertMessage }
                        </Alert>
                    </Snackbar>
                </div>
                { !this.state.connected && <Connecting /> }
            </ThemeProvider>
        );
    }
}

export default withWidth()(withStyles(styles)(App));