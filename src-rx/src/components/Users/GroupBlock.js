import { useDrop } from 'react-dnd';
import Color from 'color';
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
    const [{ CanDrop, isOver, isCanDrop }, drop] = useDrop(() => ({
        accept: 'user',
        drop: () => ({ group_id: props.group._id }),
        collect: (monitor, item) => ({
            isOver: monitor.isOver(),
            isCanDrop: !!( monitor.canDrop() && canMeDrop( monitor, props ) ),
            CanDrop: monitor.canDrop()
        }),
    }));
    let textColor = !props.group.common.color || Color(props.group.common.color).hsl().object().l > 50 ? 'black' : 'white'; 
    let opacity =  .7; 
    const isActive = CanDrop && isOver;
    if (isActive) {
        opacity = isCanDrop ? 1 : 0.125;
    }
    else if (CanDrop) {
        opacity = isCanDrop ? .75 : .25;
    }
    return <Card 
        style={{ color: textColor, opacity }} 
        ref={drop} 
        className={props.classes.userGroupCard}
    >
        <div 
            className={props.classes.right} 
            style={{color: textColor}}
        >
            <IconButton size="small" onClick={()=>{props.showGroupEditDialog(props.group, false)}}>
                <EditIcon/>
            </IconButton>
            <IconButton 
                size="small" 
                onClick={()=>{props.showGroupDeleteDialog(props.group)}} 
                disabled={props.group.common.dontDelete}>
                    <DeleteIcon/>
                </IconButton>
        </div>
        <CardContent>{JSON.stringify(props.group.common.members)}
            <Typography gutterBottom variant="h5" component="h5" className={props.classes.userGroupTitle}>
                {
                    props.group.common.icon 
                        ? 
                        <img alt="" className={props.classes.icon} src={props.group.common.icon}/> 
                        : 
                        <GroupIcon/>
                } 
                <span>
                    {props.getName(props.group.common.name)}
                </span>
                <span>
                    {props.getName(props.group._id)}
                </span>
                {
                    props.group.common.desc !== '' 
                        ? 
                        <span>
                            {props.group.common.desc}
                        </span> 
                        : 
                        null
                }
            </Typography>
            {
                props.group.common.members.length 
                    ? 
                    <div>{props.t('Group members')}:</div> 
                    : 
                    null
            }
            <div>
            {
                props.group.common.members.map( (member, i) => {
                    let user = props.users.find(user => user._id === member);
                    return user 
                        ? 
                        <Card key={i} className={props.classes.userGroupMember}>
                         {
                            user.common.icon 
                            ? 
                            <img alt="" className={props.classes.icon} src={user.common.icon}/> 
                            : 
                            <PersonIcon/>
                        }
                        {props.getName(user.common.name)} 
                        <IconButton 
                            size="small"
                            onClick={() => props.removeUserFromGroup(member, props.group._id)}
                        >
                            <ClearIcon/>
                        </IconButton>
                    </Card> 
                    : 
                    null;
                })
            }
            </div>
        </CardContent>
    </Card>
}

export default GroupBlock;

export function canMeDrop(monitor, props )
{
    // console.log( monitor.getItem().user_id ); 
    // console.log( props.group.common );
    // console.log( props.group.common.members.filter(e => e == monitor.getItem().user_id).length == 0 );
    return Array.isArray(props.group.common.members) 
        ?
        props.group.common.members.filter(e => e == monitor.getItem().user_id).length == 0
        :
        props.group.common.members == monitor.getItem().user_id

}