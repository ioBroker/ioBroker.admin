/**
 * Copyright 2018-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 * */
import { Utils } from '@iobroker/adapter-react-v5';

export const EXPAND_LANGUAGE = {
    en: 'english',
    de: 'german',
    ru: 'russian',
    'zh-cn': 'chinese (simplified)',
};

export interface MarkdownEntry {
    version: string;
    date?: string;
    lines: ({ author?: string; line: string } | string)[];
}

export interface MarkdownHeader {
    title?: string;
    authors?: string;
    affiliate?: string;
    translatedFrom?: keyof typeof EXPAND_LANGUAGE;
    readme?: string;
    license?: string;
    logo?: string;
    description?: string;
    lastChanged?: string;
    editLink?: string;
    adapter?: string;
}

export interface MarkdownContent {
    title: string;
    level: number;
    external: boolean;
    link: string;
    href: string;
    children?: string[];
}

export interface MarkdownPart {
    lines: string[];
    type: string;
}

class MDUtils {
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

        return header.title;
    }

    static extractHeader(text: string): {
        header: MarkdownHeader;
        body: string;
    } {
        const attrs: MarkdownHeader = {};
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
                            (attrs as Record<string, string | boolean | number>)[attr] = true;
                        } else if (val === 'false') {
                            (attrs as Record<string, string | boolean | number>)[attr] = false;
                        } else if (parseFloat(val).toString() === val) {
                            (attrs as Record<string, string | boolean | number>)[attr] = parseFloat(val);
                        } else {
                            (attrs as Record<string, string | boolean | number>)[attr] = val;
                        }
                    } else {
                        (attrs as Record<string, string | boolean | number>)[line.trim()] = true;
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
        Utils.copyToClipboard(text, e);
    }

    static decorateText(text: string, header: MarkdownHeader, path?: string) {
        path = path || '';

        const { body, license, changelog } = MDUtils.extractLicenseAndChangelog(text, true);

        const lines = body.split('\n');
        const content: Record<string, MarkdownContent> = {};
        const current: MarkdownContent[] = [null, null, null, null];

        const parts: {
            type: 'chapter' | 'table' | '@@@' | 'code' | 'warn' | 'alarm' | 'notice' | 'p';
            lines: string[];
        }[] = [];
        // delete empty starting and ending lines
        while (lines.length && !lines[0].trim()) {
            lines.shift();
        }
        while (lines.length && !lines[lines.length - 1].trim()) {
            lines.pop();
        }

        let title;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trimRight();
            let last = parts.length - 1;

            if (line.startsWith('=========')) {
                // ignore it
            } else if (line.match(/^<h1>.+<\/h1>/)) {
                // <h1><img src="ru/adapterref/iobroker.linkeddevices/admin/linkeddevices.png" width="32" /> ioBroker.linkeddevices</h1>
                // skip
            } else if (line.match(/^# /)) {
                const cont = MDUtils.findTitle(line, -1, path);
                title = cont.title;
            } else if (line.trim().startsWith('|')) {
                if (!parts[last] || parts[last].type !== 'table') {
                    parts.push({ type: 'table', lines: [line] });
                } else {
                    parts[last].lines.push(line);
                }
            } else if (line.match(/^##+ /)) {
                parts.push({ lines: [line], type: 'chapter' });
                last++;
                let level = line.split('#').length - 3;
                const cont = MDUtils.findTitle(line, level, path);
                content[cont.href] = cont;
                current[level] = cont;
                level++;
                while (current[level] !== undefined) {
                    level = null;
                }
            } else if (line.startsWith('@@@')) {
                line = line.substring(3).trim();
                parts.push({ lines: [line], type: '@@@' });
                last++;
                if (line.trim().endsWith('@@@')) {
                    parts[last].lines[0] = line.substring(0, line.length - 3);
                } else {
                    while (i + 1 < lines.length && !lines[i + 1].trim().endsWith('@@@')) {
                        parts[last].lines.push(lines[i + 1].trim());
                        i++;
                    }
                }
            } else if (line.trim().startsWith('```')) {
                parts.push({ lines: [line], type: 'code' });
                last++;
                if (!line.substring(3).trim().endsWith('```')) {
                    while (i + 1 < lines.length && !lines[i + 1].trim().endsWith('```')) {
                        parts[last].lines.push(lines[i + 1]);
                        i++;
                    }
                    parts[last].lines.push(lines[i + 1]);
                    i++;
                }
            } else if (line.startsWith('?> ') || line.startsWith('!> ')) {
                parts.push({ lines: [line.substring(3)], type: line.startsWith('?>') ? 'warn' : 'alarm' });
                last++;
                while (i + 1 < lines.length && lines[i + 1].trim()) {
                    parts[last].lines.push(lines[i + 1]);
                    i++;
                }
            } else if (line.startsWith('> ')) {
                parts.push({ lines: [line.substring(2)], type: 'notice' });
                last++;
                while (i + 1 < lines.length && lines[i + 1].trim()) {
                    parts[last].lines.push(lines[i + 1]);
                    i++;
                }
            } else if (line.trim()) {
                parts.push({ lines: [line], type: 'p' });
                last++;
                while (
                    i + 1 < lines.length && // lines[i + 1].trim() &&
                    //! lines[i + 1].trim().match(/^>\s|^\?>\s|^!>\s|^@@@|^#+|^====|^\|/)) {
                    !lines[i + 1].trim().match(/^```|^>\s|^\?>\s|^!>\s|^@@@|^#+|^====|^\|/)
                ) {
                    parts[last].lines.push(lines[i + 1].trimRight());
                    i++;
                }
            }
        }

        return {
            parts,
            content,
            title,
            changeLog: changelog,
            license,
        };
    }

    static extractLicenseAndChangelog(text: string, ignoreHeaders?: boolean) {
        const lines = (text || '').trim().split('\n');
        const changelog: string[] = [];
        let changelogA = false;
        const license: string[] = [];
        let licenseA = false;
        const newLines: string[] = [];
        lines.forEach(line => {
            if (line.match(/#+\sChangelog/i)) {
                if (!ignoreHeaders) {
                    changelog.push('## Changelog');
                }
                changelogA = true;
                licenseA = false;
            } else if (line.match(/#+\sLicense/i)) {
                if (!ignoreHeaders) {
                    license.push('## License');
                }
                changelogA = false;
                licenseA = true;
            } else if (line.match(/^# |^## /)) {
                // if some other chapter detected
                newLines.push(line);
                changelogA = false;
                licenseA = false;
            } else if (licenseA) {
                license.push(line);
            } else if (changelogA) {
                changelog.push(line);
            } else {
                newLines.push(line);
            }
        });
        while (newLines.length && !newLines[0].trim()) newLines.shift();
        while (newLines.length && !newLines[newLines.length - 1].trim()) newLines.pop();

        while (changelog.length && !changelog[0].trim()) changelog.shift();
        while (changelog.length && !changelog[changelog.length - 1].trim()) changelog.pop();

        while (license.length && !license[0].trim()) license.shift();
        while (license.length && !license[license.length - 1].trim()) license.pop();

        return {
            body: newLines.join('\n'),
            license: license.join('\n'),
            changelog: changelog.join('\n'),
        };
    }

    static findTitleFromH1() {
        throw new Error('not implemented');
    }

    static findTitle(line: string, level: number, path: string): MarkdownContent {
        let name = line
            .substring(level + 3)
            .trim()
            // remove bold and italic modifier
            .replace(/^\*|\*$/g, '')
            .replace(/^\*|\*$/g, '')
            .replace(/^\*|\*$/g, '');

        const t = MDUtils.text2link(name);

        // detect <a id="Systemeinstellungen"></a>9.) Systemeinstellungen
        const m = name.match(/<a [^>]*>(.*)<\/a>/);
        if (m) {
            name = name.replace(m[0], m[1]).trim();
        }

        const link = MDUtils.text2docLink(name, path);

        return {
            level,
            title: link ? link.name : name,
            link: link ? link.link : t,
            href: t,
            external: !!link,
        };
    }

    static text2docLink(text: string, path: string): { link: string; name: string } {
        const m = text.match(/\[([^\]]*)]\(([^)]*)\)/);
        if (m) {
            const parts = path.split('/');
            parts.pop();
            return { link: `${parts.join('/')}/${m[2]}`, name: m[1] };
        }
        return null;
    }
}

export default MDUtils;
