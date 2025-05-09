import semver from 'semver';
import { type ThemeType, type Translate } from '@iobroker/adapter-react-v5';
import type { InstancesWorker } from '@/Workers/InstancesWorker';
import { replaceLink } from './utils';

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
     *
     * @param bytes the number of bytes
     */
    static formatRam(bytes: number): string {
        const GB = Math.floor((bytes / (1024 * 1024 * 1024)) * 10) / 10;
        bytes %= 1024 * 1024 * 1024;
        const MB = Math.floor((bytes / (1024 * 1024)) * 10) / 10;
        let text = '';

        if (GB > 1) {
            text += `${GB} GB`;
        } else {
            text += `${MB} MB`;
        }

        return text;
    }

    static isTouchDevice(): boolean {
        return 'ontouchstart' in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0;
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
    static invertColor(hex: string, bw: boolean): string {
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
            return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
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
     *
     * @param seconds the number of seconds
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

    static objectMap<Result = any, Value = any>(
        object: Record<string, Value>,
        callback: (res: Value, key: string) => Result,
    ): Result[] {
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

                if (obj.common.adminUI) {
                    console.warn(
                        `Please add to "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`,
                    );
                }
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
                    if (obj.common.adminUI.custom !== 'json') {
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
                if (changed) {
                    console.warn(
                        `Please modify "${obj._id.replace(/\.\d+$/, '')}" common.adminUI=${JSON.stringify(obj.common.adminUI)}`,
                    );
                }
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

    static PASSWORD_ERROR_LENGTH =
        'Password must be at least 8 characters long and have numbers, upper and lower case letters';

    static PASSWORD_ERROR_NOT_EQUAL = 'Repeat password is not equal with password';

    static PASSWORD_ERROR_EMPTY = 'Empty password is not allowed';

    static PASSWORD_SET = '***********';

    /** The languages for which docs are generated */
    static SUPPORTED_DOC_LANGUAGES: ioBroker.Languages[] = ['en', 'de', 'ru', 'zh-cn'];

    static checkPassword(password: string, passwordRepeat?: string): false | string {
        password = password || '';
        passwordRepeat = passwordRepeat || '';
        if (
            password &&
            passwordRepeat &&
            password !== AdminUtils.PASSWORD_SET &&
            passwordRepeat !== AdminUtils.PASSWORD_SET
        ) {
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
            if (
                passwordRepeat.length < 8 ||
                !passwordRepeat.match(/\d/) ||
                !passwordRepeat.match(/[a-z]/) ||
                !passwordRepeat.match(/[A-Z]/)
            ) {
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
     * @param options.adapterName the adapter name without ioBroker. prefix
     * @param options.lang the language for the docs
     */
    static getDocsLinkForAdapter(options: { lang: ioBroker.Languages; adapterName: string }): string {
        const { adapterName } = options;
        let { lang } = options;

        if (!AdminUtils.SUPPORTED_DOC_LANGUAGES.includes(lang)) {
            lang = 'en';
        }

        return `https://www.iobroker.net/#${lang}/adapters/adapterref/iobroker.${adapterName}/README.md`;
    }

    static updateAvailable(oldVersion: string, newVersion: string): boolean {
        try {
            return semver.gt(newVersion, oldVersion) === true;
        } catch {
            console.warn(`[ADAPTERS] Cannot compare "${newVersion}" and "${oldVersion}"`);
            return false;
        }
    }

    static getText(word: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
        if (typeof word === 'object') {
            if (!word) {
                return '';
            }
            return (word[lang] || word.en || '').toString();
        }

        return word ? word.toString() : '';
    }

    static clone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    static async getHref(
        instancesWorker: InstancesWorker,
        tab: string,
        hostname: string,
        hosts: Record<string, ioBroker.HostObject>,
        adminInstance: string,
        themeType: ThemeType,
    ): Promise<{ href: string; adapterName: string; instanceNumber: number | null }> {
        const instances = await instancesWorker.getObjects();
        let adapter = tab.replace(/^tab-/, '');
        const m = adapter.match(/-(\d+)$/);
        const instanceNumber: number | null = m ? parseInt(m[1], 10) : null;
        let instance;
        if (instances) {
            if (instanceNumber !== null) {
                adapter = adapter.replace(/-(\d+)$/, '');
                const name = `system.adapter.${adapter}.${instanceNumber}`;
                instance = Object.keys(instances).find(id => id === name);
            } else {
                const name = `system.adapter.${adapter}.`;

                instance = instances && Object.keys(instances).find(id => id.startsWith(name));
            }
        }
        instance = instances?.[instance];
        AdminUtils.fixAdminUI(instance);
        if (!instance?.common?.adminTab) {
            console.error(`Cannot find instance ${tab}`);

            return { href: '', adapterName: adapter, instanceNumber };
        }

        // calculate href
        let href = instance.common.adminTab.link;
        if (!href) {
            if (instance.common.adminUI?.tab === 'materialize') {
                href = `adapter/${adapter}/tab_m.html${instanceNumber !== null && instanceNumber !== undefined ? `?${instanceNumber}` : ''}`;
            } else {
                href = `adapter/${adapter}/tab.html${instanceNumber !== null && instanceNumber !== undefined ? `?${instanceNumber}` : ''}`;
            }
        }
        if (!instance.common.adminTab.singleton && instanceNumber !== null && instanceNumber !== undefined) {
            href += `${href.includes('?') ? '&' : '?'}instance=${instanceNumber}`;
        }

        if (href.includes('%')) {
            let _instNum: number;
            // fix for singletons
            if (instanceNumber === null) {
                _instNum = parseInt(instance._id.split('.').pop(), 10);
            } else {
                _instNum = instanceNumber;
            }

            // replace
            const hrefs = replaceLink(href, adapter, _instNum, {
                hostname,
                // it cannot be void
                instances,
                hosts,
                adminInstance,
            });

            href = hrefs ? hrefs[0]?.url : '';
        }

        // add at the end the instance, as some adapters make bullshit like: window.location.search.slice(-1) || 0;
        href += `${href.includes('?') ? '&' : '?'}newReact=true${instanceNumber !== null && instanceNumber !== undefined ? `&${instanceNumber}` : ''}&react=${themeType}`;

        return {
            href,
            adapterName: adapter,
            instanceNumber,
        };
    }

    /**
     * Checks if running in dev mode
     */
    static isDevMode(): boolean {
        return import.meta.env.DEV === true;
    }
}

export default AdminUtils;
