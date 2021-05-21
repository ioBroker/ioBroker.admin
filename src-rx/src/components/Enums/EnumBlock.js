import {useEffect, useRef, Component} from 'react'
import PropTypes from 'prop-types';
import {useDrag, useDrop} from 'react-dnd';
import {getEmptyImage} from 'react-dnd-html5-backend';
import Color from 'color';
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
import IconChannel from '@iobroker/adapter-react/icons/IconChannel';
import IconDevice from '@iobroker/adapter-react/icons/IconDevice';
import IconState from '@iobroker/adapter-react/icons/IconState';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';

const styles = theme => ({
    enumGroupCard2: {
        border: '1px solid #FFF',
        borderColor: theme.palette.divider,
        margin: 10,
        minHeight: 140,
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
    enumGroupEnumName: {
        fontWeight: 900,
        padding: 5
    },
    enumGroupEnumID: {
        opacity: 0.7,
        padding: 5
    },
    enumName: {
        fontSize: 12,
        fontWeight: 700,
        marginLeft: 30,
        opacity: 0.7
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
});

class EnumBlock extends Component {
    constructor(props) {
        super();
    }

    render() {
        const classes = this.props.classes;
        const props = this.props;
        let textColor = !props.enum || !props.enum.common || !props.enum.common.color || Color(props.enum.common.color).hsl().object().l > 50 ? '#000000' : '#FFFFFF';

        if (!props.enum.common.color) {
            textColor = null;
        }

        let style = {opacity: this.props.isDragging ? 0 : 1, color: textColor};

        if (props.enum.common.color) {
            style.backgroundColor = props.enum.common.color;
        }

        return <Card
            style={style}
            className={classes.enumGroupCard2}
            id={props.enum._id}
        >
            <div className={classes.enumCardContent}>
                <div className={classes.right}>
                    <IconButton
                        size="small"
                        onClick={() => props.showEnumEditDialog(props.enum, false)}
                    >
                        <Tooltip title={props.t('Edit')} placement="top">
                            <EditIcon style={{color: textColor}}/>
                        </Tooltip>
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => props.copyEnum(props.enum._id)}
                    >
                        <Tooltip title={props.t('Clone')} placement="top">
                            <FileCopyIcon style={{color: textColor}}/>
                        </Tooltip>
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => props.showEnumDeleteDialog(props.enum)}
                        disabled={props.enum.common.dontDelete}
                    >
                        <Tooltip title={props.t('Delete')} placement="top">
                            <DeleteIcon style={props.enum.common.dontDelete ? null : {color: textColor}}/>
                        </Tooltip>
                    </IconButton>
                </div>
                <CardContent>
                    <Typography gutterBottom component="div" className={classes.enumGroupTitle}>
                        {
                            props.enum.common.icon ?
                                <Icon
                                    className={classes.icon}
                                    src={props.enum.common.icon}
                                />
                                :
                                <ListIcon className={classes.icon}/>
                        }
                        <div>
                            <div>
                            <span className={classes.enumGroupEnumName}>
                                {props.getName(props.enum.common.name)}
                            </span>
                                <span className={classes.enumGroupEnumID}>
                                {props.enum._id}
                            </span>
                            </div>
                            <span>
                                {
                                    props.enum.common.desc !== '' ?
                                        <div className={classes.enumName}>
                                            {props.getName(props.enum.common.desc)}
                                        </div> : null
                                }
                            </span>
                        </div>
                    </Typography>
                    <div>
                        {props.enum?.common?.members ? props.enum.common.members.map(memberId => {
                            let member = props.members[memberId];
                            if (!member) {
                                return null;
                            }

                            const name = member.common?.name && props.getName(member.common?.name);

                            let icon = member.common?.icon;
                            if (!icon) {
                                // try to find by channel and device

                            }

                            return <Card
                                key={member._id}
                                title={name ? props.t('Name: %s', name) + '\nID: ' + member._id : member._id}
                                variant="outlined"
                                className={classes.enumGroupMember}
                                style={{color: textColor, borderColor: textColor + '40'}}
                            >
                                {
                                    icon ?
                                        <Icon
                                            className={classes.icon}
                                            src={member.common.icon}
                                        />
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
                                    onClick={() => props.removeMemberFromEnum(member._id, props.enum._id)}
                                >
                                    <Tooltip title={props.t('Remove')} placement="top">
                                        <ClearIcon style={{color: textColor}}/>
                                    </Tooltip>
                                </IconButton>
                            </Card>
                        }) : null}
                    </div>
                </CardContent>
            </div>
            <span style={{position: 'absolute', right: 0, bottom: 0}}>
                <IconButton
                    size="small"
                    onClick={() => {
                        if (['functions', 'rooms'].includes(props.currentCategory)) {
                            props.showEnumTemplateDialog(props.enum._id);
                        } else {
                            props.showEnumEditDialog(props.getEnumTemplate(props.enum._id), true);
                        }
                    }}
                >
                    <Tooltip title={props.t('Add child')} placement="top">
                        <AddIcon style={{color: textColor}}/>
                    </Tooltip>
                </IconButton>
                {props.hasChildren ?
                    <IconButton onClick={() => props.toggleEnum(props.enum._id)}>
                        <Tooltip title={props.closed ? props.t('Expand') : props.t('Collapse')} placement="top">
                            {props.closed ?
                                <DownIcon style={{color: textColor}}/>
                                :
                                <UpIcon style={{color: textColor}}/>
                            }
                        </Tooltip>
                    </IconButton>
                    : null}
            </span>
        </Card>;
    }
}

const StyledEnumBlock = withStyles(styles)(EnumBlock);

const EnumBlockDrag = props => {
    const [{canDrop, isOver}, drop] = useDrop(() => ({
        accept: ['object', 'enum'],
        drop: () => ({enumId: props.enum._id}),
        canDrop: (item, monitor) => canMeDrop(monitor, props),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [props.enum.common.members]);

    const widthRef = useRef();

    const [{isDragging}, dragRef, preview] = useDrag(
        {
            type: 'enum',
            item: () => {
                return {
                    enumId: props.enum._id,
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

    return <div ref={drop} style={{opacity: canDrop && isOver ? 0.5 : 1}}>
        <div ref={dragRef}>
            <div ref={widthRef}>
                <StyledEnumBlock isDragging={isDragging} widthRef={widthRef} {...props}/>
            </div>
        </div>
    </div>;
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
    hasChildren: PropTypes.bool,
    closed: PropTypes.bool,
    toggleEnum: PropTypes.func,
    showEnumTemplateDialog: PropTypes.func,
    currentCategory: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
};

export default EnumBlockDrag;

function canMeDrop(monitor, props) {
    if (!monitor.getItem() || !monitor.getItem().data) {
        return true;
    } else {
        return props.enum.common.members ? !props.enum.common.members.includes(monitor.getItem().data.id) : true;
    }
}