import React from 'react';

import {
    Button,
    TextField,
    IconButton,
} from '@mui/material';

import {
    Article as IconText,
    Code as IconCode,
    PlayArrow as IconPlay,
    Videocam as IconVideo,
} from '@mui/icons-material';

import { SelectFile as SelectFileDialog } from '@iobroker/adapter-react-v5';

import type { ConfigItemFile } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import ConfigFileSelector from './ConfigFileSelector';

const styles: Record<string, React.CSSProperties> = {
    fullWidth: {
        width: '100%',
    },
    fullWidthOneButton: {
        width: 'calc(100% - 69px)',
        marginRight: 4,
    },
    fullWidthIcon: {
        width: 'calc(100% - 119px)',
        marginRight: 4,
    },
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

interface ConfigFileProps extends ConfigGenericProps {
    schema: ConfigItemFile;
}

interface ConfigFileState extends ConfigGenericState {
    showFileBrowser?: boolean;
}

class ConfigFile extends ConfigGeneric<ConfigFileProps, ConfigFileState> {
    private imagePrefix = '../..';

    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.imagePrefix = this.props.imagePrefix === undefined ? './files' : this.props.imagePrefix;
        this.setState({ value: value ?? '' });
    }

    static getDerivedStateFromProps(props: ConfigFileProps, state: ConfigFileState): Partial<ConfigFileState> | null {
        const value = ConfigGeneric.getValue(props.data, props.attr);
        if (value === null || value === undefined || value.toString().trim() !== (state.value ||  '').toString().trim()) {
            return { value: value ?? '' };
        }
        return null;
    }

    loadFile() {
        const pos = this.state.value.indexOf('/');
        if (pos !== -1) {
            const adapter = this.state.value.substring(0, pos);
            const path = this.state.value.substring(pos + 1);
            return this.props.socket.readFile(adapter, path, true);
        }

        return Promise.resolve(null);
    }

    play() {
        this.loadFile()
            .then(data => {
                if (typeof AudioContext !== 'undefined' && data?.file) {
                    const context = new AudioContext();
                    const buf = ConfigFileSelector.base64ToArrayBuffer(data.file);
                    context.decodeAudioData(buf, buffer => {
                        const source = context.createBufferSource(); // creates a sound source
                        source.buffer = buffer;                      // tell the source which sounds to play
                        source.connect(context.destination);         // connect the source to the context's destination (the speakers)
                        source.start(0);
                    }, err => window.alert(`Cannot play: ${err}`));
                }
            });
    }

    getIcon() {
        const extension = this.state.value.split('.').pop().toLowerCase();
        if (IMAGE_EXT.includes(extension)) {
            return <div
                style={{
                    ...styles.selectedImage,
                    backgroundImage: `url(${this.imagePrefix}/${this.state.value})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                }}
            />;
        }
        if (AUDIO_EXT.includes(extension)) {
            return <IconButton style={{ color: '#00FF00' }} onClick={() => this.play()}><IconPlay /></IconButton>;
        }
        if (DOC_EXT.includes(extension)) {
            return <IconText />;
        }
        if (VIDEO_EXT.includes(extension)) {
            return <IconVideo />;
        }
        if (JS_EXT.includes(extension)) {
            return <IconCode />;
        }
        return null;
    }

    renderFileBrowser() {
        if (!this.state.showFileBrowser) {
            return null;
        }
        return <SelectFileDialog
            imagePrefix={this.props.imagePrefix}
            socket={this.props.socket}
            selected={this.state.value}
            onClose={() => this.setState({ showFileBrowser: false })}
            onOk={_value => {
                const value = Array.isArray(_value) ? _value[0] : _value as string;
                this.setState({ value }, () =>
                    this.onChange(this.props.attr, this.props.schema.trim === false ? value : (value || '').trim()));
            }}
            selectOnlyFolders={this.props.schema.selectOnlyFolders}
            allowUpload={this.props.schema.allowUpload}
            allowDownload={this.props.schema.allowDownload}
            allowCreateFolder={this.props.schema.allowCreateFolder}
            allowView={this.props.schema.allowView}
            showToolbar={this.props.schema.showToolbar}
            limitPath={this.props.schema.limitPath}
        />;
    }

    renderItem(error: string, disabled: boolean /* , defaultValue */) {
        const icon = this.getIcon();

        return <div style={styles.fullWidth}>
            {icon}
            <TextField
                variant="standard"
                style={icon ? styles.fullWidthIcon : styles.fullWidthOneButton}
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                inputProps={{
                    maxLength: this.props.schema.maxLength || this.props.schema.max || undefined,
                    readOnly: !!this.props.schema.disableEdit,
                }}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({ value }, () =>
                        this.onChange(this.props.attr, this.props.schema.trim === false ? value : (value || '').trim()));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />
            <Button variant="outlined" onClick={() => this.setState({ showFileBrowser: true })}>...</Button>
            {this.renderFileBrowser()}
        </div>;
    }
}

export default ConfigFile;
