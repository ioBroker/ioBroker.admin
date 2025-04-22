import { I18n } from '../../i18n';
import enLang from './i18n/en.json';
import deLang from './i18n/de.json';
import ruLang from './i18n/ru.json';
import ptLang from './i18n/pt.json';
import plLang from './i18n/pl.json';
import frLang from './i18n/fr.json';
import itLang from './i18n/it.json';
import nlLang from './i18n/nl.json';
import ukLang from './i18n/uk.json';
import zhLang from './i18n/zh-cn.json';

export function extendDeviceTypeTranslation() {
    I18n.extendTranslations({
        en: enLang,
        de: deLang,
        ru: ruLang,
        pt: ptLang,
        pl: plLang,
        fr: frLang,
        it: itLang,
        nl: nlLang,
        uk: ukLang,
        'zh-cn': zhLang,
    });
}
