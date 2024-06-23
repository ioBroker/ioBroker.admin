import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';
import type { editor as MonacoEditorType } from 'monaco-editor';

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

import {
    withWidth,
    type Translate,
    type ThemeName,
} from '@iobroker/adapter-react-v5';
import type { ioBrokerObject } from '@/types';

const styles: Record<string, React.CSSProperties> = {
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
};

export const EXTENSIONS = {
    images: ['png', 'jpg', 'svg', 'jpeg'],
    code: ['js', 'json'],
    txt: ['log', 'txt', 'html', 'css', 'xml'],
};

interface ObjectEditDialogProps {
    t: Translate;
    themeName: ThemeName;
    obj: ioBrokerObject;
    onClose: () => void;
}

interface ObjectEditDialogState {
    code: string;
    changed: boolean;
}

class ObjectEditDialog extends Component<ObjectEditDialogProps, ObjectEditDialogState> {
    constructor(props: ObjectEditDialogProps) {
        super(props);

        this.state = {
            code: JSON.stringify(this.props.obj._id, null, 2),
            changed: false,
        };
    }

    static editorDidMount(editor: MonacoEditorType.IStandaloneCodeEditor /* , monaco */) {
        console.log('editorDidMount', editor);
        editor.focus();
    }

    static onChange(newValue: string, e: MonacoEditorType.IModelContentChangedEvent) {
        console.log('onChange', newValue, e);
    }

    onSave() {
        this.props.onClose();
    }

    render() {
        return <Dialog
            style={styles.dialog}
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
            <DialogContent style={styles.content}>
                <MonacoEditor
                    width="100%"
                    height="100%"
                    language="json"
                    theme={this.props.themeName === 'dark' ? 'vs-dark' : 'vs-light'}
                    value={this.state.code}
                    options={{ selectOnLineNumbers: true }}
                    onChange={(newValue, e) => ObjectEditDialog.onChange(newValue, e)}
                    editorDidMount={(editor/* , monaco */) => ObjectEditDialog.editorDidMount(editor/* , monaco */)}
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

export default withWidth()(ObjectEditDialog);
