// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            // non-primitive types are not inferred correctly
            accessAllowedConfigs: string[];
            accessAllowedTabs: string[];
            accessApplyRights: boolean;
            accessLimit: boolean;
            auth: boolean;
            autoUpdate: number;
            bind: string;
            cache: boolean;
            certChained: string;
            certPrivate: string;
            certPublic: string;
            defaultUser: string;
            doNotCheckPublicIP: boolean;
            language: ioBroker.Languages;
            leCollection: boolean;
            loadingBackgroundColor: string;
            loadingBackgroundImage: boolean;
            loadingHideLogo: boolean;
            loginBackgroundColor: string;
            loginBackgroundImage: boolean;
            loginHideLogo: boolean;
            loginMotto: string;
            noBasicAuth: boolean;
            port: number;
            reverseProxy: {
                globalPath: string;
                paths: { path: string; instance: string }[];
            }[];
            secure: boolean;
            thresholdValue: number;
            tmpPath: string;
            tmpPathAllow: boolean;
            ttl: number;
            /** If the experimental SSO feature is enabled */
            ssoActive: boolean;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
