import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';

import ConfigGeneric from './ConfigGeneric';
import ChipInput from './ChipInput';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    }
});

class ConfigLanguage extends ConfigGeneric {
    componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr);
        if (this.props.schema.delimiter && typeof value === 'string') {
            const parts = value.split(this.props.schema.delimiter).map(a => a.trim()).filter(a => a);
            this.setState({ value: parts });
        } else {
            this.setState({ value: value || [] });
        }
    }

    renderItem(error, disabled, defaultValue) {
        const { attr,schema } = this.props;
        const { value } = this.state;
        return <FormControl className={this.props.classes.fullWidth} variant="standard">
            <ChipInput
                value={value}
                disabled={!!disabled}
                label={this.getText(schema.label)}
                error={!!error}
                onAdd={chip => {
                        const newValue = JSON.parse(JSON.stringify(value));
                        newValue.push(chip);
                        this.setState({ value: newValue, prevValue: '' }, () => {
                            if (this.props.schema.delimiter) {
                                this.onChange(attr, newValue.join(this.props.schema.delimiter + ' '));
                            } else {
                                this.onChange(attr, newValue);
                            }
                        });
                }}
                onDelete={(chip, index) => {
                    const newValue = JSON.parse(JSON.stringify(value));
                    newValue.splice(index, 1);
                    this.setState({ value: newValue, prevValue: '' }, () => {
                        if (this.props.schema.delimiter) {
                            this.onChange(attr, newValue.join(this.props.schema.delimiter + ' '));
                        } else {
                            this.onChange(attr, newValue);
                        }
                    });
                }}
            />
            {this.props.schema.help ? <FormHelperText>{this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigLanguage.propTypes = {
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

export default withStyles(styles)(ConfigLanguage);