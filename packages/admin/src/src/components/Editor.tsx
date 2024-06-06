import React, { Component } from 'react';

import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/mode-json';
import 'ace-builds/src-min-noconflict/worker-json';
import 'ace-builds/src-min-noconflict/theme-clouds_midnight';
import 'ace-builds/src-min-noconflict/theme-chrome';
import 'ace-builds/src-min-noconflict/ext-language_tools';

export interface EditorProps {
    fontSize?: number;
    value?: string;
    defaultValue?: string;
    mode?: string;
    name?: string;
    onChange?: (newVal: string) => void;
    themeType: string;
    /** flag that indicates the "value edit mode" */
    editValueMode?: boolean;
    error?: boolean;
}

class Editor extends Component<EditorProps> {
    render() {
        return <AceEditor
            style={{
                border: '1px solid',
                borderColor: this.props.error ? 'red' : '#00000000',
                minHeight: 200,
            }}
            mode={this.props.mode || 'json'}
            width="100%"
            height="100%"
            showPrintMargin={this.props.editValueMode}
            showGutter={this.props.editValueMode}
            highlightActiveLine={this.props.editValueMode}
            defaultValue={this.props.defaultValue}
            theme={this.props.themeType === 'dark' ? 'clouds_midnight' : 'chrome'}
            value={this.props.value}
            readOnly={!this.props.onChange}
            onChange={newValue => this.props.onChange(newValue)}
            name={this.props.name || 'UNIQUE_ID_OF_DIV1'}
            fontSize={this.props.fontSize || 14}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,

                showLineNumbers: this.props.editValueMode,
                tabSize: this.props.editValueMode ? 2 : undefined,
            }}
            editorProps={{ $blockScrolling: true }}
        />;
    }
}

export default Editor;
