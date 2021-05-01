import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Grid from '@material-ui/core/Grid';

import I18n from '@iobroker/adapter-react/i18n';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';
import IconInfo from '@material-ui/icons/Info';
import IconWarning from '@material-ui/icons/Warning';
import IconError from '@material-ui/icons/Error';

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

        this.lang = I18n.getLanguage();
    }

    componentDidMount() {
        this.props.registerOnForceUpdate && this.props.registerOnForceUpdate(this.props.attr, this.onUpdate);
    }

    componentWillUnmount() {
        this.props.registerOnForceUpdate && this.props.registerOnForceUpdate(this.props.attr);
    }

    onUpdate = data => {
        const value = ConfigGeneric.getValue(data || this.props.data, this.props.attr) || '';
        this.setState({ value});
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
                data[attr[0]] = value;
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
            return noTranslation ? text : I18n.t(text);
        } else if (text && typeof text === 'object') {
            return text[this.lang] || text.en || '';
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

    onChange(attr, newValue, counter) {
        counter = counter || 0;
        if (counter > 10) {
            return console.error('Detected cyclic onChange by ' + attr + '!');
        }
        if (this.props.custom) {
            return this.props.onChange(attr, newValue);
        }

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

                        const newValue = this.execute(dep.onChange.calculateFunc, val, data);
                        if (newValue !== val) {
                            ConfigGeneric.setValue(data, dep.attr, newValue);
                            changed.push(dep.attr);
                        }
                    }
                }
            } else if (this.props.onChange && !this.props.onChange.ignoreOwnChanges) {
                const val = ConfigGeneric.getValue(data, this.props.attr);

                const newValue = this.execute(this.props.onChange.calculateFunc, val, data);
                if (newValue !== val) {
                    ConfigGeneric.setValue(data, this.props.attr, newValue);
                }
            }

            this.props.onChange(data, undefined, () =>
                changed.length && this.props.forceUpdate(changed, data));
        }
    }

    execute(func, defaultValue, data) {
        if (!func) {
            return defaultValue;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', '_system', '_alive', '_common', '_socket', func.includes('return') ? func : 'return ' + func);
                const result = f(data || this.props.data, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
                // console.log(result);
                return result;
            } catch (e) {
                console.error(`Cannot execute ${func}: ${e}`);
                return defaultValue;
            }
        }
    }

    executeCustom(func, data, customObj, instanceObj) {
        if (!func) {
            return null;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', '_system', 'instanceObj', 'customObj', '_socket', func.includes('return') ? func : 'return ' + func);
                const result = f(data || this.props.data, this.props.systemConfig, instanceObj, customObj, this.props.socket);
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
            error        = schema.validator   ? !this.executeCustom(schema.validator,  this.props.data, this.props.customObj, this.props.instanceObj)   : false;
            disabled     = schema.disabled    ? this.executeCustom(schema.disabled,    this.props.data, this.props.customObj, this.props.instanceObj)   : false;
            hidden       = schema.hidden      ? this.executeCustom(schema.hidden,      this.props.data, this.props.customObj, this.props.instanceObj)   : false;
            defaultValue = schema.default;
        } else {
            error        = schema.validator   ? !this.execute(schema.validator,  false)   : false;
            disabled     = schema.disabled    ? this.execute(schema.disabled,    false)   : false;
            hidden       = schema.hidden      ? this.execute(schema.hidden,      false)   : false;
            defaultValue = schema.defaultFunc ? this.execute(schema.defaultFunc, schema.default) : schema.default;
        }

        return {error, disabled, hidden, defaultValue};
    }

    onError(attr, error) {
        this.props.onError && this.props.onError(attr, error);
    }

    renderItem(error, disabled, defaultValue) {
        return this.getText(this.props.schema.label) || this.getText(this.props.schema.text)
    }

    renderHelp(text, link, noTranslation) {
        if (!link) {
            return this.getText(text, noTranslation) || '';
        } else {
            return <a href={link} target="_blank" rel="noreferrer">{this.getText(text, noTranslation)}</a>;
        }
    }

    getPattern(pattern) {
        if (!pattern) {
            return '';
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', '_system', '_alive', '_common', '_socket', 'return `' + pattern.replace(/`/g, '\\`') + '`');
                return f(this.props.data, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
            } catch (e) {
                console.error(`Cannot execute ${pattern}: ${e}`);
                return pattern;
            }
        }
    }

    render() {
        const {error, disabled, hidden, defaultValue} = this.calculate(this.props.schema);

        const schema = this.props.schema;

        if (hidden) {
            if (this.props.schema.hideOnlyControl) {
                const item = <Grid
                    item
                    xs={schema.xs || undefined}
                    lg={schema.lg || undefined}
                    md={schema.md || undefined}
                    sm={schema.sm || undefined}
                    style={Object.assign(
                        {},
                        {marginBottom: 0, /*marginRight: 8, */textAlign: 'left'},
                        this.props.schema.style,
                        this.props.themaType === 'dark' ? this.props.schema.darkStyle : {}
                    )}
                />;

                if (schema.newLine) {
                    return <>
                        <div style={{flexBasis: '100%', height: 0}} />
                        {item}
                    </>
                } else {
                    return item;
                }
            } else {
                return null;
            }
        }

        const item = <Grid
            item
            title={this.getText(this.props.schema.tooltip)}
            xs={schema.xs || undefined}
            lg={schema.lg || undefined}
            md={schema.md || undefined}
            sm={schema.sm || undefined}
            style={Object.assign({}, {marginBottom: 0, /*marginRight: 8, */textAlign: 'left'}, this.props.schema.style)}>
            {this.renderItem(error, disabled || this.props.commandRunning, defaultValue)}
        </Grid>;

        if (schema.newLine) {
            return <>
                <div style={{flexBasis: '100%', height: 0}} />
                {this.renderConfirmDialog()}
                {item}
            </>
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

ConfigGeneric.propTypes = {
    socket: PropTypes.object.isRequired,
    data: PropTypes.object,
    schema: PropTypes.object,
    attr: PropTypes.string,
    value: PropTypes.any,
    themeName: PropTypes.string,
    style: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    customs: PropTypes.object,
    forceUpdate: PropTypes.func.isRequired,

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