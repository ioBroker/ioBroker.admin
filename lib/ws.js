/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

const WebSocket     = require('ws');
const querystring   = require('querystring');

const MESSAGE_TYPES = {
    MESSAGE: 0,
    PING: 1,
    PONG: 2,
    CALLBACK: 3
};

const DEBUG = false;

function Socket(ws, sessionID, name) {
    this.ws = ws;
    const handlers = {};
    let lastPong = Date.now();
    let id = 0;

    this._name = name;

    // simulate interface of socket.io
    this.conn = {
        request: { sessionID }
    };

    this.id = sessionID;

    let pingInterval = setInterval(() => {
        if (Date.now() - lastPong > 5000) {
            ws.send(JSON.stringify([MESSAGE_TYPES.PING]));
        }
        if (Date.now() - lastPong > 15000) {
            this.close();
        }
    }, 5000);

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

    this.emit = (name, arg1, arg2, arg3, arg4, arg5) => {
        id++;
        if (arg1 === undefined && arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name]));
        } else if (arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1]]));
        } else if (arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2]]));
        } else if (arg4 === undefined && arg5 === undefined) {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3]]));
        } else if (arg5 === undefined) {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3, arg4]]));
        } else {
            this.ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, id, name, [arg1, arg2, arg3, arg4, arg5]]));
        }
    };

    this.responseWithCallback = (name, id, arg1, arg2, arg3, arg4, arg5) => {
        let args;

        // error cannot be converted normally, so try to use internal function for it
        if (arg1 && arg1 instanceof Error) {
            arg1 = arg1.toString();
        }

        if (arg1 === undefined && arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            return ws.send(JSON.stringify([MESSAGE_TYPES.CALLBACK, id, name]));
        } else if (arg2 === undefined && arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            args = [arg1];
        } else if (arg3 === undefined && arg4 === undefined && arg5 === undefined) {
            args = [arg1, arg2];
        } else if (arg4 === undefined && arg5 === undefined) {
            args = [arg1, arg2, arg3];
        } else if (arg5 === undefined) {
            args = [arg1, arg2, arg3, arg4];
        } else {
            args = [arg1, arg2, arg3, arg4, arg5];
        }

        ws.send(JSON.stringify([MESSAGE_TYPES.CALLBACK, id, name, args]));
    };

    this.withCallback = (name, id, args) => {
        if (!args || !args.length) {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        } else if (args.length === 1) {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        } else if (args.length === 2) {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        } else if (args.length === 3) {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        } else if (args.length === 4) {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], args[3], (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        } else {
            setImmediate(() =>
                handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], args[3], args[4], (arg1, arg2, arg3, arg4, arg5) =>
                    this.responseWithCallback(name, id, arg1, arg2, arg3, arg4, arg5))));
        }
    };

    ws.on('message', (data, isBinary) => {
        lastPong = Date.now();
        let message = isBinary ? data : data.toString();

        if (!message || typeof message !== 'string') {
            return console.error('Received invalid message: ' + JSON.stringify(message));
        }
        try {
            message = JSON.parse(message)
        } catch (e) {
            return console.error('Received invalid message: ' + JSON.stringify(message));
        }
        const [type, id, name, args] = message;

        if (type === MESSAGE_TYPES.CALLBACK) {
            DEBUG && console.log(name);
            handlers[name] && this.withCallback(name, id, args);
        } else
        if (type === MESSAGE_TYPES.MESSAGE) {
            DEBUG && console.log(name);
            handlers[name] && setImmediate(() => handlers[name] && handlers[name].forEach(cb => cb.call(this, args[0], args[1], args[2], args[3], args[4])));
        } else if (type === MESSAGE_TYPES.PING) {
            ws.send(JSON.stringify([MESSAGE_TYPES.PONG]));
        } else if (type === MESSAGE_TYPES.PONG) {
            // lastPong saved
        } else {
            console.log('Received unknown message type: ' + type)
        }
    });

    this.close = () => {
        pingInterval && clearInterval(pingInterval);
        pingInterval = null;

        handlers.disconnect && handlers.disconnect.forEach(cb => cb.apply(this));

        Object.keys(handlers).forEach(name => handlers[name] = undefined);

        try {
            ws.close();
        } catch (e) {

        }
    }
}

function SocketIO (server) {
    const handlers = {};
    const run = [];

    let socketsList = [];

    const wss = new WebSocket.Server({
        server,
        verifyClient: function (info, done) {
            if (run.length) {
                run.forEach(cb => cb(info.req, err => {
                    if (err) {
                        info.req._wsNotAuth = true;
                    }
                    done && done(true);
                    done = null;
                }));
            } else {
                done && done(true);
                done = null;
            }
        },
        perMessageDeflate: {
			zlibDeflateOptions: {
                chunkSize: 1024,
                memLevel: 9,
                level: 9
			},
			zlibInflateOptions: {
				chunkSize: 16 * 1024
			},
			clientNoContextTakeover: true,
			serverNoContextTakeover: true
		}
    });

    wss.on('connection', (ws, request) => {
        DEBUG && console.log('connected');

        if (!request) {
            console.error('Unexpected behaviour: request is NULL!');
        }

        if (request && request._wsNotAuth) {
            const ip = request.headers['x-forwarded-for'] ||
                request.connection.remoteAddress ||
                request.socket.remoteAddress ||
                (request.connection.socket ? request.connection.socket.remoteAddress : null);
            handlers.error && handlers.error.forEach(cb => cb('error', `authentication failed for ${ip}`));
            ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, 401, 'reauthenticate']));
            setTimeout(() =>
                ws && ws.destroy && ws.destroy(), 500);
        } else {
            let query;

            try {
                if (request) {
                    const queryString = request.url.split('?')[1];
                    query = querystring.parse(queryString || '');
                }
            } catch (e) {
                query = null;
            }

            if (query && query.sid) {
                const socket = new Socket(ws, request.sessionID || query.sid, query.name);
                socket.query = query;
                socketsList.push(socket);
                this.sockets.engine.clientsCount = socketsList.length;

                ws.on('close', () => {
                    DEBUG && console.log('closed');
                    let i;
                    for (i = 0; i < socketsList.length; i++) {
                        if (socketsList[i].ws === ws) {
                            socketsList[i].close();
                            socketsList.splice(i, 1);
                            this.sockets.engine.clientsCount = socketsList.length;
                            return;
                        }
                    }
                });

                // install handlers
                if (handlers.connection && handlers.connection.length) {
                    // we have a race condition here.
                    // If the user is not admin it will be requested for him the rights and no handlers will be installed.
                    // So we must be sure, that all event handlers are installed before sending ___ready___.
                    let timeout = setTimeout(() => {
                        timeout = null;
                        socket.emit('___ready___');
                        console.warn('Sent ready, but not all handlers installed!');
                    }, 1500); // TODO, This parameter must be configurable

                    handlers.connection.forEach(cb => cb(socket, () => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                            // say to client we are ready
                            socket.emit('___ready___');
                        }
                    }));
                } else {
                    socket.emit('___ready___');
                }
            } else {
                if (request) {
                    const ip = request.headers['x-forwarded-for'] ||
                        request.connection.remoteAddress ||
                        request.socket.remoteAddress ||
                        (request.connection.socket ? request.connection.socket.remoteAddress : null);

                    handlers.error && handlers.error.forEach(cb => cb('error', 'No sid found from ' + ip));
                } else {
                    handlers.error && handlers.error.forEach(cb => cb('error', 'No sid found'));
                }

                ws.send(JSON.stringify([MESSAGE_TYPES.MESSAGE, 501, 'error', ['invalid sid']]));
                setTimeout(() =>
                    ws && ws.destroy && ws.destroy(), 500);
            }
        }
    });

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

    this.sockets = {
        connected: socketsList,
        emit: (arg1, arg2, arg3, arg4, arg5) => {
            socketsList.forEach(socket =>
                socket.emit(arg1, arg2, arg3, arg4, arg5));
        },
        engine: {
            clientsCount: 0,
        }
    };

    this.engine = this.sockets.engine;

    this.use = cb => {
        run.push(cb);
        return this;
    };

    this.ioBroker = true;
}

module.exports = {
    listen: server => new SocketIO(server)
};
