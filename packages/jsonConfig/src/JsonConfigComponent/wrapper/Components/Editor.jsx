import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/mode-json';
import 'ace-builds/src-min-noconflict/worker-json';
import 'ace-builds/src-min-noconflict/theme-clouds_midnight';
import 'ace-builds/src-min-noconflict/theme-chrome';
import 'ace-builds/src-min-noconflict/ext-language_tools';

const styles = {
    jsonError: {
        border: '1px solid red',
        minHeight: 200,
    },
    jsonNoError: {
        border: '1px solid #00000000',
        minHeight: 200,
    },
};

class Editor extends Component {
    render() {
        return <AceEditor
            className={this.props.error === true ? this.props.classes.jsonError : (this.props.error === false ? this.props.classes.jsonNoError : undefined)}
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

Editor.propTypes = {
    fontSize: PropTypes.number,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    mode: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    themeType: PropTypes.string,
    editValueMode: PropTypes.bool, // flag that indicates the "value edit mode"
    error: PropTypes.bool,
};

export default withStyles(styles)(Editor);
