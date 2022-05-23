import React, { createRef, Component } from 'react';
import {withStyles} from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import JSON5 from 'json5';

import LinearProgress from '@material-ui/core/LinearProgress';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import Paper from  '@material-ui/core/Paper';
import FormControlLabel from  '@material-ui/core/FormControlLabel';
import Checkbox from  '@material-ui/core/Checkbox';

// Icons
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import DialogError from '@iobroker/adapter-react/Dialogs/Error';
import ConfirmDialog from "@iobroker/adapter-react/Dialogs/Confirm";

import JsonConfigComponent from '../JsonConfigComponent';
import Utils from '../../Utils';

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
    titleEnabled: {
        float: 'right',
        fontSize: 16,
        color: '#7ff57f',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        paddingLeft: 20,
    },
    scrollDiv: {
        width: '100%',
        height: '100%',//`calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        overflow: 'auto',
    },
    fullWidth: {
        width: '100%',
    },
    enabledControl: {
        width: 130,
        display: 'inline-block',
        verticalAlign: 'top',
    },
    customControls: {
        width: 'calc(100% - 130px)',
        maxWidth: 800,
        display: 'inline-block',
        verticalAlign: 'top',
    },

    accordionOdd: {
        //backgroundColor: 'rgba(128, 128, 128, 0.2)'
    },
    accordionEven: {
        backgroundColor: 'rgba(128, 128, 128, 0.1)'
    },

    accordionHeaderOdd: {
        backgroundColor: 'rgba(128, 128, 128, 0.2)'
    },
    accordionHeaderEven: {
        backgroundColor: 'rgba(128, 128, 128, 0.3)'
    },

    accordionHeaderEnabledOdd: {
        backgroundColor: 'rgba(128, 255, 128, 0.2)'
    },
    accordionHeaderEnabledEven: {
        backgroundColor: 'rgba(128, 255, 128, 0.2)'
    },


    enabledVisible: {
        display: 'inline-block'
    },
    enabledInvisible: {
        display: 'none'
    }
});

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

        this.changedIds = [];

        this.state = {
            loaded: false,
            hasChanges: false,
            expanded,
            newValues: {},
            progress: null,
            maxOids: null,
            confirmed: false,
            showConfirmation: false
        };

        this.scrollDone   = false;
        this.lastExpanded = window.localStorage.getItem('App.customsLastExpanded') || '';
        this.scrollDivRef = createRef();

        this.changedItems = [];
        this.jsonConfigs  = {};

        this.controls     = {};
        this.refTemplate  = {};
        this.props.customsInstances.map(id => this.refTemplate[id] = createRef());

        this.customObj    = this.props.objectIDs.length > 1 ? {custom: {}, native: {}} : JSON.parse(JSON.stringify(this.props.objects[this.props.objectIDs[0]] || null));

        if (this.customObj) {
            this.loadAllPromises = this.loadAllCustoms()
                .then(() => {
                    this.commonConfig = this.getCommonConfig();
                    this.setState({ loaded: true, newValues: {} });
                });
        }
    }

    componentDidMount() {
        this.props.registerSaveFunc && this.props.registerSaveFunc(this.onSave);
    }

    componentWillUnmount() {
        this.props.registerSaveFunc && this.props.registerSaveFunc(null);
    }

    loadAllCustoms() {
        const promises = [];
        this.props.customsInstances.forEach(id => {
            const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.', '');
            if (this.jsonConfigs[adapter] === undefined) {
                this.jsonConfigs[adapter] = false;
                promises.push(this.getCustomTemplate(adapter));
            }
        });

        return Promise.all(promises)
            .then(() => {
                this.props.customsInstances.forEach(id => {
                    const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.', '');
                    if (this.jsonConfigs[adapter]) {
                        this.jsonConfigs[adapter].instanceObjs = this.jsonConfigs[adapter].instanceObjs || {};
                        this.jsonConfigs[adapter].instanceObjs[id] = {
                            _id: id,
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
        const ad = this.props.objects['system.adapter.' + adapter] ? JSON.parse(JSON.stringify(this.props.objects['system.adapter.' + adapter])) : null;

        if (!ad) {
            console.error(`Cannot find adapter "${ad}"`);
            return Promise.resolve(null);
        } else {
            Utils.fixAdminUI(ad);

            if (ad.common?.adminUI.custom === 'json') {
                return this.props.socket.fileExists(adapter + '.admin', 'jsonCustom.json5')
                    .then(exist => {
                        if (exist) {
                            return this.props.socket.readFile(adapter + '.admin', 'jsonCustom.json5');
                        } else {
                            return this.props.socket.readFile(adapter + '.admin', 'jsonCustom.json')
                        }
                    })
                    .then(json => {
                        if (json.file !== undefined) {
                            json = json.file;
                        }
                        try {
                            json = JSON5.parse(json);
                            this.jsonConfigs[adapter] = this.jsonConfigs[adapter] || {};
                            this.jsonConfigs[adapter].json = json;
                        } catch (e) {
                            console.error(`Cannot parse jsonConfig of ${adapter}: ${e}`);
                            window.alert(`Cannot parse jsonConfig of ${adapter}: ${e}`);
                        }

                        return JsonConfigComponent.loadI18n(this.props.socket, json.i18n, adapter);
                    })
                    .catch(e => {
                        console.error(`Cannot load jsonConfig of ${adapter}: ${e}`);
                        window.alert(`Cannot load jsonConfig of ${adapter}: ${e}`);
                    });
            } else {
                console.error(`Adapter ${adapter} is not yet supported by this version of admin`);
                window.alert(`Adapter ${adapter} is not yet supported by this version of admin`);
                return Promise.resolve(null);
            }
        }
    }

    // See configGeneric _executeCustom
    _executeCustom(func, data, customObj, instanceObj, items, attr, processed) {
        if (processed.includes(attr)) {
            return undefined;
        }
        processed.push(attr);

        let alsoDependsOn = [];
        if (func && typeof func === 'object') {
            alsoDependsOn = func.alsoDependsOn || [];
            if (typeof alsoDependsOn === 'string') {
                alsoDependsOn = [alsoDependsOn];
            }
            func = func.func;
        }

        alsoDependsOn.forEach(_attr => {
            if (!items[_attr]) {
                return console.error(`[JsonConfigComponent] attribute "${_attr}" does not exist!`);
            } else
            if (!items[_attr].defaultFunc) {
                return console.error(`[JsonConfigComponent] attribute "${_attr}" is not required to be includes in "alsoDependsOn" while has static value!`);
            } else {
                const result = this._executeCustom(items[_attr].defaultFunc, data, customObj, instanceObj, items, _attr, processed);
                if (result !== undefined) {
                    data[_attr] = result;
                }
            }
        });

        if (!func) {
            data[attr] = items[attr].default === undefined ? null: items[attr].default;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', 'originalData', '_system', 'instanceObj', 'customObj', '_socket', func.includes('return') ? func : 'return ' + func);
                const result = f(data || this.props.data, this.props.originalData, this.props.systemConfig, instanceObj, customObj, this.props.socket);
                data[attr] = result;
            } catch (e) {
                console.error(`Cannot execute ${func}: ${e}`);
                data[attr] = !items[attr] || items[attr].default === undefined ? null: items[attr].default;
            }
        }
    }

    static flattenItems(items, _result) {
        _result = _result || {};
        items && Object.keys(items).forEach(attr => {
            if (items[attr].items) {
                ObjectCustomEditor.flattenItems(items[attr].items, _result);
            } else {
                _result[attr] = items[attr];
            }
        });

        return _result;
    }

    getDefaultValues(instance, obj) {
        const defaultValues = {enabled: false};
        const adapter = instance.split('.')[0];

        if (this.jsonConfigs[adapter] && !this.jsonConfigs[adapter].disabled) {
            const items = ObjectCustomEditor.flattenItems(this.jsonConfigs[adapter].json.items);

            if (items) {
                const processed = [];
                const attrs = Object.keys(items).filter(attr => items[attr]);
                // first init simple defaults
                attrs.forEach(attr => {
                    if (!items[attr].defaultFunc && items[attr].default !== undefined) {
                        defaultValues[attr] = items[attr].default;
                    }
                });
                // now init default that must be calculated
                attrs.forEach(async attr => {
                    if (items[attr].defaultFunc) {
                        this._executeCustom(items[attr].defaultFunc, defaultValues, obj, this.jsonConfigs[adapter].instanceObjs[instance], items, attr, processed);
                    }
                });
            }
        }

        return defaultValues;
    }

    getCommonConfig () {
        const ids     = this.props.objectIDs || [];
        const objects = this.props.objects;

        const commons = {};

        // calculate common settings
        this.props.customsInstances.forEach(inst => {
            const adapter = inst.split('.')[0];
            if (this.jsonConfigs[adapter] && this.jsonConfigs[adapter].disabled) {
                return;
            }
            commons[inst] = {};
            ids.forEach(id => {
                const customObj = objects[id];
                const custom = customObj?.common?.custom ? customObj.common.custom[inst] || null : null;

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
                    // const adapter = inst.split('.')[0];
                    // Calculate defaults for this object
                    let _default = this.getDefaultValues(inst, customObj);
                    _default.enabled = false;

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

    isChanged(newValues) {
        newValues = newValues || this.state.newValues;
        return Object.keys(newValues)
            .find(instance => newValues[instance] === null || (newValues[instance] && Object.keys(newValues[instance])
                .find(attr => !attr.startsWith('_'))));
    }

    combineNewAndOld(instance, ignoreUnderscore) {
        const data = Object.assign({}, this.commonConfig[instance] || {}, this.state.newValues[instance] || {});

        if (ignoreUnderscore) {
            Object.keys(data).forEach(attr => {
                if (attr.startsWith('_')) {
                    delete data[attr];
                }
            });
        }

        if (this.state.newValues[instance] === null) {
            data.enabled = false;
        }
        return data;
    }

    renderOneCustom(instance, instanceObj, customObj, i) {
        const adapter = instance.split('.')[0];

        const icon = `${URL_PREFIX}/adapter/${adapter}/${this.props.objects['system.adapter.' + adapter].common.icon}`;
        // could be: true, false, [true, false]
        const enabled = this.state.newValues[instance] !== undefined && (!this.state.newValues[instance] || this.state.newValues[instance].enabled !== undefined) ? !!(this.state.newValues[instance] && this.state.newValues[instance].enabled) : (this.state.newValues[instance] === null ? false : this.commonConfig[instance].enabled);
        const isIndeterminate = Array.isArray(enabled) && (!this.state.newValues[instance] || this.state.newValues[instance].enabled === undefined);

        const disabled = this.jsonConfigs[adapter] && this.jsonConfigs[adapter].json?.disabled;

        const data = this.combineNewAndOld(instance);

        if (disabled && this.jsonConfigs[adapter].json.hidden === true) {
            return null;
        }

        if (typeof this.jsonConfigs[adapter].json.hidden === 'string') {
            // evaluate function
            if (this._executeCustom(this.jsonConfigs[adapter].json.hidden, data, customObj, instanceObj, this.jsonConfigs[adapter].json.items, 'enabled', [])) {
                return null;
            }
        }

        return <Accordion
            key={ instance }
            id={ 'Accordion_' + instance }
            className={i % 2 ? this.props.classes.accordionOdd : this.props.classes.accordionEven}
            expanded={ this.state.expanded.includes(instance) }
            ref={ this.refTemplate[instance] }
            onChange={() => {
                const expanded = [...this.state.expanded];
                const pos = expanded.indexOf(instance);
                if (pos === -1) {
                    expanded.push(instance);
                } else {
                    expanded.splice(pos, 1);
                }
                window.localStorage.setItem('App.customsExpanded', JSON.stringify(expanded));
                pos === -1 && window.localStorage.setItem('App.customsLastExpanded', instance);
                this.setState({expanded});
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} data-id={ instance } className={i % 2 ? (enabled ? this.props.classes.accordionHeaderEnabledOdd : this.props.classes.accordionHeaderOdd) : (enabled ? this.props.classes.accordionHeaderEnabledEven : this.props.classes.accordionHeaderEven)}>
                <img src={ icon } className={ this.props.classes.headingIcon } alt="" />
                <Typography className={ this.props.classes.heading }>{ this.props.t('Settings %s', instance)}</Typography>
                <div className={ clsx(this.props.classes.titleEnabled, 'titleEnabled', enabled ? this.props.classes.enabledVisible : this.props.classes.enabledInvisible) }>{
                    this.props.t('Enabled')
                }</div>
            </AccordionSummary>
            <AccordionDetails >
                <div className={this.props.classes.enabledControl}>
                    <FormControlLabel
                        className={ this.props.classes.formControl }
                        control={<Checkbox
                            indeterminate={ isIndeterminate }
                            checked={ !!enabled }
                            disabled={disabled}
                            onChange={e => {
                                const newValues = JSON.parse(JSON.stringify(this.state.newValues));

                                newValues[instance] = newValues[instance] || {};
                                if (isIndeterminate || e.target.checked) {
                                    newValues[instance].enabled = true;
                                } else {
                                    if (enabled) {
                                        newValues[instance] = null;
                                    } else {
                                        delete newValues[instance];
                                    }
                                }
                                this.setState({newValues, hasChanges: this.isChanged(newValues)}, () =>
                                    this.props.onChange && this.props.onChange(this.state.hasChanges));
                            }}/>}
                        label={this.props.t('Enabled')}
                    />
                </div>
                <div className={this.props.classes.customControls}>
                    {!disabled && (enabled || isIndeterminate) ?
                        <JsonConfigComponent
                            instanceObj={instanceObj}
                            customObj={customObj}
                            custom={true}
                            className={ '' }
                            adapterName={adapter}
                            instance={parseInt(instance.split('.').pop(), 10) || 0}
                            socket={this.props.socket}
                            theme={this.props.theme}
                            themeName={this.props.themeName}
                            themeType={this.props.themeType}
                            multiEdit={this.props.objectIDs.length > 1}

                            schema={this.jsonConfigs[adapter].json}
                            data={data}
                            onError={error =>
                                this.setState({error}, () => this.props.onError && this.props.onError(error))}
                            onValueChange={(attr, value) => {
                                console.log(attr + ' => ' + value);
                                const newValues = JSON.parse(JSON.stringify(this.state.newValues));
                                newValues[instance] = newValues[instance] || {};
                                if (this.commonConfig[instance][attr] === value) {
                                    delete newValues[instance][attr];
                                    if (!Object.keys(newValues[instance]).length) {
                                        delete newValues[instance];
                                    }
                                } else {
                                    newValues[instance][attr] = value;
                                }
                                this.setState({newValues, hasChanges: this.isChanged(newValues)}, () =>
                                    this.props.onChange && this.props.onChange(this.state.hasChanges));
                            }}
                        /> : null}

                    {disabled && this.jsonConfigs[adapter].json.help ?
                        (typeof this.jsonConfigs[adapter].json.help === 'object' ?
                            this.jsonConfigs[adapter].json.help[this.props.lang] ||
                            this.jsonConfigs[adapter].json.help.en
                            :
                            this.props.t(this.jsonConfigs[adapter].json.help)) : null}
                </div>
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
            onClose={() => this.setState({ error: '' })}
        />;
    }

    getObject(objects, oldObjects, id) {
        if (objects[id]) {
            return Promise.resolve(objects[id]);
        } else {
            return this.props.socket.getObject(id)
                .then(obj => {
                    oldObjects[id] = JSON.parse(JSON.stringify(obj));
                    objects[id] = obj;
                    return obj;
                });
        }
    }

    saveOneState(ids, cb, _objects, _oldObjects) {
        _objects    = _objects    || {};
        _oldObjects = _oldObjects || {};

        if (!ids || !ids.length) {
            // save all objects
            const keys = Object.keys(_objects);
            if (!keys.length) {
                this.setState({maxOids: null}, () =>
                    this.props.onProgress(false));
                cb && cb();
            } else {
                this.setState({progress: Math.round(((this.state.maxOids - keys.length) / this.state.maxOids) * 50) + 50});
                const id = keys.shift();
                if (JSON.stringify(_objects[id].common) !== JSON.stringify(_oldObjects[id].common)) {
                    !this.changedIds.includes(id) && this.changedIds.push(id);

                    return this.props.socket.setObject(id, _objects[id])
                        .then(() => {
                            delete _objects[id];
                            delete _oldObjects[id];
                            return this.props.socket.getObject(id)
                                .then(obj => {
                                    this.props.objects[id] = obj;
                                    setTimeout(() =>
                                        this.saveOneState(ids, cb, _objects, _oldObjects), 0);
                                });
                        });
                } else {
                    delete _objects[id];
                    delete _oldObjects[id];
                    return setTimeout(() =>
                        this.saveOneState(ids, cb, _objects, _oldObjects), 0);
                }
            }
        } else {
            const maxOids = this.state.maxOids || ids.length;
            if (this.state.maxOids === null) {
                this.setState({maxOids: ids.length}, () =>
                    this.props.onProgress(true));
            }

            // 0 - 50
            this.setState({progress: Math.round(((maxOids - ids.length) / maxOids) * 50)});

            const id = ids.shift();
            this.getObject(_objects, _oldObjects, id)
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

                    const instances = Object.keys(this.state.newValues);

                    for (let i = 0; i < instances.length; i++) {
                        const instance = instances[i];
                        // const adapter = instance.split('.')[0];
                        const newValues = this.combineNewAndOld(instance, true);

                        if (newValues.enabled === false) {
                            if (obj.common && obj.common.custom && obj.common.custom[instance]) {
                                obj.common.custom[instance] = null; // here must be null and not deleted, so controller can remove it
                            }
                        } else if (newValues.enabled) {
                            obj.common = obj.common || {};
                            if (Array.isArray(newValues.enabled)) {
                                if (!obj.common.custom || !obj.common.custom[instance] || !obj.common.custom[instance].enabled) {
                                    // leave this object disabled
                                    if (obj.common.custom && obj.common.custom[instance]) {
                                        obj.common.custom[instance] = null;
                                    }
                                    continue; // instance disabled
                                }
                            }

                            obj.common.custom = obj.common.custom || {};

                            if (!obj.common.custom[instance] || !obj.common.custom[instance].enabled) {
                                // provide defaults
                                let _default = this.getDefaultValues(instance, obj);
                                obj.common.custom[instance] = JSON.parse(JSON.stringify(_default || {}));
                            }

                            obj.common.custom[instance].enabled = true;

                            Object.keys(newValues).forEach(attr => {
                                // if not different
                                if (!Array.isArray(newValues[attr])) {
                                    obj.common.custom[instance][attr] = newValues[attr];
                                }
                            });
                        }
                    }

                    setTimeout(() =>
                        this.saveOneState(ids, cb, _objects, _oldObjects), 0);
                });
        }
    }

    renderConfirmationDialog() {
        if (!this.state.showConfirmation) {
            return false;
        } else {
            return <ConfirmDialog
                text={this.props.t('The changes will be applied to %s states. Are you sure?', this.props.objectIDs.length)}
                ok={this.props.t('Yes')}
                onClose={result => {
                    if (result) {
                        this.setState({showConfirmation: false, confirmed: true}, () => {
                            const cb = this.cb;
                            this.cb = null;
                            this.onSave(cb);
                        });
                    } else {
                        this.cb = null;
                        this.setState({showConfirmation: false});
                    }
                }}
            />;
        }
    }

    onSave = cb => {
        if (this.props.objectIDs.length > 10 && !this.state.confirmed) {
            this.cb = cb;
            return this.setState({showConfirmation: true});
        }

        this.saveOneState([...this.props.objectIDs], () => {
            this.changedItems = [];
            this.newValues = {};
            this.commonConfig = this.getCommonConfig();
            this.setState({ confirmed: false, hasChanges: false, newValues: {}}, () => {
                this.props.reportChangedIds(this.changedIds);
                this.props.onChange(false, true);
                cb && setTimeout(() => cb(), 100);
            });
        });
    };

    render() {
        if (this.customObj === null) {
            return <div style={{color: '#F55', fontSize: 32}}>{this.props.t('Object does not exist!')}</div>;
        }
        if (!this.state.loaded) {
            return <LinearProgress />;
        }
        let index = 0;

        return <Paper className={ this.props.classes.paper }>
            {this.state.maxOids > 1 && <LinearProgress color="secondary" variant="determinate" value={this.state.progress} />}
            <div className={ this.props.classes.scrollDiv } ref={ this.scrollDivRef }>
                {this.state.maxOids === null && Object.keys(this.jsonConfigs).map(adapter => {
                    if (this.jsonConfigs[adapter]) {
                        return Object.keys(this.jsonConfigs[adapter].instanceObjs)
                            .map(instance =>
                                this.renderOneCustom(instance, this.jsonConfigs[adapter].instanceObjs[instance], this.customObj, index++));
                    } else {
                        return null;
                    }
                })}
            </div>
            { this.renderErrorMessage() }
            { this.renderConfirmationDialog() }
        </Paper>;
    }
}

ObjectCustomEditor.propTypes = {
    t: PropTypes.func,
    onChange: PropTypes.func, // function onChange(haveChanges)
    lang: PropTypes.string,
    expertMode: PropTypes.bool,
    objects: PropTypes.object,
    customsInstances: PropTypes.array,
    socket: PropTypes.object,
    objectIDs: PropTypes.array,
    theme: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    registerSaveFunc: PropTypes.func,
    onProgress: PropTypes.func,
    onError: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ObjectCustomEditor));
