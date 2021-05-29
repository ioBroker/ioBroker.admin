import React, { Component } from 'react';

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';
import clsx from 'clsx';

import EnumBlock from './EnumBlock';
import CategoryLabel from './CategoryLabel';
import EnumEditDialog from './EnumEditDialog';
import EnumTemplateDialog from './EnumTemplateDialog';
import EnumDeleteDialog from './EnumDeleteDialog';
import DragObjectBrowser from './DragObjectBrowser'

import Tooltip from '@material-ui/core/Tooltip';
import LinearProgress from '@material-ui/core/LinearProgress';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import { FaRegFolder as IconCollapsed } from 'react-icons/fa';
import { FaRegFolderOpen as IconExpanded } from 'react-icons/fa';
import DownIcon from '@material-ui/icons/KeyboardArrowDown';
import UpIcon from '@material-ui/icons/KeyboardArrowUp';

import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
    mainGridCont: {
        height: '100%',
        overflowY:'auto'
    },
    childGridCont: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    childGridContWide: {
        height: '100%',
    },
    blocksContainer: {
        overflowY: 'auto',
        overflowX: 'hidden'
    },
    canDrop:{
        backgroundColor: theme.palette.background.default
    },
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'inline-block'
    },
    categoryTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        display: 'inline-flex'
    },
    enumTemplateDialog: {
        overflowY: 'auto',
        textAlign: 'center'
    },
    enumTemplate: {
        display: 'inline-flex',
        padding: 10,
        width: 200
    },
    toolbarButton: {
        //marginRight: theme.spacing(1),
        display: 'inline',
    },
    filter: {
        width: '100%',
        paddingRight: 20
    },
    topPanel: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 20
    },
    topPanel2: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 20px',
        justifyContent: 'space-between'
    }
});

const DndPreview = () => {
    const {display/*, itemType*/, item, style} = usePreview();
    let divStyle = {...style};
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

const enumTemplates = {
    favorites: {
        _id: 'enum.favorites',
        common: {
            name: 'Favorites'
        }
    }
};

function sort(enums, getName) {
    return function (a, b) {
        let aName = getName(enums[a]?.common?.name || '') || a.split('.').pop();
        let bName = getName(enums[b]?.common?.name || '') || b.split('.').pop();
        aName = aName.toLowerCase();
        bName = bName.toLowerCase();
        if (aName > bName) {
            return 1;
        } else if (aName < bName) {
            return -1;
        } else {
            return 0
        }
    };
}

const ENUM_TEMPLATE = {
    type: 'enum',
    common: {
        name: '',
        enabled: true,
        color: false,
        desc: '',
        members: []
    },
    native: {},
};

class EnumsList extends Component {
    constructor(props) {
        super(props);

        let enumsClosed = {};
        try {
            enumsClosed = window.localStorage.getItem('enumsClosed') ? JSON.parse(window.localStorage.getItem('enumsClosed')) : {};
        } catch (e) {

        }
        let enumsCollapsed = [];
        try {
            enumsCollapsed = window.localStorage.getItem('enumsCollapsed') ? JSON.parse(window.localStorage.getItem('enumsCollapsed')) : [];
        } catch (e) {

        }

        this.state = {
            enums: null,
            enumsTree: null,
            selectedTab: null,
            currentCategory: window.localStorage.getItem('enumCurrentCategory') || '',
            search: '',
            enumEditDialog: null,
            enumTemplateDialog: null,
            enumDeleteDialog: null,
            members: {},
            categoryPopoverOpen: false,
            enumPopoverOpen: false,
            enumsClosed,
            updating: [],
            enumsCollapsed,
        };

        this.fastUpdate = false;
    }

    getEnumTemplate = prefix => {
        let enumTemplate = JSON.parse(JSON.stringify(ENUM_TEMPLATE));
        const {_id, name} = EnumsList.findNewUniqueName(prefix, Object.values(this.state.enums), this.props.t('Enum'));
        enumTemplate._id = _id;
        enumTemplate.common.name = name;
        return enumTemplate;
    }

    scrollToEnum(enumId) {
        // check that parent is opened
        let parts = enumId.split('.');
        parts.pop();
        let changed = false;
        const enumsClosed = JSON.parse(JSON.stringify(this.state.enumsClosed));

        while (parts.length > 2) {
            const parentId = parts.join('.');
            if (enumsClosed[parentId]) {
                delete enumsClosed[parentId];
                changed = true;
            }
            parts = parentId.split('.');
            parts.pop();
        }

        if (changed) {
            this.setState({enumsClosed}, () => {
                setTimeout(() => {
                    const el = document.getElementById(enumId);
                    el && el.scrollIntoView(true);
                }, 400);
            });
        } else {
            setTimeout(() => {
                const el = document.getElementById(enumId);
                el && el.scrollIntoView(true);
            }, 400);
        }
    }

    addUpdating(id) {
        if (!this.state.updating.includes(id)) {
            const updating = [...this.state.updating];
            updating.push(id);
            return new Promise(resolve => this.setState({updating}, () => resolve()));
        } else {
            return Promise.resolve();
        }
    }

    createEnumTemplate = (prefix, templateValues) => {
        let enumTemplate = this.getEnumTemplate(prefix);
        enumTemplate._id = templateValues._id;
        enumTemplate.common = {...enumTemplate.common, ...templateValues.common};

        this.scrollToItem = enumTemplate._id;

        this.addUpdating(enumTemplate._id)
            .then(() => this.props.socket.setObject(enumTemplate._id, enumTemplate))
            .catch(e => window.alert('Cannot create enum: ' + e));
    }

    async componentDidMount() {
        await this.updateData();
        this.props.socket.subscribeObject('enum.*', this.onObjectChange);
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeObject('enum.*', this.onObjectChange);
        this.updateTimeout && clearTimeout(this.updateTimeout);
        this.updateTimeout = null;
    }

    onObjectChange = (id, obj) => {
        let changed;

        if (id.startsWith('enum.')) {
            if (obj) {
                const oldObj = (this.changeEnums && this.changeEnums[id]) || this.state.enums[id];
                if (!oldObj || (oldObj && JSON.stringify(oldObj) !== JSON.stringify(obj))) {
                    this.changeEnums = this.changeEnums || JSON.parse(JSON.stringify(this.state.enums));
                    this.changeEnums[id] = obj;
                    changed = true;
                }
            } else {
                if ((this.changeEnums && this.changeEnums[id]) || (!this.changeEnums && this.state.enums[id])) {
                    this.changeEnums = this.changeEnums || JSON.parse(JSON.stringify(this.state.enums));
                    delete this.changeEnums[id];
                    changed = true;
                }
            }
        }

        if (changed) {
            this.updateTimeout && clearTimeout(this.updateTimeout);

            // collect events
            this.updateTimeout = setTimeout(() => {
                this.updateTimeout = null;
                const changeEnums = this.changeEnums
                this.changeEnums = null;
                this.updateData(changeEnums)
                    .then(() => {
                        if (this.scrollToItem) {
                            this.scrollToEnum(this.scrollToItem);
                            this.scrollToItem = null;
                        }
                    })
                    .catch(() => {});
            }, this.fastUpdate ? 0 : 200);

            this.fastUpdate = false;
        }
    }

    updateData = async enums => {
        enums = enums || (await this.props.socket.getForeignObjects('enum.*', 'enum'));
        const members = {};

        const ids = Object.keys(enums);

        // read all members of all enumerations
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (enums[id].common?.members) {
                for (let j = 0; j < enums[id].common.members.length; j++) {
                    let member = enums[id].common.members[j];
                    if (!members[member]) {
                        try {
                            members[member] = await this.props.socket.getObject(member);
                        } catch (e) {
                            window.alert(`Cannot read member "${member}"`);
                        }
                    }
                }
            }
        }

        this.setState({enums, members, updating: []}, () =>
            this.buildTree(enums));
    }

    buildTree(enums) {
        let enumsTree = {
            data: null,
            children: {},
            id: ''
        };

        const ids = Object.keys(enums).sort(sort(enums, this.getName));

        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            let currentEnum = enums[id];
            let idParts = id.split('.');
            let currentContainer = enumsTree;
            let currentParts = [];

            for (let p = 0; p < idParts.length; p++) {
                let currentPart = idParts[p];
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

        this.setCurrentCategory(
            this.state.currentCategory &&
            enumsTree.children.enum.children[this.state.currentCategory] ?
                this.state.currentCategory :
                Object.keys(enumsTree.children.enum.children)[0],
            () => this.setState({enumsTree}));
    }

    setCurrentCategory = (currentCategory, cb) => {
        if (currentCategory !== this.state.currentCategory) {
            this.setState({currentCategory}, () => cb && cb());
            window.localStorage.setItem('enumCurrentCategory', currentCategory);
        } else {
            cb && cb();
        }
    }

    addItemToEnum = (itemId, enumId) => {
        let enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        if (!enumItem.common?.members) {
            enumItem.common = enumItem.common || {};
            enumItem.common.members = [];
        }
        let members = enumItem.common.members;
        if (!members.includes(itemId)) {
            members.push(itemId);

            this.fastUpdate = true;
            this.props.socket.setObject(enumItem._id, enumItem)
                .catch(e => window.alert('Cannot set enum: ' + e));
        }
    }

    removeMemberFromEnum = (memberId, enumId) => {
        let enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        let members = enumItem.common.members;
        const pos = members.indexOf(memberId);
        if (pos !== -1) {
            members.splice(pos, 1);

            this.fastUpdate = true;
            this.props.socket.setObject(enumItem._id, enumItem)
                .catch(e => window.alert('Cannot update enum: ' + e));
        }
    }

    moveEnum = async (fromId, toId) => {
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

        const ids = Object.keys(this.state.enums);

        const updating = [...this.state.updating];

        try {
            for (let i = 0; i < ids.length; i++) {
                let enumItem = this.state.enums[ids[i]];
                if (ids[i].startsWith(fromId)) {
                    let newId = ids[i].replace(fromPrefix, toPrefix);
                    let newEnum = JSON.parse(JSON.stringify(enumItem));
                    newEnum._id = newId;
                    !updating.includes(ids[i]) && updating.push(ids[i]);
                    await this.props.socket.setObject(newId, enumItem);
                    await this.props.socket.delObject(ids[i]);
                }
            }
        } catch (e) {
            window.alert('Cannot move enum: ' + e)
        }

        this.setState({updating});
    }

    renderTree(container, key, level) {
        let ids = null;
        if (!this.state.enumsClosed[container.id]) {
            ids = Object.keys(container.children);
            ids.sort(sort(container.children, this.getName));
        }

        return <div style={{paddingLeft: level ? 32 : 0}} key={container.id || key }>
            {!this.state.search || container.id.toLowerCase().includes(this.state.search.toLowerCase()) ?
                <EnumBlock
                    updating={this.state.updating.includes(container.id)}
                    id={container.id}
                    children={container.children ? Object.keys(container.children).length : 0}
                    enum={container.data}
                    members={this.state.members}
                    moveEnum={this.moveEnum}
                    removeMemberFromEnum={this.removeMemberFromEnum}
                    showEnumEditDialog={this.showEnumEditDialog}
                    showEnumDeleteDialog={this.showEnumDeleteDialog}
                    showEnumTemplateDialog={this.showEnumTemplateDialog}
                    currentCategory={this.state.currentCategory}
                    getEnumTemplate={this.getEnumTemplate}
                    copyEnum={this.copyEnum}
                    getName={this.getName}
                    closed={this.state.enumsClosed[container.id]}
                    collapsed={this.state.enumsCollapsed.includes(container.id)}
                    toggleEnum={this.toggleEnum}
                    onCollapse={() => {
                        const enumsCollapsed = [...this.state.enumsCollapsed];
                        const pos = enumsCollapsed.indexOf(container.id);
                        if (pos === -1) {
                            enumsCollapsed.push(container.id);
                        } else {
                            enumsCollapsed.splice(pos, 1);
                        }
                        this.setState({enumsCollapsed});
                        window.localStorage.setItem('enumsCollapsed', JSON.stringify(enumsCollapsed));
                    }}

                    t={this.props.t}
                    socket={this.props.socket}
                    lang={this.props.lang}
                    classesParent={this.props.classes}
                />
                : null
            }
            {ids ?
                ids.map((id, index) => <React.Fragment key={index}>{this.renderTree(container.children[id], index, level + 1)}</React.Fragment>)
            : null}
        </div>;
    }

    showEnumEditDialog = (enumItem, isNew) => {
        const enumEditDialog = {changed: false};
        enumEditDialog.newItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.originalItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.isNew = isNew;
        this.setState({enumEditDialog});
    }

    showEnumTemplateDialog = prefix =>
        this.setState({enumTemplateDialog: prefix});

    showEnumDeleteDialog = enumItem =>
        this.setState({enumDeleteDialog: enumItem});

    saveEnum = async () => {
        let newItem = this.state.enumEditDialog.newItem;
        const originalId = this.state.enumEditDialog.originalItem._id;

        if (this.state.enumEditDialog.isNew) {
            this.scrollToItem = newItem._id;
        }

        const updating = [...this.state.updating];

        !updating.includes(originalId) && updating.push(originalId);

        await this.props.socket.setObject(newItem._id, newItem);

        if (originalId !== newItem._id) {
            try {
                await this.props.socket.delObject(originalId);

                const ids = Object.keys(this.state.enums);
                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    if (id.startsWith(originalId + '.')) {
                        let newEnumChild = JSON.parse(JSON.stringify(this.state.enums[id]));
                        newEnumChild._id = newEnumChild._id.replace(originalId + '.', newItem._id + '.');

                        !updating.includes(id) && updating.push(id);
                        await this.props.socket.setObject(newEnumChild._id, newEnumChild);
                        await this.props.socket.delObject(id);
                    }
                }
            } catch (e) {
                window.alert('Cannot save enum: ' + e);
            }
        }

        this.setState({enumEditDialog: null, updating});
    }

    deleteEnum = async enumId => {
        const updating = [...this.state.updating];
        try {
            !updating.includes(enumId) && updating.push(enumId);

            this.state.enums[enumId] && (await this.props.socket.delObject(enumId));
            const ids = Object.keys(this.state.enums);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (id.startsWith(enumId + '.')) {
                    !updating.includes(id) && updating.push(id);
                    this.state.enums[enumId] && (await this.props.socket.delObject(id));
                }
            }
        } catch (e) {
            window.alert('Cannot delete enum: ' + e);
        }

        this.setState({enumDeleteDialog: null, updating});
    }

    copyEnum = enumId => {
        let enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        let newId;
        let index = 1;
        do {
            newId = enumId + index.toString();
            index++;
        } while (this.state.enums[newId]);

        enumItem._id = newId;

        this.props.socket.setObject(newId, enumItem)
            .catch(e => window.alert('Cannot delete enum: ' + e));
    }

    toggleEnum = enumId => {
        let enumsClosed = JSON.parse(JSON.stringify(this.state.enumsClosed));
        enumsClosed[enumId] = !enumsClosed[enumId];
        this.setState({enumsClosed});
        window.localStorage.setItem('enumsClosed', JSON.stringify(enumsClosed));
    }

    changeEnumFormData = newItem => {
        const enumEditDialog = JSON.parse(JSON.stringify(this.state.enumEditDialog));
        enumEditDialog.newItem = JSON.parse(JSON.stringify(newItem));
        enumEditDialog.changed =
            JSON.stringify(enumEditDialog.newItem) !== JSON.stringify(this.state.enums[enumEditDialog.originalItem] || {});
        this.setState({enumEditDialog});
    }

    getName = name =>
        name && typeof name === 'object' ? name[this.props.lang] || name.en || '': name || '';

    static _isUniqueName(prefix, list, word, i) {
        return !list.find(item =>
            item._id === (`${prefix}.${word.toLowerCase()}_${i}`));
    }

    static findNewUniqueName(prefix, list, word) {
        let i = 1;
        while (!EnumsList._isUniqueName(prefix, list,  word, i)) {
            i++;
        }
        return {_id: `${prefix}.${word.toLowerCase()}_${i}`, name: word + ' ' + i};
    }

    render() {
        if (!this.state.enumsTree) {
            return <LinearProgress />;
        }
        return <>
            <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
                <DndPreview />
                <Grid container spacing={2} className={this.props.classes.mainGridCont}>
                    <Grid item xs={12} md={6} className={clsx(this.props.classes.childGridCont, this.state.innerWidth > 600 && this.props.classes.childGridContWide)}>
                    <div className={this.props.classes.topPanel}>
                        <IconButton
                            size="small"
                            className={this.props.classes.toolbarButton}
                            onClick={() =>
                                this.state.enumsTree.children.enum.children['favorites'] ?
                                    this.showEnumEditDialog(this.getEnumTemplate('enum'), true)
                                    :
                                    this.setState({categoryPopoverOpen: true})
                            }
                        >
                            <Tooltip title={this.props.t('Add enum')} placement="top">
                                <AddIcon/>
                            </Tooltip>
                        </IconButton>
                        <Popover
                            open={this.state.categoryPopoverOpen}
                            onClose={() => this.setState({categoryPopoverOpen: false})}
                            anchorEl={() => document.getElementById('categoryPopoverButton')}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                        >
                            <MenuList>
                                {this.state.enumsTree.children.enum.children['favorites'] ? null :
                                    <MenuItem onClick={() => this.createEnumTemplate('enum', enumTemplates.favorites)}>
                                        {this.props.t('Favorites')}
                                    </MenuItem>
                                }
                                <MenuItem onClick={() => this.showEnumEditDialog(this.getEnumTemplate('enum'), true)}>
                                    {this.props.t('Custom enum')}
                                </MenuItem>
                            </MenuList>
                        </Popover>
                        <Tabs
                            value={this.state.currentCategory}
                            variant="scrollable"
                            scrollButtons="auto"
                            onChange={(e, newTab) => this.setCurrentCategory(newTab)}
                        >
                            {Object.keys(this.state.enumsTree.children.enum.children).map((category, index) => {
                                let categoryData = this.state.enumsTree.children.enum.children[category].data;
                                categoryData = categoryData || {
                                    _id: this.state.enumsTree.children.enum.children[category].id,
                                    common: {
                                        name: this.state.enumsTree.children.enum.children[category].id.split('.').pop()
                                    }
                                };
                                return <Tab
                                    key={index}
                                    component={'span'}
                                    style={{backgroundColor: categoryData.common?.color || undefined, borderRadius: 4}}
                                    label={<CategoryLabel
                                        categoryData={categoryData}
                                        showEnumEditDialog={this.showEnumEditDialog}
                                        showEnumDeleteDialog={this.showEnumDeleteDialog}
                                        {...this.props}
                                    />}
                                    value={category}
                                />;
                            })}
                        </Tabs>
                    </div>
                        <div className={this.props.classes.topPanel2}>
                            <TextField
                                value={this.state.search}
                                placeholder={this.props.t('Filter')}
                                InputLabelProps={{shrink: true}}
                                className={this.props.classes.filter}
                                onChange={e => this.setState({search: e.target.value})}
                            />
                            <Tooltip title={this.props.t('Narrow all')} placement="top">
                                <IconButton
                                    //size="small"
                                    className={this.props.classes.toolbarButton}
                                    onClick={() => {
                                        let enumsCollapsed = Object.keys(this.state.enums);
                                        this.setState({enumsCollapsed});
                                        window.localStorage.setItem('enumsCollapsed', JSON.stringify(enumsCollapsed));
                                    }}
                                >
                                    <UpIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={this.props.t('Wide all')} placement="top">
                                <IconButton
                                    //size="small"
                                    className={this.props.classes.toolbarButton}
                                    onClick={() => {
                                        let enumsCollapsed = [];
                                        this.setState({enumsCollapsed});
                                        window.localStorage.setItem('enumsCollapsed', JSON.stringify(enumsCollapsed));
                                    }}
                                >
                                    <DownIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={this.props.t('Collapse all')} placement="top">
                                <IconButton
                                    //size="small"
                                    className={this.props.classes.toolbarButton}
                                    onClick={() => {
                                        let enumsClosed = {};
                                        Object.keys(this.state.enums).forEach(id => enumsClosed[id] = true);
                                        this.setState({enumsClosed});
                                        window.localStorage.setItem('enumsClosed', JSON.stringify(enumsClosed));
                                    }}
                                >
                                        <IconCollapsed/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={this.props.t('Expand all')} placement="top">
                                <IconButton
                                    //size="small"
                                    className={this.props.classes.toolbarButton}
                                    onClick={() => {
                                        let enumsClosed = {};
                                        this.setState({enumsClosed});
                                        window.localStorage.setItem('enumsClosed', JSON.stringify(enumsClosed));
                                    }}
                                >
                                    <IconExpanded/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={this.props.t('Add group')} placement="top">
                                <IconButton
                                    //size="small"
                                    onClick={() => {
                                        if (['functions', 'rooms'].includes(this.state.currentCategory)) {
                                            this.setState({enumTemplateDialog: 'enum.' + this.state.currentCategory});
                                        } else {
                                            this.showEnumEditDialog(this.getEnumTemplate('enum.' + this.state.currentCategory), true);
                                        }
                                    }}
                                >
                                    <AddIcon/>
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className={this.props.classes.blocksContainer}>
                            {Object.values(this.state.enumsTree.children.enum.children[this.state.currentCategory].children)
                                .map((enumItem, index) => this.renderTree(enumItem, index, 0))}
                        </div>
                    </Grid>
                    <Grid item xs={12} md={6} className={clsx(this.props.classes.childGridCont, this.state.innerWidth > 600 && this.props.classes.childGridContWide)}>
                        <div className={this.props.classes.blocksContainer}>
                            <DragObjectBrowser
                                addItemToEnum={this.addItemToEnum}
                                getName={this.getName}
                                classesParent={this.props.classes}
                                t={this.props.t}
                                socket={this.props.socket}
                                lang={this.props.lang}
                            />
                        </div>
                    </Grid>
                </Grid>
            </DndProvider>
            {this.state.enumEditDialog ? <EnumEditDialog
                onClose={() => this.setState({enumEditDialog: null})}
                enums={Object.values(this.state.enums)}
                enum={this.state.enumEditDialog.newItem}
                getName={this.getName}
                isNew={this.state.enumEditDialog.isNew}
                t={this.props.t}
                lang={this.props.lang}
                classesParent={this.props.classes}
                changed={this.state.enumEditDialog.changed}
                onChange={this.changeEnumFormData}
                saveData={this.saveEnum}
            /> : null}
            <EnumDeleteDialog
                open={!!this.state.enumDeleteDialog}
                onClose={() => this.setState({enumDeleteDialog: null})}
                enum={this.state.enumDeleteDialog}
                getName={this.getName}
                t={this.props.t}
                classes={this.props.classes}
                deleteEnum={this.deleteEnum}
            />
            {!!this.state.enumTemplateDialog && <EnumTemplateDialog
                prefix={this.state.enumTemplateDialog}
                onClose={() => this.setState({enumTemplateDialog: null})}
                t={this.props.t}
                lang={this.props.lang}
                classesParent={this.props.classes}
                createEnumTemplate={this.createEnumTemplate}
                showEnumEditDialog={this.showEnumEditDialog}
                enums={this.state.enums}
                getEnumTemplate={this.getEnumTemplate}
            />}
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