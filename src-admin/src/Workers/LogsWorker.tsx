import { type AdminConnection } from '@iobroker/gui-components';

import { hasPermission, SEND_TO_HOST } from '@/helpers/permissions';
import AdminUtils, { type Style } from '../helpers/AdminUtils';
import type { InstancesWorker } from './InstancesWorker';

interface LogLine {
    severity: string;
    ts: number;
    message: string | { original: string; parts: { text: string; style: Style }[] };
    from: string;
    _id: number;
    /** Host the entry comes from, e.g. `system.host.raspi`. Empty if it is not known */
    host?: string;
}

export interface LogLineSaved extends LogLine {
    key?: number;
}

/** What `getLogs` delivers */
export interface LogsResult {
    /** The entries, oldest first */
    logs: LogLineSaved[];
    /** Size of the log file; with all hosts the sum of their files */
    logSize: number;
    /** Hosts whose entries are in `logs` */
    hosts: string[];
    /** With all hosts: the hosts that delivered nothing - not running, or no answer in time */
    missingHosts: string[];
    /**
     * With all hosts: older entries were left out, the list starts here. The hosts hand out their latest
     * entries, which reach back minutes on a chatty host and days on a quiet one. `0` if nothing was left out
     */
    since: number;
}

/** The entries of one host, as it handed them out */
interface HostEntries {
    host: string;
    /** In the order of the file */
    entries: LogLineSaved[];
    logSize: number;
    /** The host left out older entries of its file */
    cut: boolean;
}

/** A host that does not know `checkFeatureSupported` never answers it */
const FEATURE_CHECK_TIMEOUT_MS = 5_000;

/** How many lines each host is asked for */
const LOG_LINES = 200;

/** With all hosts, one that does not answer must not hold up the others */
const ALL_HOSTS_TIMEOUT_MS = 15_000;

/** Remembers whether the logs of all hosts are shown */
const ALL_HOSTS_STORAGE_KEY = 'Log.allHosts';

/** The host refused the request: the user may not read its logs */
const NO_PERMISSION = 'no permission';

function getStorage(): Storage {
    return ((window as any)._localStorage as Storage) || window.localStorage;
}

/** Number of bytes of a text in UTF-8, as the host counts the size of its file */
function utf8Length(text: string): number {
    return new TextEncoder().encode(text).length;
}

/**
 * Reject if the promise is not settled in time
 *
 * @param promise the promise to wait for
 * @param ms how long to wait
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        promise.then(
            value => {
                clearTimeout(timer);
                resolve(value);
            },
            (error: unknown) => {
                clearTimeout(timer);
                reject(error instanceof Error ? error : new Error(String(error)));
            },
        );
    });
}

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

/**
 * Parse the lines a host handed out for `getLogs`.
 *
 * A line without a time stamp continues the entry above it, e.g. a stack trace. Such lines at the start
 * belong to an entry the host cut away and are dropped.
 *
 * @param lines the lines, without the size of the file behind them
 * @param host the host they come from
 * @returns the entries in the order of the file
 */
function parseLogFileLines(lines: string[], host: string): LogLineSaved[] {
    const entries: LogLineSaved[] = [];

    for (const line of lines) {
        const entry = parseLogFileLine(line);
        if (entry) {
            entry.host = host;
            entries.push(entry);
        } else if (entries.length) {
            // the colors are split later, until then the message is the text of the file
            const last = entries[entries.length - 1];
            last.message = `${last.message as string}${line}`;
        }
    }

    return entries;
}

/**
 * Sort the entries by time, give each a key of its own and split the colors of the messages.
 *
 * The keys only grow: entries of the same millisecond - common when several hosts are merged - would
 * otherwise share one.
 *
 * @param entries changed in place
 */
function prepareEntries(entries: LogLineSaved[]): void {
    // a stable sort: entries of the same millisecond keep the order of their file
    entries.sort((a, b) => a.ts - b.ts);

    let lastKey = 0;
    for (const entry of entries) {
        entry.key = Math.max(entry.ts, lastKey + 1);
        lastKey = entry.key;
        if (typeof entry.message !== 'object') {
            entry.message = AdminUtils.parseColorMessage(entry.message);
        }
    }
}

export class LogsWorker {
    private readonly socket: AdminConnection;

    private readonly handlers: ((events: LogLineSaved[], messageSize: number) => void)[];

    private promise: Promise<LogsResult> | null;

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

    /** Show the entries of all hosts instead of those of the current one */
    private allHosts: boolean;

    /** Tells which host an instance runs on */
    private readonly instancesWorker: InstancesWorker | null;

    /** Host of each instance, `zigbee.0` -> `system.host.raspi` */
    private instanceHosts: Record<string, string> = {};

    /**
     * @param socket connection to the admin
     * @param maxLogs how many entries to keep
     * @param instancesWorker tells which host an instance runs on. Without it, the entries of an instance
     * cannot be told apart by host and are shown for every host
     */
    constructor(socket: AdminConnection, maxLogs?: number, instancesWorker?: InstancesWorker) {
        this.socket = socket;
        this.handlers = [];
        this.promise = null;
        this.instancesWorker = instancesWorker || null;
        // the app switches it on once it knows that there is more than one host
        this.allHosts = false;

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
            // the entries of all hosts do not depend on the current one
            if (!this.allHosts) {
                void this.getLogs(true);
            }
        }
    }

    /** Did the user choose "All hosts" in the Log tab? */
    static isAllHostsStored(): boolean {
        return getStorage().getItem(ALL_HOSTS_STORAGE_KEY) === 'true';
    }

    /**
     * Remember the choice of the user. Kept apart from `setAllHosts`: with a single host the entries
     * of all hosts are not shown, but the choice stays for the time a second one is back.
     *
     * @param allHosts the user chose "All hosts"
     */
    static storeAllHosts(allHosts: boolean): void {
        getStorage().setItem(ALL_HOSTS_STORAGE_KEY, allHosts ? 'true' : 'false');
    }

    isAllHosts(): boolean {
        return this.allHosts;
    }

    /**
     * Show the entries of all hosts, or only those of the current one.
     *
     * Nothing is read here: the next `getLogs` reads anew. The Log tab does that as soon as it sees the
     * change, with its log level.
     *
     * @param allHosts show the entries of all hosts
     */
    setAllHosts(allHosts: boolean): void {
        if (allHosts !== this.allHosts) {
            this.allHosts = allHosts;
            // the cached answer belongs to the other mode
            this.promise = null;
        }
    }

    /**
     * The host an entry comes from.
     *
     * @param from source of the entry, e.g. `zigbee.0` or `host.raspi`
     * @returns id of the host, e.g. `system.host.raspi`, or `''` for an instance that is not known (yet)
     */
    getHostOfSource(from: string): string {
        if (from.startsWith('host.')) {
            return `system.${from}`;
        }
        return this.instanceHosts[from] || '';
    }

    /** Learn which host each instance runs on, from `common.host` of the instance objects */
    private async readInstanceHosts(): Promise<void> {
        const instances = await this.instancesWorker?.getObjects(false, true);
        if (!instances) {
            return;
        }
        const hosts: Record<string, string> = {};
        for (const [id, obj] of Object.entries(instances)) {
            if (obj?.common?.host) {
                hosts[id.replace('system.adapter.', '')] = `system.host.${obj.common.host}`;
            }
        }
        this.instanceHosts = hosts;
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
        // The controllers and instances of every host send their entries here, through the common states
        // database. While one host is shown, the entries of the others do not belong to it.
        if (line && typeof line === 'object') {
            line.host = this.getHostOfSource(line.from);
            if (!this.allHosts && line.host && line.host !== this.currentHost) {
                return;
            }
        }

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
     * Ask a host for its last log lines, with the level filter if its controller can do it.
     *
     * `socket.getLogs` types the message as a number, but it passes it through unchanged, so the
     * object form of the host message can be used once the controller announces the feature.
     *
     * @param host id of the host, e.g. `system.host.raspi`
     * @param logLevel only entries of this level and above
     * @returns `null` if the host answered with something else than its log lines
     * @throws {Error} with the message `NO_PERMISSION` if the user may not read the logs
     */
    private async readHost(host: string, logLevel?: ioBroker.LogLevel): Promise<HostEntries | null> {
        const filtered = !!logLevel && (await this.isLogLevelFilterSupported(host));
        const lines: (string | number)[] | string | { error: string } | null = filtered
            ? await this.socket.getLogs(host, { lines: LOG_LINES, logLevel } as unknown as number)
            : await this.socket.getLogs(host, LOG_LINES);

        // the answer can be the string `permissionError` or an object `{ error: 'permissionError' }`
        if (lines === 'permissionError' || (lines && typeof lines === 'object' && 'error' in lines)) {
            throw new Error(NO_PERMISSION);
        }

        // A host that answered with anything but its log lines - a request that ran into its
        // timeout, or a controller that reported something else entirely - must not end in
        // a `TypeError: e.pop is not a function` while the answer is taken apart
        if (!Array.isArray(lines)) {
            console.warn(`Cannot get logs of ${host}: unexpected answer ${JSON.stringify(lines)}`);
            return null;
        }

        // the host appends the size of the log file behind the last line
        const logSize = parseInt(String(lines[lines.length - 1] ?? ''), 10) || 0;
        const textLines = lines.slice(0, -1).filter((line): line is string => typeof line === 'string');

        // Did the host leave out older entries of its file? With a level it reads back until it has the
        // wanted number of lines. Without one it reads a fixed window at the end and drops the first line,
        // which the window cuts - then the text is shorter than the file.
        const cut = filtered ? textLines.length >= LOG_LINES : utf8Length(textLines.join('\n')) < logSize;

        return { host, entries: parseLogFileLines(textLines, host), logSize, cut };
    }

    /**
     * Ask all running hosts for their last log lines at once and merge them.
     *
     * The list starts where the shortest history of a host that left out older entries starts: before
     * that point it would hold only the entries of the quiet hosts and look complete.
     *
     * @param logLevel only entries of this level and above
     */
    private async readAllHosts(logLevel?: ioBroker.LogLevel): Promise<LogsResult> {
        const hosts = (await this.socket.getCompactHosts(true)).map(host => host._id as string);
        const alive = await Promise.all(
            hosts.map(host =>
                this.socket
                    .getState(`${host}.alive`)
                    .then(state => !!state?.val)
                    .catch(() => false),
            ),
        );

        let noPermission = false;
        const answers = await Promise.all(
            hosts.map((host, i): Promise<HostEntries | null> =>
                // a host that is not running is not asked: it would only run into the timeout
                alive[i]
                    ? withTimeout(this.readHost(host, logLevel), ALL_HOSTS_TIMEOUT_MS).catch((error: unknown): null => {
                          if ((error as Error)?.message === NO_PERMISSION) {
                              noPermission = true;
                          } else {
                              console.warn(`Cannot get logs of ${host}: ${error as Error}`);
                          }
                          return null;
                      })
                    : Promise.resolve(null),
            ),
        );
        if (noPermission) {
            throw new Error(NO_PERMISSION);
        }

        const delivered = answers.filter((answer): answer is HostEntries => !!answer);

        let start = 0;
        if (delivered.length > 1) {
            for (const answer of delivered) {
                if (answer.cut && answer.entries.length) {
                    start = Math.max(start, Math.min(...answer.entries.map(entry => entry.ts)));
                }
            }
        }

        const all = delivered.flatMap(answer => answer.entries);
        let logs = start ? all.filter(entry => entry.ts >= start) : all;
        prepareEntries(logs);

        // One less than the limit: `_processLine` drops the oldest entry when the list reaches it
        if (logs.length >= this.maxLogs) {
            logs = logs.slice(logs.length - this.maxLogs + 1);
        }

        return {
            logs,
            logSize: delivered.reduce((sum, answer) => sum + answer.logSize, 0),
            hosts: delivered.map(answer => answer.host),
            missingHosts: hosts.filter(host => !delivered.some(answer => answer.host === host)),
            since: logs.length < all.length && logs.length ? logs[0].ts : 0,
        };
    }

    /**
     * Read the last entries of the current host or of all hosts.
     *
     * @param logLevel only entries of this level and above
     */
    private async readLogEntries(logLevel?: ioBroker.LogLevel): Promise<LogsResult> {
        // to tell which host the entries that come in later belong to
        await this.readInstanceHosts().catch((error: unknown) =>
            console.warn(`Cannot read the hosts of the instances: ${error as Error}`),
        );

        if (this.allHosts) {
            return this.readAllHosts(logLevel);
        }

        const host = this.currentHost;
        const answer = await this.readHost(host, logLevel);
        const logs = answer?.entries || [];
        prepareEntries(logs);

        return { logs, logSize: answer?.logSize || 0, hosts: answer ? [host] : [], missingHosts: [], since: 0 };
    }

    /**
     * Read the log history of the current host, or of all hosts.
     *
     * @param update ignore the cached request and read anew
     * @param logLevel only return entries of this level and above. Needs a controller with
     * `CONTROLLER_GET_LOGS_LOG_LEVEL`; without it everything is read as before and the caller filters.
     */
    getLogs(update?: boolean, logLevel?: ioBroker.LogLevel): Promise<LogsResult> {
        // the log history comes from the host: without `sendTo` the answer is a permission error anyway
        if ((!this.allHosts && !this.currentHost) || !hasPermission(this.socket, SEND_TO_HOST)) {
            return Promise.resolve({ logs: [], logSize: 0, hosts: [], missingHosts: [], since: 0 });
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

        this.promise = this.readLogEntries(logLevel)
            .then(result => {
                const logs = result.logs;
                this.logs = logs;

                for (const entry of logs) {
                    if (entry.severity === 'error' && this.countErrors) {
                        this.errors++;
                    } else if (entry.severity === 'warn' && this.countWarnings) {
                        this.warnings++;
                    }
                }

                this.logSize = result.logSize;

                // inform subscribes about each line
                this.handlers.forEach(cb => cb && cb(logs, result.logSize));

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

                return result;
            })
            .catch((e: unknown): LogsResult => {
                if ((e as Error)?.message === NO_PERMISSION) {
                    this.logs = [];
                    window.alert('Cannot get logs: no permission');
                } else {
                    window.alert(`Cannot get logs: ${e as Error}`);
                }
                return { logs: this.logs || [], logSize: 0, hosts: [], missingHosts: [], since: 0 };
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
