import Utils from '../Utils';

class LogsWorker {
    constructor(socket, maxLogs) {
        this.socket = socket;
        this.handlers = [];
        this.promise = new Promise(resolve => this.resolve = resolve);

        this.logHandlerBound = this.logHandler.bind(this);
        this.connectionHandlerBound = this.connectionHandler.bind(this);
        this.errorCountHandlers = [];
        socket.registerLogHandler(this.logHandlerBound);
        socket.registerConnectionHandler(this.connectionHandlerBound);
        this.countErrors = true;
        this.errors = 0;
        this.currentHost = '';
        this.connected = this.socket.isConnected();
        this.maxLogs = maxLogs || 1000;
        this.logs = null;
    }

    setCurrentHost(currentHost) {
        if (currentHost !== this.currentHost) {
            this.currentHost = currentHost;
            this.getLogs(true);
        }
    }

    enableCountErrors(isEnabled) {
        if (this.countErrors !== isEnabled) {
            this.countErrors = isEnabled;
            if (!this.countErrors) {
                const errors = this.errors;
                this.error = 0;
                if (errors) {
                    this.errorCountHandlers.forEach(handler => handler && handler(errors));
                }
            }
        }
    }
    
    logHandler(line) {
        const errors = this.errors;
        const obj = this._processLine(line);
        obj && this.handlers.forEach(handler => handler && handler([obj]));
        if (errors !== this.errors) {
            this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
        }
    }

    connectionHandler(isConnected) {
        if (isConnected && !this.connected) {
            this.connected = true;
            this.getLogs(true);
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    }
    
    registerHandler(cb) {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);
        }
    }

    unregisterHandler(cb) {
        const pos = this.handlers.indexOf(cb);

        if (pos !== -1) {
            this.handlers.splice(pos, 1);
        }
    }

    registerErrorCountHandler(cb) {
        if (!this.errorCountHandlers.includes(cb)) {
            this.errorCountHandlers.push(cb);
        }
    }

    unregisterErrorCountHandler(cb) {
        const pos = this.errorCountHandlers.indexOf(cb);

        if (pos !== -1) {
            this.errorCountHandlers.splice(pos, 1);
        }
    }

    _processLine(line, lastKey) {
        // do not update logs before the first logs from host received
        if (!this.logs) {
            return;
        }
        /* const line = {
            "severity": "error",
            "ts": 1588162801514,
            "message": "host.DESKTOP-PLLTPO1 Invalid request getLogs. \"callback\" or \"from\" is null",
            "from": "host.DESKTOP-PLLTPO1",
            "_id": 48358425
        };*/

        let obj;
        let isNew = true;
        const length = this.logs.length;
        lastKey = lastKey || (length && this.logs[this.logs.length - 1].key) || 0;

        if (typeof line === 'object') {
            if (lastKey && lastKey <= line.ts) {
                line.key = lastKey + 1;
            } else {
                line.key = line.ts;
            }

            obj = line;
        } else {
            const time = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);

            if (time && time.length > 0) {
                let ts = new Date(time[0]).getTime();
                let key = ts;

                if (lastKey && lastKey <= ts) {
                    key = lastKey + 1;
                }

                // detect from
                const from = line.match(/: (\D+\.\d+ \(|host\..+? )/);

                obj = {
                    key,
                    from:  from ? from[0].replace(/[ :(]/g, '') : '',
                    message: line.split(/\[\d+m: /)[1],
                    severity: line.match(/\d+m(silly|debug|info|warn|error)/)[0].replace(/[\dm]/g, ''),
                    ts
                };
            } else {
                isNew = false;
                // if no time found
                if (length) {
                    obj = this.logs[length - 1];
                    obj.message += line;
                }
            }
        }

        if (isNew) {
            // if new message time is less than last message in log
            if (length && this.logs[length - 1].key > obj.key) {
                let i;
                // find place
                for (i = length - 1; i >= 0; i--) {
                    if (this.logs[i].key < obj.key) {
                        break;
                    }
                }
                if (i === -1) {
                    this.logs.unshift(obj);
                } else {
                    this.logs.splice(i + 1, 0, obj);
                }
            } else {
                this.logs.push(obj);
            }

            if (length + 1 === this.maxLogs) {
                this.logs.shift();
            }

            if (isNew && obj.severity === 'error' && obj.countErrors) {
                this.errors++;
            }
        }

        return obj;
    }

    getLogs(update) {
        if (!this.currentHost) {
            this.promise = this.promise ||
                new Promise(resolve => this.resolve = resolve);

            return this.promise;
        }

        if (!update && this.logs) {
            return Promise.resolve({logs: this.logs, logSize: this.logSize});
        }

        if (update && this.logs) {
            this.promise = null;
        }

        this.promise = this.promise ||
            new Promise(resolve => this.resolve = resolve);

        this.errors = 0;

        this.socket.getLogs(this.currentHost, 200)
            .then(lines => {
                const logSize = lines ? Utils.formatBytes(lines.pop()) : -1;

                this.logs = [];
                let lastKey;
                lines.sort((a, b) => a.ts > b.ts ? 1 : (a.ts < b.ts ? -1 : 0));

                lines.forEach(line => {
                    const obj = this._processLine(line, lastKey);
                    if (obj) {
                        lastKey = obj.key;
                    }
                });

                this.logSize = logSize;

                // inform subscribes about each line
                this.handlers.forEach(cb => cb && cb(this.logs));

                this.errors && this.errorCountHandlers.forEach(handler => handler && handler(this.errors));

                this.resolve({logs: this.logs, logSize});
            });

        return this.promise;
    }

    clearLines() {
        this.logs    = [];
        this.logSize = 0;

        if (this.errors) {
            const errors = this.errors;
            this.errors = 0;
            this.errorCountHandlers.forEach(handler => handler && handler(errors));
        }
    }
}

export default LogsWorker;
