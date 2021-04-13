import * as React from 'react';

export function useStateLocal(defaultValue, key) {
    const [state, setState] = React.useState(
        window.localStorage.getItem(key) ?
            JSON.parse(window.localStorage.getItem(key))
            :
            defaultValue
    );

    const eventsToInstall = newValue => {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setState(newValue);
    };

    return [state, eventsToInstall, !!window.localStorage.getItem(key)];
}