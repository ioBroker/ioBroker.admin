import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Drawer as MaterialDrawer } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import DrawerItem from './DrawerItem';

import I18n from '@iobroker/adapter-react/i18n';

import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { FaSignOutAlt as LogoutIcon } from 'react-icons/fa';
import AppsIcon from '@material-ui/icons/Apps';
import InfoIcon from '@material-ui/icons/Info';
import StoreIcon from '@material-ui/icons/Store';
import SubtitlesIcon from '@material-ui/icons/Subtitles';
import ViewListIcon from '@material-ui/icons/ViewList';
import ArtTrackIcon from '@material-ui/icons/ArtTrack';
import DvrIcon from '@material-ui/icons/Dvr';
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline';
import SubscriptionsIcon from '@material-ui/icons/Subscriptions';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import CodeIcon from '@material-ui/icons/Code';
import AcUnitIcon from '@material-ui/icons/AcUnit';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import PermContactCalendarIcon from '@material-ui/icons/PermContactCalendar';
import StorageIcon from '@material-ui/icons/Storage';
import FilesIcon from '@material-ui/icons/FileCopy';
import HelpIcon from '@material-ui/icons/Help';

export const DRAWER_FULL_WIDTH = 180;
export const DRAWER_COMPACT_WIDTH = 50;

const styles = theme => ({
    root: {
        flexShrink: 0,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        })
    },
    rootFullWidth: {
        width: DRAWER_FULL_WIDTH,
    },
    rootCompactWidth: {
        width: DRAWER_COMPACT_WIDTH,
    },
    paper: {
        width: 'inherit',
        overflowX: 'hidden'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    headerCompact: {
        padding: 0,
    },
    headerLogout: {
        justifyContent: 'space-between'
    },
    list: {
        paddingTop: 0,
    },
    logout: {
        color: theme.palette.primary.main
    }
});

export const STATES = {
    opened: 0,
    closed: 1,
    compact: 2
};

const tabsInfo = {
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
    'tab-text2command-0':   {order: 55,   icon: <AcUnitIcon />, instance: 0},
    'tab-text2command-1':   {order: 56,   icon: <AcUnitIcon />, instance: 1},
    'tab-text2command-2':   {order: 57,   icon: <AcUnitIcon />, instance: 2},
    'tab-node-red-0':       {order: 60,   icon: <DeviceHubIcon />, instance: 0},
    'tab-node-red-1':       {order: 61,   icon: <DeviceHubIcon />, instance: 1},
    'tab-node-red-2':       {order: 62,   icon: <DeviceHubIcon />, instance: 2},
    'tab-fullcalendar-0':   {order: 65,   icon: <PermContactCalendarIcon />, instance: 0},
    'tab-fullcalendar-1':   {order: 66,   icon: <PermContactCalendarIcon />, instance: 1},
    'tab-fullcalendar-2':   {order: 67,   icon: <PermContactCalendarIcon />, instance: 2},
    'tab-hosts':            {order: 100,  icon: <StorageIcon />},
    'tab-files':            {order: 110,  icon: <FilesIcon />},
};

class Drawer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            logErrors: 0,
            tabs: []
        };

        this.logErrorHandlerBound = this.logErrorHandler.bind(this);
        this.instanceChangedHandlerBound = this.instanceChangedHandler.bind(this);

        this.instances = null;

        this.getTabs();
    }

    instanceChangedHandler(changes) {
        this.getTabs();
    }

    componentDidMount() {
        this.props.logsWorker.registerErrorCountHandler(this.logErrorHandlerBound);
        this.props.instancesWorker.registerHandler(this.instanceChangedHandlerBound);
    }

    componentWillUnmount () {
        this.props.logsWorker.unregisterErrorCountHandler(this.logErrorHandlerBound);
        this.props.instancesWorker.unregisterHandler(this.instanceChangedHandlerBound);
    }

    logErrorHandler(logErrors) {
        if (logErrors !== this.state.logErrors) {
            this.setState({
                logErrors
            });
        }
    }

    getTabs() {
        return this.props.instancesWorker.getInstances()
            .then(instances => {
                let dynamicTabs = [];

                if (instances) {
                    Object.keys(instances).forEach(id => {
                        const instance = instances[id];

                        if (!instance.common || !instance.common.adminTab) {
                            return;
                        }

                        let tab = 'tab-' + id.replace('system.adapter.', '').replace(/\.\d+$/, '');

                        const singleton = instance && instance.common && instance.common.adminTab && instance.common.adminTab.singleton;
                        let instNum;
                        if (!singleton) {
                            const m = id.match(/\.(\d+)$/);
                            if (m) {
                                instNum = parseInt(m[1], 10);
                                tab += '-' + instNum;
                            }
                        }

                        if (dynamicTabs.find(item => item.name === tab)) {
                            return;
                        }

                        let title;

                        if (instance.common.adminTab.name) {
                            if (typeof instance.common.adminTab.name === 'object') {
                                if (instance.common.adminTab.name[this.props.lang]) {
                                    title = instance.common.adminTab.name[this.props.lang];
                                } else if (instance.common.adminTab.name.en) {
                                    title = this.props.t(instance.common.adminTab.name.en);
                                } else {
                                    title = this.props.t(instance.common.name);
                                }
                            } else {
                                title = this.props.t(instance.common.adminTab.name);
                            }
                        } else {
                            title = this.props.t(instance.common.name);
                        }


                        let obj;
                        if (tabsInfo[tab]) {
                            obj = Object.assign({name: tab}, tabsInfo[tab]);
                        } else {
                            obj = {name: tab, order: 200, icon: <HelpIcon />};
                        }

                        obj.title = title;

                        if (!singleton) {
                            obj.instance = instance;
                            if (instNum) {
                                obj.title += ' ' + instNum;
                            }
                        }
                        dynamicTabs.push(obj);
                    });
                }

                const READY_TO_USE = ['tab-intro', 'tab-adapters', 'tab-instances', 'tab-logs', 'tab-files', 'tab-objects'];
                // DEV ONLY
                let tabs = Object.keys(tabsInfo).filter(name => READY_TO_USE.includes(name));

                tabs = tabs.map(name => {
                    const obj = Object.assign({name}, tabsInfo[name]);
                    obj.title = I18n.t(name.replace('tab-', '').replace('-0', '').replace(/-(\d+)$/, ' $1').ucFirst());
                    return obj;
                });

                // add dynamic tabs
                tabs = tabs.concat(dynamicTabs);

                // tabs ith order first, then by name
                tabs.sort((a, b) => {
                    if (a.order && b.order) {
                        return a.order > b.order ? 1 : (a.order < b.order ? -1 : 0);
                    } else if (a.order) {
                        return 1;
                    } else if (b.order) {
                        return -1;
                    } else {
                        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0);
                    }
                });

                // Convert
                this.setState({
                    tabs,
                });
            });
    }

    getHeader() {

        const { classes } = this.props;

        return (
            <div className={ clsx(
                classes.header,
                this.props.state === STATES.opened && this.props.isSecure && classes.headerLogout,
                this.props.state !== STATES.opened && classes.headerCompact
            ) }>
                { this.props.isSecure &&
                    <IconButton title={ this.props.logoutTitle } onClick={ this.props.onLogout }>
                        <LogoutIcon className={ classes.logout }/>
                    </IconButton>
                }
                <IconButton onClick={ () => {
                    if (this.props.state === STATES.compact) {
                        this.props.onStateChange(STATES.closed);
                    } else {
                        this.props.onStateChange(STATES.compact)
                    }
                } }>
                    <ChevronLeftIcon />
                </IconButton>
            </div>
        );
    }

    getNavigationItems() {
        const items = [];

        this.state.tabs.forEach(tab => {
            items.push(
                <DrawerItem
                    key={ tab.name }
                    compact={ this.props.state !== STATES.opened }
                    onClick={ () => this.props.handleNavigation(tab.name) }
                    icon={ tab.icon }
                    text={ tab.title }
                    selected={ this.props.currentTab === tab.name }
                    badgeContent={ tab.name === 'tab-logs' ? this.props.logErrors : 0 }
                    badgeColor={ tab.name === 'tab-logs' ? 'error' : '' }
                />
            );
        });

        return items;
    }

    render() {

        const { classes } = this.props;

        if (this.props.width === 'xs' || this.props.width === 'sm') {
            return (
                <SwipeableDrawer
                    className={ classes.root }
                    anchor="left"
                    open={ this.props.state !== STATES.closed }
                    onClose={ () => this.props.onStateChange(STATES.closed) }
                    onOpen={ () => this.props.onStateChange(STATES.opened) }
                    classes={{ paper: classes.paper }}
                >
                    { this.getHeader() }
                    <List>
                        { this.getNavigationItems() }
                    </List>
                </SwipeableDrawer>
            );
        } else {
            return (
                <MaterialDrawer
                    className={ clsx(classes.root, this.props.state !== STATES.opened ? classes.rootCompactWidth : classes.rootFullWidth) }
                    variant="persistent"
                    anchor="left"
                    open={ this.props.state !== STATES.closed }
                    classes={{ paper: classes.paper }}
                >
                    { this.getHeader() }
                    <List className={ classes.list }>
                        { this.getNavigationItems() }
                    </List>
                </MaterialDrawer>
            );
        }
    }
}

Drawer.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    state: PropTypes.number,
    onStateChange: PropTypes.func,
    onLogout: PropTypes.func,
    logoutTitle: PropTypes.string,
    isSecure: PropTypes.bool,
    currentTab: PropTypes.string,
    socket: PropTypes.object,
    currentHost: PropTypes.string,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
    handleNavigation: PropTypes.func,
    logsWorker: PropTypes.object,
    instancesWorker: PropTypes.object,
};

export default withWidth()(withStyles(styles)(Drawer));