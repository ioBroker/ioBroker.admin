/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

const socketio = require('socket.io');
const request  = require('request');
const path     = require('path');
const fs       = require('fs');

function IOSocket(server, settings, adapter, objects, states, store) {
    if (!(this instanceof IOSocket)) return new IOSocket(server, settings, adapter, objects, states, store);

    const userKey = 'connect.sid'; // const
    const cmdSessions = {};
    const that = this;
    this.server = null;
    this.subscribes = {};
    let cookieParser;
    let passport;

    if (settings.auth) {
        cookieParser = require('cookie-parser');
        passport     = require('passport');
    }

    const passportSocketIo = require('passport.socketio');

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
        deleteFile:         {type: 'file',      operation: 'delete'},
        readFile64:         {type: 'file',      operation: 'read'},
        writeFile64:        {type: 'file',      operation: 'write'},
        unlink:             {type: 'file',      operation: 'delete'},
        rename:             {type: 'file',      operation: 'write'},
        mkdir:              {type: 'file',      operation: 'write'},
        chmodFile:          {type: 'file',      operation: 'write'},

        authEnabled:        {type: '',          operation: ''},
        disconnect:         {type: '',          operation: ''},
        listPermissions:    {type: '',          operation: ''},
        getUserPermissions: {type: 'object',    operation: 'read'}
    };

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
            const time = (new Date()).getTime();
            if (socket._lastActivity && time - socket._lastActivity > adapter.config.ttl * 1000) {
                socket.emit('reauthenticate');
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
                            socket.emit('reauthenticate');
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
                        adapter.log.warn('No permission for "' + socket._acl.user + '" to call ' + command + '. Need "' + commandsPermissions[command].type + '"."' + commandsPermissions[command].operation + '"');
                    }
                } else {
                    return true;
                }
            } else {
                adapter.log.warn('No rule for command: ' + command);
            }

            if (typeof callback === 'function') {
                callback('permissionError');
            } else {
                if (commandsPermissions[command]) {
                    socket.emit('permissionError', {
                        command: command,
                        type: commandsPermissions[command].type,
                        operation: commandsPermissions[command].operation,
                        arg: arg
                    });
                } else {
                    socket.emit('permissionError', {
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
                socket._acl.groups.indexOf('system.group.administrator') === -1) {
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
        if (!pattern) {
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
        if (!this.subscribes[type]) this.subscribes[type] = {};

        let s;
        if (socket) {
            s = socket._subscribe[type] = socket._subscribe[type] || [];
            for (let i = 0; i < s.length; i++) {
                if (s[i].pattern === pattern) return;
            }
        }

        let p = pattern2RegEx(pattern);
        if (p === null) {
            adapter.log.warn('Empty pattern!');
            return;
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
            let text = '';
            let cnt = 0;
            if (that.server) {
                let clients = that.server.sockets.connected;

                for (let i in clients) {
                    if (clients.hasOwnProperty(i)) {
                        text += (text ? ', ' : '') + (clients[i]._name || 'noname');
                        cnt++;
                    }
                }
            }
            text = '[' + cnt + ']' + text;
            adapter.setState('connected', text, true);
        }
    }

    this.unsubscribe = function (socket, type, pattern) {
        //console.log((socket._name || socket.id) + ' unsubscribe ' + pattern);
        if (!this.subscribes[type]) this.subscribes[type] = {};

        if (socket) {
            if (!socket._subscribe || !socket._subscribe[type]) return;
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
                                if (adapter.unsubscribeForeignObjects) adapter.unsubscribeForeignObjects(pattern);
                            } else if (type === 'log') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
                                adapter.log.debug('Unsubscribe LOGS');
                                if (adapter.requireLog) adapter.requireLog(false);
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
                        if (adapter.unsubscribeForeignObjects) adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        adapter.log.debug('Unsubscribe LOGS');
                        if (adapter.requireLog) adapter.requireLog(false);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        }
    };

    this.unsubscribeAll = function () {
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
        if (!socket._subscribe || !socket._subscribe[type]) return;

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
        if (!socket._subscribe || !socket._subscribe[type]) return;

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
                    if (adapter.requireLog) adapter.requireLog(true);
                }
            } else {
                that.subscribes[type][pattern]++;
            }
        }
    }

    function socketEvents(socket) {
        if (socket.conn.request.sessionID) {
            socket._secure = true;
            socket._sessionID = socket.conn.request.sessionID;
            // Get user for session
            adapter.getSession(socket.conn.request.sessionID, function (obj) {
                if (!obj || !obj.passport) {
                    socket._acl.user = '';
                    socket.emit('reauthenticate');
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

        socket.on('name', function (name) {
            updateSession(socket);
            if (this._name === undefined) {
                this._name = name;
                if (!that.infoTimeout) {
                    that.infoTimeout = setTimeout(updateConnectedInfo, 1000);
                }
            } else if (this._name !== name) {
                adapter.log.warn('socket ' + this.id + ' changed socket name from ' + this._name + ' to ' + name);
                this._name = name;
            }
        });
        /*
         *      objects
         */
        socket.on('getObject', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getObject', callback, id)) {
                adapter.getForeignObject(id, {user: this._acl.user}, callback);
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

                adapter.getForeignObjects(pattern, type, function (err, objs) {
                    if (typeof callback === 'function') {
                        callback(err, objs);
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
            if (updateSession(socket) && checkPermissions(socket, 'getObjectView', callback, search)) {
                adapter.objects.getObjectView(design, search, params, {user: this._acl.user}, callback);
            }
        });

        socket.on('setObject', function (id, obj, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setObject', callback, id)) {
                adapter.setForeignObject(id, obj, {user: this._acl.user}, callback);
            }
        });

        socket.on('delObject', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delObject', callback, id)) {
                adapter.delForeignObject(id, {user: this._acl.user}, callback);
            }
        });

        socket.on('extendObject', function (id, obj, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'extendObject', callback, id)) {
                adapter.extendForeignObject(id, obj, {user: this._acl.user}, callback);
            }
        });

        socket.on('getHostByIp', function (ip, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getHostByIp', ip)) {
                adapter.objects.getObjectView('system', 'host', {}, {user: this._acl.user}, function (err, data) {
                    if (data.rows.length) {
                        for (let i = 0; i < data.rows.length; i++) {
                            if (data.rows[i].value.common.hostname === ip) {
                                if (typeof callback === 'function') {
                                    callback(ip, data.rows[i].value);
                                } else {
                                    adapter.log.warn('[getHostByIp] Invalid callback')
                                }
                                return;
                            }
                            if (data.rows[i].value.native.hardware && data.rows[i].value.native.hardware.networkInterfaces) {
                                const net = data.rows[i].value.native.hardware.networkInterfaces;
                                for (const eth in net) {
                                    if (!net.hasOwnProperty(eth)) continue;
                                    for (let j = 0; j < net[eth].length; j++) {
                                        if (net[eth][j].address === ip) {
                                            if (typeof callback === 'function') {
                                                callback(ip, data.rows[i].value);
                                            } else {
                                                adapter.log.warn('[getHostByIp] Invalid callback')
                                            }
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (typeof callback === 'function') {
                        callback(ip, null);
                    } else {
                        adapter.log.warn('[getHostByIp] Invalid callback');
                    }
                });
            }
        });

        /*
         *      states
         */
        socket.on('getStates', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    callback(null, states);
                } else {
                    adapter.log.warn('[getStates] Invalid callback')
                }
            }
        });

        socket.on('getState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    callback(null, states[id]);
                } else {
                    adapter.log.warn('[getState] Invalid callback')
                }
            }
        });

        socket.on('getForeignStates', function (pattern, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStates', callback)) {
                adapter.getForeignStates(pattern, function (err, objs) {
                    if (typeof callback === 'function') {
                        callback(err, objs);
                    } else {
                        adapter.log.warn('[getForeignStates] Invalid callback')
                    }
                });
            }
        });

        socket.on('setState', function (id, state, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setState', callback, id)) {
                if (typeof state !== 'object') {
                    state = {val: state};
                }

                adapter.setForeignState(id, state, {user: this._acl.user}, function (err, res) {
                    if (typeof callback === 'function') {
                        callback(err, res);
                    }
                });
            }
        });

        socket.on('delState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delState', callback, id)) {
                adapter.delForeignState(id, {user: this._acl.user}, callback);
            }
        });

        socket.on('requireLog', function (isEnabled, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'setObject', callback)) {
                if (isEnabled) {
                    that.subscribe(this, 'log', 'dummy');
                } else {
                    that.unsubscribe(this, 'log', 'dummy');
                }

                if (adapter.log.level === 'debug') showSubscribes(socket, 'log');

                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });
        /*
         *      History
         */
        socket.on('getStateHistory', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = this._acl.user;
                options.aggregate = options.aggregate || 'none';
                adapter.getHistory(id, options, callback);
            }
        });
        socket.on('getHistory', function (id, options, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = this._acl.user;
                options.aggregate = options.aggregate || 'none';
                adapter.getHistory(id, options, callback);
            }
        });
        /*
         *      user/group
         */
        socket.on('addUser', function (user, pass, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'addUser', callback, user)) {
                addUser(user, pass, {user: this._acl.user}, callback);
            }
        });

        socket.on('delUser', function (user, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delUser', callback, user)) {
                delUser(user, {user: this._acl.user}, callback);
            }
        });

        socket.on('addGroup', function (group, desc, acl, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'addGroup', callback, group)) {
                addGroup(group, desc, acl, {user: this._acl.user}, callback);
            }
        });

        socket.on('delGroup', function (group, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'delGroup', callback, group)) {
                delGroup(group, {user: this._acl.user}, callback);
            }
        });

        socket.on('changePassword', function (user, pass, callback) {
            if (updateSession(socket)) {
                if (user === socket._acl.user || checkPermissions(socket, 'changePassword', callback, user)) {
                    adapter.setPassword(user, pass, {user: this._acl.user}, callback);
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
                console.log('cmdExec on ' + host + '(' + id + '): ' + cmd);
                // remember socket for this ID.
                cmdSessions[id] = {socket: socket};
                adapter.sendToHost(host, 'cmdExec', {data: cmd, id: id});
            }
        });

        socket.on('readDir', function (_adapter, path, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readDir', callback, path)) {
                adapter.readDir(_adapter, path, {user: this._acl.user}, callback);
            }
        });

        socket.on('writeFile', function (_adapter, filename, data, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'writeFile', callback, filename)) {
                adapter.writeFile(_adapter, filename, data, {user: this._acl.user}, callback);
            }
        });

        socket.on('readFile', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readFile', callback, filename)) {
                adapter.readFile(_adapter, filename, {user: this._acl.user}, callback);
            }
        });

        socket.on('deleteFile', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'deleteFile', callback, filename)) {
                adapter.unlink(_adapter, filename, {user: this._acl.user}, callback);
            }
        });

        socket.on('readFile64', function (_adapter, filename, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readFile64', callback, filename)) {
                adapter.readFile(_adapter, filename, {user: this._acl.user}, callback);
            }
        });

        socket.on('sendTo', function (adapterInstance, command, message, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'sendTo', callback, command)) {
                adapter.sendTo(adapterInstance, command, message, function (res) {
                    if (typeof callback === 'function') {
                        setTimeout(function () {
                            callback(res);
                        }, 0);
                    }
                });
            }
        });

        // following commands are protected and require the extra permissions
        const protectedCommands = ['cmdExec', 'getLocationOnDisk', 'getDiagData', 'getDevList', 'delLogs', 'writeDirAsZip', 'writeObjectsAsZip', 'readObjectsAsZip', 'checkLogging', 'updateMultihost'];

        socket.on('sendToHost', function (host, command, message, callback) {
            // host can answer following commands: cmdExec, getRepository, getInstalled, getInstalledAdapter, getVersion, getDiagData, getLocationOnDisk, getDevList, getLogs, getHostInfo,
            // delLogs, readDirAsZip, writeDirAsZip, readObjectsAsZip, writeObjectsAsZip, checkLogging, updateMultihost
            if (updateSession(socket) && checkPermissions(socket, protectedCommands.indexOf(command) !== -1 ? 'cmdExec' : 'sendToHost', callback, command)) {
                adapter.sendToHost(host, command, message, res =>
                    typeof callback === 'function' && setTimeout(() => callback(res), 0));
            }
        });

        socket.on('authEnabled', function (callback) {
            if (typeof callback === 'function') {
                callback(adapter.config.auth, socket._acl.user.replace(/^system\.user\./, ''));
            }
        });

        socket.on('disconnect', function () {
            unsubscribeSocket(this, 'stateChange');
            unsubscribeSocket(this, 'objectChange');
            unsubscribeSocket(this, 'log');
            if (!that.infoTimeout) {
                that.infoTimeout = setTimeout(updateConnectedInfo, 1000);
            }

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
                if (typeof callback === 'function') {
                    callback(null, socket._acl);
                }
            }
        });

        socket.on('eventsThreshold', function (isActive) {
            if (!isActive) {
                disableEventThreshold(true);
            } else {
                enableEventThreshold();
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
                if (adapter.log.level === 'debug') showSubscribes(socket, 'stateChange');
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
                if (adapter.log.level === 'debug') showSubscribes(socket, 'stateChange');
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
                if (adapter.log.level === 'debug') showSubscribes(socket, 'stateChange');
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
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

        socket.on('readLogs', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'readLogs', callback)) {
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
                                    filename = path.normalize(__dirname + '/../../../') + filename;
                                }
                                if (fs.existsSync(filename)) {
                                    const files = fs.readdirSync(filename);
                                    for (let f = 0; f < files.length; f++) {
                                        try {
                                            if (!fs.lstatSync(filename + '/' + files[f]).isDirectory()) {
                                                result.list.push('log/' + transport + '/' + files[f]);
                                            }
                                        } catch (e) {
                                            // push unchecked
                                            // result.list.push('log/' + transport + '/' + files[f]);
                                            adapter.log.error('Cannot check file: ' + filename + '/' + files[f]);
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
                if (typeof callback === 'function') {
                    callback(result.error, result.list);
                }
            }
        });

        socket.on('getVersion', callback => {
            if (typeof callback === 'function') {
                let version = '';
                try {
                    const pack = require('../io-package.json');
                    version = pack && pack.common && pack.common.version;
                } catch (e) {
                    version = 'unknown';
                }
                callback(null, version)
            }
        });
    }

    function onAuthorizeSuccess(data, accept) {
        adapter.log.info('successful connection to socket.io from ' + data.connection.remoteAddress);
        //adapter.log.info(JSON.stringify(data));

        accept();
    }

    function onAuthorizeFail(data, message, error, accept) {
        if (error) {
            adapter.log.error('failed connection to socket.io from ' + data.connection.remoteAddress + ':', message);
        }

        if (error) {
            accept(new Error(message));
        } else {
            accept('failed connection to socket.io: ' + message);//null, false);
        }
        // this error will be sent to the user as a special error-package
        // see: http://socket.io/docs/client-api/#socket > error-object
    }

    function initSocket(socket) {
        disableEventThreshold();

        if (adapter.config.auth) {
            adapter.config.ttl = parseInt(adapter.config.ttl, 10) || 3600;
            getUserFromSocket(socket, function (err, user) {
                if (err || !user) {
                    adapter.log.error('socket.io ' + err);
                } else {
                    adapter.log.debug('socket.io client ' + user + ' connected');
                    adapter.calculatePermissions(user, commandsPermissions, function (acl) {
                        socket._acl = acl;
                        socketEvents(socket);
                    });
                }
            });
        } else {
            adapter.calculatePermissions(adapter.config.defaultUser || 'system.user.admin', commandsPermissions, function (acl) {
                socket._acl = acl;
                socketEvents(socket);
            });
        }
    }

    // Extract user name from socket
    function getUserFromSocket(socket, callback) {
        let wait = false;
        try {
            if (socket.conn.request.sessionID) {
                wait = true;
                if (store) {
                    store.get(socket.conn.request.sessionID, function (err, obj) {
                        if (obj && obj.passport && obj.passport.user) {
                            if (typeof callback === 'function') {
                                callback(null, obj.passport.user ? 'system.user.' + obj.passport.user : '');
                            }
                        }
                    });
                }
            }
        } catch (e) {

        }
        if (!wait && callback) {
            callback('Cannot detect user');
        }
    }

    function disableEventThreshold(readAll) {
        if (eventsThreshold.active) {
            eventsThreshold.accidents = 0;
            eventsThreshold.count = 0;
            eventsThreshold.active = false;
            eventsThreshold.timeActivated = 0;
            adapter.log.info('Subscribe on all states again');

            setTimeout(function () {
                if (readAll) {
                    adapter.getForeignStates('*', function (err, res) {
                        adapter.log.info('received all states');
                        for (const id in res) {
                            if (res.hasOwnProperty(id) && JSON.stringify(states[id]) !== JSON.stringify(res[id])) {
                                that.server.sockets.emit('stateChange', id, res[id]);
                                states[id] = res[id];
                            }
                        }
                    });
                }

                that.server.sockets.emit('eventsThreshold', false);
                adapter.unsubscribeForeignStates('system.adapter.*');
                adapter.subscribeForeignStates('*');
            }, 50);
        }
    }

    function enableEventThreshold() {
        if (!eventsThreshold.active) {
            eventsThreshold.active = true;

            setTimeout(function () {
                adapter.log.info('Unsubscribe from all states, except system\'s, because over ' + eventsThreshold.repeatSeconds + ' seconds the number of events is over ' + eventsThreshold.value + ' (in last second ' + eventsThreshold.count + ')');
                eventsThreshold.timeActivated = new Date().getTime();

                that.server.sockets.emit('eventsThreshold', true);
                adapter.unsubscribeForeignStates('*');
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
            } else if (new Date().getTime() - eventsThreshold.timeActivated > 60000) {
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
                that.server = socketio.listen(server);
                server.__inited = true;
            }
        } else {
            that.server = server;
        }

        that.server.on('connection', initSocket);

        if (settings.auth && that.server) {
            that.server.use(passportSocketIo.authorize({
                passport:     passport,
                cookieParser: cookieParser,
                key:          userKey,             // the name of the cookie where express/connect stores its session_id
                secret:       settings.secret,     // the session_secret to parse the cookie
                store:        store,               // we NEED to use a sessionstore. no memorystore please
                success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
                fail:         onAuthorizeFail      // *optional* callback on fail/error - read more below
            }));
        }

        if (!that.infoTimeout) {
            that.infoTimeout = setTimeout(updateConnectedInfo, 1000);
        }
    })();

    return this;
}
module.exports = IOSocket;