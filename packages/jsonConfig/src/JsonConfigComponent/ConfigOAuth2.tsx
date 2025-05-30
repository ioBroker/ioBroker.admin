import React from 'react';

import { Button, TextField } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';
import type { ConfigItemOAuth2 } from '../types';

declare global {
    interface Window {
        attachEvent: Window['addEventListener'];
        detachEvent: Window['removeEventListener'];
    }
}

interface ConfigOAuth2Props extends ConfigGenericProps {
    schema: ConfigItemOAuth2;
}

export interface AccessTokens {
    access_token: string;
    expires_in: number;
    access_token_expires_on: string;
    ext_expires_in: number;
    token_type: 'Bearer';
    scope: string;
    refresh_token: string;
}

interface ConfigOAuth2State extends ConfigGenericState {
    accessTokens: string;
    success: boolean;
    blocked: boolean;
    running: boolean;
    pressed: boolean;
}

export default class ConfigOAuth2 extends ConfigGeneric<ConfigOAuth2Props, ConfigOAuth2State> {
    private authWindow?: WindowProxy | null;
    private readonly oid: string;
    private readonly url: string;

    constructor(props: ConfigOAuth2Props) {
        super(props);

        this.state = {
            ...this.state,
            accessTokens: '',
            success: false,
            blocked: false,
            running: false,
            pressed: false,
        };

        this.url = `https://oauth2.iobroker.in/${props.schema.identifier}?redirect=true`;
        if (props.schema.scope) {
            this.url += `&scope=${encodeURIComponent(props.schema.scope)}`;
        }

        this.oid = `${this.props.oContext.adapterName}.${this.props.oContext.instance}.${this.props.schema.saveTokenIn || 'oauth2Tokens'}`;
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();
        if (window.addEventListener) {
            window.addEventListener('message', this.onMessage as any, false);
        } else {
            window.attachEvent('onmessage', this.onMessage as any, false);
        }

        await this.props.oContext.socket.subscribeState(this.oid, this.onTokensUpdated);

        // read tokens
        const tokens = await this.props.oContext.socket.getState(this.oid);
        if (tokens) {
            const accessTokens: AccessTokens = JSON.parse(tokens.val as string);
            if (new Date(accessTokens.access_token_expires_on).getTime() > Date.now()) {
                this.setState({ accessTokens: tokens.val as string });
            }
        }
    }

    onTokensUpdated = (_id: string, state: ioBroker.State | null | undefined): void => {
        if (state?.val) {
            const accessTokens: AccessTokens = JSON.parse(state.val as string);
            if (new Date(accessTokens.access_token_expires_on).getTime() > Date.now()) {
                if (this.state.accessTokens !== state.val) {
                    this.setState({ accessTokens: state.val as string });
                }
                return;
            }
        }
        this.setState({ accessTokens: '' });
    };

    componentWillUnmount(): void {
        super.componentWillUnmount();
        if (window.removeEventListener) {
            window.removeEventListener('message', this.onMessage as any, false);
        } else {
            window.detachEvent('onmessage', this.onMessage as any, false);
        }
        this.props.oContext.socket.unsubscribeState(this.oid, this.onTokensUpdated);
    }

    saveToken(accessTokens: string): void {
        try {
            if (accessTokens && !accessTokens.startsWith('{')) {
                // convert base64 to string
                accessTokens = atob(accessTokens);
            }

            const accessTokensParsed: AccessTokens = JSON.parse(accessTokens);
            if (accessTokensParsed.access_token && accessTokensParsed.refresh_token && accessTokensParsed.expires_in) {
                // Give 10 seconds to user to copy the token
                accessTokensParsed.access_token_expires_on ||= new Date(
                    Date.now() + accessTokensParsed.expires_in * 1000,
                ).toISOString();

                this.props.oContext.socket
                    .setState(this.oid, JSON.stringify(accessTokensParsed), true)
                    .catch((e: Error) => console.log(`Error occurred: ${e.toString()}`));
            }
        } catch (e) {
            // ignore
            console.warn(e);
        }
    }

    onMessage = (event: MessageEvent): void => {
        if (event.origin !== 'https://oauth2.iobroker.in') {
            return;
        }
        if (
            (typeof event.data === 'string' &&
                event.data.startsWith(`${this.props.schema.identifier}-authentication:`)) ||
            (typeof (event as any).message === 'string' &&
                (event as any).message.startsWith(`${this.props.schema.identifier}-authentication:`))
        ) {
            const parts = (event.data || (event as any).message).split(':');
            if (parts[1] === 'success') {
                this.setState({ accessTokens: parts[2], success: true, pressed: false }, () =>
                    this.saveToken(this.state.accessTokens),
                );

                // send message to auth window to close it
                this.authWindow?.postMessage('close', event.origin);
                this.authWindow = null;
            } else {
                this.props.onError?.(parts[2]);
            }
        }
    };

    onOpenUrl(): void {
        this.authWindow = window.open(this.url, this.props.schema.identifier);
        if (!this.authWindow || this.authWindow.closed || typeof this.authWindow.closed === 'undefined') {
            this.setState({ blocked: true });
        } else {
            this.setState({ pressed: true });
        }
    }

    renderItem(): React.JSX.Element {
        let validTill = '';
        if (this.state.accessTokens) {
            try {
                const accessTokensParsed: AccessTokens = JSON.parse(this.state.accessTokens);
                validTill = new Date(accessTokensParsed.access_token_expires_on).toLocaleString();
            } catch {
                // ignore
            }
        }

        let label: string;
        if (this.state.accessTokens) {
            label = this.props.schema.refreshLabel
                ? this.getText(this.props.schema.refreshLabel)
                : I18n.t(
                      'ra_Renew %s access',
                      this.props.schema.identifier[0].toUpperCase() + this.props.schema.identifier.slice(1),
                  );
        } else {
            label = this.props.schema.label
                ? this.getText(this.props.schema.label)
                : I18n.t(
                      'ra_Get %s access',
                      this.props.schema.identifier[0].toUpperCase() + this.props.schema.identifier.slice(1),
                  );
        }
        const icon = this.getIcon();

        return (
            <div style={{ width: '100%', margin: '0 0 1rem 0' }}>
                <Button
                    disabled={this.state.running}
                    endIcon={icon || <CloudUpload />}
                    variant="contained"
                    onClick={() => this.onOpenUrl()}
                >
                    {label}
                </Button>
                {this.state.blocked ? (
                    <div style={{ color: 'red', fontSize: 16, marginTop: 20 }}>
                        {I18n.t('ra_Please allow popups in your browser for this page!')}
                    </div>
                ) : null}
                {this.state.accessTokens ? (
                    <div style={{ color: 'green', fontSize: 16, marginTop: 20 }}>
                        {this.props.alive
                            ? I18n.t(
                                  'ra_Successfully authorized. Token valid till %s and will be automatically renewed.',
                                  validTill,
                              )
                            : I18n.t(
                                  'ra_Successfully authorized. Token valid till %s but it can expire as the instance is not running.',
                                  validTill,
                              )}
                    </div>
                ) : null}
                {this.state.pressed ? (
                    <>
                        <div style={{ width: '100%', margin: '1rem 0 1rem 0' }}>
                            <span style={{ marginRight: 4 }}>
                                {`${I18n.t('ra_If the button above does not work, you can authorize manually this app by visiting this url')}`}
                                :
                            </span>
                            <br />
                            <a
                                target={this.props.schema.identifier}
                                href={this.url}
                                rel="noreferrer"
                            >
                                {this.url}
                            </a>
                        </div>
                        <TextField
                            value={this.state.accessTokens}
                            label={I18n.t('ra_Enter the code from that page here')}
                            variant="standard"
                            onChange={e => {
                                let accessTokens = e.target.value;
                                if (accessTokens && !accessTokens.startsWith('{')) {
                                    // convert base64 to string
                                    accessTokens = atob(accessTokens);
                                }
                                try {
                                    const accessTokensParsed: AccessTokens = JSON.parse(accessTokens);
                                    if (accessTokensParsed.access_token) {
                                        accessTokensParsed.access_token_expires_on = new Date(
                                            Date.now() + (accessTokensParsed.expires_in - 10) * 1000,
                                        ).toISOString();
                                        this.setState({ accessTokens: JSON.stringify(accessTokensParsed) }, () =>
                                            this.saveToken(this.state.accessTokens),
                                        );
                                    }
                                } catch {
                                    // ignore
                                }
                            }}
                            fullWidth
                        />
                    </>
                ) : null}
            </div>
        );
    }
}
