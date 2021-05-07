import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import semver from 'semver';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { CardMedia, DialogTitle, makeStyles, ThemeProvider, Typography } from '@material-ui/core';

import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import CancelIcon from '@material-ui/icons/Cancel';

import I18n from '@iobroker/adapter-react/i18n';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

let node = null;

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        width: '100%',
        height: 'auto',
        display: 'flex',
        borderRadius: 4
    },
    paper: {
        maxWidth: 1000,
        width: '100%'
    },
    overflowHidden: {
        display: 'flex',
    },
    pre: {
        overflow: 'auto',
        margin: 20,
        '& p': {
            fontSize: 18,
        }
    },
    blockInfo: {
        right: 20,
        top: 10,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        color: 'silver'
    },
    img: {
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
        }
    },
    img2: {
        width: 70,
        height: 70,
        margin: '10px 0',
        borderRadius: 4,
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
        }
    },
    link:{
        margin: '10px 0',
    }
}));

const Status = ({ name, ...props }) => {
    switch (name) {
        case 'warning':
            return <WarningIcon style={{ color: '#ffca00' }} {...props} />;
        case 'info':
            return <InfoIcon style={{ color: '#007cff' }} {...props} />;
        case 'danger':
            return <CancelIcon style={{ color: '#ff2f2f' }} {...props} />;
        default:
            return <InfoIcon style={{ color: '#007cff' }} {...props} />;
    }
}

const NewsAdminDialog = ({ newsArr, current, callback, themeType, themeName }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
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
                setOpen(false);
                document.body.removeChild(node);
                node = null;
            }
        } else {
            setId(newsArr[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [last]);

    const onClose = () => {
        // setOpen(false);
        setLast(!last)
        callback(id);
    };

    const lang = I18n.getLanguage();
    let text = newsArr[indexArr].content;
    if (typeof text === 'object') {
        text = (text[lang] || text.en).replace(/='([^']*)'/g, '="$1"');
    }
    let title = newsArr[indexArr].title;
    if (typeof title === 'object') {
        title = title[lang] || title.e;
    }
    return <ThemeProvider theme={theme(themeName)}>
        <Dialog
            onClose={onClose}
            open={open}
            classes={{ paper: classes.paper }}
        >
            <div className={classes.blockInfo}>
                {new Date(newsArr[indexArr].created).toLocaleDateString(lang)}
                <Status className={classes.img} name={newsArr[indexArr].class} />
            </div>
            <DialogTitle>{I18n.t('You have unread news!')}</DialogTitle>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent className={classes.overflowHidden} dividers>
                <div className={classes.root}>
                    <div className={classes.pre}>
                        {newsArr[indexArr]?.img &&
                            <CardMedia className={classes.img2} component="img" image={newsArr[indexArr].img} />}
                        <Typography
                            style={themeType === 'dark' ? { color: 'black' } : null}
                            variant="body2"
                            component="p">
                            {Utils.renderTextWithA(text)}
                        </Typography>
                        {newsArr[indexArr]?.link &&
                            <Button
                                variant="contained"
                                autoFocus
                                className={classes.link}
                                onClick={() => window.open(newsArr[indexArr].link, '_blank')}
                                color="primary">
                                {newsArr[indexArr].linkTitle ? newsArr[indexArr].linkTitle[lang] ? newsArr[indexArr].linkTitle[lang] : newsArr[indexArr].linkTitle : I18n.t('Link')}
                            </Button>}
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    onClick={onClose}
                    color="primary">
                    {I18n.t('Acknowledge')}
                </Button>
            </DialogActions>
        </Dialog>
    </ThemeProvider>;
}

function checkActive(adapterName, instances) {
    return !!Object.keys(instances).filter(id => id.startsWith('adapter.system.' + adapterName + '.')).find(id => instances[id].enabled);
}

function checkConditions(condition, installedVersion) {
    if (condition.startsWith('equals')) {
        const vers = condition.substring(7, condition.length - 1).trim();
        return installedVersion === vers;
    } else if (condition.startsWith('bigger')) {
        const vers = condition.substring(7, condition.length - 1).trim();
        return semver.gt(vers, installedVersion);
    } else if (condition.startsWith('smaller')) {
        const vers = condition.substring(8, condition.length - 1).trim();
        return semver.lt(installedVersion, vers);
    } else if (condition.startsWith('between')) {
        const vers1 = condition.substring(8, condition.indexOf(',')).trim();
        const vers2 = condition.substring(condition.indexOf(',') + 1, condition.length - 1).trim();
        return semver.gt(vers1, installedVersion) && semver.gt(vers2,  installedVersion);
    } else {
        return true;
    }
}

/*const context = {
    adapters,
    instances,
    nodeVersion,
    npmVersion,
    os,
    activeRepo
    uuid,
    lang
}*/

export const checkMessages = function (messages, lastMessageId, context) {
    const messagesToShow = [];

    try {
        const today = Date.now();
        for (let m = 0; m < messages.length; m++) {
            const message = messages[m];
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
            if (showIt && message['os'] && context.os) {
                showIt = context.os === message['os'];
            }
            if (showIt && message['repo']) {
                showIt = context.activeRepo === message['repo'];
            }
            if (showIt && message['uuid']) {
                if (Array.isArray(message['uuid'])) {
                    showIt = context.uuid && message['uuid'].find(uuid => context.uuid === uuid);
                } else {
                    showIt = context.uuid && context.uuid === message['uuid'];
                }
            }

            if (showIt) {
                messagesToShow.push({
                    id: message.id,
                    title: message.title[context.lang] || message.title.en,
                    content: message.content[context.lang] || message.content.en,
                    'class': message.class,
                    icon: message.icon,
                    created: message.created
                });
            }
        }
    } catch (err) {

    }

    return messagesToShow;
}

export const newsAdminDialogFunc = (newsArr, current, themeName, themeType, callback) => {
    if (!node) {
        node = document.createElement('div');
        node.id = 'renderModal';
        document.body.appendChild(node);
    }
    return ReactDOM.render(<NewsAdminDialog newsArr={newsArr} themeName={themeName} themeType={themeType} current={current} callback={callback} />, node);
}