import React from 'react';

import semver from 'semver';

import {
    Fab, Snackbar, Tooltip, Grid, LinearProgress,
    Skeleton,
} from '@mui/material';

import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Create as CreateIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
    type AdminConnection, Utils as UtilsCommon,
    type IobTheme, type Translate,
    TabContainer,
    TabContent,
} from '@iobroker/adapter-react-v5';

import type InstancesWorker from '@/Workers/InstancesWorker';
import type HostsWorker from '@/Workers/HostsWorker';
import AdminUtils from '@/AdminUtils';
import IntroCard from '@/components/Intro/IntroCard';
import EditIntroLinkDialog from '@/components/Intro/EditIntroLinkDialog';

import { type InstanceEvent } from '@/Workers/InstancesWorker';
import { type HostEvent } from '@/Workers/HostsWorker';
import NodeUpdateDialog from '@/dialogs/NodeUpdateDialog';
import IntroCardCamera from '@/components/Intro/IntroCardCamera';

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

const formatInfo: Record<string, (seconds: number, t?: Translate) => string>  = {
    Uptime:        AdminUtils.formatSeconds,
    'System uptime': AdminUtils.formatSeconds,
    RAM:           AdminUtils.formatRam,
    Speed:         AdminUtils.formatSpeed,
    'Disk size':     AdminUtils.formatBytes,
    'Disk free':     AdminUtils.formatBytes,
};

interface IntroProps {
    showAlert: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;
    socket: AdminConnection;
    t: Translate;
    lang: ioBroker.Languages;
    instancesWorker: InstancesWorker;
    hostsWorker: HostsWorker;
    hostname: string;
    protocol: string;
    port: number;
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
}

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
}

type ItemElement = ItemCamera | ItemLink;

interface IntroState {
    /** Difference between client and host time in ms */
    hostTimeDiffMap: Map<string, number>;
    hostsData: Record<string, any>;
    alive: Record<string, boolean>;
    reverseProxy: null | any[];
    hasUnsavedChanges: boolean;
    openSnackBar: boolean;
    editLinkIndex: number;
    editLink: boolean;
    link: null | Record<string, any>;
    introLinks: ItemElement[] | null;
    edit: boolean;
    deactivated: string[] | null;
    instances: null | any[];
    hosts: any;
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
    async checkBackendTime(): Promise<void> {
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
        await this.checkBackendTime();
    }

    componentWillUnmount() {
        this.getDataTimeout && clearTimeout(this.getDataTimeout);

        this.props.instancesWorker.unregisterHandler(this.getDataDelayed);
        this.props.hostsWorker.unregisterHandler(this.updateHosts);
        this.props.hostsWorker.unregisterAliveHandler(this.updateHostsAlive);
    }

    updateHostsAlive = async (events: any[]) => {
        const alive = JSON.parse(JSON.stringify(this.state.alive));
        const hostsId: string[] = [];

        // if some host deleted
        if (events.find(event => event.type === 'delete')) {
            // get all information anew
            this.getDataDelayed();
            return;
        }
        // update alive status
        events.forEach(event => {
            if ((!!alive[event.id]) !== (!!event.alive)) {
                alive[event.id] = event.alive;
                hostsId.push(event.id);
            }
        });

        if (hostsId.length) {
            const hostsData = JSON.parse(JSON.stringify(this.state.hostsData));

            const results = await Promise.all(hostsId.map(id => this.getHostData(id, alive[id])));
            results.forEach(res => hostsData[res.id] = this.preprocessHostData(res.data));
            this.setState({ alive, hostsData }, () => this.checkBackendTime());
        }
    };

    updateHosts = (events: HostEvent[]) => {
        let hostsId = [];

        // if host deleted
        if (events.find(event => !event.obj)) {
            this.getDataDelayed();
            return;
        }
        hostsId = events.map(event => event.id);

        if (hostsId.length) {
            const hostsData = JSON.parse(JSON.stringify(this.state.hostsData));

            Promise.all(hostsId.map(id => this.getHostData(id)))
                .then(results => {
                    results.forEach(res => hostsData[res.id] = this.preprocessHostData(res.data));
                    this.setState({ hostsData });
                });
        }
    };

    activateEditMode() {
        let systemConfig: ioBroker.SystemConfigObject;
        this.props.socket.getSystemConfig(true)
            .then(_systemConfig => {
                systemConfig = _systemConfig;
                return this.getInstances(true, null, systemConfig);
            })
            .then((data: Record<string, any>) => {
                const introLinks = systemConfig?.native?.introLinks ? systemConfig.native.introLinks as ItemElement[] : [];

                this.introLinksOriginal = JSON.stringify(introLinks);
                this.deactivatedOriginal  = JSON.parse(JSON.stringify(data.deactivated));

                this.setState({
                    instances: data.instances,
                    deactivated: data.deactivated,
                    edit: true,
                    introLinks,
                    hasUnsavedChanges: false,
                });
            });
    }

    deactivateEditMode() {
        if (!this.state.hasUnsavedChanges) {
            // todo: implement confirmation dialog
        }

        // restore old state
        this.setState({
            deactivated: this.deactivatedOriginal,
            introLinks: JSON.parse(this.introLinksOriginal),
            hasUnsavedChanges: false,
            edit: false,
        }, () => {
            this.deactivatedOriginal = null;
            this.introLinksOriginal = null;
        });
    }

    toggleCard(id: string, linkName: string) {
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

        const hasUnsavedChanges = JSON.stringify(deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(this.state.introLinks) !== this.introLinksOriginal;

        this.setState({ deactivated, hasUnsavedChanges });
    }

    getInstancesCards() {
        return this.state.instances?.map(instance => {
            const enabled = !this.state.deactivated?.includes(`${instance.id}_${instance.linkName}`);
            if (enabled || this.state.edit) {
                let linkText = instance.link ? instance.link.replace(/^https?:\/\//, '') : '';
                const pos = linkText.indexOf('/');
                if (pos !== -1) {
                    linkText = linkText.substring(0, pos);
                }

                // eslint-disable-next-line no-restricted-properties
                let isShowInstance = window.isFinite(instance.id.split('.').pop());
                if (isShowInstance) {
                    // try to find second instance of a same type
                    isShowInstance = !!this.state.instances?.find(inst =>
                        inst.id !== instance.id && instance.name === inst.name && instance.id.split('.')[0] === inst.id.split('.')[0]);
                }

                const hostData = this.state.hostsData ? this.state.hostsData[instance.id] : null;
                const timeDiff = this.state.hostTimeDiffMap.get(instance.id) ?? 0;
                return <IntroCard
                    key={`${instance.id}_${instance.link}`}
                    image={instance.image}
                    title={<>
                        <span style={instance.name && instance.name.length > 12 ? { fontSize: '1rem' } : undefined}>
                            {instance.name}
                        </span>
                        {isShowInstance ? <span style={styles.instanceNumber}>
                            .
                            {instance.id.split('.').pop()}
                        </span> : null}
                    </>}
                    action={{ link: instance.link, text: linkText }}
                    t={this.props.t}
                    lang={this.props.lang}
                    color={instance.color}
                    showInfo={!!instance.info}
                    edit={this.state.edit}
                    offline={hostData && hostData.alive === false}
                    warning={timeDiff > this.#THRESHOLD_TIME_DIFF_MS ? this.t('Backend time differs by %s minutes', Math.round(timeDiff / this.#ONE_MINUTE_MS).toString()) : null}
                    enabled={enabled}
                    disabled={!hostData || typeof hostData !== 'object'}
                    getHostDescriptionAll={() => this.getHostDescriptionAll(instance.id)}
                    toggleActivation={() => this.toggleCard(instance.id, instance.linkName)}
                    openSnackBarFunc={() => this.setState({ openSnackBar: true })}
                    theme={this.props.theme}
                >
                    {instance.description || this.getHostDescription(instance.id)}
                </IntroCard>;
            }
            return null;
        });
    }

    toggleLinkCard(i: number): void {
        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));

        introLinks[i].enabled = !introLinks[i].enabled;

        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(introLinks) !== this.introLinksOriginal;

        this.setState({ introLinks, hasUnsavedChanges });
    }

    getLinkCards() {
        return this.state.introLinks?.map((item, i) => {
            if (!item.enabled && !this.state.edit) {
                return null;
            }

            if (item.camera === 'custom') {
                return <IntroCardCamera
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
                    onEdit={() => this.setState({
                        editLink: true,
                        editLinkIndex: i,
                        link: JSON.parse(JSON.stringify(this.state.introLinks?.[i])),
                    })}
                    onRemove={() => {
                        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                        introLinks.splice(i, 1);
                        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== this.introLinksOriginal;
                        this.setState({ introLinks, hasUnsavedChanges });
                    }}
                    enabled={item.enabled}
                    lang={this.props.lang}
                    toggleActivation={() => this.toggleLinkCard(i)}
                    cameraUrl={item.desc}
                    theme={this.props.theme}
                />;
            }

            return <IntroCard
                key={`link${i}`}
                image={item.image}
                title={item.name}
                action={{ link: item.link, text: item.linkName }}
                t={this.props.t}
                color={item.color}
                edit={this.state.edit}
                onEdit={() => this.setState({
                    editLink: true,
                    editLinkIndex: i,
                    link: JSON.parse(JSON.stringify(this.state.introLinks?.[i])),
                })}
                onRemove={() => {
                    const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                    introLinks.splice(i, 1);
                    const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== this.introLinksOriginal;
                    this.setState({ introLinks, hasUnsavedChanges });
                }}
                enabled={item.enabled}
                lang={this.props.lang}
                toggleActivation={() => this.toggleLinkCard(i)}
                theme={this.props.theme}
            >
                {item.desc || ''}
            </IntroCard>;
        });
    }

    editLinkCard(): React.JSX.Element | null {
        if (this.state.editLink) {
            return <EditIntroLinkDialog
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
                        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== this.introLinksOriginal;

                        this.setState({
                            introLinks, editLink: false, hasUnsavedChanges, link: null,
                        });
                    } else {
                        this.setState({ editLink: false });
                    }
                }}
            />;
        }

        return null;
    }

    getButtons(): React.JSX.Element[] {
        const buttons = [];

        if (this.state.edit) {
            buttons.push(<Fab
                key="add"
                color="primary"
                sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.addButton)}
                onClick={() =>
                    this.setState({
                        editLink: true,
                        editLinkIndex: -1,
                        link: {},
                    })}
            >
                <AddIcon />
            </Fab>);

            buttons.push(<Fab
                key="save"
                color="primary"
                disabled={!this.state.hasUnsavedChanges}
                sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.saveButton)}
                onClick={() => this.saveCards()}
            >
                <CheckIcon />
            </Fab>);

            buttons.push(<Fab
                key="close"
                color="primary"
                sx={UtilsCommon.getStyle(this.props.theme, styles.button, styles.closeButton)}
                onClick={() => this.deactivateEditMode()}
            >
                <CloseIcon />
            </Fab>);
        } else {
            buttons.push(<Fab
                color="primary"
                key="edit"
                style={styles.button}
                onClick={() => this.activateEditMode()}
            >
                <CreateIcon />
            </Fab>);
        }

        return buttons;
    }

    async saveCards() {
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
            this.props.socket.setSystemConfig(systemConfig)
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

    async getHostData(hostId: string, isAlive?: boolean) {
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

        let data: Record<string, any>;
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

        Object.keys(states).forEach(id =>
            data[`_${id.split('.').pop()}`] = states[id].val);

        return { id: hostId, data };
    }

    async getHostsData(hosts: Record<string, any>[]) {
        const promises = hosts.map(obj => this.getHostData(obj._id));

        const results = await Promise.all(promises);
        const hostsData: Record<string, any> = {};
        const alive: Record<string, any> = {};
        results.forEach(res => {
            hostsData[res.id] = this.preprocessHostData(res.data);
            alive[res.id] = res.data.alive;
        });
        return { hostsData, alive };
    }

    static applyReverseProxy(webReverseProxyPath: Record<string, any>, instances: any[], instance: Record<string, any>) {
        webReverseProxyPath && webReverseProxyPath.paths.forEach((item: any) => {
            if (item.instance === instance.id) {
                instance.link = item.path;
            } else if (item.instance.startsWith('web.')) {
                // if this is a web instance, check if it is the same as the current instance
                const _obj = instances.find(o => o._id === `system.adapter.${item.instance}`);
                if (_obj?.native?.port && (instance.link || instance.url).includes(`:${_obj.native.port}`)) {
                    // replace
                    const regExp = new RegExp(`^.*:${_obj.native.port}/`);
                    if (instance.link) {
                        instance.link = instance.link.replace(regExp, item.path);
                    } else if (instance.url) {
                        instance.url = instance.url.replace(regExp, item.path);
                    }
                    console.log(instance.link || instance.url);
                }
            }
        });
    }

    addLinks(link: string, common: any, instanceId: string, instance: Record<string, any>, objects: any[], hosts: any[], instances: any[], introInstances: any[]) {
        const _urls = AdminUtils.replaceLink(link, common.name, instanceId, {
            objects,
            hostname:      this.props.hostname,
            protocol:      this.props.protocol,
            port:          this.props.port,
            adminInstance: this.props.adminInstance,
            hosts,
        }) || [];

        let webReverseProxyPath: any;
        if (this.state.reverseProxy && this.state.reverseProxy.length) {
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
            _urls.forEach((url: Record<string, any>) => {
                const lll = introInstances.find(item => item.link === url.url);
                Intro.applyReverseProxy(webReverseProxyPath, instances, url);

                if (!lll) {
                    introInstances.push({ ...instance, link: url.url, port: url.port });
                } else {
                    console.log(`Double links: "${instance.id}" and "${lll.id}"`);
                }
            });
        }
    }

    async getInstances(update: boolean | undefined, hosts: Record<string, any> | null, systemConfig: ioBroker.SystemConfigObject) {
        hosts = hosts || this.state.hosts;

        try {
            const instances = await this.props.socket.getAdapterInstances('', update);
            let deactivated: string[] = systemConfig.common.intro || [];
            if (!Array.isArray(deactivated)) {
                deactivated = Object.keys(deactivated);
                deactivated.sort();
            }
            const introInstances: any[] = [];
            const objects: Record<string, ioBroker.InstanceObject> = {};
            instances.forEach(obj => objects[obj._id] = obj);

            instances.sort((_a, _b) => {
                const a: Partial<ioBroker.InstanceCommon> = _a?.common ?? {};
                const b: Partial<ioBroker.InstanceCommon> = _b?.common ?? {};

                // @ts-expect-error need to be added to types if this can exist
                if (a.order === undefined && b.order === undefined) {
                    let aName;
                    let bName;
                    if (typeof a.name === 'object') {
                        const commonNameA: ioBroker.Translated = a.name;
                        aName = commonNameA[this.props.lang] || commonNameA.en;
                    } else {
                        aName = a.name as string || '';
                    }
                    if (typeof b.name === 'object') {
                        const commonNameB: ioBroker.Translated = b.name;
                        bName = commonNameB[this.props.lang] || commonNameB.en;
                    } else {
                        bName = b.name as string || '';
                    }
                    if (aName.toLowerCase() > bName.toLowerCase()) {
                        return 1;
                    }
                    if (aName.toLowerCase() < bName.toLowerCase()) {
                        return -1;
                    }
                    return 0;
                }
                // @ts-expect-error need to be added to types if this can exist
                if (a.order === undefined) {
                    return -1;
                }
                // @ts-expect-error need to be added to types if this can exist
                if (b.order === undefined) {
                    return 1;
                }
                // @ts-expect-error need to be added to types if this can exist
                if (a.order > b.order) {
                    return 1;
                }
                // @ts-expect-error need to be added to types if this can exist
                if (a.order < b.order) {
                    return -1;
                }
                let aName: string;
                if (typeof a.name === 'object') {
                    const commonNameA: ioBroker.Translated = a.name;
                    aName = commonNameA[this.props.lang] || commonNameA.en;
                } else {
                    aName = a.name as string || '';
                }

                let bName;
                if (typeof b.name === 'object') {
                    const commonNameB: ioBroker.Translated = b.name;
                    bName = commonNameB[this.props.lang] || commonNameB.en;
                } else {
                    bName = b.name as string || '';
                }
                if (aName.toLowerCase() > bName.toLowerCase()) {
                    return 1;
                }
                if (aName.toLowerCase() < bName.toLowerCase()) {
                    return -1;
                }
                return 0;
            });

            instances.forEach(obj => {
                if (!obj) {
                    return;
                }
                const common = obj.common || null;
                const objId = obj._id.split('.');
                const instanceId = objId.pop() as string;
                let name: string;
                if (common?.name && typeof common.name === 'object') {
                    const commonName: ioBroker.Translated = common?.name;
                    name = commonName[this.props.lang] || commonName.en;
                } else {
                    name = common?.name as string || '';
                }

                if (name === 'admin' && common.localLink === (this.props.hostname || '')) {
                    return;
                }
                if (name === 'web') {
                    return;
                }

                if (name && name !== 'vis-web-admin' && name.match(/^vis-/)) {
                    return;
                }
                if (name && name.match(/^icons-/)) {
                    return;
                }
                if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {
                    const links = common.localLinks || { _default: common.localLink ?? '' };

                    Object.keys(links).forEach(linkName => {
                        let link: { link: string; color?: string };
                        if (typeof links[linkName] === 'string') {
                            link = { link: links[linkName] as string };
                        } else {
                            link = links[linkName] as any as { link: string; color?: string };
                        }

                        const instance: { id: string; name: string; color: string; description: string; image: string } = {
                            id: obj._id.replace('system.adapter.', '') + (linkName === '_default' ? '' : ` ${linkName}`),
                            name: (common.titleLang ?
                                ((common.titleLang as ioBroker.Translated)[this.props.lang] || (common.titleLang as ioBroker.Translated).en) : common.title) + (linkName === '_default' ? '' : ` ${linkName}`),
                            color: link.color || '',
                            description: common.desc && typeof common.desc === 'object' ? (common.desc[this.props.lang] || common.desc.en) : common.desc as string || '',
                            image: common.icon ? `adapter/${name}/${common.icon}` : 'img/no-image.png',
                        };

                        // @ts-expect-error fix all the constructs here later on
                        this.addLinks(link.link, common, instanceId, instance, objects, hosts, instances, introInstances);
                    });
                }
                if (common && (common.enabled || common.onlyWWW) && name !== 'admin' && (common.welcomeScreen || common.welcomeScreenPro)) {
                    const links = [];
                    common.welcomeScreen && links.push(common.welcomeScreen);
                    common.welcomeScreenPro && links.push(common.welcomeScreenPro);

                    links.forEach(link => {
                        const instance: Record<string, any> = {
                            // @ts-expect-error fix link
                            id: `${obj._id.replace('system.adapter.', '')}/${link.link}`,
                            // @ts-expect-error fix link
                            name: link.name && typeof link.name === 'object' ? (link.name[this.props.lang] || link.name.en) : link.name || '',
                            // @ts-expect-error fix link
                            color: link.color || '',
                            description: common.desc && typeof common.desc === 'object' ? (common.desc[this.props.lang] || common.desc.en) : common.desc || '',
                            image: common.icon ? `adapter/${name}/${common.icon}` : 'img/no-image.png',
                            // @ts-expect-error fix link
                            order: link.order,
                        };

                        // @ts-expect-error fix all the constructs here later on
                        this.addLinks(`%web_protocol%://%web_bind%:%web_port%/${link.link}`, common, instanceId, instance, objects, hosts, instances, introInstances);
                    });
                }
            });

            introInstances.forEach(instance => {
                if (instance.link) {
                    instance.linkName = instance.link.replace('https://', '').replace('http://', '').replace(/^[^_]+:/, '');
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

            Object.keys(hosts as any).forEach(key => {
                const obj = hosts?.[key];
                const common = obj?.common;
                let name = common?.name;
                if (name && typeof name === 'object') {
                    name = name[this.props.lang] || name.en;
                }

                if (common) {
                    const instance = {
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
            return { instances: introInstances, deactivated };
        } catch (error) {
            console.log(error);
            return { instances: [], deactivated: [] };
        }
    }

    getHostDescription(id: string): React.JSX.Element {
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        if (hostData && hostData.alive === false) {
            return <div style={styles.hostOffline}>{this.props.t('Offline')}</div>;
        }

        let nodeUpdate: string | React.JSX.Element = '';
        let npmUpdate: string | React.JSX.Element = '';
        if (hostData) {
            try {
                if (hostData._nodeNewest && hostData['Node.js'] && semver.gt(hostData._nodeNewest, hostData['Node.js'].replace(/^v/, ''))) {
                    nodeUpdate = hostData._nodeNewest;
                }
            } catch (e) {
                // ignore
            }
            try {
                if (hostData._nodeNewest !== hostData._nodeNewestNext &&
                    hostData._nodeNewestNext &&
                    hostData['Node.js'] &&
                    hostData._nodeNewest &&
                    semver.gt(hostData._nodeNewestNext, hostData['Node.js'].replace(/^v/, '')) &&
                    semver.gt(hostData._nodeNewestNext, hostData._nodeNewest)
                ) {
                    nodeUpdate += (nodeUpdate ? ' / ' : '') + hostData._nodeNewestNext;
                }
            } catch (e) {
                // ignore
            }

            if (nodeUpdate) {
                const updateSupported = this.state.nodeUpdateSupported && hostData.Platform === 'linux';

                nodeUpdate =
                    <Tooltip title={this.props.t('Some updates available')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                        <span style={{ ...styles.nodeUpdate, display: 'inline-flex' }}>
(
                            {nodeUpdate}
)
                            {updateSupported ? <RefreshIcon style={styles.updateIcon} onClick={() => this.setState({ nodeUpdateDialog: { hostId: id, version: hostData._nodeNewestNext } })} /> : null}
                        </span>
                    </Tooltip>;
            }

            try {
                if (hostData._npmNewest && hostData.NPM && semver.gt(hostData._npmNewest, hostData.NPM)) {
                    npmUpdate = hostData._npmNewest;
                }
            } catch (e) {
                // ignore
            }
            try {
                if (hostData._npmNewest !== hostData._npmNewestNext &&
                    hostData._npmNewestNext &&
                    hostData.NPM &&
                    hostData._npmNewest &&
                    semver.gt(hostData._npmNewestNext, hostData.NPM) &&
                    semver.gt(hostData._npmNewestNext, hostData._npmNewest)
                ) {
                    npmUpdate += (npmUpdate ? ' / ' : '') + hostData._npmNewestNext;
                }
            } catch (e) {
                // ignore
            }
            if (npmUpdate) {
                npmUpdate = <Tooltip title={this.props.t('Some updates available')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                    <span style={styles.nodeUpdate}>
(
                        {npmUpdate}
)
                    </span>
                </Tooltip>;
            }
        }

        return hostData && typeof hostData === 'object' ?
            <ul style={{ textTransform: 'none' }}>
                <li>
                    <span>
                        <span style={styles.bold}>
                            {this.t('Platform')}
:
                            {' '}
                        </span>
                        {hostData.Platform || '--'}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>
                            {this.t('RAM')}
:
                            {' '}
                        </span>
                        {formatInfo.RAM(hostData.RAM)}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>
                            {this.t('Node.js')}
:
                            {' '}
                        </span>
                        <span style={nodeUpdate ? styles.updateExists : styles.updateNo}>{hostData['Node.js'] || '--'}</span>
                        {nodeUpdate}
                    </span>
                </li>
                <li>
                    <span>
                        <span style={styles.bold}>
                            {this.t('NPM')}
:
                            {' '}
                        </span>
                        <span className={npmUpdate ? styles.updateExists : styles.updateNo}>{hostData.NPM || '--'}</span>
                        {npmUpdate}
                    </span>
                </li>
            </ul>
            :
            <ul>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </ul>;
    }

    getHostDescriptionAll(id: string): { el: React.JSX.Element; text: string } {
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        return {
            el: <ul style={{ textTransform: 'none' }}>
                {hostData && typeof hostData === 'object' && Object.keys(hostData)
                    .filter(_id => !_id.startsWith('_'))
                    .map(value => <li key={value}>
                        {hostData && typeof hostData === 'object' ?
                            <span>
                                <span style={styles.bold}>
                                    {this.t(value)}
                                    :
                                    {' '}
                                </span>
                                {(formatInfo[value] ? formatInfo[value](hostData[value], this.t) : hostData[value] || '--')}
                            </span>
                            :
                            <Skeleton />}
                    </li>)}
            </ul>,

            text: hostData && typeof hostData === 'object' ? Object.keys(hostData)
                .reduce((acom, item) => `${acom}${this.t(item)}:${(formatInfo[item] ? formatInfo[item](hostData[item], this.t) : hostData[item] || '--')}\n`) : '',
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getDataDelayed = (_events?: InstanceEvent[]) => {
        this.getDataTimeout && clearTimeout(this.getDataTimeout);
        this.getDataTimeout = setTimeout(() => {
            this.getDataTimeout = undefined;
            this.getData(true);
        }, 300);
    };

    getData(update?: boolean) {
        let hosts: any;
        let systemConfig: ioBroker.SystemConfigObject;

        return this.props.socket.getSystemConfig(update)
            .then((_systemConfig: ioBroker.SystemConfigObject) => {
                systemConfig = _systemConfig;
                return this.props.socket.getCompactHosts(update);
            })
            .then((_hosts: any[]) => {
                _hosts.forEach(host => this.preprocessHostData(host));
                hosts = _hosts;
                return this.getInstances(update, hosts, systemConfig);
            })
            .then((data: any) => {
                this.setState({
                    instances: data.instances,
                    hosts,
                    deactivated: data.deactivated,
                    introLinks: systemConfig && systemConfig.native && systemConfig.native.introLinks ? systemConfig.native.introLinks : [],
                });
                // hosts data could last a long time, so show some results to user now and then get the info about hosts
                return this.getHostsData(hosts);
            })
            .then((newState: IntroState) => new Promise<void>(resolve => {
                this.setState(newState, () =>
                    resolve());
            }))
            .catch((error: any) => window.alert(`Cannot get data: ${error}`));
    }

    /**
     * Render toast if content has been copied
     */
    renderCopiedToast(): React.JSX.Element {
        return <Snackbar
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            open={this.state.openSnackBar}
            autoHideDuration={3_000}
            onClose={() => this.setState({ openSnackBar: false })}
            message={this.t('copied')}
        />;
    }

    render(): React.JSX.Element {
        if (!this.state.instances) {
            return <LinearProgress />;
        }

        return <TabContainer
            elevation={0}
            overflow="visible"
        >
            {this.renderCopiedToast()}
            {this.state.nodeUpdateDialog ? <NodeUpdateDialog onClose={() => this.setState({ nodeUpdateDialog: null })} socket={this.props.socket} {...this.state.nodeUpdateDialog} /> : null}
            <TabContent style={styles.container}>
                <Grid container spacing={2}>
                    {this.getInstancesCards()}
                    {this.getLinkCards()}
                </Grid>
                {this.getButtons()}
                {this.editLinkCard()}
            </TabContent>
        </TabContainer>;
    }

    /**
     * Preprocess host data to harmonize information
     *
     * @param hostData Host data from controller
     */
    preprocessHostData(hostData: Record<string, any>): Record<string, (string | number)> {
        if (hostData.dockerInformation?.isDocker) {
            let dockerString = hostData.dockerInformation.isOfficial ? 'official image' : 'unofficial image';

            if (hostData.dockerInformation.isOfficial) {
                dockerString +=  ` - ${hostData.dockerInformation.officialVersion}`;
            }

            hostData.Platform = `${hostData.Platform} (${dockerString})`;
        }

        delete hostData.dockerInformation;
        return hostData;
    }
}

export default Intro;
