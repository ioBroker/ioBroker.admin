import { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools'
import clsx from 'clsx';

const styles = theme => ({
    divWithoutTitle: {
        width: '100%',
        height: '100%',
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    },
    id: {
        fontStyle: 'italic',
    }
});

class ObjectBrowserEditObject extends Component {
    constructor(props) {
        super(props);

        this.state = {
            text: JSON.stringify(this.props.obj, null, 2),
            error: false,
            changed: false,
        };

        this.originalObj = JSON.stringify(this.props.obj, null, 2);
    }

    onChange(value) {
        const newState = {text: value};
        try {
            const json = JSON.parse(value);
            newState.changed = this.originalObj !== JSON.stringify(json, null, 2);
            if (this.state.error) {
                newState.error = false;
            }

            this.setState(newState);
        } catch(e) {
            newState.error = true;
            this.setState(newState);
        }
    }

    onUpdate() {
        const obj = JSON.parse(this.state.text);
        obj._id = this.props.obj._id; // do not allow change of id
        this.props.onClose(obj);
    }

    render() {
        return <Dialog
            open={ true }
            fullWidth={ this.state.type !== 'number' && this.state.type !== 'boolean' }
            fullScreen={ true }
            onClose={ () => this.props.onClose() }
            aria-labelledby="edit-value-dialog-title"
            aria-describedby="edit-value-dialog-description"
        >
            <DialogTitle id="edit-value-dialog-title">{ this.props.t('Edit object: ') } <span className={ this.props.classes.id }>{ this.props.obj._id }</span></DialogTitle>
            <DialogContent>
                <div className={ clsx(this.props.classes.divWithoutTitle, this.state.error && this.props.classes.error) }>
                    <AceEditor
                        mode="json"
                        width="100%"
                        height="100%"
                        theme={ this.props.themeName === 'dark' ? 'clouds_midnight' : 'chrome' }
                        value={ this.state.text }
                        onChange={ newValue => this.onChange(newValue) }
                        name="UNIQUE_ID_OF_DIV"
                        fontSize={14}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true
                        }}
                        editorProps={{ $blockScrolling: true }}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={ () => this.props.onClose() } color="secondary">{ this.props.t('Cancel') }</Button>
                <Button disabled={ this.state.error || !this.state.changed } onClick={ () => this.onUpdate() } color="primary">{ this.props.t('Write') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectBrowserEditObject.propTypes = {
    classes: PropTypes.object,
    obj: PropTypes.object,
    expertMode: PropTypes.bool,
    themeName: PropTypes.string,
    onClose: PropTypes.func.isRequired,

    t: PropTypes.func,
};

export default withStyles(styles)(ObjectBrowserEditObject);
