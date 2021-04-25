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
    static _replaceLink(link, objects, adapterInstance, attr, placeholder) {
        if (attr === 'protocol') {
            attr = 'secure';
        }

        try {
            const object = objects['system.adapter.' + adapterInstance];

            if (link && object) {
                if (attr === 'secure') {
                    link = link.replace('%' + placeholder + '%', object.native[attr] ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + placeholder + '%') === -1) {
                        link = link.replace('%native_' + placeholder + '%', object.native[attr]);
                    } else {
                        link = link.replace('%' + placeholder + '%', object.native[attr]);
                    }
                }
            } else {
                console.log('Cannot get link ' + attr);
                link = link.replace('%' + placeholder + '%', '');
            }
        } catch (error) {
            console.log(error);
        }
        return link;
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
            const native = context.objects[`system.adapter.${adapter}.${instance}`]?.native || {};

            let placeholders = link.match(/%(\w+)%/g);

            if (placeholders) {
                for (let p = 0; p < placeholders.length; p++) {
                    let placeholder = placeholders[p];

                    if (placeholder === '%ip%') {
                        let ip = native.bind || native.ip;
                        if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '0.0.0.0') {
                            ip = context.hostname
                        }

                        if (_urls.length) {
                            _urls.forEach(item => item.url = item.url.replace('%ip%', ip));
                        } else {
                            link = link.replace('%ip%', ip);
                        }
                    } else if (placeholder === '%protocol%') {
                        let protocol = native.secure === undefined ? native.protocol : native.secure;
                        if (protocol === true || protocol === 'true') {
                            protocol = 'https';
                        } else if (protocol === false || protocol === 'false') {
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
                                    item.url = Utils._replaceLink(item.url, context.objects, adapterInstance, placeholder, placeholder));
                            } else {
                                link = Utils._replaceLink(link, context.objects, adapterInstance, placeholder, placeholder);
                                port = context.objects['system.adapter.' + adapterInstance]?.native?.port;
                            }
                        } else {
                            const [adapterInstance, attr] = placeholder.split('_');

                            // if instance number not found
                            if (!adapterInstance.match(/\.[0-9]+$/)) {
                                // list all possible instances
                                const ids = Object.keys(context.objects)
                                    .filter(id => id.startsWith('system.adapter.' + adapterInstance + '.') && context.objects[id].common.enabled)
                                    .map(id => id.substring(15));

                                ids.forEach(id => {
                                    if (_urls.length) {
                                        const item = _urls.find(t => t.instance === id);
                                        if (item) {
                                            item.url = Utils._replaceLink(item.url, context.objects, id, attr, placeholder);
                                        }
                                    } else {
                                        const _link = Utils._replaceLink(link, context.objects, id, attr, placeholder);
                                        const _port = context.objects['system.adapter.' + id]?.native?.port;
                                        _urls.push({url: _link, port: _port, instance: id});
                                    }
                                });
                            } else {
                                link = Utils._replaceLink(link, context.objects, adapterInstance, attr, placeholder);
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
}

export default Utils;