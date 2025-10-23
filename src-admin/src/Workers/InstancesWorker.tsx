import { type AdminConnection } from '@iobroker/adapter-react-v5';
import { GenericWorker, type EventType, type GenericEvent } from './GenericWorker';

export type InstanceEventType = EventType;

export type InstanceEvent = GenericEvent<'instance'>;

export class InstancesWorker extends GenericWorker<'instance'> {
    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'instance');
    }
}
