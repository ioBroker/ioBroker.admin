import React, { type JSX } from 'react';

import { Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import { Close as IconClose, Check as IconCheck } from '@mui/icons-material';

import { I18n } from '../i18n';
import { withWidth } from '../Components/withWidth';

interface TextInputProps {
    /** The dialog close callback */
    onClose: (text: string | null) => void;
    /** The title text */
    titleText: string;
    /** Prompt text (default: empty) */
    promptText?: string;
    /** Label text (default: empty) */
    labelText?: string;
    /** The text of the cancel button */
    cancelText: string;
    /** The text of the "apply" button */
    applyText: string;
    /** The verification callback. Return a non-empty string if there was an error */
    verify?: (text: string) => string;
    /** The text replacement callback */
    rule?: (text: string) => string;
    /** The type of the textbox (default: text) */
    type?: 'text' | 'number' | 'password' | 'email';
    /** The initial input value when opening the dialog */
    value?: string;
    /** @deprecated Use value. The input when opening the dialog */
    input?: string;
    /** If true, the dialog will be full width */
    fullWidth?: boolean;
}

function TextInputFunc(props: TextInputProps): JSX.Element {
    const [text, setText] = React.useState<string>(props.input || props.value || '');
    const [error, setError] = React.useState<string | boolean>('');
    return (
        <Dialog
            open={!0}
            onClose={() => props.onClose(null)}
            aria-labelledby="form-dialog-title"
            fullWidth={props.fullWidth !== undefined ? props.fullWidth : false}
        >
            <DialogTitle id="form-dialog-title">{props.titleText}</DialogTitle>
            <DialogContent>
                <DialogContentText>{props.promptText}</DialogContentText>
                <TextField
                    variant="standard"
                    autoFocus
                    margin="dense"
                    error={!!error}
                    helperText={error === true || !error ? '' : error}
                    value={text}
                    label={props.labelText || ''}
                    type={props.type || 'text'}
                    onKeyUp={e => e.code === 'Enter' && text && props.onClose(text)}
                    onChange={e => {
                        let _error: string | boolean = '';
                        if (props.verify) {
                            _error = !props.verify(e.target.value);
                        }

                        if (props.rule) {
                            setText(props.rule(e.target.value));
                        } else {
                            setText(e.target.value);
                        }
                        setError(_error);
                    }}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={!text || !!error}
                    onClick={() => props.onClose(text)}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {props.applyText || I18n.t('ra_Ok')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => props.onClose(null)}
                    startIcon={<IconClose />}
                >
                    {props.cancelText || I18n.t('ra_Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export const DialogTextInput = withWidth()(TextInputFunc);
