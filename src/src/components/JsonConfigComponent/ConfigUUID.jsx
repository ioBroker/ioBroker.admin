import React from 'react';
import PropTypes from 'prop-types';

import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';

import IconCopy from '@mui/icons-material/ContentCopy';

import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';

import ConfigGeneric from './ConfigGeneric';

class ConfigUUID extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();

        const uuidObj = await this.props.socket.getObject('system.meta.uuid');
        this.setState({ uuid: uuidObj?.native?.uuid || 'unknown' });
    }

    renderItem(error, disabled) {
        return <TextField
            variant="standard"
            fullWidth
            error={!!error}
            disabled={!!disabled}
            inputProps={{
                readOnly: true,
            }}
            // eslint-disable-next-line react/jsx-no-duplicate-props
            InputProps={{
                endAdornment: <IconButton onClick={() => {
                    Utils.copyToClipboard(this.state.uuid);
                    window.alert(I18n.t('ra_Copied %s', this.state.uuid));
                }}
                >
                    <IconCopy />
                </IconButton>,
            }}
            value={this.state.uuid || ''}
            label={this.getText(this.props.schema.label) || I18n.t('ra_Serial number (UUID)')}
            helperText={this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)}
        />;
    }
}

ConfigUUID.propTypes = {
    socket: PropTypes.object.isRequired,
    schema: PropTypes.object,
};

export default ConfigUUID;
