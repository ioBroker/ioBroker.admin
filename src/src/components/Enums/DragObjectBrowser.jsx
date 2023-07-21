import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { Card, Icon } from '@mui/material';

import ListIcon from '@mui/icons-material/List';

import ObjectBrowser from '../ObjectBrowser';

const DragObjectBrowser = props => {
    const browserProps = props;

    const [wrapperState, setWrapperState] = useState({ DragWrapper: null });

    useEffect(() => {
        const DragWrapper = _props => {
            const onDragEnd = (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    if (item.data.obj) {
                        browserProps.addItemToEnum(item.data.obj._id, dropResult.enumId);
                    } else {
                        // all children ??
                        window.alert(`TODO: Add all direct children of ${item.data.id}`);
                    }
                }
            };

            const dragSettings = {
                type: 'object',
                end: onDragEnd,
            };

            dragSettings.item = {
                data: _props.item.data,
                preview: (_props.item.data && _props.item.data.obj ? <Card
                    key={_props.item.data.obj._id}
                    variant="outlined"
                    className={browserProps.classesParent.enumGroupMember}
                >
                    {
                        _props.item.data.obj.common?.icon
                            ?
                            <Icon
                                className={browserProps.classesParent.icon}
                                src={_props.item.data.obj.common.icon}
                            />
                            :
                            <ListIcon className={browserProps.classesParent.icon} />
                    }
                    {_props.item.data.obj.common?.name ? browserProps.getName(_props.item.data.obj.common?.name) : _props.item.data.obj._id}
                </Card> : null),
            };

            const [{ isDragging }, dragRef, preview] = useDrag(dragSettings);

            useEffect(() => {
                preview(getEmptyImage(), { captureDraggingState: true });
            }, []);

            return <div
                key={_props.item.data.id}
                className={_props.className || ''}
                ref={dragRef}
                style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}
            >
                {_props.children}
            </div>;
        };
        setWrapperState({ DragWrapper });
    // eslint-disable-next-line
    }, []); // react-hooks/exhaustive-deps

    return wrapperState ? <ObjectBrowser
        t={props.t}
        socket={props.socket}
        types={['state', 'channel', 'device']}
        columns={['name', 'type', 'role', 'room', 'func']}
        lang={props.lang}
        dragEnabled
        DragWrapper={wrapperState.DragWrapper}
        levelPadding={10}
    /> : null;
};

DragObjectBrowser.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
};

export default DragObjectBrowser;
