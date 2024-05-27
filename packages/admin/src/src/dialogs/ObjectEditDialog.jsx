import { Component } from 'react';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';

// Icons
import {
    Close as CloseIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { withWidth } from '@iobroker/adapter-react-v5';

const styles = theme => ({
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
});

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code: ['js', 'json'],
    txt: ['log', 'txt', 'html', 'css', 'xml'],
};

class ObjectEditDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            code: JSON.stringify(this.props.obj._id, null, 2),
            changed: false,
        };
    }

    static editorDidMount(editor /* , monaco */) {
        console.log('editorDidMount', editor);
        editor.focus();
    }

    static onChange(newValue, e) {
        console.log('onChange', newValue, e);
    }

    onSave() {
        this.props.onClose();
    }

    render() {
        return <Dialog
            className={this.props.classes.dialog}
            open={!0}
            onClose={() => this.props.onClose()}
            fullWidth
            fullScreen
            aria-labelledby="object-edit-dialog-title"
        >
            <DialogTitle id="object-edit-dialog-title">
                {
                    this.props.t('Edit object: %s', this.props.obj._id)
                }
            </DialogTitle>
            <DialogContent className={this.props.classes.content}>
                <MonacoEditor
                    width="100%"
                    height="100%"
                    language="json"
                    theme={this.props.themeName === 'dark' ? 'vs-dark' : 'vs-light'}
                    value={this.state.code}
                    options={{ selectOnLineNumbers: true }}
                    onChange={(newValue, e) => ObjectEditDialog.onChange(newValue, e)}
                    editorDidMount={(editor, monaco) => ObjectEditDialog.editorDidMount(editor, monaco)}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!this.state.changed}
                    onClick={() => this.onSave()}
                    startIcon={<CheckIcon />}
                >
                    {this.props.t('Save')}
                </Button>
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

ObjectEditDialog.propTypes = {
    t: PropTypes.func,
    themeName: PropTypes.string,
    obj: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(ObjectEditDialog));
