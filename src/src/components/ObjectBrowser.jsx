/**
 * Copyright 2020-2023, Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 * To all editors: please merge asap the changes to https://github.com/ioBroker/adapter-react/blob/master/src/Components/ObjectBrowser.js
 * This file is here only temporary for better debugging
 * */
import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import SVG from 'react-inlinesvg';

import {
    IconButton,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    Input,
    Grid,
    Badge,
    Tooltip,
    Snackbar,
    Checkbox,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    DialogTitle,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Fab,
    TextField,
    FormControlLabel,
    Switch, Menu,
} from '@mui/material';

// Icons
import {
    Edit as IconEdit,
    FindInPage,
    Construction,
    Link as IconLink,
    FormatItalic as IconValueEdit,
    Delete as IconDelete,
    Settings as IconConfig,
    SettingsApplications as IconSystem,
    Photo as IconPhoto,
    SupervisedUserCircle as IconGroup,
    CalendarToday as IconSchedule,
    PersonOutlined as IconUser,
    Router as IconHost,
    Wifi as IconConnection,
    Info as IconInfo,
    Description as IconMeta,
    Code as IconScript,
    ShowChart as IconChart,
    ListAlt as IconEnum,
    ViewColumn as IconColumns,
    Close as IconClose,
    Check as IconCheck,
    Build as BuildIcon,
    Publish as PublishIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    LooksOne as LooksOneIcon,
    RoomService as PressButtonIcon,
    Error as IconError,
    WifiOff as IconDisconnected,
    TextFields as TextFieldsIcon,
    BorderColor,
    BedroomParent,
} from '@mui/icons-material';

import IconExpert from '@iobroker/adapter-react-v5/icons/IconExpert';
import IconAdapter from '@iobroker/adapter-react-v5/icons/IconAdapter';
import IconAlias from '@iobroker/adapter-react-v5/icons/IconAlias';
import IconChannel from '@iobroker/adapter-react-v5/icons/IconChannel';
import IconCopy from '@iobroker/adapter-react-v5/icons/IconCopy';
import IconDevice from '@iobroker/adapter-react-v5/icons/IconDevice';
import IconDocument from '@iobroker/adapter-react-v5/icons/IconDocument';
import IconDocumentReadOnly from '@iobroker/adapter-react-v5/icons/IconDocumentReadOnly';
import IconInstance from '@iobroker/adapter-react-v5/icons/IconInstance';
import IconState from '@iobroker/adapter-react-v5/icons/IconState';
import IconClosed from '@iobroker/adapter-react-v5/icons/IconClosed';
import IconOpen from '@iobroker/adapter-react-v5/icons/IconOpen';
import IconClearFilter from '@iobroker/adapter-react-v5/icons/IconClearFilter';

// own
import { Icon, withWidth } from '@iobroker/adapter-react-v5';
import Utils from './Utils'; // @iobroker/adapter-react-v5/Components/Utils
import TabContainer from './TabContainer';
import TabContent from './TabContent';
import TabHeader from './TabHeader';

const ICON_SIZE = 24;
const ROW_HEIGHT = 32;
const ITEM_LEVEL = 16;
const SMALL_BUTTON_SIZE = 20;
const COLOR_NAME_SYSTEM = '#ff6d69';
const COLOR_NAME_SYSTEM_ADAPTER = '#5773ff';
const COLOR_NAME_ERROR_DARK = '#ff413c';
const COLOR_NAME_ERROR_LIGHT = '#86211f';
const COLOR_NAME_CONNECTED_DARK = '#57ff45';
const COLOR_NAME_CONNECTED_LIGHT = '#098c04';
const COLOR_NAME_DISCONNECTED_DARK = '#f3ad11';
const COLOR_NAME_DISCONNECTED_LIGHT = '#6c5008';

const styles = theme => ({
    toolbar: {
        minHeight: 38, // Theme.toolbar.height,
        //        boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)'
    },
    toolbarButtons: {
        padding: 4,
        marginLeft: 4,
    },
    switchColumnAuto: {
        marginLeft: theme.spacing(2),
    },
    dialogColumns: {
        transition: 'opacity 1s',
    },
    dialogColumnsLabel: {
        fontSize: 12,
        paddingTop: theme.spacing(1),
    },
    columnCustom: {
        width: '100%',
        display: 'inline-block',
    },
    columnCustomEditable: {
        cursor: 'text',
    },
    columnCustomCenter: {
        textAlign: 'center',
    },
    columnCustomLeft: {
        textAlign: 'left',
    },
    columnCustomRight: {
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
    columnsDialogInputWidth: {
        width: 80,
    },
    headerRow: {
        paddingLeft: theme.spacing(1),
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
        paddingTop: 0, // theme.spacing(1),
        paddingLeft: 0,
        width: `calc(100% - ${theme.spacing(1)})`,
        height: 'calc(100% - 38px)',
        overflow: 'auto',
    },
    tableRow: {
        paddingLeft: theme.spacing(1),
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
    },
    tableRowLines: {
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#8888882e' : '#8888882e'}`,
        '& > div': {
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#8888882e' : '#8888882e'}`,
        },
    },
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
            marginTop: 2,
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
    cellIdIconFolder: {
        marginRight: theme.spacing(1),
        width: ROW_HEIGHT - 4,
        height: ROW_HEIGHT - 4,
        cursor: 'pointer',
        color: theme.palette.secondary.main || '#fbff7d',
        verticalAlign: 'top',
    },
    cellIdIconDocument: {
        verticalAlign: 'middle',
        marginLeft: (ROW_HEIGHT - SMALL_BUTTON_SIZE) / 2,
        marginRight: theme.spacing(1),
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
        '&:hover': {
            opacity: 1,
        },
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
        marginLeft: 5,
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
    cellIdAlias: {
        fontStyle: 'italic',
        fontSize: 12,
        opacity: 0.7,
        '&:hover': {
            color: theme.palette.mode === 'dark' ? '#009900' : '#007700',
        },
    },
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
        marginLeft: theme.spacing(0.5),
        opacity: 0.8,
    },
    newValue: {
        animation: '$newValueAnimation 2s ease-in-out',
    },
    '@keyframes newValueAnimation': {
        '0%': {
            color: '#00f900',
        },
        '80%': {
            color: '#008000',
        },
        '100%': {
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        },
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
    cellButtonsButtonWithCustoms: {
        color: theme.palette.secondary.main,
    },
    cellButtonsButtonWithoutCustoms: {
        opacity: 0.2,
    },
    cellButtonsValueButton: {
        position: 'absolute',
        display: 'inline-block',
        top: SMALL_BUTTON_SIZE / 2 - 2,
        opacity: 0.7,
        width: SMALL_BUTTON_SIZE - 2,
        height: SMALL_BUTTON_SIZE - 2,
        color: theme.palette.action.active,
        '&:hover': {
            opacity: 1,
        },
    },
    cellButtonsValueButtonCopy: {
        right: theme.spacing(1),
        cursor: 'pointer',
    },
    cellButtonsValueButtonEdit: {
        right: SMALL_BUTTON_SIZE / 2 + parseInt(theme.spacing(2), 10),
    },

    filteredOut: {
        opacity: 0.5,
    },
    filteredParentOut: {
        opacity: 0.3,
    },
    filterInput: {
        marginTop: 0,
        marginBottom: 0,
    },
    selectIcon: {
        width: 24,
        height: 24,
        marginRight: 4,
    },
    selectNone: {
        opacity: 0.5,
    },
    itemSelected: {
        background: `${theme.palette.primary.main} !important`,
        color: `${Utils.invertColor(theme.palette.primary.main, true)} !important`,
    },
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
        paddingTop: 3,
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
            marginRight: 5,
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
        marginRight: theme.spacing(1),
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
    '@media screen and (max-width: 465px)': {
        columnsDialogInputWidth: {
            width: 50,
        },
        fontSizeTitle: {
            '& *': {
                fontSize: 12,
            },
        },
    },
    '@media screen and (max-width: 700px)': {

    },
    '@media screen and (max-width: 430px)': {

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
        borderRadius: 20,
        backgroundColor: theme.palette.background.default,
    },
    iconDeviceConnected: {
        color: theme.palette.mode === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 32,
        width: 20,
    },
    iconDeviceDisconnected: {
        color: theme.palette.mode === 'dark' ? COLOR_NAME_DISCONNECTED_DARK : COLOR_NAME_DISCONNECTED_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 32,
        width: 20,
    },
    iconDeviceError: {
        color: theme.palette.mode === 'dark' ? COLOR_NAME_ERROR_DARK : COLOR_NAME_ERROR_LIGHT,
        opacity: 0.8,
        position: 'absolute',
        top: 4,
        right: 50,
        width: 20,
    },
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
    resizeHandleLeft: {
        left: -4,
        borderLeft: '2px dotted #888',
        '&:hover': {
            borderColor: '#ccc',
            borderLeftStyle: 'solid',
        },
        '&.active': {
            borderColor: '#517ea5',
            borderLeftStyle: 'solid',
        },
    },
    invertedBackground: {
        backgroundColor: theme.palette.mode === 'dark' ? '#9a9a9a' : '#565656',
        padding: '0 3px',
        borderRadius: '2px 0 0 2px',
    },
    invertedBackgroundFlex: {
        backgroundColor: theme.palette.mode === 'dark' ? '#9a9a9a' : '#565656',
        borderRadius: '0 2px 2px 0',
    },
});

function generateFile(filename, obj) {
    const el = document.createElement('a');
    el.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj, null, 2))}`);
    el.setAttribute('download', filename);

    el.style.display = 'none';
    document.body.appendChild(el);

    el.click();

    document.body.removeChild(el);
}

// d=data, t=target, s=start, e=end, m=middle
function binarySearch(list, find, _start, _end) {
    _start = _start || 0;
    if (_end === undefined) {
        _end = list.length - 1;
        if (!_end) {
            return list[0] === find;
        }
    }
    const middle = Math.floor((_start + _end) / 2);
    if (find === list[middle]) {
        return list[middle];
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

function getName(name, lang) {
    if (name && typeof name === 'object') {
        return (name[lang] || name.en || '').toString();
    }

    return (name || '').toString();
}

function getSelectIdIcon(objects, id, imagePrefix) {
    imagePrefix = imagePrefix || '.'; // http://localhost:8081';
    let src = '';
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

function applyFilter(item, filters, lang, objects, context, counter, customFilter, selectedTypes, _depth) {
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
            context.room =
                (objects[filters.room] && objects[filters.room].common && objects[filters.room].common.members) || [];
        }
        if (filters.func) {
            context.func =
                (objects[filters.func] && objects[filters.func].common && objects[filters.func].common.members) || [];
        }
    }

    const data = item.data;

    if (data && data.id) {
        const common = data.obj?.common;

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
                    if (!customFilter.type.includes(common.type)) {
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
                    if (!customFilter.common.role.find(role => customFilter.role.includes(role))) {
                        filteredOut = true;
                    }
                }
            }
            if (!filteredOut && customFilter.common?.custom === '_' && common?.custom) {
                filteredOut = true;
            }

            if (!filteredOut && customFilter.common?.custom && customFilter.common?.custom !== '_') {
                if (!common?.custom) {
                    filteredOut = true;
                } else if (customFilter.common.custom === '_dataSources') {
                    // TODO: make it configurable
                    if (
                        !Object.keys(common.custom).find(
                            id => id.startsWith('history.') || id.startsWith('sql.') || id.startsWith('influxdb.'),
                        )
                    ) {
                        filteredOut = true;
                    }
                } else if (
                    customFilter.common.custom !== true &&
                    !Object.keys(common.custom).find(id => id.startsWith(customFilter.common.custom))
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
                (common && common.expert);
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
                filteredOut = !(common.role && common.role.startsWith(context.role));
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

function getVisibleItems(item, type, objects, _result) {
    _result = _result || [];
    const data = item.data;
    if (data.sumVisibility) {
        data.id && objects[data.id] && (!type || objects[data.id].type === type) && _result.push(data.id);
        item.children?.forEach(_item =>
            getVisibleItems(_item, type, objects, _result));
    }

    return _result;
}

function getSystemIcon(objects, id, k, imagePrefix) {
    let icon;

    // system or design have special icons
    if (id.startsWith('_design/') || id === 'system') {
        icon = <IconSystem className="iconOwn" />;
    } else if (id === '0_userdata' || id === '0_userdata.0') {
        icon = <IconPhoto className="iconOwn" />;
    } else if (id === 'alias' || id === 'alias.0') {
        icon = <IconAlias className="iconOwn" />;
    } else if (id === 'system.adapter') {
        icon = <IconSystem className="iconOwn" />;
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
    } else if (k < 2) {
        // detect "cloud.0"
        if (objects[`system.adapter.${id}`]) {
            icon = getSelectIdIcon(objects, `system.adapter.${id}`, imagePrefix);
        }
    }

    return icon || null;
}

function getObjectTooltip(data, lang) {
    if (!data) {
        return null;
    }
    if (data.obj?.common?.desc) {
        let tooltip = '';

        if (typeof data.obj.common.desc === 'object') {
            tooltip = data.obj.common.desc[lang] || data.obj.common.desc.en;
        } else {
            tooltip = data.obj.common.desc;
        }
        if (!tooltip) {
            return null;
        }

        return tooltip.toString();
    }

    return null;
}

function getIdFieldTooltip(data, classes, lang) {
    const tooltip = getObjectTooltip(data, lang);
    if (tooltip?.startsWith('http')) {
        return <a
            className={Utils.clsx(classes.cellIdTooltipLink)}
            href={tooltip}
            target="_blank"
            rel="noreferrer"
        >
            {tooltip}
        </a>;
    }
    return <span className={Utils.clsx(classes.cellIdTooltip)}>{tooltip || data.id || ''}</span>;
}

function buildTree(objects, options) {
    options = options || {};
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
    let currentPathArr = [];
    let currentPath = '';
    let currentPathLen = 0;
    const root = {
        data: {
            name: '',
            id: '',
        },
        children: [],
    };

    const info = {
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

    let croot = root;

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

            // If current level is still OK, and we can add ID to children
            if (!currentPath || id.startsWith(`${currentPath}.`)) {
                // if more than one level added
                if (parts.length - currentPathLen > 1) {
                    let curPath = currentPath;
                    // generate missing levels
                    for (let k = currentPathLen; k < parts.length - 1; k++) {
                        curPath += (curPath ? '.' : '') + parts[k];
                        // level does not exist
                        if (!binarySearch(info.ids, curPath)) {
                            const _croot = {
                                data: {
                                    name:      parts[k],
                                    parent:    croot,
                                    id:        curPath,
                                    obj:       objects[curPath],
                                    level:     k,
                                    icon:      getSystemIcon(objects, curPath, k, imagePrefix),
                                    generated: true,
                                },
                            };

                            croot.children = croot.children || [];
                            croot.children.push(_croot);
                            croot = _croot;
                            info.ids.push(curPath); // IDs will be added by alphabet
                        } else {
                            croot = croot.children.find(item => item.data.name === parts[k]);
                        }
                    }
                }

                const _croot = {
                    data: {
                        name:       parts[parts.length - 1],
                        title:      getName(obj && obj.common && obj.common.name, options.lang),
                        obj,
                        parent:     croot,
                        icon:       getSelectIdIcon(objects, id, imagePrefix) || getSystemIcon(objects, id, 0, imagePrefix),
                        id,
                        hasCustoms: obj.common?.custom && Object.keys(obj.common.custom).length,
                        level:      parts.length - 1,
                        generated:  false,
                        button:     obj.type === 'state' &&
                                    obj.common?.role &&
                                    typeof obj.common.role === 'string' &&
                                    obj.common.role.startsWith('button') &&
                                    obj.common?.write !== false,
                    },
                };

                croot.children = croot.children || [];
                croot.children.push(_croot);
                croot = _croot;

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
                        croot = croot.data.parent;
                        move--;
                    }
                } else {
                    croot = root;
                    currentPathArr = [];
                    currentPath = '';
                    currentPathLen = 0;
                }
                repeat = true;
            }
        } while (repeat);
    }

    info.roomEnums.sort((a, b) => {
        const aName = getName(objects[a]?.common?.name || a.split('.').pop());
        const bName = getName(objects[b]?.common?.name || b.split('.').pop());
        if (aName > bName) {
            return 1;
        }
        if (aName < bName) {
            return -1;
        }
        return 0;
    });
    info.funcEnums.sort((a, b) => {
        const aName = getName(objects[a]?.common?.name || a.split('.').pop());
        const bName = getName(objects[b]?.common?.name || b.split('.').pop());
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

function findNode(root, id, _parts, _path, _level) {
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
    for (let i = 0; i < root.children.length; i++) {
        const _id = root.children[i].data.id;
        if (_id === _path) {
            found = root.children[i];
            break;
        } else if (_id > _path) {
            break;
        }
    }
    if (found) {
        return findNode(found, id, _parts, `${_path}.${_parts[_level + 1]}`, _level + 1);
    }

    return null;
}

function findRoomsForObject(data, id, lang, withParentInfo, rooms) {
    if (!id) {
        return { rooms: [], per: false };
    }
    rooms = rooms || [];
    for (let i = 0; i < data.roomEnums.length; i++) {
        const common = data.objects[data.roomEnums[i]]?.common;
        const name = getName(common.name, lang);

        if (common?.members?.includes(id) && !rooms.includes(name)) {
            if (!withParentInfo) {
                rooms.push(name);
            } else {
                rooms.push({ name, origin: id });
            }
        }
    }

    let ownEnums;

    // Check parent
    const parts = id.split('.');
    parts.pop();
    id = parts.join('.');
    if (data.objects[id]) {
        ownEnums = rooms.length;
        findRoomsForObject(data, id, lang, withParentInfo, rooms);
    }

    return { rooms, per: !ownEnums }; // pe is if the enums are from parent
}

function findEnumsForObjectAsIds(data, id, enumName, funcs) {
    if (!id) {
        return [];
    }
    funcs = funcs || [];
    for (let i = 0; i < data[enumName].length; i++) {
        const common = data.objects[data[enumName][i]]?.common;
        if (common?.members?.includes(id) && !funcs.includes(data[enumName][i])) {
            funcs.push(data[enumName][i]);
        }
    }
    funcs.sort();

    return funcs;
}

function findFunctionsForObject(data, id, lang, withParentInfo, funcs) {
    if (!id) {
        return { funcs: [], pef: false };
    }
    funcs = funcs || [];
    for (let i = 0; i < data.funcEnums.length; i++) {
        const common = data.objects[data.funcEnums[i]]?.common;
        const name = getName(common.name, lang);
        if (common?.members?.includes(id) && !funcs.includes(name)) {
            if (!withParentInfo) {
                funcs.push(name);
            } else {
                funcs.push({ name, origin: id });
            }
        }
    }

    let ownEnums;

    // Check parent
    const parts = id.split('.');
    parts.pop();
    id = parts.join('.');
    if (data.objects[id]) {
        ownEnums = funcs.length;
        findFunctionsForObject(data, id, lang, withParentInfo, funcs);
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

/** @typedef  {{ state: ioBroker.State, obj: Record<string, any>, texts: Record<string, any>, dateFormat: any, isFloatComma: boolean }} FormatValueOptions */

/**
 * Format a state value for visualization
 *
 * @param {FormatValueOptions} options
 * @return {{valText: {}, valFull: [{t: (*|String), v: (string|*)}] }}
 */
function formatValue(options) {
    const {
        dateFormat, obj, state, isFloatComma, texts,
    } = options;
    const states = Utils.getStates(obj);
    const isCommon = obj.common;

    const valText = {};
    let v =
        isCommon && isCommon.type === 'file'
            ? '[file]'
            : !state || state.val === null
                ? '(null)'
                : state.val === undefined
                    ? '[undef]'
                    : state.val;
    const type = typeof v;

    if (isCommon?.role && typeof isCommon.role === 'string' && isCommon.role.match(/^value\.time|^date/)) {
        if (v && typeof v === 'string') {
            if (v.length === 13) {
                // (length of "1647597254924") warning, this solution only works till Nov 20 2286 18:46:39CET
                v = new Date(parseInt(v, 10)).toString();
            } else {
                // we don't know what is that, so leave it as it is
            }
        } else {
            if (v > 946681200 && v < 946681200000) {
                // '2000-01-01T00:00:00' => 946681200000
                v *= 1000; // may be the time is in seconds (UNIX time)
            }
            // null and undefined could not be here. See `let v = (isCommon && isCommon.type === 'file') ....` above
            v = v ? new Date(v).toString() : v;
        }
    } else {
        if (type === 'number') {
            v = Math.round(v * 100000000) / 100000000; // remove 4.00000000000000001
            if (isFloatComma) {
                v = v.toString().replace('.', ',');
            }
        } else if (type === 'object') {
            v = JSON.stringify(v);
        } else if (type !== 'string') {
            v = v.toString();
        }

        if (typeof v !== 'string') {
            v = v.toString();
        }
    }

    // try to replace number with "common.states"
    if (states && states[v] !== undefined) {
        if (v !== states[v]) {
            valText.s = v;
            v = states[v];
        }
    }

    if (isCommon?.unit) {
        valText.u = isCommon.unit;
    }
    const valFull = [{ t: texts.value, v }];

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

    valText.v = v;

    return {
        valText,
        valFull,
    };
}

/** @typedef {{ state: ioBroker.State, isExpertMode: boolean, isButton: boolean }} GetValueStyleOptions */

/**
 * Get css style for given state value
 *
 * @param {GetValueStyleOptions} options
 * @return {{color: (string)}}
 */
function getValueStyle(options) {
    const { state, isExpertMode, isButton } = options;
    let color = state?.ack ? (state.q ? '#ffa500' : '') : '#ff2222c9';

    if (!isExpertMode && isButton) {
        color = '';
    }

    return { color };
}

function prepareSparkData(values, from) {
    // set every hour one point
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
                const val =
                    values[i - 1].val +
                    ((values[i].val - values[i - 1].val) * (time - values[i - 1].ts)) /
                        (values[i].ts - values[i - 1].ts);

                v.push(val);
            }
        }

        time += 3600000;
    }

    return v;
}

/**
 * @type {import('./types').ObjectBrowserTableFilter}
 */
const DEFAULT_FILTER = {
    id: '',
    name: '',
    room: '',
    func: '',
    role: '',
    type: '',
    custom: '',
    expertMode: false,
};

const ITEM_IMAGES = {
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

const StyledBadge = withStyles(theme => ({
    badge: {
        right: 3,
        top: 3,
        border: `2px solid ${theme.palette.background.paper}`,
        padding: '0 4px',
    },
}))(Badge);

const SCREEN_WIDTHS = {
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

/**
 * @extends {React.Component<import('./types').ObjectBrowserProps>}
 */
class ObjectBrowser extends Component {
    /**
     * @param {import('./types').ObjectBrowserProps} props
     */
    constructor(props) {
        super(props);

        this.lastSelectedItems =
            (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.objectSelected`) ||
            '[]';
        try {
            this.lastSelectedItems = JSON.parse(this.lastSelectedItems);
            if (typeof this.lastSelectedItems !== 'object') {
                this.lastSelectedItems = [this.lastSelectedItems];
            }
            this.lastSelectedItems = this.lastSelectedItems.filter(id => id);
        } catch (e) {
            // ignore
        }

        let expanded =
            (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.objectExpanded`) ||
            '[]';
        try {
            expanded = JSON.parse(expanded);
        } catch (e) {
            expanded = [];
        }

        let filter = props.defaultFilters ||
            (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.objectFilter`) || {
            ...DEFAULT_FILTER,
        };

        if (typeof filter === 'string') {
            try {
                filter = JSON.parse(filter);
            } catch (e) {
                filter = { ...DEFAULT_FILTER };
            }
        }

        filter.expertMode =
            props.expertMode !== undefined
                ? props.expertMode
                : (window._sessionStorage || window.sessionStorage).getItem('App.expertMode') === 'true';
        this.tableRef = createRef();
        this.filterRefs = {};

        Object.keys(DEFAULT_FILTER).forEach(name => (this.filterRefs[name] = createRef()));

        this.lastAppliedFilter = null;
        this.pausedSubscribes = false;

        this.selectedFound = false;
        this.root = null;
        this.states = {};
        this.subscribes = [];
        this.statesUpdateTimer = null;
        this.objectsUpdateTimer = null;

        this.visibleCols = props.columns || SCREEN_WIDTHS[props.width].fields;
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

        let selected = props.selected || '';
        if (typeof selected !== 'object') {
            selected = [selected];
        }
        selected = selected.map(id => id.replace(/["']/g, '')).filter(id => id);

        let columns = (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.columns`);
        try {
            columns = columns ? JSON.parse(columns) : null;
        } catch (e) {
            columns = null;
        }

        let columnsWidths = null; // (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.columnsWidths`);
        try {
            columnsWidths = columnsWidths ? JSON.parse(columnsWidths) : {};
        } catch (e) {
            columnsWidths = {};
        }

        this.imagePrefix = props.imagePrefix || '.';
        let foldersFirst = (window._localStorage || window.localStorage).getItem(
            `${props.dialogName || 'App'}.foldersFirst`,
        );
        if (foldersFirst === 'false') {
            foldersFirst = false;
        } else if (foldersFirst === 'true') {
            foldersFirst = true;
        } else {
            foldersFirst = props.foldersFirst === undefined ? true : props.foldersFirst;
        }

        let statesView = false;
        try {
            statesView = this.props.objectStatesView
                ? JSON.parse(
                    (window._localStorage || window.localStorage).getItem(
                        `${props.dialogName || 'App'}.objectStatesView`,
                    ),
                ) || false
                : false;
        } catch (error) {
            // ignore
        }

        this.state = {
            loaded: false,
            foldersFirst,
            selected,
            selectedNonObject:
                (window._localStorage || window.localStorage).getItem(
                    `${props.dialogName || 'App'}.selectedNonObject`,
                ) || '',
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
            columnsAuto:
                (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.columnsAuto`) !==
                'false',
            columnsWidths,
            columnsDialogTransparent: 100,
            columnsEditCustomDialog: null,
            customColumnDialogValueChanged: false,
            showExportDialog: false,
            linesEnabled:
                (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.lines`) === 'true',
            showDescription:
                (window._localStorage || window.localStorage).getItem(`${props.dialogName || 'App'}.desc`) !== 'false',
            showContextMenu: null,
        };

        this.edit = {};

        this.texts = {
            value:                    props.t('ra_tooltip_value'),
            ack:                      props.t('ra_tooltip_ack'),
            ts:                       props.t('ra_tooltip_ts'),
            lc:                       props.t('ra_tooltip_lc'),
            from:                     props.t('ra_tooltip_from'),
            user:                     props.t('ra_tooltip_user'),
            c:                        props.t('ra_tooltip_comment'),
            quality:                  props.t('ra_tooltip_quality'),
            editObject:               props.t('ra_tooltip_editObject'),
            deleteObject:             props.t('ra_tooltip_deleteObject'),
            customConfig:             props.t('ra_tooltip_customConfig'),
            copyState:                props.t('ra_tooltip_copyState'),
            editState:                props.t('ra_tooltip_editState'),
            close:                    props.t('ra_Close'),
            filter_id:                props.t('ra_filter_id'),
            filter_name:              props.t('ra_filter_name'),
            filter_type:              props.t('ra_filter_type'),
            filter_role:              props.t('ra_filter_role'),
            filter_room:              props.t('ra_filter_room'),
            filter_func:              props.t('ra_filter_func'),
            filter_custom:            props.t('ra_filter_customs'), //
            filterCustomsWithout:     props.t('ra_filter_customs_without'), //
            objectChangedByUser:      props.t('ra_object_changed_by_user'), // Object last changed at
            objectChangedBy:          props.t('ra_object_changed_by'), // Object changed by
            objectChangedFrom:        props.t('ra_state_changed_from'), // Object changed from
            stateChangedBy:           props.t('ra_state_changed_by'), // State changed by
            stateChangedFrom:         props.t('ra_state_changed_from'), // State changed from
            ownerGroup:               props.t('ra_Owner group'),
            ownerUser:                props.t('ra_Owner user'),
            deviceError:              props.t('ra_Error'),
            deviceDisconnected:       props.t('ra_Disconnected'),
            deviceConnected:          props.t('ra_Connected'),

            aclOwner_read_object:     props.t('ra_aclOwner_read_object'),
            aclOwner_read_state:      props.t('ra_aclOwner_read_state'),
            aclOwner_write_object:    props.t('ra_aclOwner_write_object'),
            aclOwner_write_state:     props.t('ra_aclOwner_write_state'),
            aclGroup_read_object:     props.t('ra_aclGroup_read_object'),
            aclGroup_read_state:      props.t('ra_aclGroup_read_state'),
            aclGroup_write_object:    props.t('ra_aclGroup_write_object'),
            aclGroup_write_state:     props.t('ra_aclGroup_write_state'),
            aclEveryone_read_object:  props.t('ra_aclEveryone_read_object'),
            aclEveryone_read_state:   props.t('ra_aclEveryone_read_state'),
            aclEveryone_write_object: props.t('ra_aclEveryone_write_object'),
            aclEveryone_write_state:  props.t('ra_aclEveryone_write_state'),
        };

        this.levelPadding = props.levelPadding || ITEM_LEVEL;

        let resizerCurrentWidths = (window._localStorage || window.localStorage).getItem(
            `${this.props.dialogName || 'App'}.table`,
        );
        if (resizerCurrentWidths) {
            try {
                resizerCurrentWidths = JSON.parse(resizerCurrentWidths);
                this.storedWidths = JSON.parse(JSON.stringify(SCREEN_WIDTHS[this.props.width]));
                Object.keys(resizerCurrentWidths).forEach(id => {
                    if (id === 'id') {
                        SCREEN_WIDTHS[this.props.width].idWidth = resizerCurrentWidths.id;
                    } else if (id === 'nameHeader') {
                        SCREEN_WIDTHS[this.props.width].widths.name = resizerCurrentWidths[id];
                    } else if (SCREEN_WIDTHS[this.props.width].widths[id] !== undefined) {
                        SCREEN_WIDTHS[this.props.width].widths[id] = resizerCurrentWidths[id];
                    }
                });

                this.customWidth = true;
            } catch (e) {
                // ignore
            }
        }

        this.calculateColumnsVisibility();
    }

    loadAllObjects(update) {
        const props = this.props;
        let objects;

        return new Promise(resolve => {
            this.setState({ updating: true }, () => resolve());
        })
            .then(() =>
                (this.props.objectsWorker
                    ? this.props.objectsWorker.getObjects(update)
                    : props.socket.getObjects(update, true)))
            .then(_objects => {
                objects = _objects;
                if (props.types && props.types[0] !== 'state') {
                    if (props.length >= 1) {
                        console.error('more than one type does not supported! Use filterFunc instead');
                    }
                    return props.socket.getObjectViewSystem(props.types[0], null, null);
                }
                return !objects['system.config']
                    ? props.socket.getObject('system.config').then(obj => ({ 'system.config': obj }))
                    : Promise.resolve(null);
            })
            .then(moreObjects => {
                this.systemConfig = objects['system.config'] || moreObjects['system.config'] || {};

                if (moreObjects) {
                    if (moreObjects['system.config']) {
                        delete moreObjects['system.config'];
                    }
                    Object.assign(objects, moreObjects);
                }

                this.systemConfig.common = this.systemConfig.common || {};
                this.systemConfig.common.defaultNewAcl = this.systemConfig.common.defaultNewAcl || {};
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
                    Object.keys(objects).forEach(id => {
                        try {
                            if (props.filterFunc(objects[id])) {
                                this.objects[id] = objects[id];
                            }
                        } catch (e) {
                            console.log(`Error by filtering of "${id}": ${e}`);
                        }
                    });
                } else if (props.types) {
                    this.objects = {};
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
                                props.types.includes(type))
                        ) {
                            this.objects[id] = objects[id];
                        }
                    });
                } else {
                    this.objects = objects;
                }

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

                return this.getAdditionalColumns();
            })
            .then(columnsForAdmin => {
                this.calculateColumnsVisibility(null, null, columnsForAdmin);

                const { info, root } = buildTree(this.objects, this.props);
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
                        null,
                        null,
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
            })
            .catch(e => this.showError(e));
    }

    /**
     * @private
     * @param {ioBroker.EmptyCallback?} cb
     */
    expandAllSelected(cb) {
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
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectExpanded`,
                JSON.stringify(expanded),
            );
            this.setState({ expanded }, cb);
        } else {
            cb && cb();
        }
    }

    /**
     * @private
     * @param {boolean} [isDouble]
     */
    onAfterSelect(isDouble) {
        this.lastSelectedItems = [...this.state.selected];
        if (this.state.selected && this.state.selected.length) {
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectSelected`,
                JSON.stringify(this.lastSelectedItems),
            );

            const name =
                this.lastSelectedItems.length === 1
                    ? Utils.getObjectName(this.objects, this.lastSelectedItems[0], null, { language: this.props.lang })
                    : '';
            this.props.onSelect && this.props.onSelect(this.lastSelectedItems, name, isDouble);
        } else {
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectSelected`,
                '',
            );
            if (this.state.selected.length) {
                this.setState({ selected: [] }, () => this.props.onSelect && this.props.onSelect([], ''));
            } else {
                this.props.onSelect && this.props.onSelect([], '');
            }
        }
    }

    /**
     * @private
     * @param {import('./types').ObjectBrowserProps} props
     * @param {any} state
     */
    static getDerivedStateFromProps(props, state) {
        const newState = {};
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
            this.props.objectsWorker.registerHandler(this.onObjectChange);
        } else {
            this.props.socket.subscribeObject('*', this.onObjectChange);
        }

        objectsAlreadyLoaded = true;
    }

    /**
     * Called when component is unmounted.
     */
    componentWillUnmount() {
        this.filterTimer && clearTimeout(this.filterTimer);
        this.filterTimer = null;

        if (this.props.objectsWorker) {
            this.props.objectsWorker.unregisterHandler(this.onObjectChange, true);
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
     * Called when component is mounted.
     */
    refreshComponent() {
        // remove all subscribes
        this.subscribes.forEach(pattern => {
            console.log(`- unsubscribe ${pattern}`);
            this.props.socket.unsubscribeState(pattern, this.onStateChange);
        });

        this.subscribes = [];

        this.loadAllObjects(true)
            .then(() => console.log('updated!'));
    }

    /**
     * Renders the error dialog.
     * @returns {JSX.Element | null}
     */
    renderErrorDialog() {
        return this.state.error ? <Dialog
            open={!0}
            maxWidth="sm"
            fullWidth
            onClose={() => this.setState({ error: '' })}
            aria-labelledby="error-dialog-title"
            aria-describedby="error-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{this.props.title || this.props.t('ra_Error')}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {this.state.error}
                </DialogContentText>
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
     * @param {any} error
     */
    showError(error) {
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
     * @param {string} toggleItem
     * @param {boolean} [isDouble]
     */
    onSelect(toggleItem, isDouble) {
        if (!this.props.multiSelect) {
            if (
                this.objects[toggleItem] &&
                (!this.props.types || this.props.types.includes(this.objects[toggleItem].type))
            ) {
                (window._localStorage || window.localStorage).removeItem(
                    `${this.props.dialogName || 'App'}.selectedNonObject`,
                );
                if (this.state.selected[0] !== toggleItem) {
                    this.setState({ selected: [toggleItem], selectedNonObject: '' }, () =>
                        this.onAfterSelect(isDouble));
                } else if (isDouble && this.props.onSelect) {
                    this.onAfterSelect(isDouble);
                }
            } else {
                (window._localStorage || window.localStorage).setItem(
                    `${this.props.dialogName || 'App'}.selectedNonObject`,
                    toggleItem,
                );
                this.setState({ selected: [], selectedNonObject: toggleItem }, () => this.onAfterSelect());
            }
        } else if (
            this.objects[toggleItem] &&
            (!this.props.types || this.props.types.includes(this.objects[toggleItem].type))
        ) {
            (window._localStorage || window.localStorage).removeItem(
                `${this.props.dialogName || 'App'}.selectedNonObject`,
            );

            const selected = [...this.state.selected];
            const pos = selected.indexOf(toggleItem);
            if (pos === -1) {
                selected.push(toggleItem);
                selected.sort();
            } else if (!isDouble) {
                selected.splice(pos, 1);
            }

            this.setState({ selected, selectedNonObject: '' }, () =>
                this.onAfterSelect(isDouble));
        }
    }

    /**
     * @private
     * @param {boolean} isLast
     */
    _renderDefinedList(isLast) {
        const cols = [...this.possibleCols];
        cols.unshift('id');
        if (this.props.columns && !this.props.columns.includes('buttons')) {
            const pos = cols.indexOf('buttons');
            if (pos !== -1) {
                cols.splice(pos, 1);
            }
        }
        return cols
            .filter(
                id => (isLast && (id === 'val' || id === 'buttons')) || (!isLast && id !== 'val' && id !== 'buttons'),
            )
            .map(id =>
                <ListItemButton
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
                            (window._localStorage || window.localStorage).setItem(
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
                            (this.state.columnsAuto
                                ? this.visibleCols.includes(id)
                                : this.state.columns && this.state.columns.includes(id))
                        }
                        disableRipple
                    />
                    <ListItemText primary={this.texts[`filter_${id}`] || this.props.t(`ra_${id}`)} />
                    {/*
                    <ListItemSecondaryAction>
                        <FormControl
                            variant="standard"
                            className={this.props.classes.columnsDialogInputWidth}
                            style={{ marginTop: 0, marginBottom: 0 }}
                            margin="dense"
                        >
                            <Input
                                classes={{ underline: 'no-underline' }}
                                placeholder={this.props.t('ra_Width')}
                                value={this.state.columnsWidths[id] || ''}
                                onChange={e => {
                                    const columnsWidths = JSON.parse(JSON.stringify(this.state.columnsWidths));
                                    columnsWidths[id] = e.target.value;
                                    (window._localStorage || window.localStorage).setItem((this.props.dialogName || 'App') + '.columnsWidths', JSON.stringify(columnsWidths));
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
     * @returns {JSX.Element | null}
     */
    renderColumnsSelectorDialog() {
        if (!this.state.columnsSelectorShow) {
            return null;
        }
        return <Dialog
            onClose={() => this.setState({ columnsSelectorShow: false })}
            open={!0}
            classes={{
                root: Utils.clsx(
                    this.props.classes.dialogColumns,
                    this.props.classes[`transparent_${this.state.columnsDialogTransparent}`],
                ),
            }}
        >
            <DialogTitle className={this.props.classes.fontSizeTitle}>{this.props.t('ra_Configure')}</DialogTitle>
            <DialogContent className={this.props.classes.fontSizeTitle}>
                <FormControlLabel
                    className={this.props.classes.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.foldersFirst}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem(
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
                    className={this.props.classes.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.linesEnabled}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem(
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
                    className={this.props.classes.switchColumnAuto}
                    control={
                        <Switch
                            checked={this.state.columnsAuto}
                            onChange={() => {
                                (window._localStorage || window.localStorage).setItem(
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
                <Typography classes={{ root: this.props.classes.dialogColumnsLabel }}>{this.props.t('ra_Transparent dialog')}</Typography>
            <Slider classes={{ root: this.props.classes.width100 }} value={this.state.columnsDialogTransparent} min={20} max={100} step={10} onChange={(event, newValue) =>
                this.setState({ columnsDialogTransparent: newValue })
            } />
                */}
                <List>
                    {this._renderDefinedList(false)}

                    {this.state.columnsForAdmin &&
                        Object.keys(this.state.columnsForAdmin)
                            .sort()
                            .map(adapter =>
                                this.state.columnsForAdmin[adapter].map(column => (
                                    <ListItemButton
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
                                                (window._localStorage || window.localStorage).setItem(
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
                                                    this.state.columns &&
                                                    this.state.columns.includes(`_${adapter}_${column.path}`)
                                                }
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={`${column.name} (${adapter})`} />
                                        {/*
                            <ListItemSecondaryAction>
                                <FormControl
                                    variant="standard"
                                    className={this.props.classes.columnsDialogInputWidth}
                                    style={{ marginTop: 0, marginBottom: 0 }}
                                    margin="dense"
                                >
                                    <Input
                                        classes={{ underline: 'no-underline' }}
                                        placeholder={this.props.t('ra_Width')}
                                        value={this.state.columnsWidths['_' + adapter + '_' + column.path] || ''}
                                        onChange={e => {
                                            const columnsWidths = JSON.parse(JSON.stringify(this.state.columnsWidths));
                                            columnsWidths['_' + adapter + '_' + column.path] = e.target.value;
                                            (window._localStorage || window.localStorage).setItem((this.props.dialogName || 'App') + '.columnsWidths', JSON.stringify(columnsWidths));
                                            this.calculateColumnsVisibility(null, null, null, columnsWidths);
                                            this.setState({ columnsWidths });
                                        }}
                                        autoComplete="off"
                                    />
                                </FormControl>
                            </ListItemSecondaryAction>
                            */}
                                    </ListItemButton>
                                )))}
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

    /**
     * @private
     */
    getAdditionalColumns() {
        return this.props.socket
            .getAdapters()
            .then(instances => {
                let columnsForAdmin = null;
                // find all additional columns
                instances.forEach(obj => (columnsForAdmin = this.parseObjectForAdmins(columnsForAdmin, obj)));

                return columnsForAdmin;
            })
            .catch(() => {
                // window.alert('Cannot get adapters: ' + e);
                // Object browser in Web has no additional columns
            });
    }

    /**
     * @private
     */
    checkUnsubscribes() {
        // Remove unused subscriptions
        for (let i = this.subscribes.length - 1; i >= 0; i--) {
            !this.recordStates.includes(this.subscribes[i]) && this.unsubscribe(this.subscribes[i]);
        }
        this.recordStates = [];
    }

    /**
     * Find an item.
     * @param {string} id
     * @param {string[] | undefined} [_parts]
     * @param {{ data: { name: string; id: string; }; children: never[]; } | null | undefined} [_root]
     * @param {string | undefined} [_partyId]
     * @returns {any}
     */
    findItem(id, _parts, _root, _partyId) {
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
     * @param {string} id
     * @param {ioBroker.State} state
     */
    onStateChange = (id, state) => {
        console.log(`> stateChange ${id}`);
        if (this.states[id]) {
            const item = this.findItem(id);
            if (item && item.data.state) {
                item.data.state = null;
            }
        }
        this.states[id] = state;

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

    /**
     * @private
     * @param {{ [x: string]: any; }} columnsForAdmin
     * @param {any} obj
     */
    parseObjectForAdmins(columnsForAdmin, obj) {
        if (obj.common && obj.common.adminColumns && obj.common.name) {
            let columns = obj.common.adminColumns;
            if (typeof columns !== 'object') {
                columns = [columns];
            }
            columns = columns
                .map(item => {
                    if (typeof item !== 'object') {
                        return { path: item, name: item.split('.').pop() };
                    }

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
                        };
                    }
                    if (typeof item.name !== 'object' && item.path) {
                        return {
                            path: item.path,
                            name: item.name,
                            width: item.width,
                            edit: !!item.edit,
                            type: item.type,
                            objTypes: item.objTypes,
                        };
                    }
                    if (!item.path) {
                        console.warn(`Admin columns for ${obj._id} ignored, because path not found`);
                        return null;
                    }
                    return {
                        path: item.path,
                        name: item.name[this.props.lang] || item.name.en,
                        width: item.width,
                        edit: !!item.edit,
                        type: item.type,
                        objTypes: item.objTypes,
                    };
                })
                .filter(item => item);

            if (columns && columns.length) {
                columnsForAdmin = columnsForAdmin || {};
                columnsForAdmin[obj.common.name] = columns.sort((a, b) =>
                    (a.path > b.path ? -1 : a.path < b.path ? 1 : 0));
            }
        } else if (obj.common && obj.common.name && columnsForAdmin && columnsForAdmin[obj.common.name]) {
            delete columnsForAdmin[obj.common.name];
        }
        return columnsForAdmin;
    }

    /**
     * @param {string} id
     * @param {ioBroker.Object} obj
     */
    onObjectChange = (id, obj /* , oldObj */) => {
        let newState;

        if (Array.isArray(id)) {
            id.forEach(event => {
                console.log(`> objectChange ${event.id}`);

                if (event.obj && typeof this.props.filterFunc === 'function' && !this.props.filterFunc(event.obj)) {
                    return;
                }

                if (event.id.startsWith('system.adapter.') && event.obj && event.obj.type === 'adapter') {
                    const columnsForAdmin = JSON.parse(JSON.stringify(this.state.columnsForAdmin));

                    this.parseObjectForAdmins(columnsForAdmin, event.obj);

                    if (JSON.stringify(this.state.columnsForAdmin) !== JSON.stringify(columnsForAdmin)) {
                        newState = { columnsForAdmin };
                    }
                }
                this.objects = this.objects || [];
                if (this.objects[event.id]) {
                    if (event.obj) {
                        this.objects[event.id] = event.obj;
                    } else {
                        delete this.objects[event.id];
                    }
                }
            });
        } else {
            console.log(`> objectChange ${id}`);
            this.objects = this.objects || [];

            if (obj && typeof this.props.filterFunc === 'function' && !this.props.filterFunc(obj)) {
                return;
            }

            if (id.startsWith('system.adapter.') && obj && obj.type === 'adapter') {
                const columnsForAdmin = JSON.parse(JSON.stringify(this.state.columnsForAdmin));
                this.parseObjectForAdmins(columnsForAdmin, obj);
                if (JSON.stringify(this.state.columnsForAdmin) !== JSON.stringify(columnsForAdmin)) {
                    newState = { columnsForAdmin };
                }
            }

            if (this.objects[id]) {
                if (obj) {
                    this.objects[id] = obj;
                } else {
                    delete this.objects[id];
                }
            }
        }

        newState && this.setState(newState);

        if (!this.objectsUpdateTimer && this.objects) {
            this.objectsUpdateTimer = setTimeout(() => {
                this.objectsUpdateTimer = null;
                const { info, root } = buildTree(this.objects, this.props);
                this.root = root;
                this.info = info;
                this.lastAppliedFilter = null; // apply filter anew

                if (!this.pausedSubscribes) {
                    this.forceUpdate();
                }
                // else it will be re-rendered when dialog will be closed
            }, 500);
        }
    };

    /**
     * @private
     * @param {string} id
     */
    subscribe(id) {
        if (!this.subscribes.includes(id)) {
            this.subscribes.push(id);
            console.log(`+ subscribe ${id}`);
            !this.pausedSubscribes && this.props.socket.subscribeState(id, this.onStateChange);
        }
    }

    /**
     * @private
     * @param {string} id
     */
    unsubscribe(id) {
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

    /**
     * @private
     * @param {boolean} isPause
     */
    pauseSubscribe(isPause) {
        if (!this.pausedSubscribes && isPause) {
            this.pausedSubscribes = true;
            this.subscribes.forEach(id => this.props.socket.unsubscribeState(id, this.onStateChange));
        } else if (this.pausedSubscribes && !isPause) {
            this.pausedSubscribes = false;
            this.subscribes.forEach(id => this.props.socket.subscribeState(id, this.onStateChange));
        }
    }

    /**
     * @private
     * @param {string} [name]
     * @param {boolean} [value]
     */
    onFilter(name, value) {
        this.filterTimer = null;
        const filter = { ...this.state.filter };

        Object.keys(this.filterRefs).forEach(_name => {
            if (this.filterRefs[_name] && this.filterRefs[_name].current) {
                for (let i = 0; i < this.filterRefs[_name].current.children.length; i++) {
                    if (this.filterRefs[_name].current.children[i].tagName === 'INPUT') {
                        filter[_name] = this.filterRefs[_name].current.children[i].value;
                        break;
                    }
                }
            }
        });

        if (name) {
            filter[name] = value;
            if (name === 'expertMode') {
                (window._sessionStorage || window.sessionStorage).setItem('App.expertMode', value ? 'true' : 'false');
            }
        }

        if (JSON.stringify(this.state.filter) !== JSON.stringify(filter)) {
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectFilter`,
                JSON.stringify(filter),
            );
            this.setState({ filter }, () => this.props.onFilterChanged && this.props.onFilterChanged(filter));
        }
    }

    clearFilter() {
        const filter = { ...this.state.filter };

        Object.keys(this.filterRefs).forEach(name => {
            if (this.filterRefs[name] && this.filterRefs[name].current) {
                for (let i = 0; i < this.filterRefs[name].current.childNodes.length; i++) {
                    const item = this.filterRefs[name].current.childNodes[i];
                    if (item.tagName === 'INPUT') {
                        filter[name] = '';
                        item.value = '';
                        break;
                    }
                }
            }
        });

        if (JSON.stringify(this.state.filter) !== JSON.stringify(filter)) {
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectFilter`,
                JSON.stringify(filter),
            );
            this.setState(
                { filter, filterKey: this.state.filterKey + 1 },
                () => this.props.onFilterChanged && this.props.onFilterChanged(filter),
            );
        }
    }

    isFilterEmpty() {
        const someNotEmpty = Object.keys(this.state.filter).find(
            attr => attr !== 'expertMode' && this.state.filter[attr],
        );
        return !someNotEmpty;
    }

    /**
     * @private
     * @param {string} name
     */
    getFilterInput(name) {
        return <FormControl
            className={Utils.clsx(this.props.classes.headerCellInput, this.props.classes.filterInput)}
            key={`${name}_${this.state.filterKey}`}
            // style={{ marginTop: 0, marginBottom: 0 }}
            margin="dense"
        >
            <Input
                ref={this.filterRefs[name]}
                classes={{ underline: 'no-underline' }}
                id={name}
                placeholder={this.texts[`filter_${name}`]}
                defaultValue={this.state.filter[name]}
                onChange={() => {
                    this.filterTimer && clearTimeout(this.filterTimer);
                    this.filterTimer = setTimeout(() => this.onFilter(), 400);
                }}
                autoComplete="off"
            />
            {this.filterRefs[name]?.current?.firstChild.value ?
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => {
                            this.filterRefs[name].current.firstChild.value = '';
                            this.onFilter(name, '');
                        }}
                    >
                        <IconClose />
                    </IconButton>
                </div> : null}
        </FormControl>;
    }

    /**
     * @private
     * @param {string} name
     * @param {any[]} values
     */
    getFilterSelect(name, values) {
        const hasIcons = !!values.find(item => item.icon);
        return <div style={{ position: 'relative' }}>
            <Select
                variant="standard"
                key={`${name}_${this.state.filterKey}`}
                ref={this.filterRefs[name]}
                className={`${this.props.classes.headerCellInput} no-underline`}
                onChange={() => {
                    this.filterTimer && clearTimeout(this.filterTimer);
                    this.filterTimer = setTimeout(() => this.onFilter(), 400);
                }}
                defaultValue={this.state.filter[name] || ''}
                inputProps={{ name, id: name }}
                displayEmpty
            >
                <MenuItem key="empty" value="">
                    <span className={this.props.classes.selectNone}>{this.texts[`filter_${name}`]}</span>
                </MenuItem>
                {values.map(item => {
                    let id;
                    let _name;
                    let icon;
                    if (typeof item === 'object') {
                        id = item.value;
                        _name = item.name;
                        icon = item.icon;
                    } else {
                        id = item;
                        _name = item;
                    }
                    return <MenuItem className={this.props.classes.headerCellSelectItem} key={id} value={id}>
                        {icon || (hasIcons ? <div className="itemIcon" /> : null)}
                        {_name}
                    </MenuItem>;
                })}
            </Select>
            {this.filterRefs[name]?.current?.childNodes[1]?.value ?
                <div className={Utils.clsx(this.props.classes.selectClearButton)}>
                    <IconButton
                        size="small"
                        onClick={() => {
                            const newFilter = { ...this.state.filter };
                            newFilter[name] = '';
                            this.filterRefs[name].current.childNodes[1].value = '';
                            (window._localStorage || window.localStorage).setItem(
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
                </div> : null}
        </div>;
    }

    /**
     * @private
     */
    getFilterSelectRole() {
        return this.getFilterSelect('role', this.info.roles);
    }

    /**
     * @private
     */
    getFilterSelectRoom() {
        const rooms = this.info.roomEnums.map(id => ({
            name: getName(this.objects[id]?.common?.name || id.split('.').pop()),
            value: id,
            icon: <Icon src={this.objects[id]?.common?.icon || ''} className={this.props.classes.selectIcon} />,
        }));

        return this.getFilterSelect('room', rooms);
    }

    /**
     * @private
     */
    getFilterSelectFunction() {
        const func = this.info.funcEnums.map(id => ({
            name: getName(
                (this.objects[id] && this.objects[id].common && this.objects[id].common.name) || id.split('.').pop(),
            ),
            value: id,
            icon: <Icon src={this.objects[id]?.common?.icon || ''} className={this.props.classes.selectIcon} />,
        }));

        return this.getFilterSelect('func', func);
    }

    /**
     * @private
     */
    getFilterSelectType() {
        const types = this.info.types.map(type => ({
            name: type,
            value: type,
            icon: ITEM_IMAGES[type],
        }));

        return this.getFilterSelect('type', types);
    }

    /**
     * @private
     */
    getFilterSelectCustoms() {
        if (this.info.customs.length > 1) {
            const customs = this.info.customs.map(id => ({
                name: id === '_' ? this.texts.filterCustomsWithout : id,
                value: id,
                icon: id === '_' ? null : <Icon
                    src={getSelectIdIcon(this.objects, id, this.imagePrefix) || ''}
                    className={this.props.classes.selectIcon}
                />,
            }));
            return this.getFilterSelect('custom', customs);
        }
        return null;
    }

    /**
     * @private
     * @param {any} [root]
     * @param {any[]} [expanded]
     */
    onExpandAll(root, expanded) {
        root = root || this.root;
        expanded = expanded || [];

        root.children &&
            root.children.forEach(item => {
                if (item.data.sumVisibility) {
                    expanded.push(item.data.id);
                    this.onExpandAll(item, expanded);
                }
            });

        if (root === this.root) {
            expanded.sort();
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectExpanded`,
                JSON.stringify(expanded),
            );

            this.setState({ expanded });
        }
    }

    /**
     * @private
     */
    onCollapseAll() {
        (window._localStorage || window.localStorage).setItem(
            `${this.props.dialogName || 'App'}.objectExpanded`,
            JSON.stringify([]),
        );
        (window._localStorage || window.localStorage).setItem(`${this.props.dialogName || 'App'}.objectSelected`, '[]');
        this.setState({ expanded: [], depth: 0, selected: [] }, () =>
            this.onAfterSelect());
    }

    /**
     * @private
     * @param {any} root
     * @param {number} depth
     * @param {any[]} expanded
     */
    expandDepth(root, depth, expanded) {
        root = root || this.root;
        if (depth > 0) {
            if (root.children) {
                root.children.forEach(item => {
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
    }

    /**
     * @private
     * @param {number} depth
     * @param {any[]} expanded
     */
    static collapseDepth(depth, expanded) {
        return expanded.filter(id => id.split('.').length <= depth);
    }

    /**
     * @private
     */
    onExpandVisible() {
        if (this.state.depth < 9) {
            const depth = this.state.depth + 1;
            const expanded = [...this.state.expanded];
            this.expandDepth(this.root, depth, expanded);
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectExpanded`,
                JSON.stringify(expanded),
            );
            this.setState({ depth, expanded });
        }
    }

    /**
     * @private
     */
    onStatesViewVisible() {
        const statesView = !this.state.statesView;
        (window._localStorage || window.localStorage).setItem(
            `${this.props.dialogName || 'App'}.objectStatesView`,
            JSON.stringify(statesView),
        );
        this.setState({ statesView });
    }

    /**
     * @private
     */
    onCollapseVisible() {
        if (this.state.depth > 0) {
            const depth = this.state.depth - 1;
            const expanded = ObjectBrowser.collapseDepth(depth, this.state.expanded);
            (window._localStorage || window.localStorage).setItem(
                `${this.props.dialogName || 'App'}.objectExpanded`,
                JSON.stringify(expanded),
            );
            this.setState({ depth, expanded });
        }
    }

    /**
     * @private
     * @param {string} id
     */
    getEnumsForId = id => {
        const result = [];
        this.info.enums.forEach(_id => {
            if (this.objects[_id]?.common?.members?.includes(id)) {
                const en = {
                    _id: this.objects[_id]._id,
                    common: JSON.parse(JSON.stringify(this.objects[_id].common)),
                    native: this.objects[_id].native,
                    type: 'enum',
                };
                if (en.common) {
                    delete en.common.members;
                    delete en.common.custom;
                    delete en.common.mobile;
                }
                result.push(en);
            }
        });

        return result.length ? result : undefined;
    };

    /**
     * @private
     * @param {array} enums
     * @param {string} objId
     */
    _createAllEnums = async (enums, objId) => {
        for (let e = 0; e < enums.length; e++) {
            let id = enums[e];
            let newObj;
            // some admin version delivered enums as string
            if (typeof id === 'object') {
                newObj = id;
                id = id._id;
            }
            let oldObj = this.objects[id];
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
                };

                oldObj.common = oldObj.common || {};
                oldObj.common.members = [objId];
                oldObj.type = 'enum';

                await this.props.socket.setObject(id, oldObj);
            } else if (!oldObj.common?.members?.includes(objId)) {
                oldObj.common = oldObj.common || {};
                oldObj.type = 'enum';
                oldObj.common.members = oldObj.common.members || [];
                // add the missing object
                oldObj.common.members.push(objId);
                oldObj.common.members.sort();
                await this.props.socket.setObject(id, oldObj);
            }
        }
    };

    /**
     * @private
     * @param {any} objs
     */
    loadObjects = async objs => {
        if (objs) {
            for (const id in objs) {
                if (!Object.hasOwn(objs, id) || !objs[id]) {
                    continue;
                }
                const obj = objs[id];
                let enums = null;
                if (obj && obj.common && obj.common.enums) {
                    enums = obj.common.enums;
                    delete obj.common.enums;
                } else {
                    enums = null;
                }
                try {
                    await this.props.socket.setObject(id, obj);
                    enums && (await this._createAllEnums(enums, obj._id));
                    if (obj.type === 'state') {
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
                } catch (error) {
                    window.alert(error);
                }
            }
        }
    };

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

    _exportObjects(isAll) {
        if (isAll) {
            generateFile('allObjects.json', this.objects);
        } else if (this.state.selected.length || this.state.selectedNonObject) {
            const result = {};
            const id = this.state.selected[0] || this.state.selectedNonObject;

            this._getSelectedIdsForExport().forEach(key => {
                result[key] = JSON.parse(JSON.stringify(this.objects[key]));
                // add enum information
                if (result[key].common) {
                    const enums = this.getEnumsForId(key);
                    if (enums) {
                        result[key].common.enums = enums;
                    }
                }
            });

            generateFile(`${id}.json`, result);
        } else {
            window.alert(this.props.t('ra_Save of objects-tree is not possible'));
        }
    }

    renderExportDialog() {
        if (this.state.showExportDialog === false) {
            return null;
        }
        return <Dialog open={!0}>
            <DialogTitle>{this.props.t('Select type of export')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {this.props.t('You can export all objects or just the selected branch.')}
                    <br />
                    {this.props.t('Selected %s object(s)', this.state.showExportDialog)}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    color="grey"
                    variant="outlined"
                    onClick={() => this.setState({ showExportDialog: false }, () => this._exportObjects(true))}
                >
                    {this.props.t('ra_All objects')}
                    {' '}
(
                    {Object.keys(this.objects).length}
)
                </Button>
                <Button
                    color="primary"
                    variant="contained"
                    autoFocus
                    onClick={() => this.setState({ showExportDialog: false }, () => this._exportObjects(false))}
                >
                    {this.props.t('ra_Only selected')}
                    {' '}
(
                    {this.state.showExportDialog}
)
                </Button>
                <Button
                    color="grey"
                    variant="contained"
                    onClick={() => this.setState({ showExportDialog: false })}
                    startIcon={<IconClose />}
                >
                    {this.props.t('ra_Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }

    /**
     * @private
     * @param {object} evt
     */
    handleJsonUpload = evt => {
        const f = evt.target.files[0];
        if (f) {
            const r = new FileReader();
            r.onload = async e => {
                const contents = e.target.result;
                try {
                    const json = JSON.parse(contents);
                    const len = Object.keys(json).length;
                    const id = json._id;
                    if (id === undefined && len) {
                        await this.loadObjects(json);
                        window.alert(this.props.t('ra_%s object(s) processed', len));
                    } else {
                        // it is only one object in form
                        // {
                        //    "_id": "xxx",
                        //   "common": "yyy",
                        //   "native": "zzz"
                        // }
                        if (!id) {
                            return window.alert(this.props.t('ra_Invalid structure'));
                        }
                        try {
                            let enums;
                            if (json.common.enums) {
                                enums = json.common.enums;
                                delete json.common.enums;
                            }
                            await this.props.socket.setObject(json._id, json);
                            if (json.type === 'state') {
                                const state = await this.props.socket.getState(json._id);
                                if (!state || state.val === null || state.val === undefined) {
                                    await this.props.socket.getState(
                                        json._id,
                                        json.common.def === undefined ? null : json.common.def,
                                        true,
                                    );
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
    };

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
     * @returns {JSX.Element}
     */
    getToolbar() {
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
                <Tooltip title={this.props.t('ra_Refresh tree')} classes={{ popper: this.props.classes.tooltip }}>
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
                {this.props.showExpertButton && !this.props.expertMode &&
                    <Tooltip title={this.props.t('ra_expertMode')} classes={{ popper: this.props.classes.tooltip }}>
                        <IconButton
                            key="expertMode"
                            color={this.state.filter.expertMode ? 'secondary' : 'default'}
                            onClick={() => this.onFilter('expertMode', !this.state.filter.expertMode)}
                            size="large"
                        >
                            <IconExpert />
                        </IconButton>
                    </Tooltip>}
                {!this.props.disableColumnSelector &&
                    <Tooltip title={this.props.t('ra_Configure')} classes={{ popper: this.props.classes.tooltip }}>
                        <IconButton
                            key="columnSelector"
                            color={this.state.columnsAuto ? 'primary' : 'default'}
                            onClick={() => this.setState({ columnsSelectorShow: true })}
                            size="large"
                        >
                            <IconColumns />
                        </IconButton>
                    </Tooltip>}
                {this.state.expandAllVisible &&
                    <Tooltip
                        title={this.props.t('ra_Expand all nodes')}
                        classes={{ popper: this.props.classes.tooltip }}
                    >
                        <IconButton
                            key="expandAll"
                            onClick={() => this.onExpandAll()}
                            size="large"
                        >
                            <IconOpen />
                        </IconButton>
                    </Tooltip>}
                <Tooltip
                    title={this.props.t('ra_Collapse all nodes')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <IconButton
                        key="collapseAll"
                        onClick={() => this.onCollapseAll()}
                        size="large"
                    >
                        <IconClosed />
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('ra_Expand one step node')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <IconButton
                        key="expandVisible"
                        color="primary"
                        onClick={() => this.onExpandVisible()}
                        size="large"
                    >
                        <StyledBadge badgeContent={this.state.depth} color="secondary">
                            <IconOpen />
                        </StyledBadge>
                    </IconButton>
                </Tooltip>
                <Tooltip
                    title={this.props.t('ra_Collapse one step node')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <IconButton
                        key="collapseVisible"
                        color="primary"
                        onClick={() => this.onCollapseVisible()}
                        size="large"
                    >
                        <StyledBadge badgeContent={this.state.depth} color="secondary">
                            <IconClosed />
                        </StyledBadge>
                    </IconButton>
                </Tooltip>
                {this.props.objectStatesView &&
                    <Tooltip
                        title={this.props.t('ra_Toggle the states view')}
                        classes={{ popper: this.props.classes.tooltip }}
                    >
                        <IconButton
                            onClick={() => this.onStatesViewVisible()}
                            size="large"
                        >
                            <LooksOneIcon color={this.state.statesView ? 'primary' : 'inherit'} />
                        </IconButton>
                    </Tooltip>}

                <Tooltip
                    title={this.props.t('ra_Show/Hide object descriptions')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <IconButton
                        onClick={() => {
                            (window._localStorage || window.localStorage).setItem(
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

                {this.props.objectAddBoolean ?
                    <Tooltip title={this.toolTipObjectCreating()} classes={{ popper: this.props.classes.tooltip }}>
                        <div>
                            <IconButton
                                disabled={!allowObjectCreation}
                                onClick={() => this.setState({ modalNewObj: true })}
                                size="large"
                            >
                                <AddIcon />
                            </IconButton>
                        </div>
                    </Tooltip> : null}

                {this.props.objectImportExport &&
                    <Tooltip
                        title={this.props.t('ra_Add objects tree from JSON file')}
                        classes={{ popper: this.props.classes.tooltip }}
                    >
                        <IconButton
                            onClick={() => {
                                const input = document.createElement('input');
                                input.setAttribute('type', 'file');
                                input.setAttribute('id', 'files');
                                input.setAttribute('opacity', 0);
                                input.addEventListener('change', e => this.handleJsonUpload(e), false);
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
                            classes={{ popper: this.props.classes.tooltip }}
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
            {!!this.props.objectBrowserEditObject &&
                <div style={{ display: 'flex', whiteSpace: 'nowrap' }}>
                    {`${this.props.t('ra_Objects')}: ${Object.keys(this.info.objects).length}, ${this.props.t(
                        'ra_States',
                    )}: ${
                        Object.keys(this.info.objects).filter(el => this.info.objects[el].type === 'state').length
                    }`}
                </div>}
            {this.props.objectEditBoolean &&
                <Tooltip
                    title={this.props.t('ra_Edit custom config')}
                    classes={{ popper: this.props.classes.tooltip }}
                >
                    <IconButton
                        onClick={() => {
                            // get all visible states
                            const ids = getVisibleItems(this.root, 'state', this.objects);

                            if (ids.length) {
                                this.pauseSubscribe(true);

                                if (ids.length === 1) {
                                    (window._localStorage || window.localStorage).setItem(
                                        `${this.props.dialogName || 'App'}.objectSelected`,
                                        this.state.selected[0],
                                    );
                                    this.props.router &&
                                        this.props.router.doNavigate(null, 'custom', this.state.selected[0]);
                                }
                                this.setState({ customDialog: ids });
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

    /**
     * @private
     * @param {string} id
     */
    toggleExpanded(id) {
        const expanded = JSON.parse(JSON.stringify(this.state.expanded));
        const pos = expanded.indexOf(id);
        if (pos === -1) {
            expanded.push(id);
            expanded.sort();
        } else {
            expanded.splice(pos, 1);
        }

        (window._localStorage || window.localStorage).setItem(
            `${this.props.dialogName || 'App'}.objectExpanded`,
            JSON.stringify(expanded),
        );

        this.setState({ expanded });
    }

    /**
     * @private
     * @param {Event} e
     * @param {string} text
     */
    onCopy(e, text) {
        e.stopPropagation();
        e.preventDefault();
        Utils.copyToClipboard(text, null);
        if (text.length < 50) {
            this.setState({ toast: this.props.t('ra_Copied %s', text) });
        } else {
            this.setState({ toast: this.props.t('ra_Copied') });
        }
    }

    renderTooltipAccessControl = acl => {
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
        const funcRenderStateObject = (value = 'object') => {
            const rights = acl[value];
            check.forEach((el, i) => {
                // eslint-disable-next-line no-bitwise
                if (rights & el.valueNum) {
                    arrayTooltipText.push(
                        <span key={value + i}>
                            {this.texts[`acl${el.group}_${el.title}_${value}`]}
,
                            <span
                                className={
                                    value === 'object'
                                        ? this.props.classes.rightsObject
                                        : this.props.classes.rightsState
                                }
                            >
                                {el.value}
                            </span>
                        </span>,
                    );
                }
            });
        };
        arrayTooltipText.push(
            <span key="group">
                {`${this.texts.ownerGroup}: ${(acl.ownerGroup || '').replace(
                    'system.group.',
                    '',
                )}`}
            </span>,
        );
        arrayTooltipText.push(
            <span key="owner">{`${this.texts.ownerUser}: ${(acl.owner || '').replace('system.user.', '')}`}</span>,
        );
        funcRenderStateObject();
        if (acl.state) {
            funcRenderStateObject('state');
        }

        return arrayTooltipText.length ?
            <span className={this.props.classes.tooltipAccessControl}>{arrayTooltipText.map(el => el)}</span>
            :
            '';
    };

    /**
     * @param {string} id
     * @param {{ data: { obj: { type: string; }; hasCustoms: any; }; }} item
     * @param {{ cellButtonsButton: string | undefined; cellButtonsButtonAlone: any; cellButtonsButtonIcon: string | undefined; cellButtonsButtonWithCustoms: any; }} classes
     */
    renderColumnButtons(id, item, classes) {
        if (!item.data.obj) {
            return this.props.onObjectDelete || this.props.objectEditOfAccessControl ?
                <div className={classes.buttonDiv}>
                    {this.state.filter.expertMode && this.props.objectEditOfAccessControl ?
                        <IconButton
                            className={Utils.clsx(
                                classes.cellButtonsButton,
                                classes.cellButtonsEmptyButton,
                                classes.cellButtonMinWidth,
                            )}
                            onClick={() =>
                                this.setState({ modalEditOfAccess: true, modalEditOfAccessObjData: item.data })}
                            size="large"
                        >
                            ---
                        </IconButton> : null}
                    {this.props.onObjectDelete && item.children && item.children.length ?
                        <IconButton
                            className={Utils.clsx(classes.cellButtonsButton, classes.cellButtonsButtonAlone)}
                            size="small"
                            aria-label="delete"
                            title={this.texts.deleteObject}
                            onClick={() => {
                                // calculate number of children
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

                                this.props.onObjectDelete(
                                    id,
                                    !!item.children?.length,
                                    false,
                                    count + 1,
                                );
                            }}
                        >
                            <IconDelete className={classes.cellButtonsButtonIcon} />
                        </IconButton> : null}
                </div> : null;
        }

        item.data.aclTooltip = item.data.aclTooltip || this.renderTooltipAccessControl(item.data.obj.acl);

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

        return [
            this.state.filter.expertMode && this.props.objectEditOfAccessControl ?
                <Tooltip key="acl" title={item.data.aclTooltip} classes={{ popper: this.props.classes.tooltip }}>
                    <IconButton
                        className={classes.cellButtonMinWidth}
                        onClick={() => this.setState({ modalEditOfAccess: true, modalEditOfAccessObjData: item.data })}
                        size="large"
                    >
                        <div className={classes.aclText}>
                            {Number.isNaN(Number(acl))
                                ? Number(aclSystemConfig).toString(16)
                                : Number(acl).toString(16)}
                        </div>
                    </IconButton>
                </Tooltip>
                :
                <div key="aclEmpty" className={classes.cellButtonMinWidth} />,
            <IconButton
                key="edit"
                className={classes.cellButtonsButton}
                size="small"
                aria-label="edit"
                title={this.texts.editObject}
                onClick={() => {
                    (window._localStorage || window.localStorage).setItem(
                        `${this.props.dialogName || 'App'}.objectSelected`,
                        id,
                    );
                    this.setState({ editObjectDialog: id, editObjectAlias: false });
                }}
            >
                <IconEdit className={classes.cellButtonsButtonIcon} />
            </IconButton>,
            this.props.onObjectDelete && (item.children?.length || !item.data.obj.common?.dontDelete) ?
                <IconButton
                    key="delete"
                    className={classes.cellButtonsButton}
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
                        this.props.onObjectDelete(
                            id,
                            !!item.children?.length,
                            !item.data.obj.common?.dontDelete,
                            count,
                        );
                    }}
                    title={this.texts.deleteObject}
                >
                    <IconDelete className={classes.cellButtonsButtonIcon} />
                </IconButton> : null,
            this.props.objectCustomDialog &&
            this.info.hasSomeCustoms &&
            item.data.obj.type === 'state' &&
            item.data.obj.common?.type !== 'file' ?
                <IconButton
                    className={Utils.clsx(
                        classes.cellButtonsButton,
                        item.data.hasCustoms
                            ? classes.cellButtonsButtonWithCustoms
                            : classes.cellButtonsButtonWithoutCustoms,
                    )}
                    key="custom"
                    size="small"
                    aria-label="config"
                    title={this.texts.customConfig}
                    onClick={() => {
                        (window._localStorage || window.localStorage).setItem(
                            `${this.props.dialogName || 'App'}.objectSelected`,
                            id,
                        );

                        this.pauseSubscribe(true);
                        this.props.router && this.props.router.doNavigate(null, 'customs', id);
                        this.setState({ customDialog: [id] });
                    }}
                >
                    <IconConfig className={classes.cellButtonsButtonIcon} />
                </IconButton> : null,
        ];
    }

    /**
     * @private
     * @param {string} id
     */
    readHistory(id) {
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
            this.objects[id] &&
            this.objects[id].common &&
            this.objects[id].common.custom &&
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
                    const sparks = window.document.getElementsByClassName('sparkline');

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

    /**
     * @private
     * @param {string} id
     * @param {any} item
     * @param {Record<string, any>} classes
     * @returns {JSX.Element | null}
     */
    renderColumnValue(id, item, classes) {
        const obj = item.data.obj;
        if (!obj || !this.states) {
            return null;
        }

        if (obj.common?.type === 'file') {
            return <div className={Utils.clsx(classes.cellValueText, classes.cellValueFile)}>[file]</div>;
        }
        if (!this.states[id]) {
            if (obj.type === 'state') {
                !this.recordStates.includes(id) && this.recordStates.push(id);
                this.states[id] = { val: null };
                this.subscribe(id);
            }
            return null;
        }
        !this.recordStates.includes(id) && this.recordStates.push(id);

        const state = this.states[id];
        let info = item.data.state;
        if (!info) {
            item.data.state = formatValue({
                state,
                obj,
                texts: this.texts,
                dateFormat: this.props.dateFormat,
                isFloatComma: this.props.isFloatComma,
            });
            info = item.data.state;

            info.valFull = info.valFull.map(_item => {
                if (_item.t === this.texts.quality && state.q) {
                    return [
                        <div className={classes.cellValueTooltipBoth} key={_item.t}>
                            {_item.t}
                            :&nbsp;
                            {_item.v}
                        </div>,
                        // <div className={classes.cellValueTooltipValue} key={item.t + '_v'}>{item.v}</div>,
                        !_item.nbr ? <br key={`${_item.t}_br`} /> : null,
                    ];
                }
                return [
                    <div className={classes.cellValueTooltipTitle} key={_item.t}>
                        {_item.t}
                        :&nbsp;
                    </div>,
                    <div className={classes.cellValueTooltipValue} key={`${_item.t}_v`}>
                        {_item.v}
                    </div>,
                    !_item.nbr ? <br key={`${_item.t}_br`} /> : null,
                ];
            });

            if (
                this.defaultHistory &&
                this.objects[id] &&
                this.objects[id].common &&
                this.objects[id].common.custom &&
                this.objects[id].common.custom[this.defaultHistory]
            ) {
                info.valFull.push(
                    <svg
                        key="sparkline"
                        className="sparkline"
                        data-id={id}
                        style={{ fill: '#3d85de' }}
                        width="200"
                        height="30"
                        strokeWidth="3"
                    />,
                );
            }

            const copyText = info.valText.v || '';
            info.val = copyText;
            info.valText = [
                <span className={classes.newValue} key={`${info.valText.v.toString()}valText`}>
                    {info.valText.v.toString()}
                </span>,
                info.valText.u ? <span
                    className={Utils.clsx(classes.cellValueTextUnit, classes.newValue)}
                    key={`${info.valText.v.toString()}unit`}
                >
                    {info.valText.u}
                </span> : null,
                info.valText.s !== undefined ? <span
                    className={Utils.clsx(classes.cellValueTextState, classes.newValue)}
                    key={`${info.valText.v.toString()}states`}
                >
                    (
                    {info.valText.s}
)
                </span> : null,
                <IconCopy
                    className={Utils.clsx(
                        classes.cellButtonsValueButton,
                        'copyButton',
                        classes.cellButtonsValueButtonCopy,
                    )}
                    onClick={e => this.onCopy(e, copyText)}
                    key="cc"
                />,
                // <IconEdit className={ Utils.clsx(classes.cellButtonsValueButton, 'copyButton', classes.cellButtonsValueButtonEdit) } key="ce" />
            ];
        }

        info.style = getValueStyle({ state, isExpertMode: this.state.filter.expertMode, isButton: item.data.button });

        let val = info.valText;
        if (!this.state.filter.expertMode && item.data.button) {
            val = <PressButtonIcon className={this.props.classes.cellValueButton} />;
        }

        return <Tooltip
            key="value"
            title={info.valFull}
            classes={{
                tooltip: this.props.classes.cellValueTooltip,
                popper: this.props.classes.cellValueTooltipBox,
            }}
            onOpen={() => this.readHistory(id)}
        >
            <div style={info.style} className={classes.cellValueText}>
                {val}
            </div>
        </Tooltip>;
    }

    /**
     * @private
     * @returns {undefined}
     */
    _syncEnum(id, enumIds, newArray, cb) {
        if (!enumIds || !enumIds.length) {
            cb && cb();
            return;
        }
        const enumId = enumIds.pop();
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
            .then(() => setTimeout(() =>
                this._syncEnum(id, enumIds, newArray, cb), 0));
    }

    /**
     * @private
     * @returns {Promise}
     */
    syncEnum(id, enumName, newArray) {
        const toCheck = [...this.info[enumName === 'func' ? 'funcEnums' : 'roomEnums']];

        return new Promise(resolve => {
            this._syncEnum(id, toCheck, newArray, error => {
                error && this.showError(error);
                // force update of object
                resolve();
            });
        });
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderEnumDialog() {
        if (this.state.enumDialog) {
            const type = this.state.enumDialog.type;
            const item = this.state.enumDialog.item;
            const itemEnums = this.state.enumDialogEnums;
            const enumsOriginal = this.state.enumDialog.enumsOriginal;

            const enums = (type === 'room' ? this.info.roomEnums : this.info.funcEnums)
                .map(id => ({
                    name: getName(
                        (this.objects[id] && this.objects[id].common && this.objects[id].common.name) ||
                            id.split('.').pop(),
                        this.props.lang,
                    ),
                    value: id,
                    icon: getSelectIdIcon(this.objects, id, this.imagePrefix),
                }))
                .sort((a, b) => (a.name > b.name ? 1 : -1));

            enums.forEach(_item => {
                if (_item.icon && typeof _item.icon === 'string') {
                    _item.icon = <div className={this.props.classes.enumIconDiv}>
                        <img src={_item.icon} className={this.props.classes.enumIcon} alt={_item.name} />
                    </div>;
                }
            });

            // const hasIcons = !!enums.find(item => item.icon);

            return <Dialog
                className={this.props.classes.enumDialog}
                onClose={() => this.setState({ enumDialog: null })}
                aria-labelledby="enum-dialog-title"
                open={!0} // true
            >
                <DialogTitle id="enum-dialog-title">
                    {type === 'func' ? this.props.t('ra_Define functions') : this.props.t('ra_Define rooms')}
                    <Fab
                        className={this.props.classes.enumButton}
                        color="primary"
                        disabled={JSON.stringify(enumsOriginal) === JSON.stringify(itemEnums)}
                        size="small"
                        onClick={() =>
                            this.syncEnum(item.data.id, type, itemEnums)
                                .then(() => this.setState({ enumDialog: null, enumDialogEnums: null }))}
                    >
                        <IconCheck />
                    </Fab>
                </DialogTitle>
                <List classes={{ root: this.props.classes.enumList }}>
                    {enums.map(_item => {
                        let id;
                        let name;
                        let icon;

                        if (typeof _item === 'object') {
                            id   = _item.value;
                            name = _item.name;
                            icon = _item.icon;
                        } else {
                            id   = _item;
                            name = _item;
                        }
                        const labelId = `checkbox-list-label-${id}`;

                        return <ListItem
                            className={this.props.classes.headerCellSelectItem}
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
                            <ListItemIcon classes={{ root: this.props.classes.enumCheckbox }}>
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
        return null;
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderEditRoleDialog() {
        if (this.state.roleDialog && this.props.objectBrowserEditRole) {
            const ObjectBrowserEditRole = this.props.objectBrowserEditRole;
            return <ObjectBrowserEditRole
                key="objectBrowserEditRole"
                id={this.state.roleDialog}
                socket={this.props.socket}
                t={this.props.t}
                roles={this.info.roles}
                onClose={obj => {
                    if (obj) {
                        this.info.objects[this.state.roleDialog] = obj;
                    }
                    this.setState({ roleDialog: false });
                }}
            />;
        }
        return null;
    }

    /**
     * @private
     * @param {boolean} [isSave]
     */
    onColumnsEditCustomDialogClose(isSave) {
        if (isSave) {
            let value = this.customColumnDialog.value;
            if (this.customColumnDialog.type === 'boolean') {
                value = value === 'true' || value === true;
            } else if (this.customColumnDialog.type === 'number') {
                value = parseFloat(value);
            }
            this.customColumnDialog = null;
            this.props.socket
                .getObject(this.state.columnsEditCustomDialog.obj._id)
                .then(obj => {
                    if (ObjectBrowser.setCustomValue(obj, this.state.columnsEditCustomDialog.it, value)) {
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

    /**
     * @private
     */
    renderColumnsEditCustomDialog() {
        if (this.state.columnsEditCustomDialog) {
            if (!this.customColumnDialog) {
                const value = ObjectBrowser.getCustomValue(
                    this.state.columnsEditCustomDialog.obj,
                    this.state.columnsEditCustomDialog.it,
                );
                this.customColumnDialog = {
                    type: this.state.columnsEditCustomDialog.it.type || typeof value,
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
                    {`${this.props.t('ra_Edit object field')}: ${
                        this.state.columnsEditCustomDialog.obj._id
                    }`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {this.customColumnDialog.type === 'boolean' ?
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        onKeyUp={e => e.keyCode === 13 && this.onColumnsEditCustomDialogClose(true)}
                                        defaultChecked={this.customColumnDialog.value === 'true'}
                                        onChange={e => {
                                            this.customColumnDialog.value = e.target.checked.toString();
                                            const changed =
                                                this.customColumnDialog.value !== this.customColumnDialog.initValue;
                                            if (changed === !this.state.customColumnDialogValueChanged) {
                                                this.setState({ customColumnDialogValueChanged: changed });
                                            }
                                        }}
                                    />
                                }
                                label={`${this.state.columnsEditCustomDialog.it.name} (${this.state.columnsEditCustomDialog.it.pathText})`}
                            />
                            :
                            <TextField
                                variant="standard"
                                defaultValue={this.customColumnDialog.value}
                                fullWidth
                                onKeyUp={e => e.keyCode === 13 && this.onColumnsEditCustomDialogClose(true)}
                                label={`${this.state.columnsEditCustomDialog.it.name} (${this.state.columnsEditCustomDialog.it.pathText})`}
                                onChange={e => {
                                    this.customColumnDialog.value = e.target.value;
                                    const changed =
                                        this.customColumnDialog.value !== this.customColumnDialog.initValue;
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
        return null;
    }

    /**
     * @private
     * @param {any} obj
     * @param {any} it
     */
    static getCustomValue(obj, it) {
        if (obj && obj._id && obj._id.startsWith(`${it.adapter}.`) && it.path.length > 1) {
            const p = it.path;
            let value;
            if (obj[p[0]] && typeof obj[p[0]] === 'object') {
                if (p.length === 2) {
                    // most common case
                    value = obj[p[0]][p[1]];
                } else if (p.length === 3) {
                    value = obj[p[0]][p[1]] && typeof obj[p[0]][p[1]] === 'object' ? obj[p[0]][p[1]][p[2]] : null;
                } else if (p.length === 4) {
                    value =
                        obj[p[0]][p[1]] && typeof obj[p[0]][p[1]] === 'object' && obj[p[0]][p[1]][p[2]]
                            ? obj[p[0]][p[1]][p[2]][p[3]]
                            : null;
                } else if (p.length === 5) {
                    value =
                        obj[p[0]][p[1]] &&
                        typeof obj[p[0]][p[1]] === 'object' &&
                        obj[p[0]][p[1]][p[2]] &&
                        obj[p[0]][p[1]][p[2]][p[3]]
                            ? obj[p[0]][p[1]][p[2]][p[3]][p[4]]
                            : null;
                } else if (p.length === 6) {
                    value =
                        obj[p[0]][p[1]] &&
                        typeof obj[p[0]][p[1]] === 'object' &&
                        obj[p[0]][p[1]][p[2]] &&
                        obj[p[0]][p[1]][p[2]][p[3]] &&
                        obj[p[0]][p[1]][p[2]][p[3]][p[4]]
                            ? obj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]]
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

    /**
     * @private
     * @param {any} obj
     * @param {any} it
     * @param {any} value
     */
    static setCustomValue(obj, it, value) {
        if (obj && obj._id && obj._id.startsWith(`${it.adapter}.`) && it.path.length > 1) {
            const p = it.path;
            if (obj[p[0]] && typeof obj[p[0]] === 'object') {
                if (p.length === 2) {
                    // most common case
                    obj[p[0]][p[1]] = value;
                    return true;
                }
                if (p.length === 3) {
                    if (obj[p[0]][p[1]] && typeof obj[p[0]][p[1]] === 'object') {
                        obj[p[0]][p[1]][p[2]] = value;
                        return true;
                    }
                } else if (p.length === 4) {
                    if (
                        obj[p[0]][p[1]] &&
                        typeof obj[p[0]][p[1]] === 'object' &&
                        obj[p[0]][p[1]][p[2]] &&
                        typeof obj[p[0]][p[1]][p[2]] === 'object'
                    ) {
                        obj[p[0]][p[1]][p[2]][p[3]] = value;
                        return true;
                    }
                } else if (p.length === 5) {
                    if (
                        obj[p[0]][p[1]] &&
                        typeof obj[p[0]][p[1]] === 'object' &&
                        obj[p[0]][p[1]][p[2]] &&
                        typeof obj[p[0]][p[1]][p[2]] === 'object' &&
                        obj[p[0]][p[1]][p[2]][p[3]] &&
                        typeof obj[p[0]][p[1]][p[2]][p[3]] === 'object'
                    ) {
                        obj[p[0]][p[1]][p[2]][p[3]][p[4]] = value;
                        return true;
                    }
                } else if (p.length === 6) {
                    if (
                        obj[p[0]][p[1]] &&
                        typeof obj[p[0]][p[1]] === 'object' &&
                        obj[p[0]][p[1]][p[2]] &&
                        typeof obj[p[0]][p[1]][p[2]] === 'object' &&
                        obj[p[0]][p[1]][p[2]][p[3]] &&
                        typeof obj[p[0]][p[1]][p[2]][p[3]] === 'object' &&
                        obj[p[0]][p[1]][p[2]][p[3]][p[4]] &&
                        typeof obj[p[0]][p[1]][p[2]][p[3]][p[4]] === 'object'
                    ) {
                        obj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]] = value;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Renders a custom value.
     * @param {any} obj
     * @param {any} it
     * @param {any} item
     * @returns {JSX.Element | null}
     */
    renderCustomValue(obj, it, item) {
        const text = ObjectBrowser.getCustomValue(obj, it);
        if (text !== null && text !== undefined) {
            if (it.edit && !this.props.notEditable && (!it.objTypes || it.objTypes.includes(obj.type))) {
                return <div
                    className={Utils.clsx(
                        this.props.classes.columnCustom,
                        this.props.classes.columnCustomEditable,
                        this.props.classes[`columnCustom_${it.align}`],
                    )}
                    onClick={() =>
                        this.setState({
                            columnsEditCustomDialog: { item, it, obj },
                            customColumnDialogValueChanged: false,
                        })}
                >
                    {text}
                </div>;
            }
            return <div
                className={Utils.clsx(
                    this.props.classes.columnCustom,
                    this.props.classes[`columnCustom_${it.align}`],
                )}
            >
                {text}
            </div>;
        }
        return null;
    }

    /**
     * Renders a leaf.
     * @param {any} item
     * @param {boolean} isExpanded
     * @param {Record<string, any>} classes
     * @param {{ count: number; }} counter
     * @returns {JSX.Element}
     */
    renderLeaf(item, isExpanded, classes, counter) {
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
            iconFolder = isExpanded ? <IconOpen
                className={classes.cellIdIconFolder}
                onClick={() => this.toggleExpanded(id)}
            /> : <IconClosed
                className={classes.cellIdIconFolder}
                onClick={() => this.toggleExpanded(id)}
            />;
        } else if (obj.common && obj.common.write === false && obj.type === 'state') {
            iconFolder = <IconDocumentReadOnly className={classes.cellIdIconDocument} />;
        } else {
            iconFolder = <IconDocument className={classes.cellIdIconDocument} />;
        }

        let iconItem = null;
        if (item.data.icon) {
            if (typeof item.data.icon === 'string') {
                if (item.data.icon.length < 3) {
                    iconItem = <span className={Utils.clsx(classes.cellIdIconOwn, 'iconOwn')}>{item.data.icon}</span>; // utf-8 char
                } else {
                    iconItem = <img className={Utils.clsx(classes.cellIdIconOwn, 'iconOwn')} src={item.data.icon} alt="" />;
                }
            } else {
                iconItem = item.data.icon;
            }
        }

        const common = obj?.common;

        const typeImg = (obj && obj.type && ITEM_IMAGES[obj.type]) || <div className="itemIcon" />;

        const paddingLeft = this.levelPadding * item.data.level;

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
                <Checkbox
                    className={classes.checkBox}
                    checked={this.state.selected.includes(id)}
                /> : null;

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
            if (obj.user) {
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
                    `${this.texts.objectChangedByUser} ${Utils.formatDate(new Date(obj.ts), this.props.dateFormat)}`,
                );
        }

        const readWriteAlias = typeof common?.alias?.id === 'object';

        const alias =
            id.startsWith('alias.') && common?.alias?.id ? (
                readWriteAlias ?
                    <div className={classes.cellIdAliasReadWriteDiv}>
                        {common.alias.id.read ? <div
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                this.onSelect(common.alias.id.read);
                                setTimeout(() =>
                                    this.expandAllSelected(() =>
                                        this.scrollToItem(common.alias.id.read)), 100);
                            }}
                            className={Utils.clsx(classes.cellIdAlias, classes.cellIdAliasReadWrite)}
                        >
                            ←
                            {common.alias.id.read}
                        </div> : null}
                        {common.alias.id.write ? <div
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                this.onSelect(common.alias.id.write);
                                setTimeout(() =>
                                    this.expandAllSelected(() =>
                                        this.scrollToItem(common.alias.id.write)), 100);
                            }}
                            className={Utils.clsx(classes.cellIdAlias, classes.cellIdAliasReadWrite)}
                        >
                            →
                            {common.alias.id.write}
                        </div> : null}
                    </div>
                    :
                    <div
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            this.onSelect(common.alias.id);
                            setTimeout(() =>
                                this.expandAllSelected(() =>
                                    this.scrollToItem(common.alias.id)), 100);
                        }}
                        className={Utils.clsx(classes.cellIdAlias, classes.cellIdAliasAlone)}
                    >
                        →
                        {common.alias.id}
                    </div>
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
        if (id === 'system') {
            checkColor = COLOR_NAME_SYSTEM;
        } else if (id === 'system.adapter') {
            checkColor = COLOR_NAME_SYSTEM_ADAPTER;
        } else if (!checkColor || this.state.selected.includes(id)) {
            checkColor = 'inherit';
        }

        const icons = [];

        if (common?.statusStates) {
            const ids = {};
            Object.keys(common.statusStates).forEach(name => {
                let _id = common.statusStates[name];
                if (_id.split('.').length < 3) {
                    _id = `${id}.${_id}`;
                }
                ids[name] = _id;

                if (!this.states[_id]) {
                    if (this.objects[_id]?.type === 'state') {
                        !this.recordStates.includes(_id) && this.recordStates.push(_id);
                        this.states[_id] = { val: null };
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
                    title={this.texts.deviceError}
                    className={this.props.classes.iconDeviceError}
                />);
            }

            if (ids.onlineId && this.states[ids.onlineId]) {
                if (!colorSet) {
                    if (this.states[ids.onlineId].val) {
                        checkColor =
                            this.props.themeType === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT;
                        icons.push(<IconConnection
                            key="conn"
                            title={this.texts.deviceError}
                            className={this.props.classes.iconDeviceConnected}
                        />);
                    } else {
                        checkColor =
                            this.props.themeType === 'dark'
                                ? COLOR_NAME_DISCONNECTED_DARK
                                : COLOR_NAME_DISCONNECTED_LIGHT;
                        icons.push(<IconDisconnected
                            key="disc"
                            title={this.texts.deviceError}
                            className={this.props.classes.iconDeviceDisconnected}
                        />);
                    }
                } else if (this.states[ids.onlineId].val) {
                    icons.push(<IconConnection
                        key="conn"
                        title={this.texts.deviceError}
                        className={this.props.classes.iconDeviceConnected}
                    />);
                } else {
                    icons.push(<IconDisconnected
                        key="disc"
                        title={this.texts.deviceError}
                        className={this.props.classes.iconDeviceDisconnected}
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
                            title={this.texts.deviceError}
                            className={this.props.classes.iconDeviceDisconnected}
                        />);
                    } else {
                        checkColor =
                            this.props.themeType === 'dark' ? COLOR_NAME_CONNECTED_DARK : COLOR_NAME_CONNECTED_LIGHT;
                        icons.push(<IconConnection
                            key="conn"
                            title={this.texts.deviceError}
                            className={this.props.classes.iconDeviceConnected}
                        />);
                    }
                } else if (this.states[ids.offlineId].val) {
                    icons.push(<IconDisconnected
                        key="disc"
                        title={this.texts.deviceError}
                        className={this.props.classes.iconDeviceDisconnected}
                    />);
                } else {
                    icons.push(<IconConnection
                        key="conn"
                        title={this.texts.deviceError}
                        className={this.props.classes.iconDeviceConnected}
                    />);
                }
            }
        }

        const q = checkVisibleObjectType ? Utils.quality2text(this.states[id]?.q || 0).join(', ') : null;

        let name = item.data?.title || '';
        let useDesc;
        if (this.state.showDescription) {
            useDesc = getObjectTooltip(item.data, this.props.lang);
            if (useDesc) {
                name = [
                    <div key="name" className={classes.cellNameDivDiv}>
                        {name}
                    </div>,
                    <div key="desc" className={classes.cellDescription}>
                        {useDesc}
                    </div>,
                ];
                useDesc = !!useDesc;
            }
        }

        return <Grid
            container
            direction="row"
            wrap="nowrap"
            className={Utils.clsx(
                classes.tableRow,
                this.state.linesEnabled && classes.tableRowLines,
                !this.props.dragEnabled && classes.tableRowNoDragging,
                alias && classes.tableRowAlias,
                readWriteAlias && classes.tableRowAliasReadWrite,
                !item.data.visible && classes.filteredOut,
                item.data.hasVisibleParent &&
                    !item.data.visible &&
                    !item.data.hasVisibleChildren &&
                    classes.filteredParentOut,
                this.state.selected.includes(id) && classes.itemSelected,
                this.state.selectedNonObject === id && classes.itemSelected,
            )}
            key={id}
            id={id}
            onClick={() => this.onSelect(id)}
            onContextMenu={e => {
                e.preventDefault(); // prevent the default behaviour when right-clicked
                this.setState({ showContextMenu: { target: e.target, item } });
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
                className={classes.cellId}
                style={{ width: this.columnsVisibility.id, paddingLeft }}
            >
                <Grid
                    item
                    container
                    alignItems="center"
                >
                    {checkbox}
                    {iconFolder}
                </Grid>
                <Grid
                    item
                    style={{ color: checkColor }}
                    className={Utils.clsx(classes.cellIdSpan, invertBackground && classes.invertedBackground)}
                >
                    <Tooltip
                        title={getIdFieldTooltip(item.data, this.props.classes, this.props.lang)}
                        classes={{ popper: this.props.classes.tooltip }}
                    >
                        <div>{item.data.name}</div>
                    </Tooltip>
                    {alias}
                    {icons}
                </Grid>
                <div className={Utils.clsx(classes.grow, invertBackground && classes.invertedBackgroundFlex)} />
                <Grid
                    item
                    container
                    alignItems="center"
                >
                    {iconItem}
                </Grid>
                <div>
                    <IconCopy
                        className={Utils.clsx(classes.cellCopyButton, 'copyButton')}
                        onClick={e => this.onCopy(e, id)}
                    />
                </div>
            </Grid>

            {this.columnsVisibility.name ? <div
                className={Utils.clsx(classes.cellName, useDesc && classes.cellNameWithDesc)}
                style={{ width: this.columnsVisibility.name }}
            >
                {name}
                {item.data?.title ? <div style={{ color: checkColor }}>
                    <IconCopy
                        className={Utils.clsx(classes.cellCopyButton, 'copyButton')}
                        onClick={e => this.onCopy(e, item.data.title)}
                    />
                </div> : null}
            </div> : null}

            {!this.state.statesView ? <>
                {this.columnsVisibility.type ? <div
                    className={classes.cellType}
                    style={{ width: this.columnsVisibility.type }}
                >
                    {typeImg}
                    &nbsp;
                    {obj && obj.type}
                </div> : null}
                {this.columnsVisibility.role ? <div
                    className={classes.cellRole}
                    style={{
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
                    className={`${classes.cellRoom} ${item.data.per ? classes.cellEnumParent : ''}`}
                    style={{
                        width: this.columnsVisibility.room,
                        cursor: enumEditable ? 'text' : 'default',
                    }}
                    onClick={
                        enumEditable
                            ? () => {
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
                                        enumsOriginal: JSON.parse(JSON.stringify(enums)),
                                    },
                                });
                            }
                            : undefined
                    }
                >
                    {item.data.rooms}
                </div> : null}
                {this.columnsVisibility.func ? <div
                    className={`${classes.cellFunc} ${item.data.pef ? classes.cellEnumParent : ''}`}
                    style={{
                        width: this.columnsVisibility.func,
                        cursor: enumEditable ? 'text' : 'default',
                    }}
                    onClick={
                        enumEditable
                            ? () => {
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
                                        enumsOriginal: JSON.parse(JSON.stringify(enums)),
                                    },
                                });
                            }
                            : undefined
                    }
                >
                    {item.data.funcs}
                </div> : null}
            </>
                :
                <>
                    {this.columnsVisibility.changedFrom ? <div
                        className={classes.cellRole}
                        style={{ width: this.columnsVisibility.changedFrom }}
                        title={newValueTitle.join('\n')}
                    >
                        {checkVisibleObjectType && this.states[id]?.from ? newValue : null}
                    </div> : null}
                    {this.columnsVisibility.qualityCode ? <div
                        className={classes.cellRole}
                        style={{ width: this.columnsVisibility.qualityCode }}
                        title={q || ''}
                    >
                        {q}
                    </div> : null}
                    {this.columnsVisibility.timestamp ? <div
                        className={classes.cellRole}
                        style={{ width: this.columnsVisibility.timestamp }}
                    >
                        {checkVisibleObjectType && this.states[id]?.ts
                            ? Utils.formatDate(new Date(this.states[id].ts), this.props.dateFormat)
                            : null}
                    </div> : null}
                    {this.columnsVisibility.lastChange ? <div
                        className={classes.cellRole}
                        style={{ width: this.columnsVisibility.lastChange }}
                    >
                        {checkVisibleObjectType && this.states[id]?.lc
                            ? Utils.formatDate(new Date(this.states[id].lc), this.props.dateFormat)
                            : null}
                    </div> : null}
                </>}
            {this.adapterColumns.map(it => <div
                className={classes.cellAdapter}
                style={{ width: this.columnsVisibility[it.id] }}
                key={it.id}
                title={`${it.adapter} => ${it.pathText}`}
            >
                {this.renderCustomValue(obj, it, item)}
            </div>)}
            {this.columnsVisibility.val ? <div
                className={classes.cellValue}
                style={{
                    width: this.columnsVisibility.val,
                    cursor: valueEditable
                        ? common?.type === 'file'
                            ? 'zoom-in'
                            : item.data.button
                                ? 'grab'
                                : 'text'
                        : 'default',
                }}
                onClick={
                    valueEditable
                        ? () => {
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
                        }
                        : undefined
                }
            >
                {this.renderColumnValue(id, item, classes)}
            </div> : null}
            {this.columnsVisibility.buttons ? <div
                className={classes.cellButtons}
                style={{ width: this.columnsVisibility.buttons }}
            >
                {this.renderColumnButtons(id, item, classes)}
            </div> : null}
        </Grid>;
    }

    /**
     * Renders an item.
     * @param {any} root
     * @param {boolean} isExpanded
     * @param {Record<string, any>} classes
     * @param {{ count: any; }} [counter]
     * @returns {JSX.Element[]}
     */
    renderItem(root, isExpanded, classes, counter) {
        const items = [];
        counter = counter || { count: 0 };
        let leaf = this.renderLeaf(root, isExpanded, classes, counter);
        const DragWrapper = this.props.DragWrapper;
        if (this.props.dragEnabled) {
            if (root.data.sumVisibility) {
                leaf = <DragWrapper key={root.data.id} item={root} className={classes.draggable}>
                    {leaf}
                </DragWrapper>;
            } else {
                // change cursor
                leaf = <div key={root.data.id} className={classes.nonDraggable}>
                    {leaf}
                </div>;
            }
        }
        root.data.id && items.push(leaf);

        isExpanded = isExpanded === undefined ? binarySearch(this.state.expanded, root.data.id) : isExpanded;

        if (!root.data.id || isExpanded) {
            if (!this.state.foldersFirst) {
                root.children &&
                    items.push(
                        root.children.map(item => {
                            // do not render too many items in column editor mode
                            if (!this.state.columnsSelectorShow || counter.count < 15) {
                                if (item.data.sumVisibility) {
                                    return this.renderItem(item, undefined, classes, counter);
                                }
                            }
                            return null;
                        }),
                    );
            } else {
                // first only folder
                root.children &&
                    items.push(
                        root.children.map(item => {
                            if (item.children) {
                                // do not render too many items in column editor mode
                                if (!this.state.columnsSelectorShow || counter.count < 15) {
                                    if (item.data.sumVisibility) {
                                        return this.renderItem(item, undefined, classes, counter);
                                    }
                                }
                            }

                            return null;
                        }),
                    );
                // then items
                root.children &&
                    items.push(
                        root.children.map(item => {
                            if (!item.children) {
                                // do not render too many items in column editor mode
                                if (!this.state.columnsSelectorShow || counter.count < 15) {
                                    if (item.data.sumVisibility) {
                                        return this.renderItem(item, undefined, classes, counter);
                                    }
                                }
                            }
                            return null;
                        }),
                    );
            }
        }

        return items;
    }

    /**
     * @private
     * @param {boolean} [columnsAuto]
     * @param {string[]} [columns]
     * @param {any} [columnsForAdmin]
     * @param {Record<string, number>} [columnsWidths]
     */
    calculateColumnsVisibility(columnsAuto, columns, columnsForAdmin, columnsWidths) {
        columnsWidths   = columnsWidths   || this.state.columnsWidths;
        columnsForAdmin = columnsForAdmin || this.state.columnsForAdmin;
        columns         = columns         || this.state.columns || [];
        columnsAuto     = typeof columnsAuto !== 'boolean' ? this.state.columnsAuto : columnsAuto;

        columnsWidths = JSON.parse(JSON.stringify(columnsWidths));
        Object.keys(columnsWidths).forEach(name => {
            if (columnsWidths[name]) {
                columnsWidths[name] = parseInt(columnsWidths[name], 10) || 0;
            }
        });

        this.adapterColumns = [];
        const WIDTHS = SCREEN_WIDTHS[this.props.width].widths;

        if (columnsAuto) {
            this.columnsVisibility = {
                id:          SCREEN_WIDTHS[this.props.width].idWidth,
                name:        this.visibleCols.includes('name')        ? WIDTHS.name         || 0 : 0,
                nameHeader:  this.visibleCols.includes('name')        ? WIDTHS.name         || 0 : 0,
                type:        this.visibleCols.includes('type')        ? WIDTHS.type         || 0 : 0,
                role:        this.visibleCols.includes('role')        ? WIDTHS.role         || 0 : 0,
                room:        this.visibleCols.includes('room')        ? WIDTHS.room         || 0 : 0,
                func:        this.visibleCols.includes('func')        ? WIDTHS.func         || 0 : 0,
                changedFrom: this.visibleCols.includes('changedFrom') ? WIDTHS.changedFrom  || 0 : 0,
                qualityCode: this.visibleCols.includes('qualityCode') ? WIDTHS.qualityCode  || 0 : 0,
                timestamp:   this.visibleCols.includes('timestamp')   ? WIDTHS.timestamp    || 0 : 0,
                lastChange:  this.visibleCols.includes('lastChange')  ? WIDTHS.lastChange   || 0 : 0,
                val:         this.visibleCols.includes('val')         ? WIDTHS.val          || 0 : 0,
                buttons:     this.visibleCols.includes('buttons')     ? WIDTHS.buttons      || 0 : 0,
            };

            if (this.columnsVisibility.name && !this.customWidth) {
                let widthSum = this.columnsVisibility.id; // id is always visible
                if (this.state.statesView) {
                    widthSum += this.columnsVisibility.changedFrom;
                    widthSum += this.columnsVisibility.qualityCode;
                    widthSum += this.columnsVisibility.timestamp;
                    widthSum += this.columnsVisibility.lastChange;
                } else {
                    widthSum += this.columnsVisibility.type;
                    widthSum += this.columnsVisibility.role;
                    widthSum += this.columnsVisibility.room;
                    widthSum += this.columnsVisibility.func;
                }
                widthSum += this.columnsVisibility.val;
                widthSum += this.columnsVisibility.buttons;
                this.columnsVisibility.name = `calc(100% - ${widthSum + 5}px)`;
                this.columnsVisibility.nameHeader = `calc(100% - ${widthSum + 5 + this.state.scrollBarWidth}px)`;
            } else if (!this.customWidth) {
                // Calculate the with of ID
                let widthSum = 0; // id is always visible
                if (this.state.statesView) {
                    widthSum += this.columnsVisibility.changedFrom;
                    widthSum += this.columnsVisibility.qualityCode;
                    widthSum += this.columnsVisibility.timestamp;
                    widthSum += this.columnsVisibility.lastChange;
                } else {
                    widthSum += this.columnsVisibility.type;
                    widthSum += this.columnsVisibility.role;
                    widthSum += this.columnsVisibility.room;
                    widthSum += this.columnsVisibility.func;
                }
                widthSum += this.columnsVisibility.val;
                widthSum += this.columnsVisibility.buttons;
                this.columnsVisibility.id = `calc(100% - ${widthSum + 5}px)`;
            }
        } else {
            this.columnsVisibility = {
                id: columnsWidths.id || SCREEN_WIDTHS[this.props.width].idWidth,
                name: columns.includes('name')
                    ? columnsWidths.name || WIDTHS.name || SCREEN_WIDTHS[this.props.width].widths.name || 0
                    : 0,
                type: columns.includes('type')
                    ? columnsWidths.type || WIDTHS.type || SCREEN_WIDTHS[this.props.width].widths.type || 0
                    : 0,
                role: columns.includes('role')
                    ? columnsWidths.role || WIDTHS.role || SCREEN_WIDTHS[this.props.width].widths.role || 0
                    : 0,
                room: columns.includes('room')
                    ? columnsWidths.room || WIDTHS.room || SCREEN_WIDTHS[this.props.width].widths.room || 0
                    : 0,
                func: columns.includes('func')
                    ? columnsWidths.func || WIDTHS.func || SCREEN_WIDTHS[this.props.width].widths.func || 0
                    : 0,
            };
            let widthSum = this.columnsVisibility.id; // id is always visible
            if (this.columnsVisibility.name) {
                widthSum += this.columnsVisibility.type;
                widthSum += this.columnsVisibility.role;
                widthSum += this.columnsVisibility.room;
                widthSum += this.columnsVisibility.func;
            }

            if (columnsForAdmin && columns) {
                Object.keys(columnsForAdmin)
                    .sort()
                    .forEach(adapter =>
                        columnsForAdmin[adapter].forEach(column => {
                            const id = `_${adapter}_${column.path}`;
                            this.columnsVisibility[id] = columns.includes(id);
                            if (columns.includes(id)) {
                                const item = {
                                    adapter,
                                    id: `_${adapter}_${column.path}`,
                                    name: column.name,
                                    path: column.path.split('.'),
                                    pathText: column.path,
                                };
                                if (column.edit) {
                                    item.edit = true;
                                    if (column.type) {
                                        item.type = column.type;
                                    }
                                    if (column.objTypes) {
                                        item.objTypes = column.objTypes;
                                    }
                                }

                                this.adapterColumns.push(item);
                                this.columnsVisibility[id] =
                                    columnsWidths[item.id] ||
                                    column.width ||
                                    SCREEN_WIDTHS[this.props.width].widths.func ||
                                    SCREEN_WIDTHS.xl.widths.func;
                                widthSum += this.columnsVisibility[id];
                            } else {
                                this.columnsVisibility[id] = 0;
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
                widthSum += this.columnsVisibility.buttons;
            }

            if (this.columnsVisibility.name && !columnsWidths.name) {
                widthSum += this.columnsVisibility.val;
                this.columnsVisibility.name = `calc(100% - ${widthSum}px)`;
                this.columnsVisibility.nameHeader = `calc(100% - ${widthSum + 5 + this.state.scrollBarWidth}px)`;
            } else {
                const newWidth = Object.keys(this.columnsVisibility).reduce((accumulator, name) => {
                    if (
                        name === 'id' ||
                        typeof this.columnsVisibility[name] === 'string' ||
                        !this.columnsVisibility[name]
                    ) {
                        return accumulator;
                    }
                    return accumulator + this.columnsVisibility[name];
                }, 0);
                this.columnsVisibility.id = `calc(100% - ${newWidth}px)`;
            }
        }
    }

    resizerMouseMove = e => {
        if (this.resizerActiveDiv) {
            let width;
            let widthNext;
            if (this.resizeLeft) {
                width = this.resizerOldWidth - e.clientX + this.resizerPosition;
                widthNext = this.resizerOldWidthNext + e.clientX - this.resizerPosition;
            } else {
                width = this.resizerOldWidth + e.clientX - this.resizerPosition;
                widthNext = this.resizerOldWidthNext - e.clientX + this.resizerPosition;
            }

            if (
                (!this.resizerMin || width > this.resizerMin) &&
                (!this.resizerNextMin || widthNext > this.resizerNextMin)
            ) {
                this.resizerCurrentWidths[this.resizerActiveName] = width;
                this.resizerCurrentWidths[this.resizerNextName] = widthNext;

                this.resizerActiveDiv.style.width = `${width}px`;
                this.resizerNextDiv.style.width = `${widthNext}px`;

                this.columnsVisibility[this.resizerActiveName] = width;
                this.columnsVisibility[this.resizerNextName] = widthNext;
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
        (window._localStorage || window.localStorage).setItem(
            `${this.props.dialogName || 'App'}.table`,
            JSON.stringify(this.resizerCurrentWidths),
        );
        this.resizerActiveName = null;
        this.resizerNextName = null;
        this.resizerActiveDiv = null;
        this.resizerNextDiv = null;
        window.removeEventListener('mousemove', this.resizerMouseMove);
        window.removeEventListener('mouseup', this.resizerMouseUp);
    };

    resizerMouseDown = e => {
        if (this.resizerActiveIndex === null || this.resizerActiveIndex === undefined) {
            if (!this.storedWidths) {
                this.storedWidths = JSON.parse(JSON.stringify(SCREEN_WIDTHS[this.props.width]));
            }

            this.resizerCurrentWidths = this.resizerCurrentWidths || {};
            this.resizerActiveDiv = e.target.parentNode;
            this.resizerActiveName = this.resizerActiveDiv.dataset.name;

            let i = 0;
            if (e.target.dataset.left === 'true') {
                this.resizeLeft = true;
                this.resizerNextDiv = this.resizerActiveDiv.previousElementSibling;
                let handle = this.resizerNextDiv.querySelector(`.${this.props.classes.resizeHandle}`);
                while (this.resizerNextDiv && !handle && i < 10) {
                    this.resizerNextDiv = this.resizerNextDiv.previousElementSibling;
                    handle = this.resizerNextDiv.querySelector(`.${this.props.classes.resizeHandle}`);
                    i++;
                }
                if (handle && handle.dataset.left !== 'true') {
                    this.resizerNextDiv = this.resizerNextDiv.nextElementSibling;
                }
            } else {
                this.resizeLeft = false;
                this.resizerNextDiv = this.resizerActiveDiv.nextElementSibling;
                /* while (this.resizerNextDiv && !this.resizerNextDiv.querySelector('.' + this.props.classes.resizeHandle) && i < 10) {
                    this.resizerNextDiv = this.resizerNextDiv.nextElementSibling;
                    i++;
                } */
            }
            this.resizerNextName = this.resizerNextDiv.dataset.name;

            this.resizerMin = parseInt(this.resizerActiveDiv.dataset.min, 10) || 0;
            this.resizerNextMin = parseInt(this.resizerNextDiv.dataset.min, 10) || 0;

            this.resizerPosition = e.clientX;

            this.resizerCurrentWidths[this.resizerActiveName] = this.resizerActiveDiv.offsetWidth;
            this.resizerCurrentWidths[this.resizerNextName] = this.resizerNextDiv.offsetWidth;

            this.resizerOldWidth = this.resizerCurrentWidths[this.resizerActiveName];
            this.resizerOldWidthNext = this.resizerCurrentWidths[this.resizerNextName];

            window.addEventListener('mousemove', this.resizerMouseMove);
            window.addEventListener('mouseup', this.resizerMouseUp);
        }
    };

    /**
     * Handle keyboard events for navigation
     *
     * @param {KeyboardEvent} event
     */
    navigateKeyPress(event) {
        const selectedId = this.state.selectedNonObject || this.state.selected[0];

        if (!selectedId) {
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            event.preventDefault();
            const ids = [];
            this.tableRef.current.childNodes.forEach(node => ids.push(node.id));
            const idx = ids.indexOf(selectedId);
            const newIdx = event.code === 'ArrowDown' ? idx + 1 : idx - 1;
            const newId = ids[newIdx] || selectedId;
            this.onSelect(newId);
            this.scrollToItem(newId);
        }

        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            this.toggleExpanded(selectedId);
        }
    }

    resizerReset = () => {
        this.customWidth = false;
        SCREEN_WIDTHS[this.props.width] = JSON.parse(JSON.stringify(this.storedWidths));
        this.calculateColumnsVisibility();
        (window._localStorage || window.localStorage).removeItem(`${this.props.dialogName || 'App'}.table`);
        this.forceUpdate();
    };

    /**
     * @private
     * @returns {JSX.Element}
     */
    renderHeader() {
        const classes = this.props.classes;

        let filterClearInValue = null;
        if (!this.columnsVisibility.buttons && !this.isFilterEmpty()) {
            filterClearInValue = <IconButton
                onClick={() => this.clearFilter()}
                className={classes.buttonClearFilter}
                title={this.props.t('ra_Clear filter')}
                size="large"
            >
                <IconClearFilter />
                <IconClose className={classes.buttonClearFilterIcon} />
            </IconButton>;
        }

        return <div className={classes.headerRow}>
            <div
                className={classes.headerCell}
                style={{ width: this.columnsVisibility.id, position: 'relative' }}
                data-min={240}
                data-name="id"
            >
                {this.getFilterInput('id')}
                <div
                    className={`${this.props.classes.resizeHandle} ${this.props.classes.resizeHandleRight}`}
                    onMouseDown={this.resizerMouseDown}
                    onDoubleClick={this.resizerReset}
                    title={this.props.t('ra_Double click to reset table layout')}
                />
            </div>
            {this.columnsVisibility.name ? <div
                className={classes.headerCell}
                style={{ width: this.columnsVisibility.nameHeader }}
                data-min={100}
                data-name="nameHeader"
            >
                {this.getFilterInput('name')}
            </div> : null}
            {!this.state.statesView && <>
                {this.columnsVisibility.type ? <div
                    className={classes.headerCell}
                    style={{ width: this.columnsVisibility.type }}
                    data-min={100}
                    data-name="type"
                >
                    {this.getFilterSelectType()}
                </div> : null}
                {this.columnsVisibility.role ? <div
                    className={classes.headerCell}
                    style={{ width: this.columnsVisibility.role }}
                    data-min={100}
                    data-name="role"
                >
                    {this.getFilterSelectRole()}
                </div> : null}
                {this.columnsVisibility.room ? <div
                    className={classes.headerCell}
                    style={{ width: this.columnsVisibility.room }}
                    data-min={100}
                    data-name="room"
                >
                    {this.getFilterSelectRoom()}
                </div> : null}
                {this.columnsVisibility.func ? <div
                    className={classes.headerCell}
                    style={{ width: this.columnsVisibility.func }}
                    data-min={100}
                    data-name="func"
                >
                    {this.getFilterSelectFunction()}
                </div> : null}
            </>}
            {this.state.statesView && <>
                <div
                    className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                    style={{ width: this.columnsVisibility.changedFrom }}
                    data-min={100}
                    data-name="changedFrom"
                >
                    {this.props.t('ra_Changed from')}
                </div>
                <div
                    className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                    style={{ width: this.columnsVisibility.qualityCode }}
                    data-min={100}
                    data-name="qualityCode"
                >
                    {this.props.t('ra_Quality code')}
                </div>
                <div
                    className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                    style={{ width: this.columnsVisibility.timestamp }}
                    data-min={100}
                    data-name="timestamp"
                >
                    {this.props.t('ra_Timestamp')}
                </div>
                <div
                    className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                    style={{ width: this.columnsVisibility.lastChange }}
                    data-min={100}
                    data-name="lastChange"
                >
                    {this.props.t('ra_Last change')}
                </div>
            </>}
            {this.adapterColumns.map(item => <div
                className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                style={{ width: this.columnsVisibility[item.id] }}
                title={item.adapter}
                key={item.id}
                data-min={100}
                data-name={item.id}
            >
                {item.name}
            </div>)}
            {this.columnsVisibility.val ? <div
                className={Utils.clsx(classes.headerCell, classes.headerCellValue)}
                style={{ width: this.columnsVisibility.val, position: 'relative' }}
                data-min={120}
                data-name="val"
            >
                <div
                    className={`${this.props.classes.resizeHandle} ${this.props.classes.resizeHandleLeft}`}
                    data-left="true"
                    onMouseDown={this.resizerMouseDown}
                    onDoubleClick={this.resizerReset}
                    title={this.props.t('ra_Double click to reset table layout')}
                />
                {this.props.t('ra_Value')}
                {filterClearInValue}
            </div> : null}
            {this.columnsVisibility.buttons ? <div
                className={classes.headerCell}
                style={{ width: this.columnsVisibility.buttons }}
            >
                {' '}
                {this.getFilterSelectCustoms()}
            </div> : null}
        </div>;
    }

    /**
     * @private
     * @returns {JSX.Element}
     */
    renderToast() {
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
                ((this.state.selected && this.state.selected[0]) || this.lastSelectedItems)
            ) {
                this.scrollToItem((this.state.selected && this.state.selected[0]) || this.lastSelectedItems);
            }
        }
    }

    scrollToItem(id) {
        const node = window.document.getElementById(id);
        node &&
            node.scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center',
            });
        this.selectedFound = true;
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderCustomDialog() {
        if (this.state.customDialog && this.props.objectCustomDialog) {
            const ObjectCustomDialog = this.props.objectCustomDialog;

            return <ObjectCustomDialog
                reportChangedIds={changedIds => (this.changedIds = [...changedIds])}
                objectIDs={this.state.customDialog}
                expertMode={this.state.filter.expertMode}
                isFloatComma={this.props.isFloatComma}
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

                    this.props.router && this.props.router.doNavigate('tab-objects');
                }}
            />;
        }
        return null;
    }

    /**
     * @private
     * @param {Partial<ioBroker.State>} valAck
     */
    onUpdate(valAck) {
        this.props.socket
            .setState(this.edit.id, {
                val: valAck.val,
                ack: valAck.ack,
                q: valAck.q || 0,
                expire: valAck.expire || undefined,
            })
            .catch(e => this.showError(`Cannot write value: ${e}`));
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderEditObjectDialog() {
        if (!this.state.editObjectDialog || !this.props.objectBrowserEditObject) {
            return null;
        }

        const ObjectBrowserEditObject = this.props.objectBrowserEditObject;

        return <ObjectBrowserEditObject
            key={this.state.editObjectDialog}
            obj={this.objects[this.state.editObjectDialog]}
            roleArray={this.info.roles}
            objects={this.objects}
            dateFormat={this.props.dateFormat}
            isFloatComma={this.props.isFloatComma}
            themeName={this.props.themeName}
            socket={this.props.socket}
            dialogName={this.props.dialogName}
            aliasTab={this.state.editObjectAlias}
            t={this.props.t}
            expertMode={this.state.filter.expertMode}
            onNewObject={obj =>
                this.props.socket
                    .setObject(obj._id, obj)
                    .then(() => this.setState({ editObjectDialog: obj._id, editObjectAlias: false }, () => this.onSelect(obj._id)))
                    .catch(e => this.showError(`Cannot write object: ${e}`))}
            onClose={obj => {
                if (obj) {
                    let updateAlias;
                    if (this.state.editObjectDialog.startsWith('alias.')) {
                        if (
                            JSON.stringify(this.objects[this.state.editObjectDialog].common?.alias) !==
                            JSON.stringify(obj.common?.alias)
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

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderViewObjectFileDialog() {
        if (!this.state.viewFileDialog || !this.props.objectBrowserViewFile) {
            return null;
        }
        const ObjectBrowserViewFile = this.props.objectBrowserViewFile;

        return <ObjectBrowserViewFile
            key="viewFile"
            obj={this.objects[this.state.viewFileDialog]}
            themeType={this.props.themeType}
            socket={this.props.socket}
            dialogName={this.props.dialogName}
            t={this.props.t}
            expertMode={this.state.filter.expertMode}
            onClose={() => this.setState({ viewFileDialog: '' })}
        />;
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderAliasEditorDialog() {
        if (!this.props.objectBrowserAliasEditor || !this.state.showAliasEditor) {
            return null;
        }
        const ObjectBrowserAliasEditor = this.props.objectBrowserAliasEditor;

        return <ObjectBrowserAliasEditor
            key="editAlias"
            obj={this.objects[this.state.showAliasEditor]}
            objects={this.objects}
            themeType={this.props.themeType}
            socket={this.props.socket}
            dialogName={this.props.dialogName}
            t={this.props.t}
            expertMode={this.state.filter.expertMode}
            onClose={() => this.setState({ showAliasEditor: '' })}
            onRedirect={id => this.setState({ editObjectDialog: id, showAliasEditor: false, editObjectAlias: true })}
        />;
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderContextMenu() {
        if (!this.state.showContextMenu) {
            return null;
        }
        const item = this.state.showContextMenu.item;
        const items = [];

        // Edit object -----------------------
        if (this.props.objectBrowserEditObject && item.data.obj) {
            items.push(<MenuItem
                key="editObject"
                onClick={() => this.setState({ editObjectDialog: item.data.id, showContextMenu: null, editObjectAlias: false })}
            >
                <ListItemIcon>
                    <IconEdit fontSize="small" />
                </ListItemIcon>
                <ListItemText>{this.texts.editObject}</ListItemText>
            </MenuItem>);
        }

        // Edit value -----------------------------
        if (this.states &&
            !this.props.notEditable &&
            item.data.obj?.type === 'state' &&
            item.data.obj.common?.type !== 'file' &&
            (this.state.filter.expertMode || item.data.obj?.write !== false)
        ) {
            items.push(<MenuItem
                key="editValue"
                onClick={() => {
                    const id = item.data.obj._id;
                    this.edit = {
                        val: this.states[id] ? this.states[id].val : '',
                        q: this.states[id] ? this.states[id].q || 0 : 0,
                        ack: false,
                        id,
                    };
                    this.setState({ updateOpened: true, showContextMenu: null });
                }}
            >
                <ListItemIcon>
                    <IconValueEdit fontSize="small" />
                </ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit value')}</ListItemText>
            </MenuItem>);
        }

        // View file -----------------------------
        if (this.props.objectBrowserViewFile && item.data.obj.type === 'state' && item.data.obj.common?.type === 'file') {
            items.push(<MenuItem
                key="viewFile"
                onClick={() => this.setState({ viewFileDialog: item.data.obj._id, showContextMenu: null })}
            >
                <ListItemIcon>
                    <FindInPage fontSize="small" />
                </ListItemIcon>
                <ListItemText>{this.props.t('ra_View file')}</ListItemText>
            </MenuItem>);
        }

        // Custom config ----------------------------
        if (item.data.obj &&
            this.props.objectCustomDialog &&
            this.info.hasSomeCustoms &&
            item.data.obj.type === 'state' &&
            item.data.obj.common?.type !== 'file'
        ) {
            items.push(<MenuItem
                key="customConfig"
                onClick={() => {
                    const id = item.data.id;
                    this.pauseSubscribe(true);
                    this.props.router && this.props.router.doNavigate(null, 'customs', id);
                    this.setState({ customDialog: [id], showContextMenu: null });
                }}
            >
                <ListItemIcon className={item.data.hasCustoms
                    ? this.props.classes.cellButtonsButtonWithCustoms
                    : this.props.classes.cellButtonsButtonWithoutCustoms}
                >
                    <IconConfig fontSize="small" />
                </ListItemIcon>
                <ListItemText>{this.texts.customConfig}</ListItemText>
            </MenuItem>);
        }

        // ACL -----------------------
        let showACL = '';
        if (this.props.objectEditOfAccessControl && this.state.filter.expertMode) {
            if (!item.data.obj) {
                showACL = '---';
            } else {
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
                showACL = Number.isNaN(Number(acl)) ? Number(aclSystemConfig).toString(16) : Number(acl).toString(16);
            }
        }

        if (showACL) {
            items.push(<MenuItem
                key="acl"
                onClick={() => {
                    this.setState({
                        showContextMenu: null,
                        modalEditOfAccess: true,
                        modalEditOfAccessObjData: item.data,
                    });
                }}
            >
                <ListItemIcon style={{ fontSize: 'smaller' }}>
                    {showACL}
                </ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit ACL')}</ListItemText>
            </MenuItem>);
        }

        const enumEditable = !this.props.notEditable && item.data.obj &&
            (this.state.filter.expertMode || item.data.obj.type === 'state' || item.data.obj.type === 'channel' || item.data.obj.type === 'device');

        // Edit role -----------------------
        if (this.state.filter.expertMode && enumEditable && this.props.objectBrowserEditRole) {
            items.push(<MenuItem
                key="role"
                onClick={() => this.setState({ roleDialog: item.data.id, showContextMenu: null })}
            >
                <ListItemIcon><BorderColor fontSize="small" /></ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit role')}</ListItemText>
            </MenuItem>);
        }

        // Edit function and room -----------------------
        if (enumEditable) {
            items.push(<MenuItem
                key="func"
                onClick={() => {
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
                            enumsOriginal: JSON.parse(JSON.stringify(enums)),
                        },
                        showContextMenu: null,
                    });
                }}
            >
                <ListItemIcon><BedroomParent fontSize="small" /></ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit function')}</ListItemText>
            </MenuItem>);

            items.push(<MenuItem
                key="room"
                onClick={() => {
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
                            enumsOriginal: JSON.parse(JSON.stringify(enums)),
                        },
                        showContextMenu: null,
                    });
                }}
            >
                <ListItemIcon><Construction fontSize="small" /></ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit room')}</ListItemText>
            </MenuItem>);
        }

        // Alias editor -----------------------
        if (!this.props.notEditable &&
            this.props.objectBrowserAliasEditor &&
            this.props.objectBrowserEditObject &&
            this.state.filter.expertMode &&
            item.data.obj?.type === 'state' &&
            item.data.obj.common &&
            item.data.obj.common.type !== 'file'
        ) {
            items.push(<MenuItem
                key="alias"
                onClick={() => {
                    if (item.data.obj.common?.alias) {
                        this.setState({ editObjectDialog: item.data.id, showContextMenu: null, editObjectAlias: true });
                    } else {
                        this.setState({ showContextMenu: null, showAliasEditor: item.data.id });
                    }
                }}
            >
                <ListItemIcon className={item.data.obj.common.alias
                    ? this.props.classes.cellButtonsButtonWithCustoms
                    : this.props.classes.cellButtonsButtonWithoutCustoms}
                >
                    <IconLink />
                </ListItemIcon>
                <ListItemText>{this.props.t('ra_Edit alias')}</ListItemText>
            </MenuItem>);
        }

        // Delete
        let showDelete = false;
        if (this.props.onObjectDelete) {
            if (!item.data.obj) {
                if (item.children?.length) {
                    showDelete = true;
                }
            } else if (item.children?.length || !item.data.obj.common?.dontDelete) {
                showDelete = true;
            }
        }

        if (showDelete) {
            items.push(<MenuItem
                key="delete"
                onClick={() => {
                    const id = item.data.id;
                    this.setState({ showContextMenu: null }, () => {
                        // calculate number of children
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

                        this.props.onObjectDelete(
                            id,
                            !!item.children?.length,
                            !item.data.obj.common?.dontDelete,
                            count + 1,
                        );
                    });
                }}
            >
                <ListItemIcon>
                    <IconDelete fontSize="small" />
                </ListItemIcon>
                <ListItemText>{this.texts.deleteObject}</ListItemText>
            </MenuItem>);
        }

        if (!items.length) {
            setTimeout(() => {
                this.setState({ showContextMenu: null });
            }, 100);
            return null;
        }

        return <Menu
            key="contextMenu"
            open={!0}
            anchorEl={this.state.showContextMenu.target}
            onClose={() => this.setState({ showContextMenu: null })}
        >
            {items}
        </Menu>;
    }

    /**
     * @private
     * @returns {JSX.Element | null}
     */
    renderEditValueDialog() {
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

        const ObjectBrowserValue = this.props.objectBrowserValue;

        return <ObjectBrowserValue
            t={this.props.t}
            lang={this.props.lang}
            type={type}
            states={Utils.getStates(this.objects[this.edit.id])}
            themeType={this.props.themeType}
            expertMode={this.state.filter.expertMode}
            value={this.edit.val}
            socket={this.props.socket}
            object={this.objects[this.edit.id]}
            defaultHistory={this.defaultHistory}
            dateFormat={this.props.dateFormat}
            onClose={res => {
                this.setState({ updateOpened: false });
                res && this.onUpdate(res);
            }}
        />;
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    extendObject = (id, data) =>
        this.props.socket.extendObject(id, data)
            .catch(error => window.alert(error));

    /**
     * This method is used when `this` context is passed down
     * @param {string} id
     * @param {ioBroker.SettableObject} data
     */
    // eslint-disable-next-line react/no-unused-class-component-methods
    setObject = (id, data) =>
        this.props.socket.setObject(id, data)
            .catch(error => window.alert(error));

    /**
     * The rendering method of this component.
     * @returns {JSX.Element}
     */
    render() {
        this.recordStates = [];
        this.unsubscribeTimer && clearTimeout(this.unsubscribeTimer);

        // apply filter if changed
        const jsonFilter = JSON.stringify(this.state.filter);

        if (this.lastAppliedFilter !== jsonFilter && this.objects && this.root) {
            const counter = { count: 0 };

            applyFilter(
                this.root,
                this.state.filter,
                this.props.lang,
                this.objects,
                null,
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
        const classes = this.props.classes;
        const items = this.renderItem(this.root, undefined, classes);

        return <TabContainer key={this.props.dialogName} classes={{}} onKeyDown={event => this.navigateKeyPress(event)} tabIndex={0}>
            <TabHeader>{this.getToolbar()}</TabHeader>
            <TabContent classes={{}}>
                {this.renderHeader()}
                <div className={this.props.classes.tableDiv} ref={this.tableRef}>
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
            {this.state.modalEditOfAccess &&
                this.props.modalEditOfAccessControl &&
                this.props.modalEditOfAccessControl(this, this.state.modalEditOfAccessObjData)}
        </TabContainer>;
    }
}

ObjectBrowser.defaultProps = {
    objectAddBoolean: false,
    objectEditBoolean: false,
    objectStatesView: false,
    objectImportExport: false,
    objectEditOfAccessControl: false,
    modalNewObject: () => {},
    modalEditOfAccessControl: () => {},
};

ObjectBrowser.propTypes = {
    dialogName: PropTypes.string, // where to store settings in localStorage
    classes: PropTypes.object,
    defaultFilters: PropTypes.object,
    selected: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.array,
    ]),
    onSelect: PropTypes.func,
    onFilterChanged: PropTypes.func,
    socket: PropTypes.object,
    showExpertButton: PropTypes.bool,
    expertMode: PropTypes.bool,
    imagePrefix: PropTypes.string,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    theme: PropTypes.object,
    t: PropTypes.func,
    lang: PropTypes.string.isRequired,
    multiSelect: PropTypes.bool,
    notEditable: PropTypes.bool,
    foldersFirst: PropTypes.bool,
    disableColumnSelector: PropTypes.bool,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
    levelPadding: PropTypes.number,

    // components
    objectCustomDialog: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.func,
    ]),
    objectAddBoolean: PropTypes.bool,   // optional toolbar button
    objectEditBoolean: PropTypes.bool,  // optional toolbar button
    objectStatesView: PropTypes.bool,   // optional toolbar button
    objectImportExport: PropTypes.bool, // optional toolbar button
    objectEditOfAccessControl: PropTypes.bool, // Access Control
    modalNewObject: PropTypes.func,     // modal add object
    modalEditOfAccessControl: PropTypes.func, // modal Edit Of Access Control
    onObjectDelete: PropTypes.func,     // optional function (id, hasChildren, objectExists, childrenCount+1) {  }
    customFilter: PropTypes.object,     // optional
    //                                    `{common: {custom: true}}` - show only objects with some custom settings
    //                                    `{common: {custom: 'sql.0'}}` - show only objects with sql.0 custom settings (only of the specific instance)
    //                                    `{common: {custom: '_dataSources'}}` - show only objects of adapters `influxdb' or 'sql' or 'history'
    //                                    `{common: {custom: 'adapterName.'}}` - show only objects of custom settings of specific adapter (all instances)
    //                                    `{type: 'channel'}` - show only channels
    //                                    `{type: ['channel', 'device']}` - show only channels and devices
    //                                    `{common: {type: 'number'}` - show only states of type 'number
    //                                    `{common: {type: ['number', 'string']}` - show only states of type 'number and string
    //                                    `{common: {role: 'switch']}` - show only states with roles starting from switch
    //                                    `{common: {role: ['switch', 'button]}` - show only states with roles starting from `switch` and `button`
    objectBrowserValue: PropTypes.object,
    objectBrowserEditObject: PropTypes.object,
    objectBrowserAliasEditor: PropTypes.func, // on edit alias
    objectBrowserEditRole: PropTypes.object, // on Edit role
    objectBrowserViewFile: PropTypes.func, // on view file state
    router: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.func,
    ]),
    types: PropTypes.array,             // optional ['state', 'instance', 'channel']
    columns: PropTypes.array,           // optional ['name', 'type', 'role', 'room', 'func', 'val', 'buttons']
    // eslint-disable-next-line react/no-unused-prop-types
    root: PropTypes.string,             // optional, shows only elements of this root

    objectsWorker: PropTypes.object,    // optional cache of objects
    filterFunc: PropTypes.func,         // function to filter out all unnecessary objects. It cannot be used together with "types"
    //                                     Example for function: `obj => obj.common && obj.common.type === 'boolean'` to show only boolean states

    DragWrapper: PropTypes.func,
    dragEnabled: PropTypes.bool,
};

/** @type {typeof ObjectBrowser} */
const _export = withWidth()(withStyles(styles)(ObjectBrowser));
export default _export;
