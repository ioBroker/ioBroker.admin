import React from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import {
    Typography,
    Card,
    CardContent,
    IconButton,
} from '@mui/material';

import {
    Person as PersonIcon,
    Group as GroupIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

import { Utils, Icon, type Translate } from '@iobroker/adapter-react-v5';

interface GroupBlockProps {
    t: Translate;
    group: ioBroker.GroupObject;
    users: ioBroker.UserObject[];
    showGroupEditDialog: (group: ioBroker.GroupObject, isNew: boolean) => void;
    showGroupDeleteDialog: (group: ioBroker.GroupObject) => void;
    removeUserFromGroup: (userId: string, groupId: string) => void;
    getText: (text: ioBroker.StringOrTranslated) => string;
    themeType: string;
    classes: Record<string, string>;
}

function canMeDrop(monitor: DropTargetMonitor<{userId: ioBroker.ObjectIDs.User}>, props: GroupBlockProps) {
    return props.group.common.members ? !props.group.common.members.includes(monitor.getItem().userId) : true;
}

const GroupBlock: React.FC<GroupBlockProps> = props => {
    const [{ CanDrop, isOver/* , isCanDrop */ }, drop] = useDrop(() => ({
        accept: 'user',
        drop: () => ({ groupId: props.group._id }),
        canDrop: (item, monitor) => canMeDrop(monitor, props),
        collect: monitor => ({
            isOver: monitor.isOver(),
            CanDrop: monitor.canDrop(),
        }),
    }), [props.group.common.members]);

    let opacity =  0.7;
    let backgroundColor = '';
    const isActive = CanDrop && isOver;

    if (isActive) {
        opacity = CanDrop ? 1 : 0.125;
        backgroundColor = props.classes.userGroupCardSecondary;
    } else if (CanDrop) {
        opacity = CanDrop ? 0.75 : 0.25;
    }

    const textColor = Utils.getInvertedColor(props.group.common.color, props.themeType, true);

    const style: React.CSSProperties = { opacity, overflow: 'hidden', color: textColor };

    if (props.group.common.color) {
        style.backgroundColor = props.group.common.color;
    }

    return <Card
        style={style}
        ref={drop}
        className={Utils.clsx(props.classes.userGroupCard2, backgroundColor)}
    >
        <div className={props.classes.right}>
            <IconButton size="small" onClick={() => props.showGroupEditDialog(props.group, false)}>
                <EditIcon style={{ color: textColor }} />
            </IconButton>
            <IconButton
                size="small"
                onClick={() => props.showGroupDeleteDialog(props.group)}
                disabled={props.group.common.dontDelete}
            >
                <DeleteIcon style={props.group.common.dontDelete ? null : { color: textColor }} />
            </IconButton>
        </div>
        <CardContent>
            <Typography gutterBottom component="div" className={props.classes.userGroupTitle}>
                {props.group.common.icon ?
                    <Icon
                        className={props.classes.icon}
                        src={props.group.common.icon}
                    />
                    :
                    <GroupIcon className={props.classes.icon} />}
                <div>
                    <div>
                        <span className={props.classes.userGroupUserName}>
                            {props.getText(props.group.common.name)}
                        </span>
                        <span>
                            [
                            {props.group._id}
]
                        </span>
                    </div>
                    {props.group.common.desc
                        ?
                        <div className={props.classes.description}>
                            {props.getText(props.group.common.desc)}
                        </div>
                        :
                        null}
                </div>
            </Typography>
            {props.group.common.members?.length ?
                <div>
                    {props.t('Group members')}
:
                </div> : null}
            <div>
                {(props.group.common.members || []).map((member, i) => {
                    const user = props.users.find(u => u._id === member);
                    const _textColor = user && user.common?.color ? Utils.getInvertedColor(user.common.color, props.themeType, true) : textColor;
                    return user
                        ?
                        <Card
                            key={i}
                            variant="outlined"
                            className={props.classes.userGroupMember}
                            style={{ color: _textColor, borderColor: `${_textColor}40`, background: user.common?.color || 'inherit' }}
                        >
                            {user.common.icon ?
                                <Icon
                                    className={props.classes.icon}
                                    src={user.common.icon}
                                />
                                :
                                <PersonIcon className={props.classes.icon} />}
                            {props.getText(user.common.name)}
                            <IconButton
                                size="small"
                                onClick={() => props.removeUserFromGroup(member, props.group._id)}
                            >
                                <ClearIcon style={{ color: _textColor }} />
                            </IconButton>
                        </Card>
                        :
                        null;
                })}
            </div>
        </CardContent>
    </Card>;
};

export default GroupBlock;
