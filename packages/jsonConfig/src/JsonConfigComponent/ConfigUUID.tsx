import React, { type JSX } from 'react';

import { TextField, IconButton } from '@mui/material';

import { ContentCopy as IconCopy } from '@mui/icons-material';

import { Utils, I18n } from '@iobroker/adapter-react-v5';

import type { ConfigItemUUID } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigUUIDProps extends ConfigGenericProps {
    schema: ConfigItemUUID;
}

interface ConfigUUIDState extends ConfigGenericState {
    uuid?: string;
}

class ConfigUUID extends ConfigGeneric<ConfigUUIDProps, ConfigUUIDState> {
    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const uuidObj = await this.props.oContext.socket.getObject('system.meta.uuid');
        this.setState({ uuid: uuidObj?.native?.uuid || 'unknown' });
    }

    renderItem(error: unknown, disabled: boolean): JSX.Element {
        return (
            <TextField
                variant="standard"
                fullWidth
                error={!!error}
                disabled={!!disabled}
                slotProps={{
                    htmlInput: { readOnly: true },
                    input: {
                        endAdornment: (
                            <IconButton
                                onClick={() => {
                                    Utils.copyToClipboard(this.state.uuid);
                                    window.alert(I18n.t('ra_Copied %s', this.state.uuid));
                                }}
                            >
                                <IconCopy />
                            </IconButton>
                        ),
                    },
                }}
                value={this.state.uuid || ''}
                label={this.getText(this.props.schema.label) || I18n.t('ra_Serial number (UUID)')}
                helperText={this.renderHelp(
                    this.props.schema.help,
                    this.props.schema.helpLink,
                    this.props.schema.noTranslation,
                )}
            />
        );
    }
}

export default ConfigUUID;
