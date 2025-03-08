const makeShared = (pkgs: string[]): Record<string, { requiredVersion: '*'; singleton: true }> => {
    const result: Record<string, { requiredVersion: '*'; singleton: true }> = {};
    pkgs.forEach(packageName => {
        result[packageName] = {
            requiredVersion: '*',
            singleton: true,
        };
    });
    return result;
};

/**
 * Admin shares these modules for all components
 *
 * @param packageJson - package.json or list of modules that used in component
 * @return Object with shared modules for "federation"
 */
export function moduleFederationShared(
    packageJson?:
        | {
              dependencies: Record<string, string>;
              devDependencies?: Record<string, string>;
          }
        | string[],
): Record<string, { requiredVersion: '*'; singleton: true }> {
    const list: string[] = [
        '@emotion/react',
        '@emotion/styled',
        '@iobroker/adapter-react-v5',
        '@iobroker/json-config',
        '@iobroker/dm-gui-components',
        '@mui/icons-material',
        '@mui/material',
        '@mui/x-date-pickers',
        'date-fns',
        'date-fns/locale',
        'leaflet',
        'leaflet-geosearch',
        'react',
        'react-ace',
        'react-dom',
        'react-dropzone',
        'semver',
    ];

    if (Array.isArray(packageJson)) {
        return makeShared(list.filter(packageName => packageJson.includes(packageName)));
    }

    if (packageJson && (packageJson.dependencies || packageJson.devDependencies)) {
        return makeShared(
            list.filter(
                packageName => packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName],
            ),
        );
    }

    return makeShared(list);
}
