import React, { useEffect, useMemo, useState, type JSX } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';

import {
    Add as IconAdd,
    ArrowBack as IconBack,
    ArrowForward as IconMoveTo,
    Close as IconClose,
    Delete as IconDelete,
    Edit as IconEdit,
    FileCopy as IconCopy,
    InfoOutlined as IconInfo,
    List as IconList,
    PlaylistAdd as IconAddObjects,
    Warning as IconWarning,
} from '@mui/icons-material';

import {
    Icon,
    IconChannel,
    IconDevice,
    IconState,
    Utils,
    getSelectIdIcon,
    type AdminConnection,
    type IobTheme,
    type Translate,
} from '@iobroker/gui-components';

import AdminUtils from '@/helpers/AdminUtils';
import { canDropOnEnum, sortTreeItems, type DragMemberItem, type EnumDropResult, type EnumTreeItem } from './types';
import { endMemberDrag, startMemberDrag, useCopyOnDrop } from './dragCopy';

const styles: Record<string, any> = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        flexGrow: 1,
    },
    dropActive: (theme: IobTheme) => ({
        outline: `2px dashed ${theme.palette.primary.main}`,
        outlineOffset: '-4px',
    }),
    header: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
    }),
    tile: (theme: IobTheme) => ({
        width: 52,
        height: 52,
        borderRadius: '10px',
        border: `2px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }),
    tileIcon: {
        width: 36,
        height: 36,
    },
    headerText: {
        flexGrow: 1,
        minWidth: 160,
    },
    mono: {
        fontFamily: 'monospace',
        opacity: 0.7,
    },
    headerDescription: {
        opacity: 0.8,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
    },
    content: {
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },
    subEntries: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
    },
    subEntriesLabel: {
        opacity: 0.7,
    },
    group: (theme: IobTheme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        overflow: 'hidden',
        flexShrink: 0,
    }),
    groupHeader: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 0.75,
        backgroundColor: theme.palette.action.hover,
    }),
    row: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        pl: 5,
        pr: 1.5,
        py: 0.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    }),
    groupName: {
        fontWeight: 600,
    },
    rowIconWrapper: {
        display: 'flex',
        flexShrink: 0,
    },
    rowIcon: {
        width: 24,
        height: 24,
    },
    missingIcon: {
        width: 24,
        height: 24,
        color: 'warning.main',
    },
    rowText: {
        flexGrow: 1,
        minWidth: 0,
    },
    rowId: {
        fontFamily: 'monospace',
        opacity: 0.6,
        display: 'block',
    },
    role: {
        fontFamily: 'monospace',
        opacity: 0.6,
        width: 150,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
    },
    value: {
        width: 110,
        flexShrink: 0,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 0.5,
        maxWidth: { xs: 120, md: 260 },
    },
    chipIcon: {
        width: 16,
        height: 16,
    },
    removePlaceholder: {
        width: 30,
        flexShrink: 0,
    },
    dragHint: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        opacity: 0.7,
        flexShrink: 0,
    },
    dragHintIcon: {
        fontSize: 18,
    },
    emptyMembers: (theme: IobTheme) => ({
        border: `2px dashed ${theme.palette.divider}`,
        borderRadius: '8px',
        p: 4,
        textAlign: 'center',
        opacity: 0.7,
    }),
    preview: (theme: IobTheme) => ({
        px: 1.5,
        py: 0.75,
        borderRadius: '6px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[4],
        whiteSpace: 'nowrap',
    }),
    previewHint: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 11,
        opacity: 0.7,
    },
    previewHintCopy: {
        color: 'primary.main',
        fontWeight: 600,
        opacity: 1,
    },
    previewHintIcon: {
        fontSize: 14,
    },
};

interface MemberGroup {
    id: string;
    /** The device or channel. It is missing, if the parent is not an object */
    obj?: ioBroker.Object;
    /** The device or channel itself is a member, not only some of its children */
    isMember: boolean;
    /** Members shown below the header: the states of a channel or the channels of a device */
    states: ioBroker.Object[];
}

function groupMembers(
    memberIds: string[],
    members: Record<string, ioBroker.Object>,
    parents: Record<string, ioBroker.Object>,
    getName: (name: ioBroker.StringOrTranslated | undefined) => string,
): { groups: MemberGroup[]; missing: string[]; stateIds: string[] } {
    const groups: MemberGroup[] = [];
    const byId: Record<string, MemberGroup> = {};
    const missing: string[] = [];
    const stateIds: string[] = [];

    for (const memberId of memberIds) {
        const obj = members[memberId];
        if (!obj) {
            missing.push(memberId);
            continue;
        }
        let groupId = memberId;
        if (obj.type === 'state' || obj.type === 'channel') {
            const parentId = Utils.getParentId(memberId);
            const parent = parentId ? members[parentId] || parents[parentId] : undefined;
            // states are grouped by their parent, channels only by their device
            if (parentId && (obj.type === 'state' || parent?.type === 'device')) {
                groupId = parentId;
            }
        }
        let group = byId[groupId];
        if (!group) {
            group = { id: groupId, obj: members[groupId] || parents[groupId], isMember: false, states: [] };
            byId[groupId] = group;
            groups.push(group);
        }
        if (groupId !== memberId) {
            group.states.push(obj);
            if (obj.type === 'state') {
                stateIds.push(memberId);
            }
        } else {
            group.isMember = true;
            group.obj = obj;
        }
    }

    const nameOf = (obj: ioBroker.Object | undefined, id: string): string =>
        (getName(obj?.common?.name) || id.split('.').pop() || id).toLowerCase();
    groups.sort((a, b) => nameOf(a.obj, a.id).localeCompare(nameOf(b.obj, b.id)));
    groups.forEach(group => group.states.sort((a, b) => nameOf(a, a._id).localeCompare(nameOf(b, b._id))));

    return { groups, missing, stateIds };
}

function formatValue(state: ioBroker.State | null | undefined, obj: ioBroker.Object): string {
    if (!state || state.val === null || state.val === undefined) {
        return '–';
    }
    let val = state.val;
    if (typeof val === 'number') {
        val = Math.round(val * 1000) / 1000;
    }
    const statesMap: unknown = obj.common?.states;
    if (statesMap && typeof statesMap === 'object' && !Array.isArray(statesMap)) {
        const text = (statesMap as Record<string, string>)[String(val)];
        if (text) {
            return text;
        }
    }
    const text = typeof val === 'object' ? JSON.stringify(val) : String(val);
    const unit: string | undefined = (obj as ioBroker.StateObject).common?.unit;
    return unit ? `${text} ${unit}` : text;
}

interface MemberDragPreviewProps {
    name: string;
    /** Name of the enum, from which the member is dragged */
    enumName: string;
    t: Translate;
    theme: IobTheme;
}

/** Preview of a dragged member: it shows, if the member will be moved or copied */
function MemberDragPreview(props: MemberDragPreviewProps): JSX.Element {
    const copy = useCopyOnDrop();
    const { t } = props;
    let hint: JSX.Element | null = null;
    if (copy) {
        hint = (
            <Box sx={Utils.getStyle(props.theme, styles.previewHint, styles.previewHintCopy)}>
                <IconAdd sx={styles.previewHintIcon} />
                {t('Copy · stays in "%s" too', props.enumName)}
            </Box>
        );
    } else if (!AdminUtils.isTouchDevice()) {
        // on touch devices there are no keys to copy
        hint = (
            <Box sx={styles.previewHint}>
                <IconMoveTo sx={styles.previewHintIcon} />
                {t('Move · hold Shift, Ctrl or Alt to copy')}
            </Box>
        );
    }

    return (
        <Box sx={styles.preview}>
            <div>{props.name}</div>
            {hint}
        </Box>
    );
}

interface MemberRowProps {
    memberId: string;
    enumId: string;
    /** Name of the enum, used in the preview of a dragged member */
    enumName: string;
    obj?: ioBroker.Object;
    /** Parent of a state, used for the icon */
    parent?: ioBroker.Object;
    /** The row is the header of a group */
    header?: boolean;
    /** The object is a member of the enum, not only the parent of members */
    isMember: boolean;
    state?: ioBroker.State | null;
    /** Enums of the other main category, in which the object is a member */
    chips: ioBroker.EnumObject[];
    t: Translate;
    theme: IobTheme;
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    onSelect: (enumId: string) => void;
    onRemove: (memberId: string) => void;
    onMove: (memberId: string, toEnumId: string, copy: boolean) => void;
}

function MemberRow(props: MemberRowProps): JSX.Element {
    const { obj, t } = props;
    const missing = props.isMember && !obj;
    const name = props.getName(obj?.common?.name) || props.memberId.split('.').pop() || props.memberId;
    const draggable = props.isMember && !!obj;
    const isTouch = AdminUtils.isTouchDevice();

    const [{ isDragging }, dragRef, preview] = useDrag<DragMemberItem, EnumDropResult, { isDragging: boolean }>(
        () => ({
            type: 'enum-member',
            item: () => {
                startMemberDrag();
                return {
                    memberId: props.memberId,
                    fromEnumId: props.enumId,
                    preview: (
                        <MemberDragPreview
                            name={name}
                            enumName={props.enumName}
                            t={t}
                            theme={props.theme}
                        />
                    ),
                };
            },
            canDrag: draggable,
            end: (item, monitor) => {
                // moved by default, copied with Shift, Ctrl or Alt
                const copy = endMemberDrag();
                const result = monitor.getDropResult();
                if (result?.enumId && result.enumId !== item.fromEnumId) {
                    props.onMove(item.memberId, result.enumId, copy);
                }
            },
            collect: monitor => ({ isDragging: monitor.isDragging() }),
        }),
        [props.memberId, props.enumId, props.enumName, props.onMove, props.theme, name, draggable, t],
    );

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const iconSrc = (obj && getSelectIdIcon(obj)) || (props.parent && getSelectIdIcon(props.parent)) || null;
    let icon: JSX.Element;
    if (missing) {
        icon = <IconWarning sx={styles.missingIcon} />;
    } else if (iconSrc) {
        icon = (
            <Icon
                src={iconSrc}
                style={styles.rowIcon}
            />
        );
    } else if (!obj || obj.type === 'channel') {
        icon = <IconChannel style={styles.rowIcon} />;
    } else if (obj.type === 'device') {
        icon = <IconDevice style={styles.rowIcon} />;
    } else {
        icon = <IconState style={styles.rowIcon} />;
    }

    const value = obj?.type === 'state' ? formatValue(props.state, obj) : undefined;

    return (
        <Box
            ref={(node: HTMLDivElement | null) => {
                if (!isTouch) {
                    dragRef(node);
                }
            }}
            sx={props.header ? styles.groupHeader : styles.row}
            style={{ opacity: isDragging ? 0.4 : 1, cursor: draggable && !isTouch ? 'grab' : undefined }}
        >
            <span
                style={styles.rowIconWrapper}
                ref={
                    isTouch
                        ? (node: HTMLSpanElement | null) => {
                              dragRef(node);
                          }
                        : undefined
                }
            >
                {icon}
            </span>
            <Box sx={styles.rowText}>
                <Typography
                    variant="body2"
                    noWrap
                    sx={props.header ? styles.groupName : undefined}
                >
                    {missing ? props.memberId : name}
                </Typography>
                <Typography
                    variant="caption"
                    component="div"
                    noWrap
                    sx={styles.rowId}
                >
                    {missing ? t('Object does not exist any more') : props.memberId}
                </Typography>
            </Box>
            {obj?.common?.role ? (
                <Typography
                    variant="caption"
                    noWrap
                    sx={styles.role}
                >
                    {obj.common.role}
                </Typography>
            ) : null}
            {value !== undefined ? (
                <Typography
                    variant="body2"
                    noWrap
                    sx={styles.value}
                    style={props.state && !props.state.ack ? { fontStyle: 'italic' } : undefined}
                    title={value}
                >
                    {value}
                </Typography>
            ) : null}
            <Box sx={styles.chips}>
                {props.chips.map(chip => (
                    <Chip
                        key={chip._id}
                        size="small"
                        label={props.getName(chip.common?.name) || chip._id.split('.').pop()}
                        icon={
                            chip.common?.icon ? (
                                <Icon
                                    src={chip.common.icon}
                                    style={styles.chipIcon}
                                />
                            ) : undefined
                        }
                        title={chip._id}
                        onClick={() => props.onSelect(chip._id)}
                    />
                ))}
            </Box>
            {props.isMember ? (
                <Tooltip
                    title={t('Remove')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <IconButton
                        size="small"
                        onClick={() => props.onRemove(props.memberId)}
                    >
                        <IconClose fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : (
                <span style={styles.removePlaceholder} />
            )}
        </Box>
    );
}

interface EnumDetailsProps {
    enumItem: ioBroker.EnumObject;
    enums: Record<string, ioBroker.EnumObject>;
    /** Direct children of the enum, e.g., the rooms of a floor */
    subEntries: EnumTreeItem[];
    members: Record<string, ioBroker.Object>;
    /** Parents of the states, which are members */
    parents: Record<string, ioBroker.Object>;
    socket: AdminConnection;
    t: Translate;
    theme: IobTheme;
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    updating: boolean;
    /** Show a back button (on narrow screens) */
    onBack?: () => void;
    onSelect: (enumId: string) => void;
    onEdit: () => void;
    onClone: () => void;
    onDelete: () => void;
    onAddChild: () => void;
    onAddObjects: () => void;
    onRemoveMember: (memberId: string) => void;
    onMoveMember: (memberId: string, toEnumId: string, copy: boolean) => void;
}

export default function EnumDetails(props: EnumDetailsProps): JSX.Element {
    const { enumItem, t } = props;
    const memberIds = enumItem.common?.members || [];
    const categoryPrefix = `${enumItem._id.split('.').slice(0, 2).join('.')}.`;

    // enums of the other main category show, where a member is assigned additionally
    const chipEnums = useMemo(
        () =>
            Object.values(props.enums).filter(
                enumObj =>
                    (enumObj._id.startsWith('enum.rooms.') || enumObj._id.startsWith('enum.functions.')) &&
                    !enumObj._id.startsWith(categoryPrefix),
            ),
        [props.enums, categoryPrefix],
    );
    const getChips = (id: string): ioBroker.EnumObject[] =>
        chipEnums.filter(enumObj => enumObj.common?.members?.includes(id));

    const { groups, missing, stateIds } = useMemo(
        () => groupMembers(memberIds, props.members, props.parents, props.getName),
        [memberIds, props.members, props.parents, props.getName],
    );

    const [values, setValues] = useState<Record<string, ioBroker.State | null | undefined>>({});
    const stateIdsKey = stateIds.join('\n');
    useEffect(() => {
        const ids = stateIdsKey ? stateIdsKey.split('\n') : [];
        const onStateChange = (id: string, state: ioBroker.State | null | undefined): void =>
            setValues(prev => ({ ...prev, [id]: state }));
        if (ids.length) {
            props.socket
                .subscribeState(ids, onStateChange)
                .catch((e: unknown) => console.error('Cannot subscribe on the members:', e));
        }
        return () => {
            if (ids.length) {
                props.socket.unsubscribeState(ids, onStateChange);
            }
        };
    }, [props.socket, stateIdsKey]);

    const [{ isOver, canDrop }, dropRef] = useDrop<
        unknown,
        EnumDropResult | undefined,
        { isOver: boolean; canDrop: boolean }
    >(
        () => ({
            accept: ['object', 'enum-member'],
            drop: (_item, monitor) => (monitor.didDrop() ? undefined : { enumId: enumItem._id }),
            canDrop: item => canDropOnEnum(item, enumItem, enumItem._id),
            collect: monitor => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
        }),
        [enumItem],
    );

    const name = props.getName(enumItem.common?.name) || enumItem._id.split('.').pop();
    const description = enumItem.common?.desc ? props.getName(enumItem.common.desc) : '';
    const subEntries = sortTreeItems(props.subEntries, props.getName);

    const rowProps = {
        enumId: enumItem._id,
        enumName: name || enumItem._id,
        t,
        theme: props.theme,
        getName: props.getName,
        onSelect: props.onSelect,
        onRemove: props.onRemoveMember,
        onMove: props.onMoveMember,
    };

    return (
        <Box
            ref={(node: HTMLDivElement | null) => {
                dropRef(node);
            }}
            sx={Utils.getStyle(props.theme, styles.root, isOver && canDrop && styles.dropActive)}
            style={{ opacity: props.updating ? 0.6 : 1 }}
        >
            <Box sx={styles.header}>
                {props.onBack ? (
                    <Tooltip
                        title={t('Back')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <IconButton onClick={props.onBack}>
                            <IconBack />
                        </IconButton>
                    </Tooltip>
                ) : null}
                <Box
                    sx={styles.tile}
                    style={enumItem.common?.color ? { borderColor: enumItem.common.color } : undefined}
                >
                    {enumItem.common?.icon ? (
                        <Icon
                            src={enumItem.common.icon}
                            style={styles.tileIcon}
                        />
                    ) : (
                        <IconList style={styles.tileIcon} />
                    )}
                </Box>
                <Box sx={styles.headerText}>
                    <Typography
                        variant="h6"
                        noWrap
                    >
                        {name}
                    </Typography>
                    <Typography
                        variant="caption"
                        component="div"
                        noWrap
                        sx={styles.mono}
                    >
                        {enumItem._id} · {t('%s members', memberIds.length)}
                    </Typography>
                    {description ? (
                        <Typography
                            variant="body2"
                            sx={styles.headerDescription}
                        >
                            {description}
                        </Typography>
                    ) : null}
                </Box>
                <Box sx={styles.headerActions}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<IconAddObjects />}
                        onClick={props.onAddObjects}
                    >
                        {t('Add objects')}
                    </Button>
                    <Tooltip
                        title={t('Add child')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <IconButton onClick={props.onAddChild}>
                            <IconAdd />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={t('Edit')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <IconButton onClick={props.onEdit}>
                            <IconEdit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={t('Clone')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <IconButton onClick={props.onClone}>
                            <IconCopy />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={t('Delete')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <IconButton
                                disabled={!!enumItem.common?.dontDelete}
                                onClick={props.onDelete}
                            >
                                <IconDelete />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
            <Box sx={styles.content}>
                {subEntries.length ? (
                    <Box sx={styles.subEntries}>
                        <Typography
                            variant="body2"
                            sx={styles.subEntriesLabel}
                        >
                            {t('Sub-entries')}:
                        </Typography>
                        {subEntries.map(entry => (
                            <Chip
                                key={entry.id}
                                label={props.getName(entry.data?.common?.name) || entry.id.split('.').pop()}
                                icon={
                                    entry.data?.common?.icon ? (
                                        <Icon
                                            src={entry.data.common.icon}
                                            style={styles.chipIcon}
                                        />
                                    ) : undefined
                                }
                                disabled={!entry.data}
                                onClick={() => props.onSelect(entry.id)}
                            />
                        ))}
                    </Box>
                ) : null}
                {groups.map(group => (
                    <Box
                        key={group.id}
                        sx={styles.group}
                    >
                        <MemberRow
                            {...rowProps}
                            header
                            memberId={group.id}
                            obj={group.obj}
                            isMember={group.isMember}
                            chips={getChips(group.id)}
                        />
                        {group.states.map(stateObj => (
                            <MemberRow
                                {...rowProps}
                                key={stateObj._id}
                                memberId={stateObj._id}
                                obj={stateObj}
                                parent={group.obj}
                                isMember
                                state={values[stateObj._id]}
                                chips={getChips(stateObj._id)}
                            />
                        ))}
                    </Box>
                ))}
                {missing.length ? (
                    <Box sx={styles.group}>
                        {missing.map(memberId => (
                            <MemberRow
                                {...rowProps}
                                key={memberId}
                                header
                                memberId={memberId}
                                isMember
                                chips={[]}
                            />
                        ))}
                    </Box>
                ) : null}
                {memberIds.length > 0 && !props.onBack && !AdminUtils.isTouchDevice() ? (
                    // the members can only be dragged onto other entries if the list is shown next to the details
                    <Typography
                        variant="caption"
                        component="div"
                        sx={styles.dragHint}
                    >
                        <IconInfo sx={styles.dragHintIcon} />
                        {t(
                            'Drag an object onto another entry in the list to move it there. Hold Shift, Ctrl or Alt to copy it.',
                        )}
                    </Typography>
                ) : null}
                {!memberIds.length ? (
                    <Box sx={styles.emptyMembers}>
                        {t('Drag states, channels or devices from the object list here or use "Add objects"')}
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}
