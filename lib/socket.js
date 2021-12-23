/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

let socketio;
const request = require('request');
const path    = require('path');
const fs      = require('fs');

const ERROR_PERMISSION = 'permissionError';
const COMMAND_RE_AUTHENTICATE = 'reauthenticate';

function IOSocket(server, settings, adapter, objects, store) {
    if (!(this instanceof IOSocket)) {
        return new IOSocket(server, settings, adapter, objects, store);
    }

    socketio = require('./ws');

    const userKey     = 'connect.sid'; // const
    const cmdSessions = {};
    const that        = this;

    this.server       = null;
    this.subscribes   = {};
    let states        = {};

    let cookieParser;
    let passport;
    let axios; // remove it when js-controller 4.x will be mainstream

    if (settings.auth) {
        cookieParser = require('cookie-parser');
        passport     = require('passport');
    }

    const ALLOW_CACHE = [
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

    let cache = {};
    let cacheGB = null; // cache garbage collector

    const passportSocketIo = require('passport.socketio');
    // const passportSocketIo = require('./passportWs');

    // do not send too many state updates
    const eventsThreshold = {
        count: 0,
        timeActivated: 0,
        active: false,
        accidents: 0,
        repeatSeconds: 3,   // how many seconds continuously must be number of events > value
        value: parseInt(settings.thresholdValue, 10) || 200, // how many events allowed in one check interval
        checkInterval: 1000 // duration of one check interval
    };

    // static information
    const commandsPermissions = {
        getObject:          {type: 'object',    operation: 'read'},
        getObjects:         {type: 'object',    operation: 'list'},
        getObjectView:      {type: 'object',    operation: 'list'},
        setObject:          {type: 'object',    operation: 'write'},
        requireLog:         {type: 'object',    operation: 'write'}, // just mapping to some command
        delObject:          {type: 'object',    operation: 'delete'},
        extendObject:       {type: 'object',    operation: 'write'},
        getHostByIp:        {type: 'object',    operation: 'list'},
        subscribeObjects:   {type: 'object',    operation: 'read'},
        unsubscribeObjects: {type: 'object',    operation: 'read'},

        getStates:          {type: 'state',     operation: 'list'},
        getState:           {type: 'state',     operation: 'read'},
        setState:           {type: 'state',     operation: 'write'},
        delState:           {type: 'state',     operation: 'delete'},
        createState:        {type: 'state',     operation: 'create'},
        subscribe:          {type: 'state',     operation: 'read'},
        unsubscribe:        {type: 'state',     operation: 'read'},
        getStateHistory:    {type: 'state',     operation: 'read'},
        getVersion:         {type: '',          operation: ''},
        getAdapterName:     {type: '',          operation: ''},

        addUser:            {type: 'users',     operation: 'create'},
        delUser:            {type: 'users',     operation: 'delete'},
        addGroup:           {type: 'users',     operation: 'create'},
        delGroup:           {type: 'users',     operation: 'delete'},
        changePassword:     {type: 'users',     operation: 'write'},

        httpGet:            {type: 'other',     operation: 'http'},
        cmdExec:            {type: 'other',     operation: 'execute'},
        sendTo:             {type: 'other',     operation: 'sendto'},
        sendToHost:         {type: 'other',     operation: 'sendto'},
        readLogs:           {type: 'other',     operation: 'execute'},

        readDir:            {type: 'file',      operation: 'list'},
        createFile:         {type: 'file',      operation: 'create'},
        writeFile:          {type: 'file',      operation: 'write'},
        readFile:           {type: 'file',      operation: 'read'},
        fileExists:         {type: 'file',      operation: 'read'},
        deleteFile:         {type: 'file',      operation: 'delete'},
        readFile64:         {type: 'file',      operation: 'read'},
        writeFile64:        {type: 'file',      operation: 'write'},
        unlink:             {type: 'file',      operation: 'delete'},
        renameFile:         {type: 'file',      operation: 'write'},
        mkdir:              {type: 'file',      operation: 'write'},
        chmodFile:          {type: 'file',      operation: 'write'},
        chownFile:          {type: 'file',      operation: 'write'},

        authEnabled:        {type: '',          operation: ''},
        disconnect:         {type: '',          operation: ''},
        listPermissions:    {type: '',          operation: ''},
        getUserPermissions: {type: 'object',    operation: 'read'}
    };

    function fixAdminUI(obj) {
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

            obj.common.adminUI && adapter.log.debug(`Please add to "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`);
        }
    }

    function addUser(user, pw, options, callback) {
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

        adapter.getForeignObject('system.user.' + user, options, function (err, obj) {
            if (obj) {
                if (typeof callback === 'function') {
                    callback('User yet exists');
                }
            } else {
                adapter.setForeignObject('system.user.' + user, {
                    type: 'user',
                    common: {
                        name: user,
                        enabled: true,
                        groups: []
                    }
                }, options, function () {
                    adapter.setPassword(user, pw, callback);
                });
            }
        });
    }

    function delUser(user, options, callback) {
        adapter.getForeignObject('system.user.' + user, options, function (err, obj) {
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
                    adapter.delForeignObject('system.user.' + user, options, function (err) {
                        // Remove this user from all groups in web client
                        if (typeof callback === 'function') {
                            callback(err);
                        }
                    });
                }
            }
        });
    }

    function addGroup(group, desc, acl, options, callback) {
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
            if (typeof callback === 'function') {
                callback('Invalid characters in the group name. Only following special characters are allowed: -@+$§=?!&# and letters');
            }
            return;
        }

        adapter.getForeignObject('system.group.' + group, options, function (err, obj) {
            if (obj) {
                if (typeof callback === 'function') {
                    callback('Group yet exists');
                }
            } else {
                obj = {
                    _id:  'system.group.' + group,
                    type: 'group',
                    common: {
                        name: name,
                        desc: desc,
                        members: [],
                        acl: acl
                    }
                };
                adapter.setForeignObject('system.group.' + group, obj, options, function (err) {
                    if (typeof callback === 'function') {
                        callback(err, obj);
                    }
                });
            }
        });
    }

    function delGroup(group, options, callback) {
        adapter.getForeignObject('system.group.' + group, options, (err, obj) => {
            if (err || !obj) {
                if (typeof callback === 'function') {
                    callback('Group does not exist');
                }
            } else {
                if (obj.common.dontDelete) {
                    if (typeof callback === 'function') {
                        callback('Cannot delete group, while is system group');
                    }
                } else {
                    adapter.delForeignObject('system.group.' + group, options, err =>
                        // Remove this group from all users in web client
                        typeof callback === 'function' && callback(err));
                }
            }
        });
    }

    // update session ID, but not ofter than 60 seconds
    function updateSession(socket) {
        if (socket._sessionID) {
            const time = Date.now();
            if (socket._lastActivity && time - socket._lastActivity > adapter.config.ttl * 1000) {
                adapter.log.warn('REAUTHENTICATE!');
                socket.emit(COMMAND_RE_AUTHENTICATE);
                return false;
            }
            socket._lastActivity = time;
            if (!socket._sessionTimer) {
                socket._sessionTimer = setTimeout(() => {
                    socket._sessionTimer = null;
                    adapter.getSession(socket._sessionID, obj => {
                        if (obj) {
                            adapter.setSession(socket._sessionID, adapter.config.ttl, obj);
                        } else {
                            adapter.log.warn('REAUTHENTICATE!');
                            socket.emit(COMMAND_RE_AUTHENTICATE);
                        }
                    });
                }, 60000);
            }
        }
        return true;
    }

    function checkPermissions(socket, command, callback, arg) {
        if (socket._acl.user !== 'system.user.admin') {
            // type: file, object, state, other
            // operation: create, read, write, list, delete, sendto, execute, sendToHost, readLogs
            if (commandsPermissions[command]) {
                // If permission required
                if (commandsPermissions[command].type) {
                    if (socket._acl[commandsPermissions[command].type] &&
                        socket._acl[commandsPermissions[command].type][commandsPermissions[command].operation]) {
                        return true;
                    } else {
                        adapter.log.warn(`No permission for "${socket._acl.user}" to call ${command}. Need "${commandsPermissions[command].type}"."${commandsPermissions[command].operation}"`);
                    }
                } else {
                    return true;
                }
            } else {
                adapter.log.warn('No rule for command: ' + command);
            }

            if (typeof callback === 'function') {
                callback(ERROR_PERMISSION);
            } else {
                if (commandsPermissions[command]) {
                    socket.emit(ERROR_PERMISSION, {
                        command: command,
                        type: commandsPermissions[command].type,
                        operation: commandsPermissions[command].operation,
                        arg: arg
                    });
                } else {
                    socket.emit(ERROR_PERMISSION, {
                        command: command,
                        arg: arg
                    });
                }
            }
            return false;
        } else {
            return true;
        }
    }

    function checkObject(id, options, flag) {
        // read rights of object
        if (!objects[id] || !objects[id].common || !objects[id].acl || flag === 'list') {
            return true;
        }

        if (options.user !== 'system.user.admin' &&
            options.groups.indexOf('system.group.administrator') === -1) {
            if (objects[id].acl.owner !== options.user) {
                // Check if the user is in the group
                if (options.groups.indexOf(objects[id].acl.ownerGroup) !== -1) {
                    // Check group rights
                    if (!(objects[id].acl.object & (flag << 4))) {
                        return false
                    }
                } else {
                    // everybody
                    if (!(objects[id].acl.object & flag)) {
                        return false
                    }
                }
            } else {
                // Check group rights
                if (!(objects[id].acl.object & (flag << 8))) {
                    return false
                }
            }
        }
        return true;
    }

    function getAllObjects(socket, callback) {
        if (updateSession(socket) && checkPermissions(socket, 'getObjects', callback)) {
            if (socket._acl &&
                socket._acl.user !== 'system.user.admin' &&
                !socket._acl.groups.includes('system.group.administrator')) {
                const result = {};
                for (const ob in objects) {
                    if (objects.hasOwnProperty(ob) && checkObject(ob, socket._acl, 4 /* 'read' */)) {
                        result[ob] = objects[ob];
                    }
                }
                callback(null, result);
            } else {
                if (typeof callback === 'function') {
                    callback(null, objects);
                }
            }
        }
    }

    function pattern2RegEx(pattern) {
        if (!pattern || typeof pattern !== 'string') {
            return null;
        }
        if (pattern !== '*') {
            if (pattern[0] === '*' && pattern[pattern.length - 1] !== '*') pattern += '$';
            if (pattern[0] !== '*' && pattern[pattern.length - 1] === '*') pattern = '^' + pattern;
        }
        pattern = pattern.replace(/\./g, '\\.');
        pattern = pattern.replace(/\*/g, '.*');
        pattern = pattern.replace(/\[/g, '\\[');
        pattern = pattern.replace(/]/g, '\\]');
        pattern = pattern.replace(/\(/g, '\\(');
        pattern = pattern.replace(/\)/g, '\\)');
        return pattern;
    }

    this.subscribe = function (socket, type, pattern) {
        //console.log((socket._name || socket.id) + ' subscribe ' + pattern);
        if (socket) {
            socket._subscribe = socket._subscribe || {};
        }

        this.subscribes[type] = this.subscribes[type] || {};

        let s;
        if (socket) {
            s = socket._subscribe[type] = socket._subscribe[type] || [];
            for (let i = 0; i < s.length; i++) {
                if (s[i].pattern === pattern) {
                    return;
                }
            }
        }

        let p = pattern2RegEx(pattern);
        if (p === null) {
            return adapter.log.warn('Empty or invalid pattern on subscribe!');
        }
        if (socket) {
            s.push({pattern: pattern, regex: new RegExp(p)});
        }

        if (this.subscribes[type][pattern] === undefined) {
            this.subscribes[type][pattern] = 1;
            if (type === 'stateChange') {
                adapter.log.debug('Subscribe STATES: ' + pattern);
                adapter.subscribeForeignStates(pattern);
            } else if (type === 'objectChange') {
                adapter.log.debug('Subscribe OBJECTS: ' + pattern);
                adapter.subscribeForeignObjects && adapter.subscribeForeignObjects(pattern);
            } else if (type === 'log') {
                adapter.log.debug('Subscribe LOGS');
                adapter.requireLog && adapter.requireLog(true);
            }
        } else {
            this.subscribes[type][pattern]++;
        }
    };

    function showSubscribes(socket, type) {
        if (socket && socket._subscribe) {
            const s = socket._subscribe[type] || [];
            const ids = [];
            for (let i = 0; i < s.length; i++) {
                ids.push(s[i].pattern);
            }
            adapter.log.debug('Subscribes: ' + ids.join(', '));
        } else {
            adapter.log.debug('Subscribes: no subscribes');
        }
    }

    function updateConnectedInfo() {
        if (that.infoTimeout) {
            clearTimeout(that.infoTimeout);
            that.infoTimeout = null;
        }
        if (that.server.sockets) {
            let clientsArray = [];
            if (that.server) {
                let clients = that.server.sockets.connected;

                for (let i in clients) {
                    if (clients.hasOwnProperty(i)) {
                        clientsArray.push(clients[i]._name || 'noname');
                    }
                }
            }
            const text = `[${clientsArray.length}]${clientsArray.join(', ')}`;
            adapter.setState('info.connection', text, true);
        }
    }

    this.unsubscribe = function (socket, type, pattern) {
        //console.log((socket._name || socket.id) + ' unsubscribe ' + pattern);
        this.subscribes[type] = this.subscribes[type] || {};

        if (socket && typeof socket === 'object') {
            if (!socket._subscribe || !socket._subscribe[type]) {
                return;
            }

            for (let i = socket._subscribe[type].length - 1; i >= 0; i--) {
                if (socket._subscribe[type][i].pattern === pattern) {

                    // Remove pattern from global list
                    if (this.subscribes[type][pattern] !== undefined) {
                        this.subscribes[type][pattern]--;
                        if (this.subscribes[type][pattern] <= 0) {
                            if (type === 'stateChange') {
                                adapter.log.debug('Unsubscribe STATES: ' + pattern);
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                                adapter.unsubscribeForeignStates(pattern);
                            } else if (type === 'objectChange') {
                                adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                                adapter.unsubscribeForeignObjects && adapter.unsubscribeForeignObjects(pattern);
                            } else if (type === 'log') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
                                adapter.log.debug('Unsubscribe LOGS');
                                adapter.requireLog && adapter.requireLog(false);
                            }
                            delete this.subscribes[type][pattern];
                        }
                    }

                    delete socket._subscribe[type][i];
                    socket._subscribe[type].splice(i, 1);
                    return;
                }
            }
        } else {
            // Remove pattern from global list
            if (this.subscribes[type][pattern] !== undefined) {
                this.subscribes[type][pattern]--;
                if (this.subscribes[type][pattern] <= 0) {
                    if (type === 'stateChange') {
                        adapter.log.debug('Unsubscribe STATES: ' + pattern);
                        adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                        adapter.unsubscribeForeignObjects && adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        adapter.log.debug('Unsubscribe LOGS');
                        adapter.requireLog && adapter.requireLog(false);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        }
    };

    this.unsubscribeAll = function () {
        if (that.server && this.server.ioBroker) {
            that.server.sockets.connected.forEach(s => {
                this.unsubscribe(s, 'stateChange');
                this.unsubscribe(s, 'objectChange');
                this.unsubscribe(s, 'log');
            });
        } else
        if (that.server && that.server.sockets) {
            for (const s in that.server.sockets) {
                if (that.server.sockets.hasOwnProperty(s)) {
                    this.unsubscribe(s, 'stateChange');
                    this.unsubscribe(s, 'objectChange');
                    this.unsubscribe(s, 'log');
                }
            }
        }
    };

    function unsubscribeSocket(socket, type) {
        if (!socket || !socket._subscribe || !socket._subscribe[type]) {
            return;
        }

        for (let i = 0; i < socket._subscribe[type].length; i++) {
            const pattern = socket._subscribe[type][i].pattern;
            if (that.subscribes[type][pattern] !== undefined) {
                that.subscribes[type][pattern]--;
                if (that.subscribes[type][pattern] <= 0) {
                    if (type === 'stateChange') {
                        adapter.log.debug('Unsubscribe STATES: ' + pattern);
                        adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                        adapter.unsubscribeForeignObjects && adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        adapter.log.debug('Unsubscribe LOGS: ' + pattern);
                        adapter.requireLog && adapter.requireLog(false);
                    }
                    delete that.subscribes[type][pattern];
                }
            }
        }
    }

    function subscribeSocket(socket, type) {
        //console.log((socket._name || socket.id) + ' subscribeSocket');
        if (!socket || !socket._subscribe || !socket._subscribe[type]) {
            return;
        }

        for (let i = 0; i < socket._subscribe[type].length; i++) {
            const pattern = socket._subscribe[type][i].pattern;
            if (that.subscribes[type][pattern] === undefined){
                that.subscribes[type][pattern] = 1;
                if (type === 'stateChange') {
                    adapter.log.debug('Subscribe STATES: ' + pattern);
                    adapter.subscribeForeignStates(pattern);
                } else if (type === 'objectChange') {
                    adapter.log.debug('Subscribe OBJECTS: ' + pattern);
                    adapter.subscribeForeignObjects && adapter.subscribeForeignObjects(pattern);
                } else if (type === 'log') {
                    adapter.log.debug('Subscribe LOGS');
                    adapter.requireLog && adapter.requireLog(true);
                }
            } else {
                that.subscribes[type][pattern]++;
            }
        }
    }

    function sendToHost(host, command, message, callback) {
        if (!message && ALLOW_CACHE.includes(command) && cache[host + '_' + command]) {
            if (Date.now() - cache[host + '_' + command].ts < 500) {
                return typeof callback === 'function' && setImmediate(data => callback(data), JSON.parse(cache[host + '_' + command].res));
            } else {
                delete cache[host + '_' + command];
            }
        }
        adapter.sendToHost(host, command, message, res => {
            if (!message && ALLOW_CACHE.includes(command)) {
                cache[host + '_' + command] = {ts: Date.now(), res: JSON.stringify(res)};
                if (!cacheGB) {
                    cacheGB = setInterval(() => {
                        const commands = Object.keys(cache);
                        commands.forEach(cmd => {
                            if (Date.now() - cache[cmd].ts > 500) {
                                delete cache[cmd];
                            }
                        });
                        if (!commands.length) {
                            clearInterval(cacheGB);
                            cacheGB = null;
                        }
                    }, 2000);
                }
            }
            typeof callback === 'function' && setImmediate(() => callback(res));
        });
    }

    function socketEvents(socket, cb) {
        if (socket.conn.request.sessionID && adapter.config.auth) {
            socket._secure = true;
            socket._sessionID = socket.conn.request.sessionID;
            // Get user for session
            adapter.getSession(socket.conn.request.sessionID, obj => {
                if (!obj || !obj.passport) {
                    socket._acl.user = '';
                    socket.emit(COMMAND_RE_AUTHENTICATE);
                }
            });
        }

        if (!that.infoTimeout) {
            that.infoTimeout = setTimeout(updateConnectedInfo, 1000);
        }

        // Enable logging, while some browser is connected
        /*if (adapter.requireLog) {
            adapter.requireLog(true);
        }*/

        if (socket.conn) {
            subscribeSocket(socket, 'stateChange');
            subscribeSocket(socket, 'objectChange');
            subscribeSocket(socket, 'log');
        }

        /**
         * Convert errors into strings and then call cb
         * @param {function} cb - callback
         * @param {string|Error|null} err - error argument
         * @param {any[]} args - args passed to cb
         */
        function fixCallback(cb, err, ...args) {
            if (typeof cb !== 'function') {
                return
            }

            if (err instanceof Error) {
                err = err.message;
            }

            cb(err, ...args);
        }

        socket.on('name', function (name) {
            updateSession(socket);
            if (this._name === undefined) {
                this._name = name;
                that.infoTimeout = that.infoTimeout || setTimeout(updateConnectedInfo, 1000);
            } else if (this._name !== name) {
                adapter.log.warn(`socket ${this.id} changed socket name from ${this._name} to ${name}`);
                this._name = name;
            }
        });

        socket.on('authenticate', cb =>
            cb && cb(true, settings.auth));

        /*
         *      objects
         */
        socket.on('getObject', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObject', callback, id)) {
                adapter.getForeignObject(id, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('getObjects', function (callback) {
            return getAllObjects(socket, callback);
        });

        socket.on('getForeignObjects', function (pattern, type, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObjects', callback)) {
                if (typeof type === 'function') {
                    callback = type;
                    type = undefined;
                }

                adapter.getForeignObjects(pattern, type, (err, ...args) => {
                    if (typeof callback === 'function') {
                        fixCallback(callback, err, ...args);
                    } else {
                        adapter.log.warn('[getObjects] Invalid callback')
                    }
                });
            }
        });

        // Identical to getObjects
        socket.on('getAllObjects', function (callback) {
            return getAllObjects(socket, callback);
        });

        socket.on('getObjectView', function (design, search, params, callback) {
            if (typeof callback === 'function') {
                if (updateSession(socket) && checkPermissions(socket, 'getObjectView', callback, search)) {
                    adapter.getObjectView(design, search, params, {user: this._acl.user}, callback);
                }
            } else {
                adapter.log.error('Callback is not a function');
            }
        });

        socket.on('setObject', function (id, obj, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setObject', callback, id)) {
                adapter.setForeignObject(id, obj, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delObject', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delObject', callback, id)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = this._acl.user;
                adapter.delForeignObject(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delObjects', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delObject', callback, id)) {
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = this._acl.user;
                options.recursive = true;
                adapter.delForeignObject(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('extendObject', function (id, obj, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'extendObject', callback, id)) {
                adapter.extendForeignObject(id, obj, {user: this._acl.user}, (err, ...args) =>
                     fixCallback(callback, err, ...args));
            }
        });

        socket.on('getHostByIp', function (ip, callback) {
            if (typeof callback !== 'function') {
                return adapter.log.warn('[getHostByIp] Invalid callback');
            }
            if (updateSession(socket) && checkPermissions(socket, 'getHostByIp', ip)) {
                adapter.getObjectView('system', 'host', {}, {user: this._acl.user}, (err, data) => {
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
                                    if (!net.hasOwnProperty(eth)) {
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
        });

        /*
         *      states
         */
        socket.on('getStates', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    adapter.getForeignStates('*', (err, ...args) =>
                        fixCallback(callback, err, ...args));
                } else {
                    adapter.log.warn('[getStates] Invalid callback')
                }
            }
        });

        socket.on('getState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    if (states[id]) {
                        callback(null, states[id]);
                    } else {
                        adapter.getForeignState(id, (err, ...args) =>
                            fixCallback(callback, err, ...args));
                    }
                } else {
                    adapter.log.warn('[getState] Invalid callback')
                }
            }
        });

        socket.on('getBinaryState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    adapter.getBinaryState(id, (err, data) => {
                        if (data) {
                            data = Buffer.from(data).toString('base64');
                        }
                        fixCallback(callback, err, data);
                    });
                } else {
                    adapter.log.warn('[getBinaryState] Invalid callback')
                }
            }
        });

        socket.on('setBinaryState', function (id, base64, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setState', callback, id)) {
                if (typeof callback === 'function') {
                    let data = null;
                    try {
                        data = Buffer.from(base64, 'base64')
                    } catch (e) {
                        adapter.log.warn('[setBinaryState] Cannot convert base64 data: ' + e);
                    }

                    adapter.setBinaryState(id, data, (err, ...args) =>
                        fixCallback(callback, err, ...args));
                } else {
                    adapter.log.warn('[setBinaryState] Invalid callback');
                }
            }
        });

        socket.on('getForeignStates', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    adapter.getForeignStates(pattern, (err, ...args) =>
                        fixCallback(callback, err, ...args));
                } else {
                    adapter.log.warn('[getForeignStates] Invalid callback')
                }
            }
        });

        socket.on('setState', function (id, state, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setState', callback, id)) {
                if (typeof state !== 'object') {
                    state = {val: state};
                }

                // clear cache
                if (states[id]) {
                    delete states[id];
                }

                adapter.setForeignState(id, state, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delState', callback, id)) {
                // clear cache
                if (states[id]) {
                    delete states[id];
                }
                adapter.delForeignState(id, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('requireLog', function (isEnabled, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setObject', callback)) {
                if (isEnabled) {
                    that.subscribe(this, 'log', 'dummy');
                } else {
                    that.unsubscribe(this, 'log', 'dummy');
                }

                adapter.log.level === 'debug' && showSubscribes(socket, 'log');

                typeof callback === 'function' && setImmediate(callback, null);
            }
        });
        /*
         *      History
         */
        socket.on('getStateHistory', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = this._acl.user;
                options.aggregate = options.aggregate || 'none';
                adapter.getHistory(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });
        socket.on('getHistory', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = this._acl.user;
                options.aggregate = options.aggregate || 'none';
                adapter.getHistory(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });
        /*
         *      user/group
         */
        socket.on('addUser', function (user, pass, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'addUser', callback, user)) {
                addUser(user, pass, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delUser', function (user, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delUser', callback, user)) {
                delUser(user, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('addGroup', function (group, desc, acl, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'addGroup', callback, group)) {
                addGroup(group, desc, acl, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delGroup', function (group, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delGroup', callback, group)) {
                delGroup(group, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('changePassword', function (user, pass, callback) {
            if (updateSession(socket)) {
                if (user === socket._acl.user || checkPermissions(socket, 'changePassword', callback, user)) {
                    adapter.setPassword(user, pass, {user: this._acl.user}, (err, ...args) =>
                        fixCallback(callback, err, ...args));
                }
            }
        });

        // HTTP
        socket.on('httpGet', function (url, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'httpGet', callback, url)) {
                request(url, callback);
            }
        });

        // commands will be executed on host/controller
        // following response commands are expected: cmdStdout, cmdStderr, cmdExit
        socket.on('cmdExec', function (host, id, cmd, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'cmdExec', callback, cmd)) {
                console.log(`cmdExec on ${host}(${id}): ${cmd}`);
                // remember socket for this ID.
                cmdSessions[id] = {socket: socket};
                adapter.sendToHost(host, 'cmdExec', {data: cmd, id: id});
            }
        });

        socket.on('readDir', function (_adapter, path, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readDir', callback, path)) {
                adapter.readDir(_adapter, path, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('writeFile', function (_adapter, filename, data64, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'writeFile', callback, filename)) {
                let buffer = new Buffer(data64, 'base64');
                adapter.writeFile(_adapter, filename, buffer, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('renameFile', function (_adapter, oldName, newName, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'renameFile', callback, oldName)) {
                adapter.rename(_adapter, oldName, newName, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('mkdir', function (_adapter, dirName, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'mkdir', callback, dirName)) {
                adapter.mkdir(_adapter, dirName, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('writeFile64', function (_adapter, fileName, data64, options, callback) {
            if (typeof options === 'function') {
                callback = options;
                options = {user: this._acl.user};
            }

            options = options || {};
            options.user = options.user || this._acl.user;

            if (updateSession(socket) && checkPermissions(socket, 'writeFile64', callback, fileName)) {
                //Convert base 64 to buffer
                let buffer = new Buffer(data64, 'base64');
                adapter.writeFile(_adapter, fileName, buffer, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('readFile', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readFile', callback, filename)) {
                adapter.readFile(_adapter, filename, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('deleteFile', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'deleteFile', callback, filename)) {
                adapter.unlink(_adapter, filename, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('deleteFolder', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'deleteFolder', callback, filename)) {
                adapter.unlink(_adapter, filename, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('readFile64', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readFile64', callback, filename)) {
                adapter.readFile(_adapter, filename, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('chmodFile', function (_adapter, filename, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'chmodFile', callback, filename)) {
                options = options || {};
                options.user = this._acl.user;
                adapter.chmodFile(_adapter, filename, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('chownFile', function (_adapter, filename, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'chownFile', callback, filename)) {
                options = options || {};
                options.user = this._acl.user;
                adapter.chownFile(_adapter, filename, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('fileExists', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'fileExists', callback, filename)) {
                adapter.fileExists(_adapter, filename, {user: this._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('sendTo', function (adapterInstance, command, message, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'sendTo', callback, command)) {
                adapter.sendTo(adapterInstance, command, message, res =>
                    typeof callback === 'function' && setImmediate(() =>
                        callback(res), 0));
            }
        });

        // following commands are protected and require the extra permissions
        const protectedCommands = ['cmdExec', 'getLocationOnDisk', 'getDiagData', 'getDevList', 'delLogs', 'writeDirAsZip', 'writeObjectsAsZip', 'readObjectsAsZip', 'checkLogging', 'updateMultihost', 'rebuildAdapter'];

        socket.on('sendToHost', function (host, command, message, callback) {
            // host can answer following commands: cmdExec, getRepository, getInstalled, getInstalledAdapter, getVersion, getDiagData, getLocationOnDisk, getDevList, getLogs, getHostInfo,
            // delLogs, readDirAsZip, writeDirAsZip, readObjectsAsZip, writeObjectsAsZip, checkLogging, updateMultihost
            if (updateSession(socket) && checkPermissions(socket, protectedCommands.includes(command) ? 'cmdExec' : 'sendToHost', callback, command)) {
                sendToHost(host, command, message, callback);
            }
        });

        socket.on('authEnabled', function (callback) {
            typeof callback === 'function' && callback(adapter.config.auth, socket._acl.user.replace(/^system\.user\./, ''));
        });

        socket.on('disconnect', function () {
            unsubscribeSocket(this, 'stateChange');
            unsubscribeSocket(this, 'objectChange');
            unsubscribeSocket(this, 'log');

            that.infoTimeout = that.infoTimeout || setTimeout(updateConnectedInfo, 1000);

            // Disable logging if no one browser is connected
            if (adapter.requireLog) {
                adapter.log.debug('Disable logging, because no one socket connected');
                adapter.requireLog(!!that.server.engine.clientsCount);
            }
        });

        socket.on('listPermissions', function (callback) {
            if (updateSession(socket)) {
                if (typeof callback === 'function') {
                    callback(commandsPermissions);
                }
            }
        });

        socket.on('getUserPermissions', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getUserPermissions', callback)) {
                typeof callback === 'function' && callback(null, socket._acl);
            }
        });

        socket.on('eventsThreshold', function (isActive) {
            if (!isActive) {
                disableEventThreshold(true);
            } else {
                enableEventThreshold();
            }
        });

        socket.on('getRatings', function (update, callback) {
            if (update) {
                adapter._updateRatings()
                    .then(() => typeof callback === 'function' && callback(null, adapter._ratings));
            } else {
                typeof callback === 'function' && callback(null, adapter._ratings);
            }
        });

        socket.on('eventsThreshold', function (isActive) {
            if (!isActive) {
                disableEventThreshold(true);
            } else {
                enableEventThreshold();
            }
        });

        socket.on('subscribe', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'subscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.subscribe(this, 'stateChange', pattern[p]);
                    }
                } else {
                    that.subscribe(this, 'stateChange', pattern);
                }

                adapter.log.level === 'debug' && showSubscribes(socket, 'stateChange');

                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });
        // same as 'subscribe'
        socket.on('subscribeStates', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'subscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.subscribe(this, 'stateChange', pattern[p]);
                    }
                } else {
                    that.subscribe(this, 'stateChange', pattern);
                }

                adapter.log.level === 'debug' && showSubscribes(socket, 'stateChange');

                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('unsubscribe', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'unsubscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.unsubscribe(this, 'stateChange', pattern[p]);
                    }
                } else {
                    that.unsubscribe(this, 'stateChange', pattern);
                }

                // reset states cache on unsubscribe
                states = {};

                adapter.log.level === 'debug' && showSubscribes(socket, 'stateChange');

                typeof callback === 'function' && setImmediate(callback, null);
            }
        });

        // same as 'unsubscribe'
        socket.on('unsubscribeStates', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'unsubscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.unsubscribe(this, 'stateChange', pattern[p]);
                    }
                } else {
                    that.unsubscribe(this, 'stateChange', pattern);
                }
                if (adapter.log.level === 'debug') showSubscribes(socket, 'stateChange');
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('subscribeObjects', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'subscribeObjects', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.subscribe(this, 'objectChange', pattern[p]);
                    }
                } else {
                    that.subscribe(this, 'objectChange', pattern);
                }
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('unsubscribeObjects', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'unsubscribeObjects', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        that.unsubscribe(this, 'objectChange', pattern[p]);
                    }
                } else {
                    that.unsubscribe(this, 'objectChange', pattern);
                }
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('readLogs', function (host, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readLogs', callback)) {
                let timeout = setTimeout(() => {
                    if (timeout) {
                        let result = {list: []};

                        // deliver file list
                        try {
                            const config = adapter.systemConfig;
                            // detect file log
                            if (config && config.log && config.log.transport) {
                                for (const transport in config.log.transport) {
                                    if (config.log.transport.hasOwnProperty(transport) && config.log.transport[transport].type === 'file') {
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
                                                            result.list.push({fileName: 'log/' + transport + '/' + files[f], size: stat.size});
                                                        }
                                                    }
                                                } catch (e) {
                                                    // push unchecked
                                                    // result.list.push('log/' + transport + '/' + files[f]);
                                                    adapter.log.error(`Cannot check file: ${filename}/${files[f]}`);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                result = {error: 'no file loggers'};
                            }
                        } catch (e) {
                            adapter.log.error(e);
                            result = {error: e};
                        }
                        typeof callback === 'function' && callback(result.error, result.list);
                    }
                }, 500);

                sendToHost(host, 'getLogFiles', null, result => {
                    clearTimeout(timeout);
                    timeout = null;
                    typeof callback === 'function' && callback(result.error, result.list);
                });
            }
        });

        socket.on('getVersion', callback => {
           if (typeof callback === 'function') {
                let version = '';
                let name = '';
                try {
                    const pack = require('../io-package.json');
                    version = pack && pack.common && pack.common.version;
                    name = pack && pack.common && pack.common.name;
                } catch (e) {
                    version = 'unknown';
                    name = 'unknown';
                }
                callback(null, version, name);
            }
        });

        socket.on('getAdapterName', callback => {
            if (typeof callback === 'function') {
                let name = '';
                try {
                    const pack = require('../io-package.json');
                    name = pack && pack.common && pack.common.name;
                } catch (e) {
                    name = 'unknown';
                }
                callback(null, name);
            }
        });

        socket.on('getCurrentInstance', callback => {
            typeof callback === 'function' && callback(null, adapter.namespace);
        });

        socket.on('checkFeatureSupported', function (feature, callback) {
            typeof callback === 'function' && callback(null, adapter.supportsFeature && adapter.supportsFeature(feature));
        });

        socket.on('decrypt', function (encryptedText, callback) {
            if (that.secret) {
                typeof callback === 'function' && callback(null, adapter.tools.decrypt(that.secret, encryptedText));
            } else {
                adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        that.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, adapter.tools.decrypt(that.secret, encryptedText));
                    } else {
                        adapter.log.error(`No system.config found: ${err}`);
                        fixCallback(callback, err);
                    }
                });
            }
        });

        socket.on('encrypt', function (plainText, callback) {
            if (that.secret) {
                typeof callback === 'function' && callback(null, adapter.tools.encrypt(that.secret, plainText));
            } else {
                adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        that.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, adapter.tools.encrypt(that.secret, plainText));
                    } else {
                        adapter.log.error(`No system.config found: ${err}`);
                        fixCallback(callback, err);
                    }
                });
            }
        });

        socket.on('getIsEasyModeStrict', function (callback) {
            typeof callback === 'function' && callback(null, adapter.config.accessLimit);
        });

        socket.on('getEasyMode', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                let user;
                if (settings.auth) {
                    user = socket._acl.user;
                    if (!user.startsWith('system.user.')) {
                        user = 'system.user.' + user;
                    }
                } else {
                    user = adapter.config.defaultUser;
                }

                if (adapter.config.accessLimit) {
                    const configs = [];
                    const promises = [];
                    settings.accessAllowedConfigs.forEach(id => promises.push(readInstanceConfig(id, user, false, configs)));
                    settings.accessAllowedTabs.forEach(id    => promises.push(readInstanceConfig(id, user, true, configs)));

                    Promise.all(promises)
                        .then(() => {
                            callback(null, {
                                strict: true,
                                configs
                            });
                        });
                } else {
                    adapter.getObjectView('system', 'instance', {startkey: 'system.adapter.', endkey: 'system.adapter.\u9999'}, {user}, (err, doc) => {
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
                                    promises.push(readInstanceConfig(obj._id.substring('system.adapter.'.length), user, false, configs));
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
        });

        socket.on('getAdapterInstances', function (adapterName, callback) {
            if (typeof callback === 'function') {
                if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                    adapter.getObjectView('system', 'instance',
                        {startkey: `system.adapter.${adapterName ? adapterName + '.' : ''}`, endkey: `system.adapter.${adapterName ? adapterName + '.' : ''}\u9999`},
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
                                        fixAdminUI(obj);
                                        return obj;
                                    })
                                    .filter(obj => obj && (!adapterName || (obj.common && obj.common.name === adapterName))));
                            }
                        });
                }
            }
        });

        socket.on('getAdapters', function (adapterName, callback) {
            if (typeof callback === 'function' && updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                adapter.getObjectView('system', 'adapter',
                    {startkey: `system.adapter.${adapterName || ''}`, endkey: `system.adapter.${adapterName || '\u9999'}`},
                    (err, doc) =>
                    {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, doc.rows
                                .filter(obj => obj && (!adapterName || (obj.common && obj.common.name === adapterName)))
                                .map(item => {
                                    const obj = item.value;
                                    if (obj.common) {
                                        delete obj.common.news;
                                        delete obj.native;
                                    }
                                    fixAdminUI(obj);
                                    return obj;
                                }));
                        }
                    });
            }
        });

        socket.on('updateLicenses', function (login, password, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setObject', callback, login, password)) {
                if (adapter.supportsFeature('CONTROLLER_LICENSE_MANAGER')) {
                    let timeout = setTimeout(() => {
                        if (timeout) {
                            timeout = null;
                            typeof callback === 'function' && callback('updateLicenses timeout');
                        }
                    }, 7000);

                    sendToHost(adapter.common.host, 'updateLicenses', {login, password}, result => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                            typeof callback === 'function' && callback(result.error, result && result.result);
                        }
                    });
                } else {
                    // remove this branch when js-controller 4.x will be mainstream
                    updateLicenses(login, password)
                        .then(licenses => typeof callback === 'function' && callback(null, licenses))
                        .catch(err => typeof callback === 'function' && callback(err));
                }
            }
        });

        socket.on('getCompactInstances', function (callback) {
            if (typeof callback === 'function') {
                if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                    adapter.getObjectView('system', 'instance',
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
        });

        socket.on('getCompactAdapters', function (callback) {
            if (typeof callback === 'function') {
                if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                    adapter.getObjectView('system', 'adapter',
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
        });

        socket.on('getCompactInstalled', function (host, callback) {
            if (typeof callback === 'function') {
                if (updateSession(socket) && checkPermissions(socket, 'sendToHost', callback)) {
                    sendToHost(host, 'getInstalled', null, data => {
                        const result = {};
                        Object.keys(data).forEach(name => result[name] = {version: data[name].version});
                        callback(result);
                    });
                }
            }
        });

        socket.on('getCompactSystemConfig', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                adapter.getForeignObject('system.config', (err, obj) => {
                    obj = obj || {};
                    const secret = obj.native && obj.native.secret;
                    delete obj.native;
                    if (secret) {
                        obj.native = {secret};
                    }
                    callback(err,  obj);
                });
            }
        });

        socket.on('getCompactRepository', function (host, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'sendToHost', callback)) {
                sendToHost(host, 'getRepository', null, data => {
                    // Extract only version and icon
                    const result = {};
                    data && Object.keys(data).forEach(name => result[name] = {
                        version: data[name].version,
                        icon: data[name].extIcon
                    });
                    callback(result);
                });
            }
        });

        socket.on('getCompactHosts', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObject', callback)) {
                adapter.getObjectView('system', 'host',
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
        });

        cb && cb();
    }

    function readInstanceConfig(id, user, isTab, configs) {
        return new Promise(resolve =>
            adapter.getForeignObject('system.adapter.' + id, {user}, (err, obj) => {
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

    function onAuthorizeSuccess(data, accept) {
        adapter.log.debug('successful connection to socket.io from ' + data.connection.remoteAddress);
        //adapter.log.info(JSON.stringify(data));

        accept();
    }

    function onAuthorizeFail(data, message, error, accept) {
        setTimeout(() => data.socket.emit(COMMAND_RE_AUTHENTICATE), 100);

        error && adapter.log.error(`failed connection to socket.io from ${data.connection.remoteAddress}:`, message);

        if (error) {
            accept(new Error(message));
        } else {
            accept(new Error('failed connection to socket.io: ' + message));//null, false);
        }
        // this error will be sent to the user as a special error-package
        // see: http://socket.io/docs/client-api/#socket > error-object
    }

    function initSocket(socket, cb) {
        disableEventThreshold();

        if (adapter.config.auth) {
            adapter.config.ttl = parseInt(adapter.config.ttl, 10) || 3600;
            getUserFromSocket(socket, (err, user) => {
                if (err || !user) {
                    adapter.log.error('socket.io ' + err);
                    socket.emit(COMMAND_RE_AUTHENTICATE);
                } else {
                    adapter.log.debug(`socket.io client ${user} connected`);
                    adapter.calculatePermissions(user, commandsPermissions, acl => {
                        socket._acl = acl;
                        socketEvents(socket, cb);
                    });
                }
            });
        } else {
            adapter.calculatePermissions(adapter.config.defaultUser || 'system.user.admin', commandsPermissions, acl => {
                socket._acl = acl;
                socketEvents(socket, cb);
            });
        }
    }

    // Extract user name from socket
    function getUserFromSocket(socket, callback) {
        let wait = false;
        if (typeof callback !== 'function') {
            return;
        }

        try {
            if (socket.conn.request.sessionID) {
                wait = true;
                if (store) {
                    store.get(socket.conn.request.sessionID, (err, obj) => {
                        if (obj && obj.passport && obj.passport.user) {
                            callback(null, obj.passport.user ? 'system.user.' + obj.passport.user : '');
                        }
                    });
                }
            }
        } catch (e) {

        }

        !wait && callback('Cannot detect user');
    }

    function disableEventThreshold(readAll) {
        if (eventsThreshold.active) {
            eventsThreshold.accidents = 0;
            eventsThreshold.count = 0;
            eventsThreshold.active = false;
            eventsThreshold.timeActivated = 0;
            adapter.log.info('Subscribe on all states again');

            setTimeout(() => {
                /*if (readAll) {
                    adapter.getForeignStates('*', function (err, res) {
                        adapter.log.info('received all states');
                        for (const id in res) {
                            if (res.hasOwnProperty(id) && JSON.stringify(states[id]) !== JSON.stringify(res[id])) {
                                that.server.sockets.emit('stateChange', id, res[id]);
                                states[id] = res[id];
                            }
                        }
                    });
                }*/

                that.server.sockets.emit('eventsThreshold', false);
                adapter.unsubscribeForeignStates('system.adapter.*');

                Object.keys(that.subscribes.stateChange).forEach(pattern =>
                    adapter.subscribeForeignStates(pattern));
            }, 50);
        }
    }

    function enableEventThreshold() {
        if (!eventsThreshold.active) {
            eventsThreshold.active = true;

            setTimeout(() => {
                adapter.log.info('Unsubscribe from all states, except system\'s, because over ' + eventsThreshold.repeatSeconds + ' seconds the number of events is over ' + eventsThreshold.value + ' (in last second ' + eventsThreshold.count + ')');
                eventsThreshold.timeActivated = Date.now();

                that.server.sockets.emit('eventsThreshold', true);

                Object.keys(that.subscribes.stateChange).forEach(pattern =>
                    adapter.unsubscribeForeignStates(pattern));

                adapter.subscribeForeignStates('system.adapter.*');
            }, 100);
        }
    }

    this.repoUpdated = function () {
        if (that.server && that.server.sockets) {
            that.server.sockets.emit('repoUpdated');
        }
    };

    this.objectChange = function (id, obj) {
        const clients = that.server.sockets.connected;

        for (const i in clients) {
            if (clients.hasOwnProperty(i)) {
                updateSession(clients[i]);
            }
        }
        that.server.sockets.emit('objectChange', id, obj);
    };

    this.sendCommand = function (obj) {
        if (cmdSessions[obj.message.id]) {
            if (that.server) {
                that.server.sockets.emit(obj.command, obj.message.id, obj.message.data);
            }
            // we cannot save the socket, because if it takes a bit time, the socket will be invalid
            //cmdSessions[obj.message.id].socket.emit(obj.command, obj.message.id, obj.message.data);
            if (obj.command === 'cmdExit') {
                delete cmdSessions[obj.message.id];
            }
        }
    };

    this.sendLog = function (obj) {
        // TODO Build in some threshold
        if (that.server && that.server.sockets) {
            that.server.sockets.emit('log', obj);
        }
    };

    this.stateChange = function (id, state) {
        if (!state) {
            if (states[id]) {
                delete states[id];
            }
        } else {
            states[id] = state;
        }
        const clients = that.server.sockets.connected;

        if (!eventsThreshold.active) {
            eventsThreshold.count++;
        }
        for (const i in clients) {
            if (clients.hasOwnProperty(i)) {
                updateSession(clients[i]);
            }
        }
        that.server.sockets.emit('stateChange', id, state);
    };

    // remove this function when js.controller 4.x will be mainstream
    function readLicenses(login, password) {
        axios = axios || require('axios');
        const config = {
            headers: { Authorization: `Basic ${Buffer.from(login + ':' + password).toString('base64')}` },
            timeout: 4000
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
    function updateLicenses(login, password) {
        // if login and password provided in the message, just try to read without saving it in system.licenses
        if (login && password) {
            return readLicenses(login, password);
        } else {
            // get actual object
            return adapter.getForeignObjectAsync('system.licenses')
                .then(systemLicenses => {
                    // If password and login exist
                    if (systemLicenses && systemLicenses.native && systemLicenses.native.password && systemLicenses.native.login) {
                        // get the secret to decode the password
                        return adapter.getForeignObjectAsync('system.config')
                            .then(systemConfig => {
                                // decode the password
                                let password;
                                try {
                                    password = adapter.tools.decrypt(systemConfig.native.secret, systemLicenses.native.password);
                                } catch {
                                    throw new Error('Cannot decode password');
                                }

                                // read licenses from iobroker.net
                                return readLicenses(systemLicenses.native.login, password);
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
                                return adapter.setForeignObjectAsync('system.licenses', systemLicenses)
                                    .then(() => licenses);
                            })
                            .catch(err => {
                                // if password is invalid
                                if (err.message.includes('Authentication required') || err.message.includes('Cannot decode password')) {
                                    // clear existing licenses if exist
                                    if (systemLicenses && systemLicenses.native && systemLicenses.native.licenses && systemLicenses.native.licenses.length) {
                                        systemLicenses.native.licenses = [];
                                        systemLicenses.native.readTime = new Date().toISOString();
                                        return adapter.setForeignObjectAsync('system.licenses', systemLicenses)
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
                            return adapter.setForeignObjectAsync('system.licenses', systemLicenses)
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

    (function __constructor() {
        // detect event bursts
        setInterval(function () {
            if (!eventsThreshold.active) {
                if (eventsThreshold.count > eventsThreshold.value) {
                    eventsThreshold.accidents++;

                    if (eventsThreshold.accidents >= eventsThreshold.repeatSeconds) {
                        enableEventThreshold();
                    }
                } else {
                    eventsThreshold.accidents = 0;
                }
                eventsThreshold.count = 0;
            } else if (Date.now() - eventsThreshold.timeActivated > 60000) {
                disableEventThreshold();
            }
        }, eventsThreshold.checkInterval);

        /*server.server.set('logger', {
         debug: function(obj) {adapter.log.debug('socket.io: ' + obj)},
         info:  function(obj) {adapter.log.debug('socket.io: ' + obj)} ,
         error: function(obj) {adapter.log.error('socket.io: ' + obj)},
         warn:  function(obj) {adapter.log.warn('socket.io: ' + obj)}
         });*/
        // it can be used as client too for cloud
        if (!settings.clientid) {
            if (!server.__inited) {
                /*
                 * WORKAROUND for socket.io issue #3555 (https://github.com/socketio/socket.io/issues/3555)
                 * needed until socket.io update is release which incorporates PR #3557
                 *
                 * Problem: Socket.io always search "upwards" for their client files and not in its own node_modules
                 *
                 * Solution: We hook on path.resolve to correctly handle the relevant case
                 */
                const pathResolve = path.resolve;
                const pathResolveHooked = function() {
                    //console.log('arguments: ' + arguments.length + ': ' + arguments[0] + ' - ' + arguments[1] + ' - ' + arguments[2]);
                    if (arguments.length === 3 && arguments[1] === './../../' && arguments[2].startsWith('socket.io-client/dist/socket.io.js')) {
                        path.resolve = pathResolve; // reset because require.resolve also uses path.resolve internally
                        // We want to have the same client files as provided by socket.io
                        // So lookup socket.io first ...
                        const socketIoDir = require.resolve('socket.io');
                        // ... and then from their (with normally unneeded failback to "us")
                        // we lookup the client library
                        const clientPath = require.resolve('socket.io-client', {
                            paths: [path.dirname(socketIoDir), __dirname]
                        });
                        //console.log('1: ' + clientPath);
                        path.resolve = pathResolveHooked; // and restore to hooked one again
                        const finalPath = path.normalize(path.join(path.dirname(clientPath), '..', '..', arguments[2]));
                        //console.log('2: '+finalPath);
                        return finalPath;
                    }
                    // if not our special case, just pass request through to original resolve logic
                    const resolveResult = pathResolve.apply(null,arguments);
                    //console.log('PR-Res: ' + resolveResult);
                    return resolveResult;
                };
                path.resolve = pathResolveHooked; // hook path.resolve

                that.server = socketio.listen(server, {
                    pingInterval: 120000,
                    pingTimeout: 30000
                });

                path.resolve = pathResolve; // restore path.resolve once done

                server.__inited = true;
            }
        } else {
            that.server = server;
        }

        that.server.on('connection', initSocket);
        that.server.on('error', error =>
            adapter.log.error(error));

        if (settings.auth && that.server) {
            that.server.use(passportSocketIo.authorize({
                passport,
                cookieParser,
                key:     userKey,             // the name of the cookie where express/connect stores its session_id
                secret:  settings.secret,     // the session_secret to parse the cookie
                store,                        // we NEED to use a sessionstore. no memorystore please
                success: onAuthorizeSuccess,  // *optional* callback on success - read more below
                fail:    onAuthorizeFail      // *optional* callback on fail/error - read more below
            }));
        }

        that.infoTimeout = that.infoTimeout || setTimeout(updateConnectedInfo, 1000);
    })();

    return this;
}

module.exports = IOSocket;
