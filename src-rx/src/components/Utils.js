/**
 * Copyright 2018-2021 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import React from 'react';
import I18n from '@iobroker/adapter-react/i18n';

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
            .map(word => word ? word[0].toUpperCase() + word.substring(1).toLowerCase() : '')
            .join(' ');
    }

    static formatSeconds(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        seconds %= 3600 * 24;
        let hours = Math.floor(seconds / 3600);
        if (hours < 10) {
            hours = '0' + hours;
        }
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        let text = '';
        if (days) {
            text += days + ' ' + I18n.t('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

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
        let item = objects[id];
        let text = id;
        const attr = isDesc ? 'desc' : 'name';

        if (typeof settings === 'string' && !options) {
            options = {language: settings};
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
        } else
        if (item && item.common && item.common[attr]) {
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
            let pos = id.lastIndexOf('.');
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
     * @returns {string}
     */
    static getObjectNameFromObj(obj, settings, options, isDesc) {
        let item = obj;
        let text = (obj && obj._id) || '';
        const attr = isDesc ? 'desc' : 'name';

        if (typeof settings === 'string' && !options) {
            options = {language: settings};
            settings = null;
        }

        options = options || {};

        if (settings && settings.name) {
            text = settings.name;
            if (typeof text === 'object') {
                text = text[options.language] || text.en;
            }
        } else
        if (item && item.common && item.common[attr]) {
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
        return text.trim();
    }

    /**
     * @param {ioBroker.PartialObject | ioBroker.ObjectCommon} obj
     * @param {string} forEnumId
     * @param {{ user: string; }} options
     * @returns {string | null}
     */
    static getSettingsOrder(obj, forEnumId, options) {
        if (obj && obj.hasOwnProperty('common')) {
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
                } else {
                    if (settings[user].order) {
                        return JSON.parse(JSON.stringify(settings[user].order));
                    }
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
        if (obj && obj.hasOwnProperty('common')) {
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
                } else {
                    if (settings[user].URLs) {
                        return JSON.parse(JSON.stringify(settings[user].URLs));
                    }
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
    };

    /**
     * @param {any} obj
     * @param {{ id: any; user: any; name: any; icon: any; color: any; language: ioBroker.Languages; }} options
     * @param {boolean} [defaultEnabling]
     */
    static getSettings(obj, options, defaultEnabling) {
        let settings;
        const id = (obj && obj._id) || (options && options.id);
        if (obj && obj.hasOwnProperty('common')) {
            obj = obj.common;
        }
        if (obj && obj.custom) {
            settings = obj.custom || {};
            settings = settings[NAMESPACE] && settings[NAMESPACE][options.user || 'admin'] ? JSON.parse(JSON.stringify(settings[NAMESPACE][options.user || 'admin'])) : {enabled: true};
        } else {
            settings = {enabled: defaultEnabling === undefined ? true : defaultEnabling, useCustom: false};
        }

        if (!settings.hasOwnProperty('enabled')) {
            settings.enabled = defaultEnabling === undefined ? true : defaultEnabling;
        }

        if (false && settings.useCommon) {
            if (obj.color) settings.color = obj.color;
            if (obj.icon)  settings.icon  = obj.icon;
            if (obj.name)  settings.name  = obj.name;
        } else {
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
        }

        if (typeof settings.name === 'object') {
            settings.name = settings.name[options.language] || settings.name.en;

            settings.name = (settings.name || '').toString().replace(/_/g, ' ');

            if (settings.name === settings.name.toUpperCase()) {
                settings.name = settings.name[0] + settings.name.substring(1).toLowerCase();
            }
        }
        if (!settings.name && id) {
            let pos = id.lastIndexOf('.');
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
                    } else{
                        obj.common.name[options.language] = s.name;
                    }
                    delete s.name;
                }
            }

            return true;
        } else {
            return false;
        }
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
            } else
            if (settings.icon.startsWith('data:image')) {
                return <img alt={settings.name} src={settings.icon} style={style || {}}/>;
            } else { // may be later some changes for second type
                return <img alt={settings.name} src={(settings.prefix || '') + settings.icon} style={style || {}}/>;
            }
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
            } else
            if (icon.startsWith('data:image')) {
                return icon;
            } else {
                const parts = id.split('.');
                if (parts[0] === 'system') {
                    icon = 'adapter/' + parts[2] + (icon.startsWith('/') ? '' : '/') + icon;
                } else {
                    icon = 'adapter/' + parts[0] + (icon.startsWith('/') ? '' : '/') + icon;
                }

                if (window.location.pathname.match(/adapter\/[^/]+\/[^/]+\.html/)) {
                    icon = '../../' + icon;
                } else if (window.location.pathname.match(/material\/[.\d]+/)) {
                    icon = '../../' + icon;
                } else
                if (window.location.pathname.match(/material\//)) {
                    icon = '../' + icon;
                }
                return icon;
            }
        } else {
            return null;
        }
    }

    /**
     * Splits CamelCase into words.
     * @param {string | undefined} text
     * @returns {string}
     */
    static splitCamelCase(text) {
        if (false && text !== text.toUpperCase()) {
            const words = text.split(/\s+/);
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                if (word.toLowerCase() !== word && word.toUpperCase() !== word) {
                    let z = 0;
                    const ww = [];
                    let start = 0;
                    while (z < word.length) {
                        if (word[z].match(/[A-ZÜÄÖА-Я]/)) {
                            ww.push(word.substring(start, z));
                            start = z;
                        }
                        z++;
                    }
                    if (start !== z) {
                        ww.push(word.substring(start, z));
                    }
                    for (let k = 0; k < ww.length; k++) {
                        words.splice(i + k, 0, ww[k]);
                    }
                    i += ww.length;
                }
            }

            return words.map(w => {
                w = w.trim();
                if (w) {
                    return w[0].toUpperCase() + w.substring(1).toLowerCase();
                }
                return '';
            }).join(' ');
        } else {
            return Utils.CapitalWords(text);
        }
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
        if (color.indexOf('#') === 0) {
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
            if (color.length !== 6) {
                return false;
            }

            r = parseInt(color.slice(0, 2), 16);
            g = parseInt(color.slice(2, 4), 16);
            b = parseInt(color.slice(4, 6), 16);
        }

        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) <= 186;
    };

    /**
     * Get the time string in the format 00:00.
     * @param {string | number} seconds
     */
    static getTimeString(seconds) {
        seconds = parseFloat(seconds);
        if (isNaN(seconds)) {
            return '--:--';
        }
        const hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let secs = seconds % 60;
        if (hours) {
            if (minutes < 10) minutes = '0' + minutes;
            if (secs < 10) secs = '0' + secs;
            return hours + ':' + minutes + ':' + secs;
        } else {
            if (secs < 10) secs = '0' + secs;
            return minutes + ':' + secs;
        }
    }

    /**
     * Gets the wind direction with the given angle (degrees).
     * @param {number} angle in degrees.
     * @returns {string | undefined}
     */
    static getWindDirection(angle) {
        if (angle >= 0 && angle < 11.25) {
            return 'N'
        } else if (angle >= 11.25 && angle < 33.75) {
            return 'NNE'
        } else if (angle >= 33.75 && angle < 56.25) {
            return 'NE'
        } else if (angle >= 56.25 && angle < 78.75) {
            return 'ENE'
        } else if (angle >= 78.75 && angle < 101.25) {
            return 'E'
        } else if (angle >= 101.25 && angle < 123.75) {
            return 'ESE'
        } else if (angle >= 123.75 && angle < 146.25) {
            return 'SE'
        } else if (angle >= 146.25 && angle < 168.75) {
            return 'SSE'
        } else if (angle >= 168.75 && angle < 191.25) {
            return 'S'
        } else if (angle >= 191.25 && angle < 213.75) {
            return 'SSW'
        } else if (angle >= 213.75 && angle < 236.25) {
            return 'SW'
        } else if (angle >= 236.25 && angle < 258.75) {
            return 'WSW'
        } else if (angle >= 258.75 && angle < 281.25) {
            return 'W'
        } else if (angle >= 281.25 && angle < 303.75) {
            return 'WNW'
        } else if (angle >= 303.75 && angle < 326.25) {
            return 'NW'
        } else if (angle >= 326.25 && angle < 348.75) {
            return 'NNW'
        } else if (angle >= 348.75) {
            return 'N'
        }
    }

    /**
     * Pad the given number with a zero if its not 2 digits long.
     * @param {string | number} num
     */
    static padding(num) {
        if (typeof num === 'string') {
            if (num.length < 2) {
                return '0' + num;
            } else {
                return num;
            }
        } else if (num < 10) {
            return '0' + num;
        } else {
            return num;
        }
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
                // Day of week
                return now;
            }
            let m = now.match(/(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})/);
            if (m) {
                let a = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
                let year = a.find(y => y > 31);
                a.splice(a.indexOf(year), 1);
                let day = a.find(m => m > 12);
                if (day) {
                    a.splice(a.indexOf(day), 1);
                    now = new Date(year, a[0] - 1, day);
                } else {
                    // MM DD
                    if (Utils.dateFormat[0][0] === 'M' && Utils.dateFormat[1][0] === 'D') {
                        now = new Date(year, a[0] - 1, a[1]);
                        if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
                            now = new Date(year, a[1] - 1, a[0]);
                        }
                    } else
                        // DD MM
                    if (Utils.dateFormat[0][0] === 'D' && Utils.dateFormat[1][0] === 'M') {
                        now = new Date(year, a[1] - 1, a[0]);
                        if (Math.abs(now.getTime - Date.now()) > 3600000 * 24 * 10) {
                            now = new Date(year, a[0] - 1, a[1]);
                        }
                    } else {
                        now = new Date(now);
                    }
                }
            } else {
                now = new Date(now);
            }
        } else {
            now = new Date(now);
        }

        let date = I18n.t('ra_dow_' + days[now.getDay()]).replace('ra_dow_', '');
        date += '. ' + now.getDate() + ' ' + I18n.t('ra_month_' + months[now.getMonth()]).replace('ra_month_', '');
        return date;
    }

    /**
     * Render a text as a link.
     * @param {string} text
     * @returns {string | JSX.Element[]}
     */
    static renderTextWithA(text) {
        let m = text.match(/<a [^<]+<\/a>|<br\/?>/);
        if (m) {
            const result = [];
            let key = 1;
            do {
                const p = text.split(m[0]);
                p[0] && result.push(<span key={'a' + (key++)}>{p[0]}</span>);

                if (m[0].startsWith('<br')) {
                    result.push(<br key={'a' + (key++)} />);
                } else {
                    let href = m[0].match(/href="([^"]+)"/) || m[0].match(/href='([^']+)'/);
                    let target = m[0].match(/target="([^"]+)"/) || m[0].match(/target='([^']+)'/);
                    let rel = m[0].match(/rel="([^"]+)"/) || m[0].match(/rel='([^']+)'/);
                    const title = m[0].match(/>([^<]*)</);

                    // eslint-disable-next-line
                    result.push(<a key={'a' + (key++)} href={href ? href[1] : ''} target={target ? target[1] : '_blank'} rel={rel ? rel[1] : ''}>{title ? title[1] : ''}</a>);
                }

                text = p[1];

                m = text && text.match(/<a [^<]+<\/a>|<br\/?>/);
                if (!m) {
                    p[1] && result.push(<span key={'a' + (key++)}>{p[1]}</span>);
                }
            } while (m);

            return result;
        } else {
            return text;
        }
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
                } else {
                    if (states && !states.common) {
                        return states.smartName;
                    } else {
                        return states.common.smartName;
                    }
                }
            } else {
                if (states && !states.common) {
                    return states.smartName;
                } else {
                    return (states &&
                        states.common &&
                        states.common.custom &&
                        states.common.custom[instanceId]) ?
                        states.common.custom[instanceId].smartName : undefined;
                }
            }
        } else
        if (!noCommon) {
            return states[id].common.smartName;
        } else {
            return (states[id] &&
                states[id].common &&
                states[id].common.custom &&
                states[id].common.custom[instanceId]) ?
                states[id].common.custom[instanceId].smartName || null : null;
        }
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
            } else {
                if (obj && !obj.common) {
                    return obj.smartName;
                } else {
                    return obj.common.smartName;
                }
            }
        } else {
            if (obj && !obj.common) {
                return obj.smartName;
            } else {
                return (obj &&
                    obj.common &&
                    obj.common.custom &&
                    obj.common.custom[instanceId]) ?
                    obj.common.custom[instanceId].smartName : undefined;
            }
        }
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

        // convert Old format
        if (typeof obj.common.smartName === 'string') {
            const nnn = obj.common.smartName;
            obj.common.smartName = {};
            obj.common.smartName[language] = nnn;
        }

        // convert old settings
        if (obj.native && obj.native.byON) {
            delete obj.native.byON;
            let _smartName = obj.common.smartName;

            if (!_smartName || typeof _smartName !== 'object') {
                _smartName = {en: _smartName};
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
                    (!obj.common.role || obj.common.role.indexOf('button') >= 0)))) {
                delete smartName[language];
                let empty = true;
                // Check if structure has any definitions
                for (const key in smartName) {
                    if (smartName.hasOwnProperty(key)) {
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
                            delete obj.common.custom[instanceId]['zh-cn'];
                        }
                    } else {
                        if (obj.common.smartName.byON !== undefined) {
                            delete obj.common.smartName.en;
                            delete obj.common.smartName.de;
                            delete obj.common.smartName.ru;
                            delete obj.common.smartName.nl;
                            delete obj.common.smartName.pl;
                            delete obj.common.smartName.it;
                            delete obj.common.smartName.fr;
                            delete obj.common.smartName.pt;
                            delete obj.common.smartName.es;
                            delete obj.common.smartName['zh-cn'];
                        } else {
                            obj.common.smartName = null;
                        }
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
        const el = window.document.createElement('textarea');
        el.value = text;
        window.document.body.appendChild(el);
        el.select();
        window.document.execCommand('copy');
        window.document.body.removeChild(el);
        console.log(text);
        e && e.stopPropagation();
        e && e.preventDefault();
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
        } else {
            return null;
        }
    }

    /**
     * Format number of bytes as a string with B, KB, MB or GB.
     * The base for all calculations is 1024.
     * @param {number} bytes The number of bytes.
     * @returns {string} The formatted string (e.g. '723.5 KB')
     */
    static formatBytes(bytes) {
        if (Math.abs(bytes) < 1024) {
            return bytes + ' B';
        }

        const units = ['KB','MB','GB'];
        //const units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        let u = -1;

        do {
            bytes /= 1024;
            ++u;
        } while (Math.abs(bytes) >= 1024 && u < units.length - 1);

        return bytes.toFixed(1) + ' ' + units[u];
    }

    /**
     * Invert the given color according to theme type to get the inverted text color for background
     * @param {string} color Color in the format '#rrggbb' or '#rgb' (or without hash)
     * @param {string} themeType theme type
     * @param {string} invert dark theme has light color in control or light theme has light color in control
     * @returns {string}
     */
    static getInvertedColor(color, themeType, invert) {
        if (!color) {
            return undefined;
        } else {
            const invertedColor = Utils.invertColor(color, true);
            if (invertedColor === '#FFFFFF' && (themeType === 'dark' || (invert && themeType === 'light'))) {
                return '#DDD';
            } else
            if (invertedColor === '#000000' && (themeType === 'light' || (invert && themeType === 'dark'))) {
                return '#222';
            } else {
                return undefined;
            }
        }
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
        } else if (hex.startsWith('rgba')) {
            const m = hex.match(/rgb?\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) {
                hex = parseInt(m[1], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0') +
                    parseInt(m[2], 10).toString(16).padStart(2, '0');
            }
        } else
        if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            console.warn('Cannot invert color: ' + hex);
            return hex;
        }
        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);

        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return '#' + r.padStart(2, '0') + g.padStart(2, '0') + b.padStart(2, '0');
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
        let k, y, str='';

        if (typeof mix === 'string' || typeof mix === 'number') {
            str += mix;
        } else if (typeof mix === 'object') {
            if (Array.isArray(mix)) {
                for (k=0; k < mix.length; k++) {
                    if (mix[k]) {
                        if ((y = Utils._toVal(mix[k]))) {
                            str && (str += ' ');
                            str += y;
                        }
                    }
                }
            } else {
                for (k in mix) {
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
    static clsx () {
        let i = 0;
        let tmp;
        let x;
        let str = '';
        while (i < arguments.length) {
            if ((tmp = arguments[i++])) {
                if ((x = Utils._toVal(tmp))) {
                    str && (str += ' ');
                    str += x
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

        return themeName ? themeName : window.localStorage && window.localStorage.getItem('App.themeName') ?
            window.localStorage.getItem('App.themeName') : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'colored';
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

        themeName = themeName || (window.localStorage && window.localStorage.getItem('App.themeName'));
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
        window.localStorage.setItem('App.themeName', themeName);
        window.localStorage.setItem('App.theme', themeName === 'dark' || themeName === 'blue' ? 'dark' : 'light');
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
        themeName = themeName || (window.localStorage && window.localStorage.getItem('App.themeName'));

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
        } else {
            return null;
        }
    }

    static formatDate(dateObj, dateFormat) {
        // format could be DD.MM.YYYY, YYYY.MM.DD or MM/DD/YYYY

        if (!dateObj) {
            return '';
        }

        let text;
        let mm = dateObj.getMonth() + 1;
        if (mm < 10) {
            mm = '0' + mm;
        }

        let dd = dateObj.getDate();
        if (dd < 10) {
            dd = '0' + dd;
        }

        if (dateFormat === 'MM/DD/YYYY') {
            text = mm + '/' + dd + '/' + dateObj.getFullYear();
        } else {
            text = dateObj.getFullYear() + '-' + mm + '-' + dd;
        }

        // time
        let v = dateObj.getHours();
        if (v < 10) {
            text += ' 0' + v;
        } else {
            text += ' ' + v;
        }
        v = dateObj.getMinutes();
        if (v < 10) {
            text += ':0' + v;
        } else {
            text += ':' + v;
        }

        v = dateObj.getSeconds();
        if (v < 10) {
            text += ':0' + v;
        } else {
            text += ':' + v;
        }

        v = dateObj.getMilliseconds();
        if (v < 10) {
            text += '.00' + v;
        } else if (v < 100) {
            text += '.0' + v;
        } else {
            text += '.' + v;
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
            } else if (h) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else {
                return `0:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        } else {
            return '0:00:00';
        }
    }

    static MDtext2link(text) {
        const m = text.match(/\d+\.\)\s/);
        if (m) {
            text = text.replace(m[0], m[0].replace(/\s/, '&nbsp;'));
        }

        return text.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').trim().replace(/\s/g, '').toLowerCase();
    }

    static openLink(url, target) {
        if (target === 'this') {
            window.location = url;
        } else {
            window.open(url, target || '_blank');
        }
    }

    static MDgetTitle(text) {
        let {body, header} = Utils.extractHeader(text);
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
        } else {
            return header.title;
        }
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
                    const pos = line.indexOf(':');
                    if (pos !== -1) {
                        const attr = line.substring(0, pos).trim();
                        attrs[attr] = line.substring(pos + 1).trim();
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
        return {header: attrs, body: text};
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
     * @returns {object} json structure (not stringified)
     */
    static generateFile(filename, json) {
        let el = document.createElement('a');
        el.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2)));
        el.setAttribute('download', filename);

        el.style.display = 'none';
        document.body.appendChild(el);

        el.click();

        document.body.removeChild(el);
    }

    /**
     * Convert quality code into text
     * @param {number} quality code
     * @returns {array<string>} lines that decode qulity
     */
    static quality2text(quality) {
        const custom = quality & 0xFFFF0000;
        const text = QUALITY_BITS[quality];
        let result;
        if (text) {
            result = [text];
        } else if (quality & 0x01) {
            result = [QUALITY_BITS[0x01], '0x' + (quality & (0xFFFF & ~1)).toString(16)];
        } else if (quality & 0x02) {
            result = [QUALITY_BITS[0x02], '0x' + (quality & (0xFFFF & ~2)).toString(16)];
        } else {
            result = ['0x' + quality.toString(16)];
        }
        if (custom) {
            result.push('0x' + (custom >> 16).toString(16).toUpperCase());
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
            } else
                // if old format val1:text1;val2:text2
            if (typeof states === 'string') {
                const parts = states.split(';');
                states = {};
                for (let p = 0; p < parts.length; p++) {
                    const s = parts[p].split(':');
                    states[s[0]] = s[1];
                }
            } else if (Array.isArray(states)) {
                const result = {};
                states.forEach((value, key) => result[key] = value);
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
            .then(blob => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = function() { // do not optimize this function. "this" is important.
                        resolve(this.result);
                    };
                    reader.readAsDataURL(blob);
                });
            });
    }
}

export default Utils;
