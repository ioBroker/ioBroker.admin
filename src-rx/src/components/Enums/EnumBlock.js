import {useEffect, useRef, Component} from 'react'
import PropTypes from 'prop-types';
import {useDrag, useDrop} from 'react-dnd';
import {getEmptyImage} from 'react-dnd-html5-backend';
import clsx from 'clsx';
import {withStyles} from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Icon from '@iobroker/adapter-react/Components/Icon';
import Tooltip from '@material-ui/core/Tooltip';

import IconButton from '@material-ui/core/IconButton';
import ListIcon from '@material-ui/icons/List';
import ClearIcon from '@material-ui/icons/Clear';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DownIcon from '@material-ui/icons/KeyboardArrowDown';
import UpIcon from '@material-ui/icons/KeyboardArrowUp';
import AddIcon from '@material-ui/icons/Add';
import { FaRegFolder as IconCollapsed } from 'react-icons/fa';
import { FaRegFolderOpen as IconExpanded } from 'react-icons/fa';

import IconChannel from '@iobroker/adapter-react/icons/IconChannel';
import IconDevice from '@iobroker/adapter-react/icons/IconDevice';
import IconState from '@iobroker/adapter-react/icons/IconState';

import Utils from '@iobroker/adapter-react/Components/Utils';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';

const styles = theme => ({
    enumGroupCard: {
        border: '1px solid #FFF',
        borderColor: theme.palette.divider,
        margin: 10,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'all 200ms ease-out',
        opacity: 1,
        overflow: 'hidden',
        cursor: 'grab',
        position: 'relative',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover
        },
        minHeight: 70,
    },
    enumGroupCardExpanded:{
        minHeight: 140,
    },
    enumUpdating: {
        opacity: 0.5,
        position: 'relative',
        '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            opacity: '.3 !important',
            background: 'repeating-linear-gradient(135deg, #333, #333 10px, #888 10px, #888 20px)',
        }
    },
    enumCardContent: {
        height: '100%',
        opacity: 1
    },
    right: {
        float: 'right',
    },
    enumGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'inline-block'
    },
    enumGroupName: {
        marginLeft: 5,
    },
    enumGroupEnumName: {
        fontWeight: 900,
        //padding: '0 0 0 5px'
    },
    enumGroupEnumID: {
        opacity: 0.7,
        marginLeft: 5,
        fontSize: 12,
        fontStyle: 'italic'
    },
    enumName: {
        fontSize: 12,
        fontWeight: 700,
        //marginLeft: 30,
        opacity: 0.7,
        marginTop: -4,
    },
    enumGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: '#00000010',
        border: '1px solid #FFF',
        borderColor: theme.palette.text.hint,
        color: theme.palette.text.primary,
        alignItems: 'center',
        position: 'relative',
    },
    secondLine: {
        fontSize: 9,
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        opacity: 0.5,
    },
    context: {
        paddingTop: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        paddingBottom: '0 !important',
    },
    folderDiv: {
        display: 'inline-block',
        position: 'relative',
        cursor: 'pointer',
    },
    folder: {
        width: 48,
        height: 48,
    },
    folderIcon: {
        position: 'absolute',
        top: 18,
        left: 16,
        width: 18,
        height: 18,
        zIndex: 2,
    },
    folderIconExpanded: {
        transform: 'skew(147deg, 183deg) scale(0.5) translate(6px, 7px)',
    },
    bottomButtons: {
        position: 'absolute',
        right: 0,
        bottom: 0
    },
    membersNumber: {
        top: 40,
        left: 26,
        fontSize: 18,
        position: 'absolute',
    },
    memberNumberFolder: {
        top: 46,
        left: 26,
    }
});

class EnumBlock extends Component {
    constructor(props) {
        super(props);
        this.state = {
            icons: props.enum?.common?.members ? props.enum.common.members.map(memberId => props.members[memberId]?.common?.icon || '') :[]
        };
    }

    async componentDidMount() {
        // find all icons
        const icons = [...this.state.icons];
        let changed = false;
        const memberIds = this.props.enum?.common?.members;
        try {
            if (memberIds) {
                for (let i = 0; i < icons.length; i++) {
                    if (!icons[i]) {
                        // check the parent
                        const channelId = Utils.getParentId(memberIds[i]);
                        if (channelId && channelId.split('.').length > 2) {
                            const channelObj = await this.props.socket.getObject(channelId);
                            if (channelObj && (channelObj.type === 'channel' || channelObj.type === 'device')) {
                                if (channelObj.common?.icon) {
                                    icons[i] = channelObj.common?.icon;
                                    changed = true;
                                } else {
                                    // check the parent
                                    const deviceId = Utils.getParentId(channelId);
                                    if (deviceId && deviceId.split('.').length > 2) {
                                        console.log('Get deviceId' + deviceId);
                                        const deviceObj = await this.props.socket.getObject(deviceId);
                                        if (deviceObj && (deviceObj.type === 'channel' || deviceObj.type === 'device')) {
                                            if (deviceObj.common?.icon) {
                                                icons[i] = deviceObj.common?.icon;
                                                changed = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            window.alert('Cannot get icons: ' + e);
        }

        let imagePrefix = '.';

        if (memberIds) {
            const objects = this.props.members;
            for (let i = 0; i < icons.length; i++) {
                const cIcon = icons[i];
                const id = memberIds[i];

                if (cIcon && !cIcon.startsWith('data:image/') && cIcon.includes('.')) {
                    let instance;
                    if (objects[id].type === 'instance' || objects[id].type === 'adapter') {
                        icons[i] = `${imagePrefix}/adapter/${objects[id].common.name}/${cIcon}`;
                    } else if (id && id.startsWith('system.adapter.')) {
                        instance = id.split('.', 3);
                        if (cIcon[0] === '/') {
                            instance[2] += cIcon;
                        } else {
                            instance[2] += '/' + cIcon;
                        }
                        icons[i] = `${imagePrefix}/adapter/${instance[2]}`;
                    } else {
                        instance = id.split('.', 2);
                        if (cIcon[0] === '/') {
                            instance[0] += cIcon;
                        } else {
                            instance[0] += '/' + cIcon;
                        }
                        icons[i] = `${imagePrefix}/adapter/${instance[0]}`;
                    }
                }
            }
        }

        changed && this.setState({icons});
    }

    render() {
        const classes = this.props.classes;
        const props = this.props;
        let textColor = Utils.getInvertedColor(props.enum?.common?.color, props.themeType, true);

        let style = {opacity: this.props.isDragging ? 0 : 1, color: textColor};

        if (props.enum?.common?.color) {
            style.backgroundColor = props.enum.common.color;
        }

        const icon = props.enum?.common?.icon ?
            <Icon
                className={clsx(classes.icon, props.children && classes.folderIcon, props.children && !props.closed && classes.folderIconExpanded) }
                src={props.enum.common.icon}
            /> :
            <ListIcon
                className={clsx(classes.icon, props.children && classes.folderIcon, props.children && !props.closed && classes.folderIconExpanded)}
            />;

        return <Card
            style={style}
            className={clsx(classes.enumGroupCard, this.props.updating && classes.enumUpdating, !props.collapsed && classes.enumGroupCardExpanded)}
            id={props.id}
        >
            <div className={classes.enumCardContent}>
                <div className={classes.right}>
                    {props.enum ? <IconButton
                        size="small"
                        onClick={() => props.showEnumEditDialog(props.enum, false)}
                    >
                        <Tooltip title={props.t('Edit')} placement="top">
                            <EditIcon style={{color: textColor}}/>
                        </Tooltip>
                    </IconButton> : null}
                    {props.enum ? <IconButton
                        size="small"
                        onClick={() => props.copyEnum(props.id)}
                    >
                        <Tooltip title={props.t('Clone')} placement="top">
                            <FileCopyIcon style={{color: textColor}}/>
                        </Tooltip>
                    </IconButton> : null}
                    <IconButton
                        size="small"
                        onClick={() => props.showEnumDeleteDialog(props.enum)}
                        disabled={props.enum?.common?.dontDelete}
                    >
                        <Tooltip title={props.t('Delete')} placement="top">
                            <DeleteIcon style={props.enum?.common?.dontDelete ? null : {color: textColor}}/>
                        </Tooltip>
                    </IconButton>
                </div>
                <CardContent className={classes.context}>
                    <Typography
                        gutterBottom={!props.collapsed}
                        component="div"
                        className={classes.enumGroupTitle}
                    >
                        {props.children ? <div className={classes.folderDiv} onClick={() => props.toggleEnum(props.id)}>
                            {props.closed ? [<IconCollapsed className={classes.folder} key={1}/>, <div key={2}>{icon}</div>] : [<IconExpanded className={classes.folder}  key={1}/>, <div key={2}>{icon}</div>]}
                            </div> : icon}
                        <div className={classes.enumGroupName}>
                            <span className={classes.enumGroupEnumName}>
                                {props.getName(props.enum?.common?.name) || props.id.split('.').pop()}
                            </span>
                            <span className={classes.enumGroupEnumID}>
                                {props.id}
                            </span>
                            {props.enum?.common?.desc ?
                                <div className={classes.enumName}>
                                    {props.getName(props.enum.common.desc)}
                                </div> : null}
                        </div>
                    </Typography>
                    <div>
                        {!props.collapsed && props.enum?.common?.members ? props.enum.common.members.map((memberId, i) => {
                            let member = props.members[memberId];
                            if (!member) {
                                return null;
                            }

                            const name = member.common?.name && props.getName(member.common?.name);

                            return <Card
                                key={member._id}
                                title={name ? props.t('Name: %s', name) + '\nID: ' + member._id : member._id}
                                variant="outlined"
                                className={classes.enumGroupMember}
                                style={{color: textColor, borderColor: textColor + '40'}}
                            >
                                {
                                    this.state.icons[i] ?
                                        <Icon className={classes.icon} src={this.state.icons[i]}/>
                                        :
                                        (member.type === 'state' ? <IconState className={classes.icon}/>
                                                : (member.type === 'channel' ?
                                                        <IconChannel className={classes.icon}/>
                                                        : member.type === 'device' ?
                                                            <IconDevice className={classes.icon}/> :
                                                            <ListIcon className={classes.icon}/>
                                                )
                                        )
                                }
                                <div>
                                    {name || member._id}
                                    {name ? <div className={classes.secondLine}>{member._id}</div> : null}
                                </div>
                                <IconButton
                                    size="small"
                                    onClick={() => props.removeMemberFromEnum(member._id, props.id)}
                                >
                                    <Tooltip title={props.t('Remove')} placement="top">
                                        <ClearIcon style={{color: textColor}}/>
                                    </Tooltip>
                                </IconButton>
                            </Card>
                        }) : (props.enum?.common?.members?.length ? <div className={clsx(classes.membersNumber, props.children && classes.memberNumberFolder)}>{props.enum?.common?.members?.length}</div> : '')}
                    </div>
                </CardContent>
            </div>
            <div className={classes.bottomButtons}>
                <IconButton
                    size="small"
                    onClick={() => {
                        if (['functions', 'rooms'].includes(props.currentCategory)) {
                            props.showEnumTemplateDialog(props.id);
                        } else {
                            props.showEnumEditDialog(props.getEnumTemplate(props.id), true);
                        }
                    }}
                >
                    <Tooltip title={props.t('Add child')} placement="top">
                        <AddIcon style={{color: textColor}}/>
                    </Tooltip>
                </IconButton>
                <IconButton size="small" onClick={() => props.onCollapse(props.id)}>
                    <Tooltip title={props.collapsed ? props.t('Show members') : props.t('Hide members')} placement="top">
                        {props.collapsed ? <DownIcon style={{color: textColor}}/> : <UpIcon style={{color: textColor}}/>}
                    </Tooltip>
                </IconButton>
            </div>
        </Card>;
    }
}

const StyledEnumBlock = withStyles(styles)(EnumBlock);

const EnumBlockDrag = props => {
    const [{canDrop, isOver}, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({enumId: props.id}),
        canDrop: (item, monitor) => canMeDrop(monitor, props),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [props.enum?.common?.members]);

    const widthRef = useRef();

    const [{isDragging}, dragRef, preview] = useDrag(
        {
            type: 'enum',
            item: () => {
                return {
                    enumId: props.id,
                    preview: <div style={{width: widthRef.current.offsetWidth}}><StyledEnumBlock {...props}/></div>
                }
            },
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
        preview(getEmptyImage(), {captureDraggingState: true});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!props.enum) {
        return <StyledEnumBlock isDragging={isDragging} widthRef={widthRef} {...props}/>;
    } else {
        return <div ref={drop} style={{opacity: canDrop && isOver ? 0.5 : 1}}>
            <div ref={dragRef}>
                <div ref={widthRef}>
                    <StyledEnumBlock isDragging={isDragging} widthRef={widthRef} {...props}/>
                </div>
            </div>
        </div>;
    }
}

EnumBlockDrag.propTypes = {
    enum: PropTypes.object,
    members: PropTypes.object,
    moveEnum: PropTypes.func,
    removeMemberFromEnum: PropTypes.func,
    showEnumEditDialog: PropTypes.func,
    showEnumDeleteDialog: PropTypes.func,
    copyEnum: PropTypes.func,
    getName: PropTypes.func,
    closed: PropTypes.bool,
    collapsed: PropTypes.bool,
    toggleEnum: PropTypes.func,
    onCollapse: PropTypes.func,
    showEnumTemplateDialog: PropTypes.func,
    currentCategory: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    updating: PropTypes.bool,
    id: PropTypes.string,
    children: PropTypes.number,
    themeType: PropTypes.string,
};

export default EnumBlockDrag;

function canMeDrop(monitor, props) {
    if (!monitor.getItem() || !monitor.getItem().data) {
        return true;
    } else if (!props.enum) {
        return false;
    } else {
        return props.enum.common?.members ? !props.enum.common.members.includes(monitor.getItem().data.id) : true;
    }
}