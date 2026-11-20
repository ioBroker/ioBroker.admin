import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography } from '@mui/material';

/**
 * What a line of a change log may contain. The news are written as Markdown - code in backticks,
 * emphasis, now and then a link - but a heading, a list or a table would tear the dialog apart, so
 * those are reduced to their text.
 */
const INLINE_ELEMENTS = ['p', 'strong', 'em', 'del', 'code', 'a', 'br'];

/**
 * Take the list marker off a line of the news - `* ` or `- ` with the space that makes it one.
 *
 * Only together with that space: `**Fixed**` starts with an asterisk as well, and taking that one
 * away would leave a broken emphasis behind.
 *
 * @param line one line of the news, as it came from the repository
 */
export function stripNewsMarker(line: string): string {
    return line.replace(/^[*-]\s+/, '');
}

/**
 * The text of the news of one version in a language: a translated object or, in old repositories, a
 * plain string.
 *
 * @param entry news of one version as the repository has them
 * @param lang language of the GUI
 * @param noTranslation show the English text, as the user switched the translation off
 */
export function getNewsText(
    entry: ioBroker.Translated | string | undefined | null,
    lang: ioBroker.Languages,
    noTranslation?: boolean,
): string {
    if (!entry) {
        return '';
    }
    if (typeof entry === 'string') {
        return entry;
    }
    return (noTranslation ? entry.en : entry[lang] || entry.en) || '';
}

/**
 * The lines of the news of one version, without list markers, HTML comments and empty lines.
 *
 * @param text news of one version, lines separated by `\n`
 */
export function splitNews(text: string): string[] {
    return (text || '')
        .split('\n')
        .map(line =>
            stripNewsMarker(line.trim())
                .replace(/<!--[^>]*->/g, '')
                .replace(/<! -[^>]*->/g, '')
                .replace(/<!--|--!?>/g, '')
                .trim(),
        )
        .filter(line => !!line);
}

/**
 * One entry of the news of an adapter, rendered as the Markdown it is written in.
 *
 * Raw HTML is not rendered - the news come from the repository and are not trusted with markup -
 * and a link opens in a new tab, so the update dialog stays where it is.
 *
 * @param props the line
 * @param props.text one line of the news, already without its list marker
 */
export default function NewsLine(props: { text: string }): React.JSX.Element {
    return (
        <Typography
            component="div"
            variant="body2"
            sx={{
                '& code': {
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    px: 0.5,
                    borderRadius: 0.5,
                    bgcolor: 'action.hover',
                },
                '& a': { color: 'primary.main' },
            }}
        >
            {'• '}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                allowedElements={INLINE_ELEMENTS}
                unwrapDisallowed
                components={{
                    // stays on the line of the bullet instead of opening a paragraph of its own
                    p: ({ children }) => <>{children}</>,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {props.text}
            </ReactMarkdown>
        </Typography>
    );
}
