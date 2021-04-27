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

class ConfigCertificateSelect extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        let selectOptions = await this.props.socket.getCertificates();

        selectOptions = selectOptions
            .filter(el => this.props.attr.toLowerCase().endsWith(el.type))
            .map(el => ({label: el.name, value: el.name}));

        selectOptions.unshift({label: ConfigGeneric.NONE_LABEL, value: ConfigGeneric.NONE_VALUE});

        this.setState({value, selectOptions});
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.selectOptions) {
            return null;
        }
        // eslint-disable-next-line
        const item = this.state.selectOptions?.find(item => item.value === this.state.value);

        return <FormControl className={this.props.classes.fullWidth}>
            <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
            <Select
                error={!!error}
                displayEmpty
                disabled={!!disabled}
                value={this.state.value}
                renderValue={val => this.getText(item?.label, this.props.schema.noTranslation !== false)}
                onChange={e =>
                    this.setState({ value: e.target.value }, () =>
                        this.onChange(this.props.attr, this.state.value))}
            >
                {this.state.selectOptions?.map(item =>
                    <MenuItem
                        key={item.value}
                        value={item.value}
                        style={item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {}}>{
                            this.getText(item.label, this.props.schema.noTranslation !== false)
                        }</MenuItem>)}
            </Select>
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigCertificateSelect.propTypes = {
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

export default withStyles(styles)(ConfigCertificateSelect);