import React, { Component } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';

import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
} from '@mui/material';

import {
    Close as CloseIcon,
    OpenInBrowser as OpenInBrowserIcon,
} from '@mui/icons-material';

import Command from '../components/Command';

const styles = theme => ({
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
    hiddenDialog: {
        display: 'none',
    },
    dialogRoot: {
        height: 'calc(100% - 64px)',
    },
});

class CommandDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            progressText: '',
            closeOnReady: (window._localStorage || window.localStorage).getItem('CommandDialog.closeOnReady') === 'true',
        };
    }

    render() {
        const { classes } = this.props;

        return <Dialog
            scroll="paper"
            fullWidth
            classes={{ root: !this.props.visible ? classes.hiddenDialog : '', paper: classes.dialogRoot }}
            onClose={this.props.inBackground ? this.props.onClose : this.props.onInBackground}
            open={!0}
            maxWidth="md"
        >
            <DialogTitle>
                {this.state.progressText || this.props.t('Running command')}
                <IconButton size="large" className={classes.closeButton} onClick={this.props.onClose} disabled={this.props.inBackground}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers style={{ height: '100%' }}>
                <Command
                    noSpacing
                    key="command"
                    ready={this.props.ready}
                    host={this.props.host}
                    socket={this.props.socket}
                    t={this.props.t}
                    inBackground={this.props.inBackground}
                    commandError={this.props.commandError}
                    errorFunc={this.props.errorFunc}
                    performed={this.props.performed}
                    callback={this.props.callback}
                    cmd={this.props.cmd}
                    onFinished={() => this.state.closeOnReady && this.props.onClose()}
                    onSetCommandRunning={running => this.props.onSetCommandRunning(running)}
                />
            </DialogContent>
            <DialogActions style={{ justifyContent: 'space-between' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            disabled={this.props.inBackground}
                            checked={this.state.closeOnReady}
                            onChange={e => {
                                this.setState({ closeOnReady: e.target.checked });
                                (window._localStorage || window.localStorage).setItem('CommandDialog.closeOnReady', e.target.checked ? 'true' : 'false');
                            }}
                        />
                    }
                    label={this.props.t('close on ready')}
                />
                <div>
                    <Button
                        variant="contained"
                        autoFocus
                        disabled={this.props.inBackground}
                        style={{ marginRight: 8 }}
                        onClick={this.props.onInBackground}
                        startIcon={<OpenInBrowserIcon />}
                        color="primary"
                    >
                        {this.props.confirmText || this.props.t('In background')}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!this.props.inBackground}
                        onClick={this.props.onClose}
                        color="grey"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>;
    }
}

CommandDialog.propTypes = {
    t: PropTypes.func,
    confirmText: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    callback: PropTypes.func,
    onInBackground: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired,
    onSetCommandRunning: PropTypes.func.isRequired,
    cmd: PropTypes.string,
    errorFunc: PropTypes.func,
    performed: PropTypes.func,
    inBackground: PropTypes.bool,
    commandError: PropTypes.bool,
    socket: PropTypes.object.isRequired,
    host: PropTypes.string.isRequired,
};

export default withStyles(styles)(CommandDialog);
