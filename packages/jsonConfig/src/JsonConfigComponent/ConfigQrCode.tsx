import React from 'react';

import { FormControl } from '@mui/material';
import QRCode from 'react-qr-code';

import type { ConfigItemQrCode } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigQrCodeProps extends ConfigGenericProps {
    schema: ConfigItemQrCode;
}

class ConfigQrCode extends ConfigGeneric<ConfigQrCodeProps, ConfigGenericState> {
    renderItem() {
        return <FormControl variant="standard">
            <QRCode value={this.props.schema.data} size={this.props.schema.size} fgColor={this.props.schema.fgColor} bgColor={this.props.schema.bgColor} level={this.props.schema.level} />
        </FormControl>;
    }
}

export default ConfigQrCode;
