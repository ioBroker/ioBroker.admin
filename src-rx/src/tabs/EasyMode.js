import { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';

import { AppBar, CardMedia, CircularProgress, IconButton, Paper, Toolbar } from '@material-ui/core';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import ToggleThemeMenu from '../components/ToggleThemeMenu';
import Config from '../dialogs/Config';
import EasyModeCard from '../components/EasyModeCard';

const styles = theme => ({
    appBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    wrapperEasyMode: {
        height: '100%',
        borderRadius: 0
    },
    wrapperCard: {
        padding: '80px 20px 20px',
        height: '100%',
        overflowY: 'auto',
    },
    controlHeigth:{
        display: 'flex',
        flexFlow: 'wrap',
        justifyContent: 'center'
    },
    img: {
        width: 60,
        height: 60,
        position: 'relative',
        borderRadius: 60,
    },
    logoWhite: {
        background: 'white',
    },
    wrapperHeader: {
        display: 'flex',
        alignItems: 'center'

    },
    headerName: {
        fontSize: 24,
        marginLeft: 10,
    },
    toolBar: {
        justifyContent: 'space-between',
        margin: '5px 0'
    },
    paper: {
        height: '100%',
        paddingTop: 80
    },
    iframe: {
        height: '100%',
        width: '100%',
        border: 0
    },
    IconButtons: {
        display: 'flex'
    },
    logoPointer: {
        cursor: 'pointer'
    }
});

class EasyMode extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configs: this.props.configs,
            strictMode: !this.props.configs,
        };
        if (!this.props.configs) {
            this.props.socket.getEasyMode()
                .then(config => this.setState({ configs: config.configs }));
        }
    }
    render() {
        const {
            classes,
            t,
            themeName,
            toggleTheme,
            navigate,
            location,
            socket,
            themeType,
            theme,
            width,
            isFloatComma,
            dateFormat,
            configStored,
        } = this.props;
        const { configs, strictMode } = this.state;
        if (!configs) {
            return <CircularProgress />;
        }

        const tab = location.id;
        const currentInstance = configs.find(({ id }) => id === tab);
        return <Paper className={classes.wrapperEasyMode}>
            <AppBar
                color="default"
                position="fixed"
                className={classes.appBar}
            >
                <Toolbar className={classes.toolBar}>
                    <div className={classes.wrapperHeader}>
                        <CardMedia onClick={strictMode ? () => navigate('tab-intro') : null} className={clsx(classes.img, themeName === 'colored' && classes.logoWhite, strictMode && classes.logoPointer)} component="img" image={'img/no-image.png'} />
                        <div className={classes.headerName}>{t('Easy Admin')}</div>
                    </div>
                    <div className={classes.IconButtons}>
                        {strictMode && <IconButton onClick={() => navigate('tab-intro')}>
                            <ArrowBackIcon />
                        </IconButton>}
                        <ToggleThemeMenu t={t} toggleTheme={toggleTheme} themeName={themeName} />
                    </div>
                </Toolbar>
            </AppBar>
            {currentInstance ?
                <Paper className={classes.paper}>
                    <Config
                        className={classes.iframe}
                        adapter={currentInstance.id.split('.')[0]}
                        instance={currentInstance.id.split('.')[1]}
                        jsonConfig={currentInstance.jsonConfig}
                        materialize={currentInstance.materialize}
                        tab={currentInstance.tab}
                        socket={socket}
                        easyMode={true}
                        themeName={themeName}
                        themeType={themeType}
                        theme={theme}
                        width={width}
                        t={t}
                        configStored={configStored}
                        dateFormat={dateFormat}
                        isFloatComma={isFloatComma}
                    />
                </Paper> :
                <div className={classes.wrapperCard}>
                    <div className={classes.controlHeigth}>
                    {configs
                        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
                        .map(el => <EasyModeCard key={el.id} navigate={() => navigate(null, 'config', el.id)} {...el} />)}
                        </div>
                </div>}
        </Paper>;
    }
}
// EasyMode.defaultProps = {
//     configs: []
// }

EasyMode.propTypes = {
    configs: PropTypes.array,
    socket: PropTypes.object,
    t: PropTypes.func,
};
export default withStyles(styles)(EasyMode);