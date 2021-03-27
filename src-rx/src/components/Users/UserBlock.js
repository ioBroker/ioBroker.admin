import { useDrag } from 'react-dnd';
import Color from 'color';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import CheckBox from '@material-ui/core/CheckBox';
import PersonIcon from '@material-ui/icons/Person';
import GroupIcon from '@material-ui/icons/Group';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

function UserBlock(props) {
    const [{ isDragging }, dragRef] = useDrag(
        {
            type: 'user',
            item: {user_id: props.user._id},
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item && dropResult) {
                    props.addUserToGroup(item.user_id, dropResult.group_id);
                }
            },
        }
    );

    let textColor = !props.user.common.color || Color(props.user.common.color).hsl().object().l > 50 ? 'black' : 'white';
    return <Card raised style={{backgroundColor: props.user.common.color, color: textColor, cursor: 'grab'}} className={props.classes.userGroupCard} ref={dragRef}>
        <div className={props.classes.right}>
            <CheckBox checked={props.user.common.enabled} disabled={props.user.common.dontDelete} onChange={e => {
                props.socket.extendObject(props.user._id, { common: { enabled: !props.user.common.enabled } }).then(()=>
                    props.updateData()
                );
            }}/>
            <IconButton size="small" onClick={()=>{props.showUserEditDialog(props.user, false)}}><EditIcon/></IconButton>
            <IconButton size="small" onClick={()=>{props.showUserDeleteDialog(props.user)}} disabled={props.user.common.dontDelete}><DeleteIcon/></IconButton>
        </div>
        <CardContent>
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {props.user.common.icon ? <img alt="" className={props.classes.icon} src={props.user.common.icon}/> : <PersonIcon/>}
                <span>{props.getName(props.user.common.name)}</span>
                <span>&nbsp;{props.getName(props.user._id)}</span>
                <span>{props.user.common.desc !== '' ? <span>&nbsp;({props.user.common.desc})</span> : null}</span>
            </Typography>
            {props.groups.find(group => group.common.members && group.common.members.includes(props.user._id)) ?
                <div>{props.t('In groups')}:</div> :
            null}
            <div>
                {props.groups.map(group =>
                    group.common.members && group.common.members.includes(props.user._id) ?
                    <Card key={group._id} className={props.classes.userGroupMember}>
                        {group.common.icon ? <img alt="" className={props.classes.icon} src={group.common.icon}/> : <GroupIcon/>}
                        {props.getName(group.common.name)}
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