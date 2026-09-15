import { I18n, type Translate } from '@iobroker/gui-components';

import countries from '../assets/json/countries.json';

/** Countries, which are shown at the top of the country lists */
const TOP_COUNTRIES: string[] = ['Germany', 'Austria', 'Switzerland'];

/** Not selectable entry between the top countries and all others */
export const COUNTRY_SEPARATOR = '---------';

/** The list is sorted only once per language */
let cache: { lang: string; names: string[] } | null = null;

/**
 * English names of the countries in the order they are shown: the top countries, the separator
 * and then all other countries sorted by their name in the current language
 */
export function getCountryList(t: Translate): string[] {
    const lang = I18n.getLanguage();
    if (cache?.lang !== lang) {
        const collator = new Intl.Collator(lang);
        const others = countries
            .map(country => country.name)
            .filter(name => !TOP_COUNTRIES.includes(name))
            .sort((a, b) => collator.compare(t(a), t(b)));
        cache = { lang, names: [...TOP_COUNTRIES, COUNTRY_SEPARATOR, ...others] };
    }
    return cache.names;
}
