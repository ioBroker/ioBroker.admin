import React from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { Typography, Card, CardContent, IconButton } from '@mui/material';

import {
    Person as PersonIcon,
    Group as GroupIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

import { Utils, Icon, type Translate, type ThemeType, type IobTheme } from '@iobroker/adapter-react-v5';

interface GroupBlockProps {
    t: Translate;
    group: ioBroker.GroupObject;
    users: ioBroker.UserObject[];
    showGroupEditDialog: (group: ioBroker.GroupObject, isNew: boolean) => void;
    showGroupDeleteDialog: (group: ioBroker.GroupObject) => void;
    removeUserFromGroup: (userId: string, groupId: string) => void;
    getText: (text: ioBroker.StringOrTranslated) => string;
    themeType: ThemeType;
    styles: Record<string, any>;
    theme: IobTheme;
}

function canMeDrop(monitor: DropTargetMonitor<{ userId: ioBroker.ObjectIDs.User }>, props: GroupBlockProps) {
    return props.group.common.members ? !props.group.common.members.includes(monitor.getItem().userId) : true;
}

const GroupBlock: React.FC<GroupBlockProps> = props => {
    const [{ CanDrop, isOver /* , isCanDrop */ }, drop] = useDrop(
        () => ({
            accept: 'user',
            drop: () => ({ groupId: props.group._id }),
            canDrop: (item, monitor) => canMeDrop(monitor, props),
            collect: monitor => ({
                isOver: monitor.isOver(),
                CanDrop: monitor.canDrop(),
            }),
        }),
        [props.group.common.members]
    );

    let opacity = 0.7;
    let backgroundColor: any;
    const isActive = CanDrop && isOver;

    if (isActive) {
        opacity = CanDrop ? 1 : 0.125;
        backgroundColor = props.styles.userGroupCardSecondary;
    } else if (CanDrop) {
        opacity = CanDrop ? 0.75 : 0.25;
    }

    const textColor = Utils.getInvertedColor(props.group.common.color, props.themeType, true);

    const style: React.CSSProperties = { opacity, overflow: 'hidden', color: textColor };

    if (props.group.common.color) {
        style.backgroundColor = props.group.common.color;
    }

    return (
        <Card style={style} ref={drop} sx={Utils.getStyle(props.theme, props.styles.userGroupCard2, backgroundColor)}>
            <div style={props.styles.right}>
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
                <Typography gutterBottom component="div" style={props.styles.userGroupTitle}>
                    {props.group.common.icon ? (
                        <Icon style={props.styles.icon} src={props.group.common.icon} />
                    ) : (
                        <GroupIcon style={props.styles.icon} />
                    )}
                    <div>
                        <div>
                            <span style={props.styles.userGroupUserName}>{props.getText(props.group.common.name)}</span>
                            <span>[{props.group._id}]</span>
                        </div>
                        {props.group.common.desc ? (
                            <div style={props.styles.description}>{props.getText(props.group.common.desc)}</div>
                        ) : null}
                    </div>
                </Typography>
                {props.group.common.members?.length ? <div>{props.t('Group members')}:</div> : null}
                <div>
                    {(props.group.common.members || []).map((member, i) => {
                        const user = props.users.find(u => u._id === member);
                        const _textColor =
                            user && user.common?.color
                                ? Utils.getInvertedColor(user.common.color, props.themeType, true)
                                : textColor;
                        return user ? (
                            <Card
                                key={i}
                                variant="outlined"
                                sx={props.styles.userGroupMember}
                                style={{
                                    color: _textColor,
                                    borderColor: `${_textColor}40`,
                                    background: user.common?.color || 'inherit',
                                }}
                            >
                                {user.common.icon ? (
                                    <Icon style={props.styles.icon} src={user.common.icon} />
                                ) : (
                                    <PersonIcon style={props.styles.icon} />
                                )}
                                {props.getText(user.common.name)}
                                <IconButton
                                    size="small"
                                    onClick={() => props.removeUserFromGroup(member, props.group._id)}
                                >
                                    <ClearIcon style={{ color: _textColor }} />
                                </IconButton>
                            </Card>
                        ) : null;
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default GroupBlock;
