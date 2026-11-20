import { type AdminConnection } from '@iobroker/gui-components';
import { GenericWorker, type EventType, type GenericEvent } from './GenericWorker';

export type AdapterEventType = EventType;

export type AdapterEvent = GenericEvent<'adapter'>;

/** The adapter objects. Changes of the repository come from the `RepositoryWorker` */
export class AdaptersWorker extends GenericWorker<'adapter'> {
    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'adapter');
    }

    protected checkObjectId(id: string, obj: ioBroker.AdapterObject | null | undefined): boolean {
        return !!id.match(/^system\.adapter\.[^.]+$/) && (!obj || obj.type === this.objectType);
    }

    protected postProcessing(_id: string, _obj: ioBroker.AdapterObject | null | undefined): void {
        this.socket.getAdaptersResetCache();
        this.socket.getInstalledResetCache('');
        // the reduced repository carries the news only of the installed adapters
        this.socket.getRepositoryResetCache('');
    }
}
