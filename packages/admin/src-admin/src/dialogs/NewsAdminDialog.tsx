import React, { useEffect, useState } from 'react';
import semver from 'semver';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CardMedia,
    Typography, Box,
} from '@mui/material';

import {
    Info as InfoIcon,
    Warning as WarningIcon,
    Cancel as CancelIcon,
    Check as CheckIcon,
    Public as WorldIcon,
} from '@mui/icons-material';

import { I18n, type IobTheme, Utils } from '@iobroker/adapter-react-v5';
import type { CompactAdapterInfo } from '@/types';

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: '4px',
    }),
    paper: {
        maxWidth: 1000,
        width: '100%',
    },
    overflowHidden: {
        display: 'flex',
    },
    pre: {
        overflow: 'auto',
        m: '20px',
        '& p': {
            fontSize: 18,
        },
    },
    blockInfo: {
        right: 20,
        top: 10,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        color: 'silver',
    },
    img: {
        '& .news-admin-dialog-img': {
            marginLeft: 10,
            width: 45,
            height: 45,
            margin: 'auto 0',
            position: 'relative',
            '&:after': {
                content: '""',
                position: 'absolute',
                zIndex: 2,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'url("img/no-image.png") 100% 100% no-repeat',
                backgroundSize: 'cover',
                backgroundColor: '#fff',
            },
        },
    },
    img2: {
        width: 70,
        height: 70,
        m: '10px 0',
        borderRadius: '4px',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            zIndex: 2,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'url("img/no-image.png") 100% 100% no-repeat',
            backgroundSize: 'cover',
            backgroundColor: '#fff',
        },
    },
    link: {
        margin: '10px 0',
    },
};

const Status = ({ name }: { name: string }) => {
    switch (name) {
        case 'warning':
            return <WarningIcon className="news-admin-dialog-img" style={{ color: '#ffca00' }} />;
        case 'info':
            return <InfoIcon className="news-admin-dialog-img" style={{ color: '#007cff' }} />;
        case 'danger':
            return <CancelIcon className="news-admin-dialog-img" style={{ color: '#ff2f2f' }} />;
        default:
            return <InfoIcon className="news-admin-dialog-img" style={{ color: '#007cff' }} />;
    }
};

function checkActive(adapterName: string, instances: Record<string, any>): boolean {
    return !!Object.keys(instances).filter(id => id.startsWith(`adapter.system.${adapterName}.`)).find(id => instances[id].enabled);
}

function checkConditions(condition: string, installedVersion: string): boolean {
    if (condition.startsWith('equals')) {
        const vers = condition.substring(7, condition.length - 1).trim();
        return installedVersion === vers;
    } if (condition.startsWith('bigger') || condition.startsWith('greater')) {
        const vers = condition.substring(7, condition.length - 1).trim();
        try {
            return semver.gt(vers, installedVersion);
        } catch {
            return false;
        }
    } else if (condition.startsWith('smaller')) {
        const vers = condition.substring(8, condition.length - 1).trim();
        try {
            return semver.lt(installedVersion, vers);
        } catch {
            return false;
        }
    } else if (condition.startsWith('between')) {
        const vers1 = condition.substring(8, condition.indexOf(',')).trim();
        const vers2 = condition.substring(condition.indexOf(',') + 1, condition.length - 1).trim();
        try {
            return semver.gte(installedVersion, vers1) && semver.lte(installedVersion, vers2);
        } catch {
            return false;
        }
    } else {
        return true;
    }
}

type DbType = 'file' | 'jsonl' | 'redis'

interface Context {
    adapters: Record<string, CompactAdapterInfo>;
    instances: ioBroker.InstanceObject[];
    nodeVersion: string;
    npmVersion: string;
    os: string;
    activeRepo: string[] | string;
    uuid?: string;
    lang: ioBroker.Languages;
    /** Current configured database for objects */
    objectsDbType: DbType;
    /** Number of objects in the database */
    noObjects: number;
}

interface Message {
    id: string;
    uuid: string;
    'date-start'?: number | string;
    'date-end'?: number | string;
    'node-version'?: string;
    'npm-version'?: string;
    os?: string;
    repo: string;
    conditions: {
        [adapter: string]: '!installed' | 'active' | '!active';
    };
    title: Record<ioBroker.Languages, string>;
    content: Record<ioBroker.Languages, string>;
    class: 'info' | 'warning' | 'danger';
    /** Name of the FA-icon */
    icon: string;
    created: string;
    /** Link destination */
    link?: string;
    /** Title of the link */
    linkTitle?: ioBroker.StringOrTranslated;
    /** E.g., a base64 encoded image like, data:image/png;base64,iVBORw0KG... */
    img?: 'string';
    /** e.g. >= 15000 to address installations with more than 15k objects */
    'number-of-objects'?: string;
    /** All object db types which this message is valid for */
    'objects-db-type'?: (DbType)[];
}

export interface ShowMessage {
    id: string;
    title: string;
    content: string;
    class: 'info' | 'warning' | 'danger';
    icon: string;
    created: string;
    link?: string;
    linkTitle: string;
    img?: string;
}

export const checkMessages = (messages: Message[], lastMessageId: string, context: Context): ShowMessage[] => {
    const messagesToShow: ShowMessage[] = [];

    try {
        const today = Date.now();
        for (const message of messages) {
            if (!message) {
                continue;
            }

            if (message.id === lastMessageId) {
                break;
            }
            let showIt = true;

            if (showIt && message['date-start'] && new Date(message['date-start']).getTime() > today) {
                showIt = false;
            } else if (showIt && message['date-end'] && new Date(message['date-end']).getTime() < today) {
                showIt = false;
            } else if (showIt && message.conditions && Object.keys(message.conditions).length > 0) {
                Object.keys(message.conditions).forEach(key => {
                    if (showIt) {
                        const adapter = context.adapters[key];
                        const condition = message.conditions[key];

                        if (!adapter && condition !== '!installed') {
                            showIt = false;
                        } else if (adapter && condition === '!installed') {
                            showIt = false;
                        } else if (adapter && condition === 'active') {
                            showIt = checkActive(key, context.instances);
                        } else if (adapter && condition === '!active') {
                            showIt = !checkActive(key, context.instances);
                        } else if (adapter) {
                            showIt = checkConditions(condition, adapter.v);
                        }
                    }
                });
            }

            if (showIt && message['node-version'] && context.nodeVersion) {
                showIt = checkConditions(message['node-version'], context.nodeVersion);
            }
            if (showIt && message['npm-version'] && context.npmVersion) {
                showIt = checkConditions(message['npm-version'], context.npmVersion);
            }
            if (showIt && message.os && context.os) {
                showIt = context.os === message.os;
            }
            if (showIt && message.repo) {
                // If multi-repo
                if (Array.isArray(context.activeRepo)) {
                    showIt = context.activeRepo.includes(message.repo);
                } else {
                    showIt = context.activeRepo === message.repo;
                }
            }
            if (showIt && message.uuid) {
                if (Array.isArray(message.uuid)) {
                    showIt = context.uuid && message.uuid.find(uuid => context.uuid === uuid);
                } else {
                    showIt = !!(context.uuid && context.uuid === message.uuid);
                }
            }

            if (showIt && message['number-of-objects']) {
                // eslint-disable-next-line no-eval
                showIt = eval(`${context.noObjects} ${message['number-of-objects']}`);
            }

            if (showIt && message['objects-db-type']) {
                if (!message['objects-db-type'].includes(context.objectsDbType)) {
                    showIt = false;
                }
            }

            if (showIt) {
                messagesToShow.push({
                    id: message.id,
                    title: message.title[context.lang] || message.title.en,
                    content: message.content[context.lang] || message.content.en,
                    class: message.class,
                    icon: message.icon,
                    created: message.created,
                    link: message.link,
                    linkTitle: typeof message.linkTitle === 'object' ? message.linkTitle[context.lang] || message.linkTitle.en : message.linkTitle as string,
                    img: message.img,
                });
            }
        }
    } catch {
        //  ignore
    }

    return messagesToShow;
};

const NewsAdminDialog = ({
    newsArr, current, onSetLastNewsId,
}: { newsArr: ShowMessage[]; current: string; onSetLastNewsId: (id?: string) => void }) => {
    const [id, setId] = useState(current);
    const [last, setLast] = useState(false);
    const [indexArr, setIndexArr] = useState(0);

    useEffect(() => {
        const item = newsArr.find(el => el.id === id);
        if (item) {
            const index = newsArr.indexOf(item);
            if (index + 1 < newsArr.length) {
                const newId = newsArr[index + 1].id;
                if (newId) {
                    setId(newId);
                    setIndexArr(index + 1);
                }
            } else {
                onSetLastNewsId();
            }
        } else {
            setId(newsArr[0].id);
        }
    }, [last]);

    const onClose = () => {
        // setOpen(false);
        setLast(!last);
        onSetLastNewsId(id);
    };

    const lang = I18n.getLanguage();
    const content = newsArr[indexArr].content.replace(/='([^']*)'/g, '="$1"');
    const title = newsArr[indexArr].title;

    const link = newsArr[indexArr].link;
    const linkTitle = newsArr[indexArr].linkTitle;
    return <Dialog
        onClose={onClose}
        open={!0}
        sx={{ '& .MuiDialog-paper': styles.paper }}
    >
        <Box component="div" sx={{ ...styles.blockInfo, ...styles.img }}>
            {new Date(newsArr[indexArr].created).toLocaleDateString(lang)}
            <Status name={newsArr[indexArr].class} />
        </Box>
        <DialogTitle>{I18n.t('You have unread news!')}</DialogTitle>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent style={styles.overflowHidden} dividers>
            <Box component="div" sx={styles.root}>
                <Box component="div" sx={styles.pre}>
                    {newsArr[indexArr]?.img &&
                        <CardMedia sx={styles.img2} component="img" image={newsArr[indexArr].img} />}
                    <Typography
                        variant="body2"
                        component="p"
                    >
                        {Utils.renderTextWithA(content.replace(/\n/g, '<br />'))}
                    </Typography>
                    {newsArr[indexArr]?.link &&
                        <Button
                            variant="contained"
                            style={styles.link}
                            onClick={() => window.open(newsArr[indexArr].link, '_blank')}
                            color="primary"
                        >
                            {linkTitle || I18n.t('Link')}
                        </Button>}
                </Box>
            </Box>
        </DialogContent>
        <DialogActions>
            {link ? <Button
                variant="contained"
                onClick={() => {
                    const frame = window.open(link, '_blank');
                    frame?.focus();
                }}
                color="secondary"
                startIcon={<WorldIcon />}
            >
                {linkTitle || I18n.t('Show more info')}
            </Button> : null}
            <Button
                variant="contained"
                autoFocus
                onClick={onClose}
                color="primary"
                startIcon={<CheckIcon />}
            >
                {I18n.t('Acknowledge')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default NewsAdminDialog;
