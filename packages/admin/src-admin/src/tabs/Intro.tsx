import React, { type JSX } from 'react';

import semver from 'semver';

import { Fab, Snackbar, Tooltip, Grid2, LinearProgress, Skeleton } from '@mui/material';

import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Create as CreateIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
    type AdminConnection,
    Utils as UtilsCommon,
    type IobTheme,
    type Translate,
    TabContainer,
    TabContent,
} from '@iobroker/adapter-react-v5';

import type InstancesWorker from '@/Workers/InstancesWorker';
import type HostsWorker from '@/Workers/HostsWorker';
import { type HostAliveEvent, type HostEvent } from '@/Workers/HostsWorker';
import AdminUtils from '@/helpers/AdminUtils';
import { replaceLink } from '@/helpers/utils';
import IntroCard from '@/components/Intro/IntroCard';
import EditIntroLinkDialog from '@/components/Intro/EditIntroLinkDialog';

import { type InstanceEvent } from '@/Workers/InstancesWorker';
import NodeUpdateDialog from '@/dialogs/NodeUpdateDialog';
import IntroCardCamera from '@/components/Intro/IntroCardCamera';

type OldLinkStructure = {
    link: string;
    color?: string;
    order?: number | string;
    icon?: string;
    img?: string;
    description?: ioBroker.StringOrTranslated;
    pro?: string | boolean;
    cloud?: string;
    intro?: boolean;
    name?: ioBroker.StringOrTranslated;
    localLinks?: string;
};

export type CompactHost = {
    _id: `system.host.${string}`;
    common: {
        name: string;
        icon?: string;
        color?: string;
        installedVersion?: string;
    };
    native: {
        hardware: {
            networkInterfaces?: ioBroker.HostNative['hardware']['networkInterfaces'];
        };
    };
};

const styles: Record<string, any> = {
    root: {
        width: '100%',
        height: '100%',
    },
    button: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    saveButton: (theme: IobTheme) => ({
        backgroundColor: theme.palette.success.main,
        right: 80,
        '&:hover': {
            backgroundColor: theme.palette.success.dark,
        },
    }),
    addButton: (theme: IobTheme) => ({
        backgroundColor: theme.palette.secondary.main,
        right: 144,
        '&:hover': {
            backgroundColor: theme.palette.secondary.dark,
        },
    }),
    closeButton: (theme: IobTheme) => ({
        backgroundColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
        },
    }),
    bold: {
        fontWeight: 'bold',
    },
    container: {
        overflowY: 'auto',
    },
    hostOffline: {
        color: '#bb0000',
    },
    updateExists: {
        color: '#c28700',
        marginRight: 4,
    },
    updateNo: {
        color: '#00b204',
        marginRight: 4,
    },
    nodeUpdate: {
        opacity: 0.6,
    },
    instanceNumber: {
        opacity: 0.7,
        fontSize: 16,
    },
    updateIcon: {
        cursor: 'pointer',
        fontSize: 16,
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

interface ReverseProxyItem {
    globalPath: string;
    paths: { path: string; instance: string }[];
}

interface LinkItem {
    id: string;
    link: string;
    name: string;
    description: string;
    order: number;

    color?: string;
    icon: string;
    cloud?: string;
    pro?: string;
    intro?: boolean;
    /** Is this link should be first */
    default?: boolean;
}

interface IntroInstanceItem {
    id: string;
    name?: string;
    color?: string;
    description?: string;
    image?: string;
    link?: string;
    linkName?: string;
    order?: number;
    info: string;
    port?: number;
}

interface HostData {
    alive: boolean;
    time?: number;
    _nodeNewest?: string;
    _nodeNewestNext?: string;
    'Node.js'?: string;
    _npmNewest?: string;
    NPM?: string;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    Platform?: 'win32' | 'linux' | 'darwin' | 'freebsd' | 'sunos' | string;
    RAM?: number;
    _npmNewestNext?: string;
    _versions?: Record<string, string>;
    dockerInformation?: {
        isDocker: boolean;
        isOfficial: boolean;
        officialVersion: string;
    };
    [key: string]: string | boolean | number | Record<string, string | boolean>;
}

const formatInfo: Record<string, (seconds: number, t?: Translate) => string> = {
    Uptime: AdminUtils.formatSeconds,
    'System uptime': AdminUtils.formatSeconds,
    RAM: AdminUtils.formatRam,
    Speed: AdminUtils.formatSpeed,
    'Disk size': AdminUtils.formatBytes,
    'Disk free': AdminUtils.formatBytes,
};

interface IntroProps {
    showAlert: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;
    socket: AdminConnection;
    t: Translate;
    lang: ioBroker.Languages;
    instancesWorker: InstancesWorker;
    hostsWorker: HostsWorker;
    hostname: string;
    adminInstance: string;
    theme: IobTheme;
}

interface NodeUpdateDialogInfo {
    /** The host id of the host to upgrade node.js on */
    hostId: string;
    /** The node.js version to upgrade to */
    version: string;
}

type ItemCamera = {
    camera: 'custom';
    enabled: boolean;
    link: string;
    name: string;
    /** Title of the link */
    linkName: string;
    /** Camera URL */
    desc: string;
    /** Add timestamp on the image */
    addTs: boolean;
    /** Polling interval in milliseconds */
    interval: number;
    color: string;
    /** base64 image */
    image: string;
};

type ItemLink = {
    camera: 'text';
    enabled: boolean;
    link: string;
    name: string;
    /** Title of the link */
    linkName: string;
    /** Camera URL */
    desc: string;
    color: string;
    /** base64 image */
    image: string;
};

type ItemElement = ItemCamera | ItemLink;

interface IntroState {
    /** Difference between client and host time in ms */
    hostTimeDiffMap: Map<string, number>;
    hostsData: Record<string, HostData>;
    alive: Record<string, boolean>;
    reverseProxy: null | ReverseProxyItem[];
    hasUnsavedChanges: boolean;
    openSnackBar: boolean;
    editLinkIndex: number;
    editLink: boolean;
    link: null | ItemElement;
    introLinks: ItemElement[] | null;
    edit: boolean;
    deactivated: string[] | null;
    instances: null | IntroInstanceItem[];
    hosts: CompactHost[] | null;
    /** If controller supports upgrade of nodejs */
    nodeUpdateSupported: boolean;
    /** If node update dialog should be shown */
    nodeUpdateDialog: null | NodeUpdateDialogInfo;
}

class Intro extends React.Component<IntroProps, IntroState> {
    /** If server time differs more than MS from client time, show a warning */
    #THRESHOLD_TIME_DIFF_MS = 30 * 60 * 1_000;

    #ONE_MINUTE_MS = 60 * 1_000;

    /** // e.g. /admin/; */
    private readonly currentProxyPath = window.location.pathname;

    private introLinksOriginal?: string;

    private deactivatedOriginal?: string[];

    private readonly t: Translate;

    private getDataTimeout?: ReturnType<typeof setTimeout>;

    constructor(props: IntroProps) {
        super(props);

        this.state = {
            instances: null,
            deactivated: [],
            edit: false,
            link: null,
            introLinks: [],
            editLink: false,
            editLinkIndex: -1,
            openSnackBar: false,
            hasUnsavedChanges: false,
            reverseProxy: null,
            alive: {},
            hostsData: {},
            hosts: null,
            /** Difference between client and host time in ms */
            hostTimeDiffMap: new Map(),
            nodeUpdateSupported: false,
            nodeUpdateDialog: null,
        };

        this.t = props.t;
    }

    /**
     * Compares the backend time with the frontend time
     */
    checkBackendTime(): void {
        const timeDiffMap = this.state.hostTimeDiffMap;

        for (const [hostId, hostData] of Object.entries(this.state.hostsData)) {
            const currDate = new Date();
            const diff = Math.abs(hostData.time - currDate.getTime());

            timeDiffMap.set(hostId, diff);
        }

        this.setState({ hostTimeDiffMap: timeDiffMap });
    }

    /**
     * React lifecycle hook called when component did mount
     */
    async componentDidMount(): Promise<void> {
        await this.getData();
        this.props.instancesWorker.registerHandler(this.getDataDelayed);
        this.props.hostsWorker.registerHandler(this.updateHosts);
        this.props.hostsWorker.registerAliveHandler(this.updateHostsAlive);

        const nodeUpdateSupported = await this.props.socket.checkFeatureSupported('CONTROLLER_OS_PACKAGE_UPGRADE');

        // read reverse proxy settings
        const obj = await this.props.socket.getObject(`system.adapter.${this.props.adminInstance}`);
        this.setState({ nodeUpdateSupported, reverseProxy: obj?.native?.reverseProxy || [] });
        this.checkBackendTime();
    }

    componentWillUnmount(): void {
        if (this.getDataTimeout) {
            clearTimeout(this.getDataTimeout);
            this.getDataTimeout = undefined;
        }

        this.props.instancesWorker.unregisterHandler(this.getDataDelayed);
        this.props.hostsWorker.unregisterHandler(this.updateHosts);
        this.props.hostsWorker.unregisterAliveHandler(this.updateHostsAlive);
    }

    updateHostsAlive = async (events: HostAliveEvent[]): Promise<void> => {
        const alive: Record<string, boolean> = JSON.parse(JSON.stringify(this.state.alive));
        const hostsId: string[] = [];

        // if some host deleted
        if (events.find(event => event.type === 'deleted')) {
            // get all information anew
            this.getDataDelayed();
            return;
        }
        // update alive status
        events.forEach(event => {
            if (!!alive[event.id] !== !!event.alive) {
                alive[event.id] = event.alive;
                hostsId.push(event.id);
            }
        });

        if (hostsId.length) {
            const hostsData: Record<string, HostData> = JSON.parse(JSON.stringify(this.state.hostsData));

            const results = await Promise.all(hostsId.map(id => this.getHostData(id, alive[id])));
            results.forEach(res => (hostsData[res.id] = Intro.preprocessHostData(res.data)));
            this.setState({ alive, hostsData }, () => this.checkBackendTime());
        }
    };

    updateHosts = (events: HostEvent[]): void => {
        let hostsId = [];

        // if host deleted
        if (events.find(event => !event.obj)) {
            this.getDataDelayed();
            return;
        }
        hostsId = events.map(event => event.id);

        if (hostsId.length) {
            const hostsData: Record<string, HostData> = JSON.parse(JSON.stringify(this.state.hostsData));

            void Promise.all(hostsId.map(id => this.getHostData(id))).then(results => {
                results.forEach(res => (hostsData[res.id] = Intro.preprocessHostData(res.data)));
                this.setState({ hostsData });
            });
        }
    };

    async activateEditMode(): Promise<void> {
        const systemConfig: ioBroker.SystemConfigObject = await this.props.socket.getSystemConfig(true);
        const data: { instances: IntroInstanceItem[]; deactivated: string[] } = await this.getInstances(
            true,
            null,
            systemConfig,
        );
        const introLinks = systemConfig?.native?.introLinks ? (systemConfig.native.introLinks as ItemElement[]) : [];

        this.introLinksOriginal = JSON.stringify(introLinks);
        this.deactivatedOriginal = JSON.parse(JSON.stringify(data.deactivated));

        this.setState({
            instances: data.instances,
            deactivated: data.deactivated,
            edit: true,
            introLinks,
            hasUnsavedChanges: false,
        });
    }

    deactivateEditMode(): void {
        if (!this.state.hasUnsavedChanges) {
            // todo: implement confirmation dialog
        }

        // restore old state
        this.setState(
            {
                deactivated: this.deactivatedOriginal,
                introLinks: JSON.parse(this.introLinksOriginal),
                hasUnsavedChanges: false,
                edit: false,
            },
            () => {
                this.deactivatedOriginal = null;
                this.introLinksOriginal = null;
            },
        );
    }

    toggleCard(id: string, linkName: string): void {
        if (!this.state.instances || !this.state.instances.length) {
            return;
        }

        const deactivated = JSON.parse(JSON.stringify(this.state.deactivated));

        const pos = deactivated.indexOf(`${id}_${linkName}`);

        if (pos !== -1) {
            deactivated.splice(pos, 1);
        } else {
            deactivated.push(`${id}_${linkName}`);
            deactivated.sort();
        }

        const hasUnsavedChanges =
            JSON.stringify(deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(this.state.introLinks) !== this.introLinksOriginal;

        this.setState({ deactivated, hasUnsavedChanges });
    }

    getInstancesCards(): (JSX.Element | null)[] {
        return this.state.instances?.map(instance => {
            const enabled = !this.state.deactivated?.includes(`${instance.id}_${instance.linkName}`);
            if (enabled || this.state.edit) {
                let linkText = instance.link ? instance.link.replace(/^https?:\/\//, '') : '';
                linkText = linkText.split('/')[0];

                // ignore own admin instance
                if (instance.id === this.props.adminInstance) {
                    return null;
                }

                let isShowInstance = window.isFinite(instance.id.split('.').pop() as any);
                if (isShowInstance) {
                    // try to find second instance of a same type
                    isShowInstance = !!this.state.instances?.find(
                        inst =>
                            inst.id !== instance.id &&
                            instance.name === inst.name &&
                            instance.id.split('.')[0] === inst.id.split('.')[0],
                    );
                }

                const hostData = this.state.hostsData ? this.state.hostsData[instance.id] : null;
                const timeDiff = this.state.hostTimeDiffMap.get(instance.id) ?? 0;
                return (
                    <IntroCard
                        key={`${instance.id}_${instance.link}`}
                        image={instance.image}
                        title={
                            <>
                                <span
                                    style={
                                        instance.name && instance.name.length > 12 ? { fontSize: '1rem' } : undefined
                                    }
                                >
                                    {instance.name}
                                </span>
                                {isShowInstance ? (
                                    <span style={styles.instanceNumber}>.{instance.id.split('.').pop()}</span>
                                ) : null}
                            </>
                        }
                        action={{ link: instance.link, text: linkText }}
                        t={this.props.t}
                        lang={this.props.lang}
                        color={instance.color}
                        showInfo={!!instance.info}
                        edit={this.state.edit}
                        offline={hostData && hostData.alive === false}
                        warning={
                            timeDiff > this.#THRESHOLD_TIME_DIFF_MS
                                ? this.t(
                                      'Backend time differs by %s minutes',
                                      Math.round(timeDiff / this.#ONE_MINUTE_MS).toString(),
                                  )
                                : null
                        }
                        enabled={enabled}
                        disabled={!hostData || typeof hostData !== 'object'}
                        getHostDescriptionAll={() => this.getHostDescriptionAll(instance.id)}
                        toggleActivation={() => this.toggleCard(instance.id, instance.linkName)}
                        openSnackBarFunc={() => this.setState({ openSnackBar: true })}
                        theme={this.props.theme}
                    >
                        {instance.description || this.getHostDescription(instance.id)}
                    </IntroCard>
                );
            }
            return null;
        });
    }

    toggleLinkCard(i: number): void {
        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));

        introLinks[i].enabled = !introLinks[i].enabled;

        const hasUnsavedChanges =
            JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(introLinks) !== this.introLinksOriginal;

        this.setState({ introLinks, hasUnsavedChanges });
    }

    getLinkCards(): (JSX.Element | null)[] {
        return this.state.introLinks?.map((item, i) => {
            if (!item.enabled && !this.state.edit) {
                return null;
            }

            if (item.camera === 'custom') {
                return (
                    <IntroCardCamera
                        key={`link${i}`}
                        image={item.image}
                        title={item.name}
                        action={{ link: item.link, text: item.linkName }}
                        t={this.props.t}
                        socket={this.props.socket}
                        color={item.color}
                        edit={this.state.edit}
                        interval={item.interval}
                        camera={item.camera}
                        addTs={item.addTs}
                        onEdit={() =>
                            this.setState({
                                editLink: true,
                                editLinkIndex: i,
                                link: JSON.parse(JSON.stringify(this.state.introLinks?.[i])),
                            })
                        }
                        onRemove={() => {
                            const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                            introLinks.splice(i, 1);
                            const hasUnsavedChanges =
                                JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                                JSON.stringify(introLinks) !== this.introLinksOriginal;
                            this.setState({ introLinks, hasUnsavedChanges });
                        }}
                        enabled={item.enabled}
                        lang={this.props.lang}
                        toggleActivation={() => this.toggleLinkCard(i)}
                        cameraUrl={item.desc}
                        theme={this.props.theme}
                    />
                );
            }

            return (
                <IntroCard
                    key={`link${i}`}
                    image={item.image}
                    title={item.name}
                    action={{ link: item.link, text: item.linkName }}
                    t={this.props.t}
                    color={item.color}
                    edit={this.state.edit}
                    onEdit={() =>
                        this.setState({
                            editLink: true,
                            editLinkIndex: i,
                            link: JSON.parse(JSON.stringify(this.state.introLinks?.[i])),
                        })
                    }
                    onRemove={() => {
                        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                        introLinks.splice(i, 1);
                        const hasUnsavedChanges =
                            JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== this.introLinksOriginal;
                        this.setState({ introLinks, hasUnsavedChanges });
                    }}
                    enabled={item.enabled}
                    lang={this.props.lang}
                    toggleActivation={() => this.toggleLinkCard(i)}
                    theme={this.props.theme}
                >
                    {item.desc || ''}
                </IntroCard>
            );
        });
    }

    editLinkCard(): JSX.Element | null {
        if (this.state.editLink) {
            return (
                <EditIntroLinkDialog
                    link={this.state.link}
                    socket={this.props.socket}
                    isNew={this.state.editLinkIndex === -1}
                    t={this.props.t}
                    lang={this.props.lang}
                    theme={this.props.theme}
                    onClose={link => {
                        if (link) {
                            const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                            if (this.state.editLinkIndex === -1) {
                                link.enabled = true;
                                introLinks.push(link);
                            } else {
                                link.enabled = introLinks[this.state.editLinkIndex].enabled;
                                introLinks[this.state.editLinkIndex] = link;
                            }
                            const hasUnsavedChanges =
                                JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                                JSON.stringify(introLinks) !== this.introLinksOriginal;

                            this.setState({
                                introLinks,
                                editLink: false,
                                hasUnsavedChanges,
                                link: null,
                            });
                        } else {
                            this.setState({ editLink: false });
                        }
                    }}
                />
            );
        }

        return null;
    }

    getButtons(): JSX.Element[] {
        const buttons = [];

        if (this.state.edit) {
            buttons.push(
                <Fab
                    key="add"
                    color="primary"
                    size="small"
                    sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.addButton)}
                    onClick={() =>
                        this.setState({
                            editLink: true,
                            editLinkIndex: -1,
                            link: {} as ItemCamera | ItemLink,
                        })
                    }
                >
                    <AddIcon />
                </Fab>,
            );

            buttons.push(
                <Fab
                    key="save"
                    size="small"
                    color="primary"
                    disabled={!this.state.hasUnsavedChanges}
                    sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.saveButton)}
                    onClick={() => this.saveCards()}
                >
                    <CheckIcon />
                </Fab>,
            );

            buttons.push(
                <Fab
                    key="close"
                    size="small"
                    color="primary"
                    sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.closeButton)}
                    onClick={() => this.deactivateEditMode()}
                >
                    <CloseIcon />
                </Fab>,
            );
        } else {
            buttons.push(
                <Fab
                    color="primary"
                    size="small"
                    key="edit"
                    style={styles.button}
                    onClick={() => this.activateEditMode()}
                >
                    <CreateIcon />
                </Fab>,
            );
        }

        return buttons;
    }

    async saveCards(): Promise<void> {
        const systemConfig = await this.props.socket.getSystemConfig(true);
        let changed = false;
        if (JSON.stringify(systemConfig.common.intro) !== JSON.stringify(this.state.deactivated)) {
            systemConfig.common.intro = this.state.deactivated;
            changed = true;
        }
        if (!changed && JSON.stringify(systemConfig.native.introLinks) !== JSON.stringify(this.state.introLinks)) {
            changed = true;
            systemConfig.native.introLinks = this.state.introLinks;
        }
        if (changed) {
            void this.props.socket
                .setSystemConfig(systemConfig)
                .then(() => this.props.showAlert('Updated', 'success'))
                .catch((error: any) => {
                    console.log(error);
                    this.props.showAlert(error, 'error');
                })
                .then(() => this.setState({ edit: false }));
        } else {
            this.setState({ edit: false });
        }
    }

    async getHostData(hostId: string, isAlive?: boolean): Promise<{ id: string; data: HostData }> {
        let alive;
        if (isAlive !== undefined) {
            alive = { val: isAlive };
        } else {
            try {
                alive = await this.props.socket.getState(`${hostId}.alive`);
            } catch (e) {
                console.error(`Cannot get state ${hostId}.alive: ${e}`);
                alive = { val: false };
            }
        }

        let data: HostData = { alive: false };
        if (alive?.val) {
            try {
                data = await this.props.socket.getHostInfo(hostId, false, 10000);
                if (data && typeof data === 'object' && data.alive !== false) {
                    data.alive = true;
                }
            } catch (e) {
                console.error(`Cannot get host info for ${hostId}: ${e}`);
                data = { alive: false };
            }
        } else {
            data = { alive: false };
        }

        const states = await this.props.socket.getForeignStates(`${hostId}.versions.*`);

        Object.keys(states).forEach(id => (data[`_${id.split('.').pop()}`] = states[id].val));

        return { id: hostId, data };
    }

    async getHostsData(
        hosts: CompactHost[],
    ): Promise<{ hostsData: Record<string, HostData>; alive: Record<string, boolean> }> {
        const promises = hosts.map(obj => this.getHostData(obj._id));

        const results = await Promise.all(promises);
        const hostsData: Record<string, HostData> = {};
        const alive: Record<string, boolean> = {};
        results.forEach(res => {
            hostsData[res.id] = Intro.preprocessHostData(res.data);
            alive[res.id] = res.data.alive;
        });
        return { hostsData, alive };
    }

    static applyReverseProxy(
        webReverseProxyPath: ReverseProxyItem,
        instances: Record<string, ioBroker.InstanceObject>,
        instance: IntroInstanceItem,
    ): void {
        webReverseProxyPath?.paths.forEach(item => {
            if (item.instance === instance.id) {
                instance.link = item.path;
            } else if (item.instance.startsWith('web.')) {
                // if this is a web instance, check if it is the same as the current instance
                const _obj = instances[`system.adapter.${item.instance}`];
                if (_obj?.native?.port && instance.link.includes(`:${_obj.native.port}`)) {
                    // replace
                    const regExp = new RegExp(`^.*:${_obj.native.port}/`);
                    if (instance.link) {
                        instance.link = instance.link.replace(regExp, item.path);
                    }
                    console.log(instance.link);
                }
            }
        });
    }

    addLinks(
        linkItem: LinkItem,
        common: ioBroker.InstanceCommon,
        instanceId: number,
        instances: Record<string, ioBroker.InstanceObject>,
        hosts: Record<string, ioBroker.HostObject>,
        introInstances: IntroInstanceItem[],
    ): void {
        const instance: IntroInstanceItem = {
            id: linkItem.id,
            name: linkItem.name,
            description: linkItem.description,
            color: linkItem.color,
            image: linkItem.icon,
            info: '',
        };

        const _urls: {
            url: string;
            port: number;
            instance?: string;
        }[] = replaceLink(linkItem.link, common.name, instanceId, {
            instances,
            hostname: this.props.hostname,
            adminInstance: this.props.adminInstance,
            hosts,
        });

        let webReverseProxyPath: ReverseProxyItem | null = null;
        if (this.state.reverseProxy?.length) {
            webReverseProxyPath = this.state.reverseProxy.find(item => item.globalPath === this.currentProxyPath);
        }
        if (_urls.length === 1) {
            instance.link = _urls[0].url;
            instance.port = _urls[0].port;

            Intro.applyReverseProxy(webReverseProxyPath, instances, instance);

            // if a link already exists => ignore
            const lll = introInstances.find(item => item.link === instance.link);
            if (!lll) {
                introInstances.push(instance);
            } else {
                console.log(`Double links: "${instance.id}" and "${lll.id}"`);
            }
        } else if (_urls.length > 1) {
            _urls.forEach(url => {
                const lll = introInstances.find(item => item.link === url.url);

                if (!lll) {
                    const item = { ...instance, link: url.url, port: url.port };
                    Intro.applyReverseProxy(webReverseProxyPath, instances, item);
                    introInstances.push(item);
                } else {
                    console.log(`Double links: "${instance.id}" and "${lll.id}"`);
                }
            });
        }
    }

    static getText(text: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
        if (!text) {
            return '';
        }
        if (typeof text === 'object') {
            return text[lang] || text.en || '';
        }
        return text || '';
    }

    static normalizeLinks(
        instance: ioBroker.InstanceObject,
        language: ioBroker.Languages,
        filterDuplicates?: boolean,
    ): LinkItem[] | null {
        if (
            !instance.common.localLinks &&
            !instance.common.localLink &&
            !instance.common.welcomeScreen &&
            !instance.common.welcomeScreenPro
        ) {
            return null;
        }
        const defaultLink: LinkItem = {
            id: instance._id.replace('system.adapter.', ''),
            link: '',
            name: Intro.getText(instance.common.titleLang || instance.common.title || instance.common.name, language),
            // @ts-expect-error order in common is deprecated, but could happen
            order: instance.common.order || 1000,
            intro: true,
            description: Intro.getText(instance.common.desc, language),
            icon: instance.common.icon ? `adapter/${instance.common.name}/${instance.common.icon}` : 'img/no-image.png',
        };
        let result: LinkItem[] = [];
        if (instance.common.localLink) {
            if (typeof instance.common.localLink === 'string') {
                result.push({
                    ...defaultLink,
                    link: instance.common.localLink,
                });
            } else {
                // localLink is an object
                /*
                    {
                        link: string;
                        color: string;
                        order: number;
                        icon: string;
                    }
                 */
                const compatibilityStructure: OldLinkStructure = instance.common.localLink as OldLinkStructure;
                if (compatibilityStructure.link) {
                    const item: LinkItem = {
                        ...defaultLink,
                        link: compatibilityStructure.link,
                    };
                    if (compatibilityStructure.color) {
                        item.color = compatibilityStructure.color;
                    }
                    if (
                        compatibilityStructure.order !== undefined &&
                        typeof compatibilityStructure.order === 'number'
                    ) {
                        item.order = compatibilityStructure.order;
                    }
                    if (compatibilityStructure.icon && compatibilityStructure.img) {
                        item.icon = compatibilityStructure.icon || compatibilityStructure.img;
                    }

                    result.push(item);
                } else {
                    console.warn(`Unknown localLink structure: ${JSON.stringify(instance.common.localLink)}`);
                }
            }
        }

        if (instance.common.localLinks && typeof instance.common.localLinks === 'object') {
            Object.keys(instance.common.localLinks).forEach((linkName: string) => {
                const linkItem: unknown = instance.common.localLinks[linkName];
                if (typeof linkItem === 'string') {
                    result.push({
                        ...defaultLink,
                        link: linkItem,
                    });
                } else {
                    const compatibilityStructure: OldLinkStructure = linkItem as OldLinkStructure;

                    if (compatibilityStructure.link) {
                        const item: LinkItem = {
                            ...defaultLink,
                            id:
                                instance._id.replace('system.adapter.', '') +
                                (linkName === '_default' ? '' : ` ${linkName}`),
                            link: compatibilityStructure.link,
                            name: defaultLink.name + (linkName === '_default' ? '' : ` ${linkName}`),
                        };
                        if (compatibilityStructure.color) {
                            item.color = compatibilityStructure.color;
                        }
                        if (compatibilityStructure.order !== undefined) {
                            item.order = parseInt(compatibilityStructure.order as string, 10) || 1000;
                        }
                        if (compatibilityStructure.icon && compatibilityStructure.img) {
                            item.icon = compatibilityStructure.icon || compatibilityStructure.img;
                        }
                        if (compatibilityStructure.description) {
                            item.description = Intro.getText(compatibilityStructure.description, language);
                        }
                        if (compatibilityStructure.pro !== undefined) {
                            if (typeof compatibilityStructure.pro === 'string') {
                                item.pro = compatibilityStructure.pro;
                            } else {
                                item.pro = `${instance.common.name}/index.html`;
                            }
                        }
                        if (compatibilityStructure.cloud !== undefined) {
                            item.cloud = compatibilityStructure.cloud;
                        }
                        if (compatibilityStructure.intro !== undefined) {
                            item.intro = compatibilityStructure.intro === true;
                        }

                        if (compatibilityStructure.name) {
                            item.name = Intro.getText(compatibilityStructure.name, language);
                        }
                        if (linkName === '_default') {
                            item.default = true;
                        }

                        result.push(item);
                    } else {
                        console.warn(`Unknown localLinks structure: ${JSON.stringify(linkItem)}`);
                    }
                }
            });
        }

        if (instance.common.welcomeScreen && typeof instance.common.welcomeScreen === 'object') {
            const compatibilityStructureArr: OldLinkStructure[] = Array.isArray(instance.common.welcomeScreen)
                ? (instance.common.welcomeScreen as OldLinkStructure[])
                : [instance.common.welcomeScreen as OldLinkStructure];

            compatibilityStructureArr.forEach(compatibilityStructure => {
                if (compatibilityStructure.link) {
                    const item: LinkItem = {
                        ...defaultLink,
                        id: `${instance._id.replace('system.adapter.', '')} cloud`,
                        link: `%web_protocol%://%web_bind%:%web_port%/${compatibilityStructure.link}`,
                        cloud: compatibilityStructure.link,
                    };
                    if (compatibilityStructure.color) {
                        item.color = compatibilityStructure.color;
                    }
                    if (
                        compatibilityStructure.order !== undefined &&
                        typeof compatibilityStructure.order === 'number'
                    ) {
                        item.order = compatibilityStructure.order;
                    }
                    if (compatibilityStructure.icon && compatibilityStructure.img) {
                        item.icon = compatibilityStructure.icon || compatibilityStructure.img;
                    }

                    if (compatibilityStructure.localLinks) {
                        const link: unknown = instance.common.localLinks[compatibilityStructure.localLinks];
                        if (link && typeof link === 'string') {
                            item.link = link;
                        } else if (link && typeof link === 'object' && (link as any).link) {
                            item.link = (link as any).link;
                        }
                    }

                    if (compatibilityStructure.name) {
                        item.name = Intro.getText(compatibilityStructure.name, language);
                    }

                    result.push(item);
                }
            });

            if (instance.common.welcomeScreenPro && typeof instance.common.welcomeScreenPro === 'object') {
                const _compatibilityStructureArr: OldLinkStructure[] = Array.isArray(instance.common.welcomeScreenPro)
                    ? (instance.common.welcomeScreenPro as OldLinkStructure[])
                    : [instance.common.welcomeScreenPro as OldLinkStructure];

                _compatibilityStructureArr.forEach(compatibilityStructure => {
                    if (compatibilityStructure.link) {
                        const item: LinkItem = {
                            ...defaultLink,
                            id: `${instance._id.replace('system.adapter.', '')} pro`,
                            link: `%web_protocol%://%web_bind%:%web_port%/${compatibilityStructure.link}`,
                            pro: compatibilityStructure.link,
                        };
                        if (compatibilityStructure.color) {
                            item.color = compatibilityStructure.color;
                        }
                        if (
                            compatibilityStructure.order !== undefined &&
                            typeof compatibilityStructure.order === 'number'
                        ) {
                            item.order = compatibilityStructure.order;
                        }
                        if (compatibilityStructure.icon && compatibilityStructure.img) {
                            item.icon = compatibilityStructure.icon || compatibilityStructure.img;
                        }

                        if (compatibilityStructure.localLinks) {
                            const link: unknown = instance.common.localLinks[compatibilityStructure.localLinks];
                            if (link && typeof link === 'string') {
                                item.link = link;
                            } else if (link && typeof link === 'object' && (link as any).link) {
                                item.link = (link as any).link;
                            }
                        }

                        if (compatibilityStructure.name) {
                            item.name = Intro.getText(compatibilityStructure.name, language);
                        }

                        result.push(item);
                    }
                });
            }
        }

        result.forEach(item => {
            if (
                !item.icon.startsWith('adapter/') &&
                !item.icon.startsWith('data:image/') &&
                !item.icon.startsWith('http://') &&
                !item.icon.startsWith('https://') &&
                item.icon !== 'img/no-image.png'
            ) {
                // normalize icon
                item.icon = `adapter/${instance.common.name}/${item.icon}`;
            }
        });

        if (filterDuplicates) {
            // filter all links with the same "link"
            const links: Record<string, LinkItem> = {};
            result.forEach(item => {
                if (!links[item.link]) {
                    links[item.link] = item;
                } else {
                    // merge
                    if (item.color) {
                        links[item.link].color = item.color;
                    }
                    if (item.icon) {
                        links[item.link].icon = item.icon;
                    }
                    if (item.cloud) {
                        links[item.link].cloud = item.cloud;
                    }
                    if (item.pro) {
                        links[item.link].pro = item.pro;
                    }
                    if (item.intro !== undefined) {
                        links[item.link].intro = item.intro;
                    }
                    if (item.name && typeof item.name === 'object') {
                        links[item.link].name = item.name;
                    }
                    if (item.order !== undefined) {
                        links[item.link].order = item.order;
                    }
                    if (item.default) {
                        links[item.link].default = item.default;
                    }
                }
            });
            result = Object.values(links);
        }

        result.sort((a: LinkItem, b: LinkItem) => {
            if (a.default === undefined && b.default === undefined) {
                if (a.order === undefined && b.order === undefined) {
                    return 0;
                }
                if (a.order === undefined) {
                    return -1;
                }
                if (b.order === undefined) {
                    return 1;
                }
                return a.order - b.order;
            }
            if (a.default === undefined) {
                return -1;
            }
            if (b.default === undefined) {
                return 1;
            }

            if (a.order === undefined && b.order === undefined) {
                return 0;
            }
            if (a.order === undefined) {
                return -1;
            }
            if (b.order === undefined) {
                return 1;
            }
            return a.order - b.order;
        });

        return result;
    }

    async getInstances(
        update: boolean | undefined,
        hosts: CompactHost[] | null,
        systemConfig: ioBroker.SystemConfigObject,
    ): Promise<{ instances: IntroInstanceItem[]; deactivated: string[] }> {
        hosts = hosts || this.state.hosts;

        const oHosts: Record<string, ioBroker.HostObject> = {};
        hosts.forEach(obj => (oHosts[obj._id] = obj as ioBroker.HostObject));

        try {
            const objects = await this.props.socket.getAdapterInstances('', update);
            let deactivated: string[] = systemConfig.common.intro || [];
            if (!Array.isArray(deactivated)) {
                deactivated = Object.keys(deactivated);
                deactivated.sort();
            }
            const introInstances: IntroInstanceItem[] = [];
            const instances: Record<string, ioBroker.InstanceObject> = {};
            // Array to the mapped object
            objects.forEach(obj => (instances[obj._id] = obj));

            objects.forEach(obj => {
                if (!obj) {
                    return;
                }
                const common = obj.common || null;
                const objId = obj._id.split('.');
                const instanceId: number = parseInt(objId.pop(), 10);
                let name: string;
                if (common?.name && typeof common.name === 'object') {
                    const commonName: ioBroker.Translated = common?.name;
                    name = commonName[this.props.lang] || commonName.en;
                } else {
                    name = common?.name || '';
                }

                if (name === 'admin' && common.localLink === (this.props.hostname || '')) {
                    return;
                }
                if (name === 'web') {
                    return;
                }

                if (name && name !== 'vis-web-admin' && name.match(/^vis-/) && name !== 'vis-2') {
                    return;
                }
                if (name?.match(/^icons-/)) {
                    return;
                }
                if (common && (common.enabled || common.onlyWWW)) {
                    const links = Intro.normalizeLinks(obj, this.props.lang, true);

                    if (links) {
                        links.forEach(link =>
                            this.addLinks(link, common, instanceId, instances, oHosts, introInstances),
                        );
                    }
                }
            });

            introInstances.forEach(instance => {
                if (instance.link) {
                    instance.linkName = instance.link
                        .replace('https://', '')
                        .replace('http://', '')
                        .replace(/^[^_]+:/, '');
                }
            });

            introInstances.sort((a, b) => {
                if (a.order !== undefined || b.order !== undefined) {
                    a.order = a.order === undefined ? 1000 : a.order;
                    b.order = b.order === undefined ? 1000 : b.order;
                    if (a.order < b.order) {
                        return -1;
                    }
                    if (a.order > b.order) {
                        return 1;
                    }
                }

                if (a.id > b.id) {
                    return 1;
                }
                if (a.id < b.id) {
                    return -1;
                }
                return 0;
            });

            hosts?.forEach(obj => {
                const common = obj?.common;
                let name: ioBroker.StringOrTranslated = common?.name;
                if (typeof name === 'object') {
                    if (name) {
                        name = (name as ioBroker.Translated)[this.props.lang] || (name as ioBroker.Translated).en;
                    }
                }

                if (common) {
                    const instance: IntroInstanceItem = {
                        id: obj._id,
                        name: name || '',
                        color: '',
                        image: common.icon || 'img/no-image.png',
                        info: this.t('Info'),
                        linkName: '',
                    };

                    introInstances.push(instance);
                }
            });

            const _deactivated: string[] = [];
            deactivated.forEach(id => {
                if (introInstances.find(instance => id === `${instance.id}_${instance.linkName}`)) {
                    _deactivated.push(id);
                }
            });
            deactivated = _deactivated;

            return {
                instances: introInstances,
                deactivated,
            };
        } catch (error) {
            console.log(error);
            return { instances: [], deactivated: [] };
        }
    }

    getHostDescription(id: string): JSX.Element {
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        if (hostData && hostData.alive === false) {
            return <div style={styles.hostOffline}>{this.props.t('Offline')}</div>;
        }

        let nodeUpdate: string | JSX.Element = '';
        let npmUpdate: string | JSX.Element = '';
        if (hostData) {
            try {
                if (
                    hostData._nodeNewest &&
                    hostData['Node.js'] &&
                    semver.gt(hostData._nodeNewest, hostData['Node.js'].replace(/^v/, ''))
                ) {
                    nodeUpdate = hostData._nodeNewest;
                }
            } catch {
                // ignore
            }
            try {
                if (
                    hostData._nodeNewest !== hostData._nodeNewestNext &&
                    hostData._nodeNewestNext &&
                    hostData['Node.js'] &&
                    hostData._nodeNewest &&
                    semver.gt(hostData._nodeNewestNext, hostData['Node.js'].replace(/^v/, '')) &&
                    semver.gt(hostData._nodeNewestNext, hostData._nodeNewest)
                ) {
                    nodeUpdate += (nodeUpdate ? ' / ' : '') + hostData._nodeNewestNext;
                }
            } catch {
                // ignore
            }

            if (nodeUpdate) {
                const updateSupported = this.state.nodeUpdateSupported && hostData.Platform === 'linux';

                nodeUpdate = (
                    <Tooltip
                        title={this.props.t('Some updates available')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <span style={{ ...styles.nodeUpdate, display: 'inline-flex' }}>
                            ({nodeUpdate})
                            {updateSupported ? (
                                <RefreshIcon
                                    style={styles.updateIcon}
                                    onClick={() =>
                                        this.setState({
                                            nodeUpdateDialog: { hostId: id, version: hostData._nodeNewestNext },
                                        })
                                    }
                                />
                            ) : null}
                        </span>
                    </Tooltip>
                );
            }

            try {
                if (hostData._npmNewest && hostData.NPM && semver.gt(hostData._npmNewest, hostData.NPM)) {
                    npmUpdate = hostData._npmNewest;
                }
            } catch {
                // ignore
            }
            try {
                if (
                    hostData._npmNewest !== hostData._npmNewestNext &&
                    hostData._npmNewestNext &&
                    hostData.NPM &&
                    hostData._npmNewest &&
                    semver.gt(hostData._npmNewestNext, hostData.NPM) &&
                    semver.gt(hostData._npmNewestNext, hostData._npmNewest)
                ) {
                    npmUpdate += (npmUpdate ? ' / ' : '') + hostData._npmNewestNext;
                }
            } catch {
                // ignore
            }
            if (npmUpdate) {
                npmUpdate = (
                    <Tooltip
                        title={this.props.t('Some updates available')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <span style={styles.nodeUpdate}>({npmUpdate})</span>
                    </Tooltip>
                );
            }
        }

        return hostData && typeof hostData === 'object' ? (
            <ul style={{ textTransform: 'none' }}>
                <li>
                    <span>
                        <span style={styles.bold}>{this.t('Platform')}: </span>
                        {hostData.Platform || '--'}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>{this.t('RAM')}: </span>
                        {formatInfo.RAM(hostData.RAM)}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>{this.t('Node.js')}: </span>
                        <span style={nodeUpdate ? styles.updateExists : styles.updateNo}>
                            {hostData['Node.js'] || '--'}
                        </span>
                        {nodeUpdate}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>{this.t('NPM')}: </span>
                        <span className={npmUpdate ? styles.updateExists : styles.updateNo}>
                            {hostData.NPM || '--'}
                        </span>
                        {npmUpdate}
                    </span>
                </li>
            </ul>
        ) : (
            <ul>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </ul>
        );
    }

    getHostDescriptionAll(id: string): { el: JSX.Element; text: string } {
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        return {
            el: (
                <ul style={{ textTransform: 'none' }}>
                    {hostData &&
                        typeof hostData === 'object' &&
                        Object.keys(hostData)
                            .filter(
                                _id => !_id.startsWith('_') && hostData[_id] !== null && hostData[_id] !== undefined,
                            )
                            .map(value => (
                                <li key={value}>
                                    {hostData && typeof hostData === 'object' ? (
                                        <span>
                                            <span style={styles.bold}>{this.t(value)}: </span>
                                            {formatInfo[value]
                                                ? formatInfo[value](hostData[value] as number, this.t)
                                                : (typeof hostData[value] === 'object'
                                                      ? JSON.stringify(hostData[value])
                                                      : (hostData[value] as any).toString()) || '--'}
                                        </span>
                                    ) : (
                                        <Skeleton />
                                    )}
                                </li>
                            ))}
                </ul>
            ),

            text:
                hostData && typeof hostData === 'object'
                    ? Object.keys(hostData).reduce(
                          (acom: string, item: string) =>
                              `${acom}${this.t(item)}:${formatInfo[item] ? formatInfo[item](hostData[item] as number, this.t) : (typeof hostData[item] === 'object' ? JSON.stringify(hostData[item]) : hostData[item] as string) || '--'}\n`,
                      )
                    : '',
        };
    }

    getDataDelayed = (_events?: InstanceEvent[]): void => {
        if (this.getDataTimeout) {
            clearTimeout(this.getDataTimeout);
        }
        this.getDataTimeout = setTimeout(() => {
            this.getDataTimeout = undefined;
            void this.getData(true).catch(e => console.error(`Cannot get data: ${e}`));
        }, 300);
    };

    async getData(update?: boolean): Promise<void> {
        try {
            const systemConfig: ioBroker.SystemConfigObject = await this.props.socket.getSystemConfig(update);
            const hosts: CompactHost[] = await this.props.socket.getCompactHosts(update);
            const data: { instances: IntroInstanceItem[]; deactivated: string[] } = await this.getInstances(
                update,
                hosts,
                systemConfig,
            );
            this.setState({
                instances: data.instances,
                hosts,
                deactivated: data.deactivated,
                introLinks:
                    systemConfig && systemConfig.native && systemConfig.native.introLinks
                        ? systemConfig.native.introLinks
                        : [],
            });
            // hosts data could last a long time, so show some results to user now and then get the info about hosts
            const newState: Partial<IntroState> = await this.getHostsData(hosts);
            await new Promise<void>(resolve => {
                this.setState(newState as IntroState, () => resolve());
            });
        } catch (error: any) {
            window.alert(`Cannot get data: ${error}`);
        }
    }

    /**
     * Render toast if content has been copied
     */
    renderCopiedToast(): JSX.Element {
        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={this.state.openSnackBar}
                autoHideDuration={3_000}
                onClose={() => this.setState({ openSnackBar: false })}
                message={this.t('copied')}
            />
        );
    }

    render(): JSX.Element {
        if (!this.state.instances) {
            return <LinearProgress />;
        }

        return (
            <TabContainer
                elevation={0}
                overflow="visible"
            >
                {this.renderCopiedToast()}
                {this.state.nodeUpdateDialog ? (
                    <NodeUpdateDialog
                        onClose={() => this.setState({ nodeUpdateDialog: null })}
                        socket={this.props.socket}
                        {...this.state.nodeUpdateDialog}
                    />
                ) : null}
                <TabContent style={styles.container}>
                    {/* This fragment is required here
                to split directives of Grid2 in TabContent and Grid2 directives in Intro */}
                    <>
                        <Grid2
                            container
                            spacing={2}
                        >
                            {this.getInstancesCards()}
                            {this.getLinkCards()}
                        </Grid2>
                    </>
                    {this.getButtons()}
                    {this.editLinkCard()}
                </TabContent>
            </TabContainer>
        );
    }

    /**
     * Preprocess host data to harmonize information
     *
     * @param hostData Host data from controller
     */
    static preprocessHostData(hostData: HostData): HostData {
        if (hostData.dockerInformation?.isDocker) {
            let dockerString = hostData.dockerInformation.isOfficial ? 'official image' : 'unofficial image';

            if (hostData.dockerInformation.isOfficial) {
                dockerString += ` - ${hostData.dockerInformation.officialVersion}`;
            }

            hostData.Platform = `${hostData.Platform} (${dockerString})`;
        }

        delete hostData.dockerInformation;
        return hostData;
    }
}

export default Intro;
