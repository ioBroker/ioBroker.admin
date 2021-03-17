import { useDrag } from 'react-dnd'
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import CheckBox from '@material-ui/core/CheckBox';
import PersonIcon from '@material-ui/icons/Person';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

function UserBlock(props) {
    const [{ isDragging }, dragRef] = useDrag(
        {
            item: {user_id: props.user._id, type: 'user'},
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item && dropResult) {
                    props.addUserToGroup(item.user_id, dropResult.group_id);
                }
            },
        }
    )
        
    return <Card raised className={props.classes.userGroupCard} ref={dragRef}>
        <div class={props.classes.right}>
            <CheckBox checked={props.user.common.enabled} onChange={e => {
                if (props.user._id == 'system.user.admin') {
                    return;
                }
                props.socket.extendObject(props.user._id, { common: { enabled: !props.user.common.enabled } }).then(()=>
                    props.updateData()
                );
            }}/>
            <IconButton size="small" onClick={()=>{props.showUserEditDialog(props.user)}}><EditIcon/></IconButton>
            <IconButton size="small"><DeleteIcon/></IconButton>
        </div>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.user.common.icon ? <img class={props.classes.icon} src={props.user.common.icon}/> : <PersonIcon/>} 
                <span>{typeof(props.user.common.name) === 'object' ? props.user.common.name.en : props.user.common.name}</span>
            </Typography>
            <div>
                {props.groups.map(group => 
                    group.common.members && group.common.members.includes(props.user._id) ? 
                    <Card className={props.classes.userGroupMember}>
                        {group._id} 
                        <IconButton 
                            size="small"
                            onClick={() => props.removeUserFromGroup(props.user._id, group._id)}
                        >
                            <ClearIcon/>
                        </IconButton>
                    </Card> : 
                    null
                )}
            </div>
        </CardContent>
    </Card>
}

export default UserBlock;