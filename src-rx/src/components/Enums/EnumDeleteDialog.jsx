import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

function EnumDeleteDialog(props) {
    if (!props.open) {
        return null;
    }

    return <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>{props.t('Please confirm')}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {props.t('Do you want to delete enum "%s"?', props.getName(props.enum.common.name))}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button variant="contained" autoFocus color="primary" onClick={() => props.deleteEnum(props.enum._id)} startIcon={<DeleteIcon />}>{props.t('Delete')}</Button>
            <Button variant="contained" onClick={props.onClose} startIcon={<CloseIcon />}>{props.t('Cancel')}</Button>
        </DialogActions>
    </Dialog>;
}

EnumDeleteDialog.propTypes = {
    enum: PropTypes.object,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    classes: PropTypes.object,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
};

export default EnumDeleteDialog;