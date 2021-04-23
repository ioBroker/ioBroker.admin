class AdaptersWorker {
    constructor(socket) {
        this.socket   = socket;
        this.handlers = [];

        socket.registerConnectionHandler(this.connectionHandler);
        this.connected = this.socket.isConnected();

        this.objects = null;
    }

    objectChangeHandler = (id, obj) => {
        // if instance
        if (id.match(/^system\.adapter\.[^.]+$/)) {
            let type;
            let oldObj;
            if (obj) {
                if (obj.type !== 'adapter') {
                    return;
                }
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
            } else {
                if (this.objects[id]) {
                    oldObj = this.objects[id];
                    type = 'deleted';
                    delete this.objects[id];
                } else {
                    // deleted unknown instance
                    return;
                }
            }

            this.handlers.forEach(cb => cb([{ id, obj, type, oldObj }]));
        }
    };

    // be careful with this object. Do not change them.
    getAdapters(update) {
        if (!this.objects) {
            return this.socket.getAdapters(update)
                .then(objects => {
                    this.objects = {};
                    objects.forEach(obj => this.objects[obj._id] = obj);
                    return this.objects;
                });
        }

        if (!update && this.objects) {
            return Promise.resolve(this.objects);
        }

        return this.socket.getAdapters(update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                return this.objects;
            })
            .catch(e => window.alert('Cannot get adapters: ' + e));
    }

    connectionHandler = isConnected => {
        if (isConnected && !this.connected) {
            this.connected = true;
            if (this.handlers.length) {
                this.socket.subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    }

    registerHandler(cb) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('system.adapter.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb) {
        const pos = this.handlers.indexOf(cb);
        pos !== -1 && this.handlers.splice(pos, 1);

        if (!this.handlers.length && this.connected) {
            this.socket.unsubscribeObject('system.adapter.*', this.objectChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }

    _readAdapters(update) {
        return this.socket.getAdapters(update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                this.handlers.forEach(cb => cb(objects.map(obj => ({ id: obj._id, obj, type: 'new' }))));
            })
            .catch(e => window.alert('Cannot get adapters: ' + e));
    }
}

export default AdaptersWorker;
