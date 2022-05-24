import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import I18n from '@iobroker/adapter-react-v5/i18n';
import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigInstanceSelect extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        let adapter = this.props.schema.adapter;
        if (adapter === '_dataSources') {
            adapter = undefined;
        }

        this.props.socket.getAdapterInstances(adapter)
            .then(instances => {
                let selectOptions;
                if (this.props.schema.adapter === '_dataSources') {
                    // get only "data-sources", like history, sql, influx
                    instances = instances.filter(instance => instance && instance.common && instance.common.getHistory);
                }

                selectOptions = instances.map(instance => ({
                    value: this.props.schema.long ? instance._id :
                        (this.props.schema.short ? instance._id.split('.').pop() : instance._id.replace(/^system\.adapter\./, '')),
                    label: `${instance.common.name} [${instance._id.replace(/^system\.adapter\./, '')}]`
                }));

                selectOptions.unshift({ label: ConfigGeneric.NONE_LABEL, value: ConfigGeneric.NONE_VALUE });
                if (this.props.schema.all) {
                    selectOptions.unshift({ label: I18n.t('all'), value: '*' });
                }

                this.setState({ value: value || '', selectOptions });
            });
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(item => item.value === this.state.value);

        return <FormControl className={this.props.classes.fullWidth} key={this.props.attr} variant="standard">
            <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
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