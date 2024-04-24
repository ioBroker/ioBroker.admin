declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
        _sessionStorage?: Storage;
    }

    declare module '*.svg'
    declare module '*.png'
    declare module '*.jpg'
}

export {};
