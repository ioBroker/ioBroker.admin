import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import Color from 'color';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Icon from '@iobroker/adapter-react/Components/Icon';

import IconButton from '@material-ui/core/IconButton';
import ListIcon from '@material-ui/icons/List';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DownIcon from '@material-ui/icons/KeyboardArrowDown';
import UpIcon from '@material-ui/icons/KeyboardArrowUp';


function EnumBlock(props) {

    const opacity = props.isDragging ? 0 : 1;

    let textColor = !props.enum || !props.enum.common || !props.enum.common.color || Color(props.enum.common.color).hsl().object().l > 50 ? '#000000' : '#FFFFFF';

    if (!props.enum.common.color) {
        textColor = null;
    }
    let style = { opacity, color: textColor }
    if (props.enum.common.color) {
        style.backgroundColor = props.enum.common.color;
    }
    return <Card
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
                        onClick={()=>{props.copyEnum(props.enum._id)}}
                    >
                        <FileCopyIcon style={{ color: textColor }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={()=>{props.showEnumDeleteDialog(props.enum)}}
                        disabled={props.enum.common.dontDelete}
                    >
                        <DeleteIcon style={props.enum.common.dontDelete ? null : { color: textColor }} />
                    </IconButton>
                </div>
                <CardContent>
                    <Typography gutterBottom component="div" className={props.classes.enumGroupTitle}>
                        {
                            props.enum.common.icon
                                ?
                                <Icon
                                    className={ props.classes.icon }
                                    src={props.enum.common.icon}
                                />
                                :
                                <ListIcon className={props.classes.icon} />
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
                        {props.enum?.common?.members ? props.enum.common.members.map(memberId => {
                            let member = props.members[memberId];
                            if (!member) {
                                return null;
                            }
                            const name = member.common?.name && props.getName(member.common?.name);

                            return <Card
                                key={member._id}
                                title={name ? props.t('Name: %s', name) + '\nID: ' +  member._id : member._id}
                                variant="outlined"
                                className={props.classes.enumGroupMember}
                                style={{ color: textColor, borderColor: textColor + "40" }}
                            >
                                {
                                    member.common?.icon
                                        ?
                                        <Icon
                                            className={ props.classes.icon }
                                            src={member.common.icon}
                                        />
                                        :
                                        <ListIcon className={props.classes.icon} />
                                    }
                                {name || member._id}
                                <IconButton
                                    size="small"
                                    onClick={() => props.removeMemberFromEnum(member._id, props.enum._id)}
                                >
                                    <ClearIcon  style={{ color: textColor }} />
                                </IconButton>
                            </Card>
                        }) : null}
                    </div>
                </CardContent>
            </div>
            {props.hasChildren ?
                <IconButton style={{position: 'absolute', 'right': 0, 'bottom': 0}} onClick={()=>props.toggleEnum(props.enum._id)}>
                    {props.closed ?
                        <DownIcon style={{ color: textColor }}/>
                    :
                        <UpIcon style={{ color: textColor }}/>
                    }
                </IconButton>
            : null}
        </Card>
}

const EnumBlockDrag = (props) => {
    const [{ canDrop, isOver, isCanDrop }, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({ enumId: props.enum._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    const widthRef = useRef();
    const [{ isDragging }, dragRef, preview] = useDrag(
        {
            type: 'enum',
            item: () => {return {enumId: props.enum._id, preview: <div style={{width: widthRef.current.offsetWidth}}><EnumBlock {...props}/></div>}},
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
                props.moveEnum(item.enumId, dropResult.enumId);
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
                handlerId: monitor.getHandlerId(),
            }),
        }
    );
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={drop} style={{opacity: canDrop && isOver ? 0.5 : 1 }}>
        <div ref={dragRef}>
            <div ref={widthRef}>
                <EnumBlock isDragging={isDragging} widthRef={widthRef} {...props}/>
            </div>
        </div>
    </div>;
}

EnumBlockDrag.propTypes = {
    enum: PropTypes.object,
    members: PropTypes.array,
    moveEnum: PropTypes.func,
    removeMemberFromEnum: PropTypes.func,
    showEnumEditDialog: PropTypes.func,
    showEnumDeleteDialog: PropTypes.func,
    copyEnum: PropTypes.func,
    getName: PropTypes.func,
    hasChildren: PropTypes.bool,
    closed: PropTypes.bool,
    toggleEnum: PropTypes.func,
    classes: PropTypes.object,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
};

export default EnumBlockDrag;