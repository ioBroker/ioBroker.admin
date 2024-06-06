import React, { useEffect, useRef, Component } from 'react';
import {
    type ConnectDragSource, type DragSourceMonitor,
    useDrag, useDrop,
} from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { withStyles } from '@mui/styles';
import type { DropTargetMonitor } from 'react-dnd/src/types';

import {
    IconButton,
    Typography,
    Card,
    CardContent,
    Tooltip,
} from '@mui/material';

import {
    List as ListIcon,
    Clear as ClearIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FileCopy as FileCopyIcon,
    KeyboardArrowDown as DownIcon,
    KeyboardArrowUp as UpIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { FaRegFolder as IconCollapsed, FaRegFolderOpen as IconExpanded } from 'react-icons/fa';

import {
    Utils,
    Icon,
    IconChannel,
    IconDevice,
    IconState, type AdminConnection,
    type IobTheme,
    type ThemeType, type Translate,
} from '@iobroker/adapter-react-v5';

import { type DragItem } from './DragObjectBrowser';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';

const styles: Record<string, any> = (theme: IobTheme) => ({
    enumGroupCard: {
        border: '1px solid #FFF',
        borderColor: theme.palette.divider,
        margin: 10,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: 'all 200ms ease-out',
        opacity: 1,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover,
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
        },
    },
    enumCardContent: {
        height: '100%',
        opacity: 1,
    },
    right: {
        float: 'right',
    },
    enumGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        cursor: 'grab',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'inline-block',
    },
    enumGroupName: {
        marginLeft: 5,
    },
    enumGroupEnumName: {
        fontWeight: 900,
        // padding: '0 0 0 5px'
    },
    enumGroupEnumID: {
        opacity: 0.7,
        marginLeft: 5,
        fontSize: 12,
        fontStyle: 'italic',
    },
    enumName: {
        fontSize: 12,
        fontWeight: 700,
        // marginLeft: 30,
        opacity: 0.7,
        marginTop: -4,
    },
    enumGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: '#00000010',
        border: '1px solid #FFF',
        borderColor: theme.palette.text.primary, // it was hint...
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
        bottom: 0,
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
    },
});

declare global {
    interface Navigator {
        msMaxTouchPoints: number;
    }
}

export function isTouchDevice(): boolean {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

interface EnumBlockProps {
    enum: ioBroker.EnumObject | null;
    members: Record<string, ioBroker.Object>;
    removeMemberFromEnum: (id: string, parentId: string) => void;
    showEnumEditDialog: (category: ioBroker.EnumObject, isNew: boolean) => void;
    showEnumDeleteDialog: (category: ioBroker.EnumObject) => void;
    copyEnum: (id: string) => void;
    getName: (name: ioBroker.StringOrTranslated) => string;
    closed: boolean;
    collapsed: boolean;
    toggleEnum: (id: string) => void;
    onCollapse: (id: string) => void;
    showEnumTemplateDialog: (id: string) => void;
    currentCategory: string;
    t: Translate;
    socket: AdminConnection;
    updating: boolean;
    id: string;
    children: number;
    themeType: string;
    cachedIcons: Record<string, string>;
    classes?: Record<string, string>;
    iconDragRef?: ConnectDragSource;
    isDragging?: boolean;
    name?: React.JSX.Element[];
    idText?: React.JSX.Element[];
    getEnumTemplate: (prefix: string) => ioBroker.EnumObject;
}

interface EnumBlockState {
    icons: string[];
}

export interface EnumCommon extends ioBroker.EnumCommon {
    desc?: ioBroker.StringOrTranslated;
}

class EnumBlock extends Component<EnumBlockProps, EnumBlockState> {
    constructor(props: EnumBlockProps) {
        super(props);

        this.state = {
            icons: props.enum?.common?.members ?
                props.enum.common.members.map((memberId: string) => props.members[memberId]?.common?.icon || '') : [],
        };
    }

    async componentDidMount() {
        // find all icons
        const icons = [...this.state.icons];
        let changed = false;
        const memberIds = this.props.enum?.common?.members;

        const cachedIcons = this.props.cachedIcons;

        try {
            if (memberIds) {
                for (let i = 0; i < icons.length; i++) {
                    if (!icons[i]) {
                        // check the parent
                        const channelId = Utils.getParentId(memberIds[i]);

                        if (cachedIcons[channelId] !== undefined) {
                            if (cachedIcons[channelId]) {
                                icons[i] = cachedIcons[channelId];
                                changed = true;
                            }
                            continue;
                        }

                        if (channelId && channelId.split('.').length > 2) {
                            const channelObj = await this.props.socket.getObject(channelId);
                            if (channelObj && (channelObj.type === 'channel' || channelObj.type === 'device')) {
                                if (channelObj.common?.icon) {
                                    cachedIcons[channelId] = channelObj.common.icon;
                                    icons[i] = channelObj.common.icon;
                                    changed = true;
                                } else {
                                    // check the parent
                                    const deviceId = Utils.getParentId(channelId);
                                    if (deviceId && deviceId.split('.').length > 2) {
                                        const deviceObj = await this.props.socket.getObject(deviceId);
                                        if (deviceObj && (deviceObj.type === 'channel' || deviceObj.type === 'device')) {
                                            if (deviceObj.common?.icon) {
                                                cachedIcons[deviceId] = deviceObj.common.icon;
                                                cachedIcons[channelId] = deviceObj.common.icon;
                                                icons[i] = deviceObj.common.icon;
                                                changed = true;
                                            }
                                        }
                                        cachedIcons[deviceId] = cachedIcons[deviceId] || null;
                                    }
                                }
                                cachedIcons[channelId] = cachedIcons[channelId] || null;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            window.alert(`Cannot get icons: ${e}`);
        }

        const imagePrefix = '.';

        if (memberIds) {
            const objects = this.props.members;
            for (let i = 0; i < icons.length; i++) {
                const cIcon = icons[i];
                const id = memberIds[i];

                if (cIcon && !cIcon.startsWith('data:image/') && cIcon.includes('.')) {
                    let instance;
                    if (objects[id] && (objects[id].type === 'instance' || objects[id].type === 'adapter')) {
                        icons[i] = `${imagePrefix}/adapter/${objects[id].common.name}/${cIcon}`;
                    } else if (id && id.startsWith('system.adapter.')) {
                        instance = id.split('.', 3);
                        if (cIcon[0] === '/') {
                            instance[2] += cIcon;
                        } else {
                            instance[2] += `/${cIcon}`;
                        }
                        icons[i] = `${imagePrefix}/adapter/${instance[2]}`;
                    } else {
                        instance = id.split('.', 2);
                        if (cIcon[0] === '/') {
                            instance[0] += cIcon;
                        } else {
                            instance[0] += `/${cIcon}`;
                        }
                        icons[i] = `${imagePrefix}/adapter/${instance[0]}`;
                    }
                    changed = true;
                }
            }
        }

        changed && this.setState({ icons });
    }

    render() {
        const classes = this.props.classes;
        const props = this.props;
        const common: EnumCommon | null = props.enum?.common as EnumCommon;
        const textColor = Utils.getInvertedColor(common?.color, props.themeType, true);

        const style: React.CSSProperties = { opacity: this.props.isDragging ? 0 : 1, color: textColor };

        if (common?.color) {
            style.backgroundColor = props.enum.common.color;
        }

        let icon = common?.icon ?
            <Icon
                className={Utils.clsx(classes.icon, props.children && classes.folderIcon, props.children && !props.closed && classes.folderIconExpanded)}
                src={props.enum.common.icon}
            /> :
            <ListIcon
                className={Utils.clsx(classes.icon, props.children && classes.folderIcon, props.children && !props.closed && classes.folderIconExpanded)}
            />;

        icon = props.children ? <div className={classes.folderDiv} onClick={() => props.toggleEnum(props.id)}>
            {props.closed ? [<IconCollapsed className={classes.folder} key={1} />, <div key={2}>{icon}</div>] : [<IconExpanded className={classes.folder} key={1} />, <div key={2}>{icon}</div>]}
        </div> : icon;

        if (this.props.iconDragRef) {
            icon = <span ref={this.props.iconDragRef}>{icon}</span>;
        }

        return <Card
            style={style}
            className={Utils.clsx(classes.enumGroupCard, this.props.updating && classes.enumUpdating, !props.collapsed && classes.enumGroupCardExpanded)}
            id={props.id}
        >
            <div className={classes.enumCardContent}>
                <div className={classes.right}>
                    {props.enum ? <IconButton
                        size="small"
                        onClick={() => props.showEnumEditDialog(props.enum, false)}
                    >
                        <Tooltip title={props.t('Edit')} placement="top">
                            <EditIcon style={{ color: textColor }} />
                        </Tooltip>
                    </IconButton> : null}
                    {props.enum ? <IconButton
                        size="small"
                        onClick={() => props.copyEnum(props.id)}
                    >
                        <Tooltip title={props.t('Clone')} placement="top">
                            <FileCopyIcon style={{ color: textColor }} />
                        </Tooltip>
                    </IconButton> : null}
                    <IconButton
                        size="small"
                        onClick={() => props.showEnumDeleteDialog(props.enum)}
                        disabled={common?.dontDelete}
                    >
                        <Tooltip title={props.t('Delete')} placement="top">
                            <DeleteIcon style={common?.dontDelete ? null : { color: textColor }} />
                        </Tooltip>
                    </IconButton>
                </div>
                <CardContent className={classes.context}>
                    <Typography
                        gutterBottom={!props.collapsed}
                        component="div"
                        className={classes.enumGroupTitle}
                        onClick={() => props.onCollapse(props.id)}
                    >
                        {icon}
                        <div className={classes.enumGroupName}>
                            <span className={classes.enumGroupEnumName}>
                                {props.name || props.getName(common?.name) || props.id.split('.').pop()}
                            </span>
                            <span className={classes.enumGroupEnumID}>
                                {props.idText || props.id}
                            </span>
                            {common.desc ?
                                <div className={classes.enumName}>
                                    {props.getName(common.desc)}
                                </div> : null}
                        </div>
                    </Typography>
                    <div>
                        {!props.collapsed && common?.members ? props.enum.common.members.map((memberId, i) => {
                            const member = props.members[memberId];
                            if (!member) {
                                return null;
                            }

                            const name = member.common?.name && props.getName(member.common?.name);

                            return <Card
                                key={member._id}
                                title={name ? `${props.t('Name: %s', name)}\nID: ${member._id}` : member._id}
                                variant="outlined"
                                className={classes.enumGroupMember}
                                style={{ color: textColor, borderColor: `${textColor}80` }}
                            >
                                {
                                    this.state.icons[i] ?
                                        <Icon className={classes.icon} src={this.state.icons[i]} />
                                        :
                                        (member.type === 'state' ? <IconState className={classes.icon} />
                                            : (member.type === 'channel' ?
                                                <IconChannel className={classes.icon} />
                                                : member.type === 'device' ?
                                                    <IconDevice className={classes.icon} /> :
                                                    <ListIcon className={classes.icon} />
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
                                        <ClearIcon style={{ color: textColor }} />
                                    </Tooltip>
                                </IconButton>
                            </Card>;
                        }) : (common?.members?.length ? <div className={Utils.clsx(classes.membersNumber, props.children && classes.memberNumberFolder)}>{common?.members?.length}</div> : '')}
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
                        <AddIcon style={{ color: textColor }} />
                    </Tooltip>
                </IconButton>
                <IconButton size="small" onClick={() => props.onCollapse(props.id)}>
                    <Tooltip title={props.collapsed ? props.t('Show members') : props.t('Hide members')} placement="top">
                        {props.collapsed ? <DownIcon style={{ color: textColor }} /> : <UpIcon style={{ color: textColor }} />}
                    </Tooltip>
                </IconButton>
            </div>
        </Card>;
    }
}

const StyledEnumBlock = withStyles(styles)(EnumBlock);

interface EnumBlockDragProps {
    id: string;
    enum: ioBroker.EnumObject;
    moveEnum: (id: string, moveTo: string) => void;
    cachedIcons: Record<string, string>;
    classesParent: Record<string, string>;
    closed: boolean;
    collapsed: boolean;
    copyEnum: (enumId: string) => void;
    currentCategory: string;
    getEnumTemplate: (prefix: string) => ioBroker.EnumObject;
    getName: (name: ioBroker.StringOrTranslated) => string;
    idText?: React.JSX.Element[];
    members: Record<string, ioBroker.Object>;
    name?: React.JSX.Element[];
    onCollapse: () => void;
    removeMemberFromEnum: (memberId: string, enumId: string) => void;
    showEnumDeleteDialog: (enumItem: ioBroker.EnumObject) => void;
    showEnumEditDialog: (enumItem: ioBroker.EnumObject, isNew?: boolean) => void;
    showEnumTemplateDialog: (prefix: string) => void;
    socket: AdminConnection;
    t: (text: string, arg1?: any, arg2?: any) => string;
    themeType: ThemeType;
    toggleEnum: (enumId: string) => void;
    updating: boolean;
    children: number;
}

function canMeDrop(monitor: DropTargetMonitor<DragItem, { enumId: string }>, enumItem: ioBroker.EnumObject) {
    if (!monitor.getItem() || !monitor.getItem().data) {
        return true;
    }
    if (!enumItem) {
        return false;
    }
    return enumItem.common?.members ? !enumItem.common.members.includes(monitor.getItem().data.id) : true;
}

const EnumBlockDrag = (props: EnumBlockDragProps) => {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({ enumId: props.id }),
        canDrop: (_item, monitor: DropTargetMonitor<DragItem, { enumId: string }>) => canMeDrop(monitor, props.enum),
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [props.enum?.common?.members]);

    const widthRef = useRef();

    const [{ isDragging }, dragRef, preview] = useDrag({
        type: 'enum',
        item: () => ({
            enumId: props.id,
            preview: <div
                style={{
                    // @ts-expect-error I do not understand, why this error here
                    width: widthRef.current === undefined ? 50 : widthRef.current.offsetWidth,
                }}
            >
                <StyledEnumBlock {...props} />
            </div>,
        }),

        end: (draggeditem: { enumId: string; preview: React.JSX.Element }, monitor: DragSourceMonitor<DragItem, { enumId: string }>) => {
            const dropResult = monitor.getDropResult();
            if (!dropResult) {
                // root
                const parts = draggeditem.enumId.split('.');
                props.moveEnum(draggeditem.enumId, `${parts[0]}.${parts[1]}`);
            } else {
                props.moveEnum(draggeditem.enumId, dropResult.enumId);
            }
        },

        collect: monitor => ({
            isDragging: monitor.isDragging(),
            handlerId: monitor.getHandlerId(),
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    if (!props.enum) {
        return <StyledEnumBlock isDragging={isDragging} {...props} />;
    }

    return isTouchDevice()
        ? <div ref={drop} style={{ opacity: canDrop && isOver ? 0.5 : 1 }}>
            <div ref={widthRef}>
                <StyledEnumBlock isDragging={isDragging} iconDragRef={dragRef} {...props} />
            </div>
        </div>
        : <div ref={drop} style={{ opacity: canDrop && isOver ? 0.5 : 1 }}>
            <div ref={dragRef}>
                <div ref={widthRef}>
                    <StyledEnumBlock isDragging={isDragging} {...props} />
                </div>
            </div>
        </div>;
};

export default EnumBlockDrag;
