import React, { Component, type JSX } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { usePreview } from 'react-dnd-preview';
import ReactSplit, { SplitDirection } from '@devbookhq/splitter';

import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    MenuItem,
    MenuList,
    Popover,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@mui/material';

import {
    Add as AddIcon,
    AutoFixHigh as WizardIcon,
    Category as CategoriesIcon,
    Checklist as AssignmentIcon,
    Clear as ClearIcon,
    UnfoldLess as CollapseAllIcon,
    UnfoldMore as ExpandAllIcon,
    ViewSidebar as ObjectListIcon,
} from '@mui/icons-material';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeType,
    type Translate,
    DialogConfirm,
    DialogSelectID,
    Utils,
} from '@iobroker/gui-components';

import CategoryLabel from './CategoryLabel';
import EnumEditDialog from './EnumEditDialog';
import EnumTemplateDialog from './EnumTemplateDialog';
import EnumDeleteDialog from './EnumDeleteDialog';
import DragObjectBrowser from './DragObjectBrowser';
import EnumTreeList from './EnumTreeList';
import EnumDetails from './EnumDetails';
import EnumAssignment from './EnumAssignment';
import EnumWizard from './EnumWizard';
import { sortTreeItems, type EnumTreeItem, type MemberChanges } from './types';
import AdminUtils from '../../helpers/AdminUtils';

/** Below this width the list and the details are shown one after another */
const NARROW_WIDTH = 800;

/** How many objects are read with one request */
const OBJECTS_CHUNK = 500;

const styles: Record<string, any> = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
    },
    topBar: (theme: IobTheme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
    }),
    tabs: {
        minWidth: 0,
    },
    wizardButton: {
        flexShrink: 0,
        minWidth: 0,
        my: 0.75,
        textTransform: 'none',
    },
    viewToggle: {
        flexShrink: 0,
        my: 0.75,
        '& .MuiToggleButton-root': {
            textTransform: 'none',
            gap: 0.75,
            py: 0.25,
        },
    },
    body: {
        display: 'flex',
        flexGrow: 1,
        minHeight: 0,
    },
    split: {
        flexGrow: 1,
        minWidth: 0,
        height: '100%',
    },
    main: {
        display: 'flex',
        flexGrow: 1,
        minWidth: 0,
        height: '100%',
    },
    listPane: (theme: IobTheme) => ({
        width: 300,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: `1px solid ${theme.palette.divider}`,
    }),
    listPaneNarrow: {
        width: '100%',
        borderRight: 0,
    },
    listToolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 1,
    },
    filter: {
        flexGrow: 1,
    },
    listScroll: {
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    detailsEmpty: {
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        opacity: 0.6,
        p: 3,
    },
    objectsPane: {
        height: '100%',
        overflow: 'auto',
    },
    rail: (theme: IobTheme) => ({
        width: 40,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        pt: 1.5,
        cursor: 'pointer',
        color: theme.palette.text.secondary,
        borderLeft: `1px solid ${theme.palette.divider}`,
        '&:hover': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
        },
    }),
    railText: {
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
    },
    // used by DragObjectBrowser for the preview of a dragged object
    enumGroupMember: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 16px',
    },
    // used by DragObjectBrowser and CategoryLabel
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        display: 'inline-block',
    },
    // used by CategoryLabel
    categoryTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        display: 'inline-flex',
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

function getStorage(): Storage {
    return ((window as any)._localStorage as Storage) || window.localStorage;
}

function readStored<T>(key: string, defaultValue: T, isValid: (value: unknown) => boolean): T {
    try {
        const stored = getStorage().getItem(key);
        if (stored) {
            const value: unknown = JSON.parse(stored);
            if (isValid(value)) {
                return value as T;
            }
        }
    } catch {
        // ignore
    }
    return defaultValue;
}

const isObject = (value: unknown): boolean => !!value && typeof value === 'object' && !Array.isArray(value);

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
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
    enumsTree: EnumTreeItem | null;
    currentCategory: string;
    filter: string;
    enumEditDialog: EnumEditDialogProps | null;
    enumTemplateDialog: string | null;
    enumDeleteDialog: ioBroker.EnumObject | null;
    members: Record<string, ioBroker.Object>;
    /** Parents of the states, which are members: they give the name and the icon of the device */
    parents: Record<string, ioBroker.Object>;
    categoryPopoverOpen: boolean;
    /** Entries with children, which are closed in the list */
    enumsClosed: Record<string, boolean>;
    updating: string[];
    /** The list and the details are shown one after another */
    narrow: boolean;
    splitSizes: [number, number];
    /** If the object browser on the right side is shown */
    showObjects: boolean;
    /** ID of the enum for which the objects selection dialog is open */
    addObjectsDialog: string | null;
    /** A folder without its own object was dropped on an enum and waits for confirmation */
    addFolderDialog: { folderId: string; ids: string[]; enumId: string } | null;
    /** Selected enum of every category */
    selected: Record<string, string>;
    /** On narrow screens: show the details of the selected enum instead of the list */
    showDetails: boolean;
    /** Edit the enums by category or assign rooms and functions to the devices */
    view: 'categories' | 'assignment';
    /** The wizard to set up floors, rooms and functions is open */
    wizardOpen: boolean;
}

export default class EnumsList extends Component<EnumsListProps, EnumsListState> {
    private fastUpdate = false;

    private updateTimeout: ReturnType<typeof setTimeout> | null = null;

    /** Full copy of the enums with the not yet applied changes, null if nothing is pending */
    private changeEnums: Record<string, ioBroker.EnumObject> | null = null;

    /**
     * Enums of the last update. They are not in the state yet while the members are read, so the next changes
     * must be based on them: otherwise, a member moved to another enum appears again in the old one.
     */
    private lastEnums: Record<string, ioBroker.EnumObject> | null = null;

    /** Counts the updates, so that a slow update does not overwrite a newer one */
    private updateCounter = 0;

    /** This enum is selected as soon as it exists after the next update */
    private selectAfterUpdate: string | null = null;

    constructor(props: EnumsListProps) {
        super(props);

        this.state = {
            enums: null,
            enumsTree: null,
            currentCategory: getStorage().getItem('enumCurrentCategory') || '',
            filter: '',
            enumEditDialog: null,
            enumTemplateDialog: null,
            enumDeleteDialog: null,
            members: {},
            parents: {},
            categoryPopoverOpen: false,
            enumsClosed: readStored<Record<string, boolean>>('enumsClosed', {}, isObject),
            updating: [],
            narrow: window.innerWidth < NARROW_WIDTH,
            splitSizes: readStored<[number, number]>(
                'enumsSplitSizes2',
                [70, 30],
                value => Array.isArray(value) && value.length === 2,
            ),
            showObjects: getStorage().getItem('enumsShowObjects') !== 'false',
            addObjectsDialog: null,
            addFolderDialog: null,
            selected: readStored<Record<string, string>>('enumsSelected', {}, isObject),
            showDetails: false,
            view: getStorage().getItem('enumsView') === 'assignment' ? 'assignment' : 'categories',
            wizardOpen: false,
        };
    }

    async componentDidMount(): Promise<void> {
        window.addEventListener('resize', this.onResize);
        await this.updateData();
        await this.props.socket.subscribeObject('enum.*', this.onObjectChange);
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize);
        void this.props.socket.unsubscribeObject('enum.*', this.onObjectChange);
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
    }

    onResize = (): void => {
        const narrow = window.innerWidth < NARROW_WIDTH;
        if (narrow !== this.state.narrow) {
            this.setState({ narrow });
        }
    };

    getEnumTemplate = (prefix: string): ioBroker.EnumObject => {
        const enumTemplate: ioBroker.EnumObject = JSON.parse(JSON.stringify(ENUM_TEMPLATE));
        const { _id, name } = EnumsList.findNewUniqueName(
            prefix,
            Object.values(this.state.enums || {}),
            this.props.t('Enum'),
        );
        enumTemplate._id = _id;
        enumTemplate.common.name = name;
        return enumTemplate;
    };

    createEnumTemplate = (prefix: string, templateValues: ioBroker.EnumObject): void => {
        const enumTemplate = this.getEnumTemplate(prefix);
        enumTemplate._id = templateValues._id;
        enumTemplate.common = { ...enumTemplate.common, ...templateValues.common };

        this.selectAfterUpdate = enumTemplate._id;

        this.addUpdating([enumTemplate._id])
            .then(() => this.props.socket.setObject(enumTemplate._id, enumTemplate))
            .catch(e => window.alert(`Cannot create enum: ${e}`));
    };

    addUpdating(ids: string[]): Promise<void> {
        const updating = [...this.state.updating, ...ids.filter(id => !this.state.updating.includes(id))];
        return new Promise(resolve => this.setState({ updating }, () => resolve()));
    }

    onObjectChange = (id: string, _obj: ioBroker.Object | null | undefined): void => {
        const obj = _obj as ioBroker.EnumObject | null | undefined;
        let changed;

        if (this.state.enums && id.startsWith('enum.')) {
            const latestEnums = this.changeEnums || this.lastEnums || this.state.enums;
            if (obj) {
                const oldObj = latestEnums[id];
                if (!oldObj || (oldObj && JSON.stringify(oldObj) !== JSON.stringify(obj))) {
                    const changeEnums: Record<string, ioBroker.EnumObject> =
                        this.changeEnums || JSON.parse(JSON.stringify(latestEnums));
                    changeEnums[id] = obj;
                    this.changeEnums = changeEnums;
                    changed = true;
                }
            } else if (latestEnums[id]) {
                const changeEnums: Record<string, ioBroker.EnumObject> =
                    this.changeEnums || JSON.parse(JSON.stringify(latestEnums));
                delete changeEnums[id];
                this.changeEnums = changeEnums;
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
                    const changeEnums = this.changeEnums || undefined;
                    this.changeEnums = null;
                    this.updateData(changeEnums)
                        .then(() => {
                            const selectId = this.selectAfterUpdate;
                            if (selectId && this.state.enums?.[selectId]) {
                                this.selectAfterUpdate = null;
                                this.selectEnum(selectId);
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
        const counter = ++this.updateCounter;
        const allEnums = enums || (await this.props.socket.getForeignObjects('enum.*', 'enum'));
        this.lastEnums = allEnums;

        const memberIds = new Set<string>();
        Object.values(allEnums).forEach(enumObj => enumObj.common?.members?.forEach(id => memberIds.add(id)));
        const members = await this.readObjects([...memberIds]);

        // the parents of the states and channels give the device, under which they are grouped in the details
        const parentIds = new Set<string>();
        for (const id of Object.keys(members)) {
            if (members[id].type === 'state' || members[id].type === 'channel') {
                const parentId = Utils.getParentId(id);
                if (parentId && parentId.includes('.') && !members[parentId]) {
                    parentIds.add(parentId);
                }
            }
        }
        const parents = await this.readObjects([...parentIds]);

        if (counter !== this.updateCounter) {
            // a newer update is running
            return;
        }

        this.setState({ enums: allEnums, members, parents, updating: [] }, () => this.buildTree(allEnums));
    };

    /** Read the objects in chunks. Objects that do not exist are not in the result */
    async readObjects(ids: string[]): Promise<Record<string, ioBroker.Object>> {
        const result: Record<string, ioBroker.Object> = {};
        for (let i = 0; i < ids.length; i += OBJECTS_CHUNK) {
            const chunk = ids.slice(i, i + OBJECTS_CHUNK);
            let objects: Record<string, ioBroker.Object | null | undefined> | undefined;
            try {
                objects = await this.props.socket.getObjectsById(chunk);
            } catch (e) {
                console.warn('Cannot read the objects at once, read them one by one:', e);
            }
            for (const id of chunk) {
                let obj = objects ? objects[id] : undefined;
                if (!objects) {
                    try {
                        obj = await this.props.socket.getObject(id);
                    } catch (e) {
                        console.error(`Cannot read the object "${id}":`, e);
                    }
                }
                if (obj) {
                    result[id] = obj;
                }
            }
        }
        return result;
    }

    buildTree(enums: Record<string, ioBroker.EnumObject>): void {
        const enumsTree: EnumTreeItem = { data: null, children: {}, id: '' };

        for (const id of Object.keys(enums)) {
            const parts = id.split('.');
            let container = enumsTree;
            for (let p = 0; p < parts.length; p++) {
                container.children[parts[p]] ||= { data: null, children: {}, id: parts.slice(0, p + 1).join('.') };
                container = container.children[parts[p]];
            }
            container.data = enums[id];
        }

        const categories = enumsTree.children.enum?.children || {};
        const category = categories[this.state.currentCategory]
            ? this.state.currentCategory
            : Object.keys(categories)[0] || '';

        this.setCurrentCategory(category, () =>
            this.setState({ enumsTree }, () => {
                // offer the wizard once, as long as there are no rooms at all
                if (
                    !Object.keys(enums).some(id => id.startsWith('enum.rooms.')) &&
                    !getStorage().getItem('enumsWizardOffered')
                ) {
                    getStorage().setItem('enumsWizardOffered', 'true');
                    this.setState({ wizardOpen: true });
                }
            }),
        );
    }

    setCurrentCategory = (currentCategory: string, cb?: () => void): void => {
        if (currentCategory !== this.state.currentCategory) {
            this.setState({ currentCategory }, () => cb?.());
            getStorage().setItem('enumCurrentCategory', currentCategory);
        } else {
            cb?.();
        }
    };

    findTreeItem(enumId: string): EnumTreeItem | null {
        let node: EnumTreeItem | null = this.state.enumsTree;
        for (const part of enumId.split('.')) {
            node = node?.children[part] || null;
        }
        return node;
    }

    findFirstEnum(node: EnumTreeItem): string | null {
        for (const child of sortTreeItems(Object.values(node.children), this.getName)) {
            if (child.data) {
                return child.id;
            }
            const id = this.findFirstEnum(child);
            if (id) {
                return id;
            }
        }
        return null;
    }

    /** The selected enum of the current category. On wide screens, the first enum is selected by default */
    getSelectedId(): string | null {
        const id = this.state.selected[this.state.currentCategory];
        if (id && this.state.enums?.[id]) {
            return id;
        }
        if (this.state.narrow) {
            return null;
        }
        const node = this.state.enumsTree?.children.enum?.children[this.state.currentCategory];
        return node ? this.findFirstEnum(node) : null;
    }

    selectEnum = (enumId: string): void => {
        const category = enumId.split('.')[1];
        const selected = { ...this.state.selected, [category]: enumId };
        getStorage().setItem('enumsSelected', JSON.stringify(selected));

        // open the parents, so the entry is visible in the list
        let enumsClosed = this.state.enumsClosed;
        const parts = enumId.split('.');
        for (let i = 3; i < parts.length; i++) {
            const parentId = parts.slice(0, i).join('.');
            if (enumsClosed[parentId]) {
                enumsClosed = { ...enumsClosed };
                delete enumsClosed[parentId];
            }
        }
        if (enumsClosed !== this.state.enumsClosed) {
            getStorage().setItem('enumsClosed', JSON.stringify(enumsClosed));
        }

        this.setCurrentCategory(category, () =>
            this.setState({ selected, enumsClosed, showDetails: true }, () =>
                setTimeout(
                    () => document.getElementById(`enum-row-${enumId}`)?.scrollIntoView({ block: 'nearest' }),
                    50,
                ),
            ),
        );
    };

    addEnum = (prefix: string): void => {
        if (['functions', 'rooms'].includes(prefix.split('.')[1])) {
            this.setState({ enumTemplateDialog: prefix });
        } else {
            this.showEnumEditDialog(this.getEnumTemplate(prefix), true);
        }
    };

    addItemsToEnum = (itemIds: string[], enumId: string): void => {
        if (!this.state.enums?.[enumId]) {
            return;
        }
        const enumItem: ioBroker.EnumObject = JSON.parse(JSON.stringify(this.state.enums[enumId]));
        enumItem.common ||= {} as ioBroker.EnumCommon;
        enumItem.common.members ||= [];
        const members = enumItem.common.members;
        const newIds = itemIds.filter(id => !members.includes(id));
        if (newIds.length) {
            members.push(...newIds);

            this.fastUpdate = true;
            this.props.socket.setObject(enumItem._id, enumItem).catch(e => window.alert(`Cannot set enum: ${e}`));
        }
    };

    addItemToEnum = (itemId: string, enumId: string): void => this.addItemsToEnum([itemId], enumId);

    addFolderToEnum = (folderId: string, ids: string[], enumId: string): void =>
        this.setState({ addFolderDialog: { folderId, ids, enumId } });

    removeMemberFromEnum = (memberId: string, enumId: string): void => {
        const enumItem: ioBroker.EnumObject | undefined = this.state.enums?.[enumId];
        if (!enumItem?.common?.members?.includes(memberId)) {
            return;
        }
        const newEnum: ioBroker.EnumObject = JSON.parse(JSON.stringify(enumItem));
        newEnum.common.members = (newEnum.common.members || []).filter(id => id !== memberId);

        this.fastUpdate = true;
        this.props.socket
            .setObject(newEnum._id, newEnum)
            .catch((e: string) => window.alert(`Cannot update enum: ${e}`));
    };

    moveMember = async (memberId: string, fromEnumId: string, toEnumId: string, copy: boolean): Promise<void> => {
        const enums = this.state.enums || {};
        if (!enums[toEnumId]) {
            return;
        }
        this.fastUpdate = true;
        try {
            if (!copy && enums[fromEnumId]?.common?.members?.includes(memberId)) {
                const fromEnum: ioBroker.EnumObject = JSON.parse(JSON.stringify(enums[fromEnumId]));
                fromEnum.common.members = (fromEnum.common.members || []).filter(id => id !== memberId);
                await this.props.socket.setObject(fromEnum._id, fromEnum);
            }
            if (!enums[toEnumId].common?.members?.includes(memberId)) {
                const toEnum: ioBroker.EnumObject = JSON.parse(JSON.stringify(enums[toEnumId]));
                toEnum.common.members ||= [];
                toEnum.common.members.push(memberId);
                toEnum.common.members.sort();
                await this.props.socket.setObject(toEnum._id, toEnum);
            }
        } catch (e) {
            window.alert(`Cannot move member: ${errorText(e)}`);
        }
    };

    moveEnum = async (fromId: string, toId: string): Promise<void> => {
        const fromPrefix = fromId.split('.').slice(0, -1).join('.');
        if (toId === fromId || toId.startsWith(`${fromId}.`) || fromPrefix === toId) {
            return;
        }

        const stateEnums = this.state.enums || {};
        const newFromId = `${toId}${fromId.substring(fromPrefix.length)}`;
        if (stateEnums[newFromId]) {
            window.alert(this.props.t('Entry "%s" already exists', newFromId));
            return;
        }

        // the enum with all its children
        const ids = Object.keys(stateEnums)
            .filter(id => id === fromId || id.startsWith(`${fromId}.`))
            .sort((a, b) => a.length - b.length);

        await this.addUpdating(ids);
        this.selectAfterUpdate = newFromId;

        try {
            for (const id of ids) {
                const newId = `${toId}${id.substring(fromPrefix.length)}`;
                const newEnum: ioBroker.EnumObject = JSON.parse(JSON.stringify(stateEnums[id]));
                newEnum._id = newId;
                await this.props.socket.setObject(newId, newEnum);
                await this.props.socket.delObject(id);
            }
        } catch (e) {
            window.alert(`Cannot move enum: ${errorText(e)}`);
        }
    };

    showEnumEditDialog = (enumItem: ioBroker.EnumObject, isNew?: boolean): void => {
        const enumEditDialog: EnumEditDialogProps = { changed: false };
        enumEditDialog.newItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.originalItem = JSON.parse(JSON.stringify(enumItem));
        enumEditDialog.isNew = isNew;
        this.setState({ enumEditDialog });
    };

    showEnumDeleteDialog = (enumItem: ioBroker.EnumObject): void => this.setState({ enumDeleteDialog: enumItem });

    getEnumName(enumId: string): string {
        return this.getName(this.state.enums?.[enumId]?.common?.name) || enumId.split('.').pop() || enumId;
    }

    saveEnum = async (): Promise<void> => {
        const newItem = this.state.enumEditDialog?.newItem;
        const originalId = this.state.enumEditDialog?.originalItem?._id;
        if (!newItem || !originalId) {
            return;
        }
        const stateEnums = this.state.enums || {};

        if (this.state.enumEditDialog?.isNew || originalId !== newItem._id) {
            this.selectAfterUpdate = newItem._id;
        }

        await this.addUpdating([originalId]);
        await this.props.socket.setObject(newItem._id, newItem);

        if (originalId !== newItem._id) {
            try {
                await this.props.socket.delObject(originalId);

                for (const id of Object.keys(stateEnums)) {
                    if (id.startsWith(`${originalId}.`)) {
                        const newEnumChild: ioBroker.EnumObject = JSON.parse(JSON.stringify(stateEnums[id]));
                        newEnumChild._id = newEnumChild._id.replace(`${originalId}.`, `${newItem._id}.`);
                        await this.props.socket.setObject(newEnumChild._id, newEnumChild);
                        await this.props.socket.delObject(id);
                    }
                }
            } catch (e) {
                window.alert(`Cannot save enum: ${errorText(e)}`);
            }
        }

        this.setState({ enumEditDialog: null });
    };

    deleteEnum = async (enumId: string): Promise<void> => {
        const stateEnums = this.state.enums || {};
        const ids = Object.keys(stateEnums).filter(id => id === enumId || id.startsWith(`${enumId}.`));
        await this.addUpdating(ids);
        try {
            for (const id of ids) {
                await this.props.socket.delObject(id);
            }
        } catch (e) {
            window.alert(`Cannot delete enum: ${errorText(e)}`);
        }

        this.setState({ enumDeleteDialog: null });
    };

    copyEnum = (enumId: string): void => {
        const enumItem: ioBroker.EnumObject = JSON.parse(JSON.stringify(this.state.enums?.[enumId]));
        let newId;
        let index = 1;
        do {
            newId = enumId + index.toString();
            index++;
        } while (this.state.enums?.[newId]);

        enumItem._id = newId;
        this.selectAfterUpdate = newId;

        this.props.socket.setObject(newId, enumItem).catch(e => window.alert(`Cannot copy enum: ${e}`));
    };

    toggleEnum = (enumId: string): void => {
        const enumsClosed = { ...this.state.enumsClosed, [enumId]: !this.state.enumsClosed[enumId] };
        this.setState({ enumsClosed });
        getStorage().setItem('enumsClosed', JSON.stringify(enumsClosed));
    };

    toggleAllEnums = (close: boolean): void => {
        const enumsClosed: Record<string, boolean> = {};
        if (close) {
            Object.keys(this.state.enums || {}).forEach(id => (enumsClosed[id] = true));
        }
        this.setState({ enumsClosed });
        getStorage().setItem('enumsClosed', JSON.stringify(enumsClosed));
    };

    toggleObjects = (): void => {
        const showObjects = !this.state.showObjects;
        this.setState({ showObjects });
        getStorage().setItem('enumsShowObjects', showObjects ? 'true' : 'false');
    };

    changeEnumFormData = (newItem: ioBroker.EnumObject): void => {
        const enumEditDialog = JSON.parse(JSON.stringify(this.state.enumEditDialog));
        enumEditDialog.newItem = JSON.parse(JSON.stringify(newItem));
        enumEditDialog.changed =
            JSON.stringify(enumEditDialog.newItem) !==
            JSON.stringify(this.state.enums?.[enumEditDialog.originalItem as unknown as string] || {});
        this.setState({ enumEditDialog });
    };

    getName = (name: ioBroker.StringOrTranslated | undefined): string => AdminUtils.getText(name, this.props.lang);

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

    renderEditDialog(): JSX.Element | null {
        return this.state.enumEditDialog ? (
            <EnumEditDialog
                onClose={() => this.setState({ enumEditDialog: null })}
                enums={Object.values(this.state.enums || {})}
                enum={this.state.enumEditDialog.newItem as ioBroker.EnumObject}
                getName={this.getName}
                isNew={!!this.state.enumEditDialog.isNew}
                t={this.props.t}
                lang={this.props.lang}
                changed={this.state.enumEditDialog.changed}
                onChange={this.changeEnumFormData}
                saveData={this.saveEnum}
                innerWidth={window.innerWidth}
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
        return this.state.enumTemplateDialog ? (
            <EnumTemplateDialog
                prefix={this.state.enumTemplateDialog}
                onClose={() => this.setState({ enumTemplateDialog: null })}
                t={this.props.t}
                lang={this.props.lang}
                createEnumTemplate={this.createEnumTemplate}
                showEnumEditDialog={this.showEnumEditDialog}
                enums={this.state.enums || {}}
                getEnumTemplate={this.getEnumTemplate}
            />
        ) : null;
    }

    renderAddObjectsDialog(): JSX.Element | null {
        const enumId = this.state.addObjectsDialog;
        if (!enumId) {
            return null;
        }
        return (
            <DialogSelectID
                dialogName="enumsAddObjects"
                title={this.props.t('Add objects to "%s"', this.getEnumName(enumId))}
                ok={this.props.t('Add objects')}
                multiSelect
                types={['state', 'channel', 'device']}
                columns={['name', 'type', 'role', 'room', 'func']}
                socket={this.props.socket}
                lang={this.props.lang}
                theme={this.props.theme}
                themeName={this.props.theme.name}
                themeType={this.props.themeType}
                onClose={() => this.setState({ addObjectsDialog: null })}
                onOk={selected => {
                    const ids = Array.isArray(selected) ? selected : selected ? [selected] : [];
                    this.addItemsToEnum(ids, enumId);
                }}
            />
        );
    }

    renderAddFolderDialog(): JSX.Element | null {
        const dialog = this.state.addFolderDialog;
        if (!dialog) {
            return null;
        }
        return (
            <DialogConfirm
                title={this.props.t('Add objects')}
                text={this.props.t(
                    'Add %s objects from "%s" to "%s"?',
                    dialog.ids.length.toString(),
                    dialog.folderId,
                    this.getEnumName(dialog.enumId),
                )}
                ok={this.props.t('Add objects')}
                onClose={ok =>
                    this.setState({ addFolderDialog: null }, () => ok && this.addItemsToEnum(dialog.ids, dialog.enumId))
                }
            />
        );
    }

    setView = (view: 'categories' | 'assignment'): void => {
        this.setState({ view });
        getStorage().setItem('enumsView', view);
    };

    /** Show the enum in the categories view */
    openEnum = (enumId: string): void => {
        this.setView('categories');
        this.selectEnum(enumId);
    };

    changeMembers = async (changes: MemberChanges): Promise<void> => {
        const enums = this.state.enums || {};
        const newEnums: ioBroker.EnumObject[] = [];
        for (const enumId of Object.keys(changes)) {
            if (!enums[enumId]) {
                continue;
            }
            const oldMembers = enums[enumId].common?.members || [];
            const remove = changes[enumId].remove || [];
            const members = oldMembers.filter(id => !remove.includes(id));
            for (const id of changes[enumId].add || []) {
                if (!members.includes(id)) {
                    members.push(id);
                }
            }
            if (JSON.stringify(members) !== JSON.stringify(oldMembers)) {
                const newEnum: ioBroker.EnumObject = JSON.parse(JSON.stringify(enums[enumId]));
                newEnum.common.members = members;
                newEnums.push(newEnum);
            }
        }
        if (!newEnums.length) {
            return;
        }

        await this.addUpdating(newEnums.map(enumObj => enumObj._id));
        this.fastUpdate = true;
        for (const newEnum of newEnums) {
            try {
                await this.props.socket.setObject(newEnum._id, newEnum);
            } catch (e) {
                window.alert(`Cannot update enum: ${errorText(e)}`);
            }
        }
    };

    /** Create the enums, which do not exist yet. Shorter IDs first, so the parents exist before their children */
    createEnums = async (newEnums: ioBroker.EnumObject[]): Promise<void> => {
        this.fastUpdate = true;
        for (const enumObj of [...newEnums].sort((a, b) => a._id.length - b._id.length)) {
            if (this.state.enums?.[enumObj._id]) {
                continue;
            }
            try {
                await this.props.socket.setObject(enumObj._id, enumObj);
            } catch (e) {
                window.alert(`Cannot create enum: ${errorText(e)}`);
            }
        }
    };

    renderWizard(): JSX.Element | null {
        if (!this.state.wizardOpen || !this.state.enums) {
            return null;
        }
        return (
            <EnumWizard
                socket={this.props.socket}
                enums={this.state.enums}
                t={this.props.t}
                theme={this.props.theme}
                getName={this.getName}
                fullScreen={this.state.narrow}
                onCreateEnums={this.createEnums}
                onChangeMembers={this.changeMembers}
                onClose={() => this.setState({ wizardOpen: false })}
            />
        );
    }

    renderViewToggle(): JSX.Element {
        const { t } = this.props;
        return (
            <ToggleButtonGroup
                size="small"
                exclusive
                sx={styles.viewToggle}
                value={this.state.view}
                onChange={(_e, view: 'categories' | 'assignment' | null) => view && this.setView(view)}
            >
                <ToggleButton
                    value="categories"
                    title={t('Categories')}
                >
                    <CategoriesIcon fontSize="small" />
                    {this.state.narrow ? null : t('Categories')}
                </ToggleButton>
                <ToggleButton
                    value="assignment"
                    title={t('Assignment')}
                >
                    <AssignmentIcon fontSize="small" />
                    {this.state.narrow ? null : t('Assignment')}
                </ToggleButton>
            </ToggleButtonGroup>
        );
    }

    renderTopBar(categories: Record<string, EnumTreeItem>): JSX.Element {
        const { t } = this.props;
        return (
            <Box sx={styles.topBar}>
                {this.renderViewToggle()}
                <Tooltip
                    title={t('Set up rooms and functions')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        sx={styles.wizardButton}
                        startIcon={<WizardIcon />}
                        onClick={() => this.setState({ wizardOpen: true })}
                    >
                        {this.state.narrow ? null : t('Assistant')}
                    </Button>
                </Tooltip>
                {this.state.view === 'categories' ? (
                    <>
                        <Tooltip
                            title={t('Add enum')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <IconButton
                                id="categoryPopoverButton"
                                size="small"
                                onClick={() =>
                                    categories.favorites
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
                                {categories.favorites ? null : (
                                    <MenuItem
                                        onClick={() => {
                                            this.setState({ categoryPopoverOpen: false });
                                            this.createEnumTemplate('enum', enumTemplates.favorites);
                                        }}
                                    >
                                        {t('Favorites')}
                                    </MenuItem>
                                )}
                                <MenuItem
                                    onClick={() => {
                                        this.setState({ categoryPopoverOpen: false });
                                        this.showEnumEditDialog(this.getEnumTemplate('enum'), true);
                                    }}
                                >
                                    {t('Custom enum')}
                                </MenuItem>
                            </MenuList>
                        </Popover>
                        {Object.keys(categories).length ? (
                            <Tabs
                                value={categories[this.state.currentCategory] ? this.state.currentCategory : false}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={styles.tabs}
                                onChange={(_e, category: string) =>
                                    this.setCurrentCategory(category, () => this.setState({ showDetails: false }))
                                }
                            >
                                {Object.keys(categories).map(category => {
                                    const child = categories[category];
                                    const categoryData: ioBroker.EnumObject = child.data || {
                                        _id: child.id,
                                        common: { name: child.id.split('.').pop() || '' },
                                        type: 'enum',
                                        native: {},
                                    };
                                    return (
                                        <Tab
                                            key={category}
                                            component="span"
                                            style={{
                                                backgroundColor: categoryData.common?.color || undefined,
                                                borderRadius: 4,
                                            }}
                                            label={
                                                <CategoryLabel
                                                    categoryData={categoryData}
                                                    showEnumEditDialog={
                                                        this.showEnumEditDialog as unknown as (
                                                            category: Record<string, any>,
                                                            isNew: boolean,
                                                        ) => void
                                                    }
                                                    showEnumDeleteDialog={
                                                        this.showEnumDeleteDialog as unknown as (
                                                            category: Record<string, any>,
                                                        ) => void
                                                    }
                                                    styles={styles}
                                                    {...this.props}
                                                />
                                            }
                                            value={category}
                                        />
                                    );
                                })}
                            </Tabs>
                        ) : null}
                    </>
                ) : null}
                <Box sx={{ flexGrow: 1 }} />
                {/* a hidden object list is opened with the bar on the right side, so the button only hides it */}
                {this.state.narrow || this.state.view !== 'categories' || !this.state.showObjects ? null : (
                    <Tooltip
                        title={t('Hide object list')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <IconButton
                            color="primary"
                            onClick={this.toggleObjects}
                        >
                            <ObjectListIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        );
    }

    renderListPane(category: EnumTreeItem | undefined, selectedId: string | null): JSX.Element {
        const { t } = this.props;
        const items = category ? Object.values(category.children) : [];
        const hasFolders = Object.values(this.state.enums || {}).some(
            enumObj =>
                enumObj._id.startsWith(`enum.${this.state.currentCategory}.`) && enumObj._id.split('.').length > 3,
        );
        const anyClosed = Object.values(this.state.enumsClosed).some(closed => closed);

        return (
            <Box sx={Utils.getStyle(this.props.theme, styles.listPane, this.state.narrow && styles.listPaneNarrow)}>
                <Box sx={styles.listToolbar}>
                    <TextField
                        variant="standard"
                        placeholder={t('Filter')}
                        sx={styles.filter}
                        value={this.state.filter}
                        onChange={e => this.setState({ filter: e.target.value })}
                        slotProps={{
                            input: {
                                endAdornment: this.state.filter ? (
                                    <IconButton
                                        tabIndex={-1}
                                        size="small"
                                        onClick={() => this.setState({ filter: '' })}
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                ) : null,
                            },
                        }}
                    />
                    {hasFolders ? (
                        <Tooltip
                            title={t(anyClosed ? 'Expand all' : 'Collapse all')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <IconButton
                                size="small"
                                onClick={() => this.toggleAllEnums(!anyClosed)}
                            >
                                {anyClosed ? <ExpandAllIcon /> : <CollapseAllIcon />}
                            </IconButton>
                        </Tooltip>
                    ) : null}
                    <Tooltip
                        title={t('Add group')}
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <span>
                            <IconButton
                                size="small"
                                disabled={!this.state.currentCategory}
                                onClick={() => this.addEnum(`enum.${this.state.currentCategory}`)}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                <Box sx={styles.listScroll}>
                    <EnumTreeList
                        items={items}
                        selectedId={selectedId}
                        onSelect={this.selectEnum}
                        closed={this.state.enumsClosed}
                        onToggle={this.toggleEnum}
                        search={this.state.filter.trim().toLowerCase()}
                        updating={this.state.updating}
                        getName={this.getName}
                        moveEnum={this.moveEnum}
                        t={t}
                        theme={this.props.theme}
                    />
                </Box>
            </Box>
        );
    }

    renderDetailsPane(selectedId: string | null): JSX.Element {
        const enumItem = selectedId ? this.state.enums?.[selectedId] : undefined;
        if (!selectedId || !enumItem) {
            return <Box sx={styles.detailsEmpty}>{this.props.t('Select an entry on the left')}</Box>;
        }
        const node = this.findTreeItem(selectedId);

        return (
            <EnumDetails
                enumItem={enumItem}
                enums={this.state.enums || {}}
                subEntries={node ? Object.values(node.children) : []}
                members={this.state.members}
                parents={this.state.parents}
                socket={this.props.socket}
                t={this.props.t}
                theme={this.props.theme}
                getName={this.getName}
                updating={this.state.updating.includes(selectedId)}
                onBack={this.state.narrow ? () => this.setState({ showDetails: false }) : undefined}
                onSelect={this.selectEnum}
                onEdit={() => this.showEnumEditDialog(enumItem, false)}
                onClone={() => this.copyEnum(selectedId)}
                onDelete={() => this.showEnumDeleteDialog(enumItem)}
                onAddChild={() => this.addEnum(selectedId)}
                onAddObjects={() => this.setState({ addObjectsDialog: selectedId })}
                onRemoveMember={memberId => this.removeMemberFromEnum(memberId, selectedId)}
                onMoveMember={(memberId, toEnumId, copy) => void this.moveMember(memberId, selectedId, toEnumId, copy)}
            />
        );
    }

    renderRail(): JSX.Element {
        return (
            <Box
                sx={styles.rail}
                title={this.props.t('Show object list')}
                onClick={this.toggleObjects}
            >
                <ObjectListIcon />
                <span style={styles.railText}>{this.props.t('Object list')}</span>
            </Box>
        );
    }

    render(): JSX.Element {
        const enumsTree = this.state.enumsTree;
        if (!enumsTree) {
            return <LinearProgress />;
        }
        const categories = enumsTree.children.enum?.children || {};
        const selectedId = this.getSelectedId();

        let main: JSX.Element;
        if (this.state.narrow) {
            main =
                this.state.showDetails && selectedId
                    ? this.renderDetailsPane(selectedId)
                    : this.renderListPane(categories[this.state.currentCategory], selectedId);
        } else {
            main = (
                <Box sx={styles.main}>
                    {this.renderListPane(categories[this.state.currentCategory], selectedId)}
                    {this.renderDetailsPane(selectedId)}
                </Box>
            );
        }

        return (
            <>
                <DndProvider backend={AdminUtils.isTouchDevice() ? TouchBackend : HTML5Backend}>
                    <DndPreview />
                    <Box sx={styles.root}>
                        {this.renderTopBar(categories)}
                        <Box sx={styles.body}>
                            {this.state.view === 'assignment' ? (
                                <EnumAssignment
                                    socket={this.props.socket}
                                    enums={this.state.enums || {}}
                                    t={this.props.t}
                                    theme={this.props.theme}
                                    getName={this.getName}
                                    onChangeMembers={this.changeMembers}
                                    onOpenEnum={this.openEnum}
                                />
                            ) : !this.state.narrow && this.state.showObjects ? (
                                <Box sx={styles.split}>
                                    <ReactSplit
                                        direction={SplitDirection.Horizontal}
                                        initialSizes={this.state.splitSizes}
                                        minWidths={[600, 320]}
                                        onResizeFinished={(_gutterIdx: number, newSizes: number[]) => {
                                            const splitSizes: [number, number] = [newSizes[0], newSizes[1]];
                                            this.setState({ splitSizes });
                                            getStorage().setItem('enumsSplitSizes2', JSON.stringify(splitSizes));
                                        }}
                                        gutterClassName={
                                            this.props.themeType === 'dark' ? 'Dark visGutter' : 'Light visGutter'
                                        }
                                    >
                                        {main}
                                        <Box sx={styles.objectsPane}>
                                            <DragObjectBrowser
                                                addItemToEnum={this.addItemToEnum}
                                                addFolderToEnum={this.addFolderToEnum}
                                                getName={this.getName}
                                                stylesParent={styles}
                                                t={this.props.t}
                                                socket={this.props.socket}
                                                lang={this.props.lang}
                                                theme={this.props.theme}
                                            />
                                        </Box>
                                    </ReactSplit>
                                </Box>
                            ) : (
                                <>
                                    {main}
                                    {this.state.narrow ? null : this.renderRail()}
                                </>
                            )}
                        </Box>
                    </Box>
                </DndProvider>
                {this.renderEditDialog()}
                {this.renderDeleteDialog()}
                {this.renderTemplateDialog()}
                {this.renderAddObjectsDialog()}
                {this.renderAddFolderDialog()}
                {this.renderWizard()}
            </>
        );
    }
}
