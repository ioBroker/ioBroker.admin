import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

import ConfigGeneric from './ConfigGeneric';
import UploadImage from '../UploadImage';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigCertificateSelect extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
        this.setState({ value });
    }

    renderItem(error, disabled, defaultValue) {
        // eslint-disable-next-line
        return <FormControl className={this.props.classes.fullWidth}>
            <InputLabel shrink>{this.getText(this.props.schema.label)}</InputLabel>
            <UploadImage
                error={!!error}
                disabled={disabled}
                accept={this.props.schema.accept}
                crop={this.props.schema.crop}
                maxSize={this.props.schema.maxSize || 256 * 1024}
                icon={this.state.value}
                removeIconFunc={() =>
                    this.setState({ value: null }, () =>
                        this.onChange(this.props.attr, this.state.value))}
                onChange={base64 =>
                    this.setState({ value: base64 }, () =>
                        this.onChange(this.props.attr, this.state.value))}
                t={this.props.t}
            />
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