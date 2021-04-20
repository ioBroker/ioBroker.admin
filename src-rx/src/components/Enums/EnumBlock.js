import { useDrop, useDrag } from 'react-dnd';
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

function EnumBlock(props) {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({ enum_id: props.enum._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    const [{ isDragging }, dragRef] = useDrag(
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
    
    return <div ref={drop}>
        <Card ref={dragRef}>
            <h2>{props.enum._id}</h2>
            <div>
                {props.enum.common.members ? props.enum.common.members.map(member => <div key={member}>{member}</div>) : null}
            </div>
        </Card>
    </div>
}

export default EnumBlock;