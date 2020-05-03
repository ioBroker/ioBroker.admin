import React from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from "prop-types";
import clsx from "clsx";

import { Drawer as MaterialDrawer } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import DrawerItem from './DrawerItem';

import I18n from "@iobroker/adapter-react/i18n";

import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { FaSignOutAlt as LogoutIcon } from 'react-icons/fa';
import AppsIcon from "@material-ui/icons/Apps";
import InfoIcon from "@material-ui/icons/Info";
import StoreIcon from "@material-ui/icons/Store";
import SubtitlesIcon from "@material-ui/icons/Subtitles";
import ViewListIcon from "@material-ui/icons/ViewList";
import ArtTrackIcon from "@material-ui/icons/ArtTrack";
import DvrIcon from "@material-ui/icons/Dvr";
import ViewHeadlineIcon from "@material-ui/icons/ViewHeadline";
import SubscriptionsIcon from "@material-ui/icons/Subscriptions";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import CodeIcon from "@material-ui/icons/Code";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import DeviceHubIcon from "@material-ui/icons/DeviceHub";
import PermContactCalendarIcon from "@material-ui/icons/PermContactCalendar";
import StorageIcon from "@material-ui/icons/Storage";
import FilesIcon from "@material-ui/icons/FileCopy";
import LogWorker from "./LogsWorker";

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
        width: 'inherit'
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

class Drawer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            logErrors: 0,
            tabs: []
        };
        this.logErrorHandlerBound = this.logErrorHandler.bind(this);
    }

    componentDidMount() {
        this.props.logWorker.registerErrorCountHandler(this.logErrorHandlerBound);
    }
    componentWillUnmount () {
        this.props.logWorker.unregisterErrorCountHandler(this.logErrorHandlerBound);
    }

    logErrorHandler(logErrors) {
        if (logErrors !== this.state.logErrors) {
            this.setState({
                logErrors
            });
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

        return allTabs;
        this.setState({
            allTabs,
            tabs: []
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
        const READY_TO_USE = ['tab-intro', 'tab-adapters', 'tab-instances', 'tab-logs', 'tab-files', 'tab-objects'];

        Object.keys(tabsInfo).forEach(name => {

            // For developing
            if (!READY_TO_USE.includes(name)) {
                return;
            }

            items.push(
                <DrawerItem
                    key={ name }
                    compact={ this.props.state !== STATES.opened }
                    onClick={ () => this.props.handleNavigation(name) }
                    icon={ tabsInfo[name].icon }
                    text={ I18n.t(name.replace('tab-', '').ucFirst()) }
                    selected={ this.props.currentTab === name }
                    badgeContent={ name === 'tab-logs' ? this.props.logErrors : 0 }
                    badgeColor={ name === 'tab-logs' ? 'error' : '' }
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
                    classes={{ paper: classes.paper, }}
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
                    classes={{ paper: classes.paper, }}
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
    logWorker: PropTypes.object,
};

export default withWidth()(withStyles(styles)(Drawer));