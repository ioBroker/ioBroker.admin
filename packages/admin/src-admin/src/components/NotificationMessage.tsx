import React, { Component } from 'react';

import {
    Box, LinearProgress, Typography,
} from '@mui/material';

import {
    type AdminConnection,
    I18n, type IobTheme,
    type ThemeName, type ThemeType,
    Utils,
} from '@iobroker/adapter-react-v5';
import {
    type BackEndCommandGeneric,
    type BackEndCommandOpenLink,
    JsonConfigComponent,
} from '@iobroker/json-config';

const styles: Record<string, any> = {
    message: {
        position: 'relative',
        justifyContent: 'space-between',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
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
    terminal: {
        fontFamily: 'monospace',
        fontSize: 14,
        ml: '20px',
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

interface NotificationMessageProps {
    entry: Message;
    instanceId: string;
    message: { message: string; ts: number; actionData?: object | null };
    onClose: () => void;
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
    schema: Record<string, any> | null;
    error?: boolean;
    updateData: number;
}

class NotificationMessage extends Component<NotificationMessageProps, NotificationMessageState> {
    private lastAlive: number = 0;

    private lastSchema: string;

    constructor(props: NotificationMessageProps) {
        super(props);

        this.state = {
            alive: false,
            data: {},
            schema: null,
            updateData: 0,
        };
        this.lastSchema = JSON.stringify(this.state.schema);
    }

    async componentDidMount() {
        if (this.props.message.actionData) {
            // request GUI for this notification
            const alive = await this.props.socket.getState(`${this.props.instanceId}.alive`);
            this.lastAlive = alive?.val ? Date.now() : 0;
            this.setState({ alive: !!alive?.val }, () => this.getGui());
            this.props.socket.subscribeState(`${this.props.instanceId}.alive`, this.onAliveChanged);
        }
    }

    getGui() {
        if (this.state.alive) {
            // request GUI for this notification
            this.props.socket.sendTo(
                this.props.instanceId.replace('system.adapter.', ''),
                'getNotificationSchema',
                this.props.message,
            )
                .then((result: { data: Record<string, any> | null; schema: Record<string, any> | null }) => {
                    if (result) {
                        if (JSON.stringify(result.schema) !== this.lastSchema) {
                            this.setState({
                                schema: result.schema,
                                data: result.data || this.state.data,
                                updateData: this.state.updateData + 1,
                            });
                        } else {
                            this.setState({ data: result.data || this.state.data });
                        }
                    }
                });
        }
    }

    onAliveChanged = (id: string, state: ioBroker.State) => {
        if (id === `${this.props.instanceId}.alive` && state && this.state.alive !== (!!state.val)) {
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

    renderCustomGui() {
        if (!this.state.schema || !this.state.data || !this.state.alive) {
            if (this.props.message.actionData) {
                if (!this.state.alive) {
                    if (this.props.message.message) {
                        return this.renderSimpleMessage();
                    }
                    return <Typography>{I18n.t('Instance is not alive')}</Typography>;
                }
                return <LinearProgress />;
            }
            return this.renderSimpleMessage();
        }

        const [, , adapterName, instance] = this.props.instanceId.split('.');

        return <>
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
                onChange={(_data: Record<string, any>) => {
                    // ignore for now
                }}
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
        </>;
    }

    renderSimpleMessage() {
        return <Box
            sx={styles.terminal}
        >
            {Utils.renderTextWithA(this.props.message.message)}
        </Box>;
    }

    render() {
        return <Typography component="div" sx={styles.message}>
            <Box sx={styles.timestamp}>
                {new Date(this.props.message.ts).toLocaleString()}
            </Box>
            {this.renderCustomGui()}
        </Typography>;
    }
}

export default NotificationMessage;
