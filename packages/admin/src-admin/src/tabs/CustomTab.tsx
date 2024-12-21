import React, { Component, type JSX } from 'react';
import { LinearProgress } from '@mui/material';

import { withWidth, type ThemeType, Router } from '@iobroker/adapter-react-v5';

import type { InstancesWorker } from '@/Workers/InstancesWorker';
import AdminUtils from '@/helpers/AdminUtils';
import { replaceLink } from '@/helpers/utils';

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
): Promise<string> {
    const instances = await instancesWorker.getObjects();
    let adapter = tab.replace(/^tab-/, '');
    const m = adapter.match(/-(\d+)$/);
    const instNum: number | null = m ? parseInt(m[1], 10) : null;
    let instance;
    if (instances) {
        if (instNum !== null) {
            adapter = adapter.replace(/-(\d+)$/, '');
            const name = `system.adapter.${adapter}.${instNum}`;
            instance = Object.keys(instances).find(id => id === name);
        } else {
            const name = `system.adapter.${adapter}.`;

            instance = instances && Object.keys(instances).find(id => id.startsWith(name));
        }
    }
    instance = instances && instances[instance];
    AdminUtils.fixAdminUI(instance);
    if (!instance || !instance.common || !instance.common.adminTab) {
        console.error(`Cannot find instance ${tab}`);

        return '';
    }

    // calculate href
    let href = instance.common.adminTab.link;
    if (!href) {
        if (instance.common.adminUI?.tab === 'materialize') {
            href = `adapter/${adapter}/tab_m.html${instNum !== null && instNum !== undefined ? `?${instNum}` : ''}`;
        } else {
            href = `adapter/${adapter}/tab.html${instNum !== null && instNum !== undefined ? `?${instNum}` : ''}`;
        }
    }
    if (!instance.common.adminTab.singleton && instNum !== null && instNum !== undefined) {
        href += `${href.includes('?') ? '&' : '?'}instance=${instNum}`;
    }
    if (href.includes('%')) {
        let _instNum: number;
        // fix for singletons
        if (instNum === null) {
            _instNum = parseInt(instance._id.split('.').pop(), 10);
        } else {
            _instNum = instNum;
        }

        // replace
        const hrefs = replaceLink(href, adapter, _instNum, {
            hostname,
            // it cannot be void
            instances: instances,
            hosts,
            adminInstance,
        });

        href = hrefs ? hrefs[0]?.url : '';
    }
    // add at the end the instance, as some adapters make bullshit like: window.location.search.slice(-1) || 0;
    href += `${href.includes('?') ? '&' : '?'}newReact=true${instNum !== null && instNum !== undefined ? `&${instNum}` : ''}&react=${themeType}`;
    return href;
}

interface CustomTabProps {
    instancesWorker: InstancesWorker;
    tab: string;
    hostname: string;
    hosts: ioBroker.HostObject[];
    adminInstance: string;
    themeName: ThemeType;
    onRegisterIframeRef: (ref: HTMLIFrameElement) => void;
    onUnregisterIframeRef: (ref: HTMLIFrameElement) => void;
}

interface CustomTabState {
    href: string;
}

class CustomTab extends Component<CustomTabProps, CustomTabState> {
    private refIframe: HTMLIFrameElement | null = null;

    private registered: boolean = false;

    constructor(props: CustomTabProps) {
        super(props);
        this.state = {
            href: '',
        };

        const hosts: Record<string, ioBroker.HostObject> = {};
        for (const host of props.hosts) {
            hosts[host._id] = host;
        }

        void getHref(
            this.props.instancesWorker,
            this.props.tab,
            this.props.hostname,
            hosts,
            this.props.adminInstance,
            this.props.themeName,
        ).then(href => {
            this.setState({ href });
            // check if href exists
            // fetch(href)
            //     .then(() => this.setState({ href }))
            //     .catch(() => this.setState({ href: href.includes('tab_m.html') ? href.replace('tab_m.html', 'tab.html') : href.replace('tab.html', 'tab_m.html') }));
        });
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

    componentDidMount(): void {
        if (!this.registered && this.refIframe?.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
        (window.addEventListener || window.attachEvent)(
            window.addEventListener ? 'message' : 'onmessage',
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

export default withWidth()(CustomTab);
