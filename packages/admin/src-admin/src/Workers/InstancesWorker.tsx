import { type AdminConnection } from '@iobroker/react-components';
import GenericWorker, { type EventType, type GenericEvent } from './GenericWorker';

export type InstanceEventType = EventType;

export type InstanceEvent = GenericEvent<'instance'>;

export default class InstancesWorker extends GenericWorker<'instance'> {
    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'instance');
    }
}
