import React, { Component, type JSX } from 'react';

import {
    type AdminConnection,
    type IobTheme,
    type ThemeName,
    type ThemeType,
    Router,
} from '@iobroker/adapter-react-v5';
import DeviceList from '@iobroker/dm-gui-components';

const styles: Record<string, React.CSSProperties> = {
    root: {
        // border:     '0 solid #FFF',
        display: 'block',
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        // background: 'white',
        color: 'black',
        borderRadius: 4,
        boxShadow:
            '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        border: '0px solid #888',
    },
};

interface ConfigManagerTabProps {
    themeName: ThemeName;
    themeType: ThemeType;
    socket: AdminConnection;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
}

export default class ConfigManagerTab extends Component<ConfigManagerTabProps> {
    private instance: string;

    constructor(props: ConfigManagerTabProps) {
        super(props);
        this.instance = Router.getLocation().id || window.localStorage.getItem('dmSelectedInstance') || '';
    }

    render(): JSX.Element {
        return (
            <div style={styles.root}>
                <DeviceList
                    socket={this.props.socket}
                    themeType={this.props.themeType}
                    themeName={this.props.themeName}
                    theme={this.props.theme}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                    instance={this.instance}
                    onInstanceChanged={instance => {
                        this.instance = instance;
                        Router.doNavigate(`tab-devicemanager`, 'tab', instance);
                    }}
                />
            </div>
        );
    }
}
