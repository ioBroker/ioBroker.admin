import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import svgr from 'vite-plugin-svgr';
import vitetsConfigPaths from 'vite-tsconfig-paths';
import { federation } from '@module-federation/vite';
import config from '@iobroker/adapter-react-v5/modulefederation.admin.config';
import path from 'path';

import * as icons from '@mui/icons-material';

export default defineConfig({
    plugins: [
        federation({
            name: 'iobroker_admin',
            shared: config.shared,
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
        port: 3000,
        proxy: {
            '/files': 'http://127.0.0.1:8081',
            '/adapter': 'http://127.0.0.1:8081',
            '/session': 'http://127.0.0.1:8081',
            '/log': 'http://127.0.0.1:8081',
            '/lib/js/crypto-js': 'http://127.0.0.1:8081',
        },
    },
    base: './',
    resolve: {
        alias: {
            '@iobroker/json-config': path.resolve(__dirname, '..', '..', 'jsonConfig', 'src'),
            '@iobroker/adapter-react-v5': path.resolve(__dirname, '..', '..', 'adapter-react-v5', 'src'),
            '@iobroker/dm-gui-components': path.resolve(__dirname, '..', '..', 'dm-gui-components', 'src'),
            '@': path.resolve(__dirname, 'src'),
            '#DM': path.resolve(__dirname, '..', '..', 'dm-gui-components', 'src'),
            '#JC': path.resolve(__dirname, '..', '..', 'jsonConfig', 'src'),
        },
    },
    build: {
        target: 'chrome89',
        outDir: './build',
    },
});
