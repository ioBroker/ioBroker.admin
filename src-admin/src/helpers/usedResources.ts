/**
 * The exclusive resources a host lends to its instances - serial ports, TCP/UDP ports, USB devices,
 * Bluetooth adapters, GPIO pins. js-controller (from 8.0 on) keeps one state per type,
 * `system.host.<host>.usedResources.<type>`, holding a JSON array of registered resources.
 *
 * The states are declared read-only, but anything may write them, so an entry is only used once it
 * has the shape js-controller writes (`hasRegisteredResourceShape` in common-db).
 */

import type { AdminConnection } from '@iobroker/gui-components';

/** Pattern of the registry states of all hosts */
export const USED_RESOURCES_PATTERN = 'system.host.*.usedResources.*';

/** One registered resource, as js-controller stores it */
export interface UsedResource {
    /** Kind of the resource, e.g. `serialPort` - also the last segment of the state id */
    type: string;
    /** The type-specific payload, e.g. `{ port: 1883, bind: '0.0.0.0' }` */
    data: Record<string, string | number | boolean>;
    /** Instance that occupies or would occupy the resource, e.g. `mqtt.0` */
    instance: string;
    /** When it was registered (ms) */
    ts: number;
    /** `true` while the instance runs and holds the resource, `false` if it would take it when started */
    isBlocked: boolean;
}

/** A registered resource together with the host it is registered on */
export interface HostUsedResource extends UsedResource {
    /** `system.host.<name>` */
    hostId: string;
    /** Instances on the same host that registered the same resource */
    conflicts: string[];
}

const USED_RESOURCES_SEGMENT = '.usedResources.';

/**
 * The host of a `system.host.<name>.usedResources.<type>` state, or `null` for any other id
 *
 * @param id the state id
 */
export function hostOfUsedResourcesId(id: string): string | null {
    const pos = id.indexOf(USED_RESOURCES_SEGMENT);
    return id.startsWith('system.host.') && pos > 0 ? id.substring(0, pos) : null;
}

function isUsedResource(entry: unknown): entry is UsedResource {
    if (typeof entry !== 'object' || entry === null) {
        return false;
    }
    const candidate = entry as Partial<UsedResource>;
    return (
        typeof candidate.type === 'string' &&
        /^[A-Za-z0-9_-]{1,64}$/.test(candidate.type) &&
        typeof candidate.instance === 'string' &&
        !!candidate.instance &&
        typeof candidate.ts === 'number' &&
        typeof candidate.isBlocked === 'boolean' &&
        typeof candidate.data === 'object' &&
        candidate.data !== null &&
        !Array.isArray(candidate.data)
    );
}

/**
 * The entries of one `usedResources.<type>` state; anything that is not an entry is left out
 *
 * @param state the state
 */
export function parseUsedResources(state: ioBroker.State | null | undefined): UsedResource[] {
    if (!state || typeof state.val !== 'string' || !state.val) {
        return [];
    }
    try {
        const list: unknown = JSON.parse(state.val);
        return Array.isArray(list) ? list.filter(isUsedResource) : [];
    } catch {
        return [];
    }
}

/** Addresses a socket binds to when it wants every address of the host */
const WILDCARD_BIND_ADDRESSES = new Set(['0.0.0.0', '::', '*', '']);

/**
 * Whether two entries of one type describe a resource only one of them can have. The same rules as
 * the host applies when an instance registers (`usedResourcesOverlap` in js-controller): a port per
 * bind address and family, a serial port by its resolved device, a USB device by its path, all other
 * types by their whole payload.
 *
 * @param type the resource type
 * @param a one payload
 * @param b the other payload
 */
export function usedResourcesOverlap(type: string, a: UsedResource['data'], b: UsedResource['data']): boolean {
    if (type === 'tcpPort' || type === 'udpPort') {
        if (a.port !== b.port) {
            return false;
        }
        if (a.family !== undefined && b.family !== undefined && a.family !== b.family) {
            return false;
        }
        if (a.bind === undefined || b.bind === undefined) {
            return true;
        }
        const bindA = String(a.bind).trim();
        const bindB = String(b.bind).trim();
        return WILDCARD_BIND_ADDRESSES.has(bindA) || WILDCARD_BIND_ADDRESSES.has(bindB) || bindA === bindB;
    }
    if (type === 'serialPort') {
        return (a.device ?? a.port) === (b.device ?? b.port);
    }
    if (type === 'usb') {
        return a.path === b.path;
    }
    // one payload a subset of the other - so a GPIO pin without a chip meets the same pin on any chip
    const subset = (small: UsedResource['data'], big: UsedResource['data']): boolean =>
        Object.keys(small).every(key => small[key] === undefined || small[key] === big[key]);
    return subset(a, b) || subset(b, a);
}

/** Readable names of the types js-controller knows; anything else is shown as it is called */
export const USED_RESOURCE_TYPE_NAMES: Record<string, string> = {
    serialPort: 'Serial port',
    tcpPort: 'TCP port',
    udpPort: 'UDP port',
    usb: 'USB device',
    bluetooth: 'Bluetooth',
    gpio: 'GPIO',
};

/**
 * The ids of the registry states of the given hosts, for the types js-controller knows
 *
 * @param hostIds the hosts, e.g. `system.host.MSI`
 */
export function usedResourceStateIds(hostIds: string[]): string[] {
    return hostIds.flatMap(hostId =>
        Object.keys(USED_RESOURCE_TYPE_NAMES).map(type => `${hostId}.usedResources.${type}`),
    );
}

/**
 * Reads the registry states of the given hosts.
 *
 * Twice on purpose. By their ids, because `getForeignStates` resolves a pattern through the objects DB,
 * and the objects of these states can be missing: when js-controller starts, it deletes every object
 * under `system.host.<name>.` that is none of its own states, while the states themselves stay and are
 * written further. And by the pattern, which also catches a resource type that only an adapter knows.
 * The subscription needs no object either way, so changes arrive in both cases.
 *
 * @param socket the connection
 * @param hostIds the hosts to read, e.g. `system.host.MSI`
 */
export async function readUsedResourceStates(
    socket: AdminConnection,
    hostIds: string[],
): Promise<Record<string, ioBroker.State | null | undefined>> {
    const ids = usedResourceStateIds(hostIds);
    const pattern = hostIds.length === 1 ? `${hostIds[0]}.usedResources.*` : USED_RESOURCES_PATTERN;

    const [byId, byPattern] = await Promise.all([
        // an array of ids is passed through to the host as it is - only the typing knows the pattern alone
        ids.length
            ? socket.getForeignStates(ids as unknown as string).catch((e: unknown) => {
                  console.warn(`Cannot read the used resources: ${e as string}`);
                  return {};
              })
            : Promise.resolve({}),
        socket.getForeignStates(pattern).catch((e: unknown) => {
            console.warn(`Cannot read ${pattern}: ${e as string}`);
            return {};
        }),
    ]);

    const states: Record<string, ioBroker.State | null | undefined> = { ...byId, ...byPattern };
    // an id that does not exist comes back empty and would look like a host without a registry
    for (const id of Object.keys(states)) {
        if (!states[id]) {
            delete states[id];
        }
    }
    return states;
}

/**
 * All entries of all hosts, each with the instances of the same host that registered the same resource
 *
 * @param states the `system.host.*.usedResources.*` states, by id
 */
export function collectUsedResources(states: Record<string, ioBroker.State | null | undefined>): HostUsedResource[] {
    const result: HostUsedResource[] = [];
    for (const [id, state] of Object.entries(states)) {
        const hostId = hostOfUsedResourcesId(id);
        if (hostId) {
            for (const entry of parseUsedResources(state)) {
                result.push({ ...entry, hostId, conflicts: [] });
            }
        }
    }
    for (const entry of result) {
        entry.conflicts = result
            .filter(
                other =>
                    other.hostId === entry.hostId &&
                    other.type === entry.type &&
                    other.instance !== entry.instance &&
                    usedResourcesOverlap(entry.type, entry.data, other.data),
            )
            .map(other => other.instance);
    }
    return result.sort(
        (a, b) =>
            a.hostId.localeCompare(b.hostId) ||
            a.type.localeCompare(b.type) ||
            describeUsedResource(a).localeCompare(describeUsedResource(b), undefined, { numeric: true }) ||
            a.instance.localeCompare(b.instance),
    );
}

/**
 * The resource itself in one short text, e.g. `1883 (127.0.0.1, IPv4)` or `/dev/ttyUSB0 (115200 Bd)`
 *
 * @param resource the entry
 */
export function describeUsedResource(resource: Pick<UsedResource, 'type' | 'data'>): string {
    const data = resource.data;
    const extra: string[] = [];
    let main: string;
    switch (resource.type) {
        case 'tcpPort':
        case 'udpPort':
            main = String(data.port ?? '');
            if (data.bind !== undefined && !WILDCARD_BIND_ADDRESSES.has(String(data.bind).trim())) {
                extra.push(String(data.bind));
            }
            if (data.family !== undefined) {
                extra.push(`IPv${data.family}`);
            }
            break;
        case 'serialPort':
            main = String(data.port ?? '');
            if (data.device !== undefined && data.device !== data.port) {
                extra.push(`→ ${data.device}`);
            }
            if (data.baudRate !== undefined) {
                extra.push(`${data.baudRate} Bd`);
            }
            break;
        case 'usb':
            main = String(data.path ?? '');
            if (data.vendorId !== undefined || data.productId !== undefined) {
                extra.push(`${data.vendorId ?? '?'}:${data.productId ?? '?'}`);
            }
            break;
        case 'bluetooth':
            main = String(data.hci ?? '');
            break;
        case 'gpio':
            main = String(data.pin ?? '');
            if (data.chip !== undefined) {
                extra.push(String(data.chip));
            }
            break;
        default:
            main = Object.entries(data)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
    }
    return extra.length ? `${main} (${extra.join(', ')})` : main;
}
