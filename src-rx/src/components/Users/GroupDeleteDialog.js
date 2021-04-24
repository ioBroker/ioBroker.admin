import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

function GroupDeleteDialog(props) {
    if (!props.open) {
        return null;
    }
    return <Dialog 
        PaperProps={{className: props.classes.dialogPaper + ' ' + props.classes.dialogPaperMini}} 
        open={props.open} 
        onClose={props.onClose}
    >
        <DialogContent className={props.classes.deleteDialog}>
            <h2>
                {props.t('Do you want to delete group ') + props.group.common.name + '?'}
            </h2>
        </DialogContent>
        <DialogActions className={props.classes.dialogActions} >
                <Button onClick={()=>props.deleteGroup(props.group._id)}>Delete</Button>
                <Button onClick={props.onClose}>Cancel</Button>
         </DialogActions> 
    </Dialog>;
}

export default GroupDeleteDialog;