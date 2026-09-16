const assert = require('node:assert');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, normalize } = require('node:path');
const { gzipSync } = require('node:zlib');

const {
    createLocalLogFiles,
    createRemoteLogFiles,
    detectLogLocation,
    getLogFileRegExp,
    resolveTransportLocation,
    searchLogFiles,
    selectLogFiles,
} = require('../build/lib/logSearch');

const ESC = String.fromCharCode(27);
const COLORS = { silly: 90, debug: 34, info: 32, warn: 33, error: 31 };

/** A line as js-controller writes it, with the colored level */
function line(date, time, level, text) {
    return `${date} ${time}  - ${ESC}[${COLORS[level]}m${level}${ESC}[39m: ${text}`;
}

const LOCATION = { prefix: 'iobroker', extension: '.log', source: 'controller-config' };

describe('logSearch: file names', () => {
    it('matches the rotated files only', () => {
        const regExp = getLogFileRegExp(LOCATION);
        assert.ok(regExp.test('iobroker.2026-09-16.log'));
        assert.ok(regExp.test('iobroker.2026-09-14.log.gz'));
        assert.ok(regExp.test('iobroker.2026-09-16.1.log'));
        assert.ok(!regExp.test('iobroker.current.log'));
        assert.ok(!regExp.test('iobroker-audit.json'));
        assert.ok(!regExp.test('iobroker.2026-09-16.log.bak'));
    });

    it('selects the files of the time range, newest first', () => {
        const names = [
            'iobroker.2026-09-10.log.gz',
            'iobroker.2026-09-15.log',
            'iobroker.2026-09-16.log',
            'iobroker.2026-09-16.1.log',
        ];
        const until = new Date(2026, 8, 16, 12, 0, 0).getTime();
        // 30 hours back reaches into the 15th, but not to the 10th
        const files = selectLogFiles(names, until - 30 * 3600000, until);
        assert.deepStrictEqual(files, [
            'iobroker.2026-09-16.1.log',
            'iobroker.2026-09-16.log',
            'iobroker.2026-09-15.log',
        ]);
    });
});

describe('logSearch: log location', () => {
    it('uses an absolute file name as it is', () => {
        const location = resolveTransportLocation(
            { log: { transport: { file1: { type: 'file', filename: '/var/log/iobroker/iob', fileext: '.txt' } } } },
            '/opt/iobroker/node_modules/iobroker.js-controller',
        );
        assert.deepStrictEqual(location, {
            prefix: 'iob',
            extension: '.txt',
            directory: normalize('/var/log/iobroker'),
        });
    });

    it('skips disabled transports and takes the directory that holds log files', () => {
        const controllerDir = '/opt/iobroker/node_modules/iobroker.js-controller';
        const location = resolveTransportLocation(
            {
                log: {
                    transport: {
                        syslog: { type: 'syslog' },
                        old: { type: 'file', enabled: false, filename: '/old/iobroker' },
                        file1: { type: 'file', filename: 'log/iobroker.log' },
                    },
                },
            },
            controllerDir,
            directory => (directory === normalize('/opt/iobroker/log') ? 'files' : 'no'),
        );
        // a name that ends with ".log" gets no further extension
        assert.deepStrictEqual(location, {
            prefix: 'iobroker.log',
            extension: '',
            directory: normalize('/opt/iobroker/log'),
        });
    });

    it('reads iobroker.json and falls back to the default directory without it', () => {
        const controllerDir = normalize('/opt/iobroker/node_modules/iobroker.js-controller');
        const configFile = normalize('/opt/iobroker/iobroker-data/iobroker.json');
        const logDir = normalize('/opt/iobroker/log');

        const fromConfig = detectLogLocation({
            controllerDir,
            env: {},
            exists: path => path === configFile || path === logDir,
            readFile: () =>
                JSON.stringify({ log: { transport: { file1: { type: 'file', filename: 'log/iobroker' } } } }),
            readDir: () => ['iobroker.2026-09-16.log'],
        });
        assert.deepStrictEqual(fromConfig, {
            prefix: 'iobroker',
            extension: '.log',
            directory: logDir,
            source: 'controller-config',
        });

        const probed = detectLogLocation({
            controllerDir,
            env: {},
            exists: path => path === logDir,
            readFile: () => '',
            readDir: () => [],
        });
        assert.deepStrictEqual(probed, { prefix: 'iobroker', extension: '.log', directory: logDir, source: 'probe' });
    });
});

describe('logSearch: search', () => {
    let directory;
    let location;
    let files;
    const until = new Date(2026, 8, 16, 12, 0, 0).getTime();

    before(() => {
        directory = mkdtempSync(join(tmpdir(), 'admin-log-search-'));
        location = { ...LOCATION, directory };
        files = createLocalLogFiles(location);

        writeFileSync(
            join(directory, 'iobroker.2026-09-14.log.gz'),
            gzipSync(
                [
                    line('2026-09-14', '08:00:00.000', 'info', 'host.raspi (100) very old start'),
                    line('2026-09-14', '09:00:00.000', 'error', 'zigbee.0 (200) old error'),
                    '',
                ].join('\n'),
            ),
        );
        // Windows line ends, a stack trace and an entry without colors
        writeFileSync(
            join(directory, 'iobroker.2026-09-15.log'),
            [
                line('2026-09-15', '10:00:00.000', 'warn', 'admin.0 (300) disk almost full'),
                line('2026-09-15', '11:00:00.000', 'error', 'javascript.0 (400) script crashed'),
                'Error: Something broke',
                '    at run (script.js:12:5)',
                '2026-09-15 12:00:00.000  - debug: admin.0 (300) plain line without colors',
                '',
            ].join('\r\n'),
        );
        writeFileSync(
            join(directory, 'iobroker.2026-09-16.log'),
            [
                line('2026-09-16', '09:00:00.000', 'info', 'admin.0 (300) Disk cleaned'),
                line('2026-09-16', '10:00:00.000', 'silly', 'zigbee.0 (200) chatter'),
                line('2026-09-16', '11:00:00.000', 'error', 'zigbee.0 (200) new error'),
                // written after the search started - must not be returned
                line('2026-09-16', '12:30:00.000', 'error', 'zigbee.0 (200) from the future'),
                '',
            ].join('\n'),
        );
        writeFileSync(join(directory, 'iobroker-audit.json'), '{}');
    });

    after(() => rmSync(directory, { recursive: true, force: true }));

    const messages = result =>
        result.lines.map(text =>
            text
                // eslint-disable-next-line no-control-regex
                .replace(/\[\d+m/g, '')
                .replace(/^.*?: /, ''),
        );

    it('returns everything of the time range, oldest first', async () => {
        const result = await searchLogFiles({ files, hours: 72, now: until });
        assert.deepStrictEqual(messages(result), [
            'host.raspi (100) very old start',
            'zigbee.0 (200) old error',
            'admin.0 (300) disk almost full',
            'javascript.0 (400) script crashed\nError: Something broke\n    at run (script.js:12:5)',
            'admin.0 (300) plain line without colors',
            'admin.0 (300) Disk cleaned',
            'zigbee.0 (200) chatter',
            'zigbee.0 (200) new error',
        ]);
        assert.strictEqual(result.truncated, false);
        assert.strictEqual(result.files, 3);
        assert.strictEqual(result.until, until);
    });

    it('keeps the entries in the time range only', async () => {
        const result = await searchLogFiles({ files, hours: 2.5, now: until });
        assert.deepStrictEqual(messages(result), ['zigbee.0 (200) chatter', 'zigbee.0 (200) new error']);
    });

    it('filters by level, including the more severe ones', async () => {
        const result = await searchLogFiles({ files, hours: 72, level: 'warn', now: until });
        assert.deepStrictEqual(messages(result), [
            'zigbee.0 (200) old error',
            'admin.0 (300) disk almost full',
            'javascript.0 (400) script crashed\nError: Something broke\n    at run (script.js:12:5)',
            'zigbee.0 (200) new error',
        ]);
    });

    it('filters by source', async () => {
        const result = await searchLogFiles({ files, hours: 72, source: 'admin.0', now: until });
        assert.deepStrictEqual(messages(result), [
            'admin.0 (300) disk almost full',
            'admin.0 (300) plain line without colors',
            'admin.0 (300) Disk cleaned',
        ]);
    });

    it('finds a text case-insensitively, also in the continuation lines', async () => {
        const disk = await searchLogFiles({ files, hours: 72, text: 'DISK', now: until });
        assert.deepStrictEqual(messages(disk), ['admin.0 (300) disk almost full', 'admin.0 (300) Disk cleaned']);

        const stack = await searchLogFiles({ files, hours: 72, text: 'script.js:12', now: until });
        assert.strictEqual(stack.lines.length, 1);
        assert.ok(stack.lines[0].includes('script crashed'));
    });

    it('returns the newest entries if there are too many', async () => {
        const result = await searchLogFiles({ files, hours: 72, maxRows: 3, now: until });
        assert.deepStrictEqual(messages(result), [
            'admin.0 (300) Disk cleaned',
            'zigbee.0 (200) chatter',
            'zigbee.0 (200) new error',
        ]);
        assert.strictEqual(result.truncated, true);
        // the older files are not read any more
        assert.strictEqual(result.files, 1);
    });

    it('lists only the rotated files of the directory', async () => {
        assert.deepStrictEqual((await files.list()).sort(), [
            'iobroker.2026-09-14.log.gz',
            'iobroker.2026-09-15.log',
            'iobroker.2026-09-16.log',
        ]);
    });

    it('reports a missing directory as an error', async () => {
        const missing = join(directory, 'missing');
        await assert.rejects(
            searchLogFiles({ files: createLocalLogFiles({ ...location, directory: missing }), hours: 1 }),
            error => error.message.includes(missing),
        );
    });

    describe('on another host', () => {
        /**
         * A js-controller that answers `getLogFiles` and `getLogFile` from the test directory.
         *
         * @param encode how the file content travels, like the message system hands it over
         */
        function host(encode) {
            const requests = [];
            const request = async (command, message) => {
                requests.push({ command, message });
                if (command === 'getLogFiles') {
                    return {
                        list: [
                            // a second transport writes into the same directory
                            ...['file1', 'file2'].flatMap(transport =>
                                [
                                    'iobroker.2026-09-14.log.gz',
                                    'iobroker.2026-09-15.log',
                                    'iobroker.2026-09-16.log',
                                    'iobroker-audit.json',
                                    'iobroker.current.log',
                                ].map(name => ({ fileName: `log/raspi/${transport}/${name}`, size: 1 })),
                            ),
                            { fileName: 'log/raspi/file1/iobroker.2026-09-13.log', size: 1 },
                        ],
                    };
                }
                if (message.filename === 'iobroker.2026-09-13.log') {
                    return { error: 'Cannot read file: Error: ENOENT: no such file or directory' };
                }
                const data = readFileSync(join(directory, message.filename));
                return { data: encode(data), gz: message.filename.endsWith('.gz'), size: data.length };
            };
            return { request, requests };
        }

        it('reads the files the host sends as buffers', async () => {
            const { request, requests } = host(data => data);
            const local = await searchLogFiles({ files, hours: 72, now: until });
            const remote = await searchLogFiles({ files: createRemoteLogFiles(request), hours: 72, now: until });

            assert.deepStrictEqual(remote.lines, local.lines);
            assert.strictEqual(remote.files, 3);
            // every file once, with the transport it was listed with; the vanished one is skipped
            assert.deepStrictEqual(
                requests.filter(item => item.command === 'getLogFile').map(item => item.message),
                [
                    { filename: 'iobroker.2026-09-16.log', transport: 'file1' },
                    { filename: 'iobroker.2026-09-15.log', transport: 'file1' },
                    { filename: 'iobroker.2026-09-14.log.gz', transport: 'file1' },
                    { filename: 'iobroker.2026-09-13.log', transport: 'file1' },
                ],
            );
        });

        it('also takes the JSON form of a buffer', async () => {
            const { request } = host(data => JSON.parse(JSON.stringify(data)));
            const result = await searchLogFiles({
                files: createRemoteLogFiles(request),
                hours: 72,
                level: 'error',
                now: until,
            });
            assert.deepStrictEqual(messages(result), [
                'zigbee.0 (200) old error',
                'javascript.0 (400) script crashed\nError: Something broke\n    at run (script.js:12:5)',
                'zigbee.0 (200) new error',
            ]);
        });

        it('skips a line that is being written', async () => {
            const request = async command =>
                command === 'getLogFiles'
                    ? { list: [{ fileName: 'log/raspi/file1/iobroker.2026-09-16.log', size: 1 }] }
                    : {
                          data: Buffer.from(
                              `${line('2026-09-16', '11:00:00.000', 'info', 'admin.0 (1) complete')}\n2026-09-16 11:00:01.000  - inf`,
                          ),
                      };
            const result = await searchLogFiles({ files: createRemoteLogFiles(request), hours: 2, now: until });
            assert.deepStrictEqual(messages(result), ['admin.0 (1) complete']);
        });

        it('fails if the host does not send what was asked for', async () => {
            await assert.rejects(
                searchLogFiles({ files: createRemoteLogFiles(async () => null), hours: 1, now: until }),
                /did not send its log files/,
            );

            const request = async command =>
                command === 'getLogFiles'
                    ? { list: [{ fileName: 'log/raspi/file1/iobroker.2026-09-16.log', size: 1 }] }
                    : { error: 'invalid config' };
            await assert.rejects(
                searchLogFiles({ files: createRemoteLogFiles(request), hours: 1, now: until }),
                /invalid config/,
            );
        });
    });
});
