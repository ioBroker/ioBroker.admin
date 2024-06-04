// This file extends the AdapterConfig type from "@types/iobroker"
// using the actual properties present in io-package.json
// in order to provide typings for adapter.config properties
import { native } from '../../io-package.json';

type _AdapterConfig = typeof native;

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig extends _AdapterConfig {
            // non-primitive types are not inferred correctly
            accessAllowedConfigs: string[];
            accessAllowedTabs: string[];
            reverseProxy: unknown[];
            /** Language of admin */
            language: ioBroker.Languages;
            /** If https should be used */
            secure: boolean;
            /** Update repo every X hours */
            autoUpdate: number;
            /** Run admin as this user */
            defaultUser: string;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
