import { type AdminConnection } from '@iobroker/gui-components';
import { GenericWorker, type EventType, type GenericEvent } from './GenericWorker';

export type InstanceEventType = EventType;

export type InstanceEvent = GenericEvent<'instance'>;

export class InstancesWorker extends GenericWorker<'instance'> {
    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'instance');
    }

    protected postProcessing(id: string, _obj: ioBroker.InstanceObject | null | undefined): void {
        // The connection keeps the instances it has read: a tab opened later, e.g. the quick access, showed
        // the ones of its last visit, without a newly installed adapter
        this.socket.getAdapterInstancesResetCache('');
        this.socket.getAdapterInstancesResetCache(id.split('.')[2]);
    }
}
