import langEn from './i18n/en.json';
import langDe from './i18n/de.json';
import langRu from './i18n/ru.json';
import langPt from './i18n/pt.json';
import langNl from './i18n/nl.json';
import langFr from './i18n/fr.json';
import langIt from './i18n/it.json';
import langEs from './i18n/es.json';
import langPl from './i18n/pl.json';
import langUk from './i18n/uk.json';
import langZhCn from './i18n/zh-cn.json';

export const dictionary: Record<ioBroker.Languages, Record<string, string>> = {
    en: langEn,
    de: langDe,
    ru: langRu,
    pt: langPt,
    nl: langNl,
    fr: langFr,
    it: langIt,
    es: langEs,
    pl: langPl,
    uk: langUk,
    'zh-cn': langZhCn,
};
