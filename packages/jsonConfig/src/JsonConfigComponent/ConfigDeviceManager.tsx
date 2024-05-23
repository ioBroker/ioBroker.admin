import React from 'react';

import DeviceManager from '@iobroker/dm-gui-components';

import type { ConfigItemDeviceManager } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigDeviceManagerProps extends ConfigGenericProps {
    schema: ConfigItemDeviceManager;
}

class ConfigDeviceManager extends ConfigGeneric<ConfigDeviceManagerProps, ConfigGenericState> {
    renderItem(): React.JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        return <DeviceManager
            uploadImagesToInstance={`${this.props.adapterName}.${this.props.instance}`}
            title={this.getText(this.props.schema.label)}
            socket={this.props.socket}
            selectedInstance={`${this.props.adapterName}.${this.props.instance}`}
            themeName={this.props.themeName}
            themeType={this.props.themeType}
            isFloatComma={this.props.isFloatComma}
            dateFormat={this.props.dateFormat}
        />;
    }
}

export default ConfigDeviceManager;
