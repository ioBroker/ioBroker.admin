import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { InputLabel, MenuItem, FormControl, Select, FormHelperText, } from '@mui/material';
import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
});
class ConfigCertCollection extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        let collectionsOptions = await this.props.socket.getObject('system.certificates');
        if (collectionsOptions?.native?.collections) {
            collectionsOptions = Object.keys(collectionsOptions.native.collections);
        }
        else {
            collectionsOptions = [];
        }
        this.setState({ collectionsOptions });
    }
    renderItem(error, disabled /* , defaultValue */) {
        if (!this.state.collectionsOptions) {
            return null;
        }
        const leCollection = (ConfigGeneric.getValue(this.props.data, this.props.schema.leCollectionName || 'leCollection') || 'false').toString();
        return React.createElement(FormControl, { className: this.props.classes.fullWidth, variant: "standard" },
            this.props.schema.label ? React.createElement(InputLabel, { shrink: true }, this.getText(this.props.schema.label)) : null,
            React.createElement(Select, { variant: "standard", error: !!error, displayEmpty: true, disabled: !!disabled, value: leCollection, onChange: e => this.onChange(this.props.schema.attr, e.target.value === 'false' ? false : (e.target.value === 'true' ? true : e.target.value)) },
                React.createElement(MenuItem, { key: "_false", value: "false", style: { fontWeight: 'bold' } }, I18n.t('ra_Do not use let\'s encrypt')),
                React.createElement(MenuItem, { key: "_true", value: "true", style: { fontWeight: 'bold' } }, I18n.t('ra_Use all available let\'s encrypt certificates')),
                this.state.collectionsOptions?.map(item => React.createElement(MenuItem, { key: item, value: item }, item))),
            this.props.schema.help ? React.createElement(FormHelperText, null, this.renderHelp(this.props.schema.help, this.props.schema.helpLink, this.props.schema.noTranslation)) : null);
    }
}
ConfigCertCollection.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};
export default withStyles(styles)(ConfigCertCollection);
//# sourceMappingURL=ConfigCertCollection.js.map