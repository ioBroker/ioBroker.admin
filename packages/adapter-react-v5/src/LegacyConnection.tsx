/**
 * Copyright 2020-2024, Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import type { IoBJson } from '@iobroker/types/build/config';

declare global {
    interface Window {
        adapterName: undefined | string;
        socketUrl: undefined | string;
        registerSocketOnLoad: (func: () => void) => void;
        vendorPrefix: undefined | string;
        io: any;
        iob: any;
    }
}

export type Severity = 'info' | 'notify' | 'alert';

type DockerInformation =
    | {
          /** If it is a Docker installation */
          isDocker: boolean;
          /** If it is the official Docker image */
          isOfficial: true;
          /** Semver string for official Docker image */
          officialVersion: string;
      }
    | {
          /** If it is a Docker installation */
          isDocker: boolean;
          /** If it is the official Docker image */
          isOfficial: false;
      };
export interface HostInfo {
    /** Converted OS for human readability */
    Platform: NodeJS.Platform | 'docker' | 'Windows' | 'OSX';
    /** The underlying OS */
    os: NodeJS.Platform;
    /** Information about the docker installation */
    dockerInformation?: DockerInformation;
    /** Host architecture */
    Architecture: string;
    /** Number of CPUs */
    CPUs: number | null;
    /** CPU speed */
    Speed: number | null;
    /** CPU model */
    Model: string | null;
    /** Total RAM of host */
    RAM: number;
    /** System uptime in seconds */
    'System uptime': number;
    /** Node.JS version */
    'Node.js': string;
    /** Current time to compare to local time */
    time: number;
    /** Timezone offset to compare to local time */
    timeOffset: number;
    /** Number of available adapters */
    'adapters count': number;
    /** NPM version */
    NPM: string;
}
interface NotificationMessageObject {
    message: string;
    ts: number;
}

type MultilingualObject = Exclude<ioBroker.StringOrTranslated, string>;

export interface FilteredNotificationInformation {
    [scope: string]: {
        description: MultilingualObject;
        name: MultilingualObject;
        categories: {
            [category: string]: {
                description: MultilingualObject;
                name: MultilingualObject;
                severity: Severity;
                instances: {
                    [instance: string]: {
                        messages: NotificationMessageObject[];
                    };
                };
            };
        };
    };
}

export type CompactSystemRepositoryEntry = {
    link: string;
    hash?: string;
    stable?: boolean;
    json:
        | {
              _repoInfo: {
                  stable?: boolean;
                  name?: ioBroker.StringOrTranslated;
              };
          }
        | null
        | undefined;
};

export type CompactSystemRepository = {
    _id: ioBroker.HostObject['_id'];
    common: {
        name: ioBroker.HostCommon['name'];
        dontDelete: boolean;
    };
    native: {
        repositories: Record<string, CompactSystemRepositoryEntry>;
    };
};

/** Possible progress states. */
export const PROGRESS = {
    /** The socket is connecting. */
    CONNECTING: 0,
    /** The socket is successfully connected. */
    CONNECTED: 1,
    /** All objects are loaded. */
    OBJECTS_LOADED: 2,
    /** All states are loaded. */
    STATES_LOADED: 3,
    /** The socket is ready for use. */
    READY: 4,
};

const PERMISSION_ERROR = 'permissionError';
const NOT_CONNECTED = 'notConnectedError';

export const ERRORS = {
    PERMISSION_ERROR,
    NOT_CONNECTED,
};

export type BinaryStateChangeHandler = (id: string, base64: string | null) => void;

/** Converts ioB pattern into regex */
export function pattern2RegEx(pattern: string): string {
    pattern = (pattern || '').toString();

    const startsWithWildcard = pattern[0] === '*';
    const endsWithWildcard = pattern[pattern.length - 1] === '*';

    pattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');

    return (startsWithWildcard ? '' : '^') + pattern + (endsWithWildcard ? '' : '$');
}

interface ConnectionProps {
    /** The socket name. */
    name?: string;
    /** State IDs to always automatically subscribe to. */
    autoSubscribes?: string[];
    /** Automatically subscribe to logging. */
    autoSubscribeLog?: boolean;
    /** The protocol to use for the socket.io connection. */
    protocol: string;
    /** The host name to use for the socket.io connection. */
    host: string;
    /** The port to use for the socket.io connection. */
    port?: string | number;
    /** The socket.io connection timeout. */
    ioTimeout?: number;
    /** The socket.io command timeout. */
    cmdTimeout?: number;
    /** Flag to indicate if all objects should be loaded or not. Default true (not loaded) */
    doNotLoadAllObjects?: boolean;
    /** Flag to indicate if AccessControlList for current user will be loaded or not. Default true (not loaded) */
    doNotLoadACL?: boolean;
    /** Progress callback. */
    onProgress?: (progress: number) => void;
    /** Ready callback. */
    onReady?: (objects: Record<string, ioBroker.Object>) => void;
    /** Log callback. */
    onLog?: (text: string) => void;
    /** Error callback. */
    onError?: (error: any) => void;
    /** Object change callback. */
    onObjectChange?: ioBroker.ObjectChangeHandler;
    /** Gets called when the system language is determined */
    onLanguage?: (lang: ioBroker.Languages) => void;
    /** The device UUID with which the communication must be established */
    uuid?: string;
    /** Authentication token (used only in cloud) */
    token?: string;
}

export interface ConnectOptions {
    path?: string;
    query?: string;
    name?: string;
    timeout?: number;
    uuid?: string;
}

export interface SocketClient {
    connect(url?: string, options?: ConnectOptions): void;
    close(): void;
    destroy(): void;

    readonly connected: boolean;

    on(event: string, callback: (...args: any) => void): void;
    off(event: string, callback: (...args: any) => void): void;
    emit(event: string, ...args: any): boolean;
}

interface RenameGroupObject extends ioBroker.GroupObject {
    newId?: ioBroker.ObjectIDs.Group;
}

interface Promises {
    installedCompact?: {
        [host: string]: Promise<Record<string, ioBroker.AdapterObject>> | null;
    } | null;
    installed?: {
        [host: string]: Promise<Record<string, ioBroker.AdapterObject>> | null;
    } | null;
    systemConfig?: Promise<ioBroker.SystemConfigObject> | null;
    hosts?: Promise<ioBroker.HostObject[]> | null;
    users?: Promise<ioBroker.UserObject[]> | null;
    compactAdapters?: Promise<Record<string, ioBroker.AdapterObject>> | null;
    repoCompact?: Promise<any> | null;
    version?: Promise<{ version: string; serverName: string }> | null;
    groups?: Promise<ioBroker.GroupObject[]> | null;
    repo?: Promise<Record<string, ioBroker.AdapterObject>> | null;
    cert?: Promise<{ name: string; type: 'public' | 'private' | 'chained' | '' }[]> | null;
    webName?: Promise<string> | null;
    compactInstances?: Promise<Record<string, ioBroker.InstanceObject>> | null;
    getCompactSystemRepositories?: Promise<CompactSystemRepository> | null;
    systemConfigPromise?: Promise<ioBroker.SystemConfigObject> | null;
    hostsCompact?: Promise<ioBroker.HostObject[]> | null;
    uuid?: Promise<string | undefined>;
    [feature: `supportedFeatures_${string}`]: Promise<boolean> | null;
    [type: `instances_${string}`]: Promise<any> | null;
    [_enum: `enums_${string}`]: Promise<any> | null;
    [adapter: `adapter_${string}`]: Promise<any> | null;
    [host: `IPs_${string}`]: Promise<string[]> | null;
    [host: `hostInfo_${string}`]: Promise<HostInfo> | null;
    [host: `hostInfoShort_${string}`]: Promise<HostInfo> | null;
    [host: `rIPs_${string}`]: Promise<{ name: string; address: string; family: 'ipv4' | 'ipv6' }[]> | null;
    currentInstance?: Promise<string> | null;
}

export class LegacyConnection {
    // Do not define it as null, else we must check for null everywhere
    private _socket: SocketClient;

    private _authTimer: ReturnType<typeof setTimeout> | null | undefined;

    private systemLang: ioBroker.Languages = 'en';

    private readonly _waitForFirstConnection: Promise<void>;

    private _waitForFirstConnectionResolve: (() => void) | null = null;

    private _promises: Promises = {};

    private readonly _instanceSubscriptions: Record<
        string,
        {
            messageType: string;
            callback: (data: Record<string, any>, sourceInstance: string, messageType: string) => void;
        }[]
    >;

    private props: ConnectionProps;

    private readonly doNotLoadAllObjects: boolean;

    private readonly doNotLoadACL: boolean;

    private states: Record<string, ioBroker.State> = {};

    private objects: Record<string, ioBroker.Object> | null = null;

    private scriptLoadCounter: number | undefined;

    private acl: Record<string, any> | null = null;

    private firstConnect: boolean = true;

    private readonly waitForRestart: boolean = false;

    private connected: boolean = false;

    private readonly statesSubscribes: Record<
        string,
        { reg: RegExp; cbs: (ioBroker.StateChangeHandler | BinaryStateChangeHandler)[] }
    > = {};

    private readonly objectsSubscribes: Record<
        string,
        {
            reg: RegExp;
            cbs: ((id: string, obj: ioBroker.Object | null | undefined, oldObj?: ioBroker.Object | null) => void)[];
        }
    > = {};

    private readonly filesSubscribes: Record<
        string,
        { regId: RegExp; cbs: ioBroker.FileChangeHandler[]; regFilePattern: RegExp }
    > = {};

    private onConnectionHandlers: ((connected: boolean) => void)[] = [];

    private onLogHandlers: ((message: string) => void)[] = [];

    private readonly onProgress: (progress: number) => void;

    private readonly onError: (
        err:
            | string
            | {
                  message: string;
                  operation: string;
                  type: string;
                  id: string;
              },
    ) => void;

    private loaded: boolean = false;

    private loadTimer: ReturnType<typeof setTimeout> | null = null;

    private loadCounter: number = 0;

    private ignoreState: string = '';

    private readonly simStates: Record<string, ioBroker.State> = {};

    private autoSubscribes: string[];

    private readonly autoSubscribeLog: boolean;

    private subscribed: boolean | undefined;

    public isSecure: boolean | undefined;

    private onCmdStdoutHandler: ((id: string, text: string) => void) | undefined;

    private onCmdStderrHandler: ((id: string, text: string) => void) | undefined;

    private onCmdExitHandler: ((id: string, exitCode: number) => void) | undefined;

    public systemConfig: ioBroker.SystemConfigObject | null = null;

    constructor(props: ConnectionProps) {
        props = props || { protocol: window.location.protocol, host: window.location.hostname };
        this.props = props;

        this.autoSubscribes = this.props.autoSubscribes || [];
        this.autoSubscribeLog = this.props.autoSubscribeLog || false;

        this.props.protocol = this.props.protocol || window.location.protocol;
        this.props.host = this.props.host || window.location.hostname;
        this.props.port =
            this.props.port ||
            (window.location.port === '3000' ? (LegacyConnection.isWeb() ? 8082 : 8081) : window.location.port);
        this.props.ioTimeout = Math.max(this.props.ioTimeout || 20000, 20000);
        this.props.cmdTimeout = Math.max(this.props.cmdTimeout || 5000, 5000);
        this._instanceSubscriptions = {};

        // breaking change. Do not load all objects by default is true
        this.doNotLoadAllObjects = this.props.doNotLoadAllObjects === undefined ? true : this.props.doNotLoadAllObjects;
        this.doNotLoadACL = this.props.doNotLoadACL === undefined ? true : this.props.doNotLoadACL;

        this.states = {};
        this._waitForFirstConnection = new Promise(resolve => {
            this._waitForFirstConnectionResolve = resolve;
        });
        this.onProgress = this.props.onProgress || (() => {});
        this.onError =
            this.props.onError ||
            ((
                err:
                    | string
                    | {
                          message: string;
                          operation: string;
                          type: string;
                          id: string;
                      },
            ) => console.error(err));

        this.startSocket();
    }

    /**
     * Checks if this connection is running in a web adapter and not in an admin.
     *
     * @returns True if running in a web adapter or in a socketio adapter.
     */
    static isWeb(): boolean {
        const adapterName: string | undefined = window.adapterName;
        return (
            adapterName === 'material' ||
            adapterName === 'vis' ||
            adapterName?.startsWith('vis-') ||
            adapterName === 'echarts-show' ||
            window.socketUrl !== undefined
        );
    }

    /**
     * Starts the socket.io connection.
     */
    startSocket(): void {
        // if socket io is not yet loaded
        if (typeof window.io === 'undefined' && typeof window.iob === 'undefined') {
            // if in index.html the onLoad function not defined
            if (typeof window.registerSocketOnLoad !== 'function') {
                // poll if loaded
                this.scriptLoadCounter = this.scriptLoadCounter || 0;
                this.scriptLoadCounter++;

                if (this.scriptLoadCounter < 30) {
                    // wait till the script loaded
                    setTimeout(() => this.startSocket(), 100);
                    return;
                }
                window.alert('Cannot load socket.io.js!');
            } else {
                // register on load
                window.registerSocketOnLoad(() => this.startSocket());
            }
            return;
        }
        if (this._socket) {
            // socket was initialized, do not repeat
            return;
        }

        let host = this.props.host;
        let port = this.props.port;
        let protocol = this.props.protocol.replace(':', '');
        let path = window.location.pathname;

        if (window.location.hostname === 'iobroker.net' || window.location.hostname === 'iobroker.pro') {
            path = '';
        } else {
            // if web adapter, socket io could be on another port or even host
            if (window.socketUrl) {
                const parsed = new URL((window as any).socketUrl as string);
                host = parsed.hostname;
                port = parsed.port;
                protocol = parsed.protocol.replace(':', '');
            }
            // get a current path
            const pos = path.lastIndexOf('/');
            if (pos !== -1) {
                path = path.substring(0, pos + 1);
            }

            if (LegacyConnection.isWeb()) {
                // remove one level, like echarts, vis, .... We have here: '/echarts/'
                const parts = path.split('/');
                if (parts.length > 2) {
                    parts.pop();
                    // if it is a version, like in material, so remove it too
                    if (parts[parts.length - 1].match(/\d+\.\d+\.\d+/)) {
                        parts.pop();
                    }
                    parts.pop();
                    path = parts.join('/');
                    if (!path.endsWith('/')) {
                        path += '/';
                    }
                }
            }
        }

        const url = port ? `${protocol}://${host}:${port}${path}` : `${protocol}://${host}${path}`;

        this._socket = (window.io || window.iob).connect(url, {
            path: path.endsWith('/') ? `${path}socket.io` : `${path}/socket.io`,
            query: 'ws=true',
            name: this.props.name,
            timeout: this.props.ioTimeout,
            uuid: this.props.uuid,
        });

        this._socket.on('connect', (noTimeout: boolean | undefined) => {
            // If the user is not admin, it takes some time to install the handlers, because all rights must be checked
            if (noTimeout !== true) {
                setTimeout(
                    () =>
                        this.getVersion().then(info => {
                            const [major, minor, patch] = info.version.split('.');
                            const v = parseInt(major, 10) * 10000 + parseInt(minor, 10) * 100 + parseInt(patch, 10);
                            if (v < 40102) {
                                this._authTimer = null;
                                // possible this is an old version of admin
                                this.onPreConnect(false, false);
                            } else {
                                this._socket.emit('authenticate', (isOk: boolean, isSecure: boolean) =>
                                    this.onPreConnect(isOk, isSecure),
                                );
                            }
                        }),
                    500,
                );
            } else {
                // iobroker websocket waits, till all handlers are installed
                this._socket.emit('authenticate', (isOk: boolean, isSecure: boolean) =>
                    this.onPreConnect(isOk, isSecure),
                );
            }
        });

        this._socket.on('reconnect', () => {
            this.onProgress(PROGRESS.READY);
            this.connected = true;

            if (this.waitForRestart) {
                window.location.reload();
            } else {
                this._subscribe(true);
                this.onConnectionHandlers.forEach(cb => cb(true));
            }
        });

        this._socket.on('disconnect', () => {
            this.connected = false;
            this.subscribed = false;
            this.onProgress(PROGRESS.CONNECTING);
            this.onConnectionHandlers.forEach(cb => cb(false));
        });

        this._socket.on('reauthenticate', () => LegacyConnection.authenticate());

        this._socket.on('log', message => {
            this.props.onLog && this.props.onLog(message);
            this.onLogHandlers.forEach(cb => cb(message));
        });

        this._socket.on('error', (err: string | null) => {
            let _err = err || '';
            if (typeof _err.toString !== 'function') {
                _err = JSON.stringify(_err);
                console.error(`Received strange error: ${_err}`);
            }
            _err = _err.toString();
            if (_err.includes('User not authorized')) {
                LegacyConnection.authenticate();
            } else {
                window.alert(`Socket Error: ${err}`);
            }
        });

        this._socket.on('connect_error', (err: string) => console.error(`Connect error: ${err}`));

        this._socket.on('permissionError', (err: { operation: string; type: string; id?: string }) =>
            this.onError({
                message: 'no permission',
                operation: err.operation,
                type: err.type,
                id: err.id || '',
            }),
        );

        this._socket.on('objectChange', (id: string, obj: ioBroker.Object | null) =>
            setTimeout(() => this.objectChange(id, obj), 0),
        );

        this._socket.on('stateChange', (id: string, state) => setTimeout(() => this.stateChange(id, state), 0));

        this._socket.on('im', (messageType: string, from: string, data) =>
            setTimeout(() => this.instanceMessage(messageType, from, data), 0),
        );

        this._socket.on('fileChange', (id: string, fileName: string, size: number | null) =>
            setTimeout(() => this.fileChange(id, fileName, size), 0),
        );

        this._socket.on(
            'cmdStdout',
            (id: string, text: string) => this.onCmdStdoutHandler && this.onCmdStdoutHandler(id, text),
        );

        this._socket.on(
            'cmdStderr',
            (id: string, text: string) => this.onCmdStderrHandler && this.onCmdStderrHandler(id, text),
        );

        this._socket.on(
            'cmdExit',
            (id: string, exitCode: number) => this.onCmdExitHandler && this.onCmdExitHandler(id, exitCode),
        );
    }

    /**
     * Called internally.
     */
    private onPreConnect(_isOk: boolean, isSecure: boolean): void {
        if (this._authTimer) {
            clearTimeout(this._authTimer);
            this._authTimer = null;
        }

        this.connected = true;
        this.isSecure = isSecure;

        if (this.waitForRestart) {
            window.location.reload();
        } else {
            if (this.firstConnect) {
                // retry strategy
                this.loadTimer = setTimeout(() => {
                    this.loadTimer = null;
                    this.loadCounter++;
                    if (this.loadCounter < 10) {
                        void this.onConnect().catch(e => this.onError(e));
                    }
                }, 1000);

                if (!this.loaded) {
                    void this.onConnect().catch(e => this.onError(e));
                }
            } else {
                this.onProgress(PROGRESS.READY);
            }

            this._subscribe(true);
            this.onConnectionHandlers.forEach(cb => cb(true));
        }

        if (this._waitForFirstConnectionResolve) {
            this._waitForFirstConnectionResolve();
            this._waitForFirstConnectionResolve = null;
        }
    }

    /**
     * Checks if running in ioBroker cloud
     */
    static isCloud(): boolean {
        if (window.location.hostname.includes('amazonaws.com') || window.location.hostname.includes('iobroker.in')) {
            return true;
        }
        if (typeof window.socketUrl === 'undefined') {
            return false;
        }
        return window.socketUrl.includes('iobroker.in') || window.socketUrl.includes('amazonaws');
    }

    /**
     * Checks if the socket is connected.
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Checks if the socket is connected.
     * Promise resolves if once connected.
     */
    waitForFirstConnection(): Promise<void> {
        return this._waitForFirstConnection;
    }

    /**
     * Called internally.
     */
    private async _getUserPermissions(): Promise<Record<string, any> | null> {
        if (this.doNotLoadACL) {
            return null;
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('getUserPermissions', (err: string | null, acl: Record<string, any> | null) =>
                err ? reject(new Error(err)) : resolve(acl),
            );
        });
    }

    /**
     * Called internally.
     */
    private async onConnect(): Promise<void> {
        let acl: Record<string, any> | null | undefined;
        try {
            acl = await this._getUserPermissions();
        } catch (e) {
            const knownError = e as Error;
            this.onError(`Cannot read user permissions: ${knownError.message}`);
            return;
        }
        if (!this.doNotLoadACL) {
            if (this.loaded) {
                return;
            }
            this.loaded = true;
            this.loadTimer && clearTimeout(this.loadTimer);
            this.loadTimer = null;

            this.onProgress(PROGRESS.CONNECTED);
            this.firstConnect = false;

            this.acl = acl;
        }

        // Read system configuration
        let systemConfig: ioBroker.SystemConfigObject | null;
        try {
            systemConfig = await this.getSystemConfig();

            if (this.doNotLoadACL) {
                if (this.loaded) {
                    return;
                }
                this.loaded = true;
                this.loadTimer && clearTimeout(this.loadTimer);
                this.loadTimer = null;

                this.onProgress(PROGRESS.CONNECTED);
                this.firstConnect = false;
            }

            this.systemConfig = systemConfig;
            if (this.systemConfig && this.systemConfig.common) {
                this.systemLang = this.systemConfig.common.language;
            } else {
                // @ts-expect-error userLanguage is not standard
                this.systemLang = window.navigator.userLanguage || window.navigator.language;

                if (/^(en|de|ru|pt|nl|fr|it|es|pl|uk)-?/.test(this.systemLang)) {
                    this.systemLang = this.systemLang.substr(0, 2) as ioBroker.Languages;
                } else if (!/^(en|de|ru|pt|nl|fr|it|es|pl|uk|zh-cn)$/.test(this.systemLang)) {
                    this.systemLang = 'en';
                }
            }

            this.props.onLanguage && this.props.onLanguage(this.systemLang);

            if (!this.doNotLoadAllObjects) {
                await this.getObjects();
                this.onProgress(PROGRESS.READY);
                this.props.onReady && this.objects && this.props.onReady(this.objects);
            } else {
                this.objects = { 'system.config': systemConfig };
                this.onProgress(PROGRESS.READY);
                this.props.onReady && this.props.onReady(this.objects);
            }
        } catch (e) {
            this.onError(`Cannot read system config: ${e}`);
        }
    }

    /**
     * Called internally.
     */
    private static authenticate(): void {
        if (window.location.search.includes('&href=')) {
            window.location.href = `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
        } else {
            window.location.href = `${window.location.protocol}//${window.location.host}${window.location.pathname}?login&href=${window.location.search}${window.location.hash}`;
        }
    }

    /**
     * Subscribe to changes of the given state.
     *
     * @param id The ioBroker state ID or array of states
     * @param binary Set to true if the given state is binary and requires Base64 decoding
     * @param cb The callback
     */
    async subscribeState(
        id: string | string[],
        binary: boolean | ioBroker.StateChangeHandler | BinaryStateChangeHandler,
        cb?: ioBroker.StateChangeHandler | BinaryStateChangeHandler,
    ): Promise<void> {
        if (typeof binary === 'function') {
            cb = binary;
            binary = false;
        }

        let ids: string[];
        if (!Array.isArray(id)) {
            ids = [id];
        } else {
            ids = id;
        }
        if (!cb) {
            console.error('No callback found for subscribeState');
            return Promise.reject(new Error('No callback found for subscribeState'));
        }
        const toSubscribe = [];
        for (let i = 0; i < ids.length; i++) {
            const _id = ids[i];
            if (!this.statesSubscribes[_id]) {
                let reg = _id
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')
                    .replace(/\+/g, '\\+')
                    .replace(/\[/g, '\\[');

                if (!reg.includes('*')) {
                    reg += '$';
                }
                this.statesSubscribes[_id] = { reg: new RegExp(reg), cbs: [cb] };
                if (_id !== this.ignoreState) {
                    toSubscribe.push(_id);
                }
            } else {
                !this.statesSubscribes[_id].cbs.includes(cb) && this.statesSubscribes[_id].cbs.push(cb);
            }
        }

        if (!this.connected) {
            return;
        }

        if (toSubscribe.length) {
            // no answer from server required
            this._socket.emit('subscribe', toSubscribe);
        }

        if (binary) {
            let base64: string | undefined;
            for (let i = 0; i < ids.length; i++) {
                try {
                    // deprecated, but we still support it
                    base64 = await this.getBinaryState(ids[i]);
                } catch (e) {
                    console.error(`Cannot getBinaryState "${ids[i]}": ${JSON.stringify(e)}`);
                    base64 = undefined;
                }
                if (base64 !== undefined && cb) {
                    (cb as BinaryStateChangeHandler)(ids[i], base64);
                }
            }
        } else {
            return new Promise((resolve: () => void, reject: (error: unknown) => void): void => {
                this._socket.emit(
                    LegacyConnection.isWeb() ? 'getStates' : 'getForeignStates',
                    ids,
                    (err: string | null, states: Record<string, ioBroker.State>) => {
                        if (err) {
                            console.error(`Cannot getForeignStates "${id}": ${JSON.stringify(err)}`);
                            reject(new Error(err));
                        } else {
                            if (states) {
                                Object.keys(states).forEach(_id =>
                                    (cb as ioBroker.StateChangeHandler)(_id, states[_id]),
                                );
                            }
                            resolve();
                        }
                    },
                );
            });
        }
    }

    /**
     * Subscribe to changes of the given state.
     */
    subscribeStateAsync(
        /** The ioBroker state ID or array of states */
        id: string | string[],
        /** The callback. */
        cb: ioBroker.StateChangeHandler,
    ): Promise<void> {
        let ids: string[];
        if (!Array.isArray(id)) {
            ids = [id];
        } else {
            ids = id;
        }
        const toSubscribe = [];
        for (let i = 0; i < ids.length; i++) {
            const _id = ids[i];
            if (!this.statesSubscribes[_id]) {
                let reg = _id
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')
                    .replace(/\+/g, '\\+')
                    .replace(/\[/g, '\\[');

                if (!reg.includes('*')) {
                    reg += '$';
                }
                this.statesSubscribes[_id] = { reg: new RegExp(reg), cbs: [] };
                this.statesSubscribes[_id].cbs.push(cb);
                if (_id !== this.ignoreState) {
                    // no answer from server required
                    toSubscribe.push(_id);
                }
            } else {
                !this.statesSubscribes[_id].cbs.includes(cb) && this.statesSubscribes[_id].cbs.push(cb);
            }
        }

        if (toSubscribe.length && this.connected) {
            // no answer from server required
            this._socket.emit('subscribe', toSubscribe);
        }

        return new Promise((resolve, reject) => {
            if (typeof cb === 'function' && this.connected) {
                this._socket.emit(
                    LegacyConnection.isWeb() ? 'getStates' : 'getForeignStates',
                    id,
                    (err: string | null, states: Record<string, ioBroker.State>) => {
                        err && console.error(`Cannot getForeignStates "${id}": ${JSON.stringify(err)}`);
                        states && Object.keys(states).forEach(_id => cb(_id, states[_id]));
                        states
                            ? resolve()
                            : reject(new Error(`Cannot getForeignStates "${id}": ${JSON.stringify(err)}`));
                    },
                );
            } else {
                this.connected ? reject(new Error('callback is not a function')) : reject(new Error('not connected'));
            }
        });
    }

    /**
     * Unsubscribes all or the given callback from changes of the given state.
     */
    unsubscribeState(
        /** The ioBroker state ID or array of states */
        id: string | string[],
        /** The callback. */
        cb?: ioBroker.StateChangeHandler | BinaryStateChangeHandler,
    ): void {
        let ids: string[];
        if (!Array.isArray(id)) {
            ids = [id];
        } else {
            ids = id;
        }
        const toUnsubscribe = [];
        for (let i = 0; i < ids.length; i++) {
            const _id = ids[i];

            if (this.statesSubscribes[_id]) {
                if (cb) {
                    const pos = this.statesSubscribes[_id].cbs.indexOf(cb);
                    pos !== -1 && this.statesSubscribes[_id].cbs.splice(pos, 1);
                } else {
                    this.statesSubscribes[_id].cbs = [];
                }

                if (!this.statesSubscribes[_id].cbs || !this.statesSubscribes[_id].cbs.length) {
                    delete this.statesSubscribes[_id];
                    if (_id !== this.ignoreState) {
                        toUnsubscribe.push(_id);
                    }
                }
            }
        }

        if (toUnsubscribe.length && this.connected) {
            // no answer from server required
            this._socket.emit('unsubscribe', toUnsubscribe);
        }
    }

    /**
     * Subscribe to changes of the given object.
     *
     * @param id The ioBroker object ID or array of objects
     * @param cb The callback
     */
    subscribeObject(id: string | string[], cb: ioBroker.ObjectChangeHandler): Promise<void> {
        let ids: string[];
        if (!Array.isArray(id)) {
            ids = [id];
        } else {
            ids = id;
        }
        const toSubscribe = [];
        for (let i = 0; i < ids.length; i++) {
            const _id = ids[i];
            if (!this.objectsSubscribes[_id]) {
                let reg = _id.replace(/\./g, '\\.').replace(/\*/g, '.*');
                if (!reg.includes('*')) {
                    reg += '$';
                }
                this.objectsSubscribes[_id] = { reg: new RegExp(reg), cbs: [cb] };
                toSubscribe.push(_id);
            } else {
                !this.objectsSubscribes[_id].cbs.includes(cb) && this.objectsSubscribes[_id].cbs.push(cb);
            }
        }
        if (this.connected && toSubscribe.length) {
            this._socket.emit('subscribeObjects', toSubscribe);
        }

        return Promise.resolve();
    }

    /**
     * Unsubscribes all or the given callback from changes of the given object.
     *
     * @param id The ioBroker object ID or array of objects
     * @param cb The callback
     */
    unsubscribeObject(id: string | string[], cb?: ioBroker.ObjectChangeHandler): Promise<void> {
        let ids: string[];
        if (!Array.isArray(id)) {
            ids = [id];
        } else {
            ids = id;
        }
        const toUnsubscribe = [];
        for (let i = 0; i < ids.length; i++) {
            const _id = ids[i];
            if (this.objectsSubscribes[_id]) {
                if (cb) {
                    const pos = this.objectsSubscribes[_id].cbs.indexOf(cb);
                    pos !== -1 && this.objectsSubscribes[_id].cbs.splice(pos, 1);
                } else {
                    this.objectsSubscribes[_id].cbs = [];
                }

                if (this.connected && (!this.objectsSubscribes[_id].cbs || !this.objectsSubscribes[_id].cbs.length)) {
                    delete this.objectsSubscribes[_id];
                    toUnsubscribe.push(_id);
                }
            }
        }

        if (this.connected && toUnsubscribe.length) {
            this._socket.emit('unsubscribeObjects', toUnsubscribe);
        }

        return Promise.resolve();
    }

    /**
     * Called internally.
     */
    private fileChange(id: string, fileName: string, size: number | null): void {
        for (const sub of Object.values(this.filesSubscribes)) {
            if (sub.regId.test(id) && sub.regFilePattern.test(fileName)) {
                for (const cb of sub.cbs) {
                    try {
                        cb(id, fileName, size);
                    } catch (e) {
                        console.error(`Error by callback of fileChange: ${e}`);
                    }
                }
            }
        }
    }

    /**
     * Subscribe to changes of the files.
     *
     * @param id The ioBroker state ID for meta-object. Could be a pattern
     * @param filePattern Pattern or file name, like 'main/*' or 'main/visViews.json`
     * @param cb The callback.
     */
    async subscribeFiles(
        /** The ioBroker state ID for meta-object. Could be a pattern */
        id: string,
        /** Pattern or file name, like 'main/*' or 'main/visViews.json` */
        filePattern: string | string[],
        /** The callback. */
        cb: ioBroker.FileChangeHandler,
    ): Promise<void> {
        if (typeof cb !== 'function') {
            throw new Error('The state change handler must be a function!');
        }
        let filePatterns;
        if (Array.isArray(filePattern)) {
            filePatterns = filePattern;
        } else {
            filePatterns = [filePattern];
        }
        const toSubscribe = [];
        for (let f = 0; f < filePatterns.length; f++) {
            const pattern = filePatterns[f];
            const key = `${id}$%$${pattern}`;

            if (!this.filesSubscribes[key]) {
                this.filesSubscribes[key] = {
                    regId: new RegExp(pattern2RegEx(id)),
                    regFilePattern: new RegExp(pattern2RegEx(pattern)),
                    cbs: [cb],
                };

                toSubscribe.push(pattern);
            } else {
                !this.filesSubscribes[key].cbs.includes(cb) && this.filesSubscribes[key].cbs.push(cb);
            }
        }
        if (this.connected && toSubscribe.length) {
            this._socket.emit('subscribeFiles', id, toSubscribe);
        }
        return Promise.resolve();
    }

    /**
     * Unsubscribes the given callback from changes of files.
     *
     * @param id The ioBroker state ID.
     * @param filePattern Pattern or file name, like 'main/*' or 'main/visViews.json`
     * @param cb The callback.
     */
    unsubscribeFiles(id: string, filePattern: string, cb?: ioBroker.FileChangeHandler): void {
        let filePatterns: string[];
        if (Array.isArray(filePattern)) {
            filePatterns = filePattern;
        } else {
            filePatterns = [filePattern];
        }
        const toUnsubscribe = [];
        for (let f = 0; f < filePatterns.length; f++) {
            const pattern = filePatterns[f];
            const key = `${id}$%$${pattern}`;
            if (this.filesSubscribes[key]) {
                const sub = this.filesSubscribes[key];
                if (cb) {
                    const pos = sub.cbs.indexOf(cb);
                    pos !== -1 && sub.cbs.splice(pos, 1);
                } else {
                    sub.cbs = [];
                }

                if (!sub.cbs || !sub.cbs.length) {
                    delete this.filesSubscribes[key];
                    this.connected && toUnsubscribe.push(pattern);
                }
            }
        }

        if (this.connected && toUnsubscribe.length) {
            this._socket.emit('unsubscribeFiles', id, toUnsubscribe);
        }
    }

    /**
     * Called internally.
     */
    private objectChange(id: string, obj: ioBroker.Object | null): void {
        // update main.objects cache
        if (!this.objects) {
            return;
        }

        let oldObj: Partial<ioBroker.Object> | null;

        let changed = false;
        if (obj) {
            if (this.objects[id]) {
                // @ts-expect-error fix later
                oldObj = { _id: id, type: this.objects[id].type };
            }

            if (!this.objects[id] || JSON.stringify(this.objects[id]) !== JSON.stringify(obj)) {
                this.objects[id] = obj;
                changed = true;
            }
        } else if (this.objects[id]) {
            // @ts-expect-error fix later
            oldObj = { _id: id, type: this.objects[id].type };
            delete this.objects[id];
            changed = true;
        }

        Object.keys(this.objectsSubscribes).forEach(_id => {
            if (_id === id || this.objectsSubscribes[_id].reg.test(id)) {
                this.objectsSubscribes[_id].cbs.forEach(cb => {
                    try {
                        cb(id, obj, oldObj as ioBroker.Object);
                    } catch (e) {
                        console.error(`Error by callback of objectChange: ${e}`);
                    }
                });
            }
        });

        if (changed && this.props.onObjectChange) {
            void this.props.onObjectChange(id, obj);
        }
    }

    /**
     * Called internally.
     */
    private stateChange(id: string, state: ioBroker.State | null): void {
        for (const task in this.statesSubscribes) {
            if (
                Object.prototype.hasOwnProperty.call(this.statesSubscribes, task) &&
                this.statesSubscribes[task].reg.test(id)
            ) {
                this.statesSubscribes[task].cbs.forEach(cb => {
                    try {
                        void (cb as ioBroker.StateChangeHandler)(id, state);
                    } catch (e) {
                        const knownError = e as Error;
                        console.error(`Error by callback of stateChange: ${knownError?.message}`);
                    }
                });
            }
        }
    }

    /**
     * Called internally.
     *
     * @param messageType The message type
     * @param sourceInstance The source instance
     * @param data Payload
     */
    instanceMessage(messageType: string, sourceInstance: string, data: Record<string, any>): void {
        if (this._instanceSubscriptions[sourceInstance]) {
            this._instanceSubscriptions[sourceInstance].forEach(sub => {
                if (sub.messageType === messageType) {
                    sub.callback(data, sourceInstance, messageType);
                }
            });
        }
    }

    /**
     * Gets all states.
     *
     * @param pattern The pattern to filter states
     * @param disableProgressUpdate Don't call onProgress() when done
     */
    getStates(pattern?: string | boolean, disableProgressUpdate?: boolean): Promise<Record<string, ioBroker.State>> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (typeof pattern === 'boolean') {
            disableProgressUpdate = pattern;
            pattern = undefined;
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('getStates', pattern, (err: string | null, res: Record<string, ioBroker.State>) => {
                this.states = res;
                !disableProgressUpdate && this.onProgress(PROGRESS.STATES_LOADED);
                err ? reject(new Error(err)) : resolve(this.states);
            });
        });
    }

    /**
     * Gets the given state.
     *
     * @param id The state ID
     */
    getState(id: string): Promise<ioBroker.State | null> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        if (id && id === this.ignoreState) {
            return Promise.resolve(this.simStates[id] || ({ val: null, ack: true } as ioBroker.State));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('getState', id, (err: string | null, state: ioBroker.State) =>
                err ? reject(new Error(err)) : resolve(state),
            );
        });
    }

    /**
     * Get the given binary state.
     *
     * @deprecated since js-controller 5.0. Use files instead.
     * @param id The state ID.
     */
    getBinaryState(id: string): Promise<string> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        // the data will come in base64
        return new Promise((resolve, reject) => {
            this._socket.emit('getBinaryState', id, (err: string | null, base64: string) =>
                err ? reject(new Error(err)) : resolve(base64),
            );
        });
    }

    /**
     * Set the given binary state.
     *
     * @deprecated since js-controller 5.0. Use files instead.
     * @param id The state ID.
     * @param base64 The Base64 encoded binary data.
     */
    setBinaryState(id: string, base64: string): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        // the data will come in base64
        return new Promise((resolve, reject) => {
            this._socket.emit('setBinaryState', id, base64, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Sets the given state value.
     *
     * @param id The state ID
     * @param val The state value
     * @param ack The acknowledgment flag
     */
    setState(id: string, val: string | number | boolean | ioBroker.SettableState | null, ack?: boolean): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        // extra handling for "nothing_selected" state for vis
        if (id && id === this.ignoreState) {
            let state: ioBroker.State;
            if (typeof ack === 'boolean') {
                state = val as ioBroker.State;
            } else if (typeof val === 'object' && (val as ioBroker.State).val !== undefined) {
                state = val as ioBroker.State;
            } else {
                state = {
                    val: val as string | number | boolean | null,
                    ack: false,
                    ts: Date.now(),
                    lc: Date.now(),
                    from: 'system.adapter.vis.0',
                };
            }

            this.simStates[id] = state;

            // inform subscribers about changes
            if (this.statesSubscribes[id]) {
                for (const cb of this.statesSubscribes[id].cbs) {
                    try {
                        void (cb as ioBroker.StateChangeHandler)(id, state);
                    } catch (e) {
                        console.error(`Error by callback of stateChanged: ${e}`);
                    }
                }
            }

            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('setState', id, val, (err: string | null) => (err ? reject(new Error(err)) : resolve()));
        });
    }

    /**
     * Gets all objects.
     *
     * @param update Set to true to retrieve all objects from the server (instead of using the local cache)
     * @param disableProgressUpdate Don't call onProgress() when done
     */
    getObjects(update?: boolean, disableProgressUpdate?: boolean): Promise<Record<string, ioBroker.Object>> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            if (!update && this.objects) {
                resolve(this.objects);
            } else {
                this._socket.emit(
                    LegacyConnection.isWeb() ? 'getObjects' : 'getAllObjects',
                    (err: string | null, res: Record<string, ioBroker.Object>) => {
                        this.objects = res;
                        disableProgressUpdate && this.onProgress(PROGRESS.OBJECTS_LOADED);
                        err ? reject(new Error(err)) : resolve(this.objects);
                    },
                );
            }
        });
    }

    /**
     * Gets objects by list of IDs.
     *
     * @param list Array of object IDs to retrieve
     */
    getObjectsById(list: string[]): Promise<Record<string, ioBroker.Object>> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('getObjects', list, (err: string | null, res: Record<string, ioBroker.Object>) =>
                err ? reject(new Error(err)) : resolve(res),
            );
        });
    }

    /**
     * Called internally.
     */
    private _subscribe(isEnable: boolean): void {
        if (isEnable && !this.subscribed) {
            this.subscribed = true;
            this.autoSubscribes.forEach(id => this._socket.emit('subscribeObjects', id));
            // re-subscribe objects
            Object.keys(this.objectsSubscribes).forEach(id => this._socket.emit('subscribeObjects', id));
            // re-subscribe logs
            this.autoSubscribeLog && this._socket.emit('requireLog', true);
            // re-subscribe states
            const ids = Object.keys(this.statesSubscribes);
            ids.forEach(id => this._socket.emit('subscribe', id));
            ids.length &&
                this._socket.emit(
                    LegacyConnection.isWeb() ? 'getStates' : 'getForeignStates',
                    ids,
                    (err: string | null, states: Record<string, ioBroker.State>) => {
                        err && console.error(`Cannot getForeignStates: ${JSON.stringify(err)}`);
                        // inform about states
                        states && Object.keys(states).forEach(id => this.stateChange(id, states[id]));
                    },
                );
        } else if (!isEnable && this.subscribed) {
            this.subscribed = false;
            // un-subscribe objects
            this.autoSubscribes.forEach(id => this._socket.emit('unsubscribeObjects', id));
            Object.keys(this.objectsSubscribes).forEach(id => this._socket.emit('unsubscribeObjects', id));
            // un-subscribe logs
            this.autoSubscribeLog && this._socket.emit('requireLog', false);

            // un-subscribe states
            Object.keys(this.statesSubscribes).forEach(id => this._socket.emit('unsubscribe', id));
        }
    }

    /**
     * Requests log updates.
     *
     * @param isEnabled Set to true to get logs
     */
    requireLog(isEnabled: boolean): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('requireLog', isEnabled, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Deletes the given object.
     *
     * @param id The object ID
     * @param maintenance Force deletion of non-conform IDs
     */
    delObject(id: string, maintenance?: boolean): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('delObject', id, { maintenance: !!maintenance }, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Deletes the given object and all its children.
     *
     * @param id The object ID
     * @param maintenance Force deletion of non-conform IDs
     */
    delObjects(id: string, maintenance?: boolean): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('delObjects', id, { maintenance: !!maintenance }, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Sets the object.
     */
    setObject(id: string, obj: ioBroker.SettableObject): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!obj) {
            return Promise.reject(new Error('Null object is not allowed'));
        }

        obj = JSON.parse(JSON.stringify(obj));

        if (Object.prototype.hasOwnProperty.call(obj, 'from')) {
            delete obj.from;
        }
        if (Object.prototype.hasOwnProperty.call(obj, 'user')) {
            delete obj.user;
        }
        if (Object.prototype.hasOwnProperty.call(obj, 'ts')) {
            delete obj.ts;
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('setObject', id, obj, (err: string | null) => (err ? reject(new Error(err)) : resolve()));
        });
    }

    /**
     * Gets the object with the given id from the server.
     */
    getObject<T = ioBroker.Object>(id: string): Promise<T> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        if (id && id === this.ignoreState) {
            return Promise.resolve({
                _id: this.ignoreState,
                type: 'state',
                common: {
                    name: 'ignored state',
                    type: 'mixed',
                    read: true,
                    write: true,
                    role: 'state',
                },
                native: {},
            } as T);
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('getObject', id, (err: string | null, obj: ioBroker.Object) =>
                err ? reject(new Error(err)) : resolve(obj as T),
            );
        });
    }

    /**
     * Get all instances of the given adapter or all instances of all adapters.
     *
     * @param adapter The name of the adapter
     * @param update Force update
     */
    getAdapterInstances(adapter?: string | boolean, update?: boolean): Promise<ioBroker.InstanceObject[]> {
        if (typeof adapter === 'boolean') {
            update = adapter;
            adapter = '';
        }
        adapter = adapter || '';

        if (!update && this._promises[`instances_${adapter}`] instanceof Promise) {
            return this._promises[`instances_${adapter}`] as Promise<ioBroker.InstanceObject[]>;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`instances_${adapter}`] = new Promise((resolve, reject) => {
            this._socket.emit(
                'getAdapterInstances',
                adapter,
                (err: string | null, instances: ioBroker.InstanceObject[]) =>
                    err ? reject(new Error(err)) : resolve(instances),
            );
        });

        return this._promises[`instances_${adapter}`] as Promise<ioBroker.InstanceObject[]>;
    }

    /**
     * Get adapters with the given name or all adapters.
     *
     * @param adapter The name of the adapter
     * @param update Force update
     */
    getAdapters(adapter?: string | boolean, update?: boolean): Promise<ioBroker.AdapterObject[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (typeof adapter === 'boolean') {
            update = adapter;
            adapter = '';
        }

        adapter = adapter || '';

        if (!update && this._promises[`adapter_${adapter}`] instanceof Promise) {
            return this._promises[`adapter_${adapter}`] as Promise<ioBroker.AdapterObject[]>;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`adapter_${adapter}`] = new Promise(
            (resolve: (adapters: ioBroker.AdapterObject[]) => void, reject) => {
                this._socket.emit('getAdapters', adapter, (err: string | null, adapters: ioBroker.AdapterObject[]) => {
                    err ? reject(new Error(err)) : resolve(adapters);
                });
            },
        );

        return this._promises[`adapter_${adapter}`] as Promise<ioBroker.AdapterObject[]>;
    }

    /**
     * Called internally.
     */
    private _renameGroups(objs: RenameGroupObject[], cb: (err: string | null) => void): void {
        if (!objs || !objs.length) {
            cb && cb(null);
        } else {
            const obj = objs.pop();
            if (!obj) {
                setTimeout(() => this._renameGroups(objs, cb), 0);
                return;
            }
            const oldId = obj._id;
            obj._id = obj.newId;
            delete obj.newId;

            this.setObject(obj._id, obj)
                .then(() => this.delObject(oldId))
                .then(() => setTimeout(() => this._renameGroups(objs, cb), 0))
                .catch((err: string | null) => cb && cb(err));
        }
    }

    /**
     * Rename a group.
     *
     * @param id The id.
     * @param newId The new id.
     * @param newName The new name.
     */
    async renameGroup(id: string, newId: string, newName: ioBroker.StringOrTranslated): Promise<void> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        const groups = await this.getGroups(true);
        if (groups.length) {
            // find all elements
            const groupsToRename: RenameGroupObject[] = (groups as RenameGroupObject[]).filter(group =>
                group._id.startsWith(`${id}.`),
            );

            groupsToRename.forEach(group => {
                group.newId = (newId + group._id.substring(id.length)) as ioBroker.ObjectIDs.Group;
            });

            await new Promise((resolve, reject) => {
                this._renameGroups(groupsToRename, (err: string | null) =>
                    err ? reject(new Error(err)) : resolve(null),
                );
            });
            const obj = groups.find(group => group._id === id);

            if (obj) {
                obj._id = newId as ioBroker.ObjectIDs.Group;
                if (newName !== undefined) {
                    obj.common = obj.common || ({} as ioBroker.GroupCommon);
                    // @ts-expect-error will be corrected in the next js-controller release
                    obj.common.name = newName;
                }

                return this.setObject(obj._id, obj).then(() => this.delObject(id));
            }
        }

        return Promise.resolve();
    }

    /**
     * Sends a message to a specific instance or all instances of some specific adapter.
     *
     * @param instance The instance to send this message to.
     * @param command Command name of the target instance.
     * @param data The message data to send.
     */
    sendTo(instance: string, command: string, data: any): Promise<{ result?: any; error?: string }> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise(resolve => {
            this._socket.emit('sendTo', instance, command, data, (result: { result?: any; error?: string }) =>
                resolve(result),
            );
        });
    }

    /**
     * Extend an object and create it if it might not exist.
     *
     * @param id The id.
     * @param obj The object.
     */
    extendObject(id: string, obj: ioBroker.PartialObject): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        obj = JSON.parse(JSON.stringify(obj));

        if (Object.prototype.hasOwnProperty.call(obj, 'from')) {
            delete obj.from;
        }
        if (Object.prototype.hasOwnProperty.call(obj, 'user')) {
            delete obj.user;
        }
        if (Object.prototype.hasOwnProperty.call(obj, 'ts')) {
            delete obj.ts;
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('extendObject', id, obj, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Register a handler for log messages.
     */
    registerLogHandler(handler: (message: string) => void): void {
        !this.onLogHandlers.includes(handler) && this.onLogHandlers.push(handler);
    }

    /**
     * Unregister a handler for log messages.
     */
    unregisterLogHandler(handler: (message: string) => void): void {
        const pos = this.onLogHandlers.indexOf(handler);
        pos !== -1 && this.onLogHandlers.splice(pos, 1);
    }

    /**
     * Register a handler for the connection state.
     */
    registerConnectionHandler(handler: (connected: boolean) => void): void {
        !this.onConnectionHandlers.includes(handler) && this.onConnectionHandlers.push(handler);
    }

    /**
     * Unregister a handler for the connection state.
     */
    unregisterConnectionHandler(handler: (connected: boolean) => void): void {
        const pos = this.onConnectionHandlers.indexOf(handler);
        pos !== -1 && this.onConnectionHandlers.splice(pos, 1);
    }

    /**
     * Set the handler for standard output of a command.
     *
     * @param handler The handler.
     */
    registerCmdStdoutHandler(handler: (id: string, text: string) => void): void {
        this.onCmdStdoutHandler = handler;
    }

    /**
     * Unset the handler for standard output of a command.
     */
    unregisterCmdStdoutHandler(/* handler */): void {
        this.onCmdStdoutHandler = undefined;
    }

    /**
     * Set the handler for standard error of a command.
     *
     * @param handler The handler.
     */
    registerCmdStderrHandler(handler: (id: string, text: string) => void): void {
        this.onCmdStderrHandler = handler;
    }

    /**
     * Unset the handler for standard error of a command.
     */
    unregisterCmdStderrHandler(): void {
        this.onCmdStderrHandler = undefined;
    }

    /**
     * Set the handler for exit of a command.
     */
    registerCmdExitHandler(handler: (id: string, exitCode: number) => void): void {
        this.onCmdExitHandler = handler;
    }

    /**
     * Unset the handler for exit of a command.
     */
    unregisterCmdExitHandler(): void {
        this.onCmdExitHandler = undefined;
    }

    /**
     * Get all enums with the given name.
     */
    getEnums(
        /** The name of the enum. */
        _enum?: string,
        /** Force update. */
        update?: boolean,
    ): Promise<Record<string, ioBroker.EnumObject>> {
        if (!update && this._promises[`enums_${_enum || 'all'}`] instanceof Promise) {
            return this._promises[`enums_${_enum || 'all'}`] as Promise<Record<string, ioBroker.EnumObject>>;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`enums_${_enum || 'all'}`] = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'enum',
                { startkey: `enum.${_enum || ''}`, endkey: `enum.${_enum ? `${_enum}.` : ''}\u9999` },
                (err: string | null, res: { rows: { value: ioBroker.EnumObject; id: string }[] }) => {
                    if (!err && res) {
                        const _res: Record<string, ioBroker.EnumObject> = {};
                        for (let i = 0; i < res.rows.length; i++) {
                            if (_enum && res.rows[i].id === `enum.${_enum}`) {
                                continue;
                            }
                            _res[res.rows[i].id] = res.rows[i].value;
                        }
                        resolve(_res);
                    } else if (err) {
                        reject(new Error(err));
                    } else {
                        reject(new Error('Invalid response while getting enums'));
                    }
                },
            );
        });

        return this._promises[`enums_${_enum || 'all'}`] as Promise<Record<string, ioBroker.EnumObject>>;
    }

    /**
     * Query a predefined object view.
     *
     * @param design design - 'system' or other designs like `custom`.
     * @param type The type of object.
     * @param start The start ID.
     * @param end The end ID.
     */
    getObjectViewCustom(
        /** The design: 'system' or other designs like `custom`. */
        design: string,
        /** The type of object. */
        type: ioBroker.ObjectType,
        /** The start ID. */
        start: string,
        /** The end ID. */
        end?: string,
    ): Promise<Record<string, ioBroker.Object>> {
        return new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                design,
                type,
                { startkey: start, endkey: end },
                (err: string | null, res: { rows: { value: ioBroker.Object; id: string }[] }) => {
                    if (!err) {
                        const _res: Record<string, ioBroker.Object> = {};
                        if (res && res.rows) {
                            for (let i = 0; i < res.rows.length; i++) {
                                _res[res.rows[i].id] = res.rows[i].value;
                            }
                        }
                        resolve(_res);
                    } else {
                        reject(new Error(err));
                    }
                },
            );
        });
    }

    /**
     * Query a predefined object view.
     *
     * @param type The type of object.
     * @param start The start ID.
     * @param end The end ID.
     */
    getObjectViewSystem<T = ioBroker.Object>(
        type: ioBroker.ObjectType,
        start: string,
        end?: string,
    ): Promise<Record<string, T>> {
        return this.getObjectViewCustom('system', type, start, end) as Promise<Record<string, T>>;
    }

    /**
     * @deprecated since version 1.1.15, cause parameter order does not match backend
     *
     * Query a predefined object view.
     * @param start The start ID.
     * @param end The end ID.
     * @param type The type of object.
     */
    getObjectView(start: string, end: string, type: ioBroker.ObjectType): Promise<Record<string, ioBroker.Object>> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        start = start || '';
        end = end || '\u9999';
        return this.getObjectViewCustom('system', type, start, end);
    }

    /**
     * Get the stored certificates.
     *
     * @param update Force update.
     */
    getCertificates(update?: boolean): Promise<{ name: string; type: 'public' | 'private' | 'chained' | '' }[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (this._promises.cert instanceof Promise && !update) {
            return this._promises.cert;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.cert = this.getObject('system.certificates').then(res => {
            const certs: { name: string; type: 'public' | 'private' | 'chained' | '' }[] = [];
            if (res && res.native && res.native.certificates) {
                Object.keys(res.native.certificates).forEach(c => {
                    const cert: string = res.native.certificates[c];
                    if (!cert) {
                        return;
                    }
                    const _cert: { name: string; type: 'public' | 'private' | 'chained' | '' } = {
                        name: c,
                        type: '',
                    };
                    // If it is a filename, it could be everything
                    if (cert.length < 700 && (cert.includes('/') || cert.includes('\\'))) {
                        if (c.toLowerCase().includes('private')) {
                            _cert.type = 'private';
                        } else if (cert.toLowerCase().includes('private')) {
                            _cert.type = 'private';
                        } else if (c.toLowerCase().includes('public')) {
                            _cert.type = 'public';
                        } else if (cert.toLowerCase().includes('public')) {
                            _cert.type = 'public';
                        }
                        certs.push(_cert);
                    } else {
                        _cert.type =
                            cert.substring(0, '-----BEGIN RSA PRIVATE KEY'.length) === '-----BEGIN RSA PRIVATE KEY' ||
                            cert.substring(0, '-----BEGIN PRIVATE KEY'.length) === '-----BEGIN PRIVATE KEY'
                                ? 'private'
                                : 'public';

                        if (_cert.type === 'public') {
                            const m = cert.split('-----END CERTIFICATE-----');
                            if (m.filter((t: string) => t.replace(/\r\n|\r|\n/, '').trim()).length > 1) {
                                _cert.type = 'chained';
                            }
                        }

                        certs.push(_cert);
                    }
                });
            }
            return certs;
        });

        return this._promises.cert;
    }

    /**
     * Get the logs from a host (only for admin connection).
     */
    getLogs(host: string, linesNumber?: number): Promise<string[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise(resolve => {
            this._socket.emit('sendToHost', host, 'getLogs', linesNumber || 200, (lines: string[]) => resolve(lines));
        });
    }

    /**
     * Get the log files (only for admin connection).
     */
    getLogsFiles(host: string): Promise<string[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('readLogs', host, (err: string | null, files: string[]) =>
                err ? reject(new Error(err)) : resolve(files),
            );
        });
    }

    /**
     * Delete the logs from a host (only for admin connection).
     */
    delLogs(host: string): Promise<void> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('sendToHost', host, 'delLogs', null, (error: string | null) =>
                error ? reject(new Error(error)) : resolve(),
            );
        });
    }

    /**
     * Read the meta items.
     */
    readMetaItems(): Promise<ioBroker.MetaObject[]> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'meta',
                { startkey: '', endkey: '\u9999' },
                (err: string | null, objs: { rows: { value: ioBroker.MetaObject; id: string }[] }) =>
                    err
                        ? reject(new Error(err))
                        : resolve(
                              objs.rows &&
                                  objs.rows.map((obj: { value: ioBroker.MetaObject; id: string }) => obj.value),
                          ),
            );
        });
    }

    /**
     * Read the directory of an adapter.
     *
     * @param adapter The adapter name.
     * @param fileName The directory name.
     */
    readDir(adapter: string, fileName: string): Promise<ioBroker.ReadDirResult[]> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('readDir', adapter, fileName, (err: string | null, files: ioBroker.ReadDirResult[]) =>
                err ? reject(new Error(err)) : resolve(files),
            );
        });
    }

    /**
     * Read a file of an adapter.
     *
     * @param adapter The adapter name.
     * @param fileName The file name.
     * @param base64 If it must be a base64 format.
     */
    readFile(adapter: string, fileName: string, base64?: boolean): Promise<string | { data: string; type: string }> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            if (!base64) {
                this._socket.emit('readFile', adapter, fileName, (err: string | null, data: string, type: string) => {
                    err ? reject(new Error(err)) : resolve({ data, type });
                });
            } else {
                this._socket.emit('readFile64', adapter, fileName, base64, (err: string | null, data: string) =>
                    err ? reject(new Error(err)) : resolve(data),
                );
            }
        });
    }

    /**
     * Write a file of an adapter.
     *
     * @param adapter The adapter name.
     * @param fileName The file name.
     * @param data The data (if it's a Buffer, it will be converted to Base64)
     */
    writeFile64(adapter: string, fileName: string, data: Buffer | string): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            if (typeof data === 'string') {
                this._socket.emit('writeFile', adapter, fileName, data, (err: string | null) =>
                    err ? reject(new Error(err)) : resolve(),
                );
            } else {
                const base64 = btoa(
                    new Uint8Array(data).reduce((_data, byte) => _data + String.fromCharCode(byte), ''),
                );

                this._socket.emit('writeFile64', adapter, fileName, base64, (err: string | null) =>
                    err ? reject(new Error(err)) : resolve(),
                );
            }
        });
    }

    /**
     * Delete a file of an adapter.
     *
     * @param adapter The adapter name.
     * @param fileName The file name.
     */
    deleteFile(adapter: string, fileName: string): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('unlink', adapter, fileName, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Delete a folder of an adapter.
     * All files in folder will be deleted.
     *
     * @param adapter The adapter name.
     * @param folderName The folder name.
     */
    deleteFolder(adapter: string, folderName: string): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('deleteFolder', adapter, folderName, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Get the list of all hosts.
     *
     * @param update Force update.
     */
    getHosts(update?: boolean): Promise<ioBroker.HostObject[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.hosts instanceof Promise) {
            return this._promises.hosts;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.hosts = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'host',
                { startkey: 'system.host.', endkey: 'system.host.\u9999' },
                (err: string | null, doc: { rows: { value: ioBroker.HostObject; id: string }[] }) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                },
            );
        });

        return this._promises.hosts;
    }

    /**
     * Get the list of all users.
     *
     * @param update Force update.
     */
    getUsers(update?: boolean): Promise<ioBroker.UserObject[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.users instanceof Promise) {
            return this._promises.users;
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.users = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'user',
                { startkey: 'system.user.', endkey: 'system.user.\u9999' },
                (err: string | null, doc: { rows: { value: ioBroker.UserObject; id: string }[] }) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                },
            );
        });

        return this._promises.users;
    }

    /**
     * Get the list of all groups.
     *
     * @param update Force update.
     */
    getGroups(update?: boolean): Promise<ioBroker.GroupObject[]> {
        if (!update && this._promises.groups instanceof Promise) {
            return this._promises.groups;
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.groups = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'group',
                { startkey: 'system.group.', endkey: 'system.group.\u9999' },
                (err: string | null, doc: { rows: { value: ioBroker.GroupObject; id: string }[] }) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                },
            );
        });

        return this._promises.groups;
    }

    /**
     * Get the host information.
     *
     * @param host The host name.
     * @param update Force update.
     * @param timeoutMs Optional read timeout.
     */
    getHostInfo(host: string, update?: boolean, timeoutMs?: number): Promise<HostInfo> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }

        if (!update && this._promises[`hostInfo_${host}`] instanceof Promise) {
            return this._promises[`hostInfo_${host}`];
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`hostInfo_${host}`] = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getHostInfo timeout'));
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit('sendToHost', host, 'getHostInfo', null, (data: string | HostInfo) => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject(new Error('May not read "getHostInfo"'));
                    } else if (!data || typeof data !== 'object') {
                        reject(new Error('Cannot read "getHostInfo"'));
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises[`hostInfo_${host}`];
    }

    /**
     * Get the host information (short version).
     *
     * @param host The host name.
     * @param update Force update.
     * @param timeoutMs Optional read timeout.
     */
    getHostInfoShort(host: string, update?: boolean, timeoutMs?: number): Promise<HostInfo> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }
        if (!update && this._promises[`hostInfoShort_${host}`] instanceof Promise) {
            return this._promises[`hostInfoShort_${host}`];
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`hostInfoShort_${host}`] = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('hostInfoShort timeout'));
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit('sendToHost', host, 'getHostInfoShort', null, (data: string | HostInfo) => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject(new Error('May not read "getHostInfoShort"'));
                    } else if (!data || typeof data !== 'object') {
                        reject(new Error('Cannot read "getHostInfoShort"'));
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises[`hostInfoShort_${host}`];
    }

    /**
     * Get the repository.
     *
     * @param host The host name.
     * @param options Options.
     * @param update Force update.
     * @param timeoutMs Timeout in ms.
     */
    getRepository(
        host: string,
        options?: { update: boolean; repo: string } | string,
        update?: boolean,
        timeoutMs?: number,
    ): Promise<Record<string, ioBroker.AdapterObject>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.repo instanceof Promise) {
            return this._promises.repo;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }

        this._promises.repo = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getRepository timeout'));
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit(
                'sendToHost',
                host,
                'getRepository',
                options,
                (data: string | Record<string, ioBroker.AdapterObject>) => {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        if (data === PERMISSION_ERROR) {
                            reject(new Error('May not read "getRepository"'));
                        } else if (!data || typeof data !== 'object') {
                            reject(new Error('Cannot read "getRepository"'));
                        } else {
                            resolve(data);
                        }
                    }
                },
            );
        });

        return this._promises.repo;
    }

    /**
     * Get the installed.
     *
     * @param host The host name.
     * @param update Force update.
     * @param cmdTimeout Timeout in ms.
     */
    getInstalled(host: string, update?: boolean, cmdTimeout?: number): Promise<Record<string, ioBroker.AdapterObject>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        this._promises.installed = this._promises.installed || {};

        if (!update && this._promises.installed[host] instanceof Promise) {
            return this._promises.installed[host];
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }

        this._promises.installed[host] = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getInstalled timeout'));
                }
            }, cmdTimeout || this.props.cmdTimeout);

            this._socket.emit(
                'sendToHost',
                host,
                'getInstalled',
                null,
                (data: string | Record<string, ioBroker.AdapterObject>) => {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        if (data === PERMISSION_ERROR) {
                            reject(new Error('May not read "getInstalled"'));
                        } else if (!data || typeof data !== 'object') {
                            reject(new Error('Cannot read "getInstalled"'));
                        } else {
                            resolve(data);
                        }
                    }
                },
            );
        });

        return this._promises.installed[host];
    }

    /**
     * Rename file or folder in ioBroker DB
     *
     * @param adapter Instance name, like `vis-2.0`.
     * @param oldName The current file name, e.g., main/vis-views.json
     * @param newName The new file name, e.g., main/vis-views-new.json
     */
    rename(adapter: string, oldName: string, newName: string): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('rename', adapter, oldName, newName, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Rename file in ioBroker DB
     */
    renameFile(
        /** instance name */
        adapter: string,
        /** current file name, e.g., main/vis-views.json */
        oldName: string,
        /** new file name, e.g., main/vis-views-new.json */
        newName: string,
    ): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('renameFile', adapter, oldName, newName, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Execute a command on a host.
     */
    cmdExec(
        /** The host name. */
        host: string,
        /** The command. */
        cmd: string,
        /** The command ID. */
        cmdId: string,
        /** Timeout of command in ms */
        cmdTimeout: number,
    ): Promise<void> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!host.startsWith(host)) {
            host += `system.host.${host}`;
        }

        return new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = cmdTimeout
                ? setTimeout(() => {
                      if (timeout) {
                          timeout = null;
                          reject(new Error('cmdExec timeout'));
                      }
                  }, cmdTimeout)
                : null;

            this._socket.emit('cmdExec', host, cmdId, cmd, null, (err: string | null) => {
                if (!cmdTimeout || timeout) {
                    timeout && clearTimeout(timeout);
                    timeout = null;
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve();
                    }
                }
            });
        });
    }

    /**
     * Checks if a given feature is supported.
     */
    checkFeatureSupported(
        /** The feature to check. */
        feature: string,
        /** Force update. */
        update?: boolean,
    ): Promise<boolean> {
        if (!update && this._promises[`supportedFeatures_${feature}`] instanceof Promise) {
            return this._promises[`supportedFeatures_${feature}`];
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises[`supportedFeatures_${feature}`] = new Promise((resolve, reject) => {
            this._socket.emit('checkFeatureSupported', feature, (err: string | null, supported: boolean) =>
                err ? reject(new Error(err)) : resolve(supported),
            );
        });

        return this._promises[`supportedFeatures_${feature}`];
    }

    /**
     * Read the base settings of a given host.
     */
    async readBaseSettings(host: string): Promise<Record<string, any>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        const result = await this.checkFeatureSupported('CONTROLLER_READWRITE_BASE_SETTINGS');
        if (result) {
            if (!this.connected) {
                return Promise.reject(new Error(NOT_CONNECTED));
            }
            return new Promise((resolve, reject) => {
                let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                    if (timeout) {
                        timeout = null;
                        reject(new Error('readBaseSettings timeout'));
                    }
                }, this.props.cmdTimeout);

                if (host.startsWith('system.host.')) {
                    host = host.replace(/^system\.host\./, '');
                }

                this._socket.emit(
                    'sendToHost',
                    host,
                    'readBaseSettings',
                    null,
                    (data: Record<string, any> | string) => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;

                            if (data === PERMISSION_ERROR) {
                                reject(new Error('May not read "BaseSettings"'));
                            } else if (!data || typeof data !== 'object') {
                                reject(new Error('Cannot read "BaseSettings"'));
                            } else {
                                resolve(data);
                            }
                        }
                    },
                );
            });
        }
        return Promise.reject(new Error('Not supported'));
    }

    /**
     * Write the base settings of a given host.
     *
     * @param host The host name.
     * @param config The new base settings.
     */
    writeBaseSettings(host: string, config: IoBJson): Promise<{ result?: 'ok'; error?: string }> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return this.checkFeatureSupported('CONTROLLER_READWRITE_BASE_SETTINGS').then(result => {
            if (result) {
                if (!this.connected) {
                    return Promise.reject(new Error(NOT_CONNECTED));
                }
                return new Promise((resolve, reject) => {
                    let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                        if (timeout) {
                            timeout = null;
                            reject(new Error('writeBaseSettings timeout'));
                        }
                    }, this.props.cmdTimeout);

                    this._socket.emit(
                        'sendToHost',
                        host,
                        'writeBaseSettings',
                        config,
                        (data: { result?: 'ok'; error?: string } | string) => {
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = null;

                                if (data === PERMISSION_ERROR) {
                                    reject(new Error('May not write "BaseSettings"'));
                                } else if (!data) {
                                    reject(new Error('Cannot write "BaseSettings"'));
                                } else {
                                    resolve(data as { result?: 'ok'; error?: string });
                                }
                            }
                        },
                    );
                });
            }

            return Promise.reject(new Error('Not supported'));
        });
    }

    /**
     * Send command to restart the iobroker on host
     */
    restartController(host: string): Promise<boolean> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('sendToHost', host, 'restartController', null, (error: string | null) => {
                error ? reject(new Error(error)) : resolve(true);
            });
        });
    }

    /**
     * Read statistics information from host
     *
     * @param host Host name
     * @param typeOfDiag one of none, normal, no-city, extended
     */
    getDiagData(host: string, typeOfDiag: 'none' | 'normal' | 'no-city' | 'extended'): Promise<Record<string, any>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return new Promise(resolve => {
            this._socket.emit('sendToHost', host, 'getDiagData', typeOfDiag, (result: Record<string, any>) =>
                resolve(result),
            );
        });
    }

    /**
     * Read all states (which might not belong to this adapter) which match the given pattern.
     */
    getForeignStates(pattern?: string): Promise<Record<string, ioBroker.State>> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        if (LegacyConnection.isWeb()) {
            return new Promise((resolve, reject) => {
                this._socket.emit(
                    'getStates',
                    pattern || '*',
                    (err: string | null, states: Record<string, ioBroker.State>) =>
                        err ? reject(new Error(err)) : resolve(states),
                );
            });
        }

        return new Promise((resolve, reject) => {
            this._socket.emit(
                'getForeignStates',
                pattern || '*',
                (err: string | null, states: Record<string, ioBroker.State>) =>
                    err ? reject(new Error(err)) : resolve(states),
            );
        });
    }

    /**
     * Get foreign objects by pattern, by specific type and resolve their enums. (Only admin)
     */
    getForeignObjects(pattern: string, type?: ioBroker.ObjectType): Promise<Record<string, ioBroker.State>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit(
                'getForeignObjects',
                pattern || '*',
                type,
                (err: string | null, states: Record<string, ioBroker.State>) =>
                    err ? reject(new Error(err)) : resolve(states),
            );
        });
    }

    /**
     * Gets the system configuration.
     *
     * @param update Force update.
     */
    getSystemConfig(update?: boolean): Promise<ioBroker.SystemConfigObject> {
        if (!update && this._promises.systemConfig instanceof Promise) {
            return this._promises.systemConfig;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.systemConfig = this.getObject('system.config').then(obj => {
            const systemConfig: ioBroker.SystemConfigObject = (obj || {}) as ioBroker.SystemConfigObject;
            systemConfig.common = systemConfig.common || ({} as ioBroker.SystemConfigCommon);
            systemConfig.native = systemConfig.native || {};
            return systemConfig;
        });

        return this._promises.systemConfig;
    }

    /**
     * Sets the system configuration.
     */
    setSystemConfig(
        obj: ioBroker.SettableObjectWorker<ioBroker.SystemConfigObject>,
    ): Promise<ioBroker.SystemConfigObject> {
        return this.setObject('system.config', obj).then(
            () => (this._promises.systemConfig = Promise.resolve(obj as ioBroker.SystemConfigObject)),
        );
    }

    /**
     * Get the raw socket.io socket.
     */
    getRawSocket(): SocketClient {
        return this._socket;
    }

    /**
     * Get the history of a given state.
     */
    getHistory(id: string, options: ioBroker.GetHistoryOptions): Promise<ioBroker.GetHistoryResult> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('getHistory', id, options, (err: string | null, values: ioBroker.GetHistoryResult) =>
                err ? reject(new Error(err)) : resolve(values),
            );
        });
    }

    /**
     * Get the history of a given state.
     */
    getHistoryEx(
        id: string,
        options: ioBroker.GetHistoryOptions,
    ): Promise<{ values: ioBroker.GetHistoryResult; sessionId: string; stepIgnore: number }> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit(
                'getHistory',
                id,
                options,
                (err: string | null, values: ioBroker.GetHistoryResult, stepIgnore: number, sessionId: string) =>
                    err ? reject(new Error(err)) : resolve({ values, sessionId, stepIgnore }),
            );
        });
    }

    /**
     * Change the password of the given user.
     */
    changePassword(user: string, password: string): Promise<void> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('changePassword', user, password, (err: string | null) =>
                err ? reject(new Error(err)) : resolve(),
            );
        });
    }

    /**
     * Get the IP addresses of the given host.
     */
    getIpAddresses(
        host: string,
        /** Force update. */
        update?: boolean,
    ): Promise<string[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!host.startsWith('system.host.')) {
            host = `system.host.${host}`;
        }

        if (!update && this._promises[`IPs_${host}`] instanceof Promise) {
            return this._promises[`IPs_${host}`];
        }
        this._promises[`IPs_${host}`] = this.getObject(host).then(obj => (obj?.common ? obj.common.address || [] : []));

        return this._promises[`IPs_${host}`];
    }

    /**
     * Get the IP addresses with interface names of the given host or find host by IP.
     */
    getHostByIp(
        ipOrHostName: string,
        /** Force update. */
        update?: boolean,
    ): Promise<{ name: string; address: string; family: 'ipv4' | 'ipv6' }[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (ipOrHostName.startsWith('system.host.')) {
            ipOrHostName = ipOrHostName.replace(/^system\.host\./, '');
        }

        if (!update && this._promises[`rIPs_${ipOrHostName}`] instanceof Promise) {
            return this._promises[`rIPs_${ipOrHostName}`] as Promise<
                { name: string; address: string; family: 'ipv4' | 'ipv6' }[]
            >;
        }
        this._promises[`rIPs_${ipOrHostName}`] = new Promise(resolve => {
            this._socket.emit('getHostByIp', ipOrHostName, (_ip: string, host: any) => {
                const IPs4: {
                    name: string;
                    address: string;
                    family: 'ipv4' | 'ipv6';
                }[] = [{ name: '[IPv4] 0.0.0.0 - Listen on all IPs', address: '0.0.0.0', family: 'ipv4' }];
                const IPs6: {
                    name: string;
                    address: string;
                    family: 'ipv4' | 'ipv6';
                }[] = [{ name: '[IPv6] :: - Listen on all IPs', address: '::', family: 'ipv6' }];
                if (host?.native?.hardware?.networkInterfaces) {
                    for (const eth in host.native.hardware.networkInterfaces) {
                        if (!Object.prototype.hasOwnProperty.call(host.native.hardware.networkInterfaces, eth)) {
                            continue;
                        }
                        for (let num = 0; num < host.native.hardware.networkInterfaces[eth].length; num++) {
                            if (host.native.hardware.networkInterfaces[eth][num].family !== 'IPv6') {
                                IPs4.push({
                                    name: `[${host.native.hardware.networkInterfaces[eth][num].family}] ${host.native.hardware.networkInterfaces[eth][num].address} - ${eth}`,
                                    address: host.native.hardware.networkInterfaces[eth][num].address,
                                    family: 'ipv4',
                                });
                            } else {
                                IPs6.push({
                                    name: `[${host.native.hardware.networkInterfaces[eth][num].family}] ${host.native.hardware.networkInterfaces[eth][num].address} - ${eth}`,
                                    address: host.native.hardware.networkInterfaces[eth][num].address,
                                    family: 'ipv6',
                                });
                            }
                        }
                    }
                }
                for (let i = 0; i < IPs6.length; i++) {
                    IPs4.push(IPs6[i]);
                }
                resolve(IPs4);
            });
        });

        return this._promises[`rIPs_${ipOrHostName}`] as Promise<
            { name: string; address: string; family: 'ipv4' | 'ipv6' }[]
        >;
    }

    /**
     * Encrypt a text
     */
    encrypt(text: string): Promise<string> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('encrypt', text, (err: string | null, _text: string) =>
                err ? reject(new Error(err)) : resolve(_text),
            );
        });
    }

    /**
     * Decrypt a text
     */
    decrypt(encryptedText: string): Promise<string> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('decrypt', encryptedText, (err: string | null, text: string) =>
                err ? reject(new Error(err)) : resolve(text),
            );
        });
    }

    /**
     * Gets the version.
     */
    getVersion(update?: boolean): Promise<{ version: string; serverName: string }> {
        if (!update && this._promises.version instanceof Promise) {
            return this._promises.version;
        }

        this._promises.version = new Promise((resolve, reject) => {
            this._socket.emit('getVersion', (err: string | null, version: string, serverName: string) => {
                // support of old socket.io
                if (err && !version && typeof err === 'string' && err.match(/\d+\.\d+\.\d+/)) {
                    resolve({ version: err, serverName: 'socketio' });
                } else {
                    err ? reject(new Error(err)) : resolve({ version, serverName });
                }
            });
        });

        return this._promises.version;
    }

    /**
     * Gets the web server name.
     */
    getWebServerName(): Promise<string> {
        if (this._promises.webName instanceof Promise) {
            return this._promises.webName;
        }

        this._promises.webName = new Promise((resolve, reject) => {
            this._socket.emit('getAdapterName', (err: string | null, name: string) =>
                err ? reject(new Error(err)) : resolve(name),
            );
        });

        return this._promises.webName;
    }

    /**
     * Gets the admin version.
     *
     * @deprecated use getVersion()
     */
    getAdminVersion(): Promise<{ version: string; serverName: string }> {
        console.log('Deprecated: use getVersion');
        return this.getVersion();
    }

    /**
     * Change access rights for a file
     *
     * @param adapter The adapter name.
     * @param fileName file name with a full path. It could be like vis.0/*
     * @param options like {mode: 0x644}
     * @param options.mode Access rights. Default is 0x644
     */
    chmodFile(
        adapter: string,
        fileName: string,
        options?: { mode: number },
    ): Promise<{ entries: ioBroker.ChownFileResult[]; id: string }> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit(
                'chmodFile',
                adapter,
                fileName,
                options,
                (err: string | null, entries: ioBroker.ChownFileResult[], id: string) =>
                    err ? reject(new Error(err)) : resolve({ entries, id }),
            );
        });
    }

    /**
     * Change an owner or/and owner group for a file
     *
     * @param adapter The adapter name.
     * @param fileName file name with a full path. It could be like vis.0/*
     * @param options like {owner: 'user', ownerGroup: 'group'}
     * @param options.owner User name
     * @param options.ownerGroup Group name
     */
    chownFile(
        adapter: string,
        fileName: string,
        options: { owner?: string; ownerGroup?: string },
    ): Promise<{ entries: ioBroker.ChownFileResult[]; id: string }> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit(
                'chownFile',
                adapter,
                fileName,
                options,
                (err: string | null, entries: ioBroker.ChownFileResult[], id: string) =>
                    err ? reject(new Error(err)) : resolve({ entries, id }),
            );
        });
    }

    /**
     * Check if the file exists
     *
     * @param adapter The adapter name.
     * @param fileName file name with a full path. It could be like vis.0/*
     */
    fileExists(adapter: string, fileName: string): Promise<boolean> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('fileExists', adapter, fileName, (err: string | null, exists: boolean) =>
                err ? reject(new Error(err)) : resolve(exists),
            );
        });
    }

    /**
     * Get the alarm notifications from a host (only for admin connection).
     */
    getNotifications(host: string, category?: string): Promise<FilteredNotificationInformation> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise(resolve => {
            this._socket.emit(
                'sendToHost',
                host,
                'getNotifications',
                { category },
                (notifications: FilteredNotificationInformation) => resolve(notifications),
            );
        });
    }

    /**
     * Clear the alarm notifications on a host (only for admin connection).
     *
     * @param host The host name.
     * @param category optional
     */
    clearNotifications(host: string, category?: string): Promise<{ result: 'ok' }> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise(resolve => {
            this._socket.emit('sendToHost', host, 'clearNotifications', { category }, (result: { result: 'ok' }) =>
                resolve(result),
            );
        });
    }

    /**
     * Read if only easy mode is allowed (only for admin connection).
     */
    getIsEasyModeStrict(): Promise<boolean> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('getIsEasyModeStrict', (error: null | string, isStrict: boolean) =>
                error ? reject(new Error(error)) : resolve(isStrict),
            );
        });
    }

    /**
     * Read easy mode configuration (only for admin connection).
     */
    getEasyMode(): Promise<any> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('getEasyMode', (error: string | null, config: any) =>
                error ? reject(new Error(error)) : resolve(config),
            );
        });
    }

    /**
     * Read current user
     */
    getCurrentUser(): Promise<string> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise(resolve => {
            this._socket.emit('authEnabled', (_isSecure: boolean, user: string) => resolve(user));
        });
    }

    getCurrentSession(cmdTimeout?: number): Promise<{ expireInSec: number }> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            const controller = new AbortController();

            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    controller.abort();
                    reject(new Error('getCurrentSession timeout'));
                }
            }, cmdTimeout || 5000);

            fetch('./session', { signal: controller.signal })
                .then(res => res.json())
                .then(json => {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        resolve(json);
                    }
                })
                .catch(e => reject(new Error(`getCurrentSession: ${e}`)));
        });
    }

    /**
     * Read adapter ratings
     */
    getRatings(update?: boolean): Promise<any> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('getRatings', update, (err: string | null, ratings: any) =>
                err ? reject(new Error(err)) : resolve(ratings),
            );
        });
    }

    /**
     * Read current web, socketio or admin namespace, like admin.0
     */
    getCurrentInstance(): Promise<string> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (this._promises.currentInstance instanceof Promise) {
            return this._promises.currentInstance;
        }

        this._promises.currentInstance = new Promise((resolve, reject) => {
            this._socket.emit('getCurrentInstance', (err: string | null, namespace: string) =>
                err ? reject(new Error(err)) : resolve(namespace),
            );
        });

        return this._promises.currentInstance;
    }

    // returns very optimized information for adapters to minimize a connection load
    getCompactAdapters(update?: boolean): Promise<Record<string, ioBroker.AdapterObject>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.compactAdapters instanceof Promise) {
            return this._promises.compactAdapters;
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        this._promises.compactAdapters = new Promise((resolve, reject) => {
            this._socket.emit(
                'getCompactAdapters',
                (err: string | null, adapters: Record<string, ioBroker.AdapterObject>) =>
                    err ? reject(new Error(err)) : resolve(adapters),
            );
        });

        return this._promises.compactAdapters;
    }

    getAdaptersResetCache(adapter?: string): void {
        adapter = adapter || '';
        delete this._promises.compactAdapters;
        delete this._promises[`adapter_${adapter}`];
    }

    // returns very optimized information for adapters to minimize a connection load
    getCompactInstances(update?: boolean): Promise<Record<string, ioBroker.InstanceObject>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.compactInstances instanceof Promise) {
            return this._promises.compactInstances;
        }
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.compactInstances = new Promise((resolve, reject) => {
            this._socket.emit(
                'getCompactInstances',
                (err: string | null, instances: Record<string, ioBroker.InstanceObject>) =>
                    err ? reject(new Error(err)) : resolve(instances),
            );
        });

        return this._promises.compactInstances;
    }

    getAdapternInstancesResetCache(adapter?: string): void {
        adapter = adapter || '';
        delete this._promises.compactInstances;
        delete this._promises[`instances_${adapter}`];
    }

    /**
     * Returns very optimized information for adapters to minimize a connection load.
     * Reads only version of installed adapter
     */
    getCompactInstalled(
        host: string,
        update?: boolean,
        cmdTimeout?: number,
    ): Promise<Record<string, ioBroker.AdapterObject>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        this._promises.installedCompact = this._promises.installedCompact || {};

        if (!update && this._promises.installedCompact[host] instanceof Promise) {
            return this._promises.installedCompact[host];
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }

        this._promises.installedCompact[host] = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getCompactInstalled timeout'));
                }
            }, cmdTimeout || this.props.cmdTimeout);

            this._socket.emit('getCompactInstalled', host, (data: Record<string, ioBroker.AdapterObject> | string) => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject(new Error('May not read "getCompactInstalled"'));
                    } else if (!data || typeof data !== 'object') {
                        reject(new Error('Cannot read "getCompactInstalled"'));
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises.installedCompact[host];
    }

    // returns very optimized information for adapters to minimize a connection load.
    // reads only version of installed adapter
    getCompactSystemRepositories(update?: boolean, cmdTimeout?: number): Promise<CompactSystemRepository> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!update && this._promises.getCompactSystemRepositories instanceof Promise) {
            return this._promises.getCompactSystemRepositories;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.getCompactSystemRepositories = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getCompactSystemRepositories timeout'));
                }
            }, cmdTimeout || this.props.cmdTimeout);

            this._socket.emit('getCompactSystemRepositories', (data: CompactSystemRepository | string) => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject(new Error('May not read "getCompactSystemRepositories"'));
                    } else if (!data || typeof data !== 'object') {
                        reject(new Error('Cannot read "getCompactSystemRepositories"'));
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises.getCompactSystemRepositories;
    }

    // returns very optimized information for adapters to minimize a connection load
    getCompactSystemConfig(update?: boolean): Promise<ioBroker.SystemConfigObject> {
        if (!update && this._promises.systemConfigPromise instanceof Promise) {
            return this._promises.systemConfigPromise;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.systemConfigPromise = new Promise((resolve, reject) => {
            this._socket.emit(
                'getCompactSystemConfig',
                (err: string | null, systemConfig: ioBroker.SystemConfigObject) =>
                    err ? reject(new Error(err)) : resolve(systemConfig),
            );
        });

        return this._promises.systemConfigPromise;
    }

    /**
     * Get the repository in compact form (only version and icon).
     *
     * @param host The host name.
     * @param update Force update.
     * @param timeoutMs timeout in ms.
     */
    getCompactRepository(
        host: string,
        update?: boolean,
        timeoutMs?: number,
    ): Promise<Record<string, { version: string; icon: string }>> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }

        if (!update && this._promises.repoCompact instanceof Promise) {
            return this._promises.repoCompact;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        if (!host.startsWith('system.host.')) {
            host += `system.host.${host}`;
        }

        this._promises.repoCompact = new Promise((resolve, reject) => {
            let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject(new Error('getCompactRepository timeout'));
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit(
                'getCompactRepository',
                host,
                (data: Record<string, { version: string; icon: string }> | string) => {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        if (data === PERMISSION_ERROR) {
                            reject(new Error('May not read "getCompactRepository"'));
                        } else if (!data) {
                            reject(new Error('Cannot read "getCompactRepository"'));
                        } else {
                            resolve(data);
                        }
                    }
                },
            );
        });

        return this._promises.repoCompact;
    }

    getInstalledResetCache(): void {
        delete this._promises.repoCompact;
        delete this._promises.repo;
    }

    /**
     * Get the list of all hosts in compact form (only _id, common.name, common.icon, common.color, native.hardware.networkInterfaces)
     */
    getCompactHosts(update?: boolean): Promise<ioBroker.HostObject[]> {
        if (LegacyConnection.isWeb()) {
            return Promise.reject(new Error('Allowed only in admin'));
        }
        if (!update && this._promises.hostsCompact instanceof Promise) {
            return this._promises.hostsCompact;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.hostsCompact = new Promise((resolve, reject) => {
            this._socket.emit('getCompactHosts', (err: string | null, hosts: ioBroker.HostObject[]) =>
                err ? reject(new Error(err)) : resolve(hosts),
            );
        });

        return this._promises.hostsCompact;
    }

    /**
     * Get uuid
     */
    getUuid(): Promise<string | undefined> {
        if (this._promises.uuid instanceof Promise) {
            return this._promises.uuid;
        }

        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        this._promises.uuid = this.getObject('system.meta.uuid').then(obj => obj?.native?.uuid);

        return this._promises.uuid;
    }

    /**
     * Subscribe on instance message
     *
     * @param targetInstance instance, like 'cameras.0'
     * @param  messageType message type like 'startCamera/cam3'
     * @param data optional data object
     * @param callback message handler
     */
    subscribeOnInstance(
        targetInstance: string,
        messageType: string,
        data: any,
        callback: (_data: Record<string, any>, sourceInstance: string, _messageType: string) => void,
    ): Promise<{ error?: string; accepted?: boolean; heartbeat?: number }> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }
        return new Promise((resolve, reject) => {
            this._socket.emit(
                'clientSubscribe',
                targetInstance,
                messageType,
                data,
                (err: string | null, result: { error?: string; accepted?: boolean; heartbeat?: number }) => {
                    if (err) {
                        reject(new Error(err));
                    } else if (result?.error) {
                        reject(new Error(result.error));
                    } else {
                        if (!targetInstance.startsWith('system.adapter.')) {
                            targetInstance = `system.adapter.${targetInstance}`;
                        }
                        // save callback
                        this._instanceSubscriptions[targetInstance] = this._instanceSubscriptions[targetInstance] || [];
                        if (
                            !this._instanceSubscriptions[targetInstance].find(
                                sub => sub.messageType === messageType && sub.callback === callback,
                            )
                        ) {
                            this._instanceSubscriptions[targetInstance].push({
                                messageType,
                                callback,
                            });
                        }
                        resolve(result);
                    }
                },
            );
        });
    }

    /**
     * Unsubscribe from instance message
     *
     * @param targetInstance instance, like 'cameras.0'
     * @param messageType message type like 'startCamera/cam3'
     * @param callback message handler. Could be null if all callbacks for this messageType should be unsubscribed
     */
    unsubscribeFromInstance(
        targetInstance: string,
        messageType?: string,
        callback?: (data: Record<string, any>, sourceInstance: string, _messageType: string) => void,
    ): Promise<boolean> {
        if (!targetInstance.startsWith('system.adapter.')) {
            targetInstance = `system.adapter.${targetInstance}`;
        }
        let deleted;
        const promiseResults: Promise<boolean>[] = [];
        do {
            deleted = false;
            const index = this._instanceSubscriptions[targetInstance]?.findIndex(
                sub => (!messageType || sub.messageType === messageType) && (!callback || sub.callback === callback),
            );

            if (index !== undefined && index !== null && index !== -1) {
                deleted = true;
                // remember messageType
                const _messageType = this._instanceSubscriptions[targetInstance][index].messageType;

                this._instanceSubscriptions[targetInstance].splice(index, 1);
                if (!this._instanceSubscriptions[targetInstance].length) {
                    delete this._instanceSubscriptions[targetInstance];
                }

                // try to find another subscription for this instance and messageType
                const found =
                    this._instanceSubscriptions[targetInstance] &&
                    this._instanceSubscriptions[targetInstance].find(sub => sub.messageType === _messageType);

                if (!found) {
                    promiseResults.push(
                        new Promise((resolve, reject) => {
                            this._socket.emit(
                                'clientUnsubscribe',
                                targetInstance,
                                messageType,
                                (err: string | null, wasSubscribed: boolean) => {
                                    if (err) {
                                        reject(new Error(err));
                                    } else {
                                        resolve(wasSubscribed);
                                    }
                                },
                            );
                        }),
                    );
                }
            }
        } while (deleted && (!callback || !messageType));

        if (promiseResults.length) {
            return Promise.all(promiseResults).then((results: boolean[]) => results.find(result => result) || false);
        }

        return Promise.resolve(false);
    }

    /**
     * Send log to ioBroker log
     */
    log(text: string, level?: 'info' | 'debug' | 'warn' | 'error' | 'silly'): void {
        text && this._socket.emit('log', text, level || 'debug');
    }

    /**
     * Logout current user
     */
    logout(): Promise<void> {
        if (!this.connected) {
            return Promise.reject(new Error(NOT_CONNECTED));
        }

        return new Promise((resolve, reject) => {
            this._socket.emit('logout', (err: string | null) => (err ? reject(new Error(err)) : resolve()));
        });
    }

    /**
     * This is a special method for vis.
     * It is used to not send to server the changes about "nothing_selected" state
     *
     * @param id The state that has to be ignored by communication
     */
    setStateToIgnore(id?: string | null): void {
        this.ignoreState = id || '';
    }
}
