/**
 * Search in the log files of a host.
 *
 * The Log tab shows the newest entries the host hands out and everything that is logged afterwards. To
 * reach further back, the tab asks this module: it reads the rotated log files - the gzipped ones too -
 * and returns the entries that match the filters of the tab. The files of the host this admin instance
 * runs on are read from the disk, the ones of other hosts are requested from their js-controller.
 *
 * Derived from ioBroker.logsearch by Disaster123 (MIT License).
 */
import { createReadStream, existsSync, readdirSync, readFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { basename, dirname, join, normalize } from 'node:path';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';
import { createGunzip, gunzip } from 'node:zlib';

const gunzipAsync = promisify(gunzip);

export type LogLevel = 'silly' | 'debug' | 'info' | 'warn' | 'error';

/** Log levels from the least to the most severe, as the severity filter of the Log tab orders them */
export const LOG_LEVELS: LogLevel[] = ['silly', 'debug', 'info', 'warn', 'error'];

/** More entries are never returned, whatever the client asks for */
export const MAX_ROWS_LIMIT = 5000;

/** Default log file prefix of js-controller (`log/${appName}`) */
const DEFAULT_PREFIX = 'iobroker';
/** Extension js-controller appends if the configured file name has none */
const DEFAULT_EXTENSION = '.log';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Date of a rotated log file, whatever the prefix and the extension: `<prefix>.<YYYY-MM-DD>[.<n>][<ext>][.gz]`.
 *
 * Groups: 1 year, 2 month, 3 day, 4 counter
 */
const LOG_FILE_DATE = /\.(\d{4})-(\d{2})-(\d{2})(?:\.(\d+))?(?:\.[^.\d][^.]*)?(?:\.gz)?$/;

const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/**
 * One line that starts a log entry, without color codes:
 * `2026-09-16 10:11:12.123  - info: admin.0 (1234) text`.
 *
 * Groups: 1 date, 2 time, 3 level, 4 everything after the level (source, PID and text), 5 source
 */
const LOG_LINE =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\s+-\s+(silly|debug|info|warn|error):\s+((\S+).*)$/i;

/** Where the log files are and how they are named */
export interface LogLocation {
    /** Absolute path of the directory with the log files */
    directory: string;
    /** File name before the date, e.g. `iobroker` */
    prefix: string;
    /** Extension of the files, e.g. `.log` (may be empty) */
    extension: string;
    /** How the location was found */
    source: 'controller-config' | 'probe' | 'fallback';
}

/** One `log.transport` entry of `iobroker.json` */
interface LogTransport {
    type?: string;
    enabled?: boolean;
    filename?: string;
    fileext?: string;
}

interface ControllerConfig {
    log?: { transport?: Record<string, LogTransport> };
}

export interface DetectLogLocationOptions {
    /** Root directory of js-controller */
    controllerDir: string;
    /** Absolute data directory (`iobroker-data`) */
    dataDir?: string;
    /** Environment to read `IOBROKER_DATA_DIR` from */
    env?: Record<string, string | undefined>;
    exists?: (path: string) => boolean;
    readFile?: (path: string) => string;
    readDir?: (path: string) => string[];
}

/** Access to the log files of one host */
export interface LogFiles {
    /** Names of the log files, rotated ones only */
    list(): Promise<string[]>;
    /**
     * Read one file line by line.
     *
     * @param name name of the file, as `list` returned it
     * @param onLine called for every line
     * @returns `false` if the file does not exist anymore, e.g. because it was compressed in the meantime
     */
    readLines(name: string, onLine: (line: string) => void): Promise<boolean>;
}

/** Answer of the `getLogFiles` host command */
interface GetLogFilesAnswer {
    /** `fileName` is `log/<host>/<transport>/<file>` */
    list?: { fileName: string; size: number }[];
}

/** Answer of the `getLogFile` host command */
interface GetLogFileAnswer {
    data?: unknown;
    gz?: boolean;
    size?: number;
    error?: string;
}

export interface SearchLogFilesOptions {
    /** The files to search */
    files: LogFiles;
    /** How many hours to look back */
    hours: number;
    /** Only entries of this level and the more severe ones */
    level?: LogLevel;
    /** Only entries of this source, e.g. `admin.0` or `host.raspi` */
    source?: string;
    /** Only entries that contain this text, case-insensitive */
    text?: string;
    /** Return at most this many entries - the newest ones */
    maxRows?: number;
    /** Current time, for tests */
    now?: number;
}

export interface SearchLogFilesResult {
    /**
     * The matching entries, oldest first, exactly as written in the file - color codes included. An
     * entry that spans several lines, like a stack trace, holds them joined by `\n`.
     */
    lines: string[];
    /** More entries match than were returned */
    truncated: boolean;
    /** Number of files that were read */
    files: number;
    /**
     * The files were read up to this time. An entry logged later is not in `lines`, so a client that
     * receives the live log can take everything newer than this from there without duplicates.
     */
    until: number;
}

/** A log entry while it is being collected */
interface Entry {
    ts: number;
    level: LogLevel;
    source: string;
    /** Source, PID and text without color codes, the continuation lines included */
    message: string;
    /** Lines as written in the file */
    raw: string[];
}

function toPosix(path: string): string {
    return path.replace(/\\/g, '/');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * js-controller resolves a relative log file name against the installation root of an npm installation
 * and against its own directory if it runs from its repository (`isNpm` in `logger.ts`).
 *
 * @param controllerDir root directory of js-controller
 */
function isNpmInstallation(controllerDir: string): boolean {
    return !toPosix(controllerDir).toLowerCase().includes('iobroker.js-controller/packages/');
}

/**
 * Directories a relative log path may point to, in the order in which the `getLogFiles` host command
 * of js-controller tries them: walking up from the controller directory.
 *
 * @param relativeDir directory part of the configured `filename`, e.g. `log`
 * @param controllerDir root directory of js-controller
 */
export function getLogDirCandidates(relativeDir: string, controllerDir: string): string[] {
    const candidates: string[] = [];
    const parts = ['..', '..', '..', '..'];
    do {
        parts.pop();
        candidates.push(normalize(`${controllerDir}/${parts.join('/')}/${relativeDir}`));
    } while (parts.length);
    return candidates;
}

/**
 * Possible places of `iobroker.json`, like `tools.getConfigFileName()` of js-controller.
 *
 * @param controllerDir root directory of js-controller
 * @param env environment to read `IOBROKER_DATA_DIR` from
 */
export function getConfigFileCandidates(controllerDir: string, env: Record<string, string | undefined>): string[] {
    const candidates: string[] = [];
    const envDataDir = env.IOBROKER_DATA_DIR;
    if (envDataDir) {
        const dataDir = /^\w:[/\\]|^[/\\]/.test(envDataDir) ? envDataDir : join(controllerDir, envDataDir);
        candidates.push(join(dataDir, 'iobroker.json'));
    }
    if (controllerDir) {
        // npm installation: <root>/iobroker-data/iobroker.json
        candidates.push(normalize(join(controllerDir, '..', '..', 'iobroker-data', 'iobroker.json')));
        // development checkout
        candidates.push(join(controllerDir, 'conf', 'iobroker.json'));
        candidates.push(join(controllerDir, 'data', 'iobroker.json'));
    }
    return candidates;
}

/**
 * The rotated log files of a location: `<prefix>.<YYYY-MM-DD>[.<n>]<extension>[.gz]`.
 *
 * js-controller always rotates daily. A counter only appears if a `maxSize` is configured; the file of
 * the day has none, the next ones count up from 1.
 *
 * Groups: 1 year, 2 month, 3 day, 4 counter
 *
 * @param location naming of the files
 */
export function getLogFileRegExp(location: Pick<LogLocation, 'prefix' | 'extension'>): RegExp {
    return new RegExp(
        `^${escapeRegExp(location.prefix)}\\.(\\d{4})-(\\d{2})-(\\d{2})(?:\\.(\\d+))?${escapeRegExp(location.extension)}(?:\\.gz)?$`,
    );
}

/**
 * Take directory and naming of the log files from the `log.transport` section of `iobroker.json`.
 *
 * The naming follows the preparation of the file transport in `logger.ts`. A relative `filename` is
 * looked up like the `getLogFiles` host command does it; only if none of the candidates exists yet,
 * the path the controller is going to create is returned.
 *
 * @param config content of `iobroker.json`
 * @param controllerDir root directory of js-controller
 * @param probe tells whether a directory holds log files (`files`), exists (`exists`) or not (`no`)
 */
export function resolveTransportLocation(
    config: ControllerConfig | null | undefined,
    controllerDir: string,
    probe?: (directory: string, naming: Pick<LogLocation, 'prefix' | 'extension'>) => 'files' | 'exists' | 'no',
): Omit<LogLocation, 'source'> | null {
    const transports = config?.log?.transport;
    if (!transports || typeof transports !== 'object') {
        return null;
    }

    for (const transport of Object.values(transports)) {
        if (!transport || typeof transport !== 'object' || transport.type !== 'file' || transport.enabled === false) {
            continue;
        }

        const filename = toPosix(
            typeof transport.filename === 'string' && transport.filename ? transport.filename : `log/${DEFAULT_PREFIX}`,
        );
        const prefix = basename(filename);
        // js-controller only appends ".log" if the configured name does not end with it already
        let extension: string;
        if (typeof transport.fileext === 'string' && transport.fileext) {
            extension = transport.fileext;
        } else {
            extension = prefix.toLowerCase().endsWith('.log') ? '' : DEFAULT_EXTENSION;
        }
        const naming = { prefix, extension };

        if (/^\w:\/|^\//.test(filename)) {
            return { ...naming, directory: dirname(normalize(filename)) };
        }

        const candidates = getLogDirCandidates(dirname(filename), controllerDir);
        if (probe) {
            // several candidates may exist: the one that holds log files is the right one
            const withFiles = candidates.find(candidate => probe(candidate, naming) === 'files');
            if (withFiles) {
                return { ...naming, directory: withFiles };
            }
            const existing = candidates.find(candidate => probe(candidate, naming) !== 'no');
            if (existing) {
                return { ...naming, directory: existing };
            }
        }

        return {
            ...naming,
            directory: dirname(
                normalize(`${controllerDir}${isNpmInstallation(controllerDir) ? '/../../' : '/'}${filename}`),
            ),
        };
    }

    return null;
}

/**
 * Find out where the log files of this host are and how they are named.
 *
 * @param options where js-controller is, and injectable file system access for tests
 */
export function detectLogLocation(options: DetectLogLocationOptions): LogLocation {
    const exists = options.exists || ((path: string): boolean => existsSync(path));
    const readFile = options.readFile || ((path: string): string => readFileSync(path, 'utf8'));
    const readDir = options.readDir || ((path: string): string[] => readdirSync(path));
    const env = options.env || process.env;
    const { controllerDir } = options;

    const probe = (directory: string, naming: Pick<LogLocation, 'prefix' | 'extension'>): 'files' | 'exists' | 'no' => {
        if (!exists(directory)) {
            return 'no';
        }
        try {
            const regExp = getLogFileRegExp(naming);
            return readDir(directory).some(name => regExp.test(name)) ? 'files' : 'exists';
        } catch {
            return 'exists';
        }
    };

    for (const candidate of getConfigFileCandidates(controllerDir, env)) {
        if (!exists(candidate)) {
            continue;
        }
        try {
            const location = resolveTransportLocation(
                JSON.parse(readFile(candidate)) as ControllerConfig,
                controllerDir,
                probe,
            );
            if (location) {
                return { ...location, source: 'controller-config' };
            }
        } catch {
            // an unreadable configuration is treated like a missing one
        }
    }

    // no usable iobroker.json: look for the default `log/` next to the installation
    const naming = { prefix: DEFAULT_PREFIX, extension: DEFAULT_EXTENSION };
    const candidates = [
        options.dataDir ? normalize(join(options.dataDir, '..', 'log')) : '',
        ...(controllerDir ? getLogDirCandidates('log', controllerDir) : []),
    ].filter(candidate => !!candidate);

    const withFiles = candidates.find(candidate => probe(candidate, naming) === 'files');
    if (withFiles) {
        return { ...naming, directory: withFiles, source: 'probe' };
    }
    const existing = candidates.find(candidate => probe(candidate, naming) !== 'no');
    if (existing) {
        return { ...naming, directory: existing, source: 'probe' };
    }

    return { ...naming, directory: candidates[0] || '', source: 'fallback' };
}

/**
 * The log files that may hold entries of the given time range, newest first.
 *
 * @param names names of the rotated log files
 * @param minTs start of the time range
 * @param maxTs end of the time range
 */
export function selectLogFiles(names: string[], minTs: number, maxTs: number): string[] {
    const files: { name: string; day: string; counter: number }[] = [];

    for (const name of names) {
        const match = name.match(LOG_FILE_DATE);
        if (!match) {
            continue;
        }
        const [, year, month, day, counter] = match;
        const dayStart = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
        // a file is written during its day, so a file of an earlier day cannot hold newer entries
        if (dayStart + ONE_DAY_MS <= minTs || dayStart > maxTs) {
            continue;
        }
        files.push({ name, day: `${year}-${month}-${day}`, counter: counter ? Number(counter) : 0 });
    }

    return files
        .sort((a, b) => (a.day === b.day ? b.counter - a.counter : a.day < b.day ? 1 : -1))
        .map(file => file.name);
}

/**
 * The log files in a directory of this host.
 *
 * `.current.log` is not listed: it is only a link to the file of today, which is read anyway.
 *
 * @param location where the files are and how they are named
 */
export function createLocalLogFiles(location: LogLocation): LogFiles {
    return {
        async list(): Promise<string[]> {
            let names: string[];
            try {
                names = await readdir(location.directory);
            } catch (error) {
                throw new Error(`Cannot read the log directory ${location.directory}: ${(error as Error).message}`);
            }
            const regExp = getLogFileRegExp(location);
            return names.filter(name => regExp.test(name));
        },

        async readLines(name: string, onLine: (line: string) => void): Promise<boolean> {
            const path = join(location.directory, name);
            let options: { start: number; end: number } | undefined;
            if (!name.endsWith('.gz')) {
                let size: number;
                try {
                    size = (await stat(path)).size;
                } catch {
                    return false;
                }
                if (!size) {
                    return true;
                }
                // only as much as the file had now, so that a line that is being written is not read half
                options = { start: 0, end: size - 1 };
            }

            const input = createReadStream(path, options);
            const stream = name.endsWith('.gz') ? input.pipe(createGunzip()) : input;
            const reader = createInterface({ input: stream, crlfDelay: Infinity });
            try {
                for await (const line of reader) {
                    onLine(line);
                }
                return true;
            } catch {
                // rotated or compressed while reading
                return false;
            } finally {
                reader.close();
                input.destroy();
                stream.destroy();
            }
        },
    };
}

/**
 * Content of a file, as the host sends it: normally a buffer, but a message may also hold its JSON form.
 *
 * @param data the `data` of the `getLogFile` answer
 */
function toBuffer(data: unknown): Buffer | null {
    if (Buffer.isBuffer(data)) {
        return data;
    }
    if (data instanceof Uint8Array) {
        return Buffer.from(data);
    }
    if (typeof data === 'string') {
        return Buffer.from(data, 'utf8');
    }
    if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
        return Buffer.from((data as { data: number[] }).data);
    }
    return null;
}

/**
 * The log files of another host, requested from its js-controller with the host commands `getLogFiles` and
 * `getLogFile`. Every read file is transferred completely.
 *
 * @param request sends a command to the host and resolves with its answer; it rejects if the host does not answer
 */
export function createRemoteLogFiles(request: (command: string, message: unknown) => Promise<unknown>): LogFiles {
    /** The transport - the log configuration of the host - each file belongs to */
    const transports = new Map<string, string>();

    return {
        async list(): Promise<string[]> {
            const answer = (await request('getLogFiles', null)) as GetLogFilesAnswer | null;
            if (!answer || !Array.isArray(answer.list)) {
                throw new Error('The host did not send its log files');
            }
            transports.clear();
            for (const file of answer.list) {
                const [, , transport, ...parts] = (file?.fileName || '').split('/');
                const name = parts.join('/');
                // several transports may write into the same directory: every file is read once
                if (transport && name && LOG_FILE_DATE.test(name) && !transports.has(name)) {
                    transports.set(name, transport);
                }
            }
            return [...transports.keys()];
        },

        async readLines(name: string, onLine: (line: string) => void): Promise<boolean> {
            const answer = (await request('getLogFile', {
                filename: name,
                transport: transports.get(name),
            })) as GetLogFileAnswer | null;
            if (answer?.error) {
                // the file was rotated away since it was listed
                if (answer.error.startsWith('Cannot read file')) {
                    return false;
                }
                throw new Error(answer.error);
            }
            let data = toBuffer(answer?.data);
            if (!data) {
                throw new Error(`The host did not send the log file ${name}`);
            }
            if (name.endsWith('.gz')) {
                data = await gunzipAsync(data);
            }

            const lines = data.toString('utf8').split(/\r?\n/);
            // the last part is empty after a complete line - or a line that was being written
            lines.pop();
            lines.forEach(line => onLine(line));
            return true;
        },
    };
}

/**
 * Search the log files.
 *
 * The files are read from the newest to the oldest, and the reading stops as soon as enough entries
 * were found. Lines that do not start with a time stamp belong to the entry above them.
 *
 * @param options where to search and what to look for
 */
export async function searchLogFiles(options: SearchLogFilesOptions): Promise<SearchLogFilesResult> {
    // Both limits are taken once: an entry logged while the files are read is not returned, the client
    // gets it from the live log. See `until`.
    const until = options.now ?? Date.now();
    const minTs = until - Math.max(1, Number(options.hours) || 1) * 60 * 60 * 1000;
    const maxRows = Math.min(Math.max(1, Math.floor(Number(options.maxRows) || 500)), MAX_ROWS_LIMIT);
    const minLevel = options.level && LOG_LEVELS.includes(options.level) ? LOG_LEVELS.indexOf(options.level) : 0;
    const source = options.source || '';
    const needle = (options.text || '').toLowerCase();

    const names = selectLogFiles(await options.files.list(), minTs, until);

    /** The newest matches, oldest first */
    let result: string[] = [];
    let truncated = false;
    let files = 0;

    for (let f = 0; f < names.length; f++) {
        // Keep one match more than needed: it tells that the result is truncated
        const needed = maxRows - result.length;
        let matches: string[] = [];
        let entry: Entry | null = null;

        const finish = (): void => {
            if (
                entry &&
                entry.ts >= minTs &&
                entry.ts <= until &&
                LOG_LEVELS.indexOf(entry.level) >= minLevel &&
                (!source || entry.source === source) &&
                (!needle || entry.message.toLowerCase().includes(needle))
            ) {
                matches.push(entry.raw.join('\n'));
                // the older matches of this file are not needed any more; cut them in blocks
                if (matches.length > needed * 2 + 1) {
                    matches = matches.slice(matches.length - needed - 1);
                }
            }
            entry = null;
        };

        const read = await options.files.readLines(names[f], line => {
            const plain = line.replace(ANSI_ESCAPE, '');
            const match = plain.match(LOG_LINE);
            if (match) {
                finish();
                entry = {
                    ts: new Date(`${match[1]}T${match[2]}`).getTime(),
                    level: match[3].toLowerCase() as LogLevel,
                    source: match[5],
                    message: match[4],
                    raw: [line],
                };
            } else if (entry && line) {
                // continuation of a multi-line entry, e.g. a stack trace
                entry.message += `\n${plain}`;
                entry.raw.push(line);
            }
        });
        if (!read) {
            // rotated or compressed in the meantime
            continue;
        }
        finish();
        files++;

        if (matches.length > needed) {
            truncated = true;
            matches = matches.slice(matches.length - needed);
        }
        result = matches.concat(result);

        if (result.length >= maxRows) {
            // older files are not read, so there may be more entries
            truncated ||= f < names.length - 1;
            break;
        }
    }

    return { lines: result, truncated, files, until };
}
