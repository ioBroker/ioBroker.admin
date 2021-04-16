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
                case 'listUart':
                    if (obj.callback) {
                        try {
                            const serialport = require('serialport');
                            if (serialport) {
                                // read all found serial ports
                                serialport.list()
                                    .then(ports => {
                                        adapter.log.info('List of port: ' + JSON.stringify(ports));
                                        adapter.sendTo(obj.from, obj.command, ports, obj.callback);
                                    })
                                    .catch(e => {
                                        adapter.sendTo(obj.from, obj.command, [], obj.callback);
                                        adapter.log.error(e)
                                    });
                            } else {
                                adapter.log.warn('Module serialport is not available');
                                adapter.sendTo(obj.from, obj.command, [{comName: 'Not available'}], obj.callback);
                            }
                        } catch (e) {
                            adapter.sendTo(obj.from, obj.command, [{comName: 'Not available'}], obj.callback);
                        }
                    }

                    break;
            }
        }
    });
 */

class ConfigComPort extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        if (this.props.alive) {
            this.props.socket.sendTo(this.props.adapterName + '.' + this.props.instance, 'listUart', null)
                .then(list => {
                    list = list || [];
                    const notAvailable = list.find(item => item.comName === 'Not available');
                    if (!notAvailable) {
                        if (this.props.schema.filter) {
                            const filter = new RegExp(this.props.schema.filter);
                            list = list.filter(item => item && filter.exec(item.path));
                        }
                        list = list.map(item => ({name: item.comName ? `${item.comName} [${item.path}]` : item.path, value: item.path}));
                    } else {
                        list = [];
                    }

                    this.setState({list, notAvailable});
                });
        } else {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            this.setState({value});
        }
    }

    renderItem(error, disabled, defaultValue) {
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
                helperText={this.getText(this.props.schema.help)}
            />;
        } else
        if (!this.state.list) {
            return <CircularProgress size="small"/>;
        } else {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            const item = this.state.list.find(item => item.value === value);

            return <FormControl className={this.props.classes.fullWidth}>
                <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
                <Select
                    error={!!error}
                    disabled={!!disabled}
                    value={value}
                    renderValue={val => item?.name || val}
                    onChange={e => this.onChange(this.props.attr, e.target.value)}
                >
                    {this.state.list.map((item, i) =>
                        <MenuItem key={i} value={item.value}>{item.name}</MenuItem>)}
                </Select>
                {this.props.schema.help ? <FormHelperText>{this.getText(this.props.schema.help)}</FormHelperText> : null}
            </FormControl>;
        }
    }
}

ConfigComPort.propTypes = {
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

export default withStyles(styles)(ConfigComPort);