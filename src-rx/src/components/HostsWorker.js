class HostsWorker {
    constructor(socket) {
        this.socket = socket;
        this.handlers = [];
        this.objectChangeHandlerBound = this.objectChangeHandler.bind(this);
        this.connectionHandlerBound   = this.connectionHandler.bind(this);
        socket.registerConnectionHandler(this.connectionHandlerBound);
        socket.subscribeObject('system.host.*', this.objectChangeHandlerBound);
        this.connected = this.socket.isConnected();
        this.objects = {};
    }

    objectChangeHandler(id, obj) {
        // if instance
        if (id.match(/^system\.host\.[^.]+\.\d+$/)) {
            let type;
            let oldObj;
            if (obj) {
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
            } else {
                if (this.objects[id]) {
                    type = 'deleted';
                    oldObj = this.objects[id];
                    delete this.objects[id];
                } else {
                    // deleted unknown instance
                    return;
                }
            }
            this.handlers.forEach(cb => cb(id, obj, type, oldObj));
        }
    }

    getHosts() {
        return JSON.parse(JSON.stringify(this.objects));
    }

    connectionHandler(isConnected) {
        if (isConnected && !this.connected) {
            this.connected = true;
            this._readHosts(true);
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    }
    
    registerHandler(cb) {
        this.handlers.includes(cb) && this.handlers.push(cb);
    }

    unregisterHandler(cb) {
        const pos = this.handlers.indexOf(cb);
        pos !== -1 && this.handlers.splice(pos, 1);
    }

    forceUpdate() {
        return this._readHosts(true);
    }

    _readHosts(update) {
        return this.socket.getHosts(update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                this.handlers.forEach(cb => cb(objects));
            });
    }
}

export default HostsWorker;
