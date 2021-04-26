import { Component } from 'react';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Avatar, Drawer as MaterialDrawer } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';

import I18n from '@iobroker/adapter-react/i18n';

import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
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
import LogoutIcon from '@iobroker/adapter-react/icons/IconLogout';

// import CodeIcon from '@material-ui/icons/Code';
// import AcUnitIcon from '@material-ui/icons/AcUnit';
// import DeviceHubIcon from '@material-ui/icons/DeviceHub';
// import PermContactCalendarIcon from '@material-ui/icons/PermContactCalendar';
// import ShowChartIcon from '@material-ui/icons/ShowChart';
import StorageIcon from '@material-ui/icons/Storage';
import FilesIcon from '@material-ui/icons/FileCopy';

import DragWrapper from './DragWrapper';
import CustomDragLayer from './CustomDragLayer';
import { ContextWrapper } from './ContextWrapper';
import CustomPopper from './CustomPopper';
import CustomTab from '../tabs/CustomTab';
import DrawerItem from './DrawerItem';
import Adapters from '../tabs/Adapters';

export const DRAWER_FULL_WIDTH = 180;
export const DRAWER_COMPACT_WIDTH = 50;

function ucFirst(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

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
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: theme.palette.background.default
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
    },
    icon: {
        width: 20,
        height: 20,
    },
    logoWhite: {
        background: '#FFFFFF'
    },
    logoSize: {
        width: 50,
        height: 50
    },
    avatarBlock: {
        width: '100%',
        display: 'flex',
        // justifyContent: 'center',
        // marginLeft: 48,
        marginTop: 5,
        marginBottom: 5
    },
    avatarNotVisible: {
        opacity: 0,
        transition: 'opacity 0.3s'
    },
    avatarVisible: {
        opacity: 1
    },
    expand: {
        marginBottom: 5,
        marginLeft: 5
    }
});

export const STATES = {
    opened: 0,
    closed: 1,
    compact: 2
};

const tabsInfo = {
    'tab-intro': { order: 1, icon: <AppsIcon /> },
    'tab-info': { order: 5, icon: <InfoIcon />, host: true },
    'tab-adapters': { order: 10, icon: <StoreIcon />, host: true },
    'tab-instances': { order: 15, icon: <SubtitlesIcon />, host: true },
    'tab-objects': { order: 20, icon: <ViewListIcon /> },
    //'tab-hosts': { order: 20, icon: <ViewListIcon /> },
    'tab-enums': { order: 25, icon: <ArtTrackIcon /> },
    'tab-devices': { order: 27, icon: <DvrIcon />, host: true },
    'tab-logs': { order: 30, icon: <ViewHeadlineIcon />, host: true },
    'tab-scenes': { order: 35, icon: <SubscriptionsIcon /> },
    'tab-events': { order: 40, icon: <FlashOnIcon /> },
    'tab-users': { order: 45, icon: <PersonOutlineIcon /> },
    'tab-javascript': { order: 50 },
    'tab-text2command-0': { order: 55, instance: 0 },
    'tab-text2command-1': { order: 56, instance: 1 },
    'tab-text2command-2': { order: 57, instance: 2 },
    'tab-node-red-0': { order: 60, instance: 0 },
    'tab-node-red-1': { order: 61, instance: 1 },
    'tab-node-red-2': { order: 62, instance: 2 },
    'tab-fullcalendar-0': { order: 65, instance: 0 },
    'tab-fullcalendar-1': { order: 66, instance: 1 },
    'tab-fullcalendar-2': { order: 67, instance: 2 },
    'tab-echarts': { order: 70, instance: 2 },
    'tab-eventlist-0': { order: 80, instance: 0 },
    'tab-eventlist-1': { order: 81, instance: 1 },
    'tab-eventlist-2': { order: 82, instance: 2 },
    'tab-hosts': { order: 100, icon: <StorageIcon /> },
    'tab-files': { order: 110, icon: <FilesIcon /> },
};

class Drawer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tabs: [],
            editList: false,
            logErrors: 0,
            logWarnings: 0,
            hostError: 0,
            hostsUpdate: Drawer.calculateHostUpdates(this.props.hosts, this.props.repository),
            adaptersUpdate: Drawer.calculateAdapterUpdates(this.props.installed, this.props.repository),
        };

        this.instances = null;

        this.getTabs();
    }

    static getDerivedStateFromProps(props, state) {
        const hostsUpdate = Drawer.calculateHostUpdates(props.hosts, props.repository);
        const adaptersUpdate = Drawer.calculateAdapterUpdates(props.installed, props.repository);
        if (hostsUpdate !== state.hostsUpdate || adaptersUpdate !== state.adaptersUpdate) {
            return { hostsUpdate, adaptersUpdate };
        } else {
            return null;
        }
    }

    static calculateHostUpdates(hosts, repository) {
        if (hosts && repository) {
            const jsControllerVersion = repository['js-controller'].version;
            let count = 0;
            hosts.forEach(element => {
                if (Adapters.updateAvailable(element.common.installedVersion, jsControllerVersion)) {
                    count++;
                }
            });
            return count;
        } else {
            return 0;
        }
    }

    static calculateAdapterUpdates(installed, repository) {
        if (installed) {
            let count = 0;

            Object.keys(installed).forEach(element => {
                const _installed = installed[element];
                const adapter = repository[element];
                if (element !== 'js-controller' &&
                    element !== 'hosts' &&
                    _installed?.version &&
                    adapter?.version &&
                    _installed.ignoreVersion !== adapter.version &&
                    Adapters.updateAvailable(_installed.version, adapter.version)
                ) {
                    count++;
                }
            });

            return count;
        } else {
            return 0;
        }
    }

    instanceChangedHandler = changes => {
        this.getTabs();
    }

    componentDidMount() {
        this.props.instancesWorker.registerHandler(this.instanceChangedHandler);

        this.props.socket.getNotifications(this.props.currentHost)
            .then(notifications => this.getAdaptersWarning(notifications));
        if (!this.logsHandlerRegistered) {
            this.logsHandlerRegistered = true;
            this.props.logsWorker.registerErrorCountHandler(this.onErrorsUpdates);
            this.props.logsWorker.registerWarningCountHandler(this.onWarningsUpdates);
        }
    }

    onErrorsUpdates = logErrors => {
        if (this.props.currentTab !== 'tab-logs' || (this.props.currentTab === 'tab-logs' && this.state.logErrors)) {
            this.setState({ logErrors });
        }
    }

    onWarningsUpdates = logWarnings => {
        if (this.props.currentTab !== 'tab-logs' || (this.props.currentTab === 'tab-logs' && this.state.logWarnings)) {
            this.setState({ logWarnings });
        }
    }

    getAdaptersWarning = ({ result }) => {
        if (!result || !result.system) {
            return;
        }
        if (Object.keys(result.system.categories).length) {
            let count = 0;
            let obj = result.system.categories;
            Object.keys(obj).forEach(nameTab => {
                Object.keys(obj[nameTab].instances).forEach(_ => {
                    count++
                });
            });
            this.setState({ hostError: count });
        }
    }

    componentWillUnmount() {
        this.props.instancesWorker.unregisterHandler(this.instanceChangedHandler);
        if (this.logsHandlerRegistered) {
            this.logsHandlerRegistered = false;
            this.props.logsWorker.registerErrorCountHandler(this.onErrorsUpdates);
            this.props.logsWorker.registerWarningCountHandler(this.onWarningsUpdates);
        }
    }


    componentDidUpdate() {
        if (!this.isSwipeable() && this.props.state !== STATES.opened && this.state.editList) {
            this.setState({ editList: false });
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
                            obj = Object.assign({ name: tab }, tabsInfo[tab]);
                        } else {
                            obj = { name: tab, order: 200 };
                        }

                        if (!obj.icon) {
                            obj.icon = `adapter/${instance.common.name}/${instance.common.icon}`;
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

                const READY_TO_USE = ['tab-intro', 'tab-adapters', 'tab-instances', 'tab-logs', 'tab-files', 'tab-objects', 'tab-hosts', 'tab-users', 'tab-enums'];
                // DEV ONLY
                let tabs = Object.keys(tabsInfo).filter(name => READY_TO_USE.includes(name));

                tabs = tabs.map(name => {
                    const obj = Object.assign({ name }, tabsInfo[name]);
                    obj.title = I18n.t(ucFirst(name.replace('tab-', '').replace('-0', '').replace(/-(\d+)$/, ' $1')));
                    obj.visible = true;
                    return obj;
                });

                // add dynamic tabs
                tabs = tabs.concat(dynamicTabs);
                tabs = tabs.filter(obj => obj).map(obj => {
                    obj.visible = true;
                    return obj;
                });
                // Convert
                let newObj = JSON.parse(JSON.stringify(this.props.systemConfig));
                if (!newObj.common['tabsVisible'] || tabs.length !== newObj.common['tabsVisible'].length) {
                    this.setState({
                        tabs,
                    }, async () => {
                        newObj.common['tabsVisible'] = tabs.map(({ name, order, visible }) => ({ name, order, visible }));
                        try {
                            await this.props.socket.setSystemConfig(newObj).then(el => console.log('ok'));
                        } catch (e) {
                            window.alert('Cannot set system config: ' + e);
                        }
                    });
                } else {
                    let newTabs = newObj.common['tabsVisible'].map(({ name, visible }) => {
                        let tab = tabs.find(el => el.name === name);
                        tab.visible = visible;
                        return tab;
                    })
                    this.setState({
                        tabs: newTabs
                    });
                }
            });
    }

    getHeader() {
        const { classes, state, handleNavigation } = this.props;

        return <div className={clsx(
            classes.header,
            this.props.state === STATES.opened && this.props.isSecure && classes.headerLogout,
            !this.isSwipeable() && this.props.state !== STATES.opened && classes.headerCompact
        )}>
            <div className={clsx(classes.avatarBlock, state === 0 && classes.avatarVisible, classes.avatarNotVisible)}>
                <a href="/#easy" onClick={event => event.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <Avatar onClick={() => handleNavigation('easy')} className={clsx((this.props.themeName === 'colored' || this.props.themeName === 'blue') && classes.logoWhite, classes.logoSize)} alt="ioBroker" src="img/no-image.png" />
                </a>
            </div>
            <IconButton onClick={() => {
                if (this.isSwipeable() || this.props.state === STATES.compact) {
                    this.props.onStateChange(STATES.closed);
                } else {
                    this.props.onStateChange(STATES.compact)
                }
            }}>
                <ChevronLeftIcon />
            </IconButton>
        </div>;
    }

    isSwipeable() {
        return this.props.width === 'xs' || this.props.width === 'sm';
    }

    tabsEditSystemConfig = async (idx) => {
        const { tabs } = this.state;
        const { systemConfig, socket } = this.props;
        let newTabs = JSON.parse(JSON.stringify(tabs));
        if (idx !== undefined) {
            newTabs[idx].visible = !newTabs[idx].visible;
        }
        let newObjCopy = JSON.parse(JSON.stringify(systemConfig));
        newObjCopy.common['tabsVisible'] = newTabs.map(({ name, order, visible }) => ({ name, order, visible }));
        if (idx !== undefined) {
            this.setState({ tabs: newTabs }, async () => {
                try {
                    await socket.setSystemConfig(newObjCopy).then(el => console.log('ok'));
                } catch (e) {
                    window.alert('Cannot set system config: ' + e);
                }
            });
        } else {
            try {
                await socket.setSystemConfig(newObjCopy).then(el => console.log('ok'));
            } catch (e) {
                window.alert('Cannot set system config: ' + e);
            }
        }
    }

    getNavigationItems() {
        const { tabs, editList, logErrors, logWarnings } = this.state;
        const { systemConfig, currentTab, state, classes, handleNavigation } = this.props;
        if (!systemConfig) {
            return
        }
        return tabs.map((tab, idx) => {
            if (!editList && !tab.visible) {
                return null
            }
            return <DragWrapper
                key={tab.name}
                canDrag={editList}
                name={tab.name}
                iconJSX={!!tabsInfo[tab.name]?.icon ? tabsInfo[tab.name].icon : <img alt="" className={classes.icon} src={tab.icon} />}
                _id={tab.name}
                selected={currentTab === tab.name}
                tab={tab}
                compact={!this.isSwipeable() && state !== STATES.opened}
                badgeContent={tab.name === 'tab-logs' ? logErrors || logWarnings : 0}
                badgeColor={tab.name === 'tab-logs' ? logErrors ? 'error' : 'warn' : ''}
                tabs={tabs}
                setEndDrag={() => this.tabsEditSystemConfig()}
                setTabs={newObj => this.setState({ tabs: newObj })}>
                <DrawerItem
                    key={tab.name}
                    editList={editList}
                    visible={tab.visible}
                    editListFunc={() => this.tabsEditSystemConfig(idx)}
                    compact={!this.isSwipeable() && state !== STATES.opened}
                    onClick={e => {
                        if (e.ctrlKey || e.shiftKey) {
                            CustomTab.getHref(this.props.instancesWorker, tab.name, this.props.hostname, this.props.protocol, this.props.port, this.props.hosts, this.props.adminInstance)
                                .then(href => {
                                    if (href) {
                                        console.log(href);
                                        // Open in new tab
                                        window.open(`${window.location.protocol}//${window.location.host}/${href}`, tab.name).focus();
                                    } else {
                                        handleNavigation(tab.name);
                                    }
                                });
                        } else {
                            handleNavigation(tab.name);
                        }
                    }}
                    icon={!!tabsInfo[tab.name]?.icon ? tabsInfo[tab.name].icon : <img alt="" className={classes.icon} src={tab.icon} />}
                    text={tab.title}
                    selected={currentTab === tab.name}
                    badgeContent={this.badge(tab).content}
                    badgeColor={this.badge(tab).color}
                    badgeAdditionalContent={this.badge(tab)?.additionalContent}
                    badgeAdditionalColor={this.badge(tab)?.additionalColor}
                />
            </DragWrapper>;
        });
    }

    badge = tab => {
        switch (tab.name) {
            case 'tab-logs':
                const { logErrors, logWarnings } = this.state;
                return { content: logErrors || logWarnings || 0, color: (logErrors ? 'error' : 'warn') || '' };

            case 'tab-adapters':
                return { content: this.state.adaptersUpdate || 0, color: 'primary' };

            case 'tab-hosts':
                return { content: this.state.hostsUpdate || 0, color: 'primary', additionalContent: this.state.hostError, additionalColor: 'error' };

            default:
                return { content: 0, color: '', additionalContent: 0, additionalColor: '' };
        }
    }

    render() {

        const { classes } = this.props;

        if (this.isSwipeable()) {
            return <SwipeableDrawer
                className={classes.root}
                anchor="left"
                open={this.props.state !== STATES.closed}
                onClose={() => this.props.onStateChange(STATES.closed)}
                onOpen={() => this.props.onStateChange(STATES.opened)}
                classes={{ paper: classes.paper }}
            >
                <CustomDragLayer />

                {this.getHeader()}
                <List>
                    {this.getNavigationItems()}
                    {this.props.isSecure &&
                        <DrawerItem onClick={this.props.onLogout} text={this.props.t('Logout')} icon={<LogoutIcon />} />
                    }
                </List>
                {this.props.state === STATES.opened && <div style={{
                    position: 'sticky',
                    bottom: 0,
                    width: 'fit-content',
                    marginLeft: 'auto',
                    marginTop: 'auto'
                }}>
                    <CustomPopper
                        editList={this.state.editList}
                        onClick={() => this.setState({ editList: !this.state.editList })}
                    />
                </div>}
            </SwipeableDrawer>
        } else {
            return <MaterialDrawer
                className={clsx(classes.root, this.props.state !== STATES.opened ? classes.rootCompactWidth : classes.rootFullWidth)}
                variant="persistent"
                anchor="left"
                open={this.props.state !== STATES.closed}
                classes={{ paper: classes.paper }}
            >
                <CustomDragLayer />

                {this.getHeader()}
                <List className={classes.list}>
                    {this.getNavigationItems()}
                    {this.props.isSecure &&
                        <DrawerItem onClick={this.props.onLogout} text={this.props.t('Logout')} icon={<LogoutIcon />} />
                    }
                </List>
                {this.props.state === STATES.opened && <div style={{
                    position: 'sticky',
                    bottom: 0,
                    width: 'fit-content',
                    marginLeft: 'auto',
                    marginTop: 'auto'
                }}>
                    <CustomPopper
                        editList={this.state.editList}
                        onClick={() => this.setState({ editList: !this.state.editList })}
                    />
                </div>}
            </MaterialDrawer>
        }
    }
}

Drawer.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    state: PropTypes.number,
    onStateChange: PropTypes.func,
    onLogout: PropTypes.func,
    logsWorker: PropTypes.object,
    logoutTitle: PropTypes.string,
    isSecure: PropTypes.bool,
    currentTab: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
    handleNavigation: PropTypes.func,
    instancesWorker: PropTypes.object,

    hostname: PropTypes.string,
    protocol: PropTypes.string,
    port: PropTypes.number,
    adminInstance: PropTypes.string,

    installed: PropTypes.object,
    hosts: PropTypes.array,
    repository: PropTypes.object,
};

Drawer.contextType = ContextWrapper;
export default withWidth()(withStyles(styles)(Drawer));