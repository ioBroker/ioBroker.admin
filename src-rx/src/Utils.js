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

    static replaceLink(link, adapter, instance, context) {
        if (link) {

            let placeholder = link.match(/%(\w+)%/g);

            if (placeholder) {
                if (placeholder[0] === '%ip%') {
                    link = link.replace('%ip%', context.hostname);
                    link = Utils.replaceLink(link, adapter, instance, context);
                } else if (placeholder[0] === '%protocol%') {
                    link = link.replace('%protocol%', context.protocol.substr(0, context.protocol.length - 1));
                    link = Utils.replaceLink(link, adapter, instance, context);
                } else if (placeholder[0] === '%instance%') {
                    link = link.replace('%instance%', instance);
                    link = Utils.replaceLink(link, adapter, instance, context);
                } else {
                    // remove %%
                    placeholder = placeholder[0].replace(/%/g, '');

                    if (placeholder.match(/^native_/)) {
                        placeholder = placeholder.substring(7);
                    }
                    // like web.0_port
                    let parts;
                    if (placeholder.indexOf('_') === -1) {
                        parts = [adapter + '.' + instance, placeholder];
                    } else {
                        parts = placeholder.split('_');
                        // add .0 if not defined
                        if (!parts[0].match(/\.[0-9]+$/)) {
                            parts[0] += '.0';
                        }
                    }

                    if (parts[1] === 'protocol') {
                        parts[1] = 'secure';
                    }

                    try {
                        const object = context.objects['system.adapter.' + parts[0]];

                        if (link && object) {
                            if (parts[1] === 'secure') {
                                link = link.replace('%' + placeholder + '%', object.native[parts[1]] ? 'https' : 'http');
                            } else {
                                if (link.indexOf('%' + placeholder + '%') === -1) {
                                    link = link.replace('%native_' + placeholder + '%', object.native[parts[1]]);
                                } else {
                                    link = link.replace('%' + placeholder + '%', object.native[parts[1]]);
                                }
                            }
                        } else {
                            console.log('Cannot get link ' + parts[1]);
                            link = link.replace('%' + placeholder + '%', '');
                        }

                    } catch(error) {
                        console.log(error);
                    }

                    link = Utils.replaceLink(link, adapter, instance, context);
                }
            }
        }

        return link;
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