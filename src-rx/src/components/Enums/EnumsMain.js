import { Component } from 'react';

import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import ObjectBrowser from '../../components/ObjectBrowser';

import EnumBlock from './EnumBlock';

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
            props.addItemToEnum(item.data.obj._id, dropResult.enum_id);
        }
    };
    let dragSettings = {
        type: 'object',
        end: onDragEnd
    }
    return <ObjectBrowser 
        t={props.t} 
        socket={props.socket}
        types={['state', 'channel', 'device']}
        lang={props.lang}
        dragEnabled
        dragSettings={dragSettings}
    />
}

const DropZone = (props) => {
    const [{ canDrop, isOver }, dropRef] = useDrop(() => ({
        accept: 'object',
        drop: () => ({ group_id: 22 }),
        canDrop: (item, monitor) => !!(item.data.obj),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));
    return <div ref={dropRef}>drop zone</div>;
}

class EnumsList extends Component {
    state = {
        enums: null
    }

    componentDidMount() {
        this.updateData();
    }

    updateData = () => {
        this.props.socket.getForeignObjects('enum.*', 'enum').then(enums => {
            console.log(enums);
            this.setState({enums: enums})
        });
    }

    addItemToEnum = (itemId, enumId) => {
        let enumItem = Object.values(this.state.enums).find(enumItem => enumItem._id === enumId);
        let members = enumItem.common.members || [];
        if (!members.includes(itemId)) {
            members.push(itemId);
            this.props.socket.setObject(enumItem._id, enumItem).then(() => {
                this.updateData();
            });
        }
    }

    render() {
        if (!this.state.enums) {
            return 'loading';
        }
        return <>
            <DndProvider backend={HTML5Backend}>
                <Grid container>
                    <Grid md={6} item>
                        <DropZone/>
                        {Object.values(this.state.enums).map(enumItem => 
                            <EnumBlock 
                                enum={enumItem}
                            />
                        )}
                    </Grid>
                    <Grid md={6} item>
                        <DragObjectBrowser 
                            addItemToEnum={this.addItemToEnum}
                            {...this.props}
                        />
                    </Grid>
                </Grid>
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