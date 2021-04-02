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

    constructor(props) {
        super(props);

        this.state = {
            confirmDialog: false,
        };

        this.lang = I18n.getLanguage();
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    getValue(data, attr) {
        if (typeof attr === 'string') {
            return this.getValue(data, attr.split('.'));
        } else {
            if (attr.length === 1) {
                return data[attr[0]];
            } else {
                const part = attr.shift();
                if (typeof data[part] === 'object') {
                    return this.getValue(data[part], attr);
                } else {
                    return null;
                }
            }
        }
    }

    setValue(data, attr, value) {
        if (typeof attr === 'string') {
            return this.setValue(data, attr.split('.'), value);
        } else {
            if (attr.length === 1) {
                data[attr[0]] = value;
            } else {
                const part = attr.shift();
                if (!data[part] || typeof data[part] === 'object') {
                    data[part] = data[part] || {};
                }
                return this.setValue(data[part], attr, value);
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
        let icon = null;
        if (this.props.schema.confirm.type === 'warning') {
            icon = <IconWarning />;
        } else if (this.props.schema.confirm.type === 'error') {
            icon = <IconError />;
        } else if (this.props.schema.confirm.type === 'info') {
            icon = <IconInfo />;
        }

        return <ConfirmDialog
            title={ this.getText(this.props.schema.confirm.title) || I18n.t('Please confirm') }
            text={ this.getText(this.props.schema.confirm.text) }
            ok={ this.getText(this.props.schema.confirm.ok) || I18n.t('Ok') }
            cancel={ this.getText(this.props.schema.confirm.cancel) || I18n.t('Cancel') }
            icon={icon}
            onClose={isOk =>
                this.setState({ confirmDialog: false}, () => {
                    if (isOk) {
                        const data = JSON.parse(JSON.stringify(this.props.data));
                        this.setValue(data, this.state.confirmAttr, this.state.confirmNewValue);
                        this.setState({confirmDialog: false, confirmNewValue: null, confirmAttr: null, confirmOldValue: null}, () =>
                            this.props.onChange(data));
                    } else {
                        this.setState({confirmDialog: false, confirmNewValue: null, confirmAttr: null, confirmOldValue: null});
                    }
                })
            }
        />;
    }

    onChange(attr, newValue) {
        const data = JSON.parse(JSON.stringify(this.props.data));
        this.setValue(data, attr, newValue);
        if (this.props.schema.confirm && this.execute(this.props.schema.confirm.condition, '', false, data)) {
            return this.setState({
                confirmDialog: true,
                confirmNewValue: newValue,
                confirmAttr: attr
            });
        } else {
            this.props.onChange(data);
        }
    }

    execute(func, attr, defaultValue, data) {
        if (!func) {
            return defaultValue;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', '_system', '_alive', '_common', '_socket', func.includes('return') ? func : 'return ' + func);
                return f(data || this.props.data, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
            } catch (e) {
                console.error(`Cannot execute ${func}: ${e}`);
                return defaultValue;
            }
        }
    }

    calculate(schema, attr) {
        const error    = schema.validator ? this.execute(schema.validator, this.props.attr, true) : false;
        const disabled = schema.disabled  ? this.execute(schema.disabled,  this.props.attr, false) : false;
        const hidden   = schema.hidden    ? this.execute(schema.hidden,    this.props.attr, false) : false;

        return {error, disabled, hidden};
    }

    renderItem() {
        return this.getText(this.props.schema.label) || this.getText(this.props.schema.text)
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
        const {error, disabled, hidden} = this.calculate(this.props.schema, this.props.attr);

        if (hidden) {
            return null;
        }

        const schema = this.props.schema;

        const item = <Grid
            item
            title={this.getText(this.props.schema.tooltip)}
            xs={schema.xs || undefined}
            lg={schema.lg || undefined}
            md={schema.md || undefined}
            sm={schema.sm || undefined}

            style={Object.assign({}, {marginBottom: 0, marginRight: 8}, this.props.schema.style)}>
            {this.renderItem(error, disabled)}
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

    systemConfig: PropTypes.object,
    alive: PropTypes.bool,
    common: PropTypes.object,
};

export default ConfigGeneric;