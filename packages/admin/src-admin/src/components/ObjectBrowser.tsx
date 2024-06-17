/**
 * Copyright 2020-2024, Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 * To all editors: please merge asap the changes to https://github.com/ioBroker/adapter-react/blob/master/src/Components/ObjectBrowser.js
 * This file is here only temporary for better debugging
 * */
import React, { Component, createRef } from 'react';
import SVG from 'react-inlinesvg';

import {
    Badge,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Fab,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    Input,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Snackbar,
    Switch,
    TextField,
    type Theme,
    Tooltip,
} from '@mui/material';

// Icons
import {
    Add as AddIcon,
    ArrowRight as ArrowRightIcon,
    BedroomParent,
    BorderColor,
    Build as BuildIcon,
    CalendarToday as IconSchedule,
    Check as IconCheck,
    Close as IconClose,
    Code as IconScript,
    Construction,
    CreateNewFolder as IconFolder,
    Delete as IconDelete,
    Description as IconMeta,
    Edit as IconEdit,
    Error as IconError,
    FindInPage,
    FormatItalic as IconValueEdit,
    Info as IconInfo,
    Link as IconLink,
    ListAlt as IconEnum,
    LooksOne as LooksOneIcon,
    PersonOutlined as IconUser,
    Publish as PublishIcon,
    Refresh as RefreshIcon,
    RoomService as PressButtonIcon,
    Router as IconHost,
    Settings as IconConfig,
    SettingsApplications as IconSystem,
    DataObject as IconData,
    ShowChart as IconChart,
    SupervisedUserCircle as IconGroup,
    TextFields as TextFieldsIcon,
    ViewColumn as IconColumns,
    Wifi as IconConnection,
    WifiOff as IconDisconnected,
} from '@mui/icons-material';

import {
    Icon,
    IconAdapter,
    IconChannel,
    IconClearFilter,
    IconClosed,
    IconCopy,
    IconDevice,
    IconDocument,
    IconDocumentReadOnly,
    IconExpert,
    IconInstance,
    IconOpen,
    IconState,
    withWidth,
    Connection,
    type Router,
    type IobTheme,
    type ThemeType,
    type ThemeName,
    type Translate,
} from '@iobroker/adapter-react-v5';
// own
import Utils from './Utils'; // @iobroker/adapter-react-v5/Components/Utils
import TabContainer from './TabContainer';
import TabContent from './TabContent';
import TabHeader from './TabHeader';

declare global {
    interface Window {
        sparkline: {
            sparkline: (el: HTMLDivElement, data: number[]) => React.JSX.Element;
        };
    }
}
declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

const ICON_SIZE = 24;
const ROW_HEIGHT = 32;
const ITEM_LEVEL = 16;
const SMALL_BUTTON_SIZE = 20;
const COLOR_NAME_USERDATA = (themeType: ThemeType) => (themeType === 'dark' ? '#62ff25' : '#37c400');
const COLOR_NAME_ALIAS = (themeType: ThemeType) => (themeType === 'dark' ? '#ee56ff' : '#a204b4');
const COLOR_NAME_JAVASCRIPT = (themeType: ThemeType) => (themeType === 'dark' ? '#fff46e' : '#b89101');
const COLOR_NAME_SYSTEM = (themeType: ThemeType) => (themeType === 'dark' ? '#ff6d69' : '#ff6d69');
const COLOR_NAME_SYSTEM_ADAPTER = (themeType: ThemeType) => (themeType === 'dark' ? '#5773ff' : '#5773ff');
const COLOR_NAME_ERROR_DARK = '#ff413c';
const COLOR_NAME_ERROR_LIGHT = '#86211f';
const COLOR_NAME_CONNECTED_DARK = '#57ff45';
const COLOR_NAME_CONNECTED_LIGHT = '#098c04';
const COLOR_NAME_DISCONNECTED_DARK = '#f3ad11';
const COLOR_NAME_DISCONNECTED_LIGHT = '#6c5008';

type ObjectEventType = 'new' | 'changed' | 'deleted';

interface ObjectEvent {
    id: string;
    obj?: ioBroker.Object;
    type: ObjectEventType;
    oldObj?: ioBroker.Object;
}

interface ObjectsWorker {
    getObjects(update?: boolean): Promise<void | Record<string, ioBroker.Object>>;
    registerHandler(cb: (events: ObjectEvent[]) => void): void;
    unregisterHandler(cb: (events: ObjectEvent[]) => void, doNotUnsubscribe?: boolean): void;
}

interface CustomAdminColumnStored {
    path: string;
    name: string;
    objTypes?: ioBroker.ObjectType[];
    width?: number;
    edit?: boolean;
    type?: ioBroker.CommonType;
}

interface ContextMenuItem {
    /** hotkey */
    key?: string;
    visibility: boolean;
    icon: React.JSX.Element | string;
    label: string;
    onClick?: () => void;
    listItemIconStyle?: React.CSSProperties;
    style?: React.CSSProperties;
    subMenu?: {
        label: string;
        visibility: boolean;
        icon: React.JSX.Element;
        onClick:  () => void;
        iconStyle?: React.CSSProperties;
        style?: React.CSSProperties;
        listItemIconStyle?: React.CSSProperties;
    }[];
    iconStyle?: React.CSSProperties;
}

export interface TreeItemData {
    id: string;
    name: string;
    obj?: ioBroker.Object;
    /** Object ID in lower case for filtering */
    fID?: string;
    /** translated common.name in lower case for filtering */
    fName?: string;
    /** Link to parent item */
    // eslint-disable-next-line no-use-before-define
    parent?: TreeItem;
    level?: number;
    icon?: string | React.JSX.Element | null;
    /** If the item existing object or generated folder */
    generated?: boolean;
    title?: string;
    /** if the item has "write" button (value=true, ack=false) */
    button?: boolean;
    /** if the item has custom settings in `common.custom` */
    hasCustoms?: boolean;
    /** If this item is visible */
    visible?: boolean;
    /** Is any of the children visible (not only directly children) */
    hasVisibleChildren?: boolean;
    /** Is any of the parents visible (not only directly parent) */
    hasVisibleParent?: boolean;
    /** Combination of `visible || hasVisibleChildren` */
    sumVisibility?: boolean;
    /** translated names of enumerations (functions) where this object is the member (or the parent), divided by comma */
    funcs?: string;
    /** is if the enums are from parent */
    pef?: boolean;
    /** translated names of enumerations (rooms) where this object is the member (or the parent), divided by comma */
    rooms?: string;
    /** is if the enums are from parent */
    per?: boolean;
    // language in what the rooms and functions where translated
    lang?: ioBroker.Languages;
    state?: {
        valTextRx?: React.JSX.Element[] | null;
        style?: React.CSSProperties;
    };
    aclTooltip?: null | React.JSX.Element;
}

interface InputSelectItem {
    value: string;
    name: string;
    icon?: null | React.JSX.Element;
}

type ioBrokerObjectForExport = ioBroker.Object & Partial<ioBroker.State>;

interface ObjectBrowserCustomFilter {
    type?: ioBroker.ObjectType | ioBroker.ObjectType[];
    common?: {
        type?: ioBroker.CommonType | ioBroker.CommonType[];
        role?: string | string[];
        // If "_" - no custom set
        // If "_dataSources" - only data sources (history, sql, influxdb, ...)
        // Else "telegram." or something like this
        // `true` - If common.custom not empty
        custom?: '_' | '_dataSources' | true | string | string [];
    };
}

interface FormatValueOptions {
    state: ioBroker.State;
    obj: ioBroker.StateObject;
    texts: Record<string, string>;
    dateFormat: string;
    isFloatComma: boolean;
    full?: boolean;
}

export interface TreeItem {
    id?: string;
    data: TreeItemData;
    children?: TreeItem[];
}

interface TreeInfo {
    funcEnums: string[];
    roomEnums: string[];
    roles: string[];
    ids: string[];
    types: string[];
    objects: Record<string, ioBroker.Object>;
    customs: string[];
    enums: string[];
    hasSomeCustoms: boolean;
}

interface GetValueStyleOptions {
    state: ioBroker.State;
    isExpertMode?: boolean;
    isButton?: boolean;
}

const styles: Record<string, any> = {
    toolbar: {
        minHeight: 38, // Theme.toolbar.height,
        //        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4,
    },
    switchColumnAuto: {
        marginLeft: 16,
    },
    dialogColumns: {
        transition: 'opacity 1s',
    },
    dialogColumnsLabel: {
        fontSize: 12,
        paddingTop: 8,
    },
    columnCustom: {
        width: '100%',
        display: 'inline-block',
    },
    columnCustomEditable: {
        cursor: 'text',
    },
    columnCustom_center: {
        textAlign: 'center',
    },
    columnCustom_left: {
        textAlign: 'left',
    },
    columnCustom_right: {
        textAlign: 'right',
    },
    width100: {
        width: '100%',
    },
    transparent_10: {
        opacity: 0.1,
    },
    transparent_20: {
        opacity: 0.2,
    },
    transparent_30: {
        opacity: 0.3,
    },
    transparent_40: {
        opacity: 0.4,
    },
    transparent_50: {
        opacity: 0.5,
    },
    transparent_60: {
        opacity: 0.6,
    },
    transparent_70: {
        opacity: 0.7,
    },
    transparent_80: {
        opacity: 0.8,
    },
    transparent_90: {
        opacity: 0.9,
    },
    transparent_100: {
        opacity: 1,
    },
    headerRow: {
        paddingLeft: 8,
        height: 38,
        whiteSpace: 'nowrap',
        userSelect: 'none',
    },
    buttonClearFilter: {
        position: 'relative',
        float: 'right',
        padding: 0,
    },
    buttonClearFilterIcon: {
        zIndex: 2,
        position: 'absolute',
        top: 0,
        left: 0,
        color: '#FF0000',
        opacity: 0.7,
    },

    tableDiv: {
        paddingTop: 0,
        paddingLeft: 0,
        width: 'calc(100% - 8px)',
        height: 'calc(100% - 38px)',
        overflow: 'auto',
    },
    tableRow: (theme: IobTheme) => ({
        pl: 1,
        height: ROW_HEIGHT,
        lineHeight: `${ROW_HEIGHT}px`,
        verticalAlign: 'top',
        userSelect: 'none',
        width: '100%',
        '&:hover': {
            background: `${
                theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light
            } !important`,
            color: Utils.invertColor(theme.palette.primary.main, true),
        },
        whiteSpace: 'nowrap',
        flexWrap: 'nowrap',
    }),
    tableRowLines: (theme: IobTheme) => ({
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#8888882e' : '#8888882e'}`,
        '& > div': {
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#8888882e' : '#8888882e'}`,
        },
    }),
    tableRowNoDragging: {
        cursor: 'pointer',
    },
    tableRowAlias: {
        height: ROW_HEIGHT + 10,
    },
    tableRowAliasReadWrite: {
        height: ROW_HEIGHT + 22,
    },
    checkBox: {
        padding: 0,
    },
    cellId: {
        position: 'relative',
        fontSize: '1rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        // verticalAlign: 'top',
        // position: 'relative',
        '& .copyButton': {
            display: 'none',
        },
        '&:hover .copyButton': {
            display: 'block',
        },
        '& .iconOwn': {
            display: 'block',
            width: ROW_HEIGHT - 4,
            height: ROW_HEIGHT - 4,
            mt: '2px',
            float: 'right',
        },
        '&:hover .iconOwn': {
            display: 'none',
        },
        '& *': {
            width: 'initial',
        },
    },
    cellIdSpan: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        // display: 'inline-block',
        // verticalAlign: 'top',
    },
    // this style is used for simple div. Do not migrate it to "secondary.main"
    cellIdIconFolder: (theme: IobTheme) => ({
        marginRight: 8,
        width: ROW_HEIGHT - 4,
        height: ROW_HEIGHT - 4,
        cursor: 'pointer',
        color: theme.palette.secondary.main || '#fbff7d',
        verticalAlign: 'top',
    }),
    cellIdIconDocument: {
        verticalAlign: 'middle',
        marginLeft: (ROW_HEIGHT - SMALL_BUTTON_SIZE) / 2,
        marginRight: 8,
        width: SMALL_BUTTON_SIZE,
        height: SMALL_BUTTON_SIZE,
    },
    cellIdIconOwn: {

    },
    cellIdTooltip: {
        fontSize: 14,
    },
    cellIdTooltipLink: {
        color: '#7ec2fd',
        '&:hover': {
            color: '#7ec2fd',
        },
        '&:visited': {
            color: '#7ec2fd',
        },
    },
    cellCopyButton: {
        width: SMALL_BUTTON_SIZE,
        height: SMALL_BUTTON_SIZE,
        top: (ROW_HEIGHT - SMALL_BUTTON_SIZE) / 2,
        opacity: 0.8,
        position: 'absolute',
        right: 3,
    },
    cellEditButton: {
        width: SMALL_BUTTON_SIZE,
        height: SMALL_BUTTON_SIZE,
        color: 'white',
        position: 'absolute',
        top: (ROW_HEIGHT - SMALL_BUTTON_SIZE) / 2,
        right: SMALL_BUTTON_SIZE + 3,
        opacity: 0.7,
        '&:hover': {
            opacity: 1,
        },
    },
    cellName: {
        display: 'inline-block',
        verticalAlign: 'top',
        fontSize: 14,
        ml: '5px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        position: 'relative',
        '& .copyButton': {
            display: 'none',
        },
        '&:hover .copyButton': {
            display: 'block',
        },
    },
    cellNameWithDesc: {
        lineHeight: 'normal',
    },
    cellNameDivDiv: {

    },
    cellDescription: {
        fontSize: 10,
        opacity: 0.5,
        fontStyle: 'italic',
    },
    cellIdAlias: (theme: IobTheme) => ({
        fontStyle: 'italic',
        fontSize: 12,
        opacity: 0.7,
        '&:hover': {
            color: theme.palette.mode === 'dark' ? '#009900' : '#007700',
        },
    }),
    cellIdAliasReadWriteDiv: {
        height: 24,
        marginTop: -5,
    },
    cellIdAliasAlone: {
        lineHeight: 0,
    },
    cellIdAliasReadWrite: {
        lineHeight: '12px',
    },
    cellType: {
        display: 'inline-block',
        verticalAlign: 'top',
        '& .itemIcon': {
            verticalAlign: 'middle',
            width: ICON_SIZE,
            height: ICON_SIZE,
            display: 'inline-block',
        },
        '& .itemIconFolder': {
            marginLeft: 3,
        },
    },
    cellRole: {
        display: 'inline-block',
        verticalAlign: 'top',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    cellRoom: {
        display: 'inline-block',
        verticalAlign: 'top',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    cellEnumParent: {
        opacity: 0.4,
    },
    cellFunc: {
        display: 'inline-block',
        verticalAlign: 'top',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    cellValue: {
        display: 'inline-block',
        verticalAlign: 'top',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    cellValueButton: {
        marginTop: 5,
        '&:active': {
            transform: 'scale(0.8)',
        },
    },
    cellValueButtonFalse: {
        opacity: 0.3,
    },
    cellAdapter: {
        display: 'inline-block',
        verticalAlign: 'top',
    },
    cellValueTooltip: {
        fontSize: 12,
    },
    cellValueText: {
        width: '100%',
        height: ROW_HEIGHT,
        fontSize: 16,
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        position: 'relative',
        verticalAlign: 'top',
        '& .copyButton': {
            display: 'none',
        },
        '&:hover .copyButton': {
            display: 'block',
        },
    },
    cellValueFile: {
        color: '#2837b9',
    },
    cellValueTooltipTitle: {
        fontStyle: 'italic',
        width: 100,
        display: 'inline-block',
    },
    cellValueTooltipValue: {
        width: 120,
        display: 'inline-block',
        // overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    cellValueTooltipImage: {
        width: 100,
        height: 'auto',
    },
    cellValueTooltipBoth: {
        width: 220,
        display: 'inline-block',
        whiteSpace: 'nowrap',
    },
    cellValueTooltipBox: {
        width: 250,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    tooltip: {
        pointerEvents: 'none',
    },
    cellValueTextUnit: {
        marginLeft: 4,
        opacity: 0.8,
    },
    cellValueTextState: {
        opacity: 0.7,
    },
    cellValueTooltipCopy: {
        position: 'absolute',
        bottom: 3,
        right: 3,
    },
    cellValueTooltipEdit: {
        position: 'absolute',
        bottom: 3,
        right: 15,
    },
    cellButtons: {
        display: 'inline-block',
        verticalAlign: 'top',
    },
    cellButtonsButton: {
        display: 'inline-block',
        opacity: 0.7,
        width: SMALL_BUTTON_SIZE + 4,
        height: SMALL_BUTTON_SIZE + 4,
        '&:hover': {
            opacity: 1,
        },
        paddingTop: 0,
        paddingLeft: 0,
        marginTop: -2,
    },
    cellButtonsEmptyButton: {
        fontSize: 12,
    },
    cellButtonMinWidth: {
        minWidth: 47,
    },
    cellButtonsButtonAlone: {
        marginLeft: SMALL_BUTTON_SIZE + 4,
        paddingTop: 0,
        marginTop: -2,
    },
    cellButtonsButtonWithCustoms: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.secondary.main,
    }),
    cellButtonsButtonWithoutCustoms: {
        opacity: 0.2,
    },
    cellButtonsValueButton: (theme: IobTheme) => ({
        position: 'absolute',
        top: SMALL_BUTTON_SIZE / 2 - 2,
        opacity: 0.7,
        width: SMALL_BUTTON_SIZE - 2,
        height: SMALL_BUTTON_SIZE - 2,
        color: theme.palette.action.active,
        '&:hover': {
            opacity: 1,
        },
    }),
    cellButtonsValueButtonCopy: {
        right: 8,
        cursor: 'pointer',
    },
    cellButtonsValueButtonEdit: {
        right: (SMALL_BUTTON_SIZE / 2) + 16,
    },

    filteredOut: {
        opacity: 0.5,
    },
    filteredParentOut: {
        opacity: 0.3,
    },
    filterInput: {
        mt: 0,
        mb: 0,
    },
    selectIcon: {
        width: 24,
        height: 24,
        marginRight: 4,
    },
    selectNone: {
        opacity: 0.5,
    },
    itemSelected: (theme: IobTheme) => ({
        background: `${theme.palette.primary.main} !important`,
        color: `${Utils.invertColor(theme.palette.primary.main, true)} !important`,
    }),
    header: {
        width: '100%',
    },
    headerCell: {
        display: 'inline-block',
        verticalAlign: 'top',
    },
    headerCellValue: {
        paddingTop: 4,
        // paddingLeft: 5,
        fontSize: 16,
    },
    headerCellInput: {
        width: 'calc(100% - 5px)',
        height: ROW_HEIGHT,
        pt: 0,
        '& .itemIcon': {
            verticalAlign: 'middle',
            width: ICON_SIZE,
            height: ICON_SIZE,
            display: 'inline-block',
        },
    },
    headerCellSelectItem: {
        '& .itemIcon': {
            width: ICON_SIZE,
            height: ICON_SIZE,
            mr: '5px',
            display: 'inline-block',
        },
    },
    visibleButtons: {
        color: '#2196f3',
        opacity: 0.7,
    },
    grow: {
        flexGrow: 1,
    },
    enumIconDiv: {
        marginRight: 8,
        width: 32,
        height: 32,
        borderRadius: 8,
        background: '#FFFFFF',
    },
    enumIcon: {
        marginTop: 4,
        marginLeft: 4,
        width: 24,
        height: 24,
    },
    enumDialog: {
        overflow: 'hidden',
    },
    enumList: {
        minWidth: 250,
        height: 'calc(100% - 50px)',
        overflow: 'auto',
    },
    enumButton: {
        float: 'right',
    },
    enumCheckbox: {
        minWidth: 0,
    },
    buttonDiv: {
        display: 'flex',
        height: '100%',
        alignItems: 'center',
    },
    aclText: {
        fontSize: 13,
    },
    rightsObject: {
        color: '#55ff55',
        paddingLeft: 3,
    },
    rightsState: {
        color: '#86b6ff',
        paddingLeft: 3,
    },
    textCenter: {
        padding: 12,
        textAlign: 'center',
    },
    tooltipAccessControl: {
        display: 'flex',
        flexDirection: 'column',
    },
    fontSizeTitle: {
        '@media screen and (max-width: 465px)': {
            '& *': {
                fontSize: 12,
            },
        },
    },
    draggable: {
        cursor: 'copy',
    },
    nonDraggable: {
        cursor: 'no-drop',
    },
    selectClearButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        borderRadius: 5,
        backgroundColor: 'background.default',
    },
    iconDeviceConnected: (theme: IobTheme) => ({
        color:  theme.palette.mode === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 32,
        width: 20,
    }),
    iconDeviceDisconnected: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? COLOR_NAME_DISCONNECTED_DARK : COLOR_NAME_DISCONNECTED_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 32,
        width: 20,
    }),
    iconDeviceError: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? COLOR_NAME_ERROR_DARK : COLOR_NAME_ERROR_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 50,
        width: 20,
    }),
    resizeHandle: {
        display: 'block',
        position: 'absolute',
        cursor: 'col-resize',
        width: 7,
        top: 2,
        bottom: 2,
        zIndex: 1,
    },
    resizeHandleRight: {
        right: 3,
        borderRight: '2px dotted #888',
        '&:hover': {
            borderColor: '#ccc',
            borderRightStyle: 'solid',
        },
        '&.active': {
            borderColor: '#517ea5',
            borderRightStyle: 'solid',
        },
    },
    invertedBackground: (theme: IobTheme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#9a9a9a' : '#565656',
        padding: '0 3px',
        borderRadius: '2px 0 0 2px',
    }),
    invertedBackgroundFlex: (theme: IobTheme) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#9a9a9a' : '#565656',
        borderRadius: '0 2px 2px 0',
    }),
    contextMenuEdit: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#ffee48' : '#cbb801',
    }),
    contextMenuEditValue: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#5dff45' : '#1cd301',
    }),
    contextMenuView: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
    }),
    contextMenuCustom: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#42eaff' : '#01bbc2',
    }),
    contextMenuACL: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#e079ff' : '#500070',
    }),
    contextMenuRoom: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#ff9a33' : '#642a00',
    }),
    contextMenuRole: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#ffdb43' : '#562d00',
    }),
    contextMenuDelete: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#ff4f4f' : '#cf0000',
    }),
    contextMenuKeys: {
        marginLeft: 8,
        opacity: 0.7,
        fontSize: 'smaller',
    },
    contextMenuWithSubMenu: {
        display: 'flex',
    },
};

function getStyle(theme: IobTheme, ...args: any): Record<string, any> {
    const result: Record<string, any> = {};

    for (let a = 0; a < args.length; a++) {
        if (typeof args[a] === 'function') {
            Object.assign(result, args[a](theme));
        } else if (args[a] && typeof args[a] === 'object') {
            Object.keys(args[a]).forEach((attr: string) => {
                if (typeof args[a][attr] === 'function') {
                    result[attr] = args[a][attr](theme);
                } else if (typeof args[a][attr] === 'object') {
                    const obj = args[a][attr];
                    result[attr] = {};
                    Object.keys(obj).forEach((attr1: string) => {
                        if (typeof obj[attr1] === 'function') {
                            result[attr][attr1] = obj(theme);
                        } else if (obj[attr1] || obj[attr1] === 0) {
                            result[attr][attr1] = obj[attr1];
                        }
                    });
                } else if (args[a][attr] || args[a][attr] === 0) {
                    result[attr] = args[a][attr];
                }
            });
        }
    }

    return result;
}

/**
 * Function that walks through all keys of an object or array and applies a function to each key.
 */
function walkThroughArray(object: any[], iteratee: (result: any[], value: any, key: number) => void): any[] {
    const copiedObject: any[] = [];
    for (let index = 0; index < object.length; index++) {
        iteratee(copiedObject, object[index], index);
    }
    return copiedObject;
}
/**
 * Function that walks through all keys of an object or array and applies a function to each key.
 */
function walkThroughObject(object: Record<string, any>, iteratee: (result: Record<string, any>, value: any, key: string) => void): Record<string, any> {
    const copiedObject: Record<string, any> = {};
    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            iteratee(copiedObject, object[key], key);
        }
    }
    return copiedObject;
}

/**
 * Function to reduce an object primarily by a given list of keys
 */
function filterObject(
    /** The objects which should be filtered */
    obj: Record<string, any> | any[],
    /** The keys which should be excluded */
    filterKeys: string[],
    /** Whether translations should be reduced to only the english value */
    excludeTranslations?: boolean,
): Record<string, any> | any[] {
    if (Array.isArray(obj)) {
        return walkThroughArray(obj as any[], (result: any[], value: any, key: number) => {
            if (value === undefined || value === null) {
                return;
            }
            // if the key is an object, run it through the inner function - omitFromObject
            const isObject = typeof value === 'object';
            if (excludeTranslations && isObject) {
                if (typeof value.en === 'string' && typeof value.de === 'string') {
                    result[key] = value.en;
                    return;
                }
            }
            result[key] = isObject ? filterObject(value, filterKeys, excludeTranslations) : value;
        });
    }

    return walkThroughObject(obj, (result: Record<string, any>, value: any, key: string) => {
        if (value === undefined || value === null) {
            return;
        }
        if (filterKeys.includes(key)) {
            return;
        }
        // if the key is an object, run it through the inner function - omitFromObject
        const isObject = typeof value === 'object';
        if (excludeTranslations && isObject) {
            if (typeof value.en === 'string' && typeof value.de === 'string') {
                result[key] = value.en;
                return;
            }
        }
        result[key] = isObject ? filterObject(value, filterKeys, excludeTranslations) : value;
    });
}

/**
 * Function to generate a json-file for an object and trigger download it
 */
function generateFile(
    /** The desired filename */
    fileName: string,
    /** The objects which should be downloaded */
    obj: Record<string, ioBroker.Object>,
    /** Options to filter/reduce the output */
    options: {
        /**  Whether the output should be beautified */
        beautify?: boolean;
        /** Whether "system.repositories" should be excluded */
        excludeSystemRepositories?: boolean;
        /** Whether translations should be reduced to only the english value */
        excludeTranslations?: boolean;
    },
): void {
    const el = document.createElement('a');
    const filterKeys = [];
    if (options.excludeSystemRepositories) {
        filterKeys.push('system.repositories');
    }
    const filteredObject = filterKeys.length > 0 || options.excludeTranslations ? filterObject(obj, filterKeys, options.excludeTranslations) : obj;
    const data = options.beautify ? JSON.stringify(filteredObject, null, 2) : JSON.stringify(filteredObject);
    el.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`);
    el.setAttribute('download', fileName);

    el.style.display = 'none';
    document.body.appendChild(el);

    el.click();

    document.body.removeChild(el);
}

// d=data, t=target, s=start, e=end, m=middle
function binarySearch(list: string[], find: string, _start?: number, _end?: number): boolean {
    _start = _start || 0;
    if (_end === undefined) {
        _end = list.length - 1;
        if (!_end) {
            return list[0] === find;
        }
    }
    const middle = Math.floor((_start + _end) / 2);
    if (find === list[middle]) {
        return true;
    }
    if (_end - 1 === _start) {
        return list[_start] === find || list[_end] === find;
    }
    if (find > list[middle]) {
        return binarySearch(list, find, middle, _end);
    }
    if (find < list[middle]) {
        return binarySearch(list, find, _start, middle);
    }
    return false;
}

function getName(name: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
    if (name && typeof name === 'object') {
        return (name[lang] || name.en || '').toString();
    }

    return (name || '').toString();
}

export function getSelectIdIconFromObjects(
    objects: Record<string, ioBroker.Object>,
    id: string,
    imagePrefix?: string,
): string | React.JSX.Element | null {
    // `admin` has prefix '.' and `web` has '../..'
    imagePrefix = imagePrefix || '.'; // http://localhost:8081';
    let src: string | React.JSX.Element = '';
    const _id_ = `system.adapter.${id}`;
    const aIcon = id && objects[_id_] && objects[_id_].common && objects[_id_].common.icon;
    if (aIcon) {
        // if not BASE64
        if (!aIcon.startsWith('data:image/')) {
            if (aIcon.includes('.')) {
                src = `${imagePrefix}/adapter/${objects[_id_].common.name}/${aIcon}`;
            } else if (aIcon && aIcon.length < 3) {
                return aIcon; // utf-8
            } else {
                return null; // '<i class="material-icons iob-list-icon">' + objects[_id_].common.icon + '</i>';
            }
        } else if (aIcon.startsWith('data:image/svg')) {
            src = <SVG className="iconOwn" src={aIcon} width={28} height={28} />;
        } else {
            src = aIcon;
        }
    } else {
        const common = objects[id] && objects[id].common;

        if (common) {
            const cIcon = common.icon;
            if (cIcon) {
                if (!cIcon.startsWith('data:image/')) {
                    if (cIcon.includes('.')) {
                        let instance;
                        if (objects[id].type === 'instance' || objects[id].type === 'adapter') {
                            src = `${imagePrefix}/adapter/${common.name}/${cIcon}`;
                        } else if (id && id.startsWith('system.adapter.')) {
                            instance = id.split('.', 3);
                            if (cIcon[0] === '/') {
                                instance[2] += cIcon;
                            } else {
                                instance[2] += `/${cIcon}`;
                            }
                            src = `${imagePrefix}/adapter/${instance[2]}`;
                        } else {
                            instance = id.split('.', 2);
                            if (cIcon[0] === '/') {
                                instance[0] += cIcon;
                            } else {
                                instance[0] += `/${cIcon}`;
                            }
                            src = `${imagePrefix}/adapter/${instance[0]}`;
                        }
                    } else if (aIcon && aIcon.length < 3) {
                        return aIcon; // utf-8
                    } else {
                        return null;
                    }
                } else if (cIcon.startsWith('data:image/svg')) {
                    // if base 64 image
                    src = <SVG className="iconOwn" src={cIcon} width={28} height={28} />;
                } else {
                    src = cIcon;
                }
            }
        }
    }

    return src || null;
}

function applyFilter(
    item: TreeItem,
    filters: {
        id?: string;
        name?: string;
        type?: string;
        custom?: string;
        role?: string;
        room?: string;
        func?: string;
        expertMode?: boolean;
    },
    lang: ioBroker.Languages,
    objects: Record<string, ioBroker.Object>,
    context?: { id?: string; name?: string; type?: string; custom?: string; role?: string; room?: string[]; func?: string[] },
    counter?: { count: number },
    customFilter?: ObjectBrowserCustomFilter,
    selectedTypes?: string[],
    _depth?: number,
) {
    _depth = _depth || 0;
    let filteredOut = false;
    if (!context) {
        context = {};
        if (filters.id) {
            context.id = filters.id.toLowerCase();
        }
        if (filters.name) {
            context.name = filters.name.toLowerCase();
        }
        if (filters.type) {
            context.type = filters.type.toLowerCase();
        }
        if (filters.custom) {
            context.custom = filters.custom.toLowerCase();
        }
        if (filters.role) {
            context.role = filters.role.toLowerCase();
        }
        if (filters.room) {
            context.room = (objects[filters.room] as ioBroker.EnumObject)?.common?.members || [];
        }
        if (filters.func) {
            context.func = (objects[filters.func] as ioBroker.EnumObject)?.common?.members || [];
        }
    }

    const data = item.data;

    if (data && data.id) {
        const common: ioBroker.StateCommon = data.obj?.common as ioBroker.StateCommon;

        if (customFilter) {
            if (customFilter.type) {
                if (typeof customFilter.type === 'string') {
                    if (!data.obj || customFilter.type !== data.obj.type) {
                        filteredOut = true;
                    }
                } else if (Array.isArray(customFilter.type)) {
                    if (!data.obj || !customFilter.type.includes(data.obj.type)) {
                        filteredOut = true;
                    }
                }
            }
            if (!filteredOut && customFilter.common?.type) {
                if (!common?.type) {
                    filteredOut = true;
                } else if (typeof customFilter.common.type === 'string') {
                    if (customFilter.common.type !== common.type) {
                        filteredOut = true;
                    }
                } else if (Array.isArray(customFilter.common.type)) {
                    if (!customFilter.common.type.includes(common.type)) {
                        filteredOut = true;
                    }
                }
            }
            if (!filteredOut && customFilter.common?.role) {
                if (!common?.role) {
                    filteredOut = true;
                } else if (typeof customFilter.common.role === 'string') {
                    if (common.role.startsWith(customFilter.common.role)) {
                        filteredOut = true;
                    }
                } else if (Array.isArray(customFilter.common.role)) {
                    if (!customFilter.common.role.find(role => common.role.startsWith(role))) {
                        filteredOut = true;
                    }
                }
            }

            if (!filteredOut && customFilter.common?.custom === '_' && common?.custom) {
                filteredOut = true;
            } else if (!filteredOut && customFilter.common?.custom && customFilter.common?.custom !== '_') {
                const filterOfCustom = customFilter.common.custom as string | string[] | boolean;
                if (!common?.custom) {
                    filteredOut = true;
                } else if (filterOfCustom === '_dataSources') {
                    // TODO: make it configurable
                    if (
                        !Object.keys(common.custom).find(
                            id => id.startsWith('history.') || id.startsWith('sql.') || id.startsWith('influxdb.'),
                        )
                    ) {
                        filteredOut = true;
                    }
                } else if (Array.isArray(filterOfCustom)) { // here are ['influxdb.', 'telegram.']
                    const customs = Object.keys(common.custom); // here are ['influxdb.0', 'telegram.2']
                    if (filterOfCustom.find(cst => customs.find(id => id.startsWith(cst)))) {
                        filteredOut = true;
                    }
                } else if (
                    filterOfCustom !== true &&
                    !Object.keys(common.custom).find(id => id.startsWith(filterOfCustom as string))
                ) {
                    filteredOut = true;
                }
            }
        }

        if (!filteredOut && !filters.expertMode) {
            filteredOut =
                data.id === 'system' ||
                data.id === 'enum' ||
                // (data.obj && data.obj.type === 'meta') ||
                data.id.startsWith('system.') ||
                data.id.startsWith('enum.') ||
                data.id.startsWith('_design/') ||
                data.id.endsWith('.admin') ||
                !!common?.expert;
        }
        if (!filteredOut && context.id) {
            if (data.fID === undefined) {
                data.fID = data.id.toLowerCase();
            }
            filteredOut = !data.fID.includes(context.id);
        }
        if (!filteredOut && context.name) {
            if (common) {
                if (data.fName === undefined) {
                    data.fName = (common && getName(common.name, lang)) || '';
                    data.fName = data.fName.toLowerCase();
                }
                filteredOut = !data.fName.includes(context.name);
            } else {
                filteredOut = true;
            }
        }
        if (!filteredOut && filters.role && common) {
            if (common) {
                filteredOut = !(common.role && common.role.startsWith(context.role as string));
            } else {
                filteredOut = true;
            }
        }
        if (!filteredOut && context.room) {
            filteredOut = !context.room.find(id => id === data.id || data.id.startsWith(`${id}.`));
        }
        if (!filteredOut && context.func) {
            filteredOut = !context.func.find(id => id === data.id || data.id.startsWith(`${id}.`));
        }
        if (!filteredOut && context.type) {
            filteredOut = !(data.obj && data.obj.type && data.obj.type === context.type);
        }
        if (!filteredOut && selectedTypes) {
            filteredOut = !(data.obj && data.obj.type && selectedTypes.includes(data.obj.type));
        }
        if (!filteredOut && context.custom) {
            if (common) {
                if (context.custom === '_') {
                    filteredOut = !!common.custom;
                } else {
                    filteredOut = !common.custom || !common.custom[context.custom];
                }
            } else {
                filteredOut = true;
            }
        }
    }

    data.visible = !filteredOut;

    data.hasVisibleChildren = false;
    if (item.children && _depth < 20) {
        item.children.forEach(_item => {
            const visible = applyFilter(
                _item,
                filters,
                lang,
                objects,
                context,
                counter,
                customFilter,
                selectedTypes,
                _depth + 1,
            );
            if (visible) {
                data.hasVisibleChildren = true;
            }
        });
    }

    // const visible = data.visible || data.hasVisibleChildren;
    data.sumVisibility = data.visible || data.hasVisibleChildren; // || data.hasVisibleParent;
    if (counter && data.sumVisibility) {
        counter.count++;
    }

    // show all children of visible object with opacity 0.5
    if (data.id && data.sumVisibility && item.children) {
        item.children.forEach(_item => (_item.data.hasVisibleParent = true));
    }

    return data.visible || data.hasVisibleChildren;
}

function getVisibleItems(
    item: TreeItem,
    type: ioBroker.ObjectType,
    objects: Record<string, ioBroker.Object>,
    _result?: string[],
): string[] {
    _result = _result || [];
    const data = item.data;
    if (data.sumVisibility) {
        data.id && objects[data.id] && (!type || objects[data.id].type === type) && _result.push(data.id);
        item.children?.forEach(_item =>
            getVisibleItems(_item, type, objects, _result));
    }

    return _result;
}

function getSystemIcon(
    objects: Record<string, ioBroker.Object>,
    id: string,
    level: number,
    themeType: ThemeType,
    imagePrefix?: string,
): string | React.JSX.Element | null {
    let icon;

    // system or design has special icons
    if (id === 'alias' || id === 'alias.0') {
        icon = <IconLink className="iconOwn" style={{ color: COLOR_NAME_ALIAS(themeType) }} />;
    } else if (id === '0_userdata' || id === '0_userdata.0') {
        icon = <IconData className="iconOwn" style={{ color: COLOR_NAME_USERDATA(themeType) }} />;
    } else if (id.startsWith('_design/') || id === 'system') {
        icon = <IconSystem className="iconOwn" style={{ color: COLOR_NAME_SYSTEM(themeType) }} />;
    } else if (id === 'system.adapter') {
        icon = <IconSystem className="iconOwn" style={{ color: COLOR_NAME_SYSTEM_ADAPTER(themeType) }} />;
    } else if (id === 'system.group') {
        icon = <IconGroup className="iconOwn" />;
    } else if (id === 'system.user') {
        icon = <IconUser className="iconOwn" />;
    } else if (id === 'system.host') {
        icon = <IconHost className="iconOwn" />;
    } else if (id.endsWith('.connection') || id.endsWith('.connected')) {
        icon = <IconConnection className="iconOwn" />;
    } else if (id.endsWith('.info')) {
        icon = <IconInfo className="iconOwn" />;
    } else if (objects[id] && objects[id].type === 'meta') {
        icon = <IconMeta className="iconOwn" />;
    } else if (level < 2) {
        // detect "cloud.0"
        if (objects[`system.adapter.${id}`]) {
            icon = getSelectIdIconFromObjects(objects, `system.adapter.${id}`, imagePrefix);
        }
    }

    return icon || null;
}

function getObjectTooltip(
    data: TreeItemData,
    lang: ioBroker.Languages,
): string | null {
    if (data?.obj?.common?.desc) {
        return getName(data.obj.common.desc, lang) || null;
    }

    return null;
}

function getIdFieldTooltip(
    data: TreeItemData,
    lang: ioBroker.Languages,
) {
    const tooltip = getObjectTooltip(data, lang);
    if (tooltip?.startsWith('http')) {
        return <Box
            component="a"
            sx={styles.cellIdTooltipLink}
            href={tooltip}
            target="_blank"
            rel="noreferrer"
        >
            {tooltip}
        </Box>;
    }
    return <span style={styles.cellIdTooltip}>{tooltip || data.id || ''}</span>;
}

function buildTree(
    objects: Record<string, ioBroker.Object>,
    options: {
        imagePrefix?: string;
        root?: string;
        lang: ioBroker.Languages;
        themeType: ThemeType;
    },
): { root: TreeItem; info: TreeInfo } {
    const imagePrefix = options.imagePrefix || '.';

    let ids = Object.keys(objects);

    ids.sort((a, b) => {
        if (a === b) {
            return 0;
        }
        a = a.replace(/\./g, '!!!');
        b = b.replace(/\./g, '!!!');
        if (a > b) {
            return 1;
        }
        return -1;
    });

    if (options.root) {
        ids = ids.filter(id => id === options.root || id.startsWith(`${options.root}.`));
    }

    // find empty nodes and create names for it
    let currentPathArr: string[] = [];
    let currentPath = '';
    let currentPathLen = 0;
    const root: TreeItem = {
        data: {
            name: '',
            id: '',
        },
        children: [],
    };

    const info: TreeInfo = {
        funcEnums: [],
        roomEnums: [],
        roles:     [],
        ids:       [],
        types:     [],
        objects,
        customs:   ['_'],
        enums:     [],
        hasSomeCustoms: false,
    };

    let cRoot: TreeItem = root;

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!id) {
            continue;
        }
        const obj = objects[id];
        const parts = id.split('.');

        if (obj.type && !info.types.includes(obj.type)) {
            info.types.push(obj.type);
        }

        if (obj) {
            const common = obj.common;
            const role = common && common.role;
            if (role && !info.roles.includes(role)) {
                info.roles.push(role);
            } else if (id.startsWith('enum.rooms.')) {
                info.roomEnums.push(id);
                info.enums.push(id);
            } else if (id.startsWith('enum.functions.')) {
                info.funcEnums.push(id);
                info.enums.push(id);
            } else if (obj.type === 'enum') {
                info.enums.push(id);
            } else if (obj.type === 'instance' && common && (common.supportCustoms || common.adminUI?.custom)) {
                info.hasSomeCustoms = true;
                info.customs.push(id.substring('system.adapter.'.length));
            }
        }

        info.ids.push(id);

        let repeat;

        // if next level
        do {
            repeat = false;

            // If the current level is still OK, and we can add ID to children
            if (!currentPath || id.startsWith(`${currentPath}.`)) {
                // if more than one level added
                if (parts.length - currentPathLen > 1) {
                    let curPath = currentPath;
                    // generate missing levels
                    for (let k = currentPathLen; k < parts.length - 1; k++) {
                        curPath += (curPath ? '.' : '') + parts[k];
                        // level does not exist
                        if (!binarySearch(info.ids, curPath)) {
                            const _cRoot: TreeItem = {
                                data: {
                                    name:      parts[k],
                                    parent:    cRoot,
                                    id:        curPath,
                                    obj:       objects[curPath],
                                    level:     k,
                                    icon:      getSystemIcon(objects, curPath, k, options.themeType, imagePrefix),
                                    generated: true,
                                },
                            };

                            cRoot.children = cRoot.children || [];
                            cRoot.children.push(_cRoot);
                            cRoot = _cRoot;
                            info.ids.push(curPath); // IDs will be added by alphabet
                        } else if (cRoot.children) {
                            cRoot = cRoot.children.find(item => item.data.name === parts[k]) as TreeItem;
                        }
                    }
                }

                const _cRoot: TreeItem = {
                    data: {
                        name:       parts[parts.length - 1],
                        title:      getName(obj?.common?.name, options.lang),
                        obj,
                        parent:     cRoot,
                        icon:       getSelectIdIconFromObjects(objects, id, imagePrefix) ||
                            getSystemIcon(objects, id, 0, options.themeType, imagePrefix),
                        id,
                        hasCustoms: !!(obj.common?.custom && Object.keys(obj.common.custom).length),
                        level:      parts.length - 1,
                        generated:  false,
                        button:     obj.type === 'state' &&
                                    !!obj.common?.role &&
                                    typeof obj.common.role === 'string' &&
                                    obj.common.role.startsWith('button') &&
                                    obj.common?.write !== false,
                    },
                };

                cRoot.children = cRoot.children || [];
                cRoot.children.push(_cRoot);
                cRoot = _cRoot;

                currentPathLen = parts.length;
                currentPathArr = parts;
                currentPath = id;
            } else {
                let u = 0;

                while (currentPathArr[u] === parts[u]) {
                    u++;
                }

                if (u > 0) {
                    let move = currentPathArr.length;
                    currentPathArr = currentPathArr.splice(0, u);
                    currentPathLen = u;
                    currentPath = currentPathArr.join('.');
                    while (move > u) {
                        if (cRoot.data.parent) {
                            cRoot = cRoot.data.parent;
                        } else {
                            console.error(`Parent is null for ${id} ${currentPath} ${currentPathArr.join('.')}`);
                        }
                        move--;
                    }
                } else {
                    cRoot = root;
                    currentPathArr = [];
                    currentPath = '';
                    currentPathLen = 0;
                }
                repeat = true;
            }
        } while (repeat);
    }

    info.roomEnums.sort((a, b) => {
        const aName: string = getName(objects[a]?.common?.name, options.lang) || a.split('.').pop() as string;
        const bName: string = getName(objects[b]?.common?.name, options.lang) || b.split('.').pop() as string;
        if (aName > bName) {
            return 1;
        }
        if (aName < bName) {
            return -1;
        }
        return 0;
    });
    info.funcEnums.sort((a, b) => {
        const aName: string = getName(objects[a]?.common?.name, options.lang) || a.split('.').pop() as string;
        const bName: string = getName(objects[b]?.common?.name, options.lang) || b.split('.').pop() as string;
        if (aName > bName) {
            return 1;
        }
        if (aName < bName) {
            return -1;
        }
        return 0;
    });
    info.roles.sort();
    info.types.sort();

    return { info, root };
}

function findNode(
    root: TreeItem,
    id: string,
    _parts?: string[],
    _path?: string,
    _level?: number,
): TreeItem | null {
    if (root.data.id === id) {
        return root;
    }
    if (!_parts) {
        _parts = id.split('.');
        _level = 0;
        _path = _parts[_level];
    }
    if (!root.children && root.data.id !== id) {
        return null;
    }
    let found;
    if (root.children) {
        for (let i = 0; i < root.children.length; i++) {
            const _id = root.children[i].data.id;
            if (_id === _path) {
                found = root.children[i];
                break;
            } else if (_id > (_path as string)) {
                break;
            }
        }
    }
    if (found) {
        _level = _level || 0;
        return findNode(found, id, _parts, `${_path}.${_parts[_level + 1]}`, _level + 1);
    }

    return null;
}

function findRoomsForObject(
    info: TreeInfo,
    id: string,
    lang: ioBroker.Languages,
    rooms?: string[],
): { rooms: string[]; per: boolean } {
    if (!id) {
        return { rooms: [], per: false };
    }
    rooms = rooms || [];
    for (const room of info.roomEnums) {
        const common = info.objects[room]?.common;

        if (!common) {
            continue;
        }

        const name = getName(common.name, lang);

        if (common.members?.includes(id) && !rooms.includes(name)) {
            rooms.push(name);
        }
    }

    let ownEnums;

    // Check parent
    const parts = id.split('.');
    parts.pop();
    id = parts.join('.');
    if (info.objects[id]) {
        ownEnums = rooms.length;
        findRoomsForObject(info, id, lang, rooms);
    }

    return { rooms, per: !ownEnums }; // per is if the enums are from parent
}

function findEnumsForObjectAsIds(
    info: TreeInfo,
    id: string,
    enumName: 'roomEnums' | 'funcEnums',
    funcs?: string[],
) {
    if (!id) {
        return [];
    }
    funcs = funcs || [];
    for (let i = 0; i < info[enumName].length; i++) {
        const common = info.objects[info[enumName][i]]?.common;
        if (common?.members?.includes(id) && !funcs.includes(info[enumName][i])) {
            funcs.push(info[enumName][i]);
        }
    }
    funcs.sort();

    return funcs;
}

function findFunctionsForObject(
    info: TreeInfo,
    id: string,
    lang: ioBroker.Languages,
    funcs?: string[],
): { funcs: string[]; pef: boolean } {
    if (!id) {
        return { funcs: [], pef: false };
    }
    funcs = funcs || [];
    for (let i = 0; i < info.funcEnums.length; i++) {
        const common = info.objects[info.funcEnums[i]]?.common;

        if (!common) {
            continue;
        }

        const name = getName(common.name, lang);
        if (common.members?.includes(id) && !funcs.includes(name)) {
            funcs.push(name);
        }
    }

    let ownEnums;

    // Check parent
    const parts = id.split('.');
    parts.pop();
    id = parts.join('.');
    if (info.objects[id]) {
        ownEnums = funcs.length;
        findFunctionsForObject(info, id, lang, funcs);
    }

    return { funcs, pef: !ownEnums };
}

/*
function quality2text(q) {
    if (!q) {
        return 'ok';
    }
    const custom = q & 0xFFFF0000;
    let text = '';
    if (q & 0x40) text += 'device';
    if (q & 0x80) text += 'sensor';
    if (q & 0x01) text += ' bad';
    if (q & 0x02) text += ' not connected';
    if (q & 0x04) text += ' error';

    return text + (custom ? '|0x' + (custom >> 16).toString(16).toUpperCase() : '') + ' [0x' + q.toString(16).toUpperCase() + ']';
}
*/

/**
 * Format a state value for visualization
 */
function formatValue(
    options: FormatValueOptions,
): {
    valText: {
        /** value as string */
        v: string;
        /** value unit */
        u?: string;
        /** value not replaced by `common.states` */
        s?: string;
    };
    valFull: {
        /** label */
        t: string;
        /** value */
        v: string;
        /** no break */
        nbr?: boolean;
    }[] | undefined;
    fileViewer: 'image' | 'text' | 'json' | 'html' | 'pdf' | 'audio' | 'video' | undefined;
} {
    const {
        dateFormat, state, isFloatComma, texts, obj,
    } = options;
    const states = Utils.getStates(obj);
    const isCommon = obj.common;
    let fileViewer: 'image' | 'text' | 'json' | 'html' | 'pdf' | 'audio' | 'video' | undefined;

    let v: any =
        // @ts-expect-error deprecated from js-controller 6
        isCommon?.type === 'file'
            ? '[file]'
            : !state || state.val === null
                ? '(null)'
                : state.val === undefined
                    ? '[undef]'
                    : state.val;

    const type = typeof v;

    if (isCommon?.role && typeof isCommon.role === 'string' && isCommon.role.match(/^value\.time|^date/)) {
        if (v && typeof v === 'string') {
            if (Utils.isStringInteger(v)) {
                // we assume a unix ts
                v = new Date(parseInt(v, 10)).toString();
            } else {
                // check if parsable by new date
                try {
                    const parsedDate = new Date(v);

                    if (Utils.isValidDate(parsedDate)) {
                        v = parsedDate.toString();
                    }
                } catch {
                    // ignore
                }
            }
        } else {
            if (v > 946681200 && v < 946681200000) {
                // '2000-01-01T00:00:00' => 946681200000
                v *= 1_000; // maybe the time is in seconds (UNIX time)
            }
            // "null" and undefined could not be here. See `let v = (isCommon && isCommon.type === 'file') ....` above
            v = v ? new Date(v).toString() : v;
        }
    } else {
        if (type === 'number') {
            if (!Number.isInteger(v)) {
                v = Math.round(v * 100_000_000) / 100_000_000; // remove 4.00000000000000001
                if (isFloatComma) {
                    v = v.toString().replace('.', ',');
                }
            }
        } else if (type === 'object') {
            v = JSON.stringify(v);
        } else if (type !== 'string') {
            v = v.toString();
        } else if (v.startsWith('data:image/')) {
            fileViewer = 'image';
        }

        if (typeof v !== 'string') {
            v = v.toString();
        }
    }

    const valText: {
        /** value as string */
        v: string;
        /** value unit */
        u?: string;
        /** value not replaced by `common.states` */
        s?: string;
    } = { v: v as string };

    // try to replace number with "common.states"
    if (states && states[v] !== undefined) {
        if (v !== states[v]) {
            valText.s = v;
            v = states[v];
            valText.v = v;
        }
    }

    if (isCommon?.unit) {
        valText.u = isCommon.unit;
    }
    let valFull: {
        /** label */
        t: string;
        /** value */
        v: string;
        nbr?: boolean;
    }[] | undefined;
    if (options.full) {
        valFull = [{ t: texts.value, v }];

        if (state) {
            if (state.ack !== undefined && state.ack !== null) {
                valFull.push({ t: texts.ack, v: state.ack.toString() });
            }
            if (state.ts) {
                valFull.push({ t: texts.ts, v: state.ts ? Utils.formatDate(new Date(state.ts), dateFormat) : '' });
            }
            if (state.lc) {
                valFull.push({ t: texts.lc, v: state.lc ? Utils.formatDate(new Date(state.lc), dateFormat) : '' });
            }
            if (state.from) {
                let from = state.from.toString();
                if (from.startsWith('system.adapter.')) {
                    from = from.substring(15);
                }
                valFull.push({ t: texts.from, v: from });
            }
            if (state.user) {
                let user = state.user.toString();
                if (user.startsWith('system.user.')) {
                    user = user.substring(12);
                }
                valFull.push({ t: texts.user, v: user });
            }
            if (state.c) {
                valFull.push({ t: texts.c, v: state.c });
            }
            valFull.push({ t: texts.quality, v: Utils.quality2text(state.q || 0).join(', '), nbr: true });
        }
    }

    return {
        valText,
        valFull,
        fileViewer,
    };
}

/**
 * Get css style for given state value
 */
function getValueStyle(options: GetValueStyleOptions): { color: string } {
    const { state, isExpertMode, isButton } = options;
    let color = state?.ack ? (state.q ? '#ffa500' : '') : '#ff2222c9';

    if (!isExpertMode && isButton) {
        color = '';
    }

    return { color };
}

function prepareSparkData(
    values: ioBroker.GetHistoryResult,
    from: number,
): number[] {
    // set one point every hour
    let time = from;
    let i = 1;
    const v = [];

    while (i < values.length && time < from + 25 * 3600000) {
        // find the interval
        while (values[i - 1].ts < time && time <= values[i].ts && i < values.length) {
            i++;
        }
        if (i === 1 && values[i - 1].ts >= time) {
            // assume the value was always null
            v.push(0);
        } else if (i < values.length) {
            if (typeof values[i].val === 'boolean' || typeof values[i - 1].val === 'boolean') {
                v.push(values[i].val ? 1 : 0);
            } else {
                // remove nulls
                values[i - 1].val = values[i - 1].val || 0;
                values[i].val = values[i].val || 0;
                // interpolate
                const nm1: number = values[i - 1].val as number;
                const n: number = values[i].val as number;
                const val = nm1 + ((n - nm1) * (time - values[i - 1].ts)) / (values[i].ts - values[i - 1].ts);

                v.push(val);
            }
        }

        time += 3600000;
    }

    return v;
}

export const ITEM_IMAGES: Record<string, React.JSX.Element> = {
    state: <IconState className="itemIcon" />,
    channel: <IconChannel className="itemIcon" />,
    device: <IconDevice className="itemIcon" />,
    adapter: <IconAdapter className="itemIcon" />,
    meta: <IconMeta className="itemIcon" />,
    instance: <IconInstance className="itemIcon" style={{ color: '#7da7ff' }} />,
    enum: <IconEnum className="itemIcon" />,
    chart: <IconChart className="itemIcon" />,
    config: <IconConfig className="itemIcon" />,
    group: <IconGroup className="itemIcon" />,
    user: <IconUser className="itemIcon" />,
    host: <IconHost className="itemIcon" />,
    schedule: <IconSchedule className="itemIcon" />,
    script: <IconScript className="itemIcon" />,
    folder: <IconClosed className="itemIcon itemIconFolder" />,
};

interface ScreenWidthOne {
    idWidth: string | number;
    widths: {
        room?: number;
        val?: number;
        name?: number;
        func?: number;
        buttons?: number;
        type?: number;
        role?: number;
        changedFrom?: number;
        qualityCode?: number;
        timestamp?: number;
        lastChange?: number;
    };
    fields: string[];
}

interface ScreenWidth {
    xs: ScreenWidthOne;
    sm: ScreenWidthOne;
    md: ScreenWidthOne;
    lg: ScreenWidthOne;
    xl: ScreenWidthOne;
}

const SCREEN_WIDTHS: ScreenWidth = {
    // extra-small: 0px
    xs: { idWidth: '100%', fields: [], widths: {} },
    // small: 600px
    sm: { idWidth: 300, fields: ['room', 'val'], widths: { room: 100, val: 200 } },
    // medium: 960px
    md: {
        idWidth: 300,
        fields: ['room', 'func', 'val', 'buttons'],
        widths: {
            name: 200,
            room: 150,
            func: 150,
            val: 120,
            buttons: 120,

        },
    },
    // large: 1280px
    lg: {
        idWidth: 300,
        fields: [
            'name',
            'type',
            'role',
            'room',
            'func',
            'val',
            'buttons',
            'changedFrom',
            'qualityCode',
            'timestamp',
            'lastChange',
        ],
        widths: {
            name: 300,
            type: 80,
            role: 120,
            room: 180,
            func: 180,
            val: 140,
            buttons: 120,
            changedFrom: 120,
            qualityCode: 100,
            timestamp: 165,
            lastChange: 165,
        },
    },
    // /////////////
    // extra-large: 1920px
    xl: {
        idWidth: 550,
        fields: [
            'name',
            'type',
            'role',
            'room',
            'func',
            'val',
            'buttons',
            'changedFrom',
            'qualityCode',
            'timestamp',
            'lastChange',
        ],
        widths: {
            name: 400,
            type: 80,
            role: 120,
            room: 180,
            func: 180,
            val: 140,
            buttons: 120,
            changedFrom: 120,
            qualityCode: 100,
            timestamp: 170,
            lastChange: 170,
        },
    },
};

let objectsAlreadyLoaded = false;

export interface ObjectBrowserFilter {
    id?: string;
    name?: string;
    room?: string;
    func?: string;
    role?: string;
    type?: string;
    custom?: string;
    expertMode?: boolean;
}

const DEFAULT_FILTER: ObjectBrowserFilter = {
    id: '',
    name: '',
    room: '',
    func: '',
    role: '',
    type: '',
    custom: '',
    expertMode: false,
};

interface AdapterColumn {
    adapter: string;
    id: string;
    name: string;
    path: string[];
    pathText: string;
    edit?: boolean;
    type?: 'boolean' | 'string' | 'number';
    objTypes?: ioBroker.ObjectType[];
    align?: 'center' | 'left' | 'right';
}

interface ObjectBrowserEditRoleProps {
    roles: string[];
    id: string;
    socket: Connection;
    onClose: (obj?: ioBroker.Object | null) => void;
    t: Translate;
}

interface ObjectViewFileDialogProps {
    t: Translate;
    socket: Connection;
    obj: ioBroker.AnyObject;
    onClose: () => void;
}

interface DragWrapperProps {
    item: TreeItem;
    className?: string;
    style?: React.CSSProperties;
    children: React.JSX.Element | null;
}

interface ObjectCustomDialogProps {
    t: Translate;
    lang: ioBroker.Languages;
    expertMode?: boolean;
    objects: Record<string, ioBroker.Object>;
    socket: Connection;
    theme: IobTheme;
    themeName: ThemeName;
    themeType: ThemeType;
    customsInstances: string[];
    objectIDs: string[];
    onClose: () => void;
    reportChangedIds: (ids: string[]) => void;
    isFloatComma: boolean;
    allVisibleObjects: boolean;
    systemConfig: ioBroker.SystemConfigObject;
}

interface ObjectBrowserValueProps {
    /** State type */
    type: 'states' | 'string' | 'number' | 'boolean' | 'json';
    /** State role */
    role: string;
    /** common.states */
    states: Record<string, string> | null;
    /** The state value */
    value: string | number | boolean | null;
    /** If expert mode is enabled */
    expertMode: boolean;
    onClose: (newValue?: {
        val: ioBroker.StateValue;
        ack: boolean;
        q: ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY];
        expire: number | undefined;
    }) => void;
    /** Configured theme */
    themeType: ThemeType;
    socket: Connection;
    defaultHistory: string;
    dateFormat: string;
    object: ioBroker.StateObject;
    isFloatComma: boolean;
    t: Translate;
    lang: ioBroker.Languages;
}

interface ObjectBrowserEditObjectProps {
    socket: Connection;
    obj: ioBroker.AnyObject;
    roleArray: string[];
    expertMode: boolean;
    themeType: ThemeType;
    aliasTab: boolean;
    onClose: (obj?: ioBroker.AnyObject) => void;
    dialogName?: string;
    objects: Record<string, ioBroker.AnyObject>;
    dateFormat: string;
    isFloatComma: boolean;
    onNewObject: (obj: ioBroker.AnyObject) => void;
    t: Translate;
}

interface ObjectAliasEditorProps {
    t: Translate;
    socket: Connection;
    objects: Record<string, ioBroker.AnyObject>;
    onRedirect: (id: string, delay?: number) => void;
    obj: ioBroker.AnyObject;
    onClose: () => void;
}

interface ObjectBrowserProps {
    /** where to store settings in localStorage */
    dialogName?: string;
    defaultFilters?: ObjectBrowserFilter;
    selected?: string | string[];
    onSelect?: (selected: string | string[], name: string, isDouble?: boolean) => void;
    onFilterChanged?: (newFilter: ObjectBrowserFilter) => void;
    socket: Connection;
    showExpertButton?: boolean;
    expertMode?: boolean;
    imagePrefix?: string;
    themeName: ThemeName;
    themeType: ThemeType;
    /** will be filled by withWidth */
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    theme: IobTheme;
    t: Translate;
    lang: ioBroker.Languages;
    multiSelect?: boolean;
    notEditable?: boolean;
    foldersFirst?: boolean;
    disableColumnSelector?: boolean;
    isFloatComma?: boolean;
    dateFormat?: string;
    levelPadding?: number;

    // components
    objectCustomDialog?: React.FC<ObjectCustomDialogProps>;
    objectAddBoolean?: boolean;   // optional toolbar button
    objectEditBoolean?: boolean;  // optional toolbar button
    objectStatesView?: boolean;   // optional toolbar button
    objectImportExport?: boolean; // optional toolbar button
    objectEditOfAccessControl?: boolean; // Access Control
    /** modal add object */
    // eslint-disable-next-line no-use-before-define
    modalNewObject?: (oBrowser: ObjectBrowserClass) => React.JSX.Element;
    /** modal Edit Of Access Control */
    // eslint-disable-next-line no-use-before-define
    modalEditOfAccessControl: (oBrowser: ObjectBrowserClass, data: TreeItemData) => React.JSX.Element;
    onObjectDelete?: (id: string, hasChildren: boolean, objectExists: boolean, childrenCount: number) => void;
    /** optional filter
     *   `{common: {custom: true}}` - show only objects with some custom settings
     *   `{common: {custom: 'sql.0'}}` - show only objects with sql.0 custom settings (only of the specific instance)
     *   `{common: {custom: '_dataSources'}}` - show only objects of adapters `influxdb' or 'sql' or 'history'
     *   `{common: {custom: 'adapterName.'}}` - show only objects of custom settings of specific adapter (all instances)
     *   `{type: 'channel'}` - show only channels
     *   `{type: ['channel', 'device']}` - show only channels and devices
     *   `{common: {type: 'number'}` - show only states of type 'number
     *   `{common: {type: ['number', 'string']}` - show only states of type 'number and string
     *   `{common: {role: ['switch']}` - show only states with roles starting from switch
     *   `{common: {role: ['switch', 'button']}` - show only states with roles starting from `switch` and `button`
     */
    customFilter: ObjectBrowserCustomFilter;
    objectBrowserValue?: React.FC<ObjectBrowserValueProps>;
    objectBrowserEditObject?: React.FC<ObjectBrowserEditObjectProps>;
    /** on edit alias */
    objectBrowserAliasEditor?: React.FC<ObjectAliasEditorProps>;
    /** on Edit role */
    objectBrowserEditRole?: React.FC<ObjectBrowserEditRoleProps>;
    /** on view file state */
    objectBrowserViewFile?: React.FC<ObjectViewFileDialogProps>;
    router?: typeof Router;
    types?: ioBroker.ObjectType[];
    /** Possible columns: ['name', 'type', 'role', 'room', 'func', 'val', 'buttons'] */
    columns?: string[];
    /** Shows only elements of this root */
    root?: string;

    /** cache of objects */
    objectsWorker?: ObjectsWorker;
    /** function to filter out all unnecessary objects. It cannot be used together with "types"
     * Example for function: `obj => obj.common?.type === 'boolean'` to show only boolean states
     * */
    filterFunc?: (obj: ioBroker.Object) => boolean;
    /** Used for enums dragging */
    DragWrapper?: React.FC<DragWrapperProps>;
    /** let DragWrapper know about objects to get the icons */
    setObjectsReference?: (objects: Record<string, ioBroker.Object>) => void;
    dragEnabled?: boolean;
}

interface ObjectBrowserState {
    loaded: boolean;
    foldersFirst: boolean;
    selected: string[];
    selectedNonObject: string;
    filter: ObjectBrowserFilter;
    filterKey: number;
    depth: number;
    expandAllVisible: boolean;
    expanded: string[];
    toast: string;
    scrollBarWidth: number;
    customDialog: null | string[];
    customDialogAll?: boolean;
    editObjectDialog: string;
    editObjectAlias: boolean; // open the edit object dialog on alias tab
    viewFileDialog: string;
    showAliasEditor: string;
    enumDialog: null | {
        item: TreeItem;
        type: 'room' | 'func';
        enumsOriginal: string;
    };
    enumDialogEnums?: null | string[];
    roleDialog: null | string;
    statesView: boolean;
    /** ['name', 'type', 'role', 'room', 'func', 'val', 'buttons'] */
    columns: string[] | null;
    columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null;
    columnsSelectorShow: boolean;
    columnsAuto: boolean;
    columnsWidths: Record<string, number>;
    columnsDialogTransparent: number;
    columnsEditCustomDialog: null | {
        obj: ioBroker.Object;
        item: TreeItem;
        it: AdapterColumn;
    };
    customColumnDialogValueChanged: boolean;
    showExportDialog: false | number;
    showAllExportOptions: boolean;
    linesEnabled: boolean;
    showDescription: boolean;
    showContextMenu: { item: TreeItem; subItem?: string; subAnchor?: HTMLLIElement } | null;
    noStatesByExportImport: boolean;
    beautifyJsonExport: boolean;
    excludeSystemRepositoriesFromExport: boolean;
    excludeTranslations: boolean;
    updating?: boolean;
    modalNewObj?: null | { id: string; initialType?: ioBroker.ObjectType; initialStateType?: ioBroker.CommonType };
    error?: undefined | any;
    modalEditOfAccess?: boolean;
    modalEditOfAccessObjData?: TreeItemData;
    updateOpened?: boolean;
    tooltipInfo: null | { el: React.JSX.Element[]; id: string };
}

export class ObjectBrowserClass extends Component<ObjectBrowserProps, ObjectBrowserState> {
    // do not define the type as null to save the performance, so we must check it every time
    private info: TreeInfo;

    private localStorage: Storage = (window as any)._localStorage as Storage || window.localStorage;

    private lastSelectedItems: string[];

    private lastAppliedFilter: string | null = null;

    private readonly tableRef: React.RefObject<HTMLDivElement>;

    private readonly filterRefs: Record<string, React.RefObject<HTMLSelectElement>>;

    private pausedSubscribes: boolean = false;

    private selectedFound: boolean = false;

    private root: TreeItem | null = null;

    private readonly states: Record<string, ioBroker.State> = {};

    private subscribes: string[] = [];

    private unsubscribeTimer: ReturnType<typeof setTimeout> | null = null;

    private statesUpdateTimer: ReturnType<typeof setTimeout> | null = null;

    private objectsUpdateTimer: ReturnType<typeof setTimeout> | null = null;

    private filterTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly visibleCols: string[];

    private readonly texts: Record<string, string>;

    private readonly possibleCols: string[];

    private readonly imagePrefix: string;

    private adapterColumns: AdapterColumn[] = [];

    private styleTheme: string = '';

    private edit: {
        val: string | number | boolean | null;
        q: number;
        ack: boolean;
        id: string;
    } = {
            id: '',
            val: '',
            q: 0,
            ack: false,
        };

    private readonly levelPadding: number;

    private customWidth: boolean = false;

    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    private resizerNextName: string | null = null;

    private resizerActiveName: string | null = null;

    private resizerCurrentWidths: Record<string, number> = {};

    private resizeLeft: boolean = false;

    private resizerOldWidth: number = 0;

    private resizerMin: number = 0;

    private resizerNextMin: number = 0;

    private resizerOldWidthNext: number = 0;

    private resizerPosition: number = 0;

    private resizerActiveDiv: HTMLDivElement | null = null;

    private resizerNextDiv: HTMLDivElement | null = null;

    private storedWidths: ScreenWidthOne | null = null;

    private systemConfig: ioBroker.SystemConfigObject;

    public objects: Record<string, ioBroker.Object>;

    private defaultHistory: string = '';

    private columnsVisibility: {
        id?: number | string;
        name?: number | string;
        nameHeader?: number | string;
        type?: number;
        role?: number;
        room?: number;
        func?: number;
        changedFrom?: number;
        qualityCode?: number;
        timestamp?: number;
        lastChange?: number;
        val?: number;
        buttons?: number;
    };

    private changedIds: null | string[] = null;

    private contextMenu: null | { item: any; ts: number } = null;

    private recordStates: string[] = [];

    private styles: {
        cellIdIconFolder?: React.CSSProperties;
        cellIdIconDocument?: React.CSSProperties;
        iconDeviceError?: React.CSSProperties;
        iconDeviceConnected?: React.CSSProperties;
        iconDeviceDisconnected?: React.CSSProperties;
        cellButtonsButtonWithCustoms?: React.CSSProperties;
        invertedBackground?: React.CSSProperties;
        invertedBackgroundFlex?: React.CSSProperties;
        contextMenuEdit?: React.CSSProperties;
        contextMenuEditValue?: React.CSSProperties;
        contextMenuView?: React.CSSProperties;
        contextMenuCustom?: React.CSSProperties;
        contextMenuACL?: React.CSSProperties;
        contextMenuRoom?: React.CSSProperties;
        contextMenuRole?: React.CSSProperties;
        contextMenuDelete?: React.CSSProperties;
        filterInput?: React.CSSProperties;
        iconCopy?: React.CSSProperties;
        aliasReadWrite?: React.CSSProperties;
        aliasAlone?: React.CSSProperties;
    } = {};

    private customColumnDialog: null | {
        value: boolean | number | string;
        type: 'boolean' | 'number' | 'string';
        initValue: boolean | number | string;
    } = null;

    /** Namespaces which are allowed to be edited by non-expert users */
    static #NON_EXPERT_NAMESPACES = ['0_userdata.0.', 'alias.0.'];

    constructor(props: ObjectBrowserProps) {
        super(props);

        const lastSelectedItems: string =
            this.localStorage.getItem(`${props.dialogName || 'App'}.objectSelected`) || '[]';
        try {
            this.lastSelectedItems = JSON.parse(lastSelectedItems) as string[];
            if (typeof this.lastSelectedItems !== 'object') {
                this.lastSelectedItems = [this.lastSelectedItems];
            }
            // remove empty items
            this.lastSelectedItems = this.lastSelectedItems.filter((id: string) => id);
        } catch (e) {
            // ignore
            this.lastSelectedItems = [];
        }

        let expanded: string[];
        const expandedStr = this.localStorage.getItem(`${props.dialogName || 'App'}.objectExpanded`) || '[]';
        try {
            expanded = JSON.parse(expandedStr);
        } catch (e) {
            expanded = [];
        }

        let filter: ObjectBrowserFilter;
        const filterStr: string = props.defaultFilters
            ? ''
            : this.localStorage.getItem(`${props.dialogName || 'App'}.objectFilter`) || '';
        if (filterStr) {
            try {
                filter = JSON.parse(filterStr);
            } catch (e) {
                filter = { ...DEFAULT_FILTER };
            }
        } else if (props.defaultFilters && typeof props.defaultFilters === 'object') {
            filter = { ...props.defaultFilters };
        } else {
            filter = { ...DEFAULT_FILTER };
        }

        filter.expertMode =
            props.expertMode !== undefined
                ? props.expertMode
                : ((window as any)._sessionStorage as Storage || window.sessionStorage).getItem('App.expertMode') === 'true';
        this.tableRef = createRef();
        this.filterRefs = {};

        Object.keys(DEFAULT_FILTER).forEach(name => (this.filterRefs[name] = createRef()));

        this.visibleCols = props.columns || SCREEN_WIDTHS[props.width || 'lg'].fields;
        // remove type column if only one type must be selected
        if (props.types && props.types.length === 1) {
            const pos = this.visibleCols.indexOf('type');
            pos !== -1 && this.visibleCols.splice(pos, 1);
        }

        this.possibleCols = SCREEN_WIDTHS.xl.fields;

        let customDialog = null;

        if (props.router) {
            const location = props.router.getLocation();
            if (location.id && location.dialog === 'customs') {
                customDialog = [location.id];
                this.pauseSubscribe(true);
            }
        }

        let selected: string[];
        if (!Array.isArray(props.selected)) {
            selected = [props.selected || ''];
        } else {
            selected = props.selected;
        }
        selected = selected.map(id => id.replace(/["']/g, '')).filter(id => id);

        const columnsStr = this.localStorage.getItem(`${props.dialogName || 'App'}.columns`);
        let columns: string[] | null;
        try {
            columns = columnsStr ? JSON.parse(columnsStr) : null;
        } catch (e) {
            columns = null;
        }

        let columnsWidths = null; // this.localStorage.getItem(`${props.dialogName || 'App'}.columnsWidths`);
        try {
            columnsWidths = columnsWidths ? JSON.parse(columnsWidths) : {};
        } catch (e) {
            columnsWidths = {};
        }

        this.imagePrefix = props.imagePrefix || '.';
        let foldersFirst: boolean;
        const foldersFirstStr = this.localStorage.getItem(`${props.dialogName || 'App'}.foldersFirst`);

        if (foldersFirstStr === 'false') {
            foldersFirst = false;
        } else if (foldersFirstStr === 'true') {
            foldersFirst = true;
        } else {
            foldersFirst = props.foldersFirst === undefined ? true : props.foldersFirst;
        }

        let statesView = false;
        try {
            statesView = this.props.objectStatesView
                ? JSON.parse(this.localStorage.getItem(`${props.dialogName || 'App'}.objectStatesView`) || '') || false
                : false;
        } catch (error) {
            // ignore
        }

        this.state = {
            loaded: false,
            foldersFirst,
            selected,
            selectedNonObject: this.localStorage.getItem(`${props.dialogName || 'App'}.selectedNonObject`) || '',
            filter,
            filterKey: 0,
            depth: 0,
            expandAllVisible: false,
            expanded,
            toast: '',
            scrollBarWidth: 16,
            customDialog,
            editObjectDialog: '',
            editObjectAlias: false, // open the edit object dialog on alias tab
            viewFileDialog: '',
            showAliasEditor: '',
            enumDialog: null,
            roleDialog: null,
            statesView,
            columns,
            columnsForAdmin: null,
            columnsSelectorShow: false,
            columnsAuto: this.localStorage.getItem(`${props.dialogName || 'App'}.columnsAuto`) !== 'false',
            columnsWidths,
            columnsDialogTransparent: 100,
            columnsEditCustomDialog: null,
            customColumnDialogValueChanged: false,
            showExportDialog: false,
            showAllExportOptions: false,
            linesEnabled: this.localStorage.getItem(`${props.dialogName || 'App'}.lines`) === 'true',
            showDescription: this.localStorage.getItem(`${props.dialogName || 'App'}.desc`) !== 'false',
            showContextMenu: null,
            noStatesByExportImport: false,
            beautifyJsonExport: true,
            excludeSystemRepositoriesFromExport: true,
            excludeTranslations: false,
            tooltipInfo: null,
        };

        this.texts = {
            value: props.t('ra_tooltip_value'),
            ack: props.t('ra_tooltip_ack'),
            ts: props.t('ra_tooltip_ts'),
            lc: props.t('ra_tooltip_lc'),
            from: props.t('ra_tooltip_from'),
            user: props.t('ra_tooltip_user'),
            c: props.t('ra_tooltip_comment'),
            quality: props.t('ra_tooltip_quality'),
            editObject: props.t('ra_tooltip_editObject'),
            deleteObject: props.t('ra_tooltip_deleteObject'),
            customConfig: props.t('ra_tooltip_customConfig'),
            copyState: props.t('ra_tooltip_copyState'),
            editState: props.t('ra_tooltip_editState'),
            close: props.t('ra_Close'),
            filter_id: props.t('ra_filter_id'),
            filter_name: props.t('ra_filter_name'),
            filter_type: props.t('ra_filter_type'),
            filter_role: props.t('ra_filter_role'),
            filter_room: props.t('ra_filter_room'),
            filter_func: props.t('ra_filter_func'),
            filter_custom: props.t('ra_filter_customs'), //
            filterCustomsWithout: props.t('ra_filter_customs_without'), //
            objectChangedByUser: props.t('ra_object_changed_by_user'), // Object last changed at
            objectChangedBy: props.t('ra_object_changed_by'), // Object changed by
            objectChangedFrom: props.t('ra_state_changed_from'), // Object changed from
            stateChangedBy: props.t('ra_state_changed_by'), // State changed by
            stateChangedFrom: props.t('ra_state_changed_from'), // State changed from
            ownerGroup: props.t('ra_Owner group'),
            ownerUser: props.t('ra_Owner user'),
            deviceError: props.t('ra_Error'),
            deviceDisconnected: props.t('ra_Disconnected'),
            deviceConnected: props.t('ra_Connected'),

            aclOwner_read_object: props.t('ra_aclOwner_read_object'),
            aclOwner_read_state: props.t('ra_aclOwner_read_state'),
            aclOwner_write_object: props.t('ra_aclOwner_write_object'),
            aclOwner_write_state: props.t('ra_aclOwner_write_state'),
            aclGroup_read_object: props.t('ra_aclGroup_read_object'),
            aclGroup_read_state: props.t('ra_aclGroup_read_state'),
            aclGroup_write_object: props.t('ra_aclGroup_write_object'),
            aclGroup_write_state: props.t('ra_aclGroup_write_state'),
            aclEveryone_read_object: props.t('ra_aclEveryone_read_object'),
            aclEveryone_read_state: props.t('ra_aclEveryone_read_state'),
            aclEveryone_write_object: props.t('ra_aclEveryone_write_object'),
            aclEveryone_write_state: props.t('ra_aclEveryone_write_state'),

            create: props.t('ra_Create'),
            createBooleanState: props.t('ra_create_boolean_state'),
            createNumberState: props.t('ra_create_number_state'),
            createStringState: props.t('ra_create_string_state'),
            createState: props.t('ra_create_state'),
            createChannel: props.t('ra_create_channel'),
            createDevice: props.t('ra_create_device'),
            createFolder: props.t('ra_Create folder'),
        };

        this.levelPadding = props.levelPadding || ITEM_LEVEL;

        const resizerCurrentWidthsStr = this.localStorage.getItem(`${this.props.dialogName || 'App'}.table`);
        if (resizerCurrentWidthsStr) {
            try {
                const resizerCurrentWidths = JSON.parse(resizerCurrentWidthsStr);
                const width = this.props.width || 'lg';
                this.storedWidths = JSON.parse(JSON.stringify(SCREEN_WIDTHS[width]));
                Object.keys(resizerCurrentWidths).forEach(id => {
                    if (id === 'id') {
                        SCREEN_WIDTHS[width].idWidth = resizerCurrentWidths.id;
                    } else if (id === 'nameHeader') {
                        SCREEN_WIDTHS[width].widths.name = resizerCurrentWidths[id];
                    } else if ((SCREEN_WIDTHS[width].widths as Record<string, number>)[id] !== undefined) {
                        (SCREEN_WIDTHS[width].widths as Record<string, number>)[id] =
                            resizerCurrentWidths[id];
                    }
                });

                this.customWidth = true;
            } catch (e) {
                // ignore
            }
        }

        this.calculateColumnsVisibility();
    }

    async loadAllObjects(update?: boolean): Promise<void> {
        const props = this.props;

        try {
            await new Promise<void>(resolve => {
                this.setState({ updating: true }, () => resolve());
            });

            const objects =
                (this.props.objectsWorker
                    ? await this.props.objectsWorker.getObjects(update)
                    : await props.socket.getObjects(update, true)) || {};
            if (props.types && Connection.isWeb()) {
                for (let i = 0; i < props.types.length; i++) {
                    // admin has ALL objects
                    // web has only state, channel, device, enum, and system.config
                    if (
                        props.types[i] === 'state' ||
                        props.types[i] === 'channel' ||
                        props.types[i] === 'device' ||
                        props.types[i] === 'enum'
                    ) {
                        continue;
                    }
                    const moreObjects = await props.socket.getObjectViewSystem(props.types[i]);
                    Object.assign(objects || {}, moreObjects as Record<string, ioBroker.Object>);
                }
            }

            this.systemConfig =
                this.systemConfig ||
                (objects?.['system.config'] as ioBroker.SystemConfigObject) ||
                ((await props.socket.getObject('system.config')) as ioBroker.SystemConfigObject);

            this.systemConfig.common = this.systemConfig.common || ({} as ioBroker.SystemConfigCommon);
            this.systemConfig.common.defaultNewAcl = this.systemConfig.common.defaultNewAcl || {
                object: 0,
                state: 0,
                file: 0,
                owner: 'system.user.admin',
                ownerGroup: 'system.group.administrator',
            };
            this.systemConfig.common.defaultNewAcl.owner =
                this.systemConfig.common.defaultNewAcl.owner || 'system.user.admin';
            this.systemConfig.common.defaultNewAcl.ownerGroup =
                this.systemConfig.common.defaultNewAcl.ownerGroup || 'system.group.administrator';
            if (typeof this.systemConfig.common.defaultNewAcl.state !== 'number') {
                // TODO: may be convert here from string
                this.systemConfig.common.defaultNewAcl.state = 0x664;
            }
            if (typeof this.systemConfig.common.defaultNewAcl.object !== 'number') {
                // TODO: may be convert here from string
                this.systemConfig.common.defaultNewAcl.state = 0x664;
            }

            if (typeof props.filterFunc === 'function') {
                this.objects = {};
                const filterFunc: (obj: ioBroker.Object) => boolean = props.filterFunc;
                Object.keys(objects).forEach(id => {
                    try {
                        if (filterFunc(objects[id])) {
                            this.objects[id] = objects[id];
                        } else {
                            const type = objects[id] && objects[id].type;
                            // include "folder" types too for icons and names of nodes
                            if (
                                type &&
                                (type === 'channel' ||
                                    type === 'device' ||
                                    type === 'folder' ||
                                    type === 'adapter' ||
                                    type === 'instance')
                            ) {
                                this.objects[id] = objects[id];
                            }
                        }
                    } catch (e) {
                        console.log(`Error by filtering of "${id}": ${e}`);
                    }
                });
            } else if (props.types) {
                this.objects = {};
                const propsTypes = props.types;
                Object.keys(objects).forEach(id => {
                    const type = objects[id] && objects[id].type;
                    // include "folder" types too
                    if (
                        type &&
                        (type === 'channel' ||
                            type === 'device' ||
                            type === 'enum' ||
                            type === 'folder' ||
                            type === 'adapter' ||
                            type === 'instance' ||
                            propsTypes.includes(type))
                    ) {
                        this.objects[id] = objects[id];
                    }
                });
            } else {
                this.objects = objects;
            }

            props.setObjectsReference && props.setObjectsReference(this.objects);

            // read default history
            this.defaultHistory = this.systemConfig.common.defaultHistory;
            if (this.defaultHistory) {
                props.socket
                    .getState(`system.adapter.${this.defaultHistory}.alive`)
                    .then(state => {
                        if (!state || !state.val) {
                            this.defaultHistory = '';
                        }
                    })
                    .catch(e => window.alert(`Cannot get state: ${e}`));
            }

            const columnsForAdmin = await this.getAdditionalColumns();
            this.calculateColumnsVisibility(null, null, columnsForAdmin);

            const { info, root } = buildTree(this.objects, {
                imagePrefix: this.props.imagePrefix,
                root: this.props.root,
                lang: this.props.lang,
                themeType: this.props.themeType,
            });
            this.root = root;
            this.info = info;

            // Show first selected item
            const node =
                this.state.selected && this.state.selected.length && findNode(this.root, this.state.selected[0]);

            this.lastAppliedFilter = null;

            // If the selected ID is not visible, reset filter
            if (
                node &&
                !applyFilter(
                    node,
                    this.state.filter,
                    this.props.lang,
                    this.objects,
                    undefined,
                    undefined,
                    props.customFilter,
                    props.types,
                )
            ) {
                // reset filter
                this.setState({ filter: { ...DEFAULT_FILTER }, columnsForAdmin }, () => {
                    this.setState({ loaded: true, updating: false }, () =>
                        this.expandAllSelected(() => this.onAfterSelect()));
                });
            } else {
                this.setState({ loaded: true, updating: false, columnsForAdmin }, () =>
                    this.expandAllSelected(() => this.onAfterSelect()));
            }
        } catch (e1) {
            this.showError(e1);
        }
    }

    /**
     * Check if it is a non-expert id
     */
    static isNonExpertId(
        /** id to test */
        id: string,
    ): boolean {
        return !!ObjectBrowserClass.#NON_EXPERT_NAMESPACES.find(saveNamespace => id.startsWith(saveNamespace));
    }

    private expandAllSelected(cb?: () => void): void {
        const expanded = [...this.state.expanded];
        let changed = false;
        this.state.selected.forEach(id => {
            const parts = id.split('.');
            const path = [];
            for (let i = 0; i < parts.length - 1; i++) {
                path.push(parts[i]);
                if (!expanded.includes(path.join('.'))) {
                    expanded.push(path.join('.'));
                    changed = true;
                }
            }
        });
        if (changed) {
            expanded.sort();
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify(expanded));
            this.setState({ expanded }, cb);
        } else {
            cb && cb();
        }
    }

    /**
     * @param isDouble is double click
     */
    private onAfterSelect(isDouble?: boolean) {
        this.lastSelectedItems = [...this.state.selected];
        if (this.state.selected && this.state.selected.length) {
            this.localStorage.setItem(
                `${this.props.dialogName || 'App'}.objectSelected`,
                JSON.stringify(this.lastSelectedItems),
            );

            const name =
                this.lastSelectedItems.length === 1
                    ? Utils.getObjectName(this.objects, this.lastSelectedItems[0], null, { language: this.props.lang })
                    : '';
            this.props.onSelect && this.props.onSelect(this.lastSelectedItems, name, isDouble);
        } else {
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectSelected`, '');
            if (this.state.selected.length) {
                this.setState({ selected: [] }, () => this.props.onSelect && this.props.onSelect([], ''));
            } else {
                this.props.onSelect && this.props.onSelect([], '');
            }
        }
    }

    private static getDerivedStateFromProps(props: ObjectBrowserProps, state: ObjectBrowserState) {
        const newState: Partial<ObjectBrowserState> = {};
        let changed = false;
        if (props.expertMode !== undefined && props.expertMode !== state.filter.expertMode) {
            changed = true;
            newState.filter = { ...state.filter };
            newState.filter.expertMode = props.expertMode;
        }
        return changed ? newState : null;
    }

    /**
     * Called when component is mounted.
     */
    async componentDidMount() {
        await this.loadAllObjects(!objectsAlreadyLoaded);
        if (this.props.objectsWorker) {
            this.props.objectsWorker.registerHandler(this.onObjectChangeFromWorker);
        } else {
            await this.props.socket.subscribeObject('*', this.onObjectChange);
        }

        objectsAlreadyLoaded = true;

        window.addEventListener('contextmenu', this.onContextMenu, true);
    }

    /**
     * Called when component is unmounted.
     */
    componentWillUnmount() {
        this.filterTimer && clearTimeout(this.filterTimer);
        this.filterTimer = null;
        window.removeEventListener('contextmenu', this.onContextMenu, true);

        if (this.props.objectsWorker) {
            this.props.objectsWorker.unregisterHandler(this.onObjectChangeFromWorker, true);
        } else {
            this.props.socket.unsubscribeObject('*', this.onObjectChange);
        }

        // remove all subscribes
        this.subscribes.forEach(pattern => {
            console.log(`- unsubscribe ${pattern}`);
            this.props.socket.unsubscribeState(pattern, this.onStateChange);
        });

        this.subscribes = [];
        this.objects = {};
    }

    /**
     * Show the deletion dialog for a given object
     */
    showDeleteDialog(options: { id: string; obj: ioBroker.Object; item: TreeItem }) {
        const { id, obj, item } = options;

        // calculate the number of children
        const keys = Object.keys(this.objects);
        keys.sort();
        let count = 0;
        const start = `${id}.`;
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].startsWith(start)) {
                count++;
            } else if (keys[i] > start) {
                break;
            }
        }

        this.props.onObjectDelete && this.props.onObjectDelete(id, !!item.children?.length, !obj.common?.dontDelete, count + 1);
    }

    /**
     * Context menu handler.
     */
    onContextMenu = (e: MouseEvent) => {
        // console.log(`CONTEXT MENU: ${this.contextMenu ? Date.now() - this.contextMenu.ts : 'false'}`);
        if (this.contextMenu && Date.now() - this.contextMenu.ts < 2000) {
            e.preventDefault();
            this.setState({ showContextMenu: { item: this.contextMenu.item } });
        } else if (this.state.showContextMenu) {
            e.preventDefault();
            this.setState({ showContextMenu: null });
        }
        this.contextMenu = null;
    };

    /**
     * Called when component is mounted.
     */
    refreshComponent() {
        // remove all subscribes
        this.subscribes.forEach(pattern => {
            console.log(`- unsubscribe ${pattern}`);
            this.props.socket.unsubscribeState(pattern, this.onStateChange);
        });

        this.subscribes = [];

        this.loadAllObjects(true).then(() => console.log('updated!'));
    }

    /**
     * Renders the error dialog.
     */
    renderErrorDialog(): React.JSX.Element | null {
        return this.state.error ? <Dialog
            open={!0}
            maxWidth="sm"
            fullWidth
            onClose={() => this.setState({ error: '' })}
            aria-labelledby="error-dialog-title"
            aria-describedby="error-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{this.props.t('ra_Error')}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">{this.state.error}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.setState({ error: '' })}
                    color="primary"
                    autoFocus
                    startIcon={<IconCheck />}
                >
                    {this.props.t('ra_Ok')}
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    /**
     * Show the error dialog.
     */
    showError(error: any) {
        this.setState({
            error:
                typeof error === 'object'
                    ? error && typeof error.toString === 'function'
                        ? error.toString()
                        : JSON.stringify(error)
                    : error,
        });
    }

    /**
     * Called when an item is selected/deselected.
     */
    onSelect(toggleItem: string, isDouble?: boolean, cb?: () => void) {
        if (!this.props.multiSelect) {
            if (
                this.objects[toggleItem] &&
                (!this.props.types || this.props.types.includes(this.objects[toggleItem].type))
            ) {
                this.localStorage.removeItem(`${this.props.dialogName || 'App'}.selectedNonObject`);
                if (this.state.selected[0] !== toggleItem) {
                    this.setState({ selected: [toggleItem], selectedNonObject: '' }, () => {
                        this.onAfterSelect(isDouble);
                        cb && cb();
                    });
                } else if (isDouble && this.props.onSelect) {
                    this.onAfterSelect(isDouble);
                }
            } else {
                this.localStorage.setItem(`${this.props.dialogName || 'App'}.selectedNonObject`, toggleItem);
                this.setState({ selected: [], selectedNonObject: toggleItem }, () => {
                    this.onAfterSelect();
                    cb && cb();
                });
            }
        } else if (
            this.objects[toggleItem] &&
            (!this.props.types || this.props.types.includes(this.objects[toggleItem].type))
        ) {
            this.localStorage.removeItem(`${this.props.dialogName || 'App'}.selectedNonObject`);

            const selected = [...this.state.selected];
            const pos = selected.indexOf(toggleItem);
            if (pos === -1) {
                selected.push(toggleItem);
                selected.sort();
            } else if (!isDouble) {
                selected.splice(pos, 1);
            }

            this.setState({ selected, selectedNonObject: '' }, () => {
                this.onAfterSelect(isDouble);
                cb && cb();
            });
        }
    }

    private _renderDefinedList(isLast: boolean) {
        const cols = [...this.possibleCols];
        cols.unshift('id');
        if (this.props.columns && !this.props.columns.includes('buttons')) {
            const pos = cols.indexOf('buttons');
            if (pos !== -1) {
                cols.splice(pos, 1);
            }
        }
        return cols
            .filter(id =>
                (isLast && (id === 'val' || id === 'buttons')) ||
                (!isLast && id !== 'val' && id !== 'buttons'))
            .map(id => <ListItemButton
                onClick={() => {
                    if (!this.state.columnsAuto && id !== 'id') {
                        const columns = [...(this.state.columns || [])];
                        const pos = columns.indexOf(id);
                        if (pos === -1) {
                            columns.push(id);
                            columns.sort();
                        } else {
                            columns.splice(pos, 1);
                        }
                        this.localStorage.setItem(
                            `${this.props.dialogName || 'App'}.columns`,
                            JSON.stringify(columns),
                        );
                        this.calculateColumnsVisibility(null, columns);
                        this.setState({ columns });
                    }
                }}
                key={id}
            >
                <Checkbox
                    edge="start"
                    disabled={id === 'id' || this.state.columnsAuto}
                    checked={
                        id === 'id' ||
                        !!(this.state.columnsAuto
                            ? this.visibleCols.includes(id)
                            : this.state.columns?.includes(id))
                    }
                    disableRipple
                />
                <ListItemText primary={this.texts[`filter_${id}`] || this.props.t(`ra_${id}`)} />
                {/*
                <ListItemSecondaryAction>
                    <FormControl
                        variant="standard"
                        style={{ ...styles.columnsDialogInputWidth, marginTop: 0, marginBottom: 0 }}
                        margin="dense"
                    >
                        <Input
                            classes={{ underline: 'no-underline' }}
                            placeholder={this.props.t('ra_Width')}
                            value={this.state.columnsWidths[id] || ''}
                            onChange={e => {
                                const columnsWidths = JSON.parse(JSON.stringify(this.state.columnsWidths));
                                columnsWidths[id] = e.target.value;
                                this.localStorage.setItem((this.props.dialogName || 'App') + '.columnsWidths', JSON.stringify(columnsWidths));
                                this.calculateColumnsVisibility(null, null, null, columnsWidths);
                                this.setState({ columnsWidths });
                            }}
                            autoComplete="off"
                        />
                    </FormControl>
                </ListItemSecondaryAction>
                */}
            </ListItemButton>);
    }

    /**
     * Renders the columns' selector.
     */
    renderColumnsSelectorDialog(): React.JSX.Element | null {
        if (!this.state.columnsSelectorShow) {
            return null;
        }
        return <Dialog
            onClose={() => this.setState({ columnsSelectorShow: false })}
            open={!0}
            sx={{
                '& .MuiPaper-root': getStyle(this.props.theme, styles.dialogColumns, styles[`transparent_${this.state.columnsDialogTransparent}`]),
            }}
        >
            <DialogTitle sx={styles.fontSizeTitle}>{this.props.t('ra_Configure')}</DialogTitle>
            <DialogContent sx={styles.fontSizeTitle}>
                <FormControlLabel
                    style={styles.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.foldersFirst}
                            onChange={() => {
                                this.localStorage.setItem(
                                    `${this.props.dialogName || 'App'}.foldersFirst`,
                                    this.state.foldersFirst ? 'false' : 'true',
                                );
                                this.setState({ foldersFirst: !this.state.foldersFirst });
                            }}
                        />
                    }
                    label={this.props.t('ra_Folders always first')}
                />
                <FormControlLabel
                    style={styles.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.linesEnabled}
                            onChange={() => {
                                this.localStorage.setItem(
                                    `${this.props.dialogName || 'App'}.lines`,
                                    this.state.linesEnabled ? 'false' : 'true',
                                );
                                this.setState({ linesEnabled: !this.state.linesEnabled });
                            }}
                        />
                    }
                    label={this.props.t('ra_Show lines between rows')}
                />
                <FormControlLabel
                    style={styles.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.columnsAuto}
                            onChange={() => {
                                this.localStorage.setItem(
                                    `${this.props.dialogName || 'App'}.columnsAuto`,
                                    this.state.columnsAuto ? 'false' : 'true',
                                );
                                if (!this.state.columnsAuto) {
                                    this.calculateColumnsVisibility(true);
                                    this.setState({ columnsAuto: true });
                                } else if (!this.state.columns) {
                                    this.calculateColumnsVisibility(false, [...this.visibleCols]);
                                    this.setState({ columnsAuto: false, columns: [...this.visibleCols] });
                                } else {
                                    this.calculateColumnsVisibility(false);
                                    this.setState({ columnsAuto: false });
                                }
                            }}
                        />
                    }
                    label={this.props.t('ra_Auto (no custom columns)')}
                />
                {/*
            <Typography classes={{ root: styles.dialogColumnsLabel }}>{this.props.t('ra_Transparent dialog')}</Typography>
        <Slider classes={{ root: styles.width100 }} value={this.state.columnsDialogTransparent} min={20} max={100} step={10} onChange={(event, newValue) =>
            this.setState({ columnsDialogTransparent: newValue })
        } />
            */}
                <List>
                    {this._renderDefinedList(false)}

                    {this.state.columnsForAdmin && Object.keys(this.state.columnsForAdmin)
                        .sort()
                        .map(adapter =>
                            this.state.columnsForAdmin && this.state.columnsForAdmin[adapter].map(column => <ListItemButton
                                onClick={() => {
                                    if (!this.state.columnsAuto) {
                                        const columns = [...(this.state.columns || [])];
                                        const id = `_${adapter}_${column.path}`;
                                        const pos = columns.indexOf(id);
                                        if (pos === -1) {
                                            columns.push(id);
                                            columns.sort();
                                        } else {
                                            columns.splice(pos, 1);
                                        }
                                        this.calculateColumnsVisibility(null, columns);
                                        this.localStorage.setItem(
                                            `${this.props.dialogName || 'App'}.columns`,
                                            JSON.stringify(columns),
                                        );
                                        this.setState({ columns });
                                    }
                                }}
                                key={`${adapter}_${column.name}`}
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        disabled={this.state.columnsAuto}
                                        edge="start"
                                        checked={
                                            !this.state.columnsAuto &&
                                            this.state.columns?.includes(`_${adapter}_${column.path}`)
                                        }
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={`${column.name} (${adapter})`} />
                                {/*
                                <ListItemSecondaryAction>
                                    <FormControl
                                        variant="standard"
                                        style={{ ...styles.columnsDialogInputWidth, marginTop: 0, marginBottom: 0 }}
                                        margin="dense"
                                    >
                                        <Input
                                            classes={{ underline: 'no-underline' }}
                                            placeholder={this.props.t('ra_Width')}
                                            value={this.state.columnsWidths['_' + adapter + '_' + column.path] || ''}
                                            onChange={e => {
                                                const columnsWidths = JSON.parse(JSON.stringify(this.state.columnsWidths));
                                                columnsWidths['_' + adapter + '_' + column.path] = e.target.value;
                                                this.localStorage.setItem((this.props.dialogName || 'App') + '.columnsWidths', JSON.stringify(columnsWidths));
                                                this.calculateColumnsVisibility(null, null, null, columnsWidths);
                                                this.setState({ columnsWidths });
                                            }}
                                            autoComplete="off"
                                        />
                                    </FormControl>
                                </ListItemSecondaryAction>
                                */}
                            </ListItemButton>))}
                    {this._renderDefinedList(true)}
                </List>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.setState({ columnsSelectorShow: false })}
                    color="primary"
                    startIcon={<IconClose />}
                >
                    {this.texts.close}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    private async getAdditionalColumns(): Promise<Record<string, CustomAdminColumnStored[]> | null> {
        try {
            const instances = await this.props.socket
                .getAdapters();

            let columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null = null;
            // find all additional columns
            instances.forEach(obj => (columnsForAdmin = this.parseObjectForAdmins(columnsForAdmin, obj)));

            return columnsForAdmin;
        } catch (err) {
            // window.alert('Cannot get adapters: ' + e);
            // Object browser in Web has no additional columns
            console.error(`Cannot get adapters: ${err}`);
            return null;
        }
    }

    private checkUnsubscribes() {
        // Remove unused subscriptions
        for (let i = this.subscribes.length - 1; i >= 0; i--) {
            !this.recordStates.includes(this.subscribes[i]) && this.unsubscribe(this.subscribes[i]);
        }
        this.recordStates = [];
    }

    /**
     * Find an item.
     */
    findItem(
        id: string,
        _parts?: string[],
        _root?: TreeItem | null,
        _partyId?: string,
    ): TreeItem | null {
        _parts = _parts || id.split('.');
        _root = _root || this.root;
        if (!_root || !_parts.length) {
            return null;
        }

        _partyId = (_partyId ? `${_partyId}.` : '') + _parts.shift();

        if (_root.children) {
            const item = _root.children.find(i => i.data.id === _partyId);
            if (item) {
                if (item.data.id === id) {
                    return item;
                }
                if (_parts.length) {
                    return this.findItem(id, _parts, item, _partyId);
                }
            } else {
                return null;
            }
        }

        return null;
    }

    /**
     * Called when a state changes.
     */
    onStateChange = (id: string, state?: ioBroker.State | null) => {
        console.log(`> stateChange ${id}`);
        if (this.states[id]) {
            const item = this.findItem(id);
            if (item?.data.state) {
                item.data.state = undefined;
            }
        }
        if (state) {
            this.states[id] = state;
        } else {
            delete this.states[id];
        }

        if (!this.pausedSubscribes) {
            if (!this.statesUpdateTimer) {
                this.statesUpdateTimer = setTimeout(() => {
                    this.statesUpdateTimer = null;
                    this.forceUpdate();
                }, 300);
            }
        } else if (this.statesUpdateTimer) {
            clearTimeout(this.statesUpdateTimer);
            this.statesUpdateTimer = null;
        }
    };

    private parseObjectForAdmins(
        columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null,
        obj: ioBroker.AdapterObject,
    ): Record<string, CustomAdminColumnStored[]> | null {
        if (obj.common && obj.common.adminColumns && obj.common.name) {
            let columns: string | (string | ioBroker.CustomAdminColumn)[] = obj.common.adminColumns;
            if (columns && typeof columns !== 'object') {
                columns = [columns];
            }
            let cColumns: CustomAdminColumnStored[] | null;
            if (columns) {
                cColumns = (columns as (string | ioBroker.CustomAdminColumn)[])
                    .map((_item: string | ioBroker.CustomAdminColumn) => {
                        if (typeof _item !== 'object') {
                            return { path: _item, name: (_item as string).split('.').pop() };
                        }
                        const item: ioBroker.CustomAdminColumn = _item as ioBroker.CustomAdminColumn;
                        // string => array
                        if (item.objTypes && typeof item.objTypes !== 'object') {
                            item.objTypes = [item.objTypes];
                        } else if (!item.objTypes) {
                            item.objTypes = null;
                        }

                        if (!item.name && item.path) {
                            return {
                                path: item.path,
                                name: item.path.split('.').pop(),
                                width: item.width,
                                edit: !!item.edit,
                                type: item.type,
                                objTypes: item.objTypes,
                            } as CustomAdminColumnStored;
                        }
                        if (!item.path) {
                            console.warn(`Admin columns for ${obj._id} ignored, because path not found`);
                            return null;
                        }
                        return {
                            path: item.path,
                            name: getName(item.name || '', this.props.lang),
                            width: item.width,
                            edit: !!item.edit,
                            type: item.type,
                            objTypes: item.objTypes,
                        } as CustomAdminColumnStored;
                    })
                    .filter(item => item) as CustomAdminColumnStored[];
            } else {
                cColumns = null;
            }

            if (cColumns?.length) {
                columnsForAdmin = columnsForAdmin || {};
                columnsForAdmin[obj.common.name] = cColumns.sort((a, b) =>
                    (a.path > b.path ? -1 : a.path < b.path ? 1 : 0));
            }
        } else if (obj.common && obj.common.name && columnsForAdmin && columnsForAdmin[obj.common.name]) {
            delete columnsForAdmin[obj.common.name];
        }
        return columnsForAdmin;
    }

    onObjectChangeFromWorker = (events: ObjectEvent[]): void => {
        if (Array.isArray(events)) {
            let newState: { columnsForAdmin: Record<string, CustomAdminColumnStored[] | null> | null } | null = null;
            events.forEach(event => {
                const { newInnerState, filtered } = this.processOnObjectChangeElement(event.id, event.obj);
                if (filtered) {
                    return;
                }
                if (newInnerState && newState) {
                    Object.assign(newState, newInnerState);
                } else {
                    newState = newInnerState;
                }
            });

            newState && this.setState(newState);
            this.afterObjectUpdated();
        }
    };

    onObjectChange = (id: string, obj?: ioBroker.Object | null): void => {
        const { newInnerState, filtered } = this.processOnObjectChangeElement(id, obj);
        if (filtered) {
            return;
        }

        newInnerState && this.setState(newInnerState);
        this.afterObjectUpdated();
    };

    afterObjectUpdated() {
        if (!this.objectsUpdateTimer && this.objects) {
            this.objectsUpdateTimer = setTimeout(() => {
                this.objectsUpdateTimer = null;
                const { info, root } = buildTree(this.objects, {
                    imagePrefix: this.props.imagePrefix,
                    root: this.props.root,
                    lang: this.props.lang,
                    themeType: this.props.themeType,
                });
                this.root = root;
                this.info = info;
                this.lastAppliedFilter = null; // apply filter anew

                if (!this.pausedSubscribes) {
                    this.forceUpdate();
                }
                // else it will be re-rendered when the dialog will be closed
            }, 500);
        }
    }

    /**
     * Processes a single element in regard to certain filters, columns for admin and updates object dict
     * @returns Returns an object containing the new state (if any) and whether the object was filtered.
     */
    processOnObjectChangeElement(
        /** The id of the object */
        id: string,
        /** The object itself */
        obj?: ioBroker.Object | null,
    ): {
        filtered: boolean;
        newInnerState: null | { columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null };
    } {
        console.log(`> objectChange ${id}`);
        const type = obj?.type;

        if (
            obj &&
            typeof this.props.filterFunc === 'function' &&
            !this.props.filterFunc(obj) &&
            type !== 'channel' &&
            type !== 'device' &&
            type !== 'folder' &&
            type !== 'adapter' &&
            type !== 'instance'
        ) {
            return { newInnerState: null, filtered: true };
        }

        let newInnerState = null;
        if (id.startsWith('system.adapter.') && obj && obj.type === 'adapter') {
            const columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null = JSON.parse(JSON.stringify(this.state.columnsForAdmin));

            this.parseObjectForAdmins(columnsForAdmin, obj as ioBroker.AdapterObject);

            if (JSON.stringify(this.state.columnsForAdmin) !== JSON.stringify(columnsForAdmin)) {
                newInnerState = { columnsForAdmin };
            }
        }
        this.objects = this.objects || {};
        if (obj) {
            this.objects[id] = obj;
        } else if (this.objects[id]) {
            delete this.objects[id];
        }
        return { newInnerState, filtered: false };
    }

    private subscribe(id: string) {
        if (!this.subscribes.includes(id)) {
            this.subscribes.push(id);
            console.log(`+ subscribe ${id}`);
            !this.pausedSubscribes && this.props.socket.subscribeState(id, this.onStateChange);
        }
    }

    private unsubscribe(id: string) {
        const pos = this.subscribes.indexOf(id);
        if (pos !== -1) {
            this.subscribes.splice(pos, 1);
            if (this.states[id]) {
                delete this.states[id];
            }
            console.log(`- unsubscribe ${id}`);
            this.props.socket.unsubscribeState(id, this.onStateChange);

            if (this.pausedSubscribes) {
                console.warn('Unsubscribe during pause?');
            }
        }
    }

    private pauseSubscribe(isPause: boolean) {
        if (!this.pausedSubscribes && isPause) {
            this.pausedSubscribes = true;
            this.subscribes.forEach(id => this.props.socket.unsubscribeState(id, this.onStateChange));
        } else if (this.pausedSubscribes && !isPause) {
            this.pausedSubscribes = false;
            this.subscribes.forEach(id => this.props.socket.subscribeState(id, this.onStateChange));
        }
    }

    private onFilter(name?: string, value?: string | boolean) {
        this.filterTimer = null;
        const filter: ObjectBrowserFilter = { ...this.state.filter };

        Object.keys(this.filterRefs).forEach(_name => {
            if (this.filterRefs[_name] && this.filterRefs[_name].current) {
                const filterRef: HTMLSelectElement = this.filterRefs[_name].current as HTMLSelectElement;
                for (let i = 0; i < filterRef.children.length; i++) {
                    if (filterRef.children[i].tagName === 'INPUT') {
                        (filter as Record<string, string>)[_name] = (filterRef.children[i] as HTMLInputElement).value;
                        break;
                    }
                }
            }
        });

        if (name) {
            (filter as Record<string, string | boolean | undefined>)[name] = value;
            if (name === 'expertMode') {
                ((window as any)._sessionStorage as Storage || window.sessionStorage).setItem(
                    'App.expertMode',
                    value ? 'true' : 'false',
                );
            }
        }

        if (JSON.stringify(this.state.filter) !== JSON.stringify(filter)) {
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectFilter`, JSON.stringify(filter));
            this.setState({ filter }, () => this.props.onFilterChanged && this.props.onFilterChanged(filter));
        }
    }

    clearFilter() {
        const filter: ObjectBrowserFilter = { ...this.state.filter };

        Object.keys(this.filterRefs).forEach(name => {
            if (this.filterRefs[name] && this.filterRefs[name].current) {
                const filterRef: HTMLSelectElement = this.filterRefs[name].current as HTMLSelectElement;
                for (let i = 0; i < filterRef.childNodes.length; i++) {
                    const item = filterRef.childNodes[i];
                    if ((item as HTMLInputElement).tagName === 'INPUT') {
                        (filter as Record<string, string>)[name] = '';
                        (item as HTMLInputElement).value = '';
                        break;
                    }
                }
            }
        });

        if (JSON.stringify(this.state.filter) !== JSON.stringify(filter)) {
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectFilter`, JSON.stringify(filter));
            this.setState(
                { filter, filterKey: this.state.filterKey + 1 },
                () => this.props.onFilterChanged && this.props.onFilterChanged(filter),
            );
        }
    }

    isFilterEmpty() {
        const someNotEmpty = Object.keys(this.state.filter)
            .find(attr => attr !== 'expertMode' && (this.state.filter as Record<string, string>)[attr]);
        return !someNotEmpty;
    }

    private getFilterInput(filterName: string) {
        return <FormControl
            sx={this.styles.filterInput}
            key={`${filterName}_${this.state.filterKey}`}
            // style={{ marginTop: 0, marginBottom: 0 }}
            margin="dense"
        >
            <Input
                ref={this.filterRefs[filterName]}
                classes={{ underline: 'no-underline' }}
                id={filterName}
                placeholder={this.texts[`filter_${filterName}`]}
                defaultValue={(this.state.filter as Record<string, string>)[filterName] || ''}
                onChange={() => {
                    this.filterTimer && clearTimeout(this.filterTimer);
                    this.filterTimer = setTimeout(() => this.onFilter(), 400);
                }}
                autoComplete="off"
            />
            {(this.filterRefs[filterName]?.current?.firstChild as HTMLInputElement)?.value ? <div
                style={{
                    position: 'absolute',
                    right: 0,
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => {
                        (this.filterRefs[filterName].current?.firstChild as HTMLInputElement).value = '';
                        this.onFilter(filterName, '');
                    }}
                >
                    <IconClose />
                </IconButton>
            </div> : null}
        </FormControl>;
    }

    private getFilterSelect(
        name: string,
        values?: (string | InputSelectItem)[],
    ) {
        const hasIcons = !!values?.find(item =>
            (item as InputSelectItem).icon);

        return <div style={{ position: 'relative' }}>
            <Select
                variant="standard"
                key={`${name}_${this.state.filterKey}`}
                ref={this.filterRefs[name]}
                sx={styles.headerCellInput}
                className="no-underline"
                onChange={() => {
                    this.filterTimer && clearTimeout(this.filterTimer);
                    this.filterTimer = setTimeout(() => this.onFilter(), 400);
                }}
                defaultValue={(this.state.filter as Record<string, string>)[name] || ''}
                inputProps={{ name, id: name }}
                displayEmpty
            >
                <MenuItem key="empty" value="">
                    <span style={styles.selectNone}>{this.texts[`filter_${name}`]}</span>
                </MenuItem>
                {values?.map(item => {
                    let id: string;
                    let _name: string;
                    let icon: null | React.JSX.Element | undefined;
                    if (typeof item === 'object') {
                        id = (item as InputSelectItem).value;
                        _name = (item as InputSelectItem).name;
                        icon = (item as InputSelectItem).icon;
                    } else {
                        id = item as string;
                        _name = item as string;
                    }
                    return <MenuItem sx={styles.headerCellSelectItem} key={id} value={id}>
                        {icon || (hasIcons ? <div className="itemIcon" /> : null)}
                        {_name}
                    </MenuItem>;
                })}
            </Select>
            {(this.filterRefs[name]?.current?.childNodes[1] as HTMLInputElement)?.value ? <Box
                component="div"
                sx={styles.selectClearButton}
            >
                <IconButton
                    size="small"
                    onClick={() => {
                        const newFilter: ObjectBrowserFilter = { ...this.state.filter };
                        (newFilter as Record<string, string>)[name] = '';
                        (this.filterRefs[name].current?.childNodes[1] as HTMLInputElement).value = '';
                        this.localStorage.setItem(
                            `${this.props.dialogName || 'App'}.objectFilter`,
                            JSON.stringify(newFilter),
                        );
                        this.setState(
                            { filter: newFilter, filterKey: this.state.filterKey + 1 },
                            () => this.props.onFilterChanged && this.props.onFilterChanged(newFilter),
                        );
                    }}
                >
                    <IconClose />
                </IconButton>
            </Box> : null}
        </div>;
    }

    private getFilterSelectRole() {
        return this.getFilterSelect('role', this.info.roles);
    }

    private getFilterSelectRoom() {
        const rooms: InputSelectItem[] = this.info.roomEnums.map(id => ({
            name: getName(this.objects[id]?.common?.name, this.props.lang) || id.split('.').pop(),
            value: id,
            icon: <Icon src={this.objects[id]?.common?.icon || ''} style={styles.selectIcon} />,
        } as InputSelectItem));

        return this.getFilterSelect('room', rooms);
    }

    private getFilterSelectFunction() {
        const func: InputSelectItem[] = this.info.funcEnums.map(id => ({
            name: getName(this.objects[id]?.common?.name, this.props.lang) || id.split('.').pop(),
            value: id,
            icon: <Icon src={this.objects[id]?.common?.icon || ''} style={styles.selectIcon} /> as React.JSX.Element,
        } as InputSelectItem));

        return this.getFilterSelect('func', func);
    }

    private getFilterSelectType() {
        const types = this.info.types.map(type => ({
            name: type,
            value: type,
            icon: ITEM_IMAGES[type] || null,
        }));

        return this.getFilterSelect('type', types);
    }

    private getFilterSelectCustoms() {
        if (this.info.customs.length > 1) {
            const customs = this.info.customs.map(id => ({
                name: id === '_' ? this.texts.filterCustomsWithout : id,
                value: id,
                icon: id === '_' ? null : <Icon
                    src={getSelectIdIconFromObjects(this.objects, id, this.imagePrefix) || ''}
                    style={styles.selectIcon}
                />,
            }));
            return this.getFilterSelect('custom', customs);
        }
        return null;
    }

    private onExpandAll(root?: TreeItem, expanded?: string[]) {
        const _root: TreeItem | null = root || this.root;
        expanded = expanded || [];

        _root?.children?.forEach((item: TreeItem) => {
            if (item.data.sumVisibility) {
                expanded.push(item.data.id);
                this.onExpandAll(item, expanded);
            }
        });

        if (_root === this.root) {
            expanded.sort();
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify(expanded));

            this.setState({ expanded });
        }
    }

    private onCollapseAll() {
        this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify([]));
        this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectSelected`, '[]');
        this.setState({ expanded: [], depth: 0, selected: [] }, () => this.onAfterSelect());
    }

    private expandDepth(
        root: TreeItem,
        depth: number,
        expanded: string[],
    ) {
        root = root || this.root;
        if (depth > 0) {
            root.children?.forEach(item => {
                if (item.data.sumVisibility) {
                    if (!binarySearch(expanded, item.data.id)) {
                        expanded.push(item.data.id);
                        expanded.sort();
                    }
                    if (depth - 1 > 0) {
                        this.expandDepth(item, depth - 1, expanded);
                    }
                }
            });
        }
    }

    private static collapseDepth(depth: number, expanded: string[]) {
        return expanded.filter(id => id.split('.').length <= depth);
    }

    private onExpandVisible() {
        if (this.state.depth < 9) {
            const depth = this.state.depth + 1;
            const expanded = [...this.state.expanded];
            this.root && this.expandDepth(this.root, depth, expanded);
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify(expanded));
            this.setState({ depth, expanded });
        }
    }

    private onStatesViewVisible() {
        const statesView = !this.state.statesView;
        this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectStatesView`, JSON.stringify(statesView));
        this.setState({ statesView });
    }

    private onCollapseVisible() {
        if (this.state.depth > 0) {
            const depth = this.state.depth - 1;
            const expanded = ObjectBrowserClass.collapseDepth(depth, this.state.expanded);
            this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify(expanded));
            this.setState({ depth, expanded });
        }
    }

    private getEnumsForId = (id: string): ioBroker.EnumObject[] | undefined => {
        const result: ioBroker.EnumObject[] = [];
        this.info.enums.forEach(_id => {
            if (this.objects[_id]?.common?.members?.includes(id)) {
                const enumItem: ioBroker.EnumObject = {
                    _id: this.objects[_id]._id,
                    common: JSON.parse(JSON.stringify(this.objects[_id].common)) as ioBroker.EnumCommon,
                    native: this.objects[_id].native,
                    type: 'enum',
                } as ioBroker.EnumObject;
                if (enumItem.common) {
                    delete enumItem.common.members;
                    delete enumItem.common.custom;
                    // @ts-expect-error deprecated attribute
                    delete enumItem.common.mobile;
                }
                result.push(enumItem);
            }
        });

        return result.length ? result : undefined;
    };

    private _createAllEnums = async (enums: (string | ioBroker.EnumObject)[], objId: string) => {
        for (let e = 0; e < enums.length; e++) {
            const item: string | ioBroker.EnumObject = enums[e];
            let id: string;
            let newObj: ioBroker.EnumObject | undefined;

            // some admin version delivered enums as string
            if (typeof item === 'object') {
                newObj = item as ioBroker.EnumObject;
                id = newObj._id;
            } else {
                id = item as string;
            }

            let oldObj: ioBroker.EnumObject | undefined = this.objects[id] as ioBroker.EnumObject | undefined;
            // if enum does not exist
            if (!oldObj) {
                // create a new one
                oldObj = newObj || {
                    _id: id,
                    common: {
                        name: id.split('.').pop(),
                        members: [],
                    },
                    native: {},
                    type: 'enum',
                } as ioBroker.EnumObject;

                oldObj.common = oldObj.common || {} as ioBroker.EnumCommon;
                oldObj.common.members = [objId];
                oldObj.type = 'enum';

                await this.props.socket.setObject(id, oldObj);
            } else if (!oldObj.common?.members?.includes(objId)) {
                oldObj.common = oldObj.common || {} as ioBroker.EnumCommon;
                oldObj.type = 'enum';
                oldObj.common.members = oldObj.common.members || [];
                // add the missing object
                oldObj.common.members.push(objId);
                oldObj.common.members.sort();
                await this.props.socket.setObject(id, oldObj);
            }
        }
    };

    private async loadObjects(objs: Record<string, ioBrokerObjectForExport>) {
        if (objs) {
            for (const id in objs) {
                if (!Object.prototype.hasOwnProperty.call(objs, id) || !objs[id]) {
                    continue;
                }
                const obj = objs[id];
                let enums = null;
                let val;
                let ack;
                if (obj && obj.common && obj.common.enums) {
                    enums = obj.common.enums;
                    delete obj.common.enums;
                } else {
                    enums = null;
                }

                if (obj.val || obj.val === 0) {
                    val = obj.val;
                    delete obj.val;
                }
                if (obj.ack !== undefined) {
                    ack = obj.ack;
                    delete obj.ack;
                }
                try {
                    await this.props.socket.setObject(id, obj);
                    enums && (await this._createAllEnums(enums, obj._id));
                    if (obj.type === 'state') {
                        if (val !== undefined && val !== null) {
                            try {
                                await this.props.socket.setState(obj._id, val, ack !== undefined ? ack : true);
                            } catch (e) {
                                window.alert(`Cannot set state "${obj._id} with ${val}": ${e}`);
                            }
                        } else {
                            try {
                                const state = await this.props.socket.getState(obj._id);
                                if (!state || state.val === null) {
                                    try {
                                        await this.props.socket.setState(
                                            obj._id,
                                            !obj.common || obj.common.def === undefined ? null : obj.common.def,
                                            true,
                                        );
                                    } catch (e) {
                                        window.alert(`Cannot set state "${obj._id}": ${e}`);
                                    }
                                }
                            } catch (e) {
                                window.alert(`Cannot read state "${obj._id}": ${e}`);
                            }
                        }
                    }
                } catch (error) {
                    window.alert(error);
                }
            }
        }
    }

    _getSelectedIdsForExport() {
        if (this.state.selected.length || this.state.selectedNonObject) {
            const result = [];
            const keys = Object.keys(this.objects);
            keys.sort();
            const id = this.state.selected[0] || this.state.selectedNonObject;
            const idDot = `${id}.`;
            const idLen = idDot.length;
            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                if (id === key || key.startsWith(idDot)) {
                    result.push(key);
                }
                if (key.substring(0, idLen) > idDot) {
                    break;
                }
            }

            return result;
        }
        return [];
    }

    /**
     * Exports the selected objects based on the given options and triggers file generation
     */
    private async _exportObjects(
        /**  Options to filter/reduce the output */
        options: {
            /** Whether all objects should be exported or only the selected ones */
            isAll?: boolean;
            /** Whether the output should be beautified */
            beautify?: boolean;
            /** Whether "system.repositories" should be excluded */
            excludeSystemRepositories?: boolean;
            /** Whether translations should be reduced to only the english value */
            excludeTranslations?: boolean;
            /** Whether the values of the states should be not included */
            noStatesByExportImport?: boolean;
        },
    ): Promise<void> {
        if (options.isAll) {
            generateFile('allObjects.json', this.objects, options);
            return;
        }
        if (!(this.state.selected.length || this.state.selectedNonObject)) {
            window.alert(this.props.t('ra_Save of objects-tree is not possible'));
            return;
        }
        const result: Record<string, ioBrokerObjectForExport> = {};
        const id = this.state.selected[0] || this.state.selectedNonObject;
        const ids = this._getSelectedIdsForExport();

        for (const key of ids) {
            result[key] = JSON.parse(JSON.stringify(this.objects[key])) as ioBrokerObjectForExport;
            // read states values
            if (result[key]?.type === 'state' && !options.noStatesByExportImport) {
                const state = await this.props.socket.getState(key);
                if (state) {
                    result[key].val = state.val;
                    result[key].ack = state.ack;
                }
            }
            // add enum information
            if (result[key].common) {
                const enums = this.getEnumsForId(key);
                if (enums) {
                    result[key].common.enums = enums;
                }
            }
        }

        generateFile(`${id}.json`, result, options);
    }

    renderExportDialog() {
        if (this.state.showExportDialog === false) {
            return null;
        }
        return <Dialog open={!0} maxWidth="lg">
            <DialogTitle>{this.props.t('ra_Select type of export')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {this.state.filter.expertMode || this.state.showAllExportOptions ? <>
                        {this.props.t('ra_You can export all objects or just the selected branch.')}
                        <br />
                        {this.props.t('ra_Selected %s object(s)', this.state.showExportDialog)}
                        <br />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.noStatesByExportImport}
                                    onChange={e => this.setState({ noStatesByExportImport: e.target.checked })}
                                />
                            }
                            label={this.props.t('ra_Do not export values of states')}
                        />
                        <br />
                        {this.props.t('These options can reduce the size of the export file:')}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.beautifyJsonExport}
                                    onChange={e => this.setState({ beautifyJsonExport: e.target.checked })}
                                />
                            }
                            label={this.props.t('Beautify JSON output')}
                        />
                        <br />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.excludeSystemRepositoriesFromExport}
                                    onChange={e =>
                                        this.setState({ excludeSystemRepositoriesFromExport: e.target.checked })}
                                />
                            }
                            label={this.props.t('Exclude system repositories from export JSON')}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.state.excludeTranslations}
                                    onChange={e => this.setState({ excludeTranslations: e.target.checked })}
                                />
                            }
                            label={this.props.t('Exclude translations (except english) from export JSON')}
                        />
                    </> : null}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {this.state.filter.expertMode || this.state.showAllExportOptions ? <Button
                    color="grey"
                    variant="outlined"
                    onClick={() => this.setState({ showExportDialog: false, showAllExportOptions: false }, () =>
                        this._exportObjects({
                            isAll: true,
                            noStatesByExportImport: this.state.noStatesByExportImport,
                            beautify: this.state.beautifyJsonExport,
                            excludeSystemRepositories: this.state.excludeSystemRepositoriesFromExport,
                            excludeTranslations: this.state.excludeTranslations,
                        }))}
                >
                    <span style={{ marginRight: 8 }}>{this.props.t('ra_All objects')}</span>
                    (
                    {Object.keys(this.objects).length}
                    )
                </Button> : <Button
                    color="grey"
                    variant="outlined"
                    startIcon={<IconExpert />}
                    onClick={() => this.setState({ showAllExportOptions: true })}
                >
                    {this.props.t('ra_Advanced options')}
                </Button>}
                <Button
                    color="primary"
                    variant="contained"
                    autoFocus
                    onClick={() =>
                        this.setState({ showExportDialog: false, showAllExportOptions: false }, () =>
                            this._exportObjects({
                                isAll: false,
                                noStatesByExportImport: this.state.noStatesByExportImport,
                                beautify: this.state.beautifyJsonExport,
                                excludeSystemRepositories: this.state.excludeSystemRepositoriesFromExport,
                                excludeTranslations: this.state.excludeTranslations,
                            }))}
                >
                    <span style={{ marginRight: 8 }}>{this.props.t('ra_Only selected')}</span>
                    (
                    {this.state.showExportDialog}
                    )
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ showExportDialog: false, showAllExportOptions: false })}
                    startIcon={<IconClose />}
                >
                    {this.props.t('ra_Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    private handleJsonUpload(evt: Event) {
        const target = evt.target as HTMLInputElement;
        const f = target.files?.length && target.files[0];
        if (f) {
            const r = new FileReader();
            r.onload = async e => {
                const contents = e.target?.result;
                try {
                    const json = JSON.parse(contents as string);
                    const len = Object.keys(json).length;
                    const id = json._id;
                    // it could be a single object or many objects
                    if (id === undefined && len) {
                        // many objects
                        await this.loadObjects(json as Record<string, ioBrokerObjectForExport>);
                        window.alert(this.props.t('ra_%s object(s) processed', len));
                    } else {
                        // it is only one object in form
                        // {
                        //    "_id": "xxx",
                        //   "common": "yyy",
                        //   "native": "zzz"
                        //   "val": JSON.stringify(value)
                        //   "ack": true
                        // }
                        if (!id) {
                            return window.alert(this.props.t('ra_Invalid structure'));
                        }
                        try {
                            let enums;
                            let val;
                            let ack;
                            if (json.common.enums) {
                                enums = json.common.enums;
                                delete json.common.enums;
                            }
                            if (json.val) {
                                val = json.val;
                                delete json.val;
                            }
                            if (json.ack !== undefined) {
                                ack = json.ack;
                                delete json.ack;
                            }
                            await this.props.socket.setObject(json._id, json);

                            if (json.type === 'state') {
                                if (val !== undefined && val !== null) {
                                    await this.props.socket.setState(json._id, val, ack === undefined ? true : ack);
                                } else {
                                    const state = await this.props.socket.getState(json._id);
                                    if (!state || state.val === null || state.val === undefined) {
                                        await this.props.socket.setState(
                                            json._id,
                                            json.common.def === undefined ? null : json.common.def,
                                            true,
                                        );
                                    }
                                }
                            }
                            if (enums) {
                                await this._createAllEnums(enums, json._id);
                            }

                            window.alert(this.props.t('ra_%s was imported', json._id));
                        } catch (err) {
                            window.alert(err);
                        }
                    }
                } catch (err) {
                    window.alert(err);
                }
                return null;
            };
            r.readAsText(f);
        } else {
            window.alert(this.props.t('ra_Failed to open JSON File'));
        }
    }

    toolTipObjectCreating = () => {
        const { t } = this.props;

        let value = [
            <div key={1}>{t('ra_Only following structures of objects are available:')}</div>,
            <div key={2}>{t('ra_Folder → State')}</div>,
            <div key={3}>{t('ra_Folder → Channel → State')}</div>,
            <div key={4}>{t('ra_Folder → Device → Channel → State')}</div>,
            <div key={5}>{t('ra_Device → Channel → State')}</div>,
            <div key={6}>{t('ra_Channel → State')}</div>,
            <div key={7} style={{ height: 10 }} />,
            <div key={8}>{t('ra_Non-experts may create new objects only in "0_userdata.0" or "alias.0".')}</div>,
            <div key={9}>
                {t(
                    'ra_The experts may create objects everywhere but from second level (e.g. "vis.0" or "javascript.0").',
                )}
            </div>,
        ];

        if (this.state.selected.length || this.state.selectedNonObject) {
            const id = this.state.selected[0] || this.state.selectedNonObject;
            if (id.split('.').length < 2 || (this.objects[id] && this.objects[id]?.type === 'state')) {
                // show default tooltip
            } else if (this.state.filter.expertMode) {
                switch (this.objects[id]?.type) {
                    case 'device':
                        value = [
                            <div key={1}>{t('ra_Only following structures of objects are available:')}</div>,
                            <div key={5}>{t('ra_Device → Channel → State')}</div>,
                            <div key={7} style={{ height: 10 }} />,
                            <div key={8}>
                                {t('ra_Non-experts may create new objects only in "0_userdata.0" or "alias.0".')}
                            </div>,
                            <div key={9}>
                                {t(
                                    'ra_The experts may create objects everywhere but from second level (e.g. "vis.0" or "javascript.0").',
                                )}
                            </div>,
                        ];
                        break;
                    case 'folder':
                        value = [
                            <div key={1}>{t('ra_Only following structures of objects are available:')}</div>,
                            <div key={2}>{t('ra_Folder → State')}</div>,
                            <div key={3}>{t('ra_Folder → Channel → State')}</div>,
                            <div key={4}>{t('ra_Folder → Device → Channel → State')}</div>,
                            <div key={7} style={{ height: 10 }} />,
                            <div key={8}>
                                {t('ra_Non-experts may create new objects only in "0_userdata.0" or "alias.0".')}
                            </div>,
                            <div key={9}>
                                {t(
                                    'ra_The experts may create objects everywhere but from second level (e.g. "vis.0" or "javascript.0").',
                                )}
                            </div>,
                        ];
                        break;
                    case 'channel':
                        value = [
                            <div key={1}>{t('ra_Only following structures of objects are available:')}</div>,
                            <div key={1}>{t('ra_Channel → State')}</div>,
                            <div key={7} style={{ height: 10 }} />,
                            <div key={8}>
                                {t('ra_Non-experts may create new objects only in "0_userdata.0" or "alias.0".')}
                            </div>,
                            <div key={9}>
                                {t(
                                    'ra_The experts may create objects everywhere but from second level (e.g. "vis.0" or "javascript.0").',
                                )}
                            </div>,
                        ];
                        break;
                    default:
                        break;
                }
            } else if (id.startsWith('alias.0') || id.startsWith('0_userdata')) {
                value = [
                    <div key={1}>{t('ra_Only following structures of objects are available:')}</div>,
                    <div key={2}>{t('ra_Folder → State')}</div>,
                    <div key={3}>{t('ra_Folder → Channel → State')}</div>,
                    <div key={4}>{t('ra_Folder → Device → Channel → State')}</div>,
                    <div key={5}>{t('ra_Device → Channel → State')}</div>,
                    <div key={6}>{t('ra_Channel → State')}</div>,
                    <div key={7} style={{ height: 10 }} />,
                    <div key={7}>
                        {t('ra_Non-experts may create new objects only in "0_userdata.0" or "alias.0".')}
                    </div>,
                    <div key={8}>
                        {t(
                            'ra_The experts may create objects everywhere but from second level (e.g. "vis.0" or "javascript.0").',
                        )}
                    </div>,
                ];
            }
        }

        return value.length ? value : t('ra_Add new child object to selected parent');
    };

    /**
     * Renders the toolbar.
     */
    getToolbar(): React.JSX.Element {
        let allowObjectCreation = false;
        if (this.state.selected.length || this.state.selectedNonObject) {
            const id = this.state.selected[0] || this.state.selectedNonObject;

            if (id.split('.').length < 2 || (this.objects[id] && this.objects[id].type === 'state')) {
                allowObjectCreation = false;
            } else if (this.state.filter.expertMode) {
                allowObjectCreation = true;
            } else if (id.startsWith('alias.0') || id.startsWith('0_userdata')) {
                allowObjectCreation = true;
            }
        }

        return <div
            style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                }}
            >
                <Tooltip
                    title={this.props.t('ra_Refresh tree')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div>
                        <IconButton
                            onClick={() => this.refreshComponent()}
                            disabled={this.state.updating}
                            size="large"
                        >
                            <RefreshIcon />
                        </IconButton>
                    </div>
                </Tooltip>
                {this.props.showExpertButton && !this.props.expertMode && (
                    <Tooltip
                        title={this.props.t('ra_expertMode')}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            key="expertMode"
                            color={this.state.filter.expertMode ? 'secondary' : 'default'}
                            onClick={() => this.onFilter('expertMode', !this.state.filter.expertMode)}
                            size="large"
                        >
                            <IconExpert />
                        </IconButton>
                    </Tooltip>
                )}
                {!this.props.disableColumnSelector && (
                    <Tooltip
                        title={this.props.t('ra_Configure')}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            key="columnSelector"
                            color={this.state.columnsAuto ? 'primary' : 'default'}
                            onClick={() => this.setState({ columnsSelectorShow: true })}
                            size="large"
                        >
                            <IconColumns />
                        </IconButton>
                    </Tooltip>
                )}
                {this.state.expandAllVisible && (
                    <Tooltip
                        title={this.props.t('ra_Expand all nodes')}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton key="expandAll" onClick={() => this.onExpandAll()} size="large">
                            <IconOpen />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip
                    title={this.props.t('ra_Collapse all nodes')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton key="collapseAll" onClick={() => this.onCollapseAll()} size="large">
                        <IconClosed />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('ra_Expand one step node')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        key="expandVisible"
                        color="primary"
                        onClick={() => this.onExpandVisible()}
                        size="large"
                    >
                        <Badge
                            badgeContent={this.state.depth}
                            color="secondary"
                            sx={(theme: Theme) => ({
                                badge: {
                                    right: 3,
                                    top: 3,
                                    border: `2px solid ${theme.palette.background.paper}`,
                                    padding: '0 4px',
                                },
                            })}
                        >
                            <IconOpen />
                        </Badge>
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('ra_Collapse one step node')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        key="collapseVisible"
                        color="primary"
                        onClick={() => this.onCollapseVisible()}
                        size="large"
                    >
                        <Badge
                            sx={(theme: Theme) => ({
                                badge: {
                                    right: 3,
                                    top: 3,
                                    border: `2px solid ${theme.palette.background.paper}`,
                                    padding: '0 4px',
                                },
                            })}
                            badgeContent={this.state.depth}
                            color="secondary"
                        >
                            <IconClosed />
                        </Badge>
                    </IconButton>
                </Tooltip>
                {this.props.objectStatesView && (
                    <Tooltip
                        title={this.props.t('ra_Toggle the states view')}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton onClick={() => this.onStatesViewVisible()} size="large">
                            <LooksOneIcon color={this.state.statesView ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>
                )}

                <Tooltip
                    title={this.props.t('ra_Show/Hide object descriptions')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        onClick={() => {
                            this.localStorage.setItem(
                                `${this.props.dialogName || 'App'}.desc`,
                                this.state.showDescription ? 'false' : 'true',
                            );
                            this.setState({ showDescription: !this.state.showDescription });
                        }}
                        size="large"
                    >
                        <TextFieldsIcon color={this.state.showDescription ? 'primary' : 'inherit'} />
                    </IconButton>
                </Tooltip>

                {this.props.objectAddBoolean ? <Tooltip
                    title={this.toolTipObjectCreating()}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <div>
                        <IconButton
                            disabled={!allowObjectCreation}
                            onClick={() => this.setState({
                                modalNewObj: {
                                    id: this.state.selected[0] || this.state.selectedNonObject,
                                },
                            })}
                            size="large"
                        >
                            <AddIcon />
                        </IconButton>
                    </div>
                </Tooltip> : null}

                {this.props.objectImportExport && <Tooltip
                    title={this.props.t('ra_Add objects tree from JSON file')}
                    componentsProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        onClick={() => {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            input.setAttribute('id', 'files');
                            input.setAttribute('opacity', '0');
                            input.addEventListener('change', (e: Event) => this.handleJsonUpload(e), false);
                            input.click();
                        }}
                        size="large"
                    >
                        <PublishIcon />
                    </IconButton>
                </Tooltip>}
                {this.props.objectImportExport &&
                    (!!this.state.selected.length || this.state.selectedNonObject) &&
                    <Tooltip
                        title={this.props.t('ra_Save objects tree as JSON file')}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            onClick={() =>
                                this.setState({ showExportDialog: this._getSelectedIdsForExport().length })}
                            size="large"
                        >
                            <PublishIcon style={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                    </Tooltip>}
            </div>
            {!!this.props.objectBrowserEditObject && (
                <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
                    {`${this.props.t('ra_Objects')}: ${Object.keys(this.info.objects).length}, ${this.props.t(
                        'ra_States',
                    )}: ${
                        Object.keys(this.info.objects).filter(el => this.info.objects[el].type === 'state').length
                    }`}
                </div>
            )}
            {this.props.objectEditBoolean && <Tooltip
                title={this.props.t('ra_Edit custom config')}
                componentsProps={{ popper: { sx: styles.tooltip } }}
            >
                <IconButton
                    onClick={() => {
                        // get all visible states
                        const ids = this.root ? getVisibleItems(this.root, 'state', this.objects) : [];

                        if (ids.length) {
                            this.pauseSubscribe(true);

                            if (ids.length === 1) {
                                this.localStorage.setItem(
                                    `${this.props.dialogName || 'App'}.objectSelected`,
                                    this.state.selected[0],
                                );
                                this.props.router?.doNavigate(null, 'custom', this.state.selected[0]);
                            }
                            this.setState({ customDialog: ids, customDialogAll: true });
                        } else {
                            this.setState({ toast: this.props.t('ra_please select object') });
                        }
                    }}
                    size="large"
                >
                    <BuildIcon />
                </IconButton>
            </Tooltip>}
        </div>;
    }

    private toggleExpanded(id: string): void {
        const expanded = JSON.parse(JSON.stringify(this.state.expanded));
        const pos = expanded.indexOf(id);
        if (pos === -1) {
            expanded.push(id);
            expanded.sort();
        } else {
            expanded.splice(pos, 1);
        }

        this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectExpanded`, JSON.stringify(expanded));

        this.setState({ expanded });
    }

    private onCopy(e: React.MouseEvent, text: string) {
        e.stopPropagation();
        e.preventDefault();
        Utils.copyToClipboard(text);
        if (text.length < 50) {
            this.setState({ toast: this.props.t('ra_Copied %s', text) });
        } else {
            this.setState({ toast: this.props.t('ra_Copied') });
        }
    }

    renderTooltipAccessControl = (acl: ioBroker.StateACL): null | React.JSX.Element => {
        // acl ={object,state,owner,ownerGroup}
        if (!acl) {
            return null;
        }
        const check = [
            {
                value: '0x400',
                valueNum: 0x400,
                title: 'read',
                group: 'Owner',
            },
            {
                value: '0x200',
                valueNum: 0x200,
                title: 'write',
                group: 'Owner',
            },
            {
                value: '0x40',
                valueNum: 0x40,
                title: 'read',
                group: 'Group',
            },
            {
                value: '0x20',
                valueNum: 0x20,
                title: 'write',
                group: 'Group',
            },
            {
                value: '0x4',
                valueNum: 0x4,
                title: 'read',
                group: 'Everyone',
            },
            {
                value: '0x2',
                valueNum: 0x2,
                title: 'write',
                group: 'Everyone',
            },
        ];
        const arrayTooltipText = [];
        const funcRenderStateObject = (value: 'object' | 'state') => {
            const rights: number = acl[value];
            check.forEach((el, i) => {
                // eslint-disable-next-line no-bitwise
                if (rights & el.valueNum) {
                    arrayTooltipText.push(<span key={value + i}>
                        {this.texts[`acl${el.group}_${el.title}_${value}`]}
                        ,
                        <span
                            style={value === 'object'
                                ? styles.rightsObject
                                : styles.rightsState}
                        >
                            {el.value}
                        </span>
                    </span>);
                }
            });
        };

        arrayTooltipText.push(<span key="group">
            {`${this.texts.ownerGroup}: ${(acl.ownerGroup || '').replace('system.group.', '')}`}
        </span>);
        arrayTooltipText.push(<span key="owner">
            {`${this.texts.ownerUser}: ${(acl.owner || '').replace('system.user.', '')}`}
        </span>);
        funcRenderStateObject('object');
        if (acl.state) {
            funcRenderStateObject('state');
        }

        return arrayTooltipText.length ? <span style={styles.tooltipAccessControl}>
            {arrayTooltipText.map(el => el)}
        </span> : null;
    };

    renderColumnButtons(
        id: string,
        item: TreeItem,
    ) {
        if (!item.data.obj) {
            return this.props.onObjectDelete || this.props.objectEditOfAccessControl ? <div style={styles.buttonDiv}>
                {this.state.filter.expertMode && this.props.objectEditOfAccessControl ? <IconButton
                    style={{
                        ...styles.cellButtonsButton,
                        ...styles.cellButtonsEmptyButton,
                        ...styles.cellButtonMinWidth,
                    }}
                    onClick={() =>
                        this.setState({ modalEditOfAccess: true, modalEditOfAccessObjData: item.data })}
                    size="large"
                >
                    ---
                </IconButton> : null}
                {this.props.onObjectDelete && item.children && item.children.length ? <IconButton
                    style={{ ...styles.cellButtonsButton, ...styles.cellButtonsButtonAlone }}
                    size="small"
                    aria-label="delete"
                    title={this.texts.deleteObject}
                    onClick={() => {
                        // calculate the number of children
                        const keys = Object.keys(this.objects);
                        keys.sort();
                        let count = 0;
                        const start = `${id}.`;
                        for (let i = 0; i < keys.length; i++) {
                            if (keys[i].startsWith(start)) {
                                count++;
                            } else if (keys[i] > start) {
                                break;
                            }
                        }

                        this.props.onObjectDelete && this.props.onObjectDelete(id, !!item.children?.length, false, count + 1);
                    }}
                >
                    <IconDelete style={styles.cellButtonsButtonIcon} />
                </IconButton> : null}
            </div> : null;
        }

        item.data.aclTooltip = item.data.aclTooltip || this.renderTooltipAccessControl(item.data.obj.acl as ioBroker.StateACL);

        const acl = item.data.obj.acl
            ? item.data.obj.type === 'state'
                ? item.data.obj.acl.state
                : item.data.obj.acl.object
            : 0;
        const aclSystemConfig =
            item.data.obj.acl &&
            (item.data.obj.type === 'state'
                ? this.systemConfig.common.defaultNewAcl.state
                : this.systemConfig.common.defaultNewAcl.object);

        const showEdit = this.state.filter.expertMode || ObjectBrowserClass.isNonExpertId(item.data.id);

        return [
            this.state.filter.expertMode && this.props.objectEditOfAccessControl ? <Tooltip
                key="acl"
                title={item.data.aclTooltip}
                componentsProps={{ popper: { sx: styles.tooltip } }}
            >
                <IconButton
                    style={styles.cellButtonMinWidth}
                    onClick={() => this.setState({ modalEditOfAccess: true, modalEditOfAccessObjData: item.data })}
                    size="large"
                >
                    <div style={styles.aclText}>
                        {Number.isNaN(Number(acl))
                            ? Number(aclSystemConfig).toString(16)
                            : Number(acl).toString(16)}
                    </div>
                </IconButton>
            </Tooltip> :
                <div key="aclEmpty" style={styles.cellButtonMinWidth} />,

            showEdit ? <IconButton
                key="edit"
                style={styles.cellButtonsButton}
                size="small"
                aria-label="edit"
                title={this.texts.editObject}
                onClick={() => {
                    this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectSelected`, id);
                    this.setState({ editObjectDialog: id, editObjectAlias: false });
                }}
            >
                <IconEdit style={styles.cellButtonsButtonIcon} />
            </IconButton> :
                <div key="editDisabled" style={styles.cellButtonsButton} />,

            this.props.onObjectDelete && (item.children?.length || !item.data.obj.common?.dontDelete) ? <IconButton
                key="delete"
                style={styles.cellButtonsButton}
                size="small"
                aria-label="delete"
                onClick={() => {
                    const keys = Object.keys(this.objects);
                    keys.sort();
                    let count = 0;
                    const start = `${id}.`;
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i].startsWith(start)) {
                            count++;
                        } else if (keys[i] > start) {
                            break;
                        }
                    }
                    this.props.onObjectDelete && this.props.onObjectDelete(
                        id,
                        !!item.children?.length,
                        !item.data.obj?.common?.dontDelete,
                        count,
                    );
                }}
                title={this.texts.deleteObject}
            >
                <IconDelete style={styles.cellButtonsButtonIcon} />
            </IconButton> : null,

            this.props.objectCustomDialog &&
                this.info.hasSomeCustoms &&
                item.data.obj.type === 'state' &&
                // @ts-expect-error deprecated from js-controller 6
                item.data.obj.common?.type !== 'file' ? <IconButton
                    xs={Object.assign(
                        {},
                        styles.cellButtonsButton,
                        item.data.hasCustoms
                            ? this.styles.cellButtonsButtonWithCustoms
                            : styles.cellButtonsButtonWithoutCustoms,
                    )}
                    key="custom"
                    size="small"
                    aria-label="config"
                    title={this.texts.customConfig}
                    onClick={() => {
                        this.localStorage.setItem(`${this.props.dialogName || 'App'}.objectSelected`, id);

                        this.pauseSubscribe(true);
                        this.props.router?.doNavigate(null, 'customs', id);
                        this.setState({ customDialog: [id], customDialogAll: false });
                    }}
                >
                    <IconConfig style={styles.cellButtonsButtonIcon} />
                </IconButton> : null,
        ];
    }

    private readHistory(id: string) {
        /* interface GetHistoryOptions {
            instance?: string;
            start?: number;
            end?: number;
            step?: number;
            count?: number;
            from?: boolean;
            ack?: boolean;
            q?: boolean;
            addID?: boolean;
            limit?: number;
            ignoreNull?: boolean;
            sessionId?: any;
            aggregate?: 'minmax' | 'min' | 'max' | 'average' | 'total' | 'count' | 'none';
        } */
        if (
            window.sparkline &&
            this.defaultHistory &&
            this.objects[id]?.common?.custom &&
            this.objects[id].common.custom[this.defaultHistory]
        ) {
            const now = new Date();
            now.setHours(now.getHours() - 24);
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            const nowMs = now.getTime();

            this.props.socket
                .getHistory(id, {
                    instance: this.defaultHistory,
                    start: nowMs,
                    end: Date.now(),
                    step: 3600000,
                    from: false,
                    ack: false,
                    q: false,
                    addID: false,
                    aggregate: 'minmax',
                })
                .then(values => {
                    const sparks: HTMLDivElement[] =
                        window.document.getElementsByClassName('sparkline') as any as HTMLDivElement[];

                    for (let s = 0; s < sparks.length; s++) {
                        if (sparks[s].dataset.id === id) {
                            const v = prepareSparkData(values, nowMs);

                            window.sparkline.sparkline(sparks[s], v);
                            break;
                        }
                    }
                })
                .catch(e => console.warn(`Cannot read history: ${e}`));
        }
    }

    private getTooltipInfo(id: string, cb?: () => void) {
        const obj = this.objects[id];
        const state = this.states[id];
        const classes = styles;

        const { valFull, fileViewer } = formatValue({
            state,
            obj: obj as ioBroker.StateObject,
            texts: this.texts,
            dateFormat: this.props.dateFormat || this.systemConfig.common.dateFormat,
            isFloatComma: this.props.isFloatComma === undefined ? this.systemConfig.common.isFloatComma : this.props.isFloatComma,
            full: true,
        });
        const valFullRx: React.JSX.Element[] = [];

        valFull?.forEach(_item => {
            if (_item.t === this.texts.quality && state.q) {
                valFullRx.push(<div style={classes.cellValueTooltipBoth} key={_item.t}>
                    {_item.t}
                    :&nbsp;
                    {_item.v}
                </div>);
                // <div style={styles.cellValueTooltipValue} key={item.t + '_v'}>{item.v}</div>,
                !_item.nbr && valFullRx.push(<br key={`${_item.t}_br`} />);
            } else {
                valFullRx.push(<div style={classes.cellValueTooltipTitle} key={_item.t}>
                    {_item.t}
                    :&nbsp;
                </div>);
                valFullRx.push(<div style={classes.cellValueTooltipValue} key={`${_item.t}_v`}>
                    {_item.v}
                </div>);
                !_item.nbr && valFullRx.push(<br key={`${_item.t}_br`} />);
            }
        });

        if (fileViewer === 'image') {
            valFullRx.push(<img
                style={classes.cellValueTooltipImage}
                src={state.val as string}
                alt={id}
            />);
        } else if (
            this.defaultHistory &&
            this.objects[id]?.common?.custom &&
            this.objects[id].common.custom[this.defaultHistory]
        ) {
            valFullRx.push(<svg
                key="sparkline"
                className="sparkline"
                data-id={id}
                style={{ fill: '#3d85de' }}
                width="200"
                height="30"
                strokeWidth="3"
            />);
        }

        this.setState({ tooltipInfo: { el: valFullRx, id } }, () => cb && cb());
    }

    private renderColumnValue(
        id: string,
        item: TreeItem,
    ): React.JSX.Element | null {
        const obj = item.data.obj;
        if (!obj || !this.states) {
            return null;
        }

        if (obj.common?.type === 'file') {
            return <Box component="div" sx={{ ...styles.cellValueText, ...styles.cellValueFile }}>[file]</Box>;
        }
        if (!this.states[id]) {
            if (obj.type === 'state') {
                // we are waiting for state
                !this.recordStates.includes(id) && this.recordStates.push(id);
                this.states[id] = { val: null } as ioBroker.State;
                this.subscribe(id);
            }
            return null;
        }
        !this.recordStates.includes(id) && this.recordStates.push(id);

        const state = this.states[id];

        let info = item.data.state;
        if (!info) {
            const { valText } = formatValue({
                state,
                obj: obj as ioBroker.StateObject,
                texts: this.texts,
                dateFormat: this.props.dateFormat || this.systemConfig.common.dateFormat,
                isFloatComma: this.props.isFloatComma === undefined ? this.systemConfig.common.isFloatComma : this.props.isFloatComma,
            });
            const valTextRx: React.JSX.Element[] = [];
            item.data.state = { valTextRx };

            const copyText = valText.v || '';
            valTextRx.push(<span className={`newValueBrowser-${this.props.themeType || 'light'}`} key={`${valText.v.toString()}valText`}>
                {valText.v.toString()}
            </span>);
            valText.u && valTextRx.push(<span
                className={`newValueBrowser-${this.props.themeType || 'light'}`}
                style={styles.cellValueTextUnit}
                key={`${valText.v.toString()}unit`}
            >
                {valText.u}
            </span>);
            valText.s !== undefined && valTextRx.push(<span
                style={styles.cellValueTextState}
                className={`newValueBrowser-${this.props.themeType || 'light'}`}
                key={`${valText.v.toString()}states`}
            >
                (
                {valText.s}
                )
            </span>);
            valTextRx.push(<IconCopy
                className="copyButton"
                style={this.styles.iconCopy}
                onClick={e => this.onCopy(e, copyText)}
                key="cc"
            />);
            // <IconEdit className="copyButton" style={{{ ...styles.cellButtonsValueButton, styles.cellButtonsValueButtonEdit)} key="ce" />

            info = item.data.state;
        }

        info.style = getValueStyle({ state, isExpertMode: this.state.filter.expertMode, isButton: item.data.button });

        let val: React.JSX.Element[] = info.valTextRx as React.JSX.Element[];
        if (!this.state.filter.expertMode && item.data.button) {
            val = [<PressButtonIcon style={styles.cellValueButton} />];
        }

        return <Tooltip
            key="value"
            title={this.state.tooltipInfo?.el || 'Calculating...'}
            componentsProps={{
                popper: { sx: styles.cellValueTooltipBox },
                tooltip: { sx: styles.cellValueTooltip },
            }}
            onOpen={() => this.getTooltipInfo(id, () => this.readHistory(id))}
            onClose={() => this.state.tooltipInfo?.id === id && this.setState({ tooltipInfo: null })}
        >
            <Box component="div" style={info.style} sx={styles.cellValueText}>
                {val}
            </Box>
        </Tooltip>;
    }

    private _syncEnum(
        id: string,
        enumIds: string[],
        newArray: string[],
        cb: () => void,
    ): void {
        if (!enumIds || !enumIds.length) {
            cb && cb();
            return;
        }
        const enumId = enumIds.pop() || '';
        const promises = [];
        if (this.info.objects[enumId]?.common) {
            if (this.info.objects[enumId].common.members?.length) {
                const pos = this.info.objects[enumId].common.members.indexOf(id);
                if (pos !== -1 && !newArray.includes(enumId)) {
                    // delete from members
                    const obj = JSON.parse(JSON.stringify(this.info.objects[enumId]));
                    obj.common.members.splice(pos, 1);
                    promises.push(
                        this.props.socket
                            .setObject(enumId, obj)
                            .then(() => (this.info.objects[enumId] = obj))
                            .catch(e => this.showError(e)),
                    );
                }
            }

            // add to it
            if (newArray.includes(enumId) && !this.info.objects[enumId].common.members?.includes(id)) {
                // add to object
                const obj = JSON.parse(JSON.stringify(this.info.objects[enumId]));
                obj.common.members = obj.common.members || [];
                obj.common.members.push(id);
                obj.common.members.sort();
                promises.push(
                    this.props.socket
                        .setObject(enumId, obj)
                        .then(() => (this.info.objects[enumId] = obj))
                        .catch(e => this.showError(e)),
                );
            }
        }

        Promise.all(promises)
            .then(() => {
                setTimeout(() => this._syncEnum(id, enumIds, newArray, cb), 0);
            });
    }

    private syncEnum(
        id: string,
        enumName: 'func' | 'room',
        newArray: string[],
    ): Promise<void> {
        const toCheck = [...this.info[enumName === 'func' ? 'funcEnums' : 'roomEnums']];

        return new Promise<void>(resolve => {
            this._syncEnum(id, toCheck, newArray, () => {
                // force update of an object
                resolve();
            });
        });
    }

    private renderEnumDialog(): React.JSX.Element | null {
        if (!this.state.enumDialog) {
            return null;
        }
        const type = this.state.enumDialog.type;
        const item = this.state.enumDialog.item;
        const itemEnums: string[] = this.state.enumDialogEnums as string[];
        const enumsOriginal = this.state.enumDialog.enumsOriginal;

        const enums = (type === 'room' ? this.info.roomEnums : this.info.funcEnums)
            .map(id => ({
                name: getName(this.objects[id]?.common?.name || id.split('.').pop() || '', this.props.lang),
                value: id,
                icon: getSelectIdIconFromObjects(this.objects, id, this.imagePrefix),
            }))
            .sort((a, b) => (a.name > b.name ? 1 : -1));

        enums.forEach(_item => {
            if (_item.icon && typeof _item.icon === 'string') {
                _item.icon = <Box style={styles.enumIconDiv}>
                    <img src={_item.icon} style={styles.enumIcon} alt={_item.name} />
                </Box>;
            }
        });

        // const hasIcons = !!enums.find(item => item.icon);

        return <Dialog
            sx={{ '& .MuiPaper-root': styles.enumDialog }}
            onClose={() => this.setState({ enumDialog: null })}
            aria-labelledby="enum-dialog-title"
            open={!0} // true
        >
            <DialogTitle id="enum-dialog-title">
                {type === 'func' ? this.props.t('ra_Define functions') : this.props.t('ra_Define rooms')}
                <Fab
                    sx={styles.enumButton}
                    color="primary"
                    disabled={enumsOriginal === JSON.stringify(itemEnums)}
                    size="small"
                    onClick={() => this.syncEnum(item.data.id, type, itemEnums).then(() =>
                        this.setState({ enumDialog: null, enumDialogEnums: null }))}
                >
                    <IconCheck />
                </Fab>
            </DialogTitle>
            <List sx={{ '&.MuiList-root': styles.enumList }}>
                {enums.map(_item => {
                    let id;
                    let name;
                    let icon;

                    if (typeof _item === 'object') {
                        id = _item.value;
                        name = _item.name;
                        icon = _item.icon;
                    } else {
                        id = _item;
                        name = _item;
                    }
                    const labelId = `checkbox-list-label-${id}`;

                    return <ListItem
                        sx={styles.headerCellSelectItem}
                        key={id}
                        onClick={() => {
                            const pos = itemEnums.indexOf(id);
                            const enumDialogEnums = JSON.parse(JSON.stringify(this.state.enumDialogEnums));
                            if (pos === -1) {
                                enumDialogEnums.push(id);
                                enumDialogEnums.sort();
                            } else {
                                enumDialogEnums.splice(pos, 1);
                            }
                            this.setState({ enumDialogEnums });
                        }}
                    >
                        <ListItemIcon sx={{ '&.MuiListItemIcon-root': styles.enumCheckbox }}>
                            <Checkbox
                                edge="start"
                                checked={itemEnums.includes(id)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': labelId }}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId}>{name}</ListItemText>
                        {icon ? <ListItemSecondaryAction>{icon}</ListItemSecondaryAction> : null}
                    </ListItem>;
                })}
            </List>
        </Dialog>;
    }

    private renderEditRoleDialog(): React.JSX.Element | null {
        if (!this.state.roleDialog || !this.props.objectBrowserEditRole) {
            return null;
        }

        if (this.state.roleDialog && this.props.objectBrowserEditRole) {
            const ObjectBrowserEditRole = this.props.objectBrowserEditRole;

            return <ObjectBrowserEditRole
                key="objectBrowserEditRole"
                id={this.state.roleDialog}
                socket={this.props.socket}
                t={this.props.t}
                roles={this.info.roles}
                onClose={(obj?: ioBroker.Object | null | undefined) => {
                    if (obj) {
                        this.info.objects[this.state.roleDialog as string] = obj;
                    }
                    this.setState({ roleDialog: null });
                }}
            />;
        }
        return null;
    }

    private onColumnsEditCustomDialogClose(isSave?: boolean) {
        // cannot be null
        const customColumnDialog: {
            value: boolean | number | string;
            type: 'boolean' | 'number' | 'string';
            initValue: boolean | number | string;
        } = this.customColumnDialog as {
            value: boolean | number | string;
            type: 'boolean' | 'number' | 'string';
            initValue: boolean | number | string;
        };

        if (isSave) {
            let value: string | number | boolean = customColumnDialog.value;
            if (customColumnDialog.type === 'boolean') {
                value = value === 'true' || value === true;
            } else if (customColumnDialog.type === 'number') {
                value = parseFloat(value as any as string);
            }
            this.customColumnDialog = null;
            this.props.socket
                .getObject(this.state.columnsEditCustomDialog?.obj?._id || '')
                .then(obj => {
                    if (obj && ObjectBrowserClass.setCustomValue(obj, this.state.columnsEditCustomDialog?.it as AdapterColumn, value)) {
                        return this.props.socket.setObject(obj._id, obj);
                    }
                    throw new Error(this.props.t('ra_Cannot update attribute, because not found in the object'));
                })
                .then(() => this.setState({ columnsEditCustomDialog: null }))
                .catch(e => this.showError(e));
        } else {
            this.customColumnDialog = null;
            this.setState({ columnsEditCustomDialog: null });
        }
    }

    private renderColumnsEditCustomDialog() {
        if (!this.state.columnsEditCustomDialog) {
            return null;
        }
        if (!this.customColumnDialog) {
            const value = ObjectBrowserClass.getCustomValue(
                this.state.columnsEditCustomDialog.obj,
                this.state.columnsEditCustomDialog.it,
            );
            this.customColumnDialog = {
                type: (this.state.columnsEditCustomDialog.it.type || typeof value) as 'boolean' | 'string' | 'number',
                initValue: (value === null || value === undefined ? '' : value).toString(),
                value: (value === null || value === undefined ? '' : value).toString(),
            };
        }

        return <Dialog
            onClose={() => this.setState({ columnsEditCustomDialog: null })}
            maxWidth="md"
            aria-labelledby="custom-dialog-title"
            open={!0}
        >
            <DialogTitle id="custom-dialog-title">
                {`${this.props.t('ra_Edit object field')}: ${this.state.columnsEditCustomDialog.obj._id}`}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {this.customColumnDialog.type === 'boolean' ? <FormControlLabel
                        control={
                            <Checkbox
                                onKeyUp={e =>
                                    e.key === 'Enter' && this.onColumnsEditCustomDialogClose(true)}
                                defaultChecked={this.customColumnDialog.value === 'true'}
                                onChange={e => {
                                    const customColumnDialog: {
                                        value: boolean | number | string;
                                        type: 'boolean' | 'number' | 'string';
                                        initValue: boolean | number | string;
                                    } = this.customColumnDialog as {
                                        value: boolean | number | string;
                                        type: 'boolean' | 'number' | 'string';
                                        initValue: boolean | number | string;
                                    };

                                    customColumnDialog.value = e.target.checked.toString();
                                    const changed =
                                        customColumnDialog.value !== customColumnDialog.initValue;
                                    if (changed === !this.state.customColumnDialogValueChanged) {
                                        this.setState({ customColumnDialogValueChanged: changed });
                                    }
                                }}
                            />
                        }
                        label={`${this.state.columnsEditCustomDialog.it.name} (${this.state.columnsEditCustomDialog.it.pathText})`}
                    /> : <TextField
                        variant="standard"
                        defaultValue={this.customColumnDialog.value}
                        fullWidth
                        onKeyUp={e => e.key === 'Enter' && this.onColumnsEditCustomDialogClose(true)}
                        label={`${this.state.columnsEditCustomDialog.it.name} (${this.state.columnsEditCustomDialog.it.pathText})`}
                        onChange={e => {
                            const customColumnDialog: {
                                value: boolean | number | string;
                                type: 'boolean' | 'number' | 'string';
                                initValue: boolean | number | string;
                            } = this.customColumnDialog as {
                                value: boolean | number | string;
                                type: 'boolean' | 'number' | 'string';
                                initValue: boolean | number | string;
                            };

                            customColumnDialog.value = e.target.value;
                            const changed =
                                customColumnDialog.value !== customColumnDialog.initValue;
                            if (changed === !this.state.customColumnDialogValueChanged) {
                                this.setState({ customColumnDialogValueChanged: changed });
                            }
                        }}
                        autoFocus
                    />}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    onClick={() => this.onColumnsEditCustomDialogClose(true)}
                    disabled={!this.state.customColumnDialogValueChanged}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {this.props.t('ra_Update')}
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.onColumnsEditCustomDialogClose()}
                    startIcon={<IconClose />}
                >
                    {this.props.t('ra_Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    private static getCustomValue(
        obj: ioBroker.Object,
        it: AdapterColumn,
    ): string | number | boolean | null {
        if (obj?._id?.startsWith(`${it.adapter}.`) && it.path.length > 1) {
            const p = it.path;
            let value;
            const anyObj: Record<string, any> = obj as Record<string, any>;
            if (anyObj[p[0]] && typeof anyObj[p[0]] === 'object') {
                if (p.length === 2) {
                    // most common case
                    value = anyObj[p[0]][p[1]];
                } else if (p.length === 3) {
                    value = anyObj[p[0]][p[1]] && typeof anyObj[p[0]][p[1]] === 'object' ? anyObj[p[0]][p[1]][p[2]] : null;
                } else if (p.length === 4) {
                    value =
                        anyObj[p[0]][p[1]] && typeof anyObj[p[0]][p[1]] === 'object' && anyObj[p[0]][p[1]][p[2]]
                            ? anyObj[p[0]][p[1]][p[2]][p[3]]
                            : null;
                } else if (p.length === 5) {
                    value =
                        anyObj[p[0]][p[1]] &&
                        typeof anyObj[p[0]][p[1]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]] &&
                        anyObj[p[0]][p[1]][p[2]][p[3]]
                            ? anyObj[p[0]][p[1]][p[2]][p[3]][p[4]]
                            : null;
                } else if (p.length === 6) {
                    value =
                        anyObj[p[0]][p[1]] &&
                        typeof anyObj[p[0]][p[1]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]] &&
                        anyObj[p[0]][p[1]][p[2]][p[3]] &&
                        anyObj[p[0]][p[1]][p[2]][p[3]][p[4]]
                            ? anyObj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]]
                            : null;
                }
                if (value === undefined || value === null) {
                    return null;
                }
                return value;
            }
        }

        return null;
    }

    private static setCustomValue(
        obj: ioBroker.Object,
        it: AdapterColumn,
        value: string | number | boolean,
    ): boolean {
        if (obj?._id?.startsWith(`${it.adapter}.`) && it.path.length > 1) {
            const p = it.path;
            const anyObj: Record<string, any> = obj as Record<string, any>;
            if (anyObj[p[0]] && typeof anyObj[p[0]] === 'object') {
                if (p.length === 2) {
                    // most common case
                    anyObj[p[0]][p[1]] = value;
                    return true;
                }
                if (p.length === 3) {
                    if (anyObj[p[0]][p[1]] && typeof anyObj[p[0]][p[1]] === 'object') {
                        anyObj[p[0]][p[1]][p[2]] = value;
                        return true;
                    }
                } else if (p.length === 4) {
                    if (
                        anyObj[p[0]][p[1]] &&
                        typeof anyObj[p[0]][p[1]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]] &&
                        typeof anyObj[p[0]][p[1]][p[2]] === 'object'
                    ) {
                        anyObj[p[0]][p[1]][p[2]][p[3]] = value;
                        return true;
                    }
                } else if (p.length === 5) {
                    if (
                        anyObj[p[0]][p[1]] &&
                        typeof anyObj[p[0]][p[1]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]] &&
                        typeof anyObj[p[0]][p[1]][p[2]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]][p[3]] &&
                        typeof anyObj[p[0]][p[1]][p[2]][p[3]] === 'object'
                    ) {
                        anyObj[p[0]][p[1]][p[2]][p[3]][p[4]] = value;
                        return true;
                    }
                } else if (p.length === 6) {
                    if (
                        anyObj[p[0]][p[1]] &&
                        typeof anyObj[p[0]][p[1]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]] &&
                        typeof anyObj[p[0]][p[1]][p[2]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]][p[3]] &&
                        typeof anyObj[p[0]][p[1]][p[2]][p[3]] === 'object' &&
                        anyObj[p[0]][p[1]][p[2]][p[3]][p[4]] &&
                        typeof anyObj[p[0]][p[1]][p[2]][p[3]][p[4]] === 'object'
                    ) {
                        anyObj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]] = value;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Renders a custom value.
     */
    renderCustomValue(
        obj: ioBroker.Object,
        it: AdapterColumn,
        item: TreeItem,
    ): React.JSX.Element | null {
        const text = ObjectBrowserClass.getCustomValue(obj, it);
        if (text !== null && text !== undefined) {
            if (it.edit && !this.props.notEditable && (!it.objTypes || it.objTypes.includes(obj.type))) {
                return <Box
                    component="div"
                    style={{
                        ...styles.columnCustom,
                        ...styles.columnCustomEditable,
                        ...styles[`columnCustom_${it.align}`],
                    }}
                    onClick={() => this.setState({
                        columnsEditCustomDialog: { item, it, obj },
                        customColumnDialogValueChanged: false,
                    })}
                >
                    {text}
                </Box>;
            }
            return <Box
                component="div"
                style={{
                    ...styles.columnCustom,
                    ...styles[`columnCustom_${it.align}`],
                }}
            >
                {text}
            </Box>;
        }
        return null;
    }

    /**
     * Renders a leaf.
     */
    renderLeaf(
        item: TreeItem,
        isExpanded: boolean | undefined,
        counter: { count: number },
    ): React.JSX.Element {
        const id = item.data.id;
        counter.count++;
        isExpanded = isExpanded === undefined ? this.state.expanded.includes(id) : isExpanded;

        // icon
        let iconFolder;
        const obj = item.data.obj;
        const itemType = obj?.type;

        if (
            item.children ||
            itemType === 'folder' ||
            itemType === 'device' ||
            itemType === 'channel' ||
            itemType === 'meta'
        ) {
            iconFolder = isExpanded ?
                <IconOpen style={this.styles.cellIdIconFolder} onClick={() => this.toggleExpanded(id)} /> :
                <IconClosed style={this.styles.cellIdIconFolder} onClick={() => this.toggleExpanded(id)} />;
        } else if (obj && obj.common && obj.common.write === false && obj.type === 'state') {
            iconFolder = <IconDocumentReadOnly style={this.styles.cellIdIconDocument} />;
        } else {
            iconFolder = <IconDocument style={this.styles.cellIdIconDocument} />;
        }

        let iconItem = null;
        if (item.data.icon) {
            if (typeof item.data.icon === 'string') {
                if (item.data.icon.length < 3) {
                    iconItem = <span className="iconOwn" style={styles.cellIdIconOwn}>{item.data.icon}</span>; // utf-8 char
                } else {
                    iconItem = <Icon
                        style={styles.cellIdIconOwn}
                        className="iconOwn"
                        src={item.data.icon}
                        alt=""
                    />;
                }
            } else {
                iconItem = item.data.icon;
            }
        }

        const common = obj?.common;

        const typeImg = (obj?.type && ITEM_IMAGES[obj.type]) || <div className="itemIcon" />;

        const paddingLeft = this.levelPadding * (item.data.level || 0);

        // recalculate rooms and function names if the language changed
        if (item.data.lang !== this.props.lang) {
            const { rooms, per } = findRoomsForObject(this.info, id, this.props.lang);
            item.data.rooms = rooms.join(', ');
            item.data.per = per;
            const { funcs, pef } = findFunctionsForObject(this.info, id, this.props.lang);
            item.data.funcs = funcs.join(', ');
            item.data.pef = pef;
            item.data.lang = this.props.lang;
        }

        const checkbox =
            this.props.multiSelect &&
            this.objects[id] &&
            (!this.props.types || this.props.types.includes(this.objects[id].type)) ?
                <Checkbox style={styles.checkBox} checked={this.state.selected.includes(id)} /> : null;

        let valueEditable =
            !this.props.notEditable &&
            itemType === 'state' &&
            (this.state.filter.expertMode || common?.write !== false);
        if (this.props.objectBrowserViewFile && common?.type === 'file') {
            valueEditable = true;
        }
        const enumEditable =
            !this.props.notEditable &&
            this.objects[id] &&
            (this.state.filter.expertMode || itemType === 'state' || itemType === 'channel' || itemType === 'device');
        const checkVisibleObjectType =
            this.state.statesView && (itemType === 'state' || itemType === 'channel' || itemType === 'device');
        let newValue = '';
        const newValueTitle = [];
        if (checkVisibleObjectType) {
            newValue = this.states[id]?.from;
            if (newValue === undefined) {
                newValue = '&nbsp;';
            } else {
                newValue = newValue ? newValue.replace(/^system\.adapter\.|^system\./, '') : '';
                newValueTitle.push(`${this.texts.stateChangedFrom} ${newValue}`);
            }
            if (obj?.user) {
                const user = obj.user.replace('system.user.', '');
                newValue += `/${user}`;
                newValueTitle.push(`${this.texts.stateChangedBy} ${user}`);
            }
        }
        if (obj) {
            obj.from &&
                newValueTitle.push(
                    `${this.texts.objectChangedFrom} ${obj.from.replace(/^system\.adapter\.|^system\./, '')}`,
                );
            obj.user && newValueTitle.push(`${this.texts.objectChangedBy} ${obj.user.replace(/^system\.user\./, '')}`);
            obj.ts &&
                newValueTitle.push(
                    `${this.texts.objectChangedByUser} ${Utils.formatDate(new Date(obj.ts), this.props.dateFormat || this.systemConfig.common.dateFormat)}`,
                );
        }

        const readWriteAlias = typeof common?.alias?.id === 'object';

        const alias =
            id.startsWith('alias.') && common?.alias?.id ? (
                readWriteAlias ?
                    <div style={styles.cellIdAliasReadWriteDiv}>
                        {common.alias.id.read ? <Box
                            component="div"
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                this.onSelect(common.alias.id.read);
                                setTimeout(
                                    () => this.expandAllSelected(() => this.scrollToItem(common.alias.id.read)),
                                    100,
                                );
                            }}
                            sx={this.styles.aliasReadWrite}
                        >
                            ←
                            {common.alias.id.read}
                        </Box> : null}
                        {common.alias.id.write ? <Box
                            component="div"
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                this.onSelect(common.alias.id.write);
                                setTimeout(
                                    () => this.expandAllSelected(() => this.scrollToItem(common.alias.id.write)),
                                    100,
                                );
                            }}
                            sx={this.styles.aliasReadWrite}
                        >
                            →
                            {common.alias.id.write}
                        </Box> : null}
                    </div>
                    :
                    <Box
                        component="div"
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            this.onSelect(common.alias.id);
                            setTimeout(() => this.expandAllSelected(() => this.scrollToItem(common.alias.id)), 100);
                        }}
                        sx={this.styles.aliasAlone}
                    >
                        →
                        {common.alias.id}
                    </Box>
            ) : null;

        let checkColor = common?.color;
        let invertBackground;
        if (checkColor && !this.state.selected.includes(id)) {
            const background =
                this.props.themeName === 'dark' ? '#1f1f1f' : this.props.themeName === 'blue' ? '#222a2e' : '#FFFFFF';
            const distance = Utils.colorDistance(checkColor, background);
            // console.log(`Distance: ${checkColor} - ${background} = ${distance}`);
            if (distance < 1000) {
                invertBackground = this.props.themeType === 'dark' ? '#9a9a9a' : '#565656';
            }
        }
        let bold = false;
        if (id === '0_userdata') {
            checkColor = COLOR_NAME_USERDATA(this.props.themeType);
            bold = true;
        } else if (id === 'alias') {
            checkColor = COLOR_NAME_ALIAS(this.props.themeType);
            bold = true;
        } else if (id === 'javascript') {
            checkColor = COLOR_NAME_JAVASCRIPT(this.props.themeType);
            bold = true;
        } else if (id === 'system') {
            checkColor = COLOR_NAME_SYSTEM(this.props.themeType);
            bold = true;
        } else if (id === 'system.adapter') {
            checkColor = COLOR_NAME_SYSTEM_ADAPTER(this.props.themeType);
        } else if (!checkColor || this.state.selected.includes(id)) {
            checkColor = 'inherit';
        }

        const icons = [];

        if (common?.statusStates) {
            const ids: Record<string, string> = {};
            Object.keys(common.statusStates).forEach(name => {
                let _id = common.statusStates[name];
                if (_id.split('.').length < 3) {
                    _id = `${id}.${_id}`;
                }
                ids[name] = _id;

                if (!this.states[_id]) {
                    if (this.objects[_id]?.type === 'state') {
                        !this.recordStates.includes(_id) && this.recordStates.push(_id);
                        this.states[_id] = { val: null } as ioBroker.State;
                        this.subscribe(_id);
                    }
                } else {
                    !this.recordStates.includes(_id) && this.recordStates.push(_id);
                }
            });
            // calculate color
            // errorId has priority
            let colorSet = false;
            if (common.statusStates.errorId && this.states[ids.errorId] && this.states[ids.errorId].val) {
                checkColor = this.props.themeType === 'dark' ? COLOR_NAME_ERROR_DARK : COLOR_NAME_ERROR_LIGHT;
                colorSet = true;
                icons.push(<IconError
                    key="error"
                    // title={this.texts.deviceError}
                    style={this.styles.iconDeviceError}
                />);
            }

            if (ids.onlineId && this.states[ids.onlineId]) {
                if (!colorSet) {
                    if (this.states[ids.onlineId].val) {
                        checkColor =
                            this.props.themeType === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT;
                        icons.push(<IconConnection
                            key="conn"
                            // title={this.texts.deviceError}
                            style={this.styles.iconDeviceConnected}
                        />);
                    } else {
                        checkColor =
                            this.props.themeType === 'dark'
                                ? COLOR_NAME_DISCONNECTED_DARK
                                : COLOR_NAME_DISCONNECTED_LIGHT;
                        icons.push(<IconDisconnected
                            key="disc"
                            // title={this.texts.deviceError}
                            style={this.styles.iconDeviceDisconnected}
                        />);
                    }
                } else if (this.states[ids.onlineId].val) {
                    icons.push(<IconConnection
                        key="conn"
                        // title={this.texts.deviceError}
                        style={this.styles.iconDeviceConnected}
                    />);
                } else {
                    icons.push(<IconDisconnected
                        key="disc"
                        // title={this.texts.deviceError}
                        style={this.styles.iconDeviceDisconnected}
                    />);
                }
            } else if (ids.offlineId && this.states[ids.offlineId]) {
                if (!colorSet) {
                    if (this.states[ids.offlineId].val) {
                        checkColor =
                            this.props.themeType === 'dark'
                                ? COLOR_NAME_DISCONNECTED_DARK
                                : COLOR_NAME_DISCONNECTED_LIGHT;
                        icons.push(<IconDisconnected
                            key="disc"
                            // title={this.texts.deviceError}
                            style={this.styles.iconDeviceDisconnected}
                        />);
                    } else {
                        checkColor =
                            this.props.themeType === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT;
                        icons.push(<IconConnection
                            key="conn"
                            // title={this.texts.deviceError}
                            style={this.styles.iconDeviceConnected}
                        />);
                    }
                } else if (this.states[ids.offlineId].val) {
                    icons.push(<IconDisconnected
                        key="disc"
                        // title={this.texts.deviceError}
                        style={this.styles.iconDeviceDisconnected}
                    />);
                } else {
                    icons.push(<IconConnection
                        key="conn"
                        // title={this.texts.deviceError}
                        style={this.styles.iconDeviceConnected}
                    />);
                }
            }
        }

        const q = checkVisibleObjectType ? Utils.quality2text(this.states[id]?.q || 0).join(', ') : null;

        let name: React.JSX.Element[] | string = item.data?.title || '';
        let useDesc: boolean = false;
        if (this.state.showDescription) {
            const oTooltip: string | null = getObjectTooltip(item.data, this.props.lang);
            if (oTooltip) {
                name = [
                    <div key="name" style={styles.cellNameDivDiv}>
                        {name}
                    </div>,
                    <div key="desc" style={styles.cellDescription}>
                        {oTooltip}
                    </div>,
                ];
                useDesc = !!oTooltip;
            }
        }

        return <Grid
            container
            direction="row"
            wrap="nowrap"
            sx={getStyle(
                this.props.theme,
                styles.tableRow,
                this.state.linesEnabled && styles.tableRowLines,
                !this.props.dragEnabled && styles.tableRowNoDragging,
                alias && styles.tableRowAlias,
                readWriteAlias && styles.tableRowAliasReadWrite,
                !item.data.visible && styles.filteredOut,
                item.data.hasVisibleParent &&
                    !item.data.visible &&
                    !item.data.hasVisibleChildren &&
                    styles.filteredParentOut,
                this.state.selected.includes(id) && styles.itemSelected,
                this.state.selectedNonObject === id && styles.itemSelected,
            )}
            key={id}
            id={id}
            onMouseDown={e => {
                this.onSelect(id);
                let isRightMB;
                if ('which' in e) {
                    // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                    isRightMB = e.which === 3;
                } else if ('button' in e) {
                    // IE, Opera
                    isRightMB = e.button === 2;
                }
                if (isRightMB) {
                    this.contextMenu = {
                        item,
                        ts: Date.now(),
                    };
                } else {
                    this.contextMenu = null;
                }
            }}
            onDoubleClick={() => {
                if (!item.children) {
                    this.onSelect(id, true);
                } else {
                    this.toggleExpanded(id);
                }
            }}
        >
            <Grid
                container
                wrap="nowrap"
                direction="row"
                sx={styles.cellId}
                style={{ width: this.columnsVisibility.id, paddingLeft }}
            >
                <Grid item container alignItems="center">
                    {checkbox}
                    {iconFolder}
                </Grid>
                <Grid
                    item
                    style={{ ...styles.cellIdSpan, ...(invertBackground ? this.styles.invertedBackground : undefined), color: checkColor, fontWeight: bold ? 'bold' : undefined }}
                >
                    <Tooltip
                        title={getIdFieldTooltip(item.data, this.props.lang)}
                        componentsProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <div>{item.data.name}</div>
                    </Tooltip>
                    {alias}
                    {icons}
                </Grid>
                <div style={{ ...styles.grow, ...(invertBackground ? this.styles.invertedBackgroundFlex : {}) }} />
                <Grid item container alignItems="center">
                    {iconItem}
                </Grid>
                <div>
                    <IconCopy
                        className="copyButton"
                        style={styles.cellCopyButton}
                        onClick={e => this.onCopy(e, id)}
                    />
                </div>
            </Grid>

            {this.columnsVisibility.name ? <Box
                component="div"
                sx={{
                    ...styles.cellName,
                    ...(useDesc ? styles.cellNameWithDesc : undefined),
                    width: this.columnsVisibility.name,
                }}
            >
                {name}
                {item.data?.title ? <Box
                    style={{ color: checkColor }}
                >
                    <IconCopy
                        className="copyButton"
                        style={styles.cellCopyButton}
                        onClick={e => this.onCopy(e, item.data?.title as string)}
                    />
                </Box> : null}
            </Box> : null}

            {!this.state.statesView ? <>
                {this.columnsVisibility.type ? <div
                    style={{ ...styles.cellType, width: this.columnsVisibility.type }}
                >
                    {typeImg}
                    &nbsp;
                    {obj && obj.type}
                </div> : null}
                {this.columnsVisibility.role ? <div
                    style={{ ...styles.cellRole,
                        width: this.columnsVisibility.role,
                        cursor:
                            this.state.filter.expertMode && enumEditable && this.props.objectBrowserEditRole
                                ? 'text'
                                : 'default',
                    }}
                    onClick={
                        this.state.filter.expertMode && enumEditable && this.props.objectBrowserEditRole
                            ? () => this.setState({ roleDialog: item.data.id })
                            : undefined
                    }
                >
                    {common?.role}
                </div> : null}
                {this.columnsVisibility.room ? <div
                    style={{
                        ...styles.cellRoom,
                        ...(item.data.per ? styles.cellEnumParent : {}),
                        width: this.columnsVisibility.room,
                        cursor: enumEditable ? 'text' : 'default',
                    }}
                    onClick={enumEditable ? () => {
                        const enums = findEnumsForObjectAsIds(
                            this.info,
                            item.data.id,
                            'roomEnums',
                        );
                        this.setState({
                            enumDialogEnums: enums,
                            enumDialog: {
                                item,
                                type: 'room',
                                enumsOriginal: JSON.stringify(enums),
                            },
                        });
                    } : undefined}
                >
                    {item.data.rooms}
                </div> : null}
                {this.columnsVisibility.func ? <div
                    style={{
                        ...styles.cellFunc,
                        ...(item.data.pef ? styles.cellEnumParent : {}),
                        width: this.columnsVisibility.func,
                        cursor: enumEditable ? 'text' : 'default',
                    }}
                    onClick={enumEditable ? () => {
                        const enums = findEnumsForObjectAsIds(
                            this.info,
                            item.data.id,
                            'funcEnums',
                        );
                        this.setState({
                            enumDialogEnums: enums,
                            enumDialog: {
                                item,
                                type: 'func',
                                enumsOriginal: JSON.stringify(enums),
                            },
                        });
                    } : undefined}
                >
                    {item.data.funcs}
                </div> : null}
            </> : <>
                {this.columnsVisibility.changedFrom ? <div
                    style={{ ...styles.cellRole, width: this.columnsVisibility.changedFrom }}
                    title={newValueTitle.join('\n')}
                >
                    {checkVisibleObjectType && this.states[id]?.from ? newValue : null}
                </div> : null}
                {this.columnsVisibility.qualityCode ? <div
                    style={{ ...styles.cellRole, width: this.columnsVisibility.qualityCode }}
                    title={q || ''}
                >
                    {q}
                </div> : null}
                {this.columnsVisibility.timestamp ? <div
                    style={{ ...styles.cellRole, width: this.columnsVisibility.timestamp }}
                >
                    {checkVisibleObjectType && this.states[id]?.ts
                        ? Utils.formatDate(new Date(this.states[id].ts), this.props.dateFormat || this.systemConfig.common.dateFormat)
                        : null}
                </div> : null}
                {this.columnsVisibility.lastChange ? <div
                    style={{ ...styles.cellRole, width: this.columnsVisibility.lastChange }}
                >
                    {checkVisibleObjectType && this.states[id]?.lc
                        ? Utils.formatDate(new Date(this.states[id].lc), this.props.dateFormat || this.systemConfig.common.dateFormat)
                        : null}
                </div> : null}
            </>}
            {this.adapterColumns.map(it => <div
                style={{ ...styles.cellAdapter, width: (this.columnsVisibility as Record<string, number>)[it.id] }}
                key={it.id}
                title={`${it.adapter} => ${it.pathText}`}
            >
                {obj ? this.renderCustomValue(obj, it, item) : null}
            </div>)}
            {this.columnsVisibility.val ? <div
                style={{
                    ...styles.cellValue,
                    width: this.columnsVisibility.val,
                    cursor: valueEditable ? (common?.type === 'file' ? 'zoom-in' : (item.data.button ? 'grab' : 'text')) : 'default',
                }}
                onClick={valueEditable ? () => {
                    if (!obj || !this.states) {
                        // return;
                    } else if (common?.type === 'file') {
                        this.setState({ viewFileDialog: id });
                        // eslint-disable-next-line brace-style
                    } else if (!this.state.filter.expertMode && item.data.button) {
                        // in non-expert mode control button directly
                        this.props.socket
                            .setState(id, true)
                            .catch(e => window.alert(`Cannot write state "${id}": ${e}`));
                    } else {
                        this.edit = {
                            val: this.states[id] ? this.states[id].val : '',
                            q: this.states[id] ? this.states[id].q || 0 : 0,
                            ack: false,
                            id,
                        };
                        this.setState({ updateOpened: true });
                    }
                } : undefined}
            >
                {this.renderColumnValue(id, item)}
            </div> : null}
            {this.columnsVisibility.buttons ? <div
                style={{ ...styles.cellButtons, width: this.columnsVisibility.buttons }}
            >
                {this.renderColumnButtons(id, item)}
            </div> : null}
        </Grid>;
    }

    /**
     * Renders an item.
     */
    renderItem(
        root: TreeItem,
        isExpanded: boolean | undefined,
        counter?: { count: number },
    ): React.JSX.Element[] {
        const items: (React.JSX.Element | null)[] = [];
        counter = counter || { count: 0 };
        let leaf = this.renderLeaf(root, isExpanded, counter);
        const DragWrapper = this.props.DragWrapper;
        if (this.props.dragEnabled && DragWrapper) {
            if (root.data.sumVisibility) {
                leaf = <DragWrapper
                    key={root.data.id}
                    item={root}
                    style={styles.draggable}
                >
                    {leaf}
                </DragWrapper>;
            } else {
                // change cursor
                leaf = <div key={root.data.id} style={styles.nonDraggable}>
                    {leaf}
                </div>;
            }
        }
        root.data.id && leaf && items.push(leaf);

        isExpanded = isExpanded === undefined ? binarySearch(this.state.expanded, root.data.id) : isExpanded;

        if (!root.data.id || isExpanded) {
            if (!this.state.foldersFirst) {
                root.children && items.push(root.children.map(item => {
                    // do not render too many items in column editor mode
                    if (!this.state.columnsSelectorShow || counter.count < 15) {
                        if (item.data.sumVisibility) {
                            return this.renderItem(item, undefined, counter);
                        }
                    }
                    return null;
                }) as any as React.JSX.Element);
            } else {
                // first only folder
                root.children && items.push(root.children.map(item => {
                    if (item.children) {
                        // do not render too many items in column editor mode
                        if (!this.state.columnsSelectorShow || counter.count < 15) {
                            if (item.data.sumVisibility) {
                                return this.renderItem(item, undefined, counter);
                            }
                        }
                    }

                    return null;
                }) as any as React.JSX.Element);
                // then items
                root.children && items.push(root.children.map(item => {
                    if (!item.children) {
                        // do not render too many items in column editor mode
                        if (!this.state.columnsSelectorShow || counter.count < 15) {
                            if (item.data.sumVisibility) {
                                return this.renderItem(item, undefined, counter);
                            }
                        }
                    }
                    return null;
                }) as any as React.JSX.Element);
            }
        }

        return items as React.JSX.Element[];
    }

    private calculateColumnsVisibility(
        aColumnsAuto?: boolean | null,
        aColumns?: string[] | null,
        aColumnsForAdmin?: Record<string, CustomAdminColumnStored[]> | null,
        aColumnsWidths?: Record<string, number>,
    ): void {
        let columnsWidths: Record<string, number> = aColumnsWidths || this.state.columnsWidths;
        const columnsForAdmin: Record<string, CustomAdminColumnStored[]> | null =
            aColumnsForAdmin || this.state.columnsForAdmin;
        const columns: string[] = aColumns || this.state.columns || [];
        const columnsAuto: boolean = typeof aColumnsAuto !== 'boolean' ? this.state.columnsAuto : aColumnsAuto;

        columnsWidths = JSON.parse(JSON.stringify(columnsWidths));
        Object.keys(columnsWidths).forEach(name => {
            if (columnsWidths[name]) {
                columnsWidths[name] = parseInt(columnsWidths[name] as any as string, 10) || 0;
            }
        });

        this.adapterColumns = [];
        const WIDTHS = SCREEN_WIDTHS[this.props.width || 'lg'].widths;

        if (columnsAuto) {
            this.columnsVisibility = {
                id: SCREEN_WIDTHS[this.props.width || 'lg'].idWidth,
                name: this.visibleCols.includes('name') ? WIDTHS.name || 0 : 0,
                nameHeader: this.visibleCols.includes('name') ? WIDTHS.name || 0 : 0,
                type: this.visibleCols.includes('type') ? WIDTHS.type || 0 : 0,
                role: this.visibleCols.includes('role') ? WIDTHS.role || 0 : 0,
                room: this.visibleCols.includes('room') ? WIDTHS.room || 0 : 0,
                func: this.visibleCols.includes('func') ? WIDTHS.func || 0 : 0,
                changedFrom: this.visibleCols.includes('changedFrom') ? WIDTHS.changedFrom || 0 : 0,
                qualityCode: this.visibleCols.includes('qualityCode') ? WIDTHS.qualityCode || 0 : 0,
                timestamp: this.visibleCols.includes('timestamp') ? WIDTHS.timestamp || 0 : 0,
                lastChange: this.visibleCols.includes('lastChange') ? WIDTHS.lastChange || 0 : 0,
                val: this.visibleCols.includes('val') ? WIDTHS.val || 0 : 0,
                buttons: this.visibleCols.includes('buttons') ? WIDTHS.buttons || 0 : 0,
            };

            // in xs name is not visible
            if (this.columnsVisibility.name && !this.customWidth) {
                let widthSum: number = this.columnsVisibility.id as number || 0; // id is always visible
                if (this.state.statesView) {
                    widthSum += this.columnsVisibility.changedFrom || 0;
                    widthSum += this.columnsVisibility.qualityCode || 0;
                    widthSum += this.columnsVisibility.timestamp || 0;
                    widthSum += this.columnsVisibility.lastChange || 0;
                } else {
                    widthSum += this.columnsVisibility.type || 0;
                    widthSum += this.columnsVisibility.role || 0;
                    widthSum += this.columnsVisibility.room || 0;
                    widthSum += this.columnsVisibility.func || 0;
                }
                widthSum += this.columnsVisibility.val || 0;
                widthSum += this.columnsVisibility.buttons || 0;
                this.columnsVisibility.name = `calc(100% - ${widthSum + 5}px)`;
                this.columnsVisibility.nameHeader = `calc(100% - ${widthSum + 5 + this.state.scrollBarWidth}px)`;
            } else if (!this.customWidth) {
                // Calculate the width of ID
                let widthSum = 0; // id is always visible
                if (this.state.statesView) {
                    widthSum += this.columnsVisibility.changedFrom || 0;
                    widthSum += this.columnsVisibility.qualityCode || 0;
                    widthSum += this.columnsVisibility.timestamp || 0;
                    widthSum += this.columnsVisibility.lastChange || 0;
                } else {
                    widthSum += this.columnsVisibility.type || 0;
                    widthSum += this.columnsVisibility.role || 0;
                    widthSum += this.columnsVisibility.room || 0;
                    widthSum += this.columnsVisibility.func || 0;
                }
                widthSum += this.columnsVisibility.val || 0;
                widthSum += this.columnsVisibility.buttons || 0;
                this.columnsVisibility.id = `calc(100% - ${widthSum + 5}px)`;
            }
        } else {
            const width = this.props.width || 'lg';
            this.columnsVisibility = {
                id: columnsWidths.id || SCREEN_WIDTHS[width].idWidth,
                name: columns.includes('name')
                    ? columnsWidths.name || WIDTHS.name || SCREEN_WIDTHS[width].widths.name || 0
                    : 0,
                type: columns.includes('type')
                    ? columnsWidths.type || WIDTHS.type || SCREEN_WIDTHS[width].widths.type || 0
                    : 0,
                role: columns.includes('role')
                    ? columnsWidths.role || WIDTHS.role || SCREEN_WIDTHS[width].widths.role || 0
                    : 0,
                room: columns.includes('room')
                    ? columnsWidths.room || WIDTHS.room || SCREEN_WIDTHS[width].widths.room || 0
                    : 0,
                func: columns.includes('func')
                    ? columnsWidths.func || WIDTHS.func || SCREEN_WIDTHS[width].widths.func || 0
                    : 0,
            };
            let widthSum: number = this.columnsVisibility.id as number; // id is always visible
            if (this.columnsVisibility.name) {
                widthSum += this.columnsVisibility.type || 0;
                widthSum += this.columnsVisibility.role || 0;
                widthSum += this.columnsVisibility.room || 0;
                widthSum += this.columnsVisibility.func || 0;
            }

            if (columnsForAdmin && columns) {
                Object.keys(columnsForAdmin)
                    .sort()
                    .forEach(adapter =>
                        columnsForAdmin[adapter]
                            .forEach(column => {
                                const id = `_${adapter}_${column.path}`;
                                if (columns.includes(id)) {
                                    const item: AdapterColumn = {
                                        adapter,
                                        id: `_${adapter}_${column.path}`,
                                        name: column.name,
                                        path: column.path.split('.'),
                                        pathText: column.path,
                                    };
                                    if (column.edit) {
                                        item.edit = true;
                                        if (column.type) {
                                            item.type = column.type as 'number' | 'boolean' | 'string';
                                        }
                                        if (column.objTypes) {
                                            item.objTypes = column.objTypes;
                                        }
                                    }

                                    this.adapterColumns.push(item);
                                    (this.columnsVisibility as Record<string, number>)[id] =
                                        columnsWidths[item.id] ||
                                        column.width ||
                                        SCREEN_WIDTHS[width].widths.func ||
                                        SCREEN_WIDTHS.xl.widths.func || 0;
                                    widthSum += (this.columnsVisibility as Record<string, number>)[id];
                                } else {
                                    (this.columnsVisibility as Record<string, number>)[id] = 0;
                                }
                            }));
            }
            this.adapterColumns.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
            this.columnsVisibility.val = columns.includes('val')
                ? columnsWidths.val || WIDTHS.val || SCREEN_WIDTHS.xl.widths.val
                : 0;

            // do not show buttons if not desired
            if (!this.props.columns || this.props.columns.includes('buttons')) {
                this.columnsVisibility.buttons = columns.includes('buttons')
                    ? columnsWidths.buttons || WIDTHS.buttons || SCREEN_WIDTHS.xl.widths.buttons
                    : 0;
                widthSum += this.columnsVisibility.buttons || 0;
            }

            if (this.columnsVisibility.name && !columnsWidths.name) {
                widthSum += this.columnsVisibility.val || 0;
                this.columnsVisibility.name = `calc(100% - ${widthSum}px)`;
                this.columnsVisibility.nameHeader = `calc(100% - ${widthSum + 5 + this.state.scrollBarWidth}px)`;
            } else {
                const newWidth = Object.keys(this.columnsVisibility)
                    .reduce((accumulator: number, name: string) => {
                        // do not summarize strings
                        if (
                            name === 'id' ||
                            typeof (this.columnsVisibility as Record<string, number | string>)[name] === 'string' ||
                            !(this.columnsVisibility as Record<string, number | string>)[name]
                        ) {
                            return accumulator;
                        }
                        return accumulator + (this.columnsVisibility as Record<string, number>)[name];
                    }, 0);
                this.columnsVisibility.id = `calc(100% - ${newWidth}px)`;
            }
        }
    }

    resizerMouseMove = (e: MouseEvent): void => {
        if (this.resizerActiveDiv) {
            let width: number;
            let widthNext: number;
            if (this.resizeLeft) {
                width = this.resizerOldWidth - e.clientX + this.resizerPosition;
                widthNext = this.resizerOldWidthNext + e.clientX - this.resizerPosition;
            } else {
                width = this.resizerOldWidth + e.clientX - this.resizerPosition;
                widthNext = this.resizerOldWidthNext - e.clientX + this.resizerPosition;
            }

            if (this.resizerActiveName && this.resizerNextName &&
                (!this.resizerMin || width > this.resizerMin) &&
                (!this.resizerNextMin || widthNext > this.resizerNextMin)
            ) {
                this.resizerCurrentWidths[this.resizerActiveName] = width;
                this.resizerCurrentWidths[this.resizerNextName] = widthNext;

                this.resizerActiveDiv.style.width = `${width}px`;
                if (this.resizerNextDiv) {
                    this.resizerNextDiv.style.width = `${widthNext}px`;
                }

                (this.columnsVisibility as Record<string, number | string>)[this.resizerActiveName] = width;
                (this.columnsVisibility as Record<string, number | string>)[this.resizerNextName] = widthNext;
                if (this.resizerNextName === 'nameHeader') {
                    this.columnsVisibility.name = widthNext - this.state.scrollBarWidth;
                    this.resizerCurrentWidths.name = widthNext - this.state.scrollBarWidth;
                } else if (this.resizerActiveName === 'nameHeader') {
                    this.columnsVisibility.name = width - this.state.scrollBarWidth;
                    this.resizerCurrentWidths.name = width - this.state.scrollBarWidth;
                }
                this.customWidth = true;
                this.resizeTimeout && clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.resizeTimeout = null;
                    this.forceUpdate();
                }, 200);
            }
        }
    };

    resizerMouseUp = () => {
        this.localStorage.setItem(`${this.props.dialogName || 'App'}.table`, JSON.stringify(this.resizerCurrentWidths));
        this.resizerActiveName = null;
        this.resizerNextName = null;
        this.resizerActiveDiv = null;
        this.resizerNextDiv = null;
        window.removeEventListener('mousemove', this.resizerMouseMove);
        window.removeEventListener('mouseup', this.resizerMouseUp);
    };

    resizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this.storedWidths = this.storedWidths || JSON.parse(JSON.stringify(SCREEN_WIDTHS[this.props.width || 'lg'])) as ScreenWidthOne;

        this.resizerCurrentWidths = this.resizerCurrentWidths || {};
        this.resizerActiveDiv = (e.target as HTMLDivElement).parentNode as HTMLDivElement;
        this.resizerActiveName = this.resizerActiveDiv.dataset.name || null;
        if (this.resizerActiveName) {
            let i = 0;
            if ((e.target as HTMLDivElement).dataset.left === 'true') {
                this.resizeLeft = true;
                this.resizerNextDiv = this.resizerActiveDiv.previousElementSibling as HTMLDivElement;
                let handle: HTMLDivElement | null = this.resizerNextDiv.querySelector('.iob-ob-resize-handler') as HTMLDivElement;
                while (this.resizerNextDiv && !handle && i < 10) {
                    this.resizerNextDiv = this.resizerNextDiv.previousElementSibling as HTMLDivElement;
                    handle = this.resizerNextDiv.querySelector('.iob-ob-resize-handler');
                    i++;
                }
                if (handle?.dataset.left !== 'true') {
                    this.resizerNextDiv = this.resizerNextDiv.nextElementSibling as HTMLDivElement;
                }
            } else {
                this.resizeLeft = false;
                this.resizerNextDiv = this.resizerActiveDiv.nextElementSibling as HTMLDivElement;
                /* while (this.resizerNextDiv && !this.resizerNextDiv.querySelector('.iob-ob-resize-handler') && i < 10) {
                    this.resizerNextDiv = this.resizerNextDiv.nextElementSibling;
                    i++;
                } */
            }
            this.resizerNextName = this.resizerNextDiv.dataset.name || null;

            this.resizerMin = parseInt(this.resizerActiveDiv.dataset.min as string, 10) || 0;
            this.resizerNextMin = parseInt(this.resizerNextDiv.dataset.min as string, 10) || 0;

            this.resizerPosition = e.clientX;

            this.resizerCurrentWidths[this.resizerActiveName] = this.resizerActiveDiv.offsetWidth;
            this.resizerOldWidth = this.resizerCurrentWidths[this.resizerActiveName];

            if (this.resizerNextName) {
                this.resizerCurrentWidths[this.resizerNextName] = this.resizerNextDiv.offsetWidth;
                this.resizerOldWidthNext = this.resizerCurrentWidths[this.resizerNextName];
            }

            window.addEventListener('mousemove', this.resizerMouseMove);
            window.addEventListener('mouseup', this.resizerMouseUp);
        }
    };

    /**
     * Handle keyboard events for navigation
     */
    navigateKeyPress(event: React.KeyboardEvent) {
        const selectedId = this.state.selectedNonObject || this.state.selected[0];

        if (!selectedId) {
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            event.preventDefault();
            const ids: string[] = [];
            this.tableRef.current?.childNodes
                .forEach((node: any) => ids.push((node as HTMLDivElement).id));
            const idx = ids.indexOf(selectedId);
            const newIdx = event.code === 'ArrowDown' ? idx + 1 : idx - 1;
            const newId = ids[newIdx] || selectedId;
            this.onSelect(newId);
            this.scrollToItem(newId);
        }

        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            this.toggleExpanded(selectedId);
        }

        if (event.code === 'Delete' && this.root && selectedId) {
            const item = ObjectBrowserClass.getItemFromRoot(this.root, selectedId);
            if (item) {
                const { obj } = item.data;
                if (obj && !obj.common?.dontDelete) {
                    this.showDeleteDialog({ id: selectedId, obj, item });
                }
            }
        }
    }

    /**
     * Find the id from the root
     */
    private static getItemFromRoot(
        /** The current root */
        root: TreeItem,
        /** the object id to find */
        id: string,
    ): TreeItem | null {
        const idArr = id.split('.');
        let currId = '';
        let _root: TreeItem | null | undefined = root;

        for (const idEntry of idArr) {
            currId = currId ? `${currId}.${idEntry}` : idEntry;
            _root = _root.children?.find(item => item.data.id === currId);
            if (!_root) {
                break;
            }
        }

        return _root || null;
    }

    resizerReset = () => {
        this.customWidth = false;
        SCREEN_WIDTHS[this.props.width || 'lg'] = JSON.parse(JSON.stringify(this.storedWidths));
        this.calculateColumnsVisibility();
        this.localStorage.removeItem(`${this.props.dialogName || 'App'}.table`);
        this.forceUpdate();
    };

    /**
     * Render the right handle for resizing
     */
    renderHandleRight(): React.JSX.Element {
        return <Box
            component="div"
            className="iob-ob-resize-handler"
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleRight }}
            onMouseDown={this.resizerMouseDown}
            onDoubleClick={this.resizerReset}
            title={this.props.t('ra_Double click to reset table layout')}
        />;
    }

    private renderHeader(): React.JSX.Element {
        let filterClearInValue = null;
        if (!this.columnsVisibility.buttons && !this.isFilterEmpty()) {
            filterClearInValue = <IconButton
                onClick={() => this.clearFilter()}
                style={styles.buttonClearFilter}
                title={this.props.t('ra_Clear filter')}
                size="large"
            >
                <IconClearFilter />
                <IconClose style={styles.buttonClearFilterIcon} />
            </IconButton>;
        }

        return <div style={styles.headerRow}>
            <div
                style={{ ...styles.headerCell, width: this.columnsVisibility.id, position: 'relative' }}
                data-min={240}
                data-name="id"
            >
                {this.getFilterInput('id')}
                {this.renderHandleRight()}
            </div>
            {this.columnsVisibility.name ? <div
                style={{ ...styles.headerCell, width: this.columnsVisibility.nameHeader, position: 'relative' }}
                data-min={100}
                data-name="nameHeader"
            >
                {this.getFilterInput('name')}
                {this.renderHandleRight()}
            </div> : null}
            {!this.state.statesView && <>
                {this.columnsVisibility.type ? <div
                    style={{ ...styles.headerCell, width: this.columnsVisibility.type, position: 'relative' }}
                    data-min={100}
                    data-name="type"
                >
                    {this.getFilterSelectType()}
                    {this.renderHandleRight()}
                </div> : null}
                {this.columnsVisibility.role ? <div
                    style={{ ...styles.headerCell, width: this.columnsVisibility.role, position: 'relative' }}
                    data-min={100}
                    data-name="role"
                >
                    {this.getFilterSelectRole()}
                    {this.renderHandleRight()}
                </div> : null}
                {this.columnsVisibility.room ? <div
                    style={{ ...styles.headerCell, width: this.columnsVisibility.room, position: 'relative' }}
                    data-min={100}
                    data-name="room"
                >
                    {this.getFilterSelectRoom()}
                    {this.renderHandleRight()}
                </div> : null}
                {this.columnsVisibility.func ? <div
                    style={{ ...styles.headerCell, width: this.columnsVisibility.func, position: 'relative' }}
                    data-min={100}
                    data-name="func"
                >
                    {this.getFilterSelectFunction()}
                    {this.renderHandleRight()}
                </div> : null}
            </>}
            {this.state.statesView && <>
                <div
                    style={{ ...styles.headerCell, ...styles.headerCellValue, width: this.columnsVisibility.changedFrom, position: 'relative' }}
                    data-min={100}
                    data-name="changedFrom"
                >
                    {this.props.t('ra_Changed from')}
                    {this.renderHandleRight()}
                </div>
                <div
                    style={{ ...styles.headerCell, ...styles.headerCellValue, width: this.columnsVisibility.qualityCode, position: 'relative' }}
                    data-min={100}
                    data-name="qualityCode"
                >
                    {this.props.t('ra_Quality code')}
                    {this.renderHandleRight()}
                </div>
                <div
                    style={{ ...styles.headerCell, ...styles.headerCellValue, width: this.columnsVisibility.timestamp, position: 'relative' }}
                    data-min={100}
                    data-name="timestamp"
                >
                    {this.props.t('ra_Timestamp')}
                    {this.renderHandleRight()}
                </div>
                <div
                    style={{ ...styles.headerCell, ...styles.headerCellValue, width: this.columnsVisibility.lastChange, position: 'relative' }}
                    data-min={100}
                    data-name="lastChange"
                >
                    {this.props.t('ra_Last change')}
                    {this.renderHandleRight()}
                </div>
            </>}
            {this.adapterColumns.map(item => <div
                style={{ ...styles.headerCell, ...styles.headerCellValue, width: (this.columnsVisibility as Record<string, number | string>)[item.id] }}
                title={item.adapter}
                key={item.id}
                data-min={100}
                data-name={item.id}
            >
                {item.name}
            </div>)}
            {this.columnsVisibility.val ? <div
                style={{ ...styles.headerCell, ...styles.headerCellValue, width: this.columnsVisibility.val, position: 'relative' }}
                data-min={120}
                data-name="val"
            >
                {this.props.t('ra_Value')}
                {filterClearInValue}
            </div> : null}
            {this.columnsVisibility.buttons ? <div
                title={this.texts.filter_custom}
                style={{ ...styles.headerCell, width: this.columnsVisibility.buttons }}
            >
                {' '}
                {this.getFilterSelectCustoms()}
            </div> : null}
        </div>;
    }

    private renderToast(): React.JSX.Element {
        return <Snackbar
            open={!!this.state.toast}
            autoHideDuration={3000}
            onClick={() => this.setState({ toast: '' })}
            onClose={() => this.setState({ toast: '' })}
            message={this.state.toast}
            action={
                <IconButton
                    size="small"
                    aria-label="close"
                    color="inherit"
                    onClick={() => this.setState({ toast: '' })}
                >
                    <IconClose fontSize="small" />
                </IconButton>
            }
        />;
    }

    /**
     * Called when component is updated.
     */
    componentDidUpdate() {
        if (this.tableRef.current) {
            const scrollBarWidth = this.tableRef.current.offsetWidth - this.tableRef.current.clientWidth;
            if (this.state.scrollBarWidth !== scrollBarWidth) {
                setTimeout(() => this.setState({ scrollBarWidth }), 100);
            } else if (
                !this.selectedFound &&
                (this.state.selected?.[0] || this.lastSelectedItems?.[0])
            ) {
                this.scrollToItem(this.state.selected?.[0] || this.lastSelectedItems?.[0]);
            }
        }
    }

    scrollToItem(id: string): void {
        const node = window.document.getElementById(id);
        node &&
            node.scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center',
            });
        this.selectedFound = true;
    }

    private renderCustomDialog(): React.JSX.Element | null {
        if (this.state.customDialog && this.props.objectCustomDialog) {
            const ObjectCustomDialog = this.props.objectCustomDialog;

            return <ObjectCustomDialog
                reportChangedIds={(changedIds: string[]) => (this.changedIds = [...changedIds])}
                objectIDs={this.state.customDialog}
                allVisibleObjects={!!this.state.customDialogAll}
                expertMode={this.state.filter.expertMode}
                isFloatComma={this.props.isFloatComma === undefined ? this.systemConfig.common.isFloatComma : this.props.isFloatComma}
                t={this.props.t}
                lang={this.props.lang}
                socket={this.props.socket}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                theme={this.props.theme}
                objects={this.objects}
                customsInstances={this.info.customs}
                onClose={() => {
                    this.pauseSubscribe(false);
                    this.setState({ customDialog: null });
                    if (this.changedIds) {
                        this.changedIds = null;
                        // update all changed IDs
                        this.forceUpdate();
                    }

                    this.props.router?.doNavigate('tab-objects');
                }}
                systemConfig={this.systemConfig}
            />;
        }
        return null;
    }

    private onUpdate(valAck: {
        val: ioBroker.StateValue;
        ack: boolean;
        q: ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY];
        expire: number | undefined;
    }) {
        this.props.socket
            .setState(this.edit.id, {
                val: valAck.val,
                ack: valAck.ack,
                q: valAck.q || 0,
                expire: valAck.expire || undefined,
            })
            .catch(e => this.showError(`Cannot write value: ${e}`));
    }

    private renderEditObjectDialog(): React.JSX.Element | null {
        if (!this.state.editObjectDialog || !this.props.objectBrowserEditObject) {
            return null;
        }

        const ObjectBrowserEditObject = this.props.objectBrowserEditObject;

        return <ObjectBrowserEditObject
            key={this.state.editObjectDialog}
            obj={this.objects[this.state.editObjectDialog]}
            roleArray={this.info.roles}
            objects={this.objects}
            dateFormat={this.props.dateFormat || this.systemConfig.common.dateFormat}
            isFloatComma={this.props.isFloatComma === undefined ? this.systemConfig.common.isFloatComma : this.props.isFloatComma}
            themeType={this.props.themeType}
            socket={this.props.socket}
            dialogName={this.props.dialogName}
            aliasTab={this.state.editObjectAlias}
            t={this.props.t}
            expertMode={!!this.state.filter.expertMode}
            onNewObject={(obj: ioBroker.AnyObject) =>
                this.props.socket
                    .setObject(obj._id, obj)
                    .then(() => this.setState({ editObjectDialog: obj._id, editObjectAlias: false }, () =>
                        this.onSelect(obj._id)))
                    .catch(e => this.showError(`Cannot write object: ${e}`))}
            onClose={(obj?: ioBroker.AnyObject) => {
                if (obj) {
                    let updateAlias: string;
                    if (this.state.editObjectDialog.startsWith('alias.')) {
                        if (
                            JSON.stringify(this.objects[this.state.editObjectDialog].common?.alias) !==
                            JSON.stringify((obj as ioBroker.StateObject).common?.alias)
                        ) {
                            updateAlias = this.state.editObjectDialog;
                        }
                    }

                    this.props.socket
                        .setObject(obj._id, obj)
                        .then(() => {
                            if (updateAlias && this.subscribes.includes(updateAlias)) {
                                this.unsubscribe(updateAlias);
                                setTimeout(() => this.subscribe(updateAlias), 100);
                            }
                        })
                        .catch(e => this.showError(`Cannot write object: ${e}`));
                }
                this.setState({ editObjectDialog: '', editObjectAlias: false });
            }}
        />;
    }

    private renderViewObjectFileDialog(): React.JSX.Element | null {
        if (!this.state.viewFileDialog || !this.props.objectBrowserViewFile) {
            return null;
        }
        const ObjectBrowserViewFile = this.props.objectBrowserViewFile;

        return <ObjectBrowserViewFile
            key="viewFile"
            obj={this.objects[this.state.viewFileDialog]}
            socket={this.props.socket}
            t={this.props.t}
            onClose={() => this.setState({ viewFileDialog: '' })}
        />;
    }

    private renderAliasEditorDialog(): React.JSX.Element | null {
        if (!this.props.objectBrowserAliasEditor || !this.state.showAliasEditor) {
            return null;
        }
        const ObjectBrowserAliasEditor = this.props.objectBrowserAliasEditor;

        return <ObjectBrowserAliasEditor
            key="editAlias"
            obj={this.objects[this.state.showAliasEditor]}
            objects={this.objects}
            socket={this.props.socket}
            t={this.props.t}
            onClose={() => this.setState({ showAliasEditor: '' })}
            onRedirect={(id: string, timeout?: number) => setTimeout(() =>
                this.onSelect(id, false, () =>
                    this.expandAllSelected(() => {
                        this.scrollToItem(id);
                        setTimeout(() => this.setState({
                            editObjectDialog: id,
                            showAliasEditor: '',
                            editObjectAlias: true,
                        }), 300);
                    })), timeout || 0)}
        />;
    }

    showAddDataPointDialog(
        id: string,
        initialType: ioBroker.ObjectType,
        initialStateType?: ioBroker.CommonType,
    ): void {
        this.setState({
            showContextMenu: null,
            modalNewObj: {
                id,
                initialType,
                initialStateType,
            },
        });
    }

    /**
     * Renders the right mouse button context menu
     */
    private renderContextMenu(): React.JSX.Element | null {
        if (!this.state.showContextMenu) {
            return null;
        }
        const item = this.state.showContextMenu.item;
        const id = item.data.id;
        const items: React.JSX.Element[] = [];
        // const ctrl = isIOS() ? '⌘' : (this.props.lang === 'de' ? 'Strg+' : 'Ctrl+');

        const obj = item.data.obj;

        let showACL = '';
        if (this.props.objectEditOfAccessControl && this.state.filter.expertMode) {
            if (!obj) {
                showACL = '---';
            } else {
                const acl = obj.acl ? (obj.type === 'state' ? obj.acl.state : obj.acl.object) : 0;
                const aclSystemConfig =
                    obj.acl &&
                    (obj.type === 'state'
                        ? this.systemConfig.common.defaultNewAcl.state
                        : this.systemConfig.common.defaultNewAcl.object);
                showACL = Number.isNaN(Number(acl)) ? Number(aclSystemConfig).toString(16) : Number(acl).toString(16);
            }
        }

        const enumEditable =
            !this.props.notEditable &&
            obj &&
            (this.state.filter.expertMode || obj.type === 'state' || obj.type === 'channel' || obj.type === 'device');

        const createStateVisible =
            !item.data.obj ||
            item.data.obj.type === 'folder' ||
            item.data.obj.type === 'channel' ||
            item.data.obj.type === 'device' ||
            item.data.id === '0_userdata.0' ||
            item.data.obj.type === 'meta';
        const createChannelVisible =
            !item.data.obj ||
            item.data.obj.type === 'folder' ||
            item.data.obj.type === 'device' ||
            item.data.id === '0_userdata.0' ||
            item.data.obj.type === 'meta';
        const createDeviceVisible =
            !item.data.obj ||
            item.data.obj.type === 'folder' ||
            item.data.id === '0_userdata.0' ||
            item.data.obj.type === 'meta';
        const createFolderVisible =
            !item.data.obj ||
            item.data.obj.type === 'folder' ||
            item.data.id === '0_userdata.0' ||
            item.data.obj.type === 'meta';

        const ITEMS: Record<string, ContextMenuItem> = {
            EDIT: {
                key: '0',
                visibility:
                    !!(this.props.objectBrowserEditObject &&
                    obj &&
                    (this.state.filter.expertMode || ObjectBrowserClass.isNonExpertId(id))),
                icon: <IconEdit fontSize="small" style={this.styles.contextMenuEdit} />,
                label: this.texts.editObject,
                onClick: () =>
                    this.setState({ editObjectDialog: item.data.id, showContextMenu: null, editObjectAlias: false }),
            },
            EDIT_VALUE: {
                key: '1',
                visibility:
                    !!(this.states &&
                    !this.props.notEditable &&
                    obj &&
                    obj.type === 'state' &&
                    // @ts-expect-error deprecated from js-controller 6
                    obj.common?.type !== 'file' &&
                    (this.state.filter.expertMode || obj.common.write !== false)),
                icon: <IconValueEdit fontSize="small" style={this.styles.contextMenuEditValue} />,
                label: this.props.t('ra_Edit value'),
                onClick: () => {
                    this.edit = {
                        val: this.states[id] ? this.states[id].val : '',
                        q: this.states[id] ? this.states[id].q || 0 : 0,
                        ack: false,
                        id,
                    };
                    this.setState({ updateOpened: true, showContextMenu: null });
                },
            },
            VIEW: {
                visibility:
                    !!this.props.objectBrowserViewFile && obj?.type === 'state' &&
                    // @ts-expect-error deprecated from js-controller 6
                    obj.common?.type === 'file',
                icon: <FindInPage fontSize="small" style={this.styles.contextMenuView} />,
                label: this.props.t('ra_View file'),
                onClick: () => this.setState({ viewFileDialog: obj?._id || '', showContextMenu: null }),
            },
            CUSTOM: {
                key: '2',
                visibility:
                    !(this.props.objectCustomDialog &&
                    this.info.hasSomeCustoms &&
                    obj &&
                    obj.type === 'state' &&
                    // @ts-expect-error deprecated from js-controller 6
                    obj.common?.type !== 'file'),
                icon: <IconConfig
                    fontSize="small"
                    style={item.data.hasCustoms
                        ? this.styles.cellButtonsButtonWithCustoms
                        : styles.cellButtonsButtonWithoutCustoms}
                />,
                style: this.styles.contextMenuCustom,
                label: this.texts.customConfig,
                onClick: () => {
                    this.pauseSubscribe(true);
                    this.props.router?.doNavigate(null, 'customs', id);
                    this.setState({ customDialog: [id], showContextMenu: null });
                },
            },
            ACL: {
                key: '3',
                visibility: !!showACL,
                icon: showACL,
                iconStyle: { fontSize: 'smaller' },
                listItemIconStyle: this.styles.contextMenuACL,
                style: this.styles.contextMenuACL,
                label: this.props.t('ra_Edit ACL'),
                onClick: () =>
                    this.setState({
                        showContextMenu: null,
                        modalEditOfAccess: true,
                        modalEditOfAccessObjData: item.data,
                    }),
            },
            ROLE: {
                key: '4',
                visibility: !!(this.state.filter.expertMode && enumEditable && this.props.objectBrowserEditRole),
                icon: <BorderColor fontSize="small" style={this.styles.contextMenuRole} />,
                label: this.props.t('ra_Edit role'),
                onClick: () => this.setState({ roleDialog: item.data.id, showContextMenu: null }),
            },
            FUNCTION: {
                key: '5',
                visibility: !!enumEditable,
                icon: <BedroomParent fontSize="small" style={this.styles.contextMenuRole} />,
                label: this.props.t('ra_Edit function'),
                onClick: () => {
                    const enums = findEnumsForObjectAsIds(this.info, item.data.id, 'funcEnums');
                    this.setState({
                        enumDialogEnums: enums,
                        enumDialog: {
                            item,
                            type: 'func',
                            enumsOriginal: JSON.stringify(enums),
                        },
                        showContextMenu: null,
                    });
                },
            },
            ROOM: {
                key: '6',
                visibility: !!enumEditable,
                icon: <Construction fontSize="small" style={this.styles.contextMenuRoom} />,
                label: this.props.t('ra_Edit room'),
                onClick: () => {
                    const enums = findEnumsForObjectAsIds(this.info, item.data.id, 'roomEnums');
                    this.setState({
                        enumDialogEnums: enums,
                        enumDialog: {
                            item,
                            type: 'room',
                            enumsOriginal: JSON.stringify(enums),
                        },
                        showContextMenu: null,
                    });
                },
            },
            ALIAS: {
                key: '7',
                visibility:
                    !!(!this.props.notEditable &&
                    this.props.objectBrowserAliasEditor &&
                    this.props.objectBrowserEditObject &&
                    this.state.filter.expertMode &&
                    obj?.type === 'state' &&
                    // @ts-expect-error deprecated from js-controller 6
                    obj.common?.type !== 'file'),
                icon: <IconLink
                    style={obj?.common?.alias
                        ? this.styles.cellButtonsButtonWithCustoms
                        : styles.cellButtonsButtonWithoutCustoms}
                />,
                label: this.props.t('ra_Edit alias'),
                onClick: () => {
                    if (obj?.common?.alias) {
                        this.setState({ editObjectDialog: item.data.id, showContextMenu: null, editObjectAlias: true });
                    } else {
                        this.setState({ showContextMenu: null, showAliasEditor: item.data.id });
                    }
                },
            },
            CREATE: {
                key: '+',
                visibility:
                    (item.data.id.startsWith('0_userdata.0') || item.data.id.startsWith('javascript.')) &&
                    (createStateVisible || createChannelVisible || createDeviceVisible || createFolderVisible),
                icon: <AddIcon fontSize="small" style={this.styles.cellButtonsButtonWithCustoms} />,
                style: styles.contextMenuWithSubMenu,
                label: this.texts.create,
                subMenu: [
                    {
                        label: this.texts.createBooleanState,
                        visibility: createStateVisible,
                        icon: <IconState fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'state', 'boolean'),
                    },
                    {
                        label: this.texts.createNumberState,
                        visibility: createStateVisible,
                        icon: <IconState fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'state', 'number'),
                    },
                    {
                        label: this.texts.createStringState,
                        visibility: createStateVisible,
                        icon: <IconState fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'state', 'string'),
                    },
                    {
                        label: this.texts.createState,
                        visibility: createStateVisible,
                        icon: <IconState fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'state'),
                    },
                    {
                        label: this.texts.createChannel,
                        visibility: createChannelVisible,
                        icon: <IconChannel fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'channel'),
                    },
                    {
                        label: this.texts.createDevice,
                        visibility: createDeviceVisible,
                        icon: <IconDevice fontSize="small" />,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'device'),
                    },
                    {
                        label: this.texts.createFolder,
                        icon: <IconFolder fontSize="small" />,
                        visibility: createFolderVisible,
                        onClick: () => this.showAddDataPointDialog(item.data.id, 'folder'),
                    },
                ],
            },
            DELETE: {
                key: 'Delete',
                visibility: !!(this.props.onObjectDelete && (item.children?.length || (obj && !obj.common?.dontDelete))),
                icon: <IconDelete fontSize="small" style={this.styles.contextMenuDelete} />,
                style: this.styles.contextMenuDelete,
                label: this.texts.deleteObject,
                onClick: () =>
                    this.setState({ showContextMenu: null }, () => this.showDeleteDialog({
                        id,
                        obj: obj || {} as ioBroker.Object,
                        item,
                    })),
            },
        };

        Object.keys(ITEMS).forEach(key => {
            if (ITEMS[key].visibility) {
                if (ITEMS[key].subMenu) {
                    items.push(<MenuItem
                        key={key}
                        onClick={(e: React.MouseEvent<HTMLLIElement>) => this.state.showContextMenu && this.setState({
                            showContextMenu: {
                                item: this.state.showContextMenu.item,
                                subItem: key,
                                subAnchor: e.target as HTMLLIElement,
                            },
                        })}
                        style={ITEMS[key].style}
                    >
                        <ListItemIcon style={{ ...ITEMS[key].iconStyle, ...ITEMS[key].listItemIconStyle }}>
                            {ITEMS[key].icon}
                        </ListItemIcon>
                        <ListItemText>
                            {ITEMS[key].label}
                            ...
                        </ListItemText>
                        <ListItemSecondaryAction>
                            <ArrowRightIcon />
                        </ListItemSecondaryAction>
                    </MenuItem>);

                    if (this.state.showContextMenu?.subItem === key) {
                        items.push(<Menu
                            key="subContextMenu"
                            open={!0}
                            anchorEl={this.state.showContextMenu.subAnchor}
                            onClose={() => {
                                this.state.showContextMenu && this.setState({ showContextMenu: { item: this.state.showContextMenu.item } });
                                this.contextMenu = null;
                            }}
                        >
                            {ITEMS[key].subMenu?.map(subItem => (subItem.visibility ? <MenuItem
                                key={subItem.label}
                                onClick={subItem.onClick}
                                style={subItem.style}
                            >
                                <ListItemIcon
                                    style={{ ...subItem.iconStyle, ...(subItem.listItemIconStyle || undefined) }}
                                >
                                    {subItem.icon}
                                </ListItemIcon>
                                <ListItemText>{subItem.label}</ListItemText>
                            </MenuItem> : null))}
                        </Menu>);
                    }
                } else {
                    items.push(<MenuItem
                        key={key}
                        onClick={ITEMS[key].onClick}
                        sx={ITEMS[key].style}
                    >
                        <ListItemIcon style={{ ...ITEMS[key].iconStyle, ...ITEMS[key].listItemIconStyle }}>
                            {ITEMS[key].icon}
                        </ListItemIcon>
                        <ListItemText>{ITEMS[key].label}</ListItemText>
                        {ITEMS[key].key ? <div style={styles.contextMenuKeys}>
                            {`Alt+${ITEMS[key].key === 'Delete' ? this.props.t('ra_Del') : ITEMS[key].key}`}
                        </div> : null}
                    </MenuItem>);
                }
            }
        });

        if (!items.length) {
            setTimeout(() => this.setState({ showContextMenu: null }), 100);
            return null;
        }

        const el = document.getElementById(id);

        return <Menu
            key="contextMenu"
            open={!0}
            onKeyUp={e => {
                e.preventDefault();
                if (e.altKey) {
                    Object.keys(ITEMS).forEach(key => {
                        if (e.key === ITEMS[key].key) {
                            ITEMS[key].onClick && ITEMS[key].onClick();
                        }
                    });
                }
            }}
            anchorEl={el}
            onClose={() => {
                this.setState({ showContextMenu: null });
                this.contextMenu = null;
            }}
        >
            {items}
        </Menu>;
    }

    private renderEditValueDialog(): React.JSX.Element | null {
        if (!this.state.updateOpened || !this.props.objectBrowserValue) {
            return null;
        }

        if (!this.edit.id) {
            console.error(`Invalid ID for edit: ${JSON.stringify(this.edit)}`);
            return null;
        }

        if (!this.objects[this.edit.id]) {
            console.error(`Something went wrong. Possibly the object ${this.edit.id} was deleted.`);
            return null;
        }

        const type = this.objects[this.edit.id].common?.type
            ? this.objects[this.edit.id].common.type
            : typeof this.edit.val;

        const role = this.objects[this.edit.id].common.role;

        const ObjectBrowserValue = this.props.objectBrowserValue;

        return <ObjectBrowserValue
            t={this.props.t}
            lang={this.props.lang}
            type={type}
            role={role || ''}
            states={Utils.getStates(this.objects[this.edit.id] as ioBroker.StateObject)}
            themeType={this.props.themeType}
            expertMode={!!this.state.filter.expertMode}
            value={this.edit.val}
            socket={this.props.socket}
            object={this.objects[this.edit.id] as ioBroker.StateObject}
            defaultHistory={this.defaultHistory}
            dateFormat={this.props.dateFormat || this.systemConfig.common.dateFormat}
            isFloatComma={this.props.isFloatComma === undefined ? this.systemConfig.common.isFloatComma : this.props.isFloatComma}
            onClose={(res?: { val: ioBroker.StateValue; ack: boolean; q: ioBroker.STATE_QUALITY[keyof ioBroker.STATE_QUALITY]; expire: number | undefined }) => {
                this.setState({ updateOpened: false });
                res && this.onUpdate(res);
            }}
        />;
    }

    /**
     * The rendering method of this component.
     */
    render(): React.JSX.Element {
        this.recordStates = [];
        this.unsubscribeTimer && clearTimeout(this.unsubscribeTimer);

        if (this.styleTheme !== this.props.themeType) {
            this.styles = {
                cellIdIconFolder: getStyle(this.props.theme, styles.cellIdIconFolder),
                cellIdIconDocument: getStyle(this.props.theme, styles.cellIdIconDocument),
                iconDeviceError: getStyle(this.props.theme, styles.iconDeviceError),
                iconDeviceConnected: getStyle(this.props.theme, styles.iconDeviceConnected),
                iconDeviceDisconnected: getStyle(this.props.theme, styles.iconDeviceDisconnected),
                cellButtonsButtonWithCustoms: getStyle(this.props.theme, styles.cellButtonsButtonWithCustoms),
                invertedBackground: getStyle(this.props.theme, styles.invertedBackground),
                invertedBackgroundFlex: getStyle(this.props.theme, styles.invertedBackgroundFlex),
                contextMenuEdit: getStyle(this.props.theme, styles.contextMenuEdit),
                contextMenuEditValue: getStyle(this.props.theme, styles.contextMenuEditValue),
                contextMenuView: getStyle(this.props.theme, styles.contextMenuView),
                contextMenuCustom: getStyle(this.props.theme, styles.contextMenuCustom),
                contextMenuACL: getStyle(this.props.theme, styles.contextMenuACL),
                contextMenuRoom: getStyle(this.props.theme, styles.contextMenuRoom),
                contextMenuRole: getStyle(this.props.theme, styles.contextMenuRole),
                contextMenuDelete: getStyle(this.props.theme, styles.contextMenuDelete),
                filterInput: getStyle(this.props.theme, styles.headerCellInput, styles.filterInput),
                iconCopy: getStyle(this.props.theme, styles.cellButtonsValueButton, styles.cellButtonsValueButtonCopy),
                aliasReadWrite: getStyle(styles.cellIdAlias, styles.cellIdAliasReadWrite),
                aliasAlone: getStyle(styles.cellIdAlias, styles.cellIdAliasAlone),
            };
            this.styleTheme = this.props.themeType;
        }

        // apply filter if changed
        const jsonFilter = JSON.stringify(this.state.filter);

        if (this.lastAppliedFilter !== jsonFilter && this.objects && this.root) {
            const counter = { count: 0 };

            applyFilter(
                this.root,
                this.state.filter,
                this.props.lang,
                this.objects,
                undefined,
                counter,
                this.props.customFilter,
                this.props.types,
            );

            if (counter.count < 500 && !this.state.expandAllVisible) {
                setTimeout(() => this.setState({ expandAllVisible: true }));
            } else if (counter.count >= 500 && this.state.expandAllVisible) {
                setTimeout(() => this.setState({ expandAllVisible: false }));
            }

            this.lastAppliedFilter = jsonFilter;
        }

        this.unsubscribeTimer = setTimeout(() => {
            this.unsubscribeTimer = null;
            this.checkUnsubscribes();
        }, 200);

        if (!this.state.loaded) {
            return <CircularProgress key={`${this.props.dialogName}_c`} />;
        }
        const items = this.root ? this.renderItem(this.root, undefined) : null;

        return <TabContainer key={this.props.dialogName}>
            <style>
                {`
@keyframes newValueAnimation-light {
    0% {
        color: #00f900;
    }
    80% {
        color: #008000;
    }
    100% {
        color: #000;
    }
}
@keyframes newValueAnimation-dark {
    0% {
        color: #00f900;
    }
    80% {
        color: #008000;
    }
    100% {
        color: #fff;
    }
}
.newValueBrowser-dark {
    animation: newValueAnimation-dark 2s ease-in-out;
}
.newValueBrowser-light {
    animation: newValueAnimation-light 2s ease-in-out;
}
`}
            </style>
            <TabHeader>{this.getToolbar()}</TabHeader>
            <TabContent>
                {this.renderHeader()}
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                <div
                    style={styles.tableDiv}
                    ref={this.tableRef}
                    onKeyDown={event => this.navigateKeyPress(event)}
                >
                    {items}
                </div>
            </TabContent>
            {this.renderContextMenu()}
            {this.renderToast()}
            {this.renderColumnsEditCustomDialog()}
            {this.renderColumnsSelectorDialog()}
            {this.renderCustomDialog()}
            {this.renderEditValueDialog()}
            {this.renderEditObjectDialog()}
            {this.renderViewObjectFileDialog()}
            {this.renderAliasEditorDialog()}
            {this.renderEditRoleDialog()}
            {this.renderEnumDialog()}
            {this.renderErrorDialog()}
            {this.renderExportDialog()}
            {this.state.modalNewObj && this.props.modalNewObject && this.props.modalNewObject(this)}
            {this.state.modalEditOfAccess && this.state.modalEditOfAccessObjData &&
                this.props.modalEditOfAccessControl &&
                this.props.modalEditOfAccessControl(this, this.state.modalEditOfAccessObjData)}
        </TabContainer>;
    }
}

export default withWidth()(ObjectBrowserClass);
