export type ImageName = string;
export type ContainerName = string;
export type DockerContainerInspect = {
    Id: string;
    Created: string;
    Path: string;
    Args: string[];
    Stats?: ContainerStats;
    State: {
        Status: 'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead';
        Running: boolean;
        Paused: boolean;
        Restarting: boolean;
        OOMKilled: boolean;
        Dead: boolean;
        Pid: number;
        ExitCode: number;
        Error: string;
        StartedAt: string;
        FinishedAt: string;
    };
    Image: string;
    ResolvConfPath: string;
    HostnamePath: string;
    HostsPath: string;
    LogPath: string;
    Name: string;
    RestartCount: number;
    Driver: string;
    Platform: string;
    MountLabel: string;
    ProcessLabel: string;
    AppArmorProfile: string;
    ExecIDs: null | string[];
    HostConfig: {
        Binds: string[];
        ContainerIDFile: string;
        LogConfig: {
            Type: 'json-file' | 'local' | 'syslog' | 'journald' | 'gelf' | 'fluentd' | 'awslogs' | 'splunk' | 'none';
            Config: Record<string, string>;
        };
        NetworkMode: 'bridge' | 'host' | 'none' | 'container';
        PortBindings: Record<
            string,
            Array<{
                HostIp: string;
                HostPort: string;
            }>
        >;
        RestartPolicy: {
            Name: string;
            MaximumRetryCount: number;
        };
        AutoRemove: boolean;
        VolumeDriver: string;
        VolumesFrom: null | string[];
        ConsoleSize: [number, number];
        CapAdd: null | string[];
        CapDrop: null | string[];
        CgroupnsMode: string;
        Dns: string[];
        DnsOptions: string[];
        DnsSearch: string[];
        ExtraHosts: null | string[];
        GroupAdd: null | string[];
        IpcMode: 'none' | 'host';
        Cgroup: string;
        Links: null | string[];
        OomScoreAdj: number;
        PidMode: 'host';
        Privileged: boolean;
        PublishAllPorts: boolean;
        ReadonlyRootfs: boolean;
        SecurityOpt: null | string[];
        UTSMode: string;
        UsernsMode: string;
        ShmSize: number;
        Runtime: string;
        Isolation: string;
        CpuShares: number;
        Memory: number;
        NanoCpus: number;
        CgroupParent: string;
        BlkioWeight: number;
        BlkioWeightDevice: any[];
        BlkioDeviceReadBps: any[];
        BlkioDeviceWriteBps: any[];
        BlkioDeviceReadIOps: any[];
        BlkioDeviceWriteIOps: any[];
        CpuPeriod: number;
        CpuQuota: number;
        CpuRealtimePeriod: number;
        CpuRealtimeRuntime: number;
        CpusetCpus: string;
        CpusetMems: string;
        Devices: any[];
        DeviceCgroupRules: null | string[];
        DeviceRequests: null | any[];
        MemoryReservation: number;
        MemorySwap: number;
        MemorySwappiness: null | number;
        OomKillDisable: null | boolean;
        PidsLimit: null | number;
        Ulimits: any[];
        CpuCount: number;
        CpuPercent: number;
        IOMaximumIOps: number;
        IOMaximumBandwidth: number;
        MaskedPaths: string[];
        ReadonlyPaths: string[];
        /** Sysctls (e.g. net.core.somaxconn=1024) */
        Sysctls?: Record<string, string>; // --sysctl
        Init?: boolean;
    };
    GraphDriver: {
        Data: {
            ID: string;
            LowerDir: string;
            MergedDir: string;
            UpperDir: string;
            WorkDir: string;
        };
        Name: string;
    };
    Mounts: Array<{
        Type: 'bind' | 'volume' | 'tmpfs' | 'npipe';
        Source: string;
        Destination: string;
        Mode: string;
        RW: boolean;
        Propagation: string;
    }>;
    Config: {
        Hostname: string;
        Domainname: string;
        User: string;
        AttachStdin: boolean;
        AttachStdout: boolean;
        AttachStderr: boolean;
        ExposedPorts: Record<string, Record<string, string>>;
        Tty: boolean;
        OpenStdin: boolean;
        StdinOnce: boolean;
        Env: string[];
        Cmd: null | string[];
        Image: string;
        Volumes: null | Record<string, unknown>;
        WorkingDir: string;
        Entrypoint: string[];
        OnBuild: null | string[];
        Labels: Record<string, string>;
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        StopSignal?: 'SIGTERM' | 'SIGKILL' | string; // e.g. "SIGTERM"
        /** --stop-timeout (seconds) */
        StopTimeout?: number;
    };
    NetworkSettings: {
        Bridge: string;
        SandboxID: string;
        SandboxKey: string;
        Ports: Record<
            string,
            Array<{
                HostIp: string;
                HostPort: string;
            }>
        >;
        HairpinMode: boolean;
        LinkLocalIPv6Address: string;
        LinkLocalIPv6PrefixLen: number;
        SecondaryIPAddresses: null | any[];
        SecondaryIPv6Addresses: null | any[];
        EndpointID: string;
        Gateway: string;
        GlobalIPv6Address: string;
        GlobalIPv6PrefixLen: number;
        IPAddress: string;
        IPPrefixLen: number;
        IPv6Gateway: string;
        MacAddress: string;
        Networks: Record<
            string,
            {
                IPAMConfig: null;
                Links: null;
                Aliases: null;
                MacAddress: string;
                DriverOpts: null;
                GwPriority: number;
                NetworkID: string;
                EndpointID: string;
                Gateway: string;
                IPAddress: string;
                IPPrefixLen: number;
                IPv6Gateway: string;
                GlobalIPv6Address: string;
                GlobalIPv6PrefixLen: number;
                DNSNames: null;
            }
        >;
    };
};

export type DockerImageInspect = {
    Id: string;
    RepoTags: string[];
    RepoDigests: string[];
    Parent: string;
    Comment: string;
    Created: string;
    DockerVersion: string;
    Author: string;
    Architecture: string;
    Os: string;
    Size: number;
    GraphDriver: {
        Data: {
            LowerDir: string;
            MergedDir: string;
            UpperDir: string;
            WorkDir: string;
        };
        Name: string;
    };
    RootFS: {
        Type: string;
        Layers: string[];
    };
    Metadata: {
        LastTagTime: string;
    };
    Config: {
        Cmd: null | string[];
        Entrypoint: string[];
        Env: string[];
        ExposedPorts: Record<string, Record<string, string>>;
        Labels: null | Record<string, string>;
        OnBuild: null | string[];
        User: string;
        Volumes: null | Record<string, unknown>;
        WorkingDir: string;
    };
};

// Enums & Helper Types
export type Protocol = 'tcp' | 'udp' | 'sctp';
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type NetworkMode = 'bridge' | 'host' | 'none' | 'container' | string; // with container:<id|name> in networkContainer // custom network name
export type RestartPolicy = 'no' | 'always' | 'unless-stopped' | 'on-failure';
export type LogDriver =
    | 'json-file'
    | 'local'
    | 'syslog'
    | 'journald'
    | 'gelf'
    | 'fluentd'
    | 'awslogs'
    | 'splunk'
    | 'none';

export interface PortBinding {
    /** Container port (required) */
    containerPort: number | string;
    /** Host port (optional for publishAllPorts) */
    hostPort?: number | string;
    /** Host IP (e.g. 127.0.0.1) */
    hostIP?: string;
    protocol?: Protocol; // default tcp
}

export type EnvVar = Record<string, string>;

export interface LabelMap {
    [key: string]: string;
}

export interface Ulimit {
    name:
        | 'core'
        | 'cpu'
        | 'data'
        | 'fsize'
        | 'locks'
        | 'memlock'
        | 'msgqueue'
        | 'nice'
        | 'nofile'
        | 'nproc'
        | 'rss'
        | 'rtprio'
        | 'rttime'
        | 'sigpending'
        | 'stack';
    soft?: number;
    hard?: number;
}

export interface Healthcheck {
    /** Equivalent to --health-cmd / compose.healthcheck.test */
    test: string[] | ['CMD-SHELL', string] | ['CMD', ...string[]] | ['NONE'];
    /** --health-interval / compose.healthcheck.interval (ms) */
    interval?: number;
    /** --health-timeout / compose.healthcheck.timeout (ms) */
    timeout?: number;
    /** --health-retries / compose.healthcheck.retries */
    retries?: number;
    /** --health-start-period / compose.healthcheck.start_period (ms) */
    startPeriod?: number;
}

export interface DeviceMapping {
    /** host device path, e.g. /dev/video0 */
    hostPath: string;
    /** container path, e.g. /dev/video0 */
    containerPath?: string;
    /** cgroup permissions, e.g. "rwm" */
    permissions?: string;
}

export interface VolumeMount {
    /** bind | volume | tmpfs | npipe */
    type: 'bind' | 'volume' | 'tmpfs' | 'npipe';
    /** host path or named volume */
    source?: string;
    /** container path (mountpoint) */
    target: string;
    /** read-only mount */
    readOnly?: boolean;
    /** consistency hints (Docker Desktop/macOS) */
    consistency?: 'default' | 'consistent' | 'cached' | 'delegated';
    /** volume options (compose-like) */
    volumeOptions?: {
        nocopy?: boolean;
        labels?: LabelMap;
    };
    /** bind options */
    bindOptions?: {
        propagation?: 'rprivate' | 'private' | 'rshared' | 'shared' | 'rslave' | 'slave';
        selinux?: 'z' | 'Z';
    };
    /** tmpfs options */
    tmpfsOptions?: {
        size?: number; // bytes
        mode?: number; // e.g. 1777
    };
}

export interface Resources {
    /** --cpus (e.g. 0.5), --cpu-shares, --cpu-quota/period, --cpuset-cpus */
    cpus?: number;
    cpuShares?: number;
    cpuQuota?: number;
    cpuPeriod?: number;
    cpusetCpus?: string; // e.g. "0-2,4"
    /** --memory, --memory-swap, --memory-reservation (bytes) */
    memory?: number;
    memorySwap?: number; // -1 = unlimited
    memoryReservation?: number;
    /** --pids-limit */
    pidsLimit?: number;
    /** NVIDIA GPUs: --gpus '"all"' or '"device=1,2"' */
    gpus?: 'all' | { count?: number; devices?: number[] | string[] };
    /** shm size (bytes), --shm-size */
    shmSize?: number;
    /** read-only root FS, --read-only */
    readOnlyRootFilesystem?: boolean;
}

export interface Logging {
    driver?: LogDriver; // --log-driver
    options?: Record<string, string>; // --log-opt key=value
}

export interface Security {
    /** --privileged */
    privileged?: boolean;
    /** --cap-add / --cap-drop */
    capAdd?: string[];
    capDrop?: string[];
    /** user namespace: --userns */
    usernsMode?: string; // e.g. "host", "private"
    /** --ipc / --pid */
    ipc?: 'none' | 'host' | 'private';
    pid?: 'host' | '';
    /** SELinux labels (compose style) */
    selinuxLabels?: string[];
    /** seccomp profile path or "unconfined" */
    seccomp?: string;
    /** apparmor profile */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    apparmor?: 'unconfined' | 'docker-default' | string;
    /** device cgroup rules */
    deviceCgroupRules?: string[]; // e.g. "c 189:* rmw"
    /** extra groups inside container */
    groupAdd?: (number | string)[];
    /** no-new-privileges: true | false */
    noNewPrivileges?: boolean;
}

export interface DNSConfig {
    /** --dns */
    servers?: string[];
    /** --dns-search */
    search?: string[];
    /** --dns-opt */
    options?: string[];
}

export interface NetworkAttachment {
    /** target network name */
    name?: string; // compose "networks:" key or docker network name
    /** aliases within that network */
    aliases?: string[];
    /** static IPs (IPv4/IPv6) */
    ipv4Address?: string;
    ipv6Address?: string;
    /** links (legacy) */
    links?: string[];
    /** driver options (compose) */
    driverOpts?: Record<string, string>;
}

export interface BuildConfig {
    /** compose: build context */
    context: string;
    dockerfile?: string;
    target?: string;
    args?: Record<string, string>;
    labels?: LabelMap;
    cacheFrom?: string[];
    network?: string; // build-time network
    shmSize?: string | number;
    extraHosts?: string[]; // ["host:ip"]
}

export interface Restart {
    policy?: RestartPolicy; // --restart
    /** only for on-failure */
    maxRetries?: number;
}

export interface StopConfig {
    /** --stop-signal */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    signal?: 'SIGTERM' | 'SIGKILL' | string; // e.g. "SIGTERM"
    /** --stop-timeout (seconds) */
    gracePeriodSec?: number;
}

export interface HostMapping {
    /** "hostname:ip" or split fields */
    host: string;
    ip: string;
}

// The master container configuration you can use in your manager:
export interface ContainerConfig {
    /** If false, container is not started, but still visible in the list */
    iobEnabled?: boolean; // ioBroker setting

    /** If true, container is stopped when adapter unloads */
    iobStopOnUnload?: boolean; // ioBroker setting

    /** If true, the image will be automatically updated by every start */
    iobAutoImageUpdate?: boolean; // ioBroker setting

    /** If true, container will be monitored and if fails restarted */
    iobMonitoringEnabled?: boolean; // ioBroker setting

    /** Image reference (repo:tag or ID). If omitted and build is set, the image comes from build */
    image: ImageName;

    /** Compose-style build (optional) */
    build?: BuildConfig;

    /** --name */
    name: ContainerName;

    /** Command & Entrypoint */
    command?: string[] | string; // CMD override
    entrypoint?: string[] | string; // --entrypoint

    /** User & Working dir */
    user?: string | number; // --user (uid[:gid] | name)
    workdir?: string; // --workdir

    /** Hostname & domain */
    hostname?: string; // --hostname
    domainname?: string;
    macAddress?: string;

    /** Environment & Labels */
    environment?: EnvVar; // -e, --env-file merged by your tool if needed
    envFile?: string[]; // compose-style
    labels?: LabelMap; // --label
    labelFile?: string[]; // less common

    /** TTY & STDIN */
    tty?: boolean; // -t
    stdinOpen?: boolean; // -i
    attachStdin?: boolean;
    attachStdout?: boolean;
    attachStderr?: boolean;
    openStdin?: boolean;

    /** Detach & Auto-remove */
    detach?: boolean; // -d
    // If true, container is removed after exit (cannot be used with restart policies)
    removeOnExit?: boolean; // --rm

    /** Ports */
    publishAllPorts?: boolean; // -P
    ports?: PortBinding[]; // -p

    /** Expose (container-only visibility) */
    expose?: (number | string)[];

    /** Volumes & Mounts */
    mounts?: VolumeMount[]; // --mount (recommended)
    volumes?: string[]; // legacy "-v" strings also acceptable if you want

    /** Devices */
    devices?: DeviceMapping[]; // --device

    /** Extra hosts (host:ip) */
    extraHosts?: HostMapping[] | string[]; // --add-host

    /** DNS */
    dns?: DNSConfig;

    /** Networks */
    networkMode?: NetworkMode; // --network
    networkContainer?: string; // when networkMode === "container"
    networks?: NetworkAttachment[]; // compose-style multiple networks

    /** Healthcheck */
    healthcheck?: Healthcheck;

    /** Restart */
    restart?: Restart;

    /** Resources / Limits */
    resources?: Resources;

    /** Logging */
    logging?: Logging;

    /** Security */
    security?: Security;

    /** Sysctls (e.g. net.core.somaxconn=1024) */
    sysctls?: Record<string, string>; // --sysctl

    /** Depends on other containers (compose-style) */
    dependsOn?:
        | string[]
        | Record<string, { condition?: 'service_started' | 'service_healthy' | 'service_completed_successfully' }>;

    /** Init process (tini), --init */
    init?: boolean;

    /** Working lifecycle */
    stop?: StopConfig;

    /** IPC shm mount as tmpfs paths: --tmpfs */
    tmpfs?: (string | { target: string; size?: number; mode?: number })[];

    /** Read-only root plus per-path write exceptions (compose: read_only + tmpfs/mounts) */
    readOnly?: boolean;

    /** Timezone, locale (via env usually), but explicit here if your manager wants to enforce */
    timezone?: string;

    /** Custom arbitrary labels for your manager’s bookkeeping */
    __meta?: Record<string, any>;
}

export type SizeInfo = {
    total: number;
    reclaimable: number;
    active: number;
    size: number;
};

export type DiskUsage = {
    images?: SizeInfo;
    containers?: SizeInfo;
    volumes?: SizeInfo;
    buildCache?: SizeInfo;
    total: { size: number; reclaimable: number };
};

export type ContainerInfo = {
    id: string;
    image: ImageName;
    command: string;
    createdAt: string;
    status: 'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead';
    uptime: string;
    ports: string;
    names: string;
    httpLinks?: { [ip: string]: string[] };
};

export type ImageInfo = {
    repository: string;
    tag: string;
    id: string;
    createdSince: string;
    size: number;
};
export type NetworkDriver = 'bridge' | 'container' | 'host' | 'macvlan' | 'overlay';
export type NetworkInfo = {
    name: string;
    id: string;
    driver: NetworkDriver;
    scope: string;
};

export type DockerImageTagsResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        creator: number;
        id: number;
        images: {
            architecture: string;
            features: string;
            variant: string | null;
            digest: string;
            os: string;
            os_features: string;
            os_version: string | null;
            size: number;
            status: string;
            last_pulled: string;
            last_pushed: string;
        }[];
        last_updated: string;
        last_updater: number;
        last_updater_username: string;
        name: string;
        repository: number;
        full_size: number;
        v2: boolean;
        tag_status: string;
        tag_last_pulled: string;
        tag_last_pushed: string;
        media_type: string;
        content_type: string;
        digest: string;
    }[];
};

export interface ContainerStats {
    cpu: number;
    memUsed: number;
    memMax: number;
    netRead: number;
    netWrite: number;
    processes: number;
    blockIoRead: number;
    blockIoWrite: number;
    ts: number;
}

export interface ContainerStatus extends ContainerStats {
    status: 'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead' | 'unknown';
    statusTs: number;
}
