/**
 * Copyright 2018-2023 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
// please do not delete React, as without it other projects could not be compiled: ReferenceError: React is not defined
import React, { Component, type JSX } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import { Check as IconCheck } from '@mui/icons-material';

import { I18n } from '../i18n';

interface DialogErrorProps {
    /* The dialog title; default: Error (translated) */
    title?: string;
    /* The dialog text */
    text: string | React.JSX.Element | React.JSX.Element[];
    /* Close handler. */
    onClose?: () => void;
    /* if the dialog must be fill sized */
    fullWidth?: boolean;
}

export class DialogError extends Component<DialogErrorProps> {
    handleOk(): void {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render(): JSX.Element {
        return (
            <Dialog
                open={!0}
                maxWidth="sm"
                fullWidth={this.props.fullWidth !== undefined ? this.props.fullWidth : true}
                onClose={() => this.handleOk()}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="ar_alert_dialog_title">{this.props.title || I18n.t('ra_Error')}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="ar_alert_dialog_description">
                        {this.props.text || I18n.t('ra_Unknown error!')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        id="ar_dialog_error_ok"
                        variant="contained"
                        onClick={() => this.handleOk()}
                        color="primary"
                        autoFocus
                        startIcon={<IconCheck />}
                    >
                        {I18n.t('ra_Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
