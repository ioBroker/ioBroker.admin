import React, { createContext, useEffect, useMemo, useState, type JSX } from 'react';

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
    const [stateContext, setState] = useState<MyContext>({
        hostsUpdate: 0,
        adaptersUpdate: 0,

        hosts: null,
        repository: null,
        installed: null,
    });

    const setStateContext = useMemo(
        () => (obj: any) => {
            setState(prevState =>
                // If a full object is passed, replace it
                Object.keys(prevState).length === Object.keys(obj).length
                    ? { ...obj }
                    : // else merge the new object with the old one
                      { ...prevState, ...obj },
            );
        },
        [setState],
    );

    useEffect(() => {
        if (stateContext.hosts) {
            const jsControllerVersion = stateContext.repository['js-controller'].version;
            let count = 0;
            stateContext.hosts.forEach(element => {
                if (AdminUtils.updateAvailable(element.common.installedVersion, jsControllerVersion)) {
                    count++;
                }
            });
            setStateContext({ hostsUpdate: count });
        }

        if (stateContext.installed) {
            let count = 0;
            Object.keys(stateContext.installed).forEach(element => {
                const _installed = stateContext.installed[element];
                const adapter = stateContext.repository[element];
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

            setStateContext({ adaptersUpdate: count });
        }
    }, [setStateContext, stateContext.hosts, stateContext.installed, stateContext.repository]);

    return <ContextWrapper.Provider value={stateContext}>{children}</ContextWrapper.Provider>;
}
