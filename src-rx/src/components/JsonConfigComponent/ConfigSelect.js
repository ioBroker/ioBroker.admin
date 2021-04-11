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

class ConfigSelect extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);

        const selectOptions = JSON.parse(JSON.stringify(this.props.schema.options));

        // if __different
        if (Array.isArray(value)) {
            this.initialValue = [...value];
            selectOptions.unshift({label: ConfigGeneric.DIFFERENT_LABEL, value: ConfigGeneric.DIFFERENT_VALUE});
            this.setState({value: ConfigGeneric.DIFFERENT_VALUE, selectOptions});
        } else {
            this.setState({value, selectOptions});
        }
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }
        // eslint-disable-next-line
        const item = this.state.selectOptions?.find(item => item.value == this.state.value); // let "==" be and not ===

        return <FormControl className={this.props.classes.fullWidth}>
            <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                error={!!error}
                disabled={!!disabled}
                value={this.state.value || '_'}
                renderValue={val => this.getText(item?.label, this.props.schema.noTranslation)}
                onChange={e => {
                    this.setState({value: e.target.value === '_' ? '' : e.target.value}, () => {
                        if (this.state.value === ConfigGeneric.DIFFERENT_VALUE) {
                            this.onChange(this.props.attr, this.initialValue);
                        } else {
                            this.onChange(this.props.attr, this.state.value);
                        }
                    });
                }}
            >
                {this.state.selectOptions?.map(item =>
                    <MenuItem key={item.value} value={item.value} style={item.value === ConfigGeneric.DIFFERENT_VALUE ? {opacity: 0.5} : {}}>{this.getText(item.label, this.props.schema.noTranslation)}</MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.getText(this.props.schema.help)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigSelect.propTypes = {
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

export default withStyles(styles)(ConfigSelect);