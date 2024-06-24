import { type AdminConnection } from '@iobroker/adapter-react-v5';
import AdminUtils from '../AdminUtils';

export type AdapterEventType = 'new' | 'changed' | 'deleted';

export interface AdapterEvent {
    id: string;
    obj?: ioBroker.AdapterObject;
    type: AdapterEventType;
    oldObj?: ioBroker.AdapterObject;
}

export default class AdaptersWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: AdapterEvent[]) => void)[];

    private readonly repositoryHandlers: (() => void)[];

    private promise: Promise<void | Record<string, ioBroker.AdapterObject>> | null;

    private forceUpdate: boolean;

    private connected: boolean;

    private objects: Record<string, ioBroker.AdapterObject> | null;

    private repoTimer: ReturnType<typeof setTimeout> | null;

    constructor(socket: AdminConnection) {
        this.socket   = socket;
        this.handlers = [];
        this.repositoryHandlers = [];
        this.promise  = null;
        this.forceUpdate = false;

        socket.registerConnectionHandler(this.connectionHandler);
        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id: string, obj: ioBroker.AdapterObject) => {
        this.objects = this.objects || {};
        // if instance
        if (id.match(/^system\.adapter\.[^.]+$/)) {
            let type: AdapterEventType;
            let oldObj: ioBroker.AdapterObject | undefined;

            if (obj) {
                if (obj.type !== 'adapter') {
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

            this.socket.getAdaptersResetCache();
            this.socket.getInstalledResetCache('');
            this.forceUpdate = true;
            this.promise = null;

            this.handlers.forEach(cb => cb([{
                id, obj, type, oldObj,
            }]));
        }
    };

    isForceUpdate() {
        return this.forceUpdate;
    }

    // be careful with this object. Do not change them.
    getAdapters(update?: boolean) {
        if (!update && this.promise) {
            return this.promise;
        }

        update = update || this.forceUpdate;
        this.forceUpdate = false;

        this.promise = this.socket.getAdapters(null, update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                return this.objects;
            })
            .catch(e => window.alert(`Cannot get adapters: ${e}`));

        return this.promise;
    }

    connectionHandler = (isConnected: boolean) => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket.subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));

                this.getAdapters(true)
                    .then(adapters => adapters && Object.keys(adapters)
                        .forEach(id => this.objectChangeHandler(id, adapters[id])));
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    };

    registerHandler(cb: (events: AdapterEvent[]) => void) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: AdapterEvent[]) => void) {
        const pos = this.handlers.indexOf(cb);
        pos !== -1 && this.handlers.splice(pos, 1);

        if (!this.handlers.length && this.connected) {
            this.socket.unsubscribeObject('system.adapter.*', this.objectChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }

    repoChangeHandler = (/* id, obj */) => {
        this.repoTimer && clearTimeout(this.repoTimer);
        this.repoTimer = setTimeout(() => {
            this.repoTimer = null;
            this.repositoryHandlers.forEach(cb => cb());
        }, 500);
    };

    registerRepositoryHandler(cb: () => void) {
        if (!this.repositoryHandlers.includes(cb)) {
            this.repositoryHandlers.push(cb);

            if (this.repositoryHandlers.length === 1 && this.connected) {
                this.socket.subscribeObject('system.repositories', this.repoChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterRepositoryHandler(cb: () => void) {
        const pos = this.repositoryHandlers.indexOf(cb);
        pos !== -1 && this.repositoryHandlers.splice(pos, 1);

        if (!this.repositoryHandlers.length && this.connected) {
            this.socket.unsubscribeObject('system.repositories', this.repoChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }
}
