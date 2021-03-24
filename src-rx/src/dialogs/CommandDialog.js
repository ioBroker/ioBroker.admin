import { Component } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
} from '@material-ui/core';

import CloseIcon from '@material-ui/icons/Close';

import Command from '../components/Command';

const styles = theme => ({
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

class CommandDialog extends Component {

    constructor(props) {

        super(props);

        this.state = {
            log: ['$ iobroker ' + (props.cmd || '')],
            init: false,
            max: null,
            value: null,
            progressText: '',
            closeOnReady: false,
            checked: true
        };

        this.t = props.t;
    }

    render() {

        const { classes } = this.props;

        return <Dialog onClose={this.props.inBackground ? this.props.onClose : this.props.onConfirm} open={this.props.open} maxWidth="lg">
            <DialogTitle>
                {this.state.progressText || 'Run Command'}
                <IconButton className={classes.closeButton} onClick={this.props.onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Command
                    ready={this.props.ready}
                    currentHost={this.props.currentHost}
                    socket={this.props.socket}
                    t={this.props.t}
                    inBackground={this.props.inBackground}
                    commandError={this.props.commandError}
                    errorFunc={this.props.errorFunc}
                    performed={this.props.performed}
                    cmd={this.props.cmd}
                    onFinished={() => this.state.closeOnReady && this.props.onClose()}
                />
            </DialogContent>
            <DialogActions style={{ justifyContent: 'space-between' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            disabled={this.props.inBackground}
                            checked={this.state.closeOnReady}
                            onChange={(e) => {
                                this.setState({ closeOnReady: e.target.checked });
                                window.localStorage.setItem('CommandDialog.closeOnReady', e.target.checked);
                            }} />}
                    label={this.props.t('close on ready')}
                />
                <div>
                    <Button
                        variant="contained"
                        autoFocus
                        disabled={this.props.inBackground}
                        style={{ marginRight: 8 }}
                        onClick={this.props.onConfirm}
                        color="primary">
                        {this.props.confirmText || this.props.t('In background')}
                    </Button>
                    <Button
                        variant="contained"
                        autoFocus
                        onClick={this.props.onClose}
                        color="default">
                        {this.props.t('Close')}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>;
    }
}

CommandDialog.propTypes = {
    confirmText: PropTypes.string,
    header: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    ready: PropTypes.bool.isRequired
};

export default withStyles(styles)(CommandDialog);