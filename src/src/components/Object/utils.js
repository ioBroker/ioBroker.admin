import frLocale from 'date-fns/locale/fr';
import ruLocale from 'date-fns/locale/ru';
import enLocale from 'date-fns/locale/en-US';
import esLocale from 'date-fns/locale/es';
import plLocale from 'date-fns/locale/pl';
import ptLocale from 'date-fns/locale/pt';
import itLocale from 'date-fns/locale/it';
import cnLocale from 'date-fns/locale/zh-CN';
import brLocale from 'date-fns/locale/pt-BR';
import deLocale from 'date-fns/locale/de';
import nlLocale from 'date-fns/locale/nl';

// eslint-disable-next-line import/prefer-default-export
export const localeMap = {
    en: enLocale,
    fr: frLocale,
    ru: ruLocale,
    de: deLocale,
    es: esLocale,
    br: brLocale,
    nl: nlLocale,
    it: itLocale,
    pt: ptLocale,
    pl: plLocale,
    'zh-cn': cnLocale,
};
