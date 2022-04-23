const IOSocket = require('./socketCommon');

class CloudSocket extends IOSocket {
    constructor(server, settings, adapter, objects, store, checkUser) {
        super(server, settings, adapter, objects, store, checkUser, true);
    }

    send(socket, cmd, id, data) {
        if (socket._apiKeyOk) {
            socket.emit(cmd, id, data);
        }
    }

    stopAdapter(reason, callback) {
        reason && this.adapter.log.warn('Adapter stopped. Reason: ' + reason);
        this.adapter.getForeignObject('system.adapter.' + this.adapter.namespace, (err, obj) => {
            err && this.adapter.log.error('[stopAdapter/getForeignObject]: ' + err);
            if (obj) {
                obj.common.enabled = false;
                setTimeout(() => {
                    this.adapter.setForeignObject(obj._id, obj, err => {
                        err && this.adapter.log.error('[stopAdapter/setForeignObject]: ' + err);
                        callback && callback();
                    });
                }, 5000);
            } else {
                callback && callback();
            }
        });
    }

    redirectAdapter(url, callback) {
        if (!url) {
            this.adapter.log.warn('Received redirect command, but no URL');
        } else {
            this.adapter.getForeignObject('system.adapter.' + this.adapter.namespace, (err, obj) => {
                err && this.adapter.log.error('redirectAdapter [getForeignObject]: ' + err);
                if (obj) {
                    obj.native.cloudUrl = url;
                    setTimeout(() => this.adapter.setForeignObject(obj._id, obj, err => {
                        err && this.adapter.log.error('redirectAdapter [setForeignObject]: ' + err);
                        callback && callback();
                    }), 3000);
                } else {
                    callback && callback();
                }
            });
        }
    }

    waitForConnect(delaySeconds) {
        this.emit && this.emit('connectWait', delaySeconds);
    }

    socketEvents(socket, address, cb) {
        return super.socketEvents(socket, address, () => {
            socket._apiKeyOk = false;

            socket.on('cloudDisconnect', err => {
                err && this.adapter.log.warn('User disconnected from cloud: ' + err);
                this._unsubscribeSocket(socket, 'stateChange');
                this._unsubscribeSocket(socket, 'objectChange');
                this._unsubscribeSocket(socket, 'log');
                this.emit('cloudDisconnect');
            });

            socket.on('cloudConnect', () => {
                // do not auto-subscribe. The client must resubscribe all states anew
                // this._subscribeSocket(socket, 'stateChange');
                // this._subscribeSocket(socket, 'objectChange');
                // this._subscribeSocket(socket, 'log');
                this.emit('cloudConnect');
            });

            socket.on('cloudCommand', (cmd, data) => {
                if (cmd === 'stop') {
                    this.stopAdapter(data);
                } else if (cmd === 'redirect') {
                    this.redirectAdapter(data);
                } else if (cmd === 'wait') {
                    this.waitForConnect(data || 30);
                }
            });

            // only active in client mode
            socket.on('connect', () => {
                this.adapter.log.debug('Connected. Check api key...');
                socket._apiKeyOk = false;

                // 2018_01_20 workaround for pro: Remove it after next pro maintenance
                if (this.settings.apikey && this.settings.apikey.startsWith('@pro_')) {
                    socket._apiKeyOk = true;
                    this.emit && this.emit('connect');
                }

                // send api key if exists
                socket.emit('apikey', this.settings.apikey, this.settings.version, this.settings.uuid, (err, instructions) => {
                    // instructions = {
                    //     validTill: '2018-03-14T01:01:01.567Z',
                    //     command: 'wait' | 'stop' | 'redirect'
                    //     data: some data for command (URL for redirect or seconds for wait'

                    if (instructions) {
                        if (typeof instructions !== 'object') {
                            this.adapter.setState('info.remoteTill', new Date(instructions).toISOString(), true);
                        } else {
                            if (instructions.validTill) {
                                this.adapter.setState('info.remoteTill', new Date(instructions.validTill).toISOString(), true);
                            }
                            if (instructions.command === 'stop') {
                                this.stopAdapter(instructions.data);
                            } else if (instructions.command === 'redirect') {
                                this.redirectAdapter(instructions.data);
                            } else if (instructions.command === 'wait') {
                                this.waitForConnect(instructions.data || 30);
                            }
                        }
                    }

                    if (!err) {
                        this.adapter.log.debug('API KEY OK');
                        socket._apiKeyOk = true;

                        this.emit && this.emit('connect');
                    } else {
                        if (err.includes('Please buy remote access to use pro.')) {
                            this.stopAdapter('Please buy remote access to use pro.');
                        }
                        this.adapter.log.error(err);
                        socket.close(); // disconnect
                    }
                });

                if (socket._sessionID) {
                    this.adapter.getSession(socket._sessionID, obj => {
                        if (obj && obj.passport) {
                            socket._acl.user = obj.passport.user;
                        } else {
                            socket._acl.user = '';
                            socket.emit(IOSocket.COMMAND_RE_AUTHENTICATE);
                            if (!this.noDisconnect) {
                                socket.disconnect();
                            }
                        }
                        if (socket._authPending) {
                            socket._authPending(!!socket._acl.user, true);
                            delete socket._authPending;
                        }
                    });
                }

                this._subscribeSocket(socket, 'stateChange');
                this._subscribeSocket(socket, 'objectChange');
                this._subscribeSocket(socket, 'log');
            });

            /*socket.on('reconnect', attempt => {
                this.adapter.log.debug('Connected after attempt ' + attempt);
            });
            socket.on('reconnect_attempt', attempt => {
                this.adapter.log.debug('reconnect_attempt');
            });
            socket.on('connect_error', error => {
                this.adapter.log.debug('connect_error: ' + error);
            });
            socket.on('connect_timeout', error => {
                this.adapter.log.debug('connect_timeout');
            });
            socket.on('reconnect_failed', error => {
                this.adapter.log.debug('reconnect_failed');
            });*/

            cb && cb();
        });
    }

    init(server, options) {
        super.init(server, options);

        // if client mode => add event handlers
        this.initSocket(this.server);
    }
}

module.exports = CloudSocket;
