import React from 'react';

import DeviceManager from '@iobroker/dm-gui-components';
import ConfigGeneric, { ConfigGenericProps, ConfigGenericState } from './ConfigGeneric';

class ConfigDeviceManager extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    renderItem(): React.JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        return <DeviceManager
            uploadImagesToInstance={`${this.props.adapterName}.${this.props.instance}`}
            title={this.props.schema.label}
            socket={this.props.socket}
            selectedInstance={`${this.props.adapterName}.${this.props.instance}`}
        />;
    }
}

export default ConfigDeviceManager;
