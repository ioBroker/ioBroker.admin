import React, { Component } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { IconButton } from '@mui/material';

import IconNoIcon from '@iobroker/adapter-react-v5/icons/IconNoIcon';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';
import withWidth from '@iobroker/adapter-react-v5/Components/withWidth';

// Icons
import { FaCopy as CopyIcon } from 'react-icons/fa';
import Brightness5Icon from '@mui/icons-material/Brightness6';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const styles = theme => ({
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
        display: 'flex'
    }
});

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg', 'bmp'],
    code:   ['js', 'json', 'md'],
    txt:    ['log', 'txt', 'html', 'css', 'xml'],
};

function bufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len && i < 50; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * @typedef {object} FileViewerProps
 * @property {string} [key] The key to identify this component.
 * @property {import('../types').Translator} t Translation function
 * @property {ioBroker.Languages} [lang] The selected language.
 * @property {boolean} [expertMode] Is expert mode enabled? (default: false)
 * @property {() => void} onClose Callback when the viewer is closed.
 * @property {string} href The URL to the file to be displayed.
 *
 * @extends {React.Component<FileViewerProps>}
 */
class FileViewer extends Component {
    /**
     * @param {Readonly<FileViewerProps>} props
     */
    constructor(props) {
        super(props);
        const ext = Utils.getFileExtension(this.props.href);

        this.state = {
            text: null,
            code: null,
            ext,
            editing: !!this.props.formatEditFile || false,
            editingValue: null,
            copyPossible: EXTENSIONS.code.includes(ext) || EXTENSIONS.txt.includes(ext),
            forceUpdate: Date.now(),
            changed: false,
            imgError: false,
        };
    }

    readFile() {
        if (this.props.href) {
            const parts = this.props.href.split('/');
            parts.splice(0, 2);
            const adapter = parts[0];
            const name = parts.splice(1).join('/');

            this.props.socket.readFile(adapter, name)
                .then(data => {
                    if (data.file !== undefined) {
                        data = data.file;
                    }

                    const newState = {copyPossible: this.state.copyPossible};
                    // try to detect valid extension
                    if (data.type === 'Buffer') {
                        const ext = Utils.detectMimeType(bufferToBase64(data.data));
                        if (ext) {
                            newState.ext = ext;
                            newState.copyPossible = EXTENSIONS.code.includes(ext) || EXTENSIONS.txt.includes(ext);
                        }
                    }

                    if (newState.copyPossible) {
                        if (EXTENSIONS.txt.includes(this.state.ext)) {
                            newState.text = data;
                            newState.editingValue = data;
                        } else if (EXTENSIONS.code.includes(this.state.ext)) {
                            newState.code = data;
                            newState.editingValue = data;
                        }
                    }

                    this.setState(newState);
                })
                .catch(e => window.alert('Cannot read file: ' + e));
        }
    }

    componentDidMount() {
        this.readFile();

        const parts = this.props.href.split('/');
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');

        this.props.supportSubscribes && this.props.socket.subscribeFiles(adapter, name, this.onFileChanged);
    }

    componentWillUnmount() {
        this.timeout && clearTimeout(this.timeout);
        const parts = this.props.href.split('/');
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');
        this.props.supportSubscribes && this.props.socket.subscribeFiles(adapter, name, this.onFileChanged);
    }

    onFileChanged = (id, fileName, size) => {
        if (!this.state.changed) {
            this.timeout && clearTimeout(this.timeout);
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

    writeFile64 = () => {
        const parts = this.props.href.split('/');
        const data = this.state.editingValue;
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');
        this.props.socket.writeFile64(adapter, name, Buffer.from(data).toString('base64'))
            .then(_ => this.props.onClose())
            .catch(e => window.alert('Cannot write file: ' + e));
    }

    getEditFile(ext) {
        switch (ext) {
            case 'json':
                return 'json';
            case 'js':
                return 'javascript';
            case 'html':
                return 'html';
            case 'txt':
                return 'html';
            default:
                return 'json';
        }
    }

    getContent() {
        if (EXTENSIONS.images.includes(this.state.ext)) {
            if (this.state.imgError) {
                return <IconNoIcon className={Utils.clsx(this.props.classes.img, this.props.getClassBackgroundImage())} />;
            } else {
                return <img
                    onError={e => {
                        e.target.onerror = null;
                        this.setState({ imgError: true });
                    }}
                    className={Utils.clsx(this.props.classes.img, this.props.getClassBackgroundImage())}
                    src={this.props.href + '?ts=' + this.state.forceUpdate}
                    alt={this.props.href}
                />;
            }
        } else if (this.state.code !== null || this.state.text !== null || this.state.editing) {
            return <AceEditor
                mode={this.getEditFile(this.props.formatEditFile)}
                width="100%"
                height="100%"
                theme={this.props.themeName === 'dark' ? 'clouds_midnight' : 'chrome'}
                value={this.state.editingValue || this.state.code || this.state.text}
                onChange={newValue => this.setState({ editingValue: newValue, changed: true })}
                name="UNIQUE_ID_OF_DIV"
                readOnly={!this.state.editing}
                fontSize={14}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                }}
                editorProps={{ $blockScrolling: true }}
            />;
        }
    }

    render() {
        return <Dialog
            classes={{ scrollPaper: this.props.classes.dialog, paper: this.props.classes.paper }}
            scroll="paper"
            open={!!this.props.href}
            onClose={() => this.props.onClose()}
            fullWidth={true}
            maxWidth="xl"
            aria-labelledby="form-dialog-title"
        >
            <div className={this.props.classes.dialogTitle}>
                <DialogTitle id="form-dialog-title">{this.props.t(this.state.editing ? 'Edit' : 'View') + ': ' + this.props.href}</DialogTitle>
                {EXTENSIONS.images.includes(this.state.ext) && <div>
                    <IconButton size="large"
                        color={'inherit'}
                        onClick={this.props.setStateBackgroundImage}
                    >
                        <Brightness5Icon />
                    </IconButton>
                </div>
                }
            </div>
            <DialogContent className={this.props.classes.content}>
                {this.getContent()}
            </DialogContent>
            <DialogActions>
                {this.state.copyPossible ?
                    <Button
                        color="grey"
                        onClick={e => Utils.copyToClipboard(this.state.text || this.state.code, e)}
                        startIcon={<CopyIcon />}
                    >
                        {this.props.t('Copy content')}
                    </Button> : null}
                {this.state.editing ?
                    <Button
                        color="grey"
                        disabled={this.state.editingValue === this.state.code || this.state.editingValue === this.state.text}
                        variant="contained"
                        onClick={this.writeFile64}
                        startIcon={<SaveIcon />}
                    >
                        {this.props.t('Save')}
                    </Button> : null}
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="primary"
                    startIcon={<CloseIcon />}
                >
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

FileViewer.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func,
    href: PropTypes.string.isRequired,
    supportSubscribes: PropTypes.bool,
};

/** @type {typeof FileViewer} */
const _export = withWidth()(withStyles(styles)(FileViewer));
export default _export;
