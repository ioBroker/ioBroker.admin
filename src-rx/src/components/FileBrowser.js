/* This file is temporary here to speed-up the development of this component.
    Later it will be moved to adapter-react
 */

import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Dropzone from 'react-dropzone'
import Fab from '@material-ui/core/Fab';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

import Utils from '../Utils';
import TextInputDialog from '../components/TextInputDialog';

// Icons
import RefreshIcon from '@material-ui/icons/Refresh';
import CloseIcon from '@material-ui/icons/Close';
import {FaFolderOpen as OpenedFolderIcon} from 'react-icons/fa';
import {FaFolder as ClosedFolderIcon} from 'react-icons/fa';
import {FaFile as FileIcon} from 'react-icons/fa';
import {FaMusic as MusicIcon} from 'react-icons/fa';
import {FaScroll as JsonIcon} from 'react-icons/fa';
import {FaFileCode as CssIcon} from 'react-icons/fa';
import {FaJsSquare as JSIcon} from 'react-icons/fa';
import {FaFolderMinus as EmptyFilterIcon} from 'react-icons/fa';
import {FaFolderPlus as AddFolderIcon} from 'react-icons/fa';
import {FaFileUpload as UploadIcon} from 'react-icons/fa';
import {FaFileDownload as DownloadIcon} from 'react-icons/fa';
import NoImage from '../assets/no-image.png';
import DeleteIcon from '@material-ui/icons/Delete';

const styles = theme => ({
    filesDiv: {
        width: '100%',
        height: 'calc(100% - 48px)',
        overflow: 'auto',
    },
    itemTable: {
        userSelect: 'none',
        cursor: 'pointer',
        height: 32,
        width: '100%',
        lineHeight: '32px',
        '&:hover': {
            background: theme.palette.secondary.main,
            color: Utils.invertColor(theme.palette.secondary.main, true),
        }
    },
    itemSelected: {
        background: theme.palette.primary.main,
        color: Utils.invertColor(theme.palette.primary.main, true),
    },
    itemNameTable: {
        display: 'inline-block',
        width: 'calc(100% - 214px)', // 30 + 60 + 60 + 32 + 32
        paddingLeft: 10,
        fontSize: '1rem',
        verticalAlign: 'top',
    },
    itemNameFolderTable: {
        fontWeight: 'bold'
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
        display: 'inline-block',
        width: 30,
        height: 30
    },
    itemDownloadButtonTable: {
        display: 'inline-block',
        width: 32,
        height: 32,
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
        width: 32,
        height: 32,
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
    },
    uploadCenterIcon: {
        width: '25%',
        height: '25%',
    },
    uploadCenterText: {
        fontSize: 24,
        fontWeight: 'bold'
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

class FileBrowser extends React.Component {
    constructor(props) {
        super(props);
        let expanded = window.localStorage.getItem('files.expanded') || '[]';

        try {
            expanded = JSON.parse(expanded);
        } catch (e) {
            expanded = [];
        }

        this.state = {
            viewType: 'Table',
            folders: {},
            filterEmpty: window.localStorage.getItem('files.empty') !== 'false',
            expanded,
            expertMode: this.props.expertMode,
            addFolder: false,
            uploadFile: false,
            deleteItem: '',
            marked: [],
            selected: window.localStorage.getItem('files.selected') || USER_DATA,
        };

        this.levelPadding = this.props.levelPadding || 20;
        this.mounted = true;
        this.suppressDeleteConfirm = 0;

        this.loadFolders();
    }
    static getDerivedStateFromProps(props, state) {
        if (props.expertMode !== state.expertMode) {
            return {expertMode: props.expertMode};
        } else {
            return null;
        }
    }

    loadFolders() {
        return this.browseFolder('/')
            .then(folders => this.browseFolders([...this.state.expanded], folders))
            .then(folders => this.setState({folders}, () => {
                if (!this.findItem(this.state.selected)) {
                    const parts = this.state.selected.split('/');
                    while (parts.length && !this.findItem(parts.join('/'))) {
                        parts.pop();
                    }
                    if (parts.length) {
                        this.setState({selected: parts.join('/')}, () => this.scrollToSelected());
                    } else {
                        this.setState({selected: USER_DATA}, () => this.scrollToSelected());
                    }
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
                .then(() => setTimeout(() => this.browseFolders(foldersList, _newFolders, _resolve), 0));
        }
    }

    browseFolder(folderId, _newFolders, _checkEmpty) {
        if (!_newFolders) {
            _newFolders = {};
            Object.keys(this.state.folders).forEach(folder => _newFolders[folder] = this.state.folders[folder]);
        }

        return new Promise(resolve => {
            if (_newFolders[folderId]) {
                if (!_checkEmpty) {
                    return Promise.all(_newFolders[folderId].filter(item => item.folder).map(item => this.browseFolder(item.id, _newFolders, true)))
                        .then(() => resolve(_newFolders))
                } else {
                    return resolve(_newFolders);
                }
            }

            if (!folderId || folderId === '/') {
                this.props.socket.emit('getObjectView', 'system', 'meta', {startkey: '', endkey: '\u9999'}, (err, objs) => {
                    const _folders = [];
                    let userData = null;
                    objs && objs.rows && objs.rows.forEach(obj => {
                        const item = {
                            id: obj.value._id,
                            name: obj.value._id,
                            title: (obj.value.common && obj.value.common.name) || obj.value._id,
                            meta: true,
                            from: obj.value.from,
                            ts: obj.value.ts,
                            color: obj.value.common && obj.value.common.color,
                            icon: obj.value.common && obj.value.common.icon,
                            folder: true,
                            acl: obj.value.acl,
                            level: 0
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
                        return Promise.all(_folders.filter(item => item.folder).map(item => this.browseFolder(item.id, _newFolders, true)))
                            .then(() => resolve(_newFolders))
                    } else {
                        resolve(_newFolders);
                    }
                });
            } else {
                const parts = folderId.split('/');
                const level = parts.length;
                const adapter = parts.shift();
                const relPath = parts.join('/');

                this.props.socket.emit('readDir', adapter, relPath, (err, files) => {
                    const _folders = [];
                    files.forEach(file => {
                        const item = {
                            id:       folderId + '/' + file.file,
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
                            .then(() => resolve(_newFolders))
                    } else {
                        resolve(_newFolders);
                    }
                });
            }
        });
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

    select(id, e) {
        e && e.stopPropagation();
        window.localStorage.setItem('files.selected', id);
        this.setState({selected: id});
    }

    renderFolder(item, expanded) {
        if (this.state.folders[item.id] && this.state.filterEmpty && !this.state.folders[item.id].length && item.id !== USER_DATA && !item.temp) {
            return null;
        }
        const Icon = expanded ? OpenedFolderIcon : ClosedFolderIcon;
        const padding = (item.level * this.levelPadding) || 5;
        return (<div key={ item.id }
                     id={ item.id }
                     style={{ paddingLeft: padding }}
                     onClick={e => this.select(item.id, e) }
                     onDoubleClick={e => this.toggleFolder(item, e) }
                     title={ item.title && typeof item.title === 'object' ? item.title[this.props.lang] : item.title || null}
                     className={ clsx(
                         this.props.classes['item' + this.state.viewType],
                         this.props.classes['itemFolder' + this.state.viewType],
                         this.state.selected === item.id && this.props.classes.itemSelected,
                         item.temp && this.props.classes['itemFolderTemp'],
                     )}>
            <Icon className={ this.props.classes['itemFolderIcon' + this.state.viewType] } onClick={e => this.toggleFolder(item, e)}/>
            <div className={ clsx(this.props.classes['itemName' + this.state.viewType], this.props.classes['itemNameFolder' + this.state.viewType])}>{ item.name === USER_DATA ? this.props.t('User files') : item.name }</div>
            <div className={ this.props.classes['itemSize' + this.state.viewType]}>{ this.state.folders[item.id] ? this.state.folders[item.id].length : '' }</div>

            { this.formatAcl(item.acl) }

            { this.props.allowDownload ? <div className={ this.props.classes['itemDownloadButton' + this.state.viewType] }/> : null }

            { this.props.allowDelete && this.state.folders[item.id] && this.state.folders[item.id].length && (this.state.expertMode || item.id.startsWith(USER_DATA) || item.id.startsWith('vis.0/')) ?
                (<IconButton aria-label="delete"
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
            </IconButton>) : null }
        </div>);
    }

    formatSize(size) {
        return <div className={this.props.classes['itemSize' + this.state.viewType]}>{ size ? Utils.formatBytes(size) : '' }</div>;
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
        const padding = (item.level * this.levelPadding) || 5;
        const ext = Utils.getFileExtension(item.name);

        return (<div
            key={ item.id }
            id={ item.id }
            onClick={e => this.select(item.id, e) }
            style={{ paddingLeft: padding }}
            className={ clsx(this.props.classes['item' + this.state.viewType], this.props.classes['itemFile' + this.state.viewType], this.state.selected === item.id && this.props.classes.itemSelected) }
        >
            { ext === 'png' || ext === 'jpg' || ext === 'svg' ?
                <img onError={e => {e.target.onerror = null; e.target.src = NoImage}} className={this.props.classes['itemImage' + this.state.viewType]} src={'files/' + item.id} alt={item.name}/> : this.getFileIcon(ext)}
            <div className={this.props.classes['itemName' + this.state.viewType]}>{ item.name }</div>
            {this.formatSize(item.size)}
            {this.formatAcl(item.acl)}

            { this.props.allowDownload ? <IconButton
                download
                href={'files/' + item.id}
                className={this.props.classes['itemDownloadButton' + this.state.viewType]}
                onClick={e => {
                    e.stopPropagation();
                }}
            ><DownloadIcon/></IconButton> : null }

            { this.props.allowDelete && (this.state.expertMode || item.id.startsWith(USER_DATA) || item.id.startsWith('vis.0/')) ?
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
            </IconButton> : null}
        </div>);
    }

    renderItems(folderId) {
        if (folderId &&
            folderId !== '/' &&
            !this.state.expertMode &&
            !folderId.startsWith(USER_DATA) &&
            folderId !== USER_DATA &&
            folderId !== 'vis.0' &&
            !folderId.startsWith('vis.0/')
        ) {
            return null;
        }

        if (this.state.folders[folderId]) {
            return this.state.folders[folderId].map(item => {
                const res = [];
                if (item.id &&
                    item.id !== '/' &&
                    !this.state.expertMode &&
                    !item.id.startsWith(USER_DATA) &&
                    item.id !== USER_DATA &&
                    item.id !== 'vis.0' &&
                    !item.id.startsWith('vis.0/')) {
                    return;
                }

                if (item.folder) {
                    const expanded = this.state.expanded.includes(item.id);

                    res.push(this.renderFolder(item, expanded));
                    if (this.state.folders[item.id] && expanded) {
                        res.push(this.renderItems(item.id))
                    }
                } else {
                    res.push(this.renderFile(item));
                }

                return res;
            });
        } else {
            return (<CircularProgress key={folderId} color="secondary" size={24}/>);
        }
    }

    renderToolbar() {
        return <Toolbar key="toolbar" variant="dense">
            <IconButton
                edge="start"
                title={this.props.t('Hide empty folders')}
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
                title={this.props.t('Reload files')}
                className={this.props.classes.menuButton}
                color={'inherit'}
                aria-label="filter empty"
                onClick={() => this.setState({folders: {}}, () => this.loadFolders())}
            ><RefreshIcon /></IconButton>
            { this.props.allowCreateFolder ? <IconButton
                edge="start"
                disabled={this.state.expertMode ? !this.state.selected : !this.state.selected.startsWith('vis.0') && !this.state.selected.startsWith(USER_DATA)}
                title={this.props.t('Create folder')}
                className={this.props.classes.menuButton}
                color={'inherit'}
                aria-label="add folder"
                onClick={() => this.setState({addFolder: true}) }
            ><AddFolderIcon /></IconButton> : null }
            { this.props.allowUpload ? <IconButton
                edge="start"
                disabled={this.state.expertMode ? !this.state.selected : !this.state.selected.startsWith('vis.0') && !this.state.selected.startsWith(USER_DATA)}
                title={this.props.t('Upload file')}
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
                return window.alert(this.props.t('Invalid parent folder!'));
            }

            return <TextInputDialog
                applyText={this.props.t('Create')}
                cancelText={this.props.t('Cancel')}
                titleText={this.props.t('Create new folder in %s', this.state.selected)}
                promptText={this.props.t('If no file will be created in the folder, it will disappear after the browser closed')}
                labelText={this.props.t('Folder name')}
                verify={text => this.state.folders[parentFolder].find(item => item.name === text) ? '' : this.props.t('Duplicate name')}
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

    uploadFile(fileName, data) {
        const parts = fileName.split('/');
        const adapter = parts.shift();
        return new Promise((resolve, reject) => {
            const base64 = btoa(
                new Uint8Array(data)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            this.props.socket.emit('writeFile64', adapter, parts.join('/'), base64, err =>
                err ? reject(err) : resolve());
        });
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
                                    return window.alert(this.props.t('Invalid parent folder!'));
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
                            reader.readAsArrayBuffer(file)
                        });
                    }}
                >
                    {({ getRootProps, getInputProps }) => (
                        <div className={clsx(this.props.classes.uploadDiv, this.state.uploadFile === 'dragging' && this.props.classes.uploadDivDragging)}
                             {...getRootProps()}>
                            <input {...getInputProps()} />
                            <div className={this.props.classes.uploadCenterDiv}>
                                <div className={this.props.classes.uploadCenterTextAndIcon}>
                                    <UploadIcon className={this.props.classes.uploadCenterIcon}/>
                                    <div className={this.props.classes.uploadCenterText}>{
                                        this.state.uploadFile === 'dragging' ? this.props.t('Drop file here') :
                                            this.props.t('Place your files here or click here to open the browse dialog')}</div>
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
        return new Promise((resolve, reject) => {
            const item = this.findItem(id);
            if (item.folder) {
                Promise.all(this.state.folders[id].map(item => this.deleteRecursive(item.id)))
                    .then(() => resolve())
                    .catch(err => reject(err));
            } else {
                const parts = id.split('/');
                const adapter = parts.shift();
                if (parts.length) {
                    this.props.socket.emit('deleteFile', adapter, parts.join('/'), err =>
                        err ? reject(err) : resolve());
                } else {
                    resolve();
                }
            }
        });
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
            return <Dialog open={true} onClose={() => this.setState({deleteItem: ''})} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{this.props.t('Confirm deletion of %s', this.state.deleteItem.split('/').pop())}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {this.props.t('Are you sure?')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({deleteItem: ''})} >{this.props.t('Cancel')}</Button>
                    <Button onClick={() => {
                        this.suppressDeleteConfirm = new Date() + 60000 * 5;
                        this.deleteItem();
                    }} >{this.props.t('Delete (no confirm for 5 mins)')}</Button>
                    <Button onClick={() => this.deleteItem()} color="primary">{this.props.t('Delete')}</Button>
                </DialogActions>
            </Dialog>;
        } else {
            return false;
        }
    }

    render() {
        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }

        return [
            this.props.showToolbar ? this.renderToolbar() : null,
            (<div className={this.props.classes.filesDiv}>
                { this.renderItems('/') }
            </div>),
            this.props.allowUpload ? this.renderInputDialog() : null,
            this.props.allowUpload ? this.renderUpload() : null,
            this.props.allowDelete ? this.renderDeleteDialog() : null,
        ];
    }
}

FileBrowser.propTypes = {
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
};

export default withWidth()(withStyles(styles)(FileBrowser));