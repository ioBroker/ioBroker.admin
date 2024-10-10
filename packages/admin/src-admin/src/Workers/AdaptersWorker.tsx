import { type AdminConnection } from '@iobroker/react-components';
import GenericWorker, { type EventType, type GenericEvent } from './GenericWorker';

export type AdapterEventType = EventType;

export type AdapterEvent = GenericEvent<'adapter'>;

export default class AdaptersWorker extends GenericWorker<'adapter'> {
    private readonly repositoryHandlers: (() => void)[];

    private repoTimer: ReturnType<typeof setTimeout> | null;

    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'adapter');
        this.repositoryHandlers = [];
    }

    protected checkObjectId(id: string, obj: ioBroker.AdapterObject | null | undefined): boolean {
        return id.match(/^system\.adapter\.[^.]+$/) && (!obj || obj.type === this.objectType);
    }

    protected postProcessing(_id: string, _obj: ioBroker.AdapterObject | null | undefined): void {
        this.socket.getAdaptersResetCache();
        this.socket.getInstalledResetCache('');
    }

    repoChangeHandler = (/* id, obj */): void => {
        if (this.repoTimer) {
            clearTimeout(this.repoTimer);
        }
        this.repoTimer = setTimeout(() => {
            this.repoTimer = null;
            this.repositoryHandlers.forEach(cb => cb());
        }, 500);
    };

    registerRepositoryHandler(cb: () => void): void {
        if (!this.repositoryHandlers.includes(cb)) {
            this.repositoryHandlers.push(cb);

            if (this.repositoryHandlers.length === 1 && this.connected) {
                this.socket
                    .subscribeObject('system.repositories', this.repoChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));
            }
        }
    }

    unregisterRepositoryHandler(cb: () => void): void {
        const pos = this.repositoryHandlers.indexOf(cb);
        if (pos !== -1) {
            this.repositoryHandlers.splice(pos, 1);
        }

        if (!this.repositoryHandlers.length && this.connected) {
            this.socket
                .unsubscribeObject('system.repositories', this.repoChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on object: ${e}`));
        }
    }
}
