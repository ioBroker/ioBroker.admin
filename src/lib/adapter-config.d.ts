// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            // non-primitive types are not inferred correctly
            /** Answer ACME HTTP-01 challenges published by the acme adapter. Enabled if not set */
            acmeChallenge: boolean;
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
            /** Days a login is renewed without a password (lifetime of the refresh token) */
            refreshTokenTtlDays: number;
            /** If the experimental SSO feature is enabled */
            ssoActive: boolean;
            /** Issuer URL of the OpenID Connect identity provider used for the single sign-on */
            oidcIssuer: string;
            /** Client ID registered at the identity provider */
            oidcClientId: string;
            /** Secret of a confidential client, empty for a public client (PKCE) */
            oidcClientSecret: string;
            /** Scopes to request, default `openid profile email` */
            oidcScope: string;
            disableMcp?: boolean;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
