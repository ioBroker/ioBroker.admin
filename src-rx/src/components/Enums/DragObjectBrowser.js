import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend';

import ObjectBrowser from '../../components/ObjectBrowser';

import Card from '@material-ui/core/Card';
import Icon from '@material-ui/core/Icon';

import ListIcon from '@material-ui/icons/List';

const DragObjectBrowser = (props) => {
    for (let key in props) {
        console.log(key);
    }
    let browserProps = props;
    const [wrapperState, setWrapperState] = useState({DragWrapper: null});
    useEffect(() => {
        const DragWrapper = props => {
            let onDragEnd = (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    if (item.data.obj) {
                        browserProps.addItemToEnum(item.data.obj._id, dropResult.enumId);
                    } else {
                        // all children ??
                        window.alert('TODO: Add all direct children of ' + item.data.id);
                    }
                }
            };
            let dragSettings = {
                type: 'object',
                end: onDragEnd,
            }
            dragSettings.item = {
                data: props.item.data,
                preview: (props.item.data && props.item.data.obj ? <Card
                    key={props.item.data.obj._id}
                    variant="outlined"
                    className={browserProps.classes.enumGroupMember}
                >
                    {
                        props.item.data.obj.common?.icon
                            ?
                            <Icon
                                className={ browserProps.classes.icon }
                                src={props.item.data.obj.common.icon}
                            />
                            :
                            <ListIcon className={browserProps.classes.icon} />
                    }
                    {props.item.data.obj.common?.name ? browserProps.getName(props.item.data.obj.common?.name) : props.item.data.obj._id}
                </Card> : null)
            };
            const [{ isDragging }, dragRef, preview] = useDrag(dragSettings);
            useEffect(() => {
                preview(getEmptyImage(), { captureDraggingState: true });
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []);

            return <div key={props.item.data.id} ref={dragRef} style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}>{props.children}</div>;
        }
        setWrapperState({DragWrapper: DragWrapper});
    // eslint-disable-next-line
    }, []); // react-hooks/exhaustive-deps

    return wrapperState ? <ObjectBrowser
        t={props.t}
        socket={props.socket}
        types={['state', 'channel', 'device']}
        lang={props.lang}
        dragEnabled
        DragWrapper={wrapperState.DragWrapper}
    /> : null;
}

DragObjectBrowser.propTypes = {
    addItemToEnum: PropTypes.func,
    getName: PropTypes.func,
    classes: PropTypes.object,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
};

export default DragObjectBrowser;