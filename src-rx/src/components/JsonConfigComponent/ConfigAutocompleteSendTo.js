import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import {Autocomplete} from '@material-ui/lab';
import TextField from '@material-ui/core/TextField';


import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigAutocompleteSendTo extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const selectOptions = this.props.schema.options.map(item => typeof item === 'string' ? {label: item, value: item} : JSON.parse(JSON.stringify(item)));

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
                    list.forEach(item => selectOptions.push(typeof item === 'string' ? {label: item, value: item} : JSON.parse(JSON.stringify(item))));

                    // if __different
                    if (Array.isArray(value)) {
                        selectOptions.unshift({label: ConfigGeneric.DIFFERENT_LABEL, value: ConfigGeneric.DIFFERENT_VALUE});
                        this.setState({value: ConfigGeneric.DIFFERENT_VALUE, selectOptions});
                    } else {
                        this.setState({value, selectOptions});
                    }
                });
        } else {
            // if __different
            if (Array.isArray(value)) {
                selectOptions.unshift({label: ConfigGeneric.DIFFERENT_LABEL, value: ConfigGeneric.DIFFERENT_VALUE});
                this.setState({value: ConfigGeneric.DIFFERENT_VALUE, selectOptions});
            } else {
                this.setState({value, selectOptions});
            }
        }
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }
        let item;
        let options = JSON.parse(JSON.stringify(this.state.selectOptions));
        let isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_LABEL;

        if (isIndeterminate) {
            [...this.state.value]
                .filter(val => !options.find(it => it.value === val))
                .forEach(item => options.push({name: item.toString(), value: item}));

            item = {name: ConfigGeneric.DIFFERENT_LABEL, value: ConfigGeneric.DIFFERENT_VALUE};
            options.unshift(item);
        } else {
            // eslint-disable-next-line
            item = this.state.value !== null && this.state.value !== undefined && options.find(item => item.value == this.state.value); // let "==" be and not ===
            if (this.state.value !== null && this.state.value !== undefined && !item) {
                item = {value: this.state.value, label: this.state.value};
                options.push(item);
            }
        }

        return <Autocomplete
            className={this.props.classes.indeterminate}
            fullWidth
            freeSolo={!!this.props.schema.freeSolo}
            value={item}
            //getOptionSelected={(option, value) => option.value === value.value}
            onChange={(_, value) => {
                const val = typeof value === 'object' ? (value ? value.value : '') : value;
                this.setState({value: val}, () => this.onChange(this.props.attr, val));
            }}
            options={options}
            getOptionLabel={option => option.label}
            renderInput={params => <TextField
                {...params}
                error={!!error}
                placeholder={this.getText(this.props.schema.placeholder)}
                label={this.getText(this.props.schema.label)}
                helperText={this.getText(this.props.schema.help)}
                disabled={!!disabled}
            />}
        />;
    }
}

ConfigAutocompleteSendTo.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(ConfigAutocompleteSendTo);