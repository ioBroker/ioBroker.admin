/**
 *      Class Socket
 *
 *      Copyright 2014-2022 bluefox <dogafox@gmail.com>,
 *      MIT License
 *
 */
const SocketCommon = require('./socketCommon');
const SocketCommandsAdmin = require('./socketCommandsAdmin');
let passport; // require('passport') - only if auth is activated
let cookieParser; // require('cookie-parser') - only if auth is activated
let passportSocketIo; // require('./passportSocket') - only if auth is activated

class SocketAdmin extends SocketCommon {
    constructor(settings, adapter, objects) {
        super(settings, adapter);

        // user another set of commands for admin
        this.commands = new SocketCommandsAdmin(adapter, socket => this.__updateSession(socket), objects);
    }

    __getIsNoDisconnect() {
        // ws does not require disconnect
        return true;
    }

    _onAuthorizeSuccess = (data, accept) => {
        this.adapter.log.debug(`successful connection to socket.io from ${data.connection.remoteAddress}`);
        accept();
    }

    _onAuthorizeFail = (data, message, error, accept) => {
        setTimeout(() => data.socket.emit(SocketCommon.COMMAND_RE_AUTHENTICATE), 100);

        error && this.adapter.log.info(`failed connection to socket.io from ${data.connection.remoteAddress}: ${message}`);

        if (error) {
            accept(new Error(message));
        } else {
            accept(new Error(`failed connection to socket.io: ${message}`));//null, false);
        }
        // this error will be sent to the user as a special error-package
        // see: http://socket.io/docs/client-api/#socket > error-object
    }

    __initAuthentication(authOptions) {
        passportSocketIo = passportSocketIo || require('./passportSocket');
        passport = passport || require('passport');
        cookieParser = cookieParser || require('cookie-parser');

        this.store = authOptions.store;

        this.server.use(passportSocketIo.authorize({
            passport,
            cookieParser,
            key:     authOptions.userKey,         // the name of the cookie where express/connect stores its session_id
            secret:  authOptions.secret,          // the session_secret to parse the cookie
            store:   authOptions.store,           // we NEED to use a sessionstore. no memorystore please
            success: this._onAuthorizeSuccess,    // *optional* callback on success - read more below
            fail:    this._onAuthorizeFail        // *optional* callback on fail/error - read more below
        }));
    }

    // Extract username from socket
    __getUserFromSocket(socket, callback) {
        if (socket.conn.request.sessionID) {
            socket._secure = true;
            socket._sessionID = socket.conn.request.sessionID;
            // Get user for session
            return this.adapter.getSession(socket.conn.request.sessionID, obj => {
                if (!obj || !obj.passport) {
                    socket._acl.user = '';
                    socket.emit(SocketCommon.COMMAND_RE_AUTHENTICATE);
                    callback('Cannot detect user');
                } else {
                    callback(null, obj.passport.user ? `system.user.${obj.passport.user}` : '');
                }
            });
        }
        callback('Cannot detect user');
    }

    __getClientAddress(socket) {
        let address;
        if (socket.connection) {
            address = socket.connection && socket.connection.remoteAddress;
        } else {
            address = socket.ws._socket.remoteAddress;
        }

        if (!address && socket.handshake) {
            address = socket.handshake.address;
        }
        if (!address && socket.conn.request && socket.conn.request.connection) {
            address = socket.conn.request.connection.remoteAddress;
        }
        return address;
    }

    // update session ID, but not ofter than 60 seconds
    __updateSession(socket) {
        if (socket._sessionID) {
            const time = Date.now();
            if (socket._lastActivity && time - socket._lastActivity > this.settings.ttl * 1000) {
                this.adapter.log.warn('REAUTHENTICATE!');
                socket.emit(SocketCommon.COMMAND_RE_AUTHENTICATE);
                return false;
            }
            socket._lastActivity = time;
            socket._sessionTimer = socket._sessionTimer || setTimeout(() => {
                socket._sessionTimer = null;
                this.adapter.getSession(socket._sessionID, obj => {
                    if (obj) {
                        this.adapter.setSession(socket._sessionID, this.settings.ttl, obj);
                    } else {
                        this.adapter.log.warn('REAUTHENTICATE!');
                        socket.emit(SocketCommon.COMMAND_RE_AUTHENTICATE);
                    }
                });
            }, 60000);
        }

        return true;
    }

    __getSessionID(socket) {
        return this.settings.auth && socket.conn.request.sessionID;
    }

    start(server, socketClass, authOptions, socketOptions) {
        super.start(server, socketClass, authOptions, socketOptions);

        this.commands.start(thresholdEnabled => this.onThresholdChanged(thresholdEnabled));
    }

    onThresholdChanged(enabled) {
        this.server && this.server.sockets && this.server.sockets.emit('eventsThreshold', enabled);
    }

    stateChange(id, state) {
        this.commands.stateChange(id, state);

        this.server.sockets.connected.forEach(socket =>
            this.__updateSession(socket));

        this.server.sockets.emit('stateChange', id, state);
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
                this.__updateSession(clients[i]);
            }
        }

        this.server.sockets.emit('objectChange', id, obj);
    }

    subscribe(type, pattern) {
        this.commands.subscribe(null, type, pattern);
    }

    sendCommand(obj) {
        if (this.commands.sendCommand(obj) && this.server) {
            this.server.sockets.emit(obj.command, obj.message.id, obj.message.data);
        }
    }
}

module.exports = SocketAdmin;
