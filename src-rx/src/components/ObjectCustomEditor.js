import React, { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import LinearProgress from '@material-ui/core/LinearProgress';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Paper from  '@material-ui/core/Paper';
import FormControlLabel from  '@material-ui/core/FormControlLabel';
import Checkbox from  '@material-ui/core/Checkbox';

import DialogError from '@iobroker/adapter-react/Dialogs/Error';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import '../assets/materialize.css';

// Icons
import JsonConfigComponent from './JsonConfigComponent';

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
    },
    fullWidth: {
        width: '100%',
    },
    enabledControl: {
        width: 100,
        display: 'inline-block',
        verticalAlign: 'top',
    },
    customControls: {
        width: 'calc(100% - 100px)',
        display: 'inline-block',
        verticalAlign: 'top',
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

const URL_PREFIX = '.'; // or './' or 'http://localhost:8081' for debug

class ObjectCustomEditor extends Component {
    static AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

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
            expanded,
            newValues: {},
        };

        this.scrollDone   = false;
        this.lastExpanded = window.localStorage.getItem('App.customsLastExpanded') || '';
        this.scrollDivRef = createRef();

        this.changedItems = [];
        this.jsonConfigs  = {};

        this.controls     = {};
        this.refTemplate  = {};
        this.props.customsInstances.map(id => this.refTemplate[id] = createRef());

        this.loadAllPromises = this.loadAllCustoms()
            .then(() => {
                this.commonConfig = this.getCommonConfig();
                this.setState({ loaded: true, newValues: {} });
            });
    }

    loadAllCustoms() {
        const promises = [];
        this.props.customsInstances.forEach(id => {
            const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.');
            if (this.jsonConfigs[adapter] === undefined) {
                this.jsonConfigs[adapter] = false;
                promises.push(this.getCustomTemplate(adapter))
            }
        });

        return Promise.all(promises)
            .then(() => {
                this.props.customsInstances.forEach(id => {
                    const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.');
                    if (this.jsonConfigs[adapter]) {
                        this.jsonConfigs[adapter].instanceObjs = this.jsonConfigs[adapter].instanceObjs || {};
                        this.jsonConfigs[adapter].instanceObjs[id] = {
                            common: JSON.parse(JSON.stringify(this.props.objects['system.adapter.' + id]?.common)),
                            native: JSON.parse(JSON.stringify(this.props.objects['system.adapter.' + id]?.native))
                        }
                    }
                });
            });
    }

    showError(error) {
        this.setState({ error });
    }

    getCustomTemplate(adapter) {
        const ad = this.props.objects['system.adapter.' + adapter];
        if (!ad) {
            console.error('Cannot find adapter ' + ad);
            return Promise.resolve(null);
        } else {
            if (ad.common?.jsonCustom) {
                return this.props.socket.readFile(adapter + '.admin', 'jsonCustom.json')
                    .then(json => {
                        try {
                            json = JSON.parse(json);
                            this.jsonConfigs[adapter] = this.jsonConfigs[adapter] || {};
                            this.jsonConfigs[adapter].json = json;
                        } catch (e) {
                            console.error(`Cannot parse jsonConfig of ${adapter}: ${e}`);
                            window.alert(`Cannot parse jsonConfig of ${adapter}: ${e}`);
                        }
                    });
            } else {
                console.error(`Adapter ${adapter} is not yet supported by this version of admin`);
                window.alert(`Adapter ${adapter} is not yet supported by this version of admin`);
                return Promise.resolve(null);
            }
        }

        //return fetch('./adapter/' + adapter + '/custom_m.html')
        /*return fetch(URL_PREFIX + '/adapter/' + adapter + '/custom_m.html')
            .catch(err => fetch(URL_PREFIX + '/adapter/' + adapter + '/custom.html'))
            .then(data => data.text())
            .catch(err => {
                console.error(`Cannot load template for ${adapter}: ${err}`);
                return null;
            })
            .then(data => {
                if (data) {
                    let [template, translations] = data.split('<script type="text/javascript">');
                    if (template) {
                        template = template.replace(`<script type="text/x-iobroker" data-template-name="${adapter}">`, '');
                        template = template.replace('</script>', '');
                    } else {
                        console.error(`Cannot find template for ${adapter}`);
                    }


                    if (translations) {
                        translations = translations.replace('</script>', '');
                        // eslint-disable-next-line
                        const addTranslations = new Function('systemDictionary', translations + '\nreturn systemDictionary;');
                        try {
                            window.systemDictionary = addTranslations(window.systemDictionary || {});
                        } catch (e) {
                            console.error(`Cannot add translations for ${adapter}: ${e}`);
                        }
                    }

                    GLOBAL_TEMPLATES[adapter] = template;
                }
            });*/
    }

    getDefaultValues(adapter, obj) {
        const defaultValues = {enabled: false};

        if (this.jsonConfigs[adapter]) {
            const items = this.jsonConfigs[adapter].json.items;

            items && Object.keys(items).filter(attr => items[attr])
                .forEach(async attr => {
                    if (items[attr].defaultFunc) {
                        const func = items[attr].defaultFunc;
                        try {
                            // eslint-disable-next-line no-new-func
                            const f = new Function('data', '_system', 'customObj', 'instanceObj', '_socket', func.includes('return') ? func : 'return ' + func);
                            defaultValues[attr] = f(defaultValues, this.props.systemConfig, obj, this.jsonConfigs[adapter].instanceObj, this.props.socket);
                        } catch (e) {
                            console.error(`Cannot execute ${func}: ${e}`);
                            defaultValues[attr] = items[attr].default
                        }
                    } else if (attr.default !== undefined) {
                        defaultValues[attr] = items[attr].default;
                    }
                });
        }

        return defaultValues;
    }

    getCommonConfig () {
        const ids     = this.props.objectIDs || [];
        const objects = this.props.objects;

        const commons = {};

        // calculate common settings
        this.props.customsInstances.forEach(inst => {
            const adapter =
            commons[inst] = {};
            ids.forEach(id => {
                const customObj = objects[id];
                const custom = customObj?.common?.custom ? customObj.common.custom[inst] || null : null;

                /*if (customObj.common) {
                    if (type === null) {
                        type = customObj.common.type;
                    } else if (type !== '' && type !== customObj.common.type) {
                        type = '';
                    }

                    if (role === null) {
                        role = objects[id].common.role;
                    } else if (role !== '' && role !== customObj.common.role) {
                        role = '';
                    }
                }*/

                if (custom) {
                    Object.keys(custom).forEach(_attr => {
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = custom[_attr];
                        } else if (commons[inst][_attr] !== custom[_attr]) {
                            // different
                            if (!Array.isArray(commons[inst][_attr])) {
                                commons[inst][_attr] = [commons[inst][_attr]];
                            }

                            !commons[inst][_attr].includes(custom[_attr]) && commons[inst][_attr].push(custom[_attr]);
                        }
                    });
                } else {
                    const adapter = inst.split('.')[0];
                    // Calculate defaults for this object
                    let _default = this.getDefaultValues(adapter, customObj);

                    Object.keys(_default).forEach(_attr => {
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = _default[_attr];
                        } else if (commons[inst][_attr] !== _default[_attr]) {
                            // different
                            if (!Array.isArray(commons[inst][_attr])) {
                                commons[inst][_attr] = [commons[inst][_attr]];
                            }

                            !commons[inst][_attr].includes(_default[_attr]) && commons[inst][_attr].push(_default[_attr]);
                        }
                    });
                }
            });

            // sort all "different" arrays
            Object.keys(commons[inst]).forEach(attr => {
                if (Array.isArray(commons[inst][attr])) {
                    commons[inst][attr].sort();
                }
            });
        });

        return commons;
    }

    isChanged() {
        return !!Object.keys(this.state.newValues).length;
    }

    renderOneCustom(instance, instanceObj) {
        const adapter = instance.split('.')[0];

        const icon = `${URL_PREFIX}/adapter/${adapter}/${this.props.objects['system.adapter.' + adapter].common.icon}`;
        const enabled = this.commonConfig[instance].enabled; // could be true, false or [true, false]
        const isIntermediate = Array.isArray(enabled) && (!this.state.newValues[instance] || this.state.newValues[instance].enabled === undefined);

        return <Accordion
            key={ instance }
            id={ 'Accordion_' + instance }
            defaultExpanded={ this.state.expanded.includes(instance) }
            ref={ this.refTemplate[instance] }
            onChange={(e, _expanded) => {
                const expanded = [...this.state.expanded];
                const pos = expanded.indexOf(instance);
                if (_expanded) {
                    pos === -1 && expanded.push(instance);
                } else {
                    pos !== -1 && expanded.splice(pos, 1);
                }
                window.localStorage.setItem('App.customsExpanded', JSON.stringify(expanded));
                _expanded && window.localStorage.setItem('App.customsLastExpanded', instance);
                this.setState({expanded});
            }}
            >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} data-id={ instance }>
                <img src={ icon } className={ this.props.classes.headingIcon } alt="" />
                <Typography className={ this.props.classes.heading }>{ this.props.t('Settings %s', instance)}</Typography>
                <div className={ clsx(this.props.classes.titleEnabled, 'titleEnabled') } style={{ display: enabled ? 'display-block' : 'none'} }>{ this.props.t('Enabled') }</div>
            </AccordionSummary>
            <AccordionDetails >
                <Paper>
                    <div className={this.props.classes.enabledControl}>
                        <FormControlLabel
                            className={ this.props.classes.formControl }
                            control={<Checkbox
                                intermediate={ isIntermediate.toString() }
                                checked={ this.state.newValues[instance] && this.state.newValues[instance].enabled !== undefined ? this.state.newValues[instance].enabled : (this.state.newValues[instance] === null ? false : this.commonConfig[instance].enabled) }
                                onChange={e => {
                                    this.state.newValues[instance] = this.state.newValues[instance] || {};
                                    if (isIntermediate || e.target.checked) {
                                        this.state.newValues[instance].enabled = true;
                                    } else {
                                        if (enabled) {
                                            this.state.newValues[instance] = null;
                                        } else {
                                            delete this.state.newValues[instance];
                                        }
                                    }
                                    this.setState({hasChanges: this.isChanged()})
                                }}/>}
                            label={this.props.t('Enabled')}
                        />
                    </div>
                    <div className={this.props.classes.customControls}>
                        {enabled || isIntermediate ?
                        <JsonConfigComponent
                            custom={true}
                            className={ '' }
                            socket={this.props.socket}
                            theme={this.props.theme}
                            themeName={this.props.themeName}
                            themeType={this.props.themeType}

                            adapterName={adapter}
                            instance={this.props.instance}

                            schema={this.jsonConfigs[adapter]}
                            common={this.state.common}
                            data={this.state.data}
                            onError={error => this.setState({error})}
                            onChange={(data, changed) => this.setState({data})}
                        /> : null}
                    </div>
                </Paper>
            </AccordionDetails>
        </Accordion>;
    }

    isAllOk() {
        let allOk = true;
        /*Object.keys(this.refTemplate).forEach(id => {
            const adapter = id.replace(/\.\d+$/, '');
            // post init => add custom logic
            if (window.customPostOnSave.hasOwnProperty(adapter) && typeof window.customPostOnSave[adapter] === 'function') {
                // returns true if some problem detected
                if (window.customPostOnSave[adapter](window.$(this), id)) {
                    allOk = false;
                }
            }
        });*/
        return allOk;
    }

    renderErrorMessage() {
        return !!this.state.error && <DialogError
            title={this.props.t('Error')}
            text={this.state.error}
            onClose={this.setState({ error: '' })}
        />;
    }

    onChange = (id, attr, isChanged, value) => {
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
                    if (!obj) {
                        return window.alert(`Invalid object ${id}`);
                    }

                    // remove all disabled commons
                    if (obj.common && obj.common.custom) {
                        Object.keys(obj.common.custom).forEach(ins => {
                            if (!obj.common.custom[ins] || !obj.common.custom[ins].enabled) {
                                obj.common.custom[ins] = null;
                            }
                        });
                    }

                    const newObj = JSON.parse(JSON.stringify(obj));
                    Object.keys(this.state.newValues)
                        .forEach(instance => {
                            const adapter = instance.split('.')[0];

                            if (this.state.newValues[instance].enabled === false) {
                                if (newObj.common && newObj.common.custom && newObj.common.custom[instance]) {
                                    newObj.common.custom[instance] = null; // here must be null and not deleted, so controller can remove it
                                }
                            } else if (this.state.newValues[instance].enabled === true) {
                                newObj.common.custom = newObj.common.custom || {};

                                if (!newObj.common.custom[instance]) {
                                    // provide defaults
                                    let _default = this.getDefaultValues(adapter, newObj);

                                    if (_default) {
                                        newObj.common.custom[instance] = JSON.parse(JSON.stringify(_default));
                                    } else {
                                        newObj.common.custom[instance] = {};
                                    }
                                }

                                newObj.common.custom[instance].enabled = true;

                                Object.keys(this.state.newValues[instance]).forEach(attr => {
                                    let val = this.state.newValues[instance][attr];
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
                                    this.saveOneState(ids, cb)), 0);
                    } else {
                        setTimeout(() =>
                            this.saveOneState(ids, cb), 0);
                    }
                });
        }
    }

    onSave() {
        this.saveOneState([...this.props.objectIDs], () => {
            this.changedItems = [];
            this.commonConfig.newValues = {};
            this.setState({ hasChanges: false, newValues: {}}, () =>
                this.props.onChange(false, true));
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
                {Object.keys(this.jsonConfigs).map(adapter => {
                    if (this.jsonConfigs[adapter]) {
                        return Object.keys(this.jsonConfigs[adapter].instanceObjs)
                            .map(instance =>
                                this.renderOneCustom(instance, this.jsonConfigs[adapter].instanceObjs[instance]));
                    } else {
                        return null;
                    }
                })}
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
    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
};

export default withWidth()(withStyles(styles)(ObjectCustomEditor));
