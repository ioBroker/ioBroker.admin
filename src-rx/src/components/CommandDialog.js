import React from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import CloseIcon from '@material-ui/icons/Close';

import { grey } from '@material-ui/core/colors';

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
        backgroundColor: grey[500],
        padding: theme.spacing(1),
        overflowY: 'scroll'
    }
});

class ConfirmDialog extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            log: ['$ /.iobroker ' + (props.cmd || '')],
            init: false
        };
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

    executeCommand() {

        this.setState({
            init: true
        });

        this.props.socket.registerCmdStdoutHandler(this.cmdStdoutHandler.bind(this));
        this.props.socket.registerCmdStderrHandler(this.cmdStderrHandler.bind(this));
        this.props.socket.registerCmdExitHandler(this.cmdExitHandler.bind(this));

        /*this.props.socket._socket.on('cmdStdout', (_id, text) => {
            

            if (this.state.activeCmdId && this.state.activeCmdId === _id) {
                console.log('cmdStdout');
            console.log(_id);
            console.log(text);
                let m = text.match(/^upload \[(\d+)]/);
                /*if (m) {
                    if ($dialogCommand.data('max') === null) {
                        $dialogCommand.data('max', parseInt(m[1], 10));
                        $dialogCommandProgress.removeClass('indeterminate').addClass('determinate');
                    }
                    const max = $dialogCommand.data('max');
                    const value = parseInt(m[1], 10);
                    $dialogCommandProgress.css('width', (100 - Math.round((value / max) * 100)) + '%');
                } else {
                    m = text.match(/^got [-_:\/\\.\w\d]+\/admin$/);
                    if (m) {
                        // upload of admin
                        $dialogCommand.find('.progress-text').html(_('Upload admin started'));
                        $dialogCommand.data('max', null);
                    } else {
                        // got ..../www
                        m = text.match(/^got [-_:\/\\.\w\d]+\/www$/);
                        if (m) {
                            // upload of www
                            $dialogCommand.find('.progress-text').html(_('Upload www started'));
                            $dialogCommand.data('max', null);
                        } else {
    
                        }
                    }
                }
    
                stdout += '\n' + text;
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());*
            }
        });
        this.props.socket._socket.on('cmdStderr', (_id, text) => {
            
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

        const activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;

        this.setState({
            activeCmdId
        });

        this.props.socket._socket.emit('cmdExec', this.props.currentHost, activeCmdId, this.props.cmd, function (err) {

            console.log(err);

            if (err) {
                /*stdout += '\n' + _(err);
                $stdout.val(stdout);*
                cmdCallback = null;*
                callback(err);*/
            } else {
                //if (callback) callback();
            }
        });
    }

    cmdStdoutHandler(id, text) {
        if (this.state.activeCmdId && this.state.activeCmdId === id) {
            const log = this.state.log.slice();
            log.push(text);

            this.setState({
                log
            });
            console.log('cmdStdout');
            console.log(id);
            console.log(text);
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
            log.push(exitCode);

            this.setState({
                log
            });
            console.log('cmdExit');
            console.log(id);
            console.log(exitCode);
        }
    }

    getLog() {
        return this.state.log.map((value, index) => {
            return (
                <Typography
                    key={ index }
                    component="p"
                    variant="caption"
                >
                    { value }
                </Typography>
            )
        });
    }

    render() {

        const { classes } = this.props;

        return (
            <Dialog onClose={ this.props.onClose } open={ this.props.open } maxWidth="lg">
                <DialogTitle>
                    { this.props.header || '' }
                    <IconButton className={ classes.closeButton } onClick={ this.props.onClose }>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Paper
                        elevation={ 0 }
                        className={ classes.log }
                    >
                        { this.getLog() }
                    </Paper>
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