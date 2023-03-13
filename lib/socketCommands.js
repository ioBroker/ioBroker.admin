const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const pattern2RegEx = utils.commonTools.pattern2RegEx;
let axios = null;
let zipFiles = null;

class SocketCommands {
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
        subscribeFiles:     {type: 'file',      operation: 'read'},
        unsubscribeFiles:   {type: 'file',      operation: 'read'},

        authEnabled:        {type: '',          operation: ''},
        disconnect:         {type: '',          operation: ''},
        listPermissions:    {type: '',          operation: ''},
        getUserPermissions: {type: 'object',    operation: 'read'}
    };

    constructor(adapter, updateSession) {
        this.adapter    = adapter;
        this.commands   = {};
        this.subscribes = {};
        this.logEnabled = false;

        this._updateSession = updateSession;

        if (!this._updateSession) {
            this._updateSession = () => true;
        }

        this._initCommands();
    }

    async _rename(_adapter, oldName, newName, options) {
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
                    await this._rename(_adapter, `${oldName}/${files[f].file}`, `${newName}/${files[f].file}`);
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

    async _unlink(_adapter, name, options) {
        // read if it is a file or folder
        try {
            // remove trailing '/'
            if (name.endsWith('/')) {
                name = name.substring(0, name.length - 1);
            }
            const files = await this.adapter.readDirAsync(_adapter, name, options);
            if (files && files.length) {
                for (let f = 0; f < files.length; f++) {
                    await this._unlink(_adapter, `${name}/${files[f].file}`);
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
     * @param {string|Error|null} error - error argument
     * @param {any[]} args - args passed to cb
     */
    static _fixCallback(cb, error, ...args) {
        if (typeof cb !== 'function') {
            return;
        }

        if (error instanceof Error) {
            error = error.message;
        }

        cb(error, ...args);
    }

    _checkPermissions(socket, command, callback, arg) {
        if (socket._acl.user !== 'system.user.admin') {
            // type: file, object, state, other
            // operation: create, read, write, list, delete, sendto, execute, sendToHost, readLogs
            if (SocketCommands.COMMANDS_PERMISSIONS[command]) {
                // If permission required
                if (SocketCommands.COMMANDS_PERMISSIONS[command].type) {
                    if (socket._acl[SocketCommands.COMMANDS_PERMISSIONS[command].type] &&
                        socket._acl[SocketCommands.COMMANDS_PERMISSIONS[command].type][SocketCommands.COMMANDS_PERMISSIONS[command].operation]) {
                        return true;
                    } else {
                        this.adapter.log.warn(`No permission for "${socket._acl.user}" to call ${command}. Need "${SocketCommands.COMMANDS_PERMISSIONS[command].type}"."${SocketCommands.COMMANDS_PERMISSIONS[command].operation}"`);
                    }
                } else {
                    return true;
                }
            } else {
                this.adapter.log.warn(`No rule for command: ${command}`);
            }

            if (typeof callback === 'function') {
                callback(SocketCommands.ERROR_PERMISSION);
            } else {
                if (SocketCommands.COMMANDS_PERMISSIONS[command]) {
                    socket.emit(SocketCommands.ERROR_PERMISSION, {
                        command,
                        type: SocketCommands.COMMANDS_PERMISSIONS[command].type,
                        operation: SocketCommands.COMMANDS_PERMISSIONS[command].operation,
                        arg
                    });
                } else {
                    socket.emit(SocketCommands.ERROR_PERMISSION, {command, arg});
                }
            }
            return false;
        } else {
            return true;
        }
    }

    publish(socket, type, id, obj) {
        if (socket && socket.subscribe && socket.subscribe[type] && this._updateSession(socket)) {
            return !!socket.subscribe[type].find(sub => {
                if (sub.regex.test(id)) {
                    // replace language
                    if (this.adapter._language && id === 'system.config' && obj.common) {
                        obj.common.language = this.adapter._language;
                    }
                    socket.emit(type, id, obj);
                    return true;
                }
            });
        }

        return false;
    }

    publishFile(socket, id, fileName, size) {
        if (socket && socket.subscribe && socket.subscribe.fileChange && this._updateSession(socket)) {
            const key = `${id}####${fileName}`;
            return !!socket.subscribe.fileChange.find(sub => {
                if (sub.regex.test(key)) {
                    socket.emit('fileChange', id, fileName, size);
                    return true;
                }
            });
        }

        return false;
    }

    _showSubscribes(socket, type) {
        if (socket && socket.subscribe) {
            const s = socket.subscribe[type] || [];
            const ids = [];
            for (let i = 0; i < s.length; i++) {
                ids.push(s[i].pattern);
            }
            this.adapter.log.debug(`Subscribes: ${ids.join(', ')}`);
        } else {
            this.adapter.log.debug('Subscribes: no subscribes');
        }
    }

    isLogEnabled() {
        return this.logEnabled;
    }

    subscribe(socket, type, pattern, patternFile) {
        if (!pattern) {
            return this.adapter.log.warn('Empty pattern on subscribe!');
        }

        this.subscribes[type] = this.subscribes[type] || {};

        let p;
        let key;
        pattern = pattern.toString();
        if (patternFile && type === 'fileChange') {
            patternFile = patternFile.toString();
            key = `${pattern}####${patternFile}`;
        } else {
            key = pattern;
        }

        p = pattern2RegEx(key);
        if (p === null) {
            return this.adapter.log.warn('Empty pattern on subscribe!');
        }

        let s;
        if (socket) {
            socket.subscribe = socket.subscribe || {};
            s = socket.subscribe[type] = socket.subscribe[type] || [];

            if (s.find(item => item.pattern === key)) {
                return;
            }
            s.push({pattern: key, regex: new RegExp(p)});
        }

        const options = socket && socket._acl ? {user: socket._acl.user} : undefined;

        if (this.subscribes[type][key] === undefined) {
            this.subscribes[type][key] = 1;
            if (type === 'stateChange') {
                this.adapter.subscribeForeignStates(pattern, options);
            } else if (type === 'objectChange') {
                this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern, options);
            } else if (type === 'log') {
                if (!this.logEnabled && this.adapter.requireLog) {
                    this.logEnabled = true;
                    this.adapter.requireLog(true, options);
                }
            } else if (type === 'fileChange') {
                this.adapter.subscribeForeignFiles && this.adapter.subscribeForeignFiles(pattern, patternFile, options);
            }
        } else {
            this.subscribes[type][key]++;
        }
    };

    unsubscribe(socket, type, pattern, patternFile) {
        if (!pattern) {
            return this.adapter.log.warn('Empty pattern on subscribe!');
        }
        // console.log((socket._name || socket.id) + ' unsubscribe ' + pattern);
        if (!this.subscribes[type]) {
            return;
        }

        let key;
        pattern = pattern.toString();
        if (patternFile && type === 'fileChange') {
            patternFile = patternFile.toString();
            key = `${pattern}####${patternFile}`;
        } else {
            key = pattern;
        }

        const options = socket && socket._acl ? {user: socket._acl.user} : undefined;

        if (socket && typeof socket === 'object') {
            if (!socket.subscribe || !socket.subscribe[type]) {
                return;
            }

            for (let i = socket.subscribe[type].length - 1; i >= 0; i--) {
                if (socket.subscribe[type][i].pattern === key) {
                    // Remove pattern from global list
                    if (this.subscribes[type][key] !== undefined) {
                        this.subscribes[type][key]--;
                        if (this.subscribes[type][key] <= 0) {
                            if (type === 'stateChange') {
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                                this.adapter.unsubscribeForeignStates(pattern, options);
                            } else if (type === 'objectChange') {
                                //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                                this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern, options);
                            } else if (type === 'log') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
                                if (this.logEnabled && this.adapter.requireLog) {
                                    this.logEnabled = false;
                                    this.adapter.requireLog(false, options);
                                }
                            } else if (type === 'fileChange') {
                                //console.log((socket._name || socket.id) + ' requireLog false');
                                this.adapter.unsubscribeForeignFiles && this.adapter.unsubscribeForeignFiles(pattern, patternFile, options);
                            }
                            delete this.subscribes[type][pattern];
                        }
                    }

                    delete socket.subscribe[type][i];
                    socket.subscribe[type].splice(i, 1);
                    return;
                }
            }
        } else if (key) {
            // Remove pattern from global list
            if (this.subscribes[type][key] !== undefined) {
                this.subscribes[type][key]--;
                if (this.subscribes[type][key] <= 0) {
                    if (type === 'stateChange') {
                        this.adapter.unsubscribeForeignStates(pattern, options);
                    } else if (type === 'objectChange') {
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern, options);
                    } else if (type === 'log') {
                        if (this.adapter.requireLog && this.logEnabled) {
                            this.logEnabled = false;
                            this.adapter.requireLog(false, options);
                        }
                    } else if (type === 'fileChange') {
                        this.adapter.unsubscribeForeignFiles && this.adapter.unsubscribeForeignFiles(pattern, patternFile, options);
                    }
                    delete this.subscribes[type][key];
                }
            }
        } else {
            Object.keys(this.subscribes[type]).forEach(pattern => {
                if (type === 'stateChange') {
                    //console.log((socket._name || socket.id) + ' unsubscribeForeignStates ' + pattern);
                    this.adapter.unsubscribeForeignStates(pattern, options);
                } else if (type === 'objectChange') {
                    //console.log((socket._name || socket.id) + ' unsubscribeForeignObjects ' + pattern);
                    this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern, options);
                } else if (type === 'log') {
                    //console.log((socket._name || socket.id) + ' requireLog false');
                    if (this.adapter.requireLog && this.logEnabled) {
                        this.logEnabled = false;
                        this.adapter.requireLog(false, options);
                    }
                } else if (type === 'fileChange') {
                    const [id, fileName] = pattern.split('####');
                    this.adapter.unsubscribeForeignFiles && this.adapter.unsubscribeForeignFiles(id, fileName, options);
                }
            });

            this.subscribes[type] = {}
        }
    };

    subscribeSocket(socket, type) {
        if (!socket || !socket.subscribe) {
            return;
        }

        if (!type) {
            // all
            return Object.keys(socket.subscribe)
                .forEach(type => this.subscribeSocket(socket, type));
        }

        if (!socket.subscribe[type]) {
            return;
        }

        const options = socket && socket._acl ? {user: socket._acl.user} : undefined;

        for (let i = 0; i < socket.subscribe[type].length; i++) {
            const pattern = socket.subscribe[type][i].pattern;
            if (this.subscribes[type][pattern] === undefined) {
                this.subscribes[type][pattern] = 1;
                if (type === 'stateChange') {
                    this.adapter.subscribeForeignStates(pattern, options);
                } else if (type === 'objectChange') {
                    this.adapter.subscribeForeignObjects && this.adapter.subscribeForeignObjects(pattern, options);
                } else if (type === 'log') {
                    if (this.adapter.requireLog && !this.logEnabled) {
                        this.logEnabled = true;
                        this.adapter.requireLog(true, options);
                    }
                } else if (type === 'fileChange') {
                    const [id, fileName] = pattern.split('####');
                    this.adapter.subscribeForeignFiles && this.adapter.subscribeForeignFiles(id, fileName, options);
                }
            } else {
                this.subscribes[type][pattern]++;
            }
        }
    }

    unsubscribeSocket(socket, type) {
        if (!socket || !socket.subscribe) {
            return;
        }

        if (!type) {
            // all
            return Object.keys(socket.subscribe)
                .forEach(type => this.unsubscribeSocket(socket, type));
        }

        if (!socket.subscribe[type]) {
            return;
        }

        const options = socket && socket._acl ? {user: socket._acl.user} : undefined;

        for (let i = 0; i < socket.subscribe[type].length; i++) {
            const pattern = socket.subscribe[type][i].pattern;
            if (this.subscribes[type][pattern] !== undefined) {
                this.subscribes[type][pattern]--;
                if (this.subscribes[type][pattern] <= 0) {
                    if (type === 'stateChange') {
                        this.adapter.unsubscribeForeignStates(pattern, options);
                    } else if (type === 'objectChange') {
                        this.adapter.unsubscribeForeignObjects && this.adapter.unsubscribeForeignObjects(pattern, options);
                    } else if (type === 'log') {
                        if (this.adapter.requireLog && !this.logEnabled) {
                            this.logEnabled = true;
                            this.adapter.requireLog(true, options);
                        }
                    } else if (type === 'fileChange') {
                        const [id, fileName] = pattern.split('####');
                        this.adapter.unsubscribeForeignFiles && this.adapter.unsubscribeForeignFiles(id, fileName, options);
                    }
                    delete this.subscribes[type][pattern];
                }
            }
        }
    }

    _subscribeStates(socket, pattern, callback) {
        if (this._checkPermissions(socket, 'subscribe', callback, pattern)) {
            if (Array.isArray(pattern)) {
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

    _unsubscribeStates(socket, pattern, callback) {
        if (this._checkPermissions(socket, 'unsubscribe', callback, pattern)) {
            if (pattern && typeof pattern === 'object' && pattern instanceof Array) {
                for (let p = 0; p < pattern.length; p++) {
                    this.unsubscribe(socket, 'stateChange', pattern[p]);
                }
            } else {
                this.unsubscribe(socket, 'stateChange', pattern);
            }

            this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'stateChange');

            typeof callback === 'function' && setImmediate(callback, null);
        }
    }

    _subscribeFiles(socket, id, pattern, callback) {
        if (this._checkPermissions(socket, 'subscribeFiles', callback, pattern)) {
            if (Array.isArray(pattern)) {
                for (let p = 0; p < pattern.length; p++) {
                    this.subscribe(socket, 'fileChange', id, pattern[p]);
                }
            } else {
                this.subscribe(socket, 'fileChange', id, pattern);
            }

            this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'fileChange');

            typeof callback === 'function' && setImmediate(callback, null);
        }
    }

    _unsubscribeFiles(socket, id, pattern, callback) {
        if (this._checkPermissions(socket, 'unsubscribeFiles', callback, pattern)) {
            if (Array.isArray(pattern)) {
                for (let p = 0; p < pattern.length; p++) {
                    this.unsubscribe(socket, 'fileChange', id, pattern[p]);
                }
            } else {
                this.unsubscribe(socket, 'fileChange', id, pattern);
            }

            this.adapter.log.level === 'debug' && this._showSubscribes(socket, 'fileChange');

            typeof callback === 'function' && setImmediate(callback, null);
        }
    }

    addCommandHandler(command, handler) {
        if (handler) {
            this.commands[command] = handler;
        } else if (this.commands.hasOwnProperty(command)) {
            delete this.commands[command];
        }
    }

    getCommandHandler(command) {
        return this.commands[command];
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

    __initCommandsCommon() {
        this.commands['authenticate'] = (socket, user, pass, callback) => {
            // Authenticate user by login and password
            // @param {string} user - user name
            // @param {string} pass - password
            // @param {function} callback - `function (isUserAuthenticated, isAuthenticationUsed)`
            if (socket && socket.___socket) {
                socket = socket.___socket;
            }

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
        };

        this.commands['error'] = (socket, error) => {
            // Write error into ioBroker log
            // @param {string} error - error text
            this.adapter.log.error(`Socket error: ${error}`);
        };

        this.commands['log'] = (socket, text, level) => {
            // Write log entry into ioBroker log
            // @param {string} text - log text
            // @param {string} level - one of `['silly', 'debug', 'info', 'warn', 'error']`. Default is 'debug'.
            if (level === 'error') {
                this.adapter.log.error(text);
            } else if (level === 'warn') {
                this.adapter.log.warn(text);
            } else if (level === 'info') {
                this.adapter.log.info(text);
            } else {
                this.adapter.log.debug(text);
            }
        };

        // new History
        this.commands['getHistory'] = (socket, id, options, callback) => {
            // Get history data from specific instance
            // @param {string} id - object ID
            // @param {object} options - See object description here: https://github.com/ioBroker/ioBroker.history/blob/master/docs/en/README.md#access-values-from-javascript-adapter
            // @param {function} callback - `function (error, result)`
            if (this._checkPermissions(socket, 'getStateHistory', callback, id)) {
                if (typeof options === 'string') {
                    options = {
                        instance: options
                    };
                }
                options = options || {};
                options.user = socket._acl.user;
                options.aggregate = options.aggregate || 'none';
                try {
                    this.adapter.getHistory(id, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[getHistory] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        // HTTP
        this.commands['httpGet'] = (socket, url, callback) => {
            // Read content of HTTP(S) page server-side (without CORS and stuff)
            // @param {string} url - Page URL
            // @param {function} callback - `function (error, {status, statusText}, body)`
            if (this._checkPermissions(socket, 'httpGet', callback, url)) {
                axios = axios || require('axios');
                this.adapter.log.debug(`httpGet: ${url}`);
                try {
                    axios(url, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        validateStatus: status => status < 400
                    })
                        .then(result => callback(null, {status: result.status, statusText: result.statusText}, result.data))
                        .catch(error => callback(error));
                } catch (error) {
                    callback(error);
                }
            }
        };

        // commands
        this.commands['sendTo'] = (socket, adapterInstance, command, message, callback) => {
            // Send message to specific instance
            // @param {string} adapterInstance - instance name, e.g. `history.0`
            // @param {string} command - command name
            // @param {object} message - message is instance dependent
            // @param {function} callback - `function (result)`
            if (this._checkPermissions(socket, 'sendTo', callback, command)) {
                try {
                    this.adapter.sendTo(adapterInstance, command, message, res =>
                        typeof callback === 'function' && setImmediate(() =>
                            callback(res)));
                } catch (error) {
                    typeof callback === 'function' && setImmediate(() => callback({error}));
                }
            }
        };

        // following commands are protected and require the extra permissions
        const protectedCommands = ['cmdExec', 'getLocationOnDisk', 'getDiagData', 'getDevList', 'delLogs', 'writeDirAsZip', 'writeObjectsAsZip', 'readObjectsAsZip', 'checkLogging', 'updateMultihost', 'rebuildAdapter'];

        this.commands['sendToHost'] = (socket, host, command, message, callback) => {
            // Send message to specific host.
            // Host can answer following commands: `cmdExec, getRepository, getInstalled, getInstalledAdapter, getVersion, getDiagData, getLocationOnDisk, getDevList, getLogs, getHostInfo, delLogs, readDirAsZip, writeDirAsZip, readObjectsAsZip, writeObjectsAsZip, checkLogging, updateMultihost`.
            // @param {string} host - instance name, e.g. `history.0`
            // @param {string} command - command name
            // @param {object} message - message is command specific
            // @param {function} callback - `function (result)`
            if (this._checkPermissions(socket, protectedCommands.includes(command) ? 'cmdExec' : 'sendToHost', callback, command)) {
                // Try to decode this file locally as redis has a limitation for files bigger than 20MB
                if (command === 'writeDirAsZip' && message && message.data.length > 1024 * 1024) {
                    let buffer;
                    try {
                        buffer = Buffer.from(message.data, 'base64');
                    } catch (error) {
                        this.adapter.log.error(`Cannot convert data: ${error.toString()}`);
                        return callback && callback({error: `Cannot convert data: ${error.toString()}`});
                    }

                    zipFiles = zipFiles || utils.commonTools.zipFiles;

                    zipFiles
                        .writeDirAsZip(
                            this.adapter, // normally we have to pass here the internal "objects" object, but as
                            // only writeFile is used, and it has the same name we can pass here the
                            // adapter, which has the function with the same name and arguments
                            message.id,
                            message.name,
                            buffer,
                            message.options,
                            error => callback({ error }) // this is for back compatibility with js-controller@4.0 or older
                        )
                        .then(() => callback({}))
                        .catch(error => {
                            this.adapter.log.error(`Cannot write zip file as folder: ${error.toString()}`);
                            callback && callback({ error });
                        });
                } else if (this._sendToHost) {
                    this._sendToHost(host, command, message, callback);
                } else {
                    try {
                        this.adapter.sendToHost(host, command, message, callback);
                    } catch (error) {
                        return callback && callback({ error });
                    }
                }
            }
        };

        this.commands['authEnabled'] = (socket, callback) => {
            // Ask server is authentication enabled and if the user authenticated
            // @param {function} callback - `function (isAuthenticationUsed, userName)`
            if (this._checkPermissions(socket, 'authEnabled', callback)) {
                if (typeof callback === 'function') {
                    callback(this.adapter.config.auth, (socket._acl.user || '').replace(/^system\.user\./, ''));
                } else {
                    this.adapter.log.warn('[authEnabled] Invalid callback');
                }
            }
        };

        this.commands['logout'] = (socket, callback) => {
            // Logout user
            // @param {function} callback - function (error)
            this.adapter.destroySession(socket._sessionID, callback);
        };

        this.commands['listPermissions'] = (socket, callback) => {
            // List commands and permissions
            // @param {function} callback - `function (permissions)`
            if (typeof callback === 'function') {
                callback(SocketCommands.COMMANDS_PERMISSIONS);
            } else {
                this.adapter.log.warn('[listPermissions] Invalid callback');
            }
        };

        this.commands['getUserPermissions'] = (socket, callback) => {
            // Get user permissions
            // @param {function} callback - `function (error, permissions)`
            if (this._checkPermissions(socket, 'getUserPermissions', callback)) {
                if (typeof callback === 'function') {
                    callback(null, socket._acl);
                } else {
                    this.adapter.log.warn('[getUserPermissions] Invalid callback');
                }
            }
        };

        this.commands['getVersion'] = (socket, callback) => {
            // Get adapter version. Not the socket-classes version!
            // @param {function} callback - `function (error, adapterVersion, adapterName)`
            if (this._checkPermissions(socket, 'getVersion', callback)) {
                if (typeof callback === 'function') {
                    callback(null, this.adapter.version, this.adapter.name);
                } else {
                    this.adapter.log.warn('[getVersion] Invalid callback');
                }
            }
        };

        this.commands['getAdapterName'] = (socket, callback) => {
            // Get adapter name. Not the socket-classes version!
            // @param {function} callback - `function (error, adapterVersion)`
            if (this._checkPermissions(socket, 'getAdapterName', callback)) {
                if (typeof callback === 'function') {
                    callback(null, this.adapter.name || 'unknown');
                } else {
                    this.adapter.log.warn('[getAdapterName] Invalid callback');
                }
            }
        };
    }

    __initCommandsFiles() {
        // file operations
        this.commands['readFile'] = (socket, _adapter, fileName, callback) => {
            // Read file from ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {function} callback - `function (error, data, mimeType)`
            if (this._checkPermissions(socket, 'readFile', callback, fileName)) {
                try {
                    this.adapter.readFile(_adapter, fileName, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[readFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['readFile64'] = (socket, _adapter, fileName, callback) => {
            // Read file from ioBroker DB as base64 string
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {function} callback - `function (error, base64, mimeType)`
            if (this._checkPermissions(socket, 'readFile64', callback, fileName)) {
                try {
                    this.adapter.readFile(_adapter, fileName, {user: socket._acl.user}, (error, buffer, type) => {
                        let data64;
                        if (buffer) {
                            try {
                                if (type === 'application/json' || type === 'application/json5' || fileName.toLowerCase().endsWith('.json5')) {
                                    data64 = Buffer.from(encodeURIComponent(buffer)).toString('base64');
                                } else {
                                    if (typeof buffer === 'string') {
                                        data64 = Buffer.from(buffer).toString('base64');
                                    } else {
                                        data64 = buffer.toString('base64');
                                    }
                                }
                            } catch (error) {
                                this.adapter.log.error(`[readFile64] Cannot convert data: ${error.toString()}`);
                            }
                        }

                        //Convert buffer to base 64
                        if (typeof callback === 'function') {
                            callback(error, data64 || '', type);
                        } else {
                            this.adapter.log.warn('[readFile64] Invalid callback');
                        }
                    });
                } catch (error) {
                    this.adapter.log.error(`[readFile64] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['writeFile64'] = (socket, _adapter, fileName, data64, options, callback) => {
            // Write file into ioBroker DB as base64 string
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {string} data64 - file content as base64 string
            // @param {object} options - optional `{mode: 0x0644}`
            // @param {function} callback - `function (error)`
            if (typeof options === 'function') {
                callback = options;
                options = {user: socket._acl.user};
            }

            options = options || {};
            options.user = socket._acl.user;

            if (this._checkPermissions(socket, 'writeFile64', callback, fileName)) {
                if (!data64) {
                    return SocketCommands._fixCallback(callback, 'No data provided');
                }
                // Convert base 64 to buffer

                try {
                    const buffer = Buffer.from(data64, 'base64');
                    this.adapter.writeFile(_adapter, fileName, buffer, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[writeFile64] Cannot convert data: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, `Cannot convert data: ${error.toString()}`);
                }
            }
        };

        // this function is overloaded in admin (because admin accepts only base64)
        this.commands['writeFile'] = (socket, _adapter, fileName, data, options, callback) => {
            // Write file into ioBroker DB as text **DEPRECATED**
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {string} data64 - file content as base64 string
            // @param {object} options - optional `{mode: 0x644}`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'writeFile', callback, fileName)) {
                if (typeof options === 'function') {
                    callback = options;
                    options = {user: socket._acl.user};
                }
                options = options || {};
                options.user = socket._acl.user;
                this.adapter.log.debug('writeFile deprecated. Please use writeFile64');
                // const buffer = Buffer.from(data64, 'base64');
                try {
                    this.adapter.writeFile(_adapter, fileName, data, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[writeFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['unlink'] = (socket, _adapter, name, callback) => {
            // Delete file in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} name - file name, e.g `main/vis-views.json`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'unlink', callback, name)) {
                try {
                    this._unlink(_adapter, name, {user: socket._acl.user})
                        .then(() => SocketCommands._fixCallback(callback))
                        .catch(error => SocketCommands._fixCallback(callback, error));
                } catch (error) {
                    this.adapter.log.error(`[unlink] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['deleteFile'] = (socket, _adapter, name, callback) => {
            // Delete file in ioBroker DB (same as unlink, but only for files)
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} name - file name, e.g `main/vis-views.json`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'unlink', callback, name)) {
                try {
                    this.adapter.unlink(_adapter, name, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[deleteFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['deleteFolder'] = (socket, _adapter, name, callback) => {
            // Delete file in ioBroker DB (same as unlink, but only for folders)
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} name - folder name, e.g `main`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'unlink', callback, name)) {
                try {
                    this._unlink(_adapter, name, {user: socket._acl.user})
                        .then(() => SocketCommands._fixCallback(callback, null))
                        .catch(error => SocketCommands._fixCallback(callback, error));
                } catch (error) {
                    this.adapter.log.error(`[deleteFolder] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['renameFile'] = (socket, _adapter, oldName, newName, callback) => {
            // Rename file in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} oldName - current file name, e.g `main/vis-views.json`
            // @param {string} newName - new file name, e.g `main/vis-views-new.json`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'rename', callback, oldName)) {
                try {
                    this.adapter.rename(_adapter, oldName, newName, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[renameFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['rename'] = (socket, _adapter, oldName, newName, callback) => {
            // Rename file or folder in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} oldName - current file name, e.g `main/vis-views.json`
            // @param {string} newName - new file name, e.g `main/vis-views-new.json`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'rename', callback, oldName)) {
                try {
                    this._rename(_adapter, oldName, newName, {user: socket._acl.user})
                        .then(() => SocketCommands._fixCallback(callback))
                        .catch(error => SocketCommands._fixCallback(callback, error));
                } catch (error) {
                    this.adapter.log.error(`[rename] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['mkdir'] = (socket, _adapter, dirName, callback) => {
            // Create folder in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} dirName - desired folder name, e.g `main`
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'mkdir', callback, dirName)) {
                try {
                    this.adapter.mkdir(_adapter, dirName, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[mkdir] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['readDir'] = (socket, _adapter, dirName, options, callback) => {
            // Read content of folder in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} dirName - folder name, e.g `main`
            // @param {object} options - optional `{filter: '*'}` or `{filter: '*.json'}`
            // @param {function} callback - `function (error, files)` where `files` is an array of objects, like `{file: 'vis-views.json', isDir: false, stats: {size: 123}, modifiedAt: 1661336290090, acl: {owner: 'system.user.admin', ownerGroup: 'system.group.administrator', permissions: 1632, read: true, write: true}`
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            options = options || {};
            options.user = socket._acl.user;

            if (options.filter === undefined) {
                options.filter = true;
            }

            if (this._checkPermissions(socket, 'readDir', callback, dirName)) {
                try {
                    this.adapter.readDir(_adapter, dirName, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[readDir] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['chmodFile'] = (socket, _adapter, fileName, options, callback) => {
            // Change file mode in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {object} options - `{mode: 0x644}` or 0x644. First digit is user, second group, third others. Bit 1 is `execute`, bit 2 is `write`, bit 3 is `read`
            // @param {function} callback - `function (error)`
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            options = options || {};
            options.user = socket._acl.user;

            if (options.filter === undefined) {
                options.filter = true;
            }

            if (this._checkPermissions(socket, 'chmodFile', callback, fileName)) {
                try {
                    this.adapter.chmodFile(_adapter, fileName, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[chmodFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['chownFile'] = (socket, _adapter, fileName, options, callback) => {
            // Change file owner in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {object} options - `{owner: 'system.user.user', ownerGroup: ''system.group.administrator'}` or 'system.user.user'. If ownerGroup is not defined, it will be taken from owner.
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'chownFile', callback, fileName)) {
                options = options || {};
                options.user = socket._acl.user;
                try {
                    this.adapter.chownFile(_adapter, fileName, options, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[chownFile] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['fileExists'] = (socket, _adapter, fileName, callback) => {
            // Checks if the file or folder exists in ioBroker DB
            // @param {string} _adapter - instance name, e.g. `vis.0`
            // @param {string} fileName - file name, e.g `main/vis-views.json`
            // @param {function} callback - `function (error, isExist)`
            if (this._checkPermissions(socket, 'fileExists', callback, fileName)) {
                try {
                    this.adapter.fileExists(_adapter, fileName, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[fileExists] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['subscribeFiles'] = (socket, id, pattern, callback) => {
            // Subscribe on file changes in ioBroker DB
            // @param {string} id - instance name, e.g. `vis.0` or any object ID of type `meta`. `id` could have wildcards `*` too.
            // @param {string} pattern - file name pattern, e.g `main/*.json`
            // @param {function} callback - `function (error)`
            return this._subscribeFiles(socket, id, pattern, callback);
        }

        this.commands['unsubscribeFiles'] = (socket, id, pattern, callback) => {
            // Unsubscribe on file changes in ioBroker DB
            // @param {string} id - instance name, e.g. `vis.0` or any object ID of type `meta`. `id` could have wildcards `*` too.
            // @param {string} pattern - file name pattern, e.g `main/*.json`
            // @param {function} callback - `function (error)`

            return this._unsubscribeFiles(socket, id, pattern, callback);
        }

        this.commands['getAdapterInstances'] = (socket, adapterName, callback) => {
            // Read all instances of the given adapter, or all instances of all adapters if adapterName is not defined
            // @param {string} adapterName - optional adapter name, e.g `history`.
            // @param {function} callback - `function (error, instanceList)`, where instanceList is an array of instance objects, e.g. `{_id: 'system.adapter.history.0', common: {name: 'history', ...}, native: {...}}`
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObject', callback)) {
                    let _adapterName = adapterName !== undefined && adapterName !== null ? adapterName : this.adapterName || '';
                    if (_adapterName) {
                        _adapterName += '.';
                    }
                    try {
                        this.adapter.getObjectView('system', 'instance',
                            {startkey: `system.adapter.${_adapterName}`, endkey: `system.adapter.${_adapterName}\u9999`},
                            {user: socket._acl.user},
                            (error, doc) => {
                                if (error) {
                                    callback(error);
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

                    } catch (error) {
                        this.adapter.log.error(`[getAdapterInstances] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                }
            }
        };
    }

    __initCommandsStates() {
        this.commands['getStates'] = (socket, pattern, callback) => {
            // Read states by pattern
            // @param {string} pattern - optional pattern, like `system.adapter.*` or array of state IDs
            // @param {function} callback - `function (error, states)`, where `states` is an object like `{'system.adapter.history.0': {_id: 'system.adapter.history.0', common: {name: 'history', ...}, native: {...}, 'system.adapter.history.1': {...}}}`
            if (this._checkPermissions(socket, 'getStates', callback, pattern)) {
                if (typeof pattern === 'function') {
                    callback = pattern;
                    pattern = null;
                }
                if (typeof callback === 'function') {
                    try {
                        this.adapter.getForeignStates(pattern || '*', {user: socket._acl.user}, (error, ...args) =>
                            SocketCommands._fixCallback(callback, error, ...args));
                    } catch (error) {
                        this.adapter.log.error(`[getStates] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                } else {
                    this.adapter.log.warn('[getStates] Invalid callback')
                }
            }
        };

        this.commands['getForeignStates'] = (socket, pattern, callback) => {
            // Read all states (which might not belong to this adapter) which match the given pattern
            // @param {string} pattern - pattern like
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'getStates', callback)) {
                if (typeof callback === 'function') {
                    try {
                        this.adapter.getForeignStates(pattern, {user: socket._acl.user}, (error, ...args) =>
                            SocketCommands._fixCallback(callback, error, ...args));
                    } catch (error) {
                        this.adapter.log.error(`[getForeignStates] ERROR: ${error}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                } else {
                    this.adapter.log.warn('[getForeignStates] Invalid callback')
                }
            }
        };

        this.commands['getState'] = (socket, id, callback) => {
            // Read one state.
            // @param {string} id - State ID like, 'system.adapter.admin.0.memRss'
            // @param {function} callback - `function (error, state)`, where `state` is an object like `{val: 123, ts: 1663915537418, ack: true, from: 'system.adapter.admin.0', q: 0, lc: 1663915537418, c: 'javascript.0'}`
            if (this._checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    if (this.states && this.states[id]) {
                        callback(null, this.states[id]);
                    } else {
                        try {
                            this.adapter.getForeignState(id, {user: socket._acl.user}, (error, ...args) =>
                                SocketCommands._fixCallback(callback, error, ...args));
                        } catch (error) {
                            this.adapter.log.error(`[getState] ERROR: ${error.toString()}`);
                            SocketCommands._fixCallback(callback, error);
                        }
                    }
                } else {
                    this.adapter.log.warn('[getState] Invalid callback');
                }
            }
        };

        this.commands['setState'] = (socket, id, state, callback) => {
            // Write one state.
            // @param {string} id - State ID like, 'system.adapter.admin.0.memRss'
            // @param {any} state - value or object like `{val: 123, ack: true}`
            // @param {function} callback - `function (error, state)`, where `state` is an object like `{val: 123, ts: 1663915537418, ack: true, from: 'system.adapter.admin.0', q: 0, lc: 1663915537418, c: 'javascript.0'}`
            if (this._checkPermissions(socket, 'setState', callback, id)) {
                if (typeof state !== 'object') {
                    state = {val: state};
                }

                // clear cache
                if (this.states && this.states[id]) {
                    delete this.states[id];
                }

                try {
                    this.adapter.setForeignState(id, state, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[setState] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['getBinaryState'] = (socket, id, callback) => {
            // Read one binary state.
            // @param {string} id - State ID like, 'javascript.0.binary'
            // @param {function} callback - `function (error, base64)`
            if (this._checkPermissions(socket, 'getState', callback, id)) {
                if (typeof callback === 'function') {
                    try {
                        if (this.adapter.getForeignBinaryState) {
                            this.adapter.getForeignBinaryState(id, {user: socket._acl.user}, (error, data) => {
                                if (data) {
                                    try {
                                        data = Buffer.from(data).toString('base64');
                                    } catch (error) {
                                        this.adapter.log.error(`[getBinaryState] Cannot convert data: ${error.toString()}`);
                                    }
                                }
                                SocketCommands._fixCallback(callback, error, data);
                            });
                        } else {
                            this.adapter.getBinaryState(id, {user: socket._acl.user}, (error, data) => {
                                if (data) {
                                    try {
                                        data = Buffer.from(data).toString('base64');
                                    } catch (error) {
                                        this.adapter.log.error(`[getBinaryState] Cannot convert data: ${error.toString()}`);
                                    }
                                }
                                SocketCommands._fixCallback(callback, error, data);
                            });
                        }
                    } catch (error) {
                        this.adapter.log.error(`[getBinaryState] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                } else {
                    this.adapter.log.warn('[getBinaryState] Invalid callback')
                }
            }
        };

        this.commands['setBinaryState'] = (socket, id, base64, callback) => {
            // Write one binary state.
            // @param {string} id - State ID like, 'javascript.0.binary'
            // @param {string} base64 - State value as base64 string. Binary states has no acknowledge flag.
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'setState', callback, id)) {
                if (typeof callback === 'function') {
                    let data = null;
                    try {
                        data = Buffer.from(base64, 'base64')
                    } catch (error) {
                        this.adapter.log.warn(`[setBinaryState] Cannot convert base64 data: ${error.toString()}`);
                    }

                    try {
                        if (this.adapter.setForeignBinaryState) {
                            this.adapter.setForeignBinaryState(id, data, {user: socket._acl.user}, (error, ...args) =>
                                SocketCommands._fixCallback(callback, error, ...args));
                        } else {
                            this.adapter.setBinaryState(id, data, {user: socket._acl.user}, (error, ...args) =>
                                SocketCommands._fixCallback(callback, error, ...args));
                        }
                    } catch (error) {
                        this.adapter.log.error(`[setBinaryState] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                } else {
                    this.adapter.log.warn('[setBinaryState] Invalid callback');
                }
            }
        };

        this.commands['subscribe'] = (socket, pattern, callback) => {
            // Subscribe on state changes by pattern. The events will come as 'stateChange' events to the socket.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of states like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            return this._subscribeStates(socket, pattern, callback);
        };

        this.commands['subscribeStates'] = (socket, pattern, callback) => {
            // Subscribe on state changes by pattern. Same as `subscribe`. The events will come as 'stateChange' events to the socket.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of states like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            return this._subscribeStates(socket, pattern, callback);
        };

        this.commands['unsubscribe'] = (socket, pattern, callback) => {
            // Unsubscribe from state changes by pattern.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of states like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            return this._unsubscribeStates(socket, pattern, callback);
        };

        this.commands['unsubscribeStates'] = (socket, pattern, callback) => {
            // Unsubscribe from state changes by pattern. Same as `unsubscribe`.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of states like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            return this._unsubscribeStates(socket, pattern, callback);
        };
    }

    __initCommandsObjects() {
        this.commands['getObject'] = (socket, id, callback) => {
            // Get one object
            // @param {string} id - object ID.
            // @param {function} callback - `function (error, obj)`
            if (this._checkPermissions(socket, 'getObject', callback, id)) {
                try {
                    this.adapter.getForeignObject(id, {user: socket._acl.user}, (error, obj) => {
                        // overload language from current instance
                        if (this.adapter._language && id === 'system.config' && obj.common) {
                            obj.common.language = this.adapter._language;
                        }
                        SocketCommands._fixCallback(callback, error, obj);
                    });
                } catch (error) {
                    this.adapter.log.error(`[getObject] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        // not admin version of "all objects"
        // this function is overloaded in admin
        this.commands['getObjects'] = (socket, callback) => {
            // Get all objects that are relevant for web: all states and enums with rooms
            // @param {string} id - object ID.
            // @param {function} callback - `function (error, obj)`
            if (this._checkPermissions(socket, 'getObjects', callback)) {
                try {
                    if (typeof callback === 'function') {
                        this.adapter.getForeignObjects('*', 'state', 'rooms', {user: socket._acl.user}, async (error, objs) => {
                            try {
                                const channels = await this.adapter.getForeignObjectsAsync('*', 'channel', null, {user: socket._acl.user});
                                const devices = await this.adapter.getForeignObjectsAsync('*', 'device', null, {user: socket._acl.user});
                                const enums = await this.adapter.getForeignObjectsAsync('*', 'enum', null, {user: socket._acl.user});
                                const config = await this.adapter.getForeignObjectAsync('system.config', {user: socket._acl.user});
                                Object.assign(objs, channels, devices, enums);
                                objs['system.config'] = config;
                            } catch (e) {
                                this.adapter.log.error(`[getObjects] ERROR: ${e.toString()}`);
                            }
                            // overload language
                            if (this.adapter._language && objs['system.config'] && objs['system.config'].common) {
                                objs['system.config'].common.language = this.adapter._language;
                            }

                            SocketCommands._fixCallback(callback, error, objs);
                        });
                    } else {
                        this.adapter.log.warn('[getObjects] Invalid callback');
                    }
                } catch (error) {
                    this.adapter.log.error(`[getObjects] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        this.commands['subscribeObjects'] = (socket, pattern, callback) => {
            // Subscribe on object changes by pattern. The events will come as 'objectChange' events to the socket.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of IDs like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'subscribeObjects', callback, pattern)) {
                try {
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
                } catch (error) {
                    if (typeof callback === 'function') {
                        setImmediate(callback, error);
                    }
                }
            }
        };

        this.commands['unsubscribeObjects'] = (socket, pattern, callback) => {
            // Unsubscribe on object changes by pattern.
            // @param {string} pattern - pattern like 'system.adapter.*' or array of IDs like ['system.adapter.admin.0.memRss', 'system.adapter.admin.0.memHeapTotal']
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'unsubscribeObjects', callback, pattern)) {
                try {
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
                } catch (error) {
                    if (typeof callback === 'function') {
                        setImmediate(callback, error);
                    }
                }
            }
        };

        this.commands['getObjectView'] = (socket, design, search, params, callback) => {
            // Make a query to the object database.
            // @param {string} design - 'system' or other designs like `custom`, but it must exist object `_design/custom`. Too 99,9% use `system`.
            // @param {string} search - object type, like `state`, `instance`, `adapter`, `host`, ...
            // @param {string} params - parameters for the query in form `{startkey: 'system.adapter.', endkey: 'system.adapter.\u9999'}`
            // @param {function} callback - `function (error)`
            if (typeof callback === 'function') {
                if (this._checkPermissions(socket, 'getObjectView', callback, search)) {
                    try {
                        this.adapter.getObjectView(design, search, params, {user: socket._acl.user}, callback);
                    } catch (error) {
                        this.adapter.log.error(`[getObjectView] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                }
            } else {
                this.adapter.log.error('Callback is not a function');
            }
        };

        this.commands['setObject'] = (socket, id, obj, callback) => {
            // Set object.
            // @param {string} id - object ID
            // @param {object} obj - object itself
            // @param {function} callback - `function (error)`
            if (this._checkPermissions(socket, 'setObject', callback, id)) {
                try {
                    this.adapter.setForeignObject(id, obj, {user: socket._acl.user}, (error, ...args) =>
                        SocketCommands._fixCallback(callback, error, ...args));
                } catch (error) {
                    this.adapter.log.error(`[setObject] ERROR: ${error.toString()}`);
                    SocketCommands._fixCallback(callback, error);
                }
            }
        };

        // this function is overloaded in admin
        this.commands['delObject'] = (socket, id, options, callback) => {
            // Delete object. Only deletion of flot objects is allowed
            // @param {string} id - Object ID like, 'flot.0.myChart'
            // @param {string} options - ignored
            // @param {function} callback - `function (error)`
            if (id.startsWith('flot.') || id.startsWith('fullcalendar.')) {
                if (this._checkPermissions(socket, 'delObject', callback, id)) {
                    try {
                        this.adapter.delForeignObject(id, {user: socket._acl.user}, (error, ...args) =>
                            SocketCommands._fixCallback(callback, error, ...args));
                    } catch (error) {
                        this.adapter.log.error(`[delObject] ERROR: ${error.toString()}`);
                        SocketCommands._fixCallback(callback, error);
                    }
                }
            } else {
                SocketCommands._fixCallback(callback, SocketCommands.ERROR_PERMISSION);
            }
        };
    }

    _initCommands() {
        this.__initCommandsCommon();
        this.__initCommandsObjects();
        this.__initCommandsStates();
        this.__initCommandsFiles();
    }

    applyCommands(socket) {
        Object.keys(this.commands)
            .forEach(command => socket.on(command, (...args) => {
                if (this._updateSession(socket)) {
                    this.commands[command](socket, ...args);
                }
            }));
    }

    destroy() {
        // could be overloaded
    }
}

module.exports = SocketCommands;
