/**
 * Copyright 2018-2024 Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 * */
import React from 'react';
import {
    Utils as _Utils, I18n,
    type ThemeType, type ThemeName,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

const NAMESPACE    = 'material';
const days         = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const months       = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUALITY_BITS: Record<ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY], string> = {
    0x00: '0x00 - good',

    0x01: '0x01 - general problem',
    0x02: '0x02 - no connection problem',

    0x10: '0x10 - substitute value from controller',
    0x20: '0x20 - substitute initial value',
    0x40: '0x40 - substitute value from device or instance',
    0x80: '0x80 - substitute value from sensor',

    0x11: '0x11 - general problem by instance',
    0x41: '0x41 - general problem by device',
    0x81: '0x81 - general problem by sensor',

    0x12: '0x12 - instance not connected',
    0x42: '0x42 - device not connected',
    0x82: '0x82 - sensor not connected',

    0x44: '0x44 - device reports error',
    0x84: '0x84 - sensor reports error',
};
const SIGNATURES: Record<string, string> = {
    JVBERi0: 'pdf',
    R0lGODdh: 'gif',
    R0lGODlh: 'gif',
    iVBORw0KGgo: 'png',
    '/9j/': 'jpg',
    PHN2Zw: 'svg',
    Qk1: 'bmp',
    AAABAA: 'ico', // 00 00 01 00 according to https://en.wikipedia.org/wiki/List_of_file_signatures
};

type SmartName = null
    | false
    | string
    | ({ [lang in ioBroker.Languages]?: string } & {
    /** Which kind of device it is */
    smartType?: string | null;
    /** Which value to set when the ON command is issued */
    byON?: string | null;
});

type ClassDictionary = Record<string, any>;
// eslint-disable-next-line no-use-before-define
type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;
type ClassArray = ClassValue[];

class Utils {
    static namespace = NAMESPACE;

    static INSTANCES = 'instances';

    static dateFormat = ['DD', 'MM'];

    static FORBIDDEN_CHARS = /[^._\-/ :!#$%&()+=@^{}|~\p{Ll}\p{Lu}\p{Nd}]+/gu;

    /**
     * Capitalize words.
     */
    static CapitalWords(name: string | null | undefined): string {
        return (name || '')
            .split(/[\s_]/)
            .filter(item => item)
            .map(word => (word ? word[0].toUpperCase() + word.substring(1).toLowerCase() : ''))
            .join(' ');
    }

    static formatSeconds(seconds: number): string {
        const days_ = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;

        const hours = Math.floor(seconds / 3600)
            .toString()
            .padStart(2, '0');
        seconds %= 3600;

        const minutes = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0');
        seconds %= 60;

        const secondsStr = Math.floor(seconds).toString().padStart(2, '0');

        let text = '';
        if (days_) {
            text += `${days_} ${I18n.t('ra_daysShortText')} `;
        }
        text += `${hours}:${minutes}:${secondsStr}`;

        return text;
    }

    /**
     * Get the name of the object by id from the name or description.
     */
    static getObjectName(
        objects: Record<string, ioBroker.Object>,
        id: string,
        settings?: { name: ioBroker.StringOrTranslated } | ioBroker.Languages | null,
        options?: { language?: ioBroker.Languages },
        /** Set to true to get the description. */
        isDesc?: boolean,
    ): string {
        const item = objects[id];
        let text: string | undefined;

        if (typeof settings === 'string' && !options) {
            options = { language: settings };
            settings = null;
        }

        options = options || {};
        if (!options.language) {
            options.language =
                (objects['system.config'] &&
                    objects['system.config'].common &&
                    objects['system.config'].common.language) ||
                window.sysLang ||
                'en';
        }
        if ((settings as { name: ioBroker.StringOrTranslated })?.name) {
            const textObj = (settings as { name: ioBroker.StringOrTranslated }).name;
            if (typeof textObj === 'object') {
                text = (options.language && textObj[options.language]) || textObj.en;
            } else {
                text = textObj as string;
            }
        } else if (isDesc && item?.common?.desc) {
            const textObj = item.common.desc;
            if (typeof textObj === 'object') {
                text = (options.language && textObj[options.language]) || textObj.en || textObj.de || textObj.ru || '';
            } else {
                text = textObj as string;
            }
            text = (text || '').toString().replace(/[_.]/g, ' ');

            if (text === text.toUpperCase()) {
                text = text[0] + text.substring(1).toLowerCase();
            }
        } else if (!isDesc && item.common) {
            const textObj = item.common.name || item.common.desc;
            if (textObj && typeof textObj === 'object') {
                text = (options.language && textObj[options.language]) || textObj.en || textObj.de || textObj.ru || '';
            } else {
                text = textObj as string;
            }
            text = (text || '').toString().replace(/[_.]/g, ' ');

            if (text === text.toUpperCase()) {
                text = text[0] + text.substring(1).toLowerCase();
            }
        } else {
            const pos = id.lastIndexOf('.');
            text = id.substring(pos + 1).replace(/[_.]/g, ' ');
            text = Utils.CapitalWords(text);
        }

        return text?.trim() || '';
    }

    /**
     * Get the name of the object from the name or description.
     */
    static getObjectNameFromObj(
        obj: ioBroker.PartialObject,
        /** settings or language */
        settings: { name: ioBroker.StringOrTranslated } | ioBroker.Languages | null,
        options?: { language?: ioBroker.Languages },
        /** Set to true to get the description. */
        isDesc?: boolean,
        /** Allow using spaces in name (by edit) */
        noTrim?: boolean,
    ): string {
        const item = obj;
        let text = (obj && obj._id) || '';

        if (typeof settings === 'string' && !options) {
            options = { language: settings };
            settings = null;
        }

        options = options || {};

        if ((settings as { name: ioBroker.StringOrTranslated })?.name) {
            const name = (settings as { name: ioBroker.StringOrTranslated }).name;
            if (typeof name === 'object') {
                text = (options.language && name[options.language]) || name.en;
            } else {
                text = name;
            }
        } else if (isDesc && item?.common?.desc) {
            const desc: ioBroker.StringOrTranslated = item.common.desc;
            if (typeof desc === 'object') {
                text = (options.language && desc[options.language]) || desc.en;
            } else {
                text = desc;
            }
            text = (text || '').toString().replace(/[_.]/g, ' ');

            if (text === text.toUpperCase()) {
                text = text[0] + text.substring(1).toLowerCase();
            }
        } else if (!isDesc && item?.common?.name) {
            let name = item.common.name;
            if (!name && item.common.desc) {
                name = item.common.desc;
            }
            if (typeof name === 'object') {
                text = (options.language && name[options.language]) || name.en;
            } else {
                text = name;
            }
            text = (text || '').toString().replace(/[_.]/g, ' ');

            if (text === text.toUpperCase()) {
                text = text[0] + text.substring(1).toLowerCase();
            }
        }
        return noTrim ? text : text.trim();
    }

    /**
     * Extracts from the object material settings, depends on username
     */
    static getSettingsOrder(
        obj: ioBroker.StateObject | ioBroker.StateCommon,
        forEnumId: string,
        options: { user?: string },
    ): string | null {
        let common: ioBroker.StateCommon | undefined;
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            common = (obj as ioBroker.StateObject).common;
        } else {
            common = obj as any as ioBroker.StateCommon;
        }
        let settings;
        if (common?.custom) {
            settings = common.custom[NAMESPACE];
            const user = options.user || 'admin';
            if (settings && settings[user]) {
                if (forEnumId) {
                    if (settings[user].subOrder && settings[user].subOrder[forEnumId]) {
                        return JSON.parse(JSON.stringify(settings[user].subOrder[forEnumId]));
                    }
                } else if (settings[user].order) {
                    return JSON.parse(JSON.stringify(settings[user].order));
                }
            }
        }
        return null;
    }

    /**
        Used in material
     */
    static getSettingsCustomURLs(
        obj: ioBroker.StateObject | ioBroker.StateCommon,
        forEnumId: string,
        options: { user?: string },
    ): string | null {
        let common: ioBroker.StateCommon | undefined;
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            common = (obj as ioBroker.StateObject).common;
        } else {
            common = obj as any as ioBroker.StateCommon;
        }
        let settings;
        if (common?.custom) {
            settings = common.custom[NAMESPACE];
            const user = options.user || 'admin';
            if (settings && settings[user]) {
                if (forEnumId) {
                    if (settings[user].subURLs && settings[user].subURLs[forEnumId]) {
                        return JSON.parse(JSON.stringify(settings[user].subURLs[forEnumId]));
                    }
                } else if (settings[user].URLs) {
                    return JSON.parse(JSON.stringify(settings[user].URLs));
                }
            }
        }
        return null;
    }

    /**
     * Reorder the array items in list between source and dest.
     */
    static reorder(
        list: Iterable<any> | ArrayLike<any>,
        source: number,
        dest: number,
    ): Iterable<any> | ArrayLike<any> {
        const result = Array.from(list);
        const [removed] = result.splice(source, 1);
        result.splice(dest, 0, removed);
        return result;
    }

    /**
        Get smart name settings for the given object.
     */
    static getSettings(
        obj: ioBroker.StateObject | ioBroker.StateCommon,
        options: {
            id?: string;
            user?: string;
            name?: ioBroker.StringOrTranslated;
            icon?: string;
            color?: string;
            language?: ioBroker.Languages;
        },
        defaultEnabling?: boolean,
    ) {
        let settings;
        const id = (obj as ioBroker.StateObject)?._id || options?.id;
        let common: ioBroker.StateCommon | undefined;
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            common = (obj as ioBroker.StateObject).common;
        } else {
            common = obj as ioBroker.StateCommon;
        }
        if (common?.custom) {
            settings = common.custom;
            settings =
                settings[NAMESPACE] && settings[NAMESPACE][options.user || 'admin']
                    ? JSON.parse(JSON.stringify(settings[NAMESPACE][options.user || 'admin']))
                    : { enabled: true };
        } else {
            settings = { enabled: defaultEnabling === undefined ? true : defaultEnabling, useCustom: false };
        }

        if (!Object.prototype.hasOwnProperty.call(settings, 'enabled')) {
            settings.enabled = defaultEnabling === undefined ? true : defaultEnabling;
        }

        if (options) {
            if (!settings.name && options.name) {
                settings.name = options.name;
            }
            if (!settings.icon && options.icon) {
                settings.icon = options.icon;
            }
            if (!settings.color && options.color) {
                settings.color = options.color;
            }
        }

        if (common) {
            if (!settings.color && common.color) {
                settings.color = common.color;
            }
            if (!settings.icon && common.icon) {
                settings.icon = common.icon;
            }
            if (!settings.name && common.name) {
                settings.name = common.name;
            }
        }

        if (typeof settings.name === 'object') {
            settings.name = (options.language && settings.name[options.language]) || settings.name.en;

            settings.name = (settings.name || '').toString().replace(/_/g, ' ');

            if (settings.name === settings.name.toUpperCase()) {
                settings.name = settings.name[0] + settings.name.substring(1).toLowerCase();
            }
        }
        if (!settings.name && id) {
            const pos = id.lastIndexOf('.');
            settings.name = id.substring(pos + 1).replace(/[_.]/g, ' ');
            settings.name = (settings.name || '').toString().replace(/_/g, ' ');
            settings.name = Utils.CapitalWords(settings.name);
        }

        return settings;
    }

    /**
        Sets smartName settings for the given object.
     */
    static setSettings(
        obj: Partial<ioBroker.Object>,
        settings: Record<string, any>,
        options: { user?: string; language?: ioBroker.Languages },
    ): boolean {
        if (obj) {
            obj.common = obj.common || ({} as ioBroker.StateCommon);
            obj.common.custom = obj.common.custom || {};
            obj.common.custom[NAMESPACE] = obj.common.custom[NAMESPACE] || {};
            obj.common.custom[NAMESPACE][options.user || 'admin'] = settings;
            const s = obj.common.custom[NAMESPACE][options.user || 'admin'];
            if (s.useCommon) {
                if (s.color !== undefined) {
                    obj.common.color = s.color;
                    delete s.color;
                }
                if (s.icon !== undefined) {
                    obj.common.icon = s.icon;
                    delete s.icon;
                }
                if (s.name !== undefined) {
                    if (typeof obj.common.name !== 'object' && options.language) {
                        obj.common.name = { [options.language]: s.name } as ioBroker.StringOrTranslated;
                    } else if (typeof obj.common.name === 'object' && options.language) {
                        obj.common.name[options.language] = s.name;
                    }
                    delete s.name;
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Get the icon for the given settings.
     */
    static getIcon(
        settings: { icon?: string; name?: string; prefix?: string },
        style?: React.CSSProperties,
    ): React.JSX.Element | null {
        if (settings?.icon) {
            // If UTF-8 icon
            if (settings.icon.length <= 2) {
                return <span style={style || {}}>{settings.icon}</span>;
            }
            if (settings.icon.startsWith('data:image')) {
                return <img alt={settings.name} src={settings.icon} style={style || {}} />;
            }
            // maybe later some changes for a second type
            return <img alt={settings.name} src={(settings.prefix || '') + settings.icon} style={style} />;
        }
        return null;
    }

    /**
     * Get the icon for the given object.
     */
    static getObjectIcon(id: string | ioBroker.PartialObject, obj?: ioBroker.PartialObject): string | null {
        // If id is Object
        if (typeof id === 'object') {
            obj = id as ioBroker.PartialObject;
            id = obj?._id as string;
        }

        if (obj?.common?.icon) {
            let icon = obj.common.icon;
            // If UTF-8 icon
            if (typeof icon === 'string' && icon.length <= 2) {
                return icon;
            }
            if (icon.startsWith('data:image')) {
                return icon;
            }

            const parts = id.split('.');
            if (parts[0] === 'system') {
                icon = `adapter/${parts[2]}${icon.startsWith('/') ? '' : '/'}${icon}`;
            } else {
                icon = `adapter/${parts[0]}${icon.startsWith('/') ? '' : '/'}${icon}`;
            }

            if (window.location.pathname.match(/adapter\/[^/]+\/[^/]+\.html/)) {
                icon = `../../${icon}`;
            } else if (window.location.pathname.match(/material\/[.\d]+/)) {
                icon = `../../${icon}`;
            } else if (window.location.pathname.match(/material\//)) {
                icon = `../${icon}`;
            }
            return icon;
        }

        return null;
    }

    /**
     * Converts word1_word2 to word1Word2.
     */
    static splitCamelCase(text: string | null | undefined): string {
        // if (false && text !== text.toUpperCase()) {
        //     const words = text.split(/\s+/);
        //     for (let i = 0; i < words.length; i++) {
        //         const word = words[i];
        //         if (word.toLowerCase() !== word && word.toUpperCase() !== word) {
        //             let z = 0;
        //             const ww = [];
        //             let start = 0;
        //             while (z < word.length) {
        //                 if (word[z].match(/[A-ZÜÄÖА-Я]/)) {
        //                     ww.push(word.substring(start, z));
        //                     start = z;
        //                 }
        //                 z++;
        //             }
        //             if (start !== z) {
        //                 ww.push(word.substring(start, z));
        //             }
        //             for (let k = 0; k < ww.length; k++) {
        //                 words.splice(i + k, 0, ww[k]);
        //             }
        //             i += ww.length;
        //         }
        //     }
        //
        //     return words.map(w => {
        //         w = w.trim();
        //         if (w) {
        //             return w[0].toUpperCase() + w.substring(1).toLowerCase();
        //         }
        //         return '';
        //     }).join(' ');
        // }
        return text ? Utils.CapitalWords(text) : '';
    }

    /**
     * Check if the given color is bright.
     * https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
     */
    static isUseBright(color: string | null | undefined, defaultValue?: boolean): boolean {
        if (!color) {
            return defaultValue === undefined ? true : defaultValue;
        }
        color = color.toString();
        if (color.startsWith('#')) {
            color = color.slice(1);
        }
        let r;
        let g;
        let b;

        const rgb = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        if (rgb && rgb.length === 4) {
            r = parseInt(rgb[1], 10);
            g = parseInt(rgb[2], 10);
            b = parseInt(rgb[3], 10);
        } else {
            // convert 3-digit hex to 6-digits.
            if (color.length === 3) {
                color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
            }
            // remove alfa channel
            if (color.length === 8) {
                color = color.substring(0, 6);
            } else if (color.length !== 6) {
                return false;
            }

            r = parseInt(color.slice(0, 2), 16);
            g = parseInt(color.slice(2, 4), 16);
            b = parseInt(color.slice(4, 6), 16);
        }

        // http://stackoverflow.com/a/3943023/112731
        return r * 0.299 + g * 0.587 + b * 0.114 <= 186;
    }

    /**
     * Get the time string in the format 00:00.
     */
    static getTimeString(seconds: string | number): string {
        seconds = parseFloat(seconds as string);
        if (Number.isNaN(seconds)) {
            return '--:--';
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        if (hours) {
            return `${hours}:${minutes}:${secs}`;
        }

        return `${minutes}:${secs}`;
    }

    /**
     * Gets the wind direction with the given angle (degrees).
     */
    static getWindDirection(
        /** angle in degrees from 0° to 360° */
        angle: number,
    ): string {
        if (angle >= 0 && angle < 11.25) {
            return 'N';
        }
        if (angle >= 11.25 && angle < 33.75) {
            return 'NNE';
        }
        if (angle >= 33.75 && angle < 56.25) {
            return 'NE';
        }
        if (angle >= 56.25 && angle < 78.75) {
            return 'ENE';
        }
        if (angle >= 78.75 && angle < 101.25) {
            return 'E';
        }
        if (angle >= 101.25 && angle < 123.75) {
            return 'ESE';
        }
        if (angle >= 123.75 && angle < 146.25) {
            return 'SE';
        }
        if (angle >= 146.25 && angle < 168.75) {
            return 'SSE';
        }
        if (angle >= 168.75 && angle < 191.25) {
            return 'S';
        }
        if (angle >= 191.25 && angle < 213.75) {
            return 'SSW';
        }
        if (angle >= 213.75 && angle < 236.25) {
            return 'SW';
        }
        if (angle >= 236.25 && angle < 258.75) {
            return 'WSW';
        }
        if (angle >= 258.75 && angle < 281.25) {
            return 'W';
        }
        if (angle >= 281.25 && angle < 303.75) {
            return 'WNW';
        }
        if (angle >= 303.75 && angle < 326.25) {
            return 'NW';
        }
        if (angle >= 326.25 && angle < 348.75) {
            return 'NNW';
        }
        // if (angle >= 348.75) {
        return 'N';
    }

    /**
     * Pad the given number with a zero if it's not two digits long.
     */
    static padding(num: string | number): string {
        if (typeof num === 'string') {
            if (num.length < 2) {
                return `0${num}`;
            }
            return num;
        }
        if (num < 10) {
            return `0${num}`;
        }
        return num.toString();
    }

    /**
     * Sets the date format.
     */
    static setDataFormat(format: string): void {
        if (format) {
            Utils.dateFormat = format.toUpperCase().split(/[.-/]/);
            Utils.dateFormat.splice(Utils.dateFormat.indexOf('YYYY'), 1);
        }
    }

    /**
     * Converts the date to a string.
     */
    static date2string(now: string | number | Date): string {
        if (typeof now === 'string') {
            now = now.trim();
            if (!now) {
                return '';
            }
            // only letters
            if (now.match(/^[\w\s]+$/)) {
                // Day of the week
                return now;
            }
            const m = now.match(/(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})/);
            if (m) {
                const a = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
                // We now have 3 numbers. Let's try to detect where is year, where is day and where is month
                const year = a.find(y => y > 31);
                if (year !== undefined) {
                    a.splice(a.indexOf(year), 1);

                    const day = a.find(mm => mm > 12);
                    if (day) {
                        a.splice(a.indexOf(day), 1);
                        now = new Date(year, a[0] - 1, day);
                    } else if (Utils.dateFormat[0][0] === 'M' && Utils.dateFormat[1][0] === 'D') {
                        // MM DD
                        now = new Date(year, a[0] - 1, a[1]);
                        if (Math.abs(now.getTime() - Date.now()) > 3600000 * 24 * 10) {
                            now = new Date(year, a[1] - 1, a[0]);
                        }
                    } else if (Utils.dateFormat[0][0] === 'D' && Utils.dateFormat[1][0] === 'M') {
                        // DD MM
                        now = new Date(year, a[1] - 1, a[0]);
                        if (Math.abs(now.getTime() - Date.now()) > 3600000 * 24 * 10) {
                            now = new Date(year, a[0] - 1, a[1]);
                        }
                    } else {
                        now = new Date(now);
                    }
                } else {
                    now = new Date(now);
                }
            } else {
                now = new Date(now);
            }
        } else {
            now = new Date(now);
        }

        let date = I18n.t(`ra_dow_${days[now.getDay()]}`).replace('ra_dow_', '');
        date += `. ${now.getDate()} ${I18n.t(`ra_month_${months[now.getMonth()]}`).replace('ra_month_', '')}`;
        return date;
    }

    /**
     * Render a text as a link.
     */
    static renderTextWithA(text: string): React.JSX.Element[] | string {
        let m: RegExpMatchArray | null = text.match(/<a [^<]+<\/a>|<br\s?\/?>|<b>[^<]+<\/b>|<i>[^<]+<\/i>/);
        if (m) {
            const result: React.JSX.Element[] = [];
            let key = 1;
            do {
                const start = text.substring(0, m.index);
                text = text.substring((m.index || 0) + m[0].length);
                start && result.push(<span key={`a${key++}`}>{start}</span>);

                if (m[0].startsWith('<b>')) {
                    result.push(<b key={`a${key++}`}>{m[0].substring(3, m[0].length - 4)}</b>);
                } else if (m[0].startsWith('<i>')) {
                    result.push(<i key={`a${key++}`}>{m[0].substring(3, m[0].length - 4)}</i>);
                } else if (m[0].startsWith('<br')) {
                    result.push(<br key={`a${key++}`} />);
                } else {
                    const href = m[0].match(/href="([^"]+)"/) || m[0].match(/href='([^']+)'/);
                    const target = m[0].match(/target="([^"]+)"/) || m[0].match(/target='([^']+)'/);
                    const rel = m[0].match(/rel="([^"]+)"/) || m[0].match(/rel='([^']+)'/);
                    const title = m[0].match(/>([^<]*)</);

                    // eslint-disable-next-line
                    result.push(<a
                        key={`a${key++}`}
                        href={href ? href[1] : ''}
                        target={target ? target[1] : '_blank'}
                        rel={rel ? rel[1] : ''}
                        style={{ color: 'inherit' }}
                    >
                        {title ? title[1] : ''}
                    </a>);
                }

                m = text ? text.match(/<a [^<]+<\/a>|<br\/?>|<b>[^<]+<\/b>|<i>[^<]+<\/i>/) : null;
                if (!m) {
                    text && result.push(<span key={`a${key++}`}>{text}</span>);
                }
            } while (m);

            return result;
        }

        return text;
    }

    /**
     * Get the smart name of the given state.
     */
    static getSmartName(
        states: Record<string, ioBroker.StateObject> | ioBroker.StateObject | ioBroker.StateCommon,
        id: string,
        instanceId: string,
        noCommon?: boolean,
    ): SmartName | undefined {
        if (!id) {
            if (!noCommon) {
                if (!(states as ioBroker.StateObject).common) {
                    return (states as ioBroker.StateCommon).smartName;
                }
                if (states && !(states as ioBroker.StateObject).common) {
                    return (states as ioBroker.StateCommon).smartName;
                }
                return (states as ioBroker.StateObject).common.smartName;
            }
            if (states && !(states as ioBroker.StateObject).common) {
                return (states as ioBroker.StateCommon).smartName;
            }
            const obj = states as ioBroker.StateObject;
            return obj?.common?.custom && obj.common.custom[instanceId] ?
                obj.common.custom[instanceId].smartName : undefined;
        }
        if (!noCommon) {
            return (states as Record<string, ioBroker.StateObject>)[id].common.smartName;
        }
        const obj = (states as Record<string, ioBroker.StateObject>)[id];

        return obj?.common?.custom && obj.common.custom[instanceId] ?
            obj.common.custom[instanceId].smartName || null : null;
    }

    /**
     * Get the smart name from a state.
     */
    static getSmartNameFromObj(
        obj: ioBroker.StateObject | ioBroker.StateCommon,
        instanceId: string,
        noCommon?: boolean,
    ): SmartName | undefined {
        if (!noCommon) {
            if (!(obj as ioBroker.StateObject).common) {
                return (obj as ioBroker.StateCommon).smartName;
            }
            if (obj && !(obj as ioBroker.StateObject).common) {
                return (obj as ioBroker.StateCommon).smartName;
            }

            return (obj as ioBroker.StateObject).common.smartName;
        }
        if (obj && !(obj as ioBroker.StateObject).common) {
            return (obj as ioBroker.StateCommon).smartName;
        }

        const custom: Record<string, string> | undefined | null = (obj as ioBroker.StateObject)?.common?.custom?.[instanceId];

        return custom ? custom.smartName : undefined;
    }

    /**
     * Enable smart name for a state.
     */
    static enableSmartName(
        obj: ioBroker.StateObject,
        instanceId: string,
        noCommon?: boolean,
    ): void {
        if (noCommon) {
            obj.common.custom = obj.common.custom || {};
            obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
            obj.common.custom[instanceId].smartName = {};
        } else {
            obj.common.smartName = {};
        }
    }

    /**
     * Completely remove smart name from a state.
     */
    static removeSmartName(
        obj: ioBroker.StateObject,
        instanceId: string,
        noCommon?: boolean,
    ) {
        if (noCommon) {
            if (obj.common && obj.common.custom && obj.common.custom[instanceId]) {
                obj.common.custom[instanceId] = null;
            }
        } else {
            obj.common.smartName = null;
        }
    }

    /**
     * Update the smart name of a state.
     */
    static updateSmartName(
        obj: ioBroker.StateObject,
        newSmartName: ioBroker.StringOrTranslated,
        byON: string | null,
        smartType: string | null,
        instanceId: string,
        noCommon?: boolean,
    ) {
        const language = I18n.getLanguage();

        // convert the old format
        if (typeof obj.common.smartName === 'string') {
            const nnn = obj.common.smartName;
            obj.common.smartName = {};
            obj.common.smartName[language] = nnn;
        }

        // convert the old settings
        if (obj.native && obj.native.byON) {
            delete obj.native.byON;
            let _smartName: SmartName = obj.common.smartName as SmartName;

            if (_smartName && typeof _smartName !== 'object') {
                _smartName = {
                    en: _smartName as string,
                    [language]: _smartName as string,
                };
            }
            obj.common.smartName = _smartName;
        }
        if (smartType !== undefined) {
            if (noCommon) {
                obj.common.custom = obj.common.custom || {};
                obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
                obj.common.custom[instanceId].smartName = obj.common.custom[instanceId].smartName || {};
                if (!smartType) {
                    delete obj.common.custom[instanceId].smartName.smartType;
                } else {
                    obj.common.custom[instanceId].smartName.smartType = smartType;
                }
            } else {
                obj.common.smartName = obj.common.smartName || {};
                if (!smartType) {
                    // @ts-expect-error fixed in js-controller
                    delete obj.common.smartName.smartType;
                } else {
                    // @ts-expect-error fixed in js-controller
                    obj.common.smartName.smartType = smartType;
                }
            }
        }

        if (byON !== undefined) {
            if (noCommon) {
                obj.common.custom = obj.common.custom || {};
                obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
                obj.common.custom[instanceId].smartName = obj.common.custom[instanceId].smartName || {};
                obj.common.custom[instanceId].smartName.byON = byON;
            } else {
                obj.common.smartName = obj.common.smartName || {};
                // @ts-expect-error fixed in js-controller
                obj.common.smartName.byON = byON;
            }
        }

        if (newSmartName !== undefined) {
            let smartName;
            if (noCommon) {
                obj.common.custom = obj.common.custom || {};
                obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
                obj.common.custom[instanceId].smartName = obj.common.custom[instanceId].smartName || {};
                smartName = obj.common.custom[instanceId].smartName;
            } else {
                obj.common.smartName = obj.common.smartName || {};
                smartName = obj.common.smartName;
            }
            smartName[language] = newSmartName;

            // If smart name deleted
            if (
                smartName &&
                (!smartName[language] ||
                    (smartName[language] === obj.common.name &&
                        (!obj.common.role || obj.common.role.includes('button'))))
            ) {
                delete smartName[language];
                let empty = true;
                // Check if the structure has any definitions
                for (const key in smartName) {
                    if (Object.prototype.hasOwnProperty.call(smartName, key)) {
                        empty = false;
                        break;
                    }
                }
                // If empty => delete smartName completely
                if (empty) {
                    if (noCommon && obj.common.custom && obj.common.custom[instanceId]) {
                        if (obj.common.custom[instanceId].smartName.byON === undefined) {
                            delete obj.common.custom[instanceId];
                        } else {
                            delete obj.common.custom[instanceId].en;
                            delete obj.common.custom[instanceId].de;
                            delete obj.common.custom[instanceId].ru;
                            delete obj.common.custom[instanceId].nl;
                            delete obj.common.custom[instanceId].pl;
                            delete obj.common.custom[instanceId].it;
                            delete obj.common.custom[instanceId].fr;
                            delete obj.common.custom[instanceId].pt;
                            delete obj.common.custom[instanceId].es;
                            delete obj.common.custom[instanceId].uk;
                            delete obj.common.custom[instanceId]['zh-cn'];
                        }
                        // @ts-expect-error fixed in js-controller
                    } else if (obj.common.smartName && (obj.common.smartName as SmartName).byON !== undefined) {
                        const _smartName: { [lang in ioBroker.Languages]?: string } = obj.common.smartName as { [lang in ioBroker.Languages]?: string };
                        delete _smartName.en;
                        delete _smartName.de;
                        delete _smartName.ru;
                        delete _smartName.nl;
                        delete _smartName.pl;
                        delete _smartName.it;
                        delete _smartName.fr;
                        delete _smartName.pt;
                        delete _smartName.es;
                        delete _smartName.uk;
                        delete _smartName['zh-cn'];
                    } else {
                        obj.common.smartName = null;
                    }
                }
            }
        }
    }

    /**
     * Disable the smart name of a state.
     */
    static disableSmartName(
        obj: ioBroker.StateObject,
        instanceId: string,
        noCommon?: boolean,
    ): void {
        if (noCommon) {
            obj.common.custom = obj.common.custom || {};
            obj.common.custom[instanceId] = obj.common.custom[instanceId] || {};
            obj.common.custom[instanceId].smartName = false;
        } else {
            obj.common.smartName = false;
        }
    }

    /**
     * Copy text to the clipboard.
     */
    static copyToClipboard(
        text: string,
        e?: Event,
    ): boolean {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        return _Utils.copyToClipboard(text);
    }

    /**
     * Gets the extension of a file name.
     * @param fileName the file name.
     * @returns The extension in lower case.
     */
    static getFileExtension(fileName: string): string | null {
        const pos = (fileName || '').lastIndexOf('.');
        if (pos !== -1) {
            return fileName.substring(pos + 1).toLowerCase();
        }
        return null;
    }

    /**
     * Format number of bytes as a string with B, KB, MB or GB.
     * The base for all calculations is 1024.
     * @returns The formatted string (e.g. '723.5 KB')
     */
    static formatBytes(
        /** The number of bytes. */
        bytes: number,
    ): string {
        if (Math.abs(bytes) < 1024) {
            return `${bytes} B`;
        }

        const units = ['KB', 'MB', 'GB'];
        // const units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        let u = -1;

        do {
            bytes /= 1024;
            ++u;
        } while (Math.abs(bytes) >= 1024 && u < units.length - 1);

        return `${bytes.toFixed(1)} ${units[u]}`;
    }

    /**
     * Invert the given color according to a theme type to get the inverted text color for background
     */
    static getInvertedColor(
        /** Color in the format '#rrggbb' or '#rgb' (or without a hash) */
        color: string,
        themeType: ThemeType,
        /** dark theme has light color in control, or light theme has light color in control */
        invert?: boolean,
    ): string | undefined {
        if (!color) {
            return undefined;
        }
        const invertedColor = Utils.invertColor(color, true);
        if (invertedColor === '#FFFFFF' && (themeType === 'dark' || (invert && themeType === 'light'))) {
            return '#DDD';
        }
        if (invertedColor === '#000000' && (themeType === 'light' || (invert && themeType === 'dark'))) {
            return '#222';
        }

        return undefined;
    }

    // Big thanks to: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    /**
     * Invert the given color
     * @param hex Color in the format '#rrggbb' or '#rgb' (or without hash)
     * @param bw Set to black or white.
     */
    static invertColor(hex: string, bw?: boolean): string {
        if (hex === undefined || hex === null || hex === '' || typeof hex !== 'string') {
            return '';
        }
        if (hex.startsWith('rgba')) {
            const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
            if (m) {
                hex =
                    parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('rgb')) {
            const m = hex.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) {
                hex =
                    parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        let alfa = null;
        if (hex.length === 8) {
            alfa = hex.substring(6, 8);
            hex = hex.substring(0, 6);
        } else if (hex.length !== 6) {
            console.warn(`Cannot invert color: ${hex}`);
            return hex;
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return r * 0.299 + g * 0.587 + b * 0.114 > 186
                ? `#000000${alfa || ''}`
                : `#FFFFFF${alfa || ''}`;
        }
        // invert color components
        const rs = (255 - r).toString(16);
        const gs = (255 - g).toString(16);
        const bd = (255 - b).toString(16);
        // pad each with zeros and return
        return `#${rs.padStart(2, '0')}${gs.padStart(2, '0')}${bd.padStart(2, '0')}${alfa || ''}`;
    }

    /**
     * Convert RGB to array [r, g, b]
     * @param hex Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @returns Array with 3 elements [r, g, b]
     */
    static color2rgb(hex: string): false | [number, number, number] | '' {
        if (hex === undefined || hex === null || hex === '' || typeof hex !== 'string') {
            return false;
        }
        if (hex.startsWith('rgba')) {
            const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
            if (m) {
                hex =
                    parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('rgb')) {
            const m = hex.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) {
                hex =
                    parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6 && hex.length !== 8) {
            console.warn(`Cannot invert color: ${hex}`);
            return false;
        }

        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ];
    }

    // Big thanks to: https://github.com/antimatter15/rgb-lab
    /**
     * Convert RGB to LAB
     * @param {Array<number>} rgb color in format [r,g,b]
     * @returns {Array<number>} lab color in format [l,a,b]
     */
    static rgb2lab(rgb: [number, number, number]): [number, number, number] {
        let r = rgb[0] / 255;
        let g = rgb[1] / 255;
        let b = rgb[2] / 255;

        r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
        g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
        b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

        let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        let y = r * 0.2126 + g * 0.7152 + b * 0.0722; /*  / 1.00000; */
        let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = x > 0.008856 ? x ** 0.33333333 : 7.787 * x + 0.137931; // 16 / 116;
        y = y > 0.008856 ? y ** 0.33333333 : 7.787 * y + 0.137931; // 16 / 116;
        z = z > 0.008856 ? z ** 0.33333333 : 7.787 * z + 0.137931; // 16 / 116;

        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    }

    /**
     * Calculate the distance between two colors in LAB color space in the range 0-100^2
     * If distance is less than 1000, the colors are similar
     * @param color1 Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @param color2 Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @returns distance in the range 0-100^2
     */
    static colorDistance(color1: string, color2: string): number {
        const rgb1 = Utils.color2rgb(color1);
        const rgb2 = Utils.color2rgb(color2);
        if (!rgb1 || !rgb2) {
            return 0;
        }

        const lab1 = Utils.rgb2lab(rgb1);
        const lab2 = Utils.rgb2lab(rgb2);
        const dltL = lab1[0] - lab2[0];
        const dltA = lab1[1] - lab2[1];
        const dltB = lab1[2] - lab2[2];
        const c1 = Math.sqrt(lab1[1] * lab1[1] + lab1[2] * lab1[2]);
        const c2 = Math.sqrt(lab2[1] * lab2[1] + lab2[2] * lab2[2]);
        const dltC = c1 - c2;
        let dltH = dltA * dltA + dltB * dltB - dltC * dltC;
        dltH = dltH < 0 ? 0 : Math.sqrt(dltH);
        const sc = 1.0 + 0.045 * c1;
        const sh = 1.0 + 0.015 * c1;
        const dltLKlsl = dltL;
        const dltCkcsc = dltC / sc;
        const dltHkhsh = dltH / sh;
        const i = dltLKlsl * dltLKlsl + dltCkcsc * dltCkcsc + dltHkhsh * dltHkhsh;
        return i < 0 ? 0 : i;
    }

    // https://github.com/lukeed/clsx/blob/master/src/index.js
    // License
    // MIT © Luke Edwards
    /**
     * @private
     */
    static _toVal(mix: ClassValue): string {
        let y;
        let str = '';

        if (typeof mix === 'string' || typeof mix === 'number') {
            str += mix;
        } else if (typeof mix === 'object') {
            if (Array.isArray(mix)) {
                for (let k = 0; k < mix.length; k++) {
                    if (mix[k]) {
                        y = Utils._toVal(mix[k]);
                        if (y) {
                            str && (str += ' ');
                            str += y;
                        }
                    }
                }
            } else {
                for (const k in mix) {
                    if (mix[k]) {
                        str && (str += ' ');
                        str += k;
                    }
                }
            }
        }

        return str;
    }

    // https://github.com/lukeed/clsx/blob/master/src/index.js
    // License
    // MIT © Luke Edwards
    /**
     * Convert any object to a string with its values.
     * @returns {string}
     */
    static clsx(...inputs: ClassValue[]): string {
        let i = 0;
        let tmp;
        let x;
        let str = '';
        while (i < inputs.length) {
            // eslint-disable-next-line prefer-rest-params
            tmp = inputs[i++];
            if (tmp) {
                x = Utils._toVal(tmp);
                if (x) {
                    str && (str += ' ');
                    str += x;
                }
            }
        }
        return str;
    }

    /**
     * Get the current theme name (either from local storage or the browser settings).
     */
    static getThemeName(themeName?: ThemeName | null): ThemeName {
        if ((window as any).vendorPrefix && (window as any).vendorPrefix !== '@@vendorPrefix@@' && (window as any).vendorPrefix !== 'MV') {
            return (window as any).vendorPrefix;
        }

        themeName = ((window as any)._localStorage || window.localStorage).getItem('App.themeName');
        if (themeName) {
            return themeName;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'colored';
    }

    /**
     * Get the type of theme.
     */
    static getThemeType(themeName?: ThemeName): ThemeType {
        if ((window as any).vendorPrefix && (window as any).vendorPrefix !== '@@vendorPrefix@@') {
            return 'light';
        }

        themeName = themeName || ((window as any)._localStorage || window.localStorage).getItem('App.themeName');
        return themeName === 'dark' || themeName === 'blue' ? 'dark' : 'light';
    }

    /**
     * Set the theme name and theme type.
     */
    static setThemeName(themeName: ThemeName): void {
        const vendorPrefix = (window as any).vendorPrefix;
        if (vendorPrefix && vendorPrefix !== '@@vendorPrefix@@' && vendorPrefix !== 'MV') {
            return; // ignore
        }
        ((window as any)._localStorage || window.localStorage).setItem('App.themeName', themeName);
        ((window as any)._localStorage || window.localStorage).setItem(
            'App.theme',
            themeName === 'dark' || themeName === 'blue' ? 'dark' : 'light',
        );
    }

    /**
     * Toggle the theme name between 'dark' and 'colored'.
     * @returns the new theme name.
     */
    static toggleTheme(themeName?: ThemeName | null): ThemeName {
        if ((window as any).vendorPrefix && (window as any).vendorPrefix !== '@@vendorPrefix@@' && (window as any).vendorPrefix !== 'MV') {
            return (window as any).vendorPrefix as ThemeName;
        }
        themeName = themeName || ((window as any)._localStorage || window.localStorage).getItem('App.themeName') || 'light';

        // dark => blue => colored => light => dark
        const themes = Utils.getThemeNames();
        const pos = themeName ? themes.indexOf(themeName) : -1;
        let newTheme: ThemeName;
        if (pos !== -1) {
            newTheme = themes[(pos + 1) % themes.length];
        } else {
            newTheme = themes[0];
        }
        Utils.setThemeName(newTheme);

        return newTheme;
    }

    /**
     * Get the list of themes
     * @returns list of possible themes
     */
    static getThemeNames(): ThemeName[] {
        if ((window as any).vendorPrefix && (window as any).vendorPrefix !== '@@vendorPrefix@@' && (window as any).vendorPrefix !== 'MV') {
            return [(window as any).vendorPrefix as ThemeName];
        }

        return ['light', 'dark', 'blue', 'colored'];
    }

    /**
     * Parse a query string into its parts.
     */
    static parseQuery(query: string): Record<string, string | number | boolean> {
        query = (query || '').toString().replace(/^\?/, '');
        const result: Record<string, string | number | boolean> = {};
        query.split('&').forEach(part => {
            part = part.trim();
            if (part) {
                const parts = part.split('=');
                const attr = decodeURIComponent(parts[0]).trim();
                if (parts.length > 1) {
                    const value = decodeURIComponent(parts[1]);
                    if (value === 'true') {
                        result[attr] = true;
                    } else if (value === 'false') {
                        result[attr] = false;
                    } else {
                        const f = parseFloat(value);
                        if (f.toString() === value) {
                            result[attr] = f;
                        } else {
                            result[attr] = value;
                        }
                    }
                } else {
                    result[attr] = true;
                }
            }
        });
        return result;
    }

    /**
     * Returns parent ID.
     * @returns parent ID or null if no parent
     */
    static getParentId(id: string): string | null {
        const p = (id || '').toString().split('.');
        if (p.length > 1) {
            p.pop();
            return p.join('.');
        }

        return null;
    }

    static formatDate(dateObj: Date, dateFormat: string): string {
        // format could be DD.MM.YYYY, YYYY.MM.DD or MM/DD/YYYY

        if (!dateObj) {
            return '';
        }

        let text;
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const dd = dateObj.getDate().toString().padStart(2, '0');

        if (dateFormat === 'MM/DD/YYYY') {
            text = `${mm}/${dd}/${dateObj.getFullYear()}`;
        } else {
            text = `${dateObj.getFullYear()}-${mm}-${dd}`;
        }

        // time
        let v = dateObj.getHours().toString().padStart(2, '0');
        text += ` ${v}`;
        v = dateObj.getMinutes().toString().toString();
        text += `:${v}`;

        v = dateObj.getSeconds().toString().padStart(2, '0');
        text += `:${v}`;

        v = dateObj.getMilliseconds().toString().padStart(3, '0');
        text += `.${v}`;

        return text;
    }

    /*
       Format seconds to string like 'h:mm:ss' or 'd.hh:mm:ss'
    */
    static formatTime(seconds: number): string {
        if (seconds) {
            seconds = Math.round(seconds);
            const d = Math.floor(seconds / (3600 * 24));
            const h = Math.floor((seconds % (3600 * 24)) / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (d) {
                return `${d}.${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            if (h) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }

            return `0:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return '0:00:00';
    }

    static MDtext2link(text: string): string {
        const m = text.match(/\d+\.\)\s/);
        if (m) {
            text = text.replace(m[0], m[0].replace(/\s/, '&nbsp;'));
        }

        return text
            .replace(/[^a-zA-Zа-яА-Я0-9]/g, '')
            .trim()
            .replace(/\s/g, '')
            .toLowerCase();
    }

    /*
      Open url link in the new target window
     */
    static openLink(url: string, target?: string): void {
        // replace IPv6 Address with [ipv6]:port
        url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');

        if (target === 'this') {
            window.location.href = url;
        } else {
            window.open(url, target || '_blank');
        }
    }

    static MDgetTitle(text: string): string {
        const result = Utils.MDextractHeader(text);
        const header = result.header;
        let body = result.body;
        if (!header.title) {
            // remove {docsify-bla}
            body = body.replace(/{[^}]*}/g, '');
            body = body.trim();
            const lines = body.replace(/\r/g, '').split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('# ')) {
                    return lines[i].substring(2).trim();
                }
            }
            return '';
        }

        return header.title?.toString() || '';
    }

    static MDextractHeader(text: string): { header: Record<string, string | boolean | number>; body: string } {
        const attrs: Record<string, string | boolean | number> = {};
        if (text.substring(0, 3) === '---') {
            const pos = text.substring(3).indexOf('\n---');
            if (pos !== -1) {
                const _header = text.substring(3, pos + 3);
                const lines = _header.replace(/\r/g, '').split('\n');
                lines.forEach(line => {
                    if (!line.trim()) {
                        return;
                    }
                    const pos_ = line.indexOf(':');
                    if (pos_ !== -1) {
                        const attr = line.substring(0, pos_).trim();
                        let value = line.substring(pos_ + 1).trim();
                        value = value.replace(/^['"]|['"]$/g, '');
                        if (value === 'true') {
                            attrs[attr] = true;
                        } else if (value === 'false') {
                            attrs[attr] = false;
                        } else if (parseFloat(value).toString() === attrs[attr]) {
                            attrs[attr] = parseFloat(value);
                        } else {
                            attrs[attr] = value;
                        }
                    } else {
                        attrs[line.trim()] = true;
                    }
                });
                text = text.substring(pos + 7);
            }
        }
        return { header: attrs, body: text };
    }

    static MDremoveDocsify(text: string): string {
        const m = text.match(/{docsify-[^}]*}/g);
        if (m) {
            m.forEach(doc => (text = text.replace(doc, '')));
        }
        return text;
    }

    /**
     * Generate the file for download from JSON object.
     */
    static generateFile(
        fileName: string,
        /**  json file data */
        json: Record<string, any>,
    ): void {
        const el = document.createElement('a');
        el.setAttribute(
            'href',
            `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json, null, 2))}`,
        );
        el.setAttribute('download', fileName);

        el.style.display = 'none';
        document.body.appendChild(el);

        el.click();

        document.body.removeChild(el);
    }

    /**
     * Convert quality code into text
     * @returns lines that decode quality
     */
    static quality2text(quality: ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY]): string[] {
        // eslint-disable-next-line no-bitwise
        const custom = quality & 0xFFFF0000;
        const text: string = QUALITY_BITS[quality];
        let result;
        if (text) {
            result = [text];
            // eslint-disable-next-line no-bitwise
        } else if (quality & 0x01) {
            // eslint-disable-next-line no-bitwise
            result = [QUALITY_BITS[0x01], `0x${(quality & (0xFFFF & ~1)).toString(16)}`];
            // eslint-disable-next-line no-bitwise
        } else if (quality & 0x02) {
            // eslint-disable-next-line no-bitwise
            result = [QUALITY_BITS[0x02], `0x${(quality & (0xFFFF & ~2)).toString(16)}`];
        } else {
            result = [`0x${quality.toString(16)}`];
        }
        if (custom) {
            // eslint-disable-next-line no-bitwise
            result.push(`0x${(custom >> 16).toString(16).toUpperCase()}`);
        }
        return result;
    }

    /**
     * Deep copy object
     */
    static clone(object: Record<string, any>): Record<string, any> {
        return JSON.parse(JSON.stringify(object));
    }

    /**
     * Get states of object
     * @returns states as an object in form {"value1": "label1", "value2": "label2"} or null
     */
    static getStates(obj: ioBroker.StateObject | null | undefined): Record<string, string> | null {
        const states: Record<string, string> | string[] | string | undefined | null = obj?.common?.states;
        let result: Record<string, string> | null | undefined;
        if (states) {
            if (typeof states === 'string' && states[0] === '{') {
                try {
                    result = JSON.parse(states) as Record<string, string>;
                } catch (ex) {
                    console.error(`Cannot parse states: ${states}`);
                    result = null;
                }
            } else if (typeof states === 'string') {
                // if old format val1:text1;val2:text2
                const parts = states.split(';');
                result = {};
                for (let p = 0; p < parts.length; p++) {
                    const s = parts[p].split(':');
                    result[s[0]] = s[1];
                }
            } else if (Array.isArray(states)) {
                result = {};
                if (obj?.common.type === 'number') {
                    states.forEach((value, key) => ((result as Record<string, string>)[key] = value));
                } else if (obj?.common.type === 'string') {
                    states.forEach(value => ((result as Record<string, string>)[value] = value));
                } else if (obj?.common.type === 'boolean') {
                    result.false = states[0];
                    result.true = states[1];
                }
            } else if (typeof states === 'object') {
                result = states as Record<string, string>;
            }
        }

        return result || null;
    }

    /**
     * Get svg file as text
     * @param url URL of SVG file
     * @returns Promise with "data:image..."
     */
    static async getSvg(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            // eslint-disable-next-line func-names
            reader.onload = function () {
                resolve(this.result?.toString() || '');
            };
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Detect file extension by its content
     * @returns Detected extension, like 'jpg'
     */
    static detectMimeType(
        /** Base64 encoded binary file */
        base64: string,
    ): string | null {
        const signature = Object.keys(SIGNATURES).find(s => base64.startsWith(s));
        return signature ? SIGNATURES[signature] : null;
    }

    /**
     * Check if configured repository is the stable repository
     */
    static isStableRepository(
        /** current configured repository or multi repository */
        activeRepo: string | string[],
    ): boolean {
        return !!((
            typeof activeRepo === 'string' &&
            activeRepo.toLowerCase().startsWith('stable')
        )
            ||
            (
                activeRepo &&
                typeof activeRepo !== 'string' &&
                activeRepo.find(r => r.toLowerCase().startsWith('stable'))
            ));
    }

    /**
     * Check if a given string is an integer
     */
    static isStringInteger(str: string | number): boolean {
        if (typeof str === 'number') {
            return Math.round(str) === str;
        }
        return parseInt(str, 10).toString() === str;
    }

    /**
     * Check if the date is valid
     */
    static isValidDate(date: any): boolean {
        // eslint-disable-next-line no-restricted-globals
        return date instanceof Date && !isNaN(date as any as number);
    }

    static getStyle(
        theme: IobTheme,
        ...args: (((_theme: IobTheme) => Record<string, any>) | undefined | Record<string, any>)[]
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (let a = 0; a < args.length; a++) {
            if (typeof args[a] === 'function') {
                Object.assign(result, (args[a] as (_theme: IobTheme) => Record<string, any>)(theme));
            } else if (args[a] && typeof args[a] === 'object') {
                Object.keys(args[a]).forEach((attr: string) => {
                    if (typeof (args[a] as Record<string, any>)[attr] === 'function') {
                        result[attr] = ((args[a] as Record<string, any>)[attr] as (_theme: IobTheme) => Record<string, any>)(theme);
                    } else if (typeof (args[a] as Record<string, any>)[attr] === 'object') {
                        const obj = (args[a] as Record<string, any>)[attr];
                        result[attr] = {};
                        Object.keys(obj).forEach((attr1: string) => {
                            if (typeof obj[attr1] === 'function') {
                                result[attr][attr1] = obj(theme);
                            } else if (obj[attr1] || obj[attr1] === 0) {
                                result[attr][attr1] = obj[attr1];
                            }
                        });
                    } else if ((args[a] as Record<string, any>)[attr] || (args[a] as Record<string, any>)[attr] === 0) {
                        result[attr] = (args[a] as Record<string, any>)[attr];
                    }
                });
            }
        }

        return result;
    }
}

export default Utils;
