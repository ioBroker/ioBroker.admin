import { Component } from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools'

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({
    input: {
        marginBottom: theme.spacing(2),
    },
    inputText: {
        width: 400,
        height: 300,
        marginBottom: theme.spacing(2),
    },
    formControl: {
        marginBottom: theme.spacing(2),
        minWidth: 150,
    },
    quality: {
        width: '100%'
    }
});

class ObjectBrowserValue extends Component {
    constructor(props) {
        super(props);

        let type = this.props.type || typeof this.props.value;

        this.value = this.props.value;
        this.propsValue = this.value;
        if (this.propsValue === null) {
            this.propsValue = 'null';
        } else if (this.propsValue === undefined) {
            this.propsValue = 'undefined';
        }

        if (type === 'string' || type === 'json') {
            if (this.value &&
                ((this.value.startsWith('[') && this.value.endsWith(']')) ||
                 (this.value.startsWith('{') && this.value.endsWith('}')))
            ) {
                try {
                    this.value = JSON.parse(this.value);
                    this.value = JSON.stringify(this.value, null, 2);
                    this.propsValue = this.value;
                    type = 'json';
                } catch (e) {

                }
            }
        }

        this.state = {
            type
        };

        this.ack   = false;
        this.q     = 0;
    }

    onUpdate() {
        if (this.state.type === 'number') {
            this.value = parseFloat(this.value) || 0;
        } else if (this.state.type === 'boolean') {
            this.value = this.value === true || this.value === 'true' || this.value === '1' || this.value === 'ON' || this.value === 'on';
        }

        this.props.onClose({val: this.value, ack: this.ack, q: this.q})
    }

    renderJsonEditor() {
        return <AceEditor
            mode="json"
            width="100%"
            height="200px"
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            theme={this.props.themeType === 'dark' ? 'clouds_midnight' : 'chrome'}
            defaultValue={this.propsValue}
            onChange={newValue => this.value = newValue}
            name="UNIQUE_ID_OF_DIV1"
            fontSize={14}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
            }}
            editorProps={{$blockScrolling: true}}
        />;
    }

    render() {
        return <Dialog
            open={ true }
            maxWidth={ this.state.type === 'number' || this.state.type === 'boolean' ? null : 'md'}
            fullWidth={ this.state.type !== 'number' && this.state.type !== 'boolean' }
            onClose={ () => this.props.onClose() }
            aria-labelledby="edit-value-dialog-title"
            aria-describedby="edit-value-dialog-description"
        >
            <DialogTitle id="edit-value-dialog-title">{ this.props.t('Write value') }</DialogTitle>
            <DialogContent>
                <form className={ this.props.classes.dialogForm } noValidate autoComplete="off">
                    <Grid container direction="column">
                        { this.props.expertMode ? <Grid item><FormControl className={ this.props.classes.formControl }>
                            <InputLabel>{ this.props.t('Value type') }</InputLabel>
                            <Select
                                value={ this.state.type }
                                onChange={ e => this.setState({ type: e.target.value })}
                            >
                                <MenuItem value="string">String</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                                <MenuItem value="json">JSON</MenuItem>
                            </Select>
                        </FormControl></Grid> : null }

                        <Grid item>
                        { this.state.type === 'boolean' ?
                            <FormControlLabel
                                className={ this.props.classes.formControl }
                                control={<Checkbox
                                    autoFocus
                                    helperText={ this.props.t('Press ENTER to write the value, when focused')}
                                    defaultChecked={ !!this.propsValue }
                                    onKeyUp={e => e.keyCode === 13 && this.onUpdate() }
                                    onChange={e => this.value = e.target.checked}/>}
                                label={this.props.t('Value')}
                            />
                            :
                            (this.state.type === 'number' ?
                                <TextField
                                    className={ this.props.input }
                                    autoFocus
                                    helperText={ this.props.t('Press ENTER to write the value, when focused')}
                                    label={ this.props.t('Value') }
                                    defaultValue={ parseFloat(this.propsValue) || 0 }
                                    onKeyUp={ e => e.keyCode === 13 && this.onUpdate() }
                                    onChange={ e => this.value = e.target.value }/>
                                :
                                (this.state.type === 'json' ?
                                    this.renderJsonEditor()
                                    :
                                    <TextField
                                        className={ this.props.input }
                                        autoFocus
                                        helperText={ this.props.t('Press CTRL+ENTER to write the value, when focused')}
                                        label={ this.props.t('Value') }
                                        fullWidth={ true }
                                        multiline
                                        onKeyUp={e => e.ctrlKey && e.keyCode === 13 && this.onUpdate() }
                                        defaultValue={ this.propsValue.toString() }
                                        onChange={ e => this.value = e.target.value }/>
                                )
                            )
                        }
                        </Grid>
                        <Grid item>
                            <FormControlLabel
                                className={ this.props.classes.formControl }
                                control={ <Checkbox
                                    defaultChecked={ false }
                                    onChange={ e => this.ack = e.target.checked }/> }
                                label={ this.props.t('Acknowledged') }
                            />
                        </Grid>

                        { this.props.expertMode ? <Grid item><FormControl className={ this.props.classes.quality }>
                            <InputLabel>{ this.props.t('Quality') }</InputLabel>
                            <Select
                                defaultValue={ 0 }
                                onChange={ e => this.q = parseInt(e.target.value, 10) }
                            >
                                <MenuItem value={ 0x00 }>0x00 - good</MenuItem>

                                <MenuItem value={ 0x01 }>0x01 - general problem</MenuItem>
                                <MenuItem value={ 0x02 }>0x02 - no connection problem</MenuItem>

                                <MenuItem value={ 0x10 }>0x10 - substitute value from controller</MenuItem>
                                <MenuItem value={ 0x20 }>0x20 - substitute initial value</MenuItem>
                                <MenuItem value={ 0x40 }>0x40 - substitute value from device or instance</MenuItem>
                                <MenuItem value={ 0x80 }>0x80 - substitute value from sensor</MenuItem>

                                <MenuItem value={ 0x11 }>0x11 - general problem by instance</MenuItem>
                                <MenuItem value={ 0x41 }>0x41 - general problem by device</MenuItem>
                                <MenuItem value={ 0x81 }>0x81 - general problem by sensor</MenuItem>

                                <MenuItem value={ 0x12 }>0x12 - instance not connected</MenuItem>
                                <MenuItem value={ 0x42 }>0x42 - device not connected</MenuItem>
                                <MenuItem value={ 0x82 }>0x82 - sensor not connected</MenuItem>

                                <MenuItem value={ 0x44 }>0x44 - device reports error</MenuItem>
                                <MenuItem value={ 0x84 }>0x84 - sensor reports error</MenuItem>
                            </Select>
                        </FormControl></Grid> : null }
                    </Grid>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={ () => this.onUpdate() }      color="primary">{   this.props.t('Write') }</Button>
                <Button onClick={ () => this.props.onClose() }>{ this.props.t('Cancel') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectBrowserValue.propTypes = {
    classes: PropTypes.object,
    type: PropTypes.string,
    value: PropTypes.any,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    themeType: PropTypes.string,

    t: PropTypes.func,
};

export default withStyles(styles)(ObjectBrowserValue);
