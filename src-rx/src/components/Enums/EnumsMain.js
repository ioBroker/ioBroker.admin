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

class EnumsList extends Component {
    state = {
        enums: null,
        enumsTree: null,
        selectedTab: null
    }

    componentDidMount() {
        this.updateData();
    }

    updateData = () => {
        this.props.socket.getForeignObjects('enum.*', 'enum').then(enums => {
            this.setState({enums: enums})
            this.createTree(enums);
        });
    }

    createTree(enums) {
        let enumsTree = {
            data: null,
            children: {},
            id: ''
        };
        
        for (let i in enums) {
            let id = enums[i]._id;
            let currentEnum = enums[i];
            let idParts = id.split('.');
            let currentContainer = enumsTree;
            let currentParts = [];
            for (let i2 in idParts) {
                let currentPart = idParts[i2]
                currentParts.push(currentPart);
                if (!currentContainer.children[currentPart]) {
                    currentContainer.children[currentPart] = {
                        data: null,
                        children: {},
                        id: currentParts.join('.')
                    };
                }
                currentContainer = currentContainer.children[currentPart];
            }
            currentContainer.data = currentEnum;
        }
        console.log(enumsTree);
        this.setState({enumsTree: enumsTree})
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

    renderTree(container) {
        return <div style={{paddingLeft: '10px'}}>
            {container.data ? <EnumBlock 
                enum={container.data}
            /> : null}
            {Object.values(container.children).map(item => this.renderTree(item))}
        </div>
    }

    render() {
        if (!this.state.enumsTree) {
            return 'loading';
        }
        return <>
            <DndProvider backend={HTML5Backend}>
                <Grid container>
                    <Grid md={6} item>
                        {this.renderTree(this.state.enumsTree)}
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