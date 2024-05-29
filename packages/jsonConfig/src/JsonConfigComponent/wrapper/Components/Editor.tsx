import React from 'react';
import { type Styles, withStyles } from '@mui/styles';

import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/mode-json';
import 'ace-builds/src-min-noconflict/worker-json';
import 'ace-builds/src-min-noconflict/theme-clouds_midnight';
import 'ace-builds/src-min-noconflict/theme-chrome';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import type { IobTheme } from '@iobroker/adapter-react-v5';

const styles: Styles<IobTheme, any> = {
    jsonError: {
        border: '1px solid red',
        minHeight: 200,
    },
    jsonNoError: {
        border: '1px solid #00000000',
        minHeight: 200,
    },
};

interface EditorProps {
    fontSize: number;
    value: string;
    defaultValue: string;
    mode: 'json' | 'css' | 'html';
    name: string;
    onChange: (newValue: string) => void;
    themeType: string;
    editValueMode: boolean; // flag that indicates the "value edit mode"
    error: boolean;
    classes: Record<string, string>;
}

function Editor(props: EditorProps) {
    return <AceEditor
        className={props.error === true ? props.classes.jsonError : (props.error === false ? props.classes.jsonNoError : undefined)}
        mode={props.mode || 'json'}
        width="100%"
        height="100%"
        showPrintMargin={props.editValueMode}
        showGutter={props.editValueMode}
        highlightActiveLine={props.editValueMode}
        defaultValue={props.defaultValue}
        theme={props.themeType === 'dark' ? 'clouds_midnight' : 'chrome'}
        value={props.value}
        readOnly={!props.onChange}
        onChange={newValue => props.onChange(newValue)}
        name={props.name || 'UNIQUE_ID_OF_DIV1'}
        fontSize={props.fontSize || 14}
        setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,

            showLineNumbers: props.editValueMode,
            tabSize: props.editValueMode ? 2 : undefined,
        }}
        editorProps={{ $blockScrolling: true }}
    />;
}

export default withStyles(styles)(Editor);
