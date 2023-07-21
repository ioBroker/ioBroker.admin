import * as React from 'react';

export function useStateLocal(defaultValue, key) {
    const data = (window._localStorage || window.localStorage).getItem(key);
    if (data) {
        try {
            defaultValue = JSON.parse(data);
        } catch (error) {
            // ignore
        }
    }

    const [state, setState] = React.useState(defaultValue);

    const eventsToInstall = newValue => {
        (window._localStorage || window.localStorage).setItem(key, JSON.stringify(newValue));
        setState(newValue);
    };

    return [state, eventsToInstall, !!(window._localStorage || window.localStorage).getItem(key)];
}
