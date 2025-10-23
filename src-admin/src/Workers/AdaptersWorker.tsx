import { type AdminConnection } from '@iobroker/adapter-react-v5';
import { GenericWorker, type EventType, type GenericEvent } from './GenericWorker';

export type AdapterEventType = EventType;

export type AdapterEvent = GenericEvent<'adapter'>;

export class AdaptersWorker extends GenericWorker<'adapter'> {
    private readonly repositoryHandlers: (() => void)[];

    private repoTimer: ReturnType<typeof setTimeout> | null;

    private lastActiveRepo: string | string[] | undefined;

    constructor(socket: AdminConnection) {
        super(socket, 'system.adapter', 'adapter');
        this.repositoryHandlers = [];
        this.lastActiveRepo = undefined;
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

    systemConfigChangeHandler = (id: string, obj: ioBroker.SystemConfigObject | null | undefined): void => {
        // Only handle system.config object changes
        if (id !== 'system.config' || !obj?.common) {
            return;
        }

        const currentActiveRepo = obj.common.activeRepo;

        // Check if activeRepo has changed
        if (JSON.stringify(this.lastActiveRepo) !== JSON.stringify(currentActiveRepo)) {
            this.lastActiveRepo = currentActiveRepo;
            // Trigger repository refresh using the same mechanism as repository changes
            this.repoChangeHandler();
        }
    };

    registerRepositoryHandler(cb: () => void): void {
        if (!this.repositoryHandlers.includes(cb)) {
            this.repositoryHandlers.push(cb);

            if (this.repositoryHandlers.length === 1 && this.connected) {
                this.socket
                    .subscribeObject('system.repositories', this.repoChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on object: ${e}`));

                // Also subscribe to system.config to watch for activeRepo changes
                this.socket
                    .subscribeObject('system.config', this.systemConfigChangeHandler)
                    .catch(e => window.alert(`Cannot subscribe on system.config: ${e}`));

                // Initialize lastActiveRepo from current system config
                this.socket
                    .getCompactSystemConfig()
                    .then(config => {
                        this.lastActiveRepo = config.common.activeRepo;
                    })
                    .catch(e => console.warn(`Cannot get initial system config: ${e}`));
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

            this.socket
                .unsubscribeObject('system.config', this.systemConfigChangeHandler)
                .catch(e => window.alert(`Cannot unsubscribe on system.config: ${e}`));
        }
    }
}
