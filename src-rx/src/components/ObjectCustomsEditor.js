import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";
import PropTypes from 'prop-types';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';

import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Paper from  '@material-ui/core/Paper';
import '../assets/materialize.css';

import NoImage from "../assets/no-image.png";
import Utils from "../Utils";

// Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = theme => ({
    dialog: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
    },
    content: {
        textAlign: 'center',
    },
    textarea: {
        width: '100%',
        height: '100%',
    },
    img: {
        width: 'auto',
        height: 'calc(100% - 5px)',
        objectFit: 'contain',
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
        }
        /*'&.m .row .col.l1': {
            width: '8.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l2': {
            width: '16.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l3': {
            width: '25%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l4': {
            width: '33.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l5': {
            width: '41.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l6': {
            width: '50%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l7': {
            width: '58.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l8': {
            width: '66.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l9': {
            width: '75%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l10': {
            width: '83.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l11': {
            width: '91.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.l12': {
            width: '100%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },
        '&.m .row .col.m1': {
            width: '8.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m2': {
            width: '16.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m3': {
            width: '25%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m4': {
            width: '33.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m5': {
            width: '41.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m6': {
            width: '50%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m7': {
            width: '58.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m8': {
            width: '66.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m9': {
            width: '75%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m10': {
            width: '83.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m11': {
            width: '91.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.m12': {
            width: '100%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row:after': {
            content: '',
            display: 'table',
            clear: 'both',
        },

        '&.m .row .col': {
            float: 'left',
            boxSizing: 'border-box',
            padding: '0 .75rem',
            minHeight: 1,
        },

        '&.m .row .col[class*=pull-]': {
            position: 'relative',
        },
        '&.m .row .col[class*=push-]': {
            position: 'relative',
        },

        '&.m .row .col.s1': {
            width: '8.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s2': {
            width: '16.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s3': {
            width: '25%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s4': {
            width: '33.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s5': {
            width: '41.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s6': {
            width: '50%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s7': {
            width: '58.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s8': {
            width: '66.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s9': {
            width: '75%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s10': {
            width: '83.33333%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s11': {
            width: '91.66667%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },

        '&.m .row .col.s12': {
            width: '100%',
            marginLeft: 'auto',
            left: 'auto',
            right: 'auto',
        },*/
    }
});

const STR_DIFFERENT   = '__different__';

const GLOBAL_PROMISES = {};
const GLOBAL_TEMPLATES = {};

// compatibility with admin3
window.defaults = {};
window.systemDictionary = {};

window.$ = {
    extend: (systemDictionary, data) => Object.assign(systemDictionary, data),
    get: options => {
        GLOBAL_PROMISES['http://localhost:8081/' + options.url] =
            fetch(options.url)
                .then(data => data.text())
                .then(data => {
                    try {
                        options.success(data);
                    } catch (e) {

                    }
                });
    }
};
window.gMain = {
    socket: null,
    objects: null,
    showError: error => console.error(error),
    navigateGetParams: () => null,
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

function installTemplate(el, lang, commonConfig) {
    const words = el.getElementsByClassName('translate');
    for (let w = 0; w < words.length; w++) {
        words[w].innerHTML = translateWord(words[w].innerHTML, lang, window.systemDictionary);
    }

    const controls = {};
    const inputs = el.getElementsByTagName('input');

    for (let i = 0; i < inputs.length; i++) {
        const field = inputs[i].dataset.field;

        controls[field] = {
            default: inputs[i].dataset.default,
            el: inputs[i],
            type: inputs[i].type
        };

        if (controls[field].type === 'checkbox') {
            controls[field].el.parentNode.onclick = function () {
                const input = this.getElementsByTagName('input')[0];
                input.checked = !input.checked;
            }
        }
    }
}

class ObjectCustomDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false,
        };

        this.controls = {};
        this.refTemplate = {};
        this.props.customsInstances.map(id => this.refTemplate[id] = React.createRef());

        this.commonConfig = this.getCommonConfig();

        this.loadAllPromises = this.loadAllCustoms()
            .then(() =>
                this.setState({ loaded: true }));
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

        return Promise.all(promises);
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
                        window.systemDictionary = addTranslations(window.systemDictionary);
                    } catch (e) {
                        console.error('Cannot add translations for ' + adapter + ': ' + e);
                    }

                    // translate all words



                    GLOBAL_TEMPLATES[adapter] = template;
                }
            });
    }

    getCommonConfig () {
        const ids = this.props.objectIDs || [];
        this.defaults = {};
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
                    const a = inst.split('.')[0];
                    let _default;
                    // Try to get default values
                    if (window.defaults[a]) {
                        if (typeof window.defaults[a] === 'function') {
                            _default = window.defaults[a](objects[id], objects['system.adapter.' + inst]);
                        } else {
                            _default = window.defaults[a];
                        }
                    } else {
                        _default = window.defaults[a];
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

        return commons;
    }

    renderOneCustom(id) {
        const adapter = id.replace(/\.\d+$/, '');
        const icon = 'http://localhost:8081/adapter/' + adapter + '/' + this.props.objects['system.adapter.' + id].common.icon;
        return <ExpansionPanel key={ id }>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <img src={ icon } className={ this.props.classes.headingIcon } alt="" />
                <Typography className={ this.props.classes.heading }>{ this.props.t('Settings %s', id)}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={ clsx(this.props.classes.simulateM, 'm') } ref={ this.refTemplate[id] }>
                <div dangerouslySetInnerHTML={{__html: GLOBAL_TEMPLATES[adapter]}} />
            </ExpansionPanelDetails>
        </ExpansionPanel>;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        Object.keys(this.refTemplate).forEach(id => {
            if (this.refTemplate[id].current && !this.controls[id]) {
                this.controls[id] = installTemplate(this.refTemplate[id].current, this.props.lang, this.commonConfig);
                // install values
            }
        });
    }

    render() {
        if (!this.state.loaded) {
            return <LinearProgress />;
        }
        return <Paper>
            { this.props.customsInstances.map(id =>
                this.renderOneCustom(id)) }
        </Paper>;
    }
}

ObjectCustomDialog.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    customsInstances: PropTypes.array,
    socket: PropTypes.object,
    objectIDs: PropTypes.array,
    objectID: PropTypes.string,
};

export default withWidth()(withStyles(styles)(ObjectCustomDialog));
