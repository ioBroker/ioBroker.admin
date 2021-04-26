import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

function UserDeleteDialog(props) {
    if (!props.open) {
        return null;
    }
    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.deleteDialog}>
            <h2>
                {props.t('Do you want to delete user ') + props.user.common.name + '?'}
            </h2>
            <div>
                <Button onClick={()=>props.deleteUser(props.user._id)}>{props.t('Delete')}</Button>
                <Button onClick={props.onClose}>{props.t('Cancel')}</Button>
            </div>
        </Box>
    </Dialog>;
}

export default UserDeleteDialog;