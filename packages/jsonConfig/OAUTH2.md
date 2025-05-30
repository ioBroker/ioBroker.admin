# How to add OAuth2 configuration for specific service
This document describes how to add OAuth2 authentication for a specific service in the JSONConfig adapter.

## Collect OAuth2 configuration
The following parameters are required to configure OAuth2 authentication:
- Service name: A unique name for the service, e.g. `spotify`, `googledrive`, etc.
- Link to description how to create a client for the OAuth2 service. E.g. https://developer.spotify.com/documentation/web-api/concepts/apps
- Token URL: The URL to request the access token. Like `https://accounts.spotify.com/api/token`

With this information, the ioBroker Core Team can create a configuration for the OAuth2 service in the cloud.

## Add OAuth JSONConfig configuration
After the core team has created the OAuth2 configuration in the cloud, you can add a component to your JSONConfig file.
Here is an example of how to add a component for the Spotify service:

```json5
  "_oauth2": {
        "type": "oauth2",
        "identifier": "spotify", // required, unique identifier for the service
        "label": "Get Spotify OAuth2 Token", // optional, default is "Get Spotify Token"
        "label": "Refresh Spotify OAuth2 Token", // optional, default is "Refresh Spotify Token"
        "icon": "data:image/svg+xml;base64,...", // optional, default is cloud icon
  }
```

## Backend code
Add TokenRefresher.ts to your backend code. This file is responsible for handling the OAuth2 token refresh logic.
```Typescript
import axios from 'axios';

export interface AccessTokens {
    access_token: string;
    expires_in: number;
    access_token_expires_on: string;
    ext_expires_in: number;
    token_type: 'Bearer';
    scope: string;
    refresh_token: string;
}

export class TokenRefresher {
    private readonly adapter: ioBroker.Adapter;
    private readonly stateName: string;
    private refreshTokenTimeout: ioBroker.Timeout | undefined;
    private accessToken: AccessTokens | undefined;
    private readonly url: string;
    private readonly readyPromise: Promise<void>;
    private readonly name: string;

    constructor(adapter: ioBroker.Adapter, serviceName: string, stateName?: string) {
        this.adapter = adapter;
        this.stateName = stateName || 'oauth2Tokens';
        this.url = `https://oauth2.iobroker.in/${serviceName}`;
        this.name = this.stateName.replace('info.', '').replace('Tokens', '').replace('tokens', '');
        if (this.name === 'oauth2') {
            this.name = adapter.name;
        }

        this.readyPromise = this.adapter.getForeignStateAsync(`${adapter.namespace}.${this.stateName}`).then(state => {
            if (state) {
                this.accessToken = JSON.parse(state.val as string);
                if (
                    this.accessToken?.access_token_expires_on &&
                    new Date(this.accessToken.access_token_expires_on).getTime() < Date.now()
                ) {
                    this.adapter.log.error('Access token is expired. Please make a authorization again');
                } else {
                    this.adapter.log.debug(`Access token for ${this.name} found`);
                }
            } else {
                this.adapter.log.error(`No tokens for ${this.name} found`);
            }
            this.adapter
                .subscribeStatesAsync(this.stateName)
                .catch(error => this.adapter.log.error(`Cannot read tokens: ${error}`));

            return this.refreshTokens().catch(error => this.adapter.log.error(`Cannot refresh tokens: ${error}`));
        });
    }

    destroy(): void {
        if (this.refreshTokenTimeout) {
            this.adapter.clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = undefined;
        }
    }

    onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (state?.ack && id.endsWith(`.${this.stateName}`)) {
            if (JSON.stringify(this.accessToken) !== state.val) {
                try {
                    this.accessToken = JSON.parse(state.val as string);
                    this.refreshTokens().catch(error => this.adapter.log.error(`Cannot refresh tokens: ${error}`));
                } catch (error) {
                    this.adapter.log.error(`Cannot parse tokens: ${error}`);
                    this.accessToken = undefined;
                }
            }
        }
    }

    async getAccessToken(): Promise<string | undefined> {
        await this.readyPromise;
        if (!this.accessToken?.access_token) {
            this.adapter.log.error(`No tokens for ${this.name} found`);
            return undefined;
        }
        if (
            !this.accessToken.access_token_expires_on ||
            new Date(this.accessToken.access_token_expires_on).getTime() < Date.now()
        ) {
            this.adapter.log.error('Access token is expired. Please make a authorization again');
            return undefined;
        }
        return this.accessToken.access_token;
    }

    private async refreshTokens(): Promise<void> {
        if (this.refreshTokenTimeout) {
            this.adapter.clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = undefined;
        }

        if (!this.accessToken?.refresh_token) {
            this.adapter.log.error(`No tokens for ${this.name} found`);
            return;
        }

        if (
            !this.accessToken.access_token_expires_on ||
            new Date(this.accessToken.access_token_expires_on).getTime() < Date.now()
        ) {
            this.adapter.log.error('Access token is expired. Please make an authorization again');
        }

        let expiresIn = new Date(this.accessToken.access_token_expires_on).getTime() - Date.now() - 180_000;

        if (expiresIn <= 0) {
            // Refresh token
            try {
                const response = await axios.post(this.url, this.accessToken);
                if (response.status !== 200) {
                    this.adapter.log.error(`Cannot refresh tokens: ${response.statusText}`);
                    return;
                }
                this.accessToken = response.data;
            } catch (error) {
                this.adapter.log.error(`Cannot refresh tokens: ${error}`);
            }

            if (this.accessToken) {
                this.accessToken.access_token_expires_on = new Date(
                    Date.now() + this.accessToken.expires_in * 1_000,
                ).toISOString();
                expiresIn = new Date(this.accessToken.access_token_expires_on).getTime() - Date.now() - 180_000;
                await this.adapter.setState(this.stateName, JSON.stringify(this.accessToken), true);
                this.adapter.log.debug(`Tokens for ${this.name} updated`);
            } else {
                this.adapter.log.error(`No tokens for ${this.name} could be refreshed`);
            }
        }

        // no longer than 10 minutes, as longer timer could be not reliable
        if (expiresIn > 600_000) {
            expiresIn = 600_000;
        }

        this.refreshTokenTimeout = this.adapter.setTimeout(() => {
            this.refreshTokenTimeout = undefined;
            this.refreshTokens().catch(error => this.adapter.log.error(`Cannot refresh tokens: ${error}`));
        }, expiresIn);
    }
}
```

As you can see, the `TokenRefresher` class handles the OAuth2 token refresh logic. It retrieves the access token from the state, checks if it is expired, and refreshes it if necessary. The access token is stored in the state with the name specified in the constructor.

You need `axios` package to make HTTP requests.

In your adapter, you can create an instance of the `TokenRefresher` class and use it to get the access token:

```Typescript
import { TokenRefresher } from './lib/TokenRefresher';

export class SpotifyPremiumAdapter extends Adapter {
    private tokenWorker?: TokenRefresher;

    // It is important to call this method in the `onReady` method of your adapter and not in the constructor.
    async onReady(): Promise<void> {
        this.tokenWorker = new TokenRefresher(this, 'spotify');
        this.tokenWorker.getAccessToken()
            .then(accessToken => {
                this.log.info('Spotify OAuth2 Token Refresher is ready: ${accessToken');
            })
            .catch(error => {
                this.log.error(`Error initializing Spotify OAuth2 Token Refresher: ${error}`);
            });
        // Your other initialization code...
    }
    
    onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        this.tokenWorker?.onStateChange(id, state);
        // Your other state change code...
    }
    
    onUnload(callback: () => void): void {
        this.tokenWorker?.destroy();
        // Your other unload code...
        callback();
    }
}
```