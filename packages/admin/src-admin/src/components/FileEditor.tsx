// File viewer in adapter-react does not support write
import { Buffer } from 'buffer';
import React, { type JSX } from 'react';

// File viewer in adapter-react does not use ace editor
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/ext-modelist';

import { withWidth, FileViewerClass, type FileViewerProps } from '@iobroker/adapter-react-v5';

import Editor from './Editor';

const modelist = ace.require
    ? ace.require('ace/ext/modelist')
    : // @ts-expect-error try this too
      ace.acequire('ace/ext/modelist');

class FileEditorClass extends FileViewerClass {
    constructor(props: FileViewerProps) {
        super(props);

        Object.assign(this.state, {
            // File viewer in adapter-react does not support write
            editing: !!this.props.formatEditFile || false,
        });
    }

    static getEditFile(ext: string | null): 'json' | 'json5' | 'javascript' | 'html' | 'text' {
        switch (ext) {
            case 'json':
                return 'json';
            case 'json5':
                return 'json5';
            case 'js':
                return 'javascript';
            case 'html':
                return 'html';
            case 'txt':
                return 'html';
            default:
                // e.g. ace/mode/text
                return modelist.getModeForPath(`testFile.${ext}`).mode.split('/').pop();
        }
    }

    writeFile64 = (): void => {
        // File viewer in adapter-react does not support write
        const parts = this.props.href.split('/');
        const data = this.state.editingValue;
        parts.splice(0, 2);
        const adapter = parts[0];
        const name = parts.splice(1).join('/');
        this.props.socket
            .writeFile64(adapter, name, Buffer.from(data).toString('base64'))
            .then(() => this.props.onClose())
            .catch(e => window.alert(`Cannot write file: ${e}`));
    };

    getEditorOrViewer(): JSX.Element {
        // File viewer in adapter-react does not support write
        return (
            <Editor
                mode={FileEditorClass.getEditFile(this.props.formatEditFile)}
                themeType={this.props.themeType}
                value={this.state.editingValue || this.state.code || this.state.text}
                onChange={
                    this.state.editing
                        ? newValue => this.setState({ editingValue: newValue, changed: true })
                        : undefined
                }
            />
        );
    }

    onSave(): void {
        this.writeFile64();
    }
}

export const FileEditor = withWidth()(FileEditorClass);
