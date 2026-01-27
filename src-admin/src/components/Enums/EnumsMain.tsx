import React, { Component, type JSX } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';
import ReactSplit, { SplitDirection } from '@devbookhq/splitter';

import { Tooltip, LinearProgress, Tabs, Tab, TextField, Popover, MenuItem, MenuList, IconButton } from '@mui/material';

import {
    Add as AddIcon,
    UnfoldMore as ExpandIcon,
    UnfoldLess as CollapseIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { FaRegFolder as IconCollapsed, FaRegFolderOpen as IconExpanded } from 'react-icons/fa';

import { type AdminConnection, type IobTheme, type ThemeType, type Translate } from '@iobroker/adapter-react-v5';

import EnumBlock from './EnumBlock';
import CategoryLabel from './CategoryLabel';
import EnumEditDialog from './EnumEditDialog';
import EnumTemplateDialog from './EnumTemplateDialog';
import EnumDeleteDialog from './EnumDeleteDialog';
import DragObjectBrowser from './DragObjectBrowser';
import AdminUtils from '../../helpers/AdminUtils';

const styles: Record<string, any> = {
    mainGridCont: {
        height: '100%',
        overflowY: 'auto',
    },
    childGridCont: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    enumGroupMember: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 16px',
    },
    childGridContWide: {
        height: '100%',
    },
    blocksContainer: {
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    canDrop: (theme: IobTheme) => ({
        backgroundColor: theme.palette.background.default,
    }),
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'inline-block',
    },
    categoryTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        display: 'inline-flex',
    },
    enumTemplateDialog: {
        overflowY: 'auto',
        textAlign: 'center',
    },
    enumTemplate: {
        display: 'inline-flex',
        padding: 10,
        width: 200,
    },
    toolbarButton: {
        // marginRight: 8,
        // display: 'inline',
    },
    filter: {
        width: '100%',
        paddingRight: 20,
    },
    topPanel: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 20,
    },
    topPanel2: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 20px',
        justifyContent: 'space-between',
    },
    searchText: {
        color: 'orange',
    },
};

const DndPreview = (): JSX.Element | null => {
    const preview = usePreview<JSX.Element>();
    const display = preview.display;

    // TODO: How to fix this?
    const { item, style } = preview as unknown as { item: { preview: JSX.Element }; style: React.CSSProperties };
    if (!display) {
        return null;
    }

    return <div style={{ ...style, zIndex: 1000 }}>{item.preview}</div>;
};

/* function mobileCheck() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series([46])0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br([ev])w|bumb|bw-([nu])|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do([cp])o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly([-_])|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-([mpt])|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c([- _agpst])|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac([ \-/])|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja([tv])a|jbro|jemu|jigs|kddi|keji|kgt([ /])|klon|kpt |kwc-|kyo([ck])|le(no|xi)|lg( g|\/([klu])|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t([- ov])|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30([02])|n50([025])|n7(0([01])|10)|ne(([cm])-|on|tf|wf|wg|wt)|nok([6i])|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan([adt])|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c([-01])|47|mc|nd|ri)|sgh-|shar|sie([-m])|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel([im])|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c([- ])|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0, 4))) check = true; }(navigator.userAgent || navigator.vendor || window.opera));
    return check;
} */

const enumTemplates: Record<string, ioBroker.EnumObject> = {
    favorites: {
        _id: 'enum.favorites',
        type: 'enum',
        common: {
            name: {
                en: 'Favorites',
                de: 'Favoriten',
                ru: 'Избранное',
                pt: 'Favoritos',
                nl: 'Favorieten',
                fr: 'Favoris',
                it: 'Preferiti',
                es: 'Favoritos',
                pl: 'Ulubione',
                uk: 'Обране',
                'zh-cn': '收藏夹',
            },
        },
        native: {},
    },
};

function sort(
    enums: Record<string, ioBroker.EnumObject>,
    getName: (name: ioBroker.StringOrTranslated) => string | undefined,
): (a: string, b: string) => number {
    return (a: string, b: string): number => {
        let aName = getName(enums[a]?.common?.name || '') || a.split('.').pop();
        let bName = getName(enums[b]?.common?.name || '') || b.split('.').pop();
        aName = aName.toLowerCase();
        bName = bName.toLowerCase();
        if (aName > bName) {
            return 1;
        }
        if (aName < bName) {
            return -1;
        }
        return 0;
    };
}

const ENUM_TEMPLATE: ioBroker.EnumObject = {
    _id: '',
    type: 'enum',
    common: {
        name: '',
        color: '',
        desc: '',
        members: [],
    },
    native: {},
};

interface TreeItem {
    data: ioBroker.EnumObject | null;
    children: Record<string, TreeItem>;
    id: string;
}

interface EnumsListProps {
    socket: AdminConnection;
    t: Translate;
    lang: ioBroker.Languages;
    themeType: ThemeType;
    theme: IobTheme;
}

interface EnumEditDialogProps {
    changed: boolean;
    originalItem?: ioBroker.EnumObject;
    newItem?: ioBroker.EnumObject;
    isNew?: boolean;
}

interface EnumsListState {
    enums: Record<string, ioBroker.EnumObject> | null;
    enumsTree: TreeItem | null;
    currentCategory: string;
    search: string;
    enumEditDialog: EnumEditDialogProps | null;
    enumTemplateDialog: string | null;
    enumDeleteDialog: ioBroker.EnumObject | null;
    members: Record<string, ioBroker.Object>;
    categoryPopoverOpen: boolean;
    enumsClosed: Record<string, boolean>;
    updating: string[];
    enumsCollapsed: string[];
    innerWidth: number;
    splitSizes: [number, number];
}

export default class EnumsList extends Component<EnumsListProps, EnumsListState> {
    private readonly cachedIcons: Record<string, string>;

    private fastUpdate: boolean;

    private readonly refFilter: React.RefObject<HTMLInputElement>;

    private readonly refClearButton: React.RefObject<HTMLButtonElement>;

    private updateTimeout: ReturnType<typeof setTimeout> | null = null;

    private changeEnums: Record<string, ioBroker.EnumObject>;

    private scrollToItem: string | null;

    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: EnumsListProps) {
        super(props);

        const localStorage: Storage = ((window as any)._localStorage as Storage) || window.localStorage;

        let enumsClosed = {};
        try {
            enumsClosed = localStorage.getItem('enumsClosed') ? JSON.parse(localStorage.getItem('enumsClosed')) : {};
        } catch {
            // ignore
        }
        let enumsCollapsed = [];
        try {
            enumsCollapsed = localStorage.getItem('enumsCollapsed')
                ? JSON.parse(localStorage.getItem('enumsCollapsed'))
                : [];
        } catch {
            // ignore
        }
        const splitSizesStr = localStorage.getItem('enumsSplitSizes');
        let splitSizes: [number, number] = [50, 50];
        if (splitSizesStr) {
            try {
                splitSizes = JSON.parse(splitSizesStr) as [number, number];
            } catch {
                // ignore
            }
            if (!Array.isArray(splitSizes) || splitSizes.length !== 2) {
                splitSizes = [50, 50];
            }
        }

        this.state = {
            enums: null,
            enumsTree: null,
            currentCategory: localStorage.getItem('enumCurrentCategory') || '',
            search: '',
            enumEditDialog: null,
            enumTemplateDialog: null,
            enumDeleteDialog: null,
            members: {},
            categoryPopoverOpen: false,
            enumsClosed,
            updating: [],
            enumsCollapsed,
            innerWidth: 0,
            splitSizes,
        };

        this.cachedIcons = {};

        this.fastUpdate = false;

        this.refFilter = React.createRef();
        this.refClearButton = React.createRef();
    }

    getEnumTemplate = (prefix: string): ioBroker.EnumObject => {
        const enumTemplate: ioBroker.EnumObject = JSON.parse(JSON.stringify(ENUM_TEMPLATE));
        const { _id, name } = EnumsList.findNewUniqueName(
            prefix,
            Object.values(this.state.enums),
            this.props.t('Enum'),
        );
        enumTemplate._id = _id;
        enumTemplate.common.name = name;
        return enumTemplate;
    };

    scrollToEnum(enumId: string): void {
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
            this.setState({ enumsClosed }, () => {
                setTimeout(() => {
                    const el = document.getElementById(enumId);
                    el?.scrollIntoView(true);
                }, 400);
            });
        } else {
            setTimeout(() => {
                const el = document.getElementById(enumId);
                el?.scrollIntoView(true);
            }, 400);
        }
    }

    addUpdating(id: string): Promise<void> {
        if (!this.state.updating.includes(id)) {
            const updating = [...this.state.updating];
            updating.push(id);
            return new Promise(resolve => {
                this.setState({ updating }, () => resolve());
            });
        }
        return Promise.resolve();
    }

    createEnumTemplate = (prefix: string, templateValues: ioBroker.EnumObject): void => {
        const enumTemplate = this.getEnumTemplate(prefix);
        enumTemplate._id = templateValues._id;
        enumTemplate.common = { ...enumTemplate.common, ...templateValues.common };

        this.scrollToItem = enumTemplate._id;

        this.addUpdating(enumTemplate._id)
            .then(() => this.props.socket.setObject(enumTemplate._id, enumTemplate))
            .catch(e => window.alert(`Cannot create enum: ${e}`));
    };

    async componentDidMount(): Promise<void> {
        await this.updateData();
        await this.props.socket.subscribeObject('enum.*', this.onObjectChange);
    }

    componentWillUnmount(): void {
        void this.props.socket.unsubscribeObject('enum.*', this.onObjectChange);
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
    }

    onObjectChange = (id: string, obj: ioBroker.EnumObject): void => {
        let changed;

        if (this.state.enums && id.startsWith('enum.')) {
            if (obj) {
                const oldObj = (this.changeEnums && this.changeEnums[id]) || (this.state.enums && this.state.enums[id]);
                if (!oldObj || (oldObj && JSON.stringify(oldObj) !== JSON.stringify(obj))) {
                    this.changeEnums = this.changeEnums || JSON.parse(JSON.stringify(this.state.enums));
                    this.changeEnums[id] = obj;
                    changed = true;
                }
            } else if (
                (this.changeEnums && this.changeEnums[id]) ||
                (!this.changeEnums && this.state.enums && this.state.enums[id])
            ) {
                this.changeEnums = this.changeEnums || JSON.parse(JSON.stringify(this.state.enums));
                delete this.changeEnums[id];
                changed = true;
            }
        }

        if (changed) {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }

            // collect events
            this.updateTimeout = setTimeout(
                () => {
                    this.updateTimeout = null;
                    const changeEnums = this.changeEnums;
                    this.changeEnums = null;
                    this.updateData(changeEnums)
                        .then(() => {
                            if (this.scrollToItem) {
                                this.scrollToEnum(this.scrollToItem);
                                this.scrollToItem = null;
                            }
                        })
                        .catch((): undefined => undefined);
                },
                this.fastUpdate ? 0 : 200,
            );

            this.fastUpdate = false;
        }
    };

    updateData = async (enums?: Record<string, ioBroker.EnumObject>): Promise<void> => {
        enums = enums || (await this.props.socket.getForeignObjects('enum.*', 'enum'));
        const members: Record<string, ioBroker.Object> = {};

        const ids = Object.keys(enums);

        // read all members of all enumerations
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (enums[id].common?.members) {
                for (let j = 0; j < enums[id].common.members.length; j++) {
                    const member = enums[id].common.members[j];
                    if (!members[member]) {
                        try {
                            members[member] = await this.props.socket.getObject(member);
                        } catch {
                            window.alert(`Cannot read member "${member}"`);
                        }
                    }
                }
            }
        }

        this.setState({ enums, members, updating: [] }, () => this.buildTree(enums));
    };

    buildTree(enums: Record<string, ioBroker.EnumObject>): void {
        const enumsTree: TreeItem = {
            data: null,
            children: {},
            id: '',
        };

        const ids = Object.keys(enums).sort(sort(enums, this.getName));

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const currentEnum = enums[id];
            const idParts = id.split('.');
            let currentContainer = enumsTree;
            const currentParts = [];

            for (let p = 0; p < idParts.length; p++) {
                const currentPart = idParts[p];
                currentParts.push(currentPart);
                if (!currentContainer.children[currentPart]) {
                    currentContainer.children[currentPart] = {
                        data: null,
                        children: {},
                        id: currentParts.join('.'),
                    };
                }
                currentContainer = currentContainer.children[currentPart];
            }
            currentContainer.data = currentEnum;
        }

        this.setCurrentCategory(
            this.state.currentCategory && enumsTree.children.enum.children[this.state.currentCategory]
                ? this.state.currentCategory
                : Object.keys(enumsTree.children.enum.children)[0],
            () => this.setState({ enumsTree }),
        );
    }

    setCurrentCategory = (currentCategory: string, cb?: () => void): void => {
        if (currentCategory !== this.state.currentCategory) {
            this.setState({ currentCategory }, () => {
                if (cb) {
                    cb();
                }
            });
            ((window as any)._localStorage || window.localStorage).setItem('enumCurrentCategory', currentCategory);
        } else if (cb) {
            cb();
        }
    };

    addItemToEnum = (itemId: string, enumId: string): void => {
        const enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        if (!enumItem.common?.members) {
            enumItem.common = enumItem.common || {};
            enumItem.common.members = [];
        }
        const members = enumItem.common.members;
        if (!members.includes(itemId)) {
            members.push(itemId);

            this.fastUpdate = true;
            this.props.socket.setObject(enumItem._id, enumItem).catch(e => window.alert(`Cannot set enum: ${e}`));
        }
    };

    removeMemberFromEnum = (memberId: string, enumId: string): void => {
        const enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        const members = enumItem.common.members;
        const pos = members.indexOf(memberId);
        if (pos !== -1) {
            members.splice(pos, 1);

            this.fastUpdate = true;
            this.props.socket
                .setObject(enumItem._id, enumItem)
                .catch((e: string) => window.alert(`Cannot update enum: ${e}`));
        }
    };

    moveEnum = async (fromId: string, toId: string): Promise<void> => {
        if (toId.startsWith(fromId)) {
            return;
        }
        const fromPrefixParts: string[] = fromId.split('.');
        fromPrefixParts.pop();
        const fromPrefix: string = fromPrefixParts.join('.');
        const toPrefix = toId;

        if (fromPrefix === toPrefix) {
            return;
        }

        const ids = Object.keys(this.state.enums);

        const updating = [...this.state.updating];

        try {
            for (let i = 0; i < ids.length; i++) {
                const enumItem = this.state.enums[ids[i]];
                if (ids[i].startsWith(fromId)) {
                    const newId = ids[i].replace(fromPrefix, toPrefix);
                    const newEnum = JSON.parse(JSON.stringify(enumItem));
                    newEnum._id = newId;
                    if (!updating.includes(ids[i])) {
                        updating.push(ids[i]);
                    }
                    await this.props.socket.setObject(newId, enumItem);
                    await this.props.socket.delObject(ids[i]);
                }
            }
        } catch (e) {
            window.alert(`Cannot move enum: ${e}`);
        }

        this.setState({ updating });
    };

    renderTree(container: TreeItem, key: number, level: number): JSX.Element | null {
        let ids = null;
        if (!this.state.enumsClosed[container.id]) {
            ids = Object.keys(container.children);
            const enums: Record<string, ioBroker.EnumObject> = {};
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                enums[id] = container.children[id].data;
            }
            ids.sort(sort(enums, this.getName));
        }

        const name: string = this.getName(container.data?.common?.name);
        const idText: string = container.id;
        let nameRx: JSX.Element[] | null;
        let idRx: JSX.Element[] | null;
        if (this.state.search) {
            const search = this.state.search;
            const pos = name.toLowerCase().indexOf(search);
            const posId = idText.toLowerCase().indexOf(search);
            if (pos === -1 && posId === -1) {
                return null;
            }
            if (pos !== -1) {
                nameRx = name
                    ? [
                          <span key="0">{name.substring(0, pos)}</span>,
                          <span
                              key="1"
                              style={styles.searchText}
                          >
                              {name.substring(pos, pos + this.state.search.length)}
                          </span>,
                          <span key="2">{name.substring(pos + this.state.search.length)}</span>,
                      ]
                    : null;
            }
            if (posId !== -1) {
                idRx = name
                    ? [
                          <span key="0">{idText.substring(0, posId)}</span>,
                          <span
                              key="1"
                              style={styles.searchText}
                          >
                              {idText.substring(posId, posId + this.state.search.length)}
                          </span>,
                          <span key="2">{idText.substring(posId + this.state.search.length)}</span>,
                      ]
                    : null;
            }
        }

        return (
            <div
                style={{ paddingLeft: level ? 32 : 0 }}
                key={container.id || key}
            >
                <EnumBlock
                    cachedIcons={this.cachedIcons}
                    stylesParent={styles}
                    closed={this.state.enumsClosed[container.id]}
                    collapsed={this.state.enumsCollapsed.includes(container.id)}
                    copyEnum={this.copyEnum}
                    currentCategory={this.state.currentCategory}
                    enum={container.data}
                    getEnumTemplate={this.getEnumTemplate}
                    getName={this.getName}
                    id={container.id}
                    idText={idRx}
                    members={this.state.members}
                    moveEnum={this.moveEnum}
                    name={nameRx}
                    onCollapse={() => {
                        const enumsCollapsed = [...this.state.enumsCollapsed];
                        const pos = enumsCollapsed.indexOf(container.id);
                        if (pos === -1) {
                            enumsCollapsed.push(container.id);
                        } else {
                            enumsCollapsed.splice(pos, 1);
                        }
                        this.setState({ enumsCollapsed });
                        ((window as any)._localStorage || window.localStorage).setItem(
                            'enumsCollapsed',
                            JSON.stringify(enumsCollapsed),
                        );
                    }}
                    removeMemberFromEnum={this.removeMemberFromEnum}
                    showEnumDeleteDialog={this.showEnumDeleteDialog}
                    showEnumEditDialog={this.showEnumEditDialog}
                    showEnumTemplateDialog={this.showEnumTemplateDialog}
                    socket={this.props.socket}
                    t={this.props.t}
                    themeType={this.props.themeType}
                    theme={this.props.theme}
                    toggleEnum={this.toggleEnum}
                    updating={this.state.updating.includes(container.id)}
                    childrenCount={container.children ? Object.keys(container.children).length : 0}
                />
                {ids
                    ? ids.map((id, index) => (
                          <React.Fragment key={index}>
                              {this.renderTree(container.children[id], index, level + 1)}
                          </React.Fragment>
                      ))
                    : null}
            </div>
        );
    }

    showEnumEditDialog = (enumItem: ioBroker.EnumObject, isNew: boolean): void => {
        const enumEditDialog: EnumEditDialogProps = { changed: false };
        enumEditDialog.newItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.originalItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.isNew = isNew;
        this.setState({ enumEditDialog });
    };

    showEnumTemplateDialog = (prefix: string): void => this.setState({ enumTemplateDialog: prefix });

    showEnumDeleteDialog = (enumItem: ioBroker.EnumObject): void => this.setState({ enumDeleteDialog: enumItem });

    saveEnum = async (): Promise<void> => {
        const newItem = this.state.enumEditDialog.newItem;
        const originalId = this.state.enumEditDialog.originalItem._id;

        if (this.state.enumEditDialog.isNew) {
            this.scrollToItem = newItem._id;
        }

        const updating = [...this.state.updating];

        if (!updating.includes(originalId)) {
            updating.push(originalId);
        }

        await this.props.socket.setObject(newItem._id, newItem);

        if (originalId !== newItem._id) {
            try {
                await this.props.socket.delObject(originalId);

                const ids = Object.keys(this.state.enums);
                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    if (id.startsWith(`${originalId}.`)) {
                        const newEnumChild = JSON.parse(JSON.stringify(this.state.enums[id]));
                        newEnumChild._id = newEnumChild._id.replace(`${originalId}.`, `${newItem._id}.`);

                        if (!updating.includes(id)) {
                            updating.push(id);
                        }
                        await this.props.socket.setObject(newEnumChild._id, newEnumChild);
                        await this.props.socket.delObject(id);
                    }
                }
            } catch (e) {
                window.alert(`Cannot save enum: ${e}`);
            }
        }

        this.setState({ enumEditDialog: null, updating });
    };

    deleteEnum = async (enumId: string): Promise<void> => {
        const updating = [...this.state.updating];
        try {
            if (!updating.includes(enumId)) {
                updating.push(enumId);
            }

            if (this.state.enums[enumId]) {
                await this.props.socket.delObject(enumId);
            }
            const ids = Object.keys(this.state.enums);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (id.startsWith(`${enumId}.`)) {
                    if (!updating.includes(id)) {
                        updating.push(id);
                    }
                    if (this.state.enums[enumId]) {
                        await this.props.socket.delObject(id);
                    }
                }
            }
        } catch (e) {
            window.alert(`Cannot delete enum: ${e}`);
        }

        this.setState({ enumDeleteDialog: null, updating });
    };

    copyEnum = (enumId: string): void => {
        const enumItem = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        let newId;
        let index = 1;
        do {
            newId = enumId + index.toString();
            index++;
        } while (this.state.enums[newId]);

        enumItem._id = newId;

        this.props.socket.setObject(newId, enumItem).catch(e => window.alert(`Cannot delete enum: ${e}`));
    };

    toggleEnum = (enumId: string): void => {
        const enumsClosed = JSON.parse(JSON.stringify(this.state.enumsClosed));
        enumsClosed[enumId] = !enumsClosed[enumId];
        this.setState({ enumsClosed });
        ((window as any)._localStorage || window.localStorage).setItem('enumsClosed', JSON.stringify(enumsClosed));
    };

    changeEnumFormData = (newItem: ioBroker.EnumObject): void => {
        const enumEditDialog = JSON.parse(JSON.stringify(this.state.enumEditDialog));
        enumEditDialog.newItem = JSON.parse(JSON.stringify(newItem));
        enumEditDialog.changed =
            JSON.stringify(enumEditDialog.newItem) !==
            JSON.stringify(this.state.enums[enumEditDialog.originalItem] || {});
        this.setState({ enumEditDialog });
    };

    getName = (name: ioBroker.StringOrTranslated): string => AdminUtils.getText(name, this.props.lang);

    static _isUniqueName(prefix: string, list: ioBroker.EnumObject[], word: string, i: number): boolean {
        return !list.find(item => item._id === `${prefix}.${word.toLowerCase()}_${i}`);
    }

    static findNewUniqueName(prefix: string, list: ioBroker.EnumObject[], word: string): { _id: string; name: string } {
        let i = 1;
        while (!EnumsList._isUniqueName(prefix, list, word, i)) {
            i++;
        }
        return { _id: `${prefix}.${word.toLowerCase()}_${i}`, name: `${word} ${i}` };
    }

    onFilterChanged(filter: string, isClear?: boolean): void {
        if (this.refClearButton.current) {
            if (filter) {
                this.refClearButton.current.style.display = 'block';
            } else {
                this.refClearButton.current.style.display = 'none';
            }
        }
        if (isClear && this.refFilter.current) {
            this.refFilter.current.value = '';
        }

        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
        this.searchTimer = setTimeout(
            _text => {
                this.searchTimer = null;
                this.setState({ search: _text.toLowerCase() });
            },
            isClear ? 0 : 300,
            filter,
        );
    }

    renderEditDialog(): JSX.Element | null {
        return this.state.enumEditDialog ? (
            <EnumEditDialog
                onClose={() => this.setState({ enumEditDialog: null })}
                enums={Object.values(this.state.enums)}
                enum={this.state.enumEditDialog.newItem}
                getName={this.getName}
                isNew={this.state.enumEditDialog.isNew}
                t={this.props.t}
                lang={this.props.lang}
                changed={this.state.enumEditDialog.changed}
                onChange={this.changeEnumFormData}
                saveData={this.saveEnum}
                innerWidth={this.state.innerWidth}
            />
        ) : null;
    }

    renderDeleteDialog(): JSX.Element | null {
        return this.state.enumDeleteDialog ? (
            <EnumDeleteDialog
                onClose={() => this.setState({ enumDeleteDialog: null })}
                enum={this.state.enumDeleteDialog}
                getName={this.getName}
                t={this.props.t}
                deleteEnum={this.deleteEnum}
            />
        ) : null;
    }

    renderTemplateDialog(): JSX.Element | null {
        // eslint-disable-next-line no-extra-boolean-cast
        return !!this.state.enumTemplateDialog ? (
            <EnumTemplateDialog
                prefix={this.state.enumTemplateDialog}
                onClose={() => this.setState({ enumTemplateDialog: null })}
                t={this.props.t}
                lang={this.props.lang}
                createEnumTemplate={this.createEnumTemplate}
                showEnumEditDialog={this.showEnumEditDialog}
                enums={this.state.enums}
                getEnumTemplate={this.getEnumTemplate}
            />
        ) : null;
    }

    render(): JSX.Element {
        if (!this.state.enumsTree) {
            return <LinearProgress />;
        }
        const enumItems = Object.values(
            this.state.enumsTree.children.enum.children[this.state.currentCategory].children,
        );
        const showFolderIcons = !!enumItems.find(item => item.children && Object.keys(item.children).length);

        return (
            <>
                <DndProvider backend={AdminUtils.isTouchDevice() ? TouchBackend : HTML5Backend}>
                    <DndPreview />
                    <ReactSplit
                        direction={SplitDirection.Horizontal}
                        initialSizes={this.state.splitSizes}
                        minWidths={[450, 450]}
                        onResizeFinished={(gutterIdx: number, splitSizes: [number, number]) => {
                            this.setState({ splitSizes });
                            ((window as any)._localStorage || window.localStorage).setItem(
                                'enumsSplitSizes',
                                JSON.stringify(splitSizes),
                            );
                        }}
                        // theme={this.props.themeType === 'dark' ? GutterTheme.Dark : GutterTheme.Light}
                        gutterClassName={this.props.themeType === 'dark' ? 'Dark visGutter' : 'Light visGutter'}
                    >
                        <div
                            style={{
                                ...styles.childGridCont,
                                ...(this.state.innerWidth > 600 ? styles.childGridContWide : undefined),
                            }}
                        >
                            <div style={styles.topPanel}>
                                <Tooltip
                                    title={this.props.t('Add enum')}
                                    placement="top"
                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                >
                                    <IconButton
                                        id="categoryPopoverButton"
                                        size="small"
                                        style={styles.toolbarButton}
                                        onClick={() =>
                                            this.state.enumsTree.children.enum.children.favorites
                                                ? this.showEnumEditDialog(this.getEnumTemplate('enum'), true)
                                                : this.setState({ categoryPopoverOpen: true })
                                        }
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                                <Popover
                                    open={this.state.categoryPopoverOpen}
                                    onClose={() => this.setState({ categoryPopoverOpen: false })}
                                    anchorEl={() => document.getElementById('categoryPopoverButton')}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                >
                                    <MenuList>
                                        {this.state.enumsTree.children.enum.children.favorites ? null : (
                                            <MenuItem
                                                onClick={() => this.createEnumTemplate('enum', enumTemplates.favorites)}
                                            >
                                                {this.props.t('Favorites')}
                                            </MenuItem>
                                        )}
                                        <MenuItem
                                            onClick={() => this.showEnumEditDialog(this.getEnumTemplate('enum'), true)}
                                        >
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
                                                name: this.state.enumsTree.children.enum.children[category].id
                                                    .split('.')
                                                    .pop(),
                                            },
                                            type: 'enum',
                                            native: {},
                                        };
                                        return (
                                            <Tab
                                                key={index}
                                                component="span"
                                                style={{
                                                    backgroundColor: categoryData.common?.color || undefined,
                                                    borderRadius: 4,
                                                }}
                                                label={
                                                    <CategoryLabel
                                                        themeType={this.props.themeType}
                                                        categoryData={categoryData}
                                                        showEnumEditDialog={this.showEnumEditDialog}
                                                        showEnumDeleteDialog={this.showEnumDeleteDialog}
                                                        styles={styles}
                                                        {...this.props}
                                                    />
                                                }
                                                value={category}
                                            />
                                        );
                                    })}
                                </Tabs>
                            </div>
                            <div style={styles.topPanel2}>
                                <TextField
                                    variant="standard"
                                    inputRef={this.refFilter}
                                    placeholder={this.props.t('Filter')}
                                    style={styles.filter}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                        input: {
                                            endAdornment: (
                                                <IconButton
                                                    tabIndex={-1}
                                                    ref={this.refClearButton}
                                                    style={{ display: 'none' }}
                                                    size="small"
                                                    onClick={() => this.onFilterChanged('', true)}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            ),
                                        },
                                    }}
                                    onChange={e => this.onFilterChanged(e.target.value)}
                                />
                                <Tooltip
                                    title={this.props.t('Narrow all')}
                                    placement="top"
                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                >
                                    <IconButton
                                        size="large"
                                        // size="small"
                                        style={styles.toolbarButton}
                                        onClick={() => {
                                            const enumsCollapsed = Object.keys(this.state.enums);
                                            this.setState({ enumsCollapsed });
                                            ((window as any)._localStorage || window.localStorage).setItem(
                                                'enumsCollapsed',
                                                JSON.stringify(enumsCollapsed),
                                            );
                                        }}
                                    >
                                        <CollapseIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip
                                    title={this.props.t('Wide all')}
                                    placement="top"
                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                >
                                    <IconButton
                                        size="large"
                                        // size="small"
                                        style={styles.toolbarButton}
                                        onClick={() => {
                                            this.setState({ enumsCollapsed: [] });
                                            ((window as any)._localStorage || window.localStorage).setItem(
                                                'enumsCollapsed',
                                                '[]',
                                            );
                                        }}
                                    >
                                        <ExpandIcon />
                                    </IconButton>
                                </Tooltip>
                                {showFolderIcons && (
                                    <Tooltip
                                        title={this.props.t('Collapse all')}
                                        placement="top"
                                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                    >
                                        <IconButton
                                            size="large"
                                            // size="small"
                                            style={styles.toolbarButton}
                                            onClick={() => {
                                                const enumsClosed: Record<string, boolean> = {};
                                                Object.keys(this.state.enums).forEach(id => (enumsClosed[id] = true));
                                                this.setState({ enumsClosed });
                                                ((window as any)._localStorage || window.localStorage).setItem(
                                                    'enumsClosed',
                                                    JSON.stringify(enumsClosed),
                                                );
                                            }}
                                        >
                                            <IconCollapsed />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {showFolderIcons && (
                                    <Tooltip
                                        title={this.props.t('Expand all')}
                                        placement="top"
                                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                    >
                                        <IconButton
                                            size="large"
                                            // size="small"
                                            style={styles.toolbarButton}
                                            onClick={() => {
                                                const enumsClosed = {};
                                                this.setState({ enumsClosed });
                                                ((window as any)._localStorage || window.localStorage).setItem(
                                                    'enumsClosed',
                                                    JSON.stringify(enumsClosed),
                                                );
                                            }}
                                        >
                                            <IconExpanded />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip
                                    title={this.props.t('Add group')}
                                    placement="top"
                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                >
                                    <IconButton
                                        size="large"
                                        // size="small"
                                        onClick={() => {
                                            if (['functions', 'rooms'].includes(this.state.currentCategory)) {
                                                this.setState({
                                                    enumTemplateDialog: `enum.${this.state.currentCategory}`,
                                                });
                                            } else {
                                                this.showEnumEditDialog(
                                                    this.getEnumTemplate(`enum.${this.state.currentCategory}`),
                                                    true,
                                                );
                                            }
                                        }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>
                            <div style={styles.blocksContainer}>
                                {enumItems.map((enumItem, index) => this.renderTree(enumItem, index, 0))}
                            </div>
                        </div>
                        <div
                            style={{
                                ...styles.childGridCont,
                                ...(this.state.innerWidth > 600 ? styles.childGridContWide : undefined),
                            }}
                        >
                            <div style={styles.blocksContainer}>
                                <DragObjectBrowser
                                    addItemToEnum={this.addItemToEnum}
                                    getName={this.getName}
                                    stylesParent={styles}
                                    t={this.props.t}
                                    socket={this.props.socket}
                                    lang={this.props.lang}
                                    theme={this.props.theme}
                                />
                            </div>
                        </div>
                    </ReactSplit>
                </DndProvider>
                {this.renderEditDialog()}
                {this.renderDeleteDialog()}
                {this.renderTemplateDialog()}
            </>
        );
    }
}
