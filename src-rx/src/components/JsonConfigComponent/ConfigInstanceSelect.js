import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

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

        this.props.socket.getAdapterInstances(this.props.schema.adapter)
            .then(instances => {
                const selectOptions = instances.map(instance => ({
                    value: this.props.schema.long ? instance._id :
                        (this.props.schema.short ? instance._id.split('.').pop() : instance._id.replace(/^system\.adapter\./, '')),
                    label: `${instance.common.name} [${instance._id.replace(/^system\.adapter\./, '')}]`
                }));

                selectOptions.unshift({ label: ConfigGeneric.NONE_LABEL, value: ConfigGeneric.NONE_VALUE });

                this.setState({ value: value || '', selectOptions });
            });
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }

        const item = this.state.selectOptions?.find(item => item.value === this.state.value);

        return <FormControl className={this.props.classes.fullWidth} key={this.props.attr}>
            <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
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