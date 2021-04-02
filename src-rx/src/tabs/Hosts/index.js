/* eslint-disable no-unused-vars */
import { Component, createRef, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
// import LinearProgress from '@material-ui/core/LinearProgress';
// import TableCell from '@material-ui/core/TableCell';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import { CardMedia, InputAdornment, TextField } from '@material-ui/core';

// import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';
// import BugReportIcon from '@material-ui/icons/BugReport';
// import InfoIcon from '@material-ui/icons/Info';
// import WarningIcon from '@material-ui/icons/Warning';
// import ErrorIcon from '@material-ui/icons/Error';
// import DevicesIcon from '@material-ui/icons/Devices';
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CloseIcon from '@material-ui/icons/Close';
// import ViewCompactIcon from '@material-ui/icons/ViewCompact';
// import ScheduleIcon from '@material-ui/icons/Schedule';
// import SettingsIcon from '@material-ui/icons/Settings';

import amber from '@material-ui/core/colors/amber';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';

// import Router from '@iobroker/adapter-react/Components/Router';

// import Config from '../../dialogs/Config';
// import Utils from '../../Utils';
import TabContainer from '../../components/TabContainer';
import TabContent from '../../components/TabContent';
import TabHeader from '../../components/TabHeader';
import { useStateLocal } from '../../helpers/hooks/useStateLocal';
import Utils from '@iobroker/adapter-react/Components/Utils';
// import CardHosts from '../../components/CardHosts';
// import CustomSelectButton from '../../components/CustomSelectButton';
// import RowHosts from '../../components/RowHosts';
// import sentry from '../assets/sentry.svg'

import Icon from '@iobroker/adapter-react/Components/Icon';
import CardHosts from '../../components/CardHosts';
import RowHosts from '../../components/RowHosts';

const styles = theme => ({
    table: {
        minWidth: 650,
    },
    tableRow: {
        '&:nth-of-type(odd)': {
            backgroundColor: grey[300],
        },
        '&:nth-of-type(even)': {
            backgroundColor: grey[200],
        }
    },
    smallAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3)
    },
    button: {
        padding: '5px'
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200]
        }
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200]
        }
    },
    hide: {
        visibility: 'hidden'
    },
    state: {
        width: theme.spacing(2),
        height: theme.spacing(2),
        borderRadius: '100%'
    },
    green: {
        backgroundColor: green[700]
    },
    red: {
        backgroundColor: red[700]
    },
    grey: {
        backgroundColor: grey[700]
    },
    blue: {
        backgroundColor: blue[700]
    },
    transparent: {
        color: 'transparent',
        backgroundColor: 'transparent'
    },
    paper: {
        height: '100%'
    },
    iframe: {
        height: '100%',
        width: '100%',
        border: 0
    },
    silly: {

    },
    debug: {
        backgroundColor: grey[700]
    },
    info: {
        backgroundColor: blue[700]
    },
    warn: {
        backgroundColor: amber[700]
    },
    error: {
        backgroundColor: red[700]
    },
    grow: {
        flexGrow: 1
    },
    tableRender: {
        tableLayout: 'fixed',
        minWidth: 960,
        '& td': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }
    },
    cards: {
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center',
    },
    sentry: {
        width: 24,
        height: 24,
        objectFit: 'fill',
        filter: 'invert(0%) sepia(90%) saturate(1267%) hue-rotate(-539deg) brightness(99%) contrast(97%)'
    },
    contrast0: {
        filter: 'contrast(0%)'
    }
});

let wordCache = {};
// every tab should get their data itself from server
const Hosts = ({
    classes,
    disabled,
    socket,
    currentHost,
    setCurrentHost,
    expertMode,
    ...props }) => {

    const t = (word, arg1, arg2) => {
        if (arg1 !== undefined && !wordCache[word]) {
            wordCache[word] = props.t(word,arg1);
        }else if (!wordCache[word]) {
            wordCache[word] = props.t(word);
        }
        return wordCache[word];
    }

    const [hosts, setHosts] = useState([]);
    const [alive, setAlive] = useState({});
    const [refresh, setRefresh] = useState(false);

    const [viewMode, setViewMode] = useStateLocal(false, 'Hosts.viewMode');
    const [filterText, setFilterText] = useStateLocal(false, 'Hosts.filterText');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        let hostsArray = await socket.getHosts('');
        hostsArray.forEach(async ({ _id }) => {
            let aliveValue = await socket.getState(`${_id}.alive`);
            setAlive((prev) => ({ ...prev, [_id]: aliveValue.val === null ? false : aliveValue.val }));
        });
        setHosts(hostsArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);


    const getAllArrayHosts = useMemo(() => hosts.map(({
        _id,
        common: { name, icon, color, type, title, installedVersion },
        native: { os: { platform } },
        ...propsEl }
    ) => ({
        renderCard: <CardHosts
            key={_id}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            type={type}
            title={title}
            os={platform}
            available={'-'}
            installed={installedVersion}
            events={'⇥null / ↦null'}
            t={t}
            {...propsEl}
        />,
        renderRow: <RowHosts
            key={_id}
            name={name}
            alive={alive[_id]}
            color={color}
            image={icon}
            type={type}
            title={title}
            os={platform}
            available={'-'}
            installed={installedVersion}
            events={'⇥null / ↦null'}
            t={t}
            {...propsEl}
        />,
        name
    })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [hosts, alive]);

    const getPanels = useCallback(() => {
        return getAllArrayHosts.filter(el => filterText ? el.name.toLowerCase().includes(filterText.toLowerCase()) : true).map(el => viewMode ? el.renderCard : el.renderRow)
    }, [getAllArrayHosts, viewMode, filterText]);

    return <TabContainer>
        <TabHeader>
            <Tooltip title={t('Show / hide List')}>
                <IconButton onClick={() => setViewMode(!viewMode)}>
                    {viewMode ? <ViewModuleIcon /> : <ViewListIcon />}
                </IconButton>
            </Tooltip>
            <Tooltip title={t('Reload')}>
                <IconButton onClick={() => setRefresh(!refresh)}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <div className={classes.grow} />
            <TextField
                label={t('Filter')}
                style={{ margin: '5px 0' }}
                value={filterText}
                onChange={event => setFilterText(event.target.value)}
                InputProps={{
                    endAdornment: (
                        filterText ? <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => setFilterText('')}
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment> : null
                    ),
                }}
            />
            <div className={classes.grow} />
        </TabHeader>
        <TabContent overflow="auto">
            <div className={viewMode ? classes.cards : ''}>
                {getPanels()}
            </div>
        </TabContent>
    </TabContainer>;
}

Hosts.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    ready: PropTypes.bool,
    t: PropTypes.func,
    expertMode: PropTypes.bool,
    hostname: PropTypes.string,
    protocol: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    theme: PropTypes.object,
    systemLang: PropTypes.string,
    width: PropTypes.string,
    menuPadding: PropTypes.number,
};

export default withWidth()(withStyles(styles)(Hosts));