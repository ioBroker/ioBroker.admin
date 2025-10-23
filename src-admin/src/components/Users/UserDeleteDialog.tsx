import React, { type JSX } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

import { Close as IconCancel, Delete as IconDelete } from '@mui/icons-material';

import { type Translate } from '@iobroker/adapter-react-v5';

interface UserDeleteDialogProps {
    t: Translate;
    onClose: () => void;
    user: ioBroker.UserObject;
    deleteUser: (userId: string) => void;
    getText: (text: ioBroker.StringOrTranslated) => string;
}

export default function UserDeleteDialog(props: UserDeleteDialogProps): JSX.Element {
    return (
        <Dialog
            open={!0}
            onClose={props.onClose}
        >
            <DialogTitle>{props.t('Please confirm')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.t('Do you want to delete user %s?', props.getText(props.user.common.name))}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => props.deleteUser(props.user._id)}
                    startIcon={<IconDelete />}
                >
                    {props.t('Delete')}
                </Button>
                <Button
                    variant="contained"
                    color="grey"
                    autoFocus
                    onClick={props.onClose}
                    startIcon={<IconCancel />}
                >
                    {props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
