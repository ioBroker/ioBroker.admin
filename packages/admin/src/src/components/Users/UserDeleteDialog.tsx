import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from '@mui/material';

import {
    Close as IconCancel,
    Delete as IconDelete,
} from '@mui/icons-material';

import React from 'react';
import type { Translator } from '@iobroker/adapter-react-v5/types';

interface UserDeleteDialogProps {
    t: Translator;
    open: boolean;
    onClose: () => void;
    user: ioBroker.UserObject;
    deleteUser: (userId: string) => void;
}

const UserDeleteDialog: React.FC<UserDeleteDialogProps> = props => {
    if (!props.open) {
        return null;
    }

    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>{props.t('Please confirm')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.t('Do you want to delete user %s?', props.user.common.name)}
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
};

export default UserDeleteDialog;
