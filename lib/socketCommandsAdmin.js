const SocketCommands = require('./socketCommands');
const axios = require('axios');

class SocketCommandsAdmin extends SocketCommands {
    static ALLOW_CACHE = [
        'getRepository',
        'getInstalled',
        'getInstalledAdapter',
        'getVersion',
        'getDiagData',
        'getLocationOnDisk',
        'getDevList',
        'getLogs',
        'getHostInfo',
    ];

    constructor(adapter, updateSession, objects, states) {
        super(adapter, updateSession);

        this.objects = objects;
        this.states = states;

        this.thersholdInterval = null;
        this.cmdSessions = {};

        this.eventsThreshold = {
            count:          0,
            timeActivated:  0,
            active:         false,
            accidents:      0,
            repeatSeconds:  3,   // how many seconds continuously must be number of events > value
            value:          parseInt(adapter.config.thresholdValue, 10) || 200, // how many events allowed in one check interval
            checkInterval:  1000 // duration of one check interval
        };


        this.cache = {};
        this.cacheGB = null; // cache garbage collector
        // do not send too many state updates
    }

    start(onThresholdChanged) {
        // detect event bursts
        this.thersholdInterval = setInterval(() => {
            if (!this.eventsThreshold.active) {
                if (this.eventsThreshold.count > this.eventsThreshold.value) {
                    this.eventsThreshold.accidents++;

                    if (this.eventsThreshold.accidents >= this.eventsThreshold.repeatSeconds) {
                        this._enableEventThreshold();
                    }
                } else {
                    this.eventsThreshold.accidents = 0;
                }
                this.eventsThreshold.count = 0;
            } else if (Date.now() - this.eventsThreshold.timeActivated > 60000) {
                this.disableEventThreshold();
            }
        }, this.eventsThreshold.checkInterval);

        this.onThresholdChanged = onThresholdChanged;
    }

    _fixAdminUI(obj) {
        if (obj && obj.common && !obj.common.adminUI) {
            if (obj.common.noConfig) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.config = 'none';
            } else if (obj.common.jsonConfig) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.config = 'json';
            } else if (obj.common.materialize) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.config = 'materialize';
            } else {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.config = 'html';
            }

            if (obj.common.jsonCustom) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.custom = 'json';
            } else if (obj.common.supportCustoms) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.custom = 'json';
            }

            if (obj.common.materializeTab && obj.common.adminTab) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.tab = 'materialize';
            } else if (obj.common.adminTab) {
                obj.common.adminUI = obj.common.adminUI || {};
                obj.common.adminUI.tab = 'html';
            }

            obj.common.adminUI && this.adapter.log.debug(`Please add to "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`);
        }
    }

    _readInstanceConfig(id, user, isTab, configs) {
        return new Promise(resolve =>
            this.adapter.getForeignObject('system.adapter.' + id, {user}, (err, obj) => {
                if (obj && obj.common) {
                    const instance = id.split('.').pop();
                    const config = {
                        id,
                        title:       obj.common.titleLang || obj.common.title,
                        desc:        obj.common.desc,
                        color:       obj.common.color,
                        url:         `/adapter/${obj.common.name}/${isTab ? 'tab' : 'index'}${!isTab && obj.common.materialize ? '_m' : ''}.html${instance ? '?' + instance : ''}`,
                        icon:        obj.common.icon,
                        materialize: obj.common.materialize,
                        jsonConfig:  obj.common.jsonConfig,
                    };
                    if (isTab) {
                        config.tab = true;
                    } else {
                        config.config = true;
                    }
                    /*if (typeof config.title === 'object') {
                        config.title = config.title[adapter.systemConfig.language] || config.title.en;
                    }
                    if (typeof config.desc === 'object') {
                        config.desc = config.desc[adapter.systemConfig.language] || config.desc.en;
                    }*/
                    configs.push(config);
                }
                resolve();
            }));
    }

    _sendToHost(host, command, message, callback) {
        const hash = `${host}_${command}`;
        if (!message && SocketCommandsAdmin.ALLOW_CACHE.includes(command) && this.cache[hash]) {
            if (Date.now() - this.cache[hash].ts < 500) {
                return typeof callback === 'function' && setImmediate(data => callback(data), JSON.parse(this.cache[hash].res));
            } else {
                delete this.cache[hash];
            }
        }
        this.adapter.sendToHost(host, command, message, res => {
            if (!message && SocketCommandsAdmin.ALLOW_CACHE.includes(command)) {
                this.cache[hash] = {ts: Date.now(), res: JSON.stringify(res)};

                this.cacheGB = this.cacheGB || setInterval(() => {
                    const commands = Object.keys(this.cache);
                    commands.forEach(cmd => {
                        if (Date.now() - this.cache[cmd].ts > 500) {
                            delete this.cache[cmd];
                        }
                    });
                    if (!commands.length) {
                        clearInterval(this.cacheGB);
                        this.cacheGB = null;
                    }
                }, 2000);
            }
            typeof callback === 'function' && setImmediate(() => callback(res));
        });
    }

    // remove this function when js.controller 4.x will be mainstream
    _readLicenses(login, password) {
        const config = {
            headers: { Authorization: `Basic ${Buffer.from(login + ':' + password).toString('base64')}` },
            timeout: 4000,
            validateStatus: status => status < 400
        };

        return axios.get(`https://iobroker.net:3001/api/v1/licenses`, config)
            .then(response => {
                if (response.data && response.data.length) {
                    const now = Date.now();
                    response.data = response.data.filter(license => !license.validTill || license.validTill === '0000-00-00 00:00:00' || new Date(license.validTill).getTime() > now);
                }
                return response.data;
            })
            .catch(err => {
                if (err.response) {
                    throw new Error((err.response.data && err.response.data.error) || err.response.data || err.response.status);
                } else if (err.request) {
                    throw new Error('no response');
                } else {
                    throw err;
                }
            });
    }

    // remove this function when js.controller 4.x will be mainstream
    _updateLicenses(login, password) {
        // if login and password provided in the message, just try to read without saving it in system.licenses
        if (login && password) {
            return this._readLicenses(login, password);
        } else {
            // get actual object
            return this.adapter.getForeignObjectAsync('system.licenses')
                .then(systemLicenses => {
                    // If password and login exist
                    if (systemLicenses && systemLicenses.native && systemLicenses.native.password && systemLicenses.native.login) {
                        // get the secret to decode the password
                        return this.adapter.getForeignObjectAsync('system.config')
                            .then(systemConfig => {
                                // decode the password
                                let password;
                                try {
                                    password = this.adapter.decrypt(systemConfig.native.secret, systemLicenses.native.password);
                                } catch {
                                    throw new Error('Cannot decode password');
                                }

                                // read licenses from iobroker.net
                                return this._readLicenses(systemLicenses.native.login, password);
                            })
                            .then(licenses => {
                                // save licenses to system.licenses and remember the time
                                // merge the information together
                                const oldLicenses = systemLicenses.native.licenses || [];
                                systemLicenses.native.licenses = licenses;
                                oldLicenses.forEach(oldLicense => {
                                    if (oldLicense.usedBy) {
                                        const newLicense = licenses.find(item => item.json === oldLicense.json);
                                        if (newLicense) {
                                            newLicense.usedBy = oldLicense.usedBy;
                                        }
                                    }
                                });

                                systemLicenses.native.readTime = new Date().toISOString();

                                // save only if object changed
                                return this.adapter.setForeignObjectAsync('system.licenses', systemLicenses)
                                    .then(() => licenses);
                            })
                            .catch(err => {
                                // if password is invalid
                                if (err.message.includes('Authentication required') || err.message.includes('Cannot decode password')) {
                                    // clear existing licenses if exist
                                    if (systemLicenses && systemLicenses.native && systemLicenses.native.licenses && systemLicenses.native.licenses.length) {
                                        systemLicenses.native.licenses = [];
                                        systemLicenses.native.readTime = new Date().toISOString();
                                        return this.adapter.setForeignObjectAsync('system.licenses', systemLicenses)
                                            .then(() => {
                                                throw err;
                                            });
                                    } else {
                                        throw err;
                                    }
                                } else {
                                    throw err;
                                }
                            });
                    } else {
                        // if password or login are empty => clear existing licenses if exist
                        if (systemLicenses && systemLicenses.native && systemLicenses.native.licenses && systemLicenses.native.licenses.length) {
                            systemLicenses.native.licenses = [];
                            systemLicenses.native.readTime = new Date().toISOString();
                            return this.adapter.setForeignObjectAsync('system.licenses', systemLicenses)
                                .then(() => {
                                    throw new Error('No password or login');
                                });
                        } else {
                            throw new Error('No password or login');
                        }
                    }
                });
        }
    }

    disableEventThreshold(readAll) {
        if (this.eventsThreshold.active) {
            this.eventsThreshold.accidents = 0;
            this.eventsThreshold.count = 0;
            this.eventsThreshold.active = false;
            this.eventsThreshold.timeActivated = 0;
            this.adapter.log.info('Subscribe on all states again');

            setTimeout(() => {
                /*
                if (readAll) {
                    this.adapter.getForeignStates('*', (err, res) => {
                        this.adapter.log.info('received all states');
                        for (const id in res) {
                            if (res.hasOwnProperty(id) && JSON.stringify(states[id]) !== JSON.stringify(res[id])) {
                                this.server.sockets.emit('stateChange', id, res[id]);
                                states[id] = res[id];
                            }
                        }
                    });
                }
                */

                this.onThresholdChanged && this.onThresholdChanged(false);
                this.adapter.unsubscribeForeignStates('system.adapter.*');

                Object.keys(this.subscribes.stateChange).forEach(pattern =>
                    this.adapter.subscribeForeignStates(pattern));
            }, 50);
        }
    }

    _enableEventThreshold() {
        if (!this.eventsThreshold.active) {
            this.eventsThreshold.active = true;

            setTimeout(() => {
                this.adapter.log.info(`Unsubscribe from all states, except system's, because over ${this.eventsThreshold.repeatSeconds} seconds the number of events is over ${this.eventsThreshold.value} (in last second ${this.eventsThreshold.count})`);
                this.eventsThreshold.timeActivated = Date.now();

                this.onThresholdChanged && this.onThresholdChanged(true);
                //this.server && this.server.sockets && this.server.sockets.emit('eventsThreshold', true);

                Object.keys(this.subscribes.stateChange).forEach(pattern =>
                    this.adapter.unsubscribeForeignStates(pattern));

                this.adapter.subscribeForeignStates('system.adapter.*');
            }, 100);
        }
    }

    _addUser(user, pw, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = null;
        }

        if (!user.match(/^[-.A-Za-züäößÖÄÜа-яА-Я@+$§0-9=?!&# ]+$/)) {
            if (typeof callback === 'function') {
                callback('Invalid characters in the name. Only following special characters are allowed: -@+$§=?!&# and letters');
            }
            return;
        }

        this.adapter.getForeignObject('system.user.' + user, options, (err, obj) => {
            if (obj) {
                if (typeof callback === 'function') {
                    callback('User yet exists');
                }
            } else {
                this.adapter.setForeignObject('system.user.' + user, {
                    type: 'user',
                    common: {
                        name: user,
                        enabled: true,
                        groups: []
                    }
                }, options, () => {
                    this.adapter.setPassword(user, pw, options, callback);
                });
            }
        });
    }

    _delUser(user, options, callback) {
        this.adapter.getForeignObject('system.user.' + user, options, (err, obj) => {
            if (err || !obj) {
                if (typeof callback === 'function') {
                    callback('User does not exist');
                }
            } else {
                if (obj.common.dontDelete) {
                    if (typeof callback === 'function') {
                        callback('Cannot delete user, while is system user');
                    }
                } else {
                    this.adapter.delForeignObject('system.user.' + user, options, err =>
                        // Remove this user from all groups in web client
                        typeof callback === 'function' && callback(err));
                }
            }
        });
    }

    _addGroup(group, desc, acl, options, callback) {
        let name = group;
        if (typeof acl === 'function') {
            callback = acl;
            acl = null;
        }
        if (typeof desc === 'function') {
            callback = desc;
            desc = null;
        }
        if (typeof options === 'function') {
            callback = options;
            options = null;
        }
        if (name && name.substring(0, 1) !== name.substring(0, 1).toUpperCase()) {
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
        }
        group = group.substring(0, 1).toLowerCase() + group.substring(1);

        if (!group.match(/^[-.A-Za-züäößÖÄÜа-яА-Я@+$§0-9=?!&#_ ]+$/)) {
            return typeof callback === 'function' && callback('Invalid characters in the group name. Only following special characters are allowed: -@+$§=?!&# and letters');
        }

        this.adapter.getForeignObject('system.group.' + group, options, (err, obj) => {
            if (obj) {
                typeof callback === 'function' && callback('Group yet exists');
            } else {
                obj = {
                    _id:  'system.group.' + group,
                    type: 'group',
                    common: {
                        name,
                        desc,
                        members: [],
                        acl: acl
                    }
                };
                this.adapter.setForeignObject('system.group.' + group, obj, options, err =>
                    typeof callback === 'function' && callback(err, obj));
            }
        });
    }

    _delGroup(group, options, callback) {
        this.adapter.getForeignObject('system.group.' + group, options, (err, obj) => {
            if (err || !obj) {
                typeof callback === 'function' && callback('Group does not exist');
            } else {
                if (obj.common.dontDelete) {
                    typeof callback === 'function' && callback('Cannot delete group, while is system group');
                } else {
                    this.adapter.delForeignObject('system.group.' + group, options, err => {
                        // Remove this group from all users in web client
                        typeof callback === 'function' && callback(err);
                    });
                }
            }
        });
    }

    static _checkObject(obj, options, flag) {
        // read rights of object
        if (!obj || !obj.common || !obj.acl || flag === 'list') {
            return true;
        }

        if (options.user !== 'system.user.admin' && !options.groups.includes('system.group.administrator')) {
            if (obj.acl.owner !== options.user) {
                // Check if the user is in the group
                if (options.groups.includes(obj.acl.ownerGroup)) {
                    // Check group rights
                    if (!(obj.acl.object & (flag << 4))) {
                        return false;
                    }
                } else {
                    // everybody
                    if (!(obj.acl.object & flag)) {
                        return false;
                    }
                }
            } else {
                // Check group rights
                if (!(obj.acl.object & (flag << 8))) {
                    return false;
                }
            }
        }
        return true;
    }

    _getAllObjects(socket, callback) {
        if (typeof callback !== 'function') {
            return this.adapter.log.warn('[_getAllObjects] Invalid callback');
        }

        if (this._checkPermissions(socket, 'getObjects', callback)) {
            if (this.objects) {
                if (socket._acl &&
                    socket._acl.user !== 'system.user.admin' &&
                    !socket._acl.groups.includes('system.group.administrator')) {
                    const result = {};
                    for (const id in this.objects) {
                        if (this.objects.hasOwnProperty(id) && SocketCommandsAdmin._checkObject(this.objects[id], socket._acl, 4 /* 'read' */)) {
                            result[id] = this.objects[id];
                        }
                    }
                    callback(null, result);
                } else {
                    callback(null, this.objects);
                }
            } else {
                this.adapter.getObjectList({include_docs: true}, (err, res) => {
                    this.adapter.log.info('received all objects');
                    res = res.rows;
                    const objects = {};

                    if (socket._acl &&
                        socket._acl.user !== 'system.user.admin' &&
                        !socket._acl.groups.includes('system.group.administrator')) {
                        for (let i = 0; i < res.length; i++) {
                            if (SocketCommandsAdmin._checkObject(res[i].doc, socket._acl, 4 /* 'read' */)) {
                                objects[res[i].doc._id] = res[i].doc;
                            }
                        }
                        callback(null, objects);
                    } else {
                        for (let j = 0; j < res.length; j++) {
                            objects[res[j].doc._id] = res[j].doc;
                        }
                        callback(null, objects);
                    }
                });
            }
        }
    }

    _initCommandsUser() {
        this.commands['addUser'] = (socket, user, pass, callback) => {
            if (this._checkPermissions(socket, 'addUser', callback, user)) {
                this._addUser(user, pass, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };

        this.commands['delUser'] = (socket, user, callback) => {
            if (this._checkPermissions(socket, 'delUser', callback, user)) {
                this._delUser(user, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };

        this.commands['addGroup'] = (socket, group, desc, acl, callback) => {
            if (this._checkPermissions(socket, 'addGroup', callback, group)) {
                this._addGroup(group, desc, acl, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };

        this.commands['delGroup'] = (socket, group, callback) => {
            if (this._checkPermissions(socket, 'delGroup', callback, group)) {
                this._delGroup(group, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };
        this.commands['changePassword'] = (socket, user, pass, callback) => {
            if (this.__updateSession(socket)) {
                if (user === socket._acl.user || this._checkPermissions(socket, 'changePassword', callback, user)) {
                    this.adapter.setPassword(user, pass, {user: socket._acl.user}, (err, ...args) =>
                        SocketCommands._fixCallback(callback, err, ...args));
                }
            }
        };
    }

    _initCommandsAdmin() {
        this.commands['getHostByIp'] = (socket, ip, callback) => {
            if (typeof callback !== 'function') {
                return this.adapter.log.warn('[getHostByIp] Invalid callback');
            }
            if (this._checkPermissions(socket, 'getHostByIp', ip)) {
                this.adapter.getObjectView('system', 'host', {}, {user: socket._acl.user}, (err, data) => {
                    if (data && data.rows && data.rows.length) {
                        for (let i = 0; i < data.rows.length; i++) {
                            const obj = data.rows[i].value;
                            // if we requested specific name
                            if (obj.common.hostname === ip) {
                                return callback(ip, obj);
                            } else
                                // try to find this IP in the list
                            if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
                                const net = obj.native.hardware.networkInterfaces;
                                for (const eth in net) {
                                    if (!Object.prototype.hasOwnProperty.call(net, eth)) {
                                        continue;
                                    }
                                    for (let j = 0; j < net[eth].length; j++) {
                                        if (net[eth][j].address === ip) {
                                            return callback(ip, obj);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    callback(ip, null);
                });
            }
        };

        this.commands['requireLog'] = (socket, isEnabled, callback) => {
            if (this._checkPermissions(socket, 'setObject', callback)) {
                if (isEnabled) {
                    this.subscribe(socket, 'log', 'dummy');
                } else {
                    this.unsubscribe(socket, 'log', 'dummy');
                }

                this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'log');

                typeof callback === 'function' && setImmediate(callback, null);
            }
        };

        this.commands['readLogs'] = (socket, host, callback) => {
            if (this._checkPermissions(socket, 'readLogs', callback)) {
                let timeout = setTimeout(() => {
                    if (timeout) {
                        let result = {list: []};

                        // deliver file list
                        try {
                            const config = this.adapter.systemConfig;
                            // detect file log
                            if (config && config.log && config.log.transport) {
                                for (const transport in config.log.transport) {
                                    if (Object.prototype.hasOwnProperty.call(config.log.transport, transport) && config.log.transport[transport].type === 'file') {
                                        let filename = config.log.transport[transport].filename || 'log/';
                                        const parts = filename.replace(/\\/g, '/').split('/');
                                        parts.pop();
                                        filename = parts.join('/');
                                        if (filename[0] !== '/' && !filename.match(/^\W:/)) {
                                            const _filename = path.normalize(__dirname + '/../../../') + filename;
                                            if (!fs.existsSync(_filename)) {
                                                filename = path.normalize(__dirname + '/../../') + filename;
                                            } else {
                                                filename = _filename;
                                            }
                                        }
                                        if (fs.existsSync(filename)) {
                                            const files = fs.readdirSync(filename);

                                            for (let f = 0; f < files.length; f++) {
                                                try {
                                                    if (!files[f].endsWith('-audit.json')) {
                                                        const stat = fs.lstatSync(filename + '/' + files[f]);
                                                        if (!stat.isDirectory()) {
                                                            result.list.push({
                                                                fileName: 'log/' + transport + '/' + files[f],
                                                                size: stat.size
                                                            });
                                                        }
                                                    }
                                                } catch (e) {
                                                    // push unchecked
                                                    // result.list.push('log/' + transport + '/' + files[f]);
                                                    this.adapter.log.error(`Cannot check file: ${filename}/${files[f]}`);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                result = {error: 'no file loggers'};
                            }
                        } catch (e) {
                            this.adapter.log.error(e);
                            result = {error: e};
                        }
                        typeof callback === 'function' && callback(result.error, result.list);
                    }
                }, 500);

                this._sendToHost(host, 'getLogFiles', null, result => {
                    clearTimeout(timeout);
                    timeout = null;
                    typeof callback === 'function' && callback(result.error, result.list);
                });
            }
        };

        this.commands['delState'] = (socket, id, callback) => {
            if (this._checkPermissions(socket, 'delState', callback, id)) {
                // clear cache
                if (this.states && this.states[id]) {
                    delete this.states[id];
                }
                this.adapter.delForeignState(id, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };

        // commands will be executed on host/controller
        // following response commands are expected: cmdStdout, cmdStderr, cmdExit
        this.commands['cmdExec'] = (socket, host, id, cmd, callback) => {
            if (this._checkPermissions(socket, 'cmdExec', callback, cmd)) {
                this.adapter.log.debug(`cmdExec on ${host}(${id}): ${cmd}`);
                // remember socket for this ID.
                this.cmdSessions[id] = {socket};
                this.adapter.sendToHost(host, 'cmdExec', {data: cmd, id: id});
            }
        };

        this.commands['eventsThreshold'] = (socket, isActive) => {
            if (!isActive) {
                this.disableEventThreshold(true);
            } else {
                this._enableEventThreshold();
            }
        };

        this.commands['getRatings'] = (socket, update, callback) => {
            if (update) {
                this.adapter._updateRatings()
                    .then(() => typeof callback === 'function' && callback(null, this.adapter._ratings));
            } else {
                typeof callback === 'function' && callback(null, this.adapter._ratings);
            }
        };

        this.commands['getCurrentInstance'] = (socket, callback) => {
            typeof callback === 'function' && callback(null, this.adapter.namespace);
        };

        this.commands['checkFeatureSupported'] = (socket, feature, callback) => {
            typeof callback === 'function' && callback(null, this.adapter.supportsFeature && this.adapter.supportsFeature(feature));
        };

        this.commands['decrypt'] = (socket, encryptedText, callback) => {
            if (this.secret) {
                typeof callback === 'function' && callback(null, this.adapter.decrypt(this.secret, encryptedText));
            } else {
                this.adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        this.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, this.adapter.decrypt(this.secret, encryptedText));
                    } else {
                        this.adapter.log.error(`No system.config found: ${err}`);
                        SocketCommands._fixCallback(callback, err);
                    }
                });
            }
        };

        this.commands['encrypt'] = (socket, plainText, callback) => {
            if (this.secret) {
                typeof callback === 'function' && callback(null, this.adapter.encrypt(this.secret, plainText));
            } else {
                this.adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        this.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, this.adapter.encrypt(this.secret, plainText));
                    } else {
                        this.adapter.log.error(`No system.config found: ${err}`);
                        SocketCommands._fixCallback(callback, err);
                    }
                });
            }
        };

        this.commands['getIsEasyModeStrict'] = (socket, callback) => {
            typeof callback === 'function' && callback(null, this.adapter.config.accessLimit);
        };

        this.commands['getEasyMode'] = (socket, callback) => {
            if (this._checkPermissions(socket, 'getObject', callback)) {
                let user;
                if (this.adapter.config.auth) {
                    user = socket._acl.user;
                    if (!user.startsWith('system.user.')) {
                        user = 'system.user.' + user;
                    }
                } else {
                    user = this.adapter.config.defaultUser;
                }

                if (this.adapter.config.accessLimit) {
                    const configs = [];
                    const promises = [];
                    this.adapter.config.accessAllowedConfigs.forEach(id => promises.push(this._readInstanceConfig(id, user, false, configs)));
                    this.adapter.config.accessAllowedTabs.forEach(id    => promises.push(this._readInstanceConfig(id, user, true, configs)));

                    Promise.all(promises)
                        .then(() => {
                            callback(null, {
                                strict: true,
                                configs
                            });
                        });
                } else {
                    this.adapter.getObjectView('system', 'instance', {startkey: 'system.adapter.', endkey: 'system.adapter.\u9999'}, {user}, (err, doc) => {
                        const promises = [];
                        const configs = [];
                        if (!err && doc.rows.length) {
                            for (let i = 0; i < doc.rows.length; i++) {
                                const obj = doc.rows[i].value;
                                if (obj.common.noConfig && !obj.common.adminTab) {
                                    continue;
                                }
                                if (!obj.common.enabled) {
                                    continue;
                                }
                                if (!obj.common.noConfig) {
                                    promises.push(this._readInstanceConfig(obj._id.substring('system.adapter.'.length), user, false, configs));
                                }
                            }
                        }
                        Promise.all(promises)
                            .then(() =>
                                callback(null, {
                                    strict: false,
                                    configs
                                })
                            );
                    });
                }
            }
        };

        this.commands['getAdapterInstances'] = (socket, adapterName, callback) => {
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    let _adapterName = adapterName || this.adapterName || '';
                    if (_adapterName) {
                        _adapterName += '.'
                    }
                    this.adapter.getObjectView('system', 'instance',
                        {startkey: `system.adapter.${_adapterName}`, endkey: `system.adapter.${_adapterName}\u9999`},
                        (err, doc) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, doc.rows
                                    .map(item => {
                                        const obj = item.value;
                                        if (obj.common) {
                                            delete obj.common.news;
                                        }
                                        this._fixAdminUI(obj);
                                        return obj;
                                    })
                                    .filter(obj => obj && (!adapterName || (obj.common && obj.common.name === adapterName))));
                            }
                        });
                }
            }
        };

        this.commands['getAdapters'] = (socket, adapterName, callback) => {
            if (typeof callback === 'function' && this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getObjectView('system', 'adapter',
                    {startkey: `system.adapter.${adapterName || ''}`, endkey: `system.adapter.${adapterName || '\u9999'}`},
                    (err, doc) =>
                    {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, doc.rows
                                .filter(obj => obj && (!adapterName || (obj.common && obj.common.name === this.adapterName)))
                                .map(item => {
                                    const obj = item.value;
                                    if (obj.common) {
                                        delete obj.common.news;
                                        delete obj.native;
                                    }
                                    this._fixAdminUI(obj);
                                    return obj;
                                }));
                        }
                    });
            }
        };

        this.commands['updateLicenses'] = (socket, login, password, callback) => {
            if (this._checkPermissions(socket, 'setObject', callback, login, password)) {
                if (this.adapter.supportsFeature('CONTROLLER_LICENSE_MANAGER')) {
                    let timeout = setTimeout(() => {
                        if (timeout) {
                            timeout = null;
                            typeof callback === 'function' && callback('updateLicenses timeout');
                        }
                    }, 7000);

                    this._sendToHost(this.adapter.common.host, 'updateLicenses', {login, password}, result => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                            typeof callback === 'function' && callback(result.error, result && result.result);
                        }
                    });
                } else {
                    // remove this branch when js-controller 4.x will be mainstream
                    this._updateLicenses(login, password)
                        .then(licenses => typeof callback === 'function' && callback(null, licenses))
                        .catch(err => typeof callback === 'function' && callback(err));
                }
            }
        };

        this.commands['getCompactInstances'] = (socket, callback) => {
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    this.adapter.getObjectView('system', 'instance',
                        {startkey: `system.adapter.`, endkey: `system.adapter.\u9999`},
                        (err, doc) => {
                            if (err) {
                                callback(err);
                            } else {
                                // calculate
                                const result = {};

                                doc.rows.forEach(item => {
                                    const obj = item.value;
                                    result[item.id] = {
                                        adminTab: obj.common.adminTab,
                                        name: obj.common.name,
                                        icon: obj.common.icon,
                                        enabled: obj.common.enabled
                                    };
                                });

                                callback(null, result);
                            }
                        });
                }
            }
        };

        this.commands['getCompactAdapters'] = (socket, callback) => {
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    this.adapter.getObjectView('system', 'adapter',
                        {startkey: `system.adapter.`, endkey: `system.adapter.\u9999`},
                        (err, doc) => {
                            if (err) {
                                callback(err);
                            } else {
                                // calculate
                                const result = {};

                                doc.rows.forEach(item => {
                                    const obj = item.value;
                                    if (obj && obj.common && obj.common.name) {
                                        result[obj.common.name] = {icon: obj.common.icon, v: obj.common.version};
                                        if (obj.common.ignoreVersion) {
                                            result[obj.common.name].iv = obj.common.ignoreVersion;
                                        }
                                    }
                                });

                                callback(null, result);
                            }
                        });
                }
            }
        };

        this.commands['getCompactInstalled'] = (socket, host, callback) => {
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'sendToHost', callback)) {
                    this._sendToHost(host, 'getInstalled', null, data => {
                        const result = {};
                        Object.keys(data).forEach(name => result[name] = {version: data[name].version});
                        callback(result);
                    });
                }
            }
        };

        this.commands['getCompactSystemConfig'] = (socket, callback) => {
            if (this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getForeignObject('system.config', (err, obj) => {
                    obj = obj || {};
                    const secret = obj.native && obj.native.secret;
                    delete obj.native;
                    if (secret) {
                        obj.native = {secret};
                    }
                    callback(err,  obj);
                });
            }
        };

        this.commands['getCompactRepository'] = (socket, host, callback) => {
            if (this._checkPermissions(socket, 'sendToHost', callback)) {
                this._sendToHost(host, 'getRepository', null, data => {
                    // Extract only version and icon
                    const result = {};
                    data && Object.keys(data).forEach(name => result[name] = {
                        version: data[name].version,
                        icon: data[name].extIcon
                    });
                    callback(result);
                });
            }
        };

        this.commands['getCompactHosts'] = (socket, callback) => {
            if (this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getObjectView('system', 'host',
                    {startkey: 'system.host.', endkey: 'system.host.\u9999'}, (err, doc) => {
                        if (err) {
                            callback(err);
                        } else {
                            const result = [];
                            doc.rows.map(item => {
                                const host = item.value;
                                if (host) {
                                    host.common = host.common || {};
                                    result.push({
                                        _id: host._id,
                                        common: {
                                            name: host.common.name,
                                            icon: host.common.icon,
                                            color: host.common.color,
                                            installedVersion: host.common.installedVersion
                                        },
                                        native: {
                                            hardware: {
                                                networkInterfaces: (host.native && host.native.hardware && host.native.hardware.networkInterfaces) || undefined
                                            }
                                        }
                                    });
                                }
                            })
                            callback(null, result);
                        }
                    });
            }
        };
    }

    __initCommandsCommon() {
        super.__initCommandsCommon();

        this._initCommandsAdmin();
        this._initCommandsUser();
    }

    __initCommandsStates() {
        super.__initCommandsStates();

        this.commands['getForeignStates'] = (socket, pattern, callback) => {
            if (this._checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    this.adapter.getForeignStates(pattern, (err, ...args) =>
                        SocketCommands._fixCallback(callback, err, ...args));
                } else {
                    this.adapter.log.warn('[getForeignStates] Invalid callback')
                }
            }
        };

        this.commands['delObjects'] = (socket, id, options, callback) => {
            if (this._checkPermissions(socket, 'delObject', callback, id)) {
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                options.recursive = true;
                this.adapter.delForeignObject(id, options, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };
    }

    __initCommandsFiles() {
        super.__initCommandsFiles();

        this.commands['writeFile'] = (socket, _adapter, fileName, data64, options, callback) => {
            if (this._checkPermissions(socket, 'writeFile', callback, fileName)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = {user: socket._acl.user};
                }
                options = options || {};
                options.user = socket._acl.user;
                const buffer = Buffer.from(data64, 'base64');
                this.adapter.writeFile(_adapter, fileName, buffer, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };
    }

    __initCommandsObjects() {
        super.__initCommandsObjects();

        this.commands['getAllObjects'] = (socket, callback) => {
            return this._getAllObjects(socket, callback);
        };

        this.commands['extendObject'] = (socket, id, obj, callback) => {
            if (this._checkPermissions(socket, 'extendObject', callback, id)) {
                this.adapter.extendForeignObject(id, obj, {user: socket._acl.user}, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };

        this.commands['getForeignObjects'] = (socket, pattern, type, callback) => {
            if (this._checkPermissions(socket, 'getObjects', callback)) {
                if (typeof type === 'function') {
                    callback = type;
                    type = undefined;
                }

                this.adapter.getForeignObjects(pattern, type, {user: socket._acl.user}, (err, ...args) => {
                    if (typeof callback === 'function') {
                        SocketCommands._fixCallback(callback, err, ...args);
                    } else {
                        this.adapter.log.warn('[getObjects] Invalid callback');
                    }
                });
            }
        };

        this.commands['delObject'] = (socket, id, options, callback) => {
            if (this._checkPermissions(socket, 'delObject', callback, id)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                this.adapter.delForeignObject(id, options, (err, ...args) =>
                    SocketCommands._fixCallback(callback, err, ...args));
            }
        };
    }

    stateChange(id, state) {
        if (this.states) {
            if (!state) {
                if (this.states[id]) {
                    delete this.states[id];
                }
            } else {
                this.states[id] = state;
            }
        }

        if (!this.eventsThreshold.active) {
            this.eventsThreshold.count++;
        }
    }

    sendCommand(obj) {
        if (this.cmdSessions[obj.message.id]) {
            if (obj.command === 'cmdExit') {
                delete this.cmdSessions[obj.message.id];
            }
            return true;
        }
    }

    destroy() {
        this.thersholdInterval && clearInterval(this.thersholdInterval);
        this.thersholdInterval = null;

        this.cacheGB && clearInterval(this.cacheGB);
        this.cacheGB = null;

        super.destroy();
    }
}

module.exports = SocketCommandsAdmin;
