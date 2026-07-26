declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
        _sessionStorage?: Storage;
        /** Vendor prefix, used to select the vendor-specific loader ('PT', 'MV', 'NW', 'HA', ...) */
        vendorPrefix: undefined | string;
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
