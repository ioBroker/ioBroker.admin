/**
 * Copyright 2019-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */

// please do not delete React, as without it other projects could not be compiled: ReferenceError: React is not defined
import React, { Component, type JSX } from 'react';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

import { Check as IconCheck, Close as IconClose } from '@mui/icons-material';

import { I18n } from '../i18n';

const styles: Record<string, React.CSSProperties> = {
    suppress: {
        fontSize: 12,
    },
    suppressRoot: {
        // it is sx
        marginTop: '16px',
    },
};

interface DialogConfirmProps {
    /** The dialog title; default: Are you sure? (translated) */
    title?: string;
    /** The dialog text */
    text?: string | React.JSX.Element | React.JSX.Element[];
    /** Close handler. */
    onClose?: (ok: boolean) => void;
    /** if the dialog must be fill sized */
    fullWidth?: boolean;
    /** optional icon */
    icon?: React.JSX.Element;
    /** optional ok button text */
    ok?: string;
    /** optional cancel button text */
    cancel?: string;
    /** optional interval in minutes for which the confirmation dialog will be suppressed if activated. */
    suppressQuestionMinutes?: number;
    /** optional text for the suppression checkbox */
    suppressText?: string;
    /** optional name of the dialog. Used only with suppressQuestionMinutes to store the user choice */
    dialogName?: string;
}

interface DialogConfirmState {
    suppress: number | boolean;
}

export class DialogConfirm extends Component<DialogConfirmProps, DialogConfirmState> {
    constructor(props: DialogConfirmProps) {
        super(props);

        if (!this.props.dialogName && this.props.suppressQuestionMinutes) {
            throw new Error('dialogName required if suppressQuestionMinutes used');
        }
        let suppress: number | boolean = false;

        if (this.props.suppressQuestionMinutes) {
            suppress =
                parseInt(((window as any)._localStorage || window.localStorage).getItem(this.props.dialogName), 10) ||
                0;

            if (!suppress) {
                suppress = false;
            } else if (Date.now() > suppress) {
                ((window as any)._localStorage || window.localStorage).removeItem(this.props.dialogName);
                suppress = false;
            }
        }

        this.state = {
            suppress,
        };
    }

    handleOk(): void {
        if (this.state.suppress) {
            ((window as any)._localStorage || window.localStorage).setItem(
                this.props.dialogName,
                Date.now() + (this.props.suppressQuestionMinutes || 2) * 60000,
            );
        }
        if (this.props.onClose) {
            this.props.onClose(true);
        }
    }

    handleCancel(): void {
        if (this.props.onClose) {
            this.props.onClose(false);
        }
    }

    render(): JSX.Element | null {
        if (typeof this.state.suppress === 'number') {
            setTimeout(() => this.props.onClose && this.props.onClose(true), 100);
            return null;
        }

        return (
            <Dialog
                open={!0}
                maxWidth="md"
                fullWidth={this.props.fullWidth !== undefined ? this.props.fullWidth : true}
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        this.handleCancel();
                    }
                }}
                aria-labelledby="ar_confirmation_dialog_title"
                aria-describedby="ar_confirmation_dialog_description"
            >
                <DialogTitle id="ar_confirmation_dialog_title">
                    {this.props.title || I18n.t('ra_Are you sure?')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="ar_confirmation_dialog_description">
                        {this.props.icon || null}
                        {this.props.text}
                        {this.props.suppressQuestionMinutes ? <br /> : null}
                        {this.props.suppressQuestionMinutes ? (
                            <FormControlLabel
                                sx={{
                                    '& .FormControlLabel-label': styles.suppress,
                                    '&.FormControlLabel-root': styles.suppressRoot,
                                }}
                                control={
                                    <Checkbox
                                        id={`ar_dialog_confirm_suppress_${this.props.dialogName || ''}`}
                                        checked={!!this.state.suppress}
                                        onChange={() => this.setState({ suppress: !this.state.suppress })}
                                    />
                                }
                                label={
                                    this.props.suppressText ||
                                    I18n.t(
                                        'ra_Suppress question for next %s minutes',
                                        (this.props.suppressQuestionMinutes || 2).toString(),
                                    )
                                }
                            />
                        ) : null}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        id={`ar_dialog_confirm_ok_${this.props.dialogName || ''}`}
                        variant="contained"
                        onClick={() => this.handleOk()}
                        color="primary"
                        autoFocus
                        startIcon={<IconCheck />}
                    >
                        {this.props.ok || I18n.t('ra_Ok')}
                    </Button>
                    <Button
                        id={`ar_dialog_confirm_cancel_${this.props.dialogName || ''}`}
                        variant="contained"
                        onClick={() => this.handleCancel()}
                        color="grey"
                        startIcon={<IconClose />}
                    >
                        {this.props.cancel || I18n.t('ra_Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
