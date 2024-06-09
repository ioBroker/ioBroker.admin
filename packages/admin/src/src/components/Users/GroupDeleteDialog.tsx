import React from 'react';
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

import type { Translate } from '@iobroker/adapter-react-v5/types';

interface GroupDeleteDialogProps {
    t: Translate;
    onClose: () => void;
    group: ioBroker.GroupObject;
    deleteGroup: (groupId: string) => void;
    classes: Record<string, string>;
}

export default function GroupDeleteDialog(props: GroupDeleteDialogProps): React.JSX.Element {
    return <Dialog
        open={!0}
        onClose={props.onClose}
    >
        <DialogTitle>{props.t('Please confirm')}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {props.t('Do you want to delete group %s?', props.group.common.name)}
            </DialogContentText>
        </DialogContent>
        <DialogActions className={props.classes.dialogActions}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => props.deleteGroup(props.group._id)}
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
    </Dialog>;
}
