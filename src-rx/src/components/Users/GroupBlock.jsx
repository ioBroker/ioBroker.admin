import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';

import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import Icon from '@iobroker/adapter-react-v5/Components/Icon';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

function GroupBlock(props) {
    const [{ CanDrop, isOver, isCanDrop }, drop] = useDrop(() => ({
        accept: 'user',
        drop: () => ({ groupId: props.group._id }),
        canDrop: (item, monitor) => canMeDrop(monitor, props),
        collect: (monitor, item) => ({
            isOver: monitor.isOver(),
            CanDrop: monitor.canDrop()
        }),
    }), [props.group.common.members]);

    let opacity =  .7;
    let backgroundColor = '';
    const isActive = CanDrop && isOver;

    if (isActive) {
        opacity = isCanDrop ? 1 : 0.125;
        backgroundColor = props.classes.userGroupCardSecondary;
    } else if (CanDrop) {
        opacity = isCanDrop ? .75 : .25;
    }

    const textColor = Utils.getInvertedColor(props.group.common.color, props.themeType, true);

    let style = { opacity, overflow: 'hidden', color: textColor };

    if (props.group.common.color) {
        style.backgroundColor = props.group.common.color;
    }

    return <Card
        style={ style }
        ref={drop}
        className={ clsx(props.classes.userGroupCard2, backgroundColor) }
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
                {
                    props.group.common.icon ?
                        <Icon
                            className={ props.classes.icon }
                            src={props.group.common.icon}
                        />
                        :
                        <GroupIcon className={props.classes.icon} />
                }
                <div>
                    <div>
                        <span className={props.classes.userGroupUserName}>
                            {props.getText(props.group.common.name)}
                        </span>
                        <span>
                            [{props.group._id}]
                        </span>
                     </div>
                    {
                        props.group.common.desc
                            ?
                            <div className={props.classes.description}>
                                {props.getText(props.group.common.desc)}
                            </div>
                            :
                            null
                    }
                </div>
            </Typography>
            {
                props.group.common.members?.length ?
                    <div>{props.t('Group members')}:</div> : null
            }
            <div>
            {
                (props.group.common.members || []).map( (member, i) => {
                    let user = props.users.find(user => user._id === member);
                    const _textColor = user && user.common?.color ? Utils.getInvertedColor(user.common.color, props.themeType, true) : textColor;
                    return user
                        ?
                        <Card
                        key={i}
                        variant="outlined"
                        className={props.classes.userGroupMember}
                        style={{ color: _textColor, borderColor: _textColor + '40', background: user.common?.color || 'inherit' }}
                    >
                        {user.common.icon ?
                            <Icon
                                className={props.classes.icon}
                                src={user.common.icon}
                            />
                            :
                            <PersonIcon className={props.classes.icon}/>
                        }
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
                })
            }
            </div>
        </CardContent>
    </Card>;
}

GroupBlock.propTypes = {
    t: PropTypes.func,
    group: PropTypes.object,
    users: PropTypes.array,
    showGroupEditDialog: PropTypes.func,
    showGroupDeleteDialog: PropTypes.func,
    removeUserFromGroup: PropTypes.func,
    getText: PropTypes.func,
    themeType: PropTypes.string,
};

export default GroupBlock;

function canMeDrop(monitor, props ) {
    return props.group.common.members ? !props.group.common.members.includes(monitor.getItem().userId) : true;
}