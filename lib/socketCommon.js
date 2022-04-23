/**
 *      Class Socket
 *
 *      Copyright 2014-2022 bluefox <dogafox@gmail.com>,
 *      MIT License
 *
 */
const EventEmitter = require('events');
const tools        = require('@iobroker/js-controller-common').tools;
let axios          = null;

// From settings used only secure, auth and crossDomain
class IOSocket extends EventEmitter {
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
        rename:             {type: 'file',      operation: 'write'},
        mkdir:              {type: 'file',      operation: 'write'},
        chmodFile:          {type: 'file',      operation: 'write'},
        chownFile:          {type: 'file',      operation: 'write'},

        authEnabled:        {type: '',          operation: ''},
        disconnect:         {type: '',          operation: ''},
        listPermissions:    {type: '',          operation: ''},
        getUserPermissions: {type: 'object',    operation: 'read'}
    };

    constructor(server, settings, adapter, objects, store, checkUser, clientMode, noInit) {
        super();

        this._store = store || settings.store;

        this.settings     = settings || {};
        this.adapter      = adapter;
        this.subscribes   = {};
        this.server       = null;

        this.noDisconnect = this.getIsNoDisconnect();

        this.serverMode = !clientMode;

        !noInit && this.init(server, {checkUser, userKey: 'connect.sid'});
    }

    getIsNoDisconnect() {
        throw new Error('"getIsNoDisconnect" must be implemented in IOSocket!');
    }

    getSocket() {
        throw new Error('"getSocket" must be implemented in IOSocket!');
    }

    initAuthentication(options) {
        throw new Error('"initAuthentication" must be implemented in IOSocket!');
    }

    // Extract username from socket
    _getUserFromSocket(socket, callback) {
        throw new Error('"_getUserFromSocket" must be implemented in IOSocket!');
    }

    getClientAddress(socket) {
        throw new Error('"getClientAddress" must be implemented in IOSocket!');
    }

    // update session ID, but not ofter than 60 seconds
    updateSession(socket) {
        throw new Error('"updateSession" must be implemented in IOSocket!');
    }

    getSessionID(socket) {
        throw new Error('"getSessionID" must be implemented in IOSocket!');
    }

    // this function is overloaded in admin
    delObject(socket, id, options, callback) {
        // only flot allowed
        if (id.startsWith('flot.')) {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'delObject', callback, id)) {
                this.adapter.delForeignObject(id, {user: socket._acl.user}, callback);
            }
        } else {
            if (typeof callback === 'function') {
                callback(IOSocket.ERROR_PERMISSION);
            }
        }
    }

    // this function is overloaded in admin
    writeFile(socket, _adapter, fileName, data, options, callback) {
        if (this.updateSession(socket) && this.checkPermissions(socket, 'writeFile', callback, fileName)) {
            if (typeof options === 'function') {
                callback = options;
                options = {user: socket._acl.user};
            }
            options = options || {};
            options.user = socket._acl.user;
            this.adapter.log.warn('writeFile deprecated. Please use writeFile64');
            // const buffer = Buffer.from(data64, 'base64');
            this.adapter.writeFile(_adapter, fileName, data, {user: socket._acl.user}, (err, ...args) =>
                IOSocket.fixCallback(callback, err, ...args));
        }
    }

    subscribeStates(socket, pattern, callback) {
        if (this.updateSession(socket) && this.checkPermissions(socket, 'subscribe', callback, pattern)) {
            if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                for (let p = 0; p < pattern.length; p++) {
                    this.subscribe(socket, 'stateChange', pattern[p]);
                }
            } else {
                this.subscribe(socket, 'stateChange', pattern);
            }

            this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

            typeof callback === 'function' && setImmediate(callback, null);
        }
    }

    unsubscribeStates(socket, pattern, callback) {
        if (this.updateSession(socket) && this.checkPermissions(socket, 'unsubscribe', callback, pattern)) {
            if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                for (let p = 0; p < pattern.length; p++) {
                    this.unsubscribe(socket, 'stateChange', pattern[p]);
                }
            } else {
                this.unsubscribe(socket, 'stateChange', pattern);
            }

            // reset states cache on unsubscribe
            if (this.states) {
                this.states = {};
            }

            this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

            typeof callback === 'function' && setImmediate(callback, null);
        }
    }

    init(server, options) {
        const socketIO = this.getSocket();

        // it can be used as client too for cloud
        if (this.serverMode) {
            if (!server.__inited) {
                this.server = socketIO.listen(server, {
                    pingInterval: 120000,
                    pingTimeout: 30000
                });

                server.__inited = true;
            }
        } else {
            this.server = server;
        }

        // socket = socketIO.listen(settings.port, (settings.bind && settings.bind !== "0.0.0.0") ? settings.bind : undefined);
        this.settings.defaultUser = this.settings.defaultUser || 'system.user.admin';
        if (!this.settings.defaultUser.match(/^system\.user\./)) {
            this.settings.defaultUser = 'system.user.' + this.settings.defaultUser;
        }

        if (this.settings.auth && this.server) {
            this.initAuthentication(options);
        }

        // Enable cross domain access
        if (this.settings.crossDomain && this.server.set) {
            this.server.set('origins', '*:*');
        }

        this.settings.ttl = parseInt(this.settings.ttl, 10) || 3600;

        this.server.on('connection', (socket, cb) => this.initSocket(socket, cb));
        this.server.on('error', (error, details) => {
            // ignore "failed connection" as it already shown
            if (!error || !error.message || !error.message.includes('failed connection')) {
                this.adapter.log.error(`Server error: ${(error && error.message) || JSON.stringify(error)}${details ? ' - ' + details : ''}`);
            }
        });

        if (this.settings.port) {
            this.adapter.log.info(`${this.settings.secure ? 'Secure ' : ''}socket.io server listening on port ${this.settings.port}`);
        }

        this.updateConnectedInfo();
    }

    initSocket(socket, cb) {
        this._disableEventThreshold && this._disableEventThreshold();

        if (!socket._acl) {
            if (this.settings.auth) {
                this._getUserFromSocket(socket, (err, user) => {
                    if (err || !user) {
                        socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                        this.adapter.log.error(`socket.io [init] ${err || 'No user found in cookies'}`);
                        if (!this.noDisconnect) {
                            socket.disconnect();
                        }
                    } else {
                        socket._secure = true;
                        this.adapter.log.debug(`socket.io client ${user} connected`);
                        if (!user.startsWith('system.user.')) {
                            user = `system.user.${user}`;
                        }
                        this.adapter.calculatePermissions(user, IOSocket.COMMANDS_PERMISSIONS, acl => {
                            const address = this.getClientAddress(socket);
                            socket._acl = IOSocket.mergeACLs(address, acl, this.settings.whiteListSettings);
                            this.socketEvents(socket, address, cb);
                        });
                    }
                });
            } else {
                this.adapter.calculatePermissions(this.settings.defaultUser, IOSocket.COMMANDS_PERMISSIONS, acl => {
                    const address = this.getClientAddress(socket);
                    socket._acl = IOSocket.mergeACLs(address, acl, this.settings.whiteListSettings);
                    this.socketEvents(socket, address, cb);
                });
            }
        } else {
            const address = this.getClientAddress(socket);
            this.socketEvents(socket, address, cb);
        }
    }

    static getWhiteListIpForAddress(address, whiteList) {
        if (!whiteList) {
            return null;
        }

        // check IPv6 or IPv4 direct match
        if (Object.prototype.hasOwnProperty.call(whiteList, address)) {
            return address;
        }

        // check if address is IPv4
        const addressParts = address.split('.');
        if (addressParts.length !== 4) {
            return null;
        }

        // do we have settings for wild carded ips?
        const wildCardIps = Object.keys(whiteList).filter(key => key.includes('*'));

        if (!wildCardIps.length) {
            // no wild carded ips => no ip configured
            return null;
        }

        wildCardIps.forEach(ip => {
            const ipParts = ip.split('.');
            if (ipParts.length === 4) {
                for (let i = 0; i < 4; i++) {
                    if (ipParts[i] === '*' && i === 3) {
                        // match
                        return ip;
                    }

                    if (ipParts[i] !== addressParts[i]) {
                        break;
                    }
                }
            }
        });

        return null;
    }

    static getPermissionsForIp(address, whiteList) {
        return whiteList[IOSocket.getWhiteListIpForAddress(address, whiteList) || 'default'];
    }

    static mergeACLs(address, acl, whiteList) {
        if (whiteList && address) {
            const whiteListAcl = IOSocket.getPermissionsForIp(address, whiteList);
            if (whiteListAcl) {
                ['object', 'state', 'file'].forEach(key => {
                    if (Object.prototype.hasOwnProperty.call(acl, key) && Object.prototype.hasOwnProperty.call(whiteListAcl, key)) {
                        Object.keys(acl[key]).forEach(permission => {
                            if (Object.prototype.hasOwnProperty.call(whiteListAcl[key], permission)) {
                                acl[key][permission] = acl[key][permission] && whiteListAcl[key][permission];
                            }
                        });
                    }
                });

                if (whiteListAcl.user !== 'auth') {
                    acl.user = 'system.user.' + whiteListAcl.user;
                }
            }
        }

        return acl;
    }

    subscribe(socket, type, pattern) {
        //console.log((socket._name || socket.id) + ' subscribe ' + pattern);
        if (socket) {
            socket._subscribe = socket._subscribe || {};
        }

        this.subscribes[type] = this.subscribes[type] || {};

        pattern = pattern.toString();

        let s;
        if (socket) {
            s = socket._subscribe[type] = socket._subscribe[type] || [];
            for (let i = 0; i < s.length; i++) {
                if (s[i].pattern === pattern) {
                    return;
                }
            }
        }

        const p = tools.pattern2RegEx(pattern);
        if (p === null) {
            return this.adapter.log.warn('Empty pattern on subscribe!');
        }
        if (socket) {
            s.push({pattern, regex: new RegExp(p)});
        }

        if (this.subscribes[type][pattern] === undefined) {
            this.subscribes[type][pattern] = 1;
            if (type === 'stateChange') {
                this.adapter.subscribeForeignStates(pattern);
            } else if (type === 'objectChange') {
                this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern);
            } else if (type === 'log') {
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

    unsubscribe(socket, type, pattern) {
        //console.log((socket._name || socket.id) + ' unsubscribe ' + pattern);
        this.subscribes[type] = this.subscribes[type] || {};

        pattern = pattern.toString();

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
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                                this.adapter.unsubscribeForeignStates(pattern);
                            } else if (type === 'objectChange') {
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                                this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                            } else if (type === 'log') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
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
        } else if (pattern) {
            // Remove pattern from global list
            if (this.subscribes[type][pattern] !== undefined) {
                this.subscribes[type][pattern]--;
                if (this.subscribes[type][pattern] <= 0) {
                    if (type === 'stateChange') {
                        this.adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
                        this.adapter.requireLog && this.adapter.requireLog(false);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        } else {
            for (pattern in this.subscribes[type]) {
                if (!Object.prototype.hasOwnProperty.call(this.subscribes[type], pattern)) {
                    continue;
                }
                if (type === 'stateChange') {
                    //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                    this.adapter.unsubscribeForeignStates(pattern);
                } else if (type === 'objectChange') {
                    //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                    this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                } else if (type === 'log') {
                    //console.log((socket._name || socket.id) + ' requireLog false');
                    this.adapter.requireLog && this.adapter.requireLog(false);
                }
                delete this.subscribes[type][pattern];
            }
        }
    };

    unsubscribeAll() {
        if (this.server && this.server.ioBroker) {
            this.server.sockets.connected.forEach(socket => {
                this._unsubscribeSocket(socket, 'stateChange');
                this._unsubscribeSocket(socket, 'objectChange');
                this._unsubscribeSocket(socket, 'log');
            });
        } else
        if (this.server && this.server.sockets) {
            for (const socket in this.server.sockets) {
                if (Object.prototype.hasOwnProperty.call(this.server.sockets, s)) {
                    this._unsubscribeSocket(socket, 'stateChange');
                    this._unsubscribeSocket(socket, 'objectChange');
                    this._unsubscribeSocket(socket, 'log');
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
                        this.adapter.unsubscribeForeignStates(pattern);
                    } else if (type === 'objectChange') {
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern);
                    } else if (type === 'log') {
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
            if (this.subscribes[type][pattern] === undefined) {
                this.subscribes[type][pattern] = 1;
                if (type === 'stateChange') {
                    this.adapter.subscribeForeignStates(pattern);
                } else if (type === 'objectChange') {
                    this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern);
                } else if (type === 'log') {
                    this.adapter.requireLog && this.adapter.requireLog(true);
                }
            } else {
                this.subscribes[type][pattern]++;
            }
        }
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
                        command,
                        type: IOSocket.COMMANDS_PERMISSIONS[command].type,
                        operation: IOSocket.COMMANDS_PERMISSIONS[command].operation,
                        arg
                    });
                } else {
                    socket.emit(IOSocket.ERROR_PERMISSION, {command, arg});
                }
            }
            return false;
        } else {
            return true;
        }
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
                    await this.rename(_adapter, `${oldName}/${files[f].file}`, `${newName}/${files[f].file}`);
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

    /**
     * Convert errors into strings and then call cb
     * @param {function} cb - callback
     * @param {string|Error|null} err - error argument
     * @param {any[]} args - args passed to cb
     */
    static fixCallback(cb, err, ...args) {
        if (typeof cb !== 'function') {
            return
        }

        if (err instanceof Error) {
            err = err.message;
        }

        cb(err, ...args);
    }

    socketEvents(socket, address, cb) {
        if (socket.conn) {
            this.adapter.log.info(`==> Connected ${socket._acl.user} from ${address}`);
        } else {
            this.adapter.log.info(`Trying to connect as ${socket._acl.user} from ${address}`);
        }

        this.updateConnectedInfo();

        socket.on('authenticate', (user, pass, callback) => {
            this.adapter.log.debug(`${new Date().toISOString()} Request authenticate [${socket._acl.user}]`);
            if (typeof user === 'function') {
                callback = user;
                // user = undefined;
            }
            if (socket._acl.user !== null) {
                if (typeof callback === 'function') {
                    callback(true, socket._secure);
                }
            } else {
                this.adapter.log.debug(`${new Date().toISOString()} Request authenticate [${socket._acl.user}]`);
                socket._authPending = callback;
            }
        });

        socket.on('name', (name, cb) => {
            this.adapter.log.debug(`Connection from "${name}"`);
            this.updateSession(socket);
            if (socket._name === undefined) {
                socket._name = name;
                this.updateConnectedInfo();
            } else if (socket._name !== name) {
                this.adapter.log.warn(`socket ${socket.id} changed socket name from ${socket._name} to ${name}`);
                socket._name = name;
            }

            typeof cb === 'function' && cb();
        });

        /*
         *      objects
         */
        socket.on('getObject', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObject', callback, id)) {
                this.adapter.getForeignObject(id, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        // not admin version of "all objects"
        socket.on('getObjects', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getObjects', callback)) {
                this.adapter.getForeignObjects('*', 'state', 'rooms', {user: socket._acl.user}, (err, objs) => {
                    if (typeof callback === 'function') {
                        callback(err, objs);
                    } else {
                        this.adapter.log.warn('[getObjects] Invalid callback');
                    }
                });
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
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        /*
         *      states
         */
        socket.on('getStates', (pattern, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStates', callback, pattern)) {
                if (typeof pattern === 'function') {
                    callback = pattern;
                    pattern = null;
                }
                if (typeof callback === 'function') {
                    this.adapter.getForeignStates(pattern || '*', {user: socket._acl.user}, (err, ...args) =>
                        IOSocket.fixCallback(callback, err, ...args));
                } else {
                    this.adapter.log.warn('[getStates] Invalid callback')
                }
            }
        });

        socket.on('error', err => {
            this.adapter.log.error('Socket error: ' + err);
        });

        socket.on('log', (text, level) => {
            if (level === 'error') {
                this.adapter.log.error(text);
            } else if (level === 'warn') {
                this.adapter.log.warn(text);
            } else if (level === 'info') {
                this.adapter.log.info(text);
            } else {
                this.adapter.log.debug(text);
            }
        });

        socket.on('delObject', (id, options, callback) =>
            this.delObject(socket, id, options, callback));

        socket.on('getState', (id, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    if (this.states && this.states[id]) {
                        callback(null, this.states[id]);
                    } else {
                        this.adapter.getForeignState(id, {user: socket._acl.user}, (err, ...args) =>
                            IOSocket.fixCallback(callback, err, ...args));
                    }
                } else {
                    this.adapter.log.warn('[getState] Invalid callback');
                }
            }
        });

        socket.on('setState', (id, state, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'setState', callback, id)) {
                if (typeof state !== 'object') {
                    state = {val: state};
                }

                // clear cache
                if (this.states && this.states[id]) {
                    delete this.states[id];
                }

                this.adapter.setForeignState(id, state, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
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
                            IOSocket.fixCallback(callback, err, data);
                        });
                    } else {
                        this.adapter.getBinaryState(id, (err, data) => {
                            if (data) {
                                data = Buffer.from(data).toString('base64');
                            }
                            IOSocket.fixCallback(callback, err, data);
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
                            IOSocket.fixCallback(callback, err, ...args));
                    } else {
                        this.adapter.setBinaryState(id, data, (err, ...args) =>
                            IOSocket.fixCallback(callback, err, ...args));
                    }
                } else {
                    this.adapter.log.warn('[setBinaryState] Invalid callback');
                }
            }
        });

        socket.on('getVersion', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getVersion', callback)) {
                if (typeof callback === 'function') {
                    callback(null, this.adapter.version, this.adapter.name);
                } else {
                    this.adapter.log.warn('[getVersion] Invalid callback');
                }
            }
        });

        socket.on('getAdapterName', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getAdapterName', callback)) {
                if (typeof callback === 'function') {
                    callback(null, this.adapter.name || 'unknown');
                } else {
                    this.adapter.log.warn('[getAdapterName] Invalid callback');
                }
            }
        });

        socket.on('subscribe', (pattern, callback) =>
            this.subscribeStates(socket, pattern, callback));

        // same as 'subscribe'
        socket.on('subscribeStates', (pattern, callback) =>
            this.subscribeStates(socket, pattern, callback));

        socket.on('unsubscribe', (pattern, callback) =>
            this.unsubscribeStates(socket, pattern, callback));

        // same as 'unsubscribe'
        socket.on('unsubscribeStates', (pattern, callback) => {
            this.unsubscribeStates(socket, pattern, callback);
        });

        // new History
        socket.on('getHistory', (id, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getStateHistory', callback, id)) {
                if (typeof options === 'string') {
                    options = {
                        instance: options
                    };
                }
                options = options || {};
                options.user = socket._acl.user;
                options.aggregate = options.aggregate || 'none';
                this.adapter.getHistory(id, options, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        // HTTP
        socket.on('httpGet', (url, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'httpGet', callback, url)) {
                axios = axios || require('axios');
                this.adapter.log.debug('httpGet: ' + url);
                try {
                    axios(url, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        validateStatus: status => status < 400
                    })
                        .then(result => callback(null, {status: result.status, statusText: result.statusText}, result.data))
                        .catch(error => callback(error));
                } catch (err) {
                    callback(err);
                }
            }
        });

        // commands
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
                if (this.sendToHost) {
                    this.sendToHost(host, command, message, callback);
                } else {
                    this.adapter.sendToHost(host, command, message, callback);
                }
            }
        });

        socket.on('authEnabled', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'authEnabled', callback)) {
                if (typeof callback === 'function') {
                    callback(this.settings.auth, (socket._acl.user || '').replace(/^system\.user\./, ''));
                } else {
                    this.adapter.log.warn('[authEnabled] Invalid callback');
                }
            }
        });

        // file operations
        socket.on('readFile', (_adapter, fileName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readFile', callback, fileName)) {
                this.adapter.readFile(_adapter, fileName, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('readFile64', (_adapter, fileName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'readFile64', callback, fileName)) {
                this.adapter.readFile(_adapter, fileName, {user: socket._acl.user}, (err, buffer, type) => {
                    let data64;
                    if (buffer) {
                        if (type === 'application/json') {
                            data64 = Buffer.from(encodeURIComponent(buffer)).toString('base64');
                        } else {
                            if (typeof buffer === 'string') {
                                data64 = Buffer.from(buffer).toString('base64');
                            } else {
                                data64 = buffer.toString('base64');
                            }
                        }
                    }

                    //Convert buffer to base 64
                    if (typeof callback === 'function') {
                        callback(err, data64 || '', type);
                    } else {
                        this.adapter.log.warn('[readFile64] Invalid callback');
                    }
                });
            }
        });

        socket.on('writeFile64', (_adapter, fileName, data64, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {user: socket._acl.user};
            }

            options = options || {};
            options.user = socket._acl.user;

            if (this.updateSession(socket) && this.checkPermissions(socket, 'writeFile64', callback, fileName)) {
                if (!data64) {
                    return typeof callback === 'function' && callback('No data provided');
                }
                // Convert base 64 to buffer
                const buffer = Buffer.from(data64, 'base64');
                this.adapter.writeFile(_adapter, fileName, buffer, options, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('writeFile', (_adapter, fileName, data, options, callback) =>
            this.writeFile(socket, _adapter, fileName, data, options, callback));

        socket.on('unlink', (_adapter, name, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unlink', callback, name)) {
                this.unlink(_adapter, name, {user: socket._acl.user})
                    .then(() => callback && callback())
                    .catch(error => callback && callback(error));
            }
        });

        socket.on('deleteFile', (_adapter, name, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unlink', callback, name)) {
                this.adapter.unlink(_adapter, name, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('deleteFolder', (_adapter, name, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'unlink', callback, name)) {
                this.unlink(_adapter, name, {user: socket._acl.user})
                    .then(() => IOSocket.fixCallback(callback, null))
                    .catch(err => IOSocket.fixCallback(callback, err));
            }
        });

        socket.on('renameFile', (_adapter, oldName, newName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'rename', callback, oldName)) {
                this.adapter.rename(_adapter, oldName, newName, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('rename', (_adapter, oldName, newName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'rename', callback, oldName)) {
                this.rename(_adapter, oldName, newName, {user: socket._acl.user})
                    .then(() => callback && callback())
                    .catch(error => callback && callback(error));
            }
        });

        socket.on('mkdir', (_adapter, dirName, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'mkdir', callback, dirName)) {
                this.adapter.mkdir(_adapter, dirName, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('readDir', (_adapter, dirName, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            options = options || {};
            options.user = socket._acl.user;

            if (options.filter === undefined) {
                options.filter = true;
            }

            if (this.updateSession(socket) && this.checkPermissions(socket, 'readDir', callback, dirName)) {
                this.adapter.readDir(_adapter, dirName, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('chmodFile', (_adapter, fileName, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            options = options || {};
            options.user = socket._acl.user;

            if (options.filter === undefined) {
                options.filter = true;
            }

            if (this.updateSession(socket) && this.checkPermissions(socket, 'chmodFile', callback, fileName)) {
                this.adapter.chmodFile(_adapter, fileName, options, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('chownFile', (_adapter, filename, options, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'chownFile', callback, filename)) {
                options = options || {};
                options.user = socket._acl.user;
                this.adapter.chownFile(_adapter, filename, options, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        socket.on('fileExists', (_adapter, filename, callback) => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'fileExists', callback, filename)) {
                this.adapter.fileExists(_adapter, filename, {user: socket._acl.user}, (err, ...args) =>
                    IOSocket.fixCallback(callback, err, ...args));
            }
        });

        // connect/disconnect
        socket.on('disconnect', error => {
            this.adapter.log.info(`<== Disconnect ${socket._acl.user} from ${this.getClientAddress(socket)} ${socket._name || ''}`);
            this._unsubscribeSocket(socket, 'stateChange');
            this._unsubscribeSocket(socket, 'objectChange');
            this._unsubscribeSocket(socket, 'log');

            this.updateConnectedInfo();

            // Disable logging if no one browser is connected
            if (this.adapter.requireLog) {
                this.adapter.log.debug('Disable logging, because no one socket connected');
                this.adapter.requireLog(!!this.server.engine.clientsCount);
            }

            if (socket._sessionTimer) {
                clearTimeout(socket._sessionTimer);
                socket._sessionTimer = null;
            }

            // if client mode
            if (!this.serverMode) {
                socket._apiKeyOk = false;
                this.emit && this.emit('disconnect', error);
            }
        });

        socket.on('logout', callback => {
            this.adapter.destroySession(socket._sessionID, callback);
        });

        socket.on('listPermissions', callback => {
            if (this.updateSession(socket)) {
                if (typeof callback === 'function') {
                    callback(IOSocket.COMMANDS_PERMISSIONS);
                } else {
                    this.adapter.log.warn('[listPermissions] Invalid callback');
                }
            }
        });

        socket.on('getUserPermissions', callback => {
            if (this.updateSession(socket) && this.checkPermissions(socket, 'getUserPermissions', callback)) {
                if (typeof callback === 'function') {
                    callback(null, socket._acl);
                } else {
                    this.adapter.log.warn('[getUserPermissions] Invalid callback');
                }
            }
        });

        if (typeof this.settings.extensions === 'function') {
            this.settings.extensions(socket);
        }

        // if server mode
        if (this.serverMode) {
            const sessionId = this.getSessionID(socket);
            if (sessionId) {
                socket._secure    = true;
                socket._sessionID = sessionId;
                // Get user for session
                this._store && this._store.get(socket._sessionID, (err, obj) => {
                    if (!obj || !obj.passport) {
                        socket._acl.user = '';
                        socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                        if (!this.noDisconnect) {
                            socket.disconnect();
                        }
                    }
                    if (socket._authPending) {
                        socket._authPending(!!socket._acl.user, true);
                        delete socket._authPending;
                    }
                });
            }

            this._subscribeSocket(socket, 'stateChange');
            this._subscribeSocket(socket, 'objectChange');
            this._subscribeSocket(socket, 'log');
        }

        cb && cb();
    }

    updateConnectedInfo() {
        if (this.infoTimeout) {
            clearTimeout(this.infoTimeout);
            this.infoTimeout = null;
        }
        this.infoTimeout = setTimeout(() => {
            this.infoTimeout = null;

            if (this.server && this.server.sockets) {
                const clientsArray = [];
                if (this.server) {
                    const clients = this.server.sockets.connected;

                    for (const i in clients) {
                        if (Object.prototype.hasOwnProperty.call(clients, i)) {
                            clientsArray.push(clients[i]._name || 'noname');
                        }
                    }
                }
                const text = `[${clientsArray.length}]${clientsArray.join(', ')}`;
                this.adapter.setState('info.connected', text, true);
            }
        }, 1000);
    }

    sendLog(obj) {
        // TODO Build in some threshold
        if (this.server && this.server.sockets) {
            this.server.sockets.emit('log', obj);
        }
    }

    close() {
        this.unsubscribeAll();

        // IO server will be closed
        try {
            this.server && this.server.close && this.server.close();
            this.server = null;
        } catch (e) {
            // ignore
        }

        if (this.infoTimeout) {
            clearTimeout(this.infoTimeout);
            this.infoTimeout = null;
        }
    }
}

module.exports = IOSocket;
