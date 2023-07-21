import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';
import { /* DragPreviewImage, */useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';

import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import Icon from '@iobroker/adapter-react-v5/Components/Icon';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

function UserBlock(props) {
    const opacity = props.isDragging ? 0 : 1;

    const textColor = Utils.getInvertedColor(props.user.common.color, props.themeType, true);

    const style = {
        cursor: 'grab', opacity, overflow: 'hidden', color: textColor,
    };
    if (props.user.common.color) {
        style.backgroundColor = props.user.common.color;
    }

    /* return <>
    { <DragPreviewImage connect={preview}/> } */
    return <Card
        style={style}
        className={props.classes.userGroupCard2}
    >
        <div className={props.classes.userCardContent}>
            <div className={props.classes.right}>
                <Checkbox
                    checked={props.user.common.enabled}
                    style={{ color: textColor }}
                    disabled={props.user.common.dontDelete}
                    onChange={() => {
                        props.socket.extendObject(
                            props.user._id,
                            {
                                common: {
                                    enabled: !props.user.common.enabled,
                                },
                            },
                        ).then(() =>
                            props.updateData());
                    }}
                />
                <IconButton
                    size="small"
                    onClick={() => props.showUserEditDialog(props.user, false)}
                >
                    <EditIcon style={{ color: textColor }} />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => props.showUserDeleteDialog(props.user)}
                    disabled={props.user.common.dontDelete}
                >
                    <DeleteIcon style={props.user.common.dontDelete ? null : { color: textColor }} />
                </IconButton>
            </div>
            <CardContent>
                <Typography gutterBottom component="div" className={props.classes.userGroupTitle}>
                    {
                        props.user.common.icon ?
                            <Icon
                                className={props.classes.icon}
                                src={props.user.common.icon}
                            />
                            :
                            <PersonIcon className={props.classes.icon} />
                    }
                    <div>
                        <div>
                            <span className={props.classes.userGroupUserName}>
                                {props.getText(props.user.common.name)}
                            </span>
                            <span className={props.classes.userGroupUserID}>
                                [
                                {props.user._id}
]
                            </span>
                        </div>
                        <span>
                            {
                                props.user.common.desc ?
                                    <div className={props.classes.description}>
                                        {props.getText(props.user.common.desc)}
                                    </div>
                                    : null
                            }
                        </span>
                    </div>
                </Typography>
                {props.groups.find(group => group.common.members && group.common.members.includes(props.user._id)) ?
                    <div>
                        {props.t('In groups')}
:
                    </div> : null}
                <div>
                    {props.groups.map(group => {
                        if (!group.common.members || !group.common.members.includes(props.user._id)) {
                            return null;
                        }
                        const _textColor = group && group.common?.color ? Utils.getInvertedColor(group.common.color, props.themeType, true) : textColor;

                        return <Card
                            key={group._id}
                            variant="outlined"
                            className={props.classes.userGroupMember}
                            style={{ color: _textColor, borderColor: `${_textColor}80`, background: group.common?.color || 'inherit' }}
                        >
                            {
                                group.common.icon ?
                                    <Icon
                                        className={props.classes.icon}
                                        src={group.common.icon}
                                    />
                                    :
                                    <GroupIcon className={props.classes.icon} />
                            }
                            {props.getText(group.common.name)}
                            <IconButton
                                size="small"
                                onClick={() => props.removeUserFromGroup(props.user._id, group._id)}
                            >
                                <ClearIcon style={{ color: _textColor }} />
                            </IconButton>
                        </Card>;
                    })}
                </div>
            </CardContent>
        </div>
    </Card>;
    // </>
}

const UserBlockDrag = props => {
    const widthRef = useRef();
    const [{ isDragging }, dragRef, preview] = useDrag(
        {
            type: 'user',
            item: () => ({ userId: props.user._id, preview: <div style={{ width: widthRef.current.offsetWidth }}><UserBlock {...props} /></div> }),
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item && dropResult) {
                    props.addUserToGroup(item.userId, dropResult.groupId);
                }
            },
            collect: monitor => ({
                isDragging: monitor.isDragging(),
                handlerId: monitor.getHandlerId(),
            }),
        },
    );

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    return <div ref={dragRef}>
        <div ref={widthRef}>
            <UserBlock isDragging={isDragging} widthRef={widthRef} {...props} />
        </div>
    </div>;
};

UserBlockDrag.propTypes = {
    t: PropTypes.func,
    user: PropTypes.object,
    groups: PropTypes.array,
    showUserEditDialog: PropTypes.func,
    showUserDeleteDialog: PropTypes.func,
    updateData: PropTypes.func,
    addUserToGroup: PropTypes.func,
    removeUserFromGroup: PropTypes.func,
    getText: PropTypes.func,
};

export default UserBlockDrag;
