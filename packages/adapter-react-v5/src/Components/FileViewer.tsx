// File viewer in adapter-react does not support write
// import { Buffer } from 'buffer';
import React, { Component, type JSX } from 'react';

import { TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';

// Icons
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Brightness6 as Brightness5Icon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';

import type { Connection } from '@iobroker/socket-client';

import { IconNoIcon } from '../icons/IconNoIcon';
import { withWidth } from './withWidth';
import { Utils } from './Utils';
import type { ThemeType, Translate } from '../types';
import { Icon } from './Icon';

const styles: Record<string, React.CSSProperties> = {
    dialog: {
        height: '100%',
    },
    paper: {
        height: 'calc(100% - 64px)',
    },
    content: {
        textAlign: 'center',
    },
    textarea: {
        width: '100%',
        height: '100%',
    },
    img: {
        width: 'auto',
        height: 'calc(100% - 5px)',
        objectFit: 'contain',
    },
    dialogTitle: {
        justifyContent: 'space-between',
        display: 'flex',
    },
};

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg', 'bmp', 'gif', 'apng', 'avif', 'webp', 'ico'],
    code: ['js', 'json', 'json5', 'md'],
    txt: ['log', 'txt', 'html', 'css', 'xml', 'ics'],
    audio: ['mp3', 'wav', 'ogg', 'acc'],
    video: ['mp4', 'mov', 'avi'],
};

function bufferToBase64(buffer: Buffer, isFull?: boolean): string {
    let binary = '';
    const bytes = new Uint8Array((buffer as unknown as { data: number[]; type: 'Buffer' })?.data || buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len && (isFull || i < 50); i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export interface FileViewerProps {
    /** Translation function */
    t: Translate;
    /** Callback when the viewer is closed. */
    onClose: () => void;
    /** The URL (file path) to the file to be displayed. */
    href: string;
    formatEditFile?: string;
    socket: Connection;
    setStateBackgroundImage: () => void;
    themeType: ThemeType;
    getStyleBackgroundImage: () => React.CSSProperties | null;
    /** Flag is the js-controller support subscribe on file */
    supportSubscribes?: boolean;
}

export interface FileViewerState {
    text: string | null;
    code: string | null;
    ext: string | null;
    editing: boolean;
    editingValue: string | null;
    copyPossible: boolean;
    forceUpdate: number;
    changed: boolean;
    imgError: boolean;
}

export class FileViewerClass extends Component<FileViewerProps, FileViewerState> {
    private timeout: ReturnType<typeof setTimeout> | null = null;

    constructor(props: FileViewerProps) {
        super(props);
        const ext = Utils.getFileExtension(props.href);

        this.state = {
            text: null,
            code: null,
            ext,
            // File viewer in adapter-react does not support write
            editing: /* !!this.props.formatEditFile || */ false,
            editingValue: null,
            copyPossible: !!ext && (EXTENSIONS.code.includes(ext) || EXTENSIONS.txt.includes(ext)),
            forceUpdate: Date.now(),
            changed: false,
            imgError: false,
        };
    }

    readFile(): void {
        if (this.props.href) {
            const parts = this.props.href.split('/');
            parts.splice(0, 2);
            const adapter = parts[0];
            const name = parts.splice(1).join('/');

            this.props.socket
                .readFile(adapter, name)
                .then((data: { file: string | Buffer; mimeType: string }) => {
                    let fileData: string | Buffer = '';
                    if (data.file !== undefined) {
                        fileData = (data as { file: string; mimeType: string }).file;
                    }

                    const newState: Partial<FileViewerState> = {
                        copyPossible: this.state.copyPossible,
                        ext: this.state.ext,
                    };
                    // try to detect valid extension
                    if ((fileData as unknown as { data: Buffer; type: string }).type === 'Buffer') {
                        if (name.toLowerCase().endsWith('.json5')) {
                            newState.ext = 'json5';
                            newState.copyPossible = true;
                            try {
                                fileData = atob(bufferToBase64(fileData as unknown as Buffer, true));
                            } catch {
                                console.error('Cannot convert base64 to string');
                                fileData = '';
                            }
                        } else {
                            const ext = Utils.detectMimeType(bufferToBase64(fileData as unknown as Buffer));
                            if (ext) {
                                newState.ext = ext;
                                newState.copyPossible = EXTENSIONS.code.includes(ext) || EXTENSIONS.txt.includes(ext);
                            }
                        }
                    }

                    if (newState.copyPossible) {
                        if (newState.ext && EXTENSIONS.txt.includes(newState.ext)) {
                            newState.text = fileData;
                            newState.editingValue = fileData;
                        } else if (newState.ext && EXTENSIONS.code.includes(newState.ext)) {
                            newState.code = fileData;
                            newState.editingValue = fileData;
                        }
                    }

                    this.setState(newState as FileViewerState);
                })
                .catch(e => window.alert(`Cannot read file: ${e}`));
        }
    }

    componentDidMount(): void {
        this.readFile();

        const parts = this.props.href.split('/');
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');

        if (this.props.supportSubscribes) {
            this.props.socket
                .subscribeFiles(adapter, name, this.onFileChanged)
                .catch(e => window.alert(`Cannot subscribe on file: ${e}`));
        }
    }

    componentWillUnmount(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        const parts = this.props.href.split('/');
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');
        if (this.props.supportSubscribes) {
            this.props.socket
                .subscribeFiles(adapter, name, this.onFileChanged)
                .catch(e => window.alert(`Cannot subscribe on file: ${e}`));
        }
    }

    onFileChanged = (_id: string, _fileName: string, size: number | null): void => {
        if (!this.state.changed) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.timeout = null;
                if (size === null) {
                    window.alert('Show file was deleted!');
                } else if (this.state.text !== null || this.state.code !== null) {
                    this.readFile();
                } else {
                    this.setState({ forceUpdate: Date.now() });
                }
            }, 300);
        }
    };

    getEditorOrViewer(): JSX.Element {
        return (
            <TextField
                variant="standard"
                style={styles.textarea}
                multiline
                value={this.state.editingValue || this.state.code || this.state.text}
                // onChange={newValue => this.setState({ editingValue: newValue, changed: true })}
                slotProps={{
                    htmlInput: {
                        readOnly: !this.state.editing,
                    },
                }}
            />
        );
    }

    getContent(): React.JSX.Element | null {
        if (this.state.ext && EXTENSIONS.images.includes(this.state.ext)) {
            if (this.state.imgError) {
                return <IconNoIcon style={{ ...styles.img, ...this.props.getStyleBackgroundImage() }} />;
            }
            return (
                <Icon
                    onError={e => {
                        (e.target as HTMLImageElement).onerror = null;
                        this.setState({ imgError: true });
                    }}
                    style={{ ...styles.img, ...this.props.getStyleBackgroundImage() }}
                    src={`${this.props.href}?ts=${this.state.forceUpdate}`}
                    alt={this.props.href}
                />
            );
        }
        if (this.state.ext && EXTENSIONS.audio.includes(this.state.ext)) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <audio
                        style={{ width: '100%' }}
                        src={this.props.href}
                        controls
                    ></audio>
                </div>
            );
        }
        if (this.state.ext && EXTENSIONS.video.includes(this.state.ext)) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <video
                        style={{ width: '100%', height: '100%' }}
                        controls
                    >
                        <source
                            src={this.props.href}
                            type={`video/${this.state.ext}}`}
                        />
                    </video>
                </div>
            );
        }
        if (this.state.code !== null || this.state.text !== null || this.state.editing) {
            // File viewer in adapter-react does not support write
            // return <Editor
            //     mode={this.getEditFile(this.props.formatEditFile)}
            //     themeType={this.props.themeType}
            //     value={this.state.editingValue || this.state.code || this.state.text}
            //     onChange={this.state.editing ? newValue => this.setState({ editingValue: newValue, changed: true }) : undefined}
            // />;
            return this.getEditorOrViewer();
        }
        return null;
    }

    // eslint-disable-next-line class-methods-use-this
    onSave(): void {
        // Do nothing as the file viewer in adapter-react does not support writing
    }

    render(): JSX.Element {
        return (
            <Dialog
                sx={{
                    '&.MuiDialog-scrollPaper': styles.dialog,
                    '& .MuiDialog-paper': styles.paper,
                }}
                scroll="paper"
                open={!!this.props.href}
                onClose={() => this.props.onClose()}
                fullWidth
                maxWidth="xl"
                aria-labelledby="ar_dialog_file_view_title"
            >
                <div style={styles.dialogTitle}>
                    <DialogTitle id="ar_dialog_file_view_title">{`${this.props.t(this.state.editing ? 'Edit' : 'View')}: ${this.props.href}`}</DialogTitle>
                    {this.state.ext && EXTENSIONS.images.includes(this.state.ext) && (
                        <div>
                            <IconButton
                                size="large"
                                color="inherit"
                                onClick={this.props.setStateBackgroundImage}
                            >
                                <Brightness5Icon />
                            </IconButton>
                        </div>
                    )}
                </div>
                <DialogContent style={styles.content}>{this.getContent()}</DialogContent>
                <DialogActions>
                    {this.state.copyPossible ? (
                        <Button
                            color="grey"
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                Utils.copyToClipboard(this.state.text || this.state.code || '');
                            }}
                            startIcon={<CopyIcon />}
                        >
                            {this.props.t('Copy content')}
                        </Button>
                    ) : null}
                    {this.state.editing ? (
                        <Button
                            color="grey"
                            disabled={
                                this.state.editingValue === this.state.code ||
                                this.state.editingValue === this.state.text
                            }
                            variant="contained"
                            onClick={() => this.onSave()}
                            startIcon={<SaveIcon />}
                        >
                            {this.props.t('Save')}
                        </Button>
                    ) : null}
                    <Button
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        color="primary"
                        startIcon={<CloseIcon />}
                    >
                        {this.props.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
export const FileViewer = withWidth()(FileViewerClass);
