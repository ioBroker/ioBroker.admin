import type { AdminConnection } from '@iobroker/adapter-react-v5';
import type { FilteredNotificationInformation } from '@iobroker/socket-client';

export type HostEventType = 'new' | 'changed' | 'deleted';

export type NotificationAnswer = { result: FilteredNotificationInformation } | null;

export interface HostEvent {
    id: `system.host.${string}`;
    obj?: ioBroker.HostObject;
    type: HostEventType;
    oldObj?: ioBroker.HostObject;
}

export interface HostAliveEvent {
    id: `system.host.${string}`;
    alive: boolean;
    type: HostEventType;
}

export default class HostsWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: HostEvent[]) => void)[];

    private readonly aliveHandlers: (((events: HostAliveEvent[]) => void) | false)[];

    private readonly notificationsHandlers: ((notifications: Record<string, NotificationAnswer>) => void)[];

    private promise: Promise<void | Record<string, ioBroker.HostObject>> | null;

    private connected: boolean;

    private objects: Record<string, ioBroker.HostObject> | null;

    private readonly aliveStates: Record<string, boolean>;

    private readonly notificationPromises: Record<string, Promise<Record<string, NotificationAnswer | null>>>;

    private notificationTimer: ReturnType<typeof setTimeout> | null;

    private subscribeTs: number | undefined;

    constructor(socket: AdminConnection) {
        this.socket = socket;
        this.handlers = [];
        this.aliveHandlers = [];
        this.notificationsHandlers = [];
        this.promise = null;
        this.notificationPromises = {};

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();
        console.log(`Connected: ${this.connected}`);
        this.objects = {};
        this.aliveStates = {};
        if (this.connected) {
            this.connectionHandler(true);
        }
    }

    objectChangeHandler = (id: string, obj: ioBroker.HostObject) => {
        // if host
        if (id.startsWith('system.host.')) {
            let type: HostEventType;
            let oldObj: ioBroker.HostObject | undefined;
            if (obj) {
                if (obj.type !== 'host') {
                    return;
                }

                if (this.objects[id]) {
                    if (JSON.stringify(this.objects[id]) !== JSON.stringify(obj)) {
                        type = 'changed';
                        this.objects[id] = obj;
                    } else {
                        // no changes
                        return;
                    }
                } else {
                    type = 'new';
                    this.objects[id] = obj;
                }
            } else if (this.objects[id]) {
                type = 'deleted';
                oldObj = this.objects[id];
                delete this.objects[id];
            } else {
                // deleted unknown instance
                return;
            }

            this.handlers.forEach(cb => cb([{
                id: id as `system.host.${string}`,
                obj,
                type,
                oldObj,
            }]));
        }
    };

    aliveChangeHandler = (id: string, state: ioBroker.State) => {
        // if instance
        if (id.startsWith('system.host.') && id.endsWith('.alive')) {
            let type: HostEventType;
            id = id.replace(/\.alive$/, '');
            if (state) {
                if (this.aliveStates[id] !== undefined) {
                    if ((!!this.aliveStates[id]) !== (!!state?.val)) {
                        type = 'changed';
                        this.aliveStates[id] = !!state?.val;
                    } else {
                        // no changes
                        return;
                    }
                } else {
                    type = 'new';
                    this.aliveStates[id] = !!state?.val;
                }
            } else if (this.aliveStates[id]) {
                type = 'deleted';
                delete this.aliveStates[id];
            } else {
                // deleted unknown instance
                return;
            }
            this.aliveHandlers.forEach(cb => cb && cb([{
                id: id as `system.host.${string}`,
                alive: this.aliveStates[id],
                type,
            }]));
        }
    };

    getHosts(update?: boolean) {
        if (!update && this.promise) {
            return this.promise;
        }

        this.promise = this.socket.getHosts(update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                return this.objects;
            })
            .catch(e => window.alert(`Cannot get hosts: ${e}`));

        return this.promise;
    }

    connectionHandler = (isConnected: boolean) => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket.subscribeObject('system.host.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));

                // read all hosts anew and inform about it
                this.getHosts(true)
                    .then(hosts => hosts && Object.keys(hosts)
                        .forEach(id => this.objectChangeHandler(id, hosts[id])));
            }
            if (this.aliveHandlers.length) {
                this.socket.subscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
            Object.keys(this.aliveStates)
                .forEach((id: string) => this.aliveStates[id] = false);
        }
    };

    registerHandler(cb: (events: HostEvent[]) => void) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('system.host.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: HostEvent[]) => void) {
        const pos = this.handlers.indexOf(cb);
        if (pos !== -1) {
            this.handlers.splice(pos, 1);
            if (!this.handlers.length && this.connected) {
                this.socket.unsubscribeObject('system.host.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    registerAliveHandler(cb: (events: HostAliveEvent[]) => void) {
        if (!this.aliveHandlers.includes(cb)) {
            this.aliveHandlers.push(cb);

            if (this.aliveHandlers.length === 1 && this.connected) {
                this.socket.subscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    unregisterAliveHandler(cb: (events: HostAliveEvent[]) => void) {
        const pos = this.aliveHandlers.indexOf(cb);
        if (pos !== -1) {
            this.aliveHandlers.splice(pos, 1);
            if (!this.aliveHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    onNotificationHandler = (id: string /* , state */) => {
        const host = id.replace(/\.notifications\..+$/, '');

        // ignore subscribe events
        if (!this.subscribeTs || Date.now() - this.subscribeTs > 500) {
            this.notificationTimer && clearTimeout(this.notificationTimer);

            this.notificationTimer = setTimeout(host_ => {
                this.notificationTimer = null;
                this.notificationPromises[host_] = this._getNotificationsFromHosts(host_, true);

                this.notificationPromises[host_]
                    .then(notifications =>
                        notifications && this.notificationsHandlers.forEach(cb => cb(notifications)));
            }, 300, host);
        }
    };

    _getNotificationsFromHosts(hostId: string, update?: boolean): Promise<Record<string, NotificationAnswer | null>> {
        if (!update && this.notificationPromises[hostId]) {
            return this.notificationPromises[hostId];
        }

        this.notificationPromises[hostId] = this.socket.getState(`${hostId}.alive`)
            .then(state => {
                if (state?.val) {
                    return this.socket.getNotifications(hostId, '')
                        .then((notifications: NotificationAnswer) =>
                            ({ [hostId]: notifications || null }))
                        .catch(e => {
                            console.warn(`Cannot read notifications from "${hostId}": ${e}`);
                            return { [hostId]: null };
                        });
                }
                return { [hostId]: null };
            });

        return this.notificationPromises[hostId];
    }

    async getNotifications(hostId?: string, update?: boolean): Promise<Record<string, NotificationAnswer | null >> {
        if (hostId) {
            return this._getNotificationsFromHosts(hostId, update);
        }

        // get from all hosts
        const hosts = await this.socket.getCompactHosts(update);
        const promises = hosts
            .map(host => this._getNotificationsFromHosts(host._id, update));
        const pResults = await Promise.all(promises);
        const result: Record<string, NotificationAnswer | null> = {};
        pResults.forEach(r => Object.assign(result, r));
        return result;
    }

    registerNotificationHandler(cb: (notifications: Record<string, NotificationAnswer>) => void) {
        if (!this.notificationsHandlers.includes(cb)) {
            this.notificationsHandlers.push(cb);

            if (this.notificationsHandlers.length === 1 && this.connected) {
                this.subscribeTs = Date.now();
                this.socket.subscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }

    unregisterNotificationHandler(cb: (notifications: Record<string, NotificationAnswer>) => void) {
        const pos = this.notificationsHandlers.indexOf(cb);

        if (pos !== -1) {
            this.notificationsHandlers.splice(pos, 1);
            if (!this.notificationsHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }
}
