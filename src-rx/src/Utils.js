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

        const units = ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        let u = -1;

        do {
            bytes /= 1024;
            ++u;
        } while (Math.abs(bytes) >= 1024 && u < units.length - 1);

        return bytes.toFixed(1) + ' ' + units[u];
    }
}

export default Utils;