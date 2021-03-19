import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

function GroupDeleteDialog(props) {
    if (!props.open) {
        return null;
    }
    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.deleteDialog}>
            <h2>
                {props.t('Do you want to delete group ') + props.group.common.name + '?'}
            </h2>
            <div>
                <Button onClick={()=>props.deleteGroup(props.group._id)}>Delete</Button>
                <Button onClick={props.onClose}>Cancel</Button>
            </div>
        </Box>
    </Dialog>;
}

export default GroupDeleteDialog;