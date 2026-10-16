import { ERRORS, type ReducedRepositoryOptions, type Repository } from '@iobroker/socket-client';
import type { AdminConnection } from '@iobroker/gui-components';

/**
 * Reads the repository as the GUI needs it.
 *
 * Admin reduces it with `getReducedRepository`: the `news` only of the installed adapters and the
 * texts only in the language of the GUI and English - 1.5 instead of 11 MB, answered from the objects
 * admin holds instead of by the host. An older backend does not know the command, the whole
 * repository is read from the host then, as before.
 *
 * @param socket connection to admin
 * @param host host to ask, e.g. `system.host.raspberrypi`
 * @param options what to read and how to reduce it
 * @param update do not take the answer from the cache
 * @param timeoutMs timeout in ms
 */
export async function readRepository(
    socket: AdminConnection,
    host: string,
    options: ReducedRepositoryOptions,
    update?: boolean,
    timeoutMs?: number,
): Promise<Repository> {
    try {
        return await socket.getReducedRepository(host, options, update, timeoutMs);
    } catch (e) {
        if ((e as Error)?.message !== ERRORS.NOT_SUPPORTED) {
            throw e;
        }
    }
    return socket.getRepository(host, { repo: options.repo, update: options.update }, update, timeoutMs);
}

/**
 * Adds the news of installed adapters that the reduced repository came without.
 *
 * Admin takes an adapter as installed by its objects, and an adapter that was only put into
 * `node_modules` can have none. The host lists it as installed though, and its update dialog needs
 * the news. Nothing is missing with an older backend: the whole repository has all news anyway.
 *
 * @param socket connection to admin
 * @param host host to ask, e.g. `system.host.raspberrypi`
 * @param repository repository as read by `readRepository`, completed in place
 * @param installed names of the adapters the hosts reported as installed
 * @param options the options the repository was read with
 * @param timeoutMs timeout in ms
 */
export async function addMissingNews<T extends { news?: unknown }>(
    socket: AdminConnection,
    host: string,
    repository: Record<string, T>,
    installed: string[],
    options: ReducedRepositoryOptions,
    timeoutMs?: number,
): Promise<void> {
    const missing = installed.filter(name => name !== 'hosts' && repository[name] && !repository[name].news);
    if (!missing.length || !(await socket.checkFeatureSupported('REDUCED_REPOSITORY'))) {
        return;
    }
    const extra = await socket.getReducedRepository(
        host,
        { repo: options.repo, lang: options.lang, adapters: missing },
        false,
        timeoutMs,
    );
    for (const name of missing) {
        if (extra[name]?.news) {
            repository[name] = { ...repository[name], news: extra[name].news };
        }
    }
}
