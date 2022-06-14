import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { Button, TextField } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import TimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';

import {MOBILE_WIDTH} from '../helpers/MobileDialog';

const styles = theme => ({
    buttonLabel: {
        whiteSpace: 'nowrap',
    },
    input: {
        minWidth: 150
    }
});

class SlowConnectionWarningDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            readTimeoutSec: Math.round((this.props.readTimeoutMs || SlowConnectionWarningDialog.getReadTimeoutMs()) / 1000),
        };

        this.mobile = window.innerWidth < MOBILE_WIDTH;
    }

    static getReadTimeoutMs() {
        return parseInt((window._localStorage || window.localStorage).getItem('App.readTimeoutMs'), 10) || 15000;
    }

    static saveReadTimeoutMs(readTimeoutMs) {
        if (readTimeoutMs) {
            return (window._localStorage || window.localStorage).setItem('App.readTimeoutMs', readTimeoutMs.toString());
        } else {
            return (window._localStorage || window.localStorage).removeItem('App.readTimeoutMs');
        }
    }

    render() {
        return <Dialog
            open={true}
            maxWidth="lg"
            onClose={() => this.props.onClose()}
        >
            <DialogTitle>{this.props.t('Detected slow connection!')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {this.props.t('Seems that you have slow connection. Do you want to increase timeout interval?')}
                </DialogContentText>
                <TextField
                    variant="standard"
                    classes={{root: this.props.classes.input}}
                    label={this.props.t('Read timeout')}
                    value={this.state.readTimeoutSec}
                    onChange={e => this.setState({readTimeoutSec: e.target.value})}
                    type="number"
                    inputProps={{min: 5, max: 600}}
                    helperText={this.props.t('in seconds')}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    classes={{label: this.props.classes.buttonLabel}}
                    variant="contained"
                    onClick={() => {
                        SlowConnectionWarningDialog.saveReadTimeoutMs(60000);
                        this.props.onClose(60000);
                    }}
                    startIcon={<TimeIcon/>}
                    color="grey"
                >
                    {this.mobile ? this.props.t('1 minute') : this.props.t('Set timeout to 1 minute')}
                </Button>
                <Button
                    variant="contained"
                    autoFocus
                    color="primary"
                    disabled={!parseInt(this.state.readTimeoutSec, 10)}
                    onClick={() => {
                        const readTimeoutMs = parseInt(this.state.readTimeoutSec, 10) * 1000;
                        SlowConnectionWarningDialog.saveReadTimeoutMs(readTimeoutMs);
                        this.props.onClose(readTimeoutMs);
                    }}
                    startIcon={<CheckIcon/>}
                >
                    {this.mobile ? null : this.props.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.mobile ? null : this.props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

SlowConnectionWarningDialog.propTypes = {
    t: PropTypes.func.isRequired,
    readTimeoutMs: PropTypes.number,
    onClose: PropTypes.func.isRequired,
};

export default withStyles(styles)(SlowConnectionWarningDialog);
