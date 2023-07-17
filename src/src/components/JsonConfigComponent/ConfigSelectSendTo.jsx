import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

import I18n from './wrapper/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%',
    },
    menuPaper: {
        maxHeight: 800,
    },
});

/*
to use this option, your adapter must implement listUart message

adapter.on('message', obj => {
   if (obj) {
       switch (obj.command) {
           case 'command':
               if (obj.callback) {
                   try {
                       const serialport = require('serialport');
                       if (serialport) {
                           // read all found serial ports
                           serialport.list()
                               .then(ports => {
                                   adapter.log.info('List of port: ' + JSON.stringify(ports));
                                   adapter.sendTo(obj.from, obj.command, ports.map(item =>
                                        ({label: item.path, value: item.path})), obj.callback);
                               })
                               .catch(e => {
                                   adapter.sendTo(obj.from, obj.command, [], obj.callback);
                                   adapter.log.error(e)
                               });
                       } else {
                           adapter.log.warn('Module serialport is not available');
                           adapter.sendTo(obj.from, obj.command, [{label: 'Not available', value: ''}], obj.callback);
                       }
                   } catch (e) {
                       adapter.sendTo(obj.from, obj.command, [{label: 'Not available', value: ''}], obj.callback);
                   }
               }

               break;
       }
   }
});
 */

class ConfigSelectSendTo extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();

        this.askInstance();
    }

    askInstance(){
        if (this.props.alive) {
            let data = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                data = this.getPattern(this.props.schema.jsonData);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Cannot parse json data: ' + data);
                }
            }

            if (data === undefined) {
                data = null;
            }

            this.props.socket.sendTo(`${this.props.adapterName}.${this.props.instance}`, this.props.schema.command || 'send', data)
                .then(list =>
                    this.setState({ list, context: this.getContext() }));
        } else {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

            this.setState({ value });
        }
    }

    getContext() {
        const context = {};

        if (Array.isArray(this.props.schema.alsoDependsOn)) {
            this.props.schema.alsoDependsOn.forEach(attr =>
                context[attr] = ConfigGeneric.getValue(this.props.data, attr));
        }

        return JSON.stringify(context);
    }

    _getValue() {
        let value = this.state.value === null || this.state.value === undefined ? ConfigGeneric.getValue(this.props.data, this.props.attr) : this.state.value;

        if (this.props.schema.multiple) {
            if (typeof value === 'string') {
                value = [value];
            } else if (value === null || value === undefined) {
                value = [];
            }
        }

        return value;
    }

    renderItem(error, disabled, defaultValue) {
        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this.state.context) {
                setTimeout(() => this.askInstance(), 300);
            }
        }

        let value = this._getValue();

        if (!this.props.alive) {
            if (this.props.schema.multiple || this.props.schema.manual === false) {
                return I18n.t('ra_Cannot retrieve options, as instance is offline');
            } else {
                return <TextField
                    variant="standard"
                    fullWidth
                    value={value}
                    error={!!error}
                    disabled={!!disabled}
                    onChange={e => {
                        const value = e.target.value;
                        this.setState({ value }, () =>
                            this.onChange(this.props.attr, (value || '').trim()));
                    }}
                    placeholder={this.getText(this.props.schema.placeholder)}
                    label={this.getText(this.props.schema.label)}
                    helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                />;
            }
        } else
        if (!this.state.list) {
            return <CircularProgress size="small"/>;
        } else {
            const selectOptions = this.state.list
                .filter(item => {
                    if (!item.hidden) {
                        return true;
                    } else if (this.props.custom) {
                        return !this.executeCustom(item.hidden, this.props.schema.default, this.props.data, this.props.instanceObj, this.props.arrayIndex, this.props.globalData);
                    } else {
                        return !this.execute(item.hidden, this.props.schema.default, this.props.data, this.props.arrayIndex, this.props.globalData);
                    }
                });

            const item = selectOptions.find(item => item.value === value);

            return <FormControl variant="standard" className={this.props.classes.fullWidth}>
                { this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null }
                <Select
                    variant="standard"
                    error={!!error}
                    multiple={this.props.schema.multiple}
                    disabled={!!disabled}
                    value={value}
                    MenuProps={this.props.schema.multiple ? { classes: { paper: this.props.classes.menuPaper } } : undefined}
                    renderValue={val =>
                        this.props.schema.multiple ?
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {val.map(v => {
                                    const item = selectOptions.find(_item => _item.value === v);
                                    if (item || this.props.schema.showAllValues !== false) {
                                        const label = item?.label || v;
                                        return <Chip key={v} label={label}/* onDelete={e => {
                                        e.stopPropagation();
                                        e.preventDefault ();
                                        let _value = JSON.parse(JSON.stringify(this._getValue()));
                                        const pos = value.indexOf(v);
                                        if (pos !== -1) {
                                            _value.splice(pos, 1);
                                            this.setState({ value: _value }, () => this.onChange(this.props.attr, _value));
                                        }
                                    }}*/ />;
                                    } else {
                                        return null;
                                    }
                                })}
                            </Box>
                            :
                            (item?.label || val)
                }
                    onChange={e => {
                        this.onChange(this.props.attr, e.target.value);
                    }}
                >
                    {selectOptions.map((item, i) =>
                        <MenuItem key={i} value={item.value}>
                            { this.props.schema.multiple ? <Checkbox
                                checked={value.includes(item.value)}
                                onClick={() => {
                                    let _value = JSON.parse(JSON.stringify(this._getValue()));
                                    const pos = value.indexOf(item.value);
                                    if (pos !== -1) {
                                        _value.splice(pos, 1);
                                    } else {
                                        _value.push(item.value);
                                        _value.sort();
                                    }
                                    this.setState({ value: _value }, () => this.onChange(this.props.attr, _value));
                                }}/> : null }
                            <ListItemText primary={item.label} />
                        </MenuItem>)}
                </Select>
                {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
            </FormControl>;
        }
    }
}

ConfigSelectSendTo.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    adapterName: PropTypes.string,
    alive: PropTypes.bool,
    instance: PropTypes.number,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigSelectSendTo);
