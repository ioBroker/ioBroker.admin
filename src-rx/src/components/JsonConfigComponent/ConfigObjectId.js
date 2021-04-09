import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

import ConfigGeneric from './ConfigGeneric';
import { Button, TextField } from '@material-ui/core';
import Utils from '@iobroker/adapter-react/Components/Utils';

const styles = theme => ({
    fullWidth: {
        width: '100%'
    },
    flex: {
        display: 'flex'
    }
});

class ConfigObjectId extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr);
        this.setState({ value: value || '' });
    }

    renderItem(error, disabled, defaultValue) {
        // eslint-disable-next-line
        const { classes, schema, socket, attr } = this.props;
        const { value, showSelectId } = this.state;
        
        return <FormControl className={classes.fullWidth}>
            <InputLabel shrink>{this.getText(schema.label)}</InputLabel>
            <div className={classes.flex}>
                <TextField
                    fullWidth
                    value={value === null || value === undefined ? '' : value}
                    error={!!error}
                    disabled={disabled}
                    placeholder={this.getText(schema.placeholder)}
                    label={this.getText(schema.label)}
                    helperText={this.getText(schema.help)}
                />
                <Button
                    variant="outlined"
                    onClick={() => this.setState({ showSelectId: true })}
                >...</Button>
            </div>
            {showSelectId ? <DialogSelectID
                key="tableSelect"
                imagePrefix="../.."
                dialogName={'javascript'}
                themeType={Utils.getThemeName()}
                socket={socket}
                statesOnly={true}
                selected={value}
                onClose={() => this.setState({ showSelectId: false })}
                onOk={selected =>
                    this.setState({ showSelectId: false, value: selected }, () =>
                        this.onChange(attr, selected)
                    )}
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