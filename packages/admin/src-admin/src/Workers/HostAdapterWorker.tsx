import { type AdminConnection } from '@iobroker/adapter-react-v5';
import GenericWorker, { type EventType, type GenericEvent } from './GenericWorker';

export type HostAdapterEventType = EventType;

export type HostAdapterEvent = GenericEvent<'adapter'>;

export default class HostAdapterWorker extends GenericWorker<'adapter'> {
    private readonly host: string;
    private readonly prefix: string;

    constructor(socket: AdminConnection, host: string) {
        super(socket, `${host}.adapter`, 'adapter');
        this.prefix = `${host}.adapter.`;
        this.host = host;
    }

    getObject(adapterName: string): ioBroker.AdapterObject | null {
        if (!this.objects) {
            return null;
        }
        return this.objects[this.prefix + adapterName] || null;
    }

    getHost(): string {
        return this.host;
    }
}
