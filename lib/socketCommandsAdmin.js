const SocketCommands = require('./socketCommands');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
            count: 0,
            timeActivated: 0,
            active: false,
            accidents: 0,
            repeatSeconds: 3, // how many seconds continuously must be number of events > value
            value: parseInt(adapter.config.thresholdValue, 10) || 200, // how many events allowed in one check interval
            checkInterval: 1000, // duration of one check interval
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

    async updateRatings(uuid) {
        if (!uuid) {
            const obj = await this.adapter.getForeignObjectAsync('system.meta.uuid');
            uuid = obj.native.uuid;
        }

        try {
            const response = await axios.get('https://rating.iobroker.net/rating?uuid=' + uuid, {
                timeout: 15000,
                validateStatus: status => status < 400,
            });
            this.adapter._ratings = response.data;
            if (
                !this.adapter._ratings ||
                typeof this.adapter._ratings !== 'object' ||
                Array.isArray(this.adapter._ratings)
            ) {
                this.adapter._ratings = {};
            }
            this.adapter._ratings.uuid = uuid;

            // auto update only in admin
            if (this.adapter.name === 'admin') {
                this.adapter.ratingTimeout && clearTimeout(this.adapter.ratingTimeout);
                this.adapter.ratingTimeout = setTimeout(() => {
                    this.adapter.ratingTimeout = null;
                    this.updateRatings(uuid, true).then(() => this.adapter.log.info('Adapter rating updated'));
                }, 24 * 3600000);
            }

            return this.adapter._ratings;
        } catch (error) {
            this.adapter.log.warn(
                'Cannot update rating: ' + (error.response ? error.response.data : error.message || error.code)
            );
        }
    }

    _readInstanceConfig(id, user, isTab, configs) {
        return new Promise(resolve =>
            this.adapter.getForeignObject('system.adapter.' + id, { user }, (error, obj) => {
                if (obj && obj.common) {
                    const instance = id.split('.').pop();
                    const config = {
                        id,
                        title: obj.common.titleLang || obj.common.title,
                        desc: obj.common.desc,
                        color: obj.common.color,
                        url: `/adapter/${obj.common.name}/${isTab ? 'tab' : 'index'}${
                            !isTab && obj.common.materialize ? '_m' : ''
                        }.html${instance ? '?' + instance : ''}`,
                        icon: obj.common.icon,
                        materialize: obj.common.materialize,
                        jsonConfig: obj.common.jsonConfig,
                        version: obj.common.version,
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
            })
        );
    }

    _sendToHost(host, command, message, callback) {
        const hash = `${host}_${command}`;
        if (!message && SocketCommandsAdmin.ALLOW_CACHE.includes(command) && this.cache[hash]) {
            if (Date.now() - this.cache[hash].ts < 500) {
                return (
                    typeof callback === 'function' &&
                    setImmediate(data => callback(data), JSON.parse(this.cache[hash].res))
                );
            } else {
                delete this.cache[hash];
            }
        }

        try {
            this.adapter.sendToHost(host, command, message, res => {
                if (!message && SocketCommandsAdmin.ALLOW_CACHE.includes(command)) {
                    this.cache[hash] = { ts: Date.now(), res: JSON.stringify(res) };

                    this.cacheGB =
                        this.cacheGB ||
                        setInterval(() => {
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
        } catch (error) {
            this.adapter.log.error('[sendToHost] ERROR: ' + error.toString());
            typeof callback === 'function' && setImmediate(() => callback({ error }));
        }
    }

    // remove this function when js.controller 4.x will be mainstream
    _readLicenses(login, password) {
        const config = {
            headers: { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}` },
            timeout: 4000,
            validateStatus: status => status < 400,
        };

        return axios
            .get(`https://iobroker.net:3001/api/v1/licenses`, config)
            .then(response => {
                if (response.data && response.data.length) {
                    const now = Date.now();
                    response.data = response.data.filter(
                        license =>
                            !license.validTill ||
                            license.validTill === '0000-00-00 00:00:00' ||
                            new Date(license.validTill).getTime() > now
                    );
                }
                return response.data;
            })
            .catch(error => {
                if (error.response) {
                    throw new Error(
                        (error.response.data && error.response.data.error) ||
                            error.response.data ||
                            error.response.status
                    );
                } else if (error.request) {
                    throw new Error('no response');
                } else {
                    throw error;
                }
            });
    }

    // remove this function when js.controller 4.x will be mainstream
    _updateLicenses(login, password, options) {
        // if login and password provided in the message, just try to read without saving it in system.licenses
        if (login && password) {
            return this._readLicenses(login, password);
        } else {
            // get actual object
            return this.adapter.getForeignObjectAsync('system.licenses', options).then(systemLicenses => {
                // If password and login exist
                if (
                    systemLicenses &&
                    systemLicenses.native &&
                    systemLicenses.native.password &&
                    systemLicenses.native.login
                ) {
                    // get the secret to decode the password
                    return this.adapter
                        .getForeignObjectAsync('system.config', options)
                        .then(systemConfig => {
                            // decode the password
                            let password;
                            try {
                                password = this.adapter.decrypt(
                                    systemConfig.native.secret,
                                    systemLicenses.native.password
                                );
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
                            return this.adapter
                                .setForeignObjectAsync('system.licenses', systemLicenses, options)
                                .then(() => licenses);
                        })
                        .catch(error => {
                            // if password is invalid
                            if (
                                error.message.includes('Authentication required') ||
                                error.message.includes('Cannot decode password')
                            ) {
                                // clear existing licenses if exist
                                if (
                                    systemLicenses &&
                                    systemLicenses.native &&
                                    systemLicenses.native.licenses &&
                                    systemLicenses.native.licenses.length
                                ) {
                                    systemLicenses.native.licenses = [];
                                    systemLicenses.native.readTime = new Date().toISOString();
                                    return this.adapter
                                        .setForeignObjectAsync('system.licenses', systemLicenses, options)
                                        .then(() => {
                                            throw error;
                                        });
                                } else {
                                    throw error;
                                }
                            } else {
                                throw error;
                            }
                        });
                } else {
                    // if password or login are empty => clear existing licenses if exist
                    if (
                        systemLicenses &&
                        systemLicenses.native &&
                        systemLicenses.native.licenses &&
                        systemLicenses.native.licenses.length
                    ) {
                        systemLicenses.native.licenses = [];
                        systemLicenses.native.readTime = new Date().toISOString();
                        return this.adapter
                            .setForeignObjectAsync('system.licenses', systemLicenses, options)
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
                    this.adapter.getForeignStates('*', (error, res) => {
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
                    this.adapter.subscribeForeignStates(pattern)
                );
            }, 50);
        }
    }

    _enableEventThreshold() {
        if (!this.eventsThreshold.active) {
            this.eventsThreshold.active = true;

            setTimeout(() => {
                this.adapter.log.info(
                    `Unsubscribe from all states, except system's, because over ${this.eventsThreshold.repeatSeconds} seconds the number of events is over ${this.eventsThreshold.value} (in last second ${this.eventsThreshold.count})`
                );
                this.eventsThreshold.timeActivated = Date.now();

                this.onThresholdChanged && this.onThresholdChanged(true);
                //this.server && this.server.sockets && this.server.sockets.emit('eventsThreshold', true);

                Object.keys(this.subscribes.stateChange).forEach(pattern =>
                    this.adapter.unsubscribeForeignStates(pattern)
                );

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
            return SocketCommands._fixCallback(
                callback,
                'Invalid characters in the name. Only following special characters are allowed: -@+$§=?!&# and letters'
            );
        }

        try {
            this.adapter.getForeignObject('system.user.' + user, options, (error, obj) => {
                if (obj) {
                    SocketCommands._fixCallback(callback, 'User yet exists');
                } else {
                    try {
                        this.adapter.setForeignObject(
                            'system.user.' + user,
                            {
                                type: 'user',
                                common: {
                                    name: user,
                                    enabled: true,
                                    groups: [],
                                },
                            },
                            options,
                            () => {
                                try {
                                    this.adapter.setPassword(user, pw, options, callback);
                                } catch (error) {
                                    this.adapter.log.error('[_addUser] cannot set password: ' + error.toString());
                                    SocketCommands._fixCallback(callback, error);
                                }
                            }
                        );
                    } catch (error) {
                        this.adapter.log.error('[_addUser] cannot save user: ' + error.toString());
                        SocketCommands._fixCallback(callback, error);
                    }
                }
            });
        } catch (error) {
            this.adapter.log.error('[_addUser] cannot read user: ' + error.toString());
            SocketCommands._fixCallback(callback, error);
        }
    }

    _delUser(user, options, callback) {
        try {
            this.adapter.getForeignObject('system.user.' + user, options, (error, obj) => {
                if (error || !obj) {
                    SocketCommands._fixCallback(callback, 'User does not exist');
                } else {
                    if (obj.common.dontDelete) {
                        SocketCommands._fixCallback(callback, 'Cannot delete user, while is system user');
                    } else {
                        try {
                            this.adapter.delForeignObject('system.user.' + user, options, error =>
                                // Remove this user from all groups in web client
                                SocketCommands._fixCallback(callback, error)
                            );
                        } catch (error) {
                            this.adapter.log.error('[_delUser] cannot delete user: ' + error.toString());
                            SocketCommands._fixCallback(callback, error);
                        }
                    }
                }
            });
        } catch (error) {
            this.adapter.log.error('[_delUser] cannot read user: ' + error.toString());
            SocketCommands._fixCallback(callback, error);
        }
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
            return SocketCommands._fixCallback(
                callback,
                'Invalid characters in the group name. Only following special characters are allowed: -@+$§=?!&# and letters'
            );
        }

        try {
            this.adapter.getForeignObject(`system.group.${group}`, options, (error, obj) => {
                if (obj) {
                    SocketCommands._fixCallback(callback, 'Group yet exists');
                } else {
                    obj = {
                        _id: 'system.group.' + group,
                        type: 'group',
                        common: {
                            name,
                            desc,
                            members: [],
                            acl,
                        },
                    };
                    try {
                        this.adapter.setForeignObject(`system.group.${group}`, obj, options, error =>
                            SocketCommands._fixCallback(callback, error, obj)
                        );
                    } catch (error) {
                        this.adapter.log.error(`[_addGroup] cannot write group: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                }
            });
        } catch (error) {
            this.adapter.log.error('[_addGroup] cannot read group: ' + error.toString());
            SocketCommands._fixCallback(callback, error);
        }
    }

    _delGroup(group, options, callback) {
        try {
            this.adapter.getForeignObject('system.group.' + group, options, (error, obj) => {
                if (error || !obj) {
                    SocketCommands._fixCallback(callback, 'Group does not exist');
                } else {
                    if (obj.common.dontDelete) {
                        SocketCommands._fixCallback(callback, 'Cannot delete group, while is system group');
                    } else {
                        try {
                            this.adapter.delForeignObject(`system.group.${group}`, options, error =>
                                // Remove this group from all users in web client
                                SocketCommands._fixCallback(callback, error)
                            );
                        } catch (error) {
                            this.adapter.log.error(`[_delGroup] cannot delete group: ${error.toString()}`);
                            SocketCommands._fixCallback(callback, error);
                        }
                    }
                }
            });
        } catch (error) {
            this.adapter.log.error('[_delGroup] cannot read group: ' + error.toString());
            SocketCommands._fixCallback(callback, error);
        }
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
                if (
                    socket._acl &&
                    socket._acl.user !== 'system.user.admin' &&
                    !socket._acl.groups.includes('system.group.administrator')
                ) {
                    const result = {};
                    for (const id in this.objects) {
                        if (
                            this.objects.hasOwnProperty(id) &&
                            SocketCommandsAdmin._checkObject(this.objects[id], socket._acl, 4 /* 'read' */)
                        ) {
                            result[id] = this.objects[id];
                        }
                    }
                    callback(null, result);
                } else {
                    callback(null, this.objects);
                }
            } else {
                try {
                    this.adapter.getObjectList({ include_docs: true }, { user: socket._acl.user }, (error, res) => {
                        this.adapter.log.info('received all objects');
                        res = res.rows;
                        const objects = {};

                        if (
                            socket._acl &&
                            socket._acl.user !== 'system.user.admin' &&
                            !socket._acl.groups.includes('system.group.administrator')
                        ) {
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
                } catch (error) {
                    this.adapter.log.error(`[_getAllObjects] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        }
    }

    _initCommandsUser() {
        this.commands['addUser'] = (socket, user, pass, callback) => {
            // Add new user
            // @param {string} user - user name, like `benjamin`
            // @param {string} pass - user password
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'addUser', callback, user)) {
                this._addUser(user, pass, { user: socket._acl.user }, (error, ...args) =>
                    SocketCommands._fixCallback(callback, error, ...args)
                );
            }
        };

        this.commands['delUser'] = (socket, user, callback) => {
            // Delete existing user. Admin cannot be deleted.
            // @param {string} user - user name, like 'benjamin
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'delUser', callback, user)) {
                this._delUser(user, { user: socket._acl.user }, (error, ...args) =>
                    SocketCommands._fixCallback(callback, error, ...args)
                );
            }
        };

        this.commands['addGroup'] = (socket, group, desc, acl, callback) => {
            // Add new group.
            // @param {string} group - user name, like 'benjamin
            // @param {string} desc - optional description
            // @param {object} acl - optional access control list object, like `{"object":{"list":true,"read":true,"write":false,"delete":false},"state":{"list":true,"read":true,"write":true,"create":true,"delete":false},"users":{"list":true,"read":true,"write":false,"create":false,"delete":false},"other":{"execute":false,"http":true,"sendto":false},"file":{"list":true,"read":true,"write":false,"create":false,"delete":false}}`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'addGroup', callback, group)) {
                this._addGroup(group, desc, acl, { user: socket._acl.user }, (error, ...args) =>
                    SocketCommands._fixCallback(callback, error, ...args)
                );
            }
        };

        this.commands['delGroup'] = (socket, group, callback) => {
            // Delete existing group. Administrator group cannot be deleted.
            // @param {string} group - group name, like 'users`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'delGroup', callback, group)) {
                this._delGroup(group, { user: socket._acl.user }, (error, ...args) =>
                    SocketCommands._fixCallback(callback, error, ...args)
                );
            }
        };

        this.commands['changePassword'] = (socket, user, pass, callback) => {
            // Change user password
            // @param {string} user - user name, like 'benjamin`
            // @param {string} pass - new password
            // @param {function} callback - `function (error)`
            if (user === socket._acl.user || this._checkPermissions(socket, 'changePassword', callback, user)) {
                try {
                    this.adapter.setPassword(user, pass, { user: socket._acl.user }, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error('[_changePassword] ERROR: ' + error.toString());
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };
    }

    _initCommandsAdmin() {
        this.commands['getHostByIp'] = (socket, ip, callback) => {
            // Read host object by IP address
            // @param {string} ip - ip address. IPv4 or IPv6
            // @param {function} callback - `function (ip, obj)`. If host not found, obj is null
            if (typeof callback !== 'function') {
                return this.adapter.log.warn('[getHostByIp] Invalid callback');
            }
            if (this._checkPermissions(socket, 'getHostByIp', ip)) {
                try {
                    this.adapter.getObjectView('system', 'host', {}, { user: socket._acl.user }, (error, data) => {
                        if (data && data.rows && data.rows.length) {
                            for (let i = 0; i < data.rows.length; i++) {
                                const obj = data.rows[i].value;
                                // if we requested specific name
                                if (obj.common.hostname === ip) {
                                    return callback(ip, obj);
                                }
                                // try to find this IP in the list
                                else if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
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
                } catch (error) {
                    this.adapter.log.error('[_changePassword] ERROR: ' + error.toString());
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['requireLog'] = (socket, isEnabled, callback) => {
            // Activate or deactivate logging events. Events will be sent to the socket as `log` event. Adapter must have `common.logTransporter = true`
            // @param {boolean} isEnabled - is logging enabled
            // @param {function} callback - `function (error)`
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
            // Get logs file from given host
            // @param {string} host - host id, like 'system.host.raspberrypi'
            // @param {function} callback - `function (error, files)`, where `files` is array of `{fileName: `log/hostname/transport/file`, size: 123}`
            if (this._checkPermissions(socket, 'readLogs', callback)) {
                let timeout = setTimeout(() => {
                    if (timeout) {
                        let result = { list: [] };

                        // deliver file list
                        try {
                            const config = this.adapter.systemConfig;
                            // detect file log
                            if (config && config.log && config.log.transport) {
                                for (const transport in config.log.transport) {
                                    if (
                                        Object.prototype.hasOwnProperty.call(config.log.transport, transport) &&
                                        config.log.transport[transport].type === 'file'
                                    ) {
                                        let fileName = config.log.transport[transport].filename || 'log/';
                                        const parts = fileName.replace(/\\/g, '/').split('/');
                                        parts.pop();
                                        fileName = parts.join('/');
                                        if (fileName[0] !== '/' && !fileName.match(/^\W:/)) {
                                            const _filename = path.normalize(__dirname + '/../../../') + fileName;
                                            if (!fs.existsSync(_filename)) {
                                                fileName = path.normalize(__dirname + '/../../') + fileName;
                                            } else {
                                                fileName = _filename;
                                            }
                                        }
                                        if (fs.existsSync(fileName)) {
                                            const files = fs.readdirSync(fileName);

                                            for (let f = 0; f < files.length; f++) {
                                                try {
                                                    if (!files[f].endsWith('-audit.json')) {
                                                        const stat = fs.lstatSync(`${fileName}/${files[f]}`);
                                                        if (!stat.isDirectory()) {
                                                            result.list.push({
                                                                fileName: `log/${transport}/${files[f]}`,
                                                                size: stat.size,
                                                            });
                                                        }
                                                    }
                                                } catch (_error) {
                                                    // push unchecked
                                                    // result.list.push('log/' + transport + '/' + files[f]);
                                                    this.adapter.log.error(
                                                        `Cannot check file: ${fileName}/${files[f]}`
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                result = { error: 'no file loggers' };
                            }
                        } catch (error) {
                            this.adapter.log.error(`Cannot read logs: ${error}`);
                            result = { error };
                        }
                        SocketCommands._fixCallback(callback, result.error, result.list);
                    }
                }, 500);

                this._sendToHost(host, 'getLogFiles', null, result => {
                    clearTimeout(timeout);
                    timeout = null;
                    SocketCommands._fixCallback(callback, result.error, result.list);
                });
            }
        };

        this.commands['delState'] = (socket, id, callback) => {
            // Delete state. Corresponding object will be deleted too.
            // @param {string} id - state ID
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'delState', callback, id)) {
                // clear cache
                if (this.states && this.states[id]) {
                    delete this.states[id];
                }
                try {
                    this.adapter.delForeignState(id, { user: socket._acl.user }, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error(`[delState] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        // commands will be executed on host/controller
        // following response commands are expected: cmdStdout, cmdStderr, cmdExit
        this.commands['cmdExec'] = (socket, host, id, cmd, callback) => {
            // Execute shell command on host/controller. Following response commands are expected: ´cmdStdout, cmdStderr, cmdExit´
            // @param {string} host - host name, like 'system.host.raspberrypi'
            // @param {string} id - session ID, like `Date.now()´. This session ID will come in events `cmdStdout, cmdStderr, cmdExit`
            // @param {string} cmd - command
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'cmdExec', callback, cmd)) {
                this.adapter.log.debug(`cmdExec on ${host}(${id}): ${cmd}`);
                // remember socket for this ID.
                this.cmdSessions[id] = { socket };
                try {
                    this.adapter.sendToHost(host, 'cmdExec', { data: cmd, id });
                    SocketCommands._fixCallback(callback, null);
                } catch (error) {
                    this.adapter.log.error(`[cmdExec] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['eventsThreshold'] = (socket, isActive) => {
            // Used only for admin to limit number of events to front-end.
            // @param {boolean} isActive - if true, then events will be limited
            if (!isActive) {
                this.disableEventThreshold(true);
            } else {
                this._enableEventThreshold();
            }
        };

        this.commands['getRatings'] = (socket, update, callback) => {
            // Read ratings of adapters
            // @param {boolean} update - if true, the ratings will be read from central server, if false from local cache
            // @param {function} callback - `function (error, ratings)`, where `ratings` is object like `{accuweather: {rating: {r: 3.33, c: 3}, 1.2.1: {r: 3, c: 1}},…}`
            if (update || !this.adapter._ratings) {
                this.updateRatings().then(() => SocketCommands._fixCallback(callback, null, this.adapter._ratings));
            } else {
                SocketCommands._fixCallback(callback, null, this.adapter._ratings);
            }
        };

        this.commands['getCurrentInstance'] = (socket, callback) => {
            // Return current instance name like `admin.0`
            // @param {function} callback - `function (error, namespace)`
            SocketCommands._fixCallback(callback, null, this.adapter.namespace);
        };

        this.commands['checkFeatureSupported'] = (socket, feature, callback) => {
            // Checks if same feature is supported by current js-controller
            // @param {string} feature - feature name like `CONTROLLER_LICENSE_MANAGER`
            // @param {function} callback - `function (error, isSupported)`
            SocketCommands._fixCallback(
                callback,
                null,
                this.adapter.supportsFeature && this.adapter.supportsFeature(feature)
            );
        };

        this.commands['decrypt'] = (socket, encryptedText, callback) => {
            // Decrypts text with system secret key
            // @param {string} encryptedText - encrypted text
            // @param {function} callback - `function (error, decryptedText)`
            if (this.secret) {
                SocketCommands._fixCallback(callback, null, this.adapter.decrypt(this.secret, encryptedText));
            } else {
                try {
                    this.adapter.getForeignObject('system.config', { user: socket._acl.user }, (error, obj) => {
                        if (obj && obj.native && obj.native.secret) {
                            this.secret = obj.native.secret;
                            SocketCommands._fixCallback(
                                callback,
                                null,
                                this.adapter.decrypt(this.secret, encryptedText)
                            );
                        } else {
                            this.adapter.log.error(`No system.config found: ${error}`);
                            SocketCommands._fixCallback(callback, error);
                        }
                    });
                } catch (error) {
                    this.adapter.log.error(`Cannot decrypt: ${error}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['encrypt'] = (socket, plainText, callback) => {
            // Encrypts text with system secret key
            // @param {string} plainText - normal text
            // @param {function} callback - `function (error, encryptedText)`
            if (this.secret) {
                SocketCommands._fixCallback(callback, null, this.adapter.encrypt(this.secret, plainText));
            } else {
                this.adapter.getForeignObject('system.config', { user: socket._acl.user }, (error, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        this.secret = obj.native.secret;
                        try {
                            const encrypted = this.adapter.encrypt(this.secret, plainText);
                            SocketCommands._fixCallback(callback, null, encrypted);
                        } catch (error) {
                            this.adapter.log.error(`Cannot encrypt: ${error}`);
                            SocketCommands._fixCallback(callback, error);
                        }
                    } else {
                        this.adapter.log.error(`No system.config found: ${error}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                });
            }
        };

        this.commands['getIsEasyModeStrict'] = (socket, callback) => {
            // Returns if admin has easy mode enabled
            // @param {function} callback - `function (error, isEasyModeStrict)`
            SocketCommands._fixCallback(callback, null, this.adapter.config.accessLimit);
        };

        this.commands['getEasyMode'] = (socket, callback) => {
            // Get easy mode configuration
            // @param {function} callback - `function (error, easyModeConfig)`, where `easyModeConfig` is object like `{strict: true, configs: [{_id: 'system.adapter.javascript.0', common: {...}}, {...}]}`
            // }`
            if (this._checkPermissions(socket, 'getObject', callback)) {
                let user;
                if (this.adapter.config.auth) {
                    user = socket._acl.user;
                    if (!user.startsWith('system.user.')) {
                        user = `system.user.${user}`;
                    }
                } else {
                    user = this.adapter.config.defaultUser;
                }

                if (this.adapter.config.accessLimit) {
                    const configs = [];
                    const promises = [];
                    this.adapter.config.accessAllowedConfigs.forEach(id =>
                        promises.push(this._readInstanceConfig(id, user, false, configs))
                    );
                    this.adapter.config.accessAllowedTabs.forEach(id =>
                        promises.push(this._readInstanceConfig(id, user, true, configs))
                    );

                    Promise.all(promises).then(() => {
                        callback(null, {
                            strict: true,
                            configs,
                        });
                    });
                } else {
                    this.adapter.getObjectView(
                        'system',
                        'instance',
                        { startkey: 'system.adapter.', endkey: 'system.adapter.\u9999' },
                        { user },
                        (error, doc) => {
                            const promises = [];
                            const configs = [];
                            if (!error && doc.rows.length) {
                                for (let i = 0; i < doc.rows.length; i++) {
                                    const obj = doc.rows[i].value;
                                    if (obj.common.noConfig && !obj.common.adminTab) {
                                        continue;
                                    }
                                    if (!obj.common.enabled) {
                                        continue;
                                    }
                                    if (!obj.common.noConfig) {
                                        promises.push(
                                            this._readInstanceConfig(
                                                obj._id.substring('system.adapter.'.length),
                                                user,
                                                false,
                                                configs
                                            )
                                        );
                                    }
                                }
                            }
                            Promise.all(promises).then(() =>
                                callback(null, {
                                    strict: false,
                                    configs,
                                })
                            );
                        }
                    );
                }
            }
        };

        this.commands['getAdapters'] = (socket, adapterName, callback) => {
            // Read all adapters objects
            // @param {string} adapterName - optional adapter name
            // @param {function} callback - `function (error, results)`, where `results` is array of objects like `{_id: 'system.adapter.javascript', common: {...}}`
            if (typeof callback === 'function' && this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getObjectView(
                    'system',
                    'adapter',
                    {
                        startkey: `system.adapter.${adapterName || ''}`,
                        endkey: `system.adapter.${adapterName || '\u9999'}`,
                    },
                    { user: socket._acl.user },
                    (error, doc) => {
                        if (error) {
                            callback(error);
                        } else {
                            callback(
                                null,
                                doc.rows
                                    .filter(
                                        obj =>
                                            obj &&
                                            (!adapterName || (obj.common && obj.common.name === this.adapterName))
                                    )
                                    .map(item => {
                                        const obj = item.value;
                                        if (obj.common) {
                                            delete obj.common.news;
                                            delete obj.native;
                                        }
                                        this._fixAdminUI(obj);
                                        return obj;
                                    })
                            );
                        }
                    }
                );
            }
        };

        this.commands['updateLicenses'] = (socket, login, password, callback) => {
            // Read software licenses (vis, knx, ...) from ioBroker.net cloud for given user
            // @param {string} login - cloud login
            // @param {string} password - cloud password
            // @param {function} callback - `function (error, results)`, where `results` is array of objects like `[{"json":"xxx","id":"ab","email":"dogafox@gmail.com","product":"iobroker.knx.year","version":"2","invoice":"Pxx","uuid":"uuid","time":"2021-11-16T19:53:02.000Z","validTill":"2022-11-16T22:59:59.000Z","datapoints":1000}]`
            if (this._checkPermissions(socket, 'setObject', callback, login, password)) {
                if (this.adapter.supportsFeature('CONTROLLER_LICENSE_MANAGER')) {
                    let timeout = setTimeout(() => {
                        if (timeout) {
                            timeout = null;
                            SocketCommands._fixCallback(callback, 'updateLicenses timeout');
                        }
                    }, 7000);

                    this._sendToHost(this.adapter.common.host, 'updateLicenses', { login, password }, result => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                            SocketCommands._fixCallback(callback, result.error, result && result.result);
                        }
                    });
                } else {
                    // remove this branch when js-controller 4.x will be mainstream
                    this._updateLicenses(login, password, { user: socket._acl.user })
                        .then(licenses => SocketCommands._fixCallback(callback, null, licenses))
                        .catch(error => SocketCommands._fixCallback(callback, error));
                }
            }
        };

        this.commands['getCompactInstances'] = (socket, callback) => {
            // Read all instances in short form to save bandwidth
            // @param {function} callback - `function (error, results)`, where `results` is an object like `{'system.adapter.javascript.0': {adminTab, name, icon, enabled}}`
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    this.adapter.getObjectView(
                        'system',
                        'instance',
                        { startkey: `system.adapter.`, endkey: `system.adapter.\u9999` },
                        { user: socket._acl.user },
                        (error, doc) => {
                            if (error) {
                                callback(error);
                            } else {
                                // calculate
                                const result = {};

                                doc.rows.forEach(item => {
                                    const obj = item.value;
                                    result[item.id] = {
                                        adminTab: obj.common.adminTab,
                                        name: obj.common.name,
                                        icon: obj.common.icon,
                                        enabled: obj.common.enabled,
                                    };
                                });

                                callback(null, result);
                            }
                        }
                    );
                }
            }
        };

        this.commands['getCompactAdapters'] = (socket, callback) => {
            // Read all adapters in short for to save bandwidth
            // @param {function} callback - `function (error, results)`, where `results` is an object like `{'javascript': {icon, v: '1.0.1', iv: 'ignoredVersion}}`
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    this.adapter.getObjectView(
                        'system',
                        'adapter',
                        { startkey: `system.adapter.`, endkey: `system.adapter.\u9999` },
                        { user: socket._acl.user },
                        (error, doc) => {
                            if (error) {
                                callback(error);
                            } else {
                                // calculate
                                const result = {};

                                doc.rows.forEach(item => {
                                    const obj = item.value;
                                    if (obj && obj.common && obj.common.name) {
                                        result[obj.common.name] = { icon: obj.common.icon, v: obj.common.version };
                                        if (obj.common.ignoreVersion) {
                                            result[obj.common.name].iv = obj.common.ignoreVersion;
                                        }
                                    }
                                });

                                callback(null, result);
                            }
                        }
                    );
                }
            }
        };

        this.commands['getCompactInstalled'] = (socket, host, callback) => {
            // Read all installed adapters in short form to save bandwidth
            // @param {function} callback - `function (error, results)`, where `results` is an object like `{'javascript': {version: '1.0.1'}}``
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'sendToHost', callback)) {
                    this._sendToHost(host, 'getInstalled', null, data => {
                        const result = {};
                        Object.keys(data).forEach(name => (result[name] = { version: data[name].version }));
                        callback(result);
                    });
                }
            }
        };

        this.commands['getCompactSystemConfig'] = (socket, callback) => {
            // Read system config in short form to save bandwidth
            // @param {function} callback - `function (error, systemConfig)`, where `systemConfig` is an object like `{common: {...}, native: {secret: 'aaa'}}`
            if (this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getForeignObject('system.config', { user: socket._acl.user }, (error, obj) => {
                    obj = obj || {};
                    const secret = obj && obj.native && obj.native.secret;
                    delete obj.native;
                    if (secret) {
                        obj.native = { secret };
                    }
                    callback(error, obj);
                });
            }
        };

        this.commands['getCompactSystemRepositories'] = (socket, callback) => {
            // Read repositories from cache in short form to save bandwidth
            // @param {function} callback - `function (error, repositories)`, where `repositories` is an object like `{_id: 'system.repositories', common: {...}, native: {repositories: {default: {json: {_repoInfo: {...}}}}}}`
            if (this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getForeignObject('system.repositories', { user: socket._acl.user }, (error, obj) => {
                    obj &&
                        obj.native &&
                        obj.native.repositories &&
                        Object.keys(obj.native.repositories).forEach(name => {
                            if (obj.native.repositories[name].json) {
                                // limit information to _repoInfo
                                obj.native.repositories[name].json = {
                                    _repoInfo: obj.native.repositories[name].json._repoInfo,
                                };
                            }
                        });
                    callback(error, obj);
                });
            }
        };

        this.commands['getCompactRepository'] = (socket, host, callback) => {
            // Read current repository in short form to save bandwidth
            // @param {function} callback - `function (error, repository)`, where `repository` is an object like `{'javascript': {version: '1.0.1', icon}, 'admin': {version: '1.0.1', icon}}`
            if (this._checkPermissions(socket, 'sendToHost', callback)) {
                this._sendToHost(host, 'getRepository', null, data => {
                    // Extract only version and icon
                    const result = {};
                    data &&
                        Object.keys(data).forEach(
                            name =>
                                (result[name] = {
                                    version: data[name].version,
                                    icon: data[name].extIcon,
                                })
                        );
                    callback(result);
                });
            }
        };

        this.commands['getCompactHosts'] = (socket, callback) => {
            // Read all hosts in short form to save bandwidth
            // @param {function} callback - `function (error, hosts)`, where `hosts` is an array of objects like `[{_id:'system.host.raspi',common:{name:'raspi',icon:'icon',color:'blue',installedVersion:'2.1.0'},native:{hardware:{networkInterfaces:[...]}}}]`
            if (this._checkPermissions(socket, 'getObject', callback)) {
                this.adapter.getObjectView(
                    'system',
                    'host',
                    { startkey: 'system.host.', endkey: 'system.host.\u9999' },
                    { user: socket._acl.user },
                    (error, doc) => {
                        if (error) {
                            callback(error);
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
                                            installedVersion: host.common.installedVersion,
                                        },
                                        native: {
                                            hardware: {
                                                networkInterfaces:
                                                    (host.native &&
                                                        host.native.hardware &&
                                                        host.native.hardware.networkInterfaces) ||
                                                    undefined,
                                            },
                                        },
                                    });
                                }
                            });
                            callback(null, result);
                        }
                    }
                );
            }
        };
    }

    __initCommandsCommon() {
        super.__initCommandsCommon();

        this._initCommandsAdmin();
        this._initCommandsUser();
    }

    __initCommandsFiles() {
        super.__initCommandsFiles();

        this.commands['writeFile'] = (socket, _adapter, fileName, data64, options, callback) => {
            // Write file into ioBroker DB as base64 string
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {string} data64 - file content as base64 string
            // @param {object} options - optional `{mode: 0x0644}`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'writeFile', callback, fileName)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = { user: socket._acl.user };
                }
                options = options || {};
                options.user = socket._acl.user;

                try {
                    const buffer = Buffer.from(data64, 'base64');
                    this.adapter.writeFile(_adapter, fileName, buffer, { user: socket._acl.user }, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error(`[writeFile] Cannot convert data: ${error.toString()}`);
                    callback && callback(`Cannot convert data: ${error.toString()}`);
                }
            }
        };
    }

    __initCommandsObjects() {
        super.__initCommandsObjects();

        this.commands['getAllObjects'] = (socket, callback) => {
            // Read absolutely all objects
            // @param {function} callback - `function (error, objects)`, where `objects` is an object like `{'system.adapter.admin.0': {...}, 'system.adapter.web.0': {...}}`
            return this._getAllObjects(socket, callback);
        };

        // Identical to getAllObjects
        this.commands['getObjects'] = (socket, callback) => {
            // Read absolutely all objects. Same as `getAllObjects`.
            // @param {function} callback - `function (error, objects)`, where `objects` is an object like `{'system.adapter.admin.0': {...}, 'system.adapter.web.0': {...}}`
            return this._getAllObjects(socket, callback);
        };

        this.commands['extendObject'] = (socket, id, obj, callback) => {
            // Extend existing object
            // @param {string} id - object ID
            // @param {object} obj - new parts of the object, like `{common: {name: 'new name'}}`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'extendObject', callback, id)) {
                try {
                    this.adapter.extendForeignObject(id, obj, { user: socket._acl.user }, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error(`[extendObject] ERROR: ${error}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['getForeignObjects'] = (socket, pattern, type, callback) => {
            // Read objects by pattern
            // @param {string} pattern - pattern like `system.adapter.admin.0.*`
            // @param {string} type - type of objects to delete, like `state`, `channel`, `device`, `host`, `adapter`. Default - `state`
            // @param {function} callback - `function (error, objects)`, where `objects` is an object like `{'system.adapter.admin.0': {...}, 'system.adapter.web.0': {...}}`
            if (this._checkPermissions(socket, 'getObjects', callback)) {
                if (typeof type === 'function') {
                    callback = type;
                    type = undefined;
                }

                if (typeof callback === 'function') {
                    try {
                        this.adapter.getForeignObjects(pattern, type, { user: socket._acl.user }, (error, ...args) =>
                            SocketCommands._fixCallback(callback, error, ...args)
                        );
                    } catch (error) {
                        this.adapter.log.error(`[extendObject] ERROR: ${error}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                } else {
                    this.adapter.log.warn('[getObjects] Invalid callback');
                }
            }
        };

        this.commands['delObject'] = (socket, id, options, callback) => {
            // Delete object or objects recursively. Objects with `dontDelete` cannot be deleted.
            // @param {string} id - Object ID like, 'adapterName.0.channel'
            // @param {string} options - `{recursive: true}`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'delObject', callback, id)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                try {
                    // options.recursive = true; // the only difference between delObject and delObjects is this line
                    this.adapter.delForeignObject(id, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error(`[delObject] ERROR: ${error}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['delObjects'] = (socket, id, options, callback) => {
            // Delete objects recursively. Objects with `dontDelete` cannot be deleted. Same as `delObject` but with `recursive: true`.
            // @param {string} id - Object ID like, 'adapterName.0.channel'
            // @param {string} options - optional
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'delObject', callback, id)) {
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                options.recursive = true; // the only difference between delObject and delObjects is this line
                try {
                    this.adapter.delForeignObject(id, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args)
                    );
                } catch (error) {
                    this.adapter.log.error(`[delObjects] ERROR: ${error}`);
                    SocketCommands._fixCallback(callback, error);
                }
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
