/*
 * This file loads the translations keys from `i18n/en.json` file and overrides
 * the declarations for the translate function `I18n.t` available in "@iobroker/adapter-react/i18n".
 * Using these definitions it is ensured that all used translations in the React
 * context are defined at least in the english translations file.
 * This will add no overhead in the generated code since it just reexports the
 * I18n class but with a more typed `t` function.
 */

/*
 * DO NOT add any imports or exports in this file, or it will stop working!
 */

/**
 * Available words in `i18n/en.json`.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
declare type AdminWord = keyof typeof import('./en.json');

declare module '@iobroker/adapter-react/i18n' {
    /**
     * Translate the given string to the selected language.
     *
     * @param word The (key) word to look up the string. It Has to be defined at least in `i18n/en.json`.
     * @param args Optional arguments which will replace the first (second, third, ...) occurrence of %s
     */
    function t(word: AdminWord, ...args: string[]): string;
}
