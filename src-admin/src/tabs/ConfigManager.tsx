import React, { type JSX } from 'react';

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
    /** The pin of an instance that is in the menu. A color of its own is seen at a glance */
    pinnedIcon: {
        color: '#ffca28',
    },
};

/**
 * Marks the pin as active.
 *
 * The toolbar is grey and everything in it is white, so the toggles of the device list mark their active
 * state with a translucent pill instead of a color. The pin uses the same pill, so that it does not look
 * like a different kind of button
 */
const PIN_ACTIVE_SX = {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.35)' },
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
    /** The instance the device list is showing, like `devices.0`. Empty on the instance overview */
    instance: string;
    /** Is this instance pinned to the navigation? */
    pinned: boolean;
    /** Changing it builds the device list anew - it reads the instance only when it is created */
    listKey: string;
}

/**
 * The "config manager" tab.
 *
 * It extends `Router` to learn about a navigation that happened elsewhere: a pinned instance in the
 * menu changes the hash while this tab is already open, and only a new device list can show it.
 */
export default class ConfigManagerTab extends Router<ConfigManagerTabProps, ConfigManagerTabState> {
    constructor(props: ConfigManagerTabProps) {
        super(props);
        const instance = Router.getLocation().id || window.localStorage.getItem('dmSelectedInstance') || '';
        this.state = {
            instance,
            pinned: instance ? isConfigManagerInstancePinned(instance) : false,
            listKey: instance,
        };
    }

    componentDidMount(): void {
        super.componentDidMount();

        if (!this.state.instance) {
            void this.detectSingleInstance();
        }
    }

    /**
     * With only one instance that has a device manager, the device list opens it by itself and does not
     * report it through `onInstanceChanged`. The tab would therefore not know which instance is shown and
     * could not offer to pin it - and one instance is the usual case.
     */
    async detectSingleInstance(): Promise<void> {
        try {
            const objects = await this.props.socket.getObjectViewSystem(
                'instance',
                'system.adapter.',
                'system.adapter.香',
            );

            const candidates = Object.keys(objects || {})
                .filter(id => objects[id]?.common?.supportedMessages?.deviceManager)
                .map(id => id.substring('system.adapter.'.length));

            // the device list offers running instances only, so the same instances must be counted here
            const running: string[] = [];
            for (const instance of candidates) {
                const alive = await this.props.socket.getState(`system.adapter.${instance}.alive`);
                if (alive?.val) {
                    running.push(instance);
                }
            }

            // the list does not select anything if the user still has the choice between several instances
            if (running.length === 1 && !this.state.instance) {
                this.setState({ instance: running[0], pinned: isConfigManagerInstancePinned(running[0]) });
            }
        } catch (e) {
            console.error(`Cannot read the instances with a device manager: ${e as Error}`);
        }
    }

    /** A pinned instance was selected in the menu while this tab was already open */
    onHashChanged(): void {
        const instance = Router.getLocation().id;
        if (instance && instance !== this.state.instance) {
            this.setState({ instance, pinned: isConfigManagerInstancePinned(instance), listKey: instance });
        }
    }

    /**
     * Pins the shown instance to the navigation, or removes it from there.
     *
     * It sits in the toolbar of the device list and not above it: the toolbar occupies the whole width,
     * and a button placed over it would cover the entries that are already there.
     */
    renderPinButton(): JSX.Element | null {
        if (!this.state.instance) {
            return null;
        }

        return (
            <Tooltip
                title={I18n.t(this.state.pinned ? 'Remove from navigation' : 'Pin to navigation')}
                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
            >
                <IconButton
                    color="inherit"
                    size="small"
                    sx={{ mr: 1, ...(this.state.pinned ? PIN_ACTIVE_SX : undefined) }}
                    onClick={() => {
                        const pinned = !this.state.pinned;
                        setConfigManagerInstancePinned(this.state.instance, pinned);
                        this.setState({ pinned });
                    }}
                >
                    {this.state.pinned ? <PushPin style={styles.pinnedIcon} /> : <PushPinOutlined />}
                </IconButton>
            </Tooltip>
        );
    }

    render(): JSX.Element {
        return (
            <div style={styles.root}>
                <DeviceList
                    key={this.state.listKey}
                    socket={this.props.socket}
                    themeType={this.props.themeType}
                    themeName={this.props.themeName}
                    theme={this.props.theme}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                    // `title` is rendered as a plain child at the start of the toolbar, but dm-gui-components
                    // types it as `string`. The cast goes away as soon as the type is widened to `ReactNode`
                    title={this.renderPinButton() as unknown as string}
                    instance={this.state.instance}
                    onInstanceChanged={instance => {
                        // the list has switched the instance itself, only the pin button has to follow -
                        // `listKey` stays as it is, so that the devices are not loaded a second time
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
