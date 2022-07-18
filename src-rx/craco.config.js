const CracoEsbuildPlugin = require('craco-esbuild');
const { ProvidePlugin} = require('webpack');
const cracoModuleFederation = require('craco-module-federation');

module.exports = {
    plugins: [
        { plugin: CracoEsbuildPlugin },
        { plugin: cracoModuleFederation }
    ],
    devServer: {
        proxy: {
            '/files': 'http://localhost:8081',
            '/adapter': 'http://localhost:8081',
            '/session': 'http://localhost:8081',
            '/log': 'http://localhost:8081',
            '/lib/js/crypto-js': 'http://localhost:8081'
        }
    },
    webpack: {
        output: {
            publicPath: './',
        },
        plugins: [
            // new HtmlWebpackPlugin(),
            new ProvidePlugin({
                React: 'react',
            }),
        ],
    },
};
