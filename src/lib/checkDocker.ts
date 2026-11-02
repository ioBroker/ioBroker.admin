/**
 * The message `checkDocker` of the jsonConfig control with the same name.
 *
 * The control asks whether Docker can be used on the host of the instance it configures. Docker is a property of the
 * machine, and the instance may run on another host than admin: there the host is asked, as its js-controller can
 * check it since `CONTROLLER_CHECK_DOCKER`. Without that, the control showed the Docker of the admin host for every
 * instance.
 *
 * The js-controller of the admin host is asked first as well, as it checks what the instance uses: the Docker
 * connection the adapter names (`iobDockerApi` of its plugin config, e.g. a Docker on another machine chosen in the
 * instance settings), with the `@iobroker/plugin-docker` of the adapter. What it cannot answer - an older
 * js-controller, an adapter without the plugin - admin checks itself, as before: the Docker of its host.
 *
 * An older control sends no message at all - it gets the answer for the host of admin, as before.
 */

/** The answer of `DockerManager.getDockerDaemonInfo()` of `@iobroker/plugin-docker` */
export interface DockerInfo {
    version?: string;
    daemonRunning?: boolean;
    removeSupported?: boolean;
    driver?: string;
}

/**
 * What the control gets: the Docker info or why it could not be found out, and the host it is about.
 *
 * An error means "unknown", not "no Docker": the control must not lock its checkbox because of it.
 */
export type CheckDockerAnswer = (DockerInfo | { error: string }) & { host: string };

/** A host, as far as the check needs it */
export interface DockerCheckHost {
    alive: boolean;
    /** Whether the js-controller of the host knows the host command `checkDocker` */
    supportsCheckDocker: () => Promise<boolean>;
}

export interface CheckDockerEnvironment {
    /** The host this admin instance runs on */
    ownHost: string;
    /** Check Docker on the own host */
    checkLocal: () => Promise<DockerInfo>;
    /** Look up a host, null if there is none with this name */
    getHost: (host: string) => Promise<DockerCheckHost | null>;
    /** Send the host command `checkDocker` */
    requestHost: (host: string, message: { instance: string }) => Promise<unknown>;
    /** Receives why the own host was checked by admin itself */
    log?: (text: string) => void;
}

/**
 * Answer the message of the control
 *
 * @param message `{ host, instance }` from the control, `null` from an older one
 * @param env access to the hosts
 */
export async function checkDockerForInstance(
    message: unknown,
    env: CheckDockerEnvironment,
): Promise<CheckDockerAnswer> {
    const { host: requestedHost, instance } =
        message && typeof message === 'object' ? (message as { host?: unknown; instance?: unknown }) : {};
    const host =
        typeof requestedHost === 'string' && requestedHost ? requestedHost.replace(/^system\.host\./, '') : env.ownHost;

    try {
        if (host === env.ownHost) {
            return await checkOwnHost(host, typeof instance === 'string' && instance ? instance : undefined, env);
        }
        if (typeof instance !== 'string' || !instance) {
            return { error: `The instance is missing, Docker cannot be checked on host ${host}`, host };
        }
        const hostInfo = await env.getHost(host);
        if (!hostInfo) {
            return { error: `Unknown host ${host}`, host };
        }
        if (!hostInfo.alive) {
            return { error: `Host ${host} is not running`, host };
        }
        if (!(await hostInfo.supportsCheckDocker())) {
            return { error: `The js-controller of host ${host} cannot check Docker, please update it`, host };
        }
        return await askHost(host, instance, env);
    } catch (error) {
        return { error: (error as Error).message, host };
    }
}

/**
 * Check Docker for an instance on the host of admin
 *
 * The js-controller of this host is asked first: it checks the Docker connection the instance uses, with the plugin
 * of the adapter. Whatever it cannot answer, admin checks itself, as before - the answer is never worse than without
 * the js-controller. A Docker that does not run is an answer, not a failure: it is not checked again here.
 *
 * @param host the own host
 * @param instance the instance, undefined from an older control
 * @param env access to the hosts
 */
async function checkOwnHost(
    host: string,
    instance: string | undefined,
    env: CheckDockerEnvironment,
): Promise<CheckDockerAnswer> {
    if (instance) {
        let reason: string;
        try {
            const hostInfo = await env.getHost(host);
            if (hostInfo?.alive && (await hostInfo.supportsCheckDocker())) {
                const answer = await askHost(host, instance, env);
                if (!('error' in answer)) {
                    return answer;
                }
                reason = answer.error;
            } else {
                reason = 'the js-controller cannot check Docker';
            }
        } catch (error) {
            reason = (error as Error).message;
        }
        env.log?.(`Docker for ${instance} is checked by admin itself on host ${host}: ${reason}`);
    }
    return { ...(await env.checkLocal()), host };
}

/**
 * Let the js-controller of a host check Docker for an instance
 *
 * @param host the host
 * @param instance the instance
 * @param env access to the hosts
 */
async function askHost(host: string, instance: string, env: CheckDockerEnvironment): Promise<CheckDockerAnswer> {
    const answer = (await env.requestHost(host, { instance })) as (DockerInfo & { error?: unknown }) | null;
    if (!answer || typeof answer !== 'object') {
        return { error: `Host ${host} sent no answer`, host };
    }
    if (answer.error) {
        return {
            error: typeof answer.error === 'string' ? answer.error : JSON.stringify(answer.error),
            host,
        };
    }
    return {
        version: answer.version,
        daemonRunning: answer.daemonRunning,
        removeSupported: answer.removeSupported,
        driver: answer.driver,
        host,
    };
}
