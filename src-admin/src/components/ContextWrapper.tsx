import React, { createContext, useMemo, useState, type JSX } from 'react';

import AdminUtils from '@/helpers/AdminUtils';

type MyContext = {
    hostsUpdate: number;
    adaptersUpdate: number;

    hosts: ioBroker.HostObject[] | null;
    repository: { [adapterName: string]: { icon: string; version: string } } | null;
    installed: { [adapterName: string]: { version: string; ignoreVersion?: string } } | null;
};

export const ContextWrapper = createContext<MyContext>({
    hostsUpdate: 0,
    adaptersUpdate: 0,

    hosts: null,
    repository: null,
    installed: null,
});

export function ContextWrapperProvider({ children }: { children: JSX.Element[] | JSX.Element }): JSX.Element {
    const [stateContext] = useState<MyContext>({
        hostsUpdate: 0,
        adaptersUpdate: 0,

        hosts: null,
        repository: null,
        installed: null,
    });

    const { hosts, installed, repository } = stateContext;

    // Both counters are pure derivations of the raw data. Computing them while rendering instead of
    // writing them back into state via an effect avoids a second render pass per update.
    const hostsUpdate = useMemo(() => {
        if (!hosts || !repository) {
            return 0;
        }
        const jsControllerVersion = repository['js-controller']?.version;
        let count = 0;
        hosts.forEach(element => {
            if (AdminUtils.updateAvailable(element.common.installedVersion, jsControllerVersion)) {
                count++;
            }
        });
        return count;
    }, [hosts, repository]);

    const adaptersUpdate = useMemo(() => {
        if (!installed || !repository) {
            return 0;
        }
        let count = 0;
        Object.keys(installed).forEach(element => {
            const _installed = installed[element];
            const adapter = repository[element];
            if (
                element !== 'js-controller' &&
                element !== 'hosts' &&
                _installed?.version &&
                adapter?.version &&
                _installed.ignoreVersion !== adapter.version &&
                AdminUtils.updateAvailable(_installed.version, adapter.version)
            ) {
                count++;
            }
        });
        return count;
    }, [installed, repository]);

    const value = useMemo(
        () => ({ ...stateContext, hostsUpdate, adaptersUpdate }),
        [stateContext, hostsUpdate, adaptersUpdate],
    );

    return <ContextWrapper.Provider value={value}>{children}</ContextWrapper.Provider>;
}
