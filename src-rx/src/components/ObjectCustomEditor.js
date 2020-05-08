import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Toolbar from '@material-ui/core/Toolbar';

import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';
import '../assets/materialize.css';

// Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = theme => ({
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    headingIcon: {
        marginRight: 5,
        width: 32,
        height: 32,
    },
    simulateM: {
        '&.m .row': {
            marginBottom: 0,
        },
        '&.m .row .col': {
            textAlign: 'left',
        },
        '&.m input': {
            height: '32px !important',
            color: 'inherit',
        },
        '&.m .input-field': {
            marginTop: 0,
            marginBottom: 10,
        },
        '&.m select': {
            display: 'inline-block',
            fontSize: 16,
            fontFamily: 'sans-serif',
            fontWeight: 700,
            color: theme.palette.text.primary,
            lineHeight: 1.3,
            padding: '.6em 1.4em .5em .8em',
            margin: 0,
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: '1px solid #aaa',
            boxShadow: '0 1px 0 1px rgba(0,0,0,.04)',
            appearance: 'none',
            backgroundColor: theme.palette.background.paper,
            backgroundRepeat: 'no-repeat, repeat',
            backgroundPosition: 'right .7em top 50%, 0 0',
            backgroundSize: '.65em auto, 100%',
        }
    },
    titleEnabled: {
        float: 'right',
        fontSize: 16,
        color: 'green',
        fontWeight: 'bold',
        paddingLeft: 20,
    },
    expansionPanelDetailsTabDiv: {
        width: '100%'
    },
    scrollDiv: {
        width: '100%',
        height: 'calc(100% - ' + theme.mixins.toolbar.minHeight + 'px)',
        overflow: 'auto',
    }
});

const STR_DIFFERENT   = '__different__';

const GLOBAL_PROMISES = {};
const GLOBAL_TEMPLATES = {};
const GLOBAL_PROMISES_ARRAY = [];

// compatibility with admin3
window.defaults = {};
window.systemDictionary = {};
window.customPostInits = {};

function jQ(el) {
    this.el = !el ? [] : (typeof el === 'object' && el.length ? el : [el]);
    this.find = function (query) {
        if (!this.el.length) {
            return jQ([]);
        } else {
            const items = this.el[0].querySelectorAll(query);
            return new jQ(items);
        }

    };
    this.hide = function () {
        for (let i = 0; i < this.el.length; i++) {
            this.el[i].style.display = 'none';
        }
        return this;
    };
    this.show = function () {
        for (let i = 0; i < this.el.length; i++) {
            this.el[i].style.display = 'block';
        }
        return this;
    };
    this.val = function (val) {
        if (val !== undefined) {
            for (let i = 0; i < this.el.length; i++) {
                if (this.el[i].value === 'checkbox') {
                    this.el[i].checked = !!val;
                } else {
                    this.el[i].value = val;
                }
            }
        } else {
            for (let i = 0; i < this.el.length; i++) {
                if (this.el[i]) {
                    if (this.el[i].value === 'checkbox') {
                        return this.el.checked;
                    } else {
                        return this.el.value;
                    }
                }
            }
        }

        return this;
    };
    this.on = function (event, cb) {
        for (let i = 0; i < this.el.length; i++) {
            this.el[i].addEventListener(event, event => {
                cb && cb.call(this.el[i], event);
            });
        }
        return this;
    };

    this.attr = function (attr, val) {
        if (val !== undefined) {
            for (let i = 0; i < this.el.length; i++) {
                this.el[i][attr] = val;
            }
        } else {
            for (let i = 0; i < this.el.length; i++) {
                return this.el[i][attr];
            }
        }
        return this;
    };

    this.prop = function (prop, val) {
        if (val !== undefined) {
            for (let i = 0; i < this.el.length; i++) {
                this.el[i][prop] = !!val;
            }
        } else {
            for (let i = 0; i < this.el.length; i++) {
                return this.el[i][prop];
            }
        }
        return this;
    };

    this.click = function (cb) {
        return this.on('click', cb);
    };

    this.html = function (html) {
        for (let i = 0; i < this.el.length; i++) {
            this.el[i].innerHTML = html;
        }
        return this;
    };

    this.text = function (html) {
        for (let i = 0; i < this.el.length; i++) {
            this.el[i].innerHTML = html;
        }
        return this;
    };

    return this;
}

const URL_PREFIX = 'http://localhost:8081'; // or './'

// simulate jQuery
window.$ = function (el) {
    return new jQ(el);
};

window.$.extend = function (systemDictionary, data) {
    return Object.assign(systemDictionary, data);
};

window.$.get = function (options) {
    let url;
    if (options.url[0] !== '/') {
        url = URL_PREFIX + '/' + options.url;
    } else {
        url = URL_PREFIX + options.url;
    }

    const promise = GLOBAL_PROMISES[options.url] =
        fetch(url)
            .then(data => data.text())
            .then(data => {
                try {
                    options.success(data);
                } catch (e) {

                }
            });

    GLOBAL_PROMISES_ARRAY.push(promise);
};

window.gMain = {
    socket: null,
    objects: null,
    showError: error => console.error(error),
    navigateGetParams: function () {
        const parts = decodeURI(window.location.hash).split('/');
        return parts[2] ? decodeURIComponent(parts[2]) : null;
    }
};

function translateWord(text, lang, dictionary) {
    if (!text) return '';

    text = text.toString();

    if (dictionary[text]) {
        let newText = dictionary[text][lang];
        if (newText) {
            return newText;
        } else if (lang !== 'en') {
            newText = dictionary[text].en;
            if (newText) {
                return newText;
            }
        }
    } else if (typeof text === 'string' && !text.match(/_tooltip$/)) {
        console.log('"' + text + '": {"en": "' + text + '", "de": "' + text + '", "ru": "' + text + '", "pt": "' + text + '", "nl": "' + text + '", "fr": "' + text + '", "es": "' + text + '", "pl": "' + text + '", "it": "' + text + '", "zh-cn": "' + text + '"},');
    } else if (typeof text !== 'string') {
        console.warn('Trying to translate non-text:' + text);
    }
    return text;
}

function installTemplate(el, lang, id, commonConfig, wordDifferent, onChangedBound) {
    const template = el.getElementsByClassName('m')[0];
    const words = template.getElementsByClassName('translate');
    const adapter = id.split('.')[0];

    for (let w = 0; w < words.length; w++) {
        words[w].innerHTML = translateWord(words[w].innerHTML, lang, window.systemDictionary || {});
    }

    const controls = {};
    const inputs = template.getElementsByTagName('input');

    for (let i = 0; i < inputs.length; i++) {
        const field = inputs[i].dataset.field;

        let def = inputs[i].dataset.default;
        if (def !== undefined && (!window.defaults[adapter] || window.defaults[adapter][field] === undefined)) {
            if (def === 'true')  {
                def = true;
            }
            if (def === 'false') {
                def = false;
            }
            if (def !== undefined && def.toString().replace(/\+/, '') === parseFloat(def).toString()) {
                def = parseFloat(def);
            }
            window.defaults[adapter] = window.defaults[adapter] || {};
            window.defaults[adapter][field] = def;
        }

        controls[field] = {
            default: window.defaults[adapter] ? window.defaults[adapter][field] : undefined,
            el:      inputs[i],
            type:    inputs[i].type
        };

        if (controls[field].type === 'checkbox') {
            controls[field].el.parentNode.onclick = function () {
                const input = this.getElementsByTagName('input')[0];

                if (input.indeterminate) {
                    input.indeterminate = false;
                    input.checked = true;
                } else {
                    input.checked = !input.checked;
                }

                const evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', false, true);
                input.dispatchEvent(evt);
            };

            // control opacity of expansion tab
            if (field === 'enabled') {
                controls[field].el.addEventListener('change', function () {
                    const val = this.checked;
                    el.style.opacity = val ? 1 : 0.6;
                    el.getElementsByClassName('titleEnabled')[0].style.display = val ? 'inline-block' : 'none';
                });
            }

            if (commonConfig[id][field] !== undefined) {
                if (commonConfig[id][field] === STR_DIFFERENT) {
                    controls[field].el.indeterminate = true;
                } else {
                    controls[field].el.checked = !!commonConfig[id][field];
                }
            } else if (controls[field].def !== undefined) {
                controls[field].el.checked = !!controls[field].def;
            }
        } else {
            if (commonConfig[id][field] !== undefined) {
                if (commonConfig[id][field] === STR_DIFFERENT) {
                    if (controls[field].el.type === 'number') {
                        controls[field].el.type = 'text';
                    }
                    if (commonConfig[id].tagName.toUpperCase() === 'SELECT'){
                        const opt = document.createElement('option');
                        opt.value = wordDifferent;
                        opt.innerHTML = wordDifferent;
                        controls[field].el.prependChild(opt);
                        controls[field].el.value = wordDifferent;
                    } else {
                        controls[field].el.placeholder = wordDifferent;
                    }
                } else {
                    controls[field].el.value = commonConfig[id][field];
                }
            } else if (controls[field].def !== undefined) {
                controls[field].el.value = controls[field].def;
            }

            if (controls[field].el.tagName.toUpperCase() === 'INPUT' || controls[field].el.type !== 'checkbox') {
                // labels control
                if (true || controls[field].el.value) {
                    const label = controls[field].el.parentNode.getElementsByTagName('label')[0];
                    label && label.classList.add('active');
                }

                /*controls[field].el.addEventListener('keyup', function () {
                    const label = this.parentNode.getElementsByTagName('label')[0];
                    if (!label) {
                        return;
                    }
                    if (this.value) {
                        label.classList.add('active');
                    } else {
                        label.classList.remove('active');
                    }
                });*/
            }
        }

        if (controls[field].el.type === 'checkbox') {
            controls[field].el._initialValue = controls[field].el.checked;
        } else {
            controls[field].el._initialValue = controls[field].el.indeterminate ? 'indeterminate' : controls[field].el.checked;
        }

        controls[field].el.addEventListener('change', function () {
            let val;
            if (this.type === 'checkbox') {
                val = this.checked;
            } else {
                val = this.value;
            }

            if (this._initialValue !== val) {
                onChangedBound(id, field, true, val);
            } else {
                onChangedBound(id, field, false, val);
            }
        });
    }

    return controls;
}

class ObjectCustomEditor extends React.Component {
    constructor(props) {
        super(props);

        let expanded = window.localStorage.getItem('App.customsExpanded') || '[]';
        try {
            expanded = JSON.parse(expanded);
        } catch (e) {
            expanded = [];
        }

        this.state = {
            loaded: false,
            hasChanges: false,
        };

        this.scrollDone = false;
        this.expanded = expanded;
        this.lastExpanded = window.localStorage.getItem('App.customsLastExpanded') || '';
        this.scrollDivRef = React.createRef();

        this.onChangedBound = this.onChange.bind(this);
        this.changedItems = [];

        this.controls = {};
        this.refTemplate = {};
        this.props.customsInstances.map(id => this.refTemplate[id] = React.createRef());

        window.gMain.objects = this.props.objects;
        window.gMain.socket = this.props.socket.getRawSocket();

        window.gMain.showError = this.showError.bind(this);

        this.loadAllPromises = this.loadAllCustoms()
            .then(() => {
                this.commonConfig = this.getCommonConfig();
                this.commonConfig.newValues = {};
                this.setState({ loaded: true });
            });
    }

    loadAllCustoms() {
        const promises = [];
        this.props.customsInstances.forEach(id => {
            const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.');
            if (!GLOBAL_PROMISES[adapter]) {
                GLOBAL_PROMISES[adapter] = this.getCustomTemplate(adapter);
                promises.push(GLOBAL_PROMISES[adapter]);
            }
        });

        return Promise.all(promises)
            .then(() => Promise.all(GLOBAL_PROMISES_ARRAY));
    }

    showError(error) {
        this.setState({ error });
    }

    static getDerivedStateFromProps() {
        return null;
    }

    getCustomTemplate(adapter) {
        //return fetch('./adapter/' + adapter + '/custom_m.html')
        return fetch(URL_PREFIX + '/adapter/' + adapter + '/custom_m.html')
            .catch(err => fetch(URL_PREFIX + '/adapter/' + adapter + '/custom.html'))
            .then(data => data.text())
            .catch(err => {
                console.error('Cannot load template for ' + adapter + ': ' + err);
                return null;
            })
            .then(data => {
                if (data) {
                    let [template, translations] = data.split('<script type="text/javascript">');
                    translations = translations.replace('</script>', '');
                    template = template.replace('<script type="text/x-iobroker" data-template-name="' + adapter + '">', '');
                    template = template.replace('</script>', '');
                    const addTranslations = new Function('systemDictionary', translations + '\nreturn systemDictionary;');
                    try {
                        window.systemDictionary = addTranslations(window.systemDictionary || {});
                    } catch (e) {
                        console.error('Cannot add translations for ' + adapter + ': ' + e);
                    }

                    GLOBAL_TEMPLATES[adapter] = template;
                }
            });
    }

    getCommonConfig () {
        const ids     = this.props.objectIDs || [];
        const objects = this.props.objects;

        const commons = {};
        let type = null;
        let role = null;

        // calculate common settings
        this.props.customsInstances.forEach(inst => {
            commons[inst] = {};
            ids.forEach(id => {
                const custom = objects[id].common.custom;
                const sett   = custom ? custom[inst] : null;

                if (objects[id].common) {
                    if (type === null) {
                        type = objects[id].common.type;
                    } else if (type !== '' && type !== objects[id].common.type) {
                        type = '';
                    }

                    if (role === null) {
                        role = objects[id].common.role;
                    } else if (role !== '' && role !== objects[id].common.role) {
                        role = '';
                    }
                }

                if (sett) {
                    for (const _attr in sett) {
                        if (!sett.hasOwnProperty(_attr)) {
                            continue;
                        }
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] !== sett[_attr]) {
                            commons[inst][_attr] = STR_DIFFERENT;
                        }
                    }
                } else {
                    const adapter = inst.split('.')[0];
                    let _default;
                    // Try to get default values
                    if (window.defaults[adapter]) {
                        if (typeof window.defaults[adapter] === 'function') {
                            _default = window.defaults[adapter](objects[id], objects['system.adapter.' + inst]);
                        } else {
                            _default = window.defaults[adapter];
                        }
                    } else {
                        _default = window.defaults[adapter];
                    }

                    for (const attr in _default) {
                        if (!_default.hasOwnProperty(attr)) continue;
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] !== _default[attr]) {
                            commons[inst][attr] = STR_DIFFERENT;
                        }
                    }
                }
            });
        });

        return {commons, type, role};
    }

    renderOneCustom(id) {
        const adapter = id.replace(/\.\d+$/, '');
        const icon = URL_PREFIX + '/adapter/' + adapter + '/' + this.props.objects['system.adapter.' + id].common.icon;
        const enabled = this.commonConfig.commons[id] && (this.commonConfig.commons[id].enabled === true || this.commonConfig.commons[id].enabled === STR_DIFFERENT);

        // we use style here, because it will be controlled from non-react (vanilaJS) part
        return <ExpansionPanel
            key={ id }
            id={ 'ExpansionPanel_' + id }
            className="expansionDiv"
            defaultExpanded={ this.expanded.includes(id) }
            ref={ this.refTemplate[id] }
            style={ {opacity: enabled ? 1 : 0.6 }}
            onChange={(e, _expanded) => {
                const pos = this.expanded.indexOf(id);
                if (_expanded) {
                    pos === -1 && this.expanded.push(id);
                } else {
                    pos !== -1 && this.expanded.splice(pos, 1);
                }
                window.localStorage.setItem('App.customsExpanded', JSON.stringify(this.expanded));
                _expanded && window.localStorage.setItem('App.customsLastExpanded', id);
            }}
        >
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} data-id={ id }>
                <img src={ icon } className={ this.props.classes.headingIcon } alt="" />
                <Typography className={ this.props.classes.heading }>{ this.props.t('Settings %s', id)}</Typography>
                <div className={ clsx(this.props.classes.titleEnabled, 'titleEnabled') } style={{ display: enabled ? 'display-block' : 'none'} }>{ this.props.t('Enabled') }</div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={ clsx(this.props.classes.simulateM, 'm') } >
                <div className={ this.props.classes.expansionPanelDetailsTabDiv } dangerouslySetInnerHTML={{__html: GLOBAL_TEMPLATES[adapter]}} />
            </ExpansionPanelDetails>
        </ExpansionPanel>;
    }

    isAllOk() {
        let allOk = true;
        Object.keys(this.refTemplate).forEach(id => {
            const adapter = id.replace(/\.\d+$/, '');
            // post init => add custom logic
            if (window.customPostOnSave.hasOwnProperty(adapter) && typeof window.customPostOnSave[adapter] === 'function') {
                // returns true if some problem detected
                if (window.customPostOnSave[adapter](window.$(this), id)) {
                    allOk = false;
                }
            }
        });
        return allOk;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // scroll to last expanded div
        if (!this.scrollDone && this.scrollDivRef.current) {
            const wordDifferent = this.props.t(STR_DIFFERENT);

            Object.keys(this.refTemplate).forEach(id => {
                if (this.refTemplate[id].current && !this.controls[id]) {
                    const adapter = id.replace(/\.\d+$/, '');
                    this.controls[id] = installTemplate(
                        this.refTemplate[id].current,
                        this.props.lang,
                        id,
                        this.commonConfig.commons,
                        wordDifferent,
                        this.onChangedBound
                    );

                    // post init => add custom logic
                    if (window.customPostInits.hasOwnProperty(adapter) && typeof window.customPostInits[adapter] === 'function') {
                        window.customPostInits[adapter](
                            window.$(this.refTemplate[id].current),
                            this.commonConfig.commons[id],
                            this.props.objects['system.adapter.' + id],
                            this.commonConfig.type,
                            this.commonConfig.role,
                            this.props.objectIDs.length > 1 ? false : this.props.objects[this.props.objectIDs[0]] // only if one element
                        );
                    }
                }
            });

            this.scrollDone = true;

            if (this.expanded.length) {
                let item;
                if (this.expanded.includes(this.lastExpanded)) {
                    item = window.document.getElementById('ExpansionPanel_' + this.lastExpanded);
                } else {
                    item = window.document.getElementById('ExpansionPanel_' + this.expanded[0]);
                }
                item && item.scrollIntoView(true);
            }
        }
    }

    renderErrorMessage() {
        return <Dialog
                open={ !!this.state.error }
                onClose={() => this.setState({ error: '' }) }
                aria-labelledby="object-custom-dialog-title"
                aria-describedby="object-custom-dialog-description"
            >
                <DialogTitle id="object-custom-dialog-title">{ this.props.t('Error') }</DialogTitle>
                <DialogContent>
                    <DialogContentText id="object-custom-dialog-description">{ this.state.error }</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ error: '' }) } color="primary" autoFocus>{ this.props.t('Close') }</Button>
                </DialogActions>
            </Dialog>;
    }

    onChange(id, attr, isChanged, value) {
        const key = id + '_' + attr;
        const pos = this.changedItems.indexOf(key);
        if (isChanged) {
            pos === -1 && this.changedItems.push(key);
            this.commonConfig.newValues[id] = this.commonConfig.newValues[id] || {};
            this.commonConfig.newValues[id][attr] = value;
        } else {
            pos !== -1 && this.changedItems.splice(pos, 1);

            if (this.commonConfig.newValues[id] && this.commonConfig.newValues[id][attr] !== undefined) {
                delete this.commonConfig.newValues[id][attr]
            }
            if (!Object.keys(this.commonConfig.newValues[id]).length) {
                delete this.commonConfig.newValues[id];
            }
        }

        if (this.changedItems.length && !this.state.hasChanges) {
            this.setState({ hasChanges: true}, () => this.props.onChange(true));
        } else if (!this.changedItems.length && this.state.hasChanges) {
            this.setState({ hasChanges: false}, () => this.props.onChange(false));
        }
    }

    saveOneState(ids, cb) {
        if (!ids || !ids.length) {
            cb && cb();
        } else {
            const id = ids.shift();
            this.props.socket.getObject(id)
                .then(obj => {
                    const newObj = JSON.parse(JSON.stringify(obj));
                    Object.keys(this.commonConfig.newValues)
                        .forEach(instance => {
                            const adapter = instance.split('.')[0];

                            if (this.commonConfig.newValues[instance].enabled === false) {
                                if (newObj.common.custom && newObj.common.custom[instance]) {
                                    delete newObj.common.custom[instance];
                                }
                            } else if (this.commonConfig.newValues[instance].enabled === true) {
                                newObj.common.custom = newObj.common.custom || {};

                                if (!newObj.common.custom[instance]) {
                                    // provide defaults
                                    let _default;

                                    if (window.defaults[adapter]) {
                                        if (typeof window.defaults[adapter] === 'function') {
                                            _default = window.defaults[adapter](newObj, this.props.objects['system.adapter.' + instance]);
                                        } else {
                                            _default = window.defaults[adapter];
                                        }
                                    }

                                    if (_default) {
                                        newObj.common.custom[instance] = JSON.parse(JSON.stringify(_default));
                                    } else {
                                        newObj.common.custom[instance] = {};
                                    }
                                }

                                newObj.common.custom[instance].enabled = true;

                                Object.keys(this.commonConfig.newValues[instance]).forEach(attr => {
                                    let val = this.commonConfig.newValues[instance][attr];
                                    let f = parseFloat(val);
                                    // replace trailing 0 and prefix +
                                    if (val.toString().replace(/^\+/, '').replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1') === f.toString()) {
                                        val = f;
                                    }

                                    newObj.common.custom[instance][attr] = val;
                                });
                            }
                        });

                    if (JSON.stringify(obj) !== JSON.stringify(newObj)) {
                        return this.props.socket.setObject(id, newObj)
                            .then(() =>
                                setTimeout(() =>
                                    this.saveOneState(ids, cb)));
                    } else {
                        setTimeout(() =>
                            this.saveOneState(ids, cb));
                    }
                });
        }
    }

    onSave() {
        this.saveOneState([...this.props.objectIDs], () => {
            this.changedItems = [];
            this.commonConfig.newValues = {};
            this.setState({ hasChanges: false}, () =>
                this.props.onChange(false));
        });
    }

    render() {
        if (!this.state.loaded) {
            return <LinearProgress />;
        }
        return <Paper className={ this.props.classes.paper }>
            <Toolbar>
                <Button disabled={ !this.state.hasChanges } variant="contained" color="primary" onClick={ () => this.onSave() }>{ this.props.t('Save') }</Button>
            </Toolbar>
            <div className={ this.props.classes.scrollDiv } ref={ this.scrollDivRef }>
                { this.props.customsInstances.map(id =>
                    this.renderOneCustom(id)) }
            </div>
            { this.renderErrorMessage() }
        </Paper>;
    }
}

ObjectCustomEditor.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    customsInstances: PropTypes.array,
    socket: PropTypes.object,
    objectIDs: PropTypes.array,
};

export default withWidth()(withStyles(styles)(ObjectCustomEditor));
