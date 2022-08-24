import { Component } from 'react';

import PropTypes from 'prop-types';
import semver from 'semver';

import { withStyles } from '@mui/styles';

import { Fab, Snackbar, Tooltip, Grid, LinearProgress, Skeleton } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CreateIcon from '@mui/icons-material/Create';

import UtilsCommon from '@iobroker/adapter-react-v5/Components/Utils';

import Utils from '../Utils';
import IntroCard from '../components/IntroCard';
import TabContainer from '../components/TabContainer';
import TabContent from '../components/TabContent';
import EditIntroLinkDialog from '../dialogs/EditIntroLinkDialog';

const styles = theme => ({
    root: {
        width: '100%',
        height: '100%'
    },
    button: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    saveButton: {
        backgroundColor: theme.palette.success.main,
        right: theme.spacing(10),
        '&:hover': {
            backgroundColor: theme.palette.success.dark
        }
    },
    addButton: {
        backgroundColor: theme.palette.secondary.main,
        right: theme.spacing(18),
        '&:hover': {
            backgroundColor: theme.palette.secondary.dark
        }
    },
    closeButton: {
        backgroundColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark
        }
    },
    bold: {
        fontWeight: 'bold'
    },
    container: {
        overflowY: 'auto'
    },
    hostOffline: {
        color: '#bb0000'
    },
    updateExists: {
        color: '#c28700',
        marginRight: 4,
    },
    updateNo: {
        color: '#00b204',
        marginRight: 4,
    },
    nodeUpdate: {
        opacity: 0.6,
    },
    instanceNumber: {
        opacity: 0.7,
        fontSize: 16,
    }
});

const formatInfo = {
    'Uptime':        Utils.formatSeconds,
    'System uptime': Utils.formatSeconds,
    'RAM':           Utils.formatRam,
    'Speed':         Utils.formatSpeed,
    'Disk size':     Utils.formatBytes,
    'Disk free':     Utils.formatBytes
};

class Intro extends Component {
    constructor(props) {
        super(props);

        this.state = {
            instances: null,
            deactivated: {},
            edit: false,

            introLinks: [],
            editLink: false,
            editLinkIndex: -1,
            openSnackBar: false,
            hasUnsavedChanges: false,
            reverseProxy: null,
            alive: {},
            hostsData: {}
        };

        this.currentProxyPath = window.location.pathname; // e.g. /admin/
        this.promises = {};

        this.introLinksOriginal = null;
        this.deactivatedOriginal = null;

        this.t = props.t;
    }

    componentDidMount() {
        this.getData()
            .then(() => {
                this.props.instancesWorker.registerHandler(this.getDataDelayed);
                this.props.hostsWorker.registerHandler(this.updateHosts);
                this.props.hostsWorker.registerAliveHandler(this.updateHostsAlive);
                // read reverse proxy settings
                this.props.socket.getObject('system.adapter.' + this.props.adminInstance)
                    .then(obj =>
                        this.setState({ reverseProxy: obj?.native?.reverseProxy || [] }));
            });
    }

    componentWillUnmount() {
        this.getDataTimeout && clearTimeout(this.getDataTimeout);

        this.props.instancesWorker.unregisterHandler(this.getDataDelayed);
        this.props.hostsWorker.unregisterHandler(this.updateHosts);
        this.props.hostsWorker.unregisterAliveHandler(this.updateHostsAlive);
    }

    updateHostsAlive = events => {
        let alive = JSON.parse(JSON.stringify(this.state.alive));
        let hostsId = [];

        // if some host deleted
        if (events.find(event => event.type === 'delete')) {
            // get all information anew
            return this.getDataDelayed();
        } else {
            // update alive status
            events.forEach(event => {
                if ((!!alive[event.id]) !== (!!event.alive)) {
                    alive[event.id] = event.alive;
                    hostsId.push(event.id);
                }
            });
        }

        if (hostsId.length) {
            const hostsData = JSON.parse(JSON.stringify(this.state.hostsData));

            Promise.all(hostsId.map(id => this.getHostData(id, alive[id])))
                .then(results => {
                    results.forEach(res => hostsData[res.id] = res.data);
                    this.setState({ alive, hostsData });
                });
        }
    };

    updateHosts = (events, obj) => {
        if (!Array.isArray(events)) {
            events = [{ id: events, obj, type: obj ? 'changed' : 'delete' }];
        }
        let hostsId = [];

        // if host deleted
        if (events.find(event => !event.obj)) {
            return this.getDataDelayed();
        } else {
            hostsId = events.map(event => event.id);
        }
        if (hostsId.length) {
            const hostsData = JSON.parse(JSON.stringify(this.state.hostsData));

            Promise.all(hostsId.map(id => this.getHostData(id)))
                .then(results => {
                    results.forEach(res => hostsData[res.id] = res.data);
                    this.setState({ hostsData });
                });
        }
    };

    activateEditMode() {
        let systemConfig;
        this.props.socket.getSystemConfig(true)
            .then(_systemConfig => {
                systemConfig = _systemConfig;
                return this.getInstances(true, null, systemConfig);
            })
            .then(data => {
                const introLinks = systemConfig && systemConfig.native && systemConfig.native.introLinks ? systemConfig.native.introLinks : [];

                this.introLinksOriginal = JSON.parse(JSON.stringify(introLinks));
                this.deactivatedOriginal  = JSON.parse(JSON.stringify(data.deactivated));

                this.setState({
                    instances: data.instances,
                    deactivated: data.deactivated,
                    edit: true,
                    introLinks,
                    hasUnsavedChanges: false,
                });
            });
    }

    deactivateEditMode() {
        if (!this.state.hasUnsavedChanges) {
            // todo: implement confirmation dialog
        }

        // restore old state
        this.setState({
            deactivated: this.deactivatedOriginal,
            introLinks: this.introLinksOriginal,
            hasUnsavedChanges: false,
            edit: false
        }, () => {
            this.deactivatedOriginal = null;
            this.introLinksOriginal = null;
        });
    }

    toggleCard(id, linkName) {
        if (!this.state.instances || !this.state.instances.length) {
            return;
        }

        const deactivated = JSON.parse(JSON.stringify(this.state.deactivated));

        const pos = deactivated.indexOf(`${id}_${linkName}`);

        if (pos !== -1) {
            deactivated.splice(pos, 1);
        } else {
            deactivated.push(`${id}_${linkName}`);
            deactivated.sort();
        }

        const hasUnsavedChanges = JSON.stringify(deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(this.state.introLinks) !== JSON.stringify(this.introLinksOriginal);

        this.setState({ deactivated, hasUnsavedChanges });
    }

    getInstancesCards() {
        return this.state.instances.map(instance => {
            const enabled = !this.state.deactivated.includes(`${instance.id}_${instance.linkName}`);
            if (enabled || this.state.edit) {
                let linkText = instance.link ? instance.link.replace(/^https?:\/\//, '') : '';
                const pos = linkText.indexOf('/');
                if (pos !== -1) {
                    linkText = linkText.substring(0, pos);
                }

                let isShowInstance = isFinite(instance.id.split('.').pop());
                if (isShowInstance) {
                    // try to find second instance of same type
                    isShowInstance = !!this.state.instances.find(inst =>
                        inst.id !== instance.id && instance.name === inst.name && instance.id.split('.')[0] === inst.id.split('.')[0]);
                }

                const hostData = this.state.hostsData ? this.state.hostsData[instance.id] : null;

                return <IntroCard
                    key={`${instance.id}_${instance.link}`}
                    socket={this.props.socket}
                    image={instance.image}
                    title={<>
                        <span style={instance.name && instance.name.length > 12 ? { fontSize: '1rem' } : undefined}>
                            {instance.name}
                        </span>
                        {isShowInstance ? <span className={this.props.classes.instanceNumber}>
                            .{instance.id.split('.').pop()}
                        </span> : null}
                    </>}
                    action={{ link: instance.link, text: linkText }}
                    t={this.props.t}
                    lang={this.props.lang}
                    color={instance.color}
                    reveal={instance.info}
                    edit={this.state.edit}
                    reverseProxy={this.state.reverseProxy}
                    offline={hostData && hostData.alive === false}
                    enabled={enabled}
                    disabled={!hostData || typeof hostData !== 'object'}
                    getHostDescriptionAll={() => this.getHostDescriptionAll(instance.id)}
                    toggleActivation={() => this.toggleCard(instance.id, instance.linkName)}
                    openSnackBarFunc={() => this.setState({ openSnackBar: true })}
                >
                    { instance.description || this.getHostDescription(instance.id)}
                </IntroCard>;
            } else {
                return null;
            }
        });
    }

    toggleLinkCard(i) {
        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));

        introLinks[i].enabled = !introLinks[i].enabled;

        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
            JSON.stringify(introLinks) !== JSON.stringify(this.introLinksOriginal);

        this.setState({ introLinks, hasUnsavedChanges });
    }

    getLinkCards() {
        return this.state.introLinks.map((item, i) => {
            if (!item.enabled && !this.state.edit) {
                return null;
            } else {
                return <IntroCard
                    key={'link' + i}
                    image={item.image}
                    title={item.name}
                    action={{ link: item.link, text: item.linkName }}
                    t={this.props.t}
                    socket={this.props.socket}
                    color={item.color}
                    edit={this.state.edit}
                    interval={item.interval}
                    camera={item.camera}
                    addTs={item.addTs}

                    onEdit={() => this.setState({
                        editLink: true,
                        editLinkIndex: i,
                        link: JSON.parse(JSON.stringify(this.state.introLinks[i]))
                    })}

                    onRemove={() => {
                        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                        introLinks.splice(i, 1);
                        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== JSON.stringify(this.introLinksOriginal);
                        this.setState({ introLinks, hasUnsavedChanges });
                    }}

                    enabled={item.enabled}
                    toggleActivation={() => this.toggleLinkCard(i)}
                >
                    { item.desc || ''}
                </IntroCard>;
            }
        });
    }

    editLinkCard() {
        if (this.state.editLink) {
            return <EditIntroLinkDialog
                open={this.state.editLink}
                link={this.state.link}
                socket={this.props.socket}
                isNew={this.state.editLinkIndex === -1}
                t={this.props.t}
                lang={this.props.lang}
                onClose={link => {
                    if (link) {
                        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));
                        if (this.state.editLinkIndex === -1) {
                            link.enabled = true;
                            introLinks.push(link);
                        } else {
                            link.enabled = introLinks[this.state.editLinkIndex].enabled;
                            introLinks[this.state.editLinkIndex] = link;
                        }
                        const hasUnsavedChanges = JSON.stringify(this.state.deactivated) !== JSON.stringify(this.deactivatedOriginal) ||
                            JSON.stringify(introLinks) !== JSON.stringify(this.introLinksOriginal);

                        this.setState({ introLinks, editLink: false, hasUnsavedChanges, link: null });
                    } else {
                        this.setState({ editLink: false });
                    }
                }} />;
        } else {
            return null;
        }
    }

    getButtons(classes) {
        const buttons = [];

        if (this.state.edit) {
            buttons.push(<Fab
                key="add"
                color="primary"
                className={`${classes.button} ${classes.addButton}`}
                onClick={() =>
                    this.setState({
                        editLink: true,
                        editLinkIndex: -1,
                        link: {}
                    })}
            >
                <AddIcon />
            </Fab>);

            buttons.push(<Fab
                key="save"
                color="primary"
                disabled={!this.state.hasUnsavedChanges}
                className={`${classes.button} ${classes.saveButton}`}
                onClick={() => this.saveCards()}
            >
                <CheckIcon />
            </Fab>);

            buttons.push(<Fab
                key="close"
                color="primary"
                className={`${classes.button} ${classes.closeButton}`}
                onClick={() => this.deactivateEditMode()}
            >
                <CloseIcon />
            </Fab>);
        } else {
            buttons.push(<Fab
                color="primary"
                key="edit"
                className={classes.button}
                onClick={() => this.activateEditMode()}
            >
                <CreateIcon />
            </Fab>);
        }

        return buttons;
    }

    saveCards() {
        return this.props.socket.getSystemConfig(true)
            .then(systemConfig => {
                let changed = false;

                if (JSON.stringify(systemConfig.common.intro) !== JSON.stringify(this.state.deactivated)) {
                    systemConfig.common.intro = this.state.deactivated;
                    changed = true;
                }

                if (!changed && JSON.stringify(systemConfig.native.introLinks) !== JSON.stringify(this.state.introLinks)) {
                    changed = true;
                    systemConfig.native.introLinks = this.state.introLinks;
                }

                if (changed) {
                    this.props.socket.setSystemConfig(systemConfig)
                        .then(() => this.props.showAlert('Updated', 'success'))
                        .catch(error => {
                            console.log(error);
                            this.props.showAlert(error, 'error');
                        })
                        .then(() => this.setState({ edit: false }));
                } else {
                    this.setState({ edit: false });
                }
            });
    }

    getHostData(hostId, isAlive) {
        return new Promise((resolve, reject) => {
            if (isAlive !== undefined) {
                return resolve({ val: isAlive });
            } else {
                return this.props.socket.getState(hostId + '.alive')
                    .then(state => resolve(state))
                    .catch(e => reject(e));
            }
        })
            .then(alive => {
                if (alive && alive.val) {
                    return this.props.socket.getHostInfo(hostId, false, 10000);
                } else {
                    return { alive: false };
                }
            })
            .catch(error => {
                console.error(error);
                return error;
            })
            .then(data => {
                if (data && typeof data === 'object' && data.alive !== false) {
                    data.alive = true;
                }

                return this.props.socket.getForeignStates(`${hostId}.versions.*`)
                    .then(states => {
                        Object.keys(states).forEach(id =>
                            data['_' + id.split('.').pop()] = states[id].val);
                        return data;
                    });
            })
            .then(data =>
                ({ id: hostId, data }));
    }

    getHostsData(hosts) {
        const promises = hosts.map(obj => this.getHostData(obj._id));

        return Promise.all(promises)
            .then(results => {
                const hostsData = {};
                const alive = {};
                results.forEach(res => {
                    hostsData[res.id] = res.data;
                    alive[res.id] = res.data.alive;
                });
                return { hostsData, alive };
            });
    }

    applyReverseProxy(webReverseProxyPath, instances, instance) {
        webReverseProxyPath && webReverseProxyPath.paths.forEach(item => {
            if (item.instance === instance.id) {
                instance.link = item.path;
            } else if (item.instance.startsWith('web.')) {
                // if this is a web instance, check if it is the same as the current instance
                const _obj = instances.find(o => o._id === `system.adapter.${item.instance}`);
                if (_obj?.native?.port && (instance.link || instance.url).includes(':' + _obj.native.port)) {
                    // replace
                    const regExp = new RegExp(`^.*:${_obj.native.port}/`);
                    if (instance.link) {
                        instance.link = instance.link.replace(regExp, item.path);
                    } else if (instance.url) {
                        instance.url = instance.url.replace(regExp, item.path);
                    }
                    console.log(instance.link || instance.url);
                }
            }
        });
    }

    addLinks(link, common, instanceId, instance, objects, hosts, instances, introInstances) {
        const _urls = Utils.replaceLink(link, common.name, instanceId, {
            objects,
            hostname:      this.props.hostname,
            protocol:      this.props.protocol,
            port:          this.props.port,
            adminInstance: this.props.adminInstance,
            hosts,
        }) || [];

        let webReverseProxyPath;
        if (this.state.reverseProxy && this.state.reverseProxy.length) {
            webReverseProxyPath = this.state.reverseProxy.find(item => item.globalPath === this.currentProxyPath);
        }
        if (_urls.length === 1) {
            instance.link = _urls[0].url;
            instance.port = _urls[0].port;

            this.applyReverseProxy(webReverseProxyPath, instances, instance);

            // if link already exists => ignore
            const lll = introInstances.find(item => item.link === instance.link);
            if (!lll) {
                introInstances.push(instance);
            } else {
                console.log(`Double links: "${instance.id}" and "${lll.id}"`);
            }
        } else if (_urls.length > 1) {
            _urls.forEach(url => {
                const lll = introInstances.find(item => item.link === url.url);
                this.applyReverseProxy(webReverseProxyPath, instances, url);

                if (!lll) {
                    introInstances.push({...instance, link: url.url, port: url.port});
                } else {
                    console.log(`Double links: "${instance.id}" and "${lll.id}"`);
                }
            });
        }
    }

    getInstances(update, hosts, systemConfig) {
        hosts = hosts || this.state.hosts;

        return this.props.socket.getAdapterInstances('', update)
            .then(instances => {
                let deactivated = systemConfig.common.intro || [];
                if (!Array.isArray(deactivated)) {
                    deactivated = Object.keys(deactivated);
                    deactivated.sort();
                }
                const introInstances = [];
                const objects = {};
                instances.forEach(obj => objects[obj._id] = obj);

                instances.sort((a, b) => {
                    a = a && a.common;
                    b = b && b.common;
                    a = a || {};
                    b = b || {};

                    if (a.order === undefined && b.order === undefined) {
                        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                        return 0;
                    } else if (a.order === undefined) {
                        return -1;
                    } else if (b.order === undefined) {
                        return 1;
                    } else {
                        if (a.order > b.order) return 1;
                        if (a.order < b.order) return -1;
                        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                        return 0;
                    }
                });

                instances.forEach(obj => {
                    if (!obj) {
                        return;
                    }
                    const common     = obj.common || null;
                    const objId      = obj._id.split('.');
                    const instanceId = objId.pop();

                    if (common.name && common.name === 'admin' && common.localLink === (this.props.hostname || '')) {
                        return;
                    } else if (common.name && common.name === 'web') {
                        return;
                    } else if (common.name && common.name !== 'vis-web-admin' && common.name.match(/^vis-/)) {
                        return;
                    } else if (common.name && common.name.match(/^icons-/)) {
                        return;
                    } else if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {
                        let links = common.localLinks || common.localLink || '';
                        if (typeof links === 'string') {
                            links = { _default: links };
                        }

                        Object.keys(links).forEach(linkName => {
                            let link = links[linkName];
                            const instance = {};
                            if (typeof link === 'string') {
                                link = { link };
                            }

                            instance.id          = obj._id.replace('system.adapter.', '') + (linkName === '_default' ? '' : ' ' + linkName);
                            instance.name        = (common.titleLang ? common.titleLang[this.props.lang] || common.titleLang.en : common.title) + (linkName === '_default' ? '' : ' ' + linkName);
                            instance.color       = link.color || '';
                            instance.description = common.desc && typeof common.desc === 'object' ? (common.desc[this.props.lang] || common.desc.en) : common.desc || '';
                            instance.image       = common.icon ? `adapter/${common.name}/${common.icon}` : 'img/no-image.png';

                            /*let protocol = this.props.protocol;
                            let port     = this.props.port;
                            let hostname = Intro.getHostname(obj, objects, hosts, this.props.hostname, this.adminInstance);

                            if (!hostname) {
                                return;
                            }*/
                            this.addLinks(link.link, common, instanceId, instance, objects, hosts, instances, introInstances);
                        });
                    }
                    if (common && (common.enabled || common.onlyWWW) && common.name !== 'admin' && (common.welcomeScreen || common.welcomeScreenPro)) {
                        let links = [];
                        common.welcomeScreen && links.push(common.welcomeScreen);
                        common.welcomeScreenPro && links.push(common.welcomeScreenPro);

                        links.forEach(link => {
                            const instance = {};
                            instance.id          = obj._id.replace('system.adapter.', '') + '/' + link.link;
                            instance.name        = link.name && typeof link.name === 'object' ? (link.name[this.props.lang] || link.name.en) : link.name || '';
                            instance.color       = link.color || '';
                            instance.description = common.desc && typeof common.desc === 'object' ? (common.desc[this.props.lang] || common.desc.en) : common.desc || '';
                            instance.image       = common.icon ? `adapter/${common.name}/${common.icon}` : 'img/no-image.png';
                            instance.order       = link.order;

                            this.addLinks(`%web_protocol%://%web_bind%:%web_port%/${link.link}`, common, instanceId, instance, objects, hosts, instances, introInstances);
                        });
                    }
                });

                introInstances.forEach(instance => {
                    if (instance.link) {
                        instance.linkName = instance.link.replace('https://', '').replace('http://', '').replace(/^[^_]+:/, '');
                    }
                });

                introInstances.sort((a, b) => {
                    if (a.order !== undefined || b.order !== undefined) {
                        a.order = a.order === undefined ? 1000 : a.order;
                        b.order = b.order === undefined ? 1000 : b.order;
                        if (a.order < b.order) {
                            return -1;
                        } else if (a.order > b.order) {
                            return 1;
                        }
                    }

                    if (a.id > b.id) {
                        return 1;
                    }
                    if (a.id < b.id) {
                        return -1;
                    }
                    return 0;
                })

                Object.keys(hosts).forEach(key => {
                    const obj = hosts[key];
                    const common = obj && obj.common;

                    if (common) {
                        const instance    = {};
                        instance.id       = obj._id;
                        instance.name     = common.name && typeof common.name === 'object' ? (common.name[this.props.lang] || common.name.en) : (common.name || '');
                        instance.color    = '';
                        instance.image    = common.icon || 'img/no-image.png';
                        instance.info     = this.t('Info');
                        instance.linkName = '';

                        introInstances.push(instance);
                    }
                });

                const _deactivated = [];
                deactivated.forEach(id => {
                    if (introInstances.find(instance => id === `${instance.id}_${instance.linkName}`)) {
                        _deactivated.push(id);
                    }
                });
                deactivated = _deactivated;

                return { instances: introInstances, deactivated };
            })
            .catch(error => {
                console.log(error);
                return { instances: [],  deactivated: [] };
            });
    }

    getHostDescription(id) {
        const { classes } = this.props;
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        if (hostData && hostData.alive === false) {
            return <div className={this.props.classes.hostOffline}>{this.props.t('Offline')}</div>;
        }

        let nodeUpdate = '';
        let npmUpdate = '';
        if (hostData) {
            try {
                if (hostData['_nodeNewest'] && hostData['Node.js'] && semver.gt(hostData['_nodeNewest'], hostData['Node.js'].replace(/^v/, ''))) {
                    nodeUpdate = hostData['_nodeNewest'];
                }
            } catch (e) {
                // ignore
            }
            try {
                if (hostData['_nodeNewest'] !== hostData['_nodeNewestNext'] &&
                    hostData['_nodeNewestNext'] &&
                    hostData['Node.js'] &&
                    hostData['_nodeNewest'] &&
                    semver.gt(hostData['_nodeNewestNext'], hostData['Node.js'].replace(/^v/, '')) &&
                    semver.gt(hostData['_nodeNewestNext'], hostData['_nodeNewest'])
                ) {
                    nodeUpdate += (nodeUpdate ? ' / ' : '') + hostData['_nodeNewestNext'];
                }
            } catch (e) {
                // ignore
            }
            if (nodeUpdate) {
                nodeUpdate = <Tooltip title={this.props.t('Some updates available')}><span className={this.props.classes.nodeUpdate}>({nodeUpdate})</span></Tooltip>;
            }

            try {
                if (hostData['_npmNewest'] && hostData['NPM'] && semver.gt(hostData['_npmNewest'], hostData['NPM'])) {
                    npmUpdate = hostData['_npmNewest'];
                }
            } catch (e) {
                // ignore
            }
            try {
                if (hostData['_npmNewest'] !== hostData['_npmNewestNext'] &&
                    hostData['_npmNewestNext'] &&
                    hostData['NPM'] &&
                    hostData['_npmNewest'] &&
                    semver.gt(hostData['_npmNewestNext'], hostData['NPM']) &&
                    semver.gt(hostData['_npmNewestNext'], hostData['_npmNewest'])
                ) {
                    npmUpdate += (npmUpdate ? ' / ' : '') + hostData['_npmNewestNext'];
                }
            } catch (e) {
                // ignore
            }
            if (npmUpdate) {
                npmUpdate = <Tooltip title={this.props.t('Some updates available')}><span className={this.props.classes.nodeUpdate}>({npmUpdate})</span></Tooltip>;
            }
        }

        return hostData && typeof hostData === 'object' ?
                <ul style={{ textTransform: 'none'}}>
                    <li>
                        <span>
                            <span className={classes.bold}>{this.t('Platform')}: </span>
                            {hostData['Platform'] || '--'}
                        </span>
                    </li>
                    <li>
                        <span>
                            <span className={classes.bold}>{this.t('RAM')}: </span>
                            {formatInfo['RAM'](hostData['RAM'])}
                        </span>
                    </li>
                    <li>
                        <span>
                            <span className={classes.bold}>{this.t('Node.js')}: </span>
                            <span className={UtilsCommon.clsx(nodeUpdate ? this.props.classes.updateExists : this.props.classes.updateNo)}>{hostData['Node.js'] || '--'}</span>
                            {nodeUpdate}
                        </span>
                    </li>
                    <li>
                        <span>
                            <span className={classes.bold}>{this.t('NPM')}: </span>
                            <span className={UtilsCommon.clsx(npmUpdate ? this.props.classes.updateExists : this.props.classes.updateNo)}>{hostData['NPM'] || '--'}</span>
                            {npmUpdate}
                        </span>
                    </li>
                </ul>
            :
                <ul>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                </ul>;
    }

    getHostDescriptionAll(id) {
        const { classes } = this.props;
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        return [
            <ul style={{ textTransform: 'none'}}>
                {hostData && typeof hostData === 'object' && Object.keys(hostData)
                    .filter(id => !id.startsWith('_'))
                    .map(value => <li key={value}>
                        {hostData && typeof hostData === 'object' ?
                            <span>
                                <span className={classes.bold}>{this.t(value)}: </span>
                                {(formatInfo[value] ? formatInfo[value](hostData[value], this.t) : hostData[value] || '--')}
                            </span>
                            :
                            <Skeleton />
                        }
                    </li>)
                }
            </ul>,
            hostData && typeof hostData === 'object' && Object.keys(hostData).reduce((acom, item) => acom + `${this.t(item)}:${(formatInfo[item] ? formatInfo[item](hostData[item], this.t) : hostData[item] || '--')}\n`)
        ];
    }

    getDataDelayed = () => {
        this.getDataTimeout && clearTimeout(this.getDataTimeout);
        this.getDataTimeout = setTimeout(() => {
            this.getDataTimeout = null;
            this.getData(true);
        }, 300);
    }

    getData(update) {
        let hosts;
        let systemConfig;

        return this.props.socket.getSystemConfig(update)
            .then(_systemConfig => {
                systemConfig = _systemConfig;
                return this.props.socket.getCompactHosts(update);
            })
            .then(_hosts => {
                hosts = _hosts;
                return this.getInstances(update, hosts, systemConfig);
            })
            .then(data => {
                this.setState({
                    instances: data.instances,
                    hosts,
                    deactivated: data.deactivated,
                    introLinks: systemConfig && systemConfig.native && systemConfig.native.introLinks ? systemConfig.native.introLinks : []
                });
                // hosts data could last a long time, so show some results to user now and then get the info about hosts
                return this.getHostsData(hosts);
            })
            .then(newState =>
                new Promise(resolve =>
                    this.setState(newState, () =>
                        resolve())))
            .catch(error => window.alert(`Cannot get data: ${error}`));
    }

    render() {
        if (!this.state.instances) {
            return <LinearProgress />;
        }

        const { classes } = this.props;

        return <TabContainer
            elevation={0}
            overflow="visible"
        >
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={this.state.openSnackBar}
                autoHideDuration={3000}
                onClose={() => this.setState({ openSnackBar: false })}
                message={this.t('copied')}
            />
            <TabContent classes={{ root: classes.container }}>
                <Grid container spacing={2}>
                    {this.getInstancesCards()}
                    {this.getLinkCards()}
                </Grid>
                {this.getButtons(classes)}
                {this.editLinkCard()}
            </TabContent>
        </TabContainer>;
    }
}

Intro.propTypes = {
    /**
     * Link and text
     * {link: 'https://example.com', text: 'example.com'}
     */
    action: PropTypes.object,
    children: PropTypes.node,
    color: PropTypes.string,
    edit: PropTypes.bool,
    enabled: PropTypes.bool,
    socket: PropTypes.object,
    image: PropTypes.string,
    reveal: PropTypes.node,
    title: PropTypes.string,
    t: PropTypes.func,
    lang: PropTypes.string,
    toggleActivation: PropTypes.func,
    instancesWorker: PropTypes.object,
    hostsWorker: PropTypes.object,

    hostname: PropTypes.string,
    protocol: PropTypes.string,
    port: PropTypes.number,
    adminInstance: PropTypes.string,
};

export default withStyles(styles)(Intro);