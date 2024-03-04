declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
    }

    declare module '*.svg'
    declare module '*.png'
    declare module '*.jpg'
}

export {};
