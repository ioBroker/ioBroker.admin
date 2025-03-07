import React, { Component, type JSX } from 'react';
import { LinearProgress } from '@mui/material';
import JSON5 from 'json5';

import {
    type ThemeType,
    Router,
    type AdminConnection,
    type IobTheme,
    type ThemeName,
} from '@iobroker/adapter-react-v5';
import { type ConfigItemPanel, JsonConfigComponent } from '@iobroker/json-config';

import type { InstancesWorker } from '@/Workers/InstancesWorker';
import AdminUtils from '@/helpers/AdminUtils';
import { replaceLink } from '@/helpers/utils';
import type { CompactHost } from '@/types';

const styles: Record<string, React.CSSProperties> = {
    root: {
        // border:     '0 solid #FFF',
        display: 'block',
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

export async function getHref(
    instancesWorker: InstancesWorker,
    tab: string,
    hostname: string,
    hosts: Record<string, ioBroker.HostObject>,
    adminInstance: string,
    themeType: ThemeType,
): Promise<{ href: string; adapterName: string; instanceNumber: number | null; sendTo?: string | boolean }> {
    const instances = await instancesWorker.getObjects();
    let adapter = tab.replace(/^tab-/, '');
    const m = adapter.match(/-(\d+)$/);
    const instanceNumber: number | null = m ? parseInt(m[1], 10) : null;
    let instance;
    if (instances) {
        if (instanceNumber !== null) {
            adapter = adapter.replace(/-(\d+)$/, '');
            const name = `system.adapter.${adapter}.${instanceNumber}`;
            instance = Object.keys(instances).find(id => id === name);
        } else {
            const name = `system.adapter.${adapter}.`;

            instance = instances && Object.keys(instances).find(id => id.startsWith(name));
        }
    }
    instance = instances?.[instance];
    AdminUtils.fixAdminUI(instance);
    if (!instance?.common?.adminTab) {
        console.error(`Cannot find instance ${tab}`);

        return { href: '', adapterName: adapter, instanceNumber };
    }

    // calculate href
    let href = instance.common.adminTab.link;
    if (!href) {
        if (instance.common.adminUI?.tab === 'materialize') {
            href = `adapter/${adapter}/tab_m.html${instanceNumber !== null && instanceNumber !== undefined ? `?${instanceNumber}` : ''}`;
        } else {
            href = `adapter/${adapter}/tab.html${instanceNumber !== null && instanceNumber !== undefined ? `?${instanceNumber}` : ''}`;
        }
    }
    if (!instance.common.adminTab.singleton && instanceNumber !== null && instanceNumber !== undefined) {
        href += `${href.includes('?') ? '&' : '?'}instance=${instanceNumber}`;
    }

    if (href.includes('%')) {
        let _instNum: number;
        // fix for singletons
        if (instanceNumber === null) {
            _instNum = parseInt(instance._id.split('.').pop(), 10);
        } else {
            _instNum = instanceNumber;
        }

        // replace
        const hrefs = replaceLink(href, adapter, _instNum, {
            hostname,
            // it cannot be void
            instances,
            hosts,
            adminInstance,
        });

        href = hrefs ? hrefs[0]?.url : '';
    }

    // add at the end the instance, as some adapters make bullshit like: window.location.search.slice(-1) || 0;
    href += `${href.includes('?') ? '&' : '?'}newReact=true${instanceNumber !== null && instanceNumber !== undefined ? `&${instanceNumber}` : ''}&react=${themeType}`;

    return {
        href,
        adapterName: adapter,
        instanceNumber,
        // @ts-expect-error will be defined later
        sendTo: instance.common.adminTab.sendTo as boolean | string,
    };
}

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
}

interface CustomTabState {
    href: string;
    adapterName: string;
    instanceNumber: number | null;
    schema: ConfigItemPanel | null;
    jsonData: Record<string, any>;
}

class CustomTab extends Component<CustomTabProps, CustomTabState> {
    private refIframe: HTMLIFrameElement | null = null;

    private registered: boolean = false;

    constructor(props: CustomTabProps) {
        super(props);
        this.state = {
            href: '',
            adapterName: '',
            instanceNumber: null,
            schema: null,
            jsonData: {},
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

        const result = await getHref(
            this.props.instancesWorker,
            this.props.tab,
            this.props.hostname,
            hosts as Record<string, ioBroker.HostObject>,
            this.props.adminInstance,
            this.props.theme.palette.mode,
        );
        let schema: ConfigItemPanel | null = null;
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

                if (result.sendTo && result.instanceNumber !== null) {
                    const alive = await this.props.socket.getState(
                        `system.adapter.${result.adapterName}.${result.instanceNumber || 0}.alive`,
                    );
                    if (alive?.val) {
                        const answer: { data?: Record<string, any>; error?: string } = await this.props.socket.sendTo(
                            `${result.adapterName}.${result.instanceNumber}`,
                            typeof result.sendTo === 'string' ? result.sendTo : 'tab',
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

    // eslint-disable-next-line class-methods-use-this
    onMessage = (event: MessageEvent & { message: string }): void => {
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
                    expertMode={this.props.expertMode}
                />
            );
        }

        return (
            <iframe
                ref={el => (this.refIframe = el)}
                title={this.props.tab}
                style={styles.root}
                src={this.state.href}
                onError={e => {
                    (e.target as HTMLIFrameElement).onerror = null;
                    this.setState({ href: this.state.href.replace('tab_m.html', 'tab.html') });
                }}
            />
        );
    }
}

export default CustomTab;
