/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

var socketio = require('socket.io');
var request = require('request');

function IOSocket(server, settings, adapter, objects, states, store) {
    if (!(this instanceof IOSocket)) return new IOSocket(server, settings, adapter, objects, states, store);

    var userKey = 'connect.sid'; // const
    var cmdSessions = {};
    var that = this;
    this.server = null;
    var cookieParser;
    var passport;

    if (settings.auth) {
        cookieParser = require('cookie-parser');
        passport     = require('passport');
    }

    var passportSocketIo = require('passport.socketio');

    // do not send too many state updates
    var eventsThreshold = {
        count: 0,
        timeActivated: 0,
        active: false,
        accidents: 0,
        repeatSeconds: 3,   // how many seconds continuously must be number of events > value
        value: parseInt(settings.thresholdValue, 10) || 200, // how many events allowed in one check interval
        checkInterval: 1000 // duration of one check interval
    };

    // static information
    var commandsPermissions = {
        getObject:      {type: 'object', operation: 'read'},
        getObjects:     {type: 'object', operation: 'list'},
        getObjectView:  {type: 'object', operation: 'list'},
        setObject:      {type: 'object', operation: 'write'},
        delObject:      {type: 'object', operation: 'delete'},
        extendObject:   {type: 'object', operation: 'write'},
        getHostByIp:    {type: 'object', operation: 'list'},

        getStates:      {type: 'state', operation: 'list'},
        getState:       {type: 'state', operation: 'read'},
        setState:       {type: 'state', operation: 'write'},
        delState:       {type: 'state', operation: 'delete'},
        getStateHistory: {type: 'state', operation: 'read'},
        createState:    {type: 'state', operation: 'create'},

        addUser:        {type: 'users', operation: 'create'},
        delUser:        {type: 'users', operation: 'delete'},
        addGroup:       {type: 'users', operation: 'create'},
        delGroup:       {type: 'users', operation: 'delete'},
        changePassword: {type: 'users', operation: 'write'},

        httpGet:        {type: 'other', operation: 'http'},
        cmdExec:        {type: 'other', operation: 'execute'},
        sendTo:         {type: 'other', operation: 'sendto'},
        sendToHost:     {type: 'other', operation: 'sendto'},

        readDir:        {type: 'file', operation: 'list'},
        createFile:     {type: 'file', operation: 'create'},
        writeFile:      {type: 'file', operation: 'write'},
        readFile:       {type: 'file', operation: 'read'},
        deleteFile:     {type: 'file', operation: 'delete'},

        authEnabled:    {type: '', operation: ''},
        disconnect:     {type: '', operation: ''},
        listPermissions: {type: '', operation: ''},
        getUserPermissions: {type: 'object', operation: 'read'}
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
                if (callback) {
                    callback('User does not exist');
                }
            } else {
                if (obj.common.dontDelete) {
                    if (callback) {
                        callback('Cannot delete user, while is system user');
                    }
                } else {
                    adapter.delForeignObject('system.user.' + user, options, function (err) {
                        // Remove this user from all groups in web client
                        if (callback) {
                            callback(err);
                        }
                    });
                }
            }
        });
    }

    function addGroup(group, desc, acl, options, callback) {
        var name = group;
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

        if (!group.match(/^[-.A-Za-züäößÖÄÜа-яА-Я@+$§0-9=?!&# ]+$/)) {
            if (typeof callback === 'function') {
                callback('Invalid characters in the group name. Only following special characters are allowed: -@+$§=?!&# and letters');
            }
            return;
        }

        adapter.getForeignObject('system.group.' + group, options, function (err, obj) {
            if (obj) {
                if (callback) {
                    callback('Group yet exists');
                }
            } else {
                adapter.setForeignObject('system.group.' + group, {
                    type: 'group',
                    common: {
                        name: name,
                        desc: desc,
                        members: [],
                        acl: acl
                    }
                }, options, function (err, obj) {
                    if (callback) {
                        callback(err, obj);
                    }
                });
            }
        });
    }

    function delGroup(group, options, callback) {
        adapter.getForeignObject('system.group.' + group, options, function (err, obj) {
            if (err || !obj) {
                if (callback) {
                    callback('Group does not exist');
                }
            } else {
                if (obj.common.dontDelete) {
                    if (callback) {
                        callback('Cannot delete group, while is system group');
                    }
                } else {
                    adapter.delForeignObject('system.group.' + group, options, function (err) {
                        // Remove this group from all users in web client
                        if (callback) {
                            callback(err);
                        }
                    });
                }
            }
        });
    }

    // update session ID, but not ofter than 60 seconds
    function updateSession(socket) {
        if (socket._sessionID) {
            var time = (new Date()).getTime();
            if (socket._lastActivity && time - socket._lastActivity > adapter.config.ttl * 1000) {
                socket.emit('reauthenticate');
                return false;
            }
            socket._lastActivity = time;
            if (!socket._sessionTimer) {
                socket._sessionTimer = setTimeout(function () {
                    socket._sessionTimer = null;
                    adapter.getSession(socket._sessionID, function (obj) {
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
            // operation: create, read, write, list, delete, sendto, execute, sendToHost
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

            if (callback) {
                callback('permissionError');
            } else {
                socket.emit('permissionError', {
                    command: command,
                    type: commandsPermissions[command].type,
                    operation: commandsPermissions[command].operation,
                    arg: arg
                });
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
                var result = {};
                for (var ob in objects) {
                    if (objects.hasOwnProperty(ob) && checkObject(ob, socket._acl, 4 /* 'read' */)) {
                        result[ob] = objects[ob];
                    }
                }
                callback(null, result);
            } else {
                callback(null, objects);
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

        // Enable logging, while some browser is connected
        if (adapter.requireLog) {
            adapter.requireLog(true);
        }

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
                        for (var i = 0; i < data.rows.length; i++) {
                            if (data.rows[i].value.common.hostname === ip) {
                                if (callback) {
                                    callback(ip, data.rows[i].value);
                                }
                                return;
                            }
                            if (data.rows[i].value.native.hardware && data.rows[i].value.native.hardware.networkInterfaces) {
                                var net = data.rows[i].value.native.hardware.networkInterfaces;
                                for (var eth in net) {
                                    if (!net.hasOwnProperty(eth)) continue;
                                    for (var j = 0; j < net[eth].length; j++) {
                                        if (net[eth][j].address === ip) {
                                            if (callback) {
                                                callback(ip, data.rows[i].value);
                                            }
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (callback) {
                        callback(ip, null);
                    }
                });
            }
        });

        /*
         *      states
         */
        socket.on('getStates', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getStates', callback)) {
                callback(null, states);
            }
        });

        socket.on('getState', function (id, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getState', callback, id)) {
                if (callback) {
                    callback(null, states[id]);
                }
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

        socket.on('sendTo', function (adapterInstance, command, message, callback) {
            if (updateSession(socket) && checkPermissions(socket, 'sendTo', callback, command)) {
                adapter.sendTo(adapterInstance, command, message, function (res) {
                    if (callback) {
                        setTimeout(function () {
                            callback(res);
                        }, 0);
                    }
                });
            }
        });

        // following commands are protected and require the extra permissions
        var protectedCommands = ['cmdExec', 'getLocationOnDisk', 'getDiagData', 'getDevList', 'delLogs', 'writeDirAsZip', 'writeObjectsAsZip', 'readObjectsAsZip', 'checkLogging', 'updateMultihost'];

        socket.on('sendToHost', function (host, command, message, callback) {
            // host can answer following commands: cmdExec, getRepository, getInstalled, getInstalledAdapter, getVersion, getDiagData, getLocationOnDisk, getDevList, getLogs, getHostInfo,
            // delLogs, readDirAsZip, writeDirAsZip, readObjectsAsZip, writeObjectsAsZip, checkLogging, updateMultihost
            if (updateSession(socket) && checkPermissions(socket, protectedCommands.indexOf(command) !== -1 ? 'cmdExec' : 'sendToHost', callback, command)) {
                adapter.sendToHost(host, command, message, function (res) {
                    if (callback) {
                        setTimeout(function () {
                            callback(res);
                        }, 0);
                    }
                });
            }
        });

        socket.on('authEnabled', function (callback) {
            if (callback) {
                callback(adapter.config.auth, socket._acl.user.replace(/^system\.user\./, ''));
            }
        });

        socket.on('disconnect', function () {
            // Disable logging if no one browser is connected
            if (adapter.requireLog) {
                adapter.requireLog(!!that.server.sockets.sockets.length);
            }
        });

        socket.on('listPermissions', function (callback) {
            if (updateSession(socket)) {
                if (callback) {
                    callback(commandsPermissions);
                }
            }
        });

        socket.on('getUserPermissions', function (callback) {
            if (updateSession(socket) && checkPermissions(socket, 'getUserPermissions', callback)) {
                if (callback) {
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
        var wait = false;
        try {
            if (socket.conn.request.sessionID) {
                wait = true;
                if (store) {
                    store.get(socket.conn.request.sessionID, function (err, obj) {
                        if (obj && obj.passport && obj.passport.user) {
                            if (callback) {
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
                        for (var id in res) {
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
        var clients = that.server.sockets.connected;

        for (var i in clients) {
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
        var clients = that.server.sockets.connected;

        if (!eventsThreshold.active) {
            eventsThreshold.count++;
        }
        for (var i in clients) {
            if (clients.hasOwnProperty(i)) {
                updateSession(clients[i]);
            }
        }
        that.server.sockets.emit('stateChange', id, state);
    };

    var __construct = (function () {
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
                that.server = socketio.listen(server, (settings.bind && settings.bind !== '0.0.0.0') ? settings.bind : undefined);
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
    })();

    return this;
}
module.exports = IOSocket;
