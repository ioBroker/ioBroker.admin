import React, { Component, type JSX } from 'react';
import { LinearProgress } from '@mui/material';
import JSON5 from 'json5';

import { I18n, Router, type AdminConnection, type IobTheme, type ThemeName } from '@iobroker/adapter-react-v5';
import { type ConfigItemPanel, type ConfigItemTabs, JsonConfigComponent } from '@iobroker/json-config';

import type { InstancesWorker } from '@/Workers/InstancesWorker';
import AdminUtils from '@/helpers/AdminUtils';
import type { CompactHost } from '@/types';

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

interface CustomTabProps {
    instancesWorker: InstancesWorker;
    tab: string;
    hostname: string;
    hosts: CompactHost[];
    adminInstance: string;
    themeName: ThemeName;
    onRegisterIframeRef: (ref: HTMLIFrameElement) => void;
    onUnregisterIframeRef: (ref: HTMLIFrameElement) => void;
    socket: AdminConnection;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
    expertMode: boolean;
    icon?: string | React.JSX.Element;
    supportsLoadingMessage?: boolean;
}

interface CustomTabState {
    href: string;
    adapterName: string;
    instanceNumber: number | null;
    schema: ConfigItemPanel | ConfigItemTabs | null;
    jsonData: Record<string, any>;
    loadingKey: number;
    loading: boolean;
}

export default class CustomTab extends Component<CustomTabProps, CustomTabState> {
    private refIframe: HTMLIFrameElement | null = null;

    private registered: boolean = false;

    private loadingTimer: ReturnType<typeof setInterval> | null = null;

    constructor(props: CustomTabProps) {
        super(props);
        this.state = {
            href: '',
            adapterName: '',
            instanceNumber: null,
            schema: null,
            jsonData: {},
            loadingKey: 0,
            loading: true,
        };
    }

    async componentDidMount(): Promise<void> {
        if (!this.registered && this.refIframe?.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
        (window.addEventListener || window.attachEvent)(
            window.addEventListener ? 'message' : 'onmessage',
            this.onMessage,
            false,
        );

        const hosts: Record<string, CompactHost> = {};
        for (const host of this.props.hosts) {
            hosts[host._id] = host;
        }

        const result = await AdminUtils.getHref(
            this.props.instancesWorker,
            this.props.tab,
            this.props.hostname,
            hosts as Record<string, ioBroker.HostObject>,
            this.props.adminInstance,
            this.props.theme.palette.mode,
        );
        let schema: ConfigItemPanel | ConfigItemTabs | null = null;
        const fileName = result?.href.split('?')[0] || '';
        let jsonData: Record<string, any> = {};

        // Check if jsonTab.json(5) exists
        if (fileName.endsWith('.json') || fileName.endsWith('.json5')) {
            try {
                let jsonText: string;
                const json: {
                    file: string;
                    mimeType: string;
                } = await this.props.socket.readFile(`${result.adapterName}.admin`, fileName, true);

                if (json.file !== undefined) {
                    jsonText = atob(json.file.toString());
                    if (!jsonText.startsWith('{')) {
                        jsonText = decodeURIComponent(jsonText);
                    }
                }

                try {
                    schema = JSON5.parse(jsonText);
                } catch (e) {
                    console.error(`Cannot parse jsonConfig of ${result.adapterName}: ${e}`);
                    window.alert(`Cannot parse jsonConfig of ${result.adapterName}: ${e}`);
                }

                if (schema) {
                    await JsonConfigComponent.loadI18n(this.props.socket, schema.i18n, result.adapterName);
                }

                if (schema?.command) {
                    const alive = await this.props.socket.getState(
                        `system.adapter.${result.adapterName}.${result.instanceNumber || 0}.alive`,
                    );
                    if (alive?.val) {
                        const answer: { data?: Record<string, any>; error?: string } = await this.props.socket.sendTo(
                            `${result.adapterName}.${result.instanceNumber || 0}`,
                            schema?.command,
                            null,
                        );
                        if (answer?.data) {
                            jsonData = answer.data;
                        }
                    }
                }
            } catch (e1) {
                console.error(`Cannot load ${result.adapterName}.admin/${result.href}: ${e1}`);
                window.alert(`Cannot load ${result.adapterName}.admin/${result.href}: ${e1}`);
            }
        }

        this.setState({
            href: result.href,
            adapterName: result.adapterName,
            instanceNumber: result.instanceNumber,
            schema,
            jsonData,
        });
        // check if href exists
        // fetch(href)
        //     .then(() => this.setState({ href }))
        //     .catch(() => this.setState({ href: href.includes('tab_m.html') ? href.replace('tab_m.html', 'tab.html') : href.replace('tab.html', 'tab_m.html') }));
    }

    componentWillUnmount(): void {
        if (this.loadingTimer) {
            clearInterval(this.loadingTimer);
            this.loadingTimer = null;
        }
        if (this.registered) {
            this.props.onUnregisterIframeRef(this.refIframe);
            this.registered = false;
        }
        (window.removeEventListener || window.detachEvent)(
            window.removeEventListener ? 'message' : 'onmessage',
            this.onMessage,
            false,
        );
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */): void {
        if (!this.registered && this.refIframe?.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
    }

    onMessage = (event: MessageEvent & { message: string }): void => {
        if ((this.props.supportsLoadingMessage && event.data === 'iobLoaded') || event.message === 'iobLoaded') {
            // iframe loaded
            this.setState({ loading: false });
            if (this.loadingTimer) {
                clearInterval(this.loadingTimer);
                this.loadingTimer = null;
            }
            return;
        }

        if (event.origin !== window.location.origin) {
            return;
        }
        if (event.data === 'close' || event.message === 'close') {
            Router.doNavigate('tab-instances');
        } else if (event.data === 'change' || event.message === 'change') {
            // this.props.configStored(false);
            console.warn('Application sends "change" message, but it is not processed yet');
        } else if (event.data === 'nochange' || event.message === 'nochange') {
            // this.props.configStored(true);
            console.warn('Application sends "nochange" message, but it is not processed yet');
        } else if (
            (typeof event.data === 'string' && event.data.startsWith('goto:')) ||
            (typeof event.message === 'string' && event.message.startsWith('goto:'))
        ) {
            const [, url] = (event.data || event.message).split(':');
            const [tab, subTab, parameter] = url.split('/');
            Router.doNavigate(tab, subTab, parameter);
        }
    };

    render(): JSX.Element {
        if (!this.state.href) {
            return <LinearProgress />;
        }

        if (this.state.href.includes('.json')) {
            if (!this.state.schema) {
                return <LinearProgress />;
            }

            return (
                <JsonConfigComponent
                    socket={this.props.socket}
                    themeName={this.props.themeName}
                    themeType={this.props.theme.palette.mode}
                    adapterName={this.state.adapterName}
                    instance={this.state.instanceNumber || 0}
                    isFloatComma={this.props.isFloatComma}
                    dateFormat={this.props.dateFormat}
                    schema={this.state.schema}
                    data={this.state.jsonData}
                    onError={() => {}}
                    theme={this.props.theme}
                    withoutSaveButtons
                    expertMode={this.props.expertMode}
                />
            );
        }

        if (
            this.state.href.startsWith('http://') &&
            window.location.protocol === 'https:' &&
            window.location.hostname !== 'localhost'
        ) {
            // Show warning that insecure content cannot be loaded
            return (
                <div
                    style={{
                        padding: 10,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        fontSize: 18,
                        gap: 20,
                    }}
                >
                    <div>{I18n.t('This content cannot be loaded because it uses insecure HTTP protocol.')}</div>
                    <div>{I18n.t('But you can open this link in new tab:')}</div>
                    <a
                        href={this.state.href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {this.state.href}
                    </a>
                </div>
            );
        }

        return (
            <div style={styles.root}>
                {this.state.loading ? (
                    <LinearProgress style={{ position: 'absolute', zIndex: 2, width: '100%' }} />
                ) : null}
                {this.state.loading && this.props.icon ? (
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 2,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: 48,
                        }}
                    >
                        {typeof this.props.icon === 'string' ? (
                            <img
                                src={this.props.icon}
                                alt="icon"
                                style={{
                                    maxWidth: 200,
                                    width: '100%',
                                    opacity: 0.7,
                                }}
                            />
                        ) : (
                            this.props.icon
                        )}
                    </div>
                ) : null}
                <iframe
                    ref={el => {
                        this.refIframe = el;
                    }}
                    title={this.props.tab}
                    style={{
                        display: 'block',
                        position: 'relative',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        color: 'black',
                        zIndex: 1,
                        borderRadius: 0,
                        boxShadow: 'none',
                        border: '0px solid #888',
                    }}
                    src={this.state.href}
                    onLoad={() => {
                        if (!this.props.supportsLoadingMessage) {
                            this.setState({ loading: false });
                            if (this.loadingTimer) {
                                clearInterval(this.loadingTimer);
                                this.loadingTimer = null;
                            }
                        }
                    }}
                    onError={e => {
                        (e.target as HTMLIFrameElement).onerror = null;
                        if (this.state.href.includes('tab_m.html')) {
                            this.setState(prevState => ({ href: prevState.href.replace('tab_m.html', 'tab.html') }));
                        } else {
                            // Poll page periodically as maybe the service not yet startet
                            this.loadingTimer ||= setInterval(
                                () => this.setState({ loadingKey: this.state.loadingKey + 1 }),
                                3000,
                            );
                        }
                    }}
                />
            </div>
        );
    }
}
