/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var express =           require('express');
var cookieParser =      require('cookie-parser');
var bodyParser =        require('body-parser');
var session =           require('express-session');
var AdapterStore =      require(__dirname + '/../../lib/session.js')(session);
var socketio =          require('socket.io');
var passportSocketIo =  require("passport.socketio");
var password =          require(__dirname + '/../../lib/password.js');
var passport =          require('passport');
var LocalStrategy =     require('passport-local').Strategy;
var flash =             require('connect-flash');

var webServers = [];

var objects =   {};
var states =    {};

var isAuthUsed = false;

var adapter = require(__dirname + '/../../lib/adapter.js')({
    name:           'admin',
    install: function (callback) {
        if (typeof callback === 'function') callback();
    },
    objectChange: function (id, obj) {
        objects[id] = obj;

        for (var i = 0; i < webServers.length; i++) {
            webServers[i].io.sockets.emit('objectChange', id, obj);
        }
    },
    stateChange: function (id, state) {
        states[id] = state;
        for (var i = 0; i < webServers.length; i++) {
            webServers[i].io.sockets.emit('stateChange', id, state);
        }
    },
    unload: function (callback) {
        try {
            for (var i = 0; i < webServers.length; i++) {
                adapter.log.info("terminating http" + (webServers[i].isSsl ? "s" : "") + " server on port " + webServers[i].port);
                webServers[i].server.close();
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

    initWebServers();

    getData();

}

// use setForeignObject instead
function addUser(user, pw, callback) {
    adapter.setForeignObject('system.user.' + user, {
        type: 'user',
        common: {
            name:    user,
            enabled: true
        }
    }, function () {
        adapter.setPassword(user, pw);
    });
}

function initWebServer(isSsl, listenPort, auth) {
    var server = {
        app:    null,
        server: null,
        io:     null,
        port:   listenPort,
        isSsl:  isSsl
    }

    if (listenPort) {
        var options = null;

        if (isSsl) {
            var fs = require('fs');
            try {
                options = {
                    key:  fs.readFileSync(__dirname + '/cert/privatekey.pem'),
                    cert: fs.readFileSync(__dirname + '/cert/certificate.pem')
                };
            } catch (err) {
                adapter.log.error(err.message);
            }
            if (!options) return null;
        }

        server.app = express();

        if (auth) {

            if (!isAuthUsed) {
                isAuthUsed = true;

                passport.use(new LocalStrategy(
                    function (username, password, done) {

                        adapter.checkPassword(username, password, function (res) {
                            if (res) {
                                return done(null, username);
                            } else {
                                return done(null, false);
                            }
                        });

                    }
                ));
                passport.serializeUser(function (user, done) {
                    done(null, user);
                });

                passport.deserializeUser(function (user, done) {
                    done(null, user);
                });
            }

            server.app.use(cookieParser());
            server.app.use(bodyParser.urlencoded({
                extended: true
            }));
            server.app.use(bodyParser.json());
            server.app.use(session({
                secret: 'Zgfr56gFe87jJOM',
                saveUninitialized: true,
                resave: true,
                store: new AdapterStore({adapter: adapter})
            }));
            server.app.use(passport.initialize());
            server.app.use(passport.session());
            server.app.use(flash());

            server.app.post('/login',
                passport.authenticate('local', {
                    successRedirect: '/',
                    failureRedirect: '/login',
                    failureFlash: 'Invalid username or password.'
                })
            );

            server.app.get('/logout', function (req, res) {
                req.logout();
                res.redirect('/login/index.html');
            });

            // route middleware to make sure a user is logged in
            server.app.use(function (req, res, next) {
                if (req.isAuthenticated() || req.originalUrl === '/login/') return next();
                res.redirect('/login/');
            });
        } else {
            server.app.get('/login', function (req, res) {
                res.redirect('/');
            });
            server.app.get('/logout', function (req, res) {
                res.redirect('/');
            });
        }

        if (isSsl) {
            server.server = require('https').createServer(options, server.app);
        } else {
            server.server = require('http').createServer(server.app);
        }

        if (adapter.config.cache) {
            server.app.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
        } else {
            server.app.use('/', express.static(__dirname + '/www'));
        }
    }

    if (server.server) {
        adapter.getPort(listenPort, function (port) {
            server.server.listen(port);
            adapter.log.info("http" + (isSsl ? "s" : "") + " server listening on port " + port);

            server.io = socketio.listen(server.server);

            if (auth) {
                server.io.use(passportSocketIo.authorize({
                    cookieParser: cookieParser,
                    key:          'express.sid',       // the name of the cookie where express/connect stores its session_id
                    secret:       'session_secret',    // the session_secret to parse the cookie
                    store:        AdapterStore,        // we NEED to use a sessionstore. no memorystore please
                    success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
                    fail:         onAuthorizeFail     // *optional* callback on fail/error - read more below
                }));
            }

            /*server.io.set('logger', {
             debug: function(obj) {adapter.log.debug("socket.io: " + obj)},
             info:  function(obj) {adapter.log.debug("socket.io: " + obj)} ,
             error: function(obj) {adapter.log.error("socket.io: " + obj)},
             warn:  function(obj) {adapter.log.warn("socket.io: " + obj)}
             });*/
            server.io.on('connection', initSocket);
        });
    }

    if (server.server) {
        return server;
    } else {
        return null;
    }
}

function initWebServers() {

    var server = initWebServer(false, adapter.config.listenPort, adapter.config.auth);
    if (server) webServers.push(server);

    server = initWebServer(true, adapter.config.listenPortSsl, adapter.config.authSsl);
    if (server) webServers.push(server);

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

function onAuthorizeSuccess(data, accept) {
    adapter.log.info('successful connection to socket.io');
    adapter.log.info(JSON.stringify(data));

    accept();
}


function onAuthorizeFail(data, message, error, accept) {
    if (error) adapter.log.error('failed connection to socket.io:', message);

    accept(null, false);

    if (error) accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
}
