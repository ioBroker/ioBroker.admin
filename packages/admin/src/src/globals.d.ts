declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
    }
}

declare module '*.svg'

export {};
