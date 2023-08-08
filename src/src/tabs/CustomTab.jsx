import React, { Component } from 'react';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import LinearProgress from '@mui/material/LinearProgress';

import { withWidth } from '@iobroker/adapter-react-v5';

import Utils from '../Utils';

const styles = () => ({
    root: {
        // border:     '0 solid #FFF',
        display:    'block',
        left:       0,
        top:        0,
        width:      '100%',
        height:     '100%',
        // background: 'white',
        color:      'black',
        borderRadius: 4,
        boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        border: '0px solid #888',
    },
});

export function getHref(instancesWorker, tab, hostname, protocol, port, hosts, adminInstance, themeName) {
    return instancesWorker.getInstances()
        .then(instances => {
            let adapter = tab.replace(/^tab-/, '');
            let instNum;
            const m = adapter.match(/-(\d+)$/);
            instNum = m ? parseInt(m[1], 10) : null;

            let instance;
            if (instNum !== null) {
                adapter = adapter.replace(/-(\d+)$/, '');
                const name = `system.adapter.${adapter}.${instNum}`;
                instance = Object.keys(instances).find(id => id === name);
            } else {
                const name = `system.adapter.${adapter}.`;

                instance = instances && Object.keys(instances).find(id => id.startsWith(name));
            }
            instance = instances && instances[instance];

            Utils.fixAdminUI(instance);

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
                // fix for singletons
                if (instNum === null || instNum === undefined) {
                    instNum = instance._id.split('.').pop();
                }

                // replace
                const hrefs = Utils.replaceLink(href, adapter, instNum, {
                    hostname,
                    protocol,
                    objects: instances,
                    hosts,
                    adminInstance,
                    port,
                });

                href = hrefs ? hrefs[0]?.url : '';
            }

            // add at the end the instance, as some adapters make bullshit like: window.location.search.slice(-1) || 0;
            href += `${href.includes('?') ? '&' : '?'}newReact=true${instNum !== null && instNum !== undefined ? `&${instNum}` : ''}&react=${themeName}`;

            return href;
        });
}

class CustomTab extends Component {
    constructor(props) {
        super(props);
        this.state = {
            href: '',
        };

        this.refIframe = React.createRef();
        this.registered = false;

        getHref(this.props.instancesWorker, this.props.tab, this.props.hostname, this.props.protocol, this.props.port, this.props.hosts,  this.props.adminInstance, this.props.themeName)
            .then(href => {
                this.setState({ href });
                // check if href exists
                // fetch(href)
                //     .then(() => this.setState({ href }))
                //     .catch(() => this.setState({ href: href.includes('tab_m.html') ? href.replace('tab_m.html', 'tab.html') : href.replace('tab.html', 'tab_m.html') }));
            });
    }

    componentWillUnmount() {
        this.registered && this.props.onUnregisterIframeRef(this.refIframe);
    }

    componentDidMount() {
        if (!this.registered && this.refIframe.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
    }

    componentDidUpdate(/* prevProps, prevState, snapshot */) {
        if (!this.registered && this.refIframe.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
    }

    render() {
        if (!this.state.href) {
            return <LinearProgress />;
        }

        return <iframe
            ref={el => this.refIframe = el}
            title={this.props.tab}
            className={this.props.classes.root}
            src={this.state.href}
            onError={e => {
                e.target.onerror = null;
                this.setState({ href: this.state.href.replace('tab_m.html', 'tab.html') });
            }}
        />;
    }
}

CustomTab.propTypes = {
    themeName: PropTypes.string,
    tab: PropTypes.string.isRequired,
    instancesWorker: PropTypes.object.isRequired,

    hostname: PropTypes.string,
    protocol: PropTypes.string,
    port: PropTypes.number,
    adminInstance: PropTypes.string,
    hosts: PropTypes.array,

    onRegisterIframeRef: PropTypes.func,
    onUnregisterIframeRef: PropTypes.func,
};

export default withWidth()(withStyles(styles)(CustomTab));
