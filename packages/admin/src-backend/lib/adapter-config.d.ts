// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            // non-primitive types are not inferred correctly
            accessAllowedConfigs: string[];
            accessAllowedTabs: string[];
            reverseProxy: unknown[];
            language: ioBroker.Languages;
            autoUpdate: number;
            defaultUser: string;
            auth: boolean;
            accessApplyRights: boolean;
            accessLimit: boolean;
            tmpPathAllow: boolean;
            tmpPath: string;
            port: number;
            secure: boolean;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
