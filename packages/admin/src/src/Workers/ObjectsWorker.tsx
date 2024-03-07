import { type AdminConnection } from '@iobroker/adapter-react-v5';
import Utils from '../Utils';

export type ObjectEventType = 'new' | 'changed' | 'deleted';

interface ObjectEvent {
    id: string;
    obj?: ioBroker.Object;
    type: ObjectEventType;
    oldObj?: ioBroker.Object;
}

class ObjectsWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: ObjectEvent[]) => void)[];

    private readonly repositoryHandlers: (() => void)[];

    private promise: Promise<void | Record<string, ioBroker.Object>> | null;

    private connected: boolean;

    private objects: Record<string, ioBroker.Object> | null;

    constructor(socket: AdminConnection) {
        this.socket   = socket;
        this.handlers = [];
        this.promise  = null;

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id: string, obj: ioBroker.Object | null) => {
        this.objects = this.objects || {};
        // if instance
        let oldObj: ioBroker.Object | undefined;
        let type: ObjectEventType;

        if (obj) {
            if (obj.type === 'instance' || obj.type === 'adapter') {
                Utils.fixAdminUI(obj);
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

        this.handlers.forEach(cb => cb([{
            id, obj, type, oldObj,
        }]));
    };

    // be careful with this object. Do not change them.
    getObjects(update?: boolean) {
        if (!update && this.promise) {
            return this.promise;
        }

        this.promise = this.socket.getObjects(update, true)
            .then(objects => {
                this.objects = objects;
                return this.objects;
            })
            .catch(e => window.alert(`Cannot get objects: ${e}`));

        return this.promise;
    }

    connectionHandler = (isConnected: boolean) => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket.subscribeObject('*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on objects: ${e}`));

                this.getObjects(true)
                    .then(objects => objects && Object.keys(objects)
                        .forEach(id => this.objectChangeHandler(id, objects[id])));
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    };

    registerHandler(cb: (events: ObjectEvent[]) => void) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: ObjectEvent[]) => void, doNotUnsubscribe?: boolean) {
        const pos = this.handlers.indexOf(cb);
        pos !== -1 && this.handlers.splice(pos, 1);

        if (!this.handlers.length && this.connected && !doNotUnsubscribe) {
            this.socket.unsubscribeObject('*', this.objectChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }
}

export default ObjectsWorker;
