import React, { useRef, useEffect } from 'react';
import { /* DragPreviewImage, */useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import {
    Typography,
    Card,
    CardContent,
    IconButton,
    Checkbox,
} from '@mui/material';

import {
    Person as PersonIcon,
    Group as GroupIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

import {
    Icon, Utils,
    type AdminConnection, type Translate, type ThemeType,
} from '@iobroker/adapter-react-v5';

interface UserBlockProps {
    t: Translate;
    user: ioBroker.UserObject;
    groups: ioBroker.GroupObject[];
    showUserEditDialog: (user: ioBroker.UserObject, isNew: boolean) => void;
    showUserDeleteDialog: (user: ioBroker.UserObject) => void;
    updateData: () => void;
    // eslint-disable-next-line react/no-unused-prop-types
    addUserToGroup?: (userId: string, groupId: string) => void;
    removeUserFromGroup: (userId: string, groupId: string) => void;
    getText: (text: ioBroker.StringOrTranslated) => string;
    themeType: ThemeType;
    styles: Record<string, any>;
    socket: AdminConnection;
    isDragging?: boolean;
}

const UserBlock: React.FC<UserBlockProps> = props => {
    const opacity = props.isDragging ? 0 : 1;

    const textColor = Utils.getInvertedColor(props.user.common.color, props.themeType, true);

    const style: React.CSSProperties = {
        cursor: 'grab', opacity, overflow: 'hidden', color: textColor,
    };
    if (props.user.common.color) {
        style.backgroundColor = props.user.common.color;
    }

    /* return <>
    { <DragPreviewImage connect={preview}/> } */
    return <Card
        style={style}
        sx={props.styles.userGroupCard2}
    >
        <div style={props.styles.userCardContent}>
            <div style={props.styles.right}>
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
                <Typography gutterBottom component="div" style={props.styles.userGroupTitle}>
                    {
                        props.user.common.icon ?
                            <Icon
                                style={props.styles.icon}
                                src={props.user.common.icon}
                            />
                            :
                            <PersonIcon style={props.styles.icon} />
                    }
                    <div>
                        <div>
                            <span style={props.styles.userGroupUserName}>
                                {props.getText(props.user.common.name)}
                            </span>
                            <span style={props.styles.userGroupUserID}>
                                [
                                {props.user._id}
]
                            </span>
                        </div>
                        <span>
                            {
                                props.user.common.desc ?
                                    <div style={props.styles.description}>
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
                            sx={props.styles.userGroupMember}
                            style={{ color: _textColor, borderColor: `${_textColor}80`, background: group.common?.color || 'inherit' }}
                        >
                            {
                                group.common.icon ?
                                    <Icon
                                        style={props.styles.icon}
                                        src={group.common.icon}
                                    />
                                    :
                                    <GroupIcon style={props.styles.icon} />
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
};

const UserBlockDrag: React.FC<UserBlockProps> = props => {
    const widthRef = useRef<HTMLDivElement>();
    const [{ isDragging }, dragRef, preview] = useDrag(
        {
            type: 'user',
            item: () => ({
                userId: props.user._id,
                preview: <div style={{ width: widthRef.current?.offsetWidth }}><UserBlock {...props} /></div>,
            }),
            end: (item, monitor) => {
                const dropResult = monitor.getDropResult<{groupId: string}>();
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
            <UserBlock isDragging={isDragging} {...props} />
        </div>
    </div>;
};

export default UserBlockDrag;
