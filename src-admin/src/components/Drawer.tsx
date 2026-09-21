import React, { Component, type RefObject, type JSX } from 'react';

import {
    alpha,
    Avatar,
    Drawer as MaterialDrawer,
    IconButton,
    List,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
    SwipeableDrawer,
    Box,
} from '@mui/material';

import {
    ChevronLeft as ChevronLeftIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    GridView as QuickAccessIcon,
    SpaceDashboard as DashboardIcon,
    Info as InfoIcon,
    Extension as AdapterIcon,
    AccountTree as ObjectsIcon,
    Article as LogsIcon,
    AutoAwesome as ScenesIcon,
    Timeline as EventsIcon,
    Group as UsersIcon,
    Dns as HostsIcon,
    Folder as FilesIcon,
    Devices as DeviceManagerIcon,
    Settings as SystemSettingsIcon,
    PersonOutlined as UserIcon,
} from '@mui/icons-material';

import {
    Utils,
    I18n,
    Icon,
    withWidth,
    IconLogout as LogoutIcon,
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
} from '@iobroker/gui-components';

import AdminUtils from '@/helpers/AdminUtils';
import { IconInstance } from '@/icons/IconInstance';
import { IconCategories } from '@/icons/IconCategories';
import type { InstancesWorker } from '@/Workers/InstancesWorker';
import type { HostsWorker, NotificationAnswer } from '@/Workers/HostsWorker';
import type { LogsWorker } from '@/Workers/LogsWorker';
import type { AdminGuiConfig, NotificationsCount } from '@/types';
import IsVisible from './IsVisible';
import DragWrapper from './DragWrapper';
import CustomDragLayer from './CustomDragLayer';
import { ContextWrapper } from './ContextWrapper';
import CustomPopper from './CustomPopper';
import DrawerItem from './DrawerItem';
import {
    CONFIG_MANAGER_PINS_CHANGED_EVENT,
    CONFIG_MANAGER_PINS_STORAGE_KEY,
    getPinnedConfigManagerInstances,
    setPinnedConfigManagerInstances,
} from '@/helpers/configManagerPins';

export const DRAWER_FULL_WIDTH = 180;
export const DRAWER_COMPACT_WIDTH = 50;
export const DRAWER_EDIT_WIDTH = 250;

/** From this many entries on, the menu gets the quick filter. A short menu is read faster than filtered */
const MIN_TABS_FOR_FILTER = 10;

function ucFirst(str: string): string {
    return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        flexShrink: 0,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        display: 'flex',
        flexDirection: 'column',
    }),
    rootFullWidth: {
        width: DRAWER_FULL_WIDTH,
    },
    rootEditWidth: {
        width: DRAWER_EDIT_WIDTH,
    },
    rootCompactWidth: {
        width: DRAWER_COMPACT_WIDTH,
    },
    paper: {
        width: 'inherit',
        overflowX: 'hidden',
        // the paper itself must not scroll - only the navigation list does, so that the header and
        // the footer stay in place
        overflowY: 'hidden',
    },
    header: (theme: IobTheme) => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 8px 0 8px',
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
        position: 'sticky',
        top: 0,
        zIndex: 2,
        // The header must not paint its own color: `background.default` differs from the drawer paper
        // (the modern themes give the sidebar its own tone) and the header then shows as a box around
        // the hide button. It cannot be transparent either - being sticky, the list would scroll
        // through it. `inherit` takes the color of the paper, which is this element's parent.
        background: 'inherit',
    }),
    headerCompact: {
        padding: 0,
    },
    // The filter button must not be squeezed by the logo beside it, which claims the whole width.
    // The drawer is only 180px wide, so the padding is smaller than the one of a normal small button
    filterButton: {
        flexShrink: 0,
        p: '4px',
    },
    // While the filter is open it is the only thing in the header, so it may take all of it
    filterField: {
        flexGrow: 1,
        '& .MuiInputBase-input': {
            fontSize: 14,
        },
    },
    headerLogout: {
        justifyContent: 'space-between',
    },
    list: {
        paddingTop: 0,
        // `1 1 auto` instead of `1 0 auto`: the list has to be allowed to shrink, otherwise it
        // pushes the footer out of the drawer instead of scrolling
        flex: '1 1 auto',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    footer: (theme: IobTheme) => ({
        flexShrink: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
    }),
    editButton: {
        // Floats in the lower right corner of the navigation and scrolls with it, so it stays next
        // to the entries it edits. It is only shown while the mouse is over the drawer.
        position: 'sticky',
        bottom: 0,
        right: 0,
        width: 'fit-content',
        marginLeft: 'auto',
        transition: 'opacity 0.5s',
    },
    userAvatar: (theme: IobTheme) => ({
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
        color: theme.palette.primary.main,
    }),
    footerButtons: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        // in the compact drawer only one button fits per row - `wrap` stacks them by itself
        p: '2px',
    },
    icon: {
        width: 20,
        height: 20,
    },
    logoSize: {
        width: 50,
        height: 50,
    },
    avatarBlock: {
        width: '100%',
        display: 'flex',
        // justifyContent: 'center',
        // marginLeft: 48,
        marginTop: 5,
        marginBottom: 5,
        // The buttons beside it keep their size, the logo gives way: without this the version label
        // would push the filter button out of the narrow drawer
        minWidth: 0,
        overflow: 'hidden',
    },
    avatarNotVisible: {
        opacity: 0,
        transition: 'opacity 0.3s',
    },
    avatarVisible: {
        opacity: 1,
    },
    styleVersion: (theme: IobTheme) => ({
        fontSize: 10,
        whiteSpace: 'nowrap',
        color: theme.palette.mode === 'dark' ? '#ffffff5e' : '#0000005e',
        alignSelf: 'center',
        ml: '5px',
    }),
};

export const STATES = {
    opened: 0,
    closed: 1,
    compact: 2,
};

const tabsInfo: Record<string, { order: number; icon?: JSX.Element; host?: boolean; instance?: number }> = {
    // `order` must stay truthy: the sort below tests `if (a.order)`, so a 0 would end up last
    'tab-overview': { order: 1, icon: <DashboardIcon />, host: true },
    'tab-intro': { order: 2, icon: <QuickAccessIcon /> },
    'tab-info': { order: 5, icon: <InfoIcon />, host: true },
    // adapter and instance share the puzzle piece on purpose: an instance is a running adapter
    'tab-adapters': { order: 10, icon: <AdapterIcon />, host: true },
    'tab-instances': { order: 15, icon: <IconInstance />, host: true },
    'tab-objects': { order: 20, icon: <ObjectsIcon /> },
    'tab-enums': { order: 25, icon: <IconCategories /> },
    'tab-devices': { order: 27, host: true },
    'tab-logs': { order: 30, icon: <LogsIcon />, host: true },
    'tab-scenes': { order: 35, icon: <ScenesIcon /> },
    'tab-events': { order: 40, icon: <EventsIcon /> },
    'tab-users': { order: 45, icon: <UsersIcon /> },
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
    'tab-hosts': { order: 100, icon: <HostsIcon /> },
    'tab-files': { order: 110, icon: <FilesIcon /> },
    'tab-devicemanager': { order: 120, icon: <DeviceManagerIcon /> },
};

export interface AdminTab {
    name: string;
    order: number;
    icon?: string | JSX.Element;
    title?: string;
    /** Title in English. The quick filter matches it too, so that the English name of a tab finds it in every language */
    englishTitle?: string;
    visible?: boolean;
    color?: string;
    supportsLoadingMessage?: boolean;
    /** Shortcut to the config manager of this instance, like `devices.0` */
    configManagerInstance?: string;
    /** The instances this tab belongs to. A singleton tab is shared by all instances of the adapter */
    adminTabInstances?: string[];
}

interface DrawerProps {
    t: Translate;
    lang: ioBroker.Languages;
    state: 0 | 1 | 2;
    adminGuiConfig: AdminGuiConfig;
    onStateChange: (state: 0 | 1 | 2) => void;
    onLogout: () => void;
    isSecure: boolean;
    currentTab: string;
    currentTabId?: string;
    themeType: ThemeType;
    socket: AdminConnection;
    versionAdmin: string;
    handleNavigation: (tab: string, subTab?: string, param?: string) => void;
    editMenuList: boolean;
    setEditMenuList: (editMenuList: boolean) => void;

    instancesWorker: InstancesWorker;
    hostsWorker: HostsWorker;
    logsWorker: LogsWorker;

    hostname: string;
    adminInstance: string;
    installed: Record<string, { version: string; ignoreVersion?: string }>;
    hosts: ioBroker.HostObject[];
    repository: Record<string, { icon: string; version: string }>;
    width: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    theme: IobTheme;
    provideTabsInfo: (tabs: AdminTab[]) => void;
    /** Opens the system settings. Sits at the bottom of the menu, not in the app bar */
    onSystemSettings: () => void;
    /** Global buttons (notifications, theme, expert mode, ...) shown at the lower edge of the menu */
    menuButtons?: JSX.Element;
    /** Logged-in user. Shown at the lower edge of the menu, it used to sit in the app bar */
    user?: {
        id: string;
        name: string;
        color?: string;
        icon?: string;
        /** Name of the leading group, shown below the user name */
        group?: string;
    } | null;
}

interface DrawerState {
    tabs: AdminTab[];
    logErrors: number;
    logWarnings: number;
    hostNotifications: NotificationsCount;
    hostsUpdate: number;
    adaptersUpdate: number;
    deviceManagerVisible: boolean;
    /** Anchor of the logout menu below the user entry */
    userMenuAnchor: HTMLElement | null;
    /** The quick filter replaces the header content while it is open */
    filterOpened: boolean;
    /** Text of the quick filter above the navigation */
    filter: string;
}

class Drawer extends Component<DrawerProps, DrawerState> {
    private logsHandlerRegistered = false;

    private readonly refEditButton: RefObject<HTMLDivElement | null> = React.createRef();

    constructor(props: DrawerProps) {
        super(props);

        this.state = {
            tabs: [],
            logErrors: 0,
            logWarnings: 0,
            hostNotifications: { other: 0, warning: 0 },
            hostsUpdate: Drawer.calculateHostUpdates(this.props.hosts, this.props.repository),
            adaptersUpdate: Drawer.calculateAdapterUpdates(this.props.installed, this.props.repository),
            deviceManagerVisible: false,
            userMenuAnchor: null,
            filterOpened: false,
            filter: '',
        };
    }

    static getDerivedStateFromProps(props: DrawerProps, state: DrawerState): Partial<DrawerState> | null {
        const hostsUpdate = Drawer.calculateHostUpdates(props.hosts, props.repository);
        const adaptersUpdate = Drawer.calculateAdapterUpdates(props.installed, props.repository);
        if (hostsUpdate !== state.hostsUpdate || adaptersUpdate !== state.adaptersUpdate) {
            return { hostsUpdate, adaptersUpdate };
        }
        return null;
    }

    static calculateHostUpdates(
        hosts: ioBroker.HostObject[],
        repository: Record<string, { icon: string; version: string }>,
    ): number {
        if (hosts && repository) {
            const jsControllerVersion = repository['js-controller']?.version || '';
            let count = 0;
            hosts.forEach(element => {
                if (AdminUtils.updateAvailable(element.common.installedVersion, jsControllerVersion)) {
                    count++;
                }
            });
            return count;
        }
        return 0;
    }

    static calculateAdapterUpdates(
        installed: Record<string, { version: string; ignoreVersion?: string }>,
        repository: Record<string, { icon: string; version: string }>,
    ): number {
        // the overview tab shows the same number, so the counting lives in AdminUtils
        return AdminUtils.countAdapterUpdates(installed, repository);
    }

    instanceChangedHandler = (): Promise<void> => this.getTabs(true);

    async isDeviceManagerVisible(): Promise<boolean> {
        const instances: Record<string, ioBroker.InstanceObject> =
            (await this.props.instancesWorker.getObjects()) || {};
        const result = Object.values(instances).find(it => it?.common?.supportedMessages?.deviceManager);
        return !!result;
    }

    componentDidMount(): void {
        this.props.instancesWorker.registerHandler(this.instanceChangedHandler, true);
        this.getTabs().catch(e => window.alert(`Cannot get tabs: ${e}`));
        window.addEventListener(CONFIG_MANAGER_PINS_CHANGED_EVENT, this.pinsChangedHandler);
        window.addEventListener('storage', this.pinsChangedHandler);

        void this.onNotificationsHandler().then((): void => {
            this.props.hostsWorker.registerNotificationHandler(this.onNotificationsHandler);

            if (!this.logsHandlerRegistered) {
                this.logsHandlerRegistered = true;
                this.props.logsWorker.registerErrorCountHandler(this.onErrorsUpdates);
                this.props.logsWorker.registerWarningCountHandler(this.onWarningsUpdates);
            }
        });
    }

    onNotificationsHandler = (): Promise<void> =>
        this.props.hostsWorker
            .getNotifications()
            .then(notifications => this.calculateWarning(notifications))
            .catch(error => window.alert(`Cannot get notifications: ${error}`));

    onErrorsUpdates = (logErrors: number): void => {
        this.setState({ logErrors });
    };

    onWarningsUpdates = (logWarnings: number): void => {
        this.setState({ logWarnings });
    };

    calculateWarning = (notifications: Record<string, NotificationAnswer | null>): void => {
        if (!notifications) {
            return;
        }

        const count: NotificationsCount = { warning: 0, other: 0 };

        Object.keys(notifications).forEach(host => {
            if (!notifications[host]?.result?.system) {
                return;
            }

            if (Object.keys(notifications[host].result.system.categories).length) {
                const obj = notifications[host].result.system.categories;

                for (const category of Object.values(obj)) {
                    Object.keys(category.instances).forEach(() =>
                        category.severity === 'alert' ? count.warning++ : count.other++,
                    );
                }
            }
        });

        this.setState({ hostNotifications: count });
    };

    componentWillUnmount(): void {
        this.props.instancesWorker.unregisterHandler(this.instanceChangedHandler);
        this.props.hostsWorker.unregisterNotificationHandler(this.onNotificationsHandler);
        window.removeEventListener(CONFIG_MANAGER_PINS_CHANGED_EVENT, this.pinsChangedHandler);
        window.removeEventListener('storage', this.pinsChangedHandler);

        if (this.logsHandlerRegistered) {
            this.logsHandlerRegistered = false;
            this.props.logsWorker.unregisterErrorCountHandler(this.onErrorsUpdates);
            this.props.logsWorker.unregisterWarningCountHandler(this.onWarningsUpdates);
        }
    }

    pinsChangedHandler = (event?: Event): void => {
        // `storage` fires for every key another browser tab writes. A null key means the whole storage
        // was cleared - then the pins are gone, too, and the menu has to be built anew
        if (event instanceof StorageEvent && event.key && event.key !== CONFIG_MANAGER_PINS_STORAGE_KEY) {
            return;
        }
        void this.getTabs();
    };

    componentDidUpdate(): void {
        if (!this.isSwipeable() && this.props.state !== STATES.opened && this.props.editMenuList) {
            setTimeout(() => this.props.setEditMenuList(false));
        }
        // The filter field has no room in the compact drawer, and a filter the user cannot see
        // would silently hide menu entries
        if (this.state.filterOpened && !this.isSwipeable() && this.props.state !== STATES.opened) {
            this.closeFilter();
        }
    }

    async getTabs(update?: boolean): Promise<void> {
        try {
            const _instances = await this.props.socket.getCompactInstances(update);
            const instances = _instances as any as Record<string, ioBroker.AdapterCommon>;
            const dynamicTabs: AdminTab[] = [];
            if (instances) {
                Object.keys(instances).forEach(id => {
                    const instance = instances[id];

                    if (!instance?.adminTab) {
                        return;
                    }

                    let tab = `tab-${id.replace('system.adapter.', '').replace(/\.\d+$/, '')}`;

                    const singleton = instance.adminTab.singleton;
                    let instNum;
                    if (!singleton) {
                        const m = id.match(/\.(\d+)$/);
                        if (m) {
                            instNum = parseInt(m[1], 10);
                            tab += `-${instNum}`;
                        }
                    }

                    const existingTab = dynamicTabs.find(item => item.name === tab);
                    if (existingTab) {
                        // a singleton tab is shown once, but it belongs to every instance of the adapter
                        existingTab.adminTabInstances?.push(id.replace('system.adapter.', ''));
                        return;
                    }

                    let title;
                    // The untranslated name is English and is kept for the quick filter
                    let englishTitle;

                    if (instance.adminTab.name) {
                        if (typeof instance.adminTab.name === 'object') {
                            englishTitle = instance.adminTab.name.en || instance.name;
                            if (instance.adminTab.name && instance.adminTab.name[this.props.lang]) {
                                title = instance.adminTab.name[this.props.lang];
                            } else if (instance.adminTab.name?.en) {
                                title = this.props.t(instance.adminTab.name.en);
                            } else {
                                title = this.props.t(instance.name);
                            }
                        } else {
                            englishTitle = instance.adminTab.name;
                            title = this.props.t(instance.adminTab.name);
                        }
                    } else {
                        englishTitle = instance.name;
                        title = this.props.t(instance.name);
                    }

                    let obj: AdminTab;
                    if (tabsInfo[tab]) {
                        obj = { name: tab, ...tabsInfo[tab] };
                    } else {
                        obj = {
                            name: tab,
                            order: instance.adminTab.order !== undefined ? instance.adminTab.order : 200,
                            icon: instance.adminTab.icon,
                            supportsLoadingMessage: (instance.adminTab as any).supportsLoadingMessage,
                        };
                    }

                    if (!obj.icon) {
                        obj.icon = `adapter/${instance.name}/${instance.icon}`;
                    } else if (
                        typeof obj.icon !== 'object' &&
                        !obj.icon.startsWith('data:image') &&
                        !obj.icon.includes('/')
                    ) {
                        obj.icon = `adapter/${instance.name}/${obj.icon}`;
                    }

                    obj.title = title;
                    obj.englishTitle = englishTitle;

                    if (!singleton) {
                        // obj.instance = instance;
                        if (instNum) {
                            obj.title += ` ${instNum}`;
                            obj.englishTitle += ` ${instNum}`;
                        }
                    }
                    obj.adminTabInstances = [id.replace('system.adapter.', '')];
                    dynamicTabs.push(obj);
                });
            }

            // `getCompactInstances` delivers neither `supportedMessages` nor the title, only the full
            // objects have them. The worker caches them, so this costs no additional request
            const instanceObjects: Record<string, ioBroker.InstanceObject> =
                (await this.props.instancesWorker.getObjects()) || {};

            const pinnedInstances = getPinnedConfigManagerInstances();
            // an instance that was deleted or that no longer offers a device manager loses its shortcut
            const pinned = pinnedInstances
                .map(instanceId => ({
                    instanceId,
                    common: instanceObjects[`system.adapter.${instanceId}`]?.common,
                }))
                .filter(item => !!item.common?.supportedMessages?.deviceManager);

            if (pinned.length !== pinnedInstances.length) {
                setPinnedConfigManagerInstances(pinned.map(item => item.instanceId));
            }

            const READY_TO_USE = [
                'tab-overview',
                'tab-intro',
                'tab-adapters',
                'tab-instances',
                'tab-logs',
                'tab-files',
                'tab-objects',
                'tab-hosts',
                'tab-users',
                'tab-enums',
            ];
            if (await this.isDeviceManagerVisible()) {
                READY_TO_USE.push('tab-devicemanager');
            }

            // DEV ONLY
            const tabNames = Object.keys(tabsInfo).filter(name => READY_TO_USE.includes(name));

            let tabs: AdminTab[] = tabNames.map(name => {
                const obj: AdminTab = { name, ...tabsInfo[name] };
                // the translation key of the built-in tabs is the English word itself
                obj.englishTitle = ucFirst(
                    name
                        .replace('tab-', '')
                        .replace('-0', '')
                        .replace(/-(\d+)$/, ' $1'),
                );
                obj.title = I18n.t(obj.englishTitle);
                obj.visible = true;
                return obj;
            });

            // add dynamic tabs
            tabs = tabs.concat(dynamicTabs);

            pinned.forEach(({ instanceId, common }, index) => {
                const adapterName = instanceId.replace(/\.\d+$/, '');
                const instanceNumber = instanceId.match(/\.(\d+)$/)?.[1];
                const titleValue = common.titleLang || common.title || common.name || adapterName;
                let title =
                    typeof titleValue === 'object'
                        ? titleValue[this.props.lang] || titleValue.en || adapterName
                        : this.props.t(titleValue);
                // the untranslated name is English and is kept for the quick filter
                let englishTitle = typeof titleValue === 'object' ? titleValue.en || adapterName : titleValue;

                // the instance number only says something if the adapter is pinned more than once
                if (
                    instanceNumber &&
                    (instanceNumber !== '0' ||
                        pinned.some(
                            item => item.instanceId !== instanceId && item.instanceId.startsWith(`${adapterName}.`),
                        ))
                ) {
                    title += ` ${instanceNumber}`;
                    englishTitle += ` ${instanceNumber}`;
                }
                // the adapter brings a tab of its own: both entries have to say where they lead
                if (dynamicTabs.some(tab => tab.adminTabInstances?.includes(instanceId))) {
                    title += ` (${this.props.t('Devicemanager')})`;
                    englishTitle += ' (Config manager)';
                }

                // the icon is kept as a string: `tabsEditSystemConfig` clones the tabs through JSON and a
                // JSX element would not survive that. The fallback icon is added while rendering
                let icon: string | undefined;
                if (common.icon) {
                    icon =
                        common.icon.startsWith('data:image') || common.icon.includes('/')
                            ? common.icon
                            : `adapter/${common.name}/${common.icon}`;
                }

                tabs.push({
                    name: `shortcut-devicemanager-${instanceId}`,
                    order: 121 + index,
                    icon,
                    title,
                    englishTitle,
                    visible: true,
                    configManagerInstance: instanceId,
                });
            });

            tabs = tabs.filter(obj => obj);
            tabs.forEach(obj => (obj.visible = true));

            tabs.sort((a, b) => {
                if (a.order && b.order) {
                    return a.order - b.order;
                }
                if (a.order) {
                    return -1;
                }
                if (b.order) {
                    return 1;
                }
                return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
            });

            // Convert
            void this.props.socket.getCompactSystemConfig().then(systemConfig => {
                const tabsVisible: { name: string; visible: boolean; color?: string }[] =
                    systemConfig.common.tabsVisible || [];

                tabs.forEach(tab => {
                    const it = tabsVisible.find(el => el.name === tab.name);
                    if (it) {
                        tab.visible = it.visible;
                        tab.color = it.color;
                    }
                });

                const map: Record<string, number> = {};
                tabsVisible.forEach((item, i) => (map[item.name] = i));

                // The tabs saved in the system config keep the position the user gave them. A tab that is not saved yet
                // (e.g., of a freshly installed adapter) follows the tab that precedes it by `order`, instead of ending up last.
                // The list is saved only when the user edits the menu, so that `adminTab.order` stays effective until then
                const saved = tabs.filter(tab => map[tab.name] !== undefined).sort((a, b) => map[a.name] - map[b.name]);
                if (saved.length) {
                    const unsaved = new Map<AdminTab | null, AdminTab[]>();
                    let previous: AdminTab | null = null;
                    tabs.forEach(tab => {
                        if (map[tab.name] !== undefined) {
                            previous = tab;
                        } else {
                            unsaved.set(previous, [...(unsaved.get(previous) || []), tab]);
                        }
                    });
                    tabs = [...(unsaved.get(null) || []), ...saved.flatMap(tab => [tab, ...(unsaved.get(tab) || [])])];
                }

                this.setState({ tabs }, () => this.props.provideTabsInfo(this.state.tabs));
            });
        } catch (error) {
            window.alert(`Cannot get instances: ${error}`);
        }
    }

    /**
     * Everything below the navigation: system settings, logout and the global buttons that used to
     * sit in the app bar. The block never scrolls - only the list above it does.
     */
    renderFooter(): JSX.Element {
        const compact = !this.isSwipeable() && this.props.state !== STATES.opened;
        const user = this.props.user;

        return (
            <Box sx={styles.footer}>
                <IsVisible
                    name="admin.appBar.systemSettings"
                    config={this.props.adminGuiConfig}
                >
                    <DrawerItem
                        theme={this.props.theme}
                        compact={compact}
                        onClick={this.props.onSystemSettings}
                        text={this.props.t('System settings')}
                        icon={<SystemSettingsIcon />}
                    />
                </IsVisible>
                {this.props.isSecure ? (
                    <>
                        {/* Shows who is logged in - that used to be in the app bar. A click does not
                            log out at once, it opens the menu below: logging out by accident while
                            aiming for the entry above it would be annoying. */}
                        <DrawerItem
                            theme={this.props.theme}
                            compact={compact}
                            onClick={e => this.setState({ userMenuAnchor: e?.currentTarget as HTMLElement })}
                            text={user?.name || this.props.t('Logout')}
                            secondaryText={user?.group}
                            color={user?.color}
                            icon={
                                // the ring makes it recognisable as a person even when the user
                                // brought no picture of their own
                                <Box sx={styles.userAvatar}>
                                    {user?.icon ? (
                                        <Icon
                                            src={user.icon}
                                            style={{ width: 22, height: 22, borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <UserIcon sx={{ fontSize: 15 }} />
                                    )}
                                </Box>
                            }
                        />
                        <Menu
                            anchorEl={this.state.userMenuAnchor}
                            open={!!this.state.userMenuAnchor}
                            onClose={() => this.setState({ userMenuAnchor: null })}
                            // centre to centre: the menu appears directly beside the user entry.
                            // Anchoring it to a corner pushed it up next to the entry above it.
                            anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                        >
                            <MenuItem
                                onClick={() => {
                                    this.setState({ userMenuAnchor: null });
                                    this.props.onLogout();
                                }}
                            >
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{this.props.t('ra_Logout')}</ListItemText>
                            </MenuItem>
                        </Menu>
                    </>
                ) : null}
                {this.props.menuButtons ? <Box sx={styles.footerButtons}>{this.props.menuButtons}</Box> : null}
            </Box>
        );
    }

    /**
     * The pencil that switches the menu into edit mode.
     *
     * It is rendered inside the navigation, not in the footer: it belongs to the entries it edits
     * and scrolls along with them. `sticky` keeps it in the lower right corner of the visible area,
     * and it only becomes visible while the mouse is over the drawer.
     */
    renderEditButton(): JSX.Element | null {
        if (this.props.adminGuiConfig.admin?.menu?.editable === false || this.props.state !== STATES.opened) {
            return null;
        }

        return (
            <Box
                sx={styles.editButton}
                style={{ opacity: this.isSwipeable() ? 1 : 0 }}
                ref={this.refEditButton}
            >
                <CustomPopper
                    size="small"
                    editMenuList={this.props.editMenuList}
                    onClick={() => this.props.setEditMenuList(!this.props.editMenuList)}
                />
            </Box>
        );
    }

    /**
     * Does the tab match the quick filter?
     *
     * Both the translated and the English name are matched: the adapters are known by their English
     * name, so `javascript` must find the entry even if the menu shows it translated.
     *
     * @param tab the menu entry to test
     * @param filter the already trimmed and lower-cased filter text
     */
    static matchesFilter(tab: AdminTab, filter: string): boolean {
        return (
            !!tab.title?.toLowerCase().includes(filter) ||
            !!tab.englishTitle?.toLowerCase().includes(filter) ||
            tab.name.replace('tab-', '').toLowerCase().includes(filter)
        );
    }

    closeFilter = (): void => this.setState({ filterOpened: false, filter: '' });

    /** Entries the navigation really shows. Invisible ones and those the GUI config hides do not count */
    countVisibleTabs(): number {
        const menuConfig = this.props.adminGuiConfig.admin?.menu as Record<string, any> | undefined;
        return this.state.tabs.filter(tab => tab.visible && menuConfig?.[tab.name] !== false).length;
    }

    /**
     * The quick filter. While it is open it replaces the logo and the buttons beside it, so that
     * the text field can use the whole width of the drawer - it is narrow enough as it is.
     */
    renderFilter(): JSX.Element {
        return (
            <TextField
                variant="standard"
                autoFocus
                sx={styles.filterField}
                value={this.state.filter}
                placeholder={this.props.t('Filter')}
                onChange={e => this.setState({ filter: e.target.value })}
                onKeyUp={e => {
                    if (e.key === 'Escape') {
                        this.closeFilter();
                    } else if (e.key === 'Enter') {
                        // Enter opens the only entry that is left - the usual way of using a quick filter
                        const filter = this.state.filter.trim().toLowerCase();
                        const found = this.state.tabs.find(
                            tab => tab.visible && filter && Drawer.matchesFilter(tab, filter),
                        );
                        if (found) {
                            this.closeFilter();
                            this.props.handleNavigation(found.name);
                        }
                    }
                }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <IconButton
                                tabIndex={-1}
                                size="small"
                                title={this.props.t('ra_Close')}
                                onClick={this.closeFilter}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        ),
                    },
                }}
            />
        );
    }

    getHeader(): JSX.Element {
        const compact = !this.isSwipeable() && this.props.state !== STATES.opened;

        return (
            <Box
                component="div"
                sx={Utils.getStyle(
                    this.props.theme,
                    styles.header,
                    this.props.state === STATES.opened && this.props.isSecure && styles.headerLogout,
                    !this.isSwipeable() && this.props.state !== STATES.opened && styles.headerCompact,
                )}
            >
                {this.state.filterOpened ? (
                    this.renderFilter()
                ) : (
                    <>
                        {this.renderLogo()}
                        {/* In the compact drawer there is no room for the button, and no room for the
                            text field it would open. A short menu does not need a filter either */}
                        {!compact && this.countVisibleTabs() > MIN_TABS_FOR_FILTER ? (
                            <Tooltip
                                title={this.props.t('Filter menu')}
                                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                            >
                                <IconButton
                                    size="small"
                                    sx={styles.filterButton}
                                    onClick={() => this.setState({ filterOpened: true })}
                                >
                                    <SearchIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        <IconButton
                            size="large"
                            onClick={() => {
                                if (this.isSwipeable() || this.props.state === STATES.compact) {
                                    this.props.onStateChange(STATES.closed as 1);
                                } else {
                                    this.props.onStateChange(STATES.compact as 2);
                                }
                            }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                    </>
                )}
            </Box>
        );
    }

    /** The ioBroker logo with the admin version beside it. Only shown in the fully opened drawer */
    renderLogo(): JSX.Element {
        const { state, handleNavigation } = this.props;

        return (
            <div
                style={{
                    ...styles.avatarBlock,
                    ...styles.avatarNotVisible,
                    ...(state === 0 ? styles.avatarVisible : { display: 'none' }),
                }}
            >
                <a
                    href="#easy"
                    onClick={event => event.preventDefault()}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                >
                    {this.props.adminGuiConfig.icon ? (
                        <div style={{ height: 50, width: 102, lineHeight: '50px' }}>
                            <img
                                src={this.props.adminGuiConfig.icon}
                                alt="logo"
                                style={{ maxWidth: '100%', maxHeight: '100%', verticalAlign: 'middle' }}
                            />
                        </div>
                    ) : (
                        <Avatar
                            onClick={() => handleNavigation('easy')}
                            style={styles.logoSize}
                            alt="ioBroker"
                            src="img/no-image.svg"
                        />
                    )}
                </a>
                {!this.props.adminGuiConfig.icon && this.props.versionAdmin && (
                    <Typography sx={styles.styleVersion}>v{this.props.versionAdmin}</Typography>
                )}
            </div>
        );
    }

    isSwipeable(): boolean {
        return this.props.width === 'xs' || this.props.width === 'sm';
    }

    tabsEditSystemConfig = async (idx?: number, isVisibility?: boolean, newColor?: string): Promise<void> => {
        const { tabs } = this.state;
        const { socket } = this.props;
        const newTabs: AdminTab[] = JSON.parse(JSON.stringify(tabs)) as AdminTab[];
        if (idx !== undefined) {
            if (isVisibility) {
                newTabs[idx].visible = !newTabs[idx].visible;
            }
            if (newColor !== undefined) {
                if (newColor === null) {
                    delete newTabs[idx].color;
                } else {
                    newTabs[idx].color = newColor;
                }
            }
        }
        const newObjCopy = await this.props.socket.getSystemConfig(true);
        newObjCopy.common.tabsVisible = newTabs.map(({ name, visible, color }) => ({
            name,
            visible: !!visible,
            color,
        }));

        if (isVisibility || newColor !== undefined) {
            this.setState({ tabs: newTabs }, () =>
                socket.setSystemConfig(newObjCopy).catch(e => window.alert(`Cannot set system config: ${e}`)),
            );
        } else {
            try {
                await socket.setSystemConfig(newObjCopy);
            } catch (e) {
                window.alert(`Cannot set system config: ${e}`);
            }
        }
    };

    /**
     * The icon of a menu entry.
     *
     * Only the built-in tabs bring a JSX icon with them: everything that is stored in the state has to stay
     * serialisable, because `tabsEditSystemConfig` clones the tabs through JSON. The shortcut of an adapter
     * that has no icon of its own therefore gets the fallback here and not in `getTabs`
     */
    static tabIcon(tab: AdminTab): JSX.Element {
        if (tabsInfo[tab.name]?.icon) {
            return tabsInfo[tab.name].icon as JSX.Element;
        }
        if (!tab.icon && tab.configManagerInstance) {
            return <DeviceManagerIcon />;
        }
        return (
            <Icon
                style={styles.icon}
                src={tab.icon}
            />
        );
    }

    getNavigationItems(): (JSX.Element | null)[] {
        const { tabs, logErrors, logWarnings } = this.state;
        const { currentTab, state, handleNavigation } = this.props;

        const hosts: Record<string, ioBroker.HostObject> = {};
        this.props.hosts.forEach(host => (hosts[host._id] = host));

        const filter = this.state.filter.trim().toLowerCase();

        // The entries that do not match are only hidden, the list itself is not filtered: the index
        // is the position in `tabs` that `tabsEditSystemConfig` writes back into the system config
        return tabs.map((tab, idx) => {
            if (!this.props.editMenuList && !tab.visible) {
                return null;
            }

            if (filter && !Drawer.matchesFilter(tab, filter)) {
                return null;
            }

            const menuConfig = this.props.adminGuiConfig.admin?.menu as Record<string, any> | undefined;
            if (menuConfig && menuConfig[tab.name] === false) {
                return null;
            }

            const selected = tab.configManagerInstance
                ? currentTab === 'tab-devicemanager' && this.props.currentTabId === tab.configManagerInstance
                : currentTab === tab.name &&
                  (tab.name !== 'tab-devicemanager' ||
                      !tabs.some(item => item.configManagerInstance === this.props.currentTabId));

            return (
                <DragWrapper
                    key={tab.name}
                    // dragging while entries are hidden would move an entry to a position the user cannot see
                    canDrag={this.props.editMenuList && !filter}
                    name={tab.name}
                    iconJSX={Drawer.tabIcon(tab)}
                    _id={tab.name}
                    selected={selected}
                    tab={tab}
                    compact={!this.isSwipeable() && state !== STATES.opened}
                    badgeContent={logErrors || logWarnings || 0}
                    badgeColor={logErrors ? 'error' : logWarnings ? 'warn' : ''}
                    tabs={tabs}
                    setEndDrag={() => this.tabsEditSystemConfig()}
                    setTabs={newObj => this.setState({ tabs: newObj as AdminTab[] })}
                >
                    <DrawerItem
                        key={tab.name}
                        editMenuList={this.props.editMenuList}
                        visible={tab.visible}
                        color={tab.color}
                        editListFunc={(isVisibility, color) =>
                            this.tabsEditSystemConfig(idx, isVisibility, color ?? undefined)
                        }
                        compact={!this.isSwipeable() && state !== STATES.opened}
                        onClick={e => {
                            // the filter has done its job as soon as the user picked an entry
                            if (this.state.filterOpened) {
                                this.closeFilter();
                            }
                            if (tab.configManagerInstance) {
                                // ctrl or shift opens the entry in a new window, as with every other entry
                                if (e?.ctrlKey || e?.shiftKey) {
                                    window
                                        .open(
                                            `${window.location.pathname}#tab-devicemanager/tab/${tab.configManagerInstance}`,
                                            tab.name,
                                        )
                                        ?.focus();
                                } else {
                                    handleNavigation('tab-devicemanager', 'tab', tab.configManagerInstance);
                                }
                            } else if (e?.ctrlKey || e?.shiftKey) {
                                void AdminUtils.getHref(
                                    this.props.instancesWorker,
                                    tab.name,
                                    this.props.hostname,
                                    hosts,
                                    this.props.adminInstance,
                                    this.props.themeType,
                                ).then(result => {
                                    if (result.href) {
                                        console.log(result.href);
                                        // Open in new tab
                                        window
                                            .open(
                                                `${window.location.protocol}//${window.location.host}/${result.href}`,
                                                tab.name,
                                            )
                                            ?.focus();
                                    } else {
                                        handleNavigation(tab.name);
                                    }
                                });
                            } else {
                                handleNavigation(tab.name);
                            }
                        }}
                        icon={Drawer.tabIcon(tab)}
                        text={tab.title || ''}
                        selected={selected}
                        badgeContent={this.badge(tab).content}
                        badgeColor={this.badge(tab).color}
                        badgeAdditionalContent={this.badge(tab)?.additionalContent}
                        badgeAdditionalColor={this.badge(tab)?.additionalColor}
                        theme={this.props.theme}
                    />
                </DragWrapper>
            );
        });
    }

    badge = (
        tab: AdminTab,
    ): {
        content: number;
        color: 'error' | 'warn' | 'primary' | '';
        additionalContent?: number;
        additionalColor?: 'error' | 'secondary' | '';
    } => {
        switch (tab.name) {
            case 'tab-logs': {
                const { logErrors, logWarnings } = this.state;
                return { content: logErrors || logWarnings || 0, color: logErrors ? 'error' : 'warn' };
            }

            case 'tab-adapters':
                return { content: this.state.adaptersUpdate || 0, color: 'primary' };

            case 'tab-hosts':
                return {
                    content: this.state.hostsUpdate || 0,
                    color: 'primary',
                    additionalContent: this.state.hostNotifications.warning + this.state.hostNotifications.other,
                    additionalColor: this.state.hostNotifications.warning > 0 ? 'error' : 'secondary',
                };

            default:
                return {
                    content: 0,
                    color: '',
                    additionalContent: 0,
                    additionalColor: '',
                };
        }
    };

    render(): JSX.Element {
        if (this.isSwipeable()) {
            return (
                <SwipeableDrawer
                    sx={Utils.getStyle(this.props.theme, styles.root, { '&.MuiSwipeableDrawer-paper': styles.paper })}
                    anchor="left"
                    open={this.props.state !== STATES.closed}
                    onClose={() => this.props.onStateChange(STATES.closed as 1)}
                    onOpen={() => this.props.onStateChange(STATES.opened as 0)}
                >
                    <CustomDragLayer theme={this.props.theme} />

                    {this.getHeader()}

                    <List style={styles.list}>
                        {this.getNavigationItems()}
                        {this.renderEditButton()}
                    </List>
                    {this.renderFooter()}
                </SwipeableDrawer>
            );
        }

        return (
            <MaterialDrawer
                sx={Utils.getStyle(
                    this.props.theme,
                    styles.root,
                    this.props.state !== STATES.opened
                        ? styles.rootCompactWidth
                        : this.props.editMenuList
                          ? styles.rootEditWidth
                          : styles.rootFullWidth,
                    {
                        '& .MuiDrawer-paper': styles.paper,
                    },
                )}
                variant="persistent"
                anchor="left"
                open={this.props.state !== STATES.closed}
                onMouseEnter={() => this.refEditButton.current && (this.refEditButton.current.style.opacity = '1')}
                onMouseLeave={() => this.refEditButton.current && (this.refEditButton.current.style.opacity = '0')}
            >
                <CustomDragLayer theme={this.props.theme} />
                {this.getHeader()}
                <List style={styles.list}>
                    {this.getNavigationItems()}
                    {this.renderEditButton()}
                </List>
                {this.renderFooter()}
            </MaterialDrawer>
        );
    }
}

Drawer.contextType = ContextWrapper;
export default withWidth()(Drawer);
