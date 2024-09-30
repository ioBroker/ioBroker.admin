interface AdapterUpdateOptions {
    /** Language to translate text to */
    lang: ioBroker.Languages;
    /** The adapter to update */
    adapter: string;
    /** The installed version */
    installedVersion: string;
    /** The new available version */
    newVersion: string;
}

const updateText: Record<ioBroker.Languages, string> = {
    en: 'Adapter %adapter can be updated from %installedVersion to %newVersion.',
    de: 'Adapter %adapter kann von %installedVersion auf %newVersion aktualisiert werden.',
    ru: 'Адаптер %adapter может быть обновлен с %installedVersion до %newVersion.',
    pt: 'O adaptador %adapter pode ser atualizado de %installedVersion para %newVersion.',
    nl: 'Adapter %adapter kan worden bijgewerkt van %installedVersion naar %newVersion.',
    fr: "L'adaptateur %adapter peut être mis à jour de %installedVersion à %newVersion.",
    it: "L'adattatore %adapter può essere aggiornato da %installedVersion a %newVersion.",
    es: 'El adaptador %adapter puede actualizarse de %installedVersion a %newVersion.',
    pl: 'Adapter %adapter może zostać zaktualizowany z %installedVersion do %newVersion.',
    uk: 'Адаптер %adapter можна оновити з %installedVersion до %newVersion.',
    'zh-cn': '适配器 %adapter 可以从 %installedVersion 升级到 %newVersion。',
};

/**
 * Get text for a message about adapter update in given language
 */
export function getAdapterUpdateText(options: AdapterUpdateOptions): string {
    const { lang, adapter, installedVersion, newVersion } = options;

    return updateText[lang]
        .replace('%adapter', adapter)
        .replace('%installedVersion', installedVersion)
        .replace('%newVersion', newVersion);
}
