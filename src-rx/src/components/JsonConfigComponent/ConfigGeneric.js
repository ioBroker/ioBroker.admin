import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Grid from '@material-ui/core/Grid';

import IconInfo from '@material-ui/icons/Info';
import IconWarning from '@material-ui/icons/Warning';
import IconError from '@material-ui/icons/Error';

import I18n from '@iobroker/adapter-react/i18n';
import Utils from '@iobroker/adapter-react/Components/Utils';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

class ConfigGeneric extends Component {
    static DIFFERENT_VALUE = '__different__';
    static DIFFERENT_LABEL  = I18n.t('__different__');
    static NONE_VALUE = '';
    static NONE_LABEL  = I18n.t('none');
    static AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

    constructor(props) {
        super(props);

        this.state = {
            confirmDialog: false,
            confirmNewValue: null,
            confirmAttr: null,
            confirmData: null,
        };

        this.isError = {};

        if (this.props.schema) {
            if (this.props.custom) {
                this.defaultValue = this.props.schema.defaultFunc ? this.executeCustom(this.props.schema.defaultFunc, this.props.schema.default, this.props.data, this.props.instanceObj) : this.props.schema.default;
            } else {
                this.defaultValue = this.props.schema.defaultFunc ? this.execute(this.props.schema.defaultFunc, this.props.schema.default, this.props.data) : this.props.schema.default;
            }
        }

        this.lang = I18n.getLanguage();
    }

    componentDidMount() {
        this.props.registerOnForceUpdate && this.props.registerOnForceUpdate(this.props.attr, this.onUpdate);
        const LIKE_SELECT = ['select', 'autocomplete', 'autocompleteSendTo'];
        // init default value
        if (this.defaultValue !== undefined) {
            const value = ConfigGeneric.getValue(this.props.data, this.props.attr);
            if (value === undefined || (LIKE_SELECT.includes(this.props.schema.type) && (value === '' || value === null))) {
                setTimeout(() => {
                    if (this.props.custom) {
                        this.props.onChange(this.props.attr, this.defaultValue, () =>
                            this.props.forceUpdate([this.props.attr], this.props.data));
                        //this.onChange(this.props.attr, this.defaultValue);
                    } else {
                        ConfigGeneric.setValue(this.props.data, this.props.attr, this.defaultValue);
                        this.props.onChange(this.props.data, undefined, () =>
                            this.props.forceUpdate([this.props.attr], this.props.data));
                    }
                }, 100);
            }
        }
    }

    componentWillUnmount() {
        this.props.registerOnForceUpdate && this.props.registerOnForceUpdate(this.props.attr);
    }

    onUpdate = data => {
        const value = ConfigGeneric.getValue(data || this.props.data, this.props.attr) || '';
        if (this.state.value !== value) {
            this.setState({ value });
        } else {
            this.forceUpdate();
        }
    }

    static getValue(data, attr) {
        if (typeof attr === 'string') {
            return ConfigGeneric.getValue(data, attr.split('.'));
        } else {
            if (attr.length === 1) {
                return data[attr[0]];
            } else {
                const part = attr.shift();
                if (typeof data[part] === 'object') {
                    return ConfigGeneric.getValue(data[part], attr);
                } else {
                    return null;
                }
            }
        }
    }

    static setValue(data, attr, value) {
        if (typeof attr === 'string') {
            return ConfigGeneric.setValue(data, attr.split('.'), value);
        } else {
            if (attr.length === 1) {
                if (value === null) {
                    delete data[attr[0]];
                } else {
                    data[attr[0]] = value;
                }
            } else {
                const part = attr.shift();
                if (!data[part] || typeof data[part] === 'object') {
                    data[part] = data[part] || {};
                }
                return ConfigGeneric.setValue(data[part], attr, value);
            }
        }
    }

    getText(text, noTranslation) {
        if (!text) {
            return '';
        }

        if (typeof text === 'string') {
            text = noTranslation ? text : I18n.t(text);
            if (text.includes('${')) {
                return this.getPattern(text);
            } else {
                return text;
            }
        } else if (text && typeof text === 'object') {
            if (text.func) {
                // calculate pattern
                if (typeof text.func === 'object') {
                    return this.getPattern(text.func[this.lang] || text.func.en || '');
                } else {
                    this.getPattern(text.func);
                }
            } else {
                return text[this.lang] || text.en || '';
            }
        }
    }

    renderConfirmDialog() {
        if (!this.state.confirmDialog) {
            return null;
        }
        const confirm = this.state.confirmData || this.props.schema.confirm;
        let icon = null;
        if (confirm.type === 'warning') {
            icon = <IconWarning />;
        } else if (confirm.type === 'error') {
            icon = <IconError />;
        } else if (confirm.type === 'info') {
            icon = <IconInfo />;
        }

        return <ConfirmDialog
            title={ this.getText(confirm.title) || I18n.t('Please confirm') }
            text={ this.getText(confirm.text) }
            ok={ this.getText(confirm.ok) || I18n.t('Ok') }
            cancel={ this.getText(confirm.cancel) || I18n.t('Cancel') }
            icon={icon}
            onClose={isOk =>
                this.setState({ confirmDialog: false}, () => {
                    if (isOk) {
                        const data = JSON.parse(JSON.stringify(this.props.data));
                        if (this.state.confirmDepAttr) {
                            ConfigGeneric.setValue(data, this.state.confirmDepAttr, this.state.confirmDepNewValue);
                        }

                        ConfigGeneric.setValue(data, this.state.confirmAttr, this.state.confirmNewValue);
                        this.setState({confirmDialog: false, confirmDepAttr: null, confirmDepNewValue: null, confirmNewValue: null, confirmAttr: null, confirmOldValue: null, confirmData: null}, () =>
                            this.props.onChange(data));
                    } else {
                        this.setState({confirmDialog: false, confirmDepAttr: null, confirmDepNewValue: null, confirmNewValue: null, confirmAttr: null, confirmOldValue: null, confirmData: null});
                    }
                })
            }
        />;
    }

    onChange(attr, newValue) {
        const data = JSON.parse(JSON.stringify(this.props.data));
        ConfigGeneric.setValue(data, attr, newValue);

        if (this.props.schema.confirm && this.execute(this.props.schema.confirm.condition, false, data)) {
            return this.setState({
                confirmDialog: true,
                confirmNewValue: newValue,
                confirmAttr: attr,
                confirmData: null,
            });
        } else {
            // find any inputs with confirmation
            if (this.props.schema.confirmDependsOn) {
                for (let z = 0; z < this.props.schema.confirmDependsOn.length; z++) {
                    const dep = this.props.schema.confirmDependsOn[z];
                    if (dep.confirm) {
                        const val = ConfigGeneric.getValue(data, dep.attr);

                        if (this.execute(dep.confirm.condition, false, data)) {
                            return this.setState({
                                confirmDialog: true,
                                confirmNewValue: newValue,
                                confirmAttr: attr,
                                confirmDepNewValue: val,
                                confirmDepAttr: dep.attr,
                                confirmData: dep.confirm,
                            });
                        }
                    }
                }
            }

            const changed = [];
            if (this.props.schema.onChangeDependsOn) {
                for (let z = 0; z < this.props.schema.onChangeDependsOn.length; z++) {
                    const dep = this.props.schema.onChangeDependsOn[z];
                    if (dep.onChange) {
                        const val = ConfigGeneric.getValue(data, dep.attr);

                        const newValue = this.props.custom ?
                            this.executeCustom(dep.onChange.calculateFunc, data, this.props.customObj, this.props.instanceObj)
                            :
                            this.execute(dep.onChange.calculateFunc, val, data);

                        if (newValue !== val) {
                            ConfigGeneric.setValue(data, dep.attr, newValue);
                            changed.push(dep.attr);
                        }
                    }
                }
            }

            if (this.props.schema.hiddenDependsOn) {
                for (let z = 0; z < this.props.schema.hiddenDependsOn.length; z++) {
                    const dep = this.props.schema.hiddenDependsOn[z];
                    dep.hidden && changed.push(dep.attr);
                }
            }

            if (this.props.schema.labelDependsOn) {
                for (let z = 0; z < this.props.schema.labelDependsOn.length; z++) {
                    const dep = this.props.schema.labelDependsOn[z];
                    dep.hidden && changed.push(dep.attr);
                }
            }

            if (this.props.schema.helpDependsOn) {
                for (let z = 0; z < this.props.schema.helpDependsOn.length; z++) {
                    const dep = this.props.schema.helpDependsOn[z];
                    dep.hidden && changed.push(dep.attr);
                }
            }

            if (this.props.schema.onChange && !this.props.schema.onChange.ignoreOwnChanges) {
                const val = ConfigGeneric.getValue(data, this.props.attr);

                const newValue = this.props.custom ?
                    this.executeCustom(this.props.schema.onChange.calculateFunc, data, this.props.customObj, this.props.instanceObj)
                    :
                    this.execute(this.props.schema.onChange.calculateFunc, val, data);
                if (newValue !== val) {
                    ConfigGeneric.setValue(data, this.props.attr, newValue);
                }
            }

            if (this.props.custom) {
                this.props.onChange(attr, newValue);

                changed && changed.length && changed.forEach((_attr,  i) =>
                    setTimeout(() => this.props.onChange(_attr, data[_attr]), i * 50));
            } else {
                this.props.onChange(data, undefined, () =>
                    changed.length && this.props.forceUpdate(changed, data));
            }
        }
    }

    execute(func, defaultValue, data) {
        if (func && typeof func === 'object') {
            func = func.func;
        }

        if (!func) {
            return defaultValue;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', 'originalData', '_system', '_alive', '_common', '_socket', func.includes('return') ? func : 'return ' + func);
                const result = f(data || this.props.data, this.props.originalData, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
                // console.log(result);
                return result;
            } catch (e) {
                console.error(`Cannot execute ${func}: ${e}`);
                return defaultValue;
            }
        }
    }

    executeCustom(func, data, customObj, instanceObj) {
        if (func && typeof func === 'object') {
            func = func.func;
        }

        if (!func) {
            return null;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', 'originalData', '_system', 'instanceObj', 'customObj', '_socket', func.includes('return') ? func : 'return ' + func);
                const result = f(data || this.props.data, this.props.originalData, this.props.systemConfig, instanceObj, customObj, this.props.socket);
                console.log(result);
                return result;
            } catch (e) {
                console.error(`Cannot execute ${func}: ${e}`);
                return null;
            }
        }
    }

    calculate(schema) {
        let error;
        let disabled;
        let hidden;
        let defaultValue;

        if (this.props.custom) {
            error        = schema.validator   ? !this.executeCustom(schema.validator,  this.props.data, this.props.customObj, this.props.instanceObj) : false;
            disabled     = schema.disabled    ? this.executeCustom(schema.disabled,    this.props.data, this.props.customObj, this.props.instanceObj) : false;
            hidden       = schema.hidden      ? this.executeCustom(schema.hidden,      this.props.data, this.props.customObj, this.props.instanceObj) : false;
            defaultValue = schema.defaultFunc ? this.executeCustom(schema.defaultFunc, this.props.data, this.props.customObj, this.props.instanceObj) : schema.default;
        } else {
            error        = schema.validator   ? !this.execute(schema.validator,  false)   : false;
            disabled     = schema.disabled    ? this.execute(schema.disabled,    false)   : false;
            hidden       = schema.hidden      ? this.execute(schema.hidden,      false)   : false;
            defaultValue = schema.defaultFunc ? this.execute(schema.defaultFunc, schema.default, this.props.data) : schema.default;
        }

        return {error, disabled, hidden, defaultValue};
    }

    onError(attr, error) {
        if (!error) {
            delete this.isError[attr];
        } else {
            this.isError[attr] = error;
        }

        this.props.onError && this.props.onError(attr, error);
    }

    renderItem(error, disabled, defaultValue) {
        return this.getText(this.props.schema.label) || this.getText(this.props.schema.text)
    }

    renderHelp(text, link, noTranslation) {
        if (!link) {
            text = this.getText(text, noTranslation) || '';
            if (text && text.includes('<a ')) {
                return Utils.renderTextWithA(text);
            } else {
                return text;
            }
        } else {
            return <a
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{color: this.props.themeType === 'dark' ? '#eee' : '#111'}}
            >{this.getText(text, noTranslation)}</a>;
        }
    }

    getPattern(pattern) {
        if (!pattern) {
            return '';
        } else {
            if (typeof pattern === 'object') {
                pattern = pattern.func;
            }

            try {
                if (this.props.custom) {
                    // eslint-disable-next-line no-new-func
                    const f = new Function('data', 'originalData', '_system', 'instanceObj', 'customObj', '_socket', 'return `' + pattern.replace(/`/g, '\\`') + '`');
                    const result = f(this.props.data, this.props.originalData, this.props.systemConfig, this.props.instanceObj,  this.props.customObj, this.props.socket);
                    return result;
                } else {
                    // eslint-disable-next-line no-new-func
                    const f = new Function('data', 'originalData', '_system', '_alive', '_common', '_socket', 'return `' + pattern.replace(/`/g, '\\`') + '`');
                    return f(this.props.data, this.props.originalData, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
                }
            } catch (e) {
                console.error(`Cannot execute ${pattern}: ${e}`);
                return pattern;
            }
        }
    }

    render() {
        const schema = this.props.schema;

        if (!schema) {
            return null;
        }

        const {error, disabled, hidden, defaultValue} = this.calculate(schema);

        if (hidden) {
            // Remove all errors if element is hidden
            if (Object.keys(this.isError).length) {
                setTimeout(isError =>
                    Object.keys(isError).forEach(attr => this.props.onError(attr)),
                    100, JSON.parse(JSON.stringify(this.isError)));
                this.isError = {};
            }

            if (schema.hideOnlyControl) {
                const item = <Grid
                    item
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={Object.assign(
                        {},
                        {marginBottom: 0, /*marginRight: 8, */textAlign: 'left'},
                        schema.style,
                        this.props.themeType === 'dark' ? schema.darkStyle : {}
                    )}
                />;

                if (schema.newLine) {
                    return <>
                        <div style={{flexBasis: '100%', height: 0}} />
                        {item}
                    </>;
                } else {
                    return item;
                }
            } else {
                return null;
            }
        } else {
            // Add error
            if (schema.validatorNoSaveOnError) {
                if (error && !Object.keys(this.isError).length) {
                    this.isError = {[this.props.attr]: schema.validatorErrorText ? I18n.t(schema.validatorErrorText) : true};
                    setTimeout(isError =>
                            Object.keys(isError).forEach(attr => this.props.onError(attr, isError[attr])),
                        100, JSON.parse(JSON.stringify(this.isError)));
                } else if (!error && Object.keys(this.isError).length) {
                    setTimeout(isError =>
                            Object.keys(isError).forEach(attr => this.props.onError(attr)),
                        100, JSON.parse(JSON.stringify(this.isError)));
                    this.isError = {};
                }
            }

            const item = <Grid
                item
                title={this.getText(schema.tooltip)}
                xs={schema.xs || undefined}
                lg={schema.lg || undefined}
                md={schema.md || undefined}
                sm={schema.sm || undefined}
                style={Object.assign({}, {
                    marginBottom: 0,
                    //marginRight: 8,
                    textAlign: 'left',
                    width: schema.type === 'divider' || schema.type === 'header' ? schema.width || '100%' : undefined
                }, schema.style, this.props.themeType === 'dark' ? schema.darkStyle : {})}>
                {this.renderItem(error, disabled || this.props.commandRunning || this.props.disabled, defaultValue)}
            </Grid>;

            if (schema.newLine) {
                return <>
                    <div style={{flexBasis: '100%', height: 0}} />
                    {this.renderConfirmDialog()}
                    {item}
                </>;
            } else {
                if (this.state.confirmDialog) {
                    return <>
                        {this.renderConfirmDialog()}
                        {item}
                    </>;
                } else {
                    return item;
                }
            }
        }
    }
}

ConfigGeneric.propTypes = {
    socket: PropTypes.object.isRequired,
    data: PropTypes.object,
    originalData: PropTypes.object,
    schema: PropTypes.object,
    attr: PropTypes.string,
    value: PropTypes.any,
    themeName: PropTypes.string,
    style: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    customs: PropTypes.object,
    forceUpdate: PropTypes.func.isRequired,
    disabled: PropTypes.bool,

    systemConfig: PropTypes.object,
    alive: PropTypes.bool,
    common: PropTypes.object,
    adapterName: PropTypes.string,
    instance: PropTypes.number,
    dateFormat: PropTypes.string,
    isFloatComma: PropTypes.bool,

    customObj: PropTypes.object,
    instanceObj: PropTypes.object,
    custom: PropTypes.bool,
};

export default ConfigGeneric;
