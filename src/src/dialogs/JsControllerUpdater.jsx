import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { LinearProgress }from '@mui/material';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import CloseIcon from '@mui/icons-material/Close';

import { I18n } from '@iobroker/adapter-react-v5';

class JsControllerUpdater extends Component {
    constructor(props) {
        super(props);

        this.state = {
            response: null,
            error: null,
            starting: true,
        };

        this.textareaRef = React.createRef();

        this.link = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    }

    componentDidMount() {
        // send update command to js-controller
        this.props.socket.getRawSocket().emit('sendToHost', this.props.hostId, 'upgradeController', {
            version: this.props.version,
            adminInstance: parseInt(this.props.adminInstance.split('.').pop(), 10),
        }, result => {
            if (result.result) {
                this.setState({ starting: false });
                this.intervall = setInterval(() => this.checkStatus(), 1000); // poll every second
            } else {
                this.setState({ error: I18n.t('Not updatable'), starting: false });
                this.props.onUpdating(false);
            }
        });
    }

    componentWillUnmount() {
        this.intervall && clearInterval(this.intervall);
        this.intervall = null;
    }

    checkStatus() {
        // interface ServerResponse {
        //     running: boolean; // If the update is still running
        //     stderr: string[];
        //     stdout: string[];
        //     success?: boolean; // if installation process succeeded
        // }

        fetch(this.link)
            .then(res => res.json())
            .then(response => this.setState({ response }, () => {
                if (response && !response.running) {
                    this.props.onUpdating(false);
                    this.intervall && clearInterval(this.intervall);
                    this.intervall = null;
                }

                // scroll down
                if (this.textareaRef.current) {
                    setTimeout(() => {
                        this.textareaRef.current.scrollTop = this.textareaRef.current.scrollHeight;
                    }, 100);
                }
            }))
            .catch(e => {
                this.intervall && clearInterval(this.intervall);
                this.intervall = null;
                this.setState({ error: e.toString() }, () => this.props.onUpdating(false))
            });
    }

    render() {
        return <Dialog
                onClose={(e, reason) => {
                    if (reason !== 'escapeKeyDown' && reason !== 'backdropClick') {
                        this.props.onClose();
                    }
                }}
                open={!0}
                maxWidth="lg"
                fullWidth
        >
            <DialogTitle>{I18n.t('Updating JS-Controller...')}</DialogTitle>
            <DialogContent style={{ height: 400, padding: '0 20px', overflow: 'hidden' }}>
                {(!this.state.response || this.state.response.running) && !this.state.error ? <LinearProgress /> : null}
                {this.state.response || this.state.error ? <textarea
                    ref={this.textareaRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        fontFamily: 'Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace',
                        border: !this.state.error && !this.state.response?.running && this.state.response?.success ? '1px solid green' :
                            (this.state.error || (this.state.response && this.state.response.running && !this.state.response.success) ? '1px solid red' : undefined),
                    }}
                    value={this.state.error ? this.state.error : (
                        this.state.response.stderr ? this.state.response.stderr.join('\n') : this.state.response.stdout.join('\n'))}
                    readOnly
                /> : null}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={this.state.starting || (!this.state.error && this.state.response && !this.state.response.running)}
                    onClick={() => {
                        if (this.state.response && this.state.response.success) {
                            window.location.reload();
                        }
                        this.props.onClose();
                    }}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {I18n.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

JsControllerUpdater.propTypes = {
    socket: PropTypes.object.isRequired,
    hostId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    version: PropTypes.string.isRequired,
    adminInstance: PropTypes.string.isRequired,
    onUpdating: PropTypes.func.isRequired,
};

export default JsControllerUpdater;