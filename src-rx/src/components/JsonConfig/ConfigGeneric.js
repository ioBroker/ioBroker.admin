import { Component } from 'react';
import PropTypes from 'prop-types';

import Grid from '@material-ui/core/Grid';

import I18n from '@iobroker/adapter-react/i18n';

class ConfigGeneric extends Component {
    constructor(props) {
        super(props);

        this.state = {};

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

    onChange(attr, newValue) {
        const data = JSON.parse(JSON.stringify(this.props.data));
        this.setValue(data, attr, newValue);
        this.props.onChange(data);
    }

    execute(func, attr, defaultValue) {
        if (!func) {
            return defaultValue;
        } else {
            try {
                // eslint-disable-next-line no-new-func
                const f = new Function('data', '_system', '_alive', '_common', '_socket', func.includes('return') ? func : 'return ' + func);
                return f(this.props.data, this.props.systemConfig, this.props.alive, this.props.common, this.props.socket);
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

    render() {
        const {error, disabled, hidden} = this.calculate(this.props.schema, this.props.attr);

        if (hidden) {
            return null;
        }

        const schema = this.props.schema;

        const item = <Grid
            item
            title={this.getText(this.props.schema.tooltip)}
            className={this.props.classes.row}
            xs={schema.xs || undefined}
            lg={schema.lg || undefined}
            md={schema.md || undefined}
            sm={schema.sm || undefined}
            spacing={schema.spacing || 8}
            style={Object.assign({}, {marginBottom: 12, marginRight: 8}, this.props.schema.style)}>
            {this.renderItem(error, disabled)}
        </Grid>;

        if (schema.newLine) {
            return <Grid container>
                {item}
            </Grid>
        } else {
            return item;
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