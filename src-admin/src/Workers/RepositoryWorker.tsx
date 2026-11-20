import type { AdminConnection } from '@iobroker/gui-components';

/** `system.repositories` without the content of the repositories: of every one only its `_repoInfo` */
export type CompactSystemRepository = {
    _id: string;
    common: {
        name: string;
        dontDelete: boolean;
    };
    native: {
        repositories: Record<string, ioBroker.RepositoryInformation>;
    };
};

/** The news of an adapter as the repository has them: version => changes of that version */
export type AdapterNews = Record<string, ioBroker.Translated | string>;

/** What the GUI shows about the active repositories */
export interface RepositoryState {
    /** Names of the active repositories, as `system.config` has them */
    active: string[];
    /**
     * Active repositories that `system.repositories` does not have (any more), e.g. after it was set back
     * to its defaults: the host finds nothing in them, and every adapter is shown as "not maintained"
     */
    missing: string[];
    /** All active repositories are stable ones. A missing one does not count: it has its own note */
    stable: boolean;
    /** The active repositories for the user, e.g. "Beta (latest)", without the missing ones */
    title: string;
    /** `system.repositories` without the content of the repositories, null as long as it was not read */
    repositories: CompactSystemRepository | null;
}

/**
 * What the GUI shows about the active repositories.
 *
 * @param activeRepo the active repositories of `system.config`
 * @param repositories `system.repositories`, the content of the repositories is not needed
 * @param lang language of the names
 */
export function analyseRepositories(
    activeRepo: string | string[] | undefined | null,
    repositories: CompactSystemRepository | null | undefined,
    lang: ioBroker.Languages,
): RepositoryState {
    const active = Array.isArray(activeRepo) ? activeRepo : activeRepo ? [activeRepo] : [];
    const configured = repositories?.native?.repositories;
    // which ones are missing is only known once `system.repositories` was read
    const missing = configured ? active.filter(repo => !configured[repo]) : [];
    const existing = active.filter(repo => !missing.includes(repo));

    return {
        active,
        missing,
        stable:
            !!activeRepo &&
            existing.every(
                repo => repo.toLowerCase().startsWith('stable') || !!configured?.[repo]?.json?._repoInfo?.stable,
            ),
        title: existing
            .map(repo => {
                const name = configured?.[repo]?.json?._repoInfo?.name;
                if (name && typeof name === 'object') {
                    return name[lang] || name.en;
                }
                return name || repo;
            })
            .join(', '),
        repositories: repositories || null,
    };
}

/**
 * Whether two reads of the repositories show the same: the same active repositories, read at the same time.
 *
 * @param a one read
 * @param b another read
 */
export function isSameRepositoryState(a: RepositoryState, b: RepositoryState): boolean {
    const signature = (state: RepositoryState): string =>
        JSON.stringify(
            state.active.map(repo => {
                const info = state.repositories?.native?.repositories?.[repo];
                return [repo, info?.link, info?.json?._repoInfo];
            }),
        );
    return signature(a) === signature(b);
}

/**
 * Knows when the repository changes: an update of the repository (`iobroker update`, "Check for updates",
 * the automatic update of admin), other repository URLs or other active repositories. It then forgets
 * everything the connection keeps of the repository, so the next read gets the new one, and tells it the
 * registered handlers.
 *
 * Reads the state of the active repositories and the news of single adapters.
 */
export class RepositoryWorker {
    private readonly socket: AdminConnection;

    private readonly lang: ioBroker.Languages;

    private readonly handlers: ((state: RepositoryState) => void)[] = [];

    private timer: ReturnType<typeof setTimeout> | null = null;

    /** The active repositories of the last `system.config`, undefined till it was read */
    private activeRepo: string | string[] | undefined;

    private statePromise: Promise<RepositoryState> | null = null;

    /**
     * @param socket connection to admin
     * @param lang language of the GUI, for the names of the repositories
     */
    constructor(socket: AdminConnection, lang: ioBroker.Languages) {
        this.socket = socket;
        this.lang = lang;
    }

    private onRepositoriesChanged = (): void => {
        // the host writes `system.repositories` once per repository it reads: one notification for all
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            // the compact and the reduced repository of every host
            this.socket.getRepositoryResetCache('');
            void this.getState(true).then(state => this.handlers.forEach(cb => cb(state)));
        }, 500);
    };

    private onSystemConfigChanged = (id: string, obj: ioBroker.Object | null | undefined): void => {
        if (id !== 'system.config' || !obj?.common) {
            return;
        }
        const activeRepo = (obj as ioBroker.SystemConfigObject).common.activeRepo;
        if (JSON.stringify(this.activeRepo) !== JSON.stringify(activeRepo)) {
            // before the first read it is unknown whether they changed, e.g. with another setting
            const known = this.activeRepo !== undefined;
            this.activeRepo = activeRepo;
            if (known) {
                this.onRepositoriesChanged();
            }
        }
    };

    /**
     * The state of the active repositories.
     *
     * @param update read it anew instead of taking the last read
     */
    getState(update?: boolean): Promise<RepositoryState> {
        if (!update && this.statePromise) {
            return this.statePromise;
        }
        const promise = Promise.all([
            this.socket.getCompactSystemRepositories(update).catch((e: unknown): null => {
                console.warn(`Cannot read the repositories: ${e as Error}`);
                return null;
            }),
            this.activeRepo !== undefined
                ? Promise.resolve(this.activeRepo)
                : this.socket
                      .getCompactSystemConfig()
                      .then(config => {
                          this.activeRepo ??= config.common.activeRepo;
                          return this.activeRepo;
                      })
                      .catch((e: unknown): undefined => {
                          console.warn(`Cannot read the system configuration: ${e as Error}`);
                          return undefined;
                      }),
        ]).then(([repositories, activeRepo]) =>
            analyseRepositories(activeRepo, repositories as unknown as CompactSystemRepository | null, this.lang),
        );
        this.statePromise = promise;
        return promise;
    }

    /**
     * Reads the news of one adapter from the repository.
     *
     * Admin answers this from the repository it keeps in memory, the host is not asked. The connection keeps
     * the answer till the repository changes, so the tooltips of all instances of an adapter read it once.
     *
     * @param host host of the adapter, e.g. `raspberrypi` or `system.host.raspberrypi`
     * @param adapter name of the adapter, e.g. `admin`
     * @param lang language of the GUI: the news come in that language and English only
     */
    getNews(host: string, adapter: string, lang: ioBroker.Languages): Promise<AdapterNews | null> {
        const hostId = host.startsWith('system.host.') ? host : `system.host.${host}`;
        return this.socket
            .getReducedRepository(hostId, { lang, adapters: [adapter] })
            .then(repository => (repository?.[adapter] as { news?: AdapterNews } | undefined)?.news || null)
            .catch((e: unknown): null => {
                // e.g. a user without the right to ask the host: the version is shown without its news then
                console.warn(`Cannot read the news of "${adapter}": ${e as Error}`);
                return null;
            });
    }

    /**
     * Tell `cb` when the repository changes, with the new state of the active repositories
     *
     * @param cb handler
     */
    registerHandler(cb: (state: RepositoryState) => void): void {
        if (this.handlers.includes(cb)) {
            return;
        }
        this.handlers.push(cb);
        if (this.handlers.length === 1) {
            // Admin sends `system.repositories` without the content of the repositories. An older admin sends
            // all of it, which this only takes as the sign to read anew. The connection subscribes again by
            // itself after a reconnect.
            this.socket
                .subscribeObject('system.repositories', this.onRepositoriesChanged)
                .catch(e => console.warn(`Cannot subscribe on system.repositories: ${e}`));
            this.socket
                .subscribeObject('system.config', this.onSystemConfigChanged)
                .catch(e => console.warn(`Cannot subscribe on system.config: ${e}`));
            // the active repositories, to tell a change of them from a change of another setting
            void this.getState();
        }
    }

    unregisterHandler(cb: (state: RepositoryState) => void): void {
        const pos = this.handlers.indexOf(cb);
        if (pos === -1) {
            return;
        }
        this.handlers.splice(pos, 1);
        if (!this.handlers.length) {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.socket
                .unsubscribeObject('system.repositories', this.onRepositoriesChanged)
                .catch(e => console.warn(`Cannot unsubscribe from system.repositories: ${e}`));
            this.socket
                .unsubscribeObject('system.config', this.onSystemConfigChanged)
                .catch(e => console.warn(`Cannot unsubscribe from system.config: ${e}`));
            // without the subscription, a change is not noticed any more
            this.activeRepo = undefined;
            this.statePromise = null;
        }
    }
}
