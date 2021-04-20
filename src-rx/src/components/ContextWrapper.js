import React, {
    createContext,
    useEffect,
    useState,
} from 'react';
import semver from 'semver';

export const ContextWrapper = createContext();

export const ContextWrapperProvider = ({ children }) => {
    const [stateContext, setState] = useState({
        logErrors: 0, // logsWorker.registerErrorCountHandler
        logWarnings: 0, // logsWorker.registerWarningCountHandler
        hostsUpdate: 0,
        adaptersUpdate: 0,
        hosts: null,
        repository: null,
        installed: null
    });

    const setStateContext = obj => {
        setState(prevState => Object.keys(prevState).length === Object.keys(obj).length ? { ...obj } : { ...prevState, ...obj });
    };

    useEffect(() => {
        if (stateContext.hosts) {
            const jsControllerVersion = stateContext.repository['js-controller'].version;
            let count = 0;
            stateContext.hosts.forEach(element => {
                if (element.common.installedVersion !== jsControllerVersion) {
                    count++
                }
            });
            setStateContext({ hostsUpdate: count });
        }

        if (stateContext.installed) {
            let count = 0;
            Object.keys(stateContext.installed).forEach(element => {
                if (element !== 'js-controller' &&
                    element !== 'hosts' &&
                    stateContext.installed[element]?.version &&
                    stateContext.repository[element]?.version &&
                    semver.gt(stateContext.repository[element]?.version, stateContext.installed[element]?.version)
                ) {
                    count++;
                }
            });

            setStateContext({ adaptersUpdate: count });
        }

    }, [stateContext.hosts, stateContext.installed, stateContext.repository]);

    return <ContextWrapper.Provider value={{ stateContext, setStateContext }}>
        {children}
    </ContextWrapper.Provider>;
};