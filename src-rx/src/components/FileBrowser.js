/* This file is temporary here to speed-up the development of this component.
    Later it will be moved to adapter-react
 */

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone'

import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Fab from '@material-ui/core/Fab';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

import ErrorDialog from '@iobroker/adapter-react/Dialogs/Error';
import Utils from '@iobroker/adapter-react/Components/Utils';
import TextInputDialog from '@iobroker/adapter-react/Dialogs/TextInput';
import FileViewer from '@iobroker/adapter-react/Components/FileViewer';
import { EXTENSIONS } from '@iobroker/adapter-react/Components/FileViewer';

// Icons
import RefreshIcon from '@material-ui/icons/Refresh';
import CloseIcon from '@material-ui/icons/Close';
import JsonIcon from '@material-ui/icons/Bookmark';
import CssIcon from '@material-ui/icons/BookmarkBorder';
import JSIcon from '@material-ui/icons/Code';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import UploadIcon from '@material-ui/icons/Publish';
import MusicIcon from '@material-ui/icons/MusicNote';
import DownloadIcon from '@material-ui/icons/SaveAlt';
import AddFolderIcon from '@material-ui/icons/CreateNewFolder';
import EmptyFilterIcon from '@material-ui/icons/FolderOpen';
import IconList from '@material-ui/icons/List';
import IconTile from '@material-ui/icons/ViewModule';
import IconBack from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';

import ExpertIcon from  '@iobroker/adapter-react/Components/ExpertIcon';
import NoImage from '@iobroker/adapter-react/assets/no_icon.svg';

const ROW_HEIGHT = 32;
const BUTTON_WIDTH = 32;

const TILE_HEIGHT = 120;
const TILE_WIDTH = 64;

const styles = theme => ({
    root: {
        width: '100%',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
    },
    filesDiv: {
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: theme.spacing(1)
    },
    filesDivTable: {
        height: 'calc(100% - ' + (48 + theme.spacing(1)) + 'px)',
    },
    filesDivTile: {
        height: 'calc(100% - ' + (48 * 2 + theme.spacing(1)) + 'px)',
        display: 'flex',
        alignContent: 'flex-start',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        flex: '0 0 ' + TILE_WIDTH + 'px',
    },

    itemTile: {
        position: 'relative',
        userSelect: 'none',
        cursor: 'pointer',
        height: TILE_HEIGHT,
        width: TILE_WIDTH,
        display: 'inline-block',
        textAlign: 'center',
        opacity: 0.1,
        transition: 'opacity 1s',
        margin: 4,
        '&:hover': {
            background: theme.palette.secondary.light,
            color: Utils.invertColor(theme.palette.secondary.main, true),
        }
    },
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
    itemFolderIconTile: {
        width: '100%',
        height: TILE_HEIGHT - 32 - 16 - 8, // name + size
        display: 'block',
        paddingLeft: 8,
        color: theme.palette.secondary.main || '#fbff7d',
    },
    itemFolderIconBack: {
        position: 'absolute',
        top: 22,
        left: 18,
        zIndex: 1,
        color: theme.palette.type === 'dark' ? '#FFF' : '#000',
    },
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

    itemSelected: {
        background: theme.palette.primary.main,
        color: Utils.invertColor(theme.palette.primary.main, true),
    },

    itemTable: {
        userSelect: 'none',
        cursor: 'pointer',
        height: ROW_HEIGHT,
        display: 'inline-flex',
        lineHeight: ROW_HEIGHT + 'px',
        '&:hover': {
            background: theme.palette.secondary.light,
            color: Utils.invertColor(theme.palette.secondary.main, true),
        }
    },
    itemNameTable: {
        display: 'inline-block',
        paddingLeft: 10,
        fontSize: '1rem',
        verticalAlign: 'top',
        flexGrow: 1,
    },
    itemNameFolderTable: {
        fontWeight: 'bold',
    },
    itemSizeTable: {
        display: 'inline-block',
        width: 60,
        verticalAlign: 'top',
        textAlign: 'right'
    },
    itemAccessTable: {
        display: 'inline-block',
        verticalAlign: 'top',
        width: 60,
        textAlign: 'right',
        paddingRight: 5
    },
    itemImageTable: {
        display: 'inline-block',
        width: 30,
        marginTop: 1,
        objectFit: 'contain',
        maxHeight: 30,
    },
    itemIconTable: {
        display: 'inline-block',
        marginTop: 1,
        width: 30,
        height: 30,
    },
    itemFolderTable: {

    },
    itemFolderTemp: {
        opacity: 0.4
    },
    itemFolderIconTable: {
        marginTop: 1,
        marginLeft: theme.spacing(1),
        display: 'inline-block',
        width: 30,
        height: 30,
        color: theme.palette.secondary.main || '#fbff7d',
    },
    itemDownloadButtonTable: {
        display: 'inline-block',
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        verticalAlign: 'top',
        padding: 0,
        '& span': {
            paddingTop: 9
        },
        '& svg': {
            width: 14,
            height: 14,
            fontSize: '1rem'
        }
    },
    itemDeleteButtonTable: {
        display: 'inline-block',
        width: BUTTON_WIDTH,
        height: ROW_HEIGHT,
        verticalAlign: 'top',
        padding: 0,
        '& svg': {
            width: 18,
            height: 18,
            fontSize: '1.5rem'
        }
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

    uploadCenterDiv: {
        margin: 20,
        border: '3px dashed grey',
        borderRadius: 30,
        width: 'calc(100% - 40px)',
        height: 'calc(100% - 40px)',
        position: 'relative',
        color: theme.palette.type === 'dark' ? '#222' : '#CCC'
    },
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
        top: '50%',
        left: '50%',
        height: '30%',
        width: '50%',
        margin: '-15% 0 0 -25%',
    },
    menuButtonExpertActive: {
        color: '#c00000',
    },
    pathDiv: {
        display: 'flex',
        width: 'calc(100% - ' + theme.spacing(2) + 'px)',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        textOverflow: 'clip',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
    },
    pathDivInput: {
        width: '100%',
    },
    pathDivBreadcrumb: {
        paddingTop: 3,
        paddingBottom: 2,
        borderBottom: 'solid 1px',
    },
    pathDivBreadcrumbDir: {
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
        cursor: 'pointer',
        '&:hover': {
            background: theme.palette.type === 'dark' ? '#333' : '#CCC',
        },
    },
    pathDivBreadcrumbSlash: {
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
        opacity: 0.7,
    },
    pathDivBreadcrumbFile: {
        cursor: 'pointer',
        flexGrow: 1,
    }
});

const USER_DATA = '0_userdata.0';

function sortFolders(a, b) {
    if (a.folder && b.folder) {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0);
    } else if (a.folder) {
        return -1;
    } else if (b.folder) {
        return 1;
    } else {
        return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0)
    }
}

function getParentDir(dir) {
    const parts = (dir || '').split('/');
    parts.length && parts.pop();
    return parts.join('/');
}

function isFile(path) {
    let ext = Utils.getFileExtension(path);
    if (ext && ext.toLowerCase().match(/[a-z]+/) && ext.length < 5) {
        return true;
    } else {
        return false;
    }
}

// all icons are copied from https://github.com/FortAwesome/Font-Awesome/blob/0d1f27efb836eb2ab994ba37221849ed64a73e5c/svgs/regular/
class IconClosed extends React.Component {
    render() {
        return <svg onClick={e => this.props.onClick && this.props.onClick(e)} viewBox="0 0 650 512" xmlns="http://www.w3.org/2000/svg" width={this.props.width || 28} height={this.props.height || 28} className={ this.props.className }>
            <path fill="currentColor" d="M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z"/>
        </svg>;
    }
}
class IconOpen extends React.Component {
    render() {
        return <svg onClick={e => this.props.onClick && this.props.onClick(e)} viewBox="0 0 650 512" xmlns="http://www.w3.org/2000/svg" width={this.props.width || 28} height={this.props.height || 28} className={ this.props.className }>
            <path fill="currentColor" d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"/>
        </svg>;
    }
}

const TABLE = 'Table';
const TILE = 'Tile';

class FileBrowser extends React.Component {
    constructor(props) {
        super(props);
        let expanded = window.localStorage.getItem('files.expanded') || '[]';

        try {
            expanded = JSON.parse(expanded);
        } catch (e) {
            expanded = [];
        }

        let viewType;
        if (this.props.showViewTypeButton) {
            viewType = window.localStorage.getItem('files.viewType') || TABLE;
        } else {
            viewType = TABLE;
        }

        let selected = this.props.selected || window.localStorage.getItem('files.selected') || USER_DATA;
        let currentDir = '';
        if (isFile(selected)) {
            currentDir = getParentDir(selected);
        } else {
            currentDir = selected;
        }

        this.state = {
            viewType,
            folders: {},
            filterEmpty: window.localStorage.getItem('files.empty') !== 'false',
            expanded,
            currentDir,
            expertMode: this.props.expertMode,
            addFolder: false,
            uploadFile: false,
            deleteItem: '',
            marked: [],
            viewer: '',
            path: selected,
            selected,
            errorText: '',
        };

        this.imagePrefix = this.props.imagePrefix || './files/';

        this.levelPadding = this.props.levelPadding || 20;
        this.mounted = true;
        this.suppressDeleteConfirm = 0;

        this.loadFolders();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.expertMode !== undefined && props.expertMode !== state.expertMode) {
            return {expertMode: props.expertMode};
        } else {
            return null;
        }
    }

    loadFolders() {
        return this.browseFolder('/')
            .then(folders => {
                return this.state.viewType === TABLE ?
                    this.browseFolders([...this.state.expanded], folders)
                    :
                    (this.state.currentDir && this.state.currentDir !== '/' ? this.browseFolder(this.state.currentDir, folders) : Promise.resolve(folders))
            })
            .then(folders => this.setState({folders}, () => {
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
                    this.setState({selected, path: selected, pathFocus: false}, () => this.scrollToSelected());
                } else {
                    this.scrollToSelected();
                }
            }));
    }

    scrollToSelected() {
        if (this.mounted) {
            const el = document.getElementById(this.state.selected);
            el && el.scrollIntoView();
        }
    }

    componentDidMount() {
        this.mounted = true;
        this.scrollToSelected();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    browseFolders(foldersList, _newFolders, _resolve) {
        if (!_newFolders) {
            _newFolders = {};
            Object.keys(this.state.folders).forEach(folder => _newFolders[folder] = this.state.folders[folder]);
        }

        if (!_resolve) {
            return new Promise(resolve => this.browseFolders(foldersList, _newFolders, resolve)) ;
        }

        if (!foldersList || !foldersList.length) {
            _resolve(_newFolders);
        } else {
            this.browseFolder(foldersList.shift(), _newFolders)
                .then(() => setTimeout(() => this.browseFolders(foldersList, _newFolders, _resolve), 0))
                .catch(() => setTimeout(() => this.browseFolders(foldersList, _newFolders, _resolve), 0))
        }
    }

    browseFolder(folderId, _newFolders, _checkEmpty) {
        if (!_newFolders) {
            _newFolders = {};
            Object.keys(this.state.folders).forEach(folder => _newFolders[folder] = this.state.folders[folder]);
        }

        if (_newFolders[folderId]) {
            if (!_checkEmpty) {
                return new Promise((resolve, reject) =>
                    Promise.all(_newFolders[folderId].filter(item => item.folder).map(item =>
                        this.browseFolder(item.id, _newFolders, true)
                            .catch(error => {})))
                        .then(() => resolve(_newFolders))
                        .catch(error => reject(error)));
            } else {
                return Promise.resolve(_newFolders);
            }
        }

        if (!folderId || folderId === '/') {
            return this.props.socket.readMetaItems()
                .then(objs => {
                    const _folders = [];
                    let userData = null;
                    objs.forEach(obj => {
                        const item = {
                            id:     obj._id,
                            name:   obj._id,
                            title: (obj.common && obj.common.name) || obj._id,
                            meta:   true,
                            from:   obj.from,
                            ts:     obj.ts,
                            color:  obj.common && obj.common.color,
                            icon:   obj.common && obj.common.icon,
                            folder: true,
                            acl:    obj.acl,
                            level:  0
                        };
                        if (item.id === USER_DATA) {
                            // user data must be first
                            userData = item;
                        } else {
                            _folders.push(item);
                        }
                    });
                    _folders.sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0));
                    _folders.unshift(userData);

                    _newFolders[folderId || '/'] = _folders;

                    if (!_checkEmpty) {
                        return Promise.all(_folders.filter(item => item.folder).map(item =>
                            this.browseFolder(item.id, _newFolders, true).catch(error => {})))
                            .then(() => _newFolders)
                    } else {
                        return _newFolders;
                    }
                });
        } else {
            const parts   = folderId.split('/');
            const level   = parts.length;
            const adapter = parts.shift();
            const relPath = parts.join('/');

            return this.props.socket.readDir(adapter, relPath)
                .then(files => {
                    const _folders = [];
                    files.forEach(file => {
                        const item = {
                            id:       folderId + '/' + file.file,
                            ext:      Utils.getFileExtension(file.file),
                            folder:   file.isDir,
                            name:     file.file,
                            size:     file.stats && file.stats.size,
                            modified: file.modifiedAt,
                            acl:      file.acl,
                            level
                        };
                        _folders.push(item);
                    });

                    _folders.sort(sortFolders);
                    _newFolders[folderId] = _folders;

                    if (!_checkEmpty) {
                        return Promise.all(_folders.filter(item => item.folder).map(item => this.browseFolder(item.id, _newFolders, true)))
                            .then(() => _newFolders)
                    } else {
                        return _newFolders;
                    }
                });
        }
    }

    toggleFolder(item, e) {
        e && e.stopPropagation();
        const expanded = [...this.state.expanded];
        const pos = expanded.indexOf(item.id);
        if (pos === -1) {
            expanded.push(item.id);
            expanded.sort();

            window.localStorage.setItem('files.expanded', JSON.stringify(expanded));

            if (!item.temp) {
                return this.browseFolder(item.id)
                    .then(folders => this.setState({expanded, folders}));
            } else {
                this.setState({expanded});
            }
        } else {
            expanded.splice(pos, 1);
            window.localStorage.setItem('files.expanded', JSON.stringify(expanded));
            this.setState({expanded});
        }
    }

    changeFolder(e, folder) {
        e && e.stopPropagation();

        this.lastSelect = Date.now();

        folder = folder || getParentDir(this.state.currentDir);

        if (folder === '/') {
            folder = '';
        }

        window.localStorage.setItem('files.currentDir', folder);

        if (folder && !this.state.folders[folder]) {
            return this.browseFolder(folder)
                .then(folders =>
                    this.setState({folders, path: folder, currentDir: folder, selected: folder, pathFocus: false}, () => this.props.onSelect && this.props.onSelect('')));
        } else {

            this.setState({currentDir: folder, selected: folder, path: folder, pathFocus: false}, () => this.props.onSelect && this.props.onSelect(''));
        }
    }

    select(id, e) {
        e && e.stopPropagation();
        this.lastSelect = Date.now();
        window.localStorage.setItem('files.selected', id);
        this.setState({selected: id, path: id, pathFocus: false}, () => {
            if (this.props.onSelect) {
                const ext = Utils.getFileExtension(id);
                if ((!this.props.filterFiles  || this.props.filterFiles.includes(ext)) &&
                    (!this.props.filterByType || EXTENSIONS[this.props.filterByType].includes(ext))
                ) {
                    this.props.onSelect(id);
                } else {
                    this.props.onSelect('');
                }
            }
        });
    }

    renderFolder(item, expanded) {
        if (this.state.folders[item.id] && this.state.filterEmpty && !this.state.folders[item.id].length && item.id !== USER_DATA && !item.temp) {
            return null;
        }
        const Icon = expanded ? IconOpen : IconClosed;
        const padding = this.state.viewType === TABLE ? item.level * this.levelPadding : 0;
        return <div key={ item.id }
                    id={ item.id }
                    style={this.state.viewType === TABLE ? { marginLeft: padding, width: 'calc(100% - ' + padding + 'px' } : {}}
                    onClick={e => this.state.viewType === TABLE ? this.select(item.id, e) : this.changeFolder(e, item.id) }
                    onDoubleClick={e => this.state.viewType === TABLE && this.toggleFolder(item, e) }
                    title={ item.title && typeof item.title === 'object' ? item.title[this.props.lang] : item.title || null}
                    className={ Utils.clsx(
                        'browserItem',
                        this.props.classes['item' + this.state.viewType],
                        this.props.classes['itemFolder' + this.state.viewType],
                        this.state.selected === item.id && this.props.classes.itemSelected,
                        item.temp && this.props.classes['itemFolderTemp'],
                    )}>
            <Icon className={ this.props.classes['itemFolderIcon' + this.state.viewType] } onClick={this.state.viewType === TABLE ? e => this.toggleFolder(item, e) : undefined}/>

            <div className={ Utils.clsx(this.props.classes['itemName' + this.state.viewType], this.props.classes['itemNameFolder' + this.state.viewType])}
            >{ item.name === USER_DATA ? this.props.t('ra_User files') : item.name }</div>

            { <div className={ this.props.classes['itemSize' + this.state.viewType]}>{ this.state.viewType === TABLE && this.state.folders[item.id] ? this.state.folders[item.id].length : '' }</div> }

            { this.state.viewType === TABLE ? this.formatAcl(item.acl) : null}

            { this.state.viewType === TABLE && this.props.allowDownload ? <div className={ this.props.classes['itemDownloadButton' + this.state.viewType] }/> : null }

            { this.state.viewType === TABLE && this.props.allowDelete && this.state.folders[item.id] && this.state.folders[item.id].length && (this.state.expertMode || item.id.startsWith(USER_DATA) || item.id.startsWith('vis.0/')) ?
                <IconButton aria-label="delete"
                            onClick={e => {
                                e.stopPropagation();
                                if (this.suppressDeleteConfirm > Date.now()) {
                                    this.deleteItem(item.id);
                                } else {
                                    this.setState({deleteItem: item.id});
                                }
                            }}
                            className={this.props.classes['itemDeleteButton' + this.state.viewType]}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
                :
                (this.state.viewType === TABLE && this.props.allowDelete ? <div className={this.props.classes['itemDeleteButton' + this.state.viewType]} /> : null )
            }
        </div>;
    }

    renderBackFolder() {
        return <div key={ this.state.currentDir }
                    id={ this.state.currentDir }
                    onClick={e => this.changeFolder(e) }
                    title={ this.props.t('re_Back to %s', getParentDir(this.state.currentDir))}
                    className={ Utils.clsx(
                        'browserItem',
                        this.props.classes['item' + this.state.viewType],
                        this.props.classes['itemFolder' + this.state.viewType],
                    )}>
            <IconClosed className={ this.props.classes['itemFolderIcon' + this.state.viewType] }/>
            <IconBack className={ this.props.classes.itemFolderIconBack }/>

            <div
                className={ Utils.clsx(this.props.classes['itemName' + this.state.viewType], this.props.classes['itemNameFolder' + this.state.viewType])}
            >..</div>
        </div>;
    }

    formatSize(size) {
        return <div className={this.props.classes['itemSize' + this.state.viewType]}>{ size || size === 0 ? Utils.formatBytes(size) : '' }</div>;
    }

    formatAcl(acl) {
        let access = acl && (acl.permissions || acl.object);
        if (access) {
            access = access.toString(16).padStart(3, '0');
        }

        return <div className={this.props.classes['itemAccess' + this.state.viewType]}>{ access }</div>;
    }

    getFileIcon(ext) {
        switch (ext) {
            case 'json':
                return (<JsonIcon className={this.props.classes['itemIcon' + this.state.viewType]} />);

            case 'css':
                return (<CssIcon className={this.props.classes['itemIcon' + this.state.viewType]} />);

            case 'js':
            case 'ts':
                return (<JSIcon className={this.props.classes['itemIcon' + this.state.viewType]} />);

            case 'mp3':
            case 'ogg':
            case 'wav':
            case 'm4a':
            case 'mp4':
            case 'flac':
                return (<MusicIcon className={this.props.classes['itemIcon' + this.state.viewType]} />);

            default:
                return (<FileIcon className={this.props.classes['itemIcon' + this.state.viewType]} />);
        }
    }

    renderFile(item) {
        const padding = this.state.viewType === TABLE ? item.level * this.levelPadding : 0;
        const ext = Utils.getFileExtension(item.name);

        return <div
            key={ item.id }
            id={ item.id }
            onDoubleClick={ () => {
                if (!this.props.onSelect) {
                    this.setState({ viewer: this.imagePrefix + item.id });
                } else if (
                    (!this.props.filterFiles  || this.props.filterFiles.includes(item.ext)) &&
                    (!this.props.filterByType || EXTENSIONS[this.props.filterByType].includes(item.ext))
                ) {
                    this.props.onSelect(item.id, true);
                }
            }}
            onClick={e => this.select(item.id, e) }
            style={this.state.viewType === TABLE ? { marginLeft: padding, width: 'calc(100% - '  + padding + 'px)'} : {}}
            className={ Utils.clsx(
                'browserItem',
                this.props.classes['item' + this.state.viewType],
                this.props.classes['itemFile' + this.state.viewType],
                this.state.selected === item.id && this.props.classes.itemSelected
            ) }
        >
            { EXTENSIONS.images.includes(ext) ?
                <img
                    onError={e => {e.target.onerror = null; e.target.src = NoImage}}
                    className={this.props.classes['itemImage' + this.state.viewType]}
                    src={this.imagePrefix + item.id} alt={item.name}
                />
                :
                this.getFileIcon(ext)}
            <div className={this.props.classes['itemName' + this.state.viewType]}>{ item.name }</div>
            {this.formatSize(item.size)}
            {this.state.viewType === TABLE ? this.formatAcl(item.acl) : null}

            { this.state.viewType === TABLE && this.props.allowDownload ? <IconButton
                download
                href={this.imagePrefix + item.id}
                className={this.props.classes['itemDownloadButton' + this.state.viewType]}
                onClick={e => e.stopPropagation()}
            ><DownloadIcon/></IconButton> : null }

            {   this.state.viewType === TABLE &&
                this.props.allowDelete &&
                item.id !== 'vis.0/' &&
                item.id !== USER_DATA &&
                (this.state.expertMode || item.id.startsWith(USER_DATA) || item.id.startsWith('vis.0/'))
            ?
                <IconButton aria-label="delete"
                            onClick={e => {
                                e.stopPropagation();
                                if (this.suppressDeleteConfirm > Date.now()) {
                                    this.deleteItem(item.id);
                                } else {
                                    this.setState({deleteItem: item.id});
                                }
                            }}
                            className={this.props.classes['itemDeleteButton' + this.state.viewType]}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
                :
                (this.state.viewType === TABLE && this.props.allowDelete ?
                    <div className={this.props.classes['itemDeleteButton' + this.state.viewType]}/>
                        :
                    null
                )
            }
        </div>;
    }

    renderItems(folderId) {
        if (folderId &&
            folderId !== '/' &&
            !this.state.expertMode &&
            folderId !== USER_DATA && !folderId.startsWith(USER_DATA) &&
            folderId !== 'vis.0'   && !folderId.startsWith('vis.0/')
        ) {
            return null;
        }

        // tile
        if (this.state.folders[folderId]) {
            if (this.state.viewType === TILE) {
                const res = [];
                if (folderId && folderId !== '/') {
                    res.push(this.renderBackFolder())
                }
                this.state.folders[folderId].forEach(item => {
                    if (!this.state.expertMode &&
                        item.id !== USER_DATA && !item.id.startsWith(USER_DATA) &&
                        item.id !== 'vis.0'   && !item.id.startsWith('vis.0/')
                    ) {
                        return;
                    }
                    if (item.folder) {
                        res.push(this.renderFolder(item));
                    } else if (
                        (!this.props.filterFiles || this.props.filterFiles.includes(item.ext)) &&
                        (!this.props.filterByType || EXTENSIONS[this.props.filterByType].includes(item.ext))
                    ) {
                        res.push(this.renderFile(item));
                    }
                });
                return res;
            } else {
                return this.state.folders[folderId].map(item => {
                    const res = [];
                    if (item.id &&
                        item.id !== '/' &&
                        !this.state.expertMode &&
                        item.id !== USER_DATA &&
                        !item.id.startsWith(USER_DATA) &&
                        item.id !== 'vis.0' &&
                        !item.id.startsWith('vis.0/')) {
                        return null;
                    }

                    if (item.folder) {
                        const expanded = this.state.expanded.includes(item.id);

                        res.push(this.renderFolder(item, expanded));
                        if (this.state.folders[item.id] && expanded) {
                            res.push(this.renderItems(item.id))
                        }
                    } else if (
                        (!this.props.filterFiles || this.props.filterFiles.includes(item.ext)) &&
                        (!this.props.filterByType || EXTENSIONS[this.props.filterByType].includes(item.ext))
                    ) {
                        res.push(this.renderFile(item));
                    } else {
                        return null;
                    }

                    return res;
                });
            }
        } else {
            return <CircularProgress key={folderId} color="secondary" size={24}/>;
        }
    }

    renderToolbar() {
        return <Toolbar key="toolbar" variant="dense">
            {this.props.showExpertButton ? <IconButton
                edge="start"
                title={this.props.t('ra_Toggle expert mode')}
                className={Utils.clsx(this.props.classes.menuButton, this.state.expertMode && this.props.classes.menuButtonExpertActive)}
                aria-label="expert mode"
                onClick={() => {
                    this.setState({expertMode: !this.state.expertMode});
                }}
            ><ExpertIcon /></IconButton> : null }
            {this.props.showViewTypeButton ? <IconButton
                edge="start"
                title={this.props.t('ra_Toggle view mode')}
                className={this.props.classes.menuButton}
                aria-label="view mode"
                onClick={() => {
                    const viewType = this.state.viewType === TABLE ? TILE : TABLE;
                    window.localStorage.setItem('files.viewType', viewType);
                    let currentDir = this.state.selected;
                    if (isFile(currentDir)) {
                        currentDir = getParentDir(currentDir)
                    }
                    this.setState({viewType, currentDir}, () => {
                        if (this.state.viewType === TABLE) {
                            this.scrollToSelected();
                        }
                    });
                }}
            >{this.state.viewType !== TABLE ? <IconList/> : <IconTile/>}</IconButton> : null }
            <IconButton
                edge="start"
                title={this.props.t('ra_Hide empty folders')}
                className={this.props.classes.menuButton}
                color={this.state.filterEmpty ? 'secondary' : 'inherit'}
                aria-label="filter empty"
                onClick={() => {
                    window.localStorage.setItem('file.empty', !this.state.filterEmpty);
                    this.setState({filterEmpty: !this.state.filterEmpty});
                }}
            ><EmptyFilterIcon /></IconButton>
            <IconButton
                edge="start"
                title={this.props.t('ra_Reload files')}
                className={this.props.classes.menuButton}
                color={'inherit'}
                aria-label="filter empty"
                onClick={() => this.setState({folders: {}}, () => this.loadFolders())}
            ><RefreshIcon /></IconButton>
            { this.props.allowCreateFolder ? <IconButton
                edge="start"
                disabled={this.state.expertMode ? !this.state.selected : !this.state.selected.startsWith('vis.0') && !this.state.selected.startsWith(USER_DATA)}
                title={this.props.t('ra_Create folder')}
                className={this.props.classes.menuButton}
                color={'inherit'}
                aria-label="add folder"
                onClick={() => this.setState({addFolder: true}) }
            ><AddFolderIcon /></IconButton> : null }
            { this.props.allowUpload ? <IconButton
                edge="start"
                disabled={this.state.expertMode ? !this.state.selected : !this.state.selected.startsWith('vis.0') && !this.state.selected.startsWith(USER_DATA)}
                title={this.props.t('ra_Upload file')}
                className={this.props.classes.menuButton}
                color={'inherit'}
                aria-label="upload file"
                onClick={() => {
                    this.setState({uploadFile: true})
                } }
            ><UploadIcon /></IconButton> : null }
        </Toolbar>;
    }

    findItem(id) {
        const parts = id.split('/');
        parts.pop();
        const parentFolder = parts.join('/');
        return this.state.folders[parentFolder || '/'].find(item => item.id === id);
    }

    renderInputDialog() {
        if (this.state.addFolder) {
            let parentFolder = this.findFirstFolder(this.state.selected);

            if (!parentFolder) {
                return window.alert(this.props.t('ra_Invalid parent folder!'));
            }

            return <TextInputDialog key="inputDialog"
                                    applyText={this.props.t('ra_Create')}
                                    cancelText={this.props.t('ra_Cancel')}
                                    titleText={this.props.t('ra_Create new folder in %s', this.state.selected)}
                                    promptText={this.props.t('ra_If no file will be created in the folder, it will disappear after the browser closed')}
                                    labelText={this.props.t('ra_Folder name')}
                                    verify={text => this.state.folders[parentFolder].find(item => item.name === text) ? '' : this.props.t('ra_Duplicate name')}
                                    onClose={name => {
                                        if (name) {
                                            const folders = {};
                                            Object.keys(this.state.folders).forEach(folder => folders[folder] = this.state.folders[folder]);
                                            const parent = this.findItem(parentFolder);
                                            folders[parentFolder].push({
                                                id: parentFolder + '/' + name,
                                                level: parent.level + 1,
                                                name,
                                                folder: true,
                                                temp: true,
                                            });

                                            folders[parentFolder].sort(sortFolders);

                                            folders[parentFolder + '/' + name] = [];
                                            const expanded = [...this.state.expanded];
                                            if (!expanded.includes(parentFolder)) {
                                                expanded.push(parentFolder);
                                                expanded.sort();
                                            }
                                            this.setState({addFolder: false, folders, expanded});
                                        } else {
                                            this.setState({addFolder: false});
                                        }
                                    }}
                                    replace={text => text.replace(/[^-_\w\d]/, '_')}
            />;
        } else {
            return null;
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.setOpacityTimer && clearTimeout(this.setOpacityTimer);
        this.setOpacityTimer = setTimeout(() => {
            this.setOpacityTimer = null;
            const items = window.document.getElementsByClassName('browserItem');
            for (let i = 0; i < items.length; i++) {
                items[i].style.opacity = 1;
            }
        }, 100);
    }

    uploadFile(fileName, data) {
        const parts = fileName.split('/');
        const adapter = parts.shift();
        return this.props.socket.writeFile64(adapter, parts.join('/'), data);
    }

    findFirstFolder(id) {
        let parentFolder = id;
        // find folder
        if (!this.findItem(parentFolder).folder) {
            const parts = parentFolder.split('/');
            parts.pop();
            parentFolder = '';
            while (parts.length) {
                const item = this.findItem(parts.join('/'));
                if (item && item.folder) {
                    parentFolder = parts.join('/');
                    break;
                }
            }
        }

        return parentFolder;
    }

    renderUpload() {
        if (this.state.uploadFile) {
            return [
                <Fab key="close" color="primary" aria-label="close" className={this.props.classes.uploadCloseButton}
                     onClick={() => this.setState({uploadFile: false})}>
                    <CloseIcon />
                </Fab>,
                <Dropzone
                    key="dropzone"
                    onDragEnter={() => this.setState({uploadFile: 'dragging'})}
                    onDragLeave={() => this.setState({uploadFile: true})}
                    onDrop={acceptedFiles => {
                        let count = acceptedFiles.length;
                        acceptedFiles.forEach(file => {
                            const reader = new FileReader();

                            reader.onabort = () => console.log('file reading was aborted');
                            reader.onerror = () => console.log('file reading has failed');
                            reader.onload  = () => {
                                let parentFolder = this.findFirstFolder(this.state.selected);

                                if (!parentFolder) {
                                    return window.alert(this.props.t('ra_Invalid parent folder!'));
                                }

                                this.uploadFile(parentFolder + '/' + file.name, reader.result)
                                    .then(() => {
                                        if (!--count) {
                                            const folders = {};
                                            Object.keys(this.state.folders).forEach(name => {
                                                if (name !== parentFolder && !name.startsWith(parentFolder + '/')) {
                                                    folders[name] = this.state.folders[name];
                                                }
                                            });
                                            this.setState({uploadFile: false, folders}, () =>
                                                this.browseFolders([...this.state.expanded], folders)
                                                    .then(folders => this.setState({folders})));
                                        }
                                    });
                            };
                            reader.readAsArrayBuffer(file);
                        });
                    }}
                >
                    {({ getRootProps, getInputProps }) => (
                        <div className={Utils.clsx(this.props.classes.uploadDiv, this.state.uploadFile === 'dragging' && this.props.classes.uploadDivDragging)}
                             {...getRootProps()}>
                            <input {...getInputProps()} />
                            <div className={this.props.classes.uploadCenterDiv}>
                                <div className={this.props.classes.uploadCenterTextAndIcon}>
                                    <UploadIcon className={this.props.classes.uploadCenterIcon}/>
                                    <div className={this.props.classes.uploadCenterText}>{
                                        this.state.uploadFile === 'dragging' ? this.props.t('ra_Drop file here') :
                                            this.props.t('ra_Place your files here or click here to open the browse dialog')}</div>
                                </div>
                            </div>
                        </div>)}
                </Dropzone>
            ];
        } else {
            return null;
        }
    }

    deleteRecursive(id) {
        const item = this.findItem(id);
        if (item.folder) {
            return Promise.all(this.state.folders[id].map(item => this.deleteRecursive(item.id)));
        } else {
            const parts = id.split('/');
            const adapter = parts.shift();
            if (parts.length) {
                return this.props.socket.deleteFile(adapter, parts.join('/'));
            } else {
                return Promise.resolve();
            }
        }
    }

    deleteItem(deleteItem) {
        deleteItem = deleteItem || this.state.deleteItem;

        this.setState({deleteItem: ''}, () =>
            this.deleteRecursive(deleteItem)
                .then(() => {
                    let parentFolder = this.findFirstFolder(deleteItem);
                    const folders = {};
                    Object.keys(this.state.folders).forEach(name => {
                        if (name !== parentFolder && !name.startsWith(parentFolder + '/')) {
                            folders[name] = this.state.folders[name];
                        }
                    });
                    this.setState({folders}, () =>
                        this.browseFolders([...this.state.expanded], folders)
                            .then(folders => this.setState({folders})));
                })
        );
    }

    renderDeleteDialog() {
        if (this.state.deleteItem) {
            return <Dialog key="deleteDialog" open={true} onClose={() => this.setState({deleteItem: ''})} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{this.props.t('ra_Confirm deletion of %s', this.state.deleteItem.split('/').pop())}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {this.props.t('ra_Are you sure?')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({deleteItem: ''})} >{this.props.t('ra_Cancel')}</Button>
                    <Button onClick={() => {
                        this.suppressDeleteConfirm = Date.now() + 60000 * 5;
                        this.deleteItem();
                    }} >{this.props.t('ra_Delete (no confirm for 5 mins)')}</Button>
                    <Button onClick={() => this.deleteItem()} color="primary">{this.props.t('ra_Delete')}</Button>
                </DialogActions>
            </Dialog>;
        } else {
            return false;
        }
    }

    renderViewDialog() {
        return this.state.viewer ? <FileViewer
            key={ this.state.viewer }
            href={ this.state.viewer }
            t={ this.props.t }
            lang={ this.props.lang }
            expertMode={ this.state.expertMode }
            onClose={ () => this.setState({ viewer: '' }) }
        /> : null;
    }

    renderError () {
        if (this.state.errorText) {
            return <ErrorDialog key="errorDialog" text={this.state.errorText} onClose={() => this.setState({errorText: ''})}/>;
        } else {
            return null;
        }
    }

    changeToPath() {
        setTimeout(() => {
            if (this.state.path !== this.state.selected && (!this.lastSelect || Date.now() - this.lastSelect > 100)) {
                let folder = this.state.path;
                if (isFile(this.state.path)) {
                    folder = getParentDir(this.state.path);
                }
                return new Promise(resolve => {
                    if (!this.state.folders[folder]) {
                        return this.browseFolder(folder)
                            .then(folders => this.setState({folders}, () => resolve(true)))
                            .catch(err => this.setState({errorText: err === 'Not found' ? this.props.t('re_Cannot find "%s"', folder) : this.props.t('re_Cannot read "%s"', folder)}));
                    } else {
                        return resolve(true);
                    }
                })
                    .then(result =>
                        result && this.setState({selected: this.state.path, currentDir: folder, pathFocus: false}));
            } else if (!this.lastSelect || Date.now() - this.lastSelect > 100) {
                this.setState({pathFocus: false});
            }
        }, 100);
    }

    renderBreadcrumb() {
        const parts = this.state.selected.startsWith('/') ? this.state.selected.split('/') : ('/' + this.state.selected).split('/');
        let p = [];
        return parts.map((part, i) => {
            part && p.push(part);
            const path = p.join('/');
            if (i < parts.length - 1) {
                return [
                    <div key={this.state.selected + '_' + i} className={this.props.classes.pathDivBreadcrumbDir} onClick={e => this.changeFolder(e, path || '/')}>
                        {part || this.props.t('re_Root')}
                    </div>,
                    <span key={this.state.selected + '_s_' + i} className={this.props.classes.pathDivBreadcrumbSlash}>></span>];
            } else {
                return <div key={this.state.selected + '_' + i} className={this.props.classes.pathDivBreadcrumbFile} onClick={() => this.setState({pathFocus: true})}>{part}</div>;
            }
        });
    }

    renderPath() {
        return <div key="path" className={Utils.clsx(this.props.classes.pathDiv, !this.state.pathFocus && this.props.classes.pathDivBreadcrumb)}>
            {this.state.pathFocus ?
                <Input
                    value={this.state.path}
                    onKeyDown={e => e.keyCode === 13 && this.changeToPath()}
                    onBlur={e => this.changeToPath()}
                    onChange={e => this.setState({path: e.target.value})}
                    className={this.props.classes.pathDivInput}
                />
                :
                this.renderBreadcrumb()
            }
        </div>;
    }

    render() {
        if (!this.props.ready) {
            return <LinearProgress  key={this.props.key ? this.props.key + '_c' : 'c'} />;
        }

        return <div key={this.props.key} style={this.props.style} className={Utils.clsx(this.props.classes.root, this.props.className)}>
            { this.props.showToolbar ? this.renderToolbar() : null }
            { this.state.viewType === TILE ? this.renderPath() : null }
            <div key="items" className={Utils.clsx(this.props.classes.filesDiv, this.props.classes['filesDiv' + this.state.viewType])}>
                { this.state.viewType === TABLE ? this.renderItems('/') : this.renderItems(this.state.currentDir || '/') }
            </div>
            { this.props.allowUpload ? this.renderInputDialog()  : null }
            { this.props.allowUpload ? this.renderUpload()       : null }
            { this.props.allowDelete ? this.renderDeleteDialog() : null }
            { this.props.allowView   ? this.renderViewDialog()   : null }
            { this.renderError() }
        </div>;
    }
}

FileBrowser.propTypes = {
    key: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
    expertMode: PropTypes.bool,
    showToolbar: PropTypes.bool,
    allowUpload: PropTypes.bool,
    allowDownload: PropTypes.bool,
    allowCreateFolder: PropTypes.bool,
    allowDelete: PropTypes.bool,
    allowView: PropTypes.bool,
    imagePrefix: PropTypes.string,
    showExpertButton: PropTypes.bool,
    viewType: PropTypes.string,
    showViewTypeButton: PropTypes.bool,

    selected: PropTypes.string,
    tileView: PropTypes.bool,
    filterFiles: PropTypes.array, // like ['png', 'svg', 'bmp', 'jpg', 'jpeg']
    filterByType: PropTypes.string, // images, code or txt from FileViewer.EXTENSIONS
    onSelect: PropTypes.func, // function (id, isDoubleClick)
};

export default withWidth()(withStyles(styles)(FileBrowser));