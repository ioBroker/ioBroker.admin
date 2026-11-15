/**
 * Deleting an adapter on the other hosts of a multihost system once it was deleted on one of them.
 *
 * `iobroker del <adapter>` deletes on its own host only. A host can hold the package of an adapter without an
 * instance of its own, e.g. because its web server loads the web extension of an instance on another host -
 * js-controller installs the package there for that. Whether a host still needs the package only that host can
 * tell: js-controller (from 8.0 on) answers the host command `getAdapterUsage` with its instances of the adapter
 * and the web extensions of other hosts it loads. Admin asks every running host after deleting an adapter and
 * deletes it where it is not needed anymore. The CLI keeps deleting on its own host only.
 */

import type { AdminConnection } from '@iobroker/gui-components';

/** How long to wait for the answer of a host; a js-controller that does not know the command never answers */
const USAGE_TIMEOUT_MS = 5_000;

/** The answer of js-controller to `getAdapterUsage` */
export interface AdapterUsage {
    /** Name of the adapter, e.g. `frigate` */
    adapter: string;
    /** The version installed on the host, null if it is not installed */
    installedVersion: string | null;
    /** The instances of the adapter on the host */
    instances: string[];
    /** The instances of other hosts whose web extension a web server of the host loads */
    webExtensions: string[];
    /** Whether the package is needed on the host: false means it can be deleted there */
    needed: boolean;
    /** Set if the host refused the request */
    error?: string;
}

/** The part of the socket the cleanup needs */
export type CleanupSocket = Pick<AdminConnection, 'getCompactHosts' | 'getState' | 'getRawSocket'>;

/** Runs a CLI command on a host and calls back with its exit code once it ended */
export type ExecuteCommand = (cmd: string, host?: string, callback?: (exitCode?: number) => void) => void;

/**
 * Ask a host what an adapter is needed for there
 *
 * `socket.getRawSocket()` on purpose: `AdminConnection` has typed wrappers for a few fixed host commands only.
 *
 * @param socket connection to the backend
 * @param host id of the host, e.g. `system.host.raspi`
 * @param adapter name of the adapter
 * @returns null if the host did not answer in time, e.g. because its js-controller is older
 */
export function askAdapterUsage(socket: CleanupSocket, host: string, adapter: string): Promise<AdapterUsage | null> {
    return new Promise(resolve => {
        const timer = setTimeout(() => resolve(null), USAGE_TIMEOUT_MS);
        try {
            socket.getRawSocket().emit('sendToHost', host, 'getAdapterUsage', adapter, (answer: AdapterUsage) => {
                clearTimeout(timer);
                resolve(answer || null);
            });
        } catch (e) {
            clearTimeout(timer);
            console.warn(`Cannot ask "${host}" about "${adapter}": ${e as Error}`);
            resolve(null);
        }
    });
}

/**
 * Find the running hosts on which an adapter is installed but no longer needed
 *
 * A host that does not run or does not answer is left out: nothing is known about it, and deleting an adapter
 * it may still need would be worse than leaving a package behind.
 *
 * @param socket connection to the backend
 * @param adapter name of the adapter
 * @param exceptHost id of the host the adapter was deleted on already, e.g. `system.host.raspi`
 * @returns ids of the hosts, e.g. `['system.host.nuc']`
 */
export async function findHostsNotNeeding(
    socket: CleanupSocket,
    adapter: string,
    exceptHost: string,
): Promise<string[]> {
    const hosts = await socket.getCompactHosts();
    const result: string[] = [];

    await Promise.all(
        hosts
            .filter(host => host._id !== exceptHost)
            .map(async host => {
                try {
                    const alive = await socket.getState(`${host._id}.alive`);
                    if (!alive?.val) {
                        return;
                    }
                    const usage = await askAdapterUsage(socket, host._id, adapter);
                    if (usage && !usage.error && usage.needed === false && usage.installedVersion) {
                        result.push(host._id);
                    }
                } catch (e) {
                    console.warn(`Cannot check "${adapter}" on "${host._id}": ${e as Error}`);
                }
            }),
    );

    return result.sort();
}

/**
 * Delete an adapter on all other running hosts where it is installed but no longer needed, one after another
 *
 * @param options what to delete and how
 * @param options.socket connection to the backend
 * @param options.adapter name of the adapter
 * @param options.exceptHost id of the host the adapter was deleted on already
 * @param options.executeCommand runs the CLI command on a host and shows its output
 * @param options.debug whether to run the CLI with `--debug`
 * @returns ids of the hosts the adapter was deleted on
 */
export async function deleteAdapterWhereNotNeeded(options: {
    socket: CleanupSocket;
    adapter: string;
    exceptHost: string;
    executeCommand: ExecuteCommand;
    debug?: boolean;
}): Promise<string[]> {
    const { socket, adapter, exceptHost, executeCommand, debug } = options;
    const hosts = await findHostsNotNeeding(socket, adapter, exceptHost);

    for (const host of hosts) {
        // the command dialog shows one command at a time, so the next host waits for the end of the previous one
        await new Promise<void>(resolve =>
            executeCommand(`del ${adapter}${debug ? ' --debug' : ''}`, host, () => resolve()),
        );
    }

    return hosts;
}
