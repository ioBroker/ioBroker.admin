import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import I18n from './wrapper/i18n';
import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
});

class ConfigInstanceSelect extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        let adapter = this.props.schema.adapter;
        if (adapter === '_dataSources') {
            adapter = undefined;
        }

        this.props.socket.getAdapterInstances(adapter, true)
            .then(async instances => {
                let selectOptions;
                if (this.props.schema.adapter === '_dataSources') {
                    // get only "data-sources", like history, sql, influx
                    instances = instances.filter(instance => instance && instance.common && instance.common.getHistory);
                } else if (this.props.schema.adapter) {
                    instances = instances.filter(instance => instance && instance._id.startsWith('system.adapter.' + this.props.schema.adapter + '.'));
                }

                selectOptions = instances.map(instance => ({
                    value: this.props.schema.long ? instance._id :
                        (this.props.schema.short ? instance._id.split('.').pop() : instance._id.replace(/^system\.adapter\./, '')),
                    label: `${instance.common.name} [${instance._id.replace(/^system\.adapter\./, '')}]`
                }));

                selectOptions.sort((a, b) => {
                    if (a.value > b.value) {
                        return 1;
                    } else if (a.value < b.value) {
                        return -1;
                    } else {
                        return 0;
                    }
                });

                if (this.props.schema.allowDeactivate !== false) {
                    selectOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
                }
                if (this.props.schema.all) {
                    selectOptions.unshift({ label: I18n.t('sch_all'), value: '*' });
                }

                this.setState({ value: value || '', selectOptions });

                await this.props.socket.subscribeObject(`system.adapter.${adapter ? `${adapter}.` : ''}*`, this.onInstancesUpdate);
            });
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeObject('system.adapter.*', this.onInstancesUpdate)
            .then(() => {});
        super.componentWillUnmount();
    }

    onInstancesUpdate = (id, obj) => {
        if (!id.match(/^system\.adapter\.[-_a-z\d]+\.\d+$/)) {
            return;
        }
        const _id = this.props.schema.long ? id : (this.props.schema.short ? id.split('.').pop() : id.replace(/^system\.adapter\./, ''));
        const index = this.state.selectOptions.findIndex(item => item.value === _id);
        if (!obj) {
            // deleted
            if (index !== -1) {
                const selectOptions = JSON.parse(JSON.stringify(this.state.selectOptions));

                const newState = {};
                if (this.state.value === selectOptions[index].value) {
                    newState.value = ConfigGeneric.NONE_VALUE;
                }
                selectOptions.splice(index, 1);
                newState.selectOptions = selectOptions;

                this.setState(newState);
            }
        } else {
            if (this.props.schema.adapter === '_dataSources' && (!obj.common || !obj.common.getHistory)) {
                return;
            }

            if (index === -1) {
                const selectOptions = JSON.parse(JSON.stringify(this.state.selectOptions));
                selectOptions.push({
                    value: this.props.schema.long ? obj._id :
                        (this.props.schema.short ? obj._id.split('.').pop() : obj._id.replace(/^system\.adapter\./, '')),
                    label: `${obj.common.name} [${obj._id.replace(/^system\.adapter\./, '')}]`
                });
                selectOptions.sort((a, b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0));
                this.setState({ selectOptions });
            }
        }
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(item => item.value === this.state.value);

        return <FormControl className={this.props.classes.fullWidth} key={this.props.attr} variant="standard">
            {this.props.schema.label ? <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel> : null }
            <Select
                variant="standard"
                error={!!error}
                displayEmpty
                disabled={!!disabled}
                value={this.state.value}
                renderValue={val => this.getText(item?.label, true)}
                onChange={e =>
                    this.setState({ value: e.target.value }, () =>
                        this.onChange(this.props.attr, this.state.value))}
            >
                {this.state.selectOptions.map(item =>
                    <MenuItem key={item.value} value={item.value} style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}>{
                        this.getText(item.label, true)
                    }</MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigInstanceSelect.propTypes = {
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

export default withStyles(styles)(ConfigInstanceSelect);