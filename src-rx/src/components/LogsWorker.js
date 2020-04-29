import React from "react";
import Utils from "../Utils";

class LogsWorker {
    constructor(socket, maxLogs) {
        this.socket = socket;
        this.handlers = [];
        this.promises = {
            logs: new Promise(resolve => this.logResolve = resolve)
        };

        this.logHandlerBound = this.logHandler.bind(this);
        this.errorCountHandlers = [];
        socket.registerLogHandler(this.logHandlerBound);
        this.countErrors = true;
        this.errors = 0;
        this.currentHost = '';
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

        if (typeof line === 'object') {
            this.logs.push(line);

            if (this.logs.length === this.maxLogs) {
                this.logs.shift();
            }

            if (line.severity === 'error' && this.countErrors) {
                this.errors++;
            }

            return line;
        } else {
            const time = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/);

            if (time && time.length > 0) {
                lastKey = lastKey || (this.logs.length && this.logs[this.logs.length - 1].key) || 0;
                let ts = new Date(time[0]).getTime();

                if (lastKey === ts) {
                    ts++;
                }

                // detect from
                const from = line.match(/: (\D+\.\d+ \(|host\..+? )/);

                const obj = {
                    key: ts,
                    from:  from ? from[0].replace(/[ :(]/g, '') : '',
                    message: line.split(/\[\d+m: /)[1],
                    severity: line.match(/\d+m(silly|debug|info|warn|error)/)[0].replace(/[\dm]/g, ''),
                    ts
                };

                this.logs.push(obj);

                if (this.logs.length === this.maxLogs) {
                    this.logs.shift();
                }

                if (line.severity === 'error' && this.countErrors) {
                    this.errors++;
                }

                return obj;
            } else
            // if no time found
            if (this.logs.length > 0) {
                const obj = this.logs[this.logs.length - 1];
                obj.message += line;
                return obj;
            }
        }
    }

    getLogs(update) {
        if (!this.currentHost) {
            this.promises.logs = this.promises.logs ||
                new Promise(resolve => this.logResolve = resolve);

            return this.promises.logs;
        }

        if (!update && this.logs) {
            return Promise.resolve({logs: this.logs, logSize: this.logSize});
        }

        if (update) {
            this.logResolve = null;
            this.promises.logs = null;
        }

        this.promises.logs = this.promises.logs ||
            new Promise(resolve => this.logResolve = resolve);

        this.errors = 0;

        this.socket.getLogs(this.currentHost,200)
            .then(lines => {
                const logSize = lines ? Utils.formatBytes(lines.pop()) : -1;

                this.logs = [];
                let lastKey;
                lines.forEach(line => {
                    const obj = this._processLine(line, lastKey);
                    lastKey = obj.key;
                });

                this.logSize = logSize;

                // inform subscribes about each line
                this.handlers.forEach(cb => cb && cb(this.logs));

                this.errors && this.errorCountHandlers.forEach(handler => handler && handler(this.errors));

                this.logResolve({logs: this.logs, logSize});
                this.logResolve = null;
            });

        return this.promises.logs;
    }

    clearLines() {
        this.logs    = [];
        this.logSize = 0;
    }
}

export default LogsWorker;
