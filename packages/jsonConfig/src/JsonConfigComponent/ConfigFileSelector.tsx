import React, { type JSX } from 'react';
import Dropzone, { type DropzoneRef } from 'react-dropzone';

import {
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
    IconButton,
    ListItemText,
    ListItemIcon,
} from '@mui/material';

import {
    Refresh as IconRefresh,
    UploadFile as IconUpload,
    Delete as IconDelete,
    PlayArrow as IconPlay,
    MusicNote as IconAudio,
    Videocam as IconVideo,
    Article as IconText,
    Code as IconCode,
} from '@mui/icons-material';
import { FaFileUpload as UploadIcon } from 'react-icons/fa';

import { DialogConfirm, Utils, I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemFileSelector } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    fullWidthOneButton: {
        width: 'calc(100% - 42px)',
    },
    fullWidthTwoButtons: {
        width: 'calc(100% - 84px)',
    },
    fullWidthThreeButtons: {
        width: 'calc(100% - 126x)',
    },
    dropZone: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    dropZoneEmpty: {},
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
        background: 'rgba(128,255,128,0.1)',
    },
    uploadCenterDiv: {
        margin: 5,
        border: '3px dashed grey',
        borderRadius: 5,
        width: '100%',
        height: '100%',
        position: 'absolute',
        display: 'flex',
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
        justifyContent: 'center',
    },
    disabledOpacity: {
        opacity: 0.3,
        cursor: 'default',
    },
    error: {
        border: '2px solid red',
    },
    deleteButton: {},
    selectedImage: {
        height: 40,
        width: 40,
        display: 'inline-block',
        marginRight: 8,
    },
};

const IMAGE_EXT = ['jpg', 'jpeg', 'svg', 'png', 'webp', 'gif', 'apng', 'avif', 'webp'];
const AUDIO_EXT = ['mp3', 'ogg', 'wav', 'aac'];
const VIDEO_EXT = ['avi', 'mp4', 'mov'];
const DOC_EXT = ['txt', 'log', 'html', 'htm'];
const JS_EXT = ['json', 'js', 'ts'];

interface ConfigFileSelectorProps extends ConfigGenericProps {
    schema: ConfigItemFileSelector;
}

interface ConfigFileSelectorState extends ConfigGenericState {
    uploadFile?: boolean | 'dragging';
    uploadError?: boolean;
    files?: { name: string; size: string }[];
    deleteFile?: string;
}

class ConfigFileSelector extends ConfigGeneric<ConfigFileSelectorProps, ConfigFileSelectorState> {
    private readonly dropzoneRef: React.RefObject<DropzoneRef>;

    private readonly imagePrefix: string;

    private objectID: string;

    private path: string;

    constructor(props: ConfigFileSelectorProps) {
        super(props);
        this.dropzoneRef = React.createRef();
        this.imagePrefix = this.props.imagePrefix === undefined ? './files' : this.props.imagePrefix;
    }

    componentDidMount(): void {
        super.componentDidMount();

        this.objectID = (this.props.schema.objectID || '0_userdata.0').replace(
            '%INSTANCE%',
            (this.props.instance || 0).toString(),
        );
        this.path = this.props.schema.upload;
        if (this.path) {
            if (this.path === '/') {
                this.path = '';
            } else if (!this.path.endsWith('/')) {
                this.path = `${this.path}/`;
            }
        }

        // read files
        void this.updateFiles().then(() => {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            this.setState({ value });
        });
    }

    updateFiles(): Promise<void> {
        return this.readFiles(this.props.schema.pattern).then(files => this.setState({ files }));
    }

    async readFolder(
        folderName: string,
        files: { name: string; size: string }[],
        filter: string,
    ): Promise<{ name: string; size: string }[]> {
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
                        const regExp = new RegExp(`^${filter.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
                        ok = regExp.test(file.file);
                    }

                    if (ok) {
                        files.push({
                            name: folderName + file.file,
                            size: file.stats ? Utils.formatBytes(file.stats.size) : '--',
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Cannot read "${folderName}": ${e}`);
        }

        return files;
    }

    async readFiles(pattern: string): Promise<{ name: string; size: string }[]> {
        const files: { name: string; size: string }[] = [];
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
            const pos_ = pattern.lastIndexOf('/');
            if (pos_ === -1) {
                await this.readFolder('/', files, filter);
            } else {
                const folder = pattern.substring(0, pos_ + 1);
                await this.readFolder(folder, files, filter);
            }
        }

        return files;
    }

    onDrop(acceptedFiles: File[]): void {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        const maxSize = this.props.schema.maxSize || 2 * 1024 * 1024;

        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
            let ext = `image/${file.name.split('.').pop().toLowerCase()}`;
            if (ext === 'image/jpg') {
                ext = 'image/jpeg';
            } else if (ext.includes('svg')) {
                ext = 'image/svg+xml';
            }
            if (file.size > maxSize) {
                window.alert(I18n.t('File is too big. Max %sk allowed. Try use SVG.', Math.round(maxSize / 1024)));
                return;
            }
            const base64 = `data:${ext};base64,${btoa(
                new Uint8Array(reader.result as ArrayBufferLike).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    '',
                ),
            )}`;

            this.props.socket
                .writeFile64(this.objectID, this.path + file.name, base64)
                .then(() => this.updateFiles())
                .catch(e => window.alert(`Cannot upload file: ${e}`));
        };
        reader.readAsArrayBuffer(file);
    }

    renderDeleteDialog(): JSX.Element | null {
        if (!this.state.deleteFile) {
            return null;
        }
        return (
            <DialogConfirm
                title={I18n.t('ra_Are you sure?')}
                text={I18n.t('ra_File will be deleted')}
                ok={I18n.t('ra_Delete')}
                cancel={I18n.t('ra_Cancel')}
                onClose={isOk => {
                    const deleteFile = this.state.deleteFile;
                    this.setState({ deleteFile: '' }, () => {
                        if (isOk) {
                            this.props.socket
                                .deleteFile(this.objectID, deleteFile)
                                .then(() => this.updateFiles())
                                .catch(e => window.alert(`Cannot delete file: ${e}`));
                        }
                    });
                }}
            />
        );
    }

    static base64ToArrayBuffer(base64: string): ArrayBufferLike {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    loadFile(): Promise<{ file: string; mimeType: string }> {
        return this.props.socket.readFile(this.objectID, this.state.value, true);
    }

    play(): void {
        void this.loadFile().then(data => {
            if (typeof AudioContext !== 'undefined') {
                const context = new AudioContext();
                const buf = ConfigFileSelector.base64ToArrayBuffer(data.file);
                void context.decodeAudioData(
                    buf,
                    (buffer: AudioBuffer): void => {
                        const source = context.createBufferSource(); // creates a sound source
                        source.buffer = buffer; // tell the source which sound to play
                        source.connect(context.destination); // connect the source to the context's destination (the speakers)
                        source.start(0);
                    },
                    (err: DOMException): void => window.alert(`Cannot play: ${err.message}`),
                );
            }
        });
    }

    getFileIcon(item: { value: string; label: string; extension?: string }): JSX.Element | null {
        if (!item?.extension) {
            return null;
        }
        if (IMAGE_EXT.includes(item.extension)) {
            return (
                <div
                    style={{
                        ...styles.selectedImage,
                        backgroundImage: `url(${this.imagePrefix}/${this.objectID}/${item.value})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            );
        }
        if (AUDIO_EXT.includes(item.extension)) {
            return <IconAudio />;
        }
        if (DOC_EXT.includes(item.extension)) {
            return <IconText />;
        }
        if (VIDEO_EXT.includes(item.extension)) {
            return <IconVideo />;
        }
        if (JS_EXT.includes(item.extension)) {
            return <IconCode />;
        }
        return null;
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */): JSX.Element | null {
        if (!this.state.files) {
            return null;
        }
        const folders: string[] = [];
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

        const selectOptions: { value: string; label: string; extension?: string }[] = this.state.files.map(file => ({
            value: file.name,
            label:
                !this.props.schema.withFolder && folders.length === 1
                    ? `${file.name.substring(folders[0].length)}`
                    : `${file.name}${this.props.schema.noSize ? '' : `(${file.size})`}`,
            extension: file.name.toLowerCase().split('.').pop(),
        }));

        if (!this.props.schema.noNone) {
            selectOptions.unshift({ label: I18n.t('ra_none'), value: '' });
        }

        const item: { value: string; label: string; extension?: string } = selectOptions.find(
            _item => _item.value === this.state.value,
        );

        let buttons = 0;

        if (this.props.schema.upload) {
            buttons++;
        }
        if (this.props.schema.refresh) {
            buttons++;
        }
        const play =
            this.state.value &&
            (this.state.value.endsWith('.mp3') ||
                this.state.value.endsWith('.ogg') ||
                this.state.value.endsWith('.wav'));
        // show play button
        if (play) {
            buttons++;
        }

        const element = (
            <div style={styles.fullWidth}>
                <FormControl
                    variant="standard"
                    style={{ width: `calc(100% - ${buttons * 42}px)` }}
                >
                    {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
                    <Select
                        variant="standard"
                        error={!!error}
                        disabled={!!disabled}
                        value={this.state.value || '_'}
                        renderValue={() => (
                            <>
                                {this.getFileIcon(item)}
                                <span>{item?.label || ''}</span>
                            </>
                        )}
                        onChange={e => {
                            this.setState({ value: e.target.value === '_' ? '' : e.target.value }, () =>
                                this.onChange(this.props.attr, this.state.value),
                            );
                        }}
                    >
                        {selectOptions.map(it => (
                            <MenuItem
                                key={it.value}
                                value={it.value}
                            >
                                <ListItemIcon>{this.getFileIcon(it)}</ListItemIcon>
                                <ListItemText>{it.label}</ListItemText>
                                {this.props.schema.delete && item.value ? (
                                    <IconButton
                                        style={styles.deleteButton}
                                        size="small"
                                        onClick={() => this.setState({ deleteFile: item.value })}
                                    >
                                        <IconDelete />
                                    </IconButton>
                                ) : null}
                            </MenuItem>
                        ))}
                    </Select>
                    {this.props.schema.help ? (
                        <FormHelperText>
                            {this.renderHelp(
                                this.props.schema.help,
                                this.props.schema.helpLink,
                                this.props.schema.noTranslation,
                            )}
                        </FormHelperText>
                    ) : null}
                </FormControl>
                {this.props.schema.refresh && (
                    <IconButton onClick={() => this.updateFiles()}>
                        <IconRefresh />
                    </IconButton>
                )}
                {this.props.schema.upload && (
                    <IconButton onClick={() => this.dropzoneRef.current?.open()}>
                        <IconUpload />
                    </IconButton>
                )}
                {play && (
                    <IconButton
                        style={{ color: '#00FF00' }}
                        onClick={() => this.play()}
                    >
                        <IconPlay />
                    </IconButton>
                )}
            </div>
        );

        if (!this.props.schema.upload) {
            return (
                <>
                    {element}
                    {this.renderDeleteDialog()}
                </>
            );
        }
        let accept: Record<string, string[]> = { '*/*': [] };
        if (this.props.schema.fileTypes === 'image') {
            accept = {
                'image/*': ['.png', '.jpg', '.svg', '.gif', '.apng', '.avif', '.webp'],
            };
        } else if (this.props.schema.fileTypes === 'audio') {
            accept = {
                'audio/*': ['.mp3', '.ogg', '.wav', '.mp4'],
            };
        } else if (this.props.schema.fileTypes === 'text') {
            accept = {
                'text/plain': ['.txt'],
            };
        }
        if (this.props.schema.pattern) {
            const last = this.props.schema.pattern.split('/').pop().toLowerCase().replace(/.*\./, '');
            if (
                last === 'png' ||
                last === 'jpg' ||
                last === 'svg' ||
                last === 'gif' ||
                last === 'apng' ||
                last === 'avif' ||
                last === 'webp'
            ) {
                accept = {
                    'image/*': ['.png', '.jpg', '.svg', '.gif', '.apng', '.avif', '.webp'],
                };
            } else if (last === 'mp3' || last === 'ogg' || last === 'wav') {
                accept = {
                    'audio/*': ['.mp3', '.ogg', '.wav', '.mp4'],
                };
            } else if (last === 'ics') {
                accept = {
                    'text/calendar': ['.ics'],
                };
            } else if (last === 'txt') {
                accept = {
                    'text/plain': ['.txt'],
                };
            } else if (last === 'pem') {
                accept = {
                    'text/plain': ['.pem'],
                };
            } else {
                accept = {
                    '*/*': [`.${last}`],
                };
            }
        }

        return (
            <Dropzone
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
                        window.alert(
                            (errors &&
                                errors[0] &&
                                errors[0].errors &&
                                errors[0].errors[0] &&
                                errors[0].errors[0].message) ||
                                I18n.t('Cannot upload'),
                        );
                    } else {
                        this.onDrop(acceptedFiles);
                    }
                }}
            >
                {({ getRootProps, getInputProps }) => (
                    <div
                        style={{
                            ...styles.uploadDiv,
                            ...(this.state.uploadFile === 'dragging' ? styles.uploadDivDragging : undefined),
                            ...(disabled ? styles.disabledOpacity : undefined),
                        }}
                        {...getRootProps()}
                    >
                        <input {...getInputProps()} />
                        {this.state.uploadFile === 'dragging' ? (
                            <div
                                style={{
                                    ...styles.uploadCenterDiv,
                                    ...(this.state.uploadError ? styles.error : undefined),
                                }}
                            >
                                <div style={styles.uploadCenterTextAndIcon}>
                                    <UploadIcon style={styles.uploadCenterIcon} />
                                    <div style={styles.uploadCenterText}>
                                        {this.state.uploadFile === 'dragging'
                                            ? I18n.t('ra_Drop file here')
                                            : I18n.t(
                                                  'ra_Place your files here or click here to open the browse dialog',
                                              )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {element}
                        {this.renderDeleteDialog()}
                    </div>
                )}
            </Dropzone>
        );
    }
}

export default ConfigFileSelector;
