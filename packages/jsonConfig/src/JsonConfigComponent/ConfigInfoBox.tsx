import React, { type JSX } from 'react';

import { Box } from '@mui/material';

import { InfoBox } from '@iobroker/adapter-react-v5';

import type { ConfigItemInfoBox } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigInfoBoxProps extends ConfigGenericProps {
    schema: ConfigItemInfoBox;
}

export default class ConfigInfoBox extends ConfigGeneric<ConfigInfoBoxProps, ConfigGenericState> {
    renderItem(): JSX.Element {
        return (
            <InfoBox
                type={this.props.schema.boxType || 'info'}
                closeable={this.props.schema.closeable !== undefined ? this.props.schema.closeable : true}
                storeId={this.props.schema.closed !== undefined ? undefined : `${!!this.props.oContext.adapterName} ${this.props.attr}`}
                closed={this.props.schema.closed}
                style={{ width: '100%', ...this.props.schema.style }}
            >
                {this.props.schema.title ? (
                    <Box
                        component="div"
                        sx={{ fontWeight: 'bold', fontSize: 'larger' }}
                    >
                        {this.getText(this.props.schema.title)}
                    </Box>
                ) : null}
                {this.getText(this.props.schema.text)}
            </InfoBox>
        );
    }
}
