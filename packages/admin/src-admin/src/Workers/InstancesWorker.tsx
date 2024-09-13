import { type AdminConnection } from '@iobroker/adapter-react-v5';
import AdminUtils from '../AdminUtils';

export type InstanceEventType = 'new' | 'changed' | 'deleted';

export interface InstanceEvent {
    id: string;
    obj?: ioBroker.InstanceObject;
    type: InstanceEventType;
    oldObj?: ioBroker.InstanceObject;
}

export default class InstancesWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: InstanceEvent[]) => void)[];

    private promise: Promise<void | Record<string, ioBroker.InstanceObject>> | null;

    private forceUpdate: boolean;

    private connected: boolean;

    private objects: Record<string, ioBroker.InstanceObject> | null;

    constructor(socket: AdminConnection) {
        this.socket = socket;
        this.handlers = [];
        this.promise = null;
        this.forceUpdate = false;

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id: string, obj?: ioBroker.InstanceObject) => {
        this.objects = this.objects || {};
        // if instance
        if (id.match(/^system\.adapter\.[^.]+\.\d+$/)) {
            let type: InstanceEventType;
            let oldObj: ioBroker.InstanceObject | undefined;
            if (obj) {
                if (obj.type !== 'instance') {
                    return;
                }

                AdminUtils.fixAdminUI(obj);

                if (this.objects[id]) {
                    oldObj = this.objects[id];
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
                oldObj = this.objects[id];
                type = 'deleted';
                delete this.objects[id];
            } else {
                // deleted unknown instance
                return;
            }

            this.promise = null;
            this.socket.getAdapterInstancesResetCache('');
            this.forceUpdate = true;

            this.handlers.forEach(cb =>
                cb([
                    {
                        id,
                        obj,
                        type,
                        oldObj,
                    },
                ])
            );
        }
    };

    isForceUpdate() {
        return this.forceUpdate;
    }

    // be careful with this object. Do not change them.
    getInstances(update?: boolean): Promise<void | Record<string, ioBroker.InstanceObject>> {
        if (!update && this.promise) {
            return this.promise;
        }

        update = update || this.forceUpdate;
        this.forceUpdate = false;

        this.promise = this.socket
            .getAdapterInstances('', update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => (this.objects[obj._id] = obj));
                return this.objects;
            })
            .catch(e => window.alert(`Cannot get adapter instances: ${e}`));

        return this.promise;
    }

    connectionHandler = (isConnected: boolean) => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket
                    .subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));

                this.getInstances(true).then(
                    instances =>
                        instances && Object.keys(instances).forEach(id => this.objectChangeHandler(id, instances[id]))
                );
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    };

    registerHandler(cb: (events: InstanceEvent[]) => void, doNotRequestAdapters?: boolean) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket
                    .subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .then(() => !doNotRequestAdapters && this.getInstances())
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: InstanceEvent[]) => void) {
        const pos = this.handlers.indexOf(cb);
        if (pos !== -1) {
            this.handlers.splice(pos, 1);
        }

        if (!this.handlers.length && this.connected) {
            this.socket
                .unsubscribeObject('system.adapter.*', this.objectChangeHandler)
                .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
        }
    }
}
