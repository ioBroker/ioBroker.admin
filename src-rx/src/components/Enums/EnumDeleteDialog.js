import PropTypes from 'prop-types';

import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

function EnumDeleteDialog(props) {
    if (!props.open) {
        return null;
    }
    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.deleteDialog}>
            <h2>
                {props.t('Do you want to delete enum ') + props.enum.common.name + '?'}
            </h2>
            <div>
                <Button onClick={()=>props.deleteEnum(props.enum._id)}>Delete</Button>
                <Button onClick={props.onClose}>Cancel</Button>
            </div>
        </Box>
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