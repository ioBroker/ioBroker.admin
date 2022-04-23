/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

let socketio = require('./ws');
const axios = require('axios');
const path  = require('path');
const fs    = require('fs');
const tools        = require('@iobroker/js-controller-common').tools;

class IOSocket {
    static COMMAND_RE_AUTHENTICATE = 'reauthenticate';
    static ERROR_PERMISSION = 'permissionError';
    static COMMANDS_PERMISSIONS = {
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

    constructor(server, settings, adapter, objects, store) {
        this.cmdSessions = {};

        this.server       = null;
        this.subscribes   = {};
        this.states       = {};
        this.objects      = objects;
        this.thersholdInterval = null;
        this.settings     = settings;
        this.adapter      = adapter;
        this._store       = store;

        this.ALLOW_CACHE = [
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

        this.cache = {};
        this.cacheGB = null; // cache garbage collector

        // do not send too many state updates
        this.eventsThreshold = {
            count: 0,
            timeActivated: 0,
            active: false,
            accidents: 0,
            repeatSeconds: 3,   // how many seconds continuously must be number of events > value
            value: parseInt(this.settings.thresholdValue, 10) || 200, // how many events allowed in one check interval
            checkInterval: 1000 // duration of one check interval
        };

        this.init(server, {userKey: 'connect.sid'});
    }

    // Extract username from socket
    getUserFromSocket(socket, callback) {
        let wait = false;
        if (typeof callback !== 'function') {
            return;
        }

        try {
            if (socket.conn.request.sessionID) {
                if (this._store) {
                    wait = true;
                    this._store.get(socket.conn.request.sessionID, (err, obj) => {
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

    initAuthentication(options) {
        const passportSocketIo = require('./passportSocket');

        this.onAuthorizeSuccess = (data, accept) => {
            this.adapter.log.debug('successful connection to socket.io from ' + data.connection.remoteAddress);
            //adapter.log.info(JSON.stringify(data));

            accept();
        }

        this.onAuthorizeFail = (data, message, error, accept) => {
            setTimeout(() => data.socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE), 100);

            error && this.adapter.log.info(`failed connection to socket.io from ${data.connection.remoteAddress}:`, message);

            if (error) {
                accept(new Error(message));
            } else {
                accept(new Error('failed connection to socket.io: ' + message));//null, false);
            }
            // this error will be sent to the user as a special error-package
            // see: http://socket.io/docs/client-api/#socket > error-object
        }

        this.server.use(passportSocketIo.authorize({
            passport: require('passport'),
            cookieParser: require('cookie-parser'),
            key:     options.userKey,             // the name of the cookie where express/connect stores its session_id
            secret:  this.settings.secret,        // the session_secret to parse the cookie
            store:   this._store,                 // we NEED to use a sessionstore. no memorystore please
            success: this.onAuthorizeSuccess,     // *optional* callback on success - read more below
            fail:    this.onAuthorizeFail         // *optional* callback on fail/error - read more below
        }));
    }

    init(server, options) {
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
                this._disableEventThreshold();
            }
        }, this.eventsThreshold.checkInterval);

        /*server.server.set('logger', {
         debug: function(obj) {adapter.log.debug('socket.io: ' + obj)},
         info:  function(obj) {adapter.log.debug('socket.io: ' + obj)} ,
         error: function(obj) {adapter.log.error('socket.io: ' + obj)},
         warn:  function(obj) {adapter.log.warn('socket.io: ' + obj)}
         });*/
        // it can be used as client too for cloud
        if (!this.settings.clientid) {
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
                const pathResolveHooked = () => {
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
                        return path.normalize(path.join(path.dirname(clientPath), '..', '..', arguments[2]));
                    }
                    // if not our special case, just pass request through to original resolve logic
                    return pathResolve.apply(null,arguments);
                };
                path.resolve = pathResolveHooked; // hook path.resolve

                this.server = socketio.listen(server, {
                    pingInterval: 120000,
                    pingTimeout: 30000
                });

                path.resolve = pathResolve; // restore path.resolve once done

                server.__inited = true;
            }
        } else {
            this.server = server;
        }

        this.server.on('connection', (socket, cb) => this.initSocket(socket, cb));
        this.server.on('error', error => {
            // ignore "failed connection" as it already shown
            if (!error || !error.message || !error.message.includes('failed connection')) {
                this.adapter.log.error(`Error: ${(error && error.message) || JSON.stringify(error)}`);
            }
        });

        if (this.settings.auth && this.server) {
            this.initAuthentication(options);
        }

        this.infoTimeout = this.infoTimeout || setTimeout(() => {this.infoTimeout = null; this.updateConnectedInfo()}, 1000);
    }

    fixAdminUI(obj) {
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
                    this.adapter.setPassword(user, pw, callback);
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
                    this.adapter.delForeignObject('system.user.' + user, options, (err) => {
                        // Remove this user from all groups in web client
                        if (typeof callback === 'function') {
                            callback(err);
                        }
                    });
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
            if (typeof callback === 'function') {
                callback('Invalid characters in the group name. Only following special characters are allowed: -@+$§=?!&# and letters');
            }
            return;
        }

        this.adapter.getForeignObject('system.group.' + group, options, (err, obj) => {
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
                this.adapter.setForeignObject('system.group.' + group, obj, options, (err) => {
                    if (typeof callback === 'function') {
                        callback(err, obj);
                    }
                });
            }
        });
    }

    _delGroup(group, options, callback) {
        this.adapter.getForeignObject('system.group.' + group, options, (err, obj) => {
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
                    this.adapter.delForeignObject('system.group.' + group, options, err =>
                        // Remove this group from all users in web client
                        typeof callback === 'function' && callback(err));
                }
            }
        });
    }

    // update session ID, but not ofter than 60 seconds
    updateSession(socket) {
        if (socket._sessionID) {
            const time = Date.now();
            if (socket._lastActivity && time - socket._lastActivity > this.adapter.config.ttl * 1000) {
                this.adapter.log.warn('REAUTHENTICATE!');
                socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                return false;
            }
            socket._lastActivity = time;
            if (!socket._sessionTimer) {
                socket._sessionTimer = setTimeout(() => {
                    socket._sessionTimer = null;
                    this.adapter.getSession(socket._sessionID, obj => {
                        if (obj) {
                            this.adapter.setSession(socket._sessionID, this.adapter.config.ttl, obj);
                        } else {
                            this.adapter.log.warn('REAUTHENTICATE!');
                            socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                        }
                    });
                }, 60000);
            }
        }
        return true;
    }

    checkPermissions(socket, command, callback, arg) {
        if (socket._acl.user !== 'system.user.admin') {
            // type: file, object, state, other
            // operation: create, read, write, list, delete, sendto, execute, sendToHost, readLogs
            if (IOSocket.COMMANDS_PERMISSIONS[command]) {
                // If permission required
                if (IOSocket.COMMANDS_PERMISSIONS[command].type) {
                    if (socket._acl[IOSocket.COMMANDS_PERMISSIONS[command].type] &&
                        socket._acl[IOSocket.COMMANDS_PERMISSIONS[command].type][IOSocket.COMMANDS_PERMISSIONS[command].operation]) {
                        return true;
                    } else {
                        this.adapter.log.warn(`No permission for "${socket._acl.user}" to call ${command}. Need "${IOSocket.COMMANDS_PERMISSIONS[command].type}"."${IOSocket.COMMANDS_PERMISSIONS[command].operation}"`);
                    }
                } else {
                    return true;
                }
            } else {
                this.adapter.log.warn('No rule for command: ' + command);
            }

            if (typeof callback === 'function') {
                callback(IOSocket.ERROR_PERMISSION);
            } else {
                if (IOSocket.COMMANDS_PERMISSIONS[command]) {
                    socket.emit(IOSocket.ERROR_PERMISSION, {
                        command: command,
                        type: IOSocket.COMMANDS_PERMISSIONS[command].type,
                        operation: IOSocket.COMMANDS_PERMISSIONS[command].operation,
                        arg: arg
                    });
                } else {
                    socket.emit(IOSocket.ERROR_PERMISSION, {
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

    static checkObject(obj, options, flag) {
        // read rights of object
        if (!obj || !obj.common || !obj.acl || flag === 'list') {
            return true;
        }

        if (options.user !== 'system.user.admin' &&
            !options.groups.includes('system.group.administrator')) {
            if (obj.acl.owner !== options.user) {
                // Check if the user is in the group
                if (options.groups.includes(obj.acl.ownerGroup)) {
                    // Check group rights
                    if (!(obj.acl.object & (flag << 4))) {
                        return false
                    }
                } else {
                    // everybody
                    if (!(obj.acl.object & flag)) {
                        return false
                    }
                }
            } else {
                // Check group rights
                if (!(obj.acl.object & (flag << 8))) {
                    return false
                }
            }
        }
        return true;
    }

    getAllObjects(socket, callback) {
        if (this.updateSession(socket) && this.checkPermissions(socket, 'getObjects', callback)) {
            if (socket._acl &&
                socket._acl.user !== 'system.user.admin' &&
                !socket._acl.groups.includes('system.group.administrator')) {
                const result = {};
                for (const id in this.objects) {
                    if (this.objects.hasOwnProperty(id) && IOSocket.checkObject(this.objects[id], socket._acl, 4 /* 'read' */)) {
                        result[id] = this.objects[ob];
                    }
                }
                callback(null, result);
            } else {
                if (typeof callback === 'function') {
                    callback(null, this.objects);
                }
            }
        }
    }

    subscribe(socket, type, pattern) {
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

        let p = tools.pattern2RegEx(pattern);
        if (p === null) {
            return this.adapter.log.warn('Empty or invalid pattern on subscribe!');
        }
        if (socket) {
            s.push({pattern: pattern, regex: new RegExp(p)});
        }

        if (this.subscribes[type][pattern] === undefined) {
            this.subscribes[type][pattern] = 1;
            if (type === 'stateChange') {
                this.adapter.log.debug('Subscribe STATES: ' + pattern);
                this.adapter.subscribeForeignStates(pattern);
            } else if (type === 'objectChange') {
                this.adapter.log.debug('Subscribe OBJECTS: ' + pattern);
                this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern);
            } else if (type === 'log') {
                this.adapter.log.debug('Subscribe LOGS');
                this.adapter.requireLog && this.adapter.requireLog(true);
            }
        } else {
            this.subscribes[type][pattern]++;
        }
    };

    _showSubscribes(socket, type) {
        if (socket && socket._subscribe) {
            const s = socket._subscribe[type] || [];
            const ids = [];
            for (let i = 0; i < s.length; i++) {
                ids.push(s[i].pattern);
            }
            this.adapter.log.debug('Subscribes: ' + ids.join(', '));
        } else {
            this.adapter.log.debug('Subscribes: no subscribes');
        }
    }

    updateConnectedInfo() {
        if (this.infoTimeout) {
            clearTimeout(this.infoTimeout);
            this.infoTimeout = null;
        }
        if (this.server.sockets) {
            let clientsArray = [];
            if (this.server) {
                let clients = this.server.sockets.connected;

                for (let i in clients) {
                    if (clients.hasOwnProperty(i)) {
                        clientsArray.push(clients[i]._name || 'noname');
                    }
                }
            }
            const text = `[${clientsArray.length}]${clientsArray.join(', ')}`;
            this.adapter.setState('info.connection', text, true);
        }
    }

    unsubscribe(socket, type, pattern) {
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
                                this.adapter.log.debug('Unsubscribe STATES: ' + pattern);
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                                this.adapter.unsubscribeForeignStates(pattern);
                            } else if (type === 'objectChange') {
                                this.adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                                this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                            } else if (type === 'log') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
                                this.adapter.log.debug('Unsubscribe LOGS');
                                this.adapter.requireLog && this.adapter.requireLog(false);
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
                        this.adapter.log.debug('Unsubscribe STATES: ' + pattern);
                        this.adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        this.adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        this.adapter.log.debug('Unsubscribe LOGS');
                        this.adapter.requireLog && this.adapter.requireLog(false);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        }
    };

    unsubscribeAll () {
        if (this.server && this.server.ioBroker) {
            this.server.sockets.connected.forEach(socket => {
                this.unsubscribe(socket, 'stateChange');
                this.unsubscribe(socket, 'objectChange');
                this.unsubscribe(socket, 'log');
            });
        } else
        if (this.server && this.server.sockets) {
            for (const socket in this.server.sockets) {
                if (this.server.sockets.hasOwnProperty(socket)) {
                    this.unsubscribe(socket, 'stateChange');
                    this.unsubscribe(socket, 'objectChange');
                    this.unsubscribe(socket, 'log');
                }
            }
        }
    };

    _unsubscribeSocket(socket, type) {
        if (!socket || !socket._subscribe || !socket._subscribe[type]) {
            return;
        }

        for (let i = 0; i < socket._subscribe[type].length; i++) {
            const pattern = socket._subscribe[type][i].pattern;
            if (this.subscribes[type][pattern] !== undefined) {
                this.subscribes[type][pattern]--;
                if (this.subscribes[type][pattern] <= 0) {
                    if (type === 'stateChange') {
                        this.adapter.log.debug('Unsubscribe STATES: ' + pattern);
                        this.adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        this.adapter.log.debug('Unsubscribe OBJECTS: ' + pattern);
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        this.adapter.log.debug('Unsubscribe LOGS: ' + pattern);
                        this.adapter.requireLog && this.adapter.requireLog(false);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        }
    }

    _subscribeSocket(socket, type) {
        //console.log((socket._name || socket.id) + ' this._subscribeSocket');
        if (!socket || !socket._subscribe || !socket._subscribe[type]) {
            return;
        }

        for (let i = 0; i < socket._subscribe[type].length; i++) {
            const pattern = socket._subscribe[type][i].pattern;
            if (this.subscribes[type][pattern] === undefined){
                this.subscribes[type][pattern] = 1;
                if (type === 'stateChange') {
                    this.adapter.log.debug('Subscribe STATES: ' + pattern);
                    this.adapter.subscribeForeignStates(pattern);
                } else if (type === 'objectChange') {
                    this.adapter.log.debug('Subscribe OBJECTS: ' + pattern);
                    this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern);
                } else if (type === 'log') {
                    this.adapter.log.debug('Subscribe LOGS');
                    this.adapter.requireLog && this.adapter.requireLog(true);
                }
            } else {
                this.subscribes[type][pattern]++;
            }
        }
    }

    sendToHost(host, command, message, callback) {
        const hash = host + '_' + command;
        if (!message && this.ALLOW_CACHE.includes(command) && this.cache[hash]) {
            if (Date.now() - this.cache[hash].ts < 500) {
                return typeof callback === 'function' && setImmediate(data => callback(data), JSON.parse(this.cache[hash].res));
            } else {
                delete this.cache[hash];
            }
        }
        this.adapter.sendToHost(host, command, message, res => {
            if (!message && this.ALLOW_CACHE.includes(command)) {
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

    async rename(_adapter, oldName, newName, options) {
        // read if it is a file or folder
        try {
            if (oldName.endsWith('/')) {
                oldName = oldName.substring(0, oldName.length - 1);
            }

            if (newName.endsWith('/')) {
                newName = newName.substring(0, newName.length - 1);
            }

            const files = await this.adapter.readDirAsync(_adapter, oldName, options);
            if (files && files.length) {
                for (let f = 0; f < files.length; f++) {
                    await this.rename(_adapter, oldName + '/' + files[f].file, newName + '/' + files[f].file);
                }
            }
        } catch (error) {
            if (error.message !== 'Not exists') {
                throw error;
            }
            // else ignore, because it is a file and not a folder
        }

        try {
            await this.adapter.renameAsync(_adapter, oldName, newName, options);
        } catch (error) {
            if (error.message !== 'Not exists') {
                throw error;
            }
            // else ignore, because folder cannot be deleted
        }
    }

    async unlink(_adapter, name, options) {
        // read if it is a file or folder
        try {
            // remove trailing '/'
            if (name.endsWith('/')) {
                name = name.substring(0, name.length - 1);
            }
            const files = await this.adapter.readDirAsync(_adapter, name, options);
            if (files && files.length) {
                for (let f = 0; f < files.length; f++) {
                    await this.unlink(_adapter, name + '/' + files[f].file);
                }
            }
        } catch (error) {
            // ignore, because it is a file and not a folder
            if (error.message !== 'Not exists') {
                throw error;
            }
        }

        try {
            await this.adapter.unlinkAsync(_adapter, name, options);
        } catch (error) {
            if (error.message !== 'Not exists') {
                throw error;
            }
            // else ignore, because folder cannot be deleted
        }
    }

    socketEvents(socket, cb) {
        if (socket.conn.request.sessionID && this.adapter.config.auth) {
            socket._secure = true;
            socket._sessionID = socket.conn.request.sessionID;
            // Get user for session
            this.adapter.getSession(socket.conn.request.sessionID, obj => {
                if (!obj || !obj.passport) {
                    socket._acl.user = '';
                    socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                }
            });
        }

        this.infoTimeout = this.infoTimeout || setTimeout(() => {this.infoTimeout = null; this.updateConnectedInfo()}, 1000);

        // Enable logging, while some browser is connected
        /*if (this.adapter.requireLog) {
            this.adapter.requireLog(true);
        }*/

        if (socket.conn) {
            this._subscribeSocket(socket, 'stateChange');
            this._subscribeSocket(socket, 'objectChange');
            this._subscribeSocket(socket, 'log');
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

        socket.on('name', name => {
            this.updateSession(socket);
            if (socket._name === undefined) {
                socket._name = name;
                this.infoTimeout = this.infoTimeout || setTimeout(() => {this.infoTimeout = null; this.updateConnectedInfo()}, 1000);
            } else if (socket._name !== name) {
                this.adapter.log.warn(`socket ${socket.id} changed socket name from ${socket._name} to ${name}`);
                socket._name = name;
            }
        });

        socket.on('authenticate', cb =>
            cb && cb(true, this.settings.auth));

        /*
         *      objects
         */
        socket.on('getObject', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback, id)) {
                this.adapter.getForeignObject(id, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('getObjects', callback => {
            return this.getAllObjects(socket, callback);
        });

        socket.on('getForeignObjects', (pattern, type, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObjects', callback)) {
                if (typeof type === 'function') {
                    callback = type;
                    type = undefined;
                }

                this.adapter.getForeignObjects(pattern, type, (err, ...args) => {
                    if (typeof callback === 'function') {
                        fixCallback(callback, err, ...args);
                    } else {
                        this.adapter.log.warn('[getObjects] Invalid callback')
                    }
                });
            }
        });

        // Identical to getObjects
        socket.on('getAllObjects', callback => {
            return this.getAllObjects(socket, callback);
        });

        socket.on('getObjectView', (design, search, params, callback) => {
            if (typeof callback === 'function') {
                if (this.updateSession(socket) && this.checkPermissions(socket, 'getObjectView', callback, search)) {
                    this.adapter.getObjectView(design, search, params, {user: socket._acl.user}, callback);
                }
            } else {
                this.adapter.log.error('Callback is not a function');
            }
        });

        socket.on('setObject', (id, obj, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setObject', callback, id)) {
                this.adapter.setForeignObject(id, obj, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delObject', (id, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delObject', callback, id)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                this.adapter.delForeignObject(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delObjects', (id, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delObject', callback, id)) {
                if (!options || typeof options !== 'object') {
                    options = {};
                }
                options.user = socket._acl.user;
                options.recursive = true;
                this.adapter.delForeignObject(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('extendObject', (id, obj, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'extendObject', callback, id)) {
                this.adapter.extendForeignObject(id, obj, {user: socket._acl.user}, (err, ...args) =>
                     fixCallback(callback, err, ...args));
            }
        });

        socket.on('getHostByIp', (ip, callback) => {
            if (typeof callback !== 'function') {
                return this.adapter.log.warn('[getHostByIp] Invalid callback');
            }
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getHostByIp', ip)) {
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
        socket.on('getStates', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    this.adapter.getForeignStates('*', (err, ...args) =>
                        fixCallback(callback, err, ...args));
                } else {
                    this.adapter.log.warn('[getStates] Invalid callback')
                }
            }
        });

        socket.on('getState', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    if (this.states[id]) {
                        callback(null, this.states[id]);
                    } else {
                        this.adapter.getForeignState(id, (err, ...args) =>
                            fixCallback(callback, err, ...args));
                    }
                } else {
                    this.adapter.log.warn('[getState] Invalid callback');
                }
            }
        });

        socket.on('getBinaryState', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    if (this.adapter.getForeignBinaryState) {
                        this.adapter.getForeignBinaryState(id, (err, data) => {
                            if (data) {
                                data = Buffer.from(data).toString('base64');
                            }
                            fixCallback(callback, err, data);
                        });
                    } else {
                        this.adapter.getBinaryState(id, (err, data) => {
                            if (data) {
                                data = Buffer.from(data).toString('base64');
                            }
                            fixCallback(callback, err, data);
                        });
                    }
                } else {
                    this.adapter.log.warn('[getBinaryState] Invalid callback')
                }
            }
        });

        socket.on('setBinaryState', (id, base64, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setState', callback, id)) {
                if (typeof callback === 'function') {
                    let data = null;
                    try {
                        data = Buffer.from(base64, 'base64')
                    } catch (e) {
                        this.adapter.log.warn('[setBinaryState] Cannot convert base64 data: ' + e);
                    }

                    if (this.adapter.setForeignBinaryState) {
                        this.adapter.setForeignBinaryState(id, data, (err, ...args) =>
                            fixCallback(callback, err, ...args));
                    } else {
                        this.adapter.setBinaryState(id, data, (err, ...args) =>
                            fixCallback(callback, err, ...args));
                    }
                } else {
                    this.adapter.log.warn('[setBinaryState] Invalid callback');
                }
            }
        });

        socket.on('getForeignStates', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    this.adapter.getForeignStates(pattern, (err, ...args) =>
                        fixCallback(callback, err, ...args));
                } else {
                    this.adapter.log.warn('[getForeignStates] Invalid callback')
                }
            }
        });

        socket.on('setState', (id, state, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setState', callback, id)) {
                if (typeof state !== 'object') {
                    state = {val: state};
                }

                // clear cache
                if (this.states[id]) {
                    delete this.states[id];
                }

                this.adapter.setForeignState(id, state, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delState', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delState', callback, id)) {
                // clear cache
                if (this.states[id]) {
                    delete this.states[id];
                }
                this.adapter.delForeignState(id, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('requireLog', (isEnabled, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setObject', callback)) {
                if (isEnabled) {
                    this.subscribe(socket, 'log', 'dummy');
                } else {
                    this.unsubscribe(socket, 'log', 'dummy');
                }

                this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'log');

                typeof callback === 'function' && setImmediate(callback, null);
            }
        });
        /*
         *      History
         */
        socket.on('getStateHistory', (id, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = socket._acl.user;
                options.aggregate = options.aggregate || 'none';
                this.adapter.getHistory(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });
        socket.on('getHistory', (id, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStateHistory', callback)) {
                options.user = socket._acl.user;
                options.aggregate = options.aggregate || 'none';
                this.adapter.getHistory(id, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });
        /*
         *      user/group
         */
        socket.on('addUser', (user, pass, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'addUser', callback, user)) {
                this._addUser(user, pass, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delUser', (user, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delUser', callback, user)) {
                this._delUser(user, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('addGroup', (group, desc, acl, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'addGroup', callback, group)) {
                this._addGroup(group, desc, acl, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('delGroup', (group, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delGroup', callback, group)) {
                this._delGroup(group, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('changePassword', (user, pass, callback) => {
            if (this.updateSession(socket)) {
                if (user === socket._acl.user || this.checkPermissions(socket, 'changePassword', callback, user)) {
                    this.adapter.setPassword(user, pass, {user: socket._acl.user}, (err, ...args) =>
                        fixCallback(callback, err, ...args));
                }
            }
        });

        // HTTP
        socket.on('httpGet', (url, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'httpGet', callback, url)) {
                axios.get(url, {timeout: 15000, validateStatus: status => status < 400})
                    .then(response => typeof callback === 'function' && callback(null, response, response.data))
                    .catch(error => typeof callback === 'function' && callback(error.code, error.response, error.response && error.response.data));
            }
        });

        // commands will be executed on host/controller
        // following response commands are expected: cmdStdout, cmdStderr, cmdExit
        socket.on('cmdExec', (host, id, cmd, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'cmdExec', callback, cmd)) {
                console.log(`cmdExec on ${host}(${id}): ${cmd}`);
                // remember socket for this ID.
                this.cmdSessions[id] = {socket: socket};
                this.adapter.sendToHost(host, 'cmdExec', {data: cmd, id: id});
            }
        });

        socket.on('readDir', (_adapter, path, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readDir', callback, path)) {
                this.adapter.readDir(_adapter, path, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('writeFile', (_adapter, filename, data64, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'writeFile', callback, filename)) {
                let buffer = new Buffer(data64, 'base64');
                this.adapter.writeFile(_adapter, filename, buffer, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('renameFile', (_adapter, oldName, newName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'renameFile', callback, oldName)) {
                this.adapter.rename(_adapter, oldName, newName, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('mkdir', (_adapter, dirName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'mkdir', callback, dirName)) {
                this.adapter.mkdir(_adapter, dirName, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('writeFile64', (_adapter, fileName, data64, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {user: socket._acl.user};
            }

            options = options || {};
            options.user = options.user || socket._acl.user;

            if (this.updateSession(socket) && this.checkPermissions(socket, 'writeFile64', callback, fileName)) {
                //Convert base 64 to buffer
                let buffer = new Buffer(data64, 'base64');
                this.adapter.writeFile(_adapter, fileName, buffer, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('readFile', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readFile', callback, filename)) {
                this.adapter.readFile(_adapter, filename, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('deleteFile', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'deleteFile', callback, filename)) {
                this.adapter.unlink(_adapter, filename, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('deleteFolder', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'deleteFolder', callback, filename)) {
                this.unlink(_adapter, filename, {user: socket._acl.user})
                    .then(() => fixCallback(callback, null))
                    .catch(err => fixCallback(callback, err));
            }
        });

        socket.on('readFile64', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readFile64', callback, filename)) {
                this.adapter.readFile(_adapter, filename, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('chmodFile', (_adapter, filename, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'chmodFile', callback, filename)) {
                options = options || {};
                options.user = socket._acl.user;
                this.adapter.chmodFile(_adapter, filename, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('chownFile', (_adapter, filename, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'chownFile', callback, filename)) {
                options = options || {};
                options.user = socket._acl.user;
                this.adapter.chownFile(_adapter, filename, options, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('fileExists', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'fileExists', callback, filename)) {
                this.adapter.fileExists(_adapter, filename, {user: socket._acl.user}, (err, ...args) =>
                    fixCallback(callback, err, ...args));
            }
        });

        socket.on('sendTo', (adapterInstance, command, message, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'sendTo', callback, command)) {
                this.adapter.sendTo(adapterInstance, command, message, res =>
                    typeof callback === 'function' && setImmediate(() =>
                        callback(res)));
            }
        });

        // following commands are protected and require the extra permissions
        const protectedCommands = ['cmdExec', 'getLocationOnDisk', 'getDiagData', 'getDevList', 'delLogs', 'writeDirAsZip', 'writeObjectsAsZip', 'readObjectsAsZip', 'checkLogging', 'updateMultihost', 'rebuildAdapter'];

        socket.on('sendToHost', (host, command, message, callback) => {
            // host can answer following commands: cmdExec, getRepository, getInstalled, getInstalledAdapter, getVersion, getDiagData, getLocationOnDisk, getDevList, getLogs, getHostInfo,
            // delLogs, readDirAsZip, writeDirAsZip, readObjectsAsZip, writeObjectsAsZip, checkLogging, updateMultihost
            if (this.updateSession(socket) && this.checkPermissions(socket, protectedCommands.includes(command) ? 'cmdExec' : 'sendToHost', callback, command)) {
                this.sendToHost(host, command, message, callback);
            }
        });

        socket.on('authEnabled', callback => {
            typeof callback === 'function' && callback(this.adapter.config.auth, socket._acl.user.replace(/^system\.user\./, ''));
        });

        socket.on('disconnect', () => {
            this._unsubscribeSocket(socket, 'stateChange');
            this._unsubscribeSocket(socket, 'objectChange');
            this._unsubscribeSocket(socket, 'log');

            this.infoTimeout = this.infoTimeout || setTimeout(() => {this.infoTimeout = null; this.updateConnectedInfo()}, 1000);

            // Disable logging if no one browser is connected
            if (this.adapter.requireLog) {
                this.adapter.log.debug('Disable logging, because no one socket connected');
                this.adapter.requireLog(!!this.server.engine.clientsCount);
            }
        });

        socket.on('listPermissions', callback => {
            if (this.updateSession(socket)) {
                if (typeof callback === 'function') {
                    callback(IOSocket.COMMANDS_PERMISSIONS);
                }
            }
        });

        socket.on('getUserPermissions', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getUserPermissions', callback)) {
                typeof callback === 'function' && callback(null, socket._acl);
            }
        });

        socket.on('getRatings', (update, callback) => {
            if (update) {
                this.adapter._updateRatings()
                    .then(() => typeof callback === 'function' && callback(null, this.adapter._ratings));
            } else {
                typeof callback === 'function' && callback(null, this.adapter._ratings);
            }
        });

        socket.on('eventsThreshold', isActive => {
            if (!isActive) {
                _disableEventThreshold(true);
            } else {
                _enableEventThreshold();
            }
        });

        socket.on('subscribe', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'subscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.subscribe(socket, 'stateChange', pattern[p]);
                    }
                } else {
                    this.subscribe(socket, 'stateChange', pattern);
                }

                this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });
        // same as 'subscribe'
        socket.on('subscribeStates', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'subscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.subscribe(socket, 'stateChange', pattern[p]);
                    }
                } else {
                    this.subscribe(socket, 'stateChange', pattern);
                }

                this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('unsubscribe', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unsubscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.unsubscribe(socket, 'stateChange', pattern[p]);
                    }
                } else {
                    this.unsubscribe(socket, 'stateChange', pattern);
                }

                // reset states cache on unsubscribe
                this.states = {};

                this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

                typeof callback === 'function' && setImmediate(callback, null);
            }
        });

        // same as 'unsubscribe'
        socket.on('unsubscribeStates', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unsubscribe', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.unsubscribe(socket, 'stateChange', pattern[p]);
                    }
                } else {
                    this.unsubscribe(socket, 'stateChange', pattern);
                }
                if (this.adapter.log.level === 'debug') this._showSubscribes(socket, 'stateChange');
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('subscribeObjects', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'subscribeObjects', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.subscribe(socket, 'objectChange', pattern[p]);
                    }
                } else {
                    this.subscribe(socket, 'objectChange', pattern);
                }
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('unsubscribeObjects', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unsubscribeObjects', callback, pattern)) {
                if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                    for (let p = 0; p < pattern.length; p++) {
                        this.unsubscribe(socket, 'objectChange', pattern[p]);
                    }
                } else {
                    this.unsubscribe(socket, 'objectChange', pattern);
                }
                if (typeof callback === 'function') {
                    setImmediate(callback, null);
                }
            }
        });

        socket.on('readLogs', (host, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readLogs', callback)) {
                let timeout = setTimeout(() => {
                    if (timeout) {
                        let result = {list: []};

                        // deliver file list
                        try {
                            const config = this.adapter.systemConfig;
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

                this.sendToHost(host, 'getLogFiles', null, result => {
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
            typeof callback === 'function' && callback(null, this.adapter.namespace);
        });

        socket.on('checkFeatureSupported', (feature, callback) => {
            typeof callback === 'function' && callback(null, this.adapter.supportsFeature && this.adapter.supportsFeature(feature));
        });

        socket.on('decrypt', (encryptedText, callback) => {
            if (this.secret) {
                typeof callback === 'function' && callback(null, this.adapter.decrypt(this.secret, encryptedText));
            } else {
                this.adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        this.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, this.adapter.decrypt(this.secret, encryptedText));
                    } else {
                        this.adapter.log.error(`No system.config found: ${err}`);
                        fixCallback(callback, err);
                    }
                });
            }
        });

        socket.on('encrypt', (plainText, callback) => {
            if (this.secret) {
                typeof callback === 'function' && callback(null, this.adapter.encrypt(this.secret, plainText));
            } else {
                this.adapter.getForeignObject('system.config', (err, obj) => {
                    if (obj && obj.native && obj.native.secret) {
                        this.secret = obj.native.secret;
                        typeof callback === 'function' && callback(null, this.adapter.encrypt(this.secret, plainText));
                    } else {
                        this.adapter.log.error(`No system.config found: ${err}`);
                        fixCallback(callback, err);
                    }
                });
            }
        });

        socket.on('getIsEasyModeStrict', callback => {
            typeof callback === 'function' && callback(null, this.adapter.config.accessLimit);
        });

        socket.on('getEasyMode', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
                let user;
                if (this.settings.auth) {
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
                    this.settings.accessAllowedConfigs.forEach(id => promises.push(this.readInstanceConfig(id, user, false, configs)));
                    this.settings.accessAllowedTabs.forEach(id    => promises.push(this.readInstanceConfig(id, user, true, configs)));

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
                                    promises.push(this.readInstanceConfig(obj._id.substring('system.adapter.'.length), user, false, configs));
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

        socket.on('getAdapterInstances', (adapterName, callback) => {
            if (typeof callback === 'function') {
                if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
                    this.adapter.getObjectView('system', 'instance',
                        {startkey: `system.adapter.${adapterName ? this.adapterName + '.' : ''}`, endkey: `system.adapter.${adapterName ? this.adapterName + '.' : ''}\u9999`},
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
                                        this.fixAdminUI(obj);
                                        return obj;
                                    })
                                    .filter(obj => obj && (!adapterName || (obj.common && obj.common.name === this.adapterName))));
                            }
                        });
                }
            }
        });

        socket.on('getAdapters', (adapterName, callback) => {
            if (typeof callback === 'function' && this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
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
                                    this.fixAdminUI(obj);
                                    return obj;
                                }));
                        }
                    });
            }
        });

        socket.on('updateLicenses', (login, password, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setObject', callback, login, password)) {
                if (this.adapter.supportsFeature('CONTROLLER_LICENSE_MANAGER')) {
                    let timeout = setTimeout(() => {
                        if (timeout) {
                            timeout = null;
                            typeof callback === 'function' && callback('updateLicenses timeout');
                        }
                    }, 7000);

                    this.sendToHost(this.adapter.common.host, 'updateLicenses', {login, password}, result => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                            typeof callback === 'function' && callback(result.error, result && result.result);
                        }
                    });
                } else {
                    // remove this branch when js-controller 4.x will be mainstream
                    this.updateLicenses(login, password)
                        .then(licenses => typeof callback === 'function' && callback(null, licenses))
                        .catch(err => typeof callback === 'function' && callback(err));
                }
            }
        });

        socket.on('getCompactInstances', callback => {
            if (typeof callback === 'function') {
                if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
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
        });

        socket.on('getCompactAdapters', callback => {
            if (typeof callback === 'function') {
                if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
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
        });

        socket.on('getCompactInstalled', (host, callback) => {
            if (typeof callback === 'function') {
                if (this.updateSession(socket) && this.checkPermissions(socket, 'sendToHost', callback)) {
                    this.sendToHost(host, 'getInstalled', null, data => {
                        const result = {};
                        Object.keys(data).forEach(name => result[name] = {version: data[name].version});
                        callback(result);
                    });
                }
            }
        });

        socket.on('getCompactSystemConfig', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
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
        });

        socket.on('getCompactRepository', (host, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'sendToHost', callback)) {
                this.sendToHost(host, 'getRepository', null, data => {
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

        socket.on('getCompactHosts', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback)) {
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
        });

        cb && cb();
    }

    readInstanceConfig(id, user, isTab, configs) {
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

    initSocket(socket, cb) {
        this._disableEventThreshold();

        if (this.adapter.config.auth) {
            this.adapter.config.ttl = parseInt(this.adapter.config.ttl, 10) || 3600;
            this.getUserFromSocket(socket, (err, user) => {
                if (err || !user) {
                    this.adapter.log.error('socket.io ' + err);
                    socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                } else {
                    this.adapter.log.debug(`socket.io client ${user} connected`);
                    this.adapter.calculatePermissions(user, IOSocket.COMMANDS_PERMISSIONS, acl => {
                        socket._acl = acl;
                        this.socketEvents(socket, cb);
                    });
                }
            });
        } else {
            this.adapter.calculatePermissions(this.adapter.config.defaultUser || 'system.user.admin', IOSocket.COMMANDS_PERMISSIONS, acl => {
                socket._acl = acl;
                this.socketEvents(socket, cb);
            });
        }
    }

    _disableEventThreshold(readAll) {
        if (this.eventsThreshold.active) {
            this.eventsThreshold.accidents = 0;
            this.eventsThreshold.count = 0;
            this.eventsThreshold.active = false;
            this.eventsThreshold.timeActivated = 0;
            this.adapter.log.info('Subscribe on all states again');

            setTimeout(() => {
                /*if (readAll) {
                    this.adapter.getForeignStates('*', (err, res) => {
                        this.adapter.log.info('received all states');
                        for (const id in res) {
                            if (res.hasOwnProperty(id) && JSON.stringify(states[id]) !== JSON.stringify(res[id])) {
                                this.server.sockets.emit('stateChange', id, res[id]);
                                states[id] = res[id];
                            }
                        }
                    });
                }*/

                this.server.sockets.emit('eventsThreshold', false);
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

                this.server.sockets.emit('eventsThreshold', true);

                Object.keys(this.subscribes.stateChange).forEach(pattern =>
                    this.adapter.unsubscribeForeignStates(pattern));

                this.adapter.subscribeForeignStates('system.adapter.*');
            }, 100);
        }
    }

    repoUpdated() {
        if (this.server && this.server.sockets) {
            this.server.sockets.emit('repoUpdated');
        }
    }

    objectChange(id, obj) {
        const clients = this.server.sockets.connected;

        for (const i in clients) {
            if (clients.hasOwnProperty(i)) {
                this.updateSession(clients[i]);
            }
        }
        this.server.sockets.emit('objectChange', id, obj);
    }

    sendCommand(obj) {
        if (this.cmdSessions[obj.message.id]) {
            if (this.server) {
                this.server.sockets.emit(obj.command, obj.message.id, obj.message.data);
            }
            // we cannot save the socket, because if it takes a bit time, the socket will be invalid
            // cmdSessions[obj.message.id].socket.emit(obj.command, obj.message.id, obj.message.data);
            if (obj.command === 'cmdExit') {
                delete this.cmdSessions[obj.message.id];
            }
        }
    }

    sendLog(obj) {
        // TODO Build in some threshold
        if (this.server && this.server.sockets) {
            this.server.sockets.emit('log', obj);
        }
    }

    close() {
        // IO server will be closed
        try {
            this.server && this.server.close && this.server.close();
            this.server = null;
        } catch (e) {
            // ignore
        }
        this.thersholdInterval && clearInterval(this.thersholdInterval);
        this.thersholdInterval = null;
    }

    stateChange(id, state) {
        if (!state) {
            if (this.states[id]) {
                delete this.states[id];
            }
        } else {
            this.states[id] = state;
        }
        const clients = this.server.sockets.connected;

        if (!this.eventsThreshold.active) {
            this.eventsThreshold.count++;
        }
        for (const i in clients) {
            if (clients.hasOwnProperty(i)) {
                this.updateSession(clients[i]);
            }
        }
        this.server.sockets.emit('stateChange', id, state);
    }

    // remove this function when js.controller 4.x will be mainstream
    readLicenses(login, password) {
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
    updateLicenses(login, password) {
        // if login and password provided in the message, just try to read without saving it in system.licenses
        if (login && password) {
            return this.readLicenses(login, password);
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
                                return this.readLicenses(systemLicenses.native.login, password);
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
}

module.exports = IOSocket;
