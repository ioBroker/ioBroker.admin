import { init, registerShared } from '@module-federation/runtime';

/** Installed versions of the packages in `LAZY_SHARED` of vite.config.ts */
declare const __LAZY_SHARED_VERSIONS__: Record<string, string>;

/** How each package is loaded: a dynamic import puts it into a chunk of its own */
const LOADERS: Record<string, () => Promise<object>> = {
    '@mui/icons-material': () => import('@mui/icons-material'),
    'date-fns': () => import('date-fns'),
    'date-fns/locale': () => import('date-fns/locale'),
};

/**
 * Offers the packages that admin no longer shares eagerly to the custom components of the adapters.
 *
 * Every component built so far declares them as shared and takes the copy of admin. Without an offer it
 * would load its own fallback instead, which bundles a whole copy of MUI along. So they stay in the
 * share scope, with the installed version as before, but their chunk is loaded only when a component
 * asks for it.
 */
export function registerLazyShared(): void {
    // the instance that the federation plugin created; `init` with the same name returns it
    init({ name: 'iobroker_admin', shared: {}, remotes: [] });

    registerShared(
        Object.fromEntries(
            Object.entries(LOADERS).map(([name, load]) => [
                name,
                {
                    version: __LAZY_SHARED_VERSIONS__[name],
                    scope: 'default',
                    get: async () => {
                        const module = await load();
                        return () => module;
                    },
                    shareConfig: { singleton: true, requiredVersion: '*', eager: false },
                },
            ]),
        ),
    );
}
