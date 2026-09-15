import React, { useEffect, useState, type JSX } from 'react';

import { useDrag, type DragSourceMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Box, Card } from '@mui/material';

import { List as ListIcon } from '@mui/icons-material';

import {
    type AdminConnection,
    Icon,
    type IobTheme,
    type Translate,
    ObjectBrowser,
    type TreeItemData,
    type TreeItem,
    getSelectIdIconFromObjects,
    ITEM_IMAGES,
} from '@iobroker/gui-components';

export interface DragItem {
    data: TreeItemData;
    children: DragItem[];
    // preview: JSX.Element | null;
}

interface DragWrapperProps {
    item: TreeItem;
    style: React.CSSProperties;
    children: JSX.Element | null;
    lang: ioBroker.Languages;
}

interface DragSettings {
    type: string;
    end: (item: TreeItem, monitor: any) => void;
    item: { data: TreeItemData; children?: TreeItem[]; preview: JSX.Element | null };
    collect: (monitor: DragSourceMonitor) => {
        isDragging?: boolean;
        canDrag?: boolean;
    };
}

interface DragObjectBrowserProps {
    t: Translate;
    lang: ioBroker.Languages;
    socket: AdminConnection;
    addItemToEnum: (id: string, enumId: string) => void;
    /** Called when a folder without its own object was dropped: `ids` are the objects found below it */
    addFolderToEnum: (folderId: string, ids: string[], enumId: string) => void;
    stylesParent: Record<string, React.CSSProperties>;
    getName: (name: ioBroker.StringOrTranslated | undefined) => string;
    theme: IobTheme;
}

const MEMBER_TYPES: ioBroker.ObjectType[] = ['state', 'channel', 'device'];

/** Collect the topmost visible states, channels and devices below a folder */
function collectMemberIds(item: TreeItem, ids: string[]): void {
    item.children?.forEach(child => {
        if (child.data.sumVisibility === false) {
            return;
        }
        if (child.data.obj && MEMBER_TYPES.includes(child.data.obj.type)) {
            ids.push(child.data.obj._id);
        } else {
            collectMemberIds(child, ids);
        }
    });
}

const DragObjectBrowser = (props: DragObjectBrowserProps): JSX.Element | null => {
    const [wrapperState, setWrapperState] = useState<{
        DragWrapper: React.ComponentType<DragWrapperProps> | null;
    }>({ DragWrapper: null });
    const objectRef = React.useRef<Record<string, ioBroker.Object> | null>(null);

    useEffect(() => {
        const DragWrapper = (dragProps: DragWrapperProps): JSX.Element | null => {
            const onDragEnd = (item: TreeItem, monitor: DragSourceMonitor<TreeItem, { enumId: string }>): void => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    if (item.data.obj) {
                        props.addItemToEnum(item.data.obj._id, dropResult.enumId);
                    } else {
                        const ids: string[] = [];
                        collectMemberIds(item, ids);
                        if (ids.length) {
                            props.addFolderToEnum(item.data.id, ids, dropResult.enumId);
                        }
                    }
                }
            };

            const dragSettings: DragSettings = {
                type: 'object',
                end: onDragEnd,
                item: {
                    data: dragProps.item.data,
                    children: dragProps.item.children,
                    preview:
                        dragProps.item.data && dragProps.item.data.obj ? (
                            <Card
                                key={dragProps.item.data.obj._id}
                                variant="outlined"
                                style={props.stylesParent.enumGroupMember}
                            >
                                {dragProps.item.data.obj.common?.icon ? (
                                    <Icon
                                        style={props.stylesParent.icon}
                                        src={
                                            objectRef.current
                                                ? getSelectIdIconFromObjects(
                                                      objectRef.current,
                                                      dragProps.item.data.obj._id,
                                                      props.lang,
                                                  )
                                                : dragProps.item.data.obj.common.icon
                                        }
                                    />
                                ) : (
                                    ITEM_IMAGES[dragProps.item.data.obj.type] || (
                                        <ListIcon style={props.stylesParent.icon} />
                                    )
                                )}
                                <div>
                                    <div>
                                        {dragProps.item.data.obj.common?.name
                                            ? props.getName(dragProps.item.data.obj.common?.name)
                                            : dragProps.item.data.obj._id}
                                    </div>
                                    {dragProps.item.data.obj.common?.name ? (
                                        <div style={{ fontStyle: 'italic', fontSize: 'smaller', opacity: 0.7 }}>
                                            {dragProps.item.data.obj._id}
                                        </div>
                                    ) : null}
                                </div>
                            </Card>
                        ) : null,
                },
                collect: monitor => ({
                    isDragging: monitor.isDragging(),
                }),
            };

            const [{ isDragging }, dragRef, preview] = useDrag(dragSettings);

            useEffect(() => {
                preview(getEmptyImage(), { captureDraggingState: true });
            }, [preview]);

            return (
                <Box
                    key={dragProps.item.data.id}
                    sx={dragProps.style}
                    ref={(node: HTMLElement | null) => {
                        dragRef(node);
                    }}
                    style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}
                >
                    {dragProps.children}
                </Box>
            );
        };
        setWrapperState({ DragWrapper });
        // eslint-disable-next-line
    }, [props.stylesParent, props.addItemToEnum, props.addFolderToEnum, props.getName]); // react-hooks/exhaustive-deps

    return wrapperState ? (
        <ObjectBrowser
            t={props.t}
            socket={props.socket}
            types={['state', 'channel', 'device']}
            columns={['name', 'type', 'role', 'room', 'func']}
            lang={props.lang}
            dragEnabled
            theme={props.theme}
            themeName={props.theme.name}
            themeType={props.theme.palette.mode}
            DragWrapper={(wrapperState.DragWrapper as React.ComponentType<any>) || undefined}
            setObjectsReference={(objects: Record<string, ioBroker.Object>) => (objectRef.current = objects)}
            levelPadding={10}
        />
    ) : null;
};

export default DragObjectBrowser;
