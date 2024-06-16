/**
 * Copyright 2018-2023 Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 * */
import React from 'react';
import { Utils as _Utils, I18n } from '@iobroker/adapter-react-v5';

const NAMESPACE    = 'material';
const days         = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const months       = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUALITY_BITS = {
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
const SIGNATURES = {
    JVBERi0: 'pdf',
    R0lGODdh: 'gif',
    R0lGODlh: 'gif',
    iVBORw0KGgo: 'png',
    '/9j/': 'jpg',
    PHN2Zw: 'svg',
    Qk1: 'bmp',
    AAABAA: 'ico', // 00 00 01 00 according to https://en.wikipedia.org/wiki/List_of_file_signatures
};

class Utils {
    static namespace = NAMESPACE;

    static INSTANCES = 'instances';

    static dateFormat = ['DD', 'MM'];

    static FORBIDDEN_CHARS = /[^._\-/ :!#$%&()+=@^{}|~\p{Ll}\p{Lu}\p{Nd}]+/gu;

    /**
     * Capitalize words.
     * @param {string | undefined} name
     * @returns {string}
     */
    static CapitalWords(name) {
        return (name || '').split(/[\s_]/)
            .filter(item => item)
            .map(word => (word ? word[0].toUpperCase() + word.substring(1).toLowerCase() : ''))
            .join(' ');
    }

    static formatSeconds(seconds) {
        const days_ = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;
        let hours = Math.floor(seconds / 3600);
        if (hours < 10) {
            hours = `0${hours}`;
        }
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutes = `0${minutes}`;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        let text = '';
        if (days_) {
            text += `${days_} ${I18n.t('ra_daysShortText')} `;
        }
        text += `${hours}:${minutes}:${seconds}`;

        return text;
    }

    /**
     * Get the name of the object by id from the name or description.
     * @param {Record<string, ioBroker.Object>} objects
     * @param {string} id
     * @param {{ name: any; } | ioBroker.Languages | null} settings
     * @param {{ language?: ioBroker.Languages; }} options
     * @param {boolean} [isDesc] Set to true to get the description.
     * @returns {string}
     */
    static getObjectName(objects, id, settings, options, isDesc) {
        const item = objects[id];
        let text;
        const attr = isDesc ? 'desc' : 'name';

        if (typeof settings === 'string' && !options) {
            options = { language: settings };
            settings = null;
        }

        options = options || {};
        if (!options.language) {
            options.language = (objects['system.config'] && objects['system.config'].common && objects['system.config'].common.language) || window.sysLang || 'en';
        }
        if (settings && settings.name) {
            text = settings.name;
            if (typeof text === 'object') {
                text = text[options.language] || text.en;
            }
        } else if (item && item.common && item.common[attr]) {
            text = item.common[attr];
            if (attr !== 'desc' && !text && item.common.desc) {
                text = item.common.desc;
            }
            if (typeof text === 'object') {
                text = text[options.language] || text.en || text.de || text.ru || '';
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

        return text.trim();
    }

    /**
     * Get the name of the object from the name or description.
     * @param {ioBroker.PartialObject} obj
     * @param {{ name: any; } | ioBroker.Languages | null } settings or language
     * @param {{ language?: ioBroker.Languages; } } options
     * @param {boolean} [isDesc] Set to true to get the description.
     * @param {boolean} [noTrim] Allow to use spaces in name (by edit)
     * @returns {string}
     */
    static getObjectNameFromObj(obj, settings, options, isDesc, noTrim) {
        const item = obj;
        let text = (obj && obj._id) || '';
        const attr = isDesc ? 'desc' : 'name';

        if (typeof settings === 'string' && !options) {
            options = { language: settings };
            settings = null;
        }

        options = options || {};

        if (settings && settings.name) {
            text = settings.name;
            if (typeof text === 'object') {
                text = text[options.language] || text.en;
            }
        } else if (item && item.common && item.common[attr]) {
            text = item.common[attr];
            if (attr !== 'desc' && !text && item.common.desc) {
                text = item.common.desc;
            }
            if (typeof text === 'object') {
                text = text[options.language] || text.en;
            }
            text = (text || '').toString().replace(/[_.]/g, ' ');

            if (text === text.toUpperCase()) {
                text = text[0] + text.substring(1).toLowerCase();
            }
        }
        return noTrim ? text : text.trim();
    }

    /**
     * @param {ioBroker.PartialObject | ioBroker.ObjectCommon} obj
     * @param {string} forEnumId
     * @param {{ user: string; }} options
     * @returns {string | null}
     */
    static getSettingsOrder(obj, forEnumId, options) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            obj = obj.common;
        }
        let settings;
        if (obj && obj.custom) {
            settings = (obj.custom || {})[NAMESPACE];
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
     * @param {ioBroker.PartialObject | ioBroker.ObjectCommon} obj
     * @param {string} forEnumId
     * @param {{ user: string; }} options
     */
    static getSettingsCustomURLs(obj, forEnumId, options) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            obj = obj.common;
        }
        let settings;
        if (obj && obj.custom) {
            settings = (obj.custom || {})[NAMESPACE];
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
     * @param {Iterable<any> | ArrayLike<any>} list
     * @param {number} source
     * @param {number} dest
     */
    static reorder(list, source, dest) {
        const result = Array.from(list);
        const [removed] = result.splice(source, 1);
        result.splice(dest, 0, removed);
        return result;
    }

    /**
     * @param {any} obj
     * @param {{ id: any; user: any; name: any; icon: any; color: any; language: ioBroker.Languages; }} options
     * @param {boolean} [defaultEnabling]
     */
    static getSettings(obj, options, defaultEnabling) {
        let settings;
        const id = (obj && obj._id) || (options && options.id);
        if (obj && Object.prototype.hasOwnProperty.call(obj, 'common')) {
            obj = obj.common;
        }
        if (obj?.custom) {
            settings = obj.custom;
            settings = settings[NAMESPACE] && settings[NAMESPACE][options.user || 'admin'] ? JSON.parse(JSON.stringify(settings[NAMESPACE][options.user || 'admin'])) : { enabled: true };
        } else {
            settings = { enabled: defaultEnabling === undefined ? true : defaultEnabling, useCustom: false };
        }

        if (!Object.prototype.hasOwnProperty.call(settings, 'enabled')) {
            settings.enabled = defaultEnabling === undefined ? true : defaultEnabling;
        }

        // if (false && settings.useCommon) {
        //     if (obj.color) settings.color = obj.color;
        //     if (obj.icon)  settings.icon  = obj.icon;
        //     if (obj.name)  settings.name  = obj.name;
        // } else {
        if (options) {
            if (!settings.name  && options.name)  settings.name  = options.name;
            if (!settings.icon  && options.icon)  settings.icon  = options.icon;
            if (!settings.color && options.color) settings.color = options.color;
        }

        if (obj) {
            if (!settings.color && obj.color) settings.color = obj.color;
            if (!settings.icon  && obj.icon)  settings.icon  = obj.icon;
            if (!settings.name  && obj.name)  settings.name  = obj.name;
        }
        // }

        if (typeof settings.name === 'object') {
            settings.name = settings.name[options.language] || settings.name.en;

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
     * @param {any} obj
     * @param {any} settings
     * @param {{ user: any; language: ioBroker.Languages; }} options
     */
    static setSettings(obj, settings, options) {
        if (obj) {
            obj.common = obj.common || {};
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
                    if (typeof obj.common.name !== 'object') {
                        obj.common.name = {};
                        obj.common.name[options.language] = s.name;
                    } else {
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
     * @param {{ icon: string | undefined; name: string | undefined; prefix: string | undefined}} settings
     * @param {any} style
     * @returns {JSX.Element | null}
     */
    static getIcon(settings, style) {
        if (settings && settings.icon) {
            // If UTF-8 icon
            if (settings.icon.length <= 2) {
                return <span style={style || {}}>{settings.icon}</span>;
            }
            if (settings.icon.startsWith('data:image')) {
                return <img alt={settings.name} src={settings.icon} style={style || {}} />;
            }
            // maybe later some changes for a second type
            return <img alt={settings.name} src={(settings.prefix || '') + settings.icon} style={style || {}} />;
        }
        return null;
    }

    /**
     * Get the icon for the given object.
     * @param {string} id
     * @param {{ common: { icon: any; }; }} obj
     * @returns {string | null}
     */
    static getObjectIcon(id, obj) {
        // If id is Object
        if (typeof id === 'object') {
            obj = id;
            id = obj._id;
        }

        if (obj && obj.common && obj.common.icon) {
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
     * Splits CamelCase into words.
     * @param {string | undefined} text
     * @returns {string}
     */
    static splitCamelCase(text) {
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
        return Utils.CapitalWords(text);
    }

    /**
     * Check if the given color is bright.
     * https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
     * @param {string | null | undefined} color
     * @param {boolean} [defaultValue]
     * @returns {boolean}
     */
    static isUseBright(color, defaultValue) {
        if (color === null || color === undefined || color === '') {
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
        return (r * 0.299 + g * 0.587 + b * 0.114) <= 186;
    }

    /**
     * Get the time string in the format 00:00.
     * @param {string | number} seconds
     */
    static getTimeString(seconds) {
        seconds = parseFloat(seconds);
        if (Number.isNaN(seconds)) {
            return '--:--';
        }
        const hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let secs = seconds % 60;
        if (hours) {
            if (minutes < 10) {
                minutes = `0${minutes}`;
            }
            if (secs < 10) {
                secs = `0${secs}`;
            }
            return `${hours}:${minutes}:${secs}`;
        }

        if (secs < 10) {
            secs = `0${secs}`;
        }
        return `${minutes}:${secs}`;
    }

    /**
     * Gets the wind direction with the given angle (degrees).
     * @param {number} angle in degrees.
     * @returns {string | undefined}
     */
    static getWindDirection(angle) {
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
     * Pad the given number with a zero if it's not 2 digits long.
     * @param {string | number} num
     */
    static padding(num) {
        if (typeof num === 'string') {
            if (num.length < 2) {
                return `0${num}`;
            }
            return num;
        }
        if (num < 10) {
            return `0${num}`;
        }
        return num;
    }

    /**
     * Sets the date format.
     * @param {string} format
     */
    static setDataFormat(format) {
        if (format) {
            Utils.dateFormat = format.toUpperCase().split(/[.-/]/);
            Utils.dateFormat.splice(Utils.dateFormat.indexOf('YYYY'), 1);
        }
    }

    /**
     * Converts the date to a string.
     * @param {string | number | Date} now
     * @returns {string}
     */
    static date2string(now) {
        if (typeof now === 'string') {
            now = now.trim();
            if (!now) return '';
            // only letters
            if (now.match(/^[\w\s]+$/)) {
                // Day of the week
                return now;
            }
            const m = now.match(/(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})/);
            if (m) {
                const a = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
                const year = a.find(y => y > 31);
                a.splice(a.indexOf(year), 1);
                const day = a.find(mm => mm > 12);
                if (day) {
                    a.splice(a.indexOf(day), 1);
                    now = new Date(year, a[0] - 1, day);
                } else if (Utils.dateFormat[0][0] === 'M' && Utils.dateFormat[1][0] === 'D') {
                    // MM DD
                    now = new Date(year, a[0] - 1, a[1]);
                    if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
                        now = new Date(year, a[1] - 1, a[0]);
                    }
                } else if (Utils.dateFormat[0][0] === 'D' && Utils.dateFormat[1][0] === 'M') {
                    // DD MM
                    now = new Date(year, a[1] - 1, a[0]);
                    if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
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

        let date = I18n.t(`ra_dow_${days[now.getDay()]}`).replace('ra_dow_', '');
        date += `. ${now.getDate()} ${I18n.t(`ra_month_${months[now.getMonth()]}`).replace('ra_month_', '')}`;
        return date;
    }

    /**
     * Render a text as a link.
     * @param {string} text
     * @returns {string | JSX.Element[]}
     */
    static renderTextWithA(text) {
        let m = text.match(/<a [^<]+<\/a>|<br\/?>|<b>[^<]+<\/b>|<i>[^<]+<\/i>/);
        if (m) {
            const result = [];
            let key = 1;
            do {
                const start = text.substring(0, m.index);
                text = text.substring(m.index + m[0].length);
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

                m = text && text.match(/<a [^<]+<\/a>|<br\/?>|<b>[^<]+<\/b>|<i>[^<]+<\/i>/);
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
     * @param {Record<string, ioBroker.StateObject> | ioBroker.StateObject} states
     * @param {string} id
     * @param {string} instanceId
     * @param {boolean} [noCommon]
     */
    static getSmartName(states, id, instanceId, noCommon) {
        if (!id) {
            if (!noCommon) {
                if (!states.common) {
                    return states.smartName;
                }
                if (states && !states.common) {
                    return states.smartName;
                }
                return states.common.smartName;
            }
            if (states && !states.common) {
                return states.smartName;
            }
            return states?.common?.custom && states.common.custom[instanceId] ?
                states.common.custom[instanceId].smartName : undefined;
        }
        if (!noCommon) {
            return states[id].common.smartName;
        }

        return (states[id] &&
            states[id].common?.custom &&
            states[id].common.custom[instanceId]) ?
            states[id].common.custom[instanceId].smartName || null : null;
    }

    /**
     * Get the smart name from a state.
     * @param {ioBroker.StateObject} obj
     * @param {string} instanceId
     * @param {boolean} [noCommon]
     */
    static getSmartNameFromObj(obj, instanceId, noCommon) {
        if (!noCommon) {
            if (!obj.common) {
                return obj.smartName;
            }
            if (obj && !obj.common) {
                return obj.smartName;
            }
            return obj.common.smartName;
        }
        if (obj && !obj.common) {
            return obj.smartName;
        }

        return obj?.common?.custom && obj.common.custom[instanceId] ?
            obj.common.custom[instanceId].smartName : undefined;
    }

    /**
     * Enable smart name for a state.
     * @param {ioBroker.StateObject} obj
     * @param {string} instanceId
     * @param {boolean} [noCommon]
     */
    static enableSmartName(obj, instanceId, noCommon) {
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
     * @param {ioBroker.StateObject} obj
     * @param {string | number} instanceId
     * @param {boolean} [noCommon]
     */
    static removeSmartName(obj, instanceId, noCommon) {
        if (noCommon) {
            if (obj.common && obj.common.custom && obj.common.custom[instanceId]) {
                obj.common.custom[instanceId] = null;
            }
        } else {
            obj.common.smartName = null;
        }
    }

    /**
     * Update the smartname of a state.
     * @param {ioBroker.StateObject} obj
     * @param {string} newSmartName
     * @param {string | undefined} byON
     * @param {string | undefined} smartType
     * @param {string} instanceId
     * @param {boolean} [noCommon]
     */
    static updateSmartName(obj, newSmartName, byON, smartType, instanceId, noCommon) {
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
            let _smartName = obj.common.smartName;

            if (!_smartName || typeof _smartName !== 'object') {
                _smartName = { en: _smartName };
                _smartName[language] = _smartName.en;
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
                    delete obj.common.smartName.smartType;
                } else {
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
            if (smartName && (!smartName[language] ||
                (smartName[language] === obj.common.name &&
                    (!obj.common.role || obj.common.role.includes('button'))))) {
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
                    if (noCommon) {
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
                    } else if (obj.common.smartName.byON !== undefined) {
                        delete obj.common.smartName.en;
                        delete obj.common.smartName.de;
                        delete obj.common.smartName.ru;
                        delete obj.common.smartName.nl;
                        delete obj.common.smartName.pl;
                        delete obj.common.smartName.it;
                        delete obj.common.smartName.fr;
                        delete obj.common.smartName.pt;
                        delete obj.common.smartName.es;
                        delete obj.common.smartName.uk;
                        delete obj.common.smartName['zh-cn'];
                    } else {
                        obj.common.smartName = null;
                    }
                }
            }
        }
    }

    /**
     * Disable the smart name of a state.
     * @param {ioBroker.StateObject} obj
     * @param {string} instanceId
     * @param {boolean} [noCommon]
     */
    static disableSmartName(obj, instanceId, noCommon) {
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
     * @param {string} text
     * @param {Event} [e]
     */
    static copyToClipboard(text, e) {
        e && e.stopPropagation();
        e && e.preventDefault();
        return _Utils.copyToClipboard(text);
    }

    /**
     * Gets the extension of a file name.
     * @param {string | null} [fileName] the file name.
     * @returns {string | null} The extension in lower case.
     */
    static getFileExtension(fileName) {
        const pos = (fileName || '').lastIndexOf('.');
        if (pos !== -1) {
            return fileName.substring(pos + 1).toLowerCase();
        }
        return null;
    }

    /**
     * Format number of bytes as a string with B, KB, MB or GB.
     * The base for all calculations is 1024.
     * @param {number} bytes The number of bytes.
     * @returns {string} The formatted string (e.g. '723.5 KB')
     */
    static formatBytes(bytes) {
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
     * @param {string} color Color in the format '#rrggbb' or '#rgb' (or without a hash)
     * @param {string} themeType theme type
     * @param {string} invert dark theme has light color in control or light theme has light color in control
     * @returns {string | undefined}
     */
    static getInvertedColor(color, themeType, invert) {
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
     * @param {string} hex Color in the format '#rrggbb' or '#rgb' (or without hash)
     * @param {boolean} bw Set to black or white.
     * @returns {string}
     */
    static invertColor(hex, bw) {
        if (hex === undefined || hex === null || hex === '' || typeof hex !== 'string') {
            return '';
        }
        if (hex.startsWith('rgba')) {
            const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
            if (m) {
                hex = parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('rgb')) {
            const m = hex.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) {
                hex = parseInt(m[1], 10).toString(16).padStart(2, '0') +
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
        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);

        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? `#000000${alfa || ''}`
                : `#FFFFFF${alfa || ''}`;
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return `#${r.padStart(2, '0')}${g.padStart(2, '0')}${b.padStart(2, '0')}${alfa || ''}`;
    }

    /**
     * Convert RGB to array [r, g, b]
     * @param {string} hex Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @returns {Array<number>} Array with 3 elements [r, g, b]
     */
    static color2rgb(hex) {
        if (hex === undefined || hex === null || hex === '' || typeof hex !== 'string') {
            return '';
        }
        if (hex.startsWith('rgba')) {
            const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
            if (m) {
                hex = parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else if (hex.startsWith('rgb')) {
            const m = hex.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) {
                hex = parseInt(m[1], 10).toString(16).padStart(2, '0') +
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
    static rgb2lab(rgb) {
        let r = rgb[0] / 255;
        let g = rgb[1] / 255;
        let b = rgb[2] / 255;

        r = (r > 0.04045) ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
        g = (g > 0.04045) ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
        b = (b > 0.04045) ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

        let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        let y = (r * 0.2126 + g * 0.7152 + b * 0.0722); /*  / 1.00000; */
        let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = (x > 0.008856) ? x ** 0.33333333 : (7.787 * x) + 0.137931; // 16 / 116;
        y = (y > 0.008856) ? y ** 0.33333333 : (7.787 * y) + 0.137931; // 16 / 116;
        z = (z > 0.008856) ? z ** 0.33333333 : (7.787 * z) + 0.137931; // 16 / 116;

        return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
    }

    /**
     * Calculate the distance between two colors in LAB color space in the range 0-100^2
     * If distance is less than 1000, the colors are similar
     * @param {string} color1 Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @param {string} color2 Color in the format '#rrggbb' or '#rgb' (or without hash) or rgb(r,g,b) or rgba(r,g,b,a)
     * @returns {number} distance in the range 0-100^2
     */
    static colorDistance(color1, color2) {
        const lab1 = Utils.rgb2lab(Utils.color2rgb(color1));
        const lab2 = Utils.rgb2lab(Utils.color2rgb(color2));
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
     * @param {any} mix
     * @returns {string}
     */
    static _toVal(mix) {
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
    static clsx() {
        let i = 0;
        let tmp;
        let x;
        let str = '';
        while (i < arguments.length) {
            // eslint-disable-next-line prefer-rest-params
            tmp = arguments[i++];
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
     * @param {string} [themeName]
     * @returns {string}
     */
    static getThemeName(themeName = '') {
        if (window.vendorPrefix && window.vendorPrefix !== '@@vendorPrefix@@') {
            return window.vendorPrefix;
        }

        return themeName || ((window._localStorage || window.localStorage).getItem('App.themeName') ?
            (window._localStorage || window.localStorage).getItem('App.themeName') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'colored');
    }

    /**
     * Get the type of theme.
     * @param {string} [themeName]
     * @returns {'dark' | 'light'}
     */
    static getThemeType(themeName = '') {
        if (window.vendorPrefix && window.vendorPrefix !== '@@vendorPrefix@@') {
            return 'light';
        }

        themeName = themeName || (window._localStorage || window.localStorage).getItem('App.themeName');
        return themeName === 'dark' || themeName === 'blue' ? 'dark' : 'light';
    }

    /**
     * Set the theme name and theme type.
     * @param {string} themeName
     */
    static setThemeName(themeName) {
        if (window.vendorPrefix && window.vendorPrefix !== '@@vendorPrefix@@') {
            return; // ignore
        }
        (window._localStorage || window.localStorage).setItem('App.themeName', themeName);
        (window._localStorage || window.localStorage).setItem('App.theme', themeName === 'dark' || themeName === 'blue' ? 'dark' : 'light');
    }

    /**
     * Toggle the theme name between 'dark' and 'colored'.
     * @param {string | null} themeName
     * @returns {string} the new theme name.
     */
    static toggleTheme(themeName) {
        if (window.vendorPrefix && window.vendorPrefix !== '@@vendorPrefix@@') {
            return window.vendorPrefix;
        }
        themeName = themeName || (window._localStorage || window.localStorage).getItem('App.themeName');

        // dark => blue => colored => light => dark
        const themes = Utils.getThemeNames();
        const pos = themes.indexOf(themeName);
        let newTheme;
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
     * @returns {array<string>} list of possible themes
     */
    static getThemeNames() {
        if (window.vendorPrefix && window.vendorPrefix !== '@@vendorPrefix@@') {
            return [window.vendorPrefix];
        }

        return ['light', 'dark', 'blue', 'colored'];
    }

    /**
     * Parse a query string into its parts.
     * @param {string} query
     * @returns {Record<string, string | boolean | number>}
     */
    static parseQuery(query) {
        query = (query || '').toString().replace(/^\?/, '');
        /** @type {Record<string, string | boolean | number>} */
        const result = {};
        query.split('&').forEach(part => {
            part = part.trim();
            if (part) {
                const parts = part.split('=');
                const attr = decodeURIComponent(parts[0]).trim();
                if (parts.length > 1) {
                    result[attr] = decodeURIComponent(parts[1]);
                    if (result[attr] === 'true') {
                        result[attr] = true;
                    } else if (result[attr] === 'false') {
                        result[attr] = false;
                    } else {
                        const f = parseFloat(result[attr]);
                        if (f.toString() === result[attr]) {
                            result[attr] = f;
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
     * @param {string} id
     * @returns {string | null} parent ID or null if no parent
     */
    static getParentId(id) {
        const p = (id || '').toString().split('.');
        if (p.length > 1) {
            p.pop();
            return p.join('.');
        }

        return null;
    }

    static formatDate(dateObj, dateFormat) {
        // format could be DD.MM.YYYY, YYYY.MM.DD or MM/DD/YYYY

        if (!dateObj) {
            return '';
        }

        let text;
        let mm = dateObj.getMonth() + 1;
        if (mm < 10) {
            mm = `0${mm}`;
        }

        let dd = dateObj.getDate();
        if (dd < 10) {
            dd = `0${dd}`;
        }

        if (dateFormat === 'MM/DD/YYYY') {
            text = `${mm}/${dd}/${dateObj.getFullYear()}`;
        } else {
            text = `${dateObj.getFullYear()}-${mm}-${dd}`;
        }

        // time
        let v = dateObj.getHours();
        if (v < 10) {
            text += ` 0${v}`;
        } else {
            text += ` ${v}`;
        }
        v = dateObj.getMinutes();
        if (v < 10) {
            text += `:0${v}`;
        } else {
            text += `:${v}`;
        }

        v = dateObj.getSeconds();
        if (v < 10) {
            text += `:0${v}`;
        } else {
            text += `:${v}`;
        }

        v = dateObj.getMilliseconds();
        if (v < 10) {
            text += `.00${v}`;
        } else if (v < 100) {
            text += `.0${v}`;
        } else {
            text += `.${v}`;
        }

        return text;
    }

    static formatTime(seconds) {
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

    static MDtext2link(text) {
        const m = text.match(/\d+\.\)\s/);
        if (m) {
            text = text.replace(m[0], m[0].replace(/\s/, '&nbsp;'));
        }

        return text.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').trim().replace(/\s/g, '').toLowerCase();
    }

    static openLink(url, target) {
        // replace IPv6 Address with [ipv6]:port
        url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');

        if (target === 'this') {
            window.location = url;
        } else {
            window.open(url, target || '_blank');
        }
    }

    static MDgetTitle(text) {
        const result = Utils.extractHeader(text);
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

        return header.title;
    }

    static MDextractHeader(text) {
        const attrs = {};
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
                        attrs[attr] = line.substring(pos_ + 1).trim();
                        attrs[attr] = attrs[attr].replace(/^['"]|['"]$/g, '');
                        if (attrs[attr] === 'true') {
                            attrs[attr] = true;
                        } else if (attrs[attr] === 'false') {
                            attrs[attr] = false;
                        } else if (parseFloat(attrs[attr]).toString() === attrs[attr]) {
                            attrs[attr] = parseFloat(attrs[attr]);
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

    static MDremoveDocsify(text) {
        const m = text.match(/{docsify-[^}]*}/g);
        if (m) {
            m.forEach(doc => text = text.replace(doc, ''));
        }
        return text;
    }

    /**
     * Generate the json file on the file for download.
     * @param {string} filename file name
     * @param {Record<string, unknown>} json file data
     * @returns {object} json structure (not stringified)
     */
    static generateFile(filename, json) {
        const el = document.createElement('a');
        el.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json, null, 2))}`);
        el.setAttribute('download', filename);

        el.style.display = 'none';
        document.body.appendChild(el);

        el.click();

        document.body.removeChild(el);
    }

    /**
     * Convert quality code into text
     * @param {number} quality code
     * @returns {array<string>} lines that decode quality
     */
    static quality2text(quality) {
        // eslint-disable-next-line no-bitwise
        const custom = quality & 0xFFFF0000;
        const text = QUALITY_BITS[quality];
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
     * @param {object} object
     * @returns {object}
     */
    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    /**
     * Get states of object
     * @param {object} obj
     * @returns {object} states as an object in form {"value1": "label1", "value2": "label2"} or null
     */
    static getStates(obj) {
        let states = obj?.common?.states;
        if (states) {
            if (typeof states === 'string' && states[0] === '{') {
                try {
                    states = JSON.parse(states);
                } catch (ex) {
                    console.error(`Cannot parse states: ${states}`);
                    states = null;
                }
            } else if (typeof states === 'string') {
                // if old format val1:text1;val2:text2
                const parts = states.split(';');
                states = {};
                for (let p = 0; p < parts.length; p++) {
                    const s = parts[p].split(':');
                    states[s[0]] = s[1];
                }
            } else if (Array.isArray(states)) {
                const result = {};
                if (obj.common.type === 'number') {
                    states.forEach((value, key) => result[key] = value);
                } else if (obj.common.type === 'string') {
                    states.forEach(value => result[value] = value);
                } else if (obj.common.type === 'boolean') {
                    result.false = states[0];
                    result.true = states[1];
                }

                return result;
            }
        }

        return states;
    }

    /**
     * Get svg file as text
     * @param {string} url URL of SVG file
     * @returns {object} Promise with "data:image..."
     */
    static getSvg(url) {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise(resolve => {
                const reader = new FileReader();
                // eslint-disable-next-line func-names
                reader.onload = function () { // do not optimize this function. "this" is important.
                    resolve(this.result);
                };
                reader.readAsDataURL(blob);
            }));
    }

    /**
     * Detect file extension by its content
     * @param {string} base64 Base64 encoded binary file
     * @returns {string} Detected extension, like 'jpg'
     */
    static detectMimeType(base64) {
        const signature = Object.keys(SIGNATURES).find(s => base64.startsWith(s));
        return signature ? SIGNATURES[signature] : null;
    }

    /**
     * Check if configured repository is the stable repository
     *
     * @param {string | string[]} activeRepo current configured repository or multi repository
     * @return {boolean}
     */
    static isStableRepository(activeRepo) {
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
     * Check if given string is an integer
     *
     * @param {string} str string to check
     * @return {boolean}
     */
    static isStringInteger(str) {
        return parseInt(str).toString() === str;
    }

    /**
     * Check if the date is valid
     *
     * @param {Date} date
     * @return {boolean}
     */
    static isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    static getStyle(theme, ...args) {
        const result = {};

        for (let a = 0; a < args.length; a++) {
            if (typeof args[a] === 'function') {
                Object.assign(result, args[a](theme));
            } else if (args[a] && typeof args[a] === 'object') {
                Object.keys(args[a]).forEach(attr => {
                    if (typeof args[a][attr] === 'function') {
                        result[attr] = args[a][attr](theme);
                    } else if (typeof args[a][attr] === 'object') {
                        const obj = args[a][attr];
                        Object.keys(obj).forEach(attr1 => {
                            if (typeof obj[attr1] === 'function') {
                                result[attr][attr1] = obj(theme);
                            } else if (obj[attr1] || obj[attr1] === 0) {
                                result[attr][attr1] = obj[attr1];
                            }
                        });
                    } else if (args[a][attr] || args[a][attr] === 0) {
                        result[attr] = args[a][attr];
                    }
                });
            }
        }

        return result;
    }
}

export default Utils;
