import { useDrop } from 'react-dnd'
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import GroupIcon from '@material-ui/icons/Group';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

function GroupBlock(props) {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: 'user',
        drop: () => ({ group_id: props.group._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));
    return <Card ref={drop} raised className={props.classes.userGroupCard}>
        <div class={props.classes.right}>
        <IconButton size="small" onClick={()=>{props.showGroupEditDialog(props.group)}}><EditIcon/></IconButton>
            <IconButton size="small"><DeleteIcon/></IconButton>
        </div>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.group.common.icon ? <img class={props.classes.icon} src={props.group.common.icon}/> : <GroupIcon/>} 
                <span>{typeof(props.group.common.name) === 'object' ? props.group.common.name.en : props.group.common.name}</span>
            </Typography>
            <div>
                {props.group.common.members.map(member => 
                    <Card className={props.classes.userGroupMember}>
                        {member} 
                        <IconButton 
                            size="small"
                            onClick={() => props.removeUserFromGroup(member, props.group._id)}
                        >
                            <ClearIcon/>
                        </IconButton>
                    </Card>
                )}
            </div>
        </CardContent>
    </Card>
}

export default GroupBlock;