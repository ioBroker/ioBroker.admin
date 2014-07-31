/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var express =   require('express');
var socketio =  require('socket.io');
var crypto =    require('crypto');
var password =  require(__dirname + '/../../lib/password.js');
var app;
var appSsl;
var server;
var serverSsl;
var io;
var ioSsl;

var objects =   {};
var states =    {};

var adapter = require(__dirname + '/../../lib/adapter.js')({
    name:           'admin',
    install: function (callback) {
        if (typeof callback === 'function') callback();
    },
    objectChange: function (id, obj) {
        objects[id] = obj;

        if (io)     io.sockets.emit('objectChange', id, obj);
        if (ioSsl)  ioSsl.sockets.emit('objectChange', id, obj);
    },
    stateChange: function (id, state) {
        states[id] = state;
        if (io)     io.sockets.emit('stateChange', id, state);
        if (ioSsl)  ioSsl.sockets.emit('stateChange', id, state);
    },
    unload: function (callback) {
        try {
            if (server) {
                adapter.log.info("terminating http server");
                server.close();

            }
            if (serverSsl) {
                adapter.log.info("terminating https server");
                serverSsl.close();

            }
            callback();
        } catch (e) {
            callback();
        }
    },
    ready: function () {
        main();
    }
});

function main() {

    adapter.subscribeForeignStates('*');
    adapter.subscribeForeignObjects('*');

    initWebserver();

    getData();

}
function unauthorized (res, realm) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.end('Unauthorized');
};

function basicAuth (callback, realm) {
    var username, password;

    // user / pass strings
    if ('string' == typeof callback) {
        username = callback;
        password = realm;
        if ('string' != typeof password) throw new Error('password argument required');
        realm = arguments[2];
        callback = function(user, pass){
            return user == username && pass == password;
        }
    }

    realm = realm || 'Authorization Required';

    return function(req, res, next) {
        var authorization = req.headers.authorization;

        if (req.user) return next();
        if (!authorization) return unauthorized(res, realm);

        var parts = authorization.split(' ');

        if (parts.length !== 2) return next(utils.error(400));

        var scheme = parts[0]
            , credentials = new Buffer(parts[1], 'base64').toString()
            , index = credentials.indexOf(':');

        if ('Basic' != scheme || index < 0) return next(utils.error(400));

        var user = credentials.slice(0, index)
            , pass = credentials.slice(index + 1);

        // async
        if (callback.length >= 3) {
            callback(user, pass, function(err, user){
                if (err || !user)  return unauthorized(res, realm);
                req.user = req.remoteUser = user;
                next();
            });
            // sync
        } else {
            if (callback(user, pass)) {
                req.user = req.remoteUser = user;
                next();
            } else {
                unauthorized(res, realm);
            }
        }
    }
};

function authFile (isSsl) {
    return function (req, res) {
        if ((!isSsl && !adapter.config.auth) || (isSsl && !!adapter.config.authSsl)) {
            res.set('Content-Type', 'text/javascript');
            res.send("var socketSession='nokey';");
        } else {
            // Read md5 hash of this user
            adapter.getForeignObject('system.user.' + req.user, function (err, obj) {
                res.set('Content-Type', 'text/javascript');
                if (err || !obj || !obj.common || !obj.common.password) {
                    res.send("var socketSession='invalid user " + req.user + "';");
                    return;
                }
                var random = crypto.randomBytes(16).toString('hex');
                var authHash = crypto.createHash('md5').update(req.connection.remoteAddress + random + req.user + obj.common.password).digest("hex");
                res.send("var socketSession='" + random + req.user + '|' + authHash + "';");
            });
        }
    }
}

function initWebserver() {
    if ((adapter.config.listenPort && adapter.config.auth) ||
        (adapter.config.listenPortSsl && adapter.config.authSsl)) {
        // Check if "admin" user exists
        adapter.getForeignObject('system.user.admin', function (err, obj) {
            if (err) {
                adapter.setPassword("admin", "password");
            }
        });
    }

    if (adapter.config.listenPort) {
        app = express();
        if (adapter.config.auth) {
            // Authenticator
            app.use(basicAuth(function(user, pass, callback) {
                adapter.checkPassword(user, pass, function (res) {
                    adapter.log.debug('Authenticate "' + user + '": result - ' + res);
                    callback (!res, user);
                });
            }));
        }

        if (adapter.config.cache) {
            app.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
        } else {
            app.use('/', express.static(__dirname + '/www'));
        }

        app.get('/auth/*', authFile(false));

        server = require('http').createServer(app);
    }

    if (adapter.config.listenPortSsl) {
        var fs = require('fs');
        var options;
        try {
            options = {
                key:  fs.readFileSync(__dirname + '/cert/privatekey.pem'),
                cert: fs.readFileSync(__dirname + '/cert/certificate.pem')
            };
        } catch (err) {
            adapter.log.error(err.message);
        }
        if (options) {
            appSsl = express();
            if (adapter.config.authSsl) {
                // Authenticator
                appSsl.use(basicAuth(function(user, pass, callback) {
                    adapter.checkPassword(user, pass, function (res) {
                        adapter.log.debug('Authenticate SSL "' + user + '": result - ' + res);
                        callback (!res, user);
                    });
                }));
            }

            if (adapter.config.cache) {
                appSsl.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
            } else {
                appSsl.use('/', express.static(__dirname + '/www'));
            }

            appSsl.get('/auth/*', authFile(true));

            serverSsl = require('https').createServer(options, appSsl);
        }
    }

    if (server) {
        var port = adapter.getPort(adapter.config.listenPort, function (port) {
            server.listen(port);
            adapter.log.info("http server listening on port " + port);
            io = socketio.listen(server);
            /*io.set('logger', {
                debug: function(obj) {adapter.log.debug("socket.io: "+obj)},
                info: function(obj) {adapter.log.debug("socket.io: "+obj)} ,
                error: function(obj) {adapter.log.error("socket.io: "+obj)},
                warn: function(obj) {adapter.log.warn("socket.io: "+obj)}
            });*/

            /*io.set("authorization", function (handshakeData, callback) {
                // make sure the handshake data looks good
                callback(null, true); // error first, &amp;#039;authorized&amp;#039; boolean second
            });
*/
            if (adapter.config.auth) {
                io.use(authSocket);
            }
            io.on('connection', initSocket);
        });

    }

    if (serverSsl) {
        var portSsl = adapter.getPort(adapter.config.listenPortSsl, function (portSsl) {
            serverSsl.listen(portSsl);
            adapter.log.info("https server listening on port " + portSsl);
            ioSsl = socketio.listen(serverSsl);
            /*io.set('logger', {
                debug: function(obj) {adapter.log.debug("socket.io: "+obj)},
                info: function(obj) {adapter.log.debug("socket.io: "+obj)} ,
                error: function(obj) {adapter.log.error("socket.io: "+obj)},
                warn: function(obj) {adapter.log.warn("socket.io: "+obj)}
            });*/
            if (adapter.config.authSsl) {
                ioSsl.use(authSocket);
            }
            ioSsl.on('connection', initSocket);
        });
    }

}

function getData() {
    adapter.log.info('requesting all states');
    adapter.getForeignStates('*', function (err, res) {
        adapter.log.info('received all states');
        states = res;
    });
    adapter.log.info('requesting all objects');
    adapter.objects.getObjectList({include_docs: true}, function (err, res) {
        adapter.log.info('received all objects');
        res = res.rows;
        objects = {};
        for (var i = 0; i < res.length; i++) {
            objects[res[i].doc._id] = res[i].doc;
        }
    });
}

function initSocket(socket) {

    socket.on('getStates', function (callback) {
        callback(null, states);
    });

    socket.on('getObjects', function (callback) {
        callback(null, objects);
    });

    socket.on('setState', function (id, state, callback) {
        if (typeof state !== 'object') state = {val: state};
        adapter.setForeignState(id, state, function (err, res) {
            if (typeof callback === 'function') callback(err, res);
        });
    });

    socket.on('extendObject', function (id, obj, callback) {
        adapter.extendForeignObject(id, obj, function (err, res) {
            if (typeof callback === 'function') callback(err, res);
        });
    });
}

function authSocket(socket, next) {
    var handshakeData = socket.handshake;
    if (socket.authorized) {
        next();
    } else
    // do not check if localhost
    if(handshakeData.address.address.toString() == "127.0.0.1") {
        socket.authorized = true;
        adapter.log.debug("local authentication 127.0.0.1");
        next();
    } else {
        var error = false;
        if (handshakeData.query["key"] === undefined) {
            error = true;
            adapter.log.warn("authentication failed. No key found.");
        } else {
            var text = handshakeData.query["key"];
            var random = text.substring(0, 32);
            text = text.substring(32);
            var pos = text.indexOf('|');
            if (pos != -1) {
                var user = text.substring(0, pos);
                text = text.substring(pos + 1);

                adapter.getForeignObject('system.user.' + user, function (err, obj) {
                    var _error = false;
                    if (err || !obj || !obj.common || !obj.common.password) {
                        _error = true;
                    } else {
                        var authHash = crypto.createHash('md5').update(handshakeData.address.address.toString() + random + user + obj.common.password).digest("hex");
                        if (authHash != text) {
                            _error = true;
                        }
                    }
                    if (_error) {
                        adapter.log.warn("authetication error on " + handshakeData.address.address);
                        next(new Error("Invalid session key"));
                    } else{
                        adapter.log.debug("authetication successful on " + handshakeData.address.address);
                        socket.authorized = true;
                        next();
                    }
                });
            } else {
                error = true;
            }
        }

        if (error) {
            adapter.log.warn("authetication error on " + handshakeData.address.address);
            next(new Error("not authorized"));
        }
    }
}
