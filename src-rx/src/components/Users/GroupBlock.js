import { useDrop } from 'react-dnd'
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import GroupIcon from '@material-ui/icons/Group';
import PersonIcon from '@material-ui/icons/Person';
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
    return <Card style={{backgroundColor: props.group.common.color}} ref={drop} raised className={props.classes.userGroupCard}>
        <div class={props.classes.right}>
        <IconButton size="small" onClick={()=>{props.showGroupEditDialog(props.group)}}><EditIcon/></IconButton>
            <IconButton size="small" disabled={props.group.common.dontDelete}><DeleteIcon/></IconButton>
        </div>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.group.common.icon ? <img alt="" class={props.classes.icon} src={props.group.common.icon}/> : <GroupIcon/>} 
                <span>{props.getName(props.group.common.name)}</span>
                {props.group.common.desc !== '' ? <span>&nbsp;({props.group.common.desc})</span> : null}
            </Typography>
            <div>
                {props.group.common.members.map(member => {
                    let user = props.users.find(user => user._id === member);
                    return <Card className={props.classes.userGroupMember}>
                        {user.common.icon ? <img alt="" class={props.classes.icon} src={user.common.icon}/> : <PersonIcon/>}
                        {props.getName(user.common.name)} 
                        <IconButton 
                            size="small"
                            onClick={() => props.removeUserFromGroup(member, props.group._id)}
                        >
                            <ClearIcon/>
                        </IconButton>
                    </Card>
                })}
            </div>
        </CardContent>
    </Card>
}

export default GroupBlock;