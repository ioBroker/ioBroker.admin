import { type AdminConnection } from '@iobroker/gui-components';
import AdminUtils from '../helpers/AdminUtils';

export type ObjectEventType = 'new' | 'changed' | 'deleted';

export interface ObjectEvent {
    id: string;
    obj?: ioBroker.Object;
    type: ObjectEventType;
    oldObj?: ioBroker.Object;
}

export class ObjectsWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: ObjectEvent[]) => void)[];

    private promise: Promise<void | Record<string, ioBroker.Object>> | null;

    private connected: boolean;

    private objects: Record<string, ioBroker.Object> | null;

    constructor(socket: AdminConnection) {
        this.socket = socket;
        this.handlers = [];
        this.promise = null;

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id: string, obj: ioBroker.Object | null | undefined): void => {
        this.objects = this.objects || {};
        // if instance
        let oldObj: ioBroker.Object | undefined;
        let type: ObjectEventType;

        if (obj) {
            if (obj.type === 'instance' || obj.type === 'adapter') {
                AdminUtils.fixAdminUI(obj);
            }

            if (this.objects[id]) {
                oldObj = this.objects[id];
                if (JSON.stringify(this.objects[id]) !== JSON.stringify(obj)) {
                    type = 'changed';
                    this.objects[id] = obj;
                } else {
                    // no changes
                    type = 'changed';
                }
            } else {
                type = 'new';
                this.objects[id] = obj;
            }
        } else if (this.objects[id]) {
            oldObj = this.objects[id];
            type = 'deleted';
            delete this.objects[id];
        } else {
            // deleted unknown instance
            type = 'deleted';
        }

        this.handlers.forEach(cb =>
            cb([
                {
                    id,
                    obj: obj || undefined,
                    type,
                    oldObj,
                },
            ]),
        );
    };

    /**
     * All objects of the system. Be careful with the result: do not change it.
     *
     * The read is expensive - the whole object database goes over the connection - so the first one
     * is kept and handed out again. `update` reads anew.
     *
     * @param update read anew instead of handing out what was read before
     */
    getObjects(update?: boolean): Promise<void | Record<string, ioBroker.Object>> {
        if (!update && this.promise instanceof Promise) {
            return this.promise;
        }

        this.promise = this.socket
            // The connection answers a read without `update` from its own map of objects, and admin
            // does not let it fill that - so every read of this worker has to be a forced one, or
            // it comes back empty. The caching above is what keeps it to one read.
            .getObjects(true, true)
            .then((objects: Record<string, ioBroker.Object>) => {
                this.objects = objects;
                return this.objects;
            })
            .catch((e: any) => window.alert(`Cannot get objects: ${e}`));

        return this.promise;
    }

    connectionHandler = (isConnected: boolean): void => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket
                    .subscribeObject('*', this.objectChangeHandler)
                    .catch((e: any) => window.alert(`Cannot subscribe on objects: ${e}`));

                void this.getObjects(true).then(
                    objects => objects && Object.keys(objects).forEach(id => this.objectChangeHandler(id, objects[id])),
                );
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    };

    registerHandler(cb: (events: ObjectEvent[]) => void): void {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket
                    .subscribeObject('*', this.objectChangeHandler)
                    .catch((e: any) => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: ObjectEvent[]) => void, doNotUnsubscribe?: boolean): void {
        const pos = this.handlers.indexOf(cb);
        if (pos !== -1) {
            this.handlers.splice(pos, 1);
        }

        if (!this.handlers.length && this.connected && !doNotUnsubscribe) {
            this.socket
                .unsubscribeObject('*', this.objectChangeHandler)
                .catch((e: any) => window.alert(`Cannot unsubscribe on object: ${e as Error}`));
        }
    }
}
