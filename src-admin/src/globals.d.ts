declare global {
    namespace ioBroker {
        interface SystemConfigCommon {
            /**
             * The "Did you know ...?" dialog is not shown when admin is opened.
             * It is set by the checkbox in that dialog and can be switched back on in the system settings.
             */
            tipsDisabled?: boolean;
        }
    }

    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
        _sessionStorage?: Storage;
        /** Vendor prefix, used to select the vendor-specific loader ('PT', 'MV', 'NW', 'HA', ...) */
        vendorPrefix: undefined | string;
        /**
         * Public path of this admin instance (`/` or e.g. `/admin/`).
         * Injected by the server from the reverse-proxy table.
         */
        socketPath?: string;
    }

    declare module '*.svg';
    declare module '*.png';
    declare module '*.jpg';

    declare module '@mui/material/Button' {
        interface ButtonPropsColorOverrides {
            grey: true;
        }
    }
}

export {};
