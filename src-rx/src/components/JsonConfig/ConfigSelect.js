import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import I18n from '@iobroker/adapter-react/i18n';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigSelect extends ConfigGeneric {
    renderItem(error, disabled) {
        const value = this.getValue(this.props.data, this.props.attr);
        const item = this.props.schema.options?.find(item => item.value === value);

        return <FormControl className={this.props.classes.fullWidth}>
            <InputLabel>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                error={!!error}
                disabled={!!disabled}
                value={value}
                renderValue={val => this.getText(item?.label, this.props.schema.noTranslation)}
                onChange={e => this.onChange(this.props.attr, e.target.value)}
            >
                {this.props.schema.options?.map(item =>
                    <MenuItem value={item.value}>{this.getText(item.label, this.props.schema.noTranslation)}</MenuItem>)}
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
    onChanged: PropTypes.func,
};

export default withStyles(styles)(ConfigSelect);