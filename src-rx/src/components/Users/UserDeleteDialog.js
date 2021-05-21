import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import IconCancel from "@material-ui/icons/Close";
import IconDelete from "@material-ui/icons/Delete";
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

function UserDeleteDialog(props) {
    if (!props.open) {
        return null;
    }

    return <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>{props.t('Please confirm')}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {props.t('Do you want to delete user %s?', props.user.common.name)}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button variant="contained" color="primary" onClick={() => props.deleteUser(props.user._id)} startIcon={<IconDelete />}>{props.t('Delete')}</Button>
            <Button variant="contained" autoFocus onClick={props.onClose} startIcon={<IconCancel/>}>{props.t('Cancel')}</Button>
        </DialogActions>
    </Dialog>;
}

UserDeleteDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    open: PropTypes.bool,
    onClose: PropTypes.func,
    user: PropTypes.object,
    deleteUser: PropTypes.func,
};

export default UserDeleteDialog;