/**
 * Copyright 2018-2024 Denis Haev (bluefox) <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import React, { type JSX } from 'react';
import { PROGRESS, Connection, type AdminConnection } from '@iobroker/socket-client';
import * as Sentry from '@sentry/browser';

import { Snackbar, IconButton } from '@mui/material';

import { Close as IconClose } from '@mui/icons-material';

import { printPrompt } from './Prompt';
import { Theme } from './Theme';
import { Loader } from './Components/Loader';
import { Router } from './Components/Router';
import { Utils } from './Components/Utils';
import { SaveCloseButtons } from './Components/SaveCloseButtons';
import { DialogConfirm } from './Dialogs/Confirm';
import { I18n } from './i18n';
import { DialogError } from './Dialogs/Error';
import type {
    GenericAppProps,
    GenericAppState,
    GenericAppSettings,
    ThemeName,
    ThemeType,
    IobTheme,
    Width,
} from './types';

import { dictionary } from './dictionary';

declare global {
    /** If config has been changed */
    // eslint-disable-next-line no-var
    var changed: boolean;

    interface Window {
        io: any;
        SocketClient: any;
        adapterName: undefined | string;
        socketUrl: undefined | string;
        oldAlert: any;
        changed: boolean;
        $iframeDialog: {
            close?: () => void;
        };
    }
}

// import './index.css';
const cssStyle = `
html {
    height: 100%;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

/* scrollbar */
::-webkit-scrollbar-track {
    background-color: #ccc;
    border-radius: 5px;
}

::-webkit-scrollbar {
    width: 5px;
    height: 5px;
    background-color: #ccc;
}

::-webkit-scrollbar-thumb {
    background-color: #575757;
    border-radius: 5px;
}

#root {
    height: 100%;
}

.App {
    height: 100%;
}

@keyframes glow {
    from {
        background-color: initial;
    }
    to {
        background-color: #58c458;
    }
}
`;

export class GenericApp<
    TProps extends GenericAppProps = GenericAppProps,
    TState extends GenericAppState = GenericAppState,
> extends Router<TProps, TState> {
    protected socket: AdminConnection;

    protected readonly instance: number;

    protected readonly adapterName: string;

    protected readonly instanceId: string;

    protected readonly newReact: boolean;

    protected encryptedFields: string[];

    protected readonly sentryDSN: string | undefined;

    private alertDialogRendered: boolean;

    private _secret: string | undefined;

    protected _systemConfig: ioBroker.SystemConfigCommon | undefined;

    // it is not readonly
    private savedNative: Record<string, any>;

    protected common: ioBroker.InstanceCommon | null = null;

    private sentryStarted: boolean = false;

    private sentryInited: boolean = false;

    private resizeTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: TProps, settings?: GenericAppSettings) {
        const ConnectionClass = (props.Connection ||
            settings?.Connection ||
            Connection) as unknown as typeof AdminConnection;
        // const ConnectionClass = props.Connection === 'admin' || settings.Connection = 'admin' ? AdminConnection : (props.Connection || settings.Connection || Connection);

        if (!window.document.getElementById('generic-app-iobroker-component')) {
            const style = window.document.createElement('style');
            style.setAttribute('id', 'generic-app-iobroker-component');
            style.innerHTML = cssStyle;
            window.document.head.appendChild(style);
        }

        // Remove `!Connection.isWeb() && window.adapterName !== 'material'` when iobroker.socket will support native ws
        if (!GenericApp.isWeb() && window.io && window.location.port === '3000') {
            try {
                const io = new window.SocketClient();
                delete window.io;
                window.io = io;
            } catch {
                // ignore
            }
        }

        super(props);

        printPrompt();

        const query = (window.location.search || '').replace(/^\?/, '').replace(/#.*$/, '');
        const args: Record<string, string | boolean> = {};
        query
            .trim()
            .split('&')
            .filter(t => t.trim())
            .forEach(b => {
                const parts = b.split('=');
                args[parts[0]] = parts.length === 2 ? parts[1] : true;
                if (args[parts[0]] === 'true') {
                    args[parts[0]] = true;
                } else if (args[parts[0]] === 'false') {
                    args[parts[0]] = false;
                }
            });

        // extract instance from URL
        this.instance =
            settings?.instance ??
            props.instance ??
            (args.instance !== undefined
                ? parseInt(args.instance as string, 10) || 0
                : parseInt(window.location.search.slice(1), 10) || 0);
        // extract adapter name from URL
        const tmp = window.location.pathname.split('/');
        this.adapterName =
            settings?.adapterName || props.adapterName || window.adapterName || tmp[tmp.length - 2] || 'iot';
        this.instanceId = `system.adapter.${this.adapterName}.${this.instance}`;
        this.newReact = args.newReact === true; // it is admin5

        const location = Router.getLocation();
        location.tab =
            location.tab ||
            ((window as any)._localStorage || window.localStorage).getItem(`${this.adapterName}-adapter`) ||
            '';

        const themeInstance = this.createTheme();

        this.state = Object.assign(
            this.state || {}, // keep the existing state
            {
                selectedTab:
                    ((window as any)._localStorage || window.localStorage).getItem(`${this.adapterName}-adapter`) || '',
                selectedTabNum: -1,
                native: {},
                errorText: '',
                changed: false,
                connected: false,
                loaded: false,
                isConfigurationError: '',
                expertMode: false,
                toast: '',
                theme: themeInstance,
                themeName: this.getThemeName(themeInstance),
                themeType: this.getThemeType(themeInstance),
                bottomButtons: (settings && settings.bottomButtons) === false ? false : props?.bottomButtons !== false,
                width: GenericApp.getWidth(),
                confirmClose: false,
                _alert: false,
                _alertType: 'info',
                _alertMessage: '',
            },
        ) as TState;

        // init translations
        const translations: Record<ioBroker.Languages, Record<string, string>> = dictionary;

        // merge together
        if (settings?.translations) {
            Object.keys(settings.translations).forEach(lang => {
                if (settings.translations) {
                    translations[lang as ioBroker.Languages] = Object.assign(
                        translations[lang as ioBroker.Languages],
                        settings.translations[lang as ioBroker.Languages] || {},
                    );
                }
            });
        } else if (props.translations) {
            Object.keys(props.translations).forEach(lang => {
                if (props.translations) {
                    translations[lang as ioBroker.Languages] = Object.assign(
                        translations[lang as ioBroker.Languages],
                        props.translations[lang as ioBroker.Languages] || {},
                    );
                }
            });
        }

        I18n.setTranslations(translations);

        this.savedNative = {}; // to detect if the config changed

        this.encryptedFields = props.encryptedFields || settings?.encryptedFields || [];

        this.sentryDSN = (settings && settings.sentryDSN) || props.sentryDSN;

        if (window.socketUrl) {
            if (window.socketUrl.startsWith(':')) {
                window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
            } else if (!window.socketUrl.startsWith('http://') && !window.socketUrl.startsWith('https://')) {
                window.socketUrl = `${window.location.protocol}//${window.socketUrl}`;
            }
        }

        this.alertDialogRendered = false;

        window.oldAlert = window.alert;
        window.alert = message => {
            if (!this.alertDialogRendered) {
                window.oldAlert(message);
                return;
            }
            if (message && message.toString().toLowerCase().includes('error')) {
                console.error(message);
                this.showAlert(message.toString(), 'error');
            } else {
                console.log(message);
                this.showAlert(message.toString(), 'info');
            }
        };

        // @ts-expect-error either make props in ConnectionProps required or the constructor needs to accept than as they are (means adapt socket-client)
        this.socket = new ConnectionClass({
            ...(props?.socket || settings?.socket),
            name: this.adapterName,
            doNotLoadAllObjects: settings?.doNotLoadAllObjects,
            onProgress: (progress: PROGRESS) => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({ connected: false });
                } else if (progress === PROGRESS.READY) {
                    this.setState({ connected: true });
                } else {
                    this.setState({ connected: true });
                }
            },
            onReady: (/* objects, scripts */) => {
                I18n.setLanguage(this.socket.systemLang);

                // subscribe because of language and expert mode
                this.socket
                    .subscribeObject('system.config', this.onSystemConfigChanged)
                    .then(() => this.getSystemConfig())
                    .then(obj => {
                        this._secret =
                            (typeof obj !== 'undefined' && obj.native && obj.native.secret) || 'Zgfr56gFe87jJOM';
                        this._systemConfig = obj?.common || ({} as ioBroker.SystemConfigCommon);
                        return this.socket.getObject(this.instanceId);
                    })
                    .then(async obj => {
                        let waitPromise;
                        const instanceObj: ioBroker.InstanceObject | null | undefined = obj as
                            | ioBroker.InstanceObject
                            | null
                            | undefined;

                        const sentryPluginEnabled = (
                            await this.socket.getState(`${this.instanceId}.plugins.sentry.enabled`)
                        )?.val;

                        const sentryEnabled =
                            sentryPluginEnabled !== false &&
                            this._systemConfig?.diag !== 'none' &&
                            instanceObj?.common &&
                            instanceObj.common.name &&
                            instanceObj.common.version &&
                            // @ts-expect-error will be extended in js-controller TODO: (BF: 2024.05.30) this is redundant to state `${this.instanceId}.plugins.sentry.enabled`, remove this in future when admin sets the state correctly
                            !instanceObj.common.disableDataReporting &&
                            window.location.host !== 'localhost:3000';

                        // activate sentry plugin
                        if (!this.sentryStarted && this.sentryDSN && sentryEnabled) {
                            this.sentryStarted = true;

                            Sentry.init({
                                dsn: this.sentryDSN,
                                release: `iobroker.${instanceObj.common.name}@${instanceObj.common.version}`,
                                integrations: [Sentry.dedupeIntegration()],
                            });

                            console.log('Sentry initialized');
                        }

                        // read UUID and init sentry with it.
                        // for backward compatibility it will be processed separately from the above logic: some adapters could still have this.sentryDSN as undefined
                        if (!this.sentryInited && sentryEnabled) {
                            this.sentryInited = true;

                            waitPromise = this.socket.getObject('system.meta.uuid').then(uuidObj => {
                                if (uuidObj && uuidObj.native && uuidObj.native.uuid) {
                                    const scope = Sentry.getCurrentScope();
                                    scope.setUser({ id: uuidObj.native.uuid });
                                }
                            });
                        }

                        waitPromise = waitPromise instanceof Promise ? waitPromise : Promise.resolve();

                        void waitPromise.then(() => {
                            if (instanceObj) {
                                this.common = instanceObj?.common;
                                this.onPrepareLoad(instanceObj.native, instanceObj.encryptedNative); // decode all secrets
                                this.savedNative = JSON.parse(JSON.stringify(instanceObj.native));
                                this.setState(
                                    { native: instanceObj.native, loaded: true, expertMode: this.getExpertMode() },
                                    () => this.onConnectionReady && this.onConnectionReady(),
                                );
                            } else {
                                console.warn('Cannot load instance settings');
                                this.setState(
                                    {
                                        native: {},
                                        loaded: true,
                                        expertMode: this.getExpertMode(),
                                    },
                                    () => this.onConnectionReady && this.onConnectionReady(),
                                );
                            }
                        });
                    })
                    .catch(e => window.alert(`Cannot settings: ${e}`));
            },
            onError: (err: string) => {
                console.error(err);
                this.showError(err);
            },
        });
    }

    /**
     * Checks if this connection is running in a web adapter and not in an admin.
     *
     * @returns True if running in a web adapter or in a socketio adapter.
     */
    static isWeb(): boolean {
        return window.socketUrl !== undefined;
    }

    showAlert(message: string, type?: 'info' | 'warning' | 'error' | 'success'): void {
        if (type !== 'error' && type !== 'warning' && type !== 'info' && type !== 'success') {
            type = 'info';
        }

        this.setState({
            _alert: true,
            _alertType: type,
            _alertMessage: message,
        });
    }

    renderAlertSnackbar(): JSX.Element {
        this.alertDialogRendered = true;

        return (
            <Snackbar
                style={
                    this.state._alertType === 'error'
                        ? { backgroundColor: '#f44336' }
                        : this.state._alertType === 'success'
                          ? { backgroundColor: '#4caf50' }
                          : undefined
                }
                open={this.state._alert}
                autoHideDuration={6000}
                onClose={(_e, reason) => reason !== 'clickaway' && this.setState({ _alert: false })}
                message={this.state._alertMessage}
            />
        );
    }

    onSystemConfigChanged = (id: string, obj: ioBroker.AnyObject | null | undefined): void => {
        if (obj && id === 'system.config') {
            if (this.socket.systemLang !== (obj as ioBroker.SystemConfigObject)?.common.language) {
                this.socket.systemLang = (obj as ioBroker.SystemConfigObject)?.common.language || 'en';
                I18n.setLanguage(this.socket.systemLang);
            }

            if (this._systemConfig?.expertMode !== !!(obj as ioBroker.SystemConfigObject)?.common?.expertMode) {
                this._systemConfig =
                    (obj as ioBroker.SystemConfigObject)?.common || ({} as ioBroker.SystemConfigCommon);
                this.setState({ expertMode: this.getExpertMode() });
            } else {
                this._systemConfig =
                    (obj as ioBroker.SystemConfigObject)?.common || ({} as ioBroker.SystemConfigCommon);
            }
        }
    };

    /**
     * Called immediately after a component is mounted. Setting state here will trigger re-rendering.
     */
    componentDidMount(): void {
        window.addEventListener('resize', this.onResize, true);
        window.addEventListener('message', this.onReceiveMessage, false);
        super.componentDidMount();
    }

    /**
     * Called immediately before a component is destroyed.
     */
    componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize, true);
        window.removeEventListener('message', this.onReceiveMessage, false);
        super.componentWillUnmount();
    }

    onReceiveMessage = (message: { data: string } | null): void => {
        if (message?.data) {
            if (message.data === 'updateTheme') {
                const newThemeName = Utils.getThemeName();
                Utils.setThemeName(Utils.getThemeName());

                const newTheme = this.createTheme(newThemeName);

                this.setState(
                    {
                        theme: newTheme,
                        themeName: this.getThemeName(newTheme),
                        themeType: this.getThemeType(newTheme),
                    },
                    () => {
                        this.props.onThemeChange && this.props.onThemeChange(newThemeName);
                        this.onThemeChanged && this.onThemeChanged(newThemeName);
                    },
                );
            } else if (message.data === 'updateExpertMode') {
                this.onToggleExpertMode && this.onToggleExpertMode(this.getExpertMode());
            } else if (message.data !== 'chartReady') {
                // if not "echart ready" message
                console.debug(
                    `Received unknown message: "${JSON.stringify(message.data)}". May be it will be processed later`,
                );
            }
        }
    };

    private onResize = (): void => {
        this.resizeTimer && clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            this.resizeTimer = null;
            this.setState({ width: GenericApp.getWidth() });
        }, 200);
    };

    /**
     * Gets the width depending on the window inner width.
     */
    static getWidth(): Width {
        /**
         * innerWidth |xs      sm      md      lg      xl
         *            |-------|-------|-------|-------|------>
         * width      |  xs   |  sm   |  md   |  lg   |  xl
         */

        const SIZES: Record<Width, number> = {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        };
        const width = window.innerWidth;
        const keys = Object.keys(SIZES).reverse();
        const widthComputed = keys.find(key => width >= SIZES[key as Width]) as Width;

        return widthComputed || 'xs';
    }

    /**
     * Get a theme
     *
     * @param name Theme name
     */
    // eslint-disable-next-line class-methods-use-this
    createTheme(name?: ThemeName | null): IobTheme {
        return Theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme name
     */
    // eslint-disable-next-line class-methods-use-this
    getThemeName(currentTheme: IobTheme): ThemeName {
        return currentTheme.name;
    }

    /**
     * Get the theme type
     */
    // eslint-disable-next-line class-methods-use-this
    getThemeType(currentTheme: IobTheme): ThemeType {
        return currentTheme.palette.mode;
    }

    // eslint-disable-next-line class-methods-use-this
    onThemeChanged(_newThemeName: string): void {}

    // eslint-disable-next-line class-methods-use-this
    onToggleExpertMode(_expertMode: boolean): void {}

    /**
     * Changes the current theme
     */
    toggleTheme(newThemeName?: ThemeName): void {
        const themeName = this.state.themeName;

        // dark => blue => colored => light => dark
        newThemeName =
            newThemeName ||
            (themeName === 'dark'
                ? 'light'
                : themeName === 'blue'
                  ? 'light'
                  : themeName === 'colored'
                    ? 'light'
                    : 'dark');

        if (newThemeName !== themeName) {
            Utils.setThemeName(newThemeName);

            const newTheme = this.createTheme(newThemeName);

            this.setState(
                {
                    theme: newTheme,
                    themeName: this.getThemeName(newTheme),
                    themeType: this.getThemeType(newTheme),
                },
                () => {
                    this.props.onThemeChange && this.props.onThemeChange(newThemeName || 'light');
                    this.onThemeChanged && this.onThemeChanged(newThemeName || 'light');
                },
            );
        }
    }

    /**
     * Gets the system configuration.
     */
    getSystemConfig(): Promise<ioBroker.SystemConfigObject> {
        return this.socket.getSystemConfig();
    }

    /**
     * Get current expert mode
     */
    getExpertMode(): boolean {
        return window.sessionStorage.getItem('App.expertMode') === 'true' || !!this._systemConfig?.expertMode;
    }

    /**
     * Gets called when the socket.io connection is ready.
     * You can overload this function to execute own commands.
     */
    // eslint-disable-next-line class-methods-use-this
    onConnectionReady(): void {}

    /**
     * Encrypts a string.
     */
    encrypt(value: string): string {
        let result = '';
        if (this._secret) {
            for (let i = 0; i < value.length; i++) {
                result += String.fromCharCode(
                    this._secret[i % this._secret.length].charCodeAt(0) ^ value.charCodeAt(i),
                );
            }
        }
        return result;
    }

    /**
     * Decrypts a string.
     */
    decrypt(value: string): string {
        let result = '';
        if (this._secret) {
            for (let i = 0; i < value.length; i++) {
                result += String.fromCharCode(
                    this._secret[i % this._secret.length].charCodeAt(0) ^ value.charCodeAt(i),
                );
            }
        }
        return result;
    }

    /**
     * Gets called when the navigation hash changes.
     * You may override this if needed.
     */
    onHashChanged(): void {
        const location = Router.getLocation();
        if (location.tab !== this.state.selectedTab) {
            this.selectTab(location.tab);
        }
    }

    /**
     * Selects the given tab.
     */
    selectTab(tab: string, index?: number): void {
        ((window as any)._localStorage || window.localStorage).setItem(`${this.adapterName}-adapter`, tab);
        this.setState({ selectedTab: tab, selectedTabNum: index });
    }

    /**
     * Gets called before the settings are saved.
     * You may override this if needed.
     */
    onPrepareSave(settings: Record<string, any>): boolean {
        // here you can encode values
        this.encryptedFields &&
            this.encryptedFields.forEach(attr => {
                if (settings[attr]) {
                    settings[attr] = this.encrypt(settings[attr]);
                }
            });

        return true;
    }

    /**
     * Gets called after the settings are loaded.
     * You may override this if needed.
     *
     * @param settings instance settings from native part
     * @param encryptedNative optional list of fields to be decrypted
     */
    onPrepareLoad(settings: Record<string, any>, encryptedNative?: string[]): void {
        // here you can encode values
        this.encryptedFields &&
            this.encryptedFields.forEach(attr => {
                if (settings[attr]) {
                    settings[attr] = this.decrypt(settings[attr]);
                }
            });
        encryptedNative &&
            encryptedNative.forEach(attr => {
                this.encryptedFields = this.encryptedFields || [];
                !this.encryptedFields.includes(attr) && this.encryptedFields.push(attr);
                if (settings[attr]) {
                    settings[attr] = this.decrypt(settings[attr]);
                }
            });
    }

    /**
     * Gets the extendable instances.
     */
    async getExtendableInstances(): Promise<ioBroker.InstanceObject[]> {
        try {
            const instances = await this.socket.getObjectViewSystem(
                'instance',
                'system.adapter.',
                'system.adapter.\u9999',
            );
            return Object.values(instances).filter(instance => !!instance?.common?.webExtendable);
        } catch {
            return [];
        }
    }

    /**
     * Gets the IP addresses of the given host.
     */
    async getIpAddresses(host: string): Promise<{ name: string; address: string; family: 'ipv4' | 'ipv6' }[]> {
        const ips = await this.socket.getHostByIp(host || this.common?.host || '');
        // translate names
        const ip4 = ips.find(ip => ip.address === '0.0.0.0');
        if (ip4) {
            ip4.name = `[IPv4] 0.0.0.0 - ${I18n.t('ra_Listen on all IPs')}`;
        }
        const ip6 = ips.find(ip => ip.address === '::');
        if (ip6) {
            ip6.name = `[IPv4] :: - ${I18n.t('ra_Listen on all IPs')}`;
        }
        return ips;
    }

    /**
     * Saves the settings to the server.
     *
     * @param isClose True if the user is closing the dialog.
     */
    onSave(isClose?: boolean): void {
        let oldObj: ioBroker.InstanceObject;
        if (this.state.isConfigurationError) {
            this.setState({ errorText: this.state.isConfigurationError });
            return;
        }

        this.socket
            .getObject(this.instanceId)
            .then(_oldObj => {
                oldObj = (_oldObj || {}) as ioBroker.InstanceObject;

                for (const a in this.state.native) {
                    if (Object.prototype.hasOwnProperty.call(this.state.native, a)) {
                        if (this.state.native[a] === null) {
                            oldObj.native[a] = null;
                        } else if (this.state.native[a] !== undefined) {
                            oldObj.native[a] = JSON.parse(JSON.stringify(this.state.native[a]));
                        } else {
                            delete oldObj.native[a];
                        }
                    }
                }

                if (this.state.common) {
                    for (const b in this.state.common) {
                        if (this.state.common[b] === null) {
                            (oldObj as Record<string, any>).common[b] = null;
                        } else if (this.state.common[b] !== undefined) {
                            (oldObj as Record<string, any>).common[b] = JSON.parse(
                                JSON.stringify(this.state.common[b]),
                            );
                        } else {
                            delete (oldObj as Record<string, any>).common[b];
                        }
                    }
                }

                if (this.onPrepareSave(oldObj.native) !== false) {
                    return this.socket.setObject(this.instanceId, oldObj);
                }

                return Promise.reject(new Error('Invalid configuration'));
            })
            .then(() => {
                this.savedNative = oldObj.native;
                globalThis.changed = false;
                try {
                    window.parent.postMessage('nochange', '*');
                } catch {
                    // ignore
                }

                this.setState({ changed: false });
                isClose && GenericApp.onClose();
            })
            .catch(e => console.error(`Cannot save configuration: ${e}`));
    }

    /**
     * Renders the toast.
     */
    renderToast(): JSX.Element | null {
        if (!this.state.toast) {
            return null;
        }

        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={!0}
                autoHideDuration={6000}
                onClose={() => this.setState({ toast: '' })}
                ContentProps={{ 'aria-describedby': 'message-id' }}
                message={<span id="message-id">{this.state.toast}</span>}
                action={[
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        className={this.props.classes?.close}
                        onClick={() => this.setState({ toast: '' })}
                        size="large"
                    >
                        <IconClose />
                    </IconButton>,
                ]}
            />
        );
    }

    /**
     * Closes the dialog.
     */
    static onClose(): void {
        if (typeof window.parent !== 'undefined' && window.parent) {
            try {
                if (window.parent.$iframeDialog && typeof window.parent.$iframeDialog.close === 'function') {
                    window.parent.$iframeDialog.close();
                } else {
                    window.parent.postMessage('close', '*');
                }
            } catch {
                window.parent.postMessage('close', '*');
            }
        }
    }

    /**
     * Renders the error dialog.
     */
    renderError(): React.JSX.Element | null {
        if (!this.state.errorText) {
            return null;
        }

        return (
            <DialogError
                text={this.state.errorText}
                onClose={() => this.setState({ errorText: '' })}
            />
        );
    }

    /**
     * Checks if the configuration has changed.
     *
     * @param native the new state
     */
    getIsChanged(native: Record<string, any>): boolean {
        native = native || this.state.native;
        const isChanged = JSON.stringify(native) !== JSON.stringify(this.savedNative);

        globalThis.changed = isChanged;

        return isChanged;
    }

    /**
     * Gets called when loading the configuration.
     *
     * @param newNative The new configuration object.
     */
    onLoadConfig(newNative: Record<string, any>): void {
        if (JSON.stringify(newNative) !== JSON.stringify(this.state.native)) {
            this.setState({ native: newNative, changed: this.getIsChanged(newNative) });
        }
    }

    /**
     * Sets the configuration error.
     */
    setConfigurationError(errorText: string): void {
        if (this.state.isConfigurationError !== errorText) {
            this.setState({ isConfigurationError: errorText });
        }
    }

    /**
     * Renders the save and close buttons.
     */
    renderSaveCloseButtons(): React.JSX.Element | null {
        if (!this.state.confirmClose && !this.state.bottomButtons) {
            return null;
        }

        return (
            <>
                {this.state.bottomButtons ? (
                    <SaveCloseButtons
                        theme={this.state.theme}
                        newReact={this.newReact}
                        noTextOnButtons={
                            this.state.width === 'xs' || this.state.width === 'sm' || this.state.width === 'md'
                        }
                        changed={this.state.changed}
                        onSave={(isClose: boolean): void => this.onSave(isClose)}
                        onClose={(): void => {
                            if (this.state.changed) {
                                this.setState({ confirmClose: true });
                            } else {
                                GenericApp.onClose();
                            }
                        }}
                        error={!!this.state.isConfigurationError}
                    />
                ) : null}
                {this.state.confirmClose ? (
                    <DialogConfirm
                        title={I18n.t('ra_Please confirm')}
                        text={I18n.t('ra_Some data are not stored. Discard?')}
                        ok={I18n.t('ra_Discard')}
                        cancel={I18n.t('ra_Cancel')}
                        onClose={(isYes: boolean): void =>
                            this.setState({ confirmClose: false }, () => isYes && GenericApp.onClose())
                        }
                    />
                ) : null}
            </>
        );
    }

    private _updateNativeValue(obj: Record<string, any>, attrs: string | string[], value: any): boolean {
        if (typeof attrs !== 'object') {
            attrs = attrs.split('.');
        }
        const attr: string = attrs.shift() || '';
        if (!attrs.length) {
            if (value && typeof value === 'object') {
                if (JSON.stringify(obj[attr]) !== JSON.stringify(value)) {
                    obj[attr] = value;
                    return true;
                }
                return false;
            }
            if (obj[attr] !== value) {
                obj[attr] = value;
                return true;
            }

            return false;
        }

        obj[attr] = obj[attr] || {};
        if (typeof obj[attr] !== 'object') {
            throw new Error(`attribute ${attr} is no object, but ${typeof obj[attr]}`);
        }
        return this._updateNativeValue(obj[attr], attrs, value);
    }

    /**
     * Update the native value
     *
     * @param attr The attribute name with dots as delimiter.
     * @param value The new value.
     * @param cb Callback which will be called upon completion.
     */
    updateNativeValue(attr: string, value: any, cb?: () => void): void {
        const native = JSON.parse(JSON.stringify(this.state.native));
        if (this._updateNativeValue(native, attr, value)) {
            const changed = this.getIsChanged(native);

            if (changed !== this.state.changed) {
                try {
                    window.parent.postMessage(changed ? 'change' : 'nochange', '*');
                } catch {
                    // ignore
                }
            }

            this.setState({ native, changed }, cb);
        }
    }

    /**
     * Set the error text to be shown.
     */
    showError(text: string | React.JSX.Element): void {
        this.setState({ errorText: text });
    }

    /**
     * Sets the toast to be shown.
     *
     * @param toast Text to be shown.
     */
    showToast(toast: string | React.JSX.Element): void {
        this.setState({ toast });
    }

    /**
     * Renders helper dialogs
     */
    renderHelperDialogs(): React.JSX.Element {
        return (
            <>
                {this.renderError()}
                {this.renderToast()}
                {this.renderSaveCloseButtons()}
                {this.renderAlertSnackbar()}
            </>
        );
    }

    /**
     * Renders this component.
     */
    render(): React.JSX.Element {
        if (!this.state.loaded) {
            return <Loader themeType={this.state.themeType} />;
        }

        return (
            <div className="App">
                {this.renderError()}
                {this.renderToast()}
                {this.renderSaveCloseButtons()}
                {this.renderAlertSnackbar()}
            </div>
        );
    }
}
