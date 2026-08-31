import type { DiscoveryObject } from '../dialogs/GenerateInputsModal';

/**
 * How many proposals of the last discovery scan still want a decision.
 *
 * The discovery adapter can scan on a timer, so `system.discovery` may hold results nobody has
 * seen. `comment.ack` is what the "Ignore" checkbox of the discovery dialog writes, so a
 * proposal without it is one that is neither created nor dismissed - which is exactly what the
 * badge on the discovery button counts and what decides whether the dialog opens on the result
 * page instead of asking for another scan.
 *
 * @param data the `system.discovery` object
 */
export function countUnhandledProposals(data: DiscoveryObject | null | undefined): number {
    if (!data?.native?.lastScan) {
        return 0;
    }
    return (data.native.newInstances || []).filter(instance => !instance?.comment?.ack).length;
}
