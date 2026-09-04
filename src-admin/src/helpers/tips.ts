import enTips from '@/i18nTips/en.json';
import deTips from '@/i18nTips/de.json';
import ruTips from '@/i18nTips/ru.json';
import ptTips from '@/i18nTips/pt.json';
import nlTips from '@/i18nTips/nl.json';
import frTips from '@/i18nTips/fr.json';
import itTips from '@/i18nTips/it.json';
import esTips from '@/i18nTips/es.json';
import plTips from '@/i18nTips/pl.json';
import ukTips from '@/i18nTips/uk.json';
import zhcnTips from '@/i18nTips/zh-cn.json';

/**
 * Texts of the "Did you know ...?" tips, one file per language in `src/i18nTips`.
 *
 * The tips are kept apart from the translations of the user interface in `src/i18n`, because they are
 * content and not labels: a tip is added, changed or removed as a whole, and it is keyed by its own
 * short name instead of by an English sentence.
 */
const TIP_TEXTS: Record<ioBroker.Languages, Record<string, string>> = {
    en: enTips,
    de: deTips,
    ru: ruTips,
    pt: ptTips,
    nl: nlTips,
    fr: frTips,
    it: itTips,
    es: esTips,
    pl: plTips,
    uk: ukTips,
    'zh-cn': zhcnTips,
};

/**
 * Names of all tips, in the order in which they are shown.
 *
 * The English file is the master: it decides which tips exist and in which order. A tip that is
 * missing in another language falls back to English, so a new tip can be added without waiting for
 * all eleven translations.
 */
export const TIPS: string[] = Object.keys(enTips);

/**
 * Text of one tip in the given language.
 *
 * @param id name of the tip
 * @param lang language of the user interface
 */
export function getTipText(id: string, lang: ioBroker.Languages): string {
    return TIP_TEXTS[lang]?.[id] || TIP_TEXTS.en[id] || id;
}

/**
 * The tip that follows the given one, so the user sees another tip on every visit.
 *
 * @param lastShownId the tip that was shown the last time. An unknown name starts at the beginning
 * @returns the next tip, or `null` if there is no tip at all
 */
export function getNextTip(lastShownId?: string | null): string | null {
    if (!TIPS.length) {
        return null;
    }
    const lastIndex = lastShownId ? TIPS.indexOf(lastShownId) : -1;
    return TIPS[(lastIndex + 1) % TIPS.length];
}
