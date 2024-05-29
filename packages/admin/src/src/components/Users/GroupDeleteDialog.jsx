import PropTypes from 'prop-types';

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

function GroupDeleteDialog(props) {
    if (!props.open) {
        return null;
    }
    return <Dialog
        open={props.open}
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

GroupDeleteDialog.propTypes = {
    t: PropTypes.func,
    open: PropTypes.bool,
    onClose: PropTypes.func,
    group: PropTypes.object,
    deleteGroup: PropTypes.func,
};

export default GroupDeleteDialog;
