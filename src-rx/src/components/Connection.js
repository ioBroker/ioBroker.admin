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

class Connection {
    constructor(props) {
        props = props || {};
        this.props = props;

        this.autoSubscribes   = this.props.autoSubscribes || [];
        this.autoSubscribeLog = this.props.autoSubscribeLog;

        this.props.protocol = this.props.protocol || window.location.protocol;
        this.props.host     = this.props.host     || (window.location.host && window.location.host.substr(0, window.location.host.indexOf(':')));
        this.props.port     = this.props.port     || 8081;

        this.socket = window.io.connect(this.props.protocol.replace(':', '') + '://' + this.props.host + ':' + this.props.port,
            {query: 'ws=true'});
        this.states = {};
        this.objects = null;
        this.scripts = {
            list: [],
            hosts: [],
            groups: [],
            instances: []
        };
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

        this.socket.on('connect', () => {
            this.connected = true;
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

            this.subscribe(true);

            if (this.waitForRestart) {
                window.location.reload();
            }
        });
        this.socket.on('disconnect', () => {
            this.connected = false;
            this.subscribed = false;
            this.onProgress(PROGRESS.CONNECTING)
        });
        this.socket.on('reconnect', () => {
            this.onProgress(PROGRESS.READY);
            if (this.waitForRestart) {
                window.location.reload();
            }
        });
        this.socket.on('reauthenticate', () => this.authenticate());
        this.socket.on('log', message => {
            this.props.onLog && this.props.onLog(message);
            this.onLogHandler && this.onLogHandler(message);
        });

        this.socket.on('error', err => {
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
        this.socket.on('connect_error', err =>
            console.error('Connect error: ' + err));

        this.socket.on('permissionError', err =>
            this.onError({message: 'no permission', operation: err.operation, type: err.type, id: (err.id || '')}));

        this.socket.on('objectChange', (id, obj) => setTimeout(() => this.objectChange(id, obj), 0));
        this.socket.on('stateChange', (id, state) => setTimeout(() => this.stateChange(id, state), 0));
    }

    onConnect() {
        this.socket.emit('getUserPermissions', (err, acl) => {
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
            this.socket.emit('getObject', 'system.config', (err, data) => {
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

                if (!this.props.doNotLoadAllObjects) {
                    this.getObjects(() => {
                        this.onProgress(PROGRESS.READY);
                        this.props.onReady && this.props.onReady(this.objects, this.scripts);
                    });
                } else {
                    this.objects = {'system.config': data};
                    this.onProgress(PROGRESS.READY);
                    this.props.onReady && this.props.onReady(this.objects, this.scripts);
                }
            });
        });
    }

    authenticate() {
        if (window.location.port === '3000' || (window.location.search && window.location.search.startsWith('?href='))) {
            window.alert('Please login in not debug window and then refresh');
        } else {
            // relocate to login.html
            window.location = '/login?href=' + window.location.pathname + (window.location.search || '');
        }
    }

    subscribeState(id, cb) {
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
                this.socket.emit('subscribe', id);
            }
        } else {
            this.statesSubscribes[id].cbs.indexOf(cb) === -1 && this.statesSubscribes[id].cbs.push(cb);
        }
        if (typeof cb === 'function') {
            this.socket.emit('getForeignStates', id, (err, states) =>
                states && Object.keys(states).forEach(id => cb(id, states[id])));
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
                this.connected && this.socket.emit('unsubscribe', id);
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
            if (this.connected) {
                this.socket.emit('subscribeObjects', id);
            }
        } else {
            this.objectsSubscribes[id].cbs.indexOf(cb) === -1 && this.objectsSubscribes[id].cbs.push(cb);
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
                this.socket.emit('unsubscribeObjects', id);
            }
        }
        return Promise.resolve();
    }

    objectChange(id, obj) {
        // update main.objects cache
        if (!this.objects) return;

        let changed = false;
        if (obj) {
            if (obj._rev && this.objects[id]) {
                this.objects[id]._rev = obj._rev;
            }

            if (!this.objects[id] || JSON.stringify(this.objects[id]) !== JSON.stringify(obj)) {
                this.objects[id] = obj;
                changed = true;
                let pos;
                if (obj.type === 'instance') {
                    pos = this.scripts.instances.indexOf(id);
                    pos === -1 && this.scripts.instances.push(id);
                } else
                if (obj.type === 'script') {
                    pos = this.scripts.list.indexOf(id);
                    pos === -1 && this.scripts.list.push(id);
                } else
                if (id.match(/^script\.js\./) && obj.type === 'channel') {
                    pos = this.scripts.groups.indexOf(id);
                    pos === -1 && this.scripts.groups.push(id);
                }
            }
        } else if (this.objects[id]) {
            const oldObj = {_id: id, type: this.objects[id].type};
            delete this.objects[id];
            let pos;
            if (oldObj.type === 'instance') {
                pos = this.scripts.instances.indexOf(id);
                if (pos !== -1) this.scripts.instances.splice(pos, 1);
            } else
            if (oldObj.type === 'script') {
                pos = this.scripts.list.indexOf(id);
                if (pos !== -1) this.scripts.list.splice(pos, 1);
            } else
            if (id.match(/^script\.js\./) && oldObj.type === 'channel') {
                pos = this.scripts.groups.indexOf(id);
                if (pos !== -1) this.scripts.groups.splice(pos, 1);
            }
            changed = true;
        }

        Object.keys(this.objectsSubscribes).forEach(_id => {
            if (_id === id || this.objectsSubscribes[_id].reg.test(id)) {
                this.objectsSubscribes[_id].cbs.forEach(cb => cb(id, obj));
            }
        });

        if (this.props.onBlocklyChanges && id.match(/^system\.adapter\.[-\w\d]+\$/)) {
            if (obj[id].common && obj[id].common.blockly) {
                this.props.onBlocklyChanges(id);
            }
        }
        if (changed && this.props.onObjectChange) {
            this.props.onObjectChange(this.objects, this.scripts);
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

    getStates(cb, disableProgressUpdate) {
        this.socket.emit('getStates', (err, res) => {
            this.states = res;
            !disableProgressUpdate && this.onProgress(PROGRESS.STATES_LOADED);
            cb && setTimeout(() => cb(this.states), 0);
        });
    }

    getState(id, cb) {
        if (!cb) {
            return new Promise((resolve, reject) =>
                this.getState(id, (err, state) => err ? reject(err) : resolve(state)));
        } else {
            this.socket.emit('getState', id, cb);
        }
    }

    setState(id, val, cb) {
        if (!cb) {
            return new Promise((resolve, reject) =>
                this.setState(id, val, err => err ? reject(err) : resolve()));
        } else {
            this.socket.emit('setState', id, val, cb);
        }
    }

    getObjects(refresh, cb, disableProgressUdpate) {
        if (typeof refresh === 'function') {
            disableProgressUdpate = cb;
            cb = refresh;
            refresh = false;
        }

        if (typeof cb !== 'function') {
            return new Promise(resolve => this.getObjects(refresh, objects => resolve(objects)));
        }

        if (!refresh && this.objects) {
            return setTimeout(() => cb && cb(this.objects), 0);
        }

        this.socket.emit('getAllObjects', (err, res) => {
            setTimeout(() => {
                let obj;
                this.objects = res;
                for (const id in this.objects) {
                    if (!this.objects.hasOwnProperty(id) || id.slice(0, 7) === '_design') continue;

                    obj = res[id];
                    if (obj.type === 'instance') {
                        id.startsWith('system.adapter.javascript.') && this.scripts.instances.push(parseInt(id.split('.').pop()));
                    }
                    if (obj.type === 'script')   this.scripts.list.push(id);
                    if (obj.type === 'channel' && id.match(/^script\.js\./)) this.scripts.groups.push(id);
                    if (obj.type === 'host')     this.scripts.hosts.push(id);
                }
                disableProgressUdpate && this.onProgress(PROGRESS.OBJECTS_LOADED);

                cb && cb(this.objects);
            }, 0);
        });
    }

    subscribe(isEnable) {
        if (isEnable && !this.subscribed) {
            this.subscribed = true;
            this.autoSubscribes.forEach(id => this.socket.emit('subscribeObjects', id));
            Object.keys(this.objectsSubscribes).forEach(id => this.socket.emit('subscribeObjects', id));
            this.autoSubscribeLog && this.socket.emit('requireLog', true);

            Object.keys(this.statesSubscribes).forEach(id => this.socket.emit('subscribe', id));
        } else if (!isEnable && this.subscribed) {
            this.subscribed = false;
            this.autoSubscribes.forEach(id => this.socket.emit('unsubscribeObjects', id));
            Object.keys(this.objectsSubscribes).forEach(id => this.socket.emit('unsubscribeObjects', id));
            this.autoSubscribeLog && this.socket.emit('requireLog', false);

            Object.keys(this.statesSubscribes).forEach(id => this.socket.emit('unsubscribe', id));
        }
    }

    delObject(id) {
        return new Promise((resolve, reject) =>
            this.socket.emit('delObject', id, err =>
                err ? reject(err) : resolve()));
    }

    setObject(id, obj) {
        return new Promise((resolve, reject) =>
            this.socket.emit('setObject', id, obj, err =>
                err ? reject(err) : resolve()));
    }

    getObject(id) {
        return new Promise((resolve, reject) =>
            this.socket.emit('getObject', id, (err, obj) =>
                err ? reject(err) : resolve(obj)));
    }

    updateScript(oldId, newId, newCommon) {
        return new Promise((resolve, reject) => {
            this.socket.emit('getObject', oldId, (err, _obj) => {
                setTimeout(() => {
                    const obj = {common: {}};

                    if (newCommon.engine  !== undefined) obj.common.engine  = newCommon.engine;
                    if (newCommon.enabled !== undefined) obj.common.enabled = newCommon.enabled;
                    if (newCommon.source  !== undefined) obj.common.source  = newCommon.source;
                    if (newCommon.debug   !== undefined) obj.common.debug   = newCommon.debug;
                    if (newCommon.verbose !== undefined) obj.common.verbose = newCommon.verbose;

                    obj.from = 'system.adapter.admin.0'; // we must distinguish between GUI(admin.0) and disk(javascript.0)

                    if (oldId === newId && _obj && _obj.common && newCommon.name === _obj.common.name) {
                        if (!newCommon.engineType || newCommon.engineType !== _obj.common.engineType) {
                            if (newCommon.engineType !== undefined) obj.common.engineType  = newCommon.engineType || 'Javascript/js';

                            this.socket.emit('extendObject', oldId, obj, err => err ? reject(err) : resolve());
                        } else {
                            this.socket.emit('extendObject', oldId, obj, err => err ? reject(err) : resolve());
                        }
                    } else {
                        // let prefix;

                        // let parts = _obj.common.engineType.split('/');

                        // prefix = 'script.' + (parts[1] || parts[0]) + '.';

                        if (_obj && _obj.common) {
                            _obj.common.engineType = newCommon.engineType || _obj.common.engineType || 'Javascript/js';
                            this.socket.emit('delObject', oldId, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (obj.common.engine  !== undefined) _obj.common.engine  = obj.common.engine;
                                    if (obj.common.enabled !== undefined) _obj.common.enabled = obj.common.enabled;
                                    if (obj.common.source  !== undefined) _obj.common.source  = obj.common.source;
                                    if (obj.common.name    !== undefined) _obj.common.name    = obj.common.name;
                                    if (obj.common.debug   !== undefined) _obj.common.debug   = obj.common.debug;
                                    if (obj.common.verbose !== undefined) _obj.common.verbose = obj.common.verbose;

                                    delete _obj._rev;

                                    // Name must always exist
                                    _obj.common.name = newCommon.name;

                                    _obj._id = newId; // prefix + newCommon.name.replace(/[\s"']/g, '_');

                                    this.socket.emit('setObject', newId, _obj, err => err ? reject(err) : resolve());
                                }
                            });
                            return;
                        } else {
                            _obj = obj;
                        }

                        // Name must always exist
                        _obj.common.name = newCommon.name;

                        _obj._id = newId; // prefix + newCommon.name.replace(/[\s"']/g, '_');

                        this.socket.emit('setObject', newId, _obj, err => err ? reject(err) : resolve());
                    }
                }, 0);
            });
        });
    }

    getAdapterInstances(adapter) {
        return new Promise((resolve, reject) => {
            this.socket.emit('getObjectView', 'system', 'instance', {startkey: 'system.adapter.' + (adapter || ''), endkey: 'system.adapter.' + (adapter ? adapter + '.' : '') + '\u9999'}, (err, doc) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc.rows.map(item => item.value));
                }
            });
        });
    }

    _deleteGroup(id, originalGroup, confirmed, deleted) {
        if (confirmed.indexOf(id) === -1) {
            confirmed.push(id);
        }

        return new Promise((resolve, reject) => {
            // find all elements
            for (let l = 0; l < this.scripts.list.length; l++) {
                if (this.scripts.list[l].substring(0, id.length + 1) === id + '.' &&
                    (!deleted || deleted.indexOf(this.scripts.list[l]) === -1)) {
                    return this.deleteId(this.scripts.list[l], id, confirmed, deleted);
                }
            }

            for (let g = 0; g < this.scripts.groups.length; g++) {
                if (this.scripts.groups[g].substring(0, id.length + 1) === id + '.') {
                    return this.deleteId(this.scripts.groups[g], id, confirmed, deleted);
                }
            }

            this.socket.emit('delObject', id, err => {
                if (err) {
                    reject(err);
                } else if (originalGroup !== id) {
                    return this.deleteId(originalGroup, null, confirmed, deleted);
                } else {
                    // finish
                    resolve();
                }
            });
        });
    }

    deleteId(id, originalGroup, confirmed, deleted) {
        originalGroup = originalGroup || id;
        confirmed     = confirmed     || [];
        deleted       = deleted       || [];

        return new Promise((resolve, reject) => {
            if (this.objects[id] && this.objects[id].type === 'script') {
                if (this.props.onConfirmDelete) {
                    this.props.onConfirmDelete(false, this.objects[id].common.name, result => {
                        if (result) {
                            this.socket.emit('delObject', id, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    deleted.push(id);
                                    return this.deleteId(originalGroup, null, confirmed, deleted);
                                }
                            });
                        } else {
                            // Do nothing
                            reject('canceled');
                        }
                    });
                } else {
                    this.socket.emit('delObject', id, err => {
                        if (err) {
                            reject(err);
                        } else {
                            deleted.push(id);
                            return this.deleteId(originalGroup, null, confirmed, deleted);
                        }
                    });
                }
            } else {
                let name = id;
                if (confirmed.indexOf(id) === -1) {
                    if (this.objects[id] && this.objects[id].common && this.objects[id].common.name) {
                        name = this.objects[id].common.name;
                    }

                    if (this.props.onConfirmDelete) {
                        this.props.onConfirmDelete(true, name, result => {
                            if (result) {
                                return this._deleteGroup(id, originalGroup, confirmed, deleted);
                            } else {
                                reject('canceled');
                            }
                        });
                    } else {
                        return this._deleteGroup(id, originalGroup, confirmed, deleted);
                    }
                } else {
                    return this._deleteGroup(id, originalGroup, confirmed, deleted);
                }
            }
        });
    }

    renameGroup(id, newId, newName, _list) {
        return new Promise((resolve, reject) => {
            if (!_list) {
                _list = [];

                // collect all elements to rename
                // find all elements
                for (let l = 0; l < this.scripts.list.length; l++) {
                    if (this.scripts.list[l].substring(0, id.length + 1) === id + '.') {
                        _list.push(this.scripts.list[l]);
                    }
                }
                for (let g = 0; g < this.scripts.groups.length; g++) {
                    if (this.scripts.groups[g].substring(0, id.length + 1) === id + '.') {
                        _list.push(this.scripts.list[g]);
                    }
                }

                this.socket.emit('getObject', id, (err, obj) => {
                    if (err) {
                        reject(err);
                    } else {
                        obj = obj || {common: {}};
                        obj.common.name = newName;
                        obj._id = newId;

                        this.socket.emit('delObject', id, err => {
                            if (err) {
                                reject(err);
                            } else {
                                this.socket.emit('setObject', newId, obj, err => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        return this.renameGroup(id, newId, newName, _list);
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                if (_list.length) {
                    let nId = _list.pop();

                    this.socket.emit('getObject', nId, (err, obj) => {
                        if (err) {
                            reject(err);
                        } else {
                            this.socket.emit('delObject', nId, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    nId = newId + nId.substring(id.length);
                                    this.socket.emit('setObject', nId, obj, err => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            return this.renameGroup(id, newId, newName, _list);
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    resolve();
                }
            }
        });
    }

    getScripts() {
        return this.scripts;
    }

    sendTo(instance, command, data, cb) {
        this.socket.emit('sendTo', instance, command, data, cb);
    }

    extendObject(id, obj, cb) {
        this.socket.emit('extendObject', id, obj, cb);
    }

    registerLogHandler(handler) {
        this.onLogHandler = handler;
    }

    unregisterLogHandler(handler) {
        this.onLogHandler = null;
    }

    getEnums(_enum) {
        return new Promise((resolve, reject) => {
            this.socket.emit('getObjectView', 'system', 'enum', {startkey: 'enum.' + (_enum || ''), endkey: 'enum.' + (_enum ? (_enum + '.') : '') + '\u9999'}, (err, res) => {
                if (!err && res) {
                    const _res   = {};
                    for (let i = 0; i < res.rows.length; i++) {
                        if (_enum && res.rows[i].id === 'enum.' + _enum) continue;
                        _res[res.rows[i].id] = res.rows[i].value;
                    }
                    resolve(_res);
                } else {
                    reject(err);
                }
            });
        });
    }

    getCertificates() {
        if (this.certPromise) {
            return this.certPromise;
        }

        this.certPromise = this.getObject('system.certificates')
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

        return this.certPromise;
    }
}

Connection.Connection = {
    onLog: PropTypes.func,
    onReady: PropTypes.func,
    onProgress: PropTypes.func,
};

export default Connection;
