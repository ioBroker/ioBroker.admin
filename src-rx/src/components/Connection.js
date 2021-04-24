/* This file is temporary here to speed-up the development of this component.
    Later it will be moved to adapter-react
 */

/**
 * Copyright 2020-2021, bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import PropTypes from 'prop-types';

/** Possible progress states. */
export const PROGRESS = {
    /** The socket is connecting. */
    CONNECTING: 0,
    /** The socket is successfully connected. */
    CONNECTED: 1,
    /** All objects are loaded. */
    OBJECTS_LOADED: 2,
    /** The socket is ready for use. */
    READY: 3
};

const PERMISSION_ERROR = 'permissionError';
const NOT_CONNECTED    = 'notConnectedError';

const ERRORS = {
    PERMISSION_ERROR,
    NOT_CONNECTED
};

class Connection {
    /**
     * @param {import('./types').ConnectionProps} props
     */
    constructor(props) {
        props                 = props || { protocol: window.location.protocol, host: window.location.hostname };
        this.props            = props;

        this.autoSubscribes   = this.props.autoSubscribes || [];
        this.autoSubscribeLog = this.props.autoSubscribeLog;

        this.props.protocol   = this.props.protocol || window.location.protocol;
        this.props.host       = this.props.host     || window.location.hostname;
        this.props.port       = this.props.port     || (window.location.port === '3000' ? 8081 : window.location.port);
        this.props.ioTimeout  = Math.max(this.props.ioTimeout  || 20000, 20000);
        this.props.cmdTimeout = Math.max(this.props.cmdTimeout || 5000, 5000);

        // breaking change. Do not load all objects by default is true
        this.doNotLoadAllObjects = this.props.doNotLoadAllObjects === undefined ? true : this.props.doNotLoadAllObjects;
        this.doNotLoadACL        = this.props.doNotLoadACL        === undefined ? true : this.props.doNotLoadACL;

        /** @type {Record<string, ioBroker.State>} */
        this.states = {};
        this.objects = null;
        this.acl = null;
        this.firstConnect = true;
        this.waitForRestart = false;
        /** @type {ioBroker.Languages} */
        this.systemLang = 'en';
        this.connected = false;

        /** @type {Record<string, { reg: RegExp; cbs: ioBroker.StateChangeHandler[]}>} */
        this.statesSubscribes = {}; // subscribe for states

        /** @type {Record<string, { reg: RegExp; cbs: import('./types').ObjectChangeHandler[]}>} */
        this.objectsSubscribes = {}; // subscribe for objects
        this.onProgress = this.props.onProgress || function () {};
        this.onError = this.props.onError || function (err) {console.error(err);};
        this.loaded = false;
        this.loadTimer = null;
        this.loadCounter = 0;
        this.certPromise = null;

        /** @type {((connected: boolean) => void)[]} */
        this.onConnectionHandlers = [];
        /** @type {((message: string) => void)[]} */
        this.onLogHandlers = [];

        /** @type {Record<string, Promise<any>>} */
        this._promises = {};
        this.startSocket();
    }

    /**
     * Checks if this connection is running in a web adapter and not in an admin.
     * @returns {boolean} True if running in a web adapter or in a socketio adapter.
     */
    static isWeb() {
        return window.socketUrl !== undefined;
    }

    /**
     * Starts the socket.io connection.
     * @returns {void}
     */
    startSocket() {
        // if socket io is not yet loaded
        if (typeof window.io === 'undefined') {
            // if in index.html the onLoad function not defined
            if (typeof window.registerSocketOnLoad !== 'function') {
                // poll if loaded
                this.scriptLoadCounter = this.scriptLoadCounter || 0;
                this.scriptLoadCounter++;

                if (this.scriptLoadCounter < 30) {
                    // wait till the script loaded
                    setTimeout(() => this.startSocket(), 100);
                    return;
                } else {
                    window.alert('Cannot load socket.io.js!');
                }
            } else {
                // register on load
                window.registerSocketOnLoad(() => this.startSocket());
            }
            return;
        } else {
            // socket was initialized, do not repeat
            if (this._socket) {
                return;
            }
        }

        let host = this.props.host;
        let port = this.props.port;
        let protocol = this.props.protocol.replace(':', '');

        // if web adapter, socket io could be on other port or even host
        if (window.socketUrl) {
            let parts = window.socketUrl.split(':');
            host = parts[0] || host;
            port = parts[1] || port;
            if (host.includes('://')) {
                parts = host.split('://');
                protocol = parts[0];
                host = parts[1];
            }
        }

        const url = `${protocol}://${host}:${port}`;

        this._socket = window.io.connect(
            url,
            {
                query: 'ws=true',
                name: this.props.name,
                timeout: this.props.ioTimeout
            }
        );

        this._socket.on('connect', noTimeout => {
            // If the user is not admin it takes some time to install the handlers, because all rights must be checked
            if (noTimeout !== true) {
                setTimeout(() =>
                    this.getVersion()
                        .then(info => {
                            const [major, minor, patch] = info.version.split('.');
                            const v = parseInt(major, 10) * 10000 + parseInt(minor, 10) * 100 + parseInt(patch, 10);
                            if (v < 40102) {
                                this._authTimer = null;
                                // possible this is old version of admin
                                this.onPreConnect(false, false);
                            } else {
                                this._socket.emit('authenticate', (isOk, isSecure) => this.onPreConnect(isOk, isSecure));
                            }
                        }), 500);
            } else {
                // iobroker websocket waits, till all handlers are installed
                this._socket.emit('authenticate', (isOk, isSecure) => this.onPreConnect(isOk, isSecure));
            }
        });

        this._socket.on('reconnect', () => {
            this.connected = true;

            if (this.waitForRestart) {
                window.location.reload();
            } else {
                this._subscribe(true);
                this.onConnectionHandlers.forEach(cb => cb(true));
            }
        });

        this._socket.on('disconnect', () => {
            this.connected  = false;
            this.subscribed = false;
            this.onProgress(PROGRESS.CONNECTING);
            this.onConnectionHandlers.forEach(cb => cb(false));
        });

        this._socket.on('reconnect', () => {
            this.onProgress(PROGRESS.READY);
            if (this.waitForRestart) {
                window.location.reload();
            }
        });

        this._socket.on('reauthenticate', () =>
            this.authenticate());

        this._socket.on('log', message => {
            this.props.onLog && this.props.onLog(message);
            this.onLogHandlers.forEach(cb => cb(message));
        });

        this._socket.on('error', err => {
            let _err = err || '';
            if (typeof _err.toString !== 'function') {
                _err = JSON.stringify(_err);
                console.error(`Received strange error: ${_err}`);
            }
            _err = _err.toString();
            if (_err.includes('User not authorized')) {
                this.authenticate();
            } else {
                window.alert(`Socket Error: ${err}`);
            }
        });

        this._socket.on('connect_error', err =>
            console.error(`Connect error: ${err}`));

        this._socket.on('permissionError', err =>
            this.onError({message: 'no permission', operation: err.operation, type: err.type, id: (err.id || '')}));

        this._socket.on('objectChange', (id, obj) =>
            setTimeout(() => this.objectChange(id, obj), 0));

        this._socket.on('stateChange', (id, state) =>
            setTimeout(() => this.stateChange(id, state), 0));

        this._socket.on('cmdStdout', (id, text) =>
            this.onCmdStdoutHandler && this.onCmdStdoutHandler(id, text));

        this._socket.on('cmdStderr', (id, text) =>
            this.onCmdStderrHandler && this.onCmdStderrHandler(id, text));

        this._socket.on('cmdExit', (id, exitCode) =>
            this.onCmdExitHandler && this.onCmdExitHandler(id, exitCode));
    }

    /**
     * Called internally.
     * @private
     * @param {boolean} isOk
     * @param {boolean} isSecure
     */
    onPreConnect(isOk, isSecure) {
        if (this._authTimer) {
            clearTimeout(this._authTimer);
            this._authTimer = null;
        }

        this.connected = true;
        this.isSecure = isSecure;

        if (this.waitForRestart) {
            window.location.reload();
        } else {
            if (this.firstConnect) {
                // retry strategy
                this.loadTimer = setTimeout(() => {
                    this.loadTimer = null;
                    this.loadCounter++;
                    if (this.loadCounter < 10) {
                        this.onConnect();
                    }
                }, 1000);

                if (!this.loaded) {
                    this.onConnect();
                }
            } else {
                this.onProgress(PROGRESS.READY);
            }

            this._subscribe(true);
            this.onConnectionHandlers.forEach(cb => cb(true));
        }
    }

    /**
     * Checks if the socket is connected.
     * @returns {boolean} true if connected.
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Called internally.
     * @private
     */
    _getUserPermissions(cb) {
        if (this.doNotLoadACL) {
            return cb && cb();
        } else {
            this._socket.emit('getUserPermissions', cb);
        }
    }

    /**
     * Called internally.
     * @private
     */
    onConnect() {
        this._getUserPermissions((err, acl) => {
            if (err) {
                return this.onError('Cannot read user permissions: ' + err);
            } else
            if (!this.doNotLoadACL) {
                if (this.loaded) {
                    return;
                }
                this.loaded = true;
                clearTimeout(this.loadTimer);
                this.loadTimer = null;

                this.onProgress(PROGRESS.CONNECTED);
                this.firstConnect = false;

                this.acl = acl;
            }

            // Read system configuration
            return this.getSystemConfig()
                .then(data => {
                    if (this.doNotLoadACL) {
                        if (this.loaded) {
                            return;
                        }
                        this.loaded = true;
                        clearTimeout(this.loadTimer);
                        this.loadTimer = null;

                        this.onProgress(PROGRESS.CONNECTED);
                        this.firstConnect = false;
                    }

                    this.systemConfig = data;
                    if (this.systemConfig && this.systemConfig.common) {
                        this.systemLang = this.systemConfig.common.language;
                    } else {
                        this.systemLang = window.navigator.userLanguage || window.navigator.language;

                        if (this.systemLang !== 'en' && this.systemLang !== 'de' && this.systemLang !== 'ru') {
                            this.systemConfig.common.language = 'en';
                            this.systemLang = 'en';
                        }
                    }

                    this.props.onLanguage && this.props.onLanguage(this.systemLang);

                    if (!this.doNotLoadAllObjects) {
                        return this.getObjects()
                            .then(() => {
                                this.onProgress(PROGRESS.READY);
                                this.props.onReady && this.props.onReady(this.objects);
                            });
                    } else {
                        this.objects = {'system.config': data};
                        this.onProgress(PROGRESS.READY);
                        this.props.onReady && this.props.onReady(this.objects);
                    }
                })
                .catch(e => this.onError('Cannot read system config: ' + e));
        });
    }

    /**
     * Called internally.
     * @private
     */
    authenticate() {
        if (window.location.search.includes('&href=')) {
            window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
        } else {
            window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?login&href=${window.location.search}${window.location.hash}`;
        }
    }

    /**
     * Subscribe to changes of the given state.
     * @param {string} id The ioBroker state ID.
     * @param {ioBroker.StateChangeHandler} cb The callback.
     *//**
     * Subscribe to changes of the given state.
     * @param {string} id The ioBroker state ID.
     * @param {boolean} binary Set to true if the given state is binary and requires Base64 decoding.
     * @param {ioBroker.StateChangeHandler} cb The callback.
     */
    subscribeState(id, binary, cb) {
        if (typeof binary === 'function') {
            cb = binary;
            binary = false;
        }

        if (!this.statesSubscribes[id]) {
            let reg = id
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\(/g, '\\(')
                .replace(/\)/g, '\\)')
                .replace(/\+/g, '\\+')
                .replace(/\[/g, '\\[');

            if (reg.indexOf('*') === -1) {
                reg += '$';
            }
            this.statesSubscribes[id] = {reg: new RegExp(reg), cbs: []};
            this.statesSubscribes[id].cbs.push(cb);
            if (this.connected) {
                this._socket.emit('subscribe', id);
            }
        } else {
            !this.statesSubscribes[id].cbs.includes(cb) && this.statesSubscribes[id].cbs.push(cb);
        }
        if (typeof cb === 'function' && this.connected) {
            if (binary) {
                this.getBinaryState(id)
                    .then(base64 => cb(id, base64))
                    .catch(e =>console.error(`Cannot getForeignStates "${id}": ${JSON.stringify(e)}`));
            } else {
                this._socket.emit('getForeignStates', id, (err, states) => {
                    err && console.error(`Cannot getForeignStates "${id}": ${JSON.stringify(err)}`);
                    states && Object.keys(states).forEach(id => cb(id, states[id]));
                });
            }
        }
    }

    /**
     * Unsubscribes all callbacks from changes of the given state.
     * @param {string} id The ioBroker state ID.
     *//**
     * Unsubscribes the given callback from changes of the given state.
     * @param {string} id The ioBroker state ID.
     * @param {ioBroker.StateChangeHandler} cb The callback.
     */
    unsubscribeState(id, cb) {
        if (this.statesSubscribes[id]) {
            if (cb) {
                const pos = this.statesSubscribes[id].cbs.indexOf(cb);
                pos !== -1 && this.statesSubscribes[id].cbs.splice(pos, 1);
            } else {
                this.statesSubscribes[id].cbs = [];
            }

            if (!this.statesSubscribes[id].cbs || !this.statesSubscribes[id].cbs.length) {
                delete this.statesSubscribes[id];
                this.connected && this._socket.emit('unsubscribe', id);
            }
        }
    }

    /**
     * Subscribe to changes of the given object.
     * @param {string} id The ioBroker object ID.
     * @param {import('./types').ObjectChangeHandler} cb The callback.
     * @returns {Promise<void>}
     */
    subscribeObject(id, cb) {
        if (!this.objectsSubscribes[id]) {
            let reg = id.replace(/\./g, '\\.').replace(/\*/g, '.*');
            if (reg.indexOf('*') === -1) {
                reg += '$';
            }
            this.objectsSubscribes[id] = {reg: new RegExp(reg), cbs: []};
            this.objectsSubscribes[id].cbs.push(cb);
            this.connected && this._socket.emit('subscribeObjects', id);
        } else {
            !this.objectsSubscribes[id].cbs.includes(cb) && this.objectsSubscribes[id].cbs.push(cb);
        }
        return Promise.resolve();
    }

    /**
     * Unsubscribes all callbacks from changes of the given object.
     * @param {string} id The ioBroker object ID.
     * @returns {Promise<void>}
     *//**
     * Unsubscribes the given callback from changes of the given object.
     * @param {string} id The ioBroker object ID.
     * @param {import('./types').ObjectChangeHandler} cb The callback.
     * @returns {Promise<void>}
     */
    unsubscribeObject(id, cb) {
        if (this.objectsSubscribes[id]) {
            if (cb) {
                const pos = this.objectsSubscribes[id].cbs.indexOf(cb);
                pos !== -1 && this.objectsSubscribes[id].cbs.splice(pos, 1);
            } else {
                this.objectsSubscribes[id].cbs = [];
            }

            if (this.connected && (!this.objectsSubscribes[id].cbs || !this.objectsSubscribes[id].cbs.length)) {
                delete this.objectsSubscribes[id];
                this.connected && this._socket.emit('unsubscribeObjects', id);
            }
        }
        return Promise.resolve();
    }

    /**
     * Called internally.
     * @private
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    objectChange(id, obj) {
        // update main.objects cache
        if (!this.objects) {
            return;
        }

        /** @type {import("./types").OldObject} */
        let oldObj;

        let changed = false;
        if (obj) {
            if (obj._rev && this.objects[id]) {
                this.objects[id]._rev = obj._rev;
            }

            if (this.objects[id]) {
                oldObj = {_id: id, type: this.objects[id].type};
            }

            if (!this.objects[id] || JSON.stringify(this.objects[id]) !== JSON.stringify(obj)) {
                this.objects[id] = obj;
                changed = true;
            }
        } else if (this.objects[id]) {
            oldObj = {_id: id, type: this.objects[id].type};
            delete this.objects[id];
            changed = true;
        }

        Object.keys(this.objectsSubscribes).forEach(_id => {
            if (_id === id || this.objectsSubscribes[_id].reg.test(id)) {
                this.objectsSubscribes[_id].cbs.forEach(cb => cb(id, obj, oldObj));
            }
        });

        if (changed && this.props.onObjectChange) {
            this.props.onObjectChange(id, obj);
        }
    }

    /**
     * Called internally.
     * @private
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    stateChange(id, state) {
        for (const task in this.statesSubscribes) {
            if (this.statesSubscribes.hasOwnProperty(task) && this.statesSubscribes[task].reg.test(id)) {
                this.statesSubscribes[task].cbs.forEach(cb => cb(id, state));
            }
        }
    }

    /**
     * Gets all states.
     * @param {boolean} disableProgressUpdate don't call onProgress() when done
     * @returns {Promise<Record<string, ioBroker.State>>}
     */
    getStates(disableProgressUpdate) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('getStates', (err, res) => {
                this.states = res;
                !disableProgressUpdate && this.onProgress(PROGRESS.STATES_LOADED);
                return err ? reject(err) : resolve(this.states);
            }));
    }

    /**
     * Gets the given state.
     * @param {string} id The state ID.
     * @returns {Promise<ioBroker.State | null | undefined>}
     */
    getState(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('getState', id, (err, state) => err ? reject(err) : resolve(state)));
    }

    /**
     * Gets the given binary state.
     * @param {string} id The state ID.
     * @returns {Promise<Buffer | undefined>}
     */
    getBinaryState(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        // the data will come in base64
        return new Promise((resolve, reject) =>
            this._socket.emit('getBinaryState', id, (err, state) => err ? reject(err) : resolve(state)));
    }

    /**
     * Sets the given binary state.
     * @param {string} id The state ID.
     * @param {string} base64 The Base64 encoded binary data.
     * @returns {Promise<void>}
     */
    setBinaryState(id, base64) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        // the data will come in base64
        return new Promise((resolve, reject) =>
            this._socket.emit('setBinaryState', id, base64, err => err ? reject(err) : resolve()));
    }

    /**
     * Sets the given state value.
     * @param {string} id The state ID.
     * @param {string | number | boolean | ioBroker.State | ioBroker.SettableState | null} val The state value.
     * @returns {Promise<void>}
     */
    setState(id, val) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('setState', id, val, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Gets all objects.
     * @param {(objects?: Record<string, ioBroker.Object>) => void} update Callback that is executed when all objects are retrieved.
     * @returns {void}
     *//**
     * Gets all objects.
     * @param {boolean} update Set to true to retrieve all objects from the server (instead of using the local cache).
     * @param {boolean} disableProgressUpdate don't call onProgress() when done
     * @returns {Promise<Record<string, ioBroker.Object>> | undefined}
     */
    getObjects(update, disableProgressUpdate) {
        if (typeof update === 'function') {
            const callback = update;
            // BF(2020_06_01): old code, must be removed when adapter-react will be updated
            if (!this.connected) {
                console.error(NOT_CONNECTED);
                callback();
            } else {
                if (this.objects && Object.keys(this.objects).length > 2) {
                    setTimeout(() => callback(this.objects), 100);
                } else {
                    this._socket.emit('getAllObjects', (err, res) => {
                        this.objects = res || {};
                        disableProgressUpdate && this.onProgress(PROGRESS.OBJECTS_LOADED);
                        callback(this.objects);
                    });
                }
            }
        } else {
            if (!this.connected) {
                return Promise.reject(NOT_CONNECTED);
            } else {
                return new Promise((resolve, reject) => {
                    if (!update && this.objects) {
                        return resolve(this.objects);
                    }

                    this._socket.emit('getAllObjects', (err, res) => {
                        this.objects = res;
                        disableProgressUpdate && this.onProgress(PROGRESS.OBJECTS_LOADED);
                        err ? reject(err) : resolve(this.objects);
                    });
                });
            }
        }
    }

    /**
     * Called internally.
     * @private
     * @param {boolean} isEnable
     */
    _subscribe(isEnable) {
        if (isEnable && !this.subscribed) {
            this.subscribed = true;
            this.autoSubscribes.forEach(id => this._socket.emit('subscribeObjects', id));
            // re subscribe objects
            Object.keys(this.objectsSubscribes).forEach(id => this._socket.emit('subscribeObjects', id));
            // re-subscribe logs
            this.autoSubscribeLog && this._socket.emit('requireLog', true);
            // re subscribe states
            Object.keys(this.statesSubscribes).forEach(id => this._socket.emit('subscribe', id));
        } else if (!isEnable && this.subscribed) {
            this.subscribed = false;
            // un-subscribe objects
            this.autoSubscribes.forEach(id => this._socket.emit('unsubscribeObjects', id));
            Object.keys(this.objectsSubscribes).forEach(id => this._socket.emit('unsubscribeObjects', id));
            // un-subscribe logs
            this.autoSubscribeLog && this._socket.emit('requireLog', false);

            // un-subscribe states
            Object.keys(this.statesSubscribes).forEach(id => this._socket.emit('unsubscribe', id));
        }
    }

    /**
     * Requests log updates.
     * @param {boolean} isEnabled Set to true to get logs.
     * @returns {Promise<void>}
     */
    requireLog(isEnabled) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('requireLog', isEnabled, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Deletes the given object.
     * @param {string} id The object ID.
     * @param {boolean} maintenance Force deletion of non conform IDs.
     * @returns {Promise<void>}
     */
    delObject(id, maintenance) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('delObject', id, {maintenance: !!maintenance}, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Deletes the given object and all its children.
     * @param {string} id The object ID.
     * @param {boolean} maintenance Force deletion of non conform IDs.
     * @returns {Promise<void>}
     */
    delObjects(id, maintenance) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('delObjects', id, {maintenance: !!maintenance}, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Sets the object.
     * @param {string} id The object ID.
     * @param {ioBroker.SettableObject} obj The object.
     * @returns {Promise<void>}
     */
    setObject(id, obj) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!obj) {
            return Promise.reject('Null object is not allowed');
        }

        obj = JSON.parse(JSON.stringify(obj));

        if (obj.hasOwnProperty('from')) {
            delete obj.from;
        }
        if (obj.hasOwnProperty('user')) {
            delete obj.user;
        }
        if (obj.hasOwnProperty('ts')) {
            delete obj.ts;
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('setObject', id, obj, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Gets the object with the given id from the server.
     * @param {string} id The object ID.
     * @returns {ioBroker.GetObjectPromise} The object.
     */
    getObject(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getObject', id, (err, obj) =>
                err ? reject(err) : resolve(obj)));
    }

    /**
     * Get all adapter instances.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     *//**
     * Get all instances of the given adapter.
     * @param {string} adapter The name of the adapter.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     */
    getAdapterInstances(adapter, update) {
        if (typeof adapter === 'boolean') {
            update = adapter;
            adapter = '';
        }
        adapter = adapter || '';

        if (!update && this._promises['instances_' + adapter]) {
            return this._promises['instances_' + adapter];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['instances_' + adapter] = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'instance',
                {startkey: `system.adapter.${adapter || ''}`, endkey: `system.adapter.${adapter ? adapter + '.' : ''}\u9999`},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                });
        });

        return this._promises['instances_' + adapter];
    }

    /**
     * Get all adapters.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     *//**
     * Get adapters with the given name.
     * @param {string} adapter The name of the adapter.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     */
    getAdapters(adapter, update) {
        if (typeof adapter === 'boolean') {
            update = adapter;
            adapter = '';
        }

        adapter = adapter || '';

        if (!update && this._promises['adapter_' + adapter]) {
            return this._promises['adapter_' + adapter];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['adapter_' + adapter] = new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'adapter',
                {startkey: `system.adapter.${adapter || ''}`, endkey: `system.adapter.${adapter || ''}\u9999`},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value).filter(obj => obj && (!adapter || (obj.common && obj.common.name === adapter))));
                    }
                });
        });

        return this._promises['adapter_' + adapter];
    }

    /**
     * Called internally.
     * @private
     * @param {any[]} objs
     * @param {(err?: any) => void} cb
     */
    _renameGroups(objs, cb) {
        if (!objs || !objs.length) {
            cb && cb();
        } else {
            let obj = objs.pop();
            this.delObject(obj._id)
                .then(() => {
                    obj._id = obj.newId;
                    delete obj.newId;
                    return this.setObject(obj._id, obj)
                })
                .then(() => setTimeout(() => this._renameGroups(objs, cb), 0))
                .catch(err => cb && cb(err));
        }
    }

    /**
     * Rename a group.
     * @param {string} id The id.
     * @param {string} newId The new id.
     * @param {string | { [lang in ioBroker.Languages]?: string; }} newName The new name.
     */
    renameGroup(id, newId, newName) {
        return this.getGroups(true)
            .then(groups => {
                if (groups.length) {
                    // find all elements
                    const groupsToRename = groups
                        .filter(group => group._id.startsWith(id + '.'))
                        .forEach(group => group.newId = newId + group._id.substring(id.length));

                    return new Promise((resolve, reject) =>
                        this._renameGroups(groupsToRename, err => err ? reject(err) : resolve()))
                        .then(() => {
                            const obj = groups.find(group => group._id === id);

                            if (obj) {
                                obj._id = newId;
                                if (newName !== undefined) {
                                    obj.common = obj.common || {};
                                    obj.common.name = newName;
                                }

                                return this.setObject(obj._id, obj);
                            }
                        });
                }
            });
    }

    /**
     * Sends a message to a specific instance or all instances of some specific adapter.
     * @param {string} instance The instance to send this message to.
     * @param {string} [command] Command name of the target instance.
     * @param {ioBroker.MessagePayload} [data] The message data to send.
     * @returns {Promise<ioBroker.Message | undefined>}
     */
    sendTo(instance, command, data) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendTo', instance, command, data, result =>
                resolve(result)));
    }

    /**
     * Extend an object and create it if it might not exist.
     * @param {string} id The id.
     * @param {ioBroker.PartialObject} obj The object.
     */
    extendObject(id, obj) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        obj = JSON.parse(JSON.stringify(obj));

        if (obj.hasOwnProperty('from')) {
            delete obj.from;
        }
        if (obj.hasOwnProperty('user')) {
            delete obj.user;
        }
        if (obj.hasOwnProperty('ts')) {
            delete obj.ts;
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('extendObject', id, obj, err => err ? reject(err) : resolve()));
    }

    /**
     * Register a handler for log messages.
     * @param {(message: string) => void} handler The handler.
     */
    registerLogHandler(handler) {
        !this.onLogHandlers.includes(handler) && this.onLogHandlers.push(handler);
    }

    /**
     * Unregister a handler for log messages.
     * @param {(message: string) => void} handler The handler.
     */
    unregisterLogHandler(handler) {
        const pos = this.onLogHandlers.indexOf(handler);
        pos !== -1 && this.onLogHandlers.splice(pos, 1);
    }

    /**
     * Register a handler for the connection state.
     * @param {(connected: boolean) => void} handler The handler.
     */
    registerConnectionHandler(handler) {
        !this.onConnectionHandlers.includes(handler) && this.onConnectionHandlers.push(handler);
    }

    /**
     * Unregister a handler for the connection state.
     * @param {(connected: boolean) => void} handler The handler.
     */
    unregisterConnectionHandler(handler) {
        const pos = this.onConnectionHandlers.indexOf(handler);
        pos !== -1 && this.onConnectionHandlers.splice(pos, 1);
    }

    /**
     * Set the handler for standard output of a command.
     * @param {(id: string, text: string) => void} handler The handler.
     */
    registerCmdStdoutHandler(handler) {
        this.onCmdStdoutHandler = handler;
    }

    /**
     * Unset the handler for standard output of a command.
     * @param {(id: string, text: string) => void} handler The handler.
     */
    unregisterCmdStdoutHandler(handler) {
        this.onCmdStdoutHandler = null;
    }

    /**
     * Set the handler for standard error of a command.
     * @param {(id: string, text: string) => void} handler The handler.
     */
    registerCmdStderrHandler(handler) {
        this.onCmdStderrHandler = handler;
    }

    /**
     * Unset the handler for standard error of a command.
     * @param {(id: string, text: string) => void} handler The handler.
     */
    unregisterCmdStderrHandler(handler) {
        this.onCmdStderrHandler = null;
    }

    /**
     * Set the handler for exit of a command.
     * @param {(id: string, exitCode: number) => void} handler The handler.
     */
    registerCmdExitHandler(handler) {
        this.onCmdExitHandler = handler;
    }

    /**
     * Unset the handler for exit of a command.
     * @param {(id: string, exitCode: number) => void} handler The handler.
     */
    unregisterCmdExitHandler(handler) {
        this.onCmdExitHandler = null;
    }

    /**
     * Get all enums with the given name.
     * @param {string} [_enum] The name of the enum
     * @param {boolean} [update] Force update.
     * @returns {Promise<Record<string, ioBroker.Object>>}
     */
    getEnums(_enum, update) {
        if (!update && this._promises['enums_' + (_enum || 'all')] ) {
            return this._promises['enums_' + (_enum || 'all')];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['enums_' + (_enum || 'all')] = new Promise((resolve, reject) => {
            this._socket.emit('getObjectView', 'system', 'enum', {startkey: 'enum.' + (_enum || ''), endkey: 'enum.' + (_enum ? (_enum + '.') : '') + '\u9999'}, (err, res) => {
                if (!err && res) {
                    const _res = {};
                    for (let i = 0; i < res.rows.length; i++) {
                        if (_enum && res.rows[i].id === 'enum.' + _enum) {
                            continue;
                        }
                        _res[res.rows[i].id] = res.rows[i].value;
                    }
                    resolve(_res);
                } else {
                    reject(err);
                }
            });
        });

        return this._promises['enums_' + (_enum || 'all')];
    }

    /**
     * Query a predefined object view.
     * @param {string} start The start ID.
     * @param {string} end The end ID.
     * @param {string} type The type of object.
     * @returns {Promise<Record<string, ioBroker.Object>>}
     */
    getObjectView(start, end, type) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        start = start || '';
        end   = end   || '\u9999';

        return new Promise((resolve, reject) => {
            this._socket.emit('getObjectView', 'system', type, {startkey: start, endkey: end}, (err, res) => {
                if (!err) {
                    const _res = {};
                    if (res && res.rows) {
                        for (let i = 0; i < res.rows.length; i++) {
                            _res[res.rows[i].id] = res.rows[i].value;
                        }
                    }
                    resolve(_res);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Get the stored certificates.
     * @param {boolean} [update] Force update.
     * @returns {Promise<{name: string; type: 'public' | 'private' | 'chained'}[]>}
     */
    getCertificates(update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }

        if (this._promises.cert && !update) {
            return this._promises.cert;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises.cert = this.getObject('system.certificates')
            .then(res => {
                const certs = [];
                if (res && res.native && res.native.certificates) {
                    Object.keys(res.native.certificates).forEach(c => {
                        const cert = res.native.certificates[c];
                        if (!cert) {
                            return;
                        }
                        const _cert = {
                            name: c,
                            type: ''
                        };
                        // If it is filename, it could be everything
                        if (cert.length < 700 && (cert.indexOf('/') !== -1 || cert.indexOf('\\') !== -1)) {
                            if (c.toLowerCase().includes('private')) {
                                _cert.type = 'private';
                            } else if (cert.toLowerCase().includes('private')) {
                                _cert.type = 'private';
                            } else if (c.toLowerCase().includes('public')) {
                                _cert.type = 'public';
                            } else if (cert.toLowerCase().includes('public')) {
                                _cert.type = 'public';
                            }
                            certs.push(_cert);
                        } else {
                            _cert.type = (cert.substring(0, '-----BEGIN RSA PRIVATE KEY'.length) === '-----BEGIN RSA PRIVATE KEY' || cert.substring(0, '-----BEGIN PRIVATE KEY'.length) === '-----BEGIN PRIVATE KEY') ? 'private' : 'public';

                            if (_cert.type === 'public') {
                                const m = cert.split('-----END CERTIFICATE-----');
                                if (m.filter(t => t.replace(/\r\n|\r|\n/, '').trim()).length > 1) {
                                    _cert.type = 'chained';
                                }
                            }

                            certs.push(_cert);
                        }
                    });
                }
                return certs;
            });

        return this._promises.cert;
    }

    /**
     * Get the logs from a host (only for admin connection).
     * @param {string} host
     * @param {number} [linesNumber]
     * @returns {Promise<string[]>}
     */
    getLogs(host, linesNumber) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendToHost', host, 'getLogs', linesNumber || 200, lines =>
                resolve(lines)));
    }

    /**
     * Get the log files (only for admin connection).
     * @returns {Promise<string[]>}
     */
    getLogsFiles() {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('readLogs', (err, files) =>
                err ? reject(err) : resolve(files)));
    }

    /**
     * Delete the logs from a host (only for admin connection).
     * @param {string} host
     * @returns {Promise<void>}
     */
    delLogs(host) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('sendToHost', host, 'delLogs', null, error =>
                error ? reject(error) : resolve()));
    }

    /**
     * Read the meta items.
     * @returns {Promise<ioBroker.Object[]>}
     */
    readMetaItems() {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getObjectView', 'system', 'meta', {startkey: '', endkey: '\u9999'}, (err, objs) =>
                err ? reject(err) : resolve(objs.rows && objs.rows.map(obj => obj.value))));
    }

    /**
     * Read the directory of an adapter.
     * @param {string} adapter The adapter name.
     * @param {string} fileName The directory name.
     * @returns {Promise<ioBroker.ReadDirResult[]>}
     */
    readDir(adapter, fileName) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('readDir', adapter, fileName, (err, files) =>
                err ? reject(err) : resolve(files)));
    }

    readFile(adapter, fileName, base64) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) => {
            if (!base64) {
                this._socket.emit('readFile', adapter, fileName, (err, data, type) => {
                    err ? reject(err) : resolve(data, type);
                });
            } else {
                this._socket.emit('readFile64', adapter, fileName, base64, (err, data) =>
                    err ? reject(err) : resolve(data));
            };
        });
    }

    /**
     * Write a file of an adapter.
     * @param {string} adapter The adapter name.
     * @param {string} fileName The file name.
     * @param {Buffer | string} data The data (if it's a Buffer, it will be converted to Base64).
     * @returns {Promise<void>}
     */
    writeFile64(adapter, fileName, data) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) => {
            if (typeof data === 'string') {
                this._socket.emit('writeFile', adapter, fileName, data, err =>
                    err ? reject(err) : resolve());
            } else {
                const base64 = btoa(
                    new Uint8Array(data)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );

                this._socket.emit('writeFile64', adapter, fileName, base64, err =>
                    err ? reject(err) : resolve());
            }
        });
    }

    /**
     * Delete a file of an adapter.
     * @param {string} adapter The adapter name.
     * @param {string} fileName The file name.
     * @returns {Promise<void>}
     */
    deleteFile(adapter, fileName) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('deleteFile', adapter, fileName, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Get the list of all hosts.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     */
    getHosts(update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!update && this._promises.hosts) {
            return this._promises.hosts;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises.hosts = new Promise((resolve, reject) =>
            this._socket.emit(
                'getObjectView',
                'system',
                'host',
                {startkey: 'system.host.', endkey: 'system.host.\u9999'},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                }));

        return this._promises.hosts;
    }

    /**
     * Get the list of all users.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     */
    getUsers(update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!update && this._promises.users) {
            return this._promises.users;
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises.users = new Promise((resolve, reject) =>
            this._socket.emit(
                'getObjectView',
                'system',
                'user',
                {startkey: 'system.user.', endkey: 'system.user.\u9999'},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                }));

        return this._promises.users;
    }

    /**
     * Get the list of all groups.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.Object[]>}
     */
    getGroups(update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!update && this._promises.groups) {
            return this._promises.groups;
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises.groups = new Promise((resolve, reject) =>
            this._socket.emit(
                'getObjectView',
                'system',
                'group',
                {startkey: 'system.group.', endkey: 'system.group.\u9999'},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                }));

        return this._promises.groups;
    }

    /**
     * Get the host information.
     * @param {string} host
     * @param {boolean} [update] Force update.
     * @returns {Promise<any>}
     */
    getHostInfo(host, update, timeoutMs) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!host.startsWith('system.host.')) {
            host += 'system.host.' + host;
        }

        if (!update && this._promises['hostInfo' + host]) {
            return this._promises['hostInfo' + host];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['hostInfo' + host] = new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('getHostInfo timeout');
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit('sendToHost', host, 'getHostInfo', null, data => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject('May not read "getHostInfo"');
                    } else if (!data) {
                        reject('Cannot read "getHostInfo"');
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises['hostInfo' + host];
    }

    /**
     * Get the repository.
     * @param {string} host
     * @param {any} [args]
     * @param {boolean} [update] Force update.
     * @returns {Promise<any>}
     */
    getRepository(host, args, update, timeoutMs) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!update && this._promises.repo) {
            return this._promises.repo;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!host.startsWith('system.host.')) {
            host += 'system.host.' + host;
        }

        this._promises.repo = new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('getRepository timeout');
                }
            }, timeoutMs || this.props.cmdTimeout);

            this._socket.emit('sendToHost', host, 'getRepository', args, data => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject('May not read "getRepository"');
                    } else if (!data) {
                        reject('Cannot read "getRepository"');
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises.repo;
    }

    /**
     * Get the installed.
     * @param {string} host
     * @param {boolean} [update] Force update.
     * @returns {Promise<any>}
     */
    getInstalled(host, update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!update && this._promises.installed) {
            return this._promises.installed;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!host.startsWith('system.host.')) {
            host += 'system.host.' + host;
        }

        this._promises.installed = new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('getInstalled timeout');
                }
            }, this.props.cmdTimeout);

            this._socket.emit('sendToHost', host, 'getInstalled', null, data => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (data === PERMISSION_ERROR) {
                        reject('May not read "getInstalled"');
                    } else if (!data) {
                        reject('Cannot read "getInstalled"');
                    } else {
                        resolve(data);
                    }
                }
            });
        });

        return this._promises.installed;
    }

    /**
     * Execute a command on a host.
     * @param {string} host The host name.
     * @param {string} cmd The command.
     * @param {string} cmdId The command ID.
     * @returns {Promise<void>}
     */
    cmdExec(host, cmd, cmdId) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!host.startsWith(host)) {
            host += 'system.host.' + host;
        }

        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('cmdExec timeout');
                }
            }, this.props.cmdTimeout);

            this._socket.emit('cmdExec', host, cmdId, cmd, null, err => {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            });
        });
    }

    /**
     * Checks if a given feature is supported.
     * @param {string} feature The feature to check.
     * @param {boolean} [update] Force update.
     * @returns {Promise<any>}
     */
    checkFeatureSupported(feature, update) {
        if (!update && this._promises['supportedFeatures_' + feature]) {
            return this._promises['supportedFeatures_' + feature];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['supportedFeatures_' + feature] = new Promise((resolve, reject) =>
            this._socket.emit('checkFeatureSupported', feature, (err, features) => {
                err ? reject(err) : resolve(features)
            }));

        return this._promises['supportedFeatures_' + feature];
    }

    /**
     * Read the base settings of a given host.
     * @param {string} host
     * @returns {Promise<any>}
     */
    readBaseSettings(host) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return this.checkFeatureSupported('CONTROLLER_READWRITE_BASE_SETTINGS')
            .then(result => {
                if (result) {
                    if (!this.connected) {
                        return Promise.reject(NOT_CONNECTED);
                    }
                    return new Promise((resolve, reject) => {
                        let timeout = setTimeout(() => {
                            if (timeout) {
                                timeout = null;
                                reject('readBaseSettings timeout');
                            }
                        }, this.props.cmdTimeout);

                        this._socket.emit('sendToHost', host, 'readBaseSettings', null, data => {
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = null;

                                if (data === PERMISSION_ERROR) {
                                    reject('May not read "BaseSettings"');
                                } else if (!data) {
                                    reject('Cannot read "BaseSettings"');
                                } else {
                                    resolve(data);
                                }
                            }
                        });
                    });
                } else {
                    return Promise.reject('Not supported');
                }
            })
    }

    /**
     * Write the base settings of a given host.
     * @param {string} host
     * @param {any} config
     * @returns {Promise<any>}
     */
    writeBaseSettings(host, config) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return this.checkFeatureSupported('CONTROLLER_READWRITE_BASE_SETTINGS')
            .then(result => {
                if (result) {
                    if (!this.connected) {
                        return Promise.reject(NOT_CONNECTED);
                    }
                    return new Promise((resolve, reject) => {
                        let timeout = setTimeout(() => {
                            if (timeout) {
                                timeout = null;
                                reject('writeBaseSettings timeout');
                            }
                        }, this.props.cmdTimeout);

                        this._socket.emit('sendToHost', host, 'writeBaseSettings', config, data => {
                            if (timeout) {
                                clearTimeout(timeout);
                                timeout = null;

                                if (data === PERMISSION_ERROR) {
                                    reject('May not write "BaseSettings"');
                                } else if (!data) {
                                    reject('Cannot write "BaseSettings"');
                                } else {
                                    resolve(data);
                                }
                            }
                        });
                    });
                } else {
                    return Promise.reject('Not supported');
                }
            })
    }

    /**
     * Send command to restart the iobroker on host
     * @param {string} host
     * @returns {Promise<any>}
     */
    restartController(host) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return new Promise((resolve, reject) => {
            this._socket.emit('sendToHost', host, 'restartController', null, error => {
                error ? reject(error) : resolve(true);
            });
        });
    }

    /**
     * Read statistics information from host
     * @param {string} host
     * @param {string} typeOfDiag one of none, normal, no-city, extended
     * @returns {Promise<any>}
     */
    getDiagData(host, typeOfDiag) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return new Promise(resolve => {
            this._socket.emit('sendToHost', host, 'getDiagData', typeOfDiag, result =>
                resolve(result));
        });
    }

    /**
     * Read all states (which might not belong to this adapter) which match the given pattern.
     * @param {string} pattern
     * @returns {ioBroker.GetStatesPromise}
     */
    getForeignStates(pattern) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getForeignStates', pattern || '*', (err, states) =>
                err ? reject(err) : resolve(states)));
    }

    /**
     * Get foreign objects by pattern, by specific type and resolve their enums.
     * @param {string} pattern
     * @param {string} [type]
     * @returns {ioBroker.GetObjectsPromise}
     */
    getForeignObjects(pattern, type) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getForeignObjects', pattern || '*', type, (err, states) =>
                err ? reject(err) : resolve(states)));
    }

    /**
     * Gets the system configuration.
     * @param {boolean} [update] Force update.
     * @returns {Promise<ioBroker.OtherObject>}
     */
    getSystemConfig(update) {
        if (update) {
            this._promises.systemConfig = null;
        }
        if (!this._promises.systemConfig && !this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises.systemConfig = this._promises.systemConfig || this.getObject('system.config')
            .then(systemConfig => {
                systemConfig = systemConfig || {};
                systemConfig.common = systemConfig.common || {};
                systemConfig.native = systemConfig.native || {};
                return systemConfig;
            });

        return this._promises.systemConfig;
    }

    /**
     * Sets the system configuration.
     * @param {ioBroker.SettableObjectWorker<ioBroker.OtherObject>} obj
     * @returns {Promise<ioBroker.SettableObjectWorker<ioBroker.OtherObject>>}
     */
    setSystemConfig(obj) {
        return this.setObject('system.config', obj)
            .then(() => this._promises.systemConfig = Promise.resolve(obj));
    }

    /**
     * Get the raw socket.io socket.
     * @returns {any}
     */
    getRawSocket() {
        return this._socket;
    }

    /**
     * Get the history of a given state.
     * @param {string} id
     * @param {ioBroker.GetHistoryOptions} options
     * @returns {Promise<ioBroker.GetHistoryResult>}
     */
    getHistory(id, options) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('getHistory', id, options, (err, values) =>
                err ? reject(err) : resolve(values)));
    }

    /**
     * Get the history of a given state.
     * @param {string} id
     * @param {ioBroker.GetHistoryOptions} options
     * @returns {Promise<{values: ioBroker.GetHistoryResult; sesionId: string; stepIgnore: number}>}
     */
    getHistoryEx(id, options) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('getHistory', id, options, (err, values, stepIgnore, sessionId) =>
                err ? reject(err) : resolve({values, sessionId, stepIgnore})));
    }

    /**
     * Change the password of the given user.
     * @param {string} user
     * @param {string} password
     * @returns {Promise<void>}
     */
    changePassword(user, password) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('changePassword', user, password, err =>
                err ? reject(err) : resolve()));
    }

    /**
     * Get the IP addresses of the given host.
     * @param {string} host
     * @param {boolean} [update] Force update.
     * @returns {Promise<string[]>}
     */
    getIpAddresses(host, update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!host.startsWith('system.host.')) {
            host = 'system.host.' + host;
        }

        if (!update && this._promises['IPs_' + host]) {
            return this._promises['IPs_' + host];
        }
        this._promises['IPs_' + host] = this.getObject(host)
            .then(obj => obj && obj.common ? obj.common.address || [] : []);

        return this._promises['IPs_' + host];
    }

    /**
     * Get the IP addresses with interface names of the given host or find host by IP.
     * @param {string} ipOrHostName
     * @param {boolean} [update] Force update.
     * @returns {Promise<any[<name, address, family>]>}
     */
    getHostByIp(ipOrHostName, update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (ipOrHostName.startsWith('system.host.')) {
            ipOrHostName = ipOrHostName.replace(/^system\.host\./, '');
        }

        if (!update && this._promises['rIPs_' + ipOrHostName]) {
            return this._promises['rIPs_' + ipOrHostName];
        }
        this._promises['rIPs_' + ipOrHostName] = new Promise(resolve =>
            this._socket.emit('getHostByIp', ipOrHostName, (ip, host) => {
                const IPs4 = [{name: '[IPv4] 0.0.0.0 - Listen on all IPs', address: '0.0.0.0', family: 'ipv4'}];
                const IPs6 = [{name: '[IPv6] :: - Listen on all IPs',      address: '::',      family: 'ipv6'}];
                if (host.native?.hardware?.networkInterfaces) {
                    for (const eth in host.native.hardware.networkInterfaces) {
                        if (!host.native.hardware.networkInterfaces.hasOwnProperty(eth)) {
                            continue;
                        }
                        for (let num = 0; num < host.native.hardware.networkInterfaces[eth].length; num++) {
                            if (host.native.hardware.networkInterfaces[eth][num].family !== 'IPv6') {
                                IPs4.push({name: `[${host.native.hardware.networkInterfaces[eth][num].family}] ${host.native.hardware.networkInterfaces[eth][num].address} - ${eth}`, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv4'});
                            } else {
                                IPs6.push({name: `[${host.native.hardware.networkInterfaces[eth][num].family}] ${host.native.hardware.networkInterfaces[eth][num].address} - ${eth}`, address: host.native.hardware.networkInterfaces[eth][num].address, family: 'ipv6'});
                            }
                        }
                    }
                }
                for (let i = 0; i < IPs6.length; i++) {
                    IPs4.push(IPs6[i]);
                }
                resolve(IPs4);
            }));

        return this._promises['rIPs_' + ipOrHostName];
    }

    /**
     * Encrypt a text
     * @param {string} text
     * @returns {Promise<string>}
     */
    encrypt(text) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('encrypt', text, (err, text) =>
                err ? reject(err) : resolve(text)));
    }

    /**
     * Decrypt a text
     * @param {string} encryptedText
     * @returns {Promise<string>}
     */
    decrypt(encryptedText) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('decrypt', encryptedText, (err, text) =>
                err ? reject(err) : resolve(text)));
    }

    /**
     * Gets the version.
     * @returns {Promise<{version: string; serverName: string}>}
     */
    getVersion() {
        this._promises.version = this._promises.version || new Promise((resolve, reject) =>
            this._socket.emit('getVersion', (err, version, serverName) => {
                // support of old socket.io
                if (err && !version && typeof err === 'string' && err.match(/\d+\.\d+\.\d+/)) {
                    resolve({version: err, serverName: 'socketio'});
                } else {
                    return err ? reject(err) : resolve({version, serverName});
                }
            }));

        return this._promises.version;
    }

    /**
     * Gets the web server name.
     * @returns {Promise<string>}
     */
    getWebServerName() {
        this._promises.webName = this._promises.webName || new Promise((resolve, reject) =>
            this._socket.emit('getAdapterName', (err, name) =>
                err ? reject(err) : resolve(name)));

        return this._promises.webName;
    }

    /**
     * Gets the admin version.
     * @deprecated use getVersion()
     * @returns {Promise<{version: string; serverName: string}>}
     */
    getAdminVersion() {
        console.log('Deprecated: use getVersion');
        return this.getVersion();
    }

    /**
     * Change access rights for file
     * @param {string} [adapter] adapter name
     * @param {string} [filename] file name with full path. it could be like vis.0/*
     * @param {object} [options] like {mode: 0x644}
     * @returns {Promise<{entries: array}>}
     */
    chmodFile(adapter, filename, options) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('chmodFile', adapter, filename, options, (err, entries, id) =>
                err ? reject(err) : resolve({entries, id})));
    }

    /**
     * Change owner or/and owner group for file
     * @param {string} [adapter] adapter name
     * @param {string} [filename] file name with full path. it could be like vis.0/*
     * @param {object} [options] like {owner: 'newOwner', ownerGroup: 'newGroup'}
     * @returns {Promise<{entries: array}>}
     */
    chownFile(adapter, filename, options) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('chownFile', adapter, filename, options, (err, entries, id) =>
                err ? reject(err) : resolve({entries, id})));
    }

    /**
     * Check if the file exists
     * @param {string} [adapter] adapter name
     * @param {string} [filename] file name with full path. it could be like vis.0/*
     * @returns {Promise<boolean>}
     */
    fileExists(adapter, filename) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('fileExists', adapter, filename, (err, exists) =>
                err ? reject(err) : resolve(exists)));
    }

    /**
     * Get the alarm notifications from a host (only for admin connection).
     * @param {string} host
     * @param {string} [category] - optional
     * @returns {Promise<any>}
     */
    getNotifications(host, category) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendToHost', host, 'getNotifications', {category}, notifications =>
                resolve(notifications)));
    }

    /**
     * Clear the alarm notifications on a host (only for admin connection).
     * @param {string} host
     * @param {string} [category] - optional
     * @returns {Promise<any>}
     */
    clearNotifications(host, category) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendToHost', host, 'clearNotifications', {category}, notifications =>
                resolve(notifications)));
    }

    /**
     * Read if only easy mode is allowed  (only for admin connection).
     * @returns {Promise<boolean>}
     */
    getIsEasyModeStrict() {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getIsEasyModeStrict', (error, isStrict) =>
                error ? reject(error) : resolve(isStrict)));
    }

    /**
     * Read easy mode configuration (only for admin connection).
     * @returns {Promise<any>}
     */
    getEasyMode() {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getEasyMode', (error, config) =>
                error ? reject(error) : resolve(config)));
    }

    /**
     * Read current user
     * @returns {Promise<string>}
     */
    getCurrentUser() {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('authEnabled', (isSecure, user) =>
                resolve(user)));
    }

    /**
     * Read adapter ratings
     * @returns {Promise<any>}
     */
    getRatings(update) {
        if (Connection.isWeb()) {
            return Promise.reject('Allowed only in admin');
        }
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getRatings', update, (err, ratings) =>
                err ? reject(err) : resolve(ratings)));
    }

    /**
     * Read current web, socketio or admin namespace, like admin.0
     * @returns {Promise<string>}
     */
    getCurrentInstance(update) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getCurrentInstance', (err, namespace) =>
                err ? reject(err) : resolve(namespace)));
    }

}

Connection.Connection = {
    onLog: PropTypes.func,
    onReady: PropTypes.func,
    onProgress: PropTypes.func,
};

export {ERRORS};

export default Connection;
