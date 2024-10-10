/**
 * Copyright 2018-2023 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */

// please do not delete React, as without it other projects could not be compiled: ReferenceError: React is not defined
import React, { Component, type JSX } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import { Close as IconClose } from '@mui/icons-material';

import { I18n } from '../i18n';

interface DialogMessageProps {
    /* The dialog title; default: Message (translated) */
    title?: string;
    /* The dialog text */
    text: string | React.JSX.Element | React.JSX.Element[];
    /* Close handler. */
    onClose?: () => void;
    /* if the dialog must be fill sized */
    fullWidth?: boolean;
    /* optional icon */
    icon?: React.JSX.Element;
    /* optional ok button text */
    ok?: string;
}

export class DialogMessage extends Component<DialogMessageProps> {
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
                aria-labelledby="ar_dialog_message_title"
                aria-describedby="ar_dialog_message_description"
            >
                <DialogTitle id="ar_dialog_message_title">{this.props.title || I18n.t('ra_Message')}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="ar_dialog_message_description">
                        <span style={{ marginRight: this.props.icon ? 8 : 0 }}>{this.props.icon || null}</span>
                        {this.props.text}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        id="ar_dialog_message_ok"
                        variant="contained"
                        onClick={() => this.handleOk()}
                        color="primary"
                        autoFocus
                        startIcon={<IconClose />}
                    >
                        {this.props.ok || I18n.t('ra_Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
