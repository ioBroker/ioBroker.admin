import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import clsx from 'clsx';

import Connection from './components/Connection';
import { PROGRESS } from './components/Connection';
import Loader from '@iobroker/adapter-react/Components/Loader';
import I18n from '@iobroker/adapter-react/i18n';
import Router from '@iobroker/adapter-react/Components/Router';

// @material-ui/core
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';

// import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// @material-ui/icons
import AcUnitIcon from '@material-ui/icons/AcUnit';
import AppsIcon from '@material-ui/icons/Apps';
import ArtTrackIcon from '@material-ui/icons/ArtTrack';
import BuildIcon from '@material-ui/icons/Build';
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
import FilesIcon from '@material-ui/icons/FileCopy';
import ExpertIcon from './components/ExperIcon';

import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness5Icon from '@material-ui/icons/Brightness5';
import Brightness6Icon from '@material-ui/icons/Brightness6';
import Brightness7Icon from '@material-ui/icons/Brightness7';

// @material-ui/lab
import Alert from '@material-ui/lab/Alert';

import ConfirmDialog from './components/ConfirmDialog';
import Drawer from './components/Drawer';
import DrawerItem from './components/DrawerItem';
import Connecting from './components/Connecting';

import { ThemeProvider } from '@material-ui/core/styles';
import theme from './Theme';
import LogWorker from './components/LogsWorker';

import Login from './login/Login';

// Tabs
import Adapters from './tabs/Adapters';
import Instances from './tabs/Instances';
import Intro from './tabs/Intro';
import Logs from './tabs/Logs';
import Files from './tabs/Files';
import Objects from './tabs/Objects';
import BaseSettings from './tabs/BaseSettings';

import i18n from '@iobroker/adapter-react/i18n';

const drawerWidth = 180;

const styles = theme => ({
    root: {
        display: 'flex',
        height: '100%'
    },
    appBar: {
        /*backgroundColor: blue[300],*/
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    logoWhite: {
        background: '#FFFFFF'
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
    content: {
        flexGrow: 1,
        padding: theme.spacing(2),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginTop: theme.mixins.toolbar.minHeight,
        overflowY: 'auto',
        /*backgroundColor: grey[200]*/
    },
    contentMargin: {
        marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0
    },
    expertIcon: {
        width: 22,
        height: 22,
        //color: theme.palette.text ? theme.palette.text.disabled : 'grey'
    },
    expertIconActive: {
        //color: theme.palette.action.active
    },
    baseSettingsButton: {
        color: 'red',
    }
});

class App extends Router {

    constructor(props) {

        super(props);

        String.prototype.ucFirst = function() {
            return this.substring(0, 1).toUpperCase() + this.substring(1).toLowerCase();
        };

        window.alert = message => {
            if (message.toLowerCase().includes('error')) {
                console.error(message);
                this.showAlert(message, 'error');
            } else {
                console.log(message);
                this.showAlert(message, 'info');
            }
        };

        this.translations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'ru': require('./i18n/ru'),
            'pt': require('./i18n/pt'),
            'nl': require('./i18n/nl'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'es': require('./i18n/es'),
            'pl': require('./i18n/pl'),
            'zh-cn': require('./i18n/zh-cn'),
        };
        
        // init translations
        I18n.setTranslations(this.translations);
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());

        const query = {};
        (window.location.search || '').replace(/^\?/, '').split('&').forEach(attr => {
            const parts = attr.split('=');
            if (!parts[0]) {
                return;
            }
            query[parts[0]] = parts[1] === undefined ? true : decodeURIComponent(parts[1]);
        });

        if (!query.login) {

            this.state = {
                connected:      false,
                progress:       0,
                ready:          false,
                lang:           'en',

                //Finished
                protocol:       this.getProtocol(),
                hostname:       window.location.hostname,
                port:           this.getPort(),
                //---------

                allTabs:        null,

                expertMode:     window.localStorage.getItem('App.expertMode') === 'true',
                
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

                objects:        {},

                waitForRestart: false,
                tabs:           null,
                config:         {},

                //==================== Finished
                logErrors: 0,
                //=============

                stateChanged: false,

                theme:          this.getTheme(),
                themeName:      this.getThemeName(this.getTheme()),
                themeType:      this.getThemeType(this.getTheme()),

                alert: false,
                alertType: 'info',
                alertMessage: '',
                drawerOpen: this.props.width !== 'xs',

                tab: null,
                allStored: true,
                dataNotStoredDialog: false,
                dataNotStoredTab: '',

                baseSettingsOpened: null,
                unsavedDataInDialog: false
            };

            this.logWorker = null;
            this.logErrorHandlerBound = this.logErrorHandler.bind(this);

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
                'tab-files':            {order: 110,  icon: <FilesIcon />},
            };
        } else {
            this.state = {
                login: true,
                themeType: window.localStorage && window.localStorage.getItem('App.theme') ?
                    window.localStorage.getItem('App.theme') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            }
        }
    }

    logErrorHandler(logErrors) {
        if (logErrors !== this.state.logErrors) {
            this.setState({
                logErrors
            });
        }
    }

    setUnsavedData(hasUnsavedData) {
        if (hasUnsavedData !== this.state.unsavedDataInDialog) {
            this.setState({unsavedDataInDialog: hasUnsavedData});
        }
    }

    componentDidMount() {
        if (!this.state.login) {
            this.socket = new Connection({
                name: 'admin',
                port: this.getPort(),
                autoSubscribes: ['*', 'system.adapter.*'],
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
                    if (!this.logWorker && this.logErrorHandlerBound) {
                        this.logWorker = new LogWorker(this.socket, 1000);
                        this.logWorker.registerErrorCountHandler(this.logErrorHandlerBound);
                    }

                    I18n.setLanguage(this.socket.systemLang);
                    this.setState({ lang: this.socket.systemLang });

                    // TODO: It is better to collect all the attributes in state and set it with one step
                    // now we have 4 setState calls
                    this.setState({
                        ready: true,
                        objects,
                    });

                    // this.socket.subscribeObject('*', (id, obj) => this.onObjectChange(id, obj));
                    // this.socket.subscribeState('*', (id, state) => this.onStateChange(id, state));

                    await this.getSystemConfig();
                    await this.getHosts();

                    this.getTabs();

                    this.logWorker && this.logWorker.setCurrentHost(this.state.currentHost);
                },
                //onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
                onError: error => {
                    console.error(error);
                    this.showAlert(error, 'error');
                }
            });
        }
    }

    clearLogErrors(cb) {
        if (this.state.logErrors) {
            this.setState({logErrors: 0}, cb);
        } else {
            cb && cb();
        }
    }

    /**
     * Updates the current currentTab in the states
     */
    onHashChanged() {
        this.setState({
            currentTab: Router.getLocation()
        });
    }

    /**
     * Get the used port
     */
    getPort() {

        let port = parseInt(window.location.port, 10);

        if (isNaN(port)) {
            switch(this.getProtocol()) {
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

        if (!port || port === 3000) {
            port = 8081;
        }

        return port;
    }

    /**
     * Get the used protocol
     */
    getProtocol() {
        return window.location.protocol;
    }

    /**
     * Get a theme
     * @param {string} name Theme name
     * @returns {Theme}
     */
    getTheme(name) {
        return theme(name ? name : window.localStorage && window.localStorage.getItem('App.theme') ?
            window.localStorage.getItem('App.theme') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'colored');
    }

    /**
     * Get the theme name
     * @param {Theme} theme Theme
     * @returns {string} Theme name
     */
    getThemeName(theme) {
        return theme.name;
    }

    /**
     * Get the theme type
     * @param {Theme} theme Theme
     * @returns {string} Theme type
     */
    getThemeType(theme) {
        return theme.palette.type;
    }

    /**
     * Changes the current theme
     */
    toggleTheme() {

        const themeName = this.state.themeName;

        const newThemeName = themeName === 'dark' ? 'blue' :
            themeName === 'blue' ? 'colored' : themeName === 'colored' ? 'light' :
            themeName === 'light' ? 'dark' : 'colored';

        window.localStorage.setItem('App.theme', newThemeName);

        const theme = this.getTheme(newThemeName);

        this.setState({
            theme: theme,
            themeName: this.getThemeName(theme),
            themeType: this.getThemeType(theme)
        });
    }

    async onObjectChange(id, obj) {
        console.log('OBJECT: ' + id);
        if (obj) {
            this.setState(prevState => {
                
                const objects = prevState.objects;
                objects[id] = obj;

                return {
                    objects: objects
                };
            });
        } else {
            this.setState(prevState => {
                
                const objects = prevState.objects;
                delete objects[id];

                return {
                    objects: objects
                };
            });
        }
    }

    async onStateChange(id, state) {
        //console.log('STATE: ' + id);
        this.setState({
            stateChanged: true
        });
        /*if (state) {
            this.setState(prevState => {
                
                const states = prevState.states;
                states[id] = state;

                return {
                    states: states
                };
            });
        } else {
            this.setState(prevState => {
                
                const states = prevState.states;
                delete states[id];

                return {
                    states: states
                };
            });
        }*/
    }

    async getSystemConfig() {
        try {
            const systemConfig = await this.socket.getSystemConfig();
            this.setState({ systemConfig });
        } catch (error) {
            console.log(error);
        }
    }

    async getHosts() {
        const hosts = await this.socket.getHosts();

        if (this.state.currentHost) {
            this.setState({ hosts });
        } else {
            this.setState({ hosts, currentHost: hosts[0]._id });
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

        if (this.state.instances) {
            this.state.instances.forEach(instanceIndex => {

                const instance = this.state.instances[instanceIndex];

                if (!instance.common || !instance.common.adminTab) {
                    return;
                }

                if (instance.common.adminTab.singleton) {
                    let isFound = false;
                    const inst1 = instance._id.replace(/\.(\d+)$/, '.');

                    for (const tabIndex in allTabs) {
                        const inst2 = allTabs[tabIndex].replace(/\.(\d+)$/, '.');
                        if (inst1 === inst2) {
                            isFound = true;
                            break;
                        }
                    }

                    !isFound && allTabs.push(instance._id);
                } else {
                    allTabs.push(instance._id);
                }
            });
        }

        this.setState({
            allTabs,
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
        if (attr) {
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
        if (hours < 10) {
            hours = '0' + hours;
        }
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        let text = '';
        if (days) {
            text += days + ' ' + I18n.t('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

        return text;
    }

    /*getUser() {
        if (!this.state.currentUser) {
            this.socket.socket.emit('authEnabled', (auth, user) => {
                const currentUser = 'system.user.' + user;
                this.setState({
                    currentUser: currentUser,
                    authenticated: auth
                });
            });
        } else if (this.state.objects[this.state.currentUser]) {
            const obj = this.state.objects[this.state.currentUser];
            let name = '';

            if (!obj || !obj.common || !obj.common.name) {
                name = this.state.currentUser.replace(/^system\.user\./);
                name = name[0].toUpperCase() + name.substring(1).toLowerCase();
            } else {
                //name = translateName(obj.common.name);
            }

            if (obj && obj.common && obj.common.icon) {
                const objs = {};
                objs[this.state.currentUser] = obj;
                //$('#current-user-icon').html(main.getIcon(main.currentUser, null, objs));
            } else {
                //$('#current-user-icon').html('<i className="large material-icons">account_circle</i>');
            }
            //$('#current-user').html(name);
            const groups = [];
            for (let i = 0; i < this.state.tabs.users.groups.length; i++) {
                const group = this.state.objects[this.state.tabs.users.groups[i]];
                if (group && group.common && group.common.members && group.common.members.indexOf(this.state.currentUser) !== -1) {
                    //groups.push(_(translateName(group.common.name)));
                }
            }
            //$('#current-group').html(groups.join(', '));
        }
    }*/

    getCurrentTab() {

        if (this.state.baseSettingsOpened) {
            return (<BaseSettings
                key="intro"
                onUnsaveChanged={ hasUnsavedData => this.setUnsavedData(hasUnsavedData) }
                lang={ this.state.lang }
                showAlert={ (message, type) => this.showAlert(message, type) }
                socket={ this.socket }
                t={ I18n.t }
            />);
        }

        if (this.state && this.state.currentTab && this.state.currentTab.tab) {
            if (this.state.currentTab.tab === 'tab-adapters') {
                return (
                    <Adapters
                        key="adapters"
                        systemConfig={ this.state.systemConfig }
                        socket={ this.socket }
                        currentHost={ this.state.currentHost }
                        ready={ this.state.ready }
                        t={ I18n.t }
                        lang={ I18n.getLanguage() }
                        expertMode={ this.state.expertMode }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-instances') {
                return (
                    <Instances
                        key="instances"
                        socket={ this.socket }
                        lang={ I18n.getLanguage() }
                        protocol={ this.state.protocol }
                        hostname={ this.state.hostname }
                        expertMode={ this.state.expertMode }
                        t={ I18n.t }
                        configStored={ value => this.allStored(value) }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-intro') {
                return (
                    <Intro
                        key="intro"
                        protocol={ this.state.protocol }
                        hostname={ this.state.hostname }
                        showAlert={ (message, type) => this.showAlert(message, type) }
                        socket={ this.socket }
                        systemConfig={ this.state.systemConfig }
                        t={ I18n.t }
                        lang={ I18n.getLanguage() }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-logs') {
                return (
                    <Logs
                        key="logs"
                        t={ I18n.t }
                        lang={ this.state.lang }
                        socket={ this.socket }
                        ready={ this.state.ready }
                        logWorker={ this.logWorker }
                        expertMode={ this.state.expertMode }
                        currentHost={ this.state.currentHost }
                        clearErrors={ cb => this.clearLogErrors(cb) }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-files') {
                return (
                    <Files
                        key="files"
                        ready={ this.state.ready }
                        t={ I18n.t }
                        expertMode={ this.state.expertMode }
                        lang={ I18n.getLanguage() }
                        socket={ this.socket }
                    />
                );
            } else
            if (this.state.currentTab.tab === 'tab-objects') {
                return (
                    <Objects
                        key="objects"
                        t={ I18n.t }
                        themeName={ this.state.themeName }
                        expertMode={ this.state.expertMode }
                        lang={ I18n.getLanguage() }
                        socket={ this.socket }
                    />
                );
            }
        } else {
            this.handleNavigation('tab-intro');
            return null;
        }
    }

    handleAlertClose(event, reason) {
        if (reason === 'clickaway') {
          return;
        }

        this.setState({
            alert: false
        });
    }

    showAlert(message, type) {
        
        if (type !== 'error' && type !== 'warning' && type !== 'info' && type !== 'success') {
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

    logout() {
        if (window.location.port === '3000') {
            window.location = window.location.protocol + '//' + window.location.hostname + ':8081/logout?dev';
        } else {
            window.location = '/logout';
        }
    }

    handleNavigation(tab) {
        if (tab) {
            if (this.state.allStored) {

                Router.doNavigate(tab);

                this.setState({
                    currentTab: Router.getLocation()
                });
            } else {
                this.setState({
                    dataNotStoredDialog: true,
                    dataNotStoredTab: tab
                });
            }
        }

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            this.handleDrawerClose();
        }

        tab = tab || this.state.currentTab.tab || '';

        this.setTitle(tab.replace('tab-', ''));
    }

    allStored(value) {
        this.setState({
            allStored: value
        });
    };

    closeDataNotStoredDialog() {
        this.setState({
            dataNotStoredDialog: false
        });
    }

    confirmDataNotStored() {
        this.setState({
            dataNotStoredDialog: false,
            allStored: true
        }, () => {
            this.handleNavigation(this.state.dataNotStoredTab);
        });
    }

    getNavigationItems() {

        const items = [];
        const READY_TO_USE = ['tab-intro', 'tab-adapters', 'tab-instances', 'tab-logs', 'tab-files', 'tab-objects'];

        Object.keys(this.tabsInfo).forEach(name => {

            //For developing
            if (!READY_TO_USE.includes(name)) {
                return;
            }
            
            items.push(
                <DrawerItem
                    key={ name }
                    onClick={ () => this.handleNavigation(name) }
                    icon={ this.tabsInfo[name].icon }
                    text={ I18n.t(name.replace('tab-', '').ucFirst()) }
                    selected={ this.state.currentTab && this.state.currentTab.tab === name }
                    badgeContent={ name === 'tab-logs' ? this.state.logErrors : 0 }
                    badgeColor={ name === 'tab-logs' ? 'error' : '' }
                />
            );
        });

        return items;
    }

    render() {
        if (this.state.login) {
            return (
                <ThemeProvider theme={ this.state.theme }>
                    <Login t={ I18n.t } />
                </ThemeProvider>
            );
        }
        
        if (!this.state.ready) {
            return (
                <ThemeProvider theme={ this.state.theme }>
                    <Loader theme={ this.state.themeType } />
                </ThemeProvider>
            );
        }

        const { classes } = this.props;
        const small = this.props.width === 'xs' || this.props.width === 'sm';

        return (
            <ThemeProvider theme={ this.state.theme }>
                <Paper elevation={ 0 } className={ classes.root }>
                    <AppBar
                        color="default"
                        position="fixed"
                        className={ clsx(classes.appBar, {[classes.appBarShift]: !small && this.state.drawerOpen}) }
                    >
                        <Toolbar>
                            <IconButton
                                edge="start"
                                className={ clsx(classes.menuButton, !small && this.state.drawerOpen && classes.hide) }
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
                            <IconButton onClick={ () => this.toggleTheme() }>
                                { this.state.themeName === 'dark' &&
                                    <Brightness4Icon />
                                }
                                { this.state.themeName === 'blue' &&
                                    <Brightness5Icon />
                                }
                                { this.state.themeName === 'colored' &&
                                    <Brightness6Icon />
                                }
                                { this.state.themeName === 'light' &&
                                    <Brightness7Icon />
                                }
                            </IconButton>
                            {/*This will be removed later to settings, to not allow so easy to enable it*/}
                            <IconButton
                                onClick={ () => {
                                    window.localStorage.setItem('App.expertMode', !this.state.expertMode);
                                    this.setState({expertMode: !this.state.expertMode});
                                }}
                                color={ this.state.expertMode ? 'secondary' : 'default' }
                            >
                                <ExpertIcon
                                    title={ I18n.t('Toggle expert mode')}
                                    glowColor={ this.getTheme().palette.secondary.main }
                                    active={ this.state.expertMode }
                                    className={ clsx(classes.expertIcon, this.state.expertMode && classes.expertIconActive)}
                                />
                            </IconButton>
                            {/*This will be removed later to settings, to not allow so easy to edit it*/}
                            {   this.state.expertMode && 
                                <IconButton>
                                    <BuildIcon className={ classes.baseSettingsButton }/>
                                </IconButton>
                            }
                            <Typography variant="h6" className={classes.title} style={{flexGrow: 1}}>
                            </Typography>
                            <Grid container spacing={ 1 } alignItems="center" style={{width: 'initial'}}>
                                <Grid item>
                                    <Typography>admin</Typography>
                                </Grid>
                                <Grid item>
                                    <Avatar className={ clsx((this.state.themeName === 'colored' || this.state.themeName === 'blue') && classes.logoWhite) } alt="ioBroker" src="img/no-image.png" />
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                    <Drawer
                        open={ this.state.drawerOpen }
                        onClose={ () => this.handleDrawerClose() }
                        onOpen={ () => this.handleDrawerOpen() }
                        onLogout={ () => this.logout() }
                        logoutTitle={ i18n.t('Logout') }
                        isSecure={ this.socket.isSecure }
                    >
                        { this.getNavigationItems() }
                    </Drawer>
                    <Paper
                        elevation={ 0 }
                        square
                        className={
                            clsx(classes.content, {
                                [classes.contentMargin]: !small,
                                [classes.contentShift]: !small && this.state.drawerOpen
                            })
                        }
                    >
                        { this.getCurrentTab() }
                    </Paper>
                    <Snackbar open={ this.state.alert } autoHideDuration={ 6000 } onClose={ () => this.handleAlertClose() }>
                        <Alert onClose={ () => this.handleAlertClose() } variant="filled" severity={ this.state.alertType }>
                            { this.state.alertMessage }
                        </Alert>
                    </Snackbar>
                </Paper>
                <ConfirmDialog
                    onClose={ () => this.closeDataNotStoredDialog() }
                    open={ this.state.dataNotStoredDialog }
                    header={ i18n.t('Please confirm') }
                    onConfirm={ () => this.confirmDataNotStored() }
                    confirmText={ i18n.t('Ok') }
                >
                        { i18n.t('Some data are not stored. Discard?') }
                </ConfirmDialog>
                { !this.state.connected && <Connecting /> }
            </ThemeProvider>
        );
    }
}

export default withWidth()(withStyles(styles)(App));