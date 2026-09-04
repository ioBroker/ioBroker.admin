import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
// NOTE: @module-federation/vite is pinned to an exact version in package.json.
// 1.21.3 hangs forever on `vite build`: a single JS thread spins at 100% CPU after the
// "moduleParseIdleTimeout ... forcing resolve" warning and the build never emits anything.
// 1.21.1 and 1.21.2 both complete in ~1 min. Verify a build before lifting the pin.
import { federation } from '@module-federation/vite';
import { resolve } from 'node:path';
import { moduleFederationShared } from '@iobroker/gui-components/modulefederation.admin.config';

// Make all shared modules eager for the host application,
// so they are available in the shared scope for remote modules
const shared = moduleFederationShared();
for (const key of Object.keys(shared)) {
    shared[key].eager = true;
}

export default defineConfig({
    plugins: [
        federation({
            name: 'iobroker_admin',
            shared,
            exposes: {},
            remotes: {},
            filename: 'remoteEntry.js',
            manifest: true,
        }),
        react(),
        commonjs(),
    ],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '/files': 'http://127.0.0.1:8081',
            '/adapter': 'http://127.0.0.1:8081',
            '/session': 'http://127.0.0.1:8081',
            '/log': 'http://127.0.0.1:8081',
            '/lib/js/crypto-js': 'http://127.0.0.1:8081',
            '/sso': 'http://127.0.0.1:8081',
        },
    },
    base: './',
    resolve: {
        tsconfigPaths: true,
        alias: [
            { find: '@', replacement: resolve(import.meta.dirname, 'src') },
            {
                // leaflet 1.9 declares neither `module` nor `exports`, so bundlers treat it as CommonJS.
                // Module federation wraps every shared module in `export * from "<pkg>"`, and that cannot
                // enumerate the named exports of a CommonJS module. react-leaflet is pure ESM and does
                // `import { Circle } from 'leaflet'`, which then fails with "does not provide an export
                // named 'Circle'" - fatal in dev, and the source of the "Unable to interop" build warning.
                // Leaflet ships an ESM build that exports them properly, so resolve the bare specifier to it.
                find: /^leaflet$/,
                replacement: resolve(import.meta.dirname, 'node_modules/leaflet/dist/leaflet-src.esm.js'),
            },
            {
                // monaco-editor 0.56 has an `exports` map with `"./*": "./esm/vs/*.js"`, so the deep
                // path that react-monaco-editor 0.59 imports resolves to `esm/vs/esm/vs/...` and
                // fails. react-monaco-editor declares `monaco-editor: ^0.52.0` as a peer, where the
                // map did not exist yet. Point the old specifier at the file that is really meant.
                find: 'monaco-editor/esm/vs/editor/editor.api',
                replacement: resolve(import.meta.dirname, 'node_modules/monaco-editor/esm/vs/editor/editor.api.js'),
            },
        ],
    },
    build: {
        target: 'chrome89',
        outDir: './build',
    },
});
