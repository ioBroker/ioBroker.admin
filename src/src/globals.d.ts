declare global {
    interface Window {
        CryptoJS: any;
        _localStorage?: Storage;
    }
}

export {};
