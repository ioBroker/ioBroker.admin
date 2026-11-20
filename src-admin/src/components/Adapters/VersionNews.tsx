import React, { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import semver from 'semver';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import type { AdminConnection, IobTheme, Translate } from '@iobroker/gui-components';

import NewsLine, { getNewsText, splitNews } from './NewsLine';

/** The news of an adapter as the repository has them: version => changes of that version */
export type AdapterNews = Record<string, ioBroker.Translated | string>;

/** How long the news read for a tooltip are kept: the repository changes rarely, an update of the adapter does not change them */
const NEWS_CACHE_MS = 10 * 60_000;

const newsCache: Record<string, { ts: number; promise: Promise<AdapterNews | null> }> = {};

/**
 * Reads the news of one adapter from the repository.
 *
 * The instances and the instance settings have only the compact repository, which comes without
 * news. Admin answers this from the repository it holds in its objects, the host is not asked. The
 * answer is kept for some minutes, so the tooltips of all instances of an adapter read once.
 *
 * @param socket connection to admin
 * @param host host of the adapter, e.g. `raspberrypi` or `system.host.raspberrypi`
 * @param adapter name of the adapter, e.g. `admin`
 * @param lang language of the GUI: the news come in that language and English only
 */
export function readAdapterNews(
    socket: AdminConnection,
    host: string,
    adapter: string,
    lang: ioBroker.Languages,
): Promise<AdapterNews | null> {
    const key = `${adapter}|${lang}`;
    const cached = newsCache[key];
    if (cached && Date.now() - cached.ts < NEWS_CACHE_MS) {
        return cached.promise;
    }
    const hostId = host.startsWith('system.host.') ? host : `system.host.${host}`;
    const promise = socket
        .getReducedRepository(hostId, { lang, adapters: [adapter] })
        .then(repository => (repository?.[adapter] as { news?: AdapterNews } | undefined)?.news || null)
        .catch((e: unknown): null => {
            // e.g. a user without the right to ask the host: the version is shown as before then
            console.warn(`Cannot read the news of "${adapter}": ${e as Error}`);
            return null;
        });
    newsCache[key] = { ts: Date.now(), promise };
    return promise;
}

/**
 * Versions of the news, the newest first. Versions that semver does not understand come last.
 *
 * @param news the news of an adapter
 */
function sortVersions(news: AdapterNews): string[] {
    return Object.keys(news).sort((a, b) => {
        const validA = semver.valid(a);
        const validB = semver.valid(b);
        if (validA && validB) {
            return semver.rcompare(validA, validB);
        }
        if (validA) {
            return -1;
        }
        if (validB) {
            return 1;
        }
        return b.localeCompare(a);
    });
}

/**
 * Whether `version` is newer than the installed one. False if one of them is no valid version.
 *
 * @param version version of the news
 * @param installed installed version
 */
function isNewer(version: string, installed: string): boolean {
    try {
        return !!semver.valid(version) && !!semver.valid(installed) && semver.gt(version, installed);
    } catch {
        return false;
    }
}

const styles: Record<string, any> = {
    trigger: {
        cursor: 'pointer',
    },
    tooltip: {
        pointerEvents: 'none',
        '& .MuiTooltip-tooltip': { maxWidth: 520 },
    },
    tooltipTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tooltipHint: {
        marginTop: 6,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    entry: {
        mb: 2,
    },
    versionHeader: (theme: IobTheme) => ({
        borderRadius: '3px',
        pl: '10px',
        mb: 0.5,
        fontWeight: 'bold',
        background: theme.palette.action.selected,
    }),
    versionHeaderNewer: (theme: IobTheme) => ({
        background: '#4dabf5',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    versionHeaderInstalled: (theme: IobTheme) => ({
        background: '#5abd29',
        color: theme.palette.mode === 'dark' ? 'black' : 'white',
    }),
    versionLabel: {
        ml: 1,
        fontWeight: 'normal',
    },
};

interface VersionNewsProps {
    /** Name of the adapter, e.g. `admin` */
    adapter: string;
    /** The version that is shown, e.g. the installed one */
    version: string;
    /** The news of the adapter if they are at hand, e.g. in the adapters tab. They are read from admin on the first hover if not given */
    news?: AdapterNews | null;
    socket: AdminConnection;
    /** Host to read the news from, e.g. `raspberrypi` or `system.host.raspberrypi` */
    host: string;
    lang: ioBroker.Languages;
    /** Show the news in English */
    noTranslation?: boolean;
    t: Translate;
    /** What the version is, e.g. "Installed": the tooltip says it above the changes, or alone if there are none */
    label?: string;
    /** The element that shows the version */
    children: React.ReactNode;
}

/**
 * Shows the changes of a version: a tooltip with the news of this version, and a click opens the
 * whole change log of the adapter, the installed version marked and the newer ones above it.
 *
 * @param props the version and where its news come from
 */
export default function VersionNews(props: VersionNewsProps): JSX.Element {
    const { adapter, version, socket, host, lang, t } = props;
    const [readNews, setReadNews] = useState<AdapterNews | null | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const mounted = useRef(true);
    const scrolled = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // other adapter or language: the news read before do not fit anymore
    useEffect(() => setReadNews(undefined), [adapter, lang]);

    const news = props.news !== undefined ? props.news : readNews;

    const load = useCallback((): void => {
        if (props.news !== undefined || readNews !== undefined || loading) {
            return;
        }
        setLoading(true);
        void readAdapterNews(socket, host, adapter, lang).then(result => {
            if (mounted.current) {
                setReadNews(result);
                setLoading(false);
            }
        });
    }, [props.news, readNews, loading, socket, host, adapter, lang]);

    // Known as soon as the news are there: an adapter without any news (e.g. not in the repository) gets no dialog
    const hasNews = news === undefined ? true : !!news && Object.keys(news).length > 0;
    const lines = news ? splitNews(getNewsText(news[version], lang, props.noTranslation)) : [];

    const title =
        props.label || lines.length || loading || hasNews ? (
            <div>
                <div style={styles.tooltipTitle}>
                    {`v${version}`}
                    {props.label ? ` - ${props.label}` : ''}
                </div>
                {loading ? <div>{t('Loading...')}</div> : null}
                {lines.map((line, index) => (
                    <NewsLine
                        key={index}
                        text={line}
                    />
                ))}
                {hasNews && !loading ? <div style={styles.tooltipHint}>{t('Click to show all changes')}</div> : null}
            </div>
        ) : (
            ''
        );

    const closeDialog = (): void => setShowDialog(false);

    const renderDialog = (): JSX.Element | null => {
        if (!showDialog) {
            return null;
        }
        const versions = news ? sortVersions(news) : [];

        return (
            // A click in the dialog bubbles up the React tree to the row or card that shows the version - not further than here
            <span onClick={e => e.stopPropagation()}>
                <Dialog
                    open={!0}
                    onClose={closeDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>{t('Changes of "%s"', adapter)}</DialogTitle>
                    <DialogContent dividers>
                        {loading || news === undefined ? t('Loading...') : null}
                        {!loading && news !== undefined && !versions.length ? t('No change log available') : null}
                        {versions.map(ver => {
                            const verLines = splitNews(getNewsText(news?.[ver], lang, props.noTranslation));
                            const installed = ver === version;
                            const newer = !installed && isNewer(ver, version);
                            return (
                                <Box
                                    key={ver}
                                    sx={styles.entry}
                                    ref={
                                        installed
                                            ? (el: HTMLDivElement | null) => {
                                                  // bring the installed version into view once, the newer ones stay above it
                                                  if (el && !scrolled.current) {
                                                      scrolled.current = true;
                                                      window.requestAnimationFrame(() =>
                                                          el.scrollIntoView({ block: 'nearest' }),
                                                      );
                                                  }
                                              }
                                            : undefined
                                    }
                                >
                                    <Typography
                                        component="div"
                                        sx={[
                                            styles.versionHeader,
                                            newer && styles.versionHeaderNewer,
                                            installed && styles.versionHeaderInstalled,
                                        ]}
                                    >
                                        {ver}
                                        {installed ? (
                                            <Box
                                                component="span"
                                                sx={styles.versionLabel}
                                            >
                                                {`(${props.label || t('installed')})`}
                                            </Box>
                                        ) : null}
                                    </Typography>
                                    {verLines.map((line, index) => (
                                        <NewsLine
                                            key={index}
                                            text={line}
                                        />
                                    ))}
                                </Box>
                            );
                        })}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="contained"
                            color="grey"
                            startIcon={<CloseIcon />}
                            onClick={closeDialog}
                        >
                            {t('Close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </span>
        );
    };

    return (
        <>
            <Tooltip
                title={title}
                open={tooltipOpen && !showDialog && !!title}
                onOpen={() => {
                    load();
                    setTooltipOpen(true);
                }}
                onClose={() => setTooltipOpen(false)}
                slotProps={{ popper: { sx: styles.tooltip } }}
            >
                <Box
                    component="span"
                    sx={hasNews ? styles.trigger : undefined}
                    onMouseEnter={load}
                    onClick={(e: React.MouseEvent) => {
                        if (!hasNews) {
                            return;
                        }
                        e.stopPropagation();
                        load();
                        scrolled.current = false;
                        setTooltipOpen(false);
                        setShowDialog(true);
                    }}
                >
                    {props.children}
                </Box>
            </Tooltip>
            {renderDialog()}
        </>
    );
}
