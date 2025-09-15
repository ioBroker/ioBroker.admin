// This class implements docker commands using CLI and
// it monitors periodically the docker daemon status.
// It manages containers defined in adapter.config.containers and monitors other containers

import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import type {
    ContainerConfig,
    ContainerInfo,
    DiskUsage,
    DockerContainerInspect,
    DockerImageInspect,
    ImageInfo,
} from './dockerManager.types';

const execPromise = promisify(exec);

export type ImageName = string;
export type ContainerName = string;

export default class DockerManager {
    #installed: boolean = false;
    #dockerVersion: string = '';
    #needSudo: boolean = false;
    readonly #waitReady: Promise<void>;
    readonly #adapter: ioBroker.Adapter;
    readonly #ownContainers: ContainerConfig[] = [];
    readonly #timers: {
        images?: ReturnType<typeof setInterval>;
        containers?: ReturnType<typeof setInterval>;
        info?: ReturnType<typeof setInterval>;
        container: { [key: string]: ReturnType<typeof setInterval> };
    } = {
        container: {},
    };

    constructor(adapter: ioBroker.Adapter, containers?: ContainerConfig[]) {
        this.#adapter = adapter;
        this.#ownContainers = containers || [];
        this.#waitReady = new Promise<void>(resolve => this.init().then(() => resolve()));
    }

    isReady(): Promise<void> {
        return this.#waitReady;
    }

    async getDockerDaemonInfo(): Promise<{
        version?: string;
        daemonRunning?: boolean;
    }> {
        await this.isReady();
        const daemonRunning = await this.#isDockerDaemonRunning();
        return {
            version: this.#dockerVersion,
            daemonRunning,
        };
    }

    async init(): Promise<void> {
        const version = await this.#isDockerInstalled();
        this.#installed = !!version;
        if (version) {
            this.#dockerVersion = version;
        } else {
            const daemonRunning = await this.#isDockerDaemonRunning();
            if (daemonRunning) {
                // Docker daemon is running, but docker command not found
                this.#adapter.log.warn(
                    'Docker daemon is running, but docker command not found. May be "iobroker" user has no access to Docker. Run "iob fix" command to fix it.',
                );
            } else {
                this.#adapter.log.warn('Docker is not installed. Please install Docker.');
            }
        }
        if (this.#installed) {
            this.#needSudo = await this.#isNeedSudo();
            await this.#checkOwnContainers();
        }
    }

    async #isDockerDaemonRunning(): Promise<boolean> {
        try {
            const { stdout, stderr } = await execPromise('systemctl status docker');
            // ● docker.service - Docker Application Container Engine
            //      Loaded: loaded (/lib/systemd/system/docker.service; enabled; preset: enabled)
            //      Active: active (running) since Fri 2025-08-15 08:37:22 CEST; 3 weeks 2 days ago
            // TriggeredBy: ● docker.socket
            //        Docs: https://docs.docker.com
            //    Main PID: 785 (dockerd)
            //       Tasks: 30
            //         CPU: 4min 17.003s
            //      CGroup: /system.slice/docker.service
            //              ├─  785 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
            //              ├─97032 /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 5000 -container-ip 172.17.0.2 -container-port 5000 -use-listen-fd
            //              └─97039 /usr/bin/docker-proxy -proto tcp -host-ip :: -host-port 5000 -container-ip 172.17.0.2 -container-port 5000 -use-listen-fd
            if (stderr?.includes('could not be found') || stderr.includes('not-found')) {
                this.#adapter.log.error(`Docker is not installed: ${stderr}`);
                return false;
            }
            this.#adapter.log.error(`Docker daemon is not running`);

            return stdout.includes('(running)');
        } catch {
            return false;
        }
    }

    async #checkOwnContainers(): Promise<void> {
        if (!this.#ownContainers.length) {
            return;
        }
        const status = await this.containerList(true);
        let images = await this.imageList();
        for (let c = 0; c < this.#ownContainers.length; c++) {
            const container = this.#ownContainers[c];
            if (container.enabled !== false) {
                // Check if container is running
                const containerInfo = status.find(it => it.names === container.name);
                if (containerInfo) {
                    if (containerInfo.status !== 'running' && containerInfo.status !== 'restarting') {
                        // Start the container
                        this.#adapter.log.info(`Starting own container ${container.name}`);

                        try {
                            const result = await this.containerStart(containerInfo.id);
                            if (result.stderr) {
                                this.#adapter.log.warn(
                                    `Cannot start own container ${container.name}: ${result.stderr}`,
                                );
                            }
                        } catch (e) {
                            this.#adapter.log.warn(`Cannot start own container ${container.name}: ${e.message}`);
                        }
                    } else {
                        this.#adapter.log.debug(`Own container ${container.name} is already running`);
                    }
                } else {
                    // Create and start the container
                    this.#adapter.log.info(`Creating and starting own container ${container.name}`);
                    if (!images.find(it => `${it.repository}:${it.tag}` === container.image)) {
                        this.#adapter.log.info(`Pulling image ${container.image} for own container ${container.name}`);
                        try {
                            const result = await this.imagePull(container.image);
                            if (result.stderr) {
                                this.#adapter.log.warn(`Cannot pull image ${container.image}: ${result.stderr}`);
                                continue;
                            }
                        } catch (e) {
                            this.#adapter.log.warn(`Cannot pull image ${container.image}: ${e.message}`);
                            continue;
                        }
                        // Check that image is available now
                        images = await this.imageList();
                        if (!images.find(it => `${it.repository}:${it.tag}` === container.image)) {
                            this.#adapter.log.warn(
                                `Image ${container.image} for own container ${container.name} not found after pull`,
                            );
                            continue;
                        }
                    }
                    try {
                        const result = await this.containerRun(container.image, container);
                        if (result.stderr) {
                            this.#adapter.log.warn(`Cannot start own container ${container.name}: ${result.stderr}`);
                        }
                    } catch (e) {
                        this.#adapter.log.warn(`Cannot start own container ${container.name}: ${e.message}`);
                    }
                }
            }
        }
    }

    #exec(command: string): Promise<{ stdout: string; stderr: string }> {
        if (!this.#installed) {
            return Promise.reject(new Error('Docker is not installed'));
        }
        const finalCommand = this.#needSudo ? `sudo docker ${command}` : `docker ${command}`;
        return execPromise(finalCommand);
    }

    async #isDockerInstalled(): Promise<string | false> {
        try {
            const result = await execPromise('docker --version');
            if (!result.stderr && result.stdout) {
                // "Docker version 28.3.2, build 578ccf6\n"
                return result.stdout.split('\n')[0].trim();
            }
            this.#adapter.log.debug(`Docker not installed: ${result.stderr}`);
        } catch (e) {
            this.#adapter.log.debug(`Docker not installed: ${e.message}`);
        }
        return false;
    }

    async #isNeedSudo(): Promise<boolean> {
        try {
            await execPromise('docker ps');
            return false;
        } catch {
            return true;
        }
    }

    async discUsage(): Promise<DiskUsage> {
        const { stdout } = await this.#exec(`system df`);
        const result: DiskUsage = { total: { size: 0, reclaimable: 0 } };
        // parse the output
        // TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
        // Images          2         1         2.715GB   2.715GB (99%)
        // Containers      1         1         26.22MB   0B (0%)
        // Local Volumes   0         0         0B        0B
        // Build Cache     0         0         0B        0B
        const lines = stdout.split('\n');
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[0] !== 'TYPE') {
                let size: number;
                let reclaimable: number;

                if (parts[0] === 'Images') {
                    const sizeStr = parts[3];
                    const reclaimableStr = parts[4].split(' ')[0];
                    size = this.#parseSize(sizeStr);
                    reclaimable = this.#parseSize(reclaimableStr);
                    result.images = {
                        total: parseInt(parts[1], 10),
                        active: parseInt(parts[2], 10),
                        size,
                        reclaimable: reclaimable,
                    };
                } else if (parts[0] === 'Containers') {
                    const sizeStr = parts[3];
                    const reclaimableStr = parts[4].split(' ')[0];
                    size = this.#parseSize(sizeStr);
                    reclaimable = this.#parseSize(reclaimableStr);
                    result.containers = {
                        total: parseInt(parts[1], 10),
                        active: parseInt(parts[2], 10),
                        size,
                        reclaimable: reclaimable,
                    };
                } else if (parts[0] === 'Local' && parts[1] === 'Volumes') {
                    const sizeStr = parts[4];
                    const reclaimableStr = parts[5].split(' ')[0];
                    size = this.#parseSize(sizeStr);
                    reclaimable = this.#parseSize(reclaimableStr);
                    result.volumes = {
                        total: parseInt(parts[2], 10),
                        active: parseInt(parts[3], 10),
                        size,
                        reclaimable: reclaimable,
                    };
                } else if (parts[0] === 'Build' && parts[1] === 'Cache') {
                    const sizeStr = parts[4];
                    const reclaimableStr = parts[5].split(' ')[0];
                    size = this.#parseSize(sizeStr);
                    reclaimable = this.#parseSize(reclaimableStr);
                    result.buildCache = {
                        total: parseInt(parts[2], 10),
                        active: parseInt(parts[3], 10),
                        size,
                        reclaimable: reclaimable,
                    };
                }
                result.total.size += size;
                result.total.reclaimable += reclaimable;
            }
        }
        return result;
    }

    async imagePull(image: ImageName): Promise<{ stdout: string; stderr: string }> {
        try {
            const result = await this.#exec(`pull ${image}`);
            const images = await this.imageList();
            if (!images.find(it => `${it.repository}:${it.tag}` === image)) {
                throw new Error(`Image ${image} not found after pull`);
            }
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async imageNameAutocomplete(partialName: string): Promise<
        {
            name: string;
            description: string;
            isOfficial: boolean;
            starCount: number;
        }[]
    > {
        try {
            // Read stars and descriptions
            const { stdout } = await this.#exec(
                `search ${partialName} --format "{{.Name}};{{.Description}};{{.IsOfficial}};{{.StarCount}}" --limit 50`,
            );
            return stdout
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    const [name, description, isOfficial, starCount] = line.split(';');
                    return {
                        name,
                        description,
                        isOfficial: isOfficial === 'true',
                        starCount: parseInt(starCount, 10) || 0,
                    };
                });
        } catch (e) {
            this.#adapter.log.debug(`Cannot search images: ${e.message}`);
            return [];
        }
    }

    async containerRun(image: ImageName, config: ContainerConfig): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`run ${this.#toDockerRun({ ...config, image })}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async containerCreate(image: ImageName, config: ContainerConfig): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`create ${this.#toDockerRun({ ...config, image })}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async imageList(): Promise<ImageInfo[]> {
        try {
            const { stdout } = await this.#exec(
                'images --format "{{.Repository}}:{{.Tag}};{{.ID}};{{.CreatedAt}};{{.Size}}"',
            );
            return stdout
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    const [repositoryTag, id, createdSince, size] = line.split(';');
                    const [repository, tag] = repositoryTag.split(':');
                    return {
                        repository,
                        tag,
                        id,
                        createdSince,
                        size: this.#parseSize(size),
                    };
                });
        } catch (e) {
            this.#adapter.log.debug(`Cannot list images: ${e.message}`);
            return [];
        }
    }

    async imageBuild(dockerfilePath: string, tag: string): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`build -t ${tag} -f ${dockerfilePath} .`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async imageTag(imageId: ImageName, newTag: string): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`tag ${imageId} ${newTag}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async imageRemove(imageId: ImageName): Promise<{ stdout: string; stderr: string }> {
        try {
            const result = await this.#exec(`rmi ${imageId}`);
            const images = await this.imageList();
            if (images.find(it => `${it.repository}:${it.tag}` === imageId)) {
                return { stdout: '', stderr: `Image ${imageId} still found after deletion` };
            }
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async imageInspect(imageId: ImageName): Promise<DockerImageInspect | null> {
        try {
            const { stdout } = await this.#exec(`inspect ${imageId}`);
            return JSON.parse(stdout)[0];
        } catch (e) {
            this.#adapter.log.debug(`Cannot inspect image: ${e.message.toString()}`);
            return null;
        }
    }

    #parseSize(sizeStr: string): number {
        const units: { [key: string]: number } = {
            B: 1,
            KB: 1024,
            MB: 1024 * 1024,
            GB: 1024 * 1024 * 1024,
            TB: 1024 * 1024 * 1024 * 1024,
        };
        const match = sizeStr.match(/^([\d.]+)([KMGTP]?B)$/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            return value * (units[unit] || 1);
        }
        return 0;
    }

    async containerStop(container: ContainerName): Promise<{ stdout: string; stderr: string }> {
        try {
            let containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === container || it.id === container);
            if (!containerInfo) {
                throw new Error(`Container ${container} not found`);
            }

            const result = await this.#exec(`stop ${containerInfo.id}`);
            containers = await this.containerList();
            if (containers.find(it => it.id === containerInfo.id && it.status === 'running')) {
                throw new Error(`Container ${container} still running after stop`);
            }
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async containerStart(container: ContainerName): Promise<{ stdout: string; stderr: string }> {
        try {
            let containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === container || it.id === container);
            if (!containerInfo) {
                throw new Error(`Container ${container} not found`);
            }

            const result = await this.#exec(`start ${containerInfo.id}`);
            containers = await this.containerList();
            if (
                containers.find(
                    it => it.id === containerInfo.id && it.status !== 'running' && it.status !== 'restarting',
                )
            ) {
                throw new Error(`Container ${container} still running after stop`);
            }
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async containerRestart(
        container: ContainerName,
        timeoutSeconds?: number,
    ): Promise<{ stdout: string; stderr: string }> {
        try {
            const containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === container || it.id === container);
            if (!containerInfo) {
                throw new Error(`Container ${container} not found`);
            }

            const result = await this.#exec(`restart -t ${timeoutSeconds || 5} ${containerInfo.id}`);
            // containers = await this.containerList(); // Removed: assignment to containers is unused
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async containerRemove(container: ContainerName): Promise<{ stdout: string; stderr: string }> {
        try {
            let containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === container || it.id === container);
            if (!containerInfo) {
                throw new Error(`Container ${container} not found`);
            }

            const result = await this.#exec(`rm ${container}`);

            containers = await this.containerList();
            if (containers.find(it => it.id === containerInfo.id)) {
                throw new Error(`Container ${container} still found after stop`);
            }
            return result;
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    async containerList(all: boolean = true): Promise<ContainerInfo[]> {
        try {
            const { stdout } = await this.#exec(
                `ps ${all ? '-a' : ''} --format  "{{.Names}};{{.Status}};{{.ID}};{{.Image}};{{.Command}};{{.CreatedAt}};{{.Ports}}"`,
            );
            return stdout
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    const [names, statusInfo, id, image, command, createdAt, ports] = line.split(';');
                    const [status, ...uptime] = statusInfo.split(' ');
                    let statusKey: ContainerInfo['status'] = status.toLowerCase() as ContainerInfo['status'];
                    if ((statusKey as string) === 'up') {
                        statusKey = 'running';
                    }
                    return { id, image, command, createdAt, status: statusKey, uptime: uptime.join(' '), ports, names };
                });
        } catch (e) {
            this.#adapter.log.debug(`Cannot list containers: ${e.message}`);
            return [];
        }
    }

    async containerLogs(
        containerNameOrId: ContainerName,
        options: { tail?: number; follow?: boolean } = {},
    ): Promise<string[]> {
        try {
            const args = [];
            if (options.tail !== undefined) {
                args.push(`--tail ${options.tail}`);
            }
            if (options.follow) {
                args.push(`--follow`);
            }
            const result = await this.#exec(`logs${args.length ? ` ${args.join(' ')}` : ''} ${containerNameOrId}`);
            return (result.stdout || result.stderr).split('\n').filter(line => line.trim() !== '');
        } catch (e) {
            return e
                .toString()
                .split('\n')
                .map((line: string): string => line.trim());
        }
    }

    async containerInspect(containerNameOrId: string): Promise<DockerContainerInspect | null> {
        try {
            const { stdout } = await this.#exec(`inspect ${containerNameOrId}`);
            return JSON.parse(stdout)[0] as DockerContainerInspect;
        } catch (e) {
            this.#adapter.log.debug(`Cannot inspect container: ${e.message.toString()}`);
            return null;
        }
    }

    /**
     * Build a docker run command string from ContainerConfig
     */
    #toDockerRun(config: ContainerConfig): string {
        const args: string[] = [];

        // detach / interactive
        if (config.detach !== false) {
            // default is true
            args.push('-d');
        }
        if (config.tty) {
            args.push('-t');
        }
        if (config.stdinOpen) {
            args.push('-i');
        }
        if (config.removeOnExit) {
            args.push('--rm');
        }

        // name
        if (config.name) {
            args.push('--name', config.name);
        }

        // hostname / domain
        if (config.hostname) {
            args.push('--hostname', config.hostname);
        }
        if (config.domainname) {
            args.push('--domainname', config.domainname);
        }

        // environment
        if (config.environment) {
            for (const [key, value] of Object.entries(config.environment)) {
                args.push('-e', `${key}=${value}`);
            }
        }
        if (config.envFile) {
            for (const file of config.envFile) {
                args.push('--env-file', file);
            }
        }

        // labels
        if (config.labels) {
            for (const [key, value] of Object.entries(config.labels)) {
                args.push('--label', `${key}=${value}`);
            }
        }

        // ports
        if (config.publishAllPorts) {
            args.push('-P');
        }
        if (config.ports) {
            for (const p of config.ports) {
                if (!p.containerPort) {
                    continue;
                }
                const mapping =
                    (p.hostIP ? `${p.hostIP}:` : '') +
                    (p.hostPort ? `${p.hostPort}:` : '') +
                    p.containerPort +
                    (p.protocol ? `/${p.protocol}` : '');
                args.push('-p', mapping);
            }
        }

        // volumes / mounts
        if (config.volumes) {
            for (const v of config.volumes) {
                args.push('-v', v);
            }
        }
        if (config.mounts) {
            for (const m of config.mounts) {
                let mount = `type=${m.type},target=${m.target}`;
                if (m.source) {
                    mount += `,source=${m.source}`;
                }
                if (m.readOnly) {
                    mount += `,readonly`;
                }
                args.push('--mount', mount);
            }
        }

        // restart policy
        if (config.restart?.policy) {
            const val =
                config.restart.policy === 'on-failure' && config.restart.maxRetries
                    ? `on-failure:${config.restart.maxRetries}`
                    : config.restart.policy;
            args.push('--restart', val);
        }

        // user & workdir
        if (config.user) {
            args.push('--user', String(config.user));
        }
        if (config.workdir) {
            args.push('--workdir', config.workdir);
        }

        // logging
        if (config.logging?.driver) {
            args.push('--log-driver', config.logging.driver);
            if (config.logging.options) {
                for (const [k, v] of Object.entries(config.logging.options)) {
                    args.push('--log-opt', `${k}=${v}`);
                }
            }
        }

        // security
        if (config.security?.privileged) {
            args.push('--privileged');
        }
        if (config.security?.capAdd) {
            for (const cap of config.security.capAdd) {
                args.push('--cap-add', cap);
            }
        }
        if (config.security?.capDrop) {
            for (const cap of config.security.capDrop) {
                args.push('--cap-drop', cap);
            }
        }
        if (config.security?.noNewPrivileges) {
            args.push('--security-opt', 'no-new-privileges');
        }
        if (config.security?.apparmor) {
            args.push('--security-opt', `apparmor=${config.security.apparmor}`);
        }

        // network
        if (config.networkMode) {
            args.push('--network', config.networkMode);
        }

        // extra hosts
        if (config.extraHosts) {
            for (const host of config.extraHosts as any[]) {
                if (typeof host === 'string') {
                    args.push('--add-host', host);
                } else {
                    args.push('--add-host', `${host.host}:${host.ip}`);
                }
            }
        }

        // sysctls
        if (config.sysctls) {
            for (const [k, v] of Object.entries(config.sysctls)) {
                args.push('--sysctl', `${k}=${v}`);
            }
        }

        // stop signal / timeout
        if (config.stop?.signal) {
            args.push('--stop-signal', config.stop.signal);
        }
        if (config.stop?.gracePeriodSec !== undefined) {
            args.push('--stop-timeout', String(config.stop.gracePeriodSec));
        }

        // resources
        if (config.resources?.cpus) {
            args.push('--cpus', String(config.resources.cpus));
        }
        if (config.resources?.memory) {
            args.push('--memory', String(config.resources.memory));
        }

        // image
        if (!config.image) {
            throw new Error('ContainerConfig.image is required for docker run');
        }
        args.push(config.image);

        // command override
        if (config.command) {
            if (Array.isArray(config.command)) {
                args.push(...config.command);
            } else {
                args.push(config.command);
            }
        }

        return args.join(' ');
    }

    destroy(): void {
        // destroy all timers
        Object.keys(this.#timers.container).forEach((id: string) => {
            clearTimeout(this.#timers.container[id]);
        });
        if (this.#timers.images) {
            clearInterval(this.#timers.images);
            delete this.#timers.images;
        }
        if (this.#timers.containers) {
            clearInterval(this.#timers.containers);
            delete this.#timers.containers;
        }
        if (this.#timers.info) {
            clearInterval(this.#timers.info);
            delete this.#timers.info;
        }
    }
}
