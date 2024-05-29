const { ProvidePlugin } = require('webpack');
const cracoModuleFederation = require('@iobroker/adapter-react-v5/craco-module-federation');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
    plugins: [
        { plugin: cracoModuleFederation },
    ],
    devServer: {
        proxy: {
            '/files': 'http://127.0.0.1:8081',
            '/adapter': 'http://127.0.0.1:8081',
            '/session': 'http://127.0.0.1:8081',
            '/log': 'http://127.0.0.1:8081',
            '/lib/js/crypto-js': 'http://127.0.0.1:8081',
        },
    },
    webpack: {
        alias: {
            '@iobroker/json-config': path.resolve(__dirname, '..', '..', 'jsonConfig', 'src'),
            '@iobroker/dm-gui-components': path.resolve(__dirname, '..', '..', 'dm-gui-components', 'src'),
            '@': path.resolve(__dirname, 'src'),
            '#DM': path.resolve(__dirname, '..', '..', 'dm-gui-components', 'src'),
            '#JC': path.resolve(__dirname, '..', '..', 'jsonConfig', 'src'),
        },
        output: {
            publicPath: './',
        },
        plugins: [
            // new HtmlWebpackPlugin(),
            new ProvidePlugin({
                React: 'react',
            }),
        ],
        configure: webpackConfig => {
            // Remove ModuleScopePlugin which throws when we try to import something
            // outside of src/.
            webpackConfig.resolve.plugins.pop();

            // Resolve the path aliases.
            webpackConfig.resolve.plugins.push(new TsconfigPathsPlugin());

            // Let Babel compile outside of src/.
            const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
            const tsRule = oneOfRule.oneOf.find(rule =>
                rule.test.toString().includes('ts|tsx'));

            tsRule.include = undefined;
            tsRule.exclude = /node_modules/;

            webpackConfig.resolve.fallback = webpackConfig.resolve.fallback || {};
            webpackConfig.resolve.fallback.util = false;
            return webpackConfig;
        },
    },
};
