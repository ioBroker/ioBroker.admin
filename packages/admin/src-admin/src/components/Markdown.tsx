/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { withStyles, type Styles } from '@mui/styles';
import MarkdownView from 'react-showdown';
import semver from 'semver';

import {
    Paper,
    Accordion,
    AccordionSummary,
    AccordionActions,
    List,
    ListItem,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Snackbar,
} from '@mui/material';

import {
    MdClose as IconClose,
    MdMenu as IconMenu, MdExpandMore as IconExpandMore,
} from 'react-icons/md';

import { FaGithub as IconGithub } from 'react-icons/fa';

import {
    type AdminConnection, type IobTheme, type ThemeName,
    I18n, Loader, Utils,
} from '@iobroker/adapter-react-v5';

import IconGlobe from '../assets/globe.svg';
import IconLink from '../assets/link.svg';

import MDUtils, {
    EXPAND_LANGUAGE,
    type MarkdownContent,
    type MarkdownEntry,
    type MarkdownHeader,
    type MarkdownPart,
} from './MDUtils';
// import Page404 from '@iobroker/adapter-react-v5/Components/404';

const styles: Styles<IobTheme, any> = theme => ({
    root: {
        width: 'calc(100% - 10px)',
        maxWidth: 1400,
        margin: 5,
        '& .md-link': {
            display: 'inline-block',
        },
        '& h2': {
            width: '100%',
            textAlign: 'left',
            paddingBottom: 10,
            borderBottom: '1px solid lightgray',
        },
        '& hr': {
            borderWidth: '0 0 1px 0',
        },
        '& a': {
            color: 'inherit',
        },
        '& pre': {
            background: '#e3e3e3',
        },
        '& code': {
            margin: '0 0.15em',
            padding: '0.125em 0.4em',
            borderRadius: 2,
            background: '#e3e3e3',
            color: '#000000',
            whiteSpace: 'pre',
        },
        '& img': {
            maxWidth: '100%',
        },
    },
    logoImage: {
        width: 64,
        verticalAlign: 'middle',
    },
    infoEdit: {
        float: 'right',
        textDecoration: 'none',
        color: 'gray',
    },
    infoEditLocal: {
        float: 'right',
        textDecoration: 'none',
        marginRight: 15,
        cursor: 'pointer',
        display: 'inline-block',
    },
    adapterCard: {
        marginBottom: 0,
        marginTop: 0,
    },
    badgesDetails: {
        display: 'block',
        '& img': {
            marginRight: 5,
        },
    },
    titleText: {
        display: 'inline-block',
        marginLeft: 10,
    },
    adapterCardAttr:{
        fontWeight: 'bold',
        width: 150,
        display: 'inline-block',
    },
    adapterCardListItem: {
        paddingTop: 3,
        paddingBottom: 3,
    },
    description: {
        fontStyle: 'italic',
    },
    contentDiv: {
        position: 'fixed',
        width: '20%',
        minWidth: 200,
        overflowX: 'hidden',
        opacity: 0.8,
        top: 60,
        right: 20,
        background: theme.palette.mode === 'dark' ? '#111111' : '#EEEEEE',
        maxHeight: 'calc(100% - 70px)',
    },
    contentDivClosed: {
        position: 'fixed',
        opacity: 0.8,
        top: 60,
        right: 20,
        width: 25,
        height: 25,
        cursor: 'pointer',
    },
    contentClose: {
        position: 'fixed',
        top: 60 + 5,
        right: 20 + 5,
        cursor: 'pointer',

        '&:hover': {
            color: '#111111',
        },
    },
    contentLinks: {
        cursor: 'pointer',
        '&:hover': {
            color: theme.palette.mode === 'dark' ? '#AAA' : '#666',
        },
    },
    headerTranslated: {
        borderColor: '#009c4f',
        borderWidth: '0 0 0 3px',
        padding: 10,
        marginTop: 5,
        marginBottom: 5,
        borderStyle: 'solid',
        background: '#bdded5',
        cursor: 'pointer',
        '&:before': {
            content: `url(${IconGlobe})`,
            marginRight: 10,
            color: '#000000',
            height: 20,
            width: 20,
        },
    },
    license: {
        paddingLeft: 10,
        fontWeight: 'bold',
        marginTop: 0,
        paddingTop: 1,
    },
    mdLink: {
        cursor: 'pointer',
        textDecoration: 'underline',
        '&:after': {
            // content: '"🔗"',
            content: `url(${IconLink})`,
            width: 16,
            height: 16,
            opacity: 0.7,
            fontSize: 14,
            // marginLeft: 5
        },
    },
    mdHeaderLink: {
        textDecoration: 'none',
        '&:after': {
            content: '"🔗"',
            width: 16,
            height: 16,
            opacity: 0,
            fontSize: 14,
            // marginLeft: 5
        },
        '&:hover:after': {
            opacity: 0.7,
        },
    },
    info: {
        paddingTop: 10,
        paddingBottom: 10,
    },
    email: {
        fontStyle: 'italic',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    name: {
        fontStyle: 'italic',
    },

    table: {
        width: 'auto',
    },
    tableHead: {
        background: '#555555',
    },
    tableRowHead: {
        height: 24,
    },
    tableCellHead: {
        color: '#FFFFFF',
        padding: '3px 10px',
        border: '1px solid rgba(224, 224, 224, 1)',
        margin: 0,
        '&>p': {
            margin: 0,
        },
    },
    tableBody: {

    },
    tableRow: {
        height: 24,
    },
    tableCell: {
        padding: '3px 10px',
        margin: 0,
        border: '1px solid rgba(224, 224, 224, 1)',
        '&>p': {
            margin: 0,
        },
    },

    summary: {
        transition: 'background 0.5s, color: 0.5s',
        fontSize: 20,
        backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#DDD',
    },
    summaryExpanded: {
        // fontWeight: 'bold',
    },

    warn: {
        borderColor: '#0b87da',
        borderWidth: '0 0 0 3px',
        padding: 10,
        marginTop: 5,
        marginBottom: 5,
        borderStyle: 'solid',
        background: '#eff6fb',
        '&:before': {
            content: '"⚠"',
            // borderRadius: '50%',
            // background: '#008aff',
        },
    },
    alarm: {
        borderColor: '#da0b50',
        borderWidth: '0 0 0 3px',
        padding: 10,
        marginTop: 5,
        marginBottom: 5,
        borderStyle: 'solid',
        background: '#fbeff3',
        '&:before': {
            content: '"⚠"',
            // borderRadius: '50%',
            // background: '#008aff',
        },
    },
    notice: {
        borderColor: '#9c989b',
        borderWidth: '0 0 0 3px',
        padding: 10,
        marginTop: 5,
        marginBottom: 5,
        borderStyle: 'solid',
        background: '#dedede',
        '&:before': {
            content: '"✋"',
            // borderRadius: '50%',
            // background: '#dedede',
        },
    },
    todo: {
        borderColor: '#00769c',
        borderWidth: '0 0 0 3px',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 5,
        marginBottom: 5,
        borderStyle: 'solid',
        background: '#c4d2de',
        /* &:before': {
            content: '"✋"',
            //borderRadius: '50%',
            //background: '#dedede',
        } */
    },
    paragraph: {

    },

    changeLog: {
        display: 'block',
        width: '100%',
    },
    changeLogDiv: {
        display: 'block',
        paddingBottom: 16,
        '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#DDD',
        },
        width: '100%',
    },
    changeLogVersion: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    changeLogDate: {
        fontSize: 16,
        fontStyle: 'italic',
        marginLeft: 8,
        opacity: 0.7,
    },
    changeLogLine: {
        display: 'block',
        fontSize: 14,
        marginLeft: 8,
        '&:before': {
            content: '"• "',
        },
    },
    changeLogUL: {
        paddingLeft: 8,
        marginTop: 4,
    },
    changeLogAuthor: {
        fontStyle: 'italic',
        fontWeight: 'bold',
        marginRight: 8,
    },
    changeLogLineText: {

    },

    changeLogAccordion: {
        justifyContent: 'flex-start',
    },
});

const CONVERTER_OPTIONS = {
    emoji: true,
    underline: true,
    strikethrough: true,
    simplifiedAutoLink: true,
    parseImgDimensions: true,
    splitAdjacentBlockquotes: true,
    openLinksInNewWindow: true,
    backslashEscapesHTMLTags: true,
};

const ADAPTER_CARD = ['version', 'authors', 'keywords', 'mode', 'materialize', 'compact'];

interface MarkdownProps {
    path: string;
    text: string;
    language: ioBroker.Languages;
    themeName: ThemeName;
    classes: Record<string, string>;
    onNavigate: (id: string, link?: string) => void;
    socket: AdminConnection;
    adapter: string;
    link: string;
    mobile: boolean;
    affiliates: React.FC<any>;
    currentHost: string;
    className: string;
}

interface MarkdownState {
    parts: MarkdownPart[];
    title: string;
    loadTimeout: boolean;
    header: MarkdownHeader;
    content: Record<string, MarkdownContent>;
    license: string;
    changeLog: string | Record<string, MarkdownEntry>;
    tooltip: string;
    text: string;
    notFound: boolean;
    affiliate: any;
    adapterNews: Record<string, ioBroker.StringOrTranslated>;
    hideContent: boolean;
}

class Markdown extends Component<MarkdownProps, MarkdownState> {
    private readonly contentRef: React.RefObject<HTMLDivElement>;

    private mounted: boolean;

    private readonly customLink: ({ text, link }: { text: string; link: string }) => React.JSX.Element;

    private readonly customH: ({
        text, id, level, prefix,
    }: { text: string; id: string; level: string; prefix: string }) => React.JSX.Element;

    private readonly meta: () => string;

    private readonly link: () => React.JSX.Element;

    constructor(props: MarkdownProps) {
        super(props);
        // load page
        this.state = {
            parts: [],
            title: '',
            loadTimeout: false,
            header: {},
            content: {},
            license: '',
            changeLog: '',
            tooltip: '',
            text: this.props.text || '',
            notFound: false,
            affiliate: null,
            adapterNews: null,
            hideContent: window.localStorage ? (window._localStorage || window.localStorage).getItem('Docs.hideContent') === 'true' : false,
        };

        this.mounted = false;

        if (!this.state.text) {
            this.load();

            // Give 300ms to load the page. After that show the loading indicator.
            setTimeout(() => !this.state.parts.length && this.setState({ loadTimeout: true }), 300);
        } else {
            this.parseText();
        }

        this.contentRef = React.createRef();

        this.customLink = ({ text, link }) =>
            <a
                className={`${this.props.classes.mdLink} md-link`}
                onClick={() => {
                    if (link) {
                        if (link.startsWith('#')) {
                            Markdown.onNavigate(MDUtils.text2link(link.substring(1)));
                        } else {
                            let href = link;
                            if (!href.match(/^https?:\/\//)) {
                                const parts = (this.props.path || '').split('/');
                                // const fileName = parts.pop();
                                const prefix = `${parts.join('/')}/`;

                                href = prefix + link;
                            }

                            Markdown.onNavigate(null, href);
                        }
                    }
                }}
                title={link}
            >
                {text}
            </a>;

        /*
        if (reactObj && (reactObj.type === 'h1' || reactObj.type === 'h2' || reactObj.type === 'h3' || reactObj.type === 'h3')) {
            reactObj.props.children[0] = (<span>{reactObj.props.children[0]}<a
                href={prefix + '?' + reactObj.props.id}
                className={this.props.classes.mdHeaderLink + ' md-h-link'}>
            </a></span>);
        }
         */
        this.customH = ({
            text, id, level, prefix,
        }) => {
            const _level = parseInt(level, 10);

            if (_level === 1) {
                return <h1 id={id}>
                    <span>{text}</span>
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
                </h1>;
            } if (_level === 2) {
                return <h2 id={id}>
                    <span>{text}</span>
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
                </h2>;
            } if (_level === 3) {
                return <h3 id={id}>
                    <span>{text}</span>
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
                </h3>;
            } if (_level === 4) {
                return <h4 id={id}>
                    <span>{text}</span>
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
                </h4>;
            } if (_level === 5) {
                return <h5 id={id}>
                    <span>{text}</span>
                    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
                </h5>;
            }
            return <h6 id={id}>
                <span>{text}</span>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <a href={`${prefix}?${id}`} className={`${this.props.classes.mdHeaderLink} md-h-link`} />
            </h6>;
        };
        this.meta = () => 'meta'; // text, id, level, prefix,

        this.link = () => <div>linkAAAAA</div>; // text, id, level, prefix,
    }

    componentDidMount() {
        this.mounted = true;
        this.state.text && this.parseText(this.state.text);
        this.props.socket?.getRepository(this.props.currentHost, { })
            .then(repo => this.setState({ adapterNews: repo[this.props.adapter]?.news }));
    }

    UNSAFE_componentWillReceiveProps(nextProps: MarkdownProps/* , nextContext */) {
        if (this.props.path !== nextProps.path) {
            this.mounted && this.setState({ notFound: false, parts: [] });
            this.load(nextProps.path);
        } else if (this.props.text !== nextProps.text) {
            this.setState({ text: nextProps.text });
            if (!nextProps.text) {
                if (this.props.path !== nextProps.path) {
                    this.mounted && this.setState({ notFound: false, parts: [] });
                    this.load(nextProps.path);
                }
            } else {
                this.mounted && this.setState({ text: nextProps.text }, () =>
                    this.parseText());
            }
        } else
            if (this.props.language !== nextProps.language) {
                this.mounted && this.setState({ notFound: false, parts: [] });
                this.load(null, nextProps.language);
            }
    }

    /* onHashChange(location) {
        location = location || Router.getLocation();
        if (location.chapter) {
            const el = window.document.getElementById(location.chapter);
            el && el.scrollIntoView(true);
        }
    } */

    static onNavigate(id: string, link?: string) {
        if (link && link.match(/^https?:\/\//)) {
            Utils.openLink(link);
        } else if (id) {
            const el = window.document.getElementById(id) || window.document.getElementById(id.replace('nbsp', ''));
            if (el) {
                el.scrollIntoView(true);
            }
        } else if (link) {
            // if relative path
            if (!link.startsWith('#')) {
                // ../../download
                /* const ppp = link.replace(this.props.path + '/', '').split('#');
                let _link = ppp[1];
                let _path = ppp[0].replace(/\.MD$/, '.md');
                if (!_path.endsWith('.md')) {
                    _path += '.md';
                }
                const location = Router.getLocation();

                if (_path.startsWith('.')) {
                    const parts = _path.split('/');
                    const locParts = location.page.split('/');
                    locParts.pop();
                    parts.forEach(part => {
                        if (part === '.') return;
                        if (part === '..') {
                            locParts.pop();
                            return;
                        }
                        locParts.push(part);
                    });
                    _path = locParts.join('/')
                }

                this.props.onNavigate(null, this.props.rootPath || location.tab, _path, _link); */
            } else if (link) {
                // this.props.onNavigate(null, null, link);
                link = link.replace(/^#/, '');
                const el = window.document.getElementById(link) || window.document.getElementById(link.replace('nbsp', ''));
                if (el) {
                    el.scrollIntoView(true);
                }
            }
        }
    }

    static parseChangeLog(changeLog: string) {
        const lines = changeLog.split('\n');
        const entries: Record<string, MarkdownEntry> = {};
        let oneEntry: MarkdownEntry;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith('##')) {
                if (oneEntry) {
                    entries[oneEntry.version] = oneEntry;
                    oneEntry = null;
                }
                // ### 3.0.5 (2020-10-30) or ### 3.0.5 [2020-10-30] or ### 3.0.5
                const [version, date] = line.replace(/^#+\s?/, '').split(/[\s([]+/);
                if (version) {
                    oneEntry = { lines: [] } as MarkdownEntry;
                    oneEntry.version = version.trim();
                    oneEntry.date = (date || '').trim().replace(/\)/, '');
                }
            } else if (line.trim() && oneEntry) {
                // extract author
                // *(Denis Haev) if group
                line = line.replace(/^[+*]+\s?/, '').trim();
                if (line.startsWith('(') && line.includes(')')) {
                    const p = line.split(')');
                    const author = p[0].replace('(', '');
                    line = line.replace(`(${author})`, '').trim();
                    oneEntry.lines.push({ author, line });
                } else if (oneEntry) {
                    oneEntry.lines.push(line);
                }
            }
        }

        if (oneEntry) {
            entries[oneEntry.version] = oneEntry;
        }

        return entries;
    }

    parseText(text?: string) {
        text = text || this.state.text || '';

        if (!text || text.startsWith('<!DOCTYPE html>')) {
            // page isn't found
            this.setState({ notFound: true });
            return;
        }

        const {
            header,
            parts,
            content,
            license,
            changeLog,
            title,
        } = this.format(text);
        const _title = header.title || title || MDUtils.getTitle(text);
        /* if (_title) {
            window.document.title = _title;
        } else if (title) {
            _title = title;
            window.document.title = title;
        } */
        let affiliate = null;
        if (header.affiliate) {
            try {
                affiliate = JSON.parse(header.affiliate);
            } catch (e) {
                console.error(`Cannot parse affiliate: ${header.affiliate}`);
            }
        }

        let _changeLog: Record<string, MarkdownEntry>;
        // try to add missing news
        if (changeLog) {
            // split news
            _changeLog = Markdown.parseChangeLog(changeLog);
            if (_changeLog && typeof _changeLog === 'object' && this.state.adapterNews) {
                const lang = I18n.getLanguage();
                Object.keys(this.state.adapterNews).forEach(version => {
                    if (!_changeLog[version]) {
                        let news = this.state.adapterNews[version];
                        if (typeof news === 'object') {
                            news = news[lang] || news.en || '';
                        }

                        _changeLog[version] = { version, lines: news.split('\\n') };
                    }
                });
            }
        }

        this.mounted && this.setState({
            affiliate,
            notFound: false,
            parts,
            header,
            loadTimeout: false,
            content,
            license,
            changeLog: _changeLog || changeLog,
            title: _title,
        });

        // this.onHashChange && setTimeout(() => this.onHashChange(), 200);
    }

    load(path?: string, language?: string) {
        path = path || this.props.path;
        language = language || this.props.language;
        if (path && language) {
            fetch(`${language}${path[0] === '/' ? path : `/${path}`}`)
                .then(res => res.text())
                .then(text => this.parseText(text));
        }
    }

    format(text: string): {
        header: MarkdownHeader;
        parts: MarkdownPart[];
        content: Record<string, MarkdownContent>;
        license: string;
        changeLog: string;
        title: string;
    } {
        text = (text || '').trim();
        const result = MDUtils.extractHeader(text);
        const header = result.header as MarkdownHeader;
        let body = result.body;

        if (body.startsWith('# ')) {
            // there is no header, and readme starts with
            // ![Logo](admin/iot.png)
            // # ioBroker IoT Adapter
        }

        // remove comments like <!-- -->
        body = body.replace(/\r\n|\n/g, '§$§$');
        body = body.replace(/<!--[^>]*-->/gm, '\n');
        body = body.replace(/<! -[^>]* ->/gm, '\n'); // translator makes it wrong
        body = body.replace(/§\$§\$/g, '\n');
        body = body.replace(/\[\*\*\*\s(.+)\s\*\*\*]/g, '[***$1***]');
        body = body.replace(/\[\*\*\s(.+)\s\*\*]/g, '[**$1**]');
        body = body.replace(/\[\*\s(.+)\s\*]/g, '[*$1*]');
        body = body.replace(/\*\*\*\s(.+)\s\*\*\*/g, '***$1***');
        body = body.replace(/\*\*\s(.+)\s\*\*/g, '**$1**');
        body = body.replace(/\*\s(.+)\s\*/g, '*$1*');
        body = body.replace(/`` `(.+)```/g, '```$1```');

        body = MDUtils.removeDocsify(body);
        const {
            parts, content, license, changeLog, title,
        } = MDUtils.decorateText(body, header, `${this.props.path && (this.props.path[0] === '/' ? this.props.path : `/${this.props.path}`)}`);

        return {
            header,
            parts,
            content: content as Record<string, MarkdownContent>,
            license,
            changeLog,
            title,
        };
    }

    formatAuthors(text: string) {
        const parts = text.split(',').map(t => t.trim()).filter(t => t);

        const authors = [];
        for (let i = 0; i < parts.length; i++) {
            const m = parts[i].trim().match(/<([-.\w\d_@]+)>$/);
            if (m) {
                const email = m[1];
                authors.push(<span
                    key={parts[i]}
                    className={this.props.classes.email}
                    title={I18n.t('Click to copy %s', email)}
                    onClick={e => {
                        Utils.copyToClipboard(email, e as any as Event);
                        this.setState({ tooltip: I18n.t('Copied') });
                    }}
                >
                    {parts[i].replace(m[0], '').trim() + (parts.length - 1 === i ? '' : ', ')}
                </span>);
            } else {
                authors.push(<span key={parts[i]} className={this.props.classes.name}>{parts[i] + (parts.length - 1 === i ? '' : ', ')}</span>);
            }
        }

        return authors;
    }

    renderHeader() {
        const data = [];

        if (this.state.header.translatedFrom) {
            let translatedFrom = EXPAND_LANGUAGE[this.state.header.translatedFrom] || this.state.header.translatedFrom;
            // Translate language from english to actual language
            translatedFrom = I18n.t(translatedFrom);

            data.push(<div
                key="translatedFrom"
                className={this.props.classes.headerTranslated}
                onClick={() => {
                    if (this.props.onNavigate) {
                        this.props.onNavigate && this.props.onNavigate(this.state.header.translatedFrom);
                    } else {
                        // read this.props.link
                        fetch(this.props.link)
                            .then(res => res.text())
                            .then(text => this.setState({ text }, () =>
                                this.parseText()))
                            .catch(e => window.alert(`Cannot fetch "${this.props.link}": ${e}`));
                    }
                }}
                title={I18n.t('Go to original')}
            >
                {I18n.t('Translated from %s', translatedFrom)}
            </div>);
        }

        if (this.state.header.adapter) {
            data.push(<h1 key="h1">
                {[
                    this.state.header.logo ? <img key="logo" src={`https://www.iobroker.net/${this.state.header.logo}`} alt="logo" className={this.props.classes.logoImage} /> : null,
                    <div key="title" className={this.props.classes.titleText}>{this.state.header.title}</div>,
                ]}
            </h1>);
            if (this.state.header.readme) {
                const link = this.state.header.readme.replace(/blob\/master\/README.md$/, '');
                data.push(<IconButton size="large" key="github" title={I18n.t('Open repository')} onClick={() => Utils.openLink(link)}><IconGithub /></IconButton>);
            }
        }

        if (this.state.header.description) {
            data.push(<span key="description" className={this.props.classes.description}>{this.state.header.description}</span>);
        }

        if (Object.keys(this.state.header).find(attr => ADAPTER_CARD.indexOf(attr) !== -1)) {
            data.push(<Accordion key="header" className={this.props.classes.adapterCard}>
                <AccordionSummary className={this.props.classes.summary} classes={{ expanded: this.props.classes.summaryExpanded }} expandIcon={<IconExpandMore />}>{I18n.t('Information')}</AccordionSummary>
                <AccordionActions>
                    <List>
                        {ADAPTER_CARD
                            .filter(attr => Object.prototype.hasOwnProperty.call(this.state.header.hasOwnProperty, attr))
                            .map(attr => <ListItem
                                key={attr}
                                className={this.props.classes.adapterCardListItem}
                            >
                                <div className={this.props.classes.adapterCardAttr}>
                                    {I18n.t(attr)}
:
                                    {' '}
                                </div>
                                <span>{attr === 'authors' ? this.formatAuthors(this.state.header.authors) : (this.state.header as Record<string, string | number | boolean>)[attr].toString()}</span>
                            </ListItem>)}
                    </List>
                </AccordionActions>
            </Accordion>);
        }

        if (Object.keys(this.state.header).find(attr => attr.startsWith('BADGE-'))) {
            data.push(<Accordion key="header_badges" className={this.props.classes.adapterCard}>
                <AccordionSummary
                    className={this.props.classes.summary}
                    classes={{ expanded: this.props.classes.summaryExpanded }}
                    expandIcon={<IconExpandMore />}
                >
                    {I18n.t('Badges')}
                </AccordionSummary>
                <AccordionActions classes={{ root: this.props.classes.badgesDetails }}>
                    {Object.keys(this.state.header).filter(attr => attr.startsWith('BADGE-'))
                        .map((attr, i) => [
                            (this.state.header as Record<string, string>)[attr].toString().includes('nodei.co') ? <br key={`br${i}`} /> : null,
                            <img key={`img${i}`} src={(this.state.header as Record<string, string>)[attr]} alt={attr.substring(6)} />,
                        ])}
                </AccordionActions>
            </Accordion>);
        }

        return data;
    }

    renderInfo() {
        return <div className={this.props.classes.info}>
            {this.state.header.lastChanged ? [
                <span key="lastChangedTitle" className={this.props.classes.infoTitle}>
                    {I18n.t('Last changed:')}
                    {' '}
                </span>,
                <span key="lastChangedValue" className={this.props.classes.infoValue}>{this.state.header.lastChanged}</span>,
            ] : null}
        </div>;
    }

    _renderSubContent(menu: MarkdownContent) {
        return <ul>
            {menu.children?.map(item => {
                const ch   = this.state.content[item].children;
                const link = this.state.content[item].external && this.state.content[item].link;
                return <li>
                    <span onClick={() => Markdown.onNavigate(item, link)} className={this.props.classes.contentLinks}>{this.state.content[item].title}</span>
                    {ch ? this._renderSubContent(this.state.content[item]) : null}
                </li>;
            })}
        </ul>;
    }

    renderAffiliates() {
        if (!this.state.affiliate || !this.props.affiliates) {
            return null;
        }

        const Affiliates = this.props.affiliates;

        return <Affiliates
            key="affiliates"
            language={this.props.language}
            mobile={this.props.mobile}
            theme={this.props.themeName}
            data={this.state.affiliate}
        />;
    }

    onToggleContentButton() {
        this.setState({ hideContent: !this.state.hideContent });
        window.localStorage && (window._localStorage || window.localStorage).setItem('Docs.hideContent', this.state.hideContent ? 'false' : 'true');
    }

    renderContentCloseButton() {
        if (this.state.hideContent) {
            return <IconMenu className={this.props.classes.contentClose} />;
        }
        return <IconClose className={this.props.classes.contentClose} onClick={() => this.onToggleContentButton()} />;
    }

    renderContent() {
        const links = Object.keys(this.state.content);
        if (!links.length) {
            return null;
        }
        if (this.state.hideContent) {
            return <Paper className={this.props.classes.contentDivClosed} onClick={() => this.onToggleContentButton()}>
                {this.renderContentCloseButton()}
            </Paper>;
        }
        return <Paper className={this.props.classes.contentDiv}>
            {this.renderContentCloseButton()}
            <ul>
                {
                    links.map(item => {
                        const link  = this.state.content[item].external && this.state.content[item].link;
                        const level = this.state.content[item].level;
                        const   title = this.state.content[item].title.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&');

                        return <li key={title} style={{ fontSize: 16 - level * 2, paddingLeft: level * 8, fontWeight: !level ? 'bold' : 'normal' }}>
                            <span onClick={() => Markdown.onNavigate(item, link)} className={this.props.classes.contentLinks}>{title}</span>
                            {this.state.content[item].children ? this._renderSubContent(this.state.content[item]) : null}
                        </li>;
                    }).filter(e => e)
                }
            </ul>
        </Paper>;
    }

    renderLicense() {
        if (!this.state.license) {
            return null;
        }
        const CustomLink = this.customLink;
        const CustomH = this.customH;
        return <Accordion>
            <AccordionSummary
                className={this.props.classes.summary}
                classes={{ expanded: this.props.classes.summaryExpanded }}
                expandIcon={<IconExpandMore />}
            >
                {I18n.t('License')}
                {' '}
                <span className={this.props.classes.license}>
                    {' '}
                    {this.state.header.license}
                </span>
            </AccordionSummary>
            <AccordionActions>
                <MarkdownView
                    markdown={this.state.license}
                    options={CONVERTER_OPTIONS}
                    components={{ CustomLink, CustomH }}
                />
            </AccordionActions>
        </Accordion>;
    }

    renderChangeLogLines() {
        const classes = this.props.classes;

        const versions = Object.keys(this.state.changeLog);

        const pos1 = versions.indexOf('**WORK');
        let pos2;
        if (pos1 !== -1) {
            versions.splice(pos1, 1);
        } else {
            pos2 = versions.indexOf('__WORK');
            if (pos2 !== -1) {
                versions.splice(pos2, 1);
            }
        }

        try {
            versions.sort(semver.gt as any);
        } catch (e) {
            console.warn(`Cannot semver: ${e}`);
        }
        if (pos1 !== -1) {
            versions.unshift('**WORK');
        } else  if (pos2 !== -1) {
            versions.unshift('__WORK');
        }

        return <div className={classes.changeLog} key="change-log">
            {versions.map(version => {
                const item = (this.state.changeLog as Record<string, MarkdownEntry>)[version];
                if (version.includes('WORK')) {
                    version = 'WORK IN PROGRESS';
                    item.date = '';
                }
                return <div key={version} className={classes.changeLogDiv}>
                    <div className={classes.changeLogVersion}>
                        {version}
                        {item.date ? <span className={classes.changeLogDate}>{item.date }</span> : ''}
                    </div>
                    <ul className={classes.changeLogUL}>
                        {item.lines.map((line, i) => (typeof line === 'object' ?
                            <li key={i} className={classes.changeLogLine}>
                                <span className={classes.changeLogAuthor}>{line.author}</span>
                                <span className={classes.changeLogLineText}>{line.line}</span>
                            </li>
                            :
                            <li key={i} className={classes.changeLogLine}><span className={classes.changeLogLineText}>{line}</span></li>))}
                    </ul>
                </div>;
            })}
        </div>;
    }

    renderChangeLog() {
        if (!this.state.changeLog) {
            return null;
        }
        const CustomLink = this.customLink;
        const CustomH    = this.customH;
        return <Accordion>
            <AccordionSummary className={this.props.classes.summary} classes={{ expanded: this.props.classes.summaryExpanded }} expandIcon={<IconExpandMore />}>{I18n.t('Changelog')}</AccordionSummary>
            <AccordionActions classes={{ root: this.props.classes.changeLogAccordion }}>
                {typeof this.state.changeLog === 'string' ?
                    <MarkdownView markdown={this.state.changeLog} options={CONVERTER_OPTIONS} components={{ CustomLink, CustomH }} />
                    :
                    this.renderChangeLogLines()}
            </AccordionActions>
        </Accordion>;
    }

    renderSnackbar() {
        return <Snackbar
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={!!this.state.tooltip}
            autoHideDuration={6000}
            onClose={() => this.setState({ tooltip: '' })}
            message={<span id="message-id">{this.state.tooltip}</span>}
            action={[
                <IconButton
                    size="large"
                    key="close"
                    color="inherit"
                    className={this.props.classes.close}
                    onClick={() => this.setState({ tooltip: '' })}
                >
                    <IconClose />
                </IconButton>,
            ]}
        />;
    }

    replaceHref(line: string) {
        if (!line) {
            return '';
        }
        const m = line.match(/\[.*]\(#[^)]+\)/g);
        if (m) {
            m.forEach(link => {
                const pos = link.lastIndexOf('](');
                const text = link.substring(0, pos).replace(/^\[/, '');
                const href = link.substring(pos + 2).replace(/\)$/, '');
                line = line.replace(link, `<CustomLink text="${text}" link="${href}" />`);
            });
        }
        const mm = line.match(/!?\[.*]\([^)]+\)/g);
        if (mm) {
            // https://raw.githubusercontent.com/ioBroker/ioBroker.iot/master/README.md
            //                https://github.com/ioBroker/ioBroker.iot/blob/master/README.md
            const prefixHttp = this.props.link
                .substring(0, this.props.link.lastIndexOf('/'))
                .replace('https://raw.githubusercontent.com/', 'https://github.com/')
                .replace(/\/master$/, '/blob/master')
                .replace(/\/main$/, '/blob/main');

            const prefixImage = this.props.link.substring(0, this.props.link.lastIndexOf('/'));
            mm.forEach(link => {
                const isImage = link.startsWith('!');
                link = link.replace(/^!/, '');
                const pos = link.lastIndexOf('](');
                const text  = link.substring(0, pos).replace(/^\[/, '');
                const href  = link.substring(pos + 2).replace(/\)$/, '');
                if (!href.startsWith('http')) {
                    if (isImage) {
                        line = line.replace(link, `[${text}](${prefixImage}/${href})`);
                    } else {
                        // <a href="http://www.google.com" target="blank">google</a>
                        line = line.replace(link, `<a href="${prefixHttp}/${href}" target="blank">${text}</a>`);
                    }
                } else if (!isImage) {
                    line = line.replace(link, `<a href="${href}" target="blank">${text}</a>`);
                }
            });
        }
        return line;

        /* const parts = (this.props.path || '').split('/');
        // const fileName = parts.pop();
        const prefix = parts.join('/') + '/';

        if (reactObj && reactObj.props && reactObj.props.children) {
            reactObj.props.children.forEach((item, i) => {
                if (item && item.type === 'a') {
                    let link = item.props.href;
                    if (link) {
                        if (link.startsWith('#')) {
                            link = Utils.text2link(link.substring(1));
                            reactObj.props.children[i] = (<div
                                key={'link' + i}
                                className={this.props.classes.mdLink + ' md-link'}
                                title={link}
                                onClick={() => Markdown.onNavigate(link)}>
                                {item.props.children ? item.props.children[0] : ''}
                            </div>);
                        } else {
                            const oldLink = link;
                            if (!link.match(/^https?:\/\//)) {
                                link = prefix + link;
                            }

                            reactObj.props.children[i] = (<div
                                key={'link' + i}
                                className={this.props.classes.mdLink + ' md-link'}
                                title={oldLink}
                                onClick={() => Markdown.onNavigate(null, link)}>
                                {item.props.children ? item.props.children[0] : ''}
                            </div>);
                        }
                    }
                }

                if (typeof item === 'object') {
                    this.replaceHref(item);
                }
            });
        } */
    }

    static makeHeadersAsLink(line: string, prefix: string) {
        if (!line) {
            return '';
        }
        const mm = line.match(/^#+\s.+/g);
        if (mm) {
            mm.forEach(header => {
                const level = header.match(/^(#+)\s/)[1].length;
                const text = header.substring(level + 1);
                line = line.replace(header, `<CustomH text="${text}" id="${MDUtils.text2link(text)}" level="${level}" prefix="${prefix}" />`);
            });
        }
        return line;
        /* if (reactObj && (reactObj.type === 'h1' || reactObj.type === 'h2' || reactObj.type === 'h3' || reactObj.type === 'h3')) {
            reactObj.props.children[0] = (<span>{reactObj.props.children[0]}<a
                href={prefix + '?' + reactObj.props.id}
                className={this.props.classes.mdHeaderLink + ' md-h-link'}>
            </a></span>);
        } */
    }

    renderTable(lines: string[], key: string) {
        const header = lines[0].replace(/^\||\|$/g, '').split('|').map(h => h.trim());
        const CustomLink = this.customLink;
        const CustomH = this.customH;

        const rows = [];
        for (let i = 2; i < lines.length; i++) {
            const parts = lines[i].replace(/^\||\|$/g, '').split('|').map(a => a.trim());

            const cells = [];
            for (let j = 0; j < header.length; j++) {
                parts[j] = this.replaceHref(parts[j]);
                const crt = <MarkdownView markdown={parts[j] || ''} options={CONVERTER_OPTIONS} components={{ CustomLink, CustomH }} />;
                cells.push(<TableCell className={this.props.classes.tableCell} key={`cell${i}_${j}`}>{crt}</TableCell>);
            }

            rows.push(<TableRow className={this.props.classes.tableRow} key={`row${i}`}>{cells}</TableRow>);
        }
        return <Table key={`table_${key}`} size="small" className={this.props.classes.table}>
            <TableHead className={this.props.classes.tableHead}>
                <TableRow className={this.props.classes.tableRowHead}>
                    {
                        header.map((h, i) =>
                            <TableCell className={this.props.classes.tableCellHead} key={`header${i}`}>
                                <MarkdownView markdown={h} options={CONVERTER_OPTIONS} components={{ CustomLink, CustomH }} />
                            </TableCell>)
                    }
                </TableRow>
            </TableHead>
            <TableBody className={this.props.classes.tableBody}>{rows}</TableBody>
        </Table>;
    }

    render() {
        if (this.state.notFound) {
            return null; // <Page404 className={this.props.classes.root} language={this.props.language}/>;
        }

        if (this.state.loadTimeout && !this.state.parts.length) {
            return <Loader themeName={this.props.themeName} />;
        }

        const prefix = window.location.hash.split('?')[0];

        const CustomLink = this.customLink;
        const CustomH = this.customH;
        const meta = this.meta;
        const link = this.link;

        const reactElements = this.state.parts.map((part, i) => {
            if (part.type === 'table') {
                return this.renderTable(part.lines, i.toString());
            }
            let line = part.lines.join('\n');
            if (part.type === 'code') {
                line = line.trim().replace(/^```javascript/, '```');
            }

            const trimmed = line.trim();
            if (trimmed.match(/^\*[^\s]/) && trimmed.match(/[^\s]\*$/)) {
                line = trimmed;
            }

            // find all "[text](#link)" and replace it with <link text="text" link="link"/>
            // Detect "[iobroker repo \[repoName\]](#iobroker-repo)"

            line = this.replaceHref(line);
            line = Markdown.makeHeadersAsLink(line, prefix);

            // replace <- with &lt;
            line = line.replace(/<-/g, '&lt;-');
            line = line.replace(/<\/ br>/g, '<br />');

            const rct = <MarkdownView
                markdown={line}
                options={CONVERTER_OPTIONS}
                components={{
                    CustomLink, CustomH, meta, link,
                }}
            />;
            /* cconst rct = <ReactMarkdown
                    children={line}
                    components={{ CustomLink, CustomH }}
                />; */

            if (part.type === 'warn') {
                return <div key={`parts${i}`} className={this.props.classes.warn}>{rct}</div>;
            } if (part.type === 'alarm') {
                return <div key={`parts${i}`} className={this.props.classes.alarm}>{rct}</div>;
            } if (part.type === 'notice') {
                return <div key={`parts${i}`} className={this.props.classes.notice}>{rct}</div>;
            }  if (part.type === '@@@') {
                return <div key={`parts${i}`} className={this.props.classes.todo}>{rct}</div>;
            }
            return <div key={`parts${i}`} className={this.props.classes.paragraph}>{rct}</div>;
        });

        return <div className={Utils.clsx(this.props.classes.root, this.props.className)} ref={this.contentRef}>
            {this.renderHeader()}
            {this.state.title && !this.state.header.adapter ? <h1>{this.state.title}</h1> : null}
            {this.renderAffiliates()}
            {reactElements}
            <hr />
            {this.renderLicense()}
            {this.renderChangeLog()}
            {this.renderInfo()}
            {this.renderContent()}
            {this.renderSnackbar()}
        </div>;
    }
}

export default withStyles(styles)(Markdown);
