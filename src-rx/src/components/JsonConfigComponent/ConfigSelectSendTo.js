import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import ConfigGeneric from './ConfigGeneric';
import TextField from "@material-ui/core/TextField";
import React from "react";
import {CircularProgress} from "@material-ui/core";

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
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
                data = this.getPattern(this.props.schema.jsonData, {}, this.props.data);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Cannot parse json data: ' + data);
                }
            }

            if (data === undefined) {
                data = null;
            }

            this.props.socket.sendTo(this.props.adapterName + '.' + this.props.instance, this.props.schema.command || 'send', data)
                .then(list => {
                    this.setState({list, context: this.getContext()});
                });
        } else {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            this.setState({value});
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

    renderItem(error, disabled, defaultValue) {
        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this.state.context) {
                setTimeout(() => {
                    this.askInstance();
                }, 300);
            }
        }

        if (!this.props.alive) {
            return <TextField
                fullWidth
                value={this.state.value === null || this.state.value === undefined ? '' : this.state.value}
                error={!!error}
                disabled={!!disabled}
                onChange={e => {
                    const value = e.target.value;
                    this.setState({value}, () =>
                        this.onChange(this.props.attr, (value || '').trim()));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
            />;
        } else
        if (!this.state.list) {
            return <CircularProgress size="small"/>;
        } else {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

            const selectOptions = (this.state.list || []).filter(item => {
                if (!item.hidden) {
                    return true;
                } else if (this.props.custom) {
                    return !this.executeCustom(item.hidden, this.props.schema.default, this.props.data, this.props.instanceObj);
                } else {
                    return !this.execute(item.hidden, this.props.schema.default, this.props.data);
                }
            });

            const item = selectOptions.find(item => item.value === value);

            return <FormControl className={this.props.classes.fullWidth}>
                <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                <Select
                    error={!!error}
                    disabled={!!disabled}
                    value={value}
                    renderValue={val => item?.label || val}
                    onChange={e => this.onChange(this.props.attr, e.target.value)}
                >
                    {selectOptions.map((item, i) =>
                        <MenuItem key={i} value={item.value}>{item.label}</MenuItem>)}
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
