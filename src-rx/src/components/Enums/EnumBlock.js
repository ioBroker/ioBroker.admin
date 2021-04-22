import { DragPreviewImage, useDrag, useDrop } from 'react-dnd';
import Color from 'color';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import PersonIcon from '@material-ui/icons/Person';
import GroupIcon from '@material-ui/icons/Group';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

function EnumBlock(props) {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({ enum_id: props.enum._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    const [{ isDragging }, dragRef, preview] = useDrag(
        {
            type: 'enum',
            item: {enum_id: props.enum._id}, 
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
                props.moveEnum(item.enum_id, dropResult.enum_id);
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
                handlerId: monitor.getHandlerId(),
            }),
        }
    );
    
    const opacity = isDragging ? 0.4 : 1; 

    let textColor = !props.enum ||  !props.enum.common || !props.enum.common.color || Color(props.enum.common.color).hsl().object().l > 50 ? '#000000' : '#FFFFFF';
    let style = { cursor: 'grab', opacity, overflow: "hidden", color: textColor }
    if( props.enum.common.color )
    {
        style.backgroundColor = props.enum.common.color;
    }
    return <div ref={drop}>
        <DragPreviewImage connect={preview}/>
        <Card   ref={dragRef}
            style={ style } 
            className={props.classes.enumGroupCard2} 
        
            
        >
            <div className={props.classes.enumCardContent}>
                <div className={props.classes.right}>
                    <IconButton 
                        size="small" 
                        onClick={()=>{props.showEnumEditDialog(props.enum, false)}}
                    >
                        <EditIcon style={{ color: textColor }} />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={()=>{props.showEnumDeleteDialog(props.enum)}} 
                        disabled={props.enum.common.dontDelete}
                    >
                        <DeleteIcon style={{ color: textColor }} />
                    </IconButton>
                </div>
                <CardContent>
                    <Typography gutterBottom component="div" className={props.classes.enumGroupTitle}>
                        {
                            props.enum.common.icon
                                ? 
                                <span
                                    className={ props.classes.icon }
                                    style={{ backgroundImage: "url(" + props.enum.common.icon + ")" }}
                                />
                                : 
                                <PersonIcon className={props.classes.icon} />
                        }
                        <div>
                            <div>
                                <span className={props.classes.enumGroupEnumName}>
                                    {props.getName(props.enum.common.name)}
                                </span>
                                <span className={props.classes.enumGroupEnumID}> 
                                    {props.enum._id}
                                </span>
                            </div>
                            <span>
                            {
                                props.enum.common.desc !== '' 
                                    ? 
                                    <div className={props.classes.enumName}> 
                                        {props.getName(props.enum.common.desc)}
                                    </div> 
                                    : 
                                    null
                            }
                            </span>
                        </div>
                    </Typography>
                    <div >
                        {props.enum.common.members ? props.enum.common.members.map(member => member
                            // group.common.members && group.common.members.includes(props.enum._id) ?
                            // <Card 
                            //     key={group._id}  
                            //     variant="outlined" 
                            //     className={props.classes.enumGroupMember}
                            //     style={{ color: textColor, borderColor: textColor + "40" }}
                            // >
                            //     {
                            //         group.common.icon 
                            //             ? 
                            //             <span
                            //                 className={ props.classes.icon }
                            //                 style={{ backgroundImage: "url(" + group.common.icon + ")" }}
                            //             /> 
                            //             : 
                            //             <GroupIcon className={props.classes.icon} />
                            //         }
                            //     {props.getName(group.common.name)}
                            //     <IconButton
                            //         size="small"
                            //         onClick={() => props.removeEnumFromGroup(props.enum._id, group._id)}
                            //     >
                            //         <ClearIcon  style={{ color: textColor }} />
                            //     </IconButton>
                            // </Card>
                            // : null
                        ) : null}
                    </div>
                </CardContent>
            </div>
        </Card> 
    </div>
}

export default EnumBlock;