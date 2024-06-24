import semver from 'semver';
import { type Translate } from '@iobroker/adapter-react-v5';

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

const ANSI_RESET = 0;
const ANSI_RESET_COLOR = 39;
const ANSI_RESET_BG_COLOR = 49;
const ANSI_BOLD = 1;
const ANSI_RESET_BOLD = 22;

export interface Style {
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
}

const STYLES: Record<string, Style> = {
    30: { color: 'black' }, // ANSI_BLACK
    31: { color: 'red' }, // ANSI_RED
    32: { color: 'green' }, // ANSI_GREEN
    33: { color: 'yellow' }, // ANSI_YELLOW
    34: { color: 'blue' }, // ANSI_BLUE
    35: { color: 'purple' }, // ANSI_PURPLE
    36: { color: 'cyan' }, // ANSI_CYAN
    37: { color: 'white' }, // ANSI_WHITE

    90: { color: 'grey' }, // ANSI_BRIGHT_BLACK
    91: { color: 'lightred' }, // ANSI_BRIGHT_RED
    92: { color: 'lightgreen' }, // ANSI_BRIGHT_GREEN
    93: { color: 'lightyellow' }, // ANSI_BRIGHT_YELLOW
    94: { color: 'lightblue' }, // ANSI_BRIGHT_BLUE
    95: { color: 'lightpurple' }, // ANSI_BRIGHT_PURPLE
    96: { color: 'lightcyan' }, // ANSI_BRIGHT_CYAN
    97: { color: 'white' }, // ANSI_BRIGHT_WHITE

    40: { backgroundColor: 'black' }, // ANSI_BG_BLACK
    41: { backgroundColor: 'red' }, // ANSI_BG_RED
    42: { backgroundColor: 'green' }, // ANSI_BG_GREEN
    43: { backgroundColor: 'yellow' }, // ANSI_BG_YELLOW
    44: { backgroundColor: 'blue' }, // ANSI_BG_BLUE
    45: { backgroundColor: 'purple' }, // ANSI_BG_PURPLE
    46: { backgroundColor: 'cyan' }, // ANSI_BG_CYAN
    47: { backgroundColor: 'white' }, // ANSI_BG_WHITE

    100: { backgroundColor: 'grey' }, // ANSI_BRIGHT_BG_BLACK
    101: { backgroundColor: 'lightred' }, // ANSI_BRIGHT_BG_RED
    102: { backgroundColor: 'lightgreen' }, // ANSI_BRIGHT_BG_GREEN
    103: { backgroundColor: 'lightyellow' }, // ANSI_BRIGHT_BG_YELLOW
    104: { backgroundColor: 'lightblue' }, // ANSI_BRIGHT_BG_BLUE
    105: { backgroundColor: 'lightpurple' }, // ANSI_BRIGHT_BG_PURPLE
    106: { backgroundColor: 'lightcyan' }, // ANSI_BRIGHT_BG_CYAN
    107: { backgroundColor: 'white' }, // ANSI_BRIGHT_BG_WHITE
};

class AdminUtils {
    /**
     * Perform JSON parse/stringify with type inference
     *
     * @param obj the object to clone
     */
    static deepClone<T extends Record<string, any>>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Format bytes to MB or GB
     * @param bytes
     */
    static formatRam(bytes: number): string {
        const GB = Math.floor((bytes / (1024 * 1024 * 1024)) * 10) / 10;
        bytes %= (1024 * 1024 * 1024);
        const MB = Math.floor(((bytes / (1024 * 1024)) * 10)) / 10;
        let text = '';

        if (GB > 1) {
            text += `${GB} GB`;
        } else {
            text += `${MB} MB`;
        }

        return text;
    }

    static formatSpeed(mhz: number): string {
        return `${mhz} MHz`;
    }

    static formatBytes(bytes: number): string {
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

    static getFileExtension(fileName: string): string | null {
        const pos = fileName.lastIndexOf('.');
        if (pos !== -1) {
            return fileName.substring(pos + 1).toLowerCase();
        }
        return null;
    }

    // Big thanks to: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    static invertColor(hex: string, bw: boolean) {
        if (hex === undefined || hex === null || hex === '' || typeof hex !== 'string') {
            return '';
        }
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        const finalR = (255 - r).toString(16);
        const finalG = (255 - g).toString(16);
        const finalB = (255 - b).toString(16);
        // pad each with zeros and return
        return `#${finalR.padStart(2, '0')}${finalG.padStart(2, '0')}${finalB.padStart(2, '0')}`;
    }

    /**
     * Format number in seconds to time text
     * @param seconds
     * @param t i18n.t function
     */
    static formatSeconds(seconds: number, t: Translate): string {
        const days = Math.floor(seconds / (3600 * 24));
        let minutesRes: string;
        let secondsRes: string;
        let hoursRes: string;

        seconds %= 3600 * 24;
        const hours = Math.floor(seconds / 3600);

        if (hours < 10) {
            hoursRes = `0${hours}`;
        } else {
            hoursRes = hours.toString();
        }
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 10) {
            minutesRes = `0${minutes}`;
        } else {
            minutesRes = minutes.toString();
        }

        seconds %= 60;
        seconds = Math.floor(seconds);
        if (seconds < 10) {
            secondsRes = `0${seconds}`;
        } else {
            secondsRes = seconds.toString();
        }

        let text = '';
        if (days) {
            text += `${days} ${t('daysShortText')} `;
        }
        text += `${hoursRes}:${minutesRes}:${secondsRes}`;

        return text;
    }

    // internal use
    static _replaceLink(link: string, objects: Record<string, ioBroker.InstanceObject>, adapterInstance: string, attr: string, placeholder: string, hosts: ioBroker.HostObject[], hostname: string, adminInstance: string) {
        if (attr === 'protocol') {
            attr = 'secure';
        }

        try {
            const object = objects[`system.adapter.${adapterInstance}`];

            if (link && object) {
                if (attr === 'secure') {
                    link = link.replace(`%${placeholder}%`, object.native[attr] ? 'https' : 'http');
                } else {
                    let value = object.native[attr];
                    // workaround for port
                    if ((attr === 'webinterfacePort' || attr === 'port') && (!value || value === '0')) {
                        if (object.native.secure === true) {
                            value = 443;
                        } else {
                            value = 80;
                        }
                    }

                    if (attr === 'bind' || attr === 'ip') {
                        let ip = object.native.bind || object.native.ip;
                        if (ip === '0.0.0.0') {
                            ip = AdminUtils.getHostname(object, objects, hosts, hostname, adminInstance);
                        }
                        if (!link.includes(`%${placeholder}%`)) {
                            link = link.replace(`%native_${placeholder}%`, ip || '');
                        } else {
                            link = link.replace(`%${placeholder}%`, ip || '');
                        }
                    } else if (!link.includes(`%${placeholder}%`)) {
                        link = link.replace(`%native_${placeholder}%`, value);
                    } else {
                        link = link.replace(`%${placeholder}%`, value);
                    }
                }
            } else {
                console.log(`Cannot get link ${attr}`);
                link = link.replace(`%${placeholder}%`, '');
            }
        } catch (error) {
            console.log(error);
        }
        return link;
    }

    static ip2int(ip: string): number {
        // eslint-disable-next-line no-bitwise
        return ip.split('.').reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    static findNetworkAddressOfHost(obj: ioBroker.HostObject, localIp: string) {
        const networkInterfaces = obj?.native?.hardware?.networkInterfaces;
        if (!networkInterfaces) {
            return null;
        }

        let hostIp;
        for (const networkInterface of Object.values(networkInterfaces)) {
            networkInterface?.forEach(ip => {
                if (ip.internal) {
                    return;
                } if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                } if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) { // if DNS name
                    hostIp = ip.address;
                } else if (
                    ip.family === 'IPv4' && localIp.includes('.') &&
                    // eslint-disable-next-line no-bitwise
                    (AdminUtils.ip2int(localIp) & AdminUtils.ip2int(ip.netmask)) === (AdminUtils.ip2int(ip.address) & AdminUtils.ip2int(ip.netmask))
                ) {
                    hostIp = ip.address;
                } else {
                    hostIp = ip.address;
                }
            });
        }

        if (!hostIp) {
            for (const networkInterface of Object.values(networkInterfaces)) {
                networkInterface?.forEach(ip => {
                    if (ip.internal) {
                        return;
                    } if (localIp.includes(':') && ip.family !== 'IPv6') {
                        return;
                    } if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                        return;
                    }
                    if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) { // if DNS name
                        hostIp = ip.address;
                    } else {
                        hostIp = ip.address;
                    }
                });
            }
        }

        if (!hostIp) {
            for (const networkInterface of Object.values(networkInterfaces)) {
                networkInterface?.forEach(ip => {
                    if (ip.internal) {
                        return;
                    }
                    hostIp = ip.address;
                });
            }
        }

        return hostIp;
    }

    static getHostname(instanceObj: ioBroker.InstanceObject, objects: Record<string, ioBroker.InstanceObject>, hosts: ioBroker.HostObject[], currentHostname: string, adminInstance: string) {
        if (!instanceObj || !instanceObj.common) {
            return null;
        }

        let hostname;
        // check if the adapter from the same host as admin
        const adminHost = objects[`system.adapter.${adminInstance}`]?.common?.host;
        if (instanceObj.common.host !== adminHost) {
            // find IP address
            const host = hosts.find(obj => obj._id === `system.host.${instanceObj.common.host}`);
            if (host) {
                const ip = AdminUtils.findNetworkAddressOfHost(host, currentHostname);
                if (ip) {
                    hostname = ip;
                } else {
                    console.warn(`Cannot find suitable IP in host ${instanceObj.common.host} for ${instanceObj._id}`);
                    return null;
                }
            } else {
                console.warn(`Cannot find host ${instanceObj.common.host} for ${instanceObj._id}`);
                return null;
            }
        } else {
            hostname = currentHostname;
        }

        return hostname;
    }

    /**
     * Format number in seconds to time text
     * @param link pattern for link
     * @param adapter admin name
     * @param instance admin instance
     * @param context {objects, hostname(of browser), protocol(of browser)}
     */
    static replaceLink(link: string, adapter: string, instance: string, context: Record<string, any>): Record<string, any>[] {
        const _urls: Record<string, any>[] = [];
        let port;

        if (link) {
            const instanceObj = context.objects[`system.adapter.${adapter}.${instance}`];
            const native      = instanceObj?.native || {};

            const placeholders = link.match(/%(\w+)%/g);

            if (placeholders) {
                for (let p = 0; p < placeholders.length; p++) {
                    let placeholder = placeholders[p];

                    if (placeholder === '%ip%') {
                        let ip = native.bind || native.ip;
                        if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '0.0.0.0') {
                            // Check host
                            ip = AdminUtils.getHostname(instanceObj, context.objects, context.hosts, context.hostname, context.adminInstance);
                        }

                        if (_urls.length) {
                            _urls.forEach(item => item.url = item.url.replace('%ip%', ip));
                        } else {
                            link = link.replace('%ip%', ip || '');
                        }
                    } else if (placeholder === '%protocol%') {
                        let protocol = native.secure === undefined ? native.protocol : native.secure;
                        if (protocol === true || protocol === 'true') {
                            protocol = 'https';
                        } else if (protocol === false || protocol === 'false' || !protocol) {
                            protocol = 'http';
                        }
                        protocol = protocol.replace(/:$/, '');

                        if (_urls.length) {
                            _urls.forEach(item => item.url = item.url.replace('%protocol%', protocol));
                        } else {
                            link = link.replace('%protocol%', protocol);
                        }
                    } else if (placeholder === '%instance%') {
                        link = link.replace('%instance%', instance);
                        if (_urls.length) {
                            _urls.forEach(item => item.url = item.url.replace('%instance%', instance));
                        } else {
                            link = link.replace('%instance%', instance);
                        }
                    } else {
                        // remove %%
                        placeholder = placeholder.replace(/%/g, '');

                        if (placeholder.startsWith('native_')) {
                            placeholder = placeholder.substring(7);
                        }

                        // like web.0_port or web_protocol
                        if (!placeholder.includes('_')) {
                            // if only one instance
                            const adapterInstance = `${adapter}.${instance}`;
                            if (_urls.length) {
                                _urls.forEach(item =>
                                    item.url = AdminUtils._replaceLink(item.url, context.objects, adapterInstance, placeholder, placeholder, context.hosts, context.hostname, context.adminInstance));
                            } else {
                                link = AdminUtils._replaceLink(link, context.objects, adapterInstance, placeholder, placeholder, context.hosts, context.hostname, context.adminInstance);
                                port = context.objects[`system.adapter.${adapterInstance}`]?.native?.port;
                            }
                        } else {
                            const [adapterInstance, attr] = placeholder.split('_');

                            // if instance number not found
                            if (!adapterInstance.match(/\.[0-9]+$/)) {
                                // list all possible instances
                                let ids;
                                if (adapter === adapterInstance) {
                                    // take only this one instance and that's all
                                    ids = [`${adapter}.${instance}`];
                                } else {
                                    ids = Object.keys(context.objects)
                                        .filter(id => id.startsWith(`system.adapter.${adapterInstance}.`) && context.objects[id].common.enabled)
                                        .map(id => id.substring(15));
                                    // try to get disabled instances
                                    if (!ids.length) {
                                        ids = Object.keys(context.objects)
                                            .filter(id => id.startsWith(`system.adapter.${adapterInstance}.`))
                                            .map(id => id.substring(15));
                                    }
                                }

                                // eslint-disable-next-line
                                ids.forEach(id => {
                                    if (_urls.length) {
                                        const item = _urls.find(t => t.instance === id);
                                        if (item) {
                                            item.url = AdminUtils._replaceLink(item.url, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                        } else {
                                            // add new
                                            const _link = AdminUtils._replaceLink(link, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                            const _port = context.objects[`system.adapter.${id}`]?.native?.port;
                                            _urls.push({ url: _link, port: _port, instance: id });
                                        }
                                    } else {
                                        const _link = AdminUtils._replaceLink(link, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                        const _port = context.objects[`system.adapter.${id}`]?.native?.port;
                                        _urls.push({ url: _link, port: _port, instance: id });
                                    }
                                });
                            } else {
                                link = AdminUtils._replaceLink(link, context.objects, adapterInstance, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                port = context.objects[`system.adapter.${adapterInstance}`]?.native?.port;
                            }
                        }
                    }
                }
            }
        }

        if (_urls.length) {
            return _urls;
        }
        return [{ url: link, port }];
    }

    static objectMap<Result = any, Value = any>(object: Record<string, Value>, callback: (res: Value, key: string) => Result): Result[] {
        const result: Result[] = [];
        for (const key in object) {
            result.push(callback(object[key], key));
        }
        return result;
    }

    static fixAdminUI(obj: Record<string, any>): void {
        if (obj?.common) {
            if (!obj.common.adminUI) {
                if (obj.common.noConfig) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.config = 'none';
                } else if (obj.common.jsonConfig) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.config = 'json';
                } else if (obj.common.materialize) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.config = 'materialize';
                } else {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.config = 'html';
                }

                if (obj.common.jsonCustom) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.custom = 'json';
                } else if (obj.common.supportCustoms) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.custom = 'json';
                }

                if (obj.common.materializeTab && obj.common.adminTab) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.tab = 'materialize';
                } else if (obj.common.adminTab) {
                    obj.common.adminUI = obj.common.adminUI || {};
                    obj.common.adminUI.tab = 'html';
                }

                obj.common.adminUI && console.warn(`Please add to "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`);
            } else {
                let changed = false;
                if (obj.common.materializeTab && obj.common.adminTab) {
                    if (obj.common.adminUI.tab !== 'materialize') {
                        obj.common.adminUI.tab = 'materialize';
                        changed = true;
                    }
                } else if (obj.common.adminTab) {
                    if (obj.common.adminUI.tab !== 'html' && obj.common.adminUI.tab !== 'materialize') {
                        obj.common.adminUI.tab = 'html';
                        changed = true;
                    }
                }

                if (obj.common.jsonCustom || obj.common.supportCustoms) {
                    if (obj.common.adminUI.custom !== 'json')   {
                        obj.common.adminUI.custom = 'json';
                        changed = true;
                    }
                }

                if (obj.common.noConfig) {
                    if (obj.common.adminUI.config !== 'none') {
                        obj.common.adminUI.config = 'none';
                        changed = true;
                    }
                } else if (obj.common.jsonConfig) {
                    if (obj.common.adminUI.config !== 'json') {
                        obj.common.adminUI.config = 'json';
                        changed = true;
                    }
                    obj.common.adminUI.config = 'json';
                } else if (obj.common.materialize) {
                    if (obj.common.adminUI.config !== 'materialize') {
                        if (!obj.common.adminUI.config) {
                            obj.common.adminUI.config = 'materialize';
                            changed = true;
                        }
                    }
                } else if (!obj.common.adminUI.config) {
                    obj.common.adminUI.config = 'html';
                    changed = true;
                }
                changed && console.warn(`Please modify "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`);
            }
        }
    }

    static parseColorMessage(text: string): string | { original: string; parts: { text: string; style: Style }[] } {
        if (text && (text.includes('\u001b[') || text.includes('\u001B['))) {
            // eslint-disable-next-line
            let m = text.match(/\u001b\[\d+m/gi);
            if (m) {
                const original = text;
                const result = [];
                let style: Style = {};
                for (let i = 0; i < m.length; i++) {
                    const pos = text.indexOf(m[i]);
                    if (pos) {
                        result.push({ text: text.substring(0, pos), style: { ...style } });
                    }
                    const code = parseInt(m[i].substring(2), 10);
                    if (STYLES[code]) {
                        Object.assign(style, STYLES[code]);
                    } else if (ANSI_RESET_COLOR === code) {
                        delete style.color;
                    } else if (ANSI_RESET_BG_COLOR === code) {
                        delete style.backgroundColor;
                    } else if (ANSI_RESET_BOLD === code) {
                        delete style.fontWeight;
                    } else if (ANSI_BOLD === code) {
                        style.fontWeight = 'bold';
                    } else if (ANSI_RESET === code) {
                        style = {};
                    }
                    text = text.substring(m[i].length + pos);
                }
                if (text) {
                    result.push({ text, style: { ...style } });
                }

                return { original, parts: result };
            }
            return text;
        }
        return text;
    }

    static PASSWORD_ERROR_LENGTH = 'Password must be at least 8 characters long and have numbers, upper and lower case letters';

    static PASSWORD_ERROR_NOT_EQUAL = 'Repeat password is not equal with password';

    static PASSWORD_ERROR_EMPTY = 'Empty password is not allowed';

    static PASSWORD_SET = '***********';

    /** The languages for which docs are generated */
    static SUPPORTED_DOC_LANGUAGES: ioBroker.Languages[] = ['en', 'de', 'ru', 'zh-cn'];

    static checkPassword(password: string, passwordRepeat?: string) {
        password = password || '';
        passwordRepeat = passwordRepeat || '';
        if (password && passwordRepeat && password !== AdminUtils.PASSWORD_SET && passwordRepeat !== AdminUtils.PASSWORD_SET) {
            if (password.length < 8 || !password.match(/\d/) || !password.match(/[a-z]/) || !password.match(/[A-Z]/)) {
                return AdminUtils.PASSWORD_ERROR_LENGTH;
            }
            if (password !== passwordRepeat) {
                return AdminUtils.PASSWORD_ERROR_NOT_EQUAL;
            }
            return false;
        }
        if (password && password !== AdminUtils.PASSWORD_SET) {
            if (password.length < 8 || !password.match(/\d/) || !password.match(/[a-z]/) || !password.match(/[A-Z]/)) {
                return AdminUtils.PASSWORD_ERROR_LENGTH;
            }
            return false;
        }
        if (passwordRepeat && passwordRepeat !== AdminUtils.PASSWORD_SET) {
            if (passwordRepeat.length < 8 || !passwordRepeat.match(/\d/) || !passwordRepeat.match(/[a-z]/) || !passwordRepeat.match(/[A-Z]/)) {
                return AdminUtils.PASSWORD_ERROR_LENGTH;
            }
            return false;
        }
        if (password === AdminUtils.PASSWORD_SET || passwordRepeat === AdminUtils.PASSWORD_SET) {
            return false;
        }
        return AdminUtils.PASSWORD_ERROR_EMPTY;
    }

    /**
     * Get Link to adapter docs in given language
     *
     * @param options the adapter name without ioBroker. prefix and the language information
     */
    static getDocsLinkForAdapter(options: { lang: ioBroker.Languages; adapterName: string }) {
        const { adapterName } = options;
        let { lang } = options;

        if (!AdminUtils.SUPPORTED_DOC_LANGUAGES.includes(lang)) {
            lang = 'en';
        }

        return `https://www.iobroker.net/#${lang}/adapters/adapterref/iobroker.${adapterName}/README.md`;
    }

    static updateAvailable(oldVersion: string, newVersion: string) {
        try {
            return semver.gt(newVersion, oldVersion) === true;
        } catch (e) {
            console.warn(`[ADAPTERS] Cannot compare "${newVersion}" and "${oldVersion}"`);
            return false;
        }
    }

    static getText(word: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
        if (word && typeof word === 'object') {
            return (word[lang] || word.en || '').toString();
        }

        return (word || '').toString();
    }

    static clone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }
}

export default AdminUtils;
