/**
 * Copyright 2018-2023 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import { copy } from './CopyToClipboard';

export class MDUtils {
    static text2link(text: string): string {
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

    static openLink(url: string, target?: string): void {
        // replace IPv6 Address with [ipv6]:port
        url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');

        if (target === 'this') {
            window.location.href = url;
        } else {
            window.open(url, target || '_blank');
        }
    }

    static getTitle(text: string): string {
        const result = MDUtils.extractHeader(text);
        let body = result.body;
        const header = result.header;
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

        return header.title.toString();
    }

    static extractHeader(text: string): { header: Record<string, string | boolean | number>; body: string } {
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
                        let val: string = line.substring(pos_ + 1).trim();
                        val = val.replace(/^['"]|['"]$/g, '');
                        if (val === 'true') {
                            attrs[attr] = true;
                        } else if (val === 'false') {
                            attrs[attr] = false;
                        } else if (parseFloat(val).toString() === val) {
                            attrs[attr] = parseFloat(val);
                        } else {
                            attrs[attr] = val;
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

    static removeDocsify(text: string): string {
        const m = text.match(/{docsify-[^}]*}/g);
        if (m) {
            m.forEach(doc => (text = text.replace(doc, '')));
        }
        return text;
    }

    static onCopy(e: Event | null, text: string): void {
        copy(text);
        e && e.stopPropagation();
        e && e.preventDefault();
    }
}
