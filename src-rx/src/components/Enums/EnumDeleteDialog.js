import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

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
            <Button variant="contained" autoFocus color="primary" onClick={() => props.deleteEnum(props.enum._id)}>{props.t('Delete')}</Button>
            <Button variant="contained" onClick={props.onClose}>{props.t('Cancel')}</Button>
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