/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

const SocketIO = require('../lib/ws');

const fs = require('fs');
const http = require('http');

const server = http.createServer(function (req, res) {
    if (req.url.endsWith('socket.io.js')) {
        res.setHeader('Content-type', 'text/javascript');
        res.write(fs.readFileSync(__dirname + '/../src-rx/public/lib/js/socket.io.js'));
        res.end();
    } else {
        res.setHeader('Content-type', 'text/html');
        res.write(fs.readFileSync(__dirname + '/public/index.html'));
        res.end();
    }
});

server.listen(8080, () => console.log('Started on 8080'));
const wsServer = new SocketIO(server);
wsServer.on('connect', socket => {
    console.log('connected');
    socket.on('disconnect', () => console.log('disconnected'));
    socket.on('withCallback', (data, cb) => {
        console.log(data);
        cb(data + 1);
    });
});
wsServer.on('error', error => console.log(error));

