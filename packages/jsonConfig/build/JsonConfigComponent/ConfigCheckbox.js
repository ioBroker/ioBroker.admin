import React from 'react';
import { withStyles } from '@mui/styles';
import { FormControlLabel, Checkbox, FormHelperText, FormControl, } from '@mui/material';
import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';
const styles = () => ({
    error: {
        color: 'red',
    },
});
class ConfigCheckbox extends ConfigGeneric {
    renderItem(error, disabled) {
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const isIndeterminate = Array.isArray(value);
        return React.createElement(FormControl, { className: this.props.classes.fullWidth, variant: "standard" },
            React.createElement(FormControlLabel, { onClick: e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) {
                        this.onChange(this.props.attr, !value);
                    }
                }, control: React.createElement(Checkbox, { indeterminate: isIndeterminate, checked: !!value, onChange: e => {
                        if (isIndeterminate) {
                            this.onChange(this.props.attr, true);
                        }
                        else {
                            this.onChange(this.props.attr, e.target.checked);
                        }
                    }, disabled: disabled }), label: this.getText(this.props.schema.label) }),
            React.createElement(FormHelperText, { className: this.props.classes.error }, error ? (this.props.schema.validatorErrorText ? I18n.t(this.props.schema.validatorErrorText) : I18n.t('ra_Error')) :
                null),
            this.props.schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
export default withStyles(styles)(ConfigCheckbox);
//# sourceMappingURL=ConfigCheckbox.js.map