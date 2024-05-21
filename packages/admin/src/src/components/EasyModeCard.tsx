import React from 'react';
import { Card, CardMedia, type Theme } from '@mui/material';
import { withStyles } from '@mui/styles';

import { Utils } from '@iobroker/adapter-react-v5';

const boxShadow = '0 2px 2px 0 rgba(0, 0, 0, .14),0 3px 1px -2px rgba(0, 0, 0, .12),0 1px 5px 0 rgba(0, 0, 0, .2)';
const boxShadowHover = '0 8px 17px 0 rgba(0, 0, 0, .2),0 6px 20px 0 rgba(0, 0, 0, .19)';

const styles: Record<string, any> = (theme: Theme) => ({
    root: {
        position: 'relative',
        margin: 10,
        width: 300,
        minHeight: 200,
        background: theme.palette.background.default,
        boxShadow,
        display: 'flex',
        transition: 'box-shadow 0.5s',
        cursor: 'pointer',
        '&:hover': {
            boxShadow: boxShadowHover,
        },
    },
    imageBlock: {
        background: 'silver',
        minHeight: 60,
        display: 'flex',
        padding: '0 10px 0 10px',
        position: 'relative',
        justifyContent: 'space-between',
        transition: 'background 0.5s',
    },
    img: {
        width: 60,
        height: 60,
        marginTop: 20,
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
    adapter: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 15,
        verticalAlign: 'middle',
        marginTop: 'auto',
        borderTop: '1px solid silver',
        padding: '20px 4px',
        textAlign: 'center',
        textTransform: 'uppercase',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        color: '#ffab40',
    },
    instanceStateNotAlive1: {
        backgroundColor: 'rgba(192, 192, 192, 0.4)',
    },
    wrapperDesc: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden',
    },
    desc: {
        padding: 20,
        fontSize: 15,
    },
});

function getText(text: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
    if (text && typeof text === 'object') {
        return text[lang] || text.en || '';
    }
    return (text as string) || '';
}

interface EasyModeCardProps {
    classes: Record<string, string>;
    icon: string;
    id: string;
    key: string;
    desc: string;
    lang: ioBroker.Languages;
    navigate: () => void;
}

const EasyModeCard = ({
    classes,
    icon,
    id,
    key,
    desc,
    lang,
    navigate,
}: EasyModeCardProps) => <Card onClick={navigate} key={key} className={classes.root}>
    <div className={Utils.clsx(classes.imageBlock, classes.instanceStateNotAlive1)}>
        <CardMedia
            className={classes.img}
            component="img"
            image={`adapter/${id.split('.')[0]}/${icon}` || 'img/no-image.png'}
        />
    </div>
    <div className={classes.wrapperDesc}>
        <div className={classes.desc}>{getText(desc, lang)}</div>
        <div className={classes.adapter}>{id}</div>
    </div>
</Card>;

export default withStyles(styles)(EasyModeCard);
