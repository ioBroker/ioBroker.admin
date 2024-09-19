declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
        _sessionStorage?: Storage;
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
