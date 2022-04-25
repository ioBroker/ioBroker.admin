const ANSI_RESET = 0;
const ANSI_RESET_COLOR = 39;
const ANSI_RESET_BG_COLOR = 49;
const ANSI_BOLD = 1;
const ANSI_RESET_BOLD = 22;

const STYLES = {
    30: {color: 'black'}, // ANSI_BLACK
    31: {color: 'red'}, // ANSI_RED
    32: {color: 'green'}, // ANSI_GREEN
    33: {color: 'yellow'}, // ANSI_YELLOW
    34: {color: 'blue'}, // ANSI_BLUE
    35: {color: 'purple'}, // ANSI_PURPLE
    36: {color: 'cyan'}, // ANSI_CYAN
    37: {color: 'white'}, // ANSI_WHITE

    90: {color: 'grey'}, // ANSI_BRIGHT_BLACK
    91: {color: 'lightred'}, // ANSI_BRIGHT_RED
    92: {color: 'lightgreen'}, // ANSI_BRIGHT_GREEN
    93: {color: 'lightyellow'}, // ANSI_BRIGHT_YELLOW
    94: {color: 'lightblue'}, // ANSI_BRIGHT_BLUE
    95: {color: 'lightpurple'}, // ANSI_BRIGHT_PURPLE
    96: {color: 'lightcyan'}, // ANSI_BRIGHT_CYAN
    97: {color: 'white'}, // ANSI_BRIGHT_WHITE

    40: {backgroundColor: 'black'}, // ANSI_BG_BLACK
    41: {backgroundColor: 'red'}, // ANSI_BG_RED
    42: {backgroundColor: 'green'}, // ANSI_BG_GREEN
    43: {backgroundColor: 'yellow'}, // ANSI_BG_YELLOW
    44: {backgroundColor: 'blue'}, // ANSI_BG_BLUE
    45: {backgroundColor: 'purple'}, // ANSI_BG_PURPLE
    46: {backgroundColor: 'cyan'}, // ANSI_BG_CYAN
    47: {backgroundColor: 'white'}, // ANSI_BG_WHITE

    100: {backgroundColor: 'grey'}, // ANSI_BRIGHT_BG_BLACK
    101: {backgroundColor: 'lightred'}, // ANSI_BRIGHT_BG_RED
    102: {backgroundColor: 'lightgreen'}, // ANSI_BRIGHT_BG_GREEN
    103: {backgroundColor: 'lightyellow'}, // ANSI_BRIGHT_BG_YELLOW
    104: {backgroundColor: 'lightblue'}, // ANSI_BRIGHT_BG_BLUE
    105: {backgroundColor: 'lightpurple'}, // ANSI_BRIGHT_BG_PURPLE
    106: {backgroundColor: 'lightcyan'}, // ANSI_BRIGHT_BG_CYAN
    107: {backgroundColor: 'white'}, // ANSI_BRIGHT_BG_WHITE
}

class Utils {

    /**
     * Format bytes to MB or GB
     * @param {!number} bytes
     * @returns {String}
     */
    static formatRam(bytes) {

        const GB = Math.floor(bytes / (1024 * 1024 * 1024) * 10) / 10;
        bytes %= (1024 * 1024 * 1024);
        const MB = Math.floor(bytes / (1024 * 1024) * 10) / 10;
        let text = '';

        if (GB > 1) {
            text += GB + ' GB';
        } else {
            text += MB + ' MB';
        }

        return text;
    }

    static formatSpeed(mhz) {
        return mhz + ' MHz';
    }

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

    static getFileExtension(fileName) {
        const pos = fileName.lastIndexOf('.');
        if (pos !== -1) {
            return fileName.substring(pos + 1).toLowerCase();
        } else {
            return null;
        }
    }

    // Big thanks to : https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    static invertColor(hex, bw) {
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

    /**
     * Format number in seconds to time text
     * @param {!number} seconds
     * @returns {String}
     */
    static formatSeconds(seconds, t) {
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
            text += days + ' ' + t('daysShortText') + ' ';
        }
        text += hours + ':' + minutes + ':' + seconds;

        return text;
    }

    // internal use
    static _replaceLink(link, objects, adapterInstance, attr, placeholder, hosts, hostname, adminInstance) {
        if (attr === 'protocol') {
            attr = 'secure';
        }

        try {
            const object = objects['system.adapter.' + adapterInstance];

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
                            ip = Utils.getHostname(object, objects, hosts, hostname, adminInstance);
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
                console.log('Cannot get link ' + attr);
                link = link.replace(`%${placeholder}%`, '');
            }
        } catch (error) {
            console.log(error);
        }
        return link;
    }

    static ip2int(ip) {
        return ip.split('.').reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    static findNetworkAddressOfHost(obj, localIp) {
        const networkInterfaces = obj?.native?.hardware?.networkInterfaces;
        if (!networkInterfaces) {
            return null;
        }

        let hostIp;
        Object.keys(networkInterfaces).forEach(inter => {
            networkInterfaces[inter].forEach(ip => {
                if (ip.internal) {
                    return;
                } else if (localIp.includes(':') && ip.family !== 'IPv6') {
                    return;
                } else if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                    return;
                }
                if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) { // if DNS name
                    hostIp = ip.address;
                } else {
                    if (ip.family === 'IPv4' && localIp.includes('.') &&
                        (Utils.ip2int(localIp) & Utils.ip2int(ip.netmask)) === (Utils.ip2int(ip.address) & Utils.ip2int(ip.netmask))) {
                        hostIp = ip.address;
                    } else {
                        hostIp = ip.address;
                    }
                }
            });
        });

        if (!hostIp) {
            Object.keys(networkInterfaces).forEach(inter => {
                networkInterfaces[inter].forEach(ip => {
                    if (ip.internal) {
                        return;
                    } else if (localIp.includes(':') && ip.family !== 'IPv6') {
                        return;
                    } else if (localIp.includes('.') && !localIp.match(/[^.\d]/) && ip.family !== 'IPv4') {
                        return;
                    }
                    if (localIp === '127.0.0.0' || localIp === 'localhost' || localIp.match(/[^.\d]/)) { // if DNS name
                        hostIp = ip.address;
                    } else {
                        hostIp = ip.address;
                    }
                });
            });
        }

        if (!hostIp) {
            Object.keys(networkInterfaces).forEach(inter => {
                networkInterfaces[inter].forEach(ip => {
                    if (ip.internal) {
                        return;
                    }
                    hostIp = ip.address;
                });
            });
        }

        return hostIp;
    }

    static getHostname(instanceObj, objects, hosts, currentHostname, adminInstance) {
        if (!instanceObj || !instanceObj.common) {
            return null;
        }

        let hostname;
        // check if the adapter from the same host as admin
        const adminHost = objects['system.adapter.' + adminInstance]?.common?.host;
        if (instanceObj.common.host !== adminHost) {
            // find IP address
            const host = hosts.find(obj => obj._id === 'system.host.' + instanceObj.common.host);
            if (host) {
                const ip = Utils.findNetworkAddressOfHost(host, currentHostname);
                if (ip) {
                    hostname = ip;
                } else {
                    console.warn(`Cannot find suitable IP in host ${instanceObj.common.host} for ${instanceObj._id}`);
                    return null;
                }
            } else {
                console.warn(`Cannot find host ${instanceObj.common.host} for ${instanceObj._id}`);
                return null
            }
        } else {
            hostname = currentHostname;
        }
        return hostname;
    }

    /**
     * Format number in seconds to time text
     * @param {string} link pattern for link
     * @param {string} adapter admin name
     * @param {string} instance admin instance
     * @param {object} context {objects, hostname(of browser), protocol(of browser)}
     * @returns {array<any>}
     */
    static replaceLink(link, adapter, instance, context) {
        const _urls = [];
        let port;

        if (link) {
            const instanceObj = context.objects[`system.adapter.${adapter}.${instance}`];
            const native      = instanceObj?.native || {};

            let placeholders = link.match(/%(\w+)%/g);

            if (placeholders) {
                for (let p = 0; p < placeholders.length; p++) {
                    let placeholder = placeholders[p];

                    if (placeholder === '%ip%') {
                        let ip = native.bind || native.ip;
                        if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '0.0.0.0') {
                            // Check host
                            ip = Utils.getHostname(instanceObj, context.objects, context.hosts, context.hostname, context.adminInstance);
                        }

                        if (_urls.length) {
                            _urls.forEach(item => item.url = item.url.replace('%ip%', ip));
                        } else {
                            link = link.replace('%ip%', ip ||'');
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
                            const adapterInstance = adapter + '.' + instance;
                            if (_urls.length) {
                                _urls.forEach(item =>
                                    item.url = Utils._replaceLink(item.url, context.objects, adapterInstance, placeholder, placeholder, context.hosts, context.hostname, context.adminInstance));
                            } else {
                                link = Utils._replaceLink(link, context.objects, adapterInstance, placeholder, placeholder, context.hosts, context.hostname, context.adminInstance);
                                port = context.objects['system.adapter.' + adapterInstance]?.native?.port;
                            }
                        } else {
                            const [adapterInstance, attr] = placeholder.split('_');

                            // if instance number not found
                            if (!adapterInstance.match(/\.[0-9]+$/)) {
                                // list all possible instances
                                let ids;
                                if (adapter === adapterInstance) {
                                    // take only this one instance and that's all
                                    ids = [adapter + '.' + instance];
                                } else {
                                    ids = Object.keys(context.objects)
                                        .filter(id => id.startsWith('system.adapter.' + adapterInstance + '.') && context.objects[id].common.enabled)
                                        .map(id => id.substring(15));
                                }

                                // eslint-disable-next-line
                                ids.forEach(id => {
                                    if (_urls.length) {
                                        const item = _urls.find(t => t.instance === id);
                                        if (item) {
                                            item.url = Utils._replaceLink(item.url, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                        } else {
                                            // add new
                                            const _link = Utils._replaceLink(link, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                            const _port = context.objects['system.adapter.' + id]?.native?.port;
                                            _urls.push({url: _link, port: _port, instance: id});
                                        }
                                    } else {
                                        const _link = Utils._replaceLink(link, context.objects, id, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                        const _port = context.objects['system.adapter.' + id]?.native?.port;
                                        _urls.push({url: _link, port: _port, instance: id});
                                    }
                                });
                            } else {
                                link = Utils._replaceLink(link, context.objects, adapterInstance, attr, placeholder, context.hosts, context.hostname, context.adminInstance);
                                port = context.objects['system.adapter.' + adapterInstance]?.native?.port;
                            }
                        }
                    }
                }
            }
        }

        if (_urls.length) {
            return _urls;
        } else {
            return [{url: link, port}];
        }
    }

    static objectMap(object, callback) {
        let result = [];
        for (let key in object) {
            result.push(callback(object[key], key));
        }
        return result;
    }

    static fixAdminUI(obj) {
        if (obj && obj.common && !obj.common.adminUI) {
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
        }
    }

    static parseColorMessage(text) {
        if (text && (text.includes('\u001b[') || text.includes('\u001B['))) {
            // eslint-disable-next-line
            let m = text.match(/\u001b\[\d+m/gi);
            if (m) {
                const original = text;
                const result = [];
                let style = {};
                for (let i = 0; i < m.length; i++) {
                    const pos = text.indexOf(m[i]);
                    if (pos) {
                        result.push({text: text.substring(0, pos), style: JSON.parse(JSON.stringify(style))});
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
                    result.push({text, style: JSON.parse(JSON.stringify(style))});
                }

                return {original, parts: result};
            } else {
                return text;
            }
        } else {
            return text;
        }
    }
}

export default Utils;