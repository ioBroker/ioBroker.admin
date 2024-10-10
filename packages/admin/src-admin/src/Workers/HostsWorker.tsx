import type { AdminConnection } from '@iobroker/react-components';
import type { FilteredNotificationInformation } from '@iobroker/socket-client';
import GenericWorker, { type EventType, type GenericEvent } from './GenericWorker';

export type HostEventType = EventType;

export type NotificationAnswer = { result: FilteredNotificationInformation } | null;

export type HostEvent = GenericEvent<'host'>;

export interface HostAliveEvent {
    id: `system.host.${string}`;
    alive: boolean;
    type: HostEventType;
}

export default class HostsWorker extends GenericWorker<'host'> {
    private readonly aliveHandlers: (((events: HostAliveEvent[]) => void) | false)[] = [];

    private readonly notificationsHandlers: ((notifications: Record<string, NotificationAnswer>) => void)[] = [];

    private readonly aliveStates: Record<string, boolean> = {};

    private readonly notificationPromises: Record<string, Promise<Record<string, NotificationAnswer | null>>> = {};

    private notificationTimer: ReturnType<typeof setTimeout> | null = null;

    private subscribeTs: number | undefined;

    constructor(socket: AdminConnection) {
        super(socket, 'system.host', 'host');
        this.aliveHandlers = [];
        this.notificationsHandlers = [];
        this.notificationPromises = {};
        this.aliveStates = {};
    }

    aliveChangeHandler = (id: string, state: ioBroker.State): void => {
        // if instance
        if (id.startsWith('system.host.') && id.endsWith('.alive')) {
            let type: HostEventType;
            id = id.replace(/\.alive$/, '');
            if (state) {
                if (this.aliveStates[id] !== undefined) {
                    if (!!this.aliveStates[id] !== !!state?.val) {
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
            this.aliveHandlers.forEach(
                cb =>
                    cb &&
                    cb([
                        {
                            id: id as `system.host.${string}`,
                            alive: this.aliveStates[id],
                            type,
                        },
                    ]),
            );
        }
    };

    connectionPostHandler(isConnected: boolean): void {
        if (isConnected) {
            if (this.aliveHandlers.length) {
                void this.socket.subscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        } else {
            Object.keys(this.aliveStates).forEach((id: string) => (this.aliveStates[id] = false));
        }
    }

    registerAliveHandler(cb: (events: HostAliveEvent[]) => void): void {
        if (!this.aliveHandlers.includes(cb)) {
            this.aliveHandlers.push(cb);

            if (this.aliveHandlers.length === 1 && this.connected) {
                void this.socket.subscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    unregisterAliveHandler(cb: (events: HostAliveEvent[]) => void): void {
        const pos = this.aliveHandlers.indexOf(cb);
        if (pos !== -1) {
            this.aliveHandlers.splice(pos, 1);
            if (!this.aliveHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    onNotificationHandler = (id: string /* , state */): void => {
        const host = id.replace(/\.notifications\..+$/, '');

        // ignore subscribe events
        if (!this.subscribeTs || Date.now() - this.subscribeTs > 500) {
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
            }

            this.notificationTimer = setTimeout(
                host_ => {
                    this.notificationTimer = null;
                    this.notificationPromises[host_] = this._getNotificationsFromHosts(host_, true);

                    void this.notificationPromises[host_].then(
                        notifications => notifications && this.notificationsHandlers.forEach(cb => cb(notifications)),
                    );
                },
                300,
                host,
            );
        }
    };

    _getNotificationsFromHosts(hostId: string, update?: boolean): Promise<Record<string, NotificationAnswer | null>> {
        if (!update && this.notificationPromises[hostId] instanceof Promise) {
            return this.notificationPromises[hostId];
        }

        this.notificationPromises[hostId] = this.socket.getState(`${hostId}.alive`).then(state => {
            if (state?.val) {
                return this.socket
                    .getNotifications(hostId, '')
                    .then((notifications: NotificationAnswer) => ({ [hostId]: notifications || null }))
                    .catch(e => {
                        console.warn(`Cannot read notifications from "${hostId}": ${e}`);
                        return { [hostId]: null };
                    });
            }
            return { [hostId]: null };
        });

        return this.notificationPromises[hostId];
    }

    async getNotifications(hostId?: string, update?: boolean): Promise<Record<string, NotificationAnswer | null>> {
        if (hostId) {
            return this._getNotificationsFromHosts(hostId, update);
        }

        // get from all hosts
        const hosts = await this.socket.getCompactHosts(update);
        const promises = hosts.map(host => this._getNotificationsFromHosts(host._id, update));
        const pResults = await Promise.all(promises);
        const result: Record<string, NotificationAnswer | null> = {};
        pResults.forEach(r => Object.assign(result, r));
        return result;
    }

    registerNotificationHandler(cb: (notifications: Record<string, NotificationAnswer>) => void): void {
        if (!this.notificationsHandlers.includes(cb)) {
            this.notificationsHandlers.push(cb);

            if (this.notificationsHandlers.length === 1 && this.connected) {
                this.subscribeTs = Date.now();
                void this.socket.subscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }

    unregisterNotificationHandler(cb: (notifications: Record<string, NotificationAnswer>) => void): void {
        const pos = this.notificationsHandlers.indexOf(cb);

        if (pos !== -1) {
            this.notificationsHandlers.splice(pos, 1);
            if (!this.notificationsHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }
}
