import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import Dropzone from 'react-dropzone';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

import IconRefresh from '@mui/icons-material/Refresh';
import IconUpload from '@mui/icons-material/UploadFile';
import IconDelete from '@mui/icons-material/Delete';
import IconPlay from '@mui/icons-material/PlayArrow';
import IconAudio from '@mui/icons-material/MusicNote';
import IconVideo from '@mui/icons-material/Videocam';
import IconText from '@mui/icons-material/Article';
import IconCode from '@mui/icons-material/Code';
import { FaFileUpload as UploadIcon } from 'react-icons/fa';

import Utils from './wrapper/Components/Utils';
import I18n from './wrapper/i18n';
import ConfirmDialog from './wrapper/Dialogs/Confirm';

import ConfigGeneric from './ConfigGeneric';

const styles = () => ({
    fullWidth: {
        width: '100%'
    },
    fullWidthOneButton: {
        width: 'calc(100% - 42px)'
    },
    fullWidthTwoButtons: {
        width: 'calc(100% - 84px)'
    },
    fullWidthThreeButtons: {
        width: 'calc(100% - 126x)'
    },
    dropZone: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    dropZoneEmpty: {

    },
    image: {
        objectFit: 'contain',
        margin: 'auto',
        display: 'flex',
        width: '100%',
        height: '100%',
    },

    uploadDiv: {
        position: 'relative',
        width: '100%',
    },
    uploadDivDragging: {
        opacity: 1,
        background: 'rgba(128,255,128,0.1)'
    },

    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: '100%',
        height: '100%',
        position: 'absolute',
        display: 'flex'
    },
    uploadCenterIcon: {
        paddingTop: 10,
        width: 48,
        height: 48,
    },
    uploadCenterText: {
        fontSize: 16,
    },
    uploadCenterTextAndIcon: {
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'

    },
    disabledOpacity: {
        opacity: 0.3,
        cursor: 'default'
    },
    error: {
        border: '2px solid red'
    },
    deleteButton: {

    },
    selectedImage: {
        height: 40,
        width: 40,
        display: 'inline-block',
        marginRight: 8,
    }
});

const IMAGE_EXT = ['jpg', 'jpeg', 'svg', 'png', 'webp'];
const AUDIO_EXT = ['mp3', 'ogg', 'wav', 'aac'];
const VIDEO_EXT = ['avi', 'mp4', 'mov'];
const DOC_EXT = ['txt', 'log', 'html', 'htm'];
const JS_EXT = ['json', 'js', 'ts'];

class ConfigFileSelector extends ConfigGeneric {
    constructor(props) {
        super(props);
        this.dropzoneRef = React.createRef();
        this.imagePrefix = this.props.imagePrefix === undefined ? './files' : this.props.imagePrefix;
    }

    componentDidMount() {
        super.componentDidMount();

        this.objectID = (this.props.schema.objectID || '0_userdata.0').replace('%INSTANCE%', this.props.instance);
        this.path = this.props.schema.upload;
        if (this.path) {
            if (this.path === '/') {
                this.path = '';
            } else {
                if (!this.path.endsWith('/')) {
                    this.path = this.path + '/';
                }
            }
        }

        // read files
        this.updateFiles()
            .then(() => {
                const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
                this.setState({ value });
            });
    }

    updateFiles() {
        return this.readFiles(this.props.schema.pattern)
            .then(files => this.setState({ files }));
    }

    async readFolder(folderName, files, filter) {
        try {
            const dirFiles = await this.props.socket.readDir(this.objectID, folderName.replace(/^\//, '') || null);
            for (let f = 0; f < dirFiles.length; f++) {
                const file = dirFiles[f];
                if (file.isDir) {
                    // read it
                    await this.readFolder(`${folderName + file.file}/`, files, filter);
                } else {
                    let ok = false;
                    if (filter === '*.*' && file.file.includes('.')) {
                        ok = true;
                    } else if (!filter || filter === '*') {
                        ok = true;
                    } else if (filter === '.*' && file.file.startsWith('.')) {
                        ok = true;
                    } else {
                        const regExp = new RegExp('^' + filter.replace(/\./g, '\\.').replace(/\*/g,'.*') + '$');
                        ok = regExp.test(file.file);
                    }

                    ok && files.push({ name: folderName + file.file, size: file.stats ? Utils.formatBytes(file.stats.size) : '--' })
                }
            }
        } catch (e) {
            console.error(`Cannot read "${folderName}": ${e}`);
        }

        return files;
    }

    async readFiles(pattern) {
        const files = [];
        pattern = pattern || this.props.schema.pattern;
        if (!pattern) {
            pattern = '**/*.*';
        }
        let filter;
        const pos = pattern.lastIndexOf('/');
        if (pos === -1) {
            filter = pattern;
        } else {
            filter = pattern.substring(pos + 1);
        }

        if (pattern.startsWith('**')) {
            // read all folders
            await this.readFolder('/', files, filter);
        } else {
            const pos = pattern.lastIndexOf('/');
            if (pos === -1) {
                await this.readFolder('/', files, filter);
            } else {
                const folder = pattern.substring(0, pos + 1);
                await this.readFolder(folder, files, filter);
            }
        }

        return files;
    }

    onDrop(acceptedFiles) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        const maxSize = this.props.schema.maxSize || (2 * 1024 * 1024);

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
            let ext = 'image/' + file.name.split('.').pop().toLowerCase();
            if (ext === 'image/jpg') {
                ext = 'image/jpeg';
            } else if (ext.includes('svg')) {
                ext = 'image/svg+xml';
            }
            if (file.size > maxSize) {
                return window.alert(I18n.t('File is too big. Max %sk allowed. Try use SVG.', Math.round(maxSize / 1024)));
            }
            const base64 = `data:${ext};base64,${btoa(
                new Uint8Array(reader.result)
                    .reduce((data, byte) => data + String.fromCharCode(byte), ''))}`;

            this.props.socket.writeFile64(this.objectID, this.path + file.name, base64)
                .then(() => this.updateFiles())
                .catch(e => window.alert('Cannot upload file: ' + e));
        };
        reader.readAsArrayBuffer(file);
    }

    renderDeleteDialog() {
        if (!this.state.deleteFile) {
            return null;
        }
        return <ConfirmDialog
            title={ I18n.t('ra_Are you sure?') }
            text={ I18n.t('ra_File will be deleted') }
            ok={ I18n.t('ra_Delete') }
            cancel={ I18n.t('ra_Cancel') }
            onClose={isOk => {
                const deleteFile = this.state.deleteFile;
                this.setState({deleteFile: false}, () => {
                    if (isOk) {
                        this.props.socket.deleteFile(this.objectID, deleteFile)
                            .then(() => this.updateFiles())
                            .catch(e => window.alert('Cannot delete file: ' + e));
                    }
                });
            }}
        />;
    }

    static base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    loadFile() {
        return this.props.socket.readFile(this.objectID, this.state.value, true);
    }

    play() {
        this.loadFile()
            .then(data => {
                if (typeof AudioContext !== 'undefined') {
                    const context = new AudioContext();
                    const buf = ConfigFileSelector.base64ToArrayBuffer(data.file);
                    context.decodeAudioData(buf, buffer => {
                        const source = context.createBufferSource(); // creates a sound source
                        source.buffer = buffer;                      // tell the source which sound to play
                        source.connect(context.destination);         // connect the source to the context's destination (the speakers)
                        source.start(0);
                    }, err => window.alert('Cannot play: ' + err));
                }
            });
    }

    getIcon(item) {
        if (!item || !item.extension) {
            return null;
        }
        if (IMAGE_EXT.includes(item.extension)) {
            return <div className={this.props.classes.selectedImage} style={{
                backgroundImage: `url(${this.imagePrefix}/${this.objectID}/${item.value})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
            }} />;
        } else if (AUDIO_EXT.includes(item.extension)) {
            return <IconAudio />;
        } else if (DOC_EXT.includes(item.extension)) {
            return <IconText />;
        } else if (VIDEO_EXT.includes(item.extension)) {
            return <IconVideo />;
        } else if (JS_EXT.includes(item.extension)) {
            return <IconCode />;
        }
        return null;
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.files) {
            return null;
        }
        let folders = [];
        if (!this.props.schema.withFolder) {
            this.state.files.forEach(file => {
                const pos = file.name.lastIndexOf('/');
                if (pos === -1) {
                    if (!folders.includes('/')) {
                        folders.push('/');
                    }
                } else {
                    const folder = file.name.substring(0, pos + 1);
                    if (!folders.includes(folder)) {
                        folders.push(folder);
                    }
                }
            });
        }

        const selectOptions = this.state.files
            .map(file => ({
                value: file.name,
                label: !this.props.schema.withFolder && folders.length === 1 ? `${file.name.substring(folders[0].length)}` : `${file.name}` + (this.props.schema.noSize ? '' : `(${file.size})`),
                extension: file.name.toLowerCase().split('.').pop(),
            }));

        if (!this.props.schema.noNone) {
            selectOptions.unshift({label: I18n.t('ra_none'), value: ''});
        }

        // eslint-disable-next-line
        const item = selectOptions.find(item => item.value === this.state.value);

        let buttons = 0;

        if (this.props.schema.upload) {
            buttons++;
        }
        if (this.props.schema.refresh) {
            buttons++;
        }
        let play = this.state.value && (this.state.value.endsWith('.mp3') || this.state.value.endsWith('.ogg') || this.state.value.endsWith('.wav'));
        // show play button
        if (play) {
            buttons++;
        }

        const element = <div className={this.props.classes.fullWidth}>
            <FormControl variant="standard" style={{width: `calc(100% - ${buttons * 42}px)`}}>
                <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                <Select
                    variant="standard"
                    error={!!error}
                    disabled={!!disabled}
                    value={this.state.value || '_'}
                    renderValue={val => {
                        return <>{this.getIcon(item)}<span>{item?.label || ''}</span></>
                    }}
                    onChange={e => {
                        this.setState({value: e.target.value === '_' ? '' : e.target.value}, () =>
                            this.onChange(this.props.attr, this.state.value));
                    }}
                >
                    {selectOptions.map(item => {
                        return <MenuItem key={item.value} value={item.value}>
                            <ListItemIcon>{this.getIcon(item)}</ListItemIcon>
                            <ListItemText>{item.label}</ListItemText>
                            {this.props.schema.delete && item.value ?
                                <IconButton className={this.props.classes.deleteButton} size="small"
                                            onClick={() => this.setState({deleteFile: item.value})}><IconDelete/></IconButton> : null}
                        </MenuItem>;
                    })}
                </Select>
                {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
            </FormControl>
            { this.props.schema.refresh && <IconButton onClick={() => this.updateFiles()}><IconRefresh /></IconButton> }
            { this.props.schema.upload && <IconButton onClick={() => this.dropzoneRef.current?.open()}><IconUpload /></IconButton> }
            { play && <IconButton style={{ color: '#00FF00' }} onClick={() => this.play()}><IconPlay /></IconButton> }
        </div>;

        if (!this.props.schema.upload) {
            return <>{element}{this.renderDeleteDialog()}</>;
        } else {
            let accept = {'*/*': []};
            if (this.props.schema.pattern) {
                const last = this.props.schema.pattern.split('/').pop().toLowerCase().replace(/.*\./, '');
                if (last === 'png' || last === 'jpg' || last === 'svg') {
                    accept = {
                        'image/*': ['.png', '.jpg', '.svg']
                    };
                } else if (last === 'mp3' || last === 'ogg' || last === 'wav') {
                    accept = {
                        'audio/*': ['.mp3', '.ogg', '.wav', '.mp4']
                    };
                } else if (last === 'ics') {
                    accept = {
                        'text/calendar': ['.mp3', '.ogg', '.wav', '.mp4']
                    };
                } else if (last === 'txt') {
                    accept = {
                        'text/plain': ['.txt']
                    };
                } else if (last === 'pem') {
                    accept = {
                        'text/plain': ['.pem']
                    };
                } else if (last === 'pem') {
                    accept = {
                        '*/*': ['.' + last]
                    };
                }
            }

            return <Dropzone
                ref={this.dropzoneRef}
                multiple={false}
                accept={accept}
                noKeyboard
                noClick
                maxSize={this.props.schema.maxSize || 2 * 1024 * 1024}
                onDragEnter={() => {
                    this.setState({ uploadFile: 'dragging' });
                }}
                onDragLeave={() => this.setState({ uploadFile: true })}
                onDrop={(acceptedFiles, errors) => {
                    this.setState({ uploadFile: false });
                    if (!acceptedFiles.length) {
                        window.alert((errors && errors[0] && errors[0].errors && errors[0].errors[0] && errors[0].errors[0].message) || I18n.t('Cannot upload'));
                    } else {
                        return this.onDrop(acceptedFiles);
                    }
                }}
            >
                {({ getRootProps, getInputProps }) => <div
                    className={Utils.clsx(
                        this.props.classes.uploadDiv,
                        this.state.uploadFile === 'dragging' && this.props.classes.uploadDivDragging,
                        disabled && this.props.classes.disabledOpacity,
                    )}
                    {...getRootProps()}
                >
                    <input {...getInputProps()} />
                    {this.state.uploadFile === 'dragging' ? <div className={Utils.clsx(this.props.classes.uploadCenterDiv, this.state.uploadError && this.props.classes.error)}>
                        <div className={this.props.classes.uploadCenterTextAndIcon}>
                            <UploadIcon className={this.props.classes.uploadCenterIcon} />
                            <div className={this.props.classes.uploadCenterText}>{
                                this.state.uploadFile === 'dragging' ? I18n.t('ra_Drop file here') :
                                    I18n.t('ra_Place your files here or click here to open the browse dialog')}</div>
                        </div>
                    </div> : null}
                    {element}
                    {this.renderDeleteDialog()}
                </div>}
            </Dropzone>;
        }
    }
}

ConfigFileSelector.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    imagePrefix: PropTypes.func,
};

export default withStyles(styles)(ConfigFileSelector);