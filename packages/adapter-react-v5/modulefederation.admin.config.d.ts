/**
 * Admin shares these modules for all components
 *
 * @param packageJson - package.json or list of modules that used in component
 * @return Object with shared modules for "federation"
 */
export declare const moduleFederationShared: (
    packageJson?:
        | {
              dependencies: Record<string, string>;
              devDependencies?: Record<string, string>;
          }
        | string[],
) => Record<
    string,
    {
        requiredVersion: '*';
        singleton: true;
    }
>;
