import React, { type JSX } from 'react';

import type { ConfigItemDeviceManager } from '../types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigDeviceManagerProps extends ConfigGenericProps {
    schema: ConfigItemDeviceManager;
}

class ConfigDeviceManager extends ConfigGeneric<ConfigDeviceManagerProps, ConfigGenericState> {
    renderItem(): JSX.Element | null {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        if (this.props.oContext.DeviceManager) {
            const DeviceManager = this.props.oContext.DeviceManager;
            return (
                <DeviceManager
                    uploadImagesToInstance={`${this.props.oContext.adapterName}.${this.props.oContext.instance}`}
                    title={this.getText(this.props.schema.label)}
                    socket={this.props.oContext.socket}
                    selectedInstance={`${this.props.oContext.adapterName}.${this.props.oContext.instance}`}
                    themeName={this.props.themeName}
                    theme={this.props.oContext.theme}
                    themeType={this.props.oContext.themeType}
                    isFloatComma={this.props.oContext.isFloatComma}
                    dateFormat={this.props.oContext.dateFormat}
                />
            );
        }

        return <div>DeviceManager not found</div>;
    }
}

export default ConfigDeviceManager;
