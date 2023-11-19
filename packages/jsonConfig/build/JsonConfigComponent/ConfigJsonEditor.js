import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { FormHelperText, FormControl, Button, } from '@mui/material';
import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';
import CustomModal from '../CustomModal';
import Editor from '../Editor';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
    flex: {
        display: 'flex',
    },
    button: {
        height: 48,
        // marginLeft: 4,
        minWidth: 48,
    },
    wrapper: {
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 188px)',
    },
});
class ConfigJsonEditor extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const { data, attr } = this.props;
        const value = ConfigGeneric.getValue(data, attr) || {};
        this.setState({ value, initialized: true });
    }
    renderItem( /* error, disabled, defaultValue */) {
        if (!this.state.initialized) {
            return null;
        }
        const { classes, schema, data, attr, } = this.props;
        const { value, showSelectId } = this.state;
        return React.createElement(FormControl, { className: classes.fullWidth, variant: "standard" },
            React.createElement("div", { className: classes.flex },
                React.createElement(Button, { color: "grey", className: classes.button, size: "small", variant: "outlined", onClick: () => this.setState({ showSelectId: true }) }, I18n.t('ra_JSON editor'))),
            showSelectId ? React.createElement(CustomModal, { title: this.getText(schema.label), open: showSelectId, overflowHidden: true, onClose: () => this.setState({ showSelectId: false, value: ConfigGeneric.getValue(data, attr) || {} }), onApply: () => this.setState({ showSelectId: false }, () => this.onChange(attr, value)) },
                React.createElement("div", { className: classes.wrapper },
                    React.createElement(Editor, { value: typeof value === 'object' ? JSON.stringify(value) : value, onChange: newValue => this.setState({ value: newValue }), name: "ConfigJsonEditor", themeType: this.props.themeType }))) : null,
            schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
ConfigJsonEditor.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};
export default withStyles(styles)(ConfigJsonEditor);
//# sourceMappingURL=ConfigJsonEditor.js.map