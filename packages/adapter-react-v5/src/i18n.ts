/**
 * Copyright 2018-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */

declare global {
    interface Window {
        sysLang: ioBroker.Languages;
        i18nShow: (filter: string | RegExp) => void;
        i18nDisableWarning: (disable: boolean) => void;
    }
}

type I18nWordDictionary = Record<ioBroker.Languages, string>;

type I18nWordsDictionary = Record<string, I18nWordDictionary>;

type I18nOneLanguageDictionary = Record<string, string>;

type I18nDictionary = {
    [lang in ioBroker.Languages]?: I18nOneLanguageDictionary;
};

type I18nWordsWithPrefix = I18nDictionary & { prefix?: string };

/**
 * Translation string management.
 */
export class I18n {
    /** List of all languages with their translations. */
    static translations: I18nDictionary = {};

    /** List of unknown translations during development. */
    static unknownTranslations: string[] = [];

    /** The currently displayed language. */
    static lang: ioBroker.Languages = window.sysLang || 'en';

    static _disableWarning: boolean = false;

    /**
     * Set the language to display
     *
     * @param lang The default language for translations.
     */
    static setLanguage(lang: ioBroker.Languages): void {
        if (lang) {
            I18n.lang = lang;
        }
    }

    /**
     * Add translations
     * User can provide two types of structures:
     * - {"word1": "translated word1", "word2": "translated word2"}, but in this case the lang must be provided
     * - {"word1": {"en": "translated en word1", "de": "translated de word1"}, "word2": {"en": "translated en word2", "de": "translated de word2"}}, but no lang must be provided
     *
     * @param words additional words for specific language
     * @param lang language for the words
     */
    static extendTranslations(
        words: I18nWordsWithPrefix | I18nOneLanguageDictionary | I18nWordsDictionary,
        lang?: ioBroker.Languages,
    ): void {
        // automatically extend all languages with prefix
        if ((words as I18nWordsWithPrefix).prefix) {
            const wordsWithPrefix = words as I18nWordsWithPrefix;
            if (typeof wordsWithPrefix.prefix === 'string') {
                const prefix = wordsWithPrefix.prefix;
                delete wordsWithPrefix.prefix;
                Object.keys(wordsWithPrefix).forEach(key => {
                    const _lang = key as ioBroker.Languages;
                    const _words: I18nOneLanguageDictionary = {};
                    const wordsOfOneLanguage = wordsWithPrefix[_lang];
                    Object.keys(wordsOfOneLanguage as Record<string, string>).forEach(word => {
                        if (!word) {
                            return;
                        }
                        if (wordsOfOneLanguage) {
                            if (!word.startsWith(prefix)) {
                                _words[`${prefix}${word}`] = wordsOfOneLanguage[word];
                            } else {
                                _words[word] = wordsOfOneLanguage[word];
                            }
                        }
                    });
                    words[_lang] = _words;
                });
            } else {
                console.warn('Found prefix in translations, but it is not a string');
            }
        }

        try {
            if (!lang) {
                // if it is a dictionary with all/many languages
                if (words.en && words.de && words.ru) {
                    Object.keys(words).forEach(key => {
                        const _lang = key as ioBroker.Languages;
                        I18n.translations[_lang] = I18n.translations[_lang] || {};
                        const wordsOfOneLang: I18nOneLanguageDictionary | undefined = I18n.translations[_lang];
                        Object.assign(wordsOfOneLang as Record<string, string>, words[_lang]);
                    });
                } else {
                    // It could be vice versa: words.word1 = {en: 'translated word1', de: 'übersetztes Wort2'}
                    Object.keys(words).forEach(word => {
                        const _word: I18nWordDictionary = (words as I18nWordsDictionary)[word];
                        Object.keys(_word).forEach(key => {
                            const _lang = key as ioBroker.Languages;
                            const languageDictionary: I18nOneLanguageDictionary | undefined = I18n.translations[_lang];
                            if (!languageDictionary) {
                                console.warn(`Used unknown language: ${_lang}`);
                            } else if (!languageDictionary[word]) {
                                languageDictionary[word] = _word[_lang];
                            } else if (languageDictionary[word] !== _word[_lang]) {
                                console.warn(
                                    `Translation for word "${word}" in "${_lang}" was ignored: existing = "${languageDictionary[word]}", new = ${_word[_lang]}`,
                                );
                            }
                        });
                    });
                }
            } else {
                // translations for one language
                if (!I18n.translations[lang]) {
                    console.warn(`Used unknown language: ${lang}`);
                }
                I18n.translations[lang] = I18n.translations[lang] || {};
                const languageDictionary: I18nOneLanguageDictionary | undefined = I18n.translations[lang];
                if (languageDictionary) {
                    Object.keys(words).forEach(word => {
                        if (!languageDictionary[word]) {
                            languageDictionary[word] = (words as I18nOneLanguageDictionary)[word];
                        } else if (languageDictionary[word] !== (words as I18nOneLanguageDictionary)[word]) {
                            console.warn(
                                `Translation for word "${word}" in "${lang}" was ignored: existing = "${languageDictionary[word]}", new = ${(words as I18nOneLanguageDictionary)[word]}`,
                            );
                        }
                    });
                }
            }
        } catch (e: any) {
            console.error(`Cannot apply translations: ${e}`);
        }
    }

    /**
     * Sets all translations (in all languages).
     *
     * @param translations The translations to add.
     */
    static setTranslations(translations: I18nDictionary): void {
        if (translations) {
            I18n.translations = translations;
        }
    }

    /**
     * Get the currently chosen language.
     *
     * @returns The current language.
     */
    static getLanguage(): ioBroker.Languages {
        return I18n.lang;
    }

    /**
     * Translate the given string to the selected language
     *
     * @param word The (key) word to look up the string.
     * @param args Optional arguments which will replace the first (second, third, ...) occurrences of %s
     */
    static t(word: string, ...args: any[]): string {
        const translation = I18n.translations[I18n.lang];
        if (translation) {
            const w = translation[word];
            if (w) {
                word = w;
            } else {
                if (!I18n.unknownTranslations.includes(word)) {
                    I18n.unknownTranslations.push(word);
                    !I18n._disableWarning && console.log(`Translate: ${word}`);
                }
                // fallback to english
                if (I18n.lang !== 'en' && I18n.translations.en) {
                    const wordEn = I18n.translations.en[word];
                    if (wordEn) {
                        word = wordEn;
                    }
                }
            }
        }
        for (const arg of args) {
            word = word.replace('%s', arg);
        }
        return word;
    }

    /**
     * Show non-translated words
     * Required during development
     *
     * @param filter The filter to apply to the list of non-translated words.
     */
    static i18nShow(filter?: string | RegExp): void {
        /** List words with their translations. */
        const result: Record<string, string> = {};
        if (!filter) {
            I18n.unknownTranslations.forEach(word => (result[word] = word));
            console.log(JSON.stringify(result, null, 2));
        } else if (typeof filter === 'string') {
            I18n.unknownTranslations.forEach(word => {
                if (word.startsWith(filter)) {
                    result[word] = word.replace(filter, '');
                }
            });
            console.log(JSON.stringify(result, null, 2));
        } else if (typeof filter === 'object') {
            I18n.unknownTranslations.forEach(word => {
                if (filter.test(word)) {
                    result[word] = word;
                }
            });
            console.log(JSON.stringify(result, null, 2));
        }
    }

    /**
     * Disable warning about non-translated words
     * Required during development
     *
     * @param disable Whether to disable the warning
     */
    static disableWarning(disable: boolean): void {
        I18n._disableWarning = !!disable;
    }
}

// install global handlers
window.i18nShow = I18n.i18nShow;
window.i18nDisableWarning = I18n.disableWarning;

/*
I18n.translations = {
    'en': require('./i18n/en'),
    'ru': require('./i18n/ru'),
    'de': require('./i18n/de'),
};
I18n.fallbacks = true;
I18n.t = function () {};
*/
