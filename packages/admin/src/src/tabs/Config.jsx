import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    green, grey, orange, red,
} from '@mui/material/colors';

import {
    AppBar,
    Tooltip,
    Paper,
    Fab,
    Toolbar,
    Typography,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';

import {
    Help as HelpIcon,
    Pause as PauseIcon,
    PlayArrow as PlayArrowIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
} from '@mui/icons-material';

import {
    Router, Utils, Icon, Confirm as ConfirmDialog,
} from '@iobroker/adapter-react-v5';

import { JsonConfig } from '@iobroker/json-config';
import BasicUtils from '../Utils';

const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];

const styles = theme => ({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    scroll: {
        height: '100%',
        overflowY: 'auto',
    },
    instanceIcon: {
        width: 42,
        height: 42,
        marginRight: theme.spacing(2),
        verticalAlign: 'middle',
    },
    button: {
        marginRight: 5,
        width: 36,
        height: 36,
    },
    version: {
        fontSize: 12,
        opacity: 0.8,
        marginLeft: 20,
        marginRight: 10,
    },
    versionAliveConnected: {
        color: theme.palette.mode === 'dark' ? '#23a623' : '#60ff60',
    },
    versionAliveNotConnected: {
        color: '#a67223',
    },
    buttonControl: {
        padding: 5,
        transition: 'opacity 0.2s',
        height: 34,
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200],
        },
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200],
        },
    },
    hide: {
        visibility: 'hidden',
    },
    formControl: {
        width: '100%',
        marginBottom: 5,
    },
    logLevel: {
        fontSize: 12,
        marginLeft: 10,
    },
    green: {
        color: green[700],
    },
    red: {
        color: red[700],
    },
    grey: {
        color: grey[700],
    },
    blue: {
        color: '#0055a9',
    },
    orange: {
        color: orange[400],
    },
    orangeDevice: {
        color: orange[300],
    },
});

class Config extends Component {
    constructor(props) {
        super(props);

        this.state = {
            checkedExist: false,
            showStopAdminDialog: false,
            running: false,
            canStart: false,
            alive: false,
            connected: false,
            connectedToHost: false,
            logOnTheFlyValue: false,
            logLevel: 'info',
            logLevelValue: 'info',
            tempLogLevel: 'info',
        };

        this.refIframe = null;
        this.registered = false;
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */) {
        if (!this.registered && this.refIframe?.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
    }

    componentDidMount() {
        // receive messages from IFRAME
        const eventFunc = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'attachEvent' ? 'onmessage' : 'message';

        if (this.props.tab) {
            this.props.socket.fileExists(`${this.props.adapter}.admin`, 'tab.html')
                .then(exist => {
                    if (exist) {
                        this.setState({ checkedExist: 'tab.html' });
                    } else {
                        this.props.socket.fileExists(`${this.props.adapter}.admin`, 'tab_m.html')
                            .then(exists =>
                                (exists ? this.setState({ checkedExist: 'tab_m.html' }) : window.alert('Cannot find tab(_m).html')));
                    }
                });
        } else {
            // this.props.socket.getState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.')
            const instanceId = `system.adapter.${this.props.adapter}.${this.props.instance}`;
            this.props.socket.subscribeObject(instanceId, this.onObjectChange);
            this.props.socket.getObject(instanceId)
                .then(async obj => {
                    const tempLogLevel = await this.props.socket.getState(`${instanceId}.logLevel`);
                    await this.props.socket.subscribeState(`${instanceId}.logLevel`, this.onStateChange);

                    const alive = await this.props.socket.getState(`${instanceId}.alive`);
                    await this.props.socket.subscribeState(`${instanceId}.alive`, this.onStateChange);

                    const connectedToHost = await this.props.socket.getState(`${instanceId}.connected`);
                    await this.props.socket.subscribeState(`${instanceId}.connected`, this.onStateChange);

                    let connected;
                    try {
                        connected = await this.props.socket.getState(`${this.props.adapter}.${this.props.instance}.info.connection`);
                        this.props.socket.subscribeState(`${this.props.adapter}.${this.props.instance}.info.connection`, this.onStateChange);
                    } catch (error) {
                        // ignore
                        connected = null;
                    }

                    let extension;
                    try {
                        extension = await this.props.socket.getState(`${this.props.adapter}.${this.props.instance}.info.extension`);
                        this.props.socket.subscribeState(`${this.props.adapter}.${this.props.instance}.info.extension`, this.onStateChange);
                    } catch (error) {
                        // ignore
                        extension = null;
                    }

                    this.setState({
                        checkedExist: true,
                        running: obj?.common?.onlyWWW || obj?.common?.enabled,
                        canStart: !obj?.common?.onlyWWW,
                        alive: alive?.val || false,
                        extension: extension ? (extension?.val || false) : null,
                        connectedToHost: connectedToHost?.val || false,
                        connected: connected ? (connected.val || false) : null,
                        logLevel: obj?.common?.loglevel || 'info',
                        logLevelValue: obj?.common?.loglevel || 'info',
                        tempLogLevel: tempLogLevel?.val || obj?.common?.loglevel || 'info',
                        common: obj?.common || {},
                        native: obj?.native || {},
                        adapterDocLangs: obj?.common?.docs ? Object.keys(obj.common.docs) : ['en'],
                    });
                })
                .catch(error => {
                    console.error(error);
                    this.setState({ checkedExist: true, running: false });
                });
        }

        if (!this.registered && this.refIframe?.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }

        emit(eventName, event => this.closeConfig(event), false);
    }

    onObjectChange = (id, obj) => {
        if (id === `system.adapter.${this.props.adapter}.${this.props.instance}`) {
            this.setState({
                running: obj?.common?.onlyWWW || obj?.common?.enabled,
                canStart: !obj?.common?.onlyWWW,
                logLevel: obj?.common?.loglevel || 'info',
            });
        }
    };

    // returns:
    // grey   - daemon / disabled
    // green  - daemon / run,connected,alive
    // blue   - schedule
    // orangeDevice - daemon / run, connected to controller, not connected to device
    // orange - daemon / run,not connected
    // red    - daemon / not run, not connected
    getInstanceStatus() {
        const mode = this.state.common?.mode || '';
        let status = mode === 'daemon' ? 'green' : 'blue';

        if (this.state.common?.enabled && (!this.state.common.webExtension || !this.state.native?.webInstance || mode === 'daemon')) {
            if (this.state.common.webExtension && this.state.native?.webInstance) {
                if (this.state.extension !== null) {
                    return this.state.extension ? 'green' : 'red';
                }
            }

            if (!this.state.connectedToHost || !this.state.alive) {
                status = mode === 'daemon' ? 'red' : 'orangeDevice';
            }
            if (this.state.connected !== null && !this.state.connected && status !== 'red') {
                status = 'orange';
            }
        } else {
            status = mode === 'daemon' ? 'grey' : 'blue';
        }

        return status;
    }

    onStateChange = (id, state) => {
        const instanceId = `system.adapter.${this.props.adapter}.${this.props.instance}`;
        if (id === `${instanceId}.alive`) {
            this.setState({ alive: state ? state.val : false });
        } else if (id === `${instanceId}.connected`) {
            this.setState({ connectedToHost: state ? state.val : false });
        } else if (id === `${this.props.adapter}.${this.props.instance}.info.connection`) {
            this.setState({ connected: state ? state.val : null });
        } else if (id === `${this.props.adapter}.${this.props.instance}.info.extension`) {
            this.setState({ extension: state ? state.val : null });
        } else if (id === `${instanceId}.logLevel`) {
            this.setState({ tempLogLevel: state ? state.val : null });
        }
    };

    componentWillUnmount() {
        const eventFunc = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'detachEvent' ? 'onmessage' : 'message';
        this.props.socket.unsubscribeObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, this.onObjectChange);

        emit(eventName, event => this.closeConfig(event), false);

        this.registered && this.refIframe && this.props.onUnregisterIframeRef(this.refIframe);
        this.refIframe = null;
    }

    closeConfig(event) {
        if (event.data === 'close' || event.message === 'close') {
            if (this.props.easyMode) {
                Router.doNavigate('easy');
            } else {
                Router.doNavigate('tab-instances');
            }
        } else if (event.data === 'change' || event.message === 'change') {
            this.props.configStored(false);
        } else if (event.data === 'nochange' || event.message === 'nochange') {
            this.props.configStored(true);
        }
    }

    renderHelpButton() {
        if (this.props.jsonConfig) {
            return <div style={{
                display: 'inline-block', position: 'absolute', right: 0, top: 5,
            }}
            >
                <Tooltip size="small" title={this.props.t('Show help for this adapter')}>
                    <Fab
                        classes={{ root: this.props.classes.button }}
                        onClick={() => {
                            const lang = this.state.adapterDocLangs?.includes(this.props.lang) ? this.props.lang : 'en';
                            window.open(BasicUtils.getDocsLinkForAdapter({ lang, adapterName: this.props.adapter }), 'help');
                        }}
                    >
                        <HelpIcon />
                    </Fab>
                </Tooltip>
            </div>;
        }
        return null;
    }

    getConfigurator() {
        if (this.props.jsonConfig) {
            return <JsonConfig
                menuPadding={this.props.menuPadding}
                theme={this.props.theme}
                width={this.props.width}
                adapterName={this.props.adapter}
                instance={this.props.instance}
                socket={this.props.socket}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                configStored={this.props.configStored}
                t={this.props.t}
            />;
        }
        const src = `adapter/${this.props.adapter}/` +
                `${this.props.tab ? this.state.checkedExist : (this.props.materialize ? 'index_m.html' : 'index.html')}?` +
                `${this.props.instance || 0}&newReact=true&${this.props.instance || 0}&react=${this.props.themeName}`;

        if (this.state.checkedExist) {
            return <iframe
                ref={el => this && (this.refIframe = el)}
                title="config"
                className={this.props.className}
                src={src}
            >
            </iframe>;
        }
        return null;
    }

    extendObject = (id, data) => {
        this.props.socket.extendObject(id, data)
            .catch(error => window.alert(error));
    };

    returnStopAdminDialog() {
        return this.state.showStopAdminDialog ? <ConfirmDialog
            title={this.props.t('Please confirm')}
            text={this.props.t('stop_admin', this.props.instance)}
            ok={this.props.t('Stop admin')}
            onClose={result => {
                result && this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, { common: { enabled: false } });
                this.setState({ showStopAdminDialog: false });
            }}
        /> : null;
    }

    renderLogLevelDialog() {
        if (!this.state.showLogLevelDialog) {
            return null;
        }
        return <Dialog
            open={!0}
            onClose={() => this.setState({ showLogLevelDialog: false })}
        >
            <DialogTitle>{this.props.t('Edit log level rule for %s', `${this.props.adapter}.${this.props.instance}`)}</DialogTitle>
            <DialogContent>
                <FormControl className={this.props.classes.formControl} variant="outlined" style={{ marginTop: 10 }}>
                    <InputLabel>{this.props.t('log level')}</InputLabel>
                    <Select
                        variant="standard"
                        value={this.state.logLevelValue}
                        fullWidth
                        onChange={el => this.setState({ logLevelValue: el.target.value })}
                    >
                        {arrayLogLevel.map(el => <MenuItem key={el} value={el}>
                            {this.props.t(el)}
                        </MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl className={this.props.classes.formControl} variant="outlined">
                    <FormControlLabel
                        control={<Checkbox checked={this.state.logOnTheFlyValue} onChange={e => this.setState({ logOnTheFlyValue: e.target.checked })} />}
                        label={this.props.t('Without restart')}
                    />
                    <FormHelperText>{this.state.logOnTheFlyValue ? this.props.t('Will be reset to the saved log level after restart of adapter') : this.props.t('Log level will be saved permanently')}</FormHelperText>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => {
                        if (this.state.logOnTheFlyValue) {
                            this.props.socket.setState(`system.adapter.${this.props.adapter}.${this.props.instance}.logLevel`, this.state.logLevelValue);
                        } else {
                            this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, { common: { loglevel: this.state.logLevelValue } });
                        }
                        this.setState({ showLogLevelDialog: false });
                    }}
                >
                    {this.props.t('Ok')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ showLogLevelDialog: false })}
                >
                    {this.props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    render() {
        const { classes } = this.props;

        return <Paper className={classes.root}>
            <AppBar color="default" position="static">
                <Toolbar variant="dense">
                    <Typography variant="h6" color="inherit">
                        {this.props.jsonConfig ? <Icon src={this.props.icon} className={this.props.classes.instanceIcon} />
                            : null}
                        {`${this.props.t('Instance settings')}: ${this.props.adapter}.${this.props.instance}`}
                        {this.props.version ? <span className={Utils.clsx(
                            this.props.classes.version,
                            this.props.classes[this.getInstanceStatus()],
                        )}
                        >
v
                            {this.props.version}
                        </span> : null}
                        <Tooltip title={this.props.t('Start/stop')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={event => {
                                        event.stopPropagation();
                                        event.preventDefault();
                                        if (this.state.running && `${this.props.adapter}.${this.props.instance}` === this.props.adminInstance) {
                                            this.setState({ showStopAdminDialog: true });
                                        } else {
                                            this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, { common: { enabled: !this.state.running } });
                                        }
                                    }}
                                    onFocus={event => event.stopPropagation()}
                                    className={Utils.clsx(classes.buttonControl, this.state.canStart ?
                                        (this.state.running ? classes.enabled : classes.disabled) : classes.hide)}
                                >
                                    {this.state.running ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={this.props.t('Restart')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={event => {
                                        event.stopPropagation();
                                        this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, {});
                                    }}
                                    onFocus={event => event.stopPropagation()}
                                    className={Utils.clsx(classes.buttonControl, !this.state.canStart && classes.hide)}
                                    disabled={!this.state.running}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        {this.state.tempLogLevel !== this.state.logLevel ?
                            <Tooltip title={this.props.t('temporary log level')}>
                                <span className={this.props.classes.logLevel}>{this.state.tempLogLevel}</span>
                            </Tooltip> : null}
                        <Tooltip title={this.props.t('log level')}>
                            <span className={this.props.classes.logLevel}>{this.state.tempLogLevel !== this.state.logLevel ? `/ ${this.state.logLevel}` : this.state.logLevel}</span>
                        </Tooltip>
                        <Tooltip title={this.props.t('Edit log level rule for %s', `${this.props.adapter}.${this.props.instance}`)}>
                            <IconButton
                                style={{ width: 34, height: 34 }}
                                size="small"
                                onClick={event => {
                                    event.stopPropagation();
                                    this.setState({ showLogLevelDialog: true });
                                }}
                                onFocus={event => event.stopPropagation()}
                                className={Utils.clsx(classes.buttonControl, !this.state.canStart && classes.hide)}
                            >
                                <EditIcon style={{ width: 20, height: 20 }} />
                            </IconButton>
                        </Tooltip>
                        {/* <IsVisible config={item} name="allowInstanceLink">
                            <Tooltip title={this.props.t('Instance link %s', this.props.instanceItem?.id)}>
                                <span>
                                    <IconButton
                                        size="small"
                                        className={Utils.clsx(classes.buttonControl, (!this.props.instanceItem?.links || !this.props.instanceItem?.links[0]) && classes.hide)}
                                        disabled={!this.state.running}
                                        onClick={event => {
                                            event.stopPropagation();
                                            if (this.props.instanceItem?.links.length === 1) {
                                                // replace IPv6 Address with [ipv6]:port
                                                let url = this.props.instanceItem?.links[0].link;
                                                url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');
                                                window.open(url, this.props.instanceItem?.id);
                                            } else {
                                                setShowLinks(true);
                                            }
                                        }}
                                        onFocus={event => event.stopPropagation()}
                                    >
                                        <InputIcon />
                                    </IconButton>
                                </div>
                            </Tooltip>
                        </IsVisible> */}
                    </Typography>
                    {this.renderHelpButton()}
                </Toolbar>
            </AppBar>
            {this.getConfigurator()}
            {this.returnStopAdminDialog()}
            {this.renderLogLevelDialog()}
        </Paper>;
    }
}

Config.propTypes = {
    menuPadding: PropTypes.number,
    adapter: PropTypes.string,
    instance: PropTypes.number,
    materialize: PropTypes.bool,
    tab: PropTypes.bool,
    jsonConfig: PropTypes.bool,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    t: PropTypes.func,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
    className: PropTypes.string,
    icon: PropTypes.string,
    lang: PropTypes.string,
    easyMode: PropTypes.bool,
    adminInstance: PropTypes.string,
};

export default withStyles(styles)(Config);
