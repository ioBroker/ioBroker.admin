import React from 'react';
import PropTypes from 'prop-types';

import {
    IconButton,
    TextField,
} from '@mui/material';

import { IconCopy, Utils } from '@iobroker/adapter-react-v5';
import ConfigGeneric from './ConfigGeneric';

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
                        onClick={() => {
                            Utils.copyToClipboard(this.getPattern(this.props.schema.pattern));
                            window.alert('Copied');
                        }}
                    >
                        <IconCopy />
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

export default ConfigPattern;
