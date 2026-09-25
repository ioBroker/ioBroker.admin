import { type AdminConnection } from '@iobroker/gui-components';
import AdminUtils, { type Style } from '../helpers/AdminUtils';

interface LogLine {
    severity: string;
    ts: number;
    message: string | { original: string; parts: { text: string; style: Style }[] };
    from: string;
    _id: number;
}

export interface LogLineSaved extends LogLine {
    key?: number;
}

/** A host that does not know `checkFeatureSupported` never answers it */
const FEATURE_CHECK_TIMEOUT_MS = 5_000;

/** Safari cannot parse `2020-01-01T10:00:00.000` as local time, so every number is parsed apart there */
const IS_SAFARI =
    typeof navigator !== 'undefined' &&
    !!navigator.vendor &&
    navigator.vendor.includes('Apple') &&
    !!navigator.userAgent &&
    !navigator.userAgent.includes('CriOS') &&
    !navigator.userAgent.includes('FxiOS');

/**
 * Parse one entry of a log file, as the host sends it for `getLogs` and the file search of admin returns it:
 * `2020-01-01 10:00:00.000  - <ESC>[32minfo<ESC>[39m: admin.0 (1234) text`.
 *
 * The message is left as text; `key` is the time stamp.
 *
 * @param line one line of the file, or one entry with its continuation lines joined by a line break
 * @returns `null` if the text does not start with a time stamp - then it continues the entry above
 */
export function parseLogFileLine(line: string): LogLineSaved | null {
    const time = line.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
    if (!time) {
        return null;
    }

    let ts: number;
    if (IS_SAFARI) {
        ts = new Date(
            parseInt(time[1], 10),
            parseInt(time[2], 10) - 1,
            parseInt(time[3], 10),
            parseInt(time[4], 10),
            parseInt(time[5], 10),
            parseInt(time[6], 10),
            parseInt(time[7], 10),
        ).getTime();
    } else {
        const tt = time[0].split(' ');
        ts = new Date(`${tt[0]}T${tt[1]}`).getTime();
    }

    // detect from
    const from = line.match(/: (host\..+? |[-\w]+\.\d+ \()/);

    // the level is normally colorized (`…[32minfo…`), but a log file written
    // with `colorize: false` has no escape sequences
    const severity = line.match(/\d+m(silly|debug|info|warn|error)/) || line.match(/ - (silly|debug|info|warn|error):/);

    // the message starts after the colored level, or after the plain one
    const message = line.match(/\[\d+m: ([\s\S]*)$/) || line.match(/ - (?:silly|debug|info|warn|error): ([\s\S]*)$/);

    return {
        key: ts,
        from: from ? from[0].replace(/[ :(]/g, '') : '',
        message: message ? message[1] : '',
        severity: severity ? severity[1] : 'info',
        ts,
        _id: 0,
    };
}

export class LogsWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: LogLineSaved[], messageSize: number) => void)[];

    private promise: Promise<{ logs: LogLineSaved[]; logSize: number }> | null;

    private connected: boolean;

    private logs: LogLineSaved[] | null;

    private newLogs: LogLineSaved[] | null = null;

    private errorCountHandlers: ((errors: number) => void)[];

    private warningCountHandlers: ((warnings: number) => void)[];

    private countErrors: boolean;

    private countWarnings: boolean;

    private errors: number;

    private warnings: number;

    private currentHost: string;

    private readonly maxLogs: number;

    private logTimeout: ReturnType<typeof setTimeout> | null = null;

    private logSize = 0;

    /** Answer of the `CONTROLLER_GET_LOGS_LOG_LEVEL` feature check, per host */
    private readonly logLevelFilterSupported: Map<string, Promise<boolean>> = new Map();

    /** Level the cached request was made with */
    private lastLogLevel: ioBroker.LogLevel | undefined;

    constructor(socket: AdminConnection, maxLogs?: number) {
        this.socket = socket;
        this.handlers = [];
        this.promise = null;

        this.errorCountHandlers = [];
        this.warningCountHandlers = [];
        this.countErrors = true;
        this.countWarnings = true;
        this.errors = 0;
        this.warnings = 0;
        this.currentHost = '';
        this.connected = this.socket.isConnected();
        this.maxLogs = maxLogs || 1000;
        this.logs = null;

        socket.registerLogHandler(this.logHandler);
        socket.registerConnectionHandler(this.connectionHandler);
    }

    setCurrentHost(currentHost: string): void {
        if (currentHost !== this.currentHost) {
            this.currentHost = currentHost;
            void this.getLogs(true);
        }
    }

    enableCountErrors(isEnabled: boolean): void {
        if (this.countErrors !== isEnabled) {
            this.countErrors = isEnabled;
            if (!this.countErrors) {
                const errors = this.errors;
                this.errors = 0;
                if (errors) {
                    this.errorCountHandlers.forEach(handler => handler && handler(errors));
                }
            }
        }
    }

    enableCountWarnings(isEnabled: boolean): void {
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

    resetErrors(): void {
        if (this.errors) {
            this.errors = 0;
            this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
        }
    }

    resetWarnings(): void {
        if (this.warnings) {
            this.warnings = 0;
            this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
        }
    }

    logHandler = (line: LogLine | string): void => {
        const result = this._processLine(line);

        if (result?.objLine) {
            this.newLogs = this.newLogs || [];
            this.newLogs.push(result.objLine);

            if (!this.logTimeout) {
                this.logTimeout = setTimeout(() => {
                    this.logTimeout = null;
                    const newLogs = this.newLogs || [];
                    this.newLogs = null;

                    this.handlers.forEach(handler => handler && handler(newLogs, JSON.stringify(line).length - 65));
                }, 200);
            }

            if (result.isNew) {
                if (result.objLine.severity === 'error' && this.countErrors) {
                    this.errors++;
                    this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
                } else if (result.objLine.severity === 'warn' && this.countWarnings) {
                    this.warnings++;
                    this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
                }
            }
        }
    };

    connectionHandler = (isConnected: boolean): void => {
        if (isConnected && !this.connected) {
            this.connected = true;
            // a host may have been updated while the connection was gone, so it is asked anew
            this.logLevelFilterSupported.clear();
            void this.getLogs(true);
        } else if (!isConnected && this.connected) {
            this.connected = false;
        }
    };

    registerHandler(cb: (events: LogLineSaved[], messageSize: number) => void): void {
        if (!this.handlers.includes(cb)) {
            this.handlers.push(cb);
        }
    }

    unregisterHandler(cb: (events: LogLineSaved[], messageSize: number) => void): void {
        const pos = this.handlers.indexOf(cb);

        if (pos !== -1) {
            this.handlers.splice(pos, 1);
        }
    }

    registerErrorCountHandler(cb: (errors: number) => void): void {
        if (!this.errorCountHandlers.includes(cb)) {
            this.errorCountHandlers.push(cb);
        }
    }

    unregisterErrorCountHandler(cb: (errors: number) => void): void {
        const pos = this.errorCountHandlers.indexOf(cb);

        if (pos !== -1) {
            this.errorCountHandlers.splice(pos, 1);
        }
    }

    registerWarningCountHandler(cb: (warnings: number) => void): void {
        if (!this.warningCountHandlers.includes(cb)) {
            this.warningCountHandlers.push(cb);
        }
    }

    unregisterWarningCountHandler(cb: (warnings: number) => void): void {
        const pos = this.warningCountHandlers.indexOf(cb);

        if (pos !== -1) {
            this.warningCountHandlers.splice(pos, 1);
        }
    }

    _processLine(line: LogLine | string, lastKey?: number): { objLine: LogLineSaved; isNew: boolean } | null {
        // do not update logs before the first logs from host received
        if (!this.logs) {
            return null;
        }
        if (!line) {
            return null;
        }
        /* const line = {
            "severity": "error",
            "ts": 1588162801514,
            "message": "host.DESKTOP-PLLTPO1 Invalid request getLogs. \"callback\" or \"from\" is null",
            "from": "host.DESKTOP-PLLTPO1",
            "_id": 48358425
        }; */

        // local reference, so the narrowing above survives the calls below
        const logs = this.logs;
        let objLine: LogLineSaved | undefined;
        let isNew = true;
        const length = logs.length;
        lastKey = lastKey || (length && logs[length - 1].key) || 0;

        if (typeof line === 'object') {
            objLine = line;
            if (lastKey && lastKey <= objLine.ts) {
                objLine.key = lastKey + 1;
            } else {
                objLine.key = objLine.ts;
            }
        } else {
            const parsed = parseLogFileLine(line);

            if (parsed) {
                objLine = parsed;
                if (lastKey && lastKey <= parsed.ts) {
                    objLine.key = lastKey + 1;
                }
            } else {
                isNew = false;
                // if no time found
                if (length) {
                    objLine = logs[length - 1];
                    if (objLine) {
                        if (typeof objLine.message === 'object') {
                            objLine.message = AdminUtils.parseColorMessage(objLine.message.original + line);
                        } else {
                            objLine.message += line;
                        }
                    }
                }
            }
        }

        if (!objLine) {
            return null;
        }

        if (typeof objLine.message !== 'object') {
            objLine.message = AdminUtils.parseColorMessage(objLine.message);
        }

        if (isNew) {
            const objKey = objLine.key || 0;
            // if new message time is less than last message in log
            if (length && (logs[length - 1].key || 0) > objKey) {
                let i;
                // find the place
                for (i = length - 1; i >= 0; i--) {
                    if ((logs[i].key || 0) < objKey) {
                        break;
                    }
                }
                if (i === -1) {
                    logs.unshift(objLine);
                } else {
                    logs.splice(i + 1, 0, objLine);
                }
            } else {
                logs.push(objLine);
            }

            if (length + 1 === this.maxLogs) {
                logs.shift();
            }
        }

        return { objLine, isNew };
    }

    /**
     * Send a command to the controller of a host.
     *
     * `socket.getRawSocket()` on purpose: `AdminConnection` has typed wrappers for a few fixed host
     * commands only, and none for `checkFeatureSupported`.
     *
     * @param host id of the host, e.g. `system.host.raspi`
     * @param command name of the controller message
     * @param message payload of the message
     */
    private sendToHost<T>(host: string, command: string, message: unknown): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // a controller that does not know the command never answers
            const timer = setTimeout(() => reject(new Error('timeout')), FEATURE_CHECK_TIMEOUT_MS);
            try {
                this.socket.getRawSocket().emit('sendToHost', host, command, message, (answer: T) => {
                    clearTimeout(timer);
                    resolve(answer);
                });
            } catch (e) {
                clearTimeout(timer);
                reject(e instanceof Error ? e : new Error(String(e)));
            }
        });
    }

    /**
     * Ask the controller of a host whether it understands `getLogs` with a log level.
     *
     * The question goes to that host and not through `socket.checkFeatureSupported`: the latter is
     * answered by the controller this admin runs on, and in a multihost system another host can run an
     * older one. Only a js-controller from 7.2 on knows the question at all, so an older one is not asked.
     *
     * @param host id of the host, e.g. `system.host.raspi`
     */
    private async askHostForLogLevelFilter(host: string): Promise<boolean> {
        const obj = await this.socket.getObject(host);
        const version = (obj as ioBroker.HostObject | null | undefined)?.common?.installedVersion?.match(
            /^(\d+)\.(\d+)/,
        );
        if (!version) {
            return false;
        }
        const [major, minor] = [parseInt(version[1], 10), parseInt(version[2], 10)];
        if (major < 7 || (major === 7 && minor < 2)) {
            return false;
        }

        const answer = await this.sendToHost<{ result?: boolean } | null>(
            host,
            'checkFeatureSupported',
            'CONTROLLER_GET_LOGS_LOG_LEVEL',
        );

        return answer?.result === true;
    }

    /**
     * Does the controller of a host understand `getLogs` with a log level?
     *
     * Asked once per host and then cached. Without the feature the message must stay a plain number:
     * older controllers compute the read offset as `150 * lines`, and an object there yields `NaN`,
     * which makes them return the complete log file.
     *
     * @param host id of the host, e.g. `system.host.raspi`
     */
    private isLogLevelFilterSupported(host: string): Promise<boolean> {
        let supported = this.logLevelFilterSupported.get(host);

        if (!supported) {
            supported = this.askHostForLogLevelFilter(host).catch(() => false);
            this.logLevelFilterSupported.set(host, supported);
        }

        return supported;
    }

    /**
     * Ask the host for the last log lines, with the level filter if the controller can do it.
     *
     * `socket.getLogs` types the message as a number, but it passes it through unchanged, so the
     * object form of the host message can be used once the controller announces the feature.
     */
    private async readLogLines(
        logLevel?: ioBroker.LogLevel,
    ): Promise<(string | number)[] | string | { error: string } | null> {
        const lines = 200;
        const host = this.currentHost;

        if (logLevel && (await this.isLogLevelFilterSupported(host))) {
            return this.socket.getLogs(host, { lines, logLevel } as unknown as number);
        }

        return this.socket.getLogs(host, lines);
    }

    /**
     * Read the log history of the current host.
     *
     * @param update ignore the cached request and read anew
     * @param logLevel only return entries of this level and above. Needs a controller with
     * `CONTROLLER_GET_LOGS_LOG_LEVEL`; without it everything is read as before and the caller filters.
     */
    getLogs(update?: boolean, logLevel?: ioBroker.LogLevel): Promise<{ logs: LogLineSaved[]; logSize: number }> {
        if (!this.currentHost) {
            return Promise.resolve({ logs: [], logSize: 0 });
        }

        // a different level means a different result, so the cached request cannot be reused
        if (logLevel !== this.lastLogLevel) {
            this.lastLogLevel = logLevel;
            update = true;
        }

        if (!update && this.promise instanceof Promise) {
            return this.promise;
        }

        const oldErrors = this.errors;
        const oldWarnings = this.warnings;
        this.errors = 0;
        this.warnings = 0;

        // Every level includes errors, so the error count is always complete. Warnings are only
        // complete while they are part of the answer - with `error` the badge would drop to zero.
        const warningsAreComplete = logLevel !== 'error';

        this.promise = this.readLogLines(logLevel)
            .then(lines => {
                // @ts-expect-error it can return error string or error object { error: 'permissionError' }
                if ((lines as string) === 'permissionError' || lines?.error !== undefined) {
                    const empty: LogLineSaved[] = [];
                    this.logs = empty;

                    window.alert('Cannot get logs: no permission');

                    return { logs: empty, logSize: 0 };
                }

                const logSizeStr: string | null | undefined = lines ? (lines as string[]).pop() : null;
                let logSize = 0;

                if (typeof logSizeStr === 'string') {
                    logSize = parseInt(logSizeStr, 10);
                }

                const logs: LogLineSaved[] = [];
                this.logs = logs;
                let lastKey: number | undefined;

                (lines as string[]).forEach(line => {
                    const result = this._processLine(line, lastKey);
                    if (result?.objLine) {
                        lastKey = result.objLine.key;
                        if (result.isNew && result.objLine.severity === 'error' && this.countErrors) {
                            this.errors++;
                        }

                        if (result.isNew && result.objLine.severity === 'warn' && this.countWarnings) {
                            this.warnings++;
                        }
                    }
                });

                if (logs.length && logs[0].ts) {
                    logs.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0));
                }

                this.logSize = logSize;

                // inform subscribes about each line
                this.handlers.forEach(cb => cb && cb(logs, logSize));

                if (oldErrors !== this.errors) {
                    this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
                }
                if (warningsAreComplete) {
                    if (oldWarnings !== this.warnings) {
                        this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
                    }
                } else {
                    // keep whatever was counted before instead of reporting a filtered-away zero
                    this.warnings = oldWarnings;
                }

                return { logs, logSize };
            })
            .catch((e: unknown): { logs: LogLineSaved[]; logSize: number } => {
                window.alert(`Cannot get logs: ${e as Error}`);
                return { logs: this.logs || [], logSize: 0 };
            });

        return this.promise;
    }

    clearLines(): void {
        this.logs = [];
        this.logSize = 0;

        if (this.errors) {
            this.errors = 0;
            this.errorCountHandlers.forEach(handler => handler && handler(this.errors));
        }

        if (this.warnings) {
            this.warnings = 0;
            this.warningCountHandlers.forEach(handler => handler && handler(this.warnings));
        }
    }
}
