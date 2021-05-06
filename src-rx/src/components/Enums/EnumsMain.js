import React, { Component, useEffect, useState } from 'react';

import { DndProvider, useDrop, useDrag } from 'react-dnd'
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview'

import ObjectBrowser from '../../components/ObjectBrowser';

import EnumBlock from './EnumBlock';
import CategoryLabel from './CategoryLabel';
import EnumEditDialog from './EnumEditDialog';
import EnumDeleteDialog from './EnumDeleteDialog';

import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Card from '@material-ui/core/Card';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';

import AddIcon from '@material-ui/icons/Add';
import ListIcon from '@material-ui/icons/List';

import {withStyles} from '@material-ui/core/styles';

const boxShadowHover = '0 1px 1px 0 rgba(0, 0, 0, .4),0 6px 6px 0 rgba(0, 0, 0, .2)';
const styles = theme => ({
   
    canDrop:{
        backgroundColor:theme.palette.background.default
    } ,
    enumGroupCard2: {
        border: "1px solid #FFF",
        borderColor: theme.palette.divider, 
        margin:    10,
        minHeight: 140,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "all 200ms ease-out",
        opacity:1,
        overflow: "hidden",
        '&:hover': {
            overflowY: 'auto',
            boxShadow: boxShadowHover
        } 
    },
    enumGroupCardSecondary:{
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.success.light
    },
    enumCardContent:
    {
        height:"100%",
        opacity:1 
    },
    enumGroupTitle: {
        display: 'inline-flex',
        alignItems: 'center',
    },
    enumGroupEnumName: {
        fontWeight: 900,
        padding: 5
    },
    enumGroupEnumID : {
        opacity:0.7,
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
        backgroundColor: "#00000010",
        border: "1px solid #FFF",
        borderColor: theme.palette.text.hint, 
        color: theme.palette.text.primary,
        alignItems: 'center',
    },
    icon: {
        height: 32,
        width: 32,
        marginRight:5,
        backgroundSize: "cover",
        backgroundPosition:"center",
        display: 'inline-block'
    },
    right: {
        float: 'right',
    },
    left: {
        float: 'left',
        marginRight:10
    },
    dialog: {
        // padding: 10, 
        
        // maxWidth: '100vw',
        // maxHeight: '100vh',
        // overflowY: 'auto',
        // overflowX: 'hidden',
        // padding: 0
    }, 
    flex : {
        display: "flex" 
    },
    formControl : {
        display: "flex",
        padding: 24,
        flexGrow: 1000
    },
    formContainer : {
        display: "flex",
        justifyContent:"center",
        alignItems:"center"
    },
    formIcon : {
        margin: 10,
        opacity: 0.6
    },
    descriptionPanel: {
        width: '100%',
        backgroundColor: 'transparent',
        marginBottom: 20,
        marginTop: 20,
        marginLeft: 20,
        opacity: .75,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        '& a': {
            paddingLeft: 3,
            color: theme.palette.type === 'dark' ? '#EEE' : '#111',

        }
    },
    dialogTitle: {
        borderBottom: "1px solid #00000020",
        padding : 0,
        width:"100%"
    },
    dialogActions: {
        borderTop: "1px solid #00000020", 
        width:"100%"
    },
    dialogPaper: {
        overflowY: 'initial',
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
        alignItems:"center",
        width: "calc(100% - 100px)",
        height: "calc(100% - 100px)",
        maxWidth: 800,
        maxHeight:  "100%"
    },
    dialogPaperMini : {
        maxHeight: 300
    },
    colorPicker: {
        // position:"absolute"
    },  
    iconPreview: {
        maxHeight: 40,
        maxWidth: 40,
    },
    mainDescription: {
        fontSize: '200%'
    },
    deleteDialog: {
        padding: 20
    },
    categoryTitle: {
        flexDirection: 'row', 
        alignItems: 'center', 
        display: 'inline-flex'
    }
});

const DndPreview = () => {
    const {display/*, itemType*/, item, style} = usePreview();
    let divStyle = {...style}
    divStyle.zIndex = 10000;
    if (!display) {
        return null;
    }
    return <div style={divStyle}>{item.preview}</div>;
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

const DragObjectBrowser = (props) => {
    let browserProps = props;
    const [wrapperState, setWrapperState] = useState({DragWrapper: null});
    useEffect(() => {
        const DragWrapper = props => {
            let onDragEnd = (item, monitor) => {
                const dropResult = monitor.getDropResult();
                if (item.data && dropResult) {
                    browserProps.addItemToEnum(item.data.obj._id, dropResult.enum_id);
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
                                className={ props.classes.icon }
                                src={props.item.data.obj.common.icon}
                            />
                            :
                            <ListIcon className={browserProps.classes.icon} />
                    }
                    {props.item.data.obj.common?.name ? browserProps.getName(props.item.data.obj.common?.name) : null}
                </Card> : null)
            };
            const [{ isDragging }, dragRef, preview] = useDrag(dragSettings);
            useEffect(() => {
                preview(getEmptyImage(), { captureDraggingState: true });
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []);
        
            return <div ref={dragRef} style={{ backgroundColor: isDragging ? 'rgba(100,152,255,0.1)' : undefined }}>{props.children}</div>;
        }
        setWrapperState({DragWrapper: DragWrapper});
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps
    
    return wrapperState ? <ObjectBrowser
        t={props.t}
        socket={props.socket}
        types={['state', 'channel', 'device']}
        lang={props.lang}
        dragEnabled
        DragWrapper={wrapperState.DragWrapper}
    /> : null;
}

const enumTemplates = {
    'favorites': {
        _id: 'enum.favorites',
        common: {
            name: 'Favorites'
        }
    }
}

class EnumsList extends Component {
    state = {
        enums: null,
        enumsTree: null,
        selectedTab: null,
        currentCategory: null,
        search: '',
        enumEditDialog: false,
        enumTemplateDialog: false,
        enumEditDialogNew: null,
        enumDeleteDialog: false,
        members: {},
        categoryPopoverOpen: false,
        enumPopoverOpen: false
    }

    enumTemplate = {
        "type": "enum",
        "common": {
            "name": "",
            "dontDelete": false,
            "enabled": true,
            "color": false,
            "desc": ""
        },
        "native": {},
        "_id": "enum.new",
        "members": []
    };

    getEnumTemplate(prefix) {
        let enumTemplate = JSON.parse(JSON.stringify(this.enumTemplate));
        enumTemplate._id = prefix + '.new';
        return enumTemplate
    }

    createEnumTemplate(prefix, templateName) {
        let enumTemplate = this.getEnumTemplate(prefix);
        let templateValues = enumTemplates[templateName];
        enumTemplate._id = templateValues._id;
        enumTemplate.common = {...enumTemplate.common, ...templateValues.common};
        this.props.socket.setObject(enumTemplate._id, enumTemplate).then(()=>this.updateData());
    }

    componentDidMount() {
        this.updateData();
    }

    updateData = async () => {
        const enums = await this.props.socket.getForeignObjects('enum.*', 'enum');
        const members = {}
        for (let enumKey in enums) {
            if (enums[enumKey].common.members) {
                for (let memberKey in enums[enumKey].common.members) {
                    let member = enums[enumKey].common.members[memberKey];
                    if (!members[member]) {
                        members[member] = await this.props.socket.getObject(member);
                    }
                }
            }
        }
        this.setState({enums: enums, members: members});
        this.createTree(enums);
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
        this.setState({
            enumsTree: enumsTree,
            currentCategory: this.state.currentCategory && enumsTree.children.enum.children[this.state.currentCategory] ? this.state.currentCategory : Object.keys(enumsTree.children.enum.children)[0]
        })
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

    moveEnum = (fromId, toId) => {
        if (toId.startsWith(fromId)) {
            return;
        }
        let fromPrefix = fromId.split('.');
        fromPrefix.pop();
        fromPrefix = fromPrefix.join('.');
        let toPrefix = toId;
        if (fromPrefix === toPrefix) {
            return;
        }
        Promise.all(Object.keys(this.state.enums).map(async id => {
            let enumItem = this.state.enums[id];
            if (id.startsWith(fromId)) {
                let newId = id.replace(fromPrefix, toPrefix);
                let newEnum = JSON.parse(JSON.stringify(enumItem));
                newEnum._id = newId;
                return this.props.socket.setObject(newId, enumItem).then(
                    this.props.socket.delObject(id)
                );
            }
        })).then(() => this.updateData())
    }

    removeMemberFromEnum = (memberId, enumId) => {
        let enumItem = this.state.enums[enumId];
        let members = enumItem.common.members;
        if (members.includes(memberId)) {
            members.splice(members.indexOf(memberId), 1);
            this.props.socket.setObject(enumItem._id, enumItem).then(() => {
                this.updateData();
            });
        }
    } 

    renderTree(container) {
        return <div style={{paddingLeft: '10px'}}>
            {container.data && (!this.state.search || container.data._id.toLowerCase().includes(this.state.search.toLowerCase())) ? <EnumBlock
                enum={container.data}
                members={this.state.members}
                moveEnum={this.moveEnum}
                removeMemberFromEnum={this.removeMemberFromEnum}
                showEnumEditDialog={this.showEnumEditDialog}
                showEnumDeleteDialog={this.showEnumDeleteDialog}
                copyEnum={this.copyEnum}
                key={container.data._id}
                getName={this.getName}
                {...this.props}
            /> : null}
            {Object.values(container.children).map((item, index) => <React.Fragment key={index}>{this.renderTree(item)}</React.Fragment>)}
        </div>
    }

    showEnumEditDialog = (enumItem, isNew) => {
        enumItem = JSON.parse(JSON.stringify(enumItem));
        enumItem.common.password = '';
        enumItem.common.passwordRepeat = '';
        this.setState({enumEditDialog: enumItem, enumEditDialogNew: isNew});
    }

    showEnumDeleteDialog = (enumItem) => {
        this.setState({enumDeleteDialog: enumItem})
    }

    saveEnum = (originalId) => {
        let enumItem = JSON.parse(JSON.stringify(this.state.enumEditDialog));
        this.props.socket.setObject(enumItem._id, enumItem)
        .then(()=>{
            if (originalId && originalId !== this.state.enumEditDialog._id) {
                return this.props.socket.delObject(originalId);
            }
        })
        .then(()=>{
            this.updateData();
            this.setState({enumEditDialog: false});
        });
    }

    deleteEnum = (enumId) => {
        this.props.socket.delObject(enumId).then(()=>{
            this.updateData();
            this.setState({enumDeleteDialog: false});
        });
    }

    copyEnum = (enumId) => {
        let enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        let newId;
        let index = 1;
        do {
            newId = enumId + index.toString();
            index++;
        } while (this.state.enums[newId]);
        enumItem._id = newId;
        this.props.socket.setObject(newId, enumItem).then(() => this.updateData());
    }

    changeEnumFormData = (enumItem) => {
        this.setState({enumEditDialog: enumItem})
    }
    
    getName(name) {
        return typeof(name) === 'object' ? name.en : name;
    }

    render() {
        if (!this.state.enumsTree) {
            return 'loading';
        }
        return <>
            <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
                <DndPreview />
                <Grid container>
                    <Grid md={6} item>
                    <IconButton 
                        size="small"
                        id="categoryPopoverButton"
                        className={this.props.classes.left} 
                        onClick={()=>this.setState({categoryPopoverOpen: true})}
                    >
                        <AddIcon/>
                    </IconButton>
                    <Popover 
                        open={this.state.categoryPopoverOpen} 
                        onClose={() => this.setState({categoryPopoverOpen: false})}
                        anchorEl={()=>document.getElementById('categoryPopoverButton')}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                    >
                        <MenuList>
                            {this.state.enumsTree.children.enum.children['favorites'] ? null :
                                <MenuItem onClick={()=>this.createEnumTemplate('enum', 'favorites')}>
                                    {this.props.t('Favorites')}
                                </MenuItem>
                            }
                            <MenuItem onClick={()=>this.showEnumEditDialog(this.getEnumTemplate('enum'), true)}>
                                {this.props.t('Custom enum')}
                            </MenuItem>
                        </MenuList>
                    </Popover>
                    <Tabs
                        value={this.state.currentCategory}
                        variant="scrollable"
                        scrollButtons="auto"
                        onChange={(e, newTab) => this.setState({currentCategory: newTab})}
                    >
                        {Object.keys(this.state.enumsTree.children.enum.children).map((category, index) => 
                        {
                            let categoryData = this.state.enumsTree.children.enum.children[category].data;
                            return <Tab 
                                key={index} 
                                style={{backgroundColor: categoryData.common.color, borderRadius: 4}}
                                label={<CategoryLabel 
                                    categoryData={categoryData}
                                    showEnumEditDialog={this.showEnumEditDialog}
                                    showEnumDeleteDialog={this.showEnumDeleteDialog}
                                    {...this.props}
                                />}
                                value={category} 
                            />
                        }
                        )}
                    </Tabs>
                        <div>
                            <TextField value={this.state.search} label={this.props.t('Filter')} onChange={e => this.setState({search: e.target.value})}/>
                            <IconButton 
                                size="small" 
                                onClick={()=>this.setState({enumPopoverOpen: true})}
                                id="enumPopoverButton"
                            >
                                <AddIcon/>
                            </IconButton>
                            <Popover 
                                open={this.state.enumPopoverOpen} 
                                onClose={() => this.setState({enumPopoverOpen: false})}
                                anchorEl={()=>document.getElementById('enumPopoverButton')}
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            >
                                <MenuList>
                                    <MenuItem onClick={()=>this.showEnumEditDialog(this.getEnumTemplate('enum.' + this.state.currentCategory), true)}>
                                        {this.props.t('Custom group')}
                                    </MenuItem>
                                </MenuList>
                            </Popover>
                        </div>
                        {Object.values(this.state.enumsTree.children.enum.children[this.state.currentCategory].children).map(enumItem => this.renderTree(enumItem))}
                    </Grid>
                    <Grid md={6} item>
                        <DragObjectBrowser
                            addItemToEnum={this.addItemToEnum}
                            getName={this.getName}
                            classes={this.props.classes}
                            t={this.props.t}
                            socket={this.props.socket}
                            lang={this.props.lang}
                        />
                    </Grid>
                </Grid>
            </DndProvider>
            <EnumEditDialog 
                open={!!this.state.enumEditDialog} 
                onClose={()=>this.setState({enumEditDialog: false})}
                enums={Object.values(this.state.enums)}
                enum={this.state.enumEditDialog}
                isNew={this.state.enumEditDialogNew}
                t={this.props.t}
                classes={this.props.classes}
                change={this.changeEnumFormData}
                saveData={this.saveEnum}
            />
            <EnumDeleteDialog 
                open={!!this.state.enumDeleteDialog} 
                onClose={()=>this.setState({enumDeleteDialog: false})}
                enum={this.state.enumDeleteDialog}
                t={this.props.t}
                classes={this.props.classes}
                deleteEnum={this.deleteEnum}
            />
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