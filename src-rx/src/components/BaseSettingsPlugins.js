import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Paper from  '@material-ui/core/Paper';
import MonacoEditor from 'react-monaco-editor';

const styles = theme => ({
    paper: {
        height:    '100%',
        maxHeight: '100%',
        maxWidth:  '100%',
        overflow:  'auto',
        padding:   theme.spacing(1),
    },
    title: {
        width: '100%',
        height: 32,
    },
    divWithoutTitle: {
        width: '100%',
        height: 'calc(100% - ' + 32 + 'px)',
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    }

});

class BaseSettingsPlugins extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            settings:  JSON.stringify(this.props.settings || {}, null, 2),
            error: false,
        };
    }

    static getDerivedStateFromProps(props, state) {
        return null;
    }


    editorDidMount(editor, monaco) {
        editor.focus();
    }

    onChange(value) {
        const newState = {settings: value};
        try {
            const settings = JSON.parse(value);

            if (this.state.error) {
                newState.error = false;
            }

            this.setState(newState, () => this.props.onChange(settings));
        } catch(e) {
            newState.error = true;
            this.setState(newState);
        }
    }

    render() {
        return <Paper className={ this.props.classes.paper }>
            <div className={ this.props.classes.title }>{ this.props.t('For future use') }</div>
            <div className={ clsx(this.props.classes.divWithoutTitle, this.state.error && this.props.classes.error) }>
                <MonacoEditor
                    width="100%"
                    height="calc(100% - 32px)"
                    language="json"
                    theme={ this.props.themeName === 'dark' ? 'vs-dark' : 'vs-light' }
                    value={ this.state.settings }
                    options={{
                        selectOnLineNumbers: true
                    }}
                    onChange={(newValue, e) => this.onChange(newValue, e) }
                    editorDidMount={(editor, monaco) => this.editorDidMount(editor, monaco)}
                />
            </div>
        </Paper>;
    }
}

BaseSettingsPlugins.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    themeName: PropTypes.string,
};

export default withWidth()(withStyles(styles)(BaseSettingsPlugins));
