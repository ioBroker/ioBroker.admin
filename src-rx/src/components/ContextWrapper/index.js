import React, {
    createContext,
    useState,
} from 'react';


export const ContextWrapper = createContext();

export const ContextWrapperProvider = ({ children }) => {
    const [stateContext, setState] = useState({
        logErrors: 0,//logsWorker.registerErrorCountHandler
        logWarnings: 0//logsWorker.registerWarningCountHandler
    });
    const setStateContext = (obj) => {
        setState(prevState => (Object.keys(prevState).length === Object.keys(obj).length ? { ...obj } : { ...prevState, ...obj }));
    };
    return <ContextWrapper.Provider value={{ stateContext, setStateContext }}>
        {children}
    </ContextWrapper.Provider>;
};