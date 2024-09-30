import { useState } from 'react';

export default function useStateLocal(defaultValue: any, key: string): [any, (newValue: any) => void, boolean] {
    const data = (window._localStorage || window.localStorage).getItem(key);
    if (data) {
        try {
            defaultValue = JSON.parse(data);
        } catch {
            // ignore
        }
    }

    const [state, setState] = useState(defaultValue);

    const eventsToInstall = (newValue: any): void => {
        (window._localStorage || window.localStorage).setItem(key, JSON.stringify(newValue));
        setState(newValue);
    };

    return [state, eventsToInstall, !!(window._localStorage || window.localStorage).getItem(key)];
}
