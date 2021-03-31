import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
});

class ConfigCheckbox extends ConfigGeneric {
    renderItem(error, disabled) {
        const value = this.getValue(this.props.data, this.props.attr);
        if (value && typeof value === 'object') {
            // different case
        }

        return <FormControlLabel
            control={<Checkbox
                checked={!!value}
                onChange={e => this.onChange(this.props.attr, e.target.checked)}
                //error={!!error}
                disabled={!!disabled}
            />}
            label={this.getText(this.props.schema.label)}
        />;
    }
}

ConfigCheckbox.propTypes = {
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

export default withStyles(styles)(ConfigCheckbox);