/**
 * Copyright 2020-2024, Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import React, { Component, type JSX } from 'react';
import Dropzone from 'react-dropzone';

import {
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
    Toolbar,
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Input,
    Breadcrumbs,
    Box,
} from '@mui/material';

// MUI Icons
import {
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Bookmark as JsonIcon,
    BookmarkBorder as CssIcon,
    Description as HtmlIcon,
    Edit as EditIcon,
    Code as JSIcon,
    InsertDriveFile as FileIcon,
    Publish as UploadIcon,
    MusicNote as MusicIcon,
    SaveAlt as DownloadIcon,
    CreateNewFolder as AddFolderIcon,
    FolderOpen as EmptyFilterIcon,
    List as IconList,
    ViewModule as IconTile,
    ArrowBack as IconBack,
    Delete as DeleteIcon,
    Brightness6 as Brightness5Icon,
    Image as TypeIconImages,
    FontDownload as TypeIconTxt,
    AudioFile as TypeIconAudio,
    Videocam as TypeIconVideo,
    KeyboardReturn as EnterIcon,
    FolderSpecial as RestrictedIcon,
} from '@mui/icons-material';

import type { Connection } from '@iobroker/socket-client';

import { DialogError } from '../Dialogs/Error';
import { Utils } from './Utils';
import { DialogTextInput } from '../Dialogs/TextInput';

// Custom Icons
import { IconExpert } from '../icons/IconExpert';
import { IconClosed } from '../icons/IconClosed';
import { IconOpen } from '../icons/IconOpen';
import { IconNoIcon } from '../icons/IconNoIcon';
import { Icon } from './Icon';

import { withWidth } from './withWidth';
import type { ThemeName, ThemeType, Translate, IobTheme } from '../types';

import { FileViewer, EXTENSIONS } from './FileViewer';

const ROW_HEIGHT = 32;
const BUTTON_WIDTH = 32;
const TILE_HEIGHT = 120;
const TILE_WIDTH = 64;

const NOT_FOUND = 'Not found';

// Todo: replace with js-controller types
export interface MetaACL extends ioBroker.ObjectACL {
    file: number;
}

// Todo: replace with js-controller types
export interface MetaObject extends ioBroker.MetaObject {
    acl: MetaACL;
}

const FILE_TYPE_ICONS: Record<string, React.FC<{ fontSize?: 'small' }>> = {
    all: FileIcon,
    images: TypeIconImages,
    code: JSIcon,
    txt: TypeIconTxt,
    audio: TypeIconAudio,
    video: TypeIconVideo,
};

const styles: Record<string, any> = {
    root: {
        width: '100%',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
    },
    filesDiv: {
        width: 'calc(100% - 16px)',
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: 8,
    },
    filesDivHint: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        opacity: 0.7,
        fontStyle: 'italic',
        fontSize: 12,
    },
    filesDivTable: {
        height: 'calc(100% - 56px)',
    },
    filesDivTile: {
        height: `calc(100% - ${48 * 2 + 8}px)`,
        display: 'flex',
        alignContent: 'flex-start',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        flex: `0 0 ${TILE_WIDTH}px`,
    },

    itemTile: (theme: IobTheme) => ({
        position: 'relative',
        userSelect: 'none',
        cursor: 'pointer',
        height: TILE_HEIGHT,
        width: TILE_WIDTH,
        display: 'inline-block',
        textAlign: 'center',
        opacity: 0.1,
        transition: 'opacity 1s',
        margin: '4px',
        borderRadius: '4px',
        '&:hover': {
            background: theme.palette.secondary.light,
            color: Utils.invertColor(theme.palette.secondary.main, true),
        },
    }),
    itemNameFolderTile: {
        fontWeight: 'bold',
    },
    itemNameTile: {
        width: '100%',
        height: 32,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: 12,
        textAlign: 'center',
        wordBreak: 'break-all',
    },
    itemFolderIconTile: (theme: IobTheme) => ({
        width: '100%',
        height: TILE_HEIGHT - 32 - 16 - 8, // name + size
        display: 'block',
        pl: 1,
        color: theme.palette.secondary.main || '#fbff7d',
    }),
    itemFolderIconBack: (theme: IobTheme) => ({
        position: 'absolute',
        top: 22,
        left: 18,
        zIndex: 1,
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
    }),
    itemSizeTile: {
        width: '100%',
        height: 16,
        textAlign: 'center',
        fontSize: 10,
    },
    itemImageTile: {
        width: 'calc(100% - 8px)',
        height: TILE_HEIGHT - 32 - 16 - 8, // name + size
        margin: 4,
        display: 'block',
        textAlign: 'center',
        objectFit: 'contain',
    },
    itemIconTile: {
        width: '100%',
        height: TILE_HEIGHT - 32 - 16 - 8, // name + size
        display: 'block',
        objectFit: 'contain',
    },

    itemSelected: (theme: IobTheme) => ({
        background: theme.palette.primary.main,
        color: Utils.invertColor(theme.palette.primary.main, true),
    }),

    itemTable: (theme: IobTheme) => ({
        userSelect: 'none',
        cursor: 'pointer',
        height: ROW_HEIGHT,
        display: 'inline-flex',
        lineHeight: `${ROW_HEIGHT}px`,
        '&:hover': {
            background: theme.palette.secondary.light,
            color: Utils.invertColor(theme.palette.secondary.main, true),
        },
    }),
    itemNameTable: {
        display: 'inline-block',
        pl: '10px',
        fontSize: '1rem',
        verticalAlign: 'top',
        flexGrow: 1,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        '@media screen and (max-width: 500px)': {
            textAlign: 'end',
            direction: 'rtl',
        },
    },
    itemNameFolderTable: {
        fontWeight: 'bold',
    },
    itemSizeTable: {
        display: 'inline-block',
        width: 60,
        verticalAlign: 'top',
        textAlign: 'right',
        whiteSpace: 'nowrap',
    },
    itemAccessTable: {
        // display: 'inline-block',
        verticalAlign: 'top',
        width: 60,
        textAlign: 'right',
        paddingRight: 5,
        display: 'flex',
        justifyContent: 'center',
    },
    itemImageTable: {
        display: 'inline-block',
        width: 30,
        marginTop: 1,
        objectFit: 'contain',
        maxHeight: 30,
    },
    itemNoImageTable: {
        marginTop: 6,
    },
    itemIconTable: {
        display: 'inline-block',
        marginTop: 1,
        width: 30,
        height: 30,
    },
    itemFolderTable: {},
    itemFolderTemp: {
        opacity: 0.4,
    },
    itemFolderIconTable: (theme: IobTheme) => ({
        marginTop: '1px',
        marginLeft: '8px',
        display: 'inline-block',
        width: 30,
        height: 30,
        color: theme.palette.secondary.main || '#fbff7d',
    }),
    itemDownloadButtonTable: (theme: IobTheme) => ({
        display: 'inline-block',
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        minWidth: BUTTON_WIDTH,
        verticalAlign: 'middle',
        textAlign: 'center',
        padding: 0,
        borderRadius: `${BUTTON_WIDTH / 2}px`,
        '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
        '& span': {
            pt: '9px',
        },
        '& svg': {
            width: 14,
            height: 14,
            fontSize: '1rem',
            mt: '-3px',
            verticalAlign: 'middle',
            color: theme.palette.mode === 'dark' ? '#EEE' : '#111',
        },
    }),
    itemDownloadEmptyTable: {
        display: 'inline-block',
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        minWidth: BUTTON_WIDTH,
        padding: 0,
    },
    itemAclButtonTable: {
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        minWidth: BUTTON_WIDTH,
        verticalAlign: 'top',
        padding: 0,
        fontSize: 12,
        display: 'flex',
    },
    itemDeleteButtonTable: {
        display: 'inline-block',
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        minWidth: BUTTON_WIDTH,
        verticalAlign: 'top',
        padding: 0,
        '& svg': {
            width: 18,
            height: 18,
            fontSize: '1.5rem',
        },
    },

    uploadDiv: {
        top: 0,
        zIndex: 1,
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        opacity: 0.9,
        textAlign: 'center',
        background: '#FFFFFF',
    },
    uploadDivDragging: {
        opacity: 1,
    },

    uploadCenterDiv: (theme: IobTheme) => ({
        m: '20px',
        border: '3px dashed grey',
        borderRadius: '30px',
        width: 'calc(100% - 40px)',
        height: 'calc(100% - 40px)',
        position: 'relative',
        color: theme.palette.mode === 'dark' ? '#222' : '#CCC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }),
    uploadCenterIcon: {
        width: '25%',
        height: '25%',
    },
    uploadCenterText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    uploadCloseButton: {
        zIndex: 2,
        position: 'absolute',
        top: 30,
        right: 30,
    },
    uploadCenterTextAndIcon: {
        position: 'absolute',
        height: '30%',
        width: '100%',
        margin: 'auto',
        opacity: 0.3,
    },
    menuButtonExpertActive: {
        color: '#c00000',
    },
    menuButtonRestrictActive: {
        color: '#c05000',
    },
    pathDiv: (theme: IobTheme) => ({
        display: 'flex',
        width: 'calc(100% - 16px)',
        ml: 1,
        mr: 1,
        textOverflow: 'clip',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        backgroundColor: theme.palette.secondary.main,
    }),
    pathDivInput: {
        width: '100%',
    },
    pathDivBreadcrumbDir: (theme: IobTheme) => ({
        pl: '2px',
        pr: '2px',
        cursor: 'pointer',
        '&:hover': {
            background: theme.palette.primary.main,
        },
    }),
    pathDivBreadcrumbSelected: {
        // todo: add style
    },
    backgroundImageLight: {
        background: 'white',
    },
    backgroundImageDark: {
        background: 'black',
    },
    backgroundImageColored: {
        background: 'silver',
    },
    specialFolder: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#229b0f' : '#5dd300',
    }),
    tooltip: {
        pointerEvents: 'none',
    },
};

const USER_DATA = '0_userdata.0';

function getParentDir(dir: string | null): string {
    const parts = (dir || '').split('/');
    if (parts.length) {
        parts.pop();
    }
    return parts.join('/');
}

function isFile(path: string): boolean {
    const ext = Utils.getFileExtension(path);
    return !!(ext?.toLowerCase().match(/[a-z]+/) && ext.length < 5);
}

const TABLE = 'Table';
const TILE = 'Tile';

export interface FileBrowserProps {
    /** The key to identify this component. */
    key?: string;
    /** Additional styling for this component. */
    style?: React.CSSProperties;
    /** The CSS class name. */
    className?: string;
    /** Translation function. */
    t: Translate;
    /** The selected language. */
    lang: ioBroker.Languages;
    /** The socket connection. */
    socket: Connection;
    /** Is the component data ready. */
    ready?: boolean;
    /** Is expert mode enabled? (default: false) */
    expertMode?: boolean;
    /** Show the toolbar? (default: false) */
    showToolbar?: boolean;
    /** If defined, allow selecting only files from this folder and subfolders */
    limitPath?: string;
    /** Allow upload of new files? (default: false) */
    allowUpload?: boolean;
    /** Allow download of files? (default: false) */
    allowDownload?: boolean;
    /** Allow creation of new folders? (default: false) */
    allowCreateFolder?: boolean;
    /** Allow deleting files? (default: false) */
    allowDelete?: boolean;
    /** Allow viewing files? (default: false) */
    allowView?: boolean;
    /** Prefix (default: '.') */
    imagePrefix?: string;
    /** Show the expert button? */
    showExpertButton?: boolean;
    /** Type of view */
    viewType?: 'Table' | 'Tile';
    /** Show the buttons to switch the view from table to tile? (default: false) */
    showViewTypeButton?: boolean;
    /** The ID of the selected file. */
    selected?: string | string[];
    /** The file extensions to show, like ['png', 'svg', 'bmp', 'jpg', 'jpeg', 'gif']. */
    filterFiles?: string[];
    /** The file extension categories to show. */
    filterByType?: 'images' | 'code' | 'txt';
    /** Callback for file selection. */
    onSelect?: (id: string | string[], isDoubleClick?: boolean, isFolder?: boolean) => void;
    /** Theme name */
    themeName?: ThemeName;
    /** Theme type. */
    themeType?: ThemeType;
    /** Theme object. */
    theme: IobTheme;

    /** Padding in pixels for folder levels */
    levelPadding?: number;

    restrictToFolder?: string;

    modalEditOfAccessControl?: (obj: FileBrowserClass) => JSX.Element | null;

    allowNonRestricted?: boolean;

    showTypeSelector?: boolean;
}

export interface FolderOrFileItem {
    id: string;
    level: number;
    name: string;
    folder: boolean;
    temp?: boolean;

    size?: number | undefined;
    ext?: string | null;
    modified?: number;
    title?: ioBroker.StringOrTranslated;
    meta?: boolean;
    from?: string;
    ts?: number;
    color?: string;
    icon?: string;
    acl?: ioBroker.EvaluatedFileACL | MetaACL;
}

export type Folders = Record<string, FolderOrFileItem[]>;

function sortFolders(a: FolderOrFileItem, b: FolderOrFileItem): number {
    if (a.folder && b.folder) {
        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
    }
    if (a.folder) {
        return -1;
    }
    if (b.folder) {
        return 1;
    }
    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
}

interface FileBrowserState {
    viewType: string;
    folders: Folders;
    filterEmpty: boolean;
    expanded: string[];
    currentDir: string;
    expertMode: boolean;
    addFolder: boolean;
    uploadFile: boolean | 'dragging';
    deleteItem: string;
    viewer: string;
    formatEditFile: string | null;
    path: string;
    selected: string;
    errorText: string;
    modalEditOfAccess: boolean;
    backgroundImage: string | null;
    queueLength: number;
    loadAllFolders: boolean;
    fileErrors: string[];
    filterByType: string;
    showTypesMenu: HTMLButtonElement | null;
    restrictToFolder: string;
    pathFocus: boolean;
}

export class FileBrowserClass extends Component<FileBrowserProps, FileBrowserState> {
    private readonly imagePrefix: string;

    private readonly levelPadding: number;

    private mounted: boolean;

    private suppressDeleteConfirm: number;

    private browseList:
        | {
              processing?: boolean;
              resolve: null | ((files: ioBroker.ReadDirResult[]) => void);
              reject: null | ((e: any) => void);
              adapter: string | null;
              relPath: string | null;
          }[]
        | null;

    private browseListRunning: boolean;

    private initialReadFinished: boolean;

    private supportSubscribes: boolean | null;

    private _tempTimeout: Record<string, ReturnType<typeof setTimeout>>;

    private readonly limitToObjectID: string | null = null;

    private readonly limitToPath: string | null = null;

    private lastSelect: number | null = null;

    private setOpacityTimer: ReturnType<typeof setTimeout> | null = null;

    private cacheFoldersTimeout: ReturnType<typeof setTimeout> | null = null;

    private foldersLoading: boolean | null = null;

    private cacheFolders: Folders | null = null;

    private readonly localStorage: Storage;

    constructor(props: FileBrowserProps) {
        super(props);

        this.localStorage = (window as any)._localStorage || window.localStorage;
        const expandedStr = this.localStorage.getItem('files.expanded') || '[]';

        if (this.props.limitPath) {
            const parts = this.props.limitPath.split('/');
            this.limitToObjectID = parts[0];
            this.limitToPath = !parts.length ? null : parts.length === 1 && parts[0] === '' ? null : parts.join('/');
            if (this.limitToPath && this.limitToPath.endsWith('/')) {
                this.limitToPath.substring(0, this.limitToPath.length - 1);
            }
        }

        let expanded: string[];
        try {
            expanded = JSON.parse(expandedStr);
            if (this.limitToPath) {
                expanded = expanded.filter(
                    id =>
                        id.startsWith(`${this.limitToPath}/`) ||
                        id === this.limitToPath ||
                        this.limitToPath?.startsWith(`${id}/`),
                );
            }
        } catch {
            expanded = [];
        }

        let viewType;
        if (this.props.showViewTypeButton) {
            viewType = this.localStorage.getItem('files.viewType') || TABLE;
        } else {
            viewType = TABLE;
        }

        let selected = this.props.selected || this.localStorage.getItem('files.selected') || USER_DATA;

        let currentDir: string;

        if (props.restrictToFolder) {
            selected = props.restrictToFolder;
            currentDir = props.restrictToFolder;
            const parts = props.restrictToFolder.split('/');
            expanded = [];
            let path = '';
            for (let i = 0; i < parts.length; i++) {
                path += (path ? '/' : '') + parts[i];
                expanded.push(path);
            }
        } else {
            // TODO: Now we do not support multiple selection
            if (Array.isArray(selected)) {
                selected = selected[0];
            }

            if (isFile(selected)) {
                currentDir = getParentDir(selected);
            } else {
                currentDir = selected;
            }
        }
        const backgroundImage = this.localStorage.getItem('files.backgroundImage') || null;

        this.state = {
            viewType,
            folders: {},
            filterEmpty: this.localStorage.getItem('files.empty') !== 'false',
            expanded,
            currentDir,
            expertMode: !!props.expertMode,
            addFolder: false,
            uploadFile: false,
            deleteItem: '',
            // marked: [],
            viewer: '',
            formatEditFile: '',
            path: selected,
            selected,
            errorText: '',
            modalEditOfAccess: false,
            backgroundImage,
            queueLength: 0,
            loadAllFolders: false,
            // allFoldersLoaded: false,
            fileErrors: [],
            filterByType: props.filterByType || window.localStorage.getItem('files.filterByType') || '',
            showTypesMenu: null,
            restrictToFolder: props.restrictToFolder || '',
            pathFocus: false,
        };

        this.imagePrefix = this.props.imagePrefix || './files/';

        this.levelPadding = this.props.levelPadding || 20;
        this.mounted = true;
        this.suppressDeleteConfirm = 0;

        this.browseList = [];
        this.browseListRunning = false;
        this.initialReadFinished = false;
        this.supportSubscribes = null;
        this._tempTimeout = {};
    }

    static getDerivedStateFromProps(
        props: FileBrowserProps,
        state: FileBrowserState,
    ): Partial<FileBrowserState> | null {
        if (props.expertMode !== undefined && props.expertMode !== state.expertMode) {
            return { expertMode: props.expertMode, loadAllFolders: true };
        }

        return null;
    }

    async loadFolders(): Promise<void> {
        this.initialReadFinished = false;

        let folders = (await this.browseFolder('/')) as unknown as Folders;

        if (this.state.viewType === TABLE) {
            folders = (await this.browseFolders([...this.state.expanded], folders)) as unknown as Folders;
        } else if (
            this.state.currentDir &&
            this.state.currentDir !== '/' &&
            (!this.limitToObjectID || this.state.currentDir.startsWith(this.limitToObjectID))
        ) {
            folders = (await this.browseFolder(this.state.currentDir, folders)) as unknown as Folders;
        }

        this.setState({ folders }, () => {
            if (this.state.viewType === TABLE && !this.findItem(this.state.selected)) {
                const parts = this.state.selected.split('/');
                while (parts.length && !this.findItem(parts.join('/'))) {
                    parts.pop();
                }
                let selected;
                if (parts.length) {
                    selected = parts.join('/');
                } else {
                    selected = USER_DATA;
                }
                this.setState({ selected, path: selected, pathFocus: false }, () => this.scrollToSelected());
            } else {
                this.scrollToSelected();
            }
            this.initialReadFinished = true;
        });
    }

    scrollToSelected(): void {
        if (this.mounted) {
            const el = document.getElementById(this.state.selected);
            el?.scrollIntoView();
        }
    }

    async componentDidMount(): Promise<void> {
        this.mounted = true;
        this.loadFolders().catch(error => console.error(`Cannot load folders: ${error}`));

        this.supportSubscribes = await this.props.socket.checkFeatureSupported('BINARY_STATE_EVENT');
        if (this.supportSubscribes) {
            await this.props.socket.subscribeFiles('*', '*', this.onFileChange);
        }
    }

    componentWillUnmount(): void {
        if (this.supportSubscribes) {
            this.props.socket.unsubscribeFiles('*', '*', this.onFileChange);
        }
        this.mounted = false;
        this.browseList = null;
        this.browseListRunning = false;
        Object.values(this._tempTimeout).forEach(timer => timer && clearTimeout(timer));
        this._tempTimeout = {};
    }

    browseFoldersCb(foldersList: string[], newFoldersNotNull: Folders, cb: (folders: Folders) => void): void {
        if (!foldersList?.length) {
            cb(newFoldersNotNull);
        } else {
            const folder = foldersList.shift();
            if (folder) {
                void this.browseFolder(folder, newFoldersNotNull)
                    .catch((e: Error) => console.error(`Cannot read folder ${folder}: ${e.message}`))
                    .then(() => {
                        setTimeout(() => this.browseFoldersCb(foldersList, newFoldersNotNull, cb), 0);
                    });
            } else {
                setTimeout(() => this.browseFoldersCb(foldersList, newFoldersNotNull, cb), 0);
            }
        }
    }

    browseFolders(foldersList: string[], _newFolders?: Folders | null): Promise<Folders> {
        let newFoldersNotNull: Folders;
        if (!_newFolders) {
            newFoldersNotNull = {};
            Object.keys(this.state.folders).forEach(folder => (newFoldersNotNull[folder] = this.state.folders[folder]));
        } else {
            newFoldersNotNull = _newFolders;
        }

        if (!foldersList?.length) {
            return Promise.resolve(newFoldersNotNull);
        }
        return new Promise(resolve => {
            this.browseFoldersCb(foldersList, newFoldersNotNull, resolve);
        });
    }

    readDirSerial(adapter: string, relPath: string): Promise<ioBroker.ReadDirResult[]> {
        return new Promise((resolve, reject) => {
            if (this.browseList) {
                // if component still mounted
                this.browseList.push({
                    resolve: resolve as unknown as (files: ioBroker.ReadDirResult[]) => void,
                    reject,
                    adapter,
                    relPath,
                });
                if (!this.browseListRunning) {
                    this.processBrowseList();
                }
            }
        });
    }

    processBrowseList(level: number = 0): void {
        if (!this.browseListRunning && this.browseList && this.browseList.length) {
            this.browseListRunning = true;
            if (this.browseList.length > 10) {
                // not too often
                if (!(this.browseList.length % 10)) {
                    this.setState({ queueLength: this.browseList.length });
                }
            } else {
                this.setState({ queueLength: this.browseList.length });
            }

            this.browseList[0].processing = true;
            this.props.socket
                .readDir(this.browseList[0].adapter, this.browseList[0].relPath as string)
                .then(files => {
                    if (this.browseList) {
                        // if component still mounted
                        const item = this.browseList.shift();
                        if (item) {
                            const resolve = item.resolve;
                            item.resolve = null;
                            item.reject = null;
                            item.adapter = null;
                            item.relPath = null;
                            if (resolve) {
                                resolve(files);
                            }
                            this.browseListRunning = false;
                            if (this.browseList.length) {
                                if (level < 5) {
                                    this.processBrowseList(level + 1);
                                } else {
                                    setTimeout(() => this.processBrowseList(0), 0);
                                }
                            } else {
                                this.setState({ queueLength: 0 });
                            }
                        } else {
                            this.setState({ queueLength: 0 });
                        }
                    }
                })
                .catch(e => {
                    if (this.browseList) {
                        // if component still mounted
                        const item = this.browseList.shift();
                        if (item) {
                            const reject = item.reject;
                            item.resolve = null;
                            item.reject = null;
                            item.adapter = null;
                            item.relPath = null;
                            if (reject) {
                                reject(e);
                            }
                            this.browseListRunning = false;
                            if (this.browseList.length) {
                                if (level < 5) {
                                    this.processBrowseList(level + 1);
                                } else {
                                    setTimeout(() => this.processBrowseList(0), 0);
                                }
                            } else {
                                this.setState({ queueLength: 0 });
                            }
                        } else {
                            this.setState({ queueLength: 0 });
                        }
                    }
                });
        }
    }

    async browseFolder(
        folderId: string,
        _newFolders?: Folders | null,
        _checkEmpty?: boolean,
        force?: boolean,
    ): Promise<Folders> {
        let newFoldersNotNull: Folders;
        if (!_newFolders) {
            newFoldersNotNull = {};
            Object.keys(this.state.folders).forEach(folder => {
                newFoldersNotNull[folder] = this.state.folders[folder];
            });
        } else {
            newFoldersNotNull = _newFolders;
        }

        if (newFoldersNotNull[folderId] && !force) {
            if (!_checkEmpty) {
                return new Promise((resolve, reject) => {
                    Promise.all(
                        newFoldersNotNull[folderId]
                            .filter(item => item.folder)
                            .map(item => this.browseFolder(item.id, newFoldersNotNull, true).catch(() => undefined)),
                    )
                        .then(() => resolve(newFoldersNotNull))
                        .catch(error => reject(new Error(error)));
                });
            }

            return Promise.resolve(newFoldersNotNull);
        }

        // if root folder
        if (!folderId || folderId === '/') {
            try {
                let objs = (await this.props.socket.readMetaItems()) as MetaObject[];
                const _folders: FolderOrFileItem[] = [];
                let userData = null;

                if (this.state.restrictToFolder) {
                    const adapter = this.state.restrictToFolder.split('/')[0];
                    objs = objs.filter(obj => obj._id === adapter);
                } else if (!this.state.expertMode) {
                    // load only adapter.admin and not other meta files like hm-rpc.0.devices.blablabla
                    objs = objs.filter(obj => !obj._id.endsWith('.admin'));
                }

                const pos = objs.findIndex(obj => obj._id === 'system.meta.uuid');
                if (pos !== -1) {
                    objs.splice(pos, 1);
                }

                objs.forEach(obj => {
                    if (this.limitToObjectID && this.limitToObjectID !== obj._id) {
                        return;
                    }

                    const item: FolderOrFileItem = {
                        id: obj._id,
                        name: obj._id,
                        title: (obj.common && obj.common.name) || obj._id,
                        meta: true,
                        from: obj.from,
                        ts: obj.ts,
                        color: obj.common && obj.common.color,
                        icon: obj.common && obj.common.icon,
                        folder: true,
                        acl: obj.acl,
                        level: 0,
                    };

                    if (item.id === USER_DATA) {
                        // user data must be first
                        userData = item;
                    } else {
                        _folders.push(item);
                    }
                });

                _folders.sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
                if (!this.limitToObjectID || this.limitToObjectID === USER_DATA) {
                    if (userData) {
                        _folders.unshift(userData);
                    }
                }

                newFoldersNotNull[folderId || '/'] = _folders;

                if (!_checkEmpty) {
                    return Promise.all(
                        _folders
                            .filter(item => item.folder)
                            .map(item => this.browseFolder(item.id, newFoldersNotNull, true).catch(() => undefined)),
                    ).then(() => newFoldersNotNull);
                }
            } catch (e: unknown) {
                const knownError = e as Error;
                if (this.initialReadFinished) {
                    window.alert(`Cannot read meta items: ${knownError.message}`);
                }
                newFoldersNotNull[folderId || '/'] = [];
            }
            return newFoldersNotNull;
        }

        const parts = folderId.split('/');
        const level = parts.length;
        const adapter = parts.shift();
        const relPath = parts.join('/');

        // make all requests here serial
        let files: ioBroker.ReadDirResult[];
        try {
            files = await this.readDirSerial(adapter || '', relPath);
        } catch (error: unknown) {
            // work around: 0_userdata.0 is a special folder, that should exist event when other folders and itself do not exit, as the browser shows it anyway.
            if (error === 'Not exists' && adapter === '0_userdata.0') {
                files = [];
            } else {
                throw error;
            }
        }
        try {
            const _folders: FolderOrFileItem[] = [];

            files.forEach(file => {
                const item: FolderOrFileItem = {
                    id: `${folderId}/${file.file}`,
                    ext: Utils.getFileExtension(file.file),
                    folder: file.isDir,
                    name: file.file,
                    size: file.stats?.size,
                    modified: file.modifiedAt,
                    acl: file.acl,
                    level,
                };

                if (this.state.restrictToFolder) {
                    if (
                        item.folder &&
                        (item.id.startsWith(`${this.state.restrictToFolder}/`) ||
                            item.id === this.state.restrictToFolder ||
                            this.state.restrictToFolder.startsWith(`${item.id}/`))
                    ) {
                        _folders.push(item);
                    } else if (item.id.startsWith(`${this.state.restrictToFolder}/`)) {
                        _folders.push(item);
                    }
                } else if (this.limitToPath) {
                    if (
                        item.folder &&
                        (item.id.startsWith(`${this.limitToPath}/`) ||
                            item.id === this.limitToPath ||
                            this.limitToPath.startsWith(`${item.id}/`))
                    ) {
                        _folders.push(item);
                    } else if (item.id.startsWith(`${this.limitToPath}/`)) {
                        _folders.push(item);
                    }
                } else {
                    _folders.push(item);
                }
            });

            _folders.sort(sortFolders);
            newFoldersNotNull[folderId] = _folders;

            if (!_checkEmpty) {
                return Promise.all(
                    _folders
                        .filter(item => item.folder)
                        .map(item => this.browseFolder(item.id, newFoldersNotNull, true)),
                ).then(() => newFoldersNotNull);
            }
        } catch (e: unknown) {
            const knownError = e as Error;
            if (this.initialReadFinished) {
                window.alert(`Cannot read ${adapter}${relPath ? `/${relPath}` : ''}: ${knownError?.message}`);
            }
            newFoldersNotNull[folderId] = [];
        }

        return newFoldersNotNull;
    }

    toggleFolder(item: FolderOrFileItem, e: React.MouseEvent): void {
        e?.stopPropagation();
        const expanded = [...this.state.expanded];
        const pos = expanded.indexOf(item.id);
        if (pos === -1) {
            expanded.push(item.id);
            expanded.sort();

            this.localStorage.setItem('files.expanded', JSON.stringify(expanded));

            if (!item.temp) {
                this.browseFolder(item.id)
                    .then(folders => this.setState({ expanded, folders }))
                    .catch(err =>
                        window.alert(
                            err === NOT_FOUND
                                ? this.props.t('ra_Cannot find "%s"', item.id)
                                : this.props.t('ra_Cannot read "%s"', item.id),
                        ),
                    );
            } else {
                this.setState({ expanded });
            }
        } else {
            expanded.splice(pos, 1);
            this.localStorage.setItem('files.expanded', JSON.stringify(expanded));
            this.setState({ expanded });
        }
    }

    onFileChange = (id: string, fileName: string, size: number | null): void => {
        const key = `${id}/${fileName}`;
        const pos = key.lastIndexOf('/');
        const folder = key.substring(0, pos);
        console.log(`File changed ${key}[${size}]`);

        if (this.state.folders[folder]) {
            if (this._tempTimeout[folder]) {
                clearTimeout(this._tempTimeout[folder]);
            }

            this._tempTimeout[folder] = setTimeout(() => {
                delete this._tempTimeout[folder];

                this.browseFolder(folder, null, false, true)
                    .then(folders => this.setState({ folders }))
                    .catch(e => console.error(`Cannot read folder: ${e.message}`));
            }, 300);
        }
    };

    changeFolder(e: React.MouseEvent<HTMLDivElement>, folder?: string): void {
        e?.stopPropagation();

        this.lastSelect = Date.now();

        let _folder = folder || getParentDir(this.state.currentDir);

        if (_folder === '/') {
            _folder = '';
        }

        this.localStorage.setItem('files.currentDir', _folder);

        if (folder && e && (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey)) {
            this.setState({ selected: _folder });
            return;
        }

        // If desired folder is not yet loaded
        if (_folder && !this.state.folders[_folder]) {
            this.browseFolder(_folder)
                .then(folders =>
                    this.setState(
                        {
                            folders,
                            path: _folder,
                            currentDir: _folder,
                            selected: _folder,
                            pathFocus: false,
                        },
                        () => this.props.onSelect && this.props.onSelect(''),
                    ),
                )
                .catch(_e => console.error(`Cannot read folder: ${_e.message}`));
            return;
        }

        this.setState(
            {
                currentDir: _folder,
                selected: _folder,
                path: _folder,
                pathFocus: false,
            },
            () => this.props.onSelect && this.props.onSelect(''),
        );
    }

    select(id: string, e?: React.MouseEvent<HTMLDivElement> | null, cb?: () => void): void {
        if (e) {
            e.stopPropagation();
        }
        this.lastSelect = Date.now();

        this.localStorage.setItem('files.selected', id);

        this.setState({ selected: id, path: id, pathFocus: false }, () => {
            if (this.props.onSelect) {
                const ext = Utils.getFileExtension(id);
                if (
                    (!this.props.filterFiles || (ext && this.props.filterFiles.includes(ext))) &&
                    (!this.state.filterByType ||
                        (ext && (EXTENSIONS as Record<string, string[]>)[this.state.filterByType].includes(ext)))
                ) {
                    this.props.onSelect(id, false, !!this.state.folders[id]);
                } else {
                    this.props.onSelect('');
                }
            }
            if (cb) {
                cb();
            }
        });
    }

    getText(text?: ioBroker.StringOrTranslated | null): string | undefined {
        if (text) {
            if (typeof text === 'object') {
                return text[this.props.lang] || text.en || undefined;
            }
            return text;
        }
        return undefined;
    }

    renderFolder(item: FolderOrFileItem, expanded?: boolean): JSX.Element | null {
        if (
            this.state.viewType === TABLE &&
            this.state.filterEmpty &&
            (!this.state.folders[item.id] || !this.state.folders[item.id].length) &&
            item.id !== USER_DATA &&
            !item.temp
        ) {
            return null;
        }
        const IconEl = expanded ? IconOpen : IconClosed;
        const padding = this.state.viewType === TABLE ? item.level * this.levelPadding : 0;
        const isUserData = item.name === USER_DATA;
        const isSpecialData = isUserData || item.name === 'vis.0' || item.name === 'vis-2.0';

        const iconStyle = Utils.getStyle(
            this.props.theme,
            styles[`itemFolderIcon${this.state.viewType}`],
            isSpecialData && styles.specialFolder,
        );
        return (
            <Box
                component="div"
                key={item.id}
                id={item.id}
                style={this.state.viewType === TABLE ? { marginLeft: padding, width: `calc(100% - ${padding}px` } : {}}
                onClick={e => (this.state.viewType === TABLE ? this.select(item.id, e) : this.changeFolder(e, item.id))}
                onDoubleClick={e => this.state.viewType === TABLE && this.toggleFolder(item, e)}
                title={this.getText(item.title)}
                className="browserItem"
                sx={Utils.getStyle(
                    this.props.theme,
                    styles[`item${this.state.viewType}`],
                    styles[`itemFolder${this.state.viewType}`],
                    this.state.selected === item.id ? styles.itemSelected : {},
                    item.temp ? styles.itemFolderTemp : {},
                )}
            >
                <IconEl
                    style={iconStyle}
                    onClick={
                        this.state.viewType === TABLE ? (e: React.MouseEvent) => this.toggleFolder(item, e) : undefined
                    }
                />

                <Box
                    component="div"
                    sx={Utils.getStyle(
                        this.props.theme,
                        styles[`itemName${this.state.viewType}`],
                        styles[`itemNameFolder${this.state.viewType}`],
                    )}
                >
                    {isUserData ? this.props.t('ra_User files') : item.name}
                </Box>

                <Box
                    component="div"
                    style={styles[`itemSize${this.state.viewType}`]}
                    sx={{ display: { md: 'inline-block', sm: 'none' } }}
                >
                    {this.state.viewType === TABLE && this.state.folders[item.id]
                        ? this.state.folders[item.id].length
                        : ''}
                </Box>

                <Box
                    component="div"
                    sx={{ display: { md: 'inline-block', sm: 'none' } }}
                >
                    {this.state.viewType === TABLE && this.props.expertMode ? this.formatAcl(item.acl) : null}
                </Box>

                {this.state.viewType === TABLE && this.props.expertMode ? (
                    <Box
                        component="div"
                        sx={{ ...styles.itemDeleteButtonTable, display: { md: 'inline-block', sm: 'none' } }}
                    />
                ) : null}

                {this.state.viewType === TABLE && this.props.allowDownload ? (
                    <div style={styles[`itemDownloadEmpty${this.state.viewType}`]} />
                ) : null}

                {this.state.viewType === TABLE &&
                this.props.allowDelete &&
                this.state.folders[item.id] &&
                this.state.folders[item.id].length ? (
                    <IconButton
                        aria-label="delete"
                        onClick={e => {
                            e.stopPropagation();
                            if (this.suppressDeleteConfirm > Date.now()) {
                                this.deleteItem(item.id);
                            } else {
                                this.setState({ deleteItem: item.id });
                            }
                        }}
                        sx={styles[`itemDeleteButton${this.state.viewType}`]}
                        size="large"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                ) : this.state.viewType === TABLE && this.props.allowDelete ? (
                    <Box
                        component="div"
                        sx={styles[`itemDeleteButton${this.state.viewType}`]}
                    />
                ) : null}
            </Box>
        );
    }

    renderBackFolder(): JSX.Element {
        return (
            <Box
                component="div"
                key={this.state.currentDir}
                id={this.state.currentDir}
                onClick={e => this.changeFolder(e)}
                title={this.props.t('ra_Back to %s', getParentDir(this.state.currentDir))}
                className="browserItem"
                sx={Utils.getStyle(
                    this.props.theme,
                    styles[`item${this.state.viewType}`],
                    styles[`itemFolder${this.state.viewType}`],
                )}
            >
                <IconClosed style={Utils.getStyle(this.props.theme, styles[`itemFolderIcon${this.state.viewType}`])} />
                <IconBack sx={styles.itemFolderIconBack} />

                <Box
                    component="div"
                    sx={Utils.getStyle(
                        this.props.theme,
                        styles[`itemName${this.state.viewType}`],
                        styles[`itemNameFolder${this.state.viewType}`],
                    )}
                >
                    ..
                </Box>
            </Box>
        );
    }

    formatSize(size: number | null | undefined): JSX.Element {
        return (
            <div style={styles[`itemSize${this.state.viewType}`]}>
                {size || size === 0 ? Utils.formatBytes(size) : ''}
            </div>
        );
    }

    formatAcl(acl: ioBroker.EvaluatedFileACL | MetaACL | undefined): JSX.Element {
        const access: number = acl ? (acl as ioBroker.EvaluatedFileACL).permissions || (acl as MetaACL).file : 0;
        let accessStr: string;
        if (access) {
            accessStr = access.toString(16).padStart(3, '0');
        } else {
            accessStr = '';
        }

        return (
            <div style={styles[`itemAccess${this.state.viewType}`]}>
                {this.props.modalEditOfAccessControl ? (
                    <IconButton
                        size="large"
                        onClick={() => this.setState({ modalEditOfAccess: true })}
                        sx={styles[`itemAclButton${this.state.viewType}`]}
                    >
                        {accessStr || '---'}
                    </IconButton>
                ) : (
                    accessStr || '---'
                )}
            </div>
        );
    }

    getFileIcon(ext: string | null): JSX.Element {
        switch (ext) {
            case 'json':
            case 'json5':
                return <JsonIcon style={styles[`itemIcon${this.state.viewType}`]} />;

            case 'css':
                return <CssIcon style={styles[`itemIcon${this.state.viewType}`]} />;

            case 'js':
            case 'ts':
                return <JSIcon style={styles[`itemIcon${this.state.viewType}`]} />;

            case 'html':
            case 'md':
                return <HtmlIcon style={styles[`itemIcon${this.state.viewType}`]} />;

            case 'mp3':
            case 'ogg':
            case 'wav':
            case 'm4a':
            case 'mp4':
            case 'flac':
                return <MusicIcon style={styles[`itemIcon${this.state.viewType}`]} />;

            default:
                return <FileIcon style={styles[`itemIcon${this.state.viewType}`]} />;
        }
    }

    static getEditFile(ext: string | null): boolean {
        switch (ext) {
            case 'json':
            case 'json5':
            case 'js':
            case 'html':
            case 'txt':
            case 'css':
            case 'log':
                return true;
            default:
                return false;
        }
    }

    setStateBackgroundImage = (): void => {
        const array = ['light', 'dark', 'colored', 'delete'];
        this.setState(({ backgroundImage }) => {
            if (
                backgroundImage &&
                array.indexOf(backgroundImage) !== -1 &&
                array.length - 1 !== array.indexOf(backgroundImage)
            ) {
                this.localStorage.setItem('files.backgroundImage', array[array.indexOf(backgroundImage) + 1]);
                return { backgroundImage: array[array.indexOf(backgroundImage) + 1] };
            }
            this.localStorage.setItem('files.backgroundImage', array[0]);
            return { backgroundImage: array[0] };
        });
    };

    getStyleBackgroundImage = (): React.CSSProperties | null => {
        // ['light', 'dark', 'colored', 'delete']
        switch (this.state.backgroundImage) {
            case 'light':
                return styles.backgroundImageLight;
            case 'dark':
                return styles.backgroundImageDark;
            case 'colored':
                return styles.backgroundImageColored;
            case 'delete':
                return null;
            default:
                return null;
        }
    };

    renderFile(item: FolderOrFileItem): JSX.Element {
        const padding = this.state.viewType === TABLE ? item.level * this.levelPadding : 0;
        const ext = Utils.getFileExtension(item.name);

        return (
            <Box
                component="div"
                key={item.id}
                id={item.id}
                onDoubleClick={e => {
                    e.stopPropagation();
                    if (!this.props.onSelect) {
                        this.setState({ viewer: this.imagePrefix + item.id, formatEditFile: ext });
                    } else if (
                        (!this.props.filterFiles || (item.ext && this.props.filterFiles.includes(item.ext))) &&
                        (!this.state.filterByType ||
                            (item.ext &&
                                (EXTENSIONS as Record<string, string[]>)[this.state.filterByType].includes(item.ext)))
                    ) {
                        this.props.onSelect(item.id, true, !!this.state.folders[item.id]);
                    }
                }}
                onClick={e => this.select(item.id, e)}
                style={this.state.viewType === TABLE ? { marginLeft: padding, width: `calc(100% - ${padding}px)` } : {}}
                className="browserItem"
                sx={Utils.getStyle(
                    this.props.theme,
                    styles[`item${this.state.viewType}`],
                    styles[`itemFile${this.state.viewType}`],
                    this.state.selected === item.id ? styles.itemSelected : undefined,
                )}
            >
                {ext && EXTENSIONS.images.includes(ext) ? (
                    this.state.fileErrors.includes(item.id) ? (
                        <IconNoIcon
                            style={{
                                ...styles[`itemImage${this.state.viewType}`],
                                ...this.getStyleBackgroundImage(),
                                ...styles[`itemNoImage${this.state.viewType}`],
                            }}
                        />
                    ) : (
                        <Icon
                            onError={e => {
                                (e.target as HTMLImageElement).onerror = null;
                                const fileErrors = [...this.state.fileErrors];
                                if (!fileErrors.includes(item.id)) {
                                    fileErrors.push(item.id);
                                    this.setState({ fileErrors });
                                }
                            }}
                            style={{ ...styles[`itemImage${this.state.viewType}`], ...this.getStyleBackgroundImage() }}
                            src={this.imagePrefix + item.id}
                            alt={item.name}
                        />
                    )
                ) : (
                    this.getFileIcon(ext)
                )}
                <Box
                    component="div"
                    sx={styles[`itemName${this.state.viewType}`]}
                >
                    {item.name}
                </Box>
                <Box
                    component="div"
                    sx={{ display: { md: 'inline-block', sm: 'none' } }}
                >
                    {this.formatSize(item.size)}
                </Box>
                <Box
                    component="div"
                    sx={{ display: { md: 'inline-block', sm: 'none' } }}
                >
                    {this.state.viewType === TABLE && this.props.expertMode ? this.formatAcl(item.acl) : null}
                </Box>
                <Box
                    component="div"
                    sx={{ display: { md: 'inline-block', sm: 'none' } }}
                >
                    {this.state.viewType === TABLE && this.props.expertMode && FileBrowserClass.getEditFile(ext) ? (
                        <IconButton
                            aria-label="edit"
                            onClick={e => {
                                e.stopPropagation();
                                if (!this.props.onSelect) {
                                    this.setState({ viewer: this.imagePrefix + item.id, formatEditFile: ext });
                                } else if (
                                    (!this.props.filterFiles ||
                                        (item.ext && this.props.filterFiles.includes(item.ext))) &&
                                    (!this.state.filterByType ||
                                        (item.ext &&
                                            (EXTENSIONS as Record<string, string[]>)[this.state.filterByType].includes(
                                                item.ext,
                                            )))
                                ) {
                                    this.props.onSelect(item.id, true, !!this.state.folders[item.id]);
                                }
                            }}
                            sx={styles.itemDeleteButtonTable}
                            size="large"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    ) : (
                        <Box
                            component="div"
                            sx={styles[`itemDeleteButton${this.state.viewType}`]}
                        />
                    )}
                </Box>
                {this.state.viewType === TABLE && this.props.allowDownload ? (
                    <Box
                        component="a"
                        className="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge"
                        sx={styles.itemDownloadButtonTable}
                        tabIndex={0}
                        download={item.id}
                        href={this.imagePrefix + item.id}
                        onClick={e => e.stopPropagation()}
                    >
                        <DownloadIcon />
                    </Box>
                ) : null}

                {this.state.viewType === TABLE &&
                this.props.allowDelete &&
                item.id !== 'vis.0/' &&
                item.id !== 'vis-2.0/' &&
                item.id !== USER_DATA ? (
                    <IconButton
                        aria-label="delete"
                        onClick={e => {
                            e.stopPropagation();
                            if (this.suppressDeleteConfirm > Date.now()) {
                                this.deleteItem(item.id);
                            } else {
                                this.setState({ deleteItem: item.id });
                            }
                        }}
                        sx={styles[`itemDeleteButton${this.state.viewType}`]}
                        size="large"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                ) : this.state.viewType === TABLE && this.props.allowDelete ? (
                    <Box
                        component="div"
                        sx={styles[`itemDeleteButton${this.state.viewType}`]}
                    />
                ) : null}
            </Box>
        );
    }

    renderItems(folderId: string): JSX.Element | (JSX.Element | null)[] {
        if (this.state.folders && this.state.folders[folderId]) {
            // tile
            if (this.state.viewType === TILE) {
                const res: (JSX.Element | null)[] = [];
                if (folderId && folderId !== '/') {
                    res.push(this.renderBackFolder());
                }
                this.state.folders[folderId].forEach(item => {
                    if (item.folder) {
                        res.push(this.renderFolder(item));
                    } else if (
                        (!this.props.filterFiles || (item.ext && this.props.filterFiles.includes(item.ext))) &&
                        (!this.state.filterByType ||
                            (item.ext &&
                                (EXTENSIONS as Record<string, string[]>)[this.state.filterByType].includes(item.ext)))
                    ) {
                        res.push(this.renderFile(item));
                    }
                });
                return res;
            }

            const totalResult: (JSX.Element | null)[] = [];
            this.state.folders[folderId].forEach(item => {
                if (item.folder) {
                    const expanded = this.state.expanded.includes(item.id);

                    const folders = this.renderFolder(item, expanded);
                    if (Array.isArray(folders)) {
                        folders.forEach(folder => totalResult.push(folder));
                    } else {
                        totalResult.push(folders);
                    }
                    if (this.state.folders[item.id] && expanded) {
                        const items = this.renderItems(item.id);
                        if (Array.isArray(items)) {
                            items.forEach(_item => totalResult.push(_item));
                        } else {
                            totalResult.push(items);
                        }
                    }
                } else if (
                    (!this.props.filterFiles || (item.ext && this.props.filterFiles.includes(item.ext))) &&
                    (!this.state.filterByType ||
                        (item.ext &&
                            (EXTENSIONS as Record<string, string[]>)[this.state.filterByType].includes(item.ext)))
                ) {
                    totalResult.push(this.renderFile(item));
                }
            });

            return totalResult;
        }

        return (
            <div style={{ position: 'relative' }}>
                <CircularProgress
                    key={folderId}
                    color="secondary"
                    size={24}
                />
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 2,
                        top: 4,
                        width: 24,
                        textAlign: 'center',
                    }}
                >
                    {this.state.queueLength}
                </div>
            </div>
        );
    }

    renderToolbar(): JSX.Element {
        const IconType: React.FC<{ fontSize?: 'small' }> | null = this.props.showTypeSelector
            ? FILE_TYPE_ICONS[this.state.filterByType || 'all'] || FILE_TYPE_ICONS.all
            : null;

        const isInFolder = this.findFirstFolder(this.state.selected);

        return (
            <Toolbar
                key="toolbar"
                variant="dense"
            >
                {this.props.allowNonRestricted && this.props.restrictToFolder ? (
                    <IconButton
                        edge="start"
                        title={
                            this.state.restrictToFolder
                                ? this.props.t('ra_Show all folders')
                                : this.props.t('ra_Restrict to folder')
                        }
                        style={{
                            ...styles.menuButton,
                            ...(this.state.restrictToFolder ? styles.menuButtonRestrictActive : undefined),
                        }}
                        aria-label="restricted to folder"
                        onClick={() =>
                            this.setState({
                                restrictToFolder:
                                    (this.state.restrictToFolder ? '' : this.props.restrictToFolder) || '',
                                loadAllFolders: true,
                            })
                        }
                        size="small"
                    >
                        <RestrictedIcon fontSize="small" />
                    </IconButton>
                ) : null}
                {this.props.showExpertButton ? (
                    <IconButton
                        edge="start"
                        title={this.props.t('ra_Toggle expert mode')}
                        style={{
                            ...styles.menuButton,
                            ...(this.state.expertMode ? styles.menuButtonExpertActive : undefined),
                        }}
                        aria-label="expert mode"
                        onClick={() => this.setState({ expertMode: !this.state.expertMode })}
                        size="small"
                    >
                        <IconExpert />
                    </IconButton>
                ) : null}
                {this.props.showViewTypeButton ? (
                    <IconButton
                        edge="start"
                        title={this.props.t('ra_Toggle view mode')}
                        style={styles.menuButton}
                        aria-label="view mode"
                        onClick={() => {
                            const viewType = this.state.viewType === TABLE ? TILE : TABLE;
                            this.localStorage.setItem('files.viewType', viewType);
                            let currentDir = this.state.selected;
                            if (isFile(currentDir)) {
                                currentDir = getParentDir(currentDir);
                            }
                            this.setState({ viewType, currentDir }, () => {
                                if (this.state.viewType === TABLE) {
                                    this.scrollToSelected();
                                }
                            });
                        }}
                        size="small"
                    >
                        {this.state.viewType !== TABLE ? <IconList fontSize="small" /> : <IconTile fontSize="small" />}
                    </IconButton>
                ) : null}
                <IconButton
                    edge="start"
                    title={this.props.t('ra_Hide empty folders')}
                    style={styles.menuButton}
                    color={this.state.filterEmpty ? 'secondary' : 'inherit'}
                    aria-label="filter empty"
                    onClick={() => {
                        this.localStorage.setItem('file.empty', this.state.filterEmpty ? 'false' : 'true');
                        this.setState({ filterEmpty: !this.state.filterEmpty });
                    }}
                    size="small"
                >
                    <EmptyFilterIcon fontSize="small" />
                </IconButton>
                <IconButton
                    edge="start"
                    title={this.props.t('ra_Reload files')}
                    style={styles.menuButton}
                    color="inherit"
                    aria-label="reload files"
                    onClick={() => this.setState({ folders: {} }, () => this.loadFolders())}
                    size="small"
                >
                    <RefreshIcon fontSize="small" />
                </IconButton>
                {this.props.allowCreateFolder ? (
                    <IconButton
                        edge="start"
                        disabled={
                            !this.state.selected ||
                            !isInFolder ||
                            (!!this.limitToPath &&
                                !this.state.selected.startsWith(`${this.limitToPath}/`) &&
                                this.limitToPath !== this.state.selected)
                        }
                        title={this.props.t('ra_Create folder')}
                        style={styles.menuButton}
                        color="inherit"
                        aria-label="add folder"
                        onClick={() => this.setState({ addFolder: true })}
                        size="small"
                    >
                        <AddFolderIcon fontSize="small" />
                    </IconButton>
                ) : null}
                {this.props.allowUpload ? (
                    <IconButton
                        edge="start"
                        disabled={
                            !this.state.selected ||
                            !isInFolder ||
                            (!!this.limitToPath &&
                                !this.state.selected.startsWith(`${this.limitToPath}/`) &&
                                this.limitToPath !== this.state.selected)
                        }
                        title={this.props.t('ra_Upload file')}
                        style={styles.menuButton}
                        color="inherit"
                        aria-label="upload file"
                        onClick={() => this.setState({ uploadFile: true })}
                        size="small"
                    >
                        <UploadIcon fontSize="small" />
                    </IconButton>
                ) : null}
                {this.props.showTypeSelector && IconType ? (
                    <Tooltip
                        title={this.props.t('ra_Filter files')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <IconButton
                            size="small"
                            onClick={e => this.setState({ showTypesMenu: e.target as HTMLButtonElement })}
                        >
                            <IconType fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : null}
                {this.state.showTypesMenu ? (
                    <Menu
                        open={!0}
                        anchorEl={this.state.showTypesMenu}
                        onClose={() => this.setState({ showTypesMenu: null })}
                    >
                        {Object.keys(FILE_TYPE_ICONS).map(type => {
                            const MyIcon: React.FC<{ fontSize?: 'small' }> = FILE_TYPE_ICONS[type];
                            return (
                                <MenuItem
                                    key={type}
                                    selected={this.state.filterByType === type}
                                    onClick={() => {
                                        if (type === 'all') {
                                            this.localStorage.removeItem('files.filterByType');
                                            this.setState({ filterByType: '', showTypesMenu: null });
                                        } else {
                                            this.localStorage.setItem('files.filterByType', type);
                                            this.setState({ filterByType: type, showTypesMenu: null });
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <MyIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>{this.props.t(`ra_fileType_${type}`)}</ListItemText>
                                </MenuItem>
                            );
                        })}
                    </Menu>
                ) : null}
                <Tooltip
                    title={this.props.t('ra_Background image')}
                    slotProps={{ popper: { sx: styles.tooltip } }}
                >
                    <IconButton
                        color="inherit"
                        edge="start"
                        style={styles.menuButton}
                        onClick={this.setStateBackgroundImage}
                        size="small"
                    >
                        <Brightness5Icon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {this.state.viewType !== TABLE && this.props.allowDelete ? (
                    <Tooltip
                        title={this.props.t('ra_Delete')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <span>
                            <IconButton
                                aria-label="delete"
                                disabled={
                                    !this.state.selected ||
                                    this.state.selected === 'vis.0/' ||
                                    this.state.selected === 'vis-2.0/' ||
                                    this.state.selected === USER_DATA
                                }
                                color="inherit"
                                edge="start"
                                style={styles.menuButton}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (this.suppressDeleteConfirm > Date.now()) {
                                        this.deleteItem(this.state.selected);
                                    } else {
                                        this.setState({ deleteItem: this.state.selected });
                                    }
                                }}
                                size="small"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                ) : null}
            </Toolbar>
        );
    }

    findItem(id: string, folders?: Folders | null): null | FolderOrFileItem {
        folders = folders || this.state.folders;
        if (!folders) {
            return null;
        }
        const parts = id.split('/');
        parts.pop();
        const parentFolder = parts.join('/') || '/';
        if (!folders[parentFolder]) {
            return null;
        }
        return folders[parentFolder].find(item => item.id === id) || null;
    }

    renderInputDialog(): JSX.Element | null {
        if (this.state.addFolder) {
            const parentFolder = this.findFirstFolder(this.state.selected);

            if (!parentFolder) {
                window.alert(this.props.t('ra_Invalid parent folder!'));
                return null;
            }

            return (
                <DialogTextInput
                    key="inputDialog"
                    applyText={this.props.t('ra_Create')}
                    cancelText={this.props.t('ra_Cancel')}
                    titleText={this.props.t('ra_Create new folder in %s', this.state.selected)}
                    promptText={this.props.t(
                        'ra_If no file will be created in the folder, it will disappear after the browser closed',
                    )}
                    labelText={this.props.t('ra_Folder name')}
                    verify={(text: string) =>
                        this.state.folders[parentFolder].find(item => item.name === text)
                            ? ''
                            : this.props.t('ra_Duplicate name')
                    }
                    onClose={(name: string | null) => {
                        if (name) {
                            const folders: Folders = {};
                            Object.keys(this.state.folders).forEach(
                                folder => (folders[folder] = this.state.folders[folder]),
                            );
                            const parent = this.findItem(parentFolder);
                            const id = `${parentFolder}/${name}`;
                            folders[parentFolder].push({
                                id,
                                level: (parent?.level || 0) + 1,
                                name,
                                folder: true,
                                temp: true,
                            });

                            folders[parentFolder].sort(sortFolders);

                            folders[id] = [];
                            const expanded = [...this.state.expanded];
                            if (!expanded.includes(parentFolder)) {
                                expanded.push(parentFolder);
                                expanded.sort();
                            }
                            this.localStorage.setItem('files.expanded', JSON.stringify(expanded));
                            this.setState({ addFolder: false, folders, expanded }, () => this.select(id));
                        } else {
                            this.setState({ addFolder: false });
                        }
                    }}
                    replace={(text: string) => text.replace(/[^-_\w]/, '_')}
                />
            );
        }
        return null;
    }

    componentDidUpdate(/* prevProps , prevState, snapshot */): void {
        if (this.setOpacityTimer) {
            clearTimeout(this.setOpacityTimer);
        }
        this.setOpacityTimer = setTimeout(() => {
            this.setOpacityTimer = null;
            const items = window.document.getElementsByClassName('browserItem');
            for (let i = 0; i < items.length; i++) {
                (items[i] as HTMLElement).style.opacity = '1';
            }
        }, 100);
    }

    findFirstFolder(id: string): string | null {
        let parentFolder = id;
        const item = this.findItem(parentFolder);
        // find folder
        if (item && !item.folder) {
            const parts = parentFolder.split('/');
            parts.pop();
            parentFolder = '';
            while (parts.length) {
                const _item = this.findItem(parts.join('/'));
                if (_item?.folder) {
                    parentFolder = parts.join('/');
                    break;
                }
                parts.pop();
            }
            if (!parts.length) {
                return null;
            }
        }

        return parentFolder;
    }

    async uploadFile(fileName: string, data: string): Promise<void> {
        const parts: string[] = fileName.split('/');
        const adapterName = parts.shift();
        try {
            await this.props.socket.writeFile64(adapterName || '', parts.join('/'), data);
        } catch (e: unknown) {
            const knownError = e as Error;
            window.alert(`Cannot write file: ${knownError?.message}`);
        }
    }

    renderUpload(): JSX.Element[] | null {
        if (this.state.uploadFile) {
            return [
                <Fab
                    key="close"
                    color="primary"
                    aria-label="close"
                    style={styles.uploadCloseButton}
                    onClick={() => this.setState({ uploadFile: false })}
                >
                    <CloseIcon />
                </Fab>,
                <Dropzone
                    key="dropzone"
                    onDragEnter={() => this.setState({ uploadFile: 'dragging' })}
                    onDragLeave={() => this.setState({ uploadFile: true })}
                    onDrop={acceptedFiles => {
                        let count = acceptedFiles.length;

                        acceptedFiles.forEach(file => {
                            const reader = new FileReader();

                            reader.onabort = () => console.log('file reading was aborted');
                            reader.onerror = () => console.log('file reading has failed');
                            reader.onload = () => {
                                const parentFolder = this.findFirstFolder(this.state.selected);

                                if (!parentFolder) {
                                    window.alert(this.props.t('ra_Invalid parent folder!'));
                                } else {
                                    const id = `${parentFolder}/${file.name}`;

                                    void this.uploadFile(id, reader.result as string).then(() => {
                                        if (!--count) {
                                            this.setState({ uploadFile: false }, () => {
                                                if (this.supportSubscribes) {
                                                    // open current folder
                                                    const expanded = [...this.state.expanded];
                                                    if (!expanded.includes(parentFolder)) {
                                                        expanded.push(parentFolder);
                                                        expanded.sort();
                                                        this.localStorage.setItem(
                                                            'files.expanded',
                                                            JSON.stringify(expanded),
                                                        );
                                                    }
                                                    this.setState({ expanded }, () => this.select(id));
                                                } else {
                                                    setTimeout(
                                                        () =>
                                                            this.browseFolder(parentFolder, null, false, true).then(
                                                                folders => {
                                                                    // open current folder
                                                                    const expanded = [...this.state.expanded];
                                                                    if (!expanded.includes(parentFolder)) {
                                                                        expanded.push(parentFolder);
                                                                        expanded.sort();
                                                                        this.localStorage.setItem(
                                                                            'files.expanded',
                                                                            JSON.stringify(expanded),
                                                                        );
                                                                    }
                                                                    this.setState({ folders, expanded }, () =>
                                                                        this.select(id),
                                                                    );
                                                                },
                                                            ),
                                                        500,
                                                    );
                                                }
                                            });
                                        }
                                    });
                                }
                            };

                            reader.readAsArrayBuffer(file);
                        });
                    }}
                >
                    {({ getRootProps, getInputProps }) => (
                        <div
                            style={{
                                ...styles.uploadDiv,
                                ...(this.state.uploadFile === 'dragging' ? styles.uploadDivDragging : undefined),
                            }}
                            {...getRootProps()}
                        >
                            <input {...getInputProps()} />
                            <Box
                                component="div"
                                sx={styles.uploadCenterDiv}
                            >
                                <div style={styles.uploadCenterTextAndIcon}>
                                    <UploadIcon style={styles.uploadCenterIcon} />
                                    <div style={styles.uploadCenterText}>
                                        {this.state.uploadFile === 'dragging'
                                            ? this.props.t('ra_Drop file here')
                                            : this.props.t(
                                                  'ra_Place your files here or click here to open the browse dialog',
                                              )}
                                    </div>
                                </div>
                            </Box>
                        </div>
                    )}
                </Dropzone>,
            ];
        }
        return null;
    }

    deleteRecursive(id: string): Promise<void> {
        const item = this.findItem(id);
        if (item?.folder) {
            return (
                this.state.folders[id]
                    ? Promise.all(this.state.folders[id].map(_item => this.deleteRecursive(_item.id)))
                    : Promise.resolve()
            ).then(() => {
                // If it is a folder of second level
                if (item.level >= 1) {
                    const parts = id.split('/');
                    const adapter = parts.shift();
                    void this.props.socket.deleteFolder(adapter || '', parts.join('/')).then(() => {
                        // remove this folder
                        const folders = JSON.parse(JSON.stringify(this.state.folders));
                        delete folders[item.id];
                        // delete folder from parent item
                        const parentId = getParentDir(item.id);
                        const parentFolder = folders[parentId];
                        if (parentFolder) {
                            const pos = parentFolder.findIndex((f: FolderOrFileItem) => f.id === item.id);
                            if (pos !== -1) {
                                parentFolder.splice(pos, 1);
                            }

                            this.select(parentId, null, () => this.setState({ folders }));
                        }
                    });
                }
            });
        }

        const parts = id.split('/');
        const adapter = parts.shift();
        if (parts.length) {
            return this.props.socket
                .deleteFile(adapter || '', parts.join('/'))
                .catch(e => window.alert(`Cannot delete file: ${e}`));
        }
        return Promise.resolve();
    }

    deleteItem(deleteItem: string): void {
        deleteItem = deleteItem || this.state.deleteItem;

        this.setState({ deleteItem: '' }, () =>
            this.deleteRecursive(deleteItem).then(() => {
                const newState: Partial<FileBrowserState> = {};
                const pos = this.state.expanded.indexOf(deleteItem);
                if (pos !== -1) {
                    const expanded = [...this.state.expanded];
                    expanded.splice(pos, 1);
                    this.localStorage.setItem('files.expanded', JSON.stringify(expanded));
                    newState.expanded = expanded;
                }

                if (this.state.selected === deleteItem) {
                    const parts = this.state.selected.split('/');
                    parts.pop();
                    newState.selected = parts.join('/');
                }

                if (!this.supportSubscribes) {
                    const parentFolder = this.findFirstFolder(deleteItem);
                    const folders: Folders = {};

                    Object.keys(this.state.folders).forEach(name => {
                        if (name !== parentFolder && !name.startsWith(`${parentFolder}/`)) {
                            folders[name] = this.state.folders[name];
                        }
                    });

                    newState.folders = folders;

                    this.setState(newState as FileBrowserState, () =>
                        setTimeout(() => {
                            this.browseFolders([...this.state.expanded], folders)
                                .then(_folders => this.setState({ folders: _folders }))
                                .catch(e => console.error(e));
                        }, 200),
                    );
                } else {
                    this.setState(newState as FileBrowserState);
                }
            }),
        );
    }

    renderDeleteDialog(): JSX.Element | null {
        if (this.state.deleteItem) {
            return (
                <Dialog
                    key="deleteDialog"
                    open={!0}
                    onClose={() => this.setState({ deleteItem: '' })}
                    aria-labelledby="ar_dialog_file_delete_title"
                >
                    <DialogTitle id="ar_dialog_file_delete_title">
                        {this.props.t('ra_Confirm deletion of %s', this.state.deleteItem.split('/').pop() as string)}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>{this.props.t('ra_Are you sure?')}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            color="grey"
                            variant="contained"
                            onClick={() => {
                                this.suppressDeleteConfirm = Date.now() + 60000 * 5;
                                this.deleteItem('');
                            }}
                        >
                            {this.props.t('ra_Delete (no confirm for 5 mins)')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => this.deleteItem('')}
                            color="primary"
                            autoFocus
                        >
                            {this.props.t('ra_Delete')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => this.setState({ deleteItem: '' })}
                            color="grey"
                        >
                            {this.props.t('ra_Cancel')}
                        </Button>
                    </DialogActions>
                </Dialog>
            );
        }
        return null;
    }

    renderViewDialog(): JSX.Element | null {
        return this.state.viewer ? (
            <FileViewer
                supportSubscribes={this.supportSubscribes}
                key={this.state.viewer}
                href={this.state.viewer}
                formatEditFile={this.state.formatEditFile}
                themeType={this.props.themeType}
                setStateBackgroundImage={this.setStateBackgroundImage}
                getStyleBackgroundImage={this.getStyleBackgroundImage}
                t={this.props.t}
                socket={this.props.socket}
                lang={this.props.lang}
                expertMode={this.state.expertMode}
                onClose={() => this.setState({ viewer: '', formatEditFile: '' })}
            />
        ) : null;
    }

    renderError(): JSX.Element | null {
        if (this.state.errorText) {
            return (
                <DialogError
                    key="errorDialog"
                    text={this.state.errorText}
                    onClose={() => this.setState({ errorText: '' })}
                />
            );
        }
        return null;
    }

    // used in tabs/Files
    // eslint-disable-next-line react/no-unused-class-component-methods
    updateItemsAcl(info: FolderOrFileItem[]): void {
        this.cacheFolders = this.cacheFolders || JSON.parse(JSON.stringify(this.state.folders));
        let changed;

        info.forEach(it => {
            const item = this.findItem(it.id, this.cacheFolders);
            if (item && JSON.stringify(item.acl) !== JSON.stringify(it.acl)) {
                item.acl = it.acl;
                changed = true;
            }
        });
        if (changed) {
            if (this.cacheFoldersTimeout) {
                clearTimeout(this.cacheFoldersTimeout);
            }
            this.cacheFoldersTimeout = setTimeout(() => {
                this.cacheFoldersTimeout = null;
                const folders = this.cacheFolders || {};
                this.cacheFolders = null;
                this.setState({ folders });
            }, 200);
        }
    }

    changeToPath(): void {
        setTimeout(() => {
            if (this.state.path !== this.state.selected && (!this.lastSelect || Date.now() - this.lastSelect > 100)) {
                let folder = this.state.path;
                if (isFile(this.state.path)) {
                    folder = getParentDir(this.state.path);
                }
                new Promise(resolve => {
                    if (!this.state.folders[folder]) {
                        this.browseFolder(folder)
                            .then(folders => this.setState({ folders }, () => resolve(true)))
                            .catch(err =>
                                this.setState({
                                    errorText:
                                        err === NOT_FOUND
                                            ? this.props.t('ra_Cannot find "%s"', folder)
                                            : this.props.t('ra_Cannot read "%s"', folder),
                                }),
                            );
                    } else {
                        resolve(true);
                    }
                })
                    .then(
                        result =>
                            result &&
                            this.setState({ selected: this.state.path, currentDir: folder, pathFocus: false }),
                    )
                    .catch(e => console.error(e));
            } else if (!this.lastSelect || Date.now() - this.lastSelect > 100) {
                this.setState({ pathFocus: false });
            }
        }, 100);
    }

    renderBreadcrumb(): JSX.Element {
        const parts = this.state.currentDir.startsWith('/')
            ? this.state.currentDir.split('/')
            : `/${this.state.currentDir}`.split('/');
        const p: string[] = [];
        return (
            <Breadcrumbs style={{ paddingLeft: 8 }}>
                {parts.map((part, i) => {
                    if (part) {
                        p.push(part);
                    }
                    const path = p.join('/');
                    if (i < parts.length - 1) {
                        return (
                            <Box
                                component="div"
                                key={`${this.state.selected}_${i}`}
                                sx={styles.pathDivBreadcrumbDir}
                                onClick={e => this.changeFolder(e, path || '/')}
                            >
                                {part || this.props.t('ra_Root')}
                            </Box>
                        );
                    }

                    return (
                        <div
                            style={styles.pathDivBreadcrumbSelected}
                            key={`${this.state.selected}_${i}`}
                            onClick={() => this.setState({ pathFocus: true })}
                        >
                            {part}
                        </div>
                    );
                })}
            </Breadcrumbs>
        );
    }

    renderPath(): JSX.Element {
        return (
            <Box
                component="div"
                key="path"
                sx={styles.pathDiv}
            >
                {this.state.pathFocus ? (
                    <Input
                        value={this.state.path}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                this.changeToPath();
                            } else if (e.key === 'Escape') {
                                this.setState({ pathFocus: false });
                            }
                        }}
                        endAdornment={
                            <IconButton
                                size="small"
                                onClick={() => this.changeToPath()}
                            >
                                <EnterIcon />
                            </IconButton>
                        }
                        onBlur={() => this.changeToPath()}
                        onChange={e => this.setState({ path: e.target.value })}
                        style={styles.pathDivInput}
                    />
                ) : (
                    this.renderBreadcrumb()
                )}
            </Box>
        );
    }

    render(): JSX.Element {
        if (!this.props.ready) {
            return <LinearProgress />;
        }

        if (this.state.loadAllFolders && !this.foldersLoading) {
            this.foldersLoading = true;
            setTimeout(() => {
                this.setState({ loadAllFolders: false, folders: {} }, () => {
                    this.foldersLoading = false;
                    this.loadFolders().catch(error => console.error(`Cannot load folders: ${error}`));
                });
            }, 300);
        }

        return (
            <div
                style={{ ...styles.root, ...this.props.style }}
                className={this.props.className}
            >
                {this.props.showToolbar ? this.renderToolbar() : null}
                {this.state.viewType === TILE ? this.renderPath() : null}
                <div
                    style={{
                        ...styles.filesDiv,
                        ...styles[`filesDiv${this.state.viewType}`],
                    }}
                    onClick={e => {
                        if (this.state.viewType !== TABLE) {
                            if (this.state.selected !== (this.state.currentDir || '/')) {
                                this.changeFolder(e, this.state.currentDir || '/');
                            } else {
                                e.stopPropagation();
                            }
                        }
                    }}
                >
                    {this.state.viewType === TABLE
                        ? this.renderItems('/')
                        : this.renderItems(this.state.currentDir || '/')}
                    {this.state.viewType !== TABLE ? (
                        <div style={styles.filesDivHint}>{this.props.t('ra_select_folder_hint')}</div>
                    ) : null}
                </div>
                {this.props.allowUpload ? this.renderInputDialog() : null}
                {this.props.allowUpload ? this.renderUpload() : null}
                {this.props.allowDelete ? this.renderDeleteDialog() : null}
                {this.props.allowView ? this.renderViewDialog() : null}
                {this.state.modalEditOfAccess && this.props.modalEditOfAccessControl
                    ? this.props.modalEditOfAccessControl(this)
                    : null}
                {this.renderError()}
            </div>
        );
    }
}

export const FileBrowser = withWidth()(FileBrowserClass);
