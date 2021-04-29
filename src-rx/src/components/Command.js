import React, { Component } from 'react';
import { Grid, LinearProgress, Paper, Switch, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { amber, blue, red } from '@material-ui/core/colors';
import Router from '@iobroker/adapter-react/Components/Router';

const styles = theme => ({
    log: {
        height: 400,
        width: 860,
        padding: theme.spacing(1),
        overflowY: 'auto'
    },
    logNoSpacing: {
        height: '100%',
        width: 'calc(100% - 8px)',
        marginLeft: 8,
        padding: theme.spacing(1),
        overflowY: 'auto'
    },
    error: {
        color: red[500]
    },
    info: {
        color: blue[500]
    },
    warn: {
        color: amber[500]
    }
});

class Command extends Component {
    constructor(props) {
        super(props);

        this.state = {
            log: [`$ iobroker ${props.cmd || ''}`],
            init: false,
            max: null,
            value: null,
            progressText: '',
            moreChecked: true,
            stopped: false,
        };

        this.logRef = React.createRef();

        this.t = props.t;
    }

    componentDidMount() {
        if (this.props.ready && this.props.cmd) {
            console.log('STARTED: ' + this.props.cmd);
            this.executeCommand();
        }
        const closeOnReady = JSON.parse(window.localStorage.getItem('CommandDialog.closeOnReady')) || false;
        this.setState({ closeOnReady });
    }

    componentDidUpdate() {
        if (!this.state.init && this.props.ready && this.props.cmd) {
            this.executeCommand();
        }
        this.logRef.current?.scrollIntoView();
    }

    executeCommand() {
        this.setState({ init: true }, () => this.props.onSetCommandRunning(true));

        this.props.socket.registerCmdStdoutHandler(this.cmdStdoutHandler.bind(this));
        this.props.socket.registerCmdStderrHandler(this.cmdStderrHandler.bind(this));
        this.props.socket.registerCmdExitHandler(this.cmdExitHandler.bind(this));

        const activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;

        this.setState({ activeCmdId });

        this.props.socket.cmdExec(this.props.currentHost, this.props.cmd, activeCmdId)
            .catch(error =>
                console.log(error));


        /*this.props.socket._socket.on('cmdStderr', (_id, text) => {

            if (this.state.activeCmdId && this.state.activeCmdId === _id) {
                console.log('cmdStderr');
            console.log(_id);
            console.log(text);
                /*if (!$dialogCommand.data('error')) {
                    $dialogCommand.data('error', text);
                }
                stdout += '\nERROR: ' + text;
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());*
            }
        });
        this.props.socket._socket.on('cmdExit', (_id, exitCode) => {

            if (this.state.activeCmdId && this.state.activeCmdId === _id) {
                console.log('cmdExit');
                console.log(_id);
                console.log(exitCode);
                /*exitCode = parseInt(exitCode, 10);
                stdout += '\n' + (exitCode !== 0 ? 'ERROR: ' : '') + 'process exited with code ' + exitCode;
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());

                $dialogCommand.find('.progress-dont-close').addClass('disabled');
                $dialogCommandProgress.removeClass('indeterminate').css({'width': '100%'});
                $dialogCommand.find('.btn').html(_('Close'));
                $dialogCommand.data('finished', true);
                $dialogCommand.data('max', true);
                const $backButton = $adminSideMain.find('.button-command');
                $backButton.removeClass('in-progress');

                if (!exitCode) {
                    $dialogCommand.find('.progress-text').html(_('Success!'));
                    $backButton.hide();
                    if ($dialogCommand.find('.progress-dont-close input').prop('checked')) {
                        setTimeout(function () {
                            $dialogCommand.modal('close');
                        }, 1500);
                    }
                } else {
                    let error = $dialogCommand.data('error');
                    if (error) {
                        const m = error.match(/error: (.*)$/);
                        if (m) {
                            error = m[1];
                        }

                        $dialogCommand.find('.progress-text').html(_('Done with error: %s', _(error))).addClass('error');
                    } else {
                        $dialogCommand.find('.progress-text').html(_('Done with error')).addClass('error');
                    }
                    $backButton.addClass('error');
                    $backButton.show();
                }
                if (cmdCallback) {
                    cmdCallback(exitCode);
                    cmdCallback = null;
                }*
            }
        });*/
    }

    cmdStdoutHandler(id, text) {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {

            const log = this.state.log.slice();
            log.push(text);

            const upload = text.match(/^upload \[(\d+)]/);
            const gotAdmin = !upload ? text.match(/^got [-_:/\\.\w\d]+\/admin$/) : null;
            const gotWww = !gotAdmin ? text.match(/^got [-_:/\\.\w\d]+\/www$/) : null;

            let max = this.state.max;
            let value = null;
            let progressText = '';

            if (upload) {
                max = max || parseInt(upload[1], 10);
                value = parseInt(upload[1], 10);
            } else if (gotAdmin) {
                // upload of admin
                progressText = this.t('Upload admin started');
                max = null;
            } else if (gotWww) {
                // upload of www
                progressText = this.t('Upload www started');
                max = null;
            }

            this.setState({
                log,
                max,
                value,
                progressText
            });

            console.log('cmdStdout');
        }
    }

    cmdStderrHandler(id, text) {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {

            const log = this.state.log.slice();
            log.push(text);

            this.setState({ log });

            console.log('cmdStderr');
            console.log(id);
            console.log(text);
        }
    }

    cmdExitHandler(id, exitCode) {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {
            const log = this.state.log.slice();
            if (!document.hidden && exitCode === 0 && log.length && log[log.length - 1].endsWith('created') && this.props.callBack) {
                const newArr = log[log.length - 1].split(' ');
                const adapter = newArr.find(el => el.startsWith('system'));
                if (adapter) {
                    Router.doNavigate('tab-instances', 'config', adapter);
                }
            }
            log.push(`${exitCode !== 0 ? 'ERROR: ' : ''}Process exited with code ${exitCode}`);

            this.setState({ log, stopped: true }, () => {
                this.props.onSetCommandRunning(false);
                if (exitCode !== 0) {
                    this.props.errorFunc && this.props.errorFunc(exitCode);
                } else {
                    this.props.performed && this.props.performed();
                    this.props.onFinished(exitCode);
                }
                console.log('cmdExit');
                console.log(id);
                console.log(exitCode);
            });
        }
    }

    colorize(text, maxLength) {
        const pattern = ['error', 'warn', 'info'];
        const regExp = new RegExp(pattern.join('|'), 'i');

        if (maxLength !== undefined) {
            text = text.substring(0, maxLength);
        }

        if (text.search(regExp)) {
            const result = [];
            const { classes } = this.props;

            while (text.search(regExp) >= 0) {
                const [match] = text.match(regExp);
                const pos = text.search(regExp);

                if (pos > 0) {
                    const part = text.substring(0, pos);

                    result.push(<span key={result.length}>{part}</span>);
                    text = text.replace(part, '');
                }

                const part = text.substr(0, match.length);

                result.push(<span key={result.length} className={classes[match.toLowerCase()]}>{part}</span>);
                text = text.replace(part, '');
            }

            if (text.length > 0) {
                result.push(<span key={result.length}>{text}</span>);
            }

            return result;
        }

        return text;
    }

    getLog() {
        return this.state.log.map((value, index) => <Typography
            ref={index === this.state.log.length - 1 ? this.logRef : undefined}
            key={index}
            component="p"
            variant="body2"
        >
            {this.colorize(value)}
        </Typography>);
    }

    render() {
        const classes = this.props.classes;

        return <Grid
            style={this.props.noSpacing ? { height: '100%', width: '100%' } : {}}
            container
            direction="column"
            spacing={this.props.noSpacing ? 0 : 2}
        >
            <Grid item>
                {!this.state.stopped && <LinearProgress
                    style={this.props.commandError ? { backgroundColor: '#f44336' } : null}
                    variant={this.props.inBackground ? 'determinate' : 'indeterminate'}
                    value={this.state.max && this.state.value ? 100 - Math.round((this.state.value / this.state.max) * 100) : this.props.commandError ? 0 : 100}
                />}
            </Grid>
            <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: this.props.inBackground ? 'space-between' : 'flex-end'
            }}>
                <Typography
                    style={this.props.inBackground ? {
                        width: 'calc(100% - 180px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    } : { display: 'none' }}
                    component="div"
                >
                    {this.colorize(this.state.log[this.state.log.length - 1])}
                </Typography>
                <Typography component="div" style={{ width: 250 }}>
                    <Grid component="label" container alignItems="center" spacing={1}>
                        <Grid item>{this.props.t('less')}</Grid>
                        <Grid item>
                            <Switch
                                checked={this.state.moreChecked}
                                onChange={(event) => this.setState({ moreChecked: event.target.checked })}
                                color="primary"
                            />
                        </Grid>
                        <Grid item>{this.props.t('more')}</Grid>
                    </Grid>
                </Typography>
            </div>
            <Grid item style={this.props.noSpacing ? { height: 'calc(100% - 45px)', width: '100%' } : {}}>
                <Paper className={this.props.noSpacing ? classes.logNoSpacing : classes.log}>
                    {this.state.moreChecked ? this.getLog() : null}
                </Paper>
            </Grid>
        </Grid>;
    }
}

Command.defaultProps = {
    onSetCommandRunning: () => {}
};

Command.propTypes = {
    noSpacing: PropTypes.bool,
    currentHost: PropTypes.string.isRequired,
    socket: PropTypes.object.isRequired,
    onFinished: PropTypes.func.isRequired,
    ready: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired,
    inBackground: PropTypes.bool,
    commandError: PropTypes.bool,
    errorFunc: PropTypes.func,
    performed: PropTypes.func,
    cmd: PropTypes.string.isRequired,
    onSetCommandRunning: PropTypes.func.isRequired
};

export default withStyles(styles)(Command);