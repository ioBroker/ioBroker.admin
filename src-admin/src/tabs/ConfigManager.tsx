import React, { Component, type JSX } from 'react';

import { IconButton, Tooltip } from '@mui/material';
import { PushPin, PushPinOutlined } from '@mui/icons-material';
import {
    I18n,
    type AdminConnection,
    type IobTheme,
    type ThemeName,
    type ThemeType,
    Router,
} from '@iobroker/gui-components';
import DeviceList from '@iobroker/dm-gui-components';
import { isConfigManagerInstancePinned, setConfigManagerInstancePinned } from '@/helpers/configManagerPins';

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
    pinButton: {
        position: 'absolute',
        zIndex: 2,
        top: 8,
        right: 8,
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

interface ConfigManagerTabState {
    instance: string;
    pinned: boolean;
}

export default class ConfigManagerTab extends Component<ConfigManagerTabProps, ConfigManagerTabState> {
    constructor(props: ConfigManagerTabProps) {
        super(props);
        const instance = Router.getLocation().id || window.localStorage.getItem('dmSelectedInstance') || '';
        this.state = {
            instance,
            pinned: instance ? isConfigManagerInstancePinned(instance) : false,
        };
    }

    render(): JSX.Element {
        return (
            <div style={styles.root}>
                {this.state.instance ? (
                    <Tooltip title={I18n.t(this.state.pinned ? 'Remove from navigation' : 'Pin to navigation')}>
                        <IconButton
                            style={styles.pinButton}
                            color={this.state.pinned ? 'primary' : 'default'}
                            onClick={() => {
                                const pinned = !this.state.pinned;
                                setConfigManagerInstancePinned(this.state.instance, pinned);
                                this.setState({ pinned });
                            }}
                        >
                            {this.state.pinned ? <PushPin /> : <PushPinOutlined />}
                        </IconButton>
                    </Tooltip>
                ) : null}
                <DeviceList
                    socket={this.props.socket}
                    themeType={this.props.themeType}
                    themeName={this.props.themeName}
                    theme={this.props.theme}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                    instance={this.state.instance}
                    onInstanceChanged={instance => {
                        this.setState({
                            instance,
                            pinned: instance ? isConfigManagerInstancePinned(instance) : false,
                        });
                        Router.doNavigate(`tab-devicemanager`, 'tab', instance);
                    }}
                />
            </div>
        );
    }
}
