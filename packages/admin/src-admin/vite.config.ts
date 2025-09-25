import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import vitetsConfigPaths from 'vite-tsconfig-paths';
import { federation } from '@module-federation/vite';
import { resolve } from 'node:path';
import { moduleFederationShared } from '@iobroker/adapter-react-v5/modulefederation.admin.config';

export default defineConfig({
    plugins: [
        federation({
            name: 'iobroker_admin',
            shared: moduleFederationShared(),
            exposes: {},
            remotes: {},
            filename: 'remoteEntry.js',
            manifest: true,
        }),
        react(),
        vitetsConfigPaths(),
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
            '/sso': 'http://127.0.0.1:8081'
        },
        allowedHosts: ['iot.fischerserver.eu', 'iobroker-simonpc.revproxy.home.arpa']
    },
    base: './',
    resolve: {
        alias: {
            '@iobroker/json-config': resolve(__dirname, '..', '..', 'jsonConfig', 'src'),
            '@iobroker/adapter-react-v5': resolve(__dirname, '..', '..', 'adapter-react-v5', 'src'),
            '@iobroker/dm-gui-components': resolve(__dirname, '..', '..', 'dm-gui-components', 'src'),
            '@': resolve(__dirname, 'src'),
            '#DM': resolve(__dirname, '..', '..', 'dm-gui-components', 'src')
        },
    },
    build: {
        target: 'chrome89',
        outDir: './build',
    },
});
