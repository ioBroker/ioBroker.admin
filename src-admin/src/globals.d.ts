declare global {
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
