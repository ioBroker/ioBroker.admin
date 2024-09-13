import React from 'react';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

import type { Translate } from '@iobroker/adapter-react-v5';

interface EnumDeleteDialogProps {
    onClose: () => void;
    enum: ioBroker.EnumObject;
    t: Translate;
    getName: (text: ioBroker.StringOrTranslated) => string;
    deleteEnum: (enumId: string) => void;
}

function EnumDeleteDialog(props: EnumDeleteDialogProps) {
    return (
        <Dialog open={!0} onClose={props.onClose}>
            <DialogTitle>{props.t('Please confirm')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.t('Do you want to delete enum "%s"?', props.getName(props.enum.common.name))}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    color="primary"
                    onClick={() => props.deleteEnum(props.enum._id)}
                    startIcon={<DeleteIcon />}
                >
                    {props.t('Delete')}
                </Button>
                <Button variant="contained" color="grey" onClick={props.onClose} startIcon={<CloseIcon />}>
                    {props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EnumDeleteDialog;
