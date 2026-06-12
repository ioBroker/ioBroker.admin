export interface AdminAdapterConfig extends ioBroker.AdapterConfig {
    accessAllowedConfigs: string[];
    accessAllowedTabs: string[];
    accessApplyRights: boolean;
    accessLimit: boolean;
    allowInternalAccess?: { [adapterName: string]: string }; // adapterName: UserName (without system.user)
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
    secure: boolean;
    thresholdValue: number;
    tmpPath: string;
    tmpPathAllow: boolean;
    ttl: number;
    reverseProxy: {
        globalPath: string;
        paths: { path: string; instance: string }[];
    }[];
    disableMcp?: boolean;
}
