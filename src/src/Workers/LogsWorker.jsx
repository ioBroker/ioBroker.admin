import Utils from '../Utils';

class LogsWorker {
    constructor(socket, maxLogs) {
        this.socket               = socket;
        this.handlers             = [];
        this.promise              = null;

        this.errorCountHandlers   = [];
        this.warningCountHandlers = [];
        this.countErrors          = true;
        this.countWarnings        = true;
        this.errors               = 0;
        this.warnings             = 0;
        this.currentHost          = '';
        this.connected            = this.socket.isConnected();
        this.maxLogs              = maxLogs || 1000;
        this.logs                 = null;
        this.isSafari             = navigator.vendor && navigator.vendor.includes('Apple') &&
                                    navigator.userAgent && !navigator.userAgent.includes('CriOS') && !navigator.userAgent.includes('FxiOS');

        socket.registerLogHandler(this.logHandler);
        socket.registerConnectionHandler(this.connectionHandler);
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
                this.error   = 0;
                errors && this.errorCountHandlers.forEach(handler => handler && handler(errors));
            }
        }
    }

    enableCountWarnings(isEnabled) {
        if (this.countWarnings !== isEnabled) {
            this.countWarnings = isEnabled;
            if (!this.countWarnings) {
                const warnings = this.warnings;
                this.warnings = 0;
                if (warnings) {
                    this.warningCountHandlers.forEach(handler => handler && handler(warnings));
                }
            }
        }
    }

    resetErrors() {
        if (this.errors) {
            this.errors = 0;
            this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
        }
    }

    resetWarnings() {
        if (this.warnings) {
            this.warnings = 0;
            this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
        }
    }

    logHandler = line => {
        const obj = this._processLine(line);

        if (obj) {
            const errors = this.errors;
            const warnings = this.warnings;

            this.newLogs = this.newLogs || [];
            this.newLogs.push(obj);

            if (!this.logTimeout) {
                this.logTimeout = setTimeout(() => {
                    this.logTimeout = null;
                    const newLogs = this.newLogs;
                    this.newLogs = null;

                    this.handlers.forEach(handler =>
                        handler && handler(newLogs, JSON.stringify(line).length - 65));
                }, 200);
            }

            if (errors !== this.errors) {
                this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
            }

            if (warnings !== this.warnings) {
                this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
            }
        }
    }

    connectionHandler = isConnected => {
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

    registerWarningCountHandler(cb) {
        if (!this.warningCountHandlers.includes(cb)) {
            this.warningCountHandlers.push(cb);
        }
    }

    unregisterWarningCountHandler(cb) {
        const pos = this.warningCountHandlers.indexOf(cb);

        if (pos !== -1) {
            this.warningCountHandlers.splice(pos, 1);
        }
    }

    _processLine(line, lastKey) {
        // do not update logs before the first logs from host received
        if (!this.logs) {
            return;
        }
        if (!line) {
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
                let ts;
                // Safari sucks. It is a very idiotic browser, and because of it, we must parse every number apart
                if (this.isSafari) {
                    // parse every number
                    const tt = line.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
                    ts = new Date(parseInt(tt[1], 10), parseInt(tt[2], 10) - 1, parseInt(tt[3], 10), parseInt(tt[4], 10), parseInt(tt[5], 10), parseInt(tt[6], 10), parseInt(tt[7], 10)).getTime();
                } else {
                    const tt = time[0].split(' ');
                    ts = new Date(tt[0] + 'T' + tt[1]).getTime();
                }
                let key = ts;

                if (lastKey && lastKey <= ts) {
                    key = lastKey + 1;
                }

                // detect from
                const from = line.match(/: (host\..+? |[-\w]+\.\d+ \()/);

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
                    if (obj) {
                        if (typeof obj.message === 'object') {
                            obj.message = Utils.parseColorMessage(obj.message.original + line);
                        } else {
                            obj.message += line;
                        }
                    }
                }
            }
        }

        if (!obj) {
            return;
        }

        if (typeof obj.message !== 'object') {
            obj.message = Utils.parseColorMessage(obj.message);
        }

        if (isNew) {
            // if new message time is less than last message in log
            if (length && this.logs[length - 1].key > obj.key) {
                let i;
                // find the place
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

            if (isNew && obj.severity === 'error' && this.countErrors) {
                this.errors++;
            }

            if (isNew && obj.severity === 'warn' && this.countWarnings) {
                this.warnings++;
            }
        }

        return obj;
    }

    getLogs(update) {
        if (!this.currentHost) {
            return Promise.resolve({logs: [], logSize: 0});
        }

        if (!update && this.promise) {
            return this.promise;
        }

        this.errors = 0;
        this.warnings = 0;

        this.promise = this.socket.getLogs(this.currentHost, 200)
            .then(lines => {
                if (lines === 'permissionError' || lines?.error !== undefined) {
                    this.logs = [];

                    window.alert('Cannot get logs: no permission');

                    return {logs: this.logs, logSize: 0};
                }

                let logSize = lines ? lines.pop() : null;

                if (typeof logSize === 'string') {
                    logSize = parseInt(logSize);
                }

                this.logs = [];
                let lastKey;

                lines.forEach(line => {
                    const obj = this._processLine(line, lastKey);
                    if (obj) {
                        lastKey = obj.key;
                    }
                });

                if (lines && lines.length && lines[0].ts) {
                    lines.sort((a, b) => a.ts > b.ts ? 1 : (a.ts < b.ts ? -1 : 0));
                }

                this.logSize = logSize;

                // inform subscribes about each line
                this.handlers.forEach(cb => cb && cb(this.logs, logSize));

                this.errors && this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
                this.warnings && this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));

                return { logs: this.logs, logSize };
            })
            .catch(e => window.alert(`Cannot get logs: ${e}`));

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

        if (this.warnings) {
            const warnings = this.warnings;
            this.warnings = 0;
            this.warningCountHandlers.forEach(handler => handler && handler(warnings));
        }
    }
}

export default LogsWorker;