import React from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import MonacoEditor from 'react-monaco-editor';

// Icons
import { Close, ContentPaste } from '@mui/icons-material';

import { type IobTheme, type ThemeType, type Translate } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
    error: (theme: IobTheme) => ({
        color: theme.palette.mode === 'dark' ? '#ff7777' : '#c20000',
    }),
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
        marginRight: 8,
    },
};

interface ObjectImportFromTextDialogProps {
    t: Translate;
    onClose: (text?: string) => void;
    themeType: ThemeType;
}

export function ObjectImportFromTextDialog(props: ObjectImportFromTextDialogProps): React.JSX.Element {
    const [text, setText] = React.useState<string>('');

    let error = false;
    try {
        JSON.parse(text);
    } catch {
        error = true;
    }

    return (
        <Dialog
            style={styles.dialog}
            open={!0}
            maxWidth="lg"
            onClose={() => props.onClose()}
            fullWidth
        >
            <DialogTitle>{props.t('Insert JSON with objects here')}</DialogTitle>
            <DialogContent style={{ minHeight: 500 }}>
                <MonacoEditor
                    width="100%"
                    height={'500px'}
                    language="json"
                    theme={props.themeType === 'dark' ? 'vs-dark' : 'vs-light'}
                    value={text}
                    options={{ selectOnLineNumbers: true }}
                    onChange={newValue => setText(newValue)}
                    editorDidMount={(editor /* , monaco */) => editor.focus()}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    disabled={error || !text.trim()}
                    onClick={() => props.onClose(text)}
                    startIcon={<ContentPaste />}
                    color="primary"
                >
                    {props.t('Import objects')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => props.onClose()}
                    startIcon={<Close />}
                    color="grey"
                >
                    {props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
