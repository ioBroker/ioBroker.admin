import * as React from 'react';

export function useStateLocal(el, key) {
    const [state, setState] = React.useState(
        localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : el
    );

    const eventsToInstall = (newHeadCells) => {
        localStorage.setItem(key, JSON.stringify(newHeadCells));
        setState(newHeadCells);
    };
    return [state, eventsToInstall, localStorage.getItem(key) ? true : false];
}