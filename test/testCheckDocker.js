const assert = require('node:assert');

const { checkDockerForInstance } = require('../build/lib/checkDocker');

const LOCAL = { version: 'Docker version 28.3.2', daemonRunning: true, removeSupported: true, driver: 'socket' };
const REMOTE = { version: 'Docker version 27.5.1', daemonRunning: true, removeSupported: true, driver: 'socket' };
/** What the js-controller of the own host answers: the Docker connection the instance uses, e.g. a NAS */
const CONNECTION = { version: 'Docker version 29.0.1', daemonRunning: true, removeSupported: false, driver: 'http' };

/**
 * An admin on host "vitanova", next to a host "frigate"
 *
 * @param {object} [frigate] how "frigate" behaves
 * @param {object | null} [vitanova] how the js-controller of the own host behaves, null if it has no host object
 * @returns {{ env: object, calls: string[], logs: string[] }} the environment, what was called on it and logged
 */
function createEnvironment(frigate = {}, vitanova = {}) {
    const hosts = { frigate, vitanova };
    const calls = [];
    const logs = [];
    const env = {
        ownHost: 'vitanova',
        checkLocal: async () => {
            calls.push('local');
            if (frigate.localError) {
                throw new Error(frigate.localError);
            }
            return LOCAL;
        },
        getHost: async host => {
            calls.push(`getHost ${host}`);
            const behaviour = hosts[host];
            if (!behaviour) {
                return null;
            }
            return {
                alive: behaviour.alive !== false,
                supportsCheckDocker: async () => behaviour.supported !== false,
            };
        },
        requestHost: async (host, message) => {
            calls.push(`request ${host} ${JSON.stringify(message)}`);
            const behaviour = hosts[host];
            if (behaviour.requestError) {
                throw new Error(behaviour.requestError);
            }
            if ('answer' in behaviour) {
                return behaviour.answer;
            }
            return host === 'frigate' ? REMOTE : CONNECTION;
        },
        log: text => logs.push(text),
    };
    return { env, calls, logs };
}

describe('checkDocker', () => {
    it('checks the own host for an older control, which sends no message', async () => {
        const { env, calls } = createEnvironment();
        assert.deepStrictEqual(await checkDockerForInstance(null, env), { ...LOCAL, host: 'vitanova' });
        assert.deepStrictEqual(calls, ['local']);
    });

    it('lets the js-controller of the own host check the instance, as it knows the Docker the instance uses', async () => {
        const { env, calls, logs } = createEnvironment();
        const answer = await checkDockerForInstance({ host: 'system.host.vitanova', instance: 'ai-server.0' }, env);
        assert.deepStrictEqual(answer, { ...CONNECTION, host: 'vitanova' });
        assert.deepStrictEqual(calls, ['getHost vitanova', 'request vitanova {"instance":"ai-server.0"}']);
        assert.deepStrictEqual(logs, []);
    });

    it('passes on that the Docker of the instance does not run, instead of checking the own one', async () => {
        const { env, calls } = createEnvironment({}, { answer: { version: '', daemonRunning: false, driver: 'http' } });
        const answer = await checkDockerForInstance({ host: 'vitanova', instance: 'ai-server.0' }, env);
        assert.strictEqual(answer.daemonRunning, false);
        assert.strictEqual(answer.error, undefined);
        assert.ok(!calls.includes('local'));
    });

    it('checks the own host itself, as before, if its js-controller cannot', async () => {
        const cases = [
            [{ supported: false }, /the js-controller cannot check Docker/],
            [{ alive: false }, /the js-controller cannot check Docker/],
            [null, /the js-controller cannot check Docker/],
            // e.g. an adapter with a Docker client of its own
            [
                { answer: { error: 'Adapter "kisshome-defender" does not use @iobroker/plugin-docker' } },
                /does not use @iobroker\/plugin-docker/,
            ],
            [{ answer: null }, /sent no answer/],
            [{ requestError: 'Host vitanova did not answer "checkDocker"' }, /did not answer/],
        ];
        for (const [vitanova, reason] of cases) {
            const { env, calls, logs } = createEnvironment({}, vitanova);
            const answer = await checkDockerForInstance({ host: 'vitanova', instance: 'ai-server.0' }, env);
            assert.deepStrictEqual(answer, { ...LOCAL, host: 'vitanova' }, JSON.stringify(vitanova));
            assert.strictEqual(calls.at(-1), 'local');
            assert.strictEqual(logs.length, 1);
            assert.match(logs[0], /ai-server\.0 is checked by admin itself on host vitanova/);
            assert.match(logs[0], reason);
        }
    });

    it('asks the host of the instance, if it is another one', async () => {
        const { env, calls } = createEnvironment();
        const answer = await checkDockerForInstance({ host: 'frigate', instance: 'ai-server.0' }, env);
        assert.deepStrictEqual(answer, { ...REMOTE, host: 'frigate' });
        assert.deepStrictEqual(calls, ['getHost frigate', 'request frigate {"instance":"ai-server.0"}']);
    });

    it('passes on that Docker does not run on the other host', async () => {
        const { env } = createEnvironment({ answer: { version: '', daemonRunning: false, driver: 'cli' } });
        const answer = await checkDockerForInstance({ host: 'frigate', instance: 'ai-server.0' }, env);
        assert.strictEqual(answer.daemonRunning, false);
        assert.strictEqual(answer.error, undefined);
    });

    it('never answers with the own Docker for another host', async () => {
        const cases = [
            [{ host: 'frigate' }, {}, /instance is missing/],
            [{ host: 'unknown', instance: 'ai-server.0' }, {}, /Unknown host unknown/],
            [{ host: 'frigate', instance: 'ai-server.0' }, { alive: false }, /not running/],
            [{ host: 'frigate', instance: 'ai-server.0' }, { supported: false }, /cannot check Docker, please update/],
            [{ host: 'frigate', instance: 'ai-server.0' }, { answer: null }, /sent no answer/],
            [
                { host: 'frigate', instance: 'ai-server.0' },
                { answer: { error: 'no plugin-docker' } },
                /no plugin-docker/,
            ],
            [{ host: 'frigate', instance: 'ai-server.0' }, { requestError: 'did not answer' }, /did not answer/],
        ];
        for (const [message, frigate, expected] of cases) {
            const { env, calls } = createEnvironment(frigate);
            const answer = await checkDockerForInstance(message, env);
            assert.match(answer.error, expected, JSON.stringify({ message, frigate }));
            assert.strictEqual(answer.host, message.host);
            assert.ok(!calls.includes('local'), 'the own host must not be checked');
            assert.strictEqual(answer.daemonRunning, undefined);
        }
    });

    it('reports a failing check of the own host instead of leaving the control without an answer', async () => {
        const { env } = createEnvironment({ localError: 'spawn docker ENOENT' });
        assert.deepStrictEqual(await checkDockerForInstance(null, env), {
            error: 'spawn docker ENOENT',
            host: 'vitanova',
        });
        // also after its js-controller could not check it
        const { env: withoutController } = createEnvironment(
            { localError: 'spawn docker ENOENT' },
            { supported: false },
        );
        assert.deepStrictEqual(
            await checkDockerForInstance({ host: 'vitanova', instance: 'ai-server.0' }, withoutController),
            { error: 'spawn docker ENOENT', host: 'vitanova' },
        );
    });
});
