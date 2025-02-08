const makeShared = (pkgs) => {
    const result = {};
    pkgs.forEach(packageName => {
        result[packageName] = {
            requiredVersion: '*',
            singleton: true,
        };
    });
    return result;
};

// Admin shares these modules for all components
module.exports = {
    shared: makeShared([
        '@emotion/react',
        '@emotion/styled',
        '@iobroker/adapter-react-v5',
        '@iobroker/json-config',
        '@iobroker/dm-gui-components',
        // '@mui/icons-material',
        '@mui/material',
        '@mui/x-date-pickers',
        'date-fns',
        'leaflet',
        'leaflet-geosearch',
        'prop-types',
        'react',
        'react-ace',
        'react-dom',
        // 'react-dropzone',
        'semver',
    ])
}