import { Component } from 'react';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import { Fab, Snackbar } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { LinearProgress } from '@material-ui/core';

import { Skeleton } from '@material-ui/lab';

import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import CreateIcon from '@material-ui/icons/Create';

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
    }
});

const formatInfo = {
    'Uptime': Utils.formatSeconds,
    'System uptime': Utils.formatSeconds,
    'RAM': Utils.formatRam,
    'Speed': Utils.formatSpeed,
    'Disk size': Utils.formatBytes,
    'Disk free': Utils.formatBytes
};

class Intro extends Component {

    constructor(props) {

        super(props);

        this.state = {
            instances: null,
            edit: false,

            introLinks: [],
            editLink: false,
            editLinkIndex: -1,
            openSnackBar: false,
            hasUnsavedChanges: false,
        };

        this.promises = {};

        this.introLinksOriginal = null;
        this.instancesOriginal = null;

        this.t = props.t;

        this.getData();
    }

    activateEditMode() {
        let systemConfig;
        this.props.socket.getSystemConfig(true)
            .then(_systemConfig => {
                systemConfig = _systemConfig;
                return this.getInstances(true, null, systemConfig);
            })
            .then(instances => {
                const introLinks = systemConfig && systemConfig.native && systemConfig.native.introLinks ? systemConfig.native.introLinks : [];

                this.introLinksOriginal = JSON.parse(JSON.stringify(introLinks));
                this.instancesOriginal = JSON.parse(JSON.stringify(instances));

                this.setState({
                    instances,
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
            instances: this.instancesOriginal,
            introLinks: this.introLinksOriginal,
            hasUnsavedChanges: false,
            edit: false
        }, () => {
            this.instancesOriginal = null;
            this.introLinksOriginal = null;
        });
    }

    toggleCard(id) {
        if (!this.state.instances || !this.state.instances.length) {
            return;
        }

        const instances = JSON.parse(JSON.stringify(this.state.instances));

        const instance = instances.find(instance => instance.id === id);

        if (instance) {
            instance.enabled = !instance.enabled;

            const hasUnsavedChanges = JSON.stringify(instances) !== JSON.stringify(this.instancesOriginal) ||
                JSON.stringify(this.state.introLinks) !== JSON.stringify(this.introLinksOriginal);

            this.setState({ instances, hasUnsavedChanges });
        }
    }

    getInstancesCards() {
        return this.state.instances.map(instance => {

            if (instance.enabled || this.state.edit) {

                let linkText = instance.link ? instance.link.replace(/^https?:\/\//, '') : '';
                const pos = linkText.indexOf('/');
                if (pos !== -1) {
                    linkText = linkText.substring(0, pos);
                }

                const hostData = this.state.hostsData ? this.state.hostsData[instance.id] : null;
                return (
                    <IntroCard
                        key={instance.id}
                        socket={this.props.socket}
                        image={instance.image}
                        title={instance.name}
                        action={{ link: instance.link, text: linkText }}
                        t={this.props.t}
                        color={instance.color}
                        reveal={instance.info}
                        edit={this.state.edit}
                        enabled={instance.enabled}
                        disabled={!Boolean(hostData && typeof hostData === 'object')}
                        getHostDescriptionAll={() => this.getHostDescriptionAll(instance.id)}
                        toggleActivation={() => this.toggleCard(instance.id)}
                        openSnackBarFunc={() => this.setState({ openSnackBar: true })}
                    >
                        { instance.description || this.getHostDescription(instance.id)}
                    </IntroCard>
                );
            } else {
                return null;
            }
        });
    }

    toggleLinkCard(i) {
        const introLinks = JSON.parse(JSON.stringify(this.state.introLinks));

        introLinks[i].enabled = !introLinks[i].enabled;

        const hasUnsavedChanges = JSON.stringify(this.state.instances) !== JSON.stringify(this.instancesOriginal) ||
            JSON.stringify(introLinks) !== JSON.stringify(this.introLinksOriginal);

        this.setState({ introLinks, hasUnsavedChanges });
    }

    getLinkCards() {
        return this.state.introLinks.map((item, i) => {
            if (!item.enabled && !this.state.edit) {
                return null;
            } else {
                return (
                    <IntroCard
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
                            const hasUnsavedChanges = JSON.stringify(this.state.instances) !== JSON.stringify(this.instancesOriginal) ||
                                JSON.stringify(introLinks) !== JSON.stringify(this.introLinksOriginal);
                            this.setState({ introLinks, hasUnsavedChanges });
                        }}

                        enabled={item.enabled}
                        toggleActivation={() => this.toggleLinkCard(i)}
                    >
                        { item.desc || ''}
                    </IntroCard>
                );
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
                        const hasUnsavedChanges = JSON.stringify(this.state.instances) !== JSON.stringify(this.instancesOriginal) ||
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
            buttons.push(
                <Fab
                    key="add"
                    color="primary"
                    className={classes.button + ' ' + classes.addButton}
                    onClick={() =>
                        this.setState({
                            editLink: true,
                            editLinkIndex: -1,
                            link: {}
                        })}
                >
                    <AddIcon />
                </Fab>
            );
            buttons.push(
                <Fab
                    key="save"
                    color="primary"
                    disabled={!this.state.hasUnsavedChanges}
                    className={classes.button + ' ' + classes.saveButton}
                    onClick={() => this.saveCards()}
                >
                    <CheckIcon />
                </Fab>
            );

            buttons.push(
                <Fab
                    key="close"
                    color="primary"
                    className={classes.button + ' ' + classes.closeButton}
                    onClick={() => this.deactivateEditMode()}
                >
                    <CloseIcon />
                </Fab>
            )
        } else {
            buttons.push(
                <Fab
                    color="primary"
                    key="edit"
                    className={classes.button}
                    onClick={() => this.activateEditMode()}
                >
                    <CreateIcon />
                </Fab>
            );
        }

        return buttons;
    }

    saveCards() {
        return this.props.socket.getSystemConfig(true)
            .then(systemConfig => {
                let changed = false;

                systemConfig.common.intro = systemConfig.common.intro || {};

                this.state.instances.forEach(instance => {
                    if (systemConfig.common.intro.hasOwnProperty(instance.id) || !instance.enabled) {
                        if (systemConfig.common.intro[instance.id] !== instance.enabled) {
                            if (instance.enabled) {
                                delete systemConfig.common.intro[instance.id];
                            } else {
                                systemConfig.common.intro[instance.id] = false;
                            }

                            changed = true;
                        }
                    }
                });

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

    getHostsData(hosts) {
        const promises = hosts.map(obj =>
            this.props.socket.getHostInfo(obj._id)
                .catch(error => {
                    console.error(error);
                    return error;
                })
                .then(data =>
                    ({ id: obj._id, data })));

        return new Promise(resolve =>
            Promise.all(promises)
                .then(results => {
                    const hostsData = {};
                    results.forEach(res => hostsData[res.id] = res.data);
                    resolve(hostsData);
                }));
    }

    getHosts(update) {
        if (update) {
            this.promises.hosts = null;
        }

        this.promises.hosts = this.promises.hosts || this.props.socket.getHosts(update);

        return this.promises.hosts;
    }

    getInstances(update, hosts, systemConfig) {
        hosts = hosts || this.state.hosts;

        return this.props.socket.getAdapterInstances('', update)
            .then(instances => {
                const deactivated = systemConfig.common.intro || {};
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

                Object.keys(instances).forEach(key => {
                    const obj = instances[key];
                    const common = (obj) ? obj.common : null;
                    const objId = obj._id.split('.');
                    const instanceId = objId[objId.length - 1];

                    if (common.name && common.name === 'admin' && common.localLink === (this.props.hostname || '')) {
                        return;
                    } else if (common.name && common.name === 'web') {
                        return;
                    } else if (common.name && common.name !== 'vis-web-admin' && common.name.match(/^vis-/)) {
                        return;
                    } else if (common.name && common.name.match(/^icons-/)) {
                        return;
                    } else if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {
                        const ws = common.welcomeScreen ? common.welcomeScreen : null;
                        let links = /*(ws && ws.link) ? ws.link :*/ common.localLinks || common.localLink || '';
                        if (typeof links === 'string') {
                            links = { _default: links };
                        }

                        Object.keys(links).forEach(linkName => {
                            const link = links[linkName];
                            const instance = {};

                            instance.id = obj._id.replace('system.adapter.', '') + (linkName === '_default' ? '' : ' ' + linkName);
                            instance.name = (/*(ws && ws.name) ? ws.name :*/ common.titleLang ? common.titleLang[this.props.lang] : common.title) + (linkName === '_default' ? '' : ' ' + linkName);
                            instance.color = ws && ws.color ? ws.color : '';
                            instance.description = common.desc && typeof common.desc === 'object' ? (common.desc[this.props.lang] || common.desc.en) : common.desc || '';
                            instance.image = common.icon ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
                            instance.link = Utils.replaceLink(link, common.name, instanceId, {
                                objects,
                                hostname: this.props.hostname,
                                protocol: this.props.protocol
                            }) || '';

                            instance.enabled = deactivated.hasOwnProperty(instance.id) ? !!deactivated[instance.id] : true;

                            introInstances.push(instance);
                        });
                    }
                });

                /*var urlText = url.replace(/^https?:\/\//, '');
                var pos = urlText.indexOf('/');
                if (pos !== -1) {
                    urlText = urlText.substring(0, pos);
                }
                if (adapter === 'admin' && urlText === location.host) return null;
                if (adapter === 'web') return null;
                if (adapter !== 'vis-web-admin' && adapter.match(/^vis-/)) return null; // no widgets
                if (adapter.match(/^icons-/)) return null; // no icons
            */

                Object.keys(hosts).forEach(key => {
                    const obj = hosts[key];
                    const common = obj && obj.common;

                    if (common) {
                        const instance = {};

                        instance.id = obj._id;
                        instance.name = common.name;
                        instance.color = '';
                        instance.image = common.icon || 'img/no-image.png';
                        instance.enabled = deactivated.hasOwnProperty(instance.id) ? !!deactivated[instance.id] : true;
                        instance.info = this.t('Info');
                        introInstances.push(instance);
                    }
                });

                return introInstances;
            })
            .catch(error =>
                console.log(error));
    }

    getHostDescription(id) {

        const { classes } = this.props;
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        return (
            <ul>
                {
                    ['Platform', 'RAM', 'Node.js', 'NPM'].map(value => {
                        return (
                            <li key={value}>
                                { hostData && typeof hostData === 'object' ?
                                    <span>
                                        <span className={classes.bold}>{this.t(value)}: </span>
                                        {(formatInfo[value] ? formatInfo[value](hostData[value]) : hostData[value] || '--')}
                                    </span>
                                    :
                                    <Skeleton />
                                }
                            </li>
                        )
                    })
                }
            </ul>
        );
    }

    getHostDescriptionAll(id) {
        const { classes } = this.props;
        const hostData = this.state.hostsData ? this.state.hostsData[id] : null;

        return [
            <ul>
                {
                    hostData && typeof hostData === 'object' && Object.keys(hostData).map(value => <li key={value}>
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

    getData(update) {
        let hosts;
        let systemConfig;

        return this.props.socket.getSystemConfig(update)
            .then(_systemConfig => {
                systemConfig = _systemConfig;
                return this.getHosts(update);
            })
            .then(_hosts => {
                hosts = _hosts;
                return this.getInstances(update, hosts, systemConfig);
            })
            .then(instances => {
                this.setState({
                    instances,
                    hosts,
                    introLinks: systemConfig && systemConfig.native && systemConfig.native.introLinks ? systemConfig.native.introLinks : []
                });
                // hosts data could last a long time, so show some results to user now and then get the info about hosts
                return this.getHostsData(hosts);
            })
            .then(hostsData =>
                this.setState({ hostsData }));
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
};

export default withStyles(styles)(Intro);