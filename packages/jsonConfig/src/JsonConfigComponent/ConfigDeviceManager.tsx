import React from 'react';

// START-WITH-DM
import DeviceManager from '@iobroker/dm-gui-components';
// END-WITH-DM

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

        // START-WITHOUT-DM
        // return <div>
        //     Use
        //     <b> @iobroker/json-config-with-dm </b>
        //     instead of
        //     <b> @iobroker/json-config</b>
        // </div>;
        // END-WITHOUT-DM

        // START-WITH-DM
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
        // END-WITH-DM
    }
}

export default ConfigDeviceManager;
