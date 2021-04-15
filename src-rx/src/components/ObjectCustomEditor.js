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
    titleEnabled: {
        float: 'right',
        fontSize: 16,
        color: 'green',
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
        };

        this.scrollDone   = false;
        this.lastExpanded = window.localStorage.getItem('App.customsLastExpanded') || '';
        this.scrollDivRef = createRef();

        this.changedItems = [];
        this.jsonConfigs  = {};

        this.controls     = {};
        this.refTemplate  = {};
        this.props.customsInstances.map(id => this.refTemplate[id] = createRef());

        this.customObj    = this.props.objectIDs.length > 1 ? {custom: {}, native: {}} : JSON.parse(JSON.stringify(this.props.objects[this.props.objectIDs[0]]));

        this.loadAllPromises = this.loadAllCustoms()
            .then(() => {
                this.commonConfig = this.getCommonConfig();
                this.setState({ loaded: true, newValues: {} });
            });
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
            const adapter = id.replace(/\.\d+$/, '').replace('system.adapter.');
            if (this.jsonConfigs[adapter] === undefined) {
                this.jsonConfigs[adapter] = false;
                promises.push(this.getCustomTemplate(adapter));
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
                debugger
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

    getDefaultValues(instance, obj) {
        const defaultValues = {enabled: false};
        const adapter = instance.split('.')[0];

        if (this.jsonConfigs[adapter]) {
            const items = this.jsonConfigs[adapter].json.items;

            items && Object.keys(items).filter(attr => items[attr])
                .forEach(async attr => {
                    if (items[attr].defaultFunc) {
                        const func = items[attr].defaultFunc;
                        try {
                            // eslint-disable-next-line no-new-func
                            const f = new Function('data', '_system', 'customObj', 'instanceObj', '_socket', func.includes('return') ? func : 'return ' + func);
                            defaultValues[attr] = f(defaultValues, this.props.systemConfig, obj, this.jsonConfigs[adapter].instanceObjs[instance], this.props.socket);
                        } catch (e) {
                            console.error(`Cannot execute ${func}: ${e}`);
                            defaultValues[attr] = items[attr].default
                        }
                    } else if (items[attr].default !== undefined) {
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
        return !!Object.keys(newValues || this.state.newValues).length;
    }

    combineNewAndOld(instance) {
        const data = Object.assign({}, this.commonConfig[instance] || {}, this.state.newValues[instance] || {});
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
                    {enabled || isIndeterminate ?
                        <JsonConfigComponent
                            instanceObj={instanceObj}
                            customObj={customObj}
                            custom={true}
                            className={ '' }
                            socket={this.props.socket}
                            theme={this.props.theme}
                            themeName={this.props.themeName}
                            themeType={this.props.themeType}

                            schema={this.jsonConfigs[adapter].json}
                            data={this.combineNewAndOld(instance)}
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
            onClose={this.setState({ error: '' })}
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
                cb && cb();
            } else {
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
                        const newValues = this.combineNewAndOld(instance);

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

    onSave = () => {
        this.saveOneState([...this.props.objectIDs], () => {
            this.changedItems = [];
            this.newValues = {};
            this.commonConfig = this.getCommonConfig();
            this.setState({ hasChanges: false, newValues: {}}, () => {
                this.props.reportChangedIds(this.changedIds);
                this.props.onChange(false, true);
            });
        });
    };

    render() {
        if (!this.state.loaded) {
            return <LinearProgress />;
        }
        let index = 0;

        return <Paper className={ this.props.classes.paper }>
            <div className={ this.props.classes.scrollDiv } ref={ this.scrollDivRef }>
                {Object.keys(this.jsonConfigs).map(adapter => {
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
    onError: PropTypes.func,
};

export default withWidth()(withStyles(styles)(ObjectCustomEditor));
