import React from 'react';

/**
 * A page opened before the admin was updated still knows the old file names of its parts
 * (`Overview-DC5alkDH.js`). The new version has others, so loading a tab fails (#3678). The page
 * is then simply out of date, and loading it anew fixes it.
 */

const RELOAD_KEY = 'admin.chunkReloadTs';

/** Do not reload again within this time, so a part really missing does not reload forever */
const RELOAD_PAUSE_MS = 20_000;

/**
 * Whether the error says that a part of the page could not be loaded
 *
 * @param error the error
 */
export function isChunkLoadError(error: unknown): boolean {
    // the error boundary of the app also keeps plain `{ message, stack }` objects
    const { message, name } = (typeof error === 'object' && error !== null ? error : { message: error }) as {
        message?: unknown;
        name?: unknown;
    };
    if (typeof message !== 'string') {
        return false;
    }
    return (
        // Chrome
        message.includes('Failed to fetch dynamically imported module') ||
        // Firefox
        message.includes('error loading dynamically imported module') ||
        // Safari
        message.includes('Importing a module script failed') ||
        // vite
        message.includes('Unable to preload CSS') ||
        name === 'ChunkLoadError'
    );
}

/**
 * Load the page anew, but only if that did not just happen
 *
 * @returns true if the page is being reloaded
 */
export function reloadOutdatedPage(): boolean {
    let last = 0;
    try {
        last = parseInt(window.sessionStorage.getItem(RELOAD_KEY) || '0', 10) || 0;
    } catch {
        // without storage it reloads at most this one time anyway, as the error page stays
    }
    if (Date.now() - last < RELOAD_PAUSE_MS) {
        return false;
    }
    try {
        window.sessionStorage.setItem(RELOAD_KEY, Date.now().toString());
    } catch {
        // see above
    }
    window.location.reload();
    return true;
}

/**
 * Handler of `vite:preloadError`: vite could not preload a part of the page
 *
 * @param event the event
 */
export function onPreloadError(event: Event): void {
    if (reloadOutdatedPage()) {
        event.preventDefault();
    }
}

/**
 * `React.lazy`, which loads the page anew when the part is missing because the admin was updated
 *
 * @param factory the import
 */
export function lazyWithReload<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
    return React.lazy(() =>
        factory().catch((error: unknown) => {
            if (isChunkLoadError(error) && reloadOutdatedPage()) {
                // the page goes away, so keep the tab waiting instead of showing an error
                return new Promise<{ default: T }>(() => {});
            }
            throw error;
        }),
    );
}
