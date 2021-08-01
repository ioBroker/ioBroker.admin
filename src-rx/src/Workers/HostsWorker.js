class HostsWorker {
    constructor(socket) {
        this.socket = socket;
        this.handlers = [];
        this.aliveHandlers = [];
        this.notificationsHandlers = [];
        this.promise = null;
        this.notificationPromises = {};

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();
        this.objects = {};
        this.aliveStates = {};
    }

    objectChangeHandler = (id, obj) => {
        // if instance
        if (id.startsWith('system.host.')) {
            let type;
            let oldObj;
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
            this.handlers.forEach(cb => cb([{id, obj, type, oldObj}]));
        }
    }

    aliveChangeHandler = (id, state) => {
        // if instance
        if (id.startsWith('system.host.') && id.endsWith('.alive')) {
            let type;
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
            } else {
                if (this.aliveStates[id]) {
                    type = 'deleted';
                    delete this.aliveStates[id];
                } else {
                    // deleted unknown instance
                    return;
                }
            }
            this.aliveHandlers.forEach(cb => cb([{id, alive: this.aliveStates[id], type}]));
        }
    }

    getHosts(update) {
        if (!update && this.promise) {
            return this.promise;
        }

        this.promise = this.socket.getHosts(update)
            .then(objects => {
                this.objects = {};
                objects.forEach(obj => this.objects[obj._id] = obj);
                return this.objects;
            })
            .catch(e => window.alert('Cannot get hosts: ' + e));

        return this.promise;
    }

    connectionHandler = isConnected => {
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
                .forEach(id => this.aliveHandlers[id] = false);
        }
    }

    registerHandler(cb) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);

            if (this.handlers.length === 1 && this.connected) {
                this.socket.subscribeObject('system.host.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterHandler(cb) {
        const pos = this.handlers.indexOf(cb);
        if (pos !== -1) {
            this.handlers.splice(pos, 1);
            if (!this.handlers.length && this.connected) {
                this.socket.unsubscribeObject('system.host.*', this.objectChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    registerAliveHandler(cb) {
        if (!this.aliveHandlers.includes(cb)) {
            this.aliveHandlers.push(cb);

            if (this.aliveHandlers.length === 1 && this.connected) {
                this.socket.subscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    unregisterAliveHandler(cb) {
        const pos = this.aliveHandlers.indexOf(cb);
        if (pos !== -1) {
            this.aliveHandlers.splice(pos, 1);
            if (!this.aliveHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.alive', this.aliveChangeHandler);
            }
        }
    }

    onNotificationHandler = (id, state) => {
        const host = id.replace(/\.notifications\..+$/, '');

        // ignore subscribe events
        if (!this.subscribeTs || Date.now() - this.subscribeTs > 500) {
            this.notificationTimer && clearTimeout(this.notificationTimer);

            this.notificationTimer = setTimeout(host => {
                this.notificationTimer = null;
                this.notificationPromises[host] = this._getNotificationsFromHots(host, true);

                this.notificationPromises[host].then(notifications =>
                    this.notificationsHandlers.forEach(cb => cb(notifications)));
            }, 300, host);
        }
    };

    _getNotificationsFromHots(hostId, update) {
        if (!update && this.notificationPromises[hostId]) {
            return this.notificationPromises[hostId];
        }

        this.notificationPromises[hostId] = this.socket.getState(hostId + '.alive')
            .then(state => {
                if (state && state.val) {
                    return this.socket.getNotifications(hostId)
                        .then(notifications => ({[hostId]: notifications}))
                        .catch(e => {
                            console.warn(`Cannot read notifications from "${hostId}": ${e}`);
                            return {[hostId]: null};
                        });
                } else {
                    return {[hostId]: null};
                }
            });

        return this.notificationPromises[hostId];
    }

    getNotifications(hostId, update) {
        if (hostId) {
            return this._getNotificationsFromHots(hostId, update);
        } else {
            return this.socket.getCompactHosts(update)
                .then(hosts => {
                    const promises = hosts
                        .map(host => this._getNotificationsFromHots(host._id, update));

                    return Promise.all(promises)
                        .then(pResults => {
                            const result = {};
                            pResults.forEach(r => Object.assign(result, r));
                            return result;
                        });
                });
        }
    }

    registerNotificationHandler(cb) {
        if (!this.notificationsHandlers.includes(cb)) {
            this.notificationsHandlers.push(cb);

            if (this.notificationsHandlers.length === 1 && this.connected) {
                this.subscribeTs = Date.now();
                this.socket.subscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }

    unregisterNotificationHandler(cb) {
        const pos = this.notificationsHandlers.indexOf(cb);

        if (pos !== -1) {
            this.notificationsHandlers.splice(pos, 1);
            if (!this.notificationsHandlers.length && this.connected) {
                this.socket.unsubscribeState('system.host.*.notifications.*', this.onNotificationHandler);
            }
        }
    }
}

export default HostsWorker;
