import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
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
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        target: 'chrome89',
        outDir: './build',
    },
});
