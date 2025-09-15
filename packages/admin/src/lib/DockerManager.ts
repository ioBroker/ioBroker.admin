// This class implements docker commands using CLI and
// it monitors periodically the docker daemon status.
// It manages containers defined in adapter.config.containers and monitors other containers

import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import type {
    ContainerConfig,
    ContainerInfo,
    ContainerStats,
    ContainerStatus,
    DiskUsage,
    DockerContainerInspect,
    DockerImageInspect,
    ImageInfo,
    ContainerName,
    ImageName,
} from './dockerManager.types';

const execPromise = promisify(exec);

// remove undefined entries recursively
function removeUndefined(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => (v && typeof v === 'object' ? removeUndefined(v) : v)).filter(v => v !== undefined);
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .map(([k, v]) => [k, v && typeof v === 'object' ? removeUndefined(v) : v])
                .filter(([_, v]) => v !== undefined),
        );
    }
    return obj;
}

const dockerDefaults: Record<string, any> = {
    Tty: false,
    OpenStdin: false,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    PublishAllPorts: false,
    RestartPolicy: { Name: 'no', MaximumRetryCount: 0 },
    LogConfig: { Type: 'json-file', Config: {} },
    Privileged: false,
    ReadonlyRootfs: false,
    Init: false,
    StopSignal: 'SIGTERM',
    StopTimeout: undefined,
    NetworkMode: 'default',
};

function isDefault(value: any, def: any): boolean {
    return JSON.stringify(value) === JSON.stringify(def);
}

function deepCompare(obj1: any, obj2: any, path: string[] = []): string[] {
    const diffs: string[] = [];

    if (typeof obj1 !== typeof obj2) {
        diffs.push(path.join('.'));
    }

    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
            diffs.push(path.join('.'));
        }
    }

    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of keys) {
        // ignore iob* properties as they belong to ioBroker configuration
        if (key.startsWith('iob')) {
            continue;
        }
        diffs.push(...deepCompare(obj1[key], obj2[key], [...path, key]));
    }

    return diffs;
}

export interface DockerManagerAdapterConfig {
    containers?: ContainerConfig[];
}

export default class DockerManager {
    #installed: boolean = false;
    #dockerVersion: string = '';
    #needSudo: boolean = false;
    readonly #waitReady: Promise<void>;
    readonly #adapter: ioBroker.Adapter;
    readonly #ownContainers: ContainerConfig[] = [];
    #monitoringInterval: NodeJS.Timeout | null = null;
    #ownContainersStats: { [name: string]: ContainerStatus } = {};

    constructor(adapter: ioBroker.Adapter, containers?: ContainerConfig[]) {
        this.#adapter = adapter;
        this.#ownContainers = containers || [];
        this.#waitReady = new Promise<void>(resolve => this.#init().then(() => resolve()));
    }

    /** Wait till the check if docker is installed and the daemon is running is ready */
    isReady(): Promise<void> {
        return this.#waitReady;
    }

    /**
     * Convert information from inspect to docker configuration to start it
     *
     * @param inspect Inspect information
     */
    static mapInspectToConfig(inspect: DockerContainerInspect): ContainerConfig {
        let obj: ContainerConfig = {
            image: inspect.Config.Image,
            name: inspect.Name.replace(/^\//, ''),
            command: inspect.Config.Cmd ?? undefined,
            entrypoint: inspect.Config.Entrypoint ?? undefined,
            user: inspect.Config.User ?? undefined,
            workdir: inspect.Config.WorkingDir ?? undefined,
            hostname: inspect.Config.Hostname ?? undefined,
            domainname: inspect.Config.Domainname ?? undefined,
            macAddress: inspect.NetworkSettings.MacAddress ?? undefined,
            environment: inspect.Config.Env
                ? Object.fromEntries(
                      inspect.Config.Env.map(e => {
                          const [key, ...rest] = e.split('=');
                          return [key, rest.join('=')];
                      }),
                  )
                : undefined,
            labels: inspect.Config.Labels ?? undefined,
            tty: inspect.Config.Tty,
            stdinOpen: inspect.Config.OpenStdin,
            attachStdin: inspect.Config.AttachStdin,
            attachStdout: inspect.Config.AttachStdout,
            attachStderr: inspect.Config.AttachStderr,
            openStdin: inspect.Config.OpenStdin,
            publishAllPorts: inspect.HostConfig.PublishAllPorts,
            ports: inspect.HostConfig.PortBindings
                ? Object.entries(inspect.HostConfig.PortBindings).flatMap(([containerPort, bindings]) =>
                      bindings.map(binding => ({
                          containerPort: containerPort.split('/')[0],
                          protocol: (containerPort.split('/')[1] as 'tcp' | 'udp') || 'tcp',
                          hostPort: binding.HostPort,
                          hostIP: binding.HostIp,
                      })),
                  )
                : undefined,
            mounts: inspect.Mounts?.map(mount => ({
                type: mount.Type,
                source: mount.Source,
                target: mount.Destination,
                readOnly: mount.RW,
            })),
            volumes: inspect.Config.Volumes ? Object.keys(inspect.Config.Volumes) : undefined,
            extraHosts: inspect.HostConfig.ExtraHosts ?? undefined,
            dns: {
                servers: inspect.HostConfig.Dns,
                search: inspect.HostConfig.DnsSearch,
                options: inspect.HostConfig.DnsOptions,
            },
            networkMode: inspect.HostConfig.NetworkMode,
            networks: inspect.NetworkSettings.Networks
                ? Object.entries(inspect.NetworkSettings.Networks).map(([name, net]) => ({
                      name,
                      aliases: net.Aliases ?? undefined,
                      ipv4Address: net.IPAddress,
                      ipv6Address: net.GlobalIPv6Address,
                      driverOpts: net.DriverOpts ?? undefined,
                  }))
                : undefined,
            restart: {
                policy: inspect.HostConfig.RestartPolicy.Name as any,
                maxRetries: inspect.HostConfig.RestartPolicy.MaximumRetryCount,
            },
            resources: {
                cpuShares: inspect.HostConfig.CpuShares,
                cpuQuota: inspect.HostConfig.CpuQuota,
                cpuPeriod: inspect.HostConfig.CpuPeriod,
                cpusetCpus: inspect.HostConfig.CpusetCpus,
                memory: inspect.HostConfig.Memory,
                memorySwap: inspect.HostConfig.MemorySwap,
                memoryReservation: inspect.HostConfig.MemoryReservation,
                pidsLimit: inspect.HostConfig.PidsLimit ?? undefined,
                shmSize: inspect.HostConfig.ShmSize,
                readOnlyRootFilesystem: inspect.HostConfig.ReadonlyRootfs,
            },
            logging: {
                driver: inspect.HostConfig.LogConfig.Type,
                options: inspect.HostConfig.LogConfig.Config,
            },
            security: {
                privileged: inspect.HostConfig.Privileged,
                capAdd: inspect.HostConfig.CapAdd ?? undefined,
                capDrop: inspect.HostConfig.CapDrop ?? undefined,
                usernsMode: inspect.HostConfig.UsernsMode ?? undefined,
                ipc: inspect.HostConfig.IpcMode,
                pid: inspect.HostConfig.PidMode,
                seccomp:
                    inspect.HostConfig.SecurityOpt?.find(opt => opt.startsWith('seccomp='))?.split('=')[1] ?? undefined,
                apparmor: inspect.AppArmorProfile,
                groupAdd: inspect.HostConfig.GroupAdd ?? undefined,
                noNewPrivileges: undefined, // Nicht direkt verfügbar
            },
            sysctls: inspect.HostConfig.Sysctls ?? undefined,
            init: inspect.HostConfig.Init ?? undefined,
            stop: {
                signal: inspect.Config.StopSignal ?? undefined,
                gracePeriodSec: inspect.Config.StopTimeout ?? undefined,
            },
            readOnly: inspect.HostConfig.ReadonlyRootfs,
            timezone: undefined, // Nicht direkt verfügbar
            __meta: undefined, // Eigene Metadaten
        };

        obj = removeUndefined(obj);
        Object.keys(dockerDefaults).forEach(name => {
            if (isDefault((obj as any)[name], (dockerDefaults as any)[name])) {
                delete (obj as any)[name];
            }
        });

        return obj;
    }

    /**
     * Get information about the Docker daemon: is it running and which version
     *
     * @returns Object with version and daemonRunning
     */
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

    async #init(): Promise<void> {
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

    /**
     * Ensure that the given container is running with the actual configuration
     *
     * @param container Container configuration
     */
    async #ensureActualConfiguration(container: ContainerConfig): Promise<void> {
        // Check the configuration of the container
        const inspect = await this.containerInspect(container.name);
        if (inspect) {
            const existingConfig = DockerManager.mapInspectToConfig(inspect);
            const diffs = deepCompare(existingConfig, container);
            if (diffs.length) {
                this.#adapter.log.info(
                    `Configuration of own container ${container.name} has changed: ${diffs.join(
                        ', ',
                    )}. Restarting container...`,
                );
                const result = await this.containerReCreate(container);
                if (result.stderr) {
                    this.#adapter.log.warn(`Cannot recreate own container ${container.name}: ${result.stderr}`);
                }
            }

            // Check if container is running
            this.#adapter.log.debug(`Configuration of own container ${container.name} is up to date`);
            const status = await this.containerList(true);
            const containerInfo = status.find(it => it.names === container.name);
            if (containerInfo) {
                if (containerInfo.status !== 'running' && containerInfo.status !== 'restarting') {
                    // Start the container
                    this.#adapter.log.info(`Starting own container ${container.name}`);
                    try {
                        const result = await this.containerStart(containerInfo.id);
                        if (result.stderr) {
                            this.#adapter.log.warn(`Cannot start own container ${container.name}: ${result.stderr}`);
                        }
                    } catch (e) {
                        this.#adapter.log.warn(`Cannot start own container ${container.name}: ${e.message}`);
                    }
                } else {
                    this.#adapter.log.debug(`Own container ${container.name} is already running`);
                }
            } else {
                this.#adapter.log.warn(`Own container ${container.name} not found in container list after recreation`);
            }
        }
    }

    async #checkOwnContainers(): Promise<void> {
        if (!this.#ownContainers.length) {
            return;
        }
        const status = await this.containerList(true);
        let images = await this.imageList();
        let anyStartedOrRunning = false;
        for (let c = 0; c < this.#ownContainers.length; c++) {
            const container = this.#ownContainers[c];
            if (container.iobEnabled !== false) {
                let containerInfo = status.find(it => it.names === container.name);
                let image = images.find(it => `${it.repository}:${it.tag}` === container.image);
                if (container.iobAutoImageUpdate) {
                    // ensure that the image is actual
                    const newImage = await this.imageUpdate(container.image, true);
                    if (newImage) {
                        this.#adapter.log.info(
                            `Image ${container.image} for own container ${container.name} was updated`,
                        );
                        if (containerInfo) {
                            // destroy current container
                            await this.containerRemove(containerInfo.id);
                            containerInfo = undefined;
                        }
                        image = newImage;
                    }
                } else if (!image) {
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
                    image = images.find(it => `${it.repository}:${it.tag}` === container.image);
                    if (!image) {
                        this.#adapter.log.warn(
                            `Image ${container.image} for own container ${container.name} not found after pull`,
                        );
                        continue;
                    }
                }

                if (containerInfo) {
                    await this.#ensureActualConfiguration(container);
                    anyStartedOrRunning ||= !!container.iobMonitoringEnabled;
                } else {
                    // Create and start the container, as the container was not found
                    this.#adapter.log.info(`Creating and starting own container ${container.name}`);

                    try {
                        const result = await this.containerRun(container);
                        if (result.stderr) {
                            this.#adapter.log.warn(`Cannot start own container ${container.name}: ${result.stderr}`);
                        } else {
                            anyStartedOrRunning ||= !!container.iobMonitoringEnabled;
                        }
                    } catch (e) {
                        this.#adapter.log.warn(`Cannot start own container ${container.name}: ${e.message}`);
                    }
                }
            }
        }

        if (anyStartedOrRunning) {
            this.#monitoringInterval ||= setInterval(() => this.#monitorOwnContainers(), 60000);
        }
    }

    async #monitorOwnContainers(): Promise<void> {
        // get the status of containers
        const containers = await this.containerList();
        // Check the status of own containers
        for (let c = 0; c < this.#ownContainers.length; c++) {
            const container = this.#ownContainers[c];
            if (container.iobEnabled !== false && container.iobMonitoringEnabled) {
                // Check if container is running
                const running = containers.find(it => it.names === container.name);
                if (!running || (running.status !== 'running' && running.status !== 'restarting')) {
                    this.#adapter.log.warn(`Own container ${container.name} is not running. Restarting...`);
                    try {
                        const result = await this.containerStart(container.name);
                        if (result.stderr) {
                            this.#adapter.log.warn(`Cannot start own container ${container.name}: ${result.stderr}`);
                            this.#ownContainersStats[container.name] = {
                                ...this.#ownContainersStats[container.name],
                                status: running?.status || 'unknown',
                                statusTs: Date.now(),
                            };
                            continue;
                        }
                    } catch (e) {
                        this.#adapter.log.warn(`Cannot start own container ${container.name}: ${e.message}`);
                        this.#ownContainersStats[container.name] = {
                            ...this.#ownContainersStats[container.name],
                            status: running?.status || 'unknown',
                            statusTs: Date.now(),
                        };
                        continue;
                    }
                }

                // check the stats
                this.#ownContainersStats[container.name] = {
                    ...((await this.containerGetRamAndCpuUsage(container.name)) || ({} as ContainerStats)),
                    status: running?.status || 'unknown',
                    statusTs: Date.now(),
                };
            }
        }
    }

    /** Read own container stats */
    getOwnContainerStats(): { [name: string]: ContainerStatus } {
        return this.#ownContainersStats;
    }

    async containerGetRamAndCpuUsage(containerNameOrId: ContainerName): Promise<ContainerStats | null> {
        try {
            const { stdout } = await this.#exec(
                `stats ${containerNameOrId} --no-stream --format "{{.CPUPerc}};{{.MemUsage}};{{.NetIO}};{{.BlockIO}};{{.PIDs}}"`,
            );
            // Example: "0.15%;12.34MiB / 512MiB;1.2kB / 2.3kB;0B / 0B;5"
            const [cpuStr, memStr, netStr, blockIoStr, pid] = stdout.trim().split(';');
            const [memUsed, memMax] = memStr.split('/').map(it => it.trim());
            const [netRead, netWrite] = netStr.split('/').map(it => it.trim());
            const [blockIoRead, blockIoWrite] = blockIoStr.split('/').map(it => it.trim());

            return {
                ts: Date.now(),
                cpu: parseFloat(cpuStr.replace('%', '').replace(',', '.')),
                memUsed: this.#parseSize(memUsed.replace('iB', 'B')),
                memMax: this.#parseSize(memMax.replace('iB', 'B')),
                netRead: this.#parseSize(netRead.replace('iB', 'B')),
                netWrite: this.#parseSize(netWrite.replace('iB', 'B')),
                processes: parseInt(pid, 10),
                blockIoRead: this.#parseSize(blockIoRead.replace('iB', 'B')),
                blockIoWrite: this.#parseSize(blockIoWrite.replace('iB', 'B')),
            };
        } catch (e) {
            this.#adapter.log.debug(`Cannot get stats: ${e.message}`);
            return null;
        }
    }

    /**
     * Update the image if a newer version is available
     *
     * @param image Image name with tag
     * @param ignoreIfNotExist If true, do not throw error if image does not exist
     * @returns New image info if image was updated, null if no update was necessary
     */
    async imageUpdate(image: ImageName, ignoreIfNotExist?: boolean): Promise<ImageInfo | null> {
        const list = await this.imageList();
        const existingImage = list.find(it => `${it.repository}:${it.tag}` === image);
        if (!existingImage && !ignoreIfNotExist) {
            throw new Error(`Image ${image} not found`);
        }
        // Pull the image
        const result = await this.imagePull(image);
        if (result.stderr) {
            throw new Error(`Cannot pull image ${image}: ${result.stderr}`);
        }
        const newList = await this.imageList();
        const newImage = newList.find(it => `${it.repository}:${it.tag}` === image);
        if (!newImage) {
            throw new Error(`Image ${image} not found after pull`);
        }
        // If image ID has changed, image was updated
        return !existingImage || existingImage.id !== newImage.id ? newImage : null;
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

    /** Get disk usage information */
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
                let size: number | undefined;
                let reclaimable: number | undefined;

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
                result.total.size += size || 0;
                result.total.reclaimable += reclaimable || 0;
            }
        }
        return result;
    }

    /** Pull an image from the registry */
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

    /** Autocomplete image names from Docker Hub */
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

    /**
     * Create and start a container with the given configuration. No checks are done.
     */
    async containerRun(config: ContainerConfig): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`run ${this.#toDockerRun(config)}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /**
     * Create a container with the given configuration without starting it. No checks are done.
     */
    async containerCreate(config: ContainerConfig): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`create ${this.#toDockerRun(config)}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /**
     * Recreate a container
     *
     * This function checks if a container is running, stops it if necessary,
     * removes it and creates a new one with the given configuration.
     *
     * @param config new configuration
     * @returns stdout and stderr of the create command
     */
    async containerReCreate(config: ContainerConfig): Promise<{ stdout: string; stderr: string }> {
        try {
            // Get if the container is running
            let containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === config.name);
            if (containerInfo) {
                if (containerInfo.status === 'running' || containerInfo.status === 'restarting') {
                    const stopResult = await this.#exec(`stop ${containerInfo.id}`);
                    containers = await this.containerList();

                    if (containers.find(it => it.id === containerInfo.id && it.status === 'running')) {
                        this.#adapter.log.warn(`Cannot remove container: ${stopResult.stderr || stopResult.stderr}`);
                        throw new Error(`Container ${containerInfo.id} still running after stop`);
                    }
                }
                // Remove container
                const rmResult = await this.#exec(`rm ${containerInfo.id}`);

                containers = await this.containerList();
                if (containers.find(it => it.id === containerInfo.id)) {
                    this.#adapter.log.warn(`Cannot remove container: ${rmResult.stderr || rmResult.stderr}`);
                    throw new Error(`Container ${containerInfo.id} still found after stop`);
                }
            }
            return await this.#exec(`create ${this.#toDockerRun(config)}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /** List all images */
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

    /** Build an image from a Dockerfile */
    async imageBuild(dockerfilePath: string, tag: string): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`build -t ${tag} -f ${dockerfilePath} .`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /** Tag an image with a new tag */
    async imageTag(imageId: ImageName, newTag: string): Promise<{ stdout: string; stderr: string }> {
        try {
            return await this.#exec(`tag ${imageId} ${newTag}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /** Remove an image */
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

    /** Inspect an image */
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

    /**
     * Stop a container
     *
     * @param container Container name or ID
     */
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

    /**
     * Start a container
     *
     * @param container Container name or ID
     */
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

    /**
     * Restart a container
     *
     * This function restarts a container by its name or ID.
     * It accepts an optional timeout in seconds to wait before killing the container (default is 5 seconds).
     *
     * @param container Container name or ID
     * @param timeoutSeconds Timeout in seconds to wait before killing the container (default: 5)
     */
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

            return await this.#exec(`restart -t ${timeoutSeconds || 5} ${containerInfo.id}`);
        } catch (e) {
            return { stdout: '', stderr: e.message.toString() };
        }
    }

    /**
     * Remove the container and if necessary, stop it first
     *
     * @param container Container name or ID
     */
    async containerRemove(container: ContainerName): Promise<{ stdout: string; stderr: string }> {
        try {
            let containers = await this.containerList();
            // find ID of container
            const containerInfo = containers.find(it => it.names === container || it.id === container);
            if (!containerInfo) {
                throw new Error(`Container ${container} not found`);
            }
            // ensure that container is stopped
            if (containerInfo.status === 'running' || containerInfo.status === 'restarting') {
                // stop container
                const result = await this.#exec(`stop ${containerInfo.id}`);
                if (result.stderr) {
                    throw new Error(`Cannot stop container ${container}: ${result.stderr}`);
                }
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

    /**
     * List all containers
     *
     * @param all If true, list all containers. If false, list only running containers. Default is true.
     */
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

    /**
     * Get the logs of a container
     *
     * @param containerNameOrId Container name or ID
     * @param options Options for logs
     * @param options.tail Number of lines to show from the end of the logs
     * @param options.follow If true, follow the logs (not implemented yet)
     */
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
                throw new Error('Follow option is not implemented yet');
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

    /** Inspect a container */
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

    /** Stop own containers if necessary */
    async destroy(): Promise<void> {
        if (this.#monitoringInterval) {
            clearInterval(this.#monitoringInterval);
            this.#monitoringInterval = null;
        }

        for (const container of this.#ownContainers) {
            if (container.iobEnabled !== false && container.iobStopOnUnload) {
                this.#adapter.log.info(`Stopping own container ${container.name} on destroy`);
                try {
                    await this.containerStop(container.name);
                } catch (e) {
                    this.#adapter.log.warn(`Cannot stop own container ${container.name} on destroy: ${e.message}`);
                }
            }
        }
    }
}
