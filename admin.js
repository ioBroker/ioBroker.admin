/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var express =   require('express');
var socketio =  require('socket.io');
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

    // Ein paar Attribute die jeder Adapter mitbringen muss
    name:           'admin',

    // Event-Handler für Adapter-Installation
    install: function (callback) {
        if (typeof callback === 'function') callback();
    },

    // Wird aufgerufen wenn sich ein Objekt - das via adapter.subscribeObjects aboniert wurde - ändert.
    objectChange: function (id, obj) {
        objects[id] = obj;

        if (io)     io.sockets.emit('objectChange', id, obj);
        if (ioSsl)  ioSsl.sockets.emit('objectChange', id, obj);
    },

    // Wird aufgerufen wenn sich ein Status - der via adapter.subscribeStates aboniert wurde - ändert.
    stateChange: function (id, state) {
        states[id] = state;
        if (io)     io.sockets.emit('stateChange', id, state);
        if (ioSsl)  ioSsl.sockets.emit('stateChange', id, state);
    },

    // Wird aufgerufen bevor der Adapter beendet wird - callback muss unbedingt aufgerufen werden!
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

    // Wird aufgerufen wenn der Adapter mit den Datenbanken verbunden ist und seine Konfiguration erhalten hat.
    // Hier einsteigen!
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

function checkPassword(user, pw, callback) {

    if (!objects['system.user.' + user]) callback(false);

    password(pw).check(objects['system.user.' + user].common.password, function (err, res) {
        callback(res);
    });

}

function setPassword(user, pw, callback) {
    if (!objects['system.user.' + user]) {
        if (typeof callback === 'function') callback(false);
        return false;
    }

    password(pw).hash(null, null, function (err, res) {
        if (err) {
            if (typeof callback === 'function') callback(false);
            return;
        }
        adapter.extendForeignObject('system.user.' + user, {
            common: {
                password: res
            }
        }, function () {
            if (typeof callback === 'function') callback(true);
            return true;
        });
    });

}

function initWebserver() {
    if (adapter.config.listenPort) {
        app    = express();
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
            serverSsl = require('https').createServer(options, appSsl);
        }
    }

    if (adapter.config.cache) {
        app.use('/', express.static(__dirname + '/www', {maxAge: 30758400000}));
    } else {
        app.use('/', express.static(__dirname + '/www'));
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

