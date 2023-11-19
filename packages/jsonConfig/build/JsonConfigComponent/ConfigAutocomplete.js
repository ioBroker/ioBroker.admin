import React from 'react';
import { withStyles } from '@mui/styles';
import { Autocomplete, TextField } from '@mui/material';
import I18n from './wrapper/i18n';
import ConfigGeneric from './ConfigGeneric';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});
class ConfigAutocomplete extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        const selectOptions = this.props.schema.options.map((item) => (typeof item === 'string' ? { label: item, value: item } : JSON.parse(JSON.stringify(item))));
        // if __different
        if (Array.isArray(value)) {
            selectOptions.unshift({ label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE });
            this.setState({ value: ConfigGeneric.DIFFERENT_VALUE, selectOptions });
        }
        else {
            this.setState({ value, selectOptions });
        }
    }
    renderItem(error, disabled) {
        if (!this.state.selectOptions) {
            return null;
        }
        let item;
        const options = JSON.parse(JSON.stringify(this.state.selectOptions));
        const isIndeterminate = Array.isArray(this.state.value) || this.state.value === ConfigGeneric.DIFFERENT_VALUE;
        if (isIndeterminate) {
            [...this.state.value]
                .filter(val => !options.find(it => it.value === val))
                .forEach(it => options.push({ label: it.toString(), value: it }));
            item = { label: I18n.t(ConfigGeneric.DIFFERENT_LABEL), value: ConfigGeneric.DIFFERENT_VALUE };
            options.unshift(item);
        }
        else {
            // eslint-disable-next-line
            item = this.state.value !== null && this.state.value !== undefined && options.find(item => item.value == this.state.value); // let "==" be and not ===
            if (this.state.value !== null && this.state.value !== undefined && !item && this.props.schema.freeSolo) {
                item = { value: this.state.value, label: this.state.value };
                options.push(item);
            }
        }
        return React.createElement(Autocomplete, { className: this.props.classes.indeterminate, fullWidth: true, freeSolo: !!this.props.schema.freeSolo, value: item, options: options, 
            // autoComplete
            onInputChange: e => {
                if (!e || !this.props.schema.freeSolo) {
                    return;
                }
                const val = e.target.value;
                if (val !== this.state.value) {
                    this.setState({ value: val }, () => this.onChange(this.props.attr, val));
                }
            }, onChange: (_, value) => {
                const val = typeof value === 'object' ? (value ? value.value : '') : value;
                if (val !== this.state.value) {
                    this.setState({ value: val }, () => this.onChange(this.props.attr, val));
                }
            }, getOptionLabel: option => (typeof option === 'object' ? (option?.label ?? '') : ''), renderInput: params => React.createElement(TextField, { variant: "standard", ...params, error: !!error, 
                // inputProps are important and will be given in params
                // inputProps={{maxLength: this.props.schema.maxLength || this.props.schema.max || undefined}}
                placeholder: this.getText(this.props.schema.placeholder), label: this.getText(this.props.schema.label), helperText: this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation), disabled: disabled }) });
    }
}
export default withStyles(styles)(ConfigAutocomplete);
//# sourceMappingURL=ConfigAutocomplete.js.map