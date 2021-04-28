import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconDelete from "@material-ui/icons/Delete";
import IconCancel from "@material-ui/icons/Close";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContentText from '@material-ui/core/DialogContentText';

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
        <DialogActions className={props.classes.dialogActions} >
            <Button variant="contained" color="primary" onClick={()=>props.deleteGroup(props.group._id)}><IconDelete style={{marginRight: 8}}/>{props.t('Delete')}</Button>
            <Button variant="contained" autoFocus onClick={props.onClose}><IconCancel style={{marginRight: 8}}/>{props.t('Cancel')}</Button>
         </DialogActions>
    </Dialog>;
}

GroupDeleteDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    open: PropTypes.bool,
    onClose: PropTypes.func,
    group: PropTypes.object,
    deleteGroup: PropTypes.func,
};

export default GroupDeleteDialog;