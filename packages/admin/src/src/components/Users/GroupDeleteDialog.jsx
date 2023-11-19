import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import DialogContentText from '@mui/material/DialogContentText';

import IconDelete from '@mui/icons-material/Delete';
import IconCancel from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';

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
            <Button variant="contained" color="primary" onClick={() => props.deleteGroup(props.group._id)} startIcon={<IconDelete />}>{props.t('Delete')}</Button>
            <Button variant="contained" color="grey" autoFocus onClick={props.onClose} startIcon={<IconCancel />}>{props.t('Cancel')}</Button>
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
