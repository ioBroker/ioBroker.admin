import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import { Component } from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';

import Utils from '../Utils';

const styles = theme => ({
    root: {
        border: '0 solid #FFF',
        display: 'block',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
    },
});

class CustomTab extends Component {
    constructor(props) {
        super(props);
        this.state = {
            href: '',
        };

        this.props.instancesWorker.getInstances()
            .then(instances => {
                let adapter = this.props.tab.replace(/^tab-/, '');
                let instNum;
                const m = adapter.match(/-(\d+)$/);
                instNum = m ? parseInt(m[1], 10) : null;

                let instance;
                if (instNum !== null) {
                    adapter = adapter.replace(/-(\d+)$/, '');
                    const name = 'system.adapter.' + adapter + '.' + instNum;
                    instance = Object.keys(instances).find(id => id === name);
                } else {
                    const name = 'system.adapter.' + adapter + '.';

                    instance = Object.keys(instances).find(id => id.startsWith(name));
                }
                instance = instances[instance];

                if (!instance || !instance.common || !instance.common.adminTab) {
                    return console.error('Cannot find instance ' + this.props.tab);
                }

                // calculate href
                let href = instance.common.adminTab.link;

                if (!href) {
                    if (instance.common.materializeTab) {
                        href = 'adapter/' + adapter + '/tab_m.html';
                    } else {
                        href = 'adapter/' + adapter + '/tab.html';
                    }
                }

                if (!instance.common.adminTab.singleton) {
                    href += (href.includes('?') ? '&' : '?') + 'instance=' + instNum;
                }

                if (href.includes('%')) {
                    // replace
                    href = Utils.replaceLink(href, adapter, instNum, {
                        hostname: this.props.hostname,
                        protocol: this.props.protocol,
                        objects: instances
                    })
                }

                this.setState({ href });
            });
    }

    render() {
        if (!this.state.href) {
            return <LinearProgress />;
        }

        if (window.location.port === '3000') {
            return 'Test it in not development mode!';
        } else {
            return <iframe
                title={ this.props.tab }
                className={ this.props.classes.root }
                src={ this.state.href }
                onError={ e => {
                    e.target.onerror = null;
                    this.setState({href: this.state.href.replace('tab_m.html', 'tab.html') });
                }}
            />;
        }
    }
}

CustomTab.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    themeName: PropTypes.string,
    tab: PropTypes.string.isRequired,
    instancesWorker: PropTypes.object.isRequired,
    hostname: PropTypes.string,
    protocol: PropTypes.string,
    expertMode: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(CustomTab));