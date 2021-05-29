import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';

import IconButton from '@material-ui/core/IconButton';

import ConfigGeneric from './ConfigGeneric';

import copy from '@iobroker/adapter-react/Components/copy-to-clipboard';
import CopyIcon from '@iobroker/adapter-react/icons/IconCopy';

const styles = theme => ({
});

class ConfigPattern extends ConfigGeneric {
    renderItem(error, disabled) {
        return <TextField
            fullWidth
            disabled={!!disabled}
            InputProps={{
                endAdornment: this.props.schema.copyToClipboard ?
                    <IconButton
                        size="small"
                        onClick={e => {
                            copy(this.getPattern(this.props.schema.pattern));
                            window.alert('Copied');
                        }}>
                        <CopyIcon/>
                    </IconButton>
                    : undefined,
            }}
            value={this.getPattern(this.props.schema.pattern)}
            label={this.getText(this.props.schema.label)}
            helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
        />;
    }
}

ConfigPattern.propTypes = {
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

export default withStyles(styles)(ConfigPattern);