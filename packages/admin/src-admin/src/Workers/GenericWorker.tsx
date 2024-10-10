import type { AdminConnection } from '@iobroker/react-components';
import AdminUtils from '@/helpers/AdminUtils';

export type EventType = 'new' | 'changed' | 'deleted';

export type GetObjectFromType<T extends ioBroker.ObjectType> = T extends 'host'
    ? ioBroker.HostObject
    : T extends 'adapter'
      ? ioBroker.AdapterObject
      : T extends 'instance'
        ? ioBroker.InstanceObject
        : T extends 'meta'
          ? ioBroker.MetaObject
          : T extends 'device'
            ? ioBroker.DeviceObject
            : T extends 'channel'
              ? ioBroker.ChannelObject
              : T extends 'state'
                ? ioBroker.StateObject
                : T extends 'folder'
                  ? ioBroker.FolderObject
                  : T extends 'enum'
                    ? ioBroker.EnumObject
                    : T extends 'script'
                      ? ioBroker.ScriptObject
                      : T extends 'group'
                        ? ioBroker.GroupObject
                        : T extends 'user'
                          ? ioBroker.UserObject
                          : T extends 'chart'
                            ? ioBroker.ChartObject
                            : T extends 'schedule'
                              ? ioBroker.ScheduleObject
                              : ioBroker.Object;

type GetRootFromType<T extends ioBroker.ObjectType> = T extends 'host'
    ? `system.host.${string}`
    : T extends 'adapter'
      ? `system.adapter.${string}` | `system.host.${string}.adapter.${string}`
      : T extends 'instance'
        ? `system.adapter.${string}.${number}`
        : T extends 'enum'
          ? `system.enum.${string}`
          : T extends 'script'
            ? `script.js.${string}`
            : T extends 'group'
              ? `system.group.${string}`
              : T extends 'user'
                ? `system.user.${string}`
                : string;

export type GenericEvent<T extends ioBroker.ObjectType> = {
    id: GetRootFromType<T>;
    obj?: GetObjectFromType<T>;
    type: EventType;
    oldObj?: GetObjectFromType<T>;
};

export default class GenericWorker<T extends ioBroker.ObjectType> {
    protected readonly socket: AdminConnection;

    protected readonly handlers: ((events: GenericEvent<T>[]) => void)[] = [];

    private promise: Promise<null | Record<string, GetObjectFromType<T>>> | null = null;

    protected connected: boolean;

    protected objects: Record<string, GetObjectFromType<T>> | null = null;

    private readonly root: string;

    protected readonly objectType: ioBroker.ObjectType;

    private forceUpdate: boolean = false;

    protected constructor(socket: AdminConnection, root: string, objectType: ioBroker.ObjectType) {
        this.socket = socket;
        this.root = root;
        this.objectType = objectType;

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();
        if (this.connected) {
            this.connectionHandler(true);
        }
    }

    protected checkObjectId(id: string, obj: GetObjectFromType<T> | null | undefined): boolean {
        return id.startsWith(`${this.root}.`) && (!obj || obj.type === this.objectType);
    }

    // eslint-disable-next-line class-methods-use-this
    protected postProcessing(_id: string, _obj: GetObjectFromType<T> | null | undefined): void {
        // can be overridden in the child class
    }

    isForceUpdate(): boolean {
        return this.forceUpdate;
    }

    objectChangeHandler = (id: GetRootFromType<T>, obj: GetObjectFromType<T> | null | undefined): void => {
        this.objects = this.objects || {};

        // if our object
        if (this.checkObjectId(id, obj)) {
            let type: EventType;
            let oldObj: GetObjectFromType<T> | undefined;
            if (obj) {
                if (this.objectType === 'adapter' || this.objectType === 'instance') {
                    AdminUtils.fixAdminUI(obj);
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
                // deleted unknown object
                return;
            }

            this.forceUpdate = true;

            this.postProcessing(id, obj);

            this.handlers.forEach(cb =>
                cb([
                    {
                        id,
                        obj,
                        type,
                        oldObj,
                    },
                ]),
            );
        }
    };

    getObjects(update?: boolean): Promise<null | Record<string, GetObjectFromType<T>>> {
        update = update || this.forceUpdate;
        this.forceUpdate = false;

        if (!update && this.promise instanceof Promise) {
            return this.promise;
        }

        this.promise = this.socket
            .getObjectViewSystem(
                this.objectType,
                this.root ? `${this.root}.` : '',
                this.root ? `${this.root}.\u9999` : '\u9999',
            )
            .then(objects => {
                this.objects = objects as Record<string, GetObjectFromType<T>>;
                if (this.objectType === 'adapter' || this.objectType === 'instance') {
                    Object.keys(this.objects).forEach(id => AdminUtils.fixAdminUI(this.objects[id]));
                }

                return this.objects;
            })
            .catch(e => {
                window.alert(`Cannot get objects of type ${this.objectType}, with root "${this.root}": ${e}`);
                return null;
            });

        return this.promise;
    }

    // eslint-disable-next-line class-methods-use-this
    protected connectionPostHandler(_isConnected: boolean): void {}

    connectionHandler = (isConnected: boolean): void => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket
                    .subscribeObject(this.root ? `${this.root}.*` : '*', this.objectChangeHandler)
                    .then(() => {
                        // read all hosts anew and inform about it
                        void this.getObjects(true).then(objects => {
                            if (objects) {
                                Object.keys(objects).forEach(id =>
                                    this.objectChangeHandler(id as GetRootFromType<T>, objects[id]),
                                );
                            }
                        });
                    })
                    .catch(e => window.alert(`Cannot subscribe on object "${this.root}": ${e}`));
            }
            this.connectionPostHandler(true);
        } else if (!isConnected && this.connected) {
            this.connected = false;
            this.connectionPostHandler(false);
        }
    };

    registerHandler(cb: (events: GenericEvent<T>[]) => void, doNotRequestObjects?: boolean): void {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket
                    .subscribeObject(this.root ? `${this.root}.*` : '*', this.objectChangeHandler)
                    .then(() => {
                        if (!doNotRequestObjects) {
                            // read all hosts anew and inform about it
                            void this.getObjects(true).then(objects => {
                                if (objects) {
                                    Object.keys(objects).forEach(id =>
                                        this.objectChangeHandler(id as GetRootFromType<T>, objects[id]),
                                    );
                                }
                            });
                        }
                    })
                    .catch(e => window.alert(`Cannot subscribe on objects "${this.root}": ${e}`));
            }
        }
    }

    unregisterHandler(cb: (events: GenericEvent<T>[]) => void): void {
        const pos = this.handlers.indexOf(cb);
        if (pos !== -1) {
            this.handlers.splice(pos, 1);
            if (!this.handlers.length && this.connected) {
                this.socket
                    .unsubscribeObject(this.root ? `${this.root}.*` : '*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot unsubscribe from objects "${this.root}": ${e}`));
            }
        }
    }

    destroy(): void {
        this.handlers.forEach(cb => this.unregisterHandler(cb));
        this.socket.unregisterConnectionHandler(this.connectionHandler);
    }
}
