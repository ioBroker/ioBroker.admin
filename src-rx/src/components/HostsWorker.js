class HostsWorker {
    constructor(socket) {
        this.socket = socket;
        this.handlers = [];
        this.notificationsHandlers = [];
        this.promise = null;
        this.notificationPromises = {};

        socket.registerConnectionHandler(this.connectionHandler);

        this.connected = this.socket.isConnected();
        this.objects = {};
    }

    objectChangeHandler = (id, obj) => {
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
            this.handlers.forEach(cb => cb([{id, obj, type, oldObj}]));
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
                    .then(hosts => Object.keys(hosts)
                        .forEach(id => this.objectChangeHandler(id, hosts[id])));
            }
        } else if (!isConnected && this.connected) {
            this.connected = false;
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

    _getNotificationsFromHots(host, update) {
        if (!update && this.notificationPromises[host]) {
            return this.notificationPromises[host];
        }

        this.notificationPromises[host] = this.socket.getState(host + '.alive')
            .then(state => {
                if (state && state.val) {
                    return this.socket.getNotifications(host)
                        .then(notifications => ({[host]: notifications}))
                        .catch(e => {
                            console.warn(`Cannot read notifications from "${host}": ${e}`);
                            return {[host]: null};
                        });
                } else {
                    return {[host]: null};
                }
            });

        return this.notificationPromises[host];
    }

    getNotifications(host, update) {
        if (host) {
            return this._getNotificationsFromHots(host, update);
        } else {
            return this.getHosts(update)
                .then(hosts => {
                    const promises = Object.keys(hosts)
                        .map(host => this._getNotificationsFromHots(host, update));

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
