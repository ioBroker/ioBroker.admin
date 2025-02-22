declare const makeShared: (pkgs: string[]) => Record<string, { requiredVersion: '*', singleton: true }>;

// Admin shares these modules for all components
export const shared: ReturnType<typeof makeShared>;
