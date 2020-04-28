import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';

import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';

import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import CreateIcon from '@material-ui/icons/Create';

import IntroCard from '../components/IntroCard';

import Utils from '../Utils';

const styles = theme => ({
    button: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    save: {
        backgroundColor: theme.palette.success.main,
        right: theme.spacing(10),
        '&:hover': {
            backgroundColor: theme.palette.success.dark
        }
    },
    close: {
        backgroundColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark
        }
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

class Intro extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            instances: Intro.getInstances(props),
            edit: false
        };

        this.t = props.t;
    }

    static getDerivedStateFromProps(props) {

        const derived = {};

        if (props.instances) derived.instances = Intro.getInstances(props);

        return derived;
    }

    activateEditMode() {
        this.setState({
            edit: true
        });
    }

    deactivateEditMode() {

        const instances = this.state.instances.slice();

        for (const index in instances) {
            instances[index].editActive = instances[index].active;
        }

        this.setState({
            instances: instances,
            edit: false
        });
    }

    toggleCard(id) {

        const instances = this.state.instances.slice();

        if (!instances) return;

        for (const index in instances) {
            if (instances[index].id === id) {
                instances[index].editActive = !instances[index].editActive;
                break;
            }
        }

        this.setState({
            instances: instances
        });
    }

    saveCards() {
        const instances = this.state.instances.slice();

        for (const index in instances) {
            instances[index].active = instances[index].editActive;
        }

        this.setState({
            instances: instances,
            edit: false
        });

        this.props.updateIntro(instances);
    }

    getCards() {

        const cards = this.state.instances.map((instance, index) => {

            if ((!this.state.edit && instance.active) || this.state.edit) {

                let linkText = instance.link ? instance.link.replace(/^https?:\/\//, '') : '';
                const pos = linkText.indexOf('/');
                if (pos !== -1) {
                    linkText = linkText.substring(0, pos);
                }

                return (
                    <IntroCard
                        key={ index }
                        image={ instance.image }
                        title={ instance.name }
                        action={{ link: instance.link, text: linkText }}
                        t={ this.props.t }
                        color={ instance.color }
                        reveal={ instance.info }
                        edit={ this.state.edit }
                        enabled={ this.state.edit ? instance.editActive : instance.active }
                        toggleActivation={ () => this.toggleCard(instance.id) }
                    >
                        { instance.description }
                    </IntroCard>
                );
            } else {
                return null;
            }
        });

        return cards;
    }

    getButtons(classes) {

        const buttons = [];

        if (this.state.edit) {
            buttons.push(
                <Fab
                    key="save"
                    color="primary"
                    className={ classes.button + ' ' + classes.save }
                    onClick={ () => this.saveCards() }
                >
                    <CheckIcon />
                </Fab>
            );

            buttons.push(
                <Fab
                    key="close"
                    color="primary"
                    className={ classes.button + ' ' + classes.close }
                    onClick={ () => this.deactivateEditMode() }
                >
                    <CloseIcon />
                </Fab>
            )
        } else {
            buttons.push(
                <Fab
                    color="primary"
                    key="edit"
                    className={ classes.button}
                    onClick={ () => this.activateEditMode() }
                >
                    <CreateIcon />
                </Fab>
            );
        }

        return buttons;
    }

    static getInstances(props) {

        const deactivated = (props.systemConfig) ? props.systemConfig.common.intro || {} : {};
        const instances = props.instances ? props.instances.slice() : [];
        const introInstances = [];
        const t = props.t;

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

            if (common.name && common.name === 'admin' && common.localLink === (props.hostname || '')) {
                return;
            } else if (common.name && common.name === 'web') {
                return;
            } else if (common.name && common.name !== 'vis-web-admin' && common.name.match(/^vis-/)) {
                return;
            } else if (common.name && common.name.match(/^icons-/)) {
                return;
            } else if (common && (common.enabled || common.onlyWWW) && (common.localLinks || common.localLink)) {

                const instance = {};
                const ws = (common.welcomeScreen) ? common.welcomeScreen : null;
                
                instance.id = obj._id.replace('system.adapter.', '');
                instance.name = /*(ws && ws.name) ? ws.name :*/ (common.titleLang) ? common.titleLang[window.systemLang] : common.title;
                instance.color = (ws && ws.color) ? ws.color : '';
                instance.description = common.desc[window.systemLang];
                instance.image = (common.icon) ? 'adapter/' + common.name + '/' + common.icon : 'img/no-image.png';
                const link  = /*(ws && ws.link) ? ws.link :*/ common.localLinks || common.localLink || '';
                instance.link = props.replaceLink(link, common.name, instanceId) || '';
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;

                introInstances.push(instance);
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

        const hosts = props.hosts || [];

        Object.keys(hosts).forEach(key => {
            const obj = hosts[key];
            const common = (obj) ? obj.common : null;

            if (common) {
                const instance = {};

                const hostData = props.hostData[obj._id];

                instance.id = obj._id;
                instance.name = common.name;
                instance.color = '';
                instance.description = (
                    <ul>
                        <li>
                            <b>Platform: </b>
                            <span>{ (formatInfo['Platform'] ? formatInfo['Platform'](hostData['Platform']) : hostData['Platform'] || ' --') }</span>
                        </li>
                        <li>
                            <b>RAM: </b>
                            <span>{ (formatInfo['RAM'] ? formatInfo['RAM'](hostData['RAM']) : hostData['RAM'] || ' --') }</span>
                        </li>
                        <li>
                            <b>Node.js: </b>
                            <span>{ (formatInfo['Node.js'] ? formatInfo['Node.js'](hostData['Node.js']) : hostData['Node.js'] || ' --') }</span>
                        </li>
                        <li>
                            <b>NPM: </b>
                            <span>{ (formatInfo['NPM'] ? formatInfo['NPM'](hostData['NPM']) : hostData['NPM'] || ' --') }</span>
                        </li>
                    </ul>);
                instance.image = (common.icon) ? common.icon : 'img/no-image.png';
                instance.active = (deactivated.hasOwnProperty(instance.id)) ? deactivated[instance.id] : true;
                instance.editActive = instance.active;
                instance.info = t('Info');
                introInstances.push(instance);
            }
        });

        return introInstances;
    }

    render() {
        if (!this.props.ready) {
            return (
                <LinearProgress />
            );
        }

        const { classes } = this.props;

        return (
            <div>
                <Grid
                    container
                    spacing={ 2 }
                >
                    { this.getCards() }
                </Grid>
                { this.getButtons(classes) }
            </div>
        );
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
    image: PropTypes.string,
    reveal: PropTypes.node,
    title: PropTypes.string,
    t: PropTypes.func,
    toggleActivation: PropTypes.func,
    instances: PropTypes.array,
    hosts: PropTypes.array
};

export default withStyles(styles)(Intro);