import React, { useState } from 'react';
import { AdminConnection, JsonConfigComponent } from '@iobroker/adapter-react-v5';
import type { ThemeName, ThemeType } from '@iobroker/adapter-react-v5/types';

interface JsonConfigProps {
    instanceId: string;
    socket: AdminConnection;
    schema: Record<string, any>;
    data: Record<string, any>;
    onChange: (data: Record<string, any>) => void;
    themeName: ThemeName;
    themeType: ThemeType;
    isFloatComma?: boolean;
    dateFormat?: string;
}

export default function JsonConfig(props: JsonConfigProps): React.JSX.Element | null {
    const {
        instanceId, socket, schema, data, onChange,
    } = props;
    console.log('JsonConfig', props);
    const [error, setError] = useState(false);

    if (schema === undefined) {
        return null;
    }

    const [adapterName, instance] = instanceId.split('.', 2);

    return <>
        {error && <div>{error}</div>}
        <JsonConfigComponent
            socket={socket}
            adapterName={adapterName}
            instance={parseInt(instance)}
            schema={schema}
            data={data}
            onError={setError}
            onChange={(_data: Record<string, any>) => onChange(_data)}
            embedded
            themeName={props.themeName}
            themeType={props.themeType}
            isFloatComma={props.isFloatComma === undefined ? props.socket.systemConfig.common.isFloatComma : props.isFloatComma}
            dateFormat={props.dateFormat === undefined ? props.socket.systemConfig.common.dateFormat : props.dateFormat}
        />
    </>;

    /*
    JSON adapter config:
            className={classes.scroll}
            socket={socket}
            theme={this.props.theme}
            themeName={this.props.themeName}
            themeType={this.props.themeType}
            adapterName={this.props.adapterName}
            instance={this.props.instance}
            isFloatComma={this.props.isFloatComma}
            dateFormat={this.props.dateFormat}
            schema={this.state.schema}
            common={this.state.common}
            data={this.state.data}
            updateData={this.state.updateData}
            onError={(error) => this.setState({ error })}
            onChange={(data, changed) => this.setState({ data, changed })}
            customs={{ configCustomEasyAccess: ConfigCustomEasyAccess }}
    Object custom:
            instanceObj={instanceObj}
            customObj={customObj}
            custom={true}
            className={ '' }
            adapterName={adapter}
            instance={parseInt(instance.split('.').pop(), 10) || 0}
            socket={this.props.socket}
            theme={this.props.theme}
            themeName={this.props.themeName}
            themeType={this.props.themeType}
            multiEdit={this.props.objectIDs.length > 1}

            schema={this.jsonConfigs[adapter].json}
            data={data}
            onError={error =>
                this.setState({error}, () => this.props.onError && this.props.onError(error))}
            onValueChange={(attr, value) => {
                console.log(attr + ' => ' + value);
                const newValues = JSON.parse(JSON.stringify(this.state.newValues));
                newValues[instance] = newValues[instance] || {};
                if (this.commonConfig[instance][attr] === value) {
                    delete newValues[instance][attr];
                    if (!Object.keys(newValues[instance]).length) {
                        delete newValues[instance];
                    }
                } else {
                    newValues[instance][attr] = value;
                }
                this.setState({newValues, hasChanges: this.isChanged(newValues)}, () =>
                    this.props.onChange && this.props.onChange(this.state.hasChanges));
            }}
    */
}
