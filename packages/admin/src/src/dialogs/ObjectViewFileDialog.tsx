import React, { Component } from 'react';
import type { Styles } from '@mui/styles';
import { withStyles } from '@mui/styles';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
} from '@mui/material';

// Icons
import {
    Close as CloseIcon,
    PlayArrow as PlayIcon,
    GetApp as DownloadIcon,
} from '@mui/icons-material';

import type { AdminConnection } from '@iobroker/adapter-react-v5';
import { withWidth } from '@iobroker/adapter-react-v5';

import type { Theme, Translator } from '@iobroker/adapter-react-v5/types';
import type { ioBrokerObject } from '@/types';
import Utils from '../components/Utils';

const styles: Styles<Theme, any> = theme => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
    tabPanel: {
        width: '100%',
        overflow: 'hidden',
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
    },
    error: {
        color: theme.palette.mode === 'dark' ? '#ff7777' : '#c20000',
    },
    image: {
        height: '100%',
        width: 'auto',
    },
    text: {
        fontFamily: 'Lucida Console, Courier, monospace',
        width: '100%',
    },
    download: {
        textDecoration: 'none',
        textTransform: 'uppercase',
        fontSize: 14,
        color: 'white',
        border: '1px solid white',
        borderRadius: 5,
        padding: '8px 16px',
        marginRight: theme.spacing(1),
    },
});

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code: ['js', 'json'],
    txt: ['log', 'txt', 'html', 'css', 'xml'],
};

interface ObjectViewFileDialogProps {
    t: Translator;
    socket: AdminConnection;
    obj: ioBrokerObject;
    onClose: () => void;
    classes: Record<string, string>;
}

interface ObjectViewFileDialogState {
    error: string;
    image: boolean;
    text: string | null;
    binary: string | null;
    fileName: string;
    mime?: string;
    audio?: boolean;
}

class ObjectViewFileDialog extends Component<ObjectViewFileDialogProps, ObjectViewFileDialogState> {
    audioRef: React.RefObject<HTMLAudioElement>;

    constructor(props: ObjectViewFileDialogProps) {
        super(props);

        const parts = this.props.obj._id.split('.');

        this.state = {
            error: '',
            image: null,
            text: null,
            binary: null,
            fileName: `${parts[parts.length - 2]}.${parts[parts.length - 1]}`,
        };

        this.audioRef = React.createRef();
    }

    componentDidMount() {
        this.props.socket.getBinaryState(this.props.obj._id)
            .then((data: string) => {
                let ext = this.props.obj._id.toLowerCase().split('.').pop();

                const detectedMimeType = Utils.detectMimeType(data);
                if (detectedMimeType) {
                    ext = detectedMimeType;
                }

                if (ext === 'jpg') {
                    this.setState({ image: true, binary: data, mime: 'image/jpeg' });
                } else if (ext === 'svg') {
                    this.setState({ image: true, binary: data, mime: 'image/svg+xml' });
                } else if (ext === 'png' || ext === 'bmp') {
                    this.setState({ image: true, binary: data, mime: `image/${ext}` });
                } else if (ext === 'mp3') {
                    this.setState({ audio: true, binary: data, mime: 'audio/mpeg' });
                } else if (ext === 'ogg') {
                    this.setState({ audio: true, binary: data, mime: 'audio/ogg' });
                } else if (ext === 'txt' || ext === 'log') {
                    try {
                        const text = btoa(data);
                        this.setState({ text, binary: data, mime: 'text/plain' });
                    } catch (error) {
                        // ignore
                    }
                }
            })
            .catch(error => this.setState({ error }));
    }

    render() {
        return <Dialog
            className={this.props.classes.dialog}
            open={!0}
            maxWidth={this.state.audio ? 'sm' : 'md'}
            onClose={() => this.props.onClose()}
            fullWidth
            aria-labelledby="object-view-dialog-title"
        >
            <DialogTitle id="object-view-dialog-title">
                {
                    this.props.t('View file in state: %s', this.props.obj._id)
                }
            </DialogTitle>
            <DialogContent className={this.props.classes.content}>
                { this.state.error ? <div className={this.props.classes.error}>{this.state.error === 'State is not binary' ? this.props.t('No file stored yet') : this.props.t(this.state.error)}</div> : null}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                { this.state.audio ? <audio ref={this.audioRef} src={`data:${this.state.mime};base64,${this.state.binary}`} /> : null }
                { this.state.audio ? <Fab color="primary" onClick={() => this.audioRef.current && this.audioRef.current.play()}>
                    <PlayIcon />
                </Fab> : null }
                { this.state.image ? <img src={`data:${this.state.mime};base64,${this.state.binary}`} alt={this.props.obj._id} className={this.props.classes.image} /> : null}
                { this.state.text !== null ? <pre className={this.props.classes.text}>{this.state.text}</pre> : null}
            </DialogContent>
            <DialogActions>
                <a className={this.props.classes.download} download={this.state.fileName} href={`data:${this.state.mime};base64,${this.state.binary}`}>
                    <DownloadIcon style={{ paddingRight: 8, height: 12 }} />
                    <span>{this.props.t('Download')}</span>
                </a>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    startIcon={<CloseIcon />}
                    color="grey"
                >
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withWidth()(withStyles(styles)(ObjectViewFileDialog));
