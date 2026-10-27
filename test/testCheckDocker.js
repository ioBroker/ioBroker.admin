const assert = require('node:assert');

const { checkDockerForInstance } = require('../build/lib/checkDocker');

const LOCAL = { version: 'Docker version 28.3.2', daemonRunning: true, removeSupported: true, driver: 'socket' };
const REMOTE = { version: 'Docker version 27.5.1', daemonRunning: true, removeSupported: true, driver: 'socket' };

/**
 * An admin on host "vitanova", next to a host "frigate"
 *
 * @param {object} [frigate] how "frigate" behaves
 * @returns {{ env: object, calls: string[] }} the environment and what was called on it
 */
function createEnvironment(frigate = {}) {
    const calls = [];
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
            if (host !== 'frigate') {
                return null;
            }
            return {
                alive: frigate.alive !== false,
                supportsCheckDocker: async () => frigate.supported !== false,
            };
        },
        requestHost: async (host, message) => {
            calls.push(`request ${host} ${JSON.stringify(message)}`);
            if (frigate.requestError) {
                throw new Error(frigate.requestError);
            }
            return 'answer' in frigate ? frigate.answer : REMOTE;
        },
    };
    return { env, calls };
}

describe('checkDocker', () => {
    it('checks the own host for an older control, which sends no message', async () => {
        const { env, calls } = createEnvironment();
        assert.deepStrictEqual(await checkDockerForInstance(null, env), { ...LOCAL, host: 'vitanova' });
        assert.deepStrictEqual(calls, ['local']);
    });

    it('checks the own host itself, if the instance runs there', async () => {
        const { env, calls } = createEnvironment();
        const answer = await checkDockerForInstance({ host: 'system.host.vitanova', instance: 'ai-server.0' }, env);
        assert.deepStrictEqual(answer, { ...LOCAL, host: 'vitanova' });
        assert.deepStrictEqual(calls, ['local']);
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
            [{ host: 'frigate', instance: 'ai-server.0' }, { answer: { error: 'no plugin-docker' } }, /no plugin-docker/],
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
    });
});
