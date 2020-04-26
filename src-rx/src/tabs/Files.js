import withWidth from "@material-ui/core/withWidth";
import {withStyles} from "@material-ui/core/styles";
import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';

// Icons
import {FaFolderOpen as OpenedFolderIcon} from 'react-icons/fa'
import {FaFolder as ClosedFolderIcon} from 'react-icons/fa'

const styles = theme => ({
    root: {
        height: '100%'
    },
    fileIcon: {
        width: 24,
        maxHeight: 24,
    }
});

class Files extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewType: 'table',
            folders: {},
            expanded: [],
        };

        this.levelPadding = this.props.levelPadding || 20;

        this.browseFolder('/');
    }

    browseFolder(folderId) {
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

                const newFolders = {};
                Object.keys(this.state.folders).forEach(folder => newFolders[folder] = this.state.folders[folder]);
                newFolders[folderId || '/'] = _folders;

                this.setState({folders: newFolders});
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
                const newFolders = {};
                Object.keys(this.state.folders).forEach(folder => newFolders[folder] = this.state.folders[folder]);
                newFolders[folderId] = _folders;
                this.setState({folders: newFolders});
            });
        }
    }

    toggleFolder(id) {
        const expanded = [...this.state.expanded];
        const pos = expanded.indexOf(id);
        if (pos === -1) {
            expanded.push(id);
            if (!this.state.folders[id]) {
                this.browseFolder(id);
            }
        } else {
            expanded.splice(pos, 1);
        }
        this.setState({expanded});
    }

    renderFolder(item, expanded) {
        return (<div key={item.id}
                     style={{paddingLeft: item.level * this.levelPadding}}
                     onClick={() => this.toggleFolder(item.id)}
                     title={item.title && typeof item.title === 'object' ? item.title[this.props.lang] : item.title || null}
                     className={clsx(this.props.classes['item' + this.state.viewType], this.props.classes.folder)}>
            {!expanded ? (<ClosedFolderIcon className={ this.props.classes.folderIcon }/>) : (<OpenedFolderIcon className={ this.props.classes.folderIcon }/>)}
            { item.name }
        </div>);
    }

    renderFile(item) {
        return (<div key={item.id} style={{paddingLeft: item.level * this.levelPadding}} className={clsx(this.props.classes['item' + this.state.viewType], this.props.classes.file)}>
            { item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.svg') ? <img className={clsx(this.props.classes.fileIcon)} src={'files/' + item.id} alt={item.name}/> : null}
            { item.name }
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

    render() {
        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }
        return this.renderItems('/');
    }
}

Files.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    ready: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(Files));