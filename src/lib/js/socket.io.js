/*!
 * ioBroker WebSockets
 * Copyright 2020-2022, bluefox <dogafox@gmail.com>
 * Released under the MIT License.
 * v 0.2.3 (2022_01_29)
 */
/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

const MESSAGE_TYPES = {
    MESSAGE: 0,
    PING: 1,
    PONG: 2,
    CALLBACK: 3
};

const DEBUG = true;

const ERRORS = {
    1000: 'CLOSE_NORMAL',	        // Successful operation / regular socket shutdown
    1001: 'CLOSE_GOING_AWAY',	    // Client is leaving (browser tab closing)
    1002: 'CLOSE_PROTOCOL_ERROR',	// Endpoint received a malformed frame
    1003: 'CLOSE_UNSUPPORTED',		// Endpoint received an unsupported frame (e.g. binary-only endpoint received text frame)
    1005: 'CLOSED_NO_STATUS',		// Expected close status, received none
    1006: 'CLOSE_ABNORMAL',		    // No close code frame has been received
    1007: 'Unsupported payload',	// Endpoint received inconsistent message (e.g. malformed UTF-8)
    1008: 'Policy violation',	    // Generic code used for situations other than 1003 and 1009
    1009: 'CLOSE_TOO_LARGE',	    // Endpoint won't process large frame
    1010: 'Mandatory extension',	// Client wanted an extension which server did not negotiate
    1011: 'Server error',	        // Internal server error while operating
    1012: 'Service restart',	    // Server/service is restarting
    1013: 'Try again later',	    // Temporary server condition forced blocking client's request
    1014: 'Bad gateway	Server',    // acting as gateway received an invalid response
    1015: 'TLS handshake fail' 		// Transport Layer Security handshake failure
};

// possible events: connect, disconnect, reconnect, error, connect_error
function SocketClient () {
    const handlers      = {};
    let wasConnected    = false;
    let connectTimer    = null;
    let connectingTimer = null;
    let connectionCount = 0;
    let callbacks       = [];
    this.pending        = []; // pending requests till connection established
    let id              = 0;
    let lastPong;
    let socket;
    let url;
    let options;
    let pingInterval;
    let sessionID;
    let authTimeout = null;

    this.log = {
        debug: text => DEBUG && console.log(`[${new Date().toISOString()}] ${text}`),
        warn:  text => console.warn(`[${new Date().toISOString()}] ${text}`),
        error: text => console.error(`[${new Date().toISOString()}] ${text}`)
    };

    this.connect = (_url, _options) => {
        this.log.debug('Try to connect');
        id = 0;
        connectTimer && clearInterval(connectTimer);
        connectTimer = null;

        // eslint-disable-next-line no-undef
        url = url || _url || window.location.href;
        options = options || JSON.parse(JSON.stringify(_options || {}));

        options.pongTimeout       = parseInt(options.pongTimeout,       10) || 60000; // Timeout for answer for ping (pong)
        options.pingInterval      = parseInt(options.pingInterval,      10) || 5000;  // Ping interval
        options.connectTimeout    = parseInt(options.connectTimeout,    10) || 3000;  // connection request timeout
        options.authTimeout       = parseInt(options.authTimeout,       10) || 3000;  // Authentication timeout
        options.connectInterval   = parseInt(options.connectInterval,   10) || 1000;  // Interval between connection attempts
        options.connectMaxAttempt = parseInt(options.connectMaxAttempt, 10) || 5;     // Every connection attempt the interval increasing at options.connectInterval till max this number

        sessionID = Date.now();
        try {
            if (url === '/') {
                // eslint-disable-next-line no-undef
                url = window.location.protocol + '//' + window.location.host  + '/';
            }

            let u = url.replace(/^http/, 'ws').split('?')[0] + '?sid=' + sessionID;
            if (options && options.name) {
                u += '&name=' + encodeURIComponent(options.name);
            }
            // "ws://www.example.com/socketserver"
            // eslint-disable-next-line no-undef
            socket = new WebSocket(u);
        } catch (error) {
            handlers.error && handlers.error.forEach(cb => cb.call(this, error));
            return this.close();
        }

        connectingTimer = setTimeout(() => {
            connectingTimer = null;
            this.log.warn('No READY flag received in 3 seconds. Re-init');
            this.close(); // re-init connection, because no ___ready___ received in 2000 ms
        }, options.connectTimeout);

        socket.onopen = ()/*event*/ => {
            lastPong = Date.now();
            connectionCount = 0;

            pingInterval = setInterval(() => {
                if (Date.now() - lastPong > options.pingInterval - 10) {
                    try {
                        socket.send(JSON.stringify([MESSAGE_TYPES.PING]));
                    } catch (e) {
                        this.log.warn('Cannot send ping. Close connection: ' + e);
                        this.close();
                        return this._garbageCollect();
                    }
                }
                if (Date.now() - lastPong > options.pongTimeout) {
                    this.close();
                }
                this._garbageCollect();
            }, options.pingInterval);
        };

        socket.onclose = event => {
            if (event.code === 3001) {
                this.log.warn('ws closed');
            } else {
                this.log.error('ws connection error: ' + ERRORS[event.code]);
            }
            this.close();
        };

        socket.onerror = error => {
            if (this.connected) {
                if (socket.readyState === 1) {
                    this.log.error('ws normal error: ' + error.type);
                }
                handlers.error && handlers.error.forEach(cb => cb.call(this, ERRORS[error.code] || 'UNKNOWN'));
            }
            this.close();
        };

        socket.onmessage = message => {
            lastPong = Date.now();
            if (!message || !message.data || typeof message.data !== 'string') {
                return console.error('Received invalid message: ' + JSON.stringify(message));
            }
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (e) {
                return console.error('Received invalid message: ' + JSON.stringify(message.data));
            }

            const [type, id, name, args] = data;

            if (authTimeout) {
                clearTimeout(authTimeout);
                authTimeout = null;
            }

            if (type === MESSAGE_TYPES.CALLBACK) {
                this.findAnswer(id, args);
            } else
            if (type === MESSAGE_TYPES.MESSAGE) {
                if (name === '___ready___') {
                    this.connected  = true;

                    if (wasConnected) {
                        handlers.reconnect && handlers.reconnect.forEach(cb => cb.call(this, true));
                    } else {
                        handlers.connect && handlers.connect.forEach(cb => cb.call(this, true));
                        wasConnected = true;
                    }

                    connectingTimer && clearTimeout(connectingTimer);
                    connectingTimer = null;

                    // resend all pending requests
                    if (this.pending.length) {
                        this.pending.forEach(([name, arg1, arg2, arg3, arg4, arg5]) =>
                            this.emit(name, arg1, arg2, arg3, arg4, arg5));

                        this.pending = [];
                    }

                } else if (args) {
                    handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], args[3], args[4]));
                } else {
                    handlers[name] && handlers[name].forEach(cb => cb.call(this));
                }
            } else if (type === MESSAGE_TYPES.PING) {
                if (socket) {
                    socket.send(JSON.stringify([MESSAGE_TYPES.PONG]));
                } else {
                    this.log.warn('Cannot do pong: connection closed');
                }
            } else if (type === MESSAGE_TYPES.PONG) {
                // lastPong saved
            } else {
                this.log.warn('Received unknown message type: ' + type);
            }
        };

        return this;
    };

    this._garbageCollect = () => {
        const now = Date.now();
        let empty = 0;
        if (!DEBUG) {
            for (let i = 0; i < callbacks.length; i++) {
                if (callbacks[i]) {
                    if (callbacks[i].ts > now) {
                        const cb = callbacks[i].cb;
                        setTimeout(cb, 0, 'timeout');
                        callbacks[i] = null;
                        empty++;
                    }
                } else {
                    empty++;
                }
            }
        }

        // remove nulls
        if (empty > callbacks.length / 2) {
            const newCallback = [];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i] && newCallback.push(callbacks[i]);
            }
            callbacks = newCallback;
        }
    };

    this.withCallback = (name, id, args, cb) => {
        if (name === 'authenticate') {
            authTimeout = setTimeout(() => {
                authTimeout = null;
                if (this.connected) {
                    this.log.debug('Authenticate timeout');
                    handlers.error && handlers.error.forEach(cb => cb.call(this, 'Authenticate timeout'));
                }
                this.close();
            }, options.authTimeout);
        }
        callbacks.push({id, cb, ts: DEBUG ? 0 : Date.now() + 30000});
        socket.send(JSON.stringify([MESSAGE_TYPES.CALLBACK, id, name, args]));
    };

    this.findAnswer = (id, args) => {
        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] && callbacks[i].id === id) {
                const cb = callbacks[i].cb;
                cb.apply(null, args);
                callbacks[i] = null;
            }
        }
    };

    this.emit = (name, arg1, arg2, arg3, arg4, arg5) => {
        if (!socket || !this.connected) {
            if (!wasConnected) {
                // cache all calls till connected
                this.pending.push([name, arg1, arg2, arg3, arg4, arg5]);
            } else {
                this.log.warn('Not connected');
            }
            return;
        }

        id++;

        if (name === 'writeFile' && typeof arg3 !== 'string') {
            // _adapter, filename, data, callback
            arg3 = arg3 && btoa(String.fromCharCode.apply(null, new Uint8Array(arg3)));
        }

        try {
            if (typeof arg5 === 'function') {
                this.withCallback(name, id, [arg1, arg2, arg3, arg4], arg5);
            } else if (typeof arg4 === 'function') {
                this.withCallback(name, id, [arg1, arg2, arg3], arg4);
            } else if (typeof arg3 === 'function') {
                this.withCallback(name, id, [arg1, arg2], arg3);
            } else if (typeof arg2 === 'function') {
                this.withCallback(name, id, [arg1], arg2);
            } else if (typeof arg1 === 'function') {
                this.withCallback(name, id, [], arg1);
            } else
            if (arg1 === undefined && arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name]));
            } else if (arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1]]));
            } else if (arg3 === undefined && arg4 === undefined && arg5 === undefined) {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2]]));
            } else if (arg4 === undefined && arg5 === undefined) {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3]]));
            } else if (arg5 === undefined) {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3, arg4]]));
            } else {
                socket.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3, arg4, arg5]]));
            }
        } catch (e) {
            console.error('Cannot send: ' + e);
            this.close();
        }
    };

    this.on = (name, cb) => {
        if (cb) {
            handlers[name] = handlers[name] || [];
            handlers[name].push(cb);
        }
    };

    this.off = (name, cb) => {
        if (handlers[name]) {
            const pos = handlers[name].indexOf(cb);
            if (pos !== -1) {
                handlers[name].splice(pos, 1);
                if (!handlers[name].length) {
                    delete handlers[name];
                }
            }
        }
    };

    this.close = function () {
        pingInterval && clearInterval(pingInterval);
        pingInterval = null;

        authTimeout && clearTimeout(authTimeout);
        authTimeout = null;

        connectingTimer && clearTimeout(connectingTimer);
        connectingTimer = null;

        if (socket) {
            try {
                socket.close();
            } catch (e) {
                // ignore
            }
            socket = null;
        }

        if (this.connected) {
            handlers.disconnect && handlers.disconnect.forEach(cb => cb.call(this));
            this.connected = false;
        }

        callbacks = [];

        this._reconnect();
    };

    this.destroy = function () {
        this.close();
        connectTimer && clearTimeout(connectTimer);
        connectTimer = null;
    };

    this._reconnect = function () {
        if (!connectTimer) {
            this.log.debug('Start reconnect ' + connectionCount);
            connectTimer = setTimeout(() => {
                connectTimer = null;
                if (connectionCount < options.connectMaxAttempt) {
                    connectionCount++;
                }
                this.connect(url, options);
            }, connectionCount * options.connectInterval);
        } else {
            this.log.debug('Reconnect is already running ' + connectionCount);
        }
    };

    this.connected = false; // simulate socket.io interface
}

// eslint-disable-next-line no-undef
window.io = new SocketClient();
