/* This file is temporary here to speed-up the development of this component.
    Later it will be moved to adapter-react
 */

import PropTypes from 'prop-types';

export const PROGRESS = {
    CONNECTING: 0,
    CONNECTED: 1,
    OBJECTS_LOADED: 2,
    READY: 3
};

const PERMISSION_ERROR = 'permissionError';
const NOT_CONNECTED    = 'notConnectedError';

class Connection {
    constructor(props) {
        props = props || {};
        this.props = props;

        this.autoSubscribes   = this.props.autoSubscribes || [];
        this.autoSubscribeLog = this.props.autoSubscribeLog;

        this.props.protocol = this.props.protocol || window.location.protocol;
        this.props.host     = this.props.host     || (window.location.host && window.location.host.substr(0, window.location.host.indexOf(':')));
        this.props.port     = this.props.port     || 8081;

        // breaking change. Do not load all objects by default is true
        this.doNotLoadAllObjects = this.props.doNotLoadAllObjects === undefined ? true : this.props.doNotLoadAllObjects;

        this.states = {};
        this.objects = null;
        this.acl = null;
        this.firstConnect = true;
        this.waitForRestart = false;
        this.systemLang = 'en';
        this.connected = false;
        this.statesSubscribes = {}; // subscribe for states
        this.objectsSubscribes = {}; // subscribe for objects
        this.onProgress = this.props.onProgress || function () {};
        this.onError = this.props.onError || function (err) {console.error(err);};
        this.loaded = false;
        this.loadTimer = null;
        this.loadCounter = 0;
        this.certPromise = null;
        
        this.onConnectionHandlers = [];
        this.onLogHandlers = [];

        this._promises = {};
        this.startSocket();
    }

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
                    return setTimeout(() => this.startSocket(), 100);
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
        this._socket = window.io.connect(
            this.props.protocol.replace(':', '') + '://' + this.props.host + ':' + this.props.port,
            {query: 'ws=true', name: this.props.name}
        );

        this._socket.on('connect', () => {
            this._socket.emit('authenticate', (isOk, isSecure) => {
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
            });
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
            let _err = (err || '');
            if (typeof _err.toString !== 'function') {
                _err = JSON.stringify(_err);
                console.error('Received strange error: ' + _err);
            }
            _err = _err.toString();
            if (_err.indexOf('User not authorized') !== -1) {
                this.authenticate();
            } else {
                window.alert('Socket Error: ' + err);
            }
        });

        this._socket.on('connect_error', err =>
            console.error('Connect error: ' + err));

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
    
    isConnected() {
        return this.connected;
    }

    onConnect() {
        this._socket.emit('getUserPermissions', (err, acl) => {
            if (this.loaded) {
                return;
            }
            this.loaded = true;
            clearTimeout(this.loadTimer);
            this.loadTimer = null;

            this.onProgress(PROGRESS.CONNECTED);
            this.firstConnect = false;

            this.acl = acl;
            // Read system configuration
            this._socket.emit('getObject', 'system.config', (err, data) => {
                this.systemConfig = data;
                if (!err && this.systemConfig && this.systemConfig.common) {
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
                    this.getObjects(() => {
                        this.onProgress(PROGRESS.READY);
                        this.props.onReady && this.props.onReady(this.objects);
                    });
                } else {
                    this.objects = {'system.config': data};
                    this.onProgress(PROGRESS.READY);
                    this.props.onReady && this.props.onReady(this.objects);
                }
            });
        });
    }

    authenticate() {
        window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?login&href=${window.location.search}${window.location.hash}`;
    }

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
            this.statesSubscribes[id].cbs.indexOf(cb) === -1 && this.statesSubscribes[id].cbs.push(cb);
        }
        if (typeof cb === 'function' && this.connected) {
            if (binary) {
                this.getBinaryState(id)
                    .then(base64 => cb(id, base64));
            } else {
                this._socket.emit('getForeignStates', id, (err, states) =>
                    states && Object.keys(states).forEach(id => cb(id, states[id])));
            }
        }
    }

    unsubscribeState(id, cb) {
        if (this.statesSubscribes[id]) {
            if (cb) {
                const pos = this.statesSubscribes[id].cbs.indexOf(cb);
                pos !== -1 && this.statesSubscribes[id].cbs.splice(pos, 1);
            } else {
                this.statesSubscribes[id].cbs = null;
            }

            if (!this.statesSubscribes[id].cbs || !this.statesSubscribes[id].cbs.length) {
                delete this.statesSubscribes[id];
                this.connected && this._socket.emit('unsubscribe', id);
            }
        }
    }

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

    unsubscribeObject(id, cb) {
        if (this.objectsSubscribes[id]) {
            if (cb) {
                const pos = this.objectsSubscribes[id].cbs.indexOf(cb);
                pos !== -1 && this.objectsSubscribes[id].cbs.splice(pos, 1);
            } else {
                this.objectsSubscribes[id].cbs = null;
            }

            if (this.connected && (!this.objectsSubscribes[id].cbs || !this.objectsSubscribes[id].cbs.length)) {
                delete this.objectsSubscribes[id];
                this.connected && this._socket.emit('unsubscribeObjects', id);
            }
        }
        return Promise.resolve();
    }

    objectChange(id, obj) {
        // update main.objects cache
        if (!this.objects) {
            return;
        }

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

        if (this.props.onBlocklyChanges && id.match(/^system\.adapter\.[-\w\d]+\$/)) {
            if (obj[id].common && obj[id].common.blockly) {
                this.props.onBlocklyChanges(id);
            }
        }

        if (changed && this.props.onObjectChange) {
            this.props.onObjectChange(this.objects);
        }
    }

    stateChange(id, state) {
        id = id ? id.replace(/[\s'"]/g, '_') : '';
        for (const task in this.statesSubscribes) {
            if (this.statesSubscribes.hasOwnProperty(task) && this.statesSubscribes[task].reg.test(id)) {
                this.statesSubscribes[task].cbs.forEach(cb => cb(id, state));
            }
        }
    }

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

    getState(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('getState', id, (err, state) => err ? reject(err) : resolve(state)));
    }

    getBinaryState(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        // the data will come in base64
        return new Promise((resolve, reject) =>
            this._socket.emit('getBinaryState', id, (err, state) => err ? reject(err) : resolve(state)));
    }

    setBinaryState(id, base64) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        // the data will come in base64
        return new Promise((resolve, reject) =>
            this._socket.emit('setBinaryState', id, base64, err => err ? reject(err) : resolve()));
    }

    setState(id, val) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        return new Promise((resolve, reject) =>
            this._socket.emit('setState', id, val, err =>
                err ? reject(err) : resolve()));
    }

    getObjects(update, disableProgressUpdate) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
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

    requireLog(isEnabled) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('requireLog', isEnabled, err =>
                err ? reject(err) : resolve()));
    }

    delObject(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('delObject', id, err =>
                err ? reject(err) : resolve()));
    }

    setObject(id, obj) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('setObject', id, obj, err =>
                err ? reject(err) : resolve()));
    }

    getObject(id) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getObject', id, (err, obj) =>
                err ? reject(err) : resolve(obj)));
    }

    getAdapterInstances(adapter, update) {
        if (typeof adapter === 'boolean') {
            update = adapter;
            adapter = '';
        }
        adapter = adapter || '';

        if (!update && this._promises['instances' + adapter]) {
            return this._promises['instances' + adapter];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['instances' + adapter] = this._promises['instances' + adapter] || new Promise((resolve, reject) => {
            this._socket.emit(
                'getObjectView',
                'system',
                'instance',
                {startkey: 'system.adapter.' + (adapter || ''), endkey: 'system.adapter.' + (adapter ? adapter + '.' : '') + '\u9999'},
                (err, doc) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc.rows.map(item => item.value));
                    }
                });
        });

        return this._promises['instances' + adapter];
    }

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

    sendTo(instance, command, data) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendTo', instance, command, data, result => resolve(result)));
    }

    extendObject(id, obj) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('extendObject', id, obj, err => err ? reject(err) : resolve()));
    }

    registerLogHandler(handler) {
        !this.onLogHandlers.includes(handler) && this.onLogHandlers.push(handler);
    }

    unregisterLogHandler(handler) {
        const pos = this.onLogHandlers.indexOf(handler);
        pos !== -1 && this.onLogHandlers.splice(pos, 1);
    }

    registerConnectionHandler(handler) {
        !this.onConnectionHandlers.includes(handler) && this.onConnectionHandlers.push(handler);
    }
    
    unregisterConnectionHandler(handler) {
        const pos = this.onConnectionHandlers.indexOf(handler);
        pos !== -1 && this.onConnectionHandlers.splice(pos, 1);
    }

    registerCmdStdoutHandler(handler) {
        this.onCmdStdoutHandler = handler;
    }

    unregisterCmdStdoutHandler(handler) {
        this.onCmdStdoutHandler = null;
    }

    registerCmdStderrHandler(handler) {
        this.onCmdStderrHandler = handler;
    }

    unregisterCmdStderrHandler(handler) {
        this.onCmdStderrHandler = null;
    }

    registerCmdExitHandler(handler) {
        this.onCmdExitHandler = handler;
    }

    unregisterCmdExitHandler(handler) {
        this.onCmdExitHandler = null;
    }

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
                    const _res   = {};
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

    getCertificates(update) {
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

    getLogs(host, linesNumber) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise(resolve =>
            this._socket.emit('sendToHost', host, 'getLogs', linesNumber || 200, lines =>
                resolve(lines)));
    }

    getLogsFiles() {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('readLogs', (err, files) =>
                err ? reject(err) : resolve(files)));
    }

    delLogs(host) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('sendToHost', host, 'delLogs', null, error =>
                error ? reject(error) : resolve()));
    }

    readMetaItems() {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getObjectView', 'system', 'meta', {startkey: '', endkey: '\u9999'}, (err, objs) =>
                err ? reject(err) : resolve(objs.rows && objs.rows.map(obj => obj.value))));
    }

    readDir(adapter, fileName) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('readDir', adapter, fileName, (err, files) =>
                err ? reject(err) : resolve(files)));
    }

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
    
    deleteFile(adapter, fileName) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('deleteFile', adapter, fileName, err =>
                err ? reject(err) : resolve()));
    }

    getHosts(update) {
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

    getUsers(update) {
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

    getGroups(update) {
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

    getHostInfo(host, update) {
        if (!host.startsWith(host)) {
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
                    reject('timeout');
                }
            }, 5000);

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

    getRepository(host, args, update) {
        if (!update && this._promises.repo) {
            return this._promises.repo;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!host.startsWith(host)) {
            host += 'system.host.' + host;
        }

        this._promises.repo = new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('timeout');
                }
            }, 5000);

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

    getInstalled(host, update) {
        if (!update && this._promises.installed) {
            return this._promises.installed;
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        if (!host.startsWith(host)) {
            host += 'system.host.' + host;
        }

        this._promises.installed = new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                if (timeout) {
                    timeout = null;
                    reject('timeout');
                }
            }, 5000);

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

    cmdExec(host, cmd, cmdId) {
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
                    reject('timeout');
                }
            }, 5000);

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
    
    checkFeatureSupported(feature, update) {
        if (!update && this._promises['supportedFeatures_' + feature]) {
            return this._promises['supportedFeatures_' + feature];
        }

        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }

        this._promises['supportedFeatures_' + feature] = new Promise((resolve, reject) =>
            this._socket.emit('checkFeatureSupported', feature, (err, features) => {
                console.log(features);
                err ? reject(err) : resolve(features)
            }));

        return this._promises['supportedFeatures_' + feature];
    }

    readBaseSettings(host) {
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
                                reject('timeout');
                            }
                        }, 5000);

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

    writeBaseSettings(host, config) {
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
                                reject('timeout');
                            }
                        }, 5000);

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

    getForeignStates(pattern) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getForeignStates', pattern || '*', (err, states) =>
                err ? reject(err) : resolve(states)));
    }

    // type could be undefined
    getForeignObjects(pattern, type) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getForeignObjects', pattern || '*', type, (err, states) =>
                err ? reject(err) : resolve(states)));
    }

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

    setSystemConfig(obj) {
        return this.setObject('system.config', obj)
            .then(() => this._promises.systemConfig = Promise.resolve(obj));
    }

    getRawSocket() {
        return this._socket;
    }

    getHistory(id, options) {
        if (!this.connected) {
            return Promise.reject(NOT_CONNECTED);
        }
        return new Promise((resolve, reject) =>
            this._socket.emit('getHistory', id, options, (err, values) =>
                err ? reject(err) : resolve(values)));
    }

    changePassword(user, password) {
        return new Promise((resolve, reject) =>
            this._socket.emit('changePassword', user, password, err =>
                err ? reject(err) : resolve()));
    }

    getIpAddresses(host, update) {
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

    decryptPhrase(encryptedPhrase) {
        return new Promise((resolve, reject) =>
        this._socket.emit('decryptPhrase', encryptedPhrase, (err, text) =>
            err ? reject(err) : resolve(text)));
    }

    encryptPhrase(phrasePlainText) {
        return new Promise((resolve, reject) =>
            this._socket.emit('encryptPhrase', phrasePlainText, (err, text) =>
                err ? reject(err) : resolve(text)));
    }

    encrypt(text) {
        return new Promise((resolve, reject) =>
            this._socket.emit('encrypt', text, (err, text) =>
                err ? reject(err) : resolve(text)));
    }

    decrypt(encryptedText) {
        return new Promise((resolve, reject) =>
            this._socket.emit('decrypt', encryptedText, (err, text) =>
                err ? reject(err) : resolve(text)));
    }
}

Connection.Connection = {
    onLog: PropTypes.func,
    onReady: PropTypes.func,
    onProgress: PropTypes.func,
};

export default Connection;
