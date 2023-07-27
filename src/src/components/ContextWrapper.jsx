import React, {
    createContext,
    useEffect, useMemo,
    useState,
} from 'react';

import Adapters from '../tabs/Adapters';

export const ContextWrapper = createContext();

export const ContextWrapperProvider = ({ children }) => {
    const [stateContext, setState] = useState({
        hostsUpdate:    0,
        adaptersUpdate: 0,

        hosts:          null,
        repository:     null,
        installed:      null,
    });

    const setStateContext = useMemo(() => obj => {
        setState(prevState =>
            (Object.keys(prevState).length === Object.keys(obj).length ?
                { ...obj }
                :
                { ...prevState, ...obj }));
    }, [setState]);

    useEffect(() => {
        if (stateContext.hosts) {
            const jsControllerVersion = stateContext.repository['js-controller'].version;
            let count = 0;
            stateContext.hosts.forEach(element => {
                if (Adapters.updateAvailable(element.common.installedVersion, jsControllerVersion)) {
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
                if (element !== 'js-controller' &&
                    element !== 'hosts' &&
                    _installed?.version &&
                    adapter?.version &&
                    _installed.ignoreVersion !== adapter.version &&
                    Adapters.updateAvailable(_installed.version, adapter.version)
                ) {
                    count++;
                }
            });

            setStateContext({ adaptersUpdate: count });
        }
    }, [stateContext.hosts, stateContext.installed, stateContext.repository]);

    // eslint-disable-next-line react/jsx-no-constructed-context-values
    return <ContextWrapper.Provider value={{ stateContext, setStateContext }}>
        {children}
    </ContextWrapper.Provider>;
};
