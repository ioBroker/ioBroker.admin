import React from 'react';

import {
    InputLabel,
    MenuItem,
    FormHelperText,
    FormControl,
    Select,
    TextField,
    CircularProgress,
    ListItemText,
    Checkbox,
    Chip,
    Box, InputAdornment, IconButton,
} from '@mui/material';

import {
    Close as CloseIcon,
} from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemSelectSendTo } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

const styles: Record<string, React.CSSProperties> = {
    menuPaper: {
        maxHeight: 800,
    },
};

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

interface ConfigSelectSendToProps extends ConfigGenericProps {
    schema: ConfigItemSelectSendTo;
}

interface ConfigSelectSendToState extends ConfigGenericState {
    list?: { label: string; value: string; hidden?: boolean }[];
    context?: string;
}

class ConfigSelectSendTo extends ConfigGeneric<ConfigSelectSendToProps, ConfigSelectSendToState> {
    componentDidMount() {
        super.componentDidMount();

        this.askInstance();
    }

    askInstance() {
        if (this.props.alive) {
            let data: Record<string, any> | undefined = this.props.schema.data;
            if (data === undefined && this.props.schema.jsonData) {
                const dataStr: string = this.getPattern(this.props.schema.jsonData);
                try {
                    data = JSON.parse(dataStr);
                } catch (e) {
                    console.error(`Cannot parse json data: ${dataStr}`);
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

    getContext(): string {
        const context: Record<string, any> = {};

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

    renderItem(error: unknown, disabled: boolean /* , defaultValue */) {
        if (this.props.alive) {
            const context = this.getContext();
            if (context !== this.state.context) {
                setTimeout(() => this.askInstance(), 300);
            }
        }

        const value = this._getValue();

        if (!this.props.alive) {
            if (this.props.schema.multiple || this.props.schema.manual === false) {
                return I18n.t('ra_Cannot retrieve options, as instance is offline');
            }
            return <TextField
                variant="standard"
                fullWidth
                value={value}
                error={!!error}
                disabled={!!disabled}
                onChange={e => {
                    const value_ = e.target.value;
                    this.setState({ value: value_ }, () =>
                        this.onChange(this.props.attr, (value_ || '').trim()));
                }}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
                InputProps={{
                    endAdornment: this.state.value && !this.props.schema.noClearButton ? <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => this.setState({ value: '' }, () =>
                                this.onChange(this.props.attr, ''))}
                        >
                            <CloseIcon />
                        </IconButton>
                    </InputAdornment> : null,
                }}
            />;
        }
        if (!this.state.list) {
            return <CircularProgress size="small" />;
        }
        const selectOptions = this.state.list
            .filter(item => {
                if (!item.hidden) {
                    return true;
                }
                if (this.props.custom) {
                    return !this.executeCustom(item.hidden, this.props.data, this.props.customObj, this.props.instanceObj, this.props.arrayIndex, this.props.globalData);
                }
                return !this.execute(item.hidden, this.props.schema.default, this.props.data, this.props.arrayIndex, this.props.globalData);
            });

        const item = selectOptions.find(it => it.value === value);

        return <FormControl variant="standard" fullWidth>
            {this.props.schema.label ? <InputLabel>{this.getText(this.props.schema.label)}</InputLabel> : null}
            <Select
                variant="standard"
                error={!!error}
                multiple={this.props.schema.multiple}
                disabled={!!disabled}
                // MenuProps={this.props.schema.multiple ? { classes: { paper: this.props.classes.menuPaper } } : undefined}
                sx={{
                    '&.MuiSelect-paper': this.props.schema.multiple ? styles.menuPaper : undefined,
                }}
                value={value}
                renderValue={val =>
                    (this.props.schema.multiple ?
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {val.map((v: string) => {
                                const it = selectOptions.find(_item => _item.value === v);
                                if (it || this.props.schema.showAllValues !== false) {
                                    const label = it?.label || v;
                                    return <Chip
                                        key={v}
                                        label={label}
                                    />;
                                }
                                return null;
                            })}
                        </Box>
                        :
                        (item?.label || val))}
                onChange={e => {
                    this.onChange(this.props.attr, e.target.value);
                }}
            >
                {selectOptions.map((it, i) =>
                    <MenuItem key={i} value={it.value}>
                        { this.props.schema.multiple ? <Checkbox
                            checked={value.includes(it.value)}
                            onClick={() => {
                                const _value = JSON.parse(JSON.stringify(this._getValue()));
                                const pos = value.indexOf(it.value);
                                if (pos !== -1) {
                                    _value.splice(pos, 1);
                                } else {
                                    _value.push(it.value);
                                    _value.sort();
                                }
                                this.setState({ value: _value }, () => this.onChange(this.props.attr, _value));
                            }}
                        /> : null }
                        <ListItemText primary={it.label} />
                    </MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

export default ConfigSelectSendTo;
