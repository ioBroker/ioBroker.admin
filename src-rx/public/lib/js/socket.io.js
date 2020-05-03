/*!
 * ioBroker WebSockets
 * Copyright 2020, bluefox <dogafox@gmail.com>
 * Released under the MIT License.
 * v 0.1.0
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
    1015: 'TLS handshake fail',		// Transport Layer Security handshake failure
};

// possible events: connect, disconnect, reconnect, error, connect_error
function SocketClient () {
    const handlers = {};
    let lastPong;
    let socket;
    let wasConnected = false;
    let connected = false;
    let connectTimer = null;
    let connectionCount = 0;
    let url;
    let options;
    let pingInterval;
    let callbacks = [];
    let id = 0;
    let sessionID;
    let authTimeout = null;

    this.connect = (_url, _options) => {
        id = 0;
        connectTimer && clearInterval(connectTimer);
        connectTimer = 0;
        url = _url || window.location.href;
        options = _options;
        sessionID = Date.now();
        try {
            if (url === '/') {
                url = window.location.protocol + '//' + window.location.host  + '/';
            }

            let u = url.replace(/^http/, 'ws').split('?')[0] + '?sid=' + sessionID;
            if (_options && _options.name) {
                u += '&name=' + encodeURIComponent(_options.name);
            }
            // "ws://www.example.com/socketserver"
            socket = new WebSocket(u);
        } catch (error) {
            handlers.error && handlers.error.forEach(cb => cb(error));
            this.close();
            return;
        }

        socket.onopen = event => {
            lastPong = Date.now();
            connectionCount = 0;
            if (wasConnected) {
                //this.emit('reconnect');
            }
            wasConnected = true;

            pingInterval = setInterval(() => {
                if (Date.now() - lastPong > 5000) {
                    socket.send(JSON.stringify([MESSAGE_TYPES.PING]));
                }
                if (Date.now() - lastPong > 15000) {
                    this.close();
                }
                this._garbageCollect();
            }, 5000);
        };

        socket.onclose = event => {
            if (event.code === 3001) {
                console.log('ws closed');
            } else {
                console.log('ws connection error: ' + ERRORS[event.code]);
            }
            this.close();
        };

        socket.onerror = error => {
            if (connected) {
                if (socket.readyState === 1) {
                    console.log('ws normal error: ' + error.type);
                }
                handlers.error && handlers.error.forEach(cb => cb(ERRORS[error.code] || 'UNKNOWN'));
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
                    connected  = true;
                    handlers.connect && handlers.connect.forEach(cb => cb());
                } else if (args) {
                    handlers[name] && handlers[name].forEach(cb => cb(args[0], args[1], args[2], args[3], args[4]));
                } else {
                    handlers[name] && handlers[name].forEach(cb => cb());
                }
            } else if (type === MESSAGE_TYPES.PING) {
                socket.send(JSON.stringify([MESSAGE_TYPES.PONG]));
            } else if (type === MESSAGE_TYPES.PONG) {
                // lastPong saved
            } else {
                console.log('Received unknown message type: ' + type)
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
                if (connected) {
                    DEBUG && console.log('Authenticate timeout');
                    handlers.error && handlers.error.forEach(cb => cb('Authenticate timeout'));
                }
                this.close();
            });
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
        if (!socket && !connected) {
            console.log('Not connected');
            return;
        }

        id++;

        if (name === 'writeFile') {
            // _adapter, filename, data, callback
            arg3 = arg3 && btoa(String.fromCharCode.apply(null, new Uint8Array(arg3)));
        }

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
        pingInterval && clearTimeout(pingInterval);
        pingInterval = null;

        if (socket) {
            try {
                socket.close();
            } catch (e) {

            }
            socket = null;
        }

        if (connected) {
            handlers.disconnect && handlers.disconnect.forEach(cb => cb());
            connected = false;
        }

        callbacks = [];

        this._reconnect();
    };

    this._reconnect = function () {
        if (!connectTimer) {
            connectTimer = setTimeout(() => {
                connectTimer = null;
                if (connectionCount < 5) {
                    connectionCount++;
                }
                this.connect(url, options);
            }, connectionCount * 1000);
        }
    }
}

window.io = new SocketClient();