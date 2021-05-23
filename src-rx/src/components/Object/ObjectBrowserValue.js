import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';

import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
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
import Hidden from '@material-ui/core/Hidden';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';

import ChartIcon from '@material-ui/icons/ShowChart';

import ObjectChart from './ObjectChart';
import IconCancel from "@material-ui/icons/Close";
import IconCheck from "@material-ui/icons/Check";

const styles = theme => ({
    input: {
        width: '100%'
    },
    textInput: {
        width: '100%'
    },
    formControl: {
        minWidth: 150,
    },
    quality: {
        width: 'calc(100% - 88px)'
    },
    expire: {
        marginLeft: 8,
        width: 80
    },
    jsonError: {
        border: '1px solid red'
    },
    jsonNoError: {
        border: '1px solid #00000000'
    }

});

const AntSwitch = withStyles((theme) => ({
    root: {
        width: 28,
        height: 16,
        padding: 0,
        display: 'flex',
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        '&$checked': {
            transform: 'translateX(12px)',
            color: theme.palette.common.white,
            '& + $track': {
                opacity: 1,
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
            },
        },
    },
    thumb: {
        width: 12,
        height: 12,
        boxShadow: 'none',
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor: theme.palette.common.white,
    },
    checked: {},
}))(Switch);

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

        if (this.props.states) {
            type = 'states';
        } else
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
            type,
            chart: false,
            chartEnabled: window.localStorage.getItem('App.chartSetValue') !== 'false',
        };

        this.ack    = false;
        this.q      = 0;
        this.expire = 0;

        this.chartFrom = Date.now() - 3600000 * 2;
    }

    componentDidMount() {
        if (this.props.defaultHistory &&
            this.props.object?.common?.custom &&
            this.props.object.common.custom[this.props.defaultHistory]?.enabled) {
            this.props.socket.getState('system.adapter.' + this.props.defaultHistory + '.alive')
                .then(state => this.setState({chart: state && !!state.val}));
        }
    }

    onUpdate() {
        if (this.state.type === 'states') {
            let type = this.props.type || typeof this.props.value;

            if (type === 'number') {
                if (typeof this.value === 'string') {
                    this.value = parseFloat(this.value.replace(',', '.')) || 0;
                }
            } else if (type === 'boolean') {
                this.value = this.value === true || this.value === 'true' || this.value === '1' || this.value === 'ON' || this.value === 'on';
            }
        } else
        if (this.state.type === 'number') {
            if (typeof this.value === 'string') {
                this.value = parseFloat(this.value.replace(',', '.')) || 0;
            }
        } else if (this.state.type === 'boolean') {
            this.value = this.value === true || this.value === 'true' || this.value === '1' || this.value === 'ON' || this.value === 'on';
        }

        this.props.onClose({val: this.value, ack: this.ack, q: this.q, expire: parseInt(this.expire, 10) || undefined});
    }

    renderChart() {
        return <ObjectChart
            t={this.props.t}
            lang={this.props.lang}
            socket={this.props.socket}
            obj={this.props.object}
            themeType={this.props.themeType}
            from={this.chartFrom}
            end={Date.now()}
            noToolbar={true}
            dateFormat={this.props.dateFormat}
            defaultHistory={this.props.defaultHistory}
        />;
    }

    checkJsonError() {
        try {
            JSON.parse(this.value);
            this.setState({jsonError: false});
        } catch (e) {
            this.setState({jsonError: true});
        }
    }

    renderJsonEditor() {
        return <AceEditor
            className={this.state.jsonError ? this.props.classes.jsonError : this.props.classes.jsonNoError}
            mode="json"
            width="100%"
            height="200px"
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            theme={this.props.themeType === 'dark' ? 'clouds_midnight' : 'chrome'}
            defaultValue={(this.propsValue || '').toString()}
            onChange={newValue => {
                this.value = newValue;
                this.checkJsonError();
            }}
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

    renderStates() {
        if (!this.props.states) {
            return null;
        } else {
            return <FormControl className={ this.props.classes.formControl }>
                <InputLabel>{ this.props.t('Value') }</InputLabel>
                <Select
                    defaultValue={ this.propsValue }
                    onChange={ e => this.value = e.target.value }
                >
                    {Object.keys(this.props.states).map((key, i) => <MenuItem key={i} value={key}>{this.props.states[key]}</MenuItem>)}
                </Select>
            </FormControl>;
        }
    }

    render() {
        return <Dialog
            open={ true }
            maxWidth={ this.state.type === 'number' || this.state.type === 'boolean' || this.state.type === 'states' ? (this.state.chart && this.state.chartEnabled ? 'lg' : null) : 'md'}
            fullWidth={ (this.state.type !== 'number' && this.state.type !== 'boolean' && this.state.type !== 'states') || (this.state.chart && this.state.chartEnabled)}
            onClose={ () => this.props.onClose() }
            aria-labelledby="edit-value-dialog-title"
            aria-describedby="edit-value-dialog-description"
        >
            <DialogTitle id="edit-value-dialog-title">
                { this.props.t('Write value') }
                {/*this.state.chart ? <div style={{flexGrow: 1}}/> : null*/}
                {this.state.chart ? <Fab
                    style={{float: 'right'}}
                    size="small"
                    color={this.state.chartEnabled ? 'primary' : 'default'}
                    onClick={() => {
                    window.localStorage.setItem('App.chartSetValue', this.state.chartEnabled ? 'false' : 'true');
                    this.setState({chartEnabled: !this.state.chartEnabled});
                }}><ChartIcon /></Fab> : null}
            </DialogTitle>
            <DialogContent>
                <form className={ this.props.classes.dialogForm } noValidate autoComplete="off">
                    <Grid container direction="row" spacing={2}>
                        <Grid item xs={this.state.chart && this.state.chartEnabled ? 6 : 12}>
                            <Grid container direction="column" spacing={2}>
                                { this.props.expertMode ? <Grid item><FormControl className={ this.props.classes.formControl }>
                                    <InputLabel>{ this.props.t('Value type') }</InputLabel>
                                    <Select
                                        value={ this.state.type }
                                        onChange={ e => {
                                            if (e.target.value === 'json') {
                                                this.value = (this.value || '').toString();
                                                this.checkJsonError();
                                            }

                                            this.setState({ type: e.target.value })
                                        }}
                                    >
                                        <MenuItem value="string">String</MenuItem>
                                        <MenuItem value="number">Number</MenuItem>
                                        <MenuItem value="boolean">Boolean</MenuItem>
                                        <MenuItem value="json">JSON</MenuItem>
                                        {this.props.states ? <MenuItem value="states">States</MenuItem> : null}
                                    </Select>
                                </FormControl></Grid> : null }

                                <Grid item>
                                    { this.state.type === 'boolean' ?
                                        /*<FormControl component="fieldset" className={ this.props.classes.formControl }>
                                            <FormControlLabel
                                                className={ this.props.classes.formControl }
                                                control={<Checkbox
                                                    autoFocus
                                                    defaultChecked={ !!this.propsValue }
                                                    onKeyUp={e => e.keyCode === 13 && this.onUpdate() }
                                                    onChange={e => this.value = e.target.checked}/>}
                                                label={this.props.t('Value')}
                                            />
                                            <FormHelperText>{this.props.t('Press ENTER to write the value, when focused')}</FormHelperText>
                                        </FormControl>*/
                                        <Typography component="div">
                                            <Grid component="label" container alignItems="center" spacing={1}>
                                                <Grid item style={{marginRight: 10}}>{this.props.t('Value')}:</Grid>
                                                <Grid item>FALSE</Grid>
                                                <Grid item>
                                                    <AntSwitch
                                                        autoFocus
                                                        defaultChecked={ !!this.propsValue }
                                                        onKeyUp={e => e.keyCode === 13 && this.onUpdate() }
                                                        onChange={e => this.value = e.target.checked}
                                                    />
                                                </Grid>
                                                <Grid item>TRUE</Grid>
                                            </Grid>
                                        </Typography>
                                        :
                                        (this.state.type === 'number' ?
                                                <TextField
                                                    classes={{ root: this.props.classes.textInput }}
                                                    autoFocus
                                                    helperText={ this.props.t('Press ENTER to write the value, when focused') }
                                                    label={ this.props.t('Value') }
                                                    defaultValue={ parseFloat(this.propsValue) || 0 }
                                                    onKeyUp={ e => e.keyCode === 13 && this.onUpdate() }
                                                    onChange={ e => this.value = e.target.value }/>
                                                :
                                                (this.state.type === 'json' ?
                                                        this.renderJsonEditor()
                                                        :
                                                        (this.state.type === 'states' ?
                                                                this.renderStates()
                                                                :
                                                                <TextField
                                                                    classes={{ root: this.props.classes.textInput }}
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
                                </FormControl>
                                    <TextField
                                        title={this.props.t('0 - no expiration')}
                                        classes={{root: this.props.classes.expire}}
                                        label={this.props.t('Expire')}
                                        type="number"
                                        inputProps={{min: 0}}
                                        helperText={this.props.t('in seconds')}
                                        defaultValue={this.expire}
                                        onChange={e => this.expire = e.target.value}
                                    />
                                </Grid> : null }
                            </Grid>
                        </Grid>
                        {this.state.chart && this.state.chartEnabled ? <Hidden only={['sm', 'xs']}><Grid item xs={6} style={{minHeight: 300}}>
                            {this.renderChart()}
                        </Grid></Hidden>: null}
                    </Grid>
                </form>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={ () => this.onUpdate() } color="primary" startIcon={<IconCheck />}>{ this.props.t('Set value') }</Button>
                <Button variant="contained" onClick={ () => this.props.onClose() } startIcon={<IconCancel />}>{ this.props.t('Cancel') }</Button>
            </DialogActions>
        </Dialog>;
    }
}

ObjectBrowserValue.propTypes = {
    classes: PropTypes.object,
    type: PropTypes.string,
    states: PropTypes.object,
    value: PropTypes.any,
    expertMode: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    themeType: PropTypes.string,
    socket: PropTypes.object,
    defaultHistory: PropTypes.string,
    dateFormat: PropTypes.string,
    object: PropTypes.object,

    t: PropTypes.func,
    lang: PropTypes.string,
};

export default withStyles(styles)(ObjectBrowserValue);
