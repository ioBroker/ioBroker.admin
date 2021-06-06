import Utils from '../Utils'

class ObjectsWorker {
    constructor(socket) {
        this.socket   = socket;
        this.handlers = [];
        this.promise  = null;

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id, obj) => {
        this.objects = this.objects || {};
        // if instance
        let oldObj;
        let type;

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
        } else {
            if (this.objects[id]) {
                oldObj = this.objects[id];
                type = 'deleted';
                delete this.objects[id];
            } else {
                // deleted unknown instance
                type = 'deleted';
            }
        }

        this.handlers.forEach(cb => cb([{ id, obj, type, oldObj }]));
    };

    // be careful with this object. Do not change them.
    getObjects(update) {
        if (!update && this.promise) {
            return this.promise;
        }

        this.promise = this.socket.getObjects(update, true)
            .then(objects => {
                this.objects = objects;
                return this.objects;
            })
            .catch(e => window.alert('Cannot get objects: ' + e));

        return this.promise;
    }

    connectionHandler = isConnected => {
        if (isConnected && !this.connected) {
            this.connected = true;

            if (this.handlers.length) {
                this.socket.subscribeObject('*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on objects: ${e}`));

                this.getObjects(true)
                    .then(instances => Object.keys(instances)
                        .forEach(id => this.objectChangeHandler(id, instances[id])));
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    }

    registerHandler(cb) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb, doNotUnsubscribe) {
        const pos = this.handlers.indexOf(cb);
        pos !== -1 && this.handlers.splice(pos, 1);

        if (!this.handlers.length && this.connected && !doNotUnsubscribe) {
            this.socket.unsubscribeObject('*', this.objectChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }
}

export default ObjectsWorker;
