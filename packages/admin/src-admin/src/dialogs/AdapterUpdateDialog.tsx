import React, { Component, type JSX } from 'react';
import semver from 'semver';
import moment from 'moment';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid2,
    IconButton,
    Typography,
} from '@mui/material';

import {
    Close as CloseIcon,
    Check as CheckIcon,
    Book as BookIcon,
    Warning as IconWarning,
    Error as IconError,
    Info as IconInfo,
    Public as IconWeb,
    Language as LanguageIcon,
} from '@mui/icons-material';

import { I18n, Utils, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

import { MOBILE_WIDTH } from '@/helpers/MobileDialog';
import type { RepoAdapterObject } from '@/components/Adapters/Utils';

import State from '../components/State';

import 'moment/locale/de';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/it';
import 'moment/locale/nl';
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/ru';
import 'moment/locale/uk';
import 'moment/locale/zh-cn';
import type { AdapterDependencies } from '@/dialogs/AddInstanceDialog';

const styles: Record<string, any> = {
    closeButton: (theme: IobTheme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
    }),
    languageButton: {
        position: 'absolute',
        right: 52 + 8,
        top: 8,
    },
    languageButtonActive: (theme: IobTheme) => ({
        color: theme.palette.primary.main,
    }),
    typography: {
        paddingRight: 30,
    },
    version: (theme: IobTheme) => ({
        background: '#4dabf5',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    wrapperButton: {
        '@media screen and (max-width: 465px)': {
            '& *': {
                fontSize: 10,
            },
        },
        '@media screen and (max-width: 380px)': {
            '& *': {
                fontSize: 9,
            },
        },
    },
    messageText: {},
    messageIcon: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    messageColor_warn: {
        color: '#cb7642',
    },
    messageColor_error: {
        color: '#f5614d',
    },
    messageColor_info: {
        color: '#5abd29',
    },
    messageTitle_warn: (theme: IobTheme) => ({
        background: '#cb7642',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    messageTitle_error: (theme: IobTheme) => ({
        background: '#f5614d',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    messageTitle_info: (theme: IobTheme) => ({
        background: '#5abd29',
        borderRadius: '3px',
        pl: '10px',
        fontWeight: 'bold',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    messageDialogText: {
        fontSize: 18,
    },
    messageDialogTitle: {},
    versionTime: {
        fontSize: 'smaller',
        opacity: 0.5,
        marginLeft: 4,
    },
    dialogPaper: {
        maxWidth: 880,
    },
    repoStableVersionText: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#8dff7a' : '#2b9800',
        fontWeight: 'bold',
        marginLeft: '4px',
    }),
    repoLatestVersionText: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#a3fcff' : '#005498',
        fontWeight: 'bold',
        marginLeft: '4px',
    }),
};

export interface Message {
    title: ioBroker.Translated;
    text: ioBroker.Translated;
    linkText?: ioBroker.Translated;
    link?: string;
    buttons?: ('agree' | 'cancel' | 'ok')[];
    level?: 'warn' | 'error' | 'info';
}

export interface News {
    version: string;
    news: string;
    downloaded?: boolean;
}

export interface CompactInstanceInfo {
    adminTab: ioBroker.AdapterCommon['adminTab'];
    name: ioBroker.InstanceCommon['name'];
    icon: ioBroker.InstanceCommon['icon'];
    enabled: ioBroker.InstanceCommon['enabled'];
    version: ioBroker.InstanceCommon['version'];
}

/**
 * Check if the message should be shown
 */
export function checkCondition(
    objMessages: ioBroker.MessageRule[] | false | null | undefined,
    oldVersion: string | null,
    newVersion: string,
    instances?: Record<string, CompactInstanceInfo>,
): Message[] | null {
    let messages: Message[] | null = null;

    if (objMessages) {
        // const messages = {
        //     "condition": {
        //         "operand": "and",
        //         "rules": [
        //             "oldVersion<=1.0.44",
        //             "newVersion>=1.0.45"
        //         ]
        //     },
        //     "title": {
        //         "en": "Important notice",
        //     },
        //     "text": {
        //         "en": "Main text",
        //     },
        //     "link": "https://iobroker.net/www/pricing",
        //     "buttons": ["agree", "cancel", "ok"],
        //     "linkText" {
        //          "en": "More info",
        //     },
        //     "level": "warn"
        // };

        objMessages.forEach(message => {
            let show = !message.condition || !message.condition.rules;
            if (message.condition && message.condition.rules) {
                const results = (
                    Array.isArray(message.condition.rules) ? message.condition.rules : [message.condition.rules]
                ).map(rule => {
                    // Possible rules:
                    // - "oldVersion<=1.0.44"
                    // - "newVersion>=1.0.45"
                    // - "installed" - any version, same as 'oldVersion>=0.0.0'
                    // - "not-installed" - if adapter is not installed, same as '!'
                    // - "vis-2>=1.0.0"
                    // - "vis"
                    // - "!vis-2"
                    let version;
                    let op;
                    let ver;

                    if (rule.includes('oldVersion')) {
                        version = oldVersion;
                        rule = rule.substring('newVersion'.length);
                    } else if (rule.includes('newVersion')) {
                        version = newVersion;
                        rule = rule.substring('newVersion'.length);
                    } else {
                        if (rule === 'installed') {
                            return !!oldVersion;
                        }
                        if (rule === '!' || rule === 'not-installed') {
                            return !oldVersion;
                        }

                        if (instances) {
                            // it could be the name of required adapter, like vis-2
                            const split = rule.match(/([a-z][-a-z_0-9]+)([!=<>]+)([.\d]+)/);
                            if (split) {
                                // Check that adapter is installed in a desired version
                                const instId = Object.keys(instances).find(id => instances[id]?.name === split[1]);
                                if (instId) {
                                    version = instances[instId].version;
                                    op = split[2];
                                    ver = split[3];
                                    try {
                                        if (op === '==') {
                                            return semver.eq(version, ver);
                                        }
                                        if (op === '>') {
                                            return semver.gt(version, ver);
                                        }
                                        if (op === '<') {
                                            return semver.lt(version, ver);
                                        }
                                        if (op === '>=') {
                                            return semver.gte(version, ver);
                                        }
                                        if (op === '<=') {
                                            return semver.lte(version, ver);
                                        }
                                        if (op === '!=') {
                                            return semver.neq(version, ver);
                                        }
                                        console.warn(`Unknown rule ${version}${rule}`);
                                        return false;
                                    } catch {
                                        console.warn(`Cannot compare ${version}${rule}`);
                                        return false;
                                    }
                                }
                            } else if (!rule.match(/^[!=<>]+/)) {
                                // Check if adapter is installed
                                if (Object.keys(instances).find(id => instances[id]?.name === rule)) {
                                    return true;
                                }
                            } else if (rule.startsWith('!')) {
                                // Check if adapter is not installed
                                const adapter = rule.substring(1);
                                if (!Object.keys(instances).find(id => instances[id]?.name === adapter)) {
                                    return true;
                                }
                            }
                            // unknown rule
                            return false;
                        }
                    }

                    // If the first character is '>' or '<'
                    if (rule[1] >= '0' && rule[1] <= '9') {
                        op = rule[0];
                        ver = rule.substring(1);
                    } else {
                        // The first 2 characters are '>=' or '<=' or '!=' or '=='
                        op = rule.substring(0, 2);
                        ver = rule.substring(2);
                    }
                    try {
                        if (op === '==') {
                            return semver.eq(version, ver);
                        }
                        if (op === '>') {
                            return semver.gt(version, ver);
                        }
                        if (op === '<') {
                            return semver.lt(version, ver);
                        }
                        if (op === '>=') {
                            return semver.gte(version, ver);
                        }
                        if (op === '<=') {
                            return semver.lte(version, ver);
                        }
                        if (op === '!=') {
                            return semver.neq(version, ver);
                        }
                        console.warn(`Unknown rule ${version}${rule}`);
                    } catch {
                        console.warn(`Cannot compare ${version}${rule}`);
                    }
                    return false;
                });

                if (message.condition.operand === 'or') {
                    show = results.find(res => res);
                } else {
                    show = results.findIndex(res => !res) === -1;
                }
            }

            if (show) {
                messages = messages || [];
                messages.push({
                    title: message.title,
                    text: message.text,
                    link: message.link,
                    linkText: message.linkText,
                    buttons: message.buttons,
                    level: message.level,
                });
            }
        });
    }

    return messages;
}

interface AdapterUpdateDialogProps {
    adapter: string;
    adapterObject: RepoAdapterObject;
    dependencies?: AdapterDependencies[];
    news: News[];
    noTranslation: boolean;
    toggleTranslation: () => void;
    onUpdate: (version: string) => void;
    onInstruction?: () => void;
    onIgnore?: (version: string) => void;
    onClose: () => void;
    rightDependencies: boolean;
    installedVersion: string;
    t: Translate;
    textUpdate?: string;
    textInstruction?: string;
    instances?: Record<string, CompactInstanceInfo>;
    theme: IobTheme;
    isStable?: boolean;
}

interface AdapterUpdateDialogState {
    showMessageDialog: boolean;
}

class AdapterUpdateDialog extends Component<AdapterUpdateDialogProps, AdapterUpdateDialogState> {
    private readonly t: Translate;

    private readonly mobile: boolean;

    private readonly messages: Message[] | null;

    private readonly lang: string;

    constructor(props: AdapterUpdateDialogProps) {
        super(props);

        this.t = props.t;
        this.mobile = window.innerWidth < MOBILE_WIDTH;

        this.state = {
            showMessageDialog: false,
        };

        const messages = false; /* ioBroker.MessageRule[] = [
            {
                condition: {
                    operand: 'and',
                    rules: [
                        'oldVersion<=1.5.0',
                        'newVersion>=2.0.0',
                    ],
                },
                title: {
                    en: 'Important notice',
                    de: 'Wichtiger Hinweis',
                    ru: 'Важное замечание',
                    pt: 'Notícia importante',
                    nl: 'Belangrijke mededeling',
                    fr: 'Avis important',
                    it: 'Avviso IMPORTANTE',
                    es: 'Noticia importante',
                    pl: 'Ważna uwaga',
                    uk: 'aaa',
                    'zh-cn': '重要通知',
                },
                text: {
                    en: 'From the ioBroker.knx@2.0.0 version only 500 data points can be used fro free. If you have more than 500 KNX data points, you must order the paid license',
                    de: 'Ab der Version ioBroker.knx@2.0.0 können nur noch 500 Datenpunkte frei verwendet werden. Wenn Sie mehr als 500 KNX-Datenpunkte haben, müssen Sie die kostenpflichtige Lizenz bestellen',
                    ru: 'Из версии ioBroker.knx@2.0.0 только 500 точек данных можно использовать бесплатно. Если у вас более 500 точек данных KNX, необходимо заказать платную лицензию.',
                    pt: 'Na versão ioBroker.knx@2.0.0, apenas 500 pontos de dados podem ser usados gratuitamente. Se você tiver mais de 500 pontos de dados KNX, você deve solicitar a licença paga',
                    nl: 'Van de ioBroker.knx@2.0.0 versie kunnen slechts 500 datapunten gratis worden gebruikt. Als u meer dan 500 KNX-datapunten heeft, moet u de betaalde licentie bestellen',
                    fr: 'À partir de la version ioBroker.knx@2.0.0, seuls 500 points de données peuvent être utilisés gratuitement. Si vous avez plus de 500 points de données KNX, vous devez commander la licence payante',
                    it: 'Dalla versione ioBroker.knx@2.0.0 è possibile utilizzare gratuitamente solo 500 punti dati. Se hai più di 500 punti dati KNX, devi ordinare la licenza a pagamento',
                    es: 'Desde la versión ioBroker.knx@2.0.0, solo se pueden usar 500 puntos de datos de forma gratuita. Si tiene más de 500 puntos de datos KNX, debe solicitar la licencia paga',
                    pl: 'Od wersji ioBroker.knx@2.0.0 można bezpłatnie korzystać tylko z 500 punktów danych. Jeśli masz więcej niż 500 punktów danych KNX, musisz zamówić płatną licencję',
                    uk: 'aaa',
                    'zh-cn': '从 ioBroker.knx@2.0.0 版本开始，只能免费使用 500 个数据点。如果您有超过 500 个 KNX 数据点，则必须订购付费许可证',
                },
                link: 'https://iobroker.net/www/pricing',
                linkText: {
                    en: 'Link text',
                    de: 'Link text',
                    ru: 'Из версии ioBroker.knx@2.0.0 только 500 точек данных можно использовать бесплатно. Если у вас более 500 точек данных KNX, необходимо заказать платную лицензию.',
                    pt: 'Na versão ioBroker.knx@2.0.0, apenas 500 pontos de dados podem ser usados gratuitamente. Se você tiver mais de 500 pontos de dados KNX, você deve solicitar a licença paga',
                    nl: 'Van de ioBroker.knx@2.0.0 versie kunnen slechts 500 datapunten gratis worden gebruikt. Als u meer dan 500 KNX-datapunten heeft, moet u de betaalde licentie bestellen',
                    fr: 'À partir de la version ioBroker.knx@2.0.0, seuls 500 points de données peuvent être utilisés gratuitement. Si vous avez plus de 500 points de données KNX, vous devez commander la licence payante',
                    it: 'Dalla versione ioBroker.knx@2.0.0 è possibile utilizzare gratuitamente solo 500 punti dati. Se hai più di 500 punti dati KNX, devi ordinare la licenza a pagamento',
                    es: 'Desde la versión ioBroker.knx@2.0.0, solo se pueden usar 500 puntos de datos de forma gratuita. Si tiene más de 500 puntos de datos KNX, debe solicitar la licencia paga',
                    pl: 'Od wersji ioBroker.knx@2.0.0 można bezpłatnie korzystać tylko z 500 punktów danych. Jeśli masz więcej niż 500 punktów danych KNX, musisz zamówić płatną licencję',
                    uk: 'aaa',
                    'zh-cn': '从 ioBroker.knx@2.0.0 版本开始，只能免费使用 500 个数据点。如果您有超过 500 个 KNX 数据点，则必须订购付费许可证',
                },
                level: 'warn',
                buttons: ['agree', 'cancel'],
            },
        ] */

        this.messages = checkCondition(
            this.props.adapterObject?.messages || messages,
            this.props.installedVersion,
            this.props.adapterObject?.version,
            this.props.instances,
        );
        this.lang = I18n.getLanguage();
        moment.locale(this.lang);
    }

    getDependencies(): JSX.Element[] {
        return (this.props.dependencies || []).map(dependency => (
            <State
                key={dependency.name}
                state={dependency.rightVersion}
            >
                {`${dependency.name}${dependency.version ? ` (${dependency.version})` : ''}: ${dependency.installed ? dependency.installedVersion : '-'}`}
            </State>
        ));
    }

    getNews(): JSX.Element[] {
        const result: JSX.Element[] = [];

        let stableVersion: string | undefined;
        let latestVersion: string | undefined;
        if (this.props.isStable !== undefined) {
            if (this.props.isStable) {
                stableVersion = this.props.adapterObject.version;
                latestVersion = this.props.adapterObject.latestVersion;
            } else {
                stableVersion = this.props.adapterObject.stable;
                latestVersion = this.props.adapterObject.version;
            }
        }

        this.props.news?.forEach(entry => {
            const news: string[] = (entry.news ? entry.news.split('\n') : [])
                .map((line: string) =>
                    line
                        .trim()
                        .replace(/^\*\s*/, '')
                        .replace(/<!--[^>]*->/, '')
                        .replace(/<! -[^>]*->/, '')
                        .replace(/<!--|--!?>/g, '')
                        .trim(),
                )
                .filter((line: string) => !!line);

            if (
                this.props.adapterObject?.version &&
                entry.version &&
                semver.gt(entry.version, this.props.adapterObject?.version)
            ) {
                return;
            }

            result.push(
                <Grid2 key={entry.version}>
                    <Typography sx={styles.version}>
                        {entry.version}
                        {latestVersion && latestVersion === entry.version ? (
                            <Box
                                component="span"
                                sx={styles.repoLatestVersionText}
                            >
                                (latest)
                            </Box>
                        ) : null}
                        {stableVersion && stableVersion === entry.version ? (
                            <Box
                                component="span"
                                sx={styles.repoStableVersionText}
                            >{`(${I18n.t('stable')})`}</Box>
                        ) : null}
                        {this.props.adapterObject?.version === entry.version ? (
                            <span style={styles.versionTime}>
                                ({moment(this.props.adapterObject.versionDate).fromNow()})
                            </span>
                        ) : null}
                    </Typography>
                    {news.map((value, index) => (
                        <Typography
                            key={`${entry.version}-${index}`}
                            component="div"
                            variant="body2"
                        >
                            {`• ${value}`}
                        </Typography>
                    ))}
                </Grid2>,
            );
        });

        return result;
    }

    getText(text: string | { [lang: string]: string }, noTranslation?: boolean): string {
        if (text && typeof text === 'object') {
            if (noTranslation) {
                return text.en;
            }
            return text[this.lang] || text.en;
        }
        return typeof text === 'object' ? '' : text;
    }

    renderOneMessage(message: Message, index: number): JSX.Element {
        return (
            <Grid2 key={index}>
                <Typography sx={styles[`messageTitle_${message.level || 'warn'}`]}>
                    {this.getText(message.title, this.props.noTranslation) || ''}
                </Typography>
                <Typography
                    component="div"
                    variant="body2"
                    style={styles.messageText}
                >
                    {this.getText(message.text, this.props.noTranslation) || ''}
                </Typography>
                {message.link ? (
                    <Button
                        onClick={() => {
                            const w = window.open(message.link, '_blank');
                            w.focus();
                        }}
                        startIcon={<IconWeb />}
                        variant="contained"
                        color="grey"
                    >
                        {this.getText(message.linkText, this.props.noTranslation) || this.props.t('More info')}
                    </Button>
                ) : null}
            </Grid2>
        );
    }

    renderMessages(): JSX.Element | null {
        if (this.messages) {
            return (
                <Grid2
                    container
                    spacing={2}
                    direction="column"
                    wrap="nowrap"
                    sx={{ marginBottom: 1 }}
                >
                    {this.messages.map((message, i) => this.renderOneMessage(message, i))}
                </Grid2>
            );
        }
        return null;
    }

    renderMessageDialog(): JSX.Element | null {
        if (!this.state.showMessageDialog) {
            return null;
        }
        const message = this.messages.find(m => m.buttons);
        const version = this.props.adapterObject?.version;

        return (
            <Dialog
                onClose={() => this.setState({ showMessageDialog: false })}
                open={!0}
            >
                <DialogTitle style={styles.messageDialogTitle}>
                    {this.getText(message.title, this.props.noTranslation) || this.props.t('Please confirm')}
                </DialogTitle>
                <DialogContent style={styles.messageDialogText}>
                    {message.level === 'warn' ? (
                        <IconWarning style={{ ...styles.messageIcon, ...styles.messageColor_warn }} />
                    ) : null}
                    {message.level === 'error' ? (
                        <IconError style={{ ...styles.messageIcon, ...styles.messageColor_error }} />
                    ) : null}
                    {message.level === 'info' ? (
                        <IconInfo style={{ ...styles.messageIcon, ...styles.messageColor_info }} />
                    ) : null}
                    {this.getText(message.text, this.props.noTranslation)}
                </DialogContent>
                <DialogActions>
                    {message.link ? (
                        <Button
                            onClick={() => {
                                const w = window.open(message.link, '_blank');
                                w.focus();
                            }}
                            startIcon={<IconWeb />}
                            variant="contained"
                            color="secondary"
                        >
                            {this.getText(message.linkText, this.props.noTranslation) || this.props.t('More info')}
                        </Button>
                    ) : null}
                    {message.link ? <div style={{ flexGrow: 1 }} /> : null}
                    {message.buttons.map((button, i) => {
                        if (button === 'ok') {
                            return (
                                <Button
                                    key={i}
                                    variant="contained"
                                    onClick={() =>
                                        this.setState({ showMessageDialog: false }, () => this.props.onUpdate(version))
                                    }
                                    color="primary"
                                    startIcon={<CheckIcon />}
                                >
                                    {this.t('Update')}
                                </Button>
                            );
                        }
                        if (button === 'agree') {
                            return (
                                <Button
                                    key={i}
                                    sx={styles[`messageTitle_${message.level || 'warn'}`]}
                                    variant="contained"
                                    onClick={() =>
                                        this.setState({ showMessageDialog: false }, () => this.props.onUpdate(version))
                                    }
                                    color="primary"
                                    startIcon={<CheckIcon />}
                                >
                                    {this.t('Agree')}
                                </Button>
                            );
                        }
                        if (button === 'cancel') {
                            return (
                                <Button
                                    key={i}
                                    variant="contained"
                                    onClick={() => this.setState({ showMessageDialog: false })}
                                    startIcon={<CloseIcon />}
                                    color="grey"
                                >
                                    {this.t('Cancel')}
                                </Button>
                            );
                        }
                        return null;
                    })}
                </DialogActions>
            </Dialog>
        );
    }

    render(): JSX.Element {
        const version = this.props.adapterObject?.version;

        const allDownloaded = this.props.news?.every(entry => entry.downloaded);
        const news = this.getNews();

        return (
            <Dialog
                onClose={this.props.onClose}
                open={!0}
                sx={{ '& .MuiDialog-paper': styles.dialogPaper }}
            >
                {this.renderMessageDialog()}
                <DialogTitle>
                    <Typography
                        component="h2"
                        variant="h6"
                        sx={{ '&.MuiTypography-root': styles.typography }}
                    >
                        <div style={{ width: 'calc(100% - 60px)' }}>
                            {this.t('Update "%s" to v%s', this.props.adapter, version)}
                        </div>
                        <IconButton
                            size="large"
                            sx={styles.closeButton}
                            onClick={this.props.onClose}
                        >
                            <CloseIcon />
                        </IconButton>
                        {this.lang !== 'en' && this.props.toggleTranslation && !allDownloaded ? (
                            <IconButton
                                size="large"
                                style={Utils.getStyle(
                                    this.props.theme,
                                    styles.languageButton,
                                    this.props.noTranslation && styles.languageButtonActive,
                                )}
                                onClick={this.props.toggleTranslation}
                                title={I18n.t('Disable/Enable translation')}
                            >
                                <LanguageIcon />
                            </IconButton>
                        ) : null}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    {this.renderMessages()}
                    <Grid2
                        container
                        direction="column"
                        spacing={2}
                        wrap="nowrap"
                    >
                        {this.props.dependencies &&
                            this.props.dependencies.length > 0 &&
                            this.props.dependencies.find(dependency => !dependency.rightVersion) && (
                                <Grid2>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                    >
                                        {this.t('Dependencies')}
                                    </Typography>
                                    {this.getDependencies()}
                                </Grid2>
                            )}
                        {news.length ? (
                            <Grid2>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                >
                                    {this.t('Change log')}
                                </Typography>
                                <Grid2
                                    container
                                    spacing={2}
                                    direction="column"
                                    wrap="nowrap"
                                >
                                    {news}
                                </Grid2>
                            </Grid2>
                        ) : (
                            this.t('No change log available')
                        )}
                    </Grid2>
                </DialogContent>
                <DialogActions sx={styles.wrapperButton}>
                    {!!this.props.rightDependencies && this.props.onIgnore && version && (
                        <Button
                            id="adapter-update-dialog-ignore"
                            variant="outlined"
                            onClick={() => this.props.onIgnore(version)}
                            color="primary"
                        >
                            {this.t('Ignore version %s', version)}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        id="adapter-update-dialog-ok"
                        autoFocus
                        disabled={!this.props.rightDependencies || !version || !this.props.adapterObject}
                        onClick={() => {
                            if (this.messages?.find(message => message.buttons)) {
                                this.setState({ showMessageDialog: true });
                            } else {
                                this.props.onUpdate(version);
                            }
                        }}
                        color="primary"
                        startIcon={<CheckIcon />}
                    >
                        {this.mobile ? null : this.props.textUpdate ? this.props.textUpdate : this.t('Update')}
                    </Button>
                    {this.props.textInstruction ? (
                        <Button
                            id="adapter-update-dialog-instructions"
                            variant="contained"
                            autoFocus
                            disabled={!this.props.rightDependencies || !version || !this.props.adapterObject}
                            onClick={() => {
                                if (this.messages?.find(message => message.buttons)) {
                                    this.setState({ showMessageDialog: true });
                                } else {
                                    this.props.onInstruction();
                                }
                            }}
                            color="primary"
                            startIcon={<BookIcon />}
                        >
                            {this.mobile ? null : this.props.textInstruction}
                        </Button>
                    ) : null}
                    <Button
                        id="adapter-update-dialog-cancel"
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.mobile ? null : this.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default AdapterUpdateDialog;
