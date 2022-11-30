import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import TextField from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';

import ConfigGeneric from './ConfigGeneric';

import Utils from './wrapper/Components/Utils';
import CopyIcon from './wrapper/icons/IconCopy';

const styles = theme => ({
});

class ConfigPattern extends ConfigGeneric {
    renderItem(error, disabled) {
        return <TextField
            variant="standard"
            fullWidth
            disabled={!!disabled}
            InputProps={{
                endAdornment: this.props.schema.copyToClipboard ?
                    <IconButton
                        size="small"
                        onClick={e => {
                            Utils.copy(this.getPattern(this.props.schema.pattern));
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