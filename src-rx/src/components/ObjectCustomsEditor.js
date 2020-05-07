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
    },
    titleEnabled: {
        float: 'right',
        fontSize: 16,
        color: 'green',
        fontWeight: 'bold',
        paddingLeft: 20,
    },
    tabDiv: {
        width: '100%'
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
                if (this.el[i].value === 'checkbox') {
                    return this.el.checked;
                } else {
                    return this.el.value;
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

// simulate jQuery
window.$ = function (el) {
    return new jQ(el);
};

window.$.extend = function (systemDictionary, data) {
    return Object.assign(systemDictionary, data);
};
window.$.get = function (options) {
    const promise = GLOBAL_PROMISES[options.url] =
        fetch('http://localhost:8081/' + options.url)
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
    for (let w = 0; w < words.length; w++) {
        words[w].innerHTML = translateWord(words[w].innerHTML, lang, window.systemDictionary || {});
    }

    const controls = {};
    const inputs = template.getElementsByTagName('input');

    for (let i = 0; i < inputs.length; i++) {
        const field = inputs[i].dataset.field;

        let def = inputs[i].dataset.default;
        if (def !== undefined) {
            if (def === 'true')  def = true;
            if (def === 'false') def = false;
            if (def !== undefined && def.toString().replace(/\+/, '') === parseFloat(def).toString()) {
                def = parseFloat(def);
            }
        }

        controls[field] = {
            default: def,
            el: inputs[i],
            type: inputs[i].type
        };

        if (controls[field].type === 'checkbox') {
            controls[field].el.parentNode.onclick = function (event) {
                const input = this.getElementsByTagName('input')[0];
                input.checked = !input.checked;
                const evt = document.createEvent("HTMLEvents");
                evt.initEvent('change', false, true);
                input.dispatchEvent(evt);
            };
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

class ObjectCustomDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false,
            hasChanges: false,
        };

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
        const url = 'http://localhost:8081'; // '.'
        return fetch(url + '/adapter/' + adapter + '/custom_m.html')
            .catch(err => fetch(url + '/adapter/' + adapter + '/custom.html'))
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

                    // translate all words



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

        // add all tabs to div
        /*for (let j = 0; j < instances.length; j++) {
            // try to find settings
            const parts    = instances[j].split('.');
            const adapter  = parts[2];
            const instance = parts[3];
            const data = adapter + '.' + instance;
            let img = this.objects['system.adapter.' + adapter].common.icon;
            img = '/adapter/' + adapter + '/' + img;
            const tab =
                '<li data-adapter="' + data + '" data-adapterOnly="' + adapter + '" class="custom-config ' + (collapsed.indexOf(data) === -1 ? 'active' : '') + '">' +
                '   <div class="collapsible-header">' +
                '       <img src="' + img + '" alt="picture"/>' + _('Settings for %s', data) +
                '       <span class="activated" data-adapter="' + data + '" style="opacity: ' + (commons[data] && (commons[data].enabled === true || commons[data].enabled === STR_DIFFERENT) ? '1' : '0') + '">' + _('active') + '</span>' +
                '   </div>' +
                '   <div class="customs-settings collapsible-body">' +
                $('script[data-template-name="' + adapter + '"]').html() +
                '   </div>' +
                '</li>';

            const $tab = $(tab);
            this.defaults[adapter] = {};
            // set values
            $tab.find('input, select').each(function() {
                const $this = $(this);
                $this.attr('data-instance', adapter + '.' + instance);
                const field = $this.attr('data-field');
                let def   = $this.attr('data-default');
                if (def === 'true')  def = true;
                if (def === 'false') def = false;
                if (def !== undefined && def.toString().replace(/\+/, '') === parseFloat(def).toString()) {
                    def = parseFloat(def);
                }

                that.defaults[adapter][field] = def;
                if (field === 'enabled') {
                    $this.on('click', function (event) {
                        event.stopPropagation();
                    });
                }
            });

            $customTabs.append($tab);
            // post init => add custom logic
            if (customPostInits.hasOwnProperty(adapter) && typeof customPostInits[adapter] === 'function') {
                customPostInits[adapter](
                    $tab,
                    commons[adapter + '.' + instance],
                    objects['system.adapter.' + adapter + '.' + instance],
                    type,
                    role,
                    ids.length > 1 ? false : objects[ids[id]] // only if one element
                );
            }
        }*/

        // set values
        /* $customTabs.find('input, select').each(function() {
            const $this    = $(this);
            const instance = $this.data('instance');
            const adapter  = instance.split('.')[0];
            const attr     = $this.data('field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') === 'checkbox') {
                    if (commons[instance][attr] === STR_DIFFERENT) {
                        // $('<select data-field="' + attr + '" data-instance="' + instance + '">\n' +
                        //  '   <option value="' + wordDifferent + '" selected>' + wordDifferent + '</option>\n' +
                        //  '   <option value="false">' + _('false') + '</option>\n' +
                        //  '   <option value="true">'  + _('true')  + '</option>\n' +
                        //  '</select>').insertBefore($this);
                        //  $this.hide().attr('data-field', '').data('field', '');
                        $this[0].indeterminate = true;
                    } else {
                        $this.prop('checked', commons[instance][attr]);
                    }
                } else {
                    if (commons[instance][attr] === STR_DIFFERENT) {
                        if ($this.attr('type') === 'number') {
                            $this.attr('type', 'text');
                        }
                        if ($this.prop('tagName').toUpperCase() === 'SELECT'){
                            $this.prepend('<option value="' + wordDifferent + '">' + wordDifferent + '</option>');
                            $this.val(wordDifferent);
                        } else {
                            $this.val('').attr('placeholder', wordDifferent);
                        }
                    } else {
                        $this.val(commons[instance][attr]);
                    }
                }
            } else {
                let def;
                if (window.defaults[adapter] && window.defaults[adapter][attr] !== undefined) {
                    def = that.defaults[adapter][attr];
                }
                if (def !== undefined) {
                    if ($this.attr('type') === 'checkbox') {
                        $this.prop('checked', def);
                    } else {
                        $this.val(def);
                    }
                }
            }

            // if ($this.attr('type') === 'checkbox') {
            //     $this.on('change', function () {
            //         if ($(this).data('field') === 'enabled') {
            //             const instance = $this.data('instance');
            //             const $headerActive = $customTabs.find('.activated[data-adapter="' + instance + '"]');
            //             if ($(this).prop('checked')) {
            //                 $headerActive.css('opacity', 1);
            //             } else {
            //                 $headerActive.css('opacity', 0);
            //             }
            //         }
            //     });
            // } else {
            //     $this.on('change', function () {
            //         that.$dialog.find('.dialog-system-buttons .btn-save').removeClass('disabled');
            //     }).on('keyup', function () {
            //         $(this).trigger('change');
            //     });
            // }
        });*/

        // this.showCustomsData(ids.length > 1 ? null : ids[0]);

        /* that.$dialog.find('input[type="checkbox"]+span').off('click').on('click', function () {
            const $input = $(this).prev();//.addClass('filled-in');
            if (!$input.prop('disabled')) {
                if ($input[0].indeterminate) {
                    $input[0].indeterminate = false;
                    $input.prop('checked', true).trigger('change');
                } else {
                    $input.prop('checked', !$input.prop('checked')).trigger('change');
                }
            }
        });*/

        return {commons, type, role};
    }

    renderOneCustom(id) {
        const adapter = id.replace(/\.\d+$/, '');
        const icon = 'http://localhost:8081/adapter/' + adapter + '/' + this.props.objects['system.adapter.' + id].common.icon;
        const enabled = this.commonConfig.commons[id] && (this.commonConfig.commons[id].enabled === true || this.commonConfig.commons[id].enabled === STR_DIFFERENT);
        return <ExpansionPanel key={ id } className="expansionDiv" ref={ this.refTemplate[id] } style={ {opacity: enabled ? 1 : 0.6 }}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} data-id={ id }>
                <img src={ icon } className={ this.props.classes.headingIcon } alt="" />
                <Typography className={ this.props.classes.heading }>{ this.props.t('Settings %s', id)}</Typography>
                <div className={ clsx(this.props.classes.titleEnabled, 'titleEnabled') } style={{ display: enabled ? 'display-block' : 'none'} }>{ this.props.t('Enabled') }</div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={ clsx(this.props.classes.simulateM, 'm') } >
                <div className={ this.props.classes.tabDiv } dangerouslySetInnerHTML={{__html: GLOBAL_TEMPLATES[adapter]}} />
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
    }

    renderErrorMessage() {
        return <Dialog
                open={ !!this.state.error }
                onClose={() => this.setState({ error: '' }) }
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{ this.props.t('Error') }</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        { this.state.error }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setState({ error: '' }) } color="primary" autoFocus>
                        { this.props.t('Close') }
                    </Button>
                </DialogActions>
            </Dialog>;
    }

    onChange(id, attr, isChanged, value) {
        const key = id + '_' + attr;
        const pos = this.changedItems.indexOf(key);
        if (isChanged) {
            if (pos === -1) {
                this.changedItems.push(key);
            }
        } else {
            if (pos !== -1) {
                this.changedItems.splice(pos, 1);
            }
        }

        if (this.changedItems.length && !this.state.hasChanges) {
            this.setState({ hasChanges: true}, () => this.props.onChange(true));
        } else if (!this.changedItems.length && this.state.hasChanges) {
            this.setState({ hasChanges: false}, () => this.props.onChange(false));
        }
    }

    render() {
        if (!this.state.loaded) {
            return <LinearProgress />;
        }
        return <Paper className={ this.props.classes.paper }>
            <Toolbar>
                <Button disabled={ !this.state.hasChanges } variant="contained" color="primary">{ this.props.t('Save') }</Button>
            </Toolbar>

            { this.props.customsInstances.map(id =>
                this.renderOneCustom(id)) }
            { this.renderErrorMessage() }
        </Paper>;
    }
}

ObjectCustomDialog.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    customsInstances: PropTypes.array,
    socket: PropTypes.object,
    objectIDs: PropTypes.array,
    objectID: PropTypes.string,
};

export default withWidth()(withStyles(styles)(ObjectCustomDialog));
