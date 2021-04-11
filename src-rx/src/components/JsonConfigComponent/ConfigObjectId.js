import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import { Button, TextField } from '@material-ui/core';

import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

import ConfigGeneric from './ConfigGeneric';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    flex: {
        display: 'flex'
    },
    button: {
        height: 48,
        marginLeft: 4,
        minWidth: 48,
    }
});

class ConfigObjectId extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || '';
        this.setState({ value, initialized: true});
    }

    renderItem(error, disabled, defaultValue) {
        if (!this.state.initialized) {
            return null;
        }
        const { classes, schema, socket, attr } = this.props;
        const { value, showSelectId } = this.state;

        return <FormControl className={classes.fullWidth}>
            <InputLabel shrink>{this.getText(schema.label)}</InputLabel>
            <div className={classes.flex}>
                <TextField
                    fullWidth
                    value={value}
                    error={!!error}
                    disabled={disabled}
                    placeholder={this.getText(schema.placeholder)}
                    label={this.getText(schema.label)}
                    helperText={this.getText(schema.help)}
                    onChange={e => {
                        const value = e.target.value;
                        this.setState({ value }, () =>
                            this.onChange(attr, value))
                    }}
                />
                <Button
                    className={this.props.classes.button}
                    size="small"
                    variant="outlined"
                    onClick={() => this.setState({ showSelectId: true })}
                >...</Button>
            </div>
            {showSelectId ? <DialogSelectID
                imagePrefix="../.."
                dialogName={'admin.' + this.props.adapterName}
                themeType={this.props.themeType}
                socket={socket}
                statesOnly={this.props.schema.all === undefined ? true : this.props.schema.all}
                selected={value}
                onClose={() => this.setState({ showSelectId: false })}
                onOk={value =>
                    this.setState({ showSelectId: false, value }, () =>
                        this.onChange(attr, value))}
            /> : null}
            {schema.help ? <FormHelperText>{this.getText(schema.help)}</FormHelperText> : null}
        </FormControl>;
    }
}

ConfigObjectId.propTypes = {
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

export default withStyles(styles)(ConfigObjectId);