import React, { Component, type JSX } from 'react';

// `AceEditor` brings the modes and themes with it, see there
import AceEditor from './AceEditor';

import type { ThemeType } from '@iobroker/gui-components';

export interface EditorProps {
    fontSize?: number;
    value?: string;
    defaultValue?: string;
    mode?: string;
    name?: string;
    onChange?: (newVal: string) => void;
    themeType: ThemeType;
    /** flag that indicates the "value edit mode" */
    editValueMode?: boolean;
    error?: boolean;
    style?: React.CSSProperties;
}

class Editor extends Component<EditorProps> {
    render(): JSX.Element {
        return (
            <AceEditor
                style={{
                    border: '1px solid',
                    borderColor: this.props.error ? 'red' : '#00000000',
                    minHeight: 200,
                    ...this.props.style,
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
                onChange={newValue => this.props.onChange?.(newValue)}
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
            />
        );
    }
}

export default Editor;
