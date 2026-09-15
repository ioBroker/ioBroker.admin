import React, { useEffect, type JSX } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Box, IconButton, List, ListItemButton, Typography } from '@mui/material';

import {
    KeyboardArrowDown as IconOpened,
    KeyboardArrowRight as IconClosed,
    List as IconList,
} from '@mui/icons-material';

import { Icon, Utils, type IobTheme, type Translate } from '@iobroker/gui-components';

import AdminUtils from '@/helpers/AdminUtils';
import { canDropOnEnum, sortTreeItems, type DragEnumItem, type EnumDropResult, type EnumTreeItem } from './types';

const styles: Record<string, any> = {
    list: {
        py: 0.5,
    },
    row: {
        gap: '6px',
        py: '4px',
        pr: 1,
        mx: 0.5,
        my: '1px',
        minHeight: 40,
        borderRadius: '6px',
    },
    rowDropOver: (theme: IobTheme) => ({
        outline: `2px dashed ${theme.palette.primary.main}`,
        outlineOffset: '-2px',
    }),
    expander: {
        width: 28,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
    },
    colorStripe: {
        width: 4,
        alignSelf: 'stretch',
        borderRadius: '2px',
        flexShrink: 0,
    },
    iconWrapper: {
        display: 'flex',
        flexShrink: 0,
    },
    icon: {
        width: 24,
        height: 24,
    },
    name: {
        flexGrow: 1,
        minWidth: 0,
    },
    folderName: {
        fontStyle: 'italic',
        opacity: 0.7,
    },
    count: {
        fontSize: 12,
        lineHeight: '20px',
        minWidth: 22,
        px: '6px',
        borderRadius: '10px',
        textAlign: 'center',
        flexShrink: 0,
        backgroundColor: 'action.selected',
    },
    preview: (theme: IobTheme) => ({
        px: 1.5,
        py: 0.75,
        borderRadius: '6px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[4],
        whiteSpace: 'nowrap',
    }),
    empty: {
        p: 3,
        textAlign: 'center',
        opacity: 0.6,
    },
};

interface EnumTreeListProps {
    /** The entries of one category */
    items: EnumTreeItem[];
    selectedId: string | null;
    onSelect: (enumId: string) => void;
    /** Entries with children, which are closed */
    closed: Record<string, boolean>;
    onToggle: (enumId: string) => void;
    /** Search text in lower case */
    search: string;
    /** Enums, which are being written */
    updating: string[];
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    moveEnum: (fromId: string, toId: string) => void;
    t: Translate;
    theme: IobTheme;
}

function matchesSearch(item: EnumTreeItem, props: EnumTreeListProps): boolean {
    if (!props.search) {
        return true;
    }
    const name = props.getName(item.data?.common?.name).toLowerCase();
    return (
        name.includes(props.search) ||
        item.id.toLowerCase().includes(props.search) ||
        Object.values(item.children).some(child => matchesSearch(child, props))
    );
}

function getVisibleItems(items: EnumTreeItem[], props: EnumTreeListProps): EnumTreeItem[] {
    return sortTreeItems(
        items.filter(item => matchesSearch(item, props)),
        props.getName,
    );
}

function EnumTreeRow(props: { item: EnumTreeItem; level: number; list: EnumTreeListProps }): JSX.Element {
    const { item, level, list } = props;
    const enumObj = item.data;
    const name = list.getName(enumObj?.common?.name) || item.id.split('.').pop() || item.id;
    const children = getVisibleItems(Object.values(item.children), list);
    // while searching all found entries are shown
    const closed = !list.search && !!list.closed[item.id];
    const isTouch = AdminUtils.isTouchDevice();

    const [{ isOver, canDrop }, dropRef] = useDrop<
        unknown,
        EnumDropResult | undefined,
        { isOver: boolean; canDrop: boolean }
    >(
        () => ({
            accept: ['object', 'enum', 'enum-member'],
            drop: (_dragged, monitor) => (monitor.didDrop() ? undefined : { enumId: item.id }),
            canDrop: dragged => canDropOnEnum(dragged, enumObj, item.id),
            collect: monitor => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
        }),
        [enumObj, item.id],
    );

    const [{ isDragging }, dragRef, preview] = useDrag<DragEnumItem, EnumDropResult, { isDragging: boolean }>(
        () => ({
            type: 'enum',
            item: () => ({
                enumId: item.id,
                preview: <Box sx={styles.preview}>{name}</Box>,
            }),
            canDrag: !!enumObj && !enumObj.common?.dontDelete,
            end: (dragged, monitor) => {
                // an enum is only moved if it was dropped on an entry or on a category
                const result = monitor.getDropResult();
                if (result?.enumId) {
                    list.moveEnum(dragged.enumId, result.enumId);
                }
            },
            collect: monitor => ({ isDragging: monitor.isDragging() }),
        }),
        [item.id, enumObj, name, list.moveEnum],
    );

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const count = enumObj?.common?.members?.length || 0;

    return (
        <>
            <ListItemButton
                id={`enum-row-${item.id}`}
                ref={(node: HTMLDivElement | null) => {
                    dropRef(node);
                    if (!isTouch) {
                        dragRef(node);
                    }
                }}
                selected={list.selectedId === item.id}
                onClick={() => (enumObj ? list.onSelect(item.id) : list.onToggle(item.id))}
                sx={Utils.getStyle(
                    list.theme,
                    styles.row,
                    { pl: `${4 + level * 20}px` },
                    isOver && canDrop && styles.rowDropOver,
                )}
                style={{ opacity: isDragging || list.updating.includes(item.id) ? 0.5 : 1 }}
            >
                <Box sx={styles.expander}>
                    {children.length ? (
                        <IconButton
                            size="small"
                            onClick={e => {
                                e.stopPropagation();
                                list.onToggle(item.id);
                            }}
                        >
                            {closed ? <IconClosed fontSize="small" /> : <IconOpened fontSize="small" />}
                        </IconButton>
                    ) : null}
                </Box>
                <Box
                    component="span"
                    sx={styles.colorStripe}
                    style={{ backgroundColor: enumObj?.common?.color || 'transparent' }}
                />
                <span
                    style={styles.iconWrapper}
                    ref={
                        isTouch
                            ? (node: HTMLSpanElement | null) => {
                                  dragRef(node);
                              }
                            : undefined
                    }
                >
                    {enumObj?.common?.icon ? (
                        <Icon
                            src={enumObj.common.icon}
                            style={styles.icon}
                        />
                    ) : (
                        <IconList style={styles.icon} />
                    )}
                </span>
                <Box sx={styles.name}>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={enumObj ? undefined : styles.folderName}
                        title={item.id}
                    >
                        {name}
                    </Typography>
                </Box>
                {count ? (
                    <Box
                        component="span"
                        sx={styles.count}
                    >
                        {count}
                    </Box>
                ) : null}
            </ListItemButton>
            {children.length && !closed
                ? children.map(child => (
                      <EnumTreeRow
                          key={child.id}
                          item={child}
                          level={level + 1}
                          list={list}
                      />
                  ))
                : null}
        </>
    );
}

export default function EnumTreeList(props: EnumTreeListProps): JSX.Element {
    const items = getVisibleItems(props.items, props);

    if (!items.length) {
        return (
            <Box sx={styles.empty}>
                {props.t(props.search ? 'No entries found' : 'There are no entries in this category yet')}
            </Box>
        );
    }

    return (
        <List
            dense
            sx={styles.list}
        >
            {items.map(item => (
                <EnumTreeRow
                    key={item.id}
                    item={item}
                    level={0}
                    list={props}
                />
            ))}
        </List>
    );
}
