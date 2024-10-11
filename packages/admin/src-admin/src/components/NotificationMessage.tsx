import React, { Component, type JSX } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import {
    type AdminConnection,
    I18n,
    type IobTheme,
    type ThemeName,
    type ThemeType,
    Utils,
} from '@iobroker/adapter-react-v5';
import {
    type BackEndCommandGeneric,
    type BackEndCommandOpenLink,
    type ConfigItemPanel,
    JsonConfigComponent,
} from '@iobroker/json-config';

const styles: Record<string, any> = {
    message: {
        position: 'relative',
        // justifyContent: 'space-between',
        display: 'block',
        width: '100%',
        // alignItems: 'center',
        // '@media screen and (max-width: 550px)': {
        //     flexWrap: 'wrap',
        // },
    },
    offline: {
        position: 'relative',
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        opacity: 0.7,
        '@media screen and (max-width: 550px)': {
            flexWrap: 'wrap',
        },
    },
    timestamp: {
        color: 'text.secondary',
        position: 'absolute',
        top: 5,
        right: 25,
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
        },
    },
    simpleMessage: {
        fontFamily: 'monospace',
        fontSize: 14,
        ml: '20px',
        mb: '10px',
        width: '100%',
        display: 'block',
        whiteSpace: 'pre-wrap',
        '@media screen and (max-width: 550px)': {
            fontSize: '2.9vw',
            ml: 0,
        },
    },
};

export interface InstanceMessage {
    messages: {
        message: string;
        ts: number;
    }[];
}
/** Possible message severities */
export type Severity = 'notify' | 'info' | 'alert';

export interface Message {
    name: ioBroker.Translated;
    severity: Severity;
    description: ioBroker.Translated;
    /** Show button, that leads to this link */
    link?: {
        /**
         * - empty - URL = http://IP:8081/#tab-instances/config/system.adapter.ADAPTER.N
         * - `simpleText` - URL = http://IP:8081/#tab-instances/config/system.adapter.ADAPTER.N/<>simpleText>
         * - `#url` - URL = http://IP:8081/#url
         * - `http[s]://...` - URL = http[s]://...
         */
        url?: string;
        /** Button text. Default is "open" */
        text?: ioBroker.Translated;
        /** Target */
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        target?: '_blank' | '_self' | string;
        /** base64 icon */
        icon?: string;
        /** CSS style of the button */
        style?: Record<string, string>;
        /** Button style. Default is `contained` */
        variant?: 'outlined' | 'text' | 'contained';
    };
    instances: Record<string, InstanceMessage>;
}

/* TODO: Replace it later with ioBroker.NotificationAction */
/** Structure for notification actions */
interface NotificationAction {
    /** This message will be shown if instance is offline */
    offlineMessage?: ioBroker.StringOrTranslated;
    /** any other data required for instance to show the dynamic GUI in the notification */
    [other: string]: any;
}

interface NotificationMessageProps {
    // entry: Message;
    instanceId: string;
    message: { message: string; ts: number; contextData?: NotificationAction };
    // onClose: () => void;
    onLink: (linkCommand: BackEndCommandOpenLink) => void;
    dateFormat: string;
    socket: AdminConnection;
    themeType: ThemeType;
    themeName: ThemeName;
    theme: IobTheme;
    isFloatComma: boolean;
}

interface NotificationMessageState {
    alive: boolean;
    data: Record<string, any> | null;
    schema: ConfigItemPanel | null;
    error?: boolean;
    updateData: number;
}

class NotificationMessage extends Component<NotificationMessageProps, NotificationMessageState> {
    private lastAlive: number = 0;

    constructor(props: NotificationMessageProps) {
        super(props);

        this.state = {
            alive: false,
            data: {},
            schema: null,
            updateData: 0,
        };
    }

    async componentDidMount(): Promise<void> {
        if (this.props.message.contextData?.admin?.notification) {
            // request GUI for this notification
            const alive = await this.props.socket.getState(`${this.props.instanceId}.alive`);
            this.lastAlive = alive?.val ? Date.now() : 0;
            this.setState({ alive: !!alive?.val }, () => this.getGui());
            await this.props.socket.subscribeState(`${this.props.instanceId}.alive`, this.onAliveChanged);
        }
    }

    getGui(): void {
        if (this.state.alive && this.props.message.contextData?.admin?.notification) {
            const notification: NotificationAction = JSON.parse(
                JSON.stringify(this.props.message.contextData?.admin?.notification),
            );
            /** remove the offline message from contextData */
            if (notification.offlineMessage) {
                delete notification.offlineMessage;
            }
            // request GUI for this notification
            void this.props.socket
                .sendTo(
                    this.props.instanceId.replace('system.adapter.', ''),
                    'admin:getNotificationSchema',
                    notification,
                )
                .then((result: { data: Record<string, any> | null; schema: ConfigItemPanel | null }) => {
                    if (result) {
                        this.setState({
                            schema: result.schema,
                            data: result.data || this.state.data,
                            updateData: this.state.updateData + 1,
                        });
                    }
                });
        }
    }

    onAliveChanged = (id: string, state: ioBroker.State): void => {
        if (id === `${this.props.instanceId}.alive` && state && this.state.alive !== !!state.val) {
            if (state.val) {
                if (this.lastAlive && Date.now() - this.lastAlive < 500) {
                    // ignore too fast changes
                    return;
                }
                this.lastAlive = Date.now();
            }
            this.setState({ alive: !!state.val }, () => this.getGui());
        }
    };

    renderCustomGui(): JSX.Element | null {
        if (!this.state.schema || !this.state.data || !this.state.alive) {
            const notification: NotificationAction | undefined = this.props.message.contextData?.admin?.notification;
            if (notification) {
                if (!this.state.alive) {
                    const offlineMessage: ioBroker.StringOrTranslated | undefined = notification.offlineMessage;
                    if (offlineMessage) {
                        const text =
                            typeof offlineMessage === 'string'
                                ? offlineMessage
                                : offlineMessage[this.props.socket.systemLang] || offlineMessage.en;

                        return <Box sx={styles.offline}>{Utils.renderTextWithA(text)}</Box>;
                    }
                    return <Typography>{I18n.t('Instance is not alive')}</Typography>;
                }
                return <LinearProgress />;
            }

            return null;
        }

        const [, , adapterName, instance] = this.props.instanceId.split('.');

        return (
            <>
                {this.state.error && <div style={{ color: 'red' }}>{this.state.error}</div>}
                <JsonConfigComponent
                    style={{ width: '100%' }}
                    updateData={this.state.updateData}
                    socket={this.props.socket}
                    adapterName={adapterName}
                    instance={parseInt(instance, 10)}
                    schema={this.state.schema}
                    data={this.state.data}
                    onError={(error?: boolean) => this.setState({ error })}
                    onChange={(data: Record<string, any>) => this.setState({ data })}
                    onBackEndCommand={(command?: BackEndCommandGeneric) => {
                        if (command.schema) {
                            this.setState({ schema: command.schema, data: command.data || this.state.data });
                        }

                        if (command.command === 'refresh' || command.refresh) {
                            this.getGui();
                        }
                        if (command.command === 'link') {
                            this.props.onLink(command as BackEndCommandOpenLink);
                        }
                    }}
                    embedded
                    themeName={this.props.themeName}
                    themeType={this.props.themeType}
                    theme={this.props.theme}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                />
            </>
        );
    }

    renderSimpleMessage(): JSX.Element | null {
        return this.props.message.message ? (
            <Box sx={styles.simpleMessage}>{Utils.renderTextWithA(this.props.message.message)}</Box>
        ) : null;
    }

    render(): JSX.Element {
        return (
            <Typography
                component="div"
                sx={styles.message}
            >
                <Box sx={styles.timestamp}>{new Date(this.props.message.ts).toLocaleString()}</Box>
                {this.renderSimpleMessage()}
                {this.renderCustomGui()}
            </Typography>
        );
    }
}

export default NotificationMessage;
