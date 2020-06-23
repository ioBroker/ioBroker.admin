import React from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Typography
} from '@material-ui/core';

import CloseIcon from '@material-ui/icons/Close';

import {
    amber,
    blue,
    red
} from '@material-ui/core/colors';

const styles = theme => ({
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    log: {
        height: 400,
        width: 860,
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

class ConfirmDialog extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            log: ['$ iobroker ' + (props.cmd || '')],
            init: false,
            max: null,
            value: null,
            progressText: ''
        };

        this.t = props.t;
    }
    
    componentDidMount() {
        if(this.props.ready && this.props.cmd) {
            this.executeCommand();
        }
    }

    componentDidUpdate() {
        if(!this.state.init && this.props.ready && this.props.cmd) {
            this.executeCommand();
        }
    }

    async executeCommand() {

        this.setState({
            init: true
        });

        this.props.socket.registerCmdStdoutHandler(this.cmdStdoutHandler.bind(this));
        this.props.socket.registerCmdStderrHandler(this.cmdStderrHandler.bind(this));
        this.props.socket.registerCmdExitHandler(this.cmdExitHandler.bind(this));

        const activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;

        this.setState({
            activeCmdId
        });

        try {
            await this.props.socket.cmdExec(this.props.currentHost, this.props.cmd, activeCmdId);
        } catch(error) {
            console.log(error);
        }


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

            this.setState({
                log
            });

            console.log('cmdStderr');
            console.log(id);
            console.log(text);
        }
    }

    cmdExitHandler(id, exitCode) {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {

            const log = this.state.log.slice();
            log.push((exitCode !== 0 ? 'ERROR: ' : '') + 'Process exited with code ' + exitCode);

            this.setState({
                log
            });

            console.log('cmdExit');
            console.log(id);
            console.log(exitCode);
        }
    }

    colorize(text) {

        const pattern = ['error', 'warn', 'info'];
        const regExp = new RegExp(pattern.join('|'), 'i');

        if (text.search(regExp) >= 0) {

            const result = [];
            const { classes } = this.props;

            while (text.search(regExp) >= 0) {

                const [ match ] = text.match(regExp);
                const pos = text.search(regExp);

                if (pos > 0) {

                    const part = text.substring(0, pos);

                    result.push(part);
                    text = text.replace(part, '');
                }
                
                const part = text.substr(0, match.length);

                result.push(<span className={ classes[match.toLowerCase()] }>{ part }</span>);
                text = text.replace(part, '');
            }

            if (text.length > 0) {
                result.push(text);
            }

            return result;
        }

        return text;
    }

    getLog() {
        return this.state.log.map((value, index) => {
            return (
                <Typography
                    key={ index }
                    component="p"
                    variant="body2"
                >
                    { this.colorize(value) }
                </Typography>
            )
        });
    }

    render() {

        const { classes } = this.props;

        return (
            <Dialog onClose={ this.props.onClose } open={ this.props.open } maxWidth="lg">
                <DialogTitle>
                    { this.state.progressText || 'Run Command' }
                    <IconButton className={ classes.closeButton } onClick={ this.props.onClose }>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid
                        container
                        direction="column"
                        spacing={ 2 }
                    >
                        <Grid item>
                            <LinearProgress
                                variant={ this.state.max ? 'determinate' : 'indeterminate' }
                                value={ this.state.max && this.state.value ? 100 - Math.round((this.state.value / this.state.max) * 100) : 0 }
                            />
                        </Grid>
                        <Grid item>
                            <Paper
                                className={ classes.log }
                            >
                                { this.getLog() }
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={ this.props.onConfirm } color="primary">
                        { this.props.confirmText || 'OK' }
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

ConfirmDialog.propTypes = {
    confirmText: PropTypes.string,
    header: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};

export default withStyles(styles)(ConfirmDialog);