import React, { useEffect, useState, type JSX } from 'react';

import { useDrag, type DragSourceMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Box, Card } from '@mui/material';

import { List as ListIcon } from '@mui/icons-material';

import { type AdminConnection, Icon, type IobTheme, type Translate } from '@iobroker/adapter-react-v5';

import ObjectBrowser, {
    type TreeItemData,
    type TreeItem,
    getSelectIdIconFromObjects,
    ITEM_IMAGES,
} from '../ObjectBrowser';

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
    item: { data: TreeItemData; preview: JSX.Element | null };
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
    stylesParent: Record<string, React.CSSProperties>;
    getName: (name: string | Record<string, string>) => string;
    theme: IobTheme;
}

const DragObjectBrowser = (props: DragObjectBrowserProps): JSX.Element => {
    const [wrapperState, setWrapperState] = useState({ DragWrapper: null });
    const objectRef = React.useRef<Record<string, ioBroker.Object> | null>(null);

    useEffect(() => {
        const DragWrapper = (dragProps: DragWrapperProps): JSX.Element => {
            const onDragEnd = (item: TreeItem, monitor: DragSourceMonitor<TreeItem, { enumId: string }>): void => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    if (item.data.obj) {
                        props.addItemToEnum(item.data.obj._id, dropResult.enumId);
                    } else {
                        // all children ??
                        window.alert(`TODO: Add all direct children of ${item.data.id}`);
                    }
                }
            };

            const dragSettings: DragSettings = {
                type: 'object',
                end: onDragEnd,
                item: {
                    data: dragProps.item.data,
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
                                                ? (getSelectIdIconFromObjects(
                                                      objectRef.current,
                                                      dragProps.item.data.obj._id,
                                                      props.lang,
                                                  ) as string | React.JSX.Element)
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
                    ref={dragRef}
                    style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}
                >
                    {dragProps.children}
                </Box>
            );
        };
        setWrapperState({ DragWrapper });
        // eslint-disable-next-line
    }, [props.stylesParent, props.addItemToEnum, props.getName]); // react-hooks/exhaustive-deps

    return wrapperState ? (
        <ObjectBrowser
            t={props.t}
            socket={props.socket}
            types={['state', 'channel', 'device']}
            columns={['name', 'type', 'role', 'room', 'func']}
            lang={props.lang}
            dragEnabled
            theme={props.theme}
            DragWrapper={wrapperState.DragWrapper}
            setObjectsReference={(objects: Record<string, ioBroker.Object>) => (objectRef.current = objects)}
            levelPadding={10}
        />
    ) : null;
};

export default DragObjectBrowser;
