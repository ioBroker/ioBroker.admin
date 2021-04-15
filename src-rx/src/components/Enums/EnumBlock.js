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

function EnumBlock(props) {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: 'object',
        drop: () => ({ enum_id: props.enum._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));
    return <Card ref={drop}>
        <h2>{props.enum._id}</h2>
        <div>
            {props.enum.common.members ? props.enum.common.members.map(member => <div>{member}</div>) : null}
        </div>
    </Card>
}

export default EnumBlock;