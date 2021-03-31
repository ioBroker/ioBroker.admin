import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
});

class ConfigNumber extends ConfigGeneric {
    renderItem(error, disabled) {
        const value = this.getValue(this.props.data, this.props.attr);
        if (value && typeof value === 'object') {
            // different case
        }

        return <TextField
            type="number"
            fullWidth
            inputProps={{min: this.props.schema.min, max: this.props.schema.max}}
            value={value}
            error={!!error}
            disabled={!!disabled}
            onChange={e => this.onChange(this.props.attr, e.target.value)}
            placeholder={this.getText(this.props.schema.placeholder)}
            label={this.getText(this.props.schema.label)}
            helperText={this.getText(this.props.schema.help)}
        />;
    }
}

ConfigNumber.propTypes = {
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

export default withStyles(styles)(ConfigNumber);