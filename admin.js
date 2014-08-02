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

// use setForeignObject instead
function addUser (user, pw, callback) {
    this.setForeignObject('system.user.' + user, {
        type: 'user',
        common: {
            name:    user,
            enabled: true
        }
    }, function () {
        adapter.setPassword(user, pw);
    });
}

function initWebserver() {

    // route middleware to make sure a user is logged in
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated() || req.originalUrl === '/login/') return next();
        res.redirect('/login/');
    }

    // If auth enabled
    if ((adapter.config.listenPort    && adapter.config.auth) ||
        (adapter.config.listenPortSsl && adapter.config.authSsl)) {
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


    if (adapter.config.listenPort) {
        app = express();
        if (adapter.config.auth) {

            app.use(cookieParser());
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            app.use(bodyParser.json());
            app.use(session({
                secret: 'Zgfr56gFe87jJOM',
                saveUninitialized: true,
                resave: true,
                store: new AdapterStore({adapter:adapter})
            }));
            app.use(passport.initialize());
            app.use(passport.session());


            app.post('/login',
                passport.authenticate('local', {
                    successRedirect: '/',
                    failureRedirect: '/login',
                    failureFlash: true
                })
            );

            app.get('/logout', function (req, res) {
                req.logout();
                res.redirect('/index/login.html');
            });

            app.use(isLoggedIn);

        }
        server = require('http').createServer(app);

        if (adapter.config.cache) {
            app.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
        } else {
            app.use('/', express.static(__dirname + '/www'));
        }
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
                appSsl.use(cookieParser());
                appSsl.use(bodyParser.urlencoded({
                    extended: true
                }));
                appSsl.use(bodyParser.json());
                appSsl.use(session({
                    secret: 'Zgfr56gFe87jJOM',
                    saveUninitialized: true,
                    resave: true,
                    store: new AdapterStore({adapter: adapter})
                }));
                appSsl.use(passport.initialize());
                appSsl.use(passport.session());


                appSsl.post('/login',
                    passport.authenticate('local', {
                        successRedirect: '/',
                        failureRedirect: '/login',
                        failureFlash: true
                    })
                );

                appSsl.get('/logout', function (req, res) {
                    req.logout();
                    res.redirect('/index/login.html');
                });

                appSsl.use(isLoggedIn);
            }

            serverSsl = require('https').createServer(options, appSsl);

            if (adapter.config.cache) {
                appSsl.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
            } else {
                appSsl.use('/', express.static(__dirname + '/www'));
            }
        }
    }

    if (server) {
        var port = adapter.getPort(adapter.config.listenPort, function (port) {
            server.listen(port);
            adapter.log.info("http server listening on port " + port);


            io = socketio.listen(server);

            if (adapter.config.authSsl) {
                io.set(passportSocketIo.authorize({
                    cookieParser: express.cookieParser,
                    key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
                    secret:      'session_secret',    // the session_secret to parse the cookie
                    store:       AdapterStore,        // we NEED to use a sessionstore. no memorystore please
                    success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
                    fail:        onAuthorizeFail     // *optional* callback on fail/error - read more below
                }));

            }

            /*io.set('logger', {
                debug: function(obj) {adapter.log.debug("socket.io: "+obj)},
                info: function(obj) {adapter.log.debug("socket.io: "+obj)} ,
                error: function(obj) {adapter.log.error("socket.io: "+obj)},
                warn: function(obj) {adapter.log.warn("socket.io: "+obj)}
            });*/
            io.on('connection', initSocket);
        });

    }

    if (serverSsl) {
        var portSsl = adapter.getPort(adapter.config.listenPortSsl, function (portSsl) {
            serverSsl.listen(portSsl);
            adapter.log.info("https server listening on port " + portSsl);


            ioSsl = socketio.listen(serverSsl);

            if (adapter.config.authSsl) {
                ioSsl.use(passportSocketIo.authorize({
                    cookieParser: express.cookieParser,
                    key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
                    secret:      'session_secret',    // the session_secret to parse the cookie
                    store:       AdapterStore,        // we NEED to use a sessionstore. no memorystore please
                    success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
                    fail:        onAuthorizeFail     // *optional* callback on fail/error - read more below
                }));


            }

            /*io.set('logger', {
                debug: function(obj) {adapter.log.debug("socket.io: "+obj)},
                info: function(obj) {adapter.log.debug("socket.io: "+obj)} ,
                error: function(obj) {adapter.log.error("socket.io: "+obj)},
                warn: function(obj) {adapter.log.warn("socket.io: "+obj)}
            });*/
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
