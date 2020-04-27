import withWidth from "@material-ui/core/withWidth";
import {withStyles} from "@material-ui/core/styles";
import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';

import Utils from '../Utils';

// Icons
import RefreshIcon from '@material-ui/icons/Refresh';
import {FaFolderOpen as OpenedFolderIcon} from 'react-icons/fa'
import {FaFolder as ClosedFolderIcon} from 'react-icons/fa'
import {FaFile as FileIcon} from 'react-icons/fa'
import {FaMusic as MusicIcon} from 'react-icons/fa'
import {FaScroll as JsonIcon} from 'react-icons/fa'
import {FaFileCode as CssIcon} from 'react-icons/fa'
import {FaJsSquare as JSIcon} from 'react-icons/fa'
import {FaFolderMinus as EmptyFilterIcon} from 'react-icons/fa'
import NoImage from '../assets/no-image.png';

const styles = theme => ({
    root: {
        paddingTop: 5,
        paddingLeft: 5,
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
        overflow: 'hidden',
    },
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
        width: 'calc(100% - 150px)',
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
    itemFolderIconTable: {
        marginTop: 1,
        display: 'inline-block',
        width: 30,
        height: 30
    },
});

class Files extends React.Component {
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
            selected: window.localStorage.getItem('files.selected') || '0_userdata.0',
        };

        this.levelPadding = this.props.levelPadding || 20;
        this.mounted = true;

        this.loadFolders();
    }

    loadFolders() {
        return this.browseFolder('/')
            .then(folders => this.browseFolders([...this.state.expanded], folders))
            .then(folders => this.setState({folders}, () =>
                this.scrollToSelected()));
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
                        if (item.id === '0_userdata.0') {
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

    toggleFolder(id, e) {
        e && e.stopPropagation();
        const expanded = [...this.state.expanded];
        const pos = expanded.indexOf(id);
        if (pos === -1) {
            expanded.push(id);
            expanded.sort();
            window.localStorage.setItem('files.expanded', JSON.stringify(expanded));
            return this.browseFolder(id)
                .then(folders => this.setState({expanded, folders}));
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
        if (this.state.folders[item.id] && this.state.filterEmpty && !this.state.folders[item.id].length && item.id !== '0_userdata.0') {
            return null;
        }
        const Icon = expanded ? OpenedFolderIcon : ClosedFolderIcon;
        const padding = (item.level * this.levelPadding) || 5;
        return (<div key={item.id}
                     id={item.id}
                     style={{paddingLeft: padding}}
                     onClick={e => this.select(item.id, e)}
                     onDoubleClick={e => this.toggleFolder(item.id, e)}
                     title={item.title && typeof item.title === 'object' ? item.title[this.props.lang] : item.title || null}
                     className={clsx(this.props.classes['item' + this.state.viewType], this.props.classes['itemFolder' + this.state.viewType], this.state.selected === item.id && this.props.classes.itemSelected)}>
            <Icon className={ this.props.classes['itemFolderIcon' + this.state.viewType] } onClick={e => this.toggleFolder(item.id, e)}/>
            <div className={clsx(this.props.classes['itemName' + this.state.viewType], this.props.classes['itemNameFolder' + this.state.viewType])}>{ item.name }</div>
            <div className={this.props.classes['itemSize' + this.state.viewType]}>{ this.state.folders[item.id] ? this.state.folders[item.id].length : '' }</div>
            {this.formatAcl(item.acl)}
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
            style={{ paddingLeft: padding }}
            className={ clsx(this.props.classes['item' + this.state.viewType], this.props.classes['itemFile' + this.state.viewType], this.state.selected === item.id && this.props.classes.itemSelected) }
        >
            { ext === 'png' || ext === 'jpg' || ext === 'svg' ?
                <img onError={e => {e.target.onerror = null; e.target.src = NoImage}} className={this.props.classes['itemImage' + this.state.viewType]} src={'files/' + item.id} alt={item.name}/> : this.getFileIcon(ext)}
            <div className={this.props.classes['itemName' + this.state.viewType]}>{ item.name }</div>
            {this.formatSize(item.size)}
            {this.formatAcl(item.acl)}
        </div>);
    }

    renderItems(folderId) {
        if (this.state.folders[folderId]) {
            return this.state.folders[folderId].map(item => {
                const res = [];
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
        return <Toolbar variant="dense">
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
                title={this.props.t('Hide empty folders')}
                className={this.props.classes.menuButton}
                color={this.state.filterEmpty ? 'secondary' : 'inherit'}
                aria-label="filter empty"
                onClick={() => this.setState({folders: {}}, () => this.loadFolders())}
            ><RefreshIcon /></IconButton>
        </Toolbar>;
    }

    render() {
        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }
        return <Paper className={this.props.classes.root}>
            { this. renderToolbar() }
            <div className={this.props.classes.filesDiv}>
            { this.renderItems('/') }
            </div>
        </Paper>;

    }
}

Files.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(Files));