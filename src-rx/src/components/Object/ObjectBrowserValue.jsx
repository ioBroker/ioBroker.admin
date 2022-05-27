import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';

import AceEditor from 'react-ace';
// import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import Hidden from '@mui/material/Hidden';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Autocomplete from '@mui/material/Autocomplete';

import ChartIcon from '@mui/icons-material/ShowChart';
import IconCancel from '@mui/icons-material/Close';
import IconCheck from '@mui/icons-material/Check';

import ObjectChart from './ObjectChart';

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
    },
    wrapperButton: {
    },
    '@media screen and (max-width: 465px)': {
        wrapperButton: {
            '& *': {
                fontSize: 12
            }
        },
    },
    '@media screen and (max-width: 380px)': {
        wrapperButton: {
            '& *': {
                fontSize: 11
            }
        },
    },
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
            if (this.value && typeof this.value === 'string' &&
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

        this.inputRef = React.createRef();

        this.chartFrom = Date.now() - 3600000 * 2;
    }

    componentDidMount() {
        if (this.props.defaultHistory &&
            this.props.object?.common?.custom &&
            this.props.object.common.custom[this.props.defaultHistory]?.enabled) {
            this.props.socket.getState('system.adapter.' + this.props.defaultHistory + '.alive')
                .then(state => this.setState({chart: state && !!state.val}));
        }

        setTimeout(() => {
            if (this.inputRef && this.inputRef.current) {
                const el = this.inputRef.current;
                const value = el.value || '';
                el.setSelectionRange(0, value.length);
            }
        }, 200);
    }

    onUpdate(e) {
        e && e.stopPropagation();
        let value = this.value;
        if (this.state.type === 'states') {
            let type = this.props.type || typeof this.props.value;
            value = typeof value === 'object' ? value.value : value;

            if (type === 'number') {
                if (typeof value === 'string') {
                    value = parseFloat(value.replace(',', '.')) || 0;
                }
            } else if (type === 'boolean') {
                value = value === true || value === 'true' || value === '1' || value === 'ON' || value === 'on';
            }
        } else
        if (this.state.type === 'number') {
            if (typeof value === 'string') {
                value = parseFloat(value.replace(',', '.')) || 0;
            }
        } else if (this.state.type === 'boolean') {
            value = value === true || value === 'true' || value === '1' || value === 'ON' || value === 'on';
        }

        this.props.onClose({val: value, ack: this.ack, q: this.q, expire: parseInt(this.expire, 10) || undefined});
    }

    renderChart() {
        return <ObjectChart
            t={this.props.t}
            isFloatComma={this.props.isFloatComma}
            showJumpToEchart={false}
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
            if (this.props.type === 'number' && this.props.object.common.max !== undefined && this.props.object.common.min !== undefined) {
                const options = Object.keys(this.props.states).map(key => ({label: this.props.states[key], value: key}));

                return <Autocomplete
                    className={ this.props.classes.formControl }
                    disablePortal
                    defaultValue={ this.props.states[this.propsValue] !== undefined ? this.props.states[this.propsValue] : this.propsValue}
                    options={options}
                    noOptionsText=""
                    freeSolo
                    getOptionLabel={option => option.label || (option !== undefined && option !== null ? option.toString() : '')}
                    onChange={(e, value) => this.value = value}
                    onInputChange={(e, value) => this.value = value}
                    onKeyUp={e => e.keyCode === 13 && this.onUpdate(e)}
                    renderInput={params => <TextField
                        {...params}
                        label={this.props.t('Value')}
                        variant="standard"
                    />}
                />
            } else {
                return <FormControl variant="standard" className={ this.props.classes.formControl }>
                    <InputLabel>{ this.props.t('Value') }</InputLabel>
                    <Select
                        variant="standard"
                        defaultValue={ this.propsValue }
                        onChange={ e => this.value = e.target.value }
                    >
                        {Object.keys(this.props.states).map((key, i) => <MenuItem key={i} value={key}>{this.props.states[key]}</MenuItem>)}
                    </Select>
                </FormControl>;
            }
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
                                        variant="standard"
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
                                                        onKeyUp={e => e.keyCode === 13 && this.onUpdate(e) }
                                                        onChange={e => this.value = e.target.checked}
                                                    />
                                                </Grid>
                                                <Grid item>TRUE</Grid>
                                            </Grid>
                                        </Typography>
                                        :
                                        (this.state.type === 'number' ?
                                                <TextField
                                                    variant="standard"
                                                    classes={{ root: this.props.classes.textInput }}
                                                    autoFocus
                                                    inputRef={this.inputRef}
                                                    helperText={ this.props.t('Press ENTER to write the value, when focused') }
                                                    label={ this.props.t('Value') }
                                                    defaultValue={ parseFloat(this.propsValue) || 0 }
                                                    onKeyUp={ e => e.keyCode === 13 && this.onUpdate(e) }
                                                    onChange={ e => this.value = e.target.value }/>
                                                :
                                                (this.state.type === 'json' ?
                                                        this.renderJsonEditor()
                                                        :
                                                        (this.state.type === 'states' ?
                                                                this.renderStates()
                                                                :
                                                                <TextField
                                                                    variant="standard"
                                                                    classes={{ root: this.props.classes.textInput }}
                                                                    inputRef={this.inputRef}
                                                                    autoFocus
                                                                    helperText={ this.props.t('Press CTRL+ENTER to write the value, when focused')}
                                                                    label={ this.props.t('Value') }
                                                                    fullWidth={ true }
                                                                    multiline
                                                                    onKeyUp={e => e.ctrlKey && e.keyCode === 13 && this.onUpdate(e) }
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

                                { this.props.expertMode ? <Grid item><FormControl variant="standard" className={ this.props.classes.quality }>
                                    <InputLabel>{ this.props.t('Quality') }</InputLabel>
                                    <Select
                                        variant="standard"
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
                                        variant="standard"
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
            <DialogActions className={this.props.classes.wrapperButton}>
                <Button variant="contained" onClick={ e => this.onUpdate(e) } color="primary" startIcon={<IconCheck />}>{ this.props.t('Set value') }</Button>
                <Button variant="contained" onClick={ () => this.props.onClose() } color="grey" startIcon={<IconCancel />}>{ this.props.t('Cancel') }</Button>
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
    isFloatComma: PropTypes.bool,

    t: PropTypes.func,
    lang: PropTypes.string,
};

export default withStyles(styles)(ObjectBrowserValue);
