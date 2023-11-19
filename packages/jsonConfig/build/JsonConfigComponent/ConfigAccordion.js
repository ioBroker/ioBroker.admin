import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { FormHelperText, Accordion, AccordionSummary, AccordionDetails, IconButton, Paper, Toolbar, Tooltip, Typography, } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward as UpIcon, ArrowDownward as DownIcon, ContentCopy as CopyContentIcon, ExpandMore as ExpandMoreIcon, } from '@mui/icons-material';
import I18n from './wrapper/i18n';
import Utils from './wrapper/Components/Utils';
import ConfigGeneric from './ConfigGeneric';
// eslint-disable-next-line import/no-cycle
import ConfigPanel from './ConfigPanel';
const styles = theme => ({
    fullWidth: {
        width: '100%',
    },
    accordionSummary: {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    accordionTitle: {
    // fontWeight: 'bold',
    },
    toolbar: {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        borderRadius: 3,
    },
});
class ConfigAccordion extends ConfigGeneric {
    constructor(props) {
        super(props);
        this.props.schema.items = this.props.schema.items || [];
    }
    async componentDidMount() {
        super.componentDidMount();
        let value = ConfigGeneric.getValue(this.props.data, this.props.attr) || [];
        if (!Array.isArray(value)) {
            value = [];
        }
        this.setState({
            value,
            activeIndex: -1,
            iteration: 0,
        });
    }
    componentWillUnmount() {
        this.typingTimer && clearTimeout(this.typingTimer);
        this.typingTimer = null;
        super.componentWillUnmount();
    }
    itemAccordion(data, idx) {
        const { value } = this.state;
        const { schema } = this.props;
        const schemaItem = {
            items: schema.items.reduce((accumulator, currentValue) => {
                accumulator[currentValue.attr] = currentValue;
                return accumulator;
            }, {}),
            style: { marginLeft: -8, marginTop: 10, marginBottom: 10 },
        };
        return React.createElement(ConfigPanel, { index: idx + this.state.iteration, arrayIndex: idx, changed: this.props.changed, globalData: this.props.data, socket: this.props.socket, adapterName: this.props.adapterName, instance: this.props.instance, common: this.props.common, alive: this.props.alive, themeType: this.props.themeType, themeName: this.props.themeName, data: data, custom: true, schema: schemaItem, systemConfig: this.props.systemConfig, originalData: this.props.originalData, customs: this.props.customs, onChange: (attr, valueChange) => {
                const newObj = JSON.parse(JSON.stringify(value));
                newObj[idx][attr] = valueChange;
                this.setState({ value: newObj }, () => this.onChangeWrapper(newObj, true));
            }, onError: (error, attr) => this.onError(error, attr) });
    }
    onDelete = index => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        newValue.splice(index, 1);
        this.setState({ value: newValue, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    };
    onClone = index => () => {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const cloned = JSON.parse(JSON.stringify(newValue[index]));
        if (typeof this.props.schema.clone === 'string' && typeof cloned[this.props.schema.clone] === 'string') {
            let i = 1;
            let text = cloned[this.props.schema.clone];
            const pattern = text.match(/(\d+)$/);
            if (pattern) {
                text = text.replace(pattern[0], '');
                i = parseInt(pattern[0], 10) + 1;
            }
            else {
                text += '_';
            }
            // eslint-disable-next-line no-loop-func
            while (newValue.find(it => it[this.props.schema.clone] === text + i.toString())) {
                i++;
            }
            cloned[this.props.schema.clone] = `${cloned[this.props.schema.clone]}_${i}`;
        }
        newValue.splice(index, 0, cloned);
        this.setState({ value: newValue, activeIndex: -1, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    };
    onChangeWrapper = newValue => {
        this.typingTimer && clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(value => {
            this.typingTimer = null;
            this.onChange(this.props.attr, value);
        }, 300, newValue);
    };
    onAdd = () => {
        const { schema } = this.props;
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const newItem = schema.items && schema.items.reduce((accumulator, currentValue) => {
            let defaultValue;
            if (currentValue.defaultFunc) {
                if (this.props.custom) {
                    defaultValue = currentValue.defaultFunc ? this.executeCustom(currentValue.defaultFunc, this.props.schema.default, this.props.data, this.props.instanceObj, newValue.length, this.props.data) : this.props.schema.default;
                }
                else {
                    defaultValue = currentValue.defaultFunc ? this.execute(currentValue.defaultFunc, this.props.schema.default, this.props.data, newValue.length, this.props.data) : this.props.schema.default;
                }
            }
            else {
                defaultValue = currentValue.default === undefined ? null : currentValue.default;
            }
            accumulator[currentValue.attr] = defaultValue;
            return accumulator;
        }, {});
        newValue.push(newItem);
        this.setState({ value: newValue, activeIndex: newValue.length - 1 }, () => this.onChangeWrapper(newValue));
    };
    onMoveUp(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx - 1, 0, item);
        const newIndex = this.state.activeIndex - 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }
    onMoveDown(idx) {
        const newValue = JSON.parse(JSON.stringify(this.state.value));
        const item = newValue[idx];
        newValue.splice(idx, 1);
        newValue.splice(idx + 1, 0, item);
        const newIndex = this.state.activeIndex + 1;
        this.setState({ value: newValue, activeIndex: newIndex, iteration: this.state.iteration + 10000 }, () => this.onChangeWrapper(newValue));
    }
    renderItem( /* error, disabled, defaultValue */) {
        const { classes, schema } = this.props;
        const { value } = this.state;
        if (!value) {
            return null;
        }
        return React.createElement(Paper, null,
            schema.label || !schema.noDelete ? React.createElement(Toolbar, { variant: "dense" },
                schema.label ? React.createElement(Typography, { className: classes.title, variant: "h6", id: "tableTitle", component: "div" }, this.getText(schema.label)) : null,
                !schema.noDelete ? React.createElement(IconButton, { size: "small", color: "primary", onClick: this.onAdd },
                    React.createElement(AddIcon, null)) : null) : null,
            value.map((idx, i) => React.createElement(Accordion, { key: `${idx}_${i}`, expanded: this.state.activeIndex === i, onChange: (e, expanded) => { this.setState({ activeIndex: expanded ? i : -1 }); } },
                React.createElement(AccordionSummary, { expandIcon: React.createElement(ExpandMoreIcon, null), className: Utils.clsx(classes.fullWidth, classes.accordionSummary) },
                    React.createElement(Typography, { className: classes.accordionTitle }, idx[schema.titleAttr])),
                React.createElement(AccordionDetails, { style: ({ ...schema.style, ...(this.props.themeType ? schema.darkStyle : {}) }) },
                    this.itemAccordion(value[i], i),
                    React.createElement(Toolbar, { className: classes.toolbar },
                        i ? React.createElement(Tooltip, { title: I18n.t('ra_Move up') },
                            React.createElement(IconButton, { size: "small", onClick: () => this.onMoveUp(i) },
                                React.createElement(UpIcon, null))) : React.createElement("div", { className: classes.buttonEmpty }),
                        i < value.length - 1 ? React.createElement(Tooltip, { title: I18n.t('ra_Move down') },
                            React.createElement(IconButton, { size: "small", onClick: () => this.onMoveDown(i) },
                                React.createElement(DownIcon, null))) : React.createElement("div", { className: classes.buttonEmpty }),
                        !schema.noDelete ? React.createElement(Tooltip, { title: I18n.t('ra_Delete current row') },
                            React.createElement(IconButton, { size: "small", onClick: this.onDelete(i) },
                                React.createElement(DeleteIcon, null))) : null,
                        schema.clone ? React.createElement(Tooltip, { title: I18n.t('ra_Clone current row') },
                            React.createElement(IconButton, { size: "small", onClick: this.onClone(i) },
                                React.createElement(CopyContentIcon, null))) : null)))),
            !schema.noDelete && value.length > 0 ? React.createElement(Toolbar, { variant: "dense", className: classes.rootTool },
                React.createElement(IconButton, { size: "small", color: "primary", onClick: this.onAdd },
                    React.createElement(AddIcon, null))) : null,
            schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
ConfigAccordion.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
    changed: PropTypes.bool,
};
export default withStyles(styles)(ConfigAccordion);
//# sourceMappingURL=ConfigAccordion.js.map