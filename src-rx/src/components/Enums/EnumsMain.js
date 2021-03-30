import { Component } from 'react';

import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import ObjectBrowser from '../../components/ObjectBrowser';

import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';

import {withStyles} from '@material-ui/core/styles';

const styles = {

};

const DragObjectBrowser = (props) => {
    let onDragEnd = (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (item && dropResult) {
            console.log(item);
        }
    };
    let dragSettings = {
        type: 'user',
        end: onDragEnd
    }
    return <ObjectBrowser 
        t={props.t} 
        socket={props.socket}
        lang={props.lang}
        dragEnabled
        dragSettings={dragSettings}
    />
}

const DropZone = (props) => {
    const [{ canDrop, isOver }, dropRef] = useDrop(() => ({
        accept: 'user',
        drop: () => ({ group_id: 22 }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));
    return <div ref={dropRef}>drop zone</div>;
}

class EnumsList extends Component {
    render() {
        return <>
            <DndProvider backend={HTML5Backend}>
                <DropZone/>
                <DragObjectBrowser {...this.props}/>
            </DndProvider>
        </>;
    }
}

EnumsList.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
};

export default withStyles(styles)(EnumsList);