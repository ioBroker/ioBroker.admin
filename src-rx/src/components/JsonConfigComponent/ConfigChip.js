import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

import ConfigGeneric from './ConfigGeneric';
import { Autocomplete } from '@material-ui/lab';
import { Chip, TextField } from '@material-ui/core';

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
        console.log(value)
        this.setState({ value: value || [] });
    }

    renderItem(error, disabled, defaultValue) {

        const { attr } = this.props;
        const { value, prevValue, } = this.state;
        // eslint-disable-next-line
        return <FormControl className={this.props.classes.fullWidth}>
            <Autocomplete
                multiple
                disabled={!!disabled}
                error={!!error}
                id="tags-standard"
                filterOptions={filter => false}
                freeSolo
                options={[]}
                // getOptionLabel={(option) => option.title}
                // onChange={el=>console.log(el)}

                value={value}
                // renderTags={(tagValue, getTagProps) =>
                //     value.map((option, index) => (
                //       <Chip
                //         label={option}
                //         // {...getTagProps({ index })}
                //         // disabled={value.indexOf(option) !== -1}
                //       />
                //     ))
                //   }
                InputProps={{
                    startAdornment: value?.map((item) => (
                        <Chip
                            key={item}
                            label={item}
                        />
                    )),
                }}
                onBlur={el => {
                    if (prevValue) {
                        const newValue = JSON.parse(JSON.stringify(value));
                        newValue.push(prevValue);
                        this.setState({ value: newValue }, () => {
                            this.onChange(attr, newValue);
                        })
                    }
                }}
                // defaultValue={value}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        onChange={el => this.setState({ prevValue: el.target.value })}
                        variant="standard"
                        label={this.getText(this.props.schema.label)}
                        placeholder={this.getText(this.props.schema.label)}
                    />
                )}
            />
            {this.props.schema.help ? <FormHelperText>{this.getText(this.props.schema.help)}</FormHelperText> : null}
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