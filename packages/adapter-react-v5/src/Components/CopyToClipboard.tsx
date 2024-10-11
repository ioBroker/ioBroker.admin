/*
MIT License

Copyright (c) 2017 sudodoki <smd.deluzion@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
// https://github.com/sudodoki/toggle-selection/blob/gh-pages/index.js
function deselectCurrent() {
    const selection = document.getSelection();
    if (!selection?.rangeCount) {
        return () => {};
    }
    let active = document.activeElement as HTMLElement | null;

    const ranges: Range[] = [];
    for (let i = 0; i < selection.rangeCount; i++) {
        ranges.push(selection.getRangeAt(i));
    }

    switch (
        active?.tagName.toUpperCase() // .toUpperCase handles XHTML
    ) {
        case 'INPUT':
        case 'TEXTAREA':
            active.blur();
            break;

        default:
            active = null;
            break;
    }

    selection.removeAllRanges();
    return () => {
        selection.type === 'Caret' && selection.removeAllRanges();

        if (!selection.rangeCount) {
            ranges.forEach(range => selection.addRange(range));
        }

        active && active.focus();
    };
}

// https://github.com/sudodoki/copy-to-clipboard/blob/master/index.js

const clipboardToIE11Formatting = {
    'text/plain': 'Text',
    'text/html': 'Url',
    default: 'Text',
};

const defaultMessage = 'Copy to clipboard: #{key}, Enter';

function format(message: string): string {
    const copyKey = `${/mac os x/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'}+C`;
    return message.replace(/#{\s*key\s*}/g, copyKey);
}

/**
 * Copy text to clipboard
 *
 * @param text Text to copy
 * @param options Options
 * @param options.debug Debug mode
 * @param options.format Format of the data
 * @param options.message Message to show in prompt
 */
export function copy(
    text: string,
    options?: { debug?: boolean; format?: 'text/plain' | 'text/html'; message?: string },
): boolean {
    let reselectPrevious;
    let range;
    let selection;
    let mark;
    let success = false;
    options = options || {};
    const debug = options.debug || false;
    try {
        reselectPrevious = deselectCurrent();

        range = document.createRange();
        selection = document.getSelection();

        mark = document.createElement('span');
        mark.textContent = text;
        // avoid screen readers from reading out loud the text
        mark.ariaHidden = 'true';
        // reset user styles for span element
        mark.style.all = 'unset';
        // prevents scrolling to the end of the page
        mark.style.position = 'fixed';
        mark.style.top = '0px';
        mark.style.clip = 'rect(0, 0, 0, 0)';
        // used to preserve spaces and line breaks
        mark.style.whiteSpace = 'pre';
        // do not inherit user-select (it may be `none`)
        mark.style.userSelect = 'text';
        mark.addEventListener('copy', e => {
            e.stopPropagation();
            if (options?.format) {
                e.preventDefault();
                if (typeof e.clipboardData === 'undefined') {
                    // IE 11
                    debug && console.warn('unable to use e.clipboardData');
                    debug && console.warn('trying IE specific stuff');
                    (window as any).clipboardData?.clearData();
                    const _format = clipboardToIE11Formatting[options.format] || clipboardToIE11Formatting.default;
                    (window as any).clipboardData?.setData(_format, text);
                } else {
                    // all other browsers
                    e.clipboardData?.clearData();
                    e.clipboardData?.setData(options.format, text);
                }
            }
        });

        document.body.appendChild(mark);

        range.selectNodeContents(mark);
        selection?.addRange(range);

        // there is no alternative for execCommand
        const successful = document.execCommand('copy');
        if (!successful) {
            throw new Error('copy command was unsuccessful');
        }
        success = true;
    } catch (err) {
        debug && console.error('unable to copy using execCommand: ', err);
        debug && console.warn('trying IE specific stuff');
        try {
            (window as any).clipboardData.setData(options.format || 'text', text);
            // options.onCopy && options.onCopy((window as any).clipboardData);
            success = true;
        } catch (error) {
            debug && console.error('unable to copy using clipboardData: ', error);
            debug && console.error('falling back to prompt');
            const message = format('message' in options ? options.message || '' : defaultMessage);
            window.prompt(message, text);
        }
    } finally {
        if (selection) {
            if (range && typeof selection.removeRange === 'function') {
                selection.removeRange(range);
            } else {
                selection.removeAllRanges();
            }
        }

        if (mark) {
            document.body.removeChild(mark);
        }
        reselectPrevious && reselectPrevious();
    }

    return success;
}
