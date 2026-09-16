import React from 'react';
import { Box } from '@mui/material';

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
 * A length of an image, as it is written in the tip text.
 *
 * A bare number is a number of pixels, like in HTML; anything else - `2em`, `100%` - is taken as it is.
 *
 * @param value value of the `width` or `height` attribute
 * @param defaultValue length to use if the attribute is missing
 */
function imageSize(value: string | undefined, defaultValue: string): string {
    if (!value) {
        return defaultValue;
    }
    return /^\d+$/.test(value) ? `${value}px` : value;
}

/**
 * Attributes of an HTML tag, like `src='x.png' width='20'`.
 *
 * @param tag the whole tag, the name of the tag is ignored
 */
function parseAttributes(tag: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const regExp = /([a-zA-Z][\w-]*)\s*=\s*(?:'([^']*)'|"([^"]*)")/g;
    let match: RegExpExecArray | null;
    while ((match = regExp.exec(tag)) !== null) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3];
    }
    return attributes;
}

/**
 * One image of a tip, written as `<img src='...' />` in the translation files.
 *
 * `src` is the address of a file or a data URI, `width`, `height` and `alt` are optional.
 *
 * An image with `class='icon'` is not drawn as a picture but as a mask filled with the color of the
 * text. A monochrome icon of the user interface can be used this way: such an icon is painted with
 * `currentColor`, which stays black inside an `<img>` tag - as a mask it follows the text and so
 * remains visible in the dark themes too.
 *
 * @param tag the whole `<img ... />` tag
 * @param key React key, as the images are rendered in a list
 * @param defaultAlt description of the image if the tag has no `alt` attribute
 * @returns the image, or `null` if the tag has no `src` and so cannot be shown
 */
function renderTipImage(tag: string, key: string, defaultAlt: string): React.JSX.Element | null {
    const attributes = parseAttributes(tag);
    if (!attributes.src) {
        return null;
    }
    // `image/svg` is no MIME type a browser knows - an SVG is `image/svg+xml` - and an image with a
    // wrong type is not shown at all. Older tips were written with the short form
    const src = attributes.src.replace(/^data:image\/svg;/, 'data:image/svg+xml;');

    if (attributes.class?.split(' ').includes('icon')) {
        const mask = `url("${src}")`;
        return (
            <Box
                component="span"
                key={key}
                title={attributes.alt || defaultAlt}
                sx={{
                    display: 'inline-block',
                    verticalAlign: 'text-bottom',
                    mx: '2px',
                    width: imageSize(attributes.width, '1.25em'),
                    height: imageSize(attributes.height || attributes.width, '1.25em'),
                    backgroundColor: 'currentColor',
                    maskImage: mask,
                    maskSize: 'contain',
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    WebkitMaskImage: mask,
                    WebkitMaskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                }}
            />
        );
    }

    return (
        <Box
            component="img"
            key={key}
            src={src}
            alt={attributes.alt || defaultAlt}
            sx={{
                verticalAlign: 'text-bottom',
                mx: '2px',
                maxWidth: '100%',
                width: imageSize(attributes.width, 'auto'),
                height: imageSize(attributes.height, 'auto'),
            }}
        />
    );
}

/**
 * Text of one tip in the given language, with the images in it.
 *
 * A tip may contain `<img src='...' />` tags - see `renderTipImage` - everything else is text.
 *
 * @param id name of the tip
 * @param lang language of the user interface
 */
export function getTipText(id: string, lang: ioBroker.Languages): React.JSX.Element | string {
    const text = TIP_TEXTS[lang]?.[id] || TIP_TEXTS.en[id] || id;
    if (!text.includes('<img')) {
        return text;
    }

    const parts: (React.JSX.Element | string)[] = [];
    const regExp = /<img\s[^>]*>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regExp.exec(text)) !== null) {
        const image = renderTipImage(match[0], `${id}-${match.index}`, id);
        if (!image) {
            // A tag without `src` shows up as text, so the mistake in the translation can be seen
            continue;
        }
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(image);
        lastIndex = match.index + match[0].length;
    }

    if (!parts.length) {
        return text;
    }

    const rest = text.substring(lastIndex);
    if (rest) {
        parts.push(rest);
    }

    return <span>{parts}</span>;
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
