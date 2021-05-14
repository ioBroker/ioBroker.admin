import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools'

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { IconButton } from '@material-ui/core';

import NoImage from '@iobroker/adapter-react/assets/no_icon.svg';
import Utils from '@iobroker/adapter-react/Components/Utils';

// Icons
import { FaCopy as CopyIcon } from 'react-icons/fa';
import Brightness5Icon from '@material-ui/icons/Brightness6';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';

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
    images: ['png', 'jpg', 'svg', 'jpeg', 'jpg', 'bmp'],
    code:   ['js', 'json', 'md'],
    txt:    ['log', 'txt', 'html', 'css', 'xml'],
};

class FileViewer extends Component {
    constructor(props) {
        super(props);
        this.ext = Utils.getFileExtension(this.props.href);

        this.state = {
            text: null,
            code: null,
            editing: !!this.props.formatEditFile || false,
            editingValue: null,
            copyPossible: EXTENSIONS.code.includes(this.ext) || EXTENSIONS.txt.includes(this.ext)
        };

        if (this.state.copyPossible) {
            const parts = this.props.href.split('/');
            parts.splice(0, 2);
            const adapter = parts[0];
            const name = parts.splice(1).join('/');
            this.props.socket.readFile(adapter, name)
                .then(el => {
                    if (EXTENSIONS.txt.includes(this.ext)) {
                        this.setState({ text: el, editingValue: el });
                    } else if (EXTENSIONS.code.includes(this.ext)) {
                        this.setState({ code: el, editingValue: el });
                    }
                })
                .catch(e => window.alert('Cannot read file: ' + e));
        }
    }

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
        if (EXTENSIONS.images.includes(this.ext)) {
            return <img
                onError={e => {
                    e.target.onerror = null;
                    e.target.src = NoImage
                }}
                className={clsx(this.props.classes.img, this.props.getClassBackgroundImage())}
                src={this.props.href} alt={this.props.href} />;
        } else if (this.state.code !== null || this.state.text !== null || this.state.editing) {
            return <AceEditor
                mode={this.getEditFile(this.props.formatEditFile)}
                width="100%"
                height="100%"
                theme={this.props.themeName === 'dark' ? 'clouds_midnight' : 'chrome'}
                value={this.state.editingValue || this.state.code || this.state.text}
                onChange={newValue => this.setState({ editingValue: newValue })}
                name="UNIQUE_ID_OF_DIV"
                readOnly={!this.state.editing}
                fontSize={14}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true
                }}
                editorProps={{ $blockScrolling: true }}
            />
        }
    }

    render() {
        return <Dialog
            classes={{ scrollPaper: this.props.classes.dialog, paper: this.props.classes.paper }}
            scroll="paper"
            key={this.props.key}
            open={!!this.props.href}
            onClose={() => this.props.onClose()}
            fullWidth={true}
            maxWidth="xl"
            aria-labelledby="form-dialog-title"
        >
            <div className={this.props.classes.dialogTitle}>
                <DialogTitle id="form-dialog-title">{this.props.t(this.state.editing ? 'Edit' : 'View') + ': ' + this.props.href}</DialogTitle>
                {EXTENSIONS.images.includes(this.ext) && <div>
                    <IconButton
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
                        onClick={e => Utils.copyToClipboard(this.state.text || this.state.code, e)}
                        startIcon={<CopyIcon />}
                    >
                        <CopyIcon />
                        {this.props.t('Copy content')}
                    </Button> : null}
                {this.state.editing ?
                    <Button
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
    key: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func,
    href: PropTypes.string.isRequired
};

export default withWidth()(withStyles(styles)(FileViewer));
