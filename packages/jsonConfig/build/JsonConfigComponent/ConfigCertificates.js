import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { InputLabel, MenuItem, FormControl, Select, } from '@mui/material';
import ConfigGeneric from './ConfigGeneric';
import I18n from './wrapper/i18n';
const styles = () => ({
    fullWidth: {
        width: '100%',
    },
    leWidth: {
        width: 620,
        marginBottom: 10,
    },
    certWidth: {
        width: 200,
        marginRight: 10,
    },
});
class ConfigCertificates extends ConfigGeneric {
    async componentDidMount() {
        super.componentDidMount();
        const certificates = await this.props.socket.getCertificates();
        const certsPublicOptions = [];
        const certsPrivateOptions = [];
        const certsChainOptions = [];
        let collectionsOptions = await this.props.socket.getObject('system.certificates');
        if (collectionsOptions?.native?.collections) {
            collectionsOptions = Object.keys(collectionsOptions.native.collections);
        }
        else {
            collectionsOptions = null;
        }
        certificates
            .forEach(el => {
            if (el.type === 'public') {
                certsPublicOptions.push({ label: el.name, value: el.name });
            }
            else if (el.type === 'private') {
                certsPrivateOptions.push({ label: el.name, value: el.name });
            }
            else if (el.type === 'chained') {
                certsChainOptions.push({ label: el.name, value: el.name });
            }
            else {
                certsPublicOptions.push({ label: el.name, value: el.name });
                certsPrivateOptions.push({ label: el.name, value: el.name });
                certsChainOptions.push({ label: el.name, value: el.name });
            }
        });
        certsPublicOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
        certsPrivateOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
        certsChainOptions.unshift({ label: I18n.t(ConfigGeneric.NONE_LABEL), value: ConfigGeneric.NONE_VALUE });
        this.setState({
            certsPublicOptions,
            certsChainOptions,
            certsPrivateOptions,
            collectionsOptions,
        });
    }
    renderItem(error, disabled /* , defaultValue */) {
        if (!this.state.certsPublicOptions || !this.state.certsPrivateOptions || !this.state.certsChainOptions) {
            return null;
        }
        const leCollection = (ConfigGeneric.getValue(this.props.data, this.props.schema.leCollectionName || 'leCollection') || 'false').toString();
        const certPublic = ConfigGeneric.getValue(this.props.data, this.props.schema.certPublicName || 'certPublic');
        const certPrivate = ConfigGeneric.getValue(this.props.data, this.props.schema.certPrivateName || 'certPrivate');
        const certChained = ConfigGeneric.getValue(this.props.data, this.props.schema.certChainedName || 'certChained');
        const itemCertPublic = this.state.certsPublicOptions?.find(item => item.value === certPublic);
        const itemCertPrivate = this.state.certsPrivateOptions?.find(item => item.value === certPrivate);
        const itemCertChained = this.state.certsChainOptions?.find(item => item.value === certChained);
        return React.createElement("div", { className: this.props.classes.fullWidth },
            this.state.collectionsOptions ? React.createElement(FormControl, { className: this.props.classes.leWidth, variant: "standard" },
                React.createElement(InputLabel, { shrink: true }, "Let's encrypt"),
                React.createElement(Select, { variant: "standard", error: !!error, displayEmpty: true, disabled: !!disabled, value: leCollection, onChange: e => this.onChange(this.props.schema.leCollectionName || 'leCollection', e.target.value === 'false' ? false : (e.target.value === 'true' ? true : e.target.value)) },
                    React.createElement(MenuItem, { key: "_false", value: "false", style: { fontWeight: 'bold' } }, I18n.t('ra_Do not use let\'s encrypt')),
                    React.createElement(MenuItem, { key: "_true", value: "true", style: { fontWeight: 'bold' } }, I18n.t('ra_Use all available let\'s encrypt certificates')),
                    this.state.collectionsOptions?.map(item => React.createElement(MenuItem, { key: item, value: item }, item)))) : null,
            this.state.collectionsOptions ? React.createElement("br", null) : null,
            this.state.collectionsOptions && leCollection !== 'false' ? React.createElement("div", null, I18n.t('ra_Fallback custom certificates')) : null,
            React.createElement(FormControl, { className: this.props.classes.certWidth, variant: "standard" },
                React.createElement(InputLabel, { shrink: true }, I18n.t('ra_Public certificate')),
                React.createElement(Select, { variant: "standard", error: !!error, displayEmpty: true, disabled: !!disabled, value: certPublic || '', renderValue: () => this.getText(itemCertPublic?.label), onChange: e => this.onChange(this.props.schema.certPublicName || 'certPublic', e.target.value) }, this.state.certsPublicOptions?.map((item, i) => React.createElement(MenuItem, { key: `${item.value}_${i}`, value: item.value, style: item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {} }, this.getText(item.label))))),
            React.createElement(FormControl, { className: this.props.classes.certWidth, variant: "standard" },
                React.createElement(InputLabel, { shrink: true }, I18n.t('ra_Private certificate')),
                React.createElement(Select, { variant: "standard", error: !!error, displayEmpty: true, disabled: !!disabled, value: certPrivate || '', renderValue: () => this.getText(itemCertPrivate?.label), onChange: e => this.onChange(this.props.schema.certPrivateName || 'certPrivate', e.target.value) }, this.state.certsPrivateOptions?.map((item, i) => React.createElement(MenuItem, { key: `${item.value}_${i}`, value: item.value, style: item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {} }, this.getText(item.label))))),
            React.createElement(FormControl, { className: this.props.classes.certWidth, variant: "standard" },
                React.createElement(InputLabel, { shrink: true }, I18n.t('ra_Chained certificate')),
                React.createElement(Select, { variant: "standard", error: !!error, displayEmpty: true, disabled: !!disabled, value: certChained || '', renderValue: () => this.getText(itemCertChained?.label), onChange: e => this.onChange(this.props.schema.certChainedName || 'certChained', e.target.value) }, this.state.certsChainOptions?.map((item, i) => React.createElement(MenuItem, { key: `${item.value}_${i}`, value: item.value, style: item.value === ConfigGeneric.NONE_VALUE ? { opacity: 0.5 } : {} }, this.getText(item.label))))));
    }
}
ConfigCertificates.propTypes = {
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
export default withStyles(styles)(ConfigCertificates);
//# sourceMappingURL=ConfigCertificates.js.map