import React, { Component } from 'react';
import { withStyles } from '@mui/styles';

import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    TextField,
    Button,
} from '@mui/material';

import {
    Close as CloseIcon,
    AccessTime as TimeIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { AdminConnection } from '@iobroker/adapter-react-v5';
import { MOBILE_WIDTH } from '@/helpers/MobileDialog';

const styles: Record<string, any> = {
    buttonLabel: {
        whiteSpace: 'nowrap',
    },
    input: {
        minWidth: 150,
    },
};

interface SlowConnectionWarningDialogProps {
    t: (text: string) => string;
    readTimeoutMs: number;
    onClose: (readTimeoutMs?: number) => void;
    classes: Record<string, string>;
}

interface SlowConnectionWarningDialogState {
    readTimeoutSec: number | string;
}

export class SlowConnectionWarningDialogClass extends Component<SlowConnectionWarningDialogProps, SlowConnectionWarningDialogState> {
    private readonly mobile: boolean;

    constructor(props: SlowConnectionWarningDialogProps) {
        super(props);

        this.state = {
            readTimeoutSec: Math.round((props.readTimeoutMs || SlowConnectionWarningDialogClass.getReadTimeoutMs()) / 1000),
        };

        this.mobile = window.innerWidth < MOBILE_WIDTH;
    }

    static getReadTimeoutMs() {
        return parseInt(((window as any)._localStorage || window.localStorage).getItem('App.readTimeoutMs'), 10) ||
            (AdminConnection.isCloud() ? 40_000 : 15_000);
    }

    static saveReadTimeoutMs(readTimeoutMs: number) {
        if (readTimeoutMs) {
            return ((window as any)._localStorage || window.localStorage).setItem('App.readTimeoutMs', readTimeoutMs.toString());
        }
        return ((window as any)._localStorage || window.localStorage).removeItem('App.readTimeoutMs');
    }

    render() {
        return <Dialog
            open={!0}
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
                    classes={{ root: this.props.classes.input }}
                    label={this.props.t('Read timeout')}
                    value={this.state.readTimeoutSec}
                    onChange={e => this.setState({ readTimeoutSec: e.target.value })}
                    type="number"
                    inputProps={{ min: 5, max: 600 }}
                    helperText={this.props.t('in seconds')}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    className={this.props.classes.buttonLabel}
                    variant="contained"
                    onClick={() => {
                        SlowConnectionWarningDialogClass.saveReadTimeoutMs(60000);
                        this.props.onClose(60000);
                    }}
                    startIcon={<TimeIcon />}
                    // @ts-expect-error grey is a valid color
                    color="grey"
                >
                    {this.mobile ? this.props.t('1 minute') : this.props.t('Set timeout to 1 minute')}
                </Button>
                <Button
                    variant="contained"
                    autoFocus
                    color="primary"
                    disabled={!parseInt(this.state.readTimeoutSec as string, 10)}
                    onClick={() => {
                        const readTimeoutMs = parseInt(this.state.readTimeoutSec as string, 10) * 1000;
                        SlowConnectionWarningDialogClass.saveReadTimeoutMs(readTimeoutMs);
                        this.props.onClose(readTimeoutMs);
                    }}
                    startIcon={<CheckIcon />}
                >
                    {this.mobile ? null : this.props.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    // @ts-expect-error grey is a valid color
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.mobile ? null : this.props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(SlowConnectionWarningDialogClass);
