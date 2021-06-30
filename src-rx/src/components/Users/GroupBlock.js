import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';

import GroupIcon from '@material-ui/icons/Group';
import PersonIcon from '@material-ui/icons/Person';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

import Icon from '@iobroker/adapter-react/Components/Icon';
import Utils from '@iobroker/adapter-react/Components/Utils';

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
                            {props.getName(props.group.common.name)}
                        </span>
                        <span>
                            {props.getName(props.group._id)}
                        </span>
                     </div>
                    {
                        props.group.common.desc !== ''
                            ?
                            <span>
                                {props.group.common.desc}
                            </span>
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
                        style={{ color: _textColor, borderColor: _textColor + '80', background: user.common?.color || 'inherit' }}
                    >
                        {user.common.icon ?
                            <Icon
                                className={props.classes.icon}
                                src={user.common.icon}
                            />
                            :
                            <PersonIcon className={props.classes.icon}/>
                        }
                        {props.getName(user.common.name)}
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
    lang: PropTypes.string,
    group: PropTypes.object,
    users: PropTypes.array,
    showGroupEditDialog: PropTypes.func,
    showGroupDeleteDialog: PropTypes.func,
    removeUserFromGroup: PropTypes.func,
    getName: PropTypes.func,
    themeType: PropTypes.string,
};

export default GroupBlock;

function canMeDrop(monitor, props ) {
    return props.group.common.members ? !props.group.common.members.includes(monitor.getItem().userId) : true;
}